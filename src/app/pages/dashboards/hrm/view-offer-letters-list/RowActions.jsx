// Import Dependencies
import { useCallback, useState } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";

// Local Imports
import { ConfirmModal } from "components/shared/ConfirmModal";
import axios from "utils/axios";
import { toast } from "sonner";
import { getStoredPermissions } from "app/navigation/dashboards";

// ----------------------------------------------------------------------

const confirmMessages = {
  pending: {
    description:
      "Are you sure you want to delete this offer letter? Once deleted, it cannot be restored.",
  },
  success: {
    title: "Offer Letter Deleted",
  },
};

export function RowActions({ row, table }) {
  const permissions = getStoredPermissions();

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [confirmDeleteLoading, setConfirmDeleteLoading] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [deleteError, setDeleteError] = useState(false);

  const closeModal = () => {
    setDeleteModalOpen(false);
  };

  const openModal = () => {
    setDeleteModalOpen(true);
    setDeleteError(false);
    setDeleteSuccess(false);
  };

  const handleDeleteRows = useCallback(async () => {
    const id = row.original.id;
    setConfirmDeleteLoading(true);

    try {
      try {
        await axios.delete(`/hrm/delete-offer-letter/${id}`);
      } catch (err) {
        // Fallback for API variance
        if (err?.response?.status === 404) {
          await axios.delete(`/hrm/delete-offerletter/${id}`);
        } else {
          throw err;
        }
      }

      table.options.meta?.deleteRow(row); // remove row from UI
      setDeleteSuccess(true);
      toast.success("Offer letter deleted successfully", {
        duration: 1000,
        icon: "🗑️",
      });
    } catch (error) {
      console.error("Delete failed:", error);
      setDeleteError(true);
      toast.error("Failed to delete offer letter ❌", {
        duration: 2000,
      });
    } finally {
      setConfirmDeleteLoading(false);
    }
  }, [row, table]);

  const state = deleteError ? "error" : deleteSuccess ? "success" : "pending";

  // Check if user has permission to delete/view
  const canDelete = permissions.includes(249);
  const canView = permissions.includes(246);

  return (
    <>
      <div className="flex items-center justify-center gap-2">
        {canView && (
          <Link
            to={`/dashboards/hrm/view-offer-letters-list/view/${row.original.id}`}
            className="inline-flex items-center justify-center rounded-md bg-blue-50 px-4 py-1.5 text-xs font-bold text-blue-700 transition hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 min-w-[60px]"
          >
            <span>View</span>
          </Link>
        )}
        {canDelete && (
          <button
            onClick={openModal}
            className="inline-flex items-center justify-center rounded-md bg-red-50 px-4 py-1.5 text-xs font-bold text-red-700 transition hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 min-w-[60px]"
          >
            <span>Delete</span>
          </button>
        )}
        {!canView && !canDelete && (
          <span className="text-xs text-gray-400 italic">No Actions</span>
        )}
      </div>

      <ConfirmModal
        show={deleteModalOpen}
        onClose={closeModal}
        messages={confirmMessages}
        onOk={handleDeleteRows}
        confirmLoading={confirmDeleteLoading}
        state={state}
      />
    </>
  );
}

RowActions.propTypes = {
  row: PropTypes.object.isRequired,
  table: PropTypes.object.isRequired,
};
