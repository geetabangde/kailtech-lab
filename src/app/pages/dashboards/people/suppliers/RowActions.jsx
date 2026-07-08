// Import Dependencies
import { useCallback, useState } from "react";
import PropTypes from "prop-types";

import { ConfirmModal } from "components/shared/ConfirmModal";
import { useNavigate } from "react-router";
import axios from "utils/axios";
import { toast } from "sonner";



// ----------------------------------------------------------------------

const confirmMessages = {
  pending: {
    description:
      "Are you sure you want to delete this supplier? Once deleted, it cannot be restored.",
  },
  success: {
    title: "Supplier Deleted",
  },
};

export function RowActions({ row, table }) {
  const navigate = useNavigate();
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
    setConfirmDeleteLoading(true);
    try {
      const id = row.original?.id;
      if (!id) throw new Error("Supplier ID is missing");
      
      const res = await axios.delete(`/people/delete-supplier/${id}`);
      
      if (res.data?.status === "true" || res.data?.status === true) {
        setDeleteSuccess(true);
        toast.success(res.data.message || "Supplier deleted successfully");
        table.options.meta?.deleteRow(row);
      } else {
        setDeleteError(true);
        toast.error(res.data?.message || "Failed to delete supplier");
      }
    } catch (err) {
      console.error(err);
      setDeleteError(true);
      toast.error(err.response?.data?.message || err.response?.data?.error || "Error deleting supplier");
    } finally {
      setConfirmDeleteLoading(false);
      setTimeout(() => {
        closeModal();
      }, 500);
    }
  }, [row, table]);

  const state = deleteError ? "error" : deleteSuccess ? "success" : "pending";

  return (
    <>
      <div className="flex items-center justify-center gap-2">
        {/* Edit Button */}
        <button
          onClick={() => navigate(`/dashboards/people/suppliers/edit/${row.original.id}`)}
          className="inline-flex items-center justify-center rounded-md bg-blue-50 px-4 py-1.5 text-xs font-bold text-blue-700 transition hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 min-w-[60px]"
        >
          <span>Edit</span>
        </button>

        {/* Delete Button */}
        <button
          onClick={openModal}
          className="inline-flex items-center justify-center rounded-md bg-red-50 px-4 py-1.5 text-xs font-bold text-red-700 transition hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 min-w-[60px]"
        >
          <span>Delete</span>
        </button>
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
  row: PropTypes.object,
  table: PropTypes.object,
};
