// Import Dependencies
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "utils/axios";

// Local Imports
import { Page } from "components/shared/Page";
import { Card } from "components/ui";
import {
  //PrintWithLHButton, // Keeping for reference if needed
  PrintWithoutLHTwoSignButton,
} from "./TestReportPdf";
import { PrintExportTestingReportButton } from "../signed-reports/ExportTestingReport";
import { PrintExportTestingReportWOLHButton } from "../signed-reports/exporttestingreportwolh";

// ----------------------------------------------------------------------
// Route: /dashboards/action-items/final-reports/view?tid=49506&hid=52927
// PHP:   testreport.php?hakuna=tid&what=hid
// API:   GET /actionitem/view-test-report?tid=:tid&hid=:hid
// ----------------------------------------------------------------------

export default function FinalReportDetail() {
  const [searchParams] = useSearchParams();
  const tid = searchParams.get("tid");
  const hid = searchParams.get("hid");

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ── Fetch report data ───────────────────────────────────────────────────
  // GET /actionitem/view-test-report?tid=:tid&hid=:hid
  useEffect(() => {
    if (!tid) { setError("Missing report ID."); setLoading(false); return; }
    const fetchReport = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({ tid });
        if (hid) params.append("hid", hid);
        const res = await axios.get(`/actionitem/view-test-report?${params.toString()}`);
        const d = res.data?.data ?? res.data ?? null;

        // Fetch customer address if address_id exists
        const custId = d?.customer?.id;
        const addrId = d?.customer?.address_id;
        if (custId && addrId) {
          try {
            const addrRes = await axios.get(`/people/get-customers-address/${custId}`);
            const addrList = addrRes.data?.data ?? [];
            const found = addrList.find((a) => String(a.id) === String(addrId));
            if (found) {
              if (!d.customer) d.customer = {};
              d.customer.address = found.address;
            }
          } catch (e) {
            console.error("Failed to fetch customer address:", e);
          }
        }

        setReport(d);
      } catch (err) {
        setError(err?.response?.data?.message ?? "Failed to load report.");
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [tid, hid]);

  // ── Loading ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Page title="Final Report">
        <div className="flex h-[60vh] items-center justify-center gap-3 text-gray-500">
          <svg className="h-5 w-5 animate-spin text-blue-600" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z" />
          </svg>
          Loading report…
        </div>
      </Page>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (error || !report) {
    return (
      <Page title="Final Report">
        <div className="flex h-60 items-center justify-center rounded-xl border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-sm font-medium text-red-600 dark:text-red-400">
            ⚠ {error ?? "Report not found."}
          </p>
        </div>
      </Page>
    );
  }

  // ── Destructure for display ──────────────────────────────────────────────
  const trfProduct = report.trf_product ?? {};
  const product = report.product ?? {};
  const customer = report.customer ?? {};
  const dates = report.dates ?? {};
  const toArray = (val) => Array.isArray(val) ? val : (val && typeof val === 'object' ? Object.values(val) : []);
  const testResults = toArray(report.test_results);
  const signatories = toArray(report.signatories);
  const remarks = report.remarks ?? {};
  const nablStatus = report.nabl?.status ?? 0;
  const hasSpecs = testResults.some((r) => r.specification && r.specification !== "—");
  const reportStatus = report.report_status?.code ?? 0;

  return (
    <Page title={`Final Report — ${trfProduct.ulr ?? trfProduct.lrn ?? tid}`}>
      <div className="transition-content px-[var(--margin-x)] pb-5">
        <Card className="overflow-hidden">

          {/* ── Header ──────────────────────────────────────────────────── */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-5 py-4 dark:border-dark-500">
            <h3 className="text-base font-semibold text-gray-800 dark:text-dark-100">
              Final Report
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              {/* PHP: Print Report With Letter Head */}
              <PrintExportTestingReportButton report={report} />
              {/* PHP: Print Report Without Letter Head */}
              <PrintExportTestingReportWOLHButton report={report} />
              {/* PHP: Print Report Without Letter Head (2 Signs) */}
              <PrintWithoutLHTwoSignButton report={report} />
            </div>
          </div>

          <div className="px-5 py-5">

            {/* ── NABL / QAI logo ─────────────────────────────────────── */}
            {nablStatus === 1 && (
              <div className="mb-4 flex justify-center">
                <img src={report.nabl?.logo || "/images/nabl2348.png"} alt="NABL" className="h-24 w-auto object-contain" />
              </div>
            )}
            {nablStatus === 3 && (
              <div className="mb-4 flex justify-center">
                <img src="/images/qai.jpeg" alt="QAI" className="h-24 w-auto object-contain" />
              </div>
            )}

            {/* ── TEST REPORT title + ULR + KTRC ref ──────────────────── */}
            <h2 className="mb-1 text-center text-lg font-bold underline">TEST REPORT</h2>
            <div className="mb-4 flex justify-between text-sm">
              {nablStatus === 1 && trfProduct.ulr
                ? <span><strong>ULR:</strong> {trfProduct.ulr}</span>
                : <span />
              }
              <span className="font-semibold">{report.meta?.ktrc_ref ?? "KTRC/QF/0708/01"}</span>
            </div>

            {/* ── Info Table ───────────────────────────────────────────── */}
            <div className="mb-5 overflow-x-auto rounded-lg border border-gray-300 dark:border-dark-500">
              <table className="w-full border-collapse text-sm">
                <tbody>
                  <tr>
                    {/* Left: Customer + Sample info (rowspan) */}
                    <td className="w-[40%] border-r border-gray-300 p-3 align-top dark:border-dark-500" rowSpan={8}>
                      <p className="mb-1 font-semibold">Name and Address of Customer</p>
                      <p>{customer.name ?? "—"}</p>
                      <p>{customer.address ?? ""}</p>
                      {Number(report.trf?.specificpurpose) === 2 && customer.contact_person && (
                        <p className="mt-1 text-xs">Contact Person: {customer.contact_person}</p>
                      )}
                    </td>
                    <InfoRow label="Laboratory Reference Number (LRN)" value={trfProduct.lrn ?? trfProduct.brn ?? "—"} />
                  </tr>
                  <InfoTr label="Date of Receipt" value={fmtDate(report.trf?.date ?? dates.receipt_date)} />
                  <InfoTr label="Condition, When Received" value={trfProduct.condition_name ?? "—"} />
                  <InfoTr label="Packing, When Received" value={trfProduct.sealed_name ?? "—"} />
                  <InfoTr label="Quantity Received (Approx.)" value={buildQtyStr(report.received_items)} />
                  <InfoTr label="Date of Start Of Test" value={fmtDate(dates.start_date)} />
                  <InfoTr label="Date of Completion" value={fmtDate(dates.end_date)} />
                  <InfoTr label="Date of Reporting" value={fmtDate(trfProduct.reportdate ?? dates.report_date)} />

                  {/* Sample rows full width */}
                  <tr>
                    <td colSpan={3} className="border-t border-gray-300 p-2 text-sm dark:border-dark-500">
                      <strong>Sample Identification: </strong>{product.description ?? trfProduct.size ?? "—"}
                    </td>
                  </tr>
                  {customer.letterrefno && customer.letterrefno !== "-" && (
                    <tr>
                      <td colSpan={3} className="border-t border-gray-300 p-2 text-sm dark:border-dark-500">
                        <strong>Customer Reference :- </strong>{customer.letterrefno}
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td colSpan={3} className="border-t border-gray-300 p-2 text-sm dark:border-dark-500">
                      <strong>Sample Particulars: </strong>
                      {product.name ?? "—"} &nbsp; Grade: {report.grade ?? "—"} &nbsp;
                      {(report.batchno ?? "").replace(/<br\s*\/?>/gi, " ")}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* ── TEST RESULTS ─────────────────────────────────────────── */}
            <h4 className="mb-2 text-sm font-bold">TEST RESULTS</h4>
            <div className="mb-5 overflow-x-auto rounded-lg border border-gray-300 dark:border-dark-500">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-100 dark:bg-dark-700">
                    <th className="border-b border-r border-gray-300 px-3 py-2 text-center text-xs dark:border-dark-500">S.NO</th>
                    <th className="border-b border-r border-gray-300 px-3 py-2 text-left   text-xs dark:border-dark-500">PARAMETER</th>
                    <th className="border-b border-r border-gray-300 px-3 py-2 text-center text-xs dark:border-dark-500">UNIT</th>
                    <th className="border-b border-r border-gray-300 px-3 py-2 text-center text-xs dark:border-dark-500">RESULTS</th>
                    <th className="border-b border-r border-gray-300 px-3 py-2 text-center text-xs dark:border-dark-500">TEST METHOD</th>
                    {hasSpecs && (
                      <th className="border-b border-gray-300 px-3 py-2 text-center text-xs dark:border-dark-500">SPECIFICATIONS</th>
                    )}
                    {reportStatus < 9 && (
                      <th className="border-b border-gray-300 px-3 py-2 text-center text-xs dark:border-dark-500">ACTIONS</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {testResults.length === 0 ? (
                    <tr>
                      <td colSpan={hasSpecs ? 6 : 5} className="py-8 text-center text-sm text-gray-400">
                        No test results found.
                      </td>
                    </tr>
                  ) : (
                    testResults.map((row, idx) => {
                      const displayResult = row.result?.display_value ?? row.result?.value ?? row.result ?? "—";
                      const unitDisplay = row.unit?.description ?? row.unit?.name ?? row.unit ?? "—";
                      const methodName = row.method?.name ?? row.method ?? "—";
                      const { bg, color } = parseColorFlag(row.compliance_style);
                      return (
                        <tr key={row.id ?? idx} className="border-t border-gray-200 dark:border-dark-500">
                          <td className="border-r border-gray-200 px-3 py-2 text-center text-xs dark:border-dark-500">{row.sno ?? idx + 1}</td>
                          <td className="border-r border-gray-200 px-3 py-2 text-xs dark:border-dark-500">{row.parameter_name ?? "—"}</td>
                          <td className="border-r border-gray-200 px-3 py-2 text-center text-xs dark:border-dark-500">{unitDisplay}</td>
                          <td
                            className="border-r border-gray-200 px-3 py-2 text-center text-xs font-semibold dark:border-dark-500"
                            style={{ backgroundColor: bg ?? undefined, color: color ?? undefined }}
                          >
                            {displayResult}
                          </td>
                          <td className="border-r border-gray-200 px-3 py-2 text-center text-xs dark:border-dark-500">{methodName}</td>
                          {hasSpecs && (
                            <td className="border-r border-gray-200 px-3 py-2 text-center text-xs dark:border-dark-500">{row.specification ?? "—"}</td>
                          )}
                          {reportStatus < 9 && (
                            <td className="px-3 py-2 text-center text-xs">
                              <button
                                className="rounded bg-primary-600 px-2 py-1 text-xs font-semibold text-white transition hover:bg-primary-700"
                                onClick={() => {
                                  // TODO: request re-test API call
                                  console.log("Request re-test for testeventdata id:", row.id);
                                }}
                              >
                                Request Re-test
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* ── Remarks ──────────────────────────────────────────────── */}
            <RemarkSection remarks={remarks} />

            {/* ── End of Report ────────────────────────────────────────── */}
            <p className="my-4 text-center text-sm font-bold">**End of Report**</p>

            {/* ── Signatories ──────────────────────────────────────────── */}
            {signatories.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-10">
                {signatories.map((s, i) => (
                  <div key={i} className="min-w-[200px]">
                    {s.title && (
                      <p className="mb-2 text-sm font-semibold text-gray-600 dark:text-dark-300">{s.title}</p>
                    )}
                    {s.is_signed ? (
                      <>
                        {s.sign_image_url && (
                          <img src={s.sign_image_url} alt="signature" className="mb-2 h-16 w-36 object-contain object-left" />
                        )}
                        {s.digital_signature_url && (
                          <img src={s.digital_signature_url} alt="digital-sig" className="mb-1 h-28 w-56 object-contain object-left" />
                        )}
                      </>
                    ) : (
                      <>
                        <p className="font-semibold text-sm">{s.display_name ?? s.name ?? "—"}</p>
                        <p className="text-xs text-gray-500">{s.authorizefor ?? ""}</p>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}

          </div>
        </Card>
      </div>
    </Page>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Small helper sub-components
// ─────────────────────────────────────────────────────────────────────────────

function InfoRow({ label, value }) {
  return (
    <>
      <td className="border-b border-gray-300 px-3 py-1.5 text-xs font-semibold dark:border-dark-500 w-[30%]">{label}</td>
      <td className="border-b border-gray-300 px-3 py-1.5 text-xs dark:border-dark-500">{value ?? "—"}</td>
    </>
  );
}

function InfoTr({ label, value }) {
  return (
    <tr>
      <InfoRow label={label} value={value} />
    </tr>
  );
}

function RemarkSection({ remarks }) {
  const hodRemark = remarks?.hod_remark ?? "";
  const witnessVal = remarks?.witness ?? "";
  const witnessDetail = remarks?.witness_detail ?? "";
  const bdlRemark = remarks?.bdl_remark ?? "";
  const adlRemark = remarks?.adl_remark ?? "";

  const lines = [];
  if (hodRemark?.trim()) lines.push(hodRemark.trim());
  if (witnessVal === "1" && witnessDetail) lines.push(`The test was witnessed by ${witnessDetail}`);
  if (bdlRemark) lines.push(bdlRemark);
  if (adlRemark) lines.push(adlRemark);

  if (!lines.length) return null;
  return (
    <div className="mb-4 rounded-lg bg-gray-50 px-4 py-3 text-sm dark:bg-dark-800">
      <strong>Remark: </strong>{lines.join("  ")}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Utilities (same as TestReportPdf.jsx)
// ─────────────────────────────────────────────────────────────────────────────

function fmtDate(d) {
  if (!d) return "—";
  try {
    return new Date(d)
      .toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" })
      .replace(/\//g, ".");
  } catch { return d; }
}

function parseColorFlag(styleStr) {
  if (!styleStr) return { bg: null, color: null };
  const bg = styleStr.match(/background\s*:\s*([^;!]+)/i)?.[1]?.trim() ?? null;
  const color = styleStr.match(/(?:^|;)\s*color\s*:\s*([^;!]+)/i)?.[1]?.trim() ?? null;
  return { bg, color };
}

function buildQtyStr(receivedItems = []) {
  const str = receivedItems
    .filter((q) => (q.received ?? 0) > 0)
    .map((q) => {
      const name = q.quantity_name ?? "";
      if (name.toUpperCase().trim() === "NA") return "NA";
      return `${q.received} ${q.unit_name ?? ""}`.trim();
    })
    .join(", ");
  return str || "—";
}