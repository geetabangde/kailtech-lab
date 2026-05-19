// Import Dependencies
import { useCallback, useState } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router";

// Local Imports
import { ConfirmModal } from "components/shared/ConfirmModal";
import axios from "utils/axios";
import { toast } from "sonner";

// ----------------------------------------------------------------------

const confirmMessages = {
  pending: {
    description:
      "Are you sure you want to reject this purchase order? Once rejected, it cannot be restored.",
  },
  success: {
    title: "Purchase Order Rejected",
  },
};

export function RowActions({ row }) {
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [confirmRejectLoading, setConfirmRejectLoading] = useState(false);
  const [rejectSuccess, setRejectSuccess] = useState(false);
  const [rejectError, setRejectError] = useState(false);
  const navigate = useNavigate();

  const id = row?.original?.id;

  const closeModal = () => {
    setRejectModalOpen(false);
  };

  const openModal = () => {
    setRejectModalOpen(true);
    setRejectError(false);
    setRejectSuccess(false);
  };

  const handleApprove = useCallback(() => {
    const id = row.original.id;
    // PHP: window.location.href = "edit_Purchase Order_approve.php?hakuna=" + id;
    navigate(`/dashboards/inventory/purchase-order/edit-purchase-order-approve?hakuna=${id}`);
  }, [row, navigate]);

  const handleReject = useCallback(async () => {
    const id = row.original.id;
    setConfirmRejectLoading(true);

    try {
      // PHP: sendForm('id', [id, decision], 'reject_Purchase Order.php', 'resultid', 'Purchase Orderdec');
      await axios.post("/inventory/reject-purchase-order", { 
        id: id,
        decision: "reject"
      });
      setRejectSuccess(true);
      toast.success("Purchase Order rejected successfully", {
        duration: 1000,
        icon: "",
      });
    } catch (error) {
      console.error("Reject failed:", error);
      setRejectError(true);
      toast.error("Failed to reject purchase order", {
        duration: 2000,
      });
    } finally {
      setConfirmRejectLoading(false);
    }
  }, [row]);

  const state = rejectError ? "error" : rejectSuccess ? "success" : "pending";

  return (
    <>
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        {/* ✅ View Details - Always Purple if PO exists */}
        <button
          onClick={() => navigate(`/dashboards/inventory/purchase-order/view-full-purchase-order?hakuna=${id}`)}
          className="inline-flex items-center justify-center rounded-md bg-purple-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-purple-700 min-w-[90px]"
        >
          View Details
        </button>

        {/* ✅ View MRN - Green button from screenshot */}
        <button
          onClick={() => navigate(`/dashboards/inventory/purchase-order/mrn-challan?hakuna=${id}`)}
          className="inline-flex items-center justify-center rounded-md bg-green-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-green-700 min-w-[80px]"
        >
          View MRN
        </button>

        {/* ✅ Approve/Reject if pending (Status 0 or similar) */}
        {row.original.status === 0 && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleApprove}
              className="inline-flex items-center justify-center rounded-md bg-green-500 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-green-600 min-w-[70px]"
            >
              Approve
            </button>
            <button
              onClick={openModal}
              className="inline-flex items-center justify-center rounded-md bg-red-500 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-red-600 min-w-[70px]"
            >
              Reject
            </button>
          </div>
        )}
      </div>

      <ConfirmModal
        show={rejectModalOpen}
        onClose={closeModal}
        messages={confirmMessages}
        onOk={handleReject}
        confirmLoading={confirmRejectLoading}
        state={state}
      />
    </>
  );
}

RowActions.propTypes = {
  row: PropTypes.object,
};
