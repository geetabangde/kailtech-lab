// ExportReportWoLH.jsx
// PHP equivalent: exporttestingreportwolh.php
// Generates TEST REPORT PDF WITHOUT company letter head
//
// Usage:
//   import { downloadReportWoLH } from "./ExportReportWoLH";
//   downloadReportWoLH(reportData);
//
// Or as a button component:
//   <ExportWoLHButton data={reportData} />

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
import { useState } from "react";

// ── Styles ────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 8,
    paddingTop: 16,
    paddingBottom: 30,
    paddingHorizontal: 28,
    color: "#111",
  },

  // ── Top row: NABL logo right-aligned ────────────────────────────────
  topRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginBottom: 4,
  },
  nablLogo: { width: 60, height: 40, objectFit: "contain" },

  // ── LRN row ──────────────────────────────────────────────────────────
  lrnRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7.5,
    marginBottom: 2,
  },

  // ── Page info row ────────────────────────────────────────────────────
  pageInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
    fontSize: 7.5,
  },

  // ── Report title ─────────────────────────────────────────────────────
  reportTitle: {
    textAlign: "center",
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    textDecoration: "underline",
    marginBottom: 6,
  },

  // ── ULR + Ref No row ─────────────────────────────────────────────────
  ulrRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
    fontSize: 8,
  },
  bold: { fontFamily: "Helvetica-Bold" },

  // ── Customer block (status > 6) ──────────────────────────────────────
  customerBlock: {
    marginBottom: 6,
    borderWidth: 0.5,
    borderColor: "#aaa",
    fontSize: 8,
  },

  // ── Section title ────────────────────────────────────────────────────
  sectionTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    marginBottom: 4,
    marginTop: 4,
  },

  // ── Table ────────────────────────────────────────────────────────────
  table: { width: "100%", borderWidth: 0.5, borderColor: "#aaa" },
  thead: { flexDirection: "row", backgroundColor: "#e8e8e8" },
  tr: { flexDirection: "row", borderTopWidth: 0.5, borderTopColor: "#aaa" },

  // Column widths — no Specifications column in WoLH by default
  thSno: { width: "5%", padding: 3, fontFamily: "Helvetica-Bold", textAlign: "center", borderRightWidth: 0.5, borderRightColor: "#aaa" },
  thParam: { width: "38%", padding: 3, fontFamily: "Helvetica-Bold", borderRightWidth: 0.5, borderRightColor: "#aaa" },
  thUnit: { width: "9%", padding: 3, fontFamily: "Helvetica-Bold", textAlign: "center", borderRightWidth: 0.5, borderRightColor: "#aaa" },
  thResult: { width: "15%", padding: 3, fontFamily: "Helvetica-Bold", textAlign: "center", borderRightWidth: 0.5, borderRightColor: "#aaa" },
  thMethod: { width: "33%", padding: 3, fontFamily: "Helvetica-Bold", textAlign: "center" },

  thSnoSpec: { width: "5%", padding: 3, fontFamily: "Helvetica-Bold", textAlign: "center", borderRightWidth: 0.5, borderRightColor: "#aaa" },
  thParamSpec: { width: "30%", padding: 3, fontFamily: "Helvetica-Bold", borderRightWidth: 0.5, borderRightColor: "#aaa" },
  thUnitSpec: { width: "8%", padding: 3, fontFamily: "Helvetica-Bold", textAlign: "center", borderRightWidth: 0.5, borderRightColor: "#aaa" },
  thResultSpec: { width: "12%", padding: 3, fontFamily: "Helvetica-Bold", textAlign: "center", borderRightWidth: 0.5, borderRightColor: "#aaa" },
  thMethodSpec: { width: "27%", padding: 3, fontFamily: "Helvetica-Bold", textAlign: "center", borderRightWidth: 0.5, borderRightColor: "#aaa" },
  thSpec: { width: "18%", padding: 3, fontFamily: "Helvetica-Bold", textAlign: "center" },

  tdSno: { width: "5%", padding: 3, textAlign: "center", borderRightWidth: 0.5, borderRightColor: "#aaa" },
  tdParam: { width: "38%", padding: 3, borderRightWidth: 0.5, borderRightColor: "#aaa" },
  tdUnit: { width: "9%", padding: 3, textAlign: "center", borderRightWidth: 0.5, borderRightColor: "#aaa" },
  tdResult: { width: "15%", padding: 3, textAlign: "center", borderRightWidth: 0.5, borderRightColor: "#aaa" },
  tdMethod: { width: "33%", padding: 3, textAlign: "center" },

  tdSnoSpec: { width: "5%", padding: 3, textAlign: "center", borderRightWidth: 0.5, borderRightColor: "#aaa" },
  tdParamSpec: { width: "30%", padding: 3, borderRightWidth: 0.5, borderRightColor: "#aaa" },
  tdUnitSpec: { width: "8%", padding: 3, textAlign: "center", borderRightWidth: 0.5, borderRightColor: "#aaa" },
  tdResultSpec: { width: "12%", padding: 3, textAlign: "center", borderRightWidth: 0.5, borderRightColor: "#aaa" },
  tdMethodSpec: { width: "27%", padding: 3, textAlign: "center", borderRightWidth: 0.5, borderRightColor: "#aaa" },
  tdSpec: { width: "18%", padding: 3, textAlign: "center" },

  resultGreen: { backgroundColor: "#008d4c", color: "#fff" },
  resultRed: { backgroundColor: "#cc0000", color: "#fff" },

  // ── Remarks ──────────────────────────────────────────────────────────
  remarkBox: { marginTop: 8, fontSize: 7.5 },

  // ── End of report ────────────────────────────────────────────────────
  endOfReport: {
    textAlign: "center",
    fontFamily: "Helvetica-Bold",
    marginTop: 10,
    marginBottom: 10,
    fontSize: 8,
  },

  // ── Signatories ──────────────────────────────────────────────────────
  signatoryRow: { flexDirection: "row", marginTop: 30, marginBottom: 10 },
  signatoryBox: { flex: 1, fontSize: 7.5, fontFamily: "Helvetica-Bold" },
  signatoryImg: { width: 120, height: 45, objectFit: "contain", marginBottom: 2 },
  signatoryTitle: { fontSize: 7, fontFamily: "Helvetica", color: "#444", marginTop: 2 },
});

// ── Helpers ────────────────────────────────────────────────────────────────
function fmtDate(d) {
  if (!d) return "—";
  try {
    return new Date(d)
      .toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" })
      .replace(/\//g, ".");
  } catch { return d; }
}

function resultStyle(colorFlag) {
  if (colorFlag === "green") return S.resultGreen;
  if (colorFlag === "red") return S.resultRed;
  return {};
}

// ── PDF Document — WITHOUT Letter Head ────────────────────────────────────
function ReportDocWoLH({ data }) {
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
    // WoLH: nabl_logo_url used for top-right logo
    nabl_logo_url,
  } = data;

  const { lrn, brn, ulr, condition, sealed, reportdate } = trf_product;
  const { start_date, end_date } = dates;

  const hasSpecs = Number(typeof trf_product !== "undefined" ? trf_product?.specification_flag : null) === 2 ? false : ((typeof trf_product !== "undefined" && Number(trf_product?.specification_flag) === 1) || results.some((r) => r.specification && r.specification !== "-" && r.specification !== "—"));
  const sealedMap = ["Unsealed", "Sealed", "Packed", "NA"];
  const conditionMap = { 1: "Good", 2: "Fair", 3: "Poor" };

  // Column styles — switch based on hasSpecs
  const THSno = hasSpecs ? S.thSnoSpec : S.thSno;
  const THParam = hasSpecs ? S.thParamSpec : S.thParam;
  const THUnit = hasSpecs ? S.thUnitSpec : S.thUnit;
  const THResult = hasSpecs ? S.thResultSpec : S.thResult;
  const THMethod = hasSpecs ? S.thMethodSpec : S.thMethod;

  const TDSno = hasSpecs ? S.tdSnoSpec : S.tdSno;
  const TDParam = hasSpecs ? S.tdParamSpec : S.tdParam;
  const TDUnit = hasSpecs ? S.tdUnitSpec : S.tdUnit;
  const TDResult = hasSpecs ? S.tdResultSpec : S.tdResult;
  const TDMethod = hasSpecs ? S.tdMethodSpec : S.tdMethod;

  // Remarks
  const remarks = [];
  if (hod_remark && hod_remark.trim()) remarks.push(hod_remark.trim());
  if (witness === "2" && witness_detail)
    remarks.push(`The test was witnessed by ${witness_detail}`);

  // Qty
  const qtyStr = received_items
    .filter((q) => q.received > 0)
    .map((q) => `${q.received} ${q.unit ?? ""}`.trim())
    .join(", ");

  return (
    <Document title={`Test Report — ${lrn ?? ""}`}>
      <Page size="A4" style={S.page}>

        {/* ── NABL logo top-right (PHP: nabltest.png if nabl==1) ── */}
        {nabl === true && (
          <View style={S.topRow}>
            {nabl_logo_url ? (
              <Image src={nabl_logo_url} style={S.nablLogo} />
            ) : (
              // Fallback text badge when image URL not provided
              <View style={{ borderWidth: 1, borderColor: "#003366", padding: 3, borderRadius: 3 }}>
                <Text style={{ fontSize: 7, fontFamily: "Helvetica-Bold", color: "#003366" }}>NABL</Text>
              </View>
            )}
          </View>
        )}

        {/* ── LRN row ────────────────────────────────────────────── */}
        <View style={S.lrnRow}>
          <Text> </Text>
          <Text><Text style={S.bold}>LRN:</Text> {lrn ?? "—"}</Text>
        </View>

        {/* ── Page info row ──────────────────────────────────────── */}
        <View style={S.pageInfoRow}>
          <Text> </Text>
          <Text>Page 1 of 1</Text>
        </View>

        {/* ── Report Title ───────────────────────────────────────── */}
        <Text style={S.reportTitle}>TEST REPORT</Text>

        {/* ── ULR + Ref No ───────────────────────────────────────── */}
        <View style={S.ulrRow}>
          <Text><Text style={S.bold}>ULR:</Text> {ulr ?? ""}</Text>
          <Text style={S.bold}>{brn ?? "KTRC/QF/0708/01"}</Text>
        </View>

        {/* ── Customer Info (report_status > 6) ─────────────────── */}
        {report_status > 6 && (
          <View style={S.customerBlock}>
            <View style={{ flexDirection: "row" }}>
              <View style={{ width: "45%", padding: 4, borderRightWidth: 0.5, borderRightColor: "#aaa" }}>
                <Text style={S.bold}>Name and Address of Customer</Text>
                <Text>{customer.name}</Text>
                <Text style={{ color: "#555" }}>{customer.address}</Text>
                {customer.contact_person && (
                  <Text>Contact Person: {customer.contact_person}</Text>
                )}
              </View>
              <View style={{ flex: 1 }}>
                {[
                  ["Laboratory Reference Number (LRN)", lrn],
                  ["Date of Receipt", fmtDate(trf_product.added_on)],
                  ["Condition, When Received", conditionMap[condition] ?? condition],
                  ["Packing, When Received", sealedMap[sealed] ?? sealed],
                  ["Quantity Received (Approx.)", qtyStr || "—"],
                  ["Date of Start Of Test", fmtDate(start_date)],
                  ["Date of Completion", fmtDate(end_date)],
                ].map(([label, val], i) => (
                  <View key={i} style={{ flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: "#aaa" }}>
                    <Text style={{ width: "52%", padding: 3, fontFamily: "Helvetica-Bold", borderRightWidth: 0.5, borderRightColor: "#aaa" }}>{label}</Text>
                    <Text style={{ flex: 1, padding: 3 }}>{val ?? "—"}</Text>
                  </View>
                ))}
              </View>
            </View>
            <View style={{ borderTopWidth: 0.5, borderTopColor: "#aaa", padding: 4 }}>
              <Text>
                Sample Identification: {size}    |    Sample Particulars: Grade: {grade}    {batchNo}
              </Text>
            </View>
            <View style={{ borderTopWidth: 0.5, borderTopColor: "#aaa", flexDirection: "row", padding: 4 }}>
              <Text style={S.bold}>Date of Reporting: </Text>
              <Text>{fmtDate(reportdate)}</Text>
            </View>
          </View>
        )}

        {/* ── TEST RESULTS ─────────────────────────────────────────*/}
        <Text style={S.sectionTitle}>TEST RESULTS</Text>

        <View style={S.table}>
          {/* Header */}
          <View style={S.thead}>
            <Text style={THSno}>S.NO</Text>
            <Text style={THParam}>PARAMETER</Text>
            <Text style={THUnit}>UNIT</Text>
            <Text style={THResult}>RESULTS</Text>
            <Text style={THMethod}>TEST METHOD</Text>
            {hasSpecs && <Text style={S.thSpec}>SPECIFICATIONS</Text>}
          </View>

          {/* Body rows */}
          {results.map((row, idx) => {
            const rStyle = resultStyle(row.color_flag);
            return (
              <View key={idx} style={S.tr} wrap={false}>
                <Text style={TDSno}>{idx + 1}</Text>
                <Text style={TDParam}>{row.parameter}</Text>
                <Text style={TDUnit}>{row.unit ?? "—"}</Text>
                <Text style={[TDResult, rStyle]}>{row.result ?? "—"}</Text>
                <Text style={TDMethod}>{row.method}</Text>
                {hasSpecs && <Text style={S.tdSpec}>{row.specification ?? "—"}</Text>}
              </View>
            );
          })}
        </View>

        {/* ── Remarks ──────────────────────────────────────────────*/}
        {remarks.length > 0 && (
          <View style={S.remarkBox}>
            <Text>
              <Text style={S.bold}>Remark: </Text>
              {remarks.join("\n")}
            </Text>
          </View>
        )}

        {/* ── End of Report ────────────────────────────────────────*/}
        <Text style={S.endOfReport}>**End of Report**</Text>

        {/* ── Signatories ──────────────────────────────────────────*/}
        {signatories.length > 0 && (
          <View style={S.signatoryRow}>
            {signatories.map((signer, i) => (
              <View key={i} style={S.signatoryBox}>
                {signer.signed && signer.signature_image ? (
                  <Image src={signer.signature_image} style={S.signatoryImg} />
                ) : (
                  <Text>{signer.name}</Text>
                )}
                <Text style={S.signatoryTitle}>{signer.authorize_for}</Text>
              </View>
            ))}
          </View>
        )}

      </Page>
    </Document>
  );
}

ReportDocWoLH.propTypes = { data: PropTypes.object.isRequired };

// ── Download function ──────────────────────────────────────────────────────
// PHP equivalent: clicking "Print Report Without Letter Head" → exporttestingreportwolh.php
export async function downloadReportWoLH(data) {
  const blob = await pdf(<ReportDocWoLH data={data} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Test_Report_${data.trf_product?.lrn ?? data.trf_product?.id ?? "report"}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Button Component ───────────────────────────────────────────────────────
export function ExportWoLHButton({ data, className }) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      await downloadReportWoLH(data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={
        className ??
        "rounded-lg bg-amber-500 px-4 py-2 text-xs font-semibold text-white shadow transition hover:bg-amber-600 disabled:opacity-60"
      }
    >
      {loading ? "Generating..." : "Print Report Without Letter Head"}
    </button>
  );
}

ExportWoLHButton.propTypes = { data: PropTypes.object, className: PropTypes.string };

// Named export of document (for preview)
export { ReportDocWoLH };