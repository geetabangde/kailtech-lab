import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, Button, Table, THead, TBody, Tr, Th, Td } from "components/ui";
import { Page } from "components/shared/Page";
import axios from "utils/axios";
import { toast } from "sonner";
import { TrashIcon } from "@heroicons/react/24/outline";
import AsyncSelect from "react-select/async";

export default function AddMrnItemPurchase() {
  const { id } = useParams(); // mrnid
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);

  const [items, setItems] = useState([]);
  const [units, setUnits] = useState([]);

  const [isSgst, setIsSgst] = useState(false);

  const [selectedSearchItem, setSelectedSearchItem] = useState(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      if (!id) return;
      try {
        setFetchingData(true);

        let localIsSgst = false;
        const itemsRes = await axios.get(`/inventory/get-mrn-item`, { params: { id } }).catch(() => null);
        if (itemsRes?.data?.status) {
          if (itemsRes.data.gst_details && itemsRes.data.gst_details.sgst === 1) {
            localIsSgst = true;
          }
          setIsSgst(localIsSgst);
        }

      } catch (err) {
        console.error("Error fetching data:", err);
        toast.error("Failed to load initial data.");
      } finally {
        setFetchingData(false);
      }
    };

    fetchInitialData();
  }, [id]);

  const calculateItemRow = (row) => {
    const qty = parseFloat(row.qty) || 0;
    const rate = parseFloat(row.rate) || 0;
    const discountnumber = parseFloat(row.discountnumber) || 0;

    const amount = qty * rate;
    const discamount = (amount * discountnumber) / 100;
    const taxableamount = amount - discamount;

    const igstper = parseFloat(row.igstper) || 0;
    const sgstper = parseFloat(row.sgstper) || 0;
    const cgstper = parseFloat(row.cgstper) || 0;

    const igstamount = (taxableamount * igstper) / 100;
    const sgstamount = (taxableamount * sgstper) / 100;
    const cgstamount = (taxableamount * cgstper) / 100;
    const totaltaxamountitem = igstamount + sgstamount + cgstamount;
    const finalamount = taxableamount + totaltaxamountitem;

    return {
      ...row,
      amount: amount.toFixed(2),
      discamount: discamount.toFixed(2),
      taxableamount: taxableamount.toFixed(2),
      igstamount: igstamount.toFixed(2),
      sgstamount: sgstamount.toFixed(2),
      cgstamount: cgstamount.toFixed(2),
      totaltaxamountitem: totaltaxamountitem.toFixed(2),
      finalamount: finalamount.toFixed(2),
    };
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
    handleAddManualItem(selectedOption.itemData);
    // Reset search box after selection
    setSelectedSearchItem(null);
  };

  const handleAddManualItem = async (selectedItem) => {
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
      qty: "",
      rate: "",
      discountnumber: 0,
      igstper: "",
      sgstper: "",
      cgstper: ""
    });
    setItems([...items, newItem]);
  };

  const handleDeleteItem = (index) => {
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    updated[index] = calculateItemRow(updated[index]);
    setItems(updated);
  };

  const totals = useMemo(() => {
    let subtotal = 0, discount = 0, totalafterdisc = 0, totaltaxamount = 0;
    items.forEach((item) => {
      subtotal += parseFloat(item.amount) || 0;
      discount += parseFloat(item.discamount) || 0;
      totalafterdisc += parseFloat(item.taxableamount) || 0;
      totaltaxamount += parseFloat(item.totaltaxamountitem) || 0;
    });
    return {
      subtotal: subtotal.toFixed(2),
      discount: discount.toFixed(2),
      totalafterdisc: totalafterdisc.toFixed(2),
      totaltaxamount: totaltaxamount.toFixed(2),
      totalinvoiceamount: (totalafterdisc + totaltaxamount).toFixed(2),
    };
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
        challanid: parseInt(id),
        itemid: items.map(i => parseInt(i.itemid) || 0),
        poitemid: items.map(i => parseInt(i.poitemid) || 0),
        description: items.map(i => i.description || ""),
        hsn: items.map(i => String(i.hsn || "")),
        batchno: items.map(i => String(i.batchno || "")),
        mfddate: items.map(i => formatDate(i.mfddate)),
        expdate: items.map(i => formatDate(i.expdate)),
        uom: items.map(i => String(i.uom || "")),
        qty: items.map(i => parseFloat(i.qty) || 0),
        receiveqty: items.map(i => parseFloat(i.qty) || 0),
        rate: items.map(i => parseFloat(i.rate) || 0),
        amount: items.map(i => parseFloat(i.amount) || 0),
        discountnumber: items.map(i => parseFloat(i.discountnumber) || 0),
        discamount: items.map(i => parseFloat(i.discamount) || 0),
        taxableamount: items.map(i => parseFloat(i.taxableamount) || 0),
        igstper: items.map(i => parseFloat(i.igstper) || 0),
        igstamount: items.map(i => parseFloat(i.igstamount) || 0),
        sgstper: items.map(i => parseFloat(i.sgstper) || 0),
        sgstamount: items.map(i => parseFloat(i.sgstamount) || 0),
        cgstper: items.map(i => parseFloat(i.cgstper) || 0),
        cgstamount: items.map(i => parseFloat(i.cgstamount) || 0),
        totaltaxamountitem: items.map(i => parseFloat(i.totaltaxamountitem) || 0),
        finalamount: items.map(i => parseFloat(i.finalamount) || 0)
      };
      await axios.post("/inventory/add-mrn-items-wopo", payload).catch(() => null);

      toast.success("MRN Items saved successfully!");
    
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Failed to save items");
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
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate("/dashboards/inventory/mrn")}>
              &laquo; Back to MRN
            </Button>
          </div>
        </div>

        {/* Search Box exactly as in PHP */}
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

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="p-6 overflow-hidden shadow-soft dark:bg-dark-800">
            {fetchingData ? (
              <div className="text-center py-8">Loading data...</div>
            ) : (
              <div className="table-responsive overflow-x-auto mb-6">
                <Table className="w-full text-left border-collapse min-w-[1800px]">
                  <THead>
                    <Tr>
                      <Th className="bg-gray-150 dark:bg-dark-700 w-[250px] font-bold">Material Description</Th>
                      <Th className="bg-gray-150 dark:bg-dark-700 w-[110px] font-bold">HSN/SAC Code</Th>
                      <Th className="bg-gray-150 dark:bg-dark-700 w-[110px] font-bold">Batch no</Th>
                      <Th className="bg-gray-150 dark:bg-dark-700 w-[130px] font-bold">Mfd Date</Th>
                      <Th className="bg-gray-150 dark:bg-dark-700 w-[130px] font-bold">Exp. Date</Th>
                      <Th className="bg-gray-150 dark:bg-dark-700 w-[120px] font-bold">UOM</Th>
                      <Th className="bg-gray-150 dark:bg-dark-700 w-[95px] font-bold text-right">Quantity</Th>
                      <Th className="bg-gray-150 dark:bg-dark-700 w-[100px] font-bold text-right">Rate</Th>
                      <Th className="bg-gray-150 dark:bg-dark-700 w-[100px] font-bold text-right">Total</Th>
                      <Th className="bg-gray-150 dark:bg-dark-700 w-[85px] font-bold text-right">Discount %</Th>
                      <Th className="bg-gray-150 dark:bg-dark-700 w-[100px] font-bold text-right">Taxable Value</Th>
                      {!isSgst && <Th className="bg-gray-150 dark:bg-dark-700 w-[80px] font-bold text-right">IGST %</Th>}
                      {isSgst && <Th className="bg-gray-150 dark:bg-dark-700 w-[80px] font-bold text-right">SGST %</Th>}
                      {isSgst && <Th className="bg-gray-150 dark:bg-dark-700 w-[80px] font-bold text-right">CGST %</Th>}
                      <Th className="bg-gray-150 dark:bg-dark-700 w-[100px] font-bold text-right">Tax value</Th>
                      <Th className="bg-gray-150 dark:bg-dark-700 w-[100px] font-bold text-right">Total</Th>
                      <Th className="bg-gray-150 dark:bg-dark-700 w-[60px] text-center"></Th>
                    </Tr>
                  </THead>
                  <TBody>
                    {items.length === 0 ? (
                      <Tr>
                        <Td colSpan={17} className="text-center py-8 text-gray-500">
                          Search and select an item above to add it to the list.
                        </Td>
                      </Tr>
                    ) : (
                      items.map((item, index) => (
                        <Tr key={index} className="border-b border-gray-100 dark:border-dark-700 align-middle">
                          <Td className="p-2">
                            <textarea
                              readOnly
                              className="w-full p-2 border rounded text-sm bg-gray-50 dark:bg-dark-900/50 dark:border-dark-600 resize-none h-10"
                              value={item.description}
                            />
                          </Td>
                          <Td className="p-2">
                            <input
                              type="text"
                              className="w-full p-1 border rounded text-sm dark:bg-dark-900 dark:border-dark-600"
                              value={item.hsn}
                              onChange={(e) => handleItemChange(index, "hsn", e.target.value)}
                              required
                            />
                          </Td>
                          <Td className="p-2">
                            <input
                              type="text"
                              className="w-full p-1 border rounded text-sm dark:bg-dark-900 dark:border-dark-600"
                              value={item.batchno}
                              onChange={(e) => handleItemChange(index, "batchno", e.target.value)}
                              required
                            />
                          </Td>
                          <Td className="p-2">
                            <input
                              type="date"
                              className="w-full p-1 border rounded text-sm dark:bg-dark-900 dark:border-dark-600"
                              value={item.mfddate}
                              onChange={(e) => handleItemChange(index, "mfddate", e.target.value)}
                            />
                          </Td>
                          <Td className="p-2">
                            <input
                              type="date"
                              className="w-full p-1 border rounded text-sm dark:bg-dark-900 dark:border-dark-600"
                              value={item.expdate}
                              onChange={(e) => handleItemChange(index, "expdate", e.target.value)}
                            />
                          </Td>
                          <Td className="p-2">
                            <select
                              className="w-full p-1 border rounded text-sm dark:bg-dark-900 dark:border-dark-600"
                              value={item.uom}
                              onChange={(e) => handleItemChange(index, "uom", e.target.value)}
                              required
                            >
                              <option value=""></option>
                              {item.uom && isNaN(item.uom) && !units.some(u => String(u.id) === String(item.uom)) && (
                                <option value={item.uom}>{item.uom}</option>
                              )}
                              {units.map((u) => (
                                <option key={u.id} value={u.id}>{u.name || u.unit_name || u.unit}</option>
                              ))}
                            </select>
                          </Td>
                          <Td className="p-2">
                            <input
                              type="number"
                              min="1"
                              step="any"
                              className="w-full p-1 border rounded text-sm text-right font-bold text-success-600 dark:bg-dark-900 dark:border-dark-600"
                              value={item.qty}
                              onChange={(e) => handleItemChange(index, "qty", e.target.value)}
                              required
                            />
                          </Td>
                          <Td className="p-2">
                            <input
                              type="number"
                              step="any"
                              className="w-full p-1 border rounded text-sm text-right font-mono dark:bg-dark-900 dark:border-dark-600"
                              value={item.rate}
                              onChange={(e) => handleItemChange(index, "rate", e.target.value)}
                              required
                            />
                          </Td>
                          <Td className="p-2 text-right text-xs font-mono font-semibold">₹{item.amount}</Td>
                          <Td className="p-2">
                            <input
                              type="number"
                              step="any"
                              className="w-full p-1 border rounded text-sm text-right dark:bg-dark-900 dark:border-dark-600"
                              value={item.discountnumber}
                              onChange={(e) => handleItemChange(index, "discountnumber", e.target.value)}
                            />
                          </Td>
                          <Td className="p-2 text-right text-xs font-mono font-semibold">₹{item.taxableamount}</Td>

                          {!isSgst && (
                            <Td className="p-2">
                              <input
                                type="number"
                                step="any"
                                className="w-full p-1 border rounded text-sm text-right dark:bg-dark-900 dark:border-dark-600"
                                value={item.igstper}
                                onChange={(e) => handleItemChange(index, "igstper", e.target.value)}
                              />
                            </Td>
                          )}

                          {isSgst && (
                            <>
                              <Td className="p-2">
                                <input
                                  type="number"
                                  step="any"
                                  className="w-full p-1 border rounded text-sm text-right dark:bg-dark-900 dark:border-dark-600"
                                  value={item.sgstper}
                                  onChange={(e) => handleItemChange(index, "sgstper", e.target.value)}
                                />
                              </Td>
                              <Td className="p-2">
                                <input
                                  type="number"
                                  step="any"
                                  className="w-full p-1 border rounded text-sm text-right dark:bg-dark-900 dark:border-dark-600"
                                  value={item.cgstper}
                                  onChange={(e) => handleItemChange(index, "cgstper", e.target.value)}
                                />
                              </Td>
                            </>
                          )}

                          <Td className="p-2 text-right text-xs font-mono font-semibold text-primary-600">₹{item.totaltaxamountitem}</Td>
                          <Td className="p-2 text-right text-xs font-mono font-bold">₹{item.finalamount}</Td>
                          <Td className="p-2 text-center">
                            <Button size="sm" variant="flat" type="button" className="text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-900/30" onClick={() => handleDeleteItem(index)}>
                              <TrashIcon className="w-4 h-4" />
                            </Button>
                          </Td>
                        </Tr>
                      ))
                    )}
                  </TBody>
                </Table>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-6 border-t border-gray-150 dark:border-dark-700">
              <div></div>
              <div className="space-y-4 max-w-md ml-auto w-full">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium text-gray-500">Total Item Amount:</span>
                  <span className="font-semibold font-mono text-gray-700">₹{totals.subtotal}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium text-gray-500">Discount:</span>
                  <span className="font-semibold font-mono text-gray-700">₹{totals.discount}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium text-gray-500">Total After Discount:</span>
                  <span className="font-semibold font-mono text-gray-700">₹{totals.totalafterdisc}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium text-gray-500">Total Tax Value:</span>
                  <span className="font-semibold font-mono text-primary-600">₹{totals.totaltaxamount}</span>
                </div>
                <div className="flex justify-between items-center text-base pt-3 border-t border-dashed border-gray-200">
                  <span className="font-bold text-gray-800">Total Invoice Amount:</span>
                  <span className="font-extrabold font-mono text-success-600 text-lg">₹{totals.totalinvoiceamount}</span>
                </div>
              </div>
            </div>
          </Card>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="submit" color="primary" disabled={loading} className="px-8 font-semibold shadow-md">
              {loading ? "Saving..." : "Save Challan"}
            </Button>
          </div>
        </form>
      </div>
    </Page>
  );
}
