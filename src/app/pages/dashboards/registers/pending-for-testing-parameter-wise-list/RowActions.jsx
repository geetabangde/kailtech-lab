import PropTypes from "prop-types";
import { useState } from "react";
import { ConfirmModal } from "components/shared/ConfirmModal";
import { ReassignChemistModal } from "./ReassignChemistModal";

// ----------------------------------------------------------------------

export function RowActions({ row }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [showReassign, setShowReassign] = useState(false);
  const permissions = JSON.parse(localStorage.getItem("userPermissions") || "[]");

  const canReassign = permissions.includes(272);
  const canReject = permissions.includes(359);

  const handleReject = () => {
    setShowConfirm(true);
  };

  const handleConfirm = () => {
    // Add logic here to actually reject the parameter via API
    console.log("Rejected parameter id:", row.original.id);
    setShowConfirm(false);
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
          className="rounded-lg bg-red-50 px-4 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-100 focus:outline-none dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20 transition-colors"
        >
          Reject Parameter
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

