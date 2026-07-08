// Import Dependencies
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import axios from "utils/axios";
import { toast } from "sonner";

// Local Imports
import { Page } from "components/shared/Page";
import { Card } from "components/ui";
import Select from "react-select";

// ----------------------------------------------------------------------


const toApiDate = (d) => {
  if (!d) return "";
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(d)) return d; // already dd/mm/yyyy
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
    const [y, m, day] = d.split("-");
    return `${day}/${m}/${y}`;
  }
  return d;
};


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

function ReadonlyValue({ value }) {
  return (
    <p className="dark:text-dark-200 dark:border-dark-600 dark:bg-dark-700 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
      {value || "-"}
    </p>
  );
}

export default function LinkCustomer() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [payment, setPayment] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [customerid, setCustomerid] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // ── Fetch payment + customers ───────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      try {
        const [paymentRes, customerRes] = await Promise.all([
          axios.get(`/accounts/get-payment-byid/${id}`),
          axios.get("/people/get-all-customers"),
        ]);

        const d = paymentRes.data.data ?? paymentRes.data.payment ?? null;
        if (d) setPayment(d);

        if (customerRes.data.status && Array.isArray(customerRes.data.data)) {
          const sortedCustomers = [...customerRes.data.data].sort((a, b) =>
            (a.name || "").localeCompare(b.name || "")
          );
          setCustomers(sortedCustomers);
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [id]);

  // ── Submit ──────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!customerid) {
      toast.error("Please select a customer");
      return;
    }
    setSubmitting(true);
    try {
      const res = await axios.post("/accounts/update-payment-recived", {
        paymentId: Number(id),
        customerid: Number(customerid),
        paymentmode: payment?.paymentmode ?? "",
        bankname: payment?.bankname ?? "",
        chequedate: toApiDate(payment?.chequedate ?? ""),
        paymentdetail: payment?.paymentdetail ?? "",
        paymentdate: toApiDate(payment?.paymentdate ?? ""),
        paymentamount: parseFloat(payment?.paymentamount ?? 0),
        tds: parseFloat(payment?.tds ?? 0),
        totalinvoiceamount: parseFloat(payment?.totalinvoiceamount ?? 0),
        remark: payment?.remark ?? "",
        paymenttype: payment?.paymenttype ?? "Received",
        bd: payment?.bd ? Number(payment.bd) : "",
        advance: "No",
      });
      if (res.data.status === true || res.data.status === "true") {
        toast.success("Customer linked successfully ✅");
        navigate("/dashboards/accounts/payment-list");
      } else {
        toast.error(res.data.message ?? "Failed to link customer");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Page title="Link Customer">
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

  const isChecque = payment?.paymentmode === "Cheque";
  const detailLabel =
    payment?.paymentmode === "Cheque"
      ? "Cheque No"
      : payment?.paymentmode === "Cash"
        ? "Payment Detail"
        : "Ref No.";

  return (
    <Page title="Link Customer to Payment">
      <div className="transition-content px-[var(--margin-x)] pb-8">
        {/* ── Header ── */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="dark:text-dark-50 text-xl font-semibold text-gray-800">
            Link Customer to Payment
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
            {/* Customer Name — EDITABLE dropdown */}
            <FormRow label="Customer Name">
              <Select
                value={
                  customerid
                    ? {
                        value: customerid,
                        label: customers.find((c) => c.id == customerid)?.name,
                      }
                    : null
                }
                onChange={(selectedOption) =>
                  setCustomerid(selectedOption ? selectedOption.value : "")
                }
                options={customers.map((c) => ({ value: c.id, label: c.name }))}
                placeholder="Select Customer"
                isSearchable
                isClearable
                styles={{
                  control: (base) => ({
                    ...base,
                    borderRadius: "0.375rem",
                    borderColor: "#d1d5db",
                    boxShadow: "none",
                    "&:hover": {
                      borderColor: "#d1d5db",
                    },
                  }),
                }}
              />
            </FormRow>

            {/* Payment Mode — readonly */}
            <FormRow label="Payment Mode">
              <ReadonlyValue value={payment?.paymentmode} />
            </FormRow>

            {/* Cheque fields — readonly, only if Cheque */}
            {isChecque && (
              <>
                <FormRow label="Bank Name">
                  <ReadonlyValue value={payment?.bankname} />
                </FormRow>
                <FormRow label="Cheque Date">
                  <ReadonlyValue value={payment?.chequedate} />
                </FormRow>
              </>
            )}

            {/* Payment Detail / Cheque No / Ref No — readonly */}
            <FormRow label={detailLabel}>
              <ReadonlyValue value={payment?.paymentdetail} />
            </FormRow>

            {/* Payment Date — readonly */}
            <FormRow label="Payment Date">
              <ReadonlyValue value={payment?.paymentdate} />
            </FormRow>

            {/* Total Received Amount — readonly */}
            <FormRow label="Total Received Amount">
              <ReadonlyValue
                value={
                  payment?.paymentamount !== undefined
                    ? parseFloat(payment.paymentamount).toFixed(2)
                    : "-"
                }
              />
            </FormRow>

            {/* Total TDS — readonly */}
            <FormRow label="Total TDS">
              <ReadonlyValue
                value={
                  payment?.tds !== undefined
                    ? parseFloat(payment.tds).toFixed(2)
                    : "-"
                }
              />
            </FormRow>

            {/* Total Amount — readonly */}
            <FormRow label="Total Amount">
              <ReadonlyValue
                value={
                  payment?.totalinvoiceamount !== undefined
                    ? parseFloat(payment.totalinvoiceamount).toFixed(2)
                    : "-"
                }
              />
            </FormRow>

            {/* Remark — readonly */}
            <FormRow label="Remark">
              <ReadonlyValue value={payment?.remark} />
            </FormRow>
          </div>

          {/* ── Submit ── */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="rounded-md bg-green-600 px-8 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Linking…" : "Insert Payment"}
            </button>
          </div>
        </Card>
      </div>
    </Page>
  );
}
