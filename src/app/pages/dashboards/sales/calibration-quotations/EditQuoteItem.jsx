import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Page } from "components/shared/Page";
import { Card, Button, Table, TBody, Td, Tr } from "components/ui";
import axios from "utils/axios";
import { toast } from "sonner";
import Select from "react-select";
import { Plus, Trash2, ArrowLeft } from "lucide-react";

// ── Style tokens ──────────────────────────────────────────────────────────
const inputCls =
  "dark:bg-dark-900 dark:border-dark-500 dark:text-dark-100 dark:placeholder-dark-400 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";
const labelCls =
  "dark:text-dark-300 mb-1 block text-sm font-medium text-gray-700";



// ── Calculations Helper ───────────────────────────────────────────────────
function calcTotals(items, charges, isSgst) {
  const subtotal = items.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);
  const discnumber = parseFloat(charges.discnumber) || 0;
  const disctype = charges.disctype || "2"; // 1: ₹, 2: %

  const discount =
    disctype === "2" ? (subtotal / 100) * discnumber : discnumber;

  const freight = parseFloat(charges.freight) || 0;
  const mobilisation = parseFloat(charges.mobilisation) || 0;

  const subtotal2 = subtotal - discount + freight + mobilisation;

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
    subtotal2: parseFloat(subtotal2.toFixed(2)),
    cgstamount,
    sgstamount,
    igstamount,
    total,
  };
}

export default function EditQuoteItem() {
  const { id } = useParams();
  const navigate = useNavigate();
  const permissions = JSON.parse(localStorage.getItem("userPermissions") || "[]");

  useEffect(() => {
    if (!permissions.includes(95)) {
      navigate("/dashboards/sales/calibration-quotations");
      toast.error("You don't have permission to edit quotation items");
    }
  }, [navigate, permissions]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [addingItem, setAddingItem] = useState(false);

  const [quoteData, setQuoteData] = useState(null);
  const [enquiryDesc, setEnquiryDesc] = useState("");
  const [instruments, setInstruments] = useState([]);
  const [selectedInst, setSelectedInst] = useState("");
  const [instLocation, setInstLocation] = useState("Lab");
  const [apiIsSgst, setApiIsSgst] = useState(null);

  const [items, setItems] = useState([]);
  const [charges, setCharges] = useState({
    discnumber: 0,
    disctype: "2", // Default to % (2)
    freight: 0,
    mobilisation: 0,
    cgstper: 9,
    sgstper: 9,
    igstper: 18,
  });

  const isSgst = apiIsSgst !== null ? apiIsSgst : true;

  const totals = calcTotals(items, charges, isSgst);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/sales/get-calib-quotationitem/${id}`);

      if (res.data?.status || res.data?.status === "true") {
        const { quotation: q, items: qItems, instruments: masterInsts, enquiry_description, is_sgst } = res.data.data;

        setQuoteData(q || null);
        setInstruments(masterInsts || []);
        setEnquiryDesc(enquiry_description || "");

        // The API returns is_sgst, we can store it or use it for calculations
        // We'll trust the API's is_sgst if it's provided as a number or boolean
        const sgstFlag = (is_sgst === 1 || is_sgst === true || is_sgst === "1");
        setApiIsSgst(sgstFlag);

        if (q) {
          setCharges({
            discnumber: q.discnumber || 0,
            disctype: String(q.disctype || "2"),
            freight: q.freight || 0,
            mobilisation: q.mobilisation || 0,
            cgstper: parseFloat(q.cgstper) || 9,
            sgstper: parseFloat(q.sgstper) || 9,
            igstper: parseFloat(q.igstper) || 18,
          });
        }

        // Map existing items
        const existingItems = (qItems || []).filter(
          (item) => item && (item.name || item.instrument_name || item.instrument_id || item.instid)
        );

        setItems(
          existingItems.map((item, idx) => ({
            _key: `existing-${idx}-${item.id || idx}`,
            id: item.id,
            name: item.name || item.instrument_name || "",
            instid: item.instid || item.instrument_id || 0,
            accreditation: item.accreditation || "",
            description: item.description || "",
            qty: parseFloat(item.qty) || 1,
            rate: parseFloat(item.rate) || 0,
            amount: (parseFloat(item.qty) || 1) * (parseFloat(item.rate) || 0),
            location: item.location || "Lab",
          }))
        );
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddItem = async () => {
    if (!selectedInst) {
      toast.error("Please select an instrument");
      return;
    }
    setAddingItem(true);
    try {
      const res = await axios.get(
        `/calibrationoperations/get-calibrationprice-byidandlocation?id=${selectedInst}&location=${instLocation}`,
      );
      const priceRows = res.data.data || res.data || [];

      if (!Array.isArray(priceRows) || priceRows.length === 0) {
        toast.info("No calibration prices found for this instrument/location");
        return;
      }

      const inst = instruments.find(i => String(i.id) === String(selectedInst));
      const instName = inst?.name || "";

      const newItems = priceRows.map((row, idx) => ({
        _key: `new-${Date.now()}-${idx}`,
        name: instName,
        instid: Number(selectedInst),
        accreditation: row.accreditation || "",
        description: row.packagedesc || "",
        qty: 1,
        rate: parseFloat(row.rate) || 0,
        amount: parseFloat(row.rate) || 0,
        location: row.location || instLocation,
      }));

      setItems((prev) => [...prev, ...newItems]);
      setSelectedInst("");
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch price details");
    } finally {
      setAddingItem(false);
    }
  };

  const handleItemChange = (key, field, val) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item._key !== key) return item;
        const updated = { ...item, [field]: val };
        if (field === "qty" || field === "rate") {
          updated.amount = (parseFloat(updated.qty) || 0) * (parseFloat(updated.rate) || 0);
        }
        return updated;
      }),
    );
  };

  const handleDeleteItem = (key) => {
    setItems((prev) => prev.filter((i) => i._key !== key));
  };

  const handleSave = async () => {
    if (items.length === 0) {
      toast.error("Please add at least one item");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        quoteid: Number(id),
        // Arrays for items
        name: items.map(i => i.name),
        instid: items.map(i => i.instid),
        accreditation: items.map(i => i.accreditation),
        description: items.map(i => i.description),
        qty: items.map(i => i.qty),
        rate: items.map(i => i.rate),
        amount: items.map(i => i.amount),
        location: items.map(i => i.location),
        quoteitemid: items.map(i => i.id || 0),
        // Financials
        subtotal: totals.subtotal,
        discnumber: parseFloat(charges.discnumber) || 0,
        disctype: Number(charges.disctype),
        discount: totals.discount,
        subtotal2: totals.subtotal2,
        mobilisation: parseFloat(charges.mobilisation) || 0,
        freight: parseFloat(charges.freight) || 0,
        cgstper: isSgst ? parseFloat(charges.cgstper) || 0 : 0,
        cgstamount: totals.cgstamount,
        sgstper: isSgst ? parseFloat(charges.sgstper) || 0 : 0,
        sgstamount: totals.sgstamount,
        igstper: !isSgst ? parseFloat(charges.igstper) || 0 : 0,
        igstamount: totals.igstamount,
        totalamount: totals.total,
        revised_from: quoteData?.revised_from || 0,
      };

      const res = await axios.post("/sales/update-calib-quotation-item", payload);
      if (res.data.status === "true" || res.data.status === true) {
        toast.success("Quotation items updated successfully ✅");
        navigate(`/dashboards/sales/calibration-quotations/view/${id}`);
      } else {
        toast.error(res.data.message || "Failed to save items");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong while saving");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Page title="Edit Quotation Items">
        <div className="flex h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <span className="ml-3 text-gray-600">Loading details...</span>
        </div>
      </Page>
    );
  }

  const instrumentOptions = instruments.map(i => ({ value: i.id, label: `${i.name} (${i.sop})` }));

  return (
    <Page title="Edit Quotation Items (Calibration)">
      <div className="transition-content px-[var(--margin-x)] pb-8">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/dashboards/sales/calibration-quotations"
              className="rounded-full p-1.5 hover:bg-gray-100 dark:hover:bg-dark-700"
            >
              <ArrowLeft size={20} className="text-gray-600 dark:text-dark-300" />
            </Link>
            <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
              Edit Quotation Items
            </h1>
          </div>
          {quoteData && (
            <div className="text-right">
              <div className="text-sm font-medium text-gray-500">Quotation No</div>
              <div className="font-semibold text-gray-800 dark:text-gray-200">
                {quoteData.quotationno}
              </div>
            </div>
          )}
        </div>

        {enquiryDesc && (
          <Card className="mb-6 p-4 bg-blue-50 border-blue-100 dark:bg-blue-900/10 dark:border-blue-800">
            <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Enquiry Description</div>
            <div className="text-sm text-gray-700 dark:text-dark-200">{enquiryDesc}</div>
          </Card>
        )}

        <Card className="mb-6 p-6 border-success-200">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-12 md:items-end">
            <div className="md:col-span-6">
              <label className={labelCls}>Add Instrument</label>
              <Select
                options={instrumentOptions}
                value={instrumentOptions.find(o => o.value == selectedInst)}
                onChange={(opt) => setSelectedInst(opt ? opt.value : "")}
                placeholder="Search Instrument..."
                isClearable
                className="react-select-container"
                classNamePrefix="react-select"
              />
            </div>
            <div className="md:col-span-3">
              <label className={labelCls}>Location</label>
              <select
                value={instLocation}
                onChange={(e) => setInstLocation(e.target.value)}
                className={inputCls}
              >
                <option value="Site">Site</option>
                <option value="Lab">Lab</option>
              </select>
            </div>
            <div className="md:col-span-3">
              <Button
                onClick={handleAddItem}
                disabled={addingItem || !selectedInst}
                className="w-full h-[38px] flex items-center justify-center gap-2"
                color="primary"
              >
                <Plus size={18} />
                {addingItem ? "Adding..." : "Add Item"}
              </Button>
            </div>
          </div>
        </Card>

        {/* Items Table */}
        <Card className="mb-6 overflow-hidden shadow-md">
          <div className="overflow-x-auto">
            <Table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50 dark:bg-dark-700">
                  <th className="min-w-[250px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-dark-300">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-dark-300">Accreditation</th>
                  <th className="min-w-[250px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-dark-300">Description</th>
                  <th className="min-w-[80px] px-2 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-dark-300">Quantity</th>
                  <th className="min-w-[120px] px-2 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-dark-300">Rate (₹)</th>
                  <th className="min-w-[130px] px-2 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-dark-300">Amount (₹)</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-dark-300">Location</th>
                  <th className="w-16 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-dark-300">Action</th>
                </tr>
              </thead>
              <TBody>
                {items.length === 0 ? (
                  <Tr>
                    <Td colSpan={8} className="py-10 text-center text-gray-500">
                      No items added yet. Use the selector above to add instruments.
                    </Td>
                  </Tr>
                ) : (
                  items.map((item) => (
                    <Tr key={item._key} className="border-b dark:border-dark-600 group hover:bg-gray-50/50 dark:hover:bg-dark-700/50">
                      <Td className="px-4 py-2">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => handleItemChange(item._key, "name", e.target.value)}
                          className={inputCls}
                          placeholder="Instrument Name"
                        />
                        <input type="hidden" value={item.instid} />
                      </Td>
                      <Td className="px-4 py-2 text-sm text-gray-600 dark:text-dark-400 font-bold">{item.accreditation}</Td>
                      <Td className="px-4 py-2">
                        <textarea
                          value={item.description}
                          onChange={(e) => handleItemChange(item._key, "description", e.target.value)}
                          className={`${inputCls} min-h-[60px] resize-y`}
                          rows={2}
                          placeholder="Description"
                        />
                      </Td>
                      <Td className="px-2 py-2">
                        <input
                          type="number"
                          value={item.qty}
                          onChange={(e) => handleItemChange(item._key, "qty", e.target.value)}
                          className={`${inputCls} px-2 text-center`}
                        />
                      </Td>
                      <Td className="px-2 py-2">
                        <input
                          type="number"
                          value={item.rate}
                          onChange={(e) => handleItemChange(item._key, "rate", e.target.value)}
                          className={`${inputCls} px-2 text-right`}
                        />
                      </Td>
                      <Td className="px-2 py-2 text-right">
                        <input
                          type="number"
                          readOnly
                          value={item.amount}
                          className={`${inputCls} bg-gray-50 px-2 text-right font-semibold dark:bg-dark-800`}
                        />
                      </Td>
                      <Td className="px-4 py-2 text-sm text-gray-600 dark:text-dark-400 font-bold">
                        {item.location}
                      </Td>
                      <Td className="px-4 py-2 text-center">
                        <button
                          onClick={() => handleDeleteItem(item._key)}
                          className="rounded-full p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </Td>
                    </Tr>
                  ))
                )}
              </TBody>
            </Table>
          </div>
        </Card>

        {/* Totals and Charges Section */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="p-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-dark-100 border-b pb-2">Financial Details</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Discount</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={charges.discnumber}
                      onChange={(e) => setCharges(p => ({ ...p, discnumber: e.target.value }))}
                      className={inputCls}
                    />
                    <select
                      value={charges.disctype}
                      onChange={(e) => setCharges(p => ({ ...p, disctype: e.target.value }))}
                      className={`${inputCls} w-24`}
                    >
                      <option value="1">₹</option>
                      <option value="2">%</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Mobilisation & Demobilisation</label>
                  <input
                    type="number"
                    value={charges.mobilisation}
                    onChange={(e) => setCharges(p => ({ ...p, mobilisation: e.target.value }))}
                    className={inputCls}
                    placeholder="Mobilisation Charges"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Freight Charges</label>
                  <input
                    type="number"
                    value={charges.freight}
                    onChange={(e) => setCharges(p => ({ ...p, freight: e.target.value }))}
                    className={inputCls}
                    placeholder="Freight Charges"
                  />
                </div>
              </div>

              <div className="pt-4 border-t dark:border-dark-600">
                <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">Tax Matrix</h4>
                <div className="grid grid-cols-2 gap-4">
                  {isSgst ? (
                    <>
                      <div>
                        <label className={labelCls}>CGST %</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={charges.cgstper}
                            onChange={(e) => setCharges(p => ({ ...p, cgstper: e.target.value }))}
                            className={inputCls}
                          />
                          <span className="text-gray-500">%</span>
                        </div>
                      </div>
                      <div>
                        <label className={labelCls}>SGST %</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={charges.sgstper}
                            onChange={(e) => setCharges(p => ({ ...p, sgstper: e.target.value }))}
                            className={inputCls}
                          />
                          <span className="text-gray-500">%</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="col-span-2">
                      <label className={labelCls}>IGST %</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={charges.igstper}
                          onChange={(e) => setCharges(p => ({ ...p, igstper: e.target.value }))}
                          className={`${inputCls} max-w-[150px]`}
                        />
                        <span className="text-gray-500">%</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-slate-50 dark:bg-dark-800/50 border-l-4 border-blue-600">
            <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-dark-100">Billing Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-gray-600 dark:text-dark-300">
                <span>Subtotal</span>
                <span className="font-medium text-gray-900 dark:text-dark-50">₹ {totals.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-dark-300">
                <span>Discount Applied</span>
                <span className="font-medium text-red-500">- ₹ {totals.discount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-dark-300">
                <span>Mobilisation & Demobilisation Charges</span>
                <span className="font-medium text-gray-900 dark:text-dark-50">₹ {Number(charges.mobilisation || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-dark-300">
                <span>Freight Charges</span>
                <span className="font-medium text-gray-900 dark:text-dark-50">₹ {Number(charges.freight || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 dark:border-dark-600 pt-2 font-bold text-gray-800 dark:text-dark-100">
                <span>Subtotal 2</span>
                <span>₹ {totals.subtotal2.toLocaleString()}</span>
              </div>

              <div className="space-y-1 pt-2 bg-white/50 dark:bg-dark-900/50 p-3 rounded-lg border border-gray-100 dark:border-dark-700">
                {isSgst ? (
                  <>
                    <div className="flex justify-between text-sm text-gray-600 dark:text-dark-400">
                      <span>CGST ({charges.cgstper}%)</span>
                      <span className="font-semibold text-gray-800 dark:text-dark-200">₹ {totals.cgstamount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600 dark:text-dark-400">
                      <span>SGST ({charges.sgstper}%)</span>
                      <span className="font-semibold text-gray-800 dark:text-dark-200">₹ {totals.sgstamount.toLocaleString()}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between text-sm text-gray-600 dark:text-dark-400">
                    <span>IGST ({charges.igstper}%)</span>
                    <span className="font-semibold text-gray-800 dark:text-dark-200">₹ {totals.igstamount.toLocaleString()}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-300 dark:border-dark-500 mt-4">
                <div className="text-base font-semibold text-gray-800 dark:text-gray-100">Total Calibration Charges</div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  ₹ {totals.total.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="mt-8">
              <Button
                onClick={handleSave}
                disabled={submitting || items.length === 0}
                className="w-full h-11 text-base font-semibold shadow-sm"
                color="primary"
              >
                {submitting ? "Updating..." : "Update Quotation Items"}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </Page>
  );
}