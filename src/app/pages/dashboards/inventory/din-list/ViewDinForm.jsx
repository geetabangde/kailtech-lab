import { useState, useEffect, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import axios from "utils/axios";
import { toast } from "react-hot-toast";
import dayjs from "dayjs";
import { Page } from "components/shared/Page";
import { Button } from "components/ui";
import appLogo from "assets/logo.png";
import { IMAGE_HOST_API } from "configs/auth.config";

const getLogoUrl = (logoPath) => {
  if (!logoPath) return appLogo;
  if (logoPath.startsWith("http://") || logoPath.startsWith("https://")) {
    return logoPath.replace(/https?:\/\/lims?\.kailtech\.in/i, IMAGE_HOST_API);
  }
  return `${IMAGE_HOST_API}/${logoPath.replace(/^\//, "")}`;
};

export default function ViewDinForm() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get("hakuna");

  const [loading, setLoading] = useState(true);
  const [dinDetails, setDinDetails] = useState(null);
  const [items, setItems] = useState([]);
  const [purposeId, setPurposeId] = useState(null);
  const [companyInfo, setCompanyInfo] = useState(null);

  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);
      const [reportRes, companyRes] = await Promise.all([
        axios.get(`inventory/get-din-report/${id}`),
        axios.get("get-company-info").catch(() => ({ data: { status: false, data: null } }))
      ]);

      if (reportRes.data.status && reportRes.data.data) {
        const details = reportRes.data.data.dispatch_details;

        if (details.customer_address && /^\d+$/.test(String(details.customer_address).trim())) {
          try {
            const addrRes = await axios.get(`inventory/get-customer-address-details/${details.customer_address}`);
            if (addrRes.data?.status && addrRes.data?.data?.addresses?.length > 0) {
              details.customer_address = addrRes.data.data.addresses[0].full_address;
            }
          } catch (err) {
            console.error("Failed to fetch address", err);
          }
        }

        setDinDetails(details);

        if (reportRes.data.data.items) {
          setItems(reportRes.data.data.items);
        }

        const pid = parseInt(details.dispatch_purpose_id);
        if (!isNaN(pid)) {
          setPurposeId(pid);
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

  if (loading) {
    return (
      <Page title="View DIN Form">
        <div className="flex h-64 items-center justify-center">
          <span className="text-gray-500">Loading Challan...</span>
        </div>
      </Page>
    );
  }

  if (!dinDetails) {
    return (
      <Page title="View DIN Form">
        <div className="p-5 text-center text-red-500">DIN Not Found</div>
      </Page>
    );
  }

  const statusInt = parseInt(dinDetails.status);

  // Purpose ID detection: check direct purpose ID keys first, then match name from dependencies
  const currentPurposeId = Number(
    dinDetails.purpose_id ||
    dinDetails.purpose ||
    dinDetails.dispatch_purpose_id ||
    purposeId
  );

  const purposeName = (dinDetails.dispatch_purpose || "").toLowerCase().trim();

  // Known Courier / Sample / Inward Purposes (Purposes 6, 7, 8, 9, 10 in PHP: After Calibration, Sample Return, etc.)
  const isExplicitCourierName = [
    "after calibration",
    "sample dispatch",
    "customer instrument return",
    "remnant",
    "trf",
    "courier",
    "outward",
    "inward"
  ].some((name) => purposeName.includes(name));

  // Check if items have TRF/Inward structure characteristic of Courier Table (Table 2)
  const hasCourierItems = items.some(
    (item) => Boolean(item.trfitemid || item.inwarditemid || (item.brn && (item.certificate || item.instrument)))
  );

  // Logic gates matching PHP:
  // Standard format if purpose is in [1, 2, 3, 4, 5, 11]
  const isStandardTable = dinDetails.is_standard_format !== undefined
    ? Boolean(dinDetails.is_standard_format)
    : currentPurposeId
      ? [1, 2, 3, 4, 5, 11].includes(currentPurposeId)
      : isExplicitCourierName || hasCourierItems
        ? false
        : true;

  // ID Number is shown for all standard tables EXCEPT purpose 11 (General Challan)
  const showIdNumber = currentPurposeId
    ? currentPurposeId !== 11
    : !purposeName.includes("general") && !purposeName.includes("custom");

  let watermarkText = "";
  if (statusInt === 99) watermarkText = "REJECTED";
  else if ([-2, -1, 0].includes(statusInt)) watermarkText = "DRAFT";

  // Helpers to parse date safely since new API returns DD/MM/YYYY string already
  const safeDate = (dateStr) => {
    if (!dateStr) return "";
    if (dateStr.includes("/")) return dateStr;
    return dayjs(dateStr).format("DD/MM/YYYY");
  };

  return (
    <Page title="View DIN Form">
      <style>
        {`
          @media print {
            @page {
              margin: 5mm;
            }
            .app-header,
            .sidebar-panel,
            .prime-panel,
            .sidebar-toggle-btn,
            .no-print {
              display: none !important;
            }

            body {
              margin: 0 !important;
              padding: 0 !important;
              background: #fff !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            main,
            .main-content,
            [data-layout="sideblock"] main,
            [data-layout="main-layout"] main {
              display: block !important;
              width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
            }

            .din-print-page,
            #printable-challan {
              width: 100% !important;
              max-width: none !important;
              margin: 0 !important;
              padding: 0 !important;
              border: 0 !important;
              box-shadow: none !important;
              background: #fff !important;
            }
            
            /* Reduce white space to fit on one page without shrinking text */
            #printable-challan table th,
            #printable-challan table td {
              padding: 6px !important;
              background-color: transparent !important;
            }
            #printable-challan .mb-8 {
              margin-bottom: 12px !important;
            }
            #printable-challan .mb-6 {
              margin-bottom: 12px !important;
            }
            #printable-challan .mt-12 {
              margin-top: 16px !important;
            }
            #printable-challan .gap-y-4 {
              row-gap: 8px !important;
            }
            #printable-challan .pb-4 {
              padding-bottom: 8px !important;
            }
          }
        `}
      </style>

      <div className="din-print-page p-4 sm:p-5 flex flex-col gap-6 relative min-h-screen bg-white">

        {/* Print Header Controls (Hidden during print) */}
        <div className="no-print print:hidden flex justify-between items-center mb-4">
          <Button component={Link} to="/dashboards/inventory/din-list" color="info" size="sm">
            {"<< Back"}
          </Button>
          <Button color="success" size="lg" onClick={() => window.print()} className="font-bold shadow-md">
            Download Dispatch Report
          </Button>
        </div>

        {/* Printable Area */}
        <div className="print:p-0 p-8 border border-gray-200 shadow-sm relative mx-auto w-full max-w-5xl bg-white text-black" id="printable-challan">

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
            <h2 className="text-sm font-semibold text-gray-900 uppercase mb-2 text-left tracking-wide">
              {(dinDetails.challan_title || (dinDetails.basis ? `${dinDetails.basis} CHALLAN` : "CHALLAN"))}
            </h2>

            {/* Header / Kailtech Info */}
            <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-6 text-sm">
              {/* Logo */}
              <div className="w-48 shrink-0">
                <img
                  src={getLogoUrl(companyInfo?.branding?.logo)}
                  alt="Company Logo"
                  className="w-40 object-contain"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = appLogo;
                  }}
                />
              </div>

              {/* Center Company Info */}
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

              {/* Right Challan Info */}
              <div className="w-48 shrink-0 text-right text-xs">
                <div>{companyInfo?.company?.gst_no || dinDetails.company_gst_no}</div>
                <div>Challan no. {dinDetails.challan_no}</div>
              </div>
            </div>

            {/* Core Dispatch Details Grid */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-4 mb-8 text-sm">
              <div className="flex">
                <span className="font-bold w-40 shrink-0">Customer:</span>
                <span>{dinDetails.customer_name || "-"}</span>
              </div>
              <div className="flex">
                <span className="font-bold w-40 shrink-0">Customer Address:</span>
                <span>{dinDetails.customer_address || "-"}<br />{dinDetails.gst_no ? `GST. No: ${dinDetails.gst_no}` : ""}</span>
              </div>

              <div className="flex">
                <span className="font-bold w-40 shrink-0">Concern Person name:</span>
                <span>{dinDetails.concern_person || "-"}</span>
              </div>
              <div className="flex">
                <span className="font-bold w-40 shrink-0">Concern Person Designation:</span>
                <span>{dinDetails.concern_person_designation || "-"}</span>
              </div>

              <div className="flex">
                <span className="font-bold w-40 shrink-0">Concern person email:</span>
                <span className="flex-1 min-w-0">
                  {dinDetails.concern_person_email
                    ? (() => {
                      const emails = dinDetails.concern_person_email
                        .split(",")
                        .map((email) => email.trim())
                        .filter(Boolean);
                      return emails.map((email, idx) => (
                        <div key={idx} className="break-all">
                          {email}
                          {idx < emails.length - 1 ? "," : ""}
                        </div>
                      ));
                    })()
                    : "-"}
                </span>
              </div>
              <div className="flex">
                <span className="font-bold w-40 shrink-0">Concern person mobile:</span>
                <span>{dinDetails.concern_person_phone || "-"}</span>
              </div>

              <div className="flex">
                <span className="font-bold w-40 shrink-0">Dispatch Purpose:</span>
                <span>{dinDetails.dispatch_purpose || "-"}</span>
              </div>
              <div className="flex">
                <span className="font-bold w-40 shrink-0">Responsible person:</span>
                <span>{dinDetails.responsible_person || "-"}</span>
              </div>

              <div className="flex">
                <span className="font-bold w-40 shrink-0">Dispatch Date:</span>
                <span>{safeDate(dinDetails.dispatch_date) || "-"}</span>
              </div>
              <div className="flex">
                <span className="font-bold w-40 shrink-0">Dispatch Through:</span>
                <span>
                  <div>{dinDetails.dispatch_through || "N/A"}</div>
                  {dinDetails.employee_name && <div>{dinDetails.employee_name}</div>}
                  {dinDetails.consign_name && (
                    <div>
                      {dinDetails.consign_name} {dinDetails.consign_phone ? `Ph. ${dinDetails.consign_phone}` : ""}
                    </div>
                  )}
                  {dinDetails.courier_no && <div>{dinDetails.courier_no}</div>}
                </span>
              </div>

              <div className="flex">
                <span className="font-bold w-40 shrink-0">Dispatch Detail:</span>
                <span>{dinDetails.dispatch_detail || "-"}</span>
              </div>
              <div className="flex">
                <span className="font-bold w-40 shrink-0">Dispatched By:</span>
                <span>{dinDetails.dispatched_by || "-"}</span>
              </div>
            </div>

            {/* Conditional Tables based on Purpose */}
            <div className="mb-8 overflow-x-auto">
              {isStandardTable ? (
                <table className="w-full border-collapse border border-gray-300 text-sm text-left">
                  <thead>
                    <tr className="bg-gray-100 print:bg-transparent">
                      <th className="border border-gray-300 p-2">Sr No</th>
                      {showIdNumber && <th className="border border-gray-300 p-2">ID Number</th>}
                      <th className="border border-gray-300 p-2">Serial Number</th>
                      <th className="border border-gray-300 p-2">Name Of The Item And Spares</th>
                      <th className="border border-gray-300 p-2">Description</th>
                      <th className="border border-gray-300 p-2">Remark</th>
                      <th className="border border-gray-300 p-2">Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length > 0 ? (
                      items.map((item, index) => (
                        <tr key={index}>
                          <td className="border border-gray-300 p-2">{index + 1}</td>
                          {showIdNumber && (
                            <td className="border border-gray-300 p-2">{item.id_number || item.id_no || item.newidno || item.idno || item.instrument_id_no || "-"}</td>
                          )}
                          <td className="border border-gray-300 p-2">{item.serial_number || item.serialno || item.serial_no || "-"}</td>
                          <td className="border border-gray-300 p-2">
                            {item.instrument_name || item.name || item.item_name || "-"}
                          </td>
                          <td className="border border-gray-300 p-2">{item.description || "-"}</td>
                          <td className="border border-gray-300 p-2">{item.remark || "-"}</td>
                          <td className="border border-gray-300 p-2">
                            {item.quantity ?? item.qty} {showIdNumber ? (item.unit_name || item.unit_description || item.unit || "") : ""}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={showIdNumber ? 7 : 6} className="border border-gray-300 p-4 text-center text-gray-500">
                          No items found.
                        </td>
                      </tr>
                    )}
                    {items.length > 0 && (
                      <tr>
                        <td colSpan={showIdNumber ? 6 : 5} className="border border-gray-300 p-2 font-bold text-right">
                          Total
                        </td>
                        <td className="border border-gray-300 p-2 font-bold">
                          {items.reduce((sum, item) => sum + (Number(item.quantity ?? item.qty) || 0), 0)}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              ) : (
                <table className="w-full border-collapse border border-gray-300 text-sm text-left">
                  <thead>
                    <tr className="bg-gray-100 print:bg-transparent">
                      <th className="border border-gray-300 p-2">S.no</th>
                      <th className="border border-gray-300 p-2">Name of item</th>
                      <th className="border border-gray-300 p-2">Description of item in courier</th>
                      <th className="border border-gray-300 p-2">Items Attached</th>
                      <th className="border border-gray-300 p-2">Remark</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length > 0 ? (
                      items.map((item, index) => {
                        const itemName = [item.instrument_name || item.name || item.item_name, item.id_number || item.id_no || item.newidno || item.idno]
                          .filter(Boolean)
                          .join(" ");

                        // Form items attached string matching PHP's TRF package quantity & document flags
                        const attachedDetails = [
                          item.received_items || item.package_details || item.items_attached || (item.instrument === "Yes" ? "Instrument" : ""),
                          item.certificate === "Yes" || item.certificate === 1 ? "Certificate" : "",
                          item.invoice === "Yes" || item.invoice === 1 ? "Invoice" : ""
                        ]
                          .filter(Boolean)
                          .join(", ");

                        return (
                          <tr key={index}>
                            <td className="border border-gray-300 p-2">{index + 1}</td>
                            <td className="border border-gray-300 p-2">
                              <span>{itemName || "-"}</span>
                              {item.brn && (
                                <span>
                                  {". "}
                                  <b>BRN:</b> {item.brn}
                                </span>
                              )}
                            </td>
                            <td className="border border-gray-300 p-2">{item.description || "-"}</td>
                            <td className="border border-gray-300 p-2">
                              {attachedDetails || "-"}
                            </td>
                            <td className="border border-gray-300 p-2">{item.remark || "-"}</td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={5} className="border border-gray-300 p-4 text-center text-gray-500">
                          No items found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>

            {/* Remarks and Signatures */}
            <div className="text-sm">
              {dinDetails.remark && (
                <div className="mb-8 print:mb-2">
                  <span className="font-bold">Remark:</span> {dinDetails.remark}
                </div>
              )}

              <div className="mt-12 print:mt-6 text-left print:break-inside-avoid">
                <p className="font-bold mb-8 print:mb-2">
                  Regards<br />
                  For {companyInfo?.company?.name || "KAILTECH TEST & RESEARCH CENTRE PVT. LTD."}
                </p>

                {/* Only render authorised signature when status is approved (status == 1) */}
                {statusInt === 1 && (dinDetails.approved_by || dinDetails.approved_on) && (
                  <div className="mb-4 print:mb-2">
                    {dinDetails.approved_on && String(dinDetails.approved_on).includes("http") ? (
                      <img
                        src={dinDetails.approved_on}
                        alt="Digital Signature"
                        className="h-20 print:h-16 object-contain print:block"
                        style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}
                      />
                    ) : (
                      <div
                        className="text-xs italic text-gray-600 border border-gray-300 inline-block p-2 print:p-1 rounded print:border-gray-500"
                        style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}
                      >
                        Electronically signed by<br />
                        {dinDetails.approved_by}<br />
                        Date: {safeDate(dinDetails.approved_on)}
                      </div>
                    )}
                  </div>
                )}
                <p className="font-bold border-t border-black inline-block pt-1">Authorised Signatory</p>
              </div>
            </div>

          </div>
        </div>

      </div>
    </Page>
  );
}
