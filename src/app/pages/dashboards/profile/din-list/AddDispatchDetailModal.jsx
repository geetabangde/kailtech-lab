import { useState } from "react";
import { Button } from "components/ui";
import axios from "utils/axios";
import toast from "react-hot-toast";
import dayjs from "dayjs";

export function AddDispatchDetailModal({ din, onClose, onSuccess }) {
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    dispatchthrough: "",
    consignname: "",
    consignphone: "",
    dispatchdate: dayjs().format("YYYY-MM-DD"),
    expectedreturn: "",
    dispatchdetial: ""
  });

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
    if (["2", "3"].includes(formData.dispatchthrough) && !formData.consignname) {
      toast.error("Please enter Consignee Name");
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
        din_id: din.id,
        dispatchthrough: formData.dispatchthrough,
        consignname: formData.consignname,
        consignphone: formData.consignphone,
        dispatchdate: formData.dispatchdate ? dayjs(formData.dispatchdate).format("DD/MM/YYYY") : "",
        expectedreturn: formData.expectedreturn ? dayjs(formData.expectedreturn).format("DD/MM/YYYY") : "",
        dispatchdetial: formData.dispatchdetial
      };
      
      // Submit to the equivalent API endpoint of insertdispatchdetail.php
      const res = await axios.post("inventory/insert-dispatch-detail", payload);
      
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
              <option value="1">By Hand</option>
              <option value="2">Consignee</option>
              <option value="3">Courier</option>
            </select>
          </div>

          {["2", "3"].includes(formData.dispatchthrough) && (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-gray-700 dark:text-dark-200">Consignee/Courier Name</label>
                <input type="text" name="consignname" value={formData.consignname} onChange={handleInputChange} className="form-input w-full rounded-lg border-gray-300 dark:border-dark-600 dark:bg-dark-900" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-gray-700 dark:text-dark-200">Phone</label>
                <input type="text" name="consignphone" value={formData.consignphone} onChange={handleInputChange} className="form-input w-full rounded-lg border-gray-300 dark:border-dark-600 dark:bg-dark-900" />
              </div>
            </>
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
