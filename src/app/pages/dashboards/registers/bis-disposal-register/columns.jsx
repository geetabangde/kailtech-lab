// Import Dependencies
import { createColumnHelper } from "@tanstack/react-table";

const columnHelper = createColumnHelper();

const safeRender = (val) => {
  if (val === undefined || val === null || val === "" || val === "0000-00-00 00:00:00" || val === "0000-00-00") return "-";
  if (typeof val === "string" && (val.includes("<div") || val.includes("<br"))) {
    return <div dangerouslySetInnerHTML={{ __html: val }} />;
  }
  return val;
};

export const columns = [
  columnHelper.accessor("sno", {
    id: "sno",
    header: "S no",
    cell: (info) => safeRender(info.getValue()),
  }),
  columnHelper.accessor("date", {
    id: "date",
    header: "Date",
    cell: (info) => safeRender(info.getValue()),
  }),
  columnHelper.accessor("lrn_brn", {
    id: "lrn_brn",
    header: "LRN/BRN",
    cell: (info) => safeRender(info.getValue()),
  }),
  columnHelper.accessor("nature_of_sample", {
    id: "nature_of_sample",
    header: "Nature of Sample",
    cell: (info) => safeRender(info.getValue()),
  }),
  columnHelper.accessor("indian_standards", {
    id: "indian_standards",
    header: "Indian Standards",
    cell: (info) => safeRender(info.getValue()),
  }),
  columnHelper.accessor("quantity_received", {
    id: "quantity_received",
    header: "Quantity Recieved",
    cell: (info) => safeRender(info.getValue()),
  }),
  columnHelper.accessor("received", {
    id: "received",
    header: "Received",
    cell: (info) => safeRender(info.getValue()),
  }),
  columnHelper.accessor("parameters", {
    id: "parameters",
    header: "Parameters",
    cell: (info) => safeRender(info.getValue()),
  }),
  columnHelper.accessor("allocated_to", {
    id: "allocated_to",
    header: "Allocated To",
    cell: (info) => safeRender(info.getValue()),
  }),
  columnHelper.accessor("reporting_date", {
    id: "reporting_date",
    header: "Reporting Date",
    cell: (info) => safeRender(info.getValue()),
  }),
  columnHelper.accessor("signature", {
    id: "signature",
    header: "Signature",
    cell: (info) => safeRender(info.getValue()),
  }),
  columnHelper.accessor("approx_qty_after_test", {
    id: "approx_qty_after_test",
    header: "Approx Qty After Test",
    cell: (info) => safeRender(info.getValue()),
  }),
  columnHelper.accessor("signature_receiver_date", {
    id: "signature_receiver_date",
    header: "Signature of Sample Receiver With Date",
    cell: (info) => safeRender(info.getValue()),
  }),
];
