import { createColumnHelper } from "@tanstack/react-table";
import { StatusCell } from "./rows";

const columnHelper = createColumnHelper();

export const columns = [
  // 1. Ticket No
  columnHelper.accessor("id", {
    id: "id",
    header: "Ticket No",
    cell: (info) => info.getValue() || "—",
  }),

  // 2. Title
  columnHelper.accessor("problemtitle", {
    id: "problemtitle",
    header: "Title",
    cell: (info) => info.getValue() || "—",
  }),

  // 3. Status
  columnHelper.accessor("status", {
    id: "status",
    header: "Status",
    cell: StatusCell,
  }),

  // 4. Description
  columnHelper.accessor("description", {
    id: "description",
    header: "Description",
    cell: (info) => {
      const val = info.getValue() || "";
      return val.length > 50 ? `${val.substring(0, 50)}...` : val || "—";
    },
  }),

  // 5. View (rendered in index.jsx or via a cell handler)
  columnHelper.display({
    id: "view",
    header: "View",
    cell: (info) => {
      const row = info.row.original;
      const onView = info.table.options.meta?.onViewDetail;
      return (
        <button
          onClick={() => onView?.(row)}
          className="inline-flex items-center justify-center rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-600 border border-blue-200 hover:bg-blue-100 hover:text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800 transition h-7 whitespace-nowrap"
        >
          View Detail
        </button>
      );
    }
  }),

  // 6. Category
  columnHelper.accessor("category_name", {
    id: "category_name",
    header: "Category",
    cell: (info) => {
      const row = info.row.original;
      return info.getValue() || row.category || "—";
    },
  }),

  // 7. Sub Category
  columnHelper.accessor("subcategory_name", {
    id: "subcategory_name",
    header: "Sub Category",
    cell: (info) => {
      const row = info.row.original;
      return info.getValue() || row.subcategory || "—";
    },
  }),

  // 8. Alloted To
  columnHelper.accessor("alloted_to_name", {
    id: "alloted_to_name",
    header: "Alloted To",
    cell: (info) => {
      const row = info.row.original;
      return info.getValue() || row.alloted_to || "—";
    },
  }),

  // 9. Initiated By
  columnHelper.accessor("initiated_by_name", {
    id: "initiated_by_name",
    header: "Initiated By",
    cell: (info) => {
      const row = info.row.original;
      return info.getValue() || row.initiated_by || row.created_by || "—";
    },
  }),

  // 10. Initiated On
  columnHelper.accessor("initiated_on", {
    id: "initiated_on",
    header: "Initiated On",
    cell: (info) => {
      const row = info.row.original;
      return info.getValue() || row.initiated_on || row.created_at || "—";
    },
  }),

  // 11. Closed By
  columnHelper.accessor("closed_by_name", {
    id: "closed_by_name",
    header: "Closed By",
    cell: (info) => {
      const row = info.row.original;
      return info.getValue() || row.closed_by || "—";
    },
  }),

  // 12. Closed On
  columnHelper.accessor("closed_on", {
    id: "closed_on",
    header: "Closed On",
    cell: (info) => info.getValue() || "—",
  }),
];
