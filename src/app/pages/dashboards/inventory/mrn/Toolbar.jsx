// Import Dependencies
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";
import PropTypes from "prop-types";

// Local Imports
import { Button, Input } from "components/ui";
import { TableConfig } from "./TableConfig";
import { JWT_HOST_API } from "configs/auth.config";

// ----------------------------------------------------------------------

export function Toolbar({ table }) {
  const navigate = useNavigate();
  const isFullScreenEnabled = table.getState().tableSettings.enableFullScreen;

  const handleExport = () => {
    window.open(`${JWT_HOST_API}/inventory/export-mrn`, "_blank");
  };

  return (
    <div className="table-toolbar">
      <div
        className={clsx(
          "transition-content flex items-center justify-between gap-4",
          isFullScreenEnabled ? "px-4 sm:px-5" : "px-[var(--margin-x)] pt-4"
        )}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-4 mb-2">
          <div className="min-w-0">
            <h2 className="text-xl font-semibold tracking-wide text-gray-800 dark:text-dark-50">
              Material Receipt Note (MRN)
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => navigate("add")}
              className="h-9 rounded-md px-4 text-sm font-medium"
              color="success"
            >
              Add New MRN
            </Button>
            <Button
              onClick={() => navigate("add-wo-po")}
              className="h-9 rounded-md px-4 text-sm font-medium"
              color="info"
            >
              Add MRN (Without PO)
            </Button>
            <Button
              onClick={handleExport}
              className="h-9 rounded-md px-4 text-sm font-medium"
              color="primary"
            >
              Export MRN
            </Button>
            <TableConfig table={table} />
          </div>
        </div>
      </div>

      <div
        className={clsx(
          "custom-scrollbar transition-content flex justify-between space-x-4 overflow-x-auto pb-1 pt-2",
          isFullScreenEnabled ? "px-4 sm:px-5" : "px-[var(--margin-x)]"
        )}
      >
        <div className="flex shrink-0 space-x-2">
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
      placeholder="Search MRN..."
    />
  );
}

Toolbar.propTypes = {
  table: PropTypes.object.isRequired,
};

SearchInput.propTypes = {
  table: PropTypes.object.isRequired,
};
