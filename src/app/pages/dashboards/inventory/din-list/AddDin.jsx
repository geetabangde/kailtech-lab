import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "utils/axios";
import toast, { Toaster } from "react-hot-toast";
import dayjs from "dayjs";

import { Card, Button, Table, THead, TBody, Th, Tr, Td } from "components/ui";
import { Page } from "components/shared/Page";
import ReactSelect from "react-select";
import AsyncSelect from "react-select/async";

const SearchableSelect = ({ options, value, onChange, placeholder, disabled, isMulti }) => {
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

  const selectedOption = isMulti
    ? options.filter((opt) => Array.isArray(value) && value.includes(opt.value))
    : options.find((opt) => opt.value == value) || null;

  return (
    <ReactSelect
      styles={customStyles}
      menuPortalTarget={document.body}
      options={options}
      value={selectedOption}
      onChange={(selected) => {
        if (isMulti) {
          onChange(selected ? selected.map(s => s.value) : []);
        } else {
          onChange(selected ? selected.value : "");
        }
      }}
      placeholder={placeholder || "Select One..."}
      isClearable
      isDisabled={disabled}
      isMulti={isMulti}
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
  const [trfEntries, setTrfEntries] = useState([]);

  // Form State
  const [purpose11Type, setPurpose11Type] = useState("");
  const [formData, setFormData] = useState({
    basis: "",
    inward_entry: [],
    trf_id: [],
    purpose: "",
    customerid: "",
    custadd: "",
    custcontact: "",
    customername: "",
    custcontactname: "",
    custphone: "",
    custemail: "",
    gstno: "",
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
  const [trfItems, setTrfItems] = useState([]);
  const [inwardItems, setInwardItems] = useState([]);
  const [globalChecks, setGlobalChecks] = useState({ received: false, report: false, invoice: false });
  const [inwardGlobalChecks, setInwardGlobalChecks] = useState({ checked_instrument: false, checked_certificate: false, checked_invoice: false });
  const [inwardGlobalRemark, setInwardGlobalRemark] = useState("");

  const fetchCustomerDetails = useCallback(async (custId, purposeId, type11) => {
    try {
      const pId = Number(purposeId);
      let endpoint = "";

      if ([1, 5, 6, 7, 10].includes(pId) || type11 === "Vendor") {
        endpoint = `inventory/get-supplier-details/${custId}`; // supplier API
      } else if ([2, 3, 4, 8, 9].includes(pId) || type11 === "Customer") {
        endpoint = `inventory/get-customer-address-details/${custId}`; // customer API
      }

      if (!endpoint) return;

      const res = await axios.get(endpoint);
      if (res.data.status && res.data.data) {
        if (endpoint.includes("get-supplier-details")) {
          // Supplier returns flat object
          const s = res.data.data;
          setCustomerAddresses([{ id: s.id || 1, full_address: s.full_address || s.address }]);
          setCustomerContacts([{ id: s.id || 1, name: s.contact_person || "Unknown" }]);
          setFormData(prev => ({
            ...prev,
            customername: s.company || "",
            custadd: s.full_address || s.address || "",
            custcontactname: s.contact_person || "",
            custphone: s.mobile || s.contact_phone || "",
            custemail: s.email || s.contact_email || "",
            gstno: s.gstno || "",
            custdesignation: s.designation || "",
            custcontact: s.id || 1
          }));
        } else {
          // Customer API returns { addresses: [], contacts: [] }
          const addresses = res.data.data.addresses || [];
          const contacts = res.data.data.contacts || [];
          setCustomerAddresses(addresses);
          setCustomerContacts(contacts);

          setFormData(prev => ({
            ...prev,
            customername: res.data.data.customer?.name || "",
            custadd: "",
            custcontact: "",
            custphone: "",
            custemail: "",
            custdesignation: ""
          }));
        }
      }
    } catch (err) {
      console.error("Failed to load customer/vendor details", err);
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

        // The backend might omit inward_entries for "Non Returnable" even though they are needed.
        // We fallback to fetching them from "Returnable" if they are empty.
        if (res.data.data.inward_entries && res.data.data.inward_entries.length > 0) {
          setInwardEntries(res.data.data.inward_entries);
        } else {
          axios.get("inventory/get-return-data", { params: { return: "Returnable" } }).then(fallbackRes => {
            if (fallbackRes.data.status && fallbackRes.data.data.inward_entries) {
              setInwardEntries(fallbackRes.data.data.inward_entries);
            }
          }).catch(console.error);
        }
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
        next.inward_entry = [];
        next.trf_id = [];
      }

      // If customerid changes
      if (name === "customerid") {
        if ([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].includes(Number(next.purpose))) {
          fetchCustomerDetails(value, next.purpose, purpose11Type);
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
        next.gstno = "";
        next.custdesignation = "";
        next.inward_entry = [];
        next.trf_id = [];
        setPurpose11Type("");
      }

      return next;
    });

    if (name === "basis") {
      fetchReturnData(value);
    }

    if (name === "purpose") {
      fetchCustomerVendorData(value);
      if (["6", "8", "10"].includes(String(value))) {
        axios.get("inventory/get-trfs-din", { params: { pval: value } })
          .then(res => { if (res.data.status) setTrfEntries(res.data.data); })
          .catch(console.error);
      }
    }

    if (name === "inward_entry") {
      if (value && value.length > 0) {
        const inwardIdStr = value.join(",");
        axios.get("inventory/get-calib-dispatch-item", { params: { inwardid: inwardIdStr, what: formData.basis === 'Returnable' ? 'inwardreturnable' : null } })
          .then(res => {
            if (res.data.status && res.data.data) {
              const enrichedItems = res.data.data.map(item => ({
                ...item,
                courier_description: item.description || "",
                user_remark: "",
                checked_instrument: false,
                checked_certificate: false,
                checked_invoice: false
              }));
              setInwardItems(enrichedItems);
            }
          })
          .catch(console.error);
      } else {
        setInwardItems([]);
      }
    }

    if (name === "trf_id") {
      if (value && value.length > 0) {
        const params = new URLSearchParams();
        value.forEach(id => params.append("trfid[]", id));
        params.append("pval", formData.purpose);

        axios.get(`inventory/get-dispatch-item?${params.toString()}`)
          .then(res => {
            if (res.data.status && res.data.data) {
              const enrichedItems = res.data.data.map(item => ({
                ...item,
                courier_description: item.description || "",
                remark: "",
                report: false,
                invoice: false,
                selected_packages: {},
                package_quantities: {}
              }));
              setTrfItems(enrichedItems);
            }
          })
          .catch(console.error);
      } else {
        setTrfItems([]);
      }
    }

    if (name === "custcontact") {
      if (value) {
        fetchCustomerContactDetails(value);
      } else {
        setFormData((prev) => ({
          ...prev,
          custphone: "",
          custemail: "",
          gstno: "",
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

  const handleTrfItemChange = (index, field, value) => {
    setTrfItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const removeTrfItem = (index) => {
    setTrfItems(prev => prev.filter((_, i) => i !== index));
  };

  const handlePackageToggle = (itemIndex, pkgId, checked, maxQty) => {
    setTrfItems(prev => prev.map((item, i) => {
      if (i === itemIndex) {
        const newItem = { ...item, selected_packages: { ...item.selected_packages, [pkgId]: checked } };
        if (checked && !newItem.package_quantities[pkgId]) {
          newItem.package_quantities = { ...newItem.package_quantities, [pkgId]: maxQty };
        }
        return newItem;
      }
      return item;
    }));
  };

  const handlePackageQuantityChange = (itemIndex, pkgId, val) => {
    setTrfItems(prev => prev.map((item, i) => {
      if (i === itemIndex) {
        return { ...item, package_quantities: { ...item.package_quantities, [pkgId]: val } };
      }
      return item;
    }));
  };

  const handleGlobalCourierDescription = (e) => {
    const val = e.target.value;
    setTrfItems(prev => prev.map(item => ({ ...item, courier_description: val })));
  };

  const handleGlobalRemark = (e) => {
    const val = e.target.value;
    setTrfItems(prev => prev.map(item => ({ ...item, remark: val })));
  };

  const handleInwardItemChange = (index, field, value) => {
    setInwardItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const removeInwardItem = (index) => {
    setInwardItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleInwardGlobalCheck = (field, checked) => {
    setInwardGlobalChecks(prev => ({ ...prev, [field]: checked }));
    setInwardItems(prev => prev.map(item => ({ ...item, [field]: checked })));
  };

  const handleInwardGlobalRemark = (e) => {
    const val = e.target.value;
    setInwardGlobalRemark(val);
    setInwardItems(prev => prev.map(item => ({ ...item, user_remark: val })));
  };

  const handleGlobalReport = (e) => {
    const checked = e.target.checked;
    setGlobalChecks(prev => ({ ...prev, report: checked }));
    setTrfItems(prev => prev.map(item => item.show_report_checkbox ? { ...item, report: checked } : item));
  };

  const handleGlobalInvoice = (e) => {
    const checked = e.target.checked;
    setGlobalChecks(prev => ({ ...prev, invoice: checked }));
    setTrfItems(prev => prev.map(item => item.show_invoice_checkbox ? { ...item, invoice: checked } : item));
  };

  const handleGlobalReceived = (e) => {
    const checked = e.target.checked;
    setGlobalChecks(prev => ({ ...prev, received: checked }));
    setTrfItems(prev => prev.map(item => {
      const selected = {};
      const quantities = { ...item.package_quantities };
      item.packages.forEach(pkg => {
        selected[pkg.id] = checked;
        if (checked && !quantities[pkg.id]) quantities[pkg.id] = pkg.remainingqtytodispatch;
      });
      return { ...item, selected_packages: selected, package_quantities: quantities };
    }));
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

    if ([1, 2, 3, 4, 5, 11].includes(pval) && items.length === 0) {
      toast.error("No Item is Added");
      return;
    }

    if ([7, 9].includes(pval) && inwardItems.length === 0) {
      toast.error("No Inward Item is Added");
      return;
    }

    if ([6, 8, 10].includes(pval) && trfItems.length === 0) {
      toast.error("No TRF Item is Added");
      return;
    }

    if ([1, 2, 3, 4, 5, 11].includes(pval) && items.some(item => !item.remark || !item.remark.trim())) {
      toast.error("Please enter Remark for all items in Material Details");
      return;
    }

    if ([7, 9].includes(pval) && inwardItems.some(item => !item.user_remark || !item.user_remark.trim())) {
      toast.error("Please enter Remark for all items in Inward Material Details");
      return;
    }

    if ([6, 8, 10].includes(pval) && trfItems.some(item => !item.remark || !item.remark.trim())) {
      toast.error("Please enter Remark for all items in TRF Material Details");
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
        customervendor: purpose11Type || "",
        inward_entry: formData.inward_entry || [],
        trf_id: formData.trf_id || "",
        customerid: formData.customerid || "",
        customername: formData.customername || "",
        custadd: formData.custadd || "",
        custcontact: formData.custcontact || "",
        custcontactname: formData.custcontactname || "",
        custphone: formData.custphone || "",
        custemail: formData.custemail || "",
        gstno: formData.gstno || "",
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

      if ([6, 8, 10].includes(pval)) {
        payload.itemid = trfItems.map(i => i.item_id);
        payload.itemname = trfItems.map(i => i.product_name);
        payload.itemdescription = trfItems.map(i => i.courier_description || "");
        payload.remark = trfItems.map(i => i.remark || "");

        trfItems.forEach(i => {
          const itemid = i.item_id;
          payload[`qid${itemid}`] = [];
          payload[`instrument${itemid}`] = [];

          if (i.report) payload[`certificate${itemid}`] = "Yes";
          if (i.invoice) payload[`invoice${itemid}`] = "Yes";

          if (i.packages) {
            i.packages.forEach(pkg => {
              payload[`qid${itemid}`].push(pkg.id);
              if (i.selected_packages && i.selected_packages[pkg.id]) {
                payload[`instrument${itemid}`].push(pkg.id);
                payload[`reminent${pkg.id}quantity${itemid}`] = i.package_quantities[pkg.id] || pkg.remainingqtytodispatch;
              }
            });
          }
        });
      }

      if ([7, 9].includes(pval)) {
        payload.iteminwardid = inwardItems.map(i => i.inward_id);
        payload.itemid = inwardItems.map(i => i.item_id);
        payload.itemdescription = inwardItems.map(i => i.courier_description || "");
        payload.remark = inwardItems.map(i => i.user_remark || "");

        inwardItems.forEach(i => {
          const itemid = i.item_id;
          if (i.checked_instrument) payload[`instrument${itemid}`] = "Yes";
          if (i.checked_certificate) payload[`certificate${itemid}`] = "Yes";
          if (i.checked_invoice) payload[`invoice${itemid}`] = "Yes";
        });
      }

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

                {["7", "9"].includes(String(formData.purpose)) && (
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-semibold text-gray-700 dark:text-dark-200">Inward Entry</label>
                    <SearchableSelect
                      isMulti
                      options={inwardEntries.map(entry => ({
                        value: entry.id,
                        label: `${entry.id}   ${entry.customername || ""}`
                      }))}
                      value={formData.inward_entry}
                      onChange={(val) => handleSelectChange("inward_entry", val)}
                    />
                  </div>
                )}

                {["6", "8", "10"].includes(String(formData.purpose)) && (
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-semibold text-gray-700 dark:text-dark-200">TRFS</label>
                    <SearchableSelect
                      isMulti
                      options={trfEntries.map(entry => ({
                        value: entry.id,
                        label: entry.label || entry.name || `TRF - ${entry.id}`
                      }))}
                      value={formData.trf_id}
                      onChange={(val) => handleSelectChange("trf_id", val)}
                    />
                  </div>
                )}

                {/* Vendor Section */}
                {showVendor && pval !== 11 && (
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
                        options={customerAddresses.map(a => {
                          const addrString = a.full_address || `${a.address} ${a.city} Pincode: ${a.pincode}`;
                          return { value: addrString, label: addrString };
                        })}
                        value={formData.custadd}
                        onChange={(val) => handleSelectChange("custadd", val)}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-semibold text-gray-700 dark:text-dark-200">Contact Name</label>
                      <SearchableSelect
                        options={customerContacts.map(c => ({ value: c.name, label: c.name }))}
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
                {showCustomer && pval !== 11 && (
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
                        options={customerAddresses.map(a => {
                          const addrString = a.full_address || `${a.address} ${a.city} Pincode: ${a.pincode}`;
                          return { value: addrString, label: addrString };
                        })}
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

                {/* Custom Company / Purpose 11 Section */}
                {showCustomCompany && (
                  <div className="space-y-4 border border-gray-200 p-4 rounded-lg bg-gray-50 dark:bg-dark-800 dark:border-dark-600">
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-semibold text-gray-700 dark:text-dark-200">Vendor/Customer Type</label>
                      <SearchableSelect
                        options={[
                          { value: "Vendor", label: "Vendor" },
                          { value: "Customer", label: "Customer" },
                          { value: "Custom", label: "Custom" }
                        ]}
                        value={purpose11Type}
                        onChange={(val) => setPurpose11Type(val)}
                      />
                    </div>

                    {["Vendor", "Customer"].includes(purpose11Type) && (
                      <div className="flex flex-col gap-1">
                        <label className="text-sm font-semibold text-gray-700 dark:text-dark-200">{purpose11Type}</label>
                        <SearchableSelect
                          options={customerVendors.map(c => ({ value: c.id, label: c.name || c.customername || c.vendorname || "Unknown" }))}
                          value={formData.customerid}
                          onChange={(val) => handleSelectChange("customerid", val)}
                        />
                      </div>
                    )}

                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-semibold text-gray-700 dark:text-dark-200">Company Name</label>
                      <input type="text" name="customername" value={formData.customername} onChange={handleInputChange} className="form-input rounded-lg border-gray-300 dark:border-dark-600 dark:bg-dark-900" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-semibold text-gray-700 dark:text-dark-200">Company Address</label>
                      <input type="text" name="custadd" value={formData.custadd} onChange={handleInputChange} className="form-input rounded-lg border-gray-300 dark:border-dark-600 dark:bg-dark-900" />
                    </div>
                    {["Vendor", "Customer"].includes(purpose11Type) ? (
                      <div className="flex flex-col gap-1">
                        <label className="text-sm font-semibold text-gray-700 dark:text-dark-200">Contact Name</label>
                        <SearchableSelect
                          options={customerContacts.map(c => ({ value: c.id, label: c.name }))}
                          value={formData.custcontact}
                          onChange={(val) => handleSelectChange("custcontact", val)}
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1">
                        <label className="text-sm font-semibold text-gray-700 dark:text-dark-200">Contact Name</label>
                        <input type="text" name="custcontactname" value={formData.custcontactname} onChange={handleInputChange} className="form-input rounded-lg border-gray-300 dark:border-dark-600 dark:bg-dark-900" />
                      </div>
                    )}
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-semibold text-gray-700 dark:text-dark-200">Phone</label>
                      <input type="text" name="custphone" value={formData.custphone} onChange={handleInputChange} className="form-input rounded-lg border-gray-300 dark:border-dark-600 dark:bg-dark-900" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-semibold text-gray-700 dark:text-dark-200">Email</label>
                      <input type="email" name="custemail" value={formData.custemail} onChange={handleInputChange} className="form-input rounded-lg border-gray-300 dark:border-dark-600 dark:bg-dark-900" />
                    </div>
                    {purpose11Type === "Custom" && (
                      <div className="flex flex-col gap-1">
                        <label className="text-sm font-semibold text-gray-700 dark:text-dark-200">GST NO</label>
                        <input type="text" name="gstno" value={formData.gstno} onChange={handleInputChange} className="form-input rounded-lg border-gray-300 dark:border-dark-600 dark:bg-dark-900" />
                      </div>
                    )}
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

            {/* TRF Details Table */}
            {["6", "8", "10"].includes(String(formData.purpose)) && trfItems.length > 0 && (
              <div className="mt-8 border-t border-gray-200 pt-6 dark:border-dark-600">
                <h5 className="text-lg font-bold text-gray-800 dark:text-dark-100 mb-4">TRF Material Details</h5>

                {/* Global Controls */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 bg-gray-50 dark:bg-dark-800 p-4 rounded-lg">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 dark:text-dark-200">Description for all</label>
                    <input type="text" onChange={handleGlobalCourierDescription} className="form-input mt-1 w-full rounded-lg border-gray-300 dark:border-dark-600 dark:bg-dark-900" placeholder="Courier Description" />
                  </div>
                  <div className="flex flex-col justify-center space-y-2 pl-4">
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" checked={globalChecks.received} onChange={handleGlobalReceived} className="h-4 w-4 rounded border-gray-300 text-primary-600 cursor-pointer" />
                      <span className="text-sm text-gray-700 dark:text-dark-200">Received</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" checked={globalChecks.report} onChange={handleGlobalReport} className="h-4 w-4 rounded border-gray-300 text-primary-600 cursor-pointer" />
                      <span className="text-sm text-gray-700 dark:text-dark-200">Report</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" checked={globalChecks.invoice} onChange={handleGlobalInvoice} className="h-4 w-4 rounded border-gray-300 text-primary-600 cursor-pointer" />
                      <span className="text-sm text-gray-700 dark:text-dark-200">Invoice</span>
                    </label>
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-dark-200">Remark for all</label>
                    <input type="text" onChange={handleGlobalRemark} className="form-input mt-1 w-full rounded-lg border-gray-300 dark:border-dark-600 dark:bg-dark-900" placeholder="Remark" />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <Table className="w-full text-left border border-gray-200 dark:border-dark-600">
                    <THead>
                      <Tr>
                        <Th className="bg-gray-100 px-4 py-2 border-b dark:bg-dark-800 dark:border-dark-600">Name of item</Th>
                        <Th className="bg-gray-100 px-4 py-2 border-b dark:bg-dark-800 dark:border-dark-600">Description of item in courier</Th>
                        <Th className="bg-gray-100 px-4 py-2 border-b dark:bg-dark-800 dark:border-dark-600">Items Attached</Th>
                        <Th className="bg-gray-100 px-4 py-2 border-b dark:bg-dark-800 dark:border-dark-600">Remark</Th>
                        <Th className="bg-gray-100 px-4 py-2 border-b dark:bg-dark-800 dark:border-dark-600">Close</Th>
                      </Tr>
                    </THead>
                    <TBody>
                      {trfItems.map((item, index) => (
                        <Tr key={`${item.item_id}-${item.trf}-${item.brand}-${index}`}>
                          <Td className="px-4 py-4 align-top border-b border-gray-200 dark:border-dark-600">
                            <div className="font-semibold text-gray-800 dark:text-dark-100">{item.product_name}</div>
                            <div className="text-sm text-gray-600 dark:text-dark-300 mt-1">{item.brand}</div>
                            <div className="text-sm text-gray-600 dark:text-dark-300">{item.lrn}</div>
                          </Td>
                          <Td className="px-4 py-4 align-top border-b border-gray-200 dark:border-dark-600">
                            <textarea
                              value={item.courier_description || ""}
                              onChange={(e) => handleTrfItemChange(index, "courier_description", e.target.value)}
                              className="form-input w-full rounded-lg border-gray-300 dark:border-dark-600 dark:bg-dark-900"
                              rows="3"
                            />
                          </Td>
                          <Td className="px-4 py-4 align-top border-b border-gray-200 dark:border-dark-600">
                            <div className="font-semibold text-xs text-gray-500 uppercase tracking-wider mb-2">{item.package_from}</div>
                            <div className="space-y-2 mb-4">
                              {item.packages && item.packages.map(pkg => (
                                <div key={pkg.id} className="flex items-center space-x-2">
                                  <label className="flex items-center space-x-2 flex-shrink-0">
                                    <input
                                      type="checkbox"
                                      checked={!!item.selected_packages[pkg.id]}
                                      onChange={(e) => handlePackageToggle(index, pkg.id, e.target.checked, pkg.remainingqtytodispatch)}
                                      className="h-4 w-4 rounded border-gray-300 text-primary-600 cursor-pointer"
                                    />
                                    <span className="text-sm text-gray-700 dark:text-dark-200">{pkg.name}</span>
                                  </label>
                                  {item.selected_packages[pkg.id] && (
                                    <input
                                      type="number"
                                      min="0.000000001"
                                      step="any"
                                      max={pkg.remainingqtytodispatch}
                                      value={item.package_quantities[pkg.id] || ""}
                                      onChange={(e) => handlePackageQuantityChange(index, pkg.id, e.target.value)}
                                      readOnly={item.readonly_quantity}
                                      className="form-input w-24 h-8 text-sm rounded border-gray-300 dark:border-dark-600 dark:bg-dark-900"
                                    />
                                  )}
                                </div>
                              ))}
                            </div>
                            {item.show_report_checkbox && (
                              <div className="mb-1">
                                <label className="flex items-center space-x-2">
                                  <input type="checkbox" checked={!!item.report} onChange={(e) => handleTrfItemChange(index, "report", e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-primary-600 cursor-pointer" />
                                  <span className="text-sm text-gray-700 dark:text-dark-200">Report</span>
                                </label>
                              </div>
                            )}
                            {item.show_invoice_checkbox && (
                              <div>
                                <label className="flex items-center space-x-2">
                                  <input type="checkbox" checked={!!item.invoice} onChange={(e) => handleTrfItemChange(index, "invoice", e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-primary-600 cursor-pointer" />
                                  <span className="text-sm text-gray-700 dark:text-dark-200">Invoice</span>
                                </label>
                              </div>
                            )}
                          </Td>
                          <Td className="px-4 py-4 align-top border-b border-gray-200 dark:border-dark-600">
                            <textarea
                              value={item.remark || ""}
                              onChange={(e) => handleTrfItemChange(index, "remark", e.target.value)}
                              className="form-input w-full rounded-lg border-gray-300 dark:border-dark-600 dark:bg-dark-900"
                              rows="3"
                            />
                          </Td>
                          <Td className="px-4 py-4 align-top border-b border-gray-200 dark:border-dark-600 text-center">
                            <Button type="button" onClick={() => removeTrfItem(index)} color="error" size="sm" className="px-2 py-1">
                              &times;
                            </Button>
                          </Td>
                        </Tr>
                      ))}
                    </TBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Inward Material Details Table */}
            {["7", "9"].includes(String(formData.purpose)) && inwardItems.length > 0 && (
              <div className="mt-8 border-t border-gray-200 pt-6 dark:border-dark-600">
                <h5 className="text-lg font-bold text-gray-800 dark:text-dark-100 mb-4">Inward Material Details</h5>

                {/* Global Controls */}
                <div className="flex flex-col md:flex-row gap-6 mb-6 p-4 bg-gray-50 dark:bg-dark-800 rounded-lg">
                  <div className="flex flex-col space-y-2">
                    <label className="font-semibold text-gray-700 dark:text-dark-200 text-sm">Items Attached (Global)</label>
                    <div className="flex items-center space-x-6">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input type="checkbox" checked={inwardGlobalChecks.checked_instrument} onChange={(e) => handleInwardGlobalCheck("checked_instrument", e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-primary-600" />
                        <span className="text-sm text-gray-700 dark:text-dark-200">Instrument</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input type="checkbox" checked={inwardGlobalChecks.checked_certificate} onChange={(e) => handleInwardGlobalCheck("checked_certificate", e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-primary-600" />
                        <span className="text-sm text-gray-700 dark:text-dark-200">Certificate</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input type="checkbox" checked={inwardGlobalChecks.checked_invoice} onChange={(e) => handleInwardGlobalCheck("checked_invoice", e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-primary-600" />
                        <span className="text-sm text-gray-700 dark:text-dark-200">Invoice</span>
                      </label>
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="font-semibold text-gray-700 dark:text-dark-200 text-sm">Global Remark</label>
                    <input type="text" placeholder="Remark for all" value={inwardGlobalRemark} onChange={handleInwardGlobalRemark} className="form-input w-full rounded-lg border-gray-300 dark:border-dark-600 dark:bg-dark-900" />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <Table className="w-full text-left border-collapse">
                    <THead>
                      <Tr>
                        <Th className="bg-gray-50 px-4 py-2 border border-gray-200 dark:border-dark-600">S.No</Th>
                        <Th className="bg-gray-50 px-4 py-2 border border-gray-200 dark:border-dark-600">Name of item</Th>
                        <Th className="bg-gray-50 px-4 py-2 border border-gray-200 dark:border-dark-600">Description of item in courier</Th>
                        <Th className="bg-gray-50 px-4 py-2 border border-gray-200 dark:border-dark-600">Items Attached</Th>
                        <Th className="bg-gray-50 px-4 py-2 border border-gray-200 dark:border-dark-600">Remark</Th>
                        <Th className="bg-gray-50 px-4 py-2 border border-gray-200 dark:border-dark-600 text-center">Close</Th>
                      </Tr>
                    </THead>
                    <TBody>
                      {inwardItems.map((item, index) => (
                        <Tr key={`${item.item_id}-${item.inward_id}-${index}`}>
                          <Td className="px-4 py-4 align-top border border-gray-200 dark:border-dark-600">{index + 1}</Td>
                          <Td className="px-4 py-4 align-top border border-gray-200 dark:border-dark-600">
                            {item.name}
                          </Td>
                          <Td className="px-4 py-4 align-top border border-gray-200 dark:border-dark-600">
                            <textarea
                              value={item.courier_description}
                              onChange={(e) => handleInwardItemChange(index, "courier_description", e.target.value)}
                              className="form-input w-full rounded-lg border-gray-300 dark:border-dark-600 dark:bg-dark-900"
                              rows="3"
                            />
                          </Td>
                          <Td className="px-4 py-4 align-top border border-gray-200 dark:border-dark-600">
                            <div className="space-y-2">
                              {item.show_instrument && (
                                <label className="flex items-center space-x-2">
                                  <input type="checkbox" checked={!!item.checked_instrument} onChange={(e) => handleInwardItemChange(index, "checked_instrument", e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-primary-600 cursor-pointer" />
                                  <span className="text-sm text-gray-700 dark:text-dark-200">Instrument</span>
                                </label>
                              )}
                              {item.show_certificate && (
                                <label className="flex items-center space-x-2">
                                  <input type="checkbox" checked={!!item.checked_certificate} onChange={(e) => handleInwardItemChange(index, "checked_certificate", e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-primary-600 cursor-pointer" />
                                  <span className="text-sm text-gray-700 dark:text-dark-200">Certificate</span>
                                </label>
                              )}
                              {item.show_invoice && (
                                <label className="flex items-center space-x-2">
                                  <input type="checkbox" checked={!!item.checked_invoice} onChange={(e) => handleInwardItemChange(index, "checked_invoice", e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-primary-600 cursor-pointer" />
                                  <span className="text-sm text-gray-700 dark:text-dark-200">Invoice</span>
                                </label>
                              )}
                            </div>
                          </Td>
                          <Td className="px-4 py-4 align-top border border-gray-200 dark:border-dark-600">
                            <textarea
                              value={item.user_remark || ""}
                              onChange={(e) => handleInwardItemChange(index, "user_remark", e.target.value)}
                              className="form-input w-full rounded-lg border-gray-300 dark:border-dark-600 dark:bg-dark-900"
                              rows="3"
                            />
                          </Td>
                          <Td className="px-4 py-4 align-top border border-gray-200 dark:border-dark-600 text-center">
                            <Button type="button" onClick={() => removeInwardItem(index)} color="error" size="sm" className="px-2 py-1">
                              &times;
                            </Button>
                          </Td>
                        </Tr>
                      ))}
                    </TBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Material Details Table */}
            {!!formData.basis && !["6", "8", "10", "7", "9"].includes(String(formData.purpose)) && items.length > 0 && (
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
                              onChange={(e) => handleItemChange(index, "mloc", e.target.value)}
                              onBlur={(e) => fetchMlocQuantity(index, e.target.value)}
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
