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
import axios from "utils/axios";
import { toast } from "sonner";
import { Page } from "components/shared/Page";
import { parseUserPermissions } from "utils/permissions";
import logo from "assets/krtc.jpg";
import { printCalibrationInvoice, numberToWords } from "./ExportCalibrationInvoiceToPdf";


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
  // Fallback missing or 0 country to 1 (India)
  const getCountryCode = () => {
    let code = invoice.country;
    if (code === undefined || code === null || code === "") code = invoice._address?.country;
    if (!code || String(code) === "0") return "1";
    return String(code);
  };
  const isOutsideIndia = getCountryCode() !== "1";
  const isSgst = statecode === "23";
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

  const doEInvoice = async (apiTxpType = null) => {
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

      var country = getCountryCode();
      let buyerGstin = invoice.gstno || "URP";
      let supTyp = "B2B";
      let reverseCharge = "N";

      // Use apiTxpType from validate-gst, otherwise fallback to DB
      let txpType = apiTxpType || invoice.txptype || invoice._address?.txptype || "REG";

      if (country === "1") {
        if (!invoice.gstno || invoice.gstno === "0" || invoice.gstno === "NA") {
          buyerGstin = "URP";
          supTyp = "B2C";
          reverseCharge = "N";
        } else if (txpType === "REG" || txpType === "TDS" || txpType === "COM") {
          supTyp = "B2B";
          reverseCharge = "N";
        } else if (txpType === "SEZ") {
          supTyp = "SEZWOP";
          reverseCharge = "N";
        } else {
          // Fallback if unknown
          supTyp = "B2B";
          reverseCharge = "N";
        }
      } else {
        supTyp = "EXPWOP";
        reverseCharge = "N";
        buyerGstin = "URP";
      }

      const dateParts = invoice.approved_on ? invoice.approved_on.split(' ')[0].split('-') : [];
      const formattedDate = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : "";

      let cntCode = "IN";
      if (country !== "1") {
        try {
          const countryRes = await axios.get("/people/get-country");
          const countryList = countryRes.data?.data || countryRes.data || [];
          const countryObj = countryList.find(c => String(c.id) === String(country));
          if (countryObj && countryObj.iso) {
            cntCode = countryObj.iso;
          }
        } catch (e) {
          console.error("Failed to fetch country ISO code", e);
        }
      }

      const payload = {
        Version: "1.1",
        TranDtls: { TaxSch: "GST", SupTyp: supTyp, RegRev: reverseCharge, EcmGstin: null, IgstOnIntra: "N" },
        DocDtls: { Typ: "INV", No: invoice.invoiceno, Dt: formattedDate },
        SellerDtls: {
          Gstin: "23AADCK0799A1ZV",
          LglNm: "KAILTECH TEST AND RESEARCH CENTRE PVT LTD.",
          TrdNm: "KAILTECH TEST AND RESEARCH CENTRE PVT LTD.",
          Addr1: "Plot No. 141-C, Electronic Complex Industrial Area",
          Loc: "INDORE",
          Pin: 452010,
          Stcd: "23"
        },
        BuyerDtls: {
          Gstin: isOutsideIndia ? "URP" : buyerGstin,
          LglNm: invoice.customername ? invoice.customername.substring(0, 99) : "",
          Pos: isOutsideIndia ? "96" : (isNaN(Number(statecode)) ? "NA" : String(Number(statecode)).padStart(2, '0')),
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
          Stcd: isOutsideIndia ? "96" : (isNaN(Number(statecode)) ? "NA" : String(Number(statecode)).padStart(2, '0'))
        },
        ItemList: computedItems.map((item, index) => ({
          SlNo: String(index + 1),
          PrdDesc: (item.description || "").replace(/<[^>]*>?/gm, ' ').substring(0, 300).trim(),
          IsServc: "Y",
          HsnCd: companyInfo?.company?.sac_code || "998393",
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
        ExpDtls: { CntCode: cntCode }
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

      try {
        // Call the new Laravel API to fetch actual GST details
        const response = await axios.post("/einvoice/validate-gst", { gstin: gstin });
        const parsedData = response.data?.data;

        if (parsedData && Number(parsedData.AddrPncd) === pincode) {
          // Validation passed - Pass TxpType to doEInvoice so it matches PHP exactly
          await doEInvoice(parsedData.TxpType);
        } else {
          toast.error(`Pincode and state do not match. The provided pincode is ${pincode} but the actual pincode is ${parsedData?.AddrPncd || "Not Found"}. Unable to generate E-Invoice.`);
          setBusy(false);
        }
      } catch (err) {
        toast.error(err?.response?.data?.message || err.message || "Failed to validate GSTIN from Govt Portal.");
        setBusy(false);
      }
    } else {
      await doEInvoice();
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
    printCalibrationInvoice(templateProps, withLH, logo, pageTitle);
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
          <table className="mt-2 w-full border-collapse border border-gray-400 text-sm dark:border-dark-500 print:break-inside-avoid print:break-before-page">
            <tbody>
              <tr>
                {/* Left: IRN, BRN, Remark, company info */}
                <td className="w-3/5 border border-gray-400 p-3 align-bottom dark:border-dark-500">
                  {/* E-Invoice details (status == 2) */}
                  {isEinvoice && (
                    <div className="mb-2">
                      {invoice.irn && <div><b>Irn No:</b> {invoice.irn}</div>}
                      {invoice.ack_no && <div><b>Acknowledgment No :</b> {invoice.ack_no}</div>}
                      {invoice.ack_dt && <div><b>Acknowledgement Date sds:</b> {invoice.ack_dt}</div>}
                    </div>
                  )}
                  {invoice.brnnos?.trim() && (
                    <div className="break-all"><b>BRN No  :</b> {invoice.brnnos}</div>
                  )}
                  {invoice.remark?.trim() && (
                    <div><b>Remark :</b> {invoice.remark}</div>
                  )}
                  {(invoice.brnnos?.trim() || invoice.remark?.trim()) && <br />}
                  <div>PAN : {companyInfo?.company?.pan_no || "AADCK0799A"}</div>
                  <div>GSTIN : {companyInfo?.company?.gst_no || "23AADCK0799A1ZV"}</div>
                  <div>SAC Code : {companyInfo?.company?.sac_code || "998393"} Category : Scientific and Technical Consultancy Services</div>
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

                    <div className="flex items-end justify-between">
                      {/* Left: Signature + Digital Signature Image */}
                      <div className="flex flex-col items-start pl-2 text-left">
                        {(Number(invoice.status) === 1 || Number(invoice.status) === 2) && invoice._signature_image && (
                          <img
                            src={invoice._signature_image}
                            alt="Signature"
                            className="mb-1 h-10 w-24 object-contain"
                          />
                        )}
                        {(Number(invoice.status) === 1 || Number(invoice.status) === 2) && invoice._digital_signature && (
                          <img
                            src={invoice._digital_signature}
                            alt="Digital Signature"
                            className="h-12 w-40 object-contain"
                          />
                        )}
                      </div>

                      {/* Right: Seal + Authorised Signatory */}
                      <div className="flex flex-col items-center text-right">
                        <img src="https://kailtech.in/images/seal.png" alt="Seal" className="mb-2 h-[70px] w-[70px] object-contain" />
                        <div>
                          <u>Authorised</u><br /><u>Signatory</u>
                        </div>
                      </div>
                    </div>
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
        onOk={validateGSTINPincode}
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