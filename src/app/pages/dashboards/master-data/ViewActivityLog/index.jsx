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
import { useState, useEffect } from "react";
import axios from "utils/axios";

// Local Imports
import { Table, Card, THead, TBody, Th, Tr, Td } from "components/ui";
import { TableSortIcon } from "components/shared/table/TableSortIcon";
import { Page } from "components/shared/Page";
import { useLockScrollbar, useDidUpdate, useLocalStorage } from "hooks";
import { fuzzyFilter } from "utils/react-table/fuzzyFilter";
import { useSkipper } from "utils/react-table/useSkipper";
import { Toolbar } from "./Toolbar";
import { columns } from "./columns";
import { PaginationSection } from "components/shared/table/PaginationSection";
import { SelectedRowsActions } from "./SelectedRowsActions";
import { useThemeContext } from "app/contexts/theme/context";
import { getUserAgentBrowser } from "utils/dom/getUserAgentBrowser";

// ----------------------------------------------------------------------

const isSafari = getUserAgentBrowser() === "Safari";

export default function OrdersDatatableV1() {
  const { cardSkin } = useThemeContext();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    // Default to current month in YYYY-MM format
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  });

  // ✅ Fetch from API when component mounts or month changes
  useEffect(() => {
    fetchActivityLog();
  }, [selectedMonth]);

  const fetchActivityLog = async () => {
    try {
      setLoading(true);
      
      console.log("Fetching activity log for month:", selectedMonth);
      
      const response = await axios.get("/master/get-activity-log", {
        params: {
          month: selectedMonth
        }
      });
      
      console.log("API response:", response.data);
      console.log("API data array:", response.data.data);

      if (response.data.status && Array.isArray(response.data.data)) {
        console.log("Setting orders with data:", response.data.data);
        setOrders(response.data.data);
      } else {
        console.warn("Unexpected response structure:", response.data);
        setOrders([]);
      }

    } catch (err) {
      console.error("Error fetching activity log:", err);
      console.error("Error details:", err.response?.data);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const [tableSettings, setTableSettings] = useState({
    enableFullScreen: false,
    enableRowDense: false,
  });

  const [globalFilter, setGlobalFilter] = useState("");

  const [sorting, setSorting] = useState([{ id: "id", desc: true }]);

  const [columnVisibility, setColumnVisibility] = useLocalStorage(
    "column-visibility-ViewActivityLog-index",
    {},
  );

  const [columnPinning, setColumnPinning] = useLocalStorage(
    "column-pinning-ViewActivityLog-index",
    {},
  );

  const [autoResetPageIndex, skipAutoResetPageIndex] = useSkipper();

  const table = useReactTable({
    data: orders,
    columns: columns,
    state: {
      globalFilter,
      sorting,
      columnVisibility,
      columnPinning,
      tableSettings,
    },
    meta: {
      updateData: (rowIndex, columnId, value) => {
        skipAutoResetPageIndex();
        setOrders((old) =>
          old.map((row, index) => {
            if (index === rowIndex) {
              return {
                ...old[rowIndex],
                [columnId]: value,
              };
            }
            return row;
          })
        );
      },
      deleteRow: (row) => {
        skipAutoResetPageIndex();
        setOrders((old) =>
          old.filter((oldRow) => oldRow.id !== row.original.id)
        );
      },
      deleteRows: (rows) => {
        skipAutoResetPageIndex();
        const rowIds = rows.map((row) => row.original.id);
        setOrders((old) => old.filter((row) => !rowIds.includes(row.id)));
      },
      setTableSettings
    },
    filterFns: {
      fuzzy: fuzzyFilter,
    },
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

  useDidUpdate(() => table.resetRowSelection(), [orders]);

  useLockScrollbar(tableSettings.enableFullScreen);

  console.log("Current orders state:", orders);
  console.log("Table rows:", table.getRowModel().rows);

  // ✅ Loading UI
  if (loading) {
    return (
      <Page title="Activity Log">
        <div className="flex h-[60vh] items-center justify-center text-gray-600">
          <svg className="animate-spin h-6 w-6 mr-2 text-blue-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z"></path>
          </svg>
          Loading Activity Log...
        </div>
      </Page>
    );
  }

  return (
    <Page title="Activity Log">
      <div className="transition-content w-full pb-5">
        <div
          className={clsx(
            "flex h-full w-full flex-col",
            tableSettings.enableFullScreen &&
              "fixed inset-0 z-61 bg-white pt-3 dark:bg-dark-900",
          )}
        >
          {/* Month Filter */}
          <div className="mb-4 px-[var(--margin-x)]">
            <div className="flex items-center gap-3">
              <label htmlFor="month-filter" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Filter by Month:
              </label>
              <input
                id="month-filter"
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-dark-700 dark:border-dark-500 dark:text-white"
              />
              <button
                onClick={fetchActivityLog}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Search
              </button>
            </div>
          </div>

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
                              "bg-gray-200 font-semibold uppercase text-gray-800 dark:bg-dark-800 dark:text-dark-100 first:ltr:rounded-tl-lg last:ltr:rounded-tr-lg first:rtl:rounded-tr-lg last:rtl:rounded-tl-lg",
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
                                className="flex cursor-pointer select-none items-center space-x-3 "
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
                    {table.getRowModel().rows.length > 0 ? (
                      table.getRowModel().rows.map((row) => {
                        return (
                          <Tr
                            key={row.id}
                            className={clsx(
                              "relative border-y border-transparent border-b-gray-200 dark:border-b-dark-500",
                              row.getIsSelected() && !isSafari &&
                                "row-selected after:pointer-events-none after:absolute after:inset-0 after:z-2 after:h-full after:w-full after:border-3 after:border-transparent after:bg-primary-500/10 ltr:after:border-l-primary-500 rtl:after:border-r-primary-500",
                            )}
                          >
                            {row.getVisibleCells().map((cell) => {
                              return (
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
                                    ></div>
                                  )}
                                  {flexRender(
                                    cell.column.columnDef.cell,
                                    cell.getContext(),
                                  )}
                                </Td>
                              );
                            })}
                          </Tr>
                        );
                      })
                    ) : (
                      <Tr>
                        <Td colSpan={columns.length} className="text-center py-8 text-gray-500">
                          No activity log data found for {selectedMonth}
                        </Td>
                      </Tr>
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