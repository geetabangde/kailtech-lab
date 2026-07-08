import { createColumnHelper } from "@tanstack/react-table";
import {
  MOMDateCell,
  MOMNumberCell,
  MOMTextCell,
  MOMStatusCell,
  MOMCompletionStatusCell,
} from "./rows";

const columnHelper = createColumnHelper();

export const columns = [
  // 1. Sr No
  columnHelper.accessor((_row, index) => index + 1, {
    id: "s_no",
    header: "S No",
    cell: (info) => info.row.index + 1,
  }),

  // 2. MOM Date
  columnHelper.accessor((row) => row.mom_date || row.momdate || row.date || "", {
    id: "mom_date",
    header: "MOM Date",
    cell: MOMDateCell,
  }),

  // 3. Mom Number
  columnHelper.accessor((row) => row.mom_no || row.momno || row.mom_number || row.momnumber || "", {
    id: "mom_no",
    header: "Mom Number",
    cell: MOMNumberCell,
  }),

  // 4. Mom Location
  columnHelper.accessor((row) => row.location || row.mom_location || row.momlocation || "", {
    id: "location",
    header: "Mom Location",
    cell: MOMTextCell,
  }),

  // 5. Mom Purpose
  columnHelper.accessor((row) => row.purpose || row.mom_purpose || row.mompurpose || row.subject || "", {
    id: "purpose",
    header: "Mom Purpose",
    cell: MOMTextCell,
  }),

  // 6. Created by
  columnHelper.accessor((row) => row.created_by_name || row.created_by || row.username || row.createdby || "", {
    id: "created_by_name",
    header: "Created by",
    cell: MOMTextCell,
  }),

  // 7. Status
  columnHelper.accessor((row) => row.status || row.mom_status || row.momstatus || "", {
    id: "status",
    header: "Status",
    cell: MOMStatusCell,
  }),

  // 8. Completion status
  columnHelper.accessor((row) => {
    // Return numeric percentage
    if (row.completion_status !== undefined) return Number(row.completion_status);
    if (row.completion !== undefined) return Number(row.completion);
    if (row.percentage !== undefined) return Number(row.percentage);
    
    // Auto-calculate if tasks array exists
    if (Array.isArray(row.tasks) && row.tasks.length > 0) {
      const closed = row.tasks.filter((t) => String(t.status).toLowerCase() === "closed").length;
      return Math.round((closed / row.tasks.length) * 100);
    }
    return 0;
  }, {
    id: "completion_status",
    header: "Completion status (In % based on no. of responsibility closed)",
    cell: MOMCompletionStatusCell,
  }),
];
