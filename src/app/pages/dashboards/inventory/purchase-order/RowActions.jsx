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
      "Are you sure you want to delete this purchase order? Once deleted, it cannot be restored.",
  },
  success: {
    title: "Purchase Order Deleted",
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
    // PHP: window.location.href = "approvepo.php?hakuna=" + id;
    navigate(`/dashboards/inventory/purchase-order/approve-po?hakuna=${id}`);
  }, [row, navigate]);

  const handleDelete = useCallback(async () => {
    const id = row.original.id;
    setConfirmRejectLoading(true);

    try {
      await axios.post("/inventory/delete-purchase-order", { 
        id: id
      });
      setRejectSuccess(true);
      toast.success("Purchase Order deleted successfully", {
        duration: 1000,
        icon: "",
      });
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error("Delete failed:", error);
      setRejectError(true);
      toast.error("Failed to delete purchase order", {
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

        {/* ✅ View MRN - Only if status is 1 (Approved) */}
        {row.original.status == 1 && (
          <button
            onClick={() => navigate(`/dashboards/inventory/purchase-order/mrn-challan?hakuna=${id}`)}
            className="inline-flex items-center justify-center rounded-md bg-green-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-green-700 min-w-[80px]"
          >
            View MRN
          </button>
        )}

        {/* ✅ Approve/Reject if pending (Status -1 or 0 depending on API, using PHP -1 mapping) */}
        {(row.original.status == -1 || row.original.status == 0) && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleApprove}
              className="inline-flex items-center justify-center rounded-md bg-green-500 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-green-600 min-w-[70px]"
            >
              Approve {row.original.ordertype === "WO" ? "WO" : "PO"}
            </button>
            <button
              onClick={openModal}
              className="inline-flex items-center justify-center rounded-md bg-red-500 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-red-600 min-w-[70px]"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      <ConfirmModal
        show={rejectModalOpen}
        onClose={closeModal}
        messages={confirmMessages}
        onOk={handleDelete}
        confirmLoading={confirmRejectLoading}
        state={state}
      />
    </>
  );
}

RowActions.propTypes = {
  row: PropTypes.object,
};
