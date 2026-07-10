// TestReportPdf.jsx
// PHP equivalents:
//   exporttestingreport.php            → PrintWithLHButton
//   exporttestingreportwolh.php        → PrintWithoutLHButton
//   exporttestingreportwolhtwosign.php → PrintWithoutLHTwoSignButton
//
// Usage in HodReportView.jsx:
//   import { PrintWithLHButton, PrintWithoutLHButton, PrintWithoutLHTwoSignButton } from "./TestReportPdf";
//   <PrintWithLHButton report={report} />
//   <PrintWithoutLHButton report={report} />
//   <PrintWithoutLHTwoSignButton report={report} />

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

// Parse PHP compliance_style string → { bg, color }
// e.g. "background:#008d4c!important;color:#ffffff;text-align:center"
function parseColorFlag(styleStr) {
  if (!styleStr) return { bg: null, color: null };
  const bg    = styleStr.match(/background\s*:\s*([^;!]+)/i)?.[1]?.trim() ?? null;
  const color = styleStr.match(/(?:^|;)\s*color\s*:\s*([^;!]+)/i)?.[1]?.trim() ?? null;
  return { bg, color };
}

// ─────────────────────────────────────────────────────────────────────────────
// Normalise report data  (handles both HodReportView & DraftReportView API shapes)
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

  const hasSpecs = Number(trf_product?.specification_flag) === 2 ? false : (Number(trf_product?.specification_flag) === 1 || Number(trf_product?.specification) === 1 || test_results.some((r) => r.specification && r.specification !== "-" && r.specification !== "—"));

  const nablLogo = nablObj?.logo || (
    nablStatus === 1 ? "/images/nabl2348.png" :
      nablStatus === 3 ? "/images/qai.jpeg" : null
  );

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

  return {
    ulr, ktrcRef, displayLRN, receiptDate,
    condition_name, sealed_name, qtyStr,
    start_date, end_date, reportdate, dates,
    customerName, customerAddress, contactPerson, showContact, customerRef,
    productDesc, productName, grade, batchnoClean,
    hasSpecs, test_results, remarkLines, signatories,
    nablLogo, nablStatus, isDraft,
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

  // Results table — landscape (wider cols)
  lsThSno:    { width: "4%",  padding: 3, fontFamily: "Helvetica-Bold", textAlign: "center", fontSize: 7, borderRightWidth: 0.5, borderRightColor: BC },
  lsThParam:  { width: "28%", padding: 3, fontFamily: "Helvetica-Bold", fontSize: 7, borderRightWidth: 0.5, borderRightColor: BC },
  lsThUnit:   { width: "8%",  padding: 3, fontFamily: "Helvetica-Bold", textAlign: "center", fontSize: 7, borderRightWidth: 0.5, borderRightColor: BC },
  lsThResult: { width: "12%", padding: 3, fontFamily: "Helvetica-Bold", textAlign: "center", fontSize: 7, borderRightWidth: 0.5, borderRightColor: BC },
  lsThMethod: { width: "28%", padding: 3, fontFamily: "Helvetica-Bold", textAlign: "center", fontSize: 7, borderRightWidth: 0.5, borderRightColor: BC },
  lsThSpec:   { width: "20%", padding: 3, fontFamily: "Helvetica-Bold", textAlign: "center", fontSize: 7 },
  lsTdSno:    { width: "4%",  padding: 3, textAlign: "center", fontSize: 7, borderRightWidth: 0.5, borderRightColor: BC },
  lsTdParam:  { width: "28%", padding: 3, fontSize: 7, borderRightWidth: 0.5, borderRightColor: BC },
  lsTdUnit:   { width: "8%",  padding: 3, textAlign: "center", fontSize: 7, borderRightWidth: 0.5, borderRightColor: BC },
  lsTdResult: { width: "12%", padding: 3, textAlign: "center", fontSize: 7, borderRightWidth: 0.5, borderRightColor: BC },
  lsTdMethod: { width: "28%", padding: 3, textAlign: "center", fontSize: 7, borderRightWidth: 0.5, borderRightColor: BC },
  lsTdSpec:   { width: "20%", padding: 3, textAlign: "center", fontSize: 7 },

  secTitle:    { fontFamily: "Helvetica-Bold", fontSize: 9, marginBottom: 3, marginTop: 4 },
  endOfReport: { textAlign: "center", fontFamily: "Helvetica-Bold", marginVertical: 10, fontSize: 8 },
  remarkBox:   { marginBottom: 6, fontSize: 7.5 },

  // Signatories
  sigRow:  { flexDirection: "row", flexWrap: "wrap", marginTop: 22, marginBottom: 8 },
  sigBox:  { minWidth: 150, marginRight: 20, fontSize: 7.5 },
  sigImg:  { width: 100, height: 38, objectFit: "contain", marginBottom: 2 },
  sigDig:  { width: 130, height: 52, objectFit: "contain" },
  sigElec: { fontSize: 7, color: "#444", marginTop: 1 },
  sigTit:  { fontSize: 7, color: "#555", marginBottom: 2 },
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

function PdfResultsTable({ data, landscape = false }) {
  const { test_results, hasSpecs } = data;
  const th = landscape
    ? { sno: SS.lsThSno, param: SS.lsThParam, unit: SS.lsThUnit, result: SS.lsThResult, method: SS.lsThMethod, spec: SS.lsThSpec }
    : { sno: SS.thSno,   param: SS.thParam,   unit: SS.thUnit,   result: SS.thResult,   method: SS.thMethod,   spec: SS.thSpec };
  const td = landscape
    ? { sno: SS.lsTdSno, param: SS.lsTdParam, unit: SS.lsTdUnit, result: SS.lsTdResult, method: SS.lsTdMethod, spec: SS.lsTdSpec }
    : { sno: SS.tdSno,   param: SS.tdParam,   unit: SS.tdUnit,   result: SS.tdResult,   method: SS.tdMethod,   spec: SS.tdSpec };

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

function PdfSignatories({ signatories }) {
  if (!signatories.length) return null;
  return (
    <View style={SS.sigRow}>
      {signatories.map((s, i) => (
        <View key={i} style={SS.sigBox}>
          {s.is_signed ? (
            <>
              {s.title ? <Text style={SS.sigTit}>{s.title}</Text> : null}
              {s.sign_image_url      ? <Image src={s.sign_image_url}      style={SS.sigImg} /> : null}
              {s.digital_signature_url ? <Image src={s.digital_signature_url} style={SS.sigDig} /> : null}
              <Text style={SS.sigElec}>Electronically signed by{"\n"}{s.display_name ?? s.name ?? ""}</Text>
            </>
          ) : (
            <>
              {s.title ? <Text style={SS.sigTit}>{s.title}</Text> : null}
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
// 1. PDF WITH LETTER HEAD
// PHP: exporttestingreport.php
// Portrait A4 | KTRC logo left | TC stamp center | KAILTECH right
// Blue bottom border on header | Company footer | Terms of service | DRAFT watermark
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

function DocWithLH({ report }) {
  const data = extractData(report);
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

        {/* Page 1 of 1 */}
        <View style={S1.pageRow}>
          <Text> </Text>
          <Text>Page 1 of 1</Text>
        </View>

        {/* NABL/QAI logo */}
        {data.nablLogo && (
          <View style={{ alignItems: "center", marginBottom: 4 }}>
            <Image src={data.nablLogo} style={{ width: 80, height: 32, objectFit: "contain" }} />
          </View>
        )}

        {/* TEST REPORT */}
        <Text style={S1.title}>TEST REPORT</Text>

        {/* ULR + KTRC ref */}
        <View style={S1.ulrRow}>
          <Text><Text style={SS.bold}>ULR:</Text>{data.nablStatus === 1 && data.ulr ? data.ulr : ""}</Text>
          <Text style={SS.bold}>{data.ktrcRef}</Text>
        </View>

        {/* Customer info */}
        <View style={SS.infoWrap}>
          <View style={{ flexDirection: "row" }}>
            <PdfCustomerLeft data={data} />
            <PdfInfoRows data={data} />
          </View>
          <PdfSampleRows data={data} />
        </View>

        {/* Test results */}
        <Text style={SS.secTitle}>TEST RESULTS</Text>
        <PdfResultsTable data={data} landscape={false} />

        <PdfRemarks remarkLines={data.remarkLines} />
        <Text style={SS.endOfReport}>**End of Report**</Text>
        <PdfSignatories signatories={data.signatories} />

        {/* Footer */}
        <View style={S1.footer} fixed>
          <Text>Plot No. 141 C, Electronic Complex, Pardeshipura, Indore – 452010 (INDIA)  Ph. +91 – 4787555 (30 Lines), 4046055, 4048055</Text>
          <Text>Email : contact@kailtech.net, electronics@kailtech.net    Web : www.kailtech.net</Text>
          <Text>CIN-U73100MP2006PTC019008</Text>
        </View>

        {/* Terms of service */}
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

// ═════════════════════════════════════════════════════════════════════════════
// 2. PDF WITHOUT LETTER HEAD
// PHP: exporttestingreportwolh.php
// Portrait A4 | No logos | "TEST REPORT" centered underlined | Clean layout
// ═════════════════════════════════════════════════════════════════════════════
const S2 = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 8,
    paddingTop: 16,
    paddingBottom: 30,
    paddingHorizontal: 24,
    color: "#111",
  },
  pageRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4, fontSize: 7.5 },
  title:   { textAlign: "center", fontSize: 13, fontFamily: "Helvetica-Bold", textDecoration: "underline", marginBottom: 6 },
  ulrRow:  { flexDirection: "row", justifyContent: "space-between", marginBottom: 6, fontSize: 8 },
});

function DocWithoutLH({ report }) {
  const data = extractData(report);
  return (
    <Document title={`Test Report — ${data.ulr ?? data.displayLRN}`}>
      <Page size="A4" orientation="portrait" style={S2.page}>

        <View style={S2.pageRow}>
          <Text> </Text>
          <Text>Page 1 of 1</Text>
        </View>

        <Text style={S2.title}>TEST REPORT</Text>

        <View style={S2.ulrRow}>
          <Text><Text style={SS.bold}>ULR:</Text>{data.nablStatus === 1 && data.ulr ? data.ulr : ""}</Text>
          <Text style={SS.bold}>{data.ktrcRef}</Text>
        </View>

        <View style={SS.infoWrap}>
          <View style={{ flexDirection: "row" }}>
            <PdfCustomerLeft data={data} />
            <PdfInfoRows data={data} />
          </View>
          <PdfSampleRows data={data} />
        </View>

        <Text style={SS.secTitle}>TEST RESULTS</Text>
        <PdfResultsTable data={data} landscape={false} />

        <PdfRemarks remarkLines={data.remarkLines} />
        <Text style={SS.endOfReport}>**End of Report**</Text>
        <PdfSignatories signatories={data.signatories} />

      </Page>
    </Document>
  );
}
DocWithoutLH.propTypes = { report: PropTypes.object.isRequired };

// ═════════════════════════════════════════════════════════════════════════════
// 3. PDF WITHOUT LETTER HEAD — LANDSCAPE (2 SIGNS)
// PHP: exporttestingreportwolhtwosign.php
// Landscape A4 | TC stamp top-center | LRN top-right
// Wide table | Reviewed By (left) + Authorized By (right) | DRAFT watermark
// ═════════════════════════════════════════════════════════════════════════════
const S3 = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 7.5,
    paddingTop: 12,
    paddingBottom: 24,
    paddingHorizontal: 20,
    color: "#111",
  },
  topRow:  { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 },
  tcBlock: { alignItems: "center" },
  tcStamp: { width: 44, height: 44, objectFit: "contain" },
  tcText:  { fontSize: 7, textAlign: "center", marginTop: 1 },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  title:   { flex: 1, textAlign: "center", fontSize: 12, fontFamily: "Helvetica-Bold", textDecoration: "underline" },
  ulrKtrc: { fontSize: 7.5, width: 160 },
  twoSigRow:  { flexDirection: "row", justifyContent: "space-between", marginTop: 24 },
  sigLeft:    { width: "45%" },
  sigRight:   { width: "45%", alignItems: "flex-end" },
  sigTitle:   { fontSize: 7.5, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  sigName:    { fontSize: 7.5, fontFamily: "Helvetica-Bold" },
  sigAuth:    { fontSize: 7, color: "#555" },
  sigImgSm:   { width: 100, height: 38, objectFit: "contain" },
  sigDigSm:   { width: 120, height: 48, objectFit: "contain" },
  sigElec:    { fontSize: 7, color: "#444" },
});

function DocWithoutLHTwoSign({ report }) {
  const data = extractData(report);
  const { signatories } = data;

  // Split: reviewed = signatories with "review" in title OR even-indexed
  // authorized = signatories with "authoriz" in title OR odd-indexed
  const reviewed   = signatories.filter((s, i) =>
    (s.title ?? "").toLowerCase().includes("review") || (!( (s.title ?? "").toLowerCase().includes("authoriz")) && i % 2 === 0)
  );
  const authorized = signatories.filter((s, i) =>
    (s.title ?? "").toLowerCase().includes("authoriz") || (!((s.title ?? "").toLowerCase().includes("review")) && i % 2 !== 0)
  );

  const renderOneSig = (s) => {
    if (!s) return null;
    return s.is_signed ? (
      <View>
        {s.title ? <Text style={S3.sigTitle}>{s.title}</Text> : null}
        {s.sign_image_url       ? <Image src={s.sign_image_url}       style={S3.sigImgSm} /> : null}
        {s.digital_signature_url ? <Image src={s.digital_signature_url} style={S3.sigDigSm} /> : null}
        <Text style={S3.sigElec}>Electronically signed by{"\n"}{s.display_name ?? s.name ?? ""}</Text>
      </View>
    ) : (
      <View>
        {s.title ? <Text style={S3.sigTitle}>{s.title}</Text> : null}
        <Text style={S3.sigName}>{s.display_name ?? s.name ?? ""}</Text>
        <Text style={S3.sigAuth}>{s.authorizefor ?? ""}</Text>
      </View>
    );
  };

  return (
    <Document title={`Test Report — ${data.ulr ?? data.displayLRN}`}>
      <Page size="A4" orientation="landscape" style={S3.page}>

        {data.isDraft && <Text style={SS.draft} fixed>DRAFT</Text>}

        {/* ── TOP: spacer | TC stamp | LRN top-right ─────────── */}
        <View style={S3.topRow}>
          <View style={{ width: 120 }} />
          <View style={S3.tcBlock}>
            <Image src={`${window.location.origin}/images/tc_stamp.png`} style={S3.tcStamp} />
            <Text style={S3.tcText}>TC-7832</Text>
          </View>
          <View style={{ width: 200, alignItems: "flex-end" }}>
            <Text style={[{ fontSize: 8 }, SS.bold]}>LRN: {data.displayLRN}</Text>
          </View>
        </View>

        {/* ── TITLE ROW: ULR | TEST REPORT | KTRC ref ─────────── */}
        <View style={S3.titleRow}>
          <Text style={S3.ulrKtrc}>
            <Text style={SS.bold}>ULR:</Text>
            {data.nablStatus === 1 && data.ulr ? data.ulr : ""}
          </Text>
          <Text style={S3.title}>TEST REPORT</Text>
          <Text style={[S3.ulrKtrc, SS.bold, { textAlign: "right" }]}>{data.ktrcRef}</Text>
        </View>

        {/* Customer info */}
        <View style={SS.infoWrap}>
          <View style={{ flexDirection: "row" }}>
            <PdfCustomerLeft data={data} />
            <PdfInfoRows data={data} />
          </View>
          <PdfSampleRows data={data} />
        </View>

        {/* Test results (landscape widths) */}
        <Text style={SS.secTitle}>TEST RESULTS</Text>
        <PdfResultsTable data={data} landscape={true} />

        <PdfRemarks remarkLines={data.remarkLines} />
        <Text style={SS.endOfReport}>**End of Report**</Text>

        {/* ── TWO SIGNATORIES SIDE BY SIDE ─────────────────────── */}
        <View style={S3.twoSigRow}>
          <View style={S3.sigLeft}>{renderOneSig(reviewed[0])}</View>
          <View style={S3.sigRight}>{renderOneSig(authorized[0])}</View>
        </View>

      </Page>
    </Document>
  );
}
DocWithoutLHTwoSign.propTypes = { report: PropTypes.object.isRequired };

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
// EXPORTED BUTTONS
// ─────────────────────────────────────────────────────────────────────────────

// Button 1 — With Letter Head (cyan)
export function PrintWithLHButton({ report, className }) {
  const [loading, setLoading] = useState(false);
  const handleClick = async () => {
    setLoading(true);
    try { await downloadPdf(DocWithLH, report, "WithLH"); }
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
PrintWithLHButton.propTypes = { report: PropTypes.object.isRequired, className: PropTypes.string };

// Button 2 — Without Letter Head (amber)
export function PrintWithoutLHButton({ report, className }) {
  const [loading, setLoading] = useState(false);
  const handleClick = async () => {
    setLoading(true);
    try { await downloadPdf(DocWithoutLH, report, "WoLH"); }
    finally { setLoading(false); }
  };
  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={className ?? "rounded bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white shadow transition hover:bg-amber-600 disabled:opacity-60"}
    >
      {loading ? "Generating..." : "Print Report Without Letter Head"}
    </button>
  );
}
PrintWithoutLHButton.propTypes = { report: PropTypes.object.isRequired, className: PropTypes.string };

// Button 3 — Without Letter Head 2 Signs / Landscape (blue)
export function PrintWithoutLHTwoSignButton({ report, className }) {
  const [loading, setLoading] = useState(false);
  const handleClick = async () => {
    setLoading(true);
    try { await downloadPdf(DocWithoutLHTwoSign, report, "WoLH_2Sign"); }
    finally { setLoading(false); }
  };
  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={className ?? "rounded bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow transition hover:bg-blue-700 disabled:opacity-60"}
    >
      {loading ? "Generating..." : "Print Report Without Letter Head (2 Signs)"}
    </button>
  );
}
PrintWithoutLHTwoSignButton.propTypes = { report: PropTypes.object.isRequired, className: PropTypes.string };