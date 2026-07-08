import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "utils/axios";
import toast, { Toaster } from "react-hot-toast";
import dayjs from "dayjs";

import { Card, Button, Table, THead, TBody, Th, Tr, Td } from "components/ui";
import { Page } from "components/shared/Page";
import ReactSelect from "react-select";
import AsyncSelect from "react-select/async";

// Helper for Searchable Select
const SearchableSelect = ({ options, value, onChange, placeholder, disabled }) => {
  const customStyles = {
    control: (base) => ({
      ...base,
      minHeight: "42px",
      borderRadius: "0.5rem",
      borderColor: "#D1D5DB",
      boxShadow: "none",
      "&:hover": { borderColor: "#9CA3AF" },
    }),
    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
  };

  const selectedOption = options.find((opt) => opt.value == value) || null;

  return (
    <ReactSelect
      styles={customStyles}
      menuPortalTarget={document.body}
      options={options}
      value={selectedOption}
      onChange={(selected) => onChange(selected ? selected.value : "")}
      placeholder={placeholder || "Select One..."}
      isClearable
      isDisabled={disabled}
    />
  );
};

export default function AddDin() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Master Data State
  const [purposes, setPurposes] = useState([]);
  const [inwardEntries, setInwardEntries] = useState([]);
  const [customerVendors, setCustomerVendors] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [customerAddresses, setCustomerAddresses] = useState([]);
  const [customerContacts, setCustomerContacts] = useState([]);

  // Form State
  const [formData, setFormData] = useState({
    basis: "",
    inward_entry: "",
    purpose: "",
    customerid: "",
    custadd: "",
    custcontact: "",
    customername: "",
    custcontactname: "",
    custphone: "",
    custemail: "",
    custdesignation: "",
    dindate: dayjs().format("YYYY-MM-DD"),
    issuedtoid: "",
    dispatchthrough: "",
    dispatchdate: dayjs().format("YYYY-MM-DD"),
    expectedreturn: "",
    consignname: "",
    consignphone: "",
    dispatchdetial: "",
    dinremark: "",
  });

  const [items, setItems] = useState([]);

  const fetchCustomerDetails = useCallback(async (custId) => {
    try {
      const res = await axios.get(`inventory/get-customer-address-details/${custId}`);
      if (res.data.status && res.data.data) {
        setCustomerAddresses(res.data.data.addresses || []);
        setCustomerContacts(res.data.data.contacts || []);
      }
    } catch (err) {
      console.error("Failed to load customer details", err);
      setCustomerAddresses([]);
      setCustomerContacts([]);
    }
  }, []);

  const fetchCustomerVendorData = useCallback(async (pval) => {
    if (!pval) {
      setCustomerVendors([]);
      return;
    }
    try {
      const res = await axios.get("inventory/get-customer-vendor-data", { params: { pval } });
      console.log("Customer Vendor Data Response:", res.data);
      if (res.data.status && res.data.data) {
        let finalArray = [];
        if (Array.isArray(res.data.data)) {
          finalArray = res.data.data;
        } else if (res.data.data.vendors) {
          finalArray = res.data.data.vendors;
        } else if (res.data.data.customers) {
          finalArray = res.data.data.customers;
        } else if (res.data.data.data) {
          finalArray = res.data.data.data;
        }
        setCustomerVendors(finalArray);
      } else {
        setCustomerVendors([]);
      }
    } catch (err) {
      console.error("Failed to load customer/vendor data", err);
      setCustomerVendors([]);
    }
  }, []);

  const fetchCustomerContactDetails = useCallback(async (contactId) => {
    try {
      const res = await axios.get(`inventory/get-customer-contact/${contactId}`);
      if (res.data.status && res.data.data) {
        const contact = res.data.data;
        setFormData((prev) => ({
          ...prev,
          custphone: contact.mobile || "",
          custemail: contact.email || "",
          custdesignation: contact.designation || "",
          custcontactname: contact.name || ""
        }));
      }
    } catch (err) {
      console.error("Failed to load contact details", err);
    }
  }, []);

  const fetchReturnData = useCallback(async (basisVal) => {
    if (!basisVal) {
      setPurposes([]);
      setInwardEntries([]);
      return;
    }
    try {
      const res = await axios.get("inventory/get-return-data", { params: { return: basisVal } });
      if (res.data.status && res.data.data) {
        setPurposes(res.data.data.purposes || []);
        setInwardEntries(res.data.data.inward_entries || []);
      }
    } catch (err) {
      console.error("Failed to load return data", err);
      toast.error("Failed to fetch basis data");
    }
  }, []);

  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get("hrm/get-employee-list").catch(() => ({ data: { status: false, data: [] } }));
      if (res.data.status) setEmployees(res.data.data);
    } catch (err) {
      console.error("Error fetching initial data:", err);
      toast.error("Failed to load master data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      
      // If basis changes
      if (name === "basis") {
         next.purpose = "";
         next.inward_entry = "";
      }
      
      // If customerid changes
      if (name === "customerid") {
        if ([1, 2, 3, 4, 5, 6, 7, 8, 9, 10].includes(Number(next.purpose))) {
          fetchCustomerDetails(value);
        }
      }

      // If purpose changes, clear out specific fields to reset view
      if (name === "purpose") {
         next.customerid = "";
         next.custadd = "";
         next.customername = "";
         next.custcontactname = "";
         next.custphone = "";
         next.custemail = "";
         next.custdesignation = "";
      }

      return next;
    });

    if (name === "basis") {
      fetchReturnData(value);
    }

    if (name === "purpose") {
      fetchCustomerVendorData(value);
    }

    if (name === "custcontact") {
      if (value) {
        fetchCustomerContactDetails(value);
      } else {
        setFormData((prev) => ({
          ...prev,
          custphone: "",
          custemail: "",
          custdesignation: "",
          custcontactname: ""
        }));
      }
    }
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const removeItem = (index) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const loadInstrumentOptions = async (inputValue) => {
    if (!inputValue || inputValue.length < 3) return [];
    try {
      const res = await axios.get("inventory/search-instruments", { params: { purpose: formData.purpose, search: inputValue } });
      if (res.data.status && res.data.data) {
        return res.data.data.map(item => ({
          label: item.label,
          value: item.instrument_data.instrument_id,
          instrument_data: item.instrument_data
        }));
      }
      return [];
    } catch (err) {
      console.error(err);
      return [];
    }
  };

  const handleInstrumentSelect = (selectedOption) => {
    if (!selectedOption) return;
    const newItem = selectedOption.instrument_data;
    
    if (items.find(i => i.instrumentid == newItem.instrument_id)) {
       toast.error("Instrument Already Added");
       return;
    }

    setItems(prev => [...prev, {
        id: prev.length + 1,
        mmissueid: "", // New item
        instrumentid: newItem.instrument_id,
        name: newItem.instrument_name,
        newidno: newItem.new_id_no,
        serialno: newItem.serial_no,
        mloc: "",
        maxQty: newItem.quantity || 1, 
        qty: 1,
        unit: newItem.unit,
        description: "",
        remark: ""
    }]);
  };

  const fetchMlocQuantity = async (index, mlocId) => {
    if (!mlocId) return;
    try {
      const res = await axios.get("inventory/get-quantity", { params: { id: mlocId } });
      if (res.data.status && res.data.data) {
         handleItemChange(index, "maxQty", res.data.data.validation.max);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const saveDin = async () => {
    if (submitting) return;

    if (!formData.purpose) {
      toast.error("Please select a purpose");
      return;
    }
    
    const pval = Number(formData.purpose);
    if (pval === 11 && !formData.customername.trim()) {
      toast.error("Please enter company name");
      return;
    }
    if (pval === 11 && !formData.custadd.trim()) {
      toast.error("Please enter company address");
      return;
    }

    if (!formData.issuedtoid) {
      toast.error("Please select responsible person");
      return;
    }

    if (!formData.dispatchthrough) {
      toast.error("Please select dispatch through");
      return;
    }

    if (["2", "3"].includes(String(formData.dispatchthrough)) && !formData.consignname.trim()) {
      toast.error("Please enter consignee name");
      return;
    }

    if (["2", "3"].includes(String(formData.dispatchthrough)) && !formData.consignphone.trim()) {
      toast.error("Please enter consignee phone");
      return;
    }
    if ([1, 2, 3, 4, 5, 6, 7, 8, 9, 11].includes(pval) && items.length === 0) {
      toast.error("No Item is Added");
      return;
    }

    if (items.some(item => !item.remark || !item.remark.trim())) {
      toast.error("Please enter Remark for all items in Material Details");
      return;
    }

    if (!formData.dinremark || !formData.dinremark.trim()) {
      toast.error("Please enter Remark");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        basis: formData.basis || "",
        purpose: formData.purpose || "",
        customervendor: "",
        customerid: formData.customerid || "",
        customername: formData.customername || "",
        custadd: formData.custadd || "",
        custcontact: formData.custcontact || "",
        custcontactname: formData.custcontactname || "",
        custphone: formData.custphone || "",
        custemail: formData.custemail || "",
        custdesignation: formData.custdesignation || "",
        
        dindate: formData.dindate ? dayjs(formData.dindate).format("DD/MM/YYYY") : "",
        issuedtoid: formData.issuedtoid || "",
        dispatchthrough: formData.dispatchthrough || "",
        consignname: formData.consignname || "",
        consignphone: formData.consignphone || "",
        dispatchdate: formData.dispatchdate ? dayjs(formData.dispatchdate).format("DD/MM/YYYY") : "",
        expectedreturn: formData.expectedreturn ? dayjs(formData.expectedreturn).format("DD/MM/YYYY") : "",
        dispatchdetial: formData.dispatchdetial || "",
        dinremark: formData.dinremark || "",

        // Arrays
        mmid: items.map(i => i.instrumentid || ""),
        serialno: items.map(i => i.serialno || ""),
        mloc: items.map(i => i.mloc || ""),
        qty: items.map(i => i.qty || 1),
        description: items.map(i => i.description || ""),
        remark: items.map(i => i.remark || ""),
        mmissueid: items.map(i => i.mmissueid || "")
      };

      const response = await axios.post("inventory/create-din", payload);
      
      // Support both status and success flags based on API conventions
      if (response.data.status || response.data.success) {
        toast.success(response.data.message || "DIN created successfully");
        navigate(-1);
      } else {
        toast.error(response.data.message || "Failed to create DIN");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while saving");
    } finally {
      setSubmitting(false);
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    saveDin();
  };

  if (loading) {
    return (
      <Page title="Add Din">
        <div className="flex h-64 items-center justify-center">
           <span className="text-gray-500">Loading Form...</span>
        </div>
      </Page>
    );
  }

  const pval = Number(formData.purpose);
  const showVendor = [1, 5, 6, 7, 10].includes(pval);
  const showCustomer = [2, 3, 4, 8, 9].includes(pval);
  const showCustomCompany = pval === 11;

  return (
    <Page title="Add Din">
      <Toaster position="top-right" />
      <Card className="flex flex-col border-none shadow-soft dark:bg-dark-700">
        <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-dark-500 sm:p-5">
          <h3 className="text-lg font-bold text-gray-800 dark:text-dark-100">
            Add Din
          </h3>
          <Button
            onClick={() => navigate(-1)}
            color="info"
            size="sm"
          >
            {"<< Back"}
          </Button>
        </div>

        <div className="p-4 sm:p-5">
          <form onSubmit={onSubmit} noValidate className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-700 dark:text-dark-200">Basis</label>
                  <SearchableSelect
                    options={[
                      { value: "Returnable", label: "Returnable" },
                      { value: "Non Returnable", label: "Non Returnable" }
                    ]}
                    value={formData.basis}
                    onChange={(val) => handleSelectChange("basis", val)}
                  />
                </div>

                {!!formData.basis && (
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-semibold text-gray-700 dark:text-dark-200">Purpose</label>
                    <SearchableSelect
                      options={purposes.map(p => ({ value: p.id, label: p.name }))}
                      value={formData.purpose}
                      onChange={(val) => handleSelectChange("purpose", val)}
                    />
                  </div>
                )}

                {formData.basis === "Non Returnable" && [8, 9, 10].includes(Number(formData.purpose)) && inwardEntries.length > 0 && (
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-semibold text-gray-700 dark:text-dark-200">Inward Entry</label>
                    <SearchableSelect
                      options={inwardEntries.map(entry => ({ 
                        value: entry.id, 
                        label: `ID: ${entry.id} - ${entry.customername || "Unknown"}` 
                      }))}
                      value={formData.inward_entry}
                      onChange={(val) => handleSelectChange("inward_entry", val)}
                    />
                  </div>
                )}

                {/* Vendor Section */}
                {showVendor && (
                  <div className="space-y-4 border border-gray-200 p-4 rounded-lg bg-gray-50 dark:bg-dark-800 dark:border-dark-600">
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-semibold text-gray-700 dark:text-dark-200">Vendor</label>
                      <SearchableSelect
                        options={customerVendors.map(s => ({ value: s.id, label: s.name || s.customername || s.vendorname || "Unknown" }))}
                        value={formData.customerid}
                        onChange={(val) => handleSelectChange("customerid", val)}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-semibold text-gray-700 dark:text-dark-200">Vendor Address</label>
                      <SearchableSelect
                        options={customerAddresses.map(a => ({ value: a.id, label: a.full_address || `${a.address} ${a.city} Pincode: ${a.pincode}` }))}
                        value={formData.custadd}
                        onChange={(val) => handleSelectChange("custadd", val)}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-semibold text-gray-700 dark:text-dark-200">Contact Name</label>
                      <SearchableSelect
                        options={customerContacts.map(c => ({ value: c.id, label: c.name }))}
                        value={formData.custcontact}
                        onChange={(val) => handleSelectChange("custcontact", val)}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-semibold text-gray-700 dark:text-dark-200">Phone</label>
                      <input type="number" name="custphone" value={formData.custphone} onChange={handleInputChange} className="form-input rounded-lg border-gray-300 dark:border-dark-600 dark:bg-dark-900" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-semibold text-gray-700 dark:text-dark-200">Email</label>
                      <input type="email" name="custemail" value={formData.custemail} onChange={handleInputChange} className="form-input rounded-lg border-gray-300 dark:border-dark-600 dark:bg-dark-900" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-semibold text-gray-700 dark:text-dark-200">Designation</label>
                      <input type="text" name="custdesignation" value={formData.custdesignation} onChange={handleInputChange} className="form-input rounded-lg border-gray-300 dark:border-dark-600 dark:bg-dark-900" />
                    </div>
                  </div>
                )}

                {/* Customer Section */}
                {showCustomer && (
                  <div className="space-y-4 border border-gray-200 p-4 rounded-lg bg-gray-50 dark:bg-dark-800 dark:border-dark-600">
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-semibold text-gray-700 dark:text-dark-200">Customer</label>
                      <SearchableSelect
                        options={customerVendors.map(c => ({ value: c.id, label: c.name || c.customername || c.vendorname || "Unknown" }))}
                        value={formData.customerid}
                        onChange={(val) => handleSelectChange("customerid", val)}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-semibold text-gray-700 dark:text-dark-200">Customer Address</label>
                      <SearchableSelect
                        options={customerAddresses.map(a => ({ value: a.id, label: a.full_address || `${a.address} ${a.city} Pincode: ${a.pincode}` }))}
                        value={formData.custadd}
                        onChange={(val) => handleSelectChange("custadd", val)}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-semibold text-gray-700 dark:text-dark-200">Contact Name</label>
                      <SearchableSelect
                        options={customerContacts.map(c => ({ value: c.id, label: c.name }))}
                        value={formData.custcontact}
                        onChange={(val) => handleSelectChange("custcontact", val)}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-semibold text-gray-700 dark:text-dark-200">Phone</label>
                      <input type="text" name="custphone" value={formData.custphone} onChange={handleInputChange} className="form-input rounded-lg border-gray-300 dark:border-dark-600 dark:bg-dark-900" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-semibold text-gray-700 dark:text-dark-200">Email</label>
                      <input type="email" name="custemail" value={formData.custemail} onChange={handleInputChange} className="form-input rounded-lg border-gray-300 dark:border-dark-600 dark:bg-dark-900" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-semibold text-gray-700 dark:text-dark-200">Designation</label>
                      <input type="text" name="custdesignation" value={formData.custdesignation} onChange={handleInputChange} className="form-input rounded-lg border-gray-300 dark:border-dark-600 dark:bg-dark-900" />
                    </div>
                  </div>
                )}

                {/* Custom Company Section */}
                {showCustomCompany && (
                  <div className="space-y-4 border border-gray-200 p-4 rounded-lg bg-gray-50 dark:bg-dark-800 dark:border-dark-600">
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-semibold text-gray-700 dark:text-dark-200">Company Name</label>
                      <input type="text" name="customername" value={formData.customername} onChange={handleInputChange} className="form-input rounded-lg border-gray-300 dark:border-dark-600 dark:bg-dark-900" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-semibold text-gray-700 dark:text-dark-200">Company Address</label>
                      <input type="text" name="custadd" value={formData.custadd} onChange={handleInputChange} className="form-input rounded-lg border-gray-300 dark:border-dark-600 dark:bg-dark-900" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-semibold text-gray-700 dark:text-dark-200">Contact Name</label>
                      <input type="text" name="custcontactname" value={formData.custcontactname} onChange={handleInputChange} className="form-input rounded-lg border-gray-300 dark:border-dark-600 dark:bg-dark-900" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-semibold text-gray-700 dark:text-dark-200">Phone</label>
                      <input type="number" name="custphone" value={formData.custphone} onChange={handleInputChange} className="form-input rounded-lg border-gray-300 dark:border-dark-600 dark:bg-dark-900" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-semibold text-gray-700 dark:text-dark-200">Email</label>
                      <input type="email" name="custemail" value={formData.custemail} onChange={handleInputChange} className="form-input rounded-lg border-gray-300 dark:border-dark-600 dark:bg-dark-900" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-semibold text-gray-700 dark:text-dark-200">Designation</label>
                      <input type="text" name="custdesignation" value={formData.custdesignation} onChange={handleInputChange} className="form-input rounded-lg border-gray-300 dark:border-dark-600 dark:bg-dark-900" />
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column */}
              {!!formData.basis && (
              <div className="space-y-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-700 dark:text-dark-200">Date</label>
                  <input type="date" name="dindate" value={formData.dindate} onChange={handleInputChange} className="form-input rounded-lg border-gray-300 dark:border-dark-600 dark:bg-dark-900" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-700 dark:text-dark-200">Responsible Person</label>
                  <SearchableSelect
                    options={employees.map(e => ({ value: e.id, label: `${e.firstname} ${e.lastname}` }))}
                    value={formData.issuedtoid}
                    onChange={(val) => handleSelectChange("issuedtoid", val)}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-700 dark:text-dark-200">Dispatch Through</label>
                  <SearchableSelect
                    options={[
                      { value: "1", label: "By Hand" },
                      { value: "2", label: "Consignee" },
                      { value: "3", label: "Courier" }
                    ]}
                    value={formData.dispatchthrough}
                    onChange={(val) => handleSelectChange("dispatchthrough", val)}
                  />
                </div>

                {["2", "3"].includes(String(formData.dispatchthrough)) && (
                  <>
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-semibold text-gray-700 dark:text-dark-200">Consignee Name</label>
                      <input type="text" name="consignname" value={formData.consignname} onChange={handleInputChange} className="form-input rounded-lg border-gray-300 dark:border-dark-600 dark:bg-dark-900" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-semibold text-gray-700 dark:text-dark-200">Consignee Phone</label>
                      <input type="text" name="consignphone" value={formData.consignphone} onChange={handleInputChange} className="form-input rounded-lg border-gray-300 dark:border-dark-600 dark:bg-dark-900" />
                    </div>
                  </>
                )}

                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-700 dark:text-dark-200">Dispatch Date</label>
                  <input type="date" name="dispatchdate" value={formData.dispatchdate} onChange={handleInputChange} className="form-input rounded-lg border-gray-300 dark:border-dark-600 dark:bg-dark-900" />
                </div>

                {formData.basis === "Returnable" && (
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-semibold text-gray-700 dark:text-dark-200">Expected Returnable Date</label>
                    <input type="date" name="expectedreturn" value={formData.expectedreturn} onChange={handleInputChange} className="form-input rounded-lg border-gray-300 dark:border-dark-600 dark:bg-dark-900" />
                  </div>
                )}

                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-700 dark:text-dark-200">Dispatch Detail</label>
                  <textarea name="dispatchdetial" value={formData.dispatchdetial} onChange={handleInputChange} className="form-input rounded-lg border-gray-300 dark:border-dark-600 dark:bg-dark-900" rows="3" />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-gray-700 dark:text-dark-200">Remark</label>
                  <textarea name="dinremark" value={formData.dinremark} onChange={handleInputChange} className="form-input rounded-lg border-gray-300 dark:border-dark-600 dark:bg-dark-900" rows="3" />
                </div>

                <div className="flex flex-col gap-1 mt-6">
                  <label className="text-sm font-semibold text-gray-700 dark:text-dark-200">Search Material Details</label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <AsyncSelect
                        cacheOptions
                        loadOptions={loadInstrumentOptions}
                        onChange={handleInstrumentSelect}
                        value={null}
                        placeholder="Type at least 3 chars to search..."
                        styles={{
                          control: (base) => ({
                            ...base,
                            minHeight: "42px",
                            borderRadius: "0.5rem",
                            borderColor: "#D1D5DB",
                            boxShadow: "none",
                            "&:hover": { borderColor: "#9CA3AF" },
                          }),
                          menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                        }}
                        menuPortalTarget={document.body}
                      />
                    </div>
                  </div>
                </div>
              </div>
              )}
            </div>

            {/* Material Details Table */}
            {!!formData.basis && items.length > 0 && (
            <div className="mt-8 border-t border-gray-200 pt-6 dark:border-dark-600">
              <h5 className="text-lg font-bold text-gray-800 dark:text-dark-100 mb-4">Material Details</h5>
              <div className="overflow-x-auto">
                <Table className="w-full text-left">
                  <THead>
                    <Tr>
                      <Th className="bg-gray-50 px-4 py-2">S.no</Th>
                      <Th className="bg-gray-50 px-4 py-2">Material Name</Th>
                      <Th className="bg-gray-50 px-4 py-2">New ID No</Th>
                      <Th className="bg-gray-50 px-4 py-2">Serial No</Th>
                      <Th className="bg-gray-50 px-4 py-2">Location</Th>
                      <Th className="bg-gray-50 px-4 py-2">Quantity</Th>
                      <Th className="bg-gray-50 px-4 py-2">Unit</Th>
                      <Th className="bg-gray-50 px-4 py-2">Description</Th>
                      <Th className="bg-gray-50 px-4 py-2">Remark</Th>
                      <Th className="bg-gray-50 px-4 py-2">Close</Th>
                    </Tr>
                  </THead>
                  <TBody>
                    {items.length > 0 ? items.map((item, index) => (
                      <Tr key={index}>
                        <Td className="px-4 py-2">{index + 1}</Td>
                        <Td className="px-4 py-2">
                          <input type="text" readOnly value={item.name} className="form-input w-32 rounded-lg bg-gray-100 dark:bg-dark-800 border-none" />
                        </Td>
                        <Td className="px-4 py-2">
                          <input type="text" readOnly value={item.newidno} className="form-input w-32 rounded-lg bg-gray-100 dark:bg-dark-800 border-none" />
                        </Td>
                        <Td className="px-4 py-2">
                          <input type="text" readOnly value={item.serialno} className="form-input w-24 rounded-lg bg-gray-100 dark:bg-dark-800 border-none" />
                        </Td>
                        <Td className="px-4 py-2">
                          <input 
                            type="text" 
                            value={item.mloc || ""} 
                            placeholder="Location ID" 
                            onChange={(e) => {
                               handleItemChange(index, "mloc", e.target.value);
                               fetchMlocQuantity(index, e.target.value);
                            }} 
                            className="form-input w-24 rounded-lg border-gray-300 dark:border-dark-600 dark:bg-dark-900" 
                          />
                        </Td>
                        <Td className="px-4 py-2">
                          <input 
                            type="number" 
                            min="1" 
                            max={item.maxQty}
                            value={item.qty || ""} 
                            onChange={(e) => handleItemChange(index, "qty", e.target.value)} 
                            className="form-input w-20 rounded-lg border-gray-300 dark:border-dark-600 dark:bg-dark-900" 
                          />
                        </Td>
                        <Td className="px-4 py-2">
                          <input type="text" readOnly value={item.unit} className="form-input w-16 rounded-lg bg-gray-100 dark:bg-dark-800 border-none" />
                        </Td>
                        <Td className="px-4 py-2">
                          <input 
                            type="text" 
                            value={item.description || ""} 
                            onChange={(e) => handleItemChange(index, "description", e.target.value)} 
                            className="form-input w-32 rounded-lg border-gray-300 dark:border-dark-600 dark:bg-dark-900" 
                          />
                        </Td>
                        <Td className="px-4 py-2">
                          <input 
                            type="text" 
                            value={item.remark || ""} 
                            onChange={(e) => handleItemChange(index, "remark", e.target.value)} 
                            className="form-input w-32 rounded-lg border-gray-300 dark:border-dark-600 dark:bg-dark-900" 
                          />
                        </Td>
                        <Td className="px-4 py-2 text-center">
                          <Button type="button" onClick={() => removeItem(index)} color="error" size="sm" className="px-2 py-1">
                            &times;
                          </Button>
                        </Td>
                      </Tr>
                    )) : (
                      <Tr>
                        <Td colSpan="10" className="text-center py-8 text-gray-500">No materials added</Td>
                      </Tr>
                    )}
                  </TBody>
                </Table>
              </div>
            </div>
            )}
            <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-dark-600">
              <Button type="button" color="primary" size="lg" disabled={submitting} onClick={saveDin} className="font-bold">
                {submitting ? "Saving..." : "Save Din"}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </Page>
  );
}
