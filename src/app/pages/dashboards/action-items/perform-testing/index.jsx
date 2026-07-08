// Import Dependencies
import {
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFacetedMinMaxValues,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import clsx from "clsx";
import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import axios from "utils/axios";
import { createColumnHelper } from "@tanstack/react-table";

// Local Imports
import ReactSelect from "react-select";
import { Table, Card, THead, TBody, Th, Tr, Td } from "components/ui";
import { TableSortIcon } from "components/shared/table/TableSortIcon";
import { Page } from "components/shared/Page";
import { useLockScrollbar, useDidUpdate, useLocalStorage } from "hooks";
import { fuzzyFilter } from "utils/react-table/fuzzyFilter";
import { useSkipper } from "utils/react-table/useSkipper";
import { Toolbar } from "./Toolbar";
import { PaginationSection } from "components/shared/table/PaginationSection";
import { SelectedRowsActions } from "./SelectedRowsActions";
import { useThemeContext } from "app/contexts/theme/context";
import { getUserAgentBrowser } from "utils/dom/getUserAgentBrowser";

// ----------------------------------------------------------------------

const isSafari = getUserAgentBrowser() === "Safari";
const columnHelper = createColumnHelper();

// PHP: if(!in_array(7, $permissions)) header("location:index.php");
function usePermissions() {
  const p = localStorage.getItem("userPermissions");
  try {
    return JSON.parse(p) || [];
  } catch {
    return p?.split(",").map(Number) || [];
  }
}

// ── "Perform Test" button → navigates to detail page ─────────────────────────
// PHP: href="performtest.php?hakuna={id}"
function PerformTestRowActions({ row }) {
  return (
    <Link
      to={`/dashboards/action-items/perform-testing/${row.original.id}`}
      className="inline-block rounded bg-primary-600 px-4 py-1.5 text-xs font-semibold text-white shadow transition hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-400"
    >
      Perform Test
    </Link>
  );
}

// ── Column definitions (mirrors PHP $oary & table headers) ───────────────────
// PHP headers: ID | Product | LRN | Brand/Source | Grade/Size |
//              Long Term Test | Tentative Report Date (INTERIM) |
//              Tentative Report Date (LONGTERM) | Tentative Report Date | Action
const performTestColumns = [
  columnHelper.accessor("id", {
    id: "id",
    header: "ID",
    cell: (info) => (
      <span className="text-sm text-gray-800 dark:text-dark-100">
        {info.getValue()}
      </span>
    ),
  }),
  columnHelper.accessor("product", {
    id: "product",
    header: "Product",
    cell: (info) => (
      <span className="block max-w-[240px] whitespace-normal leading-tight text-sm text-gray-800 dark:text-dark-100">
        {info.getValue() ?? "—"}
      </span>
    ),
  }),
  columnHelper.accessor("lrn", {
    id: "lrn",
    header: "LRN",
    cell: (info) => info.getValue() ?? "—",
  }),
  columnHelper.accessor("brand", {
    // PHP: trfProducts.brand
    id: "brand",
    header: "Brand/Source",
    cell: (info) => (
      <span className="block max-w-[240px] whitespace-normal leading-tight text-sm text-gray-800 dark:text-dark-100">
        {info.getValue() || "-"}
      </span>
    ),
  }),
  columnHelper.accessor((row) => `${row.grade ?? "NA"}/${row.size ?? "NA"}`, {
    // PHP: grades.name + "/" + sizes.name
    id: "grade_size",
    header: "Grade/Size",
    cell: (info) => (
      <span className="block max-w-[240px] whitespace-normal leading-tight text-sm text-gray-800 dark:text-dark-100">
        {info.getValue()}
      </span>
    ),
  }),
  columnHelper.accessor("longTermTest", {
    // PHP: trfProducts.longTermTest
    id: "longTermTest",
    header: () => <div className="text-center leading-tight">Long Term <br /> Test</div>,
    cell: (info) => <div className="text-center">{info.getValue() ?? "—"}</div>,
  }),
  columnHelper.accessor("interim_yes", {
    // PHP: trfProducts.interim_yes → Tentative Report Date (INTERIM)
    id: "interim_yes",
    header: () => <div className="text-center leading-tight">Tentative <br /> Report Date <br /> (INTERIM)</div>,
    cell: (info) => {
      const val = info.getValue();
      let formatted = "—";
      if (val) {
        const parts = String(val).split("-");
        if (parts.length === 3) {
          formatted = `${parts[2]}-${parts[1]}-${parts[0]}`;
        } else {
          formatted = val;
        }
      }
      return <div className="text-center">{formatted}</div>;
    },
  }),
  columnHelper.accessor("longterm", {
    // PHP: trfProducts.longterm → Tentative Report Date (LONGTERM)
    id: "longterm",
    header: () => <div className="text-center leading-tight">Tentative <br /> Report Date <br /> (LONGTERM)</div>,
    cell: (info) => {
      const val = info.getValue();
      let formatted = "—";
      if (val) {
        const parts = String(val).split("-");
        if (parts.length === 3) {
          formatted = `${parts[2]}-${parts[1]}-${parts[0]}`;
        } else {
          formatted = val;
        }
      }
      return <div className="text-center">{formatted}</div>;
    },
  }),
  columnHelper.accessor("interim_no", {
    // PHP: trfProducts.interim_no → Tentative Report Date
    id: "interim_no",
    header: () => <div className="text-center leading-tight">Tentative <br /> Report Date</div>,
    cell: (info) => {
      const val = info.getValue();
      let formatted = "—";
      if (val) {
        const parts = String(val).split("-");
        if (parts.length === 3) {
          formatted = `${parts[2]}-${parts[1]}-${parts[0]}`;
        } else {
          formatted = val;
        }
      }
      return <div className="text-center">{formatted}</div>;
    },
  }),
  columnHelper.display({
    // PHP: permission check in_array(7, $permissions) → show "Perform Test" button
    id: "action",
    header: "Action",
    cell: PerformTestRowActions,
  }),
];

// ── Main Component ────────────────────────────────────────────────────────────
export default function PerformTest() {
  const { cardSkin } = useThemeContext();
  const permissions = usePermissions();

  // ── State Management (All hooks must be called before any conditional returns) ──
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState([]);

  // ── Filters ────────────────────────────────────────────────────────────────
  // PHP: startdate, enddate, department
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [department, setDepartment] = useState("");
  const [globalFilter, setGlobalFilter] = useState("");

  // ── Table setup ──────────────────────────
  const [tableSettings] = useState({
    enableFullScreen: false,
    enableRowDense: false,
  });

  const [sorting, setSorting] = useState([{ id: "id", desc: true }]); // PHP: order by id desc
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const [columnVisibility, setColumnVisibility] = useLocalStorage(
    "column-visibility-perform-test-1",
    {}
  );
  const [columnPinning, setColumnPinning] = useLocalStorage(
    "column-pinning-perform-test-1",
    {}
  );

  const [autoResetPageIndex, skipAutoResetPageIndex] = useSkipper();

  // ── Effects and Callbacks ────────────────────────────────────────────────────
  // ── Fetch Dropdowns (Departments/Labs) ───────────────────────────────────
  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const res = await axios.get("/actionitem/get-labs-by-department-wise");
        const d = res.data?.data ?? res.data?.Data ?? res.data ?? [];
        setDepartments(Array.isArray(d) ? d : []);
      } catch (err) {
        console.error("Error fetching departments:", err);
        setDepartments([]);
      }
    };
    fetchDropdowns();
  }, []);

  // ── Fetch list — GET /actionitem/get-perform-testing ─────────────────────
  // PHP: performmytestsData.php → filters by employeeid + status=24 or status=0
  //      + trfProducts.status != 99
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);

      const params = {};
      if (startDate) params.startdate = startDate;
      if (endDate) params.enddate = endDate;
      if (department) params.department = department;
      if (globalFilter) params.search = globalFilter;

      const res = await axios.get("/actionitem/get-perform-testing", { params });
      const d = res.data?.data ?? res.data?.Data ?? res.data ?? [];
      setProducts(Array.isArray(d) ? d : []);
    } catch (err) {
      console.error("Error fetching perform test list:", err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, department, globalFilter]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // ── Table Configuration ────────────────────────────────────────────────────────
  const table = useReactTable({
    data: products,
    columns: performTestColumns,
    state: {
      globalFilter,
      sorting,
      columnVisibility,
      columnPinning,
      tableSettings,
      pagination,
    },
    meta: {
      updateData: (rowIndex, columnId, value) => {
        skipAutoResetPageIndex();
        setProducts((old) =>
          old.map((row, index) =>
            index === rowIndex ? { ...old[rowIndex], [columnId]: value } : row
          )
        );
      },
    },

    filterFns: {
      fuzzy: fuzzyFilter,
    },
    enableSorting: tableSettings.enableSorting,
    enableColumnFilters: true,
    getCoreRowModel: getCoreRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
    globalFilterFn: "includesString",
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),

    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: () => true,

    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnPinningChange: setColumnPinning,

    autoResetPageIndex,
  });

  useDidUpdate(() => table.resetRowSelection(), [products]);
  useLockScrollbar(tableSettings.enableFullScreen);

  // ── Permission Check (Now after all hooks are called) ────────────────────────
  // PHP: if(!in_array(7, $permissions)) header("location:index.php");
  if (!permissions.includes(7)) {
    return (
      <Page title="Perform Test">
        <div className="flex h-60 items-center justify-center rounded-xl border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-sm font-medium text-red-600 dark:text-red-400">
            Access Denied - Permission 7 required
          </p>
        </div>
      </Page>
    );
  }

  if (loading) {
    return (
      <Page title="Perform Test">
        <div className="flex h-[60vh] items-center justify-center gap-3 text-gray-500">
          <svg
            className="h-5 w-5 animate-spin text-blue-600"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z"
            />
          </svg>
          Loading...
        </div>
      </Page>
    );
  }

  return (
    <Page title="Perform Test">
      <div className="transition-content w-full pb-5">
        <div
          className={clsx(
            "flex h-full w-full flex-col",
            tableSettings.enableFullScreen &&
            "fixed inset-0 z-61 bg-white pt-3 dark:bg-dark-900"
          )}
        >
          <Toolbar table={table} />

          <div
            className={clsx(
              "transition-content flex grow flex-col pt-3",
              tableSettings.enableFullScreen
                ? "overflow-hidden"
                : "px-[var(--margin-x)]"
            )}
          >
            {/* ── Filters ───────────────────────────────────────────────────── */}
            <div className="mb-4 flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
              {/* Start Date */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Start Date:
                </label>
                <input
                  type="date"
                  className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              {/* End Date */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  End Date:
                </label>
                <input
                  type="date"
                  className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              {/* Department */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Department:
                </label>
                <ReactSelect
                  value={
                    departments.find((dep) => String(dep.id) === department)
                      ? {
                        value: department,
                        label: departments.find(
                          (dep) => String(dep.id) === department
                        ).name,
                      }
                      : null
                  }
                  onChange={(selectedOption) =>
                    setDepartment(selectedOption ? selectedOption.value : "")
                  }
                  options={departments.map((dep) => ({
                    value: String(dep.id),
                    label: dep.name,
                  }))}
                  placeholder="Select Department"
                  isClearable
                  className="min-w-[220px]"
                  styles={{
                    control: (base) => ({
                      ...base,
                      borderRadius: "8px",
                      fontSize: "0.875rem",
                    }),
                  }}
                />
              </div>

              {/* Clear Filters */}
              <button
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                  setDepartment("");
                  setGlobalFilter("");
                }}
                className="inline-flex h-[38px] items-center rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-600 transition hover:bg-gray-50 hover:text-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
              >
                Reset
              </button>
            </div>
            <Card
              className={clsx(
                "relative flex grow flex-col",
                tableSettings.enableFullScreen && "overflow-hidden"
              )}
            >
              <div className="table-wrapper min-w-full grow overflow-x-auto">
                <Table
                  hoverable
                  dense={tableSettings.enableRowDense}
                  sticky={tableSettings.enableFullScreen}
                  className="w-full text-left rtl:text-right"
                >
                  <THead>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <Tr key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <Th
                            key={header.id}
                            className={clsx(
                              "bg-gray-200 font-semibold uppercase text-gray-800 dark:bg-dark-800 dark:text-dark-100 first:ltr:rounded-tl-lg last:ltr:rounded-tr-lg first:rtl:rounded-tr-lg last:rtl:rounded-tl-lg",
                              header.column.getCanPin() && [
                                header.column.getIsPinned() === "left" &&
                                "sticky z-2 ltr:left-0 rtl:right-0",
                                header.column.getIsPinned() === "right" &&
                                "sticky z-2 ltr:right-0 rtl:left-0",
                              ]
                            )}
                          >
                            {header.column.getCanSort() ? (
                              <div
                                className="flex cursor-pointer select-none items-center space-x-3"
                                onClick={header.column.getToggleSortingHandler()}
                              >
                                <span className="flex-1">
                                  {header.isPlaceholder
                                    ? null
                                    : flexRender(
                                      header.column.columnDef.header,
                                      header.getContext()
                                    )}
                                </span>
                                <TableSortIcon
                                  sorted={header.column.getIsSorted()}
                                />
                              </div>
                            ) : header.isPlaceholder ? null : (
                              flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )
                            )}
                          </Th>
                        ))}
                      </Tr>
                    ))}
                  </THead>
                  <TBody>
                    {table.getRowModel().rows.length === 0 ? (
                      <Tr>
                        <Td
                          colSpan={99}
                          className="py-12 text-center text-sm text-gray-400"
                        >
                          No items found.
                        </Td>
                      </Tr>
                    ) : (
                      table.getRowModel().rows.map((row) => (
                        <Tr
                          key={row.id}
                          className={clsx(
                            "relative border-y border-transparent border-b-gray-300 dark:border-b-dark-600",
                            row.getIsSelected() &&
                            !isSafari &&
                            "row-selected after:pointer-events-none after:absolute after:inset-0 after:z-2 after:h-full after:w-full after:border-3 after:border-transparent after:bg-primary-500/10 ltr:after:border-l-primary-500 rtl:after:border-r-primary-500"
                          )}
                        >
                          {row.getVisibleCells().map((cell) => (
                            <Td
                              key={cell.id}
                              className={clsx(
                                "relative bg-white align-top px-4 py-3",
                                cardSkin === "shadow"
                                  ? "dark:bg-dark-700"
                                  : "dark:bg-dark-900",
                                cell.column.getCanPin() && [
                                  cell.column.getIsPinned() === "left" &&
                                  "sticky z-2 ltr:left-0 rtl:right-0",
                                  cell.column.getIsPinned() === "right" &&
                                  "sticky z-2 ltr:right-0 rtl:left-0",
                                ]
                              )}
                            >
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
                              )}
                            </Td>
                          ))}
                        </Tr>
                      ))
                    )}
                  </TBody>
                </Table>
              </div>
              <SelectedRowsActions table={table} />
              {table.getCoreRowModel().rows.length > 0 && (
                <div
                  className={clsx(
                    "px-4 pb-4 sm:px-5 sm:pt-4",
                    tableSettings.enableFullScreen &&
                    "bg-gray-50 dark:bg-dark-800",
                    !(
                      table.getIsSomeRowsSelected() ||
                      table.getIsAllRowsSelected()
                    ) && "pt-4"
                  )}
                >
                  <PaginationSection table={table} />
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </Page>
  );
}