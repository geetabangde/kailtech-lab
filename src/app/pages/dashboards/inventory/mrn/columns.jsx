import { createColumnHelper } from "@tanstack/react-table";
import dayjs from "dayjs";
import { RowActions } from "./RowActions";

const columnHelper = createColumnHelper();

export const columns = [
  columnHelper.accessor((row, index) => index + 1, {
    id: "sn",
    header: "S.N.",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("customername", {
    header: "Vendor / Customer Name",
    cell: (info) => {
      const val = info.getValue();
      if (!val) return "—";
      return (
        <div className="whitespace-normal break-words max-w-[250px] font-medium text-gray-900 dark:text-dark-50">
          {val}
        </div>
      );
    },
  }),
  columnHelper.accessor("concernpersonname", {
    header: "Concern Person Detail",
    cell: (info) => {
      const { concernpersonname, concernpersonemail, concernpersonmobile } = info.row.original;
      return (
        <div className="flex flex-col text-xs space-y-0.5 whitespace-normal break-words max-w-[250px] font-medium">
          <span className="font-medium text-gray-900 dark:text-dark-50">{concernpersonname}</span>
          <span className="text-gray-500">{concernpersonemail}</span>
          <span className="text-gray-500">{concernpersonmobile}</span>
        </div>
      );
    },
  }),
  columnHelper.accessor("challanno", {
    header: "Challan No",
    cell: (info) => info.getValue() || "—",
  }),
  columnHelper.accessor("challandate", {
    header: "Challan Date",
    cell: (info) => {
      const date = info.getValue();
      if (!date) return "—";
      try {
        // Handle format YYYY-MM-DD from PHP
        return dayjs(date).format("DD/MM/YYYY");
      } catch {
        return date;
      }
    },
  }),
  columnHelper.accessor("ponumber", {
    header: "PO Number",
    cell: (info) => info.getValue() || "—",
  }),
  columnHelper.display({
    id: "actions",
    header: "Action",
    cell: (info) => <RowActions row={info.row} />,
  }),
];
