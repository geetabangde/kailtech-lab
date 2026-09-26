import { useState, useEffect } from "react";
import axios from "utils/axios";
import { toast } from "react-hot-toast";

export default function ApproveRejectModal({
  open,
  onClose,
  revRequestId,
  initialReason = "",
  initialRemark = "",
  onSuccess,
}) {
  const [reason, setReason] = useState("");
  const [remark, setRemark] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setReason(initialReason);
      setRemark(initialRemark);

      // ✅ Debug log to verify revRequestId
      console.log("Modal opened with revRequestId:", revRequestId);
    }
  }, [open, initialReason, initialRemark, revRequestId]);

  if (!open) return null;

  const handleAction = async (actionType) => {
    // ✅ Validate inputs
    if (!reason.trim()) {
      toast.error("Reason is required");
      return;
    }

    if (!remark.trim()) {
      toast.error("Remark is required");
      return;
    }

    if (!revRequestId) {
      toast.error("Request ID is missing. Please try again.");
      console.error("revRequestId is undefined!");
      return;
    }

    setLoading(true);
    try {
      const url =
        actionType === "approve"
          ? "calibrationoperations/approve-lrncancel-requests"
          : "calibrationoperations/reject-lrncancel-requests";

      const payload = {
        revrequestid: Number(revRequestId), // ✅ Ensure number type
        reason: reason.trim(),
        remark: remark ? remark.trim() : "",
      };

      console.log(`${actionType} payload:`, payload); // Debug

      const response = await axios.post(url, payload);

      if (response.data && response.data.status === false) {
        toast.error(response.data.message || "Operation failed");
        setLoading(false);
        return;
      }

      toast.success(
        response.data?.message ||
        (actionType === "approve"
          ? "Request Approved Successfully"
          : "Request Rejected Successfully")
      );

      // ✅ Reset form after success
      setReason("");
      setRemark("");

      // Call success callback
      if (onSuccess) {
        await onSuccess();
      }

      // Close modal
      onClose();
    } catch (error) {
      console.error("API Error:", error);

      let errorMessage = "Something went wrong. Please try again.";
      if (typeof error === "string") {
        errorMessage = error;
      } else if (error.response?.data) {
        const data = error.response.data;
        if (data.message) {
          errorMessage = data.message;
        } else if (data.errors) {
          errorMessage = typeof data.errors === "string" ? data.errors : JSON.stringify(data.errors);
        }
      }

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">
            Approve / Reject Revision Request
            {revRequestId && (
              <span className="text-sm text-gray-500 ml-2">
                (ID: {revRequestId})
              </span>
            )}
          </h2>
          <button
            onClick={onClose}
            className="text-2xl hover:text-gray-700 transition"
            disabled={loading}
          >
            &times;
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1">
              Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason for approval/rejection"
              disabled={loading}
            />
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">
              Remark <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="Enter additional remarks"
              disabled={loading}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 disabled:opacity-50 transition"
          >
            Cancel
          </button>

          <button
            disabled={loading}
            onClick={() => handleAction("reject")}
            className="px-4 py-2 rounded text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 cursor-pointer transition"
          >
            {loading ? "Processing..." : "Reject"}
          </button>

          <button
            disabled={loading}
            onClick={() => handleAction("approve")}
            className="px-4 py-2 rounded text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 cursor-pointer transition"
          >
            {loading ? "Processing..." : "Approve"}
          </button>
        </div>
      </div>
    </div>
  );
}