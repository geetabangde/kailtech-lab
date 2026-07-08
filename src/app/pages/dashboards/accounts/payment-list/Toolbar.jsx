// Import Dependencies
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";

// Local Imports
import { Button, Input } from "components/ui";
import { TableConfig } from "./TableConfig";
import { DatePicker } from "components/shared/form/Datepicker";
import Select from "react-select";

// ----------------------------------------------------------------------

const customSelectStyles = {
  control: (base, state) => ({
    ...base,
    minHeight: "36px",
    height: "36px",
    borderColor: state.isFocused ? "#3b82f6" : "#d1d5db",
    boxShadow: state.isFocused ? "0 0 0 1px rgba(59, 130, 246, 0.5)" : "none",
    "&:hover": {
      borderColor: "#3b82f6",
    },
    borderRadius: "0.375rem",
    fontSize: "0.875rem",
    color: "#374151",
  }),
  valueContainer: (base) => ({
    ...base,
    padding: "0 8px",
    height: "36px",
  }),
  indicatorsContainer: (base) => ({
    ...base,
    height: "36px",
  }),
  menu: (base) => ({
    ...base,
    zIndex: 9999,
  }),
  menuPortal: (base) => ({
    ...base,
    zIndex: 9999,
  }),
};

export function Toolbar({
  table,
  filters,
  setFilters,
  customers,
  bdList,
  onSearch,
}) {
  const isFullScreenEnabled = table.getState().tableSettings.enableFullScreen;
  const userPermissions = JSON.parse(localStorage.getItem("userPermissions") || "[]");

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // Preparation for React Select options
  const customerOptions = [
    { value: "Suspense", label: "Suspense" },
    ...customers.map((c) => ({ value: c.id, label: c.name })),
  ];
  const bdOptions = bdList.map((bd) => ({
    value: bd.id,
    label: `${bd.firstname} ${bd.lastname}`,
  }));

  return (
    <div className="table-toolbar">
      {/* ── Top Row: Title + Button ── */}
      <div
        className={clsx(
          "transition-content flex items-center justify-between gap-4",
          isFullScreenEnabled ? "px-4 sm:px-5" : "px-[var(--margin-x)] pt-4",
        )}
      >
        <div className="min-w-0">
          <h2 className="dark:text-dark-50 text-xl font-semibold tracking-wide text-gray-800">
            Payment List
          </h2>
        </div>
        <div className="flex gap-2">
          {userPermissions.includes(274) && (
            <>
              <Link
                to="/dashboards/accounts/payment-list/create"
                className="inline-flex h-9 items-center justify-center rounded-md bg-blue-600 px-4 text-sm font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                + Payment Received
              </Link>
              <Link
                to="/dashboards/accounts/payment-list/create?advance=Yes"
                className="inline-flex h-9 items-center justify-center rounded-md bg-cyan-600 px-4 text-sm font-medium text-white transition hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              >
                + Advance Payment Received
              </Link>
            </>
          )}
        </div>
      </div>

      {/* ── Filter Row: Start Date | End Date | Customer | BD | Search btn ── */}
      <div
        className={clsx(
          "transition-content mt-4 flex flex-nowrap items-end gap-3 overflow-x-auto",
          isFullScreenEnabled ? "px-4 sm:px-5" : "px-[var(--margin-x)]",
        )}
      >
        {/* Start Date */}
        <div className="flex flex-col gap-1">
          <label className="dark:text-dark-300 text-xs font-medium text-gray-600">
            Start Date
          </label>
          <DatePicker
            options={{
              dateFormat: "Y-m-d",
              altInput: true,
              altFormat: "d/m/Y",
              allowInput: true,
            }}
            value={filters.startdate}
            onChange={(selectedDates, dateStr) =>
              handleFilterChange("startdate", dateStr)
            }
            className="focus:border-primary-500 focus:ring-primary-500 dark:border-dark-500 dark:bg-dark-800 dark:text-dark-100 h-9 rounded-md border border-gray-300 px-3 text-sm text-gray-700 focus:ring-1 focus:outline-none"
          />
        </div>

        {/* End Date */}
        <div className="flex flex-col gap-1">
          <label className="dark:text-dark-300 text-xs font-medium text-gray-600">
            End Date
          </label>
          <DatePicker
            options={{
              dateFormat: "Y-m-d",
              altInput: true,
              altFormat: "d/m/Y",
              allowInput: true,
            }}
            value={filters.enddate}
            onChange={(selectedDates, dateStr) =>
              handleFilterChange("enddate", dateStr)
            }
            className="focus:border-primary-500 focus:ring-primary-500 dark:border-dark-500 dark:bg-dark-800 dark:text-dark-100 h-9 rounded-md border border-gray-300 px-3 text-sm text-gray-700 focus:ring-1 focus:outline-none"
          />
        </div>

        {/* Customer Select */}
        <div className="flex flex-col gap-1">
          <label className="dark:text-dark-300 text-xs font-medium text-gray-600">
            Customer
          </label>
          <Select
            styles={customSelectStyles}
            className="w-[280px]"
            value={customerOptions.find((opt) => String(opt.value) === String(filters.customerid)) || null}
            onChange={(opt) => handleFilterChange("customerid", opt ? opt.value : "")}
            options={customerOptions}
            placeholder="Select Customer"
            isClearable
            menuPortalTarget={document.body}
            menuPosition="fixed"
          />
        </div>

        {/* BD Select */}
        <div className="flex flex-col gap-1">
          <label className="dark:text-dark-300 text-xs font-medium text-gray-600">
            BD
          </label>
          <Select
            styles={customSelectStyles}
            className="w-[220px]"
            value={bdOptions.find((opt) => String(opt.value) === String(filters.bd)) || null}
            onChange={(opt) => handleFilterChange("bd", opt ? opt.value : "")}
            options={bdOptions}
            placeholder="Select BD"
            isClearable
            menuPortalTarget={document.body}
            menuPosition="fixed"
          />
        </div>

        {/* Search Button */}
        <Button
          onClick={onSearch}
          className="h-9 rounded-md px-5 text-sm font-medium"
          color="primary"
          variant="outlined"
        >
          Search
        </Button>
      </div>

      {/* ── Search Input Row ── */}
      <div
        className={clsx(
          "transition-content flex justify-between gap-4 pt-4 pb-1",
          isFullScreenEnabled ? "px-4 sm:px-5" : "px-[var(--margin-x)]",
        )}
      >
        <div className="flex shrink-0 items-center space-x-2">
          <SearchInput table={table} />
        </div>
        <TableConfig table={table} />
      </div>
    </div>
  );
}

function SearchInput({ table }) {
  return (
    <Input
      value={table.getState().globalFilter}
      onChange={(e) => table.setGlobalFilter(e.target.value)}
      prefix={<MagnifyingGlassIcon className="size-4" />}
      classNames={{
        input: "ring-primary-500/50 h-8 text-xs focus:ring-3",
        root: "shrink-0",
      }}
      placeholder="Search receipt, customer..."
    />
  );
}

Toolbar.propTypes = {
  table: PropTypes.object,
  filters: PropTypes.object,
  setFilters: PropTypes.func,
  customers: PropTypes.array,
  bdList: PropTypes.array,
  onSearch: PropTypes.func,
};
