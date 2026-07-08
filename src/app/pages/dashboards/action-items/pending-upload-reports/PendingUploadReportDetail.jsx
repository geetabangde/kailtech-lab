// Import Dependencies
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "utils/axios";

// Local Imports
import { Page } from "components/shared/Page";
import { Card } from "components/ui";

// ----------------------------------------------------------------------

export default function UploadReport() {
  const navigate = useNavigate();
  const { id }   = useParams(); // route: /pending-upload-reports/:id

  const [info,      setInfo]      = useState(null);
  const [file,      setFile]      = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [uploading, setUploading] = useState(false);
  const [result,    setResult]    = useState(null); // { ok, message }

  // ── GET /api/actionitem/get-uploadreport-data?id=:id ─────────────────────
  useEffect(() => {
    const fetchInfo = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`/actionitem/get-uploadreport-data?id=${id}`);

        // Response: { status: "true", data: { trfproduct_id, trf_id, product,
        //             package, ulr, nabl, ulr_button_label,
        //             can_generate_ulr_button, can_upload_report } }
        const d = res.data?.data ?? {};

        setInfo({
          trfproductId:    d.trfproduct_id           ?? id,
          trfId:           d.trf_id                  ?? null,
          product:         d.product                 ?? "—",
          package:         d.package                 ?? "—",
          ulr:             d.ulr                     ?? "",
          nabl:            d.nabl                    ?? 0,
          ulrButtonLabel:  d.ulr_button_label        ?? "Generate ULR",
          canGenerateUlr:  d.can_generate_ulr_button ?? false,
          canUploadReport: d.can_upload_report       ?? false,
        });
      } catch {
        setInfo({
          trfproductId:    id,
          trfId:           null,
          product:         "—",
          package:         "—",
          ulr:             "",
          nabl:            0,
          ulrButtonLabel:  "Generate ULR",
          canGenerateUlr:  false,
          canUploadReport: false,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchInfo();
  }, [id]);

  // ── POST /api/actionitem/update-report ───────────────────────────────────
  // form-data keys: id (trfproduct_id), report (File)
  const handleUpload = async () => {
    if (!file) {
      setResult({ ok: false, message: "Please choose a file before uploading." });
      return;
    }
    try {
      setUploading(true);
      setResult(null);

      const formData = new FormData();
      formData.append("id",     info?.trfproductId ?? id);
      formData.append("report", file);

      const res = await axios.post("/actionitem/update-report", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Response: { status: "true", message: "Report Updated Successfully" }
      const ok  = res.data?.status === "true" || res.data?.status === true;
      const msg = res.data?.message ?? (ok ? "Report uploaded successfully." : "Upload failed.");

      setResult({ ok, message: msg });
      if (ok) {
        setFile(null);
        // Redirect back to list after short delay so user sees success message
        setTimeout(() => {
          navigate("/dashboards/action-items/pending-upload-reports");
        }, 1500);
      }
    } catch (err) {
      setResult({
        ok:      false,
        message: err?.response?.data?.message ?? "Upload failed. Please try again.",
      });
    } finally {
      setUploading(false);
    }
  };

  // ── Back to list ──────────────────────────────────────────────────────────
  const handleBack = () => {
    navigate("/dashboards/action-items/pending-upload-reports");
  };

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Page title="Upload Report">
        <div className="flex h-[60vh] items-center justify-center gap-3 text-gray-500">
          <svg className="h-5 w-5 animate-spin text-blue-600" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z" />
          </svg>
          Loading…
        </div>
      </Page>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Page title="Upload Report">
      <div className="transition-content px-[var(--margin-x)] pb-5">
        <Card className="overflow-hidden">

          {/* ── Header ──────────────────────────────────────────────────── */}
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-dark-500">
            <h3 className="text-base font-semibold text-gray-800 dark:text-dark-100">
              Upload Report
            </h3>
            <button
              onClick={handleBack}
              className="rounded-lg bg-cyan-500 px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-300"
            >
              &lt;&lt; Back to Trf Items
            </button>
          </div>

          {/* ── Info Grid: Product | Package | ULR ──────────────────────── */}
          <div className="px-5 pt-5">
            <div className="grid grid-cols-3 gap-x-6 border-b border-gray-200 pb-5 dark:border-dark-500">
              {/* Labels row */}
              <div className="text-sm font-medium text-gray-500 dark:text-dark-300">Product</div>
              <div className="text-sm font-medium text-gray-500 dark:text-dark-300">Package</div>
              <div className="text-sm font-medium text-gray-500 dark:text-dark-300">ULR</div>

              {/* Values row */}
              <div className="mt-1 text-sm text-gray-800 dark:text-dark-100">
                {info?.product}
              </div>
              <div className="mt-1 text-sm text-gray-800 dark:text-dark-100">
                {info?.package}
              </div>

              {/* ULR cell: value + optional Generate ULR button */}
              <div className="mt-1 flex flex-wrap items-center gap-2">
                {info?.ulr ? (
                  <span className="font-mono text-sm text-gray-800 dark:text-dark-100">
                    {info.ulr}
                  </span>
                ) : (
                  <span className="text-sm text-gray-400 dark:text-dark-400">—</span>
                )}
                {info?.canGenerateUlr && (
                  <button
                    className="rounded-md bg-blue-600 px-3 py-1 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    onClick={() => {
                      // TODO: wire generate-ulr API
                    }}
                  >
                    {info.ulrButtonLabel}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ── File Input (only when can_upload_report = true) ──────────── */}
          <div className="px-5 pt-5">
            {info?.canUploadReport ? (
              <div className="flex w-full items-center gap-3 rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-dark-500 dark:bg-dark-800">
                <label
                  htmlFor="report-file"
                  className="cursor-pointer whitespace-nowrap rounded border border-gray-400 bg-gray-100 px-3 py-1 text-sm text-gray-700 transition hover:bg-gray-200 dark:border-dark-400 dark:bg-dark-700 dark:text-dark-200"
                >
                  Choose File
                </label>
                <span className="text-sm text-gray-500 dark:text-dark-400">
                  {file ? file.name : "No file chosen"}
                </span>
                <input
                  id="report-file"
                  type="file"
                  className="sr-only"
                  onChange={(e) => {
                    setFile(e.target.files?.[0] ?? null);
                    setResult(null);
                  }}
                />
              </div>
            ) : (
              <p className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-700 dark:border-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                ⚠ You do not have permission to upload the report.
              </p>
            )}
          </div>

          {/* ── Result Message ───────────────────────────────────────────── */}
          {result && (
            <div className="px-5 pt-3">
              <p
                className={`rounded-lg px-4 py-2 text-sm font-medium ${
                  result.ok
                    ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                    : "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"
                }`}
              >
                {result.ok ? "✓ " : "⚠ "}
                {result.message}
              </p>
            </div>
          )}

          {/* ── Footer / Upload Button ───────────────────────────────────── */}
          {info?.canUploadReport && (
            <div className="mt-5 flex justify-end border-t border-gray-200 px-5 py-4 dark:border-dark-500">
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="rounded-lg bg-green-600 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {uploading ? (
                  <span className="flex items-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z" />
                    </svg>
                    Uploading…
                  </span>
                ) : (
                  "Upload Report"
                )}
              </button>
            </div>
          )}

        </Card>
      </div>
    </Page>
  );
}