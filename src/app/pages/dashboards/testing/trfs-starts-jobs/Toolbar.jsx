// Import Dependencies
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
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "utils/axios";
import Select from "react-select";

// Local Imports
import { Button, Input } from "components/ui";
import { TableConfig } from "./TableConfig";
import { useBreakpointsContext } from "app/contexts/breakpoint/context";

// ----------------------------------------------------------------------

const customSelectStyles = {
  control: (base, state) => ({
    ...base,
    minHeight: "36px",
    minWidth: "100px",
    borderColor: state.isFocused ? "#3b82f6" : "#d1d5db",
    boxShadow: state.isFocused ? "0 0 0 2px rgba(59, 130, 246, 0.5)" : "none",
    "&:hover": {
      borderColor: "#3b82f6",
    },
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

export function Toolbar({ table }) {
  const { isXs } = useBreakpointsContext();
  const isFullScreenEnabled = table.getState().tableSettings.enableFullScreen;
  const permissions = JSON.parse(localStorage.getItem("userPermissions") || "[]");


  // State for dropdowns
  const [customerTypes, setCustomerTypes] = useState([]);
  const [specificPurposes, setSpecificPurposes] = useState([]);

  // Get filters from table meta
  const filters = table.options.meta?.filters || {};
  const setFilters = table.options.meta?.setFilters;

  // Fetch customer types and specific purposes
  useEffect(() => {
    fetchCustomerTypes();
    fetchSpecificPurposes();
  }, []);

  // Toolbar.js में fetchCustomerTypes function:
  const fetchCustomerTypes = async () => {
    try {
      const response = await axios.get("/people/get-customer-type-list");
      console.log("Customer Types API Response:", response.data);

      if (response.data?.Data && Array.isArray(response.data.Data)) {
        setCustomerTypes(response.data.Data);
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        setCustomerTypes(response.data.data);
      } else {
        console.warn("Unexpected customer types structure:", response.data);
        setCustomerTypes([]);
      }
    } catch (error) {
      console.error("Error fetching customer types:", error);
    }
  };


  const fetchSpecificPurposes = async () => {
    try {
      const response = await axios.get("/people/get-specific-purpose-list");
      if (response.data && Array.isArray(response.data)) {
        setSpecificPurposes(response.data);
      } else if (response.data.data && Array.isArray(response.data.data)) {
        setSpecificPurposes(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching specific purposes:", error);
    }
  };

  const handleFilterChange = (key, value) => {
    if (setFilters) {
      setFilters((prev) => ({
        ...prev,
        [key]: value,
      }));
    }
  };

  return (
    <div className="table-toolbar">
      <div
        className={clsx(
          "transition-content flex items-center justify-between gap-4",
          isFullScreenEnabled ? "px-4 sm:px-5" : "px-[var(--margin-x)] pt-4"
        )}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 w-full">
          {/* Heading */}
          <div className="min-w-0">
            <h2 className="text-xl font-semibold tracking-wide text-gray-800 dark:text-dark-50">
              TRF Entry List
            </h2>
          </div>

          <div>
            {permissions.includes(124) && (
              <Link
                to="/dashboards/testing/trfs-starts-jobs/create"
                className="inline-flex h-9 items-center justify-center rounded-md bg-blue-600 px-4 text-sm font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                + Add TRF
              </Link>
            )}
          </div>
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
              className="absolute z-100 mt-1.5 min-w-[10rem] whitespace-nowrap rounded-lg border border-gray-300 bg-white py-1 shadow-lg shadow-gray-200/50 outline-none focus-visible:outline-none dark:border-dark-500 dark:bg-dark-700 dark:shadow-none ltr:right-0 rtl:left-0"
            >
              <MenuItem>
                {({ focus }) => (
                  <button
                    className={clsx(
                      "flex h-9 w-full items-center px-3 tracking-wide outline-none transition-colors",
                      focus &&
                      "bg-gray-100 text-gray-800 dark:bg-dark-600 dark:text-dark-100"
                    )}
                  >
                    <span>Export as PDF</span>
                  </button>
                )}
              </MenuItem>
              <MenuItem>
                {({ focus }) => (
                  <button
                    className={clsx(
                      "flex h-9 w-full items-center px-3 tracking-wide outline-none transition-colors",
                      focus &&
                      "bg-gray-100 text-gray-800 dark:bg-dark-600 dark:text-dark-100"
                    )}
                  >
                    <span>Export as CSV</span>
                  </button>
                )}
              </MenuItem>
            </Transition>
          </Menu>
        ) : (
          <div className="flex space-x-2"></div>
        )}
      </div>

      {/* Filters Section */}
      <div
        className={clsx(
          "transition-content pt-4 space-y-4",
          isFullScreenEnabled ? "px-4 sm:px-5" : "px-[var(--margin-x)]"
        )}
      >
        {/* First Row - Date Filters and Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Minimum Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Minimum Date
            </label>
            <Input
              type="date"
              value={filters.searchByFromdate || ""}
              onChange={(e) =>
                handleFilterChange("searchByFromdate", e.target.value)
              }
              classNames={{
                input: "h-9 text-sm",
              }}
            />
          </div>

          {/* Maximum Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Maximum Date
            </label>
            <Input
              type="date"
              value={filters.searchByTodate || ""}
              onChange={(e) =>
                handleFilterChange("searchByTodate", e.target.value)
              }
              classNames={{
                input: "h-9 text-sm",
              }}
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              value={filters.searchstatus || ""}
              onChange={(e) =>
                handleFilterChange("searchstatus", e.target.value)
              }
              className="h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 dark:border-dark-500 dark:bg-dark-700 dark:text-gray-100"
            >
              <option value="">All Status</option>
              <option value="1">Pending For Review</option>
              <option value="0">Pending For Submit Review</option>
              <option value="98">Pending For Approvals</option>
            </select>
          </div>

          {/* Clear Filters Button */}
          <div className="flex items-end">
            <Button
              onClick={() =>
                setFilters({
                  searchByFromdate: "",
                  searchByTodate: "",
                  ctype: "",
                  specificpurpose: "",
                  searchstatus: "",
                })
              }
              variant="outlined"
              className="h-9 w-full"
            >
              Clear Filters
            </Button>
          </div>
        </div>

        {/* Second Row - Customer Type and Specific Purpose */}
        {(permissions.includes(389) || permissions.includes(390)) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Customer Type */}
            {permissions.includes(389) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Customer Type
                </label>
                <Select
                  value={customerTypes.find(type => type.id === filters.ctype) ? { value: filters.ctype, label: customerTypes.find(type => type.id === filters.ctype).name } : null}
                  onChange={(selectedOption) => handleFilterChange("ctype", selectedOption ? selectedOption.value : "")}
                  options={customerTypes.map(type => ({ value: type.id, label: type.name }))}
                  placeholder="Select Customer Type"
                  isClearable
                  styles={customSelectStyles}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                />
              </div>
            )}

            {/* Specific Purpose */}
            {permissions.includes(390) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Specific Purpose
                </label>
                <Select
                  value={specificPurposes.find(purpose => purpose.id === filters.specificpurpose) ? { value: filters.specificpurpose, label: specificPurposes.find(purpose => purpose.id === filters.specificpurpose).name } : null}
                  onChange={(selectedOption) => handleFilterChange("specificpurpose", selectedOption ? selectedOption.value : "")}
                  options={specificPurposes.map(purpose => ({ value: purpose.id, label: purpose.name }))}
                  placeholder="Select Specific Purpose"
                  isClearable
                  styles={customSelectStyles}
                  menuPortalTarget={document.body}
                  menuPosition="fixed"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Search Section */}
      {isXs ? (
        <>
          <div
            className={clsx(
              "flex space-x-2 pt-4 [&_.input-root]:flex-1",
              isFullScreenEnabled ? "px-4 sm:px-5" : "px-[var(--margin-x)]"
            )}
          >
            <SearchInput table={table} />
            <TableConfig table={table} />
          </div>
        </>
      ) : (
        <div
          className={clsx(
            "custom-scrollbar transition-content flex justify-between space-x-4 overflow-x-auto pb-1 pt-4",
            isFullScreenEnabled ? "px-4 sm:px-5" : "px-[var(--margin-x)]"
          )}
          style={{
            "--margin-scroll": isFullScreenEnabled
              ? "1.25rem"
              : "var(--margin-x)",
          }}
        >
          <div className="flex shrink-0 space-x-2">
            <SearchInput table={table} />
          </div>
        </div>
      )}
    </div>
  );
}

function SearchInput({ table }) {
  return (
    <Input
      value={table.getState().globalFilter || ""}
      onChange={(e) => table.setGlobalFilter(e.target.value)}
      prefix={<MagnifyingGlassIcon className="size-4" />}
      classNames={{
        input: "h-8 text-xs ring-primary-500/50 focus:ring-3",
        root: "shrink-0",
      }}
      placeholder="Search TRF Entry, Customer, Products..."
    />
  );
}