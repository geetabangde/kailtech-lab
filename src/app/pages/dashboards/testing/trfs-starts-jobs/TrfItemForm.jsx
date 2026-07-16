import { useState, useEffect, useCallback, useRef } from "react";
import axios from "utils/axios";
import Select from "react-select";

// ─── Constants ────────────────────────────────────────────────────────────────
const SEALED_OPTIONS = [
  { value: 0, label: "Unsealed" },
  { value: 1, label: "Sealed" },
  { value: 2, label: "Packed" },
  { value: 3, label: "NA" },
];

// testprices.nabl: 1=NABL, 3=QAI, 2=NO
const PACKAGE_TYPE_OPTIONS = [
  { value: "", label: "Select Type" },
  { value: "1", label: "NABL" },
  { value: "3", label: "QAI" },
  { value: "2", label: "NO" },
];

const INITIAL_FORM = {
  product: "",
  brand: "",
  qrcode: "",
  testrequest: "",
  grade: "",
  size: "",
  package: "",
  package_type: "",
  isok: "",
  sealed: 0,
  disposable: "",
  condition: "",
  specification: "",
  conformity: "",
  unitcost: 0,
  total: 0,
};

// ─── Shared class strings ─────────────────────────────────────────────────────
const inputCls =
  "w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm " +
  "text-gray-800 dark:text-white bg-white dark:bg-gray-800 outline-none " +
  "focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 transition placeholder-gray-400";

const inputErrCls =
  "w-full border border-red-400 dark:border-red-500 rounded-lg px-3 py-2.5 text-sm " +
  "text-gray-800 dark:text-white bg-white dark:bg-gray-800 outline-none " +
  "focus:border-red-500 focus:ring-2 focus:ring-red-100 transition placeholder-gray-400";

const selectCls =
  "w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm " +
  "text-gray-800 dark:text-white bg-white dark:bg-gray-800 outline-none " +
  "focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 transition cursor-pointer";

const selectErrCls =
  "w-full border border-red-400 dark:border-red-500 rounded-lg px-3 py-2.5 text-sm " +
  "text-gray-800 dark:text-white bg-white dark:bg-gray-800 outline-none " +
  "focus:border-red-500 focus:ring-2 focus:ring-red-100 transition cursor-pointer";

const labelCls = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5";
const errCls = "text-red-500 text-xs mt-1";

const iCls = (err) => (err ? inputErrCls : inputCls);
const sCls = (err) => (err ? selectErrCls : selectCls);

// ─── Helper ───────────────────────────────────────────────────────────────────
function toArray(responseData, ...keys) {
  for (const k of keys) {
    if (Array.isArray(responseData?.[k])) return responseData[k];
  }
  if (Array.isArray(responseData?.data)) return responseData.data;
  if (Array.isArray(responseData)) return responseData;
  return [];
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
function Spinner({ className = "h-4 w-4" }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z" />
    </svg>
  );
}

/**
 * Props:
 *   trfId    — TRF ID (required)
 *   itemId   — null = Add New | number = Edit existing
 *   cloneId  — number = Clone from this trfProduct id (submit as NEW item)
 *   onSuccess — called after successful submit
 *   onCancel  — called when user cancels
 *
 * Priority: cloneId > itemId
 *   - cloneId provided → pre-fill from clone source, submit as new
 *   - itemId provided  → edit existing item
 *   - neither          → blank add-new form
 */
export default function TrfItemForm({ trfId, itemId, cloneId, onSuccess, onCancel }) {
  // ── Mode detection ────────────────────────────────────────────────────────
  const isClone = !!cloneId;
  const isEdit = !isClone && !!itemId;
  const isNew = !isClone && !itemId;

  // ─── Static dropdowns ────────────────────────────────────────────────────
  const [products, setProducts] = useState([]);
  const [choices, setChoices] = useState([]);
  const [disposables, setDisposables] = useState([]);
  const [conditions, setConditions] = useState([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(true);

  // ─── Product-specific ────────────────────────────────────────────────────
  const [grades, setGrades] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [loadingGradeSize, setLoadingGradeSize] = useState(false);

  // ─── Package list ─────────────────────────────────────────────────────────
  const [packages, setPackages] = useState([]);
  const [loadingPackages, setLoadingPackages] = useState(false);

  // ─── Package details ──────────────────────────────────────────────────────
  const [quantities, setQuantities] = useState([]);
  const [received, setReceived] = useState([]);
  const [parameters, setParameters] = useState([]);
  const [selectedParams, setSelectedParams] = useState([]);
  const [isSpecial, setIsSpecial] = useState(false);
  const [loadingPkgDetails, setLoadingPkgDetails] = useState(false);

  // ─── Form state ───────────────────────────────────────────────────────────
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // ─── Refs ─────────────────────────────────────────────────────────────────
  const prevProduct = useRef(null);
  const prevProductForPkg = useRef(null);
  const prevPkgType = useRef(null);
  const prevPkg = useRef(null);
  // Track if we just pre-filled from item/clone (so cascades don't reset values)
  const prefillDone = useRef(false);

  const clearPkgDetails = () => {
    setQuantities([]); setReceived([]);
    setParameters([]); setSelectedParams([]);
    setIsSpecial(false);
  };

  // ── Helper: set form from item data + mark refs so cascades skip reset ────
  const applyItemData = (item) => {
    const pid = String(item.product ?? "");
    const type = String(item.package_type ?? "");
    const pkg = String(item.package ?? "");

    // Pre-set refs so effect cascades know these are already loaded
    prevProduct.current = pid;
    prevProductForPkg.current = pid;
    prevPkgType.current = type;
    prevPkg.current = pkg;
    prefillDone.current = true;

    setForm({
      product: pid,
      brand: item.brand ?? "",
      qrcode: item.qrcode ?? "",
      testrequest: item.testrequest ?? "",
      grade: String(item.grade ?? ""),
      size: String(item.size ?? ""),
      package: pkg,
      package_type: type,
      isok: String(item.isok ?? ""),
      sealed: item.sealed ?? 0,
      disposable: String(item.disposable ?? ""),
      condition: String(item.condition ?? ""),
      specification: String(item.specification ?? ""),
      conformity: String(item.conformity ?? ""),
      unitcost: item.unitcost ?? 0,
      total: item.total ?? 0,
    });
  };

  // ── 1. Static dropdowns ───────────────────────────────────────────────────
  const fetchDropdowns = useCallback(async () => {
    if (isClone) return; // clone API khud sab deta hai
    setLoadingDropdowns(true);
    try {
      const [prodRes, choiceRes, dispRes, condRes] = await Promise.all([
        axios.get("/testing/get-prodcut-list"),
        axios.get("/get-choices"),
        axios.get("/testing/get-disposables-list"),
        axios.get("/testing/get-conditions-list"),
      ]);
      setProducts(toArray(prodRes.data, "products"));
      setChoices(toArray(choiceRes.data, "choices"));
      setDisposables(toArray(dispRes.data, "disposables"));
      setConditions(toArray(condRes.data, "conditions"));
    } catch {
      setSubmitError("Failed to load form options. Please refresh.");
    } finally {
      setLoadingDropdowns(false);
    }
  }, [isClone]);

  // ── 2. Load item data (edit OR clone) ─────────────────────────────────────
  const fetchItemData = useCallback(async () => {

    // ── CLONE MODE ────────────────────────────────────────────────────────
    // ✅ Correct endpoint: GET /testing/trf-item-clone/:cloneId
    // ✅ Response key: res.data.trf_product (NOT item/data)
    // ✅ package_type: packages[].nabl se derive karo (trf_product mein nahi hota)
    // ✅ Sab dropdowns ek hi response se: products, grades, sizes, packages,
    //    quantities, parameters, special, price, choices, disposables, conditions
    if (isClone) {
      setLoadingDropdowns(true);
      try {
        const res = await axios.get(`/testing/trf-item-clone/${cloneId}`);
        const d = res.data?.data ?? res.data ?? {};

        // Sab dropdowns populate karo ek hi response se
        setProducts(toArray(d, "products"));
        setChoices(toArray(d, "choices"));
        setDisposables(toArray(d, "disposables"));
        setConditions(toArray(d, "conditions"));
        setGrades(toArray(d, "grades"));
        setSizes(toArray(d, "sizes"));
        setPackages(toArray(d, "packages"));
        setParameters(toArray(d, "parameters"));
        
        const clonedItem = d.trf_product ?? {};
        const clonePkgId = String(clonedItem.package ?? "");
        if (clonePkgId && clonePkgId !== "undefined") {
          try {
            const qtyRes = await axios.get(`/testing/get-package-quantities?id=${clonePkgId}`);
            const qtys = toArray(qtyRes.data, "data");
            if (qtys.length > 0) {
              setQuantities(qtys);
              setReceived(qtys.map(() => ""));
            } else {
              setQuantities(toArray(d, "quantities"));
              setReceived(toArray(d, "quantities").map(() => ""));
            }
          } catch {
            setQuantities(toArray(d, "quantities"));
            setReceived(toArray(d, "quantities").map(() => ""));
          }
        } else {
          setQuantities(toArray(d, "quantities"));
          setReceived(toArray(d, "quantities").map(() => ""));
        }

        const special = d.special ?? false;
        setIsSpecial(!!special);
        setSelectedParams(toArray(d, "parameters").filter((p) => p.selected).map((p) => p.id));

        // trf_product se form fill
        const item = d.trf_product ?? {};

        // package_type trf_product mein nahi hota —
        // packages array se package ka nabl field = package_type value
        // nabl: 1=NABL, 3=QAI, 2=NO  (same as PACKAGE_TYPE_OPTIONS)
        const pkgList = toArray(d, "packages");
        const matchedPkg = pkgList.find((p) => String(p.id) === String(item.package));
        const derivedPkgType = matchedPkg ? String(matchedPkg.nabl ?? "") : "";

        const price = d.price ?? item.unitcost ?? 0;

        applyItemData({
          ...item,
          package_type: derivedPkgType,
          unitcost: price,
          total: price,
        });

      } catch {
        setSubmitError("Failed to load clone source. Please try again.");
      } finally {
        setLoadingDropdowns(false);
      }
      return;
    }

    // ── EDIT MODE ─────────────────────────────────────────────────────────
    if (isEdit) {
      try {
        const res = await axios.get(`/testing/get-trf-item/${itemId}`);
        const item = res.data?.item ?? res.data?.data ?? res.data ?? {};
        applyItemData(item);
      } catch {
        setSubmitError("Failed to load item details.");
      }
    }
  }, [isClone, cloneId, isEdit, itemId]);

  useEffect(() => {
    fetchDropdowns();
    fetchItemData();
  }, [fetchDropdowns, fetchItemData]);

  // ── 3. Default first options (only for blank add-new) ────────────────────
  useEffect(() => {
    if (!loadingDropdowns && isNew) {
      const defaultCondition = conditions.find(c => c.name?.toLowerCase() === "satisfactory") || conditions[0];
      
      setForm((prev) => ({
        ...prev,
        isok: prev.isok || String(choices[0]?.id ?? ""),
        disposable: prev.disposable || String(disposables[0]?.id ?? ""),
        condition: prev.condition || String(defaultCondition?.id ?? ""),
        specification: prev.specification || String(choices[0]?.id ?? ""),
        conformity: prev.conformity || String(choices[0]?.id ?? ""),
      }));
    }
  }, [loadingDropdowns, isNew, choices, disposables, conditions]);

  // ── 4. Product → grades + sizes ───────────────────────────────────────────
  useEffect(() => {
    const pid = form.product;
    if (!pid) return;

    const isUserChange = pid !== prevProduct.current;

    // User changed product → reset downstream
    if (isUserChange) {
      setGrades([]); setSizes([]); setPackages([]);
      setForm((prev) => ({ ...prev, grade: "", size: "", package: "", package_type: "", unitcost: 0, total: 0 }));
      clearPkgDetails();
      prevProduct.current = pid;
    }

    const load = async () => {
      setLoadingGradeSize(true);
      try {
        const res = await axios.get(`/testing/get-grade-and-size?pid=${pid}`);
        setGrades(toArray(res.data, "grades"));
        setSizes(toArray(res.data, "sizes"));
      } catch { /* silent */ }
      finally { setLoadingGradeSize(false); }
    };
    load();
  }, [form.product]);

  // ── 5. Product + package_type → package list ──────────────────────────────
  useEffect(() => {
    const pid = form.product;
    const type = form.package_type;

    if (!pid || !type) {
      if (prevPkgType.current && !type) {
        setPackages([]);
        setForm((prev) => ({ ...prev, package: "", unitcost: 0, total: 0 }));
        clearPkgDetails();
      }
      prevPkgType.current = type;
      return;
    }

    // Skip on initial pre-fill (refs already match)
    if (pid === prevProductForPkg.current && type === prevPkgType.current) return;

    // User-driven change → reset package
    if (!prefillDone.current) {
      setForm((prev) => ({ ...prev, package: "", unitcost: 0, total: 0 }));
      clearPkgDetails();
    }
    prefillDone.current = false;
    prevProductForPkg.current = pid;
    prevPkgType.current = type;

    const load = async () => {
      setLoadingPackages(true);
      try {
        const res = await axios.get(`/testing/get-package-list?pid=${pid}&type=${type}`);
        setPackages(toArray(res.data, "data"));
      } catch { /* silent */ }
      finally { setLoadingPackages(false); }
    };
    load();
  }, [form.product, form.package_type]);

  // ── 6. Package → quantities, price, parameters ───────────────────────────
  useEffect(() => {
    const pkgId = form.package;
    if (!pkgId || pkgId === prevPkg.current) return;
    prevPkg.current = pkgId;

    const cached = packages.find((p) => String(p.id) === String(pkgId));
    if (cached?.rate !== undefined)
      setForm((prev) => ({ ...prev, unitcost: cached.rate, total: cached.rate }));

    const load = async () => {
      setLoadingPkgDetails(true);
      try {
        const [qtyRes, priceRes, paramRes] = await Promise.all([
          axios.get(`/testing/get-package-quantities?id=${pkgId}`),
          axios.get(`/testing/get-package-price?package_id=${pkgId}&trfid=${trfId}`),
          axios.get(`/testing/package-parameters/${pkgId}`),
        ]);
        const qtys = toArray(qtyRes.data, "data");
        const priceData = priceRes.data?.data ?? {};
        const price = priceData.unitcost ?? cached?.rate ?? 0;
        const total = priceData.total ?? price;
        const params = toArray(paramRes.data, "parameters");
        const special = paramRes.data?.special ?? false;
        setQuantities(qtys);
        setReceived(qtys.map(() => ""));
        setForm((prev) => ({ ...prev, unitcost: price, total }));
        setParameters(params);
        setIsSpecial(!!special);
        setSelectedParams(special ? params.map((p) => p.id) : []);
      } catch { /* silent */ }
      finally { setLoadingPkgDetails(false); }
    };
    load();
  }, [form.package, packages, trfId]);



  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };
  const handleReceivedChange = (index, value) =>
    setReceived((prev) => { const n = [...prev]; n[index] = value; return n; });
  const handleSelectAllParams = (checked) =>
    setSelectedParams(checked ? parameters.map((p) => p.id) : []);
  const handleParamToggle = (paramId) =>
    setSelectedParams((prev) =>
      prev.includes(paramId) ? prev.filter((id) => id !== paramId) : [...prev, paramId]
    );

  // ── Validation ────────────────────────────────────────────────────────────
  const validate = () => {
    const required = [
      "product",
      "brand",
      "qrcode",
      "testrequest",
      "grade",
      "size",
      "package",
      "isok",
      "disposable",
      "condition",
      "specification",
      "conformity",
    ];
    const errs = {};
    required.forEach((f) => { if (!form[f] && form[f] !== 0) errs[f] = "This is a required field"; });

    // Validate received quantities - at least one must be > 0
    const totalReceived = received.reduce((sum, v) => sum + (Number(v) || 0), 0);
    if (quantities.length > 0 && totalReceived === 0) {
      errs.received = "At least one received quantity must be greater than 0";
    }

    return errs;
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  // Clone & New both → POST /testing/add-trf-item
  // Edit             → PUT  /testing/update-trf-item/:itemId  (ya jo bhi edit endpoint ho)
  const handleSubmit = async () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length) { setErrors(validationErrors); return; }
    setSubmitting(true); setSubmitError(null);
    try {
      const payload = {
        product: Number(form.product),
        brand: form.brand,
        qrcode: form.qrcode,
        testrequest: form.testrequest,
        package_type: Number(form.package_type),
        grade: Number(form.grade),
        size: Number(form.size),
        package: Number(form.package),
        isok: Number(form.isok),
        sealed: Number(form.sealed),
        disposable: Number(form.disposable),
        condition: Number(form.condition),
        specification: Number(form.specification),
        conformity: Number(form.conformity),
        unitcost: Number(form.unitcost),
        total: Number(form.total),
        quantities: quantities.map((q) => q.id),
        received: received.map((r) => Number(r) || 0),
        id: Number(trfId),
        ...(isSpecial && selectedParams.length ? { parameters: selectedParams } : {}),

      };

      let res;
      if (isEdit) {
        // Edit existing item
        res = await axios.post(`/testing/add-trf-item`, { ...payload, trfproduct_id: Number(itemId) });
      } else {
        // Add new (fresh or cloned)
        res = await axios.post("/testing/add-trf-item", payload);
      }

      onSuccess?.(res.data);
    } catch (err) {
      const apiMsg = err?.response?.data?.message
        ?? err?.response?.data?.error
        ?? err?.response?.data?.msg
        ?? (typeof err?.response?.data === "string" ? err.response.data : null)
        ?? `Failed to save item. (Status: ${err?.response?.status ?? "network error"})`;
      setSubmitError(apiMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loadingDropdowns) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="text-center">
          <Spinner className="h-7 w-7 text-blue-600 mx-auto mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading form...</p>
        </div>
      </div>
    );
  }

  const allParamsSelected = parameters.length > 0 && selectedParams.length === parameters.length;

  // ── Title + banner logic ──────────────────────────────────────────────────
  const formTitle = isClone
    ? `Clone Item #${cloneId}`
    : isEdit
      ? `Edit Item #${itemId}`
      : "Add New Item";

  const submitLabel = isClone
    ? "Clone & Add Item"
    : isEdit
      ? "Save Changes"
      : "Add Item";

  return (
    <div className="space-y-5 text-sm">

      {/* Title */}
      <h3 className="text-base font-semibold text-gray-800 dark:text-white">
        {formTitle}
      </h3>

      {/* Error banner */}
      {submitError && (
        <div className="flex items-start gap-2 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-400 rounded-lg px-3 py-2.5 text-sm">
          <span className="mt-0.5">⚠️</span>
          <span>{submitError}</span>
        </div>
      )}

      {/* ════ SECTION 1 — Product ════ */}
      <div>
        <label className={labelCls}>Product <span className="text-red-500">*</span></label>
        <Select
          options={products.map((p) => ({
            value: String(p.id),
            label: `${p.name}${p.description ? ` (${p.description})` : ""}`
          }))}
          value={products.map((p) => ({
            value: String(p.id),
            label: `${p.name}${p.description ? ` (${p.description})` : ""}`
          })).find(opt => opt.value === String(form.product)) || null}
          onChange={(selectedOption) => {
            const value = selectedOption ? selectedOption.value : "";
            setForm((prev) => ({ ...prev, product: value }));
            setErrors((prev) => ({ ...prev, product: "" }));
          }}
          placeholder="Search and select product..."
          isClearable
          isSearchable
          styles={{
            control: (base, state) => ({
              ...base,
              minHeight: "42px",
              borderColor: errors.product
                ? "#ef4444"
                : state.isFocused
                  ? "#3b82f6"
                  : "rgb(209 213 219)",
              boxShadow: errors.product
                ? "0 0 0 1px #ef4444"
                : state.isFocused
                  ? "0 0 0 2px rgb(59 130 246 / 0.5)"
                  : "none",
              "&:hover": { borderColor: errors.product ? "#ef4444" : "#3b82f6" },
              backgroundColor: "white",
              borderRadius: "0.5rem",
            }),
            menu: (base) => ({ ...base, borderRadius: "0.5rem", zIndex: 9999 }),
            menuPortal: (base) => ({ ...base, zIndex: 9999 }),
            placeholder: (base) => ({ ...base, color: "#9ca3af", fontSize: "0.875rem" }),
            singleValue: (base) => ({ ...base, fontSize: "0.875rem" }),
            option: (base, state) => ({
              ...base,
              fontSize: "0.875rem",
              backgroundColor: state.isSelected
                ? "#3b82f6"
                : state.isFocused
                  ? "#eff6ff"
                  : "white",
              color: state.isSelected ? "white" : "#374151",
              "&:active": { backgroundColor: "#bfdbfe" },
            }),
          }}
          menuPortalTarget={document.body}
        />
        {errors.product && <p className={errCls}>{errors.product}</p>}
      </div>

      {/* Brand / QR / Test Request */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className={labelCls}>Brand/Source <span className="text-red-500">*</span></label>
          <input name="brand" className={iCls(errors.brand)} value={form.brand} onChange={handleChange} placeholder="Brand/Source" />
          {errors.brand && <p className={errCls}>{errors.brand}</p>}
        </div>
        <div>
          <label className={labelCls}>QR Code <span className="text-red-500">*</span></label>
          <input name="qrcode" className={iCls(errors.qrcode)} value={form.qrcode} onChange={handleChange} placeholder="QR Code" />
          {errors.qrcode && <p className={errCls}>{errors.qrcode}</p>}
        </div>
        <div>
          <label className={labelCls}>Test Request <span className="text-red-500">*</span></label>
          <input name="testrequest" className={iCls(errors.testrequest)} value={form.testrequest} onChange={handleChange} placeholder="Test Request" />
          {errors.testrequest && <p className={errCls}>{errors.testrequest}</p>}
        </div>
      </div>

      <hr className="border-dashed border-gray-200 dark:border-gray-700" />

      {/* ════ SECTION 2 — Package Type → Grades/Sizes → Packages ════ */}
      {loadingGradeSize && (
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Spinner /> Loading grades and sizes…
        </div>
      )}

      {!loadingGradeSize && form.product && (
        <>
          {/* Package Type */}
          <div>
            <label className={labelCls}>Packages Type <span className="text-red-500">*</span></label>
            <select name="package_type" className={sCls(errors.package_type)} value={form.package_type} onChange={handleChange}>
              {PACKAGE_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            {errors.package_type && <p className={errCls}>{errors.package_type}</p>}
          </div>

          {/* Grades + Sizes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Grades <span className="text-red-500">*</span></label>
              <select name="grade" className={sCls(errors.grade)} value={form.grade} onChange={handleChange}>
                <option value="">Select Grade</option>
                {grades.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}{g.description ? ` — ${g.description}` : ""}</option>
                ))}
              </select>
              {errors.grade && <p className={errCls}>{errors.grade}</p>}
            </div>
            <div>
              <label className={labelCls}>Sizes <span className="text-red-500">*</span></label>
              <select name="size" className={sCls(errors.size)} value={form.size} onChange={handleChange}>
                <option value="">Select Size</option>
                {sizes.map((sz) => (
                  <option key={sz.id} value={sz.id}>{sz.name}{sz.description ? ` — ${sz.description}` : ""}</option>
                ))}
              </select>
              {errors.size && <p className={errCls}>{errors.size}</p>}
            </div>
          </div>

          {/* Packages */}
          <div>
            <label className={labelCls}>Packages <span className="text-red-500">*</span></label>
            {loadingPackages ? (
              <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
                <Spinner /> Loading packages…
              </div>
            ) : (
              <select
                name="package"
                className={sCls(errors.package)}
                value={form.package}
                onChange={handleChange}
                disabled={!form.package_type}
              >
                <option value="">
                  {!form.package_type
                    ? "Select a Package Type first"
                    : packages.length === 0
                      ? "No packages available for this type"
                      : "Select Package"}
                </option>
                {packages.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nabl == 1 ? "(NABL) " : p.nabl == 3 ? "(QAI) " : p.nabl == 2 ? "(NO) " : ""}
                    {p.package}
                  </option>
                ))}
              </select>
            )}
            {errors.package && <p className={errCls}>{errors.package}</p>}
          </div>
        </>
      )}

      <hr className="border-dashed border-gray-200 dark:border-gray-700" />

      {/* ════ SECTION 3 — isOk, Sealed, Disposable ════ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className={labelCls}>isOk <span className="text-red-500">*</span></label>
          <select name="isok" className={sCls(errors.isok)} value={form.isok} onChange={handleChange}>
            <option value="">Select</option>
            {choices.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {errors.isok && <p className={errCls}>{errors.isok}</p>}
        </div>
        <div>
          <label className={labelCls}>Sealed?</label>
          <select name="sealed" className={selectCls} value={form.sealed} onChange={handleChange}>
            {SEALED_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Disposable <span className="text-red-500">*</span></label>
          <select name="disposable" className={sCls(errors.disposable)} value={form.disposable} onChange={handleChange}>
            <option value="">Select</option>
            {disposables.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          {errors.disposable && <p className={errCls}>{errors.disposable}</p>}
        </div>
      </div>

      <hr className="border-dashed border-gray-200 dark:border-gray-700" />

      {/* ════ SECTION 4 — Condition, Specification, Conformity ════ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className={labelCls}>Condition <span className="text-red-500">*</span></label>
          <select name="condition" className={sCls(errors.condition)} value={form.condition} onChange={handleChange}>
            <option value="">Select</option>
            {conditions.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {errors.condition && <p className={errCls}>{errors.condition}</p>}
        </div>
        <div>
          <label className={labelCls}>Specification <span className="text-red-500">*</span></label>
          <select name="specification" className={sCls(errors.specification)} value={form.specification} onChange={handleChange}>
            <option value="">Select</option>
            {choices.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {errors.specification && <p className={errCls}>{errors.specification}</p>}
        </div>
        <div>
          <label className={labelCls}>Conformity <span className="text-red-500">*</span></label>
          <select name="conformity" className={sCls(errors.conformity)} value={form.conformity} onChange={handleChange}>
            <option value="">Select</option>
            {choices.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {errors.conformity && <p className={errCls}>{errors.conformity}</p>}
        </div>
      </div>

      {/* ════ SECTION 5 — Price ════ */}
      {!loadingPkgDetails && form.package && (
        <div className="flex items-center gap-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-4 py-3">
          <div>
            <p className="text-xs text-green-600 dark:text-green-400 font-medium uppercase tracking-wide mb-0.5">Unit Cost</p>
            <p className="text-xl font-bold text-green-700 dark:text-green-300">
              ₹ {Number(form.unitcost).toLocaleString("en-IN")}
            </p>
          </div>

          <input type="hidden" name="unitcost" value={form.unitcost} />
          <input type="hidden" name="total" value={form.total} />
        </div>
      )}

      {/* ════ SECTION 6 — Quantities ════ */}
      {loadingPkgDetails && (
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Spinner /> Loading package details…
        </div>
      )}

      {!loadingPkgDetails && quantities.length > 0 && (
        <div>
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div className="grid grid-cols-2 bg-gray-50 dark:bg-gray-800 px-4 py-2.5 border-b border-gray-200 dark:border-gray-700">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Required Quantity</span>
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Received Quantity <span className="text-red-500">*</span></span>
            </div>
            {quantities.map((qty, idx) => (
              <div key={qty.id} className="grid grid-cols-2 items-center px-4 py-2.5 border-b border-gray-100 dark:border-gray-800 last:border-b-0">
                <div>
                  <input type="hidden" name="quantities[]" value={qty.id} />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {qty.name}
                    {qty.quantity ? ` ${qty.quantity}` : ""}
                    {qty.unit_name ? ` ${qty.unit_name}` : ""}
                  </span>
                </div>
                <div>
                  <input
                    type="number"
                    min="0"
                    onWheel={(e) => e.target.blur()}
                    className={`[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none receivedquantities ${errors.received ? inputErrCls : inputCls}`}
                    value={received[idx] ?? ""}
                    onChange={(e) => {
                      handleReceivedChange(idx, e.target.value);
                      if (errors.received) {
                        setErrors((prev) => ({ ...prev, received: "" }));
                      }
                    }}
                    placeholder={`enter value in ${qty.unit_name || "units"}`}
                  />
                </div>
              </div>
            ))}
            <div className="grid grid-cols-2 items-center px-4 py-2.5 bg-gray-50 dark:bg-gray-800">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Total Quantity</span>
              <input
                type="number"
                readOnly
                className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2.5 text-sm bg-gray-100 dark:bg-gray-900 text-gray-500 dark:text-gray-400 outline-none cursor-default"
                value={received.reduce((sum, v) => sum + (Number(v) || 0), 0)}
              />
            </div>
          </div>
          {errors.received && <p className={errCls}>{errors.received}</p>}
        </div>
      )}

      {/* ════ SECTION 7 — Parameters ════ */}
      {!loadingPkgDetails && parameters.length > 0 && (
        <div className="border border-blue-200 dark:border-blue-800 rounded-lg overflow-hidden">
          <div className="px-4 py-2.5 bg-blue-50 dark:bg-blue-900/30 border-b border-blue-200 dark:border-blue-800">
            <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-400">Parameters Of Package</h4>
          </div>
          <div className="px-4 py-3 space-y-1">
            <div className="pb-2 mb-1 border-b border-gray-100 dark:border-gray-800">
              <label className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allParamsSelected}
                  onChange={(e) => handleSelectAllParams(e.target.checked)}
                  className="w-4 h-4 accent-blue-600 rounded"
                />
                Select / Deselect All
              </label>
            </div>
            {parameters.map((param) => (
              <div key={param.id}>
                <label className="inline-flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer py-0.5 hover:text-blue-600 dark:hover:text-blue-400 transition">
                  <input
                    type="checkbox"
                    className="parametercheck w-4 h-4 mt-0.5 accent-blue-600 rounded flex-shrink-0"
                    checked={selectedParams.includes(param.id)}
                    onChange={() => handleParamToggle(param.id)}
                  />
                  <span>
                    {param.name}
                    {param.description ? <span className="text-gray-400 dark:text-gray-500"> ({param.description})</span> : ""}
                  </span>
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Footer ── */}
      <div className="flex justify-end items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          className="px-5 py-2.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancel
        </button>
        <button
          className={`flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition ${submitting ? "opacity-60 cursor-not-allowed" : ""}`}
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <>
              <Spinner className="h-4 w-4 text-white" />
              Saving…
            </>
          ) : submitLabel}
        </button>
      </div>
    </div>
  );
}