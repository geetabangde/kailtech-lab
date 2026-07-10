// Import Dependencies
import { createColumnHelper } from "@tanstack/react-table";

// Local Imports
import { RowActions } from "./RowActions";

const columnHelper = createColumnHelper();

export const columns = [
  // ✅ ID
  columnHelper.accessor("id", {
    id: "id",
    header: "ID",
    cell: (info) => info.getValue(),
  }),

  // ✅ Date
  columnHelper.accessor("added_on", {
    id: "added_on",
    header: "Date",
    cell: (info) => info.getValue() || " ",
  }),

  // ✅ Purpose
  columnHelper.accessor("purpose_name", {
    id: "purpose_name",
    header: "Purpose",
    cell: (info) => info.getValue() || " ",
  }),

  // ✅ Description
  columnHelper.accessor("description", {
    id: "description",
    header: "Description",
    cell: (info) => info.getValue() || " ",
  }),

  // ✅ Quantity
  columnHelper.accessor("quantity", {
    id: "quantity",
    header: "Quantity",
    cell: (info) => info.getValue() || " ",
  }),

  // ✅ Source
  columnHelper.accessor("source", {
    id: "source",
    header: "Source",
    cell: (info) => info.getValue() || " ",
  }),

  // ✅ Issued To
  columnHelper.accessor("uname", {
    id: "uname",
    header: "Issued To",
    cell: (info) => info.getValue() || " ",
  }),

  // ✅ Remark
  columnHelper.accessor("remark", {
    id: "remark",
    header: "Remark",
    cell: (info) => info.getValue() || " ",
  }),

  // ✅ Actions
  columnHelper.display({
    id: "actions",
    header: "Actions",
    cell: RowActions,
  }),
];
