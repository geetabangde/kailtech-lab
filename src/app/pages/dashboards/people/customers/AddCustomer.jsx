import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import axios from "utils/axios";
import { toast } from "sonner";
import { Button, Input, Select } from "components/ui";
import { Page } from "components/shared/Page";
import ReactSelect from "react-select";

export default function AddCustomer() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    name: "",
    customertype: [],
    modeofpayment: "",
    creditdays: "",
    creditamount: "",
    mobile: "",
    pname: "",
    pnumber: "",
    email: "",
    country: "",
    stateid: "",
    state: "", // For non-India countries (text input)
    city: "",
    gstno: "",
    pan: "",
    discount: "",
    thumb_image: null
  });

  const [customerTypeOptions, setCustomerTypeOptions] = useState([]);
  const [paymentModes, setPaymentModes] = useState([]);
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [isIndianCountry, setIsIndianCountry] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // Required fields (thumb_image is optional)
  const getRequiredFields = () => {
    const fields = {
      name: "Customer Name",
      customertype: "Customer Type",
      modeofpayment: "Mode of Payment",
      creditdays: "Credit Days",
      creditamount: "Credit Amount",
      mobile: "Mobile",
      pname: "Contact Person Name",
      pnumber: "Contact Person Number",
      email: "Email",
      country: "Country",
      city: "City",
      gstno: "GST No",
      pan: "PAN",
      discount: "Discount %"
    };

    // Add state field based on country
    if (isIndianCountry) {
      fields.stateid = "State";
    } else {
      fields.state = "State";
    }

    return fields;
  };

  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const [ctRes, pmRes, countryRes, stateRes] = await Promise.all([
          axios.get("/people/get-customer-type-list"),
          axios.get("/people/get-payment-mode"),
          axios.get("/people/get-country"),
          axios.get("/people/get-state"),
        ]);

        console.log("Customer Types:", ctRes?.data);
        console.log("Payment Modes:", pmRes?.data);
        console.log("Countries:", countryRes?.data);
        console.log("States:", stateRes?.data);

        // Fix: Correct response paths
        const ctData = Array.isArray(ctRes?.data?.Data) ? ctRes.data.Data : [];
        const pmData = Array.isArray(pmRes?.data?.data) ? pmRes.data.data : [];
        const countryData = Array.isArray(countryRes?.data?.data) ? countryRes.data.data : [];
        const stateData = Array.isArray(stateRes?.data?.data) ? stateRes.data.data : [];

        // Mapping for dropdowns
        setCustomerTypeOptions(
          ctData.map((item) => ({ label: item.name, value: item.id }))
        );
        setPaymentModes(
          pmData.map((item) => ({ label: item.name, value: item.id }))
        );
        setCountries(
          countryData.map((item) => ({ label: item.name, value: item.id }))
        );

        setStates(
          stateData.map((item) => ({ label: item.state, value: item.id }))
        );

      } catch (err) {
        toast.error("Error loading dropdown data");
        console.error("Dropdown Fetch Error:", err);
      }
    };

    fetchDropdowns();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;

    if (files) {
      setFormData((prev) => ({ ...prev, [name]: files[0] }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: false
      }));
    }
  };

  const handleMultiSelectChange = (selectedOptions, name) => {
    setFormData((prev) => ({
      ...prev,
      [name]: selectedOptions ? selectedOptions.map((opt) => opt.value) : []
    }));

    // Clear error when user makes selection
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: false
      }));
    }
  };

  const handleSelectChange = (e, name) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when user makes selection
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: false
      }));
    }

    // Handle country change - check if India (id = "1")
    if (name === "country") {
      const isIndia = value === "1";
      setIsIndianCountry(isIndia);

      // Reset state fields when country changes
      setFormData((prev) => ({
        ...prev,
        stateid: "",
        state: ""
      }));

      // Clear state errors
      setErrors(prev => ({
        ...prev,
        stateid: false,
        state: false
      }));
    }
  };



  const validateForm = async () => {
    const newErrors = {};
    const newValidationErrors = {};
    const requiredFields = getRequiredFields();

    // Check all required fields
    Object.keys(requiredFields).forEach(field => {
      if (field === 'customertype') {
        // For customertype array, check if it has at least one item
        if (!formData[field] || formData[field].length === 0) {
          newErrors[field] = true;
        }
      } else {
        // For other fields, check if empty or whitespace only
        if (!formData[field] || formData[field].toString().trim() === '') {
          newErrors[field] = true;
        }
      }
    });

    setErrors(newErrors);
    setValidationErrors(newValidationErrors);

    // If there are errors, focus on the first error field
    const allErrors = { ...newErrors, ...newValidationErrors };
    if (Object.keys(allErrors).length > 0) {
      const firstErrorField = Object.keys(allErrors)[0];
      const element = document.querySelector(`[name="${firstErrorField}"]`);
      if (element) {
        element.focus();
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form before submission
    const isValid = await validateForm();
    if (!isValid) {
      toast.error("Please fix all errors before submitting");
      return;
    }

    setLoading(true);

    try {
      const payload = new FormData();

      // Add sapua field (from PHP: <input name="sapua" value="1" type="hidden" />)
      payload.append("sapua", "1");

      Object.entries(formData).forEach(([key, value]) => {
        if (key === "customertype") {
          value.forEach((v) => payload.append("customertype[]", v));
        } else if (key === "thumb_image" && value) {
          // Only append image if file is selected
          payload.append(key, value);
        } else if (key === "stateid" || key === "state") {
          // Only send the relevant state field based on country
          if (isIndianCountry && key === "stateid" && value) {
            payload.append(key, value);
          } else if (!isIndianCountry && key === "state" && value) {
            payload.append(key, value);
          }
        } else if (key !== "thumb_image") {
          // Append all other fields
          payload.append(key, value);
        }
      });

      const res = await axios.post("/people/add-customer", payload);
      console.log("Add Customer Response:", res.data);

      if (res.data.status === true || res.data.status === "true") {
        window.alert("Success : New Customer has been Added");
        // Redirect to edit page to add addresses and contacts
        let customerId = res.data.id || res.data.customer_id || res.data.customerid || res.data.insertId || res.data.hakuna || res.data.pradin;
        if (!customerId && res.data.data) {
          if (typeof res.data.data === 'object') {
            customerId = res.data.data.id || res.data.data.customer_id;
          } else {
            customerId = res.data.data; // e.g. if data is just the ID number
          }
        }

        console.log("Full API Response:", res.data);
        console.log("Extracted Customer ID:", customerId);

        if (customerId) {
          navigate(`/dashboards/people/customers/edit/${customerId}`);
        } else {
          console.warn("No customer ID found in response, redirecting to list");
          navigate("/dashboards/people/customers");
        }
      } else {
        toast.error(res.data.message || "Failed to add customer");
      }
    } catch (err) {
      toast.error("Something went wrong");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page title="Add Customers">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Add Customer</h2>
          <Button
            variant="outline"
            className="text-white bg-blue-600 hover:bg-blue-700"
            onClick={() => navigate("/dashboards/people/customers")}
          >
            Back to List
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Input
              label="Customer Name"
              name="name"
              placeholder="Customer name"
              onChange={handleInputChange}
              value={formData.name}
              className={errors.name || validationErrors.name ? "border-red-500 bg-red-50" : ""}
            />
            {errors.name && (
              <p className="text-red-600 text-sm mt-1">This field is required</p>
            )}
            {validationErrors.name && (
              <p className="text-red-600 text-sm mt-1">{validationErrors.name}</p>
            )}
          </div>

          {/* Customer Type - Multi Select */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
              Customer Type <span className="text-red-500">*</span>
            </label>
            <ReactSelect
              isMulti
              name="customertype"
              options={customerTypeOptions}
              onChange={(selected) => handleMultiSelectChange(selected, "customertype")}
              placeholder="Select customer types"
              className={errors.customertype ? "react-select-error" : ""}
            />
            {errors.customertype && (
              <p className="text-red-600 text-sm mt-1">This field is required</p>
            )}
          </div>

          {/* Payment Mode */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
              Mode of Payment <span className="text-red-500">*</span>
            </label>
            <Select
              name="modeofpayment"
              onChange={(e) => handleSelectChange(e, "modeofpayment")}
              value={formData.modeofpayment}
              className={errors.modeofpayment ? "border-red-500 bg-red-50" : ""}
            >
              <option value="">Choose...</option>
              {paymentModes.map((mode) => (
                <option key={mode.value} value={mode.value}>
                  {mode.label}
                </option>
              ))}
            </Select>
            {errors.modeofpayment && (
              <p className="text-red-600 text-sm mt-1">This field is required</p>
            )}
          </div>

          <div>
            <Input
              label="Credit Days"
              name="creditdays"
              type="number"
              placeholder="Credit days"
              onChange={handleInputChange}
              value={formData.creditdays}
              className={errors.creditdays ? "border-red-500 bg-red-50" : ""}
            />
            {errors.creditdays && (
              <p className="text-red-600 text-sm mt-1">This field is required</p>
            )}
          </div>

          <div>
            <Input
              label="Credit Amount"
              name="creditamount"
              type="number"
              placeholder="Credit amount"
              onChange={handleInputChange}
              value={formData.creditamount}
              className={errors.creditamount ? "border-red-500 bg-red-50" : ""}
            />
            {errors.creditamount && (
              <p className="text-red-600 text-sm mt-1">This field is required</p>
            )}
          </div>

          <div>
            <Input
              label="Mobile"
              name="mobile"
              type="tel"
              placeholder="Mobile number"
              onChange={handleInputChange}
              value={formData.mobile}
              className={errors.mobile ? "border-red-500 bg-red-50" : ""}
            />
            {errors.mobile && (
              <p className="text-red-600 text-sm mt-1">This field is required</p>
            )}
          </div>

          <div>
            <Input
              label="Contact Person Name"
              name="pname"
              placeholder="Contact person name"
              onChange={handleInputChange}
              value={formData.pname}
              className={errors.pname ? "border-red-500 bg-red-50" : ""}
            />
            {errors.pname && (
              <p className="text-red-600 text-sm mt-1">This field is required</p>
            )}
          </div>

          <div>
            <Input
              label="Contact Person Number"
              name="pnumber"
              type="tel"
              placeholder="Contact person number"
              onChange={handleInputChange}
              value={formData.pnumber}
              className={errors.pnumber ? "border-red-500 bg-red-50" : ""}
            />
            {errors.pnumber && (
              <p className="text-red-600 text-sm mt-1">This field is required</p>
            )}
          </div>

          <div>
            <Input
              label="Email"
              name="email"
              type="text"
              placeholder="Email address"
              onChange={handleInputChange}
              value={formData.email}
              className={errors.email || validationErrors.email ? "border-red-500 bg-red-50" : ""}
            />
            {errors.email && (
              <p className="text-red-600 text-sm mt-1">This field is required</p>
            )}
            {validationErrors.email && (
              <p className="text-red-600 text-sm mt-1">{validationErrors.email}</p>
            )}
          </div>

          {/* Country */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
              Country <span className="text-red-500">*</span>
            </label>
            <Select
              name="country"
              onChange={(e) => handleSelectChange(e, "country")}
              value={formData.country}
              className={errors.country ? "border-red-500 bg-red-50" : ""}
            >
              <option value="">Choose one...</option>
              {countries.map((country) => (
                <option key={country.value} value={country.value}>
                  {country.label}
                </option>
              ))}
            </Select>
            {errors.country && (
              <p className="text-red-600 text-sm mt-1">This field is required</p>
            )}
          </div>

          {/* State - Dynamic: Dropdown for India, Text input for others */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
              State <span className="text-red-500">*</span>
            </label>
            {isIndianCountry ? (
              <>
                <Select
                  name="stateid"
                  onChange={(e) => handleSelectChange(e, "stateid")}
                  value={formData.stateid}
                  className={errors.stateid ? "border-red-500 bg-red-50" : ""}
                >
                  <option value="">Choose state...</option>
                  {states.map((state) => (
                    <option key={state.value} value={state.value}>
                      {state.label}
                    </option>
                  ))}
                </Select>
                {errors.stateid && (
                  <p className="text-red-600 text-sm mt-1">This field is required</p>
                )}
              </>
            ) : (
              <>
                <Input
                  name="state"
                  placeholder="Enter state"
                  onChange={handleInputChange}
                  value={formData.state}
                  className={errors.state ? "border-red-500 bg-red-50" : ""}
                />
                {errors.state && (
                  <p className="text-red-600 text-sm mt-1">This field is required</p>
                )}
              </>
            )}
          </div>

          <div>
            <Input
              label={
                <>
                  City <span className="text-red-500">*</span>
                </>
              }
              name="city"
              placeholder="City"
              onChange={handleInputChange}
              value={formData.city}
              className={errors.city ? "border-red-500 bg-red-50" : ""}
            />
            {errors.city && (
              <p className="text-red-600 text-sm mt-1">This field is required</p>
            )}
          </div>

          <div>
            <Input
              label={
                <>
                  GST No <span className="text-red-500">*</span>
                </>
              }
              name="gstno"
              placeholder="GST Number"
              onChange={handleInputChange}
              value={formData.gstno}
              className={errors.gstno || validationErrors.gstno ? "border-red-500 bg-red-50" : ""}
            />
            {errors.gstno && (
              <p className="text-red-600 text-sm mt-1">This field is required</p>
            )}
            {validationErrors.gstno && (
              <p className="text-red-600 text-sm mt-1">{validationErrors.gstno}</p>
            )}
          </div>

          <div>
            <Input
              label={
                <>
                  PAN <span className="text-red-500">*</span>
                </>
              }
              name="pan"
              placeholder="PAN number"
              onChange={handleInputChange}
              value={formData.pan}
              className={errors.pan ? "border-red-500 bg-red-50" : ""}
            />
            {errors.pan && (
              <p className="text-red-600 text-sm mt-1">This field is required</p>
            )}
          </div>

          <div>
            <Input
              label={
                <>
                  Discount % <span className="text-red-500">*</span>
                </>
              }
              name="discount"
              type="number"
              placeholder="Discount percentage"
              onChange={handleInputChange}
              value={formData.discount}
              className={errors.discount ? "border-red-500 bg-red-50" : ""}
            />
            {errors.discount && (
              <p className="text-red-600 text-sm mt-1">This field is required</p>
            )}
          </div>

          {/* Image Upload - Optional */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-white">
              Upload Photo
            </label>
            <input
              type="file"
              name="thumb_image"
              accept="image/*"
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-primary-600 file:text-white hover:file:bg-primary-700"
            />
          </div>

          <div className="col-span-1 md:col-span-2">
            <Button type="submit" color="primary" disabled={loading}>
              {loading ? (
                <div className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z"></path>
                  </svg>
                  Saving...
                </div>
              ) : (
                "Save"
              )}
            </Button>
          </div>
        </form>
      </div>
    </Page>
  );
}