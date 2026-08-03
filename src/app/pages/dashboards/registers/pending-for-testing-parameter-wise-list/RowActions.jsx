import PropTypes from "prop-types";
import { useState } from "react";
import axios from "utils/axios";
import { toast } from "sonner";
import { ConfirmModal } from "components/shared/ConfirmModal";
import { ReassignChemistModal } from "./ReassignChemistModal";

// ----------------------------------------------------------------------

export function RowActions({ row, table }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [showReassign, setShowReassign] = useState(false);
  const [loading, setLoading] = useState(false);
  const permissions = JSON.parse(localStorage.getItem("userPermissions") || "[]");

  const canReassign = permissions.includes(272);
  const canReject = permissions.includes(359);

  const handleReject = () => {
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    try {
      setLoading(true);
      await axios.post(`register/reject-parameter/${row.original.id}`);
      toast.success("Parameter rejected successfully ✅");
      setShowConfirm(false);

      const tableInstance = table || row.table;
      if (tableInstance?.options?.meta?.deleteRow) {
        tableInstance.options.meta.deleteRow(row);
      } else {
        window.location.reload();
      }
    } catch (error) {
      console.error("Reject failed:", error);
      toast.error(error.response?.data?.message || "Failed to reject parameter ❌");
    } finally {
      setLoading(false);
    }
  };

  const handleReassign = () => {
    setShowReassign(true);
  };

  return (
    <div className="flex items-center justify-center gap-3">
      {canReassign && row.original.status === 0 && (
        <button
          onClick={handleReassign}
          className="rounded-lg bg-blue-50 px-4 py-1.5 text-sm font-semibold text-blue-600 hover:bg-blue-100 focus:outline-none dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20 transition-colors"
        >
          Re-assign
        </button>
      )}

      {canReject && (
        <button
          onClick={handleReject}
          disabled={loading}
          className="rounded-lg bg-red-50 px-4 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-100 focus:outline-none dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20 transition-colors disabled:opacity-50"
        >
          {loading ? "Rejecting..." : "Reject Parameter"}
        </button>
      )}

      <ConfirmModal
        show={showConfirm}
        onClose={() => setShowConfirm(false)}
        onOk={handleConfirm}
        state="pending"
        messages={{
          pending: {
            title: "Validate",
            description: "Are you sure you want to process?",
            actionText: "OK",
          },
        }}
      />

      <ReassignChemistModal
        show={showReassign}
        onClose={() => setShowReassign(false)}
        row={row}
      />
    </div>
  );
}

RowActions.propTypes = {
  row: PropTypes.object,
  table: PropTypes.object,
};

