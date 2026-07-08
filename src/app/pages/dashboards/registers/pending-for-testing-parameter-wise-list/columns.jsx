// Import Dependencies
import { createColumnHelper } from "@tanstack/react-table";
import { MinusCircleIcon, PlusCircleIcon } from "@heroicons/react/24/solid";
import { RowActions } from "./RowActions";
const columnHelper = createColumnHelper();

export const columns = [
  columnHelper.display({
    id: "sno",
    header: "S.No.",
    cell: ({ row }) => {
      return (
        <div className="flex items-center gap-2">
          <button
            onClick={row.getToggleExpandedHandler()}
            className="focus:outline-none"
          >
            {row.getIsExpanded() ? (
              <MinusCircleIcon className="h-5 w-5 text-red-500" />
            ) : (
              <PlusCircleIcon className="h-5 w-5 text-green-500" />
            )}
          </button>
          <span>{row.index + 1}</span>
        </div>
      );
    },
  }),
  columnHelper.accessor("id", {
    id: "id",
    header: "P. No.",
    cell: (info) => info.getValue() ?? "-",
  }),
  columnHelper.accessor("lrn", {
    id: "lrn",
    header: "LRN",
    cell: (info) => info.getValue() ?? "-",
  }),
  columnHelper.accessor("product", {
    id: "product",
    header: "Product",
    cell: (info) => info.getValue() ?? "-",
  }),
  columnHelper.accessor("parameter", {
    id: "parameter",
    header: "Parameter",
    cell: (info) => info.getValue() ?? "-",
  }),
  columnHelper.accessor("description", {
    id: "description",
    header: "Description",
    cell: (info) => info.getValue() ?? "-",
  }),
  columnHelper.accessor("department", {
    id: "department",
    header: "Department",
    cell: (info) => info.getValue() ?? "-",
  }),
  columnHelper.accessor("time", {
    id: "time",
    header: "Time",
    cell: (info) => info.getValue() ?? "-",
  }),
  columnHelper.accessor("chemist", {
    id: "chemist",
    header: "Chemist",
    cell: (info) => {
      const val = info.getValue();
      return val ? <span className="font-medium text-blue-600 dark:text-blue-400">{val}</span> : "-";
    },
  }),

  columnHelper.display({
    id: "action",
    header: "Action",
    cell: ({ row, table }) => <RowActions row={row} table={table} />,
  }),
];
