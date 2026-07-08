// Import Dependencies
import { createColumnHelper } from "@tanstack/react-table";
import { Link } from "react-router-dom";

const columnHelper = createColumnHelper();

const safeRender = (val) => {
  if (val === undefined || val === null || val === "" || val === "0000-00-00 00:00:00" || val === "0000-00-00") return "-";
  if (typeof val === "string" && (val.includes("<div") || val.includes("<br"))) {
    return <div dangerouslySetInnerHTML={{ __html: val }} />;
  }
  return val;
};

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
  columnHelper.accessor("sno", {
    id: "sno",
    header: "Sr. No",
    cell: (info) => safeRender(info.getValue()),
  }),
  columnHelper.accessor("name", {
    id: "name",
    header: "Name of Equipment",
    cell: (info) => safeRender(info.getValue()),
  }),
  columnHelper.accessor("equipment_id", {
    id: "equipment_id",
    header: "Equipment Id",
    cell: (info) => safeRender(info.getValue()),
  }),
  columnHelper.accessor("make", {
    id: "make",
    header: "Make",
    cell: (info) => safeRender(info.getValue()),
  }),
  columnHelper.accessor("year_of_make", {
    id: "year_of_make",
    header: "Year Of Make",
    cell: (info) => safeRender(info.getValue()),
  }),
  columnHelper.accessor("model", {
    id: "model",
    header: "Model",
    cell: (info) => safeRender(info.getValue()),
  }),
  columnHelper.accessor("serial_no", {
    id: "serial_no",
    header: "Serial no",
    cell: (info) => safeRender(info.getValue()),
  }),
  columnHelper.accessor("range", {
    id: "range",
    header: "Range",
    cell: (info) => safeRender(info.getValue()),
  }),
  columnHelper.accessor("accuracy", {
    id: "accuracy",
    header: "Accuracy",
    cell: (info) => safeRender(info.getValue()),
  }),
  columnHelper.accessor("least_count", {
    id: "least_count",
    header: "Least count",
    cell: (info) => safeRender(info.getValue()),
  }),
  columnHelper.accessor("last_calibration_date", {
    id: "last_calibration_date",
    header: "Last Calibration Date",
    cell: (info) => formatDate(info.getValue()),
  }),
  columnHelper.accessor("calibration_due_date", {
    id: "calibration_due_date",
    header: "Calibration Due Date",
    cell: (info) => formatDate(info.getValue()),
  }),
  columnHelper.accessor("calibrated_by", {
    id: "calibrated_by",
    header: "Calibrated by",
    cell: (info) => safeRender(info.getValue()),
  }),
  columnHelper.display({
    id: "actions",
    header: "Action",
    cell: ({ row }) => (
      <div className="flex gap-2">
        <Link
          to={`/dashboards/material-list/environment/view-equipment-history/${row.original.id}?labId=${row.original.labId || ""}`}
          className="inline-flex items-center justify-center px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold transition-colors shadow-xs"
        >
          View Equipment History
        </Link>
        <Link
          to={`/dashboards/material-list/environment/log-book/${row.original.id}?labId=${row.original.labId || ""}`}
          className="inline-flex items-center justify-center px-3 py-1 bg-cyan-500 hover:bg-cyan-600 text-white rounded text-xs font-semibold transition-colors shadow-xs"
        >
          Log Book
        </Link>
      </div>
    ),
  }),
];
