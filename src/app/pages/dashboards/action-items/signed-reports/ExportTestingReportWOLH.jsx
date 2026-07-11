import { renderToStaticMarkup } from "react-dom/server";
import PropTypes from "prop-types";
import { toast } from "sonner";
import {
  extractData,
  getPdfImageUrl,
  HtmlCustomerLeft,
  HtmlInfoRows,
  HtmlSampleRows,
  HtmlResultsTable,
  HtmlRemarks
} from "./ExportTestingReport";

// ─────────────────────────────────────────────────────────────────────────────
// HTML WITHOUT LETTER HEAD
// ─────────────────────────────────────────────────────────────────────────────
const S1 = {
  page: {
    fontFamily: "Arial, Helvetica, sans-serif",
    fontSize: "8.5px",
    color: "#111",
    lineHeight: "1.3",
    position: 'relative',
    paddingLeft: "0px",
    paddingRight: "0px",
    paddingTop: "10px",
    paddingBottom: "10px",
  },
  topRow: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "15px"
  },
  tcBlock: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  tcStamp: {
    width: "145px",
    height: "125px",
    objectFit: "contain"
  },
  pageRow: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "4px",
    fontSize: "8.5px"
  },
  title: {
    textAlign: "center",
    fontSize: "15px",
    fontWeight: "bold",
    textDecoration: "underline",
    marginBottom: "7px"
  },
  ulrRow: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "8px",
    fontSize: "8.5px"
  },
  isoSide: {
    position: "absolute",
    right: "-30px", bottom: "110px",
    fontSize: "8.5px", color: "#555",
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
  // Signature overrides — same look as letter head version
  sigRow: { display: 'flex', flexWrap: 'wrap', marginTop: '25px', marginBottom: '8px', justifyContent: 'space-between' },
  sigRowSingle: { display: 'flex', flexWrap: 'wrap', marginTop: '25px', marginBottom: '8px', justifyContent: 'flex-start' },
  sigBox: { minWidth: '150px', fontSize: '8.5px', flex: 1, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  sigBoxSingle: { minWidth: '150px', fontSize: '8.5px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  sigImg: { width: '150px', height: '58px', objectFit: 'contain', marginBottom: '2px' },
  sigDig: { width: '180px', height: '78px', objectFit: 'contain' },
  sigElec: { fontSize: '8px', color: '#444', marginTop: '1px', textAlign: 'center' },
  sigTit: { fontSize: '9px', color: '#111', fontWeight: 'bold', marginBottom: '5px' },
  sigName: { fontWeight: 'bold', fontSize: '8.5px' },
  sigAuth: { fontSize: '8px', color: '#666' },
};

const SS = {
  bold: { fontWeight: "bold" },
  infoWrap: { border: `1px solid #999`, marginBottom: '8px' },
  secTitle: { fontWeight: 'bold', fontSize: '10px', marginBottom: '4px', marginTop: '5px' },
  endOfReport: { textAlign: 'center', fontWeight: 'bold', margin: '12px 0', fontSize: '8.5px' },
};

// Local signatories renderer — uses larger NABL-style logo sizing & 8.5px text
function HtmlSignatoriesWOLH({ signatories }) {
  if (!signatories.length) return null;
  const isSingle = signatories.length === 1;

  return (
    <div style={isSingle ? S1.sigRowSingle : S1.sigRow}>
      {signatories.map((s, i) => (
        <div key={i} style={isSingle ? S1.sigBoxSingle : S1.sigBox}>
          {s.displayTitle ? <div style={S1.sigTit}>{s.displayTitle}</div> : null}
          {s.is_signed ? (
            <>
              {s.sign_image_url ? <img src={getPdfImageUrl(s.sign_image_url)} alt="" style={S1.sigImg} /> : null}
              {s.digital_signature_url ? <img src={getPdfImageUrl(s.digital_signature_url)} alt="" style={S1.sigDig} /> : null}
            </>
          ) : (
            <>
              <div style={S1.sigName}>{s.display_name ?? s.name ?? ''}</div>
              <div style={S1.sigAuth}>{s.authorizefor ?? ''}</div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
HtmlSignatoriesWOLH.propTypes = { signatories: PropTypes.array.isRequired };

function HtmlDocWithoutLH({ report }) {
  const data = extractData(report);

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
                <div style={{ width: "190px" }} />
                <div style={S1.tcBlock}>
                  {data.nablStatus === 1 && (
                    <>
                      {data.nablLogo ? <img src={getPdfImageUrl(data.nablLogo)} alt="" style={S1.tcStamp} /> : <div style={S1.tcStamp} />}
                    </>
                  )}
                </div>
                <div style={{ width: "190px", textAlign: "right" }}>
                  <span style={{ fontSize: "8.5px", fontWeight: "bold" }}>LRN: {data.displayLRN}</span>
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
              <div style={SS.endOfReport}>**End of Report**</div>
              <HtmlSignatoriesWOLH signatories={data.signatories} />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
HtmlDocWithoutLH.propTypes = { report: PropTypes.object.isRequired };

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTED BUTTON
// ─────────────────────────────────────────────────────────────────────────────
function printReportWOLH(report, title) {
  const bodyHtml = renderToStaticMarkup(<HtmlDocWithoutLH report={report} />);

  const full = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${title || 'Test Report'}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    @page { size: A4; margin: 8mm 6mm; }
    body  { margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; font-size: 8.5px; color: #111; background: #fff; }
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

export function PrintExportTestingReportWOLHButton({ report, className }) {
  const btnClass = className ?? "rounded bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white shadow transition hover:bg-orange-600 inline-block";

  return (
    <button onClick={() => printReportWOLH(report, 'Test Report')} className={btnClass}>
      Print Report Without Letter Head
    </button>
  );
}
PrintExportTestingReportWOLHButton.propTypes = { report: PropTypes.object.isRequired, className: PropTypes.string };