import { useState, useEffect } from "react";
import { Button } from "components/ui";
import { Page } from "components/shared/Page";
import axios from "utils/axios";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import ReactSelect from "react-select";

export default function EditMainCustomerTrf() {
  const navigate = useNavigate();

  // TRF ID from URL
  const pathParts = window.location.pathname.split("/");
  const id = pathParts[pathParts.length - 1];

  // State
  const [trfData, setTrfData]           = useState(null);
  const [fetchLoading, setFetchLoading] = useState(true);

  // GET /people/get-all-customers
  const [customers, setCustomers] = useState([]);

  // PHP: <select name="customerid"> — pre-selected from $rowinward['customerid']
  const [customerid, setCustomerid] = useState("");

  const [loading, setLoading] = useState(false);

  // ── On mount: GET TRF + GET Customers (parallel) ─────────────────────────
  // PHP: $resultinward = selectextrawhere("trfs", "id=$inwardid")
  //      $resultcust   = selectextrawhere("customers", "status=1")
  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const [trfRes, custRes] = await Promise.all([
          axios.get(`/testing/get-trf-byid/${id}`),
          axios.get(`/people/get-all-customers`),
        ]);

        // TRF fields used: id, customername, ponumber (info box) + customerid (pre-select)
        const trfResult = trfRes.data;
        if (trfResult.status === true) {
          const d = trfResult.data;
          setTrfData(d);
          // PHP: ($rowinward['customerid'] == $rowcust['id']) ? 'selected' : ''
          setCustomerid(String(d.customerid || ""));
        } else {
          toast.error("Failed to fetch TRF details");
        }

        // Customers: id, name, pnumber
        const custResult = custRes.data;
        if (custResult.status === true || custResult.status === "true") {
          setCustomers(custResult.data || []);
        } else {
          toast.error("Failed to fetch customers");
        }
      } catch (err) {
        console.error("Fetch initial error:", err);
        toast.error("Something went wrong while loading data.");
      } finally {
        setFetchLoading(false);
      }
    };

    if (id) fetchInitial();
  }, [id]);

  // ── POST /testing/update-customer-responsibale-forpayment ────────────────
  // Payload: { id, customerid }
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customerid) { toast.error("Please select a customer"); return; }

    setLoading(true);
    try {
      const res = await axios.post(`/testing/update-customer-responsibale-forpayment`, {
        id:         Number(id),
        customerid: Number(customerid),
      });

      const result = res.data;
      if (result.status === true) {
        toast.success(result.message || "Customer updated successfully ✅");
        setTimeout(() => {
          navigate("/dashboards/testing/trfs-starts-jobs");
        }, 1000);
      } else {
        toast.error(result.message || "Failed to update customer ❌");
      }
    } catch (err) {
      console.error("Update customer error:", err);
      toast.error("Something went wrong while updating.");
    } finally {
      setLoading(false);
    }
  };

  const customerOptions = customers.map((c) => ({
    value: c.id,
    label: `${c.name}(${c.pnumber})`,
  }));
  const selectedCustomer = customerOptions.find((o) => String(o.value) === String(customerid)) || null;

  const selectStyles = {
    control: (base, state) => ({
      ...base,
      minHeight: "42px",
      borderColor: state.isFocused ? "#3b82f6" : "#d1d5db",
      boxShadow: state.isFocused ? "0 0 0 1px #3b82f6" : "none",
      "&:hover": { borderColor: "#3b82f6" },
      borderRadius: "0.375rem",
    }),
    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
  };

  return (
    <Page title="Customer Responsible for Payment">
      <div className="p-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
            Customer Responsible for Payment
          </h2>
          <Button
            variant="outline"
            className="text-white bg-blue-600 hover:bg-blue-700"
            onClick={() => navigate("/dashboards/testing/trfs-starts-jobs")}
          >
            Back List
          </Button>
        </div>

        {/* Page loading spinner */}
        {fetchLoading ? (
          <div className="flex items-center justify-center py-10 text-gray-500">
            <svg className="animate-spin h-6 w-6 mr-2 text-blue-600" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z" />
            </svg>
            Loading TRF details...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* TRF Info Box */}
            {trfData && (
              <div className="bg-gray-50 border border-gray-200 rounded p-4 space-y-2 text-sm text-gray-700">
                <p>
                  <span className="font-medium">TRF ID:</span> {trfData.id}
                </p>
                <p>
                  <span className="font-medium">Customer:</span> {trfData.customername}
                </p>
                <p>
                  <span className="font-medium">Work Order No:</span>{" "}
                  {trfData.ponumber || "-"}
                </p>
              </div>
            )}

            {/* Customer Name Dropdown */}
            {/* PHP: <select name="customerid"> with pre-selected from $rowinward['customerid'] */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Customer Name <span className="text-red-500">*</span>
              </label>
              <ReactSelect
                options={customerOptions}
                value={selectedCustomer}
                onChange={(selected) => setCustomerid(selected ? selected.value : "")}
                placeholder="Select Customer..."
                isClearable
                isSearchable
                styles={selectStyles}
                menuPortalTarget={document.body}
              />
            </div>

            {/* Submit */}
            <Button type="submit" color="primary" disabled={loading}>
              {loading ? (
                <div className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z" />
                  </svg>
                  Saving...
                </div>
              ) : (
                "Edit Main Customer"
              )}
            </Button>
          </form>
        )}
      </div>
    </Page>
  );
}