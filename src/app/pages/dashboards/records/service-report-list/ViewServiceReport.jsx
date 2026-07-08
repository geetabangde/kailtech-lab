import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import axios from "utils/axios";
import { toast } from "sonner";
import { Button } from "components/ui";
import { Page } from "components/shared/Page";

export default function ViewServiceReport() {
  const { id } = useParams();
  const navigate = useNavigate();
  const permissions = JSON.parse(localStorage.getItem("userPermissions") || "[]");

  const [loading, setLoading] = useState(true);
  const [printLoading, setPrintLoading] = useState(false);
  const [reportData, setReportData] = useState(null);

  // Permission Gating (Permission 108 required for Work Completion / Service Report)
  useEffect(() => {
    if (!permissions.includes(108)) {
      navigate("/dashboards");
    }
  }, [navigate, permissions]);

  // Fetch report details
  useEffect(() => {
    const fetchReportDetails = async () => {
      setLoading(true);
      try {
        // Try primary endpoint
        let response = await axios.get(`/records/get-service-report/${id}`);

        // Fallback 1: alternative endpoint
        if (!response.data || response.data.status === false) {
          response = await axios.get(`/records/view-service-report/${id}`);
        }

        const data = response.data?.data || response.data || {};
        setReportData(data);
      } catch (err) {
        console.error("Error fetching service report details:", err);
        // Fallback 2: fetch list and search on client side
        try {
          const listRes = await axios.get("/records/service-report-list");
          const found = (listRes.data?.data || listRes.data || []).find(
            (r) => String(r.id) === String(id)
          );
          if (found) {
            setReportData(found);
          } else {
            toast.error("Failed to load service report details.");
          }
        } catch (listErr) {
          console.error("Error with fallback list fetch:", listErr);
          toast.error("Failed to load service report details.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchReportDetails();
  }, [id]);

  const handlePrint = () => {
    setPrintLoading(true);
    setTimeout(() => {
      window.print();
      setPrintLoading(false);
    }, 500);
  };

  const formatDate = (dateStr) => {
    if (!dateStr || dateStr === "0000-00-00" || dateStr === "0000-00-00 00:00:00") {
      return "-";
    }
    try {
      const [year, month, day] = dateStr.split(" ")[0].split("-");
      return `${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <Page title="Loading Report">
        <div className="flex h-[60vh] items-center justify-center text-gray-500 gap-3">
          <svg className="animate-spin h-7 w-7 text-blue-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z" />
          </svg>
          Loading Service Report details...
        </div>
      </Page>
    );
  }

  if (!reportData) {
    return (
      <Page title="Error">
        <div className="flex h-[60vh] items-center justify-center text-red-600 font-semibold">
          Failed to load service report. Please check the URL or try again.
        </div>
      </Page>
    );
  }

  // Retrieve UUC Items
  const rawItems = reportData.items || reportData.servicereportitem || reportData.servicereportitems || [];
  const items = Array.isArray(rawItems) ? rawItems : [];

  // PHP Pagination replication:
  // First page shows at most 4 items. Subsequent pages show at most 15 items.
  const pages = [];
  let currentPage = [];
  items.forEach((item, index) => {
    currentPage.push(item);
    const isFirstPageLimit = pages.length === 0 && currentPage.length === 4;
    const isSubsequentPageLimit = pages.length > 0 && currentPage.length === 15;
    if (isFirstPageLimit || isSubsequentPageLimit || index === items.length - 1) {
      pages.push([...currentPage]);
      currentPage = [];
    }
  });

  // Ensure there is at least one page structure to show empty table if no items
  if (pages.length === 0) {
    pages.push([]);
  }

  return (
    <Page title="View Service Report">
      <style>
        {`
          @media print {
            .no-print { display: none !important; }
            .printable-area { 
              padding: 0;
              background: white;
            }
            .page-break {
              page-break-after: always;
            }
            body { 
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }
          }
        `}
      </style>

      <div className="max-w-4xl mx-auto p-4 sm:p-6 no-print">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800 dark:text-dark-50">
            Work Completion Report
          </h2>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-dark-600 dark:text-dark-200 dark:hover:bg-dark-800"
              onClick={() => navigate("/dashboards/records/service-report-list")}
            >
              Back to List
            </Button>
            <Button
              onClick={handlePrint}
              color="success"
              disabled={printLoading}
              className="font-semibold"
            >
              {printLoading ? "Preparing..." : "Download Service Report"}
            </Button>
          </div>
        </div>
      </div>

      <div className="printable-area max-w-4xl mx-auto bg-white border border-gray-300 shadow-sm p-8 print:p-0 print:border-0 print:shadow-none text-gray-800 text-xs md:text-sm">
        {pages.map((pageItems, pageIdx) => {
          const isLastPage = pageIdx === pages.length - 1;

          return (
            <div
              key={pageIdx}
              className={`flex flex-col min-h-screen justify-between ${!isLastPage ? "page-break mb-12 border-b border-dashed border-gray-400 pb-12 print:border-0 print:pb-0" : ""
                }`}
            >
              <div>
                {/* 1. Header (Only on Page 1 to save space, or on every page if desired. PHP shows it on Page 1) */}
                {pageIdx === 0 && (
                  <>
                    <div className="flex border border-gray-300 bg-white mb-6 p-4">
                      {/* Logo */}
                      <div className="w-1/4 flex flex-col justify-center">
                        <img
                          src="https://kailtech.thehostme.com/2025_05_07/kailtech_new/images/letterhead.jpg"
                          alt="Kailtech Logo"
                          className="h-10 mb-2 object-contain self-start"
                        />
                        <p className="font-bold text-xxs leading-tight text-gray-800">
                          Kailtech Test & Research Centre Pvt. Ltd.
                        </p>
                      </div>

                      {/* Accreditation */}
                      <div className="w-1/2 px-4 border-l border-gray-300 text-center flex flex-col justify-center gap-1">
                        <h2 className="text-sm font-extrabold uppercase tracking-wide text-gray-800">
                          Kailtech Test & Research Centre
                        </h2>
                        <p className="text-[10px] text-gray-600 leading-normal">
                          NABL Accredited (ISO/IEC/IS: 17025-2005), Bureau of Indian Standards (BIS) Recognized,<br />
                          ISO: 9001 Certified Laboratory<br />
                          C-10, Sector - A, Industrial Area, Indore - 452003 (M.P.)<br />
                          Ph: +91-731-4043322, Email: info@kailtech.com, Web: www.kailtech.com
                        </p>
                      </div>

                      {/* QF Code */}
                      <div className="w-1/4 border-l border-gray-300 flex items-center justify-end p-2 text-[10px] font-mono font-semibold text-gray-500">
                        KTRC/QF/0704/03/03
                      </div>
                    </div>

                    <div className="text-center font-bold text-sm md:text-base border-b border-gray-300 pb-2 mb-4 uppercase tracking-wider text-gray-800">
                      Work Completion Report
                    </div>

                    {/* Customer Info Table */}
                    <table className="w-full border border-gray-300 border-collapse text-xs mb-6 text-gray-800">
                      <tbody>
                        <tr className="border-b border-gray-300">
                          <td className="p-2 font-semibold bg-gray-50 w-1/4 border-r border-gray-300">Report no:</td>
                          <td className="p-2 w-1/4 border-r border-gray-300 font-mono">
                            {String(reportData.id).padStart(4, "0")}
                          </td>
                          <td className="p-2 font-semibold bg-gray-50 w-1/4 border-r border-gray-300">Date:</td>
                          <td className="p-2 w-1/4">
                            {formatDate(reportData.date)}
                          </td>
                        </tr>
                        <tr className="border-b border-gray-300">
                          <td className="p-2 font-semibold bg-gray-50 border-r border-gray-300">Attended By:</td>
                          <td className="p-2 border-r border-gray-300">
                            {reportData.attendedby_name || reportData.attendedby || "-"}
                          </td>
                          <td className="p-2 font-semibold bg-gray-50 border-r border-gray-300">Weekly off:</td>
                          <td className="p-2">Sunday</td>
                        </tr>
                        <tr className="border-b border-gray-300 align-top">
                          <td className="p-2 font-semibold bg-gray-50 border-r border-gray-300">Customer Name & Address</td>
                          <td className="p-2 border-r border-gray-300" colSpan={3}>
                            <div className="font-bold text-gray-900">{reportData.customername || "-"}</div>
                            <div className="text-gray-600 mt-1">{reportData.customeraddress || ""}</div>
                          </td>
                        </tr>
                        <tr className="border-b border-gray-300 align-top">
                          <td className="p-2 font-semibold bg-gray-50 border-r border-gray-300 text-gray-800">Contact Person</td>
                          <td className="p-2 border-r border-gray-300 text-gray-700">
                            {reportData.concernpersonname || "-"}
                          </td>
                          <td className="p-2 font-semibold bg-gray-50 border-r border-gray-300">Phone & Email</td>
                          <td className="p-2 text-gray-700">
                            <div>Phone: {reportData.concernpersonmobile || "-"}</div>
                            <div>Email: {reportData.concernpersonemail || "-"}</div>
                          </td>
                        </tr>
                        <tr className="align-top">
                          <td className="p-2 font-semibold bg-gray-50 border-r border-gray-300">Spare Used/Replaced</td>
                          <td className="p-2 border-r border-gray-300 text-gray-700 whitespace-pre-wrap">
                            {reportData.spareused || "None"}
                          </td>
                          <td className="p-2 font-semibold bg-gray-50 border-r border-gray-300">Spare Recommended</td>
                          <td className="p-2 text-gray-700 whitespace-pre-wrap">
                            {reportData.sparerecommended || "None"}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </>
                )}

                {/* Equipment Details Table */}
                <div className="mb-4">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-gray-800 mb-2 border-b border-gray-200 pb-1">
                    Equipment Details
                  </h3>
                  <table className="w-full border border-gray-300 border-collapse text-left text-xs text-gray-800">
                    <thead>
                      <tr className="bg-gray-100 font-semibold border-b border-gray-300">
                        <th className="p-2 border-r border-gray-300 text-center w-12">Sr. No</th>
                        <th className="p-2 border-r border-gray-300">Equipment Name</th>
                        <th className="p-2 border-r border-gray-300">Sr.No. / I.D</th>
                        <th className="p-2 border-r border-gray-300">Make</th>
                        <th className="p-2 border-r border-gray-300">Model</th>
                        <th className="p-2">Location</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageItems.length > 0 ? (
                        pageItems.map((item, itemIdx) => {
                          // Calculate cumulative index:
                          // Page 1 starts at 0. Page 2 starts at 4. Subsequent pages start at 4 + 15 * (pageIdx - 1)
                          const cumulativeIdx = pageIdx === 0 ? itemIdx : 4 + 15 * (pageIdx - 1) + itemIdx;

                          return (
                            <tr key={itemIdx} className="border-b border-gray-200 hover:bg-gray-50/50">
                              <td className="p-2 border-r border-gray-300 text-center font-medium">
                                {cumulativeIdx + 1}
                              </td>
                              <td className="p-2 border-r border-gray-300 font-medium">
                                {item.name || "-"}
                              </td>
                              <td className="p-2 border-r border-gray-300 font-mono">
                                {[item.idno, item.serialno].filter(Boolean).join(" / ") || "-"}
                              </td>
                              <td className="p-2 border-r border-gray-300">
                                {item.make || "-"}
                              </td>
                              <td className="p-2 border-r border-gray-300">
                                {item.model || "-"}
                              </td>
                              <td className="p-2">
                                {item.location || "-"}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={6} className="p-4 text-center text-gray-400 italic">
                            No equipment details found on this page.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* 2. Engineer Remarks & Customer satisfaction signatures (Only on the Last Page) */}
                {isLastPage && (
                  <div className="space-y-4 mt-6">
                    {/* Engineer Remarks */}
                    <div className="border border-gray-300 rounded p-4 bg-gray-50/30">
                      <h4 className="font-semibold text-xs text-gray-700 mb-2">
                        Service rendered & Engineer’s Remarks:
                      </h4>
                      <p className="text-xs text-gray-800 min-h-12 whitespace-pre-wrap leading-relaxed">
                        {reportData.enggremark || "No remarks entered."}
                      </p>
                      <div className="text-right mt-12 font-semibold text-xs text-gray-700">
                        Engineer’s Signature
                      </div>
                    </div>

                    {/* Customer Remarks */}
                    <div className="border border-gray-300 rounded p-4 bg-gray-50/30">
                      <h4 className="font-semibold text-xs text-gray-700 mb-2">
                        Customer’s Remarks:
                      </h4>
                      <p className="text-xxs text-gray-500 italic mb-2">
                        The equipment has been commissioned/repaired/serviced/calibrated to my/our satisfaction
                      </p>
                      <p className="text-xs text-gray-800 min-h-12 whitespace-pre-wrap leading-relaxed">
                        {reportData.customeremark || "No remarks entered."}
                      </p>
                      <div className="text-right mt-12 font-semibold text-xs text-gray-700">
                        Customer’s Signature
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Page Footer (Page number / pagination info) */}
              <div className="flex items-center justify-between text-[10px] text-gray-400 font-mono mt-6 border-t border-gray-200/50 pt-2">
                <span>Work Completion Report</span>
                <span>
                  Page no. {pageIdx + 1} of {pages.length}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </Page>
  );
}
