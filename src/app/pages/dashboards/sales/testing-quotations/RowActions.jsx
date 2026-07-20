// Import Dependencies
import { useState } from "react";
import PropTypes from "prop-types";
import { Link, useNavigate } from "react-router-dom";
import axios from "utils/axios";
import { toast } from "sonner";

// Local Imports
import AddQuoteFollowUpModal from "./AddQuoteFollowUpModal";
import MarkConvertedModal from "./MarkConvertedModal";

// ----------------------------------------------------------------------

export function RowActions({ row, table }) {
  const { id, status } = row.original;
  const navigate = useNavigate();
  const permissions = JSON.parse(localStorage.getItem("userPermissions") || "[]");

  // Permission mapping based on existing patterns
  const hasAddPerm = permissions.includes(94);
  const hasRevisePerm = permissions.includes(96);

  const [followupOpen, setFollowupOpen] = useState(false);
  const [followupMode, setFollowupMode] = useState("Add");
  const [convertOpen, setConvertOpen] = useState(false);
  const [revising, setRevising] = useState(false);

  const handleRevise = async () => {
    if (!id) {
      toast.error("Quotation ID is missing");
      return;
    }
    try {
      setRevising(true);
      const filteredRevisions = Array.isArray(row.original.revisions)
        ? row.original.revisions.filter(r => r.status === 11)
        : [];

      const latestReviseId = filteredRevisions.length > 0
        ? Math.max(...filteredRevisions.map(r => r.id))
        : id;

      const res = await axios.post(`/sales/revise-testing-quotation/${latestReviseId}`);

      if (res.data.new_quote_id || res.data.status === "true" || res.data.status === true) {
        toast.success(res.data.message || "Quotation revised successfully");
        const newQuoteId = res.data.new_quote_id || res.data.id; // Fallback to id if new_quote_id is missing
        if (newQuoteId) {
          navigate(`/dashboards/sales/testing-quotations/edit/${newQuoteId}?revise=true`);
        } else {
          table.options.meta?.refetch?.();
        }
      } else {
        toast.error(res.data.message || "Failed to revise quotation");
      }
    } catch (err) {
      console.error("Revision Error:", err);
      const errorMsg = err.response?.data?.message || err.message || "Something went wrong";
      toast.error(errorMsg);
    } finally {
      setRevising(false);
    }
  };

  const handleDelete = async () => {
    if (!id) {
      toast.error("Quotation ID is missing");
      return;
    }

    const confirmDelete = window.confirm("Are you sure you want to delete this quotation?");
    if (!confirmDelete) return;

    try {
      const res = await axios.delete(`/sales/delete-testing-quotation/${id}`);

      if (res.data?.status === "true" || res.data?.status === true) {
        toast.success(res.data.message || "Quotation deleted successfully");
        table.options.meta?.refetch?.();
      } else {
        toast.error(res.data?.message || "Failed to delete quotation");
      }
    } catch (err) {
      console.error("Delete Error:", err);
      const errorMsg = err.response?.data?.message || err.message || "Something went wrong";
      toast.error(errorMsg);
    }
  };


  const statusNum = Number(status);

  return (
    <>
      <div className="flex flex-wrap gap-1">
        {/* Status 0: Item Not Added */}
        {statusNum === 0 && hasAddPerm && (
          <>
            <Link
              to={`/dashboards/sales/testing-quotations/edit/${id}`}
              className="rounded bg-blue-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-blue-700"
            >
              Edit
            </Link>
            <Link
              to={`/dashboards/sales/testing-quotations/items/${id}`}
              className="rounded bg-blue-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-blue-700"
            >
              Edit Item
            </Link>
          </>
        )}

        {/* Status 1: Pending */}
        {statusNum === 1 && (
          <>
            {hasAddPerm && (
              <>
                <Link
                  to={`/dashboards/sales/testing-quotations/edit/${id}`}
                  className="rounded bg-blue-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-blue-700"
                >
                  Edit
                </Link>
                <Link
                  to={`/dashboards/sales/testing-quotations/items/${id}`}
                  className="rounded bg-blue-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-blue-700"
                >
                  Edit Item
                </Link>
                <button
                  onClick={() => setConvertOpen(true)}
                  className="rounded bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700"
                >
                  Mark Quote as converted
                </button>
              </>
            )}
            {hasRevisePerm && row.original.quotationno && (
              <button
                onClick={handleRevise}
                disabled={revising}
                className="rounded bg-cyan-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-cyan-700 disabled:bg-cyan-400"
              >
                {revising ? "Revising..." : "Revise"}
              </button>
            )}

            <Link
              to={`/dashboards/sales/testing-quotations/view/${id}`}
              className="rounded bg-green-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-green-700"
            >
              View
            </Link>
            <Link
              to={`/dashboards/sales/testing-quotations/view-parameter/${id}`}
              className="rounded bg-green-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-green-700"
            >
              View with parameter
            </Link>
            {/* Revision History Buttons - PHP Logic: Show Revise 1, Revise 2, etc. */}
            {row.original.quotationno && row.original.revisions && Array.isArray(row.original.revisions) && row.original.revisions.length > 0 && (
              <>
                {row.original.revisions.map((revisionId, index) => (
                  <Link
                    key={revisionId}
                    to={`/dashboards/sales/testing-quotations/view/${revisionId}`}
                    className="rounded bg-purple-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-purple-700"
                  >
                    Revise {index + 1}
                  </Link>
                ))}
              </>
            )}

            {hasAddPerm && (
              <>
                <button
                  onClick={() => {
                    setFollowupMode("Add");
                    setFollowupOpen(true);
                  }}
                  className="rounded bg-blue-500 px-2.5 py-1 text-xs font-medium text-white hover:bg-blue-600"
                >
                  Add Follow-Up
                </button>
                <Link
                  to={`/dashboards/sales/testing-quotations/followup/${id}`}
                  className="rounded bg-blue-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-blue-700"
                >
                  Track Followup
                </Link>
                <button
                  onClick={() => {
                    setFollowupMode("Close");
                    setFollowupOpen(true);
                  }}
                  className="rounded bg-red-700 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-800"
                >
                  Lost Quotation
                </button>
                <button
                  onClick={handleDelete}
                  className="rounded bg-red-800 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-900"
                >
                  Delete
                </button>
              </>
            )}
          </>
        )}

        {/* Status 91: Lost */}
        {statusNum === 91 && (
          <>
            <Link
              to={`/dashboards/sales/testing-quotations/view/${id}`}
              className="rounded bg-green-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-green-700"
            >
              View
            </Link>
            <Link
              to={`/dashboards/sales/testing-quotations/view-parameter/${id}`}
              className="rounded bg-green-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-green-700"
            >
              View with parameter
            </Link>
            <button
              disabled
              className="cursor-not-allowed rounded bg-red-600 opacity-50 px-2.5 py-1 text-xs font-medium text-white"
            >
              Lost Quotation
            </button>
            <Link
              to={`/dashboards/sales/testing-quotations/followup/${id}`}
              className="rounded bg-blue-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-blue-700"
            >
              Track Followup
            </Link>
          </>
        )}

        {/* Status 3: Marked As Converted */}
        {statusNum === 3 && (
          <>
            <Link
              to={`/dashboards/sales/testing-quotations/view/${id}`}
              className="rounded bg-green-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-green-700"
            >
              View
            </Link>
            <Link
              to={`/dashboards/sales/testing-quotations/link-trf/${id}`}
              className="rounded bg-green-700 px-2.5 py-1 text-xs font-medium text-white hover:bg-green-800"
            >
              Link To TRF
            </Link>
            <Link
              to={`/dashboards/sales/testing-quotations/followup/${id}`}
              className="rounded bg-blue-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-blue-700"
            >
              Track Followup
            </Link>
          </>
        )}

        {/* Status 2: TRF Punched */}
        {statusNum === 2 && (
          <>
            <Link
              to={`/dashboards/sales/testing-quotations/view/${id}`}
              className="rounded bg-green-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-green-700"
            >
              View
            </Link>
            <Link
              to={`/dashboards/sales/testing-quotations/view-parameter/${id}`}
              className="rounded bg-green-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-green-700"
            >
              View with parameter
            </Link>
            <span className="rounded bg-success-600 px-2.5 py-1 text-xs font-medium text-white">
              TRF Punched
            </span>
          </>
        )}
      </div>

      <AddQuoteFollowUpModal
        show={followupOpen}
        id={id}
        mode={followupMode}
        title="Follow-Ups"
        onClose={() => setFollowupOpen(false)}
        onSuccess={() => table.options.meta?.refetch?.()}
      />

      <MarkConvertedModal
        show={convertOpen}
        id={id}
        onClose={() => setConvertOpen(false)}
        onSuccess={() => table.options.meta?.refetch?.()}
      />
    </>
  );
}

RowActions.propTypes = {
  row: PropTypes.object.isRequired,
  table: PropTypes.object,
};
