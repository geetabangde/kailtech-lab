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
function ParameterModal({ onClose, onAdded }) {
  const [labs, setLabs] = useState([]);
  const [selectedLabId, setSelectedLabId] = useState("");
  const [labsLoading, setLabsLoading] = useState(true);

  const [schedulesLoading, setSchedulesLoading] = useState(false);
  const [requiredSchedules, setRequiredSchedules] = useState([]);
  const [fieldValues, setFieldValues] = useState({});

  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLabsLoading(true);
        const res = await axios.get("/master/list-lab");
        const list = res.data.data ?? [];
        const envLabs = list.filter((l) => l.recordEnviornment === "Yes");
        setLabs(envLabs);
        if (envLabs[0]) setSelectedLabId(String(envLabs[0].id));
      } catch (err) {
        console.error(err);
        toast.error("Failed to load labs");
      } finally {
        setLabsLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!selectedLabId) return;

    const load = async () => {
      try {
        setSchedulesLoading(true);
        setRequiredSchedules([]);
        setFieldValues({});

        const schedRes = await axios.get(
          `/master/get-environmental-schedule/${selectedLabId}`,
        );
        const schedules = schedRes.data.data ?? [];

        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const recRes = await axios.get(
          `/master/get-enviornmental-record?labid=${selectedLabId}&year=${year}&month=${month}`,
        );
        const existingRecs = recRes.data.data ?? [];

        const required = schedules.filter((s) => isRequired(s, existingRecs));
        setRequiredSchedules(required);

        const init = {};
        required.forEach((s) => {
          init[s.id] =
            s.type === "Temperature Rh"
              ? { temperature: "", humidity: "" }
              : { value: "" };
        });
        setFieldValues(init);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load schedules");
      } finally {
        setSchedulesLoading(false);
      }
    };
    load();
  }, [selectedLabId]);

  const handleChange = (scheduleId, field, val) => {
    setFieldValues((prev) => ({
      ...prev,
      [scheduleId]: { ...prev[scheduleId], [field]: val },
    }));
  };

  const validate = () => {
    for (const s of requiredSchedules) {
      const v = fieldValues[s.id];
      if (s.type === "Temperature Rh") {
        if (!v?.temperature?.trim() || !v?.humidity?.trim()) {
          toast.error("Please fill both Temperature and Humidity");
          return false;
        }
      } else {
        if (!v?.value?.trim()) {
          toast.error(`Please fill value for "${s.type}"`);
          return false;
        }
      }
    }
    return true;
  };

  const handleAdd = async () => {
    if (!selectedLabId) {
      toast.error("Please select a lab");
      return;
    }
    if (!validate()) return;

    const type = [];
    const typeid = [];
    const subtype = [];
    const value = [];

    requiredSchedules.forEach((s) => {
      const v = fieldValues[s.id];
      if (s.type === "Temperature Rh") {
        type.push(s.type);
        typeid.push(s.id);
        subtype.push("Temperature");
        value.push(v.temperature);
        type.push(s.type);
        typeid.push(s.id);
        subtype.push("Humidity");
        value.push(v.humidity);
      } else {
        type.push(s.type);
        typeid.push(s.id);
        subtype.push(s.type);
        value.push(v.value);
      }
    });

    setAdding(true);
    try {
      const res = await axios.post("/sales/add-environmental-record", {
        labid: Number(selectedLabId),
        type,
        typeid,
        subtype,
        value,
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
      <div className="dark:bg-dark-800 flex max-h-[90vh] w-full max-w-md flex-col rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="dark:border-dark-500 flex shrink-0 items-center justify-between border-b border-gray-200 px-5 py-4">
          <div>
            <h3 className="dark:text-dark-50 text-base font-semibold text-gray-800">
              Add New Parameter
            </h3>
            <p className="dark:text-dark-400 mt-0.5 text-xs text-gray-400">
              Only pending / due entries are shown
            </p>
          </div>
          <button
            onClick={onClose}
            className="dark:hover:text-dark-200 text-lg leading-none text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="mb-4">
            <label className="dark:text-dark-300 mb-1 block text-sm font-medium text-gray-600">
              Select Lab
            </label>
            {labsLoading ? (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <svg
                  className="h-4 w-4 animate-spin text-blue-500"
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
                Loading labs…
              </div>
            ) : (
              <Select
                options={labs.map((lab) => ({ value: lab.id, label: lab.name }))}
                value={
                  labs
                    .map((lab) => ({ value: lab.id, label: lab.name }))
                    .find((o) => String(o.value) === String(selectedLabId)) || null
                }
                onChange={(opt) => setSelectedLabId(opt ? String(opt.value) : "")}
                placeholder="Select Lab..."
                isSearchable
              />
            )}
          </div>

          {schedulesLoading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-gray-500">
              <svg
                className="h-5 w-5 animate-spin text-blue-500"
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
              Loading schedules…
            </div>
          ) : requiredSchedules.length === 0 && !labsLoading ? (
            <div className="flex flex-col items-center justify-center gap-2 py-8">
              <span className="text-3xl">✅</span>
              <p className="dark:text-dark-300 text-sm font-medium text-gray-600">
                All environmental records are up to date!
              </p>
              <p className="dark:text-dark-500 text-xs text-gray-400">
                No pending entries for this period.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {requiredSchedules.map((s) => {
                const v = fieldValues[s.id] ?? {};

                if (s.type === "Temperature Rh") {
                  return (
                    <div key={s.id} className="space-y-2">
                      <div className="dark:border-dark-500 dark:bg-dark-700 flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                        <div className="w-32 shrink-0">
                          <p className="dark:text-dark-400 text-xs font-semibold tracking-wide text-gray-500 uppercase">
                            Temperature
                          </p>
                          <p className="mt-0.5 text-[11px] text-gray-400">
                            {s.frequency}
                          </p>
                        </div>
                        <input
                          type="text"
                          required
                          placeholder="Enter value"
                          value={v.temperature ?? ""}
                          onChange={(e) =>
                            handleChange(s.id, "temperature", e.target.value)
                          }
                          className={inputCls}
                        />
                      </div>
                      <div className="dark:border-dark-500 dark:bg-dark-700 flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                        <div className="w-32 shrink-0">
                          <p className="dark:text-dark-400 text-xs font-semibold tracking-wide text-gray-500 uppercase">
                            Humidity
                          </p>
                          <p className="mt-0.5 text-[11px] text-gray-400">
                            {s.frequency}
                          </p>
                        </div>
                        <input
                          type="text"
                          required
                          placeholder="Enter value"
                          value={v.humidity ?? ""}
                          onChange={(e) =>
                            handleChange(s.id, "humidity", e.target.value)
                          }
                          className={inputCls}
                        />
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={s.id}
                    className="dark:border-dark-500 dark:bg-dark-700 flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3"
                  >
                    <div className="w-32 shrink-0">
                      <p className="dark:text-dark-400 text-xs font-semibold tracking-wide text-gray-500 uppercase">
                        {s.type}
                      </p>
                      <p className="mt-0.5 text-[11px] text-gray-400">
                        {s.frequency}
                      </p>
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="Enter value"
                      value={v.value ?? ""}
                      onChange={(e) =>
                        handleChange(s.id, "value", e.target.value)
                      }
                      className={inputCls}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="dark:border-dark-500 flex shrink-0 items-center justify-end gap-2 border-t border-gray-200 px-5 py-4">
          <button
            onClick={onClose}
            className="dark:border-dark-500 dark:text-dark-300 rounded-md border border-gray-300 px-5 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            Close
          </button>
          {requiredSchedules.length > 0 && (
            <button
              onClick={handleAdd}
              disabled={adding}
              className="bg-primary-600 hover:bg-primary-700 rounded-md px-5 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {adding ? "Adding…" : "Add Parameter"}
            </button>
          )}
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

  const {
    products,
    standards,
    currencies,
    loading: dropdownLoading,
  } = useTestPackageDropdowns();

  const [form, setForm] = useState(null);
  const [quantities, setQuantities] = useState([]);
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

  useEffect(() => {
    const load = async () => {
      try {
        setDataLoading(true);
        const [pRes] = await Promise.all([
          axios.get(`/sales/get-test-package-byid/${recordId}`),
          loadQuantities(),
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
  }, [id, navigate, loadQuantities]);

  const handleDeleteQty = async (qid) => {
    try {
      await axios.delete(`/sales/delete-quantity?id=${qid}`);
      setQuantities((old) => old.filter((q) => q.id !== qid));
      toast.success("Quantity removed");
    } catch {
      toast.error("Failed to remove quantity");
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
                Quantity
              </h4>
              <button
                onClick={() => setShowQtyModal(true)}
                className="rounded bg-blue-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-600"
              >
                + Add New Quantity
              </button>
            </div>
            
            {/* Test Statistics - PHP style */}
            {quantities.length > 0 && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <h5 className="text-sm font-semibold text-gray-700 mb-3">Test Statistics</h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{quantities.filter(q => q.status === 1).length}</div>
                    <div className="text-gray-600">Tests Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{quantities.filter(q => q.status === 0).length}</div>
                    <div className="text-gray-600">Tests Pending Completion</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {Math.max(0, quantities.filter(q => q.status === 1).length + quantities.filter(q => q.status === 0).length - 
                        (quantities.filter(q => q.status !== null && q.status !== 0 && q.status !== 1).length || 0)
                      )}
                    </div>
                    <div className="text-gray-600">Tests Pending Assignment</div>
                  </div>
                </div>
              </div>
            )}
            {quantities.length > 0 ? (
              <div className="space-y-2">
                {quantities.map((q) => (
                  <div
                    key={q.id}
                    className="dark:bg-dark-700 flex items-center gap-3 rounded-md bg-gray-50 px-3 py-2 text-sm"
                  >
                    <span className="dark:text-dark-100 flex-1 font-medium text-gray-800">
                      {q.name}
                    </span>
                    <span className="dark:text-dark-300 text-gray-600">
                      {q.quantity}
                    </span>
                    <span className="dark:text-dark-400 text-gray-500">
                      {q.unit_name ?? q.unit}
                    </span>
                    <button
                      onClick={() => handleDeleteQty(q.id)}
                      className="rounded bg-red-500 px-2 py-0.5 text-xs text-white hover:bg-red-600"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="dark:text-dark-500 text-xs text-gray-400">
                No quantities added yet.
              </p>
            )}
          </div>

          {/* ── Parameters Section ── */}
          <div className="dark:border-dark-500 mt-4 rounded-lg border border-gray-200 p-4">
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
          onAdded={() => { }}
        />
      )}
    </Page>
  );
}
