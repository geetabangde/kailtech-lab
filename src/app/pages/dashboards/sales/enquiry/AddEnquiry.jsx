import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import dayjs from "dayjs";
import { Page } from "components/shared/Page";
import { Button } from "components/ui";
import axios from "utils/axios";
import { toast } from "sonner";
import clsx from "clsx";
import Select from "react-select";
import { DatePicker } from "components/shared/form/Datepicker";

export default function AddEnquiry() {
  const navigate = useNavigate();
  const permissions = JSON.parse(localStorage.getItem("userPermissions") || "[]");

  useEffect(() => {
    if (!permissions.includes(91)) {
      navigate("/dashboards");
      toast.error("You don't have permission to add enquiries");
    }
  }, [navigate, permissions]);

  const [loading, setLoading] = useState(false);
  const employeeId = Number(localStorage.getItem("userId") || 0);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    enquiryby: employeeId || "",
    assignto: employeeId || "",
    vertical: "",
    ctype: "",
    customerid: "",
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
  });

  const MODE_OPTIONS = [
    { value: "0", label: "Telephone" },
    { value: "1", label: "Email" },
    { value: "2", label: "Personal" },
    { value: "3", label: "Whatsapp" },
    { value: "4", label: "E-Media" },
    { value: "5", label: "Other (please mention)" },
  ];

  // Dropdown options state
  const [admins, setAdmins] = useState([]);
  const [verticals, setVerticals] = useState([]);
  const [customerTypes, setCustomerTypes] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [showCustomerDetail, setShowCustomerDetail] = useState(false);

  const fetchDropdownData = async () => {
    try {
      // Fetch admins (for enquiry received by and assigned to)
      const adminsRes = await axios.get("/people/get-customer-bd");
      if (adminsRes.data?.data) {
        setAdmins(adminsRes.data.data);
      }

      // Fetch verticals
      const verticalsRes = await axios.get("/master/vertical-list");
      if (verticalsRes.data?.data) {
        setVerticals(verticalsRes.data.data);
      }

      // Fetch customer types
      const customerTypesRes = await axios.get("/people/get-customer-type-list");
      if (customerTypesRes.data?.Data) {
        setCustomerTypes(customerTypesRes.data.Data);
      }

      // Fetch customers
      const customersRes = await axios.get("/people/get-all-customers");
      if (customersRes.data?.data) {
        setCustomers(customersRes.data.data);
      }
    } catch (err) {
      console.error("Error fetching dropdown data:", err);
      toast.error("Failed to load form data");
    }
  };

  // Fetch dropdown data
  useEffect(() => {
    fetchDropdownData();
  }, []);

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
      // Clear customer fields
      setFormData((prev) => ({
        ...prev,
        name: "",
        address: "",
        concernpersonname: "",
        concernpersonmobile: "",
        concernpersondesignation: "",
        concernpersonemail: "",
      }));
    } else if (value && selectedOption) {
      // Fetch customer details
      try {
        const res = await axios.get(`/people/get-customers-address/${value}`);
        // The API returns an array of addresses in 'data'
        if (res.data?.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
          const firstAddr = res.data.data[0];
          setFormData((prev) => ({
            ...prev,
            name: selectedOption.label || "", // Pre-fill with Company Name from dropdown
            address: `${firstAddr.address || ""} ${firstAddr.city || ""} ${firstAddr.pincode || ""}`.trim() || "-",
            concernpersonname: firstAddr.contact_person || "", // Map if available
            concernpersonmobile: firstAddr.mobile || "",
            concernpersondesignation: firstAddr.designation || "",
            concernpersonemail: firstAddr.email || "",
          }));
          setShowCustomerDetail(true);
        } else {
          // Fallback to name only if no address array
          setFormData((prev) => ({
            ...prev,
            name: selectedOption.label || "",
            address: "-",
          }));
          setShowCustomerDetail(true);
        }
      } catch (err) {
        console.error("Error fetching customer details:", err);
      }
    } else {
      setShowCustomerDetail(false);
    }
  };

  const isWebsiteEnquiry = window.location.pathname.includes("website-enquiry");
  const backPath = isWebsiteEnquiry
    ? "/dashboards/sales/website-enquiry"
    : "/dashboards/sales/enquiry";

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation matching PHP logic (bvalidator)
    if (!formData.enquiryby) {
      toast.error("Please select Enquiry Received By");
      return;
    }
    if (!formData.assignto) {
      toast.error("Please select Enquiry Assigned To");
      return;
    }
    if (!formData.vertical) {
      toast.error("Please select Vertical");
      return;
    }
    if (!formData.ctype) {
      toast.error("Please select Customer Type");
      return;
    }
    if (!formData.description) {
      toast.error("Please enter Description");
      return;
    }

    // Validate Contact Details (Mandatory in PHP)
    if (showCustomerDetail) {
      if (!formData.name) {
        toast.error("Please enter Customer Name");
        return;
      }
      if (!formData.address) {
        toast.error("Please enter Customer Address");
        return;
      }
      if (!formData.concernpersonname) {
        toast.error("Please enter Concern Person Name");
        return;
      }
      if (!formData.concernpersonmobile) {
        toast.error("Please enter Concern Person Mobile");
        return;
      }
    }

    if (!formData.approxqty) {
      toast.error("Please enter Approx Qty");
      return;
    }
    if (!formData.remark) {
      toast.error("Please enter Remark");
      return;
    }

    setLoading(true);
    try {
      // Format dates to MM/DD/YYYY for the API as per project standards
      const formattedData = {
        ...formData,
        approxvalue: Number(formData.approxvalue || 0), // Ensure number
        date: formData.date ? dayjs(formData.date).format("MM/DD/YYYY") : "",
        expecteddateforfinalization: formData.expecteddateforfinalization
          ? dayjs(formData.expecteddateforfinalization).format("MM/DD/YYYY")
          : "",
        nextconactdate: formData.nextconactdate
          ? dayjs(formData.nextconactdate).format("MM/DD/YYYY")
          : "",
      };

      const response = await axios.post("/sales/create-enquiry", formattedData);
      if (response.data.status === true || response.data.status === "true") {
        toast.success(response.data.message || "Enquiry created successfully ✅");
        navigate(backPath);
      } else {
        toast.error(response.data.message || "Failed to create enquiry");
      }
    } catch (err) {
      console.error("Error creating enquiry:", err);
      toast.error(err?.response?.data?.message || "Failed to create enquiry ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page title="Add Enquiry">
      <div className="transition-content px-[var(--margin-x)] pb-8">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            Enquiry Form
          </h1>
          <Link to={backPath}>
            <Button
              variant="outline"
              className="text-white bg-blue-600 hover:bg-blue-700"
            >
              &lt;&lt; Back to Enquiry List
            </Button>
          </Link>
        </div>

        {/* Form Card */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-dark-800">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Enquiry Date */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Enquiry Date
              </label>
              <div className="md:col-span-2">
                <DatePicker
                  options={{ dateFormat: "Y-m-d", allowInput: true }}
                  value={formData.date}
                  onChange={([date]) =>
                    setFormData((prev) => ({
                      ...prev,
                      date: date ? dayjs(date).format("YYYY-MM-DD") : "",
                    }))
                  }
                  placeholder="Select Date"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
                />
              </div>
            </div>

            {/* Enquiry Received By */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Enquiry Received By <span className="text-red-500">*</span>
              </label>
              <div className="md:col-span-2">
                <Select
                  options={admins.map((admin) => ({
                    value: admin.id,
                    label: `${admin.firstname} ${admin.lastname}`,
                  }))}
                  value={
                    admins
                      .map((admin) => ({
                        value: admin.id,
                        label: `${admin.firstname} ${admin.lastname}`,
                      }))
                      .find((opt) => String(opt.value) === String(formData.enquiryby)) ||
                    null
                  }
                  onChange={(opt) => handleSelectChange("enquiryby", opt)}
                  placeholder="Select"
                  isSearchable
                />
              </div>
            </div>

            {/* Enquiry Assigned To */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Enquiry Assigned To <span className="text-red-500">*</span>
              </label>
              <div className="md:col-span-2">
                <Select
                  options={admins.map((admin) => ({
                    value: admin.id,
                    label: `${admin.firstname} ${admin.lastname}`,
                  }))}
                  value={
                    admins
                      .map((admin) => ({
                        value: admin.id,
                        label: `${admin.firstname} ${admin.lastname}`,
                      }))
                      .find((opt) => String(opt.value) === String(formData.assignto)) ||
                    null
                  }
                  onChange={(opt) => handleSelectChange("assignto", opt)}
                  placeholder="Select"
                  isSearchable
                />
              </div>
            </div>

            {/* Vertical */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Vertical <span className="text-red-500">*</span>
              </label>
              <div className="md:col-span-2">
                <Select
                  options={verticals.map((v) => ({
                    value: v.id,
                    label: `${v.name} (${v.code})`,
                  }))}
                  value={
                    verticals
                      .map((v) => ({
                        value: v.id,
                        label: `${v.name} (${v.code})`,
                      }))
                      .find((opt) => String(opt.value) === String(formData.vertical)) ||
                    null
                  }
                  onChange={(opt) => handleSelectChange("vertical", opt)}
                  placeholder="Select Vertical"
                  isSearchable
                />
              </div>
            </div>

            {/* Customer Type */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Customer Type <span className="text-red-500">*</span>
              </label>
              <div className="md:col-span-2">
                <Select
                  options={customerTypes.map((type) => ({
                    value: type.id,
                    label: type.name,
                  }))}
                  value={
                    customerTypes
                      .map((type) => ({
                        value: type.id,
                        label: type.name,
                      }))
                      .find((opt) => String(opt.value) === String(formData.ctype)) ||
                    null
                  }
                  onChange={(opt) => handleSelectChange("ctype", opt)}
                  placeholder="Select Customer Type"
                  isSearchable
                />
              </div>
            </div>

            {/* Customer */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Customer
              </label>
              <div className="md:col-span-2">
                <Select
                  options={[
                    { value: "new", label: "New" },
                    ...customers.map((c) => ({ value: c.id, label: c.name })),
                  ]}
                  value={
                    [
                      { value: "new", label: "New" },
                      ...customers.map((c) => ({ value: c.id, label: c.name })),
                    ].find((opt) => String(opt.value) === String(formData.customerid)) ||
                    null
                  }
                  onChange={handleCustomerChange}
                  placeholder="Select Customer"
                  isSearchable
                />
              </div>
            </div>

            {/* Customer Details Section */}
            {showCustomerDetail && (
              <div className="space-y-6 border-t pt-6">
                <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  Customer&apos;s Detail
                </h4>

                {/* Customer Name */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Customer Name
                  </label>
                  <div className="md:col-span-2">
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Customer Name"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
                    />
                  </div>
                </div>

                {/* Customer Address */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 pt-2">
                    Customer Address
                  </label>
                  <div className="md:col-span-2">
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      rows={3}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
                    />
                  </div>
                </div>

                <hr className="border-gray-200 dark:border-gray-700" />

                {/* Concern Person Name */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Concern Person Name <span className="text-red-500">*</span>
                  </label>
                  <div className="md:col-span-2">
                    <input
                      type="text"
                      name="concernpersonname"
                      value={formData.concernpersonname}
                      onChange={handleChange}
                      placeholder="Concern Person Name"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
                    />
                  </div>
                </div>

                {/* Concern Person Mobile */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Concern Person Mobile <span className="text-red-500">*</span>
                  </label>
                  <div className="md:col-span-2">
                    <input
                      type="text"
                      name="concernpersonmobile"
                      value={formData.concernpersonmobile}
                      onChange={handleChange}
                      placeholder="Concern Person Mobile"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
                    />
                  </div>
                </div>

                {/* Concern Person Designation */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Concern Person Designation/Department
                  </label>
                  <div className="md:col-span-2">
                    <input
                      type="text"
                      name="concernpersondesignation"
                      value={formData.concernpersondesignation}
                      onChange={handleChange}
                      placeholder="Concern Person Designation"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
                    />
                  </div>
                </div>

                {/* Concern Person Email */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Concern Person Email
                  </label>
                  <div className="md:col-span-2">
                    <input
                      type="text"
                      name="concernpersonemail"
                      value={formData.concernpersonemail}
                      onChange={handleChange}
                      placeholder="Concern Person Email"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Description */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 pt-2">
                Description of the Enquiry <span className="text-red-500">*</span>
              </label>
              <div className="md:col-span-2">
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows={4}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
                />
              </div>
            </div>

            {/* Mode of Enquiry */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Mode Of Enquiry
              </label>
              <div className="md:col-span-2">
                <Select
                  options={MODE_OPTIONS}
                  value={
                    MODE_OPTIONS.find(
                      (opt) => String(opt.value) === String(formData.modeof)
                    ) || null
                  }
                  onChange={(opt) => handleSelectChange("modeof", opt)}
                  placeholder="Select Mode"
                />
              </div>
            </div>

            {/* If Other */}
            {formData.modeof === "5" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  If Other, Please mention
                </label>
                <div className="md:col-span-2">
                  <input
                    type="text"
                    name="modeother"
                    value={formData.modeother}
                    onChange={handleChange}
                    placeholder="Mode Of Enquiry"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
                  />
                </div>
              </div>
            )}

            {/* Approx Qty */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Approx Qty <span className="text-red-500">*</span>
              </label>
              <div className="md:col-span-2">
                <input
                  type="text"
                  name="approxqty"
                  value={formData.approxqty}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
                />
              </div>
            </div>

            {/* Approx Commercial Value */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Approx Commercial Value of the Enquiry
              </label>
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

            {/* Expected Date for Finalization */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Expected Date of Finalization/Closure
              </label>
              <div className="md:col-span-2">
                <DatePicker
                  options={{ dateFormat: "Y-m-d", allowInput: true }}
                  value={formData.expecteddateforfinalization}
                  onChange={([date]) =>
                    setFormData((prev) => ({
                      ...prev,
                      expecteddateforfinalization: date
                        ? dayjs(date).format("YYYY-MM-DD")
                        : "",
                    }))
                  }
                  placeholder="Select Date"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
                />
              </div>
            </div>

            {/* Details of Action Taken */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Details of the Action Taken
              </label>
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

            {/* Next Time For Contact */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Next Time For Contact
              </label>
              <div className="md:col-span-2">
                <DatePicker
                  options={{ dateFormat: "Y-m-d", allowInput: true }}
                  value={formData.nextconactdate}
                  onChange={([date]) =>
                    setFormData((prev) => ({
                      ...prev,
                      nextconactdate: date ? dayjs(date).format("YYYY-MM-DD") : "",
                    }))
                  }
                  placeholder="Select Date"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
                />
              </div>
            </div>

            {/* Remark */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 pt-2">
                Remark <span className="text-red-500">*</span>
              </label>
              <div className="md:col-span-2">
                <textarea
                  name="remark"
                  value={formData.remark}
                  onChange={handleChange}
                  required
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="submit"
                disabled={loading}
                className={clsx(
                  "!bg-blue-600 !text-white rounded-lg px-8 py-2.5 text-sm font-semibold shadow-md transition hover:!bg-blue-700 active:!bg-blue-800",
                  loading && "opacity-60 cursor-not-allowed"
                )}
                style={{ backgroundColor: '#1d4ed8', color: '#ffffff' }}
              >
                {loading ? "Submitting..." : "Submit"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Page>
  );
}
