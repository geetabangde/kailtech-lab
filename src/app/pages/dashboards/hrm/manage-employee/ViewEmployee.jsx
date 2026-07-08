import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "utils/axios";
import clsx from "clsx";
import { Menu } from "@headlessui/react";

// Local Imports
import { Page } from "components/shared/Page";
import { Card } from "components/ui";
import { toast } from "sonner";

// ----------------------------------------------------------------------

export default function ViewEmployee() {
    const { id } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchEmployeeDetails = async () => {
            try {
                setLoading(true);
                setError(false);
                // Using the specific get-employee-byid endpoint
                const response = await axios.get(`/hrm/get-employee-byid/${id}`);

                if (response.data.status === true) {
                    setData(response.data.data);
                } else {
                    throw new Error(response.data.message || "Failed to fetch data");
                }
            } catch (err) {
                console.error("Error fetching employee details:", err);
                toast.error("Failed to load employee details.");
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        fetchEmployeeDetails();
    }, [id]);

    // Safe destructuring: fallback to flat data object if employee isn't present
    const emp = data?.employee || {};

    const employeeCode = emp.empid || "-";
    const name = [emp.prefix, emp.firstname, emp.middlename, emp.lastname].filter(Boolean).join(" ") || "-";
    const fatherName = [emp.prefixfather, emp.fathersname].filter(Boolean).join(" ") || "-";
    const motherName = [emp.prefixmother, emp.mothersname].filter(Boolean).join(" ") || "-";
    const husbandWifeName = [emp.prefixhusband, emp.husbandname].filter(Boolean).join(" ") || "-";

    const gender = data?.gender?.find(g => g.id === emp.gender)?.name || "-";
    const maritalStatus = data?.maritalstatus?.find(m => m.id === emp.marital)?.name || "-";
    const bloodGroup = data?.bloodgroup?.find(b => b.id === emp.bloodgroup)?.name || "-";

    if (loading) {
        return (
            <Page title="Employee Details">
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
            </Page>
        );
    }

    if (error || !data) {
        return (
            <Page title="Employee Details">
                <div className="text-center text-red-500 py-12">
                    Failed to load employee details. Please try again.
                </div>
            </Page>
        );
    }

    return (
        <Page title="Employee Details">
            <div className="w-full max-w-7xl mx-auto">
                <Card className="overflow-hidden bg-white shadow dark:bg-dark-900 border border-gray-200 dark:border-dark-700">

                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border-b border-gray-200 dark:border-dark-700 bg-gray-50/50 dark:bg-dark-800/50">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 sm:mb-0">
                            View Employee
                        </h3>
                        <div className="flex items-center gap-3">
                            <Link
                                to="/dashboards/hrm/manage-employee"
                                className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:border-dark-600 dark:bg-dark-800 dark:text-gray-300 dark:hover:bg-dark-700 dark:focus:ring-offset-dark-900 transition"
                            >
                                &lt;&lt; Back
                            </Link>

                            <Menu as="div" className="relative inline-block text-left">
                                <div>
                                    <Menu.Button className="inline-flex w-full justify-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-primary-600 shadow-sm ring-1 ring-inset ring-primary-300 hover:bg-primary-50 dark:bg-dark-800 dark:text-primary-400 dark:ring-primary-900 dark:hover:bg-dark-700 transition">
                                        Employee Details
                                        <svg className="-mr-1 h-5 w-5 text-primary-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                                        </svg>
                                    </Menu.Button>
                                </div>

                                <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-dark-800 dark:ring-white/10">
                                    <div className="py-1">
                                        <DropdownLink to={`/dashboards/hrm/manage-employee/view/${id}`} label="Employee Profile" active />
                                        <DropdownLink to={`/dashboards/hrm/manage-employee/${id}/family-detail`} label="Family Detail" />
                                        <DropdownLink to={`/dashboards/hrm/manage-employee/${id}/education-detail`} label="Education Detail" />
                                        <DropdownLink to={`/dashboards/hrm/manage-employee/${id}/employment-detail`} label="Employment Detail" />
                                        <DropdownLink to={`/dashboards/hrm/manage-employee/${id}/emergency-contact`} label="Emergency Contact Detail" />
                                        <DropdownLink to={`/dashboards/hrm/manage-employee/${id}/references`} label="References" />
                                        <DropdownLink to={`/dashboards/hrm/manage-employee/${id}/documents`} label="Employee Document" />
                                        <DropdownLink to={`/dashboards/hrm/manage-employee/${id}/salary-designation`} label="Salary and Designation" />
                                        <DropdownLink to={`/dashboards/hrm/manage-employee/${id}/insurance`} label="Insurance Detail" />
                                        <DropdownLink to={`/dashboards/hrm/manage-employee/${id}/bank-account`} label="Bank Account Detail" />
                                    </div>
                                </Menu.Items>
                            </Menu>
                        </div>
                    </div>

                    {/* Form Body */}
                    <div className="p-5 sm:p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">

                            <DetailRow label="Name" value={name} />
                            <DetailRow label="Employee Code" value={employeeCode} />

                            <DetailRow label="Father's Name" value={fatherName} />
                            <DetailRow label="Mother's Name" value={motherName} />

                            <DetailRow label="Husband's/Wife's Name" value={husbandWifeName} />
                            <DetailRow label="Joining Date" value={emp.joiningdate} />

                            <DetailRow label="Gender" value={gender} />
                            <DetailRow label="Date Of Birth" value={emp.dob} />

                            <DetailRow label="Local Address" value={emp.localaddress} fullWidth />
                            <DetailRow label="Permanent Address" value={emp.permanentaddress} fullWidth />

                            <DetailRow label="Marital Status" value={maritalStatus} />
                            <DetailRow label="Blood Group" value={bloodGroup} />

                            <DetailRow label="Mobile" value={emp.mobile} />
                            <DetailRow label="Email" value={emp.email} />

                            <DetailRow label="Aadhar Card No" value={emp.aadharno} />
                            <DetailRow label="Pan Card No" value={emp.panno} />

                            {/* Photo & Sign row */}
                            <div className="flex flex-col sm:flex-row sm:items-start border-b border-dashed border-gray-200 pb-3 dark:border-dark-600">
                                <span className="w-full sm:w-1/3 text-sm font-semibold text-gray-600 dark:text-dark-300 mb-1 sm:mb-0">Photo</span>
                                <span className="w-full sm:w-2/3">
                                    {emp.photo_url ? (
                                        <img src={emp.photo_url} alt="Employee" className="w-24 h-24 object-cover rounded border border-gray-200 dark:border-dark-600 shadow-sm" />
                                    ) : (
                                        <div className="w-24 h-24 bg-gray-100 dark:bg-dark-700 rounded border border-gray-200 dark:border-dark-600 flex items-center justify-center text-xs text-gray-400">No Photo</div>
                                    )}
                                </span>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-start border-b border-dashed border-gray-200 pb-3 dark:border-dark-600">
                                <span className="w-full sm:w-1/3 text-sm font-semibold text-gray-600 dark:text-dark-300 mb-1 sm:mb-0">Sign</span>
                                <span className="w-full sm:w-2/3">
                                    {emp.signature_url ? (
                                        <img src={emp.signature_url} alt="Signature" className="w-36 h-12 object-contain border border-gray-200 dark:border-dark-600 shadow-sm bg-white" />
                                    ) : (
                                        <div className="w-36 h-12 bg-gray-100 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 flex items-center justify-center text-xs text-gray-400 italic">No Signature</div>
                                    )}
                                </span>
                            </div>

                            <DetailRow label="Probation Period" value={emp.probationduration} />

                        </div>
                    </div>
                </Card>
            </div>
        </Page>
    );
}

// Subcomponents for cleaner layout
function DetailRow({ label, value, fullWidth = false }) {
    // Safely extract string if value is an object (like the gender or blood_group lookup objects)
    const displayValue = value && typeof value === 'object' ? (value.name || value.title || "-") : value;

    return (
        <div className={clsx("flex flex-col sm:flex-row sm:items-start border-b border-dashed border-gray-200 pb-3 dark:border-dark-600", fullWidth && "md:col-span-2")}>
            <span className={clsx("text-sm font-semibold text-gray-600 dark:text-dark-300 mb-1 sm:mb-0", fullWidth ? "sm:w-1/4 md:w-[16.666%]" : "w-full sm:w-1/3")}>{label}</span>
            <span className={clsx("text-sm text-gray-900 dark:text-dark-100 font-medium", fullWidth ? "sm:w-3/4 md:w-[83.333%] break-words" : "w-full sm:w-2/3 break-words")}>{displayValue || "-"}</span>
        </div>
    );
}

function DropdownLink({ to, label, active = false }) {
    return (
        <Menu.Item>
            {({ active: hoverActive }) => (
                <Link
                    to={to}
                    className={clsx(
                        hoverActive ? 'bg-gray-100 text-gray-900 dark:bg-dark-700 dark:text-white' : 'text-gray-700 dark:text-gray-200',
                        active ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400 font-medium' : '',
                        'block px-4 py-2 text-sm transition-colors'
                    )}
                >
                    {label}
                </Link>
            )}
        </Menu.Item>
    );
}
