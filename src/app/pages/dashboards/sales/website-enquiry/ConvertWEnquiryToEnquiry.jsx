import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import dayjs from "dayjs";
import { Page } from "components/shared/Page";
import { Button } from "components/ui";
import axios from "utils/axios";
import { toast } from "sonner";
import clsx from "clsx";
import Select from "react-select";
import { DatePicker } from "components/shared/form/Datepicker";

// ----------------------------------------------------------------------

export default function ConvertWEnquiryToEnquiry() {
  const { id } = useParams();
  const navigate = useNavigate();
  const permissions = JSON.parse(localStorage.getItem("userPermissions") || "[]");

  useEffect(() => {
    if (!permissions.includes(385)) {
      navigate("/dashboards");
    }
  }, [navigate, permissions]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const employeeId = Number(localStorage.getItem("userId") || 0);

  const [formData, setFormData] = useState({
    date: dayjs().format("YYYY-MM-DD"),
    enquiryby: employeeId || "",
    assignto: employeeId || "",
    vertical: "",
    ctype: "",
    customerid: "new",
    name: "",
    address: "",
    concernpersonname: "",
    concernpersonmobile: "",
    concernpersondesignation: "",
    concernpersonemail: "",
    description: "",
    modeof: "0",
    modeother: "",
    approxqty: "",
    approxvalue: "",
    expecteddateforfinalization: "",
    action: "",
    nextconactdate: "",
    remark: "",
    weid: id, // Website Enquiry ID
  });

  const MODE_OPTIONS = [
    { value: "0", label: "Telephone" },
    { value: "1", label: "Email" },
    { value: "2", label: "Personal" },
    { value: "3", label: "Whatsapp" },
    { value: "4", label: "E-Media" },
    { value: "5", label: "Other (please mention)" },
  ];

  const [admins, setAdmins] = useState([]);
  const [verticals, setVerticals] = useState([]);
  const [customerTypes, setCustomerTypes] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [showCustomerDetail, setShowCustomerDetail] = useState(true);

  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);
      const [adminsRes, verticalsRes, typeRes, customersRes, websiteEnqRes] = await Promise.all([
        axios.get("/people/get-customer-bd"),
        axios.get("/master/vertical-list"),
        axios.get("/people/get-customer-type-list"),
        axios.get("/people/get-all-customers"),
        axios.get(`/sales/get-websiteenquiry-list`), // We fetch the list and filter since no single fetch-by-id is known
      ]);

      setAdmins(adminsRes.data?.data || []);
      setVerticals(verticalsRes.data?.data || []);
      setCustomerTypes(typeRes.data?.Data || typeRes.data?.data || []);
      setCustomers(customersRes.data?.data || []);

      // Find the specific website enquiry from the list
      const websiteEnqList = websiteEnqRes.data?.data || [];
      const enq = websiteEnqList.find(item => String(item.id) === String(id));

      if (enq) {
        setFormData(prev => ({
          ...prev,
          date: enq.added_on ? dayjs(enq.added_on).format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD"),
          name: enq.organization || "",
          concernpersonname: enq.name || "",
          concernpersonmobile: enq.mobile || "",
          concernpersonemail: enq.email || "",
          description: enq.message || "",
        }));
      } else {
        toast.error("Website Enquiry not found");
        navigate("/dashboards/sales/website-enquiry");
      }
    } catch (err) {
      console.error("Error fetching conversion data:", err);
      toast.error("Failed to initialize form");
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, selectedOption) => {
    setFormData((prev) => ({
      ...prev,
      [name]: selectedOption ? selectedOption.value : "",
    }));
  };

  const handleCustomerChange = async (selectedOption) => {
    const value = selectedOption ? selectedOption.value : "";
    setFormData((prev) => ({ ...prev, customerid: value }));

    if (value === "new") {
      setShowCustomerDetail(true);
    } else if (value && selectedOption) {
      try {
        const res = await axios.get(`/people/get-customers-address/${value}`);
        if (res.data?.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
          const firstAddr = res.data.data[0];
          setFormData((prev) => ({
            ...prev,
            name: selectedOption.label || "",
            address: `${firstAddr.address || ""} ${firstAddr.city || ""} ${firstAddr.pincode || ""}`.trim() || "-",
            concernpersonname: firstAddr.contact_person || "",
            concernpersonmobile: firstAddr.mobile || "",
            concernpersondesignation: firstAddr.designation || "",
            concernpersonemail: firstAddr.email || "",
          }));
        }
        setShowCustomerDetail(true);
      } catch (err) {
        console.error("Error fetching customer details:", err);
      }
    } else {
      setShowCustomerDetail(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.enquiryby || !formData.assignto || !formData.vertical || !formData.ctype || !formData.description) {
      toast.error("Please fill all required fields");
      return;
    }

    setSubmitting(true);
    try {
      const formattedData = {
        ...formData,
        approxvalue: Number(formData.approxvalue || 0),
        date: formData.date ? dayjs(formData.date).format("MM/DD/YYYY") : "",
        expecteddateforfinalization: formData.expecteddateforfinalization
          ? dayjs(formData.expecteddateforfinalization).format("MM/DD/YYYY")
          : "",
        nextconactdate: formData.nextconactdate
          ? dayjs(formData.nextconactdate).format("MM/DD/YYYY")
          : "",
        status: 1, // Marks it as converted/active
      };

      const response = await axios.post("/sales/create-enquiry", formattedData);
      if (response.data.status === true || response.data.status === "true") {
        toast.success(response.data.message || "Converted to Enquiry successfully ✅");
        navigate("/dashboards/sales/enquiry");
      } else {
        toast.error(response.data.message || "Failed to convert enquiry");
      }
    } catch (err) {
      console.error("Conversion Error:", err);
      toast.error(err?.response?.data?.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Page title="Converting Website Enquiry...">
        <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="font-medium text-gray-500">Preparing enquiry workspace...</p>
        </div>
      </Page>
    );
  }

  return (
    <Page title="Convert Website Enquiry to Enquiry">
      <div className="transition-content px-[var(--margin-x)] pb-8">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            Enquiry Form (Conversion)
          </h1>
          <Link to="/dashboards/sales/website-enquiry">
            <Button
              variant="outline"
              className="text-white bg-blue-600 hover:bg-blue-700"
            >
              &lt;&lt; Back to Enquiry List
            </Button>
          </Link>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-dark-800">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Section 1: Enquiry Details */}
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Enquiry Date</label>
                <div className="md:col-span-2">
                  <DatePicker
                    options={{ dateFormat: "Y-m-d", allowInput: true }}
                    value={formData.date}
                    onChange={([date]) => setFormData(prev => ({ ...prev, date: date ? dayjs(date).format("YYYY-MM-DD") : "" }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Enquiry Received By *</label>
                <div className="md:col-span-2">
                  <Select
                    options={admins.map(a => ({ value: a.id, label: `${a.firstname} ${a.lastname}` }))}
                    value={admins.map(a => ({ value: a.id, label: `${a.firstname} ${a.lastname}` })).find(opt => String(opt.value) === String(formData.enquiryby))}
                    onChange={opt => handleSelectChange("enquiryby", opt)}
                    placeholder="Select"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Enquiry Assigned To *</label>
                <div className="md:col-span-2">
                  <Select
                    options={admins.map(a => ({ value: a.id, label: `${a.firstname} ${a.lastname}` }))}
                    value={admins.map(a => ({ value: a.id, label: `${a.firstname} ${a.lastname}` })).find(opt => String(opt.value) === String(formData.assignto))}
                    onChange={opt => handleSelectChange("assignto", opt)}
                    placeholder="Select"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Vertical *</label>
                <div className="md:col-span-2">
                  <Select
                    options={verticals.map(v => ({ value: v.id, label: `${v.name} (${v.code})` }))}
                    value={verticals.map(v => ({ value: v.id, label: `${v.name} (${v.code})` })).find(opt => String(opt.value) === String(formData.vertical))}
                    onChange={opt => handleSelectChange("vertical", opt)}
                    placeholder="Select Vertical"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Customer Type *</label>
                <div className="md:col-span-2">
                  <Select
                    options={customerTypes.map(t => ({ value: t.id, label: t.name }))}
                    value={customerTypes.map(t => ({ value: t.id, label: t.name })).find(opt => String(opt.value) === String(formData.ctype))}
                    onChange={opt => handleSelectChange("ctype", opt)}
                    placeholder="Select Customer Type"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Customer</label>
                <div className="md:col-span-2">
                  <Select
                    options={[
                      { value: "new", label: "New" },
                      ...customers.map(c => ({ value: c.id, label: c.name }))
                    ]}
                    value={[
                      { value: "new", label: "New" },
                      ...customers.map(c => ({ value: c.id, label: c.name }))
                    ].find(opt => String(opt.value) === String(formData.customerid))}
                    onChange={handleCustomerChange}
                    placeholder="Select Customer"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Customer Details */}
            {showCustomerDetail && (
              <div className="space-y-6 border-t pt-6">
                <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Customer&apos;s Detail</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Customer Name</label>
                  <div className="md:col-span-2">
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 pt-2">Customer Address</label>
                  <div className="md:col-span-2">
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      rows={2}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
                    />
                  </div>
                </div>

                <hr className="border-gray-200 dark:border-gray-700" />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Concern Person Name *</label>
                  <div className="md:col-span-2">
                    <input
                      type="text"
                      name="concernpersonname"
                      value={formData.concernpersonname}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Concern Person Mobile *</label>
                  <div className="md:col-span-2">
                    <input
                      type="text"
                      name="concernpersonmobile"
                      value={formData.concernpersonmobile}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Designation/Department</label>
                  <div className="md:col-span-2">
                    <input
                      type="text"
                      name="concernpersondesignation"
                      value={formData.concernpersondesignation}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Email</label>
                  <div className="md:col-span-2">
                    <input
                      type="email"
                      name="concernpersonemail"
                      value={formData.concernpersonemail}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Section 3: Professional Details */}
            <div className="space-y-6 border-t pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 pt-2">Description of Enquiry *</label>
                <div className="md:col-span-2">
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Mode of Enquiry</label>
                <div className="md:col-span-2">
                  <Select
                    options={MODE_OPTIONS}
                    value={MODE_OPTIONS.find(opt => String(opt.value) === String(formData.modeof))}
                    onChange={opt => handleSelectChange("modeof", opt)}
                  />
                </div>
              </div>

              {formData.modeof === "5" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center animate-in fade-in slide-in-from-top-1">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">If Other, Mention</label>
                  <div className="md:col-span-2">
                    <input
                      type="text"
                      name="modeother"
                      value={formData.modeother}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Approx Qty *</label>
                <div className="md:col-span-2">
                  <input
                    type="text"
                    name="approxqty"
                    value={formData.approxqty}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Approx Commercial Value</label>
                <div className="md:col-span-2">
                  <input
                    type="number"
                    name="approxvalue"
                    value={formData.approxvalue}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Expected Closure Date</label>
                <div className="md:col-span-2">
                  <DatePicker
                    options={{ dateFormat: "Y-m-d", allowInput: true }}
                    value={formData.expecteddateforfinalization}
                    onChange={([date]) => setFormData(prev => ({ ...prev, expecteddateforfinalization: date ? dayjs(date).format("YYYY-MM-DD") : "" }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Action Taken</label>
                <div className="md:col-span-2">
                  <input
                    type="text"
                    name="action"
                    value={formData.action}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Next Contact Date</label>
                <div className="md:col-span-2">
                  <DatePicker
                    options={{ dateFormat: "Y-m-d", allowInput: true }}
                    value={formData.nextconactdate}
                    onChange={([date]) => setFormData(prev => ({ ...prev, nextconactdate: date ? dayjs(date).format("YYYY-MM-DD") : "" }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 pt-2">Remark *</label>
                <div className="md:col-span-2">
                  <textarea
                    name="remark"
                    value={formData.remark}
                    onChange={handleChange}
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="submit"
                disabled={submitting}
                className={clsx(
                  "!bg-blue-600 !text-white rounded-lg px-8 py-2.5 text-sm font-semibold shadow-md transition hover:!bg-blue-700 active:scale-95",
                  submitting && "opacity-60 cursor-not-allowed"
                )}
                style={{ backgroundColor: '#1d4ed8', color: '#ffffff' }}
              >
                {submitting ? "Processing..." : "Submit & Convert"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Page>
  );
}
