import { useNavigate } from "react-router";
import { useState } from "react";
import { Button, Input } from "components/ui";
import { Page } from "components/shared/Page";
import axios from "utils/axios";
import { toast } from "sonner";

export default function AddProfessionalTax() {
  const navigate = useNavigate();

  // State for form and loading
  const [formData, setFormData] = useState({ 
    min: "", 
    max: "",
    tax: ""
  });
  const [loading, setLoading] = useState(false);

  // Error and touched states
  const [errors, setErrors] = useState({
    min: "",
    max: "",
    tax: "",
  });

  const [touched, setTouched] = useState({
    min: false,
    max: false,
    tax: false,
  });

  // Input handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // Handle field blur to show validation
  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));

    // Validate field on blur
    validateField(name, value);
  };

  // Validate individual field
  const validateField = (fieldName, value) => {
    let error = "";
    
    if (!value.toString().trim()) {
      error = "This field is required";
    } else if (isNaN(value)) {
      error = "Must be a number";
    }

    setErrors((prev) => ({
      ...prev,
      [fieldName]: error,
    }));

    return error === "";
  };

  // Validate all fields
  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    ["min", "max", "tax"].forEach(field => {
      if (!formData[field].toString().trim()) {
        newErrors[field] = "This field is required";
        isValid = false;
      } else if (isNaN(formData[field])) {
        newErrors[field] = "Must be a number";
        isValid = false;
      }
    });

    setErrors(newErrors);
    setTouched({
      min: true,
      max: true,
      tax: true,
    });

    return isValid;
  };

  // Form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form before submission
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const form = new FormData();
      form.append("min", formData.min);
      form.append("max", formData.max);
      form.append("tax", formData.tax);

      const res = await axios.post("/hrm/professional-tax-add", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.status === true || res.data.status === "true" || res.data.status === "success") {
        toast.success(res.data.message || "Tax slab created successfully ✅", {
          duration: 2000,
          icon: "✅",
        });
        navigate("/dashboards/hrm/professional-tax");
      } else {
        toast.error(res.data.message || "Failed to create tax slab ❌");
      }
    } catch (err) {
      console.error("Error creating tax slab:", err);
      toast.error(err?.response?.data?.message || "Failed to create tax slab ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page title="Add Professional Tax Slab">
      <div className="p-6">
        {/* Header + Back Button */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
            Add New Tax Slab
          </h2>
          <Button
            variant="outline"
            className="text-white bg-blue-600 hover:bg-blue-700"
            onClick={() => navigate("/dashboards/hrm/professional-tax")}
          >
            Back to List
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
          <div>
            <Input
              label="Min Salary"
              name="min"
              placeholder="Enter minimum salary"
              value={formData.min}
              onChange={handleChange}
              onBlur={handleBlur}
              className={errors.min && touched.min ? "border-red-500" : ""}
            />
            {errors.min && touched.min && (
              <p className="text-red-500 text-sm mt-1">{errors.min}</p>
            )}
          </div>

          <div>
            <Input
              label="Max Salary"
              name="max"
              placeholder="Enter maximum salary"
              value={formData.max}
              onChange={handleChange}
              onBlur={handleBlur}
              className={errors.max && touched.max ? "border-red-500" : ""}
            />
            {errors.max && touched.max && (
              <p className="text-red-500 text-sm mt-1">{errors.max}</p>
            )}
          </div>

          <div>
            <Input
              label="Tax Amount"
              name="tax"
              placeholder="Enter tax amount"
              value={formData.tax}
              onChange={handleChange}
              onBlur={handleBlur}
              className={errors.tax && touched.tax ? "border-red-500" : ""}
            />
            {errors.tax && touched.tax && (
              <p className="text-red-500 text-sm mt-1">{errors.tax}</p>
            )}
          </div>

          <div className="pt-2">
            <Button type="submit" color="primary" disabled={loading} className="w-full sm:w-auto">
              {loading ? (
                <div className="flex items-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z"
                    ></path>
                  </svg>
                  Saving...
                </div>
              ) : (
                "Save Tax Slab"
              )}
            </Button>
          </div>
        </form>
      </div>
    </Page>
  );
}
