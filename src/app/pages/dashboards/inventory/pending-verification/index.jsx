// Import Dependencies
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import clsx from "clsx";
import { useState, useEffect, useCallback } from "react";
import axios from "utils/axios";

// Local Imports
import { Table, THead, TBody, Th, Tr, Td, Card } from "components/ui";
import { TableSortIcon } from "components/shared/table/TableSortIcon";
import { Page } from "components/shared/Page";
import { useLockScrollbar, useLocalStorage } from "hooks";
import { fuzzyFilter } from "utils/react-table/fuzzyFilter";
import { useSkipper } from "utils/react-table/useSkipper";
import { columns } from "./columns";
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

export default function PendingVerification() {
  const permissions = usePermissions();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [tableSettings, setTableSettings] = useState({
    enableFullScreen: false,
    enableRowDense: false,
  });

  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState([{ id: "sr_no", desc: true }]);
  const [columnVisibility, setColumnVisibility] = useLocalStorage(
    "column-visibility-pending-verification",
    {},
  );
  const [columnPinning, setColumnPinning] = useLocalStorage(
    "column-pinning-pending-verification",
    {},
  );
  const [autoResetPageIndex, skipAutoResetPageIndex] = useSkipper();
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 100,
  });

  const fetchPendingVerification = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get("inventory/get-pending-verification");
      if (response.data.status && Array.isArray(response.data.data)) {
        setOrders(response.data.data);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error("Error fetching pending verification data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingVerification();
  }, [fetchPendingVerification]);

  const table = useReactTable({
    data: orders,
    columns: columns,
    state: {
      globalFilter,
      sorting,
      columnVisibility,
      columnPinning,
      pagination,
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
      setTableSettings,
    },
    filterFns: {
      fuzzy: fuzzyFilter,
    },
    getCoreRowModel: getCoreRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    getFilteredRowModel: getFilteredRowModel(),
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

  if (!permissions.includes(396)) {
    return (
      <Page title="Pending Verification">
        <div className="flex h-60 items-center justify-center rounded-xl border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-sm font-medium text-red-600 dark:text-red-400">
            Access Denied - Permission 396 required
          </p>
        </div>
      </Page>
    );
  }

  return (
    <Page title="Pending Verification">
      <div className="transition-content w-full pb-5">
        <div
          className={clsx(
            "flex h-full w-full flex-col",
            tableSettings.enableFullScreen &&
            "fixed inset-0 z-61 bg-white pt-3 dark:bg-dark-900",
          )}
        >
          <Card className="flex flex-col border-none shadow-soft dark:bg-dark-700">
            <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-dark-500 sm:p-5">
              <h3 className="text-lg font-bold text-gray-800 dark:text-dark-100">
                Pending Verification List
              </h3>
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
                          className="bg-gray-50 px-4 py-3 text-xs font-bold uppercase text-gray-600 dark:bg-dark-800 dark:text-dark-200"
                        >
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
                  {loading ? (
                    <TableLoadingRow colSpan={columns.length} />
                  ) : table.getRowModel().rows.length > 0 ? (
                    table.getRowModel().rows.map((row) => (
                      <Tr
                        key={row.id}
                        className="border-b border-gray-100 last:border-0 dark:border-dark-600"
                      >
                        {row.getVisibleCells().map((cell) => (
                          <Td key={cell.id} className="px-4 py-3 text-sm">
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
                      <Td colSpan={columns.length} className="h-24 text-center text-gray-500">
                        No pending items found
                      </Td>
                    </Tr>
                  )}
                </TBody>
              </Table>
            </div>

            <div className="border-t border-gray-100 p-4 dark:border-dark-600 sm:p-5">
              <PaginationSection table={table} />
            </div>
          </Card>
        </div>
      </div>
    </Page>
  );
}
