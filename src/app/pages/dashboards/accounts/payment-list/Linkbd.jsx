// Import Dependencies
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import axios from "utils/axios";
import { toast } from "sonner";

// Local Imports
import { Page } from "components/shared/Page";
import { Card } from "components/ui";

// ----------------------------------------------------------------------

// Convert any date format → dd/mm/yyyy (API format)
const toApiDate = (d) => {
  if (!d || d === "0000-00-00") return "";
  if (/\d{2}\/\d{2}\/\d{4}/.test(d)) return d; // already dd/mm/yyyy
  const [y, m, day] = d.split("-");
  if (!y || !m || !day) return d;
  return `${day}/${m}/${y}`;
};

export default function LinkBD() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [payment, setPayment] = useState(null);
  const [bdList, setBdList] = useState([]);
  const [selectedBd, setSelectedBd] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // ── Fetch payment data + BD list ──────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const [paymentRes, bdRes] = await Promise.all([
          axios.get(`/accounts/get-payment-byid/${id}`),
          axios.get("/people/get-customer-bd"),
        ]);

        // BD list
        if (
          (bdRes.data.status === true || bdRes.data.status === "true") &&
          Array.isArray(bdRes.data.data)
        ) {
          setBdList(bdRes.data.data);
        }

        // Payment data
        const d = paymentRes.data.data ?? paymentRes.data.payment ?? null;
        if (d) {
          setPayment(d);
          setSelectedBd(d.bd ?? "");
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

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!selectedBd) {
      toast.error("Please select a BD person");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        paymentId: Number(id),
        customerid: payment?.customerid ? Number(payment.customerid) : "",
        bd: Number(selectedBd),
        paymentmode: payment?.paymentmode ?? "",
        bankname: payment?.bankname ?? "",
        chequedate: toApiDate(payment?.chequedate ?? ""),
        paymentdetail: payment?.paymentdetail ?? "",
        paymentdate: toApiDate(payment?.paymentdate ?? ""),
        paymentamount: Number(payment?.paymentamount ?? 0),
        tds: Number(payment?.tds ?? 0),
        totalinvoiceamount: Number(payment?.totalinvoiceamount ?? 0),
        remark: payment?.remark ?? "",
        paymenttype: "Received",
        advance: "No",
      };
      const res = await axios.post("/accounts/update-payment-recived", payload);
      if (res.data.status === true || res.data.status === "true") {
        toast.success("BD linked successfully ✅");
        navigate("/dashboards/accounts/payment-list");
      } else {
        toast.error(res.data.message ?? "Failed to link BD");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Date format helper ────────────────────────────────────────────────────
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
      <Page title="Link BD">
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
    <Page title="Link BD Person">
      <div className="transition-content px-[var(--margin-x)] pb-8">
        {/* ── Header ── */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="dark:text-dark-50 text-xl font-semibold text-gray-800">
            Link BD Person
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
            {/* Customer Name — read only */}
            <InfoRow
              label="Customer Name"
              value={payment?.name ?? payment?.customername ?? "Suspense"}
            />

            {/* Payment Mode — read only */}
            <InfoRow label="Payment Mode" value={payment?.paymentmode ?? "—"} />

            {/* Cheque fields — read only, only if Cheque */}
            {payment?.paymentmode === "Cheque" && (
              <>
                <InfoRow label="Bank Name" value={payment?.bankname ?? "—"} />
                <InfoRow
                  label="Cheque Date"
                  value={fmtDate(payment?.chequedate)}
                />
              </>
            )}

            {/* Payment Detail */}
            <InfoRow
              label={detailLabel}
              value={payment?.paymentdetail ?? "—"}
            />

            {/* Payment Date */}
            <InfoRow
              label="Payment Date"
              value={fmtDate(payment?.paymentdate)}
            />

            {/* Amounts */}
            <InfoRow
              label="Total Received Amount"
              value={payment?.paymentamount ?? "—"}
            />
            <InfoRow label="Total TDS" value={payment?.tds ?? "—"} />
            <InfoRow
              label="Total Amount"
              value={payment?.totalinvoiceamount ?? "—"}
            />

            {/* Remark */}
            {payment?.remark && (
              <InfoRow label="Remark" value={payment.remark} />
            )}

            {/* BD Select — editable */}
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className="dark:text-dark-300 text-sm font-medium text-gray-600">
                BD Person <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedBd}
                onChange={(e) => setSelectedBd(e.target.value)}
                className="focus:border-primary-500 focus:ring-primary-500 dark:border-dark-500 dark:bg-dark-800 dark:text-dark-100 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:ring-1 focus:outline-none sm:w-80"
              >
                <option value="">Select BD</option>
                {bdList.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.firstname} {b.lastname}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ── Submit ── */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="rounded-md bg-green-600 px-8 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Saving…" : "Insert Payment"}
            </button>
          </div>
        </Card>
      </div>
    </Page>
  );
}

// ── Read-only info row ────────────────────────────────────────────────────────
function InfoRow({ label, value }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="dark:text-dark-400 text-xs font-medium text-gray-500">
        {label}
      </span>
      <span className="dark:border-dark-500 dark:bg-dark-700 dark:text-dark-100 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800">
        {value}
      </span>
    </div>
  );
}
