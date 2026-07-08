import { useParams, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { Page } from "components/shared/Page";
import { Button } from "components/ui";
import axios from "utils/axios";
import { toast } from "sonner";

// PHP: permissions helper
function usePermissions() {
  const p = localStorage.getItem("userPermissions");
  try {
    return JSON.parse(p) || [];
  } catch {
    return p?.split(",").map(Number) || [];
  }
}

// Format date helper matching PHP date formats
function formatDate(dateStr, format = "d/m/Y") {
  if (!dateStr || dateStr === "0000-00-00" || dateStr === "0000-00-00 00:00:00") {
    return "";
  }
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    if (format === "d/m/Y") {
      return `${day}/${month}/${year}`;
    }
    return `${year}-${month}-${day}`;
  } catch {
    return dateStr;
  }
}

export default function ViewSRF() {
  const { id } = useParams();
  const navigate = useNavigate();
  const permissions = usePermissions();

  const [loading, setLoading] = useState(false);
  const [printLoading, setPrintLoading] = useState(false);
  const [entryData, setEntryData] = useState(null);

  useEffect(() => {
    const fetchEntry = async () => {
      setLoading(true);
      try {
        // Fetch using the inward entry CRF endpoint since this matches Calibration Request Form data
        const response = await axios.get(`/calibrationprocess/view-inward-entry-crf/${id}`);
        if (response.data.status === true) {
          setEntryData(response.data.data);
        } else {
          toast.error("Failed to load data.");
        }
      } catch (err) {
        console.error(err);
        toast.error("Something went wrong while fetching details.");
      } finally {
        setLoading(false);
      }
    };
    fetchEntry();
  }, [id]);

  const handlePrint = () => {
    setPrintLoading(true);
    setTimeout(() => {
      window.print();
      setPrintLoading(false);
    }, 500);
  };

  if (loading) {
    return (
      <Page title="CRF Loading">
        <div className="flex h-[60vh] items-center justify-center text-gray-500 gap-3">
          <svg className="animate-spin h-7 w-7 text-blue-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z" />
          </svg>
          Loading Calibration Request Form details...
        </div>
      </Page>
    );
  }

  if (!entryData) return null;

  const { inward = {}, technical = {}, quotation = {}, items = [], signature = {} } = entryData;

  const isBillingSame = inward?.billingname === inward?.customername && inward?.billingaddress === inward?.customer_address;

  return (
    <Page title="View Calibration Request Form">
      <div className="p-6 max-w-6xl mx-auto">
        {/* Top Control Bar (Hidden on Print) */}
        <div className="flex items-center justify-between mb-6 no-print">
          <h2 className="text-xl font-bold text-gray-800 dark:text-dark-50">
            View Calibration Request Form (CRF)
          </h2>
          <Button
            variant="outline"
            className="border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-dark-600 dark:text-dark-200 dark:hover:bg-dark-800"
            onClick={() => navigate(-1)}
          >
            Go Back
          </Button>
        </div>

        {/* Printable Paper Container */}
        <div className="printable-area bg-white text-gray-900 border border-gray-200 shadow-md p-8 print:p-0 print:border-0 print:shadow-none">
          
          {/* Format Headers */}
          <div className="flex border border-gray-300 mb-6">
            <div className="w-1/3 p-4 flex flex-col justify-center">
              <img
                src="https://kailtech.thehostme.com/2025_05_07/kailtech_new/images/letterhead.jpg"
                alt="Logo"
                className="h-12 mb-2 object-contain self-start"
              />
              <p className="font-bold text-xs leading-tight">
                Kailtech Test & Research Centre Pvt. Ltd.
              </p>
            </div>
            <div className="w-1/3 p-4 border-l border-gray-300 flex items-center justify-center">
              <h2 className="text-sm font-extrabold uppercase text-center tracking-wider text-gray-800">
                CALIBRATION REQUEST FORM
              </h2>
            </div>
            <div className="w-1/3 p-0 border-l border-gray-300">
              <table className="w-full h-full text-xxs border-collapse">
                <tbody>
                  {[
                    ["Q.F. No.", "KTRCQF/0701/03"],
                    ["Issue No.", "01"],
                    ["Issue Date", "03/10/2019"],
                    ["Revision No.", "2"],
                    ["Revision Date", "26/06/2023"],
                    ["Page", "1 of 1"],
                  ].map(([label, value], idx) => (
                    <tr key={label} className={idx < 5 ? "border-b border-gray-300" : ""}>
                      <td className="p-1 font-semibold border-r border-gray-300 w-1/2 bg-gray-50">{label}</td>
                      <td className="p-1 px-2">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Customer & Details Table */}
          <table className="w-full border border-gray-300 text-xs mb-6 border-collapse">
            <tbody>
              {/* Row 1: Name & Address */}
              <tr className="border-b border-gray-300 align-top">
                <th className="p-2 border-r border-gray-300 text-left w-1/3 bg-gray-50 font-semibold">
                  Name & Address of Customer
                </th>
                <td className="p-2 whitespace-pre-wrap">
                  {permissions.includes(358) ? (
                    <>
                      <div className="font-bold">{inward?.customername || "-"}</div>
                      <div className="text-gray-600 mt-1">{inward?.customer_address || ""}</div>
                    </>
                  ) : (
                    <span className="text-gray-400 italic">Not Permitted</span>
                  )}
                </td>
              </tr>

              {/* Row 2: Contact Person */}
              <tr className="border-b border-gray-300 align-top">
                <th className="p-2 border-r border-gray-300 text-left bg-gray-50 font-semibold">
                  Contact Person Name, Dept. & Designation
                </th>
                <td className="p-2 whitespace-pre-wrap">
                  {permissions.includes(358) ? (
                    <>
                      <div className="font-medium">{inward?.contact_person_name || "-"}</div>
                      <div className="text-gray-600 mt-0.5">
                        {[inward?.contact_department, inward?.contact_designation].filter(Boolean).join(", ")}
                      </div>
                    </>
                  ) : (
                    <span className="text-gray-400 italic">Not Permitted</span>
                  )}
                </td>
              </tr>

              {/* Row 3: Email / Tele / Fax */}
              <tr className="border-b border-gray-300 align-top">
                <th className="p-2 border-r border-gray-300 text-left bg-gray-50 font-semibold">
                  E-mail/ Tele/Fax Number
                </th>
                <td className="p-2 whitespace-pre-wrap">
                  {permissions.includes(358) ? (
                    <div>
                      {inward?.concernpersonemail && <div>Email: {inward.concernpersonemail}</div>}
                      {inward?.concernpersonmobile && <div>Mobile: {inward.concernpersonmobile}</div>}
                      {!inward?.concernpersonemail && !inward?.concernpersonmobile && "-"}
                    </div>
                  ) : (
                    <span className="text-gray-400 italic">Not Permitted</span>
                  )}
                </td>
              </tr>

              {/* Row 4: Certificate Printing Info */}
              <tr className="border-b border-gray-300 align-top">
                <th className="p-2 border-r border-gray-300 text-left bg-gray-50 font-semibold">
                  Name & Address to be printed on Calibration certificates (if other than the Name & address details mentioned otherwise write “Same as mentioned earlier”)
                </th>
                <td className="p-2">
                  <div className="flex flex-wrap items-center gap-6 mb-2">
                    <label className="inline-flex items-center gap-2 cursor-default">
                      <input
                        type="checkbox"
                        disabled
                        checked={isBillingSame}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="font-medium">Same</span>
                    </label>
                    <label className="inline-flex items-center gap-2 cursor-default">
                      <input
                        type="checkbox"
                        disabled
                        checked={!isBillingSame}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="font-medium">Different</span>
                    </label>
                  </div>
                  {!isBillingSame && (
                    <div className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded whitespace-pre-wrap">
                      {permissions.includes(358) ? (
                        <>
                          <div className="font-bold">{inward?.billingname || "-"}</div>
                          <div className="text-gray-600 mt-1">{inward?.billing_address || ""}</div>
                        </>
                      ) : (
                        <span className="text-gray-400 italic">Not Permitted</span>
                      )}
                    </div>
                  )}
                </td>
              </tr>

              {/* Row 5: GST No */}
              <tr className="border-b border-gray-300 align-top">
                <th className="p-2 border-r border-gray-300 text-left bg-gray-50 font-semibold">
                  GST No.
                </th>
                <td className="p-2 font-mono">
                  {permissions.includes(358) ? (inward?.gstno || "-") : <span className="text-gray-400 italic">Not Permitted</span>}
                </td>
              </tr>

              {/* Row 6: Conformity of statement */}
              <tr className="border-b border-gray-300 align-top">
                <th className="p-2 border-r border-gray-300 text-left bg-gray-50 font-semibold">
                  Whether Conformity of statement is required: • Yes • No ( If yes, Decision Rule will be applicable )
                </th>
                <td className="p-2 font-medium">
                  {items[0]?.conformitystatement || "No"}
                </td>
              </tr>

              {/* Row 7: Decision Rule */}
              <tr className="align-top">
                <th className="p-2 border-r border-gray-300 text-left bg-gray-50 font-semibold">
                  Decision Rule: • As per reference standard (OR) • Customer specification
                </th>
                <td className="p-2 font-medium">
                  {items[0]?.decisionrule || "Not Applicable"}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Instruments / UUC list */}
          <div className="mb-6 overflow-x-auto">
            <table className="w-full border border-gray-300 text-xs text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-800 uppercase font-semibold border-b border-gray-300">
                  <th className="p-2 border-r border-gray-300 w-12 text-center">S. No.</th>
                  <th className="p-2 border-r border-gray-300">UUC NAME, MAKE/MODEL</th>
                  <th className="p-2 border-r border-gray-300">SR / ID.NO.</th>
                  <th className="p-2 border-r border-gray-300">PARAMETER</th>
                  <th className="p-2 border-r border-gray-300">RANGE, LEAST COUNT</th>
                  <th className="p-2 border-r border-gray-300">INSTRUMENT LOCATION</th>
                  <th className="p-2 border-r border-gray-300">VALIDITY, IF REQUIRED</th>
                  <th className="p-2">REMARK</th>
                </tr>
              </thead>
              <tbody>
                {items && items.length > 0 ? (
                  items.map((item, idx) => (
                    <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50/50">
                      <td className="p-2 border-r border-gray-300 text-center font-medium">{idx + 1}</td>
                      <td className="p-2 border-r border-gray-300 font-semibold text-gray-800">
                        {item?.name ? `${item.name}${item.make ? ` , ${item.make}` : ""}` : "-"}
                      </td>
                      <td className="p-2 border-r border-gray-300 font-mono">
                        {item?.serialno || "-"} / {item?.idno || "-"}
                      </td>
                      <td className="p-2 border-r border-gray-300 text-gray-700">
                        {item?.parameter || "-"}
                      </td>
                      <td className="p-2 border-r border-gray-300 text-gray-700">
                        {item?.range_leastcount || `${item?.equipmentrange || "-"} , ${item?.leastcount || "-"}`}
                      </td>
                      <td className="p-2 border-r border-gray-300 text-gray-600">
                        {item?.location || item?.performedat || "-"}
                      </td>
                      <td className="p-2 border-r border-gray-300 text-gray-600">
                        {item?.validity || item?.frequency || "-"}
                      </td>
                      <td className="p-2 text-gray-600">
                        {item?.remark || "-"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="p-4 text-center text-gray-400 italic">
                      No instruments found.
                    </td>
                  </tr>
                )}
                {/* Additional Remark */}
                <tr className="border-t border-gray-300 bg-gray-50/50">
                  <td colSpan={8} className="p-3 font-semibold text-gray-800">
                    Additional Remark if Any: <span className="font-normal text-gray-700">{inward?.reviewremark || "N/A"}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Terms & Conditions Section */}
          <div className="mb-6 border border-gray-200 rounded p-4 bg-gray-50/30">
            <h3 className="font-bold text-xs uppercase tracking-wide text-gray-800 mb-2">Terms & Conditions:</h3>
            <ol className="list-decimal pl-4 space-y-1.5 text-xxs text-gray-600 leading-normal">
              <li>
                All the terms & Conditions agreed as per Our Quotation no- <span className="font-semibold text-gray-800">{quotation?.quotationno || "N/A"}</span> / Your PO No- <span className="font-semibold text-gray-800">{inward?.ponumber || "N/A"}</span>.
              </li>
              <li>Above customer information will be entered into final certificates and no changes will be entertained at a later date.</li>
              <li>Delivery: Billed customer to kindly collect duly calibrated instruments in 3 working days.</li>
              <li>Payment: Customer to kindly release the payment within 7 working days from the date of Invoice. Payment through Cheque/NEFT in favour of “Kailtech Test & Research Centre Pvt Ltd.”</li>
              <li>Conformity will be given based on above input. If the detail of Reference standard / customer specification is not given, then conformity statement will not be given in the certificate.</li>
              <li>The Validity will be provided in Certificate, only if required.</li>
              <li>Please refer our Scope of Accreditation & method used for calibration of each Instruments.</li>
              <li>If equipment&apos;s are more than the given space, please attach separate sheet for details. If equipment needs any accessories, please provide.</li>
              <li>Please note that calibration certificate issued by laboratory is/are electronically signed by Authorized Signatory approved by NABL, hence does not require signature by ink.</li>
              <li>Calibration is meant for scientific and industrial purpose only.</li>
              <li>All information provided, except name of customer, shared shall be maintained confidential.</li>
              <li>All disputes, subject to jurisdiction of the courts of Indore (India) only.</li>
            </ol>
            
            <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-gray-200/60 text-xs">
              <div>
                <span className="font-semibold text-gray-800">Customer Representative Sign: </span>
                <span className="border-b border-gray-300 w-32 inline-block ml-2 h-4" />
              </div>
              <div className="text-right">
                <span className="font-semibold text-gray-800">Name and Department: </span>
                <span className="border-b border-gray-300 w-48 inline-block ml-2 h-4" />
              </div>
            </div>
          </div>

          {/* For Kailtech Use Only Section */}
          <div className="mb-6 border border-gray-300 rounded p-4">
            <h2 className="text-center font-bold text-sm uppercase tracking-wider text-gray-800 mb-3 underline">
              For use of Kailtech only
            </h2>
            <table className="w-full border border-gray-300 text-xs border-collapse mb-4">
              <thead>
                <tr className="bg-gray-100 font-semibold border-b border-gray-300">
                  <th className="p-2 border-r border-gray-300 w-16 text-center">Sr. No.</th>
                  <th className="p-2 border-r border-gray-300 text-left">Review Remarks</th>
                  <th className="p-2 border-r border-gray-300 w-24 text-center">Yes</th>
                  <th className="p-2 w-24 text-center">No</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Is the condition of DUC ok for Calibration?", technical?.DUCCalibration === "Yes", technical?.DUCCalibration === ""],
                  ["Is the capability & resources available?", technical?.resourcesavailable === "Yes", technical?.resourcesavailable === ""],
                  ["Is all the terms & condition discussed with the customer?", technical?.discussedcustomer === "Yes", technical?.discussedcustomer === ""],
                  ["Is there any specific requirement?", technical?.specificrequirement === "Yes", technical?.specificrequirement === "" || technical?.specificrequirement === "No"],
                  ["Accessories, if any ?", technical?.Accessories === "Yes", technical?.Accessories === "" || technical?.Accessories === "No"],
                ].map(([question, yesCheck, noCheck], idx) => (
                  <tr key={idx} className="border-b border-gray-200">
                    <td className="p-2 border-r border-gray-300 text-center font-medium">{idx + 1}.</td>
                    <td className="p-2 border-r border-gray-300 text-gray-700">{question}</td>
                    <td className="p-2 border-r border-gray-300 text-center font-bold text-emerald-600 text-sm">{yesCheck ? "✓" : ""}</td>
                    <td className="p-2 text-center font-bold text-red-500 text-sm">{noCheck ? "✓" : ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="text-xs bg-gray-50 border border-gray-200 p-2.5 rounded">
              <span className="font-semibold text-gray-800">Remarks:</span> <span className="text-gray-700">{technical?.remark || "None"}</span>
            </div>
          </div>

          {/* Reviewed & Accepted Signature Block */}
          <div className="border border-gray-300 rounded p-4 bg-gray-50/20">
            <h3 className="text-center font-bold text-xs uppercase tracking-wide text-gray-800 mb-3">
              Customer Requirement Form Reviewed & Accepted by
            </h3>
            <table className="w-full border border-gray-300 text-xs border-collapse">
              <tbody>
                <tr className="border-b border-gray-300">
                  <td className="p-2 border-r border-gray-300 w-1/4 font-semibold bg-gray-50">Signature</td>
                  <td className="p-2">
                    {inward?.status >= 2 && inward?.status < 98 ? (
                      signature?.image ? (
                        <div className="flex flex-col gap-1 items-start">
                          <img
                            src={signature.image}
                            alt="Electronic Signature"
                            className="max-h-16 max-w-xs object-contain border border-gray-200 p-1 bg-white"
                          />
                          <span className="text-[10px] text-gray-400 italic">Electronically signed</span>
                        </div>
                      ) : (
                        <div className="p-2 border border-dashed border-emerald-300 rounded bg-emerald-50/30 text-emerald-700 font-medium whitespace-pre-wrap max-w-md text-xxs leading-relaxed">
                          {`Electronically signed by \n${signature?.name || "Authorized Person"} \nDate: ${formatDate(inward?.techacceptedon)}`}
                        </div>
                      )
                    ) : (
                      <span className="text-gray-400 italic">Pending Acceptance</span>
                    )}
                  </td>
                </tr>
                <tr className="border-b border-gray-300">
                  <td className="p-2 border-r border-gray-300 font-semibold bg-gray-50">Name</td>
                  <td className="p-2 font-medium">{signature?.name || "-"}</td>
                </tr>
                <tr>
                  <td className="p-2 border-r border-gray-300 font-semibold bg-gray-50">Date</td>
                  <td className="p-2">{formatDate(inward?.techacceptedon, "Y-m-d")}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Actions & Print Footer (Hidden on Print) */}
          <div className="flex flex-wrap items-center justify-between gap-3 mt-8 pt-4 border-t border-gray-200 no-print">
            <div className="flex items-center gap-2">
              {inward?.wupload && permissions.includes(371) && (
                <a
                  href={`https://kailtech.thehostme.com/2025_05_07/kailtech_new/${inward.wupload}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-md bg-amber-500 hover:bg-amber-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition"
                >
                  View Workorder
                </a>
              )}
              {inward?.rupload && (
                <a
                  href={`https://kailtech.thehostme.com/2025_05_07/kailtech_new/${inward.rupload}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-md bg-amber-500 hover:bg-amber-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition"
                >
                  View Receipt Doc
                </a>
              )}
            </div>

            <Button onClick={handlePrint} color="success" disabled={printLoading} className="px-5 py-2 font-semibold">
              {printLoading ? (
                <div className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z" />
                  </svg>
                  Preparing...
                </div>
              ) : (
                "Download CRF"
              )}
            </Button>
          </div>

        </div>
      </div>
    </Page>
  );
}
