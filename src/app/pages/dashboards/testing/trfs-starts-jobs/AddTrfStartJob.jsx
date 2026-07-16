// AddTrfStartJob.jsx - With AddInwardEntry-style save logic
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "utils/axios";
import { toast } from "sonner";

import { Page } from "components/shared/Page";
import { Button } from "components/ui";
import { Input, Textarea } from "components/ui/Form";
import { Card } from "components/ui/Card";
import ReactSelect from "react-select";

// ── Reusable SearchSelect component ─────────────────────────────────────────
const SearchSelect = ({
  options = [],
  value,
  onChange,
  placeholder = "Search and select...",
  isMulti = false,
  isDisabled = false,
  error = false,
  inputRef = null,
}) => {
  const styles = {
    control: (base, state) => ({
      ...base,
      minHeight: "42px",
      borderColor: error
        ? "#ef4444"
        : state.isFocused
          ? "#3b82f6"
          : "rgb(209 213 219)",
      boxShadow: error
        ? "0 0 0 1px #ef4444"
        : state.isFocused
          ? "0 0 0 2px rgb(59 130 246 / 0.5)"
          : "none",
      "&:hover": { borderColor: error ? "#ef4444" : "#3b82f6" },
      backgroundColor: isDisabled ? "#f9fafb" : "white",
      borderRadius: "0.5rem",
      opacity: isDisabled ? 0.7 : 1,
    }),
    menu: (base) => ({ ...base, borderRadius: "0.5rem", zIndex: 9999 }),
    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
    multiValue: (base) => ({
      ...base,
      backgroundColor: "#dbeafe",
      borderRadius: "0.25rem",
    }),
    multiValueLabel: (base) => ({ ...base, color: "#1e40af" }),
    multiValueRemove: (base) => ({
      ...base,
      color: "#3b82f6",
      "&:hover": { backgroundColor: "#3b82f6", color: "white" },
    }),
    placeholder: (base) => ({
      ...base,
      color: "#9ca3af",
      fontSize: "0.875rem",
    }),
    singleValue: (base) => ({ ...base, fontSize: "0.875rem" }),
    option: (base, state) => ({
      ...base,
      fontSize: "0.875rem",
      backgroundColor: state.isSelected
        ? "#3b82f6"
        : state.isFocused
          ? "#eff6ff"
          : "white",
      color: state.isSelected ? "white" : "#374151",
      "&:active": { backgroundColor: "#bfdbfe" },
    }),
  };

  return (
    <ReactSelect
      ref={inputRef}
      options={options}
      value={value}
      onChange={onChange}
      isMulti={isMulti}
      isDisabled={isDisabled}
      placeholder={placeholder}
      styles={styles}
      menuPortalTarget={document.body}
      isClearable
      isSearchable
      noOptionsMessage={() => "No options found"}
    />
  );
};

// ── Helper: array → ReactSelect options ─────────────────────────────────────
const toOptions = (arr = [], labelFn, valueFn = (x) => String(x.id)) =>
  arr.map((x) => ({ value: valueFn(x), label: labelFn(x) }));

// ── Helper: find selected option by value ────────────────────────────────────
const findOption = (options = [], value) =>
  options.find((o) => String(o.value) === String(value)) || null;

export default function AddTrfStartJob() {
  const navigate = useNavigate();

  const today = new Date();
  const todayDisplay = today.toISOString().split("T")[0];
  const todayFormatted = `${today.getDate().toString().padStart(2, "0")}/${(today.getMonth() + 1).toString().padStart(2, "0")}/${today.getFullYear()}`;

  // ── Refs for all required fields (scroll-to-error) ──────────────────────────
  const dateRef = useRef(null);
  const sampleReceivedOnRef = useRef(null);
  const ctypeRef = useRef(null);
  const customeridRef = useRef(null);
  const specificpurposeRef = useRef(null);
  const letterrefnoRef = useRef(null);
  const reportnameRef = useRef(null);
  const reportaddressRef = useRef(null);
  const billingnameRef = useRef(null);
  const billingaddressRef = useRef(null);
  const gstnoRef = useRef(null);
  const concernpersonnameRef = useRef(null);
  const ponumberRef = useRef(null);
  const bdRef = useRef(null);
  const promoterRef = useRef(null);
  const priorityRef = useRef(null);
  const pchargesRef = useRef(null);
  const witnessRef = useRef(null);
  const modeofrecieptRef = useRef(null);
  const paymentstatusRef = useRef(null);
  const modeofpaymentRef = useRef(null);
  const detailsofpaymentRef = useRef(null);
  const paymentamountRef = useRef(null);
  const certcollectionremarkRef = useRef(null);
  const deadlineRef = useRef(null);

  // ── Form State ──────────────────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    date: todayFormatted,
    sample_received_on: "",
    ctype: "",
    customerid: "",
    specificpurpose: "",
    letterrefno: "",
    ponumber: "",
    bd: "",
    promoter: "",
    priority: "",
    pcharges: "0",
    pchargestype: "1",
    witness: "",
    wdatetime: "",
    wtime: "",
    wdetail: "",
    wcharges: "0",
    wchargestype: "1",
    wstatus: "1",
    modeofreciept: "1",
    localcontact: "",
    couriername: "",
    dateofdispatch: "",
    docketno: "",
    modeofdispatch: "1",
    paymentstatus: "1",
    modeofpayment: "",
    detailsofpayment: "",
    paymentamount: "",
    certcollectiondetail: [],
    additionalemail: "",
    certcollectionremark: "",
    returnable: "",
    documents: "",
    deadline: "",
    specialrequest: "",
    notes: "",
    // Customer detail fields
    reportname: "",
    reportaddress: "",
    billingname: "",
    billingaddress: "",
    gstno: "",
    concernpersonname: "",
    concernpersondesignation: "",
    concernpersonemail: "",
    concernpersonmobile: "",
    quotationid: "0",
    customername: "",
    customeraddress: "",
  });

  // ── Date display values for <input type="date"> (YYYY-MM-DD) ───────────────
  const [dateInputs, setDateInputs] = useState({
    date: todayDisplay,
    sample_received_on: "",
    wdatetime: "",
    dateofdispatch: "",
    deadline: "",
  });

  // ── Errors object — all collected at once (AddInwardEntry pattern) ──────────
  const [errors, setErrors] = useState({});

  // ── Success modal ───────────────────────────────────────────────────────────
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // ── Dropdown options ────────────────────────────────────────────────────────
  const [customerTypes, setCustomerTypes] = useState([]);
  const [specificPurposes, setSpecificPurposes] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [bds, setBds] = useState([]);
  const [promoters, setPromoters] = useState([]);
  const [choices, setChoices] = useState([]);
  const [modesOfReceipt, setModesOfReceipt] = useState([]);
  const [paymentModes, setPaymentModes] = useState([]);
  const [certCollectionDetails, setCertCollectionDetails] = useState([]);

  // ── Customer-dependent options ──────────────────────────────────────────────
  const [reportAddresses, setReportAddresses] = useState([]);
  const [billingAddresses, setBillingAddresses] = useState([]);
  const [concernPersons, setConcernPersons] = useState([]);
  const [quotations, setQuotations] = useState([]);

  // ── Customer credit info ────────────────────────────────────────────────────
  const [customerCredit, setCustomerCredit] = useState(null);
  const [customerEmail, setCustomerEmail] = useState("");

  // ── Visibility toggles ──────────────────────────────────────────────────────
  const [showPriorityCharges, setShowPriorityCharges] = useState(false);
  const [showWitnessDetails, setShowWitnessDetails] = useState(false);
  const [showCourierDetails, setShowCourierDetails] = useState(false);
  const [showPaymentDetails, setShowPaymentDetails] = useState(true);
  const [showCustomerDetails, setShowCustomerDetails] = useState(false);

  // ── Files ───────────────────────────────────────────────────────────────────
  const [wuploadFile, setWuploadFile] = useState(null);
  const [ruploadFile, setRuploadFile] = useState(null);

  // ── Loading ─────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [loadingCustomer, setLoadingCustomer] = useState(false);

  // ── ReactSelect styles (kept for certcollectiondetail multi-select) ─────────
  const customSelectStyles = {
    control: (base, state) => ({
      ...base,
      minHeight: "42px",
      borderColor: state.isFocused ? "#3b82f6" : "rgb(209 213 219)",
      boxShadow: state.isFocused ? "0 0 0 2px rgb(59 130 246 / 0.5)" : "none",
      "&:hover": { borderColor: "#3b82f6" },
      backgroundColor: "white",
      borderRadius: "0.5rem",
    }),
    menu: (base) => ({ ...base, borderRadius: "0.5rem", zIndex: 9999 }),
    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
    multiValue: (base) => ({
      ...base,
      backgroundColor: "#dbeafe",
      borderRadius: "0.25rem",
    }),
    multiValueLabel: (base) => ({ ...base, color: "#1e40af" }),
    multiValueRemove: (base) => ({
      ...base,
      color: "#3b82f6",
      "&:hover": { backgroundColor: "#3b82f6", color: "white" },
    }),
  };

  // ── Scroll to first error (AddInwardEntry pattern) ─────────────────────────
  const scrollToFirstError = useCallback(() => {
    const errorFields = [
      { field: "date", ref: dateRef },
      { field: "sample_received_on", ref: sampleReceivedOnRef },
      { field: "ctype", ref: ctypeRef },
      { field: "customerid", ref: customeridRef },
      { field: "specificpurpose", ref: specificpurposeRef },
      { field: "letterrefno", ref: letterrefnoRef },
      { field: "reportname", ref: reportnameRef },
      { field: "reportaddress", ref: reportaddressRef },
      { field: "billingname", ref: billingnameRef },
      { field: "billingaddress", ref: billingaddressRef },
      { field: "gstno", ref: gstnoRef },
      { field: "concernpersonname", ref: concernpersonnameRef },
      { field: "ponumber", ref: ponumberRef },
      { field: "bd", ref: bdRef },
      { field: "promoter", ref: promoterRef },
      { field: "priority", ref: priorityRef },
      { field: "pcharges", ref: pchargesRef },
      { field: "witness", ref: witnessRef },
      { field: "modeofreciept", ref: modeofrecieptRef },
      { field: "paymentstatus", ref: paymentstatusRef },
      { field: "modeofpayment", ref: modeofpaymentRef },
      { field: "detailsofpayment", ref: detailsofpaymentRef },
      { field: "paymentamount", ref: paymentamountRef },
      { field: "certcollectionremark", ref: certcollectionremarkRef },
      { field: "deadline", ref: deadlineRef },
    ];

    for (const { field, ref } of errorFields) {
      if (errors[field] && ref.current) {
        ref.current.scrollIntoView({ behavior: "smooth", block: "center" });
        ref.current.focus?.();
        break;
      }
    }
  }, [errors]);

  // Auto-scroll when errors change (same as AddInwardEntry)
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      scrollToFirstError();
    }
  }, [errors, scrollToFirstError]);

  // ── Fetch all dropdowns on mount ────────────────────────────────────────────
  useEffect(() => {
    fetchAllOptions();
  }, []);

  const fetchAllOptions = async () => {
    try {
      setLoadingOptions(true);
      const [
        customerTypesRes,
        specificPurposesRes,
        customersRes,
        bdsRes,
        promotersRes,
        choicesRes,
        modesOfReceiptRes,
        paymentModesRes,
        certCollectionDetailsRes,
      ] = await Promise.all([
        axios.get("/people/get-customer-type-list"),
        axios.get("/people/get-specific-purpose-list"),
        axios.get("/people/get-all-customers"),
        axios.get("/people/get-customer-bd"),
        axios.get("/people/list-promoters"),
        axios.get("/get-choices"),
        axios.get("/mode-of-receipt"),
        axios.get("/mode-of-payment"),
        axios.get("/certificate-collect-as"),
      ]);

      if (customerTypesRes.data?.Data)
        setCustomerTypes(customerTypesRes.data.Data);
      if (specificPurposesRes.data?.data)
        setSpecificPurposes(specificPurposesRes.data.data);
      if (customersRes.data?.data) setCustomers(customersRes.data.data);
      if (bdsRes.data?.data) setBds(bdsRes.data.data);
      if (promotersRes.data?.data) setPromoters(promotersRes.data.data);
      if (choicesRes.data?.data) setChoices(choicesRes.data.data);
      if (modesOfReceiptRes.data?.data)
        setModesOfReceipt(modesOfReceiptRes.data.data);
      if (paymentModesRes.data?.data)
        setPaymentModes(paymentModesRes.data.data);
      if (certCollectionDetailsRes.data?.data)
        setCertCollectionDetails(certCollectionDetailsRes.data.data);
    } catch (error) {
      console.error("Error fetching options:", error);
      toast.error("Failed to load form options");
    } finally {
      setLoadingOptions(false);
    }
  };

  // ── Fetch customer-dependent data ───────────────────────────────────────────
  const fetchCustomerDependentData = async (
    customerId,
    selectedOption = null,
  ) => {
    if (!customerId) return;
    setLoadingCustomer(true);
    try {
      const [addressRes, concernPersonsRes, quotationsRes] = await Promise.all([
        axios.get(`/people/get-customers-address/${customerId}`),
        axios.get(`/get-concern-person/${customerId}`),
        axios.get(`/get-quotaion/${customerId}`),
      ]);

      // ✅ Credit/GST data
      if (selectedOption) {
        setCustomerCredit({
          creditdays: selectedOption.creditdays,
          creditamount: selectedOption.creditamount,
          leftamount: selectedOption.leftamount,
        });
        setCustomerEmail(selectedOption.email || "");

        setFormData((prev) => ({
          ...prev,
          gstno: selectedOption.gstno || "",
          customername: selectedOption.label.split(" (")[0] || "",
          customeraddress: "nothing",
          modeofpayment: selectedOption.modeofpayment || prev.modeofpayment,
        }));
      }

      if (addressRes.data?.data) {
        setReportAddresses(addressRes.data.data);
        setBillingAddresses(addressRes.data.data);
      }

      if (concernPersonsRes.data?.data)
        setConcernPersons(concernPersonsRes.data.data);
      if (quotationsRes.data?.data) setQuotations(quotationsRes.data.data);

      setShowCustomerDetails(true);
    } catch (error) {
      console.error("Error fetching customer details:", error);
      toast.error("Failed to load customer details");
    } finally {
      setLoadingCustomer(false);
    }
  };

  const fetchConcernPersonDetails = async (personId) => {
    if (!personId) return;
    try {
      const res = await axios.get(`/get-concern-person-details/${personId}`);
      if (res.data?.data) {
        const p = res.data.data;
        setFormData((prev) => ({
          ...prev,
          concernpersondesignation: p.designation || "",
          concernpersonemail: p.email || "",
          concernpersonmobile: p.mobile || "",
        }));
      }
    } catch (error) {
      if (error.response?.data?.message)
        toast.error(error.response.data.message);
      else toast.error("Something went wrong!");
      console.error(error);
    }
  };

  const fetchAddresses = async (customerId, type) => {
    try {
      const res = await axios.get(
        `/people/get-customers-address/${customerId}`,
      );
      if (res.data?.data) {
        if (type === "report") setReportAddresses(res.data.data);
        if (type === "billing") setBillingAddresses(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ── Same as Reporting ────────────────────────────────────────────────────────
  const handleSameAsReporting = () => {
    setBillingAddresses(reportAddresses);
    setFormData((prev) => ({
      ...prev,
      billingname: prev.reportname,
      billingaddress: prev.reportaddress,
    }));
  };

  // ── Date handling ────────────────────────────────────────────────────────────
  const formatDateForServer = (dateString) => {
    if (!dateString) return "";
    const [year, month, day] = dateString.split("-");
    return `${day}/${month}/${year}`;
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateInputs((prev) => ({ ...prev, [name]: value }));
    setFormData((prev) => ({
      ...prev,
      [name]: value ? formatDateForServer(value) : "",
    }));
    clearError(name);
  };

  // Helper: clear one error key on change
  const clearError = (field) => {
    if (errors[field])
      setErrors((prev) => {
        const e = { ...prev };
        delete e[field];
        return e;
      });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    clearError(name);
  };

  const handleReactSelectChange = (selectedOptions, fieldName) => {
    const selectedValues = selectedOptions
      ? selectedOptions.map((o) => o.value)
      : [];
    setFormData((prev) => ({ ...prev, [fieldName]: selectedValues }));
  };

  const handleReportNameChange = async (e) => {
    const value = e.target.value;
    clearError("reportname");
    setFormData((prev) => ({ ...prev, reportname: value, reportaddress: "" }));
    if (value) {
      await fetchAddresses(value, "report");
    } else {
      if (formData.customerid) {
        await fetchAddresses(formData.customerid, "report");
      } else {
        setReportAddresses([]);
      }
    }
  };

  const handleBillingNameChange = async (e) => {
    const value = e.target.value;
    clearError("billingname");
    setFormData((prev) => ({
      ...prev,
      billingname: value,
      billingaddress: "",
    }));
    if (value) {
      await fetchAddresses(value, "billing");
    } else {
      if (formData.customerid) {
        await fetchAddresses(formData.customerid, "billing");
      } else {
        setBillingAddresses([]);
      }
    }
  };

  const handleConcernPersonChange = async (e) => {
    const value = e.target.value;
    clearError("concernpersonname");
    setFormData((prev) => ({
      ...prev,
      concernpersonname: value,
      concernpersondesignation: "",
      concernpersonemail: "",
      concernpersonmobile: "",
    }));
    if (value) await fetchConcernPersonDetails(value);
  };

  const handleQuotationChange = (e) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, quotationid: value }));
  };

  const handlePriorityChange = (e) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, priority: value }));
    setShowPriorityCharges(value !== "2");
    clearError("priority");
  };

  const handleWitnessChange = (e) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, witness: value }));
    setShowWitnessDetails(value !== "2");
    clearError("witness");
  };

  const handleModeOfReceiptChange = (e) => {
    setFormData((prev) => ({ ...prev, modeofreciept: e.target.value }));
    setShowCourierDetails(e.target.value !== "1");
  };

  const handlePaymentStatusChange = (e) => {
    setFormData((prev) => ({ ...prev, paymentstatus: e.target.value }));
    setShowPaymentDetails(e.target.value !== "2");
  };

  const handleFileChange = (e, fieldName) => {
    const file = e.target.files[0];
    if (fieldName === "wupload") setWuploadFile(file || null);
    else if (fieldName === "rupload") setRuploadFile(file || null);
  };

  // ── Success modal OK click ───────────────────────────────────────────────────
  const handleOkClick = () => {
    setShowSuccessModal(false);
    navigate("/dashboards/testing/trfs-starts-jobs");
  };

  // ── Validate — collect ALL errors (AddInwardEntry pattern) ──────────────────
  const validate = () => {
    const newErrors = {};

    if (!formData.date) newErrors.date = "Date is required";
    if (!formData.sample_received_on)
      newErrors.sample_received_on = "Sample Received Date is required";
    if (!formData.ctype) newErrors.ctype = "Customer Type is required";
    if (!formData.customerid) newErrors.customerid = "Customer is required";
    if (!formData.specificpurpose)
      newErrors.specificpurpose = "Specific Purpose is required";
    if (!formData.letterrefno)
      newErrors.letterrefno = "Customer Reference is required";

    if (formData.customerid) {
      if (!formData.reportname)
        newErrors.reportname = "Report Customer Name is required";
      if (!formData.reportaddress)
        newErrors.reportaddress = "Report Address is required";
      if (!formData.billingname)
        newErrors.billingname = "Billing Customer Name is required";
      if (!formData.billingaddress)
        newErrors.billingaddress = "Billing Address is required";
      if (!formData.gstno) newErrors.gstno = "GST Number is required";
      if (!formData.concernpersonname)
        newErrors.concernpersonname = "Concern Person is required";
    }

    if (!formData.ponumber) newErrors.ponumber = "Work Order No is required";
    if (!formData.bd) newErrors.bd = "Concerned BD is required";
    if (!formData.promoter) newErrors.promoter = "Engineer is required";
    if (!formData.priority) newErrors.priority = "Priority Sample is required";
    if (!formData.witness) newErrors.witness = "Witness Required is required";
    if (!formData.modeofreciept)
      newErrors.modeofreciept = "Mode of Receipt is required";

    if (formData.paymentstatus !== "2") {
      if (!formData.modeofpayment)
        newErrors.modeofpayment = "Mode of Payment is required";
      if (!formData.detailsofpayment)
        newErrors.detailsofpayment = "Payment Details are required";
      if (!formData.paymentamount || parseFloat(formData.paymentamount) <= 0)
        newErrors.paymentamount = "Valid Payment Amount is required";
    }

    if (!formData.certcollectionremark)
      newErrors.certcollectionremark = "Description is required";

    return newErrors;
  };

  // ── Submit (AddInwardEntry pattern) ─────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const newErrors = validate();

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    setErrors({});

    try {
      const submitData = new FormData();

      Object.keys(formData).forEach((key) => {
        if (key === "certcollectiondetail") {
          if (Array.isArray(formData[key]) && formData[key].length > 0) {
            formData[key].forEach((item) => {
              if (item) submitData.append(`${key}[]`, item);
            });
          }
        } else {
          if (
            formData[key] !== undefined &&
            formData[key] !== null &&
            formData[key] !== ""
          ) {
            submitData.append(key, formData[key]);
          }
        }
      });

      if (wuploadFile) submitData.append("wupload", wuploadFile);
      if (ruploadFile) submitData.append("rupload", ruploadFile);

      for (let [key, value] of submitData.entries())
        console.log(`${key}:`, value);

      const response = await axios.post("/testing/add-trf-entry", submitData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (
        String(response.data.status) === "true" ||
        String(response.data.status) === "1"
      ) {
        toast.success("TRF Entry Saved ✅");
        setSuccessMessage(response.data.message || "TRF Entry Added");
        setShowSuccessModal(true);
      } else {
        toast.error(response.data.message || "Failed to save entry ❌");
      }
    } catch (error) {
      console.error("Error creating TRF entry:", error);
      toast.error(error?.response?.data?.message || "Something went wrong ❌");
    } finally {
      setLoading(false);
    }
  };

  // ── Inline error component ───────────────────────────────────────────────────
  const ErrMsg = ({ field }) =>
    errors[field] ? (
      <p className="mt-1 text-sm text-red-500">{errors[field]}</p>
    ) : null;

  // ── Loading screen ───────────────────────────────────────────────────────────
  if (loadingOptions) {
    return (
      <Page title="Add TRF Entry">
        <div className="flex h-[60vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading form options...</p>
          </div>
        </div>
      </Page>
    );
  }

  // ── Pre-compute option arrays (used in multiple places) ─────────────────────
  const customerOptions = customers.map((c) => ({
    value: String(c.id),
    label: `${c.name} (${c.pnumber || c.phone || "N/A"})`,
    gstno: c.gstno || "",
    modeofpayment: c.modeofpayment ? String(c.modeofpayment) : "",
    email: c.email || "",
    creditdays: c.creditdays || 0,
    creditamount: c.creditamount || 0,
    leftamount: c.leftamount || 0,
  }));
  const customerTypeOptions = toOptions(customerTypes, (t) => t.name);
  const specificPurposeOptions = toOptions(specificPurposes, (p) => p.name);
  const bdOptions = toOptions(bds, (b) => `${b.firstname} ${b.lastname}`);
  const promoterOptions = toOptions(promoters, (p) => p.name);
  const choiceOptions = toOptions(choices, (c) => c.name);
  const modeOfReceiptOptions = toOptions(modesOfReceipt, (m) => m.name);
  const paymentModeOptions = toOptions(paymentModes, (m) => m.name);
  const reportAddressOptions = toOptions(
    reportAddresses,
    (a) => `${a.name} (${a.address})`,
  );
  const billingAddressOptions = toOptions(
    billingAddresses,
    (a) => `${a.name} (${a.address})`,
  );
  const concernPersonOptions = toOptions(
    concernPersons,
    (p) => `${p.name} (${p.mobile})`,
  );
  const quotationOptions = [
    { value: "0", label: "Select Quotation" },
    ...quotations.map((q) => ({
      value: String(q.id),
      label: String(q.id).padStart(5, "0"),
    })),
  ];
  const returnableOptions = choiceOptions;
  const pchargesTypeOptions = [
    { value: "1", label: "₹ (Rupees)" },
    { value: "2", label: "% (Percentage)" },
  ];
  const wchargesTypeOptions = pchargesTypeOptions;

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <Page title="Add TRF Entry">
      <div className="transition-content w-full px-[var(--margin-x)] pb-5">
        {/* Back link */}
        <div className="mb-4">
          <a
            href="/dashboards/testing/trfs-starts-jobs"
            className="inline-flex items-center text-blue-600 hover:text-blue-800"
          >
            <svg
              className="mr-1 h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to TRF Entry List
          </a>
        </div>

        <Card className="mb-6">
          <div className="border-b px-6 py-4">
            <h3 className="text-lg font-semibold text-gray-800">
              TRF Entry Form
            </h3>
          </div>

          <form
            onSubmit={handleSubmit}
            className="p-6"
            encType="multipart/form-data"
          >
            {/* ━━━━ 1. SERVICE REQUESTOR ━━━━ */}
            <h4 className="text-md mb-4 border-b pb-2 font-semibold text-gray-700">
              1. SERVICE REQUESTOR
            </h4>
            <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Date */}
              <div ref={dateRef}>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Date <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  name="date"
                  value={dateInputs.date}
                  onChange={handleDateChange}
                  className="w-full"
                />
                <ErrMsg field="date" />
              </div>

              {/* Sample Received Date */}
              <div ref={sampleReceivedOnRef}>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Sample Received Date <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  name="sample_received_on"
                  value={dateInputs.sample_received_on}
                  onChange={handleDateChange}
                  className="w-full"
                />
                <ErrMsg field="sample_received_on" />
              </div>

              {/* Customer Type — SearchSelect */}
              <div ref={ctypeRef}>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Customer Type <span className="text-red-500">*</span>
                </label>
                <SearchSelect
                  options={customerTypeOptions}
                  value={findOption(customerTypeOptions, formData.ctype)}
                  onChange={(opt) => {
                    clearError("ctype");
                    setFormData((prev) => ({
                      ...prev,
                      ctype: opt ? opt.value : "",
                    }));
                  }}
                  placeholder="Search Customer Type..."
                  error={!!errors.ctype}
                />
                <ErrMsg field="ctype" />
              </div>
              {/* Customer — SearchSelect */}
              <div ref={customeridRef}>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Customer (Responsible For Payment){" "}
                  <span className="text-red-500">*</span>
                </label>
                <SearchSelect
                  options={customerOptions}
                  value={findOption(customerOptions, formData.customerid)}
                  onChange={(opt) => {
                    clearError("customerid");
                    setFormData((prev) => ({
                      ...prev,
                      customerid: opt ? opt.value : "",
                      reportname: "",
                      reportaddress: "",
                      billingname: "",
                      billingaddress: "",
                      gstno: "",
                      customername: "",
                      customeraddress: "",
                      concernpersonname: "",
                      concernpersondesignation: "",
                      concernpersonemail: "",
                      concernpersonmobile: "",
                      quotationid: "0",
                      modeofpayment: "",
                    }));
                    setReportAddresses([]);
                    setBillingAddresses([]);
                    setConcernPersons([]);
                    setQuotations([]);
                    setCustomerCredit(null);
                    setCustomerEmail("");
                    setShowCustomerDetails(false);
                    if (opt) fetchCustomerDependentData(opt.value, opt); // ✅ opt pass
                  }}
                  placeholder="Search Customer..."
                  error={!!errors.customerid}
                />
                <ErrMsg field="customerid" />
              </div>

              {/* Specific Purpose — SearchSelect */}
              <div ref={specificpurposeRef}>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Specific Purpose <span className="text-red-500">*</span>
                </label>
                <SearchSelect
                  options={specificPurposeOptions}
                  value={findOption(
                    specificPurposeOptions,
                    formData.specificpurpose,
                  )}
                  onChange={(opt) => {
                    clearError("specificpurpose");
                    setFormData((prev) => ({
                      ...prev,
                      specificpurpose: opt ? opt.value : "",
                    }));
                  }}
                  placeholder="Search Specific Purpose..."
                  error={!!errors.specificpurpose}
                />
                <ErrMsg field="specificpurpose" />
              </div>

            </div>

            {/* ━━━━ CUSTOMER DETAILS BLOCK ━━━━ */}
            {loadingCustomer && (
              <div className="mb-6 flex items-center justify-center py-6">
                <div className="mr-3 h-6 w-6 animate-spin rounded-full border-b-2 border-blue-600"></div>
                <span className="text-sm text-gray-600">
                  Loading customer details...
                </span>
              </div>
            )}

            {showCustomerDetails && !loadingCustomer && (
              <div className="mb-6 overflow-hidden rounded-lg border border-gray-200">
                {/* Credit info */}
                {customerCredit && (
                  <div className="border-b border-blue-100 bg-blue-50 px-5 py-3">
                    <p className="mb-1 text-sm font-medium text-blue-800">
                      Customer Credit
                    </p>
                    <div className="flex flex-wrap gap-4 text-sm text-blue-700">
                      <span>
                        <span className="font-medium">Credit Period:</span>{" "}
                        {customerCredit.creditdays} days
                      </span>
                      <span>
                        <span className="font-medium">Credit Limit:</span> ₹{" "}
                        {customerCredit.creditamount}
                      </span>
                      <span>
                        <span className="font-medium">Credit Left:</span> ₹{" "}
                        {customerCredit.leftamount}
                      </span>
                    </div>
                  </div>
                )}

                {/* Customer's Reporting Detail */}
                <div className="border-b border-gray-200 px-5 py-5">
                  <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <span className="inline-block h-2 w-2 rounded-full bg-green-500"></span>
                    Customer&apos;s Reporting Detail
                  </h4>
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    {/* Report Customer Name — SearchSelect */}
                    <div ref={reportnameRef}>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Customer Name <span className="text-red-500">*</span>
                      </label>
                      <SearchSelect
                        options={customerOptions}
                        value={findOption(customerOptions, formData.reportname)}
                        onChange={(opt) => {
                          handleReportNameChange({
                            target: { value: opt ? opt.value : "" },
                          });
                        }}
                        placeholder="Search Report Customer..."
                        error={!!errors.reportname}
                      />
                      <ErrMsg field="reportname" />
                    </div>

                    {/* Report Address — SearchSelect */}
                    <div ref={reportaddressRef}>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Customer Address <span className="text-red-500">*</span>
                      </label>
                      <SearchSelect
                        options={reportAddressOptions}
                        value={findOption(
                          reportAddressOptions,
                          formData.reportaddress,
                        )}
                        onChange={(opt) => {
                          clearError("reportaddress");
                          setFormData((prev) => ({
                            ...prev,
                            reportaddress: opt ? opt.value : "",
                          }));
                        }}
                        placeholder={
                          reportAddressOptions.length === 0
                            ? "No addresses found"
                            : "Search Address..."
                        }
                        isDisabled={reportAddressOptions.length === 0}
                        error={!!errors.reportaddress}
                      />
                      <ErrMsg field="reportaddress" />
                    </div>
                  </div>
                </div>

                {/* Same as reporting button */}
                <div className="flex items-center gap-3 border-b border-gray-200 bg-gray-50 px-5 py-3">
                  <button
                    type="button"
                    onClick={handleSameAsReporting}
                    className="flex items-center gap-1.5 rounded border border-blue-300 px-3 py-1.5 text-sm text-blue-600 transition-colors hover:border-blue-500 hover:text-blue-800"
                  >
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    Same as Reporting
                  </button>
                  <span className="text-xs text-gray-500">
                    Click to copy reporting details to billing
                  </span>
                </div>

                {/* Customer's Billing Detail */}
                <div className="border-b border-gray-200 px-5 py-5">
                  <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <span className="inline-block h-2 w-2 rounded-full bg-orange-500"></span>
                    Customer&apos;s Billing Detail
                  </h4>
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    {/* Billing Customer Name — SearchSelect */}
                    <div ref={billingnameRef}>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Customer Name <span className="text-red-500">*</span>
                      </label>
                      <SearchSelect
                        options={customerOptions}
                        value={findOption(
                          customerOptions,
                          formData.billingname,
                        )}
                        onChange={(opt) => {
                          handleBillingNameChange({
                            target: { value: opt ? opt.value : "" },
                          });
                        }}
                        placeholder="Search Billing Customer..."
                        error={!!errors.billingname}
                      />
                      <ErrMsg field="billingname" />
                    </div>

                    {/* Billing Address — SearchSelect */}
                    <div ref={billingaddressRef}>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Customer Address <span className="text-red-500">*</span>
                      </label>
                      <SearchSelect
                        options={billingAddressOptions}
                        value={findOption(
                          billingAddressOptions,
                          formData.billingaddress,
                        )}
                        onChange={(opt) => {
                          clearError("billingaddress");
                          setFormData((prev) => ({
                            ...prev,
                            billingaddress: opt ? opt.value : "",
                          }));
                        }}
                        placeholder={
                          billingAddressOptions.length === 0
                            ? "No addresses found"
                            : "Search Address..."
                        }
                        isDisabled={billingAddressOptions.length === 0}
                        error={!!errors.billingaddress}
                      />
                      <ErrMsg field="billingaddress" />
                    </div>

                    {/* GST */}
                    <div className="md:col-span-2" ref={gstnoRef}>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        GST Number <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="text"
                        name="gstno"
                        value={formData.gstno}
                        onChange={handleInputChange}
                        className="w-full"
                        placeholder="Enter GST number"
                        maxLength={15}
                      />
                      <ErrMsg field="gstno" />
                    </div>
                  </div>
                </div>

                {/* Concern Person */}
                <div className="border-b border-gray-200 px-5 py-5">
                  <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <span className="inline-block h-2 w-2 rounded-full bg-purple-500"></span>
                    Concern Person Details
                  </h4>
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    {/* Concern Person Name — SearchSelect */}
                    <div ref={concernpersonnameRef}>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Concern Person Name{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <SearchSelect
                        options={concernPersonOptions}
                        value={findOption(
                          concernPersonOptions,
                          formData.concernpersonname,
                        )}
                        onChange={(opt) => {
                          handleConcernPersonChange({
                            target: { value: opt ? opt.value : "" },
                          });
                        }}
                        placeholder="Search Concern Person..."
                        error={!!errors.concernpersonname}
                      />
                      <ErrMsg field="concernpersonname" />
                    </div>

                    {formData.concernpersonname && (
                      <>
                        <div>
                          <label className="mb-1 block text-sm font-medium text-gray-700">
                            Designation
                          </label>
                          <Input
                            type="text"
                            name="concernpersondesignation"
                            value={formData.concernpersondesignation}
                            onChange={handleInputChange}
                            className="w-full bg-gray-100"
                            placeholder="Concern person designation"
                            disabled
                            readOnly
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-medium text-gray-700">
                            Email
                          </label>
                          <Input
                            type="email"
                            name="concernpersonemail"
                            value={formData.concernpersonemail}
                            onChange={handleInputChange}
                            className="w-full bg-gray-100"
                            placeholder="Concern person email"
                            disabled
                            readOnly
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-medium text-gray-700">
                            Mobile
                          </label>
                          <Input
                            type="text"
                            name="concernpersonmobile"
                            value={formData.concernpersonmobile}
                            onChange={handleInputChange}
                            className="w-full bg-gray-100"
                            placeholder="Concern person mobile"
                            disabled
                            readOnly
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Quotation — SearchSelect */}
                <div className="px-5 py-5">
                  <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <span className="inline-block h-2 w-2 rounded-full bg-yellow-500"></span>
                    Quotation
                  </h4>
                  <div className="max-w-sm">
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Quotation No.
                    </label>
                    <SearchSelect
                      options={quotationOptions}
                      value={findOption(quotationOptions, formData.quotationid)}
                      onChange={(opt) => {
                        handleQuotationChange({
                          target: { value: opt ? opt.value : "0" },
                        });
                      }}
                      placeholder="Search Quotation..."
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ━━━━ 2. WORK ORDER DETAILS ━━━━ */}
            <h4 className="text-md mt-8 mb-4 border-b pb-2 font-semibold text-gray-700">
              2. WORK ORDER DETAILS
            </h4>
            <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Customer Reference */}
              <div className="md:col-span-2" ref={letterrefnoRef}>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Customer Reference <span className="text-red-500">*</span>
                </label>
                <Textarea
                  name="letterrefno"
                  value={formData.letterrefno}
                  onChange={handleInputChange}
                  className="w-full"
                  rows={3}
                  placeholder="Enter customer reference details"
                />
                <ErrMsg field="letterrefno" />
              </div>

              <div ref={ponumberRef}>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Work Order Number <span className="text-red-500">*</span>
                </label>
                <Input
                  list="workordersuggest"
                  name="ponumber"
                  value={formData.ponumber}
                  onChange={handleInputChange}
                  className="w-full"
                  placeholder="Enter work order number"
                />
                <datalist id="workordersuggest">
                  {[
                    "TRF",
                    "Telephonic",
                    "Email",
                    "Verble",
                    "Letter",
                    "Challan",
                  ].map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
                <ErrMsg field="ponumber" />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Work Order Upload
                </label>
                <Input
                  type="file"
                  name="wupload"
                  onChange={(e) => handleFileChange(e, "wupload")}
                  className="w-full"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Accepted: PDF, JPG, PNG, DOC, DOCX
                </p>
              </div>

              {/* Concerned BD — SearchSelect */}
              <div ref={bdRef}>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Concerned BD <span className="text-red-500">*</span>
                </label>
                <SearchSelect
                  options={bdOptions}
                  value={findOption(bdOptions, formData.bd)}
                  onChange={(opt) => {
                    clearError("bd");
                    setFormData((prev) => ({
                      ...prev,
                      bd: opt ? opt.value : "",
                    }));
                  }}
                  placeholder="Search BD..."
                  error={!!errors.bd}
                />
                <ErrMsg field="bd" />
              </div>

              {/* Engineer — SearchSelect */}
              <div ref={promoterRef}>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Engineer <span className="text-red-500">*</span>
                </label>
                <SearchSelect
                  options={promoterOptions}
                  value={findOption(promoterOptions, formData.promoter)}
                  onChange={(opt) => {
                    clearError("promoter");
                    setFormData((prev) => ({
                      ...prev,
                      promoter: opt ? opt.value : "",
                    }));
                  }}
                  placeholder="Search Engineer..."
                  error={!!errors.promoter}
                />
                <ErrMsg field="promoter" />
              </div>

              {/* Priority Sample — SearchSelect */}
              <div ref={priorityRef}>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Priority Sample <span className="text-red-500">*</span>
                </label>
                <SearchSelect
                  options={choiceOptions}
                  value={findOption(choiceOptions, formData.priority)}
                  onChange={(opt) => {
                    handlePriorityChange({
                      target: { value: opt ? opt.value : "" },
                    });
                  }}
                  placeholder="Select Priority..."
                  error={!!errors.priority}
                />
                <ErrMsg field="priority" />
              </div>

              {showPriorityCharges && (
                <>
                  <div ref={pchargesRef}>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Priority Testing Charges
                    </label>
                    <Input
                      type="number"
                      name="pcharges"
                      value={formData.pcharges}
                      onChange={handleInputChange}
                      className="w-full"
                      min="0"
                      step="0.01"
                    />
                    <ErrMsg field="pcharges" />
                  </div>
                  {/* Charge Type — SearchSelect */}
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Charge Type
                    </label>
                    <SearchSelect
                      options={pchargesTypeOptions}
                      value={findOption(
                        pchargesTypeOptions,
                        formData.pchargestype,
                      )}
                      onChange={(opt) => {
                        setFormData((prev) => ({
                          ...prev,
                          pchargestype: opt ? opt.value : "1",
                        }));
                      }}
                      placeholder="Select Charge Type..."
                    />
                  </div>
                </>
              )}
            </div>

            {/* ━━━━ 3. WITNESS DETAILS ━━━━ */}
            <h4 className="text-md mt-8 mb-4 border-b pb-2 font-semibold text-gray-700">
              3. WITNESS DETAILS
            </h4>
            <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Witness Required — SearchSelect */}
              <div ref={witnessRef}>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Witness Required <span className="text-red-500">*</span>
                </label>
                <SearchSelect
                  options={choiceOptions}
                  value={findOption(choiceOptions, formData.witness)}
                  onChange={(opt) => {
                    handleWitnessChange({
                      target: { value: opt ? opt.value : "" },
                    });
                  }}
                  placeholder="Select..."
                  error={!!errors.witness}
                />
                <ErrMsg field="witness" />
              </div>

              {showWitnessDetails && (
                <>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Witness Date
                    </label>
                    <Input
                      type="date"
                      name="wdatetime"
                      value={dateInputs.wdatetime}
                      onChange={handleDateChange}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Witness Time
                    </label>
                    <Input
                      type="time"
                      name="wtime"
                      value={formData.wtime}
                      onChange={handleInputChange}
                      className="w-full"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Witness Details
                    </label>
                    <Input
                      type="text"
                      name="wdetail"
                      value={formData.wdetail}
                      onChange={handleInputChange}
                      className="w-full"
                      placeholder="Names of persons"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Witness Charges
                    </label>
                    <Input
                      type="number"
                      name="wcharges"
                      value={formData.wcharges}
                      onChange={handleInputChange}
                      className="w-full"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  {/* Witness Charge Type — SearchSelect */}
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Charge Type
                    </label>
                    <SearchSelect
                      options={wchargesTypeOptions}
                      value={findOption(
                        wchargesTypeOptions,
                        formData.wchargestype,
                      )}
                      onChange={(opt) => {
                        setFormData((prev) => ({
                          ...prev,
                          wchargestype: opt ? opt.value : "1",
                        }));
                      }}
                      placeholder="Select Charge Type..."
                    />
                  </div>
                </>
              )}
            </div>

            {/* ━━━━ 4. MODE OF RECEIPT ━━━━ */}
            <h4 className="text-md mt-8 mb-4 border-b pb-2 font-semibold text-gray-700">
              4. MODE OF RECEIPT
            </h4>
            <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Mode Of Receipt — SearchSelect */}
              <div ref={modeofrecieptRef}>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Mode Of Receipt <span className="text-red-500">*</span>
                </label>
                <SearchSelect
                  options={modeOfReceiptOptions}
                  value={findOption(
                    modeOfReceiptOptions,
                    formData.modeofreciept,
                  )}
                  onChange={(opt) => {
                    handleModeOfReceiptChange({
                      target: { value: opt ? opt.value : "" },
                    });
                  }}
                  placeholder="Search Mode of Receipt..."
                  error={!!errors.modeofreciept}
                />
                <ErrMsg field="modeofreciept" />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Local Contact of Courier/Cargo/Person Name
                </label>
                <Input
                  type="text"
                  name="localcontact"
                  value={formData.localcontact}
                  onChange={handleInputChange}
                  className="w-full"
                  placeholder="Enter local contact name"
                />
              </div>

              {showCourierDetails && (
                <>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Courier/Cargo/Transport
                    </label>
                    <Input
                      type="text"
                      name="couriername"
                      value={formData.couriername}
                      onChange={handleInputChange}
                      className="w-full"
                      placeholder="Enter courier name"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Date Of Dispatch
                    </label>
                    <Input
                      type="date"
                      name="dateofdispatch"
                      value={dateInputs.dateofdispatch}
                      onChange={handleDateChange}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Docket/Airway Bill Number
                    </label>
                    <Input
                      type="text"
                      name="docketno"
                      value={formData.docketno}
                      onChange={handleInputChange}
                      className="w-full"
                      placeholder="Enter docket number"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Receipt Document Upload
                    </label>
                    <Input
                      type="file"
                      name="rupload"
                      onChange={(e) => handleFileChange(e, "rupload")}
                      className="w-full"
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Upload receipt/delivery proof
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* ━━━━ 5. MODE OF PAYMENT ━━━━ */}
            <h4 className="text-md mt-8 mb-4 border-b pb-2 font-semibold text-gray-700">
              5. MODE OF PAYMENT
            </h4>
            <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Is Payment Done — SearchSelect */}
              <div ref={paymentstatusRef}>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Is Payment Done? <span className="text-red-500">*</span>
                </label>
                <SearchSelect
                  options={choiceOptions}
                  value={findOption(choiceOptions, formData.paymentstatus)}
                  onChange={(opt) => {
                    handlePaymentStatusChange({
                      target: { value: opt ? opt.value : "" },
                    });
                  }}
                  placeholder="Select Payment Status..."
                  error={!!errors.paymentstatus}
                />
                <ErrMsg field="paymentstatus" />
              </div>

              {showPaymentDetails && (
                <>
                  {/* Mode Of Payment — SearchSelect */}
                  <div ref={modeofpaymentRef}>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Mode Of Payment <span className="text-red-500">*</span>
                    </label>
                    <SearchSelect
                      options={paymentModeOptions}
                      value={findOption(
                        paymentModeOptions,
                        formData.modeofpayment,
                      )}
                      onChange={(opt) => {
                        clearError("modeofpayment");
                        setFormData((prev) => ({
                          ...prev,
                          modeofpayment: opt ? opt.value : "",
                        }));
                      }}
                      placeholder="Search Payment Mode..."
                      error={!!errors.modeofpayment}
                    />
                    <ErrMsg field="modeofpayment" />
                  </div>

                  <div ref={detailsofpaymentRef}>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Payment Details <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      name="detailsofpayment"
                      value={formData.detailsofpayment}
                      onChange={handleInputChange}
                      className="w-full"
                      placeholder="e.g., Bank transfer, Cheque number"
                    />
                    <ErrMsg field="detailsofpayment" />
                  </div>

                  <div ref={paymentamountRef}>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Amount <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="number"
                      name="paymentamount"
                      value={formData.paymentamount}
                      onChange={handleInputChange}
                      className="w-full"
                      min="0"
                      step="0.01"
                      placeholder="Enter amount"
                    />
                    <ErrMsg field="paymentamount" />
                  </div>
                </>
              )}
            </div>

            {/* ━━━━ 6. CERTIFICATE COLLECTION DETAILS ━━━━ */}
            <h4 className="text-md mt-8 mb-4 border-b pb-2 font-semibold text-gray-700">
              6. CERTIFICATE COLLECTION DETAILS (Please tick)
            </h4>
            <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Certificate Collect As
                </label>
                <ReactSelect
                  isMulti
                  options={certCollectionDetails.map((d) => ({
                    value: d.id,
                    label: d.name,
                  }))}
                  value={certCollectionDetails
                    .filter((d) => formData.certcollectiondetail.includes(d.id))
                    .map((d) => ({ value: d.id, label: d.name }))}
                  onChange={(selected) =>
                    handleReactSelectChange(selected, "certcollectiondetail")
                  }
                  styles={customSelectStyles}
                  placeholder="Select certificate collection methods..."
                  menuPortalTarget={document.body}
                  isClearable
                  isSearchable
                />
                <p className="mt-1 text-xs text-gray-500">
                  Select multiple certificate collection methods
                </p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Additional Email IDs
                </label>
                <Textarea
                  name="additionalemail"
                  value={formData.additionalemail}
                  onChange={handleInputChange}
                  className="w-full"
                  rows={3}
                  placeholder="Enter comma-separated additional emails"
                />
                {customerEmail && (
                  <p className="mt-2 text-sm text-gray-600">
                    Customer Email:{" "}
                    <span className="font-medium">{customerEmail}</span>
                  </p>
                )}
              </div>

              <div className="md:col-span-2" ref={certcollectionremarkRef}>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Description <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  name="certcollectionremark"
                  value={formData.certcollectionremark}
                  onChange={handleInputChange}
                  className="w-full"
                  placeholder="Enter description"
                />
                <ErrMsg field="certcollectionremark" />
              </div>
            </div>

            {/* ━━━━ 7. SPECIAL INSTRUCTIONS ━━━━ */}
            <h4 className="text-md mt-8 mb-4 border-b pb-2 font-semibold text-gray-700">
              7. SPECIAL INSTRUCTIONS
            </h4>
            <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Any Returnable Items — SearchSelect */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Any Returnable Items
                </label>
                <SearchSelect
                  options={returnableOptions}
                  value={findOption(returnableOptions, formData.returnable)}
                  onChange={(opt) => {
                    setFormData((prev) => ({
                      ...prev,
                      returnable: opt ? opt.value : "",
                    }));
                  }}
                  placeholder="Select..."
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Documents Submitted, if any (Details)
                </label>
                <Input
                  type="text"
                  name="documents"
                  value={formData.documents}
                  onChange={handleInputChange}
                  className="w-full"
                  placeholder="Enter document details"
                />
              </div>
              <div ref={deadlineRef}>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Any Deadline
                </label>
                <Input
                  type="date"
                  name="deadline"
                  value={dateInputs.deadline}
                  onChange={handleDateChange}
                  className="w-full"
                />
                <ErrMsg field="deadline" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Any Special Request
                </label>
                <Textarea
                  name="specialrequest"
                  value={formData.specialrequest}
                  onChange={handleInputChange}
                  className="w-full"
                  rows={3}
                  placeholder="Enter any special requests"
                />
              </div>
            </div>

            {/* ━━━━ 8. NOTES ━━━━ */}
            <h4 className="text-md mt-8 mb-4 border-b pb-2 font-semibold text-gray-700">
              8. NOTES
            </h4>
            <div className="mb-6">
              <Textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                className="w-full"
                rows={4}
                placeholder="Enter any additional notes or remarks"
              />
            </div>

            {/* Submit */}
            <div className="mt-8 flex justify-end space-x-4 border-t pt-6">
              <Button
                type="button"
                variant="outlined"
                onClick={() => navigate("/dashboards/testing/trfs-starts-jobs")}
                className="px-6"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                color="primary"
                disabled={loading}
                className="px-6"
              >
                {loading ? (
                  <>
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></span>
                    Saving...
                  </>
                ) : (
                  "Add TRF Items >>"
                )}
              </Button>
            </div>
          </form>
        </Card>
      </div>

      {/* ── Success Modal (AddInwardEntry pattern) ──────────────────────────── */}
      {showSuccessModal && (
        <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
          <div className="w-[90%] max-w-md rounded bg-white p-6 text-center shadow-lg">
            <h2 className="mb-2 text-lg font-bold">Result</h2>
            <p className="mb-4 text-gray-700">
              <strong>{successMessage}</strong>
            </p>
            <Button onClick={handleOkClick}>OK</Button>
          </div>
        </div>
      )}
    </Page>
  );
}
