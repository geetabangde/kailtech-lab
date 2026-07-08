// Import Dependencies
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { Button, Input } from "components/ui";
import { TableConfig } from "./TableConfig";
import { exportStockToExcel } from "./ExportStock";
import PropTypes from "prop-types";

// ----------------------------------------------------------------------

export function Toolbar({ table }) {
  const isFullScreenEnabled = table.getState().tableSettings.enableFullScreen;

  const handleExport = () => {
    const data = table.getFilteredRowModel().rows.map(row => row.original);
    exportStockToExcel(data);
  };

  return (
    <div className="table-toolbar">
      <div
        className={clsx(
          "transition-content flex items-center justify-between gap-4",
          isFullScreenEnabled ? "px-4 sm:px-5" : "px-[var(--margin-x)] pt-4"
        )}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-4">
          <div className="min-w-0">
            <h2 className="text-xl font-semibold tracking-wide text-gray-800 dark:text-dark-50">
              Stock
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleExport}
              className="h-9 rounded-md px-4 text-sm font-medium"
              color="primary"
            >
              Export Product Type/ Subcategory
            </Button>
            <TableConfig table={table} />
          </div>
        </div>
      </div>

      <div
        className={clsx(
          "custom-scrollbar transition-content flex justify-end space-x-4 overflow-x-auto pb-1 pt-2",
          isFullScreenEnabled ? "px-4 sm:px-5" : "px-[var(--margin-x)]"
        )}
      >
        <div className="flex shrink-0 items-center space-x-2">
          <span className="text-sm font-medium text-gray-600 dark:text-dark-300">Search:</span>
          <SearchInput table={table} />
        </div>
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
        input: "h-9 text-sm ring-primary-500/50 focus:ring-3",
        root: "w-64",
      }}
      placeholder="Search..."
    />
  );
}

Toolbar.propTypes = {
  table: PropTypes.object.isRequired,
};

SearchInput.propTypes = {
  table: PropTypes.object.isRequired,
};
