// Import Dependencies
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { Link } from "react-router-dom";
import { Input } from "components/ui";
import { TableConfig } from "./TableConfig";

// ----------------------------------------------------------------------

export function Toolbar({ table }) {
  const isFullScreenEnabled = table.getState().tableSettings.enableFullScreen;
  const permissions = JSON.parse(localStorage.getItem("userPermissions") || "[]");

  return (
    <div className="table-toolbar">
      <div
        className={clsx(
          "transition-content flex items-center justify-between gap-4",
          isFullScreenEnabled ? "px-4 sm:px-5" : "px-[var(--margin-x)] pt-4",
        )}
      >
        <h2 className="text-xl font-semibold tracking-wide text-gray-800 dark:text-dark-50">
          Credit Note List
        </h2>
        {permissions.includes(335) && (
          <Link
            to="/dashboards/accounts/credit-note/add"
            className="inline-flex h-9 items-center justify-center rounded-md bg-blue-600 px-4 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            + New Credit Note
          </Link>
        )}
      </div>

      <div
        className={clsx(
          "transition-content flex items-center gap-2 pt-4",
          isFullScreenEnabled ? "px-4 sm:px-5" : "px-[var(--margin-x)]",
        )}
      >
        <SearchInput table={table} />
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
      placeholder="Search ID, Customer..."
    />
  );
}
