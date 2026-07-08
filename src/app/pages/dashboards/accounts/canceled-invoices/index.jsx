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
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import axios from "utils/axios";
import { Page } from "components/shared/Page";
import { Table, Card, THead, TBody, Th, Tr, Td } from "components/ui";
import { TableSortIcon } from "components/shared/table/TableSortIcon";
import { PaginationSection } from "components/shared/table/PaginationSection";
import { useLockScrollbar, useDidUpdate, useLocalStorage } from "hooks";
import { fuzzyFilter } from "utils/react-table/fuzzyFilter";
import { useSkipper } from "utils/react-table/useSkipper";
import { useThemeContext } from "app/contexts/theme/context";
import { Toolbar } from "./Toolbar";
import { columns } from "./columns";

export default function CanceledInvoices() {
  const { cardSkin } = useThemeContext();
  const navigate = useNavigate();
  const permissions = JSON.parse(localStorage.getItem("userPermissions") || "[]");

  useEffect(() => {
    if (!permissions.includes(143)) {
      navigate("/dashboards");
    }
  }, [navigate, permissions]);

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tableSettings, setTableSettings] = useState({
    enableFullScreen: false,
    enableRowDense: false,
    enableSorting: true,
    enableColumnFilters: true,
  });
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState([{ id: "date", desc: true }]);
  const [columnVisibility, setColumnVisibility] = useLocalStorage(
    "col-vis-canceled-invoice-list",
    {},
  );
  const [columnPinning, setColumnPinning] = useLocalStorage(
    "col-pin-canceled-invoice-list",
    {},
  );
  const [autoResetPageIndex, skipAutoResetPageIndex] = useSkipper();

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setLoading(true);
        const res = await axios.get("/accounts/get-canceled-invoice");
        const rows = res.data?.data ?? res.data ?? [];
        setData(Array.isArray(rows) ? rows : []);
      } catch (error) {
        console.error("Error fetching canceled invoices:", error);
        toast.error("Failed to load canceled invoices");
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, []);

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
      setTableSettings,
      deleteRow: (row) => {
        skipAutoResetPageIndex();
        setData((old) => old.filter((item) => item.id !== row.original.id));
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

  if (loading) {
    return (
      <Page title="Canceled Invoice List">
        <div className="flex h-[60vh] items-center justify-center gap-3 text-gray-600">
          <svg
            className="h-6 w-6 animate-spin text-blue-600"
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
          Loading Canceled Invoices...
        </div>
      </Page>
    );
  }

  return (
    <Page title="Canceled Invoice List">
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
                              "bg-gray-200 font-semibold uppercase text-gray-800 dark:bg-dark-800 dark:text-dark-100",
                              "first:ltr:rounded-tl-lg last:ltr:rounded-tr-lg first:rtl:rounded-tr-lg last:rtl:rounded-tl-lg",
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

                            {header.column.getCanFilter() ? (
                              header.column.columnDef.meta?.filterType ===
                              "select" ? (
                                <select
                                  className="mt-1 w-full rounded border border-gray-300 bg-white px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-dark-500 dark:bg-dark-900 dark:text-dark-100"
                                  value={header.column.getFilterValue() ?? ""}
                                  onChange={(e) =>
                                    header.column.setFilterValue(
                                      e.target.value || undefined,
                                    )
                                  }
                                >
                                   <option value="">All</option>
                                   <option value="99">Canceled</option>
                                </select>
                              ) : (
                                <input
                                  type="text"
                                  value={header.column.getFilterValue() ?? ""}
                                  onChange={(e) =>
                                    header.column.setFilterValue(
                                      e.target.value || undefined,
                                    )
                                  }
                                  placeholder={String(
                                    header.column.columnDef.header ?? "",
                                  )}
                                  className="mt-1 w-full rounded border border-gray-300 bg-white px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-dark-500 dark:bg-dark-900 dark:text-dark-100"
                                />
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
                          className="py-16 text-center text-sm text-gray-500 dark:text-dark-400"
                        >
                          No canceled invoices found
                        </Td>
                      </Tr>
                    ) : (
                      table.getRowModel().rows.map((row) => (
                        <Tr
                          key={row.id}
                          className="relative border-y border-transparent border-b-gray-200 dark:border-b-dark-500"
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
                                    "pointer-events-none absolute inset-0 border-gray-200 dark:border-dark-500",
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
                      ))
                    )}
                  </TBody>
                </Table>
              </div>

              {table.getCoreRowModel().rows.length > 0 && (
                <div
                  className={clsx(
                    "px-4 pb-4 pt-4 sm:px-5",
                    tableSettings.enableFullScreen &&
                      "bg-gray-50 dark:bg-dark-800",
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
