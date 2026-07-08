import PropTypes from "prop-types";
import { useState } from "react";
import { ConfirmModal } from "components/shared/ConfirmModal";

// ----------------------------------------------------------------------

export function RowActions({ row }) {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleReject = () => {
    setShowConfirm(true);
  };

  const handleConfirm = () => {
    // Add logic here to actually reject the parameter via API
    console.log("Rejected parameter id:", row.original.id);
    setShowConfirm(false);
  };

  return (
    <div className="flex justify-center">
      <button
        onClick={handleReject}
        className="rounded-lg bg-red-50 px-4 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-100 focus:outline-none dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20 transition-colors"
      >
        Reject Parameter
      </button>

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
    </div>
  );
}

RowActions.propTypes = {
  row: PropTypes.object,
  table: PropTypes.object,
};

