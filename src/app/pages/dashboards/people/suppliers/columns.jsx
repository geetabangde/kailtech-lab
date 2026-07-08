// Import Dependencies
import { createColumnHelper } from "@tanstack/react-table";

// Local Imports
import { RowActions } from "./RowActions";
// Removed rows imports since we'll use basic text cells

// ----------------------------------------------------------------------

const columnHelper = createColumnHelper();

export const columns = [
  columnHelper.accessor("id", {
    id: "id",
    header: () => <div className="text-center">ID</div>,
    cell: (info) => info.getValue(),
    meta: { align: "center" },
  }),

  columnHelper.accessor("name", {
    id: "name",
    header: "NAME",
    cell: (info) => info.getValue() || "—",
  }),
  columnHelper.accessor("company", {
    id: "company",
    header: "COMPANY",
    cell: (info) => info.getValue() || "—",
  }),
  columnHelper.accessor("city", {
    id: "city",
    header: "CITY",
    cell: (info) => info.getValue() || "—",
  }),
  columnHelper.display({
    id: "actions",
    label: "Row Actions",
    header: () => <div className="text-center w-full">ACTIONS</div>,
    cell: RowActions,
    meta: { align: "center" },
  }),
]
