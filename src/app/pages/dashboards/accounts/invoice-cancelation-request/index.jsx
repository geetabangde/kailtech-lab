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
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import axios from "utils/axios";
import { toast } from "sonner";

import { Table, Card, THead, TBody, Th, Tr, Td } from "components/ui";
import { TableSortIcon } from "components/shared/table/TableSortIcon";
import { Page } from "components/shared/Page";
import { useLockScrollbar, useDidUpdate, useLocalStorage } from "hooks";
import { fuzzyFilter } from "utils/react-table/fuzzyFilter";
import { useSkipper } from "utils/react-table/useSkipper";
import { Toolbar } from "./Toolbar";
import { columns } from "./columns.jsx";
import { PaginationSection } from "components/shared/table/PaginationSection";
import { useThemeContext } from "app/contexts/theme/context";

export default function InvoiceCancelationRequest() {
  const { cardSkin } = useThemeContext();
  const navigate = useNavigate();
  const permissions = JSON.parse(localStorage.getItem("userPermissions") || "[]");

  useEffect(() => {
    if (!permissions.includes(340)) {
      navigate("/dashboards");
    }
  }, [navigate, permissions]);

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [remark, setRemark] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/accounts/get-invoice-cancel-request");
      const rows = res.data?.data ?? res.data ?? [];
      console.log("Invoice cancel requests:", rows); // Debug log
      setRequests(Array.isArray(rows) ? rows : []);
    } catch (err) {
      console.error("Error fetching cancellation requests:", err);
      toast.error("Failed to load cancellation requests");
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveReject = (request) => {
    setSelectedRequest(request);
    setRemark("");
    setModalOpen(true);
  };

  const handleApprove = async () => {
    if (!remark.trim()) {
      toast.error("Please enter a remark");
      return;
    }

    try {
      setActionLoading(true);
      await axios.post("/accounts/approve-cancelinv-request", {
        requestid: selectedRequest.id,
        remark: remark,
      });
      toast.success("Cancellation request approved successfully");
      setModalOpen(false);
      fetchRequests(); // Refresh the list
    } catch (err) {
      console.error("Error approving request:", err);
      toast.error(err?.response?.data?.message || "Failed to approve request");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!remark.trim()) {
      toast.error("Please enter a remark");
      return;
    }

    try {
      setActionLoading(true);
      await axios.post("/accounts/reject-request", {
        requestid: selectedRequest.id,
        remark: remark,
      });
      toast.success("Cancellation request rejected successfully");
      setModalOpen(false);
      fetchRequests(); // Refresh the list
    } catch (err) {
      console.error("Error rejecting request:", err);
      toast.error(err?.response?.data?.message || "Failed to reject request");
    } finally {
      setActionLoading(false);
    }
  };

  const [tableSettings, setTableSettings] = useState({
    enableFullScreen: false,
    enableRowDense: false,
    enableSorting: true,
    enableColumnFilters: true,
  });

  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState([{ id: "id", desc: true }]);

  const [columnVisibility, setColumnVisibility] = useLocalStorage(
    "column-visibility-invoice-cancel-requests",
    {},
  );
  const [columnPinning, setColumnPinning] = useLocalStorage(
    "column-pinning-invoice-cancel-requests",
    {},
  );

  const [autoResetPageIndex, skipAutoResetPageIndex] = useSkipper();

  const table = useReactTable({
    data: requests,
    columns,
    state: { globalFilter, sorting, columnVisibility, columnPinning, tableSettings },
    meta: {
      deleteRow: (row) => {
        skipAutoResetPageIndex();
        setRequests((old) => old.filter((r) => r.id !== row.original.id));
      },
      setTableSettings,
      onApproveReject: handleApproveReject,
    },
    filterFns: { fuzzy: fuzzyFilter },
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
    onColumnVisibilityChange: setColumnVisibility,
    onColumnPinningChange: setColumnPinning,
    autoResetPageIndex,
    initialState: { pagination: { pageSize: 25 } },
  });

  useDidUpdate(() => table.resetRowSelection(), [requests]);
  useLockScrollbar(tableSettings.enableFullScreen);

  if (loading) {
    return (
      <Page title="Revision Requests List">
        <div className="flex h-[60vh] items-center justify-center gap-3 text-gray-600">
          <svg
            className="h-6 w-6 animate-spin text-blue-600"
            viewBox="0 0 24 24"
            fill="none"
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
          Loading Revision Requests...
        </div>
      </Page>
    );
  }

  return (
    <Page title="Revision Requests List">
      <div className="transition-content w-full pb-5">
        <div
          className={clsx(
            "flex h-full w-full flex-col",
            tableSettings.enableFullScreen && "fixed inset-0 z-61 bg-white pt-3 dark:bg-dark-900",
          )}
        >
          <Toolbar table={table} />
          <div
            className={clsx(
              "transition-content flex grow flex-col pt-3",
              tableSettings.enableFullScreen ? "overflow-hidden" : "px-[var(--margin-x)]",
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
                  className="w-full text-left rtl:text-right"
                >
                  <THead>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <Tr key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <Th
                            key={header.id}
                            className="bg-gray-200 font-semibold uppercase text-gray-800 dark:bg-dark-800 dark:text-dark-100 first:ltr:rounded-tl-lg last:ltr:rounded-tr-lg first:rtl:rounded-tr-lg last:rtl:rounded-tl-lg"
                          >
                            {header.column.getCanSort() ? (
                              <div
                                className="flex cursor-pointer select-none items-center space-x-1"
                                onClick={header.column.getToggleSortingHandler()}
                              >
                                <span className="flex-1">
                                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                </span>
                                <TableSortIcon sorted={header.column.getIsSorted()} />
                              </div>
                            ) : header.isPlaceholder ? null : (
                              flexRender(header.column.columnDef.header, header.getContext())
                            )}

                            {header.column.getCanFilter() ? (
                              header.column.columnDef.meta?.filterType === "select" ? (
                                <select
                                  className="mt-1 w-full rounded border border-gray-300 bg-white px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-dark-500 dark:bg-dark-900 dark:text-dark-100"
                                  value={header.column.getFilterValue() ?? ""}
                                  onChange={(e) =>
                                    header.column.setFilterValue(
                                      e.target.value || undefined,
                                    )
                                  }
                                >
                                  <option value="">All</option>
                                  <option value="0">Pending</option>
                                  <option value="1">Approved</option>
                                  <option value="2">Rejected</option>
                                </select>
                              ) : (
                                <input
                                  type="text"
                                  value={header.column.getFilterValue() ?? ""}
                                  onChange={(e) =>
                                    header.column.setFilterValue(
                                      e.target.value || undefined,
                                    )
                                  }
                                  placeholder={String(
                                    header.column.columnDef.header ?? "",
                                  )}
                                  className="mt-1 w-full rounded border border-gray-300 bg-white px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-dark-500 dark:bg-dark-900 dark:text-dark-100"
                                />
                              )
                            ) : null}
                          </Th>
                        ))}
                      </Tr>
                    ))}
                  </THead>
                  <TBody>
                    {table.getRowModel().rows.length === 0 ? (
                      <Tr>
                        <Td
                          colSpan={columns.length}
                          className="py-16 text-center text-sm text-gray-500 dark:text-dark-400"
                        >
                          No revision requests found
                        </Td>
                      </Tr>
                    ) : (
                      table.getRowModel().rows.map((row) => (
                        <Tr
                          key={row.id}
                          className="relative border-y border-transparent border-b-gray-200 dark:border-b-dark-500"
                        >
                          {row.getVisibleCells().map((cell) => (
                            <Td
                              key={cell.id}
                              className={clsx(
                                "relative bg-white",
                                cardSkin === "shadow" ? "dark:bg-dark-700" : "dark:bg-dark-900",
                              )}
                            >
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </Td>
                          ))}
                        </Tr>
                      ))
                    )}
                  </TBody>
                </Table>
              </div>
              {table.getCoreRowModel().rows.length > 0 && (
                <div
                  className={clsx(
                    "px-4 pb-4 pt-4 sm:px-5",
                    tableSettings.enableFullScreen &&
                      "bg-gray-50 dark:bg-dark-800",
                  )}
                >
                  <PaginationSection table={table} />
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>

      {/* Approve/Reject Modal */}
      {modalOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="dark:bg-dark-800 w-full max-w-2xl rounded-xl bg-white p-6 shadow-2xl mx-4">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Approve Cancelation Request
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Reason For Action
              </label>
              <div className="rounded-lg border border-gray-300 bg-gray-50 p-3 text-sm dark:border-dark-500 dark:bg-dark-700">
                {selectedRequest.reason || "No reason provided"}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Remark <span className="text-red-500">*</span>
              </label>
              <textarea
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-dark-500 dark:bg-dark-700 dark:text-white"
                rows="4"
                placeholder="Reason For Accept / Reject"
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setModalOpen(false)}
                disabled={actionLoading}
                className="dark:border-dark-500 dark:text-dark-200 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading ? "Processing..." : "Reject"}
              </button>
              <button
                onClick={handleApprove}
                disabled={actionLoading}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
              >
                {actionLoading ? "Processing..." : "Approve"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Page>
  );
}
