// Import Dependencies
import { createColumnHelper } from "@tanstack/react-table";

const columnHelper = createColumnHelper();

const formatDate = (val) => {
  if (!val) return "-";
  const strVal = String(val);
  if (strVal === "0000-00-00" || strVal.includes("-0001") || strVal.includes("0000")) return "-";
  try {
    const date = new Date(strVal);
    if (isNaN(date.getTime())) return strVal;
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear());
    return `${day}-${month}-${year}`;
  } catch {
    return strVal;
  }
};

export const columns = [
  columnHelper.accessor("sr_no", {
    id: "sr_no",
    header: "Sr. No",
    cell: (info) => info.getValue() ?? "-",
  }),
  columnHelper.accessor("name", {
    id: "name",
    header: "Name of Equipment",
    cell: (info) => info.getValue() ?? "-",
  }),
  columnHelper.accessor("equipment_id", {
    id: "equipment_id",
    header: "Equipment Id",
    cell: (info) => info.getValue() ?? "-",
  }),
  columnHelper.accessor("frequency", {
    id: "frequency",
    header: "Frequency",
    cell: (info) => info.getValue() ?? "-",
  }),
  columnHelper.accessor("last_calibration_date", {
    id: "last_calibration_date",
    header: "Last Calibration Date",
    cell: (info) => formatDate(info.getValue()),
  }),
  columnHelper.accessor("next_calibration_date", {
    id: "next_calibration_date",
    header: "Next Calibration Date",
    cell: (info) => formatDate(info.getValue()),
  }),
  // Month columns for the year grouped under a single "Month" header
  columnHelper.group({
    id: "month",
    header: "Month",
    columns: [
      columnHelper.accessor("jan", {
        id: "jan",
        header: "Jan",
        cell: (info) => info.getValue() ?? "-",
      }),
      columnHelper.accessor("feb", {
        id: "feb",
        header: "Feb",
        cell: (info) => info.getValue() ?? "-",
      }),
      columnHelper.accessor("mar", {
        id: "mar",
        header: "Mar",
        cell: (info) => info.getValue() ?? "-",
      }),
      columnHelper.accessor("apr", {
        id: "apr",
        header: "Apr",
        cell: (info) => info.getValue() ?? "-",
      }),
      columnHelper.accessor("may", {
        id: "may",
        header: "May",
        cell: (info) => info.getValue() ?? "-",
      }),
      columnHelper.accessor("jun", {
        id: "jun",
        header: "Jun",
        cell: (info) => info.getValue() ?? "-",
      }),
      columnHelper.accessor("jul", {
        id: "jul",
        header: "Jul",
        cell: (info) => info.getValue() ?? "-",
      }),
      columnHelper.accessor("aug", {
        id: "aug",
        header: "Aug",
        cell: (info) => info.getValue() ?? "-",
      }),
      columnHelper.accessor("sep", {
        id: "sep",
        header: "Sep",
        cell: (info) => info.getValue() ?? "-",
      }),
      columnHelper.accessor("oct", {
        id: "oct",
        header: "Oct",
        cell: (info) => info.getValue() ?? "-",
      }),
      columnHelper.accessor("nov", {
        id: "nov",
        header: "Nov",
        cell: (info) => info.getValue() ?? "-",
      }),
      columnHelper.accessor("dec", {
        id: "dec",
        header: "Dec",
        cell: (info) => info.getValue() ?? "-",
      }),
    ],
  }),
];
