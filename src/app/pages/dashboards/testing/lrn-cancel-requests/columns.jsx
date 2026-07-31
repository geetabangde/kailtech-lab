// Import Dependencies
import { createColumnHelper } from "@tanstack/react-table";

// Local Imports
import { RowActions } from "./RowActions";

const columnHelper = createColumnHelper();

// ✅ PHP code se: 0=Pending, 1=Approved, 2=Completed, 99=Rejected
const statusMap = {
  0: { label: "Pending", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
  1: { label: "Approved", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  2: { label: "Completed", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  99: { label: "Rejected", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
};

const formatDate = (val) => {
  if (!val || val === "0000-00-00" || val === "0000-00-00 00:00:00") return "-";
  const date = new Date(val);
  if (isNaN(date)) return val;
  return date.toLocaleDateString("en-GB"); // DD/MM/YYYY
};

export const columns = [


  // ── Serial Number (UI generated) ──────────────────────────────────────────
  columnHelper.accessor((_row, index) => index + 1, {
    id: "s_no",
    header: "ID",
    cell: (info) => (
      <span className="text-sm text-gray-700 dark:text-dark-200">
        {info.row.index + 1}
      </span>
    ),
    meta: { align: "center" },
    enableColumnFilter: false,
  }),

  // ── Inward No (trfid from API) ────────────────────────────────────────────
  columnHelper.accessor("trfid", {
    id: "trfid",
    header: "INWARD NO",
    cell: (info) => (
      <span className="text-sm text-gray-700 dark:text-dark-200">
        {info.getValue() || "—"}
      </span>
    ),
    filterFn: "includesString",
  }),

  // ── Date of Receive ───────────────────────────────────────────────────────
  columnHelper.accessor("date", {
    id: "date",
    header: "DATE OF RECEIVE",
    cell: (info) => (
      <span className="text-sm text-gray-700 dark:text-dark-200">
        {formatDate(info.getValue())}
      </span>
    ),
    filterFn: "includesString",
  }),

  // ── ID No ─────────────────────────────────────────────────────────────────
  columnHelper.accessor("idno", {
    id: "idno",
    header: "ID NO",
    cell: (info) => (
      <span className="text-sm text-gray-700 dark:text-dark-200">
        {info.getValue() || "—"}
      </span>
    ),
    filterFn: "includesString",
  }),

  // ── Serial No ─────────────────────────────────────────────────────────────
  columnHelper.accessor("serialno", {
    id: "serialno",
    header: "SERIAL NO",
    cell: (info) => (
      <span className="text-sm text-gray-700 dark:text-dark-200">
        {info.getValue() || "—"}
      </span>
    ),
    filterFn: "includesString",
  }),

  // ── Customer Name ─────────────────────────────────────────────────────────
  columnHelper.accessor("customername", {
    id: "customername",
    header: "CUSTOMER NAME",
    cell: (info) => (
      <span className="block max-w-[250px] whitespace-normal text-sm text-gray-700 dark:text-dark-200">
        {info.getValue() || "—"}
      </span>
    ),
    filterFn: "includesString",
  }),

  // ── Certificate No (brnno) ────────────────────────────────────────────────
  columnHelper.accessor("brnno", {
    id: "brnno",
    header: "CERTIFICATE NO",
    cell: (info) => (
      <span className="text-sm text-gray-700 dark:text-dark-200">
        {info.getValue() || "—"}
      </span>
    ),
    filterFn: "includesString",
  }),

  // ── LRN No ────────────────────────────────────────────────────────────────
  columnHelper.accessor("lrnno", {
    id: "lrnno",
    header: "LRN NO",
    cell: (info) => (
      <span className="text-sm text-gray-700 dark:text-dark-200">
        {info.getValue() || "—"}
      </span>
    ),
    filterFn: "includesString",
  }),

  // ── Reason ────────────────────────────────────────────────────────────────
  columnHelper.accessor("reason", {
    id: "reason",
    header: "REASON",
    cell: (info) => (
      <span className="block max-w-[300px] whitespace-normal text-sm text-gray-700 dark:text-dark-200">
        {info.getValue() || "—"}
      </span>
    ),
  }),

  // ── Reject/Approve Reason ─────────────────────────────────────────────────
  columnHelper.accessor("rejectreason", {
    id: "rejectreason",
    header: () => <div className="text-center">REJECT/APPROVE<br />REASON</div>,
    cell: (info) => (
      <span className="block max-w-[300px] whitespace-normal text-sm text-gray-700 dark:text-dark-200">
        {info.getValue() || "—"}
      </span>
    ),
    filterFn: "includesString",
  }),

  // ── Requested On (added_on) ───────────────────────────────────────────────
  columnHelper.accessor("added_on", {
    id: "added_on",
    header: "REQUESTED ON",
    cell: (info) => (
      <span className="text-sm text-gray-700 dark:text-dark-200">
        {formatDate(info.getValue())}
      </span>
    ),
    filterFn: "includesString",
  }),

  // ── Requested By (firstname + lastname) ───────────────────────────────────
  columnHelper.accessor(
    (row) => `${row.firstname ?? ""} ${row.lastname ?? ""}`.trim(),
    {
      id: "requestedby",
      header: "REQUESTED BY",
      cell: (info) => (
        <span className="text-sm font-medium text-gray-700 dark:text-dark-200">
          {info.getValue() || "—"}
        </span>
      ),
      filterFn: "includesString",
    }
  ),

  // ── Approved On ───────────────────────────────────────────────────────────
  columnHelper.accessor("approved_on", {
    id: "approved_on",
    header: "APPROVED ON",
    cell: (info) => (
      <span className="text-sm text-gray-700 dark:text-dark-200">
        {formatDate(info.getValue())}
      </span>
    ),
    filterFn: "includesString",
  }),

  // ── Approved By (appfname + applname) ─────────────────────────────────────
  columnHelper.accessor(
    (row) => `${row.appfname ?? ""} ${row.applname ?? ""}`.trim(),
    {
      id: "approvedby",
      header: "APPROVED BY",
      cell: (info) => (
        <span className="text-sm font-medium text-gray-700 dark:text-dark-200">
          {info.getValue() || "—"}
        </span>
      ),
      filterFn: "includesString",
    }
  ),

  // ── Status (0/1/2/99) ─────────────────────────────────────────────────────
  columnHelper.accessor("status", {
    id: "status",
    header: "STATUS",
    cell: (info) => {
      const raw = info.getValue();
      const entry = statusMap[raw] ?? {
        label: String(raw ?? "-"),
        color: "bg-gray-100 text-gray-600 dark:bg-dark-600 dark:text-dark-300",
      };
      return (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${entry.color}`}
        >
          {entry.label}
        </span>
      );
    },
    enableColumnFilter: false,
  }),

  // ── Actions ───────────────────────────────────────────────────────────────
  columnHelper.display({
    id: "actions",
    header: () => <div className="text-center w-full">ACTIONS</div>,
    cell: RowActions,
    meta: { align: "center" },
    enableColumnFilter: false,
  }),
];