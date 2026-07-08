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
import { useRef, useState, useEffect, useCallback } from "react";
import axios from "utils/axios";
import { useNavigate, useSearchParams } from "react-router";
import { TableSortIcon } from "components/shared/table/TableSortIcon";
import { PaginationSection } from "components/shared/table/PaginationSection";
import { Button, Card, Table, THead, TBody, Th, Tr, Td } from "components/ui";
import { useLockScrollbar, useLocalStorage, useDidUpdate } from "hooks";
import { fuzzyFilter } from "utils/react-table/fuzzyFilter";
import { useSkipper } from "utils/react-table/useSkipper";

// Column Definitions
const createColumns = (navigate, handleView, handleAddObservation) => [
  {
    accessorKey: "index",
    header: "S.No",
    size: 80,
    cell: ({ row }) => row.index + 1,
  },
  {
    accessorKey: "name",
    header: "Name",
    size: 300,
    cell: ({ row }) => row.original.name || "N/A",
  },
  {
    accessorKey: "year",
    header: "Year",
    size: 120,
    cell: ({ row }) => row.original.year || "N/A",
  },
  {
    accessorKey: "month",
    header: "Month",
    size: 150,
    cell: ({ row }) => row.original.month || "N/A",
  },
  {
    accessorKey: "actions",
    header: "Actions",
    size: 250,
    enableSorting: false,
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Button
          className="h-8 space-x-1.5 rounded-md px-3 text-xs"
          style={{ backgroundColor: '#00a651', color: 'white' }}
          onClick={() => handleView(row.original)}
        >
          <span>View</span>
        </Button>
        <Button
          className="h-8 space-x-1.5 rounded-md px-3 text-xs"
          style={{ backgroundColor: '#ff9800', color: 'white' }}
          onClick={() => handleAddObservation(row.original)}
        >
          <span>Add Observation</span>
        </Button>
      </div>
    ),
  },
];

export default function ViewPlanner() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Extract URL parameters
  // The URL uses fid and cid, but API expects instid and validityid
  const instid = searchParams.get('fid');
  const validityid = searchParams.get('cid');

  const [autoResetPageIndex] = useSkipper();

  const [checkData, setCheckData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [tableSettings, setTableSettings] = useState({
    enableSorting: true,
    enableColumnFilters: true,
    enableFullScreen: false,
    enableRowDense: false,
  });

  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState([]);

  // Pagination state
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const [columnVisibility, setColumnVisibility] = useLocalStorage(
    "column-visibility-view-planner",
    {}
  );

  const [columnPinning, setColumnPinning] = useLocalStorage(
    "column-pinning-view-planner",
    {}
  );

  const cardRef = useRef();

  // Handlers for View and Add Observation buttons
  const handleView = (row) => {
    console.log("View clicked for:", row);
    // Navigate to view intermediate check page with the index from API
    navigate(`/dashboards/material-list/electro-technical/maintenance-equipment-history/view-planner-intermediate-check?hakuna=${row.index}`);
  };

  const handleAddObservation = (row) => {
    console.log("Add Observation clicked for:", row);
    // Navigate to add observation page with the index parameter
    navigate(`/dashboards/material-list/electro-technical/maintenance-equipment-history/add-observation?hakuna=${row.index}`);
  };

  // API call function
  const fetchPlannerData = useCallback(async () => {
    if (!instid || !validityid) {
      console.warn("Missing required parameters: instid or validityid");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const response = await axios.get(
        `/material/intermidiatecheck-detail?instid=${instid}&validityid=${validityid}`
      );

      if (response.data && response.data.success) {
        setCheckData(response.data.data || []);
      } else {
        console.warn("Unexpected response structure:", response.data);
        setCheckData([]);
      }
    } catch (err) {
      console.error("Error fetching planner data:", err);
      setCheckData([]);
    } finally {
      setLoading(false);
    }
  }, [instid, validityid]);

  // Fetch data on mount
  useEffect(() => {
    fetchPlannerData();
  }, [fetchPlannerData]);

  // Handler for Back button
  const handleBack = () => {
    navigate(-1);
  };

  const columns = createColumns(navigate, handleView, handleAddObservation);

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
        Loading Data...
      </div>
    );
  }

  return (
    <div className="transition-content grid grid-cols-1 grid-rows-[auto_auto_1fr] px-[var(--margin-x)] py-4">
      <div className="flex items-center justify-between space-x-4 mb-4">
        <div className="min-w-0 flex items-center gap-3">
          <h2 className="truncate text-xl font-medium tracking-wide text-gray-800 dark:text-dark-50">
            View Intermediate Check
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
                      </Th>
                    ))}
                  </Tr>
                ))}
              </THead>
              <TBody>
                {table.getRowModel().rows.length > 0 ? (
                  table.getRowModel().rows.map((row) => (
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
                  ))
                ) : (
                  <Tr>
                    <Td colSpan={5} className="text-center py-8 text-gray-500">
                      No data available
                    </Td>
                  </Tr>
                )}
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