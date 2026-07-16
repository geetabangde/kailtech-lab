// ViewInvoiceCalibration.jsx
// Route: /dashboards/accounts/testing-invoices/view/:id
// PHP port of: viewInvoiceCalibration.php
//
// Key logic:
//   statecode == "23"  → SGST mode (CGST + SGST), else IGST
//   invoiceno == "FOC" → skip per-item discount/tax calc (all amounts = 0)
//   status == 0        → DRAFT watermark
//   status == 2        → show QR code (signed_qr_code)
//   potype == "Normal" → show Rate + Amount columns
//   meter_option == 1  → show "Meter's" column, else "No's"
//
// Per-item amount distribution (PHP logic):
//   otherCharges = witnesscharges + samplehandling + sampleprep + freight + mobilisation
//   item_otherCharge = (otherCharges / totalQuantity) * item.qty
//   item_amount = item.amount + item_otherCharge
//   amount_new = subtotal + otherCharges
//   if disctype == "amount": item_discount = (item_amount / amount_new) * discnumber
//   else:                    item_discount = (item_amount / amount_new) * discount
//   item_assAmt = item_amount - item_discount
//   tax on item_assAmt

import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import { renderToStaticMarkup } from "react-dom/server";
import axios from "utils/axios";
import { toast } from "sonner";
import { Page } from "components/shared/Page";
import { parseUserPermissions } from "utils/permissions";
import logo from "assets/krtc.jpg";

// ─── Open invoice in a print window → user saves as PDF ─────────────────────
// Uses the browser's native print engine: perfect layout, no CORS issues,
// no column-width miscalculations. User clicks Ctrl+P → Save as PDF.
function printInvoice(templateProps, withLH, logoSrc, pageTitle) {
  // Render the React template to a plain HTML string (no hooks / effects)
  const bodyHtml = renderToStaticMarkup(
    <InvoicePrintTemplate {...templateProps} withLH={withLH} logoSrc={logoSrc} />
  );

  // Sanitize title — replace filename-illegal chars for Chrome PDF save dialog
  const safeTitle = (pageTitle || templateProps.inv?.invoiceno || "Invoice")
    .replace(/[/\\:*?"<>|]/g, "_");

  const full = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${safeTitle}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    @page { size: A4; margin: 10mm; margin-top: 10mm; }
    @page :first { margin-top: 10mm; }
    body  { margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #111; background: #fff; }
    @media print { 
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      head { display: none; }
      table { page-break-inside: auto; }
      tr { page-break-inside: avoid; break-inside: avoid; page-break-after: auto; }
    }
    table  { border-collapse: collapse; width: 100%; margin-bottom: 8px; table-layout: fixed; }
    th, td { border: 1px solid #000; padding: 6px 8px; font-size: 13px; vertical-align: middle; word-break: break-word; overflow: hidden; }
    th     { background: #f3f4f6; text-align: center; font-weight: bold; }
    td.right  { text-align: right; }
    td.center { text-align: center; }
    td.nob    { border: none; }
  </style>
</head>
<body>${bodyHtml}</body>
</html>`;

  const win = window.open("", "_blank", "width=900,height=700");
  if (!win) { toast.error("Pop-up blocked — please allow pop-ups and try again."); return; }
  win.document.open();
  win.document.write(full);
  win.document.close();
  // Close the window automatically after printing/saving (or cancelling)
  win.onafterprint = () => {
    try { win.close(); } catch (e) { void e; }
  };
  // Give the browser a moment to render images, then open the print dialog
  win.onload = () => {
    win.focus();
    win.print();
  };
  // Fallback if onload doesn't fire (some browsers)
  setTimeout(() => {
    try {
      win.focus();
      win.print();
    } catch (e) { void e; }
  }, 800);
}

// ─── Shared inline style tokens (zero Tailwind / zero oklch) ─────────────────
// NOTE: border / padding / font-size / vertical-align are handled by the
// print-window <style> block — only layout-specific overrides go here.
const S = {
  wrap: { fontFamily: "Arial,Helvetica,sans-serif", fontSize: 13, color: "#111", backgroundColor: "#fff", padding: "16px 20px", width: "100%" },
  table: { width: "100%", borderCollapse: "collapse", marginBottom: 8, tableLayout: "fixed" },
  // These are used only for on-screen preview; for print the CSS class handles alignment
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
    ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" })
    : "";

// ─── Number to words (PHP: convert_number_to_words) ──────────────────────────
function numberToWords(n) {
  if (n === 0) return "zero";
  const ones = [
    "", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
    "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen",
    "seventeen", "eighteen", "nineteen",
  ];
  const tens = [
    "", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety",
  ];
  function words(num) {
    if (num === 0) return "";
    if (num < 20) return ones[num] + " ";
    if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? " " + ones[num % 10] : "") + " ";
    if (num < 1000) return ones[Math.floor(num / 100)] + " hundred " + words(num % 100);
    if (num < 100000) return words(Math.floor(num / 1000)) + "thousand " + words(num % 1000);
    if (num < 10000000) return words(Math.floor(num / 100000)) + "lakh " + words(num % 100000);
    return words(Math.floor(num / 10000000)) + "crore " + words(num % 10000000);
  }
  const result = words(Math.round(n)).trim();
  return result.charAt(0).toUpperCase() + result.slice(1);
}

// ─── Print template — ALL inline styles, zero Tailwind, zero oklch ───────────
function InvoicePrintTemplate({ inv, addr, items, qrUrl, signUrl, digitalSignUrl, withLH, companyInfo, logoSrc, states = [] }) {
  const statecode = !isNaN(inv.statecode) ? String(inv.statecode).padStart(2, "0") : inv.statecode;
  const isSGST = String(statecode) === "23";
  const matchedState = states.find(s => String(s.gst_code).padStart(2, "0") === String(statecode).padStart(2, "0"));
  const stateLabel = inv.statename ?? matchedState?.state ?? statecode ?? "";
  const finalTotal = parseFloat(inv.finaltotal ?? 0);
  const isFoc = inv.invoiceno === "FOC";
  const isNormalPo = inv.potype === "Normal";
  // hasMeter removed to standardize on "Nos."
  const status = Number(inv.status);
  // html2canvas is no longer used, so we can safely use remote URLs directly.
  const safeQrUrl = qrUrl || null;

  // Per-item calculations (same PHP logic)
  const totalQty = items.reduce((s, it) => s + (parseFloat(it.qty) || 0), 0);
  const otherCharges = (parseFloat(inv.witnesscharges) || 0) + (parseFloat(inv.samplehandling) || 0) +
    (parseFloat(inv.sampleprep) || 0) + (parseFloat(inv.freight) || 0) + (parseFloat(inv.mobilisation) || 0);

  const HeaderSection = () => (
    <>
      {/* Letterhead */}
      {withLH && (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, width: "100%", marginBottom: 8 }}>
          <img src={logoSrc || companyInfo?.branding?.logo || logo} alt="Logo" style={{ height: 60, width: "auto", flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <p style={{ fontFamily: "serif", fontSize: 11, fontStyle: "italic", color: "#555", margin: 0, textAlign: "right" }}>
              NABL Accredited as per IS/ISO/IEC 17025 (Certificate Nos. TC-7832 &amp; CC-2348),<br />
              BIS Recognized &amp; ISO 9001 Certified Test &amp; Calibration Laboratory
            </p>
            <div style={{ fontSize: 20, fontWeight: "bold", color: "navy", textAlign: "left", marginTop: 8, paddingLeft: 12 }}>
              {companyInfo?.company?.name || "Kailtech Test And Research Centre Pvt. Ltd."}
            </div>
          </div>
        </div>
      )}

      <div style={{ textAlign: "center", marginBottom: 8, marginTop: 80 }}>
        <div style={{ fontSize: 14, fontWeight: "bold", textTransform: "uppercase" }}>TAX INVOICE</div>
        <div style={{ fontSize: 12, textTransform: "uppercase", marginTop: 4 }}>FOR {inv.typeofinvoice || ""} CHARGES</div>
        <div style={{ fontSize: 12, textTransform: "uppercase", marginTop: 2 }}>ORIGINAL FOR RECIPIENT</div>
      </div>
    </>
  );

  return (
    <div style={S.wrap}>
      {/* Page 1 wrapper: flex column so footer sticks to bottom */}
      <div style={{ display: "flex", flexDirection: "column", minHeight: "257mm" }}>
        <div style={{ flex: 1 }}>
          <HeaderSection />

          {/* Customer + Invoice meta */}
          <table style={S.table}>
            <colgroup>
              <col style={{ width: status === 2 && safeQrUrl ? "45%" : "60%" }} />
              <col style={{ width: status === 2 && safeQrUrl ? "30%" : "40%" }} />
              {status === 2 && safeQrUrl && <col style={{ width: "25%" }} />}
            </colgroup>
            <tbody>
              <tr>
                <td style={{ ...S.td, verticalAlign: "top" }}>
                  <div style={S.label}>Customer:</div>
                  <strong>M / s . {inv.customername}</strong><br />
                  <div style={{ marginTop: 4 }}>
                    {addr.address ? (
                      <>
                        {addr.address}<br />
                        {[addr.city, addr.pincode].filter(Boolean).join(", ")}
                      </>
                    ) : (
                      inv.address
                    )}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", columnGap: "12px", rowGap: "4px", marginTop: 4 }}>
                    <div style={{ minWidth: "45%" }}><span style={S.label}>State name : </span>{stateLabel}</div>
                    <div style={{ minWidth: "40%" }}><span style={S.label}>State code : </span>{!isNaN(inv.statecode) ? statecode : "NA"}</div>
                    <div style={{ minWidth: "45%" }}><span style={S.label}>GSTIN/UIN : </span>{inv.gstno}</div>
                    <div style={{ minWidth: "40%" }}><span style={S.label}>PAN : </span>{inv.pan}</div>
                  </div>
                  {inv.concern_person && <div style={{ marginTop: 8 }}>Kind Attn. {inv.concern_person}</div>}
                </td>
                <td style={{ ...S.td, verticalAlign: "top" }}>
                  <div><span style={S.label}>Invoice No. : </span>{inv.invoiceno}</div>
                  <div style={{ marginTop: 4 }}><span style={S.label}>Date : </span>{fmtDate(inv.approved_on)}</div>
                  <div style={{ marginTop: 4 }}><span style={S.label}>P.O. No./ Date : </span>{inv.ponumber}</div>
                </td>
                {status === 2 && safeQrUrl && (
                  <td style={{ ...S.td, verticalAlign: "middle", textAlign: "center", padding: 2 }}>
                    <img src={safeQrUrl} alt="QR" style={{ width: "100%", maxWidth: 180, margin: "0 auto" }} />
                  </td>
                )}
              </tr>
            </tbody>
          </table>

          {/* Items — colgroup locks column widths for table-layout:fixed */}
          <table style={S.table}>
            <colgroup>
              <col style={{ width: "8%" }} />
              <col style={{ width: isNormalPo ? "52%" : "80%" }} />
              <col style={{ width: "12%" }} />
              {isNormalPo && <>
                <col style={{ width: "13%" }} />
                <col style={{ width: "15%" }} />
              </>}
            </colgroup>
            <thead>
              <tr>
                <th>S. No.</th>
                <th>Description</th>
                <th>{"No's"}</th>
                {isNormalPo && <>
                  <th>Rate</th>
                  <th>Amount</th>
                </>}
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => {
                // Per-item calc (skip for FOC)
                let displayAmount = f2(item.amount);
                if (!isFoc && isNormalPo) {
                  const itemAmountOld = parseFloat(item.amount) || 0;
                  const itemOtherCharge = otherCharges > 0 && totalQty > 0
                    ? parseFloat(((otherCharges / totalQty) * parseFloat(item.qty || 0)).toFixed(2)) : 0;
                  displayAmount = f2(itemAmountOld + itemOtherCharge);
                }
                return (
                  <tr key={item.id ?? idx}>
                    <td className="center">{idx + 1}</td>
                    <td dangerouslySetInnerHTML={{ __html: item.description }} />
                    <td className="center">{item.meter_option == 1 ? item.meter : item.qty}</td>
                    {isNormalPo && <>
                      <td className="center">{item.rate}</td>
                      <td className="right">{displayAmount}</td>
                    </>}
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Totals + BRN + Bank — colgroup: 60% left info, 25% label, 15% value */}
          <table style={S.table}>
            <colgroup>
              <col style={{ width: "60%" }} />
              <col style={{ width: "22%" }} />
              <col style={{ width: "18%" }} />
            </colgroup>
            <tbody>
              <tr>
                {/* Left: IRN / BRN / company info */}
                <td style={{ verticalAlign: "top" }} colSpan={1}
                  rowSpan={4 + (parseFloat(inv.discnumber) > 0 ? 1 : 0) +
                    (parseFloat(inv.witnesscharges) > 0 ? 1 : 0) +
                    (parseFloat(inv.samplehandling) > 0 ? 1 : 0) +
                    (parseFloat(inv.sampleprep) > 0 ? 1 : 0) +
                    (parseFloat(inv.freight) > 0 ? 1 : 0) +
                    (parseFloat(inv.mobilisation) > 0 ? 1 : 0) +
                    (isSGST ? 2 : 1)}>
                  {status === 2 && (<div style={{ marginBottom: 6, fontSize: 10 }}>
                    {inv.irn && <div><strong>Irn No:</strong> {inv.irn}</div>}
                    {inv.ack_no && <div><strong>Acknowledgment No:</strong> {inv.ack_no}</div>}
                    {inv.ack_dt && <div><strong>Acknowledgement Date:</strong> {inv.ack_dt}</div>}
                  </div>)}
                  {inv.brnnos?.trim() && <div><strong>BRN No :</strong> {inv.brnnos}</div>}
                  {inv.remark?.trim() && <div><strong>Remark :</strong> {inv.remark}</div>}
                  <div style={{ marginTop: 8 }}>PAN : {companyInfo?.company?.pan_no || "AADCK0799A"}</div>
                  <div>GSTIN : {companyInfo?.company?.gst_no || "23AADCK0799A1ZV"}</div>
                  <div>SAC Code : {companyInfo?.company?.sac_code || "998394"} Category : Scientific and Technical Consultancy Services</div>
                  <div>Udhyam Registration No. Type of MSME : 230262102537</div>
                  <div>CIN NO.{companyInfo?.company?.cin_no || "U73100MP2006PTC019006"}</div>
                </td>
                <td>Subtotal</td>
                <td className="right">{f2(inv.subtotal)}</td>
              </tr>
              {parseFloat(inv.discnumber) > 0 && <tr>
                <td>Discount ({inv.discnumber}{inv.disctype === "%" ? "%" : ""})</td>
                <td className="right">{f2(inv.discount)}</td>
              </tr>}
              {parseFloat(inv.witnesscharges) > 0 && <tr>
                <td>Witness Charges ({inv.witnessnumber}{inv.witnesstype === "%" ? "%" : ""})</td>
                <td className="right">{f2(inv.witnesscharges)}</td>
              </tr>}
              {parseFloat(inv.samplehandling) > 0 && <tr>
                <td>Sample Handling</td>
                <td className="right">{f2(inv.samplehandling)}</td>
              </tr>}
              {parseFloat(inv.sampleprep) > 0 && <tr>
                <td>Sample Preparation Charges</td>
                <td className="right">{f2(inv.sampleprep)}</td>
              </tr>}
              {parseFloat(inv.freight) > 0 && <tr>
                <td>Freight Charges</td>
                <td className="right">{f2(inv.freight)}</td>
              </tr>}
              {parseFloat(inv.mobilisation) > 0 && <tr>
                <td>Mobilization and Demobilization Charges</td>
                <td className="right">{f2(inv.mobilisation)}</td>
              </tr>}
              <tr>
                <td>Total</td>
                <td className="right">{f2(inv.subtotal2)}</td>
              </tr>
              {isSGST ? (<>
                <tr><td>CGST {inv.cgstper}%</td><td className="right">{f2(inv.cgstamount)}</td></tr>
                <tr><td>SGST {inv.sgstper}%</td><td className="right">{f2(inv.sgstamount)}</td></tr>
              </>) : (
                <tr><td>IGST {inv.igstper}%</td><td className="right">{f2(inv.igstamount)}</td></tr>
              )}
              <tr>
                <td>Total Charges With tax</td>
                <td className="right">{f2(inv.total)}</td>
              </tr>
              <tr>
                <td>Round off</td>
                <td className="right">{f2(inv.roundoff)}</td>
              </tr>
              {/* In words + final total */}
              <tr>
                <td colSpan={1}>
                  (IN WORDS): Rs. {numberToWords(Math.round(finalTotal))} Only
                </td>
                <td style={{ fontWeight: "bold" }}>Total Testing Charges</td>
                <td style={{ fontWeight: "bold" }} className="right">{f2(Math.round(finalTotal))}</td>
              </tr>
            </tbody>
          </table>
        </div>{/* end flex:1 */}

        {/* Page 1 Footer: Company Address — pushed to bottom */}
        <div style={{ textAlign: "center", fontSize: 11, paddingTop: 8, borderTop: "1px solid #000", marginTop: "auto" }}>
          <div style={{ fontWeight: "bold" }}>
            Plot No.141 C, Electronic Complex, Pardeshipura, Indore-452010 (INDIA) Ph. +91-4787555 (30 Lines), 4046055,4048055
          </div>
          <div>
            Email : contact@kailtech.net,calibration@kailtech.net, Web: www.kailtech.net, CIN-U73100MP2006PTC019006
          </div>
        </div>
      </div>{/* end page 1 wrapper */}

      {/* Page 2: Bank + Signatory */}
      <div style={{ pageBreakBefore: "always", paddingTop: 10 }}>
        <HeaderSection />
        <table style={S.table}>
          <colgroup>
            <col style={{ width: "50%" }} />
            <col style={{ width: "50%" }} />
          </colgroup>
          <tbody>
            <tr>
              <td style={{ verticalAlign: "top" }}>
                <div>For online payments - {inv.bankaccountname || companyInfo?.bank?.account_name || "Kailtech Test And Research Centre Pvt. Ltd."}</div>
                <div>Bank Name : {inv.bankname || companyInfo?.bank?.bank_name || ""}, Branch Name : {inv.bankbranch || companyInfo?.bank?.branch || ""}</div>
                <div>Bank Account No. : {inv.bankaccountno || companyInfo?.bank?.account_no || ""}, A/c Type : {inv.bankactype || companyInfo?.bank?.account_type || ""}</div>
                <div>IFSC CODE: {inv.bankifsccode || companyInfo?.bank?.ifsc || ""}, MICR CODE: {inv.bankmicr || companyInfo?.bank?.micr || ""}</div>
                <div style={{ marginTop: 6, fontSize: 11 }}>
                  Certified that the particulars given above are true and correct. The commercial values in this document are as per contract/ Agreement/ Purchase order terms with the customer.<br />
                  <strong>Declaration u/s 206AB of Income Tax Act:</strong> We have filed our Income Tax Return for previous two years with in specified due dates.
                </div>
              </td>
              <td style={{ ...S.td, verticalAlign: "top" }} colSpan={1}>
                <div style={{ minHeight: 120, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div style={{ textAlign: "right", marginBottom: 10, whiteSpace: "nowrap", textTransform: "uppercase", fontSize: 12 }}>For {companyInfo?.company?.name || "Kailtech Test And Research Centre Pvt. Ltd."}</div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                    {/* Left: Signature + Digital Signature Image */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", textAlign: "left", paddingLeft: 10 }}>
                      {(status === 1 || status === 2) && signUrl && (
                        <img src={signUrl} alt="Sign" style={{ width: 100, height: 40, objectFit: "contain", marginBottom: 4 }} />
                      )}
                      {(status === 1 || status === 2) && digitalSignUrl && (
                        <img src={digitalSignUrl} alt="Digital Sign" style={{ width: 160, objectFit: "contain" }} />
                      )}
                    </div>

                    {/* Right: Seal + Authorised Signatory */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "right" }}>
                      <img src="https://kailtech.in/images/seal.png" alt="Seal" style={{ height: 70, width: 70, objectFit: "contain", marginBottom: 10 }} />
                      <div>
                        <u>Authorised</u><br /><u>Signatory</u>
                      </div>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
            <tr>
              <td colSpan={2} style={{ fontSize: 10 }}>
                <strong><u>Terms &amp; Conditions:</u></strong>
                <ol style={{ paddingLeft: 18, marginTop: 4, lineHeight: 1.6 }}>
                  <li>Cross Cheque/DD should be drawn in favour of {companyInfo?.company?.name || "Kailtech Test And Research Centre Pvt. Ltd."} Payable at Indore</li>
                  <li>Please attached bill details indicating Invoice No. Quotation no &amp; TDS deductions if any along with your payment.</li>
                  <li>As per existing GST rules. the GSTR-1 has to be filed in the immediate next month of billing. So if you have any issue in this tax invoice viz customer Name, Address, GST No., Amount etc, please inform positively in writing before 5th of next month, otherwise no such request will be entertained.</li>
                  <li>Payment not made with in 15 days from the date of issued bill will attract interest @ 24% P.A.</li>
                  <li>If the payment is to be paid in Cash pay to UPI <strong>0795933A0099960.bqr@kotak</strong> only and take official receipt. Else claim of payment, shall not be accepted</li>
                  <li>Subject to exclusive jurisdiction of courts at Indore only.</li>
                  <li>Errors &amp; omissions accepted.</li>
                </ol>
              </td>
            </tr>
          </tbody>
        </table>
        <div style={{ textAlign: "left", fontSize: 10, marginTop: 4 }}>
          This is a system generated invoice //
        </div>
      </div>
    </div>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div className="flex h-[60vh] items-center justify-center gap-3 text-gray-500">
      <svg className="h-6 w-6 animate-spin text-blue-500" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z" />
      </svg>
      Loading invoice…
    </div>
  );
}

// ─── Label + Value row helper ─────────────────────────────────────────────────
function SummaryRow({ label, value, bold = false }) {
  return (
    <div className="flex items-center justify-between py-0.5 text-sm">
      <span className={`text-right text-gray-600 dark:text-dark-400 ${bold ? "font-semibold" : ""}`} style={{ flex: "0 0 70%" }}>
        {label}
      </span>
      <span className={`text-right tabular-nums ${bold ? "font-bold text-gray-900 dark:text-dark-100" : "text-gray-800 dark:text-dark-200"}`} style={{ flex: "0 0 30%" }}>
        {value}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
export default function ViewInvoiceCalibration() {
  const { id } = useParams();
  const navigate = useNavigate();


  const [invoice, setInvoice] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [companyInfo, setCompanyInfo] = useState(null);
  const [imgBase64, setImgBase64] = useState({ qr: "", sign: "", dSign: "" });
  const [states, setStates] = useState([]);

  const [approveModal, setApproveModal] = useState(false);
  const [einvModal, setEinvModal] = useState(false);
  const [busy, setBusy] = useState(false);

  const permissions = parseUserPermissions(localStorage.getItem("userPermissions"));
  const hasPerm = (id) => permissions.includes(id);

  // ── Fetch invoice detail ───────────────────────────────────────────────────
  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await axios.get(`/accounts/view-calibration-invoice/${id}`);
      const d = res.data?.data ?? res.data ?? {};
      const inv = { ...(d.invoice ?? d), _address: d.address, _qr_image: d.qr_image, _signature_image: d.signature_image, _digital_signature: d.digital_signature };
      setItems(Array.isArray(d.items) ? d.items : []);
      // Handle concern person name if it's an ID
      const concernId = d.inward?.concernpersonname || inv.concern_person;
      if (concernId && !isNaN(Number(concernId))) {
        try {
          const personRes = await axios.get(`/get-concern-person-details/${concernId}`);
          if (personRes.data?.data?.name) {
            inv.concern_person = personRes.data.data.name;
          }
        } catch (err) { console.error("Failed to fetch person details", err); }
      }

      setInvoice(inv);
      // QR / signature images — stored directly; print window loads them as same-origin URLs
      setImgBase64({
        qr: d?.qr_image ?? "",
        sign: d?.signature_image ?? "",
        dSign: d?.digital_signature ?? "",
      });
    } catch {
      toast.error("Failed to load invoice");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
    // Fetch central company info
    axios.get("/get-company-info")
      .then(res => setCompanyInfo(res.data?.data))
      .catch(err => console.error("Failed to load company info:", err));

    // Fetch state list
    axios.get("/people/get-state")
      .then(res => setStates(res.data?.data || []))
      .catch(err => console.error("Failed to load states:", err));
  }, [load]);

  if (loading) return <Page title="View Invoice"><Spinner /></Page>;
  if (!invoice) return (
    <Page title="View Invoice">
      <div className="flex h-[60vh] items-center justify-center text-gray-500">Invoice not found.</div>
    </Page>
  );

  // ── Derived values (PHP logic) ─────────────────────────────────────────────
  const statecode = isNaN(Number(invoice.statecode))
    ? invoice.statecode
    : String(Number(invoice.statecode)).padStart(2, "0");
  const isOutsideIndia = String(invoice.country) !== "1" && String(invoice._address?.country) !== "1";
  const isSgst = !isOutsideIndia && statecode === "23";
  const isFoc = invoice.invoiceno === "FOC";
  const isNormalPo = invoice.potype === "Normal";
  const isDraft = Number(invoice.status) === 0;
  const isEinvoice = Number(invoice.status) === 2;

  // PHP: totalQuantity = sum of all item qty
  const totalQuantity = items.reduce((s, it) => s + (parseFloat(it.qty) || 0), 0);

  // ── Group items by description and rate (User request) ────────────────────
  const groupedItemsMap = items.reduce((acc, item) => {
    // Clean description: remove everything from "Brn No:" or "CCL Updation"
    const cleanedDesc = (item.description || "")
      .split(/<br>\s*Brn No:|CCL Updation/i)[0]
      .replace(/<br>\s*$/i, "")
      .trim();

    const key = `${cleanedDesc}_${item.rate}`;
    if (!acc[key]) {
      acc[key] = { ...item, description: cleanedDesc, qty: 0, meter: 0, amount: 0 };
    }
    const q = parseFloat(item.qty || 0);
    const m = parseFloat(item.meter || 0);
    const r = parseFloat(item.rate || 0);
    const a = parseFloat(item.amount || 0);

    acc[key].qty += q;
    acc[key].meter += m;
    // If original amount is 0, calculate it as rate * (meter or qty)
    acc[key].amount += a !== 0 ? a : (item.meter_option == 1 ? r * m : r * q);
    return acc;
  }, {});
  const finalItems = Object.values(groupedItemsMap);

  // PHP: otherCharge = witnesscharges + samplehandling + sampleprep + freight + mobilisation
  const otherCharges =
    (parseFloat(invoice.witnesscharges) || 0) +
    (parseFloat(invoice.samplehandling) || 0) +
    (parseFloat(invoice.sampleprep) || 0) +
    (parseFloat(invoice.freight) || 0) +
    (parseFloat(invoice.mobilisation) || 0);

  const hasOtherCharges = otherCharges > 0;

  // PHP: amount_new = subtotal + otherCharge
  const subtotal = parseFloat(invoice.subtotal) || 0;
  const amountNew = subtotal + otherCharges;

  // ── Per-item calculations (PHP logic, skipped for FOC) ─────────────────────
  const computedItems = finalItems.map((item) => {
    if (isFoc) {
      return { ...item, itemOtherCharge: 0, itemAmount: 0, itemDiscount: 0, itemAssAmt: 0, itemCgst: 0, itemSgst: 0, itemIgst: 0, itemTotVal: 0, gstRate: 0 };
    }

    const itemAmountOld = parseFloat(item.amount) || 0;
    const qty = parseFloat(item.qty) || 0;

    // PHP: item_otherCharge = (otherCharges / totalQuantity) * item.qty
    const itemOtherCharge = hasOtherCharges && totalQuantity > 0
      ? parseFloat(((otherCharges / totalQuantity) * qty).toFixed(2))
      : 0;

    const itemAmount = itemAmountOld + itemOtherCharge;

    // PHP: item_discount based on disctype
    let itemDiscount = 0;
    if (amountNew > 0) {
      if (invoice.disctype === "amount") {
        itemDiscount = parseFloat(((itemAmount / amountNew) * (parseFloat(invoice.discnumber) || 0)).toFixed(2));
      } else {
        itemDiscount = parseFloat(((itemAmount / amountNew) * (parseFloat(invoice.discount) || 0)).toFixed(2));
      }
    }

    const itemAssAmt = itemAmount - itemDiscount;

    // PHP: tax on itemAssAmt
    let itemCgst = 0, itemSgst = 0, itemIgst = 0;
    if (isSgst) {
      itemCgst = parseFloat((itemAssAmt * ((parseFloat(invoice.cgstper) || 0) / 100)).toFixed(2));
      itemSgst = parseFloat((itemAssAmt * ((parseFloat(invoice.sgstper) || 0) / 100)).toFixed(2));
    } else {
      itemIgst = parseFloat((itemAssAmt * ((parseFloat(invoice.igstper) || 0) / 100)).toFixed(2));
    }

    const gstRate = (parseFloat(invoice.cgstper) || 0) + (parseFloat(invoice.sgstper) || 0) + (parseFloat(invoice.igstper) || 0);
    const itemTotVal = itemAssAmt + itemCgst + itemSgst + itemIgst;

    return { ...item, itemOtherCharge, itemAmount, itemDiscount, itemAssAmt, itemCgst, itemSgst, itemIgst, itemTotVal, gstRate };
  });

  const finalTotalVal = Math.round(parseFloat(invoice.finaltotal) || 0);

  const doApprove = async () => {
    try {
      setBusy(true);
      await axios.post("/accounts/approve-calibration-invoice", { invoiceid: id });
      toast.success("Invoice approved");
      setApproveModal(false);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to approve invoice");
    } finally {
      setBusy(false);
    }
  };

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
      if (isOutsideIndia) {
        supTyp = "EXPWOP";
      }

      const dateParts = invoice.approved_on ? invoice.approved_on.split(' ')[0].split('-') : [];
      const formattedDate = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : "";

      const payload = {
        Version: "1.1",
        TranDtls: { TaxSch: "GST", SupTyp: supTyp, RegRev: "N", EcmGstin: null, IgstOnIntra: "N" },
        DocDtls: { Typ: "INV", No: invoice.invoiceno, Dt: formattedDate },
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
          CgstVal: cgstVal,
          SgstVal: sgstVal,
          IgstVal: igstVal,
          OthChrg: 0,
          RndOffAmt: roundoff,
          TotInvVal: totInvVal,
          TotInvValFc: totInvValFc
        },
        ExpDtls: { CntCode: "IN" }
      };

      await axios.post(`/einvoice/generate?invoiceid=${id}`, payload);
      toast.success("E-Invoice generated");
      setEinvModal(false);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || "Failed to generate E-Invoice");
    } finally {
      setBusy(false);
    }
  };

  const canApprove = invoice.status == 0 && ((hasPerm(269) && finalTotalVal <= 5000) || (hasPerm(270) && finalTotalVal > 5000));
  const canEInvoice = !isFoc && invoice.status == 1 && hasPerm(466) && finalTotalVal !== 0;

  // ── Summary values ─────────────────────────────────────────────────────────
  const fmt = (v) => parseFloat(v || 0).toFixed(2);
  const discnumber = parseFloat(invoice.discnumber) || 0;

  // ── PDF handlers ──────────────────────────────────────────────────────────
  const handleExport = (withLH) => {
    const templateProps = {
      inv: invoice,
      addr: invoice._address ?? {},
      items: computedItems,
      qrUrl: imgBase64.qr || invoice._qr_image,
      signUrl: imgBase64.sign || invoice._signature_image,
      digitalSignUrl: imgBase64.dSign || invoice._digital_signature,
      companyInfo,
      states,
    };
    // Sanitize invoice number — replace filename-illegal chars (/ \ : * ? " < > |) with _
    const safeInvoiceNo = (invoice.invoiceno || "invoice").replace(/[/\\:*?"<>|]/g, "_");
    const pageTitle = withLH ? safeInvoiceNo : `${safeInvoiceNo}_without_LetterHead`;
    printInvoice(templateProps, withLH, logo, pageTitle);
  };

  return (
    <Page title="View Invoice">
      <div className="transition-content px-[var(--margin-x)] pb-10">

        {/* No hidden print-template refs needed — we use window.open+print */}

        {/* ── Action buttons (no-print) ── */}
        <div className="mb-4 flex flex-wrap items-center gap-2 print:hidden">
          <button
            onClick={() => handleExport(true)}
            className="inline-flex items-center gap-1.5 rounded bg-sky-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-700"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            Export PDF Invoice
          </button>
          <button
            onClick={() => handleExport(false)}
            className="inline-flex items-center gap-1.5 rounded bg-sky-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-700"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            Export PDF Without LetterHead
          </button>
          <button
            onClick={() => navigate("/dashboards/accounts/testing-invoices")}
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
        </div>

        {/* ── Invoice body ── */}
        <div
          className={`relative overflow-hidden rounded-lg border border-gray-300 bg-white p-6 text-sm dark:border-dark-600 dark:bg-dark-900 ${isDraft ? "draft-watermark" : ""
            }`}
        >
          {/* DRAFT watermark */}
          {isDraft && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-10 select-none">
              <span className="rotate-[-35deg] text-[120px] font-black tracking-widest text-gray-500 uppercase">
                DRAFT
              </span>
            </div>
          )}

          {/* ── Header ── */}
          <div className="mb-4 grid grid-cols-12 gap-2">
            <div className="col-span-3 flex items-start">
              <img src={companyInfo?.branding?.logo || logo} alt="KRTC Logo" className="h-16 w-auto object-contain" />
            </div>
            <div className="col-span-9">
              <p className="font-mono text-sm italic text-gray-500 text-right">
                NABL Accredited as per IS/ISO/IEC 17025 (Certificate Nos. TC-7832 &amp; CC-2348),<br />
                BIS Recognized &amp; ISO 9001 Certified Test &amp; Calibration Laboratory
              </p>
              <h2 className="mt-2 text-2xl font-bold text-left" style={{ color: "navy" }}>
                {companyInfo?.company?.name || invoice.companyname || "KAILTECH TEST AND RESEARCH CENTRE PVT LTD."}
              </h2>
            </div>
            {/* Row 2: spacer | TAX INVOICE centered | ORIGINAL FOR RECIPIENT right */}
            <div className="col-span-3" />
            <div className="col-span-6 text-center text-base font-bold">
              TAX INVOICE<br />
              <span className="text-sm font-semibold uppercase">For {invoice.typeofinvoice} Charges</span><br />
              <span className="text-sm font-semibold uppercase">ORIGINAL FOR RECIPIENT</span>
            </div>
            <div className="col-span-3" />
          </div>

          {/* ── Customer + Invoice Info table ── */}
          <table className="w-full border-collapse border border-gray-400 text-sm dark:border-dark-500 table-fixed">
            <colgroup>
              <col style={{ width: isEinvoice && invoice._qr_image ? "45%" : "60%" }} />
              <col style={{ width: isEinvoice && invoice._qr_image ? "30%" : "40%" }} />
              {isEinvoice && invoice._qr_image && <col style={{ width: "25%" }} />}
            </colgroup>
            <tbody>
              <tr>
                {/* Customer info */}
                <td className="border border-gray-400 p-3 align-top dark:border-dark-500 overflow-hidden">
                  <div className="font-bold">Customer:</div>
                  <strong>M / s . {invoice.customername}</strong><br />
                  <div className="mt-1">
                    {invoice._address ? (
                      <>
                        {invoice._address.address}<br />
                        {[invoice._address.city, invoice._address.pincode].filter(Boolean).join(", ")}
                      </>
                    ) : (
                      invoice.address
                    )}
                  </div>
                  <div className="flex flex-wrap mt-1 gap-y-1" style={{ columnGap: "12px" }}>
                    <div className="min-w-[45%]"><span className="font-bold">State name : </span>{invoice.statename ?? states.find(s => String(s.gst_code).padStart(2, "0") === String(statecode).padStart(2, "0"))?.state ?? statecode}</div>
                    <div className="min-w-[40%]"><span className="font-bold">State code : </span>{!isNaN(Number(statecode)) ? statecode : "NA"}</div>
                    <div className="min-w-[45%]"><span className="font-bold">GSTIN/UIN : </span>{invoice.gstno}</div>
                    <div className="min-w-[40%]"><span className="font-bold">PAN : </span>{invoice.pan}</div>
                  </div>
                  {invoice.concern_person && <div className="mt-2 text-gray-500">Kind Attn. {invoice.concern_person}</div>}
                </td>

                {/* Invoice meta */}
                <td className="border border-gray-400 p-3 align-top dark:border-dark-500 overflow-hidden">
                  <div><span className="font-bold">Invoice No. : </span>{invoice.invoiceno}</div>
                  <div className="mt-1"><span className="font-bold">Date : </span>
                    {invoice.approved_on && invoice.approved_on !== "0000-00-00 00:00:00"
                      ? new Date(invoice.approved_on).toLocaleDateString("en-IN")
                      : ""}
                  </div>
                  <div className="mt-1"><span className="font-bold">P.O. No./ Date : </span>{invoice.ponumber}</div>
                </td>

                {/* QR code (status == 2) */}
                {isEinvoice && invoice._qr_image && (
                  <td className="border border-gray-400 p-1 align-middle text-center dark:border-dark-500">
                    <img src={invoice._qr_image} alt="QR Code" className="w-full max-w-[180px] mx-auto" />
                  </td>
                )}
              </tr>
            </tbody>
          </table>

          {/* ── Items table ── */}
          <table className="mt-2 w-full border-collapse border border-gray-400 text-sm dark:border-dark-500">
            <thead>
              <tr className="bg-gray-100 dark:bg-dark-700">
                <th className="border border-gray-400 px-2 py-1.5 text-center dark:border-dark-500" style={{ width: "8%" }}>S. No.</th>
                <th className="border border-gray-400 px-2 py-1.5 text-center dark:border-dark-500">Description</th>
                <th className="border border-gray-400 px-2 py-1.5 text-center dark:border-dark-500" style={{ width: "10%" }}>
                  {"No's"}
                </th>
                {isNormalPo && (
                  <>
                    <th className="border border-gray-400 px-2 py-1.5 text-center dark:border-dark-500" style={{ width: "10%" }}>Rate</th>
                    <th className="border border-gray-400 px-2 py-1.5 text-center dark:border-dark-500" style={{ width: "12%" }}>Amount</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {computedItems.map((item, idx) => (
                <tr key={item.id ?? idx} className="odd:bg-white even:bg-gray-50 dark:odd:bg-dark-900 dark:even:bg-dark-800">
                  <td className="border border-gray-400 px-2 py-1.5 text-center dark:border-dark-500">{idx + 1}</td>
                  <td className="border border-gray-400 px-2 py-1.5 dark:border-dark-500" dangerouslySetInnerHTML={{ __html: item.description }} />
                  <td className="border border-gray-400 px-2 py-1.5 text-center dark:border-dark-500">
                    {/* PHP: meter_option == 1 → show meter, else grouped quantity */}
                    {item.meter_option == 1 ? (Math.round(item.meter * 100) / 100) : item.qty}
                  </td>
                  {isNormalPo && (
                    <>
                      <td className="border border-gray-400 px-2 py-1.5 text-center dark:border-dark-500">{item.rate}</td>
                      <td className="border border-gray-400 px-2 py-1.5 text-right dark:border-dark-500">{fmt(item.amount)}</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          {/* ── Bottom table: BRN/remarks + summary ── */}
          <table className="mt-2 w-full border-collapse border border-gray-400 text-sm dark:border-dark-500">
            <tbody>
              <tr>
                {/* Left: IRN, BRN, Remark, company info */}
                <td className="w-3/5 border border-gray-400 p-3 align-bottom dark:border-dark-500">
                  {/* E-Invoice details (status == 2) */}
                  {isEinvoice && (
                    <div className="mb-2">
                      {invoice.irn && <div><b>Irn No:</b> {invoice.irn}</div>}
                      {invoice.ack_no && <div><b>Acknowledgment No:</b> {invoice.ack_no}</div>}
                      {invoice.ack_dt && <div><b>Acknowledgement Date:</b> {invoice.ack_dt}</div>}
                    </div>
                  )}
                  {invoice.brnnos?.trim() && (
                    <div><b>BRN No :</b> {invoice.brnnos}</div>
                  )}
                  {invoice.remark?.trim() && (
                    <div><b>Remark :</b> {invoice.remark}</div>
                  )}
                  {(invoice.brnnos?.trim() || invoice.remark?.trim()) && <br />}
                  <div>PAN : {companyInfo?.company?.pan_no || "AADCK0799A"}</div>
                  <div>GSTIN : {companyInfo?.company?.gst_no || "23AADCK0799A1ZV"}</div>
                  <div>SAC Code : {companyInfo?.company?.sac_code || "998394"} Category : Scientific and Technical Consultancy Services</div>
                  <div>Udhyam Registeration No. Type of MSME : 230262102537</div>
                  <div>CIN NO. {companyInfo?.company?.cin_no || "U73100MP2006PTC019006"}</div>
                </td>

                {/* Right: Summary */}
                <td className="border border-gray-400 p-3 align-top dark:border-dark-500">
                  <SummaryRow label="Subtotal" value={fmt(invoice.subtotal)} />

                  {discnumber > 0 && (
                    <SummaryRow
                      label={`Discount(${invoice.discnumber}${invoice.disctype === "%" ? "%" : ""})`}
                      value={fmt(invoice.discount)}
                    />
                  )}
                  {parseFloat(invoice.witnesscharges) > 0 && (
                    <SummaryRow
                      label={`Witness Charges(${invoice.witnessnumber}${invoice.witnesstype === "%" ? "%" : ""})`}
                      value={fmt(invoice.witnesscharges)}
                    />
                  )}
                  {parseFloat(invoice.samplehandling) > 0 && (
                    <SummaryRow label="Sample Handling" value={fmt(invoice.samplehandling)} />
                  )}
                  {parseFloat(invoice.sampleprep) > 0 && (
                    <SummaryRow label="Sample Preparation" value={fmt(invoice.sampleprep)} />
                  )}
                  {parseFloat(invoice.freight) > 0 && (
                    <SummaryRow label="Freight" value={fmt(invoice.freight)} />
                  )}
                  {parseFloat(invoice.mobilisation) > 0 && (
                    <SummaryRow label="Mobilization" value={fmt(invoice.mobilisation)} />
                  )}

                  <SummaryRow label="Total" value={fmt(invoice.subtotal2)} />

                  {isSgst ? (
                    <>
                      <SummaryRow
                        label={`CGST (${invoice.cgstper}%)`}
                        value={fmt(invoice.cgstamount)}
                      />
                      <SummaryRow
                        label={`SGST (${invoice.sgstper}%)`}
                        value={fmt(invoice.sgstamount)}
                      />
                    </>
                  ) : (
                    <SummaryRow
                      label={`IGST (${invoice.igstper}%)`}
                      value={fmt(invoice.igstamount)}
                    />
                  )}

                  <SummaryRow label="Total Charges With tax" value={fmt(invoice.total)} />
                  <SummaryRow label="Round off" value={fmt(invoice.roundoff)} />
                  <SummaryRow
                    label="Total Testing Charges"
                    value={fmt(Math.round(parseFloat(invoice.finaltotal) || 0))}
                    bold
                  />
                </td>
              </tr>

              {/* In words + final total */}
              <tr>
                <td className="border border-gray-400 p-3 dark:border-dark-500">
                  <b>(IN WORDS):</b> Rs. {numberToWords(Math.round(parseFloat(invoice.finaltotal) || 0))} Only
                </td>
                <td className="border border-gray-400 p-3 dark:border-dark-500">
                  <SummaryRow
                    label={`Total ${invoice.typeofinvoice} Charges`}
                    value={fmt(Math.round(parseFloat(invoice.finaltotal) || 0))}
                    bold
                  />
                </td>
              </tr>

              {/* Bank details + Authorised signatory */}
              <tr>
                <td className="border border-gray-400 p-3 align-top text-xs dark:border-dark-500">
                  <div>For online payments - {invoice.bankaccountname || companyInfo?.bank?.account_name || "KAILTECH TEST AND RESEARCH CENTRE PVT LTD."}</div>
                  <div>
                    Bank Name : {invoice.bankname || companyInfo?.bank?.bank_name || "—"},
                    Branch Name : {invoice.bankbranch || companyInfo?.bank?.branch || "—"}
                  </div>
                  <div>
                    Bank Account No. : {invoice.bankaccountno || companyInfo?.bank?.account_no || "—"},
                    A/c Type : {invoice.bankactype || companyInfo?.bank?.account_type || "—"}
                  </div>
                  <div>
                    IFSC CODE: {invoice.bankifsccode || companyInfo?.bank?.ifsc || "—"},
                    MICR CODE: {invoice.bankmicr || companyInfo?.bank?.micr || "—"}
                  </div>
                  <div className="mt-2 text-gray-600">
                    Certified that the particulars given above are true and correct.
                    The commercial values in this document are as per contract/Agreement/Purchase order terms with the customer.
                    <br />
                    <b> Declaration u/s 206 AB of Income Tax Act:</b> We have filed our Income Tax Return for previous two years with in specified due dates.
                  </div>
                </td>
                <td className="border border-gray-400 p-3 align-top text-xs dark:border-dark-500 h-1">
                  <div className="flex min-h-[120px] h-full flex-col justify-between text-right">
                    <div>For {invoice.companyname ?? "KAILTECH TEST AND RESEARCH CENTRE PVT LTD."}</div>
                    {(Number(invoice.status) === 1 || Number(invoice.status) === 2) && invoice._signature_image && (
                      <div className="mt-2 text-right">
                        <img src={invoice._signature_image} alt="Signature" className="inline-block h-10 w-24 object-contain" />
                        {invoice._digital_signature && (
                          <img src={invoice._digital_signature} alt="Digital Signature" className="mt-1 inline-block h-10 object-contain" />
                        )}
                      </div>
                    )}
                    <div className="underline">Authorised Signatory</div>
                  </div>
                </td>
              </tr>

              {/* Terms & Conditions */}
              <tr>
                <td colSpan={2} className="border border-gray-400 p-3 text-xs dark:border-dark-500">
                  <b><u>Terms &amp; Conditions:</u></b>
                  <ol className="mt-1 list-decimal pl-5 space-y-0.5">
                    <li>Cross Cheque/DD should be drawn in favour of {invoice.companyname ?? "KAILTECH TEST AND RESEARCH CENTRE PVT LTD."} Payable at {invoice.companycity ?? "Indore"}</li>
                    <li>Please attached bill details indicating Invoice No. Quotation no &amp; TDS deductions if any along with your payment.</li>
                    <li>As per existing GST rules. the GSTR-1 has to be filed in the immediate next month of billing. So if you have any issue in this tax invoice viz customer Name, Address, GST No., Amount etc, please inform positively in writing before 5th of next month, otherwise no such request will be entertained.</li>
                    <li>Payment not made with in 15 days from the date of issued bill will attract interest @ 24% P.A.</li>
                    <li>If the payment is to be paid in Cash pay to UPI <b>0795933A0099960.bqr@kotak</b> only and take official receipt. Else claim of payment, shall not be accepted</li>
                    <li>Subject to exclusive jurisdiction of courts at {invoice.companycity ?? "Indore"} only.</li>
                    <li>Errors &amp; omissions accepted.</li>
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
        onOk={doEInvoice}
        onCancel={() => setEinvModal(false)}
        loading={busy}
      />
    </Page>
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