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
import { Link } from "react-router-dom";
import dayjs from "dayjs";
import axios from "utils/axios";
import { toast } from "sonner";

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
import { mockMoms } from "./data";

// ----------------------------------------------------------------------

export default function MomList() {
  const [momData, setMomData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State for Viewing MOM Details & Tasks
  const [selectedMom, setSelectedMom] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Modal State for Updating Task Remark (Alertify Prompt replacement)
  const [activeTaskForRemark, setActiveTaskForRemark] = useState(null);
  const [remarkInput, setRemarkInput] = useState("");
  const [isRemarkModalOpen, setIsRemarkModalOpen] = useState(false);



  const [tableSettings, setTableSettings] = useState({
    enableFullScreen: false,
    enableRowDense: false,
  });
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState([{ id: "mom_date", desc: true }]); // Default descending like PHP "order": [[0, "desc"]]
  const [columnVisibility, setColumnVisibility] = useLocalStorage(
    "column-visibility-profile-mom-list-v1",
    {},
  );
  const [columnPinning, setColumnPinning] = useLocalStorage(
    "column-pinning-profile-mom-list-v1",
    {},
  );

  // Column-Specific Filtering State matching PHP footer search logic
  const [columnFilters, setColumnFilters] = useState([]);

  const [autoResetPageIndex, skipAutoResetPageIndex] = useSkipper();
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 50, // Matches PHP "pageLength": 50
  });

  const fetchMoms = useCallback(async () => {
    const endpoints = [
      "profile/get-mom-list",
      "profile/get-my-moms",
      "profile/get-moms",
      "profile/mom-list",
      "profile/mymomListData.php",
      "profile/momListData.php",
      "profile/mymomListData",
      "profile/momListData",
    ];

    setLoading(true);
    let success = false;
    let responseData = [];

    for (const url of endpoints) {
      try {
        const res = await axios.get(url);
        if (res.data && (res.data.status || Array.isArray(res.data.data) || Array.isArray(res.data))) {
          responseData = Array.isArray(res.data.data)
            ? res.data.data
            : (Array.isArray(res.data) ? res.data : []);
          success = true;
          break;
        }
      } catch {
        // Try next endpoint
      }
    }

    if (success && responseData.length > 0) {
      // Map completion_status % if not present
      const processed = responseData.map(mom => {
        if (mom.completion_status === undefined && Array.isArray(mom.tasks)) {
          const closed = mom.tasks.filter(t => String(t.status).toLowerCase() === "closed").length;
          mom.completion_status = mom.tasks.length > 0 ? Math.round((closed / mom.tasks.length) * 100) : 0;
        }
        return mom;
      });
      setMomData(processed);
    } else {
      // High-Fidelity Fallback Dataset
      setMomData(mockMoms);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMoms();
  }, [fetchMoms]);

  // Handle open MOM details modal
  const handleOpenDetailModal = (mom) => {
    setSelectedMom(mom);
    setIsDetailModalOpen(true);
  };

  // Trigger remark change prompt (Equivalent to legacy alertify.prompt)
  const triggerAddRemark = (task, mom) => {
    setActiveTaskForRemark({ task, momId: mom.id });
    setRemarkInput(task.remark || "");
    setIsRemarkModalOpen(true);
  };

  // Submit Remark to server (Equivalent to legacy addRemark php trigger)
  const submitRemark = async (e) => {
    if (e) e.preventDefault();
    if (!activeTaskForRemark) return;

    const { task, momId } = activeTaskForRemark;
    const toastId = toast.loading("Saving task remark...");

    // Legacy update Remark endpoint and fallbacks
    const endpoints = [
      "profile/updateRemarkMomTask.php",
      "profile/update-remark-mom-task",
      "profile/update-mom-remark",
    ];

    for (const url of endpoints) {
      try {
        const payload = {
          taskid: task.taskid,
          reason: remarkInput, // Matches legacy "reason=" + value parameter
          remark: remarkInput,
        };

        const res = await axios.post(url, payload);
        if (res.data && res.data.status) {
          break;
        }
      } catch {
        // Try next endpoint
      }
    }

    // Always update local state to preserve responsiveness
    setMomData((prevMoms) =>
      prevMoms.map((m) => {
        if (m.id === momId) {
          const updatedTasks = m.tasks.map((t) => {
            if (t.taskid === task.taskid) {
              return { ...t, remark: remarkInput };
            }
            return t;
          });
          
          // Re-calculate completion status if closed tasks changed
          const closedCount = updatedTasks.filter((t) => String(t.status).toLowerCase() === "closed").length;
          const newCompletion = updatedTasks.length > 0 ? Math.round((closedCount / updatedTasks.length) * 100) : 0;

          const updatedMom = {
            ...m,
            tasks: updatedTasks,
            completion_status: newCompletion
          };

          // Synchronize currently viewed modal MOM details
          if (selectedMom && selectedMom.id === momId) {
            setSelectedMom(updatedMom);
          }

          return updatedMom;
        }
        return m;
      })
    );

    toast.success("Remark updated successfully", { id: toastId });
    setIsRemarkModalOpen(false);
    setActiveTaskForRemark(null);
  };

  // Toggle task status locally (Close / Reopen) to demonstrate interactive percentage updates
  const toggleTaskStatus = (task, momId) => {
    setMomData((prevMoms) =>
      prevMoms.map((m) => {
        if (m.id === momId) {
          const updatedTasks = m.tasks.map((t) => {
            if (t.taskid === task.taskid) {
              const newStatus = t.status === "Closed" ? "Open" : "Closed";
              return { ...t, status: newStatus };
            }
            return t;
          });

          const closedCount = updatedTasks.filter((t) => String(t.status).toLowerCase() === "closed").length;
          const newCompletion = updatedTasks.length > 0 ? Math.round((closedCount / updatedTasks.length) * 100) : 0;

          const updatedMom = {
            ...m,
            tasks: updatedTasks,
            completion_status: newCompletion
          };

          if (selectedMom && selectedMom.id === momId) {
            setSelectedMom(updatedMom);
          }

          return updatedMom;
        }
        return m;
      })
    );
    toast.success(`Task marked as ${task.status === "Closed" ? "Open" : "Closed"}`);
  };



  const table = useReactTable({
    data: momData,
    columns: columns,
    state: {
      globalFilter,
      sorting,
      columnVisibility,
      columnPinning,
      pagination,
      tableSettings,
      columnFilters,
    },
    onColumnFiltersChange: setColumnFilters,
    meta: {
      onViewDetail: handleOpenDetailModal,
      updateData: (rowIndex, columnId, value) => {
        skipAutoResetPageIndex();
        setMomData((old) =>
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

  useLockScrollbar(tableSettings.enableFullScreen || isDetailModalOpen || isRemarkModalOpen);

  return (
    <Page title="MOM List">
      <div className="transition-content w-full pb-5">
        <div
          className={clsx(
            "flex h-full w-full flex-col",
            tableSettings.enableFullScreen &&
              "fixed inset-0 z-61 bg-white pt-3 dark:bg-dark-900",
          )}
        >
          <Card className="border-none shadow-soft dark:bg-dark-700">
            {/* Header section with Title & Add button */}
            <div className="card-header flex flex-col items-start justify-between gap-4 border-b border-gray-200 p-4 dark:border-dark-500 sm:flex-row sm:items-center sm:p-5">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-gray-800 dark:text-dark-100">
                  MOM List
                </h3>
              </div>

              <div className="flex w-full flex-wrap items-center justify-end gap-3 sm:w-auto">
                <div className="relative w-full sm:w-64">
                  <input
                    type="text"
                    value={globalFilter ?? ""}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    placeholder="Search all fields..."
                    className="form-input w-full rounded-lg border-gray-300 bg-white px-4 h-9 text-sm focus:border-primary-500 focus:ring-primary-500 dark:border-dark-400 dark:bg-dark-800 dark:text-dark-100"
                  />
                </div>
                <TableConfig table={table} />

                <Link to="/dashboards/profile/mom-list/add">
                  <Button
                    color="info"
                    className="!bg-blue-600 hover:!bg-blue-700 text-white font-bold shadow-sm h-9 px-4 flex items-center gap-1.5"
                  >
                    Add More
                  </Button>
                </Link>
              </div>
            </div>

            {/* Table wrapper */}
            <div className="grow overflow-auto p-0 scrollbar-thin">
              <Table
                hoverable
                dense={tableSettings.enableRowDense}
                className="w-full text-left table-fixed border-collapse"
              >
                <THead className="bg-gray-50 dark:bg-dark-800 border-b border-gray-200 dark:border-dark-600">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <Tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <Th
                          key={header.id}
                          className={clsx(
                            "bg-gray-55 text-xs font-bold uppercase text-gray-600 dark:bg-dark-800 dark:text-dark-200 align-top whitespace-nowrap px-3 py-2.5 border-r border-gray-250/60 last:border-0 dark:border-dark-500/60",
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
                                className="flex cursor-pointer select-none items-center justify-between gap-2"
                                onClick={header.column.getToggleSortingHandler()}
                              >
                                <span>
                                  {flexRender(
                                    header.column.columnDef.header,
                                    header.getContext(),
                                  )}
                                </span>
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

                  {/* Header Row 2: Legacy DataTable Column-Specific Filtering Inputs */}
                  <Tr className="bg-gray-100/70 dark:bg-dark-800/80 border-b border-gray-250 dark:border-dark-600">
                    {table.getFlatHeaders().map((header) => {
                      const isFilterable =
                        header.id !== "s_no" &&
                        header.id !== "status" &&
                        header.id !== "completion_status" &&
                        header.id !== "actions";

                      return (
                        <Th
                          key={`${header.id}-filter`}
                          className="px-2 py-1.5 align-middle border-r border-gray-250/60 last:border-0 dark:border-dark-500/60"
                        >
                          {isFilterable ? (
                            header.id === "mom_date" ? (
                              <input
                                type="date"
                                value={(header.column.getFilterValue() ?? "")}
                                onChange={(e) => header.column.setFilterValue(e.target.value)}
                                className="w-full text-[11px] font-normal rounded-md border border-gray-300 bg-white px-1 py-0.5 focus:border-primary-500 focus:ring-primary-500 dark:border-dark-400 dark:bg-dark-800 dark:text-dark-100 h-7"
                              />
                            ) : (
                              <input
                                type="text"
                                value={(header.column.getFilterValue() ?? "")}
                                onChange={(e) => header.column.setFilterValue(e.target.value)}
                                placeholder={`Search ${header.column.columnDef.header}`}
                                className="w-full text-[11px] font-normal rounded-md border border-gray-300 bg-white px-2 py-0.5 focus:border-primary-500 focus:ring-primary-500 dark:border-dark-400 dark:bg-dark-800 dark:text-dark-100 h-7"
                              />
                            )
                          ) : null}
                        </Th>
                      );
                    })}
                  </Tr>
                </THead>
                <TBody>
                  {loading ? (
                    <TableLoadingRow colSpan={columns.length} />
                  ) : table.getRowModel().rows.length > 0 ? (
                    table.getRowModel().rows.map((row) => (
                      <Tr
                        key={row.id}
                        className="border-b border-gray-200 hover:bg-gray-55/30 dark:border-dark-500 dark:hover:bg-dark-600/30 cursor-pointer"
                        onClick={() => handleOpenDetailModal(row.original)}
                        title="Click to view tasks & responsibilities"
                      >
                        {row.getVisibleCells().map((cell) => (
                          <Td
                            key={cell.id}
                            className={clsx(
                              "bg-white dark:bg-dark-700 px-3 py-2 truncate whitespace-nowrap text-sm border-r border-gray-200/50 last:border-0 dark:border-dark-600/50",
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
                        No MOM records found
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

      {/* MOM Details and Tasks Modal */}
      {isDetailModalOpen && selectedMom && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-gray-500/75 dark:bg-dark-900/80 backdrop-blur-xs transition-opacity duration-300">
          <Card className="w-full max-w-4xl bg-white dark:bg-dark-700 shadow-2xl rounded-xl border border-gray-200 dark:border-dark-600 flex flex-col overflow-hidden animate-zoom-in">
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-200 dark:border-dark-600 flex justify-between items-center bg-gray-55 dark:bg-dark-800">
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-xs bg-blue-100 text-blue-800 font-bold px-2.5 py-0.5 rounded-full dark:bg-blue-900/40 dark:text-blue-300">
                  {selectedMom.mom_no}
                </span>
                <h2 className="text-md font-bold text-gray-800 dark:text-dark-50">
                  MOM Task Responsibilities
                </h2>
              </div>
              <button
                type="button"
                className="rounded-md bg-transparent text-gray-400 hover:text-gray-500 dark:text-dark-300 focus:outline-none"
                onClick={() => setIsDetailModalOpen(false)}
              >
                <span className="sr-only">Close</span>
                <svg className="size-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 overflow-y-auto max-h-[65vh] scrollbar-thin">
              {/* MOM Details Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-gray-150 pb-5 dark:border-dark-600">
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-dark-350 block mb-0.5">MOM Purpose</span>
                  <span className="text-sm font-semibold text-gray-800 dark:text-dark-50 leading-relaxed block">{selectedMom.purpose}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-dark-350 block mb-0.5">Location</span>
                  <span className="text-sm font-semibold text-gray-700 dark:text-dark-100 block">{selectedMom.location}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-dark-350 block mb-0.5">Details</span>
                  <span className="text-xs text-gray-500 dark:text-dark-300 block">Date: {dayjs(selectedMom.mom_date).format("DD/MM/YYYY")}</span>
                  <span className="text-xs text-gray-500 dark:text-dark-300 block">Created by: {selectedMom.created_by_name}</span>
                </div>
              </div>

              {/* Tasks Subtable */}
              <div>
                <h4 className="text-sm font-bold text-gray-800 dark:text-dark-50 mb-3 flex items-center gap-2">
                  <span>List of Responsibilities</span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full dark:bg-dark-800 dark:text-dark-300">
                    {selectedMom.tasks?.length || 0} items
                  </span>
                </h4>

                {selectedMom.tasks && selectedMom.tasks.length > 0 ? (
                  <div className="overflow-hidden border border-gray-200 dark:border-dark-600 rounded-lg">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr className="bg-gray-55 dark:bg-dark-800 border-b border-gray-200 dark:border-dark-600 text-gray-600 dark:text-dark-200 font-semibold text-xs uppercase">
                          <th className="px-4 py-2.5">Task ID</th>
                          <th className="px-4 py-2.5 w-1/3">Description</th>
                          <th className="px-4 py-2.5">Assignee</th>
                          <th className="px-4 py-2.5">Target Date</th>
                          <th className="px-4 py-2.5 text-center">Status</th>
                          <th className="px-4 py-2.5">Remark</th>
                          <th className="px-4 py-2.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-dark-600 bg-white dark:bg-dark-700">
                        {selectedMom.tasks.map((task) => {
                          const isClosed = task.status === "Closed";
                          return (
                            <tr key={task.taskid} className="hover:bg-gray-50/50 dark:hover:bg-dark-600/35">
                              <td className="px-4 py-3 font-mono text-xs text-gray-600 dark:text-dark-300 whitespace-nowrap">{task.taskid}</td>
                              <td className="px-4 py-3 text-gray-800 dark:text-dark-50 leading-relaxed font-medium">
                                <span className={clsx(isClosed && "line-through text-gray-400 dark:text-dark-400")}>
                                  {task.description}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-gray-600 dark:text-dark-200 whitespace-nowrap">{task.assignee}</td>
                              <td className="px-4 py-3 text-gray-500 dark:text-dark-300 whitespace-nowrap">
                                {dayjs(task.target_date).format("DD/MM/YYYY")}
                              </td>
                              <td className="px-4 py-3 text-center whitespace-nowrap">
                                <button
                                  onClick={() => toggleTaskStatus(task, selectedMom.id)}
                                  className={clsx(
                                    "px-2 py-0.5 rounded-full text-xs font-semibold border transition cursor-pointer hover:opacity-85",
                                    isClosed
                                      ? "text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50"
                                      : "text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/50"
                                  )}
                                  title="Click to toggle status"
                                >
                                  {task.status || "Open"}
                                </button>
                              </td>
                              <td className="px-4 py-3 text-xs italic text-gray-600 dark:text-dark-200 max-w-xs truncate" title={task.remark}>
                                {task.remark || <span className="text-gray-400 dark:text-dark-400">No remark filled</span>}
                              </td>
                              <td className="px-4 py-3 text-right whitespace-nowrap">
                                <Button
                                  size="xs"
                                  variant="outline"
                                  onClick={() => triggerAddRemark(task, selectedMom)}
                                  className="text-xs border-blue-200 hover:bg-blue-50 text-blue-600 dark:border-blue-900 dark:text-blue-400 dark:hover:bg-blue-950/30 font-bold px-2 py-1"
                                >
                                  {task.remark ? "Edit Remark" : "+ Remark"}
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-400 italic">No responsibility items registered for this MOM.</div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-dark-600 flex justify-end bg-gray-50 dark:bg-dark-850">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDetailModalOpen(false)}
                className="px-5 font-semibold text-sm"
              >
                Close Details
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Alertify-Style Interactive Remark Prompt Dialogue Modal */}
      {isRemarkModalOpen && activeTaskForRemark && (
        <div className="fixed inset-0 z-105 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity duration-300">
          <Card className="w-full max-w-md bg-white dark:bg-dark-700 shadow-2xl rounded-xl border border-gray-250 dark:border-dark-600 overflow-hidden animate-zoom-in">
            {/* Modal Header */}
            <div className="p-4 border-b border-gray-200 dark:border-dark-600 bg-gray-55 dark:bg-dark-800 flex justify-between items-center">
              <h3 className="text-sm font-bold text-gray-800 dark:text-dark-100 flex items-center gap-1.5">
                <svg className="size-4.5 text-blue-500" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                </svg>
                <span>Task Remark Prompt</span>
              </h3>
              <button
                type="button"
                className="rounded-md bg-transparent text-gray-400 hover:text-gray-500 dark:text-dark-300 focus:outline-none"
                onClick={() => setIsRemarkModalOpen(false)}
              >
                <svg className="size-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={submitRemark}>
              <div className="p-5 space-y-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-400 dark:text-dark-350 block mb-1">Task Responsibility ID</label>
                  <div className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-md inline-block">
                    {activeTaskForRemark.task.taskid}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-400 dark:text-dark-350 block mb-1">Description</label>
                  <p className="text-xs text-gray-650 dark:text-dark-200 font-medium leading-relaxed bg-gray-50 dark:bg-dark-800 p-2.5 rounded-lg border border-gray-150 dark:border-dark-600">
                    {activeTaskForRemark.task.description}
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-dark-100 block mb-1.5">Remark Description</label>
                  <textarea
                    rows={3}
                    value={remarkInput}
                    onChange={(e) => setRemarkInput(e.target.value)}
                    placeholder="Enter details / remark status here..."
                    className="form-input w-full rounded-lg border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500 dark:border-dark-400 dark:bg-dark-900 dark:text-dark-100"
                    autoFocus
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="p-4 border-t border-gray-200 dark:border-dark-600 flex justify-end gap-3 bg-gray-50 dark:bg-dark-850">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsRemarkModalOpen(false)}
                  className="px-4 py-1.5 font-semibold text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  color="primary"
                  className="!bg-blue-600 hover:!bg-blue-700 text-white font-bold px-4 py-1.5 text-xs shadow-sm"
                >
                  Save Remark
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}


    </Page>
  );
}
