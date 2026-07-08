import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useNavigate } from "react-router";
import { Input, Button } from "components/ui";

export function Toolbar({ table }) {
  const navigate = useNavigate();
  const isFullScreenEnabled = table.getState().tableSettings.enableFullScreen;
  const permissions = JSON.parse(localStorage.getItem("userPermissions") || "[]");
  const totalRows = table.getCoreRowModel().rows.length;
  const { pageIndex, pageSize } = table.getState().pagination ?? { pageIndex: 0, pageSize: 25 };
  const from = totalRows === 0 ? 0 : pageIndex * pageSize + 1;
  const to = Math.min((pageIndex + 1) * pageSize, totalRows);

  return (
    <div
      className={clsx(
        "transition-content",
        isFullScreenEnabled ? "px-4 sm:px-5" : "px-[var(--margin-x)] pt-4",
      )}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold tracking-wide text-gray-800 dark:text-dark-50">
          Invoice List
        </h2>
        {permissions.includes(298) && (
          <Button
            color="primary"
            className="h-9 rounded-md px-4 text-sm font-medium"
            onClick={() => navigate("/dashboards/accounts/past-invoices/add-opening-balance")}
          >
            + Add Opening Balance
          </Button>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between">
        <p className="text-sm text-gray-600 dark:text-dark-300">
          {totalRows === 0
            ? "No entries"
            : `Showing ${from} to ${to} of ${totalRows} entries`}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-dark-300">Search:</span>
          <Input
            value={table.getState().globalFilter ?? ""}
            onChange={(e) => table.setGlobalFilter(e.target.value)}
            prefix={<MagnifyingGlassIcon className="size-4" />}
            classNames={{
              input: "h-8 text-xs ring-primary-500/50 focus:ring-3",
              root: "w-48",
            }}
          />
        </div>
      </div>
    </div>
  );
}
