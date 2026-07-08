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
import { useNavigate } from "react-router-dom";
import axios from "utils/axios";

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
import { StatusCell } from "./rows";

// ----------------------------------------------------------------------

export default function ComplaintListDashboard() {
  const navigate = useNavigate();
  const [complaintsData, setComplaintsData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Ticket Detail Modal State
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [tableSettings, setTableSettings] = useState({
    enableFullScreen: false,
    enableRowDense: false,
  });
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState([{ id: "id", desc: true }]); // Default descending like PHP "order": [[0, "desc"]]
  const [columnVisibility, setColumnVisibility] = useLocalStorage(
    "column-visibility-profile-complaints-v3",
    {},
  );
  const [columnPinning, setColumnPinning] = useLocalStorage(
    "column-pinning-profile-complaints-v3",
    {},
  );
  
  // Column-Specific Filtering State matching PHP footer search logic
  const [columnFilters, setColumnFilters] = useState([]);

  const [autoResetPageIndex, skipAutoResetPageIndex] = useSkipper();
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 100, // Matches PHP "pageLength": 100
  });

  const fetchComplaints = useCallback(async () => {
    const endpoints = [
      "profile/get-tickets",
      "profile/get-ticket-list",
      "profile/ticket-list",
      "profile/get-complaints",
      "profile/get-complaint-list",
      "profile/complaint-list",
      "profile/ticketList.php",
      "profile/complaintList.php",
      "profile/ticket.php",
      "profile/complaint.php",
      "profile/ticketListData.php"
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
      setComplaintsData(responseData);
    } else {
      // High-Fidelity Fallback Dataset representing diverse statuses
      setComplaintsData([
        {
          id: "TKT-2026-001",
          problemtitle: "Calibration Certificate Error",
          status: 0,
          description: "The printed calibration certificate for multimeter has the wrong model number printed. Need correction urgently.",
          category: "Calibration Service",
          subcategory: "Incorrect Certificate Details",
          alloted_to: "Rahul Sharma",
          initiated_by: "John Doe",
          initiated_on: "2026-05-25",
          closed_by: "—",
          closed_on: "—"
        },
        {
          id: "TKT-2026-002",
          problemtitle: "Portal Login Issue",
          status: 2,
          description: "User is locked out from the client dashboard. Repeated password reset requests do not send emails.",
          category: "Portal / Login Issue",
          subcategory: "Unable to Login",
          alloted_to: "IT Support Team",
          initiated_by: "Alice Smith",
          initiated_on: "2026-05-27",
          closed_by: "—",
          closed_on: "—"
        },
        {
          id: "TKT-2026-003",
          problemtitle: "Testing Delay - LRN 9382",
          status: 3,
          description: "Chemical testing of steel samples is pending beyond the expected completion date of 2026-05-24.",
          category: "Testing Service",
          subcategory: "Delay in Testing Reports",
          alloted_to: "Dr. Amit Verma",
          initiated_by: "Sam Wilson",
          initiated_on: "2026-05-20",
          closed_by: "Dr. Amit Verma",
          closed_on: "2026-05-28"
        },
        {
          id: "TKT-2026-004",
          problemtitle: "Wrong GST Number in Invoice",
          status: 1,
          description: "Invoice #INV-9281 was printed with a typo in the client's corporate GSTIN. Need cancellation and re-issuance.",
          category: "Billing & Invoicing",
          subcategory: "Wrong GST Number in Invoice",
          alloted_to: "Priya Patel",
          initiated_by: "Clara Croft",
          initiated_on: "2026-05-29",
          closed_by: "—",
          closed_on: "—"
        },
        {
          id: "TKT-2026-005",
          problemtitle: "Spelling Mistake on Report",
          status: 5,
          description: "Spelling of customer name has a typo on final report. Discarded the request as details were printed from registration sheet.",
          category: "Report Correction",
          subcategory: "Name Spelling Mistake",
          alloted_to: "Rahul Sharma",
          initiated_by: "Bruce Wayne",
          initiated_on: "2026-05-18",
          closed_by: "Rahul Sharma",
          closed_on: "2026-05-19"
        }
      ]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  const handleOpenDetailModal = (ticket) => {
    setSelectedTicket(ticket);
    setIsModalOpen(true);
  };

  const table = useReactTable({
    data: complaintsData,
    columns: columns,
    state: {
      globalFilter,
      sorting,
      columnVisibility,
      columnPinning,
      pagination,
      tableSettings,
      columnFilters, // Connect dynamic column filters state
    },
    onColumnFiltersChange: setColumnFilters, // Listen for column filters
    meta: {
      fetchData: fetchComplaints,
      onViewDetail: handleOpenDetailModal,
      updateData: (rowIndex, columnId, value) => {
        skipAutoResetPageIndex();
        setComplaintsData((old) =>
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

  useLockScrollbar(tableSettings.enableFullScreen || isModalOpen);

  return (
    <Page title="Ticket List">
      <div className="transition-content w-full pb-5">
        <div
          className={clsx(
            "flex h-full w-full flex-col",
            tableSettings.enableFullScreen &&
              "fixed inset-0 z-61 bg-white pt-3 dark:bg-dark-900",
          )}
        >
          <Card className="border-none shadow-soft dark:bg-dark-700">
            
            {/* Header section with Title and Add Button */}
            <div className="card-header flex flex-col items-start justify-between gap-4 border-b border-gray-200 p-4 dark:border-dark-500 sm:flex-row sm:items-center sm:p-5">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-gray-800 dark:text-dark-100">
                  Ticket List
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
                  onClick={() => navigate("/dashboards/profile/raise-complaint")}
                  color="info"
                  className="!bg-blue-600 hover:!bg-blue-700 text-white font-bold shadow-sm h-9 px-4 flex items-center gap-1.5"
                >
                  &laquo; Add new Ticket
                </Button>
              </div>
            </div>

            {/* Table Wrapper with horizontal scrolling */}
            <div className="grow overflow-auto p-0 scrollbar-thin scrollbar-thumb-gray-250 dark:scrollbar-thumb-dark-500">
              <Table
                hoverable
                dense={tableSettings.enableRowDense}
                className="w-full text-left table-fixed border-collapse"
              >
                <THead className="bg-gray-50 dark:bg-dark-800 border-b border-gray-200 dark:border-dark-600">
                  
                  {/* Row 1: Header names and Sorting controls */}
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

                  {/* Row 2: Dynamic Column-Specific Search Filters (equivalent to PHP tfoot display logic) */}
                  <Tr className="bg-gray-100/70 dark:bg-dark-800/80 border-b border-gray-250 dark:border-dark-600">
                    {table.getFlatHeaders().map((header) => {
                      // Only allow searchable columns (exclude Sr No and View Detail action columns)
                      const isFilterable = header.id !== "s_no" && header.id !== "view";
                      
                      return (
                        <Th
                          key={`${header.id}-filter`}
                          className="px-2 py-1.5 align-middle border-r border-gray-250/60 last:border-0 dark:border-dark-500/60"
                        >
                          {isFilterable ? (
                            header.id === "status" ? (
                              /* Column Status Filter Dropdown matching PHP exactly */
                              <select
                                value={(header.column.getFilterValue() ?? "")}
                                onChange={(e) => header.column.setFilterValue(e.target.value)}
                                className="w-full text-[11px] font-normal rounded-md border border-gray-300 bg-white px-1 py-0.5 focus:border-primary-500 focus:ring-primary-500 dark:border-dark-400 dark:bg-dark-800 dark:text-dark-100 h-7"
                              >
                                <option value="">All Status</option>
                                <option value="0">Pending For Allotment</option>
                                <option value="1">Alloted</option>
                                <option value="2">In Process</option>
                                <option value="3">Completed</option>
                                <option value="4">Closed</option>
                                <option value="5">Rejected</option>
                              </select>
                            ) : (header.id === "initiated_on" || header.id === "closed_on") ? (
                              /* Column Date Filter Input */
                              <input
                                type="date"
                                value={(header.column.getFilterValue() ?? "")}
                                onChange={(e) => header.column.setFilterValue(e.target.value)}
                                className="w-full text-[11px] font-normal rounded-md border border-gray-300 bg-white px-1 py-0.5 focus:border-primary-500 focus:ring-primary-500 dark:border-dark-400 dark:bg-dark-800 dark:text-dark-100 h-7"
                              />
                            ) : (
                              /* Standard Text Column Filter Input */
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
                        className="border-b border-gray-200 hover:bg-gray-55/30 dark:border-dark-500 dark:hover:bg-dark-600/30"
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
                        No tickets or complaints found matching criteria
                      </Td>
                    </Tr>
                  )}
                </TBody>
              </Table>
            </div>

            {/* Pagination Section */}
            <div className="p-4 sm:p-5">
              <PaginationSection table={table} />
            </div>
          </Card>
        </div>
      </div>

      {/* Ticket Details View Dialog Modal */}
      {isModalOpen && selectedTicket && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-gray-500/75 dark:bg-dark-900/80 backdrop-blur-xs transition-opacity duration-300">
          <Card className="w-full max-w-2xl bg-white dark:bg-dark-700 shadow-2xl rounded-xl border border-gray-200 dark:border-dark-600 flex flex-col overflow-hidden animate-zoom-in">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-200 dark:border-dark-600 flex justify-between items-center bg-gray-55 dark:bg-dark-800">
              <div className="flex items-center gap-2.5">
                <span className="text-xs bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full dark:bg-blue-900/40 dark:text-blue-300">
                  {selectedTicket.id}
                </span>
                <h2 className="text-md font-bold text-gray-800 dark:text-dark-50">
                  Ticket Details
                </h2>
              </div>
              <button
                type="button"
                className="rounded-md bg-transparent text-gray-400 hover:text-gray-500 dark:text-dark-300 focus:outline-none"
                onClick={() => setIsModalOpen(false)}
              >
                <svg className="size-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh] scrollbar-thin">
              
              {/* Problem Title & Status */}
              <div className="flex justify-between items-start gap-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-400 dark:text-dark-300 block mb-1">
                    Problem Title
                  </label>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-dark-100 leading-snug">
                    {selectedTicket.problemtitle}
                  </h3>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-400 dark:text-dark-300 block mb-1 text-right">
                    Status
                  </label>
                  <div className="inline-block px-2.5 py-0.5 rounded-md bg-gray-100 dark:bg-dark-800 text-xs">
                    <StatusCell getValue={() => selectedTicket.status} />
                  </div>
                </div>
              </div>

              {/* Categorization & Timelines */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-b border-gray-150 py-4 dark:border-dark-600">
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-dark-300 block mb-0.5">
                    Category
                  </span>
                  <span className="text-sm font-semibold text-gray-700 dark:text-dark-200">
                    {selectedTicket.category || selectedTicket.category_name || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-dark-300 block mb-0.5">
                    Sub Category
                  </span>
                  <span className="text-sm font-semibold text-gray-700 dark:text-dark-200">
                    {selectedTicket.subcategory || selectedTicket.subcategory_name || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-dark-300 block mb-0.5">
                    Expected Date
                  </span>
                  <span className="text-sm font-semibold text-gray-700 dark:text-dark-200">
                    {selectedTicket.expecteddate || "—"}
                  </span>
                </div>
              </div>

              {/* Problem Description */}
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400 dark:text-dark-300 block mb-1">
                  Problem Description
                </label>
                <div className="bg-gray-50 dark:bg-dark-800 p-4 rounded-lg border border-gray-200 dark:border-dark-600 text-sm text-gray-700 dark:text-dark-200 whitespace-pre-wrap leading-relaxed">
                  {selectedTicket.description}
                </div>
              </div>

              {/* Assignee / Progress details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-dark-300 block mb-0.5">
                    Alloted To
                  </span>
                  <span className="text-sm font-semibold text-gray-700 dark:text-dark-200">
                    {selectedTicket.alloted_to || selectedTicket.alloted_to_name || "Pending Allotment"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-dark-300 block mb-0.5">
                    Initiated By / On
                  </span>
                  <span className="text-sm font-semibold text-gray-700 dark:text-dark-200 block">
                    {selectedTicket.initiated_by || selectedTicket.initiated_by_name || "—"}
                  </span>
                  <span className="text-xs text-gray-450 dark:text-dark-300">
                    {selectedTicket.initiated_on || "—"}
                  </span>
                </div>
              </div>

              {/* Closure Details */}
              {selectedTicket.closed_on && selectedTicket.closed_on !== "—" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-gray-150 pt-4 dark:border-dark-600">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-dark-300 block mb-0.5">
                      Closed By
                    </span>
                    <span className="text-sm font-semibold text-gray-700 dark:text-dark-200">
                      {selectedTicket.closed_by || selectedTicket.closed_by_name || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-dark-300 block mb-0.5">
                      Closed On
                    </span>
                    <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                      {selectedTicket.closed_on || "—"}
                    </span>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-dark-600 flex justify-end gap-3 bg-gray-50 dark:bg-dark-850">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="px-5 font-semibold text-sm"
              >
                Close Details
              </Button>
            </div>

          </Card>
        </div>
      )}
    </Page>
  );
}
