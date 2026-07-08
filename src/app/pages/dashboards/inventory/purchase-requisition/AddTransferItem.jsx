// Import Dependencies
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "utils/axios";
import { toast } from "sonner";
import clsx from "clsx";


// Local Imports
import { Page } from "components/shared/Page";
import { Button, Card } from "components/ui";


// ----------------------------------------------------------------------

export default function AddTransferItem() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const indentId = searchParams.get("hakuna");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [items, setItems] = useState([]);
  const [fromLocations, setFromLocations] = useState([]);
  const [toLocations, setToLocations] = useState([]);
  const [quantityInfo, setQuantityInfo] = useState(null);
  const [sourceQty, setSourceQty] = useState("");

  const [formData, setFormData] = useState({
    item_name: "",
    from_location: "",
    to_location: "",
    qty: ""
  });

  // Fetch Initial Items
  useEffect(() => {
    const fetchInitialData = async () => {
      if (!indentId) {
        toast.error("No indent ID provided");
        navigate("/dashboards/inventory/purchase-requisition/stock-transfer-list");
        return;
      }

      try {
        setLoading(true);
        const response = await axios.get(`/inventory/get-transfer-form-details/${indentId}`);
        if (response.data.success) {
          setItems(response.data.data || []);
        }
      } catch (error) {
        console.error("Error fetching initial data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [indentId, navigate]);

  // Step 2: Handle Item Change -> Fetch "From Locations"
  const handleItemChange = async (itemId) => {
    setFormData({
      item_name: itemId,
      from_location: "",
      to_location: "",
      qty: ""
    });
    setFromLocations([]);
    setToLocations([]);
    setQuantityInfo(null);
    setSourceQty("");

    if (!itemId) return;

    try {
      const response = await axios.get(`/inventory/transfer-location-data?id=${itemId}&instid=${indentId}`);
      if (response.data.success) {
        setFromLocations(response.data.data.locations || []);
        setQuantityInfo(response.data.data.quantity_section);
      }
    } catch (error) {
      console.error("Error fetching from locations:", error);
    }
  };

  // Step 3: Handle From Location Change -> Fetch "To Locations"
  const handleFromLocationChange = async (fromLocationId) => {
    setFormData(prev => ({
      ...prev,
      from_location: fromLocationId,
      to_location: "",
      qty: quantityInfo?.typeofuse === 2 ? "1" : ""
    }));
    
    // Find source quantity for the selected location
    const selectedLoc = fromLocations.find(loc => String(loc.ids) === String(fromLocationId));
    setSourceQty(selectedLoc ? `${selectedLoc.qty} ${selectedLoc.unit_name || ""}` : "");

    if (!fromLocationId) {
      setToLocations([]);
      return;
    }

    try {
      const response = await axios.get(`/inventory/material-location-details?hakuna=${fromLocationId}`);
      if (response.data.success) {
        setToLocations(response.data.data.transfer_locations || []);
      }
    } catch (error) {
      console.error("Error fetching to locations:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.item_name || !formData.from_location || !formData.to_location || !formData.qty) {
      toast.error("Please fill all required fields before submitting");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        item_name: formData.item_name,
        from_location: formData.from_location,
        qty: formData.qty,
        indentid: indentId,
        to_location: formData.to_location
      };

      const response = await axios.post("/inventory/transfer-item", payload);
      
      if (response.data.success || response.data.status) {
        toast.success("Item transferred successfully");
        navigate("/dashboards/inventory/purchase-requisition/stock-transfer-list");
      } else {
        toast.error(response.data.message || "Failed to transfer item");
      }
    } catch (error) {
      console.error("Error transferring item:", error);
      toast.error("Something went wrong during transfer");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Page title="Transfer Item">
        <div className="flex h-[60vh] items-center justify-center text-gray-600">
          <svg className="mr-2 h-6 w-6 animate-spin text-blue-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z" />
          </svg>
          Loading...
        </div>
      </Page>
    );
  }

  return (
    <Page title="Transfer Item">
      <div className="transition-content px-[var(--margin-x)] pb-8">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            Stock Transfer Form
          </h1>
          <Button
            variant="outline"
            onClick={() => navigate("/dashboards/inventory/purchase-requisition/stock-transfer-list")}
            className="text-white bg-blue-600 hover:bg-blue-700 px-6"
          >
            &lt;&lt; Back to List
          </Button>
        </div>

        <Card className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-dark-800 overflow-hidden">
          <form onSubmit={handleSubmit}>
            <div className="p-6 space-y-6">
              
              {/* Select Item */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Select Item <span className="text-red-500">*</span>
                </label>
                <div className="md:col-span-2">
                  <select
                    value={formData.item_name}
                    onChange={(e) => handleItemChange(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                    required
                  >
                    <option value="">Choose Item to Transfer</option>
                    {items.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.name} {item.idno}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {formData.item_name && (
                <>
                  {/* Transfer From Location */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Transfer From Location <span className="text-red-500">*</span>
                    </label>
                    <div className="md:col-span-2">
                      <select
                        value={formData.from_location}
                        onChange={(e) => handleFromLocationChange(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                        required
                      >
                        <option value="">Select Location</option>
                        {fromLocations.map(loc => (
                          <option key={loc.ids} value={loc.ids}>
                            {loc.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {formData.from_location && (
                    <>
                      {/* Item Quantity (Source Qty) */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                          Item Quantity
                        </label>
                        <div className="md:col-span-2">
                          <input
                            value={sourceQty}
                            readOnly
                            className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm font-bold text-blue-600 dark:border-gray-600 dark:bg-gray-700"
                          />
                        </div>
                      </div>

                      {/* Enter Quantity to Transfer */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                          Enter Quantity to Transfer <span className="text-red-500">*</span>
                        </label>
                        <div className="md:col-span-2">
                          <input
                            type="text"
                            value={formData.qty}
                            onChange={(e) => setFormData(prev => ({ ...prev, qty: e.target.value }))}
                            readOnly={quantityInfo?.typeofuse === 2}
                            placeholder="0"
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                            required
                          />
                        </div>
                      </div>

                      {/* Transfer Location (To Location) */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                          Transfer Location <span className="text-red-500">*</span>
                        </label>
                        <div className="md:col-span-2">
                          <select
                            value={formData.to_location}
                            onChange={(e) => setFormData(prev => ({ ...prev, to_location: e.target.value }))}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                            required
                          >
                            <option value="">Choose Location to Transfer</option>
                            {toLocations.map(loc => (
                              <option key={loc.id} value={loc.id}>
                                {loc.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>

            <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-dark-900/50">
              <Button 
                type="submit" 
                disabled={submitting}
                className={clsx(
                  "!bg-blue-600 !text-white rounded-lg px-10 py-2.5 text-sm font-semibold shadow-md transition hover:!bg-blue-700 active:!bg-blue-800",
                  submitting && "opacity-60 cursor-not-allowed"
                )}
              >
                {submitting ? "Submitting..." : "Submit"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </Page>
  );
}