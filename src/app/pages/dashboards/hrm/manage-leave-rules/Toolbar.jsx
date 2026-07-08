// Import Dependencies
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";

// Local Imports
import { Button, Input } from "components/ui";
import { TableConfig } from "./TableConfig";
import { getStoredPermissions } from "app/navigation/dashboards";

// ----------------------------------------------------------------------

export function Toolbar({ table }) {
  const permissions = getStoredPermissions();

  return (
    <div className="table-toolbar px-[var(--margin-x)] pt-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        {/* Title */}
        <div className="min-w-0">
          <h2 className="text-xl font-semibold tracking-wide text-gray-800 dark:text-dark-50">
            View Leave Rules
          </h2>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          {/* S No / Global Search */}
          <SearchInput table={table} />

          {/* Table settings (View button) */}
          <TableConfig table={table} />

          {/* Back button */}
          <Button
            component={Link}
            to="/dashboards/hrm"
            color="secondary"
            variant="outline"
            className="whitespace-nowrap font-bold h-9 text-sm"
          >
            {"<< Back"}
          </Button>

          {/* Add New Leave Rule button */}
          {permissions.includes(237) && (
            <Button
              component={Link}
              to="/dashboards/hrm/manage-leave-rules/add"
              color="primary"
              className="whitespace-nowrap font-bold h-9 text-sm"
            >
              + Add New
            </Button>
          )}
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
        input: "h-9 text-sm ring-primary-500/50 focus:ring-3 w-48 sm:w-64",
        root: "shrink-0",
      }}
      placeholder="Search all columns..."
    />
  );
}

Toolbar.propTypes = {
  table: PropTypes.object.isRequired,
};
