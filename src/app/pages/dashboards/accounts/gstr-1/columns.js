// Import Dependencies
import { createColumnHelper } from "@tanstack/react-table";

const columnHelper = createColumnHelper();

// State Code → State Name mapping (GST Place of Supply codes)
export const stateCodeMap = {
  "01": "Jammu & Kashmir", "02": "Himachal Pradesh", "03": "Punjab",
  "04": "Chandigarh", "05": "Uttarakhand", "06": "Haryana",
  "07": "Delhi", "08": "Rajasthan", "09": "Uttar Pradesh",
  "10": "Bihar", "11": "Sikkim", "12": "Arunachal Pradesh",
  "13": "Nagaland", "14": "Manipur", "15": "Mizoram",
  "16": "Tripura", "17": "Meghalaya", "18": "Assam",
  "19": "West Bengal", "20": "Jharkhand", "21": "Odisha",
  "22": "Chhattisgarh", "23": "Madhya Pradesh", "24": "Gujarat",
  "26": "Dadra & Nagar Haveli and Daman & Diu", "27": "Maharashtra",
  "28": "Andhra Pradesh (Old)", "29": "Karnataka", "30": "Goa",
  "31": "Lakshadweep", "32": "Kerala", "33": "Tamil Nadu",
  "34": "Puducherry", "35": "Andaman & Nicobar Islands",
  "36": "Telangana", "37": "Andhra Pradesh", "38": "Ladakh",
  "97": "Other Territory", "99": "Centre Jurisdiction",
};

// Get Place of Supply display string (e.g., "23-Madhya Pradesh")
export const getPlaceOfSupply = (row) => {
  const code = String(row.statecode || row.state_code || row.state || "").trim();
  if (!code || code === "0") return "";
  const padded = code.padStart(2, "0");
  const name = stateCodeMap[padded];
  return name ? `${padded}-${name}` : padded;
};

// Get GST Rate (%) from row data
export const getGstRate = (row) => {
  // Try direct rate fields first
  const rate = row.gstrate || row.taxrate || row.tax_rate || row.gst_rate || row.rate;
  if (rate && Number(rate) > 0) return Number(rate);

  // Calculate from tax amounts and taxable value
  const taxable = Number(row.subtotal2 || row.taxable_value || 0);
  if (taxable > 0) {
    const cgst = Number(row.cgstamount || 0);
    const sgst = Number(row.sgstamount || 0);
    const igst = Number(row.igstamount || 0);
    const totalTax = cgst + sgst + igst;
    if (totalTax > 0) {
      const computed = (totalTax / taxable) * 100;
      // Round to standard GST rates
      const stdRates = [0, 0.25, 3, 5, 12, 18, 28];
      const closest = stdRates.reduce((prev, curr) =>
        Math.abs(curr - computed) < Math.abs(prev - computed) ? curr : prev
      );
      return closest;
    }
  }
  return 0;
};

export const getSupplierType = (row) => {
  const rawType = row.supplier_type || row.supplier_typ || row.sup_type || row.suptyp || row.invoice_type || row.invoice_typ;
  if (rawType) {
    const upper = String(rawType).toUpperCase();
    if (upper.includes("B2B")) return "B2B";
    if (upper.includes("B2C")) return "B2C";
    if (upper.includes("EXP") || upper.includes("EXPORT")) return "EXPORT";
    if (upper.includes("SEZ")) return "SEZ";
  }

  const country = String(row.country || row.country_id || "").trim().toUpperCase();
  const gst = (row.gstno || "").trim();
  const hasGst = gst && gst !== "0" && gst !== "NA" && gst.toUpperCase() !== "URP";
  
  const txpType = String(row.txptype || row.txp_type || "").trim().toUpperCase();
  const address = String(row.address || row.billingaddress || row.custaddress || row.address1 || "").toUpperCase();
  const name = String(row.custname || row.customername || row.cname || "").toUpperCase();
  const stateCode = String(row.statecode || row.state_code || row.state || "").trim().toUpperCase();
  const stateName = String(row.statename || row.state_name || "").trim().toUpperCase();

  // Export Detection:
  // 1. Explicit export taxpayer type
  // 2. Presence of shipping bill/port code
  // 3. Country is not India
  // 4. State code or name is "NA", "97" (Other Territory / Outside India)
  const isExport = (txpType === "EXP" || txpType === "EXPWOP" || txpType === "EXPWP" || txpType === "EXPORT") ||
                   !!(row.portcode || row.port_code || row.shippingbillno || row.shipping_bill_no) ||
                   (country !== "" && country !== "1" && country !== "0" && country !== "IN" && country !== "INDIA") ||
                   (stateCode === "NA" || stateCode === "97") ||
                   (stateName === "NA" || stateName.includes("OUTSIDE") || stateName.includes("OTHER"));

  // SEZ Detection:
  // 1. If txptype field is explicitly SEZ/SEZWOP/SEZWP
  // 2. If customer name or billing address literally contains "SEZ"
  // NOTE: Do NOT use zero CGST+SGST as a signal — ALL inter-state B2B invoices have 0 CGST/SGST
  const isSEZ = (txpType === "SEZ" || txpType === "SEZWOP" || txpType === "SEZWP") ||
                address.includes("SEZ") ||
                name.includes("SEZ");

  if (isExport) {
    return "EXPORT";
  }

  if (country === "1" || country === "0" || !country) {
    if (!hasGst) {
      return "B2C";
    } else if (isSEZ) {
      return "SEZ";
    } else {
      return "B2B";
    }
  } else {
    return "EXPORT";
  }
};

export const columns = [
  columnHelper.display({
    id: "s_no",
    header: "Sr. no",
    cell: (info) => info.row.index + 1,
  }),
  columnHelper.accessor("gstno", {
    id: "gstno",
    header: "GSTIN/UIN",
    cell: (info) => info.getValue() ?? "-",
  }),
  columnHelper.display({
    id: "supplier_type",
    header: "INVOICE TYPE",
    cell: (info) => getSupplierType(info.row.original),
  }),
  columnHelper.accessor("custname", {
    id: "custname",
    header: "RECEIVER NAME",
    cell: (info) => info.getValue() ?? "-",
  }),
  columnHelper.accessor("invoiceno", {
    id: "invoiceno",
    header: "INVOICE NO",
    cell: (info) => info.getValue() ?? "-",
  }),
  columnHelper.accessor("invoicedate", {
    id: "invoicedate",
    header: "INVOICE DATE",
    cell: (info) => {
      const val = info.getValue();
      if (!val) return "-";
      const d = new Date(val);
      return isNaN(d) ? val : d.toLocaleDateString("en-GB");
    },
  }),
  columnHelper.accessor("finaltotal", {
    id: "finaltotal",
    header: "INVOICE VALUE",
    cell: (info) => Number(info.getValue() || 0).toFixed(2),
  }),
  columnHelper.display({
    id: "place_of_supply",
    header: "PLACE OF SUPPLY",
    cell: (info) => getPlaceOfSupply(info.row.original) || "-",
  }),
  columnHelper.display({
    id: "reverse_charge",
    header: "REVERSE CHARGE",
    cell: (info) => {
      const val = info.row.original.reversecharge || info.row.original.reverse_charge || "";
      return String(val).toUpperCase() === "Y" ? "Y" : "N";
    },
  }),
  columnHelper.display({
    id: "gst_rate",
    header: "RATE (%)",
    cell: (info) => {
      const rate = getGstRate(info.row.original);
      return rate > 0 ? `${rate}%` : "-";
    },
  }),
  columnHelper.accessor("subtotal2", {
    id: "subtotal2",
    header: "TAXABLE VALUE",
    cell: (info) => Number(info.getValue() || 0).toFixed(2),
  }),
  columnHelper.accessor("cgstamount", {
    id: "cgstamount",
    header: "CENTRAL TAX",
    cell: (info) => Number(info.getValue() || 0).toFixed(2),
  }),
  columnHelper.accessor("sgstamount", {
    id: "sgstamount",
    header: "STATE/UT TAX",
    cell: (info) => Number(info.getValue() || 0).toFixed(2),
  }),
  columnHelper.display({
    id: "cessamount",
    header: "CESS",
    cell: (info) => Number(info.row.original.cessamount || 0).toFixed(2),
  }),
  columnHelper.accessor("roundoff", {
    id: "roundoff",
    header: "ROUND OFF",
    cell: (info) => Number(info.getValue() || 0).toFixed(2),
  }),
];
