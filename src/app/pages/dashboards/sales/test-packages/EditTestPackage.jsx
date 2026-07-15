// Import Dependencies
import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import axios from "utils/axios";
import { toast } from "sonner";
import Select from "react-select";

// Local Imports
import { Page } from "components/shared/Page";
import { Card } from "components/ui";
import {
  FormRow,
  useTestPackageDropdowns,
  inputCls
} from "./TestPackageForm";

// ----------------------------------------------------------------------

const NABL_OPTIONS = [
  { value: 1, label: "NABL" },
  { value: 3, label: "QAI" },
  { value: 2, label: "NO" },
];

// ── Quantity Modal ─────────────────────────────────────────────────────────
function QuantityModal({ packageId, onClose, onAdded }) {
  const [units, setUnits] = useState([]);
  const [form, setForm] = useState({ name: "", quantity: "", unit: "" });
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    axios.get("/master/units-list").then((res) => {
      const list = res.data.data ?? [];
      setUnits(list);
      if (list[0]) setForm((p) => ({ ...p, unit: list[0].id }));
    });
  }, []);

  const handleAdd = async () => {
    if (!form.name || !form.quantity || !form.unit) {
      toast.error("Fill all quantity fields");
      return;
    }
    setAdding(true);
    try {
      const res = await axios.post("/sales/add-quantity", {
        name: form.name,
        quantity: Number(form.quantity),
        unit: Number(form.unit),
        package: Number(packageId),
      });
      if (
        res.data.success === true ||
        res.data.status === true ||
        res.data.status === "true"
      ) {
        toast.success("Quantity added ✅");
        setForm({ name: "", quantity: "", unit: units[0]?.id ?? "" });
        onAdded();
        onClose();
      } else {
        toast.error(res.data.message ?? "Failed to add quantity");
      }
    } catch {
      toast.error("Failed to add quantity");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="dark:bg-dark-800 w-full max-w-md rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="dark:border-dark-500 flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h3 className="dark:text-dark-50 text-base font-semibold text-gray-800">
            Add New Quantity
          </h3>
          <button
            onClick={onClose}
            className="dark:hover:text-dark-200 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
        {/* Body */}
        <div className="space-y-4 p-5">
          <div>
            <label className="dark:text-dark-300 mb-1 block text-sm font-medium text-gray-600">
              Quantity Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="ex: 2m straight pipe, 4m bar etc"
              className={inputCls}
            />
          </div>
          <div>
            <label className="dark:text-dark-300 mb-1 block text-sm font-medium text-gray-600">
              Quantity
            </label>
            <input
              type="number"
              value={form.quantity}
              onChange={(e) =>
                setForm((p) => ({ ...p, quantity: e.target.value }))
              }
              placeholder="Quantity"
              className={inputCls}
            />
          </div>
          <div>
            <label className="dark:text-dark-300 mb-1 block text-sm font-medium text-gray-600">
              Unit
            </label>
            <Select
              options={units.map((u) => ({
                value: u.id,
                label: u.name + (u.description ? ` (${u.description})` : ""),
              }))}
              value={
                units
                  .map((u) => ({
                    value: u.id,
                    label: u.name + (u.description ? ` (${u.description})` : ""),
                  }))
                  .find((o) => String(o.value) === String(form.unit)) || null
              }
              onChange={(opt) => setForm((p) => ({ ...p, unit: opt ? opt.value : "" }))}
              placeholder="Select Unit..."
              isSearchable
            />
          </div>
        </div>
        {/* Footer */}
        <div className="dark:border-dark-500 flex items-center justify-end gap-2 border-t border-gray-200 px-5 py-4">
          <button
            onClick={onClose}
            className="dark:border-dark-500 dark:text-dark-300 rounded-md border border-gray-300 px-5 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            Close
          </button>
          <button
            onClick={handleAdd}
            disabled={adding}
            className="w-full rounded-md bg-green-600 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            {adding ? "Adding…" : "Add Quantity"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── isRequired — PHP frequency logic ka exact React port ──────────────────
function isRequired(schedule, existingRecords) {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const hour = now.getHours();

  const typed = existingRecords.filter((r) => r.type === schedule.type);

  switch (schedule.frequency) {
    case "Once a day":
      return (
        typed.filter((r) => r.added_on?.slice(0, 10) === todayStr).length < 1
      );

    case "Twice a day":
      if (hour >= 14) {
        return (
          typed.filter((r) => {
            if (!r.added_on) return false;
            return (
              r.added_on.slice(0, 10) === todayStr &&
              new Date(r.added_on).getHours() >= 14
            );
          }).length < 1
        );
      } else {
        return (
          typed.filter((r) => r.added_on?.slice(0, 10) === todayStr).length < 1
        );
      }

    case "Monthly": {
      const mm = String(now.getMonth() + 1).padStart(2, "0");
      const monthStart = `${now.getFullYear()}-${mm}-01`;
      return (
        typed.filter((r) => {
          const d = r.added_on?.slice(0, 10);
          return d >= monthStart && d <= todayStr;
        }).length < 1
      );
    }

    case "Yearly": {
      const yearStart = `${now.getFullYear()}-01-01`;
      return (
        typed.filter((r) => {
          const d = r.added_on?.slice(0, 10);
          return d >= yearStart && d <= todayStr;
        }).length < 1
      );
    }

    default:
      return true;
  }
}

// ── Parameter Modal ────────────────────────────────────────────────────────
function ParameterModal({ packageId, onClose, onAdded }) {
  const [parameters, setParameters] = useState([]);
  const [choices, setChoices] = useState([{ id: 1, name: "Yes" }, { id: 2, name: "No" }]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  const [form, setForm] = useState({
    parameter: "",
    visible: "",
    priority: "",
  });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [paramRes, choicesRes] = await Promise.allSettled([
          axios.get("/testing/get-perameter-list"),
          axios.get("/testing/get-choices") // fallback to static if fails
        ]);

        if (paramRes.status === "fulfilled" && paramRes.value.data?.data) {
          setParameters(paramRes.value.data.data);
        }
        if (choicesRes.status === "fulfilled" && choicesRes.value.data?.data) {
          setChoices(choicesRes.value.data.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleAdd = async () => {
    if (!form.parameter) {
      toast.error("Please select a parameter");
      return;
    }
    if (!form.visible) {
      toast.error("Please select visibility");
      return;
    }
    if (!form.priority) {
      toast.error("Please enter a priority");
      return;
    }

    setAdding(true);
    try {
      const res = await axios.post("/sales/add-package-parameter", {
        package: Number(packageId),
        parameter: Number(form.parameter),
        priority: Number(form.priority),
        visible: Number(form.visible),
      });

      if (
        res.data.success === true ||
        res.data.status === true ||
        res.data.status === "true"
      ) {
        toast.success("Parameter added ✅");
        onAdded();
        onClose();
      } else {
        toast.error(res.data.message ?? "Failed to add parameter");
      }
    } catch {
      toast.error("Failed to add parameter");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="dark:bg-dark-800 w-full max-w-md rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="dark:border-dark-500 flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h3 className="dark:text-dark-50 text-base font-semibold text-gray-800">
            Add New Parameter
          </h3>
          <button
            onClick={onClose}
            className="dark:hover:text-dark-200 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
        {/* Body */}
        <div className="space-y-4 p-5">
          {loading ? (
             <div className="flex justify-center p-4">
               <span className="text-gray-500">Loading...</span>
             </div>
          ) : (
            <>
              <div>
                <label className="dark:text-dark-300 mb-1 block text-sm font-medium text-gray-600">
                  Parameter Name
                </label>
                <Select
                  options={parameters.map((p) => ({
                    value: p.id,
                    label: p.name + (p.description ? ` (${p.description})` : ""),
                  }))}
                  value={
                    parameters
                      .map((p) => ({
                        value: p.id,
                        label: p.name + (p.description ? ` (${p.description})` : ""),
                      }))
                      .find((o) => String(o.value) === String(form.parameter)) || null
                  }
                  onChange={(opt) => setForm((p) => ({ ...p, parameter: opt ? opt.value : "" }))}
                  placeholder="Select Parameter Name"
                  isSearchable
                  menuPortalTarget={document.body}
                  styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                />
              </div>
              <div>
                <label className="dark:text-dark-300 mb-1 block text-sm font-medium text-gray-600">
                  Visible In Report ?
                </label>
                <Select
                  options={choices.map((c) => ({
                    value: c.id,
                    label: c.name,
                  }))}
                  value={
                    choices
                      .map((c) => ({
                        value: c.id,
                        label: c.name,
                      }))
                      .find((o) => String(o.value) === String(form.visible)) || null
                  }
                  onChange={(opt) => setForm((p) => ({ ...p, visible: opt ? opt.value : "" }))}
                  placeholder="Select Choice"
                  menuPortalTarget={document.body}
                  styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                />
              </div>
              <div>
                <label className="dark:text-dark-300 mb-1 block text-sm font-medium text-gray-600">
                  Priority
                </label>
                <input
                  type="number"
                  value={form.priority}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, priority: e.target.value }))
                  }
                  placeholder="Priority"
                  className={inputCls}
                />
              </div>
            </>
          )}
        </div>
        {/* Footer */}
        <div className="dark:border-dark-500 flex items-center justify-end gap-2 border-t border-gray-200 px-5 py-4">
          <button
            onClick={onClose}
            className="dark:border-dark-500 dark:text-dark-300 rounded-md border border-gray-300 px-5 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            Close
          </button>
          <button
            onClick={handleAdd}
            disabled={adding || loading}
            className="w-full rounded-md bg-green-600 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            {adding ? "Adding…" : "Add Parameter"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Edit Page (Edit + Clone mode) ────────────────────────────────────
export default function EditTestPackage() {
  const { id, cloneId } = useParams();
  const isClone = Boolean(cloneId);
  const recordId = isClone ? cloneId : id;
  const navigate = useNavigate();
  const permissions = JSON.parse(localStorage.getItem("userPermissions") || "[]");

  useEffect(() => {
    const required = isClone ? 264 : 266;
    if (!permissions.includes(required)) {
      navigate("/dashboards/sales/test-packages");
    }
  }, [navigate, permissions, isClone]);

  const {
    products,
    standards,
    currencies,
    loading: dropdownLoading,
  } = useTestPackageDropdowns();

  const [form, setForm] = useState(null);
  const [quantities, setQuantities] = useState([]);
  const [packageParams, setPackageParams] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showQtyModal, setShowQtyModal] = useState(false);
  const [showParamModal, setShowParamModal] = useState(false);

  const set = (key, val) => setForm((p) => ({ ...p, [key]: val }));

  // ✅ FIX 1 & 2: recordId use karo
  const loadQuantities = useCallback(async () => {
    try {
      const res = await axios.get(`/sales/get-quantity?package=${recordId}`);
      if (Array.isArray(res.data.data)) setQuantities(res.data.data);
    } catch {
      /* silent */
    }
  }, [recordId]);
  
  const loadParameters = useCallback(async () => {
    try {
      const res = await axios.get(`/testing/package-parameters/${recordId}`);
      if (res.data?.status && res.data.parameters) {
        setPackageParams(res.data.parameters);
      }
    } catch {
      /* silent */
    }
  }, [recordId]);

  useEffect(() => {
    const load = async () => {
      try {
        setDataLoading(true);
        const [pRes] = await Promise.all([
          axios.get(`/sales/get-test-package-byid/${recordId}`),
          loadQuantities(),
          loadParameters(),
        ]);
        const d = pRes.data.data ?? pRes.data.package ?? pRes.data ?? null;
        if (d && d.package !== undefined) {
          setForm({
            package: isClone ? `Copy Of ${d.package}` : (d.package ?? ""),
            type: d.type ?? 0,
            special: d.special ?? 0,
            nabl: d.nabl ?? 1,
            description: d.description ?? "",
            product: d.product ?? "",
            category: d.category ?? 0,
            standard: d.standard ?? "",
            rate: d.rate ?? "",
            currency: d.currency ?? "",
            days: d.days ?? "",
          });
        } else {
          toast.error("Package not found");
          navigate("/dashboards/sales/test-packages");
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load package");
      } finally {
        setDataLoading(false);
      }
    };
    load();
  }, [id, navigate, loadQuantities, loadParameters]);

  const handleDeleteQty = async (qid) => {
    try {
      await axios.delete(`/sales/delete-quantity?id=${qid}`);
      setQuantities((old) => old.filter((q) => q.id !== qid));
      toast.success("Quantity removed");
    } catch {
      toast.error("Failed to remove quantity");
    }
  };

  const handleDeleteParam = async (pid) => {
    try {
      await axios.delete(`/sales/delete-package-parameter/${pid}`);
      setPackageParams((old) => old.filter((p) => p.id !== pid));
      toast.success("Parameter removed");
    } catch {
      toast.error("Failed to remove parameter");
    }
  };

  const handleSubmit = async () => {
    if (!form.package) {
      toast.error("Package name is required");
      return;
    }
    if (!form.product) {
      toast.error("Please select a product");
      return;
    }
    setSubmitting(true);
    try {
      const payload = isClone
        ? {
          package: form.package,
          type: Number(form.type),
          special: Number(form.special),
          nabl: Number(form.nabl),
          description: form.description,
          product: Number(form.product),
          category: Number(form.category),
          standard: Number(form.standard),
          rate: Number(form.rate),
          currency: Number(form.currency),
          days: Number(form.days),
        }
        : {
          id: Number(id),
          package: form.package,
          type: Number(form.type),
          special: Number(form.special),
          nabl: Number(form.nabl),
          description: form.description,
          product: Number(form.product),
          category: Number(form.category),
          standard: Number(form.standard),
          rate: Number(form.rate),
          currency: Number(form.currency),
          days: Number(form.days),
        };
      const res = await axios.post(
        isClone ? "/sales/add-test-package" : "/sales/update-test-package",
        payload,
      );
      if (
        res.data.success === true ||
        res.data.status === true ||
        res.data.status === "true"
      ) {
        toast.success(
          isClone ? "Test price cloned ✅" : "Test package updated ✅",
        );
        navigate("/dashboards/sales/test-packages");
      } else {
        toast.error(res.data.message ?? "Failed to update");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (dataLoading || dropdownLoading || !form) {
    return (
      <Page title={isClone ? "Clone Test Price" : "Update Test Price"}>
        <div className="flex h-[60vh] items-center justify-center text-gray-600">
          <svg
            className="mr-2 h-6 w-6 animate-spin text-blue-600"
            viewBox="0 0 24 24"
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
          Loading...
        </div>
      </Page>
    );
  }

  return (
    <Page title={isClone ? "Clone Test Price" : "Update Test Price"}>
      <div className="transition-content px-[var(--margin-x)] pb-8">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="dark:text-dark-50 text-xl font-semibold text-gray-800">
            Update Test Price
          </h2>
          <button
            onClick={() => navigate("/dashboards/sales/test-packages")}
            className="dark:border-dark-500 dark:text-dark-300 dark:hover:bg-dark-700 rounded border border-gray-300 px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
          >
            ← Back to Price List
          </button>
        </div>

        <Card className="p-6">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <FormRow label="Test Package Name" required>
                <input
                  type="text"
                  value={form.package}
                  onChange={(e) => set("package", e.target.value)}
                  placeholder="Test Package"
                  className={inputCls}
                />
              </FormRow>
            </div>
            <FormRow label="Package Type">
              <Select
                options={[
                  { value: 1, label: "Perform All Tests" },
                  { value: 0, label: "Upload Report Directly" },
                ]}
                value={
                  [
                    { value: 1, label: "Perform All Tests" },
                    { value: 0, label: "Upload Report Directly" },
                  ].find((o) => String(o.value) === String(form.type)) || null
                }
                onChange={(opt) => set("type", opt ? opt.value : "")}
                placeholder="Select Type..."
              />
            </FormRow>
            <FormRow label="Covered Under Accreditation?">
              <Select
                options={NABL_OPTIONS}
                value={NABL_OPTIONS.find((o) => String(o.value) === String(form.nabl)) || null}
                onChange={(opt) => set("nabl", opt ? opt.value : "")}
                placeholder="Select Status..."
              />
            </FormRow>
            <div className="sm:col-span-2">
              <FormRow label="Description">
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder="Description"
                  className={`${inputCls} resize-none`}
                />
              </FormRow>
            </div>
            <FormRow label="Product Name" required>
              <Select
                options={products.map((p) => ({
                  value: p.id,
                  label: p.name + (p.description ? ` (${p.description})` : ""),
                }))}
                value={
                  products
                    .map((p) => ({
                      value: p.id,
                      label: p.name + (p.description ? ` (${p.description})` : ""),
                    }))
                    .find((o) => String(o.value) === String(form.product)) || null
                }
                onChange={(opt) => set("product", opt ? opt.value : "")}
                isSearchable
                placeholder="Select Product..."
              />
            </FormRow>
            <FormRow label="Special Package">
              <Select
                options={[
                  { value: 1, label: "Yes" },
                  { value: 0, label: "No" },
                ]}
                value={
                  [
                    { value: 1, label: "Yes" },
                    { value: 0, label: "No" },
                  ].find((o) => String(o.value) === String(form.special)) || null
                }
                onChange={(opt) => set("special", opt ? opt.value : "")}
                placeholder="Select..."
              />
            </FormRow>
            <FormRow label="It Is BIS Price">
              <Select
                options={[
                  { value: 1, label: "Yes, BIS" },
                  { value: 0, label: "No, General" },
                ]}
                value={
                  [
                    { value: 1, label: "Yes, BIS" },
                    { value: 0, label: "No, General" },
                  ].find((o) => String(o.value) === String(form.category)) || null
                }
                onChange={(opt) => set("category", opt ? opt.value : "")}
                placeholder="Select Category..."
              />
            </FormRow>
            <FormRow label="Standards">
              <Select
                options={standards.map((s) => ({
                  value: s.id,
                  label: s.name + (s.description ? ` (${s.description})` : ""),
                }))}
                value={
                  standards
                    .map((s) => ({
                      value: s.id,
                      label: s.name + (s.description ? ` (${s.description})` : ""),
                    }))
                    .find((o) => String(o.value) === String(form.standard)) || null
                }
                onChange={(opt) => set("standard", opt ? opt.value : "")}
                isSearchable
                placeholder="Select Standard..."
              />
            </FormRow>
            <FormRow label="Rate">
              <input
                type="number"
                value={form.rate}
                onChange={(e) => set("rate", e.target.value)}
                placeholder="Rate"
                className={inputCls}
              />
            </FormRow>
            <FormRow label="Currency">
              <Select
                options={currencies.map((c) => ({
                  value: c.id,
                  label: c.name + (c.description ? ` (${c.description})` : ""),
                }))}
                value={
                  currencies
                    .map((c) => ({
                      value: c.id,
                      label: c.name + (c.description ? ` (${c.description})` : ""),
                    }))
                    .find((o) => String(o.value) === String(form.currency)) || null
                }
                onChange={(opt) => set("currency", opt ? opt.value : "")}
                isSearchable
                placeholder="Select Currency..."
              />
            </FormRow>
            <FormRow label="No. Of Days Required">
              <input
                type="number"
                value={form.days}
                onChange={(e) => set("days", e.target.value)}
                placeholder="No. Of Days"
                className={inputCls}
              />
            </FormRow>
          </div>

          {/* ── Quantity Section ── */}
          <div className="dark:border-dark-500 mt-6 rounded-lg border border-gray-200 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="dark:text-dark-200 text-sm font-semibold text-gray-700">
                Parameters
              </h4>
              <button
                onClick={() => setShowParamModal(true)}
                className="rounded bg-blue-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-600"
              >
                + Add New Parameter
              </button>
            </div>
            {packageParams.length > 0 ? (
              <div className="space-y-2">
                {packageParams.map((p) => (
                  <div
                    key={p.id}
                    className="dark:bg-dark-700 flex items-center gap-3 rounded-md bg-gray-50 px-3 py-2 text-sm"
                  >
                    <span className="dark:text-dark-100 flex-1 font-medium text-gray-800">
                      {p.name} {p.description ? `(${p.description})` : ""}
                    </span>
                    <span className="dark:text-dark-300 text-gray-600">
                      Priority: {p.priority}
                    </span>
                    <span className="dark:text-dark-400 text-gray-500">
                      Visible: {p.visible_name ?? (p.visible == 1 ? "Yes" : "No")}
                    </span>
                    <button
                      onClick={() => handleDeleteParam(p.id)}
                      className="rounded bg-red-500 px-2 py-0.5 text-xs text-white hover:bg-red-600"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="dark:text-dark-500 text-xs text-gray-400">
                No parameters added yet.
              </p>
            )}
          </div>

          {/* ── Submit ── */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="rounded-md bg-green-600 px-8 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting
                ? isClone
                  ? "Cloning…"
                  : "Updating…"
                : isClone
                  ? "Save as Clone"
                  : "Update Test Price"}
            </button>
          </div>
        </Card>
      </div>

      {/* Modals */}
      {showQtyModal && (
        <QuantityModal
          packageId={recordId}
          onClose={() => setShowQtyModal(false)}
          onAdded={loadQuantities}
        />
      )}
      {showParamModal && (
        <ParameterModal
          packageId={recordId}
          onClose={() => setShowParamModal(false)}
          onAdded={loadParameters}
        />
      )}
    </Page>
  );
}
