// Import Dependencies
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "utils/axios";
import { toast } from "sonner";
import dayjs from "dayjs";

import clsx from "clsx";

// Local Imports
import { Page } from "components/shared/Page";
import { Button, Card } from "components/ui";

// ----------------------------------------------------------------------

export default function EditIndentApprove() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const id = searchParams.get("hakuna");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [indentData, setIndentData] = useState(null);
  const [products, setProducts] = useState([]);
  const [approvedQuantities, setApprovedQuantities] = useState({});

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
          
          const initialApproved = {};
          product_details.forEach((item) => {
            initialApproved[item.requirement_id] = item.quantity;
          });
          setApprovedQuantities(initialApproved);
        } else {
          toast.error("Failed to fetch approval details");
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

  const handleApprovedQuantityChange = (requirementId, value, maxQuantity) => {
    const numValue = value === "" ? "" : parseFloat(value);
    if (numValue !== "" && (isNaN(numValue) || numValue < 0)) return;
    
    if (numValue > maxQuantity) {
      toast.warning(`Approved quantity cannot exceed requested quantity (${maxQuantity})`);
      return;
    }

    setApprovedQuantities(prev => ({
      ...prev,
      [requirementId]: numValue
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const hasEmpty = products.some(p => approvedQuantities[p.requirement_id] === "");
    if (hasEmpty) {
      toast.error("Please fill all approved quantities");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        id: id,
        indent_number: indentData.indent_number,
        id_req: products.map(p => p.requirement_id),
        approved_quantity: products.map(p => approvedQuantities[p.requirement_id])
      };

      const response = await axios.post("/inventory/approve-indent", payload);

      if (response.data.success || response.data.status) {
        toast.success("Indent approved successfully ✅");
        navigate("/dashboards/inventory/purchase-requisition");
      } else {
        toast.error(response.data.message || "Failed to approve indent ❌");
      }
    } catch (error) {
      console.error("Error approving indent:", error);
      toast.error("Something went wrong while approving indent");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Page title="Approve Requisition">
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

  return (
    <Page title={`Approve Indent ${indentData.indent_number}`}>
      <div className="transition-content px-[var(--margin-x)] pb-8">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            Approve Requisition
          </h1>
          <Button
            variant="outline"
            onClick={() => navigate("/dashboards/inventory/purchase-requisition")}
            className="text-white bg-blue-600 hover:bg-blue-700 px-6"
          >
            &lt;&lt; Back to List
          </Button>
        </div>

        <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-dark-800 overflow-hidden">
          <form onSubmit={handleSubmit}>
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
                </div>
              </div>

              {/* Items Table */}
              <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-700">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800/50">
                    <tr>
                      <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 w-12 text-center">#</th>
                      <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Item Description</th>
                      <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 text-center w-32">Req. Qty</th>
                      <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 text-center w-40">Appr. Qty</th>
                      <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Remark</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {products.map((item, index) => (
                      <tr key={item.requirement_id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3 text-center text-gray-500 font-medium">{index + 1}</td>
                        <td className="px-4 py-3">
                          <div className="font-bold text-gray-800 dark:text-gray-200">{item.material_service_name}</div>
                          {item.specification && (
                            <div className="text-[10px] text-gray-500 mt-1 font-medium bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded inline-block">Spec: {item.specification}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-gray-700 dark:text-gray-300">
                          {item.quantity} <span className="text-[10px] text-gray-400 ml-1 uppercase">{item.unit_name || "No's"}</span>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            value={approvedQuantities[item.requirement_id]}
                            onChange={(e) => handleApprovedQuantityChange(item.requirement_id, e.target.value, item.quantity)}
                            className="w-full text-center h-9 text-sm font-bold text-green-600 rounded border border-gray-200 dark:border-gray-700 dark:bg-gray-900 focus:ring-1 focus:ring-green-500 outline-none"
                            min="0"
                            max={item.quantity}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-gray-500 text-xs italic font-medium">
                            {item.remark || "—"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-dark-900/50">
              <Button 
                type="submit" 
                disabled={submitting}
                className={clsx(
                  "!bg-green-600 !text-white rounded-lg px-10 py-2.5 text-sm font-semibold shadow-md transition hover:!bg-green-700 active:!bg-green-800",
                  submitting && "opacity-60 cursor-not-allowed"
                )}
              >
                {submitting ? "Processing..." : "Confirm Approval"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </Page>
  );
}