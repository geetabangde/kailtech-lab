// DraftReportView.jsx — Standalone Page
// Route : view-draft-report/:id
// Prints: ExportReportWithLH.jsx → exporttestingreport.php (with letter head)
//         ExportReportWoLH.jsx   → exporttestingreportwolh.php (without letter head)

import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import PropTypes from "prop-types";
import axios from "utils/axios";
import { toast } from "sonner";
import clsx from "clsx";
import { Page } from "components/shared/Page";

// ── PDF Export ─────────────────────────────────────────────────────────────
// PHP: exporttestingreport.php   → Print Report With Letter Head
// PHP: exporttestingreportwolh.php → Print Report Without Letter Head
import { ExportWithLHButton } from "./ExportReportWithLH";
import { ExportWoLHButton } from "./ExportReportWoLH";

// ── Helpers ────────────────────────────────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr)
      .toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
      .replace(/\//g, ".");
  } catch {
    return dateStr;
  }
}

function resultColorClass(result, specification, rmin, rmax, rmininclude, rmaxinclude) {
  if (!result) return "";
  const val = parseFloat(result);
  if (isNaN(val)) return "";

  // 1. Priority: Numeric Comparison (if API provides rmin/rmax)
  if (rmin !== undefined && rmax !== undefined) {
    const min = parseFloat(rmin);
    const max = parseFloat(rmax);
    const incMin = parseInt(rmininclude) === 1;
    const incMax = parseInt(rmaxinclude) === 1;

    const passMin = incMin ? val >= min : val > min;
    const passMax = incMax ? val <= max : val < max;

    if (passMin && passMax) return "bg-green-600 text-white text-center";
    return "bg-red-600 text-white text-center";
  }

  // 2. Fallback: String Parsing (existing logic)
  if (!specification) return "";
  const specStr = String(specification).trim();
  const maxMatch = specStr.match(/^max\.?\s*([\d.]+)/i);
  if (maxMatch)
    return val <= parseFloat(maxMatch[1])
      ? "bg-green-600 text-white text-center"
      : "bg-red-600 text-white text-center";
  const minMatch = specStr.match(/^min\.?\s*([\d.]+)/i);
  if (minMatch)
    return val >= parseFloat(minMatch[1])
      ? "bg-green-600 text-white text-center"
      : "bg-red-600 text-white text-center";
  const rangeMatch = specStr.match(/([\d.]+)\s*(?:to|-)\s*([\d.]+)/i);
  if (rangeMatch) {
    const lo = parseFloat(rangeMatch[1]),
      hi = parseFloat(rangeMatch[2]);
    return val >= lo && val <= hi
      ? "bg-green-600 text-white text-center"
      : "bg-red-600 text-white text-center";
  }
  return "";
}

// ── Request Re-test Button ─────────────────────────────────────────────────
function ReTestButton({ testEventId, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const handleRequest = useCallback(async () => {
    setLoading(true);
    try {
      await axios.get(`/actionitem/request-reset/${testEventId}`);
      toast.success("Re-test requested successfully ✅");
      onSuccess?.();
    } catch (err) {
      toast.error(
        err?.response?.data?.message ?? "Failed to request re-test ❌",
      );
    } finally {
      setLoading(false);
    }
  }, [testEventId, onSuccess]);
  return (
    <button
      onClick={handleRequest}
      disabled={loading}
      className={clsx(
        "rounded bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700",
        loading && "cursor-not-allowed opacity-60",
      )}
    >
      {loading ? "..." : "Request Re-test"}
    </button>
  );
}
ReTestButton.propTypes = {
  testEventId: PropTypes.any,
  onSuccess: PropTypes.func,
};

// ── Submit HOD Button ──────────────────────────────────────────────────────
function SubmitHodButton({ tid, partial, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const handleSubmit = useCallback(async () => {
    setLoading(true);
    try {
      await axios.post(`/actionitem/submit-hod-request?aid=${tid}`);
      toast.success(`Submitted for ${partial ? "Partial " : ""}HOD Review ✅`);
      onSuccess?.();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Submission failed ❌");
    } finally {
      setLoading(false);
    }
  }, [tid, partial, onSuccess]);
  return (
    <button
      onClick={handleSubmit}
      disabled={loading}
      className={clsx(
        "rounded-lg bg-green-600 px-6 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-green-700",
        loading && "cursor-not-allowed opacity-60",
      )}
    >
      {loading
        ? "Submitting..."
        : `Submit For ${partial ? "Partial " : ""}HOD Review`}
    </button>
  );
}
SubmitHodButton.propTypes = {
  tid: PropTypes.any,
  partial: PropTypes.bool,
  onSuccess: PropTypes.func,
};

// ── Info Row ──────────────────────────────────────────────────────────────
function InfoRow({ label, value }) {
  return (
    <tr className="border-b border-gray-200 dark:border-gray-700">
      <td className="border-r border-gray-200 p-2 text-xs font-semibold whitespace-nowrap text-gray-600 dark:border-gray-700 dark:text-gray-400">
        {label}
      </td>
      <td className="p-2 text-xs text-gray-800 dark:text-gray-200">
        {value ?? "—"}
      </td>
    </tr>
  );
}
InfoRow.propTypes = { label: PropTypes.string, value: PropTypes.any };

// ── Main Page ─────────────────────────────────────────────────────────────
export default function DraftReportView() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const hodId = searchParams.get("hod_id") ?? "";

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReport = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ tid: id });
      if (hodId) params.append("hod_id", hodId);
      const res = await axios.get(`/actionitem/view-draft-report?${params}`);
      setReport(res.data?.data ?? res.data ?? null);
    } catch (err) {
      setError(err?.response?.data?.message ?? "Failed to load report.");
    } finally {
      setLoading(false);
    }
  }, [id, hodId]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  if (loading)
    return (
      <Page title="Draft Report">
        <div className="flex h-[60vh] items-center justify-center gap-3 text-gray-500">
          <svg
            className="h-5 w-5 animate-spin text-blue-600"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z"
            />
          </svg>
          Loading Report...
        </div>
      </Page>
    );

  if (error)
    return (
      <Page title="Draft Report">
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

  // ── Destructure ───────────────────────────────────────────────────────
  const {
    trf_product = {},
    nabl,
    size,
    grade,
    batchNo,
    report_status,
    dates = {},
    customer = {},
    received_items = [],
    results = [],
    hod_remark,
    witness,
    witness_detail,
    signatories = [],
    counts = {},
    permissions = [],
  } = report;

  const {
    lrn,
    brn: reference_no,
    ulr,
    condition,
    sealed,
    reportdate: report_date,
  } = trf_product;
  const { start_date, end_date } = dates;
  const {
    left: left_count = 0,
    done: done_count = 0,
    deleted: delete_count = 0,
    total_params: param_count = 0,
    left_my_department: left_my_department_count = 0,
  } = counts;

  // ── Derived flags (matching PHP logic exactly) ─────────────────────────
  const showCustomerBlock = Number(report_status) > 6;
  const sessionPermissions = (localStorage.getItem("userPermissions") || "")
    .split(",")
    .map(p => p.trim())
    .filter(Boolean);

  const hasPermission = (p) =>
    permissions.includes(p) ||
    permissions.includes(Number(p)) ||
    sessionPermissions.includes(String(p));

  const canRequestRetest = hasPermission(180) || hasPermission(181);

  // PHP: if(in_array(180,$perm)||in_array(181,$perm)) if($reportstatus<9) → show Actions <th>
  const showActionsColumn =
    canRequestRetest && report_status < 9;

  // PHP: every row gets the button when permissions + reportstatus < 9
  // Falling back to true if no strict ownership flags are present in the row
  const shouldShowRetestBtn = (row) =>
    showActionsColumn && (
      row.is_my_department === true ||
      row.my_department === 1 ||
      row.can_retest === true ||
      (report.available_actions && report.available_actions.some(a => (a.id ?? a) == row.id)) ||
      (!row.is_my_department && !row.can_retest) // Fallback for APIs with no ownership flags
    );

  const showPartialHod =
    left_my_department_count > 0 &&
    (left_count > 0 || param_count > done_count + delete_count) &&
    done_count > 0;

  const showFullHod =
    left_my_department_count > 0 &&
    !(left_count > 0 || param_count > done_count + delete_count);

  const quantitiesStr = received_items.length
    ? received_items
      .map((q) => `${q.received} ${q.unit ?? ""}`.trim())
      .join(", ")
    : null;

  const conditionMap = { 1: "Good", 2: "Fair", 3: "Poor" };
  const sealedMap = { 0: "Unsealed", 1: "Sealed", 2: "Packed", 3: "NA" };

  const remarkLines = [];
  if (hod_remark) remarkLines.push(hod_remark);
  if ((witness === "1" || witness === 1) && witness_detail)
    remarkLines.push(`The test was witnessed by ${witness_detail}`);

  // NABL Search logic for BDL/ADL Remarks
  const hasBDL = results.some(r => r.nabl_bdl);
  const hasADL = results.some(r => r.nabl_adl);
  if (hasBDL) remarkLines.push("BDL : Below Detection Limit");
  if (hasADL) remarkLines.push("ADL : Above Detection Limit");
  const hasSpecs = Number(typeof trf_product !== "undefined" ? trf_product?.specification_flag : null) === 2 ? false : ((typeof trf_product !== "undefined" && Number(trf_product?.specification_flag) === 1) || results.some((r) => r.specification && r.specification !== "-" && r.specification !== "—"));

  return (
    <Page title={`Draft Report — ${lrn ?? id}`}>
      <div className="transition-content px-[var(--margin-x)] pb-8">
        {/* ── Page Header ───────────────────────────────────────── */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-4 w-4"
              >
                <path
                  fillRule="evenodd"
                  d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z"
                  clipRule="evenodd"
                />
              </svg>
              Back
            </button>
            <h1 className="text-base font-semibold text-gray-800 dark:text-gray-100">
              Final Report
            </h1>
          </div>

          {/*
            PHP: href="exporttestingreport.php?hakuna=tid&what=hid"   → With Letter Head
            PHP: href="exporttestingreportwolh.php?hakuna=tid&what=hid" → Without Letter Head
            React: @react-pdf/renderer generates & downloads PDF client-side
          */}
          <div className="no-print flex items-center gap-2">
            <ExportWithLHButton data={report} />
            <ExportWoLHButton data={report} />
          </div>
        </div>

        {/* ── Report Card ───────────────────────────────────────── */}
        <div className="dark:bg-dark-800 rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700">
          <div className="px-6 py-6">
            {/* NABL logo + heading */}
            <div className="mb-2 flex flex-col items-center gap-1">
              {/* NABL / QAI Logo */}
              {(nabl && nabl !== "0" && nabl !== 0) && (
                <img
                  src={typeof nabl === "object" ? nabl?.logo : "/images/nabl2348.png"}
                  alt="Accreditation Logo"
                  className="h-16 w-auto"
                />
              )}
              <h1 className="text-xl font-bold tracking-wide text-gray-900 underline dark:text-gray-100">
                TEST REPORT
              </h1>
            </div>

            {/* ULR + Ref No */}
            <div className="mb-4 flex justify-between text-xs font-semibold text-gray-700 dark:text-gray-300">
              <span>{nabl && nabl !== "0" && nabl !== 0 && ulr ? `ULR: ${ulr}` : ""}</span>
              <span>{reference_no ?? ""}</span>
            </div>

            {/* ── Customer Info (status > 6) ──────────────────── */}
            {showCustomerBlock && (
              <div className="mb-4 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="w-full text-xs">
                  <tbody>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <td
                        className="w-2/5 border-r border-gray-200 p-3 align-top dark:border-gray-700"
                        rowSpan={7}
                      >
                        <p className="mb-1 font-semibold text-gray-700 dark:text-gray-300">
                          Name and Address of Customer
                        </p>
                        <p className="text-gray-800 dark:text-gray-200">
                          {customer.name}
                        </p>
                        <p className="text-gray-600 dark:text-gray-400">
                          {customer.address}
                        </p>
                        {customer.contact_person && (
                          <p className="mt-1 text-gray-700 dark:text-gray-300">
                            Contact Person: {customer.contact_person}
                          </p>
                        )}
                      </td>
                      <td className="w-1/4 border-r border-gray-200 p-2 font-semibold text-gray-600 dark:border-gray-700 dark:text-gray-400">
                        Laboratory Reference Number (LRN)
                      </td>
                      <td className="p-2 text-gray-800 dark:text-gray-200">
                        {lrn}
                      </td>
                    </tr>
                    <InfoRow
                      label="Date of Receipt"
                      value={formatDate(trf_product.added_on)}
                    />
                    <InfoRow
                      label="Condition, When Received"
                      value={conditionMap[condition] ?? condition}
                    />
                    <InfoRow
                      label="Packing, When Received"
                      value={sealedMap[sealed] ?? sealed}
                    />
                    <InfoRow
                      label="Quantity Received (Approx.)"
                      value={quantitiesStr}
                    />
                    <InfoRow
                      label="Date of Start Of Test"
                      value={formatDate(start_date)}
                    />
                    <InfoRow
                      label="Date of Completion"
                      value={formatDate(end_date)}
                    />
                  </tbody>
                  <tbody>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <td className="border-r border-gray-200 p-2 text-gray-700 dark:border-gray-700 dark:text-gray-300">
                        Sample Identification: {size}
                      </td>
                      <td className="border-r border-gray-200 p-2 font-semibold text-gray-600 dark:border-gray-700 dark:text-gray-400">
                        Date of Reporting
                      </td>
                      <td className="p-2 text-gray-800 dark:text-gray-200">
                        {formatDate(report_date)}
                      </td>
                    </tr>
                    <tr>
                      <td
                        colSpan={3}
                        className="p-2 text-gray-700 dark:text-gray-300"
                      >
                        Sample Particulars: &nbsp; Grade: {grade} &nbsp;{" "}
                        {batchNo}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* ── TEST RESULTS ──────────────────────────────────── */}
            <div className="mb-4">
              <h3 className="mb-2 text-sm font-bold text-gray-800 dark:text-gray-100">
                TEST RESULTS
              </h3>
              <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="w-full text-xs">
                  <thead className="dark:bg-dark-700 bg-gray-100">
                    <tr>
                      {[
                        "S.NO",
                        "PARAMETER",
                        "UNIT",
                        "RESULTS",
                        "TEST METHOD",
                      ].map((h) => (
                        <th
                          key={h}
                          className="border-b border-gray-200 px-3 py-2 text-center font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-300"
                        >
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
                    {results.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="py-8 text-center text-xs text-gray-400"
                        >
                          No test results found.
                        </td>
                      </tr>
                    ) : (
                      results.map((row, idx) => {
                        const resCls = resultColorClass(
                          row.result,
                          row.specification,
                          row.rmin,
                          row.rmax,
                          row.rmininclude,
                          row.rmaxinclude
                        );

                        // Result text with NABL prefix
                        let displayResult = row.result ?? "—";
                        if (row.nabl_bdl) displayResult = `BDL< ${row.minnabl}`;
                        else if (row.nabl_adl) displayResult = `ADL> ${row.maxnabl}`;
                        const showBtn = shouldShowRetestBtn(row);
                        return (
                          <tr
                            key={row.id ?? idx}
                            className="border-b border-gray-100 last:border-0 dark:border-gray-700"
                          >
                            <td className="px-3 py-2 text-center text-gray-700 dark:text-gray-300">
                              {idx + 1}
                            </td>
                            <td className="px-3 py-2 text-gray-800 dark:text-gray-200">
                              {row.parameter}
                            </td>
                            <td className="px-3 py-2 text-center text-gray-700 dark:text-gray-300">
                              {row.unit}
                            </td>
                            <td
                              className={clsx(
                                "px-3 py-2",
                                resCls ||
                                "text-center text-gray-700 dark:text-gray-300",
                              )}
                            >
                              {displayResult}
                            </td>
                            <td className="px-3 py-2 text-center text-gray-700 dark:text-gray-300">
                              {row.method}
                            </td>
                            {hasSpecs && (
                              <td className="px-3 py-2 text-center text-gray-700 dark:text-gray-300">
                                {row.specification ?? "—"}
                              </td>
                            )}
                            {showActionsColumn && (
                              <td className="no-print px-3 py-2 text-center">
                                {showBtn && (
                                  <ReTestButton
                                    testEventId={row.id}
                                    onSuccess={fetchReport}
                                  />
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

            {/* ── Remarks ────────────────────────────────────────── */}
            {remarkLines.length > 0 && (
              <div className="dark:bg-dark-700 mb-4 rounded-lg bg-gray-50 px-4 py-3 text-xs text-gray-700 dark:text-gray-300">
                <strong>Remark:</strong>{" "}
                {remarkLines.map((line, i) => (
                  <span key={i}>
                    {i > 0 && <br />}
                    {line}
                  </span>
                ))}
              </div>
            )}

            {/* ── End of Report ──────────────────────────────────── */}
            <div className="mb-6 text-center text-xs font-semibold text-gray-700 dark:text-gray-300">
              **End of Report**
            </div>

            {/* ── Signatories ─────────────────────────────────────── */}
            {signatories.length > 0 && (
              <div className="mb-6 flex flex-wrap gap-6">
                {signatories.map((signer, i) => (
                  <div key={i} className="min-w-[180px]">
                    {signer.signed ? (
                      <img
                        src={signer.signature_image}
                        alt={`Signed by ${signer.name}`}
                        className="h-16 object-contain"
                      />
                    ) : (
                      <div className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                        <p>{signer.name}</p>
                        <p className="font-normal text-gray-500">
                          {signer.authorize_for}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* ── HOD Submit Actions ──────────────────────────────── */}
            <div className="flex items-center justify-center gap-4 pt-2">
              {showPartialHod && (
                <div className="flex flex-col items-center gap-2 text-center">
                  <p className="text-xs text-gray-500">
                    {left_count} Tests Pending completion &nbsp;|&nbsp;{" "}
                    {param_count - (done_count + delete_count + left_count)}{" "}
                    Tests Pending Assignment
                  </p>
                  <SubmitHodButton
                    tid={id}
                    partial
                    onSuccess={() => navigate(-1)}
                  />
                </div>
              )}
              {showFullHod && !showPartialHod && (
                <SubmitHodButton
                  tid={id}
                  partial={false}
                  onSuccess={() => navigate(-1)}
                />
              )}
              {!showFullHod &&
                !showPartialHod &&
                left_my_department_count === 0 && (
                  <p className="text-xs text-gray-400">Nothing To Submit</p>
                )}
            </div>
          </div>
        </div>
      </div>
    </Page>
  );
}
