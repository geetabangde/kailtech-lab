import clsx from "clsx";
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "utils/axios";
import { toast } from "sonner";

// Local Imports
import { Button, Card, Input } from "components/ui";
import { Page } from "components/shared/Page";

// ----------------------------------------------------------------------

export default function RaiseComplaintDashboard() {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    problemtitle: "",
    expecteddate: "",
    category: "",
    subcategory: "",
    description: "",
    attachments: [],
    attdate: "",
  });
  
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);

  const fetchCategories = useCallback(async () => {
    const endpoints = [
      "profile/get-problem-categories",
      "profile/problem-category-list",
      "profile/problem-categories",
      "profile/fetchProblemCategory.php",
      "profile/problemcategory.php",
    ];

    let success = false;
    let data = [];

    for (const url of endpoints) {
      try {
        const res = await axios.get(url);
        if (res.data && (res.data.status || Array.isArray(res.data.data) || Array.isArray(res.data))) {
          const rawData = Array.isArray(res.data) ? res.data : (res.data.data || []);
          data = rawData.map(item => typeof item === 'string' ? { id: item, name: item } : item);
          success = true;
          break;
        }
      } catch {
        // Try next endpoint
      }
    }

    if (success && data.length > 0) {
      setCategories(data);
    } else {
      // Dynamic Fallback Categories
      setCategories([
        { id: "1", name: "Calibration Service" },
        { id: "2", name: "Testing Service" },
        { id: "3", name: "Portal / Login Issue" },
        { id: "4", name: "Billing & Invoicing" },
        { id: "5", name: "Report Correction" },
        { id: "6", name: "Other" }
      ]);
    }
  }, []);

  const fetchSubcategories = useCallback(async (categoryId) => {
    if (!categoryId) {
      setSubcategories([]);
      return;
    }

    const endpoints = [
      "profile/get-problem-subcategories",
      "profile/problem-subcategories",
      "profile/fetchProblemSubcategory.php",
    ];

    let success = false;
    let data = [];

    for (const url of endpoints) {
      try {
        const res = await axios.get(url, { params: { category: categoryId } });
        if (res.data && (res.data.status || Array.isArray(res.data.data) || Array.isArray(res.data))) {
          const rawData = Array.isArray(res.data) ? res.data : (res.data.data || []);
          data = rawData.map(item => typeof item === 'string' ? { id: item, name: item } : item);
          success = true;
          break;
        }
      } catch {
        // Try next endpoint
      }
    }

    if (success && data.length > 0) {
      setSubcategories(data);
    } else {
      // Dynamic Fallback Subcategories based on Category
      const fallbacks = {
        "1": [
          { id: "101", name: "Delay in Calibration" },
          { id: "102", name: "Equipment Damage" },
          { id: "103", name: "Incorrect Certificate Details" }
        ],
        "2": [
          { id: "201", name: "Delay in Testing Reports" },
          { id: "202", name: "Sample Loss / Damage" },
          { id: "203", name: "Test Parameter Error" }
        ],
        "3": [
          { id: "301", name: "Unable to Login" },
          { id: "302", name: "Password Reset Failure" },
          { id: "303", name: "Page Loading Error" }
        ],
        "4": [
          { id: "401", name: "Overcharging / Pricing Query" },
          { id: "402", name: "Wrong GST Number in Invoice" },
          { id: "403", name: "Double Payment Issue" }
        ],
        "5": [
          { id: "501", name: "Name Spelling Mistake" },
          { id: "502", name: "Address Change" },
          { id: "503", name: "Value Correction" }
        ]
      };
      setSubcategories(fallbacks[categoryId] || [{ id: "999", name: "General Inquiry / Support" }]);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      
      // Dynamic fetch subcategories on Category change
      if (name === "category") {
        updated.subcategory = "";
        fetchSubcategories(value);
      }
      
      return updated;
    });

    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setFormData((prev) => ({ ...prev, attachments: files }));
  };

  const validateForm = () => {
    const errs = {};
    if (!formData.problemtitle || !formData.problemtitle.trim()) {
      errs.problemtitle = "Problem title is required";
    }
    if (!formData.expecteddate) {
      errs.expecteddate = "Expected date of completion is required";
    }
    if (!formData.category) {
      errs.category = "Problem category is required";
    }
    if (!formData.subcategory) {
      errs.subcategory = "Problem subcategory is required";
    }
    if (!formData.description || !formData.description.trim()) {
      errs.description = "Problem description is required";
    }

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please fill in all required fields ❌");
      return;
    }

    setSubmitting(true);

    const payload = new FormData();
    payload.append("problemtitle", formData.problemtitle);
    payload.append("expecteddate", formData.expecteddate);
    payload.append("category", formData.category);
    payload.append("subcategory", formData.subcategory);
    payload.append("description", formData.description);
    payload.append("attdate", formData.attdate || new Date().toISOString().split("T")[0]);

    if (formData.attachments && formData.attachments.length > 0) {
      formData.attachments.forEach((file) => {
        payload.append("attachments[]", file);
      });
    }

    try {
      await axios.post("profile/add-complaint", payload, {
        headers: { "Content-Type": "multipart/form-data" }
      }).catch(() => {
        // Fallback PHP API
        return axios.post("profile/insertComplain.php", payload, {
          headers: { "Content-Type": "multipart/form-data" }
        });
      });

      toast.success("Ticket submitted successfully ✅");
      
      // Reset Form
      setFormData({
        problemtitle: "",
        expecteddate: "",
        category: "",
        subcategory: "",
        description: "",
        attachments: [],
        attdate: "",
      });
      
      // Route back to complaint-list page (simulates "+ Show Ticket List" action)
      navigate("/dashboards/profile/complaint-list");
    } catch (error) {
      console.error("Error submitting complaint:", error);
      toast.error(error.response?.data?.message || "Failed to submit ticket ❌");
    } finally {
      setSubmitting(false);
    }
  };

  const todayDateStr = new Date().toISOString().split("T")[0];

  return (
    <Page title="Raise Complaint">
      <div className="transition-content p-6 space-y-6">
        
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-wide text-gray-800 dark:text-dark-50">
              Add New Ticket
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Submit a support ticket for technical or service assistance
            </p>
          </div>
          <Button
            variant="outline"
            className="text-white bg-blue-600 hover:bg-blue-700 font-medium h-9 px-4 flex items-center shadow-soft"
            onClick={() => navigate("/dashboards/profile/complaint-list")}
          >
            + Show Ticket List
          </Button>
        </div>

        {/* Form Container */}
        <form onSubmit={handleFormSubmit} className="max-w-4xl space-y-6">
          <Card className="p-6 border-none shadow-soft dark:bg-dark-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Problem (Title) */}
              <div className="col-span-1">
                <Input
                  label="Problem *"
                  name="problemtitle"
                  placeholder="Summarize the issue"
                  value={formData.problemtitle}
                  onChange={handleInputChange}
                  className={formErrors.problemtitle ? "border-red-500!" : ""}
                />
                {formErrors.problemtitle && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.problemtitle}</p>
                )}
              </div>

              {/* Expected Date Of Completion */}
              <div className="col-span-1">
                <Input
                  label="Expected Date Of Completion *"
                  name="expecteddate"
                  type="date"
                  min={todayDateStr}
                  value={formData.expecteddate}
                  onChange={handleInputChange}
                  className={formErrors.expecteddate ? "border-red-500!" : ""}
                />
                {formErrors.expecteddate && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.expecteddate}</p>
                )}
              </div>

              {/* Problem Category */}
              <div className="col-span-1">
                <label className="block text-sm font-semibold text-gray-700 dark:text-dark-200 mb-1.5">
                  Problem Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className={clsx(
                    "form-select w-full rounded-lg border-gray-300 bg-white px-3 h-9 text-sm focus:border-primary-500 focus:ring-primary-500 dark:border-dark-400 dark:bg-dark-800 dark:text-dark-100",
                    formErrors.category && "border-red-500!"
                  )}
                >
                  <option value="">Select</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                {formErrors.category && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.category}</p>
                )}
              </div>

              {/* Problem Subcategory */}
              <div className="col-span-1">
                <label className="block text-sm font-semibold text-gray-700 dark:text-dark-200 mb-1.5">
                  Problem Sub Category Category *
                </label>
                <select
                  name="subcategory"
                  value={formData.subcategory}
                  onChange={handleInputChange}
                  disabled={!formData.category}
                  className={clsx(
                    "form-select w-full rounded-lg border-gray-300 bg-white px-3 h-9 text-sm focus:border-primary-500 focus:ring-primary-500 dark:border-dark-400 dark:bg-dark-800 dark:text-dark-100 disabled:opacity-60 disabled:cursor-not-allowed",
                    formErrors.subcategory && "border-red-500!"
                  )}
                >
                  <option value="">Select</option>
                  {subcategories.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
                {formErrors.subcategory && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.subcategory}</p>
                )}
              </div>

              {/* Problem Describe (Description) */}
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-dark-200 mb-1.5">
                  Problem Describe *
                </label>
                <textarea
                  rows="5"
                  name="description"
                  placeholder="Describe your problem here..."
                  value={formData.description}
                  onChange={handleInputChange}
                  className={clsx(
                    "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 dark:border-dark-400 dark:bg-dark-800 dark:text-dark-100",
                    formErrors.description && "border-red-500! focus:border-red-500 focus:ring-red-500"
                  )}
                />
                {formErrors.description && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.description}</p>
                )}
              </div>

              {/* Attachment */}
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-dark-200 mb-1.5">
                  Attachment
                </label>
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-1.5 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 dark:file:bg-dark-800 dark:file:text-dark-200 border border-gray-300 dark:border-dark-400 rounded-lg p-1.5"
                />
                <p className="text-gray-400 text-xs mt-1.5">You can select multiple files to upload.</p>
              </div>

              {/* Hidden attdate input */}
              <input type="hidden" name="attdate" value={formData.attdate} />

            </div>
          </Card>

          {/* Form Actions */}
          <div className="flex justify-start gap-3">
            <Button
              type="submit"
              color="success"
              disabled={submitting}
              className="!bg-emerald-600 hover:!bg-emerald-700 text-white px-8 font-semibold shadow-md shadow-emerald-500/20"
            >
              {submitting ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </form>
      </div>
    </Page>
  );
}
