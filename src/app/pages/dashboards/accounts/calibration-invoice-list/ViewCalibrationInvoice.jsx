// ViewCalibrationInvoice.jsx — Calibration Invoice List
// Route: /dashboards/accounts/calibration-invoice-list/view/:id
// logic: same approach as testing-invoices (print window + grouping)

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router";
import { renderToStaticMarkup } from "react-dom/server";
import axios from "utils/axios";
import { toast } from "sonner";
import { Page } from "components/shared/Page";
import { parseUserPermissions } from "utils/permissions";
import logo from "assets/krtc.jpg";

// ─── Open invoice in a print window → user saves as PDF ─────────────────────
function printInvoice(templateProps, withLH, logoSrc, pageTitle) {
  const bodyHtml = renderToStaticMarkup(
    <InvoicePrintTemplate
      {...templateProps}
      withLH={withLH}
      logoSrc={logoSrc}
    />,
  );

  const full = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${pageTitle || templateProps.inv?.invoiceno || "Invoice"}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    @page { size: A4; margin: 10mm; }
    body  { margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #111; background: #fff; }
    @media print { 
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      table { page-break-inside: auto; }
      tr { page-break-inside: avoid; break-inside: avoid; page-break-after: auto; }
    }
    table  { border-collapse: collapse; width: 100%; margin-bottom: 8px; table-layout: fixed; }
    th, td { border: 1px solid #000; padding: 5px 7px; font-size: 11px; vertical-align: middle; word-break: break-word; overflow: hidden; }
    th     { background: #f3f4f6; text-align: center; font-weight: bold; }
    td.right  { text-align: right; }
    td.center { text-align: center; }
    td.nob    { border: none; }
  </style>
</head>
<body>${bodyHtml}</body>
</html>`;

  const win = window.open("", "_blank", "width=900,height=700");
  if (!win) {
    toast.error("Pop-up blocked — please allow pop-ups and try again.");
    return;
  }
  win.document.open();
  win.document.write(full);
  win.document.close();
  win.onafterprint = () => {
    try {
      win.close();
    } catch (e) {
      void e;
    }
  };
  win.onload = () => {
    win.focus();
    win.print();
  };
  setTimeout(() => {
    try {
      win.focus();
      win.print();
    } catch (e) {
      void e;
    }
  }, 800);
}

// ─── Shared inline style tokens ──────────────────────────────────────────────
const S = {
  wrap: {
    fontFamily: "Arial,Helvetica,sans-serif",
    fontSize: 12,
    color: "#111",
    backgroundColor: "#fff",
    padding: "16px 20px",
    width: "100%",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginBottom: 8,
    tableLayout: "fixed",
  },
  th: { textAlign: "center", backgroundColor: "#f3f4f6" },
  td: { verticalAlign: "middle" },
  tdR: { textAlign: "right", verticalAlign: "middle" },
  tdC: { textAlign: "center", verticalAlign: "middle" },
  tdNB: { border: "none", verticalAlign: "middle" },
  label: { fontWeight: "bold" },
};

const f2 = (v) => parseFloat(v ?? 0).toFixed(2);
const fmtDate = (d) =>
  d && d !== "0000-00-00 00:00:00"
    ? new Date(d).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
    : "";

// ─── Number to words ─────────────────────────────────────────────────────────
function numberToWords(n) {
  if (n === 0) return "zero";
  const ones = [
    "",
    "one",
    "two",
    "three",
    "four",
    "five",
    "six",
    "seven",
    "eight",
    "nine",
    "ten",
    "eleven",
    "twelve",
    "thirteen",
    "fourteen",
    "fifteen",
    "sixteen",
    "seventeen",
    "eighteen",
    "nineteen",
  ];
  const tens = [
    "",
    "",
    "twenty",
    "thirty",
    "forty",
    "fifty",
    "sixty",
    "seventy",
    "eighty",
    "ninety",
  ];
  function words(num) {
    if (num === 0) return "";
    if (num < 20) return ones[num] + " ";
    if (num < 100)
      return (
        tens[Math.floor(num / 10)] +
        (num % 10 ? " " + ones[num % 10] : "") +
        " "
      );
    if (num < 1000)
      return ones[Math.floor(num / 100)] + " hundred " + words(num % 100);
    if (num < 100000)
      return words(Math.floor(num / 1000)) + "thousand " + words(num % 1000);
    if (num < 10000000)
      return words(Math.floor(num / 100000)) + "lakh " + words(num % 100000);
    return words(Math.floor(num / 10000000)) + "crore " + words(num % 10000000);
  }
  const result = words(Math.round(n)).trim();
  return result.charAt(0).toUpperCase() + result.slice(1);
}

// ─── Print template ──────────────────────────────────────────────────────────
function InvoicePrintTemplate({
  inv,
  addr,
  items,
  qrUrl,
  signUrl,
  digitalSignUrl,
  withLH,
  companyInfo,
  logoSrc,
  states = [],
}) {
  const statecode = !isNaN(inv.statecode)
    ? String(inv.statecode).padStart(2, "0")
    : inv.statecode;
  const isSGST = String(statecode) === "23";
  const matchedState = states.find(
    (s) =>
      String(s.gst_code).padStart(2, "0") ===
      String(statecode).padStart(2, "0"),
  );
  const stateLabel = inv.statename ?? matchedState?.state ?? statecode ?? "";
  const finalTotal = parseFloat(inv.finaltotal ?? 0);
  const isFoc = inv.invoiceno === "FOC";
  const isNormalPo = inv.potype === "Normal";
  const hasMeter = items.some((it) => it.meter_option == 1);
  const status = Number(inv.status);
  const safeQrUrl = qrUrl && qrUrl.startsWith("data:") ? qrUrl : qrUrl;

  const totalQty = items.reduce((s, it) => s + (parseFloat(it.qty) || 0), 0);
  const otherCharges =
    (parseFloat(inv.witnesscharges) || 0) +
    (parseFloat(inv.samplehandling) || 0) +
    (parseFloat(inv.sampleprep) || 0) +
    (parseFloat(inv.freight) || 0) +
    (parseFloat(inv.mobilisation) || 0);

  const HeaderSection = () => (
    <>
      {withLH && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginBottom: 8,
            gap: 4,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 12,
              width: "100%",
            }}
          >
            <img
              src={logoSrc || companyInfo?.branding?.logo || logo}
              alt="Logo"
              style={{ height: 60, width: "auto" }}
            />
            <div style={{ flex: 1, textAlign: "right" }}>
              <p
                style={{
                  fontFamily: "monospace",
                  fontSize: 10,
                  fontStyle: "italic",
                  color: "#555",
                  margin: 0,
                }}
              >
                NABL Accredited as per IS/ISO/IEC 17025 (Certificate Nos.
                TC-7832 &amp; CC-2348),
                <br />
                BIS Recognized &amp; ISO 9001 Certified Test &amp; Calibration
                Laboratory
              </p>
            </div>
          </div>
          <div
            style={{
              fontSize: 20,
              fontWeight: "bold",
              color: "navy",
              textAlign: "left",
              marginTop: 4,
            }}
          >
            {companyInfo?.company?.name ||
              "Kailtech Test And Research Centre Pvt. Ltd."}
          </div>
        </div>
      )}

      <div style={{ textAlign: "center", marginBottom: 8, marginTop: 80 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: "bold",
            textTransform: "uppercase",
          }}
        >
          TAX INVOICE
        </div>
        <div
          style={{
            fontSize: 11,
            fontWeight: "bold",
            textTransform: "uppercase",
            marginTop: 4,
          }}
        >
          For {inv.typeofinvoice || ""} Charges
        </div>
        <div
          style={{
            fontSize: 11,
            fontWeight: "bold",
            textTransform: "uppercase",
            marginTop: 2,
          }}
        >
          ORIGINAL FOR RECIPIENT
        </div>
      </div>
    </>
  );

  return (
    <div style={S.wrap}>
      <HeaderSection />

      <table style={S.table}>
        <tbody>
          <tr>
            <td style={{ ...S.td, width: "64%" }} colSpan={2}>
              <div style={S.label}>Customer:</div>
              <strong>{inv.customername}</strong>
              <br />
              <div style={{ marginTop: 2 }}>
                {addr.address ? (
                  <>
                    {addr.address}
                    <br />
                    {[addr.city, addr.pincode].filter(Boolean).join(", ")}
                  </>
                ) : (
                  inv.address
                )}
              </div>
              <div style={{ marginTop: 4 }}>
                <span style={S.label}>State name: </span>
                {stateLabel}&nbsp;&nbsp;
                <span style={S.label}>State code: </span>
                {!isNaN(inv.statecode) ? statecode : "NA"}
              </div>
              <div>
                <span style={S.label}>GSTIN/UIN: </span>
                {inv.gstno}&nbsp;&nbsp;
                <span style={S.label}>PAN: </span>
                {inv.pan}
              </div>
              {inv.concern_person && (
                <div style={{ fontSize: 10, color: "#555" }}>
                  Kind Attn. {inv.concern_person}
                </div>
              )}
            </td>
            <td
              style={{
                ...S.td,
                width: status === 2 && safeQrUrl ? "20%" : "36%",
                borderRight: status === 2 && safeQrUrl ? "none" : undefined,
              }}
              colSpan={status === 2 && safeQrUrl ? 2 : 3}
            >
              <div>
                <span style={S.label}>Invoice No.: </span>
                {inv.invoiceno}
              </div>
              <div>
                <span style={S.label}>Date: </span>
                {fmtDate(inv.approved_on)}
              </div>
              <div>
                <span style={S.label}>P.O. No. / Date: </span>
                {inv.ponumber}
              </div>
            </td>
            {status === 2 && safeQrUrl && (
              <td style={{ ...S.td, borderLeft: "none", width: "16%" }}>
                <div style={{ border: "2px solid #000", overflow: "hidden" }}>
                  <img src={safeQrUrl} alt="QR" style={{ width: "100%" }} />
                </div>
              </td>
            )}
          </tr>
        </tbody>
      </table>

      <table style={S.table}>
        <colgroup>
          <col style={{ width: "8%" }} />
          <col style={{ width: isNormalPo ? "56%" : "80%" }} />
          <col style={{ width: "10%" }} />
          {isNormalPo && (
            <>
              <col style={{ width: "12%" }} />
              <col style={{ width: "14%" }} />
            </>
          )}
        </colgroup>
        <thead>
          <tr>
            <th>S. No.</th>
            <th>Description</th>
            <th>{hasMeter ? "Meter's" : "No's"}</th>
            {isNormalPo && (
              <>
                <th>Rate</th>
                <th>Amount</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => {
            let displayAmount = f2(item.amount);
            if (!isFoc && isNormalPo) {
              const itemAmountOld = parseFloat(item.amount) || 0;
              const itemOtherCharge =
                otherCharges > 0 && totalQty > 0
                  ? parseFloat(
                    (
                      (otherCharges / totalQty) *
                      parseFloat(item.qty || 0)
                    ).toFixed(2),
                  )
                  : 0;
              displayAmount = f2(itemAmountOld + itemOtherCharge);
            }
            return (
              <tr key={item.id ?? idx} style={{ backgroundColor: "#fff" }}>
                <td className="center">{idx + 1}</td>
                <td dangerouslySetInnerHTML={{ __html: item.description }} />
                <td className="center">
                  {item.meter_option == 1 ? item.meter : item.qty}
                </td>
                {isNormalPo && (
                  <>
                    <td className="center">{item.rate}</td>
                    <td className="right">{displayAmount}</td>
                  </>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>

      <table style={S.table}>
        <colgroup>
          <col style={{ width: "60%" }} />
          <col style={{ width: "25%" }} />
          <col style={{ width: "15%" }} />
        </colgroup>
        <tbody>
          <tr>
            <td
              style={{ verticalAlign: "top" }}
              colSpan={1}
              rowSpan={
                4 +
                (parseFloat(inv.discnumber) > 0 ? 1 : 0) +
                (parseFloat(inv.witnesscharges) > 0 ? 1 : 0) +
                (parseFloat(inv.samplehandling) > 0 ? 1 : 0) +
                (parseFloat(inv.sampleprep) > 0 ? 1 : 0) +
                (parseFloat(inv.freight) > 0 ? 1 : 0) +
                (parseFloat(inv.mobilisation) > 0 ? 1 : 0) +
                (isSGST ? 2 : 1)
              }
            >
              {status === 2 && (
                <div style={{ marginBottom: 6, fontSize: 10 }}>
                  {inv.irn && (
                    <div>
                      <strong>Irn No:</strong> {inv.irn}
                    </div>
                  )}
                  {inv.ack_no && (
                    <div>
                      <strong>Acknowledgment No:</strong> {inv.ack_no}
                    </div>
                  )}
                  {inv.ack_dt && (
                    <div>
                      <strong>Acknowledgement Date:</strong> {inv.ack_dt}
                    </div>
                  )}
                </div>
              )}
              {inv.brnnos?.trim() && (
                <div style={{ wordBreak: "break-all" }}>
                  <strong>BRN No :</strong> {inv.brnnos}
                </div>
              )}
              {inv.remark?.trim() && (
                <div>
                  <strong>Remark :</strong> {inv.remark}
                </div>
              )}
              <div>PAN : {companyInfo?.company?.pan_no || "AADCK0799A"}</div>
              <div>
                GSTIN : {companyInfo?.company?.gst_no || "23AADCK0799A1ZV"}
              </div>
              <div>
                SAC Code : {companyInfo?.company?.sac_code || "998394"} Category
                : Scientific and Technical Consultancy Services
              </div>
              <div>Udhyam Registeration No. Type of MSME : 230262102537</div>
              <div>
                CIN NO.{" "}
                {companyInfo?.company?.cin_no || "U73100MP2006PTC019006"}
              </div>
            </td>
            <td>Subtotal</td>
            <td className="right">{f2(inv.subtotal)}</td>
          </tr>
          {parseFloat(inv.discnumber) > 0 && (
            <tr>
              <td>
                Discount ({inv.discnumber}
                {inv.disctype === "%" ? "%" : ""})
              </td>
              <td className="right">{f2(inv.discount)}</td>
            </tr>
          )}
          {parseFloat(inv.witnesscharges) > 0 && (
            <tr>
              <td>
                Witness Charges ({inv.witnessnumber}
                {inv.witnesstype === "%" ? "%" : ""})
              </td>
              <td className="right">{f2(inv.witnesscharges)}</td>
            </tr>
          )}
          {parseFloat(inv.samplehandling) > 0 && (
            <tr>
              <td>Sample Handling</td>
              <td className="right">{f2(inv.samplehandling)}</td>
            </tr>
          )}
          {parseFloat(inv.sampleprep) > 0 && (
            <tr>
              <td>Sample Preparation Charges</td>
              <td className="right">{f2(inv.sampleprep)}</td>
            </tr>
          )}
          {parseFloat(inv.freight) > 0 && (
            <tr>
              <td>Freight Charges</td>
              <td className="right">{f2(inv.freight)}</td>
            </tr>
          )}
          {parseFloat(inv.mobilisation) > 0 && (
            <tr>
              <td>Mobilization and Demobilization Charges</td>
              <td className="right">{f2(inv.mobilisation)}</td>
            </tr>
          )}
          <tr>
            <td>Total</td>
            <td className="right">{f2(inv.subtotal2)}</td>
          </tr>
          {isSGST ? (
            <>
              <tr>
                <td>CGST {inv.cgstper}%</td>
                <td className="right">{f2(inv.cgstamount)}</td>
              </tr>
              <tr>
                <td>SGST {inv.sgstper}%</td>
                <td className="right">{f2(inv.sgstamount)}</td>
              </tr>
            </>
          ) : (
            <tr>
              <td>IGST {inv.igstper}%</td>
              <td className="right">{f2(inv.igstamount)}</td>
            </tr>
          )}
          <tr>
            <td>Total Charges With tax</td>
            <td className="right">{f2(inv.total)}</td>
          </tr>
          <tr>
            <td>Round off</td>
            <td className="right">{f2(inv.roundoff)}</td>
          </tr>
          <tr>
            <td colSpan={2} style={{ borderRight: "none" }}>
              <strong>(IN WORDS):</strong> Rs.{" "}
              {numberToWords(Math.round(finalTotal))} Only
            </td>
            <td style={{ fontWeight: "bold" }} className="right">
              {f2(Math.round(finalTotal))}
            </td>
          </tr>
        </tbody>
      </table>

      <div style={{ pageBreakBefore: "always", paddingTop: 10 }}>
        <HeaderSection />
        <table style={S.table}>
          <colgroup>
            <col style={{ width: "60%" }} />
            <col style={{ width: "40%" }} />
          </colgroup>
          <tbody>
            <tr>
              <td style={{ verticalAlign: "top" }}>
                <div>
                  For online payments -{" "}
                  {inv.bankaccountname ||
                    companyInfo?.bank?.account_name ||
                    "KAILTECH TEST AND RESEARCH CENTRE PVT LTD."}
                </div>
                <div>
                  Bank Name : {inv.bankname || companyInfo?.bank?.bank_name || ""}
                  , Branch Name :{" "}
                  {inv.bankbranch || companyInfo?.bank?.branch || ""}
                </div>
                <div>
                  Bank Account No. :{" "}
                  {inv.bankaccountno || companyInfo?.bank?.account_no || ""}, A/c
                  Type : {inv.bankactype || companyInfo?.bank?.account_type || ""}
                </div>
                <div>
                  IFSC CODE: {inv.bankifsccode || companyInfo?.bank?.ifsc || ""},
                  MICR CODE: {inv.bankmicr || companyInfo?.bank?.micr || ""}
                </div>
                <div style={{ marginTop: 6, fontSize: 10 }}>
                  Certified that the particulars given above are true and correct.
                  The commercial values in this document are as per
                  contract/Agreement/Purchase order terms with the customer.
                  <br />
                  <strong> Declaration u/s 206 AB of Income Tax Act:</strong> We
                  have filed our Income Tax Return for previous two years with in
                  specified due dates.
                </div>
              </td>
              <td
                style={{ ...S.td, borderLeft: "none", textAlign: "right" }}
                colSpan={2}
              >
                <div
                  style={{
                    height: 120,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    For{" "}
                    {companyInfo?.company?.name ||
                      "Kailtech Test And Research Centre Pvt. Ltd."}
                  </div>
                  {(status === 1 || status === 2) && (
                    <div>
                      {signUrl && (
                        <img
                          src={signUrl}
                          alt="Sign"
                          style={{ width: 100, height: 40, objectFit: "contain" }}
                        />
                      )}
                      {digitalSignUrl && (
                        <img
                          src={digitalSignUrl}
                          alt="DigSign"
                          style={{ maxHeight: 50, objectFit: "contain" }}
                        />
                      )}
                    </div>
                  )}
                  <div>
                    <u>Authorised Signatory</u>
                  </div>
                </div>
              </td>
            </tr>
            <tr>
              <td colSpan={2} style={{ fontSize: 10 }}>
                <strong>
                  <u>Terms &amp; Conditions:</u>
                </strong>
                <ol style={{ paddingLeft: 18, marginTop: 4, lineHeight: 1.6 }}>
                  <li>
                    Cross Cheque/DD should be drawn in favour of{" "}
                    {companyInfo?.company?.name ||
                      "Kailtech Test And Research Centre Pvt. Ltd."}{" "}
                    Payable at Indore
                  </li>
                  <li>
                    Please attached bill details indicating Invoice No. Quotation
                    no &amp; TDS deductions if any along with your payment.
                  </li>
                  <li>
                    As per existing GST rules. the GSTR-1 has to be filed in the
                    immediate next month of billing. So if you have any issue in
                    this tax invoice viz customer Name, Address, GST No., Amount
                    etc, please inform positively in writing before 5th of next
                    month, otherwise no such request will be entertained.
                  </li>
                  <li>
                    Payment not made with in 15 days from the date of issued bill
                    will attract interest @ 24% P.A.
                  </li>
                  <li>
                    If the payment is to be paid in Cash pay to UPI{" "}
                    <strong>0795933A0099960.bqr@kotak</strong> only and take
                    official receipt. Else claim of payment, shall not be accepted
                  </li>
                  <li>
                    Subject to exclusive jurisdiction of courts at Indore only.
                  </li>
                  <li>Errors &amp; omissions accepted.</li>
                </ol>
              </td>
            </tr>
          </tbody>
        </table>
        <div
          style={{
            textAlign: "center",
            fontSize: 10,
            color: "#999",
            marginTop: 8,
          }}
        >
          This is a system generated invoice
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div className="flex h-[60vh] items-center justify-center gap-3 text-gray-500">
      <svg
        className="h-6 w-6 animate-spin text-blue-500"
        viewBox="0 0 24 24"
        fill="none"
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
      Loading invoice…
    </div>
  );
}

function SummaryRow({ label, value, bold = false }) {
  return (
    <div className="flex items-center justify-between py-0.5 text-sm">
      <span
        className={`dark:text-dark-400 text-right text-gray-600 ${bold ? "font-semibold" : ""}`}
        style={{ flex: "0 0 70%" }}
      >
        {label}
      </span>
      <span
        className={`text-right tabular-nums ${bold ? "dark:text-dark-100 font-bold text-gray-900" : "dark:text-dark-200 text-gray-800"}`}
        style={{ flex: "0 0 30%" }}
      >
        {value}
      </span>
    </div>
  );
}

function ConfirmModal({ open, title, message, onOk, onCancel, loading }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="dark:bg-dark-800 w-96 rounded-xl bg-white p-6 shadow-2xl">
        <h3 className="mb-1 text-base font-semibold text-gray-900 dark:text-white">
          {title}
        </h3>
        <p className="dark:text-dark-300 mb-5 text-sm text-gray-500">
          {message}
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="dark:border-dark-500 dark:text-dark-200 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onOk}
            disabled={loading}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? "Please wait…" : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    0: { label: "DRAFT", cls: "bg-gray-200 text-gray-700" },
    1: { label: "APPROVED", cls: "bg-green-100 text-green-800" },
    2: { label: "E-INVOICE", cls: "bg-blue-100 text-blue-800" },
  };
  const s = map[Number(status)] ?? {
    label: "UNKNOWN",
    cls: "bg-gray-100 text-gray-500",
  };
  return (
    <span
      className={`rounded px-2 py-0.5 text-xs font-bold tracking-wide uppercase ${s.cls}`}
    >
      {s.label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
export default function ViewCalibrationInvoice() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [invoice, setInvoice] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [companyInfo, setCompanyInfo] = useState(null);
  const [states, setStates] = useState([]);
  const [approveModal, setApproveModal] = useState(false);
  const [einvModal, setEinvModal] = useState(false);
  const [busy, setBusy] = useState(false);

  const permissions = useMemo(() => {
    if (typeof window === "undefined") return [];
    return parseUserPermissions(localStorage.getItem("userPermissions"));
  }, []);
  const hasPerm = useCallback((p) => permissions.includes(p), [permissions]);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await axios.get(`/accounts/view-calibration-invoice/${id}`);
      const d = res.data?.data ?? res.data ?? {};
      const inv = {
        ...(d.invoice ?? d),
        _address: d.address,
        _qr_image: d.qr_image,
        _signature_image: d.signature_image,
        _digital_signature: d.digital_signature,
      };
      setItems(Array.isArray(d.items) ? d.items : []);

      const concernId = d.inward?.concernpersonname || inv.concern_person;
      if (concernId && !isNaN(Number(concernId))) {
        try {
          const personRes = await axios.get(
            `/get-concern-person-details/${concernId}`,
          );
          if (personRes.data?.data?.name)
            inv.concern_person = personRes.data.data.name;
        } catch (err) {
          console.error("Failed to fetch person details", err);
        }
      }
      setInvoice(inv);
    } catch {
      toast.error("Failed to load invoice");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
    axios
      .get("/get-company-info")
      .then((res) => setCompanyInfo(res.data?.data));
    axios
      .get("/people/get-state")
      .then((res) => setStates(res.data?.data || []));
  }, [load]);

  const doApprove = async () => {
    try {
      setBusy(true);
      await axios.post("/accounts/approve-calibration-invoice", {
        invoiceid: id,
      });
      toast.success("Invoice approved");
      setApproveModal(false);
      load();
    } catch {
      toast.error("Failed to approve invoice");
    } finally {
      setBusy(false);
    }
  };


  if (loading)
    return (
      <Page title="View Invoice">
        <Spinner />
      </Page>
    );
  if (!invoice)
    return (
      <Page title="View Invoice">
        <div className="flex h-[60vh] items-center justify-center text-gray-500">
          Invoice not found.
        </div>
      </Page>
    );

  const statecode = isNaN(Number(invoice.statecode))
    ? invoice.statecode
    : String(Number(invoice.statecode)).padStart(2, "0");
  // Fallback missing or 0 country to 1 (India)
  const getCountryCode = () => {
    let code = invoice.country;
    if (code === undefined || code === null || code === "") code = invoice._address?.country;
    if (!code || String(code) === "0") return "1";
    return String(code);
  };
  const isOutsideIndia = getCountryCode() !== "1";
  const isSgst = !isOutsideIndia && statecode === "23";
  const isFoc = invoice.invoiceno === "FOC";
  const isNormalPo = invoice.potype === "Normal";
  const isDraft = Number(invoice.status) === 0;
  const isEinvoice = Number(invoice.status) === 2;
  const finalTotalVal = parseFloat(invoice.finaltotal ?? 0);

  const totalQuantity = items.reduce(
    (s, it) => s + (parseFloat(it.qty) || 0),
    0,
  );
  const otherCharges =
    (parseFloat(invoice.witnesscharges) || 0) +
    (parseFloat(invoice.samplehandling) || 0) +
    (parseFloat(invoice.sampleprep) || 0) +
    (parseFloat(invoice.freight) || 0) +
    (parseFloat(invoice.mobilisation) || 0);
  const amountNew = (parseFloat(invoice.subtotal) || 0) + otherCharges;

  // ── Grouping Logic ──
  const groupedItemsMap = items.reduce((acc, item) => {
    const cleanedDesc = (item.description || "")
      .split(/<br>\s*Brn No:|CCL Updation/i)[0]
      .replace(/<br>\s*$/i, "")
      .trim();
    const key = `${cleanedDesc}_${item.rate}`;
    if (!acc[key])
      acc[key] = {
        ...item,
        description: cleanedDesc,
        qty: 0,
        meter: 0,
        amount: 0,
      };
    const q = parseFloat(item.qty || 0),
      m = parseFloat(item.meter || 0),
      r = parseFloat(item.rate || 0),
      a = parseFloat(item.amount || 0);
    acc[key].qty += q;
    acc[key].meter += m;
    acc[key].amount += a !== 0 ? a : item.meter_option == 1 ? r * m : r * q;
    return acc;
  }, {});
  const finalItems = Object.values(groupedItemsMap);

  const computedItems = finalItems.map((item) => {
    if (isFoc)
      return {
        ...item,
        itemOtherCharge: 0,
        itemAmount: 0,
        itemDiscount: 0,
        itemAssAmt: 0,
        itemCgst: 0,
        itemSgst: 0,
        itemIgst: 0,
        itemTotVal: 0,
        gstRate: 0,
      };
    const itemAmountOld = parseFloat(item.amount) || 0,
      qty = parseFloat(item.qty) || 0;
    const itemOtherCharge =
      otherCharges > 0 && totalQuantity > 0
        ? parseFloat(((otherCharges / totalQuantity) * qty).toFixed(2))
        : 0;
    const itemAmount = itemAmountOld + itemOtherCharge;
    let itemDiscount = 0;
    if (amountNew > 0) {
      if (invoice.disctype === "amount")
        itemDiscount = parseFloat(
          (
            (itemAmount / amountNew) *
            (parseFloat(invoice.discnumber) || 0)
          ).toFixed(2),
        );
      else
        itemDiscount = parseFloat(
          (
            (itemAmount / amountNew) *
            (parseFloat(invoice.discount) || 0)
          ).toFixed(2),
        );
    }
    const itemAssAmt = itemAmount - itemDiscount;
    let itemCgst = 0,
      itemSgst = 0,
      itemIgst = 0;
    if (isSgst) {
      itemCgst = parseFloat(
        (itemAssAmt * ((parseFloat(invoice.cgstper) || 0) / 100)).toFixed(2),
      );
      itemSgst = parseFloat(
        (itemAssAmt * ((parseFloat(invoice.sgstper) || 0) / 100)).toFixed(2),
      );
    } else {
      itemIgst = parseFloat(
        (itemAssAmt * ((parseFloat(invoice.igstper) || 0) / 100)).toFixed(2),
      );
    }
    const gstRate =
      (parseFloat(invoice.cgstper) || 0) +
      (parseFloat(invoice.sgstper) || 0) +
      (parseFloat(invoice.igstper) || 0);
    return {
      ...item,
      itemOtherCharge,
      itemAmount,
      itemDiscount,
      itemAssAmt,
      itemCgst,
      itemSgst,
      itemIgst,
      itemTotVal: itemAssAmt + itemCgst + itemSgst + itemIgst,
      gstRate,
    };
  });

  const doEInvoice = async () => {
    try {
      setBusy(true);

      const subtotal = parseFloat(invoice.subtotal) || 0;
      const discount = parseFloat(invoice.discount) || 0;
      const assAmt = (subtotal - discount) + otherCharges;

      let cgstVal = 0, sgstVal = 0, igstVal = 0;
      if (isSgst) {
        cgstVal = Number((assAmt * ((parseFloat(invoice.cgstper) || 0) / 100)).toFixed(2));
        sgstVal = Number((assAmt * ((parseFloat(invoice.sgstper) || 0) / 100)).toFixed(2));
      } else {
        igstVal = Number((assAmt * ((parseFloat(invoice.igstper) || 0) / 100)).toFixed(2));
      }
      const roundoff = Number((parseFloat(invoice.roundoff) || 0).toFixed(2));
      const totInvValFc = Number((assAmt + cgstVal + sgstVal + igstVal).toFixed(2));
      const totInvVal = Number((totInvValFc + roundoff).toFixed(2));

      let buyerGstin = invoice.gstno || "URP";
      let supTyp = "B2B";
      if (!invoice.gstno || invoice.gstno === "0" || invoice.gstno === "NA") {
        buyerGstin = "URP";
        supTyp = "B2C";
      }

      const totalTaxPer = (parseFloat(invoice.cgstper) || 0) + (parseFloat(invoice.sgstper) || 0) + (parseFloat(invoice.igstper) || 0);
      const isSezName = invoice.customername && invoice.customername.toUpperCase().includes("SEZ");

      if (isOutsideIndia) {
        supTyp = "EXPWOP";
      } else if (buyerGstin !== "URP" && (totalTaxPer === 0 || isSezName)) {
        // Bina API ke check: Agar taxes 0 hain aur GSTIN available hai (ya customer ke naam me SEZ hai), toh yeh SEZWOP hoga.
        supTyp = "SEZWOP";
      }

      const dateParts = invoice.approved_on ? invoice.approved_on.split(' ')[0].split('-') : [];
      const formattedDate = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : "";

      const payload = {
        Version: "1.1",
        TranDtls: {
          TaxSch: "GST",
          SupTyp: supTyp,
          RegRev: "N",
          EcmGstin: null,
          IgstOnIntra: "N"
        },
        DocDtls: {
          Typ: "INV",
          No: invoice.invoiceno,
          Dt: formattedDate
        },
        SellerDtls: {
          Gstin: "23AADCK0799A1ZV",
          LglNm: "KAILTECH TEST AND RESEARCH CENTRE PVT LTD.",
          TrdNm: "KAILTECH TEST AND RESEARCH CENTRE PVT LTD.",
          Addr1: "Plot No. 141-C, Electronic Complex Industrial Area, Indore",
          Loc: "BHOPAL",
          Pin: 452010,
          Stcd: "23"
        },
        BuyerDtls: {
          Gstin: isOutsideIndia ? "URP" : buyerGstin,
          LglNm: invoice.customername ? invoice.customername.substring(0, 99) : "",
          Pos: isOutsideIndia ? "96" : (isNaN(Number(statecode)) ? "96" : String(statecode).padStart(2, '0')),
          Addr1: (invoice._address?.address || invoice.address || "").replace(/[\r\n]+/g, ' ').substring(0, 99),
          Loc: invoice._address?.city || "",
          Pin: isOutsideIndia ? 999999 : (() => {
            const rawPin = String(invoice._address?.pincode || "");
            const match = rawPin.match(/\b\d{6}\b/);
            if (match) return Number(match[0]);

            const addressStr = invoice.address || "";
            const addrMatch = addressStr.match(/\b\d{6}\b/);
            if (addrMatch) return Number(addrMatch[0]);

            return 999999;
          })(),
          Stcd: isOutsideIndia ? "96" : (isNaN(Number(statecode)) ? "96" : String(statecode).padStart(2, '0'))
        },
        ItemList: computedItems.map((item, index) => ({
          SlNo: String(index + 1),
          PrdDesc: (item.description || "").replace(/<[^>]*>?/gm, ' ').substring(0, 300).trim(),
          IsServc: "Y",
          HsnCd: companyInfo?.company?.sac_code || "998394",
          Qty: item.meter_option == 1 ? Number(item.meter) : Number(item.qty),
          UnitPrice: Number(item.rate),
          TotAmt: Number(item.itemAmount.toFixed(2)),
          Discount: Number(item.itemDiscount.toFixed(2)),
          AssAmt: Number(item.itemAssAmt.toFixed(2)),
          GstRt: Number(item.gstRate.toFixed(2)),
          IgstAmt: Number(item.itemIgst.toFixed(2)),
          CgstAmt: Number(item.itemCgst.toFixed(2)),
          SgstAmt: Number(item.itemSgst.toFixed(2)),
          OthChrg: 0,
          TotItemVal: Number(item.itemTotVal.toFixed(2))
        })),
        ValDtls: {
          AssVal: Number(assAmt.toFixed(2)),
          ...(isSgst ? {
            CgstVal: cgstVal,
            SgstVal: sgstVal
          } : {
            IgstVal: igstVal
          }),
          OthChrg: 0,
          RndOffAmt: roundoff,
          TotInvVal: totInvVal,
          TotInvValFc: totInvValFc
        },
        ExpDtls: {
          CntCode: "IN"
        }
      };

      await axios.post(`/einvoice/generate?invoiceid=${id}`, payload);
      toast.success("E-Invoice generated");
      setEinvModal(false);
      load();
    } catch {
      toast.error("Failed to generate E-Invoice");
    } finally {
      setBusy(false);
    }
  };

  const validateGSTINPincode = async () => {
    setBusy(true);
    var gstin = invoice.gstno;
    var pincode = parseInt(invoice._address?.pincode || 0, 10);
    var country = getCountryCode();

    if (country === "1") {
      if (!gstin || gstin === "0" || gstin === "NA" || !pincode || pincode === 0 || pincode === "NA") {
        toast.error("Invalid GSTIN or pincode. Unable to generate E-Invoice.");
        setBusy(false);
        return;
      }
      // Pincode matching with Alankit API removed as requested by user.
      await doEInvoice();
    } else {
      await doEInvoice();
    }
  };

  const canApprove =
    invoice.status === 0 &&
    ((hasPerm(269) && finalTotalVal <= 5000) ||
      (hasPerm(270) && finalTotalVal > 5000));
  const canEInvoice =
    !isFoc &&
    invoice.status === 1 &&
    hasPerm(466) &&
    finalTotalVal !== 0;

  const handleExport = (withLH) => {
    const invNo = invoice.invoiceno || "Invoice";
    // Sanitize invoice number for filename (replace / with _ to avoid path issues)
    const fileName = invNo.replace(/\//g, "_");
    const pageTitle = withLH ? fileName : `${fileName}_without_LetterHead`;

    printInvoice(
      {
        inv: invoice,
        addr: invoice._address ?? {},
        items: computedItems,
        qrUrl: invoice._qr_image,
        signUrl: invoice._signature_image,
        digitalSignUrl: invoice._digital_signature,
        companyInfo,
        states,
      },
      withLH,
      logo,
      pageTitle,
    );
  };

  return (
    <Page title="View Invoice">
      <div className="transition-content px-[var(--margin-x)] pb-10">
        <div className="mb-4 flex flex-wrap items-center gap-2 print:hidden">
          <button
            onClick={() => handleExport(true)}
            className="inline-flex items-center gap-1.5 rounded bg-sky-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-700"
          >
            Export PDF Invoice
          </button>
          <button
            onClick={() => handleExport(false)}
            className="inline-flex items-center gap-1.5 rounded bg-sky-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-700"
          >
            Export PDF Without LetterHead
          </button>
          <button
            onClick={() =>
              navigate("/dashboards/accounts/calibration-invoice-list")
            }
            className="rounded bg-sky-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-sky-600"
          >
            &laquo; Back to List
          </button>
          {canApprove && (
            <button
              onClick={() => setApproveModal(true)}
              className="rounded bg-green-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-green-700"
            >
              Approve
            </button>
          )}
          {canEInvoice && (
            <button
              onClick={() => setEinvModal(true)}
              className="rounded bg-violet-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-violet-700"
            >
              Generate E-Invoice
            </button>
          )}
          <div className="ml-auto">
            <StatusBadge status={invoice.status} />
          </div>
        </div>

        <div
          className={`dark:border-dark-600 dark:bg-dark-900 relative overflow-hidden rounded-lg border border-gray-300 bg-white p-6 text-sm ${isDraft ? "draft-watermark" : ""}`}
        >
          {isDraft && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-10 select-none">
              <span className="rotate-[-35deg] text-[120px] font-black tracking-widest text-gray-500 uppercase">
                DRAFT
              </span>
            </div>
          )}
          <div className="mb-4 grid grid-cols-12 gap-2">
            <div className="col-span-3 flex items-start">
              <img
                src={companyInfo?.branding?.logo || logo}
                alt="Logo"
                className="h-16 w-auto object-contain"
              />
            </div>
            <div className="col-span-9">
              <p className="text-right font-mono text-xs text-balance text-gray-500 italic">
                NABL Accredited as per IS/ISO/IEC 17025 (CC-2348), BIS
                Recognized & ISO 9001 Certified Test & Calibration Laboratory
              </p>
              <h2
                className="mt-2 text-left text-2xl font-bold"
                style={{ color: "navy" }}
              >
                {companyInfo?.company?.name ||
                  "KAILTECH TEST AND RESEARCH CENTRE PVT LTD."}
              </h2>
            </div>
            <div className="col-span-12 mt-2 text-center text-base font-bold">
              TAX INVOICE
              <br />
              <span className="text-sm font-semibold uppercase">
                For {invoice.typeofinvoice} Charges
              </span>
              <br />
              <span className="text-sm font-semibold uppercase">
                ORIGINAL FOR RECIPIENT
              </span>
            </div>
          </div>

          <table className="dark:border-dark-500 w-full border-collapse border border-gray-400 text-xs">
            <tbody>
              <tr>
                <td className="dark:border-dark-500 w-3/5 border border-gray-400 p-3 align-top">
                  <div className="font-bold">Customer:</div>
                  <div>M / s . {invoice.customername}</div>
                  <div className="mt-1">
                    {invoice._address
                      ? `${invoice._address.address}, ${invoice._address.city}, ${invoice._address.pincode}`
                      : invoice.address}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-4">
                    <span>
                      <b>State name: </b>
                      {invoice.statename ??
                        states.find(
                          (s) =>
                            String(s.gst_code).padStart(2, "0") ===
                            String(statecode).padStart(2, "0"),
                        )?.state ??
                        statecode}
                    </span>
                    <span>
                      <b>State code: </b>
                      {isNaN(Number(statecode)) ? "NA" : statecode}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-4">
                    <span>
                      <b>GSTIN/UIN: </b>
                      {invoice.gstno || "—"}
                    </span>
                    <span>
                      <b>PAN: </b>
                      {invoice.pan || "—"}
                    </span>
                  </div>
                  {invoice.concern_person && (
                    <div className="mt-1 text-xs text-gray-500">
                      Kind Attn. {invoice.concern_person}
                    </div>
                  )}
                </td>
                <td
                  className="dark:border-dark-500 border border-gray-400 p-3 align-top"
                  style={{ borderRight: isEinvoice ? "none" : undefined }}
                >
                  <div>
                    <b>Invoice No.: </b>
                    {invoice.invoiceno}
                  </div>
                  <div>
                    <b>Date: </b>
                    {fmtDate(invoice.approved_on)}
                  </div>
                  <div>
                    <b>P.O. No. / Date: </b>
                    {invoice.ponumber}
                  </div>
                </td>
                {isEinvoice && invoice._qr_image && (
                  <td
                    className="dark:border-dark-500 w-36 border border-gray-400 p-1 align-top"
                    style={{ borderLeft: "none" }}
                  >
                    <div className="overflow-hidden border-2 border-black">
                      <img
                        src={invoice._qr_image}
                        alt="QR"
                        className="w-full"
                      />
                    </div>
                  </td>
                )}
              </tr>
            </tbody>
          </table>

          <table className="dark:border-dark-500 mt-2 w-full border-collapse border border-gray-400 text-xs">
            <thead>
              <tr className="dark:bg-dark-700 bg-gray-100">
                <th
                  className="dark:border-dark-500 border border-gray-400 px-2 py-1.5 text-center"
                  style={{ width: "8%" }}
                >
                  S. No.
                </th>
                <th className="dark:border-dark-500 border border-gray-400 px-2 py-1.5 text-center">
                  Description
                </th>
                <th
                  className="dark:border-dark-500 border border-gray-400 px-2 py-1.5 text-center"
                  style={{ width: "10%" }}
                >
                  {items.some((it) => it.meter_option == 1)
                    ? "Meter's"
                    : "No's"}
                </th>
                {isNormalPo && (
                  <>
                    <th
                      className="dark:border-dark-500 border border-gray-400 px-2 py-1.5 text-center"
                      style={{ width: "10%" }}
                    >
                      Rate
                    </th>
                    <th
                      className="dark:border-dark-500 border border-gray-400 px-2 py-1.5 text-center"
                      style={{ width: "12%" }}
                    >
                      Amount
                    </th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {computedItems.map((item, idx) => (
                <tr key={item.id ?? idx} className="dark:bg-dark-900 bg-white">
                  <td className="dark:border-dark-500 border border-gray-400 px-2 py-1.5 text-center">
                    {idx + 1}
                  </td>
                  <td
                    className="dark:border-dark-500 border border-gray-400 px-2 py-1.5"
                    dangerouslySetInnerHTML={{ __html: item.description }}
                  />
                  <td className="dark:border-dark-500 border border-gray-400 px-2 py-1.5 text-center">
                    {item.meter_option == 1
                      ? Math.round(item.meter * 100) / 100
                      : item.qty}
                  </td>
                  {isNormalPo && (
                    <>
                      <td className="dark:border-dark-500 border border-gray-400 px-2 py-1.5 text-center">
                        {item.rate}
                      </td>
                      <td className="dark:border-dark-500 border border-gray-400 px-2 py-1.5 text-right">
                        {f2(item.amount)}
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          <table className="dark:border-dark-500 mt-2 w-full border-collapse border border-gray-400 text-xs">
            <tbody>
              <tr>
                <td className="dark:border-dark-500 w-3/5 border border-gray-400 p-3 align-bottom">
                  {isEinvoice && (
                    <div className="mb-2 text-xs">
                      {invoice.irn && (
                        <div>
                          <b>Irn No:</b> {invoice.irn}
                        </div>
                      )}
                      {invoice.ack_no && (
                        <div>
                          <b>Acknowledgment No:</b> {invoice.ack_no}
                        </div>
                      )}
                      {invoice.ack_dt && (
                        <div>
                          <b>Acknowledgement Date:</b> {invoice.ack_dt}
                        </div>
                      )}
                    </div>
                  )}
                  {invoice.brnnos?.trim() && (
                    <div style={{ wordBreak: "break-all" }}>
                      <b>BRN No :</b> {invoice.brnnos}
                    </div>
                  )}
                  {invoice.remark?.trim() && (
                    <div>
                      <b>Remark :</b> {invoice.remark}
                    </div>
                  )}
                  {(invoice.brnnos || invoice.remark) && <br />}
                  <div>
                    PAN : {companyInfo?.company?.pan_no || "AADCK0799A"}
                  </div>
                  <div>
                    GSTIN : {companyInfo?.company?.gst_no || "23AADCK0799A1ZV"}
                  </div>
                  <div>
                    SAC Code : {companyInfo?.company?.sac_code || "998394"}{" "}
                    Category : Scientific and Technical Consultancy Services
                  </div>
                  <div>
                    Udhyam Registeration No. Type of MSME : 230262102537
                  </div>
                  <div>
                    CIN NO.{" "}
                    {companyInfo?.company?.cin_no || "U73100MP2006PTC019006"}
                  </div>
                </td>
                <td className="dark:border-dark-500 border border-gray-400 p-3 align-top">
                  <SummaryRow label="Subtotal" value={f2(invoice.subtotal)} />
                  {parseFloat(invoice.discnumber) > 0 && (
                    <SummaryRow
                      label={`Discount(${invoice.discnumber}${invoice.disctype === "%" ? "%" : ""})`}
                      value={f2(invoice.discount)}
                    />
                  )}
                  {parseFloat(invoice.witnesscharges) > 0 && (
                    <SummaryRow
                      label={`Witness Charges (${invoice.witnessnumber}${invoice.witnesstype === "%" ? "%" : ""})`}
                      value={f2(invoice.witnesscharges)}
                    />
                  )}
                  {parseFloat(invoice.samplehandling) > 0 && (
                    <SummaryRow
                      label="Sample Handling"
                      value={f2(invoice.samplehandling)}
                    />
                  )}
                  {parseFloat(invoice.sampleprep) > 0 && (
                    <SummaryRow
                      label="Sample Preparation Charges"
                      value={f2(invoice.sampleprep)}
                    />
                  )}
                  {parseFloat(invoice.freight) > 0 && (
                    <SummaryRow
                      label="Freight Charges"
                      value={f2(invoice.freight)}
                    />
                  )}
                  {parseFloat(invoice.mobilisation) > 0 && (
                    <SummaryRow
                      label="Mobilization and Demobilization Charges"
                      value={f2(invoice.mobilisation)}
                    />
                  )}
                  <SummaryRow label="Total" value={f2(invoice.subtotal2)} />
                  {isSgst ? (
                    <>
                      <SummaryRow
                        label={`CGST ${invoice.cgstper}%`}
                        value={f2(invoice.cgstamount)}
                      />
                      <SummaryRow
                        label={`SGST ${invoice.sgstper}%`}
                        value={f2(invoice.sgstamount)}
                      />
                    </>
                  ) : (
                    <SummaryRow
                      label={`IGST ${invoice.igstper}%`}
                      value={f2(invoice.igstamount)}
                    />
                  )}
                  <SummaryRow
                    label="Total Charges With tax"
                    value={f2(invoice.total)}
                  />
                  <SummaryRow label="Round off" value={f2(invoice.roundoff)} />
                </td>
              </tr>
              <tr>
                <td className="dark:border-dark-500 border border-gray-400 p-3">
                  <b>(IN WORDS):</b> Rs.{" "}
                  {numberToWords(
                    Math.round(parseFloat(invoice.finaltotal) || 0),
                  )}{" "}
                  Only
                </td>
                <td className="dark:border-dark-500 border border-gray-400 p-3">
                  <SummaryRow
                    label={`Total ${invoice.typeofinvoice} Charges`}
                    value={f2(Math.round(parseFloat(invoice.finaltotal) || 0))}
                    bold
                  />
                </td>
              </tr>
              <tr>
                <td className="dark:border-dark-500 border border-gray-400 p-3 align-top text-xs">
                  <div>
                    For online payments -{" "}
                    {invoice.bankaccountname ||
                      companyInfo?.bank?.account_name ||
                      "KAILTECH TEST AND RESEARCH CENTRE PVT LTD."}
                  </div>
                  <div>
                    Bank Name :{" "}
                    {invoice.bankname || companyInfo?.bank?.bank_name || ""},
                    Branch Name :{" "}
                    {invoice.bankbranch || companyInfo?.bank?.branch || ""}
                  </div>
                  <div>
                    Bank Account No. :{" "}
                    {invoice.bankaccountno ||
                      companyInfo?.bank?.account_no ||
                      ""}
                    , A/c Type :{" "}
                    {invoice.bankactype ||
                      companyInfo?.bank?.account_type ||
                      ""}
                  </div>
                  <div>
                    IFSC CODE:{" "}
                    {invoice.bankifsccode || companyInfo?.bank?.ifsc || ""},
                    MICR CODE:{" "}
                    {invoice.bankmicr || companyInfo?.bank?.micr || ""}
                  </div>
                  <div className="mt-2 leading-relaxed text-gray-500">
                    Certified that the particulars given above are true and
                    correct. The commercial values in this document are as per
                    contract/Agreement/Purchase order terms with the customer.
                    <br />
                    <b> Declaration u/s 206 AB of Income Tax Act:</b> We have
                    filed our Income Tax Return for previous two years with in
                    specified due dates.
                  </div>
                </td>
                <td className="dark:border-dark-500 h-1 border border-gray-400 p-3 align-top text-xs">
                  <div className="flex h-full min-h-[120px] flex-col justify-between text-right">
                    <div>
                      For{" "}
                      {companyInfo?.company?.name ||
                        "Kailtech Test And Research Centre Pvt. Ltd."}
                    </div>
                    {(Number(invoice.status) === 1 ||
                      Number(invoice.status) === 2) &&
                      invoice._signature_image && (
                        <div className="mt-2 text-right">
                          <img
                            src={invoice._signature_image}
                            alt="Signature"
                            className="inline-block h-10 w-24 object-contain"
                          />
                          {invoice._digital_signature && (
                            <img
                              src={invoice._digital_signature}
                              alt="Digital Signature"
                              className="mt-1 inline-block h-10 object-contain"
                            />
                          )}
                        </div>
                      )}
                    <div className="underline">Authorised Signatory</div>
                  </div>
                </td>
              </tr>
              <tr>
                <td
                  colSpan={2}
                  className="dark:border-dark-500 border border-gray-400 p-3 text-xs"
                >
                  <div className="mb-1 font-bold underline">
                    Terms & Conditions:
                  </div>
                  <ol className="list-decimal space-y-0.5 pl-5">
                    <li>
                      Cross Cheque/DD should be drawn in favour of{" "}
                      {companyInfo?.company?.name ||
                        "Kailtech Test And Research Centre Pvt. Ltd."}{" "}
                      Payable at Indore
                    </li>
                    <li>
                      Please attached bill details indicating Invoice No.
                      Quotation no & TDS deductions if any along with your
                      payment.
                    </li>
                    <li>
                      As per existing GST rules. the GSTR-1 has to be filed in
                      the immediate next month of billing. So if you have any
                      issue in this tax invoice viz customer Name, Address, GST
                      No., Amount etc, please inform positively in writing
                      before 5th of next month, otherwise no such request will
                      be entertained.
                    </li>
                    <li>
                      Payment not made with in 15 days from the date of issued
                      bill will attract interest @ 24% P.A.
                    </li>
                    <li>
                      If the payment is to be paid in Cash pay to UPI{" "}
                      <b>0795933A0099960.bqr@kotak</b> only and take official
                      receipt. Else claim of payment, shall not be accepted
                    </li>
                    <li>
                      Subject to exclusive jurisdiction of courts at Indore
                      only.
                    </li>
                    <li>Errors & omissions accepted.</li>
                  </ol>
                </td>
              </tr>
            </tbody>
          </table>
          <div className="mt-3 flex items-center justify-center gap-4 text-xs text-gray-500">
            <span>This is a system generated invoice</span>
            {canApprove && (
              <button
                onClick={() => setApproveModal(true)}
                className="rounded bg-green-600 px-3 py-1 font-semibold text-white hover:bg-green-700 print:hidden"
              >
                Approve
              </button>
            )}
            {canEInvoice && (
              <button
                onClick={() => setEinvModal(true)}
                className="rounded bg-green-600 px-3 py-1 font-semibold text-white hover:bg-green-700 print:hidden"
              >
                Generate E-Invoice
              </button>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        open={approveModal}
        title="Approve Invoice"
        message={`Are you sure you want to approve invoice ${invoice.invoiceno}?`}
        onOk={doApprove}
        onCancel={() => setApproveModal(false)}
        loading={busy}
      />
      <ConfirmModal
        open={einvModal}
        title="Generate E-Invoice"
        message="Are you sure you want to generate E-Invoice? This action cannot be undone."
        onOk={validateGSTINPincode}
        onCancel={() => setEinvModal(false)}
        loading={busy}
      />
    </Page>
  );
}