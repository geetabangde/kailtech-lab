import { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Page } from "components/shared/Page";
import { Button, Card } from "components/ui";
import axios from "utils/axios";
import { toast } from "sonner";
import dayjs from "dayjs";
import {  Printer } from "lucide-react";

import logo from "assets/krtc.jpg";

// ----------------------------------------------------------------------

const MODES_OF_ENQUIRY = ["Telephone", "Email", "Personal", "Whatsapp", "E-Media", "Other"];


export default function ViewTQuotation() {
    const { id } = useParams();
    const navigate = useNavigate();
    const permissions = JSON.parse(localStorage.getItem("userPermissions") || "[]");

    useEffect(() => {
        if (!permissions.includes(141)) {
            navigate("/dashboards/sales/testing-quotations");
        }
    }, [navigate, permissions]);

    const [loading, setLoading] = useState(true);
    const [quote, setQuote] = useState(null);
    const [items, setItems] = useState([]);
    const [customerInfo, setCustomerInfo] = useState(null);
    const [contactPerson, setContactPerson] = useState(null);
    const [statutoryDetails, setStatutoryDetails] = useState([]);
    const [addressInfo, setAddressInfo] = useState(null);
    const [digitalSignature, setDigitalSignature] = useState(null);
    const [companyInfo, setCompanyInfo] = useState(null);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [quoteRes, companyRes] = await Promise.all([
                axios.get(`/sales/view-testing-quotation/${id}`),
                axios.get("/get-company-info")
            ]);

            if (quoteRes.data?.status === true) {
                const data = quoteRes.data.data;
                const q = data.quotation;
                const qItems = data.products || [];
                setQuote(q || null);
                setItems(qItems);
                setCustomerInfo(data.customer || null);
                setContactPerson(data.contact || null);
                setStatutoryDetails(data.statutory || []);
                setAddressInfo(data.address || null);
                setDigitalSignature(data.digital_signature || null);
            }

            if (companyRes.data?.status) {
                setCompanyInfo(companyRes.data.data);
            }
        } catch (err) {
            console.error("Error fetching data:", err);
            toast.error("Failed to load quotation details");
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading) return <div className="p-10 text-center">Loading...</div>;
    if (!quote) return <div className="p-10 text-center">Quotation not found.</div>;

    const border = "1px solid #e5e7eb";
    const cellPad = "8px 12px";
    const fontBase = { fontFamily: "'Inter', sans-serif", fontSize: 13, color: "#000" };

    return (
        <Page title={`View Testing Quotation - ${quote.quotationno || id}`}>
            <div className="transition-content px-[var(--margin-x)] pb-12">
                
                {/* Actions Header */}
                <div className="mb-6 flex items-center justify-between no-print">
                    <div className="flex items-center gap-3">
                        <Link to="/dashboards/sales/testing-quotations" className="rounded-full p-1.5">
                         <Button variant="outline" className="flex items-center gap-2 border-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700">
                                &lt;&lt; Back to List
                            </Button>  
                        </Link>
                        <h1 className="text-xl font-semibold text-gray-800">View Quotation</h1>
                    </div>
                    <div className="flex gap-3">
                        <Button onClick={() => window.print()} color="success" className="flex items-center gap-2">
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
                                    src={companyInfo?.branding?.logo || logo}
                                    alt="Company Logo"
                                    style={{ height: 50, width: "auto", objectFit: "contain" }}
                                    onError={(e) => { e.target.src = "/logo.png"; }}
                                />
                            </div>
                            <div style={{ textAlign: "right", fontSize: 12, color: "#666" }}>
                                <div style={{ fontWeight: "bold", color: "#1a3a8f" }}>Doc No. KTRC/QF/0701/01</div>
                            </div>
                        </div>

                        {/* Centered Company Identity */}
                        <div style={{ textAlign: "center", marginBottom: 30 }}>
                            <h1 style={{ margin: 0, fontSize: 18, fontWeight: "500", color: "#333", letterSpacing: "0.5px" }}>
                                {companyInfo?.company?.name }
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
                                <div>M/s {quote.customer === "new" ? quote.customername : (customerInfo?.name || quote.customername)}</div>
                                <div style={{ marginTop: 5, fontSize: 12 }}>
                                    {quote.customer === "new" ? quote.customeraddress : (addressInfo?.full_address || "Address details missing")}
                                </div>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
                                <div style={{ borderRight: border, padding: 10 }}>
                                    <div style={{ fontWeight: "bold", borderBottom: border, paddingBottom: 4, marginBottom: 4 }}>Quotation Ref.:</div>
                                    <div style={{ fontWeight: "bold", borderBottom: border, paddingBottom: 4, marginBottom: 4 }}>Date :</div>
                                    <div style={{ fontWeight: "bold" }}>Validity :</div>
                                </div>
                                <div style={{ padding: 10 }}>
                                    <div style={{ borderBottom: border, paddingBottom: 4, marginBottom: 4 }}>{quote.quotationno || `KRTC/T/${dayjs(quote.added_on).format('YYYYMMDD')}/${quote.added_by}/${id}`}</div>
                                    <div style={{ borderBottom: border, paddingBottom: 4, marginBottom: 4 }}>{dayjs(quote.added_on).format("DD.MM.YYYY")}</div>
                                    <div>30 Days</div>
                                </div>
                            </div>
                        </div>

                        {/* Attention & Enquiry Section */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", border: border, borderTop: "none", marginBottom: 30 }}>
                            <div style={{ padding: 10, borderRight: border }}>
                                <div style={{ fontSize: 13, color: "#666", marginBottom: 2 }}>Kind Attn:</div>
                                <div style={{ fontWeight: "600" }}>{quote.customer === "new" ? quote.contactpersonname : (contactPerson?.name || quote.contactpersonname)}</div>
                            </div>
                            <div style={{ padding: 10, borderRight: border }}>
                                <div style={{ fontSize: 13, color: "#666", marginBottom: 2 }}>Contact Details:</div>
                                <div style={{ fontSize: 13 }}>Mobile: {quote.customer === "new" ? quote.concernpersonmobile : (customerInfo?.mobile || quote.concernpersonmobile)}</div>
                                <div style={{ fontSize: 13 }}>Email: {quote.customer === "new" ? quote.concernpersonemail : (customerInfo?.email || quote.concernpersonemail)}</div>
                            </div>
                            <div style={{ padding: 10, borderRight: border }}>
                                <div style={{ fontSize: 13, color: "#666", marginBottom: 2 }}>Enquiry No:</div>
                                <div>{quote.enquiry || "N/A"}</div>
                            </div>
                            <div style={{ padding: 10 }}>
                                <div style={{ fontSize: 13, color: "#666", marginBottom: 2 }}>Date:</div>
                                <div>{dayjs(quote.added_on).format("DD.MM.YYYY")}</div>
                            </div>
                        </div>

                        <div style={{ marginBottom: 20, fontSize: 13 }}>
                            <p>Dear Sir/Madam,</p>
                            <p style={{ marginTop: 8 }}>
                                This is reference to your <b>{MODES_OF_ENQUIRY[quote.modeof]}</b> dated <b>{dayjs(quote.enquirydate).format('DD-MM-YYYY')}</b> and your enquiry regarding your Testing requirements. We thank you for your enquiry. We are offering you our rates for the product enquired by you as under:
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
                                    <th style={{ borderRight: border, padding: cellPad, width: 100, textAlign: "right" }}>Amount<br/>(INR)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item, idx) => (
                                    <tr key={idx} style={{ fontSize: 11, borderBottom: border }}>
                                        <td style={{ borderRight: border, padding: cellPad, textAlign: "center" }}>{idx + 1}</td>
                                        <td style={{ borderRight: border, padding: cellPad }}>{item.standard}</td>
                                        <td style={{ borderRight: border, padding: cellPad }}>{item.product}</td>
                                        <td style={{ borderRight: border, padding: cellPad }}>{item.grade || "N/A"}</td>
                                        <td style={{ borderRight: border, padding: cellPad }}>{item.size || "N/A"}</td>
                                        <td style={{ borderRight: border, padding: cellPad }}>
                                            {item.sample_quantity ? item.sample_quantity.join(", ") : "---"}
                                        </td>
                                        <td style={{ borderRight: border, padding: cellPad }}>
                                            <div>{item.package}</div>
                                            {item.parameters && item.parameters.length > 0 && (
                                                <div style={{ fontSize: 9, color: "#666", marginTop: 4 }}>
                                                    {item.parameters.join(", ")}
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ borderRight: border, padding: cellPad, textAlign: "center" }}>{item.qty}</td>
                                        <td style={{ borderRight: border, padding: cellPad, textAlign: "right" }}>Rs.{parseFloat(item.unit_cost).toLocaleString()}</td>
                                        <td style={{ borderRight: border, padding: cellPad, textAlign: "right" }}>Rs.{parseFloat(item.amount).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Terms and Conditions (Full Width) */}
                        <div style={{ marginTop: 40, borderTop: "1px solid #eee", paddingTop: 20 }}>
                            <p style={{ margin: "0 0 10px", fontWeight: "bold", textDecoration: "underline", fontSize: 12 }}>Terms & Conditions:</p>
                            <div style={{ fontSize: 11, lineHeight: 1.6, color: "#444" }}>
                                <p style={{ margin: "0 0 4px" }}>1. Rates are for the tests conducted at our Lab at Indore (Madhya Pradesh) India.</p>
                                <p style={{ margin: "0 0 4px" }}>2. Cross Cheque/Demand Draft/NEFT/RTGS should be drawn in favour of Kailtech Test And Research Centre Pvt. Ltd. Payable at Indore (Madhya Pradesh).</p>
                                <p style={{ margin: "0 0 4px" }}>3. Please attach bill details indicating Quotation No. / Invoice No. & TDS deductions if any, along with your payment.</p>
                                <p style={{ margin: "0 0 4px" }}>4. Taxes are applicable as per the prevailing rates at the time of Invoicing-Currently GST of 18% is applicable on all invoices.</p>
                                <p style={{ margin: "0 0 4px" }}>5. For GST registered Customer the GST No. is mandatory for sample registration in order for the same to be included in the tax invoices.</p>
                                <p style={{ margin: "0 0 4px" }}>6. Validity : 30 days from the date of issued of this quotation.</p>
                                {quote.customterms && (
                                    <p style={{ margin: "0 0 4px" }} dangerouslySetInnerHTML={{ __html: `7. ${quote.customterms.replace(/<p>/g, '').replace(/<\/p>/g, '')}` }} />
                                )}
                                <p style={{ margin: "0 0 4px" }}>8. If the payment is to be paid in Cash pay to UPI <b>0795933A0099960.bqr@kotak</b> only and take official receipt. Else claim of payment, shall not be accepted.</p>
                                <p style={{ margin: "0 0 4px" }}>9. Subject to exclusive jurisdiction of courts at Indore (Madhya Pradesh) only.</p>
                                <p style={{ margin: "0 0 4px" }}>10. Due to COVID-19, problem or situation beyond control there may be delay in Testing and Reporting.</p>
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

                                <div style={{ marginTop: 5 }}>
                                    {!digitalSignature ? (
                                        <div style={{ fontSize: 11, lineHeight: 1.4 }}>
                                            Electronically signed by<br />
                                            {companyInfo?.company?.person_name || "Authorized Signatory"}<br />

                                            Date:{dayjs(quote.added_on).format("DD/MM/YYYY")}<br />
                                            <span style={{ fontWeight: "500" }}>{customerInfo?.mobile || "---"}</span>
                                        </div>
                                    ) : (
                                        <div>
                                            <img
                                                src={digitalSignature}
                                                alt="Signature"
                                                style={{ maxHeight: 80, width: "auto" }}
                                                onError={(e) => { e.target.style.display = 'none'; }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div style={{ marginTop: 30, textAlign: "center", fontSize: 10, color: "#aaa" }}>
                        </div>
                    </Card>
                </div>

                <style dangerouslySetInnerHTML={{ __html: `
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
