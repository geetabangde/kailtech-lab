import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Button, Input, Card } from "components/ui";
import { Page } from "components/shared/Page";
import ReactSelect from "react-select";

const SearchableSelect = ({ label, name, options, value, onChange, required }) => {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-gray-700 dark:text-dark-100">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <ReactSelect
        name={name}
        options={options}
        value={options.find(o => String(o.value) === String(value)) || null}
        onChange={(option) => onChange({ target: { name, value: option ? option.value : '' } })}
        isClearable
        styles={{
          control: (base) => ({
            ...base,
            minHeight: '42px',
            borderRadius: '0.5rem',
            borderColor: '#d1d5db',
            boxShadow: 'none',
            '&:hover': { borderColor: '#3b82f6' }
          }),
          menuPortal: base => ({ ...base, zIndex: 9999 })
        }}
        menuPortalTarget={document.body}
      />
    </div>
  );
};
import axios from "utils/axios";
import { toast } from "sonner";

// ----------------------------------------------------------------------

export default function AddMRNWoPo() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetchingDetails, setFetchingDetails] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    typeofrecieving: "",
    customerid: "",
    poid: "",
    vendoraddress: "",
    city: "",
    vendorname: "",
    company: "",
    contactpersonname: "",
    gstno: "",
    mobile: "",
    email: "",
    challanno: "",
    challandate: "",
    invoiceno: "",
    invoicedate: "",
    dispatchthrough: "By Hand",
    dispatchdetail: "",
  });

  // Files State
  const [files, setFiles] = useState({
    rupload1: null,
    rupload2: null,
  });

  // Dropdown Lists
  const [suppliers, setSuppliers] = useState([]);

  // ✅ Fetch Suppliers on Component Mount
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        // PHP logic: selectextrawhere("suppliers", "status=1 order by name")
        const response = await axios.get("/inventory/get-supplier"); 
        if (response.data.status) {
          setSuppliers(response.data.data || []);
        }
      } catch (err) {
        console.error("Error fetching suppliers:", err);
      }
    };
    fetchSuppliers();
  }, []);

  // ✅ Fetch Customer Details when Vendor or Receiving Type changes
  // PHP logic: getcustomerDetails(customerid, type)
  useEffect(() => {
    if (formData.customerid && formData.typeofrecieving) {
      const fetchDetails = async () => {
        try {
          setFetchingDetails(true);
          const response = await axios.get(`/inventory/get-supplier-details/${formData.customerid}`);

          if (response.data.status) {
            const data = response.data.data;
            
            setFormData((prev) => ({
              ...prev,
              vendoraddress: data.full_address || data.address || "",
              city: data.city || "",
              vendorname: data.company || data.name || "",
              company: data.company || "",
              contactpersonname: data.contact_person || data.company || "",
              gstno: data.gstno || "",
              mobile: data.mobile || data.contact_phone || "",
              email: data.email || data.contact_email || "",
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
  }, [formData.customerid, formData.typeofrecieving]);

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
      
      const formatDate = (dateStr) => {
        if (!dateStr) return "";
        if (dateStr.includes("/")) return dateStr;
        const [y, m, d] = dateStr.split("-");
        return `${d}/${m}/${y}`;
      };

      Object.entries(formData).forEach(([key, value]) => {
        // Strict payload matching: Omit irrelevant fields based on type
        if (formData.typeofrecieving === "Challan" && (key === "invoiceno" || key === "invoicedate")) return;
        if (formData.typeofrecieving === "Invoice" && (key === "challanno" || key === "challandate")) return;

        if (key === "challandate" || key === "invoicedate") {
          if (value) form.append(key, formatDate(value));
        } else {
          form.append(key, value);
        }
      });

      if (files.rupload1) form.append("rupload1", files.rupload1);
      if (files.rupload2) form.append("rupload2", files.rupload2);

      const response = await axios.post("/inventory/add-mrn-not", form);

      if (response.data.status) {
        toast.success(response.data.message || "MRN (Without PO) added successfully ✅");
        const newMrnId = response.data.insert_id || response.data.challanid;
        navigate(`/dashboards/inventory/mrn/addMrnItemPurchase?id=${newMrnId}`);
      } else {
        toast.error(response.data.message || "Failed to create MRN ❌");
      }
    } catch (err) {
      console.error("Error creating MRN:", err);
      toast.error(err?.response?.data?.message || "Failed to create MRN ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page title="Add New MRN (Without PO)">
      <div className="transition-content p-6">
        {/* ✅ Header Section */}
        <div className="flex items-center justify-between mb-6">
          <div className="min-w-0">
            <h2 className="text-xl font-semibold tracking-wide text-gray-800 dark:text-dark-50">
              Add New MRN (Without PO)
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
                <SearchableSelect
                  label="Type Of Receiving"
                  name="typeofrecieving"
                  value={formData.typeofrecieving}
                  onChange={handleChange}
                  required
                  options={[
                    { label: "Challan", value: "Challan" },
                    { label: "Invoice", value: "Invoice" },
                    { label: "Challan & Invoice", value: "Challan & Invoice" },
                  ]}
                />
              </div>

              {/* Vendor Name Selection */}
              <div className="space-y-1">
                <SearchableSelect
                  label="Vendor Name"
                  name="customerid"
                  value={formData.customerid}
                  onChange={handleChange}
                  required
                  options={suppliers.map((supplier) => ({
                    value: supplier.id,
                    label: supplier.name 
                      ? `${supplier.name} ${supplier.company ? `(${supplier.company})` : ""}`
                      : supplier.company
                  }))}
                />
              </div>

              {/* ✅ Dynamic Details Section */}
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 pt-6 border-t border-gray-100 dark:border-dark-700">
                
                <Input
                  label="PO Number"
                  name="poid"
                  value={formData.poid}
                  onChange={handleChange}
                  placeholder="Enter PO Number manually"
                  required
                />

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-dark-100">
                    Vendor Address
                  </label>
                  <textarea
                    name="vendoraddress"
                    value={formData.vendoraddress}
                    readOnly
                    className="w-full rounded-lg border border-gray-300 bg-gray-50 p-3 text-sm dark:bg-dark-900/50 dark:border-dark-600 dark:text-dark-50 cursor-not-allowed"
                    rows={1}
                    placeholder={fetchingDetails ? "Loading..." : "Auto-filled"}
                  />
                </div>

                <Input
                  label="GST Number"
                  name="gstno"
                  value={formData.gstno}
                  readOnly
                  placeholder={fetchingDetails ? "Loading..." : "Auto-filled"}
                  className="bg-gray-50 dark:bg-dark-900/50 cursor-not-allowed"
                />

                <Input
                  label="Contact Person Name"
                  name="contactpersonname"
                  value={formData.contactpersonname}
                  readOnly
                  placeholder={fetchingDetails ? "Loading..." : "Auto-filled"}
                  className="bg-gray-50 dark:bg-dark-900/50 cursor-not-allowed"
                />

                <Input
                  label="Mobile No"
                  name="mobile"
                  value={formData.mobile}
                  readOnly
                  placeholder={fetchingDetails ? "Loading..." : "Auto-filled"}
                  className="bg-gray-50 dark:bg-dark-900/50 cursor-not-allowed"
                />

                <Input
                  label="Email"
                  name="email"
                  value={formData.email}
                  readOnly
                  placeholder={fetchingDetails ? "Loading..." : "Auto-filled"}
                  className="bg-gray-50 dark:bg-dark-900/50 cursor-not-allowed"
                />

                {/* Dynamic Challan/Invoice Fields */}
                {(formData.typeofrecieving === "Challan" || formData.typeofrecieving === "Challan & Invoice") && (
                  <>
                    <Input
                      label="Challan Number"
                      name="challanno"
                      value={formData.challanno}
                      onChange={handleChange}
                      placeholder="Enter Number"
                      required
                    />
                    <Input
                      label="Challan Date"
                      name="challandate"
                      type="date"
                      value={formData.challandate}
                      onChange={handleChange}
                      max={new Date().toISOString().split("T")[0]}
                      required
                    />
                  </>
                )}

                {(formData.typeofrecieving === "Invoice" || formData.typeofrecieving === "Challan & Invoice") && (
                  <>
                    <Input
                      label="Invoice Number"
                      name="invoiceno"
                      value={formData.invoiceno}
                      onChange={handleChange}
                      placeholder="Enter Number"
                      required
                    />
                    <Input
                      label="Invoice Date"
                      name="invoicedate"
                      type="date"
                      value={formData.invoicedate}
                      onChange={handleChange}
                      max={new Date().toISOString().split("T")[0]}
                      required
                    />
                  </>
                )}
              </div>

              {/* ✅ Logistic Details Section */}
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 pt-6 border-t border-gray-100 dark:border-dark-700">
                
                <div className="space-y-1">
                  <SearchableSelect
                    label="Receive Through"
                    name="dispatchthrough"
                    value={formData.dispatchthrough}
                    onChange={handleChange}
                    required
                    options={[
                      { label: "By Hand", value: "By Hand" },
                      { label: "By courier", value: "By courier" },
                    ]}
                  />
                </div>

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
