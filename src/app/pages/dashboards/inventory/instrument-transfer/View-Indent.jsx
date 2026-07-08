// Import Dependencies
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import clsx from "clsx";
import { useState, useEffect, useMemo } from "react";
import axios from "utils/axios";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

// Local Imports
import { Table, THead, TBody, Th, Tr, Td, Button, Card, ReactSelect as Select } from "components/ui";
import { TableSortIcon } from "components/shared/table/TableSortIcon";
import { Page } from "components/shared/Page";
import { PaginationSection } from "components/shared/table/PaginationSection";
import { useLockScrollbar } from "hooks";

// ----------------------------------------------------------------------

const columnHelper = createColumnHelper();

function usePermissions() {
  const p = localStorage.getItem("userPermissions");
  try {
    return JSON.parse(p) || [];
  } catch {
    return p?.split(",").map(Number) || [];
  }
}

export default function ViewIndent() {
  const permissions = usePermissions();
  const navigate = useNavigate();

  const [indents, setIndents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [tableSettings, setTableSettings] = useState({
    enableFullScreen: false,
    enableRowDense: false,
  });

  const [sorting, setSorting] = useState([{ id: "added_on", desc: true }]);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 25,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Adjust this endpoint based on your actual Node API
      const response = await axios.get("inventory/indent-data");
      if (response.data.status && Array.isArray(response.data.data)) {
        setIndents(response.data.data);
      } else {
        setIndents([]);
      }
    } catch (err) {
      console.error("Error fetching indent data:", err);
      toast.error("Failed to fetch indents");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = (id) => {
    navigate(`/dashboards/inventory/edit-indent-approve?hakuna=${id}`);
  };

  const handleReject = async (id) => {
    if (!window.confirm("Are you sure you want to reject this indent?")) return;
    
    try {
      const response = await axios.post("inventory/reject-indent", { id, decision: "reject" });
      if (response.data.status) {
        toast.success("Indent rejected successfully");
        fetchData(); // Refresh table
      } else {
        toast.error(response.data.message || "Failed to reject indent");
      }
    } catch (err) {
      console.error("Error rejecting indent:", err);
      toast.error("An error occurred");
    }
  };

  const handleViewDetails = (id) => {
    navigate(`/dashboards/inventory/view-full-indent?hakuna=${id}`);
  };

  const handleTransfer = (id) => {
    navigate(`/dashboards/inventory/instrument-transfer/add?hakuna=${id}`);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this indent?")) return;
    try {
      const response = await axios.post("inventory/delete-indent", { id });
      if (response.data.status) {
        toast.success("Indent deleted successfully");
        fetchData();
      } else {
        toast.error(response.data.message || "Failed to delete indent");
      }
    } catch (err) {
      console.error("Error deleting indent:", err);
      toast.error("An error occurred");
    }
  };

  const columns = useMemo(() => [
    columnHelper.accessor((row, index) => index + 1, {
      id: "srNo",
      header: "Id",
      cell: (info) => info.row.index + 1,
    }),
    columnHelper.accessor("indent_no", {
      header: "Indent No.",
    }),
    columnHelper.accessor("raised_by", {
      header: "Raised By",
    }),
    columnHelper.accessor("priority", {
      header: "Priority",
    }),
    columnHelper.accessor("indent_type", {
      header: "Indent Type",
    }),
    columnHelper.accessor("item_name", {
      header: "Item Name",
    }),
    columnHelper.accessor("added_on", {
      header: "Added On",
    }),
    columnHelper.accessor("status", {
      header: "Status",
      filterFn: (row, columnId, filterValue) => {
        if (!filterValue) return true;
        // In original code: 1: Pending, 2: Approved, 3: Completed, 91: Rejected
        return String(row.original.status_id) === String(filterValue);
      },
      cell: (info) => {
        // You can customize how status looks here based on info.getValue()
        return info.getValue();
      }
    }),
    columnHelper.display({
      id: "action",
      header: "Action",
      cell: (info) => {
        const row = info.row.original;
        // Default to true if permissions object is missing, to avoid breaking existing dev data
        const perms = row.permissions || {
          canViewDetails: true,
          canApprove: true,
          canDelete: false,
          canTransfer: false
        };

        return (
          <div className="flex items-center gap-2">
            {perms.canViewDetails && (
              <Button
                size="sm"
                color="primary"
                className="px-2 py-1 text-xs whitespace-nowrap bg-purple-600 hover:bg-purple-700 text-white"
                onClick={() => handleViewDetails(row.id)}
              >
                View Details
              </Button>
            )}
            
            {perms.canApprove && (
              <Button
                size="sm"
                color="success"
                className="px-2 py-1 text-xs whitespace-nowrap"
                onClick={() => handleApprove(row.id)}
              >
                Approve
              </Button>
            )}
            
            {perms.canApprove && ( // Using canApprove for reject as well since they go together in the old logic
              <Button
                size="sm"
                color="danger"
                className="px-2 py-1 text-xs whitespace-nowrap"
                onClick={() => handleReject(row.id)}
              >
                Reject
              </Button>
            )}

            {perms.canTransfer && (
              <Button
                size="sm"
                color="info"
                className="px-2 py-1 text-xs whitespace-nowrap"
                onClick={() => handleTransfer(row.id)}
              >
                Transfer
              </Button>
            )}

            {perms.canDelete && (
              <Button
                size="sm"
                color="danger"
                className="px-2 py-1 text-xs whitespace-nowrap bg-red-600 hover:bg-red-700 text-white"
                onClick={() => handleDelete(row.id)}
              >
                Delete
              </Button>
            )}
          </div>
        );
      },
    }),
  ], [navigate]);

  const table = useReactTable({
    data: indents,
    columns,
    state: {
      sorting,
      pagination,
      columnFilters: statusFilter ? [{ id: "status", value: statusFilter }] : [],
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
  });

  useLockScrollbar(tableSettings.enableFullScreen);

  // Permission Check (PHP: 134)
  if (!permissions.includes(134)) {
    return (
      <Page title="Manage Indent">
        <div className="flex h-60 items-center justify-center rounded-xl border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-sm font-medium text-red-600 dark:text-red-400">
            Access Denied - Permission 134 required
          </p>
        </div>
      </Page>
    );
  }

  const statusOptions = [
    { value: "", label: "All" },
    { value: "1", label: "Pending" },
    { value: "2", label: "Approved/ Transfer Pending" },
    { value: "3", label: "Completed" },
    { value: "91", label: "Rejected" },
  ];

  return (
    <Page title="Manage Indent">
      <div className="transition-content w-full pb-5">
        <div
          className={clsx(
            "flex h-full w-full flex-col",
            tableSettings.enableFullScreen &&
            "fixed inset-0 z-61 bg-white pt-3 dark:bg-dark-900",
          )}
        >
          <Card className="flex flex-col border-none shadow-soft dark:bg-dark-700">
            <div className="flex flex-col items-start justify-between gap-4 border-b border-gray-200 p-4 dark:border-dark-500 sm:flex-row sm:items-center sm:p-5">
              <h3 className="text-lg font-bold text-gray-800 dark:text-dark-100">
                View Indent
              </h3>

              <div className="flex flex-wrap items-center gap-3">
                <div className="w-48">
                  <Select
                    options={statusOptions}
                    value={statusOptions.find(opt => opt.value === statusFilter)}
                    onChange={(selected) => setStatusFilter(selected?.value || "")}
                    placeholder="Filter by Status"
                    className="text-sm"
                  />
                </div>

                <Button
                  component={Link}
                  to="/dashboards/inventory/add-indent"
                  color="info"
                  variant="filled"
                  className="!bg-blue-600 !text-white hover:!bg-blue-700 font-bold shadow-sm whitespace-nowrap"
                >
                  + Generate Indent
                </Button>
              </div>
            </div>

            <div className="grow overflow-auto p-0">
              <Table hoverable dense={tableSettings.enableRowDense} className="w-full text-left">
                <THead>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <Tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <Th
                          key={header.id}
                          className="bg-gray-50 px-4 py-3 text-xs font-bold uppercase text-gray-600 dark:bg-dark-800 dark:text-dark-200"
                        >
                          {header.column.getCanSort() ? (
                            <div
                              className="flex cursor-pointer select-none items-center gap-2"
                              onClick={header.column.getToggleSortingHandler()}
                            >
                              {flexRender(header.column.columnDef.header, header.getContext())}
                              <TableSortIcon sorted={header.column.getIsSorted()} />
                            </div>
                          ) : (
                            flexRender(header.column.columnDef.header, header.getContext())
                          )}
                        </Th>
                      ))}
                    </Tr>
                  ))}
                </THead>
                <TBody>
                  {loading ? (
                    <Tr>
                      <Td colSpan={columns.length} className="h-24 text-center">
                        Loading...
                      </Td>
                    </Tr>
                  ) : table.getRowModel().rows.length > 0 ? (
                    table.getRowModel().rows.map((row) => (
                      <Tr key={row.id} className="border-b border-gray-100 last:border-0 dark:border-dark-600">
                        {row.getVisibleCells().map((cell) => (
                          <Td key={cell.id} className="px-4 py-3 text-sm">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </Td>
                        ))}
                      </Tr>
                    ))
                  ) : (
                    <Tr>
                      <Td colSpan={columns.length} className="h-24 text-center text-gray-500">
                        No indents found
                      </Td>
                    </Tr>
                  )}
                </TBody>
              </Table>
            </div>

            <div className="border-t border-gray-100 p-4 dark:border-dark-600 sm:p-5">
              <PaginationSection table={table} />
            </div>
          </Card>
        </div>
      </div>
    </Page>
  );
}
