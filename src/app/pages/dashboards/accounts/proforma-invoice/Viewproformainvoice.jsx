// ViewProformaInvoice.jsx
// Route: /dashboards/accounts/proforma-invoice/view/:id
// Design: matches PHP viewproformainvoice.php exactly (Image 2)
// Logo: local import from assets/krtc.jpg

import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import axios from "utils/axios";
import { toast } from "sonner";
import { Page } from "components/shared/Page";
import logo from "assets/krtc.jpg"; // local logo

// ── Constants ─────────────────────────────────────────────────────────────
const COMPANY_STATE_CODE = "23";

const gstStateMap = {
  "01": "JAMMU AND KASHMIR",
  "02": "HIMACHAL PRADESH",
  "03": "PUNJAB",
  "04": "CHANDIGARH",
  "05": "UTTARAKHAND",
  "06": "HARYANA",
  "07": "DELHI",
  "08": "RAJASTHAN",
  "09": "UTTAR PRADESH",
  10: "BIHAR",
  11: "SIKKIM",
  12: "ARUNACHAL PRADESH",
  13: "NAGALAND",
  14: "MANIPUR",
  15: "MIZORAM",
  16: "TRIPURA",
  17: "MEGHALAYA",
  18: "ASSAM",
  19: "WEST BENGAL",
  20: "JHARKHAND",
  21: "ODISHA",
  22: "CHHATTISGARH",
  23: "MADHYA PRADESH",
  24: "GUJARAT",
  27: "MAHARASHTRA",
  29: "KARNATAKA",
  32: "KERALA",
  33: "TAMIL NADU",
  36: "TELANGANA",
  37: "ANDHRA PRADESH",
};

const fmt = (n) => parseFloat(n || 0).toFixed(2);

const formatDate = (dateStr) => {
  if (!dateStr || dateStr === "0000-00-00") return "—";
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
};

// ── Number to words (PHP: convert_number_to_words) ──────────────────────────
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

// ── Spinner ───────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div className="flex h-[60vh] items-center justify-center">
      <svg
        className="h-6 w-6 animate-spin text-blue-600"
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
    </div>
  );
}

// ── Invoice Print Content — pure inline styles, PHP layout exact ──────────
function InvoicePrintContent({
  invoice,
  items,
  company,
  rev,
  isSgst,
  statecode,
  stateName,
}) {
  const co = company?.company ?? {};
  const bank = company?.bank ?? {};
  const addr = company?.address ?? {};

  const border = "1px solid #ccc";
  const cellPad = "8px 10px";
  const fontBase = {
    fontFamily: "Arial, sans-serif",
    fontSize: 13,
    color: "#000",
    lineHeight: 1.5,
  };

  return (
    <div
      className="invoice-print-wrapper"
      style={{
        ...fontBase,
        background: "#fff",
        padding: "20px 24px",
        width: 940,
      }}
    >
      {/* ── PHP Header: logo left, NABL text + company name right ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 8,
        }}
      >
        {/* Left: logo */}
        <div style={{ width: "25%" }}>
          <img
            src={logo}
            alt="KTRC"
            style={{ height: 60, width: "auto", objectFit: "contain" }}
          />
        </div>
        {/* Right: NABL text + company name */}
        <div style={{ width: "73%", textAlign: "right" }}>
          <p
            style={{
              fontSize: 11,
              fontStyle: "italic",
              color: "#444",
              lineHeight: 1.5,
            }}
          >
            NABL Accredited as per IS/ISO/IEC 17025 (Certificate Nos. TC-7832
            &amp; CC-2348),
            <br />
            BIS Recognized &amp; ISO 9001 Certified Test &amp; Calibration
            Laboratory
          </p>
          <h2
            style={{
              margin: "4px 0 0",
              fontSize: 20,
              fontWeight: "bold",
              color: "#1a3a8f",
            }}
          >
            {co.name || "Kailtech Test And Research Centre Pvt. Ltd."}
          </h2>
        </div>
      </div>

      {/* ── PHP: PROFORMA INVOICE title center ── */}
      <div style={{ textAlign: "center", margin: "10px 0 14px" }}>
        <p
          style={{
            fontSize: 16,
            fontWeight: "bold",
            letterSpacing: 1,
            margin: 0,
          }}
        >
          PROFORMA INVOICE
        </p>
        <p style={{ fontSize: 13, margin: "3px 0 0", color: "#333" }}>
          For {invoice.typeofinvoice} Charges
        </p>
      </div>

      {/* ── PHP: Customer left, Invoice info right ── */}
      <table
        style={{ width: "100%", borderCollapse: "collapse", marginBottom: 0 }}
      >
        <tbody>
          <tr>
            {/* Customer cell — PHP: col-xs-3 */}
            <td
              style={{
                width: "60%",
                border,
                padding: cellPad,
                verticalAlign: "top",
                lineHeight: 1.6,
              }}
            >
              <p style={{ fontWeight: "bold", margin: "0 0 4px" }}>Customer:</p>
              <p style={{ margin: 0 }}>M/s. {invoice.customername}</p>
              <p style={{ margin: 0, paddingLeft: 44 }}>{invoice.address}</p>
              <div style={{ marginTop: 4 }}>
                <span style={{ marginRight: 40 }}>
                  <b>State name : </b>
                  {stateName}
                </span>
                <span>
                  <b>State code : </b>
                  {statecode}
                </span>
              </div>
              <div style={{ marginTop: 2 }}>
                <span style={{ marginRight: 40 }}>
                  <b>GSTIN/UIN : </b>
                  {invoice.gstno}
                </span>
                <span>
                  <b>PAN : </b>
                  {invoice.pan}
                </span>
              </div>
              {invoice.concernpersonname && (
                <p style={{ margin: "6px 0 0", fontSize: 12 }}>
                  Kind Attn. {invoice.concernpersonname}
                </p>
              )}
            </td>
            {/* Invoice info cell */}
            <td
              style={{
                border,
                padding: cellPad,
                verticalAlign: "top",
                lineHeight: 1.8,
              }}
            >
              <p style={{ margin: 0 }}>
                <b>Proforma Invoice No. : </b>
                {invoice.invoiceno}
                {rev}
              </p>
              <p style={{ margin: 0 }}>
                <b>Date : </b>
                {formatDate(invoice.invoicedate)}
              </p>
              <p style={{ margin: 0 }}>
                <b>Ref. No./ Date : </b>
                {invoice.refno} / {formatDate(invoice.refdate)}
              </p>
            </td>
          </tr>
        </tbody>
      </table>

      {/* ── PHP: Items table ── */}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#f5f5f5" }}>
            <th
              style={{
                border,
                padding: cellPad,
                textAlign: "center",
                width: 70,
                fontSize: 12,
                fontWeight: "bold",
              }}
            >
              S. No.
            </th>
            <th
              style={{
                border,
                padding: cellPad,
                textAlign: "center",
                fontSize: 12,
                fontWeight: "bold",
              }}
            >
              Description
            </th>
            <th
              style={{
                border,
                padding: cellPad,
                textAlign: "center",
                width: 80,
                fontSize: 12,
                fontWeight: "bold",
              }}
            >
              No
            </th>
            <th
              style={{
                border,
                padding: cellPad,
                textAlign: "center",
                width: 90,
                fontSize: 12,
                fontWeight: "bold",
              }}
            >
              Rate
            </th>
            <th
              style={{
                border,
                padding: cellPad,
                textAlign: "right",
                width: 110,
                fontSize: 12,
                fontWeight: "bold",
              }}
            >
              Amount
            </th>
          </tr>
        </thead>
        <tbody>
          {/* PHP: Note row */}
          <tr>
            <td colSpan={5} style={{ border, padding: cellPad, fontSize: 12 }}>
              <b>Note:</b> This is a proforma invoice and is not valid for GST
              related matters.
            </td>
          </tr>
          {items.map((item, i) => (
            <tr key={i}>
              <td style={{ border, padding: cellPad, textAlign: "center" }}>
                {item.sr_no ?? i + 1}
              </td>
              <td style={{ border, padding: cellPad }}>
                {/* PHP: Calibration → name, Testing → description */}
                {invoice.typeofinvoice === "Calibration"
                  ? item.name || item.description
                  : item.description}
              </td>
              <td style={{ border, padding: cellPad, textAlign: "center" }}>
                {item.qty}
              </td>
              <td style={{ border, padding: cellPad, textAlign: "center" }}>
                {item.rate}
              </td>
              <td
                style={{
                  border,
                  padding: cellPad,
                  textAlign: "right",
                  fontFamily: "monospace",
                }}
              >
                {fmt(item.amount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ── PHP: Footer table — company info left, totals right ── */}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <tbody>
          <tr>
            {/* Company info — PHP: col-xs-2 side */}
            <td
              style={{
                width: "60%",
                border,
                padding: cellPad,
                verticalAlign: "bottom",
                fontSize: 12,
                lineHeight: 1.7,
              }}
            >
              <p style={{ margin: 0 }}>PAN : {co.pan_no || "AADCK0799A"}</p>
              <p style={{ margin: 0 }}>
                GSTIN : {co.gst_no || "23AADCK0799A1ZV"}
              </p>
              <p style={{ margin: 0 }}>
                SAC Code : {co.sac_code || "998394"} Category : Scientific and
                Technical Consultancy Services
              </p>
              {co.sme_no && (
                <p style={{ margin: 0 }}>
                  Small Enterprises Registration No. : {co.sme_no}
                </p>
              )}
              <p style={{ margin: 0 }}>
                CIN NO. {co.cin_no || "U73100MP2006PTC019006"}
              </p>
            </td>
            {/* Totals — PHP: col-xs-3 side */}
            <td
              style={{
                border,
                padding: cellPad,
                verticalAlign: "top",
                fontSize: 13,
              }}
            >
              {/* PHP: Subtotal row */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "3px 0",
                }}
              >
                <span>Subtotal</span>
                <span style={{ fontFamily: "monospace" }}>
                  {fmt(invoice.subtotal)}
                </span>
              </div>
              {parseFloat(invoice.discnumber) > 0 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "3px 0",
                  }}
                >
                  <span>
                    Discount ({invoice.discnumber}
                    {invoice.disctype === "%" ? "%" : ""})
                  </span>
                  <span style={{ fontFamily: "monospace" }}>
                    {fmt(invoice.discount)}
                  </span>
                </div>
              )}
              {parseFloat(invoice.witnesscharges) > 0 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "3px 0",
                  }}
                >
                  <span>
                    Witness Charges ({invoice.witnessnumber}
                    {invoice.witnesstype === "%" ? "%" : ""})
                  </span>
                  <span style={{ fontFamily: "monospace" }}>
                    {fmt(invoice.witnesscharges)}
                  </span>
                </div>
              )}
              {parseFloat(invoice.samplehandling) > 0 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "3px 0",
                  }}
                >
                  <span>Sample Handling</span>
                  <span style={{ fontFamily: "monospace" }}>
                    {fmt(invoice.samplehandling)}
                  </span>
                </div>
              )}
              {parseFloat(invoice.sampleprep) > 0 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "3px 0",
                  }}
                >
                  <span>Sample Preparation Charges</span>
                  <span style={{ fontFamily: "monospace" }}>
                    {fmt(invoice.sampleprep)}
                  </span>
                </div>
              )}
              {parseFloat(invoice.freight) > 0 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "3px 0",
                  }}
                >
                  <span>Freight Charges</span>
                  <span style={{ fontFamily: "monospace" }}>
                    {fmt(invoice.freight)}
                  </span>
                </div>
              )}
              {parseFloat(invoice.mobilisation) > 0 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "3px 0",
                  }}
                >
                  <span>Mobilization and Demobilization Charges</span>
                  <span style={{ fontFamily: "monospace" }}>
                    {fmt(invoice.mobilisation)}
                  </span>
                </div>
              )}
              {/* Total before tax */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "3px 0",
                }}
              >
                <span>Total</span>
                <span style={{ fontFamily: "monospace" }}>
                  {fmt(invoice.subtotal2)}
                </span>
              </div>
              {/* PHP: $sgst==1 → CGST+SGST else IGST */}
              {isSgst ? (
                <>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "3px 0",
                    }}
                  >
                    <span>CGST {invoice.cgstper}%</span>
                    <span style={{ fontFamily: "monospace" }}>
                      {fmt(invoice.cgstamount)}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "3px 0",
                    }}
                  >
                    <span>SGST {invoice.sgstper}%</span>
                    <span style={{ fontFamily: "monospace" }}>
                      {fmt(invoice.sgstamount)}
                    </span>
                  </div>
                </>
              ) : (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "3px 0",
                  }}
                >
                  <span>IGST {invoice.igstper}%</span>
                  <span style={{ fontFamily: "monospace" }}>
                    {fmt(invoice.igstamount)}
                  </span>
                </div>
              )}
            </td>
          </tr>

          {/* IN WORDS + Total Charges */}
          <tr>
            <td style={{ border, padding: cellPad, fontSize: 13 }}>
              <b>(IN WORDS):</b> Rs. {numberToWords(invoice.total || 0)} only
            </td>
            <td style={{ border, padding: cellPad }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontWeight: "bold",
                  fontSize: 13,
                }}
              >
                <span>Total Charges</span>
                <span style={{ fontFamily: "monospace" }}>
                  {fmt(invoice.total)}
                </span>
              </div>
            </td>
          </tr>

          {/* Bank details + Authorised Signatory */}
          <tr>
            <td
              style={{
                border,
                padding: cellPad,
                fontSize: 12,
                lineHeight: 1.7,
                verticalAlign: "bottom",
              }}
            >
              <p style={{ margin: 0 }}>
                For online payments - {bank.account_name}
              </p>
              <p style={{ margin: 0 }}>
                Bank Name : {bank.bank_name}, Branch Name : {bank.branch}
              </p>
              <p style={{ margin: 0 }}>
                Bank Account No. : {bank.account_no}, A/c Type :{" "}
                {bank.account_type}
              </p>
              <p style={{ margin: 0 }}>
                IFSC CODE: {bank.ifsc}, MICR CODE: {bank.micr}
              </p>
              <br />
              <p style={{ margin: 0 }}>
                Certified that the particulars given above are true and correct.
              </p>
            </td>
            <td
              style={{
                border,
                padding: cellPad,
                fontSize: 13,
                verticalAlign: "bottom",
              }}
            >
              <p style={{ margin: 0 }}>For {co.name}</p>

              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px", minHeight: "80px" }}>
                {/* SEAL - Hidden by default, shown during Export */}
                <div className="pi-seal hidden print:block">
                  <img src="/images/seal.png" alt="Seal" style={{ width: "80px", objectFit: "contain" }} />
                </div>

                {/* SIGNATURE */}
                {invoice.status == 1 && invoice.approved_by ? (
                  (invoice.digitalSign || invoice.digital_signature) ? (
                    <img src={invoice.digitalSign || invoice.digital_signature} alt="Signature" style={{ maxHeight: "110px", objectFit: "contain" }} />
                  ) : (
                    <div style={{ fontFamily: "monospace", fontSize: "12px", lineHeight: 1.2, color: "#000", whiteSpace: "pre-line" }}>
                      <p style={{ margin: 0 }}>Electronically signed by</p>
                      <p style={{ margin: 0 }}>{invoice.signature_by || invoice.approved_by_name || "Authorised Signatory"} {invoice.signature_emp_id ? `(Emp - ${invoice.signature_emp_id})` : ""}</p>
                      <p style={{ margin: 0 }}>Designation:{invoice.signature_designation || "Manager-Accounts"}</p>
                      <p style={{ margin: 0 }}>Date:{invoice.datedon || (invoice.approved_on ? formatDate(invoice.approved_on) : "")}</p>
                    </div>
                  )
                ) : (
                  <div style={{ paddingTop: "40px" }}>
                    <p style={{ margin: 0, textDecoration: "underline" }}>
                      Authorised Signatory
                    </p>
                  </div>
                )}
              </div>
            </td>
          </tr>

          {/* Remark + Terms & Conditions */}
          <tr className="print-page-break">
            <td
              colSpan={2}
              style={{
                border,
                padding: cellPad,
                fontSize: 12,
                lineHeight: 1.7,
              }}
            >
              {invoice.remark && (
                <p style={{ margin: "0 0 6px" }}>
                  <b>Remark :</b> {invoice.remark}
                </p>
              )}
              <p
                style={{
                  margin: "0 0 4px",
                  fontWeight: "bold",
                  textDecoration: "underline",
                }}
              >
                Terms &amp; Conditions:
              </p>
              <ol style={{ paddingLeft: 22, margin: 0, lineHeight: 1.8 }}>
                <li>
                  Rates are for the tests conducted at our Lab at {addr.city} (
                  {addr.state}) {addr.country}.
                </li>
                <li>
                  Cross Cheque/Demand Draft/NEFT/RTGS should be drawn in favour
                  of {co.name}. Payable at {addr.city} ({addr.state}).
                </li>
                <li>
                  Please attach bill details indicating Quotation No. / Proforma
                  Invoice No. &amp; TDS deductions if any, along with your
                  payment.
                </li>
                <li>
                  Taxes are applicable as per the prevailing rates at the time
                  of Invoicing-Currently GST of 18% is applicable on all
                  invoices.
                </li>
                <li>
                  For GST registered Customer the GST No. is mandatory for
                  sample registration in order for the same to be included in
                  the tax invoices.
                </li>
                <li>Kindly arrange to provide 100% advance payment.</li>
                <li>
                  Payment not made with in 15 days from the date of issued PI
                  will attract interest @ 24% P.A.
                </li>
                <li>
                  If the payment is to be paid in Cash pay to UPI{" "}
                  <b>0795933A0099960.bqr@kotak</b> only and take official
                  receipt. Else claim of payment, shall not be accepted
                </li>
                <li>
                  Subject to exclusive jurisdiction of courts at {addr.city} (
                  {addr.state}) only.
                </li>
                <li>Errors &amp; omissions accepted.</li>
              </ol>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────
export default function ViewProformaInvoice() {
  const { id } = useParams();
  const navigate = useNavigate();
  const pdfRef = useRef(null);

  const [invoice, setInvoice] = useState(null);
  const [items, setItems] = useState([]);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [invRes, compRes] = await Promise.all([
          axios.get(`/accounts/view-proforma-invoice/${id}`),
          axios.get("/get-company-info"),
        ]);
        const invData = invRes.data.data;
        if (invData?.invoice) {
          const signUrl = invData.digitalSign || invData.signatureImage || "";
          setInvoice({
            ...invData.invoice,
            digitalSign: signUrl
          });
          setItems(invData.items ?? []);
        } else {
          setInvoice(invData ?? null);
          setItems(invData?.items ?? []);
        }
        setCompany(compRes.data.data ?? null);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load invoice");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleDownloadPDF = () => {
    // We use the browser's native print dialog which allows "Save as PDF".
    // This generates a perfect, text-searchable, vector PDF and respects page breaks,
    // unlike html2canvas which just slices a blurry image and cuts text in half.
    setTimeout(() => {
      window.print();
    }, 100);
  };

  if (loading)
    return (
      <Page title="View Proforma Invoice">
        <Spinner />
      </Page>
    );

  if (!invoice) {
    return (
      <Page title="View Proforma Invoice">
        <div className="flex h-[60vh] flex-col items-center justify-center gap-3">
          <span className="text-4xl">📄</span>
          <p className="dark:text-dark-300 font-medium text-gray-600">
            Invoice not found
          </p>
          <button
            onClick={() => navigate("/dashboards/accounts/proforma-invoice")}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Back to Invoice List
          </button>
        </div>
      </Page>
    );
  }

  const statecode = String(invoice.statecode || "").padStart(2, "0");
  const isSgst = statecode === COMPANY_STATE_CODE;
  const stateName = gstStateMap[statecode] ?? statecode;
  const rev =
    invoice.rev && invoice.rev !== 0
      ? `/${String(invoice.rev).padStart(2, "0")}`
      : "";

  const sharedProps = {
    invoice,
    items,
    company,
    rev,
    isSgst,
    statecode,
    stateName,
  };

  return (
    <Page title="View Proforma Invoice">
      <div className="transition-content px-[var(--margin-x)] pb-8">
        <style>{`
          @media print {
            .print\\:hidden, .sidebar-panel, .app-header { display: none !important; }
            body { padding: 0 !important; margin: 0 !important; background: white !important; }
            .transition-content { padding: 0 !important; margin: 0 !important; }
            @page { size: portrait; margin: 0.5cm; }
            .invoice-print-wrapper { width: 100% !important; max-width: 100% !important; padding: 0 !important; }
            .print-page-break { break-before: page; page-break-before: always; }
          }
        `}</style>
        {/* Action Buttons */}
        <div className="mb-4 flex items-center gap-2 print:hidden">
          <button
            onClick={handleDownloadPDF}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
              />
            </svg>
            Export PDF Invoice
          </button>

          <button
            onClick={() => navigate("/dashboards/accounts/proforma-invoice")}
            className="dark:border-dark-500 dark:bg-dark-800 dark:text-dark-200 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Back To Invoice List
          </button>
        </div>

        {/* Screen view — bordered card */}
        <div className="dark:border-dark-600 dark:bg-dark-800 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <InvoicePrintContent {...sharedProps} />
        </div>

        {/* Hidden off-screen div for PDF — pure inline styles only, zero Tailwind */}
        <div
          style={{
            position: "fixed",
            top: "-99999px",
            left: "-99999px",
            zIndex: -1,
          }}
        >
          <div ref={pdfRef}>
            <InvoicePrintContent {...sharedProps} />
          </div>
        </div>
      </div>
    </Page>
  );
}