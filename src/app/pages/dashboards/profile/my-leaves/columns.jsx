import { createColumnHelper } from "@tanstack/react-table";
import {
  UserNameCell,
  LeaveTypeCell,
  DateCell,
  AppliedOnCell,
  ApprovedAtCell,
  ApprovedByCell,
  DaysCell,
  StatusCell,
} from "./rows";

const columnHelper = createColumnHelper();

export const columns = [
  // 1. Sr No
  columnHelper.accessor((_row, index) => index + 1, {
    id: "s_no",
    header: "Sr No",
    cell: (info) => info.row.index + 1,
  }),

  // 2. User Name
  columnHelper.accessor((row) => [row.firstname, row.lastname].filter(Boolean).join(" ") || row.username || "", {
    id: "username",
    header: "User Name",
    cell: UserNameCell,
  }),

  // 3. Leave Type
  columnHelper.accessor((row) => row.leave_type_label || row.leaveType || row.leavetype || "", {
    id: "leave_type",
    header: "Leave Type",
    cell: LeaveTypeCell,
  }),

  // 4. Compoff Date
  columnHelper.accessor("compoffdate", {
    id: "compoffdate",
    header: "Compoff Date",
    cell: DateCell,
  }),

  // 5. Start Date
  columnHelper.accessor("startdate", {
    id: "startdate",
    header: "Start Date",
    cell: DateCell,
  }),

  // 6. End Date
  columnHelper.accessor("enddate", {
    id: "enddate",
    header: "End Date",
    cell: DateCell,
  }),

  // 7. Reason
  columnHelper.accessor("reason", {
    id: "reason",
    header: "Reason",
    cell: (info) => info.getValue() || "—",
  }),

  // 8. No Of Days
  columnHelper.display({
    id: "no_of_days",
    header: "No Of Days",
    cell: DaysCell,
  }),

  // 9. Applied On
  columnHelper.accessor("added_on", {
    id: "applied_on",
    header: "Applied On",
    cell: AppliedOnCell,
  }),

  // 10. Approved By
  columnHelper.accessor((row) => row.approved_by_name || row.approved_by || "", {
    id: "approved_by",
    header: "Approved By",
    cell: ApprovedByCell,
  }),

  // 11. Approved At
  columnHelper.display({
    id: "approved_at",
    header: "Approved At",
    cell: ApprovedAtCell,
  }),

  // 12. Status
  columnHelper.display({
    id: "status",
    header: "Status",
    cell: StatusCell,
  }),
];
