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
import { Search, RotateCcw } from "lucide-react";

// Local Imports
import { Table, THead, TBody, Th, Tr, Td, Button, Card, ReactSelect as Select } from "components/ui";
import { TableSortIcon } from "components/shared/table/TableSortIcon";
import { Page } from "components/shared/Page";
import { useLockScrollbar, useLocalStorage } from "hooks";
import { fuzzyFilter } from "utils/react-table/fuzzyFilter";
import { useSkipper } from "utils/react-table/useSkipper";
import { columns } from "./columns";
import { PaginationSection } from "components/shared/table/PaginationSection";
import { TableLoadingRow } from "components/shared/table/TableLoadingRow";

const SEARCH_OPTIONS = [
  { value: "All", label: "All" },
  { value: "cname", label: "Category name" },
  { value: "name", label: "Item Name" },
];

// ----------------------------------------------------------------------

export default function BufferItem() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tableSettings, setTableSettings] = useState({
    enableFullScreen: false,
    enableRowDense: false,
  });

  // Filter States
  const [filters, setFilters] = useState({
    searchIn: "All",
    searchTerm: "",
    start: "",
    end: "",
  });

  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState([{ id: "quantity", desc: false }]);

  const [columnVisibility, setColumnVisibility] = useLocalStorage(
    "column-visibility-buffer-item",
    {},
  );
  const [columnPinning, setColumnPinning] = useLocalStorage(
    "column-pinning-buffer-item",
    {},
  );
  const [autoResetPageIndex, skipAutoResetPageIndex] = useSkipper();
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 25,
  });

  const fetchData = useCallback(async (currentFilters) => {
    try {
      setLoading(true);
      const response = await axios.get("inventory/get-buffer-item", {
        params: {
          var1: currentFilters.searchIn,
          var2: currentFilters.searchTerm,
          start: currentFilters.start,
          end: currentFilters.end,
        }
      });
      if (response.data.status && Array.isArray(response.data.data)) {
        let filteredData = [...response.data.data];
        
        // Filter and sort to put matching items at the top when search term is provided
        if (currentFilters.searchTerm && currentFilters.searchIn !== "All") {
          const searchTermLower = currentFilters.searchTerm.toLowerCase();
          
          // First, filter to only include matching items
          filteredData = filteredData.filter((item) => {
            if (currentFilters.searchIn === "cname") {
              return item.cname?.toLowerCase().includes(searchTermLower);
            } else if (currentFilters.searchIn === "name") {
              return item.name?.toLowerCase().includes(searchTermLower);
            }
            return true;
          });
          
          // Then sort to put exact matches or starts-with matches first
          filteredData.sort((a, b) => {
            let aValue = currentFilters.searchIn === "cname" ? a.cname?.toLowerCase() : a.name?.toLowerCase();
            let bValue = currentFilters.searchIn === "cname" ? b.cname?.toLowerCase() : b.name?.toLowerCase();
            
            // Exact match first
            const aExact = aValue === searchTermLower;
            const bExact = bValue === searchTermLower;
            if (aExact && !bExact) return -1;
            if (!aExact && bExact) return 1;
            
            // Starts with second
            const aStarts = aValue?.startsWith(searchTermLower);
            const bStarts = bValue?.startsWith(searchTermLower);
            if (aStarts && !bStarts) return -1;
            if (!aStarts && bStarts) return 1;
            
            return 0;
          });
        }
        
        setData(filteredData);
      } else {
        setData([]);
      }
    } catch (err) {
      console.error("Error fetching buffer item data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(filters);
  }, []);

  const handleSearch = () => {
    fetchData(filters);
  };

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

  const handleReset = () => {
    setFilters({
      searchIn: "All",
      searchTerm: "",
      start: "",
      end: "",
    });
    fetchData({
      searchIn: "All",
      searchTerm: "",
      start: "",
      end: "",
    });
  };

  return (
    <Page title="Stock report">
      <div className="transition-content w-full pb-5 space-y-6">
        {/* Filters Card */}
        <Card className="p-4 sm:p-5">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 items-end">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Search in</label>
              <Select
                name="searchIn"
                value={filters.searchIn}
                options={SEARCH_OPTIONS}
                onChange={(val) => setFilters({ ...filters, searchIn: val || "All" })}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Search Term</label>
              <input
                type="text"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-primary-500 focus:outline-none dark:border-dark-600 dark:bg-dark-800 dark:text-dark-100 h-10"
                value={filters.searchTerm}
                onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Start Date</label>
              <input
                type="date"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-primary-500 focus:outline-none dark:border-dark-600 dark:bg-dark-800 dark:text-dark-100 h-10"
                value={filters.start}
                onChange={(e) => setFilters({ ...filters, start: e.target.value })}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">End Date</label>
              <input
                type="date"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-primary-500 focus:outline-none dark:border-dark-600 dark:bg-dark-800 dark:text-dark-100 h-10"
                value={filters.end}
                onChange={(e) => setFilters({ ...filters, end: e.target.value })}
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button
              color="secondary"
              variant="soft"
              onClick={handleReset}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" /> Reset
            </Button>
            <Button
              color="info"
              onClick={handleSearch}
              className="flex items-center gap-2"
            >
              <Search className="h-4 w-4" /> Go
            </Button>
          </div>
        </Card>

        {/* Data Table Card */}
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
                Stock report
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
