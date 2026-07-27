// Import Dependencies
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { toast } from "sonner";
import axios from "utils/axios";

// Local Imports
import { Page } from "components/shared/Page";

// ─── Page-level full spinner ──────────────────────────────────────────────────
function PageSpinner() {
  return (
    <div className="flex h-[60vh] items-center justify-center gap-3 text-gray-500">
      <svg className="h-7 w-7 animate-spin text-blue-500" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z" />
      </svg>
      Loading...
    </div>
  );
}

// ----------------------------------------------------------------------

export default function LinkInvoicesToCreditNote() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [creditNoteData, setCreditNoteData] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [amounts, setAmounts] = useState({});   // invoice_id -> amount
  const [tdsMap, setTdsMap] = useState({});      // invoice_id -> tds
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    axios
      .get(`/accounts/get-credit-notdata/${id}`)
      .then((res) => {
        const d = res.data;
        setCreditNoteData(d);
        const invList = d.invoices || [];
        setInvoices(invList);

        // Init amount/tds maps to empty
        const a = {}, t = {};
        invList.forEach((inv) => {
          a[inv.invoice_id] = inv.received_amount || "";
          t[inv.invoice_id] = inv.tds || "";
        });
        setAmounts(a);
        setTdsMap(t);
      })
      .catch((err) => console.error("Failed to load data:", err))
      .finally(() => setLoading(false));
  }, [id]);

  // calc settle for a row
  const getSettle = (invId) => {
    const a = parseFloat(amounts[invId] || 0);
    const t = parseFloat(tdsMap[invId] || 0);
    return (a + t).toFixed(2);
  };

  // totals
  const totalAmount = invoices.reduce((s, inv) => s + parseFloat(amounts[inv.invoice_id] || 0), 0);
  const totalTds = invoices.reduce((s, inv) => s + parseFloat(tdsMap[inv.invoice_id] || 0), 0);
  const totalSettle = invoices.reduce((s, inv) => s + parseFloat(getSettle(inv.invoice_id)), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const cnTotal = parseFloat(creditNoteData?.total_remaining || 0);

    // 1. Enforce amount equality across the form
    if (Math.abs(totalSettle - cnTotal) > 0.01) {
      toast.error(`Allocated total (${totalSettle.toFixed(2)}) must exactly match Credit Note Amount (${cnTotal.toFixed(2)}).`);
      return;
    }

    // 2. TDS is allowed, no zero restriction needed.

    // 3. Prevent Over-Allocation inside Rows
    for (const inv of invoices) {
      const settled = parseFloat(getSettle(inv.invoice_id));
      const remaining = parseFloat(inv.remaining_amount || 0);
      if (settled > remaining) {
        toast.error(`Settle amount (${settled}) for ${inv.invoice_no} exceeds its remaining balance (${remaining}).`);
        return;
      }
    }

    const payload = {
      id: id,
      invoiceid: invoices.map((inv) => inv.invoice_id),
      amount: invoices.map((inv) => parseFloat(amounts[inv.invoice_id] || 0)),
      invoicetds: invoices.map((inv) => parseFloat(tdsMap[inv.invoice_id] || 0)),
      amounttosettle: invoices.map((inv) => parseFloat(getSettle(inv.invoice_id) || 0)),
      totalamount: parseFloat(totalAmount),
      totaltds: parseFloat(totalTds),
      totalsettledvalue: parseFloat(totalSettle),
      paymenttype: "Received"
    };

    try {
      setSubmitting(true);
      await axios.post(`/accounts/link-credit-note`, payload);
      toast.success("Credit note linked successfully.");
      navigate("/dashboards/accounts/credit-note");
    } catch (err) {
      console.error(err);
      toast.error("Failed to link credit note.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <Page title="Link Credit Note">
        <PageSpinner />
      </Page>
    );

  const cn = creditNoteData;

  return (
    <Page title="Link Credit Note">
      <div className="p-4 sm:p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-800 dark:text-dark-50">
            Link Credit Note
          </h1>
          <button
            onClick={() => navigate("/dashboards/accounts/credit-note")}
            className="rounded bg-primary-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-primary-700"
          >
            &laquo; Back to Credit Note
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="rounded border border-gray-200 bg-white dark:border-dark-600 dark:bg-dark-800">
            <div className="divide-y divide-gray-100 dark:divide-dark-600">

              <InfoRow label="Customer Name" value={cn?.customer_name} />
              <InfoRow
                label="Credit Note Date"
                value={
                  cn?.creditnotedate
                    ? new Date(cn.creditnotedate).toLocaleDateString("en-GB")
                    : "-"
                }
              />

              {/* Summary amounts */}
              <div className="grid grid-cols-1 gap-4 px-4 py-4 sm:grid-cols-3 sm:px-6">
                <ReadonlyField
                  label="Total Credit Note Amount"
                  id="paymentamount"
                  value={cn?.total_remaining ?? 0}
                />
                <ReadonlyField label="Total TDS" id="tds" value={totalTds.toFixed(2)} />
                <ReadonlyField
                  label="Total Amount"
                  id="totalinvoiceamount"
                  value={cn?.total_remaining ?? 0}
                />
              </div>

              {/* Invoices table */}
              {invoices.length > 0 ? (
                <div className="overflow-x-auto px-4 py-4 sm:px-6">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 dark:bg-dark-700">
                      <tr>
                        <th className="p-2 text-left">Invoice No</th>
                        <th className="p-2 text-left">Remaining Amount</th>
                        <th className="p-2 text-left">Received Amount</th>
                        <th className="p-2 text-left">TDS</th>
                        <th className="p-2 text-left">Total Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map((inv) => (
                        <tr
                          key={inv.invoice_id}
                          className="border-t border-gray-100 dark:border-dark-600"
                        >
                          <td className="p-2">{inv.invoice_no}</td>
                          <td className="p-2">{inv.remaining_amount}</td>
                          <td className="p-2">
                            <input
                              type="number"
                              min="0"
                              max={inv.remaining_amount}
                              step="0.01"
                              value={amounts[inv.invoice_id]}
                              onChange={(e) =>
                                setAmounts((prev) => ({ ...prev, [inv.invoice_id]: e.target.value }))
                              }
                              className="w-28 rounded border border-gray-300 px-2 py-1 text-sm dark:border-dark-500 dark:bg-dark-700"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              min="0"
                              max="0"
                              step="0.01"
                              value={tdsMap[inv.invoice_id]}
                              onChange={(e) =>
                                setTdsMap((prev) => ({ ...prev, [inv.invoice_id]: e.target.value }))
                              }
                              className="w-28 rounded border border-gray-300 px-2 py-1 text-sm dark:border-dark-500 dark:bg-dark-700"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              readOnly
                              value={getSettle(inv.invoice_id)}
                              className="w-28 rounded border border-gray-300 bg-gray-50 px-2 py-1 text-sm dark:border-dark-500 dark:bg-dark-700"
                            />
                          </td>
                        </tr>
                      ))}

                      {/* Totals row */}
                      <tr className="border-t-2 border-gray-300 font-semibold dark:border-dark-400">
                        <td className="p-2">Total</td>
                        <td className="p-2">
                          {invoices.reduce((s, inv) => s + parseFloat(inv.remaining_amount || 0), 0).toFixed(2)}
                        </td>
                        <td className="p-2">
                          <input
                            readOnly
                            value={totalAmount.toFixed(2)}
                            className="w-28 rounded border border-gray-300 bg-gray-50 px-2 py-1 text-sm dark:border-dark-500 dark:bg-dark-700"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            readOnly
                            value={totalTds.toFixed(2)}
                            className="w-28 rounded border border-gray-300 bg-gray-50 px-2 py-1 text-sm dark:border-dark-500 dark:bg-dark-700"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            readOnly
                            value={totalSettle.toFixed(2)}
                            className="w-28 rounded border border-gray-300 bg-gray-50 px-2 py-1 text-sm dark:border-dark-500 dark:bg-dark-700"
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="px-4 py-4 text-sm text-gray-500 sm:px-6">
                  No pending invoices found for this customer.
                </div>
              )}

              {/* Remark */}
              {cn?.remark && <InfoRow label="Remark" value={cn.remark} />}
            </div>
          </div>

          {/* Submit */}
          {invoices.length > 0 && (
            <div className="mt-4 flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="rounded bg-green-600 px-6 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60"
              >
                {submitting ? "Linking..." : "Link Credit Note"}
              </button>
            </div>
          )}
        </form>
      </div>
    </Page>
  );
}

// ── Helpers ──

function InfoRow({ label, value }) {
  return (
    <div className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:px-6">
      <span className="w-1/3 shrink-0 text-sm font-medium text-gray-600 dark:text-dark-300">
        {label}
      </span>
      <span className="text-sm text-gray-800 dark:text-dark-100">{value ?? "-"}</span>
    </div>
  );
}

function ReadonlyField({ label, id, value }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs font-medium text-gray-600 dark:text-dark-300">
        {label}
      </label>
      <input
        id={id}
        readOnly
        value={value}
        className="rounded border border-gray-300 bg-gray-50 px-3 py-2 text-sm dark:border-dark-500 dark:bg-dark-700"
      />
    </div>
  );
}
