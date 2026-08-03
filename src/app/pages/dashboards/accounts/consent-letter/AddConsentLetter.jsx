// Import Dependencies
import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import dayjs from "dayjs";
import axios from "utils/axios";

// Local Imports
import { Page } from "components/shared/Page";

// ----------------------------------------------------------------------
// Generic Searchable Select (used for Customer + Standard)
// items: array of { id, name }
// ----------------------------------------------------------------------
function SearchableSelect({
  items,
  value,
  onChange,
  disabled,
  error,
  placeholder = "Search and select...",
  loadingPlaceholder = "Loading...",
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const selectedName = useMemo(
    () => items.find((c) => String(c.id) === String(value))?.name ?? "",
    [items, value],
  );

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (
      q
        ? items.filter((c) => (c.name ?? "").toLowerCase().includes(q))
        : items
    ).slice(0, 80);
  }, [items, query]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
        setQuery("");
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const inputClass = [
    "w-full rounded border px-3 py-2 text-sm outline-none transition",
    "focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20",
    "dark:bg-dark-700 dark:text-dark-100",
    error
      ? "border-red-400 dark:border-red-500"
      : "border-gray-300 dark:border-dark-500",
    disabled ? "cursor-not-allowed opacity-60" : ""
  ].join(" ");

  return (
    <div ref={ref} className="relative">
      <input
        type="text"
        value={open ? query : selectedName}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          if (!e.target.value) onChange("");
        }}
        onFocus={() => {
          if (!disabled) setOpen(true);
        }}
        placeholder={disabled ? loadingPlaceholder : placeholder}
        className={inputClass}
        autoComplete="off"
        disabled={disabled}
      />

      {disabled && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <svg className="h-4 w-4 animate-spin text-primary-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z" />
          </svg>
        </div>
      )}

      {open && !disabled && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-gray-200 bg-white shadow-xl dark:border-dark-600 dark:bg-dark-800">
          {filteredItems.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-400">No results found</div>
          ) : (
            filteredItems.map((item) => (
              <div
                key={item.id}
                onMouseDown={() => {
                  onChange(String(item.id));
                  setQuery("");
                  setOpen(false);
                }}
                className={`cursor-pointer px-3 py-2 text-sm transition-colors hover:bg-primary-50 dark:hover:bg-dark-700 ${String(item.id) === String(value)
                  ? "bg-primary-50 font-semibold text-primary-700 dark:bg-dark-700 dark:text-primary-400"
                  : "text-gray-700 dark:text-dark-200"
                  }`}
              >
                {item.name}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------

export default function AddConsentLetter() {
  const navigate = useNavigate();
  const permissions = JSON.parse(localStorage.getItem("userPermissions") || "[]");

  useEffect(() => {
    if (!permissions.includes(363)) {
      navigate("/dashboards");
    }
  }, [navigate, permissions]);

  // ── Form State ──
  const [formData, setFormData] = useState({
    consentletterdate: dayjs().format("YYYY-MM-DD"),
    iscode: "",
    customerid: "",
    addressid: "", // updated from cusr
    remark: "",
    remark2: "",
  });

  // ── Dropdown data ──
  const [standards, setStandards] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [customerAddresses, setCustomerAddresses] = useState([]);

  // ── Loading states ──
  const [standardsLoading, setStandardsLoading] = useState(true);
  const [customersLoading, setCustomersLoading] = useState(true);
  const [addressLoading, setAddressLoading] = useState(false);

  // ── Submission state ──
  const [submitting, setSubmitting] = useState(false);

  // ── Validation errors ──
  const [errors, setErrors] = useState({});

  // ── Fetch Standards ──
  useEffect(() => {
    axios
      .get("/testing/get-standards")
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : res.data?.data || [];
        setStandards(list);
        // Auto-select first like PHP (no blank option in standards select)
        if (list.length > 0) {
          setFormData((prev) => ({ ...prev, iscode: list[0].id }));
        }
      })
      .catch((err) => console.error("Failed to load standards:", err))
      .finally(() => setStandardsLoading(false));
  }, []);

  // ── Fetch Customers ──
  useEffect(() => {
    axios
      .get("/people/get-all-customers")
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : res.data?.data || [];
        setCustomers(list);
      })
      .catch((err) => console.error("Failed to load customers:", err))
      .finally(() => setCustomersLoading(false));
  }, []);

  // ── Fetch Customer Addresses when customer changes ──
  useEffect(() => {
    if (!formData.customerid) {
      setCustomerAddresses([]);
      setFormData((prev) => ({ ...prev, addressid: "" }));
      return;
    }
    setAddressLoading(true);

    // Fetch addresses using the details API that we know works in other modules
    axios
      .get(`/accounts/get-po-detailfor-directinvoice-testing?customerid=${formData.customerid}`)
      .then((res) => {
        const list = res.data?.data?.addresses || res.data?.addresses || [];
        setCustomerAddresses(list);
        setFormData((prev) => ({ ...prev, addressid: "" }));
      })
      .catch((err) => {
        console.error("Failed to load addresses:", err);
        toast.error("Failed to load customer addresses.");
      })
      .finally(() => setAddressLoading(false));
  }, [formData.customerid]);

  // ── Handle input changes ──
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // ── Handle Customer Selection from Search ──
  const handleCustomerChange = (cid) => {
    setFormData((prev) => ({ ...prev, customerid: cid, addressid: "" }));
    if (errors.customerid) {
      setErrors((prev) => ({ ...prev, customerid: "" }));
    }
  };

  // ── Handle Standard Selection from Search ──
  const handleStandardChange = (sid) => {
    setFormData((prev) => ({ ...prev, iscode: sid }));
    if (errors.iscode) {
      setErrors((prev) => ({ ...prev, iscode: "" }));
    }
  };

  // ── Validation ──
  const validate = () => {
    const newErrors = {};
    if (!formData.consentletterdate) newErrors.consentletterdate = "Date is required.";
    if (!formData.iscode) newErrors.iscode = "Standard is required.";
    if (!formData.customerid) newErrors.customerid = "Customer is required.";
    if (!formData.addressid) newErrors.addressid = "Customer address is required.";
    return newErrors;
  };

  // ── Submit (mirrors insertconcent.php) ──
  const handleSubmit = async () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error("Please fix the errors before submitting.");
      return;
    }

    try {
      setSubmitting(true);

      // Find selected customer name
      const selectedCustomer = customers.find(c => String(c.id) === String(formData.customerid));

      // Prepare payload to match requirement exactly
      const payload = {
        consentletterdate: dayjs(formData.consentletterdate).format("DD/MM/YYYY"),
        iscode: Number(formData.iscode),
        customerid: Number(formData.customerid),
        customername: selectedCustomer?.name || "",
        addressid: Number(formData.addressid),
        remark: formData.remark,
        remark2: formData.remark2,
      };

      const response = await axios.post("/accounts/add-consentletter", payload);
      if (response.data.status === true || response.data.status === "true") {
        toast.success(response.data.message || "Consent letter added successfully ✅");
        navigate("/dashboards/accounts/consent-letter");
      } else {
        toast.error(response.data.message ?? "Failed to add consent letter.");
      }
    } catch (err) {
      console.error("Submit error:", err);
      toast.error(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Page title="Add Consent Letter">
      <div className="p-4 sm:p-6">

        {/* ── Header ── */}
        <div className="mb-6 flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
          <h1 className="text-xl font-semibold text-gray-800 dark:text-dark-50">
            Consent Form
          </h1>
          <button
            onClick={() => navigate("/dashboards/accounts/consent-letter")}
            className="rounded border border-gray-300 bg-primary-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-primary-700"
          >
            &laquo; Back to Consent Letter List
          </button>
        </div>

        {/* ── Form Card ── */}
        <div className="rounded border border-gray-200 bg-white dark:border-dark-600 dark:bg-dark-800">
          <div className="divide-y divide-gray-100 dark:divide-dark-600">

            {/* Consent Letter Date */}
            <FormRow label="Consent Letter Date" required error={errors.consentletterdate}>
              <input
                type="date"
                name="consentletterdate"
                value={formData.consentletterdate}
                onChange={handleChange}
                className={inputClass(errors.consentletterdate)}
              />
            </FormRow>

            {/* Standard — implemented with Searchable Dropdown */}
            <FormRow label="Standard" required error={errors.iscode}>
              <SearchableSelect
                items={standards}
                value={formData.iscode}
                onChange={handleStandardChange}
                disabled={standardsLoading}
                error={errors.iscode}
                placeholder="Search and select standard..."
                loadingPlaceholder="Loading standards..."
              />
            </FormRow>

            {/* Customer Name — implemented with Searchable Dropdown */}
            <FormRow label="Customer Name" required error={errors.customerid}>
              <SearchableSelect
                items={customers}
                value={formData.customerid}
                onChange={handleCustomerChange}
                disabled={customersLoading}
                error={errors.customerid}
                placeholder="Search and select customer..."
                loadingPlaceholder="Loading customers..."
              />
            </FormRow>

            {/* Customer Address — dependent on Customer selection */}
            <FormRow label="Customer Address" required error={errors.addressid}>
              <select
                name="addressid"
                value={formData.addressid}
                onChange={handleChange}
                disabled={!formData.customerid || addressLoading}
                className={inputClass(errors.addressid)}
              >
                <option value="">
                  {!formData.customerid
                    ? "Select a customer first"
                    : addressLoading
                      ? "Loading addresses..."
                      : customerAddresses.length === 0
                        ? "No addresses found"
                        : "Select Address"}
                </option>
                {customerAddresses.map((addr) => (
                  <option key={addr.id} value={addr.id}>
                    {addr.display || addr.full_address || addr.address}
                  </option>
                ))}
              </select>
            </FormRow>

            {/* Remark */}
            <FormRow label="Remark" error={errors.remark}>
              <textarea
                name="remark"
                id="remark"
                value={formData.remark}
                onChange={handleChange}
                rows={3}
                className={inputClass(errors.remark)}
                placeholder="Enter remark"
              />
            </FormRow>

            {/* Remark 2 */}
            <FormRow label="Remark 2" error={errors.remark2}>
              <textarea
                name="remark2"
                id="remark2"
                value={formData.remark2}
                onChange={handleChange}
                rows={3}
                className={inputClass(errors.remark2)}
                placeholder="Enter remark 2"
              />
            </FormRow>

            {/* Submit */}
            <div className="px-4 py-4 sm:px-6">
              <div className="sm:ml-[16.67%]">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="rounded bg-primary-600 px-5 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "Submitting..." : "Submit"}
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>
    </Page>
  );
}

// ── Helpers ──

function inputClass(error) {
  return [
    "w-full rounded border px-3 py-2 text-sm outline-none transition",
    "focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20",
    "dark:bg-dark-700 dark:text-dark-100",
    error
      ? "border-red-400 dark:border-red-500"
      : "border-gray-300 dark:border-dark-500",
  ].join(" ");
}

function FormRow({ label, required, error, children }) {
  return (
    <div className="flex flex-col gap-1.5 px-4 py-4 sm:flex-row sm:items-start sm:px-6">
      <label className="w-full shrink-0 pt-2 text-sm font-medium text-gray-700 dark:text-dark-200 sm:w-1/6">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      <div className="w-full sm:w-5/6">
        {children}
        {error && (
          <p className="mt-1 text-xs text-red-500">{error}</p>
        )}
      </div>
    </div>
  );
}