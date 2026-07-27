import { useState, useEffect } from "react";
import { Button } from "components/ui";
import axios from "utils/axios";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import Select from "react-select";

export function AddDispatchDetailModal({ din, onClose, onSuccess }) {
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    dispatchthrough: "",
    consignname: "",
    consignphone: "",
    empname: "",
    courrierno: "",
    dispatchdate: dayjs().format("YYYY-MM-DD"),
    expectedreturn: "",
    dispatchdetial: ""
  });
  const [dispatchOptions, setDispatchOptions] = useState([]);
  const [employeeOptions, setEmployeeOptions] = useState([]);

  useEffect(() => {
    if (din?.id) {
      axios.get(`profile/din-dispatch-through-options/${din.id}`).then(res => {
         if (res.data?.status && res.data?.data) {
             setDispatchOptions(res.data.data);
         }
      }).catch(err => {
         console.error("Error fetching dispatch options", err);
      });
      
      axios.get(`profile/din-employee-list/${din.id}`).then(res => {
         if (res.data?.status && res.data?.data) {
             const formatted = res.data.data.map(emp => ({ value: emp.id, label: emp.name }));
             setEmployeeOptions(formatted);
         }
      }).catch(err => console.error("Error fetching employee options", err));
    }
  }, [din]);

  if (!din) return null;

  // The grid passes "type" instead of "basis", handle both just in case
  const isReturnable = din.type === "Returnable" || din.basis === "Returnable";

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.dispatchthrough) {
      toast.error("Please select Dispatch Through");
      return;
    }
    if (formData.dispatchthrough === "1" && !formData.empname) {
      toast.error("Please enter Employee Name");
      return;
    }
    if (formData.dispatchthrough === "2" && !formData.consignname) {
      toast.error("Please enter Consignee Name");
      return;
    }
    if (formData.dispatchthrough === "3" && !formData.courrierno) {
      toast.error("Please enter Courier Name/No");
      return;
    }
    if (!formData.dispatchdate) {
      toast.error("Please enter Dispatch Date");
      return;
    }
    if (isReturnable && !formData.expectedreturn) {
      toast.error("Please enter Expected Return Date");
      return;
    }
    
    setSubmitting(true);
    try {
      const payload = {
        id: din.id,
        dispatchthrough: formData.dispatchthrough,
        dispatchdate: formData.dispatchdate ? dayjs(formData.dispatchdate).format("DD/MM/YYYY") : "",
        expectedreturn: isReturnable && formData.expectedreturn ? dayjs(formData.expectedreturn).format("DD/MM/YYYY") : "",
        dispatchdetial: formData.dispatchdetial
      };

      if (formData.dispatchthrough === "1") {
        payload.empname = formData.empname;
      } else if (formData.dispatchthrough === "2") {
        payload.consignname = formData.consignname;
        payload.consignphone = formData.consignphone;
      } else if (formData.dispatchthrough === "3") {
        payload.courrierno = formData.courrierno;
      }
      
      const res = await axios.post("profile/din-update-dispatch", payload);
      
      if (res.data.status || res.data.success) {
        toast.success(res.data.message || "Dispatch details added successfully");
        onSuccess();
      } else {
        toast.error(res.data.message || "Failed to add dispatch details");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while saving");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl dark:bg-gray-900 overflow-hidden">
        {/* ── Header ── */}
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-700">
          <h4 className="text-base font-semibold text-gray-800 dark:text-white">
            Add Dispatch Detail
          </h4>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg leading-none transition"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-700 dark:text-dark-200">Dispatch Through</label>
            <select 
              name="dispatchthrough" 
              value={formData.dispatchthrough} 
              onChange={handleInputChange} 
              className="form-input w-full rounded-lg border-gray-300 dark:border-dark-600 dark:bg-dark-900"
            >
              <option value="">Select One</option>
              {dispatchOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.name}
                </option>
              ))}
            </select>
          </div>

          {formData.dispatchthrough === "1" && (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-gray-700 dark:text-dark-200">Employee Name</label>
              <Select
                options={employeeOptions}
                value={employeeOptions.find(opt => opt.value === formData.empname) || null}
                onChange={(selected) => setFormData(prev => ({ ...prev, empname: selected ? selected.value : "" }))}
                placeholder="Search employee..."
                isClearable
                styles={{
                  control: (base) => ({
                    ...base,
                    borderRadius: "0.5rem",
                    borderColor: "#D1D5DB",
                    minHeight: "2.5rem",
                  }),
                }}
              />
            </div>
          )}

          {formData.dispatchthrough === "2" && (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-gray-700 dark:text-dark-200">Consignee Name</label>
                <input type="text" name="consignname" value={formData.consignname} onChange={handleInputChange} className="form-input w-full rounded-lg border-gray-300 dark:border-dark-600 dark:bg-dark-900" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-gray-700 dark:text-dark-200">Phone</label>
                <input type="text" name="consignphone" value={formData.consignphone} onChange={handleInputChange} className="form-input w-full rounded-lg border-gray-300 dark:border-dark-600 dark:bg-dark-900" />
              </div>
            </>
          )}

          {formData.dispatchthrough === "3" && (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-gray-700 dark:text-dark-200">Courier Name / No.</label>
              <input type="text" name="courrierno" value={formData.courrierno} onChange={handleInputChange} className="form-input w-full rounded-lg border-gray-300 dark:border-dark-600 dark:bg-dark-900" />
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-700 dark:text-dark-200">Dispatch Date</label>
            <input type="date" name="dispatchdate" value={formData.dispatchdate} onChange={handleInputChange} className="form-input w-full rounded-lg border-gray-300 dark:border-dark-600 dark:bg-dark-900" />
          </div>

          {isReturnable && (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-gray-700 dark:text-dark-200">Expected Returnable Date</label>
              <input type="date" name="expectedreturn" value={formData.expectedreturn} onChange={handleInputChange} className="form-input w-full rounded-lg border-gray-300 dark:border-dark-600 dark:bg-dark-900" />
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-700 dark:text-dark-200">Dispatch Detail</label>
            <textarea name="dispatchdetial" value={formData.dispatchdetial} onChange={handleInputChange} className="form-input w-full rounded-lg border-gray-300 dark:border-dark-600 dark:bg-dark-900" rows="3" />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
            <Button type="button" variant="soft" color="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" color="primary" disabled={submitting}>
              {submitting ? "Saving..." : "Submit"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
