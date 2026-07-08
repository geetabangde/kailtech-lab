// Import Dependencies
import { useState, useEffect, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import axios from "utils/axios";
import { toast } from "react-hot-toast";

// Local Imports
import { 
  Card, 
  Button
} from "components/ui";
import { Page } from "components/shared/Page";

// ----------------------------------------------------------------------

export default function ViewCheckList() {
  const [searchParams] = useSearchParams();
  const gatepassNo = searchParams.get("hakuna");

  const [loading, setLoading] = useState(true);
  const [record, setRecord] = useState(null);
  const [masterChecklist, setMasterChecklist] = useState([]);
  const [generalChecklist, setGeneralChecklist] = useState([]);
  const [companyInfo, setCompanyInfo] = useState(null);

  const fetchData = useCallback(async () => {
    if (!gatepassNo) return;
    try {
      setLoading(true);
      const [response, companyResponse] = await Promise.all([
        axios.get("/inventory/view-check-list", {
          params: { gatepassnumber: gatepassNo }
        }),
        axios.get("get-company-info").catch((err) => {
          console.error("Failed to fetch company info", err);
          return { data: { status: false } };
        })
      ]);

      if (companyResponse.data.status) {
        setCompanyInfo(companyResponse.data.data);
      }

      if (response.data.status) {
        const checklistData = response.data.data || {};
        setRecord(checklistData);
        setMasterChecklist(checklistData.calibration_checklist || []);
        setGeneralChecklist(checklistData.general_checklist || []);
      } else {
        toast.error(response.data.message || "Failed to fetch checklist data");
      }
    } catch (err) {
      console.error("Error fetching checklist data:", err);
      toast.error("An error occurred while fetching data");
    } finally {
      setLoading(false);
    }
  }, [gatepassNo]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return <Page title="Check List"><div className="p-10 text-center text-gray-500">Loading checklist data...</div></Page>;
  }

  if (!record) {
    return <Page title="Check List"><div className="p-10 text-center text-red-500">Checklist record not found</div></Page>;
  }

  return (
    <Page title={`Checklist ${gatepassNo}`}>
      <div className="transition-content w-full pb-5 space-y-6">
        <Card className="p-4 sm:p-5 border-none shadow-soft dark:bg-dark-700">
          <div className="flex items-center justify-between border-b border-gray-200 pb-3 dark:border-dark-500">
            <h3 className="text-sm font-normal text-gray-800 dark:text-dark-100">
              Checklist {gatepassNo}
            </h3>
            <Button
              component={Link}
              to="/dashboards/inventory/issue-return"
              color="info"
              variant="filled"
              size="sm"
            >
              {"<< Issued Item List"}
            </Button>
          </div>

          <div className="mt-3 space-y-4 overflow-x-auto">
            {/* Header Document Table */}
            <table className="w-full border-collapse border border-gray-300 dark:border-dark-500 text-xs">
              <tbody>
                <tr>
                  <td rowSpan="6" className="border border-gray-300 p-2 pt-1.5 pr-2 pl-1.5 align-top w-[25%] bg-white dark:bg-dark-800 dark:border-dark-500">
                    <div className="flex flex-col justify-start w-full">
                      {companyInfo?.branding?.logo ? (
                        <img src={companyInfo.branding.logo} alt={companyInfo.branding.site_logo_alt || "Company Logo"} className="h-12 w-auto object-contain mb-1 self-start" />
                      ) : (
                        <div className="h-12 w-28 bg-yellow-400 rounded flex items-center justify-center font-bold text-white uppercase shadow-inner relative overflow-hidden mb-1 self-start">
                          <span className="z-10 text-2xl tracking-widest lowercase italic">ktrc</span>
                        </div>
                      )}
                      <div className="font-bold text-[8px] leading-tight text-black text-right self-end mt-1">
                        {companyInfo?.company?.name || "Kailtech Test And Research Centre Pvt. Ltd."}
                      </div>
                    </div>
                  </td>
                  <th rowSpan="6" className="border border-gray-300 p-3 align-top text-center text-xs font-black dark:border-dark-500 w-[50%]">
                    Check List For Site Testing / Calibration
                  </th>
                  <th className="border border-gray-300 p-1.5 pl-3 text-left bg-white dark:bg-dark-800 dark:border-dark-500 w-[15%] text-[10px] font-bold">QF. No.</th>
                  <td className="border border-gray-300 p-1.5 pl-3 dark:border-dark-500 w-[15%] text-[10px]">{record.qf_no}</td>
                </tr>
                <tr>
                  <th className="border border-gray-300 p-1.5 pl-3 text-left bg-white dark:bg-dark-800 dark:border-dark-500 text-[10px] font-bold">Issue No.</th>
                  <td className="border border-gray-300 p-1.5 pl-3 dark:border-dark-500 text-[10px]">{record.issue_no}</td>
                </tr>
                <tr>
                  <th className="border border-gray-300 p-1.5 pl-3 text-left bg-white dark:bg-dark-800 dark:border-dark-500 text-[10px] font-bold">Issue Date</th>
                  <td className="border border-gray-300 p-1.5 pl-3 dark:border-dark-500 text-[10px]">{record.issue_date}</td>
                </tr>
                <tr>
                  <th className="border border-gray-300 p-1.5 pl-3 text-left bg-white dark:bg-dark-800 dark:border-dark-500 text-[10px] font-bold">Revision No.</th>
                  <td className="border border-gray-300 p-1.5 pl-3 dark:border-dark-500 text-[10px]">{record.revision_no}</td>
                </tr>
                <tr>
                  <th className="border border-gray-300 p-1.5 pl-3 text-left bg-white dark:bg-dark-800 dark:border-dark-500 text-[10px] font-bold">Revision Date</th>
                  <td className="border border-gray-300 p-1.5 pl-3 dark:border-dark-500 text-[10px]">{record.revision_date}</td>
                </tr>
                <tr>
                  <th className="border border-gray-300 p-1.5 pl-3 text-left bg-white dark:bg-dark-800 dark:border-dark-500 text-[10px] font-bold">Page</th>
                  <td className="border border-gray-300 p-1.5 pl-3 dark:border-dark-500 text-[10px]">{record.page}</td>
                </tr>
              </tbody>
            </table>

            {/* Site Info */}
            <div className="grid grid-cols-1 py-1 text-xs md:grid-cols-3">
              <div>Date:- {record.date}</div>
              <div className="md:col-span-3">Site Name:- {record.site_name}</div>
              <div className="md:col-span-3">Site Address:- <span className="normal-case">{record.site_address}</span></div>
            </div>

            {/* Master Equipment Checklist Section */}
            {masterChecklist.length > 0 && (
              <div className="space-y-3">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300 dark:border-dark-500 text-[10px] font-bold text-gray-700">
                    <thead>
                      <tr>
                        <th className="border border-gray-300 dark:border-dark-500 p-2 text-center w-8 bg-white dark:bg-dark-800">Sr</th>
                        <th className="border border-gray-300 dark:border-dark-500 p-2 text-left min-w-44 bg-white dark:bg-dark-800">Master Equipment</th>
                        <th className="border border-gray-300 dark:border-dark-500 p-2 text-left min-w-24 bg-white dark:bg-dark-800">Discipline</th>
                        <th className="border border-gray-300 dark:border-dark-500 p-2 text-left min-w-44 bg-white dark:bg-dark-800">Artifact Verification</th>
                        <th className="border border-gray-300 dark:border-dark-500 p-2 text-center min-w-24 bg-white dark:bg-dark-800">General Check</th>
                        <th className="border border-gray-300 dark:border-dark-500 p-2 text-center bg-white dark:bg-dark-800">Unit</th>
                        <th className="border border-gray-300 dark:border-dark-500 p-2 text-center bg-white dark:bg-dark-800">Check Point</th>
                        <th className="border border-gray-300 dark:border-dark-500 p-2 text-center bg-white dark:bg-dark-800">Before Moving</th>
                        <th className="border border-gray-300 dark:border-dark-500 p-2 text-center bg-white dark:bg-dark-800">After Moving</th>
                        <th className="border border-gray-300 dark:border-dark-500 p-2 text-center bg-white dark:bg-dark-800">Deviation</th>
                        <th className="border border-gray-300 dark:border-dark-500 p-2 text-center bg-white dark:bg-dark-800">Acceptance</th>
                        <th className="border border-gray-300 dark:border-dark-500 p-2 text-center bg-white dark:bg-dark-800">Result</th>
                        <th className="border border-gray-300 dark:border-dark-500 p-2 text-left bg-white dark:bg-dark-800">Remarks</th>
                        <th className="border border-gray-300 dark:border-dark-500 p-2 text-left min-w-36 bg-white dark:bg-dark-800">Return Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {masterChecklist.map((item, index) => (
                        <tr key={index} className="font-normal">
                          <td className="border border-gray-300 dark:border-dark-500 p-2 text-center">{index + 1}</td>
                          <td className="border border-gray-300 dark:border-dark-500 p-2">{item.master_equipment}</td>
                          <td className="border border-gray-300 dark:border-dark-500 p-2">{item.discipline}</td>
                          <td className="border border-gray-300 dark:border-dark-500 p-2">{item.artifact_for_verification}</td>
                          <td className="border border-gray-300 dark:border-dark-500 p-2 text-center">{item.general_check}</td>
                          <td className="border border-gray-300 dark:border-dark-500 p-2 text-center">{item.unit}</td>
                          <td className="border border-gray-300 dark:border-dark-500 p-2 text-center">{item.check_point}</td>
                          <td className="border border-gray-300 dark:border-dark-500 p-2 text-center">{item.check_point_before_moving}</td>
                          <td className="border border-gray-300 dark:border-dark-500 p-2 text-center">{item.check_point_after_moving}</td>
                          <td className="border border-gray-300 dark:border-dark-500 p-2 text-center">{item.deviation}</td>
                          <td className="border border-gray-300 dark:border-dark-500 p-2 text-center">{item.acceptance}</td>
                          <td className="border border-gray-300 dark:border-dark-500 p-2 text-center font-bold text-gray-700">{item.result}</td>
                          <td className="border border-gray-300 dark:border-dark-500 p-2">{item.remarks}</td>
                          <td className="border border-gray-300 dark:border-dark-500 p-2">
                            {item.return_details ? (
                              <div className="space-y-0.5">
                                <div className="font-bold text-gray-700">{item.return_details.returned_by}</div>
                                <div className="text-[9px]">{item.return_details.returned_on}</div>
                                <div className="text-[9px] italic">{item.return_remarks}</div>
                              </div>
                            ) : (
                              <span className="italic text-gray-400">Pending Return</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* General Accessories Checklist Section */}
            {generalChecklist.length > 0 && (
              <div className="space-y-3">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300 dark:border-dark-500 text-[10px] font-bold text-gray-700">
                    <thead>
                      <tr>
                        <th className="border border-gray-300 dark:border-dark-500 p-2 text-center w-10 bg-white dark:bg-dark-800">Sr</th>
                        <th className="border border-gray-300 dark:border-dark-500 p-2 text-left min-w-44 bg-white dark:bg-dark-800">Master Equipment</th>
                        <th className="border border-gray-300 dark:border-dark-500 p-2 text-left bg-white dark:bg-dark-800">Accessories Name</th>
                        <th className="border border-gray-300 dark:border-dark-500 p-2 text-center w-16 bg-white dark:bg-dark-800">Qty</th>
                        <th className="border border-gray-300 dark:border-dark-500 p-2 text-left min-w-40 bg-white dark:bg-dark-800">Issue Condition</th>
                        <th className="border border-gray-300 dark:border-dark-500 p-2 text-left bg-white dark:bg-dark-800">Issue Remarks</th>
                        <th className="border border-gray-300 dark:border-dark-500 p-2 text-left min-w-36 bg-white dark:bg-dark-800">Return Condition</th>
                        <th className="border border-gray-300 dark:border-dark-500 p-2 text-left bg-white dark:bg-dark-800">Return Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {generalChecklist.map((item, index) => (
                        <tr key={index} className="font-normal text-gray-600">
                          <td className="border border-gray-300 dark:border-dark-500 p-2 text-center">{index + 1}</td>
                          <td className="border border-gray-300 dark:border-dark-500 p-2">{item.master_equipment}</td>
                          <td className="border border-gray-300 dark:border-dark-500 p-2">{item.accessories_name}</td>
                          <td className="border border-gray-300 dark:border-dark-500 p-2 text-center">{item.quantity}</td>
                          <td className="border border-gray-300 dark:border-dark-500 p-2">{item.condition}</td>
                          <td className="border border-gray-300 dark:border-dark-500 p-2">{item.remarks}</td>
                          <td className="border border-gray-300 dark:border-dark-500 p-2">{item.return_condition}</td>
                          <td className="border border-gray-300 dark:border-dark-500 p-2">{item.return_remarks}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Signature Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center pt-10 border-t border-gray-100 dark:border-dark-500 gap-6">
              <div className="flex-1 text-sm italic text-gray-500 dark:text-dark-300">
                Generated automatically on {new Date().toLocaleDateString()}
              </div>
              <div className="w-64 p-4 border border-dashed border-gray-300 dark:border-dark-500 rounded-lg text-sm bg-gray-50 dark:bg-dark-800/50">
                <div className="font-bold border-b pb-1 mb-2 uppercase text-xs">Checked By</div>
                <div className="space-y-2">
                  <div>Name: <span className="text-gray-400">________________</span></div>
                  <div>Sign: <span className="text-gray-400">________________</span></div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </Page>
  );
}
