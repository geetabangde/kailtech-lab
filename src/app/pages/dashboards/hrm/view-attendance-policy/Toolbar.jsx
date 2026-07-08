// Import Dependencies
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { Link } from "react-router-dom";

import { Button, Input } from "components/ui";
import { getStoredPermissions } from "app/navigation/dashboards";

// ----------------------------------------------------------------------

export function Toolbar({ table }) {
  const permissions = getStoredPermissions();
  const canAdd = permissions.includes(241);

  return (
    <div className="table-toolbar px-[var(--margin-x)] pt-4">
      <div
        className={clsx(
          "transition-content flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4",
        )}
      >
        <div className="min-w-0">
          <h2 className="text-xl font-semibold tracking-wide text-gray-800 dark:text-dark-50">
            Attendance Policy List
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {canAdd && (
            <Link to="/dashboards/hrm/view-attendance-policies/add">
              <Button
                className="h-9 rounded-md px-4 text-sm font-medium"
                color="primary"
              >
                + Add New Policy
              </Button>
            </Link>
          )}
        </div>
      </div>
      <div className="flex shrink-0 space-x-2">
        <SearchInput table={table} />
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
        input: "h-9 text-sm ring-primary-500/50 focus:ring-3 w-64",
        root: "shrink-0",
      }}
      placeholder="Search policies..."
    />
  );
}
