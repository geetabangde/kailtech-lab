import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button, Card } from "components/ui";
import { Page } from "components/shared/Page";
import axios from "utils/axios";
import { toast } from "sonner";
import { TrashIcon, PlusIcon } from "lucide-react";
import AsyncSelect from "react-select/async";

export default function AddMrnItemPurchasewopo() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const mrnid = searchParams.get("id") || searchParams.get("hakuna") || "";

  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [isSgst, setIsSgst] = useState(false);
  const [units, setUnits] = useState([]);

  const [items, setItems] = useState([]);
  const [selectedSearchItem, setSelectedSearchItem] = useState(null);

  // Fetch initial MRN details and existing PO items
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setFetchingData(true);

        let fetchedUnits = [];
        // Fetch Units for the UOM dropdown
        const unitsRes = await axios.get("/master/units-list").catch(() => null);
        if (unitsRes?.data?.status) {
          fetchedUnits = unitsRes.data.data || [];
          setUnits(fetchedUnits);
        }

        let localIsSgst = false;

        // Fetch pre-existing items and GST details
        const itemsRes = await axios.get(`/inventory/get-mrn-item`, { params: { id: mrnid } }).catch(() => null);
        if (itemsRes?.data?.status) {
          // Check sgst flag from backend
          if (itemsRes.data.gst_details?.sgst === 1) {
            localIsSgst = true;
          }
          setIsSgst(localIsSgst);

          const fetchedItems = itemsRes.data.items || [];
          const formattedItems = fetchedItems.map(item => {
            // Map string UOM (e.g., "kg") to its numeric ID from the fetched units
            let matchedUomId = item.uom;
            if (fetchedUnits.length > 0 && item.uom && isNaN(item.uom)) {
              const foundUnit = fetchedUnits.find(u => {
                const unitStr = String(u.name || u.unit_name || u.unit || "").trim().toLowerCase();
                return unitStr === String(item.uom).trim().toLowerCase();
              });
              if (foundUnit) {
                matchedUomId = foundUnit.id;
              }
            }

            let igstper = parseFloat(item.igstper) || 0;
            let sgstper = parseFloat(item.sgstper) || 0;
            let cgstper = parseFloat(item.cgstper) || 0;
            if (igstper === 0 && sgstper === 0 && cgstper === 0) {
               let tRate = parseFloat(item.tax_rate || item.tax_class || 0);
               if (localIsSgst) {
                  sgstper = tRate / 2;
                  cgstper = tRate / 2;
               } else {
                  igstper = tRate;
               }
            }

            return calculateItemRow({
              ...item,
              uom: matchedUomId,
              ordered_qty: item.qty || 0,
              qty: item.receiveqty !== undefined ? item.receiveqty : (item.qty || 1),
              discountnumber: item.discount || item.discountnumber || 0,
              igstper,
              sgstper,
              cgstper
            });
          });
          setItems(formattedItems);
        }

      } catch (error) {
        console.error("Error loading MRN items:", error);
        toast.error("Failed to load initial data.");
      } finally {
        setFetchingData(false);
      }
    };

    if (mrnid) {
      fetchInitialData();
    } else {
      setFetchingData(false);
    }
  }, [mrnid]);

  // Core Calculation Engine for a Single Row
  const calculateItemRow = (item) => {
    const qty = parseFloat(item.qty) || 0;
    const rate = parseFloat(item.rate) || 0;
    const amount = qty * rate;

    const discountpercent = parseFloat(item.discountnumber) || 0;
    const discamount = amount * (discountpercent / 100);
    const taxableamount = amount - discamount;

    const igstper = parseFloat(item.igstper) || 0;
    const sgstper = parseFloat(item.sgstper) || 0;
    const cgstper = parseFloat(item.cgstper) || 0;

    const igstamount = taxableamount * (igstper / 100);
    const sgstamount = taxableamount * (sgstper / 100);
    const cgstamount = taxableamount * (cgstper / 100);
    const tax = igstamount + sgstamount + cgstamount;
    const taxRate = igstper + sgstper + cgstper;

    return {
      ...item,
      amount,
      discamount,
      taxableamount,
      tax_rate: taxRate,
      cgstamount,
      sgstamount,
      igstamount,
      totaltaxamountitem: tax,
      finalamount: taxableamount + tax,
    };
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    newItems[index] = calculateItemRow(newItems[index]);
    setItems(newItems);
  };

  const handleDeleteItem = (index) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const loadOptions = async (inputValue) => {
    if (!inputValue) return [];
    try {
      const response = await axios.get(`/inventory/search-po-items?search=${inputValue}`);
      if (response.data && response.data.status) {
        return response.data.data.map(m => ({
          value: m.id,
          label: m.value || m.name,
          itemData: m
        }));
      }
      return [];
    } catch (err) {
      console.error("Search error:", err);
      return [];
    }
  };

  const handleSearchChange = (selectedOption) => {
    if (!selectedOption || !selectedOption.itemData) return;
    handleAddSearchedItem(selectedOption.itemData);
    // Reset search box after selection
    setSelectedSearchItem(null);
  };

  const handleAddSearchedItem = async (selectedItem) => {
    let matchedUomId = selectedItem.unit;

    if (matchedUomId) {
      try {
        const uomRes = await axios.get(`/master/get-unit-byid/${matchedUomId}`);
        if (uomRes.data && (uomRes.data.status === true || uomRes.data.status === "true")) {
          const uomData = uomRes.data.data;
          setUnits(prev => {
            if (!prev.some(u => String(u.id) === String(uomData.id))) {
              return [...prev, uomData];
            }
            return prev;
          });
        }
      } catch (err) {
        console.error("Error fetching UOM:", err);
      }
    }

    const newItem = calculateItemRow({
      itemid: selectedItem.id,
      poitemid: 0,
      description: selectedItem.name || selectedItem.it_name || "",
      hsn: selectedItem.hsn || "",
      batchno: "",
      mfddate: "",
      expdate: "",
      uom: matchedUomId || "",
      ordered_qty: 0,
      qty: 1,
      rate: "",
      discountnumber: 0,
      igstper: "",
      sgstper: "",
      cgstper: "",
      remark: ""
    });
    setItems([...items, newItem]);
  };

  const handleAddManualItem = () => {
    const newItem = calculateItemRow({
      itemid: 0,
      poitemid: 0,
      description: "",
      hsn: "",
      batchno: "",
      mfddate: "",
      expdate: "",
      uom: "",
      ordered_qty: 0,
      qty: 1,
      rate: "",
      discountnumber: 0,
      igstper: "",
      sgstper: "",
      cgstper: "",
      remark: ""
    });
    setItems([...items, newItem]);
  };

  // Compute Footers
  const { subtotal, totalDiscount, totalTaxable, totalTax, totalInvoice } = useMemo(() => {
    return items.reduce(
      (acc, item) => ({
        subtotal: acc.subtotal + (parseFloat(item.amount) || 0),
        totalDiscount: acc.totalDiscount + (parseFloat(item.discamount) || 0),
        totalTaxable: acc.totalTaxable + (parseFloat(item.taxableamount) || 0),
        totalTax: acc.totalTax + (parseFloat(item.totaltaxamountitem) || 0),
        totalInvoice: acc.totalInvoice + (parseFloat(item.finalamount) || 0),
      }),
      { subtotal: 0, totalDiscount: 0, totalTaxable: 0, totalTax: 0, totalInvoice: 0 }
    );
  }, [items]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    if (dateStr.includes("/")) return dateStr;
    const parts = dateStr.split("-");
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (items.length === 0) {
      return toast.warning("Please add at least one item.");
    }

    setLoading(true);
    try {
      const payload = {
        challanid: parseInt(mrnid),
        itemid: items.map(i => parseInt(i.itemid) || 0),
        poitemid: items.map(i => parseInt(i.poitemid) || 0),
        description: items.map(i => i.description || ""),
        hsn: items.map(i => String(i.hsn || "")),
        batchno: items.map(i => String(i.batchno || "")),
        mfddate: items.map(i => formatDate(i.mfddate)),
        expdate: items.map(i => formatDate(i.expdate)),
        uom: items.map(i => String(i.uom || "")),
        qty: items.map(i => parseFloat(i.qty) || 0),
        rate: items.map(i => parseFloat(i.rate) || 0),
        amount: items.map(i => parseFloat(i.amount) || 0),
        discountnumber: items.map(i => parseFloat(i.discountnumber) || 0),
        discamount: items.map(i => parseFloat(i.discamount) || 0),
        taxableamount: items.map(i => parseFloat(i.taxableamount) || 0),
        tax_rate: items.map(i => parseFloat(i.tax_rate) || 0),
        igstper: items.map(i => parseFloat(i.igstper) || 0),
        igstamount: items.map(i => parseFloat(i.igstamount) || 0),
        sgstper: items.map(i => parseFloat(i.sgstper) || 0),
        sgstamount: items.map(i => parseFloat(i.sgstamount) || 0),
        cgstper: items.map(i => parseFloat(i.cgstper) || 0),
        cgstamount: items.map(i => parseFloat(i.cgstamount) || 0),
        totaltaxamountitem: items.map(i => parseFloat(i.totaltaxamountitem) || 0),
        finalamount: items.map(i => parseFloat(i.finalamount) || 0),
        remark: items.map(i => String(i.remark || "")),

        subtotal: parseFloat(subtotal.toFixed(2)),
        discount: parseFloat(totalDiscount.toFixed(2)),
        totalafterdisc: parseFloat(totalTaxable.toFixed(2)),
        totaltaxamount: parseFloat(totalTax.toFixed(2)),
        totalinvoiceamount: parseFloat(totalInvoice.toFixed(2)),
      };

      const response = await axios.post("/inventory/add-mrn-items-wopo", payload);
      if (response.data.status) {
        toast.success(response.data.message || "MRN Items saved successfully!");
        navigate("/dashboards/inventory/mrn");
      } else {
        toast.error(response.data.message || "Failed to save MRN items.");
      }
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "An error occurred during save.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <Page title="Add MRN Items">
      <div className="transition-content p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold tracking-wide text-gray-800 dark:text-dark-50">
            Add New MRN Items
          </h2>
          <Button
            variant="outline"
            className="bg-blue-600 text-white hover:bg-blue-700"
            onClick={() => navigate("/dashboards/inventory/mrn")}
          >
            &laquo; Back to MRN
          </Button>
        </div>

        {/* Search Box exactly as in PHP / AddMrnItemPurchase */}
        <div className="mb-6 flex items-center gap-4 bg-white dark:bg-dark-800 p-4 rounded-lg shadow-sm">
          <label className="font-semibold text-gray-700 dark:text-gray-300 w-32 shrink-0">Search Item:</label>
          <div className="flex-1 max-w-xl">
            <AsyncSelect
              cacheOptions
              defaultOptions={false}
              loadOptions={loadOptions}
              value={selectedSearchItem}
              onChange={handleSearchChange}
              placeholder="Start typing to search items..."
              className="react-select-container"
              classNamePrefix="react-select"
            />
          </div>
        </div>

        <Card className="p-6 shadow-soft dark:bg-dark-800">
          {fetchingData ? (
            <div className="text-center py-10 text-gray-500">Loading data...</div>
          ) : (
            <form onSubmit={handleSubmit}>

              <div className="mb-4 flex justify-end">
                <Button type="button" onClick={handleAddManualItem} className="bg-green-600 text-white hover:bg-green-700">
                  <PlusIcon className="w-4 h-4 mr-2" /> Add Blank Row
                </Button>
              </div>

              <div className="overflow-x-auto border rounded-lg border-gray-200 dark:border-dark-700">
                <table className="min-w-max w-full text-left text-sm text-gray-600 dark:text-dark-100">
                  <thead className="bg-gray-50 text-gray-700 dark:bg-dark-900/50 dark:text-dark-50">
                    <tr>
                      <th className="p-3 border-b">Material Description</th>
                      <th className="p-3 border-b">HSN/SAC</th>
                      <th className="p-3 border-b">Batch No</th>
                      <th className="p-3 border-b">Mfd Date</th>
                      <th className="p-3 border-b">Exp Date</th>
                      <th className="p-3 border-b w-28">UOM</th>
                      <th className="p-3 border-b w-24">Qty</th>
                      <th className="p-3 border-b w-24">Rate</th>
                      <th className="p-3 border-b">Amount</th>
                      <th className="p-3 border-b w-24">Disc %</th>
                      <th className="p-3 border-b">Taxable</th>
                      {!isSgst && <th className="p-3 border-b w-20">IGST %</th>}
                      {isSgst && <th className="p-3 border-b w-20">SGST %</th>}
                      {isSgst && <th className="p-3 border-b w-20">CGST %</th>}
                      <th className="p-3 border-b">Tax Amt</th>
                      <th className="p-3 border-b">Total</th>
                      <th className="p-3 border-b">Remark</th>
                      <th className="p-3 border-b">Act</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={20} className="text-center p-6 text-gray-500">
                          No items added. Click &apos;Add Blank Row&apos; to insert items.
                        </td>
                      </tr>
                    ) : (
                      items.map((item, index) => (
                        <tr key={index} className="border-b dark:border-dark-700 hover:bg-gray-50 dark:hover:bg-dark-900/30">
                          <td className="p-2">
                            <textarea
                              readOnly={!!item.itemid}
                              className={`w-48 p-1 border rounded text-sm resize-none ${item.itemid ? 'bg-gray-100 dark:bg-dark-900/50' : 'dark:bg-dark-900'} dark:border-dark-600`}
                              value={item.description}
                              onChange={(e) => handleItemChange(index, "description", e.target.value)}
                              rows={1}
                              required
                            />
                          </td>
                          <td className="p-2">
                            <input
                              className="w-20 p-1 border rounded text-sm dark:bg-dark-900 dark:border-dark-600"
                              value={item.hsn}
                              onChange={(e) => handleItemChange(index, "hsn", e.target.value)}
                            />
                          </td>
                          <td className="p-2">
                            <input
                              className="w-24 p-1 border rounded text-sm dark:bg-dark-900 dark:border-dark-600"
                              value={item.batchno}
                              onChange={(e) => handleItemChange(index, "batchno", e.target.value)}
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="date"
                              className="w-32 p-1 border rounded text-sm dark:bg-dark-900 dark:border-dark-600"
                              value={item.mfddate}
                              onChange={(e) => handleItemChange(index, "mfddate", e.target.value)}
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="date"
                              className="w-32 p-1 border rounded text-sm dark:bg-dark-900 dark:border-dark-600"
                              value={item.expdate}
                              onChange={(e) => handleItemChange(index, "expdate", e.target.value)}
                            />
                          </td>
                          <td className="p-2">
                            <select
                              className="w-full p-1 border rounded text-sm dark:bg-dark-900 dark:border-dark-600"
                              value={item.uom}
                              onChange={(e) => handleItemChange(index, "uom", e.target.value)}
                              required
                            >
                              <option value=""></option>
                              {/* Fallback to display the raw string from API if it didn't map to a numeric ID */}
                              {item.uom && isNaN(item.uom) && !units.some(u => String(u.id) === String(item.uom)) && (
                                <option value={item.uom}>{item.uom}</option>
                              )}
                              {units.map((u) => (
                                <option key={u.id} value={u.id}>{u.name || u.unit_name || u.unit}</option>
                              ))}
                            </select>
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              className="w-full p-1 border rounded text-sm dark:bg-dark-900 dark:border-dark-600"
                              value={item.qty}
                              onChange={(e) => handleItemChange(index, "qty", e.target.value)}
                              required
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              className="w-full p-1 border rounded text-sm dark:bg-dark-900 dark:border-dark-600"
                              value={item.rate}
                              onChange={(e) => handleItemChange(index, "rate", e.target.value)}
                              required
                            />
                          </td>
                          <td className="p-2 font-medium">{item.amount.toFixed(2)}</td>
                          <td className="p-2">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              className="w-full p-1 border rounded text-sm dark:bg-dark-900 dark:border-dark-600"
                              value={item.discountnumber}
                              onChange={(e) => handleItemChange(index, "discountnumber", e.target.value)}
                            />
                          </td>
                          <td className="p-2 font-medium">{item.taxableamount.toFixed(2)}</td>
                          {!isSgst && (
                            <td className="p-2">
                              <input
                                type="number"
                                min="0"
                                step="any"
                                className="w-full p-1 border rounded text-sm dark:bg-dark-900 dark:border-dark-600"
                                value={item.igstper}
                                onChange={(e) => handleItemChange(index, "igstper", e.target.value)}
                              />
                            </td>
                          )}
                          {isSgst && (
                            <>
                              <td className="p-2">
                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  className="w-full p-1 border rounded text-sm dark:bg-dark-900 dark:border-dark-600"
                                  value={item.sgstper}
                                  onChange={(e) => handleItemChange(index, "sgstper", e.target.value)}
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  className="w-full p-1 border rounded text-sm dark:bg-dark-900 dark:border-dark-600"
                                  value={item.cgstper}
                                  onChange={(e) => handleItemChange(index, "cgstper", e.target.value)}
                                />
                              </td>
                            </>
                          )}
                          <td className="p-2 font-medium">{item.totaltaxamountitem.toFixed(2)}</td>
                          <td className="p-2 font-bold text-gray-800 dark:text-dark-50">{item.finalamount.toFixed(2)}</td>
                          <td className="p-2">
                            <input
                              className="w-32 p-1 border rounded text-sm dark:bg-dark-900 dark:border-dark-600"
                              value={item.remark || ""}
                              onChange={(e) => handleItemChange(index, "remark", e.target.value)}
                            />
                          </td>
                          <td className="p-2">
                            <Button size="sm" variant="flat" className="text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-900/30" onClick={() => handleDeleteItem(index)}>
                              <TrashIcon className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* ✅ Footer Summary Section */}
              <div className="mt-8 flex flex-col md:flex-row justify-end items-end gap-6 border-t border-gray-200 dark:border-dark-700 pt-6">
                <div className="w-full md:w-80 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-600 dark:text-dark-100">Total Item Amount</span>
                    <span className="font-semibold text-gray-800 dark:text-dark-50">₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-600 dark:text-dark-100">Total Discount</span>
                    <span className="font-semibold text-red-500">-₹{totalDiscount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm border-t border-gray-100 dark:border-dark-600 pt-2">
                    <span className="font-medium text-gray-600 dark:text-dark-100">Taxable Value</span>
                    <span className="font-semibold text-gray-800 dark:text-dark-50">₹{totalTaxable.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-600 dark:text-dark-100">Total Tax Amount</span>
                    <span className="font-semibold text-gray-800 dark:text-dark-50">₹{totalTax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg border-t-2 border-gray-200 dark:border-dark-600 pt-2 mt-2">
                    <span className="font-bold text-gray-800 dark:text-white">Total Invoice Amount</span>
                    <span className="font-bold text-primary-600 dark:text-primary-400">₹{totalInvoice.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <Button
                  type="submit"
                  color="success"
                  size="lg"
                  disabled={loading}
                  className="min-w-[200px] shadow-lg shadow-success-500/20"
                >
                  {loading ? "Saving..." : "Save Challan"}
                </Button>
              </div>

            </form>
          )}
        </Card>
      </div>
    </Page>
  );
}
