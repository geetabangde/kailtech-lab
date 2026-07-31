// Import Dependencies
import { createColumnHelper } from "@tanstack/react-table";

// Local Imports
import { RowActions } from "./RowActions";

const columnHelper = createColumnHelper();

export const columns = [
  columnHelper.display({
    id: "select",
    enableColumnFilter: false,
  }),

  // ID
  columnHelper.accessor("id", {
    id: "id",
    header: "ID",
    cell: (info) => (
      <span className="font-mono text-xs font-bold text-gray-700 dark:text-gray-300">
        {info.getValue() ?? "—"}
      </span>
    ),
    filterFn: "includesString",
  }),

  // Product
  columnHelper.accessor("product", {
    id: "product",
    header: "Product",
    cell: (info) => (
      <span className="block max-w-[220px] whitespace-normal text-sm leading-tight text-gray-800 dark:text-gray-200">
        {info.getValue() ?? "—"}
      </span>
    ),
    filterFn: "includesString",
  }),

  // LRN
  columnHelper.accessor("lrn", {
    id: "lrn",
    header: "LRN",
    cell: (info) => (
      <span className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400">
        {info.getValue() ?? "—"}
      </span>
    ),
    filterFn: "includesString",
  }),

  // Action — View Draft Report button
  columnHelper.display({
    id: "actions",
    header: "Action",
    cell: RowActions,
    enableColumnFilter: false,
  }),
];