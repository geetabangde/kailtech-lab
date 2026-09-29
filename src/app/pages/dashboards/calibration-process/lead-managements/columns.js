// Import Dependencies
import { createColumnHelper } from "@tanstack/react-table";

// Local Imports
import { RowActions } from "./RowActions";

const columnHelper = createColumnHelper();

export const columns = [
  // ✅ Serial number column
  columnHelper.accessor((_row, index) => index + 1, {
    id: "serialNumber",
    header: "S.No.",
    cell: (info) => info.row.index + 1,
  }),

  // ✅ Customer Name (mapped from API's "customername")
  columnHelper.accessor("customerName", {
    id: "customerName",
    header: "Customer Name",
    cell: (info) => info.getValue() || "-",
  }),

  // ✅ Due Date (mapped from API's "duedate")
  columnHelper.accessor("dueDate", {
    id: "dueDate",
    header: "Due Date",
    cell: (info) => {
      const value = info.getValue();
      if (!value) return "-";
      
      // Format date if needed (currently API returns YYYY-MM-DD)
      try {
        const date = new Date(value);
        return date.toLocaleDateString('en-IN', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      } catch {
        return value;
      }
    },
  }),

  // ✅ Actions
  columnHelper.display({
    id: "actions",
    header: "Actions",
    cell: RowActions,
  }),
];