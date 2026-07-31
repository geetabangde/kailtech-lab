import { Fragment, useCallback, useState } from "react";
import { Link } from "react-router-dom";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import PropTypes from "prop-types";

// Local Imports
import axios from "utils/axios";
import { toast } from "sonner";

// ----------------------------------------------------------------------

// ─── Approve Confirmation Dialog ─────────────────────────────────────────────

function ApproveConfirmModal({ show, onClose, onConfirm, loading }) {
  return (
    <Transition appear show={show} as={Fragment}>
      <Dialog as="div" className="relative z-[210]" onClose={() => !loading && onClose()}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-150"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
        </TransitionChild>

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-150"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-100"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <DialogPanel className="w-full max-w-sm rounded-xl bg-white shadow-2xl dark:bg-dark-800 p-6">
              <DialogTitle className="text-base font-semibold text-gray-800 dark:text-dark-100 mb-2">
                Validate
              </DialogTitle>
              <p className="text-sm text-gray-600 dark:text-dark-300 mb-6">
                Are you sure you want to Process?
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:text-gray-800 disabled:opacity-50 dark:text-dark-300 dark:hover:text-dark-100"
                >
                  CANCEL
                </button>
                <button
                  onClick={onConfirm}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-primary-500 transition-colors hover:text-primary-600 disabled:opacity-50"
                >
                  {loading && (
                    <svg className="size-4 animate-spin" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z" />
                    </svg>
                  )}
                  OK
                </button>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
}

ApproveConfirmModal.propTypes = {
  show: PropTypes.bool,
  onClose: PropTypes.func,
  onConfirm: PropTypes.func,
  loading: PropTypes.bool,
};

// ─── Row Actions ─────────────────────────────────────────────────────────────

export function RowActions({ row, table }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [approving, setApproving] = useState(false);

  const rowId = row?.original?.id;
  const status = row?.original?.status;

  const handleApprove = useCallback(async () => {
    setApproving(true);
    try {
      await axios.post("/testing/approve-testing-dispatch", { id: rowId });
      toast.success("Dispatch approved successfully ✅", { duration: 2000 });
      table.options.meta?.refreshData?.();
      setConfirmOpen(false);
    } catch (error) {
      console.error("Approve failed:", error);
      const msg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Failed to approve dispatch";
      toast.error(msg, { duration: 2500 });
    } finally {
      setApproving(false);
    }
  }, [rowId, table]);

  const permissions = JSON.parse(localStorage.getItem("userPermissions") || "[]");
  const canApprove = status == 0 && permissions.includes(307);

  return (
    <>
      <div className="flex items-center justify-center gap-2 flex-wrap">
        {/* View Dispatch Form — navigates to separate page */}
        <Link
          to={`/dashboards/testing/dispatch-list/dispatchformtesting/${rowId}`}
          className="inline-flex h-8 items-center gap-1 rounded-lg bg-blue-50 px-3 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400"
        >

          View Dispatch Form
        </Link>

        {/* Approve — only for status == 0 (Pending) and with permission 307 */}
        {canApprove && (
          <button
            onClick={() => setConfirmOpen(true)}
            className="flex h-8 items-center rounded-lg bg-emerald-50 px-3 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400"
          >
            Approve
          </button>
        )}
      </div>

      <ApproveConfirmModal
        show={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleApprove}
        loading={approving}
      />
    </>
  );
}

RowActions.propTypes = {
  row: PropTypes.object,
  table: PropTypes.object,
};