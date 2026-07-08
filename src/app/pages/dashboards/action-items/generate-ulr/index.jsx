// index.jsx  — ULR Requests list page
// PHP equivalent: ulrrequests.php
// Route: /dashboards/action-items/generate-ulr
// API:   GET /actionitem/get-ulr-request?ctype=&specificpurpose=
//
// PHP permission gates:
//   137 → page access
//   358 → Main Customer column
//   389 → Customer Type filter + column
//   390 → Specific Purpose filter + column

import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useState, useEffect, useCallback, useMemo } from "react";
import axios from "utils/axios";
import clsx from "clsx";
import Select from "react-select";
import { Page } from "components/shared/Page";
import { PaginationSection } from "components/shared/table/PaginationSection";
import { TableSortIcon } from "components/shared/table/TableSortIcon";
import { buildColumns } from "./columns";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function usePermissions() {
  return localStorage.getItem("userPermissions")?.split(",").map(Number) ?? [];
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
    zIndex: 50,
  }),
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────
export default function UlrRequests() {
  const permissions = usePermissions();

  // PHP: if (!in_array(137, $permissions)) header("location:index.php");
  const canAccess = permissions.includes(137);

  // ── Dropdown state ─────────────────────────────────────────────────────────
  const [customerTypes,    setCustomerTypes]    = useState([]);
  const [specificPurposes, setSpecificPurposes] = useState([]);

  // ── Filter state — PHP GET params ─────────────────────────────────────────
  const [ctype,           setCtype]           = useState("");
  const [specificpurpose, setSpecificpurpose] = useState("");

  // ── Table state ────────────────────────────────────────────────────────────
  const [data,    setData]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting,      setSorting]      = useState([{ id: "id", desc: true }]);

  // ── Load dropdowns ─────────────────────────────────────────────────────────
  useEffect(() => {
    // PHP: customertypes where status=1  (perm 389)
    if (permissions.includes(389)) {
      axios.get("/people/get-customer-type-list")
        .then((r) => {
          const d = r.data?.data ?? r.data?.Data ?? r.data ?? [];
          setCustomerTypes(Array.isArray(d) ? d : []);
        })
        .catch(() => setCustomerTypes([]));
    }

    // PHP: specificpurposes where status=1  (perm 390)
    if (permissions.includes(390)) {
      axios.get("/people/get-specific-purpose-list")
        .then((r) => {
          const d = r.data?.data ?? r.data?.Data ?? r.data ?? [];
          setSpecificPurposes(Array.isArray(d) ? d : []);
        })
        .catch(() => setSpecificPurposes([]));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Fetch table data ───────────────────────────────────────────────────────
  // PHP: trfProducts JOIN hodrequests where status=9 AND ulr IS NULL
  // API: GET /actionitem/get-ulr-request?ctype=&specificpurpose=
  const fetchData = useCallback(async () => {
    if (!canAccess) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (ctype)           params.set("ctype",          ctype);
      if (specificpurpose) params.set("specificpurpose", specificpurpose);

      const query = params.toString();
      const res   = await axios.get(`/actionitem/get-ulr-request${query ? `?${query}` : ""}`);
      const rows  = res.data?.data ?? res.data?.Data ?? res.data ?? [];
      setData(Array.isArray(rows) ? rows : []);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [canAccess, ctype, specificpurpose]);

  // Initial load
  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Build columns with permissions ─────────────────────────────────────────
  const columns = useMemo(() => buildColumns(permissions), [permissions]);

  // ── Table instance ─────────────────────────────────────────────────────────
  const table = useReactTable({
    data,
    columns,
    state:            { globalFilter, sorting },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange:      setSorting,
    getCoreRowModel:      getCoreRowModel(),
    getFilteredRowModel:  getFilteredRowModel(),
    getSortedRowModel:    getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  // ── Access denied ──────────────────────────────────────────────────────────
  if (!canAccess) {
    return (
      <Page title="ULR Requests">
        <div className="flex h-60 items-center justify-center rounded-xl border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-sm text-red-500">Access Denied — Permission 137 required.</p>
        </div>
      </Page>
    );
  }

  return (
    <Page title="ULR Requests">
      <div className="transition-content px-[var(--margin-x)] pb-8">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-base font-semibold text-gray-800 dark:text-gray-100">
            ULR Requests
          </h1>
        </div>

        {/* ── Filters ────────────────────────────────────────────────────── */}
        {/* PHP: <form> with ctype + specificpurpose filters */}
        {(permissions.includes(389) || permissions.includes(390)) && (
          <div className="mb-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-dark-800">
            <div className="flex flex-wrap items-end gap-4">

              {/* PHP: if (in_array(389, $permissions)) Customer Type */}
              {permissions.includes(389) && (
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                    Customer Type
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

              {/* PHP: if (in_array(390, $permissions)) Specific Purpose */}
              {permissions.includes(390) && (
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                    Specific Purpose
                  </label>
                  <Select
                    value={specificPurposes.find(sp => sp.id === specificpurpose) ? { value: specificpurpose, label: specificPurposes.find(sp => sp.id === specificpurpose).name } : null}
                    onChange={(selectedOption) => setSpecificpurpose(selectedOption ? selectedOption.value : "")}
                    options={specificPurposes.map(sp => ({ value: sp.id, label: sp.name }))}
                    placeholder="Select Specific Purpose"
                    isClearable
                    styles={customSelectStyles}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                  />
                </div>
              )}

              {/* PHP: <input type="submit" value="submit"/> */}
              <button
                onClick={fetchData}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Submit
              </button>

              {/* Clear filters */}
              {(ctype || specificpurpose) && (
                <button
                  onClick={() => { setCtype(""); setSpecificpurpose(""); }}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Table Card ─────────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-dark-800">
          <div className="px-4 pt-4 pb-2 flex items-center justify-between gap-3">
            {/* Show entries */}
            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
              <span>Show</span>
              <select
                value={table.getState().pagination.pageSize}
                onChange={(e) => table.setPageSize(Number(e.target.value))}
                className="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1 text-xs"
              >
                {[10, 25, 50, 100].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <span>entries</span>
            </div>

            {/* Global search */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600 dark:text-gray-400">Search:</span>
              <input
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-xs outline-none focus:border-blue-500"
                placeholder="Search..."
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-100 dark:bg-dark-700">
                {table.getHeaderGroups().map((hg) => (
                  <tr key={hg.id}>
                    {hg.headers.map((h) => (
                      <th
                        key={h.id}
                        onClick={h.column.getToggleSortingHandler()}
                        className={clsx(
                          "border-b border-gray-200 dark:border-gray-700 px-3 py-2.5 text-left font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap",
                          h.column.getCanSort() && "cursor-pointer select-none"
                        )}
                      >
                        <div className="flex items-center gap-1">
                          {flexRender(h.column.columnDef.header, h.getContext())}
                          {h.column.getCanSort() && (
                            <TableSortIcon sortDir={h.column.getIsSorted()} />
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={columns.length} className="py-12 text-center text-gray-400">
                      <div className="flex items-center justify-center gap-2">
                        <svg className="h-4 w-4 animate-spin text-blue-600" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z" />
                        </svg>
                        Loading...
                      </div>
                    </td>
                  </tr>
                ) : table.getRowModel().rows.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="py-12 text-center text-gray-400">
                      No records found.
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-gray-100 last:border-0 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-dark-700"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className="px-3 py-2.5 text-gray-700 dark:text-gray-300 align-top"
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-4 py-3">
            <PaginationSection table={table} />
          </div>
        </div>

      </div>
    </Page>
  );
}