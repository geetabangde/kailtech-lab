import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "utils/axios";
import { Page } from "components/shared/Page";
import { Card, Button, Input, ReactSelect as Select } from "components/ui";
import { toast } from "sonner";
import clsx from "clsx";
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
import {
  ClipboardIcon,
  PhoneIcon,
  IdentificationIcon,
  UserGroupIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";

export default function OrganisationSetting() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [accountTypes, setAccountTypes] = useState([]);

  const [formData, setFormData] = useState({
    // General
    company_name: "",
    short_name: "",
    phone: "",
    website: "",
    gst_no: "",
    email: "",
    address_1: "",
    city: "",
    country_id: "",
    state: "",
    indian_state: "",
    pincode: "",
    company_logo: "",
    favicon_url: "",
    logo_upload: null,
    favicon: null,
    // Bank
    bank_name: "",
    account_name: "",
    account_type_id: "",
    account_number: "",
    micr_no: "",
    ifsc_code: "",
    swift_code: "",
    branch_name: "",
    // Details
    gumasta_no: "",
    msme_no: "",
    sme_no: "",
    cin_no: "",
    hsn_code: "",
    sac_code: "",
    tan_no: "",
    pan_no: "",
  });

  const permissions =
    localStorage.getItem("userPermissions")?.split(",").map(Number) || [];

  useEffect(() => {
    if (!permissions.includes(377)) {
      navigate("/");
      return;
    }
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);

      const res = await axios.get("/rolemanagment/get-company-setting");
      console.log("Full Settings Response:", res.data);

      if (res.data && (res.data.status === true || res.data.status === "true")) {
        const d = res.data.data;

        // 1. Populate Dropdowns
        if (d.countries) {
          setCountries(d.countries.map(c => ({ label: c.country_name || c.name, value: c.id })));
        }
        if (d.states) {
          setStates(d.states.map(s => ({ label: s.state, value: s.id })));
        }
        if (d.account_types) {
          setAccountTypes(d.account_types.map(t => ({ label: t.name, value: t.id })));
        }

        // 2. Populate Company Info
        const companyDetail = d.company_detail || {};
        setFormData({
          // Company / General
          company_name: companyDetail.company_name || "",
          short_name: companyDetail.short_name || "",
          phone: companyDetail.phone || "",
          website: companyDetail.website || "",
          gst_no: companyDetail.gst_no || "",
          email: companyDetail.email || "",
          address_1: companyDetail.address_1 || "",
          city: companyDetail.city || "",
          country_id: companyDetail.country_id || "",
          state: companyDetail.state || "",
          indian_state: companyDetail.indian_state || "",
          pincode: companyDetail.pincode || "",
          // Branding
          company_logo: d.logo_url || "",
          favicon_url: d.favicon_url || "",
          logo_upload: null,
          favicon: null,
          // Bank
          bank_name: companyDetail.bank_name || "",
          account_name: companyDetail.account_name || "",
          account_type_id: companyDetail.account_type_id || "",
          account_number: companyDetail.account_number || "",
          micr_no: companyDetail.micr_no || "",
          ifsc_code: companyDetail.ifsc_code || "",
          swift_code: companyDetail.swift_code || "",
          branch_name: companyDetail.branch_name || "",
          // Details
          gumasta_no: companyDetail.gumasta_no || "",
          msme_no: companyDetail.msme_no || "",
          sme_no: companyDetail.sme_no || "",
          cin_no: companyDetail.cin_no || "",
          hsn_code: companyDetail.hsn_code || "",
          sac_code: companyDetail.sac_code || "",
          tan_no: companyDetail.tan_no || "",
          pan_no: companyDetail.pan_no || "",
        });
      } else {
        console.warn("Settings API returned non-success status:", res.data);
        toast.error(res.data.message || "Failed to load settings data");
      }
    } catch (err) {
      console.error("Critical error in fetchInitialData:", err);
      toast.error("Failed to load settings data");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      const file = files[0];
      setFormData((prev) => ({ ...prev, [name]: file }));

      // If uploading company_logo, also update the preview URL immediately
      if (name === "logo_upload" && file) {
        const previewUrl = URL.createObjectURL(file);
        setFormData((prev) => ({ ...prev, company_logo: previewUrl }));
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null && formData[key] !== undefined) {
          payload.append(key, formData[key]);
        }
      });

      // Append legacy PHP names to ensure backend receives what it expects
      payload.append("address_line_1", formData.address_1 || "");
      payload.append("account_no", formData.account_number || "");
      payload.append("micr_code", formData.micr_no || "");

      // Append hidden section flags that PHP backend might check
      payload.append("personal_detail", "-1");
      payload.append("bank_detail", "-1");
      payload.append("company_detail", "-1");

      if (formData.logo_upload instanceof File) {
        payload.append("logo_upload", formData.logo_upload);
      }
      if (formData.favicon instanceof File) {
        payload.append("favicon", formData.favicon);
      }

      const response = await axios.post("rolemanagment/save-company-setting", payload);
      if (response.data.status || response.data.success) {
        toast.success("Settings updated successfully ✅");
      } else {
        toast.error(response.data.message || "Failed to update settings");
      }
    } catch (err) {
      console.error("Update error:", err);
      toast.error("An error occurred while saving settings");
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { name: "General Info", icon: ClipboardIcon },
    { name: "Bank Account", icon: PhoneIcon },
    { name: "Company Details", icon: IdentificationIcon },
    { name: "Manage Roles", icon: UserGroupIcon },
    { name: "App Settings", icon: Cog6ToothIcon },
  ];

  if (loading) {
    return (
      <Page title="Organisation Settings">
        <div className="flex h-[60vh] items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600">Loading Settings...</span>
        </div>
      </Page>
    );
  }

  return (
    <Page title="Organisation Settings">
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Organisation Settings
          </h1>
          <Button
            variant="flat"
            onClick={() => navigate("/")}
            className="text-gray-600 hover:text-gray-800"
          >
            ← Back to Dashboard
          </Button>
        </div>

        {/* Company Header Section */}
        <Card className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-dark-800 dark:to-dark-900 border-none">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="relative group">
              <div className="w-40 h-40 rounded-2xl overflow-hidden bg-white shadow-xl flex items-center justify-center p-2 border-4 border-white dark:border-dark-700">
                {formData.company_logo ? (
                  <img
                    src={formData.company_logo}
                    alt={formData.company_name}
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <div className="text-gray-400 text-center text-xs">
                    No Logo
                    <br />
                    Available
                  </div>
                )}
              </div>
            </div>
            <div className="text-center md:text-left">
              <h2 className="text-3xl font-extrabold text-blue-950 dark:text-white">
                {formData.company_name || "Company Name"}
              </h2>
              <p className="text-blue-600 dark:text-blue-400 font-medium mt-1 uppercase tracking-wider">
                {formData.short_name || "Organisation"}
              </p>
              <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-4 text-sm text-gray-600 dark:text-gray-400">
                {formData.email && (
                  <span className="flex items-center gap-1.5 bg-white/50 dark:bg-dark-800/50 px-3 py-1 rounded-full border border-blue-100 dark:border-dark-700">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {formData.email}
                  </span>
                )}
                {formData.phone && (
                  <span className="flex items-center gap-1.5 bg-white/50 dark:bg-dark-800/50 px-3 py-1 rounded-full border border-blue-100 dark:border-dark-700">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {formData.phone}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>

        <TabGroup className="flex flex-col gap-6">
          <TabList className="flex flex-row flex-wrap gap-2 pb-2 border-b border-gray-100 dark:border-dark-800">
            {tabs.map((tab) => (
              <Tab
                key={tab.name}
                className={({ selected }) =>
                  clsx(
                    "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all outline-none cursor-pointer",
                    selected
                      ? "bg-blue-600 text-white shadow-md shadow-blue-200/50"
                      : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-dark-800"
                  )
                }
              >
                <tab.icon className="w-4.5 h-4.5" />
                {tab.name}
              </Tab>
            ))}
          </TabList>

          <TabPanels className="flex-1">
            <form onSubmit={handleSubmit}>
              {/* General Info Panel */}
              <TabPanel>
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-6 border-b pb-2">General Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Input
                      label="Company Name"
                      name="company_name"
                      value={formData.company_name}
                      onChange={handleChange}
                      placeholder="Enter Company Name"
                      classNames={{ root: "md:col-span-2" }}
                    />
                    <Input
                      label="Short Name"
                      name="short_name"
                      value={formData.short_name}
                      onChange={handleChange}
                      placeholder="Short Name"
                      classNames={{ root: "md:col-span-1" }}
                    />
                    <Input
                      label="Phone No."
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="Phone Number"
                      classNames={{ root: "md:col-span-2" }}
                    />
                    <Input
                      label="Website"
                      name="website"
                      value={formData.website}
                      onChange={handleChange}
                      placeholder="www.example.com"
                      classNames={{ root: "md:col-span-1" }}
                    />
                    <Input
                      label="GST No"
                      name="gst_no"
                      value={formData.gst_no}
                      onChange={handleChange}
                      placeholder="GST Number"
                      classNames={{ root: "md:col-span-2" }}
                    />
                    <Input
                      label="E-Mail"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Company Email"
                      classNames={{ root: "md:col-span-1" }}
                    />
                    <div className="md:col-span-3">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Address
                      </label>
                      <textarea
                        name="address_1"
                        rows={3}
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-dark-500 dark:bg-dark-900 resize-none"
                        value={formData.address_1}
                        onChange={handleChange}
                        placeholder="1234 Main St"
                      />
                    </div>
                    <Input
                      label="City"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="City"
                      classNames={{ root: "md:col-span-1" }}
                    />
                    <Select
                      label="Country"
                      name="country_id"
                      options={countries}
                      value={formData.country_id}
                      onChange={(val) => setFormData(p => ({ ...p, country_id: val, state: "", indian_state: "" }))}
                      placeholder="Select Country"
                      className="md:col-span-1"
                    />
                    {String(formData.country_id) === "1" ? (
                      <Select
                        label="State"
                        name="indian_state"
                        options={states}
                        value={formData.indian_state}
                        onChange={(val) => setFormData(p => ({ ...p, indian_state: val }))}
                        placeholder="Select State"
                        className="md:col-span-1"
                      />
                    ) : (
                      <Input
                        label="State"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        placeholder="State"
                        classNames={{ root: "md:col-span-1" }}
                      />
                    )}
                    <Input
                      label="Pincode"
                      name="pincode"
                      type="number"
                      value={formData.pincode}
                      onChange={handleChange}
                      placeholder="Pincode"
                      classNames={{ root: "md:col-span-1" }}
                    />
                    <div className="md:col-span-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Company Logo
                      </label>
                      <input
                        type="file"
                        name="logo_upload"
                        accept="image/*"
                        onChange={handleChange}
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:border-dark-500 dark:bg-dark-900"
                      />
                    </div>
                    <div className="md:col-span-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Favicon Logo
                      </label>
                      <input
                        type="file"
                        name="favicon"
                        accept="image/*"
                        onChange={handleChange}
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:border-dark-500 dark:bg-dark-900"
                      />
                      {formData.favicon_url && (
                        <div className="mt-1.5 flex items-center gap-2">
                          <img src={formData.favicon_url} alt="Favicon" className="w-5 h-5 object-contain" />
                          <span className="text-xs text-gray-500">Current Favicon</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </TabPanel>

              {/* Bank Info Panel */}
              <TabPanel>
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-6 border-b pb-2">Bank Account Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                      label="Bank Name"
                      name="bank_name"
                      value={formData.bank_name}
                      onChange={handleChange}
                      placeholder="Bank Name"
                    />
                    <Input
                      label="Account Name"
                      name="account_name"
                      value={formData.account_name}
                      onChange={handleChange}
                      placeholder="Account Name"
                    />
                    <Select
                      label="Account Type"
                      name="account_type_id"
                      options={accountTypes}
                      value={formData.account_type_id}
                      onChange={(val) => setFormData(p => ({ ...p, account_type_id: val }))}
                      placeholder="Select Account Type"
                    />
                    <Input
                      label="Account No."
                      name="account_number"
                      type="number"
                      value={formData.account_number}
                      onChange={handleChange}
                      placeholder="Account Number"
                    />
                    <Input
                      label="MICR Code"
                      name="micr_no"
                      value={formData.micr_no}
                      onChange={handleChange}
                      placeholder="MICR Code"
                    />
                    <Input
                      label="IFSC Code"
                      name="ifsc_code"
                      value={formData.ifsc_code}
                      onChange={handleChange}
                      placeholder="IFSC Code"
                    />
                    <Input
                      label="SWIFT Code"
                      name="swift_code"
                      value={formData.swift_code}
                      onChange={handleChange}
                      placeholder="SWIFT Code"
                    />
                    <Input
                      label="Branch Name"
                      name="branch_name"
                      value={formData.branch_name}
                      onChange={handleChange}
                      placeholder="Branch Name"
                    />
                  </div>
                </Card>
              </TabPanel>

              {/* Company Details Panel */}
              <TabPanel>
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-6 border-b pb-2">Statutory Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                      label="Gumasta Number"
                      name="gumasta_no"
                      value={formData.gumasta_no}
                      onChange={handleChange}
                      placeholder="Gumasta Number"
                    />
                    <Input
                      label="MSME No."
                      name="msme_no"
                      value={formData.msme_no}
                      onChange={handleChange}
                      placeholder="MSME Number"
                    />
                    <Input
                      label="SME No."
                      name="sme_no"
                      value={formData.sme_no}
                      onChange={handleChange}
                      placeholder="SME Number"
                    />
                    <Input
                      label="CIN No."
                      name="cin_no"
                      value={formData.cin_no}
                      onChange={handleChange}
                      placeholder="CIN Number"
                    />
                    <Input
                      label="HSN Code"
                      name="hsn_code"
                      value={formData.hsn_code}
                      onChange={handleChange}
                      placeholder="HSN Code"
                    />
                    <Input
                      label="SAC Code"
                      name="sac_code"
                      value={formData.sac_code}
                      onChange={handleChange}
                      placeholder="SAC Code"
                    />
                    <Input
                      label="TAN Number"
                      name="tan_no"
                      value={formData.tan_no}
                      onChange={handleChange}
                      placeholder="TAN Number"
                    />
                    <Input
                      label="PAN Number"
                      name="pan_no"
                      value={formData.pan_no}
                      onChange={handleChange}
                      placeholder="PAN Number"
                    />
                  </div>
                </Card>
              </TabPanel>

              {/* Placeholders for other tabs */}
              <TabPanel>
                <Card className="p-6 flex items-center justify-center h-64 italic text-gray-500">

                </Card>
              </TabPanel>
              <TabPanel>
                <Card className="p-6 flex items-center justify-center h-64 italic text-gray-500">

                </Card>
              </TabPanel>

              <div className="mt-6 flex justify-end">
                <Button
                  type="submit"
                  variant="filled"
                  color="primary"
                  className="px-8 py-2.5 rounded-lg font-semibold shadow-lg shadow-blue-500/30"
                  disabled={saving}
                >
                  {saving ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z"></path>
                      </svg>
                      Saving...
                    </span>
                  ) : (
                    "Save All Changes"
                  )}
                </Button>
              </div>
            </form>
          </TabPanels>
        </TabGroup>
      </div>
    </Page>
  );
}
