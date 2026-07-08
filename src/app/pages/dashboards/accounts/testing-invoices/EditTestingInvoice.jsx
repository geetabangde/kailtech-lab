// EditTestingInvoice.jsx
// Route: /dashboards/accounts/testing-invoices/edit/:id
// PHP port of: edittestinginvoice.php
//
// Workflow:
//   1. Mount  → GET /accounts/get-testing-invoice-byid/:id  (pre-populate all fields)
//   2. Customer change → GET /accounts/get-testing-ponumber?customerid=&potype=
//   3. PO change       → GET /accounts/get-testing-inwarddetail?customerid=&potype=&ponumber=
//   4. Inward change   → GET /accounts/get-itemfrom-trf?customerid=&potype=&ponumber=&inwardid[]=
//   5. Submit          → POST /accounts/update-testing-invoice (includes id + invoiceitemid[])
//
// Payload difference vs create:
//   Extra fields: "id" (invoice id) + "invoiceitemid" (array of invoiceitemcalibraton row ids)
//
// PHP sumamount() logic (ported in calcTotals):
//   subtotal    = Σ (hasMeter ? rate*meter : rate)
//   discount    = disctype=="%" ? (subtotal/100)*discnumber : discnumber
//   subtotal2   = subtotal - discount + freight + mobilisation + witnesscharges + samplehandling + sampleprep
//   cgst/sgst   = (subtotal2/100)*per   (when statecode==23)
//   igst        = (subtotal2/100)*per   (when statecode!=23)
//   total       = subtotal2 + tax (2dp)
//   finaltotal  = Math.round(total),  roundoff = finaltotal - total

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import axios from "utils/axios";
import { toast } from "sonner";
import { Page } from "components/shared/Page";
import { Card } from "components/ui";

// ─── calcTotals — identical to AddTestingInvoice ─────────────────────────────
function calcTotals({ items, charges, isSgst }) {
  let subtotal = 0;
  items.forEach((item) => {
    const rate  = parseFloat(item.rate)  || 0;
    const meter = parseFloat(item.meter) || 0;
    subtotal += item.hasMeter ? meter * rate : rate;
  });

  const discnumber = parseFloat(charges.discnumber) || 0;
  const discount   =
    charges.disctype === "%" ? (subtotal / 100) * discnumber : discnumber;

  const freight        = parseFloat(charges.freight)        || 0;
  const mobilisation   = parseFloat(charges.mobilisation)   || 0;
  const samplehandling = parseFloat(charges.samplehandling) || 0;
  const sampleprep     = parseFloat(charges.sampleprep)     || 0;

  const witnessnumber  = parseFloat(charges.witnessnumber)  || 0;
  const witnesscharges =
    charges.witnesstype === "%" ? (subtotal / 100) * witnessnumber : witnessnumber;

  const subtotal2 =
    subtotal - discount + freight + mobilisation + witnesscharges + samplehandling + sampleprep;

  const cgstper    = parseFloat(charges.cgstper)  || 0;
  const sgstper    = parseFloat(charges.sgstper)  || 0;
  const igstper    = parseFloat(charges.igstper)  || 0;

  const cgstamount = isSgst  ? parseFloat(((subtotal2 / 100) * cgstper).toFixed(2))  : 0;
  const sgstamount = isSgst  ? parseFloat(((subtotal2 / 100) * sgstper).toFixed(2))  : 0;
  const igstamount = !isSgst ? parseFloat(((subtotal2 / 100) * igstper).toFixed(2))  : 0;

  const total      = parseFloat((subtotal2 + cgstamount + sgstamount + igstamount).toFixed(2));
  const finaltotal = Math.round(total);
  const roundoff   = parseFloat((finaltotal - total).toFixed(2));

  return {
    subtotal:        parseFloat(subtotal.toFixed(2)),
    discount:        parseFloat(discount.toFixed(2)),
    witnesscharges:  parseFloat(witnesscharges.toFixed(2)),
    subtotal2:       parseFloat(subtotal2.toFixed(2)),
    cgstamount, sgstamount, igstamount,
    total, finaltotal, roundoff,
  };
}

// PHP: changedateformate → dd/mm/YYYY stored in DB as d/m/Y
const toSlashDate = (iso) => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

// API sends invoicedate as "22/04/2022" — convert to ISO for <input type="date">
const slashToIso = (s) => {
  if (!s) return "";
  const parts = s.split("/");
  if (parts.length !== 3) return "";
  return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
};

// ─── Style tokens (same as AddTestingInvoice) ─────────────────────────────────
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
  const [open, setOpen]   = useState(false);
  const ref = useRef(null);

  const name = useMemo(
    () => customers.find((c) => String(c.id) === String(value))?.name ?? "",
    [customers, value],
  );

  const list = useMemo(() => {
    const q = query.toLowerCase();
    return (q ? customers.filter((c) => c.name.toLowerCase().includes(q)) : customers).slice(0, 80);
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
          onClick={() => { onChange(""); setQuery(""); }}
          className="absolute top-1/2 right-2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >✕</button>
      )}
      {open && (
        <div className="dark:bg-dark-800 dark:border-dark-600 absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-gray-200 bg-white shadow-xl">
          {list.length === 0
            ? <div className="px-3 py-2 text-sm text-gray-400">No customers found</div>
            : list.map((c) => (
              <div
                key={c.id}
                onMouseDown={() => { onChange(String(c.id)); setQuery(""); setOpen(false); }}
                className={`dark:hover:bg-dark-700 cursor-pointer px-3 py-2 text-sm hover:bg-blue-50 ${
                  String(c.id) === String(value)
                    ? "dark:bg-dark-700 bg-blue-50 font-semibold text-blue-700 dark:text-blue-400"
                    : "dark:text-dark-200 text-gray-700"
                }`}
              >{c.name}</div>
            ))
          }
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
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const toggle = (id) => {
    const s = String(id);
    onChange(value.includes(s) ? value.filter((v) => v !== s) : [...value, s]);
  };
  const remove = (e, id) => { e.stopPropagation(); onChange(value.filter((v) => v !== String(id))); };
  const selected = safeOptions.filter((o) => value.includes(String(o.id)));

  return (
    <div ref={ref} className="relative">
      <div
        onClick={() => !disabled && setOpen((p) => !p)}
        className={[
          "dark:bg-dark-900 dark:border-dark-500 relative min-h-[38px] w-full cursor-pointer rounded-md border bg-white px-2 py-1.5 pr-8 transition-colors",
          disabled ? "dark:bg-dark-800 cursor-not-allowed border-gray-200 bg-gray-50" : "border-gray-300 hover:border-blue-400",
          open ? "border-blue-500 ring-1 ring-blue-500" : "",
        ].join(" ")}
      >
        <div className="flex flex-wrap items-center gap-1">
          {selected.map((opt) => (
            <span key={opt.id} className="inline-flex items-center gap-1 rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
              {opt.label ?? opt.display ?? String(opt.id).padStart(4, "0")}
              <button type="button" onMouseDown={(e) => remove(e, opt.id)} className="ml-0.5 text-blue-500 hover:text-blue-800 focus:outline-none">&times;</button>
            </span>
          ))}
          {selected.length === 0 && (
            <span className="dark:text-dark-500 px-1 text-sm text-gray-400">
              {disabled ? "Select PO first..." : "Select Inward Entry..."}
            </span>
          )}
        </div>
        <span className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-gray-400">
          <svg className={["h-4 w-4 transition-transform", open ? "rotate-180" : ""].join(" ")} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </div>
      {open && !disabled && (
        <div className="dark:bg-dark-800 dark:border-dark-600 absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg">
          {safeOptions.length === 0
            ? <div className="px-3 py-2 text-sm text-gray-400">No entries found</div>
            : safeOptions.map((opt) => {
              const sel = value.includes(String(opt.id));
              return (
                <div
                  key={opt.id}
                  onMouseDown={(e) => { e.preventDefault(); toggle(opt.id); }}
                  className={[
                    "flex cursor-pointer items-center gap-2.5 px-3 py-2 text-sm transition-colors select-none",
                    sel ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" : "dark:text-dark-200 dark:hover:bg-dark-700 text-gray-700 hover:bg-gray-50",
                  ].join(" ")}
                >
                  <span className={["flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition-colors", sel ? "border-blue-500 bg-blue-500" : "dark:border-dark-500 border-gray-300"].join(" ")}>
                    {sel && (
                      <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </span>
                  {opt.label ?? opt.display ?? String(opt.id).padStart(4, "0")}
                </div>
              );
            })
          }
        </div>
      )}
    </div>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
function Spinner({ text = "Loading..." }) {
  return (
    <div className="flex items-center gap-2 py-2 text-sm text-gray-500">
      <svg className="h-4 w-4 animate-spin text-blue-500" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z" />
      </svg>
      {text}
    </div>
  );
}

// ─── Page-level full spinner ──────────────────────────────────────────────────
function PageSpinner() {
  return (
    <div className="flex h-[60vh] items-center justify-center gap-3 text-gray-500">
      <svg className="h-7 w-7 animate-spin text-blue-500" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z" />
      </svg>
      Loading invoice…
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
export default function EditTestingInvoice() {
  const { id }  = useParams();
  const navigate = useNavigate();

  // ── Core state ─────────────────────────────────────────────────────────────
  const [initialLoading, setInitialLoading] = useState(true);

  const [invoiceNo,  setInvoiceNo]  = useState("");   // display-only
  const [customers,  setCustomers]  = useState([]);
  const [customerid, setCustomerid] = useState("");
  const [potype,     setPotype]     = useState("Normal");
  const [ponumbers,  setPonumbers]  = useState([]);
  const [selectedPo, setSelectedPo] = useState("");
  const [inwardOptions,   setInwardOptions]   = useState([]);
  const [selectedInwards, setSelectedInwards] = useState([]);
  const [items,      setItems]      = useState([]);
  const [brnnos,     setBrnnos]     = useState("");
  const [remark,     setRemark]     = useState("");
  const [billingInfo, setBillingInfo] = useState(null);
  const [invoicedate, setInvoicedate] = useState(new Date().toISOString().slice(0, 10));
  const [hasMeterGlobal, setHasMeterGlobal] = useState(false);

  // PHP: charge fields
  const [charges, setCharges] = useState({
    subtotal:      0,
    discnumber:    0,
    disctype:      "amount",
    mobilisation:  0,
    freight:       0,
    witnesstype:   "amount",
    witnessnumber: 0,
    samplehandling: 0,
    sampleprep:    0,
    cgstper:       9,
    sgstper:       9,
    igstper:       18,
  });
  const setCharge = (k, v) => setCharges((p) => ({ ...p, [k]: v }));

  const [loadingPo,     setLoadingPo]     = useState(false);
  const [loadingInward, setLoadingInward] = useState(false);
  const [loadingItems,  setLoadingItems]  = useState(false);
  const [saving,        setSaving]        = useState(false);

  // track whether selects have been re-triggered (to avoid re-loading items on first hydration)
  const hydratedRef = useRef(false);

  // PHP: $sgst = ($statecode == 23)
  const isSgst = useMemo(
    () => String(billingInfo?.statecode ?? "").trim() === "23",
    [billingInfo],
  );

  const totals = useMemo(
    () => calcTotals({ items, charges, isSgst }),
    [items, charges, isSgst],
  );

  // ── 1. Load customers + existing invoice (parallel) ────────────────────────
  useEffect(() => {
    Promise.all([
      axios.get("/people/get-all-customers"),
      axios.get(`/accounts/get-testing-invoice-byid/${id}`),
    ])
      .then(([custRes, invRes]) => {
        setCustomers(custRes.data?.data ?? custRes.data ?? []);

        // ── Map the invoice response onto state ──
        const d = invRes.data?.data ?? invRes.data ?? {};
        const inv = d.invoice ?? d;

        // 🔍 DEBUG: check browser console → confirm items have invoiceitemid
        console.log("[EditTestingInvoice] GET response d:", d);
        console.log("[EditTestingInvoice] items sample:", (d.items ?? []).slice(0, 2));

        setInvoiceNo(inv.invoiceno ?? "");
        setCustomerid(String(inv.customerid ?? ""));
        setPotype(inv.potype ?? "Normal");
        setSelectedPo(inv.ponumber ?? "");
        setSelectedInwards(
          Array.isArray(inv.inwardid)
            ? inv.inwardid.map(String)
            : String(inv.inwardid ?? "").split(",").map((s) => s.trim()).filter(Boolean),
        );
        setInvoicedate(slashToIso(inv.invoicedate) || new Date().toISOString().slice(0, 10));
        setRemark(inv.remark ?? "");
        setBrnnos(inv.brnnos ?? "");

        // Billing info
        setBillingInfo({
          name:      inv.customername ?? "",
          address:   inv.address ?? (d.address ? `${d.address.address ?? ""}, ${d.address.city ?? ""}, ${d.address.pincode ?? ""}` : ""),
          statecode: String(inv.statecode ?? ""),
          gstno:     inv.gstno ?? "",
          pan:       inv.pan ?? "",
          addressid: inv.addressid ?? 0,
        });

        // Charges
        setCharges({
          subtotal:       parseFloat(inv.subtotal)       || 0,
          discnumber:     parseFloat(inv.discnumber)     || 0,
          disctype:       inv.disctype  ?? "amount",
          mobilisation:   parseFloat(inv.mobilisation)   || 0,
          freight:        parseFloat(inv.freight)        || 0,
          witnesstype:    inv.witnesstype ?? "amount",
          witnessnumber:  parseFloat(inv.witnessnumber)  || 0,
          samplehandling: parseFloat(inv.samplehandling) || 0,
          sampleprep:     parseFloat(inv.sampleprep)     || 0,
          cgstper:        parseFloat(inv.cgstper)        || 9,
          sgstper:        parseFloat(inv.sgstper)        || 9,
          igstper:        parseFloat(inv.igstper)        || 18,
        });

        // Items — API response should include items[] with invoiceitemid
        const rawItems = Array.isArray(d.items) ? d.items : [];
        const mapped = rawItems.map((item, idx) => ({
          ...item,
          _key:          `item-${idx}-${item.id}`,
          id:            item.id ?? item.item_id,
          invoiceitemid: item.invoiceitemid ?? item.invoice_item_id ?? null,
          name:          item.name ?? "",
          brnno:         item.brn ?? item.brnno ?? "",
          hasMeter:      (item.name ?? "").trim() === "Soil Analysis",
          meter:         parseFloat(item.meter)  || 1,
          rate:          parseFloat(item.invoicerate ?? item.rate ?? item.total) || 0,
        }));
        setItems(mapped);
        setHasMeterGlobal(mapped.some((i) => i.hasMeter));

        hydratedRef.current = true;
      })
      .catch(() => toast.error("Failed to load invoice"))
      .finally(() => setInitialLoading(false));
  }, [id]);

  // ── 2. Reload PO list when customer changes (not on first hydration) ───────
  const loadPoNumbers = useCallback(async (cid) => {
    if (!cid) { setPonumbers([]); return; }
    setLoadingPo(true);
    try {
      const res = await axios.get(`/accounts/get-testing-ponumber?customerid=${cid}&potype=${potype}`);
      const list = res.data?.data ?? res.data ?? [];
      setPonumbers(Array.isArray(list) ? list : []);
    } catch {
      toast.error("Failed to load PO numbers");
    } finally {
      setLoadingPo(false);
    }
  }, [potype]);

  // Load POs once customer is known (after hydration too, so the dropdown is populated)
  useEffect(() => {
    if (customerid) loadPoNumbers(customerid);
  }, [customerid, loadPoNumbers]);

  // ── 3. Reload inward options when PO changes (skip on first hydration) ─────
  const loadInwardDetail = useCallback(async (po) => {
    if (!po || !customerid) { setInwardOptions([]); return; }
    setLoadingInward(true);
    try {
      const res = await axios.get(
        `/accounts/get-testing-inwarddetail?customerid=${customerid}&potype=${potype}&ponumber=${encodeURIComponent(po)}`,
      );
      const d = res.data?.data ?? res.data ?? {};
      setInwardOptions(Array.isArray(d.inwards) ? d.inwards : []);
      if (d.statecode || d.gstno) {
        setBillingInfo((prev) => ({ ...(prev ?? {}), statecode: d.statecode ?? "", gstno: d.gstno ?? "" }));
      }
    } catch {
      toast.error("Failed to load inward entries");
    } finally {
      setLoadingInward(false);
    }
  }, [customerid, potype]);

  // On PO change only AFTER initial hydration
  const prevPo = useRef(null);
  useEffect(() => {
    if (!hydratedRef.current) return;            // skip until load is done
    if (selectedPo === prevPo.current) return;   // skip if unchanged
    prevPo.current = selectedPo;

    // reset items when PO changes after hydration
    setItems([]);
    setSelectedInwards([]);
    setBrnnos("");
    loadInwardDetail(selectedPo);
  }, [selectedPo, loadInwardDetail]);

  // ── 4. Load items on inward change (skip first hydration) ─────────────────
  const loadItems = useCallback(async (inwards) => {
    if (!inwards.length || !selectedPo || !customerid) { setItems([]); return; }
    setLoadingItems(true);
    try {
      const inwardParams = inwards.map((i) => `inwardid[]=${encodeURIComponent(i)}`).join("&");
      const base = `customerid=${customerid}&potype=${potype}&ponumber=${encodeURIComponent(selectedPo)}`;
      const [itemsRes, brnRes] = await Promise.all([
        axios.get(`/accounts/get-itemfrom-trf?${base}&${inwardParams}`),
        axios.get(`/accounts/get-testing-brnnumber?${inwardParams}`),
      ]);
      const itemsData = itemsRes.data?.data ?? itemsRes.data ?? {};
      const customerInfo = itemsData.customer ?? null;
      if (customerInfo) setBillingInfo((prev) => ({ ...(prev ?? {}), ...customerInfo }));

      const ch = itemsData.charges ?? {};
      if (ch.freight)      setCharge("freight",       ch.freight);
      if (ch.mobilisation) setCharge("mobilisation",  ch.mobilisation);
      if (ch.witness)      setCharge("witnessnumber", ch.witness);
      if (ch.witness_type) setCharge("witnesstype",   ch.witness_type === 2 || ch.witness_type === "2" ? "%" : "amount");

      const rawItems = itemsData.items ?? [];
      const mapped = (Array.isArray(rawItems) ? rawItems : []).map((item, idx) => ({
        ...item,
        _key:          `item-${idx}-${item.id}`,
        id:            item.id ?? item.item_id,
        invoiceitemid: item.invoiceitemid ?? item.invoice_item_id ?? null,
        name:          item.name ?? "",
        brnno:         item.brn ?? item.brnno ?? "",
        hasMeter:      (item.name ?? "").trim() === "Soil Analysis",
        meter:         parseFloat(item.meter) || 1,
        rate:          parseFloat(item.invoicerate ?? item.total ?? item.rate) || 0,
      }));
      setItems(mapped);
      setHasMeterGlobal(mapped.some((i) => i.hasMeter));

      const brnData   = brnRes.data?.data ?? brnRes.data ?? {};
      const brnString = brnData.brn_list ?? (Array.isArray(brnData.brn_array) ? brnData.brn_array.join(",") : "");
      setBrnnos(typeof brnString === "string" ? brnString : "");
    } catch {
      toast.error("Failed to load invoice items");
    } finally {
      setLoadingItems(false);
    }
  }, [customerid, selectedPo, potype]);

  // Only call loadItems on inward selection change made BY THE USER (not hydration)
  const handleInwardChange = (vals) => {
    setSelectedInwards(vals);
    loadItems(vals);
  };

  // Remove item row (PHP: X button)
  const handleRemoveItem = (itemKey, brnno) => {
    setItems((prev) => {
      const next = prev.filter((i) => i._key !== itemKey);
      setHasMeterGlobal(next.some((i) => i.hasMeter));
      return next;
    });
    if (brnno) {
      setBrnnos((prev) =>
        prev.split(",").filter((b) => b.trim() && b.trim() !== String(brnno).trim()).join(","),
      );
    }
  };

  // ── 5. Submit → POST /accounts/update-testing-invoice ─────────────────────
  const handleSubmit = async () => {
    if (!customerid)          return toast.error("Please select a customer");
    if (!selectedPo)          return toast.error("Please select a PO Number");
    if (!selectedInwards.length) return toast.error("Please select at least one Inward Entry");
    if (!items.length)        return toast.error("No items found");

    setSaving(true);
    try {
      const payload = {
        id:           Number(id),               // UPDATE needs the invoice id
        customerid:   Number(customerid),
        ponumber:     selectedPo,
        inwardid:     selectedInwards.map(Number),
        customername: billingInfo?.name ?? "",
        addressid:    Number(billingInfo?.addressid ?? 0),
        address:      billingInfo?.address ?? "",
        statecode:    Number(billingInfo?.statecode ?? 0),
        pan:          billingInfo?.pan ?? "",
        gstno:        billingInfo?.gstno ?? "",
        invoicedate:  toSlashDate(invoicedate),

        // PHP: itemid[], itemrate[], invoiceitemid[] sent together
        itemid:        items.map((i) => Number(i.id)),
        itemrate:      items.map((i) => parseFloat(i.rate) || 0),
        invoiceitemid: items.map((i) => Number(i.invoiceitemid ?? 0)),

        subtotal:        totals.subtotal,
        discnumber:      parseFloat(charges.discnumber)     || 0,
        disctype:        charges.disctype,
        discount:        totals.discount,
        freight:         parseFloat(charges.freight)        || 0,
        mobilisation:    parseFloat(charges.mobilisation)   || 0,
        witnessnumber:   parseFloat(charges.witnessnumber)  || 0,
        witnesstype:     charges.witnesstype,
        witnesscharges:  totals.witnesscharges,
        samplehandling:  parseFloat(charges.samplehandling) || 0,
        sampleprep:      parseFloat(charges.sampleprep)     || 0,
        subtotal2:       totals.subtotal2,

        cgstper:     isSgst  ? parseFloat(charges.cgstper)  || 0 : 0,
        cgstamount:  totals.cgstamount,
        sgstper:     isSgst  ? parseFloat(charges.sgstper)  || 0 : 0,
        sgstamount:  totals.sgstamount,
        igstper:     !isSgst ? parseFloat(charges.igstper)  || 0 : 0,
        igstamount:  totals.igstamount,

        total:      totals.total,
        roundoff:   totals.roundoff,
        finaltotal: totals.finaltotal,

        remark,
        brnnos,
      };

      const res = await axios.post("/accounts/update-testing-invoice", payload);
      const ok =
        res.data.success === true  ||
        res.data.status  === true  ||
        res.data.status  === "true" ||
        res.data.status  === 1;

      if (ok) {
        toast.success(res.data.message ?? "Invoice updated successfully ✅");
        navigate("/dashboards/accounts/testing-invoices");
      } else {
        toast.error(res.data.message ?? "Failed to update invoice");
      }
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message ?? "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  if (initialLoading) return <Page title="Edit Testing Invoice"><PageSpinner /></Page>;

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <Page title="Edit Testing Invoice">
      <div className="transition-content px-[var(--margin-x)] pb-10">

        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="dark:text-dark-100 text-base font-semibold text-gray-800">
            Edit Testing Invoice
            {invoiceNo && (
              <span className="ml-2 rounded bg-blue-100 px-2 py-0.5 text-xs font-mono text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                {invoiceNo}
              </span>
            )}
          </h2>
          <button
            onClick={() => navigate("/dashboards/accounts/testing-invoices")}
            className="rounded bg-sky-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-sky-600"
          >
            « Back to Invoice List
          </button>
        </div>

        <Card className="p-6">

          {/* ══ Row 1: Customer / Bill Type / PO / Inward ══ */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className={labelCls}>Customer</label>
              <CustomerSearch customers={customers} value={customerid} onChange={setCustomerid} />
            </div>

            <div>
              <label className={labelCls}>Bill Type</label>
              <select value={potype} onChange={(e) => setPotype(e.target.value)} className={selectCls}>
                <option value="Normal">Normal</option>
                <option value="Fix Cost">Fix Cost</option>
              </select>
            </div>

            <div>
              <label className={labelCls}>Po Number</label>
              {loadingPo
                ? <Spinner text="Loading POs..." />
                : (
                  <select
                    value={selectedPo}
                    onChange={(e) => setSelectedPo(e.target.value)}
                    className={selectCls}
                    disabled={!customerid || ponumbers.length === 0}
                  >
                    <option value="">Select PO</option>
                    {ponumbers.map((p, i) => {
                      const val = typeof p === "string" ? p : (p.ponumber ?? p.value ?? "");
                      return <option key={i} value={val}>{val}</option>;
                    })}
                  </select>
                )}
            </div>

            <div>
              <label className={labelCls}>Inward Entry</label>
              {loadingInward
                ? <Spinner text="Loading entries..." />
                : (
                  <InwardMultiSelect
                    options={inwardOptions}
                    value={selectedInwards}
                    onChange={handleInwardChange}
                    disabled={!selectedPo}
                  />
                )}
            </div>
          </div>

          {/* ══ Billing info panel ══ */}
          {billingInfo && (
            <div className="dark:border-dark-600 mt-5 grid grid-cols-1 gap-5 border-t border-gray-200 pt-4 md:grid-cols-2">
              <div className="text-sm">
                <div className="dark:text-dark-100 font-bold text-gray-900">
                  Customer:<br />{billingInfo.name}
                </div>
                <div className="dark:text-dark-300 mt-1 text-gray-600">
                  <b>Address:</b> {billingInfo.address}
                </div>
                <div className="mt-2 flex flex-wrap gap-x-6">
                  <span><b>State name:</b> {billingInfo.statename ?? billingInfo.statecode}</span>
                  <span><b>State code:</b> {isNaN(Number(billingInfo.statecode)) ? "NA" : billingInfo.statecode}</span>
                </div>
                <div className="flex flex-wrap gap-x-6">
                  <span><b>GSTIN/UIN:</b> {billingInfo.gstno || "—"}</span>
                  <span><b>PAN:</b> {billingInfo.pan || "—"}</span>
                </div>
              </div>

              <div className="text-sm">
                <div><b>Invoice No.:</b> {invoiceNo}</div>
                <div className="mt-1">
                  <label className={labelCls}>Date</label>
                  {/* PHP: editable if permission 464 — always editable in React */}
                  <input
                    type="date"
                    value={invoicedate}
                    onChange={(e) => setInvoicedate(e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div className="mt-1"><b>Ref. No./ Date:</b> {selectedPo}</div>
              </div>
            </div>
          )}

          {/* ══ Items table ══ */}
          {loadingItems
            ? <Spinner text="Loading items..." />
            : items.length > 0 && (
              <div className="dark:border-dark-600 mt-5 border-t border-gray-200 pt-4">
                <div className="overflow-x-auto rounded-md border border-gray-200 dark:border-dark-600">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50 dark:border-dark-600 dark:bg-dark-800">
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">Sr No</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">Description</th>
                        {/* PHP: if meterflag (Soil Analysis) show Meter column */}
                        {hasMeterGlobal && (
                          <th className="px-3 py-2 text-center text-xs font-semibold text-gray-500">Meter</th>
                        )}
                        <th className="px-3 py-2 text-center text-xs font-semibold text-gray-500">Rate</th>
                        <th className="px-3 py-2 text-center text-xs font-semibold text-gray-500"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, idx) => (
                        <tr
                          key={item._key}
                          className="border-b border-gray-100 odd:bg-white even:bg-gray-50 dark:border-dark-700 dark:odd:bg-dark-900 dark:even:bg-dark-800"
                        >
                          <td className="px-3 py-2 text-gray-500">{idx + 1}</td>
                          <td className="px-3 py-2">
                            <div className="font-medium text-gray-800 dark:text-dark-100">{item.name}</div>
                            {item.description && <div className="text-xs text-gray-500">{item.description}</div>}
                            {item.brnno && <div className="text-xs text-gray-400">{item.brnno}</div>}
                          </td>

                          {/* PHP: meter input for "Soil Analysis" only */}
                          {hasMeterGlobal && (
                            <td className="px-3 py-2">
                              {item.hasMeter ? (
                                <input
                                  type="number"
                                  value={item.meter}
                                  onChange={(e) =>
                                    setItems((prev) =>
                                      prev.map((it) =>
                                        it._key === item._key ? { ...it, meter: e.target.value } : it,
                                      ),
                                    )
                                  }
                                  className={`${inputCls} w-24`}
                                  min={0}
                                />
                              ) : (
                                <span className="text-gray-400">—</span>
                              )}
                            </td>
                          )}

                          <td className="px-3 py-2">
                            <input
                              type="number"
                              value={item.rate}
                              onChange={(e) =>
                                setItems((prev) =>
                                  prev.map((it) =>
                                    it._key === item._key ? { ...it, rate: e.target.value } : it,
                                  ),
                                )
                              }
                              className={`${inputCls} w-28`}
                              min={0}
                            />
                          </td>

                          <td className="px-3 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item._key, item.brnno)}
                              className="rounded bg-red-100 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-200"
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          }

          {/* ══ PHP: sumamount() — charge inputs + auto-calculated totals ══ */}
          {billingInfo && (
            <div className="dark:border-dark-600 mt-5 border-t border-gray-200 pt-4">
              <div className="ml-auto max-w-lg space-y-2">

                {/* Subtotal (auto) */}
                <div className="flex items-center gap-3">
                  <label className="w-60 text-right text-sm text-gray-600 dark:text-dark-400">Subtotal</label>
                  <input readOnly value={totals.subtotal.toFixed(2)} className={`${roInputCls} flex-1`} />
                </div>

                {/* Discount */}
                <div className="flex items-center gap-3">
                  <label className="w-60 text-right text-sm text-gray-600 dark:text-dark-400">Discount</label>
                  <input
                    type="number" min={0}
                    value={charges.discnumber}
                    onChange={(e) => setCharge("discnumber", e.target.value)}
                    className={`${inputCls} w-24`}
                  />
                  <select value={charges.disctype} onChange={(e) => setCharge("disctype", e.target.value)} className={`${selectCls} w-20`}>
                    <option value="amount">₹</option>
                    <option value="%">%</option>
                  </select>
                  <input readOnly value={totals.discount.toFixed(2)} className={`${roInputCls} flex-1`} />
                </div>

                {/* Freight */}
                <div className="flex items-center gap-3">
                  <label className="w-60 text-right text-sm text-gray-600 dark:text-dark-400">Freight Charges</label>
                  <input type="number" min={0} value={charges.freight} onChange={(e) => setCharge("freight", e.target.value)} className={`${inputCls} flex-1`} />
                </div>

                {/* Mobilisation */}
                <div className="flex items-center gap-3">
                  <label className="w-60 text-right text-sm text-gray-600 dark:text-dark-400">Mobilization &amp; Demobilization</label>
                  <input type="number" min={0} value={charges.mobilisation} onChange={(e) => setCharge("mobilisation", e.target.value)} className={`${inputCls} flex-1`} />
                </div>

                {/* Witness Charges */}
                <div className="flex items-center gap-3">
                  <label className="w-60 text-right text-sm text-gray-600 dark:text-dark-400">Witness Charges</label>
                  <input type="number" min={0} value={charges.witnessnumber} onChange={(e) => setCharge("witnessnumber", e.target.value)} className={`${inputCls} w-24`} />
                  <select value={charges.witnesstype} onChange={(e) => setCharge("witnesstype", e.target.value)} className={`${selectCls} w-20`}>
                    <option value="amount">₹</option>
                    <option value="%">%</option>
                  </select>
                  <input readOnly value={totals.witnesscharges.toFixed(2)} className={`${roInputCls} flex-1`} />
                </div>

                {/* Sample Handling */}
                <div className="flex items-center gap-3">
                  <label className="w-60 text-right text-sm text-gray-600 dark:text-dark-400">Sample Handling</label>
                  <input type="number" min={0} value={charges.samplehandling} onChange={(e) => setCharge("samplehandling", e.target.value)} className={`${inputCls} flex-1`} />
                </div>

                {/* Sample Prep */}
                <div className="flex items-center gap-3">
                  <label className="w-60 text-right text-sm text-gray-600 dark:text-dark-400">Sample Preparation Charges</label>
                  <input type="number" min={0} value={charges.sampleprep} onChange={(e) => setCharge("sampleprep", e.target.value)} className={`${inputCls} flex-1`} />
                </div>

                {/* Subtotal 2 (auto) */}
                <div className="flex items-center gap-3">
                  <label className="w-60 text-right text-sm text-gray-600 dark:text-dark-400">Subtotal</label>
                  <input readOnly value={totals.subtotal2.toFixed(2)} className={`${roInputCls} flex-1`} />
                </div>

                {/* Tax — PHP: sgst==1 → CGST+SGST, else IGST */}
                {isSgst ? (
                  <>
                    <div className="flex items-center gap-3">
                      <label className="w-60 text-right text-sm text-gray-600 dark:text-dark-400">
                        CGST <input type="number" min={0} value={charges.cgstper} onChange={(e) => setCharge("cgstper", e.target.value)} className="mx-1 inline-block w-14 rounded border border-gray-300 px-1 text-sm dark:border-dark-500 dark:bg-dark-900" />%
                      </label>
                      <input readOnly value={totals.cgstamount.toFixed(2)} className={`${roInputCls} flex-1`} />
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="w-60 text-right text-sm text-gray-600 dark:text-dark-400">
                        SGST <input type="number" min={0} value={charges.sgstper} onChange={(e) => setCharge("sgstper", e.target.value)} className="mx-1 inline-block w-14 rounded border border-gray-300 px-1 text-sm dark:border-dark-500 dark:bg-dark-900" />%
                      </label>
                      <input readOnly value={totals.sgstamount.toFixed(2)} className={`${roInputCls} flex-1`} />
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-3">
                    <label className="w-60 text-right text-sm text-gray-600 dark:text-dark-400">
                      IGST <input type="number" min={0} value={charges.igstper} onChange={(e) => setCharge("igstper", e.target.value)} className="mx-1 inline-block w-14 rounded border border-gray-300 px-1 text-sm dark:border-dark-500 dark:bg-dark-900" />%
                    </label>
                    <input readOnly value={totals.igstamount.toFixed(2)} className={`${roInputCls} flex-1`} />
                  </div>
                )}

                {/* Total */}
                <div className="flex items-center gap-3">
                  <label className="w-60 text-right text-sm text-gray-600 dark:text-dark-400">Total</label>
                  <input readOnly value={totals.total.toFixed(2)} className={`${roInputCls} flex-1`} />
                </div>

                {/* Round off */}
                <div className="flex items-center gap-3">
                  <label className="w-60 text-right text-sm text-gray-600 dark:text-dark-400">Round off</label>
                  <input readOnly value={totals.roundoff.toFixed(2)} className={`${roInputCls} flex-1`} />
                </div>

                {/* Final Total */}
                <div className="flex items-center gap-3 rounded-md bg-green-50 px-3 py-2 dark:bg-green-900/20">
                  <label className="w-60 text-right text-sm font-semibold text-green-700 dark:text-green-400">Final Total</label>
                  <input readOnly value={totals.finaltotal.toFixed(2)} className={`${roInputCls} flex-1 font-bold text-green-700 dark:text-green-400`} />
                </div>
              </div>
            </div>
          )}

          {/* ══ Remark + BRN Nos ══ */}
          <div className="dark:border-dark-600 mt-6 grid grid-cols-1 gap-4 border-t border-gray-200 pt-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Remark</label>
              <textarea
                rows={3}
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                className={inputCls}
                placeholder="Remark (optional)"
              />
            </div>
            <div>
              <label className={labelCls}>BRN Nos.</label>
              <textarea
                rows={3}
                value={brnnos}
                onChange={(e) => setBrnnos(e.target.value)}
                className={inputCls}
                placeholder="BRN Numbers"
              />
            </div>
          </div>

          {/* ══ Submit ══ */}
          <div className="mt-6 flex justify-end border-t border-gray-200 pt-4 dark:border-dark-600">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-md bg-green-600 px-6 py-2 text-sm font-semibold text-white shadow hover:bg-green-700 disabled:opacity-60"
            >
              {saving && (
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z" />
                </svg>
              )}
              {saving ? "Updating…" : "Update Invoice"}
            </button>
          </div>

        </Card>
      </div>
    </Page>
  );
}
