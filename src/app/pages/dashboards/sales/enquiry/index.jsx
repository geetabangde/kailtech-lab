// Import Dependencies
import {
  flexRender,
  getCoreRowModel,
  getFacetedMinMaxValues,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getExpandedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import clsx from "clsx";
import { useState, useEffect, useCallback, Fragment } from "react";
import { useNavigate } from "react-router-dom";
import axios from "utils/axios";
import { toast } from "sonner";
import { RowActions } from "./RowActions";

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

export default function EnquiryList() {
  const { cardSkin } = useThemeContext();
  const navigate = useNavigate();
  const permissions = JSON.parse(localStorage.getItem("userPermissions") || "[]");

  useEffect(() => {
    if (!permissions.includes(91)) {
      navigate("/dashboards");
    }
  }, [navigate, permissions]);

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [tableSettings, setTableSettings] = useState(tableConfig);
  const [globalFilter, setGlobalFilter] = useState("");
  const [admins, setAdmins] = useState([]);
  const [selectedAssignee, setSelectedAssignee] = useState("");
  const [minDate, setMinDate] = useState("");
  const [maxDate, setMaxDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sorting, setSorting] = useState([{ id: "added_on", desc: true }]);
  const [columnVisibility, setColumnVisibility] = useLocalStorage(
    "col-vis-enquiry",
    {},
  );
  const [columnPinning, setColumnPinning] = useLocalStorage(
    "col-pin-enquiry",
    {},
  );
  const [autoResetPageIndex, skipAutoResetPageIndex] = useSkipper();
  const [isResponsive, setIsResponsive] = useLocalStorage("enquiry-responsive", false);
  const [expanded, setExpanded] = useState({});

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get("/sales/get-enquiry-list", {
        params: {
          searchByFromdate: minDate,
          searchByTodate: maxDate,
          assignto: selectedAssignee,
          status: statusFilter,
        }
      });
      if (
        (res.data.status === true || res.data.status === "true") &&
        Array.isArray(res.data.data)
      ) {
        setData(res.data.data);
      } else {
        setData([]);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load enquiries");
    } finally {
      setLoading(false);
    }
  }, [minDate, maxDate, selectedAssignee]);

  useEffect(() => {
    fetchData();
    // Fetch staff/BD for the filter
    axios.get("/people/get-customer-bd").then((res) => {
      if (res.data?.data) {
        setAdmins(res.data.data);
      }
    });
  }, [fetchData]);

  const table = useReactTable({
    data,
    columns,
    state: {
      globalFilter,
      sorting,
      columnVisibility: {
        ...columnVisibility,
        ...(isResponsive ? {
          enquirybyname: false,
          assigntoname: false,
          actions: false,
        } : {})
      },
      columnPinning,
      expanded,
    },
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
      isResponsive, // Pass to columns
    },
    onExpandedChange: setExpanded,
    getRowCanExpand: () => isResponsive,
    getExpandedRowModel: getExpandedRowModel(),
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
    onColumnVisibilityChange: setColumnVisibility,
    onColumnPinningChange: setColumnPinning,
    autoResetPageIndex,
  });

  useDidUpdate(() => table.resetRowSelection(), [data]);
  useLockScrollbar(tableSettings.enableFullScreen);

  if (loading) {
    return (
      <Page title="Manage Enquiry">
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
          Loading Enquiries...
        </div>
      </Page>
    );
  }

  return (
    <Page title="Manage Enquiry">
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
            admins={admins}
            selectedAssignee={selectedAssignee}
            setSelectedAssignee={setSelectedAssignee}
            minDate={minDate}
            setMinDate={setMinDate}
            maxDate={maxDate}
            setMaxDate={setMaxDate}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            isResponsive={isResponsive}
            setIsResponsive={setIsResponsive}
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
                        <Fragment key={row.id}>
                          <Tr
                            className={clsx(
                              "dark:border-b-dark-500 relative border-y border-transparent border-b-gray-200",
                              row.getIsSelected() && "row-selected bg-primary-50 dark:bg-primary-900/10",
                            )}
                          >
                            {row.getVisibleCells().map((cell) => (
                              <Td
                                key={cell.id}
                                className={clsx(
                                  "relative bg-white text-sm",
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
                          {/* Expanded Row Content */}
                          {row.getIsExpanded() && (
                            <Tr className="bg-gray-50/50 dark:bg-dark-800/50 border-b border-gray-100 dark:border-dark-600">
                              <Td colSpan={row.getVisibleCells().length}>
                                <div className="p-4 space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                    <span className="text-sm font-bold text-gray-800 dark:text-dark-100 w-44 shrink-0">
                                      Enquiry Recieved By:
                                    </span>
                                    <span className="text-sm text-gray-600 dark:text-dark-300">
                                      {row.original.enquirybyname || "-"}
                                    </span>
                                  </div>
                                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                    <span className="text-sm font-bold text-gray-800 dark:text-dark-100 w-44 shrink-0">
                                      Assign To:
                                    </span>
                                    <span className="text-sm text-gray-600 dark:text-dark-300">
                                      {row.original.assigntoname || "-"}
                                    </span>
                                  </div>
                                  <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 pt-2 border-t border-gray-100 dark:border-dark-600">
                                    <span className="text-sm font-bold text-gray-800 dark:text-dark-100 w-44 shrink-0 mt-1">
                                      Action:
                                    </span>
                                    <div className="flex flex-wrap gap-2">
                                      <RowActions row={row} table={table} />
                                    </div>
                                  </div>
                                </div>
                              </Td>
                            </Tr>
                          )}
                        </Fragment>
                      ))
                    ) : (
                      <Tr>
                        <Td
                          colSpan={table.getVisibleFlatColumns().length}
                          className="dark:text-dark-400 py-10 text-center text-sm text-gray-500"
                        >
                          No enquiries found.
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
