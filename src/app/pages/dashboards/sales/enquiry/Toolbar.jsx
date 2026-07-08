// Import Dependencies
import clsx from "clsx";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { Button } from "components/ui";
import Select from "react-select";
import dayjs from "dayjs";
import { DatePicker } from "components/shared/form/Datepicker";

// ----------------------------------------------------------------------

const STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "1", label: "Quotation Submitted" },
  { value: "0", label: "Pending" },
  { value: "91", label: "Regretted" },
];

export function Toolbar({
  table,
  globalFilter,
  setGlobalFilter,
  admins = [],
  selectedAssignee,
  setSelectedAssignee,
  minDate,
  setMinDate,
  maxDate,
  setMaxDate,
  statusFilter,
  setStatusFilter,
  isResponsive,
  setIsResponsive,
}) {
  const permissions = JSON.parse(localStorage.getItem("userPermissions") || "[]");

  return (
    <div className="px-[var(--margin-x)] pt-4 pb-3 border-b border-gray-100 dark:border-dark-700 bg-white dark:bg-dark-800">
      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <h2 className="dark:text-dark-50 text-xl font-bold text-gray-800 tracking-tight">
          Enquiry List
          <span className="dark:bg-dark-700 dark:text-dark-300 ml-3 rounded-full bg-gray-100 px-3 py-0.5 text-sm font-medium text-gray-500 shadow-sm border border-gray-200 dark:border-dark-600">
            {table.getCoreRowModel().rows.length}
          </span>
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          {permissions.includes(91) && (
            <Link to="/dashboards/sales/enquiry/add">
              <Button
                className="h-9 rounded-lg px-5 text-sm font-semibold shadow-sm hover:shadow-md transition-all active:scale-95"
                color="primary"
              >
                + Add Enquiry
              </Button>
            </Link>
          )}
          {/* Refresh Button */}
          <button
            onClick={() => table.options.meta?.refetch?.()}
            className="group h-9 w-9 flex items-center justify-center rounded-lg border border-gray-300 bg-white shadow-sm hover:bg-gray-50 transition-all active:scale-95 dark:border-dark-500 dark:bg-dark-600 dark:text-dark-100 dark:hover:bg-dark-500"
            title="Refresh"
          >
            <svg className="h-4 w-4 text-gray-500 group-hover:rotate-180 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          {/* Responsive Toggle */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-dark-600 bg-gray-50/50 dark:bg-dark-700/50">
            <span className={clsx("text-xs font-semibold whitespace-nowrap", isResponsive ? "text-green-600 dark:text-green-400" : "text-gray-500")}>
              {isResponsive ? "Responsive On" : "Responsive Off"}
            </span>
            <button
              onClick={() => setIsResponsive(!isResponsive)}
              className={clsx(
                "relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                isResponsive ? "bg-green-600" : "bg-gray-200 dark:bg-dark-600"
              )}
            >
              <span className="sr-only">Toggle Responsive</span>
              <span
                className={clsx(
                  "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                  isResponsive ? "translate-x-4" : "translate-x-0"
                )}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Filters Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
        {/* Search Input */}
        <div className="flex flex-col gap-1.5 lg:col-span-1">
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">
            Quick Search:
          </label>
          <div className="relative group">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors pointer-events-none">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Enquiry No, Name..."
              className={clsx(
                "focus:border-primary-500 focus:ring-primary-500/20 dark:border-dark-500 dark:bg-dark-800 dark:text-dark-100 h-9 w-full rounded-lg border border-gray-300 pl-10 pr-3 text-sm text-gray-700 focus:ring-4 focus:outline-none transition-all shadow-sm",
              )}
            />
          </div>
        </div>

        {/* Minimum Date */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">
            Minimum date:
          </label>
          <DatePicker
            options={{
              dateFormat: "Y-m-d",
              altInput: true,
              altFormat: "d-m-Y",
              allowInput: true,
            }}
            value={minDate}
            onChange={([date]) =>
              setMinDate(date ? dayjs(date).format("YYYY-MM-DD") : "")
            }
            placeholder="DD-MM-YYYY"
            className="h-9 w-full rounded-lg border border-gray-300 px-3 text-sm text-gray-700 bg-white placeholder:text-gray-300 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 focus:outline-none dark:border-dark-500 dark:bg-dark-800 dark:text-dark-100 transition-all font-medium"
          />
        </div>

        {/* Maximum Date */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">
            Maximum date:
          </label>
          <DatePicker
            options={{
              dateFormat: "Y-m-d",
              altInput: true,
              altFormat: "d-m-Y",
              allowInput: true,
            }}
            value={maxDate}
            onChange={([date]) =>
              setMaxDate(date ? dayjs(date).format("YYYY-MM-DD") : "")
            }
            placeholder="DD-MM-YYYY"
            className="h-9 w-full rounded-lg border border-gray-300 px-3 text-sm text-gray-700 bg-white placeholder:text-gray-300 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 focus:outline-none dark:border-dark-500 dark:bg-dark-800 dark:text-dark-100 transition-all font-medium"
          />
        </div>

        {/* Assign TO Filter (Permission 346) */}
        {permissions.includes(346) && (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              Assign TO :
            </label>
            <Select
              options={[
                { value: "", label: "Select BD" },
                ...admins.map((admin) => ({
                  value: admin.id,
                  label: `${admin.firstname} ${admin.lastname}`,
                })),
              ]}
              value={
                [
                  { value: "", label: "Select BD" },
                  ...admins.map((admin) => ({
                    value: admin.id,
                    label: `${admin.firstname} ${admin.lastname}`,
                  })),
                ].find((opt) => String(opt.value) === String(selectedAssignee)) ||
                null
              }
              onChange={(opt) => setSelectedAssignee(opt ? opt.value : "")}
              placeholder="Select BD"
              isSearchable
              className="text-sm shadow-sm"
            />
          </div>
        )}

        {/* Status Filter */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">
            Status :
          </label>
          <Select
            options={STATUS_OPTIONS}
            value={STATUS_OPTIONS.find((opt) => opt.value === statusFilter) || null}
            onChange={(opt) => setStatusFilter(opt ? opt.value : "")}
            placeholder="All Status"
            className="text-sm shadow-sm"
          />
        </div>
      </div>
    </div>
  );
}

Toolbar.propTypes = {
  table: PropTypes.object,
  globalFilter: PropTypes.string,
  setGlobalFilter: PropTypes.func,
  admins: PropTypes.array,
  selectedAssignee: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  setSelectedAssignee: PropTypes.func,
  minDate: PropTypes.string,
  setMinDate: PropTypes.func,
  maxDate: PropTypes.string,
  setMaxDate: PropTypes.func,
  statusFilter: PropTypes.string,
  setStatusFilter: PropTypes.func,
};
