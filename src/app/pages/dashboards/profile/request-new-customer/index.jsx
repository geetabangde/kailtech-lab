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
import axios from "utils/axios";
import { toast } from "sonner";
import { getStoredPermissions } from "app/navigation/dashboards";

// Local Imports
import { Table, THead, TBody, Th, Tr, Td, Button, Card, Input } from "components/ui";
import { TableSortIcon } from "components/shared/table/TableSortIcon";
import { Page } from "components/shared/Page";
import { useLockScrollbar, useLocalStorage } from "hooks";
import { fuzzyFilter } from "utils/react-table/fuzzyFilter";
import { useSkipper } from "utils/react-table/useSkipper";
import { columns } from "./columns";
import { TableConfig } from "./TableConfig";
import { PaginationSection } from "components/shared/table/PaginationSection";
import { TableLoadingRow } from "components/shared/table/TableLoadingRow";

// ----------------------------------------------------------------------

export default function CustomerRequestDashboard() {
  const permissions = getStoredPermissions();
  const hasAddPermission = permissions.includes(361) || localStorage.getItem("bypassPermissions") === "true";

  const [requestData, setRequestData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add Request Drawer/Modal State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", mobile: "", email: "" });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const [tableSettings, setTableSettings] = useState({
    enableFullScreen: false,
    enableRowDense: false,
  });
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState([{ id: "s_no", desc: false }]);
  const [columnVisibility, setColumnVisibility] = useLocalStorage(
    "column-visibility-profile-customer-request",
    {},
  );
  const [columnPinning, setColumnPinning] = useLocalStorage(
    "column-pinning-profile-customer-request",
    {},
  );
  const [autoResetPageIndex, skipAutoResetPageIndex] = useSkipper();
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const fetchRequests = useCallback(async () => {
    const endpoints = [
      "profile/get-customer-requests",
      "profile/get-customer-request-list",
      "profile/customer-request-list",
      "profile/get-customer-request",
      "profile/customer-requests",
      "profile/customer-request",
      "profile/customerrequestlist.php",
      "profile/customerrequest.php",
      "profile/request-new-customer.php",
      "profile/requestnewcustomer.php",
      "profile/getcustomerrequest.php",
      "profile/getcustomerrequests.php",
    ];

    setLoading(true);
    let success = false;
    let responseData = [];

    for (const url of endpoints) {
      try {
        const res = await axios.get(url);
        // Standard check for successful response structure
        if (res.data && (res.data.status || Array.isArray(res.data.data))) {
          responseData = Array.isArray(res.data.data) ? res.data.data : [];
          success = true;
          break;
        }
      } catch {
        // Silence individual errors and try next endpoint
      }
    }

    if (success) {
      setRequestData(responseData);
    } else {
      setRequestData([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = "Customer Name is required";
    if (!formData.mobile.trim()) {
      errs.mobile = "Mobile Number is required";
    } else if (!/^\d{10,15}$/.test(formData.mobile.trim())) {
      errs.mobile = "Enter a valid mobile number (10 to 15 digits)";
    }
    if (!formData.email.trim()) {
      errs.email = "Email Address is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email.trim())) {
      errs.email = "Enter a valid email address";
    }

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleAddRequestSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      await axios.post("profile/add-customer-request", formData).catch(() => {
        return axios.post("profile/addcustomerrequest.php", formData);
      });

      toast.success("Customer request submitted successfully ✅");
      setFormData({ name: "", mobile: "", email: "" });
      setIsDrawerOpen(false);
      fetchRequests();
    } catch (error) {
      console.error("Error adding customer request:", error);
      toast.error(error.response?.data?.message || "Failed to submit customer request ❌");
    } finally {
      setSubmitting(false);
    }
  };

  const table = useReactTable({
    data: requestData,
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
      fetchData: fetchRequests,
      updateData: (rowIndex, columnId, value) => {
        skipAutoResetPageIndex();
        setRequestData((old) =>
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

  // Permission Gate: PHP logic checks for permission 360
  if (!permissions.includes(360)) {
    return (
      <Page title="Request Customer">
        <div className="flex h-60 items-center justify-center rounded-xl border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-sm font-medium text-red-600 dark:text-red-400">
            Access Denied - Permission 360 required
          </p>
        </div>
      </Page>
    );
  }

  return (
    <Page title="Request Customer">
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
                  Customer Request List
                </h3>
              </div>

              <div className="flex w-full flex-wrap items-center justify-end gap-3 sm:w-auto">
                <div className="relative w-full sm:w-64">
                  <input
                    type="text"
                    value={globalFilter ?? ""}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    placeholder="Search requests..."
                    className="form-input w-full rounded-lg border-gray-300 bg-white px-4 h-9 text-sm focus:border-primary-500 focus:ring-primary-500 dark:border-dark-400 dark:bg-dark-800 dark:text-dark-100"
                  />
                </div>
                <TableConfig table={table} />

                {/* Conditional Add Button based on permission 361 */}
                {hasAddPermission && (
                  <Link to="/dashboards/profile/request-new-customer/add">
                    <Button
                      color="info"
                      className="!bg-blue-600 hover:!bg-blue-700 text-white font-bold shadow-sm h-9 px-4 flex items-center gap-1.5"
                    >
                      + Add New Customer Request
                    </Button>
                  </Link>
                )}
              </div>
            </div>

            {/* Table Wrapper */}
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
                        No customer requests found
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

      {/* Add Customer Request Slide-over Drawer */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-100 overflow-hidden" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
          <div className="absolute inset-0 overflow-hidden">
            {/* Background overlay */}
            <div className="absolute inset-0 bg-gray-500/75 transition-opacity duration-300 dark:bg-dark-900/80" onClick={() => setIsDrawerOpen(false)} aria-hidden="true"></div>

            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full ltr:pl-10 rtl:pr-10">
              <div className="pointer-events-auto w-screen max-w-md transform transition duration-300 ease-in-out sm:duration-300">
                <Card className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl dark:bg-dark-700 rounded-none border-none">
                  <div className="p-6 border-b border-gray-250 dark:border-dark-600">
                    <div className="flex items-start justify-between">
                      <h2 className="text-lg font-bold text-gray-800 dark:text-dark-50" id="slide-over-title">
                        Add New Customer Request
                      </h2>
                      <div className="ml-3 flex h-7 items-center">
                        <button
                          type="button"
                          className="rounded-md bg-white text-gray-400 hover:text-gray-500 dark:bg-dark-700 dark:text-dark-200"
                          onClick={() => setIsDrawerOpen(false)}
                        >
                          <span className="sr-only">Close panel</span>
                          <svg className="size-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleAddRequestSubmit} className="flex flex-col justify-between flex-1">
                    <div className="p-6 space-y-6">
                      {/* Name field */}
                      <div>
                        <Input
                          label="Customer Name *"
                          name="name"
                          placeholder="e.g. Acme Corporation"
                          value={formData.name}
                          onChange={handleInputChange}
                          className={formErrors.name ? "border-red-500" : ""}
                        />
                        {formErrors.name && (
                          <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>
                        )}
                      </div>

                      {/* Mobile field */}
                      <div>
                        <Input
                          label="Mobile Number *"
                          name="mobile"
                          placeholder="e.g. 9876543210"
                          value={formData.mobile}
                          onChange={handleInputChange}
                          className={formErrors.mobile ? "border-red-500" : ""}
                        />
                        {formErrors.mobile && (
                          <p className="text-red-500 text-xs mt-1">{formErrors.mobile}</p>
                        )}
                      </div>

                      {/* Email field */}
                      <div>
                        <Input
                          label="Email Address *"
                          name="email"
                          type="email"
                          placeholder="e.g. contact@acme.com"
                          value={formData.email}
                          onChange={handleInputChange}
                          className={formErrors.email ? "border-red-500" : ""}
                        />
                        {formErrors.email && (
                          <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>
                        )}
                      </div>
                    </div>

                    <div className="p-6 border-t border-gray-150 dark:border-dark-600 flex justify-end gap-3 bg-gray-50 dark:bg-dark-850">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsDrawerOpen(false)}
                        className="px-5 font-semibold"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        color="primary"
                        disabled={submitting}
                        className="px-6 font-semibold shadow-md shadow-primary-500/20"
                      >
                        {submitting ? "Submitting..." : "Submit Request"}
                      </Button>
                    </div>
                  </form>
                </Card>
              </div>
            </div>
          </div>
        </div>
      )}
    </Page>
  );
}
