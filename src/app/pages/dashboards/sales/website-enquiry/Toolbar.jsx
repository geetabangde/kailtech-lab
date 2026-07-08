// Import Dependencies
import clsx from "clsx";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { Button } from "components/ui";

// ----------------------------------------------------------------------

export function Toolbar({ table, globalFilter, setGlobalFilter }) {
  return (
    <div className="px-[var(--margin-x)] pt-4 pb-3">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="dark:text-dark-50 text-xl font-semibold text-gray-800">
          Enquiry List
          <span className="dark:bg-dark-700 dark:text-dark-300 ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-sm font-normal text-gray-500">
            {table.getCoreRowModel().rows.length}
          </span>
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            component={Link}
            to="/dashboards/sales/website-enquiry/add"
            color="info"
            className="h-9 rounded-md px-4 text-sm font-medium"
          >
            + Add Enquiry
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Search..."
          className={clsx(
            "focus:border-primary-500 focus:ring-primary-500 dark:border-dark-500 dark:bg-dark-800 dark:text-dark-100 h-9 w-64 rounded-md border border-gray-300 px-3 text-sm text-gray-700 focus:ring-1 focus:outline-none transition-all shadow-sm focus:shadow-md",
          )}
        />
        <button
          onClick={() => table.options.meta?.refetch?.()}
          className="h-9 rounded-md border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition-colors dark:border-dark-500 dark:bg-dark-600 dark:text-dark-100 dark:hover:bg-dark-500"
        >
          Refresh
        </button>
      </div>
    </div>
  );
}

Toolbar.propTypes = {
  table: PropTypes.object,
  globalFilter: PropTypes.string,
  setGlobalFilter: PropTypes.func,
};
