// Import Dependencies
import { IdentificationIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";

import { Button, Input, ReactSelect as Select } from "components/ui";

// ----------------------------------------------------------------------

export function Toolbar({ table, status, setStatus }) {
  return (
    <div className="table-toolbar px-[var(--margin-x)] pt-4 pb-2">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold tracking-wide text-gray-800 dark:text-dark-50">
            Approve Employees
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <div className="w-48">
            <Select
              name="status"
              options={[
                { value: "1", label: "Active" },
                { value: "0", label: "Unverified" },
                { value: "10", label: "In Training" },
                { value: "99", label: "Suspended" },
              ]}
              value={status}
              onChange={(val) => setStatus(val)}
              className="h-9"
            />
          </div>

          <Link to="/dashboards/hrm/print-id-cards">
            <Button
              className="h-9 rounded-md px-4 text-sm font-medium flex items-center gap-2"
              variant="outline"
              color="secondary"
            >
              <IdentificationIcon className="size-4" />
              Print Id Card
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex shrink-0 space-x-2">
        <Input
          value={table.getState().globalFilter}
          onChange={(e) => table.setGlobalFilter(e.target.value)}
          prefix={<MagnifyingGlassIcon className="size-4" />}
          classNames={{
            input: "h-9 text-sm ring-primary-500/50 focus:ring-3 w-64",
            root: "shrink-0",
          }}
          placeholder="Search employees..."
        />
      </div>
    </div>
  );
}
