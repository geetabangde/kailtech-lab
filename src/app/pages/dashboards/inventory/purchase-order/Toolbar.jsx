// Import Dependencies
import {

  MagnifyingGlassIcon,

} from "@heroicons/react/24/outline";
// import { TbUpload } from "react-icons/tb";
import clsx from "clsx";
import {
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  Transition,
} from "@headlessui/react";
import { EllipsisHorizontalIcon } from "@heroicons/react/20/solid";



import { Button, Input } from "components/ui";
import { TableConfig } from "./TableConfig";
import { useBreakpointsContext } from "app/contexts/breakpoint/context";
import { useNavigate } from "react-router";

// import { orderStatusOptions } from "./data";

// PHP: if(!in_array(287, $permissions)) header("location:index.php");
function usePermissions() {
  const p = localStorage.getItem("userPermissions");
  try {
    return JSON.parse(p) || [];
  } catch {
    return p?.split(",").map(Number) || [];
  }
}

// ----------------------------------------------------------------------

export function Toolbar({ table }) {
  const { isXs } = useBreakpointsContext();
  const isFullScreenEnabled = table.getState().tableSettings.enableFullScreen;
  const navigate = useNavigate();
  const permissions = usePermissions();

  return (
    <div className="table-toolbar">
      <div
        className={clsx(
          "transition-content flex items-center justify-between gap-4",
          isFullScreenEnabled ? "px-4 sm:px-5" : "px-[var(--margin-x)] pt-4",
        )}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full">
          {/* Heading */}
          <div className="min-w-0">
            <h2 className="text-xl font-semibold tracking-wide text-gray-800 dark:text-dark-50">
              Manage Purchase Order
            </h2>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => navigate("/dashboards/inventory")}
              className="h-9 rounded-md px-4 text-sm font-medium"
            >
              &lt;&lt; Back
            </Button>

            {/* PHP: if (in_array(290, $permissions)) { ?> <a href="add_purchase_order.php" class="btn btn-info" data-card-widget="">+ Generate New</a> */}
            {permissions.includes(290) && (
              <Button
                onClick={() =>
                  navigate(
                    "/dashboards/inventory/purchase-order/add-purchase-order",
                  )
                }
                className="h-9 rounded-md px-4 text-sm font-medium"
                color="primary"
              >
                + Generate New
              </Button>
            )}

            {isXs && (
              <Menu as="div" className="relative inline-block text-left">
                <MenuButton
                  as={Button}
                  variant="flat"
                  className="size-8 shrink-0 rounded-full p-0"
                >
                  <EllipsisHorizontalIcon className="size-4.5" />
                </MenuButton>
                <Transition
                  as={MenuItems}
                  enter="transition ease-out"
                  enterFrom="opacity-0 translate-y-2"
                  enterTo="opacity-100 translate-y-0"
                  leave="transition ease-in"
                  leaveFrom="opacity-100 translate-y-0"
                  leaveTo="opacity-0 translate-y-2"
                  className="absolute z-100 mt-1.5 min-w-[10rem] whitespace-nowrap rounded-lg border border-gray-300 bg-white py-1 shadow-lg shadow-gray-200/50 outline-none focus-visible:outline-none dark:border-dark-500 dark:bg-dark-700 dark:shadow-none ltr:right-0 rtl:left-0"
                >
                  {permissions.includes(290) && (
                    <MenuItem>
                      {({ focus }) => (
                        <button
                          onClick={() =>
                            navigate(
                              "/dashboards/inventory/purchase-order/add-purchase-order",
                            )
                          }
                          className={clsx(
                            "flex h-9 w-full items-center px-3 tracking-wide outline-none transition-colors",
                            focus &&
                            "bg-gray-100 text-gray-800 dark:bg-dark-600 dark:text-dark-100",
                          )}
                        >
                          <span>+ Generate New</span>
                        </button>
                      )}
                    </MenuItem>
                  )}
                  {/* Additional menu items could be added here */}
                </Transition>
              </Menu>
            )}
          </div>
        </div>
      </div>

      <div
        className={clsx(
          "custom-scrollbar transition-content flex justify-between space-x-4 overflow-x-auto pb-1 pt-4",
          isFullScreenEnabled ? "px-4 sm:px-5" : "px-[var(--margin-x)]",
        )}
      >
        <div className="flex shrink-0 space-x-2">
          <SearchInput table={table} />
          <TableConfig table={table} />
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
        input: "h-8 text-xs ring-primary-500/50 focus:ring-3",
        root: "shrink-0",
      }}
      placeholder="Search ID, P.O Number..."
    />
  );
}

