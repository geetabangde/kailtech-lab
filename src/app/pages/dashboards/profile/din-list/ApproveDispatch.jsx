import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "utils/axios";
import { toast } from "react-hot-toast";
import dayjs from "dayjs";
import { Page } from "components/shared/Page";
import { Button } from "components/ui";

export default function ApproveDispatch() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get("hakuna");
  const approveStatus = parseInt(searchParams.get("matata")); // 1 for approve, 2 for cancel
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dinDetails, setDinDetails] = useState(null);
  const [items, setItems] = useState([]);
  const [companyInfo, setCompanyInfo] = useState(null);

  const [cancelReason, setCancelReason] = useState("");

  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);
      const [reportRes, companyRes] = await Promise.all([
        axios.get(`profile/din-list-challan/${id}`),
        axios.get("get-company-info").catch(() => ({ data: { status: false, data: null } }))
      ]);

      if (reportRes.data.status && reportRes.data.data) {
        const details = reportRes.data.data.din_details;
        const approval = reportRes.data.data.approval_info || {};

        details.approved_by = approval.approved_by_name;
        details.approved_on = approval.approved_on;

        setDinDetails(details);

        if (reportRes.data.data.items) {
          setItems(reportRes.data.data.items);
        }
      } else {
        toast.error("Failed to load DIN details.");
      }

      if (companyRes.data.status && companyRes.data.data) {
        setCompanyInfo(companyRes.data.data);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      toast.error("An error occurred while loading data.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) fetchInitialData();
  }, [id, fetchInitialData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (approveStatus === 2 && !cancelReason.trim()) {
      toast.error("Please provide a reason for cancellation");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        id: id,
        approvestatus: approveStatus,
        cancelreason: cancelReason
      };

      // Update this endpoint to match your actual backend route!
      const res = await axios.post("profile/approve-dispatch", payload);

      if (res.data.status === true || res.data.status === "true") {
        toast.success(approveStatus === 1 ? "Dispatch Approved Successfully!" : "Dispatch Cancelled Successfully!");
        navigate(-1);
      } else {
        toast.error(res.data.message || "Failed to process request");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while submitting.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Page title="Approve/Reject Dispatch">
        <div className="flex h-64 items-center justify-center">
          <span className="text-gray-500">Loading Challan...</span>
        </div>
      </Page>
    );
  }

  if (!dinDetails) {
    return (
      <Page title="Approve/Reject Dispatch">
        <div className="p-5 text-center text-red-500">DIN Not Found</div>
      </Page>
    );
  }

  const statusInt = parseInt(dinDetails.status);
  const isStandardTable = dinDetails.is_standard_format;

  let watermarkText = "";
  if (statusInt === 99) watermarkText = "REJECTED";
  else if ([-2, -1, 0].includes(statusInt)) watermarkText = "DRAFT";

  const safeDate = (dateStr) => {
    if (!dateStr) return "";
    if (dateStr.includes("/")) return dateStr;
    return dayjs(dateStr).format("DD/MM/YYYY");
  }

  return (
    <Page title={approveStatus === 1 ? "Approve Dispatch" : "Cancel Dispatch"}>
      <form onSubmit={handleSubmit} className="p-4 sm:p-5 flex flex-col gap-6 relative min-h-screen bg-gray-50">

        {/* Printable Area Wrapper (Read-Only context for this form) */}
        <div className="p-8 border border-gray-200 shadow-sm relative mx-auto w-full max-w-5xl bg-white text-black rounded-lg">

          {/* Watermark */}
          {watermarkText && (
            <div className="absolute inset-0 flex items-center justify-center z-[50] pointer-events-none overflow-hidden opacity-10">
              <span className="text-9xl font-black text-gray-800 -rotate-45 tracking-widest uppercase p-8">
                {watermarkText}
              </span>
            </div>
          )}

          <div className="relative z-10">
            {/* Challan Title */}
            <h2 className="text-sm font-bold uppercase mb-2 text-left tracking-wide">
              {(dinDetails.challan_title || dinDetails.basis + " CHALLAN")}
            </h2>

            {/* Header / Kailtech Info */}
            <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-6 text-sm">
              <div className="w-48 shrink-0">
                {companyInfo?.branding?.logo && (
                  <img src={companyInfo.branding.logo} alt="Company Logo" className="w-40 object-contain" />
                )}
              </div>
              <div className="flex-1 text-center px-4">
                <h1 className="text-xl font-bold mb-1">
                  {companyInfo?.company?.name || "Kailtech Test And Research Centre Pvt. Ltd."}
                </h1>
                <p className="text-xs text-gray-800 mb-0.5">{companyInfo?.address?.full_address}</p>
                <p className="text-xs text-gray-800 mb-0.5">{companyInfo?.contact?.phone}</p>
                <p className="text-xs text-gray-800">Email: {companyInfo?.contact?.email} , Web: {companyInfo?.contact?.website}</p>
              </div>
              <div className="w-48 shrink-0 text-right text-xs">
                <div>{companyInfo?.company?.gst_no}</div>
                <div>Challan no. {dinDetails.challan_no}</div>
              </div>
            </div>

            {/* Core Dispatch Details Grid */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-4 mb-8 text-sm">
              <div className="flex"><span className="font-bold w-40 shrink-0">Customer:</span><span>{dinDetails.customer_name}</span></div>
              <div className="flex"><span className="font-bold w-40 shrink-0">Customer Address:</span><span>{dinDetails.customer_address}<br />{dinDetails.gstno}</span></div>
              <div className="flex"><span className="font-bold w-40 shrink-0">Concern Person name:</span><span>{dinDetails.concern_person}</span></div>
              <div className="flex"><span className="font-bold w-40 shrink-0">Concern Person Designation:</span><span>{dinDetails.concern_designation}</span></div>
              <div className="flex"><span className="font-bold w-40 shrink-0">Concern person email:</span><span>{dinDetails.concern_email}</span></div>
              <div className="flex"><span className="font-bold w-40 shrink-0">Concern person mobile:</span><span>{dinDetails.concern_mobile}</span></div>
              <div className="flex"><span className="font-bold w-40 shrink-0">Dispatch Purpose:</span><span>{dinDetails.purpose_name}</span></div>
              <div className="flex"><span className="font-bold w-40 shrink-0">Responsible person:</span><span>{dinDetails.responsible_person}</span></div>
              <div className="flex"><span className="font-bold w-40 shrink-0">Dispatch Date:</span><span>{safeDate(dinDetails.dispatch_date)}</span></div>
              <div className="flex"><span className="font-bold w-40 shrink-0">Dispatch Through:</span><span>{dinDetails.dispatch_through} {dinDetails.dispatch_contact_details ? `(${dinDetails.dispatch_contact_details})` : ""}</span></div>
              <div className="flex"><span className="font-bold w-40 shrink-0">Dispatch Detail:</span><span>{dinDetails.dispatch_detail}</span></div>
              <div className="flex"><span className="font-bold w-40 shrink-0">Dispatched By:</span><span>{dinDetails.dispatched_by}</span></div>
            </div>

            {/* Conditional Tables */}
            <div className="mb-8">
              {isStandardTable ? (
                <table className="w-full border-collapse border border-gray-300 text-sm text-left">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 p-2">Sr No</th>
                      <th className="border border-gray-300 p-2">Serial Number</th>
                      <th className="border border-gray-300 p-2">Name Of The Item And Spares</th>
                      <th className="border border-gray-300 p-2">Description</th>
                      <th className="border border-gray-300 p-2">Remark</th>
                      <th className="border border-gray-300 p-2">Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={index}>
                        <td className="border border-gray-300 p-2">{index + 1}</td>
                        <td className="border border-gray-300 p-2">{item.serialno || "-"}</td>
                        <td className="border border-gray-300 p-2">{item.item_name}</td>
                        <td className="border border-gray-300 p-2">{item.description}</td>
                        <td className="border border-gray-300 p-2">{item.remark}</td>
                        <td className="border border-gray-300 p-2">{item.qty}</td>
                      </tr>
                    ))}
                    <tr>
                      <td colSpan={5} className="border border-gray-300 p-2 font-bold text-right">Total</td>
                      <td className="border border-gray-300 p-2 font-bold">{items.reduce((sum, item) => sum + (Number(item.qty) || 0), 0)}</td>
                    </tr>
                  </tbody>
                </table>
              ) : (
                <table className="w-full border-collapse border border-gray-300 text-sm text-left">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 p-2">S.no</th>
                      <th className="border border-gray-300 p-2">Name of item</th>
                      <th className="border border-gray-300 p-2">Description of item in courier</th>
                      <th className="border border-gray-300 p-2">Items Attached</th>
                      <th className="border border-gray-300 p-2">Remark</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={index}>
                        <td className="border border-gray-300 p-2">{index + 1}</td>
                        <td className="border border-gray-300 p-2">{item.item_name}</td>
                        <td className="border border-gray-300 p-2">{item.description}</td>
                        <td className="border border-gray-300 p-2">{item.items_attached}</td>
                        <td className="border border-gray-300 p-2">{item.remark}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {dinDetails.remark && (
              <div className="mb-8 text-sm">
                <span className="font-bold">Remark:</span> {dinDetails.remark}
              </div>
            )}

            <br />

            {/* Approval Footer (React implementation of the PHP box-footer) */}
            <div className="border-t border-gray-200 mt-8 pt-6">

              {/* Show Cancellation Reason textarea if status == 2 */}
              {approveStatus === 2 && (
                <div className="mb-6">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Reason For Cancellation <span className="text-red-500">*</span></label>
                  <textarea
                    className="w-full border border-gray-300 rounded-md p-3 text-sm focus:ring-primary-500 focus:border-primary-500"
                    rows="4"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    required
                    placeholder="Enter reason for cancellation..."
                  ></textarea>
                </div>
              )}

              <div className="flex gap-4 items-center">
                <Button
                  type="submit"
                  color={approveStatus === 1 ? "success" : "error"}
                  size="lg"
                  disabled={submitting}
                  className="font-bold shadow-sm"
                >
                  {submitting ? "Processing..." : approveStatus === 1 ? "Approve Dispatch" : "Cancel Dispatch"}
                </Button>

                <Button
                  type="button"
                  color="secondary"
                  variant="outlined"
                  size="lg"
                  onClick={() => navigate(-1)}
                  disabled={submitting}
                >
                  Go Back
                </Button>
              </div>
            </div>

          </div>
        </div>
      </form>
    </Page>
  );
}
