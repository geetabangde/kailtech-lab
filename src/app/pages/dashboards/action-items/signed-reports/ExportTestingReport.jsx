import { renderToStaticMarkup } from "react-dom/server";
import PropTypes from "prop-types";
import { toast } from "sonner";
import { IMAGE_HOST_API } from "configs/auth.config";

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


export const getPdfImageUrl = (url) => {
  if (!url) return undefined;
  let finalUrl = url;
  if (url.startsWith("//")) {
    finalUrl = `https:${url}`;
  } else if (url.startsWith("/")) {
    finalUrl = `${IMAGE_HOST_API}${url}`;
  }

  // React PDF fetches image bytes, so cross-origin report images need a
  // same-origin proxy unless this app is being served from lims.kailtech.in.
  const imageOrigin = new URL(IMAGE_HOST_API).origin;
  const currentOrigin = window.location.origin;
  const imageUrl = new URL(finalUrl, imageOrigin);
  if (import.meta.env.DEV && imageUrl.origin === imageOrigin && currentOrigin !== imageOrigin) {
    finalUrl = `${currentOrigin}/pdf-proxy${imageUrl.pathname}${imageUrl.search}`;
  }

  return finalUrl;
};

// ─────────────────────────────────────────────────────────────────────────────
// Normalise report data
// ─────────────────────────────────────────────────────────────────────────────
const toArray = (val) => Array.isArray(val) ? val : (val && typeof val === 'object' ? Object.values(val) : []);

export function extractData(report) {
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
  const isDraft = reportStatus < 9;

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

  const hasSpecs =
    trf_product?.specification_flag === 1 ||
    Number(trf_product?.specification) === 1 ||
    toArray(test_results).some((r) => r.specification && r.specification !== "—");

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
      // If only 1 signature, it should be Reviewed & Authorized By
      if (finalSignatories.length === 1) {
        title = "Reviewed & Authorized By:";
      } else {
        title = i === 0 ? "Reviewed By:" : "Authorized By:";
      }
    }
    return { ...s, displayTitle: title };
  });

  const nablLogo = typeof nablObj === "object" ? nablObj?.logo : null;

  return {
    ulr, ktrcRef, displayLRN, receiptDate,
    condition_name, sealed_name, qtyStr,
    start_date, end_date, reportdate, dates,
    customerName, customerAddress, contactPerson, showContact, customerRef,
    productDesc, productName, grade, batchnoClean,
    hasSpecs, test_results: toArray(test_results), remarkLines, signatories: finalSignatories,
    nablStatus, nablLogo, isDraft,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// HTML PRINT STYLES
// ─────────────────────────────────────────────────────────────────────────────
const BC = '#999'; // border colour

const SS = {
  bold: { fontWeight: 'bold' },

  infoWrap: { border: `1px solid ${BC}`, marginBottom: '8px' },
  infoRow: { display: 'flex', borderBottom: `1px solid ${BC}` },
  infoLeft: { width: '42%', padding: '6px', borderRight: `1px solid ${BC}`, boxSizing: 'border-box' },
  infoRight: { flex: 1, display: 'flex', flexDirection: 'column' },
  infoLabel: { width: '52%', padding: '4px', fontWeight: 'bold', borderRight: `1px solid ${BC}`, fontSize: '11px', boxSizing: 'border-box' },
  infoVal: { flex: 1, padding: '4px', fontSize: '11px', boxSizing: 'border-box' },
  infoFull: { padding: '5px', borderTop: `1px solid ${BC}`, fontSize: '11px', boxSizing: 'border-box' },

  rTable: { width: '100%', borderCollapse: 'collapse', marginBottom: '10px', tableLayout: 'fixed' },
  thead: { backgroundColor: '#ffffff' },
  th: { padding: '4px', fontWeight: 'bold', textAlign: 'center', fontSize: '11px', border: `1px solid ${BC}` },
  td: { padding: '4px', textAlign: 'center', fontSize: '11px', border: `1px solid ${BC}` },

  secTitle: { fontWeight: 'bold', fontSize: '12px', marginBottom: '4px', marginTop: '5px' },
  endOfReport: { textAlign: 'center', fontWeight: 'bold', margin: '12px 0', fontSize: '11px' },
  remarkBox: { marginBottom: '8px', fontSize: '11px' },

  sigRow: { display: 'flex', flexWrap: 'wrap', marginTop: '25px', marginBottom: '8px', justifyContent: 'space-between' },
  sigRowSingle: { display: 'flex', flexWrap: 'wrap', marginTop: '25px', marginBottom: '8px', justifyContent: 'flex-start' },
  sigBox: { minWidth: '150px', fontSize: '11px', flex: 1, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  sigBoxSingle: { minWidth: '150px', fontSize: '11px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  sigImg: { width: '150px', height: '58px', objectFit: 'contain', marginBottom: '2px' },
  sigDig: { width: '180px', height: '78px', objectFit: 'contain' },
  sigElec: { fontSize: '9px', color: '#444', marginTop: '1px', textAlign: 'center' },
  sigTit: { fontSize: '10px', color: '#111', fontWeight: 'bold', marginBottom: '5px' },
  sigName: { fontWeight: 'bold', fontSize: '11px' },
  sigAuth: { fontSize: '9px', color: '#666' },

  draft: {
    position: 'absolute',
    top: '32%', left: '8%',
    fontSize: '130px',
    fontWeight: 'bold',
    color: '#cccccc',
    opacity: 0.28,
    transform: 'rotate(-45deg)',
    zIndex: -1,
  },
};

export function HtmlCustomerLeft({ data }) {
  return (
    <div style={SS.infoLeft}>
      <div style={{ ...SS.bold, fontSize: '11px', marginBottom: '2px' }}>Name and Address of Customer</div>
      <div style={{ fontSize: '11px' }}>{data.customerName}</div>
      <div style={{ fontSize: '11px' }}>{data.customerAddress}</div>
      {data.showContact && data.contactPerson
        ? <div style={{ fontSize: '9px', marginTop: '2px' }}>Contact Person: {data.contactPerson}</div>
        : null}
    </div>
  );
}

export function HtmlInfoRows({ data }) {
  const rows = [
    ['Laboratory Reference Number (LRN)', data.displayLRN],
    ['Date of Receipt', data.receiptDate],
    ['Condition, When Received', data.condition_name ?? '—'],
    ['Packing, When Received', data.sealed_name ?? '—'],
    ['Quantity Received (Approx.)', data.qtyStr],
    ['Date of Start Of Test', fmtDate(data.start_date)],
    ['Date of Completion', fmtDate(data.end_date)],
    ['Date of Reporting', fmtDate(data.reportdate ?? data.dates?.report_date)],
  ];
  return (
    <div style={SS.infoRight}>
      {rows.map(([label, val], i) => (
        <div key={i} style={{ ...SS.infoRow, borderBottom: i === rows.length - 1 ? 'none' : SS.infoRow.borderBottom }}>
          <div style={SS.infoLabel}>{label}</div>
          <div style={SS.infoVal}>{val ?? '—'}</div>
        </div>
      ))}
    </div>
  );
}

export function HtmlSampleRows({ data }) {
  return (
    <>
      <div style={SS.infoFull}>
        <span style={SS.bold}>Sample Identification: </span>{data.productDesc}
      </div>
      {data.customerRef && data.customerRef !== '-' && (
        <div style={{ ...SS.infoFull }}>
          <span style={SS.bold}>Customer Reference :- </span>{data.customerRef}
        </div>
      )}
      <div style={{ ...SS.infoFull }}>
        <span style={SS.bold}>Sample Particulars : </span>
        {data.productName}  Grade: {data.grade ?? ''}  {data.batchnoClean}
      </div>
    </>
  );
}

export function HtmlResultsTable({ data }) {
  const { test_results, hasSpecs } = data;
  return (
    <table style={SS.rTable}>
      <thead style={SS.thead}>
        <tr>
          <th style={{ ...SS.th, width: '5%' }}>S.NO</th>
          <th style={{ ...SS.th, width: '30%', textAlign: 'left' }}>PARAMETER</th>
          <th style={{ ...SS.th, width: '8%' }}>UNIT</th>
          <th style={{ ...SS.th, width: '14%' }}>RESULTS</th>
          <th style={{ ...SS.th, width: '25%' }}>TEST METHOD</th>
          {hasSpecs && <th style={{ ...SS.th, width: '18%' }}>SPECIFICATIONS</th>}
        </tr>
      </thead>
      <tbody>
        {test_results.length === 0 ? (
          <tr>
            <td colSpan={hasSpecs ? 6 : 5} style={{ padding: '6px', fontSize: '11px', textAlign: 'center', border: `1px solid ${BC}` }}>No test results found.</td>
          </tr>
        ) : (
          test_results.map((row, idx) => {
            const displayResult = row.result?.display_value ?? row.result?.value ?? row.result ?? '—';
            const unitDisplay = row.unit?.description ?? row.unit?.name ?? row.unit ?? '—';
            const methodName = row.method?.name ?? row.method ?? '—';
            const resultStyles = { ...SS.td };

            return (
              <tr key={row.id ?? idx} style={{ pageBreakInside: 'avoid' }}>
                <td style={{ ...SS.td, width: '5%' }}>{row.sno ?? idx + 1}</td>
                <td style={{ ...SS.td, width: '30%', textAlign: 'left' }}>{row.parameter_name ?? ''}</td>
                <td style={{ ...SS.td, width: '8%' }}>{unitDisplay}</td>
                <td style={resultStyles}>{displayResult}</td>
                <td style={{ ...SS.td, width: '25%' }}>{methodName}</td>
                {hasSpecs && <td style={{ ...SS.td, width: '18%' }}>{row.specification ?? '—'}</td>}
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  );
}

export function HtmlRemarks({ remarkLines }) {
  if (!remarkLines.length) return null;
  return (
    <div style={SS.remarkBox}>
      <span style={SS.bold}>Remark: </span>{remarkLines.join('  ')}
    </div>
  );
}

export function HtmlSignatories({ signatories }) {
  if (!signatories.length) return null;
  const isSingle = signatories.length === 1;

  return (
    <div style={isSingle ? SS.sigRowSingle : SS.sigRow}>
      {signatories.map((s, i) => (
        <div key={i} style={isSingle ? SS.sigBoxSingle : SS.sigBox}>
          {s.displayTitle ? <div style={SS.sigTit}>{s.displayTitle}</div> : null}
          {s.is_signed ? (
            <>
              {s.sign_image_url ? <img src={getPdfImageUrl(s.sign_image_url)} alt="" style={SS.sigImg} /> : null}
              {s.digital_signature_url ? <img src={getPdfImageUrl(s.digital_signature_url)} alt="" style={SS.sigDig} /> : null}
            </>
          ) : (
            <>
              <div style={SS.sigName}>{s.display_name ?? s.name ?? ''}</div>
              <div style={SS.sigAuth}>{s.authorizefor ?? ''}</div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// HTML WITH LETTER HEAD
// ═════════════════════════════════════════════════════════════════════════════
const S1 = {
  page: {
    fontFamily: 'Arial, Helvetica, sans-serif',
    fontSize: '11px',
    color: '#111',
    lineHeight: '1.3',
    position: 'relative',
    paddingLeft: '16px',
    paddingRight: '16px',
  },
  lhHeader: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    border: 'none',
    paddingBottom: '8px',
    marginBottom: '7px',
  },
  logoLeft: { width: '190px', height: '85px', objectFit: 'contain' },
  logoCenter: { width: '115px', height: '100px', objectFit: 'contain' },
  logoRight: { width: '230px', height: '120px', objectFit: 'contain' },
  pageRow: { display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '10px' },
  title: { textAlign: 'center', fontSize: '17px', fontWeight: 'bold', textDecoration: 'underline', marginBottom: '7px' },
  ulrRow: { display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '11px' },
  isoSide: {
    position: 'absolute',
    right: '-46px', bottom: '110px',
    fontSize: '9px', color: '#555',
    transform: 'rotate(90deg)',
    width: '165px',
    transformOrigin: 'bottom right',
  },
  footer: {
    borderTop: '1px solid #003366',
    paddingTop: '5px', fontSize: '9px',
    textAlign: 'center', color: '#333',
  },
  termsBox: {
    borderTop: '1px solid #bbb',
    paddingTop: '4px', fontSize: '8px', color: '#555', lineHeight: '1.4',
    marginTop: '4px'
  },
};

export function HtmlDocWithLH({ report }) {
  const data = extractData(report);

  return (
    <div style={S1.page}>
      {data.isDraft && <div style={SS.draft}>DRAFT</div>}
      <div style={S1.isoSide}>An ISO 9001 : 2015 Certified Laboratory</div>

      {/* Wrapper Table to handle repeated Header and Footer across multiple pages */}
      <table style={{ width: '100%', borderCollapse: 'collapse', border: 'none' }}>
        <thead style={{ display: 'table-header-group' }}>
          <tr>
            <td style={{ border: 'none', padding: 0 }}>
              {/* ── LETTER HEAD ────────────────────────────────── */}
              <div style={S1.lhHeader}>
                <img src={`${window.location.origin}/images/krtc.jpg`} alt="" style={S1.logoLeft} />
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {data.nablLogo ? <img src={getPdfImageUrl(data.nablLogo)} alt="" style={S1.logoCenter} /> : <div style={S1.logoCenter} />}
                </div>
                <img src={`${window.location.origin}/images/logo.png`} alt="" style={S1.logoRight} />
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
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '4px' }}>
                  <img src={`${window.location.origin}/images/qai.jpeg`} alt="" style={{ width: '80px', height: '32px', objectFit: 'contain' }} />
                </div>
              )}

              <div style={S1.title}>TEST REPORT</div>

              <div style={S1.ulrRow}>
                <div><span style={SS.bold}>ULR:</span>{data.nablStatus === 1 && data.ulr ? data.ulr : ''}</div>
                <div style={SS.bold}>{data.ktrcRef}</div>
              </div>

              <div style={SS.infoWrap}>
                <div style={{ display: 'flex' }}>
                  <HtmlCustomerLeft data={data} />
                  <HtmlInfoRows data={data} />
                </div>
                <HtmlSampleRows data={data} />
              </div>

              <div style={SS.secTitle}>TEST RESULTS</div>
              <HtmlResultsTable data={data} />

              <HtmlRemarks remarkLines={data.remarkLines} />
              <div style={SS.endOfReport}>**End of Report**</div>
              <HtmlSignatories signatories={data.signatories} />
            </td>
          </tr>
        </tbody>

        <tfoot style={{ display: 'table-footer-group' }}>
          <tr>
            <td style={{ border: 'none', padding: 0 }}>
              <div style={{ height: '15px' }}></div>
              <div style={S1.footer}>
                <div>Plot No. 141 C, Electronic Complex, Pardeshipura, Indore – 452010 (INDIA)  Ph. +91 – 4787555 (30 Lines), 4046055, 4048055</div>
                <div>Email : contact@kailtech.net, electronics@kailtech.net    Web : www.kailtech.net</div>
                <div>CIN-U73100MP2006PTC019008</div>
              </div>

              <div style={S1.termsBox}>
                <div style={{ fontWeight: 'bold', marginBottom: '1px' }}>Terms of Service :</div>
                <div>
                  1.Sample(s) not drawn by us, unless specified. 2.The results listed in the Test Report are for the submitted samples and tested parameters only.
                  3.This Report is issued only after customer&apos;s acceptance of our terms and conditions. 4.Sample is likely to be consumed and/or destructed during testing.
                  5.Sample will be disposed after 7 days from the date of issue of Test Report, unless otherwise specified and accepted by us.
                  6.This report cannot be reproduced and/or cannot be used in part or full in any media, unless permitted by us in writing.
                  7.Liability of our Laboratory is limited to the Invoiced amount only. 8.Reports not given with ULR are not under NABL scope.
                  9.All disputes subject to jurisdiction of the courts of Indore(India) only.
                </div>
              </div>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
HtmlDocWithLH.propTypes = { report: PropTypes.object.isRequired };

export function printReport(report, title) {
  const bodyHtml = renderToStaticMarkup(<HtmlDocWithLH report={report} />);

  const full = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${title || 'Test Report'}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    @page { size: A4; margin: 12mm 14mm; }
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

export function PrintExportTestingReportButton({ report, className }) {
  const btnClass = className ?? 'rounded bg-cyan-500 px-3 py-1.5 text-xs font-semibold text-white shadow transition hover:bg-cyan-600 inline-block';

  return (
    <button onClick={() => printReport(report, 'Test Report')} className={btnClass}>
      Print Report With Letter Head
    </button>
  );
}
PrintExportTestingReportButton.propTypes = { report: PropTypes.object.isRequired, className: PropTypes.string };