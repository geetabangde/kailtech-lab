// Import Dependencies
import { createColumnHelper } from "@tanstack/react-table";

const columnHelper = createColumnHelper();

const formatDate = (val) => {
  if (!val || val === "0000-00-00") return "-";
  try {
    const date = new Date(val);
    if (isNaN(date.getTime())) return val;
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear());
    return `${day}-${month}-${year}`;
  } catch {
    return val;
  }
};

export const columns = [
  columnHelper.accessor((row, index) => index + 1, {
    id: "sr_no",
    header: "Sr No",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("lrn", {
    id: "lrn",
    header: "LRN",
    cell: (info) => info.getValue() ?? "-",
  }),
  columnHelper.accessor("assigned_person", {
    id: "assigned_person",
    header: "Assigned Person",
    cell: (info) => info.getValue() ?? "-",
  }),
  columnHelper.accessor("assign_date", {
    id: "assign_date",
    header: "Assign Date",
    cell: (info) => formatDate(info.getValue()),
  }),
  columnHelper.accessor("start_date", {
    id: "start_date",
    header: "Start Date",
    cell: (info) => formatDate(info.getValue()),
  }),
  columnHelper.accessor("end_date", {
    id: "end_date",
    header: "End Date",
    cell: (info) => formatDate(info.getValue()),
  }),
  columnHelper.accessor("performance_timing", {
    id: "performance_timing",
    header: "Performance Timing",
    cell: (info) => {
      const val = info.getValue();
      if (!val) return "-";
      if (typeof val === "string" && val.includes("<div")) {
        return <div dangerouslySetInnerHTML={{ __html: val }} />;
      }
      return val;
    },
  }),
  columnHelper.accessor("performance_timing_assigned", {
    id: "performance_timing_assigned",
    header: () => {
      return (
        <div>
          Performance Timing on <br /> the base of Assigned date
        </div>
      );
    },
    cell: (info) => {
      const val = info.getValue();
      if (!val) return "-";
      if (typeof val === "string" && val.includes("<div")) {
        return <div dangerouslySetInnerHTML={{ __html: val }} />;
      }
      return val;
    },
  }),
  columnHelper.accessor("tat", {
    id: "tat",
    header: "TAT",
    cell: (info) => info.getValue() ?? "-",
  }),
];
