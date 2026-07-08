// Import Dependencies
import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

// Local Imports
import axios from "utils/axios";
import { Page } from "components/shared/Page";

// ----------------------------------------------------------------------

const formatDate = (val) => {
  if (!val || val === "0000-00-00") return "-";
  const date = new Date(val);
  if (isNaN(date)) return val;
  return date.toLocaleDateString("en-GB");
};

// ----------------------------------------------------------------------

export default function DispatchFormTesting() {
  const { id } = useParams();
  const navigate = useNavigate();
  const printRef = useRef();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchForm = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `/testing/get-testing-dispatch-form?id=${id}`,
        );
        const result = response.data;
        if (result?.status && result?.dispatch) {
          setData(result);
        } else {
          setError("Invalid response from server");
        }
      } catch (err) {
        console.error("Failed to fetch dispatch form:", err);
        setError("Failed to load dispatch form. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchForm();
  }, [id]);

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const originalBody = document.body.innerHTML;
    const originalTitle = document.title;

    document.title = `Dispatch-Challan-${id}`;
    document.body.innerHTML = `
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; font-size: 12px; color: #111; background: #fff; }
        .print-wrap { padding: 24px; }
        .header-label { font-size: 11px; font-weight: 600; letter-spacing: 0.05em; margin-bottom: 12px; }
        .header-grid { display: grid; grid-template-columns: 1fr 2fr 1fr; gap: 16px; align-items: start; border-bottom: 1px solid #ccc; padding-bottom: 12px; margin-bottom: 16px; }
        .company-center { text-align: center; }
        .company-center h2 { font-size: 14px; font-weight: 700; margin-bottom: 4px; }
        .company-center p { font-size: 10px; color: #444; line-height: 1.5; }
        .right-info { text-align: right; font-size: 11px; line-height: 1.8; }
        .field-row { display: grid; grid-template-columns: 220px 1fr; margin-bottom: 6px; font-size: 12px; }
        .field-label { font-weight: 600; }
        .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 6px; }
        .two-col .field-row { grid-template-columns: 160px 1fr; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 11px; }
        th { background: #f3f4f6; padding: 8px 10px; text-align: left; font-weight: 600; border: 1px solid #ddd; }
        td { padding: 8px 10px; border: 1px solid #ddd; vertical-align: top; }
        .sig-section { margin-top: 16px; }
        .sig-section img { height: 56px; object-fit: contain; }
        .regards { margin-top: 12px; font-weight: 600; line-height: 1.8; }
        img.logo { height: 56px; object-fit: contain; }
        .note-text { font-size: 10px; color: #888; margin-bottom: 4px; }
      </style>
      <div class="print-wrap">
        ${printContent.innerHTML}
      </div>
    `;

    window.print();

    document.body.innerHTML = originalBody;
    document.title = originalTitle;
    window.location.reload();
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Page title="View Dispatch Form">
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
          Loading Dispatch Form...
        </div>
      </Page>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (error || !data) {
    return (
      <Page title="View Dispatch Form">
        <div className="flex h-[60vh] flex-col items-center justify-center gap-4 text-red-500">
          <p>{error || "No data found"}</p>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
          >
            <ArrowLeftIcon className="size-4" /> Go Back
          </button>
        </div>
      </Page>
    );
  }

  const { dispatch, signature, items } = data;

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <Page title="View Dispatch Form">
      <div className="transition-content px-[var(--margin-x)] pb-8">
        {/* Back Button */}
        <div className="mb-4">
          <button
            onClick={() => navigate(-1)}
            className="dark:text-dark-300 dark:hover:text-dark-100 inline-flex items-center gap-2 text-sm text-gray-600 transition-colors hover:text-gray-800"
          >
            <ArrowLeftIcon className="size-4" />
            Back to Dispatch List
          </button>
        </div>

        {/* Challan Card */}
        <div className="dark:bg-dark-800 dark:border-dark-600 rounded-xl border border-gray-200 bg-white shadow-sm">
          {/* NON RETURNABLE CHALLAN heading */}
          <div className="px-8 pt-6 pb-2">
            <p className="dark:text-dark-200 text-sm font-semibold tracking-wide text-gray-700">
              NON RETURNABLE CHALLAN
            </p>
          </div>

          {/* ── Printable Area ── */}
          <div ref={printRef}>
            {/* Hidden print-only structure */}
            <div className="hidden">
              <p className="header-label">NON RETURNABLE CHALLAN</p>
            </div>

            {/* ── Header Row: Logo | Company | GST/Challan/Date ── */}
            <div className="dark:border-dark-600 grid grid-cols-3 items-start gap-4 border-b border-gray-200 px-8 py-4">
              <div className="flex items-center">
                <img
                  src="/images/logo.png"
                  alt="KTRC Logo"
                  className="logo h-16 w-auto object-contain"
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
              </div>
              <div className="company-center text-center">
                <h2 className="dark:text-dark-50 text-lg font-bold text-gray-900">
                  Kailtech Test And Research Centre Pvt. Ltd.
                </h2>
                <p className="dark:text-dark-300 mt-1 text-xs text-gray-600">
                  Plot No.141-C, Electronic Complex, Industrial Area,
                  Indore-452010 (MADHYA PRADESH) India
                </p>
                <p className="dark:text-dark-300 text-xs text-gray-600">
                  Ph: 91-731-4787555 (30 lines) Ph: 91-731-4046055, 4048055
                </p>
                <p className="dark:text-dark-300 text-xs text-gray-600">
                  Email: contact@kailtech.net , Web: http://www.kailtech.net
                </p>
              </div>
              <div className="right-info dark:text-dark-200 space-y-0.5 text-right text-xs text-gray-700">
                <p>GST No. 23AADCK0799A1ZV</p>
                <p>{dispatch.challanno}</p>
                <p>Date {formatDate(dispatch.dispatchdate)}</p>
              </div>
            </div>

            {/* ── Body ── */}
            <div className="dark:text-dark-100 space-y-3 px-8 py-6 text-sm text-gray-800">
              <div className="field-row grid grid-cols-[220px_1fr]">
                <span className="dark:text-dark-300 text-gray-600">
                  Customer
                </span>
                <span>{dispatch.customername || "-"}</span>
              </div>

              <div className="field-row grid grid-cols-[220px_1fr]">
                <span className="field-label font-semibold">
                  Customer Address
                </span>
                <span>{dispatch.customeraddress || "-"}</span>
              </div>

              <div className="field-row grid grid-cols-[220px_1fr]">
                <span className="field-label font-semibold">
                  Concern person name
                </span>
                <span>{dispatch.concernpersonname || "-"}</span>
              </div>

              <div className="field-row grid grid-cols-[220px_1fr]">
                <span className="field-label font-semibold">
                  Concern person Designation
                </span>
                <span>{dispatch.concernpersondesignation || "-"}</span>
              </div>

              <div className="field-row grid grid-cols-[220px_1fr]">
                <span className="field-label font-semibold">
                  Concern person email
                </span>
                <span>{dispatch.concernpersonemail || "-"}</span>
              </div>

              <div className="field-row grid grid-cols-[220px_1fr]">
                <span className="field-label font-semibold">
                  Concern person mobile
                </span>
                <span>{dispatch.concernpersonmobile || "-"}</span>
              </div>

              <div className="two-col grid grid-cols-2 gap-4 pt-1">
                <div className="grid grid-cols-[160px_1fr]">
                  <span className="field-label font-semibold">
                    Dispatch Date
                  </span>
                  <span>{formatDate(dispatch.dispatchdate)}</span>
                </div>
                <div className="grid grid-cols-[160px_1fr]">
                  <span className="field-label font-semibold">
                    Dispatch Through
                  </span>
                  <span>{dispatch.dispatchthrough || "-"}</span>
                </div>
              </div>

              <div className="two-col grid grid-cols-2 gap-4">
                <div className="grid grid-cols-[160px_1fr]">
                  <span className="field-label font-semibold">
                    Dispatch Detail
                  </span>
                  <span>
                    {dispatch.dispatchdetial || dispatch.dispatchdetail || "-"}
                  </span>
                </div>
                <div className="grid grid-cols-[160px_1fr]">
                  <span className="field-label font-semibold">
                    Dispatched By
                  </span>
                  <span>{dispatch.dispatched_by || "-"}</span>
                </div>
              </div>

              {/* ── Items Table ── */}
              <div className="pt-2">
                <p className="note-text dark:text-dark-400 mb-2 text-xs text-gray-500">
                  Report, invoice
                </p>
                <div className="dark:border-dark-600 overflow-x-auto rounded-lg border border-gray-200">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="dark:bg-dark-700 dark:border-dark-600 border-b border-gray-200 bg-gray-50">
                        <th className="dark:text-dark-200 w-16 px-4 py-3 text-left font-semibold text-gray-700">
                          Srno
                        </th>
                        <th className="dark:text-dark-200 px-4 py-3 text-left font-semibold text-gray-700">
                          Name of item
                        </th>
                        <th className="dark:text-dark-200 px-4 py-3 text-left font-semibold text-gray-700">
                          Description of item in courier
                        </th>
                        <th className="dark:text-dark-200 px-4 py-3 text-left font-semibold text-gray-700">
                          Items Attached
                        </th>
                        <th className="dark:text-dark-200 px-4 py-3 text-left font-semibold text-gray-700">
                          Remark
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.isArray(items) && items.length > 0 ? (
                        items.map((item, idx) => (
                          <tr
                            key={item.id ?? idx}
                            className="dark:border-dark-600 dark:hover:bg-dark-700 border-t border-gray-200 transition-colors hover:bg-gray-50"
                          >
                            <td className="px-4 py-3">{idx + 1}</td>
                            <td className="px-4 py-3">
                              <div>{item.name || "-"}</div>
                              <div className="dark:text-dark-400 mt-0.5 text-xs text-gray-500">
                                {item.lrn && (
                                  <span>
                                    <strong>LRN :</strong> {item.lrn}.{" "}
                                  </span>
                                )}
                                {item.brn && (
                                  <span>
                                    <strong>BRN:</strong> {item.brn}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              {item.description || "-"}
                            </td>
                            <td className="px-4 py-3">
                              {[
                                item.certificate ? "Certificate" : null,
                                item.invoice ? "Invoice" : null,
                              ]
                                .filter(Boolean)
                                .join(", ") || "-"}
                            </td>
                            <td className="px-4 py-3">{item.remark || "-"}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-4 py-6 text-center text-gray-400"
                          >
                            No items found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Signature */}
              {signature?.image_path && (
                <div className="sig-section pt-2">
                  <img
                    src={signature.image_path}
                    alt="Signature"
                    className="h-16 w-auto object-contain"
                  />
                </div>
              )}

              {/* Regards */}
              <div className="regards pt-2">
                <p className="font-semibold">Regards</p>
                <p className="font-semibold">
                  For Kailtech Test And Research Centre Pvt. Ltd.
                </p>
              </div>
            </div>
          </div>
          {/* ── End Printable Area ── */}

          {/* ── Footer: Print / Save as PDF Button ── */}
          <div className="flex justify-end px-8 pb-6">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 rounded-md bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-600 active:bg-emerald-700"
            >
            
              Download Dispatch Report
            </button>
          </div>
        </div>
      </div>
    </Page>
  );
}
