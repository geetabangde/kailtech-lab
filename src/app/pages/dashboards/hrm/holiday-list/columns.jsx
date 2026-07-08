// Import Dependencies
import { createColumnHelper } from "@tanstack/react-table";
import { Link } from "react-router-dom";
import dayjs from "dayjs";

// Local Imports
import { RowActions } from "./RowActions";

const columnHelper = createColumnHelper();

// columns for listing YEARS
export const columns = [
  // S No
  columnHelper.accessor((_row, index) => index + 1, {
    id: "s_no",
    header: "S No",
    cell: (info) => info.row.index + 1,
  }),

  // Year
  columnHelper.accessor("year", {
    id: "year",
    header: "Year",
    cell: (info) => info.getValue(),
  }),

  // Actions
  columnHelper.display({
    id: "actions",
    header: () => <div className="text-center">Action</div>,
    cell: (info) => {
      const year = info.row.original.year;
      return (
        <div className="flex items-center justify-center gap-2">
          <Link
            to={`/dashboards/hrm/holidays/yearly-list/${year}`}
            className="inline-flex items-center justify-center rounded-md bg-blue-50 px-4 py-1.5 text-xs font-bold text-blue-700 transition hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 min-w-[65px]"
          >
            <span>View</span>
          </Link>
        </div>
      );
    },
  }),
];

// columns for listing HOLIDAYS for a selected year
export const holidayColumns = [
  // S No
  columnHelper.accessor((_row, index) => index + 1, {
    id: "s_no",
    header: "S No",
    cell: (info) => info.row.index + 1,
  }),

  // Holiday Name
  columnHelper.accessor("name", {
    id: "name",
    header: "Name",
    cell: (info) => info.getValue(),
  }),

  // Date
  columnHelper.accessor("date", {
    id: "date",
    header: "Date",
    cell: (info) => {
      const val = info.getValue();
      return val ? dayjs(val).format("DD MMM YYYY") : "";
    },
  }),

  // Actions (Edit/Delete specific holiday)
  columnHelper.display({
    id: "actions",
    header: () => <div className="text-center">Action</div>,
    cell: RowActions,
  }),
];
