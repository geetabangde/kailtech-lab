import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Button, Input, Select, Card } from "components/ui";
import { Page } from "components/shared/Page";
import axios from "utils/axios";
import { toast } from "sonner";

// ----------------------------------------------------------------------

export default function AddMRN() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetchingDetails, setFetchingDetails] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    typeofrecieving: "",
    poid: "",
    custaddid: "",
    concernpersonname: "",
    gstnumber: "",
    wcno: "",
    wcdate: "",
    dispatchthrough: "By Hand",
    dispatchdetail: "",
  });

  // Files State
  const [files, setFiles] = useState({
    rupload1: null,
    rupload2: null,
  });

  // Dropdown Lists
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [vendorAddresses, setVendorAddresses] = useState([]);

  // ✅ Fetch Purchase Orders on Component Mount
  useEffect(() => {
    const fetchPOs = async () => {
      try {
        // PHP logic: selectextrawhereupdate("purchase_order", "id,po_number,customer_id", "status=1 order by id desc")
        const response = await axios.get("/inventory/get-purchase-order"); 
        if (response.data.status) {
          setPurchaseOrders(response.data.data || []);
        }
      } catch (err) {
        console.error("Error fetching POs:", err);
      }
    };
    fetchPOs();
  }, []);

  // ✅ Fetch Customer/Vendor Details when PO or Receiving Type changes
  // PHP logic: getcustomerDetails(poid, type)
  useEffect(() => {
    if (formData.poid && formData.typeofrecieving) {
      const fetchDetails = async () => {
        try {
          setFetchingDetails(true);
          const response = await axios.get("/inventory/get-purchase-order-details", {
            params: { poid: formData.poid, type: formData.typeofrecieving },
          });

          if (response.data.status) {
            const data = response.data.data;
            setVendorAddresses(data.addresses || []);
            setFormData((prev) => ({
              ...prev,
              concernpersonname: data.concernpersonname || "",
              gstnumber: data.gstnumber || "",
              custaddid: data.addresses?.[0]?.id || "", // Default to first address if available
            }));
          }
        } catch (err) {
          console.error("Error fetching vendor details:", err);
        } finally {
          setFetchingDetails(false);
        }
      };
      fetchDetails();
    }
  }, [formData.poid, formData.typeofrecieving]);

  // Input Change Handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // File Change Handler
  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files && files.length > 0) {
      setFiles((prev) => ({
        ...prev,
        [name]: files[0],
      }));
    }
  };

  // ✅ Form Submission Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setLoading(true);
    try {
      const form = new FormData();
      
      // Append all text fields
      Object.entries(formData).forEach(([key, value]) => {
        form.append(key, value);
      });

      // Append files if they exist
      if (files.rupload1) form.append("rupload1", files.rupload1);
      if (files.rupload2) form.append("rupload2", files.rupload2);

      // PHP logic: insertMRNwopo.php
      await axios.post("/inventory/create-mrn", form);

      toast.success("MRN added successfully ✅");
      navigate("/dashboards/inventory/mrn");
    } catch (err) {
      console.error("Error creating MRN:", err);
      toast.error(err?.response?.data?.message || "Failed to create MRN ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page title="Add New MRN">
      <div className="transition-content p-6">
        {/* ✅ Header Section */}
        <div className="flex items-center justify-between mb-6">
          <div className="min-w-0">
            <h2 className="text-xl font-semibold tracking-wide text-gray-800 dark:text-dark-50">
              Add New MRN
            </h2>
          </div>
          <Button
            variant="outline"
            className="bg-blue-600 text-white hover:bg-blue-700 font-medium"
            onClick={() => navigate("/dashboards/inventory/mrn")}
          >
            &laquo; Back to MRN
          </Button>
        </div>

        {/* ✅ Form Section */}
        <Card className="relative overflow-hidden p-6 shadow-soft dark:bg-dark-800">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              
              {/* Type Of Receiving */}
              <div className="space-y-1">
                <Select
                  label="Type Of Receiving"
                  name="typeofrecieving"
                  value={formData.typeofrecieving}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Type</option>
                  <option value="Challan">Challan</option>
                  <option value="Invoice">Invoice</option>
                  <option value="Challan & Invoice">Challan & Invoice</option>
                </Select>
              </div>

              {/* Purchase Order Selection */}
              <div className="space-y-1">
                <Select
                  label="Purchase Order"
                  name="poid"
                  value={formData.poid}
                  onChange={handleChange}
                  required
                >
                  <option value="">Choose One..</option>
                  {purchaseOrders.map((po) => (
                    <option key={po.id} value={po.id}>
                      {po.po_number} - {po.supplier_company}
                    </option>
                  ))}
                </Select>
              </div>

              {/* ✅ Dynamic Details Section (Auto-populated from PO selection) */}
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 pt-6 border-t border-gray-100 dark:border-dark-700">
                
                <Select
                  label="Vendor Address"
                  name="custaddid"
                  value={formData.custaddid}
                  onChange={handleChange}
                  required
                  disabled={fetchingDetails || !formData.poid}
                >
                  <option value="">Select Address</option>
                  {vendorAddresses.map((addr) => (
                    <option key={addr.id} value={addr.id}>
                      {addr.address}
                    </option>
                  ))}
                </Select>

                <Input
                  label="Contact Person Name"
                  name="concernpersonname"
                  value={formData.concernpersonname}
                  readOnly
                  placeholder={fetchingDetails ? "Loading..." : "Auto-filled"}
                  className="bg-gray-50 dark:bg-dark-900/50"
                />

                <Input
                  label="GST Number"
                  name="gstnumber"
                  value={formData.gstnumber}
                  readOnly
                  placeholder={fetchingDetails ? "Loading..." : "Auto-filled"}
                  className="bg-gray-50 dark:bg-dark-900/50"
                />

                <Input
                  label="Challan/ Invoice Number"
                  name="wcno"
                  value={formData.wcno}
                  onChange={handleChange}
                  placeholder="Enter Number"
                  required
                />

                <Input
                  label="Challan/Invoice Date"
                  name="wcdate"
                  type="date"
                  value={formData.wcdate}
                  onChange={handleChange}
                  max={new Date().toISOString().split("T")[0]}
                  required
                />
              </div>

              {/* ✅ Logistic Details Section */}
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 pt-6 border-t border-gray-100 dark:border-dark-700">
                
                <Select
                  label="Receive Through"
                  name="dispatchthrough"
                  value={formData.dispatchthrough}
                  onChange={handleChange}
                  required
                >
                  <option value="By Hand">By Hand</option>
                  <option value="By courier">By courier</option>
                </Select>

                <div className="md:col-span-2 space-y-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-dark-100">
                    Receive Detail
                  </label>
                  <textarea
                    name="dispatchdetail"
                    value={formData.dispatchdetail}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 p-3 text-sm shadow-sm transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:bg-dark-900 dark:border-dark-600 dark:text-dark-50"
                    rows={3}
                    placeholder="Enter delivery or receipt details..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-dark-100">
                    Receive Document 1
                  </label>
                  <div className="mt-1 flex items-center">
                    <input
                      type="file"
                      name="rupload1"
                      onChange={handleFileChange}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 dark:file:bg-primary-900/30 dark:file:text-primary-400"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-dark-100">
                    Receive Document 2
                  </label>
                  <div className="mt-1 flex items-center">
                    <input
                      type="file"
                      name="rupload2"
                      onChange={handleFileChange}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 dark:file:bg-primary-900/30 dark:file:text-primary-400"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ✅ Footer / Submit Section */}
            <div className="flex justify-end pt-6 border-t border-gray-100 dark:border-dark-700">
              <Button
                type="submit"
                color="success"
                size="lg"
                disabled={loading}
                className="min-w-[200px] font-semibold tracking-wide shadow-lg shadow-success-500/20"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z"></path>
                    </svg>
                    Processing...
                  </div>
                ) : (
                  "Proceed to Add Material"
                )}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </Page>
  );
}
