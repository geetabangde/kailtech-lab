// Import Dependencies
import { createColumnHelper } from "@tanstack/react-table";

// Local Imports
import { RowActions } from "./RowActions";

const columnHelper = createColumnHelper();

export const columns = [
  // ✅ Serial Number
  columnHelper.accessor((_row, index) => index + 1, {
    id: "s_no",
    header: "S No",
    cell: (info) => info.row.index + 1,
  }),

  // ✅ Leave Rule Name
  columnHelper.accessor("name", {
    id: "name",
    header: "Name",
    cell: (info) => info.getValue(),
  }),

  // ✅ Casual Leave
  columnHelper.accessor("clquota", {
    id: "clquota",
    header: "Casual Leave",
    cell: (info) => {
      const row = info.row.original;
      return (
        <div className="flex flex-col">
          <span className="font-semibold text-gray-700 dark:text-dark-100">{info.getValue()}</span>
          <span className="text-xs text-gray-500">Monthly Limit: {row.clmonthlylimit}</span>
        </div>
      );
    },
  }),

  // ✅ Sick Leave
  columnHelper.accessor("slquota", {
    id: "slquota",
    header: "Sick Leave",
    cell: (info) => {
      const row = info.row.original;
      return (
        <div className="flex flex-col">
          <span className="font-semibold text-gray-700 dark:text-dark-100">{info.getValue()}</span>
          <span className="text-xs text-gray-500">Monthly Limit: {row.slmonthlylimit}</span>
        </div>
      );
    },
  }),

  // ✅ Earned Leave
  columnHelper.accessor("elquota", {
    id: "elquota",
    header: "Earned Leave",
    cell: (info) => {
      const row = info.row.original;
      return (
        <div className="flex flex-col">
          <span className="font-semibold text-gray-700 dark:text-dark-100">{info.getValue()}</span>
          <span className="text-xs text-gray-500">Monthly Limit: {row.elmonthlylimit}</span>
        </div>
      );
    },
  }),

  // ✅ Actions
  columnHelper.display({
    id: "actions",
    header: () => <div className="text-center">Action</div>,
    cell: RowActions,
  }),
];
