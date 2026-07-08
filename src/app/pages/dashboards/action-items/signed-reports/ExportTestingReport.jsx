import { useState } from "react";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer";
import PropTypes from "prop-types";

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

function parseColorFlag(styleStr) {
  if (!styleStr) return { bg: null, color: null };
  const bg    = styleStr.match(/background\s*:\s*([^;!]+)/i)?.[1]?.trim() ?? null;
  const color = styleStr.match(/(?:^|;)\s*color\s*:\s*([^;!]+)/i)?.[1]?.trim() ?? null;
  return { bg, color };
}

// ─────────────────────────────────────────────────────────────────────────────
// Normalise report data
// ─────────────────────────────────────────────────────────────────────────────
function extractData(report) {
  const {
    trf_product    = {},
    nabl: nablObj  = {},
    size,
    grade,
    batchno        = "",
    report_status: rsObj = {},
    dates          = {},
    customer       = {},
    product        = {},
    trf            = {},
    received_items = [],
    test_results   = [],
    remarks: remarksObj = {},
    signatories    = [],
    meta           = {},
  } = report;

  const { brn, ulr, condition_name, sealed_name, reportdate, lrn } = trf_product;
  const nablStatus   = (typeof nablObj === "object" ? nablObj?.status : Number(nablObj)) ?? 0;
  const reportStatus = typeof rsObj === "object" ? (rsObj?.code ?? 0) : (Number(rsObj) || 0);
  const isDraft      = reportStatus < 9;

  const { start_date, end_date } = dates;

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

  const qtyStr = received_items
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
    test_results.some((r) => r.specification && r.specification !== "—");

  const customerName    = customer?.name           ?? "—";
  const customerAddress = customer?.address        ?? "";
  const contactPerson   = customer?.contact_person ?? "";
  const showContact     = Number(trf?.specificpurpose ?? customer?.specific_purpose) === 2;
  const customerRef     = customer?.letterrefno    ?? "";
  const productName     = product?.name            ?? "—";
  const productDesc     = product?.description     ?? size ?? "—";
  const displayLRN      = lrn ?? brn               ?? "—";
  const ktrcRef         = meta?.ktrc_ref           ?? "KTRC/QF/0708/01";
  const batchnoClean    = batchno.replace(/<br\s*\/?>/gi, " ").trim();
  const receiptDate     = fmtDate(trf?.date ?? dates?.receipt_date);
  
  // Use CUTOFF DATE logic for signatories as implemented in PHP
  const cutoffdate = new Date('2025-04-25T14:00:00');
  
  // Find max updated_on from signatures that are signed (status = 1)
  let maxUpdatedOn = null;
  signatories.forEach(s => {
      if (s.is_signed && s.updated_on) {
          const d = new Date(s.updated_on);
          if (!maxUpdatedOn || d > maxUpdatedOn) {
              maxUpdatedOn = d;
          }
      }
  });

  const approvedate = maxUpdatedOn ? maxUpdatedOn : new Date('2025-04-25T14:00:00');
  let finalSignatories = [...signatories];

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

  return {
    ulr, ktrcRef, displayLRN, receiptDate,
    condition_name, sealed_name, qtyStr,
    start_date, end_date, reportdate, dates,
    customerName, customerAddress, contactPerson, showContact, customerRef,
    productDesc, productName, grade, batchnoClean,
    hasSpecs, test_results, remarkLines, signatories: finalSignatories,
    nablStatus, isDraft,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED STYLES
// ─────────────────────────────────────────────────────────────────────────────
const BC = "#999"; // border colour

const SS = StyleSheet.create({
  bold:        { fontFamily: "Helvetica-Bold" },

  // Info table
  infoWrap:    { borderWidth: 0.5, borderColor: BC, marginBottom: 6 },
  infoRow:     { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: BC },
  infoLeft:    { width: "42%", padding: 5, borderRightWidth: 0.5, borderRightColor: BC },
  infoRight:   { flex: 1 },
  infoLabel:   { width: "52%", padding: 3, fontFamily: "Helvetica-Bold", borderRightWidth: 0.5, borderRightColor: BC, fontSize: 7.5 },
  infoVal:     { flex: 1, padding: 3, fontSize: 7.5 },
  infoFull:    { padding: 4, borderTopWidth: 0.5, borderTopColor: BC, fontSize: 7.5 },

  // Results table — portrait
  rTable:      { borderWidth: 0.5, borderColor: BC, marginBottom: 8 },
  thead:       { flexDirection: "row", backgroundColor: "#e8ecf0" },
  tr:          { flexDirection: "row", borderTopWidth: 0.5, borderTopColor: BC },

  thSno:    { width: "5%",  padding: 3, fontFamily: "Helvetica-Bold", textAlign: "center", fontSize: 7.5, borderRightWidth: 0.5, borderRightColor: BC },
  thParam:  { width: "30%", padding: 3, fontFamily: "Helvetica-Bold", fontSize: 7.5, borderRightWidth: 0.5, borderRightColor: BC },
  thUnit:   { width: "8%",  padding: 3, fontFamily: "Helvetica-Bold", textAlign: "center", fontSize: 7.5, borderRightWidth: 0.5, borderRightColor: BC },
  thResult: { width: "14%", padding: 3, fontFamily: "Helvetica-Bold", textAlign: "center", fontSize: 7.5, borderRightWidth: 0.5, borderRightColor: BC },
  thMethod: { width: "25%", padding: 3, fontFamily: "Helvetica-Bold", textAlign: "center", fontSize: 7.5, borderRightWidth: 0.5, borderRightColor: BC },
  thSpec:   { width: "18%", padding: 3, fontFamily: "Helvetica-Bold", textAlign: "center", fontSize: 7.5 },
  tdSno:    { width: "5%",  padding: 3, textAlign: "center", fontSize: 7.5, borderRightWidth: 0.5, borderRightColor: BC },
  tdParam:  { width: "30%", padding: 3, fontSize: 7.5, borderRightWidth: 0.5, borderRightColor: BC },
  tdUnit:   { width: "8%",  padding: 3, textAlign: "center", fontSize: 7.5, borderRightWidth: 0.5, borderRightColor: BC },
  tdResult: { width: "14%", padding: 3, textAlign: "center", fontSize: 7.5, borderRightWidth: 0.5, borderRightColor: BC },
  tdMethod: { width: "25%", padding: 3, textAlign: "center", fontSize: 7.5, borderRightWidth: 0.5, borderRightColor: BC },
  tdSpec:   { width: "18%", padding: 3, textAlign: "center", fontSize: 7.5 },

  secTitle:    { fontFamily: "Helvetica-Bold", fontSize: 9, marginBottom: 3, marginTop: 4 },
  endOfReport: { textAlign: "center", fontFamily: "Helvetica-Bold", marginVertical: 10, fontSize: 8 },
  remarkBox:   { marginBottom: 6, fontSize: 7.5 },

  // Signatories
  sigRow:  { flexDirection: "row", flexWrap: "wrap", marginTop: 22, marginBottom: 8, justifyContent: "space-between" },
  sigRowSingle: { flexDirection: "row", flexWrap: "wrap", marginTop: 22, marginBottom: 8, justifyContent: "flex-start" },
  sigBox:  { minWidth: 150, fontSize: 7.5, flex: 1, alignItems: "center" },
  sigBoxSingle:  { minWidth: 150, fontSize: 7.5, alignItems: "center" },
  sigImg:  { width: 100, height: 38, objectFit: "contain", marginBottom: 2 },
  sigDig:  { width: 130, height: 52, objectFit: "contain" },
  sigElec: { fontSize: 7, color: "#444", marginTop: 1, textAlign: "center" },
  sigTit:  { fontSize: 7.5, color: "#111", fontFamily: "Helvetica-Bold", marginBottom: 4 },
  sigName: { fontFamily: "Helvetica-Bold", fontSize: 7.5 },
  sigAuth: { fontSize: 7, color: "#666" },

  // DRAFT watermark
  draft: {
    position: "absolute",
    top: "32%", left: "8%",
    fontSize: 100,
    fontFamily: "Helvetica-Bold",
    color: "#cccccc",
    opacity: 0.28,
    transform: "rotate(-45deg)",
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Reusable PDF sub-components
// ─────────────────────────────────────────────────────────────────────────────
function PdfCustomerLeft({ data }) {
  return (
    <View style={SS.infoLeft}>
      <Text style={[SS.bold, { fontSize: 7.5, marginBottom: 2 }]}>Name and Address of Customer</Text>
      <Text style={{ fontSize: 7.5 }}>{data.customerName}</Text>
      <Text style={{ fontSize: 7, color: "#444", marginTop: 1 }}>{data.customerAddress}</Text>
      {data.showContact && data.contactPerson
        ? <Text style={{ fontSize: 7, marginTop: 2 }}>Contact Person: {data.contactPerson}</Text>
        : null}
    </View>
  );
}

function PdfInfoRows({ data }) {
  const rows = [
    ["Laboratory Reference Number (LRN)", data.displayLRN],
    ["Date of Receipt",                   data.receiptDate],
    ["Condition, When Received",           data.condition_name  ?? "—"],
    ["Packing, When Received",             data.sealed_name     ?? "—"],
    ["Quantity Received (Approx.)",        data.qtyStr],
    ["Date of Start Of Test",              fmtDate(data.start_date)],
    ["Date of Completion",                 fmtDate(data.end_date)],
    ["Date of Reporting",                  fmtDate(data.reportdate ?? data.dates?.report_date)],
  ];
  return (
    <View style={SS.infoRight}>
      {rows.map(([label, val], i) => (
        <View key={i} style={SS.infoRow}>
          <Text style={SS.infoLabel}>{label}</Text>
          <Text style={SS.infoVal}>{val ?? "—"}</Text>
        </View>
      ))}
    </View>
  );
}

function PdfSampleRows({ data }) {
  return (
    <>
      <View style={SS.infoFull}>
        <Text><Text style={SS.bold}>Sample Identification: </Text>{data.productDesc}</Text>
      </View>
      {data.customerRef && data.customerRef !== "-" && (
        <View style={[SS.infoFull, { borderTopWidth: 0.5, borderTopColor: BC }]}>
          <Text><Text style={SS.bold}>Customer Reference :- </Text>{data.customerRef}</Text>
        </View>
      )}
      <View style={[SS.infoFull, { borderTopWidth: 0.5, borderTopColor: BC }]}>
        <Text>
          <Text style={SS.bold}>Sample Particulars : </Text>
          {data.productName}  Grade: {data.grade ?? ""}  {data.batchnoClean}
        </Text>
      </View>
    </>
  );
}

function PdfResultsTable({ data }) {
  const { test_results, hasSpecs } = data;
  const th = { sno: SS.thSno,   param: SS.thParam,   unit: SS.thUnit,   result: SS.thResult,   method: SS.thMethod,   spec: SS.thSpec };
  const td = { sno: SS.tdSno,   param: SS.tdParam,   unit: SS.tdUnit,   result: SS.tdResult,   method: SS.tdMethod,   spec: SS.tdSpec };

  return (
    <View style={SS.rTable}>
      <View style={SS.thead}>
        <Text style={th.sno}>S.NO</Text>
        <Text style={th.param}>PARAMETER</Text>
        <Text style={th.unit}>UNIT</Text>
        <Text style={th.result}>RESULTS</Text>
        <Text style={th.method}>TEST METHOD</Text>
        {hasSpecs && <Text style={th.spec}>SPECIFICATIONS</Text>}
      </View>
      {test_results.length === 0 ? (
        <View style={SS.tr}>
          <Text style={{ padding: 6, fontSize: 7.5 }}>No test results found.</Text>
        </View>
      ) : (
        test_results.map((row, idx) => {
          const displayResult = row.result?.display_value ?? row.result?.value ?? row.result ?? "—";
          const unitDisplay   = row.unit?.description     ?? row.unit?.name    ?? row.unit   ?? "—";
          const methodName    = row.method?.name          ?? row.method        ?? "—";
          const { bg, color } = parseColorFlag(row.compliance_style);
          const resultStyles  = [td.result];
          if (bg)    resultStyles.push({ backgroundColor: bg });
          if (color) resultStyles.push({ color });

          return (
            <View key={row.id ?? idx} style={SS.tr} wrap={false}>
              <Text style={td.sno}>{row.sno ?? idx + 1}</Text>
              <Text style={td.param}>{row.parameter_name ?? ""}</Text>
              <Text style={td.unit}>{unitDisplay}</Text>
              <Text style={resultStyles}>{displayResult}</Text>
              <Text style={td.method}>{methodName}</Text>
              {hasSpecs && <Text style={td.spec}>{row.specification ?? "—"}</Text>}
            </View>
          );
        })
      )}
    </View>
  );
}

function PdfRemarks({ remarkLines }) {
  if (!remarkLines.length) return null;
  return (
    <View style={SS.remarkBox}>
      <Text><Text style={SS.bold}>Remark: </Text>{remarkLines.join("  ")}</Text>
    </View>
  );
}

import { IMAGE_HOST_API } from "configs/auth.config";

function PdfSignatories({ signatories }) {
  if (!signatories.length) return null;
  const isSingle = signatories.length === 1;
  const getUrl = (url) => {
      if (!url) return undefined;
      let finalUrl = url;
      if (url.startsWith("//")) {
          finalUrl = `https:${url}`;
      } else if (url.startsWith("/")) {
          finalUrl = `${IMAGE_HOST_API}${url}`;
      }
      
      // Use local vite proxy to bypass CORS for react-pdf in local development.
      if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
          if (finalUrl.includes("lims.kailtech.in")) {
              return window.location.origin + finalUrl.replace("https://lims.kailtech.in", "/pdf-proxy");
          }
      }
      return finalUrl;
  };

  return (
    <View style={isSingle ? SS.sigRowSingle : SS.sigRow}>
      {signatories.map((s, i) => (
        <View key={i} style={isSingle ? SS.sigBoxSingle : SS.sigBox}>
          {s.displayTitle ? <Text style={SS.sigTit}>{s.displayTitle}</Text> : null}
          {s.is_signed ? (
            <>
              {s.sign_image_url      ? <Image src={getUrl(s.sign_image_url)}      style={SS.sigImg} /> : null}
              {s.digital_signature_url ? <Image src={getUrl(s.digital_signature_url)} style={SS.sigDig} /> : null}
              <Text style={SS.sigElec}>Electronically signed by{"\n"}{s.display_name ?? s.name ?? ""}</Text>
            </>
          ) : (
            <>
              <Text style={SS.sigName}>{s.display_name ?? s.name ?? ""}</Text>
              <Text style={SS.sigAuth}>{s.authorizefor ?? ""}</Text>
            </>
          )}
        </View>
      ))}
    </View>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// PDF WITH LETTER HEAD
// ═════════════════════════════════════════════════════════════════════════════
const S1 = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 8,
    paddingTop: 10,
    paddingBottom: 96,
    paddingHorizontal: 28,
    color: "#111",
  },
  lhHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1.5,
    borderBottomColor: "#003366",
    paddingBottom: 6,
    marginBottom: 5,
  },
  logoLeft:   { width: 90, height: 36, objectFit: "contain" },
  logoCenter: { width: 52, height: 42, objectFit: "contain" },
  logoRight:  { width: 90, height: 36, objectFit: "contain" },
  tcText:     { textAlign: "center", fontSize: 7.5, marginTop: 1 },
  pageRow:    { flexDirection: "row", justifyContent: "space-between", marginBottom: 3, fontSize: 7.5 },
  title:      { textAlign: "center", fontSize: 13, fontFamily: "Helvetica-Bold", textDecoration: "underline", marginBottom: 5 },
  ulrRow:     { flexDirection: "row", justifyContent: "space-between", marginBottom: 6, fontSize: 8 },
  isoSide: {
    position: "absolute",
    right: -46, bottom: 110,
    fontSize: 7, color: "#555",
    transform: "rotate(90deg)",
    width: 165,
  },
  footer: {
    position: "absolute",
    bottom: 36, left: 28, right: 28,
    borderTopWidth: 1, borderTopColor: "#003366",
    paddingTop: 4, fontSize: 6.5,
    textAlign: "center", color: "#333",
  },
  termsBox: {
    position: "absolute",
    bottom: 4, left: 28, right: 28,
    borderTopWidth: 0.5, borderTopColor: "#bbb",
    paddingTop: 3, fontSize: 5.5, color: "#555", lineHeight: 1.4,
  },
});

export function DocWithLH({ report }) {
  const data = extractData(report);
  
  // Use images logic from PHP script:
  // letterheadwnabltesting.png if NABL=1, qailetterhead.png if NABL=3, letterhead.png otherwise
  // Wait, these images might not exist in React project based on the dir check, 
  // so we fallback to the robust composed letterhead layout (which replaces the large image).
  
  return (
    <Document title={`Test Report — ${data.ulr ?? data.displayLRN}`}>
      <Page size="A4" orientation="portrait" style={S1.page}>
        {data.isDraft && <Text style={SS.draft} fixed>DRAFT</Text>}
        <Text style={S1.isoSide} fixed>An ISO 9001 : 2015 Certified Laboratory</Text>

        {/* ── LETTER HEAD ────────────────────────────────── */}
        <View style={S1.lhHeader} fixed>
          <Image src={`${window.location.origin}/images/ktrc_logo.png`}     style={S1.logoLeft}   />
          <View style={{ alignItems: "center" }}>
            <Image src={`${window.location.origin}/images/tc_stamp.png`}    style={S1.logoCenter} />
            <Text style={S1.tcText}>TC-7832</Text>
          </View>
          <Image src={`${window.location.origin}/images/kailtech_logo.png`} style={S1.logoRight}  />
        </View>

        <View style={S1.pageRow}>
          <Text> </Text>
          <Text>Page 1 of 1</Text>
        </View>

        <Text style={S1.title}>TEST REPORT</Text>

        <View style={S1.ulrRow}>
          <Text><Text style={SS.bold}>ULR:</Text>{data.nablStatus === 1 && data.ulr ? data.ulr : ""}</Text>
          <Text style={SS.bold}>{data.ktrcRef}</Text>
        </View>

        {data.nablStatus === 1 && (
          <View style={{ alignItems: "center", marginBottom: 4 }}>
            <Image src={`${window.location.origin}/images/nabl2348.png`} style={{ width: 140, height: 50, objectFit: "contain" }} />
          </View>
        )}
        
        {data.nablStatus === 3 && (
          <View style={{ alignItems: "center", marginBottom: 4 }}>
            <Image src={`${window.location.origin}/images/qai.jpeg`} style={{ width: 80, height: 32, objectFit: "contain" }} />
          </View>
        )}

        <View style={SS.infoWrap}>
          <View style={{ flexDirection: "row" }}>
            <PdfCustomerLeft data={data} />
            <PdfInfoRows data={data} />
          </View>
          <PdfSampleRows data={data} />
        </View>

        <Text style={SS.secTitle}>TEST RESULTS</Text>
        <PdfResultsTable data={data} />

        <PdfRemarks remarkLines={data.remarkLines} />
        <Text style={SS.endOfReport}>**End of Report**</Text>
        <PdfSignatories signatories={data.signatories} />

        <View style={S1.footer} fixed>
          <Text>Plot No. 141 C, Electronic Complex, Pardeshipura, Indore – 452010 (INDIA)  Ph. +91 – 4787555 (30 Lines), 4046055, 4048055</Text>
          <Text>Email : contact@kailtech.net, electronics@kailtech.net    Web : www.kailtech.net</Text>
          <Text>CIN-U73100MP2006PTC019008</Text>
        </View>

        <View style={S1.termsBox} fixed>
          <Text style={{ fontFamily: "Helvetica-Bold", marginBottom: 1 }}>Terms of Service :</Text>
          <Text>
            1.Sample(s) not drawn by us, unless specified. 2.The results listed in the Test Report are for the submitted samples and tested parameters only.
            3.This Report is issued only after customer&apos;s acceptance of our terms and conditions. 4.Sample is likely to be consumed and/or destructed during testing.
            5.Sample will be disposed after 7 days from the date of issue of Test Report, unless otherwise specified and accepted by us.
            6.This report cannot be reproduced and/or cannot be used in part or full in any media, unless permitted by us in writing.
            7.Liability of our Laboratory is limited to the Invoiced amount only. 8.Reports not given with ULR are not under NABL scope.
            9.All disputes subject to jurisdiction of the courts of Indore(India) only.
          </Text>
        </View>

      </Page>
    </Document>
  );
}
DocWithLH.propTypes = { report: PropTypes.object.isRequired };

// ─────────────────────────────────────────────────────────────────────────────
// Download helper
// ─────────────────────────────────────────────────────────────────────────────
async function downloadPdf(DocComp, report, suffix) {
  const blob = await pdf(<DocComp report={report} />).toBlob();
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `Test_Report_${suffix}_${
    report?.trf_product?.lrn ?? report?.trf_product?.brn ?? "report"
  }.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTED BUTTON
// ─────────────────────────────────────────────────────────────────────────────
export function PrintExportTestingReportButton({ report, className }) {
  const [loading, setLoading] = useState(false);
  const handleClick = async () => {
    setLoading(true);
    try { await downloadPdf(DocWithLH, report, "Signed"); }
    finally { setLoading(false); }
  };
  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={className ?? "rounded bg-cyan-500 px-3 py-1.5 text-xs font-semibold text-white shadow transition hover:bg-cyan-600 disabled:opacity-60"}
    >
      {loading ? "Generating..." : "Print Report With Letter Head"}
    </button>
  );
}
PrintExportTestingReportButton.propTypes = { report: PropTypes.object.isRequired, className: PropTypes.string };
