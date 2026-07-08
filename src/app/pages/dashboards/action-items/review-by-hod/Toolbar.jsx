// Toolbar.jsx — HOD Review
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { Input } from "components/ui";
import { TableConfig } from "./TableConfig";
import { useBreakpointsContext } from "app/contexts/breakpoint/context";

export function Toolbar({ table }) {
  const { isXs } = useBreakpointsContext();
  const isFullScreen = table.getState().tableSettings.enableFullScreen;

  const { rows }     = table.getFilteredRowModel();
  const total        = table.getCoreRowModel().rows.length;
  const { pageIndex, pageSize } = table.getState().pagination;
  const from = total === 0 ? 0 : pageIndex * pageSize + 1;
  const to   = Math.min((pageIndex + 1) * pageSize, rows.length);

  return (
    <div className="table-toolbar">
      <div
        className={clsx(
          "transition-content flex items-center justify-between gap-4",
          isFullScreen ? "px-4 sm:px-5" : "px-[var(--margin-x)] pt-4",
        )}
      >
        <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">
          HOD Review
        </h2>

        <div className="flex items-center gap-2">
          <SearchInput table={table} />
          <TableConfig table={table} />
        </div>
      </div>

      {isXs && (
        <div
          className={clsx(
            "flex space-x-2 pt-4 [&_.input-root]:flex-1",
            isFullScreen ? "px-4 sm:px-5" : "px-[var(--margin-x)]",
          )}
        >
          <SearchInput table={table} />
          <TableConfig table={table} />
        </div>
      )}

      <div
        className={clsx(
          "transition-content pt-2 pb-1",
          isFullScreen ? "px-4 sm:px-5" : "px-[var(--margin-x)]",
        )}
      >
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Showing {from} to {to} of {total} entries
        </p>
      </div>
    </div>
  );
}

function SearchInput({ table }) {
  return (
    <Input
      value={table.getState().globalFilter ?? ""}
      onChange={(e) => table.setGlobalFilter(e.target.value)}
      prefix={<MagnifyingGlassIcon className="size-4" />}
      classNames={{
        input: "h-8 text-xs ring-primary-500/50 focus:ring-3",
        root:  "shrink-0",
      }}
      placeholder="Search..."
    />
  );
}
