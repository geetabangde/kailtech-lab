// Import Dependencies
import { createColumnHelper } from "@tanstack/react-table";

// Local Imports
import { RowActions } from "./RowActions";

const columnHelper = createColumnHelper();

export const columns = [
  // ✅ Serial Number
  columnHelper.accessor((_row, index) => index + 1, {
    id: "s_no",
    header: () => <div className="text-center">S NO</div>,
    cell: (info) => (
      <span className="text-sm text-gray-700 dark:text-dark-200">
        {info.row.index + 1}
      </span>
    ),
    meta: { align: "center" },
    enableColumnFilter: false,
  }),

  // ✅ Name (from API)
  columnHelper.accessor("name", {
    id: "name",
    header: "NAME",
    cell: (info) => (
      <span className="block max-w-[200px] whitespace-normal text-sm text-gray-700 dark:text-dark-200">
        {info.getValue() ?? "—"}
      </span>
    ),
    filterFn: "includesString",
  }),

  // ✅ Description (from API)
  columnHelper.accessor("description", {
    id: "description",
    header: "DESCRIPTION",
    cell: (info) => (
      <span className="block max-w-[600px] whitespace-normal text-sm text-gray-700 dark:text-dark-200">
        {info.getValue() ?? "—"}
      </span>
    ),
    filterFn: "includesString",
  }),

  // ✅ Actions
  columnHelper.display({
    id: "actions",
    header: () => <div className="text-center w-full">ACTIONS</div>,
    cell: RowActions,
    meta: { align: "center" },
    enableColumnFilter: false,
  }),
];