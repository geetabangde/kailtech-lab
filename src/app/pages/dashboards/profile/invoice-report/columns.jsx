// Import Dependencies
import { createColumnHelper } from "@tanstack/react-table";

// Local Imports
import { RowActions } from "./RowActions";

const columnHelper = createColumnHelper();

// PHP columns: Sr No | Product Name | ID no | Type | Location | Batch no. | Expiry | Quantity | Edit* | Category | Critical
export const columns = [
  // ✅ Serial Number
  columnHelper.accessor((_row, index) => index + 1, {
    id: "s_no",
    header: () => <div className="text-center">SR NO</div>,
    cell: (info) => <div className="text-center">{info.row.index + 1}</div>,
    meta: { align: "center" },
  }),

  // ✅ Product Name
  columnHelper.accessor("product_name", {
    id: "product_name",
    header: "PRODUCT NAME",
    cell: (info) => info.getValue() ?? "—",
  }),

  // ✅ ID No
  columnHelper.accessor("id_no", {
    id: "id_no",
    header: "ID NO",
    cell: (info) => info.getValue() ?? "—",
  }),

  // ✅ Type
  columnHelper.accessor("type", {
    id: "type",
    header: "TYPE",
    cell: (info) => info.getValue() ?? "—",
  }),

  // ✅ Location
  columnHelper.accessor("location", {
    id: "location",
    header: "LOCATION",
    cell: (info) => info.getValue() ?? "—",
  }),

  // ✅ Batch No.
  columnHelper.accessor("batch_no", {
    id: "batch_no",
    header: "BATCH NO.",
    cell: (info) => info.getValue() ?? "—",
  }),

  // ✅ Expiry
  columnHelper.accessor("expiry", {
    id: "expiry",
    header: "EXPIRY",
    cell: (info) => info.getValue() ?? "—",
  }),

  // ✅ Quantity
  columnHelper.accessor("quantity", {
    id: "quantity",
    header: "QUANTITY",
    cell: (info) => info.getValue() ?? "—",
  }),

  // ✅ Edit — conditionally rendered via columnVisibility (permission 348)
  columnHelper.display({
    id: "edit",
    header: () => <div className="text-center w-full">EDIT</div>,
    cell: RowActions,
    meta: { align: "center" },
  }),

  // ✅ Category
  columnHelper.accessor("category", {
    id: "category",
    header: "CATEGORY",
    cell: (info) => info.getValue() ?? "—",
  }),

  // ✅ Critical
  columnHelper.accessor("critical", {
    id: "critical",
    header: "CRITICAL",
    cell: (info) => {
      const val = info.getValue();
      if (val === null || val === undefined) return "—";
      return val ? (
        <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
          Yes
        </span>
      ) : (
        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
          No
        </span>
      );
    },
  }),
];
