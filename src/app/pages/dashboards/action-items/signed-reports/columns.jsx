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

  // Product
  columnHelper.accessor("pname", {
    id: "pname",
    header: "Product",
    enableSorting: true,
    size: 200,
    maxSize: 250,
    cell: (info) => (
      <span
        className="text-xs text-gray-700 dark:text-dark-200 block"
        style={{ maxWidth: "250px", whiteSpace: "normal", wordBreak: "break-word" }}
      >
        {info.getValue() ?? "—"}
      </span>
    ),
    filterFn: "includesString",
  }),

  // Main Customer — PHP: customername
  columnHelper.accessor("customername", {
    id: "customername",
    header: () => <div className="text-center leading-tight">Main <br /> Customer</div>,
    enableSorting: true,
    cell: (info) => (
      <span
        className="text-xs text-gray-700 dark:text-dark-200 block"
        style={{ maxWidth: "200px", whiteSpace: "normal", wordBreak: "break-word" }}
      >
        {info.getValue() ?? "—"}
      </span>
    ),
    filterFn: "includesString",
  }),

  // Report Customer — API: reportNames
  columnHelper.accessor("reportNames", {
    id: "reportNames",
    header: () => <div className="text-center leading-tight">Report <br /> Customer</div>,
    enableSorting: true,
    cell: (info) => {
      const val = info.getValue();
      const stringVal = Array.isArray(val) ? val.join(", ") : (val ?? "—");
      return (
        <span
          className="text-xs text-gray-700 dark:text-dark-200 block"
          style={{ maxWidth: "200px", whiteSpace: "normal", wordBreak: "break-word" }}
        >
          {stringVal}
        </span>
      );
    },
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

  // Grade/Size — Combined API: grade + size
  columnHelper.accessor((row) => {
    const grade = row.grade || "";
    const size = row.size || "";
    if (grade && size) return `${grade} / ${size}`;
    return grade || size || "—";
  }, {
    id: "grade_size",
    header: "Grade/Size",
    enableSorting: true,
    cell: (info) => (
      <span className="text-xs text-gray-700 dark:text-dark-200">
        {info.getValue()}
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