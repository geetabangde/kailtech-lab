// Import Dependencies
import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { Button, Card, Spinner } from "components/ui";
import { Page } from "components/shared/Page";
import axios from "utils/axios";
import { toast } from "sonner";
import { ArrowLeftIcon, PrinterIcon } from "@heroicons/react/24/outline";
import dayjs from "dayjs";

// ----------------------------------------------------------------------

export default function ViewRoleRequest() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const permissions = useMemo(() => {
    const raw = localStorage.getItem("userPermissions") || "[]";
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.map(Number) : [];
    } catch {
      return raw.trim().replace(/^\[/, "").replace(/\]$/, "").split(",").map(Number).filter((n) => !isNaN(n));
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Assuming the endpoint accepts an ID. Adjust if the API structure is different.
        const response = await axios.get(`/quality-documents/get-role-request-detail?id=${id}`);
        if (response.data) {
          setData(response.data);
        } else {
          toast.error("Role request details not found ❌");
        }
      } catch (err) {
        console.error("Error fetching role request details:", err);
        toast.error("Failed to fetch role request details ❌");
      } finally {
        setLoading(false);
      }
    };

    if (permissions.includes(471)) {
      fetchData();
    }
  }, [id, permissions]);

  const handlePrint = () => {
    window.print();
  };

  if (!permissions.includes(471)) {
    return (
      <Page title="Role Request – Access Denied">
        <div className="flex h-60 items-center justify-center rounded-xl border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-sm font-medium text-red-600 dark:text-red-400">
            ⛔ Access Denied — Permission 471 required
          </p>
        </div>
      </Page>
    );
  }

  if (loading) {
    return (
      <Page title="Role Request form">
        <div className="flex h-60 items-center justify-center">
          <Spinner size="lg" />
        </div>
      </Page>
    );
  }

  if (!data) {
    return (
      <Page title="Role Request form">
        <div className="text-center py-20">
          <p className="text-gray-500">Details not available.</p>
          <Button 
            className="mt-4"
            onClick={() => navigate("/dashboards/quality-documents/role-request")}
          >
            Back to List
          </Button>
        </div>
      </Page>
    );
  }

  return (
    <Page title="Role Request form">
      <div className="px-[var(--margin-x)] py-6 max-w-5xl mx-auto">
        {/* Actions Bar (No Print) */}
        <div className="flex items-center justify-between mb-6 no-print">
          <Button
            variant="flat"
            onClick={() => navigate("/dashboards/quality-documents/role-request")}
            prefix={<ArrowLeftIcon className="size-4" />}
          >
            Back to List
          </Button>
          <Button
            color="primary"
            onClick={handlePrint}
            prefix={<PrinterIcon className="size-4" />}
          >
            Print Form
          </Button>
        </div>

        <Card className="p-8 bg-white dark:bg-dark-900 border-gray-300 dark:border-dark-400 shadow-lg print:shadow-none print:border-none print:p-0">
          {/* Header Section */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-400">
              <tbody>
                <tr>
                  <td rowSpan={6} className="border border-gray-400 p-4 w-1/5 text-center align-top">
                    <img 
                      src="/images/letterhead.jpg" 
                      alt="Logo" 
                      className="mx-auto mb-2 w-36 object-contain"
                      onError={(e) => { e.target.src = "https://via.placeholder.com/150x50?text=Logo"; }}
                    />
                    <div className="text-[10px] font-bold uppercase text-gray-700 dark:text-dark-200">
                      KAILTECH TEST AND RESEARCH CENTRE
                    </div>
                  </td>
                  <th rowSpan={6} className="border border-gray-400 p-4 w-1/2 text-center text-xl font-bold uppercase bg-gray-50 dark:bg-dark-800">
                    REQUEST FORM – OPERATION OF LIMS
                  </th>
                  <th className="border border-gray-400 p-2 text-left text-xs font-semibold w-[15%]">QF. No.</th>
                  <td className="border border-gray-400 p-2 text-xs">KTRC/QF/0804/02/01</td>
                </tr>
                <tr>
                  <th className="border border-gray-400 p-2 text-left text-xs font-semibold">Issue No.</th>
                  <td className="border border-gray-400 p-2 text-xs">01</td>
                </tr>
                <tr>
                  <th className="border border-gray-400 p-2 text-left text-xs font-semibold">Issue Date</th>
                  <td className="border border-gray-400 p-2 text-xs">15.6.2023</td>
                </tr>
                <tr>
                  <th className="border border-gray-400 p-2 text-left text-xs font-semibold">Revision No.</th>
                  <td className="border border-gray-400 p-2 text-xs">-</td>
                </tr>
                <tr>
                  <th className="border border-gray-400 p-2 text-left text-xs font-semibold">Revision Date</th>
                  <td className="border border-gray-400 p-2 text-xs">-</td>
                </tr>
                <tr>
                  <th className="border border-gray-400 p-2 text-left text-xs font-semibold">Page</th>
                  <td className="border border-gray-400 p-2 text-xs">1 of 1</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-8 space-y-6">
            <table className="w-full border-collapse border border-gray-400">
              <tbody>
                <tr className="border-b border-gray-400">
                  <th colSpan={2} className="border-r border-gray-400 p-3 text-left w-1/3 bg-gray-50 dark:bg-dark-800 font-semibold">Date</th>
                  <td className="p-3 font-medium">{data.addedon ? dayjs(data.addedon).format("DD/MM/YYYY") : "—"}</td>
                </tr>
                <tr className="border-b border-gray-400">
                  <th colSpan={2} className="border-r border-gray-400 p-3 text-left bg-gray-50 dark:bg-dark-800 font-semibold">Name of Employee</th>
                  <td className="p-3 font-medium">{data.employee_name || "—"}</td>
                </tr>
                <tr className="border-b border-gray-400">
                  <th colSpan={2} className="border-r border-gray-400 p-3 text-left bg-gray-50 dark:bg-dark-800 font-semibold">Employee ID</th>
                  <td className="p-3 font-medium">{data.employee_id || "—"}</td>
                </tr>
                <tr className="border-b border-gray-400">
                  <th colSpan={2} className="border-r border-gray-400 p-3 text-left bg-gray-50 dark:bg-dark-800 font-semibold">Add / Modify / Delete</th>
                  <td className="p-3 font-medium capitalize">{data.action || "—"}</td>
                </tr>
                <tr className="border-b border-gray-400">
                  <th colSpan={2} className="border-r border-gray-400 p-3 text-left bg-gray-50 dark:bg-dark-800 font-semibold">Reason</th>
                  <td className="p-3">{data.reason || "—"}</td>
                </tr>

                {/* If Add Section */}
                <tr className="border-b border-gray-400">
                  <th className="border-r border-gray-400 p-3 text-left bg-gray-50 dark:bg-dark-800 font-semibold w-1/4">If Add</th>
                  <th className="border-r border-gray-400 p-3 text-left bg-gray-50 dark:bg-dark-800 font-medium w-1/4">• Role request</th>
                  <td className="p-3">{data.rolerequest || "—"}</td>
                </tr>

                {/* If Modify Section */}
                <tr className="border-b border-gray-400">
                  <th rowSpan={3} className="border-r border-gray-400 p-3 text-left bg-gray-50 dark:bg-dark-800 font-semibold">If Modify</th>
                  <th className="border-r border-gray-400 p-3 text-left bg-gray-50 dark:bg-dark-800 font-medium text-sm">• Current Role</th>
                  <td className="p-3">{data.currentrole || "—"}</td>
                </tr>
                <tr className="border-b border-gray-400">
                  <th className="border-r border-gray-400 p-3 text-left bg-gray-50 dark:bg-dark-800 font-medium text-sm">• New Role</th>
                  <td className="p-3">{data.newrole || "—"}</td>
                </tr>
                <tr className="border-b border-gray-400">
                  <th className="border-r border-gray-400 p-3 text-left bg-gray-50 dark:bg-dark-800 font-medium text-sm">• Additional responsibility requested</th>
                  <td className="p-3">{data.additionalrole || "—"}</td>
                </tr>

                {/* If Delete Section */}
                <tr>
                  <th className="border-r border-gray-400 p-3 text-left bg-gray-50 dark:bg-dark-800 font-semibold">If Delete</th>
                  <th className="border-r border-gray-400 p-3 text-left bg-gray-50 dark:bg-dark-800 font-medium">• Role to Remove</th>
                  <td className="p-3">{data.roleRemove || "—"}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        {/* Global Print Styles */}
        <style>
          {`
            @media print {
              .no-print {
                display: none !important;
              }
              body {
                background: white !important;
                padding: 0 !important;
                margin: 0 !important;
              }
              .Page-root {
                padding: 0 !important;
                margin: 0 !important;
              }
              table {
                border-color: #000 !important;
              }
              th, td {
                border-color: #000 !important;
                color: #000 !important;
              }
            }
          `}
        </style>
      </div>
    </Page>
  );
}
