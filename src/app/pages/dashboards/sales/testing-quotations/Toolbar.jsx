import clsx from "clsx";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import Select from "react-select";
import { Button } from "components/ui";
import { DatePicker } from "components/shared/form/Datepicker";
import dayjs from "dayjs";

// ----------------------------------------------------------------------

export function Toolbar({
  table,
  globalFilter,
  setGlobalFilter,
  minDate,
  setMinDate,
  maxDate,
  setMaxDate,
  statusFilter,
  setStatusFilter,
}) {
  const permissions = JSON.parse(
    localStorage.getItem("userPermissions") || "[]",
  );

  const STATUS_OPTIONS = [
    { value: "", label: "All Status" },
    { value: "0", label: "Item Not Added" },
    { value: "1", label: "Pending" },
    { value: "2", label: "TRF Punched" },
    { value: "3", label: "Converted Marked" },
    { value: "91", label: "Lost" },
  ];

  return (
    <div className="px-[var(--margin-x)] pt-4 pb-3">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="dark:text-dark-50 text-xl font-semibold text-gray-800">
          Testing Quotations
          <span className="dark:bg-dark-700 dark:text-dark-300 ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-sm font-normal text-gray-500">
            {table.getCoreRowModel().rows.length}
          </span>
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          {permissions.includes(94) && (
            <Button
              component={Link}
              to="/dashboards/sales/testing-quotations/add"
              color="info"
              className="h-9 rounded-md px-4 text-sm font-medium"
            >
              + Add New Quotation
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="relative">
          <input
            type="text"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Search..."
            className={clsx(
              "focus:border-primary-500 focus:ring-primary-500 dark:border-dark-500 dark:bg-dark-800 dark:text-dark-100 h-9 w-full rounded-md border border-gray-300 px-3 text-sm text-gray-700 focus:ring-1 focus:outline-none transition-all shadow-sm focus:shadow-md",
            )}
          />
        </div>

        <div className="w-full">
          <Select
            options={STATUS_OPTIONS}
            value={STATUS_OPTIONS.find((opt) => opt.value === statusFilter)}
            onChange={(opt) => setStatusFilter(opt ? opt.value : "")}
            placeholder="Select Status"
            className="text-sm"
            styles={{
              control: (base) => ({
                ...base,
                minHeight: '36px',
                height: '36px',
                borderRadius: '0.375rem',
                borderColor: '#d1d5db'
              }),
              indicatorsContainer: (base) => ({ ...base, height: '34px' }),
              valueContainer: (base) => ({ ...base, height: '34px', padding: '0 8px' }),
            }}
          />
        </div>

        <div className="w-full">
          <DatePicker
            options={{ dateFormat: "Y-m-d", allowInput: true }}
            value={minDate}
            onChange={([date]) => setMinDate(date ? dayjs(date).format("YYYY-MM-DD") : "")}
            placeholder="Min Date"
            className="w-full h-9 rounded-md border border-gray-300 px-3 text-sm dark:border-dark-500 dark:bg-dark-800 shadow-sm transition-all"
          />
        </div>

        <div className="w-full">
          <DatePicker
            options={{ dateFormat: "Y-m-d", allowInput: true }}
            value={maxDate}
            onChange={([date]) => setMaxDate(date ? dayjs(date).format("YYYY-MM-DD") : "")}
            placeholder="Max Date"
            className="w-full h-9 rounded-md border border-gray-300 px-3 text-sm dark:border-dark-500 dark:bg-dark-800 shadow-sm transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => table.options.meta?.refetch?.()}
            className="h-9 w-full rounded-md border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition-colors dark:border-dark-500 dark:bg-dark-600 dark:text-dark-100 dark:hover:bg-dark-500"
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
}

Toolbar.propTypes = {
  table: PropTypes.object,
  globalFilter: PropTypes.string,
  setGlobalFilter: PropTypes.func,
  minDate: PropTypes.string,
  setMinDate: PropTypes.func,
  maxDate: PropTypes.string,
  setMaxDate: PropTypes.func,
  statusFilter: PropTypes.string,
  setStatusFilter: PropTypes.func,
};
