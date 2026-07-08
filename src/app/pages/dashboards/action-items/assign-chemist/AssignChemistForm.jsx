// Import Dependencies
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "utils/axios";
import { toast } from "sonner";
import dayjs from "dayjs";
import clsx from "clsx";

// Local Imports
import { Page } from "components/shared/Page";

// ─── Helpers ───────────────────────────────────────────────────────────────────
const inputCls =
  "w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 " +
  "px-3 py-2 text-sm text-gray-700 dark:text-gray-300 outline-none " +
  "focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 transition placeholder:text-gray-400";

const labelCls = "block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1";

function getPermissions() {
  const p = localStorage.getItem("userPermissions");
  try {
    return JSON.parse(p) || [];
  } catch {
    return p?.split(",").map(Number) || [];
  }
}

// ─── SearchableSelect Component ────────────────────────────────────────────────
// options: [{ id, label }]
function SearchableSelect({ options = [], value, onChange, placeholder = "Select..." }) {
  const [open,   setOpen]   = useState(false);
  const [search, setSearch] = useState("");
  const ref                 = useRef(null);

  const selected = options.find((o) => String(o.id) === String(value));

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (id) => {
    onChange(id);
    setSearch("");
    setOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange("");
    setSearch("");
  };

  return (
    <div ref={ref} className="relative w-full">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => { setOpen((p) => !p); setSearch(""); }}
        className={clsx(
          "flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm outline-none transition",
          "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800",
          "focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900",
          selected ? "text-gray-700 dark:text-gray-300" : "text-gray-400 dark:text-gray-500"
        )}
      >
        <span className="truncate">{selected ? selected.label : placeholder}</span>
        <span className="flex shrink-0 items-center gap-1">
          {selected && (
            <span
              onClick={handleClear}
              className="flex h-4 w-4 items-center justify-center rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700"
            >
              ✕
            </span>
          )}
          <svg
            className={clsx("h-4 w-4 text-gray-400 transition-transform", open && "rotate-180")}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
          {/* Search input */}
          <div className="p-2">
            <input
              autoFocus
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full rounded-md border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
            />
          </div>

          {/* Options list */}
          <ul className="max-h-52 overflow-y-auto pb-1">
            {filtered.length === 0 ? (
              <li className="px-4 py-3 text-center text-sm text-gray-400">No results found</li>
            ) : (
              filtered.map((o) => (
                <li
                  key={o.id}
                  onClick={() => handleSelect(o.id)}
                  className={clsx(
                    "cursor-pointer px-4 py-2 text-sm transition",
                    String(o.id) === String(value)
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-medium"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  )}
                >
                  {o.label}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function AssignChemistDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const permissions = useMemo(() => getPermissions(), []);
  const canAccessPage = permissions.includes(6);

  useEffect(() => {
    if (!canAccessPage) {
      navigate("/dashboards");
    }
  }, [canAccessPage, navigate]);

  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // ── Data from single GET response ─────────────────────────────────────────
  const [gradeSize,   setGradeSize]   = useState("—");
  const [lrn,         setLrn]         = useState("—");
  const [brand,       setBrand]       = useState("—");
  const [departments, setDepartments] = useState([]); // [{ id, label }]
  const [persons,     setPersons]     = useState([]); // [{ id, label }]
  const [rows,        setRows]        = useState([]);
  const [minDate,     setMinDate]     = useState("");

  // ── Global form fields ────────────────────────────────────────────────────
  const [department,   setDepartment]   = useState("");
  const [person,       setPerson]       = useState("");
  const [allo,         setAllo]         = useState("");
  const [dued,         setDued]         = useState("");
  const [longTermTest, setLongTermTest] = useState("");
  const [interimYes,   setInterimYes]   = useState("");
  const [longterm,     setLongterm]     = useState("");
  const [interimNo,    setInterimNo]    = useState("");

  // ── Fetch — single GET ────────────────────────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      if (!canAccessPage) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const res = await axios.get(`/actionitem/get-assign-chemists-details-byid/${id}`);
        const d = res.data;

        const grade = d?.grades ?? "";
        const size  = d?.size   ?? "";
        setGradeSize(grade && size ? `${grade} / ${size}` : grade || size || "—");
        setLrn(d?.lrn   ?? "—");
        setBrand(d?.brand ?? "—");

        // departments[] → { id, name }
        setDepartments(
          (Array.isArray(d?.departments) ? d.departments : []).map((dep) => ({
            id: dep.id, label: dep.name,
          }))
        );

        // person[] → { id, firstname, lastname }
        setPersons(
          (Array.isArray(d?.person) ? d.person : []).map((p) => ({
            id: p.id, label: `${p.firstname ?? ""} ${p.lastname ?? ""}`.trim(),
          }))
        );

        // data[] rows — chemists[] → { id, name }
        setRows(
          (Array.isArray(d?.data) ? d.data : []).map((p) => ({
            id:             p.id,
            parameter:      p.parameter,
            parameterName:  p.parameter_name ?? "—",
            departmentName: p.department_name ?? "—",
            chemists:       (Array.isArray(p.chemists) ? p.chemists : []).map((c) => ({
              id: c.id, label: c.name,
            })),
            chemist:       "",
            allotmentdate: "",
            duedate:       "",
          }))
        );

        // Min Date logic from PHP: use TRF date as min allowed
        const trfD = d?.trf_date ?? d?.date ?? "";
        if (trfD && trfD !== "0000-00-00 00:00:00") {
          setMinDate(trfD.split(" ")[0]); // Extract YYYY-MM-DD
        }

      } catch (err) {
        console.error("Error fetching assign chemist details:", err);
        toast.error("Failed to load data.");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
  }, [canAccessPage, id]);

  // ── Fetch persons by department ──────────────────────────────────────────
  useEffect(() => {
    const fetchPersonsByDept = async () => {
      setPerson(""); // Clear previous selection
      if (!department) return;
      try {
        const res = await axios.get(`/actionitem/get-persons/${department}`);
        const d   = res.data?.data ?? res.data?.Data ?? [];
        if (Array.isArray(d)) {
          setPersons(d.map(p => ({
            id: p.id,
            label: p.name || `${p.firstname ?? ""} ${p.lastname ?? ""}`.trim()
          })));
        }
      } catch (err) {
        console.error("Error fetching persons by department:", err);
      }
    };
    fetchPersonsByDept();
  }, [department]);

  // ── Global person → fill all chemist rows (PHP: changechemist()) ──────────
  const handlePersonChange = useCallback((val) => {
    setPerson(val);
    setRows((prev) => prev.map((r) => ({ ...r, chemist: val })));
  }, []);

  // ── Global allotment date → fill all rows (PHP: changeallot()) ────────────
  const handleAlloChange = useCallback((val) => {
    setAllo(val);
    setRows((prev) => prev.map((r) => ({ ...r, allotmentdate: val })));
  }, []);

  // ── Global due date → fill all rows (PHP: changedue()) ───────────────────
  const handleDuedChange = useCallback((val) => {
    setDued(val);
    setRows((prev) => prev.map((r) => ({ ...r, duedate: val })));
  }, []);

  const updateRow = useCallback((index, field, value) => {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  }, []);

  const handleLongTermChange = (val) => {
    setLongTermTest(val);
    setInterimYes(""); setLongterm(""); setInterimNo("");
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (!r.chemist)       { toast.error(`Row ${i + 1}: Please select a Chemist.`);     return; }
      if (!r.allotmentdate) { toast.error(`Row ${i + 1}: Please enter Allotment Date.`); return; }
      if (!r.duedate)       { toast.error(`Row ${i + 1}: Please enter Due Date.`);       return; }
    }
    if (!longTermTest) { toast.error("Please select Long Term Test option."); return; }
    if (longTermTest === "yes" && (!interimYes || !longterm)) {
      toast.error("Please fill Interim and Longterm report dates."); return;
    }
    if (longTermTest === "no" && !interimNo) {
      toast.error("Please fill Tentative Report Date."); return;
    }

    const body = {
      department,
      trfproduct:    id,
      person,
      allo:          allo ? dayjs(allo).format("DD/MM/YYYY") : "",
      dued:          dued ? dayjs(dued).format("DD/MM/YYYY") : "",
      longTermTest,
      interim_yes:   interimYes ? dayjs(interimYes).format("DD/MM/YYYY") : "",
      longterm:      longterm ? dayjs(longterm).format("DD/MM/YYYY") : "",
      interim_no:    interimNo ? dayjs(interimNo).format("DD/MM/YYYY") : "",
      parameter:     rows.map((r) => r.parameter),
      chemist:       rows.map((r) => r.chemist),
      allotmentdate: rows.map((r) => r.allotmentdate ? dayjs(r.allotmentdate).format("DD/MM/YYYY") : ""),
      duedate:       rows.map((r) => r.duedate ? dayjs(r.duedate).format("DD/MM/YYYY") : ""),
    };

    try {
      setSubmitting(true);
      await axios.post("/actionitem/add-assign-chemists", body);
      toast.success("Chemist Assigned Successfully ✅");
      navigate(-1);
    } catch (err) {
      const msg = err?.response?.data?.message ?? "Failed to assign chemist.";
      toast.error(msg + " ❌");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (!canAccessPage) return null;

  if (loading) {
    return (
      <Page title="Package Parameters Assignment">
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

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Page title="Package Parameters Assignment">
      <div className="transition-content w-full pb-8 px-[var(--margin-x)]">

        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-dark-100">
            Package Parameters Assignment
          </h2>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 rounded-lg border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100 dark:border-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
          >
            ← Back to Chemist
          </button>
        </div>

        {/* Product Info */}
        <div className="mb-4 rounded-xl border border-gray-200 bg-white px-6 py-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-xs font-medium text-gray-400 dark:text-gray-500">Grade/Size</p>
              <p className="mt-0.5 text-sm font-semibold text-gray-800 dark:text-dark-100">{gradeSize}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400 dark:text-gray-500">LRN</p>
              <p className="mt-0.5 font-mono text-sm font-semibold text-blue-600 dark:text-blue-400">{lrn}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400 dark:text-gray-500">Brand/Source</p>
              <p className="mt-0.5 text-sm font-semibold text-gray-800 dark:text-dark-100">{brand}</p>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">

          {/* Row 1: Department + Person — searchable */}
          <div className="grid grid-cols-2 gap-4 border-b border-gray-100 px-6 py-4 dark:border-gray-800">
            <div>
              <label className={labelCls}>Department</label>
              <SearchableSelect
                options={departments}
                value={department}
                onChange={setDepartment}
                placeholder="Select Department"
              />
            </div>
            <div>
              <label className={labelCls}>Person</label>
              {/* Selecting person fills all chemist[] rows */}
              <SearchableSelect
                options={persons}
                value={person}
                onChange={handlePersonChange}
                placeholder="Select Person"
              />
            </div>
          </div>

          {/* Row 2: Allotment Date + Due Date */}
          <div className="grid grid-cols-2 gap-4 border-b border-gray-100 px-6 py-4 dark:border-gray-800">
            <div>
              <label className={labelCls}>Allotment Date</label>
              <input 
                type="date" 
                className={inputCls} 
                min={minDate}
                value={allo} 
                onChange={(e) => handleAlloChange(e.target.value)} 
              />
            </div>
            <div>
              <label className={labelCls}>Due Date</label>
              <input type="date" className={inputCls} value={dued} onChange={(e) => handleDuedChange(e.target.value)} />
            </div>
          </div>

          {/* Row 3: Long Term Test */}
          <div className="grid grid-cols-2 gap-4 border-b border-gray-100 px-6 py-4 dark:border-gray-800">
            <div>
              <label className={labelCls}>Long Term Test</label>
              <SearchableSelect
                options={[{ id: "yes", label: "Yes" }, { id: "no", label: "No" }]}
                value={longTermTest}
                onChange={handleLongTermChange}
                placeholder="Select the Long Term Test"
              />
            </div>
            <div className="flex flex-col gap-2">
              {longTermTest === "yes" && (
                <>
                  <div>
                    <label className={labelCls}>Tentative Report Date (Interim)</label>
                    <input type="date" className={inputCls} value={interimYes} onChange={(e) => setInterimYes(e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>Tentative Report Date (Longterm)</label>
                    <input type="date" className={inputCls} value={longterm} onChange={(e) => setLongterm(e.target.value)} />
                  </div>
                </>
              )}
              {longTermTest === "no" && (
                <div>
                  <label className={labelCls}>Tentative Report Date</label>
                  <input type="date" className={inputCls} value={interimNo} onChange={(e) => setInterimNo(e.target.value)} />
                </div>
              )}
            </div>
          </div>

          {/* Parameters Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-gray-100 dark:bg-dark-800">
                  {["ID", "Parameter", "Department", "Chemist", "Allotment Date", "Due Date"].map((h) => (
                    <th key={h} className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-dark-300">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <svg className="h-8 w-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-base font-semibold text-gray-600 dark:text-dark-300">
                          No Further Actions Required From Your End
                        </p>
                        <p className="text-xs text-gray-400">All parameters for this package have already been allotted.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  rows.map((row, index) => (
                    <tr key={row.id} className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-2 text-xs text-gray-500">{row.id}</td>
                      <td className="px-4 py-2 font-medium text-gray-700 dark:text-dark-200">{row.parameterName}</td>
                      <td className="px-4 py-2 text-gray-600 dark:text-dark-300">{row.departmentName}</td>

                      {/* Chemist — searchable per row */}
                      <td className="px-4 py-2 min-w-[200px]">
                        <SearchableSelect
                          options={row.chemists}
                          value={row.chemist}
                          onChange={(val) => updateRow(index, "chemist", val)}
                          placeholder="Select Person"
                        />
                      </td>

                      <td className="px-4 py-2">
                        <input
                          type="date"
                          className={inputCls + " min-w-[140px]"}
                          min={minDate}
                          value={row.allotmentdate}
                          onChange={(e) => updateRow(index, "allotmentdate", e.target.value)}
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="date"
                          className={inputCls + " min-w-[140px]"}
                          value={row.duedate}
                          onChange={(e) => updateRow(index, "duedate", e.target.value)}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
             
            </table>
          </div>

          {/* Submit */}
          {rows.length > 0 && (
            <div className="px-6 py-4">
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className={clsx(
                  "rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400",
                  submitting && "cursor-not-allowed opacity-60"
                )}
              >
                {submitting ? "Assigning..." : "Assign Chemist"}
              </button>
            </div>
          )}
        </div>
      </div>
    </Page>
  );
}
