// ReviewByQaDetail.jsx
// Route: /dashboards/action-items/review-by-qa/:tid?hid=...
//
// PHP: testreport.php?hakuna={tid}&what={hid}  → status=8 (QA Review)
// API: GET  /actionitem/test-report?hakuna={tid}&what={hid}
// API: POST /actionitem/approve-submit-ulr  { hid }
// API: GET  /actionitem/request-reset/{id}

import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import PropTypes from "prop-types";
import axios from "utils/axios";
import { toast } from "sonner";
import clsx from "clsx";
import { Page } from "components/shared/Page";
import {
  PrintWithLHButton,
  PrintWithoutLHTwoSignButton,
} from "./TestReportPdf";
import { PrintExportTestingReportWOLHButton } from "../signed-reports/exporttestingreportwolh";

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

function renderVal(v) {
  if (v && typeof v === "object") {
    // Handle the specific object structure from API: {value, display_value, ...}
    return v.display_value ?? v.value ?? "—";
  }
  return v ?? "—";
}

// PHP: $sflag → "background:#008d4c!important;color:#ffffff;text-align:center"
function parseComplianceStyle(styleStr) {
  if (!styleStr) return {};
  const result = {};
  styleStr.split(";").forEach((part) => {
    const idx = part.indexOf(":");
    if (idx === -1) return;
    const prop  = part.slice(0, idx).trim();
    const val   = part.slice(idx + 1).trim().replace("!important", "").trim();
    if (!prop || !val) return;
    result[prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = val;
  });
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function InfoRow({ label, value }) {
  return (
    <tr className="border-b border-gray-200 dark:border-gray-700">
      <td className="w-1/4 border-r border-gray-200 p-2 text-xs font-semibold whitespace-nowrap text-gray-600 dark:border-gray-700 dark:text-gray-400">
        {label}
      </td>
      <td className="p-2 text-xs text-gray-800 dark:text-gray-200">{renderVal(value)}</td>
    </tr>
  );
}
InfoRow.propTypes = { label: PropTypes.string, value: PropTypes.any };

// PHP: onclick="view(id,'catid','requestretest.php',...)"
// GET /actionitem/request-reset/{testEventId}
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
        loading && "cursor-not-allowed opacity-60"
      )}
    >
      {loading ? "..." : "Request Re-test"}
    </button>
  );
}
ReTestButton.propTypes = { testEventId: PropTypes.any, onSuccess: PropTypes.func };

// PHP: finalpapproval.php / finalapproval.php
// POST /actionitem/approve-submit-ulr  { hid }
function QaApproveButton({ hid, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const handle = useCallback(async () => {
    setLoading(true);
    try {
      await axios.post("/actionitem/approve-submit-ulr", { hid });
      toast.success("Approved & Submitted for ULR ✅");
      onSuccess?.();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Submission failed ❌");
    } finally { setLoading(false); }
  }, [hid, onSuccess]);

  return (
    <button
      onClick={handle}
      disabled={loading}
      className={clsx(
        "w-full rounded-lg bg-green-600 py-3 text-sm font-semibold text-white shadow transition hover:bg-green-700",
        loading && "cursor-not-allowed opacity-60"
      )}
    >
      {loading ? "Submitting..." : "Approve & Submit For ULR"}
    </button>
  );
}
QaApproveButton.propTypes = { hid: PropTypes.any, onSuccess: PropTypes.func };

function usePermissions() {
  return localStorage.getItem("userPermissions")?.split(",").map(Number) ?? [];
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────
export default function ReviewByQaDetail() {
  const { tid }        = useParams();           // PHP: $_GET['hakuna']
  const [searchParams] = useSearchParams();
  const navigate       = useNavigate();
  const permissions    = usePermissions();

  // PHP: $_GET['what']
  const hid = searchParams.get("hid") ?? searchParams.get("what") ?? "";

  const [report,  setReport]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  // ── Fetch report ─────────────────────────────────────────────────────────
  // GET /actionitem/view-test-report?tid={tid}&hid={hid}
  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.set("tid", tid);
      if (hid) params.set("hid", hid);

      const res  = await axios.get(`/actionitem/view-test-report?${params.toString()}`);
      const data = res.data?.data ?? res.data ?? null;
      if (!data) throw new Error("No report data returned");

      // Fetch customer address if address_id exists
      const custId = data?.customer?.id;
      const addrId = data?.customer?.address_id;
      if (custId && addrId) {
        try {
          const addrRes = await axios.get(`/people/get-customers-address/${custId}`);
          const addrList = addrRes.data?.data ?? [];
          const found = addrList.find((a) => String(a.id) === String(addrId));
          if (found) {
            if (!data.customer) data.customer = {};
            data.customer.address = [found.address, found.city, found.pincode].filter(Boolean).join(", ");
          }
        } catch (e) {
          console.error("Failed to fetch customer address:", e);
        }
      }

      setReport(data);
    } catch (err) {
      console.error("fetchReport error:", err);
      setError(err?.response?.data?.message ?? "Failed to load report.");
    } finally {
      setLoading(false);
    }
  }, [tid, hid]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) return (
    <Page title="Test Report">
      <div className="flex h-[60vh] items-center justify-center gap-3 text-gray-500">
        <svg className="h-5 w-5 animate-spin text-blue-600" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z" />
        </svg>
        <span className="text-sm">Loading Report…</span>
      </div>
    </Page>
  );

  // ── Error ────────────────────────────────────────────────────────────────
  if (error) return (
    <Page title="Test Report">
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

  // ── Destructure ───────────────────────────────────────────────────────────
  const {
    trf_product:   trfProduct   = {},
    nabl:          nablObj      = {},
    size,
    grade,
    batchno                     = "",
    report_status: rsObj        = {},
    dates                       = {},
    customer                    = {},
    product                     = {},
    trf                         = {},
    received_items              = [],
    test_results                = [],
    remarks:       remarksObj   = {},
    signatories                 = [],
    allotted_items              = [],
    counts                      = {},
    permissions:   permsObj     = {},
    meta                        = {},
  } = report;

  const { brn, ulr, condition_name, sealed_name, reportdate, disposable } = trfProduct;

  const nablStatus   = nablObj?.status ?? 0;
  const reportStatus = typeof rsObj === "object" ? (rsObj?.code ?? 0) : (Number(rsObj) || 0);
  const { start_date, end_date } = dates;

  // Use hid from URL param OR from meta (API returns meta.hid)
  const effectiveHid = hid || meta?.hid || "";

  // PHP: remarks
  const hodRemark     = remarksObj?.hod_remark    ?? "";
  const witnessVal    = remarksObj?.witness        ?? "";
  const witnessDetail = remarksObj?.witness_detail ?? "";
  const bdlRemark     = remarksObj?.bdl_remark     ?? "";
  const adlRemark     = remarksObj?.adl_remark     ?? "";

  const remarkLines = [];
  if (hodRemark?.trim())                   remarkLines.push(hodRemark.trim());
  if (witnessVal === "1" && witnessDetail) remarkLines.push(`The test was witnessed by ${witnessDetail}`);
  if (bdlRemark)                           remarkLines.push(bdlRemark);
  if (adlRemark)                           remarkLines.push(adlRemark);

  // PHP: in_array(181,$permissions), in_array(180,$permissions)
  const canQa  = permsObj?.has_qa_permission  === true || permissions.includes(181);
  const canHod = permsObj?.has_hod_permission === true || permissions.includes(180);

  // PHP: if(perm 180||181) && $reportstatus<9 → Actions column
  const showActionsColumn = (canHod || canQa) && reportStatus < 9;

  // PHP: every row gets the button when permissions + reportstatus < 9 are satisfied
  const showRetest = () => showActionsColumn;

  // PHP: $reportstatus==8 && in_array(181) && isset($hid) && !empty($hid)
  const showQaApprove = reportStatus === 8 && canQa && !!effectiveHid;

  // PHP: if ($specs==1)
  const hasSpecs =
    trfProduct?.specification_flag === 1 ||
    Number(trfProduct?.specification) === 1 ||
    test_results.some((r) => r.specification && r.specification !== "—");

  const nablLogo = nablObj?.logo || (
    nablStatus === 1 ? "/images/nabl2348.png" :
      nablStatus === 3 ? "/images/qai.jpeg" : null
  );

  const qtyStr =
    received_items
      .filter((q) => (q.received ?? 0) > 0)
      .map((q) => {
        const name = q.quantity_name ?? "";
        if (name.toUpperCase().trim() === "NA") return "NA";
        return `${q.received} ${q.unit_name ?? ""}`.trim();
      })
      .join(", ") || "—";

  const customerName    = customer?.name           ?? "—";
  const customerAddress = customer?.address        ?? "";
  const contactPerson   = customer?.contact_person ?? "";
  const showContact     = Number(trf?.specificpurpose ?? customer?.specific_purpose) === 2;
  const customerRef     = customer?.letterrefno    ?? "";
  const productName     = product?.name            ?? "—";
  const productDesc     = product?.description     ?? size ?? "—";
  const displayLRN      = trfProduct?.lrn ?? trfProduct?.brn ?? brn ?? "—";
  const ktrcRef         = meta?.ktrc_ref  ?? "KTRC/QF/0708/01";
  const batchnoClean    = batchno.replace(/<br\s*\/?>/gi, " ").trim();

  // Use pre-formatted dates from API when available
  const receiptDateStr  = dates?.formatted_receipt_date ?? fmtDate(trf?.date ?? dates?.receipt_date);
  const startDateStr    = dates?.formatted_start_date   ?? fmtDate(start_date);
  const endDateStr      = dates?.formatted_end_date     ?? fmtDate(end_date);
  const reportDateStr   = dates?.formatted_report_date  ?? fmtDate(reportdate ?? dates?.report_date);

  const leftCount  = counts?.left_count  ?? counts?.pending_tests ?? 0;
  const doneCount  = counts?.done_count  ?? 0;
  const paramCount = counts?.param_count ?? 0;

  return (
    <Page title={`REPORT-${ulr ?? ""}`}>
      <div className="transition-content px-[var(--margin-x)] pb-8">

        {/* ── Header ───────────────────────────────────────────────────── */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
              </svg>
              Back
            </button>
            <h1 className="text-base font-semibold text-gray-800 dark:text-gray-100">Final Report</h1>
          </div>

          {/* PHP: Print buttons */}
          <div className="no-print flex flex-wrap items-center gap-2">
            <PrintWithLHButton           report={report} />
            <PrintExportTestingReportWOLHButton report={report} />
            <PrintWithoutLHTwoSignButton report={report} />
          </div>
        </div>

        {/* ── Report Card ───────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-dark-800">
          <div className="px-6 py-6">

            {/* NABL / QAI logo */}
            {nablLogo && (
              <div className="mb-3 flex justify-center">
                <img src={nablLogo} alt="Accreditation Logo" className="h-16 w-auto" />
              </div>
            )}

            {/* TEST REPORT */}
            <h1 className="mb-4 text-center text-xl font-bold tracking-wide underline text-gray-900 dark:text-gray-100">
              TEST REPORT
            </h1>

            {/* ULR | KTRC ref */}
            <div className="mb-4 flex justify-between text-xs font-semibold text-gray-700 dark:text-gray-300">
              <span>{nablStatus === 1 && ulr ? `ULR: ${ulr}` : "ULR:"}</span>
              <span>{ktrcRef}</span>
            </div>

            {/* ── Customer Info Table ──────────────────────────────────── */}
            <div className="mb-4 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
              <table className="w-full text-xs">
                <tbody>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <td className="w-2/5 border-r border-gray-200 p-3 align-top dark:border-gray-700" rowSpan={8}>
                      <p className="mb-1 font-semibold text-gray-700 dark:text-gray-300">Name and Address of Customer</p>
                      <p className="text-gray-800 dark:text-gray-200">{customerName}</p>
                      <p className="text-gray-800 dark:text-gray-200">{customerAddress}</p>
                      {showContact && contactPerson && (
                        <p className="mt-1 text-gray-700 dark:text-gray-300">Contact Person: {contactPerson}</p>
                      )}
                    </td>
                    <td className="w-1/4 border-r border-gray-200 p-2 font-semibold text-gray-600 dark:border-gray-700 dark:text-gray-400">
                      Laboratory Reference Number (LRN)
                    </td>
                    <td className="p-2 text-gray-800 dark:text-gray-200">{displayLRN}</td>
                  </tr>
                  <InfoRow label="Date of Receipt"             value={receiptDateStr} />
                  <InfoRow label="Condition, When Received"    value={condition_name ?? "—"} />
                  <InfoRow label="Packing, When Received"      value={sealed_name    ?? "—"} />
                  <InfoRow label="Quantity Received (Approx.)" value={qtyStr} />
                  <InfoRow label="Date of Start Of Test"       value={startDateStr} />
                  <InfoRow label="Date of Completion"          value={endDateStr} />
                  <InfoRow label="Date of Reporting"           value={reportDateStr} />
                </tbody>
                <tbody>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <td colSpan={3} className="p-2 text-gray-700 dark:text-gray-300">
                      <strong>Sample Identification:</strong> {productDesc}
                    </td>
                  </tr>
                  {customerRef && customerRef !== "-" && (
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <td colSpan={3} className="p-2 text-gray-700 dark:text-gray-300">
                        <strong>Customer Reference:-</strong> {customerRef}
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td colSpan={3} className="p-2 text-gray-700 dark:text-gray-300">
                      <strong>Sample Particulars:</strong> {productName} Grade: {grade} {batchnoClean}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* ── TEST RESULTS ─────────────────────────────────────────── */}
            <div className="mb-4">
              <h3 className="mb-2 text-sm font-bold text-gray-800 dark:text-gray-100">TEST RESULTS</h3>
              <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="w-full text-xs">
                  <thead className="bg-gray-100 dark:bg-dark-700">
                    <tr>
                      {["S.NO", "PARAMETER", "UNIT", "RESULTS", "TEST METHOD"].map((h) => (
                        <th key={h} className="border-b border-gray-200 px-3 py-2 text-center font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-300">
                          {h}
                        </th>
                      ))}
                      {hasSpecs && (
                        <th className="border-b border-gray-200 px-3 py-2 text-center font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-300">
                          SPECIFICATIONS
                        </th>
                      )}
                      {showActionsColumn && (
                        <th className="no-print border-b border-gray-200 px-3 py-2 text-center font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-300">
                          Actions
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {test_results.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-xs text-gray-400">No test results found.</td>
                      </tr>
                    ) : (
                      test_results.map((row, idx) => {
                        const cellStyle     = parseComplianceStyle(row.compliance_style);
                        const displayResult = renderVal(row.result);
                        const unitDisplay   = row.unit?.description     ?? row.unit?.name    ?? renderVal(row.unit);
                        const methodName    = row.method?.name          ?? renderVal(row.method);
                        return (
                          <tr key={row.id ?? idx} className="border-b border-gray-100 last:border-0 dark:border-gray-700">
                            <td className="px-3 py-2 text-center text-gray-700 dark:text-gray-300">{row.sno ?? idx + 1}</td>
                            <td className="px-3 py-2 text-gray-800 dark:text-gray-200">{row.parameter_name}</td>
                            <td className="px-3 py-2 text-center text-gray-700 dark:text-gray-300">{unitDisplay}</td>
                            <td className="px-3 py-2 text-center" style={cellStyle}>{displayResult}</td>
                            <td className="px-3 py-2 text-center text-gray-700 dark:text-gray-300">{methodName}</td>
                            {hasSpecs && (
                              <td className="px-3 py-2 text-center text-gray-700 dark:text-gray-300">{renderVal(row.specification)}</td>
                            )}
                            {showActionsColumn && (
                              <td className="no-print px-3 py-2 text-center">
                                {showRetest(row) && <ReTestButton testEventId={row.id} onSuccess={fetchReport} />}
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

            {/* ── Remarks ──────────────────────────────────────────────── */}
            {remarkLines.length > 0 && (
              <div className="mb-4 rounded-lg bg-gray-50 px-4 py-3 text-xs text-gray-700 dark:bg-dark-700 dark:text-gray-300">
                <strong>Remark: </strong>
                {remarkLines.map((line, i) => (
                  <span key={i}>{i > 0 && <br />}{line}</span>
                ))}
              </div>
            )}

            {/* PHP: if ($tid != "1356") */}
            {String(tid) !== "1356" && (
              <div className="mb-6 text-center text-xs font-semibold text-gray-700 dark:text-gray-300">
                **End of Report**
              </div>
            )}

            {/* ── Signatories ───────────────────────────────────────────── */}
            {signatories.length > 0 && (
              <div className="mb-6 flex flex-wrap gap-8">
                {signatories.map((signer, i) => (
                  <div key={signer.signer_id ?? i} className="min-w-[180px]">
                    {signer.is_signed ? (
                      <div>
                        {signer.title && <p className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">{signer.title}</p>}
                        {signer.sign_image_url       && <img src={signer.sign_image_url}       alt="" className="mb-1 h-6 w-auto object-contain" />}
                        {signer.digital_signature_url && <img src={signer.digital_signature_url} alt={`Signed by ${signer.display_name ?? ""}`} className="h-14 object-contain" />}
                        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                          {!signer.digital_signature_url && (
                            <>
                              Electronically signed by<br />{signer.display_name ?? signer.name ?? ""}
                            </>
                          )}
                        </p>
                      </div>
                    ) : (
                      <div className="text-xs text-gray-700 dark:text-gray-300">
                        {signer.title && <p className="mb-1 font-medium text-gray-500 dark:text-gray-400">{signer.title}</p>}
                        <p className="font-semibold">{signer.display_name ?? signer.name}</p>
                        <p className="text-gray-500">{signer.authorizefor}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* ── Pending tests ─────────────────────────────────────────── */}
            {(leftCount > 0 || paramCount > doneCount) && (
              <div className="no-print mb-4 text-center text-xs text-gray-500 dark:text-gray-400">
                <p>{leftCount} Tests Pending completion</p>
                <p>{paramCount - (doneCount + leftCount)} Tests Pending Assignment</p>
              </div>
            )}

            {/* ── QA Approve ────────────────────────────────────────────── */}
            {/* PHP: $reportstatus==8 && in_array(181) && isset($hid) && !empty($hid) */}
            {showQaApprove && (
              <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-700 dark:bg-dark-700">

                {/* PHP: disposable==2 → red, else green */}
                <div className={clsx(
                  "mb-5 rounded-lg px-4 py-2 text-sm font-semibold",
                  disposable === 2
                    ? "bg-red-50 text-red-600 dark:bg-red-900/20"
                    : "bg-green-50 text-green-700 dark:bg-green-900/20"
                )}>
                  {disposable === 2
                    ? "⚠️ This Item Is To Be Return — Not To Be Disposed"
                    : "✅ This Item Is To Be Disposed"}
                </div>

                {/* PHP: alloteditems where qleft > 0 — read-only on QA page */}
                {allotted_items.filter((q) => (q.qleft ?? 0) > 0).length > 0 && (
                  <div className="mb-5 overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-100 dark:bg-dark-700">
                        <tr>
                          {["ID", "Quantity", "Allotted", "Left", "Department", "Remnant", "Remark"].map((h) => (
                            <th key={h} className="border-b border-gray-200 px-3 py-2 text-center font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-300">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {allotted_items.filter((q) => (q.qleft ?? 0) > 0).map((item, i) => (
                          <tr key={item.id ?? i} className="border-b border-gray-100 last:border-0 dark:border-gray-700">
                            <td className="px-3 py-2 text-center text-gray-700 dark:text-gray-300">{renderVal(item.id)}</td>
                            <td className="px-3 py-2 text-center text-gray-700 dark:text-gray-300">{renderVal(item.quantity_name)}</td>
                            <td className="px-3 py-2 text-center text-gray-700 dark:text-gray-300">{renderVal(item.alloted)}</td>
                            <td className="px-3 py-2 text-center text-gray-700 dark:text-gray-300">{renderVal(item.qleft)}</td>
                            <td className="px-3 py-2 text-center text-gray-700 dark:text-gray-300">{renderVal(item.department_name)}</td>
                            <td className="px-3 py-2 text-center text-gray-500 dark:text-gray-400">{renderVal(item.remnant)}</td>
                            <td className="px-3 py-2 text-center text-gray-500 dark:text-gray-400">{renderVal(item.remark)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50 dark:bg-dark-800">
                        <tr>
                          {["ID", "Quantity", "Allotted", "Left", "Department", "Remnant", "Remark"].map((h) => (
                            <th key={h} className="border-t border-gray-200 px-3 py-2 text-center font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-300">{h}</th>
                          ))}
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}

                <QaApproveButton hid={effectiveHid} onSuccess={() => navigate(-1)} />
              </div>
            )}

          </div>
        </div>
      </div>
    </Page>
  );
}
