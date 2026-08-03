// Import Dependencies
import { createColumnHelper } from "@tanstack/react-table";

const columnHelper = createColumnHelper();

export const columns = [
  columnHelper.display({
    id: "s_no",
    header: "Sr. no",
    cell: (info) => info.row.index + 1,
  }),
  columnHelper.accessor("gstno", {
    id: "gstno",
    header: "GSTIN NO",
    cell: (info) => info.getValue() ?? "-",
  }),
  columnHelper.accessor("custname", {
    id: "custname",
    header: "RECEIVER NAME",
    cell: (info) => info.getValue() ?? "-",
  }),
  columnHelper.accessor("invoiceno", {
    id: "invoiceno",
    header: "INVOICE NO",
    cell: (info) => info.getValue() ?? "-",
  }),
  columnHelper.accessor("invoicedate", {
    id: "invoicedate",
    header: "INVOICE DATE",
    cell: (info) => {
      const val = info.getValue();
      if (!val) return "-";
      const d = new Date(val);
      return isNaN(d) ? val : d.toLocaleDateString("en-GB");
    },
  }),
  columnHelper.accessor("finaltotal", {
    id: "finaltotal",
    header: "TOTAL INVOICE VALUE",
    cell: (info) => info.getValue() ?? "-",
  }),
  columnHelper.accessor("subtotal2", {
    id: "subtotal2",
    header: "TAXABLE VALUE",
    cell: (info) => info.getValue() ?? "-",
  }),
  columnHelper.accessor("cgstamount", {
    id: "cgstamount",
    header: "CENTRAL TAX",
    cell: (info) => info.getValue() ?? "-",
  }),
  columnHelper.accessor("sgstamount", {
    id: "sgstamount",
    header: "STATE TAX",
    cell: (info) => info.getValue() ?? "-",
  }),
  columnHelper.accessor("roundoff", {
    id: "roundoff",
    header: "ROUND OFF",
    cell: (info) => info.getValue() ?? "-",
  }),
];
