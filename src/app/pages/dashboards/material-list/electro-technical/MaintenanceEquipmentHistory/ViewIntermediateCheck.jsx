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
import {  useRef, useState, useEffect, useCallback, useMemo } from "react";
import axios from "utils/axios";

import { TableSortIcon } from "components/shared/table/TableSortIcon";
import { ColumnFilter } from "components/shared/table/ColumnFilter";
import { PaginationSection } from "components/shared/table/PaginationSection";
import { Button, Card, Table, THead, TBody, Th, Tr, Td } from "components/ui";
import {
  useLockScrollbar,
  useLocalStorage,
  useDidUpdate,
} from "hooks";
import { fuzzyFilter } from "utils/react-table/fuzzyFilter";
import { useSkipper } from "utils/react-table/useSkipper";
import { useNavigate, useSearchParams } from "react-router";





export default function ViewIntermediateCheck() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const fid = searchParams.get('fid');
  const cid = searchParams.get('cid');
  // ❌ labId removed

  const [autoResetPageIndex] = useSkipper();

  const [checkData, setCheckData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recordsFiltered, setRecordsFiltered] = useState(0);

  const [tableSettings, setTableSettings] = useState({
    enableSorting: true,
    enableColumnFilters: true,
    enableFullScreen: false,
    enableRowDense: false,
  });

  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState([]);

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const [columnVisibility, setColumnVisibility] = useLocalStorage(
    "column-visibility-intermediate-check",
    {},
  );

  const [columnPinning, setColumnPinning] = useLocalStorage(
    "column-pinning-intermediate-check",
    {},
  );

  const cardRef = useRef();

  // ✅ labId removed from dependencies
  const columns = useMemo(() => [
    {
      accessorKey: "index",
      header: "ID",
      size: 60,
    },
    {
      accessorKey: "name",
      header: "Name",
      size: 200,
    },
    {
      accessorKey: "idno",
      header: "ID No",
      size: 150,
    },
    {
      accessorKey: "year",
      header: "Year",
      size: 80,
    },
    {
      id: "jan",
      header: "Jan",
      cell: ({ row }) => (
        <div className="text-center">
          {row.original.months["1"] && (
            <span className="text-green-500 text-lg font-bold">✓</span>
          )}
        </div>
      ),
      size: 60,
    },
    {
      id: "feb",
      header: "Feb",
      cell: ({ row }) => (
        <div className="text-center">
          {row.original.months["2"] && (
            <span className="text-green-500 text-lg font-bold">✓</span>
          )}
        </div>
      ),
      size: 60,
    },
    {
      id: "mar",
      header: "Mar",
      cell: ({ row }) => (
        <div className="text-center">
          {row.original.months["3"] && (
            <span className="text-green-500 text-lg font-bold">✓</span>
          )}
        </div>
      ),
      size: 60,
    },
    {
      id: "apr",
      header: "Apr",
      cell: ({ row }) => (
        <div className="text-center">
          {row.original.months["4"] && (
            <span className="text-green-500 text-lg font-bold">✓</span>
          )}
        </div>
      ),
      size: 60,
    },
    {
      id: "may",
      header: "May",
      cell: ({ row }) => (
        <div className="text-center">
          {row.original.months["5"] && (
            <span className="text-green-500 text-lg font-bold">✓</span>
          )}
        </div>
      ),
      size: 60,
    },
    {
      id: "jun",
      header: "Jun",
      cell: ({ row }) => (
        <div className="text-center">
          {row.original.months["6"] && (
            <span className="text-green-500 text-lg font-bold">✓</span>
          )}
        </div>
      ),
      size: 60,
    },
    {
      id: "jul",
      header: "Jul",
      cell: ({ row }) => (
        <div className="text-center">
          {row.original.months["7"] && (
            <span className="text-green-500 text-lg font-bold">✓</span>
          )}
        </div>
      ),
      size: 60,
    },
    {
      id: "aug",
      header: "Aug",
      cell: ({ row }) => (
        <div className="text-center">
          {row.original.months["8"] && (
            <span className="text-green-500 text-lg font-bold">✓</span>
          )}
        </div>
      ),
      size: 60,
    },
    {
      id: "sep",
      header: "Sep",
      cell: ({ row }) => (
        <div className="text-center">
          {row.original.months["9"] && (
            <span className="text-green-500 text-lg font-bold">✓</span>
          )}
        </div>
      ),
      size: 60,
    },
    {
      id: "oct",
      header: "Oct",
      cell: ({ row }) => (
        <div className="text-center">
          {row.original.months["10"] && (
            <span className="text-green-500 text-lg font-bold">✓</span>
          )}
        </div>
      ),
      size: 60,
    },
    {
      id: "nov",
      header: "Nov",
      cell: ({ row }) => (
        <div className="text-center">
          {row.original.months["11"] && (
            <span className="text-green-500 text-lg font-bold">✓</span>
          )}
        </div>
      ),
      size: 60,
    },
    {
      id: "dec",
      header: "Dec",
      cell: ({ row }) => (
        <div className="text-center">
          {row.original.months["12"] && (
            <span className="text-green-500 text-lg font-bold">✓</span>
          )}
        </div>
      ),
      size: 60,
    },
    {
      accessorKey: "remark",
      header: "Remark",
      size: 150,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center justify-center gap-2">
          <button
            style={{ cursor: "pointer" }}
            onClick={() => {
              // ✅ labId removed from URL
              navigate(
                `/dashboards/material-list/electro-technical/maintenance-equipment-history/view-planner?index=${row.original.index}&fid=${fid}&cid=${cid}`
              );
            }}
            className="px-3 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 transition-colors"
          >
            View
          </button>
          <button
            style={{ cursor: "pointer" }}
            onClick={() => {
              // ✅ labId removed from URL
              navigate(
                `/dashboards/material-list/electro-technical/maintenance-equipment-history/edit-imc?index=${row.original.index}&fid=${fid}&cid=${cid}`
              );
            }}
            className="px-3 py-1 bg-orange-500 text-white rounded text-xs hover:bg-orange-600 transition-colors"
          >
            Edit
          </button>
        </div>
      ),
      size: 120,
    },
  ], [navigate, fid, cid]); // ✅ labId removed from dependencies

  const fetchIntermediateCheckData = useCallback(async () => {
    try {
      setLoading(true);

      const response = await axios.get(
        `/material/intermidiatecheck-planner-view`,
        {
          params: {
            draw: 1,
            start: pagination.pageIndex * pagination.pageSize,
            length: pagination.pageSize,
            "search[value]": globalFilter,
          },
        }
      );

      if (response.data && response.data.success) {
        setCheckData(
          Array.isArray(response.data.data) ? response.data.data : []
        );
        setRecordsFiltered(response.data.data?.length || 0);
      } else {
        console.warn("Unexpected response structure:", response.data);
        setCheckData([]);
      }
    } catch (err) {
      console.error("Error fetching intermediate check data:", err);
      setCheckData([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.pageIndex, pagination.pageSize, globalFilter]);

  useEffect(() => {
    fetchIntermediateCheckData();
  }, [fetchIntermediateCheckData]);

  const handleBack = () => {
    if (fid && cid) {
      // ✅ labId removed from URL
      navigate(`/dashboards/material-list/electro-technical/maintenance-equipment-history/add-imc?fid=${fid}&cid=${cid}`);
    } else {
      navigate("/dashboards/material-list/electro-technical");
    }
  };

  const table = useReactTable({
    data: checkData,
    columns: columns,
    state: {
      globalFilter,
      sorting,
      columnVisibility,
      columnPinning,
      tableSettings,
      pagination,
    },
    meta: {
      setTableSettings,
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
    onPaginationChange: setPagination,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnPinningChange: setColumnPinning,
    autoResetPageIndex,
    pageCount: Math.ceil(recordsFiltered / pagination.pageSize),
    manualPagination: false,
  });

  useDidUpdate(() => table.resetRowSelection(), [checkData]);
  useLockScrollbar(tableSettings.enableFullScreen);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-gray-600">
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
        Loading Intermediate Check Data...
      </div>
    );
  }

  return (
    <div className="transition-content grid grid-cols-1 grid-rows-[auto_auto_1fr] px-[var(--margin-x)] py-4">
      <div className="flex items-center justify-between space-x-4 mb-4">
        <div className="min-w-0 flex items-center gap-3">
          <h2 className="truncate text-xl font-medium tracking-wide text-gray-800 dark:text-dark-50">
            View Intermediate Check Planner
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            className="h-8 space-x-1.5 rounded-md px-3 text-xs"
            color="primary"
            onClick={handleBack}
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            <span>Back</span>
          </Button>
        </div>
      </div>

      <div
        className={clsx(
          "flex flex-col pt-4",
          tableSettings.enableFullScreen &&
          "fixed inset-0 z-61 h-full w-full bg-white pt-3 dark:bg-dark-900"
        )}
      >
        <Card
          className={clsx(
            "relative mt-3 flex grow flex-col",
            tableSettings.enableFullScreen && "overflow-hidden"
          )}
          ref={cardRef}
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
                          "bg-gray-200 font-semibold uppercase text-gray-800 dark:bg-dark-800 dark:text-dark-100"
                        )}
                      >
                        {header.column.getCanSort() ? (
                          <div
                            className="flex cursor-pointer select-none items-center space-x-3"
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            <span className="flex-1">
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                            </span>
                            <TableSortIcon
                              sorted={header.column.getIsSorted()}
                            />
                          </div>
                        ) : (
                          flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )
                        )}
                        {header.column.getCanFilter() ? (
                          <ColumnFilter column={header.column} />
                        ) : null}
                      </Th>
                    ))}
                  </Tr>
                ))}
              </THead>
              <TBody>
                {table.getRowModel().rows.map((row) => (
                  <Tr key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <Td key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </Td>
                    ))}
                  </Tr>
                ))}
              </TBody>
            </Table>
          </div>
          {checkData.length > 0 && (
            <div className="px-4 pb-4 sm:px-5 sm:pt-4 pt-4">
              <PaginationSection table={table} />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}