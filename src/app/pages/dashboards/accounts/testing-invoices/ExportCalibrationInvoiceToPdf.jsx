// ExportCalibrationInvoiceToPdf.jsx
// Extracted from ViewInvoiceCalibration.jsx
// PHP port of: viewInvoiceCalibration.php (print / export logic)
//
// Key logic:
//   statecode == "23"  → SGST mode (CGST + SGST), else IGST
//   invoiceno == "FOC" → skip per-item discount/tax calc (all amounts = 0)
//   status == 0        → DRAFT watermark
//   status == 2        → show QR code (signed_qr_code)
//   potype == "Normal" → show Rate + Amount columns
//   meter_option == 1  → show "Meter's" column, else "No's"

import logo from "assets/krtc.jpg";
import { toast } from "sonner";
import { renderToStaticMarkup } from "react-dom/server";

// ─── Shared inline style tokens (zero Tailwind / zero oklch) ─────────────────
const S = {
    wrap: { fontFamily: "Arial,Helvetica,sans-serif", fontSize: 13, color: "#111", backgroundColor: "#fff", padding: "16px 20px", width: "100%" },
    table: { width: "100%", borderCollapse: "collapse", marginBottom: 8, tableLayout: "fixed" },
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
export function numberToWords(n) {
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
    const isNormalPo = inv.potype === "Normal";
    const status = Number(inv.status);
    const safeQrUrl = qrUrl || null;

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
            {/* Page 1 */}
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

                    {/* Items table */}
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
                                const displayAmount = f2(item.amount);
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

                    {/* Totals + BRN + Bank */}
                    <table style={{ ...S.table, pageBreakInside: "avoid", breakInside: "avoid" }}>
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
                                    {inv.brnnos?.trim() && <div style={{ wordBreak: "break-all" }}><strong>BRN No :</strong> {inv.brnnos}</div>}
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

                {/* Page 1 Footer */}
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
            <div style={{ pageBreakBefore: "always", paddingTop: 10, display: "flex", flexDirection: "column", minHeight: "270mm" }}>
                <div style={{ flex: 1 }}>
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
                                            {/* Left: Signature + Digital Signature */}
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
                </div>{/* end flex:1 */}

                {/* Page 2 Footer */}
                <div style={{ textAlign: "center", fontSize: 11, paddingTop: 8, borderTop: "1px solid #000", marginTop: "auto" }}>
                    <div style={{ fontWeight: "bold" }}>
                        Plot No.141 C, Electronic Complex, Pardeshipura, Indore-452010 (INDIA) Ph. +91-4787555 (30 Lines), 4046055,4048055
                    </div>
                    <div>
                        Email : contact@kailtech.net,calibration@kailtech.net, Web: www.kailtech.net, CIN-U73100MP2006PTC019006
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Open invoice in a new tab with a Download PDF button ────────────────────
export function printCalibrationInvoice(templateProps, withLH, logoSrc, pageTitle) {
    const bodyHtml = renderToStaticMarkup(
        <InvoicePrintTemplate {...templateProps} withLH={withLH} logoSrc={logoSrc} />
    );

    const safeTitle = (pageTitle || templateProps.inv?.invoiceno || "Invoice")
        .replace(/[/\\:*?"<>|]/g, "_");

    const full = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${safeTitle}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    @page { size: A4; margin: 0; }
    @page :first { margin-top: 0; }
    body  { margin: 0; font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #111; background: #f5f5f5; }
    @media print {
      #toolbar { display: none !important; }
      body { background: #fff; }
      .invoice-wrap { box-shadow: none; margin: 0; padding: 10mm; padding-bottom: 5mm; }
      table { page-break-inside: auto; }
      tr { page-break-inside: avoid; break-inside: avoid; page-break-after: auto; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
    /* Toolbar */
    #toolbar {
      position: fixed; top: 0; left: 0; right: 0; z-index: 999;
      background: #1e3a5f; color: #fff;
      display: flex; align-items: center; gap: 12px;
      padding: 10px 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    }
    #toolbar span { font-size: 15px; font-weight: bold; flex: 1; }
    #toolbar button {
      background: #2563eb; color: #fff; border: none;
      padding: 8px 20px; border-radius: 6px; font-size: 14px;
      font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px;
    }
    #toolbar button:hover { background: #1d4ed8; }
    /* Invoice wrapper */
    .invoice-wrap {
      background: #fff;
      max-width: 900px;
      margin: 70px auto 30px auto;
      padding: 10mm;
      padding-bottom: 5mm;
      box-shadow: 0 4px 24px rgba(0,0,0,0.12);
    }
    table  { border-collapse: collapse; width: 100%; margin-bottom: 8px; table-layout: fixed; }
    th, td { border: 1px solid #000; padding: 6px 8px; font-size: 13px; vertical-align: middle; word-break: break-word; overflow: hidden; }
    th     { background: #f3f4f6; text-align: center; font-weight: bold; }
    td.right  { text-align: right; }
    td.center { text-align: center; }
    td.nob    { border: none; }
  </style>
</head>
<body>
  <!-- Download Toolbar -->
  <div id="toolbar">
    <span>📄 ${safeTitle}</span>
    <button onclick="window.print()">
      ⬇️ Download PDF
    </button>
  </div>
  <!-- Invoice Content -->
  <div class="invoice-wrap">
    ${bodyHtml}
  </div>
</body>
</html>`;

    const win = window.open("", "_blank");
    if (!win) { toast.error("Pop-up blocked — please allow pop-ups and try again."); return; }
    win.document.open();
    win.document.write(full);
    win.document.close();
    win.focus();
}