// index.jsx — Calibration Invoice List
// Route: /dashboards/accounts/calibration-invoice-list
// PHP: permission(146) required for page access
// API: GET /accounts/get-calibration-invoices-list
// PHP filter: status!=99 and status!=91 and typeofinvoice='Calibration'
// PHP row highlight: cname.trim() != customername.trim() → pink row

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

import { ColumnFilter } from "components/shared/table/ColumnFilter";
import { Table, Card, THead, TBody, Th, Tr, Td } from "components/ui";
import { TableSortIcon } from "components/shared/table/TableSortIcon";
import { Page } from "components/shared/Page";
import { useLockScrollbar, useDidUpdate, useLocalStorage } from "hooks";
import { fuzzyFilter } from "utils/react-table/fuzzyFilter";
import { useSkipper } from "utils/react-table/useSkipper";
import { PaginationSection } from "components/shared/table/PaginationSection";
import { useThemeContext } from "app/contexts/theme/context";
import { Toolbar } from "./Toolbar";
import { columns } from "./columns";

// ----------------------------------------------------------------------

// PHP permission IDs — adjust to your auth system
export default function CalibrationInvoiceList() {
  const { cardSkin } = useThemeContext();
  const navigate = useNavigate();
  const permissions = JSON.parse(localStorage.getItem("userPermissions") || "[]");

  useEffect(() => {
    if (!permissions.includes(146)) {
      navigate("/dashboards");
    }
  }, [navigate, permissions]);

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── Fetch list ──────────────────────────────────────────────────────
  const fetchList = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/accounts/get-calibration-invoices-list");
      setData(res.data.data ?? res.data ?? []);
    } catch {
      toast.error("Failed to load invoice list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  // ── Table settings ──────────────────────────────────────────────────
  const [tableSettings, setTableSettings] = useState({
    enableFullScreen: false,
    enableRowDense: false,
    enableSorting: true, // ✅ sorting on
    enableColumnFilters: true, // ✅ per-column search on
  });

  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState([{ id: "date", desc: true }]);

  const [columnVisibility, setColumnVisibility] = useLocalStorage(
    "column-visibility-calibration-invoice-list",
    {},
  );
  const [columnPinning, setColumnPinning] = useLocalStorage(
    "column-pinning-calibration-invoice-list",
    {},
  );

  const [autoResetPageIndex, skipAutoResetPageIndex] = useSkipper();

  const table = useReactTable({
    data,
    columns,
    state: {
      globalFilter,
      sorting,
      columnVisibility,
      columnPinning,
      tableSettings,
    },
    meta: {
      permissions,
      setTableSettings,
      updateRow: (rowIndex, updates) => {
        skipAutoResetPageIndex();
        setData((old) =>
          old.map((row, i) => (i === rowIndex ? { ...row, ...updates } : row)),
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
    initialState: { pagination: { pageSize: 25 } },
  });

  useDidUpdate(() => table.resetRowSelection(), [data]);
  useLockScrollbar(tableSettings.enableFullScreen);

  // ── Loading ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Page title="Calibration Invoice List">
        <div className="flex h-[60vh] items-center justify-center text-gray-600">
          <svg
            className="mr-2 h-6 w-6 animate-spin text-blue-600"
            viewBox="0 0 24 24"
            fill="none"
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
          Loading Calibration Invoices...
        </div>
      </Page>
    );
  }

  return (
    <Page title="Calibration Invoice List">
      <div className="transition-content w-full pb-5">
        <div
          className={clsx(
            "flex h-full w-full flex-col",
            tableSettings.enableFullScreen &&
              "dark:bg-dark-900 fixed inset-0 z-61 bg-white pt-3",
          )}
        >
          {/* Toolbar */}
          <Toolbar table={table} />

          <div
            className={clsx(
              "transition-content flex grow flex-col pt-3",
              tableSettings.enableFullScreen
                ? "overflow-hidden"
                : "px-[var(--margin-x)]",
            )}
          >
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
                              "dark:bg-dark-800 dark:text-dark-100 bg-gray-200 font-semibold text-gray-800 uppercase first:ltr:rounded-tl-lg last:ltr:rounded-tr-lg first:rtl:rounded-tr-lg last:rtl:rounded-tl-lg",
                              header.column.getCanPin() && [
                                header.column.getIsPinned() === "left" &&
                                  "sticky z-2 ltr:left-0 rtl:right-0",
                                header.column.getIsPinned() === "right" &&
                                  "sticky z-2 ltr:right-0 rtl:left-0",
                              ],
                            )}
                          >
                            {/* ── Column Header + Sort ── */}
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

                            {/* ── Per-column Filter ──────────────────────────
                                PHP port:
                                  status column  → <select> Pending/Approved/Einvoice
                                  other columns  → <input type="text"> Search...
                            ─────────────────────────────────────────────── */}
                            {header.column.getCanFilter() ? (
                              header.column.columnDef.meta?.filterType ===
                              "select" ? (
                                // PHP: columns[8] → select dropdown exact match
                                <select
                                  className="dark:border-dark-500 dark:bg-dark-900 dark:text-dark-100 mt-1 w-full rounded border border-gray-300 bg-white px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                                  value={header.column.getFilterValue() ?? ""}
                                  onChange={(e) =>
                                    header.column.setFilterValue(
                                      e.target.value || undefined,
                                    )
                                  }
                                >
                                  <option value="">All</option>
                                  <option value="0">Pending</option>
                                  <option value="1">Approved</option>
                                  <option value="2">Einvoice</option>
                                </select>
                              ) : (
                                // PHP: text input like '%value%' for all other columns
                                <ColumnFilter column={header.column} />
                              )
                            ) : null}
                          </Th>
                        ))}
                      </Tr>
                    ))}
                  </THead>

                  <TBody>
                    {table.getRowModel().rows.length === 0 ? (
                      <Tr>
                        <Td
                          colSpan={columns.length}
                          className="dark:text-dark-400 py-16 text-center text-sm text-gray-500"
                        >
                          No invoices found
                        </Td>
                      </Tr>
                    ) : (
                      table.getRowModel().rows.map((row) => {
                        // PHP: fnRowCallback — cname != customername → pink row
                        const isDiff =
                          (row.original.cname || "").trim() !==
                          (row.original.customername || "").trim();
                        return (
                          <Tr
                            key={row.id}
                            className={clsx(
                              "dark:border-b-dark-500 relative border-y border-transparent border-b-gray-200",
                              isDiff && "bg-red-50 dark:bg-red-900/10",
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
                                  isDiff && "!bg-red-50 dark:!bg-red-900/10",
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
                        );
                      })
                    )}
                  </TBody>
                </Table>
              </div>

              {/* Pagination */}
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
            </Card>
          </div>
        </div>
      </div>
    </Page>
  );
}
