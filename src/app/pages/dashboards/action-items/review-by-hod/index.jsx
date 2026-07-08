// HodReports.jsx (AcceptSample.jsx)
// PHP equivalent: hodreports.php + hodreportsdata.php
// Permission: 180 required
// API: GET /actionitem/get-hod-request?ctype=&specificpurpose=&department=&status=

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
import { useState, useEffect, useCallback } from "react";
import axios from "utils/axios";
import Select from "react-select";

import { Table, Card, THead, TBody, Th, Tr, Td } from "components/ui";
import { TableSortIcon } from "components/shared/table/TableSortIcon";
import { Page } from "components/shared/Page";
import { useLockScrollbar, useDidUpdate, useLocalStorage, useDebounceValue } from "hooks";
import { fuzzyFilter } from "utils/react-table/fuzzyFilter";
import { useSkipper } from "utils/react-table/useSkipper";
import { Toolbar } from "./Toolbar";
import { columns } from "./columns.jsx";
import { PaginationSection } from "components/shared/table/PaginationSection";
import { SelectedRowsActions } from "components/shared/table/SelectedRowsActions";
import { useThemeContext } from "app/contexts/theme/context";
import { getUserAgentBrowser } from "utils/dom/getUserAgentBrowser";

const isSafari = getUserAgentBrowser() === "Safari";

// PHP: if(!in_array(180, $permissions)) → redirect
function usePermissions() {
  return localStorage.getItem("userPermissions")?.split(",").map(Number) || [];
}

const selectCls =
  "rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 " +
  "px-3 py-2 text-sm text-gray-700 dark:text-gray-300 outline-none min-w-[180px] " +
  "focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 transition";

const customSelectStyles = {
  control: (base, state) => ({
    ...base,
    minHeight: "42px",
    minWidth: "180px",
    borderColor: state.isFocused ? "#3b82f6" : "#d1d5db",
    boxShadow: state.isFocused ? "0 0 0 2px rgba(59, 130, 246, 0.5)" : "none",
    "&:hover": {
      borderColor: "#3b82f6",
    },
  }),
  menu: (base) => ({
    ...base,
    zIndex: 50,
  }),
};

const customSelectStylesDepartment = {
  control: (base, state) => ({
    ...base,
    minHeight: "42px",
    minWidth: "400px",
    borderColor: state.isFocused ? "#3b82f6" : "#d1d5db",
    boxShadow: state.isFocused ? "0 0 0 2px rgba(59, 130, 246, 0.5)" : "none",
    "&:hover": {
      borderColor: "#3b82f6",
    },
  }),
  menu: (base) => ({
    ...base,
    zIndex: 50,
    minWidth: "450px",
  }),
};

export default function AcceptSample() {
  const { cardSkin } = useThemeContext();
  const permissions  = usePermissions();

  const [products,         setProducts]         = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [customerTypes,    setCustomerTypes]    = useState([]);
  const [specificPurposes, setSpecificPurposes] = useState([]);
  const [departments,      setDepartments]      = useState([]);

  // ── Filters ────────────────────────────────────────────────────────────────
  // PHP: ctype (perm 389), specificpurpose (perm 390), department, status
  const [ctype,           setCtype]           = useState("");
  const [specificpurpose, setSpecificpurpose] = useState("");
  const [department,      setDepartment]      = useState("");
  const [status,          setStatus]          = useState("Pending"); // PHP default: "Pending"
  const [startDate,       setStartDate]       = useState(""); // ?startdate
  const [endDate,         setEndDate]         = useState(""); // ?enddate

  const [globalFilter, setGlobalFilter] = useState("");
  // Debounce global filter to avoid excessive API calls
  const [debouncedSearch] = useDebounceValue(globalFilter, 500);

  // ── Fetch dropdowns ────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchDropdowns = async () => {
      // PHP: customertypes where status=1 — perm 389
      if (permissions.includes(389)) {
        try {
          const res = await axios.get("/people/get-customer-type-list");
          const d   = res.data?.Data ?? res.data?.data ?? res.data ?? [];
          setCustomerTypes(Array.isArray(d) ? d : []);
        } catch { setCustomerTypes([]); }
      }

      // PHP: specificpurposes where status=1 — perm 390
      if (permissions.includes(390)) {
        try {
          const res = await axios.get("/people/get-specific-purpose-list");
          const d   = res.data?.data ?? res.data?.Data ?? res.data ?? [];
          setSpecificPurposes(Array.isArray(d) ? d : []);
        } catch { setSpecificPurposes([]); }
      }

      // PHP: labs where status=1 (filtered by employeedepartment if no perm 346)
      // API: /actionitem/get-labs-by-department-wise
      try {
        const res = await axios.get("/actionitem/get-labs-by-department-wise");
        const d   = res.data?.data ?? res.data?.Data ?? res.data ?? [];
        setDepartments(Array.isArray(d) ? d : []);
      } catch { setDepartments([]); }
    };
    fetchDropdowns();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Fetch table data ───────────────────────────────────────────────────────
  // PHP: hodreportsdata.php — JOIN trfProducts+trfs+products+testprices+hodrequests
  // API: GET /actionitem/get-hod-request
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (ctype)           params.append("ctype",           ctype);
      if (specificpurpose) params.append("specificpurpose", specificpurpose);
      if (department)      params.append("department",      department);
      if (status)          params.append("status",          status);
      if (startDate)       params.append("startdate",       startDate);
      if (endDate)         params.append("enddate",         endDate);
      if (debouncedSearch) params.append("search",          debouncedSearch);

      const response = await axios.get(
        `/actionitem/get-hod-request?${params.toString()}`
      );

      if (Array.isArray(response.data)) {
        setProducts(response.data);
      } else if (Array.isArray(response.data?.data)) {
        setProducts(response.data.data);
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.error("Error fetching HOD request list:", err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [ctype, specificpurpose, department, status, startDate, endDate, debouncedSearch]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // ── Table setup ────────────────────────────────────────────────────────────
  const [tableSettings, setTableSettings] = useState({
    enableFullScreen: false,
    enableRowDense:   false,
  });

  const [sorting,      setSorting]      = useState([{ id: "id", desc: true }]);

  const [columnVisibility, setColumnVisibility] = useLocalStorage(
    "column-visibility-hod-reports-1", {}
  );
  const [columnPinning, setColumnPinning] = useLocalStorage(
    "column-pinning-hod-reports-1", {}
  );

  const [autoResetPageIndex, skipAutoResetPageIndex] = useSkipper();

  const table = useReactTable({
    data: products,
    columns,
    state: { globalFilter, sorting, columnVisibility, columnPinning, tableSettings },
    meta: {
      permissions,
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
    filterFns:              { fuzzy: fuzzyFilter },
    enableSorting:          true,
    getCoreRowModel:        getCoreRowModel(),
    onGlobalFilterChange:   setGlobalFilter,
    getFilteredRowModel:    getFilteredRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
    globalFilterFn:         fuzzyFilter,
    onSortingChange:        setSorting,
    getSortedRowModel:      getSortedRowModel(),
    getPaginationRowModel:  getPaginationRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onColumnPinningChange:    setColumnPinning,
    autoResetPageIndex,
  });

  useDidUpdate(() => table.resetRowSelection(), [products]);
  useLockScrollbar(tableSettings.enableFullScreen);

  // PHP: if(!in_array(180, $permissions)) → redirect
  if (!permissions.includes(180)) {
    return (
      <Page title="HOD Review">
        <div className="flex h-60 items-center justify-center rounded-xl border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-sm font-medium text-red-600 dark:text-red-400">
            ⛔ Access Denied — Permission 180 required
          </p>
        </div>
      </Page>
    );
  }

  // ── Loading state ─────────────────────────────────────────────────────────
  // Subtle loading: Only show full-page spinner on initial load (when no data exists)
  if (loading && products.length === 0) {
    return (
      <Page title="HOD Review">
        <div className="flex h-[60vh] items-center justify-center gap-3 text-gray-500">
          <svg className="h-5 w-5 animate-spin text-blue-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z" />
          </svg>
          <span className="text-sm tracking-wide">Loading report data…</span>
        </div>
      </Page>
    );
  }

  return (
    <Page title="HOD Review">
      <div className="transition-content w-full pb-5">
        <div className={clsx(
          "flex h-full w-full flex-col",
          tableSettings.enableFullScreen && "fixed inset-0 z-61 bg-white pt-3 dark:bg-dark-900",
        )}>
          <Toolbar table={table} />

          <div className={clsx(
            "transition-content flex grow flex-col pt-3",
            tableSettings.enableFullScreen ? "overflow-hidden" : "px-[var(--margin-x)]",
          )}>

            {/* ── Filters ───────────────────────────────────────────────────── */}
            {/* PHP: customer type (perm 389), specific purpose (perm 390), department, status */}
            <div className="mb-4 flex flex-wrap items-end gap-4 rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">

              {/* Customer Type — PHP: if(in_array(389, $permissions)) */}
              {permissions.includes(389) && (
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Customer type:</label>
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

              {/* Specific Purpose — PHP: if(in_array(390, $permissions)) */}
              {permissions.includes(390) && (
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Specific Purpose:</label>
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
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Department:</label>
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
 
              {/* Start Date */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Start Date:</label>
                <input type="date" className={selectCls} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>

              {/* End Date */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">End Date:</label>
                <input type="date" className={selectCls} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>

              {/* Status — PHP: <option value="Pending">Pending Approval</option><option value="Approved">Approved</option> */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Status:</label>
                <Select
                  value={[
                    { value: "Pending", label: "Pending Approval" },
                    { value: "Approved", label: "Approved" }
                  ].find(opt => opt.value === status)}
                  onChange={(selectedOption) => setStatus(selectedOption ? selectedOption.value : "Pending")}
                  options={[
                    { value: "Pending", label: "Pending Approval" },
                    { value: "Approved", label: "Approved" }
                  ]}
                  styles={customSelectStyles}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                />
              </div>

              {/* Clear */}
              <button
                onClick={() => { 
                  setCtype(""); 
                  setSpecificpurpose(""); 
                  setDepartment(""); 
                  setStatus("Pending"); 
                  setStartDate("");
                  setEndDate("");
                  setGlobalFilter("");
                }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                Clear Filters
              </button>
            </div>

            <Card className={clsx("relative flex grow flex-col overflow-hidden", tableSettings.enableFullScreen && "overflow-hidden")}>
              {/* Subtle Progress Bar for re-fetching */}
              {loading && products.length > 0 && (
                <div className="absolute top-0 left-0 z-10 w-full">
                  <div className="h-0.5 w-full overflow-hidden bg-blue-100 dark:bg-blue-900/30">
                    <div className="h-full w-1/3 animate-progress bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.5)]" />
                  </div>
                </div>
              )}
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
                                header.column.getIsPinned() === "left"  && "sticky z-2 ltr:left-0 rtl:right-0",
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
                  <TBody className={clsx(
                    "transition-opacity duration-300",
                    loading && products.length > 0 ? "opacity-50 grayscale-[20%]" : "opacity-100"
                  )}>
                    {table.getRowModel().rows.length === 0 ? (
                      <Tr>
                        <Td colSpan={99} className="py-12 text-center text-sm text-gray-400">No items found.</Td>
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
                                  cell.column.getIsPinned() === "left"  && "sticky z-2 ltr:left-0 rtl:right-0",
                                  cell.column.getIsPinned() === "right" && "sticky z-2 ltr:right-0 rtl:left-0",
                                ],
                              )}
                            >
                              {cell.column.getIsPinned() && (
                                <div className={clsx(
                                  "pointer-events-none absolute inset-0 border-gray-200 dark:border-dark-500",
                                  cell.column.getIsPinned() === "left" ? "ltr:border-r rtl:border-l" : "ltr:border-l rtl:border-r",
                                )} />
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

              <SelectedRowsActions table={table} title="Review By HOD" showDelete={false} />
              {table.getCoreRowModel().rows.length > 0 && (
                <div className={clsx(
                  "px-4 pb-4 sm:px-5 sm:pt-4",
                  tableSettings.enableFullScreen && "bg-gray-50 dark:bg-dark-800",
                  !(table.getIsSomeRowsSelected() || table.getIsAllRowsSelected()) && "pt-4",
                )}>
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