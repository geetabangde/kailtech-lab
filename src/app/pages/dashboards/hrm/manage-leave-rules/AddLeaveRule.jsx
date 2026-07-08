import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button, Card, Input, Select } from "components/ui";
import { Page } from "components/shared/Page";
import axios from "utils/axios";
import { toast } from "sonner";
import { getStoredPermissions } from "app/navigation/dashboards";

// ----------------------------------------------------------------------

export default function AddLeaveRule() {
  const navigate = useNavigate();
  const permissions = getStoredPermissions();

  const [formData, setFormData] = useState({
    name: "",
    clquota: "",
    clmonthlylimit: "",
    clwithdrawal: "",
    slquota: "",
    slmonthlylimit: "",
    slwithdrawal: "",
    elquota: "",
    elmonthlylimit: "",
    elwithdrawal: "",
  });

  const [loading, setLoading] = useState(false);

  const [errors, setErrors] = useState({
    name: "",
    clquota: "",
    clmonthlylimit: "",
    clwithdrawal: "",
    slquota: "",
    slmonthlylimit: "",
    slwithdrawal: "",
    elquota: "",
    elmonthlylimit: "",
    elwithdrawal: "",
  });

  const [touched, setTouched] = useState({
    name: false,
    clquota: false,
    clmonthlylimit: false,
    clwithdrawal: false,
    slquota: false,
    slmonthlylimit: false,
    slwithdrawal: false,
    elquota: false,
    elmonthlylimit: false,
    elwithdrawal: false,
  });

  // Handler for text/number inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // Handler for custom Select dropdowns
  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value || "",
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }

    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));
    validateField(name, value);
  };

  const validateField = (fieldName, value) => {
    let error = "";
    if (value === undefined || value === null || String(value).trim() === "") {
      error = "This field is required";
    } else if (
      ["clquota", "clmonthlylimit", "slquota", "slmonthlylimit", "elquota", "elmonthlylimit"].includes(fieldName)
    ) {
      if (isNaN(value) || parseFloat(value) < 0) {
        error = "Please enter a valid positive number";
      }
    }

    setErrors((prev) => ({
      ...prev,
      [fieldName]: error,
    }));

    return error === "";
  };

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    Object.keys(formData).forEach((key) => {
      const value = formData[key];
      if (value === undefined || value === null || String(value).trim() === "") {
        newErrors[key] = "This field is required";
        isValid = false;
      } else if (
        ["clquota", "clmonthlylimit", "slquota", "slmonthlylimit", "elquota", "elmonthlylimit"].includes(key)
      ) {
        if (isNaN(value) || parseFloat(value) < 0) {
          newErrors[key] = "Please enter a valid positive number";
          isValid = false;
        }
      }
    });

    setErrors(newErrors);
    setTouched({
      name: true,
      clquota: true,
      clmonthlylimit: true,
      clwithdrawal: true,
      slquota: true,
      slmonthlylimit: true,
      slwithdrawal: true,
      elquota: true,
      elmonthlylimit: true,
      elwithdrawal: true,
    });

    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fill in all required fields correctly ❌");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: formData.name,
        clquota: parseInt(formData.clquota, 10),
        clmonthlylimit: parseInt(formData.clmonthlylimit, 10),
        clwithdrawal: formData.clwithdrawal,
        slquota: parseInt(formData.slquota, 10),
        slmonthlylimit: parseInt(formData.slmonthlylimit, 10),
        slwithdrawal: formData.slwithdrawal,
        elquota: parseInt(formData.elquota, 10),
        elmonthlylimit: parseInt(formData.elmonthlylimit, 10),
        elwithdrawal: formData.elwithdrawal,
      };

      await axios.post("/hrm/add-leave-rule", payload);

      toast.success("Leave Rule created successfully ✅", {
        duration: 2000,
        icon: "✅",
      });

      navigate("/dashboards/hrm/manage-leave-rules");
    } catch (err) {
      console.error("Error creating Leave Rule:", err);
      toast.error(err?.response?.data?.message || "Failed to create Leave Rule ❌");
    } finally {
      setLoading(false);
    }
  };

  // Permission Gate: PHP code requires permission 237 to Add Leave Rules
  if (!permissions.includes(237)) {
    return (
      <Page title="Add Leave Rules">
        <div className="flex h-60 items-center justify-center rounded-xl border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-sm font-medium text-red-600 dark:text-red-400">
            Access Denied - Permission 237 required
          </p>
        </div>
      </Page>
    );
  }

  const withdrawalOptions = [
    { value: "Lapsed", label: "Lapse" },
    { value: "Encash", label: "Encash" },
  ];

  return (
    <Page title="Add Leave Rules">
      <div className="transition-content p-6 space-y-6">
        
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-wide text-gray-800 dark:text-dark-50">
              Add New Leave Rules
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Configure standard quotas, monthly limits, and end-of-year policies
            </p>
          </div>
          {permissions.includes(234) && (
            <Button
              variant="outline"
              className="text-white bg-blue-600 hover:bg-blue-700 font-medium"
              onClick={() => navigate("/dashboards/hrm/manage-leave-rules")}
            >
              &laquo; Back to List
            </Button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* General Details Section */}
          <Card className="p-6 border-none shadow-soft dark:bg-dark-700">
            <h3 className="text-base font-bold text-gray-800 dark:text-dark-100 mb-4 pb-2 border-b border-gray-100 dark:border-dark-600">
              Rule Metadata
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Input
                  label="Name *"
                  name="name"
                  placeholder="e.g. Standard Rule Set"
                  value={formData.name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={errors.name && touched.name ? "border-red-500" : ""}
                />
                {errors.name && touched.name && (
                  <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                )}
              </div>
            </div>
          </Card>

          {/* Leave Quota Details in 3 Grid Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Casual Leave Quota Card */}
            <Card className="p-6 border-none shadow-soft dark:bg-dark-700 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-primary-600 dark:text-primary-400 mb-4 pb-2 border-b border-gray-100 dark:border-dark-600">
                  Casual Leave (CL)
                </h3>
                <div className="space-y-4">
                  <div>
                    <Input
                      label="Yearly Quota *"
                      name="clquota"
                      type="number"
                      placeholder="e.g. 12"
                      value={formData.clquota}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={errors.clquota && touched.clquota ? "border-red-500" : ""}
                    />
                    {errors.clquota && touched.clquota && (
                      <p className="text-red-500 text-xs mt-1">{errors.clquota}</p>
                    )}
                  </div>

                  <div>
                    <Input
                      label="Monthly Limit *"
                      name="clmonthlylimit"
                      type="number"
                      placeholder="e.g. 2"
                      value={formData.clmonthlylimit}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={errors.clmonthlylimit && touched.clmonthlylimit ? "border-red-500" : ""}
                    />
                    {errors.clmonthlylimit && touched.clmonthlylimit && (
                      <p className="text-red-500 text-xs mt-1">{errors.clmonthlylimit}</p>
                    )}
                  </div>

                  <div>
                    <Select
                      label="Year-End Withdrawal Policy *"
                      name="clwithdrawal"
                      options={withdrawalOptions}
                      value={formData.clwithdrawal}
                      onChange={(value) => handleSelectChange("clwithdrawal", value)}
                      error={touched.clwithdrawal ? errors.clwithdrawal : ""}
                      placeholder="Select Policy"
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Sick Leave Quota Card */}
            <Card className="p-6 border-none shadow-soft dark:bg-dark-700 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-success-600 dark:text-success-400 mb-4 pb-2 border-b border-gray-100 dark:border-dark-600">
                  Sick Leave (SL)
                </h3>
                <div className="space-y-4">
                  <div>
                    <Input
                      label="Yearly Quota *"
                      name="slquota"
                      type="number"
                      placeholder="e.g. 10"
                      value={formData.slquota}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={errors.slquota && touched.slquota ? "border-red-500" : ""}
                    />
                    {errors.slquota && touched.slquota && (
                      <p className="text-red-500 text-xs mt-1">{errors.slquota}</p>
                    )}
                  </div>

                  <div>
                    <Input
                      label="Monthly Limit *"
                      name="slmonthlylimit"
                      type="number"
                      placeholder="e.g. 1"
                      value={formData.slmonthlylimit}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={errors.slmonthlylimit && touched.slmonthlylimit ? "border-red-500" : ""}
                    />
                    {errors.slmonthlylimit && touched.slmonthlylimit && (
                      <p className="text-red-500 text-xs mt-1">{errors.slmonthlylimit}</p>
                    )}
                  </div>

                  <div>
                    <Select
                      label="Year-End Withdrawal Policy *"
                      name="slwithdrawal"
                      options={withdrawalOptions}
                      value={formData.slwithdrawal}
                      onChange={(value) => handleSelectChange("slwithdrawal", value)}
                      error={touched.slwithdrawal ? errors.slwithdrawal : ""}
                      placeholder="Select Policy"
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Earned Leave Quota Card */}
            <Card className="p-6 border-none shadow-soft dark:bg-dark-700 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-warning-600 dark:text-warning-400 mb-4 pb-2 border-b border-gray-100 dark:border-dark-600">
                  Earned Leave (EL)
                </h3>
                <div className="space-y-4">
                  <div>
                    <Input
                      label="Yearly Quota *"
                      name="elquota"
                      type="number"
                      placeholder="e.g. 15"
                      value={formData.elquota}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={errors.elquota && touched.elquota ? "border-red-500" : ""}
                    />
                    {errors.elquota && touched.elquota && (
                      <p className="text-red-500 text-xs mt-1">{errors.elquota}</p>
                    )}
                  </div>

                  <div>
                    <Input
                      label="Monthly Limit *"
                      name="elmonthlylimit"
                      type="number"
                      placeholder="e.g. 3"
                      value={formData.elmonthlylimit}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={errors.elmonthlylimit && touched.elmonthlylimit ? "border-red-500" : ""}
                    />
                    {errors.elmonthlylimit && touched.elmonthlylimit && (
                      <p className="text-red-500 text-xs mt-1">{errors.elmonthlylimit}</p>
                    )}
                  </div>

                  <div>
                    <Select
                      label="Year-End Withdrawal Policy *"
                      name="elwithdrawal"
                      options={withdrawalOptions}
                      value={formData.elwithdrawal}
                      onChange={(value) => handleSelectChange("elwithdrawal", value)}
                      error={touched.elwithdrawal ? errors.elwithdrawal : ""}
                      placeholder="Select Policy"
                    />
                  </div>
                </div>
              </div>
            </Card>

          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 border-t border-gray-100 dark:border-dark-600 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/dashboards/hrm/manage-leave-rules")}
              className="px-6 font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              color="primary"
              disabled={loading}
              className="px-8 font-semibold shadow-md shadow-primary-500/20"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z"></path>
                  </svg>
                  Saving...
                </div>
              ) : (
                "Save"
              )}
            </Button>
          </div>

        </form>
      </div>
    </Page>
  );
}
