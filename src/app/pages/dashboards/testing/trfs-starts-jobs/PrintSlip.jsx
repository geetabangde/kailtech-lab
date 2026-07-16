import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "utils/axios";
import { toast } from "sonner";

/**
 * PrintSlip Component (Sample Review and Entry Format)
 * Implements logic from: Sample Review And Entry Format PHP
 * API Endpoint: testing/print-review-slip/:id
 */
export default function PrintSlip() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [companyInfo, setCompanyInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [reviewRes, companyRes] = await Promise.all([
        axios.get(`testing/print-review-slip/${id}`),
        axios.get("get-company-info")
      ]);

      if (reviewRes.data?.status === "true" || reviewRes.data?.status === true) {
        setData(reviewRes.data.data);
      } else {
        toast.error("Failed to fetch Sample Review data.");
      }

      if (companyRes.data?.status === "true" || companyRes.data?.status === true) {
        setCompanyInfo(companyRes.data.data);
      }
    } catch (err) {
      console.error("PrintSlip error:", err);
      toast.error("Error loading sample review details.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) fetchData();
  }, [id, fetchData]);

  const handlePrint = () => window.print();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!data) return <div className="p-8 text-center text-red-500 font-bold">Data not found!</div>;

  const trfData = data.trfData || {};
  const sampleReview = data.sampleReview || {};
  const technical = data.technical || {};
  const { report_name, billing_name, address, mode_of_receipt, witness, sample_condition } = data;

  const okLabel = (val) => (val == 0 ? "Not Ok" : "Ok");
  const yesNoLabel = (val) => (val == 0 ? "No" : "Yes");
  const sufficientLabel = (val) => (val == 0 ? "Not Sufficient" : "Sufficient");
  const clearLabel = (val) => (val == 0 ? "Not Clear" : "Clear");

  const sealedArray = ["Unsealed", "Sealed", "Packed"];

  // Mapping from USER provided company info structure
  const coName = companyInfo?.company?.name || "Kailtech Test And Research Centre Pvt. Ltd.";
  const coLogo = companyInfo?.branding?.logo || "/assets/images/logo.png";

  return (
    <div className="bg-white min-h-screen">
      <style>
        {`
          @media print {
            .no-print, .sidebar-panel, .app-header, .prime-panel, .sidebar-toggle-btn { display: none !important; }
            body { margin: 0; padding: 0; background-color: white !important; }
            main { margin: 0 !important; padding: 0 !important; width: 100% !important; display: block !important; }
            [data-layout="sideblock"] main, [data-layout="main-layout"] main { margin: 0 !important; padding: 0 !important; }
            .review-container { padding: 1rem !important; }
          }
          .review-container {
            font-family: 'Inter', 'Source Sans Pro', sans-serif;
            font-size: 10px;
            color: #111;
            padding: 2.5rem;
            max-width: 1000px;
            margin: 0 auto;
          }
          .header-table {
            width: 100%;
            border-collapse: collapse;
            border: 1px solid #000;
            margin-bottom: 2rem;
          }
          .header-table td {
            border: 1px solid #000;
            padding: 8px;
            vertical-align: middle;
          }
          .header-table .col-logo { width: 220px; text-align: center; }
          .header-table .col-title { text-align: center; font-size: 14px; font-weight: bold; }
          .header-table .col-info { width: 250px; padding: 0; }
          .info-sub-table { width: 100%; border-collapse: collapse; height: 100%; }
          .info-sub-table td { border: none !important; border-bottom: 1px solid #000 !important; padding: 4px 8px !important; font-size: 9px; }
          .info-sub-table tr:last-child td { border-bottom: none !important; }
          .label-info { font-weight: bold; width: 100px; display: inline-block; }

          .row-item { display: flex; border: 1px solid #000; margin-top: -1px; }
          .col-label { flex: 4; padding: 6px 12px; border-right: 1px solid #000; font-weight: 500; font-size: 10.5px; }
          .col-value { flex: 6; padding: 6px 12px; border-right: 1px solid #000; overflow-wrap: anywhere; font-size: 10.5px; }
          .col-status { flex: 2; padding: 6px 12px; text-align: center; font-weight: bold; font-size: 10.5px; }
          .section-header {
            background-color: #f3f4f6;
            border: 1px solid #000;
            padding: 10px 12px;
            font-size: 12px;
            font-weight: bold;
            margin-top: 1.5rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          .footer-sign-box {
            margin-top: 2.5rem;
            display: grid;
            grid-template-cols: 1fr 1fr;
            gap: 2rem;
          }
          .footer-sign {
            border: 1px solid #000;
            padding: 1rem;
            height: 110px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
          .co-logo-img { max-height: 50px; width: auto; margin: 0 auto; display: block; }
          .co-name-text { font-size: 8.5px; font-weight: bold; margin-top: 4px; color: #1e3a8a; line-height: 1.2; text-align: center; }
        `}
      </style>

      {/* ── Action Preview Bar (no-print) ── */}
      <div className="no-print bg-slate-50 border-b border-slate-200 p-4 sticky top-0 flex justify-between items-center z-10 print:hidden shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-blue-600 flex items-center justify-center">
            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-bold">Print Slip</h1>
            <p className="text-xs text-gray-500">ID: {id} — Customer: {data?.report_name || "—"}</p>
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
          <button onClick={handlePrint} className="bg-blue-600 text-white px-8 py-2.5 rounded-lg font-bold shadow-md hover:bg-blue-700 transition-all flex items-center gap-2">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Confirm & Print Slip
          </button>
        </div>
      </div>

      <div className="review-container content-wrapper">

        {/* ── Official Format Header ── */}
        <table className="header-table">
          <tbody>
            <tr>
              <td className="col-logo">
                <img src={coLogo} alt="Logo" className="co-logo-img" />
                <div className="co-name-text">{coName}</div>
              </td>
              <td className="col-title uppercase tracking-wider">
                Sample Review And Entry Format
              </td>
              <td className="col-info">
                <table className="info-sub-table">
                  <tbody>
                    <tr><td><span className="label-info">QF. No.</span> KTRCQF/0701/04</td></tr>
                    <tr><td><span className="label-info">Issue No.</span> 01</td></tr>
                    <tr><td><span className="label-info">Issue Date</span> 01/06/2019</td></tr>
                    <tr><td><span className="label-info">Revision No.</span> 01</td></tr>
                    <tr><td><span className="label-info">Revision Date</span> 03/10/2019</td></tr>
                    <tr><td><span className="label-info">Page</span> 1 of 1</td></tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>

        {/* ── Commercial Acceptance ── */}
        <div className="section-header">Commercial Acceptance</div>

        <div className="row-item">
          <div className="col-label">Customer Name</div>
          <div className="col-value font-bold uppercase">{report_name || trfData.customername}</div>
          <div className="col-status">{okLabel(sampleReview.customername)}</div>
        </div>

        <div className="row-item">
          <div className="col-label">Address</div>
          <div className="col-value">{address}</div>
          <div className="col-status">{okLabel(sampleReview.address)}</div>
        </div>

        <div className="row-item">
          <div className="col-label">Work Order No/Date</div>
          <div className="col-value font-medium">{trfData.ponumber}</div>
          <div className="col-status">{okLabel(sampleReview.workorder)}</div>
        </div>

        <div className="row-item">
          <div className="col-label">Mode Of Receipt</div>
          <div className="col-value">{mode_of_receipt}</div>
          <div className="col-status">{okLabel(sampleReview.modeofreceipt)}</div>
        </div>

        <div className="row-item">
          <div className="col-label">Report in Whose Name</div>
          <div className="col-value font-semibold">{report_name}</div>
          <div className="col-status">{okLabel(sampleReview.reportname)}</div>
        </div>

        <div className="row-item">
          <div className="col-label">Billing in Whose Name</div>
          <div className="col-value">{billing_name}</div>
          <div className="col-status">{okLabel(sampleReview.billingname)}</div>
        </div>

        <div className="row-item">
          <div className="col-label">Witness (Required or not)</div>
          <div className="col-value">{witness}</div>
          <div className="col-status">{okLabel(sampleReview.witness)}</div>
        </div>

        <div className="row-item">
          <div className="col-label">Packing of Sample</div>
          <div className="col-value">{sealedArray[trfData.sealed] || "—"}</div>
          <div className="col-status">{okLabel(sampleReview.packing)}</div>
        </div>

        <div className="row-item">
          <div className="col-label">Sample Condition</div>
          <div className="col-value">{sample_condition}</div>
          <div className="col-status">{okLabel(sampleReview.samplecondition)}</div>
        </div>

        <div className="row-item">
          <div className="col-label">Time Schedule (Clear or not)</div>
          <div className="col-value">{trfData.deadline || "—"}</div>
          <div className="col-status">{okLabel(sampleReview.time)}</div>
        </div>

        <div className="row-item">
          <div className="col-label">Payment (Received or Not)</div>
          <div className="col-value">{trfData.paymentstatus == 1 ? "Yes" : "No"}</div>
          <div className="col-status">{okLabel(sampleReview.payment)}</div>
        </div>

        <div className="row-item">
          <div className="col-label">GST NO.</div>
          <div className="col-value">{trfData.gstno}</div>
          <div className="col-status">{okLabel(sampleReview.gst)}</div>
        </div>

        <div className="row-item">
          <div className="col-label">Subcontracting</div>
          <div className="col-value">{yesNoLabel(sampleReview.subcontracting)}</div>
          <div className="col-status">N/A</div>
        </div>

        {/* ── Technical Acceptance ── */}
        <div className="section-header">Technical Acceptance</div>

        <div className="row-item">
          <div className="col-label">Quantity of Sample Received</div>
          <div className="col-value">{sufficientLabel(technical.quantity)}</div>
          <div className="col-status font-normal italic">{technical.quantityremark}</div>
        </div>

        <div className="row-item">
          <div className="col-label">Specifications</div>
          <div className="col-value">{clearLabel(technical.specification)}</div>
          <div className="col-status font-normal italic">{technical.specificationremark}</div>
        </div>

        <div className="row-item">
          <div className="col-label">Methods of Testing</div>
          <div className="col-value">{clearLabel(technical.method)}</div>
          <div className="col-status font-normal italic">{technical.methodremark}</div>
        </div>

        <div className="row-item">
          <div className="col-label">Declaration if required</div>
          <div className="col-value">{clearLabel(technical.declaration)}</div>
          <div className="col-status font-normal italic">{technical.declarationremark}</div>
        </div>

        <div className="row-item">
          <div className="col-label">Statement of Conformity</div>
          <div className="col-value">{yesNoLabel(technical.conformity)}</div>
          <div className="col-status font-normal italic">{technical.conformityremark}</div>
        </div>

        <div className="row-item">
          <div className="col-label">Brand Name/Source</div>
          <div className="col-value break-all font-medium">
            {technical.brand && <div>{technical.brand}</div>}
            {trfData.brand && <div className="text-gray-500 italic mt-0.5">{trfData.brand}</div>}
          </div>
          <div className="col-status">N/A</div>
        </div>

        <div className="row-item" style={{ borderBottomWidth: '2px' }}>
          <div className="col-label font-bold text-gray-900">Sample Accepted</div>
          <div className="col-value font-bold text-gray-900">{yesNoLabel(technical.accepted)}</div>
          <div className="col-status italic font-normal">{technical.acceptedremark}</div>
        </div>

        {/* ── Signs ── */}
        <div className="footer-sign-box">
          <div className="footer-sign">
            <div className="font-bold border-b border-gray-400 pb-1 mb-2 uppercase tracking-wide text-[9px]">Commercial Review By</div>
            <div className="flex-1"></div>
            <div className="text-center">
              <div className="font-bold text-gray-800 uppercase text-[9.5px]">{sampleReview.added_by_name || "Commercial Officer"}</div>
            </div>
          </div>
          <div className="footer-sign">
            <div className="font-bold border-b border-gray-400 pb-1 mb-2 uppercase tracking-wide text-[9px]">Technical Review By</div>
            <div className="flex-1"></div>
            <div className="text-center">
              <div className="font-bold text-gray-800 uppercase text-[9.5px]">{technical.added_by_name || "Lab In-Charge"}</div>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-4 flex justify-between items-center text-[8px] text-gray-400 font-bold uppercase tracking-[0.2em] border-t border-gray-100">
          <span>** Electronic Record / Proprietary Information **</span>
          <span>Ref: {trfData.id}-{technical.trfitem}</span>
          <span>Printed: {new Date().toLocaleString()}</span>
        </div>

      </div>
    </div>
  );
}
