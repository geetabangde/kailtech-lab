// Import Dependencies
import { createColumnHelper } from "@tanstack/react-table";

// Local Imports
import { RowActions } from "./RowActions";

const columnHelper = createColumnHelper();

export const columns = [


  // ✅ Serial Number
  columnHelper.accessor((_row, index) => index + 1, {
    id: "s_no",
    header: "S No",
    cell: (info) => info.row.index + 1,
  }),

  // ✅ Mode Name (from API)
  columnHelper.accessor("name", {
    id: "name",
    header: "Mode Name",
    cell: (info) => info.getValue(),
  }),

  // ✅ Description (from API)
  columnHelper.accessor("description", {
    id: "description",
    header: "Description",
    cell: (info) => info.getValue(),
  }),

  // ✅ Actions
  columnHelper.display({
    id: "actions",
    header: "Actions",
    cell: RowActions,
  }),
];
