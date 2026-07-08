// AddDirectTestingInvoice.jsx
// Route: /dashboards/accounts/testing-invoices/create-advance
//
// PHP files ported:
//   generateDirectInvoiceTesting.php  → main form
//   getpodetailfordirectinvoicetesting.php → customer info + products
//   additemdirecttestinginvoice.php   → add item row
//   insertDirectTestingInvoice.php    → submit
//
// API endpoints:
//   GET  /accounts/get-po-detailfor-directinvoice-testing?customerid=
//   GET  /accounts/get-directinvoice-testing-item?package=
//   POST /accounts/create-testing-invoice

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router";
import axios from "utils/axios";
import { toast } from "sonner";
import { Page } from "components/shared/Page";
import { Card } from "components/ui";

// ─────────────────────────────────────────────────────────────────────────────
// PHP: sumamount() from generateDirectInvoiceTesting.php
// subtotal = sum of (qty * rate) for each item row
// ─────────────────────────────────────────────────────────────────────────────
function calcTotals({ items, charges, isSgst }) {
  // PHP: $('.rate').each → qty * rate per row → sum
  let subtotal = 0;
  items.forEach((item) => {
    const qty = parseFloat(item.qty) || 0;
    const rate = parseFloat(item.rate) || 0;
    subtotal += qty * rate;
  });

  const discnumber = parseFloat(charges.discnumber) || 0;
  const discount =
    charges.disctype === "%" ? (subtotal / 100) * discnumber : discnumber;

  const freight = parseFloat(charges.freight) || 0;
  const mobilisation = parseFloat(charges.mobilisation) || 0;
  const samplehandling = parseFloat(charges.samplehandling) || 0;
  const sampleprep = parseFloat(charges.sampleprep) || 0;

  const witnessnumber = parseFloat(charges.witnessnumber) || 0;
  const witnesscharges =
    charges.witnesstype === "%"
      ? (subtotal / 100) * witnessnumber
      : witnessnumber;

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

// ─── Searchable Product Dropdown ──────────────────────────────────────────────
// PHP: <select id="productadd"> with options from testprices join products
function ProductSearch({ products, value, onChange, disabled }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const selectedName = useMemo(
    () =>
      products.find((p) => String(p.packageid) === String(value))?.display ??
      "",
    [products, value],
  );

  const list = useMemo(() => {
    const q = query.toLowerCase();
    return (
      q ? products.filter((p) => p.display.toLowerCase().includes(q)) : products
    ).slice(0, 60);
  }, [products, query]);

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
        value={open ? query : selectedName}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          if (!e.target.value) onChange("");
        }}
        onFocus={() => {
          if (!disabled) setOpen(true);
        }}
        placeholder={
          disabled ? "Select customer first..." : "Search product..."
        }
        className={`${inputCls} ${disabled ? "cursor-not-allowed bg-gray-50" : ""}`}
        disabled={disabled}
        autoComplete="off"
      />
      {value && !open && !disabled && (
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
      {open && !disabled && (
        <div className="dark:bg-dark-800 dark:border-dark-600 absolute z-50 mt-1 max-h-72 w-full overflow-y-auto rounded-md border border-gray-200 bg-white shadow-xl">
          {list.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-400">
              No products found
            </div>
          ) : (
            list.map((p) => (
              <div
                key={p.packageid}
                onMouseDown={() => {
                  onChange(String(p.packageid));
                  setQuery("");
                  setOpen(false);
                }}
                className={`dark:hover:bg-dark-700 cursor-pointer px-3 py-2 text-xs hover:bg-blue-50 ${
                  String(p.packageid) === String(value)
                    ? "bg-blue-50 font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    : "dark:text-dark-200 text-gray-700"
                }`}
              >
                <div className="truncate">{p.display}</div>
                <div className="text-gray-400">₹{p.rate?.toLocaleString()}</div>
              </div>
            ))
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
export default function AddDirectTestingInvoice() {
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
  const [poDetail, setPoDetail] = useState(null); // PHP: $rowbillingcustomer + addresses + products
  const [ponumber, setPonumber] = useState(""); // PHP: manual text input
  const [addressid, setAddressid] = useState("");
  const [addressText, setAddressText] = useState("");

  // PHP: items array managed by additem() + removeItem()
  const [items, setItems] = useState([]);
  // PHP: var items = new Array() — track added packageids to prevent duplicates
  const [addedPackageIds, setAddedPackageIds] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(""); // productadd dropdown

  const [invoicedate, setInvoicedate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [remark, setRemark] = useState("");

  const [charges, setCharges] = useState({
    discnumber: 0,
    disctype: "amount",
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
  const [loadingPoDetail, setLoadingPoDetail] = useState(false);
  const [loadingItem, setLoadingItem] = useState(false);
  const [saving, setSaving] = useState(false);

  // PHP: $sgst = ($statecode == $companystatecode) — using 23 as company statecode
  const isSgst = useMemo(
    () => String(poDetail?.customer?.statecode ?? "").trim() === "23",
    [poDetail],
  );

  const totals = useMemo(
    () => calcTotals({ items, charges, isSgst }),
    [items, charges, isSgst],
  );

  // ── 1. Load customers ──────────────────────────────────────────────────────
  useEffect(() => {
    axios
      .get("/people/get-all-customers")
      .then((r) => setCustomers(r.data.data ?? r.data ?? []))
      .catch(() => toast.error("Failed to load customers"))
      .finally(() => setLoadingCustomers(false));
  }, []);

  // ── 2. PHP: getpodetailfordirectinvoicetesting.php ─────────────────────────
  // GET /accounts/get-po-detailfor-directinvoice-testing?customerid=
  // Returns: {
  //   po: { value, readonly },
  //   customer: { id, name, gstno, pan, statecode },
  //   addresses: [{ id, display, full_address }],
  //   tax: { sgst_applicable, default_cgst, default_sgst, default_igst },
  //   products: [{ packageid, display, rate }],
  //   defaults: { invoicedate, freight, mobilisation, witnesscharges, discount }
  // }
  const loadPoDetail = useCallback(async (cid) => {
    setPoDetail(null);
    setPonumber("");
    setAddressid("");
    setAddressText("");
    setItems([]);
    setAddedPackageIds([]);
    setSelectedPackage("");
    if (!cid) return;
    setLoadingPoDetail(true);
    try {
      const res = await axios.get(
        `/accounts/get-po-detailfor-directinvoice-testing?customerid=${cid}`,
      );
      const d = res.data?.data ?? res.data ?? {};
      setPoDetail(d);

      // PHP: apply defaults from billing customer
      if (d.defaults) {
        if (d.defaults.freight) setCharge("freight", d.defaults.freight);
        if (d.defaults.mobilisation)
          setCharge("mobilisation", d.defaults.mobilisation);
        if (d.defaults.witnesscharges)
          setCharge("witnessnumber", d.defaults.witnesscharges);
        if (d.defaults.discount) {
          setCharge("discnumber", d.defaults.discount);
          setCharge("disctype", "%");
        }
      }

      // Apply tax defaults
      if (d.tax) {
        setCharge("cgstper", d.tax.default_cgst ?? 9);
        setCharge("sgstper", d.tax.default_sgst ?? 9);
        setCharge("igstper", d.tax.default_igst ?? 18);
      }

      // PHP: if FOC → pre-fill ponumber as "FOC" readonly
      if (d.po?.value) setPonumber(d.po.value);
    } catch {
      toast.error("Failed to load customer details");
    } finally {
      setLoadingPoDetail(false);
    }
  }, []);

  useEffect(() => {
    loadPoDetail(customerid);
  }, [customerid, loadPoDetail]);

  // Update address text when addressid changes
  useEffect(() => {
    if (!addressid || !poDetail?.addresses) {
      setAddressText("");
      return;
    }
    const found = poDetail.addresses.find(
      (a) => String(a.id) === String(addressid),
    );
    setAddressText(found?.full_address ?? "");
  }, [addressid, poDetail]);

  // ── 3. PHP: additemdirecttestinginvoice.php ────────────────────────────────
  // GET /accounts/get-directinvoice-testing-item?package=
  // Returns: {
  //   description: "ProductName\nPackageDesc",
  //   item: { qty: 1, rate, amount },
  //   hidden_fields: { itemname, itempackagedesc, iteminstid, itempricematrixid }
  // }
  const handleAddItem = useCallback(async () => {
    if (!selectedPackage) {
      toast.error("Select a product first");
      return;
    }
    // PHP: if(items.includes(productadd)) → alert("item Already Added")
    if (addedPackageIds.includes(selectedPackage)) {
      toast.error("Item already added");
      return;
    }
    setLoadingItem(true);
    try {
      const res = await axios.get(
        `/accounts/get-directinvoice-testing-item?package=${selectedPackage}`,
      );
      const d = res.data?.data ?? res.data ?? {};

      // Normalize response: supports both flat and nested formats
      const hiddenFields = d.hidden_fields ?? {};
      const itemData = d.item ?? {};

      const newItem = {
        _key: `item-${selectedPackage}-${Date.now()}`,
        packageid: String(selectedPackage),
        // PHP: $rowproduct['name']."<br>".$rowpackage['description']
        description: d.description ?? "",
        itemname: hiddenFields.itemname ?? d.name ?? "",
        itempackagedesc:
          hiddenFields.itempackagedesc ?? d.package_description ?? "",
        iteminstid: hiddenFields.iteminstid ?? d.instid ?? 0,
        itempricematrixid:
          hiddenFields.itempricematrixid ?? Number(selectedPackage),
        qty: itemData.qty ?? 1,
        rate: itemData.rate ?? d.rate ?? 0,
        // PHP: amount = qty * rate (recalculated on change)
        amount:
          itemData.amount ??
          (itemData.qty ?? 1) * (itemData.rate ?? d.rate ?? 0),
      };

      // PHP: items.push(productadd)
      setAddedPackageIds((prev) => [...prev, selectedPackage]);
      setItems((prev) => [...prev, newItem]);
      setSelectedPackage("");
    } catch {
      toast.error("Failed to fetch item details");
    } finally {
      setLoadingItem(false);
    }
  }, [selectedPackage, addedPackageIds]);

  // PHP: function removeItem(obj, packageid)
  const handleRemoveItem = (key, packageid) => {
    setItems((prev) => prev.filter((i) => i._key !== key));
    // PHP: items = items.filter(e => e !== packageid)
    setAddedPackageIds((prev) => prev.filter((id) => id !== packageid));
  };

  // Update item qty/rate and recalculate amount
  const updateItem = (key, field, val) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item._key !== key) return item;
        const updated = { ...item, [field]: val };
        // PHP: finalamount = qty * rate
        updated.amount =
          (parseFloat(updated.qty) || 0) * (parseFloat(updated.rate) || 0);
        return updated;
      }),
    );
  };

  // ── 4. PHP: insertDirectTestingInvoice.php ─────────────────────────────────
  // POST /api/accounts/add-direct-testing-invoice
  const handleSubmit = async () => {
    if (!customerid) return toast.error("Please select a customer");
    if (!ponumber.trim()) return toast.error("Please enter PO Number");
    if (!addressid) return toast.error("Please select customer address");
    if (!items.length) return toast.error("Please add at least one item");

    setSaving(true);
    try {
      const customer = poDetail?.customer ?? {};

      const payload = {
        // PHP: $x['customerid'] = $_POST['customerid']
        customerid: Number(customerid),
        addressid: Number(addressid),
        customername: customer.name ?? "",
        address: addressText,
        statecode: customer.statecode ?? "",
        pan: customer.pan ?? "",
        gstno: customer.gstno ?? "",
        ponumber: ponumber.trim(),
        typeofinvoice: "Testing",
        invoicedate: toSlashDate(invoicedate),

        // PHP: foreach $_POST['itempricematrixid'] as $key => $value
        itempricematrixid: items.map((i) => Number(i.itempricematrixid)),
        iteminstid: items.map((i) => Number(i.iteminstid)),
        itemname: items.map((i) => i.itemname),
        itempackagedesc: items.map((i) => i.itempackagedesc),
        itemqty: items.map((i) => parseFloat(i.qty) || 0),
        itemrate: items.map((i) => parseFloat(i.rate) || 0),
        itemamount: items.map((i) => parseFloat(i.amount) || 0),

        // PHP: sumamount() calculated fields
        subtotal: totals.subtotal,
        disctype: charges.disctype,
        discnumber: parseFloat(charges.discnumber) || 0,
        discount: totals.discount,
        subtotal2: totals.subtotal2,

        cgstper: isSgst ? parseFloat(charges.cgstper) || 0 : 0,
        cgstamount: totals.cgstamount,
        sgstper: isSgst ? parseFloat(charges.sgstper) || 0 : 0,
        sgstamount: totals.sgstamount,
        igstper: !isSgst ? parseFloat(charges.igstper) || 0 : 0,
        igstamount: totals.igstamount,

        freight: parseFloat(charges.freight) || 0,
        mobilisation: parseFloat(charges.mobilisation) || 0,
        witnessnumber: parseFloat(charges.witnessnumber) || 0,
        witnesstype: charges.witnesstype,
        witnesscharges: totals.witnesscharges,
        samplehandling: parseFloat(charges.samplehandling) || 0,
        sampleprep: parseFloat(charges.sampleprep) || 0,

        total: totals.total,
        roundoff: totals.roundoff,
        finaltotal: totals.finaltotal,

        remark,
        status: 0,
      };

      const res = await axios.post("/accounts/add-direct-testing-invoice", payload);
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

  const products = poDetail?.products ?? [];
  const addresses = poDetail?.addresses ?? [];
  const customer = poDetail?.customer ?? null;
  const isPoReadonly = poDetail?.po?.readonly === true;

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <Page title="Add Direct Testing Invoice">
      <div className="transition-content px-[var(--margin-x)] pb-10">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="dark:text-dark-100 text-base font-semibold text-gray-800">
            Direct Invoice Form
          </h2>
          <button
            onClick={() => navigate("/dashboards/accounts/testing-invoices")}
            className="rounded bg-sky-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-sky-600"
          >
            &laquo; Back to Invoice List
          </button>
        </div>

        <Card className="p-6">
          {/* ══ Row 1: Customer + PO Number ══ */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* PHP: <select name="customerid" onchange="getPoDetail(this.value)"> */}
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

            {/* PHP: <input type="text" name="ponumber" id="ponumber"> */}
            <div>
              <label className={labelCls}>PO Number / Ref No.</label>
              {loadingPoDetail ? (
                <Spinner text="Loading..." />
              ) : (
                <input
                  type="text"
                  value={ponumber}
                  onChange={(e) => setPonumber(e.target.value)}
                  readOnly={isPoReadonly}
                  placeholder="Enter PO Number"
                  className={isPoReadonly ? roInputCls : inputCls}
                  disabled={!customerid}
                />
              )}
            </div>
          </div>

          {/* ══ Customer Details + Address ══ */}
          {customer && (
            <div className="dark:border-dark-600 mt-5 grid grid-cols-1 gap-5 border-t border-gray-200 pt-4 md:grid-cols-2">
              {/* Left: customer info */}
              <div className="text-sm">
                <div className="dark:text-dark-100 font-bold text-gray-900">
                  {customer.name}
                </div>

                {/* PHP: <select name="addressid" onchange="search(...)"> */}
                <div className="mt-3">
                  <label className={labelCls}>Customer Address</label>
                  <select
                    value={addressid}
                    onChange={(e) => setAddressid(e.target.value)}
                    className={selectCls}
                  >
                    <option value="">Select Customer Address</option>
                    {addresses.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.display}
                      </option>
                    ))}
                  </select>
                  {addressText && (
                    <div className="dark:text-dark-400 mt-1 text-xs text-gray-500">
                      {addressText}
                    </div>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs">
                  <span>
                    <b className="dark:text-dark-400 text-gray-500">
                      State code:{" "}
                    </b>
                    {customer.statecode}
                  </span>
                  <span>
                    <b className="dark:text-dark-400 text-gray-500">
                      GSTIN/UIN:{" "}
                    </b>
                    {customer.gstno || "—"}
                  </span>
                  <span>
                    <b className="dark:text-dark-400 text-gray-500">PAN: </b>
                    {customer.pan || "—"}
                  </span>
                </div>
              </div>

              {/* Right: invoice date + tax badge */}
              <div className="space-y-3 text-sm">
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
          {customer && (
            <div className="dark:border-dark-600 mt-5 border-t border-gray-200 pt-4">
              {/* PHP: <table id="itemtable"> */}
              {items.length > 0 && (
                <div className="mb-4 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="dark:bg-dark-700 bg-gray-100">
                        <th className="dark:text-dark-400 px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">
                          Description
                        </th>
                        <th
                          className="dark:text-dark-400 px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase"
                          style={{ width: 90 }}
                        >
                          Qty
                        </th>
                        <th
                          className="dark:text-dark-400 px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase"
                          style={{ width: 120 }}
                        >
                          Rate
                        </th>
                        <th
                          className="dark:text-dark-400 px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase"
                          style={{ width: 120 }}
                        >
                          Amount
                        </th>
                        <th style={{ width: 50 }} />
                      </tr>
                    </thead>
                    <tbody className="dark:divide-dark-600 divide-y divide-gray-100">
                      {items.map((item) => (
                        <tr
                          key={item._key}
                          className="dark:hover:bg-dark-700 itemrow hover:bg-gray-50"
                        >
                          {/* PHP: $rowproduct['name']."<br>".$rowpackage['description'] */}
                          <td className="px-3 py-2">
                            {item.description ? (
                              item.description.split("\n").map((line, i) => (
                                <div
                                  key={i}
                                  className={
                                    i === 0
                                      ? "dark:text-dark-100 font-medium text-gray-800"
                                      : "dark:text-dark-400 text-xs text-gray-500"
                                  }
                                >
                                  {line}
                                </div>
                              ))
                            ) : (
                              <>
                                <div className="dark:text-dark-100 font-medium text-gray-800">
                                  {item.itemname}
                                </div>
                                <div className="dark:text-dark-400 text-xs text-gray-500">
                                  {item.itempackagedesc}
                                </div>
                              </>
                            )}
                          </td>

                          {/* PHP: <input name="itemqty[]" class="qty"> */}
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              min="1"
                              value={item.qty}
                              onChange={(e) =>
                                updateItem(item._key, "qty", e.target.value)
                              }
                              className="dark:bg-dark-900 dark:border-dark-500 dark:text-dark-100 qty w-20 rounded border border-gray-300 px-2 py-1 text-sm"
                            />
                          </td>

                          {/* PHP: <input name="itemrate[]" class="rate"> */}
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.rate}
                              onChange={(e) =>
                                updateItem(item._key, "rate", e.target.value)
                              }
                              className="dark:bg-dark-900 dark:border-dark-500 dark:text-dark-100 rate w-24 rounded border border-gray-300 px-2 py-1 text-sm"
                            />
                          </td>

                          {/* PHP: <input name="itemamount[]" readonly class="amount"> */}
                          <td className="px-3 py-2">
                            <input
                              readOnly
                              value={(parseFloat(item.amount) || 0).toFixed(2)}
                              className={roInputCls + " amount w-24"}
                            />
                          </td>

                          {/* PHP: onclick="removeItem(this, packageid)" */}
                          <td className="px-3 py-2">
                            <button
                              onClick={() =>
                                handleRemoveItem(item._key, item.packageid)
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
              )}

              {/* PHP: <select id="productadd"> + <button onclick="additem()"> */}
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <label className={labelCls}>Add Product</label>
                  <ProductSearch
                    products={products}
                    value={selectedPackage}
                    onChange={setSelectedPackage}
                    disabled={!customer}
                  />
                </div>
                <button
                  onClick={handleAddItem}
                  disabled={loadingItem || !selectedPackage}
                  className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loadingItem ? (
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
                  ) : (
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                  )}
                  Add Item
                </button>
              </div>
            </div>
          )}

          {/* ══ Charges Section ══ */}
          {(customer || items.length > 0) && (
            <div className="dark:border-dark-600 mt-5 space-y-3 border-t border-gray-200 pt-4">
              {/* Subtotal (readonly — calculated from items) */}
              <ChargeRow label="Subtotal">
                <input
                  readOnly
                  value={totals.subtotal.toFixed(2)}
                  className={roInputCls}
                />
              </ChargeRow>

              {/* Discount */}
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

              {/* Witness Charges */}
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

              {/* Tax rows */}
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

          {/* ══ Remark ══ */}
          {customer && (
            <div className="dark:border-dark-600 mt-5 border-t border-gray-200 pt-4">
              <div className="max-w-lg">
                <label className={labelCls}>Remark</label>
                <textarea
                  rows={3}
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  className={`${inputCls} resize-none`}
                  placeholder="Remark"
                />
              </div>
            </div>
          )}

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
