// Import Dependencies
import { useState } from "react";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import axios from "utils/axios";

// ----------------------------------------------------------------------

function usePermissions() {
  return localStorage.getItem("userPermissions")?.split(",").map(Number) || [];
}

export function RowActions({ row, table }) {
  const permissions = usePermissions();

  const {
    id,
    trf,
    hid,
    pack_type,
    package: packageType,
    report,
    tid,
    view_report,       // "https://…/testreports/testreport{id}.pdf"
    view_report_with,  // "https://…/testreports/testreportlh{id}.pdf"
    report_link,
  } = row.original;

  const actualPackType = pack_type ?? packageType;
  const actualTid = tid ?? id;
  const actualHid = hid ?? "";

  const finalReportUrl = `/dashboards/action-items/final-reports-unsigned/view?tid=${actualTid}&hid=${actualHid}`;
  const uploadReportUrl = `/dashboards/action-items/pending-upload-reports/${id}`;

  const [regenerating, setRegenerating] = useState(false);
  const [regenResult, setRegenResult] = useState(null);

  // ── Regenerate Cache Copy ──────────────────────────────────────────────
  // GET /actionitem/Regeneratetest-Cache-Copy/:tid/:trf
  const handleRegenerate = async () => {
    try {
      setRegenerating(true);
      setRegenResult(null);
      const res = await axios.post(`/actionitem/Regeneratetest-Cache-Copy/${id}/${trf ?? ""}`);
      const ok = res.data?.status === "true" || res.data?.status === true;
      // Update view_report links in table row if returned
      if (ok && res.data?.pdf) {
        table?.options?.meta?.updateData?.(row.index, "view_report", res.data.pdf);
        table?.options?.meta?.updateData?.(row.index, "view_report_with", res.data.lpdf);
      }
      setRegenResult({ ok, message: ok ? "Cache regenerated successfully." : "Regeneration failed." });
      setTimeout(() => setRegenResult(null), 2500);
    } catch {
      setRegenResult({ ok: false, message: "Regeneration failed." });
      setTimeout(() => setRegenResult(null), 2500);
    } finally {
      setRegenerating(false);
    }
  };

  // ── View Report links (only if PDF exists) ─────────────────────────────
  const hasViewReport = Boolean(view_report);

  return (
    <div className="flex flex-col gap-1.5 min-w-[150px]">
      {/* ── Final Report / Upload Report ────────────────────────────── */}
      {(actualPackType === 0 || actualPackType === "0") ? (
        (!report || report === 0 || report === "0") ? (
          <Link
            to={uploadReportUrl}
            className="rounded-md bg-primary-600 px-3 py-1.5 text-center text-xs font-semibold text-white shadow-sm transition hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-400"
          >
            Upload Report
          </Link>
        ) : (
          <a
            href={report_link || view_report || "#"}
            target="_blank"
            rel="noreferrer"
            className="rounded-md bg-green-600 px-3 py-1.5 text-center text-xs font-semibold text-white shadow-sm transition hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400"
          >
            Final Report
          </a>
        )
      ) : (
        <Link
          to={finalReportUrl}
          className="rounded-md bg-green-600 px-3 py-1.5 text-center text-xs font-semibold text-white shadow-sm transition hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400"
        >
          Final Report
        </Link>
      )}

      {/* ── Upload Amended Report — perm 267 ──────────────────────── */}
      {permissions.includes(267) && (
        <Link
          to={`/dashboards/action-items/signed-reports/amend/${id}`}
          className="rounded-md bg-primary-600 px-3 py-1.5 text-center text-xs font-semibold text-white shadow-sm transition hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-400"
        >
          Upload Amended Report
        </Link>
      )}

      {/* ── Regenerate Cache Copy — always shown ──────────────────── */}
      <button
        onClick={handleRegenerate}
        disabled={regenerating}
        type="button"
        className="rounded-md bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:cursor-not-allowed disabled:opacity-60 text-center"
      >
        {regenerating ? "Regenerating…" : "Regenerate Cache Copy"}
      </button>

      {/* ── View Report + View Report With Letterhead ─────────────── */}
      {hasViewReport && (
        <>
          <a
            href={view_report}
            target="_blank"
            rel="noreferrer"
            className="rounded-md bg-cyan-500 px-3 py-1.5 text-center text-xs font-semibold text-white shadow-sm transition hover:bg-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-400"
          >
            View Report
          </a>
          {view_report_with && (
            <a
              href={view_report_with}
              target="_blank"
              rel="noreferrer"
              className="rounded-md bg-cyan-500 px-3 py-1.5 text-center text-xs font-semibold text-white shadow-sm transition hover:bg-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            >
              View Report With Letterhead
            </a>
          )}
        </>
      )}

      {/* ── Request Revision — perm 411 ───────────────────────────── */}
      {permissions.includes(411) && (
        <Link
          to={`/dashboards/action-items/signed-reports/request-revision?tid=${id}&trf=${trf ?? ""}`}
          className="rounded-md bg-amber-500 px-3 py-1.5 text-center text-xs font-semibold text-white shadow-sm transition hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-400"
        >
          Request Revision
        </Link>
      )}

      {/* Regen result toast */}
      {regenResult && (
        <p
          className={`mt-1 rounded px-2 py-1 text-xs font-medium text-center ${regenResult.ok
            ? "bg-green-50 text-green-700"
            : "bg-red-50 text-red-600"
            }`}
        >
          {regenResult.ok ? "✓ " : "⚠ "}{regenResult.message}
        </p>
      )}
    </div>
  );
}

RowActions.propTypes = {
  row: PropTypes.object.isRequired,
  table: PropTypes.object,
};