import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams, useSearchParams, Link } from "react-router-dom";
import { Page } from "components/shared/Page";
import { Button, Card } from "components/ui";
import axios from "utils/axios";
import { toast } from "sonner";
import Select from "react-select";
import { DatePicker } from "components/shared/form/Datepicker";
import dayjs from "dayjs";
import { TextEditor } from "components/shared/form/TextEditor";

export default function EditTestingQuotation() {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const isRevision = searchParams.get('revise') === 'true';
    const navigate = useNavigate();
    const permissions = JSON.parse(localStorage.getItem("userPermissions") || "[]");

    useEffect(() => {
        if (!permissions.includes(95)) {
            navigate("/dashboards/sales/testing-quotations");
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
        enquirydate: "",
        modeof: "0",
        customterms: "",
        statutory: "",
        ourscope: "",
        yourscope: "",
        vertical: "2",
        caddress: "",
        cperson: "",
        notes: "",
    });

    const [customers, setCustomers] = useState([]);
    const [customerTypes, setCustomerTypes] = useState([]);
    const [specificPurposes, setSpecificPurposes] = useState([]);
    const [addresses, setAddresses] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [countries, setCountries] = useState([]);

    const MODE_OPTIONS = [
        { value: "0", label: "Telephone" },
        { value: "1", label: "Email" },
        { value: "2", label: "Personal" },
        { value: "3", label: "Whatsapp" },
        { value: "4", label: "E-Media" },
        { value: "5", label: "Other (please mention)" },
    ];

    const fetchDependencies = useCallback(async (customerId) => {
        if (!customerId) return { addresses: [], contacts: [] };
        try {
            const [addrRes, contactRes] = await Promise.all([
                axios.get(`/people/get-customers-address/${customerId}`),
                axios.get(`/get-concern-person/${customerId}`),
            ]);
            const addrs = addrRes.data?.data || [];
            const conts = contactRes.data?.data || [];
            setAddresses(addrs);
            setContacts(conts);
            return { addresses: addrs, contacts: conts };
        } catch (err) {
            console.error("Error fetching dependencies:", err);
            return { addresses: [], contacts: [] };
        }
    }, []);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [quoteRes, custRes, ctypeRes, purposeRes, countryRes] = await Promise.all([
                axios.get(`/sales/get-testing-quotation-byid/${id}`),
                axios.get("/people/get-all-customers"),
                axios.get("/people/get-customer-type-list"),
                axios.get("/people/get-specific-purpose-list"),
                axios.get("/people/get-country"),
            ]);

            const quote = quoteRes.data?.data?.quotation;
            if (!quote) {
                toast.error("Quotation not found");
                navigate("/dashboards/sales/testing-quotations");
                return;
            }

            setCustomers(custRes.data?.Data || custRes.data?.data || []);
            setCustomerTypes(ctypeRes.data?.Data || ctypeRes.data?.data || []);
            setSpecificPurposes(purposeRes.data?.Data || purposeRes.data?.data || []);
            setCountries(countryRes.data?.Data || countryRes.data?.data || []);

            let addrs = [];
            let conts = [];
            if (quote.customer && quote.customer !== "new") {
                const deps = await fetchDependencies(quote.customer);
                addrs = deps.addresses;
                conts = deps.contacts;
            }

            let newCperson = String(quote.cperson || "");
            let newCaddress = String(quote.caddress || "");

            // Fallback: match cperson by contactpersonname
            if ((!newCperson || newCperson === "0") && quote.contactpersonname) {
                const matchedContact = conts.find(
                    (c) => c.name?.trim().toLowerCase() === quote.contactpersonname.trim().toLowerCase()
                );
                if (matchedContact) newCperson = String(matchedContact.id);
            }

            // Fallback: match caddress by customeraddress
            if ((!newCaddress || newCaddress === "0") && quote.customeraddress) {
                const matchedAddress = addrs.find(
                    (a) => quote.customeraddress.includes(a.address) || quote.customeraddress.includes(a.city)
                );
                if (matchedAddress) newCaddress = String(matchedAddress.id);
            }

            setFormData({
                customer: String(quote.customer || "new"),
                customername: quote.customername || "",
                customeraddress: quote.customeraddress || "",
                contactpersonname: quote.contactpersonname || "",
                concernpersondesignation: quote.concernpersondesignation || "",
                concernpersonemail: quote.concernpersonemail || "",
                concernpersonmobile: quote.concernpersonmobile || "",
                gstno: quote.gstno || "",
                country: String(quote.country || ""),
                state: quote.stateid || quote.state || "",
                ctype: String(quote.ctype || ""),
                specificpurpose: String(quote.specificpurpose || ""),
                enquirydate: quote.enquirydate ? dayjs(quote.enquirydate).format("YYYY-MM-DD") : "",
                modeof: String(quote.modeof || "0"),
                customterms: quote.customterms || "",
                statutory: quote.statutory || "",
                ourscope: quote.ourscope || "",
                yourscope: quote.yourscope || "",
                vertical: String(quote.vertical || "2"),
                caddress: newCaddress,
                cperson: newCperson,
                notes: quote.notes || "",
            });
        } catch (err) {
            console.error("Error loading data:", err);
            toast.error("Failed to load quotation details");
        } finally {
            setLoading(false);
        }
    }, [id, navigate, fetchDependencies]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleCustomerChange = async (selectedOption) => {
        const val = selectedOption ? selectedOption.value : "";
        setFormData((prev) => ({ ...prev, customer: val, caddress: "", cperson: "" }));
        if (val) {
            fetchDependencies(val);
        } else {
            setAddresses([]);
            setContacts([]);
        }
    };



    const handleSelectChange = (name, selectedOption) => {
        setFormData((prev) => ({
            ...prev,
            [name]: selectedOption ? selectedOption.value : "",
        }));
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
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
                customer: Number(formData.customer),
                caddress: Number(formData.caddress),
                cperson: Number(formData.cperson),
                ctype: Number(formData.ctype),
                specificpurpose: Number(formData.specificpurpose),
                enquirydate: dayjs(formData.enquirydate).format("DD/MM/YYYY"),
                modeof: Number(formData.modeof),
                customterms: formData.customterms,
                statutory: formData.statutory,
                ourscope: formData.ourscope,
                yourscope: formData.yourscope,
                notes: formData.notes,
                revise: isRevision,
                id: Number(id),
                customername: formData.customername,
                customeraddress: formData.customeraddress,
                contactpersonname: formData.contactpersonname,
                concernpersondesignation: formData.concernpersondesignation,
                concernpersonemail: formData.concernpersonemail,
                concernpersonmobile: formData.concernpersonmobile,
                gstno: formData.gstno,
                country: formData.country,
                state: formData.state,
            };

            const res = await axios.post("/sales/update-testing-quotation", payload);
            if (res.data.status === "true" || res.data.status === true) {
                toast.success(res.data.message || "Quotation updated successfully");
                navigate("/dashboards/sales/testing-quotations");
            } else {
                toast.error(res.data.message || "Update failed");
            }
        } catch (err) {
            console.error(err);
            toast.error("Error updating quotation");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <Page title="Edit Testing Quotation">
                <div className="flex h-[60vh] items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
                    <span className="ml-3 text-gray-600 font-medium">Loading details...</span>
                </div>
            </Page>
        );
    }

    return (
        <Page title="Edit Testing Quotation">
            <div className="transition-content px-[var(--margin-x)] pb-8">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            Edit Quotation
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">Update primary details for quotation ID: {id}</p>
                    </div>
                    <Link to="/dashboards/sales/testing-quotations">
                        <Button variant="outline" className="flex items-center gap-2 border-gray-300 hover:bg-gray-50">
                            &lt;&lt; Back to List
                        </Button>
                    </Link>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Card className="p-6 border-none shadow-sm ring-1 ring-gray-200">
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            {/* Customer Selection */}
                            <div className="form-group">
                                <label className="mb-2 block text-sm font-semibold text-gray-700">
                                    Customer Name
                                </label>
                                <Select
                                    options={customers.map((c) => ({ value: c.id, label: c.name }))}
                                    value={customers
                                        .map((c) => ({ value: c.id, label: c.name }))
                                        .find((opt) => String(opt.value) === String(formData.customer))}
                                    onChange={handleCustomerChange}
                                    placeholder="Choose Customer..."
                                    className="react-select-container"
                                />
                            </div>

                            {/* Customer Address */}
                            <div className="form-group">
                                <label className="mb-2 block text-sm font-semibold text-gray-700">
                                    Customer Address
                                </label>
                                <Select
                                    options={addresses.map((a) => ({
                                        value: a.id,
                                        label: `${a.name || "Default"} (${a.address || ""})`
                                    }))}
                                    value={addresses
                                        .map((a) => ({ value: a.id, label: `${a.name || "Default"} (${a.address || ""})` }))
                                        .find((opt) => String(opt.value) === String(formData.caddress))}
                                    onChange={(opt) => handleSelectChange("caddress", opt)}
                                    placeholder="Select Address..."
                                    noOptionsMessage={() => "No addresses found for this customer"}
                                />
                            </div>

                            {/* Contact Person */}
                            <div className="form-group">
                                <label className="mb-2 block text-sm font-semibold text-gray-700">
                                    Contact Person Name
                                </label>
                                <Select
                                    options={contacts.map((c) => ({ value: c.id, label: c.name }))}
                                    value={contacts
                                        .map((c) => ({ value: c.id, label: c.name }))
                                        .find((opt) => String(opt.value) === String(formData.cperson))}
                                    onChange={(opt) => handleSelectChange("cperson", opt)}
                                    placeholder="Select Contact..."
                                    noOptionsMessage={() => "No contacts found for this customer"}
                                />
                            </div>

                            <div className="form-group">
                                <label className="mb-2 block text-sm font-semibold text-gray-700">
                                    Contact Person Designation
                                </label>
                                <input
                                    name="concernpersondesignation"
                                    value={formData.concernpersondesignation}
                                    onChange={handleChange}
                                    className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                    placeholder="Enter designation"
                                />
                            </div>
                            <div className="form-group">
                                <label className="mb-2 block text-sm font-semibold text-gray-700">
                                    Contact Person Email
                                </label>
                                <input
                                    name="concernpersonemail"
                                    value={formData.concernpersonemail}
                                    onChange={handleChange}
                                    className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                    placeholder="Enter email"
                                />
                            </div>
                            <div className="form-group">
                                <label className="mb-2 block text-sm font-semibold text-gray-700">
                                    Contact Person Mobile
                                </label>
                                <input
                                    name="concernpersonmobile"
                                    value={formData.concernpersonmobile}
                                    onChange={handleChange}
                                    className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                    placeholder="Enter mobile"
                                />
                            </div>
                            <div className="form-group">
                                <label className="mb-2 block text-sm font-semibold text-gray-700">
                                    GST NO
                                </label>
                                <input
                                    name="gstno"
                                    value={formData.gstno}
                                    onChange={handleChange}
                                    className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                    placeholder="Enter GST"
                                />
                            </div>
                            <div className="form-group">
                                <label className="mb-2 block text-sm font-semibold text-gray-700">
                                    Country
                                </label>
                                <Select
                                    options={countries.map((c) => ({
                                        value: c.id,
                                        label: c.country_name,
                                    }))}
                                    value={countries
                                        .map((c) => ({ value: c.id, label: c.country_name }))
                                        .find((opt) => String(opt.value) === String(formData.country))}
                                    onChange={(opt) => handleSelectChange("country", opt)}
                                    placeholder="Select Country..."
                                />
                            </div>
                            <div className="form-group">
                                <label className="mb-2 block text-sm font-semibold text-gray-700">
                                    State / Province
                                </label>
                                <input
                                    name="state"
                                    value={formData.state}
                                    onChange={handleChange}
                                    className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                    placeholder="Enter state"
                                />
                            </div>

                            {/* Customer Type */}
                            <div className="form-group">
                                <label className="mb-2 block text-sm font-semibold text-gray-700">
                                    Customer Type
                                </label>
                                <Select
                                    options={customerTypes.map((t) => ({ value: t.id, label: t.name }))}
                                    value={customerTypes
                                        .map((t) => ({ value: t.id, label: t.name }))
                                        .find((opt) => String(opt.value) === String(formData.ctype))}
                                    onChange={(opt) => handleSelectChange("ctype", opt)}
                                    placeholder="Select Type..."
                                />
                            </div>

                            {/* Specific Purpose */}
                            <div className="form-group">
                                <label className="mb-2 block text-sm font-semibold text-gray-700">
                                    Specific Purpose
                                </label>
                                <Select
                                    options={specificPurposes.map((p) => ({ value: p.id, label: p.name }))}
                                    value={specificPurposes
                                        .map((p) => ({ value: p.id, label: p.name }))
                                        .find((opt) => String(opt.value) === String(formData.specificpurpose))}
                                    onChange={(opt) => handleSelectChange("specificpurpose", opt)}
                                    placeholder="Select Purpose..."
                                />
                            </div>

                            {/* Enquiry Date */}
                            <div className="form-group">
                                <label className="mb-2 block text-sm font-semibold text-gray-700">
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
                                    className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                />
                            </div>

                            {/* Mode of Enquiry */}
                            <div className="form-group">
                                <label className="mb-2 block text-sm font-semibold text-gray-700">
                                    Mode Of Enquiry
                                </label>
                                <Select
                                    options={MODE_OPTIONS}
                                    value={MODE_OPTIONS.find((opt) => opt.value === formData.modeof)}
                                    onChange={(opt) => handleSelectChange("modeof", opt)}
                                />
                            </div>
                        </div>
                    </Card>

                    {/* Terms and Scope Section */}
                    <Card className="p-6 border-none shadow-sm ring-1 ring-gray-200 bg-gray-50/30">
                        <h3 className="mb-5 text-lg font-bold text-gray-800 flex items-center gap-2">
                            <span className="h-6 w-1 bg-blue-600 rounded-full"></span>
                            Terms & Scope of Work
                        </h3>
                        <div className="space-y-5">
                            <div className="form-group">
                                <label className="mb-2 block text-sm font-semibold text-gray-700">
                                    Note :-
                                </label>
                                <TextEditor
                                    value={formData.notes}
                                    onChange={(val, quill) => handleEditorChange("notes", val, quill)}
                                    className="min-h-[100px] bg-white rounded-md border border-gray-300"
                                />
                            </div>
                            <div className="form-group">
                                <label className="mb-2 block text-sm font-semibold text-gray-700">
                                    Custom Terms
                                </label>
                                <TextEditor
                                    value={formData.customterms}
                                    onChange={(val, quill) => handleEditorChange("customterms", val, quill)}
                                    className="min-h-[150px] bg-white rounded-md border border-gray-300"
                                />
                            </div>
                            <div className="form-group">
                                <label className="mb-2 block text-sm font-semibold text-gray-700">
                                    Statutory Detail
                                </label>
                                <TextEditor
                                    value={formData.statutory}
                                    onChange={(val, quill) => handleEditorChange("statutory", val, quill)}
                                    className="min-h-[150px] bg-white rounded-md border border-gray-300"
                                />
                            </div>
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div className="form-group">
                                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                                        Our Scope of Work
                                    </label>
                                    <TextEditor
                                        value={formData.ourscope}
                                        onChange={(val, quill) => handleEditorChange("ourscope", val, quill)}
                                        className="min-h-[150px] bg-white rounded-md border border-gray-300"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="mb-2 block text-sm font-semibold text-gray-700">
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

                    {/* Footer Actions */}
                    <div className="flex justify-end pt-4">
                        <Button
                            type="submit"
                            disabled={submitting}
                            color="primary"
                            className="h-12 px-12 text-base font-bold shadow-lg transition-all active:scale-95 disabled:opacity-70"
                        >
                            {submitting ? "Updating..." : "Update Quotation"}
                        </Button>
                    </div>
                </form>
            </div>
        </Page>
    );
}