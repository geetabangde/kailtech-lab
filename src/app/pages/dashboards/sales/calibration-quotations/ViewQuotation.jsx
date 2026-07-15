import { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Page } from "components/shared/Page";
import { Button, Card } from "components/ui";
import axios from "utils/axios";
import { toast } from "sonner";
import { ArrowLeft, Printer } from "lucide-react";

import logo from "assets/krtc.jpg";

// ----------------------------------------------------------------------


export default function ViewQuotation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const permissions = JSON.parse(localStorage.getItem("userPermissions") || "[]");

  useEffect(() => {
    if (!permissions.includes(93)) {
      navigate("/dashboards/sales/calibration-quotations");
      toast.error("You don't have permission to view quotations");
    }
  }, [navigate, permissions]);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [companyInfo, setCompanyInfo] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [quoteRes, companyRes, editRes] = await Promise.all([
        axios.get(`/sales/view-quotation-item/${id}`),
        axios.get("/get-company-info"),
        axios.get(`/sales/get-editdata-quotation/${id}`)
      ]);

      if (quoteRes.data?.status === "true" || quoteRes.data?.status === true) {
        const viewData = quoteRes.data.data;
        if (editRes.data?.status === "true" || editRes.data?.status === true) {
          const q = editRes.data.data?.quotation;
          if (q) {
            viewData.notes = q.notes || viewData.notes;
            viewData.customterms = q.customterms || viewData.customterms;
          }
        }
        setData(viewData);
      } else {
        toast.error(quoteRes.data?.message || "Quotation not found");
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

  if (loading) {
    return (
      <Page title="View Quotation">
        <div className="flex h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <span className="ml-3 text-gray-600">Preparing quotation view...</span>
        </div>
      </Page>
    );
  }

  if (!data) {
    return (
      <Page title="View Quotation">
        <div className="p-8 text-center">
          <h2 className="text-xl font-bold text-gray-400">Quotation not found</h2>
          <Link to="/dashboards/sales/calibration-quotations" className="mt-4 inline-block text-blue-600 hover:underline">
            Back to List
          </Link>
        </div>
      </Page>
    );
  }

  const {
    quotation_no,
    date,
    customer,
    items = [],
    amounts = {},
    tax = [],
    total,
    statutory = [],
    digital_signature,
    mode_of_enquiry,
    enquiry_date,
    created_by
  } = data;

  const border = "1px solid #e5e7eb";
  const cellPad = "8px 12px";
  const fontBase = { fontFamily: "'Inter', sans-serif", fontSize: 13, color: "#000" };

  return (
    <Page title={`Quotation - ${quotation_no}`}>
      <div className="transition-content px-[var(--margin-x)] pb-12">

        {/* Actions Header (No Print) */}
        <div className="mb-6 flex items-center justify-between no-print">
          <div className="flex items-center gap-3">
            <Link
              to="/dashboards/sales/calibration-quotations"
              className="rounded-full p-1.5 hover:bg-gray-100 dark:hover:bg-dark-700"
            >
              <ArrowLeft size={20} className="text-gray-600 dark:text-dark-300" />
            </Link>
            <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
              View Quotation
            </h1>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => window.print()}
              variant="flat"
              color="success"
              className="flex items-center gap-2"
            >
              <Printer size={18} />
              Print / Download
            </Button>
            <Link to={`/dashboards/sales/calibration-quotations/edit/${id}`}>
              <Button variant="outline" color="primary">
                Edit Quotation
              </Button>
            </Link>
          </div>
        </div>

        {/* Letterhead Document */}
        <div className="mx-auto print-area print:m-0" style={{ width: "100%", maxWidth: 1100, ...fontBase }}>
          <Card className="bg-white p-10 shadow-xl print:shadow-none print:p-0 print:border-none">

            {/* Top Header Line: Logo and Doc Info */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
              <div style={{ width: "20%" }}>
                <img
                  src={companyInfo?.branding?.logo || logo}
                  alt="Company Logo"
                  style={{ height: 50, width: "auto", objectFit: "contain" }}
                  onError={(e) => { e.target.src = "/logo.png"; }}
                />
              </div>
              <div style={{ textAlign: "right", fontSize: 10, color: "#444", lineHeight: 1.4 }}>
                <div>Doc No. KTRC/QF/0701/01</div>
                <div>NABL Accredited</div>
                <div>BIS Recognized</div>
                <div>ISO 9001:2015 Certified Lab</div>
              </div>
            </div>

            {/* Centered Company Identity */}
            <div style={{ textAlign: "center", marginBottom: 30 }}>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: "500", color: "#333", letterSpacing: "0.5px" }}>
                {companyInfo?.company?.name}
              </h1>
              <p style={{ fontSize: 11, color: "#555", marginTop: 4, lineHeight: 1.5 }}>
                {companyInfo?.address?.full_address}<br />
                {companyInfo?.contact?.phone}<br />
                Email: {companyInfo?.contact?.email} , Web: {companyInfo?.contact?.website}
              </p>
            </div>

            {/* Quotation No and Date (Right Aligned) */}
            <div style={{ textAlign: "right", marginBottom: 20, fontSize: 12 }}>
              <div style={{ fontWeight: "500" }}>{quotation_no}</div>
              <div>{date}</div>
            </div>

            {/* Customer Info (Left Aligned) */}
            <div style={{ marginBottom: 25, fontSize: 12, lineHeight: 1.5 }}>
              <div style={{ fontWeight: "500" }}>M/s {customer?.name}</div>
              <div style={{ maxWidth: 450, whiteSpace: "pre-wrap" }}>
                {customer?.address}
              </div>
              <div style={{ marginTop: 4 }}>
                <div>Mobile: {customer?.mobile}</div>
                <div>Email: {customer?.email}</div>
              </div>
            </div>

            {/* Kind Attn (Centered) */}
            <div style={{ textAlign: "center", margin: "30px 0", fontSize: 14 }}>
              Kind Attn. : {customer?.contact_person}
            </div>

            {/* Opening Text */}
            <div style={{ margin: "20px 0", fontSize: 12, lineHeight: 1.6 }}>
              <p style={{ marginBottom: 4, fontWeight: "500" }}>Dear Sir,</p>
              <p>
                This is with reference to your <span style={{ textDecoration: "underline" }}>{mode_of_enquiry || "Enquiry"}</span> dated <span style={{ fontWeight: "500" }}>{enquiry_date}</span> and your enquiry regarding your Calibration requirements. We thank you for your enquiry. We are offering you our rates for the product enquired by you as under:
              </p>
            </div>

            {/* Items Table and Billing Summary */}
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 30 }}>
              <thead>
                <tr style={{ textAlign: "left", fontSize: 12, borderTop: border, borderBottom: border, background: "#f9fafb" }}>
                  <th style={{ borderRight: border, padding: cellPad, width: 50, textAlign: "center" }}>S.No</th>
                  <th style={{ borderRight: border, padding: cellPad }}>Name</th>
                  <th style={{ borderRight: border, padding: cellPad }}>Description</th>
                  <th style={{ borderRight: border, padding: cellPad, textAlign: "center" }}>Accreditation</th>
                  <th style={{ borderRight: border, padding: cellPad, textAlign: "center", width: 80 }}>Quantity</th>
                  <th style={{ borderRight: border, padding: cellPad, textAlign: "right", width: 100 }}>Rate</th>
                  <th style={{ borderRight: border, padding: cellPad, textAlign: "center", width: 100 }}>Location</th>
                  <th style={{ padding: cellPad, textAlign: "right", width: 100 }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={item.id || idx} style={{ fontSize: 12, borderBottom: border }}>
                    <td style={{ borderRight: border, padding: cellPad, textAlign: "center" }}>{idx + 1}</td>
                    <td style={{ borderRight: border, padding: cellPad }}>{item.name}</td>
                    <td style={{ borderRight: border, padding: cellPad }}>{item.description}</td>
                    <td style={{ borderRight: border, padding: cellPad, textAlign: "center" }}>{item.accreditation}</td>
                    <td style={{ borderRight: border, padding: cellPad, textAlign: "center" }}>{item.qty}</td>
                    <td style={{ borderRight: border, padding: cellPad, textAlign: "right" }}>{parseFloat(item.rate).toLocaleString()}</td>
                    <td style={{ borderRight: border, padding: cellPad, textAlign: "center" }}>{item.location}</td>
                    <td style={{ padding: cellPad, textAlign: "right" }}>{parseFloat(item.amount).toLocaleString()}</td>
                  </tr>
                ))}

                {/* Summary Rows */}
                <tr style={{ fontSize: 12 }}>
                  <td colSpan={7} style={{ borderRight: border, borderBottom: border, padding: cellPad, textAlign: "right", fontWeight: "bold" }}>Subtotal</td>
                  <td style={{ borderBottom: border, padding: cellPad, textAlign: "right" }}>{parseFloat(amounts.subtotal || 0).toLocaleString()}</td>
                </tr>
                {parseFloat(amounts.discount || 0) > 0 && (
                  <tr style={{ fontSize: 12 }}>
                    <td colSpan={7} style={{ borderRight: border, borderBottom: border, padding: cellPad, textAlign: "right", fontWeight: "bold" }}>Discount</td>
                    <td style={{ borderBottom: border, padding: cellPad, textAlign: "right" }}>{parseFloat(amounts.discount).toLocaleString()}</td>
                  </tr>
                )}
                <tr style={{ fontSize: 12 }}>
                  <td colSpan={7} style={{ borderRight: border, borderBottom: border, padding: cellPad, textAlign: "right", fontWeight: "bold" }}>Mobilization & Demobilization Charges</td>
                  <td style={{ borderBottom: border, padding: cellPad, textAlign: "right" }}>{parseFloat(amounts.mobilisation || 0).toLocaleString()}</td>
                </tr>
                <tr style={{ fontSize: 12 }}>
                  <td colSpan={7} style={{ borderRight: border, borderBottom: border, padding: cellPad, textAlign: "right", fontWeight: "bold" }}>Freight Charges</td>
                  <td style={{ borderBottom: border, padding: cellPad, textAlign: "right" }}>{parseFloat(amounts.freight || 0).toLocaleString()}</td>
                </tr>
                <tr style={{ fontSize: 12, background: "#fdfdfd" }}>
                  <td colSpan={7} style={{ borderRight: border, borderBottom: border, padding: cellPad, textAlign: "right", fontWeight: "bold" }}>Subtotal 2</td>
                  <td style={{ borderBottom: border, padding: cellPad, textAlign: "right" }}>{parseFloat(amounts.subtotal2 || 0).toLocaleString()}</td>
                </tr>
                {tax.map((t, idx) => (
                  <tr key={idx} style={{ fontSize: 12 }}>
                    <td colSpan={7} style={{ borderRight: border, borderBottom: border, padding: cellPad, textAlign: "right", fontWeight: "bold" }}>{t.type} {t.percent}%</td>
                    <td style={{ borderBottom: border, padding: cellPad, textAlign: "right" }}>{parseFloat(t.amount || 0).toLocaleString()}</td>
                  </tr>
                ))}
                <tr style={{ fontSize: 13, background: "#f9fafb", fontWeight: "bold" }}>
                  <td colSpan={7} style={{ borderRight: border, borderBottom: "2px solid #000", padding: cellPad, textAlign: "right" }}>Total</td>
                  <td style={{ borderBottom: "2px solid #000", padding: cellPad, textAlign: "right" }}>{parseFloat(total || 0).toLocaleString()}</td>
                </tr>
              </tbody>
            </table>

            {/* Notes Section */}
            {data?.notes && data.notes !== "<p><br></p>" && (
              <div style={{ marginTop: 20 }}>
                <p style={{ margin: "0 0 5px", fontWeight: "bold", fontSize: 12 }}>Note :-</p>
                <div style={{ fontSize: 11, lineHeight: 1.6, color: "#444" }} dangerouslySetInnerHTML={{ __html: data.notes }}></div>
              </div>
            )}

            {/* Terms and Conditions (Full Width) */}
            <div style={{ marginTop: 40, borderTop: "1px solid #eee", paddingTop: 20 }}>
              <p style={{ margin: "0 0 10px", fontWeight: "bold", textDecoration: "underline", fontSize: 12 }}>Terms & Conditions:</p>
              <div style={{ fontSize: 11, lineHeight: 1.6, color: "#444" }}>
                {data?.customterms && (
                  <div dangerouslySetInnerHTML={{ __html: data.customterms }}></div>
                )}
              </div>
            </div>

            {/* Statutory Detail (Full Width) */}
            <div style={{ marginTop: 30 }}>
              <p style={{ fontWeight: "bold", textDecoration: "underline", marginBottom: 10, fontSize: 12 }}>Statutory Detail</p>
              <table style={{ width: "100%", borderCollapse: "collapse", border: border, fontSize: 11 }}>
                <tbody>
                  {statutory.map((item, idx) => (
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
                  {!digital_signature?.image_url ? (
                    <div style={{ fontSize: 11, lineHeight: 1.4 }}>
                      Electronically signed by<br />
                      {companyInfo?.company?.person_name}<br />

                      Date:{date}<br />
                      <span style={{ fontWeight: "500" }}>{created_by?.mobile}</span>
                    </div>
                  ) : (
                    <div>
                      <img
                        src={digital_signature.image_url}
                        alt="Signature"
                        style={{ maxHeight: 80, width: "auto" }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                      <div style={{ fontSize: 11, fontWeight: "500", marginTop: 5 }}>{created_by?.mobile}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Global Print Styles */}
        <style dangerouslySetInnerHTML={{
          __html: `
          @media print {
            body * { visibility: hidden !important; }
            .no-print, header, nav, aside, .sidebar, .topbar { display: none !important; }
            .print-area, .print-area * { visibility: visible !important; }
            .print-area { 
              position: absolute !important; 
              left: 0 !important; 
              top: 0 !important; 
              width: 100% !important; 
              margin: 0 !important; 
              padding: 0 !important;
              background: white !important;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            @page { size: auto; margin: 15mm; }
          }
        `}} />

      </div>
    </Page>
  );
}