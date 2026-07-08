import { createColumnHelper } from "@tanstack/react-table";
import {
  KRATextCell,
  KRAStatusCell,
  KRAActiveCell,
  KRAMarkCell,
} from "./rows";

const columnHelper = createColumnHelper();

export const columns = [
  // 1. Sr No
  columnHelper.accessor((_row, index) => index + 1, {
    id: "s_no",
    header: "Sr No",
    cell: (info) => info.row.index + 1,
  }),

  // 2. KRA Description
  columnHelper.accessor((row) => row.kra || row.title || row.description || "", {
    id: "kra",
    header: "KRA",
    cell: KRATextCell,
  }),

  // 3. Alloted To
  columnHelper.accessor((row) => row.alloted_to_name || row.alloted_to || row.allotedto || "", {
    id: "alloted_to",
    header: "Alloted To",
    cell: KRATextCell,
  }),

  // 4. Status
  columnHelper.accessor((row) => row.status || row.kra_status || "", {
    id: "status",
    header: "Status",
    cell: KRAStatusCell,
  }),

  // 5. Created By
  columnHelper.accessor((row) => row.created_by_name || row.created_by || row.createdby || "", {
    id: "created_by_name",
    header: "Created By",
    cell: KRATextCell,
  }),

  // 6. Remark
  columnHelper.accessor((row) => row.remark || row.comments || "", {
    id: "remark",
    header: "Remark",
    cell: KRATextCell,
  }),

  // 7. Mark
  columnHelper.accessor((row) => row.mark || row.score || row.rating || 0, {
    id: "mark",
    header: "Mark",
    cell: KRAMarkCell,
  }),

  // 8. Active / Deactivate
  columnHelper.accessor((row) => row.active_status || row.active_deactivate || row.activeStatus || "0", {
    id: "active_status",
    header: "Active / Deactivate",
    cell: KRAActiveCell,
  }),
];
