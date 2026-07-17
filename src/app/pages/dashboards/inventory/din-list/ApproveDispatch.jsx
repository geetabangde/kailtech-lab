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
    const [cancelReason, setCancelReason] = useState("");

    const [dinDetails, setDinDetails] = useState(null);
    const [items, setItems] = useState([]);
    const [purposeId, setPurposeId] = useState(null);
    const [companyInfo, setCompanyInfo] = useState(null);

    const fetchInitialData = useCallback(async () => {
        try {
            setLoading(true);
            const [reportRes, purpRes, companyRes] = await Promise.all([
                axios.get(`inventory/get-din-report/${id}`),
                axios.get("inventory/din-purpose-data").catch(() => ({ data: { status: false, data: [] } })),
                axios.get("get-company-info").catch(() => ({ data: { status: false, data: null } }))
            ]);

            if (reportRes.data.status && reportRes.data.data) {
                const details = reportRes.data.data.dispatch_details;
                setDinDetails(details);

                if (reportRes.data.data.items) {
                    setItems(reportRes.data.data.items);
                }

                // Try to map the purpose string back to an ID for logic gates
                if (purpRes.data.status) {
                    const matchedPurpose = purpRes.data.data.find(p => p.name === details.dispatch_purpose);
                    if (matchedPurpose) {
                        setPurposeId(parseInt(matchedPurpose.id));
                    }
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
                id: Number(id),
                approvestatus: approveStatus
            };
            if (approveStatus === 2) {
                payload.cancelreason = cancelReason;
            }

            const res = await axios.post("inventory/approve-reject-din", payload);

            if (res.data.status === true || res.data.status === "true") {
                toast.success(approveStatus === 1 ? "Dispatch Approved Successfully!" : "Dispatch Cancelled Successfully!");
                navigate("/dashboards/inventory/din-list");
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
            <Page title={approveStatus === 1 ? "Approve Dispatch" : "Cancel Dispatch"}>
                <div className="flex h-64 items-center justify-center">
                    <span className="text-gray-500">Loading Challan...</span>
                </div>
            </Page>
        );
    }

    if (!dinDetails) {
        return (
            <Page title={approveStatus === 1 ? "Approve Dispatch" : "Cancel Dispatch"}>
                <div className="p-5 text-center text-red-500">DIN Not Found</div>
            </Page>
        );
    }

    const statusInt = parseInt(dinDetails.status);

    // Logic gates matching PHP
    const isStandardTable = purposeId ? [1, 2, 3, 4, 5, 11].includes(purposeId) : true; // Fallback to standard if purpose not found

    let watermarkText = "";
    if (statusInt === 99) watermarkText = "REJECTED";
    else if ([-2, -1, 0].includes(statusInt)) watermarkText = "DRAFT";

    // Helpers to parse date safely since new API returns DD/MM/YYYY string already
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
                                <p className="text-xs text-gray-800 mb-0.5">
                                    {companyInfo?.address?.full_address}
                                </p>
                                <p className="text-xs text-gray-800 mb-0.5">
                                    {companyInfo?.contact?.phone}
                                </p>
                                <p className="text-xs text-gray-800">
                                    Email: {companyInfo?.contact?.email} , Web: {companyInfo?.contact?.website}
                                </p>
                            </div>

                            <div className="w-48 shrink-0 text-right text-xs">
                                <div>{companyInfo?.company?.gst_no}</div>
                                <div>Challan no. {dinDetails.challan_no}</div>
                            </div>
                        </div>

                        {/* Core Dispatch Details Grid */}
                        <div className="grid grid-cols-2 gap-x-8 gap-y-4 mb-8 text-sm">
                            <div className="flex">
                                <span className="font-bold w-40 shrink-0">Customer:</span>
                                <span>{dinDetails.customer_name}</span>
                            </div>
                            <div className="flex">
                                <span className="font-bold w-40 shrink-0">Customer Address:</span>
                                <span>{dinDetails.customer_address}<br />{dinDetails.gst_no}</span>
                            </div>

                            <div className="flex">
                                <span className="font-bold w-40 shrink-0">Concern Person name:</span>
                                <span>{dinDetails.concern_person}</span>
                            </div>
                            <div className="flex">
                                <span className="font-bold w-40 shrink-0">Concern Person Designation:</span>
                                <span>{dinDetails.concern_person_designation}</span>
                            </div>

                            <div className="flex">
                                <span className="font-bold w-40 shrink-0">Concern person email:</span>
                                <span>{dinDetails.concern_person_email}</span>
                            </div>
                            <div className="flex">
                                <span className="font-bold w-40 shrink-0">Concern person mobile:</span>
                                <span>{dinDetails.concern_person_phone}</span>
                            </div>

                            <div className="flex">
                                <span className="font-bold w-40 shrink-0">Dispatch Purpose:</span>
                                <span>{dinDetails.dispatch_purpose}</span>
                            </div>
                            <div className="flex">
                                <span className="font-bold w-40 shrink-0">Responsible person:</span>
                                <span>{dinDetails.responsible_person}</span>
                            </div>

                            <div className="flex">
                                <span className="font-bold w-40 shrink-0">Dispatch Date:</span>
                                <span>{safeDate(dinDetails.dispatch_date)}</span>
                            </div>
                            <div className="flex">
                                <span className="font-bold w-40 shrink-0">Dispatch Through:</span>
                                <span>{dinDetails.dispatch_through || "N/A"}</span>
                            </div>

                            <div className="flex">
                                <span className="font-bold w-40 shrink-0">Dispatch Detail:</span>
                                <span>{dinDetails.dispatch_detail}</span>
                            </div>
                            <div className="flex">
                                <span className="font-bold w-40 shrink-0">Dispatched By:</span>
                                <span>{dinDetails.dispatched_by}</span>
                            </div>
                        </div>

                        {/* Conditional Tables based on Purpose */}
                        <div className="mb-8">
                            {isStandardTable ? (
                                <table className="w-full border-collapse border border-gray-300 text-sm text-left">
                                    <thead>
                                        <tr className="bg-gray-100">
                                            <th className="border border-gray-300 p-2">Name Of The Item And Spares</th>
                                            <th className="border border-gray-300 p-2">Description</th>
                                            <th className="border border-gray-300 p-2">Remark</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.map((item, index) => (
                                            <tr key={index}>
                                                <td className="border border-gray-300 p-2">{item.instrument_name || item.name}</td>
                                                <td className="border border-gray-300 p-2">{item.description}</td>
                                                <td className="border border-gray-300 p-2">{item.remark}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <table className="w-full border-collapse border border-gray-300 text-sm text-left">
                                    <thead>
                                        <tr className="bg-gray-100">
                                            <th className="border border-gray-300 p-2">Name of item</th>
                                            <th className="border border-gray-300 p-2">Description of item in courier</th>
                                            <th className="border border-gray-300 p-2">Items Attached</th>
                                            <th className="border border-gray-300 p-2">Remark</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.map((item, index) => (
                                            <tr key={index}>
                                                <td className="border border-gray-300 p-2">
                                                    {(item.instrument_name || item.name)} {(item.newidno || item.idno)}. <b>BRN:</b> {item.brn}
                                                </td>
                                                <td className="border border-gray-300 p-2">{item.description}</td>
                                                <td className="border border-gray-300 p-2">
                                                    {item.items_attached || [
                                                        item.instrument === "Yes" ? "Instrument" : "",
                                                        item.certificate === "Yes" ? "Certificate" : "",
                                                        item.invoice === "Yes" ? "Invoice" : ""
                                                    ].filter(Boolean).join(", ")}
                                                </td>
                                                <td className="border border-gray-300 p-2">{item.remark}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* Remarks and Signatures */}
                        <div className="text-sm">
                            {dinDetails.remark && (
                                <div className="mb-8">
                                    <span className="font-bold">Remark:</span> {dinDetails.remark}
                                </div>
                            )}

                            <div className="mt-12 text-left">
                                <p className="font-bold mb-8">Regards<br />For {companyInfo?.company?.name || "KAILTECH TEST & RESEARCH CENTRE PVT. LTD."}</p>
                                {statusInt === 1 && dinDetails.approved_by && (
                                    <div className="mb-4">
                                        {/* If approved_on is a URL, render it as an image (Digital Signature) */}
                                        {dinDetails.approved_on && dinDetails.approved_on.startsWith("http") ? (
                                            <img src={dinDetails.approved_on} alt="Digital Signature" className="h-20 object-contain" />
                                        ) : (
                                            <div className="text-xs italic text-gray-600 border border-gray-300 inline-block p-2 rounded">
                                                Electronically signed by<br />
                                                {dinDetails.approved_by}<br />
                                                Date: {safeDate(dinDetails.approved_on)}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

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
                                    onClick={() => navigate("/dashboards/inventory/din-list")}
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
