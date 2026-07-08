// EditTrfStartJob.jsx - Fixed with full customer details block (matches AddTrfStartJob)
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "utils/axios";
import { toast } from "sonner";

import { Page } from "components/shared/Page";
import { Button } from "components/ui";
import { Input, Textarea, Select as FormSelect } from "components/ui/Form";
import { Card } from "components/ui/Card";
import ReactSelect from "react-select";

export default function EditTrfStartJob() {
  const navigate = useNavigate();
  const { id } = useParams();

  const today = new Date();
  const todayDisplay = today.toISOString().split("T")[0];
  const todayFormatted = `${today.getDate().toString().padStart(2, "0")}/${(today.getMonth() + 1).toString().padStart(2, "0")}/${today.getFullYear()}`;

  // ── Refs for scroll-to-error ────────────────────────────────────────────────
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
    id: "",
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

  // ── Date inputs (YYYY-MM-DD for <input type="date">) ───────────────────────
  const [dateInputs, setDateInputs] = useState({
    date: todayDisplay,
    sample_received_on: "",
    wdatetime: "",
    dateofdispatch: "",
    deadline: "",
  });

  // ── Errors ──────────────────────────────────────────────────────────────────
  const [errors, setErrors] = useState({});

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

  // ── Customer credit & email ─────────────────────────────────────────────────
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
  const [existingWupload, setExistingWupload] = useState(null);
  const [existingRupload, setExistingRupload] = useState(null);

  // ── Loading ─────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingCustomer, setLoadingCustomer] = useState(false);

  // ── ReactSelect styles ──────────────────────────────────────────────────────
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
    multiValue: (base) => ({ ...base, backgroundColor: "#dbeafe", borderRadius: "0.25rem" }),
    multiValueLabel: (base) => ({ ...base, color: "#1e40af" }),
    multiValueRemove: (base) => ({
      ...base, color: "#3b82f6",
      "&:hover": { backgroundColor: "#3b82f6", color: "white" },
    }),
  };

  // ── Scroll to first error ───────────────────────────────────────────────────
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

  useEffect(() => {
    if (Object.keys(errors).length > 0) scrollToFirstError();
  }, [errors, scrollToFirstError]);

  // ── On mount: fetch dropdowns then TRF data ─────────────────────────────────
  useEffect(() => {
    const init = async () => {
      await fetchAllOptions();
      if (id) await fetchTrfData();
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // ── Fetch all dropdowns ─────────────────────────────────────────────────────
  const fetchAllOptions = async () => {
    try {
      setLoadingOptions(true);
      const [
        customerTypesRes, specificPurposesRes, customersRes,
        bdsRes, promotersRes, choicesRes, modesOfReceiptRes,
        paymentModesRes, certCollectionDetailsRes,
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

      if (customerTypesRes.data?.Data) setCustomerTypes(customerTypesRes.data.Data);
      if (specificPurposesRes.data?.data) setSpecificPurposes(specificPurposesRes.data.data);
      if (customersRes.data?.data) setCustomers(customersRes.data.data);
      if (bdsRes.data?.data) setBds(bdsRes.data.data);
      if (promotersRes.data?.data) setPromoters(promotersRes.data.data);
      if (choicesRes.data?.data) setChoices(choicesRes.data.data);
      if (modesOfReceiptRes.data?.data) setModesOfReceipt(modesOfReceiptRes.data.data);
      if (paymentModesRes.data?.data) setPaymentModes(paymentModesRes.data.data);
      if (certCollectionDetailsRes.data?.data) setCertCollectionDetails(certCollectionDetailsRes.data.data);
    } catch (error) {
      console.error("Error fetching options:", error);
      toast.error("Failed to load form options");
    } finally {
      setLoadingOptions(false);
    }
  };

  // ── Helper: any date string → YYYY-MM-DD (for <input type="date">) ──────────
  // Handles: "YYYY-MM-DD", "YYYY-MM-DD HH:mm:ss", "DD/MM/YYYY"
  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    const datePart = String(dateString).split(" ")[0].split("T")[0];
    if (datePart.includes("/")) {
      const [day, month, year] = datePart.split("/");
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }
    return datePart;
  };

  // ── Helper: any date string → DD/MM/YYYY (for server/update API) ────────────
  // Strips time component first to avoid "30 00:00:00/01/2026" PHP parsing error
  const formatDateForServer = (dateString) => {
    if (!dateString) return "";
    const datePart = String(dateString).split(" ")[0].split("T")[0];
    if (!datePart.includes("-")) return datePart;
    const [year, month, day] = datePart.split("-");
    if (!year || !month || !day) return "";
    return `${day}/${month}/${year}`;
  };

  // ── Fetch TRF data by ID ────────────────────────────────────────────────────
  const fetchTrfData = async () => {
    try {
      setLoadingData(true);
      const response = await axios.get(`/testing/get-trf-byid/${id}`);

      if (response.data?.status && response.data?.data) {
        const d = response.data.data;

        // Build certcollectiondetail array
        let certDetail = [];
        if (Array.isArray(d.certcollectiondetail)) {
          certDetail = d.certcollectiondetail.map(String);
        } else if (typeof d.certcollectiondetail === "string" && d.certcollectiondetail) {
          // API returns JSON string like "[\"1\"]" — try JSON.parse first
          try {
            const parsed = JSON.parse(d.certcollectiondetail);
            certDetail = Array.isArray(parsed) ? parsed.map(String) : [String(parsed)];
          } catch (parseErr) {
            certDetail = d.certcollectiondetail.split(",").map((v) => v.trim()).filter(Boolean);
            console.warn("certcollectiondetail JSON parse failed:", parseErr);
          }
        }

        // Set date inputs for display
        setDateInputs({
          date: formatDateForInput(d.date) || todayDisplay,
          sample_received_on: formatDateForInput(d.sample_received_on) || "",
          wdatetime: formatDateForInput(d.wdatetime) || "",
          dateofdispatch: formatDateForInput(d.dateofdispatch) || "",
          deadline: formatDateForInput(d.deadline) || "",
        });

        // Fill form data
        // NOTE: API returns dates as YYYY-MM-DD — convert to DD/MM/YYYY for update API
        setFormData({
          id: d.id || id,
          date: d.date ? formatDateForServer(d.date) : todayFormatted,
          sample_received_on: d.sample_received_on ? formatDateForServer(d.sample_received_on) : "",
          ctype: String(d.ctype || ""),
          customerid: String(d.customerid || ""),
          specificpurpose: String(d.specificpurpose || ""),
          letterrefno: d.letterrefno || "",
          ponumber: d.ponumber || "",
          bd: String(d.bd || ""),
          promoter: String(d.promoter || ""),
          priority: String(d.priority || ""),
          pcharges: d.pcharges || "0",
          pchargestype: String(d.pchargestype || "1"),
          witness: String(d.witness || ""),
          wdatetime: d.wdatetime ? formatDateForServer(d.wdatetime) : "",
          wtime: d.wtime || "",
          wdetail: d.wdetail || "",
          wcharges: d.wcharges || "0",
          wchargestype: String(d.wchargestype || "1"),
          wstatus: String(d.wstatus || "1"),
          modeofreciept: String(d.modeofreciept || "1"),
          localcontact: d.localcontact || "",
          couriername: d.couriername || "",
          dateofdispatch: d.dateofdispatch ? formatDateForServer(d.dateofdispatch) : "",
          docketno: d.docketno || "",
          modeofdispatch: String(d.modeofdispatch || "1"),
          paymentstatus: String(d.paymentstatus || "1"),
          modeofpayment: String(d.modeofpayment || ""),
          detailsofpayment: d.detailsofpayment || "",
          paymentamount: d.paymentamount || "",
          certcollectiondetail: certDetail,
          additionalemail: d.additionalemail || "",
          certcollectionremark: d.certcollectionremark || "",
          returnable: String(d.returnable || ""),
          documents: d.documents || "",
          deadline: d.deadline ? formatDateForServer(d.deadline) : "",
          specialrequest: d.specialrequest || "",
          notes: d.notes || "",
          // Customer detail fields
          reportname: String(d.reportname || ""),
          reportaddress: String(d.reportaddress || ""),
          billingname: String(d.billingname || ""),
          billingaddress: String(d.billingaddress || ""),
          gstno: d.gstno || "",
          concernpersonname: String(d.concernpersonname || ""),
          concernpersondesignation: d.concernpersondesignation || "",
          concernpersonemail: d.concernpersonemail || "",
          concernpersonmobile: d.concernpersonmobile || "",
          quotationid: String(d.quotationid || "0"),
          customername: d.customername || "",
          customeraddress: d.customeraddress || "nothing",
        });

        // Existing uploaded files
        if (d.wupload) setExistingWupload(d.wupload);
        if (d.rupload) setExistingRupload(d.rupload);

        // Visibility toggles
        setShowPriorityCharges(String(d.priority) !== "2");
        setShowWitnessDetails(String(d.witness) !== "2");
        setShowCourierDetails(String(d.modeofreciept) !== "1");
        setShowPaymentDetails(String(d.paymentstatus) !== "2");

        // Load customer-dependent data (addresses, concern persons, quotations, credit)
        if (d.customerid) {
          await fetchCustomerDependentDataForEdit(d.customerid, d.reportname, d.billingname);
        }
      } else {
        toast.error("TRF not found");
        navigate("/dashboards/testing/trfs-starts-jobs");
      }
    } catch (error) {
      console.error("Error fetching TRF data:", error);
      toast.error("Failed to load TRF data");
      navigate("/dashboards/testing/trfs-starts-jobs");
    } finally {
      setLoadingData(false);
    }
  };

  // ── Fetch customer-dependent data (for EDIT: preserves existing selections) ─
  const fetchCustomerDependentDataForEdit = async (customerId, existingReportName, existingBillingName) => {
    if (!customerId) return;
    setLoadingCustomer(true);
    try {
      const [creditRes, addressRes, concernPersonsRes, quotationsRes] = await Promise.all([
        axios.get(`/people/get-all-customers?id=${customerId}`),
        axios.get(`/people/get-customers-address/${customerId}`),
        axios.get(`/get-concern-person/${customerId}`),
        axios.get(`/get-quotaion/${customerId}`),
      ]);

      if (creditRes.data?.data) {
        const c = creditRes.data.data;
        setCustomerCredit({
          creditdays: c.creditdays,
          creditamount: c.creditamount,
          leftamount: c.leftamount,
        });
        setCustomerEmail(c.email || "");
        // Only set gstno/customername if not already filled from TRF data
        setFormData((prev) => ({
          ...prev,
          gstno: prev.gstno || c.gstno || "",
          customername: prev.customername || c.name || "",
          customeraddress: prev.customeraddress || "nothing",
        }));
      }

      if (addressRes.data?.data) {
        // Pre-load addresses for both report and billing from main customer
        setReportAddresses(addressRes.data.data);
        setBillingAddresses(addressRes.data.data);

        // If reportname is a DIFFERENT customer, also fetch their addresses
        if (existingReportName && String(existingReportName) !== String(customerId)) {
          try {
            const rRes = await axios.get(`/people/get-customers-address/${existingReportName}`);
            if (rRes.data?.data) setReportAddresses(rRes.data.data);
          } catch (err) {
            console.error("Error fetching report addresses:", err);
          }
        }

        // If billingname is a DIFFERENT customer, fetch their addresses
        if (existingBillingName && String(existingBillingName) !== String(customerId)) {
          try {
            const bRes = await axios.get(`/people/get-customers-address/${existingBillingName}`);
            if (bRes.data?.data) setBillingAddresses(bRes.data.data);
          } catch (err) {
            console.error("Error fetching billing addresses:", err);
          }
        }
      }

      if (concernPersonsRes.data?.data) setConcernPersons(concernPersonsRes.data.data);
      if (quotationsRes.data?.data) setQuotations(quotationsRes.data.data);

      setShowCustomerDetails(true);
    } catch (error) {
      console.error("Error fetching customer details:", error);
      toast.error("Failed to load customer details");
    } finally {
      setLoadingCustomer(false);
    }
  };

  // ── Fetch customer-dependent data (for CHANGE — same as Add) ───────────────
  // fetchCustomerDependentData को selectedOption accept करने दो
  const fetchCustomerDependentData = async (customerId, selectedOption = null) => {
    if (!customerId) return;
    setLoadingCustomer(true);
    try {
      const [addressRes, concernPersonsRes, quotationsRes] = await Promise.all([
        axios.get(`/people/get-customers-address/${customerId}`),
        axios.get(`/get-concern-person/${customerId}`),
        axios.get(`/get-quotaion/${customerId}`),
      ]);

      // ✅ selectedOption से GST/credit लो
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
          customername: selectedOption.label?.split(" (")[0] || "",
          customeraddress: "nothing",
          modeofpayment: selectedOption.modeofpayment || prev.modeofpayment,
        }));
      }

      if (addressRes.data?.data) {
        setReportAddresses(addressRes.data.data);
        setBillingAddresses(addressRes.data.data);
      }
      if (concernPersonsRes.data?.data) setConcernPersons(concernPersonsRes.data.data);
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
      if (error.response?.data?.message) toast.error(error.response.data.message);
      else toast.error("Something went wrong!");
    }
  };

  const fetchAddresses = async (customerId, type) => {
    try {
      const res = await axios.get(`/people/get-customers-address/${customerId}`);
      if (res.data?.data) {
        if (type === "report") setReportAddresses(res.data.data);
        if (type === "billing") setBillingAddresses(res.data.data);
      }
    } catch (err) { console.error(err); }
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

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const clearError = (field) => {
    if (errors[field]) setErrors((prev) => { const e = { ...prev }; delete e[field]; return e; });
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateInputs((prev) => ({ ...prev, [name]: value }));
    setFormData((prev) => ({ ...prev, [name]: value ? formatDateForServer(value) : "" }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    clearError(name);
  };

  const handleReactSelectChange = (selectedOptions, fieldName) => {
    const selectedValues = selectedOptions ? selectedOptions.map((o) => o.value) : [];
    setFormData((prev) => ({ ...prev, [fieldName]: selectedValues }));
  };

  const handleCustomerChange = async (e) => {
    const value = e.target.value;
    clearError("customerid");
    setFormData((prev) => ({
      ...prev,
      customerid: value,
      reportname: "", reportaddress: "",
      billingname: "", billingaddress: "",
      gstno: "", customername: "", customeraddress: "",
      concernpersonname: "", concernpersondesignation: "",
      concernpersonemail: "", concernpersonmobile: "",
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

    if (value) {
      // ✅ customers array से matching option ढूंढो
      const selectedOpt = customers.find((c) => String(c.id) === String(value));
      const optWithData = selectedOpt ? {
        value: String(selectedOpt.id),
        label: `${selectedOpt.name} (${selectedOpt.pnumber || selectedOpt.phone || "N/A"})`,
        gstno: selectedOpt.gstno || "",
        modeofpayment: selectedOpt.modeofpayment ? String(selectedOpt.modeofpayment) : "",
        email: selectedOpt.email || "",
        creditdays: selectedOpt.creditdays || 0,
        creditamount: selectedOpt.creditamount || 0,
        leftamount: selectedOpt.leftamount || 0,
      } : null;

      await fetchCustomerDependentData(value, optWithData); // ✅ opt pass
    }
  };

  const handleReportNameChange = async (e) => {
    const value = e.target.value;
    clearError("reportname");
    setFormData((prev) => ({ ...prev, reportname: value, reportaddress: "" }));
    if (value) {
      await fetchAddresses(value, "report");
    } else {
      if (formData.customerid) await fetchAddresses(formData.customerid, "report");
      else setReportAddresses([]);
    }
  };

  const handleBillingNameChange = async (e) => {
    const value = e.target.value;
    clearError("billingname");
    setFormData((prev) => ({ ...prev, billingname: value, billingaddress: "" }));
    if (value) {
      await fetchAddresses(value, "billing");
    } else {
      if (formData.customerid) await fetchAddresses(formData.customerid, "billing");
      else setBillingAddresses([]);
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
    setFormData((prev) => ({ ...prev, quotationid: e.target.value }));
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

  const removeExistingFile = (fieldName) => {
    if (fieldName === "wupload") setExistingWupload(null);
    else if (fieldName === "rupload") setExistingRupload(null);
  };

  // ── Validate ─────────────────────────────────────────────────────────────────
  const validate = () => {
    const newErrors = {};

    if (!formData.sample_received_on) newErrors.sample_received_on = "Sample Received Date is required";
    if (!formData.ctype) newErrors.ctype = "Customer Type is required";
    if (!formData.customerid) newErrors.customerid = "Customer is required";
    if (!formData.specificpurpose) newErrors.specificpurpose = "Specific Purpose is required";
    if (!formData.letterrefno) newErrors.letterrefno = "Customer Reference is required";

    if (formData.customerid) {
      if (!formData.reportname) newErrors.reportname = "Report Customer Name is required";
      if (!formData.reportaddress) newErrors.reportaddress = "Report Address is required";
      if (!formData.billingname) newErrors.billingname = "Billing Customer Name is required";
      if (!formData.billingaddress) newErrors.billingaddress = "Billing Address is required";
      if (!formData.gstno) newErrors.gstno = "GST Number is required";
      if (!formData.concernpersonname) newErrors.concernpersonname = "Concern Person is required";
    }

    if (!formData.ponumber) newErrors.ponumber = "Work Order No is required";
    if (!formData.bd) newErrors.bd = "Concerned BD is required";
    if (!formData.promoter) newErrors.promoter = "Engineer is required";
    if (!formData.priority) newErrors.priority = "Priority Sample is required";
    if (!formData.witness) newErrors.witness = "Witness Required is required";
    if (!formData.modeofreciept) newErrors.modeofreciept = "Mode of Receipt is required";

    if (formData.paymentstatus !== "2") {
      if (!formData.modeofpayment) newErrors.modeofpayment = "Mode of Payment is required";
      if (!formData.detailsofpayment) newErrors.detailsofpayment = "Payment Details are required";
      if (!formData.paymentamount || parseFloat(formData.paymentamount) <= 0)
        newErrors.paymentamount = "Valid Payment Amount is required";
    }

    if (!formData.certcollectionremark) newErrors.certcollectionremark = "Description is required";

    if (!formData.deadline) newErrors.deadline = "Deadline is required";

    return newErrors;
  };

  // ── Submit ───────────────────────────────────────────────────────────────────
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
      submitData.append("id", formData.id);

      Object.keys(formData).forEach((key) => {
        if (key === "id") return;
        if (key === "certcollectiondetail") {
          if (Array.isArray(formData[key]) && formData[key].length > 0) {
            formData[key].forEach((item) => { if (item) submitData.append(`${key}[]`, item); });
          }
        } else {
          if (formData[key] !== undefined && formData[key] !== null && formData[key] !== "") {
            submitData.append(key, formData[key]);
          }
        }
      });

      if (wuploadFile) submitData.append("wupload", wuploadFile);
      if (ruploadFile) submitData.append("rupload", ruploadFile);

      // Flags for removed files

      for (let [key, value] of submitData.entries()) console.log(`${key}:`, value);

      const response = await axios.post("/testing/update-trf-detail", submitData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (String(response.data.status) === "true" || String(response.data.status) === "1") {
        toast.success("TRF Entry Updated ✅");
        navigate("/dashboards/testing/trfs-starts-jobs");
      } else {
        toast.error(response.data.message || "Failed to update entry ❌");
      }
    } catch (error) {
      console.error("Error updating TRF entry:", error);
      toast.error(error?.response?.data?.message || "Something went wrong ❌");
    } finally {
      setLoading(false);
    }
  };

  // ── Inline error component ───────────────────────────────────────────────────
  const ErrMsg = ({ field }) =>
    errors[field] ? <p className="mt-1 text-sm text-red-500">{errors[field]}</p> : null;

  // ── Loading screen ───────────────────────────────────────────────────────────
  if (loadingOptions || loadingData) {
    return (
      <Page title="Edit TRF Entry">
        <div className="flex h-[60vh] items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">
              {loadingData ? "Loading TRF data..." : "Loading form options..."}
            </p>
          </div>
        </div>
      </Page>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <Page title={`Edit TRF Entry #${id}`}>
      <div className="transition-content w-full pb-5 px-[var(--margin-x)]">

        {/* Back link */}
        <div className="mb-4">
          <a
            href="/dashboards/testing/trfs-starts-jobs"
            className="text-blue-600 hover:text-blue-800 inline-flex items-center"
            onClick={(e) => { e.preventDefault(); navigate("/dashboards/testing/trfs-starts-jobs"); }}
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to TRF Entry List
          </a>
        </div>

        <Card className="mb-6">
          <div className="px-6 py-4 border-b flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800">Edit TRF Entry — ID: {id}</h3>
          </div>

          <form onSubmit={handleSubmit} className="p-6" encType="multipart/form-data">

            {/* ━━━━ 1. SERVICE REQUESTOR ━━━━ */}
            <h4 className="text-md font-semibold mb-4 text-gray-700 border-b pb-2">1. SERVICE REQUESTOR</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

              {/* Date */}
              <div ref={dateRef}>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date <span className="text-red-500">*</span></label>
                <Input type="date" name="date" value={dateInputs.date} onChange={handleDateChange} className="w-full" />
                <ErrMsg field="date" />
              </div>

              {/* Sample Received Date */}
              <div ref={sampleReceivedOnRef}>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sample Received Date <span className="text-red-500">*</span></label>
                <Input type="date" name="sample_received_on" value={dateInputs.sample_received_on} onChange={handleDateChange} className="w-full" />
                <ErrMsg field="sample_received_on" />
              </div>

              {/* Customer Type */}
              <div ref={ctypeRef}>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Type <span className="text-red-500">*</span></label>
                <FormSelect name="ctype" value={formData.ctype} onChange={handleInputChange} className="w-full">
                  <option value="">Select Customer Type</option>
                  {customerTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </FormSelect>
                <ErrMsg field="ctype" />
              </div>

              {/* Customer */}
              <div ref={customeridRef}>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer (Responsible For Payment) <span className="text-red-500">*</span></label>
                <FormSelect name="customerid" value={formData.customerid} onChange={handleCustomerChange} className="w-full">
                  <option value="">Select Customer</option>
                  {customers.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.pnumber || c.phone || "N/A"})</option>)}
                </FormSelect>
                <ErrMsg field="customerid" />
              </div>

              {/* Specific Purpose */}
              <div ref={specificpurposeRef}>
                <label className="block text-sm font-medium text-gray-700 mb-1">Specific Purpose <span className="text-red-500">*</span></label>
                <FormSelect name="specificpurpose" value={formData.specificpurpose} onChange={handleInputChange} className="w-full">
                  <option value="">Select Specific Purpose</option>
                  {specificPurposes.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </FormSelect>
                <ErrMsg field="specificpurpose" />
              </div>

              {/* Customer Reference */}
              <div className="md:col-span-2" ref={letterrefnoRef}>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Reference <span className="text-red-500">*</span></label>
                <Textarea name="letterrefno" value={formData.letterrefno} onChange={handleInputChange} className="w-full" rows={3} placeholder="Enter customer reference details" />
                <ErrMsg field="letterrefno" />
              </div>
            </div>

            {/* ━━━━ CUSTOMER DETAILS BLOCK ━━━━ */}
            {loadingCustomer && (
              <div className="flex items-center justify-center py-6 mb-6">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
                <span className="text-gray-600 text-sm">Loading customer details...</span>
              </div>
            )}

            {showCustomerDetails && !loadingCustomer && (
              <div className="mb-6 border border-gray-200 rounded-lg overflow-hidden">

                {/* Credit info */}
                {customerCredit && (
                  <div className="bg-blue-50 border-b border-blue-100 px-5 py-3">
                    <p className="text-sm font-medium text-blue-800 mb-1">Customer Credit</p>
                    <div className="flex flex-wrap gap-4 text-sm text-blue-700">
                      <span><span className="font-medium">Credit Period:</span> {customerCredit.creditdays} days</span>
                      <span><span className="font-medium">Credit Limit:</span> ₹ {customerCredit.creditamount}</span>
                      <span><span className="font-medium">Credit Left:</span> ₹ {customerCredit.leftamount}</span>
                    </div>
                  </div>
                )}

                {/* Customer's Reporting Detail */}
                <div className="px-5 py-5 border-b border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
                    Customer&apos;s Reporting Detail
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                    <div ref={reportnameRef}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name <span className="text-red-500">*</span></label>
                      <FormSelect name="reportname" value={formData.reportname} onChange={handleReportNameChange} className="w-full">
                        <option value="">Select Customer</option>
                        {customers.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.pnumber || c.phone || "N/A"})</option>)}
                      </FormSelect>
                      <ErrMsg field="reportname" />
                    </div>

                    <div ref={reportaddressRef}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Customer Address <span className="text-red-500">*</span></label>
                      <FormSelect
                        name="reportaddress"
                        value={formData.reportaddress}
                        onChange={handleInputChange}
                        className="w-full"
                        disabled={reportAddresses.length === 0}
                      >
                        <option value="">
                          {reportAddresses.length === 0 ? "No addresses found" : "Select Address"}
                        </option>
                        {reportAddresses.map((a) => (
                          <option key={a.id} value={a.id}>{a.name} ({a.address})</option>
                        ))}
                      </FormSelect>
                      <ErrMsg field="reportaddress" />
                    </div>
                  </div>
                </div>

                {/* Same as reporting button */}
                <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSameAsReporting}
                    className="text-sm text-blue-600 hover:text-blue-800 border border-blue-300 hover:border-blue-500 rounded px-3 py-1.5 transition-colors flex items-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Same as Reporting
                  </button>
                  <span className="text-xs text-gray-500">Click to copy reporting details to billing</span>
                </div>

                {/* Customer's Billing Detail */}
                <div className="px-5 py-5 border-b border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-500 inline-block"></span>
                    Customer&apos;s Billing Detail
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                    <div ref={billingnameRef}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name <span className="text-red-500">*</span></label>
                      <FormSelect name="billingname" value={formData.billingname} onChange={handleBillingNameChange} className="w-full">
                        <option value="">Select Customer</option>
                        {customers.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.pnumber || c.phone || "N/A"})</option>)}
                      </FormSelect>
                      <ErrMsg field="billingname" />
                    </div>

                    <div ref={billingaddressRef}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Customer Address <span className="text-red-500">*</span></label>
                      <FormSelect
                        name="billingaddress"
                        value={formData.billingaddress}
                        onChange={handleInputChange}
                        className="w-full"
                        disabled={billingAddresses.length === 0}
                      >
                        <option value="">
                          {billingAddresses.length === 0 ? "No addresses found" : "Select Address"}
                        </option>
                        {billingAddresses.map((a) => (
                          <option key={a.id} value={a.id}>{a.name} ({a.address})</option>
                        ))}
                      </FormSelect>
                      <ErrMsg field="billingaddress" />
                    </div>

                    <div className="md:col-span-2" ref={gstnoRef}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">GST Number <span className="text-red-500">*</span></label>
                      <Input type="text" name="gstno" value={formData.gstno} onChange={handleInputChange} className="w-full" placeholder="Enter GST number" maxLength={15} />
                      <ErrMsg field="gstno" />
                    </div>
                  </div>
                </div>

                {/* Concern Person */}
                <div className="px-5 py-5 border-b border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-500 inline-block"></span>
                    Concern Person Details
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                    <div ref={concernpersonnameRef}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Concern Person Name <span className="text-red-500">*</span></label>
                      <FormSelect name="concernpersonname" value={formData.concernpersonname} onChange={handleConcernPersonChange} className="w-full">
                        <option value="">Select Concern Person</option>
                        {concernPersons.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.mobile})</option>)}
                      </FormSelect>
                      <ErrMsg field="concernpersonname" />
                    </div>

                    {formData.concernpersonname && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
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
                          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
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
                          <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
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

                {/* Quotation */}
                <div className="px-5 py-5">
                  <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-yellow-500 inline-block"></span>
                    Quotation
                  </h4>
                  <div className="max-w-sm">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quotation No.</label>
                    <FormSelect name="quotationid" value={formData.quotationid} onChange={handleQuotationChange} className="w-full">
                      <option value="0">Select Quotation</option>
                      {quotations.map((q) => (
                        <option key={q.id} value={q.id}>{String(q.id).padStart(5, "0")} — {q.added_on}</option>
                      ))}
                    </FormSelect>
                  </div>
                </div>

              </div>
            )}

            {/* ━━━━ 2. WORK ORDER DETAILS ━━━━ */}
            <h4 className="text-md font-semibold mb-4 text-gray-700 border-b pb-2 mt-8">2. WORK ORDER DETAILS</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

              <div ref={ponumberRef}>
                <label className="block text-sm font-medium text-gray-700 mb-1">Work Order Number <span className="text-red-500">*</span></label>
                <Input list="workordersuggest" name="ponumber" value={formData.ponumber} onChange={handleInputChange} className="w-full" placeholder="Enter work order number" />
                <datalist id="workordersuggest">
                  {["TRF", "Telephonic", "Email", "Verble", "Letter", "Challan"].map((s) => <option key={s} value={s} />)}
                </datalist>
                <ErrMsg field="ponumber" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Work Order Upload</label>
                {existingWupload && (
                  <div className="mb-2 p-2 bg-blue-50 rounded flex items-center justify-between">
                    <span className="text-sm text-blue-700 truncate flex-1">📎 {existingWupload}</span>
                    <button type="button" onClick={() => removeExistingFile("wupload")} className="ml-2 text-red-500 hover:text-red-700">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
                <Input type="file" name="wupload" onChange={(e) => handleFileChange(e, "wupload")} className="w-full" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
                <p className="text-xs text-gray-500 mt-1">
                  {existingWupload ? "Upload new file to replace existing" : "Accepted: PDF, JPG, PNG, DOC, DOCX"}
                </p>
              </div>

              <div ref={bdRef}>
                <label className="block text-sm font-medium text-gray-700 mb-1">Concerned BD <span className="text-red-500">*</span></label>
                <FormSelect name="bd" value={formData.bd} onChange={handleInputChange} className="w-full">
                  <option value="">Select BD</option>
                  {bds.map((b) => <option key={b.id} value={b.id}>{b.firstname} {b.lastname}</option>)}
                </FormSelect>
                <ErrMsg field="bd" />
              </div>

              <div ref={promoterRef}>
                <label className="block text-sm font-medium text-gray-700 mb-1">Engineer <span className="text-red-500">*</span></label>
                <FormSelect name="promoter" value={formData.promoter} onChange={handleInputChange} className="w-full">
                  <option value="">Select Engineer</option>
                  {promoters.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </FormSelect>
                <ErrMsg field="promoter" />
              </div>

              <div ref={priorityRef}>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority Sample <span className="text-red-500">*</span></label>
                <FormSelect name="priority" value={formData.priority} onChange={handlePriorityChange} className="w-full">
                  <option value="">Select Priority</option>
                  {choices.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </FormSelect>
                <ErrMsg field="priority" />
              </div>

              {showPriorityCharges && (
                <>
                  <div ref={pchargesRef}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority Testing Charges</label>
                    <Input type="number" name="pcharges" value={formData.pcharges} onChange={handleInputChange} className="w-full" min="0" step="0.01" />
                    <ErrMsg field="pcharges" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Charge Type</label>
                    <FormSelect name="pchargestype" value={formData.pchargestype} onChange={handleInputChange} className="w-full">
                      <option value="1">₹ (Rupees)</option>
                      <option value="2">% (Percentage)</option>
                    </FormSelect>
                  </div>
                </>
              )}
            </div>

            {/* ━━━━ 3. WITNESS DETAILS ━━━━ */}
            <h4 className="text-md font-semibold mb-4 text-gray-700 border-b pb-2 mt-8">3. WITNESS DETAILS</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

              <div ref={witnessRef}>
                <label className="block text-sm font-medium text-gray-700 mb-1">Witness Required <span className="text-red-500">*</span></label>
                <FormSelect name="witness" value={formData.witness} onChange={handleWitnessChange} className="w-full">
                  <option value="">Select</option>
                  {choices.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </FormSelect>
                <ErrMsg field="witness" />
              </div>

              {showWitnessDetails && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Witness Date</label>
                    <Input type="date" name="wdatetime" value={dateInputs.wdatetime} onChange={handleDateChange} className="w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Witness Time</label>
                    <Input type="time" name="wtime" value={formData.wtime} onChange={handleInputChange} className="w-full" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Witness Details</label>
                    <Input type="text" name="wdetail" value={formData.wdetail} onChange={handleInputChange} className="w-full" placeholder="Names of persons" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Witness Charges</label>
                    <Input type="number" name="wcharges" value={formData.wcharges} onChange={handleInputChange} className="w-full" min="0" step="0.01" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Charge Type</label>
                    <FormSelect name="wchargestype" value={formData.wchargestype} onChange={handleInputChange} className="w-full">
                      <option value="1">₹ (Rupees)</option>
                      <option value="2">% (Percentage)</option>
                    </FormSelect>
                  </div>
                </>
              )}
            </div>

            {/* ━━━━ 4. MODE OF RECEIPT ━━━━ */}
            <h4 className="text-md font-semibold mb-4 text-gray-700 border-b pb-2 mt-8">4. MODE OF RECEIPT</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

              <div ref={modeofrecieptRef}>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mode Of Receipt <span className="text-red-500">*</span></label>
                <FormSelect name="modeofreciept" value={formData.modeofreciept} onChange={handleModeOfReceiptChange} className="w-full">
                  <option value="">Select Mode of Receipt</option>
                  {modesOfReceipt.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </FormSelect>
                <ErrMsg field="modeofreciept" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Local Contact of Courier/Cargo/Person Name</label>
                <Input type="text" name="localcontact" value={formData.localcontact} onChange={handleInputChange} className="w-full" placeholder="Enter local contact name" />
              </div>

              {showCourierDetails && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Courier/Cargo/Transport</label>
                    <Input type="text" name="couriername" value={formData.couriername} onChange={handleInputChange} className="w-full" placeholder="Enter courier name" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date Of Dispatch</label>
                    <Input type="date" name="dateofdispatch" value={dateInputs.dateofdispatch} onChange={handleDateChange} className="w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Docket/Airway Bill Number</label>
                    <Input type="text" name="docketno" value={formData.docketno} onChange={handleInputChange} className="w-full" placeholder="Enter docket number" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Receipt Document Upload</label>
                    {existingRupload && (
                      <div className="mb-2 p-2 bg-blue-50 rounded flex items-center justify-between">
                        <span className="text-sm text-blue-700 truncate flex-1">📎 {existingRupload}</span>
                        <button type="button" onClick={() => removeExistingFile("rupload")} className="ml-2 text-red-500 hover:text-red-700">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    )}
                    <Input type="file" name="rupload" onChange={(e) => handleFileChange(e, "rupload")} className="w-full" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
                    <p className="text-xs text-gray-500 mt-1">
                      {existingRupload ? "Upload new file to replace existing" : "Upload receipt/delivery proof"}
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* ━━━━ 5. MODE OF PAYMENT ━━━━ */}
            <h4 className="text-md font-semibold mb-4 text-gray-700 border-b pb-2 mt-8">5. MODE OF PAYMENT</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

              <div ref={paymentstatusRef}>
                <label className="block text-sm font-medium text-gray-700 mb-1">Is Payment Done? <span className="text-red-500">*</span></label>
                <FormSelect name="paymentstatus" value={formData.paymentstatus} onChange={handlePaymentStatusChange} className="w-full">
                  <option value="">Select Payment Status</option>
                  {choices.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </FormSelect>
                <ErrMsg field="paymentstatus" />
              </div>

              {showPaymentDetails && (
                <>
                  <div ref={modeofpaymentRef}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mode Of Payment <span className="text-red-500">*</span></label>
                    <FormSelect name="modeofpayment" value={formData.modeofpayment} onChange={handleInputChange} className="w-full">
                      <option value="">Select Mode of Payment</option>
                      {paymentModes.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </FormSelect>
                    <ErrMsg field="modeofpayment" />
                  </div>

                  <div ref={detailsofpaymentRef}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Details <span className="text-red-500">*</span></label>
                    <Input type="text" name="detailsofpayment" value={formData.detailsofpayment} onChange={handleInputChange} className="w-full" placeholder="e.g., Bank transfer, Cheque number" />
                    <ErrMsg field="detailsofpayment" />
                  </div>

                  <div ref={paymentamountRef}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount <span className="text-red-500">*</span></label>
                    <Input type="number" name="paymentamount" value={formData.paymentamount} onChange={handleInputChange} className="w-full" min="0" step="0.01" placeholder="Enter amount" />
                    <ErrMsg field="paymentamount" />
                  </div>
                </>
              )}
            </div>

            {/* ━━━━ 6. CERTIFICATE COLLECTION DETAILS ━━━━ */}
            <h4 className="text-md font-semibold mb-4 text-gray-700 border-b pb-2 mt-8">6. CERTIFICATE COLLECTION DETAILS (Please tick)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Certificate Collect As</label>
                <ReactSelect
                  isMulti
                  options={certCollectionDetails.map((d) => ({ value: d.id, label: d.name }))}
                  value={certCollectionDetails
                    .filter((d) => formData.certcollectiondetail.map(String).includes(String(d.id)))
                    .map((d) => ({ value: d.id, label: d.name }))}
                  onChange={(selected) => handleReactSelectChange(selected, "certcollectiondetail")}
                  styles={customSelectStyles}
                  placeholder="Select certificate collection methods..."
                  isClearable
                  isSearchable
                />
                <p className="text-xs text-gray-500 mt-1">Select multiple certificate collection methods</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Email IDs</label>
                <Textarea name="additionalemail" value={formData.additionalemail} onChange={handleInputChange} className="w-full" rows={3} placeholder="Enter comma-separated additional emails" />
                {customerEmail && (
                  <p className="text-sm text-gray-600 mt-2">Customer Email: <span className="font-medium">{customerEmail}</span></p>
                )}
              </div>

              <div className="md:col-span-2" ref={certcollectionremarkRef}>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-red-500">*</span></label>
                <Input type="text" name="certcollectionremark" value={formData.certcollectionremark} onChange={handleInputChange} className="w-full" placeholder="Enter description" />
                <ErrMsg field="certcollectionremark" />
              </div>
            </div>

            {/* ━━━━ 7. SPECIAL INSTRUCTIONS ━━━━ */}
            <h4 className="text-md font-semibold mb-4 text-gray-700 border-b pb-2 mt-8">7. SPECIAL INSTRUCTIONS</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Any Returnable Items</label>
                <FormSelect name="returnable" value={formData.returnable} onChange={handleInputChange} className="w-full">
                  <option value="">Select</option>
                  {choices.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </FormSelect>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Documents Submitted, if any (Details)</label>
                <Input type="text" name="documents" value={formData.documents} onChange={handleInputChange} className="w-full" placeholder="Enter document details" />
              </div>
              <div ref={deadlineRef}>
                <label className="block text-sm font-medium text-gray-700 mb-1">Any Deadline <span className="text-red-500">*</span></label>
                <Input type="date" name="deadline" value={dateInputs.deadline} onChange={handleDateChange} className="w-full" />
                <ErrMsg field="deadline" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Any Special Request</label>
                <Textarea name="specialrequest" value={formData.specialrequest} onChange={handleInputChange} className="w-full" rows={3} placeholder="Enter any special requests" />
              </div>
            </div>

            {/* ━━━━ 8. NOTES ━━━━ */}
            <h4 className="text-md font-semibold mb-4 text-gray-700 border-b pb-2 mt-8">8. NOTES</h4>
            <div className="mb-6">
              <Textarea name="notes" value={formData.notes} onChange={handleInputChange} className="w-full" rows={4} placeholder="Enter any additional notes or remarks" />
            </div>

            {/* Submit */}
            <div className="flex justify-end space-x-4 mt-8 pt-6 border-t">
              <Button type="button" variant="outlined" onClick={() => navigate("/dashboards/testing/trfs-starts-jobs")} className="px-6">
                Cancel
              </Button>
              <Button type="submit" color="primary" disabled={loading} className="px-6">
                {loading ? (
                  <><span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>Updating...</>
                ) : (
                  "Update TRF Entry"
                )}
              </Button>
            </div>

          </form>
        </Card>
      </div>
    </Page>
  );
}