// DraftReports.jsx
// PHP equivalent: draftreports.php + draftreportsData.php
// Endpoint: GET /actionitem/get-draft-report?startdate=&enddate=&draw=&start=&length=&search[value]=
// Columns: ID, Product, LRN, Action (View Draft Report)

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
import { useState, useEffect, useCallback } from "react";
import axios from "utils/axios";

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

// PHP: if(!in_array(179, $permissions)) → redirect
function usePermissions() {
  return localStorage.getItem("userPermissions")?.split(",").map(Number) || [];
}

export default function DraftReports() {
  const { cardSkin } = useThemeContext();
  const permissions = usePermissions();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Date filters — PHP: startdate, enddate
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // ── Fetch table data ────────────────────────────────────────────────────
  // PHP: draftreportsData.php — GET with startdate & enddate
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (startDate) params.append("startdate", startDate);
      if (endDate) params.append("enddate", endDate);

      const response = await axios.get(
        `/actionitem/get-draft-report?${params.toString()}`
      );

      // Support both flat array and nested data structures
      if (Array.isArray(response.data)) {
        setProducts(response.data);
      } else if (Array.isArray(response.data?.data)) {
        setProducts(response.data.data);
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.error("Error fetching draft report list:", err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  // Initial load
  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // ── Table settings ──────────────────────────────────────────────────────
  const [tableSettings, setTableSettings] = useState({
    enableFullScreen: false,
    enableRowDense: false,
  });

  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState([{ id: "id", desc: true }]);

  const [columnVisibility, setColumnVisibility] = useLocalStorage(
    "column-visibility-draft-reports-1", {}
  );
  const [columnPinning, setColumnPinning] = useLocalStorage(
    "column-pinning-draft-reports-1", {}
  );

  const [autoResetPageIndex, skipAutoResetPageIndex] = useSkipper();

  const table = useReactTable({
    data: products,
    columns,
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
    enableSorting: true,
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

  // ── Access check — PHP: if(!in_array(179, $permissions)) ───────────────
  if (!permissions.includes(179)) {
    return (
      <Page title="Draft Reports">
        <div className="flex h-60 items-center justify-center rounded-xl border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-sm font-medium text-red-600 dark:text-red-400">
            ⛔ Access Denied — Permission 179 required
          </p>
        </div>
      </Page>
    );
  }

  if (loading) {
    return (
      <Page title="Draft Reports">
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
    <Page title="Draft Reports">
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
            {/* ── Date Filters — PHP: startdate, enddate ──────────────── */}
            <div className="mb-4 flex flex-wrap items-end gap-4 rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">

              {/* Start Date */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Start Date:
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 transition"
                />
              </div>

              {/* End Date */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  End Date:
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 transition"
                />
              </div>

              {/* Search button */}
              <button
                onClick={fetchProducts}
                className="rounded-lg bg-green-600 px-5 py-2 text-sm font-semibold text-white shadow transition hover:bg-green-700"
              >
                Search
              </button>

              {/* Clear */}
              <button
                onClick={() => { setStartDate(""); setEndDate(""); }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                Clear
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
                                  {header.isPlaceholder
                                    ? null
                                    : flexRender(header.column.columnDef.header, header.getContext())}
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
                          No draft reports found.
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
                                    cell.column.getIsPinned() === "left"
                                      ? "ltr:border-r rtl:border-l"
                                      : "ltr:border-l rtl:border-r",
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