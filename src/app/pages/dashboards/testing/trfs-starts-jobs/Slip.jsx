import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "utils/axios";
import { toast } from "sonner";

export default function Slip() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [printableData, setPrintableData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`testing/get-slip/${id}`);
      if (response.data && response.data.customer_name) {
        setPrintableData(response.data);
      } else {
        toast.error("Failed to retrieve printable slip data.");
      }
    } catch (err) {
      console.error("Slip fetch error:", err);
      toast.error("An error occurred while loading slip details.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) fetchData();
  }, [id, fetchData]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin"></div>
          <span className="text-sm font-semibold text-gray-500 tracking-wide">Fetching Slip Data...</span>
        </div>
      </div>
    );
  }

  if (!printableData) {
    return (
      <div className="p-12 text-center">
        <h2 className="text-xl font-bold text-gray-800">No Data Available</h2>
        <p className="text-gray-500 mt-2">Could not find slip details for ID: {id}</p>
        <button onClick={fetchData} className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg shadow">Retry</button>
      </div>
    );
  }

  const {
    customer_name,
    address,
    work_order_no,
    products = []
  } = printableData;

  return (
    <div className="bg-white min-h-screen">
      <style>
        {`
          @media print {
            .no-print, .sidebar-panel, .app-header, .prime-panel, .sidebar-toggle-btn { 
              display: none !important; 
            }
            body, html { 
              margin: 0 !important; 
              padding: 0 !important; 
              background-color: white !important; 
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            main {
              margin: 0 !important;
              padding: 0 !important;
              width: 100% !important;
              display: block !important;
            }
            .content-wrapper { 
              padding: 0 !important; 
              margin: 0 !important; 
            }
            [data-layout="sideblock"] main,
            [data-layout="main-layout"] main {
              margin-left: 0 !important;
              margin-right: 0 !important;
              padding-left: 0 !important;
              padding-right: 0 !important;
            }
            .print-slip-container {
              padding: 1rem !important;
            }
          }
          .print-slip-container {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            font-size: 11px;
            color: #000;
            max-width: 1000px;
            margin: 0 auto;
            padding: 3rem;
          }
          .print-slip-container * {
            font-weight: bold !important;
            color: #000 !important;
          }
          .label { font-weight: 700; color: #000; width: 120px; display: inline-block; }
          .table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10.5px;
            margin-top: 0.6rem;
          }
          .table th {
            background-color: #f9fafb;
            border: 1px solid #000;
            padding: 12px 10px;
            text-align: left;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.025em;
          }
          .table td {
            border: 1px solid #000;
            padding: 12px 10px;
            vertical-align: top;
            line-height: 1.5;
          }
          .text-center { text-align: center; }
          .header-box {
            border-bottom: none;
            padding-bottom: 0.4rem;
            margin-bottom: 0.8rem;
          }
          .header-line {
            margin-bottom: 0.2rem;
            display: flex;
            align-items: flex-start;
          }
        `}
      </style>

      {/* ── Action Preview Bar (no-print) ── */}
      <div className="no-print bg-slate-50 border-b border-slate-200 text-slate-800 px-6 py-4 flex justify-between items-center sticky top-0 z-10 print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center shadow-md">
            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight">Print Slip</h1>
            <p className="text-[11px] text-slate-500 font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-[300px]">ID: {id} — Customer: {customer_name}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all shadow-sm"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
          <button
            onClick={handlePrint}
            className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white px-8 py-2.5 rounded-lg font-bold shadow-lg transition-all flex items-center gap-2"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            Confirm & Print Slip
          </button>
        </div>
      </div>

      <div className="print-slip-container content-wrapper">

        {/* ── Header Details ── */}
        <div className="header-box">
          <div className="header-line">
            <span className="label shrink-0">Customer Name:</span>
            <span className="font-semibold uppercase">{customer_name}</span>
          </div>
          <div className="header-line">
            <span className="label shrink-0">Address:</span>
            <span className="text-gray-700">{address}</span>
          </div>
          <div className="header-line">
            <span className="label shrink-0">Word Order / Date:</span>
            <span className="font-medium">{work_order_no}</span>
          </div>
        </div>

        {/* ── Products Table ── */}
        <table className="table">
          <thead>
            <tr>
              <th className="text-center" style={{ width: '50px' }}>S.No</th>
              <th>Product Details</th>
              <th>Brand / QR / Request</th>
              <th>Quantity</th>
              <th>Reference Nos.</th>
              <th>Department / Lab</th>
            </tr>
          </thead>
          <tbody>
            {products.length > 0 ? products.map((item, index) => (
              <tr key={index}>
                <td className="text-center font-bold px-2">{item.s_no || index + 1}</td>
                <td>
                  <div className="font-bold text-[12px]">{item.product_name}</div>

                </td>
                <td>
                  {item.brand && <div className="font-medium">{item.brand}</div>}
                  <div className="text-[9px] text-gray-500 mt-1">
                    <span className="font-bold text-gray-700">QR:</span> {item.qrcode}
                  </div>
                  <div className="text-[9px] text-gray-500">
                    <span className="font-bold text-gray-700">Req:</span> {item.test_request}
                  </div>
                </td>
                <td>
                  <div className="font-medium">
                    {Array.isArray(item.quantity) ? item.quantity.join(", ") : item.quantity}
                  </div>
                </td>
                <td className="whitespace-nowrap">
                  <div><span className="font-bold">BRN:</span> {item.brn_no}</div>
                  <div className="mt-1"><span className="font-bold">LRN:</span> {item.lrn_no}</div>
                </td>
                <td>
                  <div className="flex flex-wrap gap-1">
                    {Array.isArray(item.departments)
                      ? item.departments.map((dept, i) => (
                        <span key={i} className="bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200 print:border-none print:px-0">
                          {dept}
                          {item.bis_codes && item.bis_codes.length > 0 && item.bis_codes[0] !== "-" && (
                            <div className="text-[9px] mt-1 text-gray-500 font-medium">BIS: {item.bis_codes.join(", ")}</div>
                          )}
                        </span>
                      ))
                      : item.departments
                    }
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="6" className="py-20 text-center text-gray-400 italic">No products found.</td>
              </tr>
            )}
          </tbody>
        </table>

      </div>
    </div>
  );
}