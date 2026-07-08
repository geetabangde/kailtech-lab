import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import clsx from "clsx";
import axios from "utils/axios";

// Local Imports
import { Page } from "components/shared/Page";
import { Card } from "components/ui";
import { toast } from "sonner";
// ----------------------------------------------------------------------

export default function ViewEmployeeJoiningForm() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchJoiningForm = async () => {
      try {
        setLoading(true);
        setError(false);
        const response = await axios.get(`/hrm/get-employee-joiningform/${id}`);
        
        if (response.data.status === true) {
          setData(response.data.data);
        } else {
          // If the API isn't ready yet, we can set dummy data or throw
          throw new Error(response.data.message || "Failed to fetch data");
        }
      } catch (err) {
        console.error("Error fetching joining form:", err);
        // For demonstration/development purposes if the endpoint doesn't exist yet, 
        // we gracefully degrade rather than breaking the page completely.
        toast.error("Failed to load joining form. API might not be ready.");
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchJoiningForm();
  }, [id]);

  // Safe destructuring with fallbacks for the real API structure
  const p = data?.basic_info || {};
  const family = Array.isArray(data?.family_details) ? data.family_details : [];
  const education = Array.isArray(data?.education_details) ? data.education_details : [];
  const employment = Array.isArray(data?.employment_details) ? data.employment_details : [];
  const emergency = Array.isArray(data?.emergency_contacts) ? data.emergency_contacts : [];
  const references = Array.isArray(data?.references) ? data.references : [];
  const bankac = Array.isArray(data?.bank_accounts) ? data.bank_accounts : [];
  const salaryData = data?.salary_details;
  const salary = Array.isArray(salaryData) ? salaryData : salaryData ? [salaryData] : [];
  const sig = data?.signature_info || {};

  if (loading) {
    return (
      <Page title="View Joining Form">
        <div className="flex h-[60vh] items-center justify-center text-gray-600">
          <svg className="animate-spin h-6 w-6 mr-2 text-primary-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z"></path>
          </svg>
          Loading Joining Form...
        </div>
      </Page>
    );
  }

  if (error && !data) {
    return (
      <Page title="View Joining Form">
        <div className="flex h-[60vh] flex-col items-center justify-center text-red-600">
          <p className="text-lg font-semibold mb-4">Error loading data.</p>
          <Link to="/dashboards/hrm/manage-employee" className="text-blue-600 hover:underline">
            &larr; Back to Manage Employee
          </Link>
        </div>
      </Page>
    );
  }

  return (
    <Page title="View Joining Form">
      <div className="transition-content w-full px-[var(--margin-x)] pb-5 pt-4">
        <Card className="flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-dark-600 no-print">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-dark-100">
              View Joining Form
            </h3>
            <div className="flex items-center gap-2">
              <Link
                to="/dashboards/hrm/manage-employee"
                className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-dark-600 dark:bg-dark-800 dark:text-dark-200 dark:hover:bg-dark-700"
              >
                &larr; Back
              </Link>
              {/* Optional: Add a window.print() button if needed */}
              <button
                onClick={() => window.print()}
                className="inline-flex items-center justify-center rounded-md bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400"
              >
                Print
              </button>
            </div>
          </div>

          {/* Form Body with Watermark */}
          <div 
            className="p-5 print:p-0 bg-center bg-no-repeat bg-[length:50%] relative" 
            style={{ 
              backgroundImage: "url('/images/logobggrayscal.png')",
              filter: "grayscale(100%)"
            }}
          >
            <div className="relative z-10 bg-white/80 dark:bg-dark-800/80 print:bg-transparent">
              <header className="mb-6 text-center text-2xl font-bold text-gray-800 dark:text-white">
                Joining Form
              </header>

              {/* Personal Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mb-8">
                <DetailRow label="Name" value={p.name} />
                <DetailRow label="Husband/Wife Name" value={p.husband_wife_name} />
                
                <DetailRow label="Father's Name" value={p.father_name} />
                <DetailRow label="Mother's Name" value={p.mother_name} />
                
                <DetailRow label="Gender" value={p.gender} />
                <DetailRow label="Date Of Birth" value={p.date_of_birth} />
                
                <DetailRow label="Joining Date" value={p.joining_date} />
                <div className="hidden md:block"></div> {/* Empty cell for alignment */}

                <DetailRow label="Local Address" value={p.local_address} fullWidth />
                <DetailRow label="Permanent Address" value={p.permanent_address} fullWidth />

                <DetailRow label="Marital Status" value={p.marital_status} />
                <DetailRow label="Blood Group" value={p.blood_group} />

                <DetailRow label="Mobile" value={p.mobile} />
                <DetailRow label="Email" value={p.email} />

                <DetailRow label="Aadhar Card No" value={p.aadhar_no} />
                <DetailRow label="Pan Card No" value={p.pan_no} />

                <DetailRow label="Probation Duration" value={p.probation_duration} />
                
                {/* Photo */}
                <div className="flex flex-col sm:flex-row sm:items-start border-b border-dashed border-gray-200 pb-2 dark:border-dark-600">
                  <span className="w-full sm:w-1/3 text-sm font-semibold text-gray-600 dark:text-dark-300">Photo</span>
                  <span className="w-full sm:w-2/3 text-sm text-gray-900 dark:text-dark-100">
                    {p.photo_url ? (
                      <img src={p.photo_url} alt="Employee" className="w-24 rounded border border-gray-200 dark:border-dark-600" />
                    ) : (
                      "No Photo Available"
                    )}
                  </span>
                </div>
              </div>

              {/* Family Detail */}
              <SectionTitle title="Family Detail" />
              <div className="mb-8 overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse border border-gray-300 dark:border-dark-600 print:bg-transparent">
                  <thead className="bg-gray-100 dark:bg-dark-700">
                    <tr>
                      <th className="border border-gray-300 dark:border-dark-600 p-2 font-semibold text-gray-700 dark:text-dark-200">Name</th>
                      <th className="border border-gray-300 dark:border-dark-600 p-2 font-semibold text-gray-700 dark:text-dark-200">Age</th>
                      <th className="border border-gray-300 dark:border-dark-600 p-2 font-semibold text-gray-700 dark:text-dark-200">Relation</th>
                      <th className="border border-gray-300 dark:border-dark-600 p-2 font-semibold text-gray-700 dark:text-dark-200">Occupation</th>
                      <th className="border border-gray-300 dark:border-dark-600 p-2 font-semibold text-gray-700 dark:text-dark-200">Contact no</th>
                      <th className="border border-gray-300 dark:border-dark-600 p-2 font-semibold text-gray-700 dark:text-dark-200">Annual Income</th>
                    </tr>
                  </thead>
                  <tbody>
                    {family.length > 0 ? family.map((f, i) => (
                      <tr key={i} className="hover:bg-gray-50 dark:hover:bg-dark-700/50 transition">
                        <td className="border border-gray-300 dark:border-dark-600 p-2">{f.name}</td>
                        <td className="border border-gray-300 dark:border-dark-600 p-2">{f.age}</td>
                        <td className="border border-gray-300 dark:border-dark-600 p-2">{f.relation}</td>
                        <td className="border border-gray-300 dark:border-dark-600 p-2">{f.occupation}</td>
                        <td className="border border-gray-300 dark:border-dark-600 p-2">{f.contact_no}</td>
                        <td className="border border-gray-300 dark:border-dark-600 p-2">{f.annual_income}</td>
                      </tr>
                    )) : <tr><td colSpan={6} className="border border-gray-300 dark:border-dark-600 p-4 text-center text-gray-500">No data available</td></tr>}
                  </tbody>
                </table>
              </div>

              {/* Education Detail */}
              <SectionTitle title="Education Detail" />
              <div className="mb-8 overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse border border-gray-300 dark:border-dark-600 print:bg-transparent">
                  <thead className="bg-gray-100 dark:bg-dark-700">
                    <tr>
                      <th className="border border-gray-300 dark:border-dark-600 p-2 font-semibold text-gray-700 dark:text-dark-200">Name Of Degree</th>
                      <th className="border border-gray-300 dark:border-dark-600 p-2 font-semibold text-gray-700 dark:text-dark-200">Name Of The University</th>
                      <th className="border border-gray-300 dark:border-dark-600 p-2 font-semibold text-gray-700 dark:text-dark-200">Start Year</th>
                      <th className="border border-gray-300 dark:border-dark-600 p-2 font-semibold text-gray-700 dark:text-dark-200">End Year</th>
                      <th className="border border-gray-300 dark:border-dark-600 p-2 font-semibold text-gray-700 dark:text-dark-200">Percentage / Grade</th>
                      <th className="border border-gray-300 dark:border-dark-600 p-2 font-semibold text-gray-700 dark:text-dark-200">Speciality</th>
                    </tr>
                  </thead>
                  <tbody>
                    {education.length > 0 ? education.map((e, i) => (
                      <tr key={i} className="hover:bg-gray-50 dark:hover:bg-dark-700/50 transition">
                        <td className="border border-gray-300 dark:border-dark-600 p-2">{e.degree}</td>
                        <td className="border border-gray-300 dark:border-dark-600 p-2">{e.university}</td>
                        <td className="border border-gray-300 dark:border-dark-600 p-2">{e.start_year}</td>
                        <td className="border border-gray-300 dark:border-dark-600 p-2">{e.end_year}</td>
                        <td className="border border-gray-300 dark:border-dark-600 p-2">{e.percentage_grade}</td>
                        <td className="border border-gray-300 dark:border-dark-600 p-2">{e.speciality}</td>
                      </tr>
                    )) : <tr><td colSpan={6} className="border border-gray-300 dark:border-dark-600 p-4 text-center text-gray-500">No data available</td></tr>}
                  </tbody>
                </table>
              </div>

              {/* Employment Detail */}
              <SectionTitle title="Employment Detail" />
              <div className="mb-8 overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse border border-gray-300 dark:border-dark-600 print:bg-transparent">
                  <thead className="bg-gray-100 dark:bg-dark-700">
                    <tr>
                      <th className="border border-gray-300 dark:border-dark-600 p-2 font-semibold text-gray-700 dark:text-dark-200">Organization</th>
                      <th className="border border-gray-300 dark:border-dark-600 p-2 font-semibold text-gray-700 dark:text-dark-200">Designation</th>
                      <th className="border border-gray-300 dark:border-dark-600 p-2 font-semibold text-gray-700 dark:text-dark-200">Start Year</th>
                      <th className="border border-gray-300 dark:border-dark-600 p-2 font-semibold text-gray-700 dark:text-dark-200">End Year</th>
                      <th className="border border-gray-300 dark:border-dark-600 p-2 font-semibold text-gray-700 dark:text-dark-200">Annual CTC</th>
                      <th className="border border-gray-300 dark:border-dark-600 p-2 font-semibold text-gray-700 dark:text-dark-200">Reason To Leave</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employment.length > 0 ? employment.map((e, i) => (
                      <tr key={i} className="hover:bg-gray-50 dark:hover:bg-dark-700/50 transition">
                        <td className="border border-gray-300 dark:border-dark-600 p-2">{e.organization}</td>
                        <td className="border border-gray-300 dark:border-dark-600 p-2">{e.designation}</td>
                        <td className="border border-gray-300 dark:border-dark-600 p-2">{e.start_year}</td>
                        <td className="border border-gray-300 dark:border-dark-600 p-2">{e.end_year}</td>
                        <td className="border border-gray-300 dark:border-dark-600 p-2">{e.annual_ctc}</td>
                        <td className="border border-gray-300 dark:border-dark-600 p-2">{e.reason_to_leave}</td>
                      </tr>
                    )) : <tr><td colSpan={6} className="border border-gray-300 dark:border-dark-600 p-4 text-center text-gray-500">No data available</td></tr>}
                  </tbody>
                </table>
              </div>

              {/* Emergency Contact Detail */}
              <SectionTitle title="Emergency Contact Detail" />
              <div className="mb-8 overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse border border-gray-300 dark:border-dark-600 print:bg-transparent">
                  <thead className="bg-gray-100 dark:bg-dark-700">
                    <tr>
                      <th className="border border-gray-300 dark:border-dark-600 p-2 font-semibold text-gray-700 dark:text-dark-200">Name</th>
                      <th className="border border-gray-300 dark:border-dark-600 p-2 font-semibold text-gray-700 dark:text-dark-200">Contact no</th>
                      <th className="border border-gray-300 dark:border-dark-600 p-2 font-semibold text-gray-700 dark:text-dark-200">Email</th>
                      <th className="border border-gray-300 dark:border-dark-600 p-2 font-semibold text-gray-700 dark:text-dark-200">Relation</th>
                      <th className="border border-gray-300 dark:border-dark-600 p-2 font-semibold text-gray-700 dark:text-dark-200">Address</th>
                      <th className="border border-gray-300 dark:border-dark-600 p-2 font-semibold text-gray-700 dark:text-dark-200">City</th>
                      <th className="border border-gray-300 dark:border-dark-600 p-2 font-semibold text-gray-700 dark:text-dark-200">State</th>
                    </tr>
                  </thead>
                  <tbody>
                    {emergency.length > 0 ? emergency.map((e, i) => (
                      <tr key={i} className="hover:bg-gray-50 dark:hover:bg-dark-700/50 transition">
                        <td className="border border-gray-300 dark:border-dark-600 p-2">{e.name}</td>
                        <td className="border border-gray-300 dark:border-dark-600 p-2">{e.contact_no || e.mobile}</td>
                        <td className="border border-gray-300 dark:border-dark-600 p-2">{e.email}</td>
                        <td className="border border-gray-300 dark:border-dark-600 p-2">{e.relation}</td>
                        <td className="border border-gray-300 dark:border-dark-600 p-2">{e.address}</td>
                        <td className="border border-gray-300 dark:border-dark-600 p-2">{e.city}</td>
                        <td className="border border-gray-300 dark:border-dark-600 p-2">{e.state_name || e.state}</td>
                      </tr>
                    )) : <tr><td colSpan={7} className="border border-gray-300 dark:border-dark-600 p-4 text-center text-gray-500">No data available</td></tr>}
                  </tbody>
                </table>
              </div>

              {/* References Detail */}
              <SectionTitle title="References Detail" />
              <div className="mb-8 overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse border border-gray-300 dark:border-dark-600 print:bg-transparent">
                  <thead className="bg-gray-100 dark:bg-dark-700">
                    <tr>
                      <th className="border border-gray-300 dark:border-dark-600 p-2 font-semibold text-gray-700 dark:text-dark-200">Name</th>
                      <th className="border border-gray-300 dark:border-dark-600 p-2 font-semibold text-gray-700 dark:text-dark-200">Age</th>
                      <th className="border border-gray-300 dark:border-dark-600 p-2 font-semibold text-gray-700 dark:text-dark-200">Relation</th>
                      <th className="border border-gray-300 dark:border-dark-600 p-2 font-semibold text-gray-700 dark:text-dark-200">Known Since</th>
                      <th className="border border-gray-300 dark:border-dark-600 p-2 font-semibold text-gray-700 dark:text-dark-200">Contact no</th>
                      <th className="border border-gray-300 dark:border-dark-600 p-2 font-semibold text-gray-700 dark:text-dark-200">Organization</th>
                    </tr>
                  </thead>
                  <tbody>
                    {references.length > 0 ? references.map((r, i) => (
                      <tr key={i} className="hover:bg-gray-50 dark:hover:bg-dark-700/50 transition">
                        <td className="border border-gray-300 dark:border-dark-600 p-2">{r.name}</td>
                        <td className="border border-gray-300 dark:border-dark-600 p-2">{r.age}</td>
                        <td className="border border-gray-300 dark:border-dark-600 p-2">{r.relation}</td>
                        <td className="border border-gray-300 dark:border-dark-600 p-2">{r.known_since || r.knownsince}</td>
                        <td className="border border-gray-300 dark:border-dark-600 p-2">{r.contact_no || r.contactno}</td>
                        <td className="border border-gray-300 dark:border-dark-600 p-2">{r.organization || r.oraganization}</td>
                      </tr>
                    )) : <tr><td colSpan={6} className="border border-gray-300 dark:border-dark-600 p-4 text-center text-gray-500">No data available</td></tr>}
                  </tbody>
                </table>
              </div>

              {/* Bank Accounts */}
              {bankac.length > 0 && bankac.map((b, i) => (
                <div key={i} className="mb-8">
                  <SectionTitle title="Bank Account Detail" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                    <DetailRow label="Name Of Bank" value={b.nameofthebank} />
                    <DetailRow label="Account no" value={b.acno} />
                    <DetailRow label="Account Type" value={b.actype} />
                    <DetailRow label="IFSC Code" value={b.ifsccode} />
                    <DetailRow label="Swift Code" value={b.swiftcode} />
                  </div>
                </div>
              ))}

              {/* Salary Details */}
              {salary.length > 0 && salary.map((s, i) => (
                <div key={i} className="mb-8 border border-gray-200 rounded-lg p-5 dark:border-dark-600 print:border-transparent print:p-0">
                  <SectionTitle title="Salary Detail" className="!mt-0" />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mb-6">
                    <DetailRow label="Department" value={s.department_name || s.department} />
                    <DetailRow label="Designation" value={s.designation_name || s.designation} />
                    <DetailRow label="Assessed By" value={s.assesedby_name || s.assesedby} />
                    <DetailRow label="HOD" value={s.hod_name || s.hod} />
                    <DetailRow label="Branch" value={s.posting_name || s.posting} />
                    <DetailRow label="Reporting To" value={s.reportingto_name || s.reportingto} />
                    
                    <DetailRow label="Basic" value={s.basic} />
                    <DetailRow label="HRA" value={s.hra} />
                    <DetailRow label="Special Allowance" value={s.sa} />
                    <DetailRow label="Bonus @8.33%" value={s.bonus} />
                  </div>

                  <h5 className="font-semibold text-gray-800 dark:text-dark-100 mb-3 border-b pb-1 dark:border-dark-600">Deductions</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mb-6">
                    <DetailRow label="EPF for Employee contribution Per Month" value={s.epfemp} fullWidth />
                    <DetailRow label="ESIC Employee Contribution per Month" value={s.esicemp} fullWidth />
                    <DetailRow label="Professional Tax" value={s.pt} />
                    <DetailRow label="Net In Hand Salary" value={s.netinhand} />
                  </div>

                  <h5 className="font-semibold text-gray-800 dark:text-dark-100 mb-3 border-b pb-1 dark:border-dark-600">Invisible Benefits by Employer</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mb-6">
                    <DetailRow label="PF Contribution (Company)@12%" value={s.epfemployer} />
                    <DetailRow label="ESIC Contribution (Company)@3.25%" value={s.esicemployer} />
                  </div>

                  <h5 className="font-semibold text-gray-800 dark:text-dark-100 mb-3 border-b pb-1 dark:border-dark-600">Totals</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                    <DetailRow label="Mobile Allowance" value={s.mobileallowance} />
                    <div className="hidden md:block"></div>
                    <DetailRow label="Gross CTC Per Month" value={s.grossctcmonth} />
                    <DetailRow label="Gross CTC Per Annual" value={s.grossctcannual} />
                  </div>
                </div>
              ))}

              {/* Footer Signature Area (Hidden on screen, visible only on print) */}
              <div className="mt-12 hidden print:flex flex-col sm:flex-row justify-between items-start pt-8 border-t border-gray-200 pagefooter print:fixed print:bottom-0 print:left-0 print:right-0 print:px-8 print:pb-8 print:bg-white">
                <div className="mb-4 sm:mb-0">
                  <p className="font-medium text-gray-700 dark:text-dark-200">
                    Date: {sig?.date || "-"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600 dark:text-dark-300 mb-12 whitespace-pre-wrap">
                    {sig?.electronic_signature?.text || ""}
                  </p>
                  <div className="border-t border-gray-400 w-48 inline-block mt-4 text-center text-sm font-semibold text-gray-700 dark:text-dark-200 pt-1">
                    Signature
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </Page>
  );
}

// Subcomponents for cleaner layout
function DetailRow({ label, value, fullWidth = false }) {
  return (
    <div className={clsx("flex flex-col sm:flex-row sm:items-start border-b border-dashed border-gray-200 pb-2 dark:border-dark-600", fullWidth && "md:col-span-2")}>
      <span className={clsx("text-sm font-semibold text-gray-600 dark:text-dark-300 mb-1 sm:mb-0", fullWidth ? "sm:w-1/4" : "w-full sm:w-1/3")}>{label}</span>
      <span className={clsx("text-sm text-gray-900 dark:text-dark-100", fullWidth ? "sm:w-3/4" : "w-full sm:w-2/3 break-words")}>{value || "-"}</span>
    </div>
  );
}

const SectionTitle = ({ title, className = "" }) => (
  <h6 className={`text-lg font-semibold text-gray-800 dark:text-gray-100 border-b border-gray-300 dark:border-dark-600 pb-2 mb-4 mt-8 ${className}`}>
    {title}
  </h6>
);

