// Import Dependencies
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";

// Local Imports
import { Input } from "components/ui";
import { TableConfig } from "./TableConfig";

// ----------------------------------------------------------------------

export function Toolbar({ table }) {
  const isFullScreenEnabled = table.getState().tableSettings.enableFullScreen;

  return (
    <div className="table-toolbar">
      {/* ── Header row: title ── */}
      <div
        className={clsx(
          "transition-content flex items-center justify-between gap-4",
          isFullScreenEnabled ? "px-4 sm:px-5" : "px-[var(--margin-x)] pt-4",
        )}
      >
        <div className="min-w-0">
          <h2 className="text-xl font-semibold tracking-wide text-gray-800 dark:text-dark-50">
            Stock Report
          </h2>
        </div>
      </div>

      {/* ── Search + TableConfig row ── */}
      <div
        className={clsx(
          "custom-scrollbar transition-content flex justify-between space-x-4 overflow-x-auto pb-1 pt-4",
          isFullScreenEnabled ? "px-4 sm:px-5" : "px-[var(--margin-x)]",
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
        input: "h-8 text-xs ring-primary-500/50 focus:ring-3",
        root: "shrink-0",
      }}
      placeholder="Search product, batch, location..."
    />
  );
}
