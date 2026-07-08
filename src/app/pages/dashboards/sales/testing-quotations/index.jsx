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
import { useNavigate, useLocation } from "react-router-dom";
import axios from "utils/axios";
import { toast } from "sonner";

// Local Imports
import { Table, Card, THead, TBody, Th, Tr, Td } from "components/ui";
import { TableSortIcon } from "components/shared/table/TableSortIcon";
import { Page } from "components/shared/Page";
import { useLockScrollbar, useDidUpdate, useLocalStorage } from "hooks";
import { fuzzyFilter } from "utils/react-table/fuzzyFilter";
import { useSkipper } from "utils/react-table/useSkipper";
import { PaginationSection } from "components/shared/table/PaginationSection";
import { useThemeContext } from "app/contexts/theme/context";

import { columns } from "./columns";
import { Toolbar } from "./Toolbar";
import { tableConfig } from "./TableConfig";
import { SelectedRowsActions } from "./SelectedRowsActions";

// ----------------------------------------------------------------------

export default function TestingQuotationList() {
  const { cardSkin } = useThemeContext();
  const navigate = useNavigate();
  const location = useLocation();
  const permissions = JSON.parse(localStorage.getItem("userPermissions") || "[]");

  useEffect(() => {
    if (!permissions.includes(141)) {
      navigate("/dashboards");
    }
  }, [navigate, permissions]);

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [tableSettings, setTableSettings] = useState(tableConfig);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState([{ id: "id", desc: true }]);
  const [columnVisibility, setColumnVisibility] = useLocalStorage(
    "col-vis-testing-quotation",
    {},
  );
  const [columnPinning, setColumnPinning] = useLocalStorage(
    "col-pin-testing-quotation",
    {},
  );
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  
  // New Filters
  const [minDate, setMinDate] = useState("");
  const [maxDate, setMaxDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [autoResetPageIndex, skipAutoResetPageIndex] = useSkipper();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch ALL data - client-side pagination
      const params = {
        // Remove pagination parameters - fetch everything
        searchByFromdate: minDate,
        searchByTodate: maxDate,
      };

      // Status filter via column search (PHP uses $_GET['columns'][1]["search"]["value"])
      if (statusFilter) {
        params.columns = [
          { search: { value: '' } }, // Column 0
          { search: { value: statusFilter } }, // Column 1 - Status
        ];
      }

      // PHP: if(!(in_array("346", $permissions) || (in_array(394, $permissions)))) { $search .= " and (tquotations.added_by='".$_SESSION['employee']."' )"; }
      const hasPermission346 = permissions.includes(346);
      const hasPermission394 = permissions.includes(394);
      
      if (!hasPermission346 && !hasPermission394) {
        // User can only see their own data
        const employeeId = localStorage.getItem('employee') || localStorage.getItem('userId');
        if (employeeId) {
          params.added_by = employeeId;
        }
      }

      // Add sorting parameters - PHP column mapping: [id, customer, ctype, specificpurpose, enquirydate, '']
      if (sorting.length > 0) {
        const columnMapping = {
          'id': 0,
          'quotationno': 1, 
          'customer': 2,
          'ctype': 3,
          'specificpurpose': 4,
          'enquirydate': 5
        };
        
        params.order = [{
          column: columnMapping[sorting[0].id] ?? 0,
          dir: sorting[0].desc ? 'desc' : 'asc'
        }];
      }

      // Add search parameter - PHP: searches across customers.name, tquotations.customername, customertypes.name, specificpurposes.name
      if (globalFilter) {
        params.search = {
          value: globalFilter
        };
      }

      
      const res = await axios.get("/sales/testing-quotation-list", { params });
      
      if (res.data && res.data.data) {
        const rawData = res.data.data;
        setData(rawData);
      } else {
        setData([]);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load testing quotations");
    } finally {
      setLoading(false);
    }
  }, [sorting, globalFilter, minDate, maxDate, statusFilter, permissions]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Refetch data when navigating back to this page (e.g., after editing a revision)
  useEffect(() => {
    // Check if we're coming back from an edit page
    if (location.state?.refetch) {
      fetchData();
      // Clear the state to prevent repeated refetches
      window.history.replaceState({}, document.title);
    }
  }, [location, fetchData]);

  // Refetch data when tab becomes visible again
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchData]);

  const table = useReactTable({
    data,
    columns,
    state: {
      globalFilter,
      sorting,
      columnVisibility,
      columnPinning,
      pagination,
    },
    // Client-side pagination, sorting, and filtering
    manualPagination: false, // Let React Table handle pagination
    manualSorting: false, // Let React Table handle sorting
    manualFiltering: false, // Let React Table handle filtering
    meta: {
      updateData: (rowIndex, columnId, value) => {
        skipAutoResetPageIndex();
        setData((old) =>
          old.map((row, i) =>
            i === rowIndex ? { ...old[rowIndex], [columnId]: value } : row,
          ),
        );
      },
      deleteRow: (row) => {
        skipAutoResetPageIndex();
        setData((old) => old.filter((r) => r.id !== row.original.id));
      },
      deleteRows: (rows) => {
        skipAutoResetPageIndex();
        const idsToDelete = rows.map((r) => r.original.id);
        setData((old) => old.filter((r) => !idsToDelete.includes(r.id)));
        toast.success(`${rows.length} rows deleted locally`);
      },
      refetch: fetchData,
      setTableSettings,
    },
    filterFns: { fuzzy: fuzzyFilter },
    globalFilterFn: fuzzyFilter,
    enableSorting: tableSettings.enableSorting,
    enableColumnFilters: tableSettings.enableColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnPinningChange: setColumnPinning,
    autoResetPageIndex,
  });

  useDidUpdate(() => table.resetRowSelection(), [data]);
  useLockScrollbar(tableSettings.enableFullScreen);

  if (loading) {
    return (
      <Page title="Testing Quotations">
        <div className="flex h-[60vh] items-center justify-center text-gray-600">
          <svg
            className="mr-2 h-6 w-6 animate-spin text-blue-600"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z"
            />
          </svg>
          Loading Testing Quotations...
        </div>
      </Page>
    );
  }

  return (
    <Page title="Testing Quotations">
      <div className="transition-content w-full pb-5">
        <div
          className={clsx(
            "flex h-full w-full flex-col",
            tableSettings.enableFullScreen &&
              "dark:bg-dark-900 fixed inset-0 z-61 bg-white pt-3",
          )}
        >
          {/* ── Toolbar ── */}
          <Toolbar 
            table={table} 
            globalFilter={globalFilter} 
            setGlobalFilter={setGlobalFilter}
            minDate={minDate}
            setMinDate={setMinDate}
            maxDate={maxDate}
            setMaxDate={setMaxDate}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
          />

          <div
            className={clsx(
              "transition-content flex grow flex-col pt-1",
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
                  className="w-full text-left"
                >
                  <THead>
                    {table.getHeaderGroups().map((hg) => (
                      <Tr key={hg.id}>
                        {hg.headers.map((header) => (
                          <Th
                            key={header.id}
                            className={clsx(
                              "dark:bg-dark-800 dark:text-dark-100 bg-gray-200 font-semibold text-gray-800 uppercase first:ltr:rounded-tl-lg last:ltr:rounded-tr-lg",
                              header.column.getIsPinned() && "sticky right-0 z-10 bg-gray-200 dark:bg-dark-800 shadow-[-4px_0_10px_-4px_rgba(0,0,0,0.1)]",
                            )}
                          >
                            {header.column.getCanSort() ? (
                              <div
                                className="flex cursor-pointer items-center space-x-3 select-none"
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
                          className={clsx(
                            "dark:border-b-dark-500 relative border-y border-transparent border-b-gray-200",
                            row.getIsSelected() && "row-selected bg-primary-50 dark:bg-primary-900/10",
                          )}
                        >
                          {row.getVisibleCells().map((cell) => (
                            <Td
                              key={cell.id}
                              className={clsx(
                                "relative bg-white",
                                cardSkin === "shadow"
                                  ? "dark:bg-dark-700"
                                  : "dark:bg-dark-900",
                                cell.column.getIsPinned() && "sticky right-0 z-10 shadow-[-4px_0_10px_-4px_rgba(0,0,0,0.1)]",
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
                          className="dark:text-dark-400 py-10 text-center text-sm text-gray-500"
                        >
                          No quotations found.
                        </Td>
                      </Tr>
                    )}
                  </TBody>
                </Table>
              </div>

              {table.getCoreRowModel().rows.length > 0 && (
                <div className="px-4 pt-4 pb-4 sm:px-5">
                  <PaginationSection table={table} />
                </div>
              )}
            </Card>
          </div>
          <SelectedRowsActions table={table} />
        </div>
      </div>
    </Page>
  );
}
