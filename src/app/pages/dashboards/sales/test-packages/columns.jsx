// Import Dependencies
import { createColumnHelper } from "@tanstack/react-table";

// Local Imports
import { RowActions } from "./RowActions";

// ----------------------------------------------------------------------

const columnHelper = createColumnHelper();

const TYPE_MAP = { 0: "Upload Report", 1: "Perform All Tests" };

export const columns = [
  columnHelper.accessor("id", {
    header: "ID",
    cell: (info) => (
      <span className="text-sm text-gray-500 dark:text-dark-400">
        {info.getValue()}
      </span>
    ),
  }),

  columnHelper.accessor("package", {
    header: "Package Name",
    cell: (info) => (
      <span className="block max-w-[250px] whitespace-normal leading-relaxed text-sm font-medium text-gray-800 dark:text-dark-100">
        {info.getValue()}
      </span>
    ),
  }),

  columnHelper.accessor("pname", {
    header: "Product",
    cell: (info) => (
      <span className="block max-w-[250px] whitespace-normal leading-relaxed dark:text-dark-300 text-sm text-gray-600">
        {info.getValue()}
      </span>
    ),
  }),

  columnHelper.accessor("rate", {
    header: "Rate",
    cell: (info) => (
      <span className="text-sm font-semibold text-gray-800 dark:text-dark-100">
        ₹{parseFloat(info.getValue() || 0).toLocaleString("en-IN")}
      </span>
    ),
  }),

  columnHelper.accessor((row) => TYPE_MAP[row.type] ?? "—", {
    id: "type",
    header: "Type",
    cell: (info) => {
      const originalVal = info.row.original.type;
      return (
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${originalVal === 1
              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
            }`}
        >
          {info.getValue()}
        </span>
      );
    },
  }),

  columnHelper.display({
    id: "actions",
    header: "Actions",
    cell: (props) => <RowActions row={props.row} table={props.table} />,
  }),
];
