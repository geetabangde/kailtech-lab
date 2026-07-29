// Import Dependencies
import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import axios from "utils/axios";
import { toast } from "sonner";


// Local Imports
import logo from "assets/krtc.jpg";
import { Page } from "components/shared/Page";
import { ConfirmModal } from "components/shared/ConfirmModal";
import { renderToStaticMarkup } from "react-dom/server";
import ExportCreditNoteToPdf from "./ExportCreditNoteToPdf";

function printCreditNote(templateProps, withLH, logoSrc, pageTitle) {
  const bodyHtml = renderToStaticMarkup(
    <ExportCreditNoteToPdf {...templateProps} withLH={withLH} logoBase64={logoSrc} />
  );

  const safeTitle = (pageTitle || templateProps.data?.creditnoteno || "Credit_Note")
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
    body  { margin: 0; padding: 10mm; padding-bottom: 5mm; box-sizing: border-box; font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #111; background: #fff; }
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
  win.onafterprint = () => { try { win.close(); } catch (e) { void e; } };
  win.onload = () => { win.focus(); win.print(); };
  setTimeout(() => { try { win.focus(); win.print(); } catch (e) { void e; } }, 800);
}



// ─── Shared UI components ──────────────────────────────────────────────────
function PageSpinner() {
  return (
    <div className="flex h-[60vh] items-center justify-center gap-3 text-gray-500">
      <svg className="h-7 w-7 animate-spin text-blue-500" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z" />
      </svg>
      Loading...
    </div>
  );
}

// ----------------------------------------------------------------------

export default function ViewCreditNote() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [companyInfo, setCompanyInfo] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [res, companyRes] = await Promise.all([
        axios.get(`/accounts/view-credit-note/${id}`),
        axios.get(`/get-company-info`).catch(() => ({ data: null }))
      ]);

      const raw = res.data?.data;
      const compInfo = companyRes.data?.data;
      setCompanyInfo(compInfo);

      if (!raw) {
        setData(null);
        return;
      }

      // Map nested API response to flat object layout mapping existing state refs
      const flatData = {
        ...(raw.creditNote || {}),
        _address: raw.address,
        _inward: raw.inward,
        statecode: raw.statecode,
        items: raw.items || [],
        qr_code_url: raw.qr_code || null,
        digital_sign: raw.digital_sign || null,
        signature_image: raw.signature_image || null,

        // Map bank details if available
        ...(compInfo?.bank ? {
          bankaccountname: compInfo.bank.account_name,
          bankname: compInfo.bank.bank_name,
          bankbranch: compInfo.bank.branch,
          bankaccountno: compInfo.bank.account_no,
          bankactype: compInfo.bank.account_type,
          bankifsccode: compInfo.bank.ifsc,
          bankmicr: compInfo.bank.micr
        } : {})
      };

      setData(flatData);
    } catch (err) {
      console.error("Failed to load credit note:", err);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading)
    return (
      <Page title="View Credit Note">
        <PageSpinner />
      </Page>
    );
  if (!data)
    return (
      <Page title="View Credit Note">
        <div className="p-6 text-sm text-red-500">Credit note not found.</div>
      </Page>
    );

  let stCode = String(data.statecode || "");
  if (data.gstno && data.gstno.length === 15 && data.gstno !== "URP") {
    const gstState = data.gstno.substring(0, 2);
    // Rough check if it's a number
    if (!isNaN(gstState)) {
      stCode = gstState;
    }
  }
  if (!isNaN(stCode) && stCode !== "") {
    stCode = stCode.padStart(2, "0");
  }

  const isSGST = stCode === "23";
  const isDraft = data.status == 0;
  const isEinvoice = data.status == 2;

  const fmt = (v) => parseFloat(v || 0).toFixed(2);

  const doEInvoice = async (apiTxpType = null) => {
    try {
      setBusy(true);

      const subtotal = parseFloat(data.subtotal) || 0;
      const discount = parseFloat(data.discount) || 0;

      const witnesscharges = parseFloat(data.witnesscharges) || 0;
      const samplehandling = parseFloat(data.samplehandling) || 0;
      const sampleprep = parseFloat(data.sampleprep) || 0;
      const freight = parseFloat(data.freight) || 0;
      const mobilisation = parseFloat(data.mobilisation) || 0;

      const otherCharges = witnesscharges + samplehandling + sampleprep + freight + mobilisation;
      const assAmt = (subtotal - discount) + otherCharges;

      let cgstVal = 0, sgstVal = 0, igstVal = 0;
      if (isSGST) {
        cgstVal = Number((assAmt * ((parseFloat(data.cgstper) || 0) / 100)).toFixed(2));
        sgstVal = Number((assAmt * ((parseFloat(data.sgstper) || 0) / 100)).toFixed(2));
      } else {
        igstVal = Number((assAmt * ((parseFloat(data.igstper) || 0) / 100)).toFixed(2));
      }

      const roundoff = Number((parseFloat(data.roundoff) || 0).toFixed(2));
      const totInvValFc = Number((assAmt + cgstVal + sgstVal + igstVal).toFixed(2));
      const totInvVal = Number((totInvValFc + roundoff).toFixed(2));

      // Country logic
      let country = String(data.country || data._address?.country || "1");
      const isOutsideIndia = country !== "1";

      let buyerGstin = data.gstno || "URP";
      let supTyp = "B2B";
      let reverseCharge = "N";

      let txpType = apiTxpType || data.txptype || data._address?.txptype || "REG";

      if (country === "1") {
        if (!data.gstno || data.gstno === "0" || data.gstno === "NA") {
          buyerGstin = "URP";
          supTyp = "B2C";
        } else if (txpType === "REG" || txpType === "TDS" || txpType === "COM") {
          supTyp = "B2B";
        } else if (txpType === "SEZ") {
          supTyp = "SEZWOP";
        } else {
          supTyp = "B2B";
        }
      } else {
        supTyp = "EXPWOP";
        buyerGstin = "URP";
      }

      // Format Date
      let formattedDate = "";
      const rawDate = data.creditnotedate || data.cndate || data.created_at || "";
      const dateParts = rawDate.split(' ')[0].split('-');
      if (dateParts.length === 3) {
        formattedDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
      }



      const totalQuantity = (data.items || []).reduce((s, it) => s + (parseFloat(it.qty) || parseFloat(it.quantity) || 0), 0);
      const amountNew = subtotal + otherCharges;

      const itemList = (data.items || []).map((item, index) => {
        const itemAmountOld = parseFloat(item.base_amount ?? item.amount) || 0;
        const qty = parseFloat(item.qty || item.quantity || 0);

        const itemOtherCharge = otherCharges > 0 && totalQuantity > 0
          ? parseFloat(((otherCharges / totalQuantity) * qty).toFixed(2))
          : 0;

        const itemAmount = itemAmountOld + itemOtherCharge;

        let itemDiscount = 0;
        if (amountNew > 0) {
          if (data.disctype === "amount") {
            itemDiscount = parseFloat(((itemAmount / amountNew) * (parseFloat(data.discnumber) || 0)).toFixed(2));
          } else {
            itemDiscount = parseFloat(((itemAmount / amountNew) * (parseFloat(data.discount) || 0)).toFixed(2));
          }
        }

        const itemAssAmt = itemAmount - itemDiscount;

        let itemCgst = 0, itemSgst = 0, itemIgst = 0;
        if (isSGST) {
          itemCgst = parseFloat((itemAssAmt * ((parseFloat(data.cgstper) || 0) / 100)).toFixed(2));
          itemSgst = parseFloat((itemAssAmt * ((parseFloat(data.sgstper) || 0) / 100)).toFixed(2));
        } else {
          itemIgst = parseFloat((itemAssAmt * ((parseFloat(data.igstper) || 0) / 100)).toFixed(2));
        }

        const gstRate = (parseFloat(data.cgstper) || 0) + (parseFloat(data.sgstper) || 0) + (parseFloat(data.igstper) || 0);
        const itemTotVal = itemAssAmt + itemCgst + itemSgst + itemIgst;

        return {
          SlNo: String(index + 1),
          PrdDesc: (item.description || "").replace(/<[^>]*>?/gm, ' ').substring(0, 300).trim(),
          IsServc: "Y",
          HsnCd: "998393",
          Qty: qty || 1,
          UnitPrice: Number(item.rate || 0),
          TotAmt: Number(itemAmount.toFixed(2)),
          Discount: Number(itemDiscount.toFixed(2)),
          AssAmt: Number(itemAssAmt.toFixed(2)),
          GstRt: Number(gstRate.toFixed(2)),
          IgstAmt: Number(itemIgst.toFixed(2)),
          CgstAmt: Number(itemCgst.toFixed(2)),
          SgstAmt: Number(itemSgst.toFixed(2)),
          OthChrg: 0,
          TotItemVal: Number(itemTotVal.toFixed(2))
        };
      });

      // Use stCode (which is properly extracted from GSTIN above) for the API payload
      let posCode = stCode;

      const payload = {
        Version: "1.1",
        TranDtls: { TaxSch: "GST", SupTyp: supTyp, RegRev: reverseCharge, EcmGstin: null, IgstOnIntra: "N" },
        DocDtls: { Typ: "CRN", No: data.creditnoteno, Dt: formattedDate },
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
          LglNm: data.customername ? data.customername.substring(0, 99) : "",
          Pos: isOutsideIndia ? "96" : posCode,
          Addr1: ((data._address && data._address.address ? data._address.address : data.address) || "").replace(/[\r\n]+/g, ' ').substring(0, 99),
          Loc: (data._address && data._address.city ? data._address.city : data.city) || "",
          Pin: isOutsideIndia ? 999999 : (() => {
            const pinToMatch = data._address && data._address.pincode ? data._address.pincode : (data.pincode || data.address || "");
            const match = String(pinToMatch).match(/\b\d{6}\b/);
            return match ? Number(match[0]) : 999999;
          })(),
          Stcd: isOutsideIndia ? "96" : posCode
        },
        ItemList: itemList,
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
        ExpDtls: { CntCode: isOutsideIndia ? (data.countryIso || "96") : "IN" }
      };

      await axios.post(`/einvoice/generate?invoiceid=${id}`, payload);
      toast.success("E-Invoice Generated Successfully!!");
      load();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || err.message || "Failed to generate E-Invoice.");
    } finally {
      setBusy(false);
    }
  };

  const validateGSTINPincode = async () => {
    setShowConfirmModal(false);
    setBusy(true);
    var gstin = data.gstno;

    // Extract 6 digit pincode safely
    const rawPin = String(data.pincode || data._address?.pincode || data.address || "");
    const pinMatch = rawPin.match(/\b\d{6}\b/);
    var pincode = pinMatch ? parseInt(pinMatch[0], 10) : 0;

    var country = String(data.country || data._address?.country || "1");

    if (country === "1") {
      if (!gstin || gstin === "0" || gstin === "NA" || !pincode || pincode === 0 || pincode === "NA") {
        toast.error(`VALIDATION FAILED! GSTIN is: "${gstin}", Pincode is: "${pincode}". Unable to generate E-Invoice.`);
        setBusy(false);
        return;
      }

      try {
        const response = await axios.post("/einvoice/validate-gst", { gstin: gstin });
        const parsedData = response.data?.data;

        if (parsedData && Number(parsedData.AddrPncd) === pincode) {
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

  const storedPerms = localStorage.getItem("userPermissions");
  const permissions = storedPerms ? JSON.parse(storedPerms) : [];
  const oldDate = new Date("2023-08-01").getTime();
  const invoiceDate = new Date(data.approved_on || data.created_at || data.cndate).getTime();
  const showEInvoiceButton = data.status == 1 && invoiceDate >= oldDate && permissions.includes(466);

  const gstStateMap = {
    "01": "JAMMU AND KASHMIR", "02": "HIMACHAL PRADESH", "03": "PUNJAB", "04": "CHANDIGARH", "05": "UTTARAKHAND",
    "06": "HARYANA", "07": "DELHI", "08": "RAJASTHAN", "09": "UTTAR PRADESH", 10: "BIHAR", 11: "SIKKIM",
    12: "ARUNACHAL PRADESH", 13: "NAGALAND", 14: "MANIPUR", 15: "MIZORAM", 16: "TRIPURA", 17: "MEGHALAYA",
    18: "ASSAM", 19: "WEST BENGAL", 20: "JHARKHAND", 21: "ODISHA", 22: "CHHATTISGARH", 23: "MADHYA PRADESH",
    24: "GUJARAT", 27: "MAHARASHTRA", 29: "KARNATAKA", 32: "KERALA", 33: "TAMIL NADU", 36: "TELANGANA",
    37: "ANDHRA PRADESH",
  };

  const stateName = gstStateMap[stCode] || gstStateMap[Number(stCode)] || data.statename || stCode || "NA";

  return (
    <Page title="View Credit Note">

      <div className="p-4 sm:p-6">
        <style>{`
          @media print {
            @page {
              margin: 0;
            }
            body {
              padding: 10mm;
            }
            body * {
              visibility: hidden;
            }
            #printable-area, #printable-area * {
              visibility: visible;
            }
            #printable-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
          }
        `}</style>

        {/* Action buttons */}
        <div className="mb-4 flex flex-wrap gap-2 print:hidden">
          <button
            onClick={() => {
              const safeTitle = data?.creditnoteno ? `CreditNote_${data.creditnoteno}` : `CreditNote_${id}`;
              printCreditNote({ data, companyInfo }, true, logo, safeTitle);
            }}
            className="rounded bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            Print
          </button>
          <button
            onClick={() => navigate("/dashboards/accounts/credit-note")}
            className="rounded bg-primary-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-primary-700"
          >
            Back To Credit Note List
          </button>
          {showEInvoiceButton && (
            <button
              onClick={() => setShowConfirmModal(true)}
              disabled={busy}
              className="rounded bg-green-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-green-700 sm:ml-auto ml-2 disabled:opacity-50"
            >
              {busy ? "Generating..." : "Generate E-Invoice"}
            </button>
          )}
        </div>

        {/* Document */}
        <div id="printable-area" className="relative rounded border border-gray-300 bg-white p-6 dark:border-dark-500 dark:bg-dark-800 print:border-none print:shadow-none print:p-0">

          <table className="w-full">
            <thead>
              <tr>
                <td>
                  {/* Header */}
                  <div className="mb-4 grid grid-cols-12 gap-2">
                    <div className="col-span-3 flex items-start">
                      <img src={logo} alt="KRTC Logo" className="h-[45px] sm:h-[65px] w-auto object-contain" />
                    </div>
                    <div className="col-span-9 text-right">
                      <p className="font-mono text-[9px] sm:text-[11px] italic text-gray-500">
                        NABL Accredited as per IS/ISO/IEC 17025 (Certificate Nos. TC-7832 &amp; CC-2348),
                        <br />
                        BIS Recognized &amp; ISO 9001 Certified Test &amp; Calibration Laboratory
                      </p>
                      <h2 className="mt-1 text-sm sm:text-xl font-bold" style={{ color: "navy" }}>
                        {data.companyname ?? "KAILTECH TEST AND RESEARCH CENTRE PVT. LTD."}
                      </h2>
                    </div>
                    <div className="col-span-12 text-center text-base font-bold">
                      CREDIT NOTE
                    </div>
                  </div>
                </td>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  {/* Draft watermark */}
                  {isDraft && (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-10">
                      <span className="rotate-[-30deg] text-[8rem] font-black uppercase text-gray-500">
                        DRAFT
                      </span>
                    </div>
                  )}

                  {/* Customer + Invoice Info table */}
                  <table className="w-full border-collapse border border-gray-300 text-sm dark:border-dark-500 table-fixed mb-4">
                    <colgroup>
                      <col style={{ width: isEinvoice && (data.signed_qr_code || data.qr_code_url) ? "45%" : "60%" }} />
                      <col style={{ width: isEinvoice && (data.signed_qr_code || data.qr_code_url) ? "30%" : "40%" }} />
                      {isEinvoice && (data.signed_qr_code || data.qr_code_url) && <col style={{ width: "25%" }} />}
                    </colgroup>
                    <tbody>
                      <tr>
                        {/* Customer info */}
                        <td className="border border-gray-300 p-3 align-top dark:border-dark-500 overflow-hidden">
                          <div className="font-bold">Customer:</div>
                          <strong>M / s . {data.customername}</strong><br />
                          <div className="mt-1">
                            {data._address ? (
                              <>
                                {data._address.address}
                                {data._address.city ? `, ${data._address.city}` : ""}
                                {data._address.pincode ? `, ${data._address.pincode}` : ""}
                              </>
                            ) : (
                              <>
                                {data.address}
                                {data.city ? `, ${data.city}` : ""}
                                {data.pincode ? `, ${data.pincode}` : ""}
                              </>
                            )}
                          </div>
                          <div className="flex flex-wrap mt-1 gap-y-1" style={{ columnGap: "12px" }}>
                            <div className="min-w-[45%]"><span className="font-bold">State name : </span>{stateName}</div>
                            <div className="min-w-[40%]"><span className="font-bold">State code : </span>{stCode || "NA"}</div>
                            <div className="min-w-[45%]"><span className="font-bold">GSTIN/UIN : </span>{data.gstno}</div>
                            <div className="min-w-[40%]"><span className="font-bold">PAN : </span>{data.pan}</div>
                          </div>
                        </td>

                        {/* CN details */}
                        <td className="border border-gray-300 p-3 align-top dark:border-dark-500 overflow-hidden">
                          <div><span className="font-bold">Credit Note No. : </span>{data.creditnoteno}</div>
                          <div className="mt-1"><span className="font-bold">Date : </span>
                            {data.creditnotedate
                              ? new Date(data.creditnotedate).toLocaleDateString("en-GB")
                              : data.cndate}
                          </div>
                          <div className="mt-1"><span className="font-bold">Invoice No./Date : </span>{data.invoiceno}</div>
                        </td>

                        {/* QR code (status == 2) */}
                        {isEinvoice && (data.signed_qr_code || data.qr_code_url) && (
                          <td className="border border-gray-300 p-1 align-middle text-center dark:border-dark-500">
                            <img
                              src={data.qr_code_url ?? `data:image/png;base64,${data.signed_qr_code}`}
                              alt="E-Invoice QR Code"
                              className="w-full max-w-[180px] mx-auto"
                            />
                          </td>
                        )}
                      </tr>
                    </tbody>
                  </table>

                  {/* Items table */}
                  <div className="mb-4 overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300 text-sm dark:border-dark-500">
                      <thead className="bg-gray-100 dark:bg-dark-700">
                        <tr>
                          <th className="border border-gray-300 p-2 text-center dark:border-dark-500">S.No.</th>
                          <th className="border border-gray-300 p-2 text-center dark:border-dark-500">Description</th>
                          <th className="border border-gray-300 p-2 text-center dark:border-dark-500">No&apos;s</th>
                          {data.potype === "Normal" && (
                            <>
                              <th className="border border-gray-300 p-2 text-center dark:border-dark-500">Rate</th>
                              <th className="border border-gray-300 p-2 text-center dark:border-dark-500">Amount</th>
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {Array.isArray(data.items) && data.items.map((item, i) => (
                          <tr key={i} className="odd:bg-white even:bg-gray-50 dark:odd:bg-dark-800 dark:even:bg-dark-700">
                            <td className="border border-gray-300 p-2 text-center dark:border-dark-500">{i + 1}</td>
                            <td className="border border-gray-300 p-2 dark:border-dark-500" dangerouslySetInnerHTML={{ __html: item.description }}></td>
                            <td className="border border-gray-300 p-2 text-center dark:border-dark-500">{item.qty || item.quantity || 1}</td>
                            {data.potype === "Normal" && (
                              <>
                                <td className="border border-gray-300 p-2 text-center dark:border-dark-500">{item.rate}</td>
                                <td className="border border-gray-300 p-2 text-right dark:border-dark-500">{fmt(item.base_amount ?? item.amount)}</td>
                              </>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Bottom section: remarks + totals + bank + terms */}
                  <table className="w-full border-collapse border border-gray-300 text-sm dark:border-dark-500 mt-2">
                    <tbody>
                      <tr>
                        {/* Left: IRN / remarks / bank */}
                        <td className="w-3/5 border border-gray-300 p-3 align-bottom dark:border-dark-500 break-words">
                          {isEinvoice && (
                            <div className="mb-2">
                              {data.irn && <p className="break-all"><span className="font-semibold">IRN No:</span> {data.irn}</p>}
                              {data.ack_no && <p><span className="font-semibold">Acknowledgment No:</span> {data.ack_no}</p>}
                              {data.ack_dt && <p><span className="font-semibold">Acknowledgement Date:</span> {data.ack_dt}</p>}
                            </div>
                          )}
                          {data.brnnos && <p className="mb-1"><span className="font-semibold">BRN No:</span> {data.brnnos.split(',').join(', ')}</p>}
                          {data.remark && <p className="mb-1"><span className="font-semibold">Remark:</span> {data.remark}</p>}
                          {(data.brnnos || data.remark) && <br />}
                          <div className="text-xs text-gray-700 dark:text-dark-300">
                            <p>PAN : {companyInfo?.company?.pan_no || data.pan || "AADCK0799A"}</p>
                            <p>GSTIN : {companyInfo?.company?.gst_no || data.gstno || "23AADCK0799A1ZV"}</p>
                            <p>SAC Code : {companyInfo?.company?.sac_code || "998393"} Category : Scientific and Technical Consultancy Services</p>
                            <p>Udhyam Registeration No. Type of MSME : {companyInfo?.company?.sme_no || "230262102537"}</p>
                            <p>CIN NO.{companyInfo?.company?.cin_no || "U73100MP2006PTC019006"}</p>
                          </div>
                        </td>

                        {/* Right: totals */}
                        <td className="border border-gray-300 p-3 align-top dark:border-dark-500">
                          <TotalRow label="Subtotal" value={fmt(data.subtotal)} />
                          {data.discnumber > 0 && (
                            <TotalRow
                              label={"Discount (" + data.discnumber + (data.disctype === "%" ? "%" : "") + ")"}
                              value={fmt(data.discount)}
                            />
                          )}
                          {data.witnesscharges > 0 && (
                            <TotalRow
                              label={"Witness Charges (" + data.witnessnumber + (data.witnesstype === "%" ? "%" : "") + ")"}
                              value={fmt(data.witnesscharges)}
                            />
                          )}
                          {data.samplehandling > 0 && (
                            <TotalRow label="Sample Handling" value={fmt(data.samplehandling)} />
                          )}
                          {data.sampleprep > 0 && (
                            <TotalRow label="Sample Preparation Charges" value={fmt(data.sampleprep)} />
                          )}
                          {data.freight > 0 && (
                            <TotalRow label="Freight Charges" value={fmt(data.freight)} />
                          )}
                          {data.mobilisation > 0 && (
                            <TotalRow label="Mobilization and Demobilization Charges" value={fmt(data.mobilisation)} />
                          )}
                          <TotalRow label="Total" value={fmt(data.subtotal2)} />
                          {isSGST ? (
                            <>
                              <TotalRow label={"CGST " + data.cgstper + "%"} value={fmt(data.cgstamount)} />
                              <TotalRow label={"SGST " + data.sgstper + "%"} value={fmt(data.sgstamount)} />
                            </>
                          ) : (
                            <TotalRow label={"IGST " + data.igstper + "%"} value={fmt(data.igstamount)} />
                          )}
                          <TotalRow label="Total Charges With Tax" value={fmt(data.total)} />
                          <TotalRow label="Round Off" value={fmt(data.roundoff)} />
                        </td>
                      </tr>

                      {/* In words */}
                      <tr>
                        <td className="border border-gray-300 p-3 dark:border-dark-500">
                          <span className="font-semibold text-sm">(IN WORDS): Rs. </span>
                          <span className="text-sm">{data.amount_in_words ?? numberToWords(Math.round(data.finaltotal || 0)) + " Only"}</span>
                        </td>
                        <td className="border border-gray-300 p-3 dark:border-dark-500">
                          <TotalRow
                            label="Total Credit Note"
                            value={parseFloat(data.finaltotal || 0).toFixed(2)}
                            bold
                          />
                        </td>
                      </tr>

                      {/* Bank + Signatory */}
                      <tr>
                        <td className="border border-gray-300 p-3 align-top text-xs dark:border-dark-500">
                          <div>For online payments - {data.bankaccountname ?? "KAILTECH TEST AND RESEARCH CENTRE PVT LTD."}</div>
                          <div>Bank Name : {data.bankname ?? "Kotak Mahindra Bank"}, Branch Name : {data.bankbranch ?? "Indore"}</div>
                          <div>Bank Account No. : {data.bankaccountno ?? "0795933000099960"}, A/c Type : {data.bankactype ?? "Current"}</div>
                          <div>IFSC CODE: {data.bankifsccode ?? "KKBK0000795"}, MICR CODE: {data.bankmicr ?? "452485003"}</div>
                          <div className="mt-2 text-gray-700 dark:text-dark-300">
                            Certified that the particulars given above are true and correct.
                          </div>
                        </td>
                        <td className="border border-gray-300 p-3 align-top text-xs dark:border-dark-500 h-1">
                          <div className="flex min-h-[120px] h-full flex-col justify-between text-right">
                            <div>For {data.companyname ?? "KAILTECH TEST AND RESEARCH CENTRE PVT. LTD."}</div>
                            {(Number(data.status) === 1 || Number(data.status) === 2) && (data.digital_sign || data.signature_image) && (
                              <div className="mt-2 flex flex-col items-end gap-1">
                                {data.signature_image && (
                                  <img
                                    src={data.signature_image}
                                    alt="Signature"
                                    style={{ maxWidth: "150px", maxHeight: "60px" }}
                                    className="inline-block object-contain"
                                  />
                                )}
                                {data.digital_sign && (
                                  <img
                                    src={data.digital_sign}
                                    alt="Digital Signature"
                                    style={{ maxWidth: "250px", maxHeight: "100px" }}
                                    className="inline-block object-contain"
                                  />
                                )}
                              </div>
                            )}
                            <div className="font-bold underline">Authorised Signatory</div>
                          </div>
                        </td>
                      </tr>

                      {/* Terms & Conditions */}
                      <tr>
                        <td colSpan={2} className="border border-gray-300 p-3 text-xs dark:border-dark-500">
                          <p className="font-semibold underline">Terms &amp; Conditions:</p>
                          <ol className="ml-4 mt-1 list-decimal space-y-1 text-gray-700 dark:text-dark-300">
                            <li>Cross Cheque/DD should be drawn in favour of {data.companyname ?? "the company"} Payable at {data.city ?? "Indore"}</li>
                            <li>Please attached bill details indicating Invoice No. Quotation no &amp; TDS deductions if any along with your payment.</li>
                            <li>As per existing GST rules. the GSTR-1 has to be filed in the immediate next month of billing. So if you have any issue in this tax invoice viz customer Name, Address, GST No., Amount etc, please inform positively in writing before 5th of next month, otherwise no such request will be entertained.</li>
                            <li>Payment not made with in 15 days from the date of issued bill will attract interest @ 24% P.A.</li>
                            <li>If the payment is to be paid in Cash pay to UPI <span className="font-bold">0795933A0099960.bqr@kotak</span> only and take official receipt. Else claim of payment, shall not be accepted</li>
                            <li>Subject to exclusive jurisdiction of courts at {data.city ?? "Indore"} only.</li>
                            <li>Errors &amp; omissions accepted.</li>
                          </ol>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal
        show={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onOk={validateGSTINPincode}
        confirmLoading={busy}
        state="pending"
        messages={{
          pending: {
            title: "Generate E-Invoice",
            description: "Are you sure you want to generate the E-Invoice? This action cannot be undone.",
            actionText: "Generate",
          }
        }}
      />
    </Page>
  );
}

// ── Helpers ──

function numberToWords(n) {
  if (n === 0) return "zero";
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const numToWords = (num) => {
    let str = "";
    if (num > 99) { str += ones[Math.floor(num / 100)] + " Hundred "; num %= 100; }
    if (num > 19) { str += tens[Math.floor(num / 10)] + " "; num %= 10; }
    if (num > 0) { str += ones[num] + " "; }
    return str.trim();
  };
  let words = "";
  if (n > 9999999) { words += numToWords(Math.floor(n / 10000000)) + " Crore "; n %= 10000000; }
  if (n > 99999) { words += numToWords(Math.floor(n / 100000)) + " Lakh "; n %= 100000; }
  if (n > 999) { words += numToWords(Math.floor(n / 1000)) + " Thousand "; n %= 1000; }
  if (n > 0) { words += numToWords(n); }
  return words.trim();
}

function TotalRow({ label, value, bold }) {
  return (
    <div className="flex justify-between py-0.5">
      <span className={bold ? "font-semibold" : "text-gray-600 dark:text-dark-300"}>
        {label}
      </span>
      <span className={bold ? "font-semibold" : ""}>{value}</span>
    </div>
  );
}
