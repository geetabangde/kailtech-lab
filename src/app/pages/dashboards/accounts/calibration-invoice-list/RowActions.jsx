// RowActions.jsx — Calibration Invoice List
// PHP exact port (approveinvoice.php + requestinvoicecancel.php):
//
// Always        → View Invoice
// status==0 + permission(269) + finaltotal<=5000 → Approve
// status==0 + permission(270) + finaltotal>5000  → Approve
// (status==0||1||2) + (empty invoiceno || date<=next5 || perm(314)):
//   permission(273) + (status==0||1) → Edit
//   OR permission(383) + status==0 + empty invoiceno → Edit
//   permission(271) → Request Cancel
//
// API: POST /accounts/approve-calibration-invoice
//   body:    { invoiceid: number }
//   success: { status: true, message: "Invoice Approved Successfully", invoice_no: "KTRC/..." }
//   failure: { status: false, message: "..." }

import clsx from "clsx";
import { useCallback, useState } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import axios from "utils/axios";
import { toast } from "sonner";

// ── Approve Modal ─────────────────────────────────────────────────────────
function ApproveModal({ show, onClose, onOk, loading }) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="dark:bg-dark-800 w-full max-w-sm rounded-lg bg-white shadow-xl">
        <div className="flex flex-col items-center px-6 pt-6 pb-4">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-7 w-7 text-green-600 dark:text-green-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h3 className="dark:text-dark-50 text-base font-semibold text-gray-800">
            Approve Invoice?
          </h3>
          <p className="dark:text-dark-400 mt-1.5 text-center text-sm text-gray-500">
            Are you sure you want to approve this invoice?
          </p>
        </div>
        <div className="dark:border-dark-500 flex justify-end gap-2 border-t border-gray-200 px-6 py-4">
          <button
            onClick={onClose}
            disabled={loading}
            className="dark:border-dark-500 dark:text-dark-300 rounded-md border border-gray-300 px-5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onOk}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-md bg-green-600 px-5 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <>
                <svg
                  className="h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z"
                  />
                </svg>
                Approving…
              </>
            ) : (
              "Approve"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Cancel Request Modal ──────────────────────────────────────────────────
function CancelRequestModal({ show, onClose, onOk, invoiceno, loading }) {
  const [reason, setReason] = useState("");
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="dark:bg-dark-800 w-full max-w-sm rounded-lg bg-white shadow-xl">
        <div className="dark:border-dark-500 flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h3 className="dark:text-dark-50 text-sm font-semibold text-gray-800">
            Invoice Cancel Request — {invoiceno || "Invoice"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
        <div className="p-5">
          <label className="dark:text-dark-300 mb-1 block text-sm font-medium text-gray-600">
            Reason For Cancellation <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="dark:bg-dark-900 dark:border-dark-500 dark:text-dark-100 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none"
            placeholder="Enter reason..."
          />
        </div>
        <div className="dark:border-dark-500 flex justify-end gap-2 border-t border-gray-200 px-5 py-4">
          <button
            onClick={onClose}
            className="dark:border-dark-500 dark:text-dark-300 rounded-md border border-gray-300 px-5 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onOk(reason);
              setReason("");
            }}
            disabled={loading || !reason.trim()}
            className="rounded-md bg-amber-500 px-5 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Submitting…" : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────
export function RowActions({ row, table }) {
  const rowData = row.original;
  const permissions = JSON.parse(localStorage.getItem("userPermissions") || "[]");

  const [approveOpen, setApproveOpen] = useState(false);
  const [approveLoading, setApproveLoading] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  const finaltotal = parseFloat(rowData.finaltotal || 0);
  const status = Number(rowData.status);
  const invoiceno = rowData.invoiceno || "";

  // PHP: next month's 5th — edit window
  const withinEditWindow = (() => {
    if (!invoiceno) return true;
    if (permissions.includes(314)) return true;
    if (rowData.invoicedate) {
      const d = new Date(rowData.invoicedate);
      const next5 = new Date(d.getFullYear(), d.getMonth() + 1, 5);
      if (new Date() <= next5) return true;
    }
    return false;
  })();

  // PHP: permission(269) <=5000 | permission(270) >5000
  const canApprove =
    (permissions.includes(269) && finaltotal <= 5000) ||
    (permissions.includes(270) && finaltotal > 5000);

  // PHP: permission(273)+(status==0||1) OR permission(383)+status==0+empty invoiceno
  const canEdit =
    (permissions.includes(273) && (status === 0 || status === 1)) ||
    (permissions.includes(383) && status === 0 && !invoiceno);

  // PHP: permission(271)
  const canRequestCancel = permissions.includes(271);

  // ── Approve ──────────────────────────────────────────────────────────────
  // POST /accounts/approve-calibration-invoice
  // body:    { invoiceid }
  // success: { status: true, message: "Invoice Approved Successfully", invoice_no: "KTRC/..." }
  const handleApprove = useCallback(async () => {
    setApproveLoading(true);
    try {
      const res = await axios.post("/accounts/approve-calibration-invoice", {
        invoiceid: rowData.id,
      });

      // API returns: { status: true/false, message: "...", invoice_no: "KTRC/..." }
      const ok =
        res.data.status === true ||
        res.data.status === "true" ||
        res.data.success === true;

      if (ok) {
        const invNo = res.data.invoice_no ?? res.data.invoiceno ?? "";
        toast.success(
          invNo
            ? `${res.data.message ?? "Invoice approved"} — ${invNo}`
            : (res.data.message ?? "Invoice approved successfully"),
        );
        // Optimistic update: status 0→1, update invoiceno if it was just generated
        table.options.meta?.updateRow(row.index, {
          status: 1,
          ...(invNo ? { invoiceno: invNo } : {}),
        });
        setApproveOpen(false);
      } else {
        toast.error(res.data.message ?? "Approval failed");
      }
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Failed to approve invoice");
    } finally {
      setApproveLoading(false);
    }
  }, [rowData.id, row.index, table]);

  // ── Request Cancel ────────────────────────────────────────────────────────
  const handleCancelRequest = useCallback(
    async (reason) => {
      setCancelLoading(true);
      try {
        const res = await axios.post("/accounts/cancel-request", {
          invoiceid: rowData.id,
          reason,
        });
        const ok =
          res.data.status === true ||
          res.data.status === "true" ||
          res.data.success === true;
        if (ok) {
          toast.success(
            res.data.message ?? "Cancellation request submitted ✅",
          );
          setCancelOpen(false);
        } else {
          toast.error(res.data.message ?? "Request failed");
        }
      } catch (err) {
        toast.error(
          err?.response?.data?.message ??
            "Failed to submit cancellation request",
        );
      } finally {
        setCancelLoading(false);
      }
    },
    [rowData.id],
  );

  return (
    <>
      <div className="flex flex-wrap gap-1.5">
        {/* Always visible */}
        <ActionBtn
          color="primary"
          to={`/dashboards/accounts/calibration-invoice-list/view/${rowData.id}`}
        >
          View Invoice
        </ActionBtn>

        {/* status==0 + canApprove */}
        {status === 0 && canApprove && (
          <ActionBtn color="success" onClick={() => setApproveOpen(true)}>
            Approve
          </ActionBtn>
        )}

        {/* (status==0||1||2) + withinEditWindow + canEdit */}
        {(status === 0 || status === 1 || status === 2) &&
          withinEditWindow &&
          canEdit && (
            <ActionBtn
              color="warning"
              to={
                !rowData.inwardid
                  ? `/dashboards/accounts/calibration-invoice-list/edit-advance/${rowData.id}`
                  : `/dashboards/accounts/calibration-invoice-list/edit/${rowData.id}`
              }
            >
              Edit
            </ActionBtn>
          )}

        {/* (status==0||1||2) + withinEditWindow + permission(271) */}
        {(status === 0 || status === 1 || status === 2) &&
          withinEditWindow &&
          canRequestCancel && (
            <ActionBtn color="warning" onClick={() => setCancelOpen(true)}>
              Request Cancel
            </ActionBtn>
          )}
      </div>

      <ApproveModal
        show={approveOpen}
        onClose={() => setApproveOpen(false)}
        onOk={handleApprove}
        loading={approveLoading}
      />

      <CancelRequestModal
        show={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onOk={handleCancelRequest}
        invoiceno={invoiceno}
        loading={cancelLoading}
      />
    </>
  );
}

function ActionBtn({ color = "primary", onClick, to, children }) {
  const colorMap = {
    success: "bg-green-500 hover:bg-green-600 text-white",
    primary: "bg-blue-500 hover:bg-blue-600 text-white",
    warning: "bg-amber-500 hover:bg-amber-600 text-white",
    danger: "bg-red-500 hover:bg-red-600 text-white",
  };
  const classes = clsx(
    "inline-flex items-center rounded px-2.5 py-1 text-xs font-medium transition-colors",
    colorMap[color],
  );

  if (to) {
    return (
      <Link to={to} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={classes}>
      {children}
    </button>
  );
}

RowActions.propTypes = {
  row: PropTypes.object,
  table: PropTypes.object,
};
