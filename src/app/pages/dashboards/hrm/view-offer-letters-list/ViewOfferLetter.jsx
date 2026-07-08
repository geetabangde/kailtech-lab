import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { Button, Card } from "components/ui";
import { Page } from "components/shared/Page";
import axios from "utils/axios";
import { toast } from "sonner";
import { getStoredPermissions } from "app/navigation/dashboards";
import { ArrowLeftIcon, PrinterIcon } from "@heroicons/react/24/outline";

// ----------------------------------------------------------------------

export default function ViewOfferLetter() {
  const { id } = useParams();
  const navigate = useNavigate();
  const permissions = getStoredPermissions();

  const [loading, setLoading] = useState(true);
  const [offerLetter, setOfferLetter] = useState(null);
  
  // Dynamic resolution states
  const [branches, setBranches] = useState([]);
  const [designations, setDesignations] = useState([]);

  // Fetch offer letter detail with resilient endpoint fallbacks
  const fetchDetail = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    let success = false;
    let data = null;

    // List of resilient endpoints to try
    const endpoints = [
      `/hrm/get-offer-letter/${id}`,
      `/hrm/offer-letter-get-byid/${id}`,
      `/hrm/get-offerletter/${id}`,
      `/hrm/offer-letter/${id}`,
    ];

    for (const url of endpoints) {
      try {
        const res = await axios.get(url);
        if (res.data?.status && res.data?.data) {
          data = res.data.data;
          success = true;
          break;
        } else if (res.data) {
          data = res.data;
          success = true;
          break;
        }
      } catch {
        // Continue to next fallback
        console.warn(`Failed fetching from ${url}, trying fallback...`);
      }
    }

    if (success && data) {
      setOfferLetter(data);
    } else {
      toast.error("Failed to load offer letter details ❌");
    }
    setLoading(false);
  }, [id]);

  // Load supporting options for robust ID resolution
  const loadSupportingData = useCallback(async () => {
    try {
      const [branchRes, desigRes] = await Promise.all([
        axios.get("/hrm/list-branch").catch(() => ({ data: { data: [] } })),
        axios.get("/hrm/designation-list").catch(() => ({ data: { data: [] } })),
      ]);
      setBranches(branchRes.data?.data || branchRes.data || []);
      setDesignations(desigRes.data?.data || desigRes.data || []);
    } catch (err) {
      console.error("Error loading supporting data:", err);
    }
  }, []);

  useEffect(() => {
    if (permissions.includes(246)) {
      fetchDetail();
      loadSupportingData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, fetchDetail, loadSupportingData]);

  // Helper: Format Date from YYYY-MM-DD to DD/MM/YYYY
  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  };

  // Helper: Format Date Time (for signature)
  const formatDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return "";
    try {
      const d = new Date(dateTimeStr);
      if (isNaN(d.getTime())) return dateTimeStr;
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, "0");
      const minutes = String(d.getMinutes()).padStart(2, "0");
      const seconds = String(d.getSeconds()).padStart(2, "0");
      return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    } catch {
      return dateTimeStr;
    }
  };

  // Resolve Designation Name
  const getDesignationName = () => {
    if (!offerLetter) return "—";
    if (offerLetter.designation_name) return offerLetter.designation_name;
    if (offerLetter.designation && typeof offerLetter.designation === "object") {
      return offerLetter.designation.name || "—";
    }
    const matched = designations.find(
      (d) => String(d.id || d.value) === String(offerLetter.designation)
    );
    return matched ? matched.name || matched.label : offerLetter.designation || "—";
  };

  // Resolve Branch Name & Location
  const getBranchName = () => {
    if (!offerLetter) return "—";
    if (offerLetter.branch_name) return offerLetter.branch_name;
    if (offerLetter.branch && typeof offerLetter.branch === "object") {
      const name = offerLetter.branch.name || "";
      const loc = offerLetter.branch.location || "";
      return name && loc ? `${name}/${loc}` : name || "—";
    }
    const matched = branches.find(
      (b) => String(b.id || b.value) === String(offerLetter.branch)
    );
    if (matched) {
      const name = matched.name || matched.label || "";
      const loc = matched.location || "";
      return name && loc ? `${name}/${loc}` : name || "—";
    }
    return offerLetter.branch || "—";
  };

  // Gated on Permission 246
  if (!permissions.includes(246)) {
    return (
      <Page title="View Offer Letter">
        <div className="flex h-60 items-center justify-center rounded-xl border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-sm font-medium text-red-600 dark:text-red-400">
            Access Denied - Permission 246 required to view offer letters
          </p>
        </div>
      </Page>
    );
  }

  if (loading) {
    return (
      <Page title="View Offer Letter::.Joining Process-Hrm">
        <div className="flex h-[60vh] items-center justify-center text-gray-600 dark:text-dark-200">
          <svg className="mr-2 h-6 w-6 animate-spin text-blue-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z"></path>
          </svg>
          Loading offer letter...
        </div>
      </Page>
    );
  }

  if (!offerLetter) {
    return (
      <Page title="View Offer Letter::.Joining Process-Hrm">
        <div className="flex h-60 flex-col items-center justify-center gap-4 rounded-xl border border-gray-200 bg-gray-50 dark:border-dark-600 dark:bg-dark-800">
          <p className="text-sm text-gray-500 dark:text-dark-200">Offer letter not found</p>
          <Button onClick={() => navigate("/dashboards/hrm/view-offer-letters-list")} variant="outline">
            ← Back to List
          </Button>
        </div>
      </Page>
    );
  }

  const candidateName = `${offerLetter.prefix || ""} ${offerLetter.firstname || ""} ${
    offerLetter.middlename ? offerLetter.middlename + " " : ""
  }${offerLetter.lastname || ""}`.trim();

  const companyName = offerLetter.companyname || "Kailtech Test & Research Centre";
  const addedByUser = offerLetter.added_by_name || offerLetter.added_by || "HR Manager";
  const signatureDate = offerLetter.added_on ? formatDateTime(offerLetter.added_on) : formatDate(offerLetter.offerletterdate);

  return (
    <Page title="View Offer Letter::.Joining Process-Hrm">
      <div className="transition-content p-6 space-y-6">
        
        {/* On-screen Header Actions (hidden on print) */}
        <div className="flex items-center justify-between no-print border-b border-gray-100 dark:border-dark-600 pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/dashboards/hrm/view-offer-letters-list")}
              className="rounded-full p-2 hover:bg-gray-150 dark:hover:bg-dark-800 transition"
              title="Back to List"
            >
              <ArrowLeftIcon className="h-5 w-5 text-gray-600 dark:text-dark-200" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-dark-50">
                View Offer Letter
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Review candidate terms, salary structure breakdown, and print copies
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => navigate("/dashboards/hrm/view-offer-letters-list")}
              className="h-9 rounded-md px-4 text-gray-700 hover:bg-gray-100"
            >
              &lt;&lt; Back
            </Button>
            <Button
              onClick={() => window.print()}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow h-9 rounded-md px-4"
            >
              <PrinterIcon className="h-4 w-4" />
              <span>Print Letter</span>
            </Button>
          </div>
        </div>

        {/* Printable View Wrap */}
        <div className="print-area space-y-8">
          
          {/* PAGE 1: Offer Letter Body */}
          <Card className="page-sheet p-8 md:p-12 bg-white text-gray-800 dark:bg-white dark:text-gray-900 border-none shadow-soft relative overflow-hidden">
            {/* Page Borders/Watermark style via custom printing CSS */}
            <div className="relative z-10 space-y-8 h-full flex flex-col justify-between">
              
              {/* Header: Company Logo & Identity */}
              <div className="flex items-start justify-between border-b border-gray-100 pb-6">
                <div>
                  <img
                    src={offerLetter.companylogo || "/images/logo.png"}
                    alt="Company Logo"
                    className="h-16 w-auto object-contain"
                    onError={(e) => {
                      e.target.src = "/logo.png";
                    }}
                  />
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold tracking-wider text-blue-800 uppercase">
                    Employment Offer
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Date: {formatDate(offerLetter.offerletterdate)}
                  </div>
                </div>
              </div>

              {/* Title */}
              <div className="text-center">
                <h1 className="text-2xl font-extrabold text-gray-950 uppercase tracking-widest border-y border-gray-200 py-2 inline-block px-12">
                  OFFER LETTER
                </h1>
              </div>

              {/* Salutation */}
              <div className="space-y-4 text-sm leading-relaxed">
                <div>
                  <span className="font-bold text-gray-900">Dear {candidateName},</span>
                </div>
                <div>
                  <span className="font-bold text-gray-950 underline decoration-indigo-500 decoration-2">
                    Sub: Appointment for the post of {getDesignationName()} at {getBranchName()}.
                  </span>
                </div>
                <p className="mt-4">
                  We are glad to inform you that we have appointed you as a{" "}
                  <span className="font-bold text-gray-950">{getDesignationName()}</span> for the{" "}
                  <span className="font-bold text-gray-950">{getBranchName()}</span> in our{" "}
                  <span className="font-bold text-gray-950">{companyName}</span>. Your monthly Gross salary
                  would be <span className="font-bold text-gray-950">₹{offerLetter.gross}</span> and your approximate
                  date of joining would be <span className="font-bold text-gray-950">{formatDate(offerLetter.joiningdate)}</span>.
                </p>
              </div>

              {/* Terms and Conditions */}
              <div className="space-y-6 text-xs text-gray-800 leading-relaxed">
                <div>
                  <h3 className="text-sm font-extrabold text-gray-950 uppercase border-b border-gray-100 pb-1 mb-3 tracking-wide">
                    Terms and Conditions of Appointment
                  </h3>
                  
                  {/* Item 1 */}
                  <div className="space-y-1 mt-3">
                    <h4 className="font-bold text-gray-900">1. Probation & Confirmation</h4>
                    <p>
                      You will initially be on probation for{" "}
                      <span className="font-bold text-gray-950">{offerLetter.duration} Months</span>, which may
                      be extended or reduced at the sole discretion of the Management. The appointment is
                      terminable by the Management without any notice during this period. On completion of the
                      probation period, till such time that you are intimated in writing about your confirmation,
                      you will remain on probation.
                    </p>
                  </div>

                  {/* Item 2 */}
                  <div className="space-y-2 mt-4">
                    <h4 className="font-bold text-gray-900">2. Deputation / Change / Transfer of Employment</h4>
                    <p>
                      <span className="font-bold text-gray-950">(a)</span> You are liable to be transferred anywhere
                      in India or out of India at the sole discretion of the Management depending upon the organizational
                      exigencies. Your services may also be deputed to the Group/Sister Companies as deemed fit by the Management.
                    </p>
                    <p>
                      <span className="font-bold text-gray-950">(b)</span> Your place of work can be changed at the sole
                      discretion of the Management to any other branch, or other site either in existence or which may come
                      into existence. In such event, you will be issued a fresh letter informing you of such change.
                    </p>
                  </div>

                  {/* Item 3 */}
                  <div className="space-y-2 mt-4">
                    <h4 className="font-bold text-gray-900">3. General Service Guidelines</h4>
                    <p>
                      <span className="font-bold text-gray-950">(a)</span> You will be subject to the Rules and Regulations
                      of the Company and the service conditions as are in force at present or as may be introduced or amended
                      or extended or rescinded from time to time.
                    </p>
                    <p>
                      <span className="font-bold text-gray-950">(b)</span> You will inform, in writing, to the Management
                      any change of address within a week from the change of the same, failing which any communication sent to
                      your last known address shall be deemed to have been served on you.
                    </p>
                    <p>
                      <span className="font-bold text-gray-950">(c)</span> You shall not apply for any other job outside
                      without the prior written permission from the Management. In response to this communication of appointment,
                      you are required to confirm your acceptance by signing the duplicate copy of this order.
                    </p>
                  </div>
                </div>
              </div>

              {/* Signatures Footer */}
              <div className="grid grid-cols-2 gap-8 border-t border-gray-150 pt-8 mt-12 text-sm">
                <div>
                  <div className="font-bold text-gray-950">For: {companyName}</div>
                  
                  {/* Digital Signature Emblem */}
                  <div className="mt-4 p-3 border border-emerald-200 bg-emerald-50 rounded-lg inline-flex flex-col max-w-[280px]">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                      <svg className="h-4 w-4 shrink-0 fill-emerald-100 stroke-emerald-600 stroke-2" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="m9 12 2 2 4-4" strokeLinecap="round" strokeLinejoin="round"></path>
                      </svg>
                      <span>Electronically Signed</span>
                    </div>
                    <div className="text-xs text-gray-700 font-semibold mt-1">
                      {addedByUser}
                    </div>
                    <div className="text-[10px] text-gray-500 mt-0.5">
                      Date: {signatureDate} (GMT +5:30)
                    </div>
                  </div>
                  
                  <div className="mt-2 text-xs text-gray-600 font-semibold">HR Department</div>
                </div>

                <div className="flex flex-col justify-between items-end text-right">
                  <div className="font-bold text-gray-950">I Agree & Accept</div>
                  <div className="mt-16">
                    <div className="border-t border-dashed border-gray-400 w-48 mb-1"></div>
                    <div className="font-bold text-gray-900">{candidateName}</div>
                  </div>
                </div>
              </div>

              {/* Letterhead Footer Accent */}
              <div className="letterheadfooter w-full pt-8">
                <img
                  src="/images/letterheadfootermono.png"
                  alt=""
                  className="w-full h-8 object-contain opacity-25"
                  onError={(e) => { e.target.style.display = "none"; }}
                />
              </div>

            </div>
          </Card>

          {/* PAGE BREAK (in print) */}
          <div className="page-break" />

          {/* PAGE 2: Salary Structure Breakdown */}
          <Card className="page-sheet p-8 md:p-12 bg-white text-gray-800 dark:bg-white dark:text-gray-900 border-none shadow-soft relative overflow-hidden">
            <div className="relative z-10 space-y-6 h-full flex flex-col justify-between">
              
              {/* Header: Company Logo & Identity */}
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <img
                  src={offerLetter.companylogo || "/images/logo.png"}
                  alt="Company Logo"
                  className="h-12 w-auto object-contain"
                  onError={(e) => { e.target.src = "/logo.png"; }}
                />
                <div className="text-right">
                  <div className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    Salary Annexure
                  </div>
                  <div className="text-sm font-extrabold text-blue-900">
                    {candidateName}
                  </div>
                </div>
              </div>

              {/* Title */}
              <div className="text-center">
                <h2 className="text-lg font-black tracking-widest text-gray-900 border-b-2 border-gray-800 pb-1 inline-block uppercase">
                  SALARY STRUCTURE
                </h2>
              </div>

              {/* Salary Breakdown Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs border border-gray-300 border-collapse table-fixed">
                  <thead>
                    <tr className="bg-gray-100 text-gray-900">
                      <th className="border border-gray-300 w-16 p-2 text-center font-bold">Sr. No.</th>
                      <th className="border border-gray-300 p-2 text-left font-bold">Salary Allowance and Reimbursements</th>
                      <th className="border border-gray-300 w-32 p-2 text-right font-bold">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Gross */}
                    <tr className="font-extrabold bg-gray-50 text-gray-950">
                      <td className="border border-gray-300 p-2 text-center">—</td>
                      <td className="border border-gray-300 p-2 uppercase">Gross Salary Per Month</td>
                      <td className="border border-gray-300 p-2 text-right font-black">₹{offerLetter.gross}</td>
                    </tr>
                    {/* Components */}
                    <tr>
                      <td className="border border-gray-300 p-2 text-center">1</td>
                      <td className="border border-gray-300 p-2 text-gray-800">Basic Salary Per Month</td>
                      <td className="border border-gray-300 p-2 text-right">₹{offerLetter.basic}</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-2 text-center">2</td>
                      <td className="border border-gray-300 p-2 text-gray-800">H.R.A Per Month</td>
                      <td className="border border-gray-300 p-2 text-right">₹{offerLetter.hra}</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-2 text-center">3</td>
                      <td className="border border-gray-300 p-2 text-gray-800">Special Allowances (SA)</td>
                      <td className="border border-gray-300 p-2 text-right">₹{offerLetter.sa}</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-2 text-center">4</td>
                      <td className="border border-gray-300 p-2 text-gray-800">Bonus</td>
                      <td className="border border-gray-300 p-2 text-right">₹{offerLetter.bonus}</td>
                    </tr>

                    {/* Deductions Header */}
                    <tr className="font-extrabold bg-red-50/50 text-red-950">
                      <td className="border border-gray-300 p-2 text-center">—</td>
                      <td className="border border-gray-300 p-2" colSpan={2}>DEDUCTIONS (EMPLOYEE SIDE)</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-2 text-center">1</td>
                      <td className="border border-gray-300 p-2 text-gray-800">EPF for Employee contribution Per Month (12% on Basic+Special Allow.)</td>
                      <td className="border border-gray-300 p-2 text-right text-red-600">-₹{offerLetter.epfemp}</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-2 text-center">2</td>
                      <td className="border border-gray-300 p-2 text-gray-800">ESIC Employee contribution per Month (0.75% on Gross)</td>
                      <td className="border border-gray-300 p-2 text-right text-red-600">-₹{offerLetter.esicemp}</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-2 text-center">3</td>
                      <td className="border border-gray-300 p-2 text-gray-800">Professional Tax (PT)</td>
                      <td className="border border-gray-300 p-2 text-right text-red-600">-₹{offerLetter.pt}</td>
                    </tr>

                    {/* Net In Hand */}
                    <tr className="font-extrabold bg-emerald-50 text-emerald-950">
                      <td className="border border-gray-300 p-2 text-center">—</td>
                      <td className="border border-gray-300 p-2 uppercase">Net In Hand Salary</td>
                      <td className="border border-gray-300 p-2 text-right text-emerald-700 font-black">₹{offerLetter.netinhand}</td>
                    </tr>

                    {/* Employer Side Benefits Header */}
                    <tr className="font-extrabold bg-blue-50/50 text-blue-950">
                      <td className="border border-gray-300 p-2 text-center">—</td>
                      <td className="border border-gray-300 p-2" colSpan={2}>INVISIBLE BENEFITS BY EMPLOYER</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-2 text-center">1</td>
                      <td className="border border-gray-300 p-2 text-gray-800">Mobile Allowances Per Month</td>
                      <td className="border border-gray-300 p-2 text-right">₹{offerLetter.mobileallowance}</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-2 text-center">2</td>
                      <td className="border border-gray-300 p-2 text-gray-800">EPF for Employer contribution Per Month (12% on Basic+Special Allow.)</td>
                      <td className="border border-gray-300 p-2 text-right">₹{offerLetter.epfemployer}</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-2 text-center">3</td>
                      <td className="border border-gray-300 p-2 text-gray-800">ESIC for Employer contribution Per Month (3.25% Total Gross Salary)</td>
                      <td className="border border-gray-300 p-2 text-right">₹{offerLetter.esicemployer}</td>
                    </tr>

                    {/* CTC Totals */}
                    <tr className="font-bold bg-gray-50 text-gray-900">
                      <td className="border border-gray-300 p-2 text-center">—</td>
                      <td className="border border-gray-300 p-2 uppercase">Gross CTC Per Month</td>
                      <td className="border border-gray-300 p-2 text-right">₹{offerLetter.grossctcmonth}</td>
                    </tr>
                    <tr className="font-extrabold bg-blue-950 text-white dark:text-white">
                      <td className="border border-blue-950 p-2 text-center">—</td>
                      <td className="border border-blue-950 p-2 uppercase tracking-wide">Gross CTC Per Annual</td>
                      <td className="border border-blue-950 p-2 text-right text-yellow-400 font-black">₹{offerLetter.grossctcannual}</td>
                    </tr>

                    {/* Extra Facilities Header */}
                    <tr className="font-extrabold bg-gray-100 text-gray-900">
                      <th colSpan={3} className="border border-gray-300 p-2 text-center uppercase tracking-wider">
                        Extra Facilities after Confirmation
                      </th>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-2 text-center">1</td>
                      <td className="border border-gray-300 p-2 text-gray-700">Workmen Compensation (W.C)</td>
                      <td className="border border-gray-300 p-2 text-center text-gray-600">As Per Company Policy</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-2 text-center">2</td>
                      <td className="border border-gray-300 p-2 text-gray-700">Leave Allotments</td>
                      <td className="border border-gray-300 p-2 text-center text-gray-600">As Per Company Policy</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-2 text-center">3</td>
                      <td className="border border-gray-300 p-2 text-gray-700">Festival Holidays</td>
                      <td className="border border-gray-300 p-2 text-center text-gray-600">As Per Company Policy</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-2 text-center">4</td>
                      <td className="border border-gray-300 p-2 text-gray-700">Weekly off Approx</td>
                      <td className="border border-gray-300 p-2 text-center text-gray-600">52</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-2 text-center">5</td>
                      <td className="border border-gray-300 p-2 text-gray-700">Accommodation</td>
                      <td className="border border-gray-300 p-2 text-center text-gray-600">—</td>
                    </tr>

                    {/* Summary Check */}
                    <tr className="font-bold bg-gray-50 text-gray-900">
                      <td className="border border-gray-300 p-2 text-center">—</td>
                      <td className="border border-gray-300 p-2 uppercase">Gross CTC Per Month</td>
                      <td className="border border-gray-300 p-2 text-right">₹{offerLetter.grossctcmonth}</td>
                    </tr>
                    <tr className="font-bold bg-gray-50 text-gray-900">
                      <td className="border border-gray-300 p-2 text-center">—</td>
                      <td className="border border-gray-300 p-2 uppercase">Net In Hand Salary</td>
                      <td className="border border-gray-300 p-2 text-right">₹{offerLetter.netinhand}</td>
                    </tr>

                    {/* Increment Info Header */}
                    <tr className="font-extrabold bg-gray-100 text-gray-900">
                      <th colSpan={3} className="border border-gray-300 p-2 text-center uppercase tracking-wider">
                        Next Increment Schedule
                      </th>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-2 text-center">1</td>
                      <td className="border border-gray-300 p-2 text-gray-700">
                        Confirmation after <span className="font-bold text-gray-950">{offerLetter.duration} Months</span> of joining
                        though Interview based on your performance
                      </td>
                      <td className="border border-gray-300 p-2 text-center text-gray-600">—</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Annexure Footer Signatures */}
              <div className="grid grid-cols-2 gap-8 border-t border-gray-150 pt-6 mt-8 text-sm">
                <div>
                  <div className="font-bold text-gray-950">For: {companyName}</div>
                  
                  {/* Digital Signature Emblem duplicate */}
                  <div className="mt-3 p-3 border border-emerald-200 bg-emerald-50 rounded-lg inline-flex flex-col max-w-[280px]">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                      <svg className="h-4 w-4 shrink-0 fill-emerald-100 stroke-emerald-600 stroke-2" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="m9 12 2 2 4-4" strokeLinecap="round" strokeLinejoin="round"></path>
                      </svg>
                      <span>Electronically Signed</span>
                    </div>
                    <div className="text-xs text-gray-700 font-semibold mt-1">
                      {addedByUser}
                    </div>
                    <div className="text-[10px] text-gray-500 mt-0.5">
                      Date: {signatureDate} (GMT +5:30)
                    </div>
                  </div>
                  
                  <div className="mt-2 text-xs text-gray-600 font-semibold">HR Department</div>
                </div>

                <div className="flex flex-col justify-end items-end text-right">
                  <div className="font-bold text-gray-950">I Agree & Accept</div>
                  <div className="mt-12">
                    <div className="border-t border-dashed border-gray-400 w-48 mb-1"></div>
                    <div className="font-bold text-gray-900">{candidateName}</div>
                  </div>
                </div>
              </div>

            </div>
          </Card>
        </div>

      </div>

      {/* Styled Printable Page Layout Rules */}
      <style>{`
        @media print {
          /* Hide all application sidebars, navigation, scrollbars, headers & action buttons */
          body * {
            visibility: hidden;
          }
          .print-area, .print-area * {
            visibility: visible;
          }
          /* Align print block at top-left of the viewport */
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
          }
          /* Sheet boundary constraints */
          .page-sheet {
            page-break-inside: avoid;
            page-break-after: always;
            height: 297mm; /* Exact A4 height */
            width: 210mm; /* Exact A4 width */
            padding: 20mm 15mm !important;
            margin: 0 auto !important;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
            color: black !important;
          }
          .page-sheet table {
            color: black !important;
            border-color: #333 !important;
          }
          .page-sheet th, .page-sheet td {
            border-color: #333 !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
            height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .page-break {
            page-break-before: always !important;
          }
          @page {
            size: A4;
            margin: 0;
          }
        }
      `}</style>
    </Page>
  );
}
