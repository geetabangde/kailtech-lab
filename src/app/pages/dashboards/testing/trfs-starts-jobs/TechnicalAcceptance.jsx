import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "utils/axios";
import { toast } from "sonner";

// ── Field config — PHP form ke exact fields ───────────────────────────────────
const REVIEW_FIELDS = [
  {
    key: "quantity",
    remarkKey: "quantityremark",
    label: "Quantity of Sample Received",
    options: [{ value: 1, label: "Sufficient" }, { value: 0, label: "Not Sufficient" }],
  },
  {
    key: "specification",
    remarkKey: "specificationremark",
    label: "Specifications",
    options: [{ value: 1, label: "Clear" }, { value: 0, label: "Not Clear" }],
  },
  {
    key: "method",
    remarkKey: "methodremark",
    label: "Methods of Testing",
    options: [{ value: 1, label: "Clear" }, { value: 0, label: "Not Clear" }],
  },
  {
    key: "declaration",
    remarkKey: "declarationremark",
    label: "Declaration if Required",
    options: [{ value: 1, label: "Clear" }, { value: 0, label: "Not Clear" }],
  },
  {
    key: "conformity",
    remarkKey: "conformityremark",
    label: "Statement of Conformity",
    options: [{ value: 1, label: "Yes" }, { value: 0, label: "No" }],
  },
];

const INITIAL_FORM = {
  quantity: 1,
  quantityremark: "",
  specification: 1,
  specificationremark: "",
  method: 1,
  methodremark: "",
  declaration: 1,
  declarationremark: "",
  conformity: 1,
  conformityremark: "",
  accepted: 1,
  acceptedremark: "",
};

// ── Shared class strings ──────────────────────────────────────────────────────
const selectCls =
  "w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 " +
  "px-3 py-2 text-sm text-gray-800 dark:text-white outline-none " +
  "focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 transition cursor-pointer";

const textareaCls =
  "w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 " +
  "px-3 py-2 text-sm text-gray-700 dark:text-gray-300 outline-none resize-none " +
  "focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 transition placeholder-gray-400";

// ─────────────────────────────────────────────────────────────────────────────

export default function TechnicalAcceptance() {
  // Route param — jo bhi naam ho handle ho jayega
  // /dashboards/testing/technical/:itemId
  const params = useParams();
  const itemId = params.itemId ?? params.id ?? params.tid ?? params.trfItemId;
  const navigate = useNavigate();

  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSelect = (key, val) =>
    setForm((prev) => ({ ...prev, [key]: Number(val) }));

  const handleText = (key, val) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  // ── Submit — POST /testing/submit-trf-technicalacceptance ─────────────────
  // PHP: inserttechnical.php accepts all form fields + trfitem
  // After success → pendingtechnicalaceeptance.php (React: pending-technical-acceptance)
  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const trfItemInt = parseInt(itemId, 10);
      if (!trfItemInt) {
        toast.error("Invalid TRF Item ID ❌");
        return;
      }
      await axios.post("testing/submit-trf-technicalacceptance", {
        quantity: Number(form.quantity),
        quantityremark: form.quantityremark,
        specification: Number(form.specification),
        specificationremark: form.specificationremark,
        method: Number(form.method),
        methodremark: form.methodremark,
        declaration: Number(form.declaration),
        declarationremark: form.declarationremark,
        conformity: Number(form.conformity),
        conformityremark: form.conformityremark,
        accepted: Number(form.accepted),
        acceptedremark: form.acceptedremark,
        trfitem: trfItemInt,
      });
      toast.success("Technical Acceptance submitted successfully ✅");
      navigate("/dashboards/action-items/pending-technical-acceptance");
    } catch (err) {
      const msg = err?.response?.data?.message ?? "Failed to submit. Please try again.";
      setError(msg);
      toast.error(msg + " ❌");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="transition-content w-full pb-8">

      {/* ── Header ── */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-800 dark:text-white">
            Technical Acceptance
          </h2>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            TRF Item ID: <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">{itemId}</span>
          </p>
        </div>
        <button
          onClick={() => navigate("/dashboards/testing/trfs-starts-jobs/pending-technical-acceptance")}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-blue-700"
        >
          ← Back
        </button>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-400">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">

        {/* ── Review Fields Table ── */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 w-[35%]">
                  Parameter
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 w-[25%]">
                  Status
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Remark
                </th>
              </tr>
            </thead>
            <tbody>
              {REVIEW_FIELDS.map((field, idx) => (
                <tr
                  key={field.key}
                  className={`border-b border-gray-100 dark:border-gray-800 ${idx % 2 === 0
                    ? "bg-white dark:bg-gray-900"
                    : "bg-gray-50/50 dark:bg-gray-800/30"
                    }`}
                >
                  {/* Label */}
                  <td className="px-5 py-3 font-medium text-gray-700 dark:text-gray-300">
                    {field.label}
                  </td>

                  {/* Select */}
                  <td className="px-5 py-3">
                    <select
                      className={selectCls}
                      value={form[field.key]}
                      onChange={(e) => handleSelect(field.key, e.target.value)}
                    >
                      {field.options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Remark */}
                  <td className="px-5 py-3">
                    <textarea
                      rows={2}
                      className={textareaCls}
                      placeholder="Enter remark..."
                      value={form[field.remarkKey]}
                      onChange={(e) => handleText(field.remarkKey, e.target.value)}
                    />
                  </td>
                </tr>
              ))}

              {/* Sample Accepted */}
              <tr className="bg-gray-50/50 dark:bg-gray-800/30">
                <td className="px-5 py-3 font-semibold text-gray-800 dark:text-white">
                  Sample Accepted
                </td>
                <td className="px-5 py-3">
                  <select
                    className={selectCls}
                    value={form.accepted}
                    onChange={(e) => handleSelect("accepted", e.target.value)}
                  >
                    <option value={1}>Yes</option>
                    <option value={0}>No</option>
                  </select>
                </td>
                <td className="px-5 py-3">
                  <textarea
                    rows={2}
                    className={textareaCls}
                    placeholder="Enter remark..."
                    value={form.acceptedremark}
                    onChange={(e) => handleText("acceptedremark", e.target.value)}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between border-t border-gray-200 px-5 py-4 dark:border-gray-700">
          {/* Accepted indicator */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Decision:</span>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${form.accepted === 1
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                }`}
            >
              {form.accepted === 1 ? "✓ Sample Accepted" : "✗ Sample Rejected"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/dashboards/testing/pending-technical-acceptance")}
              disabled={submitting}
              className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className={`flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-blue-700 ${submitting ? "cursor-not-allowed opacity-60" : ""
                }`}
            >
              {submitting ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z" />
                  </svg>
                  Submitting…
                </>
              ) : (
                "Add Technical Acceptance"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}