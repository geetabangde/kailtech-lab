// Import Dependencies
import { createColumnHelper } from "@tanstack/react-table";

// Local Imports
import { RowActions } from "./RowActions";

const columnHelper = createColumnHelper();

export const columns = [
  columnHelper.accessor((_row, index) => index + 1, {
    id: "s_no",
    header: "S No",
    cell: ({ row, getValue }) => (
      <div className="flex items-center gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            row.toggleExpanded();
          }}
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-bold text-white shadow-sm transition-colors ${row.getIsExpanded() ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"
            }`}
        >
          {row.getIsExpanded() ? "−" : "+"}
        </button>
        <span className="text-sm text-gray-700 dark:text-dark-200">
          {getValue()}
        </span>
      </div>
    ),
    filterFn: "textContains",
  }),

  // ✅ TRF Entry No — kept only one
  columnHelper.accessor("trf_entry_no", {
    id: "trf_entry_no",
    header: "TRF Entry No",
    cell: (info) => (
      <span className="text-sm font-medium text-gray-700 dark:text-dark-200">
        {info.getValue()}
      </span>
    ),
    filterFn: "textContains",
  }),
  // ✅ Status — PHP ke saath fully matched
  columnHelper.accessor("status", {
    id: "status",
    header: "Status",
    filterFn: "statusExact",
    cell: (info) => {
      const status = Number(info.getValue());

      const statusMap = {
        0: {
          text: "Add Items Pending",
          bg: "bg-yellow-100",
          textColor: "text-yellow-800",
          darkBg: "dark:bg-yellow-900",
          darkText: "dark:text-yellow-200",
        },
        1: {
          text: "Sample Review",
          bg: "bg-orange-100",
          textColor: "text-orange-800",
          darkBg: "dark:bg-orange-900",
          darkText: "dark:text-orange-200",
        },
        2: {
          text: "Technical Acceptance",
          bg: "bg-purple-100",
          textColor: "text-purple-800",
          darkBg: "dark:bg-purple-900",
          darkText: "dark:text-purple-200",
        },
        3: {
          text: "Allot Sample",
          bg: "bg-pink-100",
          textColor: "text-pink-800",
          darkBg: "dark:bg-pink-900",
          darkText: "dark:text-pink-200",
        },
        4: {
          text: "Assign Chemist",
          bg: "bg-indigo-100",
          textColor: "text-indigo-800",
          darkBg: "dark:bg-indigo-900",
          darkText: "dark:text-indigo-200",
        },
        5: {
          text: "Perform Testing",
          bg: "bg-blue-100",
          textColor: "text-blue-800",
          darkBg: "dark:bg-blue-900",
          darkText: "dark:text-blue-200",
        },
        6: {
          text: "Draft Report",
          bg: "bg-cyan-100",
          textColor: "text-cyan-800",
          darkBg: "dark:bg-cyan-900",
          darkText: "dark:text-cyan-200",
        },
        7: {
          text: "HOD Review",
          bg: "bg-teal-100",
          textColor: "text-teal-800",
          darkBg: "dark:bg-teal-900",
          darkText: "dark:text-teal-200",
        },
        8: {
          text: "QA Review",
          bg: "bg-emerald-100",
          textColor: "text-emerald-800",
          darkBg: "dark:bg-emerald-900",
          darkText: "dark:text-emerald-200",
        },
        9: {
          text: "Generate ULR",
          bg: "bg-lime-100",
          textColor: "text-lime-800",
          darkBg: "dark:bg-lime-900",
          darkText: "dark:text-lime-200",
        },
        10: {
          text: "Final Report Ready",
          bg: "bg-green-100",
          textColor: "text-green-800",
          darkBg: "dark:bg-green-900",
          darkText: "dark:text-green-200",
        },
        98: {
          text: "Pending For Approvals",
          bg: "bg-gray-100",
          textColor: "text-gray-800",
          darkBg: "dark:bg-gray-700",
          darkText: "dark:text-gray-200",
        },
        99: {
          text: "Cancelled",
          bg: "bg-red-100",
          textColor: "text-red-800",
          darkBg: "dark:bg-red-900",
          darkText: "dark:text-red-200",
        },
      };

      const s = statusMap[status] ?? {
        text: `Status ${status}`,
        bg: "bg-gray-100",
        textColor: "text-gray-800",
        darkBg: "dark:bg-gray-700",
        darkText: "dark:text-gray-200",
      };

      return (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${s.bg} ${s.textColor} ${s.darkBg} ${s.darkText}`}
        >
          {s.text}
        </span>
      );
    },
  }),

  // ✅ Date
  columnHelper.accessor("date", {
    id: "date",
    header: "Date",
    cell: (info) => {
      const date = info.getValue();
      return (
        <span className="text-sm text-gray-700 dark:text-dark-200">
          {date ? new Date(date).toLocaleDateString() : "—"}
        </span>
      );
    },
  }),

  // ✅ Customer
  columnHelper.accessor("customername", {
    id: "customer",
    header: "Customer",
    cell: (info) => {
      const permissions = JSON.parse(localStorage.getItem("userPermissions") || "[]");
      if (!permissions.includes(358)) return "Not Permitted";
      return (
        <div className="block max-w-[200px] whitespace-normal text-sm text-gray-700 dark:text-dark-200">
          {info.getValue() || "—"}
        </div>
      );
    },
  }),

  // ✅ Products
  columnHelper.accessor("products_display", {
    id: "products",
    header: "Products",
    cell: (info) => (
      <div className="block max-w-[250px] whitespace-normal text-sm text-gray-700 dark:text-dark-200">
        {info.getValue() || "—"}
      </div>
    ),
  }),

  // ✅ BRN Nos
  columnHelper.accessor("brn_nos_display", {
    id: "brn_nos",
    header: "BRN Nos",
    cell: (info) => {
      const permissions = JSON.parse(localStorage.getItem("userPermissions") || "[]");
      if (!permissions.includes(376)) return "Not Permitted";
      return (
        <div className="block max-w-[150px] whitespace-normal text-sm text-gray-700 dark:text-dark-200">
          {info.getValue() || "—"}
        </div>
      );
    },
  }),

  // ✅ LRN Nos
  columnHelper.accessor("lrn_nos_display", {
    id: "lrn_nos",
    header: "LRN Nos",
    cell: (info) => {
      const permissions = JSON.parse(localStorage.getItem("userPermissions") || "[]");
      if (!permissions.includes(375)) return "Not Permitted";
      return (
        <div className="block max-w-[150px] whitespace-normal text-sm text-gray-700 dark:text-dark-200">
          {info.getValue() || "—"}
        </div>
      );
    },
  }),

  // ✅ Grades
  columnHelper.accessor("grades_display", {
    id: "grades",
    header: "Grades",
    cell: (info) => (
      <div className="max-w-xs truncate" title={info.getValue()}>
        {info.getValue() || "-"}
      </div>
    ),
  }),

  // ✅ Sizes
  columnHelper.accessor("sizes_display", {
    id: "sizes",
    header: "Sizes",
    cell: (info) => (
      <div className="max-w-xs truncate" title={info.getValue()}>
        {info.getValue() || "-"}
      </div>
    ),
  }),

  // ✅ PO Number
  columnHelper.accessor("ponumber", {
    id: "po_number",
    header: "PO Number",
    cell: (info) => {
      const permissions = JSON.parse(localStorage.getItem("userPermissions") || "[]");
      if (!permissions.includes(371)) return "Not Permitted";
      return info.getValue() || "-";
    },
  }),

  // ✅ Report Name
  columnHelper.accessor("reportname", {
    id: "report_name",
    header: "Report Name",
    cell: (info) => (
      <div className="max-w-xs truncate" title={info.getValue()}>
        {info.getValue() || "-"}
      </div>
    ),
  }),

  // ✅ Customer Type
  columnHelper.accessor("customer_type_display", {
    id: "customer_type",
    header: "Customer Type",
    cell: (info) => (
      <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
        {info.getValue() || "-"}
      </span>
    ),
  }),

  // ✅ Specific Purpose
  columnHelper.accessor("specific_purpose_display", {
    id: "specific_purpose",
    header: "Specific Purpose",
    cell: (info) => (
      <div className="max-w-xs truncate" title={info.getValue()}>
        {info.getValue() || "-"}
      </div>
    ),
  }),

  // ✅ BD (Business Development)
  columnHelper.accessor("bd", {
    id: "bd",
    header: "BD",
    cell: (info) => info.getValue() || "-",
  }),

  // ✅ Remarks
  columnHelper.accessor("reviewremark", {
    id: "remarks",
    header: "Remarks",
    cell: (info) => (
      <div className="max-w-xs truncate" title={info.getValue()}>
        {info.getValue() || "-"}
      </div>
    ),
  }),

  // ✅ Actions
  columnHelper.display({
    id: "actions",
    header: "Actions",
    cell: ({ row, table }) => (
      <div className="w-[450px]">
        <RowActions row={row} table={table} />
      </div>
    ),
    filterFn: "alwaysTrue",
  }),
];
