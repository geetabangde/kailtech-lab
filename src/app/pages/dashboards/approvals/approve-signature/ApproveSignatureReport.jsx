// ApproveSignatureReport.jsx
//
// PHP equivalent : testreport.php  (approve-signature flow)
// Route          : /dashboards/approvals/approve-signature/ApproveSignatureReport/:id?sid=
//
//   :id  = trfProducts.id   (PHP: $tid = $_GET['hakuna'])
//   ?sid = pendingsignatures.id  (used to call approve API)
//
// APIs:
//   GET  /approvals/view-signature-report?tid=   → full report (same shape as view-test-report)
//   POST /approvals/approve-signatures           → { id: sid }
//
// approvesignature.php:
//   UPDATE pendingsignatures SET status=1 WHERE id=$aid
//   if (approvalleft == 0):
//     if (paramcount == donecount): UPDATE trfProducts SET status=11
//     include createcachetestreport.php

import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import PropTypes from "prop-types";
import axios from "utils/axios";
import { toast } from "sonner";
import clsx from "clsx";
import { Page } from "components/shared/Page";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

// PHP: date("d.m.Y", strtotime($date))
function fmtDate(d) {
  if (!d) return "—";
  try {
    return new Date(d)
      .toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" })
      .replace(/\//g, ".");
  } catch { return d; }
}

// PHP: $sflag = "style='background:#008d4c...' or style='background:#ff0000...'"
// Backend returns this as a string → parse to React style object
function parseComplianceStyle(styleStr) {
  if (!styleStr) return {};
  const result = {};
  styleStr.split(";").forEach((part) => {
    const idx = part.indexOf(":");
    if (idx === -1) return;
    const prop = part.slice(0, idx).trim();
    const val  = part.slice(idx + 1).trim().replace("!important", "").trim();
    if (!prop || !val) return;
    result[prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = val;
  });
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

// PHP: <td><strong>Label</strong></td><td>value</td>
function InfoRow({ label, value }) {
  return (
    <tr className="border-b border-gray-200 dark:border-gray-700">
      <td className="w-1/4 border-r border-gray-200 p-2 align-top text-xs font-semibold whitespace-nowrap text-gray-600 dark:border-gray-700 dark:text-gray-400">
        {label}
      </td>
      <td className="p-2 text-xs text-gray-800 dark:text-gray-200">{value ?? "—"}</td>
    </tr>
  );
}
InfoRow.propTypes = { label: PropTypes.string, value: PropTypes.any };

// PHP: requestretest.php → view($id, 'catid', 'requestretest.php', 'requesting retest')
// API: GET /actionitem/request-reset/{id}
function ReTestButton({ testEventId, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const handle = useCallback(async () => {
    setLoading(true);
    try {
      await axios.get(`/actionitem/request-reset/${testEventId}`);
      toast.success("Re-test requested ✅");
      onSuccess?.();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Failed to request re-test ❌");
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

// Approve Confirm Modal
function ApproveModal({ onConfirm, onClose, loading }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => e.target === e.currentTarget && !loading && onClose()}
    >
      <div className="w-full max-w-sm rounded-xl bg-white shadow-xl dark:bg-dark-800">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-dark-600">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-dark-100">Approve Signature</h3>
          <button onClick={onClose} disabled={loading} className="rounded p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-700">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-5 py-5">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
              <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800 dark:text-dark-100">Confirm Signature Approval</p>
              <p className="mt-1 text-xs text-gray-500 dark:text-dark-400">
                {/* PHP: UPDATE pendingsignatures SET status=1; if approvalleft==0 → trfProducts status=11 */}
                This will approve your electronic signature for this test report. This action cannot be undone.
              </p>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-gray-200 px-5 py-3 dark:border-dark-600">
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-md border border-gray-300 px-4 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-dark-500 dark:text-dark-300 dark:hover:bg-dark-700"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={clsx(
              "rounded-md bg-blue-600 px-5 py-1.5 text-xs font-semibold text-white shadow hover:bg-blue-700",
              loading && "cursor-not-allowed opacity-60"
            )}
          >
            {loading ? "Approving…" : "Yes, Approve"}
          </button>
        </div>
      </div>
    </div>
  );
}
ApproveModal.propTypes = { onConfirm: PropTypes.func, onClose: PropTypes.func, loading: PropTypes.bool };

// ─────────────────────────────────────────────────────────────────────────────
// Signatory Block
// PHP: foreach ($signatories as $signer) { ... }
//   if status=1 → show sign_image + digital watermark image
//   else        → show name + authorizefor text only
//   Title label logic:
//     if approvedon >= changedate(2025-11-12) → "Reviewed & Authorized By"
//     else if i==0 → "Reviewed By", i>0 → "Authorized By"
// ─────────────────────────────────────────────────────────────────────────────
function SignatoryBlock({ signer }) {
  if (!signer) return null;

  return (
    <div className="min-w-[180px] text-xs text-gray-700 dark:text-gray-300">
      {/* PHP: echo title label based on cutoff/changedate logic (handled by backend via signer.title) */}
      {signer.title && (
        <p className="mb-1 font-medium text-gray-500 dark:text-gray-400">{signer.title}</p>
      )}

      {signer.is_signed ? (
        /* PHP: if ($scount > 0 && $astatus == 1) → show signature images */
        <div>
          {/* PHP: <div style="margin-bottom:30px;">&nbsp;</div> */}
          <div className="mb-7" />

          {/* PHP: <img src='sign_image' style="width:100px;height:25px;" /> */}
          {signer.sign_image_url && (
            <img
              src={signer.sign_image_url}
              alt={`${signer.display_name} sign`}
              className="mb-1 h-6 object-contain"
              style={{ width: "100px" }}
            />
          )}

          {/* PHP: PlaceWatermark → digital sign image "Electronically signed by\n$username\nDate:d/m/Y" */}
          {signer.digital_signature_url && (
            <img
              src={signer.digital_signature_url}
              alt={`Electronically signed by ${signer.display_name}`}
              className="h-14 object-contain"
            />
          )}
        </div>
      ) : (
        /* PHP: else → show name + authorizefor as plain text (not yet signed) */
        <div>
          <p className="font-semibold">{signer.display_name ?? signer.name}</p>
          {signer.authorizefor && (
            <p className="mt-0.5 text-gray-500 dark:text-gray-400">{signer.authorizefor}</p>
          )}
        </div>
      )}
    </div>
  );
}
SignatoryBlock.propTypes = { signer: PropTypes.object };

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────
export default function ApproveSignatureReport() {
  const { id: tid }    = useParams();           // PHP: $tid = $_GET['hakuna'] = trfProducts.id
  const [searchParams] = useSearchParams();
  const navigate       = useNavigate();
  const sid = searchParams.get("sid") ?? "";    // pendingsignatures.id

  const [report,     setReport]     = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [modalOpen,  setModalOpen]  = useState(false);
  const [approving,  setApproving]  = useState(false);
  const [isApproved, setIsApproved] = useState(false);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  // GET /approvals/view-signature-report?tid=
  // PHP: fetches trfProducts, trfs, testeventdata, pendingsignatures, hodrequests etc.
  const fetchReport = useCallback(async () => {
    if (!tid) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get(`/actionitem/view-test-report?tid=${tid}`);
      setReport(data?.data ?? data ?? null);
    } catch (err) {
      setError(err?.response?.data?.message ?? "Failed to load report.");
    } finally { setLoading(false); }
  }, [tid]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  // ── Approve ───────────────────────────────────────────────────────────────
  // PHP: approvesignature.php
  //   UPDATE pendingsignatures SET status=1 WHERE id=$sid
  //   if (approvalleft == 0 && paramcount == donecount): UPDATE trfProducts SET status=11
  // API: POST /approvals/approve-signatures { id: sid }
  const handleApprove = useCallback(async () => {
    if (!sid) { toast.error("Signature ID not found."); return; }
    setApproving(true);
    try {
      await axios.post("/approvals/approve-signatures", { id: Number(sid) });
      toast.success("Signature Approved Successfully ✅");
      setIsApproved(true);
      setModalOpen(false);
      fetchReport(); // Refresh to show updated signatory status
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Failed to approve signature. ❌");
    } finally { setApproving(false); }
  }, [sid, fetchReport]);

  // ── States ────────────────────────────────────────────────────────────────
  if (loading) return (
    <Page title="Approve Signature — Report">
      <div className="flex h-[60vh] items-center justify-center gap-3 text-gray-500">
        <svg className="h-5 w-5 animate-spin text-blue-600" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z" />
        </svg>
        Loading Report…
      </div>
    </Page>
  );

  if (error) return (
    <Page title="Approve Signature — Report">
      <div className="flex h-60 flex-col items-center justify-center gap-4 rounded-xl border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
        <p className="text-sm text-red-500">{error}</p>
        <button onClick={() => navigate(-1)} className="rounded bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200">
          ← Go Back
        </button>
      </div>
    </Page>
  );

  if (!report) return null;

  // ── Destructure — same field names as view-test-report ───────────────────
  const {
    trf_product:  trf_product  = {},
    nabl: nablObj              = {},
    grade,
    batchno,
    report_status: rsObj       = {},
    dates                      = {},
    customer                   = {},
    product                    = {},
    trf                        = {},
    received_items             = [],
    test_results               = [],
    remarks: remarksObj        = {},
    signatories                = [],
    counts                     = {},
    permissions: permsObj      = {},
    meta                       = {},
  } = report;

  const { ulr, condition_name, sealed_name, reportdate } = trf_product;

  // PHP: $nabl = selectfieldwhere("testprices", "nabl", "id=package")
  const nablStatus = nablObj?.status ?? 0;
  // PHP: if ($nabl == 1) → nabltest.png, elseif ($nabl == 3) → qai.jpeg
  const nablLogo =
    nablStatus === 1 ? (nablObj?.logo ?? "/images/nabl2348.png") :
    nablStatus === 3 ? "/images/qai.jpeg" : null;

  // PHP: $reportstatus = hodrequests.status (if hid) OR trfProducts.status
  const reportStatus = typeof rsObj === "object"
    ? (rsObj?.code ?? rsObj?.status ?? 0)
    : (Number(rsObj) || 0);

  // PHP: $specs = $trfprow['specification']  → if ($specs == 1) show SPECIFICATIONS column
  const hasSpecs =
    Number(trf_product?.specification) === 1 ||
    test_results.some((r) => r.specification && r.specification !== "—");

  const { start_date, end_date } = dates;

  // PHP: $hodremark, $witness, $wdetail, $remark (BDL), $remark1 (ADL)
  const hodRemark     = remarksObj?.hod_remark    ?? "";
  const witnessVal    = remarksObj?.witness        ?? "";
  const witnessDetail = remarksObj?.witness_detail ?? "";
  const bdlRemark     = remarksObj?.bdl_remark     ?? "";
  const adlRemark     = remarksObj?.adl_remark     ?? "";

  // PHP: in_array(180, $permissions) || in_array(181, $permissions)
  // Actions column shown when reportstatus < 9
  const canHod = permsObj?.has_hod_permission === true;  // perm 180
  const canQa  = permsObj?.has_qa_permission  === true;  // perm 181
  const showActionsCol = (canHod || canQa) && reportStatus < 9;

  const customerName    = customer?.name           ?? "—";
  const customerAddress = customer?.address        ?? "";
  const contactPerson   = customer?.contact_person ?? "";
  // PHP: if ($specificpurpose == 2) → show contact person
  const showContact     = Number(trf?.specificpurpose ?? customer?.specific_purpose) === 2;
  // PHP: if ($trfrow['letterrefno'] != "-") → show customer reference row
  const customerRef     = customer?.letterrefno    ?? "";
  const productName     = product?.name            ?? "—";
  // PHP: $prodesc = selectfieldwhere("products", "description", "id=$product")
  const productDesc     = product?.description     ?? "—";
  // PHP: LRN = $trfprow['brn']
  const displayLRN      = trf_product?.lrn ?? trf_product?.brn ?? "—";
  const ktrcRef         = meta?.ktrc_ref   ?? "KTRC/QF/0708/01";
  // PHP: $batchno = technical.brand + "<br/>" + trfProducts.brand
  const batchnoClean    = (batchno ?? "").replace(/<br\s*\/?>/gi, " ").trim();

  // PHP: receiveditems where trfProduct=$tid and status=1
  const qtyStr = received_items
    .filter((q) => (q.received ?? 0) > 0)
    .map((q) => {
      if ((q.quantity_name ?? "").toUpperCase().trim() === "NA") return "NA";
      return `${q.received} ${q.unit_name ?? ""}`.trim();
    })
    .join(", ") || "—";

  // PHP: Remark section → hodremark + witness + BDL + ADL
  const remarkLines = [];
  if (hodRemark?.trim())                   remarkLines.push(hodRemark.trim());
  if (witnessVal === "1" && witnessDetail) remarkLines.push(`The test was witnessed by ${witnessDetail}`);
  if (bdlRemark)                           remarkLines.push(bdlRemark);
  if (adlRemark)                           remarkLines.push(adlRemark);

  // PHP: $leftcount, $donecount, $paramcount
  const leftCount  = counts?.left_count  ?? 0;
  const doneCount  = counts?.done_count  ?? 0;
  const paramCount = counts?.param_count ?? 0;

  return (
    <Page title={`Approve Signature — Report ${ulr ?? ""}`}>
      <div className="transition-content px-[var(--margin-x)] pb-8">

        {/* ── Page Header ─────────────────────────────────────────────── */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/dashboards/approvals/approve-signature")}
              className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
              </svg>
              Back to Approve Signature
            </button>
            <h1 className="text-base font-semibold text-gray-800 dark:text-gray-100">Final Report</h1>
          </div>

          {/* Top Approve Button — only if sid present and not yet approved */}
          <div className="flex items-center gap-2">
            {sid && !isApproved && (
              <button
                onClick={() => setModalOpen(true)}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow transition hover:bg-blue-700"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Approve Signature
              </button>
            )}
            {isApproved && (
              <span className="flex items-center gap-1.5 rounded-lg bg-green-100 px-4 py-2 text-sm font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Signature Approved
              </span>
            )}
          </div>
        </div>

        {/* ── Report Card ──────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-dark-800">
          <div className="px-6 py-6">

            {/* PHP: if ($nabl == 1) nabltest.png / elseif ($nabl==3) qai.jpeg */}
            {nablLogo && (
              <div className="mb-3 flex justify-center">
                <img
                  src={nablLogo}
                  alt="Accreditation Logo"
                  className={nablStatus === 1 ? "h-16 w-auto" : "h-12 w-auto"}
                />
              </div>
            )}

            {/* PHP: <h1><u>TEST REPORT</u></h1> */}
            <h1 className="mb-4 text-center text-xl font-bold underline tracking-wide text-gray-900 dark:text-gray-100">
              TEST REPORT
            </h1>

            {/* PHP: ULR (if nabl==1) + KTRC/QF/0708/01 */}
            <div className="mb-4 flex justify-between text-xs font-semibold text-gray-700 dark:text-gray-300">
              <span>{nablStatus === 1 ? `ULR: ${ulr ?? ""}` : "ULR:"}</span>
              <span>{ktrcRef}</span>
            </div>

            {/* ── Customer Info Table ──────────────────────────────────── */}
            <div className="mb-4 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
              <table className="w-full text-xs">
                <tbody>
                  {/* PHP: colspan=3 rowspan=6 → left cell covers 6 rows */}
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <td
                      className="w-2/5 align-top border-r border-gray-200 p-3 dark:border-gray-700"
                      rowSpan={8}
                    >
                      <p className="mb-1 font-semibold text-gray-700 dark:text-gray-300">
                        Name and Address of Customer
                      </p>
                      {/* PHP: customers.name + customer-address.concat(address,city,pincode) */}
                      <p className="text-gray-800 dark:text-gray-200">{customerName}</p>
                      <p className="text-gray-600 dark:text-gray-400 whitespace-pre-line">{customerAddress}</p>
                      {/* PHP: if ($specificpurpose == 2) → Contact Person Name */}
                      {showContact && contactPerson && (
                        <p className="mt-1 text-gray-700 dark:text-gray-300">
                          Contact Person Name: - {contactPerson}
                        </p>
                      )}
                    </td>
                    {/* PHP: LRN = $trfprow['brn'] */}
                    <td className="w-1/4 border-r border-gray-200 p-2 font-semibold text-gray-600 dark:border-gray-700 dark:text-gray-400">
                      Laboratory Reference Number (LRN)
                    </td>
                    <td className="p-2 text-gray-800 dark:text-gray-200">{displayLRN}</td>
                  </tr>
                  {/* PHP: date("d.m.Y", strtotime($trfrow['date'])) */}
                  <InfoRow label="Date of Receipt"             value={fmtDate(trf?.date ?? dates?.receipt_date)} />
                  {/* PHP: conditions.name where id=$condition */}
                  <InfoRow label="Condition, When Received"    value={condition_name ?? "—"} />
                  {/* PHP: $sealed = array("Unsealed","Sealed","Packed","NA") */}
                  <InfoRow label="Packing, When Received"      value={sealed_name    ?? "—"} />
                  {/* PHP: receiveditems → qty + unit name, or "NA" */}
                  <InfoRow label="Quantity Received (Approx.)" value={qtyStr} />
                  {/* PHP: min(startdate) from testeventdata */}
                  <InfoRow label="Date of Start Of Test"       value={fmtDate(start_date)} />
                  {/* PHP: max(enddate) from testeventdata */}
                  <InfoRow label="Date of Completion"          value={fmtDate(end_date)} />
                  {/* PHP: $trfprow['reportdate'] */}
                  <InfoRow label="Date of Reporting"           value={fmtDate(reportdate ?? dates?.report_date)} />
                </tbody>
                <tbody>
                  {/* PHP: colspan=3 rowspan=2 → Sample Identification + Date of Reporting */}
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <td colSpan={3} className="p-2 text-xs text-gray-700 dark:text-gray-300">
                      {/* PHP: $prodesc = products.description */}
                      Sample Identification: {productDesc}
                    </td>
                  </tr>
                  {/* PHP: if ($trfrow['letterrefno'] != "-") */}
                  {customerRef && customerRef !== "-" && (
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <td colSpan={3} className="p-2 text-xs text-gray-700 dark:text-gray-300">
                        Customer Reference :- {customerRef}
                      </td>
                    </tr>
                  )}
                  {/* PHP: $proname Grade $grade $batchno */}
                  <tr>
                    <td colSpan={3} className="p-2 text-xs text-gray-700 dark:text-gray-300">
                      Sample Particulars : {productName} Grade : {grade} {batchnoClean}
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
                      {/* PHP: if ($specs == 1) */}
                      {hasSpecs && (
                        <th className="border-b border-gray-200 px-3 py-2 text-center font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-300">
                          SPECIFICATIONS
                        </th>
                      )}
                      {/* PHP: if (in_array(180,$perms) || in_array(181,$perms)) && $reportstatus < 9 */}
                      {showActionsCol && (
                        <th className="border-b border-gray-200 px-3 py-2 text-center font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-300 no-print">
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
                        // PHP: $sflag → green (#008d4c) / red (#ff0000) / neutral
                        const cellStyle     = parseComplianceStyle(row.compliance_style);
                        // PHP: $rresult → BDL/ADL override or raw result
                        const displayResult = row.result?.display_value ?? row.result?.value ?? "—";
                        // PHP: units.description where id=resultunit
                        const unitDisplay   = row.unit?.description ?? row.unit?.name ?? "—";
                        // PHP: methods.name where id=tmethod
                        const methodName    = row.method?.name ?? "—";
                        return (
                          <tr key={row.id ?? idx} className="border-b border-gray-100 last:border-0 dark:border-gray-700">
                            <td className="px-3 py-2 text-center text-gray-700 dark:text-gray-300">
                              {row.sno ?? idx + 1}
                            </td>
                            {/* PHP: parameters.name where id=parameter */}
                            <td className="px-3 py-2 text-gray-800 dark:text-gray-200">{row.parameter_name}</td>
                            <td className="px-3 py-2 text-center text-gray-700 dark:text-gray-300">{unitDisplay}</td>
                            {/* PHP: $sflag applied to result cell */}
                            <td className="px-3 py-2 text-center" style={cellStyle}>{displayResult}</td>
                            <td className="px-3 py-2 text-center text-gray-700 dark:text-gray-300">{methodName}</td>
                            {/* PHP: if ($specs == 1) */}
                            {hasSpecs && (
                              <td className="px-3 py-2 text-center text-gray-700 dark:text-gray-300">
                                {row.specification ?? "—"}
                              </td>
                            )}
                            {/* PHP: <button onclick="view($rows['id'], 'catid', 'requestretest.php', ...)">Request Re-test</button> */}
                            {showActionsCol && (
                              <td className="px-3 py-2 text-center no-print">
                                {(row.can_retest === true) && (
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

            {/* ── Remarks ──────────────────────────────────────────────── */}
            {/* PHP: if (hodremark || witness==1 || remark || remark1) */}
            {remarkLines.length > 0 && (
              <div className="mb-4 rounded-lg bg-gray-50 px-4 py-3 text-xs text-gray-700 dark:bg-dark-700 dark:text-gray-300">
                <strong>Remark: </strong>
                {remarkLines.map((line, i) => (
                  <span key={i}>{i > 0 && <br />}{line}</span>
                ))}
              </div>
            )}

            {/* PHP: if ($tid != "1356") echo "**End of Report**" */}
            {String(tid) !== "1356" && (
              <div className="mb-6 text-center text-xs font-semibold text-gray-700 dark:text-gray-300">
                **End of Report**
              </div>
            )}

            {/* ── Signatories Footer ────────────────────────────────────── */}
            {/* PHP: foreach ($signatories as $i => $signer)
                 - cutoffdate (2025-04-25): if approvedon >= cutoff → last signatory moves to front
                 - changedate (2025-11-12): if approvedon >= changedate → "Reviewed & Authorized By"
                                            else i==0 → "Reviewed By", i>0 → "Authorized By"
                 All this logic is handled by backend → signer.title field */}
            {signatories.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-10">
                {signatories.map((signer, i) => (
                  <SignatoryBlock key={signer.signer_id ?? i} signer={signer} />
                ))}
              </div>
            )}

            {/* ── Pending Tests Info ────────────────────────────────────── */}
            {/* PHP: $leftcount > 0 || $paramcount > $donecount */}
            {(leftCount > 0 || paramCount > doneCount) && (
              <div className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400 no-print">
                <p>{leftCount} Tests Pending completion</p>
                <p>{paramCount - (doneCount + leftCount)} Tests Pending Assignment</p>
              </div>
            )}

            {/* ── Bottom Approve CTA ────────────────────────────────────── */}
            {sid && !isApproved && (
              <div className="mt-8 flex items-center justify-center rounded-xl border border-blue-100 bg-blue-50 p-6 dark:border-blue-800 dark:bg-blue-900/20">
                <div className="text-center">
                  <p className="mb-1 text-sm font-semibold text-gray-800 dark:text-gray-100">
                    Review Complete?
                  </p>
                  <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
                    Please review the test results above and approve your electronic signature.
                  </p>
                  <button
                    onClick={() => setModalOpen(true)}
                    className="rounded-lg bg-blue-600 px-10 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-blue-700"
                  >
                    Approve Signature
                  </button>
                </div>
              </div>
            )}

            {isApproved && (
              <div className="mt-8 flex items-center justify-center gap-2 rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
                <svg className="h-5 w-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                  Signature Approved Successfully
                </p>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Confirm Modal */}
      {modalOpen && (
        <ApproveModal
          loading={approving}
          onConfirm={handleApprove}
          onClose={() => !approving && setModalOpen(false)}
        />
      )}
    </Page>
  );
}