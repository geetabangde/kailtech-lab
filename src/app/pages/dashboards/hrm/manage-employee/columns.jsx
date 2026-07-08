// Import Dependencies
import { createColumnHelper } from "@tanstack/react-table";

// Local Imports
import { RowActions } from "./RowActions";

const STATUS_MAP = {
  0: "Unverified",
  1: "Active",
  10: "Pending For Induction",
  11: "Induction Training started",
  12: "pending for training",
  13: "Employee Training initiated",
  14: "In training",
  15: "In training",
  16: "In training",
  17: "In training",
  99: "Suspended",
};

const columnHelper = createColumnHelper();

export const columns = [
  // ✅ Serial Number
  columnHelper.accessor((_row, index) => index + 1, {
    id: "s_no",
    header: "S No",
    cell: (info) => info.row.index + 1,
  }),

  // ✅ Employee Name
  columnHelper.accessor(
    (row) => `${row.firstname || ""} ${row.lastname || ""}`.trim(),
    {
      id: "name",
      header: "Name",
      cell: (info) => info.getValue(),
    }
  ),

  // ✅ Employee Code
  columnHelper.accessor("empid", {
    id: "empid",
    header: "Employee Code",
    cell: (info) => info.getValue() || "-",
  }),

  // ✅ Mobile
  columnHelper.accessor("mobile", {
    id: "mobile",
    header: "Mobile",
    cell: (info) => info.getValue() || "-",
  }),

  // ✅ Email
  columnHelper.accessor("email", {
    id: "email",
    header: "Email",
    cell: (info) => info.getValue() || "-",
  }),

  // ✅ Department
  columnHelper.accessor("dname", {
    id: "dname",
    header: "Department",
    cell: (info) => info.getValue() || "-",
  }),

  // ✅ Status
  columnHelper.accessor("status", {
    id: "status",
    header: "Status",
    cell: (info) => {
      const val = info.getValue();
      const statusText = STATUS_MAP[val] || "Unknown";
      return (
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold leading-5 ${val === 1
              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
              : val === 0
                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                : val === 99
                  ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                  : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
            }`}
        >
          {statusText}
        </span>
      );
    },
  }),

  // ✅ Actions
  columnHelper.display({
    id: "actions",
    header: () => <div className="text-center">Actions</div>,
    cell: RowActions,
  }),
];
