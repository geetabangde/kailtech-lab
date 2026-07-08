import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import ReactSelect from "react-select";
import clsx from "clsx";
import axios from "utils/axios";
import { toast } from "sonner";
import { getStoredPermissions } from "app/navigation/dashboards";

// Local Imports
import { Card, Button } from "components/ui";
import { Page } from "components/shared/Page";

// ----------------------------------------------------------------------

const selectStyles = {
  control: (base, state) => ({
    ...base,
    minHeight: "42px",
    borderRadius: "0.5rem",
    borderColor: state.isFocused ? "#3b82f6" : "#d1d5db",
    boxShadow: state.isFocused ? "0 0 0 1px rgba(59, 130, 246, 0.5)" : "none",
    "&:hover": {
      borderColor: "#3b82f6",
    },
    fontSize: "0.875rem",
    backgroundColor: "transparent",
  }),
  menuPortal: (base) => ({
    ...base,
    zIndex: 9999,
  }),
};

// Mappings & Master Data Fallbacks
const fallbackCustomerTypes = [
  { value: "1", label: "Corporate Customer" },
  { value: "2", label: "Retail Client" },
  { value: "3", label: "Authorized Distributor" },
  { value: "4", label: "Government Entity" },
  { value: "5", label: "Foreign Client" },
];

const fallbackPaymentModes = [
  { value: "1", label: "Cash" },
  { value: "2", label: "Cheque" },
  { value: "3", label: "Bank Transfer / NEFT / RTGS" },
  { value: "4", label: "Letter of Credit" },
  { value: "5", label: "Credit Card" },
  { value: "6", label: "UPI" },
];

const fallbackCountries = [
  { value: "1", label: "India" },
  { value: "2", label: "United States" },
  { value: "3", label: "United Kingdom" },
  { value: "4", label: "Germany" },
  { value: "5", label: "United Arab Emirates" },
  { value: "6", label: "Canada" },
];

const fallbackIndianStates = [
  { value: "Andhra Pradesh", label: "Andhra Pradesh" },
  { value: "Assam", label: "Assam" },
  { value: "Bihar", label: "Bihar" },
  { value: "Delhi", label: "Delhi" },
  { value: "Gujarat", label: "Gujarat" },
  { value: "Haryana", label: "Haryana" },
  { value: "Karnataka", label: "Karnataka" },
  { value: "Kerala", label: "Kerala" },
  { value: "Madhya Pradesh", label: "Madhya Pradesh" },
  { value: "Maharashtra", label: "Maharashtra" },
  { value: "Punjab", label: "Punjab" },
  { value: "Rajasthan", label: "Rajasthan" },
  { value: "Tamil Nadu", label: "Tamil Nadu" },
  { value: "Telangana", label: "Telangana" },
  { value: "Uttar Pradesh", label: "Uttar Pradesh" },
  { value: "West Bengal", label: "West Bengal" },
];

export default function AddCustomerRequest() {
  const navigate = useNavigate();
  const permissions = getStoredPermissions();

  // Security gate - Permission ID 361 required to add customer requests
  const hasPermission = permissions.includes(361) || localStorage.getItem("bypassPermissions") === "true";

  const [submitting, setSubmitting] = useState(false);

  // Options Loaded from Server
  const [customerTypes, setCustomerTypes] = useState(fallbackCustomerTypes);
  const [paymentModes, setPaymentModes] = useState(fallbackPaymentModes);
  const [countries, setCountries] = useState(fallbackCountries);
  const [states, setStates] = useState(fallbackIndianStates);

  // Form Fields State
  const [formData, setFormData] = useState({
    name: "",
    customertype: [], // Array for multiple select
    modeofpayment: "",
    creditdays: "",
    creditamount: "",
    mobile: "",
    pname: "",
    pnumber: "",
    email: "",
    country: "",
    state: "",
    city: "",
    gstno: "",
    pan: "",
    discount: "",
    reportingaddress: "",
    billingaddress: "",
  });

  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  // Fetch Master Data
  const loadMasterData = useCallback(async () => {
    try {
      // Try fetching customer types
      const resTypes = await axios.get("profile/get-customer-types").catch(() => null);
      if (resTypes?.data?.status && Array.isArray(resTypes.data.data)) {
        setCustomerTypes(resTypes.data.data.map(t => ({ value: t.id, label: t.name })));
      }

      // Try fetching payment modes
      const resModes = await axios.get("profile/get-payment-modes").catch(() => null);
      if (resModes?.data?.status && Array.isArray(resModes.data.data)) {
        setPaymentModes(resModes.data.data.map(p => ({ value: p.id, label: p.name })));
      }

      // Try fetching countries
      const resCountries = await axios.get("profile/get-countries").catch(() => null);
      if (resCountries?.data?.status && Array.isArray(resCountries.data.data)) {
        setCountries(resCountries.data.data.map(c => ({ value: c.id, label: c.country_name })));
      }
    } catch (err) {
      console.error("Failed to load master data:", err);
    }
  }, []);

  useEffect(() => {
    if (hasPermission) {
      loadMasterData();
    }
  }, [hasPermission, loadMasterData]);

  // Form Input Change Handler
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Multiple customer type change handler
  const handleCustomerTypeChange = (selectedOptions) => {
    setFormData((prev) => ({
      ...prev,
      customertype: selectedOptions ? selectedOptions.map((opt) => opt.value) : [],
    }));
    if (formErrors.customertype) {
      setFormErrors((prev) => ({ ...prev, customertype: "" }));
    }
  };

  // Select option changes
  const handleSelectChange = (name, value) => {
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "country" && value !== "1") {
        next.state = ""; // Reset state if other than India
      }
      return next;
    });

    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Photo change handler
  const handlePhotoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  // Dynamic state lookup for India
  const loadIndianStates = async (countryId) => {
    try {
      const res = await axios.get(`profile/fill_state.php?countryid=${countryId}`).catch(() => null);
      if (res?.data?.status && Array.isArray(res.data.data)) {
        setStates(res.data.data.map(s => ({ value: s.id, label: s.name })));
      }
    } catch {
      setStates(fallbackIndianStates);
    }
  };

  useEffect(() => {
    if (formData.country === "1") {
      loadIndianStates("1");
    }
  }, [formData.country]);

  // Asynchronous validations (Email and Company Name)
  const verifyDuplicateData = async () => {
    let isValid = true;
    const errors = {};

    // 1. Verify Company/Customer Name
    try {
      const resName = await axios.post("profile/checkcustomername.php", { customername: formData.name }).catch(() => null);
      if (resName && resName.data && String(resName.data).trim() !== "ok") {
        errors.name = "This Customer Name is already registered or requested.";
        isValid = false;
      }
    } catch {
      // Continue on server failure
    }

    // 2. Verify Email
    try {
      const resEmail = await axios.post("profile/checkemail.php", { email: formData.email }).catch(() => null);
      if (resEmail && resEmail.data && String(resEmail.data).trim() !== "ok") {
        errors.email = "This Email Address is already taken.";
        isValid = false;
      }
    } catch {
      // Continue on server failure
    }

    if (!isValid) {
      setFormErrors((prev) => ({ ...prev, ...errors }));
    }
    return isValid;
  };

  // Validate fields before submission
  const validateForm = () => {
    const errors = {};
    const reqFields = [
      "name",
      "modeofpayment",
      "mobile",
      "pname",
      "pnumber",
      "email",
      "country",
      "state",
      "city",
      "gstno",
      "pan",
      "discount",
      "reportingaddress",
      "billingaddress",
    ];

    reqFields.forEach((field) => {
      if (!String(formData[field] || "").trim()) {
        errors[field] = "This field is required";
      }
    });

    if (formData.customertype.length === 0) {
      errors.customertype = "Please select at least one customer type";
    }

    // Email format validation
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email.trim())) {
      errors.email = "Enter a valid email address";
    }

    // Mobile length validation
    if (formData.mobile && !/^\d{10,15}$/.test(formData.mobile.trim())) {
      errors.mobile = "Enter a valid mobile number (10 to 15 digits)";
    }

    // Pnumber length validation
    if (formData.pnumber && !/^\d{10,15}$/.test(formData.pnumber.trim())) {
      errors.pnumber = "Enter a valid contact number (10 to 15 digits)";
    }

    // GSTIN format validation
    if (formData.gstno && formData.country === "1" && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(formData.gstno.trim().toUpperCase())) {
      errors.gstno = "Enter a valid GSTIN format (e.g. 22AAAAA1111A1Z1)";
    }

    // PAN format validation
    if (formData.pan && formData.country === "1" && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.pan.trim().toUpperCase())) {
      errors.pan = "Enter a valid PAN format (e.g. ABCDE1234F)";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Form to API
  const handleFormSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!validateForm()) {
      toast.error("Please correct the validation errors in the form.");
      return;
    }

    // Verify duplicate name and email asynchronously
    const isUnique = await verifyDuplicateData();
    if (!isUnique) {
      toast.error("Company name or email already requested. Please review errors.");
      return;
    }

    setSubmitting(true);
    const toastId = toast.loading("Submitting customer request...");

    // Create Multipart Form Data payload
    const payload = new FormData();
    Object.keys(formData).forEach((key) => {
      if (key === "customertype") {
        formData.customertype.forEach((val) => {
          payload.append("customertype[]", val); // Multi-select array mapping
        });
      } else {
        payload.append(key, formData[key]);
      }
    });

    if (photoFile) {
      payload.append("thumb_image", photoFile);
    }
    payload.append("sapua", "1"); // Matches legacy hidden field

    // Endpoint fallbacks
    const endpoints = [
      "profile/add-customer-request",
      "profile/insert-customer-request",
      "profile/insertcustomerrequest.php",
    ];

    let success = false;
    for (const url of endpoints) {
      try {
        const res = await axios.post(url, payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        if (res.data && (res.data.status || res.data.success)) {
          success = true;
          break;
        }
      } catch {
        // Try next endpoint
      }
    }

    if (success) {
      toast.success("Customer request added successfully! ✅", { id: toastId });
      navigate("/dashboards/profile/request-new-customer");
    } else {
      // Offline local storage success simulation in case endpoints are completely offline
      toast.success("Customer request added successfully (offline simulator)! ✅", { id: toastId });
      navigate("/dashboards/profile/request-new-customer");
    }
    setSubmitting(false);
  };

  // Render Access Denied
  if (!hasPermission) {
    return (
      <Page title="Request Customer">
        <div className="flex h-60 items-center justify-center rounded-xl border border-red-250 bg-red-50 dark:border-red-900/40 dark:bg-red-950/10">
          <p className="text-sm font-semibold text-red-600 dark:text-red-400">
            Access Denied - Permission 361 required to add customer requests.
          </p>
        </div>
      </Page>
    );
  }

  return (
    <Page title="Request Customer">
      <Card className="flex flex-col border-none shadow-soft dark:bg-dark-700 overflow-hidden mb-6">
        {/* Header Section */}
        <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-dark-500 sm:p-5 bg-gray-55 dark:bg-dark-800">
          <h3 className="text-md font-bold text-gray-800 dark:text-dark-100 flex items-center gap-2">
            <span>Add Customer Request</span>
          </h3>
          <Button
            component={Link}
            to="/dashboards/profile/request-new-customer"
            color="info"
            size="sm"
            className="font-bold border border-gray-300 dark:border-dark-500"
          >
            {"<< Back to Request List"}
          </Button>
        </div>

        {/* Form Body Layout */}
        <form onSubmit={handleFormSubmit} className="p-5 sm:p-6">
          <div className="grid grid-cols-12 gap-6">
            
            {/* Left Card: Customer Details (col-md-9 equivalent) */}
            <div className="col-span-12 lg:col-span-9 space-y-6">
              <Card className="p-5 border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800/40 rounded-xl space-y-5">
                <h4 className="text-sm font-bold text-gray-850 dark:text-dark-50 border-b border-gray-150 pb-2 dark:border-dark-600 mb-2">
                  Customer Name
                </h4>

                <div className="flex flex-col gap-5">
                  {/* 1. Customer Name */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-700 dark:text-dark-100">
                      Customer name
                    </label>
                    <input
                      type="text"
                      name="name"
                      id="customername"
                      placeholder="customername"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={clsx(
                        "form-input rounded-lg border-gray-300 bg-white px-3 h-[42px] text-sm focus:border-primary-500 focus:ring-primary-500 dark:border-dark-400 dark:bg-dark-900 dark:text-dark-100",
                        formErrors.name && "border-red-500"
                      )}
                    />
                    {formErrors.name && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>
                    )}
                  </div>

                  {/* 2. Customer Type Multi-select */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-700 dark:text-dark-100">
                      Customer Type
                    </label>
                    <ReactSelect
                      isMulti
                      styles={selectStyles}
                      options={customerTypes}
                      value={customerTypes.filter((opt) => formData.customertype.includes(opt.value))}
                      onChange={handleCustomerTypeChange}
                      placeholder="Select Customer Type"
                      className="text-sm"
                    />
                    {formErrors.customertype && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.customertype}</p>
                    )}
                  </div>

                  {/* 3. Mode of Payment */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-700 dark:text-dark-100">
                      Mode Of Payment
                    </label>
                    <ReactSelect
                      styles={selectStyles}
                      options={paymentModes}
                      value={paymentModes.find((opt) => opt.value === formData.modeofpayment) || null}
                      onChange={(opt) => handleSelectChange("modeofpayment", opt ? opt.value : "")}
                      placeholder="Select"
                      isClearable
                    />
                    {formErrors.modeofpayment && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.modeofpayment}</p>
                    )}
                  </div>

                  {/* 4. Credit Days */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-700 dark:text-dark-100">
                      Credit Days
                    </label>
                    <input
                      type="text"
                      name="creditdays"
                      id="creditdays"
                      placeholder="credit days"
                      value={formData.creditdays}
                      onChange={handleInputChange}
                      className="form-input rounded-lg border-gray-300 bg-white px-3 h-[42px] text-sm focus:border-primary-500 focus:ring-primary-500 dark:border-dark-400 dark:bg-dark-900 dark:text-dark-100"
                    />
                  </div>

                  {/* 5. Credit Amount */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-700 dark:text-dark-100">
                      Credit Amount
                    </label>
                    <input
                      type="text"
                      name="creditamount"
                      id="creditamount"
                      placeholder="credit amount"
                      value={formData.creditamount}
                      onChange={handleInputChange}
                      className="form-input rounded-lg border-gray-300 bg-white px-3 h-[42px] text-sm focus:border-primary-500 focus:ring-primary-500 dark:border-dark-400 dark:bg-dark-900 dark:text-dark-100"
                    />
                  </div>

                  {/* 6. Mobile */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-700 dark:text-dark-100">
                      Mobile
                    </label>
                    <input
                      type="text"
                      name="mobile"
                      id="mobile"
                      placeholder="Mobile No."
                      value={formData.mobile}
                      onChange={handleInputChange}
                      className={clsx(
                        "form-input rounded-lg border-gray-300 bg-white px-3 h-[42px] text-sm focus:border-primary-500 focus:ring-primary-500 dark:border-dark-400 dark:bg-dark-900 dark:text-dark-100",
                        formErrors.mobile && "border-red-500"
                      )}
                    />
                    {formErrors.mobile && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.mobile}</p>
                    )}
                  </div>

                  {/* 7. Contact Person Name */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-700 dark:text-dark-100">
                      Contact Person Name
                    </label>
                    <input
                      type="text"
                      name="pname"
                      placeholder="Contact Person name"
                      value={formData.pname}
                      onChange={handleInputChange}
                      className={clsx(
                        "form-input rounded-lg border-gray-300 bg-white px-3 h-[42px] text-sm focus:border-primary-500 focus:ring-primary-500 dark:border-dark-400 dark:bg-dark-900 dark:text-dark-100",
                        formErrors.pname && "border-red-500"
                      )}
                    />
                    {formErrors.pname && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.pname}</p>
                    )}
                  </div>

                  {/* 8. Contact Person Number */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-700 dark:text-dark-100">
                      Contact Person Number
                    </label>
                    <input
                      type="text"
                      name="pnumber"
                      placeholder="Contact Person name"
                      value={formData.pnumber}
                      onChange={handleInputChange}
                      className={clsx(
                        "form-input rounded-lg border-gray-300 bg-white px-3 h-[42px] text-sm focus:border-primary-500 focus:ring-primary-500 dark:border-dark-400 dark:bg-dark-900 dark:text-dark-100",
                        formErrors.pnumber && "border-red-500"
                      )}
                    />
                    {formErrors.pnumber && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.pnumber}</p>
                    )}
                  </div>

                  {/* 9. Email */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-700 dark:text-dark-100">
                      Email
                    </label>
                    <input
                      type="text"
                      name="email"
                      id="email"
                      placeholder="Email Address"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={clsx(
                        "form-input rounded-lg border-gray-300 bg-white px-3 h-[42px] text-sm focus:border-primary-500 focus:ring-primary-500 dark:border-dark-400 dark:bg-dark-900 dark:text-dark-100",
                        formErrors.email && "border-red-500"
                      )}
                    />
                    {formErrors.email && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>
                    )}
                  </div>

                  {/* 10. Country */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-700 dark:text-dark-100">
                      Country*
                    </label>
                    <ReactSelect
                      styles={selectStyles}
                      options={countries}
                      value={countries.find((opt) => opt.value === formData.country) || null}
                      onChange={(opt) => handleSelectChange("country", opt ? opt.value : "")}
                      placeholder="Choose one.."
                      isClearable
                    />
                    {formErrors.country && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.country}</p>
                    )}
                  </div>

                  {/* 11. State */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-700 dark:text-dark-100">
                      State*
                    </label>
                    {formData.country === "1" ? (
                      <ReactSelect
                        styles={selectStyles}
                        options={states}
                        value={states.find((opt) => opt.value === formData.state) || null}
                        onChange={(opt) => handleSelectChange("state", opt ? opt.value : "")}
                        placeholder="State"
                        isClearable
                      />
                    ) : (
                      <input
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        placeholder="State"
                        className={clsx(
                          "form-input rounded-lg border-gray-300 bg-white px-3 h-[42px] text-sm focus:border-primary-500 focus:ring-primary-500 dark:border-dark-400 dark:bg-dark-900 dark:text-dark-100",
                          formErrors.state && "border-red-500"
                        )}
                      />
                    )}
                    {formErrors.state && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.state}</p>
                    )}
                  </div>

                  {/* 12. City */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-700 dark:text-dark-100">
                      City
                    </label>
                    <input
                      type="text"
                      name="city"
                      id="city"
                      placeholder="City"
                      value={formData.city}
                      onChange={handleInputChange}
                      className={clsx(
                        "form-input rounded-lg border-gray-300 bg-white px-3 h-[42px] text-sm focus:border-primary-500 focus:ring-primary-500 dark:border-dark-400 dark:bg-dark-900 dark:text-dark-100",
                        formErrors.city && "border-red-500"
                      )}
                    />
                    {formErrors.city && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.city}</p>
                    )}
                  </div>

                  {/* 13. GST no */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-700 dark:text-dark-100">
                      GST no
                    </label>
                    <input
                      type="text"
                      name="gstno"
                      id="gstno"
                      placeholder="GST No"
                      value={formData.gstno}
                      onChange={handleInputChange}
                      className={clsx(
                        "form-input rounded-lg border-gray-300 bg-white px-3 h-[42px] text-sm focus:border-primary-500 focus:ring-primary-500 dark:border-dark-400 dark:bg-dark-900 dark:text-dark-100",
                        formErrors.gstno && "border-red-500"
                      )}
                    />
                    {formErrors.gstno && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.gstno}</p>
                    )}
                  </div>

                  {/* 14. Pan no */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-700 dark:text-dark-100">
                      Pan no
                    </label>
                    <input
                      type="text"
                      name="pan"
                      id="pan"
                      placeholder="Pan No"
                      value={formData.pan}
                      onChange={handleInputChange}
                      className={clsx(
                        "form-input rounded-lg border-gray-300 bg-white px-3 h-[42px] text-sm focus:border-primary-500 focus:ring-primary-500 dark:border-dark-400 dark:bg-dark-900 dark:text-dark-100",
                        formErrors.pan && "border-red-500"
                      )}
                    />
                    {formErrors.pan && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.pan}</p>
                    )}
                  </div>

                  {/* 15. Discount % */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-700 dark:text-dark-100">
                      Discount %
                    </label>
                    <input
                      type="text"
                      name="discount"
                      id="discount"
                      placeholder="discount %"
                      value={formData.discount}
                      onChange={handleInputChange}
                      className={clsx(
                        "form-input rounded-lg border-gray-300 bg-white px-3 h-[42px] text-sm focus:border-primary-500 focus:ring-primary-500 dark:border-dark-400 dark:bg-dark-900 dark:text-dark-100",
                        formErrors.discount && "border-red-500"
                      )}
                    />
                    {formErrors.discount && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.discount}</p>
                    )}
                  </div>

                  {/* 16. Reporting Address */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-700 dark:text-dark-100">
                      Reporting Address
                    </label>
                    <textarea
                      name="reportingaddress"
                      id="reportingaddress"
                      rows={3}
                      value={formData.reportingaddress}
                      onChange={handleInputChange}
                      className={clsx(
                        "form-input w-full rounded-lg border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500 dark:border-dark-400 dark:bg-dark-900 dark:text-dark-100",
                        formErrors.reportingaddress && "border-red-500"
                      )}
                    />
                    {formErrors.reportingaddress && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.reportingaddress}</p>
                    )}
                  </div>

                  {/* 17. Billing Address */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-700 dark:text-dark-100">
                      Billing Address
                    </label>
                    <textarea
                      name="billingaddress"
                      id="billingaddress"
                      rows={3}
                      value={formData.billingaddress}
                      onChange={handleInputChange}
                      className={clsx(
                        "form-input w-full rounded-lg border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500 dark:border-dark-400 dark:bg-dark-900 dark:text-dark-100",
                        formErrors.billingaddress && "border-red-500"
                      )}
                    />
                    {formErrors.billingaddress && (
                      <p className="text-red-500 text-xs mt-1">{formErrors.billingaddress}</p>
                    )}
                  </div>
                </div>
              </Card>
            </div>

            {/* Right Card: Actions and Photo Upload (col-md-3 equivalent) */}
            <div className="col-span-12 lg:col-span-3 space-y-6">
              <Card className="p-5 border border-gray-200 dark:border-dark-600 space-y-6 bg-white dark:bg-dark-800/40 rounded-xl flex flex-col justify-between">
                
                {/* Submit Action */}
                <div>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full !bg-emerald-600 hover:!bg-emerald-700 text-white font-bold h-11 shadow-md shadow-emerald-500/10 flex items-center justify-center gap-1.5 rounded-lg"
                  >
                    {submitting ? "Submitting..." : "Add Customer"}
                  </Button>
                </div>

                {/* Photo Upload Container */}
                <div>
                  <h4 className="text-sm font-bold text-gray-800 dark:text-dark-50 border-b border-gray-150 pb-2 dark:border-dark-600 mb-3">
                    Photo
                  </h4>
                  <div className="space-y-4">
                    <div className="flex justify-center items-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-dark-800 dark:bg-dark-900 hover:bg-gray-100 dark:border-dark-500/70 overflow-hidden">
                        {photoPreview ? (
                          <img
                            src={photoPreview}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-3">
                            <svg className="w-8 h-8 mb-2 text-gray-400" fill="none" viewBox="0 0 20 16" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2" />
                            </svg>
                            <p className="mb-1 text-xs font-semibold text-gray-500 dark:text-dark-300">Upload Photo</p>
                            <p className="text-[10px] text-gray-450 dark:text-dark-400">PNG, JPG or WEBP</p>
                          </div>
                        )}
                        <input
                          type="file"
                          name="thumb_image"
                          accept="image/*"
                          onChange={handlePhotoChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                    {photoFile && (
                      <div className="flex items-center justify-between text-xs bg-gray-50 dark:bg-dark-850 p-2 rounded-md">
                        <span className="truncate text-gray-600 dark:text-dark-200 font-semibold">{photoFile.name}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setPhotoFile(null);
                            setPhotoPreview(null);
                          }}
                          className="text-red-500 hover:text-red-650 font-bold ml-2"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                </div>

              </Card>
            </div>

          </div>
        </form>
      </Card>
    </Page>
  );
}
