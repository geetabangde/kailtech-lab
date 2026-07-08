// Import Dependencies
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import PropTypes from "prop-types";

// Local Imports
import { Input } from "components/ui";

export function Toolbar({ table }) {
  const isFullScreenEnabled = table.getState().tableSettings.enableFullScreen;

  return (
    <div className="table-toolbar">
      <div
        className={clsx(
          "transition-content flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4",
          isFullScreenEnabled ? "px-4 sm:px-5" : "px-[var(--margin-x)] pt-4",
        )}
      >
        {/* Heading */}
        <div className="min-w-0">
          <h2 className="text-xl font-semibold tracking-wide text-gray-800 dark:text-dark-50">
            Manage Labs
          </h2>
        </div>

        {/* Search */}
        <div className="flex shrink-0 space-x-2">
          <SearchInput table={table} />
        </div>
      </div>
    </div>
  );
}

Toolbar.propTypes = {
  table: PropTypes.object.isRequired,
};

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
      placeholder="Search ID, Name..."
    />
  );
}

SearchInput.propTypes = {
  table: PropTypes.object.isRequired,
};
