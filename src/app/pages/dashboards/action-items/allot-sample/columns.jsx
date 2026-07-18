// Import Dependencies
import { createColumnHelper } from "@tanstack/react-table";

// Local Imports
import { RowActions } from "./RowActions";


const columnHelper = createColumnHelper();

export const columns = [


  // ID
  columnHelper.accessor("id", {
    id: "id",
    header: "ID",
    cell: (info) => info.getValue() ?? "—",
  }),

  // Customer
  columnHelper.accessor("customer", {
    id: "customer",
    header: "Customer",
    cell: (info) => (
      <span className="block text-sm leading-tight">
        {info.getValue() ?? "—"}
      </span>
    ),
  }),

  // Product
  columnHelper.accessor("product", {
    id: "product",
    header: "Product",
    cell: (info) => (
      <span className="block text-sm leading-tight">
        {info.getValue() ?? "—"}
      </span>
    ),
  }),

  // Package
  columnHelper.accessor("package", {
    id: "package",
    header: "Package",
    cell: (info) => (
      <span className="block text-sm leading-tight">
        {info.getValue() ?? "—"}
      </span>
    ),
  }),

  // LRN
  columnHelper.accessor("lrn", {
    id: "lrn",
    header: "LRN",
    cell: (info) => info.getValue() ?? "—",
  }),

  // BRN
  columnHelper.accessor("brn", {
    id: "brn",
    header: "BRN",
    cell: (info) => info.getValue() ?? "—",
  }),

  // Grade / Size
  columnHelper.accessor(
    (row) =>
      row.grade_size ??
      (row.grade && row.size ? `${row.grade}/${row.size}` : "NA/NA"),
    {
      id: "grade_size",
      header: "Grade/Size",
      cell: (info) => (
        <span className="block text-sm leading-tight">
          {info.getValue() ?? "—"}
        </span>
      ),
    }
  ),

  // Brand / Source
  columnHelper.accessor("brand", {
    id: "brand",
    header: "Brand/Source",
    cell: (info) => info.getValue() || "-",
  }),

  // Customer Type
  columnHelper.accessor("customer_type", {
    id: "customer_type",
    header: "Customer Type",
    cell: (info) => (
      <span className="block text-sm leading-tight">
        {info.getValue() ?? "—"}
      </span>
    ),
  }),

  // Specific Purpose
  columnHelper.accessor("specific_purpose", {
    id: "specific_purpose",
    header: () => <span>Specific <br /> Purpose</span>,
    cell: (info) => info.getValue() ?? "—",
  }),

  // Action — Allot Sample button
  columnHelper.display({
    id: "actions",
    header: "Action",
    cell: RowActions,
  }),
];
