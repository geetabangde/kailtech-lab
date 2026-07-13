// Import Dependencies
import { createColumnHelper } from "@tanstack/react-table";

// Local Imports
import { RowActions } from "./RowActions";

const columnHelper = createColumnHelper();

// Helper: format date from Y-m-d to d/m/Y
const formatDate = (dateStr) => {
  if (!dateStr || dateStr === "0000-00-00") return "";
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

export const columns = [
  columnHelper.display({
    id: "select"
  }),

  // Sr. No
  columnHelper.display({
    id: "s_no",
    header: "Sr. no",
    cell: (info) => info.row.index + 1,
    meta: { align: "center", className: "w-[50px] min-w-[50px] max-w-[50px] !px-2 text-center" },
  }),

  // Receipt no — show receiptno if present, else id
  columnHelper.accessor((row) => row.receiptno || row.id, {
    id: "receiptno",
    header: "Receipt no",
    cell: (info) => info.getValue() ?? "",
  }),

  // Payment Date (formatted d/m/Y)
  columnHelper.accessor("paymentdate", {
    id: "paymentdate",
    header: "Payment Date",
    cell: (info) => formatDate(info.getValue()),
  }),

  // Customer Name — "Suspense" if customerid is empty/0
  columnHelper.accessor(
    (row) =>
      !row.customerid || row.customerid === "0" ? "Suspense" : row.name,
    {
      id: "customer_name",
      header: () => <div className="min-w-[150px] max-w-[250px] whitespace-normal break-words">Customer name</div>,
      cell: (info) => (
        <div className="min-w-[150px] max-w-[250px] whitespace-normal break-words">
          {info.getValue() ?? ""}
        </div>
      ),
    },
  ),

  // Invoice No — comma-separated invoice numbers
  columnHelper.accessor("invno", {
    id: "invno",
    header: "Invoice no",
    cell: (info) => info.getValue() ?? "",
  }),

  // BD — firstname + lastname
  columnHelper.accessor(
    (row) => `${row.firstname ?? ""} ${row.lastname ?? ""}`.trim(),
    {
      id: "bd",
      header: "BD",
      cell: (info) => info.getValue(),
    },
  ),

  // Payment Mode
  columnHelper.accessor("paymentmode", {
    id: "paymentmode",
    header: "Payment Mode",
    cell: (info) => info.getValue() ?? "",
  }),

  // Bank Name
  columnHelper.accessor("bankname", {
    id: "bankname",
    header: "Bank name",
    cell: (info) => info.getValue() ?? "",
  }),

  // Cheque Date
  columnHelper.accessor("chequedate", {
    id: "chequedate",
    header: "Cheque date",
    cell: (info) => formatDate(info.getValue()),
  }),

  // Cheque Number — only if paymentmode is "Cheque"
  columnHelper.accessor(
    (row) => (row.paymentmode === "Cheque" ? row.paymentdetail : ""),
    {
      id: "cheque_number",
      header: "Cheque number",
      cell: (info) => info.getValue(),
    },
  ),

  // UTR No — if NOT Cheque and NOT Cash
  columnHelper.accessor(
    (row) =>
      row.paymentmode === "Cheque" || row.paymentmode === "Cash"
        ? ""
        : row.paymentdetail,
    {
      id: "utr_no",
      header: "UTR No.",
      cell: (info) => info.getValue(),
    },
  ),

  // Net Amount (paymentamount)
  columnHelper.accessor("paymentamount", {
    id: "paymentamount",
    header: "Net Amount",
    cell: (info) => info.getValue() ?? 0,
  }),

  // TDS by Client
  columnHelper.accessor("tds", {
    id: "tds",
    header: "Tds by Client",
    cell: (info) => info.getValue() ?? 0,
  }),

  // Gross Amount (totalinvoiceamount)
  columnHelper.accessor("totalinvoiceamount", {
    id: "totalinvoiceamount",
    header: "Gross Amount",
    cell: (info) => info.getValue() ?? 0,
  }),

  // Actions
  columnHelper.display({
    id: "actions",
    header: "Action",
    cell: RowActions,
    meta: { align: "center" },
  }),
];
