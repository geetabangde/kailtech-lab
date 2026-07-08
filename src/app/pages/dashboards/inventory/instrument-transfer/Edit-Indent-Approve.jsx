// Import Dependencies
import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import axios from "utils/axios";
import { toast } from "react-hot-toast";

// Local Imports
import { Card, Button } from "components/ui";
import { Page } from "components/shared/Page";

// ----------------------------------------------------------------------

export default function EditIndentApprove() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const indentId = searchParams.get("hakuna");

  const [loading, setLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  
  const [indentInfo, setIndentInfo] = useState({
    indent_number: "",
    emp_code: "",
    emp_name: "",
    priority: "",
    indent_type: "",
  });
  
  const [requirements, setRequirements] = useState([]);

  // Fetch the existing indent data
  useEffect(() => {
    if (!indentId) {
      toast.error("Invalid Indent ID");
      navigate("/dashboards/inventory/view-indent");
      return;
    }

    const fetchIndentData = async () => {
      try {
        setIsFetching(true);
        // Adjust endpoint based on your Node backend
        const response = await axios.get("inventory/get-indent-approve-data", {
          params: { id: indentId }
        });

        if (response.data.status) {
          setIndentInfo(response.data.data.info || {});
          
          // Map requirements and initialize approved_quantity
          const reqs = (response.data.data.requirements || []).map(req => ({
            ...req,
            approved_quantity: req.approved_quantity !== undefined ? req.approved_quantity : req.quantity
          }));
          
          setRequirements(reqs);
        } else {
          toast.error(response.data.message || "Failed to load indent data");
          navigate("/dashboards/inventory/view-indent");
        }
      } catch (err) {
        console.error("Error fetching indent data:", err);
        toast.error("An error occurred while fetching data");
      } finally {
        setIsFetching(false);
      }
    };

    fetchIndentData();
  }, [indentId, navigate]);

  const updateApprovedQty = (index, value) => {
    const numValue = Number(value);
    
    setRequirements(prev => prev.map((req, i) => {
      if (i === index) {
        // Validation logic to ensure approved qty doesn't exceed requested qty
        let validQty = numValue;
        if (numValue > req.quantity) {
          validQty = req.quantity;
          toast.error(`Approved quantity cannot exceed requested quantity (${req.quantity})`);
        } else if (numValue < 0) {
          validQty = 0;
        }
        
        return { ...req, approved_quantity: validQty };
      }
      return req;
    }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    const hasInvalidQty = requirements.some(req => 
      req.approved_quantity === "" || 
      req.approved_quantity === null || 
      req.approved_quantity < 0 || 
      req.approved_quantity > req.quantity
    );

    if (hasInvalidQty) {
      toast.error("Please ensure all approved quantities are valid (0 to requested amount)");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        id: indentId,
        requirements: requirements.map(req => ({
          id_req: req.id, // Requirement ID mapping
          approved_quantity: req.approved_quantity
        }))
      };

      // Adjust endpoint based on your Node backend
      const response = await axios.post("inventory/update-indent-approve", payload);

      if (response.data.status) {
        toast.success(response.data.message || "Indent approved successfully");
        navigate("/dashboards/inventory/view-indent");
      } else {
        toast.error(response.data.message || "Failed to approve indent");
      }
    } catch (err) {
      console.error("Submit error:", err);
      toast.error("An error occurred during submission");
    } finally {
      setLoading(false);
    }
  };

  if (isFetching) {
    return (
      <Page title="Approve Requisition">
        <div className="flex h-60 items-center justify-center">
          <p className="text-gray-500">Loading indent data...</p>
        </div>
      </Page>
    );
  }

  return (
    <Page title="Approve Requisition">
      <div className="transition-content w-full pb-5">
        <Card className="flex flex-col border-none shadow-soft dark:bg-dark-700">
          <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-dark-500 sm:p-5">
            <h3 className="text-lg font-bold text-gray-800 dark:text-dark-100">
              Approve Requisition
            </h3>
            <Button
              component={Link}
              to="/dashboards/inventory/view-indent"
              color="secondary"
              variant="outline"
              size="sm"
            >
              {"<< Back"}
            </Button>
          </div>

          <form onSubmit={onSubmit}>
            <div className="p-4 sm:p-5 space-y-8">
              
              {/* Requisition Information */}
              <div>
                <h5 className="mb-4 text-base font-bold text-gray-800 dark:text-gray-100">
                  Requisition Information
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Indent Number
                    </label>
                    <input
                      type="text"
                      disabled
                      value={indentInfo.indent_number}
                      className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-sm text-gray-500 dark:border-dark-600 dark:bg-dark-800"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Employee Code
                    </label>
                    <input
                      type="text"
                      disabled
                      value={indentInfo.emp_code}
                      className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-sm text-gray-500 dark:border-dark-600 dark:bg-dark-800"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Name of Employee
                    </label>
                    <input
                      type="text"
                      disabled
                      value={indentInfo.emp_name}
                      className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-sm text-gray-500 dark:border-dark-600 dark:bg-dark-800"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Priority
                    </label>
                    <input
                      type="text"
                      disabled
                      value={indentInfo.priority}
                      className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-sm text-gray-500 dark:border-dark-600 dark:bg-dark-800"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      New/Existing
                    </label>
                    <input
                      type="text"
                      disabled
                      value={indentInfo.indent_type}
                      className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-sm text-gray-500 dark:border-dark-600 dark:bg-dark-800"
                    />
                  </div>
                  
                </div>
              </div>

              {/* Product Details */}
              <div>
                <h5 className="mb-4 text-base font-bold text-gray-800 dark:text-gray-100">
                  Product Details
                </h5>
                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-dark-600">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-700 dark:bg-dark-800 dark:text-gray-200">
                      <tr>
                        <th className="px-4 py-3 w-[50px]">S.no</th>
                        <th className="px-4 py-3">Material / Services Name</th>
                        <th className="px-4 py-3 w-[150px]">Specification</th>
                        <th className="px-4 py-3 w-[100px]">Quantity</th>
                        <th className="px-4 py-3 w-[100px]">Unit</th>
                        <th className="px-4 py-3 w-[120px]">Approved Qty</th>
                        <th className="px-4 py-3 w-[150px]">Remark</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requirements.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                            No requirements found for this indent.
                          </td>
                        </tr>
                      ) : (
                        requirements.map((req, index) => (
                          <tr key={req.id || index} className="border-t border-gray-200 dark:border-dark-600">
                            <td className="px-4 py-3 font-medium">{index + 1}</td>
                            <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                              {req.item_name}
                            </td>
                            <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                              {req.specification}
                            </td>
                            <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                              {req.quantity}
                            </td>
                            <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                              {req.unit}
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                min="0"
                                max={req.quantity}
                                required
                                value={req.approved_quantity}
                                onChange={(e) => updateApprovedQty(index, e.target.value)}
                                className="w-full rounded border border-primary-300 bg-primary-50 px-2 py-1 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-primary-800 dark:bg-primary-900/20"
                              />
                            </td>
                            <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                              <div className="truncate max-w-[150px]" title={req.remark}>
                                {req.remark}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 p-4 dark:border-dark-600 dark:bg-dark-800/50 sm:px-5">
              <Button
                component={Link}
                to="/dashboards/inventory/view-indent"
                color="secondary"
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                color="primary"
                loading={loading}
                className="px-8"
              >
                Approve & Submit
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </Page>
  );
}
