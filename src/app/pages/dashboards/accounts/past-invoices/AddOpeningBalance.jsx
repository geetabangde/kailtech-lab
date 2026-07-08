import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router";
import axios from "utils/axios";
import { Page } from "components/shared/Page";
import { Card } from "components/ui";
import { toast } from "sonner";
import { DatePicker } from "components/shared/form/Datepicker";

const EMPTY_ROW = {
  invoiceid: "",
  invoiceno: "",
  invoicedate: "",
  addressid: "",
  address: "",
  statecode: "",
  subtotal: "0",
  discount: "0",
  freight: "0",
  mobilisation: "0",
  witnesscharges: "0",
  samplehandling: "0",
  sampleprep: "0",
  subtotal2: "0",
  cgstper: "9",
  cgstamount: "0",
  sgstper: "9",
  sgstamount: "0",
  igstper: "18",
  igstamount: "0",
  total: "0",
  roundoff: "0",
  finaltotal: "0",
  sgst: 0,
};

const toSlashDate = (value) => {
  if (!value) return "";
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return value;
  const [y, m, d] = String(value).split("-");
  if (!y || !m || !d) return value;
  return `${d}/${m}/${y}`;
};

function CustomerSearch({ customers, value, onChange, disabled }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const selectedName = useMemo(
    () => customers.find((c) => String(c.id) === String(value))?.name ?? "",
    [customers, value],
  );

  const filteredCustomers = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (
      q
        ? customers.filter((c) => (c.name ?? "").toLowerCase().includes(q))
        : customers
    ).slice(0, 80);
  }, [customers, query]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
        setQuery("");
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
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
        placeholder={disabled ? "Loading customers..." : "Search customer..."}
        className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-dark-500 dark:bg-dark-800 dark:text-dark-100 disabled:cursor-not-allowed disabled:opacity-70"
        autoComplete="off"
        disabled={disabled}
      />

      {disabled && (
        <div className="absolute top-1/2 right-2 -translate-y-1/2">
          <svg
            className="h-4 w-4 animate-spin text-primary-500"
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
        </div>
      )}

      {value && !open && !disabled && (
        <button
          type="button"
          onClick={() => {
            onChange("");
            setQuery("");
          }}
          className="absolute top-1/2 right-2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          &times;
        </button>
      )}

      {open && !disabled && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-gray-200 bg-white shadow-xl dark:border-dark-600 dark:bg-dark-800">
          {filteredCustomers.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-400">
              No customers found
            </div>
          ) : (
            filteredCustomers.map((customer) => (
              <div
                key={customer.id}
                onMouseDown={() => {
                  onChange(String(customer.id));
                  setQuery("");
                  setOpen(false);
                }}
                className={`cursor-pointer px-3 py-2 text-sm hover:bg-blue-50 dark:hover:bg-dark-700 ${String(customer.id) === String(value)
                    ? "bg-blue-50 font-semibold text-blue-700 dark:bg-dark-700 dark:text-blue-400"
                    : "text-gray-700 dark:text-dark-200"
                  }`}
              >
                {customer.name}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function AddOpeningBalance() {
  const navigate = useNavigate();
  const permissions = JSON.parse(localStorage.getItem("userPermissions") || "[]");

  useEffect(() => {
    if (!permissions.includes(298)) {
      navigate("/dashboards");
    }
  }, [navigate, permissions]);

  const [customers, setCustomers] = useState([]);
  const [customerid, setCustomerid] = useState("");
  const [date, setDate] = useState("");
  const [invoiceRows, setInvoiceRows] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(true);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [addressid, setAddressid] = useState("");
  const [addressText, setAddressText] = useState("");

  const selectedCustomer = customers.find(
    (customer) => String(customer.id) === String(customerid),
  );

  useEffect(() => {
    setCustomersLoading(true);
    axios
      .get("/people/get-all-customers")
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
        setCustomers(data);
      })
      .catch((err) => {
        console.error("Failed to load customers:", err);
        toast.error("Failed to load customers");
      })
      .finally(() => setCustomersLoading(false));
  }, []);

  const recalcRow = useCallback((row) => {
    const f = (v) => parseFloat(v) || 0;
    const subtotal = f(row.subtotal);
    const discount = f(row.discount);
    const freight = f(row.freight);
    const mobilisation = f(row.mobilisation);
    const witnesscharges = f(row.witnesscharges);
    const samplehandling = f(row.samplehandling);
    const sampleprep = f(row.sampleprep);
    const sgst = Number(row.sgst) === 1 ? 1 : 0;

    const subtotal2 =
      subtotal -
      discount +
      freight +
      mobilisation +
      witnesscharges +
      samplehandling +
      sampleprep;

    let cgstamount = 0;
    let sgstamount = 0;
    let igstamount = 0;

    if (sgst === 1) {
      cgstamount = parseFloat(
        ((subtotal2 / 100) * (f(row.cgstper) || 9)).toFixed(2),
      );
      sgstamount = parseFloat(
        ((subtotal2 / 100) * (f(row.sgstper) || 9)).toFixed(2),
      );
    } else {
      igstamount = parseFloat(
        ((subtotal2 / 100) * (f(row.igstper) || 18)).toFixed(2),
      );
    }

    const total = parseFloat(
      (subtotal2 + cgstamount + sgstamount + igstamount).toFixed(2),
    );
    const finaltotal = Math.round(total);
    const roundoff = parseFloat((finaltotal - total).toFixed(2));

    return {
      ...row,
      subtotal2: subtotal2.toFixed(2),
      cgstamount: cgstamount.toFixed(2),
      sgstamount: sgstamount.toFixed(2),
      igstamount: igstamount.toFixed(2),
      total: total.toFixed(2),
      roundoff: roundoff.toFixed(2),
      finaltotal: String(finaltotal),
      sgst,
    };
  }, []);

  const mapInvoiceRow = useCallback(
    (inv) =>
      recalcRow({
        ...EMPTY_ROW,
        invoiceid: inv.id ?? inv.invoiceid ?? "",
        invoiceno: inv.invoiceno ?? "",
        invoicedate:
          inv.invoicedate?.split?.("T")?.[0] ??
          inv.date?.split?.("T")?.[0] ??
          inv.invoicedate ??
          inv.date ??
          "",
        addressid: inv.addressid ?? "",
        address: inv.address ?? "",
        statecode: String(inv.statecode ?? ""),
        subtotal: String(inv.subtotal ?? "0"),
        discount: String(inv.discount ?? "0"),
        freight: String(inv.freight ?? "0"),
        mobilisation: String(inv.mobilisation ?? "0"),
        witnesscharges: String(inv.witnesscharges ?? "0"),
        samplehandling: String(inv.samplehandling ?? "0"),
        sampleprep: String(inv.sampleprep ?? "0"),
        subtotal2: String(inv.subtotal2 ?? "0"),
        cgstper: String(inv.cgstper ?? "9"),
        cgstamount: String(inv.cgstamount ?? "0"),
        sgstper: String(inv.sgstper ?? "9"),
        sgstamount: String(inv.sgstamount ?? "0"),
        igstper: String(inv.igstper ?? "18"),
        igstamount: String(inv.igstamount ?? "0"),
        total: String(inv.total ?? "0"),
        roundoff: String(inv.roundoff ?? "0"),
        finaltotal: String(inv.finaltotal ?? inv.amount ?? "0"),
        sgst: inv.sgst ?? (inv.statecode == 23 ? 1 : 0),
      }),
    [recalcRow],
  );

  const handleCustomerChange = async (e) => {
    const cid = typeof e === "string" ? e : e.target.value;
    setCustomerid(cid);
    setInvoiceRows([]);
    setAddresses([]);
    setAddressid("");
    setAddressText("");

    if (!cid) return;

    try {
      setInvoiceLoading(true);

      // Fetch both invoices and customer details with addresses
      const [invoicesRes, customerDetailsRes] = await Promise.all([
        axios.get("/accounts/get-invoices-by-customer", { params: { customerid: cid } }),
        axios.get(`/accounts/get-po-detailfor-directinvoice-testing?customerid=${cid}`).catch(() => null),
      ]);

      const invoiceData = Array.isArray(invoicesRes.data) ? invoicesRes.data : invoicesRes.data?.data || [];
      const rows = invoiceData.map(mapInvoiceRow);
      setInvoiceRows(rows);

      // Get addresses from customer details API
      const customerDetails = customerDetailsRes?.data?.data ?? customerDetailsRes?.data ?? {};
      const addressList = customerDetails.addresses ?? [];

      if (addressList.length > 0) {
        setAddresses(addressList);
        setAddressid(String(addressList[0].id));
        setAddressText(addressList[0].full_address ?? addressList[0].address ?? "");
      } else {
        // Fallback: extract unique addresses from invoice rows
        const uniqueAddresses = [];
        const addressMap = new Map();

        rows.forEach((row, index) => {
          if (row.address && !addressMap.has(row.address)) {
            addressMap.set(row.address, true);
            uniqueAddresses.push({
              id: index + 1, // Use index as ID since we don't have addressid
              address: row.address,
              full_address: row.address,
            });
          }
        });

        if (uniqueAddresses.length > 0) {
          setAddresses(uniqueAddresses);
          setAddressid(String(uniqueAddresses[0].id));
          setAddressText(uniqueAddresses[0].address);
        }
      }

      if (rows.length === 0) {
        toast.error("No invoice details found for this customer");
      }
    } catch (err) {
      console.error("Failed to load invoice details:", err);
      toast.error("Failed to load invoice details");
    } finally {
      setInvoiceLoading(false);
    }
  };

  const handleAddressChange = (e) => {
    const aid = e.target.value;
    setAddressid(aid);
    const found = addresses.find((a) => String(a.id) === String(aid));
    setAddressText(found?.full_address ?? found?.address ?? "");
  };

  const handleRowChange = (index, field, value) => {
    setInvoiceRows((prev) => {
      const updated = [...prev];
      updated[index] = recalcRow({ ...updated[index], [field]: value });
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!date) return toast.error("Please select a date");
    if (!customerid) return toast.error("Please select a customer");
    if (!addressid) return toast.error("Please select an address");
    if (invoiceRows.length === 0) {
      return toast.error("No invoice rows available for this customer");
    }

    const firstRow = invoiceRows[0] ?? {};

    // Use the selected address
    const addressValue = addressText || firstRow.address || "";

    const payload = {
      date: toSlashDate(date),
      customerid: Number(customerid),
      customername: selectedCustomer?.name ?? "",
      addressid: Number(addressid),
      address: addressValue,
      statecode: String(
        selectedCustomer?.statecode ?? firstRow.statecode ?? "",
      ).padStart(2, "0"),
      gstno: selectedCustomer?.gstno ?? "",
      pan: selectedCustomer?.pan ?? "",
      opbal: totalFinal,
      invoicedate: invoiceRows.map((row) => toSlashDate(row.invoicedate)),
      invoiceno: invoiceRows.map((row) => row.invoiceno ?? ""),
      subtotal: invoiceRows.map((row) => parseFloat(row.subtotal) || 0),
      disctype: "amount",
      discnumber: 0,
      discount: invoiceRows.map((row) => parseFloat(row.discount) || 0),
      freight: invoiceRows.map((row) => parseFloat(row.freight) || 0),
      mobilisation: invoiceRows.map(
        (row) => parseFloat(row.mobilisation) || 0,
      ),
      witnesstype: "amount",
      witnessnumber: 0,
      witnesscharges: invoiceRows.map(
        (row) => parseFloat(row.witnesscharges) || 0,
      ),
      samplehandling: invoiceRows.map(
        (row) => parseFloat(row.samplehandling) || 0,
      ),
      sampleprep: invoiceRows.map((row) => parseFloat(row.sampleprep) || 0),
      subtotal2: invoiceRows.map((row) => parseFloat(row.subtotal2) || 0),
      total: invoiceRows.map((row) => parseFloat(row.total) || 0),
      roundoff: invoiceRows.map((row) => parseFloat(row.roundoff) || 0),
      finaltotal: invoiceRows.map((row) => parseFloat(row.finaltotal) || 0),
      totalamount: totalFinal,
    };

    const isSgst = String(payload.statecode) === "23";
    if (isSgst) {
      payload.cgstper = invoiceRows.map((row) => parseFloat(row.cgstper) || 0);
      payload.cgstamount = invoiceRows.map(
        (row) => parseFloat(row.cgstamount) || 0,
      );
      payload.sgstper = invoiceRows.map((row) => parseFloat(row.sgstper) || 0);
      payload.sgstamount = invoiceRows.map(
        (row) => parseFloat(row.sgstamount) || 0,
      );
    } else {
      payload.igstper = invoiceRows.map((row) => parseFloat(row.igstper) || 0);
      payload.igstamount = invoiceRows.map(
        (row) => parseFloat(row.igstamount) || 0,
      );
    }

    try {
      setSubmitting(true);
      const res = await axios.post("/accounts/add-past-invoices", payload);

      console.log("API Response:", res.data); // Debug log

      const ok =
        res.data?.success === true ||
        res.data?.status === true ||
        res.data?.status === "true";

      if (!ok) {
        toast.error(res.data?.message ?? "Failed to add opening balance");
        return;
      }

      toast.success(
        res.data?.message,
      );
      navigate("/dashboards/accounts/past-invoices");
    } catch (err) {
      console.error("Failed to add opening balance:", err);
      console.error("Error response:", err?.response?.data); // Debug log
      toast.error(err?.response?.data?.message ?? "Failed to add opening balance");
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls =
    "w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-dark-500 dark:bg-dark-800 dark:text-dark-100";
  const readonlyCls = `${inputCls} bg-gray-100 dark:bg-dark-700`;
  const totalFinal = invoiceRows.reduce(
    (sum, row) => sum + (parseFloat(row.finaltotal) || 0),
    0,
  );

  return (
    <Page title="Add Opening Balance">
      <div className="px-[var(--margin-x)] py-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-dark-50">
            Add Opening Balance
          </h2>
          <button
            type="button"
            onClick={() => navigate("/dashboards/accounts/past-invoices")}
            className="rounded border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-100 dark:border-dark-500 dark:hover:bg-dark-700"
          >
            &laquo; Back Opening Balances
          </button>
        </div>

        <Card className="p-4 sm:p-6">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-dark-200">
                Date
              </label>
              <DatePicker
                options={{
                  dateFormat: "Y-m-d",
                  altInput: true,
                  altFormat: "d/m/Y",
                  allowInput: true,
                }}
                value={date}
                onChange={(dates, dateStr) => setDate(dateStr)}
                className={inputCls}
                required
              />
            </div>

            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-dark-200">
                Customer
              </label>
              <CustomerSearch
                customers={customers}
                value={customerid}
                onChange={handleCustomerChange}
                disabled={customersLoading}
              />
            </div>

            {customerid && addresses.length > 0 && (
              <div className="mb-4">
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-dark-200">
                  Select Address
                </label>
                <select
                  value={addressid}
                  onChange={handleAddressChange}
                  className={inputCls}
                  required
                >
                  <option value="">Select Address</option>
                  {addresses.map((addr) => (
                    <option key={addr.id} value={addr.id}>
                      {addr.display ?? addr.full_address ?? addr.address}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {customerid && invoiceRows.length > 0 && (
              <div className="mb-4">
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-dark-200">
                  Opening Balance
                </label>
                <input
                  type="text"
                  value={totalFinal.toFixed(2)}
                  readOnly
                  className={readonlyCls}
                />
              </div>
            )}

            {invoiceLoading && (
              <div className="mb-4 rounded border border-dashed border-gray-300 px-4 py-6 text-sm text-gray-600 dark:border-dark-500 dark:text-dark-200">
                Loading invoice details...
              </div>
            )}

            {!invoiceLoading && customerid && invoiceRows.length === 0 && (
              <div className="mb-4 rounded border border-dashed border-gray-300 px-4 py-6 text-sm text-gray-600 dark:border-dark-500 dark:text-dark-200">
                No invoice details available for the selected customer.
              </div>
            )}

            {invoiceRows.length > 0 && (
              <div className="mb-4 overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-dark-700">
                      {[
                        "Date",
                        "Bill No",
                        "Subtotal",
                        "Discount",
                        "Freight",
                        "Mobilization",
                        "Witness Charges",
                        "Sample Handling",
                        "Sample Prep",
                        "CGST/IGST",
                        "SGST",
                        "Total",
                        "Round Off",
                        "Final Total",
                      ].map((heading) => (
                        <th
                          key={heading}
                          className="border border-gray-300 p-2 text-left font-semibold dark:border-dark-500"
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceRows.map((row, index) => (
                      <tr key={row.invoiceid || index}>
                        <td className="border border-gray-300 p-1.5 dark:border-dark-500">
                          <DatePicker
                            options={{
                              dateFormat: "Y-m-d",
                              altInput: true,
                              altFormat: "d/m/Y",
                              allowInput: true,
                            }}
                            value={row.invoicedate}
                            onChange={(dates, dateStr) =>
                              handleRowChange(index, "invoicedate", dateStr)
                            }
                            className={inputCls}
                            style={{ minWidth: 130 }}
                          />
                        </td>
                        <td className="border border-gray-300 p-1.5 dark:border-dark-500">
                          <input
                            type="text"
                            value={row.invoiceno}
                            onChange={(e) =>
                              handleRowChange(index, "invoiceno", e.target.value)
                            }
                            className={inputCls}
                            style={{ minWidth: 110 }}
                          />
                        </td>
                        <td className="border border-gray-300 p-1.5 dark:border-dark-500">
                          <input
                            type="text"
                            value={row.subtotal}
                            onChange={(e) =>
                              handleRowChange(index, "subtotal", e.target.value)
                            }
                            className={inputCls}
                            style={{ minWidth: 90 }}
                          />
                        </td>
                        <td className="border border-gray-300 p-1.5 dark:border-dark-500">
                          <input
                            type="text"
                            value={row.discount}
                            onChange={(e) =>
                              handleRowChange(index, "discount", e.target.value)
                            }
                            className={inputCls}
                            style={{ minWidth: 90 }}
                          />
                        </td>
                        <td className="border border-gray-300 p-1.5 dark:border-dark-500">
                          <input
                            type="text"
                            value={row.freight}
                            onChange={(e) =>
                              handleRowChange(index, "freight", e.target.value)
                            }
                            className={inputCls}
                            style={{ minWidth: 90 }}
                          />
                        </td>
                        <td className="border border-gray-300 p-1.5 dark:border-dark-500">
                          <input
                            type="text"
                            value={row.mobilisation}
                            onChange={(e) =>
                              handleRowChange(
                                index,
                                "mobilisation",
                                e.target.value,
                              )
                            }
                            className={inputCls}
                            style={{ minWidth: 110 }}
                          />
                        </td>
                        <td className="border border-gray-300 p-1.5 dark:border-dark-500">
                          <input
                            type="text"
                            value={row.witnesscharges}
                            onChange={(e) =>
                              handleRowChange(
                                index,
                                "witnesscharges",
                                e.target.value,
                              )
                            }
                            className={inputCls}
                            style={{ minWidth: 120 }}
                          />
                        </td>
                        <td className="border border-gray-300 p-1.5 dark:border-dark-500">
                          <input
                            type="text"
                            value={row.samplehandling}
                            onChange={(e) =>
                              handleRowChange(
                                index,
                                "samplehandling",
                                e.target.value,
                              )
                            }
                            className={inputCls}
                            style={{ minWidth: 120 }}
                          />
                        </td>
                        <td className="border border-gray-300 p-1.5 dark:border-dark-500">
                          <input
                            type="text"
                            value={row.sampleprep}
                            onChange={(e) =>
                              handleRowChange(index, "sampleprep", e.target.value)
                            }
                            className={inputCls}
                            style={{ minWidth: 120 }}
                          />
                        </td>
                        <td className="border border-gray-300 p-1.5 dark:border-dark-500">
                          <input
                            type="text"
                            readOnly
                            value={row.sgst === 1 ? row.cgstamount : row.igstamount}
                            className={readonlyCls}
                            style={{ minWidth: 90 }}
                          />
                        </td>
                        <td className="border border-gray-300 p-1.5 dark:border-dark-500">
                          <input
                            type="text"
                            readOnly
                            value={row.sgst === 1 ? row.sgstamount : ""}
                            className={readonlyCls}
                            style={{ minWidth: 90 }}
                          />
                        </td>
                        <td className="border border-gray-300 p-1.5 dark:border-dark-500">
                          <input
                            type="text"
                            readOnly
                            value={row.total}
                            className={readonlyCls}
                            style={{ minWidth: 90 }}
                          />
                        </td>
                        <td className="border border-gray-300 p-1.5 dark:border-dark-500">
                          <input
                            type="text"
                            readOnly
                            value={row.roundoff}
                            className={readonlyCls}
                            style={{ minWidth: 90 }}
                          />
                        </td>
                        <td className="border border-gray-300 p-1.5 dark:border-dark-500">
                          <input
                            type="number"
                            value={row.finaltotal}
                            onChange={(e) =>
                              handleRowChange(index, "finaltotal", e.target.value)
                            }
                            className={inputCls}
                            style={{ minWidth: 100 }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50 dark:bg-dark-800">
                      <td
                        colSpan={11}
                        className="border border-gray-300 p-2 dark:border-dark-500"
                      />
                      <th className="border border-gray-300 p-2 text-right dark:border-dark-500">
                        Total
                      </th>
                      <td
                        colSpan={3}
                        className="border border-gray-300 p-2 dark:border-dark-500"
                      >
                        <input
                          type="text"
                          readOnly
                          value={totalFinal.toFixed(2)}
                          className={readonlyCls}
                        />
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            <div className="mt-2">
              <button
                type="submit"
                disabled={submitting || invoiceLoading}
                className="rounded bg-primary-600 px-5 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
              >
                {submitting ? "Saving..." : "Submit"}
              </button>
            </div>
          </form>
        </Card>
      </div>
    </Page>
  );
}
