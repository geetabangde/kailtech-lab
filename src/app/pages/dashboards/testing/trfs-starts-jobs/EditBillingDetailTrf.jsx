import { useState, useEffect, useCallback } from "react";
import { Button } from "components/ui";
import { Page } from "components/shared/Page";
import axios from "utils/axios";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import ReactSelect from "react-select";

export default function EditBillingDetailTrf() {
  const navigate = useNavigate();

  // ── TRF ID from URL (same pattern as EditBdPerson) ──────────────────────
  const pathParts = window.location.pathname.split("/");
  const id = pathParts[pathParts.length - 1];

  // ── State ────────────────────────────────────────────────────────────────
  const [trfData, setTrfData]           = useState(null);
  const [fetchLoading, setFetchLoading] = useState(true);

  // GET /people/get-all-customers
  const [customers, setCustomers] = useState([]);

  // Form fields (PHP: billingname, billingaddress, gstno)
  const [billingname, setBillingname]       = useState(""); // customer id
  const [billingaddress, setBillingaddress] = useState(""); // address id
  const [gstno, setGstno]                   = useState("");

  // Dynamic address list (PHP: fetchbillingdetails.php via onchange)
  const [addresses, setAddresses]           = useState([]);
  const [addressLoading, setAddressLoading] = useState(false);

  const [loading, setLoading] = useState(false);

  // ── GET /people/get-customer-addresses?id=custId ─────────────────────────
  // PHP logic: onchange="search(this.id,'biadd','fetchbillingdetails.php',...)"
  const fetchAddresses = useCallback(async (custId, preselect = null) => {
    if (!custId) return;
    setAddressLoading(true);
    setAddresses([]);
    try {
      const res = await axios.get(`/people/get-customers-address/${custId}`);
      const result = res.data;
      if (result.status === true || result.status === "true") {
        setAddresses(result.data || []);
        if (preselect) setBillingaddress(String(preselect));
      }
    } catch (err) {
      console.error("Fetch addresses error:", err);
      toast.error("Failed to load customer addresses");
    } finally {
      setAddressLoading(false);
    }
  }, []);

  // ── On mount: GET TRF + GET Customers (parallel) ─────────────────────────
  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const [trfRes, custRes] = await Promise.all([
          axios.get(`/testing/get-trf-byid/${id}`),
          axios.get(`/people/get-all-customers`),
        ]);

        // ── /testing/get-trf-byid fields used ────────────────────────────
        //   id, customername, ponumber → info box
        //   billingname    → pre-select customer dropdown  ("339")
        //   billingaddress → pre-select address dropdown   ("162")
        //   gstno          → pre-fill GST input            ("23AADCK0799A1ZV")
        const trfResult = trfRes.data;
        if (trfResult.status === true) {
          const d = trfResult.data;
          setTrfData(d);
          setBillingname(String(d.billingname || ""));
          setGstno(d.gstno || "");
          // PHP: address dropdown pre-loaded for existing billingname
          if (d.billingname) {
            fetchAddresses(d.billingname, d.billingaddress);
          }
        } else {
          toast.error("Failed to fetch TRF details");
        }

        // ── /people/get-all-customers fields used ─────────────────────────
        //   id, name, pnumber, gstno
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
  }, [id, fetchAddresses]);

  // ── Customer dropdown change handler ─────────────────────────────────────
  // PHP: onchange="search(this.id,'biadd','fetchbillingdetails.php','Processing')"
  //      + auto-fills readonly gstno from customer record
  const handleCustomerChange = (custId) => {
    setBillingname(custId);
    setBillingaddress("");
    setAddresses([]);
    if (!custId) { setGstno(""); return; }

    // Auto-fill GST from customer list data
    const found = customers.find((c) => String(c.id) === String(custId));
    if (found) setGstno(found.gstno || "");

    fetchAddresses(custId);
  };

  // ── POST /testing/update-billing-detail ──────────────────────────────────
  // Payload: { billingname, billingaddress, gstno, id }
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!billingname)    { toast.error("Please select a customer"); return; }
    if (!billingaddress) { toast.error("Please select a customer address"); return; }

    setLoading(true);
    try {
      const res = await axios.post(`/testing/update-billing-detail`, {
        billingname:    Number(billingname),
        billingaddress: Number(billingaddress),
        gstno,
        id:             Number(id),
      });

      const result = res.data;
      if (result.status === true) {
        toast.success("Billing details updated successfully ✅");
        setTimeout(() => {
          navigate("/dashboards/testing/trfs-starts-jobs");
        }, 1000);
      } else {
        toast.error(result.message || "Failed to update billing details ❌");
      }
    } catch (err) {
      console.error("Update billing error:", err);
      toast.error("Something went wrong while updating billing details.");
    } finally {
      setLoading(false);
    }
  };

  const customerOptions = customers.map((c) => ({
    value: c.id,
    label: `${c.name}(${c.pnumber})`,
  }));
  const selectedCustomer = customerOptions.find((o) => String(o.value) === String(billingname)) || null;

  const addressOptions = addresses.map((a) => ({
    value: a.id,
    label: `${a.name}(${a.address})`,
  }));
  const selectedAddress = addressOptions.find((o) => String(o.value) === String(billingaddress)) || null;

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
    <Page title="Edit Billing Detail">
      <div className="p-6">

        {/* ── Header — same layout as EditBdPerson ──────────────────────── */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
            Update Billing Detail
          </h2>
          <Button
            variant="outline"
            className="text-white bg-blue-600 hover:bg-blue-700"
            onClick={() => navigate("/dashboards/testing/trfs-starts-jobs")}
          >
            Back List
          </Button>
        </div>

        {/* ── Page loading spinner — same as EditBdPerson ───────────────── */}
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

            {/* ── TRF Info Box — same style as EditBdPerson ─────────────── */}
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

            {/* ── Customer Name Dropdown ────────────────────────────────── */}
            {/* PHP: <select name="billingname" onchange="search(...)"> */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Customer Name <span className="text-red-500">*</span>
              </label>
              <ReactSelect
                options={customerOptions}
                value={selectedCustomer}
                onChange={(selected) => handleCustomerChange(selected ? selected.value : "")}
                placeholder="Select Customer..."
                isClearable
                isSearchable
                styles={selectStyles}
                menuPortalTarget={document.body}
              />
            </div>

            {/* ── Customer Address Dropdown ─────────────────────────────── */}
            {/* PHP: <div id="biadd"> loaded dynamically via fetchbillingdetails.php */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Customer Address <span className="text-red-500">*</span>
              </label>
              {addressLoading ? (
                <div className="flex items-center gap-2 py-2 text-sm text-gray-500">
                  <svg className="animate-spin h-4 w-4 text-blue-600" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z" />
                  </svg>
                  Loading addresses...
                </div>
              ) : (
                <ReactSelect
                  options={addressOptions}
                  value={selectedAddress}
                  onChange={(selected) => setBillingaddress(selected ? selected.value : "")}
                  placeholder="Select Address..."
                  isDisabled={!billingname}
                  isClearable
                  isSearchable
                  styles={selectStyles}
                  menuPortalTarget={document.body}
                />
              )}
            </div>

            {/* ── GST No ───────────────────────────────────────────────── */}
            {/* PHP: readonly input auto-filled from fetchbillingdetails.php */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                GST No
              </label>
              <input
                type="text"
                value={gstno}
                onChange={(e) => setGstno(e.target.value)}
                placeholder="Customer GST No"
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
              />
            </div>

            {/* ── Submit — same Button component as EditBdPerson ───────── */}
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
                "Edit Billing Detail"
              )}
            </Button>
          </form>
        )}
      </div>
    </Page>
  );
}