// index.jsx — Unbilled Testing Items
// Route: /dashboards/accounts/calibration-unbilled-items
// Pattern: exact same as PaymentList (tanstack table, Toolbar, PaginationSection)
// PHP logic port:
//   invBrnArray  → billed BRNs from invoices
//   trfBrnArray  → unbilled from trfProducts (invoice null/empty)
//   cross-match  → remove billed from trf list → final unbilled list

import {
  flexRender,
  getCoreRowModel,
  getFacetedMinMaxValues,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import clsx from "clsx";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import axios from "utils/axios";
import { toast } from "sonner";

// Local Imports
import { Table, Card, THead, TBody, Th, Tr, Td } from "components/ui";
import { TableSortIcon } from "components/shared/table/TableSortIcon";
import { Page } from "components/shared/Page";
import { useLockScrollbar, useDidUpdate, useLocalStorage } from "hooks";
import { fuzzyFilter } from "utils/react-table/fuzzyFilter";
import { useSkipper } from "utils/react-table/useSkipper";
import { PaginationSection } from "components/shared/table/PaginationSection";
import { useThemeContext } from "app/contexts/theme/context";
import { getUserAgentBrowser } from "utils/dom/getUserAgentBrowser";
import { Toolbar } from "./Toolbar";
import { columns } from "./columns";

// ----------------------------------------------------------------------

const isSafari = getUserAgentBrowser() === "Safari";

// ── PHP BRN cross-match (frontend fallback) ───────────────────────────────
// PHP: foreach $invBrnArray → array_search($brnno, $trfBrnColumn) → unset
// React: Set-based O(1) filter
function applyPhpBrnFilter(trfList, invBrnList) {
  if (!invBrnList || invBrnList.length === 0) return trfList;
  const invSet = new Set(invBrnList.map((b) => String(b).trim()));
  return trfList.filter((row) => !invSet.has(String(row.brn).trim()));
}

// ── Spinner ───────────────────────────────────────────────────────────────
function PageSpinner() {
  return (
    <Page title="Unbilled Testing Items">
      <div className="flex h-[60vh] items-center justify-center text-gray-600">
        <svg
          className="mr-2 h-6 w-6 animate-spin text-blue-600"
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

// ── Main Page ─────────────────────────────────────────────────────────────
export default function UnbilledTestingItems() {
  const { cardSkin } = useThemeContext();
  const navigate = useNavigate();
  const permissions = JSON.parse(localStorage.getItem("userPermissions") || "[]");

  useEffect(() => {
    if (!permissions.includes(143)) {
      navigate("/dashboards");
    }
  }, [navigate, permissions]);

  const [items, setItems] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [bdList, setBdList] = useState([]);
  const [loading, setLoading] = useState(false); // false = no auto-load on mount
  const [dropdownLoading, setDropdownLoading] = useState(true);
  const [searched, setSearched] = useState(false);

  // ── Filter state ──────────────────────────────────────────────────────
  const [filters, setFilters] = useState({
    startdate: "",
    enddate: "",
    customerid: "",
    bd: "",
  });

  // ── Load dropdowns on mount ───────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const [custRes, bdRes] = await Promise.all([
          axios.get("/people/get-all-customers"),
          axios.get("/people/get-customer-bd"),
        ]);
        setCustomers(custRes.data.data ?? custRes.data ?? []);
        setBdList(bdRes.data.data ?? bdRes.data ?? []);
      } catch {
        toast.error("Failed to load filter options");
      } finally {
        setDropdownLoading(false);
      }
    };
    load();
  }, []);

  // ── Fetch unbilled items — called on Search click ─────────────────────
  // PHP: if (!empty($search)) → run queries else "Search Parameter Required"
  const fetchItems = async (f = filters) => {
    if (!f.startdate || !f.enddate) {
      toast.error("Start Date and End Date both are required");
      return;
    }
    try {
      setLoading(true);
      const params = new URLSearchParams({
        startdate: f.startdate,
        enddate: f.enddate,
      });
      if (f.customerid) params.set("customerid", f.customerid);
      if (f.bd) params.set("bd", f.bd);

      const res = await axios.get(
        `/accounts/testing-unbilled-item?${params.toString()}`,
      );
      const rawList = res.data.data ?? res.data ?? [];

      // PHP frontend BRN cross-match fallback
      // (if backend already filtered, invBrns will be [] → no-op)
      const invBrns = res.data.invBrns ?? [];
      const finalList = applyPhpBrnFilter(rawList, invBrns);

      setItems(finalList);
      setSearched(true);
      if (finalList.length === 0) toast.info("Unbilled item not found");
    } catch (err) {
      console.error(err);
      toast.error("Error while fetching data");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => fetchItems(filters);

  // ── Table settings ────────────────────────────────────────────────────
  const [tableSettings, setTableSettings] = useState({
    enableFullScreen: false,
    enableRowDense: false,
  });

  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState([{ id: "id", desc: true }]);

  const [columnVisibility, setColumnVisibility] = useLocalStorage(
    "column-visibility-unbilled-testing",
    {},
  );
  const [columnPinning, setColumnPinning] = useLocalStorage(
    "column-pinning-unbilled-testing",
    {},
  );

  const [autoResetPageIndex, skipAutoResetPageIndex] = useSkipper();

  const table = useReactTable({
    data: items,
    columns,
    state: {
      globalFilter,
      sorting,
      columnVisibility,
      columnPinning,
      tableSettings,
    },
    meta: {
      setTableSettings,
      updateData: (rowIndex, columnId, value) => {
        skipAutoResetPageIndex();
        setItems((old) =>
          old.map((row, index) =>
            index === rowIndex ? { ...old[rowIndex], [columnId]: value } : row,
          ),
        );
      },
    },
    filterFns: { fuzzy: fuzzyFilter },
    enableSorting: tableSettings.enableSorting,
    enableColumnFilters: tableSettings.enableColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
    globalFilterFn: fuzzyFilter,
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onColumnPinningChange: setColumnPinning,
    autoResetPageIndex,
  });

  useDidUpdate(() => table.resetRowSelection(), [items]);
  useLockScrollbar(tableSettings.enableFullScreen);

  // ── Loading spinner (while searching) ────────────────────────────────
  if (loading || dropdownLoading) return <PageSpinner />;

  // ── Summary counts ────────────────────────────────────────────────────
  const pendingCount = items.filter(
    (r) =>
      !r.invoice || r.invoice === "" || r.invoice === "0" || r.invoice === 0,
  ).length;
  const billedCount = items.length - pendingCount;

  return (
    <Page title="Unbilled Testing Items">
      <div className="transition-content w-full pb-5">
        <div
          className={clsx(
            "flex h-full w-full flex-col",
            tableSettings.enableFullScreen &&
            "dark:bg-dark-900 fixed inset-0 z-61 bg-white pt-3",
          )}
        >
          {/* Toolbar with filters */}
          <Toolbar
            table={table}
            filters={filters}
            setFilters={setFilters}
            customers={customers}
            bdList={bdList}
            onSearch={handleSearch}
          />

          <div
            className={clsx(
              "transition-content flex grow flex-col pt-3",
              tableSettings.enableFullScreen
                ? "overflow-hidden"
                : "px-[var(--margin-x)]",
            )}
          >
            {/* Summary pills — shown after first search */}
            {searched && items.length > 0 && (
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="dark:bg-dark-700 dark:text-dark-200 rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
                  Total: <span className="font-bold">{items.length}</span>
                </span>
                <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
                  Pending: <span className="font-bold">{pendingCount}</span>
                </span>
                <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  Billed: <span className="font-bold">{billedCount}</span>
                </span>
              </div>
            )}

            <Card
              className={clsx(
                "relative flex grow flex-col",
                tableSettings.enableFullScreen && "overflow-hidden",
              )}
            >
              {/* Empty / initial state */}
              {!searched ? (
                <div className="flex flex-col items-center justify-center gap-2 py-16">
                  <span className="text-4xl">🔍</span>
                  <p className="dark:text-dark-300 font-medium text-gray-600">
                    Select filters and Search
                  </p>
                  <p className="dark:text-dark-500 text-sm text-gray-400">
                    Start Date and End Date required
                  </p>
                </div>
              ) : searched && items.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-16">
                  <span className="text-4xl">📋</span>
                  <p className="dark:text-dark-300 font-medium text-gray-600">
                    Unbilled item not found
                  </p>
                  <p className="dark:text-dark-500 text-sm text-gray-400">
                    Adjust Filters and try again
                  </p>
                </div>
              ) : (
                <>
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
                                  "dark:bg-dark-800 dark:text-dark-100 bg-gray-200 font-semibold text-gray-800 uppercase first:ltr:rounded-tl-lg last:ltr:rounded-tr-lg first:rtl:rounded-tr-lg last:rtl:rounded-tl-lg",
                                  header.column.getCanPin() && [
                                    header.column.getIsPinned() === "left" &&
                                    "sticky z-2 ltr:left-0 rtl:right-0",
                                    header.column.getIsPinned() === "right" &&
                                    "sticky z-2 ltr:right-0 rtl:left-0",
                                  ],
                                )}
                              >
                                {header.column.getCanSort() ? (
                                  <div
                                    className="flex cursor-pointer items-center space-x-3 select-none"
                                    onClick={header.column.getToggleSortingHandler()}
                                  >
                                    <span className="flex-1">
                                      {header.isPlaceholder
                                        ? null
                                        : flexRender(
                                          header.column.columnDef.header,
                                          header.getContext(),
                                        )}
                                    </span>
                                    <TableSortIcon
                                      sorted={header.column.getIsSorted()}
                                    />
                                  </div>
                                ) : header.isPlaceholder ? null : (
                                  flexRender(
                                    header.column.columnDef.header,
                                    header.getContext(),
                                  )
                                )}
                              </Th>
                            ))}
                          </Tr>
                        ))}
                      </THead>

                      <TBody>
                        {table.getRowModel().rows.map((row) => (
                          <Tr
                            key={row.id}
                            className={clsx(
                              "dark:border-b-dark-500 relative border-y border-transparent border-b-gray-200",
                              row.getIsSelected() &&
                              !isSafari &&
                              "row-selected after:bg-primary-500/10 ltr:after:border-l-primary-500 rtl:after:border-r-primary-500 after:pointer-events-none after:absolute after:inset-0 after:z-2 after:h-full after:w-full after:border-3 after:border-transparent",
                            )}
                          >
                            {row.getVisibleCells().map((cell) => (
                              <Td
                                key={cell.id}
                                className={clsx(
                                  "relative bg-white",
                                  cardSkin === "shadow"
                                    ? "dark:bg-dark-700"
                                    : "dark:bg-dark-900",
                                  cell.column.getCanPin() && [
                                    cell.column.getIsPinned() === "left" &&
                                    "sticky z-2 ltr:left-0 rtl:right-0",
                                    cell.column.getIsPinned() === "right" &&
                                    "sticky z-2 ltr:right-0 rtl:left-0",
                                  ],
                                )}
                              >
                                {cell.column.getIsPinned() && (
                                  <div
                                    className={clsx(
                                      "dark:border-dark-500 pointer-events-none absolute inset-0 border-gray-200",
                                      cell.column.getIsPinned() === "left"
                                        ? "ltr:border-r rtl:border-l"
                                        : "ltr:border-l rtl:border-r",
                                    )}
                                  />
                                )}
                                {flexRender(
                                  cell.column.columnDef.cell,
                                  cell.getContext(),
                                )}
                              </Td>
                            ))}
                          </Tr>
                        ))}
                      </TBody>
                    </Table>
                  </div>

                  {/* Pagination — same as PaymentList */}
                  {table.getCoreRowModel().rows.length > 0 && (
                    <div
                      className={clsx(
                        "px-4 pb-4 sm:px-5 sm:pt-4",
                        tableSettings.enableFullScreen &&
                        "dark:bg-dark-800 bg-gray-50",
                        !(
                          table.getIsSomeRowsSelected() ||
                          table.getIsAllRowsSelected()
                        ) && "pt-4",
                      )}
                    >
                      <PaginationSection table={table} />
                    </div>
                  )}
                </>
              )}
            </Card>
          </div>
        </div>
      </div>
    </Page>
  );
}
