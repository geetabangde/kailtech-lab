import { renderToStaticMarkup } from "react-dom/server";
import PropTypes from "prop-types";
import { toast } from "sonner";
import {
  getPdfImageUrl,
  HtmlCustomerLeft,
  HtmlInfoRows,
  HtmlSampleRows,
  HtmlResultsTable,
  HtmlRemarks,
  HtmlSignatories
} from "./ExportTestingReport";

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

const toArray = (val) => Array.isArray(val) ? val : (val && typeof val === 'object' ? Object.values(val) : []);

function extractDataTwoSign(report) {
  const {
    trf_product = {},
    nabl: nablObj = {},
    size,
    grade,
    batchno = "",
    report_status: rsObj = {},
    dates = {},
    customer = {},
    product = {},
    trf = {},
    received_items = [],
    test_results = [],
    remarks: remarksObj = {},
    signatories = [],
    meta = {},
  } = report;

  const { brn, ulr, condition_name, sealed_name, reportdate, lrn } = trf_product;
  const nablStatus = (typeof nablObj === "object" ? nablObj?.status : Number(nablObj)) ?? 0;
  const reportStatus = typeof rsObj === "object" ? (rsObj?.code ?? 0) : (Number(rsObj) || 0);
  // In PHP, it is $reportstatus < 10 for draft
  const isDraft = reportStatus < 10;

  const { start_date, end_date } = dates;

  const hodRemark = remarksObj?.hod_remark ?? "";
  const witnessVal = remarksObj?.witness ?? "";
  const witnessDetail = remarksObj?.witness_detail ?? "";
  const bdlRemark = remarksObj?.bdl_remark ?? "";
  const adlRemark = remarksObj?.adl_remark ?? "";

  const remarkLines = [];
  if (hodRemark?.trim()) remarkLines.push(hodRemark.trim());
  if (witnessVal === "1" && witnessDetail) remarkLines.push(`The test was witnessed by ${witnessDetail}`);
  if (bdlRemark) remarkLines.push(bdlRemark);
  if (adlRemark) remarkLines.push(adlRemark);

  const qtyStr = toArray(received_items)
    .filter((q) => (q.received ?? 0) > 0)
    .map((q) => {
      const name = q.quantity_name ?? "";
      if (name.toUpperCase().trim() === "NA") return "NA";
      return `${q.received} ${q.unit_name ?? ""}`.trim();
    })
    .join(", ") || "—";

  const hasSpecs = Number(trf_product?.specification_flag) === 2 ? false : (Number(trf_product?.specification_flag) === 1 || Number(trf_product?.specification) === 1 || toArray(test_results).some((r) => r.specification && r.specification !== "—" && r.specification !== "-"));

  const customerName = customer?.name ?? "—";
  const customerAddress = [customer?.address, customer?.city, customer?.pincode].filter(Boolean).join(", ");
  const contactPerson = customer?.contact_person ?? "";
  const showContact = Number(trf?.specificpurpose ?? customer?.specific_purpose) === 2;
  const customerRef = customer?.letterrefno ?? "";
  const productName = product?.name ?? "—";
  const productDesc = product?.description ?? size ?? "—";
  const displayLRN = lrn ?? brn ?? "—";
  const ktrcRef = meta?.ktrc_ref ?? "KTRC/QF/0708/01";
  const batchnoClean = batchno.replace(/<br\s*\/?>/gi, " ").trim();
  const receiptDate = fmtDate(trf?.date ?? dates?.receipt_date);

  // Use CUTOFF DATE logic for signatories as implemented in PHP
  const cutoffdate = new Date('2025-04-25T14:00:00');

  // Find max updated_on from signatures that are signed (status = 1)
  let maxUpdatedOn = null;
  const safeSignatories = toArray(signatories);
  safeSignatories.forEach(s => {
    if (s.is_signed && s.updated_on) {
      const d = new Date(s.updated_on);
      if (!maxUpdatedOn || d > maxUpdatedOn) {
        maxUpdatedOn = d;
      }
    }
  });

  const approvedate = maxUpdatedOn ? maxUpdatedOn : new Date('2025-04-25T14:00:00');
  let finalSignatories = [...safeSignatories];

  if (approvedate >= cutoffdate && finalSignatories.length > 0) {
    // array_unshift($signatories, array_pop($signatories))
    const lastElement = finalSignatories.pop();
    finalSignatories.unshift(lastElement);
  }

  // Add titles for Reviewed By / Authorized By
  finalSignatories = finalSignatories.map((s, i) => {
    let title = s.title;
    if (approvedate >= cutoffdate) {
      // PHP logic explicitly checks $i==0 for "Reviewed By", else "Authorized By"
      title = i === 0 ? "Reviewed By:" : "Authorized By:";
    }
    return { ...s, displayTitle: title };
  });

  const nablLogo = typeof nablObj === "object" ? nablObj?.logo : null;
  const tid = trf_product?.id ?? report?.id ?? null; // For the End of Report check

  return {
    ulr, ktrcRef, displayLRN, receiptDate,
    condition_name, sealed_name, qtyStr,
    start_date, end_date, reportdate, dates,
    customerName, customerAddress, contactPerson, showContact, customerRef,
    productDesc, productName, grade, batchnoClean,
    hasSpecs, test_results: toArray(test_results), remarkLines, signatories: finalSignatories,
    nablStatus, nablLogo, isDraft, tid
  };
}


// ─────────────────────────────────────────────────────────────────────────────
// HTML WITHOUT LETTER HEAD (TWO SIGN)
// ─────────────────────────────────────────────────────────────────────────────
const S1 = {
  page: {
    fontFamily: "Arial, Helvetica, sans-serif",
    fontSize: '13px',
    color: "#111",
    lineHeight: "1.3",
    position: 'relative',
    padding: "10px 0"
  },
  topRow: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "15px"
  },
  tcBlock: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  tcStamp: {
    width: "58px",
    height: "58px",
    objectFit: "contain"
  },
  pageRow: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "4px",
    fontSize: '12px'
  },
  title: {
    textAlign: "center",
    fontSize: '19px',
    fontWeight: "bold",
    textDecoration: "underline",
    marginBottom: "7px"
  },
  ulrRow: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "8px",
    fontSize: '13px'
  },
  isoSide: {
    position: "absolute",
    right: "-46px", bottom: "110px",
    fontSize: '11px', color: "#555",
    transform: "rotate(90deg)",
    width: "165px",
    transformOrigin: "bottom right",
  },
  draft: {
    position: "absolute",
    top: "32%", left: "8%",
    fontSize: "130px",
    fontWeight: "bold",
    color: "#cccccc",
    opacity: 0.28,
    transform: "rotate(-45deg)",
    zIndex: -1,
  },
};

const SS = {
  bold: { fontWeight: "bold" },
  infoWrap: { border: `1px solid #999`, marginBottom: '8px' },
  secTitle: { fontWeight: 'bold', fontSize: '14px', marginBottom: '4px', marginTop: '5px' },
  endOfReport: { textAlign: 'center', fontWeight: 'bold', margin: '12px 0', fontSize: '13px' },
};

function HtmlDocWithoutLHTwoSign({ report }) {
  const data = extractDataTwoSign(report);

  return (
    <div style={S1.page}>
      {data.isDraft && <div style={S1.draft}>DRAFT</div>}

      {/* Iso side mark */}
      <div style={S1.isoSide}>An ISO 9001 : 2015 Certified Laboratory</div>

      {/* Wrapper Table to handle repeated Header across multiple pages */}
      <table style={{ width: '100%', borderCollapse: 'collapse', border: 'none' }}>
        <thead style={{ display: 'table-header-group' }}>
          <tr>
            <td style={{ border: 'none', padding: 0 }}>
              {/* ── TOP HEADER (Without letter head, only NABL and LRN) ── */}
              <div style={S1.topRow}>
                <div style={{ width: "120px" }} />
                <div style={S1.tcBlock}>
                  {data.nablStatus === 1 && (
                    <>
                      {data.nablLogo ? <img src={getPdfImageUrl(data.nablLogo)} alt="" style={S1.tcStamp} /> : <div style={S1.tcStamp} />}
                    </>
                  )}
                </div>
                <div style={{ width: "120px", textAlign: "right" }}>
                  <span style={{ fontSize: '13px', fontWeight: "bold" }}>LRN: {data.displayLRN}</span>
                </div>
              </div>
            </td>
          </tr>
        </thead>

        <tbody>
          <tr>
            <td style={{ border: 'none', padding: 0 }}>
              <div style={S1.pageRow}>
                <div> </div>
                <div></div>
              </div>

              {data.nablStatus === 3 && (
                <div style={{ display: "flex", justifyContent: "center", marginBottom: "4px" }}>
                  <img src={`${window.location.origin}/images/qai.jpeg`} alt="" style={{ width: "80px", height: "32px", objectFit: "contain" }} />
                </div>
              )}

              <div style={S1.title}>TEST REPORT</div>

              <div style={S1.ulrRow}>
                <div><span style={SS.bold}>ULR:</span>{data.nablStatus === 1 && data.ulr ? data.ulr : ""}</div>
                <div style={SS.bold}>{data.ktrcRef}</div>
              </div>

              <div style={SS.infoWrap}>
                <div style={{ display: "flex" }}>
                  <HtmlCustomerLeft data={data} />
                  <HtmlInfoRows data={data} />
                </div>
                <HtmlSampleRows data={data} />
              </div>

              <div style={SS.secTitle}>TEST RESULTS</div>
              <HtmlResultsTable data={data} />

              <HtmlRemarks remarkLines={data.remarkLines} />

              {String(data.tid) !== "1356" && (
                <div style={SS.endOfReport}>**End of Report**</div>
              )}

              <HtmlSignatories signatories={data.signatories} />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
HtmlDocWithoutLHTwoSign.propTypes = { report: PropTypes.object.isRequired };

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTED BUTTON
// ─────────────────────────────────────────────────────────────────────────────
function printReportWOLHTwoSign(report, title) {
  const bodyHtml = renderToStaticMarkup(<HtmlDocWithoutLHTwoSign report={report} />);

  const full = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${title || 'Test Report'}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    @page { size: A4; margin: 10mm; }
    body  { margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #111; background: #fff; }
    @media print { 
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      head { display: none; }
    }
  </style>
</head>
<body>${bodyHtml}</body>
</html>`;

  const win = window.open('', '_blank', 'width=900,height=700');
  if (!win) { toast.error('Pop-up blocked — please allow pop-ups and try again.'); return; }
  win.document.open();
  win.document.write(full);
  win.document.close();
  win.onafterprint = () => { try { win.close(); } catch (e) { void e; } };
  win.onload = () => {
    win.focus();
    win.print();
  };
  setTimeout(() => {
    try {
      win.focus();
      win.print();
    } catch (e) { void e; }
  }, 800);
}

export function PrintExportTestingReportWOLHTwoSignButton({ report, className }) {
  const btnClass = className ?? "rounded bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white shadow transition hover:bg-orange-600 inline-block";

  return (
    <button onClick={() => printReportWOLHTwoSign(report, 'Test Report')} className={btnClass}>
      Print Report WOLH (Two Signatures)
    </button>
  );
}
PrintExportTestingReportWOLHTwoSignButton.propTypes = { report: PropTypes.object.isRequired, className: PropTypes.string };
