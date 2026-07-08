import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import axios from "utils/axios";
import { toast } from "sonner";
import dayjs from "dayjs";
import Select from "react-select";

// Local Imports
import { Page } from "components/shared/Page";
import { Card, Button } from "components/ui";
import { TextEditor, Delta } from "components/shared/form/TextEditor";
import { DatePicker } from "components/shared/form/Datepicker";

// ----------------------------------------------------------------------

export default function CreateQuotationFromEnquiry() {
    const { id } = useParams();
    const navigate = useNavigate();
    const permissions = JSON.parse(localStorage.getItem("userPermissions") || "[]");

    useEffect(() => {
        if (!permissions.includes(94)) {
            navigate("/dashboards/sales/enquiry");
            toast.error("You don't have permission to convert enquiries to quotations");
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
        caddress: "",
        cperson: "",
        ctype: "",
        specificpurpose: "",
        enquirydate: dayjs().format("YYYY-MM-DD"),
        modeof: "0",
        customterms: new Delta(),
        ourscope: new Delta(),
        yourscope: new Delta(),
        enquiry: id,
        vertical: "",
    });

    const [dropdowns, setDropdowns] = useState({
        customers: [],
        customerTypes: [],
        specificPurposes: [],
        countries: [],
        states: [],
        addresses: [],
    });

    const MODE_OPTIONS = [
        { value: "0", label: "Telephone" },
        { value: "1", label: "Email" },
        { value: "2", label: "Personal" },
        { value: "3", label: "Whatsapp" },
        { value: "4", label: "E-Media" },
        { value: "5", label: "Other (please mention)" },
    ];

    const fetchInitialData = useCallback(async () => {
        try {
            setLoading(true);
            const [enqRes, custRes, typeRes, purposeRes, countryRes] = await Promise.all([
                axios.get(`/sales/get-enquiry-byid`, { params: { id } }),
                axios.get("/people/get-all-customers"),
                axios.get("/people/get-customer-type-list"),
                axios.get("/people/get-specific-purpose-list"),
                axios.get("/people/get-country"),
            ]);

            const mapRes = (res) => res?.data?.Data ?? res?.data?.data ?? [];
            const dropdownData = {
                customers: mapRes(custRes),
                customerTypes: mapRes(typeRes),
                specificPurposes: mapRes(purposeRes),
                countries: mapRes(countryRes),
            };

            setDropdowns((prev) => ({ ...prev, ...dropdownData }));

            const enq = enqRes.data?.data?.[0];
            if (!enq) {
                toast.error("Enquiry not found");
                navigate("/dashboards/sales/enquiry");
                return;
            }

            const initialVertical = String(enq.vertical || "");
            const mappedCustomer = enq.customerid && enq.customerid !== "0" ? String(enq.customerid) : "new";

            let finalData = {
                vertical: initialVertical,
                customer: mappedCustomer,
                customername: enq.name || "",
                customeraddress: enq.address || "",
                contactpersonname: enq.concernpersonname || "",
                concernpersondesignation: enq.concernpersondesignation || "",
                concernpersonemail: enq.concernpersonemail || "",
                concernpersonmobile: enq.concernpersonmobile || "",
                enquirydate: enq.date ? dayjs(enq.date).format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD"),
                modeof: String(enq.modeof || "0"),
                ctype: String(enq.ctype || ""),
                specificpurpose: String(enq.specificpurpose || ""),
                customterms: String(enq.vertical) === "1" 
                    ? new Delta().insert(`1. Equipments which are possible to be calibrated at Site, will be done at site. Rest equipments will be calibrated at our Lab at Indore (M.P.).\n2. Payment terms: Advance.\n3. Cross Cheque/DD should be drawn in favor of Company Name Payable at Indore.\n4. Please attach bill details indicating Invoice No. & TDS deductions if any along with your payment.\n5. If the payment is to be paid in Cash pay to UPI 0795933A0099960.bqr@kotak only and take official receipt. Else claim of payment, shall not be accepted\n6. Subject to exclusive jurisdiction of courts at Indore only.\n7. Errors & omissions accepted.\n`)
                    : (["2", "3"].includes(String(enq.vertical)) ? new Delta().insert(`Kindly arrange to provide 100% advance payment.\n`) : new Delta()),
                customterms_html: String(enq.vertical) === "1" 
                    ? `<p>1. Equipments which are possible to be calibrated at Site, will be done at site. Rest equipments will be calibrated at our Lab at Indore (M.P.).</p><p>2. Payment terms: Advance.</p><p>3. Cross Cheque/DD should be drawn in favor of Company Name Payable at Indore.</p><p>4. Please attach bill details indicating Invoice No. & TDS deductions if any along with your payment.</p><p>5. If the payment is to be paid in Cash pay to UPI 0795933A0099960.bqr@kotak only and take official receipt. Else claim of payment, shall not be accepted</p><p>6. Subject to exclusive jurisdiction of courts at Indore only.</p><p>7. Errors & omissions accepted.</p>`
                    : (["2", "3"].includes(String(enq.vertical)) ? `<p>Kindly arrange to provide 100% advance payment.</p>` : ""),
                ourscope: new Delta(),
                ourscope_html: "",
                yourscope: new Delta(),
                yourscope_html: "",
            };

            // Attempt to enrich with Quotation Data (ID 2185)
            try {
                const quotRes = await axios.get(`/sales/get-quotation-item/${id}`);
                if (quotRes.data?.status && quotRes.data.quotation?.length > 0) {
                    const q = quotRes.data.quotation[0];

                    const [custDetail] = await Promise.all([
                        q.customer ? axios.get(`/people/get-single-customer/${q.customer}`).catch(() => null) : null,
                        q.ctype ? axios.get(`/people/get-customer-type-byid/${q.ctype}`).catch(() => null) : null,
                        q.specificpurpose ? axios.get(`/people/get-specific-purpose-byid/${q.specificpurpose}`).catch(() => null) : null,
                    ]);

                    const cDetail = custDetail?.data?.data;

                    if (cDetail) {
                        // Ensure the customer is in the dropdown list
                        setDropdowns(prev => {
                            if (!prev.customers.find(c => String(c.id) === String(cDetail.id))) {
                                return { ...prev, customers: [...prev.customers, cDetail] };
                            }
                            return prev;
                        });
                    }

                    finalData = {
                        ...finalData,
                        customer: String(q.customer || finalData.customer),
                        customername: cDetail?.name || q.customername || finalData.customername,
                        customeraddress: cDetail?.address || q.customeraddress || finalData.customeraddress,
                        contactpersonname: cDetail?.pname || q.contactpersonname || finalData.contactpersonname,
                        concernpersondesignation: q.concernpersondesignation || finalData.concernpersondesignation,
                        concernpersonemail: cDetail?.email || q.concernpersonemail || finalData.concernpersonemail,
                        concernpersonmobile: cDetail?.pnumber || q.concernpersonmobile || finalData.concernpersonmobile,
                        gstno: cDetail?.gstno || q.gstno || "",
                        country: String(cDetail?.country || q.country || ""),
                        state: String(cDetail?.stateid || q.stateid || q.state || cDetail?.state || ""),
                        caddress: String(q.caddress || ""),
                        cperson: String(q.cperson || ""),
                        ctype: String(q.ctype || finalData.ctype),
                        specificpurpose: String(q.specificpurpose || finalData.specificpurpose),
                        modeof: String(q.modeof || finalData.modeof),
                        enquirydate: q.enquirydate ? dayjs(q.enquirydate).format("YYYY-MM-DD") : finalData.enquirydate,
                        customterms: q.customterms ? new Delta().insert(q.customterms.replace(/<[^>]*>?/gm, '')) : finalData.customterms,
                        customterms_html: q.customterms || finalData.customterms_html,
                        ourscope: q.ourscope ? new Delta().insert(q.ourscope.replace(/<[^>]*>?/gm, '')) : new Delta(),
                        ourscope_html: q.ourscope || "",
                        yourscope: q.yourscope ? new Delta().insert(q.yourscope.replace(/<[^>]*>?/gm, '')) : new Delta(),
                        yourscope_html: q.yourscope || "",
                    };
                }
            } catch {
                console.warn("Quotation data enrichment failed; using enquiry defaults.");
            }

            setFormData((prev) => ({ ...prev, ...finalData }));

            if (finalData.customer !== "new") {
                fetchCustomerExtras(finalData.customer, finalData.customeraddress);
            }

        } catch (err) {
            console.error("Error fetching conversion data:", err);
            toast.error("Failed to initialize conversion form");
        } finally {
            setLoading(false);
        }
    }, [id, navigate]);

    const fetchStates = async (countryId) => {
        try {
            const res = await axios.get("/people/get-state", { params: { country: countryId } });
            setDropdowns(prev => ({ ...prev, states: res.data?.Data ?? res.data?.data ?? [] }));
        } catch (err) {
            console.error("Error fetching states:", err);
        }
    };

    const fetchCustomerExtras = async (customerId, enquiryAddress = "") => {
        try {
            const [addrRes, custRes] = await Promise.all([
                axios.get(`/people/get-customers-address/${customerId}`).catch(() => null),
                axios.get(`/people/get-single-customer/${customerId}`).catch(() => null),
            ]);
            const mapRes = (res) => res?.data?.Data ?? res?.data?.data ?? [];
            const addresses = mapRes(addrRes);
            const cDetail = custRes?.data?.data;

            setDropdowns((prev) => ({
                ...prev,
                addresses,
                ...(cDetail && !prev.customers.find(c => String(c.id) === String(cDetail.id))
                    ? { customers: [...prev.customers, cDetail] }
                    : {})
            }));

            if (cDetail) {
                setFormData(prev => ({
                    ...prev,
                    customername: cDetail.name || prev.customername,
                    gstno: cDetail.gstno || prev.gstno,
                    country: String(cDetail.country || prev.country),
                    state: String(cDetail.stateid || cDetail.state || prev.state),
                }));

                if (String(cDetail.country) === "1") {
                    fetchStates(cDetail.country);
                }
            }

            if (enquiryAddress && addresses.length > 0) {
                const match = addresses.find(a =>
                    a.address?.toLowerCase().includes(enquiryAddress.toLowerCase()) ||
                    enquiryAddress.toLowerCase().includes(a.address?.toLowerCase())
                );
                if (match) {
                    setFormData(prev => ({ ...prev, caddress: String(match.id) }));
                }
            } else if (addresses.length > 0) {
                setFormData(prev => ({ ...prev, caddress: String(addresses[0].id) }));
            }

        } catch (err) {
            console.error("Error fetching customer extras:", err);
        }
    };

    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name, val) => {
        setFormData((prev) => ({ ...prev, [name]: val }));
        if (name === "customer") {
            if (val !== "new") {
                fetchCustomerExtras(val);
            }
        }
        if (name === "country") {
            if (val === "1") {
                fetchStates(val);
            } else {
                setFormData(prev => ({ ...prev, state: "" }));
            }
        }
    };

    const handleEditorChange = (name, delta, quill) => {
        setFormData(prev => ({ 
            ...prev, 
            [name]: delta,
            [`${name}_html`]: quill?.root?.innerHTML || ""
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        // Prepare the payload according to the requested format
        const payload = {
            customer: formData.customer === "new" ? "new" : Number(formData.customer),
            caddress: formData.caddress ? Number(formData.caddress) : 0,
            cperson: formData.cperson ? Number(formData.cperson) : 0,
            ctype: formData.ctype ? Number(formData.ctype) : 0,
            specificpurpose: Number(formData.specificpurpose || 0),
            enquirydate: dayjs(formData.enquirydate).format("DD/MM/YYYY"),
            modeof: Number(formData.modeof),
            // Convert rich text Delta to plain text for the backend if needed, 
            // or send as is if the backend handles Delta/HTML.
            // Given the example, we'll try to send the text content.
            customterms: formData.customterms_html || (typeof formData.customterms === 'string' ? formData.customterms : ""),
            ourscope: formData.ourscope_html || (typeof formData.ourscope === 'string' ? formData.ourscope : ""),
            yourscope: formData.yourscope_html || (typeof formData.yourscope === 'string' ? formData.yourscope : ""),
            enquiry: Number(id),
            vertical: Number(formData.vertical),
        };

        // If it's a new customer, we might need to include the extra fields
        if (formData.customer === "new") {
            Object.assign(payload, {
                customername: formData.customername,
                customeraddress: formData.customeraddress,
                gstno: formData.gstno,
                country: Number(formData.country),
                state: formData.state,
                contactpersonname: formData.contactpersonname,
                concernpersondesignation: formData.concernpersondesignation,
                concernpersonemail: formData.concernpersonemail,
                concernpersonmobile: formData.concernpersonmobile,
            });
        }

        try {
            const res = await axios.post("/sales/create-quotation", payload);
            if (res.data.status === true || res.data.status === "true") {
                toast.success(res.data.message || "New Quotation has been Added ✅");

                // Determine navigation based on vertical
                // (1: Calibration, Others: Testing, as per common project pattern)
                const baseRoute = String(formData.vertical) === "1" ? "calibration-quotations" : "testing-quotations";
                navigate(`/dashboards/sales/${baseRoute}/items/${res.data.quotation_id}`);
            } else {
                toast.error(res.data.message || "Failed to create quotation");
            }
        } catch (err) {
            console.error("Submission Error:", err);
            toast.error("An error occurred while creating quotation");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <Page title="Converting Enquiry...">
                <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
                    <p className="font-medium text-gray-500">Preparing quotation workspace...</p>
                </div>
            </Page>
        );
    }

    const isNew = formData.customer === "new";

    return (
        <Page title="Convert Enquiry to Quotation">
            <div className="transition-content px-[var(--margin-x)] pb-8">
                {/* Header */}
                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                            Add New Quotation
                        </h1>
                        <p className="text-xs font-medium text-gray-500">
                            Originating from Enquiry #{id}
                        </p>
                    </div>
                    <Link to="/dashboards/sales/enquiry">
                        <Button
                            variant="outline"
                            className="text-white bg-blue-600 hover:bg-blue-700"
                        >
                            &lt;&lt; Back to Enquiry List
                        </Button>
                    </Link>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Card className="p-6">
                        <div className="space-y-6">
                            {/* Customer Profile Selection */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    Customer Name <span className="text-red-500">*</span>
                                </label>
                                <div className="md:col-span-2">
                                    <Select
                                        options={[
                                            { value: "new", label: "New Customer" },
                                            ...dropdowns.customers.map(c => ({ value: String(c.id), label: c.name }))
                                        ]}
                                        value={[
                                            { value: "new", label: "New Customer" },
                                            ...dropdowns.customers.map(c => ({ value: String(c.id), label: c.name }))
                                        ].find(opt => opt.value === formData.customer)}
                                        onChange={(opt) => handleSelectChange("customer", opt?.value)}
                                        placeholder="Select"
                                        isSearchable
                                    />
                                </div>
                            </div>

                            {isNew ? (
                                <>
                                    <hr className="border-gray-200 dark:border-gray-700" />
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Customer Name</label>
                                        <div className="md:col-span-2">
                                            <input
                                                name="customername"
                                                required
                                                value={formData.customername}
                                                onChange={handleChange}
                                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 pt-2">Customer Address</label>
                                        <div className="md:col-span-2">
                                            <textarea
                                                name="customeraddress"
                                                required
                                                value={formData.customeraddress}
                                                onChange={handleChange}
                                                rows={2}
                                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Contact Person Name</label>
                                        <div className="md:col-span-2">
                                            <input
                                                name="contactpersonname"
                                                required
                                                value={formData.contactpersonname}
                                                onChange={handleChange}
                                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Contact Person Designation</label>
                                        <div className="md:col-span-2">
                                            <input
                                                name="concernpersondesignation"
                                                value={formData.concernpersondesignation}
                                                onChange={handleChange}
                                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Contact Person Email</label>
                                        <div className="md:col-span-2">
                                            <input
                                                type="email"
                                                name="concernpersonemail"
                                                value={formData.concernpersonemail}
                                                onChange={handleChange}
                                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Contact Person Mobile</label>
                                        <div className="md:col-span-2">
                                            <input
                                                name="concernpersonmobile"
                                                value={formData.concernpersonmobile}
                                                onChange={handleChange}
                                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">GST NO</label>
                                        <div className="md:col-span-2">
                                            <input
                                                name="gstno"
                                                value={formData.gstno}
                                                onChange={handleChange}
                                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Country <span className="text-red-500">*</span></label>
                                        <div className="md:col-span-2">
                                            <Select
                                                options={dropdowns.countries.map(c => ({ value: String(c.id), label: c.country_name }))}
                                                value={dropdowns.countries.map(c => ({ value: String(c.id), label: c.country_name })).find(opt => opt.value === formData.country)}
                                                onChange={(opt) => handleSelectChange("country", opt?.value)}
                                                placeholder="Choose one.."
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">State <span className="text-red-500">*</span></label>
                                        <div className="md:col-span-2">
                                            {formData.country === "1" ? (
                                                <Select
                                                    options={dropdowns.states.map(s => ({ value: String(s.id), label: s.name }))}
                                                    value={dropdowns.states.map(s => ({ value: String(s.id), label: s.name })).find(opt => opt.value === formData.state)}
                                                    onChange={(opt) => handleSelectChange("state", opt?.value)}
                                                    placeholder="Select State"
                                                />
                                            ) : (
                                                <input
                                                    name="state"
                                                    value={formData.state}
                                                    onChange={handleChange}
                                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
                                                    placeholder="Enter State"
                                                />
                                            )}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <hr className="border-gray-200 dark:border-gray-700" />
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Customer Address</label>
                                        <div className="md:col-span-2">
                                            <Select
                                                options={dropdowns.addresses.map(a => ({ value: String(a.id), label: `${a.name} (${a.address})` }))}
                                                value={dropdowns.addresses.map(a => ({ value: String(a.id), label: `${a.name} (${a.address})` })).find(opt => opt.value === formData.caddress)}
                                                onChange={(opt) => handleSelectChange("caddress", opt?.value)}
                                                placeholder="Choose address"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Contact Person Name</label>
                                        <div className="md:col-span-2">
                                            <input
                                                readOnly
                                                value={formData.contactpersonname || "Not specified"}
                                                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500 outline-none dark:border-gray-700 dark:bg-gray-900"
                                            />
                                            <p className="text-[10px] text-gray-400 mt-1 italic">Linked from Enquiry details</p>
                                        </div>
                                    </div>
                                </>
                            )}

                            <hr className="border-gray-200 dark:border-gray-700" />

                            {/* Customer Type */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    Customer Type <span className="text-red-500">*</span>
                                </label>
                                <div className="md:col-span-2">
                                    <Select
                                        options={dropdowns.customerTypes.map(t => ({ value: String(t.id), label: t.name }))}
                                        value={dropdowns.customerTypes.map(t => ({ value: String(t.id), label: t.name })).find(opt => opt.value === formData.ctype)}
                                        onChange={(opt) => handleSelectChange("ctype", opt?.value)}
                                        placeholder="Select Type"
                                    />
                                </div>
                            </div>

                            <hr className="border-gray-200 dark:border-gray-700" />

                            {/* Specific Purpose */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    Specific Purpose <span className="text-red-500">*</span>
                                </label>
                                <div className="md:col-span-2">
                                    <Select
                                        options={dropdowns.specificPurposes.map(p => ({ value: String(p.id), label: p.name }))}
                                        value={dropdowns.specificPurposes.map(p => ({ value: String(p.id), label: p.name })).find(opt => opt.value === formData.specificpurpose)}
                                        onChange={(opt) => handleSelectChange("specificpurpose", opt?.value)}
                                        placeholder="Select Purpose"
                                    />
                                </div>
                            </div>

                            {/* Enquiry Date */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    Enquiry Date <span className="text-red-500">*</span>
                                </label>
                                <div className="md:col-span-2">
                                    <DatePicker
                                        options={{ dateFormat: "Y-m-d", allowInput: true }}
                                        value={formData.enquirydate}
                                        onChange={([date]) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                enquirydate: date ? dayjs(date).format("YYYY-MM-DD") : "",
                                            }))
                                        }
                                        placeholder="Select Date"
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
                                    />
                                </div>
                            </div>

                            {/* Mode Of Enquiry */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    Mode Of Enquiry <span className="text-red-500">*</span>
                                </label>
                                <div className="md:col-span-2">
                                    <Select
                                        options={MODE_OPTIONS}
                                        value={MODE_OPTIONS.find(opt => opt.value === formData.modeof)}
                                        onChange={(opt) => handleSelectChange("modeof", opt?.value)}
                                    />
                                </div>
                            </div>

                            <hr className="border-gray-200 dark:border-gray-700" />

                            {/* Terms */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Custom Terms</label>
                                <TextEditor
                                    value={formData.customterms}
                                    onChange={(val, quill) => handleEditorChange("customterms", val, quill)}
                                    className="min-h-[150px] border rounded-lg overflow-hidden"
                                />
                            </div>


                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Our Scope of Work</label>
                                <TextEditor
                                    value={formData.ourscope}
                                    onChange={(val, quill) => handleEditorChange("ourscope", val, quill)}
                                    className="min-h-[120px] border rounded-lg overflow-hidden"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Your Scope of Work</label>
                                <TextEditor
                                    value={formData.yourscope}
                                    onChange={(val, quill) => handleEditorChange("yourscope", val, quill)}
                                    className="min-h-[120px] border rounded-lg overflow-hidden"
                                />
                            </div>
                        </div>


                        {/* Footer */}
                        <div className="flex items-center justify-between pt-8 mt-8 border-t border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-2">
                                <div className={`h-2 w-2 rounded-full ${String(formData.vertical) === '1' ? 'bg-green-500' : 'bg-blue-500'}`} />
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Vertical: {String(formData.vertical) === '1' ? 'Calibration' : 'Testing'}
                                </span>
                            </div>
                            <Button
                                type="submit"
                                color="success"
                                className="px-8 h-10 text-sm font-semibold shadow-md active:scale-95 transition-transform"
                                disabled={submitting}
                                style={{ backgroundColor: '#16a34a', color: '#ffffff' }}
                            >
                                {submitting ? "Creating..." : "Proceed to add Quotation Items"}
                            </Button>
                        </div>
                    </Card>
                </form>
            </div>
        </Page>
    );
}
