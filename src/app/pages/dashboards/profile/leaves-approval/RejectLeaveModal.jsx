import { useState, useEffect } from "react";
import dayjs from "dayjs";
import axios from "utils/axios";
import { toast } from "sonner";
import { LEAVE_TYPE_MAP } from "./data";

// ----------------------------------------------------------------------

function formatDate(dateStr) {
  if (!dateStr || dateStr.startsWith("0000")) return "—";
  return dayjs(dateStr).format("DD/MM/YYYY");
}

// ----------------------------------------------------------------------

export default function RejectLeaveModal({ open, leaveRow, onClose, onSuccess }) {
  const [rejectionReason, setRejectionReason] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setRejectionReason("");
    }
  }, [open]);

  if (!open || !leaveRow) return null;

  const leaveTypeLabel =
    LEAVE_TYPE_MAP[leaveRow.leaveType] || leaveRow.leaveType || "—";

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!rejectionReason.trim()) {
      toast.error("Rejection reason is required");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`profile/reject-leave/${leaveRow.id}`, {
        leaveType: leaveRow.leaveType,
        startdate: dayjs(leaveRow.startdate).format("YYYY-MM-DD"),
        enddate: dayjs(leaveRow.enddate).format("YYYY-MM-DD"),
        reason2: rejectionReason.trim(),
      });

      if (res.data.status) {
        toast.success(res.data.message || "Leave rejected successfully ✅");
        onSuccess?.();
        onClose();
      } else {
        toast.error(res.data.message || "Failed to reject leave ❌");
      }
    } catch (err) {
      console.error("Reject leave error:", err);
      toast.error(err.response?.data?.message || "Failed to reject leave ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl dark:bg-dark-700">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-dark-500">
          <h2 className="text-base font-bold text-gray-800 dark:text-dark-100">
            Reject Leave
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
              {/* Leave Type (display only) */}
              <tr className="border-b border-gray-100 dark:border-dark-600">
                <td className="py-3 pr-4 font-medium text-gray-600 dark:text-dark-300 w-40">
                  Leave type:
                </td>
                <td className="py-3 text-gray-700 dark:text-dark-200">
                  {leaveTypeLabel}
                </td>
              </tr>

              {/* Start Date (display only) */}
              <tr className="border-b border-gray-100 dark:border-dark-600">
                <td className="py-3 pr-4 font-medium text-gray-600 dark:text-dark-300">
                  Start Date:
                </td>
                <td className="py-3 text-gray-700 dark:text-dark-200">
                  {formatDate(leaveRow.startdate)}
                </td>
              </tr>

              {/* End Date (display only) */}
              <tr className="border-b border-gray-100 dark:border-dark-600">
                <td className="py-3 pr-4 font-medium text-gray-600 dark:text-dark-300">
                  End Date:
                </td>
                <td className="py-3 text-gray-700 dark:text-dark-200">
                  {formatDate(leaveRow.enddate)}
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

              {/* Rejection Reason (required textarea) */}
              <tr>
                <td className="py-3 pr-4 font-medium text-gray-600 dark:text-dark-300 align-top pt-4">
                  Rejection Reason: <span className="text-red-500">*</span>
                </td>
                <td className="py-3">
                  <textarea
                    rows={3}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Enter rejection reason..."
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
              className="px-5 py-2 rounded-lg bg-red-600 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50 transition shadow-sm"
            >
              {loading ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
