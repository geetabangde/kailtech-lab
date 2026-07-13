import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "utils/axios";
import { toast } from "sonner";
import { Page } from "components/shared/Page";

export default function EditPurchaseOrder() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const poId = searchParams.get("hakuna");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [vendorData, setVendorData] = useState(null);
  const [items, setItems] = useState([]);
  const [subcategories, setSubcategories] = useState([]);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    po_number: "",
    customer_id: "",
    bill_and_consign_to: "",
    delivery_terms: "",
    payment_terms: "",
    quotationdate: "",
    quotationno: "",
    warranty: "",
    jurisdiction: "Subject to Indore Jurisdiction only",
    otherdetails: "",
    sname: "",
    sphone: "",
    designation: "",
    semail: "",
    saddress: "",
    sgstno: "",
    scompany: "",
    sstate_code: ""
  });

  const [taxCalculations, setTaxCalculations] = useState({
    subtotal: 0,
    discount: 0,
    totalafterdisc: 0,
    packaginchrgs: 0,
    freightchrgs: 0,
    insurancechrgs: 0,
    calibrationchrgs: 0,
    trainingchrgs: 0,
    customdutychrgs: 0,
    totaltaxamount: 0,
    cgsttotal: 0,
    sgsttotal: 0,
    igsttotal: 0,
    totalamount: 0,
    roundoff: 0,
    finaltotal: 0
  });

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const suppliersResponse = await axios.get("/inventory/get-supplier");
        if (suppliersResponse.data.status) {
          setSuppliers(suppliersResponse.data.data || []);
        }
        try {
          const subcatResponse = await axios.get("/inventory/subcategory-list");
          if (subcatResponse.data.status) {
            setSubcategories(subcatResponse.data.data || []);
          }
        } catch (err) {
          console.error("Failed to load subcategories", err);
        }
        try {
          const companyResponse = await axios.get("/get-company-info");
          if (companyResponse.data.status) {
            const d = companyResponse.data.data;
            const companyname = d.company?.name || "";
            const companyaddress = d.address?.full_address || "";
            const companypersonname = d.company?.person_name || "";
            const companyphone = d.contact?.phone || "";
            const defaultBillTo = `${companyname}\n${companyaddress}\nName :${companypersonname}\n${companyphone}`;
            setFormData(prev => ({ ...prev, bill_and_consign_to: defaultBillTo }));
          }
        } catch (err) {
          console.error(err);
        }
      } catch (error) {
        console.error(error);
        toast.error("Something went wrong while loading data");
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  // Auto-match customer_id if missing from API but company name is available
  useEffect(() => {
    if (vendorData?.company && suppliers.length > 0 && (!formData.customer_id || formData.customer_id === "-1")) {
      const matched = suppliers.find(s => s.company?.trim() === vendorData.company?.trim());
      if (matched) {
        setFormData(prev => ({ ...prev, customer_id: matched.id }));
      }
    }
  }, [suppliers, vendorData, formData.customer_id]);

  // Auto-match subcategory_id for items if missing from API but itemname is available
  useEffect(() => {
    if (subcategories.length > 0 && items.length > 0) {
      setItems(prevItems => {
        let changed = false;
        const newItems = prevItems.map(item => {
          if (!item.subcategory_id && item.itemname) {
            const matched = subcategories.find(sc => sc.name?.trim().toLowerCase() === item.itemname?.trim().toLowerCase());
            if (matched) {
              changed = true;
              return { ...item, subcategory_id: matched.id };
            }
          }
          return item;
        });
        return changed ? newItems : prevItems;
      });
    }
  }, [subcategories, items.length]);

  // Fetch Existing PO Data
  useEffect(() => {
    const fetchPO = async () => {
      if (!poId) return;
      try {
        setLoading(true);
        const response = await axios.get(`/inventory/view-purchase-order/${poId}`);
        if (response.data.status && response.data.data) {
          const { purchase_order, supplier_details, items, summary } = response.data.data;
          if (purchase_order) {
            setFormData(prev => ({
              ...prev,
              date: purchase_order.date || prev.date,
              po_number: purchase_order.po_number || "",
              currency: purchase_order.currency || "1",
              ordertype: purchase_order.ordertype || "PO",
              customer_id: purchase_order.customer_id || "",
              bill_and_consign_to: purchase_order.bill_and_consign_to || "",
              delivery_terms: purchase_order.delivery_terms || "",
              payment_terms: purchase_order.payment_terms || "",
              quotationdate: purchase_order.quotation_date ? purchase_order.quotation_date.split(' ')[0] : "",
              quotationno: purchase_order.quotation_no || "",
              warranty: purchase_order.warranty || "",
              jurisdiction: purchase_order.jurisdiction || "Subject to Indore Jurisdiction only",
              otherdetails: purchase_order.other_details || "",
              sname: supplier_details?.contact_person || "",
              sphone: supplier_details?.contact_phone || "",
              designation: supplier_details?.designation || "",
              semail: supplier_details?.contact_email || "",
              saddress: supplier_details?.address || ""
            }));
          }
          if (supplier_details) {
            setVendorData(supplier_details);
          }
          if (items && items.length > 0) {
            const mappedItems = items.map((item, index) => ({
              id: item.id || Date.now() + index,
              hsn_code: item.hsn_code || "",
              subcategory_id: item.subcategory_id || "",
              indent_item_id: item.indent_item_id || "",
              itemname: item.material_name || item.instrument_name || item.itemname || "",
              price: item.price || 0,
              specification: item.specification || "",
              quantity: item.quantity || 1,
              unit: item.unit_id || item.unit || "",
              currency: item.currency || purchase_order?.currency || "1",
              amount: item.amount || item.list_price || 0,
              discountperitem: item.discount || 0,
              discamount: item.discamount || ((item.amount || item.list_price || 0) * (parseFloat(item.discount) || 0) / 100) || 0,
              tax_rate: item.tax_rate ? parseFloat(item.tax_rate) : 18,
              igstper: item.igstper || 0,
              igstamount: item.igst || item.igstamount || 0,
              sgstper: item.sgstper || 0,
              sgstamount: item.sgst || item.sgstamount || 0,
              cgstper: item.cgstper || 0,
              cgstamount: item.cgst || item.cgstamount || 0,
              totaltaxamountitem: item.total_tax || item.totaltaxamountitem || 0,
              taxableamount: item.taxableamount || (item.amount - (item.discamount || 0)) || 0,
              finalamount: item.final_amount || item.finalamount || 0
            }));
            setItems(mappedItems);
          }
          if (summary) {
            setTaxCalculations({
              subtotal: parseFloat(summary.subtotal) || 0,
              discount: parseFloat(summary.discount) || 0,
              totalafterdisc: parseFloat(summary.total_after_discount) || 0,
              packaginchrgs: parseFloat(summary.packing_charges) || 0,
              freightchrgs: parseFloat(summary.freight_charges) || 0,
              insurancechrgs: parseFloat(summary.insurance_charges) || 0,
              calibrationchrgs: parseFloat(summary.calibration_charges) || 0,
              trainingchrgs: parseFloat(summary.training_charges) || 0,
              customdutychrgs: parseFloat(summary.custom_duty_charges) || 0,
              totaltaxamount: parseFloat(summary.total_tax_amount) || 0,
              cgsttotal: parseFloat(summary.cgst) || 0,
              sgsttotal: parseFloat(summary.sgst) || 0,
              igsttotal: parseFloat(summary.igst) || 0,
              totalamount: parseFloat(summary.total_invoice_amount) || 0,
              roundoff: parseFloat(summary.roundoff) || 0,
              finaltotal: parseFloat(summary.final_total) || 0
            });
          }
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to load purchase order details");
      } finally {
        setLoading(false);
      }
    };
    fetchPO();
  }, [poId]);

  useEffect(() => {
    calculateTotals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  const handleSupplierChange = async (supplierId) => {
    setFormData(prev => ({
      ...prev,
      customer_id: supplierId,
      sname: "",
      sphone: "",
      designation: "",
      semail: "",
      saddress: ""
    }));
    setItems([]);
    setVendorData(null);
    if (!supplierId || supplierId === "-1" || supplierId === "") return;

    try {
      const response = await axios.get(`/inventory/get-supplier-details/${supplierId}`);
      if (response.data.status) {
        const details = response.data.data;
        setVendorData(details);
        setFormData(prev => ({
          ...prev,
          // Correctly map actual API response fields
          sname: details?.contact_person || "",
          sphone: details?.contact_phone || details?.mobile || "",
          designation: details?.designation || "",
          semail: details?.contact_email || details?.email || "",
          saddress: details?.full_address || `${details?.address || ""} ${details?.city || ""}`.trim(),
          sgstno: details?.gstno || details?.gst_number || "",
          scompany: details?.company || "",
          sstate_code: details?.gst_state_code || details?.state_code || ""
        }));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const calculateItemAmount = (itemId, field, value) => {
    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const updatedItem = { ...item, [field]: value };
        const qty = parseFloat(updatedItem.quantity) || 0;
        const rate = parseFloat(updatedItem.price) || 0;
        const finalamount = qty * rate;
        updatedItem.amount = finalamount;

        const discountpercent = parseFloat(updatedItem.discountperitem) || 0;
        const discountamount = (finalamount / 100) * discountpercent;
        updatedItem.discamount = discountamount;

        const taxableamount = finalamount - discountamount;
        updatedItem.taxableamount = taxableamount;

        const tax_rate = parseFloat(updatedItem.tax_rate) || 0;
        let cgstamount = 0, sgstamount = 0, igstamount = 0;
        let cgstper = 0, sgstper = 0, igstper = 0;
        let totaltaxamount = 0;

        const myGstCode = "23"; // Madhya Pradesh state code
        const supplierGstNo = vendorData?.gstno || "";
        const supplierGstCode = supplierGstNo.trim().substring(0, 2);
        // Also check gst_state_code from API (numeric string like "27")
        const supplierStateCode = String(vendorData?.gst_state_code || "");
        const isSameState = supplierGstCode === myGstCode || supplierStateCode === myGstCode;

        if (isSameState) {
          const taxRateHalf = tax_rate / 2;
          cgstamount = (taxableamount * taxRateHalf) / 100;
          sgstamount = (taxableamount * taxRateHalf) / 100;
          cgstper = taxRateHalf; sgstper = taxRateHalf;
          totaltaxamount = cgstamount + sgstamount;
        } else {
          igstamount = (taxableamount * tax_rate) / 100;
          igstper = tax_rate; totaltaxamount = igstamount;
        }

        updatedItem.cgstper = cgstper; updatedItem.sgstper = sgstper; updatedItem.igstper = igstper;
        updatedItem.cgstamount = cgstamount; updatedItem.sgstamount = sgstamount; updatedItem.igstamount = igstamount;
        updatedItem.totaltaxamountitem = totaltaxamount;
        updatedItem.finalamount = taxableamount + totaltaxamount;
        return updatedItem;
      }
      return item;
    }));
  };

  // Update multiple fields atomically in one setItems call to avoid React batching losing subcategory_id
  const updateItemMultiFields = (itemId, fieldsObj) => {
    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const updatedItem = { ...item, ...fieldsObj };
        const qty = parseFloat(updatedItem.quantity) || 0;
        const rate = parseFloat(updatedItem.price) || 0;
        const finalamount = qty * rate;
        updatedItem.amount = finalamount;
        const discountpercent = parseFloat(updatedItem.discountperitem) || 0;
        const discountamount = (finalamount / 100) * discountpercent;
        updatedItem.discamount = discountamount;
        const taxableamount = finalamount - discountamount;
        updatedItem.taxableamount = taxableamount;
        const tax_rate = parseFloat(updatedItem.tax_rate) || 0;
        let cgstamount = 0, sgstamount = 0, igstamount = 0;
        let cgstper = 0, sgstper = 0, igstper = 0;
        let totaltaxamount = 0;
        const myGstCode = "23"; // Madhya Pradesh state code
        const supplierGstNo = vendorData?.gstno || "";
        const supplierGstCode = supplierGstNo.trim().substring(0, 2);
        const supplierStateCode = String(vendorData?.gst_state_code || "");
        const isSameState = supplierGstCode === myGstCode || supplierStateCode === myGstCode;
        if (isSameState) {
          const taxRateHalf = tax_rate / 2;
          cgstamount = (taxableamount * taxRateHalf) / 100;
          sgstamount = (taxableamount * taxRateHalf) / 100;
          cgstper = taxRateHalf; sgstper = taxRateHalf;
          totaltaxamount = cgstamount + sgstamount;
        } else {
          igstamount = (taxableamount * tax_rate) / 100;
          igstper = tax_rate; totaltaxamount = igstamount;
        }
        updatedItem.cgstper = cgstper; updatedItem.sgstper = sgstper; updatedItem.igstper = igstper;
        updatedItem.cgstamount = cgstamount; updatedItem.sgstamount = sgstamount; updatedItem.igstamount = igstamount;
        updatedItem.totaltaxamountitem = totaltaxamount;
        updatedItem.finalamount = taxableamount + totaltaxamount;
        return updatedItem;
      }
      return item;
    }));
  };

  const calculateTotals = () => {
    setTaxCalculations(prev => {
      let subtotal = 0, cgst = 0, sgst = 0, igst = 0, discount = 0;
      items.forEach(item => {
        subtotal += parseFloat(item.amount) || 0;
        cgst += parseFloat(item.cgstamount) || 0;
        sgst += parseFloat(item.sgstamount) || 0;
        igst += parseFloat(item.igstamount) || 0;
        discount += parseFloat(item.discamount) || 0;
      });
      const totalafterdisc = subtotal - discount;
      const packchrgs = parseFloat(prev.packaginchrgs) || 0;
      const freightchrgs = parseFloat(prev.freightchrgs) || 0;
      const insurancechrgs = parseFloat(prev.insurancechrgs) || 0;
      const calibrationchrgs = parseFloat(prev.calibrationchrgs) || 0;
      const trainingchrgs = parseFloat(prev.trainingchrgs) || 0;
      const customdutychrgs = parseFloat(prev.customdutychrgs) || 0;

      const additionalCharges = packchrgs + freightchrgs + insurancechrgs + calibrationchrgs + trainingchrgs;
      const additionalChargesTax = (additionalCharges * 18) / 100;
      const totaltaxamount = cgst + sgst + igst + additionalChargesTax;
      const totalamount = totalafterdisc + totaltaxamount + additionalCharges + customdutychrgs;
      const finaltotal = Math.round(totalamount);
      const roundoff = finaltotal - totalamount;

      return {
        ...prev, subtotal, discount, totalafterdisc, totaltaxamount,
        cgsttotal: cgst, sgsttotal: sgst, igsttotal: igst,
        totalamount, roundoff, finaltotal
      };
    });
  };

  const handleAdditionalChargeChange = (field, value) => {
    const numericVal = parseFloat(value) || 0;
    setTaxCalculations(prev => {
      const updated = { ...prev, [field]: numericVal };
      let subtotal = 0, cgst = 0, sgst = 0, igst = 0, discount = 0;
      items.forEach(item => {
        subtotal += parseFloat(item.amount) || 0;
        cgst += parseFloat(item.cgstamount) || 0;
        sgst += parseFloat(item.sgstamount) || 0;
        igst += parseFloat(item.igstamount) || 0;
        discount += parseFloat(item.discamount) || 0;
      });
      const totalafterdisc = subtotal - discount;
      const packchrgs = field === "packaginchrgs" ? numericVal : parseFloat(updated.packaginchrgs) || 0;
      const freightchrgs = field === "freightchrgs" ? numericVal : parseFloat(updated.freightchrgs) || 0;
      const insurancechrgs = field === "insurancechrgs" ? numericVal : parseFloat(updated.insurancechrgs) || 0;
      const calibrationchrgs = field === "calibrationchrgs" ? numericVal : parseFloat(updated.calibrationchrgs) || 0;
      const trainingchrgs = field === "trainingchrgs" ? numericVal : parseFloat(updated.trainingchrgs) || 0;
      const customdutychrgs = field === "customdutychrgs" ? numericVal : parseFloat(updated.customdutychrgs) || 0;
      const additionalCharges = packchrgs + freightchrgs + insurancechrgs + calibrationchrgs + trainingchrgs;
      const additionalChargesTax = (additionalCharges * 18) / 100;
      const totaltaxamount = cgst + sgst + igst + additionalChargesTax;
      const totalamount = totalafterdisc + totaltaxamount + additionalCharges + customdutychrgs;
      const finaltotal = Math.round(totalamount);
      const roundoff = finaltotal - totalamount;

      return { ...updated, subtotal, discount, totalafterdisc, totaltaxamount, cgsttotal: cgst, sgsttotal: sgst, igsttotal: igst, totalamount, roundoff, finaltotal };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (items.length === 0) return toast.error("No Item is Added");
    if (!formData.ordertype) return toast.error("Please select order type (PO/WO)");
    if (!formData.customer_id || formData.customer_id === "-1") return toast.error("Please select a supplier");

    // Validate that subcategory_id exists for all items
    for (let item of items) {
      if (!item.subcategory_id || item.subcategory_id === "") {
        return toast.error(`Item "${item.itemname || "Unknown"}" is missing a subcategory. Please select a subcategory.`);
      }
    }

    setSubmitting(true);

    // Format dates from YYYY-MM-DD to DD/MM/YYYY for the backend
    const formattedDate = formData.date ? formData.date.split('-').reverse().join('/') : "";
    const formattedQuotationDate = formData.quotationdate ? formData.quotationdate.split('-').reverse().join('/') : "";

    // Transform data to match the legacy PHP/API expected payload structure
    const payload = {
      ...formData,
      sname: formData.sname || "-", // Prevent null constraint violation on backend
      semail: formData.semail || "-",
      designation: formData.designation || "-",
      sphone: formData.sphone || "-",
      saddress: formData.saddress || "-",
      delivery_terms: formData.delivery_terms || "-",
      payment_terms: formData.payment_terms || "-",
      quotationno: formData.quotationno || "-",
      warranty: formData.warranty || "-",
      otherdetails: formData.otherdetails || "-",
      date: formattedDate,
      quotationdate: formattedQuotationDate,

      // Map tax calculations
      subtotal: taxCalculations.subtotal,
      discount: taxCalculations.discount,
      totalafterdisc: taxCalculations.totalafterdisc,
      packaginchrgs: taxCalculations.packaginchrgs,
      freightchrgs: taxCalculations.freightchrgs,
      insurancechrgs: taxCalculations.insurancechrgs,
      calibrationchrgs: taxCalculations.calibrationchrgs,
      trainingchrgs: taxCalculations.trainingchrgs,
      customdutychrgs: taxCalculations.customdutychrgs,
      totaltaxamount: taxCalculations.totaltaxamount,
      cgst: taxCalculations.cgsttotal,
      sgst: taxCalculations.sgsttotal,
      igst: taxCalculations.igsttotal,
      totalinvoiceamount: taxCalculations.totalamount,
      roundoff: taxCalculations.roundoff,
      finaltotal: taxCalculations.finaltotal,

      // Map items array into flat arrays
      primary_id: items.map(i => i.id > 10000000 ? "" : String(i.id)),
      hsn_code: items.map(i => String(i.hsn_code || "-")),
      subcategory_id: items.map(i => String(i.subcategory_id || "0")),
      indent_item_id: items.map(i => String(i.indent_item_id || "0")),
      itemname: items.map(i => String(i.itemname || "-")),
      price: items.map(i => String(i.price || "0")),
      specification: items.map(i => String(i.specification || "-")),
      quantity: items.map(i => String(i.quantity || "1")),
      unit: items.map(i => String(i.unit || "-")),
      list_price: items.map(i => String(i.amount || "0")),
      discountperitem: items.map(i => String(i.discountperitem || "0")),
      discamount: items.map(i => String(i.discamount || "0")),
      tax_rate: items.map(i => String(i.tax_rate || "18")),
      igstper: items.map(i => String(i.igstper || "0")),
      igstamount: items.map(i => String(i.igstamount || "0")),
      sgstper: items.map(i => String(i.sgstper || "0")),
      sgstamount: items.map(i => String(i.sgstamount || "0")),
      cgstper: items.map(i => String(i.cgstper || "0")),
      cgstamount: items.map(i => String(i.cgstamount || "0")),
      totaltaxamountitem: items.map(i => String(i.totaltaxamountitem || "0")),
      taxableamount: items.map(i => String(i.taxableamount || "0")),
      finalamount: items.map(i => String(i.finalamount || "0")),

      // Ensure currency is passed as array of integers to match PHP $_POST['currency'][0] logic
      currency: [parseInt(formData.currency, 10) || 1]
    };

    try {
      const response = await axios.post("/inventory/update-purchase-order", { ...payload, po_id: poId, id: poId });
      if (response.data.status) {
        toast.success("Purchase Order updated successfully");
        navigate("/dashboards/inventory/purchase-order");
      } else {
        toast.error(response.data.message || "Failed to create purchase order");
      }
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong while creating purchase order");
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = async (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field === "ordertype") {
      if (!value) return setFormData(prev => ({ ...prev, po_number: "" }));
      try {
        const response = await axios.get(`/inventory/generate-po-wo-number?type=${value}`);
        if (response.data.status) setFormData(prev => ({ ...prev, po_number: response.data.code }));
      } catch (error) {
        console.error(error);
      }
    }
  };

  if (loading) {
    return (
      <Page title="Edit Purchase Order">
        <div className="flex h-64 items-center justify-center">Loading...</div>
      </Page>
    );
  }

  const inputClass = "w-full border border-blue-400 dark:border-blue-600 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 transition-shadow";
  const labelClass = "text-sm font-bold text-slate-700 dark:text-slate-300 block mb-1";

  return (
    <Page title="Edit Purchase Order">
      <div className="w-full bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 p-4 overflow-x-hidden">

        {/* Header */}
        <div className="flex justify-between items-center border-b pb-4 mb-6">
          <h1 className="text-xl font-black text-slate-800 dark:text-slate-100">Edit Purchase Order/Work Order</h1>
          <button type="button" onClick={() => navigate("/dashboards/inventory/purchase-order")} className="border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 text-sm font-bold bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            &lt;&lt; Back
          </button>
        </div>

        <form onSubmit={handleSubmit}>

          {/* Top Form Grid */}
          <div className="flex flex-col md:flex-row gap-4">

            {/* Left Column */}
            <div className="flex-1 space-y-2">
              <div className="mb-2">
                <label className={labelClass}>Business Name</label>
                <select className={inputClass} value={formData.customer_id} onChange={(e) => handleSupplierChange(e.target.value)} required>
                  <option value="-1">Choose One..</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.company}</option>)}
                </select>
              </div>

              {vendorData && (
                <>
                  <div className="mb-2">
                    <label className={labelClass}>Phone Number</label>
                    <input type="text" className={inputClass} value={vendorData.mobile || ""} disabled />
                  </div>
                  <div className="mb-2">
                    <label className={labelClass}>E-mail Address</label>
                    <input type="text" className={inputClass} value={vendorData.email || ""} disabled />
                  </div>
                  <div className="mb-2">
                    <label className={labelClass}>GST Number</label>
                    <input type="text" className={inputClass} value={vendorData.gstno || vendorData.gst_number || ""} disabled />
                  </div>
                  <div className="mb-2">
                    <label className={labelClass}>Website</label>
                    <input type="text" className={inputClass} value={vendorData.website || ""} disabled />
                  </div>
                  <div className="mb-2">
                    <label className={labelClass}>Contact</label>
                    <input type="text" className={inputClass} value={formData.sname} onChange={(e) => handleInputChange("sname", e.target.value)} />
                  </div>
                  <div className="mb-2">
                    <label className={labelClass}>Phone*</label>
                    <input type="text" className={inputClass} value={formData.sphone} onChange={(e) => handleInputChange("sphone", e.target.value)} required />
                  </div>
                  <div className="mb-2">
                    <label className={labelClass}>Designation*</label>
                    <input type="text" className={inputClass} value={formData.designation} onChange={(e) => handleInputChange("designation", e.target.value)} required />
                  </div>
                  <div className="mb-2">
                    <label className={labelClass}>Email</label>
                    <input type="email" className={inputClass} value={formData.semail} onChange={(e) => handleInputChange("semail", e.target.value)} />
                  </div>

                  <h5 className="font-black mt-4 mb-2 text-sm text-slate-800 dark:text-slate-200 border-b pb-1">Address Information</h5>
                  <div className="mb-3">
                    <label className={labelClass}>Address</label>
                    <input type="text" className={inputClass} value={formData.saddress} onChange={(e) => handleInputChange("saddress", e.target.value)} required />
                  </div>
                </>
              )}
            </div>

            {/* Right Column */}
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-end mb-2">
                <label className="text-xs font-semibold mr-2">Date:</label>
                <input type="date" className={`w-2/3 ${inputClass}`} value={formData.date} onChange={(e) => handleInputChange("date", e.target.value)} />
              </div>
              <div className="flex items-center justify-end mb-4">
                <label className="text-xs font-semibold mr-2">PO No.</label>
                <input type="text" className={`w-2/3 ${inputClass} bg-gray-100`} value={formData.po_number} disabled />
              </div>

              <div className="mb-2">
                <label className={labelClass}>*Billed and Consign To:</label>
                <textarea className={inputClass} style={{ height: '80px', resize: 'none' }} value={formData.bill_and_consign_to} onChange={(e) => handleInputChange("bill_and_consign_to", e.target.value)} required />
              </div>
              <div className="mb-2">
                <label className={labelClass}>Delivery Terms:</label>
                <input type="text" className={inputClass} value={formData.delivery_terms} onChange={(e) => handleInputChange("delivery_terms", e.target.value)} required />
              </div>
              <div className="mb-2">
                <label className={labelClass}>Payment Terms:</label>
                <input type="text" className={inputClass} value={formData.payment_terms} onChange={(e) => handleInputChange("payment_terms", e.target.value)} required />
              </div>
              <div className="mb-2">
                <label className={labelClass}>Quotation Date:</label>
                <input type="date" className={inputClass} value={formData.quotationdate} onChange={(e) => handleInputChange("quotationdate", e.target.value)} />
              </div>
              <div className="mb-2">
                <label className={labelClass}>Quotation Reference No:</label>
                <input type="text" className={inputClass} value={formData.quotationno} onChange={(e) => handleInputChange("quotationno", e.target.value)} />
              </div>
              <div className="mb-2">
                <label className={labelClass}>Warranty:</label>
                <input type="text" className={inputClass} value={formData.warranty} onChange={(e) => handleInputChange("warranty", e.target.value)} required />
              </div>
              <div className="mb-2">
                <label className={labelClass}>Jurisdiction :</label>
                <input type="text" className={inputClass} value={formData.jurisdiction} onChange={(e) => handleInputChange("jurisdiction", e.target.value)} required />
              </div>
              <div className="mb-2">
                <label className={labelClass}>Other Detail :</label>
                <textarea className={inputClass} rows={2} value={formData.otherdetails} onChange={(e) => handleInputChange("otherdetails", e.target.value)} />
              </div>

            </div>

          </div>

          {/* Product Details Section */}
          <div className="full-product-ui mt-8 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="ml-4 mt-3">
              <h5 className="font-black text-lg mb-4 text-slate-800 dark:text-slate-100">Product Details</h5>
            </div>
            
            <div className="w-full overflow-x-auto border border-gray-200">
              <table className="w-full text-center border-collapse whitespace-nowrap">
                <thead className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-b border-slate-300 dark:border-slate-600 text-sm">
                  <tr>
                    <th className="p-2 font-bold text-sm border border-gray-300 bg-gray-100 text-center">S.no</th>
                    <th className="p-2 font-bold text-sm border border-gray-300 bg-gray-100 text-center">HSN/SAC</th>
                    <th className="p-2 font-bold text-sm border border-gray-300 bg-gray-100 text-center">Material / Services Name</th>
                    <th className="p-2 font-bold text-sm border border-gray-300 bg-gray-100 text-center">Specification</th>
                    <th className="p-2 font-bold text-sm border border-gray-300 bg-gray-100 text-center">Price</th>
                    <th className="p-2 font-bold text-sm border border-gray-300 bg-gray-100 text-center">Quantity</th>
                    <th className="p-2 font-bold text-sm border border-gray-300 bg-gray-100 text-center">Amount</th>
                    <th className="p-2 font-bold text-sm border border-gray-300 bg-gray-100 text-center">Discount%</th>
                    <th className="p-2 font-bold text-sm border border-gray-300 bg-gray-100 text-center">Tax Rate</th>
                    <th className="p-2 font-bold text-sm border border-gray-300 bg-gray-100 text-center">IGST</th>
                    <th className="p-2 font-bold text-sm border border-gray-300 bg-gray-100 text-center">CGST</th>
                    <th className="p-2 font-bold text-sm border border-gray-300 bg-gray-100 text-center">SGST</th>
                    <th className="p-2 font-bold text-sm border border-gray-300 bg-gray-100 text-center">Total Tax</th>
                    <th className="p-2 font-bold text-sm border border-gray-300 bg-gray-100 text-center">Taxable</th>
                    <th className="p-2 font-bold text-sm border border-gray-300 bg-gray-100 text-center">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {items.map((item, index) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="p-2 border border-gray-300"><input type="text" className="w-16 border px-1 form-control text-center bg-gray-100" value={index + 1} readOnly /></td>
                      <td className="p-2 border border-gray-300"><input type="text" className="w-24 border px-1 form-control bg-gray-100" value={item.hsn_code} readOnly /></td>
                      <td className="p-2 border border-gray-300 min-w-[200px]">
                        {formData.ordertype === "PO" ? (
                          <input type="text" className="w-full border px-1 form-control bg-gray-100" value={item.itemname} readOnly />
                        ) : (
                          <select className="w-full border px-1 form-control bg-yellow-50" value={item.subcategory_id} onChange={(e) => {
                            const selectedVal = e.target.value;
                            const subcat = subcategories.find(s => String(s.id) === selectedVal);
                            updateItemMultiFields(item.id, {
                              subcategory_id: selectedVal,
                              itemname: subcat?.name || subcat?.subcategory_name || "",
                              hsn_code: subcat?.hsn || item.hsn_code || ""
                            });
                          }}>
                            <option value="">- Select Subcategory -</option>
                            {subcategories.map(s => <option key={s.id} value={s.id}>{s.name || s.subcategory_name}</option>)}
                          </select>
                        )}
                        {item.itemname && formData.ordertype !== "PO" && <div className="text-[10px] text-blue-600 mt-1">{item.itemname}</div>}
                      </td>
                      <td className="p-2 border border-gray-300"><input type="text" className="w-24 border px-1 form-control" value={item.specification} onChange={(e) => calculateItemAmount(item.id, "specification", e.target.value)} /></td>
                      <td className="p-2 border border-gray-300"><input type="number" className="w-20 border px-1 form-control bg-yellow-50" value={item.price} onChange={(e) => calculateItemAmount(item.id, "price", e.target.value)} readOnly={formData.ordertype === "PO"} /></td>
                      <td className="p-2 border border-gray-300"><input type="number" className="w-16 border px-1 form-control bg-yellow-50" value={item.quantity} onChange={(e) => calculateItemAmount(item.id, "quantity", e.target.value)} min="1" /></td>
                      <td className="p-2 border border-gray-300"><input type="number" className="w-24 border px-1 form-control bg-gray-100" value={item.amount} readOnly /></td>
                      <td className="p-2 border border-gray-300"><input type="number" className="w-16 border px-1 form-control bg-gray-100" value={item.discountperitem} readOnly /></td>
                      <td className="p-2 border border-gray-300"><input type="text" className="w-20 border px-1 form-control bg-gray-100" value={item.tax_rate} readOnly /></td>
                      <td className="p-2 border border-gray-300"><input type="number" className="w-20 border px-1 form-control bg-gray-100" value={item.igstamount} readOnly /></td>
                      <td className="p-2 border border-gray-300"><input type="number" className="w-20 border px-1 form-control bg-gray-100" value={item.cgstamount} readOnly /></td>
                      <td className="p-2 border border-gray-300"><input type="number" className="w-20 border px-1 form-control bg-gray-100" value={item.sgstamount} readOnly /></td>
                      <td className="p-2 border border-gray-300"><input type="number" className="w-24 border px-1 form-control bg-gray-100" value={item.totaltaxamountitem} readOnly /></td>
                      <td className="p-2 border border-gray-300"><input type="number" className="w-24 border px-1 form-control bg-gray-100" value={item.taxableamount} readOnly /></td>
                      <td className="p-2 border border-gray-300"><input type="number" className="w-24 border px-1 form-control bg-gray-100" value={item.finalamount} readOnly /></td>
                    </tr>
                  ))}
                  {items.length === 0 && (
                    <tr>
                      <td colSpan="15" className="p-8 text-slate-500 italic text-sm font-medium">No items added.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Totals Section */}
            {items.length > 0 && (
              <div className="flex justify-end mt-4">
                <div className="w-full md:w-1/2 space-y-1 text-xs">
                  <div className="flex justify-between items-center"><span className="text-right flex-1 pr-2">Total Item Amount</span><input type="text" className="w-32 border px-2 py-1 bg-gray-100 text-right" value={taxCalculations.subtotal.toFixed(2)} readOnly /></div>
                  <div className="flex justify-between items-center"><span className="text-right flex-1 pr-2">Discount</span><input type="text" className="w-32 border px-2 py-1 bg-gray-100 text-right" value={taxCalculations.discount.toFixed(2)} readOnly /></div>
                  <div className="flex justify-between items-center"><span className="text-right flex-1 pr-2 font-semibold">Total After Discount Value</span><input type="text" className="w-32 border px-2 py-1 bg-gray-100 text-right font-semibold" value={taxCalculations.totalafterdisc.toFixed(2)} readOnly /></div>

                  <div className="flex justify-between items-center"><span className="text-right flex-1 pr-2">Packing & Forwarding Charges</span><input type="number" className="w-32 border px-2 py-1 text-right" value={taxCalculations.packaginchrgs} onChange={(e) => handleAdditionalChargeChange("packaginchrgs", e.target.value)} /></div>
                  <div className="flex justify-between items-center"><span className="text-right flex-1 pr-2">Freight Charges</span><input type="number" className="w-32 border px-2 py-1 text-right" value={taxCalculations.freightchrgs} onChange={(e) => handleAdditionalChargeChange("freightchrgs", e.target.value)} /></div>
                  <div className="flex justify-between items-center"><span className="text-right flex-1 pr-2">Insurance charges</span><input type="number" className="w-32 border px-2 py-1 text-right" value={taxCalculations.insurancechrgs} onChange={(e) => handleAdditionalChargeChange("insurancechrgs", e.target.value)} /></div>
                  <div className="flex justify-between items-center"><span className="text-right flex-1 pr-2">Calibration Certificate Charges</span><input type="number" className="w-32 border px-2 py-1 text-right" value={taxCalculations.calibrationchrgs} onChange={(e) => handleAdditionalChargeChange("calibrationchrgs", e.target.value)} /></div>
                  <div className="flex justify-between items-center"><span className="text-right flex-1 pr-2">Installation,Demonstration&Training Charges</span><input type="number" className="w-32 border px-2 py-1 text-right" value={taxCalculations.trainingchrgs} onChange={(e) => handleAdditionalChargeChange("trainingchrgs", e.target.value)} /></div>
                  <div className="flex justify-between items-center"><span className="text-right flex-1 pr-2">Import /Custom Duty Charges</span><input type="number" className="w-32 border px-2 py-1 text-right" value={taxCalculations.customdutychrgs} onChange={(e) => handleAdditionalChargeChange("customdutychrgs", e.target.value)} /></div>

                  <div className="flex justify-between items-center"><span className="text-right flex-1 pr-2 font-semibold">Total Tax Value</span><input type="text" className="w-32 border px-2 py-1 bg-gray-100 text-right font-semibold" value={taxCalculations.totaltaxamount.toFixed(2)} readOnly /></div>
                  <div className="flex justify-between items-center"><span className="text-right flex-1 pr-2">CGST Total</span><input type="text" className="w-32 border px-2 py-1 bg-gray-100 text-right" value={taxCalculations.cgsttotal.toFixed(2)} readOnly /></div>
                  <div className="flex justify-between items-center"><span className="text-right flex-1 pr-2">SGST Total</span><input type="text" className="w-32 border px-2 py-1 bg-gray-100 text-right" value={taxCalculations.sgsttotal.toFixed(2)} readOnly /></div>
                  <div className="flex justify-between items-center"><span className="text-right flex-1 pr-2">IGST Total</span><input type="text" className="w-32 border px-2 py-1 bg-gray-100 text-right" value={taxCalculations.igsttotal.toFixed(2)} readOnly /></div>

                  <div className="flex justify-between items-center"><span className="text-right flex-1 pr-2 font-bold text-[13px]">Total Invoice Amount</span><input type="text" className="w-32 border border-gray-400 px-2 py-1 bg-gray-100 text-right font-bold" value={taxCalculations.totalamount.toFixed(2)} readOnly /></div>
                  <div className="flex justify-between items-center"><span className="text-right flex-1 pr-2">Round Off</span><input type="text" className="w-32 border px-2 py-1 bg-gray-100 text-right text-gray-500" value={taxCalculations.roundoff.toFixed(2)} readOnly /></div>
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-300 dark:border-slate-600"><span className="text-right flex-1 pr-4 font-black text-lg">Total</span><input type="text" className="w-36 border-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 text-right font-black text-blue-900 dark:text-blue-300 rounded-lg text-lg" value={taxCalculations.finaltotal.toLocaleString()} readOnly /></div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 border-t border-slate-200 dark:border-slate-700 pt-4">
            <button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded shadow-md font-bold text-sm">
              {submitting ? "Submitting..." : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </Page>
  );
}