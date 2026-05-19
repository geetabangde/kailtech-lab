import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Card, Button, Table, THead, TBody, Tr, Th, Td } from "components/ui";
import { Page } from "components/shared/Page";
import axios from "utils/axios";
import { toast } from "sonner";

// ----------------------------------------------------------------------

export default function ViewMrnItems() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [mrnDetails, setMrnDetails] = useState(location.state?.mrn || null);
  const [items, setItems] = useState([]);

  useEffect(() => {
    const fetchMrnItems = async () => {
      try {
        setLoading(true);
        // API Endpoint: inventory/get-mrn-item?id=163
        const response = await axios.get(`/inventory/get-mrn-item?id=${id}`);
        
        // Handle standard status check (status can be true/false or "true"/"false")
        if (response.data.status === true || response.data.status === "true") {
          const resData = response.data.data || response.data;
          
          if (resData) {
            // Handle if API returns { mrn: {...}, items: [...] }
            if (resData.mrn) {
              setMrnDetails((prev) => prev || resData.mrn);
              setItems(resData.items || []);
            } else if (resData.items) {
              setItems(resData.items);
            } else if (Array.isArray(resData)) {
              // Handle if API returns items list directly
              setItems(resData);
            } else {
              setItems(resData.items || []);
            }
          }
        } else {
          toast.error("Failed to load MRN items");
        }
      } catch (err) {
        console.error("Error fetching MRN items:", err);
        toast.toast ? toast.error("Something went wrong while fetching MRN items") : toast.error("Something went wrong while fetching MRN items");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchMrnItems();
  }, [id]);

  // Calculations for totals
  const totalQty = items.reduce((sum, item) => sum + (parseFloat(item.qty) || 0), 0);
  const totalReceived = items.reduce((sum, item) => sum + (parseFloat(item.receiveqty || item.received_qty) || 0), 0);
  const totalRemaining = items.reduce((sum, item) => sum + (parseFloat(item.remainingqty || item.remaining_qty) || 0), 0);
  const totalAmount = items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

  if (loading) {
    return (
      <Page title="View MRN Items">
        <div className="flex h-[60vh] items-center justify-center text-gray-600">
          <svg className="animate-spin h-6 w-6 mr-2 text-blue-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z"></path>
          </svg>
          Loading MRN Items...
        </div>
      </Page>
    );
  }

  return (
    <Page title="Material Receipt Note Items">
      <div className="transition-content p-6">
        
        {/* Header section */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold tracking-wide text-gray-800 dark:text-dark-50">
              MRN Items List
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Details of materials received under Challan No: <span className="font-semibold text-primary-600">{mrnDetails?.challanno || id}</span>
            </p>
          </div>
          <Button
            variant="outline"
            className="border-gray-300 text-gray-700 dark:text-dark-200"
            onClick={() => navigate(-1)}
          >
            &laquo; Back to List
          </Button>
        </div>

        {/* Challan Details Card */}
        {mrnDetails && (
          <Card className="p-6 mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 bg-gradient-to-br from-white to-gray-50 dark:from-dark-800 dark:to-dark-900 border border-gray-150 shadow-soft">
            <div>
              <span className="block text-xs font-semibold text-gray-400 dark:text-dark-300 uppercase tracking-wider mb-1">
                Vendor Name
              </span>
              <span className="text-sm font-semibold text-gray-800 dark:text-dark-50">
                {mrnDetails.customername || mrnDetails.vendor_name || "—"}
              </span>
            </div>
            <div>
              <span className="block text-xs font-semibold text-gray-400 dark:text-dark-300 uppercase tracking-wider mb-1">
                Challan Number
              </span>
              <span className="text-sm font-semibold text-gray-800 dark:text-dark-50">
                {mrnDetails.challanno || "—"}
              </span>
            </div>
            <div>
              <span className="block text-xs font-semibold text-gray-400 dark:text-dark-300 uppercase tracking-wider mb-1">
                Challan Date
              </span>
              <span className="text-sm font-semibold text-gray-800 dark:text-dark-50">
                {mrnDetails.challandate ? new Date(mrnDetails.challandate).toLocaleDateString("en-GB") : "—"}
              </span>
            </div>
            <div>
              <span className="block text-xs font-semibold text-gray-400 dark:text-dark-300 uppercase tracking-wider mb-1">
                PO Number
              </span>
              <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                {mrnDetails.ponumber || "—"}
              </span>
            </div>
          </Card>
        )}

        {/* Items Table Card */}
        <Card className="p-6 overflow-hidden shadow-soft dark:bg-dark-800">
          <div className="table-responsive">
            <Table hoverable className="w-full text-left border-collapse">
              <THead>
                <Tr>
                  <Th className="bg-gray-100 dark:bg-dark-700 text-center font-bold text-gray-700 dark:text-dark-200 py-3 w-[60px]">Sr.No</Th>
                  <Th className="bg-gray-100 dark:bg-dark-700 font-bold text-gray-700 dark:text-dark-200 py-3">Description</Th>
                  <Th className="bg-gray-100 dark:bg-dark-700 font-bold text-gray-700 dark:text-dark-200 py-3 text-center w-[120px]">HSN Code</Th>
                  <Th className="bg-gray-100 dark:bg-dark-700 font-bold text-gray-700 dark:text-dark-200 py-3 text-center w-[100px]">UOM</Th>
                  <Th className="bg-gray-100 dark:bg-dark-700 font-bold text-gray-700 dark:text-dark-200 py-3 text-right w-[100px]">Qty</Th>
                  <Th className="bg-gray-100 dark:bg-dark-700 font-bold text-gray-700 dark:text-dark-200 py-3 text-right w-[120px]">Received Qty</Th>
                  <Th className="bg-gray-100 dark:bg-dark-700 font-bold text-gray-700 dark:text-dark-200 py-3 text-right w-[120px]">Remaining Qty</Th>
                  <Th className="bg-gray-100 dark:bg-dark-700 font-bold text-gray-700 dark:text-dark-200 py-3 text-right w-[120px]">Price (Rate)</Th>
                  <Th className="bg-gray-100 dark:bg-dark-700 font-bold text-gray-700 dark:text-dark-200 py-3 text-right w-[140px]">Amount</Th>
                  <Th className="bg-gray-100 dark:bg-dark-700 font-bold text-gray-700 dark:text-dark-200 py-3 w-[180px]">Remark</Th>
                </Tr>
              </THead>
              <TBody>
                {items.length === 0 ? (
                  <Tr>
                    <Td colSpan={10} className="text-center py-8 text-gray-500">
                      No items found in this MRN.
                    </Td>
                  </Tr>
                ) : (
                  items.map((item, index) => (
                    <Tr key={item.id || index} className="border-b border-gray-100 dark:border-dark-700 hover:bg-gray-50/50">
                      <Td className="text-center font-medium text-gray-500 py-4">{index + 1}</Td>
                      <Td className="font-semibold text-gray-800 dark:text-dark-50 py-4 max-w-[250px] break-words">
                        {item.description || "—"}
                      </Td>
                      <Td className="text-center font-mono text-xs text-gray-600 dark:text-dark-200 py-4">
                        {item.hsn || "—"}
                      </Td>
                      <Td className="text-center text-gray-600 dark:text-dark-200 py-4">
                        {item.uom_name || item.uom || "—"}
                      </Td>
                      <Td className="text-right font-medium text-gray-800 dark:text-dark-100 py-4">
                        {parseFloat(item.qty || 0).toLocaleString()}
                      </Td>
                      <Td className="text-right font-semibold text-success-600 dark:text-success-400 py-4">
                        {parseFloat(item.receiveqty || item.received_qty || 0).toLocaleString()}
                      </Td>
                      <Td className="text-right font-semibold text-warning-600 dark:text-warning-400 py-4">
                        {parseFloat(item.remainingqty || item.remaining_qty || 0).toLocaleString()}
                      </Td>
                      <Td className="text-right font-mono text-gray-700 dark:text-dark-200 py-4">
                        ₹{parseFloat(item.rate || 0).toFixed(2)}
                      </Td>
                      <Td className="text-right font-mono font-semibold text-gray-900 dark:text-white py-4">
                        ₹{parseFloat(item.amount || 0).toFixed(2)}
                      </Td>
                      <Td className="text-gray-600 dark:text-dark-200 py-4 text-xs italic">
                        {item.remark || "—"}
                      </Td>
                    </Tr>
                  ))
                )}
                {items.length > 0 && (
                  <Tr className="bg-gray-50/70 dark:bg-dark-900/50 font-semibold text-gray-800 dark:text-dark-50 border-t-2 border-gray-200 dark:border-dark-600">
                    <Td colSpan={4} className="text-right py-4 font-bold text-gray-700 dark:text-dark-200">
                      Total
                    </Td>
                    <Td className="text-right py-4">{totalQty.toLocaleString()}</Td>
                    <Td className="text-right py-4 text-success-600 dark:text-success-400">{totalReceived.toLocaleString()}</Td>
                    <Td className="text-right py-4 text-warning-600 dark:text-warning-400">{totalRemaining.toLocaleString()}</Td>
                    <Td className="text-right py-4">—</Td>
                    <Td className="text-right py-4 font-mono font-bold text-lg text-primary-600 dark:text-primary-400">
                      ₹{totalAmount.toFixed(2)}
                    </Td>
                    <Td className="py-4">—</Td>
                  </Tr>
                )}
              </TBody>
            </Table>
          </div>
        </Card>
      </div>
    </Page>
  );
}
