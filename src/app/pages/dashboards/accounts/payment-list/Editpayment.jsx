// Import Dependencies
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import axios from "utils/axios";
import { toast } from "sonner";

// Local Imports
import { Page } from "components/shared/Page";
import { Card } from "components/ui";
import { DatePicker } from "components/shared/form/Datepicker";

// ----------------------------------------------------------------------

const PAYMENT_MODES = ["Cash", "Cheque", "NEFT", "RTGS", "IMPS", "UPI"];

// Convert yyyy-mm-dd (HTML input) → dd/mm/yyyy (API format)
const toApiDate = (d) => {
  if (!d) return "";
  // Already in dd/mm/yyyy
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(d)) return d;
  const [y, m, day] = d.split("-");
  if (!y || !m || !day) return d;
  return `${day}/${m}/${y}`;
};

// Convert yyyy-mm-dd or dd/mm/yyyy → yyyy-mm-dd (HTML date input value)
const toInputDate = (d) => {
  if (!d) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(d)) {
    const [day, m, y] = d.split("/");
    return `${y}-${m}-${day}`;
  }
  return d;
};

export default function EditPayment() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);
  const [bdList, setBdList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    customerid: "",
    bd: "",
    paymentmode: "",
    bankname: "",
    chequedate: "",
    paymentdetail: "",
    paymentdate: "",
    remark: "",
    paymentamount: "",
    tds: "",
    totalinvoiceamount: "",
  });

  // ── Fetch payment + dropdowns ─────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const [paymentRes, customerRes, bdRes] = await Promise.all([
          axios.get(`/accounts/get-payment-byid/${id}`),
          axios.get("/people/get-all-customers"),
          axios.get("/people/get-customer-bd"),
        ]);

        // Customers
        if (customerRes.data.status && Array.isArray(customerRes.data.data)) {
          setCustomers(customerRes.data.data);
        }

        // BD list
        if (
          (bdRes.data.status === true || bdRes.data.status === "true") &&
          Array.isArray(bdRes.data.data)
        ) {
          setBdList(bdRes.data.data);
        }

        // Payment data — pre-fill form
        const d = paymentRes.data.data ?? paymentRes.data.payment ?? null;
        if (d) {
          setForm({
            customerid: d.customerid ?? "",
            bd: d.bd ?? "",
            paymentmode: d.paymentmode ?? "",
            bankname: d.bankname ?? "",
            chequedate: toInputDate(d.chequedate ?? ""),
            paymentdetail: d.paymentdetail ?? "",
            paymentdate: toInputDate(d.paymentdate ?? ""),
            remark: d.remark ?? "",
            paymentamount: d.paymentamount ?? "",
            tds: d.tds ?? "",
            totalinvoiceamount: d.totalinvoiceamount ?? "",
          });
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load payment data");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [id]);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // ── Submit ────────────────────────────────────────────────────────────────
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
      const payload = {
        paymentId: Number(id),
        customerid: form.customerid ? Number(form.customerid) : "",
        bd: form.bd ? Number(form.bd) : "",
        paymentmode: form.paymentmode,
        bankname: form.bankname,
        chequedate: toApiDate(form.chequedate),
        paymentdetail: form.paymentdetail,
        paymentdate: toApiDate(form.paymentdate),
        paymentamount: Number(form.paymentamount),
        tds: Number(form.tds),
        totalinvoiceamount: Number(form.totalinvoiceamount),
        remark: form.remark,
        paymenttype: "Received",
        advance: "No",
      };
      const res = await axios.post("/accounts/update-payment-recived", payload);
      if (res.data.status === true || res.data.status === "true") {
        toast.success("Payment updated successfully ✅");
        navigate("/dashboards/accounts/payment-list");
      } else {
        toast.error(res.data.message ?? "Failed to update payment");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Page title="Edit Payment">
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
    <Page title="Edit Payment">
      <div className="transition-content px-[var(--margin-x)] pb-8">
        {/* ── Header ── */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="dark:text-dark-50 text-xl font-semibold text-gray-800">
            Update Payment
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
              <select
                value={form.customerid}
                onChange={(e) => handleChange("customerid", e.target.value)}
                className={selectCls}
              >
                <option value="">Suspense</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </FormRow>

            {/* BD */}
            <FormRow label="BD">
              <select
                value={form.bd}
                onChange={(e) => handleChange("bd", e.target.value)}
                className={selectCls}
              >
                <option value="">Select BD</option>
                {bdList.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.firstname} {b.lastname}
                  </option>
                ))}
              </select>
            </FormRow>

            {/* Payment Mode */}
            <FormRow label="Payment Mode">
              <select
                value={form.paymentmode}
                onChange={(e) => handleChange("paymentmode", e.target.value)}
                className={selectCls}
              >
                <option value="">Select Mode</option>
                {PAYMENT_MODES.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
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

            {/* Cheque fields — only when mode is Cheque */}
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
                      dateFormat: "Y-m-d",
                      altInput: true,
                      altFormat: "d/m/Y",
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

            {/* Payment Amount */}
            <FormRow label="Total Received Amount">
              <input
                type="number"
                value={form.paymentamount}
                onChange={(e) => handleChange("paymentamount", e.target.value)}
                placeholder="0"
                className={inputCls}
              />
            </FormRow>

            {/* TDS */}
            <FormRow label="Total TDS">
              <input
                type="number"
                value={form.tds}
                onChange={(e) => handleChange("tds", e.target.value)}
                placeholder="0"
                className={inputCls}
              />
            </FormRow>

            {/* Total Invoice Amount */}
            <FormRow label="Total Amount">
              <input
                type="number"
                value={form.totalinvoiceamount}
                onChange={(e) =>
                  handleChange("totalinvoiceamount", e.target.value)
                }
                placeholder="0"
                className={inputCls}
              />
            </FormRow>

            {/* Remark — full width */}
            <div className="sm:col-span-2">
              <FormRow label="Remark">
                <textarea
                  rows={3}
                  value={form.remark}
                  onChange={(e) => handleChange("remark", e.target.value)}
                  placeholder="Remark"
                  className={`${inputCls} resize-none`}
                />
              </FormRow>
            </div>
          </div>

          {/* ── Submit ── */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="rounded-md bg-green-600 px-8 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Updating…" : "Update Payment"}
            </button>
          </div>
        </Card>
      </div>
    </Page>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const inputCls =
  "w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-dark-500 dark:bg-dark-800 dark:text-dark-100";

const selectCls =
  "w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-dark-500 dark:bg-dark-800 dark:text-dark-100";

function FormRow({ label, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="dark:text-dark-300 text-sm font-medium text-gray-600">
        {label}
      </label>
      {children}
    </div>
  );
}
