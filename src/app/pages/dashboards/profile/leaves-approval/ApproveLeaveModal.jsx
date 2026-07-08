import { useState, useEffect } from "react";
import dayjs from "dayjs";
import axios from "utils/axios";
import { toast } from "sonner";
import Select from "react-select";
import { leaveTypeOptions } from "./data";

const selectStyles = {
  control: (base, state) => ({
    ...base,
    minHeight: "36px",
    borderColor: state.isFocused ? "#3b82f6" : "#d1d5db",
    boxShadow: state.isFocused ? "0 0 0 1px rgba(59,130,246,0.5)" : "none",
    "&:hover": { borderColor: "#3b82f6" },
    borderRadius: "0.375rem",
    fontSize: "0.875rem",
  }),
  menu: (base) => ({ ...base, zIndex: 9999 }),
};

// Format date for display: "DD/MM/YYYY HH:mm:ss"
function formatDate(dateStr) {
  if (!dateStr || dateStr.startsWith("0000")) return "—";
  return dayjs(dateStr).format("DD/MM/YYYY");
}

// ----------------------------------------------------------------------

export default function ApproveLeaveModal({ open, leaveRow, onClose, onSuccess }) {
  const [leaveType, setLeaveType] = useState("");
  const [approvalReason, setApprovalReason] = useState("");
  const [loading, setLoading] = useState(false);

  // Pre-fill leave type from the row when modal opens
  useEffect(() => {
    if (open && leaveRow) {
      setLeaveType(leaveRow.leaveType || "");
      setApprovalReason("");
    }
  }, [open, leaveRow]);

  if (!open || !leaveRow) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!approvalReason.trim()) {
      toast.error("Approval reason is required");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`profile/approve-leave/${leaveRow.id}`, {
        leaveType,
        startdate: dayjs(leaveRow.startdate).format("YYYY-MM-DD"),
        enddate: dayjs(leaveRow.enddate).format("YYYY-MM-DD"),
        reason2: approvalReason.trim(),
      });

      if (res.data.status) {
        toast.success(res.data.message || "Leave approved successfully ✅");
        onSuccess?.();
        onClose();
      } else {
        toast.error(res.data.message || "Failed to approve leave ❌");
      }
    } catch (err) {
      console.error("Approve leave error:", err);
      toast.error(err.response?.data?.message || "Failed to approve leave ❌");
    } finally {
      setLoading(false);
    }
  };

  const selectedLeaveTypeOpt =
    leaveTypeOptions.find((o) => o.value === leaveType) || null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl dark:bg-dark-700">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-dark-500">
          <h2 className="text-base font-bold text-gray-800 dark:text-dark-100">
            Approve Leave
          </h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-xl text-gray-400 hover:text-gray-700 transition disabled:opacity-50"
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-6 py-5">
          <table className="w-full text-sm border-collapse">
            <tbody>
              {/* Leave Type */}
              <tr className="border-b border-gray-100 dark:border-dark-600">
                <td className="py-3 pr-4 font-medium text-gray-600 dark:text-dark-300 w-40">
                  Leave type:
                </td>
                <td className="py-3">
                  <Select
                    styles={selectStyles}
                    options={leaveTypeOptions}
                    value={selectedLeaveTypeOpt}
                    onChange={(opt) => setLeaveType(opt ? opt.value : "")}
                    placeholder="Select leave type"
                    isSearchable
                    menuPortalTarget={document.body}
                  />
                </td>
              </tr>

              {/* Start Date (readonly) */}
              <tr className="border-b border-gray-100 dark:border-dark-600">
                <td className="py-3 pr-4 font-medium text-gray-600 dark:text-dark-300">
                  Start Date:
                </td>
                <td className="py-3">
                  <input
                    type="text"
                    readOnly
                    value={formatDate(leaveRow.startdate)}
                    className="form-input w-full rounded-lg border-gray-300 bg-gray-50 px-3 h-9 text-sm cursor-default dark:border-dark-400 dark:bg-dark-800 dark:text-dark-100"
                  />
                </td>
              </tr>

              {/* End Date (readonly) */}
              <tr className="border-b border-gray-100 dark:border-dark-600">
                <td className="py-3 pr-4 font-medium text-gray-600 dark:text-dark-300">
                  End Date:
                </td>
                <td className="py-3">
                  <input
                    type="text"
                    readOnly
                    value={formatDate(leaveRow.enddate)}
                    className="form-input w-full rounded-lg border-gray-300 bg-gray-50 px-3 h-9 text-sm cursor-default dark:border-dark-400 dark:bg-dark-800 dark:text-dark-100"
                  />
                </td>
              </tr>

              {/* Reason (display only) */}
              <tr className="border-b border-gray-100 dark:border-dark-600">
                <td className="py-3 pr-4 font-medium text-gray-600 dark:text-dark-300">
                  Reason:
                </td>
                <td className="py-3 text-gray-700 dark:text-dark-200">
                  {leaveRow.reason || "—"}
                </td>
              </tr>

              {/* Approval Reason (required textarea) */}
              <tr>
                <td className="py-3 pr-4 font-medium text-gray-600 dark:text-dark-300 align-top pt-4">
                  Approval Reason: <span className="text-red-500">*</span>
                </td>
                <td className="py-3">
                  <textarea
                    rows={3}
                    value={approvalReason}
                    onChange={(e) => setApprovalReason(e.target.value)}
                    placeholder="Enter approval reason..."
                    disabled={loading}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-dark-400 dark:bg-dark-800 dark:text-dark-100"
                  />
                </td>
              </tr>
            </tbody>
          </table>

          {/* Footer buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-dark-600 mt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition dark:border-dark-500 dark:bg-dark-700 dark:text-dark-200"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-lg bg-blue-600 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50 transition shadow-sm"
            >
              {loading ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
