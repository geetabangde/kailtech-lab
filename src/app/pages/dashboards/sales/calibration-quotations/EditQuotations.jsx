import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
import { Page } from "components/shared/Page";
import { Button, Card, TBody, Tr, Td, Table } from "components/ui";
import axios from "utils/axios";
import { toast } from "sonner";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import { DatePicker } from "components/shared/form/Datepicker";
import { TextEditor } from "components/shared/form/TextEditor";
import dayjs from "dayjs";

// ----------------------------------------------------------------------

const MODE_OPTIONS = [
  { value: "0", label: "Telephone" },
  { value: "1", label: "Email" },
  { value: "2", label: "Personal" },
  { value: "3", label: "Whatsapp" },
  { value: "4", label: "E-Media" },
  { value: "5", label: "Other (please mention)" },
];

export default function EditQuotations() {
  const { id } = useParams();
  const navigate = useNavigate();
  const permissions = JSON.parse(localStorage.getItem("userPermissions") || "[]");

  useEffect(() => {
    if (!permissions.includes(95)) {
      navigate("/dashboards/sales/calibration-quotations");
      toast.error("You don't have permission to edit quotations");
    }
  }, [navigate, permissions]);

  const [loading, setLoading] = useState(true);
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
    ctype: "",
    specificpurpose: "",
    enquirydate: dayjs().format("YYYY-MM-DD"),
    modeof: "0",
    customterms: "",
    ourscope: "",
    yourscope: "",
    vertical: "1",
    caddress: "",
    cperson: "",
    notes: "",
  });

  const [customers, setCustomers] = useState([]);
  const [customerTypes, setCustomerTypes] = useState([]);
  const [specificPurposes, setSpecificPurposes] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [statutoryDetails, setStatutoryDetails] = useState([]);
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [countries, setCountries] = useState([]);

  const fetchCustomerExtras = async (customerId) => {
    try {
      const [addrRes, custRes] = await Promise.all([
        axios.get(`/people/get-customers-address/${customerId}`),
        axios.get(`/people/get-single-customer/${customerId}`),
      ]);

      const addrList = addrRes.data?.data || [];
      const custData = custRes.data?.data || {};

      setAddresses(addrList);

      setFormData(prev => ({
        ...prev,
        customeraddress: custData.address || (addrList[0]?.address || ""),
        gstno: custData.gstno || "",
        country: custData.country || "",
        state: custData.stateid || custData.state || "",
        // Auto-select first address if caddress is empty
        caddress: prev.caddress || (addrList[0]?.id || "")
      }));
    } catch (err) {
      console.error("Error fetching customer extras:", err);
    }
  };

  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);
      const [custRes, ctypeRes, purposeRes, countryRes, editRes] =
        await Promise.all([
          axios.get("/people/get-all-customers"),
          axios.get("/people/get-customer-type-list"),
          axios.get("/people/get-specific-purpose-list"),
          axios.get("/people/get-country"),
          axios.get(`/sales/get-editdata-quotation/${id}`),
        ]);

      const getData = (res) => res.data?.Data || res.data?.data || [];

      const allCustomers = getData(custRes);
      setCustomers(allCustomers);
      setCustomerTypes(getData(ctypeRes));
      setSpecificPurposes(getData(purposeRes));
      setCountries(getData(countryRes));

      if (editRes.data?.status || editRes.data?.status === "true") {
        const { quotation: q, statutoryDetails, customerData } = editRes.data.data;

        if (q) {
          let newCustomer = String(q.customer || "");

          // Fallback: match customer by customername if ID is 0 or "new"
          if ((!newCustomer || newCustomer === "0" || newCustomer === "new") && q.customername) {
            const matchedCustomer = allCustomers.find(
              (c) => c.name?.trim().toLowerCase() === q.customername.trim().toLowerCase()
            );
            if (matchedCustomer) newCustomer = String(matchedCustomer.id);
          }

          const isNew = !newCustomer || newCustomer === "0" || newCustomer === "new";
          setIsNewCustomer(isNew);

          setFormData({
            customer: newCustomer || "new",
            customername: q.customername || "",
            customeraddress: q.customeraddress || "",
            contactpersonname: q.contactpersonname || "",
            concernpersondesignation: q.concernpersondesignation || "",
            concernpersonemail: q.concernpersonemail || "",
            concernpersonmobile: q.concernpersonmobile || "",
            gstno: q.gstno || "",
            country: String(q.country || ""),
            state: q.stateid || q.state || "",
            ctype: String(q.ctype || ""),
            specificpurpose: String(q.specificpurpose || ""),
            enquirydate: q.enquirydate ? dayjs(q.enquirydate).format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD"),
            modeof: String(q.modeof || "0"),
            customterms: q.customterms || "",
            ourscope: q.ourscope || "",
            yourscope: q.yourscope || "",
            caddress: String(q.caddress || ""),
            cperson: String(q.cperson || ""),
            notes: q.notes || "",
          });

          // Set statutory details
          setStatutoryDetails(statutoryDetails || []);

          // Set customer data (addresses/contacts) if existing
          if (!isNew && customerData) {
            setAddresses(customerData.addresses || []);
            setContacts(customerData.contacts || []);

            setFormData((prev) => {
              let newCperson = prev.cperson;
              let newCaddress = prev.caddress;

              // Fallback: If cperson is 0, try to match by contactpersonname
              if ((!newCperson || newCperson === "0") && prev.contactpersonname) {
                const matchedContact = (customerData.contacts || []).find(
                  (c) => c.name?.trim().toLowerCase() === prev.contactpersonname.trim().toLowerCase()
                );
                if (matchedContact) {
                  newCperson = String(matchedContact.id);
                }
              }

              // Fallback: If caddress is 0, try to match by customeraddress
              if ((!newCaddress || newCaddress === "0") && prev.customeraddress) {
                const matchedAddress = (customerData.addresses || []).find(
                  (a) => prev.customeraddress.includes(a.address) || prev.customeraddress.includes(a.city)
                );
                if (matchedAddress) {
                  newCaddress = String(matchedAddress.id);
                }
              }

              return { ...prev, cperson: newCperson, caddress: newCaddress };
            });
          }
        }
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      toast.error("Failed to load quotation data");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const handleCustomerSelection = async (selectedOption) => {
    if (!selectedOption) {
      setIsNewCustomer(false);
      setFormData(prev => ({ ...prev, customer: "", customername: "" }));
      return;
    }

    const isNew = selectedOption.__isNew__;

    if (isNew) {
      setIsNewCustomer(true);
      setFormData((prev) => ({
        ...prev,
        customer: "new",
        customername: selectedOption.label,
        customeraddress: "",
        contactpersonname: "",
        concernpersondesignation: "",
        concernpersonemail: "",
        concernpersonmobile: "",
        gstno: "",
        country: "",
        state: "",
      }));
    } else {
      setIsNewCustomer(false);
      const customerId = selectedOption.value;
      setFormData(prev => ({
        ...prev,
        customer: customerId,
        customername: selectedOption.label
      }));
      fetchCustomerExtras(customerId);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, val) => {
    setFormData((prev) => ({ ...prev, [name]: val }));
  };

  const handleEditorChange = (name, val, quill) => {
    setFormData(prev => ({
      ...prev,
      [name]: quill?.root?.innerHTML || ""
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        id: Number(id),
        customer: formData.customer === "new" ? "new" : Number(formData.customer),
        customername: formData.customername,
        customeraddress: formData.customeraddress,
        contactpersonname: formData.contactpersonname,
        concernpersondesignation: formData.concernpersondesignation,
        concernpersonemail: formData.concernpersonemail,
        concernpersonmobile: formData.concernpersonmobile,
        gstno: formData.gstno,
        country: Number(formData.country) || 0,
        state: formData.state || "",
        caddress: formData.caddress ? Number(formData.caddress) : 0,
        cperson: formData.cperson ? Number(formData.cperson) : 0,
        ctype: Number(formData.ctype),
        specificpurpose: Number(formData.specificpurpose),
        enquirydate: dayjs(formData.enquirydate).format("DD/MM/YYYY"),
        modeof: Number(formData.modeof),
        customterms: formData.customterms,
        ourscope: formData.ourscope,
        yourscope: formData.yourscope,
        notes: formData.notes,
      };

      const res = await axios.post("/sales/update-calib-quotation", payload);
      if (res.data.status === "true" || res.data.status === true) {
        toast.success(res.data.message || "Quotation updated successfully");
        navigate("/dashboards/sales/calibration-quotations", { state: { refetch: true } });
      } else {
        toast.error(res.data.message || "Failed to update quotation");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong while updating quotation");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Page title="Edit Quotation">
        <div className="flex h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <span className="ml-3 text-gray-600 font-medium">Loading quotation data...</span>
        </div>
      </Page>
    );
  }

  const inputCls = "h-10 w-full rounded-md border border-gray-300 px-3 text-sm outline-none focus:ring-1 focus:ring-blue-500";
  const labelCls = "mb-1.5 block text-sm font-medium text-gray-700";

  const customerOptions = customers.map(c => ({ value: c.id, label: c.name }));

  return (
    <Page title="Edit Quotation">
      <div className="transition-content px-[var(--margin-x)] pb-8">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            Edit Quotation
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

              <div className="form-group md:col-span-2">
                <label className={labelCls}>Customer Name</label>
                <CreatableSelect
                  isClearable
                  placeholder="Type to search or add new customer..."
                  options={customerOptions}
                  value={
                    formData.customer === "new"
                      ? { label: formData.customername, value: "new" }
                      : customerOptions.find(opt => String(opt.value) === String(formData.customer)) || null
                  }
                  onChange={handleCustomerSelection}
                  formatCreateLabel={(inputValue) => `Add "${inputValue}" as a new customer`}
                />
              </div>

              {/* Conditional Details Block */}
              {(isNewCustomer || formData.customer) && (
                <>
                  {isNewCustomer ? (
                    <>
                      <div className="form-group md:col-span-2">
                        <label className={labelCls}>Customer Address</label>
                        <input
                          name="customeraddress"
                          value={formData.customeraddress}
                          onChange={handleChange}
                          className={inputCls}
                          required
                          placeholder="Enter address"
                        />
                      </div>
                      <div className="form-group">
                        <label className={labelCls}>Contact Person Name</label>
                        <input
                          name="contactpersonname"
                          value={formData.contactpersonname}
                          onChange={handleChange}
                          className={inputCls}
                          required
                          placeholder="Enter contact person"
                        />
                      </div>
                      <div className="form-group">
                        <label className={labelCls}>GST NO</label>
                        <input
                          name="gstno"
                          value={formData.gstno}
                          onChange={handleChange}
                          className={inputCls}
                          placeholder="Enter GST"
                        />
                      </div>
                      <div className="form-group">
                        <label className={labelCls}>Country</label>
                        <Select
                          options={countries.map((c) => ({
                            value: c.id,
                            label: c.country_name,
                          }))}
                          value={countries
                            .map((c) => ({ value: c.id, label: c.country_name }))
                            .find((opt) => String(opt.value) === String(formData.country))}
                          onChange={(opt) => handleSelectChange("country", opt?.value)}
                          placeholder="Select Country..."
                        />
                      </div>
                      <div className="form-group">
                        <label className={labelCls}>State / Province</label>
                        <input
                          name="state"
                          value={formData.state}
                          onChange={handleChange}
                          className={inputCls}
                          placeholder="Enter state"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="form-group md:col-span-2">
                        <label className={labelCls}>Customer Address</label>
                        <Select
                          options={addresses.map((a) => ({ value: a.id, label: `${a.name} (${a.address})` }))}
                          value={addresses
                            .map((a) => ({ value: a.id, label: `${a.name} (${a.address})` }))
                            .find((opt) => String(opt.value) === String(formData.caddress))}
                          onChange={(opt) => handleSelectChange("caddress", opt?.value)}
                          placeholder="Select Address"
                        />
                      </div>
                      <div className="form-group">
                        <label className={labelCls}>Contact Person Name</label>
                        <Select
                          options={contacts.map((c) => ({ value: c.id, label: c.name }))}
                          value={contacts
                            .map((c) => ({ value: c.id, label: c.name }))
                            .find((opt) => String(opt.value) === String(formData.cperson))}
                          onChange={(opt) => handleSelectChange("cperson", opt?.value)}
                          placeholder="Select Contact"
                        />
                      </div>
                      <div className="form-group">
                        <label className={labelCls}>Contact Person Designation</label>
                        <input
                          name="concernpersondesignation"
                          value={formData.concernpersondesignation}
                          onChange={handleChange}
                          className={inputCls}
                          placeholder="Enter designation"
                        />
                      </div>
                      <div className="form-group">
                        <label className={labelCls}>Contact Person Email</label>
                        <input
                          name="concernpersonemail"
                          value={formData.concernpersonemail}
                          onChange={handleChange}
                          className={inputCls}
                          placeholder="Enter email"
                        />
                      </div>
                      <div className="form-group">
                        <label className={labelCls}>Contact Person Mobile</label>
                        <input
                          name="concernpersonmobile"
                          value={formData.concernpersonmobile}
                          onChange={handleChange}
                          className={inputCls}
                          placeholder="Enter mobile"
                        />
                      </div>
                      <div className="form-group">
                        <label className={labelCls}>GST NO</label>
                        <input
                          name="gstno"
                          value={formData.gstno}
                          onChange={handleChange}
                          className={inputCls}
                          placeholder="Enter GST"
                        />
                      </div>
                      <div className="form-group">
                        <label className={labelCls}>Country</label>
                        <Select
                          options={countries.map((c) => ({
                            value: c.id,
                            label: c.country_name,
                          }))}
                          value={countries
                            .map((c) => ({ value: c.id, label: c.country_name }))
                            .find((opt) => String(opt.value) === String(formData.country))}
                          onChange={(opt) => handleSelectChange("country", opt?.value)}
                          placeholder="Select Country..."
                        />
                      </div>
                      <div className="form-group">
                        <label className={labelCls}>State / Province</label>
                        <input
                          name="state"
                          value={formData.state}
                          onChange={handleChange}
                          className={inputCls}
                          placeholder="Enter state"
                        />
                      </div>
                    </>
                  )}
                </>
              )}

              {/* Reordered: Customer Type and Specific Purpose move here */}
              <div className="form-group">
                <label className={labelCls}>Customer Type</label>
                <Select
                  options={customerTypes.map((t) => ({ value: t.id, label: t.name }))}
                  value={customerTypes
                    .map((t) => ({ value: t.id, label: t.name }))
                    .find((opt) => String(opt.value) === String(formData.ctype))}
                  onChange={(opt) => handleSelectChange("ctype", opt?.value)}
                  placeholder="Select Type..."
                />
              </div>

              <div className="form-group">
                <label className={labelCls}>Specific Purpose</label>
                <Select
                  options={specificPurposes.map((p) => ({ value: p.id, label: p.name }))}
                  value={specificPurposes
                    .map((p) => ({ value: p.id, label: p.name }))
                    .find((opt) => String(opt.value) === String(formData.specificpurpose))}
                  onChange={(opt) => handleSelectChange("specificpurpose", opt?.value)}
                  placeholder="Select Purpose..."
                />
              </div>

              <div className="form-group">
                <label className={labelCls}>Enquiry Date</label>
                <DatePicker
                  value={formData.enquirydate}
                  onChange={([date]) =>
                    setFormData((prev) => ({
                      ...prev,
                      enquirydate: date ? dayjs(date).format("YYYY-MM-DD") : "",
                    }))
                  }
                  className={inputCls}
                />
              </div>

              <div className="form-group">
                <label className={labelCls}>Mode Of Enquiry</label>
                <Select
                  options={MODE_OPTIONS}
                  value={MODE_OPTIONS.find((opt) => opt.value === formData.modeof)}
                  onChange={(opt) => handleSelectChange("modeof", opt?.value)}
                />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="mb-4 text-lg font-medium text-gray-800">
              Terms & Scope of Work
            </h3>
            <div className="space-y-4">
              <div className="form-group">
                <label className={labelCls}>Note :-</label>
                <TextEditor
                  value={formData.notes}
                  onChange={(val, quill) => handleEditorChange("notes", val, quill)}
                  className="min-h-[100px] border rounded-md overflow-hidden"
                />
              </div>
              <div className="form-group">
                <label className={labelCls}>Custom Terms</label>
                <TextEditor
                  value={formData.customterms}
                  onChange={(val, quill) => handleEditorChange("customterms", val, quill)}
                  className="min-h-[150px] border rounded-md overflow-hidden"
                />
              </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="form-group">
                  <label className={labelCls}>Our Scope of Work</label>
                  <TextEditor
                    value={formData.ourscope}
                    onChange={(val, quill) => handleEditorChange("ourscope", val, quill)}
                    className="min-h-[120px] border rounded-md overflow-hidden"
                  />
                </div>
                <div className="form-group">
                  <label className={labelCls}>Your Scope of Work</label>
                  <TextEditor
                    value={formData.yourscope}
                    onChange={(val, quill) => handleEditorChange("yourscope", val, quill)}
                    className="min-h-[120px] border rounded-md overflow-hidden"
                  />
                </div>
              </div>
            </div>
          </Card>

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
                        <Td className="w-1/3 font-semibold text-gray-700 bg-gray-50/50">
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

          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              color="primary"
              disabled={submitting}
              className="h-10 px-8 text-base font-medium shadow-md transition-all hover:shadow-lg"
            >
              {submitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </Page>
  );
}