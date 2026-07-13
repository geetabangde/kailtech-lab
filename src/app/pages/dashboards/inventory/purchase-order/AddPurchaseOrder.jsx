import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "utils/axios";
import { toast } from "sonner";
import { Page } from "components/shared/Page";

export default function AddPurchaseOrder() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [units, setUnits] = useState([]);
  const [vendorData, setVendorData] = useState(null);
  const [items, setItems] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    po_number: "",
    currency: "1",
    ordertype: "",
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
        const currenciesResponse = await axios.get("/master/currency-list");
        if (currenciesResponse.data.status) {
          setCurrencies(currenciesResponse.data.data || []);
        }
        const unitsResponse = await axios.get("/master/units-list");
        if (unitsResponse.data.status) {
          setUnits(unitsResponse.data.data || []);
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
          sgstno: details?.gstno || "",
          scompany: details?.company || "",
          sstate_code: details?.gst_state_code || details?.state_code || ""
        }));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const addNewItem = () => {
    const newItem = {
      id: Date.now(),
      hsn_code: "",
      subcategory_id: "",
      indent_item_id: "",
      itemname: "",
      price: "",
      specification: "",
      quantity: 1,
      unit: "",
      currency: formData.currency,
      amount: 0,
      discountperitem: 0,
      discamount: 0,
      tax_rate: 18,
      igstper: 0,
      igstamount: 0,
      sgstper: 0,
      sgstamount: 0,
      cgstper: 0,
      cgstamount: 0,
      totaltaxamountitem: 0,
      taxableamount: 0,
      finalamount: 0
    };
    setItems(prev => [...prev, newItem]);
  };

  const handleSearchChange = async (val) => {
    if (val.length < 3) {
      setSearchResults([]);
      return;
    }
    try {
      const response = await axios.post("/inventory/search-materials", {
        vendor: formData.customer_id,
        currency: formData.currency,
        wopo: formData.ordertype,
        search: val
      });
      if (response.data.status) setSearchResults(response.data.data || []);
      else setSearchResults([]);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSearchResultSelect = (result) => {
    // Debug: log what fields the API is returning so we can map correctly
    console.log("[Search Material Result]", result);
    
    const subcatId = result.material || result.subcategory_id || result.subcatid || result.sub_id || result.id || "0";
    if (items.some(item => item.subcategory_id === subcatId)) {
      toast.error("Instrument Already Added");
      setSearchResults([]);
      return;
    }
    const newItem = {
      id: Date.now(),
      hsn_code: result.hsn || result.hsn_code || "",
      subcategory_id: String(subcatId),
      indent_item_id: "",
      itemname: result.name || result.itemname || result.instrument_name || "",
      price: result.subprice || result.list_price || result.rate || result.price || "",
      specification: "",
      quantity: 1,
      unit: result.unit || result.unit_id || result.unit_name || "",
      currency: formData.currency,
      amount: parseFloat(result.subprice || result.price || 0),
      discountperitem: parseFloat(result.discount || 0),
      discamount: 0,
      tax_rate: parseFloat(result.tax_rate || result.percentage || result.tax || result.gst) || 18,
      igstper: 0, igstamount: 0, sgstper: 0, sgstamount: 0, cgstper: 0, cgstamount: 0,
      totaltaxamountitem: 0, taxableamount: 0, finalamount: 0
    };
    setItems(prev => [...prev, newItem]);
    setSearchResults([]);
    setTimeout(() => calculateItemAmount(newItem.id, "quantity", 1), 0);
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
      if (!item.unit || item.unit === "") {
        return toast.error(`Item "${item.itemname || "Unknown"}" is missing a unit. Please select a unit.`);
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
      const response = await axios.post("/inventory/add-purchase-order", payload);
      if (response.data.status) {
        toast.success("Purchase Order created successfully");
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
      <Page title="Add Purchase Order">
        <div className="flex h-64 items-center justify-center">Loading...</div>
      </Page>
    );
  }

  const inputClass = "w-full border border-blue-400 dark:border-blue-600 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 transition-shadow";
  const labelClass = "text-sm font-bold text-slate-700 dark:text-slate-300 block mb-1";
  
  return (
    <Page title="Add Purchase Order">
      <div className="w-full bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 p-4 overflow-x-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b pb-4 mb-6">
          <h1 className="text-xl font-black text-slate-800 dark:text-slate-100">Add Purchase Order/Work Order</h1>
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
                <label className={labelClass}>Currency</label>
                <select className={inputClass} value={formData.currency} onChange={(e) => handleInputChange("currency", e.target.value)}>
                  {currencies.map(c => <option key={c.id} value={c.id}>{c.name} {c.description}</option>)}
                </select>
              </div>
              <div className="mb-2">
                <label className={labelClass}>PO/WO</label>
                <select className={inputClass} value={formData.ordertype} onChange={(e) => handleInputChange("ordertype", e.target.value)} required>
                  <option value="">Select Order type</option>
                  <option value="PO">PO</option>
                  <option value="WO">WO</option>
                </select>
              </div>
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
                    <input type="text" className={inputClass} value={vendorData.gstno || ""} disabled />
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
          <div className="mt-8 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
            <h5 className="font-black text-lg mb-4 flex items-center gap-2">Product Details</h5>
            
            {/* Search Box */}
            <div className="mb-3">
              <label className={labelClass}>Search Instrument</label>
              <div className="flex gap-2 relative">
                {formData.ordertype === "WO" ? (
                  <button type="button" onClick={addNewItem} className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded-sm text-xs font-bold">
                    + Manual Add Item
                  </button>
                ) : (
                  <input type="text" className={inputClass} placeholder="Type 3+ chars to search..." onChange={(e) => handleSearchChange(e.target.value)} disabled={!formData.customer_id || formData.customer_id === "-1"} />
                )}
                {searchResults.length > 0 && (
                  <div className="absolute top-8 left-0 w-full bg-white border border-gray-300 shadow-md max-h-48 overflow-y-auto z-50">
                    {searchResults.map(result => (
                      <div key={result.id || result.material} onClick={() => handleSearchResultSelect(result)} className="px-4 py-3 hover:bg-blue-50 dark:hover:bg-slate-700 cursor-pointer text-sm font-medium border-b dark:border-slate-600 transition-colors">
                        {result.name} - ₹{result.subprice} ({result.tax_rate || result.percentage || result.tax || "18"}% Tax)
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="w-full overflow-x-auto border border-gray-200">
              <table className="w-full text-center border-collapse whitespace-nowrap">
                <thead className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-b border-slate-300 dark:border-slate-600 text-sm">
                  <tr>
                    <th className="p-3 font-bold uppercase tracking-wider text-[11px]">S.no</th>
                    <th className="p-3 font-bold uppercase tracking-wider text-[11px] text-left">Instrument details</th>
                    <th className="p-3 font-bold uppercase tracking-wider text-[11px]">Specification</th>
                    <th className="p-3 font-bold uppercase tracking-wider text-[11px]">Quantity</th>
                    <th className="p-3 font-bold uppercase tracking-wider text-[11px]">Unit</th>
                    <th className="p-3 font-bold uppercase tracking-wider text-[11px]">Currency</th>
                    <th className="p-3 font-bold uppercase tracking-wider text-[11px]">Amount</th>
                    <th className="p-3 font-bold uppercase tracking-wider text-[11px]">Discount%</th>
                    <th className="p-3 font-bold uppercase tracking-wider text-[11px]">Tax Rate</th>
                    <th className="p-3 font-bold uppercase tracking-wider text-[11px]">IGST</th>
                    <th className="p-3 font-bold uppercase tracking-wider text-[11px]">CGST</th>
                    <th className="p-3 font-bold uppercase tracking-wider text-[11px]">SGST</th>
                    <th className="p-3 font-bold uppercase tracking-wider text-[11px]">Total Tax</th>
                    <th className="p-3 font-bold uppercase tracking-wider text-[11px]">Taxable</th>
                    <th className="p-3 font-bold uppercase tracking-wider text-[11px]">Total</th>
                    <th className="p-3 font-bold uppercase tracking-wider text-[11px]">Close</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {items.map((item, index) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="p-2 border-r border-gray-200">{index + 1}</td>
                      <td className="p-2 border-r border-gray-200 text-left min-w-[200px]">
                        <div className="mb-1">HSN/SAC: <input type="text" className="w-16 border px-1" value={item.hsn_code} onChange={(e) => calculateItemAmount(item.id, "hsn_code", e.target.value)} readOnly={formData.ordertype === "PO"} /></div>
                        <div className="mb-1 flex flex-col gap-1">
                          <span className="text-xs font-semibold">Name:</span>
                          {formData.ordertype === "PO" ? (
                            <input type="text" className="w-full border px-1" value={item.itemname} onChange={(e) => calculateItemAmount(item.id, "itemname", e.target.value)} readOnly />
                          ) : (
                            <>
                              <select className="w-full border px-1 bg-yellow-50 mb-1 text-sm" value={item.subcategory_id} onChange={(e) => {
                                const selectedVal = e.target.value;
                                const subcat = subcategories.find(s => String(s.id) === selectedVal);
                                // Single atomic update - prevents React state batching from losing subcategory_id
                                updateItemMultiFields(item.id, {
                                  subcategory_id: selectedVal,
                                  itemname: subcat?.name || subcat?.subcategory_name || "",
                                  hsn_code: subcat?.hsn || item.hsn_code || ""
                                });
                              }}>
                                <option value="">- Select Subcategory -</option>
                                {subcategories.map(s => <option key={s.id} value={s.id}>{s.name || s.subcategory_name || `Subcategory ${s.id}`}</option>)}
                              </select>
                              <input type="text" className="w-full border px-1" placeholder="Item Name / Description" value={item.itemname} onChange={(e) => calculateItemAmount(item.id, "itemname", e.target.value)} />
                            </>
                          )}
                        </div>
                        <div className="mt-1">Price: <input type="number" className="w-24 border px-1 bg-yellow-50" value={item.price} onChange={(e) => calculateItemAmount(item.id, "price", e.target.value)} readOnly={formData.ordertype === "PO"} /></div>
                      </td>
                      <td className="p-2 border-r border-gray-200">
                        <textarea className="w-24 border px-1" rows={2} value={item.specification} onChange={(e) => calculateItemAmount(item.id, "specification", e.target.value)} />
                      </td>
                      <td className="p-2 border-r border-gray-200">
                        <input type="number" className="w-16 border px-1 text-center bg-yellow-50" value={item.quantity} min="1" onChange={(e) => calculateItemAmount(item.id, "quantity", e.target.value)} />
                      </td>
                      <td className="p-2 border-r border-gray-200">
                        {formData.ordertype === "PO" ? (
                           <input type="text" className="w-16 border px-1 bg-gray-100 text-center" value={units.find(u => String(u.id) === String(item.unit))?.name || item.unit || ""} readOnly />
                        ) : (
                          <select className="w-20 border px-1" value={item.unit} onChange={(e) => calculateItemAmount(item.id, "unit", e.target.value)}>
                            <option value="">-</option>
                            {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                          </select>
                        )}
                      </td>
                      <td className="p-2 border-r border-gray-200">
                        <input type="text" className="w-16 border px-1 bg-gray-100 text-center" value={currencies.find(c => String(c.id) === String(item.currency))?.name || ""} readOnly />
                      </td>
                      <td className="p-2 border-r border-gray-200">
                        <input type="number" className="w-20 border px-1 bg-gray-100 text-right" value={parseFloat(item.amount||0).toFixed(2)} readOnly />
                      </td>
                      <td className="p-2 border-r border-gray-200">
                        <input type="number" className="w-16 border px-1 text-center" value={item.discountperitem} onChange={(e) => calculateItemAmount(item.id, "discountperitem", e.target.value)} />
                      </td>
                      <td className="p-2 border-r border-gray-200">
                        <input type="number" className="w-16 border px-1 text-center" value={item.tax_rate} onChange={(e) => calculateItemAmount(item.id, "tax_rate", e.target.value)} />
                      </td>
                      <td className="p-2 border-r border-gray-200 text-right">
                        <div>{item.igstper}%</div>
                        <input type="text" className="w-16 border px-1 bg-gray-100 text-right" value={parseFloat(item.igstamount||0).toFixed(2)} readOnly />
                      </td>
                      <td className="p-2 border-r border-gray-200 text-right">
                        <div>{item.cgstper}%</div>
                        <input type="text" className="w-16 border px-1 bg-gray-100 text-right" value={parseFloat(item.cgstamount||0).toFixed(2)} readOnly />
                      </td>
                      <td className="p-2 border-r border-gray-200 text-right">
                        <div>{item.sgstper}%</div>
                        <input type="text" className="w-16 border px-1 bg-gray-100 text-right" value={parseFloat(item.sgstamount||0).toFixed(2)} readOnly />
                      </td>
                      <td className="p-2 border-r border-gray-200">
                        <input type="text" className="w-20 border px-1 bg-gray-100 text-right" value={parseFloat(item.totaltaxamountitem||0).toFixed(2)} readOnly />
                      </td>
                      <td className="p-2 border-r border-gray-200">
                        <input type="text" className="w-20 border px-1 bg-gray-100 text-right" value={parseFloat(item.taxableamount||0).toFixed(2)} readOnly />
                      </td>
                      <td className="p-2 border-r border-gray-200">
                        <input type="text" className="w-24 border px-1 bg-gray-100 text-right font-bold" value={parseFloat(item.finalamount||0).toFixed(2)} readOnly />
                      </td>
                      <td className="p-2">
                        <button type="button" onClick={() => setItems(prev => prev.filter(i => i.id !== item.id))} className="text-red-500 font-bold px-2 py-1 bg-red-50 hover:bg-red-100 border border-red-200 rounded">X</button>
                      </td>
                    </tr>
                  ))}
                  {items.length === 0 && (
                    <tr>
                      <td colSpan="16" className="p-8 text-slate-500 italic text-sm font-medium">No items added. Search and add an instrument above.</td>
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