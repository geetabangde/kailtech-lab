// Import Dependencies
import { createColumnHelper } from "@tanstack/react-table";

const columnHelper = createColumnHelper();

const safeRender = (val) => {
  if (val === undefined || val === null || val === "" || val === "0000-00-00 00:00:00" || val === "0000-00-00") return "-";
  if (typeof val === "string" && (val.includes("<div") || val.includes("<br"))) {
    return <div dangerouslySetInnerHTML={{ __html: val }} />;
  }
  return val;
};

export const columns = [
  columnHelper.accessor("sr_no", {
    id: "sr_no",
    header: "S.No(Inward)",
    cell: (info) => (
      <div className="flex items-center gap-2">
        {info.row.getCanExpand() && (
          <button
            onClick={info.row.getToggleExpandedHandler()}
            className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full text-white cursor-pointer shadow-sm transition-colors"
            style={{
              backgroundColor: info.row.getIsExpanded() ? "#ef4444" : "#22c55e",
            }}
          >
            <span className="text-sm font-bold leading-none" style={{ marginTop: "-2px" }}>
              {info.row.getIsExpanded() ? "-" : "+"}
            </span>
          </button>
        )}
        <span>{safeRender(info.getValue())}</span>
      </div>
    ),
  }),
  columnHelper.accessor("booking_date", {
    id: "booking_date",
    header: "Booking Date",
    cell: (info) => safeRender(info.getValue()),
  }),
  columnHelper.accessor("client_name", {
    id: "client_name",
    header: "Client Name",
    cell: (info) => safeRender(info.getValue()),
  }),
  columnHelper.accessor("rep", {
    id: "rep",
    header: "Rep",
    cell: (info) => safeRender(info.getValue()),
  }),
  columnHelper.accessor("concerned_bd", {
    id: "concerned_bd",
    header: "Concerned BD",
    cell: (info) => safeRender(info.getValue()),
  }),
  columnHelper.accessor("brn_no", {
    id: "brn_no",
    header: "BRN No.",
    cell: (info) => safeRender(info.getValue()),
  }),
  columnHelper.accessor("lrn_no", {
    id: "lrn_no",
    header: "LRN No.",
    cell: (info) => safeRender(info.getValue()),
  }),
  columnHelper.accessor("sample", {
    id: "sample",
    header: "Sample",
    cell: (info) => safeRender(info.getValue()),
  }),
  columnHelper.accessor("department", {
    id: "department",
    header: "Department",
    cell: (info) => safeRender(info.getValue()),
  }),
  columnHelper.accessor("tat", {
    id: "tat",
    header: "TAT",
    cell: (info) => safeRender(info.getValue()),
  }),
  columnHelper.accessor("hod_chemist_engineer", {
    id: "hod_chemist_engineer",
    header: "HOD/Chemist/Engineer",
    cell: (info) => safeRender(info.getValue()),
  }),
  columnHelper.accessor("final_report_date", {
    id: "final_report_date",
    header: "Final Report Date",
    cell: (info) => safeRender(info.getValue()),
  }),
  columnHelper.accessor("ulr_no", {
    id: "ulr_no",
    header: "ULR No",
    cell: (info) => safeRender(info.getValue()),
  }),
  columnHelper.accessor("ulr_generate_date", {
    id: "ulr_generate_date",
    header: "ULR Generate Date",
    cell: (info) => safeRender(info.getValue()),
  }),
  columnHelper.accessor("approved_date", {
    id: "approved_date",
    header: "Approved Date",
    cell: (info) => safeRender(info.getValue()),
  }),
  columnHelper.accessor("bill_no", {
    id: "bill_no",
    header: "Bill No.",
    cell: (info) => safeRender(info.getValue()),
  }),
  columnHelper.accessor("bill_date", {
    id: "bill_date",
    header: "Bill Date",
    cell: (info) => safeRender(info.getValue()),
  }),
  columnHelper.accessor("dispatch", {
    id: "dispatch",
    header: "Dispatch",
    cell: (info) => safeRender(info.getValue()),
  }),
  columnHelper.accessor("dispatch_date", {
    id: "dispatch_date",
    header: "Dispatch Date",
    cell: (info) => safeRender(info.getValue()),
  }),
];
