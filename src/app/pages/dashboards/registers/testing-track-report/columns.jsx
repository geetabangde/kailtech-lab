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
    header: "S.No(Trf)",
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
  columnHelper.accessor("is_code", {
    id: "is_code",
    header: "IS Code",
    cell: (info) => (
      <div className="max-w-[250px] whitespace-normal break-words leading-tight">
        {safeRender(info.getValue())}
      </div>
    ),
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
  columnHelper.accessor("qr_code", {
    id: "qr_code",
    header: "QR Code",
    cell: (info) => safeRender(info.getValue()),
  }),
  columnHelper.accessor("sample_code", {
    id: "sample_code",
    header: "Sample Code",
    cell: (info) => safeRender(info.getValue()),
  }),
  columnHelper.accessor("civil_code", {
    id: "civil_code",
    header: "Civil Code",
    cell: (info) => safeRender(info.getValue()),
  }),
  columnHelper.accessor("pvc_code", {
    id: "pvc_code",
    header: "PVC Code",
    cell: (info) => safeRender(info.getValue()),
  }),
  columnHelper.accessor("mech_code", {
    id: "mech_code",
    header: "Mech Code",
    cell: (info) => safeRender(info.getValue()),
  }),
 
  columnHelper.accessor("chem_code", {
    id: "chem_code",
    header: "Chem Code",
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
  columnHelper.accessor("long_term_test", {
    id: "long_term_test",
    header: "Long Term Test(Yes/No)",
    cell: (info) => safeRender(info.getValue()),
  }),
  columnHelper.accessor("tentative_report_date_interim", {
    id: "tentative_report_date_interim",
    header: "Tentative Report Date (INTERIM)",
    cell: (info) => safeRender(info.getValue()),
  }),
  columnHelper.accessor("tentative_report_date_longterm", {
    id: "tentative_report_date_longterm",
    header: "Tentative Report Date (LONGTERM)",
    cell: (info) => safeRender(info.getValue()),
  }),
  columnHelper.accessor("tentative_report_date", {
    id: "tentative_report_date",
    header: "Tentative Report Date",
    cell: (info) => safeRender(info.getValue()),
  }),
  columnHelper.accessor("interim_issued_date", {
    id: "interim_issued_date",
    header: "Interim Issued Date",
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
