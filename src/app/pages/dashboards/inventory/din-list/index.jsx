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
import { Link } from "react-router-dom";

// Local Imports
import { Table, THead, TBody, Th, Tr, Td, Button } from "components/ui";
import { TableSortIcon } from "components/shared/table/TableSortIcon";
import { Page } from "components/shared/Page";
import { useLockScrollbar, useLocalStorage } from "hooks";
import { fuzzyFilter } from "utils/react-table/fuzzyFilter";
import { useSkipper } from "utils/react-table/useSkipper";
import { columns } from "./columns";
import { TableConfig } from "./TableConfig";
import { PaginationSection } from "components/shared/table/PaginationSection";
import { TableLoadingRow } from "components/shared/table/TableLoadingRow";

// ----------------------------------------------------------------------

function usePermissions() {
  const p = localStorage.getItem("userPermissions");
  try {
    return JSON.parse(p) || [];
  } catch {
    return p?.split(",").map(Number) || [];
  }
}

function ColumnFilter({ column }) {
  const columnFilterValue = column.getFilterValue();

  if (column.id === 'status') {
    return (
      <select
        value={columnFilterValue?.toString() ?? ''}
        onChange={e => column.setFilterValue(e.target.value)}
        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-xs dark:border-dark-600 dark:bg-dark-800 px-2 py-1 normal-case font-normal"
        onClick={e => e.stopPropagation()}
      >
        <option value="">All</option>
        <option value="1">Approved / Dispatched</option>
        <option value="-2">Pending For Checklist</option>
        <option value="-1">Pending For approve</option>
        <option value="0">Pending For Dispatch</option>
        <option value="99">Rejected Din</option>
      </select>
    );
  }

  return (
    <input
      type="text"
      value={(columnFilterValue ?? '')}
      onChange={e => column.setFilterValue(e.target.value)}
      placeholder={`Search...`}
      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-xs dark:border-dark-600 dark:bg-dark-800 px-2 py-1 font-normal normal-case"
      onClick={e => e.stopPropagation()}
    />
  );
}

export default function DinList() {
  const permissions = usePermissions();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tableSettings, setTableSettings] = useState({
    enableFullScreen: false,
    enableRowDense: false,
  });
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState([{ id: "id", desc: true }]);
  const [columnVisibility, setColumnVisibility] = useLocalStorage(
    "column-visibility-din-list",
    {},
  );
  const [columnPinning, setColumnPinning] = useLocalStorage(
    "column-pinning-din-list",
    {},
  );
  const [autoResetPageIndex, skipAutoResetPageIndex] = useSkipper();
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 25,
  });

  useEffect(() => {
    fetchDinList();
  }, []);

  const fetchDinList = async () => {
    try {
      setLoading(true);
      const response = await axios.get("inventory/get-din-list");

      if ((response.data.status === true || response.data.status === "true") && Array.isArray(response.data.data)) {
        setOrders(response.data.data);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error("Error fetching din list data:", err);
    } finally {
      setLoading(false);
    }
  };

  const table = useReactTable({
    data: orders,
    columns: columns,
    state: {
      globalFilter,
      sorting,
      columnVisibility,
      columnPinning,
      pagination,
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
      setTableSettings
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

  // Permission Check
  if (!permissions.includes(302)) {
    return (
      <Page title="Din List">
        <div className="flex h-60 items-center justify-center rounded-xl border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-sm font-medium text-red-600 dark:text-red-400">
            Access Denied - Permission 302 required
          </p>
        </div>
      </Page>
    );
  }

  

  return (
    <Page title="Din List">
      <div className="transition-content w-full pb-5">
        <div
          className={clsx(
            "flex h-full w-full flex-col",
            tableSettings.enableFullScreen &&
            "fixed inset-0 z-61 bg-white pt-3 dark:bg-dark-900",
          )}
        >
          <div className="card border-none shadow-soft dark:bg-dark-700">
            <div className="card-header flex flex-col items-start justify-between gap-4 border-b border-gray-200 p-4 dark:border-dark-500 sm:flex-row sm:items-center sm:p-5">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-gray-800 dark:text-dark-100">
                  Dispatch List
                </h3>
              </div>

              <div className="flex w-full flex-wrap items-center justify-end gap-3 sm:w-auto">
                <div className="relative w-full sm:w-64">
                  <input
                    type="text"
                    value={globalFilter ?? ""}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    placeholder="Search all columns..."
                    className="form-input w-full rounded-lg border-gray-300 bg-white px-4 py-2 text-sm focus:border-primary-500 focus:ring-primary-500 dark:border-dark-400 dark:bg-dark-800"
                  />
                </div>

                <TableConfig table={table} />

                {permissions.includes(303) && (
                  <Button
                    component={Link}
                    to="/dashboards/inventory/din-list/add-din"
                    color="primary"
                    variant="filled"
                    className="!bg-blue-600 !text-white hover:!bg-blue-700 whitespace-nowrap font-bold shadow-sm"
                  >
                    {"<< Request Dispatch"}
                  </Button>
                )}
              </div>
            </div>

            <div className="grow overflow-auto p-0">
              <Table
                hoverable
                dense={tableSettings.enableRowDense}
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
                            ]
                          )}
                        >
                          <div className="flex flex-col gap-2">
                            {header.column.getCanSort() ? (
                              <div
                                className="flex cursor-pointer select-none items-center gap-2"
                                onClick={header.column.getToggleSortingHandler()}
                              >
                                {flexRender(
                                  header.column.columnDef.header,
                                  header.getContext(),
                                )}
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
                            {header.column.getCanFilter() ? (
                              <div>
                                <ColumnFilter column={header.column} table={table} />
                              </div>
                            ) : null}
                          </div>
                        </Th>
                      ))}
                    </Tr>
                  ))}
                </THead>
                <TBody>
                  {loading ? (
                    <TableLoadingRow colSpan={columns.length} />
                  ) : table.getRowModel().rows.length > 0 ? (
                    table.getRowModel().rows.map((row) => (
                      <Tr
                        key={row.id}
                        className="border-b border-gray-200 hover:bg-gray-50/50 dark:border-dark-500 dark:hover:bg-dark-600/50"
                      >
                        {row.getVisibleCells().map((cell) => (
                          <Td 
                            key={cell.id} 
                            className={clsx(
                              "bg-white dark:bg-dark-700",
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
                        className="h-32 text-center text-gray-500"
                      >
                        No records found
                      </Td>
                    </Tr>
                  )}
                </TBody>
              </Table>
            </div>

            <div className="p-4 sm:p-5">
              <PaginationSection table={table} />
            </div>
          </div>
        </div>
      </div>
    </Page>
  );
}
