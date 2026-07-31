// Import Dependencies
import { createColumnHelper } from "@tanstack/react-table";

// Local Imports
import { RowActions } from "./RowActions";

const columnHelper = createColumnHelper();

const statusMap = {
  0: { label: "Pending", color: "warning" },
  1: { label: "Approved", color: "success" },
  2: { label: "Completed", color: "info" },
  99: { label: "Rejected", color: "error" },
};

export const columns = [
  // ID
  columnHelper.accessor("id", {
    id: "id",
    header: "ID",
    cell: (info) => (
      <span className="font-mono text-xs font-bold text-gray-700 dark:text-gray-300">
        {info.getValue() ?? "—"}
      </span>
    ),
    filterFn: "includesString",
  }),

  // Name (Product Name)
  columnHelper.accessor("name", {
    id: "name",
    header: "NAME",
    cell: (info) => (
      <span className="block max-w-[150px] whitespace-normal text-sm font-medium text-gray-800 dark:text-gray-200">
        {info.getValue() ?? "—"}
      </span>
    ),
    filterFn: "includesString",
  }),

  // LRN
  columnHelper.accessor("lrn", {
    id: "lrn",
    header: "LRN",
    cell: (info) => (
      <span className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400">
        {info.getValue() ?? "—"}
      </span>
    ),
    filterFn: "includesString",
  }),

  // BRN
  columnHelper.accessor("brn", {
    id: "brn",
    header: "BRN",
    cell: (info) => (
      <span className="font-mono text-xs text-gray-600 dark:text-gray-400">
        {info.getValue() ?? "—"}
      </span>
    ),
    filterFn: "includesString",
  }),

  // Customer Name
  columnHelper.accessor("customername", {
    id: "customername",
    header: "CUSTOMER NAME",
    cell: (info) => (
      <span className="block max-w-[150px] whitespace-normal text-sm text-gray-700 dark:text-gray-300">
        {info.getValue() ?? "—"}
      </span>
    ),
    filterFn: "includesString",
  }),

  // TRF No
  columnHelper.accessor("trf", {
    id: "trf",
    header: "TRF NO",
    cell: (info) => (
      <span className="text-sm text-gray-700 dark:text-gray-300">
        {info.getValue() ?? "—"}
      </span>
    ),
    filterFn: "includesString",
  }),

  // Changes In
  columnHelper.accessor("changesin", {
    id: "changesin",
    header: "CHANGES IN",
    cell: (info) => (
      <span className="block max-w-[150px] whitespace-normal text-sm text-gray-700 dark:text-gray-300">
        {info.getValue() ?? "—"}
      </span>
    ),
    filterFn: "includesString",
  }),

  // Status
  columnHelper.accessor("status", {
    id: "status",
    header: "STATUS",
    cell: (info) => {
      const val = info.getValue();
      const status = statusMap[val] || { label: val ?? "Unknown", color: "gray" };
      return (
        <div className={`badge badge-soft-${status.color} capitalize`}>
          {status.label}
        </div>
      );
    },
    enableColumnFilter: false,
  }),

  // Actions
  columnHelper.display({
    id: "actions",
    header: "ACTIONS",
    cell: RowActions,
    enableColumnFilter: false,
  }),

  // Rev No
  columnHelper.accessor("revno", {
    id: "revno",
    header: "REV NO",
    cell: (info) => {
      const val = info.getValue();
      return (
        <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
          {val !== undefined ? parseInt(val) + 1 : "—"}
        </span>
      );
    },
    filterFn: "includesString",
  }),

  // Reason
  columnHelper.accessor("reason", {
    id: "reason",
    header: "REASON",
    cell: (info) => (
      <span className="block max-w-[200px] whitespace-normal text-sm text-gray-600 dark:text-gray-400 italic">
        {info.getValue() ?? "—"}
      </span>
    ),
    filterFn: "includesString",
  }),

  // Remark
  columnHelper.accessor("remark", {
    id: "remark",
    header: "REMARK",
    cell: (info) => (
      <span className="block max-w-[200px] whitespace-normal text-sm text-gray-600 dark:text-gray-400">
        {info.getValue() ?? "—"}
      </span>
    ),
    filterFn: "includesString",
  }),

  // Requested On
  columnHelper.accessor("added_on", {
    id: "added_on",
    header: "REQUESTED ON",
    cell: (info) => {
      const val = info.getValue();
      if (!val) return "—";
      try {
        const date = new Date(val);
        return (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {date.toLocaleDateString("en-GB")}
          </span>
        );
      } catch {
        return <span className="text-xs text-gray-500 dark:text-gray-400">{val}</span>;
      }
    },
    filterFn: "includesString",
  }),

  // Requested By
  columnHelper.accessor((row) => `${row.firstname ?? ""} ${row.lastname ?? ""}`.trim(), {
    id: "requested_by",
    header: "REQUESTED BY",
    cell: (info) => (
      <span className="text-sm text-gray-700 dark:text-gray-300">
        {info.getValue() || "—"}
      </span>
    ),
    filterFn: "includesString",
  }),

  // Approved On
  columnHelper.accessor("updated_on", {
    id: "updated_on",
    header: "APPROVED ON",
    cell: (info) => {
      const val = info.getValue();
      if (!val) return "—";
      try {
        const date = new Date(val);
        return (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {date.toLocaleDateString("en-GB")}
          </span>
        );
      } catch {
        return <span className="text-xs text-gray-500 dark:text-gray-400">{val}</span>;
      }
    },
    filterFn: "includesString",
  }),

  // Approved By
  columnHelper.accessor((row) => `${row.appfname ?? ""} ${row.applname ?? ""}`.trim(), {
    id: "approved_by",
    header: "APPROVED BY",
    cell: (info) => (
      <span className="text-sm text-gray-700 dark:text-gray-300">
        {info.getValue() || "—"}
      </span>
    ),
    filterFn: "includesString",
  }),
];