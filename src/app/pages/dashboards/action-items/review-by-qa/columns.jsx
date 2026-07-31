// Import Dependencies
import { createColumnHelper } from "@tanstack/react-table";

// Local Imports
import { RowActions } from "./RowActions";


const columnHelper = createColumnHelper();

export const columns = [


  // Sr No
  columnHelper.accessor((_row, index) => index + 1, {
    id: "s_no",
    header: "Sr No",
    enableSorting: false,
    cell: (info) => (
      <span className="text-xs text-gray-700 dark:text-dark-200">
        {info.row.index + 1}
      </span>
    ),
    enableColumnFilter: false,
  }),

  // Product — API: product_name
  columnHelper.accessor("product_name", {
    id: "product",
    header: "Product",
    cell: (info) => (
      <span className="block max-w-[220px] whitespace-normal text-xs text-gray-700 dark:text-dark-200">
        {info.getValue() ?? "—"}
      </span>
    ),
    filterFn: "includesString",
  }),

  // Main Customer — API: customername (PHP: perm 358)
  columnHelper.accessor("customername", {
    id: "main_customer",
    header: "Main Customer",
    cell: (info) => (
      <span className="block max-w-[220px] whitespace-normal text-xs text-gray-700 dark:text-dark-200">
        {info.getValue() ?? "—"}
      </span>
    ),
    filterFn: "includesString",
  }),

  // Report Customer — API: reportname
  // PHP resolves comma-separated IDs to names via customers table.
  // Backend should return resolved name string; if numeric ID is returned, display as-is.
  columnHelper.accessor("reportname", {
    id: "report_customer",
    header: () => <div className="text-center leading-tight">Report <br /> Customer</div>,
    cell: (info) => {
      const val = info.getValue();
      if (!val) return "—";
      // If API returns resolved names (comma-separated), split on comma → newline
      return (
        <span className="block whitespace-pre-line text-center text-xs text-gray-700 dark:text-dark-200">
          {val.replace(/,/g, "\n")}
        </span>
      );
    },
    filterFn: "includesString",
  }),

  // LRN — API: lrn
  columnHelper.accessor("lrn", {
    id: "lrn",
    header: "LRN",
    cell: (info) => (
      <span className="text-xs text-gray-700 dark:text-dark-200">
        {info.getValue() ?? "—"}
      </span>
    ),
    filterFn: "includesString",
  }),

  // BRN — API: brn
  columnHelper.accessor("brn", {
    id: "brn",
    header: "BRN",
    cell: (info) => (
      <span className="text-xs text-gray-700 dark:text-dark-200">
        {info.getValue() ?? "—"}
      </span>
    ),
    filterFn: "includesString",
  }),

  // ULR — API: ulr
  columnHelper.accessor("ulr", {
    id: "ulr",
    header: "ULR",
    cell: (info) => (
      <span className="text-xs text-gray-700 dark:text-dark-200">
        {info.getValue() ?? "—"}
      </span>
    ),
    filterFn: "includesString",
  }),

  // Grade/Size — API: grade_name + size_name  (PHP: grades.name + "/" + sizes.name)
  columnHelper.accessor(
    (row) => {
      const g = row.grade_name ?? "";
      const s = row.size_name ?? "";
      if (!g && !s) return "—";
      return `${g}/${s}`;
    },
    {
      id: "grade_size",
      header: "Grade/Size",
      cell: (info) => (
        <span className="block max-w-[200px] whitespace-normal text-xs leading-tight text-gray-700 dark:text-dark-200">
          {info.getValue()}
        </span>
      ),
      filterFn: "includesString",
    }
  ),

  // Department — API: lab_name  (PHP: labs.name where id=hodrequests.department)
  columnHelper.accessor("lab_name", {
    id: "department",
    header: "Department",
    cell: (info) => (
      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-200">
        {info.getValue() ?? "—"}
      </span>
    ),
    filterFn: "includesString",
  }),

  // Customer Type — API: customer_type  (PHP: customertypes.name, perm 389)
  columnHelper.accessor("customer_type", {
    id: "customer_type",
    header: () => <div className="text-center leading-tight">Customer <br /> Type</div>,
    cell: (info) => (
      <span className="block max-w-[150px] whitespace-normal text-xs leading-tight text-gray-700 dark:text-dark-200">
        {info.getValue() ?? "—"}
      </span>
    ),
    filterFn: "includesString",
  }),

  // Specific Purpose — API: specific_purpose  (PHP: specificpurposes.name, perm 390)
  columnHelper.accessor("specific_purpose", {
    id: "specific_purpose",
    header: () => <div className="text-center leading-tight">Specific <br /> Purpose</div>,
    cell: (info) => (
      <span className="text-xs text-gray-700 dark:text-dark-200">
        {info.getValue() ?? "—"}
      </span>
    ),
    filterFn: "includesString",
  }),

  // Action — driven by hod_status (PHP logic reproduced in RowActions)
  columnHelper.display({
    id: "actions",
    header: "Action",
    cell: RowActions,
    enableColumnFilter: false,
  }),
];