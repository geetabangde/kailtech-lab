import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "utils/axios";
import { toast } from "sonner";
import { Page } from "components/shared/Page";

// ── Shared styles ─────────────────────────────────────────────────────────────
const selectCls =
  "w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 " +
  "px-3 py-2 text-sm text-gray-700 dark:text-gray-300 outline-none " +
  "focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 transition";

const inputCls =
  "w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 " +
  "px-3 py-2 text-sm text-gray-700 dark:text-gray-300 outline-none " +
  "focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 transition placeholder-gray-400";

// ─────────────────────────────────────────────────────────────────────────────

export default function AllotSampleForm() {
  const { id } = useParams();           // trfproduct id from URL
  const navigate = useNavigate();

  const [pageData, setPageData] = useState(null);   // full API response
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Form state
  const [department, setDepartment] = useState("");
  const [person, setPerson] = useState("");

  // Per-row inputs: { [receivedItemId]: { biscode, alloted } }
  const [rowInputs, setRowInputs] = useState({});

  // Persons filtered by selected lab
  // PHP: fetchpeople.php → admin where FIND_IN_SET(id, labs.users)
  // Backend already returns all persons; we re-fetch filtered list on lab change
  const [filteredPersons, setFilteredPersons] = useState([]);

  // ── Fetch page data ───────────────────────────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`/actionitem/get-allot-data/${id}`);
        const d = res.data;
        setPageData(d);
        // Default: show all persons until lab selected
        setFilteredPersons(d.persons ?? []);
        // Init row inputs
        const init = {};
        (d.received_items ?? []).forEach((item) => {
          init[item.id] = { biscode: "", alloted: "" };
        });
        setRowInputs(init);
      } catch (err) {
        const msg = err?.response?.data?.message ?? "Failed to load data.";
        setError(msg);
        toast.error(msg + " ❌");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // ── When lab changes → filter persons ────────────────────────────────────
  // PHP fetchpeople.php filters by FIND_IN_SET(id, labs.users where id=dept)
  // Backend may return filtered persons via query param; fallback = show all
  const handleDepartmentChange = async (val) => {
    setDepartment(val);
    setPerson("");

    if (!val) {
      setFilteredPersons(pageData?.persons ?? []);
      return;
    }

    try {
      // Backend: Fetch persons for the selected lab
      const res = await axios.get(`/actionitem/get-persons/${val}`);
      const persons = res.data?.data ?? [];
      setFilteredPersons(Array.isArray(persons) ? persons : []);
    } catch (err) {
      console.error("Error fetching persons:", err);
      setFilteredPersons([]);
    }
  };

  // ── Row input change ──────────────────────────────────────────────────────
  const handleRowInput = (itemId, field, value) => {
    // Sirf negative block karo, max clamp nahi — error message dikhega
    if (field === "alloted") {
      const num = parseFloat(value);
      if (!isNaN(num) && num < 0) value = "0";
    }
    setRowInputs((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], [field]: value },
    }));
  };

  // ── Submit — POST /actionitem/allot-items ─────────────────────────────────
  const handleSubmit = async () => {
    // Validation
    if (!department) { toast.error("Please select a Lab ❌"); return; }
    if (!person) { toast.error("Please select a Person ❌"); return; }

    const items = pageData?.received_items ?? [];
    if (items.length === 0) { toast.error("Nothing to allot ❌"); return; }

    // Build arrays — PHP: qid[], biscode[], alloted[]
    const qidArr = [];
    const biscodeArr = [];
    const allotedArr = [];

    for (const item of items) {
      const { biscode, alloted } = rowInputs[item.id] ?? {};
      if (!biscode || !alloted) {
        toast.error(`Please fill BIS Code and Allot for row ${item.id} ❌`);
        return;
      }
      const allotNum = parseFloat(alloted);
      if (isNaN(allotNum) || allotNum <= 0) {
        toast.error(`Allot quantity must be > 0 for row ${item.id} ❌`);
        return;
      }
      if (allotNum > item.qleft) {
        toast.error(`Allot quantity exceeds left (${item.qleft}) for row ${item.id} ❌`);
        return;
      }
      qidArr.push(item.qid);
      biscodeArr.push(biscode);
      allotedArr.push(allotNum);
    }

    setSubmitting(true);
    try {
      await axios.post("/actionitem/allot-items", {
        department: Number(department),
        trfproduct: Number(id),
        person: Number(person),
        qid: qidArr,
        biscode: biscodeArr,
        alloted: allotedArr,
      });
      toast.success("Item Alloted Successfully ✅");
      navigate("/dashboards/action-items/allot-sample");
    } catch (err) {
      const msg = err?.response?.data?.message ?? "Failed to allot items.";
      toast.error(msg + " ❌");
    } finally {
      setSubmitting(false);
    }
  };

  // ── States ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Page title="Allot Sample">
        <div className="flex h-[60vh] items-center justify-center gap-3 text-gray-500">
          <svg className="h-5 w-5 animate-spin text-blue-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z" />
          </svg>
          Loading...
        </div>
      </Page>
    );
  }

  if (error) {
    return (
      <Page title="Allot Sample">
        <div className="flex h-60 items-center justify-center rounded-xl border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-sm font-medium text-red-600 dark:text-red-400">⚠️ {error}</p>
        </div>
      </Page>
    );
  }

  const allotableItems = pageData?.received_items ?? [];

  return (
    <Page title="Allot Sample">
      <div className="transition-content w-full pb-8">

        {/* ── Header ── */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-800 dark:text-white">
              TRF Product Item
            </h2>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              TRF Product ID:{" "}
              <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">{id}</span>
            </p>
          </div>
          <button
            onClick={() => navigate("/dashboards/action-items/allot-sample")}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-blue-700"
          >
            ← Back
          </button>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">

          {/* ── Lab + Person selects ── */}
          <div className="grid grid-cols-1 gap-4 border-b border-gray-200 p-5 dark:border-gray-700 sm:grid-cols-2">
            {/* Select Lab — PHP: labs where vertical=2 and status=1 and id IN (departments) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Select Lab
              </label>
              <select
                className={selectCls}
                value={department}
                onChange={(e) => handleDepartmentChange(e.target.value)}
              >
                <option value="">Select Lab</option>
                {(pageData?.labs ?? []).map((lab) => (
                  <option key={lab.id} value={lab.id}>{lab.name}</option>
                ))}
              </select>
            </div>

            {/* Select Person — PHP: admin where status=1 (filtered by lab) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Select Person
              </label>
              <select
                className={selectCls}
                value={person}
                onChange={(e) => setPerson(e.target.value)}
              >
                <option value="">Select Person</option>
                {filteredPersons.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* ── Received Items Table ── */}
          <div className="overflow-x-auto">
            {allotableItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <span className="text-3xl">📦</span>
                <p className="mt-2 text-sm">Nothing to Allot</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
                    {["ID", "Quantity", "Received", "Left", "Bis Code", "Allot"].map((h) => (
                      <th
                        key={h}
                        className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allotableItems.map((item, idx) => (
                    <tr
                      key={item.id}
                      className={`border-b border-gray-100 dark:border-gray-800 ${idx % 2 === 0
                        ? "bg-white dark:bg-gray-900"
                        : "bg-gray-50/50 dark:bg-gray-800/30"
                        }`}
                    >
                      <td className="px-5 py-3 font-mono text-xs text-gray-500 dark:text-gray-400">
                        {item.id}
                      </td>
                      <td className="px-5 py-3 font-medium text-gray-700 dark:text-gray-300">
                        {item.qty_name}
                      </td>
                      <td className="px-5 py-3 text-gray-600 dark:text-gray-400">
                        {item.received}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`font-semibold ${item.qleft > 0 ? "text-green-600 dark:text-green-400" : "text-red-500"}`}>
                          {item.qleft < 0 ? 0 : item.qleft}
                        </span>
                      </td>
                      {/* BIS Code input */}
                      <td className="px-5 py-3">
                        <input
                          type="text"
                          className={inputCls}
                          placeholder="biscode"
                          value={rowInputs[item.id]?.biscode ?? ""}
                          onChange={(e) => handleRowInput(item.id, "biscode", e.target.value)}
                        />
                      </td>
                      {/* Allot input — max = qleft */}
                      {/* Allot input — max = qleft */}
                      <td className="px-5 py-3">
                        <input
                          type="number"
                          className={`${inputCls} ${parseFloat(rowInputs[item.id]?.alloted) > Math.max(0, item.qleft)
                            ? "border-red-500 focus:border-red-500 focus:ring-red-100"
                            : ""
                            }`}
                          placeholder="alloted quantity"
                          min="0.01"
                          max={Math.max(0, item.qleft)}
                          step="0.01"
                          value={rowInputs[item.id]?.alloted ?? ""}
                          onChange={(e) => handleRowInput(item.id, "alloted", e.target.value)}
                        />
                        {/* Validation message — PHP: max[qleft] */}
                        {parseFloat(rowInputs[item.id]?.alloted) > Math.max(0, item.qleft) && (
                          <p className="mt-1 text-xs text-red-500">
                            Please enter a number less than or equal to {Math.max(0, item.qleft)}
                          </p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                {/* tfoot matching PHP */}
                <tfoot>
                  <tr className="border-t border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
                    {["ID", "Quantity", "Received", "Left", "BIS Code", "Allot"].map((h) => (
                      <th
                        key={h}
                        className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </tfoot>
              </table>
            )}
          </div>

          {/* ── Footer / Submit ── */}
          {allotableItems.length > 0 && (
            <div className="border-t border-gray-200 px-5 py-4 dark:border-gray-700">
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
                    Allotting…
                  </>
                ) : (
                  "Allot Items"
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </Page>
  );
}