import { createColumnHelper } from "@tanstack/react-table";

const columnHelper = createColumnHelper();

export const columns = [
  columnHelper.accessor("id", {
    header: "ID",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("name", {
    header: "Name",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("qty", {
    header: "Qty",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("uname", {
    header: "Unit",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("exp", {
    header: "Expiry",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("department", {
    header: "Department",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("added_on", {
    header: "Added on",
    cell: (info) => info.getValue(),
  }),
];
