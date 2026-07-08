import { createColumnHelper } from "@tanstack/react-table";
import { StatusCell, RowActionsCell } from "./rows";

const columnHelper = createColumnHelper();

export const columns = [
  // 1. Sr No
  columnHelper.accessor((_row, index) => index + 1, {
    id: "s_no",
    header: "Sr No",
    cell: (info) => info.row.index + 1,
  }),

  // 2. ID
  columnHelper.accessor("id", {
    id: "id",
    header: "ID",
    cell: (info) => info.getValue() || "—",
  }),

  // 3. Name
  columnHelper.accessor("name", {
    id: "name",
    header: "Name",
    cell: (info) => info.getValue() || "—",
  }),

  // 4. Mobile
  columnHelper.accessor("mobile", {
    id: "mobile",
    header: "Mobile",
    cell: (info) => info.getValue() || "—",
  }),

  // 5. Email
  columnHelper.accessor("email", {
    id: "email",
    header: "Email",
    cell: (info) => info.getValue() || "—",
  }),

  // 6. Status
  columnHelper.accessor("status", {
    id: "status",
    header: "Status",
    cell: StatusCell,
  }),

  // 7. Actions
  columnHelper.display({
    id: "actions",
    header: "Actions",
    cell: RowActionsCell,
  }),
];
