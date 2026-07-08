import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import { Button, Input } from "components/ui";

export function Toolbar({ table }) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-[var(--margin-x)] pt-4 pb-3">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
          Customer Specific Price List
        </h2>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Input
            value={table.getState().globalFilter ?? ""}
            onChange={(e) => table.setGlobalFilter(e.target.value)}
            placeholder="Search price, customer..."
            prefix={<MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />}
            className="h-10 w-64 rounded-md border-gray-300 pl-10 text-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <Button
          onClick={() => navigate("/dashboards/sales/specific-price-list/add")}
          color="primary"
          className="h-10 px-4 text-sm font-medium shadow-sm transition-all hover:shadow-md"
        >
          + Add New Special Price
        </Button>
      </div>
    </div>
  );
}


