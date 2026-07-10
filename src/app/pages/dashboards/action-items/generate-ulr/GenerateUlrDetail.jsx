// GenerateUlrDetail.jsx
// PHP equivalent  : ulrrequest.php + testreport.php  (status=9)
// Route           : /dashboards/action-items/GenerateUlrDetail/:id?hid=
//
// APIs:
//   GET  /actionitem/view-test-report?tid=&hid=         → full report data
//   GET  /actionitem/get-generate-ulr-data?id=&hid=     → signatories, payment, nabl
//   POST /actionitem/generate-ulr                        → { hid, signatories:[id,id], idater:"DD-MM-YYYY" }
//   GET  /actionitem/request-reset/{id}                 → re-test
//
// POST payload (from Postman):
//   hid          → hodrequests.id
//   signatories  → [31, 34]  (array of IDs)
//   idater       → "13-02-2026"  (DD-MM-YYYY format)
//
// get-generate-ulr-data response fields:
//   product, package, button_label, has_pending_parameters
//   paymentpass, pass2, pending_request_count
//   can_generate_button, show_date_field
//   signatories → [{ id, name }]

import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import PropTypes from "prop-types";
import Select from "react-select";
import axios from "utils/axios";
import { toast } from "sonner";
import clsx from "clsx";
import { Page } from "components/shared/Page";
import {
  PrintWithLHButton,
  PrintWithoutLHTwoSignButton,
} from "./TestReportPdf";
import { PrintExportTestingReportWOLHButton } from "../signed-reports/ExportTestingReportWOLH";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function fmtDate(d) {
  if (!d) return "—";
  try {
    return new Date(d)
      .toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" })
      .replace(/\//g, ".");
  } catch { return d; }
}

// Convert JS date input (YYYY-MM-DD) → API format (DD-MM-YYYY)
function toApiDate(dateStr) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return `${d}-${m}-${y}`;
}

function parseComplianceStyle(styleStr) {
  if (!styleStr) return {};
  const result = {};
  styleStr.split(";").forEach((part) => {
    const idx = part.indexOf(":");
    if (idx === -1) return;
    const prop = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim().replace("!important", "").trim();
    if (!prop || !val) return;
    const camel = prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    result[camel] = val;
  });
  return result;
}

// react-select custom styles
const selectStyles = {
  control: (base, state) => ({
    ...base,
    minHeight: "38px",
    borderRadius: "0.5rem",
    borderColor: state.isFocused ? "#3b82f6" : "#d1d5db",
    boxShadow: state.isFocused ? "0 0 0 2px rgba(59,130,246,0.2)" : "none",
    "&:hover": { borderColor: "#3b82f6" },
    fontSize: "0.813rem",
  }),
  multiValue: (base) => ({
    ...base,
    backgroundColor: "#2563eb",
    borderRadius: "0.375rem",
  }),
  multiValueLabel: (base) => ({
    ...base,
    color: "#ffffff",
    fontSize: "0.75rem",
    fontWeight: 600,
    padding: "2px 6px",
  }),
  multiValueRemove: (base) => ({
    ...base,
    color: "#ffffff",
    "&:hover": { backgroundColor: "#1d4ed8", color: "#fff" },
  }),
  menu: (base) => ({ ...base, borderRadius: "0.5rem", fontSize: "0.813rem", zIndex: 50 }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected ? "#2563eb" : state.isFocused ? "#eff6ff" : "white",
    color: state.isSelected ? "#fff" : "#374151",
    cursor: "pointer",
  }),
  placeholder: (base) => ({ ...base, color: "#9ca3af", fontSize: "0.813rem" }),
};

// ─────────────────────────────────────────────────────────────────────────────
// Re-test Button
// ─────────────────────────────────────────────────────────────────────────────
function ReTestButton({ testEventId, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const handle = useCallback(async () => {
    setLoading(true);
    try {
      await axios.get(`/actionitem/request-reset/${testEventId}`);
      toast.success("Re-test requested ✅");
      onSuccess?.();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Failed ❌");
    } finally { setLoading(false); }
  }, [testEventId, onSuccess]);

  return (
    <button
      onClick={handle}
      disabled={loading}
      className={clsx(
        "rounded bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700",
        loading && "opacity-60 cursor-not-allowed"
      )}
    >
      {loading ? "..." : "Request Re-test"}
    </button>
  );
}
ReTestButton.propTypes = { testEventId: PropTypes.any, onSuccess: PropTypes.func };

// ─────────────────────────────────────────────────────────────────────────────
// Info Row
// ─────────────────────────────────────────────────────────────────────────────
function InfoRow({ label, value }) {
  return (
    <tr className="border-b border-gray-200 dark:border-gray-700">
      <td className="p-2 text-xs font-semibold text-gray-600 dark:text-gray-400 whitespace-nowrap border-r border-gray-200 dark:border-gray-700">
        {label}
      </td>
      <td className="p-2 text-xs text-gray-800 dark:text-gray-200">{value ?? "—"}</td>
    </tr>
  );
}
InfoRow.propTypes = { label: PropTypes.string, value: PropTypes.any };

// ─────────────────────────────────────────────────────────────────────────────
// Generate ULR Form — bottom of report
// POST /actionitem/generate-ulr
// Payload: { hid, signatories: [id, id], idater: "DD-MM-YYYY" }
// ─────────────────────────────────────────────────────────────────────────────
function GenerateUlrForm({ tid, hid, trfId, formData, onSuccess }) {
  const {
    product = "—",
    package: packageName = "—",
    button_label = "Generate ULR",
    has_pending_parameters = false,
    paymentpass = true,
    pass2 = true,
    pending_request_count = 0,
    can_generate_button = true,
    show_date_field = false,
    signatories: sigList = [],   // [{ id, name }]
  } = formData;

  const [selected, setSelected] = useState([]);  // react-select [{value,label}]
  const [reportDate, setReportDate] = useState("");   // YYYY-MM-DD from input
  const [submitting, setSubmitting] = useState(false);
  const [notifying, setNotifying] = useState(false);

  // Convert signatories → react-select options
  const options = sigList.map((s) => ({ value: s.id, label: s.name }));

  const handleSelectChange = (opts) => {
    if (!opts) { setSelected([]); return; }
    if (opts.length > 2) {
      toast.warning("Max 2 signatories allowed.");
      return;
    }
    setSelected(opts);
  };

  const handleNotifyBd = async () => {
    if (!trfId) {
      toast.error("TRF ID missing. Cannot notify BD.");
      return;
    }
    setNotifying(true);
    try {
      await axios.post("/actionitem/request-payment-approval", { trf: trfId });
      toast.success("Payment approval request submitted to BD ✅");
      onSuccess?.();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Failed to submit request ❌");
    } finally {
      setNotifying(false);
    }
  };

  // POST payload matches Postman: { hid, signatories:[id,id], idater:"DD-MM-YYYY" }
  const handleSubmit = async () => {
    if (!selected.length) { toast.error("Please select at least one signatory."); return; }
    if (show_date_field && !reportDate) { toast.error("Please select a date."); return; }
    setSubmitting(true);
    try {
      const payload = {
        tid,
        hid,
        signatories: selected.map((s) => s.value),
        ...(show_date_field && reportDate ? { idater: toApiDate(reportDate) } : {}),
      };
      await axios.post("/actionitem/generate-ulr", payload);
      toast.success(
        button_label === "Generate ULR"
          ? "ULR Generated Successfully ✅"
          : "Report Completed Successfully ✅"
      );
      onSuccess?.();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Submission failed ❌");
    } finally { setSubmitting(false); }
  };

  return (
    <div className="mt-6 rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-dark-800 p-5 space-y-5">

      {/* Product + Package */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-0.5">Product</p>
          <p className="text-sm text-gray-800 dark:text-gray-200">{product}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-0.5">Package</p>
          <p className="text-sm text-gray-800 dark:text-gray-200">{packageName}</p>
        </div>
      </div>

      {/* PHP: if ($parameter) partial results warning */}
      {has_pending_parameters && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 dark:bg-red-900/20">
          ⚠️ Are you sure to do ULR for Partial Reports only?
        </div>
      )}

      {/* PHP: if ($paymentpass) → form, else → payment messages */}
      {paymentpass ? (
        <>
          {/* Signatory — react-select searchable multi (max 2) */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Select Reviewed &amp; Authorised By Signatory
              <span className="ml-1 text-xs font-normal text-gray-400">(max 2)</span>
            </label>
            <Select
              isMulti
              options={options}
              value={selected}
              onChange={handleSelectChange}
              placeholder="Search and select signatory..."
              styles={selectStyles}
              closeMenuOnSelect={false}
              isOptionDisabled={() => selected.length >= 2}
              noOptionsMessage={() => "No signatory found"}
            />
            {selected.length > 0 && (
              <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                Selected ({selected.length}/2):&nbsp;
                {selected.map((s) => s.label).join(", ")}
              </p>
            )}
          </div>

          {/* PHP: if (in_array(462, $permissions)) → show_date_field */}
          {show_date_field && (
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-400">
                Select Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={reportDate}
                min="2022-12-30"
                onChange={(e) => setReportDate(e.target.value)}
                className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
              />
            </div>
          )}

          {/* PHP: if (in_array(137, $permissions)) → can_generate_button */}
          {can_generate_button && (
            <div className="flex items-center justify-between pt-1">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {button_label}
              </p>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className={clsx(
                  "rounded-lg bg-green-600 px-8 py-3 text-sm font-semibold text-white shadow transition hover:bg-green-700",
                  submitting && "opacity-60 cursor-not-allowed"
                )}
              >
                {submitting ? "Processing..." : button_label}
              </button>
            </div>
          )}
        </>
      ) : (
        /* PHP: $paymentpass = false */
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-900/20">
          {!pass2 ? (
            <p className="text-sm font-semibold text-amber-700">Pending Form Payment</p>
          ) : pending_request_count >= 1 ? (
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-amber-700">Payment Approval Request Pending</p>
              <span className="text-xs text-amber-600 italic">Awaiting response from BD</span>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-amber-700">
                Payment approval is required before {button_label === "Generate ULR" ? "generating ULR" : "completing report"}.
              </p>
              <button
                onClick={handleNotifyBd}
                disabled={notifying}
                className={clsx(
                  "inline-flex w-fit items-center justify-center rounded-lg bg-amber-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-600 active:bg-amber-700 transition-colors",
                  notifying && "opacity-70 cursor-not-allowed"
                )}
              >
                {notifying ? "Submitting..." : "Notify BD For Payment Approval"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
GenerateUlrForm.propTypes = {
  tid: PropTypes.any,
  hid: PropTypes.any,
  trfId: PropTypes.any,
  formData: PropTypes.object,
  onSuccess: PropTypes.func,
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────
export default function GenerateUlrDetail() {
  const { id: tid } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const hid = searchParams.get("hid") ?? "";

  const [report, setReport] = useState(null);
  const [formData, setFormData] = useState(null);
  const [reportAddr, setReportAddr] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch both APIs in parallel
  const fetchReport = useCallback(async () => {
    if (!tid) return;
    setLoading(true);
    setError(null);
    try {
      const reportParams = new URLSearchParams({ tid });
      if (hid) reportParams.append("hid", hid);

      const formParams = new URLSearchParams({ id: tid });
      if (hid) formParams.append("hid", hid);

      const [reportRes, formRes] = await Promise.all([
        axios.get(`/actionitem/view-test-report?${reportParams}`),
        axios.get(`/actionitem/get-generate-ulr-data?${formParams}`),
      ]);

      const rData = reportRes.data?.data ?? reportRes.data ?? null;
      setReport(rData);
      setFormData(formRes.data?.data ?? formRes.data ?? null);

      // Fetch reporting address if needed
      const custId = rData?.customer?.id;
      const rAddrId = rData?.trf?.reportaddress;
      if (custId && rAddrId) {
        try {
          const addrRes = await axios.get(`/people/get-customers-address/${custId}`);
          const addrList = addrRes.data?.data ?? [];
          const found = addrList.find((a) => String(a.id) === String(rAddrId));
          if (found) {
            setReportAddr([found.address, found.city, found.pincode].filter(Boolean).join(", "));
          }
        } catch (e) {
          console.error("Failed to fetch reporting address:", e);
        }
      }
    } catch (err) {
      setError(err?.response?.data?.message ?? "Failed to load report.");
    } finally {
      setLoading(false);
    }
  }, [tid, hid]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  // Loading
  if (loading) return (
    <Page title="Generate ULR">
      <div className="flex h-[60vh] items-center justify-center gap-3 text-gray-500">
        <svg className="h-5 w-5 animate-spin text-blue-600" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z" />
        </svg>
        Loading Report...
      </div>
    </Page>
  );

  // Error
  if (error) return (
    <Page title="Generate ULR">
      <div className="flex h-60 flex-col items-center justify-center gap-4 rounded-xl border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
        <p className="text-sm text-red-500">{error}</p>
        <button
          onClick={() => navigate(-1)}
          className="rounded bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200"
        >
          ← Go Back
        </button>
      </div>
    </Page>
  );

  if (!report) return null;

  // Destructure view-test-report response
  const {
    trf_product: trf_product = {},
    nabl: nablObj = {},
    size,
    grade,
    batchno,
    report_status: rsObj = {},
    dates = {},
    customer = {},
    product = {},
    trf = {},
    received_items = [],
    test_results = [],
    remarks: remarksObj = {},
    signatories = [],
    counts = {},
    permissions: permsObj = {},
    available_actions = [],
    meta = {},
  } = report;

  const { brn, ulr, condition_name, sealed_name, reportdate } = trf_product;

  const nablStatus = nablObj?.status ?? 0;
  const reportStatus = typeof rsObj === "object" ? (rsObj?.code ?? 0) : (Number(rsObj) || 0);
  const { start_date, end_date } = dates;

  const hodRemark = remarksObj?.hod_remark ?? "";
  const witnessVal = remarksObj?.witness ?? "";
  const witnessDetail = remarksObj?.witness_detail ?? "";
  const bdlRemark = remarksObj?.bdl_remark ?? "";
  const adlRemark = remarksObj?.adl_remark ?? "";

  const canHod = permsObj?.has_hod_permission === true;
  const canQa = permsObj?.has_qa_permission === true;
  const showActionsColumn = (canHod || canQa) && reportStatus < 9;

  const showRetest = (row) =>
    showActionsColumn && (
      row.can_retest === true ||
      permsObj?.can_view_actions === true ||
      available_actions.some((a) => (typeof a === "object" ? a.id : a) === row.id)
    );

  const hasSpecs = Number(trf_product?.specification_flag) === 2 ? false : (Number(trf_product?.specification_flag) === 1 || Number(trf_product?.specification) === 1 || test_results.some((r) => r.specification && r.specification !== "-" && r.specification !== "—"));

  const nablLogo =
    nablStatus === 1 ? (nablObj?.logo ?? "/images/nabl2348.png") :
      nablStatus === 3 ? "/images/qai.jpeg" : null;

  const qtyStr = received_items
    .filter((q) => (q.received ?? 0) > 0)
    .map((q) => {
      const name = q.quantity_name ?? "";
      if (name.toUpperCase().trim() === "NA") return "NA";
      return `${q.received} ${q.unit_name ?? ""}`.trim();
    })
    .join(", ") || "—";

  const remarkLines = [];
  if (hodRemark?.trim()) remarkLines.push(hodRemark.trim());
  if (witnessVal === "1" && witnessDetail) remarkLines.push(`The test was witnessed by ${witnessDetail}`);
  if (bdlRemark) remarkLines.push(bdlRemark);
  if (adlRemark) remarkLines.push(adlRemark);

  const leftCount = counts?.left_count ?? counts?.pending_tests ?? 0;
  const doneCount = counts?.done_count ?? 0;
  const paramCount = counts?.param_count ?? 0;

  const customerName = customer?.name ?? "—";
  const customerAddress = reportAddr || customer?.address || customer?.address_text || "—";
  const contactPerson = customer?.contact_person ?? "";
  const showContact = Number(trf?.specificpurpose ?? customer?.specific_purpose) === 2;
  const customerRef = customer?.letterrefno ?? "";
  const productName = product?.name ?? "—";
  const productDesc = product?.description ?? size ?? "—";
  const displayLRN = trf_product?.lrn ?? brn ?? "—";
  const ktrcRef = meta?.ktrc_ref ?? "KTRC/QF/0708/01";
  const batchnoClean = (batchno ?? "").replace(/<br\s*\/?>/gi, " ").trim();

  return (
    <Page title={`REPORT-${ulr ?? ""}`}>
      <div className="transition-content px-[var(--margin-x)] pb-8">

        {/* Page Header */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/dashboards/action-items/generate-ulr")}
              className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
              </svg>
              Back to ULR Requests
            </button>
            <h1 className="text-base font-semibold text-gray-800 dark:text-gray-100">Final Report</h1>
          </div>

          {/* Print buttons */}
          <div className="flex items-center gap-2 no-print">
            {report && (
              <>
                <PrintWithLHButton report={report} />
                <PrintExportTestingReportWOLHButton report={report} />
                <PrintWithoutLHTwoSignButton report={report} />
              </>
            )}
          </div>
        </div>

        {/* Report Card */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-dark-800">
          <div className="px-6 py-6">

            {/* NABL / QAI logo */}
            {nablLogo && (
              <div className="mb-3 flex justify-center">
                <img src={nablLogo} alt="Accreditation Logo" className="h-16 w-auto" />
              </div>
            )}

            <h1 className="mb-4 text-center text-xl font-bold underline tracking-wide text-gray-900 dark:text-gray-100">
              TEST REPORT
            </h1>

            <div className="mb-4 flex justify-between text-xs font-semibold text-gray-700 dark:text-gray-300">
              <span>{nablStatus === 1 && ulr ? `ULR: ${ulr}` : "ULR:"}</span>
              <span>{ktrcRef}</span>
            </div>

            {/* Customer Info Table */}
            <div className="mb-4 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
              <table className="w-full text-xs">
                <tbody>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <td className="w-2/5 align-top p-3 border-r border-gray-200 dark:border-gray-700" rowSpan={8}>
                      <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">
                        Name and Address of Customer
                      </p>
                      <p className="text-gray-800 dark:text-gray-200">{customerName}</p>
                      <p className="text-gray-600 dark:text-gray-400">{customerAddress}</p>
                      {showContact && contactPerson && (
                        <p className="mt-1 text-gray-700 dark:text-gray-300">
                          Contact Person: {contactPerson}
                        </p>
                      )}
                    </td>
                    <td className="p-2 font-semibold text-gray-600 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700 w-1/4">
                      Laboratory Reference Number (LRN)
                    </td>
                    <td className="p-2 text-gray-800 dark:text-gray-200">{displayLRN}</td>
                  </tr>
                  <InfoRow label="Date of Receipt" value={fmtDate(trf?.date ?? dates?.receipt_date)} />
                  <InfoRow label="Condition, When Received" value={condition_name ?? "—"} />
                  <InfoRow label="Packing, When Received" value={sealed_name ?? "—"} />
                  <InfoRow label="Quantity Received (Approx.)" value={qtyStr} />
                  <InfoRow label="Date of Start Of Test" value={fmtDate(start_date)} />
                  <InfoRow label="Date of Completion" value={fmtDate(end_date)} />
                  <InfoRow label="Date of Reporting" value={fmtDate(reportdate ?? dates?.report_date)} />
                </tbody>
                <tbody>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <td colSpan={3} className="p-2 text-gray-700 dark:text-gray-300">
                      Sample Identification: {productDesc}
                    </td>
                  </tr>
                  {customerRef && customerRef !== "-" && (
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <td colSpan={3} className="p-2 text-gray-700 dark:text-gray-300">
                        Customer Reference: {customerRef}
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td colSpan={3} className="p-2 text-gray-700 dark:text-gray-300">
                      Sample Particulars: {productName} Grade: {grade} {batchnoClean}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* TEST RESULTS */}
            <div className="mb-4">
              <h3 className="mb-2 text-sm font-bold text-gray-800 dark:text-gray-100">TEST RESULTS</h3>
              <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="w-full text-xs">
                  <thead className="bg-gray-100 dark:bg-dark-700">
                    <tr>
                      {["S.NO", "PARAMETER", "UNIT", "RESULTS", "TEST METHOD"].map((h) => (
                        <th key={h} className="border-b border-gray-200 dark:border-gray-700 px-3 py-2 text-center font-semibold text-gray-700 dark:text-gray-300">
                          {h}
                        </th>
                      ))}
                      {hasSpecs && (
                        <th className="border-b border-gray-200 dark:border-gray-700 px-3 py-2 text-center font-semibold text-gray-700 dark:text-gray-300">
                          SPECIFICATIONS
                        </th>
                      )}
                      {showActionsColumn && (
                        <th className="border-b border-gray-200 dark:border-gray-700 px-3 py-2 text-center font-semibold text-gray-700 dark:text-gray-300 no-print">
                          Actions
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {test_results.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-xs text-gray-400">
                          No test results found.
                        </td>
                      </tr>
                    ) : (
                      test_results.map((row, idx) => {
                        const cellStyle = parseComplianceStyle(row.compliance_style);
                        const displayResult = row.result?.display_value ?? row.result?.value ?? "—";
                        const unitDisplay = row.unit?.description ?? row.unit?.name ?? "—";
                        const methodName = row.method?.name ?? "—";
                        return (
                          <tr key={row.id ?? idx} className="border-b border-gray-100 dark:border-gray-700 last:border-0">
                            <td className="px-3 py-2 text-center text-gray-700 dark:text-gray-300">{row.sno ?? idx + 1}</td>
                            <td className="px-3 py-2 text-gray-800 dark:text-gray-200">{row.parameter_name}</td>
                            <td className="px-3 py-2 text-center text-gray-700 dark:text-gray-300">{unitDisplay}</td>
                            <td className="px-3 py-2" style={cellStyle}>{displayResult}</td>
                            <td className="px-3 py-2 text-center text-gray-700 dark:text-gray-300">{methodName}</td>
                            {hasSpecs && (
                              <td className="px-3 py-2 text-center text-gray-700 dark:text-gray-300">{row.specification ?? "—"}</td>
                            )}
                            {showActionsColumn && (
                              <td className="px-3 py-2 text-center no-print">
                                {showRetest(row) && (
                                  <ReTestButton testEventId={row.id} onSuccess={fetchReport} />
                                )}
                              </td>
                            )}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Remarks */}
            {remarkLines.length > 0 && (
              <div className="mb-4 rounded-lg bg-gray-50 dark:bg-dark-700 px-4 py-3 text-xs text-gray-700 dark:text-gray-300">
                <strong>Remark: </strong>
                {remarkLines.map((line, i) => (
                  <span key={i}>{i > 0 && <br />}{line}</span>
                ))}
              </div>
            )}

            {String(tid) !== "1356" && (
              <div className="mb-6 text-center text-xs font-semibold text-gray-700 dark:text-gray-300">
                **End of Report**
              </div>
            )}

            {/* Signatories */}
            {signatories.length > 0 && (
              <div className="mb-6 flex flex-wrap gap-8">
                {signatories.map((signer, i) => (
                  <div key={signer.signer_id ?? i} className="min-w-[180px]">
                    {signer.is_signed ? (
                      <div>
                        {signer.title && (
                          <p className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">{signer.title}</p>
                        )}
                        {signer.sign_image_url && (
                          <img src={signer.sign_image_url} alt="" className="mb-1 h-6 w-auto object-contain" />
                        )}
                        {signer.digital_signature_url && (
                          <img src={signer.digital_signature_url} alt={`Signed by ${signer.display_name}`} className="h-14 object-contain" />
                        )}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-700 dark:text-gray-300">
                        {signer.title && (
                          <p className="mb-1 font-medium text-gray-500 dark:text-gray-400">{signer.title}</p>
                        )}
                        <p className="font-semibold">{signer.display_name ?? signer.name}</p>
                        <p className="text-gray-500">{signer.authorizefor}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Pending Tests */}
            {(leftCount > 0 || paramCount > doneCount) && (
              <div className="no-print mb-4 text-center text-xs text-gray-500 dark:text-gray-400">
                <p>{leftCount} Tests Pending completion</p>
                <p>{paramCount - (doneCount + leftCount)} Tests Pending Assignment</p>
              </div>
            )}

            {/* Generate ULR Form — bottom of report */}
            {formData && (
              <GenerateUlrForm
                tid={tid}
                hid={hid}
                trfId={trf?.id}
                formData={formData}
                onSuccess={fetchReport}
              />
            )}

          </div>
        </div>
      </div>
    </Page>
  );
}