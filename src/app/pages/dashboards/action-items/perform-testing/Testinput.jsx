// Import Dependencies
import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "utils/axios";
import dayjs from "dayjs";
import { toast } from "sonner";
import clsx from "clsx";
import Select from "react-select";

// Local Imports
import { Page } from "components/shared/Page";
import { Card } from "components/ui";

const customSelectStyles = {
  control: (base, state) => ({
    ...base,
    minHeight: "42px",
    borderColor: state.isFocused ? "#3b82f6" : "#d1d5db",
    boxShadow: state.isFocused ? "0 0 0 2px rgba(59, 130, 246, 0.5)" : "none",
    "&:hover": {
      borderColor: "#3b82f6",
    },
  }),
  menu: (base) => ({
    ...base,
    zIndex: 9999,
  }),
  menuPortal: (base) => ({
    ...base,
    zIndex: 9999,
  }),
};


function Spinner() {
  return (
    <svg className="h-5 w-5 animate-spin text-blue-600" viewBox="0 0 24 24">
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
  );
}

function ResultsTable({ results = [] }) {
  const list = Array.isArray(results) ? results : results ? [results] : [];
  if (!list.length)
    return <p className="py-4 text-sm text-gray-400">No results found.</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm border-collapse">
        <thead>
          <tr className="bg-gray-200 dark:bg-gray-800 border-b border-gray-300">
            {[
              "S.No",
              "Parameter",
              "Unit",
              "Results",
              "Test Method",
              "Permissible Value",
            ].map((h) => (
              <th
                key={h}
                className="border-r border-gray-300 px-3 py-2 text-xs font-semibold text-gray-600 uppercase last:border-r-0 dark:border-gray-700 dark:text-gray-300"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {list.map((r, i) => (
            <tr
              key={i}
              className="border-b border-gray-300 dark:border-gray-700 hover:bg-gray-50 transition-colors"
            >
              <td className="border-r border-gray-300 px-3 py-2 text-gray-500 last:border-r-0 dark:border-gray-700">{i + 1}</td>
              <td className="border-r border-gray-300 px-3 py-2 font-medium text-gray-800 last:border-r-0 dark:border-gray-700 dark:text-gray-200">
                {r.parameter ?? "—"}
              </td>
              <td className="border-r border-gray-300 px-3 py-2 text-gray-600 last:border-r-0 dark:border-gray-700 dark:text-gray-400">
                {r.unit ?? "—"}
              </td>
              {/* PHP: resultype 1=min,2=max,3=avg → round(result, decimal) */}
              <td className="border-r border-gray-300 px-3 py-2 font-semibold text-gray-800 last:border-r-0 dark:border-gray-700 dark:text-gray-100">
                {r.result ?? r.avg ?? "—"}
              </td>
              <td className="border-r border-gray-300 px-3 py-2 text-gray-600 last:border-r-0 dark:border-gray-700 dark:text-gray-400">
                {r.method ?? "—"}
              </td>
              <td className="px-3 py-2 text-gray-600 dark:text-gray-400">
                {r.specification ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SET END DATE MODAL
// PHP: modal-setEndDate → submiEndDate() → finalsubmitdata.php?updating&enddate=
// API: POST /actionitem/finalise-test-event { id, enddate: "dd/mm/yyyy" }
// ─────────────────────────────────────────────────────────────────────────────
function SetEndDateModal({ teid, startDate, onClose, onFinalised }) {
  const [endDate, setEndDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!endDate) {
      toast.error("Please select an end date.");
      return;
    }
    const [y, m, d] = endDate.split("-");
    const formatted = `${d}/${m}/${y}`; // PHP: changedateformatespecito → dd/mm/yyyy
    try {
      setSubmitting(true);
      await axios.post("/actionitem/finalise-test-event", {
        id: teid,
        enddate: formatted,
      });
      toast.success("Test finalised successfully ✅");
      onFinalised?.();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Finalise failed ❌");
    } finally {
      setSubmitting(false);
    }
  };

  // PHP: datepickerminmaxlimit(this.id, startdate, today)
  // startdate format from API: "11-03-2026 05:00 PM"  (dd-mm-yyyy h:i A)
  const minDate = (() => {
    if (!startDate) return undefined;
    try {
      const datePart = startDate.split(" ")[0]; // "11-03-2026"
      const [dd, mm, yyyy] = datePart.split("-");
      return `${yyyy}-${mm}-${dd}`; // "2026-03-11"
    } catch {
      return undefined;
    }
  })();
  const maxDate = dayjs().format("YYYY-MM-DD");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-gray-900">
        <h3 className="dark:text-dark-100 mb-4 text-base font-semibold text-gray-800">
          Set Test End Date
        </h3>
        <div className="mb-4">
          <label className="mb-1 block text-xs font-medium text-gray-500">
            End Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={endDate}
            min={minDate}
            max={maxDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
          />
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400"
          >
            Close
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className={clsx(
              "rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700",
              submitting && "cursor-not-allowed opacity-60",
            )}
          >
            {submitting ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function TestInput() {
  const { teid } = useParams();
  const navigate = useNavigate();

  const [testData, setTestData] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [retesting, setRetesting] = useState(false);
  const [endDateModal, setEndDateModal] = useState(false);

  // Form state
  const [temperature, setTemperature] = useState("27");
  const [humidity, setHumidity] = useState("30");
  const [remark, setRemark] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [instruments, setInstruments] = useState({});
  const [consumables, setConsumables] = useState({});
  const [measurements, setMeasurements] = useState({});


  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/actionitem/get-test-event/${teid}`);
      const d = res.data?.data ?? res.data ?? null;
      setTestData(d);

      const evt = d?.test_event ?? {};
      setTemperature(String(evt.temperature ?? "27"));
      setHumidity(String(evt.humidity ?? "30"));
      setRemark(evt.remark ?? "");
    } catch (err) {
      console.error("Error loading test event:", err);
      toast.error("Failed to load test data.");
    } finally {
      setLoading(false);
    }
  }, [teid]);

  // ── GET /actionitem/get-test-result/:teid ────────────────────────────────
  // Response: { success, data: { parameter, unit, min, max, avg, result,
  //                              status, method, specification } }
  const fetchResults = useCallback(async () => {
    try {
      const res = await axios.get(`/actionitem/get-test-result/${teid}`);
      const d = res.data?.data ?? res.data ?? null;
      setResults(d ? (Array.isArray(d) ? d : [d]) : []);
    } catch (err) {
      console.error("Error loading results:", err);
    }
  }, [teid]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Derived values ────────────────────────────────────────────────────────
  const evt = testData?.test_event ?? {};
  const status = Number(evt.status ?? 0);

  // Debug: Log status to console
  console.log("Test Event Status:", status, "Raw:", evt.status);

  const trfproduct = evt.trfproduct ?? ""; // PHP: $trfproduct → back button
  const has_documents = Boolean(testData?.has_documents ?? false);
  const lrn = testData?.lrn ?? "";
  const prow = testData?.parameter ?? {}; // PHP: $prow
  const cycle = Number(testData?.cycle ?? prow.cycle ?? 1);

  // parameter_elements[].measurement_id = PHP $pid = $frow['element']
  const paramElements = Array.isArray(testData?.parameter_elements)
    ? testData.parameter_elements
    : [];

  // ── FIX: instruments options — Array OR keyed Object ─────────────────────
  // "275": options = [...Array...]     → use as-is
  // "4":   options = {"2":{}, "3":{}} → Object.values() → Array
  const instrList = Array.isArray(testData?.instruments)
    ? testData.instruments.map((instr) => ({
      ...instr,
      options: Array.isArray(instr.options)
        ? instr.options
        : Object.values(instr.options ?? {}), // ✅ always Array now
    }))
    : [];

  const consumList = Array.isArray(testData?.consumables)
    ? testData.consumables
    : [];

  // Pre-select saved instruments from evt.instruments = ",275,4," string
  // PHP: $iinstruments = explode(",", $instruments)
  //      if (in_array($brow['id'], $iinstruments)) echo "selected='selected'"
  useEffect(() => {
    if (!evt.instruments || instrList.length === 0) return;
    const savedIds = evt.instruments
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (!savedIds.length) return;
    const preSelected = {};
    instrList.forEach((cat) => {
      const match = cat.options.find((opt) =>
        savedIds.includes(String(opt.id)),
      );
      if (match) preSelected[cat.id] = String(match.id);
    });
    if (Object.keys(preSelected).length > 0) setInstruments(preSelected);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testData]);

  // Fetch results when status == 24
  useEffect(() => {
    if (status === 24) fetchResults();
  }, [status, fetchResults]);

  const handleMeasurement = (cycleIdx, pid, value) => {
    setMeasurements((prev) => ({
      ...prev,
      [cycleIdx]: { ...(prev[cycleIdx] ?? {}), [pid]: value },
    }));
  };

  // ── POST /actionitem/add-test-data ───────────────────────────────────────
  // FormData fields (confirmed from Postman screenshot):
  //   teid, temperature, humidity, remark, attachment (File)
  //   instruments[0], instruments[1]...
  //   materiallocationid[0], materiallocationid[1]...
  //   quantity[0], quantity[1]...
  //   {measurement_id}[]  e.g. "446[]", "7[]", "15[]"  (per cycle)
  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const fd = new FormData();
      fd.append("teid", teid);
      fd.append("temperature", temperature);
      fd.append("humidity", humidity);
      fd.append("remark", remark);
      if (attachment) fd.append("attachment", attachment);

      // PHP: name="instrument['{$aid}']"  where $aid is instrument category ID
      Object.entries(instruments).forEach(([catId, val]) => {
        if (val) fd.append(`instrument[${catId}]`, val);
      });

      // PHP: name="materiallocationid['{$mid}']" and name="quantity['{$mid}']"
      Object.entries(consumables).forEach(([mid, vals]) => {
        fd.append(`materiallocationid[${mid}]`, vals.materiallocationid ?? "");
        fd.append(`quantity[${mid}]`, vals.quantity ?? "");
      });

      // PHP: name="{$pid}[]" → "$pid = $frow['element']" = measurement_id from API
      paramElements.forEach((el) => {
        const pid = el.measurement_id;
        for (let i = 0; i < cycle; i++) {
          fd.append(`${pid}[]`, measurements[i]?.[pid] ?? "");
        }
      });

      await axios.post("/actionitem/add-test-data", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Test data submitted successfully ✅");

      // Refetch data to get updated status and show results on same page
      await fetchData();
      await fetchResults();
    } catch (err) {
      console.error("Submit error:", err);
      toast.error(err?.response?.data?.message ?? "Submit failed ❌");
    } finally {
      setSubmitting(false);
    }
  };

  // ── POST /actionitem/finalise-test-event ─────────────────────────────────
  // PHP: finalsubmitdata.php — direct (no enddate, has_documents == false)
  const handleFinalise = async () => {
    try {
      setSubmitting(true);
      await axios.post("/actionitem/finalise-test-event", { id: teid });
      toast.success("Test finalised successfully ✅");
      navigate(`/dashboards/action-items/perform-testing/${trfproduct}`);
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Finalise failed ❌");
    } finally {
      setSubmitting(false);
    }
  };

  // ── POST /actionitem/request-reset/:teid ─────────────────────────────────
  // PHP: requestretest.php
  const handleRetest = async () => {
    if (!window.confirm("Request a retest for this test?")) return;
    try {
      setRetesting(true);
      await axios.get(`/actionitem/request-reset/${teid}`);
      toast.success("Retest requested ✅");
      navigate(`/dashboards/action-items/perform-testing/${trfproduct}`);
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Retest request failed ❌");
    } finally {
      setRetesting(false);
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Page title="Test Input">
        <div className="flex h-[60vh] items-center justify-center gap-3 text-gray-500">
          <Spinner /> Loading...
        </div>
      </Page>
    );
  }
  if (!testData) {
    return (
      <Page title="Test Input">
        <div className="flex h-[60vh] items-center justify-center text-gray-400">
          Nothing Here
        </div>
      </Page>
    );
  }

  return (
    <Page title="Test Input">
      <div className="transition-content w-full px-[var(--margin-x)] pb-10">
        {/* PHP: <a href="performtest.php?hakuna={trfproduct}"> Back To Tests</a> */}
        <div className="mb-5">
          <button
            onClick={() =>
              navigate(`/dashboards/action-items/perform-testing/${trfproduct}`)
            }
            className="rounded-lg border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
          >
            ← Back To Tests
          </button>
        </div>

        <Card className="p-6">
          {/* ── LRN ─────────────────────────────────────────────────────── */}
          <div className="mb-4 grid grid-cols-2 items-center gap-4 border-b border-gray-100 pb-4 dark:border-gray-800">
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
              LRN
            </label>
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
              {lrn || "—"}
            </span>
          </div>

          {/* ── Temperature ─────────────────────────────────────────────── */}
          {/* PHP: Temperature($prow['mintemp']-$prow['maxtemp'])            */}
          <div className="mb-4 grid grid-cols-2 items-center gap-4">
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Temperature
              {(prow.mintemp || prow.maxtemp) && (
                <span className="ml-1 text-xs text-gray-400">
                  ({prow.mintemp}–{prow.maxtemp})
                </span>
              )}
            </label>
            <input
              type="text"
              value={temperature}
              onChange={(e) => setTemperature(e.target.value)}
              placeholder="Environment Temperature in deg celsius"
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
            />
          </div>

          {/* ── Humidity ────────────────────────────────────────────────── */}
          {/* PHP: Humidity($prow['minhumidity']% - $prow['maxhumidity']%) */}
          <div className="mb-4 grid grid-cols-2 items-center gap-4">
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Humidity
              {(prow.minhumidity || prow.maxhumidity) && (
                <span className="ml-1 text-xs text-gray-400">
                  ({prow.minhumidity}% – {prow.maxhumidity}%)
                </span>
              )}
            </label>
            <input
              type="text"
              value={humidity}
              onChange={(e) => setHumidity(e.target.value)}
              placeholder="Environment Humidity in %"
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
            />
          </div>

          {/* ── Remark ──────────────────────────────────────────────────── */}
          <div className="mb-4 grid grid-cols-2 items-start gap-4">
            <label className="pt-2 text-sm font-medium text-gray-600 dark:text-gray-400">
              Remark
            </label>
            <textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="Theory & Remark"
              rows={3}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
            />
          </div>

          {/* ── Upload Attachment ────────────────────────────────────────── */}
          <div className="mb-6 grid grid-cols-2 items-center gap-4">
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Upload Attachment
            </label>
            <input
              type="file"
              onChange={(e) => setAttachment(e.target.files?.[0] ?? null)}
              className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-600"
            />
          </div>

          {/* ── Grade / Size ─────────────────────────────────────────────── */}
          {/* PHP: grades.name + sizes.name                                  */}
          {/* API: grade_name = "E 250 BR", size_name = "Thickness..."       */}
          {(testData.grade_name || testData.size_name) && (
            <div className="mb-6 grid grid-cols-2 gap-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-800/40">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase dark:text-gray-400">
                  Grade
                </p>
                <p className="mt-1 text-sm text-gray-800 dark:text-gray-200">
                  {testData.grade_name ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase dark:text-gray-400">
                  Size
                </p>
                <p className="mt-1 text-sm text-gray-800 dark:text-gray-200">
                  {testData.size_name ?? "—"}
                </p>
              </div>
            </div>
          )}

          {/* ── Parameter Remark ─────────────────────────────────────────── */}
          {/* PHP: echo $prow['remark'] — API returns "-" as placeholder     */}
          {prow.remark && prow.remark !== "-" && (
            <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800 dark:border-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300">
              {prow.remark}
            </div>
          )}

          {/* ── Instruments ──────────────────────────────────────────────── */}
          {/* PHP: foreach($allins as $aid) → one select per category        */}
          {/* PHP validates: mastervalidity.enddate > today (backend filters) */}
          {instrList.length > 0 && (
            <div className="mb-6">
              <h4 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                Instruments
              </h4>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
                {instrList.map((instr) => {
                  const catId = instr.id; // PHP: $aid
                  const catName = instr.name; // PHP: $iname
                  const options = instr.options; // already normalised to Array
                  return (
                    <div key={catId}>
                      <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                        {catName}
                      </label>
                      <Select
                        value={options.find(opt => String(opt.id) === instruments[catId]) ? { value: instruments[catId], label: `${options.find(opt => String(opt.id) === instruments[catId]).name}(${options.find(opt => String(opt.id) === instruments[catId]).newidno ?? options.find(opt => String(opt.id) === instruments[catId]).idno ?? options.find(opt => String(opt.id) === instruments[catId]).id})` } : null}
                        onChange={(selectedOption) =>
                          setInstruments((prev) => ({
                            ...prev,
                            [catId]: selectedOption ? selectedOption.value : "",
                          }))
                        }
                        options={options.map(opt => ({
                          value: String(opt.id),
                          label: `${opt.name}(${opt.newidno ?? opt.idno ?? opt.id})`
                        }))}
                        placeholder={`Select ${catName}`}
                        isClearable
                        styles={customSelectStyles}
                        menuPortalTarget={document.body}
                        menuPosition="fixed"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Consumables ──────────────────────────────────────────────── */}
          {/* PHP: foreach parameterconsumables → batch select + qty input   */}
          {consumList.length > 0 && (
            <div className="mb-6">
              <h4 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                Consumables
              </h4>
              <div className="space-y-3">
                {consumList.map((con) => {
                  const conId = con.id ?? con.mid;
                  const batches = Array.isArray(con.batches)
                    ? con.batches
                    : Array.isArray(con.materiallocation)
                      ? con.materiallocation
                      : [];
                  return (
                    <div
                      key={conId}
                      className="grid grid-cols-3 items-center gap-4 rounded-lg border border-gray-200 p-3 dark:border-gray-700"
                    >
                      {/* PHP: name."(".$consumable.")". " (in $uname)" */}
                      <div className="text-sm text-gray-700 dark:text-gray-300">
                        {con.name}({con.consumable_id ?? con.consumable}) (in{" "}
                        {con.unit})
                      </div>
                      {/* PHP: name="materiallocationid['{$mid}']" */}
                      <Select
                        value={batches.find(b => String(b.id) === consumables[conId]?.materiallocationid) ? { value: consumables[conId].materiallocationid, label: `${batches.find(b => String(b.id) === consumables[conId].materiallocationid).newidno}(${batches.find(b => String(b.id) === consumables[conId].materiallocationid).batchno})` } : null}
                        onChange={(selectedOption) =>
                          setConsumables((prev) => ({
                            ...prev,
                            [conId]: {
                              ...(prev[conId] ?? {}),
                              materiallocationid: selectedOption ? selectedOption.value : "",
                            },
                          }))
                        }
                        options={batches.map(b => ({
                          value: String(b.id),
                          label: `${b.newidno}(${b.batchno})`
                        }))}
                        placeholder="Select Batch"
                        isClearable
                        styles={customSelectStyles}
                        menuPortalTarget={document.body}
                        menuPosition="fixed"
                      />
                      {/* PHP: name="quantity['{$mid}']" */}
                      <input
                        type="text"
                        placeholder={`enter value in ${con.unit}`}
                        value={consumables[conId]?.quantity ?? ""}
                        onChange={(e) =>
                          setConsumables((prev) => ({
                            ...prev,
                            [conId]: {
                              ...(prev[conId] ?? {}),
                              quantity: e.target.value,
                            },
                          }))
                        }
                        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Measurement Table ─────────────────────────────────────────── */}
          {/* PHP: parameterelements → TH headers + for($i=0; $i<$cycle; $i++) */}
          {/* PHP: $pid = $frow['element'] = API measurement_id                 */}
          {/* PHP: name="$pid[]"  e.g. "7[]", "15[]"                           */}
          {paramElements.length > 0 && (
            <div className="mb-6">
              <h4 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                {/* PHP: echo $prow['name'] */}
                {prow.name ?? "Measurements"}
              </h4>
              <div className="overflow-x-auto rounded-lg border border-gray-300">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-200 dark:bg-gray-800 border-b border-gray-300">
                      {paramElements.map((el) => (
                        <th
                          key={el.measurement_id}
                          className="border-r border-gray-300 px-3 py-2 text-xs font-semibold text-gray-600 uppercase last:border-r-0 dark:border-gray-700 dark:text-gray-300"
                        >
                          {/* PHP: $pname = selectfieldwhere("measurements","name","id=$pid") */}
                          {el.name}
                          {el.unit && (
                            <span className="ml-1 font-normal text-gray-400 normal-case">
                              ({el.unit})
                            </span>
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {/* PHP: for ($i = 0; $i < $cycle; $i++) */}
                    {Array.from({ length: cycle }, (_, i) => (
                      <tr
                        key={i}
                        className="border-b border-gray-300 dark:border-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        {paramElements.map((el) => {
                          const pid = el.measurement_id; // PHP: $pid = $frow['element']
                          const unit = el.unit ?? "";
                          return (
                            <td key={pid} className="border-r border-gray-300 px-2 py-1 last:border-r-0 dark:border-gray-700">
                              {status === 0 ? (
                                // PHP: <input name="$pid[]" placeholder="enter value in $unit" />
                                <input
                                  type="text"
                                  placeholder={`value in ${unit}`}
                                  value={measurements[i]?.[pid] ?? ""}
                                  onChange={(e) =>
                                    handleMeasurement(i, pid, e.target.value)
                                  }
                                  className="w-full rounded border border-gray-300 px-2 py-1 text-sm outline-none focus:border-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                                />
                              ) : (
                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                  {measurements[i]?.[pid] ?? "—"} {unit}
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Action Buttons ─────────────────────────────────────────────── */}
          <div className="mt-6 border-t border-gray-100 pt-6 dark:border-gray-800">
            {/* status == 0 → Submit */}
            {/* PHP: if ($hakunastatus == 0) → sendForm inserttestdata.php */}
            {status === 0 && (
              <div className="flex justify-end">
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className={clsx(
                    "rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700",
                    submitting && "cursor-not-allowed opacity-60",
                  )}
                >
                  {submitting ? "Submitting..." : "Submit Test Data"}
                </button>
              </div>
            )}

            {/* status == 24 → Results table + Finalise + Retest */}
            {/* PHP: elseif ($hakunastatus == 24) */}
            {status === 24 && (
              <>
                <ResultsTable results={results} />
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  {/* PHP: if(mysqli_num_rows($itemDocument) > 0) → setEndDAte() modal
                            else → view(teid, finalsubmitdata.php, 'updating')         */}
                  <button
                    onClick={
                      has_documents
                        ? () => setEndDateModal(true)
                        : handleFinalise
                    }
                    disabled={submitting}
                    className={clsx(
                      "rounded-lg bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700",
                      submitting && "cursor-not-allowed opacity-60",
                    )}
                  >
                    {submitting ? "Finalising..." : "Finalise Data"}
                  </button>

                  {/* PHP: view(teid, requestretest.php, 'updating') */}
                  <button
                    onClick={handleRetest}
                    disabled={retesting}
                    className={clsx(
                      "rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700",
                      retesting && "cursor-not-allowed opacity-60",
                    )}
                  >
                    {retesting ? "Requesting..." : "Retest Data"}
                  </button>
                </div>
              </>
            )}
          </div>
        </Card>
      </div>

      {/* Set End Date Modal — PHP: modal-setEndDate → submiEndDate() */}
      {endDateModal && (
        <SetEndDateModal
          teid={teid}
          startDate={evt.startdate} // "11-03-2026 05:00 PM"
          onClose={() => setEndDateModal(false)}
          onFinalised={() =>
            navigate(`/dashboards/action-items/perform-testing/${trfproduct}`)
          }
        />
      )}
    </Page>
  );
}
