// Import Dependencies
import { useState } from "react";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import axios from "utils/axios";
import Select from "react-select";

// ----------------------------------------------------------------------

export function RowActions({ row, table }) {
  // API response fields from backend
  const { id, hid, pack_type, report, tid } = row.original;

  const [modalOpen,    setModalOpen]    = useState(false);
  const [sigData,      setSigData]      = useState(null); // full API response
  const [sigLoading,   setSigLoading]   = useState(false);
  const [newSignatories, setNewSignatories] = useState([]); // selected admin ids array
  const [saving,       setSaving]       = useState(false);
  const [saveResult,   setSaveResult]   = useState(null);

  // ── Open modal + fetch signatories ────────────────────────────────────
  const openSignatoryModal = async () => {
    setSaveResult(null);
    setNewSignatories([]);
    setSigData(null);
    setModalOpen(true);
    try {
      setSigLoading(true);
      const res = await axios.get(`/actionitem/get-signatories?id=${id}`);
      setSigData(res.data ?? null);
    } catch {
      setSigData(null);
    } finally {
      setSigLoading(false);
    }
  };

  // ── Save signatories ──────────────────────────────────────────────────
  const handleSave = async () => {
    try {
      setSaving(true);
      setSaveResult(null);
      const res = await axios.post("/actionitem/update-signatories", {
        id,
        signatories: newSignatories.map(Number),
      });
      const ok  = res.data?.status === "true" || res.data?.status === true;
      const msg = res.data?.message ?? (ok ? "Signatories updated successfully." : "Update failed.");
      setSaveResult({ ok, message: msg });
      if (ok) {
        setTimeout(() => {
          setModalOpen(false);
          table?.options?.meta?.refreshData?.();
        }, 1200);
      }
    } catch (err) {
      setSaveResult({
        ok:      false,
        message: err?.response?.data?.message ?? "Failed to update signatories.",
      });
    } finally {
      setSaving(false);
    }
  };

  // ── Logic: which buttons to show ─────────────────────────────────
  const finalReportUrl = `/dashboards/action-items/final-reports-unsigned/view?tid=${tid ?? id}&hid=${hid ?? ""}`;
  const uploadReportUrl = `/dashboards/action-items/pending-upload-reports/${id}`;

  const renderButtons = () => {
    if (pack_type === 0 || pack_type === "0") {
      if (!report || report === 0 || report === "0") {
        return (
          <Link
            to={uploadReportUrl}
            className="inline-block rounded-md bg-primary-600 px-2 py-1 text-[10.5px] whitespace-nowrap font-semibold text-white shadow-sm transition hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-400 text-center"
          >
            Upload Report
          </Link>
        );
      }
      return (
        <Link
          to={finalReportUrl}
          className="inline-block rounded-md bg-green-600 px-2 py-1 text-[10.5px] whitespace-nowrap font-semibold text-white shadow-sm transition hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400 text-center"
        >
          Final Report
        </Link>
      );
    }

    return (
      <div className="flex flex-col gap-1">
        <Link
          to={finalReportUrl}
          className="inline-block rounded-md bg-green-600 px-2 py-1 text-[10.5px] whitespace-nowrap font-semibold text-white shadow-sm transition hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400 text-center"
        >
          Final Report
        </Link>
        <button
          onClick={openSignatoryModal}
          className="rounded-md bg-primary-600 px-2 py-1 text-[10.5px] whitespace-nowrap font-semibold text-white shadow-sm transition hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-400"
        >
          Change Signatories
        </button>
      </div>
    );
  };

  return (
    <>
      {renderButtons()}

      {/* ── Change Signatories Modal ──────────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setModalOpen(false)}
          />

          <div className="relative z-10 w-full max-w-lg rounded-xl bg-white shadow-2xl dark:bg-dark-700">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-dark-500">
              <h3 className="text-base font-semibold text-gray-800 dark:text-dark-100">
                Choose Signatories
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-full p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-dark-600"
              >
                ✕
              </button>
            </div>

            <div className="px-6 py-5">
              {sigLoading ? (
                <div className="flex items-center justify-center gap-2 py-8 text-gray-500">
                  <svg className="h-4 w-4 animate-spin text-blue-600" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z" />
                  </svg>
                  Loading…
                </div>
              ) : (
                <>
                  <div className="mb-5">
                    <p className="mb-3 text-sm font-semibold text-blue-600 dark:text-blue-400">
                      Existing Signatories:
                    </p>
                    {sigData?.existing_signatories?.length > 0 ? (
                      <div className="space-y-2">
                        {sigData.existing_signatories.map((name, idx) => (
                          <div key={idx} className="flex items-center gap-3">
                            <span className="w-40 shrink-0 text-xs font-medium text-gray-500 dark:text-dark-400">
                              {idx === sigData.existing_signatories.length - 1
                                ? "Review & Authorised By"
                                : `Signatory ${idx + 1}`}
                            </span>
                            <span className="flex-1 rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-800 dark:border-dark-500 dark:bg-dark-800 dark:text-dark-100">
                              {name}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400">No existing signatories.</p>
                    )}
                  </div>

                  <div>
                    <p className="mb-3 text-sm font-semibold text-green-600 dark:text-green-400">
                      New Signatories:
                    </p>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-gray-500 dark:text-dark-400">
                        Select Review &amp; Authorised By Signatories
                      </label>
                      <Select
                        isMulti
                        isSearchable
                        placeholder="Select Person"
                        options={(sigData?.active_admins ?? []).map((admin) => ({
                          value: admin.id,
                          label: admin.full_name,
                        }))}
                        value={(sigData?.active_admins ?? [])
                          .filter((a) => newSignatories.includes(String(a.id)))
                          .map((a) => ({ value: a.id, label: a.full_name }))}
                        onChange={(selected) =>
                          setNewSignatories((selected ?? []).map((s) => String(s.value)))
                        }
                        styles={{
                          control: (base, state) => ({
                            ...base,
                            borderColor: state.isFocused ? "#3b82f6" : "#d1d5db",
                            boxShadow: state.isFocused ? "0 0 0 2px rgba(59,130,246,0.2)" : "none",
                            borderRadius: "0.5rem",
                            fontSize: "0.875rem",
                            minHeight: "40px",
                            "&:hover": { borderColor: "#3b82f6" },
                          }),
                          option: (base, state) => ({
                            ...base,
                            backgroundColor: state.isSelected ? "#2563eb" : state.isFocused ? "#eff6ff" : "#fff",
                            color: state.isSelected ? "#fff" : "#374151",
                            fontSize: "0.875rem",
                            padding: "8px 12px",
                            cursor: "pointer",
                          }),
                        }}
                      />
                    </div>
                  </div>
                  {saveResult && (
                    <p className={`mt-3 rounded-lg px-4 py-2 text-sm font-medium ${saveResult.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                      {saveResult.ok ? "✓ " : "⚠ "}{saveResult.message}
                    </p>
                  )}
                </>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-gray-200 px-6 py-4 dark:border-dark-500">
              <button
                onClick={handleSave}
                disabled={saving || sigLoading || newSignatories.length === 0}
                className="rounded-lg bg-primary-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700 disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save changes"}
              </button>
              <button onClick={() => setModalOpen(false)} className="rounded-lg border border-gray-300 px-5 py-2 text-sm text-gray-600 hover:bg-gray-50">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

RowActions.propTypes = {
  row: PropTypes.object.isRequired,
  table: PropTypes.object,
};