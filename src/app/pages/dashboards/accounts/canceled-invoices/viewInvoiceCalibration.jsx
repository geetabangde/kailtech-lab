// ViewInvoiceCalibration.jsx — Complete invoice view with approve & e-invoice generation
// PHP: viewinvoice.php
// APIs:
//   GET /accounts/view-past-invoice/{id}
//   POST /accounts/approve-past-invoice
//   POST /accounts/generate-einvoice
//   GET /accounts/validate-gstin?gst={gstin}

import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import axios from "utils/axios";
import { toast } from "sonner";
import { Page } from "components/shared/Page";
import { parseUserPermissions } from "utils/permissions";
import logo from "assets/krtc.jpg";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const fmt = (v) => parseFloat(v || 0).toFixed(2);

function fmtDate(val) {
  if (!val || val === "0000-00-00" || val === "0000-00-00 00:00:00") return "—";
  const d = new Date(val);
  if (isNaN(d)) return val;
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function numberToWords(num) {
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];

  if (num === 0) return "Zero";
  if (num < 10) return ones[num];
  if (num < 20) return teens[num - 10];
  if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? " " + ones[num % 10] : "");
  if (num < 1000) return ones[Math.floor(num / 100)] + " Hundred" + (num % 100 ? " " + numberToWords(num % 100) : "");
  if (num < 100000) return numberToWords(Math.floor(num / 1000)) + " Thousand" + (num % 1000 ? " " + numberToWords(num % 1000) : "");
  if (num < 10000000) return numberToWords(Math.floor(num / 100000)) + " Lakh" + (num % 100000 ? " " + numberToWords(num % 100000) : "");
  return numberToWords(Math.floor(num / 10000000)) + " Crore" + (num % 10000000 ? " " + numberToWords(num % 10000000) : "");
}

async function toBase64(url) {
  if (!url) return "";
  try {
    const res = await fetch(url, { mode: "cors", cache: "force-cache" });
    if (!res.ok) throw new Error();
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  } catch {
    return "";
  }
}

async function capturePdf(printRef, filename) {
  try {
    const el = printRef.current;
    if (!el) return;

    el.style.display = "block";
    const canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      onclone: (clonedDoc) => {
        clonedDoc
          .querySelectorAll('style, link[rel="stylesheet"]')
          .forEach((node) => node.remove());
        clonedDoc.documentElement.removeAttribute("style");
      },
    });
    el.style.display = "none";

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const margin = 8;
    const contentW = pageW - margin * 2;
    const contentH = (canvas.height * contentW) / canvas.width;
    const pageContentH = pageH - margin * 2;

    let srcY = 0;
    let remaining = contentH;
    let firstPage = true;

    while (remaining > 0) {
      if (!firstPage) pdf.addPage();
      firstPage = false;

      const sliceH = Math.min(remaining, pageContentH);
      const sliceCanvas = document.createElement("canvas");
      sliceCanvas.width = canvas.width;
      sliceCanvas.height = Math.round((sliceH / contentH) * canvas.height);
      sliceCanvas.getContext("2d").drawImage(
        canvas,
        0,
        srcY,
        canvas.width,
        sliceCanvas.height,
        0,
        0,
        canvas.width,
        sliceCanvas.height,
      );

      pdf.addImage(
        sliceCanvas.toDataURL("image/png"),
        "PNG",
        margin,
        margin,
        contentW,
        sliceH,
      );
      srcY += sliceCanvas.height;
      remaining -= sliceH;
    }

    pdf.save(filename);
    toast.success("PDF downloaded");
  } catch (error) {
    console.error("PDF error", error);
    toast.error("Failed to generate PDF");
  }
}

const S = {
  wrap: {
    fontFamily: "Arial,Helvetica,sans-serif",
    fontSize: 12,
    color: "#111",
    backgroundColor: "#fff",
    padding: 20,
    width: 794,
  },
  table: { width: "100%", borderCollapse: "collapse", marginBottom: 8 },
  th: {
    border: "1px solid #000",
    padding: "4px 6px",
    textAlign: "center",
    backgroundColor: "#f3f4f6",
    fontSize: 11,
  },
  td: {
    border: "1px solid #000",
    padding: "4px 6px",
    fontSize: 11,
    verticalAlign: "top",
  },
  tdR: {
    border: "1px solid #000",
    padding: "4px 8px",
    fontSize: 11,
    verticalAlign: "top",
    textAlign: "right",
  },
  tdC: {
    border: "1px solid #000",
    padding: "4px 6px",
    fontSize: 11,
    verticalAlign: "top",
    textAlign: "center",
  },
  label: { fontWeight: "bold" },
};

function InvoicePrintTemplate({
  inv,
  items,
  qrUrl,
  signUrl,
  digitalSignUrl,
  withLH,
}) {
  const statecode = !isNaN(Number(inv.statecode))
    ? String(Number(inv.statecode)).padStart(2, "0")
    : inv.statecode;
  const isSGST = String(statecode) === "23";
  const status = Number(inv.status);
  const safeQrUrl = qrUrl && qrUrl.startsWith("data:") ? qrUrl : null;

  return (
    <div style={{ ...S.wrap, paddingTop: !withLH ? 130 : 16 }}>
      {withLH && (
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 12,
            marginBottom: 8,
          }}
        >
          <img
            src={logo}
            alt="Logo"
            style={{ height: 60, width: "auto" }}
            crossOrigin="anonymous"
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
              NABL Accredited as per IS/ISO/IEC 17025 (Certificate Nos. TC-7832
              & CC-2348),
              <br />
              BIS Recognized & ISO 9001 Certified Test & Calibration Laboratory
            </p>
            <div
              style={{
                fontSize: 18,
                fontWeight: "bold",
                color: "navy",
                marginTop: 4,
              }}
            >
              Kailtech Test And Research Centre Pvt. Ltd.
            </div>
          </div>
        </div>
      )}

      <div style={{ textAlign: "center", marginBottom: 8 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: "bold",
            textTransform: "uppercase",
          }}
        >
          TAX INVOICE
        </div>
        <div style={{ fontSize: 12 }}>
          For {inv.typeofinvoice ?? "Testing"} Charges
        </div>
        <div
          style={{
            fontSize: 11,
            fontWeight: "bold",
            textTransform: "uppercase",
          }}
        >
          ORIGINAL FOR RECIPIENT
        </div>
      </div>

      <table style={S.table}>
        <tbody>
          <tr>
            <td style={{ ...S.td, width: "50%" }} colSpan={2}>
              <div style={S.label}>Customer:</div>
              <strong>{inv.customername}</strong>
              <br />
              {inv.addressStr}
              <div style={{ marginTop: 4 }}>
                <span style={S.label}>State name: </span>
                {inv.statename ?? statecode}
                {"  "}
                <span style={S.label}>State code: </span>
                {statecode ?? "NA"}
              </div>
              <div>
                <span style={S.label}>GSTIN/UIN: </span>
                {inv.gstno ?? "-"}
                {"  "}
                <span style={S.label}>PAN: </span>
                {inv.pan ?? "-"}
              </div>
            </td>
            <td
              style={{
                ...S.td,
                width: "30%",
                borderRight: status === 2 && safeQrUrl ? undefined : "none",
              }}
              colSpan={status === 2 && safeQrUrl ? 2 : 3}
            >
              <div>
                <span style={S.label}>Invoice No.: </span>
                {inv.invoiceno}
              </div>
              <div>
                <span style={S.label}>Date: </span>
                {fmtDate(inv.approved_on ?? inv.invoicedate)}
              </div>
              <div>
                <span style={S.label}>P.O. No./Date: </span>
                {inv.ponumber ?? inv.pono ?? "-"}
              </div>
            </td>
            {status === 2 && safeQrUrl && (
              <td style={{ ...S.td, borderLeft: "none", width: 80 }}>
                <div style={{ border: "2px solid #000", overflow: "hidden" }}>
                  <img
                    src={safeQrUrl}
                    alt="QR"
                    style={{ width: "100%" }}
                    crossOrigin="anonymous"
                  />
                </div>
              </td>
            )}
          </tr>
        </tbody>
      </table>

      <table style={S.table}>
        <thead>
          <tr>
            <th style={{ ...S.th, width: "8%" }}>S. No.</th>
            <th style={{ ...S.th, width: "52%" }}>Description</th>
            <th style={S.th}>
              {items.some((item) => item.meter_option == 1) ? "Meter's" : "No's"}
            </th>
            {inv.potype === "Normal" && (
              <>
                <th style={S.th}>Rate</th>
                <th style={S.th}>Amount</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={item.id ?? index}>
              <td style={S.tdC}>{index + 1}</td>
              <td style={S.td}>{item.description}</td>
              <td style={S.tdC}>
                {item.meter_option == 1 ? item.meter : item.qty}
              </td>
              {inv.potype === "Normal" && (
                <>
                  <td style={S.tdC}>{item.rate}</td>
                  <td style={S.tdR}>{fmt(item.amount)}</td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      <table style={S.table}>
        <tbody>
          <tr>
            <td style={{ ...S.td, width: "60%" }} colSpan={3} rowSpan={12}>
              {status === 2 && inv.irn && (
                <div style={{ marginBottom: 6, fontSize: 10 }}>
                  <div>
                    <strong>Irn No:</strong> {inv.irn}
                  </div>
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
                <div>
                  <strong>BRN No:</strong> {inv.brnnos}
                </div>
              )}
              {inv.remark?.trim() && (
                <div>
                  <strong>Remark:</strong> {inv.remark}
                </div>
              )}
              <div>PAN : AADCK0799A</div>
              <div>GSTIN : 23AADCK0799A1ZV</div>
              <div>
                SAC Code : 998394 Category : Scientific and Technical
                Consultancy Services
              </div>
            </td>
            <td style={S.td}>Subtotal</td>
            <td style={S.tdR}>{fmt(inv.subtotal)}</td>
          </tr>
          <tr>
            <td style={S.td}>Discount</td>
            <td style={S.tdR}>{fmt(inv.discount)}</td>
          </tr>
          <tr>
            <td style={S.td}>Freight Charges</td>
            <td style={S.tdR}>{fmt(inv.freight)}</td>
          </tr>
          <tr>
            <td style={S.td}>Mobilization Charges</td>
            <td style={S.tdR}>{fmt(inv.mobilisation)}</td>
          </tr>
          <tr>
            <td style={S.td}>Witness Charges</td>
            <td style={S.tdR}>{fmt(inv.witnesscharges)}</td>
          </tr>
          <tr>
            <td style={S.td}>Sample Handling</td>
            <td style={S.tdR}>{fmt(inv.samplehandling)}</td>
          </tr>
          <tr>
            <td style={S.td}>Sample Preparation</td>
            <td style={S.tdR}>{fmt(inv.sampleprep)}</td>
          </tr>
          <tr>
            <td style={S.td}>Total</td>
            <td style={S.tdR}>{fmt(inv.subtotal2)}</td>
          </tr>
          {isSGST ? (
            <>
              <tr>
                <td style={S.td}>CGST {inv.cgstper}%</td>
                <td style={S.tdR}>{fmt(inv.cgstamount)}</td>
              </tr>
              <tr>
                <td style={S.td}>SGST {inv.sgstper}%</td>
                <td style={S.tdR}>{fmt(inv.sgstamount)}</td>
              </tr>
            </>
          ) : (
            <tr>
              <td style={S.td}>IGST {inv.igstper}%</td>
              <td style={S.tdR}>{fmt(inv.igstamount)}</td>
            </tr>
          )}
          <tr>
            <td style={S.td}>Total Charges With tax</td>
            <td style={S.tdR}>{fmt(inv.total)}</td>
          </tr>
          <tr>
            <td style={S.td}>Round off</td>
            <td style={S.tdR}>{fmt(inv.roundoff)}</td>
          </tr>
          <tr>
            <td style={{ ...S.td, borderRight: "none" }} colSpan={3}>
              <strong>(IN WORDS):</strong> Rs.{" "}
              {numberToWords(Math.round(inv.finaltotal ?? 0))} Only
            </td>
            <td style={{ ...S.td, borderLeft: "none" }}>
              <strong>Total {inv.typeofinvoice ?? "Testing"} Charges</strong>
            </td>
            <td style={{ ...S.tdR, fontWeight: "bold" }}>
              {fmt(Math.round(inv.finaltotal ?? 0))}
            </td>
          </tr>
        </tbody>
      </table>

      <table style={S.table}>
        <tbody>
          <tr>
            <td style={{ ...S.td, width: "60%", borderRight: "none" }}>
              <div>For online payments - {inv.bankaccountname ?? ""}</div>
              <div>
                Bank Name : {inv.bankname ?? ""}, Branch Name :{" "}
                {inv.bankbranch ?? ""}
              </div>
              <div>
                Bank Account No. : {inv.bankaccountno ?? ""}, A/c Type :{" "}
                {inv.bankactype ?? ""}
              </div>
              <div>
                IFSC CODE: {inv.bankifsccode ?? ""}, MICR CODE:{" "}
                {inv.bankmicr ?? ""}
              </div>
            </td>
            <td style={{ ...S.td, borderLeft: "none", textAlign: "right" }}>
              <div>
                For {inv.companyname ?? "KAILTECH TEST AND RESEARCH CENTRE PVT LTD."}
              </div>
              {(status === 1 || status === 2) && (
                <div style={{ marginTop: 8 }}>
                  {signUrl && (
                    <img
                      src={signUrl}
                      alt="Sign"
                      crossOrigin="anonymous"
                      style={{ width: 100, height: 40, objectFit: "contain" }}
                    />
                  )}
                  {digitalSignUrl && (
                    <img
                      src={digitalSignUrl}
                      alt="Digital Sign"
                      crossOrigin="anonymous"
                      style={{ maxHeight: 50, objectFit: "contain" }}
                    />
                  )}
                </div>
              )}
              <div style={{ marginTop: 8 }}>
                <u>Authorised Signatory</u>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default function ViewInvoiceCalibration() {
  const { id } = useParams();
  const navigate = useNavigate();
  const printWithLH = useRef(null);
  const printWithoutLH = useRef(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [einvModal, setEinvModal] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [imgBase64, setImgBase64] = useState({ qr: "", sign: "", dSign: "" });

  const permissions = useMemo(() => {
    if (typeof window === "undefined") return [];
    return parseUserPermissions(localStorage.getItem("userPermissions"));
  }, []);

  useEffect(() => {
    // Fetch both APIs - view has display data, get has detailed data
    Promise.all([
      axios.get(`/accounts/view-calibration-invoice/${id}`),
      axios.get(`/accounts/get-calibration-invoicebyid/${id}`)
    ])
      .then(([viewRes, detailRes]) => {
        const viewData = viewRes.data?.data ?? viewRes.data;
        const detailData = detailRes.data?.data ?? detailRes.data;
        
        // Merge: use invoice from view, but add items/address/customer from detail if missing
        const merged = {
          ...viewData.invoice,
          ...detailData.invoice,
          address: viewData.address ?? detailData.address,
          items: viewData.items ?? detailData.items ?? [],
          qr_image: viewData.qr_image,
          signature_image: viewData.signature_image,
          digital_signature: viewData.digital_signature,
          customer: detailData.customer,
          // Format address string from address object
          addressStr: (() => {
            const addr = viewData.address ?? detailData.address;
            if (!addr) return "";
            if (typeof addr === "string") return addr;
            return [addr.address, addr.city, addr.pincode].filter(Boolean).join(", ");
          })(),
        };
        
        console.log("Merged invoice data:", merged);
        setData(merged);
      })
      .catch((err) => {
        console.error("Failed to load invoice:", err);
        toast.error("Failed to load invoice");
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!data) return;

    let active = true;
    const loadImages = async () => {
      const [qr, sign, dSign] = await Promise.all([
        toBase64(data.qr_image),
        toBase64(data.signature_image ?? data.approved_by_signature),
        toBase64(data.digital_signature),
      ]);
      if (active) {
        setImgBase64({ qr, sign, dSign });
      }
    };

    loadImages();
    return () => {
      active = false;
    };
  }, [data]);

  const isSGST = data?.sgst == 1 || String(data?.statecode).trim() === "23";
  const isDraft = data?.status == 0;
  const isApproved = data?.status == 1;
  const isEinvoice = data?.status == 2;
  const isNormal = data?.potype === "Normal";
  const isFOC = data?.invoiceno === "FOC";

  const canApprove = useMemo(() => {
    if (!data || data.status != 0) return false;
    const amt = parseFloat(data.finaltotal ?? 0);
    if (amt <= 5000 && permissions.includes(269)) return true;
    if (amt > 5000 && permissions.includes(270)) return true;
    return false;
  }, [data, permissions]);

  const handleApprove = async () => {
    if (!window.confirm("Are you sure you want to approve this invoice?")) return;
    try {
      setBusy(true);
      await axios.post("/accounts/approve-past-invoice", {
        id,
        invoiceid: id,
      });
      toast.success("Invoice approved");
      window.location.reload();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message ?? "Failed to approve invoice");
    } finally {
      setBusy(false);
    }
  };

  const confirmGenerateEinvoice = async () => {
    if (!window.confirm("Are you sure you want to generate E-Invoice?")) return;
    try {
      setBusy(true);
      await axios.post("/accounts/generate-einvoice", { invoiceid: id });
      toast.success("E-Invoice generated");
      setEinvModal(false);
      window.location.reload();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message ?? "Failed to generate E-Invoice");
    } finally {
      setBusy(false);
    }
  };

  const handlePdfWithLH = async () => {
    setPdfBusy(true);
    await capturePdf(printWithLH, `${data?.invoiceno ?? "invoice"}.pdf`);
    setPdfBusy(false);
  };

  const handlePdfWithoutLH = async () => {
    setPdfBusy(true);
    await capturePdf(
      printWithoutLH,
      `${data?.invoiceno ?? "invoice"}withoutletterhead.pdf`,
    );
    setPdfBusy(false);
  };

  if (loading) {
    return (
      <Page title="View Invoice">
        <div className="flex h-[60vh] items-center justify-center gap-3 text-gray-500">
          <svg
            className="h-5 w-5 animate-spin text-blue-500"
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
      </Page>
    );
  }

  if (!data) {
    return (
      <Page title="View Invoice">
        <div className="flex h-[60vh] items-center justify-center text-gray-400">
          Invoice not found.
        </div>
      </Page>
    );
  }

  const amountInWords = numberToWords(Math.round(data.finaltotal ?? 0));
  const templateProps = {
    inv: data,
    items: data.items ?? [],
    qrUrl: imgBase64.qr || data.qr_image,
    signUrl: imgBase64.sign || data.signature_image || data.approved_by_signature,
    digitalSignUrl: imgBase64.dSign || data.digital_signature,
  };

  function StatusBadge({ status }) {
    const map = {
      0: { label: "DRAFT", cls: "bg-gray-200 text-gray-700" },
      1: { label: "APPROVED", cls: "bg-green-100 text-green-800" },
      2: { label: "E-INVOICE", cls: "bg-blue-100 text-blue-800" },
    };
    const s = map[status] ?? {
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

  return (
    <Page title="View Invoice">
      <div className="px-4 pb-10 sm:px-6">
        <div
          style={{ position: "absolute", top: -9999, left: -9999, zIndex: -1 }}
        >
          <div ref={printWithLH} style={{ display: "none" }}>
            <InvoicePrintTemplate {...templateProps} withLH={true} />
          </div>
        </div>
        <div
          style={{ position: "absolute", top: -9999, left: -9999, zIndex: -1 }}
        >
          <div ref={printWithoutLH} style={{ display: "none" }}>
            <InvoicePrintTemplate {...templateProps} withLH={false} />
          </div>
        </div>

        {/* Action buttons */}
        <div className="dark:border-dark-600 dark:bg-dark-800 mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 print:hidden">
          <button
            onClick={handlePdfWithLH}
            disabled={pdfBusy}
            className="inline-flex items-center gap-1.5 rounded bg-sky-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-60"
          >
            {pdfBusy ? (
              <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z" />
              </svg>
            ) : (
              <svg
                className="h-3.5 w-3.5"
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
            )}
            Export PDF Invoice
          </button>
          <button
            onClick={handlePdfWithoutLH}
            disabled={pdfBusy}
            className="inline-flex items-center gap-1.5 rounded bg-sky-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-60"
          >
            <svg
              className="h-3.5 w-3.5"
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
            Export PDF Without LetterHead
          </button>
          <button
            onClick={() => navigate("/dashboards/accounts/canceled-invoices")}
            className="rounded bg-sky-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-700"
          >
            Back To Invoice list
          </button>
          {canApprove && (
            <button
              onClick={handleApprove}
              disabled={busy}
              className="rounded bg-green-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"
            >
              {busy ? "Approving..." : "Approve"}
            </button>
          )}
          <div className="ml-auto">
            <StatusBadge status={data.status} />
          </div>
        </div>

        {/* Document */}
        <div
          className="relative overflow-hidden bg-white shadow-md"
          style={{ fontFamily: "Arial,Helvetica,sans-serif", fontSize: 13 }}
        >
          {/* Draft watermark */}
          {isDraft && (
            <div
              className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center select-none"
              style={{ opacity: 0.07 }}
            >
              <span
                className="font-black tracking-widest text-gray-800 uppercase"
                style={{ fontSize: 180, transform: "rotate(-30deg)" }}
              >
                DRAFT
              </span>
            </div>
          )}

          <div className="relative z-10 p-5">
          {/* Header */}
          <div className="mb-3 flex items-start gap-4">
            <img src={data.companylogo ?? "/images/logo.png"} alt="Company Logo" style={{ height: 60, width: "auto" }} />
            <div className="flex-1 text-right">
              <p className="font-mono text-xs text-gray-500 italic">
                NABL Accredited as per IS/ISO/IEC 17025, BIS Recognized & ISO 9001 Certified Test & Calibration Laboratory
              </p>
              <h2 className="mt-1 text-lg font-bold" style={{ color: "navy" }}>
                {data.companyname ?? "KAILTECH TEST AND RESEARCH CENTRE PVT LTD."}
              </h2>
            </div>
          </div>

          <div className="mb-2 text-center">
            <div className="text-base font-bold uppercase">TAX INVOICE</div>
            <div className="text-sm">For {data.typeofinvoice ?? "Testing"} Charges</div>
            <div className="text-xs font-semibold text-gray-600 uppercase">
              ORIGINAL FOR RECIPIENT
            </div>
          </div>

          {/* Customer & Invoice details */}
          <table className="mb-2 w-full border-collapse border border-gray-400 text-sm">
            <tbody>
              <tr>
                {/* Customer info */}
                <td
                  className="border border-gray-400 p-2 align-top"
                  style={{ width: "50%" }}
                  colSpan={2}
                >
                  <strong>Customer:</strong>
                  <br />
                  <strong>M / s . :</strong> <strong>{data.customername}</strong>
                  <br />
                  {data.addressStr}
                  <div className="mt-1 flex flex-wrap gap-x-6">
                    <span>
                      <strong>State name : </strong>
                      {data.statename ?? (data.statecode === "23" ? "Madhya Pradesh" : data.statecode)}
                    </span>
                    <span>
                      <strong>State code : </strong>
                      {data.statecode ?? "NA"}
                    </span>
                    <span>
                      <strong>GSTIN/UIN : </strong>
                      {data.gstno ?? "—"}
                    </span>
                    <span>
                      <strong>PAN: </strong>
                      {data.pan ?? "—"}
                    </span>
                  </div>
                  {data.concernpersonname && (
                    <div className="mt-1 text-xs">
                      Kind Attn. {data.concernpersonname}
                    </div>
                  )}
                </td>

                {/* Invoice details + QR */}
                <td
                  className="border border-gray-400 p-2 align-top"
                  style={{
                    width: "30%",
                    borderRight: isEinvoice && data.signed_qr_code ? undefined : "none",
                  }}
                  colSpan={isEinvoice && data.signed_qr_code ? 2 : 3}
                >
                  <div>
                    <strong>Invoice No. : </strong>
                    {data.invoiceno}
                  </div>
                  <div>
                    <strong>Date : </strong>
                    {fmtDate(data.approved_on ?? data.invoicedate)}
                  </div>
                  <div>
                    <strong>P.O. No./ Date : </strong>
                    {data.ponumber ?? data.pono ?? "—"}
                  </div>
                </td>

                {/* QR code (e-invoice) */}
                {isEinvoice && data.signed_qr_code && (
                  <td
                    className="border border-gray-400 p-1 align-top"
                    style={{ borderLeft: "none", width: 90 }}
                  >
                    <div style={{ border: "2px solid #000", overflow: "hidden" }}>
                      <img
                        src={data.qr_code_url ?? `data:image/png;base64,${data.signed_qr_code}`}
                        alt="QR Code"
                        style={{ width: "100%" }}
                        crossOrigin="anonymous"
                      />
                    </div>
                  </td>
                )}
              </tr>
            </tbody>
          </table>

          {/* Items table */}
          <table className="mb-2 w-full border-collapse border border-gray-400 text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th
                  className="border border-gray-400 px-2 py-1 text-center"
                  style={{ width: "8%" }}
                >
                  S. No.
                </th>
                <th
                  className="border border-gray-400 px-2 py-1 text-center"
                  style={{ width: "52%" }}
                >
                  Description
                </th>
                <th className="border border-gray-400 px-2 py-1 text-center">
                  {data.meter_option == 1 ? "Meter's" : "No's"}
                </th>
                {isNormal && !isFOC && (
                  <>
                    <th className="border border-gray-400 px-2 py-1 text-center">Rate</th>
                    <th className="border border-gray-400 px-2 py-1 text-center">Amount</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {Array.isArray(data.items) &&
                data.items.map((item, i) => (
                  <tr
                    key={i}
                    className={i % 2 === 1 ? "bg-gray-50" : "bg-white"}
                  >
                    <td className="border border-gray-400 px-2 py-1 text-center">{i + 1}</td>
                    <td className="border border-gray-400 px-2 py-1">
                      {item.description}
                    </td>
                    <td className="border border-gray-400 px-2 py-1 text-center">
                      {item.meter_option == 1 ? item.meter : item.qty}
                    </td>
                    {isNormal && !isFOC && (
                      <>
                        <td className="border border-gray-400 px-2 py-1 text-center">
                          {item.rate}
                        </td>
                        <td className="border border-gray-400 px-2 py-1 pr-2 text-right tabular-nums">
                          {fmt(item.amount)}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
            </tbody>
          </table>

          {/* Totals */}
          <table className="mb-2 w-full border-collapse border border-gray-400 text-sm">
            <tbody>
              <tr>
                <td
                  className="border border-gray-400 p-3 align-bottom"
                  style={{ width: "60%" }}
                  colSpan={3}
                  rowSpan={
                    4 +
                    (parseFloat(data.discnumber) > 0 ? 1 : 0) +
                    (parseFloat(data.witnesscharges) > 0 ? 1 : 0) +
                    (parseFloat(data.samplehandling) > 0 ? 1 : 0) +
                    (parseFloat(data.sampleprep) > 0 ? 1 : 0) +
                    (parseFloat(data.freight) > 0 ? 1 : 0) +
                    (parseFloat(data.mobilisation) > 0 ? 1 : 0) +
                    (isSGST ? 2 : 1)
                  }
                >
                  {isEinvoice && (
                    <div className="mb-2 text-xs">
                      {data.irn && (
                        <div>
                          <strong>Irn No:</strong> {data.irn}
                        </div>
                      )}
                      {data.ack_no && (
                        <div>
                          <strong>Acknowledgment No:</strong> {data.ack_no}
                        </div>
                      )}
                      {data.ack_dt && (
                        <div>
                          <strong>Acknowledgement Date:</strong> {data.ack_dt}
                        </div>
                      )}
                    </div>
                  )}
                  {data.brnnos?.trim() && (
                    <div>
                      <strong>BRN No :</strong> {data.brnnos}
                    </div>
                  )}
                  {data.remark?.trim() && (
                    <div>
                      <strong>Remark :</strong> {data.remark}
                    </div>
                  )}
                  <div>PAN : AADCK0799A</div>
                  <div>GSTIN : 23AADCK0799A1ZV</div>
                  <div>
                    SAC Code : 998394 Category : Scientific and Technical
                    Consultancy Services
                  </div>
                  <div>
                    Udhyam Registeration No. Type of MSME : 230262102537
                  </div>
                  <div>CIN NO.U73100MP2006PTC019006</div>
                </td>
                <td
                  className="border border-gray-400 px-2 py-1"
                  style={{ width: "22%" }}
                >
                  Subtotal
                </td>
                <td
                  className="border border-gray-400 px-2 py-1 text-right tabular-nums"
                  style={{ width: "18%" }}
                >
                  {fmt(data.subtotal)}
                </td>
              </tr>
              {parseFloat(data.discnumber) > 0 && (
                <tr>
                  <td className="border border-gray-400 px-2 py-1">
                    Discount ({data.discnumber}
                    {data.disctype === "%" ? "%" : ""})
                  </td>
                  <td className="border border-gray-400 px-2 py-1 text-right tabular-nums">
                    {fmt(data.discount)}
                  </td>
                </tr>
              )}
              {parseFloat(data.witnesscharges) > 0 && (
                <tr>
                  <td className="border border-gray-400 px-2 py-1">
                    Witness Charges
                  </td>
                  <td className="border border-gray-400 px-2 py-1 text-right tabular-nums">
                    {fmt(data.witnesscharges)}
                  </td>
                </tr>
              )}
              {parseFloat(data.samplehandling) > 0 && (
                <tr>
                  <td className="border border-gray-400 px-2 py-1">
                    Sample Handling
                  </td>
                  <td className="border border-gray-400 px-2 py-1 text-right tabular-nums">
                    {fmt(data.samplehandling)}
                  </td>
                </tr>
              )}
              {parseFloat(data.sampleprep) > 0 && (
                <tr>
                  <td className="border border-gray-400 px-2 py-1">
                    Sample Preparation Charges
                  </td>
                  <td className="border border-gray-400 px-2 py-1 text-right tabular-nums">
                    {fmt(data.sampleprep)}
                  </td>
                </tr>
              )}
              {parseFloat(data.freight) > 0 && (
                <tr>
                  <td className="border border-gray-400 px-2 py-1">
                    Freight Charges
                  </td>
                  <td className="border border-gray-400 px-2 py-1 text-right tabular-nums">
                    {fmt(data.freight)}
                  </td>
                </tr>
              )}
              {parseFloat(data.mobilisation) > 0 && (
                <tr>
                  <td className="border border-gray-400 px-2 py-1">
                    Mobilization and Demobilization Charges
                  </td>
                  <td className="border border-gray-400 px-2 py-1 text-right tabular-nums">
                    {fmt(data.mobilisation)}
                  </td>
                </tr>
              )}
              <tr>
                <td className="border border-gray-400 px-2 py-1">Total</td>
                <td className="border border-gray-400 px-2 py-1 text-right tabular-nums">
                  {fmt(data.subtotal2)}
                </td>
              </tr>
              {isSGST ? (
                <>
                  <tr>
                    <td className="border border-gray-400 px-2 py-1">
                      CGST {data.cgstper}%
                    </td>
                    <td className="border border-gray-400 px-2 py-1 text-right tabular-nums">
                      {fmt(data.cgstamount)}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-400 px-2 py-1">
                      SGST {data.sgstper}%
                    </td>
                    <td className="border border-gray-400 px-2 py-1 text-right tabular-nums">
                      {fmt(data.sgstamount)}
                    </td>
                  </tr>
                </>
              ) : (
                <tr>
                  <td className="border border-gray-400 px-2 py-1">
                    IGST {data.igstper}%
                  </td>
                  <td className="border border-gray-400 px-2 py-1 text-right tabular-nums">
                    {fmt(data.igstamount)}
                  </td>
                </tr>
              )}
              <tr>
                <td className="border border-gray-400 px-2 py-1">
                  Total Charges With tax
                </td>
                <td className="border border-gray-400 px-2 py-1 text-right tabular-nums">
                  {fmt(data.total)}
                </td>
              </tr>
              <tr>
                <td className="border border-gray-400 px-2 py-1">Round off</td>
                <td className="border border-gray-400 px-2 py-1 text-right tabular-nums">
                  {fmt(data.roundoff)}
                </td>
              </tr>
              <tr>
                <td
                  className="border border-gray-400 px-2 py-1"
                  colSpan={3}
                  style={{ borderRight: "none" }}
                >
                  <strong>(IN WORDS):</strong> Rs.{" "}
                  {amountInWords} Only
                </td>
                <td
                  className="border border-gray-400 px-2 py-1 text-right"
                  style={{ borderLeft: "none" }}
                >
                  <strong>Total {data.typeofinvoice ?? "Testing"} Charges</strong>
                </td>
                <td className="border border-gray-400 px-2 py-1 text-right font-bold tabular-nums">
                  {fmt(Math.round(data.finaltotal))}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Bank + Signatory + T&C */}
          <table className="mb-2 w-full border-collapse border border-gray-400 text-sm">
            <tbody>
              <tr>
                <td
                  className="border border-gray-400 p-3 align-top"
                  style={{ width: "60%", borderRight: "none" }}
                >
                  <div>For online payments — {data.bankaccountname ?? ""}</div>
                  <div>
                    Bank Name : {data.bankname ?? "Kotak Mahindra Bank"}, Branch Name :{" "}
                    {data.bankbranch ?? "Indore"}
                  </div>
                  <div>
                    Bank Account No. : {data.bankaccountno ?? "0795933000099960"}, A/c Type :{" "}
                    {data.bankactype ?? "Current"}
                  </div>
                  <div>
                    IFSC CODE: {data.bankifsccode ?? "KKBK0000795"}, MICR CODE:{" "}
                    {data.bankmicr ?? "452485003"}
                  </div>
                  <div className="mt-2 text-xs">
                    Certified that the particulars given above are true and
                    correct. The commercial values in this document are as per
                    contract/Agreement/Purchase order terms with the customer.{" "}
                    <strong>Declaration u/s 206AB of Income Tax Act:</strong> We
                    have filed our Income Tax Return for previous two years with
                    in specified due dates.
                  </div>
                </td>
                <td
                  className="border border-gray-400 p-3 text-right align-top"
                  style={{ borderLeft: "none", borderBottom: "none" }}
                >
                  <div>For {data.companyname ?? "KAILTECH TEST AND RESEARCH CENTRE PVT LTD."}</div>
                  {(isApproved || isEinvoice) && data.approved_by_signature && (
                    <div className="mt-2 flex flex-col items-end gap-1">
                      <img
                        src={data.approved_by_signature}
                        alt="Sign"
                        crossOrigin="anonymous"
                        style={{
                          width: 100,
                          height: 40,
                          objectFit: "contain",
                        }}
                      />
                      <div className="flex items-center gap-2">
                        <img
                          src="/images/seal.png"
                          alt="Seal"
                          style={{ width: 80 }}
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                        {data.digital_signature && (
                          <img
                            src={data.digital_signature}
                            alt="DigSign"
                            crossOrigin="anonymous"
                            style={{ maxHeight: 50, objectFit: "contain" }}
                          />
                        )}
                      </div>
                    </div>
                  )}
                  {(isApproved || isEinvoice) && data.approved_by_name && (
                    <div className="mt-2 text-xs">
                      Electronically signed by<br />
                      {data.approved_by_name}<br />
                      {data.approved_by_designation && `Designation: ${data.approved_by_designation}`}<br />
                      Date: {fmtDate(data.approved_on)}
                    </div>
                  )}
                  <div className="mt-2">
                    <u>Authorised Signatory</u>
                  </div>
                </td>
              </tr>
              <tr>
                <td className="border border-gray-400 p-3 text-xs" colSpan={2}>
                  <strong>
                    <u>Terms &amp; Conditions:</u>
                  </strong>
                  <ol className="mt-1 list-decimal pl-5 leading-relaxed">
                    <li>
                      Cross Cheque/DD should be drawn in favour of {data.companyname ?? "KAILTECH TEST AND RESEARCH CENTRE PVT LTD."} Payable at {data.companycity ?? "Indore"}
                    </li>
                    <li>
                      Please attached bill details indicating Invoice No.
                      Quotation no &amp; TDS deductions if any along with your
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
                      <strong>0795933A0099960.bqr@kotak</strong> only and take
                      official receipt. Else claim of payment, shall not be
                      accepted
                    </li>
                    <li>
                      Subject to exclusive jurisdiction of courts at {data.companycity ?? "Indore"} only.
                    </li>
                    <li>Errors &amp; omissions accepted.</li>
                  </ol>
                </td>
              </tr>
            </tbody>
          </table>

          <div className="text-center text-xs text-gray-500">
            This is a system generated invoice
          </div>
        </div>

        {/* E-Invoice Modal */}
        {einvModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="dark:bg-dark-800 w-96 rounded-xl bg-white p-6 shadow-2xl">
              <h3 className="mb-1 text-base font-semibold text-gray-900 dark:text-white">
                Generate E-Invoice
              </h3>
              <p className="dark:text-dark-300 mb-5 text-sm text-gray-500">
                Are you sure you want to generate E-Invoice for invoice {data.invoiceno}? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setEinvModal(false)}
                  className="dark:border-dark-500 dark:text-dark-200 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmGenerateEinvoice}
                  disabled={busy}
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {busy ? "Please wait…" : "Confirm"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      </div>
    </Page>
  );
}
