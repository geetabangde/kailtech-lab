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
import { toast } from "sonner";
import { Link } from "react-router-dom";
import Select from "react-select";

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
import { statusOptions, leaveTypeOptions } from "./data";

// ----------------------------------------------------------------------

const customSelectStyles = {
  control: (base, state) => ({
    ...base,
    minHeight: "36px",
    height: "36px",
    borderColor: state.isFocused ? "#3b82f6" : "#d1d5db",
    boxShadow: state.isFocused ? "0 0 0 1px rgba(59, 130, 246, 0.5)" : "none",
    "&:hover": {
      borderColor: "#3b82f6",
    },
    borderRadius: "0.375rem",
    fontSize: "0.875rem",
    color: "#374151",
  }),
  valueContainer: (base) => ({
    ...base,
    padding: "0 8px",
    height: "36px",
  }),
  indicatorsContainer: (base) => ({
    ...base,
    height: "36px",
  }),
  menu: (base) => ({
    ...base,
    zIndex: 9999,
  }),
  menuPortal: (base) => ({
    ...base,
    zIndex: 9999,
  }),
};

// ----------------------------------------------------------------------

export default function MyLeaves() {
  const [leavesData, setLeavesData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form Filter State
  const [statusInput, setStatusInput] = useState("");
  const [leaveTypeInput, setLeaveTypeInput] = useState("");
  const [activeFilters, setActiveFilters] = useState({ status: "", leavetype: "" });

  const [tableSettings, setTableSettings] = useState({
    enableFullScreen: false,
    enableRowDense: false,
  });
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState([{ id: "s_no", desc: false }]);
  const [columnVisibility, setColumnVisibility] = useLocalStorage(
    "column-visibility-profile-my-leaves",
    {},
  );
  const [columnPinning, setColumnPinning] = useLocalStorage(
    "column-pinning-profile-my-leaves",
    {},
  );
  const [autoResetPageIndex, skipAutoResetPageIndex] = useSkipper();
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const fetchLeaves = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (activeFilters.status !== "") params.status = activeFilters.status;
      if (activeFilters.leavetype !== "") params.leavetype = activeFilters.leavetype;

      const res = await axios.get("profile/my-leaves", { params });

      if (res.data.status && Array.isArray(res.data.data)) {
        setLeavesData(res.data.data);
      } else {
        setLeavesData([]);
      }
    } catch (err) {
      console.error("Error loading my leaves:", err);
      toast.error("Failed to load leave records");
      setLeavesData([]);
    } finally {
      setLoading(false);
    }
  }, [activeFilters]);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  const handleGo = (e) => {
    if (e) e.preventDefault();
    setActiveFilters({
      status: statusInput,
      leavetype: leaveTypeInput,
    });
  };

  const table = useReactTable({
    data: leavesData,
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
        setLeavesData((old) =>
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

  return (
    <Page title="My Leaves">
      <div className="transition-content w-full pb-5">
        <div
          className={clsx(
            "flex h-full w-full flex-col",
            tableSettings.enableFullScreen &&
            "fixed inset-0 z-61 bg-white pt-3 dark:bg-dark-900",
          )}
        >
          <Card className="border-none shadow-soft dark:bg-dark-700">
            {/* Header section with Title & Apply Leave Button */}
            <div className="card-header flex flex-col items-start justify-between gap-4 border-b border-gray-200 p-4 dark:border-dark-500 sm:flex-row sm:items-center sm:p-5">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-gray-800 dark:text-dark-100">
                  Leave
                </h3>
              </div>

              <div className="flex w-full flex-wrap items-center justify-end gap-3 sm:w-auto">
                <Link to="/dashboards/profile/my-leaves/apply">
                  <Button
                    color="info"
                    className="!bg-blue-600 hover:!bg-blue-700 text-white font-bold shadow-sm h-9 px-4 flex items-center gap-1.5"
                  >
                    + Apply Leave
                  </Button>
                </Link>
              </div>
            </div>

            {/* Filter Section */}
            <div className="px-4 pt-4 pb-4 sm:px-5 sm:pt-5 border-b border-gray-150 dark:border-dark-500">
              <form
                onSubmit={handleGo}
                className="flex flex-col gap-4 sm:flex-row sm:items-end"
              >
                <div className="flex-1 min-w-[180px]">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-dark-300 mb-1.5">
                    Status
                  </label>
                  <Select
                    styles={customSelectStyles}
                    options={statusOptions}
                    value={statusOptions.find((opt) => opt.value === statusInput) || null}
                    onChange={(opt) => setStatusInput(opt ? opt.value : "")}
                    placeholder="Select Status"
                    isClearable
                    isSearchable
                    className="w-full text-sm"
                  />
                </div>

                <div className="flex-1 min-w-[180px]">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-dark-300 mb-1.5">
                    Leave Type
                  </label>
                  <Select
                    styles={customSelectStyles}
                    options={leaveTypeOptions}
                    value={leaveTypeOptions.find((opt) => opt.value === leaveTypeInput) || null}
                    onChange={(opt) => setLeaveTypeInput(opt ? opt.value : "")}
                    placeholder="Select Leave Type"
                    isClearable
                    isSearchable
                    className="w-full text-sm"
                  />
                </div>

                <div className="flex shrink-0 gap-3">
                  <Button
                    type="submit"
                    color="primary"
                    className="!bg-blue-600 hover:!bg-blue-700 text-white font-bold h-9 px-6 shadow-sm"
                  >
                    Go
                  </Button>
                </div>

                <div className="relative ml-auto w-full sm:w-64 max-sm:mt-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-dark-300 mb-1.5 max-sm:hidden">
                    &nbsp;
                  </label>
                  <input
                    type="text"
                    value={globalFilter ?? ""}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    placeholder="Search leaves..."
                    className="form-input w-full rounded-lg border-gray-300 bg-white px-4 h-9 text-sm focus:border-primary-500 focus:ring-primary-500 dark:border-dark-400 dark:bg-dark-800 dark:text-dark-100"
                  />
                </div>

                <div className="flex items-end h-9">
                  <TableConfig table={table} />
                </div>
              </form>
            </div>

            {/* Table wrapper */}
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
                            "bg-gray-55 text-xs font-bold uppercase text-gray-600 dark:bg-dark-800 dark:text-dark-200 align-top",
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
                        className="border-b border-gray-200 hover:bg-gray-55/50 dark:border-dark-500 dark:hover:bg-dark-600/50"
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
                        No leave records found
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
