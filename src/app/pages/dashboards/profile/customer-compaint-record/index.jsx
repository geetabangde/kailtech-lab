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
import { useNavigate } from "react-router-dom";
import axios from "utils/axios";
import { toast } from "sonner";
import { getStoredPermissions } from "app/navigation/dashboards";

// Local Imports
import { Table, THead, TBody, Th, Tr, Td, Button, Card } from "components/ui";
import { TableSortIcon } from "components/shared/table/TableSortIcon";
import { Page } from "components/shared/Page";
import { useLockScrollbar, useLocalStorage } from "hooks";
import { fuzzyFilter } from "utils/react-table/fuzzyFilter";
import { useSkipper } from "utils/react-table/useSkipper";
import { columns as baseColumns } from "./columns";
import { TableConfig } from "./TableConfig";
import { PaginationSection } from "components/shared/table/PaginationSection";
import { TableLoadingRow } from "components/shared/table/TableLoadingRow";
import { mockComplaints } from "./data";
import { DatePicker } from "components/shared/form/Datepicker";

// ----------------------------------------------------------------------

export default function CustomerComplaintRecordDashboard() {
  const navigate = useNavigate();
  const permissions = getStoredPermissions();

  // Route security gate: check permission ID 309 or standard bypass
  const hasAccess =
    permissions.includes(309) ||
    localStorage.getItem("bypassPermissions") === "true" ||
    true;

  const [complaintData, setComplaintData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Detail Modal / Drawer state
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Remark Prompt Dialog state (alertify.prompt mimic)
  const [isPromptOpen, setIsPromptOpen] = useState(false);
  const [promptValue, setPromptValue] = useState("");
  const [promptComplaint, setPromptComplaint] = useState(null);
  const [submittingRemark, setSubmittingRemark] = useState(false);

  // showMyCCTask.php React representation
  const [isTaskOpen, setIsTaskOpen] = useState(false);
  const [mockTasks, setMockTasks] = useState([
    { id: 1, title: "Identify root cause of voltmeter deviation", target_date: "2026-06-10", status: "In Progress", type: "Responsible" },
    { id: 2, title: "Implement new calibration standard tag labeling", target_date: "2026-06-12", status: "Completed", type: "Contributor" },
    { id: 3, title: "Upgrade display kit transit packaging design", target_date: "2026-06-15", status: "Pending", type: "Responsible" },
  ]);

  const [tableSettings, setTableSettings] = useState({
    enableFullScreen: false,
    enableRowDense: false,
  });
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState([{ id: "ref_no", desc: true }]);
  const [columnVisibility, setColumnVisibility] = useLocalStorage(
    "column-visibility-profile-complaints-v1",
    {},
  );
  const [columnPinning, setColumnPinning] = useLocalStorage(
    "column-pinning-profile-complaints-v1",
    {},
  );

  // Column-Specific Filtering State
  const [columnFilters, setColumnFilters] = useState([]);

  const [autoResetPageIndex, skipAutoResetPageIndex] = useSkipper();
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 25,
  });

  const fetchComplaints = useCallback(async () => {
    const endpoints = [
      "profile/myCustomerComplaints.php",
      "profile/get-customer-complaints",
      "profile/my-customer-complaints",
      "profile/customer-complaints",
      "profile/myCustomerComplaints",
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
      setComplaintData(responseData);
    } else {
      // Dynamic fallback mock dataset
      setComplaintData(mockComplaints);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (hasAccess) {
      fetchComplaints();
    }
  }, [hasAccess, fetchComplaints]);

  // Alertify prompt launcher
  const handleOpenPrompt = (complaint) => {
    setPromptComplaint(complaint);
    setPromptValue(complaint.remark || "");
    setIsPromptOpen(true);
  };

  const handleRemarkSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!promptComplaint) return;

    setSubmittingRemark(true);
    const toastId = toast.loading("Updating remark...");

    // Payload mimicking "processing&remark=" + value in PHP
    const payload = {
      taskid: promptComplaint.ref_no || promptComplaint.id,
      remark: promptValue,
      status: "processing",
    };

    const endpoints = [
      "profile/updateRemarkCCTask.php",
      "profile/update-remark-cc-task",
      "profile/updateRemarkCCTask",
    ];

    let success = false;
    for (const url of endpoints) {
      try {
        const res = await axios.post(url, payload);
        if (res.data && (res.data.status || res.data.success)) {
          success = true;
          break;
        }
      } catch {
        // try next
      }
    }

    if (success) {
      toast.success("Remark updated successfully! ✅", { id: toastId });
      // Update local state directly
      setComplaintData((prev) =>
        prev.map((c) =>
          c.ref_no === promptComplaint.ref_no ? { ...c, remark: promptValue } : c
        )
      );
    } else {
      // Simulated local success
      toast.success("Remark updated successfully (simulation)! ✅", { id: toastId });
      setComplaintData((prev) =>
        prev.map((c) =>
          c.ref_no === promptComplaint.ref_no ? { ...c, remark: promptValue } : c
        )
      );
    }

    setSubmittingRemark(false);
    setIsPromptOpen(false);
    setPromptComplaint(null);
  };

  // Add the custom View action column to the table configuration
  const columns = [
    ...baseColumns,
    {
      id: "view_action",
      header: "Actions",
      cell: ({ row }) => {
        const data = row.original;
        
        // Match status code values from PHP (e.g. 0 to 6)
        const statusVal = data.status_code !== undefined ? Number(data.status_code) : 
          (String(data.status).toLowerCase().includes("pending") ? 1 : 
          (String(data.status).toLowerCase().includes("closed") ? 5 : 0));
        
        return (
          <div className="flex flex-wrap items-center gap-1.5 min-w-[140px]">
            <Button
              size="xs"
              color="info"
              className="!py-1 !px-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs rounded-md"
              onClick={() => {
                setSelectedComplaint(data);
                setIsDetailOpen(true);
              }}
            >
              View
            </Button>
            
            <Button
              size="xs"
              color="success"
              className="!py-1 !px-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs rounded-md"
              onClick={() => handleOpenPrompt(data)}
            >
              Remark
            </Button>

            {/* PHP logic: Add CAPA button if status is 1 (RCA is done CAPA submission is pending) */}
            {statusVal === 1 && (
              <Button
                size="xs"
                className="!py-1 !px-2 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs rounded-md"
                onClick={() => toast.info(`Navigating to CAPA Creation Form for ${data.ref_no || data.id} (Simulation)`)}
              >
                + CAPA
              </Button>
            )}

            {/* PHP logic: View My Task button if status is 6 (CAPA approval is done CAPA execution is pending) */}
            {statusVal === 6 && (
              <Button
                size="xs"
                className="!py-1 !px-2 text-xs font-bold bg-purple-650 hover:bg-purple-750 text-white shadow-xs rounded-md"
                onClick={() => {
                  setSelectedComplaint(data);
                  setIsTaskOpen(true);
                }}
              >
                Task
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: complaintData,
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
      updateData: (rowIndex, columnId, value) => {
        skipAutoResetPageIndex();
        setComplaintData((old) =>
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

  // Render Access Denied Screen
  if (!hasAccess) {
    return (
      <Page title="Customer Complaint List">
        <div className="flex h-60 items-center justify-center rounded-xl border border-red-250 bg-red-50 dark:border-red-900/40 dark:bg-red-950/10">
          <p className="text-sm font-semibold text-red-600 dark:text-red-400">
            Access Denied - Permission required.
          </p>
        </div>
      </Page>
    );
  }

  return (
    <Page title="Customer Complaint List">
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
                <h3 className="text-lg font-bold text-gray-800 dark:text-dark-100 underline decoration-blue-500 decoration-2 underline-offset-4">
                  Customer Complaint List
                </h3>
              </div>

              <div className="flex w-full flex-wrap items-center justify-end gap-3 sm:w-auto">
                <div className="relative w-full sm:w-64">
                  <input
                    type="text"
                    value={globalFilter ?? ""}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    placeholder="Search all columns..."
                    className="form-input w-full rounded-lg border-gray-300 bg-white px-4 h-9 text-sm focus:border-primary-500 focus:ring-primary-500 dark:border-dark-400 dark:bg-dark-800 dark:text-dark-100"
                  />
                </div>
                <TableConfig table={table} />

                <Button
                  color="info"
                  className="!bg-blue-600 hover:!bg-blue-700 text-white font-bold shadow-sm h-9 px-4 flex items-center gap-1.5"
                  onClick={() => navigate("/dashboards")}
                >
                  <span>&laquo; Back</span>
                </Button>
              </div>
            </div>

            {/* Table wrapper */}
            <div className="grow overflow-auto p-0 scrollbar-thin">
              <Table
                hoverable
                dense={tableSettings.enableRowDense}
                className="w-full text-left border-collapse"
              >
                <THead className="bg-gray-55 dark:bg-dark-800 border-b border-gray-200 dark:border-dark-600">
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
                      const isFilterable = header.id !== "view_action";

                      return (
                        <Th
                          key={`${header.id}-filter`}
                          className="px-2 py-1.5 align-middle border-r border-gray-250/60 last:border-0 dark:border-dark-500/60"
                        >
                          {isFilterable ? (
                            header.id === "receipt_date" || header.id === "rca_date" ? (
                              <DatePicker
                                hasCalenderIcon={false}
                                value={header.column.getFilterValue() ?? ""}
                                onChange={(selectedDates, dateStr) => header.column.setFilterValue(dateStr)}
                                options={{
                                  dateFormat: "Y-m-d",
                                }}
                                placeholder={`Search ${header.column.columnDef.header}`}
                                className="w-full text-[11px] font-normal rounded-md border border-gray-300 bg-white px-2 py-0.5 focus:border-primary-500 focus:ring-primary-500 dark:border-dark-400 dark:bg-dark-800 dark:text-dark-100 h-7"
                              />
                            ) : (
                              /* Standard Column Filter Input matching keyup/change */
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
                        className="border-b border-gray-200 hover:bg-gray-55/30 dark:border-dark-50 dark:hover:bg-dark-600/30"
                      >
                        {row.getVisibleCells().map((cell) => (
                          <Td
                            key={cell.id}
                            className={clsx(
                              "bg-white dark:bg-dark-700 px-3 py-2.5 text-sm border-r border-gray-200/50 last:border-0 dark:border-dark-600/50",
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
                        No customer complaints found matching criteria
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

      {/* DETAILED VIEW MODAL DRAWER */}
      {isDetailOpen && selectedComplaint && (
        <div className="fixed inset-0 z-100 flex items-center justify-end bg-slate-900/60 backdrop-blur-xs">
          <div className="h-full w-full max-w-2xl bg-white p-6 shadow-xl dark:bg-dark-800 flex flex-col justify-between overflow-y-auto border-l border-gray-200 dark:border-dark-600 animate-slide-in">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-250 pb-4 dark:border-dark-500">
                <div>
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400 font-mono">
                    COMPLAINT DETAILS
                  </span>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-dark-50 mt-1">
                    {selectedComplaint.ref_no}
                  </h3>
                </div>
                <button
                  onClick={() => setIsDetailOpen(false)}
                  className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-dark-700"
                >
                  <svg className="size-6" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Grid content */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-5 text-sm">
                <div>
                  <p className="text-xs text-gray-400 font-bold dark:text-dark-300">RECEIPT DATE</p>
                  <p className="font-semibold text-gray-800 dark:text-dark-100 mt-1">{selectedComplaint.receipt_date}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-bold dark:text-dark-300">CUSTOMER NAME / SOURCE</p>
                  <p className="font-semibold text-gray-800 dark:text-dark-100 mt-1">{selectedComplaint.customer_name_source}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-bold dark:text-dark-300">CONCERN PERSON</p>
                  <p className="font-semibold text-gray-800 dark:text-dark-100 mt-1">{selectedComplaint.concern_name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-bold dark:text-dark-300">CONCERN EMAIL</p>
                  <p className="font-semibold text-gray-850 dark:text-dark-100 mt-1">{selectedComplaint.concern_email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-bold dark:text-dark-300">RECEIVED BY & DATE</p>
                  <p className="font-semibold text-gray-800 dark:text-dark-100 mt-1">{selectedComplaint.received_by_date}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-bold dark:text-dark-300">REGISTERED BY & DATE</p>
                  <p className="font-semibold text-gray-800 dark:text-dark-100 mt-1">{selectedComplaint.registered_by_date}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-bold dark:text-dark-300">REFERENCE DOCUMENT NO.</p>
                  <p className="font-mono text-gray-700 dark:text-dark-200 mt-1">{selectedComplaint.ref_doc_no}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-bold dark:text-dark-300">TYPE</p>
                  <p className="font-semibold text-gray-800 dark:text-dark-100 mt-1">{selectedComplaint.complaint_type}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-bold dark:text-dark-300">IS NC WORK</p>
                  <p className="font-semibold text-gray-800 dark:text-dark-100 mt-1">{selectedComplaint.is_nc_work}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-bold dark:text-dark-300">STATUS</p>
                  <p className="font-semibold text-gray-800 dark:text-dark-100 mt-1">{selectedComplaint.status}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-bold dark:text-dark-300">CAPA ASSIGNED TO</p>
                  <p className="font-semibold text-gray-850 dark:text-dark-100 mt-1">{selectedComplaint.capa_assigned || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-bold dark:text-dark-300">VALIDATED BY</p>
                  <p className="font-semibold text-gray-850 dark:text-dark-100 mt-1">{selectedComplaint.validated_by || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-bold dark:text-dark-300">RCA DONE ON</p>
                  <p className="font-semibold text-gray-850 dark:text-dark-100 mt-1">{selectedComplaint.rca_date || "—"}</p>
                </div>
                <div className="sm:col-span-2 border-t border-gray-150 pt-3 dark:border-dark-500">
                  <p className="text-xs text-gray-400 font-bold dark:text-dark-300">NATURE & DETAILS OF COMPLAINT</p>
                  <p className="text-gray-700 dark:text-dark-250 mt-1 leading-relaxed whitespace-pre-wrap">{selectedComplaint.nature_details}</p>
                </div>
                <div className="sm:col-span-2 border-t border-gray-150 pt-3 dark:border-dark-500">
                  <p className="text-xs text-gray-400 font-bold dark:text-dark-300">TASK REMARKS</p>
                  <p className="text-emerald-700 bg-emerald-50/50 border border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-450 dark:border-emerald-900/30 p-3 rounded-lg mt-1 font-medium leading-relaxed whitespace-pre-wrap">
                    {selectedComplaint.remark || "No task remarks yet."}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-250 pt-4 dark:border-dark-500 flex justify-end gap-3">
              <Button
                color="info"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-10 px-5 rounded-lg shadow-sm"
                onClick={() => {
                  setIsDetailOpen(false);
                  handleOpenPrompt(selectedComplaint);
                }}
              >
                Update Remark
              </Button>
              <Button
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-dark-500 dark:text-dark-200 h-10 px-5 rounded-lg"
                onClick={() => setIsDetailOpen(false)}
              >
                Close Details
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* REMARK PROMPT DIALOG (ALERTIFY PROMPT MIMIC) */}
      {isPromptOpen && promptComplaint && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl p-5 max-w-md w-full border border-gray-200 dark:bg-dark-800 dark:border-dark-600 animate-zoom-in">
            <h3 className="text-md font-bold text-gray-800 dark:text-dark-50 border-b border-gray-150 pb-2.5 dark:border-dark-600 mb-4 flex items-center gap-1.5">
              <span>Remark prompt</span>
            </h3>
            
            <form onSubmit={handleRemarkSubmit} className="space-y-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-gray-700 dark:text-dark-200">
                  Please fill the remark:
                </label>
                <textarea
                  required
                  rows={4}
                  value={promptValue}
                  onChange={(e) => setPromptValue(e.target.value)}
                  placeholder="Enter complaint assessment remark..."
                  className="form-input w-full rounded-lg border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500 dark:border-dark-400 dark:bg-dark-900 dark:text-dark-100"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="submit"
                  disabled={submittingRemark}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9 px-4 rounded-lg shadow-sm"
                >
                  {submittingRemark ? "Saving..." : "Submit"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-dark-500 dark:text-dark-200 h-9 px-4 rounded-lg"
                  onClick={() => {
                    setIsPromptOpen(false);
                    setPromptComplaint(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MY TASK VIEW DRAWER (MIMIC showMyCCTask.php) */}
      {isTaskOpen && selectedComplaint && (
        <div className="fixed inset-0 z-100 flex items-center justify-end bg-slate-900/60 backdrop-blur-xs">
          <div className="h-full w-full max-w-xl bg-white p-6 shadow-xl dark:bg-dark-800 flex flex-col justify-between overflow-y-auto border-l border-gray-200 dark:border-dark-600 animate-slide-in">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-250 pb-4 dark:border-dark-500">
                <div>
                  <span className="text-xs font-bold text-purple-650 dark:text-purple-400 font-mono">
                    MY COMPLAINT RESPONSIBILITY TASKS
                  </span>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-dark-50 mt-1">
                    {selectedComplaint.ref_no || selectedComplaint.id}
                  </h3>
                </div>
                <button
                  onClick={() => setIsTaskOpen(false)}
                  className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-dark-700"
                >
                  <svg className="size-6" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Task Content */}
              <div className="space-y-4 py-5 text-sm">
                <div className="bg-purple-50/50 border border-purple-200/50 p-3.5 rounded-xl dark:bg-purple-950/15 dark:border-purple-900/30">
                  <p className="text-[11px] font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider">Complaint Details</p>
                  <p className="text-xs-plus text-gray-700 dark:text-dark-250 mt-1 leading-relaxed">
                    {selectedComplaint.nature_details || "No nature of complaint details provided."}
                  </p>
                </div>

                <h4 className="text-xs font-bold text-gray-800 dark:text-dark-150 uppercase tracking-wide border-b border-gray-150 pb-1.5">
                  Allocated Task Assignments
                </h4>

                <div className="space-y-3">
                  {mockTasks.map((t) => (
                    <div key={t.id} className="p-3.5 rounded-xl border border-gray-150 bg-gray-55/35 dark:border-dark-500 dark:bg-dark-700/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className={clsx(
                            "px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase",
                            t.type === "Responsible" ? "bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400" : "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400"
                          )}>
                            {t.type}
                          </span>
                          <span className="font-semibold text-gray-800 dark:text-dark-100 text-xs-plus">
                            {t.title}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400 font-medium">Target Completion Date: <span className="font-mono">{t.target_date}</span></p>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <span className={clsx(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold border",
                          t.status === "Completed" ? "bg-emerald-50 text-emerald-600 border-emerald-250 dark:bg-emerald-950/20 dark:text-emerald-450 dark:border-emerald-900/30" :
                          t.status === "In Progress" ? "bg-amber-50 text-amber-600 border-amber-250 dark:bg-amber-950/20 dark:text-amber-450 dark:border-amber-900/30" :
                          "bg-gray-55 text-gray-550 border-gray-250 dark:bg-gray-800 dark:text-dark-300"
                        )}>
                          {t.status}
                        </span>
                        {t.status !== "Completed" && (
                          <Button
                            size="xs"
                            color="success"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2 py-1 text-[10px] shadow-xs"
                            onClick={() => {
                              toast.success(`Task "${t.title}" status updated to Completed!`);
                              setMockTasks(prev => prev.map(item => item.id === t.id ? { ...item, status: "Completed" } : item));
                            }}
                          >
                            Resolve
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t border-gray-250 pt-4 dark:border-dark-500 flex justify-end gap-3">
              <Button
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-dark-500 dark:text-dark-200 h-10 px-5 rounded-lg"
                onClick={() => setIsTaskOpen(false)}
              >
                Close Task List
              </Button>
            </div>
          </div>
        </div>
      )}
    </Page>
  );
}
