
import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import Select from "react-select";
import axios from "utils/axios";
import { toast } from "sonner";
import clsx from "clsx";
import { Page } from "components/shared/Page";

// ─────────────────────────────────────────────────────────────────────────────
// Success Modal Component
// ─────────────────────────────────────────────────────────────────────────────
function SuccessModal({ isOpen, onClose, message }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="relative w-full max-w-md rounded-lg bg-white shadow-xl dark:bg-dark-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Result
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-8">
          <p className="text-base whitespace-pre-wrap text-gray-700 dark:text-gray-300">
            {message}
          </p>
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-gray-200 px-6 py-4 dark:border-gray-700">
          <button
            onClick={onClose}
            className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// react-select custom styles — matches app theme
// ─────────────────────────────────────────────────────────────────────────────
const selectStyles = {
  control: (base, state) => ({
    ...base,
    minHeight: "38px",
    borderRadius: "0.5rem",
    borderColor: state.isFocused ? "#3b82f6" : "#d1d5db",
    boxShadow: state.isFocused ? "0 0 0 2px rgba(59,130,246,0.2)" : "none",
    "&:hover": { borderColor: "#3b82f6" },
    fontSize: "0.813rem",
  }),
  multiValue: (base) => ({
    ...base,
    backgroundColor: "#2563eb",
    borderRadius: "0.375rem",
  }),
  multiValueLabel: (base) => ({
    ...base,
    color: "#ffffff",
    fontSize: "0.75rem",
    fontWeight: 600,
    padding: "2px 6px",
  }),
  multiValueRemove: (base) => ({
    ...base,
    color: "#ffffff",
    "&:hover": { backgroundColor: "#1d4ed8", color: "#fff" },
  }),
  menu: (base) => ({
    ...base,
    borderRadius: "0.5rem",
    fontSize: "0.813rem",
    zIndex: 50,
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected
      ? "#2563eb"
      : state.isFocused
        ? "#eff6ff"
        : "white",
    color: state.isSelected ? "#fff" : "#374151",
    cursor: "pointer",
  }),
  placeholder: (base) => ({ ...base, color: "#9ca3af", fontSize: "0.813rem" }),
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────
export default function GenerateUlr() {
  const { id: tid } = useParams();         // PHP: $_GET['hakuna']
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const hid = searchParams.get("hid") ?? "";  // PHP: $_GET['what']

  const [pageData, setPageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // react-select value: array of { value, label } — max 2
  const [selected, setSelected] = useState([]);
  const [reportDate, setReportDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // ── Fetch page data ───────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ id: tid });
      if (hid) params.append("hid", hid);
      const res = await axios.get(`/actionitem/get-generate-ulr-data?${params}`);
      setPageData(res.data?.data ?? res.data ?? null);
    } catch (err) {
      setError(err?.response?.data?.message ?? "Failed to load data.");
    } finally {
      setLoading(false);
    }
  }, [tid, hid]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Handle react-select change — enforce max 2 ────────────────────────────
  const handleSelectChange = (opts) => {
    if (!opts) { setSelected([]); return; }
    if (opts.length > 2) {
      toast.warning("Max 2 signatories allowed.");
      return;
    }
    setSelected(opts);
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!selected.length) {
      toast.error("Please select at least one signatory.");
      return;
    }
    if (pageData?.show_date_field && !reportDate) {
      toast.error("Please select a date.");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        hid,
        tid,
        signatories: selected.map((s) => s.value),
        ...(pageData?.show_date_field && reportDate ? { report_date: reportDate } : {}),
      };
      const response = await axios.post("/actionitem/generate-ulr", payload);
      
      let message = pageData?.button_label === "Generate ULR"
        ? "Success : ULR Generated"
        : "Success : Report Completed";
      
      if (response.data?.ulr) {
        message += `\nULR: ${response.data.ulr}`;
      }
      
      setSuccessMessage(message);
      setShowSuccessModal(true);
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Submission failed ❌");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Handle Modal Close ────────────────────────────────────────────────────
  const handleModalClose = () => {
    setShowSuccessModal(false);
    navigate("/dashboards/action-items/generate-ulr");
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) return (
    <Page title="Generate ULR">
      <div className="flex h-[60vh] items-center justify-center gap-3 text-gray-500">
        <svg className="h-5 w-5 animate-spin text-blue-600" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z" />
        </svg>
        Loading...
      </div>
    </Page>
  );

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error) return (
    <Page title="Generate ULR">
      <div className="flex h-60 flex-col items-center justify-center gap-4 rounded-xl border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
        <p className="text-sm text-red-500">{error}</p>
        <button
          onClick={() => navigate(-1)}
          className="rounded bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
        >
          ← Go Back
        </button>
      </div>
    </Page>
  );

  if (!pageData) return null;

  // ── Destructure ───────────────────────────────────────────────────────────
  const {
    product = "—",
    package: packageName = "—",
    button_label = "Generate ULR",
    has_pending_parameters = false,
    paymentpass = true,
    pass2 = true,
    pending_request_count = 0,
    can_generate_button = true,
    show_date_field = false,
    signatories: sigList = [],
  } = pageData;

  // Convert signatories → react-select options { value, label }
  const options = sigList.map((s) => ({ value: s.id, label: s.name }));

  return (
    <Page title={button_label}>
      <div className="transition-content px-[var(--margin-x)] pb-8">

        {/* Success Modal */}
        <SuccessModal
          isOpen={showSuccessModal}
          onClose={handleModalClose}
          message={successMessage}
        />

        {/* ── Header ───────────────────────────────────────────────────── */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-base font-semibold text-gray-800 dark:text-gray-100">
            Generate URL and Print Report
          </h1>
          <button
            onClick={() => navigate("/dashboards/action-items/generate-ulr")}
            className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
            </svg>
            Back to ULR Requests
          </button>
        </div>

        {/* ── Main Card ────────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-dark-800">
          <div className="p-6 space-y-6">

            {/* Product | Package */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Product</p>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{product}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Package</p>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{packageName}</p>
              </div>
            </div>

            {/* PHP: if ($parameter) partial results warning */}
            {has_pending_parameters && (
              <div className="rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 dark:bg-red-900/20">
                ⚠️ Are you sure to do ULR for Partial Reports only?
              </div>
            )}

            {/* PHP: if ($paymentpass) → form, else → payment messages */}
            {paymentpass ? (
              <>
                {/* Signatory — react-select searchable multi (max 2) */}
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Select Reviewed &amp; Authorised By Signatory
                    <span className="ml-1 text-xs font-normal text-gray-400">(max 2)</span>
                  </label>
                  <Select
                    isMulti
                    options={options}
                    value={selected}
                    onChange={handleSelectChange}
                    placeholder="Search and select signatory..."
                    styles={selectStyles}
                    closeMenuOnSelect={false}
                    isOptionDisabled={() => selected.length >= 2}
                    noOptionsMessage={() => "No signatory found"}
                    className="text-sm"
                  />
                  {selected.length > 0 && (
                    <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                      Selected ({selected.length}/2):&nbsp;
                      {selected.map((s) => s.label).join(", ")}
                    </p>
                  )}
                </div>

                {/* PHP: if (in_array(462, $permissions)) → show_date_field */}
                {show_date_field && (
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-400">
                      Select Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={reportDate}
                      onChange={(e) => setReportDate(e.target.value)}
                      className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                    />
                  </div>
                )}

                {/* PHP: if (in_array(137, $permissions)) → can_generate_button */}
                {can_generate_button && (
                  <div className="flex items-center justify-between pt-2">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {button_label}
                    </p>
                    <button
                      onClick={handleSubmit}
                      disabled={submitting}
                      className={clsx(
                        "rounded-lg bg-green-600 px-6 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-green-700",
                        submitting && "opacity-60 cursor-not-allowed"
                      )}
                    >
                      {submitting ? "Processing..." : button_label}
                    </button>
                  </div>
                )}
              </>
            ) : (
              /* PHP: $paymentpass = false */
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-900/20">
                {!pass2 ? (
                  <p className="text-sm font-semibold text-amber-700">Pending Form Payment</p>
                ) : pending_request_count >= 1 ? (
                  <p className="text-sm font-semibold text-amber-700">Payment Approval Request Pending</p>
                ) : (
                  <div className="flex items-center gap-4">
                    <p className="text-sm text-amber-700">Payment approval required before generating ULR.</p>
                    <button
                      onClick={() => toast.info("Request payment approval from Accounts/BD team.")}
                      className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600"
                    >
                      Notify BD for Payment Approval
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

      </div>
    </Page>
  );
}