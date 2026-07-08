// Toolbar.jsx — Testing Invoice List
// PHP port of tinvoices.php header buttons:
//   perm(165) → Add Testing Invoices + Add Advance Invoice Testing
//   perm(292) → Add Foc Testing Invoices

import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useNavigate } from "react-router";
import { Button, Input } from "components/ui";

// ─────────────────────────────────────────────────────────────────────────────

export function Toolbar({ table }) {
  const navigate = useNavigate();
  const isFullScreen = table.getState().tableSettings?.enableFullScreen;
  const permissions = JSON.parse(localStorage.getItem("userPermissions") || "[]");

  return (
    <div className="table-toolbar">
      {/* ── Title row + action buttons ───────────────────────────────── */}
      <div
        className={clsx(
          "transition-content flex flex-wrap items-center justify-between gap-3",
          isFullScreen ? "px-4 sm:px-5" : "px-[var(--margin-x)] pt-4",
        )}
      >
        <h2 className="dark:text-dark-50 text-xl font-semibold tracking-wide text-gray-800">
          Testing Invoice List
        </h2>

        {/* PHP: perm(165) + perm(292) header buttons */}
        <div className="flex flex-wrap gap-2">
          {permissions.includes(165) && (
            <>
              <Button
                color="primary"
                className="h-9 rounded-md px-4 text-sm font-medium"
                onClick={() =>
                  navigate("/dashboards/accounts/testing-invoices/create")
                }
              >
                + Add Testing Invoice
              </Button>
              <Button
                color="primary"
                className="h-9 rounded-md px-4 text-sm font-medium"
                onClick={() =>
                  navigate(
                    "/dashboards/accounts/testing-invoices/create-advance",
                  )
                }
              >
                + Add Advance Invoice
              </Button>
            </>
          )}
          {permissions.includes(292) && (
            <Button
              color="primary"
              className="h-9 rounded-md px-4 text-sm font-medium"
              onClick={() =>
                navigate("/dashboards/accounts/testing-invoices/create-foc")
              }
            >
              + Add FOC Testing Invoice
            </Button>
          )}
        </div>
      </div>

      {/* ── Search + config ──────────────────────────────────────────── */}
      <div
        className={clsx(
          "transition-content flex items-center justify-between gap-3 pt-4",
          isFullScreen ? "px-4 sm:px-5" : "px-[var(--margin-x)]",
        )}
      >
        <SearchInput table={table} />
      </div>
    </div>
  );
}

// ─── Search input ─────────────────────────────────────────────────────────────
function SearchInput({ table }) {
  return (
    <Input
      value={table.getState().globalFilter ?? ""}
      onChange={(e) => table.setGlobalFilter(e.target.value)}
      prefix={<MagnifyingGlassIcon className="size-4" />}
      classNames={{
        input: "ring-primary-500/50 h-8 text-xs focus:ring-3",
        root: "w-64 shrink-0",
      }}
      placeholder="Search invoice, customer, PO..."
    />
  );
}
