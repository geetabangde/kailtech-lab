import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import axios from "utils/axios";
import { toast } from "sonner";
import { Page } from "components/shared/Page";
import { Card } from "components/ui";
import Select from "react-select";

// ── Style tokens ──────────────────────────────────────────────────────────
const inputCls =
  "dark:bg-dark-900 dark:border-dark-500 dark:text-dark-100 dark:placeholder-dark-400 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";

const labelCls =
  "dark:text-dark-300 mb-1 block text-sm font-medium text-gray-700";

// ── FormRow ───────────────────────────────────────────────────────────────
function FormRow({ label, required, children, span2 }) {
  return (
    <div className={span2 ? "sm:col-span-2" : ""}>
      <label className={labelCls}>
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

// ── Spinner ───────────────────────────────────────────────────────────────
function Spinner({ text = "Loading..." }) {
  return (
    <div className="flex h-[60vh] items-center justify-center gap-2 text-gray-600">
      <svg
        className="h-5 w-5 animate-spin text-blue-600"
        viewBox="0 0 24 24"
        fill="none"
      >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z" />
      </svg>
      {text}
    </div>
  );
}

export default function AddNewProformaInvoice() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const permissions = JSON.parse(localStorage.getItem("userPermissions") || "[]");

  useEffect(() => {
    if (!permissions.includes(62)) {
      navigate("/dashboards");
    }
  }, [navigate, permissions]);

  const [invoiceId, setInvoiceId] = useState(id ?? null);
  const [editLoaded, setEditLoaded] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successId, setSuccessId] = useState(null);

  const [form, setForm] = useState({
    customerid: "",
    addressid: "",
    customername: "",
    cperson: "",
    gstno: "",
    statecode: "",
    pan: "",
    refno: "",
    refdate: new Date().toISOString().slice(0, 10),
    remark: "",
    typeofinvoice: "",
  });
  const setField = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const [customers, setCustomers] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [contacts, setContacts] = useState([]);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    axios.get("/people/get-all-customers").then((res) => {
      setCustomers(res.data.data ?? res.data ?? []);
    });
  }, []);

  const loadCustomerData = useCallback(async (cid) => {
    if (!cid) {
      setAddresses([]);
      setContacts([]);
      return;
    }
    try {
      const [addrRes, contactRes] = await Promise.all([
        axios.get(`/people/get-customers-address/${cid}`),
        axios.get(`/get-concern-person/${cid}`),
      ]);
      const fetchedAddresses = addrRes.data.data ?? addrRes.data ?? [];
      const fetchedContacts = contactRes.data.data ?? contactRes.data ?? [];
      setAddresses(fetchedAddresses);
      setContacts(fetchedContacts);
      
      setForm((prev) => {
        const next = { ...prev };
        if (!prev.cperson && fetchedContacts.length > 0) {
          next.cperson = fetchedContacts[0].id;
        }
        return next;
      });
    } catch {
      toast.error("Failed to load customer data");
    }
  }, []);

  useEffect(() => {
    if (!form.customerid) return;
    if (isEdit && !editLoaded) return;
    loadCustomerData(form.customerid);
  }, [form.customerid, loadCustomerData, isEdit, editLoaded]);

  useEffect(() => {
    if (!isEdit) return;
    const load = async () => {
      try {
        const res = await axios.get(`/accounts/get-proforma-invoicebyid/${id}`);
        const d = res.data.data ?? {};
        setForm({
          customerid: d.customerid ?? "",
          addressid: d.addressid ?? "",
          customername: d.customername ?? "",
          cperson: d.cperson ?? "",
          gstno: d.gstno ?? "",
          statecode: String(d.statecode ?? ""),
          pan: d.pan ?? "",
          refno: d.refno ?? "",
          refdate: d.refdate ?? "",
          remark: d.remark ?? "",
          typeofinvoice: d.typeofinvoice ?? "Calibration",
        });
        if (d.customerid) await loadCustomerData(d.customerid);
        setInvoiceId(id);
        setEditLoaded(true);
      } catch {
        toast.error("Failed to load invoice");
        navigate("/dashboards/accounts/proforma-invoice");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, isEdit, navigate, loadCustomerData]);

  const toPhpDate = (dateStr) => {
    if (!dateStr) return "";
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return dateStr;
    const [y, m, d] = dateStr.split("-");
    return `${d}/${m}/${y}`;
  };

  const handleSaveHeader = async () => {
    if (!form.customerid) {
      toast.error("Customer is required");
      return;
    }
    if (!form.refno) {
      toast.error("Ref No is required");
      return;
    }
    if (!form.refdate) {
      toast.error("Ref Date is required");
      return;
    }
    if (!form.typeofinvoice) {
      toast.error("Type of Invoice is required");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        customerid: Number(form.customerid),
        addressid: Number(form.addressid),
        customername: form.customername,
        cperson: Number(form.cperson),
        gstno: form.gstno,
        statecode: form.statecode || "00",
        pan: form.pan,
        refno: form.refno,
        refdate: toPhpDate(form.refdate),
        remark: form.remark,
        typeofinvoice: form.typeofinvoice,
      };

      let currentId = invoiceId;
      if (!isEdit && !currentId) {
        const res = await axios.post("/accounts/add-proforma-inovice", payload);

        if (
          res.data.success === true ||
          res.data.status === true ||
          res.data.status === "true"
        ) {
          let extractedId =
            res.data.id ??
            res.data.data?.id ??
            res.data.insertId ??
            res.data.data?.insertId ??
            res.data.proformainvoiceid;

          if (!extractedId && (typeof res.data.data === 'number' || typeof res.data.data === 'string')) {
            extractedId = res.data.data;
          }

          if (!extractedId) {
            try {
              const listRes = await axios.get("/accounts/proforma-invoicelist");
              const invoices = listRes.data?.data || [];
              const match = invoices.find(i => String(i.refno) === String(payload.refno));
              if (match && match.id) {
                extractedId = match.id;
              } else if (invoices.length > 0) {
                extractedId = Math.max(...invoices.map(i => i.id));
              }
            } catch (err) {
              console.error("Failed to fetch list for fallback ID extraction", err);
            }
          }

          if (!extractedId) {
            toast.success("Invoice created but couldn't retrieve ID. Redirecting to list.");
            navigate("/dashboards/accounts/proforma-invoice");
            return;
          }

          currentId = extractedId;
          setInvoiceId(currentId);
          setSuccessId(currentId);
          setShowSuccessModal(true);
        } else {
          toast.error(res.data.message ?? "Failed to create invoice");
          return;
        }
      } else {
        await axios.post(
          `/accounts/update-proforma-invoice/${currentId}`,
          payload,
        );
        toast.success("Invoice updated ✅");
        navigate("/dashboards/accounts/proforma-invoice");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const customerOptions = customers.map(c => ({ value: c.id, label: c.name }));

  if (loading) {
    return (
      <Page title={isEdit ? "Edit Proforma Invoice" : "Add Proforma Invoice"}>
        <Spinner />
      </Page>
    );
  }

  const navigateToItems = () => {
    setShowSuccessModal(false);
    if (form.typeofinvoice === "Calibration") {
      navigate(`/dashboards/accounts/proforma-invoice/add-item-calibration/${successId}`);
    } else {
      navigate(`/dashboards/accounts/proforma-invoice/add-item-testing/${successId}`);
    }
  };

  return (
    <Page title={isEdit ? "Edit Proforma Invoice" : "Add Proforma Invoice"}>
      <div className="transition-content px-[var(--margin-x)] pb-8">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="dark:text-dark-50 text-xl font-semibold text-gray-800">
            {isEdit ? "Edit Proforma Invoice" : "Add New Proforma Invoice"}
          </h2>
          <button
            onClick={() => navigate("/dashboards/accounts/proforma-invoice")}
            className="dark:border-dark-500 dark:text-dark-300 dark:hover:bg-dark-700 rounded border border-gray-300 px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
          >
            ← Back to Proforma Invoice List
          </button>
        </div>

        <Card className="p-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <FormRow label="Customer Name" required span2>
              <Select
                options={customerOptions}
                value={customerOptions.find(o => o.value == form.customerid) || null}
                onChange={(selected) => {
                  if (!selected) {
                    setField("customerid", "");
                    setField("customername", "");
                    setAddresses([]);
                    setContacts([]);
                  } else {
                    const c = customers.find((x) => x.id == selected.value);
                    setForm((p) => ({
                      ...p,
                      customerid: selected.value,
                      customername: selected.label,
                      gstno: c?.gstno || "",
                      pan: c?.pan || "",
                      statecode: c?.statecode || "",
                      addressid: "",
                      cperson: "",
                    }));
                  }
                }}
                placeholder="Select Customer"
                isClearable
                className="react-select-container"
                classNamePrefix="react-select"
                styles={{
                  control: (provided) => ({
                    ...provided,
                    borderColor: '#d1d5db',
                    '&:hover': { borderColor: '#3b82f6' },
                    boxShadow: 'none',
                    '&:focus-within': { borderColor: '#3b82f6', boxShadow: '0 0 0 1px #3b82f6' }
                  }),
                  menu: (provided) => ({
                    ...provided,
                    zIndex: 9999
                  })
                }}
              />
            </FormRow>

            {form.customerid && (
              <>
                <FormRow label="Customer Address" required span2>
                  <Select
                    options={addresses.map((a) => ({ value: a.id, label: `${a.name} (${a.address})` }))}
                    value={
                      form.addressid
                        ? {
                            value: form.addressid,
                            label: addresses.find((a) => String(a.id) === String(form.addressid))
                              ? `${addresses.find((a) => String(a.id) === String(form.addressid)).name} (${addresses.find((a) => String(a.id) === String(form.addressid)).address})`
                              : form.addressid,
                          }
                        : null
                    }
                    onChange={(selected) => setField("addressid", selected ? selected.value : "")}
                    placeholder="Select Address"
                    isClearable
                    className="react-select-container"
                    classNamePrefix="react-select"
                    styles={{
                      control: (provided) => ({
                        ...provided,
                        borderColor: '#d1d5db',
                        '&:hover': { borderColor: '#3b82f6' },
                        boxShadow: 'none',
                        '&:focus-within': { borderColor: '#3b82f6', boxShadow: '0 0 0 1px #3b82f6' }
                      }),
                      menu: (provided) => ({ ...provided, zIndex: 9999 })
                    }}
                  />
                </FormRow>

                <FormRow label="Contact Person Name" required>
                  <Select
                    options={contacts.map((c) => ({ value: c.id, label: c.name }))}
                    value={
                      form.cperson
                        ? {
                            value: form.cperson,
                            label: contacts.find((c) => String(c.id) === String(form.cperson))?.name || form.cperson,
                          }
                        : null
                    }
                    onChange={(selected) => setField("cperson", selected ? selected.value : "")}
                    placeholder="Select Person"
                    isClearable
                    className="react-select-container"
                    classNamePrefix="react-select"
                    styles={{
                      control: (provided) => ({
                        ...provided,
                        borderColor: '#d1d5db',
                        '&:hover': { borderColor: '#3b82f6' },
                        boxShadow: 'none',
                        '&:focus-within': { borderColor: '#3b82f6', boxShadow: '0 0 0 1px #3b82f6' }
                      }),
                      menu: (provided) => ({ ...provided, zIndex: 9999 })
                    }}
                  />
                </FormRow>

                <FormRow label="GST Number">
                  <input
                    type="text"
                    value={form.gstno}
                    onChange={(e) => setField("gstno", e.target.value)}
                    className={inputCls}
                    readOnly
                  />
                </FormRow>

                <FormRow label="PAN Number">
                  <input
                    type="text"
                    value={form.pan}
                    onChange={(e) => setField("pan", e.target.value)}
                    className={inputCls}
                    readOnly
                  />
                </FormRow>
              </>
            )}

            <FormRow label="Ref No" required>
              <input
                type="text"
                value={form.refno}
                onChange={(e) => setField("refno", e.target.value)}
                className={inputCls}
                required
              />
            </FormRow>

            <FormRow label="Ref Date" required>
              <input
                type="date"
                value={form.refdate}
                max={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setField("refdate", e.target.value)}
                className={inputCls}
                required
              />
            </FormRow>

            <FormRow label="Remark" span2>
              <textarea
                value={form.remark}
                onChange={(e) => setField("remark", e.target.value)}
                rows={2}
                className={`${inputCls} resize-none`}
              />
            </FormRow>

            <FormRow label="Type" required>
              <Select
                options={[
                  { value: "Testing", label: "Testing" },
                  { value: "Calibration", label: "Calibration" }
                ]}
                value={
                  form.typeofinvoice
                    ? { value: form.typeofinvoice, label: form.typeofinvoice }
                    : null
                }
                onChange={(selected) => {
                  setField("typeofinvoice", selected ? selected.value : "");
                }}
                placeholder="Select Option"
                isClearable
                isDisabled={isEdit}
                className="react-select-container"
                classNamePrefix="react-select"
                styles={{
                  control: (provided) => ({
                    ...provided,
                    borderColor: '#d1d5db',
                    '&:hover': { borderColor: '#3b82f6' },
                    boxShadow: 'none',
                    '&:focus-within': { borderColor: '#3b82f6', boxShadow: '0 0 0 1px #3b82f6' }
                  }),
                  menu: (provided) => ({
                    ...provided,
                    zIndex: 9999
                  })
                }}
              />
            </FormRow>
          </div>

          <div className="mt-5 flex justify-end">
            <button
              onClick={handleSaveHeader}
              disabled={saving}
              className="rounded-md bg-green-600 px-8 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving…" : (isEdit ? "Update Header" : "Proceed to add Items")}
            </button>
          </div>
        </Card>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h3 className="text-lg font-bold text-gray-800">Result</h3>
              <button
                onClick={navigateToItems}
                className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
              >
                &times;
              </button>
            </div>
            <div className="p-6 text-center text-gray-700">
              Success : New Quotation has been Added to your Catalogue
            </div>
            <div className="flex justify-end border-t px-4 py-3">
              <button
                onClick={navigateToItems}
                className="text-blue-600 font-medium hover:text-blue-800"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </Page>
  );
}