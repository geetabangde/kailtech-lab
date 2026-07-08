// AddCalibrationInvoice.jsx
// Route: /dashboards/accounts/calibration-invoice-list/add
// PHP port: generateInvoiceCalibration.php → insertCalibrationInvoice.php

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router";
import axios from "utils/axios";
import { toast } from "sonner";
import { Page } from "components/shared/Page";
import { Card } from "components/ui";
import { DatePicker } from "components/shared/form/Datepicker";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const COMPANY_STATE_CODE = "23"; // PHP: $companystatecode

// ─────────────────────────────────────────────────────────────────────────────
// Style tokens
// ─────────────────────────────────────────────────────────────────────────────
const inputCls =
  "dark:bg-dark-900 dark:border-dark-500 dark:text-dark-100 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400";
const selectCls =
  "dark:bg-dark-900 dark:border-dark-500 dark:text-dark-100 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";
const labelCls =
  "dark:text-dark-400 mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500";
const roLabelCls =
  "dark:text-dark-400 text-xs font-semibold text-gray-500 mr-1";

// ─────────────────────────────────────────────────────────────────────────────
// PHP: sumamount() — exact port
// ─────────────────────────────────────────────────────────────────────────────
function calcTotals({ items, charges, isSgst, potype }) {
  const subtotal =
    potype === "Normal"
      ? items.reduce((s, i) => s + (parseFloat(i.rate) || 0), 0)
      : parseFloat(charges.subtotal) || 0;

  const discnumber = parseFloat(charges.discnumber) || 0;
  const discount =
    charges.disctype === "%" ? (subtotal / 100) * discnumber : discnumber;

  const mobilisation = parseFloat(charges.mobilisation) || 0;
  const freight = parseFloat(charges.freight) || 0;
  const witnessnumber = parseFloat(charges.witnessnumber) || 0;
  const witnesscharges =
    charges.witnesstype === "%"
      ? (subtotal / 100) * witnessnumber
      : witnessnumber;

  const subtotal2 =
    subtotal - discount + freight + witnesscharges + mobilisation;

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

// PHP: changedateformate → d/m/Y
const toSlashDate = (iso) => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

// ─────────────────────────────────────────────────────────────────────────────
// Searchable Customer Dropdown (react-select alternative)
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

  const handleSelect = (c) => {
    onChange(String(c.id));
    setQuery("");
    setOpen(false);
  };

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
            className="absolute top-1/2 right-2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
            onClick={() => {
              onChange("");
              setQuery("");
            }}
            type="button"
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
                onMouseDown={() => handleSelect(c)}
                className={`dark:hover:bg-dark-700 cursor-pointer px-3 py-2 text-sm hover:bg-blue-50 ${String(c.id) === String(value)
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

// ─────────────────────────────────────────────────────────────────────────────
// Spinner
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// Inward Entry Multi-Select — react-select style with chips + checkbox dropdown
// ─────────────────────────────────────────────────────────────────────────────
function InwardMultiSelect({ options, value, onChange, disabled }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggleOption = (id) => {
    const strId = String(id);
    const next = value.includes(strId)
      ? value.filter((v) => v !== strId)
      : [...value, strId];
    onChange(next);
  };

  const removeChip = (e, id) => {
    e.stopPropagation();
    onChange(value.filter((v) => v !== String(id)));
  };

  const selectedOpts = options.filter((o) => value.includes(String(o.id)));

  return (
    <div ref={wrapRef} className="relative">
      {/* Control box */}
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
          {selectedOpts.map((opt) => (
            <span
              key={opt.id}
              className="inline-flex items-center gap-1 rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
            >
              {opt.display ?? String(opt.id).padStart(4, "0")}
              <button
                type="button"
                onMouseDown={(e) => removeChip(e, opt.id)}
                className="ml-0.5 leading-none text-blue-500 hover:text-blue-800 focus:outline-none dark:text-blue-300"
              >
                &times;
              </button>
            </span>
          ))}
          {selectedOpts.length === 0 && (
            <span className="dark:text-dark-500 px-1 text-sm text-gray-400">
              {disabled ? "Select PO first..." : "Select Inward Entry..."}
            </span>
          )}
        </div>
        {/* Chevron arrow */}
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

      {/* Dropdown list */}
      {open && !disabled && (
        <div className="dark:bg-dark-800 dark:border-dark-600 absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg">
          {options.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-400">
              No entries found
            </div>
          ) : (
            options.map((opt) => {
              const isSelected = value.includes(String(opt.id));
              return (
                <div
                  key={opt.id}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    toggleOption(opt.id);
                  }}
                  className={[
                    "flex cursor-pointer items-center gap-2.5 px-3 py-2 text-sm transition-colors select-none",
                    isSelected
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                      : "dark:text-dark-200 dark:hover:bg-dark-700 text-gray-700 hover:bg-gray-50",
                  ].join(" ")}
                >
                  {/* Checkbox */}
                  <span
                    className={[
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition-colors",
                      isSelected
                        ? "border-blue-500 bg-blue-500"
                        : "dark:border-dark-500 border-gray-300",
                    ].join(" ")}
                  >
                    {isSelected && (
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
                  {opt.display ?? String(opt.id).padStart(4, "0")}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

function Spinner({ text = "Loading..." }) {
  return (
    <div className="flex items-center gap-2 py-3 text-sm text-gray-500">
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
export default function AddCalibrationInvoice() {
  const navigate = useNavigate();
  const permissions = JSON.parse(localStorage.getItem("userPermissions") || "[]");

  useEffect(() => {
    if (!permissions.includes(61)) {
      navigate("/dashboards");
    }
  }, [navigate, permissions]);

  // ── State ─────────────────────────────────────────────────────────────────
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
  const [billingInfo, setBillingInfo] = useState(null);
  const [taxInfo, setTaxInfo] = useState(null);
  const [invoicedate, setInvoicedate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [charges, setCharges] = useState({
    subtotal: 0,
    discnumber: 0,
    disctype: "%",
    mobilisation: 0,
    freight: 0,
    witnesstype: "%",
    witnessnumber: 0,
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

  // PHP: sgst = statecode == companystatecode; use tax.sgst_applicable if present
  const isSgst = useMemo(() => {
    if (taxInfo) return taxInfo.sgst_applicable === 1;
    return String(billingInfo?.statecode ?? "").trim() === COMPANY_STATE_CODE;
  }, [taxInfo, billingInfo]);

  const totals = useMemo(
    () => calcTotals({ items, charges, isSgst, potype }),
    [items, charges, isSgst, potype],
  );

  // ── Load customers ────────────────────────────────────────────────────────
  useEffect(() => {
    axios
      .get("/people/get-all-customers")
      .then((res) => setCustomers(res.data.data ?? res.data ?? []))
      .catch(() => toast.error("Failed to load customers"))
      .finally(() => setLoadingCustomers(false));
  }, []);

  // ── PHP: getPoDetail — API: /accounts/get-ponumber/:customerid ────────────
  const loadPoDetail = useCallback(async (cid) => {
    setPonumbers([]);
    setSelectedPo("");
    setInwardOptions([]);
    setSelectedInwards([]);
    setItems([]);
    setBrnnos("");
    setBillingInfo(null);
    setTaxInfo(null);
    if (!cid) return;
    setLoadingPo(true);
    try {
      const res = await axios.get(`/accounts/get-ponumber/${cid}`);
      setPonumbers(res.data.data ?? res.data ?? []);
    } catch {
      toast.error("Failed to load PO numbers");
    } finally {
      setLoadingPo(false);
    }
  }, []);

  useEffect(() => {
    loadPoDetail(customerid);
  }, [customerid, potype, loadPoDetail]);

  // ── PHP: getServiceReportForm — API: /accounts/get-service-reportforinvoice ─
  // Response: { data: [{id, display, inwarddate}] }
  const loadServiceReport = useCallback(
    async (po) => {
      setInwardOptions([]);
      setSelectedInwards([]);
      setItems([]);
      setBrnnos("");
      setBillingInfo(null);
      setTaxInfo(null);
      if (!po || !customerid) return;
      setLoadingInward(true);
      try {
        const res = await axios.get(
          `/accounts/get-service-reportforinvoice?customerid=${customerid}&ponumber=${encodeURIComponent(po)}&potype=${potype}`,
        );
        setInwardOptions(res.data.data ?? res.data ?? []);
      } catch {
        toast.error("Failed to load inward entries");
      } finally {
        setLoadingInward(false);
      }
    },
    [customerid, potype],
  );

  useEffect(() => {
    loadServiceReport(selectedPo);
  }, [selectedPo, loadServiceReport]);

  // ── PHP: getServiceReportDetail + getCalibrationInvoiceBrnNos ─────────────
  // API: /accounts/get-invoice-item → { customer, tax, items[] }
  // API: /accounts/get-brn-number   → { brn_numbers, list[] }
  const loadItems = useCallback(
    async (inwards) => {
      setItems([]);
      setBrnnos("");
      setBillingInfo(null);
      setTaxInfo(null);
      if (!inwards.length || !selectedPo || !customerid) return;
      setLoadingItems(true);
      try {
        const inwardParam = inwards.join(",");
        const [itemsRes, brnRes] = await Promise.all([
          axios.get(
            `/accounts/get-invoice-item?potype=${potype}&customerid=${customerid}&ponumber=${encodeURIComponent(selectedPo)}&inwardid=${inwardParam}`,
          ),
          axios.get(`/accounts/get-brn-number?inwardid=${inwardParam}`),
        ]);

        // PHP: $rowbillingcustomer → billing customer info
        if (itemsRes.data.customer) setBillingInfo(itemsRes.data.customer);

        // PHP: $sgst = statecode == companystatecode
        if (itemsRes.data.tax) {
          const tax = itemsRes.data.tax;
          setTaxInfo(tax);
          setCharges((prev) => ({
            ...prev,
            cgstper: tax.cgst ?? 9,
            sgstper: tax.sgst ?? 9,
            igstper: tax.igst ?? 18,
          }));
        }

        // API items use item_id — normalize to id
        const rawItems = itemsRes.data.items ?? itemsRes.data.data ?? [];
        setItems(
          rawItems.map((item, idx) => ({
            ...item,
            _key: `item-${idx}`,
            id: item.item_id ?? item.id,
            brnno: item.bookingrefno, // PHP: bookingrefno → brnno[] in payload
            packagedesc: item.description ?? item.packagedesc ?? "",
          })),
        );

        // API: brn_numbers string
        setBrnnos(brnRes.data.brn_numbers ?? "");
      } catch {
        toast.error("Failed to load invoice items");
      } finally {
        setLoadingItems(false);
      }
    },
    [customerid, selectedPo, potype],
  );

  // Called by InwardMultiSelect with array of string ids
  const handleInwardChange = (vals) => {
    setSelectedInwards(vals);
    loadItems(vals);
  };

  // PHP: X button → remove row + removeBrn()
  const handleRemoveItem = (itemKey, brnno) => {
    setItems((prev) => prev.filter((i) => i._key !== itemKey));
    if (brnno) {
      setBrnnos((prev) =>
        prev
          .split(",")
          .filter((b) => b.trim() !== String(brnno).trim())
          .join(","),
      );
    }
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!customerid) {
      toast.error("Please select a customer");
      return;
    }
    if (!selectedPo) {
      toast.error("Please select a PO Number");
      return;
    }
    if (!selectedInwards.length) {
      toast.error("Please select at least one Inward Entry");
      return;
    }
    if (!items.length) {
      toast.error("No items found");
      return;
    }

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
        statecode: billingInfo?.statecode ?? "",
        pan: billingInfo?.pan ?? "",
        gstno: billingInfo?.gstno ?? "",
        invoicedate: toSlashDate(invoicedate),

        itemid: items.map((i) => Number(i.id ?? 0)),
        itemname: items.map((i) => i.name ?? ""),
        iteminstid: items.map((i) => Number(i.instid ?? 0)),
        itemidno: items.map((i) => i.idno ?? ""),
        brnno: items.map((i) => i.brnno ?? i.bookingrefno ?? ""),
        itemserialno: items.map((i) => i.serialno ?? ""),
        itemlocation: items.map((i) => i.location ?? "Lab"),
        itemaccreditation: items.map((i) => i.accreditation ?? ""),
        itempackagename: items.map((i) => i.packagename ?? ""),
        itempackagedesc: items.map((i) => i.packagedesc ?? i.description ?? ""),
        itempricematrixid: items.map((i) => Number(i.pricematrixid ?? 0)),
        iteminwardid: items.map((i) =>
          Number(i.inwardid ?? selectedInwards[0] ?? 0),
        ),
        itemrate: items.map((i) =>
          potype === "Normal" ? parseFloat(i.rate) || 0 : 0,
        ),

        subtotal: totals.subtotal,
        discnumber: parseFloat(charges.discnumber) || 0,
        disctype: charges.disctype,
        discount: totals.discount,
        freight: parseFloat(charges.freight) || 0,
        mobilisation: parseFloat(charges.mobilisation) || 0,
        witnessnumber: parseFloat(charges.witnessnumber) || 0,
        witnesstype: charges.witnesstype,
        witnesscharges: totals.witnesscharges,
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

      const res = await axios.post(
        "/accounts/add-calibration-invoice",
        payload,
      );
      if (
        res.data.success === true ||
        res.data.status === true ||
        res.data.status === "true"
      ) {
        toast.success("Invoice added successfully ✅");
        navigate("/dashboards/accounts/calibration-invoice-list");
      } else {
        toast.error(res.data.message ?? "Failed to add invoice");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <Page title="Add Calibration Invoice">
      <div className="transition-content px-[var(--margin-x)] pb-10">
        {/* ── Page Header ── */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="dark:text-dark-100 text-base font-semibold text-gray-800">
            Inward Entry Form
          </h2>
          <button
            onClick={() =>
              navigate("/dashboards/accounts/calibration-invoice-list")
            }
            className="rounded bg-cyan-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-cyan-600"
          >
            &laquo; Back to Invoice List
          </button>
        </div>

        <Card className="p-6">
          {/* ══ Row 1: Customer / Bill Type / PO / Inward ══ */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Customer — searchable */}
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

            {/* Bill Type */}
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

            {/* PO Number */}
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
                    const val = p.ponumber ?? p;
                    return (
                      <option key={i} value={val}>
                        {val}
                      </option>
                    );
                  })}
                </select>
              )}
            </div>

            {/* Inward Entry — custom multi-select with chips + checkbox dropdown */}
            <div>
              <label className={labelCls}>Inward Entry</label>
              {loadingInward ? (
                <Spinner text="Loading entries..." />
              ) : (
                <InwardMultiSelect
                  options={inwardOptions}
                  value={selectedInwards}
                  onChange={handleInwardChange}
                  disabled={!selectedPo || inwardOptions.length === 0}
                />
              )}
            </div>
          </div>

          {/* ══ Billing Customer Info (PHP: $rowbillingcustomer) ══ */}
          {billingInfo && (
            <div className="dark:border-dark-600 mt-5 grid grid-cols-1 gap-5 border-t border-gray-200 pt-5 md:grid-cols-2">
              {/* Left: customer details */}
              <div className="text-sm">
                <p className="dark:text-dark-300 font-semibold text-gray-700">
                  Customer:
                </p>
                <p className="dark:text-dark-100 mt-0.5 font-bold text-gray-900">
                  {billingInfo.name}
                </p>
                {billingInfo.address && (
                  <p className="dark:text-dark-400 mt-1 text-gray-600">
                    <b>Address:</b> {billingInfo.address}
                  </p>
                )}
                <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs">
                  <span>
                    <span className={roLabelCls}>State code:</span>
                    <b className="dark:text-dark-200 text-gray-700">
                      {billingInfo.statecode}
                    </b>
                  </span>
                  <span>
                    <span className={roLabelCls}>GSTIN/UIN:</span>
                    <b className="dark:text-dark-200 text-gray-700">
                      {billingInfo.gstno || "—"}
                    </b>
                  </span>
                  <span>
                    <span className={roLabelCls}>PAN:</span>
                    <b className="dark:text-dark-200 text-gray-700">
                      {billingInfo.pan || "—"}
                    </b>
                  </span>
                </div>
                <p className="dark:text-dark-500 mt-2 text-xs text-gray-400">
                  Kind Attn.
                </p>
              </div>

              {/* Right: Invoice No / Date */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-3">
                  <span className="dark:text-dark-400 w-32 font-medium text-gray-600">
                    Invoice No.:
                  </span>
                  <span className="dark:text-dark-400 text-gray-500">—</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="dark:text-dark-400 w-32 font-medium text-gray-600">
                    Date:
                  </span>
                  <DatePicker
                    options={{
                      dateFormat: "Y-m-d",
                      altInput: true,
                      altFormat: "d/m/Y",
                      allowInput: true,
                    }}
                    value={invoicedate}
                    onChange={(dates, dateStr) => setInvoicedate(dateStr)}
                    className="dark:bg-dark-900 dark:border-dark-500 dark:text-dark-100 rounded border border-gray-300 bg-white px-2 py-1 text-sm"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <span className="dark:text-dark-400 w-32 font-medium text-gray-600">
                    Ref. No. / Date:
                  </span>
                  <span className="dark:text-dark-400 text-gray-500">—</span>
                </div>
                {/* Tax type indicator */}
                <div className="pt-1">
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${isSgst
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                      }`}
                  >
                    {isSgst ? "CGST + SGST Applicable" : "IGST Applicable"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ══ Items Table ══ */}
          {loadingItems ? (
            <div className="dark:border-dark-600 mt-5 border-t border-gray-200 pt-5">
              <Spinner text="Loading items..." />
            </div>
          ) : items.length > 0 ? (
            <div className="dark:border-dark-600 mt-5 border-t border-gray-200 pt-5">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="dark:bg-dark-700 bg-gray-100">
                      {[
                        "Sr no",
                        "Description",
                        "Identification no",
                        "Serial no",
                        ...(potype === "Normal" ? ["Rate"] : []),
                        "",
                      ].map((h) => (
                        <th
                          key={h}
                          className="dark:text-dark-400 px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="dark:divide-dark-600 divide-y divide-gray-100">
                    {items.map((item, idx) => (
                      <tr
                        key={item._key}
                        className="dark:hover:bg-dark-700 itemrow hover:bg-gray-50"
                      >
                        {/* PHP: <td class="srno"> */}
                        <td className="dark:text-dark-400 w-12 px-3 py-2 text-xs text-gray-400">
                          {idx + 1}
                        </td>
                        {/* PHP: name + packagedesc + location + BRN No + Nabl */}
                        <td className="min-w-[200px] px-3 py-2">
                          <div className="dark:text-dark-100 font-medium text-gray-800">
                            {item.name}
                          </div>
                          {item.packagedesc && (
                            <div className="dark:text-dark-400 text-xs text-gray-500">
                              {item.packagedesc}
                            </div>
                          )}
                          <div className="dark:text-dark-400 text-xs text-gray-500">
                            {item.location}
                          </div>
                          <div className="dark:text-dark-400 text-xs text-gray-500">
                            BRN No: {item.brnno ?? "—"}
                          </div>
                          {(item.accreditation ?? "").toLowerCase() ===
                            "nabl" && (
                              <span className="mt-0.5 inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                With Nabl
                              </span>
                            )}
                        </td>
                        <td className="dark:text-dark-300 px-3 py-2 text-xs text-gray-600">
                          {item.idno ?? "—"}
                        </td>
                        <td className="dark:text-dark-300 px-3 py-2 text-xs text-gray-600">
                          {item.serialno ?? "—"}
                        </td>
                        {/* PHP: if potype==Normal → rate input */}
                        {potype === "Normal" && (
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.rate ?? 0}
                              onChange={(e) =>
                                setItems((prev) =>
                                  prev.map((it) =>
                                    it._key === item._key
                                      ? { ...it, rate: e.target.value }
                                      : it,
                                  ),
                                )
                              }
                              className="dark:bg-dark-900 dark:border-dark-500 dark:text-dark-100 w-24 rounded border border-gray-300 bg-white px-2 py-1 text-sm focus:ring-1 focus:ring-blue-400 focus:outline-none"
                            />
                          </td>
                        )}
                        {/* PHP: X button → remove row + removeBrn() */}
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

          {/* ══ Charges Section (PHP: sumamount layout) ══ */}
          <div className="dark:border-dark-600 mt-5 space-y-3 border-t border-gray-200 pt-5">
            {/* Subtotal — PHP: readonly if Normal, editable if Fix Cost */}
            <div className="flex items-center">
              <div className="w-5/12" />
              <label className="dark:text-dark-400 w-2/12 pr-4 text-right text-sm text-gray-600">
                Subtotal
              </label>
              <div className="w-4/12">
                <input
                  type={potype === "Fix Cost" ? "number" : "text"}
                  readOnly={potype === "Normal"}
                  value={
                    potype === "Normal"
                      ? totals.subtotal.toFixed(2)
                      : charges.subtotal
                  }
                  onChange={(e) => setCharge("subtotal", e.target.value)}
                  placeholder="Subtotal"
                  className={inputCls}
                />
              </div>
            </div>

            {/* Discount — PHP: discnumber + disctype select */}
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
                  <option value="amount">₹</option>
                  <option value="%">%</option>
                </select>
              </div>
              <div className="w-4/12">
                <input
                  readOnly
                  value={totals.discount.toFixed(2)}
                  placeholder="Discount"
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
                  placeholder="Freight Charges"
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
                  placeholder="Mobilisation Charges"
                  className={inputCls}
                />
              </div>
            </div>

            {/* Witness Charges — PHP: witnessnumber + witnesstype */}
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
                  <option value="amount">₹</option>
                  <option value="%">%</option>
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
                  placeholder="Subtotal"
                  className={inputCls}
                />
              </div>
            </div>

            {/* PHP: if sgst==1 → CGST+SGST; else → IGST */}
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
                  placeholder="total"
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

          {/* ══ Remark + BRN Nos ══ */}
          <div className="dark:border-dark-600 mt-5 grid grid-cols-1 gap-4 border-t border-gray-200 pt-5 md:grid-cols-2">
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
              {/* PHP: readonly brnnos textarea */}
              <textarea
                rows={3}
                value={brnnos}
                readOnly
                className={`${inputCls} dark:bg-dark-800 resize-none bg-gray-50`}
              />
            </div>
          </div>

          {/* ══ Footer: Add Invoice button — PHP: always visible in box-footer ══ */}
          <div className="dark:border-dark-600 mt-6 flex justify-end border-t border-gray-200 pt-5">
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
