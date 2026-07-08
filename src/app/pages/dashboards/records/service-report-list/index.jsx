import { useState, useEffect, Fragment } from "react";
import { Link } from "react-router";
import { Page } from "components/shared/Page";
import { Table, Card, THead, TBody, Th, Tr, Td, Button, Input } from "components/ui";
import { TableSortIcon } from "components/shared/table/TableSortIcon";
import { PaginationSection } from "components/shared/table/PaginationSection";
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from "@headlessui/react";
import axios from "utils/axios";
import { toast } from "sonner";
import { useReactTable, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, flexRender } from "@tanstack/react-table";
import { fuzzyFilter } from "utils/react-table/fuzzyFilter";
import { MagnifyingGlassIcon, ArrowUpTrayIcon, EyeIcon } from "@heroicons/react/24/outline";

// PHP: permission helper
function usePermissions() {
  const p = localStorage.getItem("userPermissions");
  try {
    return JSON.parse(p) || [];
  } catch {
    return p?.split(",").map(Number) || [];
  }
}

// Format date helper matching PHP date formats
function formatDate(dateStr) {
  if (!dateStr || dateStr === "0000-00-00" || dateStr === "0000-00-00 00:00:00") {
    return "-";
  }
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
}

export default function ServiceReportList() {
  const permissions = usePermissions();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState([{ id: "id", desc: true }]);

  // Upload Modal State
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const fetchServiceReports = async () => {
    setLoading(true);
    try {
      // PHP counterpart endpoint
      const response = await axios.get("/records/service-report");
      const rawData = response.data?.data || response.data || [];
      setData(rawData);
    } catch (err) {
      console.error("Error fetching service reports:", err);
      toast.error("Failed to load service reports list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (permissions.includes(108)) {
      fetchServiceReports();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openUploadModal = (row) => {
    setSelectedRow(row);
    setSelectedFile(null);
    setIsUploadOpen(true);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.warning("Please choose a file to upload.");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("inwardid", selectedRow.id);
    formData.append("signed_report", selectedFile);

    try {
      // POST to PHP counterpart endpoint uploadseriveReportfile.php
      const res = await axios.post("/records/upload-service-report", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.data?.success || res.data?.status === "success") {
        toast.success("Signed report uploaded successfully.");
        setIsUploadOpen(false);
        fetchServiceReports();
      } else {
        toast.error(res.data?.message || "Failed to upload report.");
      }
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Something went wrong during file upload.");
    } finally {
      setUploading(false);
    }
  };

  // TanStack table columns definitions
  const columns = [
    {
      id: "id",
      header: "ID",
      accessorKey: "id",
      cell: ({ getValue }) => (
        <span className="font-semibold text-gray-500 font-mono">
          {getValue()}
        </span>
      ),
    },
    {
      id: "inwarddate",
      header: "Date",
      accessorKey: "date",
      cell: ({ getValue }) => (
        <span className="whitespace-nowrap text-gray-700">
          {formatDate(getValue())}
        </span>
      ),
    },
    {
      id: "inwardid",
      header: "Inward Entry No",
      accessorKey: "inwardid",
      cell: ({ row }) => (
        <span className="font-semibold text-primary-600">
          {row.original.inwardid}
        </span>
      ),
    },
    {
      id: "customername",
      header: "Customer",
      accessorKey: "customername",
      cell: ({ getValue }) => (
        <span className="font-medium text-gray-800">
          {getValue() || "-"}
        </span>
      ),
    },
    {
      id: "concernpersonname",
      header: "Contact Person",
      accessorKey: "concernpersonname",
      cell: ({ row }) => {
        const { concernpersonname, concernpersondesignation, concernpersonemail, concernpersonmobile } = row.original;
        return (
          <div className="flex flex-col gap-0.5 text-xs">
            <span className="font-medium text-gray-800">{concernpersonname || "-"}</span>
            <span className="text-sm text-gray-700">{concernpersondesignation || "-"}</span>
            <span className="text-sm text-gray-700">{concernpersonemail || "-"}</span>
            <span className="text-sm text-gray-700">{concernpersonmobile || "-"}</span>
          </div>
        )
      },
    },
    {
      id: "action",
      header: "Action",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {/* View Service Report */}
          <Link
            to={`/dashboards/records/service-report-list/view/${row.original.id}`}
            className="inline-flex items-center justify-center rounded bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold px-2.5 py-1 text-xxs border border-blue-200 transition gap-1"
          >
            <EyeIcon className="h-3.5 w-3.5" />
            View Service Report
          </Link>

          {/* Upload Button */}
          <Button
            size="xs"
            color="primary"
            onClick={() => openUploadModal(row.original)}
            className="flex items-center gap-1.5 font-semibold text-xxs"
          >
            <ArrowUpTrayIcon className="h-3.5 w-3.5" />
            Upload Signed File
          </Button>

          {/* View Signed Report (if exists) */}
          {row.original.file && (
            <a
              href={`https://kailtech.thehostme.com/2025_05_07/kailtech_new/${row.original.file}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold px-2.5 py-1 text-xxs border border-emerald-200 transition gap-1"
            >
              <EyeIcon className="h-3.5 w-3.5" />
              View Signed File
            </a>
          )}
        </div>
      ),
    },
  ];

  // TanStack table setup
  const table = useReactTable({
    data,
    columns,
    state: {
      globalFilter,
      sorting,
    },
    filterFns: { fuzzy: fuzzyFilter },
    enableSorting: true,
    enableColumnFilters: true,
    getCoreRowModel: getCoreRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: fuzzyFilter,
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 25, // PHP: "pageLength": 25
      },
    },
  });

  // Verify permission 108
  if (!permissions.includes(108)) {
    return (
      <Page title="Work Completion List">
        <div className="flex h-60 items-center justify-center rounded-xl border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-sm font-medium text-red-600 dark:text-red-400">
            Access Denied - Permission 108 required for Work Completion Report
          </p>
        </div>
      </Page>
    );
  }

  return (
    <Page title="Work Completion List">
      <div className="transition-content w-full pb-5 max-w-7xl mx-auto">

        {/* Title Block */}
        <div className="mb-6">
          <h2 className="text-xl font-bold tracking-wide text-gray-800 dark:text-dark-50">
            Work Completion Report
          </h2>
        </div>

        {/* Search Bar / Table controls Card */}
        <Card className="p-4 mb-6 no-print flex items-center justify-between gap-4">
          <div className="flex shrink-0 space-x-2">
            <Input
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              prefix={<MagnifyingGlassIcon className="size-4" />}
              classNames={{
                input: "h-8.5 text-xs focus:ring-2 focus:ring-primary-500/50",
                root: "w-72",
              }}
              placeholder="Search ID, Inward No, Customer..."
            />
          </div>
        </Card>

        {/* Results Card */}
        <Card className="overflow-hidden">
          {loading ? (
            <div className="flex h-60 items-center justify-center text-gray-500 gap-3">
              <svg className="animate-spin h-7 w-7 text-blue-500" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z" />
              </svg>
              Loading Work Completion reports...
            </div>
          ) : (
            <>
              <div className="table-wrapper min-w-full overflow-x-auto">
                <Table hoverable className="w-full text-left rtl:text-right text-xs">
                  <THead>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <Tr key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <Th
                            key={header.id}
                            className="bg-gray-100 dark:bg-dark-800 border-b border-gray-200 dark:border-dark-700 font-semibold uppercase text-gray-800 dark:text-dark-100 first:ltr:rounded-tl-lg last:ltr:rounded-tr-lg"
                          >
                            {header.column.getCanSort() ? (
                              <div
                                className="flex cursor-pointer select-none items-center space-x-3"
                                onClick={header.column.getToggleSortingHandler()}
                              >
                                <span className="flex-1">
                                  {flexRender(header.column.columnDef.header, header.getContext())}
                                </span>
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
                    {table.getRowModel().rows.length > 0 ? (
                      table.getRowModel().rows.map((row) => (
                        <Tr
                          key={row.id}
                          className="border-b border-gray-200 dark:border-dark-700 hover:bg-gray-50/50 dark:hover:bg-dark-800/30"
                        >
                          {row.getVisibleCells().map((cell) => (
                            <Td key={cell.id} className="p-3">
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </Td>
                          ))}
                        </Tr>
                      ))
                    ) : (
                      <Tr>
                        <td colSpan={6} className="p-8 text-center text-gray-400 dark:text-dark-500 italic">
                          No service reports found.
                        </td>
                      </Tr>
                    )}
                  </TBody>
                </Table>
              </div>

              {table.getCoreRowModel().rows.length > 0 && (
                <div className="px-4 pb-4 pt-4 bg-gray-50/50 dark:bg-dark-800/20">
                  <PaginationSection table={table} />
                </div>
              )}
            </>
          )}
        </Card>

        {/* Upload Modal Dialog */}
        <Transition appear show={isUploadOpen} as={Fragment}>
          <Dialog as="div" className="relative z-100" onClose={() => !uploading && setIsUploadOpen(false)}>
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-gray-900/50 dark:bg-black/60 transition-opacity" />
            </TransitionChild>

            <div className="fixed inset-0 z-100 overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-4 text-center">
                <TransitionChild
                  as={Fragment}
                  enter="ease-out duration-300"
                  enterFrom="opacity-0 scale-95"
                  enterTo="opacity-100 scale-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100 scale-100"
                  leaveTo="opacity-0 scale-95"
                >
                  <DialogPanel className="w-full max-w-lg transform overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl transition-all dark:bg-dark-700">
                    <DialogTitle as="h3" className="text-base font-bold text-gray-900 dark:text-dark-50 border-b pb-3 mb-4">
                      Upload Signed Service Report File
                    </DialogTitle>

                    {selectedRow && (
                      <div className="mb-4 text-xs text-gray-500 dark:text-dark-300">
                        <p><strong>Inward Entry No:</strong> {selectedRow.bookingrefno || selectedRow.id}</p>
                        <p className="mt-1"><strong>Customer:</strong> {selectedRow.customername}</p>
                      </div>
                    )}

                    <form onSubmit={handleUploadSubmit}>
                      <div className="flex flex-col gap-2 mb-6">
                        <label className="text-xs font-semibold text-gray-700 dark:text-dark-300">
                          Select Signed File (PDF or Image formats)
                        </label>
                        <Input
                          type="file"
                          onChange={handleFileChange}
                          accept=".pdf,.jpg,.jpeg,.png"
                          disabled={uploading}
                          className="w-full text-xs"
                        />
                      </div>

                      <div className="flex justify-end gap-2 border-t pt-4">
                        <Button
                          type="button"
                          variant="outlined"
                          size="sm"
                          onClick={() => setIsUploadOpen(false)}
                          disabled={uploading}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          color="primary"
                          size="sm"
                          disabled={uploading || !selectedFile}
                          className="flex items-center gap-1.5"
                        >
                          {uploading ? (
                            <>
                              <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z" />
                              </svg>
                              Uploading...
                            </>
                          ) : (
                            <>
                              <ArrowUpTrayIcon className="h-4 w-4" />
                              Upload File
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </DialogPanel>
                </TransitionChild>
              </div>
            </div>
          </Dialog>
        </Transition>
      </div>
    </Page>
  );
}
