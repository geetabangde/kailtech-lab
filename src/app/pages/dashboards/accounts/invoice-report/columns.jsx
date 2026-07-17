import { createColumnHelper } from "@tanstack/react-table";
import { StatusBadge } from "./StatusBadge";

const columnHelper = createColumnHelper();

export const columns = [
  columnHelper.display({
    id: "s_no",
    header: "Sr. no",
    cell: (info) => info.row.index + 1,
  }),
  columnHelper.accessor("custname", {
    id: "custname",
    header: "Customer Name",
    cell: (info) => (
      <div className="break-words max-w-[130px]">
        {info.getValue() ?? "-"}
      </div>
    ),
  }),
  columnHelper.accessor("ponumber", {
    id: "ponumber",
    header: "Po Number",
    cell: (info) => (
      <div className="break-words max-w-[130px]">
        {info.getValue() ?? "-"}
      </div>
    ),
  }),
  columnHelper.accessor("invoiceno", {
    id: "invoiceno",
    header: "Invoice No",
    cell: (info) => info.getValue() ?? "-",
  }),
  columnHelper.accessor("subtotal", {
    id: "subtotal",
    header: () => <>Item<br />Total</>,
    cell: (info) => info.getValue() ?? "-",
  }),

  columnHelper.accessor("subtotal2", {
    id: "subtotal2",
    header: () => <>Total<br />Taxable</>,
    cell: (info) => info.getValue() ?? "-",
  }),
  columnHelper.accessor("sgstamount", {
    id: "sgstamount",
    header: "SGST",
    cell: (info) => info.getValue() ?? "-",
  }),
  columnHelper.accessor("cgstamount", {
    id: "cgstamount",
    header: "CGST",
    cell: (info) => info.getValue() ?? "-",
  }),
  columnHelper.accessor("igstamount", {
    id: "igstamount",
    header: "IGST",
    cell: (info) => info.getValue() ?? "-",
  }),
  columnHelper.accessor("finaltotal", {
    id: "finaltotal",
    header: () => <>Invoice<br />Amount</>,
    cell: (info) => info.getValue() ?? "-",
  }),
  columnHelper.accessor("remaining", {
    id: "remaining",
    header: () => <>Remaining<br />Amount</>,
    cell: (info) => info.getValue() ?? "-",
  }),
  columnHelper.accessor("typeofinvoice", {
    id: "typeofinvoice",
    header: () => <>Invoice<br />Type</>,
    cell: (info) => info.getValue() ?? "-",
  }),
  columnHelper.accessor("status", {
    id: "status",
    header: "Status",
    cell: (info) => <StatusBadge status={info.getValue()} />,
  }),
];
