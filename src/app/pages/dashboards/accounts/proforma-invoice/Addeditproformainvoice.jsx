// AddEditProformaInvoice.jsx
// Route add:  /dashboards/accounts/proforma-invoice/add
// Route edit: /dashboards/accounts/proforma-invoice/edit/:id
//
// PHP exact port:
// Calibration items → getItemForQuotation.php
//   listofinstruments → calibrationprice (instid + location)
//   API: GET /calibrationoperations/get-calibrationprice-byidandlocation?id=X&location=X
//   Row fields: name (from listofinstruments), instid, accreditation, packagedesc, qty=1, rate, amount, location
//
// Testing items → getItemForProforma.php
//   products + testprices
//   API: GET /testing/get-products-byid/:pid  (product name/description)
//   API: GET /sales/get-test-package-byid/:id (package: rate, category, package name)
//   Row fields: name (product), instid(productid), accreditation(category 0=General,1=BIS),
//               description (product.description + "\n" + package.package), qty=1, rate, amount
//
// Package list: GET /testing/get-package-list?pid=X

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import axios from "utils/axios";
import { toast } from "sonner";
import { Page } from "components/shared/Page";
import { Card } from "components/ui";
import Select from "react-select";

// ── Style tokens ──────────────────────────────────────────────────────────
const inputCls =
  "dark:bg-dark-900 dark:border-dark-500 dark:text-dark-100 dark:placeholder-dark-400 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";
const selectCls =
  "dark:bg-dark-900 dark:border-dark-500 dark:text-dark-100 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";
const labelCls =
  "dark:text-dark-300 mb-1 block text-sm font-medium text-gray-700";

const COMPANY_STATE_CODE = "23";

// PHP: $category = array("0"=>"General","1"=>"BIS")
const CATEGORY_MAP = { 0: "General", 1: "BIS" };

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
      {text}
    </div>
  );
}

// ── PHP sumamount() exact port ────────────────────────────────────────────
function calcTotals(items, charges, typeofinvoice) {
  const subtotal = items.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);
  const discnumber = parseFloat(charges.discnumber) || 0;
  const disctype = charges.disctype || "%";
  const discount =
    disctype === "%" ? (subtotal / 100) * discnumber : discnumber;
  const freight = parseFloat(charges.freight) || 0;
  const mobilisation = parseFloat(charges.mobilisation) || 0;

  let subtotal2 = subtotal - discount + freight + mobilisation;
  let witnesscharges = 0,
    samplehandling = 0,
    sampleprep = 0;

  // PHP: Testing type only
  if (typeofinvoice !== "Calibration") {
    const witnessnumber = parseFloat(charges.witnessnumber) || 0;
    const witnesstype = charges.witnesstype || "%";
    witnesscharges =
      witnesstype === "%" ? (subtotal / 100) * witnessnumber : witnessnumber;
    samplehandling = parseFloat(charges.samplehandling) || 0;
    sampleprep = parseFloat(charges.sampleprep) || 0;
    subtotal2 += witnesscharges + samplehandling + sampleprep;
  }

  const isSgst =
    String(charges.statecode || "").padStart(2, "0") === COMPANY_STATE_CODE;
  const cgstper = parseFloat(charges.cgstper) || 0;
  const sgstper = parseFloat(charges.sgstper) || 0;
  const igstper = parseFloat(charges.igstper) || 0;

  const cgstamount = isSgst
    ? parseFloat(((subtotal2 / 100) * cgstper).toFixed(2))
    : 0;
  const sgstamount = isSgst
    ? parseFloat(((subtotal2 / 100) * sgstper).toFixed(2))
    : 0;
  const igstamount = !isSgst
    ? parseFloat(((subtotal2 / 100) * igstper).toFixed(2))
    : 0;
  const total = parseFloat(
    (subtotal2 + cgstamount + sgstamount + igstamount).toFixed(2),
  );

  return {
    subtotal: parseFloat(subtotal.toFixed(2)),
    discount: parseFloat(discount.toFixed(2)),
    witnesscharges: parseFloat(witnesscharges.toFixed(2)),
    samplehandling: parseFloat(samplehandling.toFixed(2)),
    sampleprep: parseFloat(sampleprep.toFixed(2)),
    subtotal2: parseFloat(subtotal2.toFixed(2)),
    cgstamount,
    sgstamount,
    igstamount,
    total,
    isSgst,
  };
}

// ── Main ──────────────────────────────────────────────────────────────────
export default function AddEditProformaInvoice() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const permissions = JSON.parse(localStorage.getItem("userPermissions") || "[]");

  useEffect(() => {
    if (!permissions.includes(62)) {
      navigate("/dashboards");
    }
  }, [navigate, permissions]);

  const [step, setStep] = useState(1);
  const [invoiceId, setInvoiceId] = useState(id ?? null);
  const [editLoaded, setEditLoaded] = useState(false);

  // ── Step 1 form ───────────────────────────────────────────────────────
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
    typeofinvoice: "Calibration",
  });
  const setField = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const [customers, setCustomers] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [contacts, setContacts] = useState([]);

  // ── Step 2 state ──────────────────────────────────────────────────────
  const [items, setItems] = useState([]);
  const instnoRef = useRef(0); // PHP: var instno = 0

  // Calibration
  const [instruments, setInstruments] = useState([]);
  const [selectedInst, setSelectedInst] = useState("");
  const [instLocation, setInstLocation] = useState("Lab");

  // Testing
  const [products, setProducts] = useState([]);
  const [packages, setPackages] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedPackage, setSelectedPackage] = useState("");

  const [addingItem, setAddingItem] = useState(false);

  // Charges
  const [charges, setCharges] = useState({
    discnumber: 0,
    disctype: "%",
    freight: 0,
    mobilisation: 0,
    witnesstype: "%",
    witnessnumber: 0,
    samplehandling: 0,
    sampleprep: 0,
    cgstper: 9,
    sgstper: 9,
    igstper: 18,
    statecode: "",
  });
  const setCharge = (k, v) => setCharges((p) => ({ ...p, [k]: v }));

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [savingItems, setSavingItems] = useState(false);

  const totals = calcTotals(
    items,
    { ...charges, statecode: form.statecode },
    form.typeofinvoice,
  );

  // ── Load customers ────────────────────────────────────────────────────
  useEffect(() => {
    axios.get("/people/get-all-customers").then((res) => {
      setCustomers(res.data.data ?? res.data ?? []);
    });
  }, []);

  // ── Load instruments list (calibration) ──────────────────────────────
  useEffect(() => {
    if (form.typeofinvoice === "Calibration") {
      axios.get("/calibrationoperations/list-of-instrument").then((res) => {
        setInstruments(res.data.data ?? res.data ?? []);
      });
    } else {
      // Testing: load products list
      // API: GET /testing/get-prodcut-list
      axios.get("/testing/get-prodcut-list").then((res) => {
        setProducts(res.data.data ?? res.data ?? []);
      });
    }
  }, [form.typeofinvoice]);

  // ── Load package list when product changes (testing) ─────────────────
  // PHP: $("#package").val() → getItemForProforma.php
  // API: GET /testing/get-package-list?pid=X
  useEffect(() => {
    if (!selectedProduct || form.typeofinvoice === "Calibration") return;
    axios
      .get(`/testing/get-package-list?pid=${selectedProduct}`)
      .then((res) => {
        setPackages(res.data.data ?? res.data ?? []);
        setSelectedPackage("");
      });
  }, [selectedProduct, form.typeofinvoice]);

  // ── Load customer addresses + contacts ────────────────────────────────
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
      setAddresses(addrRes.data.data ?? addrRes.data ?? []);
      setContacts(contactRes.data.data ?? contactRes.data ?? []);
    } catch {
      toast.error("Failed to load customer data");
    }
  }, []);

  useEffect(() => {
    if (!form.customerid) return;
    if (isEdit && !editLoaded) return;
    loadCustomerData(form.customerid);
  }, [form.customerid, loadCustomerData, isEdit, editLoaded]);

  // ── Edit mode load ────────────────────────────────────────────────────
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
        setCharges({
          discnumber: d.discnumber ?? 0,
          disctype: d.disctype ?? "%",
          freight: d.freight ?? 0,
          mobilisation: d.mobilisation ?? 0,
          witnesstype: d.witnesstype || "%",
          witnessnumber: d.witnessnumber || 0,
          samplehandling: d.samplehandling || 0,
          sampleprep: d.sampleprep ?? 0,
          cgstper: d.cgstper || 9,
          sgstper: d.sgstper || 9,
          igstper: d.igstper || 18,
          statecode: String(d.statecode ?? ""),
        });
        if (d.items)
          setItems(d.items.map((i, idx) => ({ ...i, _key: `edit-${idx}` })));
        if (d.customerid) await loadCustomerData(d.customerid);
        setInvoiceId(id);
        setStep(2);
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

  // ── Step 1 submit ─────────────────────────────────────────────────────
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
            // BACKEND WORKAROUND: API doesn't return the new ID.
            // Let's fetch the list and find the invoice we just created by its refno.
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
          toast.success("Invoice created ✅");
          // ✅ FIX: navigate to edit screen to add items
          navigate(`/dashboards/accounts/proforma-invoice/edit/${currentId}`);
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
        // ✅ FIX: navigate to list after edit
        navigate("/dashboards/accounts/proforma-invoice");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  // ── Add Calibration Item ──────────────────────────────────────────────
  // PHP: getItemForQuotation.php
  //   listofinstruments → name, id
  //   calibrationprice → accreditation, packagedesc, rate, location
  // API: GET /calibrationoperations/get-calibrationprice-byidandlocation?id=X&location=X
  const handleAddCalibrationItem = async () => {
    if (!selectedInst) {
      toast.error("Please select an instrument");
      return;
    }
    setAddingItem(true);
    try {
      const res = await axios.get(
        `/calibrationoperations/get-calibrationprice-byidandlocation?id=${selectedInst}&location=${instLocation}`,
      );
      const priceRows = res.data.data ?? res.data ?? [];
      if (!Array.isArray(priceRows) || priceRows.length === 0) {
        toast.info("No calibration prices found for this instrument/location");
        return;
      }

      // PHP: $row = listofinstruments (name)
      // $rowmatrix = calibrationprice (accreditation, packagedesc, rate, location)
      const instName =
        instruments.find((i) => String(i.id) === String(selectedInst))?.name ??
        "";
      const k = items.length; // PHP: $k = $itemcount

      const newItems = priceRows.map((rowmatrix, idx) => ({
        _key: `calib-${instnoRef.current}-${k + idx}-${Math.random()}`,
        name: instName, // PHP: $row['name']
        instid: Number(selectedInst), // PHP: $row['id']
        accreditation: rowmatrix.accreditation ?? "", // PHP: $rowmatrix['accreditation']
        description: rowmatrix.packagedesc ?? "", // PHP: $rowmatrix['packagedesc']
        qty: 1, // PHP: value="1"
        rate: parseFloat(rowmatrix.rate) || 0, // PHP: $rowmatrix['rate']
        amount: parseFloat(rowmatrix.rate) || 0, // PHP: amount = qty * rate = 1 * rate
        location: rowmatrix.location ?? instLocation, // PHP: $rowmatrix['location']
        quoteitemid: 0,
      }));

      setItems((prev) => [...prev, ...newItems]);
      instnoRef.current += 1; // PHP: instno++
      setSelectedInst("");
    } catch {
      toast.error("Failed to load calibration prices");
    } finally {
      setAddingItem(false);
    }
  };

  // ── Add Testing Item ──────────────────────────────────────────────────
  // PHP: getItemForProforma.php
  //   products → name, description
  //   testprices → rate, category, package
  // APIs:
  //   GET /testing/get-products-byid/:pid
  //   GET /sales/get-test-package-byid/:id
  const handleAddTestingItem = async () => {
    if (!selectedProduct) {
      toast.error("Please select a product");
      return;
    }
    if (!selectedPackage) {
      toast.error("Please select a package");
      return;
    }
    setAddingItem(true);
    try {
      const [productRes, packageRes] = await Promise.all([
        axios.get(`/testing/get-products-byid/${selectedProduct}`),
        axios.get(`/sales/get-test-package-byid/${selectedPackage}`),
      ]);

      // PHP: $row = products (name, description)
      const product = productRes.data.data ?? productRes.data ?? {};
      // PHP: $rowpackage = testprices (rate, category, package)
      const pkg = packageRes.data.data ?? packageRes.data ?? {};

      const newItem = {
        _key: `test-${instnoRef.current}-${Math.random()}`,
        name: product.name ?? "", // PHP: $row['name']
        instid: Number(selectedProduct), // PHP: $row['id']
        accreditation: CATEGORY_MAP[Number(pkg.category)] ?? "General", // PHP: $category[$rowpackage['category']]
        // PHP: description = $row['description'] + "<br>" + $rowpackage['package']
        description:
          `${product.description ?? ""}\n${pkg.package ?? ""}`.trim(),
        qty: 1,
        rate: parseFloat(pkg.rate) || 0, // PHP: $rowpackage['rate']
        amount: parseFloat(pkg.rate) || 0,
        location: "",
        quoteitemid: 0,
      };

      setItems((prev) => [...prev, newItem]);
    } catch {
      toast.error("Failed to load item details");
    } finally {
      setAddingItem(false);
    }
  };

  // ── Item change — PHP: calculateamount() ─────────────────────────────
  const handleItemChange = (key, field, val) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item._key !== key) return item;
        const updated = { ...item, [field]: val };
        if (field === "qty" || field === "rate") {
          updated.amount =
            (parseFloat(updated.qty) || 0) * (parseFloat(updated.rate) || 0);
        }
        return updated;
      }),
    );
  };

  // ── Delete item — PHP: deletematrix() ────────────────────────────────
  const handleDeleteItem = (key) =>
    setItems((prev) => prev.filter((i) => i._key !== key));

  // ── Save items + charges ──────────────────────────────────────────────
  const handleSaveItems = async () => {
    if (!invoiceId) {
      toast.error("Please save header first");
      return;
    }
    setSavingItems(true);
    try {
      const payload = {
        invoiceid: Number(invoiceId),
        subtotal: totals.subtotal,
        discnumber: parseFloat(charges.discnumber) || 0,
        disctype: charges.disctype,
        discount: totals.discount,
        subtotal2: totals.subtotal2,
        freight: parseFloat(charges.freight) || 0,
        mobilisation: parseFloat(charges.mobilisation) || 0,
        witnesscharges: totals.witnesscharges,
        witnesstype: charges.witnesstype,
        witnessnumber: parseFloat(charges.witnessnumber) || 0,
        samplehandling: totals.samplehandling,
        sampleprep: totals.sampleprep,
        cgstper: totals.isSgst ? parseFloat(charges.cgstper) || 0 : 0,
        cgstamount: totals.cgstamount,
        sgstper: totals.isSgst ? parseFloat(charges.sgstper) || 0 : 0,
        sgstamount: totals.sgstamount,
        igstper: !totals.isSgst ? parseFloat(charges.igstper) || 0 : 0,
        igstamount: totals.igstamount,
        totalamount: totals.total,
        name: items.map((i) => i.name),
        instid: items.map((i) => i.instid ?? 0),
        accreditation: items.map((i) => i.accreditation ?? ""),
        description: items.map((i) => i.description ?? ""),
        qty: items.map((i) => i.qty),
        rate: items.map((i) => i.rate),
        amount: items.map((i) => i.amount),
        location: items.map((i) => i.location || "NA"),
        quoteitemid: items.map((i) => i.quoteitemid ?? 0),
      };

      const res = await axios.post("/accounts/add-proforma-item", payload);
      if (
        res.data.success === true ||
        res.data.status === true ||
        res.data.status === "true"
      ) {
        toast.success("Invoice saved ✅");
        navigate("/dashboards/accounts/proforma-invoice");
      } else {
        toast.error(res.data.message ?? "Failed to save items");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    } finally {
      setSavingItems(false);
    }
  };

  if (loading)
    return (
      <Page title="Proforma Invoice">
        <Spinner />
      </Page>
    );

  const isCalibration = form.typeofinvoice === "Calibration";

  // Options for react-select
  const customerOptions = customers.map(c => ({ value: c.id, label: c.name }));
  const addressOptions = addresses.map(a => ({ value: a.id, label: `${a.name}(${a.address})` }));
  const contactOptions = contacts.map(c => ({ value: c.id, label: c.name }));
  const instrumentOptions = instruments.map(i => ({ value: i.id, label: i.name }));
  const productOptions = products.map(p => ({ value: p.id, label: p.name }));
  const packageOptions = packages.map(p => ({ value: p.id, label: p.package }));

  return (
    <Page title={isEdit ? "Edit Proforma Invoice" : "Add New Proforma Invoice"}>
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

        {/* ══ STEP 1: Header ══ */}
        <Card className="mb-5 p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormRow label="Customer Name" required span2>
              <Select
                options={customerOptions}
                value={customerOptions.find(o => o.value == form.customerid) || null}
                onChange={(selected) => {
                  const cid = selected ? selected.value : "";
                  const c = customers.find((c) => String(c.id) === String(cid));
                  setField("customerid", cid);
                  setField("customername", c?.name ?? "");
                  setField("addressid", "");
                  setField("cperson", "");
                  // statecode, gstno, pan auto-fill from customers array
                  if (c) {
                    setField("gstno", c.gstno ?? "");
                    setField("pan", c.pan ?? "");
                    setField("statecode", String(c.statecode ?? ""));
                    setCharges((p) => ({
                      ...p,
                      statecode: String(c.statecode ?? ""),
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

            <FormRow label="Customer Address" required span2>
              <Select
                options={addressOptions}
                value={addressOptions.find(o => o.value == form.addressid) || null}
                onChange={(selected) => setField("addressid", selected ? selected.value : "")}
                placeholder="Select Address"
                isClearable
                isDisabled={!form.customerid}
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

            <FormRow label="Contact Person Name" span2>
              <Select
                options={contactOptions}
                value={contactOptions.find(o => o.value == form.cperson) || null}
                onChange={(selected) => setField("cperson", selected ? selected.value : "")}
                placeholder="Select Contact"
                isClearable
                isDisabled={!form.customerid}
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

            <FormRow label="GST Number" required>
              <input
                type="text"
                value={form.gstno}
                onChange={(e) => setField("gstno", e.target.value)}
                className={inputCls}
                placeholder="GST Number"
              />
            </FormRow>

            <FormRow label="PAN Number" required>
              <input
                type="text"
                value={form.pan}
                onChange={(e) => setField("pan", e.target.value)}
                className={inputCls}
                placeholder="PAN Number"
              />
            </FormRow>

            <FormRow label="Ref No" required>
              <input
                type="text"
                value={form.refno}
                onChange={(e) => setField("refno", e.target.value)}
                className={inputCls}
                placeholder="Reference Number"
              />
            </FormRow>

            <FormRow label="Ref Date" required>
              <input
                type="date"
                value={form.refdate}
                onChange={(e) => setField("refdate", e.target.value)}
                className={inputCls}
              />
            </FormRow>

            <FormRow label="Remark" span2>
              <textarea
                rows={3}
                value={form.remark}
                onChange={(e) => setField("remark", e.target.value)}
                className={`${inputCls} resize-none`}
                placeholder="Remark"
              />
            </FormRow>

            {!isEdit && (
              <FormRow label="Type of Invoice" required>
                <select
                  value={form.typeofinvoice}
                  onChange={(e) => setField("typeofinvoice", e.target.value)}
                  className={selectCls}
                >
                  <option value="Calibration">Calibration</option>
                  <option value="Testing">Testing</option>
                </select>
              </FormRow>
            )}
          </div>

          <div className="mt-5 flex justify-end">
            <button
              onClick={handleSaveHeader}
              disabled={saving}
              className="rounded-md bg-green-600 px-8 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving…" : "Proceed to add Items"}
            </button>
          </div>
        </Card>

        {/* ══ STEP 2: Items (shown only in edit mode) ══ */}
        {step === 2 && (
          <Card className="p-6">
            {/* Add item controls */}
            <div className="dark:border-dark-600 dark:bg-dark-700 mb-5 rounded-lg border border-gray-200 bg-gray-50 p-4">
              {isCalibration ? (
                // PHP: Calibration → instrument + location
                <div className="flex flex-wrap items-end gap-3">
                  <div className="min-w-[220px] flex-1">
                    <label className={labelCls}>Select Instrument</label>
                    <Select
                      options={instrumentOptions}
                      value={instrumentOptions.find(o => o.value == selectedInst) || null}
                      onChange={(selected) => setSelectedInst(selected ? selected.value : "")}
                      placeholder="Select Instrument"
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
                  </div>
                  <div className="w-36">
                    <label className={labelCls}>Location</label>
                    <select
                      value={instLocation}
                      onChange={(e) => setInstLocation(e.target.value)}
                      className={selectCls}
                      id="instrumentlocation"
                    >
                      <option value="Lab">Lab</option>
                      <option value="Site">Site</option>
                    </select>
                  </div>
                  <button
                    onClick={handleAddCalibrationItem}
                    disabled={addingItem || !selectedInst}
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {addingItem ? "Adding…" : "+ Add Item"}
                  </button>
                </div>
              ) : (
                // PHP: Testing → product + package
                <div className="flex flex-wrap items-end gap-3">
                  <div className="min-w-[180px] flex-1">
                    <label className={labelCls}>Product</label>
                    <Select
                      options={productOptions}
                      value={productOptions.find(o => o.value == selectedProduct) || null}
                      onChange={(selected) => setSelectedProduct(selected ? selected.value : "")}
                      placeholder="Select Product"
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
                  </div>
                  <div className="min-w-[220px] flex-1">
                    <label className={labelCls}>Package</label>
                    <Select
                      options={packageOptions}
                      value={packageOptions.find(o => o.value == selectedPackage) || null}
                      onChange={(selected) => setSelectedPackage(selected ? selected.value : "")}
                      placeholder="Select Package"
                      isClearable
                      isDisabled={!selectedProduct}
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
                  </div>
                  <button
                    onClick={handleAddTestingItem}
                    disabled={
                      addingItem || !selectedProduct || !selectedPackage
                    }
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {addingItem ? "Adding…" : "+ Add Item"}
                  </button>
                </div>
              )}
            </div>

            {/* Items table — PHP: itemrow divs */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="dark:bg-dark-700 bg-gray-100">
                    {[
                      "Name",
                      "Accreditation",
                      "Description",
                      "Qty",
                      "Rate",
                      "Amount",
                      ...(isCalibration ? ["Location"] : []),
                      "",
                    ].map((h) => (
                      <th
                        key={h}
                        className="dark:text-dark-300 px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="dark:divide-dark-600 divide-y divide-gray-100">
                  {items.length === 0 ? (
                    <tr>
                      <td
                        colSpan={isCalibration ? 8 : 7}
                        className="dark:text-dark-500 py-8 text-center text-sm text-gray-400"
                      >
                        No items added yet
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => (
                      <tr
                        key={item._key}
                        className="dark:hover:bg-dark-700 hover:bg-gray-50"
                      >
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) =>
                              handleItemChange(
                                item._key,
                                "name",
                                e.target.value,
                              )
                            }
                            className="dark:bg-dark-900 dark:border-dark-500 dark:text-dark-100 w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm"
                          />
                        </td>
                        <td className="dark:text-dark-300 px-3 py-2 text-sm text-gray-600">
                          {item.accreditation}
                        </td>
                        <td className="px-3 py-2">
                          <textarea
                            value={item.description}
                            onChange={(e) =>
                              handleItemChange(
                                item._key,
                                "description",
                                e.target.value,
                              )
                            }
                            rows={2}
                            className="dark:bg-dark-900 dark:border-dark-500 dark:text-dark-100 w-full resize-none rounded border border-gray-300 bg-white px-2 py-1 text-sm"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            value={item.qty}
                            onChange={(e) =>
                              handleItemChange(item._key, "qty", e.target.value)
                            }
                            className="dark:bg-dark-900 dark:border-dark-500 dark:text-dark-100 w-16 rounded border border-gray-300 bg-white px-2 py-1 text-sm"
                            min={1}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            value={item.rate}
                            onChange={(e) =>
                              handleItemChange(
                                item._key,
                                "rate",
                                e.target.value,
                              )
                            }
                            className="dark:bg-dark-900 dark:border-dark-500 dark:text-dark-100 w-20 rounded border border-gray-300 bg-white px-2 py-1 text-sm"
                          />
                        </td>
                        <td className="dark:text-dark-200 px-3 py-2 font-mono text-sm font-semibold text-gray-700">
                          {parseFloat(item.amount || 0).toFixed(2)}
                        </td>
                        {isCalibration && (
                          <td className="dark:text-dark-400 px-3 py-2 text-xs text-gray-500">
                            {item.location}
                          </td>
                        )}
                        <td className="px-3 py-2">
                          <button
                            onClick={() => handleDeleteItem(item._key)}
                            className="rounded bg-red-500 px-2 py-1 text-xs font-medium text-white hover:bg-red-600"
                          >
                            X
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Charges — PHP: sumamount() */}
            <div className="dark:border-dark-600 mt-6 border-t border-gray-200 pt-5">
              <div className="flex flex-col gap-6 lg:flex-row">
                {/* Left: inputs */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="dark:text-dark-400 text-sm text-gray-600">
                      Subtotal
                    </span>
                    <span className="font-mono text-sm font-semibold">
                      {totals.subtotal.toFixed(2)}
                    </span>
                  </div>

                  {/* Discount */}
                  <div className="flex items-center gap-2">
                    <span className="dark:text-dark-400 w-44 shrink-0 text-sm text-gray-600">
                      Discount
                    </span>
                    <input
                      type="number"
                      value={charges.discnumber}
                      onChange={(e) => setCharge("discnumber", e.target.value)}
                      className="dark:bg-dark-900 dark:border-dark-500 dark:text-dark-100 w-20 rounded border border-gray-300 bg-white px-2 py-1 text-sm"
                    />
                    <select
                      value={charges.disctype}
                      onChange={(e) => setCharge("disctype", e.target.value)}
                      className="dark:bg-dark-900 dark:border-dark-500 dark:text-dark-100 rounded border border-gray-300 bg-white px-2 py-1 text-sm"
                    >
                      <option value="%">%</option>
                      <option value="Flat">Flat</option>
                    </select>
                    <span className="ml-auto font-mono text-sm">
                      {totals.discount.toFixed(2)}
                    </span>
                  </div>

                  {/* Mobilisation */}
                  <div className="flex items-center gap-2">
                    <span className="dark:text-dark-400 w-44 shrink-0 text-sm text-gray-600">
                      Mobilisation &amp; Demobilisation
                    </span>
                    <input
                      type="number"
                      value={charges.mobilisation}
                      onChange={(e) =>
                        setCharge("mobilisation", e.target.value)
                      }
                      className="dark:bg-dark-900 dark:border-dark-500 dark:text-dark-100 w-20 rounded border border-gray-300 bg-white px-2 py-1 text-sm"
                    />
                    <span className="ml-auto font-mono text-sm">
                      {parseFloat(charges.mobilisation || 0).toFixed(2)}
                    </span>
                  </div>

                  {/* Freight */}
                  <div className="flex items-center gap-2">
                    <span className="dark:text-dark-400 w-44 shrink-0 text-sm text-gray-600">
                      Freight Charges
                    </span>
                    <input
                      type="number"
                      value={charges.freight}
                      onChange={(e) => setCharge("freight", e.target.value)}
                      className="dark:bg-dark-900 dark:border-dark-500 dark:text-dark-100 w-20 rounded border border-gray-300 bg-white px-2 py-1 text-sm"
                    />
                    <span className="ml-auto font-mono text-sm">
                      {parseFloat(charges.freight || 0).toFixed(2)}
                    </span>
                  </div>

                  {/* Testing only */}
                  {!isCalibration && (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="dark:text-dark-400 w-44 shrink-0 text-sm text-gray-600">
                          Witness Charges
                        </span>
                        <input
                          type="number"
                          value={charges.witnessnumber}
                          onChange={(e) =>
                            setCharge("witnessnumber", e.target.value)
                          }
                          className="dark:bg-dark-900 dark:border-dark-500 dark:text-dark-100 w-20 rounded border border-gray-300 bg-white px-2 py-1 text-sm"
                        />
                        <select
                          value={charges.witnesstype}
                          onChange={(e) =>
                            setCharge("witnesstype", e.target.value)
                          }
                          className="dark:bg-dark-900 dark:border-dark-500 dark:text-dark-100 rounded border border-gray-300 bg-white px-2 py-1 text-sm"
                        >
                          <option value="%">%</option>
                          <option value="Flat">Flat</option>
                        </select>
                        <span className="ml-auto font-mono text-sm">
                          {totals.witnesscharges.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="dark:text-dark-400 w-44 shrink-0 text-sm text-gray-600">
                          Sample Handling
                        </span>
                        <input
                          type="number"
                          value={charges.samplehandling}
                          onChange={(e) =>
                            setCharge("samplehandling", e.target.value)
                          }
                          className="dark:bg-dark-900 dark:border-dark-500 dark:text-dark-100 w-20 rounded border border-gray-300 bg-white px-2 py-1 text-sm"
                        />
                        <span className="ml-auto font-mono text-sm">
                          {parseFloat(charges.samplehandling || 0).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="dark:text-dark-400 w-44 shrink-0 text-sm text-gray-600">
                          Sample Preparation Charges
                        </span>
                        <input
                          type="number"
                          value={charges.sampleprep}
                          onChange={(e) =>
                            setCharge("sampleprep", e.target.value)
                          }
                          className="dark:bg-dark-900 dark:border-dark-500 dark:text-dark-100 w-20 rounded border border-gray-300 bg-white px-2 py-1 text-sm"
                        />
                        <span className="ml-auto font-mono text-sm">
                          {parseFloat(charges.sampleprep || 0).toFixed(2)}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* Right: totals */}
                <div className="dark:border-dark-600 w-full border-t border-gray-200 pt-4 lg:w-72 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="dark:text-dark-400 text-gray-600">
                        Subtotal 2
                      </span>
                      <span className="font-mono font-semibold">
                        {totals.subtotal2.toFixed(2)}
                      </span>
                    </div>
                    {/* PHP: $sgst==1 → CGST+SGST else IGST */}
                    {totals.isSgst ? (
                      <>
                        <div className="flex items-center justify-between gap-2">
                          <span className="dark:text-dark-400 text-gray-600">
                            Cgst
                          </span>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              value={charges.cgstper}
                              onChange={(e) =>
                                setCharge("cgstper", e.target.value)
                              }
                              className="dark:bg-dark-900 dark:border-dark-500 dark:text-dark-100 w-12 rounded border border-gray-300 bg-white px-1 py-0.5 text-xs"
                            />
                            <span className="text-xs text-gray-500">%</span>
                            <span className="ml-2 w-20 text-right font-mono">
                              {totals.cgstamount.toFixed(2)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="dark:text-dark-400 text-gray-600">
                            Sgst
                          </span>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              value={charges.sgstper}
                              onChange={(e) =>
                                setCharge("sgstper", e.target.value)
                              }
                              className="dark:bg-dark-900 dark:border-dark-500 dark:text-dark-100 w-12 rounded border border-gray-300 bg-white px-1 py-0.5 text-xs"
                            />
                            <span className="text-xs text-gray-500">%</span>
                            <span className="ml-2 w-20 text-right font-mono">
                              {totals.sgstamount.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-between gap-2">
                        <span className="dark:text-dark-400 text-gray-600">
                          IGST
                        </span>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={charges.igstper}
                            onChange={(e) =>
                              setCharge("igstper", e.target.value)
                            }
                            className="dark:bg-dark-900 dark:border-dark-500 dark:text-dark-100 w-12 rounded border border-gray-300 bg-white px-1 py-0.5 text-xs"
                          />
                          <span className="text-xs text-gray-500">%</span>
                          <span className="ml-2 w-20 text-right font-mono">
                            {totals.igstamount.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}
                    <div className="dark:border-dark-500 flex justify-between border-t border-gray-200 pt-2 text-base font-bold">
                      <span className="dark:text-dark-100 text-gray-800">
                        Total
                      </span>
                      <span className="font-mono text-green-700 dark:text-green-400">
                        {totals.total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSaveItems}
                disabled={savingItems}
                className="rounded-md bg-green-600 px-8 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {savingItems ? "Saving…" : "Save Invoice"}
              </button>
            </div>
          </Card>
        )}
      </div>
    </Page>
  );
}