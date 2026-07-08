// Import Dependencies
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "utils/axios";
import { toast } from "sonner";
import { Edit3 } from "lucide-react";
import dayjs from "dayjs";


// Local Imports
import { Page } from "components/shared/Page";
import { Button, Card } from "components/ui";
import { getStoredPermissions } from "app/navigation/dashboards";

// ----------------------------------------------------------------------

export default function ViewFullIndent() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const id = searchParams.get("hakuna");
  const permissions = getStoredPermissions();

  const [loading, setLoading] = useState(true);
  const [indentData, setIndentData] = useState(null);
  const [products, setProducts] = useState([]);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        toast.error("No indent ID provided");
        navigate("/dashboards/inventory/purchase-requisition");
        return;
      }

      try {
        setLoading(true);
        const response = await axios.get(`/inventory/view-approve-details/${id}`);
        
        if (response.data.success || response.data.status) {
          const { indent_information, product_details } = response.data.data;
          setIndentData(indent_information);
          setProducts(product_details || []);
        } else {
          toast.error("Failed to fetch indent details");
          navigate("/dashboards/inventory/purchase-requisition");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate]);

  if (loading) {
    return (
      <Page title="View Requisition">
        <div className="flex h-[60vh] items-center justify-center text-gray-600">
          <svg className="mr-2 h-6 w-6 animate-spin text-blue-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z" />
          </svg>
          Loading Details...
        </div>
      </Page>
    );
  }

  if (!indentData) return null;

  const canEdit = permissions.includes(196) && indentData.status === 1;

  return (
    <Page title={`Requisition Detail - ${indentData.indent_number}`}>
      <div className="transition-content px-[var(--margin-x)] pb-8">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            Requisition Details
          </h1>
          <div className="flex items-center gap-3">
            {canEdit && (
              <Button
                onClick={() => navigate(`/dashboards/inventory/purchase-requisition/edit-indent?hakuna=${id}`)}
                className="text-white bg-amber-500 hover:bg-amber-600 px-6 font-semibold"
              >
                <Edit3 className="w-4 h-4 mr-2" /> Edit
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => navigate("/dashboards/inventory/purchase-requisition")}
              className="text-white bg-blue-600 hover:bg-blue-700 px-6 font-semibold"
            >
              &lt;&lt; Back to List
            </Button>
          </div>
        </div>

        <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-dark-800 overflow-hidden">
          <div className="p-6">
            {/* Info Table */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl border border-gray-100 dark:border-gray-700">
              <div className="space-y-3">
                <div className="flex text-sm">
                  <span className="font-semibold w-32 text-gray-500 uppercase text-xs tracking-wider">Indent No:</span>
                  <span className="text-gray-800 dark:text-gray-200 font-bold">{indentData.indent_number}</span>
                </div>
                <div className="flex text-sm">
                  <span className="font-semibold w-32 text-gray-500 uppercase text-xs tracking-wider">Employee:</span>
                  <span className="text-gray-800 dark:text-gray-200 font-bold">{indentData.employee_name} ({indentData.employee_code})</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex text-sm">
                  <span className="font-semibold w-32 text-gray-500 uppercase text-xs tracking-wider">Date:</span>
                  <span className="text-gray-800 dark:text-gray-200 font-bold">{dayjs(indentData.added_on).format("DD-MM-YYYY")}</span>
                </div>
                <div className="flex text-sm">
                  <span className="font-semibold w-32 text-gray-500 uppercase text-xs tracking-wider">Priority:</span>
                  <span className="text-gray-800 dark:text-gray-200 font-bold">{indentData.priority}</span>
                </div>
                <div className="flex text-sm">
                  <span className="font-semibold w-32 text-gray-500 uppercase text-xs tracking-wider">Type:</span>
                  <span className="text-gray-800 dark:text-gray-200 font-bold">{indentData.indent_type}</span>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-700">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800/50">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 w-12 text-center">#</th>
                    <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Material / Service Name</th>
                    <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Specification</th>
                    <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 text-center w-24">Req. Qty</th>
                    <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 text-center w-24">Appr. Qty</th>
                    <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 text-center w-24">Rem. Qty</th>
                    <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Remark</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {products.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 text-center text-gray-500 font-medium">{index + 1}</td>
                      <td className="px-4 py-3 font-bold text-gray-800 dark:text-gray-200">{item.material_service_name}</td>
                      <td className="px-4 py-3">
                        <div className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded inline-block">
                          {item.specification || "—"}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-gray-700 dark:text-gray-300">
                        {item.quantity} <span className="text-[10px] text-gray-400 ml-0.5 uppercase">{item.unit_name || "No's"}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {item.approved_quantity ? (
                          <span className="font-bold text-green-600">{item.approved_quantity}</span>
                        ) : (
                          <span className="text-gray-400 italic text-xs">Pending</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-gray-600 dark:text-gray-400 font-medium">{item.remainingqty !== "" ? item.remainingqty : "—"}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-gray-500 text-xs italic font-medium">{item.remark || "—"}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      </div>
    </Page>
  );
}
