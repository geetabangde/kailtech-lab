import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
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
import axios from "utils/axios";
import { toast } from "sonner";

// Local Imports
import { Table, Card, THead, TBody, Th, Tr, Td } from "components/ui";
import { TableSortIcon } from "components/shared/table/TableSortIcon";
import { Page } from "components/shared/Page";
import { useLockScrollbar, useLocalStorage } from "hooks";
import { fuzzyFilter } from "utils/react-table/fuzzyFilter";
import { useSkipper } from "utils/react-table/useSkipper";
import { Toolbar } from "./Toolbar";
import { holidayColumns } from "./columns";
import { PaginationSection } from "components/shared/table/PaginationSection";
import { getStoredPermissions } from "app/navigation/dashboards";

export default function YearlyHolidayLists() {
  const { year } = useParams();
  const navigate = useNavigate();
  const permissions = getStoredPermissions();

  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchYearlyHolidays = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get("/hrm/active-holidays-list");

      if (response.data.status && Array.isArray(response.data.data)) {
        const allHolidays = response.data.data;
        // Filter holidays by the selected year
        const filtered = allHolidays.filter((h) => {
          if (!h.date) return false;
          const yearMatch = h.date.match(/^(\d{4})/);
          return yearMatch ? parseInt(yearMatch[1], 10) === parseInt(year, 10) : false;
        });

        setHolidays(filtered);
      } else {
        console.warn("Unexpected response structure:", response.data);
        setHolidays([]);
      }
    } catch (err) {
      console.error("Error fetching yearly holiday list:", err);
      toast.error("Failed to load holiday list.");
      setHolidays([]);
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => {
    fetchYearlyHolidays();
  }, [fetchYearlyHolidays]);

  const [tableSettings, setTableSettings] = useState({
    enableFullScreen: false,
    enableRowDense: false,
  });

  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState([]);

  const [columnVisibility, setColumnVisibility] = useLocalStorage(
    `column-visibility-holidays-${year}`,
    {},
  );

  const [columnPinning, setColumnPinning] = useLocalStorage(
    `column-pinning-holidays-${year}`,
    {},
  );

  const [autoResetPageIndex, skipAutoResetPageIndex] = useSkipper();

  const table = useReactTable({
    data: holidays,
    columns: holidayColumns,
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
        setHolidays((old) =>
          old.map((row, index) => {
            if (index === rowIndex) {
              return {
                ...old[rowIndex],
                [columnId]: value,
              };
            }
            return row;
          }),
        );
      },
      deleteRow: (row) => {
        skipAutoResetPageIndex();
        setHolidays((old) =>
          old.filter((oldRow) => oldRow.id !== row.original.id)
        );
      },
      setTableSettings,
    },
    filterFns: {
      fuzzy: fuzzyFilter,
    },
    enableSorting: true,
    enableColumnFilters: false,
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

  useLockScrollbar(tableSettings.enableFullScreen);

  // Permission Check
  if (!permissions.includes(242)) {
    return (
      <Page title="View Holiday List">
        <div className="flex h-60 items-center justify-center rounded-xl border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-sm font-medium text-red-600 dark:text-red-400">
            Access Denied - Permission 242 required
          </p>
        </div>
      </Page>
    );
  }

  // Loading UI
  if (loading) {
    return (
      <Page title={`Holiday List - ${year}`}>
        <div className="flex h-[60vh] items-center justify-center text-gray-600 dark:text-dark-200">
          <svg
            className="animate-spin h-6 w-6 mr-2 text-blue-600"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z"
            ></path>
          </svg>
          Loading Holidays for {year}...
        </div>
      </Page>
    );
  }

  return (
    <Page title="View Holiday List::.Manage Attendace-HRM">
      <div className="transition-content w-full pb-5">
        <div
          className={clsx(
            "flex h-full w-full flex-col",
            tableSettings.enableFullScreen &&
              "fixed inset-0 z-61 bg-white pt-3 dark:bg-dark-900",
          )}
        >
          {/* Header Row with Back Button */}
          <div className="flex items-center gap-3 px-[var(--margin-x)] pt-4">
            <button
              onClick={() => navigate("/dashboards/hrm/holidays")}
              className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-dark-800 transition"
              title="Back to Holiday Years List"
            >
              <ArrowLeftIcon className="h-5 w-5 text-gray-600 dark:text-dark-200" />
            </button>
            <span className="text-sm text-gray-500 dark:text-dark-300">
              Back to Holiday Years List
            </span>
          </div>

          <Toolbar
            table={table}
            title={`Holiday List ${year}`}
            addLink="/dashboards/hrm/holidays/add"
            addButtonText="+ Add"
            addPermissionCode={245}
          />
          <div
            className={clsx(
              "transition-content flex grow flex-col pt-3",
              tableSettings.enableFullScreen ? "overflow-hidden" : "px-[var(--margin-x)]",
            )}
          >
            <Card
              className={clsx(
                "relative flex grow flex-col border-none shadow-soft dark:bg-dark-700",
                tableSettings.enableFullScreen && "overflow-hidden",
              )}
            >
              <div className="table-wrapper min-w-full grow overflow-x-auto">
                <Table
                  hoverable
                  dense={tableSettings.enableRowDense}
                  sticky={tableSettings.enableFullScreen}
                  className="w-full text-left"
                >
                  <THead>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <Tr key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <Th
                            key={header.id}
                            className={clsx(
                              "bg-gray-50 text-xs font-bold uppercase text-gray-600 dark:bg-dark-800 dark:text-dark-200 align-top",
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
                                className="flex cursor-pointer select-none items-center gap-2"
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
                      table.getRowModel().rows.map((row) => (
                        <Tr
                          key={row.id}
                          className="border-b border-gray-150 last:border-0 dark:border-dark-500"
                        >
                          {row.getVisibleCells().map((cell) => (
                            <Td
                              key={cell.id}
                              className={clsx(
                                "text-sm bg-white dark:bg-dark-700",
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
                          ))}
                        </Tr>
                      ))
                    ) : (
                      <Tr>
                        <Td
                          colSpan={holidayColumns.length}
                          className="h-24 text-center text-gray-500"
                        >
                          No records found
                        </Td>
                      </Tr>
                    )}
                  </TBody>
                </Table>
              </div>
              {table.getCoreRowModel().rows.length > 0 && (
                <div className="border-t border-gray-100 p-4 dark:border-dark-600 sm:p-5">
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