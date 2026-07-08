import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button, Card, Input } from "components/ui";
import { Page } from "components/shared/Page";
import axios from "utils/axios";
import { toast } from "sonner";
import { getStoredPermissions } from "app/navigation/dashboards";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

// ----------------------------------------------------------------------

export default function AddHoliday() {
  const navigate = useNavigate();
  const permissions = getStoredPermissions();

  const [formData, setFormData] = useState({
    name: "",
    date: "",
  });

  const [loading, setLoading] = useState(false);

  const [errors, setErrors] = useState({
    name: "",
    date: "",
  });

  const [touched, setTouched] = useState({
    name: false,
    date: false,
  });

  // Handler for text/date inputs
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
      }
    });

    setErrors(newErrors);
    setTouched({
      name: true,
      date: true,
    });

    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fill in all required fields correctly ");
      return;
    }

    setLoading(true);

    try {
      const form = new FormData();
      form.append("name", formData.name);
      form.append("date", formData.date);

      try {
        // Primary endpoint matching insert_holiday.php in backend
        await axios.post("/hrm/insert-holiday", form);
      } catch (err) {
        // Safe resilient fallback
        if (err?.response?.status === 404) {
          await axios.post("/hrm/add-holiday", form);
        } else {
          throw err;
        }
      }

      toast.success("Holiday created successfully ", {
        duration: 2000,
        icon: "✅",
      });

      navigate("/dashboards/hrm/holidays");
    } catch (err) {
      console.error("Error creating Holiday:", err);
      toast.error(err?.response?.data?.message || "Failed to create holiday");
    } finally {
      setLoading(false);
    }
  };

  // Permission Gate: PHP code requires permission 245 to Add Holidays
  if (!permissions.includes(245)) {
    return (
      <Page title="Add Holiday">
        <div className="flex h-60 items-center justify-center rounded-xl border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-sm font-medium text-red-600 dark:text-red-400">
            Access Denied - Permission 245 required to add holidays
          </p>
        </div>
      </Page>
    );
  }

  return (
    <Page title="Add Holiday::.Manage Holiday -HRM">
      <div className="transition-content p-6 space-y-6">
        
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {permissions.includes(242) && (
              <button
                onClick={() => navigate("/dashboards/hrm/holidays")}
                className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-dark-800 transition"
                title="Back to Holiday List"
              >
                <ArrowLeftIcon className="h-5 w-5 text-gray-600 dark:text-dark-200" />
              </button>
            )}
            <div>
              <h2 className="text-xl font-semibold tracking-wide text-gray-800 dark:text-dark-50">
                Add Holiday
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Create a new active holiday record
              </p>
            </div>
          </div>
          {permissions.includes(242) && (
            <Button
              variant="outline"
              className="text-white bg-blue-600 hover:bg-blue-700 font-medium h-9 rounded-md px-4"
              onClick={() => navigate("/dashboards/hrm/holidays")}
            >
              &lt;&lt; Back
            </Button>
          )}
        </div>

        {/* Form Container */}
        <div className="max-w-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card className="p-6 border-none shadow-soft dark:bg-dark-700">
              <h3 className="text-base font-bold text-gray-800 dark:text-dark-100 mb-4 pb-2 border-b border-gray-100 dark:border-dark-600">
                Holiday Information
              </h3>
              
              <div className="space-y-5">
                {/* Name */}
                <div>
                  <Input
                    label="Name *"
                    name="name"
                    placeholder="Enter holiday name"
                    value={formData.name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={errors.name && touched.name ? "border-red-500" : ""}
                  />
                  {errors.name && touched.name && (
                    <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                  )}
                </div>

                {/* Date */}
                <div>
                  <Input
                    label="Date *"
                    name="date"
                    type="date"
                    value={formData.date}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={errors.date && touched.date ? "border-red-500" : ""}
                  />
                  {errors.date && touched.date && (
                    <p className="text-red-500 text-xs mt-1">{errors.date}</p>
                  )}
                </div>
              </div>
            </Card>

            {/* Actions */}
            <div className="flex justify-end gap-3 border-t border-gray-100 dark:border-dark-600 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/dashboards/hrm/holidays")}
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
      </div>
    </Page>
  );
}