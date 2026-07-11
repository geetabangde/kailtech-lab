import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { Page } from "components/shared/Page";
import { Card, Button } from "components/ui";
import axios from "utils/axios";
import dayjs from "dayjs";
import { Printer } from "lucide-react";

export default function ViewTQuotationParameterWise() {
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [quotation, setQuotation] = useState(null);
    const [items, setItems] = useState([]);
    const [statutoryDetails, setStatutoryDetails] = useState([]);
    const [companyInfo, setCompanyInfo] = useState(null);
    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [quoteRes, companyRes] = await Promise.all([
                axios.get(`/sales/view-testing-quotation-byperameter/${id}`),
                axios.get("/get-company-info")
            ]);

            if (quoteRes.data?.status) {
                const data = quoteRes.data.data;

                setQuotation({
                    ...data.quotation,
                    customername: data.customer?.name,
                    customeraddress: data.customer?.address,
                    contactpersonname: data.customer?.contact_person,
                    contactpersonmobile: data.customer?.mobile,
                    concernpersonemail: data.customer?.email,
                    ourscope: data.ourscope,
                    yourscope: data.yourscope,
                    customterms: data.terms,
                    digital_signature: data.signature
                });

                setItems(data.products || []);
                setStatutoryDetails(data.statutory || []);
            }

            if (companyRes.data?.status) {
                setCompanyInfo(companyRes.data.data);
            }
        } catch (err) {
            console.error("Failed to fetch data", err);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <Page title="View Quotation">
                <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
                    <p className="font-medium text-gray-500">Loading quotation details...</p>
                </div>
            </Page>
        );
    }

    if (!quotation) {
        return (
            <Page title="View Quotation">
                <Card className="p-8 text-center">
                    <p className="text-gray-500 italic">Quotation not found.</p>
                    <Link to="/dashboards/sales/testing-quotations" className="mt-4 inline-block text-blue-600 hover:underline">
                        Go back to list
                    </Link>
                </Card>
            </Page>
        );
    }

    // Helper for formatting terms
    const formatTerms = (terms) => {
        if (!terms) return null;
        return terms.replace(/<p>/g, "").replace(/<\/p>/g, "<br/>");
    };

    const modes = ["Telephone", "Email", "Personal", "Whatsapp", "E-Media"];

    const border = "1px solid #e5e7eb";
    const cellPad = "8px 12px";
    const fontBase = { fontFamily: "'Inter', sans-serif", fontSize: 13, color: "#000" };

    return (
        <Page title={`View Testing Quotation (Parameter Wise) - ${quotation?.quotationno || id}`}>
            <div className="transition-content px-[var(--margin-x)] pb-12">

                {/* Actions Header */}
                <div className="mb-6 flex items-center justify-between no-print">
                    <div className="flex items-center gap-3">
                        <Link to="/dashboards/sales/testing-quotations" className="rounded-full p-1.5">
                        <Button variant="outline" className="flex items-center gap-2 border-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700">
                                &lt;&lt; Back to List
                            </Button>  
                        </Link>
                        <h1 className="text-xl font-semibold text-gray-800">View Quotation (Parameter Wise)</h1>
                    </div>
                    <div className="flex gap-3">
                        <Button onClick={handlePrint} color="success" className="flex items-center gap-2">
                            <Printer size={18} /> Print / Download
                        </Button>
                    </div>
                </div>

                {/* Letterhead Document */}
                <div className="mx-auto print:m-0 print-container" style={{ width: "100%", maxWidth: 1100, ...fontBase }}>
                    <Card className="bg-white p-10 shadow-xl print:shadow-none print:p-0 print:border-none">

                        {/* Header Section */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                            <div style={{ width: "20%" }}>
                                <img
                                    src={companyInfo?.branding?.logo}
                                    alt="Company Logo"
                                    style={{ height: 50, width: "auto", objectFit: "contain" }}
                                    onError={(e) => { e.target.src = "/logo.png"; }}
                                />
                            </div>
                            <div style={{ textAlign: "right", fontSize: 12, color: "#666" }}>
                                <div style={{ fontWeight: "bold", color: "#1a3a8f" }}>Doc No. KRTC/QF/0701/01</div>
                            </div>
                        </div>

                        {/* Centered Company Identity */}
                        <div style={{ textAlign: "center", marginBottom: 30 }}>
                            <h1 style={{ margin: 0, fontSize: 18, fontWeight: "500", color: "#333", letterSpacing: "0.5px" }}>
                                {companyInfo?.company?.name || "KAILTECH TEST AND RESEARCH CENTRE PVT. LTD."}
                            </h1>
                            <p style={{ fontSize: 11, color: "#555", marginTop: 4, lineHeight: 1.5 }}>
                                NABL Accredited (As per ISO 17025:2017 as per TC-7832 & CC-2348)<br />
                                {companyInfo?.address?.full_address || "Plot No. 141-C, Electronic Complex, Industrial Area, Indore-452010 (M.P.) India"}<br />
                                {companyInfo?.contact?.phone || "Ph: 91-731-4787555"}<br />
                                Email: {companyInfo?.contact?.email || "contact@kailtech.net"} , Web: {companyInfo?.contact?.website || "www.kailtech.net"}
                            </p>
                        </div>

                        {/* Customer & Quote Details */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", border: border, marginBottom: 20 }}>
                            <div style={{ padding: 15, borderRight: border }}>
                                <div style={{ fontSize: 13, color: "#666", textDecoration: "underline", marginBottom: 5 }}>Customer Name:</div>
                                <div>M/s {quotation.customername || "N/A"}</div>
                                <div style={{ marginTop: 5, fontSize: 12 }} dangerouslySetInnerHTML={{ __html: quotation.customeraddress || "Address details missing" }} />
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
                                <div style={{ borderRight: border, padding: 10 }}>
                                    <div style={{ fontWeight: "bold", borderBottom: border, paddingBottom: 4, marginBottom: 4 }}>Quotation Ref.:</div>
                                    <div style={{ fontWeight: "bold", borderBottom: border, paddingBottom: 4, marginBottom: 4 }}>Date :</div>
                                    <div style={{ fontWeight: "bold" }}>Validity :</div>
                                </div>
                                <div style={{ padding: 10 }}>
                                    <div style={{ borderBottom: border, paddingBottom: 4, marginBottom: 4 }}>{quotation.quotationno || `${quotation.companyshortname || "KRTC"}/T${dayjs().format('YYYYMMDD')}/${quotation.added_by}/${id}`}</div>
                                    <div style={{ borderBottom: border, paddingBottom: 4, marginBottom: 4 }}>{dayjs(quotation.added_on).format("DD.MM.YYYY")}</div>
                                    <div>30 Days</div>
                                </div>
                            </div>
                        </div>

                        {/* Attention & Enquiry Section */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", border: border, borderTop: "none", marginBottom: 30 }}>
                            <div style={{ padding: 10, borderRight: border }}>
                                <div style={{ fontSize: 13, color: "#666", marginBottom: 2 }}>Kind Attn:</div>
                                <div style={{ fontWeight: "600" }}>{quotation.contactpersonname || "N/A"}</div>
                            </div>
                            <div style={{ padding: 10, borderRight: border }}>
                                <div style={{ fontSize: 13, color: "#666", marginBottom: 2 }}>Contact Details:</div>
                                <div style={{ fontSize: 13 }}>Mobile: {quotation.contactpersonmobile || "N/A"}</div>
                                <div style={{ fontSize: 13 }}>Email: {quotation.concernpersonemail || "N/A"}</div>
                            </div>
                            <div style={{ padding: 10, borderRight: border }}>
                                <div style={{ fontSize: 13, color: "#666", marginBottom: 2 }}>Enquiry No:</div>
                                <div>{quotation.enquiry || "N/A"}</div>
                            </div>
                            <div style={{ padding: 10 }}>
                                <div style={{ fontSize: 13, color: "#666", marginBottom: 2 }}>Date:</div>
                                <div>{dayjs(quotation.added_on).format("DD.MM.YYYY")}</div>
                            </div>
                        </div>

                        <div style={{ marginBottom: 20, fontSize: 13 }}>
                            <p>Dear Sir/Madam,</p>
                            <p style={{ marginTop: 8 }}>
                                This is reference to your <b>{modes[quotation.modeof] || "Enquiry"}</b> dated <b>{dayjs(quotation.enquirydate).format('DD-MM-YYYY')}</b> and your enquiry regarding your Testing requirements. We thank you for your enquiry. We are offering you our rates for the product enquired by you as under:
                            </p>
                        </div>

                        {/* Items Table */}
                        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 20 }}>
                            <thead>
                                <tr style={{ fontSize: 11, backgroundColor: "#f9fafb", borderTop: border, borderBottom: border }}>
                                    <th style={{ borderRight: border, padding: cellPad, width: 40 }}>S.No</th>
                                    <th style={{ borderRight: border, padding: cellPad }}>Standard</th>
                                    <th style={{ borderRight: border, padding: cellPad }}>Product</th>
                                    <th style={{ borderRight: border, padding: cellPad }}>Grade</th>
                                    <th style={{ borderRight: border, padding: cellPad }}>Size</th>
                                    <th style={{ borderRight: border, padding: cellPad }}>Sample Qty</th>
                                    <th style={{ borderRight: border, padding: cellPad }}>Package / Test Name</th>
                                    <th style={{ borderRight: border, padding: cellPad, width: 50 }}>Qty</th>
                                    <th style={{ borderRight: border, padding: cellPad, width: 80, textAlign: "right" }}>Unit Cost</th>
                                    <th style={{ borderRight: border, padding: cellPad, width: 100, textAlign: "right" }}>Amount<br />(INR)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.length === 0 && (
                                    <tr>
                                        <td colSpan={10} style={{ padding: cellPad, textAlign: "center", color: "#9ca3af" }}>
                                            No products available
                                        </td>
                                    </tr>
                                )}
                                {items.map((item, idx) => (
                                    <React.Fragment key={idx}>
                                        <tr style={{ fontSize: 11, borderBottom: border }}>
                                            <td style={{ borderRight: border, padding: cellPad, textAlign: "center" }} rowSpan={2}>{item.sno || idx + 1}</td>
                                            <td style={{ borderRight: border, padding: cellPad }}>{item.standard_name || item.standard}</td>
                                            <td style={{ borderRight: border, padding: cellPad, fontWeight: "600" }}>{item.product_name || item.product}</td>
                                            <td style={{ borderRight: border, padding: cellPad }}>{item.grade_name || item.grade}</td>
                                            <td style={{ borderRight: border, padding: cellPad }}>{item.size_name || item.size}</td>
                                            <td style={{ borderRight: border, padding: cellPad }}>
                                                {item.sample_quantity?.join(", ") || "---"}
                                            </td>
                                            <td style={{ borderRight: border, padding: cellPad }}>
                                                <div>{item.package_name || item.package}</div>
                                            </td>
                                            <td style={{ borderRight: border, padding: cellPad, textAlign: "center" }}>{item.qty}</td>
                                            <td style={{ borderRight: border, padding: cellPad, textAlign: "right" }}>Rs.{Number(item.unit_cost || item.unitcost).toLocaleString()}</td>
                                            <td style={{ borderRight: border, padding: cellPad, textAlign: "right", fontWeight: "bold" }} rowSpan={2}>Rs.{Number(item.amount || item.total).toLocaleString()}</td>
                                        </tr>
                                        <tr style={{ fontSize: 11, borderBottom: border }}>
                                            <td colSpan={8} style={{ borderRight: border, padding: cellPad }}>
                                                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                                    <span style={{ fontWeight: "bold", textDecoration: "underline", fontSize: 11 }}>{item.parameters_row?.label || "Parameter List"}:</span>
                                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 8px", fontStyle: "italic", color: "#4b5563" }}>
                                                        {item.parameters_row?.values || "N/A"}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    </React.Fragment>
                                ))}

                                {/* Additional Charges */}
                                {Number(quotation.discount) > 0 && (
                                    <tr style={{ fontSize: 11, borderBottom: border }}>
                                        <td colSpan={9} style={{ borderRight: border, padding: cellPad, textAlign: "right", fontWeight: "500" }}>
                                            Discount {Number(quotation.disctype) === 2 ? `(${quotation.discnumber}%)` : ""}
                                        </td>
                                        <td style={{ borderRight: border, padding: cellPad, textAlign: "right", fontWeight: "bold" }}>Rs.{Number(quotation.discount).toLocaleString()}</td>
                                    </tr>
                                )}
                                {Number(quotation.sampleprep) > 0 && (
                                    <tr style={{ fontSize: 11, borderBottom: border }}>
                                        <td colSpan={9} style={{ borderRight: border, padding: cellPad, textAlign: "right", fontWeight: "500" }}>Sample Preparation / Handling Charges</td>
                                        <td style={{ borderRight: border, padding: cellPad, textAlign: "right", fontWeight: "bold" }}>Rs.{Number(quotation.sampleprep).toLocaleString()}</td>
                                    </tr>
                                )}
                                {Number(quotation.witness) > 0 && (
                                    <tr style={{ fontSize: 11, borderBottom: border }}>
                                        <td colSpan={9} style={{ borderRight: border, padding: cellPad, textAlign: "right", fontWeight: "500" }}>Witness Charges</td>
                                        <td style={{ borderRight: border, padding: cellPad, textAlign: "right", fontWeight: "bold" }}>Rs.{Number(quotation.witness).toLocaleString()}</td>
                                    </tr>
                                )}
                                {Number(quotation.mobilisation) > 0 && (
                                    <tr style={{ fontSize: 11, borderBottom: border }}>
                                        <td colSpan={9} style={{ borderRight: border, padding: cellPad, textAlign: "right", fontWeight: "500" }}>Mobilization & Demobilization Charges</td>
                                        <td style={{ borderRight: border, padding: cellPad, textAlign: "right", fontWeight: "bold" }}>Rs.{Number(quotation.mobilisation).toLocaleString()}</td>
                                    </tr>
                                )}
                                {Number(quotation.freight) > 0 && (
                                    <tr style={{ fontSize: 11, borderBottom: border }}>
                                        <td colSpan={9} style={{ borderRight: border, padding: cellPad, textAlign: "right", fontWeight: "500" }}>Freight Charges</td>
                                        <td style={{ borderRight: border, padding: cellPad, textAlign: "right", fontWeight: "bold" }}>Rs.{Number(quotation.freight).toLocaleString()}</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>

                        {/* Scopes */}
                        {(quotation.ourscope || quotation.yourscope) && (
                            <div style={{ marginBottom: 20, fontSize: 13 }}>
                                {quotation.ourscope && (
                                    <div style={{ marginBottom: 15 }}>
                                        <p style={{ fontWeight: "bold", textDecoration: "underline", margin: "0 0 5px" }}>Our Scope:</p>
                                        <div dangerouslySetInnerHTML={{ __html: quotation.ourscope }} />
                                    </div>
                                )}
                                {quotation.yourscope && (
                                    <div>
                                        <p style={{ fontWeight: "bold", textDecoration: "underline", margin: "0 0 5px" }}>Your Scope:</p>
                                        <div dangerouslySetInnerHTML={{ __html: quotation.yourscope }} />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Terms and Conditions (Full Width) */}
                        <div style={{ marginTop: 40, borderTop: "1px solid #eee", paddingTop: 20 }}>
                            <p style={{ margin: "0 0 10px", fontWeight: "bold", textDecoration: "underline", fontSize: 12 }}>Terms & Conditions:</p>
                            <div style={{ fontSize: 11, lineHeight: 1.6, color: "#444" }}>
                                {quotation.customterms && (
                                    <div dangerouslySetInnerHTML={{ __html: formatTerms(quotation.customterms) }} />
                                )}
                            </div>
                        </div>

                        {/* Statutory Detail (Full Width) */}
                        <div style={{ marginTop: 30 }}>
                            <p style={{ fontWeight: "bold", textDecoration: "underline", marginBottom: 10, fontSize: 12 }}>Statutory Detail</p>
                            <table style={{ width: "100%", borderCollapse: "collapse", border: border, fontSize: 11 }}>
                                <tbody>
                                    {statutoryDetails.map((item, idx) => (
                                        <tr key={idx} style={{ borderBottom: border }}>
                                            <td style={{ borderRight: border, padding: "8px 15px", fontWeight: "bold", width: 300 }}>{item.name}</td>
                                            <td style={{ padding: "8px 15px", color: "#333" }}>{item.description}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Conclusion Area (Below Table, Left Aligned) */}
                        <div style={{ marginTop: 40, textAlign: "left" }}>
                            <p style={{ fontSize: 13, marginBottom: 20 }}>Looking forward to receiving your valuable samples</p>

                            <div style={{ fontSize: 13 }}>
                                <p style={{ margin: "0 0 4px" }}>Thanks and regards,</p>
                                <p style={{ margin: "0 0 4px", fontWeight: "bold" }}>For {companyInfo?.company?.name || quotation.companyname || "KAILTECH TEST AND RESEARCH CENTRE PVT. LTD."}</p>

                                <div style={{ marginTop: 5 }}>
                                    {!quotation.digital_signature ? (
                                        <div style={{ fontSize: 11, lineHeight: 1.4 }}>
                                            Electronically signed by<br />
                                            {quotation.added_by_name || "Authorized Signatory"}<br />
                                            {quotation.added_by_designation ? `Designation: ${quotation.added_by_designation}` : ""}<br />

                                            Date:{dayjs(quotation.added_on).format("DD/MM/YYYY")}<br />
                                        </div>
                                    ) : (
                                        <div>
                                            <img
                                                src={quotation.digital_signature}
                                                alt="Signature"
                                                style={{ maxHeight: 80, width: "auto" }}
                                                onError={(e) => { e.target.style.display = 'none'; }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                <style dangerouslySetInnerHTML={{
                    __html: `
                    @media print {
                        body * { 
                            visibility: hidden; 
                        }
                        .print-container, .print-container * { 
                            visibility: visible; 
                        }
                        .print-container { 
                            position: absolute; 
                            left: 0; 
                            top: 0; 
                            width: 100%; 
                        }
                        @page { 
                            margin: 1cm; 
                            size: auto; 
                        }
                    }
                `}} />
            </div>
        </Page>
    );
}