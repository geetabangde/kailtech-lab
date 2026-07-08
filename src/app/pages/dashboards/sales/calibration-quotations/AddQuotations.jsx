import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Page } from "components/shared/Page";
import { Button, Card, TBody, Tr, Td, Table } from "components/ui";
import axios from "utils/axios";
import { toast } from "sonner";
import Select from "react-select";
import { DatePicker } from "components/shared/form/Datepicker";
import dayjs from "dayjs";
import { TextEditor } from "components/shared/form/TextEditor";

export default function AddQuotations() {
  const navigate = useNavigate();
  const permissions = JSON.parse(localStorage.getItem("userPermissions") || "[]");

  useEffect(() => {
    if (!permissions.includes(94)) {
      navigate("/dashboards/sales/calibration-quotations");
      toast.error("You don't have permission to add quotations");
    }
  }, [navigate, permissions]);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    customer: "",
    customername: "",
    customeraddress: "",
    contactpersonname: "",
    concernpersondesignation: "",
    concernpersonemail: "",
    concernpersonmobile: "",
    gstno: "",
    country: "",
    state: "",
    stateid: "",
    ctype: "",
    specificpurpose: "",
    enquirydate: dayjs().format("YYYY-MM-DD"),
    modeof: "0",
    customterms: `1. Equipments which are possible to be calibrated at Site, will be done at site. Rest equipments will be calibrated at our Lab.\n2. Payment terms: Advance.\n3. Cross Cheque/DD should be drawn in favor of Company Name.\n4. Please attach bill details indicating Invoice No. & TDS deductions if any along with your payment.\n5. Subject to the exclusive jurisdiction of courts only.\n6. Errors & omissions accepted.`,
    ourscope: "",
    yourscope: "",
    vertical: "1",
    caddress: "",
    cperson: "",
  });

  const [customers, setCustomers] = useState([]);
  const [customerTypes, setCustomerTypes] = useState([]);
  const [specificPurposes, setSpecificPurposes] = useState([]);
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [statutoryDetails, setStatutoryDetails] = useState([]);
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [isIndianCountry, setIsIndianCountry] = useState(false);

  const MODE_OPTIONS = [
    { value: "0", label: "Telephone" },
    { value: "1", label: "Email" },
    { value: "2", label: "Personal" },
    { value: "3", label: "Whatsapp" },
    { value: "4", label: "E-Media" },
    { value: "5", label: "Other (please mention)" },
  ];

  useEffect(() => {
    fetchDropdownData();
  }, []);

  const fetchDropdownData = async () => {
    try {
      setLoading(true);
      const [custRes, ctypeRes, purposeRes, countryRes, statutoryRes, stateRes] =
        await Promise.all([
          axios.get("/people/get-all-customers"),
          axios.get("/people/get-customer-type-list"),
          axios.get("/people/get-specific-purpose-list"),
          axios.get("/people/get-country"),
          axios.get("/sales/get-satutory-details"),
          axios.get("/people/get-state"),
        ]);
      const getData = (res) => res.data?.Data || res.data?.data || [];

      setCustomers(getData(custRes));
      setCustomerTypes(getData(ctypeRes));
      setSpecificPurposes(getData(purposeRes));
      setCountries(getData(countryRes));
      setStatutoryDetails(getData(statutoryRes));
      setStates(getData(stateRes));
    } catch (err) {
      console.error("Error fetching dropdown data:", err);
      toast.error("Failed to load form data");
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerChange = async (selectedOption) => {
    const val = selectedOption ? selectedOption.value : "";
    setFormData((prev) => ({ ...prev, customer: val }));

    if (val === "new") {
      setIsNewCustomer(true);
      setFormData((prev) => ({
        ...prev,
        customername: "",
        customeraddress: "",
        contactpersonname: "",
        concernpersondesignation: "",
        concernpersonemail: "",
        concernpersonmobile: "",
        gstno: "",
        country: "",
        state: "",
        stateid: "",
      }));
      setIsIndianCountry(false);
    } else if (val) {
      setIsNewCustomer(false);
      try {
        const [addrRes, custRes] = await Promise.all([
          axios.get(`/people/get-customers-address/${val}`).catch(() => null),
          axios.get(`/people/get-single-customer/${val}`).catch(() => null),
        ]);

        const addrData = addrRes?.data?.data?.[0] || {};
        const custData = custRes?.data?.data || {};

        setFormData((prev) => ({
          ...prev,
          customername: custData.name || prev.customername,
          customeraddress: addrData.address 
            ? `${addrData.address || ""} ${addrData.city || ""} ${addrData.pincode || ""}`.trim()
            : (custData.address || ""),
          contactpersonname: addrData.contact_person || custData.pname || "",
          gstno: custData.gstno || "",
          country: custData.country || "",
          state: custData.state || "",
          stateid: custData.stateid || "",
          caddress: addrData.id || "",
          cperson: addrData.contact_person_id || custData.contact_person_id || "",
        }));
      } catch (err) {
        console.error("Error fetching customer details:", err);
      }
    } else {
      setIsNewCustomer(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, selectedOption) => {
    const val = selectedOption ? selectedOption.value : "";
    setFormData((prev) => ({
      ...prev,
      [name]: val,
    }));
    if (name === "country") {
      setIsIndianCountry(String(val) === "1");
    }
  };

  const handleEditorChange = (name, val, quill) => {
    setFormData((prev) => ({
      ...prev,
      [name]: quill?.root?.innerHTML || "",
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic Validation
    if (!formData.customer) {
      toast.error("Please select a valid customer");
      return;
    }
    if (formData.customer === "new") {
      if (!formData.customername || !formData.customeraddress || !formData.contactpersonname) {
        toast.error("Please fill in all the required new customer details");
        return;
      }
    }
    if (!formData.ctype) {
      toast.error("Please select a customer type");
      return;
    }
    if (!formData.specificpurpose) {
      toast.error("Please select a specific purpose");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        customer: formData.customer === "new" ? "new" : Number(formData.customer),
        caddress: formData.caddress ? Number(formData.caddress) : 0,
        cperson: formData.cperson ? Number(formData.cperson) : 0,
        ctype: Number(formData.ctype),
        specificpurpose: Number(formData.specificpurpose),
        enquirydate: dayjs(formData.enquirydate).format("DD/MM/YYYY"),
        modeof: Number(formData.modeof),
        customterms: formData.customterms,
        ourscope: formData.ourscope,
        yourscope: formData.yourscope,
        vertical: Number(formData.vertical),
        customername: formData.customername,
        customeraddress: formData.customeraddress,
        contactpersonname: formData.contactpersonname,
        concernpersondesignation: formData.concernpersondesignation,
        concernpersonemail: formData.concernpersonemail,
        concernpersonmobile: formData.concernpersonmobile,
        gstno: formData.gstno,
        country: formData.country,
      };

      if (isIndianCountry) {
        payload.stateid = formData.stateid;
      } else {
        payload.state = formData.state;
      }

      const res = await axios.post("/sales/add-quotations", payload);
      if (res.data.status === "true" || res.data.status === true) {
        toast.success(res.data.message || "Quotation created successfully");
        navigate(`/dashboards/sales/calibration-quotations/add-items/${res.data.id}`);
      } else {
        toast.error(res.data.message || "Failed to create quotation");
      }
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.error || err.response?.data?.message || "Something went wrong while creating quotation";
      toast.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Page title="Add New Quotation">
        <div className="flex h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <span className="ml-3 text-gray-600">Loading form data...</span>
        </div>
      </Page>
    );
  }

  return (
    <Page title="Add New Quotation">
      <div className="transition-content px-[var(--margin-x)] pb-8">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            Add New Quotation
          </h1>
          <Link to="/dashboards/sales/calibration-quotations" state={{ refetch: true }}>
            <Button
              variant="outline"
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              &lt;&lt; Back to Quotation List
            </Button>
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="p-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Customer Selection */}
              <div className="form-group">
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-dark-100">
                  Select Customer
                </label>
                <Select
                  options={[
                    { value: "new", label: "Add New Customer" },
                    ...customers.map((c) => ({ value: c.id, label: c.name })),
                  ]}
                  value={
                    formData.customer === "new"
                      ? { value: "new", label: "Add New Customer" }
                      : customers
                          .map((c) => ({ value: c.id, label: c.name }))
                          .find((opt) => String(opt.value) === String(formData.customer)) || null
                  }
                  onChange={handleCustomerChange}
                  placeholder="Choose Customer..."
                  className="react-select-container"
                />
              </div>

              {/* Customer Type */}
              <div className="form-group">
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-dark-100">
                  Customer Type
                </label>
                <Select
                  options={customerTypes.map((t) => ({
                    value: t.id,
                    label: t.name,
                  }))}
                  value={customerTypes
                    .map((t) => ({ value: t.id, label: t.name }))
                    .find((opt) => String(opt.value) === String(formData.ctype))}
                  onChange={(opt) => handleSelectChange("ctype", opt)}
                  placeholder="Select Type..."
                />
              </div>

              {/* Conditional Customer Details */}
              {(isNewCustomer || formData.customer) && (
                <>
                  <div className="form-group md:col-span-2">
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Customer Name
                    </label>
                    <input
                      name="customername"
                      value={formData.customername}
                      onChange={handleChange}
                      className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm outline-none focus:ring-1 focus:ring-blue-500"
                      required
                      placeholder="Enter customer name"
                    />
                  </div>
                  <div className="form-group md:col-span-2">
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Customer Address
                    </label>
                    <input
                      name="customeraddress"
                      value={formData.customeraddress}
                      onChange={handleChange}
                      className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm outline-none focus:ring-1 focus:ring-blue-500"
                      required
                      placeholder="Enter address"
                    />
                  </div>
                  <div className="form-group">
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Contact Person Name
                    </label>
                    <input
                      name="contactpersonname"
                      value={formData.contactpersonname}
                      onChange={handleChange}
                      className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm outline-none focus:ring-1 focus:ring-blue-500"
                      required
                      placeholder="Enter contact person"
                    />
                  </div>
                  <div className="form-group">
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Contact Person Designation
                    </label>
                    <input
                      name="concernpersondesignation"
                      value={formData.concernpersondesignation}
                      onChange={handleChange}
                      className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Enter designation"
                    />
                  </div>
                  <div className="form-group">
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Contact Person Email
                    </label>
                    <input
                      type="email"
                      name="concernpersonemail"
                      value={formData.concernpersonemail}
                      onChange={handleChange}
                      className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Enter email address"
                    />
                  </div>
                  <div className="form-group">
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Contact Person Mobile
                    </label>
                    <input
                      type="tel"
                      name="concernpersonmobile"
                      value={formData.concernpersonmobile}
                      onChange={handleChange}
                      className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Enter mobile number"
                    />
                  </div>
                  <div className="form-group">
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      GST NO
                    </label>
                    <input
                      name="gstno"
                      value={formData.gstno}
                      onChange={handleChange}
                      className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Enter GST"
                    />
                  </div>
                  <div className="form-group">
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Country
                    </label>
                    <Select
                      options={countries.map((c) => ({
                        value: c.id,
                        label: c.country_name,
                      }))}
                      value={countries
                        .map((c) => ({ value: c.id, label: c.country_name }))
                        .find((opt) => opt.value === formData.country)}
                      onChange={(opt) => handleSelectChange("country", opt)}
                      placeholder="Select Country..."
                    />
                  </div>
                  <div className="form-group">
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      State / Province
                    </label>
                    {isIndianCountry ? (
                      <Select
                        options={states.map((s) => ({ value: s.id, label: s.state }))}
                        value={states
                          .map((s) => ({ value: s.id, label: s.state }))
                          .find((opt) => String(opt.value) === String(formData.stateid))}
                        onChange={(opt) => handleSelectChange("stateid", opt)}
                        placeholder="Select State..."
                      />
                    ) : (
                      <input
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Enter state"
                      />
                    )}
                  </div>
                </>
              )}

              {/* Specific Purpose */}
              <div className="form-group">
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Specific Purpose
                </label>
                <Select
                  options={specificPurposes.map((p) => ({
                    value: p.id,
                    label: p.name,
                  }))}
                  value={specificPurposes
                    .map((p) => ({ value: p.id, label: p.name }))
                    .find((opt) => String(opt.value) === String(formData.specificpurpose))}
                  onChange={(opt) => handleSelectChange("specificpurpose", opt)}
                  placeholder="Select Purpose..."
                />
              </div>

              {/* Enquiry Date */}
              <div className="form-group">
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Enquiry Date
                </label>
                <DatePicker
                  value={formData.enquirydate}
                  onChange={([date]) =>
                    setFormData((prev) => ({
                      ...prev,
                      enquirydate: date ? dayjs(date).format("YYYY-MM-DD") : "",
                    }))
                  }
                  className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Mode of Enquiry */}
              <div className="form-group">
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Mode Of Enquiry
                </label>
                <Select
                  options={MODE_OPTIONS}
                  value={MODE_OPTIONS.find(
                    (opt) => opt.value === formData.modeof,
                  )}
                  onChange={(opt) => handleSelectChange("modeof", opt)}
                />
              </div>
            </div>
          </Card>

          {/* Terms and Scope Section */}
          <Card className="p-6">
            <h3 className="mb-4 text-lg font-medium text-gray-800">
              Terms & Scope of Work
            </h3>
            <div className="space-y-4">
              <div className="form-group">
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Custom Terms
                </label>
                <TextEditor
                  value={formData.customterms}
                  onChange={(val, quill) => handleEditorChange("customterms", val, quill)}
                  className="min-h-[150px] bg-white rounded-md border border-gray-300"
                />
              </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="form-group">
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Our Scope of Work
                  </label>
                  <TextEditor
                    value={formData.ourscope}
                    onChange={(val, quill) => handleEditorChange("ourscope", val, quill)}
                    className="min-h-[150px] bg-white rounded-md border border-gray-300"
                  />
                </div>
                <div className="form-group">
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Your Scope of Work
                  </label>
                  <TextEditor
                    value={formData.yourscope}
                    onChange={(val, quill) => handleEditorChange("yourscope", val, quill)}
                    className="min-h-[150px] bg-white rounded-md border border-gray-300"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Statutory Details Table */}
          {statutoryDetails.length > 0 && (
            <Card className="p-6">
              <h3 className="mb-4 text-lg font-medium text-gray-800">
                Statutory Detail
              </h3>
              <div className="overflow-x-auto">
                <Table className="shadow-xs w-full overflow-hidden rounded-lg border">
                  <TBody>
                    {statutoryDetails.map((item, idx) => (
                      <Tr key={idx} className="border-b">
                        <Td className="w-1/3 font-semibold text-gray-700">
                          {item.name}
                        </Td>
                        <Td className="text-gray-600">{item.description}</Td>
                      </Tr>
                    ))}
                  </TBody>
                </Table>
              </div>
            </Card>
          )}

          {/* Footer Actions */}
          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              color="success"
              disabled={submitting}
              className="h-10 px-6 text-base font-medium shadow-md transition-all hover:shadow-lg"
            >
              {submitting ? "Creating..." : "Proceed to add Quotation Items"}
            </Button>
          </div>
        </form>
      </div>
    </Page>
  );
}
