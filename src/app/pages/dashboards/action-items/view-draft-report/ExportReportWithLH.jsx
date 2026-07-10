// ExportReportWithLH.jsx
// PHP equivalent: exporttestingreport.php
// Generates TEST REPORT PDF with company letter head

import { useState } from "react"; // ← moved to top (fix: import order)
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  pdf,
  // Font removed — was unused (fix: no-unused-vars)
} from "@react-pdf/renderer";
import PropTypes from "prop-types";

// ── Styles ────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 8,
    paddingTop: 10,
    paddingBottom: 60,
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
    marginBottom: 6,
  },
  lhLogoLeft: { width: 90, height: 35, objectFit: "contain" },
  lhLogoCenter: { width: 50, height: 40, objectFit: "contain" },
  lhLogoRight: { width: 90, height: 35, objectFit: "contain" },
  pageInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
    fontSize: 7.5,
  },
  reportTitle: {
    textAlign: "center",
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    textDecoration: "underline",
    marginBottom: 5,
  },
  ulrRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
    fontSize: 8,
  },
  bold: { fontFamily: "Helvetica-Bold" },
  sectionTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    marginBottom: 4,
    marginTop: 4,
  },
  table: { width: "100%", borderWidth: 0.5, borderColor: "#aaa" },
  thead: { flexDirection: "row", backgroundColor: "#d8e4f0" },
  tr: { flexDirection: "row", borderTopWidth: 0.5, borderTopColor: "#aaa" },

  thSno: {
    width: "5%",
    padding: 3,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    borderRightWidth: 0.5,
    borderRightColor: "#aaa",
  },
  thParam: {
    width: "33%",
    padding: 3,
    fontFamily: "Helvetica-Bold",
    borderRightWidth: 0.5,
    borderRightColor: "#aaa",
  },
  thUnit: {
    width: "8%",
    padding: 3,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    borderRightWidth: 0.5,
    borderRightColor: "#aaa",
  },
  thResult: {
    width: "14%",
    padding: 3,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    borderRightWidth: 0.5,
    borderRightColor: "#aaa",
  },
  thMethod: {
    width: "22%",
    padding: 3,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    borderRightWidth: 0.5,
    borderRightColor: "#aaa",
  },
  thSpec: {
    width: "18%",
    padding: 3,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
  },

  tdSno: {
    width: "5%",
    padding: 3,
    textAlign: "center",
    borderRightWidth: 0.5,
    borderRightColor: "#aaa",
  },
  tdParam: {
    width: "33%",
    padding: 3,
    borderRightWidth: 0.5,
    borderRightColor: "#aaa",
  },
  tdUnit: {
    width: "8%",
    padding: 3,
    textAlign: "center",
    borderRightWidth: 0.5,
    borderRightColor: "#aaa",
  },
  tdResult: {
    width: "14%",
    padding: 3,
    textAlign: "center",
    borderRightWidth: 0.5,
    borderRightColor: "#aaa",
  },
  tdMethod: {
    width: "22%",
    padding: 3,
    textAlign: "center",
    borderRightWidth: 0.5,
    borderRightColor: "#aaa",
  },
  tdSpec: { width: "18%", padding: 3, textAlign: "center" },

  resultGreen: { backgroundColor: "#008d4c", color: "#fff" },
  resultRed: { backgroundColor: "#cc0000", color: "#fff" },
  remarkBox: { marginTop: 8, fontSize: 7.5 },
  endOfReport: {
    textAlign: "center",
    fontFamily: "Helvetica-Bold",
    marginTop: 10,
    marginBottom: 10,
    fontSize: 8,
  },
  signatoryRow: { flexDirection: "row", marginTop: 30, marginBottom: 10 },
  signatoryBox: { flex: 1, fontSize: 7.5, fontFamily: "Helvetica-Bold" },
  signatoryImg: {
    width: 120,
    height: 45,
    objectFit: "contain",
    marginBottom: 2,
  },
  signatoryTitle: {
    fontSize: 7,
    fontFamily: "Helvetica",
    color: "#444",
    marginTop: 2,
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 28,
    right: 28,
    borderTopWidth: 1,
    borderTopColor: "#003366",
    paddingTop: 4,
    fontSize: 6.5,
    textAlign: "center",
    color: "#333",
  },
  termsBox: {
    position: "absolute",
    bottom: 0,
    left: 28,
    right: 28,
    fontSize: 5.5,
    color: "#555",
    borderTopWidth: 0.5,
    borderTopColor: "#ccc",
    paddingTop: 2,
  },
});

// ── Helpers ────────────────────────────────────────────────────────────────
function fmtDate(d) {
  if (!d) return "—";
  try {
    return new Date(d)
      .toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
      .replace(/\//g, ".");
  } catch {
    return d;
  }
}

function resultStyle(colorFlag) {
  if (colorFlag === "green") return S.resultGreen;
  if (colorFlag === "red") return S.resultRed;
  return {};
}

// ── PDF Document — With Letter Head ───────────────────────────────────────
export function ReportDocWithLH({ data }) {
  const {
    trf_product = {},
    // nabl removed — not used inside PDF doc (fix: no-unused-vars)
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
    // counts removed — not used inside PDF doc (fix: no-unused-vars)
    company = {},
    terms_of_service = "",
  } = data;

  const { lrn, brn, ulr, condition, sealed, reportdate } = trf_product;
  const { start_date, end_date } = dates;
  const hasSpecs = Number(typeof trf_product !== "undefined" ? trf_product?.specification_flag : null) === 2 ? false : ((typeof trf_product !== "undefined" && Number(trf_product?.specification_flag) === 1) || results.some((r) => r.specification && r.specification !== "-" && r.specification !== "—"));

  const sealedMap = ["Unsealed", "Sealed", "Packed", "NA"];
  const conditionMap = { 1: "Good", 2: "Fair", 3: "Poor" };

  const remarks = [];
  if (hod_remark && hod_remark.trim()) remarks.push(hod_remark.trim());
  if (witness === "2" && witness_detail)
    remarks.push(`The test was witnessed by ${witness_detail}`);

  const qtyStr = received_items
    .filter((q) => q.received > 0)
    .map((q) => `${q.received} ${q.unit ?? ""}`.trim())
    .join(", ");

  return (
    <Document title={`Test Report — ${lrn ?? ""}`}>
      <Page size="A4" style={S.page}>
        {/* ── Letter Head Header ────────────────────────────────── */}
        <View style={S.lhHeader}>
          {company.logoLeft && (
            <Image src={company.logoLeft} style={S.lhLogoLeft} />
          )}
          {company.logoCenter && (
            <Image src={company.logoCenter} style={S.lhLogoCenter} />
          )}
          {company.logoRight && (
            <Image src={company.logoRight} style={S.lhLogoRight} />
          )}
        </View>

        {/* Page info */}
        <View style={S.pageInfoRow}>
          <Text> </Text>
          <Text>Page 1 of 1</Text>
        </View>

        {/* Report Title */}
        <Text style={S.reportTitle}>TEST REPORT</Text>

        {/* ULR + Ref No */}
        <View style={S.ulrRow}>
          <Text>
            <Text style={S.bold}>ULR:</Text> {ulr ?? ""}
          </Text>
          <Text style={S.bold}>{brn ?? "KTRC/QF/0708/01"}</Text>
        </View>

        {/* ── Customer Info (report_status > 6) ─────────────────── */}
        {report_status > 6 && (
          <View
            style={{ marginBottom: 6, borderWidth: 0.5, borderColor: "#aaa" }}
          >
            <View style={{ flexDirection: "row" }}>
              <View
                style={{
                  width: "45%",
                  padding: 4,
                  borderRightWidth: 0.5,
                  borderRightColor: "#aaa",
                }}
              >
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
                  [
                    "Condition, When Received",
                    conditionMap[condition] ?? condition,
                  ],
                  ["Packing, When Received", sealedMap[sealed] ?? sealed],
                  ["Quantity Received (Approx.)", qtyStr || "—"],
                  ["Date of Start Of Test", fmtDate(start_date)],
                  ["Date of Completion", fmtDate(end_date)],
                ].map(([label, val], i) => (
                  <View
                    key={i}
                    style={{
                      flexDirection: "row",
                      borderBottomWidth: 0.5,
                      borderBottomColor: "#aaa",
                    }}
                  >
                    <Text
                      style={{
                        width: "52%",
                        padding: 3,
                        fontFamily: "Helvetica-Bold",
                        borderRightWidth: 0.5,
                        borderRightColor: "#aaa",
                      }}
                    >
                      {label}
                    </Text>
                    <Text style={{ flex: 1, padding: 3 }}>{val ?? "—"}</Text>
                  </View>
                ))}
              </View>
            </View>
            <View
              style={{
                borderTopWidth: 0.5,
                borderTopColor: "#aaa",
                padding: 4,
              }}
            >
              <Text>
                Sample Identification: {size} | Sample Particulars: Grade:{" "}
                {grade} {batchNo}
              </Text>
            </View>
            <View
              style={{
                borderTopWidth: 0.5,
                borderTopColor: "#aaa",
                flexDirection: "row",
                padding: 4,
              }}
            >
              <Text style={S.bold}>Date of Reporting: </Text>
              <Text>{fmtDate(reportdate)}</Text>
            </View>
          </View>
        )}

        {/* ── TEST RESULTS ─────────────────────────────────────── */}
        <Text style={S.sectionTitle}>TEST RESULTS</Text>
        <View style={S.table}>
          <View style={S.thead}>
            <Text style={S.thSno}>S.NO</Text>
            <Text style={S.thParam}>PARAMETER</Text>
            <Text style={S.thUnit}>UNIT</Text>
            <Text style={S.thResult}>RESULTS</Text>
            <Text style={S.thMethod}>TEST METHOD</Text>
            {hasSpecs && <Text style={S.thSpec}>SPECIFICATIONS</Text>}
          </View>
          {results.map((row, idx) => {
            const rStyle = resultStyle(row.color_flag);
            return (
              <View key={idx} style={S.tr} wrap={false}>
                <Text style={S.tdSno}>{idx + 1}</Text>
                <Text style={S.tdParam}>{row.parameter}</Text>
                <Text style={S.tdUnit}>{row.unit ?? "—"}</Text>
                <Text style={[S.tdResult, rStyle]}>{row.result ?? "—"}</Text>
                <Text style={S.tdMethod}>{row.method}</Text>
                {hasSpecs && (
                  <Text style={S.tdSpec}>{row.specification ?? "—"}</Text>
                )}
              </View>
            );
          })}
        </View>

        {/* ── Remarks ──────────────────────────────────────────── */}
        {remarks.length > 0 && (
          <View style={S.remarkBox}>
            <Text>
              <Text style={S.bold}>Remark: </Text>
              {remarks.join("\n")}
            </Text>
          </View>
        )}

        {/* ── End of Report ─────────────────────────────────────── */}
        <Text style={S.endOfReport}>**End of Report**</Text>

        {/* ── Signatories ───────────────────────────────────────── */}
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

        {/* ── Footer ───────────────────────────────────────────── */}
        <View style={S.footer} fixed>
          <Text>
            {company.address ??
              "Plot No. 141 C, Electronic Complex, Pardeshipura, Indore - 452010"}
          </Text>
          <Text>
            Ph: {company.phone ?? "+91-4787555"} | Email:{" "}
            {company.email ?? "contact@company.net"} | Web:{" "}
            {company.website ?? "www.kailtech.net"}
          </Text>
          {company.cin && <Text>CIN-{company.cin}</Text>}
        </View>

        {/* ── Terms of Service ─────────────────────────────────── */}
        {terms_of_service && (
          <View style={S.termsBox} fixed>
            <Text style={{ fontFamily: "Helvetica-Bold", marginBottom: 1 }}>
              Terms of Service:
            </Text>
            <Text>{terms_of_service}</Text>
          </View>
        )}
      </Page>
    </Document>
  );
}

ReportDocWithLH.propTypes = { data: PropTypes.object.isRequired };

// ── Button Component ───────────────────────────────────────────────────────
// PHP: <a href="exporttestingreport.php?hakuna=tid">Print Report With Letter Head</a>
export function ExportWithLHButton({ data, className }) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const blob = await pdf(<ReportDocWithLH data={data} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Test_Report_LH_${data.trf_product?.lrn ?? data.trf_product?.id ?? "report"}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
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
        "rounded-lg bg-blue-500 px-4 py-2 text-xs font-semibold text-white shadow transition hover:bg-blue-600 disabled:opacity-60"
      }
    >
      {loading ? "Generating..." : "Print Report With Letter Head"}
    </button>
  );
}

ExportWithLHButton.propTypes = {
  data: PropTypes.object,
  className: PropTypes.string,
};
