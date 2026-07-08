import { useNavigate } from "react-router-dom";
import { useState } from "react";
import dayjs from "dayjs";
import axios from "utils/axios";
import { toast } from "sonner";
import clsx from "clsx";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/flatpickr.min.css";

import Select from "react-select";

// Local Imports
import { Button, Card } from "components/ui";
import { Page } from "components/shared/Page";

// ----------------------------------------------------------------------

const customSelectStyles = {
  control: (base, state) => ({
    ...base,
    minHeight: "36px",
    height: "36px",
    borderColor: state.isFocused ? "#3b82f6" : "#d1d5db",
    boxShadow: state.isFocused ? "0 0 0 1px rgba(59, 130, 246, 0.5)" : "none",
    "&:hover": {
      borderColor: "#3b82f6",
    },
    borderRadius: "0.375rem",
    fontSize: "0.875rem",
    color: "#374151",
  }),
  valueContainer: (base) => ({
    ...base,
    padding: "0 8px",
    height: "36px",
  }),
  indicatorsContainer: (base) => ({
    ...base,
    height: "36px",
  }),
  menu: (base) => ({
    ...base,
    zIndex: 9999,
  }),
  menuPortal: (base) => ({
    ...base,
    zIndex: 9999,
  }),
};

// ----------------------------------------------------------------------

const leaveTypeOptions = [
  { value: "CL", label: "Casual Leave (CL)" },
  { value: "SL", label: "Sick Leave (SL)" },
  { value: "EL", label: "Earned Leave (EL)" },
  { value: "CO", label: "Comp Off" },
];

export default function ApplyLeave() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    leaveType: "",
    compoffdate: null,
    startdate: null,
    enddate: null,
    reason: "",
  });

  const [errors, setErrors] = useState({});

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

  const validate = () => {
    const newErrors = {};
    if (!formData.leaveType) {
      newErrors.leaveType = "Leave Type is required";
    }

    if (formData.leaveType === "CO" && !formData.compoffdate) {
      newErrors.compoffdate = "Comp Off Date is required";
    }

    if (!formData.startdate) {
      newErrors.startdate = "Start Date is required";
    }

    if (!formData.enddate) {
      newErrors.enddate = "End Date is required";
    }

    if (formData.startdate && formData.enddate) {
      const d1 = dayjs(formData.startdate);
      const d2 = dayjs(formData.enddate);
      if (d2.isBefore(d1)) {
        newErrors.enddate = "End Date cannot be before Start Date";
      }
    }

    if (!formData.reason || formData.reason.trim() === "") {
      newErrors.reason = "Reason is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      toast.error("Please correct the form errors before submitting ❌");
      return;
    }

    // Leave-specific duration checks (Legacy PHP validation rules)
    const d1 = dayjs(formData.startdate).startOf("day");
    const d2 = dayjs(formData.enddate).startOf("day");
    const daysDiff = d2.diff(d1, "day") + 1; // Inclusive leave day count

    if (formData.leaveType === "EL") {
      if (daysDiff < 3) {
        toast.error("You cannot take EL less than 3 days ❌");
        return;
      }
      if (daysDiff > 5) {
        toast.error("You cannot take EL more than 5 days ❌");
        return;
      }
    } else if (formData.leaveType === "CL") {
      if (daysDiff > 3) {
        toast.error("You are not allowed to apply for CL more than 3 days ❌");
        return;
      }
    }

    setLoading(true);

    const payload = {
      leaveType: formData.leaveType,
      compoffdate: formData.leaveType === "CO" && formData.compoffdate
        ? dayjs(formData.compoffdate).format("YYYY-MM-DD")
        : "",
      startdate: formData.startdate ? dayjs(formData.startdate).format("YYYY-MM-DD") : "",
      enddate: formData.enddate ? dayjs(formData.enddate).format("YYYY-MM-DD") : "",
      reason: formData.reason,
    };

    try {
      const res = await axios.post("profile/apply-leave", payload);

      if (res.data.status) {
        toast.success(res.data.message || "Leave application submitted successfully", {
          duration: 3000,
        });
        navigate("/dashboards/profile/my-leaves");
      } else {
        toast.error(res.data.message || "Failed to submit leave application ❌");
      }
    } catch (err) {
      console.error("Error submitting leave application:", err);
      toast.error(
        err?.response?.data?.message || "Failed to submit leave application ❌"
      );
    } finally {
      setLoading(false);
    }
  };

  // Min date validation for Start Date: 1st of the previous month
  const minStartDate = dayjs()
    .subtract(1, "month")
    .startOf("month")
    .format("YYYY-MM-DD");

  return (
    <Page title="Apply Leave">
      <div className="transition-content p-6 space-y-6">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-wide text-gray-800 dark:text-dark-50">
              Apply Leave
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Submit your leave request for approval
            </p>
          </div>
          <Button
            variant="outline"
            className="text-white bg-blue-600 hover:bg-blue-700 font-medium"
            onClick={() => navigate("/dashboards/profile/my-leaves")}
          >
            &laquo; Leave List
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
          <Card className="p-6 border-none shadow-soft dark:bg-dark-700">
            <div className="space-y-5">
              {/* Leave Type Select */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-dark-200 mb-1.5">
                  Leave Type *
                </label>
                <Select
                  styles={customSelectStyles}
                  options={leaveTypeOptions}
                  value={leaveTypeOptions.find((opt) => opt.value === formData.leaveType) || null}
                  onChange={(opt) => {
                    setFormData((prev) => ({ ...prev, leaveType: opt ? opt.value : "" }));
                    if (errors.leaveType) {
                      setErrors((prev) => ({ ...prev, leaveType: "" }));
                    }
                  }}
                  placeholder="Select Leave Type"
                  isClearable
                  isSearchable
                  className="w-full text-sm"
                />
                {errors.leaveType && (
                  <p className="text-red-500 text-xs mt-1">{errors.leaveType}</p>
                )}
              </div>

              {/* Comp Off Date (Conditional) */}
              {formData.leaveType === "CO" && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-dark-200 mb-1.5">
                    Comp Off Date *
                  </label>
                  <Flatpickr
                    value={formData.compoffdate || ""}
                    options={{
                      dateFormat: "d/m/Y",
                      maxDate: dayjs().format("YYYY-MM-DD"),
                      allowInput: true,
                    }}
                    onChange={([date]) => {
                      setFormData((prev) => ({ ...prev, compoffdate: date || null }));
                      if (errors.compoffdate) setErrors((prev) => ({ ...prev, compoffdate: "" }));
                    }}
                    placeholder="DD/MM/YYYY"
                    className={clsx(
                      "form-input w-full rounded-lg border border-gray-300 bg-white px-3 h-9 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-dark-400 dark:bg-dark-800 dark:text-dark-100",
                      errors.compoffdate && "border-red-500 focus:border-red-500 focus:ring-red-500"
                    )}
                  />
                  {errors.compoffdate && (
                    <p className="text-red-500 text-xs mt-1">{errors.compoffdate}</p>
                  )}
                </div>
              )}

              {/* Start Date */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-dark-200 mb-1.5">
                  Start Date *
                </label>
                <Flatpickr
                  value={formData.startdate || ""}
                  options={{
                    dateFormat: "d/m/Y",
                    minDate: minStartDate,
                    allowInput: true,
                  }}
                  onChange={([date]) => {
                    setFormData((prev) => ({ ...prev, startdate: date || null, enddate: null }));
                    if (errors.startdate) setErrors((prev) => ({ ...prev, startdate: "" }));
                  }}
                  placeholder="DD/MM/YYYY"
                  className={clsx(
                    "form-input w-full rounded-lg border border-gray-300 bg-white px-3 h-9 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-dark-400 dark:bg-dark-800 dark:text-dark-100",
                    errors.startdate && "border-red-500 focus:border-red-500 focus:ring-red-500"
                  )}
                />
                {errors.startdate && (
                  <p className="text-red-500 text-xs mt-1">{errors.startdate}</p>
                )}
              </div>

              {/* End Date */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-dark-200 mb-1.5">
                  End Date *
                </label>
                <Flatpickr
                  value={formData.enddate || ""}
                  options={{
                    dateFormat: "d/m/Y",
                    minDate: formData.startdate || minStartDate,
                    allowInput: true,
                  }}
                  onChange={([date]) => {
                    setFormData((prev) => ({ ...prev, enddate: date || null }));
                    if (errors.enddate) setErrors((prev) => ({ ...prev, enddate: "" }));
                  }}
                  placeholder="DD/MM/YYYY"
                  className={clsx(
                    "form-input w-full rounded-lg border border-gray-300 bg-white px-3 h-9 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-dark-400 dark:bg-dark-800 dark:text-dark-100",
                    errors.enddate && "border-red-500 focus:border-red-500 focus:ring-red-500"
                  )}
                />
                {errors.enddate && (
                  <p className="text-red-500 text-xs mt-1">{errors.enddate}</p>
                )}
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-dark-200 mb-1.5">
                  Reason *
                </label>
                <textarea
                  rows="4"
                  name="reason"
                  placeholder="Provide a valid reason. If taking Comp Off, specify which date it is for."
                  value={formData.reason}
                  onChange={handleChange}
                  className={clsx(
                    "w-full rounded-lg border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 dark:border-dark-400 dark:bg-dark-800 dark:text-dark-100",
                    errors.reason && "border-red-500 focus:border-red-500 focus:ring-red-500"
                  )}
                />
                {errors.reason && (
                  <p className="text-red-500 text-xs mt-1">{errors.reason}</p>
                )}
              </div>
            </div>
          </Card>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/dashboards/profile/my-leaves")}
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
                  Submitting...
                </div>
              ) : (
                "Save changes"
              )}
            </Button>
          </div>
        </form>
      </div>
    </Page>
  );
}
