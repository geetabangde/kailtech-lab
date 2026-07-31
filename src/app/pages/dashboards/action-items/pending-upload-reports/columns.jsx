// Import Dependencies
import { createColumnHelper } from "@tanstack/react-table";

// Local Imports
import { RowActions } from "./RowActions";
// ----------------------------------------------------------------------

const columnHelper = createColumnHelper();

export const columns = [
  // ── ID ──────────────────────────────────────────────────────────────────
  columnHelper.accessor("id", {
    id: "id",
    header: () => <div className="text-center">ID</div>,
    cell: (info) => (
      <span className="text-xs text-gray-800 dark:text-dark-100">
        {info.getValue() ?? "—"}
      </span>
    ),
    filterFn: "includesString",
  }),

  // ── Product ─────────────────────────────────────────────────────────────
  columnHelper.accessor("product", {
    id: "product",
    header: () => <div className="text-center">Product</div>,
    cell: (info) => (
      <span className="block max-w-[280px] whitespace-normal text-xs leading-tight text-gray-800 dark:text-dark-100">
        {info.getValue() ?? "—"}
      </span>
    ),
    filterFn: "includesString",
  }),

  // ── Main Customer (permission 358) ───────────────────────────────────────
  columnHelper.accessor("main_customer", {
    id: "main_customer",
    header: () => <div className="text-center">Main Customer</div>,
    cell: (info) => (
      <span className="block max-w-[220px] whitespace-normal leading-tight text-xs text-gray-800 dark:text-dark-100">
        {info.getValue() ?? "—"}
      </span>
    ),
    filterFn: "includesString",
  }),

  // ── Report Customer ──────────────────────────────────────────────────────
  columnHelper.accessor("report_customer", {
    id: "report_customer",
    header: () => <div className="text-center">Report Customer</div>,
    cell: (info) => {
      const value = info.getValue();
      let text = "—";
      if (Array.isArray(value)) {
        text = value.length ? value.join(", ") : "—";
      } else {
        text = value ?? "—";
      }
      return (
        <span className="block max-w-[220px] whitespace-normal leading-tight text-xs text-gray-800 dark:text-dark-100">
          {text}
        </span>
      );
    },
    filterFn: "includesString",
  }),

  // ── LRN ─────────────────────────────────────────────────────────────────
  columnHelper.accessor("lrn", {
    id: "lrn",
    header: () => <div className="text-center">LRN</div>,
    cell: (info) => (
      <span className="text-xs text-gray-800 dark:text-dark-100">
        {info.getValue() ?? "—"}
      </span>
    ),
    filterFn: "includesString",
  }),

  // ── BRN ─────────────────────────────────────────────────────────────────
  columnHelper.accessor("brn", {
    id: "brn",
    header: () => <div className="text-center">BRN</div>,
    cell: (info) => (
      <span className="text-xs text-gray-800 dark:text-dark-100">
        {info.getValue() ?? "—"}
      </span>
    ),
    filterFn: "includesString",
  }),

  // ── ULR ─────────────────────────────────────────────────────────────────
  columnHelper.accessor("ulr", {
    id: "ulr",
    header: () => <div className="text-center">ULR</div>,
    cell: (info) => (
      <span className="text-xs text-gray-800 dark:text-dark-100">
        {info.getValue() ?? "—"}
      </span>
    ),
    filterFn: "includesString",
  }),

  // ── Report Date ──────────────────────────────────────────────────────────
  columnHelper.accessor("reportdate", {
    id: "reportdate",
    header: () => <div className="text-center">Report date</div>,
    cell: (info) => {
      const val = info.getValue();
      let formatted = "—";
      if (val) {
        const parts = val.split("-");
        if (parts.length === 3) {
          formatted = `${parts[2]}-${parts[1]}-${parts[0]}`;
        } else {
          formatted = val;
        }
      }
      return (
        <span className="whitespace-nowrap text-xs text-gray-800 dark:text-dark-100">
          {formatted}
        </span>
      );
    },
    filterFn: "includesString",
  }),

  // ── Grade / Size ─────────────────────────────────────────────────────────
  columnHelper.accessor("grade_size", {
    id: "grade_size",
    header: () => <div className="text-center">Grade/Size</div>,
    cell: (info) => (
      <span className="block max-w-[150px] whitespace-normal leading-tight text-xs text-gray-800 dark:text-dark-100">
        {info.getValue() ?? "—"}
      </span>
    ),
    filterFn: "includesString",
  }),

  // ── Action ───────────────────────────────────────────────────────────────
  columnHelper.display({
    id: "actions",
    header: "Action",
    cell: RowActions,
    enableColumnFilter: false,
  }),
];