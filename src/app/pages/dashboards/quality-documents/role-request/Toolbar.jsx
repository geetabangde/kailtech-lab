// Import Dependencies
import { MagnifyingGlassIcon, PlusIcon } from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";
import { Button, Input } from "components/ui";
import { TableConfig } from "./TableConfig";
import { useMemo } from "react";

// ----------------------------------------------------------------------

export function Toolbar({ table }) {
  const permissions = useMemo(() => {
    const raw = localStorage.getItem("userPermissions") || "[]";
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.map(Number) : [];
    } catch {
      return raw.trim().replace(/^\[/, "").replace(/\]$/, "").split(",").map(Number).filter((n) => !isNaN(n));
    }
  }, []);

  const canAdd = permissions.includes(470);

  return (
    <div className="table-toolbar px-[var(--margin-x)] pt-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        {/* Heading */}
        <div className="min-w-0">
          <h2 className="text-xl font-semibold tracking-wide text-gray-800 dark:text-dark-50">
            List of Role Request
          </h2>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-3">
          {canAdd && (
            <Button
              as={Link}
              to="add"
              variant="flat"
              color="primary"
              className="h-9 px-4 gap-2"
            >
              <PlusIcon className="size-4" />
              <span className="hidden sm:inline">Add Role Request Form</span>
            </Button>
          )}
          <TableConfig table={table} />
        </div>
      </div>

      <div className="flex items-center space-x-4 pb-4">
        <Input
          value={table.getState().globalFilter ?? ""}
          onChange={(e) => table.setGlobalFilter(String(e.target.value))}
          prefix={<MagnifyingGlassIcon className="size-4" />}
          classNames={{
            input: "h-9 text-sm ring-primary-500/50 focus:ring-3",
            root: "max-w-xs shrink-0",
          }}
          placeholder="Search requests..."
        />
      </div>
    </div>
  );
}
