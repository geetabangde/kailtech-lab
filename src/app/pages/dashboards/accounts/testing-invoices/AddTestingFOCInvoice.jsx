// AddFocTestingInvoice.jsx
// Route: /dashboards/accounts/testing-invoices/create-foc
//
// PHP files ported:
//   generateFocInvoiceTesting.php     → main form (same as testing but foc=TRUE on submit)
//   getpodetailforinvoicetesting.php  → PO dropdown (no potype selector)
//   fetchCustomerandinwarddetail.php  → inward multi-select + billing info
//   getitemfromTrf.php                → items table
//   getTestingInvoiceBrnNos.php       → brnnos textarea
//   insertTestingInvoice.php          → submit (sends foc=TRUE, invoiceno="FOC")
//
// KEY DIFFERENCE from normal Testing Invoice:
//   PHP sumamount() forces ALL charges to 0 and readonly:
//   rate=0, discount=0, freight=0, mobilisation=0, witness=0,
//   samplehandling=0, sampleprep=0
//   Only tax (CGST/SGST/IGST) is calculated on subtotal2
//
// API endpoints:
//   GET /accounts/get-testing-ponumber?customerid=&potype=Normal
//   GET /accounts/get-testing-inwarddetail?customerid=&potype=&ponumber=
//   GET /accounts/get-itemfrom-trf?customerid=&potype=&ponumber=&inwardid[]=
//   GET /accounts/get-testing-brnnumber?inwardid[]=
//   POST /accounts/create-testing-invoice  (with foc: "Yes", invoiceno: "FOC")

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router";
import axios from "utils/axios";
import { toast } from "sonner";
import { Page } from "components/shared/Page";
import { Card } from "components/ui";

// ─────────────────────────────────────────────────────────────────────────────
// PHP: sumamount() FOC version
// ALL charges are forced to 0 (readonly in PHP)
// rate per item is also 0
// Only CGST/SGST/IGST calculated on subtotal2
// ─────────────────────────────────────────────────────────────────────────────
function calcFocTotals({ isSgst, charges }) {
  // PHP: all charges forced to 0 in FOC sumamount()
  const subtotal2 = 0;

  const cgstper = parseFloat(charges.cgstper) || 0;
  const sgstper = parseFloat(charges.sgstper) || 0;
  const igstper = parseFloat(charges.igstper) || 0;

  // PHP: cgstamount = ((subtotal2/100)*cgstper) → (0/100)*9 = 0
  const cgstamount = isSgst
    ? parseFloat(((subtotal2 / 100) * cgstper).toFixed(2))
    : 0;
  const sgstamount = isSgst
    ? parseFloat(((subtotal2 / 100) * sgstper).toFixed(2))
    : 0;
  const igstamount = !isSgst
    ? parseFloat(((subtotal2 / 100) * igstper).toFixed(2))
    : 0;

  const total = parseFloat(
    (subtotal2 + cgstamount + sgstamount + igstamount).toFixed(2),
  );
  const finaltotal = Math.round(total); // 0
  const roundoff = parseFloat((finaltotal - total).toFixed(2));

  return {
    subtotal: 0,
    discount: 0,
    witnesscharges: 0,
    subtotal2: 0,
    cgstamount,
    sgstamount,
    igstamount,
    total,
    finaltotal,
    roundoff,
  };
}

const toSlashDate = (iso) => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

// ─── Style tokens ─────────────────────────────────────────────────────────────
const inputCls =
  "dark:bg-dark-900 dark:border-dark-500 dark:text-dark-100 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400";
const roInputCls =
  "dark:bg-dark-800 dark:border-dark-500 dark:text-dark-300 w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:outline-none cursor-default";
const selectCls =
  "dark:bg-dark-900 dark:border-dark-500 dark:text-dark-100 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";
const labelCls =
  "dark:text-dark-400 mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500";

// ─── Searchable Customer Dropdown ─────────────────────────────────────────────
function CustomerSearch({ customers, value, onChange }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const name = useMemo(
    () => customers.find((c) => String(c.id) === String(value))?.name ?? "",
    [customers, value],
  );

  const list = useMemo(() => {
    const q = query.toLowerCase();
    return (
      q ? customers.filter((c) => c.name.toLowerCase().includes(q)) : customers
    ).slice(0, 80);
  }, [customers, query]);

  useEffect(() => {
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={ref} className="relative">
      <input
        type="text"
        value={open ? query : name}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          if (!e.target.value) onChange("");
        }}
        onFocus={() => setOpen(true)}
        placeholder="Search customer..."
        className={inputCls}
        autoComplete="off"
      />
      {value && !open && (
        <button
          type="button"
          onClick={() => {
            onChange("");
            setQuery("");
          }}
          className="absolute top-1/2 right-2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      )}
      {open && (
        <div className="dark:bg-dark-800 dark:border-dark-600 absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-gray-200 bg-white shadow-xl">
          {list.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-400">
              No customers found
            </div>
          ) : (
            list.map((c) => (
              <div
                key={c.id}
                onMouseDown={() => {
                  onChange(String(c.id));
                  setQuery("");
                  setOpen(false);
                }}
                className={`dark:hover:bg-dark-700 cursor-pointer px-3 py-2 text-sm hover:bg-blue-50 ${
                  String(c.id) === String(value)
                    ? "dark:bg-dark-700 bg-blue-50 font-semibold text-blue-700 dark:text-blue-400"
                    : "dark:text-dark-200 text-gray-700"
                }`}
              >
                {c.name}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── Inward Multi-Select ──────────────────────────────────────────────────────
function InwardMultiSelect({ options = [], value, onChange, disabled }) {
  const safeOptions = Array.isArray(options) ? options : [];
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const toggle = (id) => {
    const s = String(id);
    onChange(value.includes(s) ? value.filter((v) => v !== s) : [...value, s]);
  };
  const remove = (e, id) => {
    e.stopPropagation();
    onChange(value.filter((v) => v !== String(id)));
  };
  const selected = safeOptions.filter((o) => value.includes(String(o.id)));

  return (
    <div ref={ref} className="relative">
      <div
        onClick={() => !disabled && setOpen((p) => !p)}
        className={[
          "dark:bg-dark-900 dark:border-dark-500 relative min-h-[38px] w-full cursor-pointer rounded-md border bg-white px-2 py-1.5 pr-8 transition-colors",
          disabled
            ? "dark:bg-dark-800 cursor-not-allowed border-gray-200 bg-gray-50"
            : "border-gray-300 hover:border-blue-400",
          open ? "border-blue-500 ring-1 ring-blue-500" : "",
        ].join(" ")}
      >
        <div className="flex flex-wrap items-center gap-1">
          {selected.map((opt) => (
            <span
              key={opt.id}
              className="inline-flex items-center gap-1 rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
            >
              {opt.label ?? opt.display ?? String(opt.id).padStart(4, "0")}
              <button
                type="button"
                onMouseDown={(e) => remove(e, opt.id)}
                className="ml-0.5 text-blue-500 hover:text-blue-800 focus:outline-none"
              >
                &times;
              </button>
            </span>
          ))}
          {selected.length === 0 && (
            <span className="dark:text-dark-500 px-1 text-sm text-gray-400">
              {disabled ? "Select PO first..." : "Select Inward Entry..."}
            </span>
          )}
        </div>
        <span className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-gray-400">
          <svg
            className={[
              "h-4 w-4 transition-transform",
              open ? "rotate-180" : "",
            ].join(" ")}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </span>
      </div>

      {open && !disabled && (
        <div className="dark:bg-dark-800 dark:border-dark-600 absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg">
          {safeOptions.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-400">
              No entries found
            </div>
          ) : (
            safeOptions.map((opt) => {
              const sel = value.includes(String(opt.id));
              return (
                <div
                  key={opt.id}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    toggle(opt.id);
                  }}
                  className={[
                    "flex cursor-pointer items-center gap-2.5 px-3 py-2 text-sm transition-colors select-none",
                    sel
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                      : "dark:text-dark-200 dark:hover:bg-dark-700 text-gray-700 hover:bg-gray-50",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition-colors",
                      sel
                        ? "border-blue-500 bg-blue-500"
                        : "dark:border-dark-500 border-gray-300",
                    ].join(" ")}
                  >
                    {sel && (
                      <svg
                        className="h-2.5 w-2.5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </span>
                  {opt.label ?? opt.display ?? String(opt.id).padStart(4, "0")}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
function Spinner({ text = "Loading..." }) {
  return (
    <div className="flex items-center gap-2 py-2 text-sm text-gray-500">
      <svg
        className="h-4 w-4 animate-spin text-blue-500"
        viewBox="0 0 24 24"
        fill="none"
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
      {text}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
export default function AddFocTestingInvoice() {
  const navigate = useNavigate();
  const permissions = JSON.parse(localStorage.getItem("userPermissions") || "[]");

  useEffect(() => {
    if (!permissions.includes(292)) {
      navigate("/dashboards");
    }
  }, [navigate, permissions]);

  // ── State ──────────────────────────────────────────────────────────────────
  const [customers, setCustomers] = useState([]);
  const [customerid, setCustomerid] = useState("");
  // PHP: potype not shown in FOC form — fixed as "Normal"
  const potype = "Normal";
  const [ponumbers, setPonumbers] = useState([]);
  const [selectedPo, setSelectedPo] = useState("");
  const [inwardOptions, setInwardOptions] = useState([]);
  const [selectedInwards, setSelectedInwards] = useState([]);
  const [items, setItems] = useState([]);
  const [brnnos, setBrnnos] = useState("");
  const [remark, setRemark] = useState("");
  const [billingInfo, setBillingInfo] = useState(null);
  const [invoicedate, setInvoicedate] = useState(
    new Date().toISOString().slice(0, 10),
  );

  // PHP: FOC sumamount forces all these to 0 and readonly
  // We keep them in state for API payload compatibility but they're always 0
  const [charges, setCharges] = useState({
    cgstper: 9,
    sgstper: 9,
    igstper: 18,
  });

  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [loadingPo, setLoadingPo] = useState(false);
  const [loadingInward, setLoadingInward] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const [saving, setSaving] = useState(false);

  const isSgst = useMemo(
    () => String(billingInfo?.statecode ?? "").trim() === "23",
    [billingInfo],
  );

  // PHP: FOC → all amounts = 0, only tax on subtotal2 (which is also 0)
  const totals = useMemo(
    () => calcFocTotals({ isSgst, charges }),
    [isSgst, charges],
  );

  // ── 1. Load customers ──────────────────────────────────────────────────────
  useEffect(() => {
    axios
      .get("/people/get-all-customers")
      .then((r) => setCustomers(r.data.data ?? r.data ?? []))
      .catch(() => toast.error("Failed to load customers"))
      .finally(() => setLoadingCustomers(false));
  }, []);

  // ── 2. Load PO Numbers ─────────────────────────────────────────────────────
  const loadPoNumbers = useCallback(async (cid) => {
    setPonumbers([]);
    setSelectedPo("");
    setInwardOptions([]);
    setSelectedInwards([]);
    setItems([]);
    setBrnnos("");
    setBillingInfo(null);
    if (!cid) return;
    setLoadingPo(true);
    try {
      const res = await axios.get(
        `/accounts/get-testing-ponumber?customerid=${cid}&potype=${potype}`,
      );
      const list = res.data.data ?? res.data ?? [];
      setPonumbers(Array.isArray(list) ? list : []);
    } catch {
      toast.error("Failed to load PO numbers");
    } finally {
      setLoadingPo(false);
    }
  }, []);

  useEffect(() => {
    loadPoNumbers(customerid);
  }, [customerid, loadPoNumbers]);

  // ── 3. Load Inward Detail ──────────────────────────────────────────────────
  const loadInwardDetail = useCallback(
    async (po) => {
      setInwardOptions([]);
      setSelectedInwards([]);
      setItems([]);
      setBrnnos("");
      setBillingInfo(null);
      if (!po || !customerid) return;
      setLoadingInward(true);
      try {
        const res = await axios.get(
          `/accounts/get-testing-inwarddetail?customerid=${customerid}&potype=${potype}&ponumber=${encodeURIComponent(po)}`,
        );
        const d = res.data?.data ?? res.data ?? {};
        if (Array.isArray(d)) {
          setInwardOptions(d);
        } else {
          setInwardOptions(Array.isArray(d.inwards) ? d.inwards : []);
          if (d.customer) {
            setBillingInfo(d.customer);
          } else if (d.statecode || d.gstno) {
            setBillingInfo({
              statecode: d.statecode ?? "",
              gstno: d.gstno ?? "",
              name: d.name ?? "",
              address: d.address ?? "",
              pan: d.pan ?? "",
              addressid: d.addressid ?? "",
            });
          }
        }
      } catch {
        toast.error("Failed to load inward entries");
      } finally {
        setLoadingInward(false);
      }
    },
    [customerid],
  );

  useEffect(() => {
    loadInwardDetail(selectedPo);
  }, [selectedPo, loadInwardDetail]);

  // ── 4. Load Items + BRN ────────────────────────────────────────────────────
  const loadItems = useCallback(
    async (inwards) => {
      setItems([]);
      setBrnnos("");
      if (!inwards.length || !selectedPo || !customerid) return;
      setLoadingItems(true);
      try {
        const inwardParams = inwards
          .map((i) => `inwardid[]=${encodeURIComponent(i)}`)
          .join("&");
        const base = `customerid=${customerid}&potype=${potype}&ponumber=${encodeURIComponent(selectedPo)}`;

        const [itemsRes, brnRes] = await Promise.all([
          axios.get(`/accounts/get-itemfrom-trf?${base}&${inwardParams}`),
          axios.get(`/accounts/get-testing-brnnumber?${inwardParams}`),
        ]);

        const itemsData = itemsRes.data?.data ?? itemsRes.data ?? {};
        const customerInfo =
          itemsData.customer ?? itemsData.billing_customer ?? null;
        if (customerInfo) setBillingInfo(customerInfo);

        const rawItems = itemsData.items ?? itemsData.data ?? [];
        const mapped = (Array.isArray(rawItems) ? rawItems : []).map(
          (item, idx) => ({
            ...item,
            _key: `item-${idx}-${item.id}`,
            id: item.id ?? item.item_id,
            name: item.name ?? "",
            brnno: item.brn ?? item.brnno ?? "",
            // PHP: FOC → rate forced to 0 for all items
            rate: 0,
          }),
        );
        setItems(mapped);

        // Parse BRN
        const brnRaw = brnRes.data;
        let brnString = "";
        if (typeof brnRaw === "string") {
          brnString = brnRaw;
        } else if (brnRaw && typeof brnRaw === "object") {
          const inner =
            brnRaw.data && typeof brnRaw.data === "object"
              ? brnRaw.data
              : brnRaw;
          brnString =
            inner.brn_list ??
            inner.brn_numbers ??
            inner.brnnos ??
            inner.brn ??
            "";
          if (!brnString && Array.isArray(inner.brn_array)) {
            brnString = inner.brn_array.join(",");
          }
          if (typeof brnString !== "string") brnString = "";
        }
        setBrnnos(brnString);
      } catch {
        toast.error("Failed to load invoice items");
      } finally {
        setLoadingItems(false);
      }
    },
    [customerid, selectedPo],
  );

  const handleInwardChange = (vals) => {
    setSelectedInwards(vals);
    loadItems(vals);
  };

  // PHP: X button removes item and BRN
  const handleRemoveItem = (itemKey, brnno) => {
    setItems((prev) => prev.filter((i) => i._key !== itemKey));
    if (brnno) {
      setBrnnos((prev) =>
        prev
          .split(",")
          .filter((b) => b.trim() && b.trim() !== String(brnno).trim())
          .join(","),
      );
    }
  };

  // ── 5. Submit ──────────────────────────────────────────────────────────────
  // PHP: sendForm('foc', 'TRUE', 'insertTestingInvoice.php', ...)
  // insertTestingInvoice.php: if(isset($_POST['foc'])) → $x['foc']="Yes"; $x['invoiceno']="FOC"
  const handleSubmit = async () => {
    if (!customerid) return toast.error("Please select a customer");
    if (!selectedPo) return toast.error("Please select a PO Number");
    if (!selectedInwards.length)
      return toast.error("Please select at least one Inward Entry");
    if (!items.length) return toast.error("No items found");

    setSaving(true);
    try {
      const payload = {
        customerid: Number(customerid),
        addressid: Number(billingInfo?.addressid ?? 0),
        customername: billingInfo?.name ?? "",
        address: billingInfo?.address ?? "",
        statecode: billingInfo?.statecode ?? "",
        pan: billingInfo?.pan ?? "",
        gstno: billingInfo?.gstno ?? "",
        potype,
        ponumber: selectedPo,
        inwardid: selectedInwards.map(Number),
        typeofinvoice: "Testing",
        invoicedate: toSlashDate(invoicedate),

        // PHP: $x['foc'] = "Yes"; $x['invoiceno'] = "FOC"
        foc: "Yes",
        invoiceno: "FOC",

        // PHP: FOC → all rates = 0
        itemid: items.map((i) => Number(i.id)),
        itemrate: items.map(() => 0),
        itemmeter: items.map(() => null),

        // PHP: all charges forced to 0
        subtotal: 0,
        disctype: "amount",
        discnumber: 0,
        discount: 0,
        subtotal2: 0,

        cgstper: isSgst ? parseFloat(charges.cgstper) || 0 : 0,
        cgstamount: totals.cgstamount,
        sgstper: isSgst ? parseFloat(charges.sgstper) || 0 : 0,
        sgstamount: totals.sgstamount,
        igstper: !isSgst ? parseFloat(charges.igstper) || 0 : 0,
        igstamount: totals.igstamount,

        freight: 0,
        mobilisation: 0,
        witnessnumber: 0,
        witnesstype: "amount",
        witnesscharges: 0,
        samplehandling: 0,
        sampleprep: 0,

        total: totals.total,
        roundoff: totals.roundoff,
        finaltotal: totals.finaltotal,
        remaining: totals.finaltotal,

        remark,
        brnnos,
        status: 0,
      };

      const res = await axios.post("/accounts/create-testing-invoice", payload);
      const ok =
        res.data.success === true ||
        res.data.status === true ||
        res.data.status === "true" ||
        res.data.status === 1;

      if (ok) {
        toast.success(res.data.message ?? "FOC Invoice added successfully ✅");
        navigate("/dashboards/accounts/testing-invoices");
      } else {
        toast.error(res.data.message ?? "Failed to add invoice");
      }
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message ?? "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <Page title="Add FOC Testing Invoice">
      <div className="transition-content px-[var(--margin-x)] pb-10">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="dark:text-dark-100 text-base font-semibold text-gray-800">
              FOC Invoice Form
            </h2>
            {/* FOC badge — visually distinct */}
            <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700 ring-1 ring-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:ring-amber-700">
              FREE OF COST
            </span>
          </div>
          <button
            onClick={() => navigate("/dashboards/accounts/testing-invoices")}
            className="rounded bg-sky-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-sky-600"
          >
            &laquo; Back to Invoice List
          </button>
        </div>

        {/* FOC notice */}
        <div className="mb-4 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-900/20">
          <svg
            className="mt-0.5 h-5 w-5 shrink-0 text-amber-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z"
            />
          </svg>
          <p className="text-sm text-amber-800 dark:text-amber-300">
            This is a <strong>Free of Cost (FOC)</strong> invoice. All item
            rates, charges, discounts, freight, and other fees are automatically
            set to <strong>₹0</strong> and cannot be changed.
          </p>
        </div>

        <Card className="p-6">
          {/* ══ Row 1: Customer / PO / Inward ══ */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className={labelCls}>Customer</label>
              {loadingCustomers ? (
                <Spinner text="Loading customers..." />
              ) : (
                <CustomerSearch
                  customers={customers}
                  value={customerid}
                  onChange={setCustomerid}
                />
              )}
            </div>

            <div>
              <label className={labelCls}>Po Number</label>
              {loadingPo ? (
                <Spinner text="Loading POs..." />
              ) : (
                <select
                  value={selectedPo}
                  onChange={(e) => setSelectedPo(e.target.value)}
                  className={selectCls}
                  disabled={!customerid || ponumbers.length === 0}
                >
                  <option value="">Select PO</option>
                  {ponumbers.map((p, i) => {
                    const val =
                      typeof p === "string" ? p : (p.ponumber ?? p.value ?? "");
                    return (
                      <option key={i} value={val}>
                        {val}
                      </option>
                    );
                  })}
                </select>
              )}
            </div>

            <div>
              <label className={labelCls}>Inward Entry</label>
              {loadingInward ? (
                <Spinner text="Loading entries..." />
              ) : (
                <InwardMultiSelect
                  options={inwardOptions}
                  value={selectedInwards}
                  onChange={handleInwardChange}
                  disabled={!selectedPo}
                />
              )}
            </div>
          </div>

          {/* ══ Billing Info ══ */}
          {billingInfo && (
            <div className="dark:border-dark-600 mt-5 grid grid-cols-1 gap-5 border-t border-gray-200 pt-4 md:grid-cols-2">
              <div className="text-sm">
                <div className="dark:text-dark-100 font-bold text-gray-900">
                  Customer:
                  <br />
                  {billingInfo.name}
                </div>
                {billingInfo.address && (
                  <div className="dark:text-dark-400 mt-1 text-xs text-gray-600">
                    <b>Address:</b> {billingInfo.address}
                  </div>
                )}
                <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs">
                  <span>
                    <b className="dark:text-dark-400 text-gray-500">
                      State code:{" "}
                    </b>
                    {billingInfo.statecode}
                  </span>
                  <span>
                    <b className="dark:text-dark-400 text-gray-500">
                      GSTIN/UIN:{" "}
                    </b>
                    {billingInfo.gstno || "—"}
                  </span>
                  <span>
                    <b className="dark:text-dark-400 text-gray-500">PAN: </b>
                    {billingInfo.pan || "—"}
                  </span>
                </div>
                <div className="dark:text-dark-500 mt-1 text-xs text-gray-400">
                  Kind Attn.
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-3">
                  <span className="dark:text-dark-400 w-32 font-medium text-gray-600">
                    Invoice Date:
                  </span>
                  <input
                    type="date"
                    value={invoicedate}
                    onChange={(e) => setInvoicedate(e.target.value)}
                    className="dark:bg-dark-900 dark:border-dark-500 dark:text-dark-100 rounded border border-gray-300 px-2 py-1 text-sm"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <span className="dark:text-dark-400 w-32 font-medium text-gray-600">
                    P.O. No.:
                  </span>
                  <span className="dark:text-dark-300 text-gray-700">
                    {selectedPo}
                  </span>
                </div>
                <div className="flex gap-2">
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                      isSgst
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    }`}
                  >
                    {isSgst ? "CGST + SGST (State 23)" : "IGST (Inter-state)"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ══ Items Table ══ */}
          {loadingItems ? (
            <div className="dark:border-dark-600 mt-5 border-t border-gray-200 pt-4">
              <Spinner text="Loading items..." />
            </div>
          ) : items.length > 0 ? (
            <div className="dark:border-dark-600 mt-5 border-t border-gray-200 pt-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="dark:bg-dark-700 bg-gray-100">
                      <th
                        className="dark:text-dark-400 px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase"
                        style={{ width: 50 }}
                      >
                        Sr. No.
                      </th>
                      <th className="dark:text-dark-400 px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">
                        Description
                      </th>
                      {/* PHP: Rate column shown but locked to 0 in FOC */}
                      <th
                        className="dark:text-dark-400 px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase"
                        style={{ width: 120 }}
                      >
                        Rate
                      </th>
                      <th style={{ width: 50 }} />
                    </tr>
                  </thead>
                  <tbody className="dark:divide-dark-600 divide-y divide-gray-100">
                    {items.map((item, idx) => (
                      <tr
                        key={item._key}
                        className="dark:hover:bg-dark-700 itemrow hover:bg-gray-50"
                      >
                        <td className="dark:text-dark-400 px-3 py-2 text-center text-xs text-gray-400">
                          {idx + 1}
                        </td>
                        <td className="px-3 py-2">
                          <div className="dark:text-dark-100 font-medium text-gray-800">
                            {item.name}
                          </div>
                          {item.description && (
                            <div className="dark:text-dark-400 text-xs text-gray-500">
                              {item.description}
                            </div>
                          )}
                          <div className="dark:text-dark-400 text-xs text-gray-500">
                            Brn: {item.brnno || "—"}
                          </div>
                        </td>
                        {/* PHP: rate field present but forced to 0 (readonly) */}
                        <td className="px-3 py-2">
                          <input
                            readOnly
                            value="0"
                            className={roInputCls + " rate w-24"}
                            title="FOC: Rate is always 0"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <button
                            onClick={() =>
                              handleRemoveItem(item._key, item.brnno)
                            }
                            className="rounded bg-red-500 px-2.5 py-1 text-xs font-bold text-white hover:bg-red-600"
                          >
                            X
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          {/* ══ Charges — All readonly/0 in FOC ══ */}
          {(billingInfo || items.length > 0) && (
            <div className="dark:border-dark-600 mt-5 space-y-3 border-t border-gray-200 pt-4">
              {/* PHP: all charge fields readonly in FOC sumamount() */}
              <FocChargeRow label="Subtotal" value="0.00" />

              <div className="flex items-center gap-2">
                <div className="w-4/12" />
                <div className="flex w-3/12 items-center justify-end gap-2 pr-4">
                  <label className="dark:text-dark-400 shrink-0 text-sm text-gray-400 line-through">
                    Discount
                  </label>
                  <input readOnly value="0" className={roInputCls + " w-20"} />
                  <span className="text-sm text-gray-400">₹</span>
                </div>
                <div className="w-4/12">
                  <input readOnly value="0.00" className={roInputCls} />
                </div>
              </div>

              <FocChargeRow label="Freight Charges" value="0" />
              <FocChargeRow
                label="Mobilization and Demobilization Charges"
                value="0"
                wide
              />

              <div className="flex items-center gap-2">
                <div className="w-4/12" />
                <div className="flex w-3/12 items-center justify-end gap-2 pr-4">
                  <label className="dark:text-dark-400 shrink-0 text-sm text-gray-400 line-through">
                    Witness Charges
                  </label>
                  <input readOnly value="0" className={roInputCls + " w-20"} />
                  <span className="text-sm text-gray-400">₹</span>
                </div>
                <div className="w-4/12">
                  <input readOnly value="0.00" className={roInputCls} />
                </div>
              </div>

              <FocChargeRow label="Sample Handling" value="0" wide />
              <FocChargeRow label="Sample Preparation Charges" value="0" wide />
              <FocChargeRow label="Subtotal" value="0.00" />

              {/* Tax — editable percentage but amount = 0 since subtotal2 = 0 */}
              {isSgst ? (
                <>
                  <TaxRow
                    label="Cgst"
                    pct={charges.cgstper}
                    onChange={(v) => setCharges((p) => ({ ...p, cgstper: v }))}
                    amount={totals.cgstamount.toFixed(2)}
                    roInputCls={roInputCls}
                  />
                  <TaxRow
                    label="Sgst"
                    pct={charges.sgstper}
                    onChange={(v) => setCharges((p) => ({ ...p, sgstper: v }))}
                    amount={totals.sgstamount.toFixed(2)}
                    roInputCls={roInputCls}
                  />
                </>
              ) : (
                <TaxRow
                  label="Igst"
                  pct={charges.igstper}
                  onChange={(v) => setCharges((p) => ({ ...p, igstper: v }))}
                  amount={totals.igstamount.toFixed(2)}
                  roInputCls={roInputCls}
                />
              )}

              <FocChargeRow label="Total" value={totals.total.toFixed(2)} />
              <FocChargeRow
                label="Round off"
                value={totals.roundoff.toFixed(2)}
              />

              <div className="flex items-center">
                <div className="w-5/12" />
                <label className="dark:text-dark-300 w-2/12 pr-4 text-right text-sm font-semibold text-gray-700">
                  Final Total
                </label>
                <div className="w-4/12">
                  <input
                    readOnly
                    value={totals.finaltotal}
                    className="dark:bg-dark-800 dark:border-dark-500 w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-bold text-amber-600 dark:text-amber-400"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ══ Remark + BRN ══ */}
          <div className="dark:border-dark-600 mt-5 grid grid-cols-1 gap-4 border-t border-gray-200 pt-4 md:grid-cols-2">
            <div>
              <label className={labelCls}>Remark</label>
              <textarea
                rows={3}
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                className={`${inputCls} resize-none`}
                placeholder="Remark"
              />
            </div>
            <div>
              <label className={labelCls}>BRN Nos.</label>
              <textarea
                rows={3}
                value={brnnos}
                readOnly
                className="dark:bg-dark-800 dark:border-dark-500 dark:text-dark-300 w-full resize-none rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
              />
            </div>
          </div>

          {/* ══ Submit ══ */}
          <div className="dark:border-dark-600 mt-6 flex justify-end border-t border-gray-200 pt-4">
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-md bg-amber-600 px-8 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <>
                  <svg
                    className="h-4 w-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
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
                  Saving…
                </>
              ) : (
                "Add FOC Invoice"
              )}
            </button>
          </div>
        </Card>
      </div>
    </Page>
  );
}

// ─── Layout helpers ───────────────────────────────────────────────────────────
// PHP: FOC sumamount forces fields to 0 and readonly — shown as disabled
function FocChargeRow({ label, value, wide = false }) {
  return (
    <div className="flex items-center">
      <div className={wide ? "w-5/12" : "w-5/12"} />
      <label
        className={`dark:text-dark-400 ${wide ? "w-2/12" : "w-2/12"} pr-4 text-right text-sm text-gray-400`}
      >
        {label}
      </label>
      <div className="w-4/12">
        <input
          readOnly
          value={value}
          className="dark:bg-dark-800 dark:border-dark-600 w-full cursor-not-allowed rounded-md border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-400"
          title="FOC: Always 0"
        />
      </div>
    </div>
  );
}

function TaxRow({ label, pct, onChange, amount, roInputCls }) {
  return (
    <div className="flex items-center">
      <div className="w-5/12" />
      <div className="flex w-2/12 items-center justify-end gap-1 pr-4">
        <label className="dark:text-dark-400 shrink-0 text-sm text-gray-600">
          {label}
        </label>
        <input
          type="number"
          min="0"
          max="100"
          value={pct}
          onChange={(e) => onChange(e.target.value)}
          style={{ width: 60 }}
          className="dark:bg-dark-900 dark:border-dark-500 dark:text-dark-100 rounded border border-gray-300 px-2 py-1 text-sm"
        />
        <span className="text-sm text-gray-500">%</span>
      </div>
      <div className="w-4/12">
        <input readOnly value={amount} className={roInputCls} />
      </div>
    </div>
  );
}
