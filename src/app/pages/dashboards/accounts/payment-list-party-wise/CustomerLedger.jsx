// Import Dependencies
import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "utils/axios";
import { toast } from "sonner";
import dayjs from "dayjs";

// Local Imports
import { Page } from "components/shared/Page";
import { Card } from "components/ui";
import { DatePicker } from "components/shared/form/Datepicker";

// ----------------------------------------------------------------------

const fmtDate = (d) => {
  if (!d || d === "0000-00-00") return "—";
  const dt = dayjs(d);
  if (!dt.isValid()) return d;
  return dt.format("DD/MM/YYYY");
};

// API expects dd-mm-yyyy
const toApiDate = (d) => {
  if (!d) return "";
  if (/^\d{2}-\d{2}-\d{4}$/.test(d)) return d;
  const [y, m, day] = d.split("-");
  return `${day}-${m}-${y}`;
};

const fmt = (n) =>
  parseFloat(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 });

export default function CustomerLedger() {
  const { customerid } = useParams();

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [ledger, setLedger] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // ── Fetch ledger ──────────────────────────────────────────────────────────
  const handleSearch = async () => {
    if (!startDate || !endDate) {
      toast.error("Please select both start and end dates");
      return;
    }
    try {
      setLoading(true);
      const res = await axios.get(
        `/accounts/get-customer-ledger?customerid=${customerid}&startdate=${toApiDate(startDate)}&enddate=${toApiDate(endDate)}`,
      );
      setLedger(res.data);
      setSearched(true);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load ledger");
    } finally {
      setLoading(false);
    }
  };

  // ── Print ─────────────────────────────────────────────────────────────────
  const handlePrint = () => window.print();

  // ── Running balance from transactions ────────────────────────────────────
  const buildRows = () => {
    if (!ledger) return [];
    let running = parseFloat(ledger.opening_balance || 0);
    return (ledger.transactions || []).map((t) => {
      running =
        running + (parseFloat(t.debit) || 0) - (parseFloat(t.credit) || 0);
      return { ...t, runningBalance: running };
    });
  };
  const rows = buildRows();

  return (
    <Page title="Customer Ledger">
      <div className="transition-content px-[var(--margin-x)] pb-8">
        {/* ── Header + filters ── */}
        <div className="mb-5 flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="dark:text-dark-300 text-xs font-medium text-gray-600">
              Start Date
            </label>
            <DatePicker
              options={{
                dateFormat: "Y-m-d",
                altInput: true,
                altFormat: "d/m/Y",
                allowInput: true,
              }}
              value={startDate}
              onChange={(dates, dateStr) => setStartDate(dateStr)}
              className="focus:border-primary-500 focus:ring-primary-500 dark:border-dark-500 dark:bg-dark-800 dark:text-dark-100 h-9 rounded-md border border-gray-300 px-3 text-sm text-gray-700 focus:ring-1 focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="dark:text-dark-300 text-xs font-medium text-gray-600">
              End Date
            </label>
            <DatePicker
              options={{
                dateFormat: "Y-m-d",
                altInput: true,
                altFormat: "d/m/Y",
                allowInput: true,
                minDate: startDate,
              }}
              value={endDate}
              onChange={(dates, dateStr) => setEndDate(dateStr)}
              className="focus:border-primary-500 focus:ring-primary-500 dark:border-dark-500 dark:bg-dark-800 dark:text-dark-100 h-9 rounded-md border border-gray-300 px-3 text-sm text-gray-700 focus:ring-1 focus:outline-none"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading}
            className="bg-primary-600 hover:bg-primary-700 h-9 rounded-md px-5 text-sm font-medium text-white disabled:opacity-50"
          >
            {loading ? "Searching…" : "Search"}
          </button>
          {searched && (
            <button
              onClick={handlePrint}
              className="h-9 rounded-md border border-yellow-400 bg-yellow-50 px-5 text-sm font-medium text-yellow-700 hover:bg-yellow-100 dark:border-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400"
            >
              Print
            </button>
          )}
          <Link
            to={`/dashboards/accounts/customer-payment/${customerid}`}
            className="inline-flex items-center dark:border-dark-500 dark:text-dark-300 dark:hover:bg-dark-700 ml-auto h-9 rounded border border-gray-300 px-4 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            ← Payment List
          </Link>
        </div>

        {/* ── Ledger Table ── */}
        {searched && ledger && (
          <Card className="p-6">
            {/* Company header for print */}
            <div className="mb-6 text-center print:block">
              <h2 className="dark:text-dark-50 text-2xl font-bold text-gray-800">
                Ledger Account
              </h2>
              <p className="dark:text-dark-300 mt-1 text-sm text-gray-600">
                {fmtDate(startDate)} to {fmtDate(endDate)}
              </p>
            </div>

            {/* Summary badges */}
            <div className="mb-4 flex flex-wrap gap-3 text-center justify-center">
              <SummaryBadge
                label="Opening Balance"
                value={`₹${fmt(ledger.opening_balance)}`}
                color={
                  parseFloat(ledger.opening_balance) >= 0 ? "green" : "red"
                }
              />
              <SummaryBadge
                label="Closing Balance"
                value={`₹${fmt(ledger.closing_balance)}`}
                color={
                  parseFloat(ledger.closing_balance) >= 0 ? "green" : "red"
                }
              />
              {ledger.closing_debit !== undefined && (
                <SummaryBadge
                  label="Total Debit"
                  value={`₹${fmt(ledger.closing_debit)}`}
                  color="gray"
                />
              )}
              {ledger.closing_credit !== undefined && (
                <SummaryBadge
                  label="Total Credit"
                  value={`₹${fmt(ledger.closing_credit)}`}
                  color="blue"
                />
              )}
            </div>

            <div className="dark:border-dark-500 overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="dark:bg-dark-800 dark:text-dark-200 bg-gray-100 text-left text-xs font-semibold text-gray-700 uppercase">
                    {[
                      "Date",
                      "Particulars",
                      "Vch Type",
                      "Vch No.",
                      "Debit",
                      "Credit",
                      "Balance",
                    ].map((h) => (
                      <th key={h} className="px-4 py-2.5 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Opening Balance row */}
                  <tr className="dark:border-dark-500 border-t border-gray-200 bg-blue-50 font-semibold dark:bg-blue-900/10">
                    <td className="dark:text-dark-400 px-4 py-2.5 text-gray-500">
                      —
                    </td>
                    <td className="dark:text-dark-100 px-4 py-2.5 text-gray-800">
                      Opening Balance
                    </td>
                    <td className="px-4 py-2.5">—</td>
                    <td className="px-4 py-2.5">—</td>
                    <td className="px-4 py-2.5">
                      {parseFloat(ledger.opening_balance) > 0
                        ? `₹${fmt(ledger.opening_balance)}`
                        : ""}
                    </td>
                    <td className="px-4 py-2.5">
                      {parseFloat(ledger.opening_balance) < 0
                        ? `₹${fmt(Math.abs(ledger.opening_balance))}`
                        : ""}
                    </td>
                    <td className="dark:text-dark-100 px-4 py-2.5 font-bold text-gray-800">
                      ₹{fmt(ledger.opening_balance)}
                    </td>
                  </tr>

                  {/* Transaction rows */}
                  {rows.length > 0 ? (
                    rows.map((t, idx) => (
                      <tr
                        key={idx}
                        className="dark:border-dark-500 dark:hover:bg-dark-800/50 border-t border-gray-200 hover:bg-gray-50"
                      >
                        <td className="dark:text-dark-300 px-4 py-2.5 text-gray-600">
                          {fmtDate(t.transactiondate)}
                        </td>
                        <td className="dark:text-dark-100 px-4 py-2.5 font-medium text-gray-800">
                          {t.transactiontype}
                        </td>
                        <td className="dark:text-dark-300 px-4 py-2.5 text-gray-600">
                          {t.source}
                        </td>
                        <td className="dark:text-dark-300 px-4 py-2.5 text-gray-600">
                          {t.refno}
                        </td>
                        <td className="dark:text-dark-200 px-4 py-2.5 text-gray-700">
                          {parseFloat(t.debit) > 0 ? `₹${fmt(t.debit)}` : ""}
                        </td>
                        <td className="dark:text-dark-200 px-4 py-2.5 text-gray-700">
                          {parseFloat(t.credit) > 0 ? `₹${fmt(t.credit)}` : ""}
                        </td>
                        <td
                          className={`px-4 py-2.5 font-semibold ${
                            t.runningBalance >= 0
                              ? "text-green-700 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          ₹{fmt(t.runningBalance)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr className="dark:border-dark-500 border-t border-gray-200">
                      <td
                        colSpan={7}
                        className="dark:text-dark-400 py-8 text-center text-sm text-gray-500"
                      >
                        No transactions in this date range.
                      </td>
                    </tr>
                  )}

                  {/* Closing Balance row */}
                  <tr className="dark:border-dark-400 dark:bg-dark-800 border-t-2 border-gray-300 bg-gray-50 font-bold">
                    <td className="dark:text-dark-400 px-4 py-2.5 text-gray-500">
                      —
                    </td>
                    <td className="dark:text-dark-100 px-4 py-2.5 text-gray-800">
                      Closing Balance
                    </td>
                    <td className="px-4 py-2.5">—</td>
                    <td className="px-4 py-2.5">—</td>
                    <td className="dark:text-dark-200 px-4 py-2.5 text-gray-700">
                      {parseFloat(ledger.closing_debit) > 0
                        ? `₹${fmt(ledger.closing_debit)}`
                        : ""}
                    </td>
                    <td className="dark:text-dark-200 px-4 py-2.5 text-gray-700">
                      {parseFloat(ledger.closing_credit) > 0
                        ? `₹${fmt(ledger.closing_credit)}`
                        : ""}
                    </td>
                    <td
                      className={`px-4 py-2.5 text-base ${
                        parseFloat(ledger.closing_balance) >= 0
                          ? "text-green-700 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      ₹{fmt(ledger.closing_balance)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* ── Empty state before search ── */}
        {!searched && !loading && (
          <Card className="flex items-center justify-center py-20 text-center">
            <p className="dark:text-dark-400 text-sm text-gray-500">
              Select a date range and click Search to view the ledger.
            </p>
          </Card>
        )}
      </div>
    </Page>
  );
}

function SummaryBadge({ label, value, color }) {
  const colorMap = {
    blue: "bg-blue-50  text-blue-700  dark:bg-blue-900/20  dark:text-blue-400",
    green:
      "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400",
    red: "bg-red-50   text-red-700   dark:bg-red-900/20   dark:text-red-400",
    gray: "bg-gray-100 text-gray-700  dark:bg-dark-700     dark:text-dark-200",
  };
  return (
    <div className={`rounded-lg px-4 py-2 text-sm ${colorMap[color]}`}>
      <span className="font-medium">{label}: </span>
      <span className="font-bold">{value}</span>
    </div>
  );
}
