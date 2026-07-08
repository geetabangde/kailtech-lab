import { createColumnHelper } from "@tanstack/react-table";
import { DateCell, InTimeCell, OutTimeCell, AttendanceStatusCell } from "./rows";

const columnHelper = createColumnHelper();

export const columns = [
  // Date
  columnHelper.accessor("date", {
    id: "date",
    header: "Date",
    cell: DateCell,
  }),

  // In time
  columnHelper.accessor("intime", {
    id: "intime",
    header: "In time",
    cell: InTimeCell,
  }),

  // Out Time
  columnHelper.accessor("outtime", {
    id: "outtime",
    header: "Out Time",
    cell: OutTimeCell,
  }),

  // Attendance Status
  columnHelper.display({
    id: "attandence",
    header: "Attendance Status",
    cell: AttendanceStatusCell,
  }),
];
