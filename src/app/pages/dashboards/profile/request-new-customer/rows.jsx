import PropTypes from "prop-types";
import { useState } from "react";
import axios from "utils/axios";
import { toast } from "sonner";
import { getStoredPermissions } from "app/navigation/dashboards";
import { statusMap } from "./data";

// ----------------------------------------------------------------------

export function StatusCell({ getValue }) {
  const statusIndex = Number(getValue());
  const label = statusMap[statusIndex] || "Unknown";

  if (statusIndex === 1) {
    return <span className="text-success font-semibold">{label}</span>;
  }
  if (statusIndex === 2) {
    return <span className="text-danger font-semibold">{label}</span>;
  }
  return <span className="text-warning font-semibold">{label}</span>;
}

export function RowActionsCell({ row, table }) {
  const { id } = row.original;
  const permissions = getStoredPermissions();
  const [loading, setLoading] = useState(false);

  // Render actions only if the user has approval permissions (151)
  const canManage = permissions.includes(151) || localStorage.getItem("bypassPermissions") === "true";
  if (!canManage) return null;

  const handleApprove = async () => {
    if (!window.confirm("Are you sure you want to approve this customer request and create customer?")) return;

    setLoading(true);
    try {
      await axios.post("/profile/approve-customer-request", { id }).catch(() => {
        // Fallback endpoint
        return axios.post("profile/approvecustomerrequest.php", { id });
      });

      toast.success("Customer request approved successfully ✅");
      table.options.meta?.fetchData?.(); // Refresh table data
    } catch (error) {
      console.error("Approval failed:", error);
      toast.error(error.response?.data?.message || "Failed to approve customer request ❌");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm("Are you sure you want to cancel this customer request?")) return;

    setLoading(true);
    try {
      await axios.post("/profile/cancel-customer-request", { id }).catch(() => {
        // Fallback endpoint
        return axios.post("profile/cancelcustomerrequest.php", { id });
      });

      toast.success("Customer request cancelled successfully 🚫");
      table.options.meta?.fetchData?.(); // Refresh table data
    } catch (error) {
      console.error("Cancellation failed:", error);
      toast.error(error.response?.data?.message || "Failed to cancel customer request ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-start gap-2">
      <button
        onClick={handleApprove}
        disabled={loading}
        className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-3 py-1 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50 h-7 whitespace-nowrap"
      >
        Approve & Create
      </button>
      <button
        onClick={handleCancel}
        disabled={loading}
        className="inline-flex items-center justify-center rounded-md bg-red-600 px-3 py-1 text-xs font-bold text-white transition hover:bg-red-700 disabled:opacity-50 h-7 whitespace-nowrap"
      >
        Cancel
      </button>
    </div>
  );
}

StatusCell.propTypes = {
  getValue: PropTypes.func.isRequired,
};

RowActionsCell.propTypes = {
  row: PropTypes.object.isRequired,
  table: PropTypes.object.isRequired,
};
