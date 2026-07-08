// Import Dependencies
import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import axios from "utils/axios";
import { toast } from "sonner";

// Local Imports
import { Page } from "components/shared/Page";
import { Card } from "components/ui";

// ----------------------------------------------------------------------

export default function LinkInvoiceToPayment() {
  const { id } = useParams(); // payment id
  const navigate = useNavigate();

  const [payment, setPayment] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // ── Step 1: payment info → Step 2: invoices via customerid + bd ──────────
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // API 1 — payment details
        const paymentRes = await axios.get(`/accounts/get-payment-byid/${id}`);
        const p = paymentRes.data.data ?? paymentRes.data.payment ?? null;
        if (!p) {
          toast.error("Payment not found");
          return;
        }
        setPayment(p);

        // API 2 — invoices using customerid + bd from payment
        const invoiceRes = await axios.get(
          `/accounts/get-linked-invoice?customerid=${p.customerid ?? ""}&bd=${p.bd ?? ""}`,
        );
        if (
          (invoiceRes.data.status === true ||
            invoiceRes.data.status === "true") &&
          Array.isArray(invoiceRes.data.data)
        ) {
          setInvoices(
            invoiceRes.data.data.map((row) => ({
              ...row,
              inputAmount: "",
              inputTds: "",
              inputSettle: "",
            })),
          );
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // ── Row change — auto calc settle = amount + tds ──────────────────────────
  const handleAmountChange = useCallback((index, field, value) => {
    setInvoices((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row;
        const next = { ...row, [field]: value };
        const amt =
          parseFloat(field === "inputAmount" ? value : next.inputAmount) || 0;
        const tds =
          parseFloat(field === "inputTds" ? value : next.inputTds) || 0;
        next.inputSettle = (amt + tds).toFixed(2).replace(/\.00$/, "");
        return next;
      }),
    );
  }, []);

  // ── Derived totals ────────────────────────────────────────────────────────
  const totalAmount = invoices.reduce(
    (s, r) => s + (parseFloat(r.inputAmount) || 0),
    0,
  );
  const totalTds = invoices.reduce(
    (s, r) => s + (parseFloat(r.inputTds) || 0),
    0,
  );
  const totalSettle = invoices.reduce(
    (s, r) => s + (parseFloat(r.inputSettle) || 0),
    0,
  );

  const paymentAmount = parseFloat(payment?.paymentamount) || 0;
  const paymentTds = parseFloat(payment?.tds) || 0;
  const paymentTotalInvoice = parseFloat(payment?.totalinvoiceamount) || 0;

  const amountMatch = totalAmount === paymentAmount;
  const tdsMatch = totalTds === paymentTds;
  const settleMatch = totalSettle === paymentTotalInvoice;
  const canSubmit = amountMatch && tdsMatch && settleMatch;

  // ── API 3 — POST /accounts/add-linked-inovice ────────────────────────────
  const handleSubmit = async () => {
    if (!canSubmit) {
      toast.error("Totals must match payment amounts before linking.");
      return;
    }
    setSubmitting(true);
    try {
      // Payload: parallel arrays (as per Postman)
      const payload = {
        id: Number(id),
        invoiceid: invoices.map((r) => r.id),
        amount: invoices.map((r) => parseFloat(r.inputAmount) || 0),
        invoicetds: invoices.map((r) => parseFloat(r.inputTds) || 0),
        amounttosettle: invoices.map((r) => parseFloat(r.inputSettle) || 0),
      };
      const res = await axios.post("/accounts/add-linked-inovice", payload);
      if (res.data.status === true || res.data.status === "true") {
        toast.success("Invoice linked successfully ✅");
        navigate("/dashboards/accounts/payment-list");
      } else {
        toast.error(res.data.message ?? "Failed to link invoice");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const fmtDate = (d) => {
    if (!d || d === "0000-00-00") return "—";
    const dt = new Date(d);
    if (isNaN(dt)) return d;
    return `${String(dt.getDate()).padStart(2, "0")}/${String(dt.getMonth() + 1).padStart(2, "0")}/${dt.getFullYear()}`;
  };

  const detailLabel =
    payment?.paymentmode === "Cheque"
      ? "Cheque No"
      : payment?.paymentmode === "Cash"
        ? "Payment Detail"
        : "Ref No.";

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Page title="Link Invoice to Payment">
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
    <Page title="Link Invoice to Payment">
      <div className="transition-content px-[var(--margin-x)] pb-8">
        {/* ── Header ── */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="dark:text-dark-50 text-xl font-semibold text-gray-800">
            Link Invoice to Payment
          </h2>
          <button
            onClick={() => navigate("/dashboards/accounts/payment-list")}
            className="dark:border-dark-500 dark:text-dark-300 dark:hover:bg-dark-700 rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            ← Back to Payment List
          </button>
        </div>

        <Card className="p-6">
          {/* ── Payment Info ── */}
          {payment && (
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <InfoRow
                label="Customer Name"
                value={payment.name ?? payment.customername ?? "—"}
              />
              <InfoRow
                label="Payment Mode"
                value={payment.paymentmode ?? "—"}
              />

              {payment.paymentmode === "Cheque" && (
                <>
                  <InfoRow label="Bank Name" value={payment.bankname ?? "—"} />
                  <InfoRow
                    label="Cheque Date"
                    value={fmtDate(payment.chequedate)}
                  />
                </>
              )}

              <InfoRow
                label={detailLabel}
                value={payment.paymentdetail ?? "—"}
              />
              <InfoRow
                label="Payment Date"
                value={fmtDate(payment.paymentdate)}
              />
              {payment.remark && (
                <InfoRow label="Remark" value={payment.remark} />
              )}

              {/* Amount match badges */}
              <AmountBadge
                label="Total Received Amount"
                value={paymentAmount}
                match={amountMatch}
                entered={totalAmount}
              />
              <AmountBadge
                label="Total TDS"
                value={paymentTds}
                match={tdsMatch}
                entered={totalTds}
              />
              <AmountBadge
                label="Total Invoice Amount"
                value={paymentTotalInvoice}
                match={settleMatch}
                entered={totalSettle}
              />
            </div>
          )}

          {/* ── Invoice Table ── */}
          {invoices.length > 0 ? (
            <>
              <div className="dark:border-dark-500 overflow-x-auto rounded-lg border border-gray-200">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="dark:bg-dark-800 dark:text-dark-200 bg-gray-100 text-left text-xs font-semibold text-gray-700 uppercase">
                      {[
                        "Invoice No",
                        "Invoice Date",
                        "Remaining",
                        "Received Amount",
                        "TDS",
                        "Total Amount",
                      ].map((h) => (
                        <th key={h} className="px-4 py-2.5 whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv, idx) => (
                      <tr
                        key={inv.id}
                        className="dark:border-dark-500 border-t border-gray-200"
                      >
                        <td className="dark:text-dark-100 px-4 py-2.5 font-medium text-gray-800">
                          {inv.invoiceno}
                        </td>
                        <td className="dark:text-dark-300 px-4 py-2.5 text-gray-600">
                          {fmtDate(inv.invoicedate)}
                        </td>
                        <td className="dark:text-dark-200 px-4 py-2.5 text-gray-700">
                          {inv.remaining}
                        </td>
                        <td className="px-4 py-2.5">
                          <NumInput
                            value={inv.inputAmount}
                            onChange={(v) =>
                              handleAmountChange(idx, "inputAmount", v)
                            }
                          />
                        </td>
                        <td className="px-4 py-2.5">
                          <NumInput
                            value={inv.inputTds}
                            onChange={(v) =>
                              handleAmountChange(idx, "inputTds", v)
                            }
                          />
                        </td>
                        <td className="px-4 py-2.5">
                          <input
                            readOnly
                            value={inv.inputSettle}
                            className="dark:border-dark-500 dark:bg-dark-700 dark:text-dark-300 w-24 rounded border border-gray-200 bg-gray-50 px-2 py-1.5 text-sm text-gray-600"
                          />
                        </td>
                      </tr>
                    ))}

                    {/* Totals row */}
                    <tr className="dark:border-dark-500 dark:bg-dark-800 border-t-2 border-gray-300 bg-gray-50 font-semibold">
                      <td
                        className="dark:text-dark-100 px-4 py-2.5 text-gray-800"
                        colSpan={2}
                      >
                        Total
                      </td>
                      <td className="dark:text-dark-200 px-4 py-2.5 text-gray-700">
                        {invoices.reduce(
                          (s, r) => s + (parseFloat(r.remaining) || 0),
                          0,
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        <TotalCell
                          value={totalAmount}
                          match={amountMatch}
                          expected={paymentAmount}
                        />
                      </td>
                      <td className="px-4 py-2.5">
                        <TotalCell
                          value={totalTds}
                          match={tdsMatch}
                          expected={paymentTds}
                        />
                      </td>
                      <td className="px-4 py-2.5">
                        <TotalCell
                          value={totalSettle}
                          match={settleMatch}
                          expected={paymentTotalInvoice}
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {!canSubmit && (
                <p className="mt-3 text-xs text-amber-600 dark:text-amber-400">
                  ⚠ Entered totals must equal the payment amounts to submit.
                </p>
              )}

              <div className="mt-5 flex justify-end">
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !canSubmit}
                  className="rounded-md bg-green-600 px-6 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? "Linking…" : "Link Invoice Payment"}
                </button>
              </div>
            </>
          ) : (
            <p className="dark:text-dark-400 text-sm text-gray-500">
              No pending invoices found for this payment.
            </p>
          )}
        </Card>
      </div>
    </Page>
  );
}

// ── Small helpers ─────────────────────────────────────────────────────────────

function InfoRow({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="dark:text-dark-400 text-xs font-medium text-gray-500">
        {label}
      </span>
      <span className="dark:text-dark-100 text-sm text-gray-800">{value}</span>
    </div>
  );
}

function AmountBadge({ label, value, match, entered }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="dark:text-dark-400 text-xs font-medium text-gray-500">
        {label}
      </span>
      <span
        className={`w-fit rounded px-2 py-0.5 text-sm font-semibold ${
          match
            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
            : "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
        }`}
      >
        {value}
        {!match && ` (entered: ${entered})`}
      </span>
    </div>
  );
}

function NumInput({ value, onChange }) {
  return (
    <input
      type="number"
      min="0"
      step="any"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="0"
      className="focus:border-primary-500 focus:ring-primary-500 dark:border-dark-500 dark:bg-dark-800 dark:text-dark-100 w-24 rounded border border-gray-300 px-2 py-1.5 text-sm focus:ring-1 focus:outline-none"
    />
  );
}

function TotalCell({ value, match, expected }) {
  return (
    <span
      className={`inline-block rounded px-2 py-0.5 text-sm font-semibold ${
        match
          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
          : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
      }`}
    >
      {value}
      {!match && <span className="ml-1 text-xs opacity-75">/ {expected}</span>}
    </span>
  );
}
