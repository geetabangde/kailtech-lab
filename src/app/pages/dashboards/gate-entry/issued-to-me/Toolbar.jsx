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

import { Button, Input } from "components/ui";
import ReactSelect from "react-select";
import { TableConfig } from "./TableConfig";
import { useBreakpointsContext } from "app/contexts/breakpoint/context";

// ----------------------------------------------------------------------

export function Toolbar({ table }) {
  const { isXs } = useBreakpointsContext();
  const isFullScreenEnabled = table.getState().tableSettings.enableFullScreen;

  return (
    <div className="table-toolbar">
      <div
        className={clsx(
          "transition-content flex items-center justify-between gap-4",
          isFullScreenEnabled ? "px-4 sm:px-5" : "px-[var(--margin-x)] pt-4",
        )}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <h2 className="text-xl font-semibold tracking-wide text-gray-800 dark:text-dark-50">
            My Gate Entries
          </h2>
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
                      "bg-gray-100 text-gray-800 dark:bg-dark-600 dark:text-dark-100",
                    )}
                  >
                    <span>Share</span>
                  </button>
                )}
              </MenuItem>
              <MenuItem>
                {({ focus }) => (
                  <button
                    className={clsx(
                      "flex h-9 w-full items-center px-3 tracking-wide outline-none transition-colors",
                      focus &&
                      "bg-gray-100 text-gray-800 dark:bg-dark-600 dark:text-dark-100",
                    )}
                  >
                    <span>Print</span>
                  </button>
                )}
              </MenuItem>
            </Transition>
          </Menu>
        ) : (
          <div className="flex space-x-2 "></div>
        )}
      </div>

      {!isXs && (
        <div
          className={clsx(
            "custom-scrollbar transition-content flex justify-between space-x-4 overflow-x-auto pb-1 pt-4 ",
            isFullScreenEnabled ? "px-4 sm:px-5" : "px-[var(--margin-x)]",
          )}
        >
          <div className="flex shrink-0 space-x-2 ">
            <SearchInput table={table} />
            <div className="flex items-center space-x-2">
              <span className="text-xs font-medium text-gray-500 dark:text-dark-200">Min:</span>
              <Input
                type="date"
                value={table.getState().filters?.minDate || ""}
                onChange={(e) => table.options.meta.setFilters(prev => ({ ...prev, minDate: e.target.value }))}
                className="h-8 w-32 text-xs"
              />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-medium text-gray-500 dark:text-dark-200">Max:</span>
              <Input
                type="date"
                value={table.getState().filters?.maxDate || ""}
                onChange={(e) => table.options.meta.setFilters(prev => ({ ...prev, maxDate: e.target.value }))}
                className="h-8 w-32 text-xs"
              />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-medium text-gray-500 dark:text-dark-200">Status:</span>
              <div className="w-32">
                <ReactSelect
                  options={[
                    { label: "All", value: "" },
                    { label: "Alloted", value: "1" },
                    { label: "Lrn Done", value: "2" },
                  ]}
                  value={[
                    { label: "All", value: "" },
                    { label: "Alloted", value: "1" },
                    { label: "Lrn Done", value: "2" },
                  ].find((p) => p.value === (table.getState().filters?.status || "")) || { label: "All", value: "" }}
                  onChange={(selected) => table.options.meta.setFilters(prev => ({ ...prev, status: selected ? selected.value : "" }))}
                  menuPortalTarget={document.body}
                  styles={{
                    control: (base) => ({
                      ...base,
                      minHeight: "42px",
                      borderRadius: "0.5rem",
                      borderColor: "#D1D5DB",
                      boxShadow: "none",
                      "&:hover": { borderColor: "#9CA3AF" },
                    }),
                    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                  }}
                />
              </div>
            </div>
          </div>
          <div className="flex shrink-0 space-x-2">
            <TableConfig table={table} />
          </div>
        </div>
      )}

      {isXs && (
        <div className={clsx("flex p-4 gap-2", isFullScreenEnabled ? "px-4" : "px-[var(--margin-x)]")}>
            <SearchInput table={table} />
            <TableConfig table={table} />
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
        input: "h-8 text-xs ring-primary-500/50 focus:ring-3",
        root: "shrink-0",
      }}
      placeholder="Search..."
    />
  );
}
