import { useState, useEffect, useCallback, useMemo, Fragment } from "react";
import { useSearchParams, useNavigate } from "react-router";
import axios from "utils/axios";
import { toast } from "sonner";
import Select from "react-select";
import clsx from "clsx";

import {
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  useReactTable,
  createColumnHelper,
} from "@tanstack/react-table";

import { MinusCircleIcon, PlusCircleIcon } from "@heroicons/react/24/solid";

import { Page } from "components/shared/Page";
import { Card } from "components/ui";
import { useThemeContext } from "app/contexts/theme/context";
import { ConfirmModal } from "components/shared/ConfirmModal";

const columnHelper = createColumnHelper();

// The expandable Action component
function RowActions({ row }) {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleReject = () => {
    setShowConfirm(true);
  };

  const handleConfirm = () => {
    console.log("Rejected parameter id:", row.original.id);
    setShowConfirm(false);
  };

  return (
    <div className="flex justify-start">
      <button
        onClick={handleReject}
        className="rounded-lg bg-red-50 px-4 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-100 focus:outline-none dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20 transition-colors"
      >
        Reject Parameter
      </button>

      <ConfirmModal
        show={showConfirm}
        onClose={() => setShowConfirm(false)}
        onOk={handleConfirm}
        state="pending"
        messages={{
          pending: {
            title: "Validate",
            description: "Are you sure you want to process?",
            actionText: "OK",
          },
        }}
      />
    </div>
  );
}

export default function Chemists() {
  const { cardSkin } = useThemeContext();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const defaultSearch = searchParams.get("search") || "";

  // State management
  const [chemistsData, setChemistsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [adminUsers, setAdminUsers] = useState([]);
  
  const [filters, setFilters] = useState({
    startdate: "",
    enddate: "",
    chemist: "",
    search: defaultSearch,
  });

  const [expanded, setExpanded] = useState({});

  // Fetch admin users for the dropdown
  const fetchAdminUsers = useCallback(async () => {
    try {
      const res = await axios.get("/register/get-lab-user");
      setAdminUsers(res.data?.data || []);
    } catch (err) {
      console.error("Error fetching admin users:", err);
    }
  }, []);

  // Fetch data using the parameter-wise-list API
  const fetchChemistsData = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.startdate) params.startdate = filters.startdate;
      if (filters.enddate) params.enddate = filters.enddate;
      if (filters.chemist) params.chemist = filters.chemist;
      if (filters.search) params.search = filters.search;

      const res = await axios.get("/register/parameter-wise-list", { params });
      setChemistsData(res.data?.data || []);
    } catch (err) {
      console.error("Error fetching parameter data:", err);
      toast.error("Failed to load parameters");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchAdminUsers();
  }, []);

  // Automatically search if there's a defaultSearch (LRN from the button)
  useEffect(() => {
    if (defaultSearch) {
      fetchChemistsData();
    }
  }, [defaultSearch]);

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = (e) => {
    e?.preventDefault?.();
    fetchChemistsData();
  };

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: "sno",
        header: "S. No.",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <button
              onClick={row.getToggleExpandedHandler()}
              className="focus:outline-none"
            >
              {row.getIsExpanded() ? (
                <MinusCircleIcon className="h-5 w-5 text-red-500" />
              ) : (
                <PlusCircleIcon className="h-5 w-5 text-green-500" />
              )}
            </button>
            <span>{row.index + 1}</span>
          </div>
        ),
      }),
      columnHelper.accessor("id", { header: "p. No.", cell: (info) => info.getValue() ?? "-" }),
      columnHelper.accessor("product", { header: "Product", cell: (info) => info.getValue() ?? "-" }),
      columnHelper.accessor("lrn", { header: "LRN", cell: (info) => info.getValue() ?? "-" }),
      columnHelper.accessor("parameter", { header: "Parameter", cell: (info) => info.getValue() ?? "-" }),
      columnHelper.accessor("description", { header: "Description", cell: (info) => info.getValue() ?? "-" }),
      columnHelper.accessor("department", { header: "Department", cell: (info) => info.getValue() ?? "-" }),
      columnHelper.accessor("chemist", { header: "Chemist", cell: (info) => info.getValue() ?? "-" }),
      columnHelper.accessor("allotmentdate", { header: "Assigned Date", cell: (info) => info.getValue() ?? "-" }),
      columnHelper.accessor("duedate", { header: "Due Date", cell: (info) => info.getValue() ?? "-" }),
      columnHelper.accessor("startdate", { header: "Start Date", cell: (info) => info.getValue() ?? "-" }),
      columnHelper.accessor("enddate", { header: "End Date", cell: (info) => info.getValue() ?? "-" }),
      columnHelper.accessor("time", { header: "TAT", cell: (info) => info.getValue() ?? "-" }),
    ],
    []
  );

  const table = useReactTable({
    data: chemistsData,
    columns,
    state: { expanded },
    onExpandedChange: setExpanded,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: () => true,
  });

  return (
    <Page title="Chemists List">
      <div className="transition-content w-full pb-5">
        <div className="px-[var(--margin-x)] pt-4">
          <div className="mb-4">
            <h2 className="text-xl font-semibold tracking-wide text-gray-800 dark:text-dark-50">
              Chemist List
            </h2>
          </div>

          {/* Search Form */}
          <form
            onSubmit={handleSearch}
            className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5"
          >
            {/* Start Date */}
            <div className="w-full">
              <label className="dark:text-dark-300 mb-1 block text-sm font-medium text-gray-600">
                Start Date
              </label>
              <input
                type="date"
                value={filters.startdate}
                onChange={(e) => handleFilterChange("startdate", e.target.value)}
                className="h-10 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-dark-500 dark:bg-dark-800 dark:text-dark-100"
              />
            </div>

            {/* End Date */}
            <div className="w-full">
              <label className="dark:text-dark-300 mb-1 block text-sm font-medium text-gray-600">
                End Date
              </label>
              <input
                type="date"
                value={filters.enddate}
                onChange={(e) => handleFilterChange("enddate", e.target.value)}
                className="h-10 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-dark-500 dark:bg-dark-800 dark:text-dark-100"
              />
            </div>

            {/* Chemist Select */}
            <div className="w-full">
              <label className="dark:text-dark-300 mb-1 block text-sm font-medium text-gray-600">
                Select Chemist
              </label>
              <Select
                options={adminUsers.map((c) => ({
                  value: String(c.id),
                  label: `${c.firstname || ""} ${c.lastname || ""}`.trim() || c.name || String(c.id),
                }))}
                value={
                  filters.chemist
                    ? {
                        value: String(filters.chemist),
                        label: (() => {
                          const found = adminUsers.find((c) => String(c.id) === String(filters.chemist));
                          return found
                            ? `${found.firstname || ""} ${found.lastname || ""}`.trim() || found.name
                            : String(filters.chemist);
                        })(),
                      }
                    : null
                }
                onChange={(option) => handleFilterChange("chemist", option ? option.value : "")}
                isClearable
                isSearchable
                placeholder="Select Chemist"
                className="w-full text-sm"
              />
            </div>

            {/* Search Input (LRN) */}
            <div className="w-full">
              <label className="dark:text-dark-300 mb-1 block text-sm font-medium text-gray-600">
                Search (LRN)
              </label>
              <input
                type="text"
                placeholder="Search..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="h-10 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-dark-500 dark:bg-dark-800 dark:text-dark-100"
              />
            </div>

            {/* Search and Back Buttons */}
            <div className="w-full flex items-end gap-3">
              <button
                type="submit"
                className="h-10 rounded bg-green-600 px-6 w-full sm:w-auto text-sm font-medium text-white hover:bg-green-700"
              >
                Search
              </button>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="h-10 rounded bg-blue-500 px-6 w-full sm:w-auto text-sm font-medium text-white hover:bg-blue-600 focus:outline-none dark:bg-blue-600 dark:hover:bg-blue-700 transition-colors"
              >
                Back
              </button>
            </div>
          </form>
        </div>

        {/* Data Table */}
        <div className="mt-6">
          <Card
            className={clsx(
              "relative flex grow flex-col",
              cardSkin === "shadow" && "shadow-lg"
            )}
          >
            <div className="table-wrapper min-w-full grow overflow-x-auto">
              <table className="w-full text-left">
                <thead className="dark:bg-dark-800 dark:text-dark-100">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id} className="border-b border-gray-200">
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider dark:bg-transparent dark:text-gray-400"
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="dark:bg-dark-700 dark:text-dark-100 divide-y divide-gray-200 dark:divide-gray-600">
                  {loading ? (
                    <tr>
                      <td colSpan={13} className="py-10 text-center text-gray-500">
                        <div className="flex items-center justify-center gap-3">
                          <svg className="h-6 w-6 animate-spin text-blue-500" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z" />
                          </svg>
                          Loading parameter data...
                        </div>
                      </td>
                    </tr>
                  ) : chemistsData.length === 0 ? (
                    <tr>
                      <td colSpan={13} className="py-10 text-center text-gray-500">
                        No parameters found for the selected criteria.
                      </td>
                    </tr>
                  ) : (
                    table.getRowModel().rows.map((row) => (
                      <Fragment key={row.id}>
                        <tr className="border-b border-gray-200 dark:border-dark-600">
                          {row.getVisibleCells().map((cell) => (
                            <td
                              key={cell.id}
                              className="px-6 py-4 text-sm text-gray-900 dark:text-dark-100"
                            >
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </td>
                          ))}
                        </tr>
                        {row.getIsExpanded() && (
                          <tr>
                            <td colSpan={row.getVisibleCells().length} className="bg-gray-50/50 p-4 dark:bg-dark-800/50">
                              <div className="flex items-center gap-4 py-2 pl-4">
                                <span className="font-semibold text-gray-700 dark:text-gray-300">Action:</span>
                                <RowActions row={row} />
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </Page>
  );
}