// Import Dependencies
import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router";
import Select from "react-select";
import axios from "utils/axios";
import { toast } from "sonner";
import dayjs from "dayjs";

// Local Imports
import { Page } from "components/shared/Page";
import { Card } from "components/ui";
import { DatePicker } from "components/shared/form/Datepicker";

// ----------------------------------------------------------------------

const PAYMENT_MODES = ["Cash", "Cheque", "NEFT", "RTGS", "IMPS", "UPI"];

/** yyyy-mm-dd → dd/mm/yyyy (API format) */
const toApiDate = (d) => {
  if (!d) return "";
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(d)) return d;
  const [y, m, day] = d.split("-");
  if (!y || !m || !day) return d;
  return `${day}/${m}/${y}`;
};

/** today as yyyy-mm-dd */
const todayInputDate = () => new Date().toISOString().split("T")[0];

// ── Styles ─────────────────────────────────────────────────────────────────
const inputCls =
  "w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-dark-500 dark:bg-dark-800 dark:text-dark-100";

const readonlyCls =
  "w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 dark:border-dark-600 dark:bg-dark-700 dark:text-dark-300";


const thCls =
  "px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-dark-400";

const tdCls = "px-3 py-2 text-sm text-gray-700 dark:text-dark-200";

const customSelectStyles = {
  control: (base) => ({
    ...base,
    minHeight: "38px",
    borderColor: "#d1d5db",
    boxShadow: "none",
    "&:hover": {
      borderColor: "#3b82f6",
    },
  }),
  menu: (base) => ({
    ...base,
    zIndex: 9999,
  }),
};

// ── Sub-components ──────────────────────────────────────────────────────────
function FormRow({ label, children, fullWidth = false }) {
  return (
    <div
      className={`flex flex-col gap-1.5 ${fullWidth ? "sm:col-span-2" : ""}`}
    >
      <label className="dark:text-dark-300 text-sm font-medium text-gray-600">
        {label}
      </label>
      {children}
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────
export default function AddPayment() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const permissions = JSON.parse(localStorage.getItem("userPermissions") || "[]");

  useEffect(() => {
    if (!permissions.includes(274)) {
      navigate("/dashboards");
    }
  }, [navigate, permissions]);

  // ?advance=Yes → advance / suspense payment mode
  const isAdvance = searchParams.has("advance");

  const [customers, setCustomers] = useState([]);
  const [bdList, setBdList] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [dropdownsLoading, setDropdownsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [totalRemainingAmount, setTotalRemainingAmount] = useState(null);

  const [form, setForm] = useState({
    customerid: "",
    bd: "",
    paymentmode: "",
    bankname: "",
    chequedate: "",
    paymentdetail: "",
    paymentdate: todayInputDate(),
    remark: "",
  });

  // Advance mode — manually entered totals
  const [advanceTotals, setAdvanceTotals] = useState({
    paymentamount: "", // Total Received amount
    tds: "", // Total TDS
  });

  // Normal mode — per-invoice rows
  const [invoiceRows, setInvoiceRows] = useState({});

  // ── Fetch dropdowns ────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      try {
        const [customerRes, bdRes] = await Promise.all([
          axios.get("/people/get-all-customers"),
          axios.get("/people/get-customer-bd"),
        ]);
        if (customerRes.data.status && Array.isArray(customerRes.data.data)) {
          setCustomers(customerRes.data.data);
        }
        if (
          (bdRes.data.status === true || bdRes.data.status === "true") &&
          Array.isArray(bdRes.data.data)
        ) {
          setBdList(bdRes.data.data);
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load dropdowns");
      } finally {
        setDropdownsLoading(false);
      }
    };
    init();
  }, []);

  // Options for react-select
  const customerOptions = useMemo(() => {
    const defaultOption = { value: "", label: isAdvance ? "Suspense" : "Select Customer" };
    const list = customers.map(c => ({ value: c.id, label: c.name }));
    return [defaultOption, ...list];
  }, [customers, isAdvance]);

  const bdOptions = useMemo(() => {
    return bdList.map(b => ({ value: b.id, label: `${b.firstname} ${b.lastname}` }));
  }, [bdList]);

  const paymentModeOptions = useMemo(() => {
    return PAYMENT_MODES.map(m => ({ value: m, label: m }));
  }, []);

  // ── Fetch pending invoices ──────────────────────────────────────────────
  const fetchPendingInvoices = useCallback(
    async (customerId) => {
      if (!customerId && !isAdvance) {
        setInvoices([]);
        setInvoiceRows({});
        setTotalRemainingAmount(null);
        return;
      }
      setLoadingInvoices(true);
      try {
        const res = await axios.get("/accounts/get-pending-invoice", {
          params: { cust: customerId, advance: isAdvance ? "Yes" : "No" },
        });
        const data = res.data.data ?? res.data ?? [];
        const list = Array.isArray(data) ? data : [];
        setInvoices(list);

        // Total remaining amount (PHP: leftamount from customers table)
        if (res.data.totalremaining !== undefined) {
          setTotalRemainingAmount(res.data.totalremaining);
        } else if (res.data.leftamount !== undefined) {
          setTotalRemainingAmount(res.data.leftamount);
        } else {
          const rem = list.reduce(
            (s, inv) => s + parseFloat(inv.remaining ?? 0),
            0,
          );
          setTotalRemainingAmount(rem);
        }

        // Reset invoice rows (normal mode)
        const rows = {};
        list.forEach((inv) => {
          rows[inv.id] = { amount: "", tds: "", amounttosettle: "" };
        });
        setInvoiceRows(rows);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load pending invoices");
        setInvoices([]);
        setInvoiceRows({});
      } finally {
        setLoadingInvoices(false);
      }
    },
    [isAdvance],
  );

  // Advance mode: load on mount immediately (no customer needed)
  useEffect(() => {
    if (isAdvance) fetchPendingInvoices("");
  }, [isAdvance, fetchPendingInvoices]);

  // ── Handlers ────────────────────────────────────────────────────────────
  const handleChange = (key, value) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleCustomerChange = (value) => {
    handleChange("customerid", value);
    fetchPendingInvoices(value);
  };

  // Normal mode: per-invoice row change
  const handleInvoiceRowChange = (invoiceId, field, value) => {
    setInvoiceRows((prev) => {
      const row = { ...(prev[invoiceId] ?? {}) };
      row[field] = value;
      if (field === "amount" || field === "tds") {
        const amt = parseFloat(field === "amount" ? value : row.amount) || 0;
        const tds = parseFloat(field === "tds" ? value : row.tds) || 0;
        row.amounttosettle = (amt + tds).toFixed(2);
      }
      return { ...prev, [invoiceId]: row };
    });
  };

  // Advance mode: manual totals change
  const handleAdvanceTotalChange = (key, value) =>
    setAdvanceTotals((prev) => ({ ...prev, [key]: value }));

  // ── Derived totals ───────────────────────────────────────────────────────
  // Normal mode — auto from invoice rows
  const normalTotalAmount = Object.values(invoiceRows).reduce(
    (s, r) => s + (parseFloat(r.amount) || 0),
    0,
  );
  const normalTotalTds = Object.values(invoiceRows).reduce(
    (s, r) => s + (parseFloat(r.tds) || 0),
    0,
  );
  const normalTotalSettle = Object.values(invoiceRows).reduce(
    (s, r) => s + (parseFloat(r.amounttosettle) || 0),
    0,
  );

  // Advance mode — from manual inputs
  const advanceTotalSettle =
    (parseFloat(advanceTotals.paymentamount) || 0) +
    (parseFloat(advanceTotals.tds) || 0);

  // Final values sent to API
  const finalPaymentAmount = isAdvance
    ? parseFloat(advanceTotals.paymentamount) || 0
    : normalTotalAmount;
  const finalTds = isAdvance
    ? parseFloat(advanceTotals.tds) || 0
    : normalTotalTds;
  const finalTotalInvoiceAmount = isAdvance
    ? advanceTotalSettle
    : normalTotalSettle;

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!form.paymentmode) {
      toast.error("Please select a payment mode");
      return;
    }
    if (!form.paymentdate) {
      toast.error("Please enter a payment date");
      return;
    }

    setSubmitting(true);
    try {
      const invoiceid = [];
      const amount = [];
      const invoicetds = [];
      const amounttosettle = [];

      invoices.forEach((inv) => {
        const row = invoiceRows[inv.id] ?? {};
        invoiceid.push(inv.id);
        amount.push(parseFloat(row.amount) || 0);
        invoicetds.push(parseFloat(row.tds) || 0);
        amounttosettle.push(parseFloat(row.amounttosettle) || 0);
      });

      const payload = {
        customerid: form.customerid ? Number(form.customerid) : "",
        bd: form.bd ? Number(form.bd) : "",
        paymentmode: form.paymentmode,
        bankname: form.bankname,
        chequedate: toApiDate(form.chequedate),
        paymentdetail: form.paymentdetail,
        paymentdate: toApiDate(form.paymentdate),
        paymentamount: finalPaymentAmount,
        tds: finalTds,
        totalinvoiceamount: finalTotalInvoiceAmount,
        remark: form.remark,
        paymenttype: "Received",
        advance: isAdvance ? "Yes" : "No",
        invoiceid,
        amount,
        invoicetds,
        amounttosettle,
      };

      const res = await axios.post("/accounts/add-payment-recived", payload);
      if (res.data.status === true || res.data.status === "true") {
        toast.success("Payment added successfully ✅");
        navigate("/dashboards/accounts/payment-list");
      } else {
        toast.error(res.data.message ?? "Failed to add payment");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (dropdownsLoading) {
    return (
      <Page title="Add Payment">
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

  const showChequeFields = form.paymentmode === "Cheque";
  const detailLabel =
    form.paymentmode === "Cheque"
      ? "Cheque No"
      : form.paymentmode === "Cash"
        ? "Payment Detail"
        : "Ref No.";

  return (
    <Page title="Add New Payment">
      <div className="transition-content px-[var(--margin-x)] pb-8">
        {/* ── Header ── */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="dark:text-dark-50 text-xl font-semibold text-gray-800">
            Add New Payment
            {isAdvance && (
              <span className="ml-2 rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                Advance / Suspense
              </span>
            )}
          </h2>
          <button
            onClick={() => navigate("/dashboards/accounts/payment-list")}
            className="dark:border-dark-500 dark:text-dark-300 dark:hover:bg-dark-700 rounded border border-gray-300 px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
          >
            ← Back to Payment List
          </button>
        </div>

        <Card className="p-6">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {/* Customer Name */}
            <FormRow label="Customer Name">
              <Select
                value={customerOptions.find(o => o.value === form.customerid) || null}
                onChange={(opt) => handleCustomerChange(opt ? opt.value : "")}
                options={customerOptions}
                placeholder={isAdvance ? "Suspense" : "Select Customer"}
                isClearable
                styles={customSelectStyles}
              />
            </FormRow>

            {/* BD */}
            <FormRow label="BD">
              <Select
                value={bdOptions.find(o => o.value === form.bd) || null}
                onChange={(opt) => handleChange("bd", opt ? opt.value : "")}
                options={bdOptions}
                placeholder="Select BD"
                isClearable
                styles={customSelectStyles}
              />
            </FormRow>

            {/* Payment Mode */}
            <FormRow label="Payment Mode">
              <Select
                value={paymentModeOptions.find(o => o.value === form.paymentmode) || null}
                onChange={(opt) => handleChange("paymentmode", opt ? opt.value : "")}
                options={paymentModeOptions}
                placeholder="Select Mode"
                isClearable
                styles={customSelectStyles}
              />
            </FormRow>

            {/* Cheque fields */}
            {showChequeFields && (
              <>
                <FormRow label="Bank Name">
                  <input
                    type="text"
                    value={form.bankname}
                    onChange={(e) => handleChange("bankname", e.target.value)}
                    placeholder="Bank name"
                    className={inputCls}
                  />
                </FormRow>
                <FormRow label="Cheque Date">
                  <DatePicker
                    options={{
                      dateFormat: "Y-m-d", // Value in state: yyyy-mm-dd
                      altInput: true,
                      altFormat: "d/m/Y", // Displayed as: dd/mm/yyyy
                      allowInput: true,
                    }}
                    value={form.chequedate}
                    onChange={(dates, dateStr) =>
                      handleChange("chequedate", dateStr)
                    }
                    className={inputCls}
                  />
                </FormRow>
              </>
            )}

            {/* Payment Detail / Cheque No / Ref No */}
            <FormRow label={detailLabel}>
              <input
                type="text"
                value={form.paymentdetail}
                onChange={(e) => handleChange("paymentdetail", e.target.value)}
                placeholder={detailLabel}
                className={inputCls}
              />
            </FormRow>

            {/* Payment Date */}
            <FormRow label="Payment Date">
              <DatePicker
                options={{
                  dateFormat: "Y-m-d",
                  altInput: true,
                  altFormat: "d/m/Y",
                  allowInput: true,
                }}
                value={form.paymentdate}
                onChange={(dates, dateStr) =>
                  handleChange("paymentdate", dateStr)
                }
                className={inputCls}
              />
            </FormRow>

            {/* ── ADVANCE MODE ONLY: Total fields shown as form rows ── */}
            {isAdvance && (
              <>
                {/* Total Remaining Amount — plain text like PHP */}
                {totalRemainingAmount !== null && (
                  <FormRow label="Total Remaining Amount">
                    <p
                      className={`py-2 text-sm font-semibold ${parseFloat(totalRemainingAmount) < 0
                          ? "text-red-600 dark:text-red-400"
                          : "dark:text-dark-200 text-gray-700"
                        }`}
                    >
                      {parseFloat(totalRemainingAmount).toFixed(2)}
                    </p>
                  </FormRow>
                )}

                {/* Total Received Amount — EDITABLE in advance mode */}
                <FormRow label="Total Received Amount">
                  <input
                    type="number"
                    value={advanceTotals.paymentamount}
                    onChange={(e) =>
                      handleAdvanceTotalChange("paymentamount", e.target.value)
                    }
                    placeholder="0"
                    className={inputCls}
                  />
                </FormRow>

                {/* Total TDS — EDITABLE in advance mode */}
                <FormRow label="Total TDS">
                  <input
                    type="number"
                    value={advanceTotals.tds}
                    onChange={(e) =>
                      handleAdvanceTotalChange("tds", e.target.value)
                    }
                    placeholder="0"
                    className={inputCls}
                  />
                </FormRow>

                {/* Total Amount — READONLY, auto = received + tds */}
                <FormRow label="Total Amount">
                  <input
                    readOnly
                    value={advanceTotalSettle.toFixed(2)}
                    className={`${readonlyCls} font-semibold text-green-700 dark:text-green-400`}
                  />
                </FormRow>
              </>
            )}

            {/* Remark — full width */}
            <FormRow label="Remark" fullWidth>
              <textarea
                rows={3}
                value={form.remark}
                onChange={(e) => handleChange("remark", e.target.value)}
                placeholder="Remark"
                className={`${inputCls} resize-none`}
              />
            </FormRow>
          </div>

          {/* ── Pending Invoices Table (both modes) ── */}
          <div className="mt-6">
            <h3 className="dark:text-dark-200 mb-3 text-sm font-semibold text-gray-700">
              Pending Invoices
            </h3>

            {loadingInvoices ? (
              <div className="flex items-center gap-2 py-6 text-sm text-gray-500">
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
                Loading invoices…
              </div>
            ) : invoices.length === 0 ? (
              <div className="dark:border-dark-600 dark:text-dark-500 rounded-md border border-dashed border-gray-300 py-8 text-center text-sm text-gray-400">
                {form.customerid || isAdvance
                  ? "No pending invoices found"
                  : "Select a customer to view pending invoices"}
              </div>
            ) : (
              <>
                <div className="dark:border-dark-600 overflow-x-auto rounded-md border border-gray-200">
                  <table className="dark:divide-dark-600 min-w-full divide-y divide-gray-200">
                    <thead className="dark:bg-dark-750 bg-gray-50">
                      <tr>
                        <th className={thCls}>#</th>
                        <th className={thCls}>Invoice No</th>
                        <th className={thCls}>Invoice Date</th>
                        <th className={thCls}>Invoice Amount</th>
                        <th className={thCls}>Remaining</th>
                        <th className={thCls}>Amount</th>
                        <th className={thCls}>TDS</th>
                        <th className={thCls}>Settle Amount</th>
                      </tr>
                    </thead>
                    <tbody className="dark:divide-dark-700 dark:bg-dark-800 divide-y divide-gray-100 bg-white">
                      {invoices.map((inv, idx) => {
                        const row = invoiceRows[inv.id] ?? {};
                        return (
                          <tr
                            key={inv.id}
                            className="itemrow dark:hover:bg-dark-750 hover:bg-gray-50"
                          >
                            <td className={tdCls}>{idx + 1}</td>
                            <td className={tdCls}>
                              {inv.invoiceno ?? inv.invoice_no ?? "-"}
                            </td>
                            <td className={tdCls}>
                              {(inv.invoicedate || inv.invoice_date) 
                                ? dayjs(inv.invoicedate ?? inv.invoice_date).format("DD/MM/YYYY") 
                                : "-"}
                            </td>
                            <td className={tdCls}>
                              {parseFloat(
                                inv.totalamount ?? inv.total_amount ?? 0,
                              ).toFixed(2)}
                            </td>
                            <td
                              className={`${tdCls} font-medium text-orange-600 dark:text-orange-400`}
                            >
                              {parseFloat(inv.remaining ?? 0).toFixed(2)}
                            </td>
                            <td className={tdCls}>
                              <input
                                type="number"
                                value={row.amount}
                                min={0}
                                placeholder="0"
                                onChange={(e) =>
                                  handleInvoiceRowChange(
                                    inv.id,
                                    "amount",
                                    e.target.value,
                                  )
                                }
                                className="invoiceamount focus:border-primary-500 dark:border-dark-500 dark:bg-dark-700 dark:text-dark-100 w-28 rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none"
                              />
                            </td>
                            <td className={tdCls}>
                              <input
                                type="number"
                                value={row.tds}
                                min={0}
                                placeholder="0"
                                onChange={(e) =>
                                  handleInvoiceRowChange(
                                    inv.id,
                                    "tds",
                                    e.target.value,
                                  )
                                }
                                className="invoicetds focus:border-primary-500 dark:border-dark-500 dark:bg-dark-700 dark:text-dark-100 w-24 rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none"
                              />
                            </td>
                            <td className={tdCls}>
                              <input
                                type="number"
                                value={row.amounttosettle}
                                readOnly
                                placeholder="0"
                                className="invoicesettle dark:border-dark-600 dark:bg-dark-700 dark:text-dark-400 w-28 rounded border border-gray-200 bg-gray-50 px-2 py-1 text-sm text-gray-500"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>

                    {/* Totals row — only in NORMAL mode (auto-calculated) */}
                    {!isAdvance && (
                      <tfoot className="dark:bg-dark-750 bg-gray-100">
                        <tr>
                          <td
                            colSpan={5}
                            className="dark:text-dark-300 px-3 py-2 text-right text-sm font-semibold text-gray-600"
                          >
                            Total
                          </td>
                          <td className="px-3 py-2">
                            <input
                              readOnly
                              value={normalTotalAmount.toFixed(2)}
                              className="dark:border-dark-600 dark:bg-dark-800 dark:text-dark-100 w-28 rounded border border-gray-200 bg-white px-2 py-1 text-sm font-semibold text-gray-700"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              readOnly
                              value={normalTotalTds.toFixed(2)}
                              className="dark:border-dark-600 dark:bg-dark-800 dark:text-dark-100 w-24 rounded border border-gray-200 bg-white px-2 py-1 text-sm font-semibold text-gray-700"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              readOnly
                              value={normalTotalSettle.toFixed(2)}
                              className="dark:border-dark-600 dark:bg-dark-800 w-28 rounded border border-gray-200 bg-white px-2 py-1 text-sm font-semibold text-green-700 dark:text-green-400"
                            />
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>

                {/* Normal mode — Total Remaining shown below table */}
                {!isAdvance && totalRemainingAmount !== null && (
                  <div className="mt-3 flex items-center gap-2 text-sm">
                    <span className="dark:text-dark-400 text-gray-500">
                      Total Remaining Amount:
                    </span>
                    <span
                      className={`font-semibold ${parseFloat(totalRemainingAmount) < 0
                          ? "text-red-600 dark:text-red-400"
                          : "dark:text-dark-200 text-gray-700"
                        }`}
                    >
                      {parseFloat(totalRemainingAmount).toFixed(2)}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── Submit ── */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="rounded-md bg-green-600 px-8 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Inserting…" : "Insert Payment"}
            </button>
          </div>
        </Card>
      </div>
    </Page>
  );
}
