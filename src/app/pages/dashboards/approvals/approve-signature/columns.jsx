// Import Dependencies
import { createColumnHelper } from "@tanstack/react-table";

// Local Imports
import { RowActions } from "./RowActions";

const columnHelper = createColumnHelper();



export const columns = [


  // PHP: $n[] = $i;  (S.NO — auto-incremented counter)
  columnHelper.display({
    id: "sno",
    header: "S.No",
    cell: ({ row, table }) => {
      const { pageIndex, pageSize } = table.getState().pagination;
      return (
        <span className="text-xs text-gray-500 dark:text-dark-400">
          {pageIndex * pageSize + row.index + 1}
        </span>
      );
    },
  }),

  // PHP: $n[] = $row['lrn'];  — trfProducts.lrn
  columnHelper.accessor("lrn", {
    id: "lrn",
    header: "LRN",
    cell: (info) => (
      <span className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400">
        {info.getValue() ?? "—"}
      </span>
    ),
  }),

  // PHP: $n[] = $row['brn'];  — trfProducts.brn
  columnHelper.accessor("brn", {
    id: "brn",
    header: "BRN No",
    cell: (info) => (
      <span className="font-mono text-xs">
        {info.getValue() ?? "—"}
      </span>
    ),
  }),

  // PHP: $n[] = $row['cname'];  — customers.name
  columnHelper.accessor("cname", {
    id: "cname",
    header: "Customer",
    cell: (info) => info.getValue() ?? "—",
  }),

  // PHP: $n[] = $row['pname'];  — products.name
  columnHelper.accessor("pname", {
    id: "pname",
    header: "Product",
    cell: (info) => info.getValue() ?? "—",
  }),

  // PHP: Approve button + View Report link
  columnHelper.display({
    id: "actions",
    header: "Action",
    enableSorting: false,
    cell: RowActions,
  }),
];