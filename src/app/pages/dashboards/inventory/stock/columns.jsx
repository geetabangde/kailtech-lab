// Import Dependencies
import { createColumnHelper } from "@tanstack/react-table";


const columnHelper = createColumnHelper();

export const columns = [
  // API: cname
  columnHelper.accessor("cname", {
    id: "category",
    header: "Category",
    cell: (info) => info.getValue(),
  }),

  // API: name
  columnHelper.accessor("name", {
    id: "product_name",
    header: "Product Name",
    cell: (info) => info.getValue(),
  }),

  // API: idno / newidno
  columnHelper.accessor("idno", {
    id: "id_no",
    header: "ID no",
    cell: (info) => info.row.original.newidno || info.getValue() || "-",
  }),

  // API: labname
  columnHelper.accessor("labname", {
    id: "location",
    header: "Location",
    cell: (info) => info.getValue() || "-",
  }),

  // API: criticalName
  columnHelper.accessor("criticalName", {
    id: "critical",
    header: "Critical",
    cell: (info) => {
      const val = info.getValue();
      return val ? (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${val === 'Yes' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-gray-100 text-gray-700 dark:bg-dark-600 dark:text-dark-200'}`}>
          {val}
        </span>
      ) : "-";
    },
  }),

  // API: batchno
  columnHelper.accessor("batchno", {
    id: "batch_no",
    header: "Batch no.",
    cell: (info) => info.getValue() || "-",
  }),

  // API: qty and units
  columnHelper.accessor("qty", {
    id: "quantity",
    header: "Quantity",
    cell: (info) => {
      const qty = info.getValue() || "0";
      const unit = info.row.original.units || "";
      return <span className="font-semibold text-gray-800 dark:text-dark-50">{`${qty} ${unit}`.trim()}</span>;
    },
  }),
];
