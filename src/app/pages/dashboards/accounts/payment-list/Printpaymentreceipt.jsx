// Import Dependencies
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import axios from "utils/axios";
import { toast } from "sonner";

// Local Imports
import { Page } from "components/shared/Page";
import logo from "assets/krtc.jpg";

// ----------------------------------------------------------------------

export default function PrintPaymentReceipt() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [companyInfo, setCompanyInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReceipt = async () => {
      try {
        setLoading(true);
        const [res, companyRes] = await Promise.all([
          axios.get(`/accounts/get-payment-receipt?id=${id}`),
          axios.get(`/get-company-info`)
        ]);

        if (res.data.status === true || res.data.status === "true") {
          setData(res.data.data);
        } else {
          toast.error("Failed to load receipt");
        }

        if (companyRes.data.status === true || companyRes.data.status === "true") {
          setCompanyInfo(companyRes.data.data);
        }
      } catch (err) {
        console.error(err);
        toast.error("Error loading receipt");
      } finally {
        setLoading(false);
      }
    };
    fetchReceipt();
  }, [id]);

  // ── Open a clean new window and print just the receipt ──────────────────
  const handlePrint = () => {
    if (!data) return;

    const amount = parseFloat(data.total_amount).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    // Get the absolute URL for the local logo asset
    const logoUrl = window.location.origin + logo;

    const headerLogo = companyInfo?.branding?.logo || logoUrl;
    const compName = companyInfo?.company?.name;
    const compAddress = companyInfo?.address?.top_address;
    const compPhone = companyInfo?.contact?.phone;
    const compEmail = companyInfo?.contact?.email;
    const compWeb = companyInfo?.contact?.website;
    const altText = companyInfo?.branding?.site_logo_alt;

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>Payment Receipt - ${data.receipt_no}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: Arial, sans-serif;
      font-size: 13px;
      color: #111;
      padding: 40px;
    }
    .header { display: flex; align-items: flex-start; gap: 16px; margin-bottom: 12px; }
    .header img { height: 56px; object-fit: contain; }
    .company-info { font-size: 11px; line-height: 1.6; }
    .company-name { font-size: 15px; font-weight: bold; text-transform: uppercase; }
    hr { border: none; border-top: 1px solid #aaa; margin: 12px 0; }
    .title { text-align: center; font-weight: bold; font-size: 14px; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 16px; }
    .receipt-row { display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 16px; }
    .body-text { margin-bottom: 40px; line-height: 1.8; }
    .footer-row { display: flex; justify-content: space-between; align-items: flex-end; }
    .amount-block .amount { font-weight: bold; font-size: 13px; }
    .amount-block .note { font-size: 10px; color: #555; margin-top: 4px; }
    .sign-block { text-align: right; }
    .sign-block .for { font-size: 11px; font-weight: bold; text-transform: uppercase; margin-bottom: 6px; }
    .sign-block img { height: 60px; object-fit: contain; display: block; margin-left: auto; margin-bottom: 4px; }
    .sign-block .authorized { font-weight: bold; font-size: 12px; }
    .footnote { font-size: 10px; color: #444; margin-top: 16px; line-height: 1.7; }
  </style>
</head>
<body>
  <div class="header">
    <img src="${headerLogo}" alt="${altText}" onerror="this.style.display='none'"/>
    <div class="company-info">
      <div class="company-name">${compName}</div>
      <div>${compAddress}</div>
      <div>${compPhone}</div>
      <div>Email: ${compEmail} &nbsp; Web: ${compWeb}</div>
    </div>
  </div>

  <hr/>

  <div class="title">Payment Receipt</div>

  <div class="receipt-row">
    <span>RECEIPT No. ${data.receipt_no}</span>
    <span>${data.payment_date}</span>
  </div>

  <div class="body-text">
    Received with thanks from M/s. <strong>${data.customer_name}</strong> a sum of Rs.
    <strong>${data.amount_words}</strong> By <strong>${data.payment_mode}</strong>${data.payment_detail ? ` of ${data.payment_detail}` : ""}
  </div>

  <div class="footer-row">
    <div class="amount-block">
      <div class="amount">Amount Rs. ${amount}</div>
      <div class="note">*Subject to realisation of Cheque</div>
    </div>
    <div class="sign-block">
      <div class="for">For ${compName}</div>
      ${data.digital_signature ? `<img src="${data.digital_signature}" alt="Signature" onerror="this.style.display='none'"/>` : ""}
      <div class="authorized">Authorized Signatory</div>
    </div>
  </div>

  <hr/>

  <div class="footnote">
    <strong>Note:</strong><br/>
    &nbsp;&nbsp;&nbsp;&nbsp;The Service Rendered shall be as per the terms &amp; condition of KTRCPL, Indore only.<br/>
    All Disputes are Subject to Indore Jurisdiction only.
  </div>

  <script>
    window.onload = function() { window.print(); }
  </script>
</body>
</html>`;

    const printWin = window.open("", "_blank", "width=800,height=600");
    printWin.document.write(html);
    printWin.document.close();
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Page title="Payment Receipt">
        <div className="flex h-[60vh] items-center justify-center text-gray-600">
          <svg
            className="mr-2 h-6 w-6 animate-spin text-blue-600"
            viewBox="0 0 24 24"
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
          Loading Receipt...
        </div>
      </Page>
    );
  }

  if (!data) return null;

  const amount = parseFloat(data.total_amount).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <Page title="Payment Receipt - Kailtech">
      {/* ── Toolbar ── */}
      <div className="mb-4 flex items-center justify-between px-6 pt-4">
        <h2 className="dark:text-dark-50 text-lg font-semibold text-gray-800">
          Print Payment Slip
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => navigate("/dashboards/accounts/payment-list")}
            className="dark:border-dark-500 dark:text-dark-300 dark:hover:bg-dark-700 rounded border border-gray-300 px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
          >
            ← Back to Payment List
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 rounded bg-green-600 px-5 py-1.5 text-sm font-medium text-white hover:bg-green-700"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
              />
            </svg>
            Download Receipt
          </button>
        </div>
      </div>

      {/* ── Preview Card ── */}
      <div className="px-6 pb-10">
        <div className="dark:border-dark-500 dark:bg-dark-800 mx-auto max-w-2xl rounded-lg border border-gray-200 bg-white p-10 shadow-sm">
          {/* Company Header */}
          <div className="mb-3 flex items-start gap-4">
            <img
              src={companyInfo?.branding?.logo || logo}
              alt={companyInfo?.branding?.site_logo_alt || "Kailtech"}
              className="h-14 w-auto object-contain"
            />
            <div className="dark:text-dark-200 text-xs leading-relaxed text-gray-700">
              <p className="dark:text-dark-50 text-sm font-bold text-gray-900 uppercase">
                {companyInfo?.company?.name || "Kailtech Research Centre Pvt. Ltd."}
              </p>
              <p>{companyInfo?.address?.top_address || "Plot No. 123, Industrial Area, Indore (M.P.)"}</p>
              <p>{companyInfo?.contact?.phone || "Phone: +91-731-XXXXXXX"}</p>
              <p>
                Email: {companyInfo?.contact?.email || "info@kailtech.in"} &nbsp; Web:{" "}
                {companyInfo?.contact?.website || "www.kailtech.in"}
              </p>
            </div>
          </div>

          <hr className="dark:border-dark-500 my-4 border-gray-300" />

          <div className="dark:text-dark-100 mb-5 text-center text-base font-bold tracking-widest text-gray-800 uppercase">
            Payment Receipt
          </div>

          <div className="dark:text-dark-100 mb-5 flex justify-between text-sm font-semibold text-gray-800">
            <span>RECEIPT No. {data.receipt_no}</span>
            <span>{data.payment_date}</span>
          </div>

          <div className="dark:text-dark-200 mb-10 text-sm leading-relaxed text-gray-700">
            Received with thanks from M/s. <strong>{data.customer_name}</strong>{" "}
            a sum of Rs. <strong>{data.amount_words}</strong> By{" "}
            <strong>{data.payment_mode}</strong>
            {data.payment_detail ? ` of ${data.payment_detail}` : ""}
          </div>

          <div className="flex items-end justify-between">
            <div>
              <p className="dark:text-dark-100 text-sm font-bold text-gray-800">
                Amount Rs. {amount}
              </p>
              <p className="dark:text-dark-400 mt-1 text-xs text-gray-500">
                *Subject to realisation of Cheque
              </p>
            </div>
            <div className="text-right">
              <p className="dark:text-dark-200 mb-2 text-xs font-semibold text-gray-700 uppercase">
                For {companyInfo?.company?.name}
              </p>
              {data.digital_signature && (
                <img
                  src={data.digital_signature}
                  alt="Signature"
                  className="mb-1 ml-auto h-16 w-auto object-contain"
                  onError={(e) => (e.target.style.display = "none")}
                />
              )}
              <p className="dark:text-dark-100 text-xs font-semibold text-gray-800">
                Authorized Signatory
              </p>
            </div>
          </div>

          <hr className="dark:border-dark-500 my-5 border-gray-300" />

          <div className="dark:text-dark-400 text-xs text-gray-600">
            <strong>Note:</strong>
            <br />
            &nbsp;&nbsp;&nbsp;&nbsp;The Service Rendered shall be as per the
            terms &amp; condition of KTRCPL, Indore only.
            <br />
            All Disputes are Subject to Indore Jurisdiction only.
          </div>
        </div>
      </div>
    </Page>
  );
}
