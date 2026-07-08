// Import Dependencies
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
import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router";
import axios from "utils/axios";
import Select from "react-select";

// Local Imports
import { Table, Card, THead, TBody, Th, Tr, Td } from "components/ui";
import { TableSortIcon } from "components/shared/table/TableSortIcon";
import { Page } from "components/shared/Page";
import { useLockScrollbar, useDidUpdate, useLocalStorage } from "hooks";
import { fuzzyFilter } from "utils/react-table/fuzzyFilter";
import { useSkipper } from "utils/react-table/useSkipper";
import { Toolbar } from "./Toolbar";
import { columns } from "./columns.jsx";
import { PaginationSection } from "components/shared/table/PaginationSection";
import { SelectedRowsActions } from "./SelectedRowsActions";
import { useThemeContext } from "app/contexts/theme/context";
import { getUserAgentBrowser } from "utils/dom/getUserAgentBrowser";

// ----------------------------------------------------------------------

const isSafari = getUserAgentBrowser() === "Safari";

// PHP: if(!in_array(6, $permissions)) → redirect
function getPermissions() {
  const p = localStorage.getItem("userPermissions");
  try {
    return JSON.parse(p) || [];
  } catch {
    return p?.split(",").map(Number) || [];
  }
}

const customSelectStyles = {
  control: (base, state) => ({
    ...base,
    minHeight: "42px",
    minWidth: "200px",
    borderColor: state.isFocused ? "#3b82f6" : "#d1d5db",
    boxShadow: state.isFocused ? "0 0 0 2px rgba(59, 130, 246, 0.5)" : "none",
    "&:hover": {
      borderColor: "#3b82f6",
    },
  }),
  menu: (base) => ({
    ...base,
    zIndex: 9999,
  }),
  menuPortal: (base) => ({
    ...base,
    zIndex: 9999,
  }),
};

const customSelectStylesDepartment = {
  control: (base, state) => ({
    ...base,
    minHeight: "42px",
    minWidth: "300px",
    borderColor: state.isFocused ? "#3b82f6" : "#d1d5db",
    boxShadow: state.isFocused ? "0 0 0 2px rgba(59, 130, 246, 0.5)" : "none",
    "&:hover": {
      borderColor: "#3b82f6",
    },
  }),
  menu: (base) => ({
    ...base,
    zIndex: 9999,
    minWidth: "400px",
  }),
  menuPortal: (base) => ({
    ...base,
    zIndex: 9999,
  }),
};

const getLatestFirstProducts = (items) => {
  return [...items].sort((a, b) => {
    const aCreatedAt = Number(a?.created_at) || 0;
    const bCreatedAt = Number(b?.created_at) || 0;

    if (aCreatedAt !== bCreatedAt) {
      return bCreatedAt - aCreatedAt;
    }

    return Number(b?.id) - Number(a?.id);
  });
};

export default function AssignChemist() {
  const { cardSkin } = useThemeContext();
  const navigate = useNavigate();
  const permissions = useMemo(() => getPermissions(), []);
  const canAccessPage = permissions.includes(6);
  const canViewCustomerType = permissions.includes(389);
  const canViewSpecificPurpose = permissions.includes(390);

  useEffect(() => {
    if (!canAccessPage) {
      navigate("/dashboards");
    }
  }, [canAccessPage, navigate]);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customerTypes, setCustomerTypes] = useState([]);
  const [specificPurposes, setSpecificPurposes] = useState([]);
  const [departments, setDepartments] = useState([]);

  // Filters
  const [ctype, setCtype] = useState("");
  const [specificpurpose, setSpecificpurpose] = useState("");
  const [department, setDepartment] = useState("");

  // ── Fetch dropdowns ───────────────────────────────────────────────────────
  useEffect(() => {
    const fetchDropdowns = async () => {
      if (!canAccessPage) return;

      // Customer Types — permission 389
      if (canViewCustomerType) {
        try {
          const res = await axios.get("/people/get-customer-type-list");
          const d = res.data?.Data ?? res.data?.data ?? res.data ?? [];
          setCustomerTypes(Array.isArray(d) ? d : []);
        } catch { setCustomerTypes([]); }
      }

      // Specific Purposes — permission 390
      if (canViewSpecificPurpose) {
        try {
          const res = await axios.get("/people/get-specific-purpose-list");
          const d = res.data?.data ?? res.data?.Data ?? res.data ?? [];
          setSpecificPurposes(Array.isArray(d) ? d : []);
        } catch { setSpecificPurposes([]); }
      }

      // Departments — PHP: labs where status=1 (filtered by employeedepartment if no perm 346)
      try {
        const res = await axios.get("/actionitem/get-labs-by-department-wise");
        const d = res.data?.data ?? res.data?.Data ?? res.data ?? [];
        setDepartments(Array.isArray(d) ? d : []);
      } catch { setDepartments([]); }
    };
    fetchDropdowns();
  }, [canAccessPage, canViewCustomerType, canViewSpecificPurpose]);

  // ── Fetch table data ──────────────────────────────────────────────────────
  const fetchProducts = useCallback(async () => {
    try {
      if (!canAccessPage) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const params = new URLSearchParams();
      params.append("status", "1"); // Match PHP: $sstring="?status=1"
      if (canViewCustomerType && ctype) params.append("ctype", ctype);
      if (canViewSpecificPurpose && specificpurpose) {
        params.append("specificpurpose", specificpurpose);
      }
      if (department) params.append("department", department);

      const response = await axios.get(
        `/actionitem/get-assign-chemists?${params.toString()}`
      );

      if (response.data && Array.isArray(response.data)) {
        setProducts(getLatestFirstProducts(response.data));
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        setProducts(getLatestFirstProducts(response.data.data));
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.error("Error fetching assign chemist list:", err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [
    canAccessPage,
    canViewCustomerType,
    canViewSpecificPurpose,
    ctype,
    specificpurpose,
    department,
  ]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // ── Table setup ───────────────────────────────────────────────────────────
  const [tableSettings, setTableSettings] = useState({
    enableFullScreen: false,
    enableRowDense: false,
  });

  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState([]);

  const [columnVisibility, setColumnVisibility] = useLocalStorage(
    "column-visibility-assign-chemist-1", {}
  );
  const [columnPinning, setColumnPinning] = useLocalStorage(
    "column-pinning-assign-chemist-1", {}
  );

  const [autoResetPageIndex, skipAutoResetPageIndex] = useSkipper();

  const permittedColumns = useMemo(
    () =>
      columns.filter((column) => {
        if (column.id === "customer_type") return canViewCustomerType;
        if (column.id === "specific_purpose") return canViewSpecificPurpose;
        return true;
      }),
    [canViewCustomerType, canViewSpecificPurpose],
  );

  const table = useReactTable({
    data: products,
    columns: permittedColumns,
    state: { globalFilter, sorting, columnVisibility, columnPinning, tableSettings },
    meta: {
      updateData: (rowIndex, columnId, value) => {
        skipAutoResetPageIndex();
        setProducts((old) =>
          old.map((row, index) =>
            index === rowIndex ? { ...old[rowIndex], [columnId]: value } : row
          )
        );
      },
      deleteRow: (row) => {
        skipAutoResetPageIndex();
        setProducts((old) => old.filter((r) => r.id !== row.original.id));
      },
      deleteRows: (rows) => {
        skipAutoResetPageIndex();
        const ids = rows.map((r) => r.original.id);
        setProducts((old) => old.filter((r) => !ids.includes(r.id)));
      },
      setTableSettings,
      refreshData: fetchProducts,
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

  useDidUpdate(() => table.resetRowSelection(), [products]);
  useLockScrollbar(tableSettings.enableFullScreen);

  if (!canAccessPage) {
    return null;
  }

  if (loading) {
    return (
      <Page title="Assign Chemist">
        <div className="flex h-[60vh] items-center justify-center gap-3 text-gray-500">
          <svg className="h-5 w-5 animate-spin text-blue-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z" />
          </svg>
          Loading...
        </div>
      </Page>
    );
  }

  return (
    <Page title="Assign Chemist">
      <div className="transition-content w-full pb-5">
        <div
          className={clsx(
            "flex h-full w-full flex-col",
            tableSettings.enableFullScreen &&
            "fixed inset-0 z-61 bg-white pt-3 dark:bg-dark-900",
          )}
        >
          <Toolbar table={table} />

          <div
            className={clsx(
              "transition-content flex grow flex-col pt-3",
              tableSettings.enableFullScreen ? "overflow-hidden" : "px-[var(--margin-x)]",
            )}
          >
            {/* ── Filters — PHP: ctype(389), specificpurpose(390), department ── */}
            <div className="mb-4 flex flex-wrap items-end gap-4 rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">

              {/* Customer Type — perm 389 */}
              {canViewCustomerType && (
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Customer type:
                  </label>
                  <Select
                    value={customerTypes.find(ct => ct.id === ctype) ? { value: ctype, label: customerTypes.find(ct => ct.id === ctype).name } : null}
                    onChange={(selectedOption) => setCtype(selectedOption ? selectedOption.value : "")}
                    options={customerTypes.map(ct => ({ value: ct.id, label: ct.name }))}
                    placeholder="Select Customer Type"
                    isClearable
                    styles={customSelectStyles}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                  />
                </div>
              )}

              {/* Specific Purpose — perm 390 */}
              {canViewSpecificPurpose && (
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Specific Purpose:
                  </label>
                  <Select
                    value={specificPurposes.find(sp => sp.id === specificpurpose) ? { value: specificpurpose, label: specificPurposes.find(sp => sp.id === specificpurpose).name } : null}
                    onChange={(selectedOption) => setSpecificpurpose(selectedOption ? selectedOption.value : "")}
                    options={specificPurposes.map(sp => ({ value: sp.id, label: sp.name }))}
                    placeholder="Select Specific purpose"
                    isClearable
                    styles={customSelectStyles}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                  />
                </div>
              )}

              {/* Department — PHP: labs where status=1 */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Department:
                </label>
                <Select
                  value={departments.find(dep => dep.id === department) ? { value: department, label: departments.find(dep => dep.id === department).name } : null}
                  onChange={(selectedOption) => setDepartment(selectedOption ? selectedOption.value : "")}
                  options={departments.map(dep => ({ value: dep.id, label: dep.name }))}
                  placeholder="Select"
                  isClearable
                  styles={customSelectStylesDepartment}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                />
              </div>

              <button
                onClick={() => { setCtype(""); setSpecificpurpose(""); setDepartment(""); }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                Clear Filters
              </button>
            </div>

            <Card
              className={clsx(
                "relative flex grow flex-col",
                tableSettings.enableFullScreen && "overflow-hidden",
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
                                header.column.getIsPinned() === "left" && "sticky z-2 ltr:left-0 rtl:right-0",
                                header.column.getIsPinned() === "right" && "sticky z-2 ltr:right-0 rtl:left-0",
                              ],
                            )}
                          >
                            {header.column.getCanSort() ? (
                              <div
                                className="flex cursor-pointer select-none items-center space-x-3"
                                onClick={header.column.getToggleSortingHandler()}
                              >
                                <span className="flex-1">
                                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                </span>
                                <TableSortIcon sorted={header.column.getIsSorted()} />
                              </div>
                            ) : header.isPlaceholder ? null : (
                              flexRender(header.column.columnDef.header, header.getContext())
                            )}
                          </Th>
                        ))}
                      </Tr>
                    ))}
                  </THead>
                  <TBody>
                    {table.getRowModel().rows.length === 0 ? (
                      <Tr>
                        <Td colSpan={99} className="py-12 text-center text-sm text-gray-400">
                          No items found.
                        </Td>
                      </Tr>
                    ) : (
                      table.getRowModel().rows.map((row) => (
                        <Tr
                          key={row.id}
                          className={clsx(
                            "relative border-y border-transparent border-b-gray-200 dark:border-b-dark-500",
                            row.getIsSelected() && !isSafari &&
                            "row-selected after:pointer-events-none after:absolute after:inset-0 after:z-2 after:h-full after:w-full after:border-3 after:border-transparent after:bg-primary-500/10 ltr:after:border-l-primary-500 rtl:after:border-r-primary-500",
                          )}
                        >
                          {row.getVisibleCells().map((cell) => (
                            <Td
                              key={cell.id}
                              className={clsx(
                                "relative bg-white",
                                cardSkin === "shadow" ? "dark:bg-dark-700" : "dark:bg-dark-900",
                                cell.column.getCanPin() && [
                                  cell.column.getIsPinned() === "left" && "sticky z-2 ltr:left-0 rtl:right-0",
                                  cell.column.getIsPinned() === "right" && "sticky z-2 ltr:right-0 rtl:left-0",
                                ],
                              )}
                            >
                              {cell.column.getIsPinned() && (
                                <div
                                  className={clsx(
                                    "pointer-events-none absolute inset-0 border-gray-200 dark:border-dark-500",
                                    cell.column.getIsPinned() === "left" ? "ltr:border-r rtl:border-l" : "ltr:border-l rtl:border-r",
                                  )}
                                />
                              )}
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
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
                    tableSettings.enableFullScreen && "bg-gray-50 dark:bg-dark-800",
                    !(table.getIsSomeRowsSelected() || table.getIsAllRowsSelected()) && "pt-4",
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
