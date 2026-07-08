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
import { toast } from "react-hot-toast";

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

export default function DumpInstrument() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tableSettings, setTableSettings] = useState({
    enableFullScreen: false,
    enableRowDense: false,
  });

  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState([{ id: "added_on", desc: true }]);

  const [columnVisibility, setColumnVisibility] = useLocalStorage(
    "column-visibility-dump-instrument",
    {},
  );
  const [columnPinning, setColumnPinning] = useLocalStorage(
    "column-pinning-dump-instrument",
    {},
  );
  const [autoResetPageIndex, skipAutoResetPageIndex] = useSkipper();
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 25,
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get("inventory/dump-instrument");
      if (response.data.status && Array.isArray(response.data.data)) {
        setData(response.data.data);
      } else {
        setData([]);
      }
    } catch (err) {
      console.error("Error fetching dump instrument data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const table = useReactTable({
    data: data,
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
        setData((old) =>
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
      deleteRow: async (id) => {
        if (window.confirm("Are you sure you want to delete this dump record?")) {
          try {
            const response = await axios.delete(`inventory/delete-dump/${id}`);
            if (response.data.status) {
              toast.success(response.data.message || "Record deleted successfully");
              setData((old) => old.filter((row) => row.id !== id));
            } else {
              toast.error(response.data.message || "Failed to delete record");
            }
          } catch (err) {
            console.error("Error deleting item:", err);
            toast.error("An error occurred while deleting");
          }
        }
      },
      updateStatus: async (row, status) => {
        try {
          const payload = {
            id: Number(row.id),
            status: Number(status),
            typeofuse: Number(row.typeofuse_id || row.typeofuse),
            mminstid: row.mminstid || row.mminstrument_id ? Number(row.mminstid || row.mminstrument_id) : undefined,
            mlid: row.mlid || row.materiallocation_id ? Number(row.mlid || row.materiallocation_id) : undefined,
            dumpqty: Number(row.dumpqty),
          };
          
          const response = await axios.post("inventory/dump-approve-reject", payload);
          if (response.data.status) {
            toast.success(response.data.message || "Action successful");
            fetchData(); // Refresh the table
          } else {
            toast.error(response.data.message || "Action failed");
          }
        } catch (err) {
          console.error("Error updating status:", err);
          if (err.response?.status === 422) {
             // Let's show exactly what was in the row so we know what IDs are missing
             alert("Validation Failed. Row data available: " + JSON.stringify(row, null, 2));
             toast.error("Validation Error: Please check alert for missing IDs.");
          } else if (err.response?.data?.message) {
            toast.error(err.response.data.message);
          } else {
            toast.error("An error occurred while updating status");
          }
        }
      },
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

  return (
    <Page title="View Dump Instrument">
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
                Dumped Instruments
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
                        No records found
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
