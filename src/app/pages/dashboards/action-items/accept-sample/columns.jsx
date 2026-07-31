// Import Dependencies
import { createColumnHelper } from "@tanstack/react-table";

// Local Imports
import { RowActions } from "./RowActions";

const columnHelper = createColumnHelper();
export const columns = [
  // Sr. No
  columnHelper.accessor((_row, index) => index + 1, {
    id: "s_no",
    header: "S.NO",
    size: 60,
    cell: (info) => info.row.index + 1,
    enableColumnFilter: false,
  }),

  // LRN
  columnHelper.accessor("lrn", {
    id: "lrn",
    header: "LRN",
    size: 110,
    cell: (info) => (
      <span className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400">
        {info.getValue() ?? "—"}
      </span>
    ),
    filterFn: "includesString",
  }),

  // Date
  columnHelper.accessor("added_on", {
    id: "added_on",
    header: "Date",
    size: 100,
    cell: (info) => info.getValue() ?? "—",
    filterFn: "includesString",
  }),

  // Product
  columnHelper.accessor("product", {
    id: "product",
    header: "Product",
    size: 250,
    cell: (info) => (
      <span className="block w-full whitespace-normal text-xs leading-tight">
        {info.getValue() ?? "—"}
      </span>
    ),
    filterFn: "includesString",
  }),

  // Department — PHP: labs name
  columnHelper.accessor("department", {
    id: "department",
    header: "Department",
    size: 120,
    cell: (info) => info.getValue() ?? "—",
    filterFn: "includesString",
  }),

  // Package
  columnHelper.accessor("package", {
    id: "package",
    header: "Package",
    size: 250,
    cell: (info) => (
      <span className="block w-full whitespace-normal text-xs leading-tight">
        {info.getValue() ?? "—"}
      </span>
    ),
    filterFn: "includesString",
  }),

  // Quantity
  columnHelper.accessor("quantity", {
    id: "quantity",
    header: "Qty",
    size: 60,
    cell: (info) => info.getValue() ?? "—",
    filterFn: "includesString",
  }),

  // Customer Type — shown when perm 389
  columnHelper.accessor("ctype_name", {
    id: "ctype_name",
    header: () => <span className="text-xs">Customer <br />Type</span>,
    size: 140,
    cell: (info) => (
      <span className="block w-full whitespace-normal text-xs leading-tight">
        {info.getValue() ?? "—"}
      </span>
    ),
    filterFn: "includesString",
  }),

  // Specific Purpose — shown when perm 390
  columnHelper.accessor("specificpurpose_name", {
    id: "specificpurpose_name",
    header: () => <span className="text-xs">Specific <br />Purpose</span>,
    size: 140,
    cell: (info) => (
      <span className="block w-full whitespace-normal text-xs leading-tight">
        {info.getValue() ?? "—"}
      </span>
    ),
    filterFn: "includesString",
  }),

  // Action — Accept button
  columnHelper.display({
    id: "actions",
    header: "Action",
    size: 80,
    cell: RowActions,
    enableColumnFilter: false,
  }),
];