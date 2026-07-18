import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { useState, useCallback } from "react";
import axios from "utils/axios";
import { toast } from "sonner";

// ----------------------------------------------------------------------

export function RowActions({ row, table }) {
  const { id, status } = row.original;
  // Parse permissions and ensure they are an array of numbers for safe checking
  let rawPermissions = [];
  try {
    const parsed = JSON.parse(localStorage.getItem("userPermissions") || "[]");
    rawPermissions = Array.isArray(parsed) ? parsed : (typeof parsed === 'string' ? parsed.split(',') : [parsed]);
  } catch (e) {
    console.error("Error parsing permissions:", e);
  }
  const permissions = rawPermissions.map(Number);
  const [loading, setLoading] = useState(false);

  const handleApprove = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.post(`/accounts/approve-consentletter/${id}`);
      
      if (response.status === 200 || response.data?.message === "Consent letter approved") {
        toast.success(response.data?.message || "Consent Letter Approved ✅");
        
        table.options.meta?.updateData(row.index, "status", 1);
        
        // Use the correct accessor key 'conosentletterno' instead of 'consent_no'
        const newConsentNo = response.data?.consent_letter_no || response.data?.conosentletterno || response.data?.consentno;
        if (newConsentNo) {
          table.options.meta?.updateData(row.index, "conosentletterno", newConsentNo);
        }
      } else {
        toast.error(response.data?.message || "Failed to approve.");
      }
    } catch (err) {
      console.error("Approve error:", err);
      toast.error(err?.response?.data?.message || "Failed to approve consent letter.");
    } finally {
      setLoading(false);
    }
  }, [id, row.index, table.options.meta]);

  // Check for status 0, '0', or 'Pending' (case-insensitive)
  const isPending = 
    status === 0 || 
    status === "0" || 
    (typeof status === 'string' && status.toLowerCase() === 'pending');

  return (
    <div className="flex items-center justify-center gap-2">
      <Link
        to={`/dashboards/accounts/consent-letter/view/${id}`}
        className="inline-flex items-center h-8 rounded-md bg-blue-600 px-3 text-xs font-medium text-white hover:bg-blue-700 shadow-sm transition"
      >
        View
      </Link>
      
      {isPending && permissions.includes(364) && (
        <button
          onClick={handleApprove}
          disabled={loading}
          className="inline-flex items-center h-8 rounded-md bg-green-600 px-3 text-xs font-medium text-white hover:bg-green-700 shadow-sm transition disabled:opacity-50"
        >
          {loading ? "Approve..." : "Approve"}
        </button>
      )}
    </div>
  );
}

RowActions.propTypes = {
  row: PropTypes.object,
};
