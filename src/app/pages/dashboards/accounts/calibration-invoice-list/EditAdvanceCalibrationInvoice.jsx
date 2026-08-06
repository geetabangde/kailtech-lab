// AddDirectCalibrationInvoice.jsx
// Route: /dashboards/accounts/calibration-invoice-list/add-advance
// PHP port: generateDirectCalibrationInvoice.php → add-direct-calibration-invoice
//
// API flow:
// 1. GET /accounts/get-po-detailfor-directinvice-calibration?customerid=X
//    → returns { customer{}, addresses[], products[], tax_type, default_invoice_date }
// 2. GET /accounts/get-itemdirect-calibrationinvoice?package=<priceid>
//    → returns { item: { itemname, packagename, packagedesc, instid, pricematrixid, location, qty, rate, amount } }
// 3. POST /accounts/add-direct-calibration-invoice

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router";
import axios from "utils/axios";
import { toast } from "sonner";
import { Page } from "components/shared/Page";
import { Card } from "components/ui";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const COMPANY_STATE_CODE = "23"; // PHP: $companystatecode

// ─────────────────────────────────────────────────────────────────────────────
// Style tokens
// ─────────────────────────────────────────────────────────────────────────────
const inputCls =
  "dark:bg-dark-900 dark:border-dark-500 dark:text-dark-100 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400 dark:disabled:bg-dark-800";
const roInputCls =
  "dark:bg-dark-800 dark:border-dark-600 dark:text-dark-200 w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700";

// ─────────────────────────────────────────────────────────────────────────────
// PHP: sumamount() — Direct Invoice (qty × rate)
// ─────────────────────────────────────────────────────────────────────────────
function calcTotals({ items, charges, isSgst }) {
  const subtotal = items.reduce(
    (s, i) => s + (parseFloat(i.qty) || 0) * (parseFloat(i.rate) || 0),
    0,
  );
  const discnumber = parseFloat(charges.discnumber) || 0;
  const mobilisation = parseFloat(charges.mobilisation) || 0;
  const freight = parseFloat(charges.freight) || 0;
  const witnessnumber = parseFloat(charges.witnessnumber) || 0;
  const samplehandling = parseFloat(charges.samplehandling) || 0;
  const sampleprep = parseFloat(charges.sampleprep) || 0;

  const discount =
    charges.disctype === "%" ? (subtotal / 100) * discnumber : discnumber;
  const witnesscharges =
    charges.witnesstype === "%"
      ? (subtotal / 100) * witnessnumber
      : witnessnumber;

  const subtotal2 =
    subtotal -
    discount +
    freight +
    witnesscharges +
    mobilisation +
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

// ─────────────────────────────────────────────────────────────────────────────
// Searchable Customer Dropdown
// ─────────────────────────────────────────────────────────────────────────────
function CustomerSearch({ customers, value, onChange }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  const selectedName = useMemo(() => {
    const c = customers.find((c) => String(c.id) === String(value));
    return c ? c.name : "";
  }, [customers, value]);

  const filtered = useMemo(() => {
    if (!query) return customers.slice(0, 60);
    const q = query.toLowerCase();
    return customers
      .filter((c) => c.name.toLowerCase().includes(q))
      .slice(0, 60);
  }, [customers, query]);

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={wrapRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={open ? query : selectedName}
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
            className="absolute top-1/2 right-2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
            onClick={() => {
              onChange("");
              setQuery("");
            }}
          >
            ✕
          </button>
        )}
      </div>
      {open && (
        <div className="dark:bg-dark-800 dark:border-dark-600 absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-gray-200 bg-white shadow-xl">
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-400">
              No customers found
            </div>
          ) : (
            filtered.map((c) => (
              <div
                key={c.id}
                onMouseDown={() => {
                  onChange(String(c.id));
                  setQuery("");
                  setOpen(false);
                }}
                className={`dark:hover:bg-dark-700 cursor-pointer px-3 py-2 text-sm hover:bg-blue-50 ${
                  String(c.id) === String(value)
                    ? "bg-blue-50 font-semibold text-blue-700"
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

// ─────────────────────────────────────────────────────────────────────────────
// Searchable Package Dropdown
// products[] from API: { id(instid), priceid, name(instname), packagename, rate, location, accreditation }
// ─────────────────────────────────────────────────────────────────────────────
function PackageSearch({ products, value, onChange, disabled }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  // value = String(priceid)
  const selectedName = useMemo(() => {
    const p = products.find((p) => String(p.priceid) === String(value));
    return p ? `${p.name} — ${p.packagename} (${p.location})` : "";
  }, [products, value]);

  const filtered = useMemo(() => {
    if (!query) return products.slice(0, 80);
    const q = query.toLowerCase();
    return products
      .filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.packagename?.toLowerCase().includes(q),
      )
      .slice(0, 80);
  }, [products, query]);

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={wrapRef} className="relative">
      <div className="relative">
        <input
          type="text"
          disabled={disabled}
          value={open ? query : selectedName}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            if (!e.target.value) onChange("");
          }}
          onFocus={() => !disabled && setOpen(true)}
          placeholder={
            disabled
              ? "Select customer first..."
              : "Search product / package..."
          }
          className={inputCls}
          autoComplete="off"
        />
        {value && !open && (
          <button
            type="button"
            className="absolute top-1/2 right-2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
            onClick={() => {
              onChange("");
              setQuery("");
            }}
          >
            ✕
          </button>
        )}
      </div>
      {open && !disabled && (
        <div className="dark:bg-dark-800 dark:border-dark-600 absolute z-50 mt-1 max-h-72 w-full overflow-y-auto rounded-md border border-gray-200 bg-white shadow-xl">
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-400">
              No packages found
            </div>
          ) : (
            filtered.map((p) => (
              <div
                key={p.priceid}
                onMouseDown={() => {
                  onChange(String(p.priceid));
                  setQuery("");
                  setOpen(false);
                }}
                className={`dark:hover:bg-dark-700 cursor-pointer px-3 py-2 text-sm hover:bg-blue-50 ${
                  String(p.priceid) === String(value)
                    ? "bg-blue-50 font-semibold text-blue-700"
                    : "dark:text-dark-200 text-gray-700"
                }`}
              >
                <div className="font-medium">{p.name}</div>
                <div className="mt-0.5 flex items-center gap-2">
                  <span className="text-xs text-gray-400">{p.packagename}</span>
                  <span className="text-xs text-gray-300">·</span>
                  <span className="text-xs text-blue-500">{p.location}</span>
                  <span className="text-xs text-gray-300">·</span>
                  <span className="text-xs font-medium text-green-600">
                    ₹{p.rate}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Searchable Address Dropdown
// addresses[] from API: { id, name, address }
// ─────────────────────────────────────────────────────────────────────────────
function AddressSearch({ addresses, value, onChange, disabled }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  const getLabel = (a) => (a.name ? `${a.name} — ${a.address}` : a.address);

  const selectedLabel = useMemo(() => {
    const a = addresses.find((a) => String(a.id) === String(value));
    return a ? getLabel(a) : "";
  }, [addresses, value]);

  const filtered = useMemo(() => {
    if (!query) return addresses;
    const q = query.toLowerCase();
    return addresses.filter(
      (a) =>
        a.address?.toLowerCase().includes(q) ||
        a.name?.toLowerCase().includes(q),
    );
  }, [addresses, query]);

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={wrapRef} className="relative">
      <div className="relative">
        <input
          type="text"
          disabled={disabled}
          value={open ? query : selectedLabel}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            if (!e.target.value) onChange("");
          }}
          onFocus={() => !disabled && setOpen(true)}
          placeholder={
            disabled ? "Select customer first..." : "Search customer address..."
          }
          className={inputCls}
          autoComplete="off"
        />
        {value && !open && (
          <button
            type="button"
            className="absolute top-1/2 right-2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
            onClick={() => {
              onChange("");
              setQuery("");
            }}
          >
            ✕
          </button>
        )}
      </div>
      {open && !disabled && (
        <div className="dark:bg-dark-800 dark:border-dark-600 absolute z-50 mt-1 max-h-72 w-full overflow-y-auto rounded-md border border-gray-200 bg-white shadow-xl">
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-400">
              No addresses found
            </div>
          ) : (
            filtered.map((a) => (
              <div
                key={a.id}
                onMouseDown={() => {
                  onChange(String(a.id));
                  setQuery("");
                  setOpen(false);
                }}
                className={`cursor-pointer px-3 py-2 text-sm dark:hover:bg-dark-700 hover:bg-blue-50 ${
                  String(a.id) === String(value)
                    ? "bg-blue-50 font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                    : "text-gray-700 dark:text-dark-200"
                }`}
              >
                {a.name && (
                  <div className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                    {a.name}
                  </div>
                )}
                <div className={a.name ? "mt-0.5 text-xs text-gray-500 dark:text-dark-400" : ""}>
                  {a.address}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Spinner
// ─────────────────────────────────────────────────────────────────────────────
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
export default function EditAdvanceCalibrationInvoice() {
  const navigate = useNavigate();
  const { id } = useParams();
  const permissions = JSON.parse(localStorage.getItem("userPermissions") || "[]");

  useEffect(() => {
    if (!permissions.includes(61)) {
      navigate("/dashboards");
    }
  }, [navigate, permissions]);

  // ── State ──────────────────────────────────────────────────────────────────
  const [customers, setCustomers] = useState([]);
  const [customerid, setCustomerid] = useState("");
  const [ponumber, setPonumber] = useState(""); // text input (manual entry)
  const [customer, setCustomer] = useState(null); // { id, name, gstno, pan, statecode }
  const [addresses, setAddresses] = useState([]);
  const [products, setProducts] = useState([]); // from API: products[]
  const [taxType, setTaxType] = useState(""); // "CGST_SGST" | "IGST"
  const [addressid, setAddressid] = useState("");
  const [selectedPkg, setSelectedPkg] = useState(""); // String(priceid)
  const [items, setItems] = useState([]);
  const [invoicedate, setInvoicedate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [remark, setRemark] = useState("");
  const [charges, setCharges] = useState({
    discnumber: 0,
    disctype: "%",
    mobilisation: 0,
    freight: 0,
    witnesstype: "%",
    witnessnumber: 0,
    samplehandling: 0,
    sampleprep: 0,
    cgstper: 9,
    sgstper: 9,
    igstper: 18,
  });
  const setCharge = (k, v) => setCharges((p) => ({ ...p, [k]: v }));

  // Loading flags
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [addingItem, setAddingItem] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ── Derived ────────────────────────────────────────────────────────────────
  // isSgst: from API tax_type OR fallback statecode compare
  const isSgst = useMemo(() => {
    if (taxType === "CGST_SGST") return true;
    if (taxType === "IGST") return false;
    return String(customer?.statecode ?? "") === COMPANY_STATE_CODE;
  }, [taxType, customer]);

  const totals = useMemo(
    () => calcTotals({ items, charges, isSgst }),
    [items, charges, isSgst],
  );

  const selectedAddress = useMemo(
    () => addresses.find((a) => String(a.id) === String(addressid)) || null,
    [addresses, addressid],
  );

  // ── API: Load customers on mount ───────────────────────────────────────────
  useEffect(() => {
    setLoadingCustomers(true);
    axios
      .get("/people/get-all-customers")
      .then((r) => setCustomers(r.data?.data ?? r.data ?? []))
      .catch(() => toast.error("Failed to load customers"))
      .finally(() => setLoadingCustomers(false));
  }, []);

  // ── API: Load existing invoice data on mount ───────────────────────────────
  useEffect(() => {
    if (!id) return;
    setLoadingDetails(true);
    axios.get(`/accounts/get-advance-calibration-invoice/${id}`)
      .then(r => {
        const d = r.data?.data ?? {};
        const inv = d.invoice ?? {};
        const itms = d.items ?? [];
        
        setCustomerid(String(inv.customerid ?? ""));
        setCustomer({
          id: inv.customerid,
          name: inv.customername,
          gstno: inv.gstno,
          pan: inv.pan,
          statecode: inv.statecode
        });
        setPonumber(inv.ponumber ?? "");
        setAddressid(String(inv.addressid ?? ""));
        if (inv.invoicedate) {
           setInvoicedate(inv.invoicedate.split(' ')[0]);
        }
        setRemark(inv.remark ?? "");
        
        setCharges({
          discnumber: inv.discnumber ?? 0,
          disctype: inv.disctype ?? "%",
          mobilisation: inv.mobilisation ?? 0,
          freight: inv.freight ?? 0,
          witnesstype: inv.witnesstype ?? "%",
          witnessnumber: inv.witnessnumber ?? 0,
          samplehandling: inv.samplehandling ?? 0,
          sampleprep: inv.sampleprep ?? 0,
          cgstper: inv.cgstper ?? 9,
          sgstper: inv.sgstper ?? 9,
          igstper: inv.igstper ?? 18,
        });

        const builtItems = itms.map((it, idx) => {
          const descParts = (it.description ?? "").split('<br>');
          return {
            _uid: `item-${idx}`,
            itemname: descParts[0] ?? it.itemname ?? "",
            packagename: it.packagedesc ?? "",
            packagedesc: descParts[1] ?? it.packagedesc ?? "",
            instid: it.instid ?? 0,
            pricematrixid: it.pricematrixid,
            location: it.location ?? "",
            qty: parseFloat(it.qty) || 1,
            rate: parseFloat(it.rate) || 0,
            amount: parseFloat(it.amount) || 0,
          };
        });
        setItems(builtItems);
      })
      .catch(() => toast.error("Failed to load invoice"))
      .finally(() => setLoadingDetails(false));
  }, [id]);

  // ── API: get-po-detailfor-directinvice-calibration when customer changes ───
  // Response: { data: { customer{}, addresses[], products[], tax_type, default_invoice_date } }
  const loadCustomerDetail = useCallback(async (cid, isInit = false) => {
    if (!cid) {
      setCustomer(null);
      setAddresses([]);
      setProducts([]);
      setTaxType("");
      setAddressid("");
      setItems([]);
      return;
    }
    setLoadingDetails(true);
    try {
      const r = await axios.get(
        `/accounts/get-po-detailfor-directinvice-calibration?customerid=${cid}`,
      );
      const d = r.data?.data ?? {};

      setCustomer(d.customer ?? null);
      setAddresses(d.addresses ?? []);
      setProducts(d.products ?? []);
      setTaxType(d.tax_type ?? "");

      if (!isInit) {
        // Auto-select first address
        const firstAddr = d.addresses?.[0];
        setAddressid(firstAddr ? String(firstAddr.id) : "");

        // Set default invoice date from API
        if (d.default_invoice_date) {
          // API returns dd/mm/yyyy → convert to yyyy-mm-dd for input[type=date]
          const parts = d.default_invoice_date.split("/");
          if (parts.length === 3) {
            setInvoicedate(`${parts[2]}-${parts[1]}-${parts[0]}`);
          }
        }

        setItems([]);
        setSelectedPkg("");
      }
    } catch {
      toast.error("Failed to load customer details");
    } finally {
      setLoadingDetails(false);
    }
  }, []);

  const isFirstLoad = useRef(true);

  useEffect(() => {
    if (customerid) {
      loadCustomerDetail(customerid, isFirstLoad.current);
      isFirstLoad.current = false;
    }
  }, [customerid, loadCustomerDetail]);

  // ── API: Add item — GET /accounts/get-itemdirect-calibrationinvoice?package=<priceid> ──
  const handleAddItem = async () => {
    if (!selectedPkg) {
      toast.error("Please select a product/package first");
      return;
    }
    if (items.some((i) => String(i.pricematrixid) === String(selectedPkg))) {
      toast.warning("This product is already added");
      return;
    }
    setAddingItem(true);
    try {
      const r = await axios.get(
        `/accounts/get-itemdirect-calibrationinvoice?package=${selectedPkg}`,
      );
      if (!r.data?.status) {
        toast.error(r.data?.message ?? "Failed to fetch item");
        return;
      }
      const it = r.data.item;
      setItems((prev) => [
        ...prev,
        {
          _uid: Date.now(),
          itemname: it.itemname,
          packagename: it.packagename,
          packagedesc: it.packagedesc ?? it.packagename,
          instid: it.instid,
          pricematrixid: it.pricematrixid,
          location: it.location,
          qty: parseFloat(it.qty) || 1,
          rate: parseFloat(it.rate) || 0,
          amount: parseFloat(it.amount) || 0,
        },
      ]);
      setSelectedPkg("");
      toast.success("Item added");
    } catch {
      toast.error("Failed to fetch item details");
    } finally {
      setAddingItem(false);
    }
  };

  // ── Item qty / rate change → auto-recalc amount ────────────────────────────
  const handleItemChange = (uid, field, val) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it._uid !== uid) return it;
        const updated = { ...it, [field]: val };
        updated.amount = parseFloat(
          (
            (parseFloat(updated.qty) || 0) * (parseFloat(updated.rate) || 0)
          ).toFixed(2),
        );
        return updated;
      }),
    );
  };

  const removeItem = (uid) =>
    setItems((prev) => prev.filter((i) => i._uid !== uid));

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!customerid) {
      toast.error("Please select a customer");
      return;
    }
    if (!ponumber.trim()) {
      toast.error("Please enter PO number");
      return;
    }
    if (!customer) {
      toast.error("Customer billing info not loaded");
      return;
    }
    if (!addressid) {
      toast.error("Please select customer address");
      return;
    }
    if (items.length === 0) {
      toast.error("Please add at least one item");
      return;
    }

    const payload = {
      customerid: Number(customerid),
      ponumber: ponumber.trim(),
      customername: customer.name ?? "",
      addressid: Number(addressid),
      address: selectedAddress?.address ?? "",
      statecode: Number(customer.statecode ?? 0),
      pan: customer.pan ?? "",
      gstno: customer.gstno ?? "",
      invoicedate: toSlashDate(invoicedate),

      // Items
      itemqty: items.map((i) => parseFloat(i.qty) || 0),
      itemrate: items.map((i) => parseFloat(i.rate) || 0),
      itemname: items.map((i) => i.itemname),
      itempackagedesc: items.map((i) => i.packagedesc ?? i.packagename),
      itempricematrixid: items.map((i) => Number(i.pricematrixid)),
      itemamount: items.map((i) => parseFloat(i.amount) || 0),

      // Charges
      subtotal: totals.subtotal,
      disctype: charges.disctype === "%" ? "%" : "amount",
      discnumber: parseFloat(charges.discnumber) || 0,
      discount: totals.discount,
      freight: parseFloat(charges.freight) || 0,
      mobilisation: parseFloat(charges.mobilisation) || 0,
      witnesstype: charges.witnesstype,
      witnessnumber: parseFloat(charges.witnessnumber) || 0,
      witnesscharges: totals.witnesscharges,
      samplehandling: parseFloat(charges.samplehandling) || 0,
      sampleprep: parseFloat(charges.sampleprep) || 0,
      subtotal2: totals.subtotal2,

      // Tax
      cgstper: isSgst ? parseFloat(charges.cgstper) || 0 : 0,
      cgstamount: isSgst ? totals.cgstamount : 0,
      sgstper: isSgst ? parseFloat(charges.sgstper) || 0 : 0,
      sgstamount: isSgst ? totals.sgstamount : 0,
      igstper: !isSgst ? parseFloat(charges.igstper) || 0 : 0,
      igstamount: !isSgst ? totals.igstamount : 0,

      total: totals.total,
      roundoff: totals.roundoff,
      finaltotal: totals.finaltotal,
      remark,
    };

    setSubmitting(true);
    try {
      const r = await axios.post(
        `/accounts/update-direct-calibration-invoice/${id}`,
        payload,
      );
      if (r.data?.status === false) {
        toast.error(r.data?.message ?? "Failed to create invoice");
        return;
      }
      toast.success("Invoice created successfully");
      navigate("/dashboards/accounts/calibration-invoice-list");
    } catch (err) {
      toast.error(
        err?.response?.data?.message ?? "Server error. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <Page title="Edit Advance Calibration Invoice">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="dark:text-dark-100 text-lg font-semibold text-gray-800">
          Edit Advance Invoice #{id}
        </h1>
        <button
          type="button"
          onClick={() =>
            navigate("/dashboards/accounts/calibration-invoice-list")
          }
          className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700"
        >
          ← Back to Invoice List
        </button>
      </div>

      <Card className="p-6">
        {/* ══ Top Section ══ */}
        <div className="space-y-4">
          {/* Customer */}
          <div className="grid grid-cols-12 items-center gap-3">
            <label className="dark:text-dark-400 col-span-2 text-right text-sm font-medium text-gray-600">
              Customer
            </label>
            <div className="col-span-10">
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
          </div>

          {/* PO Number — manual text input */}
          <div className="grid grid-cols-12 items-center gap-3">
            <label className="dark:text-dark-400 col-span-2 text-right text-sm font-medium text-gray-600">
              Po Number/Ref no.
            </label>
            <div className="col-span-10">
              <input
                type="text"
                value={ponumber}
                onChange={(e) => setPonumber(e.target.value)}
                placeholder="Enter PO / Reference number"
                className={inputCls}
              />
            </div>
          </div>

          {/* Customer name — readonly, auto-filled */}
          <div className="grid grid-cols-12 items-center gap-3">
            <label className="dark:text-dark-400 col-span-2 text-right text-sm font-medium text-gray-600">
              Customer
            </label>
            <div className="col-span-10">
              {loadingDetails ? (
                <Spinner text="Loading..." />
              ) : (
                <input
                  readOnly
                  value={customer?.name ?? ""}
                  placeholder="Auto-filled after customer selection"
                  className={roInputCls}
                />
              )}
            </div>
          </div>

          {/* Customer Address */}
          <div className="grid grid-cols-12 items-center gap-3">
            <label className="dark:text-dark-400 col-span-2 text-right text-sm font-medium text-gray-600">
              Customer Address
            </label>
            <div className="col-span-10">
              <AddressSearch
                addresses={addresses}
                value={addressid}
                onChange={setAddressid}
                disabled={addresses.length === 0}
              />
            </div>
          </div>

          {/* State info row */}
          {customer && (
            <div className="grid grid-cols-12 items-center gap-3">
              <div className="col-span-2" />
              <div className="dark:bg-dark-800 col-span-10 grid grid-cols-4 gap-4 rounded-lg bg-gray-50 p-3 text-sm">
                <div>
                  <span className="dark:text-dark-400 font-semibold text-gray-500">
                    State name
                  </span>
                  <div className="dark:text-dark-100 mt-0.5 text-gray-800">
                    Madhya Pradesh
                  </div>
                </div>
                <div>
                  <span className="dark:text-dark-400 font-semibold text-gray-500">
                    State code
                  </span>
                  <div className="dark:text-dark-100 mt-0.5 text-gray-800">
                    {customer.statecode ?? "—"}
                  </div>
                </div>
                <div>
                  <span className="dark:text-dark-400 font-semibold text-gray-500">
                    GSTIN/UIN
                  </span>
                  <div className="dark:text-dark-100 mt-0.5 text-gray-800">
                    {customer.gstno ?? "—"}
                  </div>
                </div>
                <div>
                  <span className="dark:text-dark-400 font-semibold text-gray-500">
                    PAN
                  </span>
                  <div className="dark:text-dark-100 mt-0.5 text-gray-800">
                    {customer.pan ?? "—"}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Invoice Date + Tax badge */}
          <div className="grid grid-cols-12 items-center gap-3">
            <label className="dark:text-dark-400 col-span-2 text-right text-sm font-medium text-gray-600">
              Invoice Date
            </label>
            <div className="col-span-3">
              <input
                type="date"
                value={invoicedate}
                onChange={(e) => setInvoicedate(e.target.value)}
                className={inputCls}
              />
            </div>
            {customer && (
              <div className="col-span-7 flex items-center">
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                    isSgst
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                      : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"
                  }`}
                >
                  {isSgst ? "CGST + SGST Applicable" : "IGST Applicable"}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ══ Items Table ══ */}
        <div className="dark:border-dark-600 mt-6 border-t border-gray-200 pt-6">
          {/* Product selector + Add Item button */}
          <div className="mb-3 flex items-center gap-3">
            <div className="flex-1">
              <PackageSearch
                products={products}
                value={selectedPkg}
                onChange={setSelectedPkg}
                disabled={products.length === 0}
              />
            </div>
            <button
              type="button"
              onClick={handleAddItem}
              disabled={addingItem || !selectedPkg}
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700 disabled:opacity-50"
            >
              {addingItem ? (
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
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              )}
              Add Item
            </button>
          </div>

          {/* Items table */}
          <div className="dark:border-dark-600 overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="dark:bg-dark-800 dark:text-dark-400 bg-gray-50 text-xs font-semibold tracking-wide text-gray-500 uppercase">
                  <th className="w-10 px-4 py-3 text-left">SR NO</th>
                  <th className="px-4 py-3 text-left">DESCRIPTION</th>
                  <th className="w-28 px-4 py-3 text-center">QTY</th>
                  <th className="w-32 px-4 py-3 text-center">RATE</th>
                  <th className="w-32 px-4 py-3 text-right">AMOUNT</th>
                  <th className="w-12 px-4 py-3" />
                </tr>
              </thead>
              <tbody className="dark:divide-dark-700 divide-y divide-gray-100">
                {items.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="dark:text-dark-500 px-4 py-8 text-center text-sm text-gray-400"
                    >
                      No items added yet. Search and add a product above.
                    </td>
                  </tr>
                ) : (
                  items.map((item, idx) => (
                    <tr
                      key={item._uid}
                      className="dark:bg-dark-900 dark:hover:bg-dark-800 bg-white transition-colors hover:bg-gray-50"
                    >
                      <td className="dark:text-dark-400 px-4 py-3 text-center text-gray-500">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-3">
                        <div className="dark:text-dark-100 font-medium text-gray-800">
                          {item.itemname}
                        </div>
                        <div className="dark:text-dark-400 mt-0.5 text-xs text-gray-500">
                          {item.packagedesc || item.packagename}
                        </div>
                        {item.location && (
                          <div className="dark:text-dark-500 mt-0.5 text-xs text-gray-400">
                            {item.location}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min="1"
                          value={item.qty}
                          onChange={(e) =>
                            handleItemChange(item._uid, "qty", e.target.value)
                          }
                          className={`${inputCls} text-center`}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.rate}
                          onChange={(e) =>
                            handleItemChange(item._uid, "rate", e.target.value)
                          }
                          className={`${inputCls} text-right`}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          readOnly
                          value={item.amount?.toFixed(2) ?? "0.00"}
                          className={`${roInputCls} text-right`}
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => removeItem(item._uid)}
                          className="inline-flex h-7 w-7 items-center justify-center rounded bg-red-500 text-white hover:bg-red-600"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ══ Charges Section ══ */}
        <div className="dark:border-dark-600 mt-6 space-y-3 border-t border-gray-200 pt-6">
            {/* Subtotal */}
            <div className="flex items-center">
              <div className="w-5/12" />
              <label className="dark:text-dark-400 w-2/12 pr-4 text-right text-sm text-gray-600">
                Subtotal
              </label>
              <div className="w-4/12">
                <input
                  readOnly
                  value={totals.subtotal.toFixed(2)}
                  className={inputCls}
                />
              </div>
            </div>

            {/* Discount */}
            <div className="flex items-center">
              <div className="w-4/12" />
              <div className="flex w-3/12 items-center justify-end gap-2 pr-4">
                <label className="dark:text-dark-400 text-sm text-gray-600">
                  Discount
                </label>
                <input
                  type="number"
                  min="0"
                  value={charges.discnumber}
                  onChange={(e) => setCharge("discnumber", e.target.value)}
                  className="dark:bg-dark-900 dark:border-dark-500 dark:text-dark-100 w-20 rounded border border-gray-300 bg-white px-2 py-1 text-sm"
                />
                <select
                  value={charges.disctype}
                  onChange={(e) => setCharge("disctype", e.target.value)}
                  className="dark:bg-dark-900 dark:border-dark-500 dark:text-dark-100 rounded border border-gray-300 bg-white px-2 py-1 text-sm"
                >
                  <option value="%">%</option>
                  <option value="amount">₹</option>
                </select>
              </div>
              <div className="w-4/12">
                <input
                  readOnly
                  value={totals.discount.toFixed(2)}
                  className={inputCls}
                />
              </div>
            </div>

            {/* Freight */}
            <div className="flex items-center">
              <div className="w-5/12" />
              <label className="dark:text-dark-400 w-2/12 pr-4 text-right text-sm text-gray-600">
                Freight Charges
              </label>
              <div className="w-4/12">
                <input
                  type="number"
                  min="0"
                  value={charges.freight}
                  onChange={(e) => setCharge("freight", e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>

            {/* Mobilisation */}
            <div className="flex items-center">
              <label className="dark:text-dark-400 w-7/12 pr-4 text-right text-sm text-gray-600">
                Mobilization and Demobilization Charges
              </label>
              <div className="w-4/12">
                <input
                  type="number"
                  min="0"
                  value={charges.mobilisation}
                  onChange={(e) => setCharge("mobilisation", e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>

            {/* Witness Charges */}
            <div className="flex items-center">
              <div className="w-4/12" />
              <div className="flex w-3/12 items-center justify-end gap-2 pr-4">
                <label className="dark:text-dark-400 text-sm text-gray-600">
                  Witness Charges
                </label>
                <input
                  type="number"
                  min="0"
                  value={charges.witnessnumber}
                  onChange={(e) => setCharge("witnessnumber", e.target.value)}
                  className="dark:bg-dark-900 dark:border-dark-500 dark:text-dark-100 w-20 rounded border border-gray-300 bg-white px-2 py-1 text-sm"
                />
                <select
                  value={charges.witnesstype}
                  onChange={(e) => setCharge("witnesstype", e.target.value)}
                  className="dark:bg-dark-900 dark:border-dark-500 dark:text-dark-100 rounded border border-gray-300 bg-white px-2 py-1 text-sm"
                >
                  <option value="%">%</option>
                  <option value="amount">₹</option>
                </select>
              </div>
              <div className="w-4/12">
                <input
                  readOnly
                  value={totals.witnesscharges.toFixed(2)}
                  className={inputCls}
                />
              </div>
            </div>

            {/* Sample Handling */}
            <div className="flex items-center">
              <div className="w-5/12" />
              <label className="dark:text-dark-400 w-2/12 pr-4 text-right text-sm text-gray-600">
                Sample Handling
              </label>
              <div className="w-4/12">
                <input
                  type="number"
                  min="0"
                  value={charges.samplehandling}
                  onChange={(e) => setCharge("samplehandling", e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>

            {/* Sample Preparation */}
            <div className="flex items-center">
              <div className="w-5/12" />
              <label className="dark:text-dark-400 w-2/12 pr-4 text-right text-sm text-gray-600">
                Sample Preparation Charges
              </label>
              <div className="w-4/12">
                <input
                  type="number"
                  min="0"
                  value={charges.sampleprep}
                  onChange={(e) => setCharge("sampleprep", e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>

            {/* Subtotal 2 */}
            <div className="flex items-center">
              <div className="w-5/12" />
              <label className="dark:text-dark-400 w-2/12 pr-4 text-right text-sm text-gray-600">
                Subtotal
              </label>
              <div className="w-4/12">
                <input
                  readOnly
                  value={totals.subtotal2.toFixed(2)}
                  className={inputCls}
                />
              </div>
            </div>

            {/* Tax */}
            {isSgst ? (
              <>
                <div className="flex items-center">
                  <div className="w-5/12" />
                  <div className="flex w-2/12 items-center justify-end gap-1 pr-4">
                    <label className="dark:text-dark-400 text-sm text-gray-600">
                      Cgst
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={charges.cgstper}
                      onChange={(e) => setCharge("cgstper", e.target.value)}
                      style={{ width: 70 }}
                      className="dark:bg-dark-900 dark:border-dark-500 dark:text-dark-100 rounded border border-gray-300 bg-white px-2 py-1 text-sm"
                    />
                    <span className="text-sm text-gray-500">%</span>
                  </div>
                  <div className="w-4/12">
                    <input
                      readOnly
                      value={totals.cgstamount.toFixed(2)}
                      className={inputCls}
                    />
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-5/12" />
                  <div className="flex w-2/12 items-center justify-end gap-1 pr-4">
                    <label className="dark:text-dark-400 text-sm text-gray-600">
                      Sgst
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={charges.sgstper}
                      onChange={(e) => setCharge("sgstper", e.target.value)}
                      style={{ width: 70 }}
                      className="dark:bg-dark-900 dark:border-dark-500 dark:text-dark-100 rounded border border-gray-300 bg-white px-2 py-1 text-sm"
                    />
                    <span className="text-sm text-gray-500">%</span>
                  </div>
                  <div className="w-4/12">
                    <input
                      readOnly
                      value={totals.sgstamount.toFixed(2)}
                      className={inputCls}
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center">
                <div className="w-5/12" />
                <div className="flex w-2/12 items-center justify-end gap-1 pr-4">
                  <label className="dark:text-dark-400 text-sm text-gray-600">
                    Igst
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={charges.igstper}
                    onChange={(e) => setCharge("igstper", e.target.value)}
                    style={{ width: 70 }}
                    className="dark:bg-dark-900 dark:border-dark-500 dark:text-dark-100 rounded border border-gray-300 bg-white px-2 py-1 text-sm"
                  />
                  <span className="text-sm text-gray-500">%</span>
                </div>
                <div className="w-4/12">
                  <input
                    readOnly
                    value={totals.igstamount.toFixed(2)}
                    className={inputCls}
                  />
                </div>
              </div>
            )}

            {/* Total */}
            <div className="flex items-center">
              <div className="w-5/12" />
              <label className="dark:text-dark-400 w-2/12 pr-4 text-right text-sm text-gray-600">
                Total
              </label>
              <div className="w-4/12">
                <input
                  readOnly
                  value={totals.total.toFixed(2)}
                  className={inputCls}
                />
              </div>
            </div>

            {/* Round Off */}
            <div className="flex items-center">
              <div className="w-5/12" />
              <label className="dark:text-dark-400 w-2/12 pr-4 text-right text-sm text-gray-600">
                Round off
              </label>
              <div className="w-4/12">
                <input
                  readOnly
                  value={totals.roundoff.toFixed(2)}
                  className={inputCls}
                />
              </div>
            </div>

            {/* Final Total */}
            <div className="flex items-center">
              <div className="w-5/12" />
              <label className="dark:text-dark-300 w-2/12 pr-4 text-right text-sm font-semibold text-gray-700">
                Final Total
              </label>
              <div className="w-4/12">
                <input
                  readOnly
                  value={totals.finaltotal}
                  className="dark:bg-dark-900 dark:border-dark-500 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-bold text-green-700 focus:outline-none dark:text-green-400"
                />
              </div>
            </div>
        </div>

        {/* ══ Remark ══ */}
        <div className="mt-6 grid grid-cols-12 items-start gap-3">
          <label className="dark:text-dark-400 col-span-2 pt-2 text-right text-sm font-medium text-gray-600">
            Remark
          </label>
          <div className="col-span-10">
            <textarea
              rows={3}
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="Enter remark..."
              className={`${inputCls} resize-none`}
            />
          </div>
        </div>

        {/* ══ Submit ══ */}
        <div className="dark:border-dark-600 mt-6 flex justify-end border-t border-gray-200 pt-5">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-md bg-green-600 px-6 py-2.5 text-sm font-semibold text-white shadow hover:bg-green-700 disabled:opacity-60"
          >
            {submitting ? (
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
                Saving...
              </>
            ) : (
              "Add Invoice"
            )}
          </button>
        </div>
      </Card>
    </Page>
  );
}