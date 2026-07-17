import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Card, Button, Input, Table, THead, TBody, Tr, Th, Td } from "components/ui";
import { Page } from "components/shared/Page";
import axios from "utils/axios";
import { toast } from "sonner";

// ----------------------------------------------------------------------

export default function AddMRNItem() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);
  const [challanInfo, setChallanInfo] = useState(location.state?.mrn || null);
  const [rows, setRows] = useState([]);

  // Convert Date from YYYY-MM-DD to DD/MM/YYYY for backend
  const formatDateToDDMMYYYY = (dateStr) => {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  // ✅ Fetch Challan & PO Items on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setFetchingData(true);
        // PHP logic: purchase_order_item_ajax.php
        const res = await axios.get(`inventory/mrn-item-list?id=${id}`);

        if (res.data.status === true || res.data.status === "true" || res.data.data) {
          const rawData = res.data.data || res.data;

          // Set Challan Info
          if (rawData.mrn) {
            setChallanInfo((prev) => prev || rawData.mrn);
          } else {
            setChallanInfo((prev) => prev || rawData);
          }

          // Supplier GST state code rules
          const supplierGst = rawData.mrn?.gstnumber || rawData.mrn?.gstno || rawData?.gstnumber || rawData?.gstno || challanInfo?.gstnumber || challanInfo?.gstno || "";
          const isSameState = supplierGst.startsWith("23") || rawData.mrn?.statecode === "23" || rawData?.statecode === "23" || challanInfo?.statecode === "23";

          // Parse and populate items
          const rawItems = rawData.items || [];
          if (Array.isArray(rawItems) && rawItems.length > 0) {
            const mappedRows = rawItems.map((item) => {
              const orderedQty = parseFloat(item.qty || item.quantity) || 0;
              const remainingQty = parseFloat(item.total_remaining_quantity || item.remainingqty || orderedQty) || 0;
              const rate = parseFloat(item.rate || item.price) || 0;
              const taxRate = parseFloat(item.tax_rate || item.percentage) || 0;

              // Amounts calculations
              const amount = remainingQty * rate;
              const discountnumber = 0;
              const discamount = 0;
              const taxableamount = amount;

              // GST Percentages
              const igstper = isSameState ? 0 : taxRate;
              const sgstper = isSameState ? taxRate / 2 : 0;
              const cgstper = isSameState ? taxRate / 2 : 0;

              // GST Amounts
              const igstamount = isSameState ? 0 : (taxableamount * igstper) / 100;
              const sgstamount = isSameState ? (taxableamount * sgstper) / 100 : 0;
              const cgstamount = isSameState ? (taxableamount * cgstper) / 100 : 0;
              const totaltaxamountitem = igstamount + sgstamount + cgstamount;
              const finalamount = taxableamount + totaltaxamountitem;

              return {
                itemid: item.itemid || item.subcategory_id || "",
                poitemid: item.poitemid || item.id || "",
                description: item.description || item.it_name || item.name || "",
                hsn: item.hsn || "",
                batchno: "",
                mfddate: "",
                expdate: "",
                uom: item.uom || "",
                qty: orderedQty,
                receiveqty: remainingQty,
                rate: rate,
                amount: amount.toFixed(2),
                discountnumber: discountnumber,
                discamount: discamount.toFixed(2),
                taxableamount: taxableamount.toFixed(2),
                tax_rate: taxRate,
                igstper: igstper,
                igstamount: igstamount.toFixed(2),
                sgstper: sgstper,
                sgstamount: sgstamount.toFixed(2),
                cgstper: cgstper,
                cgstamount: cgstamount.toFixed(2),
                totaltaxamountitem: totaltaxamountitem.toFixed(2),
                finalamount: finalamount.toFixed(2),
                remark: "",
                maxReceiveQty: remainingQty,
              };
            });
            setRows(mappedRows);
          }
        }
      } catch (err) {
        console.error("Error loading items:", err);
        toast.error("Failed to load PO items or Challan details");
      } finally {
        setFetchingData(false);
      }
    };

    if (id) fetchInitialData();
  }, [id]);

  // Handle row input changes and trigger calculations
  const handleRowChange = (index, field, value) => {
    const updatedRows = [...rows];
    updatedRows[index][field] = value;

    const receiveqty = parseFloat(updatedRows[index].receiveqty) || 0;
    const rate = parseFloat(updatedRows[index].rate) || 0;
    const discountnumber = parseFloat(updatedRows[index].discountnumber) || 0;
    const taxRate = parseFloat(updatedRows[index].tax_rate) || 0;

    // Check same-state rules
    const supplierGst = challanInfo?.gstnumber || challanInfo?.gstno || "";
    const isSameState = supplierGst.startsWith("23") || challanInfo?.statecode === "23";

    // 1. Amount = Qty * Rate
    const amount = receiveqty * rate;
    updatedRows[index].amount = amount.toFixed(2);

    // 2. Discount Amount
    const discamount = (amount * discountnumber) / 100;
    updatedRows[index].discamount = discamount.toFixed(2);

    // 3. Taxable Value
    const taxableamount = amount - discamount;
    updatedRows[index].taxableamount = taxableamount.toFixed(2);

    // 4. Tax Percentages
    const igstper = isSameState ? 0 : taxRate;
    const sgstper = isSameState ? taxRate / 2 : 0;
    const cgstper = isSameState ? taxRate / 2 : 0;

    updatedRows[index].igstper = igstper;
    updatedRows[index].sgstper = sgstper;
    updatedRows[index].cgstper = cgstper;

    // 5. Tax Amounts
    const igstamount = isSameState ? 0 : (taxableamount * igstper) / 100;
    const sgstamount = isSameState ? (taxableamount * sgstper) / 100 : 0;
    const cgstamount = isSameState ? (taxableamount * cgstper) / 100 : 0;

    updatedRows[index].igstamount = igstamount.toFixed(2);
    updatedRows[index].sgstamount = sgstamount.toFixed(2);
    updatedRows[index].cgstamount = cgstamount.toFixed(2);

    const totaltaxamountitem = igstamount + sgstamount + cgstamount;
    updatedRows[index].totaltaxamountitem = totaltaxamountitem.toFixed(2);

    // 6. Final Amount
    const finalamount = taxableamount + totaltaxamountitem;
    updatedRows[index].finalamount = finalamount.toFixed(2);

    setRows(updatedRows);
  };

  // ✅ Memoized Header totals
  const totals = useMemo(() => {
    let subtotal = 0;
    let discount = 0;
    let totalafterdisc = 0;
    let totaltaxamount = 0;

    rows.forEach((row) => {
      subtotal += parseFloat(row.amount) || 0;
      discount += parseFloat(row.discamount) || 0;
      totalafterdisc += parseFloat(row.taxableamount) || 0;
      totaltaxamount += parseFloat(row.totaltaxamountitem) || 0;
    });

    const totalinvoiceamount = totalafterdisc + totaltaxamount;

    return {
      subtotal: subtotal.toFixed(2),
      discount: discount.toFixed(2),
      totalafterdisc: totalafterdisc.toFixed(2),
      totaltaxamount: totaltaxamount.toFixed(2),
      totalinvoiceamount: totalinvoiceamount.toFixed(2),
    };
  }, [rows]);

  // Form submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (rows.length === 0) {
      toast.warning("No items available to add!");
      return;
    }

    // Validate quantities & required fields
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (!r.receiveqty || parseFloat(r.receiveqty) <= 0) {
        toast.error(`Please enter a valid Quantity for Row ${i + 1}`);
        return;
      }
      if (parseFloat(r.receiveqty) > parseFloat(r.maxReceiveQty)) {
        toast.error(`Quantity for Row ${i + 1} cannot exceed remaining quantity (${r.maxReceiveQty})`);
        return;
      }
    }

    setLoading(true);
    try {
      // Build PHP-style parallel array payload exactly matching backend's expectations
      const payload = {
        challanid: id,
        itemid: rows.map((r) => r.itemid),
        poitemid: rows.map((r) => r.poitemid),
        description: rows.map((r) => r.description),
        hsn: rows.map((r) => r.hsn),
        batchno: rows.map((r) => r.batchno),
        mfddate: rows.map((r) => formatDateToDDMMYYYY(r.mfddate)),
        expdate: rows.map((r) => formatDateToDDMMYYYY(r.expdate)),
        uom: rows.map((r) => r.uom),
        qty: rows.map((r) => parseFloat(r.qty) || 0),
        receiveqty: rows.map((r) => parseFloat(r.receiveqty) || 0),
        rate: rows.map((r) => parseFloat(r.rate) || 0),
        amount: rows.map((r) => parseFloat(r.amount) || 0),
        discountnumber: rows.map((r) => parseFloat(r.discountnumber) || 0),
        discamount: rows.map((r) => parseFloat(r.discamount) || 0),
        taxableamount: rows.map((r) => parseFloat(r.taxableamount) || 0),
        tax_rate: rows.map((r) => parseFloat(r.tax_rate) || 0),
        igstper: rows.map((r) => parseFloat(r.igstper) || 0),
        igstamount: rows.map((r) => parseFloat(r.igstamount) || 0),
        sgstper: rows.map((r) => parseFloat(r.sgstper) || 0),
        sgstamount: rows.map((r) => parseFloat(r.sgstamount) || 0),
        cgstper: rows.map((r) => parseFloat(r.cgstper) || 0),
        cgstamount: rows.map((r) => parseFloat(r.cgstamount) || 0),
        totaltaxamountitem: rows.map((r) => parseFloat(r.totaltaxamountitem) || 0),
        finalamount: rows.map((r) => parseFloat(r.finalamount) || 0),
        remark: rows.map((r) => r.remark),

        subtotal: parseFloat(totals.subtotal) || 0,
        discount: parseFloat(totals.discount) || 0,
        totalafterdisc: parseFloat(totals.totalafterdisc) || 0,
        totaltaxamount: parseFloat(totals.totaltaxamount) || 0,
        totalinvoiceamount: parseFloat(totals.totalinvoiceamount) || 0,
      };

      await axios.post("/inventory/add-mrn-items", payload);

      toast.success("MRN Items added successfully ✅");
      navigate("/dashboards/inventory/mrn");
    } catch (err) {
      console.error("Error creating MRN items:", err);
      toast.error(err?.response?.data?.message || "Failed to add items to MRN ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page title="Add MRN Items">
      <div className="transition-content p-6">

        {/* Header section */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold tracking-wide text-gray-800 dark:text-dark-50">
              Add New MRN Items
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Add items and verify taxes under Challan/MRN ID: <span className="font-semibold text-primary-600">{id}</span>
            </p>
          </div>
          <Button
            variant="outline"
            className="border-gray-300 text-gray-700 dark:text-dark-200"
            onClick={() => navigate(-1)}
          >
            &laquo; Back to MRN
          </Button>
        </div>

        {/* Challan Details Card */}
        {challanInfo && (
          <Card className="p-6 mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 bg-gradient-to-br from-white to-gray-50 dark:from-dark-800 dark:to-dark-900 border border-gray-150 shadow-soft">
            <div>
              <span className="block text-xs font-semibold text-gray-400 dark:text-dark-300 uppercase tracking-wider mb-1">
                Vendor Name
              </span>
              <span className="text-sm font-semibold text-gray-800 dark:text-dark-50">
                {challanInfo.customername || "—"}
              </span>
            </div>
            <div>
              <span className="block text-xs font-semibold text-gray-400 dark:text-dark-300 uppercase tracking-wider mb-1">
                Challan/Invoice Number
              </span>
              <span className="text-sm font-semibold text-gray-800 dark:text-dark-50">
                {challanInfo.challanno || challanInfo.invoiceno || "—"}
              </span>
            </div>
            <div>
              <span className="block text-xs font-semibold text-gray-400 dark:text-dark-300 uppercase tracking-wider mb-1">
                Challan/Invoice Date
              </span>
              <span className="text-sm font-semibold text-gray-800 dark:text-dark-50">
                {challanInfo.challandate || challanInfo.invoicedate
                  ? new Date(challanInfo.challandate || challanInfo.invoicedate).toLocaleDateString("en-GB")
                  : "—"}
              </span>
            </div>
            <div>
              <span className="block text-xs font-semibold text-gray-400 dark:text-dark-300 uppercase tracking-wider mb-1">
                GST Number
              </span>
              <span className="text-sm font-semibold text-gray-800 dark:text-dark-50 font-mono">
                {challanInfo.gstnumber || challanInfo.gstno || "—"}
              </span>
            </div>
          </Card>
        )}

        {/* Dynamic Items Table */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="p-6 overflow-hidden shadow-soft dark:bg-dark-800">
            <div className="table-responsive overflow-x-auto mb-6">
              <Table className="w-full text-left border-collapse min-w-[2000px]">
                <THead>
                  <Tr>
                    <Th className="bg-gray-150 dark:bg-dark-700 w-[220px] font-bold">Material Description</Th>
                    <Th className="bg-gray-150 dark:bg-dark-700 w-[110px] font-bold">HSN/SAC Code</Th>
                    <Th className="bg-gray-150 dark:bg-dark-700 w-[100px] font-bold">Batch no</Th>
                    <Th className="bg-gray-150 dark:bg-dark-700 w-[130px] font-bold">Mfd Date</Th>
                    <Th className="bg-gray-150 dark:bg-dark-700 w-[130px] font-bold">Exp. Date</Th>
                    <Th className="bg-gray-150 dark:bg-dark-700 w-[80px] font-bold text-center">UOM</Th>
                    <Th className="bg-gray-150 dark:bg-dark-700 w-[95px] font-bold text-right">Ordered Qty</Th>
                    <Th className="bg-gray-150 dark:bg-dark-700 w-[95px] font-bold text-right">Quantity *</Th>
                    <Th className="bg-gray-150 dark:bg-dark-700 w-[100px] font-bold text-right">Rate *</Th>
                    <Th className="bg-gray-150 dark:bg-dark-700 w-[100px] font-bold text-right">Total</Th>
                    <Th className="bg-gray-150 dark:bg-dark-700 w-[85px] font-bold text-right">Discount %</Th>
                    <Th className="bg-gray-150 dark:bg-dark-700 w-[100px] font-bold text-right">Taxable Value</Th>
                    <Th className="bg-gray-150 dark:bg-dark-700 w-[80px] font-bold text-right">Tax Rate</Th>
                    <Th className="bg-gray-150 dark:bg-dark-700 w-[75px] font-bold text-right">IGST %</Th>
                    <Th className="bg-gray-150 dark:bg-dark-700 w-[75px] font-bold text-right">SGST %</Th>
                    <Th className="bg-gray-150 dark:bg-dark-700 w-[75px] font-bold text-right">CGST %</Th>
                    <Th className="bg-gray-150 dark:bg-dark-700 w-[100px] font-bold text-right">Tax value</Th>
                    <Th className="bg-gray-150 dark:bg-dark-700 w-[100px] font-bold text-right">Total</Th>
                    <Th className="bg-gray-150 dark:bg-dark-700 w-[180px] font-bold">Remark</Th>
                  </Tr>
                </THead>
                <TBody>
                  {fetchingData ? (
                    <Tr>
                      <Td colSpan={19} className="text-center py-8 font-medium text-gray-500">
                        Loading PO Items...
                      </Td>
                    </Tr>
                  ) : rows.length === 0 ? (
                    <Tr>
                      <Td colSpan={19} className="text-center py-8 font-medium text-gray-500">
                        No pending items found for this MRN
                      </Td>
                    </Tr>
                  ) : (
                    rows.map((row, index) => (
                      <Tr key={index} className="border-b border-gray-100 dark:border-dark-700 align-middle">

                        {/* Description */}
                        <Td className="py-2">
                          <Input
                            value={row.description}
                            readOnly
                            className="bg-gray-50 dark:bg-dark-900/50 text-xs font-semibold h-9"
                          />
                        </Td>

                        {/* HSN */}
                        <Td className="py-2">
                          <Input
                            value={row.hsn}
                            readOnly
                            className="bg-gray-50 dark:bg-dark-900/50 text-xs text-center font-mono h-9"
                          />
                        </Td>

                        {/* Batch No */}
                        <Td className="py-2">
                          <Input
                            placeholder="Batch No"
                            value={row.batchno}
                            onChange={(e) => handleRowChange(index, "batchno", e.target.value)}
                            required
                            className="text-xs h-9"
                          />
                        </Td>

                        {/* Mfg Date */}
                        <Td className="py-2">
                          <Input
                            type="date"
                            value={row.mfddate}
                            onChange={(e) => handleRowChange(index, "mfddate", e.target.value)}
                            className="text-xs h-9"
                          />
                        </Td>

                        {/* Exp Date */}
                        <Td className="py-2">
                          <Input
                            type="date"
                            value={row.expdate}
                            onChange={(e) => handleRowChange(index, "expdate", e.target.value)}
                            className="text-xs h-9"
                          />
                        </Td>

                        {/* UOM */}
                        <Td className="py-2 text-center text-xs font-semibold text-gray-600 dark:text-dark-200">
                          {row.uom}
                        </Td>

                        {/* Ordered Qty */}
                        <Td className="py-2 text-right text-xs font-semibold text-gray-500 font-mono">
                          {row.qty}
                        </Td>

                        {/* Quantity (Received) */}
                        <Td className="py-2">
                          <Input
                            type="number"
                            min="1"
                            max={row.maxReceiveQty}
                            step="any"
                            value={row.receiveqty}
                            onChange={(e) => handleRowChange(index, "receiveqty", e.target.value)}
                            required
                            className="text-xs text-right text-success-600 font-bold h-9"
                          />
                        </Td>

                        {/* Rate */}
                        <Td className="py-2">
                          <Input
                            type="number"
                            step="any"
                            value={row.rate}
                            onChange={(e) => handleRowChange(index, "rate", e.target.value)}
                            required
                            className="text-xs text-right font-mono h-9"
                          />
                        </Td>

                        {/* Total (Amount) */}
                        <Td className="py-2 text-right text-xs font-mono font-semibold">
                          ₹{row.amount}
                        </Td>

                        {/* Discount % */}
                        <Td className="py-2">
                          <Input
                            type="number"
                            step="any"
                            value={row.discountnumber}
                            onChange={(e) => handleRowChange(index, "discountnumber", e.target.value)}
                            className="text-xs text-right h-9"
                          />
                        </Td>

                        {/* Taxable Value */}
                        <Td className="py-2 text-right text-xs font-mono font-semibold">
                          ₹{row.taxableamount}
                        </Td>

                        {/* Tax Rate */}
                        <Td className="py-2 text-right text-xs font-semibold">
                          {row.tax_rate}%
                        </Td>

                        {/* IGST % */}
                        <Td className="py-2 text-right text-xs font-mono text-gray-500">
                          {row.igstper}%
                        </Td>

                        {/* SGST % */}
                        <Td className="py-2 text-right text-xs font-mono text-gray-500">
                          {row.sgstper}%
                        </Td>

                        {/* CGST % */}
                        <Td className="py-2 text-right text-xs font-mono text-gray-500">
                          {row.cgstper}%
                        </Td>

                        {/* Tax Value */}
                        <Td className="py-2 text-right text-xs font-mono font-semibold text-primary-600">
                          ₹{row.totaltaxamountitem}
                        </Td>

                        {/* Total (Final Amount) */}
                        <Td className="py-2 text-right text-xs font-mono font-bold text-gray-800 dark:text-dark-50">
                          ₹{row.finalamount}
                        </Td>

                        {/* Remark */}
                        <Td className="py-2">
                          <textarea
                            placeholder="Remark"
                            value={row.remark}
                            onChange={(e) => handleRowChange(index, "remark", e.target.value)}
                            rows={1}
                            className="w-full text-xs p-2 rounded border border-gray-300 dark:bg-dark-900 dark:border-dark-600 dark:text-dark-50 h-9"
                          />
                        </Td>
                      </Tr>
                    ))
                  )}
                </TBody>
              </Table>
            </div>

            {/* Calculations Summary Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-6 border-t border-gray-150 dark:border-dark-700">
              <div className="text-sm text-gray-500 dark:text-dark-300">
                <span className="font-semibold text-gray-700 dark:text-dark-100">Note:</span> Taxes are automatically calculated based on state code rules (CGST/SGST for Madhya Pradesh, IGST for other states).
              </div>
              <div className="space-y-4 max-w-md ml-auto w-full">

                {/* Total Item Amount */}
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium text-gray-500">Total Item Amount:</span>
                  <span className="font-semibold font-mono text-gray-700 dark:text-dark-100">₹{totals.subtotal}</span>
                </div>

                {/* Discount */}
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium text-gray-500">Discount:</span>
                  <span className="font-semibold font-mono text-gray-700 dark:text-dark-100">₹{totals.discount}</span>
                </div>

                {/* Total After Discount Value */}
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium text-gray-500">Total After Discount Value:</span>
                  <span className="font-semibold font-mono text-gray-700 dark:text-dark-100">₹{totals.totalafterdisc}</span>
                </div>

                {/* Total Tax Value */}
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium text-gray-500">Total Tax Value:</span>
                  <span className="font-semibold font-mono text-primary-600 dark:text-primary-400">₹{totals.totaltaxamount}</span>
                </div>

                {/* Total Invoice Amount */}
                <div className="flex justify-between items-center text-base pt-3 border-t border-dashed border-gray-200 dark:border-dark-700">
                  <span className="font-bold text-gray-800 dark:text-dark-50">Total Invoice Amount:</span>
                  <span className="font-extrabold font-mono text-success-600 text-lg dark:text-success-400">₹{totals.totalinvoiceamount}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Footer Save Challan Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
              className="px-6 font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              color="primary"
              disabled={loading || rows.length === 0}
              className="px-8 font-semibold shadow-md shadow-primary-500/20"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z"></path>
                  </svg>
                  Saving...
                </div>
              ) : (
                "Save Challan"
              )}
            </Button>
          </div>
        </form>
      </div>
    </Page>
  );
}
