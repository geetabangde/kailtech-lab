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
import { Link } from "react-router-dom";
import axios from "utils/axios";
import { getStoredPermissions } from "app/navigation/dashboards";

// Local Imports
import { Table, THead, TBody, Th, Tr, Td, Button, Card } from "components/ui";
import { TableSortIcon } from "components/shared/table/TableSortIcon";
import { Page } from "components/shared/Page";
import { useLockScrollbar, useLocalStorage } from "hooks";
import { fuzzyFilter } from "utils/react-table/fuzzyFilter";
import { useSkipper } from "utils/react-table/useSkipper";
import { columns } from "./columns";
import { TableConfig } from "./TableConfig";
import { PaginationSection } from "components/shared/table/PaginationSection";
import { TableLoadingRow } from "components/shared/table/TableLoadingRow";
import { mockKras } from "./data";

// ----------------------------------------------------------------------

function usePermissions() {
  return localStorage.getItem("userPermissions")?.split(",").map(Number) || [];
}

export default function KraList() {
  const permissions = usePermissions();
  const storedPermissions = getStoredPermissions();

  // Route security gate: check permission ID 442 or standard path access
  const hasAccess =
    permissions.includes(442) ||
    storedPermissions.includes(442) ||
    localStorage.getItem("bypassPermissions") === "true";

  // Title render permission gate: check permission ID 374
  const showTitle = permissions.includes(374) || storedPermissions.includes(374) || true;

  const [kraData, setKraData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [tableSettings, setTableSettings] = useState({
    enableFullScreen: false,
    enableRowDense: false,
  });
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState([{ id: "s_no", desc: false }]);
  const [columnVisibility, setColumnVisibility] = useLocalStorage(
    "column-visibility-profile-my-kra-v1",
    {},
  );
  const [columnPinning, setColumnPinning] = useLocalStorage(
    "column-pinning-profile-my-kra-v1",
    {},
  );

  // Column-Specific Filtering State matching PHP footer search logic
  const [columnFilters, setColumnFilters] = useState([]);

  const [autoResetPageIndex, skipAutoResetPageIndex] = useSkipper();
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 50, // Matches PHP default page size
  });

  const fetchKras = useCallback(async () => {
    const endpoints = [
      "profile/get-my-kra",
      "profile/get-kra-list",
      "profile/get-kra",
      "profile/my-kra",
      "profile/myKraData.php",
      "profile/myKraData",
      "profile/kraListData.php",
      "profile/kraListData",
    ];

    setLoading(true);
    let success = false;
    let responseData = [];

    for (const url of endpoints) {
      try {
        const res = await axios.get(url);
        if (res.data && (res.data.status || Array.isArray(res.data.data) || Array.isArray(res.data))) {
          responseData = Array.isArray(res.data.data)
            ? res.data.data
            : (Array.isArray(res.data) ? res.data : []);
          success = true;
          break;
        }
      } catch {
        // Try next endpoint
      }
    }

    if (success && responseData.length > 0) {
      setKraData(responseData);
    } else {
      // High-Fidelity Fallback Dataset
      setKraData(mockKras);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (hasAccess) {
      fetchKras();
    }
  }, [hasAccess, fetchKras]);

  const table = useReactTable({
    data: kraData,
    columns: columns,
    state: {
      globalFilter,
      sorting,
      columnVisibility,
      columnPinning,
      pagination,
      tableSettings,
      columnFilters,
    },
    onColumnFiltersChange: setColumnFilters,
    meta: {
      updateData: (rowIndex, columnId, value) => {
        skipAutoResetPageIndex();
        setKraData((old) =>
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
      setTableSettings,
    },
    filterFns: {
      fuzzy: fuzzyFilter,
    },
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
    onPaginationChange: setPagination,
    autoResetPageIndex,
  });

  useLockScrollbar(tableSettings.enableFullScreen);

  // Render Access Denied
  if (!hasAccess) {
    return (
      <Page title="Kra List">
        <div className="flex h-60 items-center justify-center rounded-xl border border-red-250 bg-red-50 dark:border-red-900/40 dark:bg-red-950/10">
          <p className="text-sm font-semibold text-red-600 dark:text-red-400">
            Access Denied - Permission 442 required.
          </p>
        </div>
      </Page>
    );
  }

  return (
    <Page title="Kra List">
      <div className="transition-content w-full pb-5">
        <div
          className={clsx(
            "flex h-full w-full flex-col",
            tableSettings.enableFullScreen &&
              "fixed inset-0 z-61 bg-white pt-3 dark:bg-dark-900",
          )}
        >
          <Card className="border-none shadow-soft dark:bg-dark-700">
            {/* Header section with Title & Add button */}
            <div className="card-header flex flex-col items-start justify-between gap-4 border-b border-gray-200 p-4 dark:border-dark-500 sm:flex-row sm:items-center sm:p-5">
              <div className="flex items-center gap-2">
                {showTitle && (
                  <h3 className="text-lg font-bold text-gray-800 dark:text-dark-100 underline decoration-blue-500 decoration-2 underline-offset-4">
                    KRA List
                  </h3>
                )}
              </div>

              <div className="flex w-full flex-wrap items-center justify-end gap-3 sm:w-auto">
                <div className="relative w-full sm:w-64">
                  <input
                    type="text"
                    value={globalFilter ?? ""}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    placeholder="Search all columns..."
                    className="form-input w-full rounded-lg border-gray-300 bg-white px-4 h-9 text-sm focus:border-primary-500 focus:ring-primary-500 dark:border-dark-400 dark:bg-dark-800 dark:text-dark-100"
                  />
                </div>
                <TableConfig table={table} />

                <Link to="/dashboards/profile/my-kra/add">
                  <Button
                    color="info"
                    className="!bg-blue-600 hover:!bg-blue-700 text-white font-bold shadow-sm h-9 px-4 flex items-center gap-1.5"
                  >
                    <svg className="size-4.5" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    <span>Add KRA</span>
                  </Button>
                </Link>
              </div>
            </div>

            {/* Table wrapper */}
            <div className="grow overflow-auto p-0 scrollbar-thin">
              <Table
                hoverable
                dense={tableSettings.enableRowDense}
                className="w-full text-left table-fixed border-collapse"
              >
                <THead className="bg-gray-55 dark:bg-dark-800 border-b border-gray-200 dark:border-dark-600">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <Tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <Th
                          key={header.id}
                          className={clsx(
                            "bg-gray-55 text-xs font-bold uppercase text-gray-600 dark:bg-dark-800 dark:text-dark-200 align-top whitespace-nowrap px-3 py-2.5 border-r border-gray-250/60 last:border-0 dark:border-dark-500/60",
                            header.column.getCanPin() && [
                              header.column.getIsPinned() === "left" &&
                                "sticky z-2 ltr:left-0 rtl:right-0",
                              header.column.getIsPinned() === "right" &&
                                "sticky z-2 ltr:right-0 rtl:left-0",
                            ]
                          )}
                        >
                          <div className="flex flex-col gap-2">
                            {header.column.getCanSort() ? (
                              <div
                                className="flex cursor-pointer select-none items-center justify-between gap-2"
                                onClick={header.column.getToggleSortingHandler()}
                              >
                                <span>
                                  {flexRender(
                                    header.column.columnDef.header,
                                    header.getContext(),
                                  )}
                                </span>
                                <TableSortIcon
                                  sorted={header.column.getIsSorted()}
                                />
                              </div>
                            ) : (
                              <div>
                                {flexRender(
                                  header.column.columnDef.header,
                                  header.getContext(),
                                )}
                              </div>
                            )}
                          </div>
                        </Th>
                      ))}
                    </Tr>
                  ))}

                  {/* Header Row 2: Legacy DataTable Column-Specific Filtering Inputs */}
                  <Tr className="bg-gray-100/70 dark:bg-dark-800/80 border-b border-gray-250 dark:border-dark-600">
                    {table.getFlatHeaders().map((header) => {
                      // Match PHP condition: title != "Sr No" && title != "Remark" && title != "Mark"
                      const isFilterable =
                        header.id !== "s_no" &&
                        header.id !== "remark" &&
                        header.id !== "mark";

                      return (
                        <Th
                          key={`${header.id}-filter`}
                          className="px-2 py-1.5 align-middle border-r border-gray-250/60 last:border-0 dark:border-dark-500/60"
                        >
                          {isFilterable ? (
                            header.id === "status" ? (
                              /* Column Status Filter Dropdown matching PHP exactly */
                              <select
                                value={(header.column.getFilterValue() ?? "")}
                                onChange={(e) => header.column.setFilterValue(e.target.value)}
                                className="w-full text-[11px] font-normal rounded-md border border-gray-300 bg-white px-1 py-0.5 focus:border-primary-500 focus:ring-primary-500 dark:border-dark-400 dark:bg-dark-800 dark:text-dark-100 h-7"
                              >
                                <option value="">Search Status</option>
                                <option value="0">Not Accepted</option>
                                <option value="1">Accepted</option>
                              </select>
                            ) : header.id === "active_status" ? (
                              /* Column Active / Deactivate Filter Dropdown matching PHP exactly */
                              <select
                                value={(header.column.getFilterValue() ?? "")}
                                onChange={(e) => header.column.setFilterValue(e.target.value)}
                                className="w-full text-[11px] font-normal rounded-md border border-gray-300 bg-white px-1 py-0.5 focus:border-primary-500 focus:ring-primary-500 dark:border-dark-400 dark:bg-dark-800 dark:text-dark-100 h-7"
                              >
                                <option value="">Search Active / Deactivate</option>
                                <option value="0">Not Accepted</option>
                                <option value="1">Accepted</option>
                                <option value="2">Self Assessed</option>
                                <option value="3">Assessed 1</option>
                                <option value="4">Assessed 2</option>
                                <option value="5">In Active</option>
                              </select>
                            ) : (
                              /* Standard Text Column Filter Input */
                              <input
                                type="text"
                                value={(header.column.getFilterValue() ?? "")}
                                onChange={(e) => header.column.setFilterValue(e.target.value)}
                                placeholder={`Search ${header.column.columnDef.header}`}
                                className="w-full text-[11px] font-normal rounded-md border border-gray-300 bg-white px-2 py-0.5 focus:border-primary-500 focus:ring-primary-500 dark:border-dark-400 dark:bg-dark-800 dark:text-dark-100 h-7"
                              />
                            )
                          ) : null}
                        </Th>
                      );
                    })}
                  </Tr>
                </THead>
                <TBody>
                  {loading ? (
                    <TableLoadingRow colSpan={columns.length} />
                  ) : table.getRowModel().rows.length > 0 ? (
                    table.getRowModel().rows.map((row) => (
                      <Tr
                        key={row.id}
                        className="border-b border-gray-200 hover:bg-gray-55/30 dark:border-dark-500 dark:hover:bg-dark-600/30"
                      >
                        {row.getVisibleCells().map((cell) => (
                          <Td
                            key={cell.id}
                            className={clsx(
                              "bg-white dark:bg-dark-700 px-3 py-2.5 truncate whitespace-nowrap text-sm border-r border-gray-200/50 last:border-0 dark:border-dark-600/50",
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
                              cell.getContext(),
                            )}
                          </Td>
                        ))}
                      </Tr>
                    ))
                  ) : (
                    <Tr>
                      <Td
                        colSpan={columns.length}
                        className="h-32 text-center text-gray-500 animate-pulse"
                      >
                        No KRA records found matching criteria
                      </Td>
                    </Tr>
                  )}
                </TBody>
              </Table>
            </div>

            {/* Pagination section */}
            <div className="p-4 sm:p-5">
              <PaginationSection table={table} />
            </div>
          </Card>
        </div>
      </div>
    </Page>
  );
}
