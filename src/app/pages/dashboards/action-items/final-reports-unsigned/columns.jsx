// Import Dependencies
import { createColumnHelper } from "@tanstack/react-table";

// Local Imports
import { RowActions } from "./RowActions";


// ----------------------------------------------------------------------

const columnHelper = createColumnHelper();

export const columns = [


  // ID
  columnHelper.accessor("id", {
    id: "id",
    header: "ID",
    enableSorting: true,
    cell: (info) => (
      <span className="text-xs text-gray-700 dark:text-dark-200">
        {info.getValue() ?? "—"}
      </span>
    ),
    filterFn: "includesString",
  }),

  // Product — API: pname
  columnHelper.accessor("pname", {
    id: "product",
    header: "Product",
    enableSorting: true,
    cell: (info) => (
      <span className="block max-w-[280px] whitespace-normal text-xs leading-tight text-gray-700 dark:text-dark-200">
        {info.getValue() ?? "—"}
      </span>
    ),
    filterFn: "includesString",
  }),

  // Customer — API: customername
  columnHelper.accessor("customername", {
    id: "customer",
    header: "Customer",
    enableSorting: true,
    cell: (info) => (
      <span className="block max-w-[220px] whitespace-normal text-xs leading-tight text-gray-700 dark:text-dark-200">
        {info.getValue() ?? "—"}
      </span>
    ),
    filterFn: "includesString",
  }),

  // LRN
  columnHelper.accessor("lrn", {
    id: "lrn",
    header: "LRN",
    enableSorting: true,
    cell: (info) => (
      <span className="text-xs text-gray-700 dark:text-dark-200">
        {info.getValue() ?? "—"}
      </span>
    ),
    filterFn: "includesString",
  }),

  // BRN
  columnHelper.accessor("brn", {
    id: "brn",
    header: "BRN",
    enableSorting: true,
    cell: (info) => (
      <span className="text-xs text-gray-700 dark:text-dark-200">
        {info.getValue() ?? "—"}
      </span>
    ),
    filterFn: "includesString",
  }),

  // ULR
  columnHelper.accessor("ulr", {
    id: "ulr",
    header: "ULR",
    enableSorting: true,
    cell: (info) => (
      <span className="text-xs text-gray-700 dark:text-dark-200">
        {info.getValue() ?? "—"}
      </span>
    ),
    filterFn: "includesString",
  }),

  // Grade/Size — API: gradeSize
  columnHelper.accessor("gradeSize", {
    id: "grade_size",
    header: "Grade/Size",
    enableSorting: true,
    cell: (info) => (
      <span className="block max-w-[200px] whitespace-normal text-xs text-gray-700 dark:text-dark-200">
        {info.getValue() ?? "—"}
      </span>
    ),
    filterFn: "includesString",
  }),

  // Action
  columnHelper.display({
    id: "actions",
    header: "Action",
    enableSorting: false,
    cell: RowActions,
    enableColumnFilter: false,
  }),
];