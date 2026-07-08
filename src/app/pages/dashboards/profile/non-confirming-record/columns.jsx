import { createColumnHelper } from "@tanstack/react-table";
import {
  RefNoCell,
  TypeCell,
  StatusCell,
  ProgressCell,
  StandardCell,
} from "./rows";

const columnHelper = createColumnHelper();

export const columns = [
  // 1. Sr No or ID
  columnHelper.accessor("id", {
    id: "s_no",
    header: "S No",
    cell: ({ row }) => (
      <span className="text-xs font-bold text-gray-500 font-mono">
        {row.index + 1}
      </span>
    ),
  }),

  // 2. Date
  columnHelper.accessor("date", {
    id: "date",
    header: "Date",
    cell: StandardCell,
  }),

  // 3. Ref No
  columnHelper.accessor("ref_no", {
    id: "ref_no",
    header: "Ref No",
    cell: RefNoCell,
  }),

  // 4. Source
  columnHelper.accessor("source", {
    id: "source",
    header: "Source",
    cell: StandardCell,
  }),

  // 5. Concern Person
  columnHelper.accessor("concern_person", {
    id: "concern_person",
    header: "Concern Person",
    cell: StandardCell,
  }),

  // 6. Type
  columnHelper.accessor("type", {
    id: "type",
    header: "Type",
    cell: TypeCell,
  }),

  // 7. Status
  columnHelper.accessor("status", {
    id: "status",
    header: "Status",
    cell: StatusCell,
  }),

  // 8. Completion status
  columnHelper.accessor("completion_percentage", {
    id: "completion_percentage",
    header: "Completion status (In % based on no. of responsibility closed)",
    cell: ProgressCell,
  }),
];
