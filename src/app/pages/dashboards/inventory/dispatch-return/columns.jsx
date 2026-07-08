// Import Dependencies
import { createColumnHelper } from "@tanstack/react-table";
import { RowActions } from "./RowActions";

const columnHelper = createColumnHelper();

export const columns = [
  columnHelper.accessor("id", {
    id: "id",
    header: "ID",
    cell: (info) => info.getValue(),
  }),

  columnHelper.accessor("gatpassnumber", {
    id: "gatepass_no",
    header: "Gatepass Number",
    cell: (info) => info.getValue() || "N/A",
  }),

  columnHelper.accessor("dinpname", {
    id: "purpose_name",
    header: "Purpose",
    cell: (info) => info.getValue() || "N/A",
  }),

  columnHelper.accessor("instname", {
    id: "name",
    header: "Name",
    cell: (info) => info.getValue() || "N/A",
  }),

  columnHelper.accessor("challanno", {
    id: "challan_no",
    header: "Challan No",
    cell: (info) => info.getValue() || "N/A",
  }),

  columnHelper.accessor("sample_return", {
    id: "sample_return",
    header: "Sample Return",
    cell: (info) => info.getValue() || "N/A",
  }),

  columnHelper.accessor("returnon", {
    id: "return_on",
    header: "Return On",
    cell: (info) => {
      const val = info.getValue();
      if (!val) return "N/A";
      // Assuming val is like "2026-03-30 15:38:34"
      const datePart = val.split(" ")[0];
      const parts = datePart.split("-");
      if (parts.length === 3) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
      return val;
    },
  }),

  columnHelper.display({
    id: "action",
    header: "Actions",
    cell: ({ row }) => <RowActions row={row} />,
  }),
];
