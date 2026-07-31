// Import Dependencies
import { createColumnHelper } from "@tanstack/react-table";

// Local Imports
import { PerformTestRowActions } from "./PerformTestRowActions";

const columnHelper = createColumnHelper();

export const performTestColumns = [
  // ID
  columnHelper.accessor("id", {
    id: "id",
    header: "ID",
    cell: (info) => (
      <span className="font-mono text-xs font-semibold text-gray-600 dark:text-gray-400">
        {info.getValue() ?? "—"}
      </span>
    ),
    filterFn: "includesString",
  }),

  // Product
  columnHelper.accessor("product", {
    id: "product",
    header: "Product",
    cell: (info) => (
      <span className="block max-w-[240px] whitespace-normal leading-tight text-sm text-gray-700 dark:text-dark-200">
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
      <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
        {info.getValue() ?? "—"}
      </span>
    ),
    filterFn: "includesString",
  }),

  // Brand/Source
  columnHelper.accessor("brand", {
    id: "brand",
    header: "Brand/Source",
    cell: (info) => info.getValue() ?? "—",
    filterFn: "includesString",
  }),

  // Grade/Size
  columnHelper.accessor("grade_size", {
    id: "grade_size",
    header: "Grade/Size",
    cell: (info) => info.getValue() ?? "—",
    filterFn: "includesString",
  }),

  // Long Term Test
  columnHelper.accessor("long_term_test", {
    id: "long_term_test",
    header: "Long Term Test",
    cell: (info) => {
      const val = info.getValue();
      if (!val) return "—";
      return (
        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${val === "yes"
          ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
          : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
          }`}>
          {val}
        </span>
      );
    },
    filterFn: "includesString",
  }),

  // Tentative Report Date (INTERIM)
  columnHelper.accessor("interim_report_date", {
    id: "interim_report_date",
    header: "Tentative Report Date (INTERIM)",
    cell: (info) => info.getValue() ?? "—",
    filterFn: "includesString",
  }),

  // Tentative Report Date (LONGTERM)
  columnHelper.accessor("longterm_report_date", {
    id: "longterm_report_date",
    header: "Tentative Report Date (LONGTERM)",
    cell: (info) => info.getValue() ?? "—",
    filterFn: "includesString",
  }),

  // Tentative Report Date
  columnHelper.accessor("tentative_report_date", {
    id: "tentative_report_date",
    header: "Tentative Report Date",
    cell: (info) => info.getValue() ?? "—",
    filterFn: "includesString",
  }),

  // Action — Perform Test button → navigate to detail
  columnHelper.display({
    id: "actions",
    header: "Action",
    cell: PerformTestRowActions,
    enableColumnFilter: false,
  }),
];