// Import Dependencies
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "utils/axios";
import { toast } from "sonner";

// Local Imports
import { Page } from "components/shared/Page";
import { Input, Card, Button } from "components/ui";

// ----------------------------------------------------------------------

export default function ApprovePO() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const poId = searchParams.get("hakuna");

    const [loading, setLoading] = useState(true);
    const [approving, setApproving] = useState(false);
    const [purchaseOrder, setPurchaseOrder] = useState(null);
    const [purchaseOrderItems, setPurchaseOrderItems] = useState([]);
    const [supplier, setSupplier] = useState(null);
    const [summary, setSummary] = useState(null);

    // Fetch purchase order data
    useEffect(() => {
        const fetchPurchaseOrderData = async () => {
            if (!poId) {
                toast.error("Purchase Order ID is required");
                navigate("/dashboards/inventory/purchase-order");
                return;
            }

            try {
                setLoading(true);

                const response = await axios.get(`/inventory/view-purchase-order/${poId}`);
                if (response.data.status && response.data.data) {
                    const { purchase_order, supplier_details, items, summary } = response.data.data;

                    setPurchaseOrder(purchase_order || null);
                    setSupplier(supplier_details || null);
                    setPurchaseOrderItems(items || []);
                    setSummary(summary || null);
                } else {
                    toast.error("Purchase Order not found");
                    navigate("/dashboards/inventory/purchase-order");
                }
            } catch (error) {
                console.error("Error fetching purchase order:", error);
                toast.error("Something went wrong while loading purchase order");
                navigate("/dashboards/inventory/purchase-order");
            } finally {
                setLoading(false);
            }
        };

        fetchPurchaseOrderData();
    }, [poId, navigate]);

    const formatDate = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB'); // dd/mm/yyyy format
    };

    const handleApprove = async () => {
        try {
            setApproving(true);
            // Calls the approve endpoint, mapping to insertapprovepo.php
            await axios.post("/inventory/approve-purchase-order", {
                id: poId
            });
            toast.success("Purchase Order approved successfully");
            navigate("/dashboards/inventory/purchase-order");
        } catch (error) {
            console.error("Error approving purchase order:", error);
            toast.error("Failed to approve purchase order");
        } finally {
            setApproving(false);
        }
    };

    const canEdit = purchaseOrder && purchaseOrder.status === -1;

    const handleBack = () => {
        navigate("/dashboards/inventory/purchase-order");
    };

    const handleEdit = () => {
        navigate(`/dashboards/inventory/purchase-order/edit-purchase-order?hakuna=${poId}`);
    };

    const handleExportPDF = () => {
        navigate(`/dashboards/inventory/purchase-order/export-po-to-pdf?hakuna=${poId}`);
    };

    if (loading) {
        return (
            <Page title="Approve Purchase Order">
                <div className="flex h-[60vh] items-center justify-center text-gray-600">
                    <svg className="mr-2 h-6 w-6 animate-spin text-blue-600" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z"></path>
                    </svg>
                    Loading Purchase Order...
                </div>
            </Page>
        );
    }

    if (!purchaseOrder) {
        return (
            <Page title="Approve Purchase Order">
                <div className="flex h-[60vh] items-center justify-center text-gray-600">
                    Purchase Order not found
                </div>
            </Page>
        );
    }

    return (
        <Page title="Approve Purchase Order">
            <div className="transition-content w-full px-[var(--margin-x)] pb-5 pt-4">
                <Card className="relative flex flex-col p-6">
                    <div className="flex items-center justify-between border-b border-gray-200 pb-4 dark:border-dark-500">
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-dark-50">
                            Approve Purchase Order/Work Order
                        </h2>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                onClick={handleBack}
                                className="h-9 px-4 text-sm"
                            >
                                &lt;&lt; Back
                            </Button>
                            {canEdit && (
                                <Button
                                    onClick={handleEdit}
                                    color="warning"
                                    variant="outline"
                                    className="h-9 px-4 text-sm"
                                >
                                    Edit
                                </Button>
                            )}
                            <Button
                                onClick={handleExportPDF}
                                variant="outline"
                                className="h-9 border-gray-300 px-4 text-sm"
                            >
                                Export to PDF
                            </Button>
                        </div>
                    </div>

                    <div className="mt-8 space-y-6">
                        {/* Header Info Grid */}
                        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                            {/* Left Column */}
                            <div className="space-y-4">
                                <div className="grid grid-cols-12 items-center gap-4">
                                    <label className="col-span-4 text-sm font-medium text-gray-600 dark:text-dark-200">
                                        Business Name
                                    </label>
                                    <div className="col-span-8">
                                        <Input
                                            readOnly
                                            value={supplier?.company || ""}
                                            className="bg-gray-50"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-12 items-center gap-4">
                                    <label className="col-span-4 text-sm font-medium text-gray-600 dark:text-dark-200">
                                        Phone Number
                                    </label>
                                    <div className="col-span-8">
                                        <Input
                                            readOnly
                                            value={supplier?.mobile || supplier?.contact_phone || ""}
                                            className="bg-gray-50"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-12 items-center gap-4">
                                    <label className="col-span-4 text-sm font-medium text-gray-600 dark:text-dark-200">
                                        Email Address
                                    </label>
                                    <div className="col-span-8">
                                        <Input
                                            readOnly
                                            value={supplier?.email || supplier?.contact_email || ""}
                                            className="bg-gray-50"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-12 items-center gap-4">
                                    <label className="col-span-4 text-sm font-medium text-gray-600 dark:text-dark-200">
                                        GST Number
                                    </label>
                                    <div className="col-span-8">
                                        <Input
                                            readOnly
                                            value={supplier?.gst_number || supplier?.gstno || ""}
                                            className="bg-gray-50"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-12 items-center gap-4">
                                    <label className="col-span-4 text-sm font-medium text-gray-600 dark:text-dark-200">
                                        Website
                                    </label>
                                    <div className="col-span-8">
                                        <Input
                                            readOnly
                                            value={supplier?.website || ""}
                                            className="bg-gray-50"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-12 items-center gap-4 border-t border-gray-100 pt-4 dark:border-dark-600">
                                    <label className="col-span-4 text-sm font-medium text-gray-600 dark:text-dark-200">
                                        Contact Person
                                    </label>
                                    <div className="col-span-8">
                                        <Input
                                            readOnly
                                            value={purchaseOrder.sname || supplier?.contact_person || ""}
                                            className="bg-gray-50"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-12 items-center gap-4">
                                    <label className="col-span-4 text-sm font-medium text-gray-600 dark:text-dark-200">
                                        Contact Phone
                                    </label>
                                    <div className="col-span-8">
                                        <Input
                                            readOnly
                                            value={purchaseOrder.sphone || supplier?.contact_phone || ""}
                                            className="bg-gray-50"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-12 items-center gap-4">
                                    <label className="col-span-4 text-sm font-medium text-gray-600 dark:text-dark-200">
                                        Designation
                                    </label>
                                    <div className="col-span-8">
                                        <Input
                                            readOnly
                                            value={purchaseOrder.designation || supplier?.designation || ""}
                                            className="bg-gray-50"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-12 items-center gap-4">
                                    <label className="col-span-4 text-sm font-medium text-gray-600 dark:text-dark-200">
                                        Contact Email
                                    </label>
                                    <div className="col-span-8">
                                        <Input
                                            readOnly
                                            value={purchaseOrder.semail || supplier?.contact_email || ""}
                                            className="bg-gray-50"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-12 items-start gap-4">
                                    <label className="col-span-4 text-sm font-medium text-gray-600 dark:text-dark-200">
                                        Address
                                    </label>
                                    <div className="col-span-8">
                                        <textarea
                                            readOnly
                                            value={purchaseOrder.saddress || supplier?.address || ""}
                                            className="w-full rounded-lg border border-gray-200 bg-gray-50 p-2.5 text-sm outline-none dark:border-dark-500 dark:bg-dark-800"
                                            rows={3}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Right Column */}
                            <div className="space-y-4">
                                <div className="grid grid-cols-12 items-center gap-4 text-right">
                                    <div className="col-start-1 col-span-8">
                                        <label className="text-sm font-medium text-gray-600 dark:text-dark-200">Date</label>
                                    </div>
                                    <div className="col-span-4">
                                        <Input readOnly value={formatDate(purchaseOrder.date)} className="bg-gray-50 text-right" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-12 items-center gap-4 text-right">
                                    <div className="col-start-1 col-span-8">
                                        <label className="text-sm font-medium text-gray-600 dark:text-dark-200">PO Number</label>
                                    </div>
                                    <div className="col-span-4">
                                        <Input readOnly value={purchaseOrder.po_number} className="bg-gray-50 text-right font-bold" />
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4">
                                    <div className="grid grid-cols-12 items-start gap-4">
                                        <label className="col-span-4 text-sm font-medium text-gray-600 dark:text-dark-200">
                                            Billed & Consigned To
                                        </label>
                                        <div className="col-span-8">
                                            <textarea
                                                readOnly
                                                value={purchaseOrder.bill_and_consign_to || ""}
                                                className="w-full rounded-lg border border-gray-200 bg-gray-50 p-2.5 text-sm outline-none dark:border-dark-500 dark:bg-dark-800"
                                                rows={4}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-12 items-center gap-4">
                                        <label className="col-span-4 text-sm font-medium text-gray-600 dark:text-dark-200">
                                            Delivery Terms
                                        </label>
                                        <div className="col-span-8">
                                            <Input readOnly value={purchaseOrder.delivery_terms || ""} className="bg-gray-50" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-12 items-center gap-4">
                                        <label className="col-span-4 text-sm font-medium text-gray-600 dark:text-dark-200">
                                            Payment Terms
                                        </label>
                                        <div className="col-span-8">
                                            <Input readOnly value={purchaseOrder.payment_terms || ""} className="bg-gray-50" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-12 items-center gap-4">
                                        <label className="col-span-4 text-sm font-medium text-gray-600 dark:text-dark-200">
                                            Quotation Date
                                        </label>
                                        <div className="col-span-8">
                                            <Input readOnly value={formatDate(purchaseOrder.quotation_date || purchaseOrder.quotationdate)} className="bg-gray-50" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-12 items-center gap-4">
                                        <label className="col-span-4 text-sm font-medium text-gray-600 dark:text-dark-200">
                                            Quotation Ref No
                                        </label>
                                        <div className="col-span-8">
                                            <Input readOnly value={purchaseOrder.quotation_no || purchaseOrder.quotationno || ""} className="bg-gray-50" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-12 items-center gap-4">
                                        <label className="col-span-4 text-sm font-medium text-gray-600 dark:text-dark-200">
                                            Warranty
                                        </label>
                                        <div className="col-span-8">
                                            <Input readOnly value={purchaseOrder.warranty || ""} className="bg-gray-50" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-12 items-center gap-4">
                                        <label className="col-span-4 text-sm font-medium text-gray-600 dark:text-dark-200">
                                            Jurisdiction
                                        </label>
                                        <div className="col-span-8">
                                            <Input readOnly value={purchaseOrder.jurisdiction || ""} className="bg-gray-50" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-12 items-start gap-4">
                                        <label className="col-span-4 text-sm font-medium text-gray-600 dark:text-dark-200">
                                            Other Detail
                                        </label>
                                        <div className="col-span-8">
                                            <textarea
                                                readOnly
                                                value={purchaseOrder.other_details || purchaseOrder.otherdetails || ""}
                                                className="w-full rounded-lg border border-gray-200 bg-gray-50 p-2 text-sm outline-none dark:border-dark-500 dark:bg-dark-800"
                                                rows={2}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Product Table */}
                        <div className="mt-8 overflow-hidden rounded-xl border border-gray-200 dark:border-dark-500">
                            <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 dark:border-dark-500 dark:bg-dark-800">
                                <h3 className="text-md font-semibold text-gray-800 dark:text-dark-50">Product Details</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse text-left text-sm">
                                    <thead className="bg-gray-100 text-xs font-semibold uppercase text-gray-600 dark:bg-dark-700 dark:text-dark-200">
                                        <tr className="border-b dark:border-dark-500">
                                            <th className="px-4 py-3">S.No</th>
                                            <th className="px-4 py-3">HSN/SAC</th>
                                            <th className="px-4 py-3 text-left">Material/Service Name</th>
                                            <th className="px-4 py-3 text-left">Specification</th>
                                            <th className="px-4 py-3 text-right">Price</th>
                                            <th className="px-4 py-3 text-center">Qty</th>
                                            <th className="px-4 py-3 text-right">Tax Rate</th>
                                            <th className="px-4 py-3 text-right">IGST</th>
                                            <th className="px-4 py-3 text-right">CGST</th>
                                            <th className="px-4 py-3 text-right">SGST</th>
                                            <th className="px-4 py-3 text-right">Total Tax</th>
                                            <th className="px-4 py-3 text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-dark-500">
                                        {purchaseOrderItems.map((item, index) => (
                                            <tr key={item.id || index} className="hover:bg-gray-50 dark:hover:bg-dark-800/50">
                                                <td className="px-4 py-3">{index + 1}</td>
                                                <td className="px-4 py-3">{item.hsn_code || "—"}</td>
                                                <td className="px-4 py-3 text-left font-medium">
                                                    {item.material_name || item.itemname || item.category_name || "—"}
                                                </td>
                                                <td className="whitespace-pre-line px-4 py-3 text-left text-gray-500">{item.specification || "—"}</td>
                                                <td className="px-4 py-3 text-right font-mono">{Number(item.price || 0).toFixed(2)}</td>
                                                <td className="px-4 py-3 text-center">{item.quantity}</td>
                                                <td className="px-4 py-3 text-right">
                                                    {typeof item.tax_rate === "string" ? item.tax_rate : `${item.tax_rate}%`}
                                                </td>
                                                <td className="px-4 py-3 text-right font-mono">{Number(item.igst || item.igstamount || 0).toFixed(2)}</td>
                                                <td className="px-4 py-3 text-right font-mono">{Number(item.cgst || item.cgstamount || 0).toFixed(2)}</td>
                                                <td className="px-4 py-3 text-right font-mono">{Number(item.sgst || item.sgstamount || 0).toFixed(2)}</td>
                                                <td className="px-4 py-3 text-right font-mono">{Number(item.total_tax || item.totaltaxamountitem || 0).toFixed(2)}</td>
                                                <td className="px-4 py-3 text-right font-mono font-bold">
                                                    {Number(item.final_amount || item.finalamount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Totals Summary */}
                        <div className="flex justify-end pt-6">
                            <div className="w-full max-w-md space-y-3 rounded-xl border border-gray-150 bg-gray-50 p-6 dark:border-dark-600 dark:bg-dark-800">
                                <div className="flex justify-between text-sm text-gray-600 dark:text-dark-200">
                                    <span>Total Item Amount</span>
                                    <span className="font-mono font-medium">{summary?.subtotal || purchaseOrder.subtotal || "0.00"}</span>
                                </div>

                                <div className="flex justify-between text-sm text-gray-600 dark:text-dark-200">
                                    <span>Discount</span>
                                    <span className="font-mono text-red-500">-{summary?.discount || purchaseOrder.discount || "0.00"}</span>
                                </div>

                                <div className="flex justify-between border-b pb-2 text-sm font-semibold text-gray-700 dark:text-dark-100">
                                    <span>Total After Discount Value</span>
                                    <span className="font-mono">{summary?.total_after_discount || purchaseOrder.totalafterdisc || "0.00"}</span>
                                </div>

                                <div className="flex justify-between text-sm text-gray-500 dark:text-dark-300">
                                    <span>Packing & Forwarding Charges</span>
                                    <span className="font-mono">{summary?.packing_charges || purchaseOrder.packaginchrgs || "0.00"}</span>
                                </div>

                                <div className="flex justify-between text-sm text-gray-500 dark:text-dark-300">
                                    <span>Freight Charges</span>
                                    <span className="font-mono">{summary?.freight_charges || purchaseOrder.freightchrgs || "0.00"}</span>
                                </div>

                                <div className="flex justify-between text-sm text-gray-500 dark:text-dark-300">
                                    <span>Insurance Charges</span>
                                    <span className="font-mono">{summary?.insurance_charges || purchaseOrder.insurancechrgs || "0.00"}</span>
                                </div>

                                <div className="flex justify-between text-sm text-gray-500 dark:text-dark-300">
                                    <span>Calibration Certificate Charges</span>
                                    <span className="font-mono">{summary?.calibration_charges || purchaseOrder.calibrationchrgs || "0.00"}</span>
                                </div>

                                <div className="flex justify-between text-sm text-gray-500 dark:text-dark-300">
                                    <span>Installation & Training Charges</span>
                                    <span className="font-mono">{summary?.training_charges || purchaseOrder.trainingchrgs || "0.00"}</span>
                                </div>

                                <div className="flex justify-between text-sm text-gray-500 dark:text-dark-300">
                                    <span>Import / Custom Duty Charges</span>
                                    <span className="font-mono">{summary?.custom_duty_charges || purchaseOrder.customdutychrgs || "0.00"}</span>
                                </div>

                                <div className="flex justify-between border-t pt-2 text-sm text-gray-600 dark:text-dark-200">
                                    <span>Total Tax Value</span>
                                    <span className="font-mono">{summary?.total_tax_amount || purchaseOrder.totaltaxamount || "0.00"}</span>
                                </div>

                                <div className="flex justify-between text-sm text-gray-600 dark:text-dark-200">
                                    <span>Total Invoice Amount</span>
                                    <span className="font-mono">{summary?.total_invoice_amount || purchaseOrder.totalamount || "0.00"}</span>
                                </div>

                                <div className="flex justify-between text-sm text-gray-500 dark:text-dark-300">
                                    <span>Round Off</span>
                                    <span className="font-mono">{summary?.roundoff || purchaseOrder.roundoff || "0.00"}</span>
                                </div>

                                <div className="flex justify-between border-t border-gray-300 pt-3 text-lg font-bold text-gray-900 dark:border-dark-500 dark:text-dark-50">
                                    <span>Total</span>
                                    <span className="font-mono text-primary-600">
                                        {Number(summary?.final_total || purchaseOrder.finaltotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Approval Action Footer */}
                        <div className="mt-8 border-t border-gray-200 pt-6 dark:border-dark-500">
                            <div className="flex justify-end">
                                <Button
                                    onClick={handleApprove}
                                    color="success"
                                    className="px-8 font-medium"
                                    loading={approving}
                                    disabled={approving}
                                >
                                    {approving ? "Approving..." : "Approve"}
                                </Button>
                            </div>
                        </div>

                    </div>
                </Card>
            </div>
        </Page>
    );
}
