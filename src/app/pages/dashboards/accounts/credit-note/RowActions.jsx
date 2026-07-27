// Import Dependencies
import PropTypes from "prop-types";
import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import axios from "utils/axios";

// ── Approve Modal ─────────────────────────────────────────────────────────
function ApproveModal({ show, onClose, onOk, loading }) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="dark:bg-dark-800 w-full max-w-sm rounded-lg bg-white shadow-xl">
        <div className="flex flex-col items-center px-6 pt-6 pb-4">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <svg className="h-7 w-7 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="dark:text-dark-50 text-base font-semibold text-gray-800">
            Approve Credit Note?
          </h3>
          <p className="dark:text-dark-400 mt-1.5 text-center text-sm text-gray-500">
            Are you sure you want to approve this credit note?
          </p>
        </div>
        <div className="dark:border-dark-500 flex justify-end gap-2 border-t border-gray-200 px-6 py-4">
          <button onClick={onClose} disabled={loading} className="dark:border-dark-500 dark:text-dark-300 rounded-md border border-gray-300 px-5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50">
            Cancel
          </button>
          <button onClick={onOk} disabled={loading} className="inline-flex items-center gap-2 rounded-md bg-green-600 px-5 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50">
            {loading ? "Approving..." : "Approve"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Cancel Modal ──────────────────────────────────────────────────────────
function CancelModal({ show, onClose, onOk, loading }) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="dark:bg-dark-800 w-full max-w-sm rounded-lg bg-white shadow-xl">
        <div className="flex flex-col items-center px-6 pt-6 pb-4">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
            <svg className="h-7 w-7 text-orange-600 dark:text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="dark:text-dark-50 text-base font-semibold text-gray-800">
            Cancel Credit Note?
          </h3>
          <p className="dark:text-dark-400 mt-1.5 text-center text-sm text-gray-500">
            Are you sure you want to cancel this credit note?
          </p>
        </div>
        <div className="dark:border-dark-500 flex justify-end gap-2 border-t border-gray-200 px-6 py-4">
          <button onClick={onClose} disabled={loading} className="dark:border-dark-500 dark:text-dark-300 rounded-md border border-gray-300 px-5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50">
            Go Back
          </button>
          <button onClick={onOk} disabled={loading} className="inline-flex items-center gap-2 rounded-md bg-orange-500 px-5 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50">
            {loading ? "Canceling..." : "Yes, Cancel"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------

export function RowActions({ row, table }) {
  const [approveOpen, setApproveOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const executeApprove = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`/accounts/approve-credit-note/${row.original.id}`);
      // The backend returns {'message': '...', 'creditnoteno': '...'} without a status key
      if (res.status === 200 && (!res.data.status || res.data.status === true || res.data.status === "true" || res.data.success === true || res.data.creditnoteno)) {
        toast.success(res.data.message || "Credit Note Approved!");
        setApproveOpen(false);
        table?.options?.meta?.updateData?.(row.index, "status", 1);
      } else {
        toast.error(res.data.message || "Failed to approve credit note.");
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to approve.");
    } finally {
      setLoading(false);
    }
  };

  const executeCancel = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`/accounts/cancel-credit-note/${row.original.id}`);
      // The backend returns {"status":"true", "message": "..."}
      if (res.status === 200 && (res.data.status === true || res.data.status === "true" || res.data.success === true || res.data.message === "Credit note deleted successfully.")) {
        toast.success(res.data.message || "Credit Note Canceled!");
        setCancelOpen(false);
        // Assuming cancelling changes status to 3 or you just wait for a manual refetch
        table?.options?.meta?.updateData?.(row.index, "status", 3);
      } else {
        toast.error(res.data.message || "Failed to cancel credit note.");
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to cancel credit note.");
    } finally {
      setLoading(false);
    }
  };

  const status = row.original.status;

  return (
    <>
      <div className="flex flex-col gap-1.5 items-center justify-center">
        <Link
          to={`/dashboards/accounts/credit-note/view/${row.original.id}`}
          className="inline-flex w-full items-center justify-center rounded border border-green-600/20 px-3 py-1.5 text-xs font-semibold bg-green-50 text-green-700 transition-colors hover:bg-green-100 dark:bg-green-900/10 dark:text-green-400 dark:border-green-800/30"
        >
          View Credit Note
        </Link>

        {status == 0 && (
          <button
            onClick={() => setApproveOpen(true)}
            className="w-full rounded border border-green-600/20 px-3 py-1.5 text-xs font-semibold bg-green-50 text-green-700 transition-colors hover:bg-green-100 dark:bg-green-900/10 dark:text-green-400 dark:border-green-800/30"
          >
            Approve
          </button>
        )}

        {status == 2 && (
          <Link
            to={`/dashboards/accounts/credit-note/link-invoices/${row.original.id}`}
            className="inline-flex w-full items-center justify-center rounded border border-green-600/20 px-3 py-1.5 text-xs font-semibold bg-green-50 text-green-700 transition-colors hover:bg-green-100 dark:bg-green-900/10 dark:text-green-400 dark:border-green-800/30"
          >
            Link Invoice
          </Link>
        )}

        {(status == 0 || status == 1 || status == 2) && (
          <button
            onClick={() => setCancelOpen(true)}
            className="w-full rounded border border-orange-600/20 px-3 py-1.5 text-xs font-semibold bg-orange-50 text-orange-700 transition-colors hover:bg-orange-100 dark:bg-orange-900/10 dark:text-orange-400 dark:border-orange-800/30"
          >
            Cancel Credit Note
          </button>
        )}
      </div>

      <ApproveModal
        show={approveOpen}
        onClose={() => setApproveOpen(false)}
        onOk={executeApprove}
        loading={loading}
      />

      <CancelModal
        show={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onOk={executeCancel}
        loading={loading}
      />
    </>
  );
}

RowActions.propTypes = {
  row: PropTypes.object,
  table: PropTypes.object,
};
