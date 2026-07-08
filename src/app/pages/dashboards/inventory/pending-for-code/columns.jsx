// Import Dependencies
import { createColumnHelper } from "@tanstack/react-table";

// Local Imports
import {
  SelectCell,
  SelectHeader,
} from "components/shared/table/SelectCheckbox";

const columnHelper = createColumnHelper();

export const columns = [
  columnHelper.display({
    id: "select",
    header: SelectHeader,
    cell: SelectCell,
  }),

  // PHP: Description (column 1 in PHP output)
  columnHelper.accessor("description", {
    id: "description",
    header: "Description",
    cell: (info) => info.getValue(),
  }),

  // PHP: HSN (column 2 in PHP output)
  columnHelper.accessor("hsn", {
    id: "hsn",
    header: "HSN Code",
    cell: (info) => info.getValue(),
  }),

  // UOM (column 3)
  columnHelper.accessor("uom", {
    id: "uom",
    header: "UOM",
    cell: (info) => info.getValue(),
  }),

  // PHP: Qty (column 4 in PHP output)
  columnHelper.accessor("qty", {
    id: "qty",
    header: "Qty",
    cell: (info) => info.getValue(),
  }),

  // PHP: Price/Rate (column 5 in PHP output - field name is 'rate')
  columnHelper.accessor("rate", {
    id: "rate",
    header: "Price",
    cell: (info) => {
      const rate = info.getValue();
      return rate ? parseFloat(rate).toFixed(2) : "";
    },
  }),

  // PHP: Amount (column 6 in PHP output)
  columnHelper.accessor("amount", {
    id: "amount",
    header: "Amount",
    cell: (info) => {
      const amount = info.getValue();
      return amount ? parseFloat(amount).toFixed(2) : "";
    },
  }),
];
