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

// Local Imports
import { Table, Card, THead, TBody, Th, Tr, Td } from "components/ui";
import { TableSortIcon } from "components/shared/table/TableSortIcon";
import { Page } from "components/shared/Page";
import { useLockScrollbar, useDidUpdate, useLocalStorage } from "hooks";
import { fuzzyFilter } from "utils/react-table/fuzzyFilter";
import { useSkipper } from "utils/react-table/useSkipper";
import { Toolbar } from "./Toolbar";
import { columns } from "./columns";
import { PaginationSection } from "components/shared/table/PaginationSection";
import { useThemeContext } from "app/contexts/theme/context";

export default function RevisionRequestsPage() {
  const { cardSkin } = useThemeContext();
  const permissions = JSON.parse(localStorage.getItem("userPermissions") || "[]");

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionReason, setActionReason] = useState("");
  const [actionRemark, setActionRemark] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // ✅ Fetch requests from API
  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get("/testing/rev-request-testing-data");

      if (response.data && Array.isArray(response.data)) {
        setRequests(response.data);
      } else if (response.data.data && Array.isArray(response.data.data)) {
        setRequests(response.data.data);
      } else {
        setRequests([]);
      }
    } catch (err) {
      console.error("Error fetching revision requests:", err);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (permissions.includes(412)) {
      fetchRequests();
    }
  }, [permissions, fetchRequests]);

  const [tableSettings, setTableSettings] = useState({
    enableFullScreen: false,
    enableRowDense: false,
  });

  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState([{ id: "id", desc: true }]);

  const [columnVisibility, setColumnVisibility] = useLocalStorage(
    "column-visibility-revision-requests",
    {},
  );

  const [columnPinning, setColumnPinning] = useLocalStorage(
    "column-pinning-revision-requests",
    {},
  );

  const [autoResetPageIndex, skipAutoResetPageIndex] = useSkipper();

  const table = useReactTable({
    data: requests,
    columns: columns,
    state: {
      globalFilter,
      sorting,
      columnVisibility,
      columnPinning,
      tableSettings,
    },
    meta: {
      updateData: (rowIndex, columnId, value) => {
        skipAutoResetPageIndex();
        setRequests((old) =>
          old.map((row, index) =>
            index === rowIndex ? { ...old[rowIndex], [columnId]: value } : row
          )
        );
      },
      refreshData: fetchRequests,
      openApproveModal: (row) => {
        setSelectedRequest(row.original);
        setActionReason(row.original.reason || "");
        setActionRemark(row.original.remark || "");
        setModalOpen(true);
      },
      setTableSettings,
    },
    filterFns: { fuzzy: fuzzyFilter },
    enableSorting: true,
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
  });

  useDidUpdate(() => table.resetRowSelection(), [requests]);
  useLockScrollbar(tableSettings.enableFullScreen);

  // ✅ Handle Approve / Reject
  const handleAction = async (type) => {
    if (!actionReason) {
      toast.error("Reason is required");
      return;
    }

    setSubmitting(true);
    try {
      const endpoint = type === "approve" ? "/testing/approve-rev-request-testing" : "/testing/reject-rev-request-testing";
      await axios.post(endpoint, {
        revrequestid: selectedRequest.id,
        reason: actionReason,
        remark: actionRemark,
      });

      toast.success(`Request ${type}d successfully ✅`);
      setModalOpen(false);
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${type} request ❌`);
    } finally {
      setSubmitting(false);
    }
  };

  if (!permissions.includes(412)) {
    return (
      <Page title="Revision Requests">
        <div className="flex h-60 items-center justify-center rounded-xl border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-sm font-medium text-red-600 dark:text-red-400">
            ⛔ Access Denied — Permission 412 required
          </p>
        </div>
      </Page>
    );
  }

  if (loading) {
    return (
      <Page title="Revision Requests">
        <div className="flex h-[60vh] items-center justify-center text-gray-600">
          <svg className="animate-spin h-6 w-6 mr-2 text-blue-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z"></path>
          </svg>
          Loading Revision Requests...
        </div>
      </Page>
    );
  }

  return (
    <Page title="Revision Requests">
      <div className="transition-content w-full pb-5">
        <div className={clsx("flex h-full w-full flex-col", tableSettings.enableFullScreen && "fixed inset-0 z-61 bg-white pt-3 dark:bg-dark-900")}>
          <Toolbar table={table} />
          <div className={clsx("transition-content flex grow flex-col pt-3", tableSettings.enableFullScreen ? "overflow-hidden" : "px-[var(--margin-x)]")}>
            <Card className={clsx("relative flex grow flex-col", tableSettings.enableFullScreen && "overflow-hidden")}>
              <div className="table-wrapper min-w-full grow overflow-x-auto">
                <Table hoverable dense={tableSettings.enableRowDense} sticky={tableSettings.enableFullScreen} className="w-full text-left rtl:text-right">
                  <THead>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <Tr key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <Th key={header.id} className="bg-gray-200 font-semibold uppercase text-gray-800 dark:bg-dark-800 dark:text-dark-100 first:ltr:rounded-tl-lg last:ltr:rounded-tr-lg">
                            {header.column.getCanSort() ? (
                              <div className="flex cursor-pointer select-none items-center space-x-3" onClick={header.column.getToggleSortingHandler()}>
                                <span className="flex-1">{flexRender(header.column.columnDef.header, header.getContext())}</span>
                                <TableSortIcon sorted={header.column.getIsSorted()} />
                              </div>
                            ) : flexRender(header.column.columnDef.header, header.getContext())}
                          </Th>
                        ))}
                      </Tr>
                    ))}
                  </THead>
                  <TBody>
                    {requests.length === 0 ? (
                      <Tr><Td colSpan={99} className="py-20 text-center text-gray-400">No revision requests found.</Td></Tr>
                    ) : (
                      table.getRowModel().rows.map((row) => (
                        <Tr key={row.id} className="border-b border-gray-200 dark:border-b-dark-500">
                          {row.getVisibleCells().map((cell) => (
                            <Td key={cell.id} className={clsx("bg-white", cardSkin === "shadow" ? "dark:bg-dark-700" : "dark:bg-dark-900")}>
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </Td>
                          ))}
                        </Tr>
                      ))
                    )}
                  </TBody>
                </Table>
              </div>
              <div className="px-4 pb-4 sm:px-5 sm:pt-4">
                <PaginationSection table={table} />
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Approve / Reject Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl dark:bg-dark-700">
            <div className="mb-4 flex items-center justify-between border-b pb-3 dark:border-dark-500">
              <h3 className="text-lg font-bold text-gray-800 dark:text-dark-100">Approve Revision Request</h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-600 dark:text-dark-300">Reason For Action</label>
                <textarea
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 p-2.5 text-sm dark:border-dark-500 dark:bg-dark-800 dark:text-dark-100"
                  rows={3}
                  placeholder="Reason For Accept / Reject"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-600 dark:text-dark-300">Remark</label>
                <textarea
                  value={actionRemark}
                  onChange={(e) => setActionRemark(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 p-2.5 text-sm dark:border-dark-500 dark:bg-dark-800 dark:text-dark-100"
                  rows={3}
                  placeholder="Additional remarks"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => handleAction("reject")}
                disabled={submitting}
                className="rounded-lg bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                Reject
              </button>
              <button
                onClick={() => handleAction("approve")}
                disabled={submitting}
                className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </Page>
  );
}