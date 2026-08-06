// Import Dependencies
import { createColumnHelper } from "@tanstack/react-table";

const columnHelper = createColumnHelper();

export const columns = [
  // S.No
  columnHelper.accessor((_row, index) => index + 1, {
    id: "s_no",
    header: "S.No",
    cell: (info) => info.row.index + 1,
  }),

  // Product Name
  columnHelper.accessor("product_name", {
    id: "product_name",
    header: "Product Name",
    cell: (info) => info.getValue() || "-",
  }),

  // New ID no
  columnHelper.accessor("new_id_no", {
    id: "new_id_no",
    header: "New ID no",
    cell: (info) => info.getValue() || "-",
  }),

  // Location
  columnHelper.accessor("location", {
    id: "location",
    header: "Location",
    cell: (info) => info.getValue() || "-",
  }),

  // Current Status
  columnHelper.accessor("current_status", {
    id: "current_status",
    header: "Current Status",
    cell: (info) => info.getValue() || "-",
  }),

  // Total Quantity
  columnHelper.accessor("total_quantity", {
    id: "total_quantity",
    header: "Total Quantity",
    cell: (info) => info.getValue() || "-",
  }),

  // Location Quantity
  columnHelper.accessor("location_quantity", {
    id: "location_quantity",
    header: "Location Quantity",
    cell: (info) => info.getValue() || "-",
  }),

  // Unit
  columnHelper.accessor("unit", {
    id: "unit",
    header: "Unit",
    cell: (info) => info.getValue() || "-",
  }),
];
