// Import Dependencies
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import axios from "utils/axios";
import Select from "react-select";
import { DatePicker } from "components/shared/form/Datepicker";

// Local Imports
import { Page } from "components/shared/Page";

// ----------------------------------------------------------------------

// ----------------------------------------------------------------------

export default function AddCreditNote() {
  const navigate = useNavigate();
  const permissions = JSON.parse(localStorage.getItem("userPermissions") || "[]");

  useEffect(() => {
    if (!permissions.includes(335)) {
      navigate("/dashboards");
    }
  }, [navigate, permissions]);

  const [formData, setFormData] = useState({
    cndate: "",
    customerid: "",
    invoiceid: "",
  });

  const [customers, setCustomers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [items, setItems] = useState([]);
  const [invoiceMeta, setInvoiceMeta] = useState(null); // sgst, tax rates etc.

  // Totals state — mirrors PHP sumamount()
  const [totals, setTotals] = useState({
    subtotal: 0,
    discount: 0,
    freight: 0,
    mobilisation: 0,
    witnesscharges: 0,
    samplehandling: 0,
    sampleprep: 0,
    subtotal2: 0,
    cgstper: 0, cgstamount: 0,
    sgstper: 0, sgstamount: 0,
    igstper: 0, igstamount: 0,
    disctype: "%",
    discnumber: 0,
    witnesstype: "%",
    witnessnumber: 0,
    total: 0,
    roundoff: 0,
    finaltotal: 0,
    potype: "Normal",
  });

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Fetch customers on mount
  useEffect(() => {
    axios
      .get("/people/get-all-customers", { params: { status: 1 } })
      .then((res) => setCustomers(Array.isArray(res.data) ? res.data : res.data?.data || []))
      .catch((err) => console.error("Failed to load customers:", err));
  }, []);

  // Fetch invoices when customer changes — mirrors getinvDetail()
  useEffect(() => {
    if (!formData.customerid) {
      setInvoices([]);
      setItems([]);
      setInvoiceMeta(null);
      return;
    }
    axios
      .get("/accounts/get-invoices-by-customer", { params: { customerid: formData.customerid } })
      .then((res) => {
        let arr = [];
        if (Array.isArray(res.data)) arr = res.data;
        else if (Array.isArray(res.data?.data)) arr = res.data.data;
        else if (Array.isArray(res.data?.invoices)) arr = res.data.invoices;
        else if (Array.isArray(res.data?.records)) arr = res.data.records;
        setInvoices(arr);
      })
      .catch((err) => console.error("Failed to load invoices:", err));
  }, [formData.customerid]);

  // Fetch items when invoice changes — mirrors getinvoiceitemdetail()
  useEffect(() => {
    if (!formData.invoiceid || !formData.customerid) {
      setItems([]);
      setInvoiceMeta(null);
      return;
    }
    axios
      .get("/accounts/get-invoice-details", {
        params: { invoiceid: formData.invoiceid },
      })
      .then((res) => {
        const d = res.data?.data ?? res.data;
        setItems(Array.isArray(d.items) ? d.items : []);
        setInvoiceMeta({
          customername: d.customername || d.customer_name || d.name,
          addressid: d.addressid || d.address_id,
          address: d.address,
          statecode: d.statecode || d.state_code,
          pan: d.pan,
          gstno: d.gstno || d.gst_no,
          sgst: d.sgst_applicable ?? d.sgst ?? 0,
          cgstper: parseFloat(d.cgstper || 0),
          sgstper: parseFloat(d.sgstper || 0),
          igstper: parseFloat(d.igstper || 0),
          subtotal_limit: parseFloat(d.subtotal_limit || 0),
          freight_limit: parseFloat(d.freight_limit || 0),
          mobilisation_limit: parseFloat(d.mobilisation_limit || 0),
          samplehandling_limit: parseFloat(d.samplehandling_limit || 0),
          sampleprep_limit: parseFloat(d.sampleprep_limit || 0),
          discount: parseFloat(d.discount || 0),
          discnumber: parseFloat(d.discnumber || 0),
          disctype: d.disctype || "%",
          potype: d.potype || "",
          brnnos: d.brnnos || "",
          remark: d.remark || ""
        });

        // Populate standard defaults into totals if necessary
        setTotals((prev) => ({
          ...prev,
          disctype: d.disctype || "%",
          discnumber: d.discnumber || 0,
        }));
      })
      .catch((err) => console.error("Failed to load invoice items:", err));
  }, [formData.invoiceid, formData.customerid]);

  // Recalculate totals whenever items or totals inputs change — mirrors sumamount()
  const recalculate = useCallback((currentTotals, currentItems) => {
    let subtotal = 0;
    if (currentTotals.potype === "Normal" || !currentTotals.potype) {
      subtotal = currentItems.reduce((sum, item) => sum + parseFloat(item.rate || 0), 0);
    } else {
      subtotal = parseFloat(currentTotals.subtotal || 0);
    }

    const { disctype, discnumber, witnesstype, witnessnumber } = currentTotals;
    const discountamount = disctype === "%" ? (subtotal / 100) * discnumber : parseFloat(discnumber || 0);
    const witnesscharges = witnesstype === "%" ? (subtotal / 100) * witnessnumber : parseFloat(witnessnumber || 0);

    const freight = parseFloat(currentTotals.freight || 0);
    const mobilisation = parseFloat(currentTotals.mobilisation || 0);
    const samplehandling = parseFloat(currentTotals.samplehandling || 0);
    const sampleprep = parseFloat(currentTotals.sampleprep || 0);

    const subtotal2 = subtotal - discountamount + freight + mobilisation + witnesscharges + samplehandling + sampleprep;

    const sgst = currentTotals.sgst ?? 0;
    let cgstamount = 0, sgstamount = 0, igstamount = 0;
    if (sgst == 1) {
      cgstamount = parseFloat(((subtotal2 / 100) * currentTotals.cgstper).toFixed(2));
      sgstamount = parseFloat(((subtotal2 / 100) * currentTotals.sgstper).toFixed(2));
    } else {
      igstamount = parseFloat(((subtotal2 / 100) * currentTotals.igstper).toFixed(2));
    }

    const totalamount = parseFloat((subtotal2 + cgstamount + sgstamount + igstamount).toFixed(2));
    const finaltotal = Math.round(totalamount);
    const roundoff = parseFloat((finaltotal - totalamount).toFixed(2));

    return {
      ...currentTotals,
      subtotal, discountamount, witnesscharges,
      subtotal2, cgstamount, sgstamount, igstamount,
      total: totalamount, roundoff, finaltotal,
    };
  }, []);

  // Sync invoice meta into totals when invoice changes
  useEffect(() => {
    if (!invoiceMeta) return;
    setTotals((prev) => recalculate({
      ...prev,
      sgst: invoiceMeta.sgst ?? 0,
      cgstper: invoiceMeta.cgstper ?? 0,
      sgstper: invoiceMeta.sgstper ?? 0,
      igstper: invoiceMeta.igstper ?? 0,
      potype: invoiceMeta.potype || "Normal",
    }, items));
  }, [invoiceMeta, items, recalculate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleTotalChange = (e) => {
    const { name, value } = e.target;
    setTotals((prev) => recalculate({ ...prev, [name]: value }, items));
  };

  const handleItemRateChange = (index, value) => {
    const updated = items.map((item, i) =>
      i === index ? { ...item, rate: value } : item
    );
    setItems(updated);
    setTotals((prev) => recalculate(prev, updated));
  };

  const handleItemFieldChange = (index, field, value) => {
    const updated = items.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    setItems(updated);
  };

  const handleAddItem = () => {
    const newItem = { name: "", idno: "", serialno: "", rate: 0 };
    const updated = [...items, newItem];
    setItems(updated);
    setTotals((prev) => recalculate(prev, updated));
  };

  const handleRemoveItem = (index) => {
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
    setTotals((prev) => recalculate(prev, updated));
  };

  const validate = () => {
    const e = {};
    if (!formData.cndate) e.cndate = "CN Date is required.";
    if (!formData.customerid) e.customerid = "Customer is required.";
    if (!formData.invoiceid) e.invoiceid = "Invoice is required.";
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    const selectedCust = customers.find(c => String(c.id || c.customerid) === String(formData.customerid));
    const payload = {
      cndate: formData.cndate,
      customerid: Number(formData.customerid),
      invoice: Number(formData.invoiceid),

      customername: invoiceMeta?.customername || selectedCust?.customername || selectedCust?.name || selectedCust?.customer_name || "N.A",
      addressid: invoiceMeta?.addressid || invoiceMeta?.address_id || selectedCust?.addressid || "0",
      address: invoiceMeta?.address || selectedCust?.address || "N.A",
      statecode: invoiceMeta?.statecode || invoiceMeta?.state_code || selectedCust?.statecode || "N.A",
      pan: invoiceMeta?.pan || selectedCust?.pan || selectedCust?.pancard || selectedCust?.pan_no || "N.A",
      gstno: invoiceMeta?.gstno || invoiceMeta?.gst_no || selectedCust?.gstno || selectedCust?.gstin || "N.A",

      itemrate: items.map(item => parseFloat(item.rate || 0)),
      invoiceitemid: items.map(item => item.itemid || item.invoiceitemid || item.id || ""),
      itemname: items.map(item => item.name || item.itemname || ""),
      itemidno: items.map(item => item.idno || item.itemidno || "N.A"),
      itemserialno: items.map(item => item.serialno || item.itemserialno || "N.A"),

      subtotal: totals.subtotal,
      discnumber: totals.discnumber,
      disctype: totals.disctype,
      discount: totals.discountamount,

      freight: totals.freight,
      mobilisation: totals.mobilisation,

      witnessnumber: totals.witnessnumber,
      witnesstype: totals.witnesstype,
      witnesscharges: totals.witnesscharges,

      samplehandling: totals.samplehandling,
      sampleprep: totals.sampleprep,
      subtotal2: totals.subtotal2,

      cgstper: totals.cgstper,
      cgstamount: totals.cgstamount,
      sgstper: totals.sgstper,
      sgstamount: totals.sgstamount,
      igstper: totals.igstper,
      igstamount: totals.igstamount,

      total: totals.total,
      roundoff: totals.roundoff,
      finaltotal: totals.finaltotal,

      remark: formData.remark || "",
      brnnos: formData.brnnos || invoiceMeta?.brnnos || invoiceMeta?.brn_nos || ""
    };

    try {
      setSubmitting(true);
      const res = await axios.post("/accounts/add-credit-note", payload);
      if (res.data.status === true || res.data.success === true || res.data.status === "success") {
        toast.success(res.data.message || "Credit note added successfully.");
        navigate("/dashboards/accounts/credit-note");
      } else {
        toast.error(res.data.message || "Failed to add credit note.");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Something went wrong adding credit note.");
    } finally {
      setSubmitting(false);
    }
  };

  const isSGST = totals.sgst == 1;

  return (
    <Page title="Add Credit Note">
      <div className="p-4 sm:p-6">

        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-800 dark:text-dark-50">Credit Note</h1>
          <button
            onClick={() => navigate("/dashboards/accounts/credit-note")}
            className="rounded bg-primary-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-primary-700"
          >
            &laquo; Back
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="rounded border border-gray-200 bg-white dark:border-dark-600 dark:bg-dark-800">
            <div className="divide-y divide-gray-100 dark:divide-dark-600">

              {/* CN Date */}
              <FormRow label="CN Date" required error={errors.cndate}>
                <DatePicker
                  options={{
                    dateFormat: "Y-m-d",
                    altInput: true,
                    altFormat: "d/m/Y",
                    allowInput: true,
                  }}
                  value={formData.cndate}
                  onChange={(dates, dateStr) =>
                    handleChange({ target: { name: "cndate", value: dateStr } })
                  }
                  placeholder="CN Date"
                  className={inputClass(errors.cndate)}
                />
              </FormRow>

              {/* Customer */}
              <FormRow label="Customer" required error={errors.customerid}>
                <Select
                  options={customers.map(c => ({
                    value: String(c.id || c.customerid),
                    label: c.name || c.customername || c.customer_name || String(c.id || c.customerid)
                  }))}
                  value={
                    formData.customerid
                      ? {
                          value: String(formData.customerid),
                          label: (() => {
                            const found = customers.find(
                              (c) => String(c.id || c.customerid) === String(formData.customerid)
                            );
                            return found ? (found.name || found.customername || found.customer_name || String(found.id || found.customerid)) : String(formData.customerid);
                          })()
                        }
                      : null
                  }
                  onChange={(option) => {
                    handleChange({ target: { name: "customerid", value: option ? option.value : "" } });
                  }}
                  isClearable
                  isSearchable
                  placeholder="Select Customer..."
                  classNamePrefix="react-select"
                  styles={{
                    control: (base, state) => ({
                      ...base,
                      minHeight: '38px',
                      borderColor: errors.customerid ? '#f87171' : state.isFocused ? '#3b82f6' : '#d1d5db',
                      boxShadow: state.isFocused ? '0 0 0 1px #3b82f6' : 'none',
                      '&:hover': {
                        borderColor: state.isFocused ? '#3b82f6' : '#9ca3af'
                      }
                    })
                  }}
                />
              </FormRow>

              {/* Invoice — shown after customer selected */}
              {invoices.length > 0 && (
                <FormRow label="Invoice" required error={errors.invoiceid}>
                  <select
                    name="invoiceid"
                    value={formData.invoiceid}
                    onChange={handleChange}
                    className={inputClass(errors.invoiceid)}
                  >
                    <option value="">Select Invoice</option>
                    {invoices.map((inv, idx) => {
                      const id = inv.id || inv.invoiceid || idx;
                      const label = inv.invoiceno || inv.invoice_no || inv.invoicenumber || `Invoice ${id}`;
                      const date = inv.date || inv.invoice_date || "";
                      return (
                        <option key={id} value={id}>
                          {label} {date ? `— ${date}` : ""}
                        </option>
                      );
                    })}
                  </select>
                </FormRow>
              )}
            </div>
          </div>

          {/* Items Table — shown after invoice selected */}
          {items.length > 0 && (
            <div className="mt-6 overflow-x-auto rounded border border-gray-200 bg-white dark:border-dark-600 dark:bg-dark-800">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 dark:bg-dark-700">
                  <tr>
                    <th className="p-2 text-left">#</th>
                    <th className="p-2 text-left">Item Name</th>
                    <th className="p-2 text-left">ID No</th>
                    <th className="p-2 text-left">Serial No</th>
                    <th className="p-2 text-left">Rate</th>
                    <th className="p-2 text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr key={i} className="border-t border-gray-100 dark:border-dark-600">
                      <td className="p-2">{i + 1}</td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={item.name || item.itemname || ""}
                          onChange={(e) => handleItemFieldChange(i, "name", e.target.value)}
                          className="w-full rounded border border-gray-300 px-2 py-1 text-sm dark:border-dark-500 dark:bg-dark-700"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={item.idno || item.itemidno || ""}
                          onChange={(e) => handleItemFieldChange(i, "idno", e.target.value)}
                          className="w-full rounded border border-gray-300 px-2 py-1 text-sm dark:border-dark-500 dark:bg-dark-700"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={item.serialno || item.itemserialno || ""}
                          onChange={(e) => handleItemFieldChange(i, "serialno", e.target.value)}
                          className="w-full rounded border border-gray-300 px-2 py-1 text-sm dark:border-dark-500 dark:bg-dark-700"
                        />
                      </td>
                      <td className="p-2">
                        {totals.potype === "Normal" ? (
                          <input
                            type="number"
                            value={item.rate}
                            onChange={(e) => handleItemRateChange(i, e.target.value)}
                            className="w-24 rounded border border-gray-300 px-2 py-1 text-sm dark:border-dark-500 dark:bg-dark-700"
                          />
                        ) : (
                          <span className="text-gray-500 dark:text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="p-2">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(i)}
                          className="rounded bg-red-500 px-2 py-1 text-xs text-white hover:bg-red-600"
                        >
                          X
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="p-3 border-b border-gray-100 dark:border-dark-600">
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="rounded bg-blue-500 px-3 py-1 text-xs text-white hover:bg-blue-600"
                >
                  + Add Item
                </button>
              </div>

              {/* Totals */}
              <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
                <TotalField label="Subtotal" name="subtotal" value={totals.subtotal} onChange={handleTotalChange} readOnly={totals.potype === "Normal"} />
                <TotalField label="Discount Type" name="disctype" value={totals.disctype} onChange={handleTotalChange} isSelect options={["%", "Fixed"]} />
                <TotalField label="Discount" name="discnumber" value={totals.discnumber} onChange={handleTotalChange} />
                <TotalField label="Freight" name="freight" value={totals.freight} onChange={handleTotalChange} />
                <TotalField label="Mobilisation" name="mobilisation" value={totals.mobilisation} onChange={handleTotalChange} />
                <TotalField label="Witness Type" name="witnesstype" value={totals.witnesstype} onChange={handleTotalChange} isSelect options={["%", "Fixed"]} />
                <TotalField label="Witness Charges" name="witnessnumber" value={totals.witnessnumber} onChange={handleTotalChange} />
                <TotalField label="Sample Handling" name="samplehandling" value={totals.samplehandling} onChange={handleTotalChange} />
                <TotalField label="Sample Prep" name="sampleprep" value={totals.sampleprep} onChange={handleTotalChange} />
                <TotalField label="Taxable Amount" value={totals.subtotal2} readOnly />
                {isSGST ? (
                  <>
                    <TotalField label={`CGST (${totals.cgstper}%)`} value={totals.cgstamount} readOnly />
                    <TotalField label={`SGST (${totals.sgstper}%)`} value={totals.sgstamount} readOnly />
                  </>
                ) : (
                  <TotalField label={`IGST (${totals.igstper}%)`} value={totals.igstamount} readOnly />
                )}
                <TotalField label="Total" value={totals.total} readOnly />
                <TotalField label="Round Off" value={totals.roundoff} readOnly />
                <TotalField label="Final Total" value={totals.finaltotal} readOnly />
              </div>
            </div>
          )}

          {/* Remarks */}
          {items.length > 0 && (
            <div className="mt-6 rounded border border-gray-200 bg-white dark:border-dark-600 dark:bg-dark-800">
              <FormRow label="Remarks" required={false}>
                <textarea
                  name="remark"
                  value={formData.remark || ""}
                  onChange={handleChange}
                  placeholder="Enter remarks here..."
                  className={inputClass(errors.remark) + " h-20 resize-none"}
                />
              </FormRow>
            </div>
          )}

          {/* Submit */}
          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="rounded bg-green-600 px-6 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60"
            >
              {submitting ? "Saving..." : "Add Credit Note"}
            </button>
          </div>
        </form>
      </div>
    </Page>
  );
}

// ── Helpers ──

function inputClass(error) {
  return [
    "w-full rounded border px-3 py-2 text-sm outline-none transition",
    "focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20",
    "dark:bg-dark-700 dark:text-dark-100",
    error ? "border-red-400" : "border-gray-300 dark:border-dark-500",
  ].join(" ");
}

function FormRow({ label, required, error, children }) {
  return (
    <div className="flex flex-col gap-1.5 px-4 py-4 sm:flex-row sm:items-start sm:px-6">
      <label className="w-full shrink-0 pt-2 text-sm font-medium text-gray-700 dark:text-dark-200 sm:w-1/4 sm:text-right sm:pr-4">
        {label}{required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      <div className="w-full sm:w-3/4">
        {children}
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      </div>
    </div>
  );
}

function TotalField({ label, name, value, onChange, readOnly, isSelect, options }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-600 dark:text-dark-300">{label}</label>
      {isSelect ? (
        <select
          name={name}
          value={value}

          onChange={onChange}
          className="rounded border border-gray-300 px-2 py-1 text-sm dark:border-dark-500 dark:bg-dark-700"
        >
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input
          type="number"
          name={name}
          value={value}
          onChange={onChange}
          readOnly={readOnly}
          className="rounded border border-gray-300 px-2 py-1 text-sm dark:border-dark-500 dark:bg-dark-700 read-only:bg-gray-50"
        />
      )}
    </div>
  );
}
