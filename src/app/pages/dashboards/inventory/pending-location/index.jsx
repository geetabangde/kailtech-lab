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
import { MapPin } from "lucide-react";

// Local Imports
import { Table, THead, TBody, Th, Tr, Td, Card, Button } from "components/ui";
import { TableSortIcon } from "components/shared/table/TableSortIcon";
import { Page } from "components/shared/Page";
import { useLockScrollbar, useLocalStorage } from "hooks";
import { fuzzyFilter } from "utils/react-table/fuzzyFilter";
import { useSkipper } from "utils/react-table/useSkipper";
import { columns } from "./columns";
import { PaginationSection } from "components/shared/table/PaginationSection";
import { TableLoadingRow } from "components/shared/table/TableLoadingRow";
import { LocateInstrumentModal } from "./LocateInstrumentModal";

// ----------------------------------------------------------------------

function usePermissions() {
  const p = localStorage.getItem("userPermissions");
  try {
    return JSON.parse(p) || [];
  } catch {
    return p?.split(",").map(Number) || [];
  }
}

export default function PendingLocation() {
  const permissions = usePermissions();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isLocateModalOpen, setIsLocateModalOpen] = useState(false);
  const [locateModalData, setLocateModalData] = useState([]);

  const [tableSettings, setTableSettings] = useState({
    enableFullScreen: false,
    enableRowDense: false,
  });

  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState([{ id: "name", desc: false }]);
  const [columnVisibility, setColumnVisibility] = useLocalStorage(
    "column-visibility-pending-location",
    {},
  );
  const [columnPinning, setColumnPinning] = useLocalStorage(
    "column-pinning-pending-location",
    {},
  );
  const [autoResetPageIndex, skipAutoResetPageIndex] = useSkipper();
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 100,
  });

  const fetchPendingLocation = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get("inventory/pending-for-location");
      if ((response.data.status === "true" || response.data.status === true) && Array.isArray(response.data.data)) {
        const items = response.data.data;
        
        // Collect unique numeric unit IDs
        const unitIdsToFetch = [...new Set(items.map(item => item.unit).filter(unit => /^\d+$/.test(String(unit))))];
        
        // Fetch the corresponding names for those numeric IDs concurrently
        const unitMap = {};
        await Promise.all(
          unitIdsToFetch.map(async (id) => {
            try {
              const res = await axios.get(`master/get-unit-byid/${id}`);
              if (res.data?.status === "true" && res.data?.data) {
                unitMap[id] = res.data.data.name || res.data.data.description;
              }
            } catch (e) {
              console.error(`Failed to fetch Unit for id ${id}`, e);
            }
          })
        );

        // Replace the numeric IDs with their actual names in the dataset
        const updatedItems = items.map(item => {
          if (/^\d+$/.test(String(item.unit)) && unitMap[item.unit]) {
            return { ...item, unit: unitMap[item.unit] };
          }
          return item;
        });

        setOrders(updatedItems);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error("Error fetching pending location data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingLocation();
  }, [fetchPendingLocation]);

  const handleLocateInstrument = async () => {
    const selectedRows = table.getSelectedRowModel().rows;
    const ids = selectedRows.map(row => row.original.locationid);

    if (ids.length === 0) {
      alert("Please select at least one item");
      return;
    }

    try {
      setLoading(true);
      const params = new URLSearchParams();
      ids.forEach(id => params.append('id[]', id));
      const response = await axios.get(`inventory/get-locate-instrument?${params.toString()}`);
      
      console.log("Locate API Response:", response.data);
      if (response.data.status) {
        const items = response.data.data;
        
        // Fetch actual unit names for any numeric unit IDs
        const unitIdsToFetch = [...new Set(items.map((item) => item.unit).filter((u) => u && !isNaN(Number(u))))];
        const uomMap = {};
        
        await Promise.all(
          unitIdsToFetch.map(async (unitId) => {
            try {
              const uomResponse = await axios.get(`master/get-unit-byid/${unitId}`);
              if (uomResponse.data?.status === "true" || uomResponse.data?.status === true) {
                uomMap[unitId] = uomResponse.data.data.name;
              }
            } catch (e) {
              console.error(`Failed to fetch unit ID ${unitId}`, e);
            }
          })
        );

        const finalData = items.map((item) => ({
          ...item,
          unit: uomMap[item.unit] || item.unit,
        }));

        setLocateModalData(finalData);
        setIsLocateModalOpen(true);
      } else {
        alert(response.data.message || "Failed to fetch instruments for location.");
      }
    } catch (error) {
      console.error("Error fetching locate instruments:", error);
      const errorMsg = error.response?.data?.message || error.message || "An error occurred while fetching instruments for location.";
      alert(errorMsg);
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

  if (!permissions.includes(172)) {
    return (
      <Page title="Pending Location">
        <div className="flex h-60 items-center justify-center rounded-xl border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-sm font-medium text-red-600 dark:text-red-400">
            Access Denied - Permission 172 required
          </p>
        </div>
      </Page>
    );
  }

  return (
    <Page title="Pending Location">
      <div className="transition-content w-full pb-5">
        <div
          className={clsx(
            "flex h-full w-full flex-col",
            tableSettings.enableFullScreen &&
            "fixed inset-0 z-61 bg-white pt-3 dark:bg-dark-900",
          )}
        >
          <Card className="flex flex-col border-none shadow-soft dark:bg-dark-700">
            <div className="flex flex-col gap-4 border-b border-gray-200 p-4 dark:border-dark-500 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <h3 className="text-lg font-bold text-gray-800 dark:text-dark-100">
                MRN Items Pending For Location
              </h3>
              <Button
                onClick={handleLocateInstrument}
                color="info"
                size="sm"
                disabled={table.getSelectedRowModel().rows.length === 0}
                className="flex items-center gap-2"
              >
                <MapPin className="h-4 w-4" /> Locate Instrument
              </Button>
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
                        className={clsx(
                          "border-b border-gray-100 last:border-0 dark:border-dark-600",
                          row.getIsSelected() && "bg-primary-50 dark:bg-primary-900/10"
                        )}
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

      <LocateInstrumentModal
        isOpen={isLocateModalOpen}
        onClose={() => setIsLocateModalOpen(false)}
        instruments={locateModalData}
        onSuccess={() => {
          fetchPendingLocation();
          table.resetRowSelection();
        }}
      />
    </Page>
  );
}
