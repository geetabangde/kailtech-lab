import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router";
import axios from "utils/axios";
import { toast } from "sonner";
import { Input, Button } from "components/ui";
import { Page } from "components/shared/Page";
import ReactSelect from "react-select";

export default function EditInwardEntry() {
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const caliblocation = searchParams.get("caliblocation") || "";
  const calibacc = searchParams.get("calibacc") || "";
  const { id } = useParams();

  // Create refs for all required fields
  const inwarddateRef = useRef(null);
  const sampleReceivedOnRef = useRef(null);
  const ctypeRef = useRef(null);
  const customeridRef = useRef(null);
  const specificpurposeRef = useRef(null);
  const reportnameRef = useRef(null);
  const reportaddressRef = useRef(null);
  const billingnameRef = useRef(null);
  const billingaddressRef = useRef(null);
  const concernpersonnameRef = useRef(null);
  const certcollectionremarkRef = useRef(null);
  const modeofdispatchRef = useRef(null);
  const notesRef = useRef(null);
  const additionalemailRef = useRef(null);
  const specialrequestRef = useRef(null);
  const modeofrecieptRef = useRef(null);
  const ponumberRef = useRef(null);
  const pchargesRef = useRef(null);
  const bdRef = useRef(null);
  const promoterRef = useRef(null);
  const priorityRef = useRef(null);
  const approvalRef = useRef(null);

  const [formData, setFormData] = useState({
    inwarddate: "",
    sample_received_on: "",
    ctype: "",
    customerid: "",
    specificpurpose: "",
    reportname: "",
    reportaddress: "",
    billingname: "",
    billingaddress: "",
    concernpersonname: "",
    concernpersondesignation: "",
    concernpersonmobile: "",
    concernpersonemail: "",
    quotationid: "",
    bd: "",
    promoter: "",
    priority: "",
    approval: "",
    pcharges: "",
    pchargestype: "",
    ponumber: "",
    wupload: null,
    wstatus: null,
    modeofreciept: "",
    couriernamerec: "",
    dateofdispatchrec: "",
    docketnorec: "",
    localcontactrec: "",
    rupload: null,
    modeofdispatch: "",
    couriername: "",
    dateofdispatch: "",
    docketno: "",
    localcontact: "",
    paymentstatus: "2",
    modeofpayment: "",
    detailsofpayment: "",
    paymentamount: "",
    certcollectiondetail: "",
    additionalemail: "",
    certcollectionremark: "",
    documents: "",
    deadline: "",
    specialrequest: "",
    notes: "",
    nablrequired: "Yes",
    calibacc: "Nabl",
    instrumentlocation: "Lab",
    caliblocation: "Lab",
    customername: "",
    customeraddress: "",
    gstno: "",
  });

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errors, setErrors] = useState({});
  const [certificateOptions, setCertificateOptions] = useState([]);
  const [customerTypeOptions, setCustomerTypeOptions] = useState([]);
  const [specificPurposeOptions, setSpecificPurposeOptions] = useState([]);
  const [customerOptions, setCustomerOptions] = useState([]);
  const [reportAddressOptions, setReportAddressOptions] = useState([]);
  const [billingAddressOptions, setBillingAddressOptions] = useState([]);
  const [quotationOptions, setQuotationOptions] = useState([]);
  const [modeOptions, setModeOptions] = useState([]);
  const [modepaymnetOptions, setModePaymentOptions] = useState([]);
  const [bdOptions, setBdOptions] = useState([]);
  const [promoterOptions, setPromoterOptions] = useState([]);
  const [approvedByOptions, setApprovedByOptions] = useState([]);
  const [choiceOptions, setChoiceOptions] = useState([]);
  const [concernPersonOptions, setConcernPersonOptions] = useState([]);
  const [selectedConcernPerson, setSelectedConcernPerson] = useState({
    designation: "",
    email: "",
    mobile: "",
  });
  const [creditInfo, setCreditInfo] = useState({ days: 0, amount: 0 });
  const [loading, setLoading] = useState(false);
  const isTransportMode = formData.modeofreciept !== "1";
  const isTransportDispatchMode = formData.modeofdispatch !== "BY Hand";

  // Function to scroll to the first error field
  const scrollToFirstError = () => {
    const errorFields = [
      { field: "inwarddate", ref: inwarddateRef },
      { field: "sample_received_on", ref: sampleReceivedOnRef },
      { field: "ctype", ref: ctypeRef },
      { field: "customerid", ref: customeridRef },
      { field: "specificpurpose", ref: specificpurposeRef },
      { field: "reportname", ref: reportnameRef },
      { field: "reportaddress", ref: reportaddressRef },
      { field: "billingname", ref: billingnameRef },
      { field: "billingaddress", ref: billingaddressRef },
      { field: "concernpersonname", ref: concernpersonnameRef },
      { field: "certcollectionremark", ref: certcollectionremarkRef },
      { field: "modeofdispatch", ref: modeofdispatchRef },
      { field: "notes", ref: notesRef },
      { field: "additionalemail", ref: additionalemailRef },
      { field: "specialrequest", ref: specialrequestRef },
      { field: "modeofreciept", ref: modeofrecieptRef },
      { field: "ponumber", ref: ponumberRef },
      { field: "pcharges", ref: pchargesRef },
      { field: "bd", ref: bdRef },
      { field: "promoter", ref: promoterRef },
      { field: "priority", ref: priorityRef },
      { field: "approval", ref: approvalRef },
    ];

    for (const errorField of errorFields) {
      if (errors[errorField.field] && errorField.ref.current) {
        errorField.ref.current.scrollIntoView({
          behavior: "smooth",
          block: "center"
        });
        errorField.ref.current.focus();
        break;
      }
    }
  };

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      scrollToFirstError();
    }
  }, [errors]);

  const handleOkClick = () => {
    setShowSuccessModal(false);
    navigate(
      `/dashboards/calibration-process/inward-entry-lab/add-inward-item/${id}?caliblocation=${encodeURIComponent(
        caliblocation
      )}&calibacc=${encodeURIComponent(calibacc)}`
    );
  };

  function convertToInputDateFormat(dateStr) {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length !== 3) return "";
    const [day, month, year] = parts;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const [
          typeRes,
          purposeRes,
          customerRes,
          bdRes,
          promoterRes,
          choiceRes,
          approvedRes,
          modeRes,
          paymentmodeRes,
          setCertificateRes,
        ] = await Promise.all([
          axios.get("/people/get-customer-type-list"),
          axios.get("/people/get-specific-purpose-list"),
          axios.get("/people/get-all-customers"),
          axios.get("/people/get-customer-bd"),
          axios.get("/people/list-promoters"),
          axios.get("/get-choices"),
          axios.get("/approved-by"),
          axios.get("/mode-of-receipt"),
          axios.get("/mode-of-payment"),
          axios.get("/certificate-collect-as"),
        ]);

        setCustomerTypeOptions(
          (typeRes?.data?.Data || []).map((item) => ({
            label: item.name,
            value: item.id,
          }))
        );

        setSpecificPurposeOptions(
          (purposeRes?.data?.data || []).map((item) => ({
            label: item.name,
            value: item.id,
          }))
        );

        setCustomerOptions(
          (customerRes?.data?.data || []).map((item) => ({
            label: `${item.name} (${item.mobile})`,
            value: item.id,
            creditdays: item.creditdays,
            creditamount: item.creditamount,
            customername: item.name,
            customeraddress: "nothing",
            gstno: item.gstno || "",
          }))
        );

        setBdOptions(
          (bdRes?.data?.data || []).map((item) => ({
            label: `${item.firstname} ${item.lastname}`,
            value: item.id,
          }))
        );

        setPromoterOptions(
          (promoterRes?.data?.data || []).map((item) => ({
            label: `${item.name}`,
            value: item.id,
          }))
        );

        setChoiceOptions(
          (choiceRes?.data?.data || []).map((item) => ({
            label: item.name,
            value: item.id,
          }))
        );

        setApprovedByOptions(
          (approvedRes?.data?.data || []).map((item) => ({
            label: `${item.firstname} ${item.lastname}`,
            value: item.id,
          }))
        );

        setModeOptions(
          (modeRes?.data?.data || []).map((item) => ({
            label: item.name,
            value: item.id,
          }))
        );

        setModePaymentOptions(
          (paymentmodeRes?.data?.data || []).map((item) => ({
            label: item.name,
            value: item.id,
          }))
        );

        setCertificateOptions(
          (setCertificateRes?.data?.data || []).map((item) => ({
            label: item.name,
            value: item.id,
          }))
        );
      } catch (error) {
        toast.error("Error loading dropdowns");
        console.error(error);
      }
    };

    const fetchInwardEntry = async () => {
      try {
        const res = await axios.get(
          `/calibrationprocess/get-inward-entry_byid/${id}`
        );
        const data = res.data.data;
        setFormData({
          inwarddate: data.inwarddate
            ? data.inwarddate.split("-").reverse().join("-")
            : "",
          sample_received_on: data.sample_received_on
            ? data.sample_received_on.split("-").reverse().join("-")
            : "",
          deadline: data.deadline
            ? data.deadline.split("-").reverse().join("-")
            : "",
          ctype: String(data.ctype),
          customerid: String(data.customerid),
          specificpurpose: String(data.specificpurpose),
          reportname: data.reportname ? String(data.reportname) : "",
          reportaddress: data.reportaddress ? String(data.reportaddress) : "",
          billingname: data.billingname ? String(data.billingname) : "",
          billingaddress: data.billingaddress ? String(data.billingaddress) : "",
          customername: data.customername,
          customeraddress: data.customeraddress,
          gstno: data.gstno,
          concernpersonname: String(data.concernpersonname),
          quotationid: String(data.quotationid),
          bd: String(data.bd),
          promoter: String(data.promoter),
          priority: String(data.priority),
          approval: String(data.approval),
          pcharges: String(data.pcharges),
          pchargestype: data.pchargestype === 1 ? "₹" : "%",
          ponumber: data.ponumber,
          wupload: null,
          modeofreciept: String(data.modeofreciept),
          couriernamerec: data.couriernamerec,
          dateofdispatchrec: data.dateofdispatchrec
            ? data.dateofdispatchrec.split("-").reverse().join("-")
            : "",
          docketnorec: data.docketnorec,
          localcontactrec: data.localcontactrec,
          rupload: null,
          modeofdispatch: String(data.modeofdispatch),
          couriername: data.couriername,
          dateofdispatch: data.dateofdispatch
            ? data.dateofdispatch.split("-").reverse().join("-")
            : "",
          docketno: data.docketno,
          localcontact: data.localcontact,
          paymentstatus: String(data.paymentstatus),
          modeofpayment: String(data.modeofpayment),
          detailsofpayment: data.detailsofpayment,
          paymentamount: String(data.paymentamount),
          certcollectiondetail: data.certcollectiondetail,
          additionalemail: data.additionalemail,
          certcollectionremark: data.certcollectionremark,
          documents: data.documents,
          specialrequest: data.specialrequest,
          notes: data.notes,
          nablrequired: data.nablrequired,
          calibacc: data.calibacc || "Nabl",
          caliblocation: data.caliblocation || "Lab",
          creditdays: data.creditdays,
          creditamount: data.creditamount,
        });
        setCreditInfo({
          days: data.creditdays || 0,
          amount: data.creditamount || 0,
        });
        setSelectedConcernPerson({
          designation: data.concernpersondesignation,
          email: data.concernpersonemail,
          mobile: data.concernpersonmobile,
        });
        fetchConcernPersons(data.customerid);
        fetchQuotations(data.customerid);
        fetchCustomerAddresses(data.reportname, "report");
        fetchCustomerAddresses(data.billingname, "billing");
      } catch (error) {
        toast.error("Error loading inward entry");
        console.error(error);
      }
    };

    fetchDropdowns();
    fetchInwardEntry();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const dateFields = [
      "inwarddate",
      "sample_received_on",
      "dateofdispatchrec",
      "dateofdispatch",
      "deadline",
    ];

    if (dateFields.includes(name) && value) {
      const [year, month, day] = value.split("-");
      const formattedDate = `${day}-${month}-${year}`;
      setFormData((prev) => ({
        ...prev,
        [name]: formattedDate,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
    // Clear error when user starts typing
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSelectChange = (option, name) => {
    setFormData((prev) => ({ ...prev, [name]: option?.value || "" }));
    setErrors((prev) => ({ ...prev, [name]: "" }));

    if (name === "customerid" && option) {
      setCreditInfo({
        days: option.creditdays || 0,
        amount: option.creditamount || 0,
      });

      setFormData((prev) => ({
        ...prev,
        gstno: option.gstno || "",
        customername: option.customername,
        customeraddress: option.customeraddress,
      }));

      fetchConcernPersons(option.value);
      fetchQuotations(option.value);
    }

    if (name === "reportname" && option?.value) {
      fetchCustomerAddresses(option.value, "report");
    }

    if (name === "billingname" && option?.value) {
      fetchCustomerAddresses(option.value, "billing");
    }

    if ((name === "reportname" || name === "billingname") && !option) {
      if (name === "reportname") {
        setReportAddressOptions([]);
        setFormData((prev) => ({ ...prev, reportaddress: "" }));
      } else {
        setBillingAddressOptions([]);
        setFormData((prev) => ({ ...prev, billingaddress: "" }));
      }
    }

    if (name === "customerid" && !option) {
      setConcernPersonOptions([]);
      setFormData((prev) => ({ ...prev, concernpersonname: "" }));
      setSelectedConcernPerson({ designation: "", email: "", mobile: "" });
    }

    if (name === "concernpersonname" && option) {
      fetchConcernPersonDetails(option.value);
    }
  };

  const fetchCustomerAddresses = async (customerId, type) => {
    try {
      const res = await axios.get(`/people/get-customers-address/${customerId}`);
      const addresses = res?.data?.data || [];
      const options = addresses.map((item) => ({
        label: `${item.name}, ${item.address}, ${item.city} - ${item.pincode}`,
        value: item.id,
      }));
      if (type === "report") setReportAddressOptions(options);
      if (type === "billing") setBillingAddressOptions(options);
    } catch (err) {
      toast.error("Failed to fetch customer addresses");
      console.error(err);
    }
  };

  const fetchConcernPersons = async (customerId) => {
    try {
      const res = await axios.get(`/get-concern-person/${customerId}`);
      const list = res?.data?.data || [];
      setConcernPersonOptions(
        list.map((item) => ({
          label: item.name,
          value: item.id,
          designation: item.designation,
          email: item.email,
          mobile: item.mobile,
        }))
      );
    } catch (err) {
      toast.error("Failed to fetch concern persons");
      console.error(err);
    }
  };

  const fetchConcernPersonDetails = async (personId) => {
    try {
      const res = await axios.get(`/get-concern-person-details/${personId}`);
      const data = res?.data?.data;

      if (data) {
        setSelectedConcernPerson({
          designation: data.designation || "",
          email: data.email || "",
          mobile: data.mobile || "",
        });

        setFormData((prev) => ({
          ...prev,
          concernpersondesignation: data.designation || "",
          concernpersonemail: data.email || "",
          concernpersonmobile: data.mobile || "",
        }));
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        toast.error(err.response.data.message);
        console.error("Backend Error:", err.response.data);
      } else {
        toast.error("Something went wrong!");
        console.error("Unknown Error:", err);
      }
    }
  };

  const fetchQuotations = async (customerId) => {
    try {
      const res = await axios.get(`/get-quotaion/${customerId}`);
      const data = res?.data?.data || [];

      setQuotationOptions(
        data.map((item) => ({
          label: `${String(item.id).padStart(5, "0")}`,
          value: item.id,
        }))
      );
    } catch (err) {
      toast.error("Failed to fetch quotations");
      console.error(err);
    }
  };

  const handleSameAsReporting = () => {
    setFormData((prev) => ({
      ...prev,
      billingname: prev.reportname,
      billingaddress: prev.reportaddress,
    }));
    setBillingAddressOptions(reportAddressOptions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const newErrors = {};

    if (!formData.inwarddate) newErrors.inwarddate = "Date is required";
    if (!formData.sample_received_on)
      newErrors.sample_received_on = "Sample Received On Date is required";
    if (!formData.ctype) newErrors.ctype = "Customer type is required";
    if (!formData.customerid) newErrors.customerid = "Customer is required";
    if (!formData.specificpurpose)
      newErrors.specificpurpose = "Purpose is required";
    if (!formData.bd) newErrors.bd = "BD is required";
    if (!formData.promoter) newErrors.promoter = "Sales Promoter is required";
    if (!formData.priority) newErrors.priority = "Priority is required";
    if (!formData.approval) newErrors.approval = "Approved By is required";
    if (!formData.reportname) newErrors.reportname = "Report Name is required";
    if (!formData.reportaddress)
      newErrors.reportaddress = "Report Address is required";
    if (!formData.billingname)
      newErrors.billingname = "Billing Name is required";
    if (!formData.billingaddress)
      newErrors.billingaddress = "Billing Address is required";
    if (!formData.concernpersonname)
      newErrors.concernpersonname = "Concern Person Name is required";
    if (!formData.certcollectionremark)
      newErrors.certcollectionremark = "Description is required";
    if (!formData.modeofdispatch)
      newErrors.modeofdispatch = "Mode of dispatch is required";
    if (!formData.notes) newErrors.notes = "Notes is required";
    if (!formData.additionalemail)
      newErrors.additionalemail = "Additional Email Ids is required";
    if (!formData.specialrequest)
      newErrors.specialrequest = "Any Special request is required";
    if (!formData.modeofreciept)
      newErrors.modeofreciept = "Mode Of Receipt is required";
    if (!formData.ponumber) newErrors.ponumber = "Work Order No is required";
    if (!formData.pcharges)
      newErrors.pcharges = "Priority Testing Charges is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    setErrors({});

    try {
      const form = new FormData();

      for (const key in formData) {
        if (formData[key] !== null && formData[key] !== undefined) {
          form.append(key, formData[key]);
        }
      }

      const res = await axios.post(
        `/calibrationprocess/update-inward-entry/${id}`,
        form
      );

      if (String(res.data.status) === "true" || String(res.data.status) === "1") {
        toast.success("Inward Entry Updated ✅");
        setSuccessMessage(res.data.message || "Inward Entry Updated");
        setShowSuccessModal(true);
      } else {
        toast.error(res.data.message || "Failed to update entry ❌");
      }
    } catch (err) {
      console.error("Error updating inward entry:", err);
      toast.error(err?.response?.data?.message || "Something went wrong ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page title="Edit Inward Entry">
      <div className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Edit Inward Entry - Lab</h2>
          <Button
            variant="outline"
            className="text-white bg-blue-600 hover:bg-blue-700"
            onClick={() =>
              navigate(
                `/dashboards/calibration-process/inward-entry-lab?caliblocation=${encodeURIComponent(
                  caliblocation
                )}&calibacc=${encodeURIComponent(calibacc)}`
              )
            }
          >
            Back to Inward Entry List
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* SERVICE REQUESTOR SECTION */}
          <div className="rounded-lg border p-4">
            <h3 className="mb-4 text-lg font-semibold">SERVICE REQUESTOR</h3>

            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div ref={inwarddateRef}>
                  <Input
                    label="Date"
                    name="inwarddate"
                    type="date"
                    value={
                      formData.inwarddate
                        ? convertToInputDateFormat(formData.inwarddate)
                        : ""
                    }
                    onChange={handleChange}
                  />
                  {errors.inwarddate && (
                    <p className="mt-1 text-sm text-red-500">{errors.inwarddate}</p>
                  )}
                </div>

                <div ref={sampleReceivedOnRef}>
                  <Input
                    label="Sample Received Date"
                    name="sample_received_on"
                    type="date"
                    value={
                      formData.sample_received_on
                        ? convertToInputDateFormat(formData.sample_received_on)
                        : ""
                    }
                    onChange={handleChange}
                  />
                  {errors.sample_received_on && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.sample_received_on}
                    </p>
                  )}
                </div>

                <div ref={ctypeRef}>
                  <label className="block text-sm font-medium">Customer Type</label>
                  <ReactSelect
                    name="ctype"
                    options={customerTypeOptions}
                    value={
                      customerTypeOptions.find(
                        (opt) => opt.value === Number(formData.ctype)
                      ) || null
                    }
                    onChange={(option) => handleSelectChange(option, "ctype")}
                    placeholder="Select Customer Type"
                  />
                  {errors.ctype && (
                    <p className="mt-1 text-sm text-red-500">{errors.ctype}</p>
                  )}
                </div>

                <div ref={customeridRef}>
                  <label className="block text-sm font-medium">Customer</label>
                  <ReactSelect
                    name="customerid"
                    options={customerOptions}
                    value={
                      customerOptions.find(
                        (opt) => opt.value === Number(formData.customerid)
                      ) || null
                    }
                    onChange={(option) => handleSelectChange(option, "customerid")}
                    placeholder="Select Customer"
                  />
                  {errors.customerid && (
                    <p className="mt-1 text-sm text-red-500">{errors.customerid}</p>
                  )}
                </div>

                <div ref={specificpurposeRef}>
                  <label className="block text-sm font-medium">
                    Specific Purpose
                  </label>
                  <ReactSelect
                    name="specificpurpose"
                    options={specificPurposeOptions}
                    value={
                      specificPurposeOptions.find(
                        (opt) => opt.value === Number(formData.specificpurpose)
                      ) || null
                    }
                    onChange={(option) =>
                      handleSelectChange(option, "specificpurpose")
                    }
                    placeholder="Select Purpose"
                  />
                  {errors.specificpurpose && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.specificpurpose}
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-sm font-medium">
                    <strong>Customer Credit:</strong> {creditInfo.days} Days | ₹{" "}
                    {creditInfo.amount}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CUSTOMER'S REPORTING DETAILS SECTION */}
          <div className="rounded-lg border p-4">
            <h3 className="mb-4 text-lg font-semibold">Customers Reporting Detail</h3>

            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div ref={reportnameRef}>
                  <label className="block text-sm font-medium">
                    Customer Name
                  </label>
                  <ReactSelect
                    name="reportname"
                    options={customerOptions}
                    value={
                      customerOptions.find(
                        (opt) => opt.value === Number(formData.reportname)
                      ) || null
                    }
                    onChange={(option) =>
                      handleSelectChange(option, "reportname")
                    }
                    placeholder="Select Customer"
                  />
                  {errors.reportname && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.reportname}
                    </p>
                  )}
                </div>

                <div ref={reportaddressRef}>
                  <label className="block text-sm font-medium">
                    Customer Address
                  </label>
                  <ReactSelect
                    name="reportaddress"
                    options={reportAddressOptions}
                    value={
                      reportAddressOptions.find(
                        (opt) => opt.value === Number(formData.reportaddress)
                      ) || null
                    }
                    onChange={(option) =>
                      setFormData((prev) => ({
                        ...prev,
                        reportaddress: option?.value || "",
                      }))
                    }
                    placeholder="Select Address"
                    isDisabled={reportAddressOptions.length === 0}
                  />
                  {errors.reportaddress && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.reportaddress}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* CUSTOMER'S BILLING DETAILS SECTION */}
          <div className="rounded-lg border p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Customers Billing Detail</h3>
              <button
                type="button"
                className="text-sm text-blue-600 underline"
                onClick={handleSameAsReporting}
              >
                Same as reporting
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div ref={billingnameRef}>
                  <label className="block text-sm font-medium">
                    Customer Name
                  </label>
                  <ReactSelect
                    name="billingname"
                    options={customerOptions}
                    value={
                      customerOptions.find(
                        (opt) => opt.value === Number(formData.billingname)
                      ) || null
                    }
                    onChange={(option) =>
                      handleSelectChange(option, "billingname")
                    }
                    placeholder="Select Customer"
                  />
                  {errors.billingname && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.billingname}
                    </p>
                  )}
                </div>

                <div ref={billingaddressRef}>
                  <label className="block text-sm font-medium">
                    Customer Address
                  </label>
                  <ReactSelect
                    name="billingaddress"
                    options={billingAddressOptions}
                    value={
                      billingAddressOptions.find(
                        (opt) => opt.value === Number(formData.billingaddress)
                      ) || null
                    }
                    onChange={(option) =>
                      setFormData((prev) => ({
                        ...prev,
                        billingaddress: option?.value || "",
                      }))
                    }
                    placeholder="Select Address"
                    isDisabled={billingAddressOptions.length === 0}
                  />
                  {errors.billingaddress && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.billingaddress}
                    </p>
                  )}
                </div>

                <div>
                  <Input
                    label="GST No"
                    name="gstno"
                    value={formData.gstno}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* CONCERN PERSON SECTION */}
          <div className="rounded-lg border p-4">
            <h3 className="mb-4 text-lg font-semibold">Concern Person</h3>

            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div ref={concernpersonnameRef}>
                  <label className="block text-sm font-medium">
                    Concern Person Name
                  </label>
                  <ReactSelect
                    name="concernpersonname"
                    options={concernPersonOptions}
                    value={
                      concernPersonOptions.find(
                        (opt) => opt.value === Number(formData.concernpersonname)
                      ) || null
                    }
                    onChange={(option) =>
                      handleSelectChange(option, "concernpersonname")
                    }
                    placeholder="Select Concern Person"
                  />
                  {errors.concernpersonname && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.concernpersonname}
                    </p>
                  )}
                </div>

                {formData.concernpersonname && (
                  <>
                    <Input
                      label="Concern Person Designation"
                      name="concernpersondesignation"
                      value={selectedConcernPerson.designation}
                      disabled
                    />
                    <Input
                      label="Concern Person Email"
                      name="concernpersonemail"
                      value={selectedConcernPerson.email}
                      disabled
                    />
                    <Input
                      label="Concern Person Mobile"
                      name="concernpersonmobile"
                      value={selectedConcernPerson.mobile}
                      disabled
                    />
                  </>
                )}
              </div>
            </div>
          </div>

          {/* QUOTATION AND BD DETAILS SECTION */}
          <div className="rounded-lg border p-4">
            <h3 className="mb-4 text-lg font-semibold">Quotation and BD Details</h3>

            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium">Quotation No</label>
                  <ReactSelect
                    name="quotationid"
                    options={quotationOptions}
                    value={
                      quotationOptions.find(
                        (opt) => opt.value === Number(formData.quotationid)
                      ) || null
                    }
                    onChange={(option) =>
                      setFormData((prev) => ({
                        ...prev,
                        quotationid: option?.value || "",
                      }))
                    }
                    placeholder="Select Quotation"
                    isDisabled={quotationOptions.length === 0}
                  />
                </div>

                <div ref={bdRef}>
                  <label className="block text-sm font-medium">Concerned BD</label>
                  <ReactSelect
                    name="bd"
                    options={bdOptions}
                    value={
                      bdOptions.find((opt) => opt.value === Number(formData.bd)) || null
                    }
                    onChange={(option) =>
                      setFormData((prev) => ({
                        ...prev,
                        bd: option?.value || "",
                      }))
                    }
                    placeholder="Select BD"
                    isDisabled={bdOptions.length === 0}
                  />
                  {errors.bd && (
                    <p className="mt-1 text-sm text-red-500">{errors.bd}</p>
                  )}
                </div>

                <div ref={promoterRef}>
                  <label className="block text-sm font-medium">
                    Sales Promoter
                  </label>
                  <ReactSelect
                    name="promoter"
                    options={promoterOptions}
                    value={
                      promoterOptions.find(
                        (opt) => opt.value === Number(formData.promoter)
                      ) || null
                    }
                    onChange={(option) =>
                      setFormData((prev) => ({
                        ...prev,
                        promoter: option?.value || "",
                      }))
                    }
                    placeholder="Select Promoter"
                    isDisabled={promoterOptions.length === 0}
                  />
                  {errors.promoter && (
                    <p className="mt-1 text-sm text-red-500">{errors.promoter}</p>
                  )}
                </div>

                <div ref={priorityRef}>
                  <label className="block text-sm font-medium">
                    Priority Sample
                  </label>
                  <ReactSelect
                    name="priority"
                    options={choiceOptions}
                    value={
                      choiceOptions.find(
                        (opt) => opt.value === Number(formData.priority)
                      ) || null
                    }
                    onChange={(option) =>
                      setFormData((prev) => ({
                        ...prev,
                        priority: option?.value || "",
                      }))
                    }
                    placeholder="Select Choice"
                    isDisabled={choiceOptions.length === 0}
                  />
                  {errors.priority && (
                    <p className="mt-1 text-sm text-red-500">{errors.priority}</p>
                  )}
                </div>

                <div ref={approvalRef}>
                  <label className="block text-sm font-medium">Approved By</label>
                  <ReactSelect
                    name="approval"
                    options={approvedByOptions}
                    value={
                      approvedByOptions.find(
                        (opt) => opt.value === Number(formData.approval)
                      ) || null
                    }
                    onChange={(option) =>
                      setFormData((prev) => ({
                        ...prev,
                        approval: option?.value || "",
                      }))
                    }
                    placeholder="Select Approver"
                    isDisabled={approvedByOptions.length === 0}
                  />
                  {errors.approval && (
                    <p className="mt-1 text-sm text-red-500">{errors.approval}</p>
                  )}
                </div>

                {/* Priority Testing Charges */}
                <div className="grid grid-cols-3 items-center gap-4" ref={pchargesRef}>
                  <label className="col-span-1 text-sm font-medium">
                    Priority Testing Charges
                  </label>
                  <input
                    type="number"
                    value={formData.pcharges}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        pcharges: e.target.value,
                      }))
                    }
                    className="col-span-1 rounded border px-3 py-1"
                    placeholder="Enter charges"
                  />
                  {errors.pcharges && (
                    <p className="mt-1 text-sm text-red-500">{errors.pcharges}</p>
                  )}
                  <select
                    value={formData.pchargestype || "%"}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        pchargestype: e.target.value,
                      }))
                    }
                    className="col-span-1 rounded border px-3 py-1"
                  >
                    <option value="%">%</option>
                    <option value="₹">₹</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* WORK ORDER AND RECEIPT DETAILS SECTION */}
          <div className="rounded-lg border p-4">
            <h3 className="mb-4 text-lg font-semibold">Work Order and Receipt Details</h3>

            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div ref={ponumberRef}>
                  <label className="mb-1 block text-sm font-medium">
                    Work Order No
                  </label>
                  <input
                    type="text"
                    name="ponumber"
                    value={formData.ponumber || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        ponumber: e.target.value,
                      }))
                    }
                    className="w-full rounded border px-3 py-2"
                    placeholder="Enter Work Order No"
                  />
                  {errors.ponumber && (
                    <p className="mt-1 text-sm text-red-500">{errors.ponumber}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Work Order Upload
                  </label>
                  <input
                    type="file"
                    name="wupload"
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        wupload: e.target.files[0],
                      }))
                    }
                    className="block w-full rounded border px-3 py-2"
                  />
                </div>

                <div ref={modeofrecieptRef}>
                  <label className="mb-1 block text-sm font-medium">
                    Mode Of Receipt
                  </label>
                  <select
                    name="modeofreciept"
                    value={formData.modeofreciept}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        modeofreciept: e.target.value,
                      }))
                    }
                    className="w-full rounded border px-3 py-2"
                  >
                    <option value="">Select Mode</option>
                    {modeOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  {errors.modeofreciept && (
                    <p className="mt-1 text-sm text-red-500">{errors.modeofreciept}</p>
                  )}
                </div>

                {/* Conditionally Show: Only if mode is NOT "By Hand" */}
                {isTransportMode && (
                  <div className="mt-4 grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium">
                        Courier/Cargo/Transport
                      </label>
                      <input
                        type="text"
                        name="couriernamerec"
                        value={formData.couriernamerec}
                        onChange={handleChange}
                        className="w-full rounded border px-3 py-2"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium">
                        Date Of Dispatch
                      </label>
                      <input
                        type="date"
                        name="dateofdispatchrec"
                        value={
                          formData.dateofdispatchrec
                            ? convertToInputDateFormat(formData.dateofdispatchrec)
                            : ""
                        }
                        onChange={handleChange}
                        className="w-full rounded border px-3 py-2"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium">
                        Docket/Airway Bill No
                      </label>
                      <input
                        type="text"
                        name="docketnorec"
                        value={formData.docketnorec}
                        onChange={handleChange}
                        className="w-full rounded border px-3 py-2"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium">
                        Local Contact of Courier
                      </label>
                      <input
                        type="text"
                        name="localcontactrec"
                        value={formData.localcontactrec}
                        onChange={handleChange}
                        className="w-full rounded border px-3 py-2"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Receipt Doc Upload
                  </label>
                  <input
                    type="file"
                    name="rupload"
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        rupload: e.target.files[0],
                      }))
                    }
                    className="block w-full rounded border px-3 py-2"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* MODE OF RETURN SECTION */}
          <div className="rounded-lg border p-4">
            <h3 className="mb-4 text-lg font-semibold">Mode Of Return</h3>

            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div ref={modeofdispatchRef}>
                  <label className="mb-1 block text-sm font-medium">
                    Mode Of Return
                  </label>
                  <select
                    name="modeofdispatch"
                    value={formData.modeofdispatch || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        modeofdispatch: e.target.value,
                      }))
                    }
                    className="w-full rounded border px-3 py-2"
                  >
                    <option value="">Select Mode</option>
                    <option value="BY Hand">BY Hand</option>
                    <option value="by Courier/Cargo/Transport">
                      by Courier/Cargo/Transport
                    </option>
                  </select>
                  {errors.modeofdispatch && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.modeofdispatch}
                    </p>
                  )}
                </div>

                {isTransportDispatchMode && (
                  <div className="mt-4 grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium">
                        Courier/Cargo/Transport
                      </label>
                      <input
                        type="text"
                        name="couriername"
                        value={formData.couriername || ""}
                        onChange={handleChange}
                        className="w-full rounded border px-3 py-2"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium">
                        Date Of Dispatch
                      </label>
                      <input
                        type="date"
                        name="dateofdispatch"
                        value={
                          formData.dateofdispatch
                            ? convertToInputDateFormat(formData.dateofdispatch)
                            : ""
                        }
                        onChange={handleChange}
                        className="w-full rounded border px-3 py-2"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium">
                        Docket/Airway Bill No
                      </label>
                      <input
                        type="text"
                        name="docketno"
                        value={formData.docketno || ""}
                        onChange={handleChange}
                        className="w-full rounded border px-3 py-2"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium">
                        Local Contact of Courier
                      </label>
                      <input
                        type="text"
                        name="localcontact"
                        value={formData.localcontact || ""}
                        onChange={handleChange}
                        className="w-full rounded border px-3 py-2"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* PAYMENT DETAILS SECTION */}
          <div className="rounded-lg border p-4">
            <h3 className="mb-4 text-lg font-semibold">Payment Details</h3>

            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Is Payment Done?
                  </label>
                  <select
                    name="paymentstatus"
                    value={formData.paymentstatus}
                    onChange={handleChange}
                    className="w-full rounded border px-3 py-2"
                  >
                    <option value="2">No</option>
                    <option value="1">Yes</option>
                  </select>
                </div>

                {formData.paymentstatus === "1" && (
                  <div className="space-y-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        Mode of Payment
                      </label>
                      <select
                        name="modeofpayment"
                        value={formData.modeofpayment}
                        onChange={handleChange}
                        className="w-full rounded border px-3 py-2"
                      >
                        <option value="">Select Payment Mode</option>
                        {modepaymnetOptions.map((item) => (
                          <option key={item.value} value={item.value}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        Details
                      </label>
                      <input
                        type="text"
                        name="detailsofpayment"
                        value={formData.detailsofpayment}
                        onChange={handleChange}
                        className="w-full rounded border px-3 py-2"
                        placeholder="Enter payment details"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium">Amount</label>
                      <input
                        type="number"
                        name="paymentamount"
                        value={formData.paymentamount}
                        onChange={handleChange}
                        className="w-full rounded border px-3 py-2"
                        placeholder="Enter amount"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* CERTIFICATE COLLECTION DETAILS SECTION */}
          <div className="rounded-lg border p-4">
            <h3 className="mb-4 text-lg font-semibold">Certificate Collection Details</h3>

            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium">
                    Certificate Collect as
                  </label>
                  <select
                    name="certcollectiondetail"
                    value={formData.certcollectiondetail}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        certcollectiondetail: e.target.value,
                      })
                    }
                    className="w-full rounded border px-3 py-2"
                  >
                    <option value="">Select</option>
                    {certificateOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div ref={certcollectionremarkRef}>
                  <label className="block text-sm font-medium">Description</label>
                  <input
                    type="text"
                    name="certcollectionremark"
                    value={formData.certcollectionremark}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        certcollectionremark: e.target.value,
                      })
                    }
                    className="w-full rounded border px-3 py-2"
                    placeholder="Enter description"
                  />
                  {errors.certcollectionremark && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.certcollectionremark}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ADDITIONAL INFORMATION SECTION */}
          <div className="rounded-lg border p-4">
            <h3 className="mb-4 text-lg font-semibold">Additional Information</h3>

            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium">
                    Documents Submitted, if any (Details)
                  </label>
                  <input
                    type="text"
                    name="documents"
                    value={formData.documents}
                    onChange={(e) =>
                      setFormData({ ...formData, documents: e.target.value })
                    }
                    className="w-full rounded border px-3 py-2"
                    placeholder="Certificate Collection Remark"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium">
                    Any Deadline
                  </label>
                  <input
                    type="date"
                    name="deadline"
                    value={
                      formData.deadline
                        ? convertToInputDateFormat(formData.deadline)
                        : ""
                    }
                    onChange={handleChange}
                    className="w-full rounded border px-3 py-2"
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>

                <div ref={notesRef}>
                  <label className="block text-sm font-medium">Notes</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    className="w-full rounded border px-3 py-2"
                    placeholder="terms"
                  ></textarea>
                  {errors.notes && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.notes}
                    </p>
                  )}
                </div>

                <div ref={additionalemailRef}>
                  <label className="block text-sm font-medium">
                    Additional Email Ids
                  </label>
                  <textarea
                    name="additionalemail"
                    value={formData.additionalemail}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        additionalemail: e.target.value,
                      })
                    }
                    className="w-full rounded border px-3 py-2"
                    placeholder="Comma separated additional emails"
                  ></textarea>
                  {errors.additionalemail && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.additionalemail}
                    </p>
                  )}
                </div>

                <div ref={specialrequestRef}>
                  <label className="block text-sm font-medium">
                    Any Special Request
                  </label>
                  <textarea
                    name="specialrequest"
                    value={formData.specialrequest}
                    onChange={(e) =>
                      setFormData({ ...formData, specialrequest: e.target.value })
                    }
                    className="w-full rounded border px-3 py-2"
                    placeholder="Any Special Request"
                  ></textarea>
                  {errors.specialrequest && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.specialrequest}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Hidden Inputs */}
          <input
            type="hidden"
            name="customeraddress"
            value={formData.customeraddress}
          />
          <input
            type="hidden"
            name="customername"
            value={formData.customername}
          />
          <input
            type="hidden"
            name="nablrequired"
            value={formData.nablrequired}
          />
          <input type="hidden" name="calibacc" value={formData.calibacc} />
          <input
            type="hidden"
            name="instrumentlocation"
            value={formData.instrumentlocation}
          />
          <input
            type="hidden"
            name="caliblocation"
            value={formData.caliblocation}
          />

          {/* Submit Button */}
          <div className="mt-6">
            <Button type="submit" color="primary" disabled={loading}>
              {loading ? "Updating..." : "Update"}
            </Button>
          </div>
        </form>
      </div>

      {showSuccessModal && (
        <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
          <div className="w-[90%] max-w-md rounded bg-white p-6 text-center shadow-lg">
            <h2 className="mb-2 text-lg font-bold">Result</h2>
            <p className="mb-4 text-gray-700">
              <strong>{successMessage}</strong>
            </p>
            <p className="mb-4 text-gray-700">
              <strong>Add Item</strong>
            </p>
            <Button onClick={handleOkClick}>OK</Button>
          </div>
        </div>
      )}
    </Page>
  );
}