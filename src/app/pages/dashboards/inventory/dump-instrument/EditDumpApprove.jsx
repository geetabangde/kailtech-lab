// Import Dependencies
import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import axios from "utils/axios";
import { toast } from "react-hot-toast";

// Local Imports
import { 
  Card, 
  Button
} from "components/ui";
import { Page } from "components/shared/Page";

// ----------------------------------------------------------------------

export default function EditDumpApprove() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dumpId = searchParams.get("hakuna");
  const status = searchParams.get("matata");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dumpData, setDumpData] = useState(null);
  const [instrument, setInstrument] = useState(null);
  const [history, setHistory] = useState([]);
  const [companyInfo, setCompanyInfo] = useState(null);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const parts = dateString.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateString;
  };

  const fetchData = useCallback(async () => {
    if (!dumpId) return;
    try {
      setLoading(true);
      const [response, companyResponse] = await Promise.all([
        axios.get("inventory/view-dump-instrument", {
          params: { dumpid: dumpId }
        }),
        axios.get("get-company-info").catch(e => {
          console.error("Failed to fetch company info", e);
          return { data: { status: false } };
        })
      ]);

      if (companyResponse.data.status) {
        setCompanyInfo(companyResponse.data.data);
      }

      if (response.data.status) {
        setDumpData(response.data.dump_details);
        setInstrument(response.data.instrument_details);
        setHistory(response.data.calibration_history || []);
      } else {
        toast.error(response.data.message || "Failed to fetch data");
      }
    } catch (err) {
      console.error("Error fetching dump approve data:", err);
      toast.error("An error occurred while fetching data");
    } finally {
      setLoading(false);
    }
  }, [dumpId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const payload = {
        id: Number(dumpId),
        mminstid: dumpData?.mminstid ? Number(dumpData.mminstid) : undefined,
        mlid: dumpData?.materiallocation_id ? Number(dumpData.materiallocation_id) : undefined,
        typeofuse: dumpData?.typeofuse ? Number(dumpData.typeofuse) : undefined,
        dumpqty: dumpData?.dumpqty ? Number(dumpData.dumpqty) : undefined,
        status: Number(status),
      };
      
      const response = await axios.post("inventory/dump-approve-reject", payload);
      if (response.data.status) {
        toast.success(response.data.message || "Action successful");
        navigate("/dashboards/inventory/dump-instrument");
      } else {
        toast.error(response.data.message || "Action failed");
      }
    } catch {
      toast.error("An error occurred during submission");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Page title="Dump Approval"><div className="p-10 text-center">Loading...</div></Page>;
  }

  if (!instrument) {
    return <Page title="Dump Approval"><div className="p-10 text-center text-red-500">Instrument data not found</div></Page>;
  }

  return (
    <Page title="Dump Approval">
      <div className="transition-content w-full pb-5 space-y-6">
        <Card className="p-4 sm:p-5 border-none shadow-soft dark:bg-dark-700">
          <div className="flex items-center justify-between border-b border-gray-200 pb-4 dark:border-dark-500">
            <h3 className="text-lg font-bold text-gray-800 dark:text-dark-100 uppercase">
              Instrument History
            </h3>
            <Button
              component={Link}
              to="/dashboards/inventory/dump-instrument"
              color="warning"
              variant="solid"
              size="sm"
            >
              {"<< Back To MM Instrument List"}
            </Button>
          </div>

          <div className="mt-6 space-y-8 overflow-x-auto">
            <div className="flex flex-col gap-2">
              {/* Document Header Table */}
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
                    Instrument History
                  </th>
                  <th className="border border-gray-300 p-1.5 pl-3 text-left bg-white dark:bg-dark-800 dark:border-dark-500 w-[15%] text-[10px] font-bold">QF. No.</th>
                  <td className="border border-gray-300 p-1.5 pl-3 dark:border-dark-500 w-[15%] text-[10px]">LIMS/QF/0604/01</td>
                </tr>
                <tr>
                  <th className="border border-gray-300 p-1.5 pl-3 text-left bg-white dark:bg-dark-800 dark:border-dark-500 text-[10px] font-bold">Issue No.</th>
                  <td className="border border-gray-300 p-1.5 pl-3 dark:border-dark-500 text-[10px]"></td>
                </tr>
                <tr>
                  <th className="border border-gray-300 p-1.5 pl-3 text-left bg-white dark:bg-dark-800 dark:border-dark-500 text-[10px] font-bold">Issue Date</th>
                  <td className="border border-gray-300 p-1.5 pl-3 dark:border-dark-500 text-[10px]"></td>
                </tr>
                <tr>
                  <th className="border border-gray-300 p-1.5 pl-3 text-left bg-white dark:bg-dark-800 dark:border-dark-500 text-[10px] font-bold">Revision No.</th>
                  <td className="border border-gray-300 p-1.5 pl-3 dark:border-dark-500 text-[10px]"></td>
                </tr>
                <tr>
                  <th className="border border-gray-300 p-1.5 pl-3 text-left bg-white dark:bg-dark-800 dark:border-dark-500 text-[10px] font-bold">Revision Date</th>
                  <td className="border border-gray-300 p-1.5 pl-3 dark:border-dark-500 text-[10px]"></td>
                </tr>
                <tr>
                  <th className="border border-gray-300 p-1.5 pl-3 text-left bg-white dark:bg-dark-800 dark:border-dark-500 text-[10px] font-bold">Page</th>
                  <td className="border border-gray-300 p-1.5 pl-3 dark:border-dark-500 text-[10px]">1 of 1</td>
                </tr>
              </tbody>
            </table>

            {/* Department Info */}
            <div className="grid grid-cols-2 gap-4 py-1 border-gray-200 dark:border-dark-500 font-bold text-xs uppercase">
              <div>DEPARTMENT:-{instrument.department}</div>
              <div>EQPT ID:-{instrument.equipment_id}</div>
            </div>

            {/* Instrument Details Table */}
            <table className="w-full border-collapse border border-gray-300 dark:border-dark-500 text-xs font-bold text-gray-700">
              <tbody>
                <tr className="border-b border-gray-300 dark:border-dark-500">
                  <td className="p-3 text-left w-[25%] border-r border-gray-300 dark:border-dark-500">Name of instrument :</td>
                  <td className="p-3 border-r border-gray-300 font-normal dark:border-dark-500 w-[25%]">{instrument.name}</td>
                  <td rowSpan="3" className="p-3 align-top text-left w-[25%] border-r border-gray-300 dark:border-dark-500">Range :</td>
                  <td rowSpan="3" className="p-3 align-top font-normal text-gray-600">{instrument.range}</td>
                </tr>
                <tr className="border-b border-gray-300 dark:border-dark-500">
                  <td className="p-3 text-left border-r border-gray-300 dark:border-dark-500">Make :</td>
                  <td className="p-3 border-r border-gray-300 font-normal dark:border-dark-500">{instrument.make}</td>
                </tr>
                <tr className="border-b border-gray-300 dark:border-dark-500">
                  <td className="p-3 text-left border-r border-gray-300 dark:border-dark-500">Model :</td>
                  <td className="p-3 border-r border-gray-300 font-normal dark:border-dark-500">{instrument.model}</td>
                </tr>
                <tr className="border-b border-gray-300 dark:border-dark-500">
                  <td className="p-3 text-left border-r border-gray-300 dark:border-dark-500">S.No. :</td>
                  <td className="p-3 border-r border-gray-300 font-normal dark:border-dark-500">{instrument.serial_no}</td>
                  <td rowSpan="3" className="p-3 align-top text-left border-r border-gray-300 dark:border-dark-500">L.C. :</td>
                  <td rowSpan="3" className="p-3 align-top font-normal text-gray-600">{instrument.least_count}</td>
                </tr>
                <tr className="border-b border-gray-300 dark:border-dark-500">
                  <td className="p-3 text-left border-r border-gray-300 dark:border-dark-500">Date of installation :</td>
                  <td className="p-3 border-r border-gray-300 font-normal dark:border-dark-500">{formatDate(instrument.installation_date)}</td>
                </tr>
                <tr className="border-b border-gray-300 dark:border-dark-500">
                  <td className="p-3 text-left border-r border-gray-300 dark:border-dark-500">Location of Equipment :</td>
                  <td className="p-3 border-r border-gray-300 font-normal dark:border-dark-500">{instrument.location}</td>
                </tr>
                <tr className="border-b border-gray-300 dark:border-dark-500">
                  <td className="p-3 align-top text-left border-r border-gray-300 dark:border-dark-500">
                    Name & Address of service provider :
                    <br/><br/>
                    Name of service engineer :
                  </td>
                  <td className="p-3 align-top border-r border-gray-300 font-normal dark:border-dark-500">{instrument.manufacturer}</td>
                  <td className="p-3 align-top text-left border-r border-gray-300 dark:border-dark-500">Accuracy :</td>
                  <td className="p-3 align-top font-normal"></td>
                </tr>
                <tr>
                  <td className="p-3 text-left border-r border-gray-300 dark:border-dark-500">SOP / WI Reference :</td>
                  <td className="p-3 border-r border-gray-300 font-normal dark:border-dark-500"></td>
                  <td className="p-3 text-left border-r border-gray-300 dark:border-dark-500">Equipment Conforms Specified Requirement</td>
                  <td className="p-3 font-normal text-gray-600">Yes/No</td>
                </tr>
              </tbody>
            </table>
            </div>

            {/* Service Codes */}
            <div className="w-full">
              <table className="w-full border-collapse border border-gray-300 dark:border-dark-500 text-xs font-bold text-gray-700">
                <thead>
                  <tr>
                    <th className="bg-white dark:bg-dark-800 border border-gray-300 dark:border-dark-500 w-[25%] p-3 text-left">CODE</th>
                    <th className="bg-white dark:bg-dark-800 border border-gray-300 dark:border-dark-500 p-3 text-left">TYPE OF SERVICE</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td className="border border-gray-300 dark:border-dark-500 p-3 font-normal text-gray-600">1</td><td className="border border-gray-300 dark:border-dark-500 p-3 font-normal text-gray-600">Maintenance</td></tr>
                  <tr><td className="border border-gray-300 dark:border-dark-500 p-3 font-normal text-gray-600">2</td><td className="border border-gray-300 dark:border-dark-500 p-3 font-normal text-gray-600">Calibration</td></tr>
                  <tr><td className="border border-gray-300 dark:border-dark-500 p-3 font-normal text-gray-600">3</td><td className="border border-gray-300 dark:border-dark-500 p-3 font-normal text-gray-600">Repair/Modification</td></tr>
                  <tr><td className="border border-gray-300 dark:border-dark-500 p-3 font-normal text-gray-600">4</td><td className="border border-gray-300 dark:border-dark-500 p-3 font-normal text-gray-600">Out of order</td></tr>
                </tbody>
              </table>
            </div>

            {/* Validity History Table */}
            <table className="w-full border-collapse border border-gray-300 dark:border-dark-500 text-[10px] font-bold text-gray-700 mt-8">
              <thead>
                <tr className="leading-tight bg-white dark:bg-dark-800">
                  <th className="border border-gray-300 dark:border-dark-500 p-2 text-left">CODE</th>
                  <th className="border border-gray-300 dark:border-dark-500 p-2 text-left">IMPLEMENT DATE</th>
                  <th className="border border-gray-300 dark:border-dark-500 p-2 text-left">NEXT DUE DATE</th>
                  <th className="border border-gray-300 dark:border-dark-500 p-2 text-left">RESULT OF CALIBRATION {`{Certificate No.}`}</th>
                  <th className="border border-gray-300 dark:border-dark-500 p-2 text-left">ADJUSTMENTS, IF ANY (YES/NO)</th>
                  <th className="border border-gray-300 dark:border-dark-500 p-2 text-left">MEETS ACCEPTANCE CRITERIA {`{As per Calibration Certificate Review LIMS/QF/0604/01/06}`} (YES/NO)</th>
                  <th className="border border-gray-300 dark:border-dark-500 p-2 text-left">SIGNED BY</th>
                  <th className="border border-gray-300 dark:border-dark-500 p-2 text-left">REMARKS</th>
                </tr>
              </thead>
              <tbody>
                {history.length > 0 ? history.map((item, index) => (
                  <tr key={index} className="text-[11px] font-normal text-gray-600">
                    <td className="border border-gray-300 dark:border-dark-500 p-2 text-center">2</td>
                    <td className="border border-gray-300 dark:border-dark-500 p-2">{formatDate(item.startdate)}</td>
                    <td className="border border-gray-300 dark:border-dark-500 p-2">{formatDate(item.enddate)}</td>
                    <td className="border border-gray-300 dark:border-dark-500 p-2">{item.certificateno}</td>
                    <td className="border border-gray-300 dark:border-dark-500 p-2">
                      {item.adjusment}
                      {item.adjustmentremark && <div className="text-[10px] text-gray-500 mt-1 italic">{item.adjustmentremark}</div>}
                    </td>
                    <td className="border border-gray-300 dark:border-dark-500 p-2 text-center">{item.meetacceptance}</td>
                    <td className="border border-gray-300 dark:border-dark-500 p-2">{item.added_by_name}</td>
                    <td className="border border-gray-300 dark:border-dark-500 p-2">{item.remark}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="8" className="border border-gray-300 dark:border-dark-500 p-2 text-center py-8 italic font-normal">No history records found</td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Approval Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center pt-10 border-t border-gray-100 dark:border-dark-500 gap-6">
              <div className="flex-1 text-sm italic text-gray-500 dark:text-dark-300">
                Generated automatically on {new Date().toLocaleDateString()}
              </div>
              <div className="w-64 p-4 border border-dashed border-gray-300 dark:border-dark-500 rounded-lg text-sm bg-gray-50 dark:bg-dark-800/50">
                <div className="font-bold border-b pb-1 mb-2 uppercase text-xs">Approved by DTM</div>
                <div className="space-y-2">
                  <div>Name: <span className="text-gray-400">________________</span></div>
                  <div>Sign: <span className="text-gray-400">________________</span></div>
                </div>
              </div>
            </div>

            {/* Submission Form */}
            <div className="pt-6 pb-2">
              <form onSubmit={handleSubmit}>
                <Button
                  type="submit"
                  color="primary"
                  variant="filled"
                  loading={submitting}
                >
                  Submit
                </Button>
              </form>
            </div>
          </div>
        </Card>
      </div>
    </Page>
  );
}
