// AddTestingInvoice.jsx
// Route: /dashboards/accounts/testing-invoices/create
//
// PHP files ported:
//   generateInvoiceTesting.php   → main form
//   getpodetailforinvoicetesting.php → PO dropdown
//   fetchCustomerandinwarddetail.php → inward multi-select + billing info
//   getitemfromTrf.php           → items table
//   getTestingInvoiceBrnNos.php  → brnnos textarea
//   insertTestingInvoice.php     → submit
//
// API endpoints (exact as provided):
//   GET /accounts/get-testing-ponumber?customerid=&potype=
//   GET /accounts/get-testing-inwarddetail?customerid=&potype=&ponumber=
//   GET /accounts/get-itemfrom-trf?customerid=&potype=&ponumber=&inwardid[]=
//   GET /accounts/get-testing-brnnumber?inwardid[]=
//   POST /accounts/create-testing-invoice

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router";
import axios from "utils/axios";
import { toast } from "sonner";
import { Page } from "components/shared/Page";
import { Card } from "components/ui";

// ─────────────────────────────────────────────────────────────────────────────
// PHP: sumamount() exact port from generateInvoiceTesting.php
// Key: if itmmeter defined → itemTotal = itemMeter * itemRate
//      else                → itemTotal = itemRate
// ─────────────────────────────────────────────────────────────────────────────
function calcTotals({ items, charges, isSgst, potype }) {
  let subtotal = 0;

  if (potype === "Normal") {
    items.forEach((item) => {
      const rate = parseFloat(item.rate) || 0;
      const meter = parseFloat(item.meter) || 0;
      // PHP: if(typeof itemMeter != 'undefined') subtotal += meter * rate
      subtotal += item.hasMeter ? meter * rate : rate;
    });
  } else {
    // PHP: else { subtotal = $("#subtotal").val(); }
    subtotal = parseFloat(charges.subtotal) || 0;
  }

  // PHP: disctype == "%" → discountamount = (subtotal/100)*discnumber
  const discnumber = parseFloat(charges.discnumber) || 0;
  const discount =
    charges.disctype === "%" ? (subtotal / 100) * discnumber : discnumber;

  const freight = parseFloat(charges.freight) || 0;
  const mobilisation = parseFloat(charges.mobilisation) || 0;
  const samplehandling = parseFloat(charges.samplehandling) || 0;
  const sampleprep = parseFloat(charges.sampleprep) || 0;

  // PHP: witnesstype == "%" → witnesscharges = (subtotal/100)*witnessnumber
  const witnessnumber = parseFloat(charges.witnessnumber) || 0;
  const witnesscharges =
    charges.witnesstype === "%"
      ? (subtotal / 100) * witnessnumber
      : witnessnumber;

  // PHP: subtotal2 = subtotal - discount + freight + mobilisation + witnesscharges + samplehandling + sampleprep
  const subtotal2 =
    subtotal -
    discount +
    freight +
    mobilisation +
    witnesscharges +
    samplehandling +
    sampleprep;

  const cgstper = parseFloat(charges.cgstper) || 0;
  const sgstper = parseFloat(charges.sgstper) || 0;
  const igstper = parseFloat(charges.igstper) || 0;

  // PHP: if sgst==1 → cgst+sgst; else → igst
  const cgstamount = isSgst
    ? parseFloat(((subtotal2 / 100) * cgstper).toFixed(2))
    : 0;
  const sgstamount = isSgst
    ? parseFloat(((subtotal2 / 100) * sgstper).toFixed(2))
    : 0;
  const igstamount = !isSgst
    ? parseFloat(((subtotal2 / 100) * igstper).toFixed(2))
    : 0;

  // PHP: totalamount = subtotal2 + cgst + sgst + igst
  const total = parseFloat(
    (subtotal2 + cgstamount + sgstamount + igstamount).toFixed(2),
  );
  const finaltotal = Math.round(total);
  const roundoff = parseFloat((finaltotal - total).toFixed(2));

  return {
    subtotal: parseFloat(subtotal.toFixed(2)),
    discount: parseFloat(discount.toFixed(2)),
    witnesscharges: parseFloat(witnesscharges.toFixed(2)),
    subtotal2: parseFloat(subtotal2.toFixed(2)),
    cgstamount,
    sgstamount,
    igstamount,
    total,
    finaltotal,
    roundoff,
  };
}

// PHP: changedateformate → dd/mm/YYYY (sent to insertTestingInvoice.php)
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
        <div className="dark:bg-dark-800 dark:border-dark-600 absolute z-50 mt-1 max-h-60 min-w-[400px] overflow-y-auto rounded-md border border-gray-200 bg-white shadow-xl">
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

// ─── Inward Multi-Select (chips + checkbox dropdown) ──────────────────────────
// PHP: <select multiple name="inwardid[]"> with options like "0407(15/01/2022)"
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
                  {/* PHP: sprintf("%04d",$id)."(".$date.")" */}
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
export default function AddTestingInvoice() {
  const navigate = useNavigate();
  const permissions = JSON.parse(localStorage.getItem("userPermissions") || "[]");

  useEffect(() => {
    if (!permissions.includes(165)) {
      navigate("/dashboards");
    }
  }, [navigate, permissions]);

  // ── State ──────────────────────────────────────────────────────────────────
  const [customers, setCustomers] = useState([]);
  const [customerid, setCustomerid] = useState("");
  const [potype, setPotype] = useState("Normal");
  const [ponumbers, setPonumbers] = useState([]);
  const [selectedPo, setSelectedPo] = useState("");
  const [inwardOptions, setInwardOptions] = useState([]);
  const [selectedInwards, setSelectedInwards] = useState([]);
  const [items, setItems] = useState([]);
  const [brnnos, setBrnnos] = useState("");
  const [remark, setRemark] = useState("");
  const [billingInfo, setBillingInfo] = useState(null); // PHP: $rowbillingcustomer
  const [invoicedate, setInvoicedate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [hasMeterGlobal, setHasMeterGlobal] = useState(false); // PHP: $meterflag

  // PHP: sumamount() charge fields
  const [charges, setCharges] = useState({
    subtotal: 0,
    discnumber: 0,
    disctype: "amount", // PHP default: ₹
    mobilisation: 0,
    freight: 0,
    witnesstype: "amount",
    witnessnumber: 0,
    samplehandling: 0,
    sampleprep: 0,
    cgstper: 9,
    sgstper: 9,
    igstper: 18,
  });
  const setCharge = (k, v) => setCharges((p) => ({ ...p, [k]: v }));

  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [loadingPo, setLoadingPo] = useState(false);
  const [loadingInward, setLoadingInward] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const [saving, setSaving] = useState(false);

  // PHP: $sgst = ($statecode == 23)
  const isSgst = useMemo(
    () => String(billingInfo?.statecode ?? "").trim() === "23",
    [billingInfo],
  );

  const totals = useMemo(
    () => calcTotals({ items, charges, isSgst, potype }),
    [items, charges, isSgst, potype],
  );

  // ── 1. Load customers ──────────────────────────────────────────────────────
  useEffect(() => {
    axios
      .get("/people/get-all-customers")
      .then((r) => setCustomers(r.data.data ?? r.data ?? []))
      .catch(() => toast.error("Failed to load customers"))
      .finally(() => setLoadingCustomers(false));
  }, []);

  // ── 2. PHP: getpodetailforinvoicetesting.php ───────────────────────────────
  // GET /accounts/get-testing-ponumber?customerid=&potype=
  // Returns: [{ ponumber: "..." }]
  const loadPoNumbers = useCallback(
    async (cid) => {
      setPonumbers([]);
      setSelectedPo("");
      setInwardOptions([]);
      setSelectedInwards([]);
      setItems([]);
      setBrnnos("");
      setBillingInfo(null);
      setHasMeterGlobal(false);
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
    },
    [potype],
  );

  useEffect(() => {
    loadPoNumbers(customerid);
  }, [customerid, potype, loadPoNumbers]);

  // ── 3. PHP: fetchCustomerandinwarddetail.php ───────────────────────────────
  // GET /accounts/get-testing-inwarddetail?customerid=&potype=&ponumber=
  // Returns: {
  //   inwards: [{ id, label }] OR [{ id, display }],
  //   customer: { name, address, statecode, gstno, pan, addressid }
  //   gstno, statecode  ← sometimes at top level
  // }
  const loadInwardDetail = useCallback(
    async (po) => {
      setInwardOptions([]);
      setSelectedInwards([]);
      setItems([]);
      setBrnnos("");
      setBillingInfo(null);
      setHasMeterGlobal(false);
      if (!po || !customerid) return;
      setLoadingInward(true);
      try {
        const res = await axios.get(
          `/accounts/get-testing-inwarddetail?customerid=${customerid}&potype=${potype}&ponumber=${encodeURIComponent(po)}`,
        );
        // Response: { status, data: { inwards: [{id, display}], gstno, statecode } }
        const d = res.data?.data ?? res.data ?? {};
        setInwardOptions(Array.isArray(d.inwards) ? d.inwards : []);
        // statecode/gstno are at top level of data (no nested customer object)
        if (d.statecode || d.gstno) {
          setBillingInfo((prev) => ({
            ...(prev ?? {}),
            statecode: d.statecode ?? "",
            gstno: d.gstno ?? "",
          }));
        }
      } catch {
        toast.error("Failed to load inward entries");
      } finally {
        setLoadingInward(false);
      }
    },
    [customerid, potype],
  );

  useEffect(() => {
    loadInwardDetail(selectedPo);
  }, [selectedPo, loadInwardDetail]);

  // ── 4. PHP: getitemfromTrf.php + getTestingInvoiceBrnNos.php ──────────────
  // GET /accounts/get-itemfrom-trf?customerid=&potype=&ponumber=&inwardid[]=
  // Returns: {
  //   customer: { name, address, statecode, gstno, pan, addressid, ... },
  //   items: [{ id, name, description, total, brn, package, trf, ... }]
  // }
  //
  // GET /accounts/get-testing-brnnumber?inwardid[]=
  // Returns: { brn_list: "BRN1,BRN2", brn_array: [...] }
  //          OR plain string "BRN1,BRN2"
  const loadItems = useCallback(
    async (inwards) => {
      setItems([]);
      setBrnnos("");
      setHasMeterGlobal(false);
      if (!inwards.length || !selectedPo || !customerid) return;
      setLoadingItems(true);
      try {
        // Build inwardid[] query params
        const inwardParams = inwards
          .map((i) => `inwardid[]=${encodeURIComponent(i)}`)
          .join("&");
        const base = `customerid=${customerid}&potype=${potype}&ponumber=${encodeURIComponent(selectedPo)}`;

        const [itemsRes, brnRes] = await Promise.all([
          axios.get(`/accounts/get-itemfrom-trf?${base}&${inwardParams}`),
          axios.get(`/accounts/get-testing-brnnumber?${inwardParams}`),
        ]);

        // Response: { status, data: { customer, invoice_meta, charges, items } }
        const itemsData = itemsRes.data?.data ?? itemsRes.data ?? {};

        // customer: { id, name, address, statecode, gstno, pan }
        const customerInfo = itemsData.customer ?? null;
        if (customerInfo) {
          setBillingInfo((prev) => ({
            ...(prev ?? {}),
            ...customerInfo,
          }));
        }

        // charges: { freight, mobilisation, witness, witness_type }
        const ch = itemsData.charges ?? {};
        if (ch.freight) setCharge("freight", ch.freight);
        if (ch.mobilisation) setCharge("mobilisation", ch.mobilisation);
        if (ch.witness) setCharge("witnessnumber", ch.witness);
        if (ch.witness_type) {
          setCharge(
            "witnesstype",
            ch.witness_type === 2 || ch.witness_type === "2" ? "%" : "amount",
          );
        }

        // invoice_meta: { invoice_date, sgst_applicable }
        // (sgst is derived from statecode === "23", no override needed)

        const rawItems = itemsData.items ?? [];
        const mapped = (Array.isArray(rawItems) ? rawItems : []).map(
          (item, idx) => ({
            ...item,
            _key: `item-${idx}-${item.id}`,
            id: item.id ?? item.item_id,
            name: item.name ?? "",
            brnno: item.brn ?? item.brnno ?? "",
            hasMeter: (item.name ?? "").trim() === "Soil Analysis",
            meter: item.meter ?? 1,
            rate: item.invoicerate ?? item.total ?? item.rate ?? 0,
          }),
        );

        setItems(mapped);
        setHasMeterGlobal(mapped.some((i) => i.hasMeter));

        // Response: { status, data: { brn_list: "X,Y", brn_array: [...] } }
        const brnData = brnRes.data?.data ?? brnRes.data ?? {};
        const brnString =
          brnData.brn_list ??
          (Array.isArray(brnData.brn_array) ? brnData.brn_array.join(",") : "");
        setBrnnos(typeof brnString === "string" ? brnString : "");
      } catch {
        toast.error("Failed to load invoice items");
      } finally {
        setLoadingItems(false);
      }
    },
    [customerid, selectedPo, potype],
  );

  // PHP: onchange="getServiceReportDetailAndUpdateBrnnos(ponumber, customerid)"
  const handleInwardChange = (vals) => {
    setSelectedInwards(vals);
    loadItems(vals);
  };

  // PHP: X button → remove item + removeBrn()
  const handleRemoveItem = (itemKey, brnno) => {
    setItems((prev) => {
      const next = prev.filter((i) => i._key !== itemKey);
      setHasMeterGlobal(next.some((i) => i.hasMeter));
      return next;
    });
    if (brnno) {
      setBrnnos((prev) =>
        prev
          .split(",")
          .filter((b) => b.trim() && b.trim() !== String(brnno).trim())
          .join(","),
      );
    }
  };

  // ── 5. PHP: insertTestingInvoice.php ──────────────────────────────────────
  // POST /accounts/create-testing-invoice
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
        potype,
        ponumber: selectedPo,
        inwardid: selectedInwards.map(Number),
        customername: billingInfo?.name ?? "",
        addressid: Number(billingInfo?.addressid ?? 0),
        address: billingInfo?.address ?? "",
        invoicedate: toSlashDate(invoicedate),
        statecode: Number(billingInfo?.statecode ?? 0),
        pan: billingInfo?.pan ?? "",
        gstno: billingInfo?.gstno ?? "",

        itemid: items.map((i) => Number(i.id)),
        itemrate: items.map((i) =>
          potype === "Normal" ? parseFloat(i.rate) || 0 : 0,
        ),
        itemmeter: items.map((i) => parseFloat(i.meter) || 1),

        subtotal: totals.subtotal,
        discnumber: parseFloat(charges.discnumber) || 0,
        disctype: charges.disctype,
        discount: totals.discount,
        freight: parseFloat(charges.freight) || 0,
        mobilisation: parseFloat(charges.mobilisation) || 0,
        witnessnumber: parseFloat(charges.witnessnumber) || 0,
        witnesstype: charges.witnesstype,
        witnesscharges: totals.witnesscharges,
        samplehandling: parseFloat(charges.samplehandling) || 0,
        sampleprep: parseFloat(charges.sampleprep) || 0,
        subtotal2: totals.subtotal2,

        cgstper: isSgst ? parseFloat(charges.cgstper) || 0 : 0,
        cgstamount: totals.cgstamount,
        sgstper: isSgst ? parseFloat(charges.sgstper) || 0 : 0,
        sgstamount: totals.sgstamount,
        igstper: !isSgst ? parseFloat(charges.igstper) || 0 : 0,
        igstamount: totals.igstamount,

        total: totals.total,
        roundoff: totals.roundoff,
        finaltotal: totals.finaltotal,

        remark,
        brnnos,
      };

      const res = await axios.post("/accounts/create-testing-invoice", payload);
      const ok =
        res.data.success === true ||
        res.data.status === true ||
        res.data.status === "true" ||
        res.data.status === 1;

      if (ok) {
        toast.success(res.data.message ?? "Invoice added successfully ✅");
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
    <Page title="Add Testing Invoice">
      <div className="transition-content px-[var(--margin-x)] pb-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="dark:text-dark-100 text-base font-semibold text-gray-800">
            Inward Entry Form
          </h2>
          <button
            onClick={() => navigate("/dashboards/accounts/testing-invoices")}
            className="rounded bg-sky-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-sky-600"
          >
            &laquo; Back to Invoice List
          </button>
        </div>

        <Card className="p-6">
          {/* ══ Row 1: Customer / Bill Type / PO / Inward ══ */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
              <label className={labelCls}>Bill Type</label>
              <select
                value={potype}
                onChange={(e) => setPotype(e.target.value)}
                className={selectCls}
              >
                <option value="Normal">Normal</option>
                <option value="Fix Cost">Fix Cost</option>
              </select>
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

          {/* ══ PHP: $rowbillingcustomer + invoice meta ══ */}
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
                      {hasMeterGlobal && (
                        <th
                          className="dark:text-dark-400 px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase"
                          style={{ width: 100 }}
                        >
                          Meter
                        </th>
                      )}
                      {potype === "Normal" && (
                        <th
                          className="dark:text-dark-400 px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase"
                          style={{ width: 120 }}
                        >
                          Rate
                        </th>
                      )}
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

                        {hasMeterGlobal && (
                          <td className="px-3 py-2">
                            {item.hasMeter ? (
                              <input
                                type="number"
                                min="0"
                                value={item.meter}
                                onChange={(e) =>
                                  setItems((prev) =>
                                    prev.map((it) =>
                                      it._key === item._key
                                        ? { ...it, meter: e.target.value }
                                        : it,
                                    ),
                                  )
                                }
                                className="dark:bg-dark-900 dark:border-dark-500 dark:text-dark-100 itmmeter w-20 rounded border border-gray-300 px-2 py-1 text-sm"
                              />
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                        )}

                        {potype === "Normal" && (
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.rate}
                              onChange={(e) =>
                                setItems((prev) =>
                                  prev.map((it) =>
                                    it._key === item._key
                                      ? { ...it, rate: e.target.value }
                                      : it,
                                  ),
                                )
                              }
                              className="dark:bg-dark-900 dark:border-dark-500 dark:text-dark-100 rate w-24 rounded border border-gray-300 px-2 py-1 text-sm"
                            />
                          </td>
                        )}

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

          {/* ══ Charges ══ */}
          {(billingInfo || items.length > 0) && (
            <div className="dark:border-dark-600 mt-5 space-y-3 border-t border-gray-200 pt-4">
              <ChargeRow label="Subtotal">
                <input
                  type={potype === "Fix Cost" ? "number" : "text"}
                  readOnly={potype === "Normal"}
                  value={
                    potype === "Normal"
                      ? totals.subtotal.toFixed(2)
                      : charges.subtotal
                  }
                  onChange={(e) => setCharge("subtotal", e.target.value)}
                  className={potype === "Normal" ? roInputCls : inputCls}
                />
              </ChargeRow>

              <div className="flex items-center gap-2">
                <div className="w-4/12" />
                <div className="flex w-3/12 items-center justify-end gap-2 pr-4">
                  <label className="dark:text-dark-400 shrink-0 text-sm text-gray-600">
                    Discount
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={charges.discnumber}
                    onChange={(e) => setCharge("discnumber", e.target.value)}
                    className="dark:bg-dark-900 dark:border-dark-500 dark:text-dark-100 w-20 rounded border border-gray-300 px-2 py-1 text-sm"
                  />
                  <select
                    value={charges.disctype}
                    onChange={(e) => setCharge("disctype", e.target.value)}
                    className="dark:bg-dark-900 dark:border-dark-500 dark:text-dark-100 rounded border border-gray-300 px-2 py-1 text-sm"
                  >
                    <option value="amount">₹</option>
                    <option value="%">%</option>
                  </select>
                </div>
                <div className="w-4/12">
                  <input
                    readOnly
                    value={totals.discount.toFixed(2)}
                    className={roInputCls}
                  />
                </div>
              </div>

              <ChargeRow label="Freight Charges">
                <input
                  type="number"
                  min="0"
                  value={charges.freight}
                  onChange={(e) => setCharge("freight", e.target.value)}
                  className={inputCls}
                />
              </ChargeRow>

              <ChargeRow label="Mobilization and Demobilization Charges" wide>
                <input
                  type="number"
                  min="0"
                  value={charges.mobilisation}
                  onChange={(e) => setCharge("mobilisation", e.target.value)}
                  className={inputCls}
                />
              </ChargeRow>

              <div className="flex items-center gap-2">
                <div className="w-4/12" />
                <div className="flex w-3/12 items-center justify-end gap-2 pr-4">
                  <label className="dark:text-dark-400 shrink-0 text-sm text-gray-600">
                    Witness Charges
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={charges.witnessnumber}
                    onChange={(e) => setCharge("witnessnumber", e.target.value)}
                    className="dark:bg-dark-900 dark:border-dark-500 dark:text-dark-100 w-20 rounded border border-gray-300 px-2 py-1 text-sm"
                  />
                  <select
                    value={charges.witnesstype}
                    onChange={(e) => setCharge("witnesstype", e.target.value)}
                    className="dark:bg-dark-900 dark:border-dark-500 dark:text-dark-100 rounded border border-gray-300 px-2 py-1 text-sm"
                  >
                    <option value="amount">₹</option>
                    <option value="%">%</option>
                  </select>
                </div>
                <div className="w-4/12">
                  <input
                    readOnly
                    value={totals.witnesscharges.toFixed(2)}
                    className={roInputCls}
                  />
                </div>
              </div>

              <ChargeRow label="Sample Handling" wide>
                <input
                  type="number"
                  min="0"
                  value={charges.samplehandling}
                  onChange={(e) => setCharge("samplehandling", e.target.value)}
                  className={inputCls}
                />
              </ChargeRow>

              <ChargeRow label="Sample Preparation Charges" wide>
                <input
                  type="number"
                  min="0"
                  value={charges.sampleprep}
                  onChange={(e) => setCharge("sampleprep", e.target.value)}
                  className={inputCls}
                />
              </ChargeRow>

              <ChargeRow label="Subtotal">
                <input
                  readOnly
                  value={totals.subtotal2.toFixed(2)}
                  className={roInputCls}
                />
              </ChargeRow>

              {isSgst ? (
                <>
                  <TaxRow
                    label="Cgst"
                    pct={charges.cgstper}
                    onChange={(v) => setCharge("cgstper", v)}
                    amount={totals.cgstamount.toFixed(2)}
                    roInputCls={roInputCls}
                  />
                  <TaxRow
                    label="Sgst"
                    pct={charges.sgstper}
                    onChange={(v) => setCharge("sgstper", v)}
                    amount={totals.sgstamount.toFixed(2)}
                    roInputCls={roInputCls}
                  />
                </>
              ) : (
                <TaxRow
                  label="Igst"
                  pct={charges.igstper}
                  onChange={(v) => setCharge("igstper", v)}
                  amount={totals.igstamount.toFixed(2)}
                  roInputCls={roInputCls}
                />
              )}

              <ChargeRow label="Total">
                <input
                  readOnly
                  value={totals.total.toFixed(2)}
                  className={roInputCls}
                />
              </ChargeRow>

              <ChargeRow label="Round off">
                <input
                  readOnly
                  value={totals.roundoff.toFixed(2)}
                  className={roInputCls}
                />
              </ChargeRow>

              <div className="flex items-center">
                <div className="w-5/12" />
                <label className="dark:text-dark-300 w-2/12 pr-4 text-right text-sm font-semibold text-gray-700">
                  Final Total
                </label>
                <div className="w-4/12">
                  <input
                    readOnly
                    value={totals.finaltotal}
                    className="dark:bg-dark-800 dark:border-dark-500 w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-bold text-green-700 dark:text-green-400"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ══ Remark + BRN Nos ══ */}
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
              className="inline-flex items-center gap-2 rounded-md bg-green-600 px-8 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
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
                "Add Invoice"
              )}
            </button>
          </div>
        </Card>
      </div>
    </Page>
  );
}

// ─── Layout helpers ───────────────────────────────────────────────────────────
function ChargeRow({ label, wide = false, children }) {
  return (
    <div className="flex items-center">
      <div className={wide ? "w-5/12" : "w-5/12"} />
      <label
        className={`dark:text-dark-400 ${wide ? "w-2/12" : "w-2/12"} pr-4 text-right text-sm text-gray-600`}
      >
        {label}
      </label>
      <div className="w-4/12">{children}</div>
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
