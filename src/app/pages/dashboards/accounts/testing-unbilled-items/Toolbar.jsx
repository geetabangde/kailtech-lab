// Toolbar.jsx — Unbilled Testing Items
// TableConfig: copied from the payment-list folder into this folder
// Path: src/app/pages/dashboards/accounts/testing-unbilled-items/TableConfig.jsx

import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import {
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  Transition,
} from "@headlessui/react";
import { EllipsisHorizontalIcon } from "@heroicons/react/20/solid";
import PropTypes from "prop-types";
import { DatePicker } from "components/shared/form/Datepicker";

import { Button, Input } from "components/ui";
import { TableConfig } from "./TableConfig"; // ← copy payment-list/TableConfig.jsx here
import { useBreakpointsContext } from "app/contexts/breakpoint/context";
import Select from "react-select";

// ── Style tokens ──────────────────────────────────────────────────────────
const inputCls =
  "dark:bg-dark-900 dark:border-dark-500 dark:text-dark-100 dark:placeholder-dark-400 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";
const labelCls =
  "dark:text-dark-300 mb-1 block text-xs font-medium text-gray-600";

const customSelectStyles = {
  control: (base, state) => ({
    ...base,
    minHeight: "38px",
    borderColor: state.isFocused ? "#3b82f6" : "#d1d5db",
    boxShadow: state.isFocused ? "0 0 0 1px rgba(59, 130, 246, 0.5)" : "none",
    "&:hover": {
      borderColor: "#3b82f6",
    },
    borderRadius: "0.375rem",
    fontSize: "0.875rem",
    color: "#374151",
    backgroundColor: "white",
  }),
  valueContainer: (base) => ({
    ...base,
    padding: "0 8px",
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

// ----------------------------------------------------------------------

export function Toolbar({
  table,
  filters,
  setFilters,
  customers,
  bdList,
  onSearch,
}) {
  const { isXs } = useBreakpointsContext();
  const isFullScreenEnabled = table.getState().tableSettings?.enableFullScreen;
  const setFilter = (key, val) =>
    setFilters((prev) => ({ ...prev, [key]: val }));

  // Preparation for React Select options
  const customerOptions = customers.map((c) => ({
    value: c.id,
    label: `${c.name}${c.pnumber ? ` (${c.pnumber})` : ""}`,
  }));
  const bdOptions = bdList.map((b) => ({
    value: b.id,
    label: `${b.firstname} ${b.lastname}`,
  }));

  return (
    <div className="table-toolbar">
      {/* ── Row 1: Heading + mobile menu ── */}
      <div
        className={clsx(
          "transition-content flex items-center justify-between gap-4",
          isFullScreenEnabled ? "px-4 sm:px-5" : "px-[var(--margin-x)] pt-4",
        )}
      >
        <div className="min-w-0">
          <h2 className="dark:text-dark-50 text-xl font-semibold tracking-wide text-gray-800">
            Unbilled Testing Items
          </h2>
          <p className="dark:text-dark-400 mt-0.5 text-sm text-gray-500">
            View all unbilled BRN/LRN entries within a date range
          </p>
        </div>

        {isXs ? (
          <Menu as="div" className="relative inline-block text-left">
            <MenuButton
              as={Button}
              variant="flat"
              className="size-8 shrink-0 rounded-full p-0"
            >
              <EllipsisHorizontalIcon className="size-4.5" />
            </MenuButton>
            <Transition
              as={MenuItems}
              enter="transition ease-out"
              enterFrom="opacity-0 translate-y-2"
              enterTo="opacity-100 translate-y-0"
              leave="transition ease-in"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-2"
              className="dark:border-dark-500 dark:bg-dark-700 absolute z-100 mt-1.5 min-w-[10rem] rounded-lg border border-gray-300 bg-white py-1 whitespace-nowrap shadow-lg shadow-gray-200/50 outline-none focus-visible:outline-none ltr:right-0 rtl:left-0 dark:shadow-none"
            >
              <MenuItem>
                {({ focus }) => (
                  <button
                    onClick={onSearch}
                    className={clsx(
                      "flex h-9 w-full items-center px-3 tracking-wide outline-none transition-colors",
                      focus &&
                        "dark:bg-dark-600 dark:text-dark-100 bg-gray-100 text-gray-800",
                    )}
                  >
                    <span>Search</span>
                  </button>
                )}
              </MenuItem>
            </Transition>
          </Menu>
        ) : (
          <div className="flex space-x-2" />
        )}
      </div>

      {/* ── Row 2: Filters ── */}
      {isXs ? (
        <>
          <div
            className={clsx(
              "flex flex-col gap-3 pt-4",
              isFullScreenEnabled ? "px-4 sm:px-5" : "px-[var(--margin-x)]",
            )}
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Start Date</label>
                <DatePicker
                  options={{
                    dateFormat: "Y-m-d",
                    altInput: true,
                    altFormat: "d/m/Y",
                    allowInput: true,
                  }}
                  value={filters.startdate}
                  onChange={(dates, dateStr) => setFilter("startdate", dateStr)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>End Date</label>
                <DatePicker
                  options={{
                    dateFormat: "Y-m-d",
                    altInput: true,
                    altFormat: "d/m/Y",
                    allowInput: true,
                  }}
                  value={filters.enddate}
                  onChange={(dates, dateStr) => setFilter("enddate", dateStr)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Customer</label>
                <Select
                  styles={customSelectStyles}
                  value={customerOptions.find(opt => String(opt.value) === String(filters.customerid)) || null}
                  onChange={(opt) => setFilter("customerid", opt ? opt.value : "")}
                  options={customerOptions}
                  placeholder="All Customers"
                  isClearable
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                />
              </div>
              <div>
                <label className={labelCls}>Concerned BD</label>
                <Select
                  styles={customSelectStyles}
                  value={bdOptions.find(opt => String(opt.value) === String(filters.bd)) || null}
                  onChange={(opt) => setFilter("bd", opt ? opt.value : "")}
                  options={bdOptions}
                  placeholder="All BD"
                  isClearable
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 [&_.input-root]:flex-1">
              <SearchInput table={table} />
              <TableConfig table={table} />
              <button
                onClick={onSearch}
                className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                <MagnifyingGlassIcon className="h-4 w-4" />
                Search
              </button>
            </div>
          </div>
        </>
      ) : (
        <div
          className={clsx(
            "custom-scrollbar transition-content flex flex-col gap-3 overflow-x-auto pt-4 pb-1",
            isFullScreenEnabled ? "px-4 sm:px-5" : "px-[var(--margin-x)]",
          )}
          style={{
            "--margin-scroll": isFullScreenEnabled
              ? "1.25rem"
              : "var(--margin-x)",
          }}
        >
          {/* Filter inputs */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div>
              <label className={labelCls}>Start Date</label>
              <DatePicker
                options={{
                  dateFormat: "Y-m-d",
                  altInput: true,
                  altFormat: "d/m/Y",
                  allowInput: true,
                }}
                value={filters.startdate}
                onChange={(dates, dateStr) => setFilter("startdate", dateStr)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>End Date</label>
              <DatePicker
                options={{
                  dateFormat: "Y-m-d",
                  altInput: true,
                  altFormat: "d/m/Y",
                  allowInput: true,
                }}
                value={filters.enddate}
                onChange={(dates, dateStr) => setFilter("enddate", dateStr)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Customer</label>
              <Select
                styles={customSelectStyles}
                value={customerOptions.find(opt => String(opt.value) === String(filters.customerid)) || null}
                onChange={(opt) => setFilter("customerid", opt ? opt.value : "")}
                options={customerOptions}
                placeholder="All Customers"
                isClearable
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            </div>
            <div>
              <label className={labelCls}>Concerned BD</label>
              <Select
                styles={customSelectStyles}
                value={bdOptions.find(opt => String(opt.value) === String(filters.bd)) || null}
                onChange={(opt) => setFilter("bd", opt ? opt.value : "")}
                options={bdOptions}
                placeholder="All BD"
                isClearable
                menuPortalTarget={document.body}
                menuPosition="fixed"
              />
            </div>
          </div>

          {/* SearchInput + TableConfig + Search button */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex shrink-0 items-center gap-2">
              <SearchInput table={table} />
              <TableConfig table={table} />
            </div>
            <button
              onClick={onSearch}
              className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 active:bg-blue-800"
            >
              <MagnifyingGlassIcon className="h-4 w-4" />
              Search
            </button>
          </div>
        </div>
      )}
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
      placeholder="Search BRN, LRN, Customer..."
    />
  );
}

Toolbar.propTypes = {
  table: PropTypes.object.isRequired,
  filters: PropTypes.object.isRequired,
  setFilters: PropTypes.func.isRequired,
  customers: PropTypes.array.isRequired,
  bdList: PropTypes.array.isRequired,
  onSearch: PropTypes.func.isRequired,
};
