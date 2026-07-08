// Import Dependencies
import { createColumnHelper } from "@tanstack/react-table";
import { RowActions } from "./RowActions";

const columnHelper = createColumnHelper();

export const columns = [
  columnHelper.accessor("id", {
    id: "id",
    header: "ID",
    cell: (info) => info.getValue() ?? "-",
  }),
  columnHelper.accessor("product", {
    id: "product",
    header: "Product",
    cell: (info) => info.getValue() ?? "-",
  }),
  columnHelper.accessor("lrn", {
    id: "lrn",
    header: "LRN",
    cell: (info) => info.getValue() ?? "-",
  }),
  columnHelper.accessor("brand", {
    id: "brand",
    header: "Brand/Source",
    cell: (info) => info.getValue() ?? "-",
  }),
  columnHelper.accessor("grade_size", {
    id: "grade_size",
    header: "Grade/Size",
    cell: ({ row }) => {
      const { grade, size } = row.original;
      const g = grade && grade !== "NA" ? grade : "";
      const s = size && size !== "NA" ? size : "";
      if (g && s) return `${g} / ${s}`;
      if (g) return g;
      if (s) return s;
      return "-";
    },
  }),
  columnHelper.accessor("chemist", {
    id: "chemist",
    header: "Chemist",
    cell: (info) => {
      const val = info.getValue();
      return val ? <span className="font-medium text-blue-600 dark:text-blue-400">{val}</span> : "-";
    },
  }),
  columnHelper.display({
    id: "parameters",
    header: "Parameters",
    cell: ({ row }) => {
      const { doneCount, leftCount, pendingAssignment } = row.original;
      return (
        <div className="flex flex-col gap-1 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
          <div>{doneCount ?? 0} Tests completed</div>
          <div>{leftCount ?? 0} Tests Pending completion</div>
          <div>{pendingAssignment ?? 0} Tests Pending Assignment</div>
        </div>
      );
    },
  }),
  columnHelper.display({
    id: "action",
    header: "Action",
    cell: ({ row, table }) => <RowActions row={row} table={table} />,
  }),
];
