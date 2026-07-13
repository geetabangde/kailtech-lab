// Import Dependencies
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "utils/axios";
import { toast } from "sonner";

// Local Imports
import { Page } from "components/shared/Page";

// ----------------------------------------------------------------------
// PHP: $po_id = $_GET['hakuna'];
// PHP: Complex PDF generation with DomPDF

export default function ExportPoToPdf() {
  const [searchParams] = useSearchParams();
  const poId = searchParams.get("hakuna");
  const [loading, setLoading] = useState(true);
  const [pdfData, setPdfData] = useState(null);
  const [error, setError] = useState(null);

  // PHP: Fetch all data needed for PDF generation
  useEffect(() => {
    const fetchPdfData = async () => {
      if (!poId) {
        setError("Purchase Order ID is required");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch purchase order details from a single consolidated endpoint
        const response = await axios.get(`/inventory/view-purchase-order/${poId}`);
        if (!response.data.status || !response.data.data) {
          throw new Error(response.data.message || "Purchase Order not found");
        }

        const { purchase_order: purchaseOrderData, supplier_details: customerData, items = [], summary = {} } = response.data.data;

        // Fetch company data for branding
        let companyData = {};
        try {
          const companyResponse = await axios.get("get-company-info");
          if (companyResponse.data.status && companyResponse.data.data) {
            const apiData = companyResponse.data.data;
            companyData = {
              name: apiData.company.name,
              logo: apiData.branding.logo,
              gstno: apiData.company.gst_no,
              panno: apiData.company.pan_no,
              cin_no: apiData.company.cin_no,
              address: apiData.address,
              contact: apiData.contact
            };
          }
        } catch (companyErr) {
          console.warn("Failed to fetch company info:", companyErr);
        }

        // Calculate tax combinations matching legacy calculations
        const combineTax = {};
        items.forEach(item => {
          const taxRate = item.tax_rate || "0";
          const taxRateString = typeof taxRate === "string" ? taxRate : `${taxRate}%`;
          const taxRateFiltered = taxRateString.replace(/[\s%]/g, "");

          // taxable amount is either directly available or derived
          const price = parseFloat(item.price || item.list_price || 0);
          const quantity = parseFloat(item.quantity || 0);
          const taxableAmount = parseFloat(item.taxableamount || item.amount || (price * quantity) || 0);

          const taxAmount = (taxableAmount * parseFloat(taxRateFiltered || 0)) / 100;

          if (combineTax[taxRateString]) {
            combineTax[taxRateString] += taxAmount;
          } else {
            combineTax[taxRateString] = taxAmount;
          }
        });

        // Add tax on additional charges (GST 18%)
        const miscCharges =
          (parseFloat(purchaseOrderData.packaginchrgs || purchaseOrderData.packing_charges || summary.packing_charges || 0) +
            parseFloat(purchaseOrderData.freightchrgs || purchaseOrderData.freight_charges || summary.freight_charges || 0) +
            parseFloat(purchaseOrderData.insurancechrgs || purchaseOrderData.insurance_charges || summary.insurance_charges || 0) +
            parseFloat(purchaseOrderData.calibrationchrgs || purchaseOrderData.calibration_charges || summary.calibration_charges || 0) +
            parseFloat(purchaseOrderData.trainingchrgs || purchaseOrderData.training_charges || summary.training_charges || 0));

        const gstOnCharges = (miscCharges * 18) / 100;
        if (combineTax["18%"]) {
          combineTax["18%"] += gstOnCharges;
        } else {
          combineTax["18%"] = gstOnCharges;
        }

        // Determine GST state logic
        const companyGstCode = companyData.gstno ? companyData.gstno.substring(0, 2) : "";
        const customerGstCode = customerData.gst_number || customerData.gstno || "";
        const customerGstStateCode = customerGstCode.substring(0, 2);

        // Same state logic if customer is in Madhya Pradesh (23) or matches company state code
        const stateCode = customerData.gst_state_code || customerData.statecode || customerGstStateCode || "";
        const isSameState = stateCode === "23" || (companyGstCode && stateCode === companyGstCode);

        // Fetch state name if missing
        let fetchedStateName = customerData.state || customerData.statename || "";
        try {
          if (!fetchedStateName && stateCode) {
            const stateResponse = await axios.get("/people/get-state");
            if (stateResponse.data && stateResponse.data.data) {
              const matchedState = stateResponse.data.data.find(s => parseInt(s.gst_code) === parseInt(stateCode) || parseInt(s.id) === parseInt(stateCode));
              if (matchedState) {
                fetchedStateName = matchedState.state;
              }
            }
          }
        } catch (err) {
          console.warn("Failed to fetch states:", err);
        }

        setPdfData({
          purchaseOrder: {
            ...purchaseOrderData,
            discount: purchaseOrderData.discount || summary.discount,
            totalafterdisc: purchaseOrderData.totalafterdisc || summary.total_after_discount,
            packaginchrgs: purchaseOrderData.packaginchrgs || purchaseOrderData.packing_charges || summary.packing_charges,
            freightchrgs: purchaseOrderData.freightchrgs || purchaseOrderData.freight_charges || summary.freight_charges,
            insurancechrgs: purchaseOrderData.insurancechrgs || purchaseOrderData.insurance_charges || summary.insurance_charges,
            calibrationchrgs: purchaseOrderData.calibrationchrgs || purchaseOrderData.calibration_charges || summary.calibration_charges,
            trainingchrgs: purchaseOrderData.trainingchrgs || purchaseOrderData.training_charges || summary.training_charges,
            customdutychrgs: purchaseOrderData.customdutychrgs || purchaseOrderData.custom_duty_charges || summary.custom_duty_charges,
            total_amount: purchaseOrderData.total_amount || summary.total_invoice_amount,
            roundoff: purchaseOrderData.roundoff || summary.roundoff,
            finaltotal: purchaseOrderData.finaltotal || summary.final_total
          },
          customer: {
            ...customerData,
            gstno: customerData.gst_number || customerData.gstno,
            panno: customerData.pan_no,
            address: customerData.address || customerData.full_address,
            stateName: fetchedStateName
          },
          items: items,
          company: companyData,
          combineTax,
          isSameState,
          stateCode: stateCode ? String(stateCode).padStart(2, "0") : "",
          miscCharges,
          gstOnCharges
        });

      } catch (err) {
        console.error("Error fetching PDF data:", err);
        setError(err.message || "Failed to load PDF data");
      } finally {
        setLoading(false);
      }
    };

    fetchPdfData();
  }, [poId]);

  // PHP: Format date function
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB'); // dd/mm/yyyy format
  };

  // PHP: convert_number_to_words function (simplified)
  const numberToWords = (num) => {
    if (num === 0) return "zero";
    const ones = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
    const teens = ["ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
    const tens = ["", "ten", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
    const thousands = Math.floor(num / 1000);
    const hundreds = Math.floor((num % 1000) / 100);
    const remainder = num % 100;

    let words = "";

    if (thousands > 0) {
      words += ones[thousands] + " thousand ";
    }

    if (hundreds > 0) {
      words += ones[hundreds] + " hundred ";
    }

    if (remainder > 0) {
      if (remainder < 10) {
        words += ones[remainder];
      } else if (remainder < 20) {
        words += teens[remainder - 10];
      } else {
        words += tens[Math.floor(remainder / 10)];
        if (remainder % 10 > 0) {
          words += " " + ones[remainder % 10];
        }
      }
    }

    return words.trim();
  };

  // Generate HTML content for PDF
  const generatePdfHtml = () => {
    if (!pdfData) return "";

    const { purchaseOrder, customer, items, company, combineTax, isSameState, stateCode } = pdfData;

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        <style>
          body {
            margin: 0px !important;
            padding: 0px !important;
            font-size: 11px;
            font-family: Arial, sans-serif;
          }
          
          .table {
            width: 100%;
            border-collapse: collapse;
          }
          
          .table-borderless > tbody > tr > td,
          .table-borderless > tbody > tr > th,
          .table-borderless > tfoot > tr > td,
          .table-borderless > tfoot > tr > th,
          .table-borderless > thead > tr > td,
          .table-borderless > thead > tr > th {
            border: none;
            vertical-align: top;
          }
          
          table.table-bordered {
            border: 1px solid black;
            margin-top: 20px;
            border-collapse: collapse;
          }
          
          table.table-bordered > thead > tr > th {
            border: 1px solid black;
            vertical-align: top;
          }
          
          table.table-bordered > tbody > tr > td {
            border: 1px solid black;
            vertical-align: top;
          }
          
          .text-right {
            text-align: right;
          }
          
          .text-left {
            text-align: left;
          }
          
          .text-center {
            text-align: center;
          }
          
          ${purchaseOrder.status === -1 ? `
            body {
              background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' version='1.1' width='200' height='200' viewBox='0 0 200 200'><text x='50%' y='50%' font-size='40' fill='rgba(200,200,200,0.5)' text-anchor='middle' transform='rotate(-45 100 100)'>DRAFT</text></svg>");
              background-repeat: no-repeat;
              background-position: center;
            }
          ` : ""}
        </style>
      </head>
      <body>
        <!-- Company Header -->
        <div style="display: flex; flex-direction: column; align-items: center; margin-bottom: 8px; gap: 4px;">
          <div style="display: flex; align-items: flex-start; gap: 12px; width: 100%;">
            ${company.logo ? `<img src="${company.logo}" alt="Logo" style="height: 60px; width: auto;" />` : ''}
            <div style="flex: 1; text-align: right;">
              <p style="font-family: monospace; font-size: 10px; font-style: italic; color: #555; margin: 0;">
                NABL Accredited as per IS/ISO/IEC 17025 (Certificate Nos. TC-7832 &amp; CC-2348),<br>
                BIS Recognized &amp; ISO 9001 Certified Test &amp; Calibration Laboratory
              </p>
            </div>
          </div>
          <div style="font-size: 20px; font-weight: bold; color: navy; text-align: left; margin-top: 4px;">
            ${company.name}
          </div>
        </div>

        <div style="text-align: center; margin-bottom: 8px; margin-top: 20px;">
          <div style="font-size: 14px; font-weight: bold; text-transform: uppercase;">
            <b>Purchase Order</b>
          </div>
        </div>

        <!-- Customer Information -->
        <table class="table table-bordered">
          <tr>
            <td colspan="2" style="width: 70%">
              <b>Customer:<br></b>
              <div style="float: left;width:13%"><b>M / s . :</b></div>
              <div style="float: left;width:87%">
                <b>${customer.company || ''}</b><br>
                ${customer.address || ''}<br>
                
                <table class="table table-borderless">
                  <tr>
                    <td style="width:50%;">
                      <b>State name : </b>${customer.stateName || customer.state || ''}<br>
                      <b>GSTIN/UIN : </b>${customer.gstno || ''}
                    </td>
                    <td style="width:50%;">
                      <b>State code : </b>${stateCode}<br>
                      <b>PAN: </b>${company.panno || ''}
                    </td>
                  </tr>
                </table>
              </div>
              <div style="clear:both;"></div>
              Kind Attn. ${purchaseOrder.sname || customer.contact_person || ''}
            </td>
            <td style="width: 30%;">
              <b>Purchase Order No. : </b> ${purchaseOrder.po_number || ''}<br>
              <b>Date : </b>${formatDate(purchaseOrder.date)}<br>
              <b>Quotation No./ Date : </b> ${purchaseOrder.quotationno || ''} ${formatDate(purchaseOrder.quotationdate)}<br>
            </td>
          </tr>
        </table>

        <!-- Items Table -->
        <table class="table table-condensed table-bordered table-striped">
          <thead>
            <tr>
              <th class="text-center" style="width:10%">S. No.</th>
              <th class="text-center" style="width:50%"><b>Particular</b></th>
              <th class="text-center" style="width:50%"><b>Specification</b></th>
              <th class="text-center"><b>${purchaseOrder.ordertype === "PO" ? "HSN Code" : "SAC Code"}</b></th>
              <th class="text-center"><b>Unit (QTY)</b></th>
              <th class="text-center"><b>Amount</b></th>
            </tr>
          </thead>
          <tbody>
            ${items.map((item, index) => `
              <tr>
                <td class="text-center">${index + 1}</td>
                <td>
                  ${purchaseOrder.ordertype === "PO"
        ? (item.material_name || item.category_name || item.itemname || '')
        : (item.itemname || item.material_name || '')}
                  ${item.specification && item.specification.trim().toUpperCase() !== "NA" ? "<br>" + item.specification : ""}
                </td>
                <td class="text-center">${item.specification || ''}</td>
                <td class="text-center">${item.hsn_code || ''}</td>
                <td class="text-center">
                  ${purchaseOrder.ordertype === "PO"
        ? `${item.quantity || ''} ${item.unit_name || item.unit || ''}`
        : `${item.quantity || ''} No's`}
                </td>
                <td class="text-right" style="padding-right: 8px;">
                  ${parseFloat(item.price || item.list_price || 0).toFixed(2)}
                </td>
              </tr>
            `).join('')}
          </tbody>
          
          <!-- Charges and Taxes -->
          ${purchaseOrder.discount ? `
            <tr>
              <td colspan="2">Discount (${purchaseOrder.discount}%)</td>
              <td colspan="4" class="text-right">${parseFloat(purchaseOrder.discount || 0).toFixed(2)}</td>
            </tr>
          ` : ''}
          
          ${purchaseOrder.totalafterdisc ? `
            <tr>
              <td colspan="2">Total After Discount Value</td>
              <td colspan="4" class="text-right">${parseFloat(purchaseOrder.totalafterdisc || 0).toFixed(2)}</td>
            </tr>
          ` : ''}
          
          ${purchaseOrder.packaginchrgs ? `
            <tr>
              <td colspan="2">Packing & Forwarding Charges</td>
              <td colspan="4" class="text-right">${parseFloat(purchaseOrder.packaginchrgs || 0).toFixed(2)}</td>
            </tr>
          ` : ''}
          
          ${purchaseOrder.freightchrgs ? `
            <tr>
              <td colspan="2">Freight Charges</td>
              <td colspan="4" class="text-right">${parseFloat(purchaseOrder.freightchrgs || 0).toFixed(2)}</td>
            </tr>
          ` : ''}
          
          ${purchaseOrder.insurancechrgs ? `
            <tr>
              <td colspan="2">Insurance charges</td>
              <td colspan="4" class="text-right">${parseFloat(purchaseOrder.insurancechrgs || 0).toFixed(2)}</td>
            </tr>
          ` : ''}
          
          ${purchaseOrder.calibrationchrgs ? `
            <tr>
              <td colspan="2">Calibration Certificate Charges</td>
              <td colspan="4" class="text-right">${parseFloat(purchaseOrder.calibrationchrgs || 0).toFixed(2)}</td>
            </tr>
          ` : ''}
          
          <tr>
            <td colspan="2">Installation,Demonstration&Training Charges</td>
            <td colspan="4" class="text-right">${parseFloat(purchaseOrder.trainingchrgs || 0).toFixed(2)}</td>
          </tr>
          
          ${purchaseOrder.customdutychrgs ? `
            <tr>
              <td colspan="2">Import /Custom Duty Charges</td>
              <td colspan="4" class="text-right">${parseFloat(purchaseOrder.customdutychrgs || 0).toFixed(2)}</td>
            </tr>
          ` : ''}
          
          <!-- Tax Breakdown -->
          ${Object.entries(combineTax).map(([taxRate, taxAmount]) => {
          if (isSameState) {
            const cgstAmount = taxAmount / 2;
            const sgstAmount = taxAmount / 2;
            const rate = taxRate.replace(/[\s%]/g, "") / 2;
            return `
                <tr>
                  <td colspan="2"><strong>CGST ${rate}%</strong></td>
                  <td colspan="4" class="text-right">${cgstAmount.toFixed(2)}/-</td>
                </tr>
                <tr>
                  <td colspan="2"><strong>SGST ${rate}%</strong></td>
                  <td colspan="4" class="text-right">${sgstAmount.toFixed(2)}/-</td>
                </tr>
              `;
          } else {
            const rate = taxRate.replace(/[\s%]/g, "");
            return `
                <tr>
                  <td colspan="2"><strong>IGST ${rate}%</strong></td>
                  <td colspan="4" class="text-right">${taxAmount.toFixed(2)}/-</td>
                </tr>
              `;
          }
        }).join('')}
          
          <tr>
            <td colspan="2">Total Charges With tax</td>
            <td colspan="4" class="text-right">${parseFloat(purchaseOrder.total_amount || 0).toFixed(2)}</td>
          </tr>
          
          <tr>
            <td colspan="2">Round off</td>
            <td colspan="4" class="text-right">${parseFloat(purchaseOrder.roundoff || 0).toFixed(2)}</td>
          </tr>
          
          <tr>
            <td colspan="2" style="border-right: 0px transparent;">
              (IN WORDS): Rs. ${numberToWords(Math.round(purchaseOrder.finaltotal || 0)).toUpperCase()} Only
            </td>
            <td colspan="3" style="border-left: 0px transparent;" class="text-right">
              <b>Total Charges</b>
            </td>
            <td class="text-right">${Math.round(parseFloat(purchaseOrder.finaltotal || 0)).toFixed(2)}</td>
          </tr>
          
          <tr>
            <td colspan="2">Warranty</td>
            <td colspan="4" class="text-right">${purchaseOrder.warranty || ''}</td>
          </tr>
          
          <tr>
            <td colspan="2">Delivery Terms</td>
            <td colspan="4" class="text-right">${purchaseOrder.delivery_terms || ''}</td>
          </tr>
          
          <tr>
            <td colspan="2">Payment Terms</td>
            <td colspan="4" class="text-right">${purchaseOrder.payment_terms || ''}</td>
          </tr>
          
          <tr>
            <td colspan="2">Other Details</td>
            <td colspan="4" class="text-right">${purchaseOrder.otherdetails || ''}</td>
          </tr>
          
          <tr>
            <td colspan="2">Jurisdiction</td>
            <td colspan="4" class="text-right">${purchaseOrder.jurisdiction || ''}</td>
          </tr>
          
          <tr>
            <td colspan="2">Billings & Shipping Address</td>
            <td colspan="4" class="text-right">${purchaseOrder.bill_and_consign_to || ''}</td>
          </tr>
          
          <tr>
            <td colspan="2"></td>
            <td colspan="4" class="text-right">GST: ${company.gstno} PAN: ${company.panno}</td>
          </tr>
        </table>

        <!-- Notes -->
        <div style="margin-top: 20px;">
          <div><strong>Note:</strong></div>
          <div>1) Please Mention Our GSTIN No. ${company.gstno} in Invoice.</div>
          <div>2) This Work Order is Being sent to you in duplicate, a copy of Which may please be returned to us duly signed and stamped on each page in token of your acceptance Please Sign &return the Duplicate Copy of the order within three days as a token of your acceptance to the above terms & conditions. PO is deemed accepted for non-receipt of response from consultant within three days.</div>
        </div>

        <!-- Signature -->
        <div style="margin-top: 30px; text-align: right;">
          <div>For ${company.name}</div>
          ${purchaseOrder.status === 1 && purchaseOrder.approved_by ? `
            <div style="margin-top: 10px;">
              <div>Electronically signed by</div>
              <div>${purchaseOrder.approved_by_name || ''}</div>
              ${purchaseOrder.approved_by_designation ? `<div>Designation:${purchaseOrder.approved_by_designation}</div>` : ''}
              <div>Date:${formatDate(purchaseOrder.approved_on)}</div>
            </div>
          ` : ''}
          <div style="margin-top: 20px; text-decoration: underline;">
            Authorised Signatory
          </div>
        </div>

        <!-- Footer Contact Info -->
        <div style="margin-top: 40px; text-align: center; font-size: 11px; font-weight: bold;">
          ${company.address.full_address} Ph. ${company.contact.phone}<br>
          Email : ${company.contact.email}, Web: ${company.contact.website ? company.contact.website.replace('http://', '').replace('https://', '') : ''}, CIN-${company.cin_no}
        </div>
      </body>
      </html>
    `;
  };

  // Generate and download PDF
  const generatePdf = async () => {
    if (!pdfData) return;

    try {
      const htmlContent = generatePdfHtml();

      // Create a new window with the HTML content
      const newWindow = window.open('', '_blank');
      newWindow.document.write(htmlContent);
      newWindow.document.close();

      // Wait for the content to load, then trigger print
      setTimeout(() => {
        newWindow.print();
      }, 1000);

    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF");
    }
  };

  if (loading) {
    return (
      <Page title="Export Purchase Order to PDF">
        <div className="flex h-[60vh] items-center justify-center text-gray-600">
          <svg className="animate-spin h-6 w-6 mr-2 text-blue-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z"></path>
          </svg>
          Loading Purchase Order Data...
        </div>
      </Page>
    );
  }

  if (error) {
    return (
      <Page title="Export Purchase Order to PDF">
        <div className="flex h-[60vh] items-center justify-center">
          <div className="text-center">
            <div className="text-red-600 mb-4">Error: {error}</div>
            <button
              onClick={() => window.history.back()}
              className="btn btn-primary"
            >
              Go Back
            </button>
          </div>
        </div>
      </Page>
    );
  }

  if (!pdfData) {
    return (
      <Page title="Export Purchase Order to PDF">
        <div className="flex h-[60vh] items-center justify-center text-gray-600">
          No data available
        </div>
      </Page>
    );
  }

  return (
    <Page title="Export Purchase Order to PDF">
      <div className="container mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold mb-6 text-center">
            Purchase Order PDF Preview
          </h1>

          <div className="mb-6 text-center">
            <p className="text-gray-600 mb-4">
              Purchase Order: {pdfData.purchaseOrder.po_number}
            </p>
            <p className="text-gray-600 mb-4">
              Customer: {pdfData.customer.company}
            </p>
            <button
              onClick={generatePdf}
              className="btn btn-primary bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded"
            >
              Generate PDF
            </button>
          </div>

          {/* Preview of the PDF content */}
          <div className="border border-gray-300 rounded p-4 bg-gray-50">
            <h3 className="text-lg font-semibold mb-4">Preview:</h3>
            <div
              dangerouslySetInnerHTML={{ __html: generatePdfHtml() }}
              style={{
                transform: 'scale(0.8)',
                transformOrigin: 'top left',
                width: '125%',
                height: 'auto'
              }}
            />
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => window.history.back()}
              className="btn btn-secondary bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded mr-4"
            >
              Back
            </button>
            <button
              onClick={generatePdf}
              className="btn btn-primary bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded"
            >
              Download PDF
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .container {
          max-width: 1200px;
        }

        .btn {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
          transition: background-color 0.2s;
        }

        .btn:hover {
          opacity: 0.9;
        }

        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          
          .container {
            max-width: none;
            padding: 0;
          }
          
          .bg-white,
          .shadow-lg,
          .rounded-lg,
          .p-6 {
            box-shadow: none;
            border-radius: 0;
            padding: 0;
          }
          
          button {
            display: none;
          }
        }
      `}</style>
    </Page>
  );
}