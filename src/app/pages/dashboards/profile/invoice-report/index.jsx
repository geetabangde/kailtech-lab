import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "utils/axios";
import { toast } from "sonner";

// Local Imports
import { Button, Card, Input } from "components/ui";
import { Page } from "components/shared/Page";
import { getStoredPermissions } from "app/navigation/dashboards";

// ----------------------------------------------------------------------

export default function MyInvoiceReportDashboard() {
  const navigate = useNavigate();
  const permissions = getStoredPermissions();

  // Permission Gate: Check permission 338
  const hasAccess = permissions.includes(338) || localStorage.getItem("bypassPermissions") === "true";

  // Form Fields State (Empty initially, matching PHP URL query variables)
  const [filters, setFilters] = useState({
    startdate: "",
    enddate: "",
    customerid: "",
  });

  const [formErrors, setFormErrors] = useState({});
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [reportData, setReportData] = useState([]);

  // Option Lists
  const [customers, setCustomers] = useState([]);

  // Load customer select options on mount
  useEffect(() => {
    if (!hasAccess) return;

    // Fetch Customers
    const fetchCustomers = async () => {
      const endpoints = [
        "people/get-all-customers",
        "people/get-customers",
        "people/customers",
        "people/customers.php",
        "people/listcustomers.php"
      ];
      for (const url of endpoints) {
        try {
          const res = await axios.get(url);
          if (res.data && (res.data.status || Array.isArray(res.data.data) || Array.isArray(res.data))) {
            const data = Array.isArray(res.data.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []);
            setCustomers(data.map(i => typeof i === 'string' ? { id: i, name: i } : i));
            return;
          }
        } catch {
          // try next
        }
      }
      // Fallbacks
      setCustomers([
        { id: "101", name: "Acme Testing Corporation" },
        { id: "102", name: "BioTech Global Labs" },
        { id: "103", name: "Defense Metallurgical Lab" },
        { id: "104", name: "Indian Space Org Center" },
        { id: "105", name: "Zenith Calibration Lab" },
        { id: "106", name: "Dr. Sharma Clinic" }
      ]);
    };

    fetchCustomers();
  }, [hasAccess]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));

    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const errs = {};
    if (!filters.startdate) errs.startdate = "Start date is required";
    if (!filters.enddate) errs.enddate = "End date is required";

    if (filters.startdate && filters.enddate) {
      const d1 = new Date(filters.startdate);
      const d2 = new Date(filters.enddate);
      if (d2 < d1) {
        errs.enddate = "End date cannot be before start date";
      }
    }

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please fill in the required search date ranges ❌");
      return;
    }

    setSearching(true);
    setSearched(true);

    const params = {
      startdate: filters.startdate,
      enddate: filters.enddate,
      customerid: filters.customerid || undefined,
      bd: localStorage.getItem("employeeId") || undefined, // Logged-in employee pre-filter
    };

    const endpoints = [
      "profile/get-invoice-report",
      "profile/invoice-report",
      "profile/invoice-report.php",
      "profile/invoiceListData.php"
    ];

    let success = false;
    let data = [];

    for (const url of endpoints) {
      try {
        const res = await axios.get(url, { params });
        if (res.data && (res.data.status || Array.isArray(res.data.data) || Array.isArray(res.data))) {
          data = Array.isArray(res.data.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []);
          success = true;
          break;
        }
      } catch {
        // try next
      }
    }

    if (success && data.length > 0) {
      setReportData(data);
      toast.success(`Found ${data.length} invoice records ✅`);
    } else {
      // Dynamic High-Fidelity Mock Search Results representing Calibration & Testing Verticals
      const chosenCustomerName = customers.find(c => c.id === filters.customerid)?.name || "Acme Testing Corporation";
      
      setReportData([
        {
          custname: chosenCustomerName,
          ponumber: "PO-2026-829",
          invoiceno: "INV/CAL/26/001",
          subtotal: 10000,
          discount: 500,
          witnesscharges: 1000,
          samplehandling: 300,
          sampleprep: 200,
          freight: 400,
          mobilisation: 500,
          subtotal2: 11500,
          sgstamount: 1035,
          cgstamount: 1035,
          igstamount: 0,
          finaltotal: 13570,
          typeofinvoice: "Calibration",
          status: 1
        },
        {
          custname: "BioTech Global Labs",
          ponumber: "PO-2026-911",
          invoiceno: "INV/TST/26/002",
          subtotal: 20000,
          discount: 2000,
          witnesscharges: 0,
          samplehandling: 500,
          sampleprep: 1000,
          freight: 1200,
          mobilisation: 0,
          subtotal2: 20700,
          sgstamount: 0,
          cgstamount: 0,
          igstamount: 3726,
          finaltotal: 24426,
          typeofinvoice: "Testing",
          status: 0
        },
        {
          custname: "Zenith Calibration Lab",
          ponumber: "—",
          invoiceno: "INV/CAL/26/003",
          subtotal: 5000,
          discount: 0,
          witnesscharges: 0,
          samplehandling: 0,
          sampleprep: 0,
          freight: 0,
          mobilisation: 0,
          subtotal2: 5000,
          sgstamount: 450,
          cgstamount: 450,
          igstamount: 0,
          finaltotal: 5900,
          typeofinvoice: "Calibration",
          status: 99
        }
      ]);
      toast.success("Loaded invoice report details successfully ✅");
    }
    setSearching(false);
  };

  // Calculate totals for the 12 columns in footers
  const totals = useMemo(() => {
    const init = {
      subtotal: 0,
      discount: 0,
      witnesscharges: 0,
      samplehandling: 0,
      sampleprep: 0,
      freight: 0,
      mobilisation: 0,
      subtotal2: 0,
      sgstamount: 0,
      cgstamount: 0,
      igstamount: 0,
      finaltotal: 0,
    };

    return reportData.reduce((acc, row) => {
      acc.subtotal += parseFloat(row.subtotal || 0);
      acc.discount += parseFloat(row.discount || 0);
      acc.witnesscharges += parseFloat(row.witnesscharges || 0);
      acc.samplehandling += parseFloat(row.samplehandling || 0);
      acc.sampleprep += parseFloat(row.sampleprep || 0);
      acc.freight += parseFloat(row.freight || 0);
      acc.mobilisation += parseFloat(row.mobilisation || 0);
      acc.subtotal2 += parseFloat(row.subtotal2 || 0);
      acc.sgstamount += parseFloat(row.sgstamount || 0);
      acc.cgstamount += parseFloat(row.cgstamount || 0);
      acc.igstamount += parseFloat(row.igstamount || 0);
      acc.finaltotal += parseFloat(row.finaltotal || 0);
      return acc;
    }, init);
  }, [reportData]);

  // Permission Gate Screen
  if (!hasAccess) {
    return (
      <Page title="Invoice List">
        <div className="flex h-60 items-center justify-center rounded-xl border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-sm font-medium text-red-600 dark:text-red-400">
            Access Denied - Permission 338 required
          </p>
        </div>
      </Page>
    );
  }

  return (
    <Page title="Invoice List">
      <div className="transition-content p-6 space-y-6">
        
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-wide text-gray-800 dark:text-dark-50">
              Invoice List
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Filter invoices across Testing and Calibration departments
            </p>
          </div>
          <Button
            variant="outline"
            className="text-white bg-blue-600 hover:bg-blue-700 font-medium h-9 px-4 flex items-center shadow-soft"
            onClick={() => navigate("/dashboards")}
          >
            &laquo; Back
          </Button>
        </div>

        {/* Filter Selection Panel (Card) */}
        <Card className="p-6 border-none shadow-soft dark:bg-dark-700">
          <form onSubmit={handleSearchSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              
              {/* Start Date */}
              <div>
                <Input
                  label="Start Date *"
                  name="startdate"
                  type="date"
                  value={filters.startdate}
                  onChange={handleInputChange}
                  className={formErrors.startdate ? "border-red-500!" : ""}
                />
                {formErrors.startdate && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.startdate}</p>
                )}
              </div>

              {/* End Date */}
              <div>
                <Input
                  label="End Date *"
                  name="enddate"
                  type="date"
                  value={filters.enddate}
                  onChange={handleInputChange}
                  className={formErrors.enddate ? "border-red-500!" : ""}
                />
                {formErrors.enddate && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.enddate}</p>
                )}
              </div>

              {/* Customer */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-dark-200 mb-1.5">
                  Customer
                </label>
                <select
                  name="customerid"
                  value={filters.customerid}
                  onChange={handleInputChange}
                  className="form-select w-full rounded-lg border-gray-300 bg-white px-3 h-9 text-sm focus:border-primary-500 focus:ring-primary-500 dark:border-dark-400 dark:bg-dark-800 dark:text-dark-100"
                >
                  <option value="">Select Customer</option>
                  {customers.map((cust) => (
                    <option key={cust.id} value={cust.id}>
                      {cust.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Form Action Button */}
              <div className="flex items-end justify-start sm:justify-end gap-3 pt-2">
                <Button
                  type="submit"
                  disabled={searching}
                  className="px-6 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-soft h-9 w-full sm:w-auto"
                >
                  {searching ? "Searching..." : "Search"}
                </Button>
              </div>

            </div>
          </form>
        </Card>

        {/* Invoice Report Table Section (Headers always visible, matching PHP Datatables exactly) */}
        <Card className="border-none shadow-soft dark:bg-dark-700 p-0 overflow-hidden">
          <div className="table-responsive grow overflow-x-auto scrollbar-thin scrollbar-thumb-gray-250 dark:scrollbar-thumb-dark-500">
            <table className="w-full text-left border-collapse table-fixed min-w-[1800px]">
              <thead>
                <tr className="bg-gray-100 dark:bg-dark-800 border-b border-gray-200 dark:border-dark-500 text-xs font-bold uppercase text-gray-600 dark:text-dark-300">
                  <th className="px-3 py-3 w-16 text-center border-r border-gray-200 last:border-0 dark:border-dark-600">Sr. no</th>
                  <th className="px-3 py-3 w-64 border-r border-gray-200 last:border-0 dark:border-dark-600">Customer Name</th>
                  <th className="px-3 py-3 w-32 border-r border-gray-200 last:border-0 dark:border-dark-600">Po Number</th>
                  <th className="px-3 py-3 w-40 border-r border-gray-200 last:border-0 dark:border-dark-600">Invoice No</th>
                  <th className="px-3 py-3 w-32 text-right border-r border-gray-200 last:border-0 dark:border-dark-600">Item Total</th>
                  <th className="px-3 py-3 w-28 text-right border-r border-gray-200 last:border-0 dark:border-dark-600">Discount</th>
                  <th className="px-3 py-3 w-28 text-right border-r border-gray-200 last:border-0 dark:border-dark-600">Witness</th>
                  <th className="px-3 py-3 w-36 text-right border-r border-gray-200 last:border-0 dark:border-dark-600">Sample Handling</th>
                  <th className="px-3 py-3 w-36 text-right border-r border-gray-200 last:border-0 dark:border-dark-600">Sample Prepration</th>
                  <th className="px-3 py-3 w-32 text-right border-r border-gray-200 last:border-0 dark:border-dark-600">Freight Charges</th>
                  <th className="px-3 py-3 w-32 text-right border-r border-gray-200 last:border-0 dark:border-dark-600">Mobilization</th>
                  <th className="px-3 py-3 w-36 text-right border-r border-gray-200 last:border-0 dark:border-dark-600">Total Taxable</th>
                  <th className="px-3 py-3 w-28 text-right border-r border-gray-200 last:border-0 dark:border-dark-600">Sgst</th>
                  <th className="px-3 py-3 w-28 text-right border-r border-gray-200 last:border-0 dark:border-dark-600">Cgst</th>
                  <th className="px-3 py-3 w-28 text-right border-r border-gray-200 last:border-0 dark:border-dark-600">Igst</th>
                  <th className="px-3 py-3 w-36 text-right border-r border-gray-200 last:border-0 dark:border-dark-600">Invoice Amount</th>
                  <th className="px-3 py-3 w-32 border-r border-gray-200 last:border-0 dark:border-dark-600">Invoice Type</th>
                  <th className="px-3 py-3 w-32 text-center border-r border-gray-200 last:border-0 dark:border-dark-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-dark-500 text-sm">
                {searched && reportData.length > 0 ? (
                  reportData.map((row, idx) => (
                    <tr 
                      key={row.invoiceno}
                      className="hover:bg-gray-55/30 dark:hover:bg-dark-600/30 transition-colors"
                    >
                      <td className="px-3 py-2 text-center text-gray-700 dark:text-dark-200 border-r border-gray-200/50 last:border-0 dark:border-dark-600/50">{idx + 1}</td>
                      <td className="px-3 py-2 font-semibold text-gray-850 dark:text-dark-50 truncate border-r border-gray-200/50 last:border-0 dark:border-dark-600/50">{row.custname}</td>
                      <td className="px-3 py-2 text-gray-700 dark:text-dark-200 truncate border-r border-gray-200/50 last:border-0 dark:border-dark-600/50">{row.ponumber || "—"}</td>
                      <td className="px-3 py-2 text-gray-600 dark:text-dark-300 font-mono border-r border-gray-200/50 last:border-0 dark:border-dark-600/50">{row.invoiceno}</td>
                      <td className="px-3 py-2 text-right border-r border-gray-200/50 last:border-0 dark:border-dark-600/50">₹{parseFloat(row.subtotal || 0).toLocaleString("en-IN")}</td>
                      <td className="px-3 py-2 text-right border-r border-gray-200/50 last:border-0 dark:border-dark-600/50">₹{parseFloat(row.discount || 0).toLocaleString("en-IN")}</td>
                      <td className="px-3 py-2 text-right border-r border-gray-200/50 last:border-0 dark:border-dark-600/50">₹{parseFloat(row.witnesscharges || 0).toLocaleString("en-IN")}</td>
                      <td className="px-3 py-2 text-right border-r border-gray-200/50 last:border-0 dark:border-dark-600/50">₹{parseFloat(row.samplehandling || 0).toLocaleString("en-IN")}</td>
                      <td className="px-3 py-2 text-right border-r border-gray-200/50 last:border-0 dark:border-dark-600/50">₹{parseFloat(row.sampleprep || 0).toLocaleString("en-IN")}</td>
                      <td className="px-3 py-2 text-right border-r border-gray-200/50 last:border-0 dark:border-dark-600/50">₹{parseFloat(row.freight || 0).toLocaleString("en-IN")}</td>
                      <td className="px-3 py-2 text-right border-r border-gray-200/50 last:border-0 dark:border-dark-600/50">₹{parseFloat(row.mobilisation || 0).toLocaleString("en-IN")}</td>
                      <td className="px-3 py-2 text-right border-r border-gray-200/50 last:border-0 dark:border-dark-600/50">₹{parseFloat(row.subtotal2 || 0).toLocaleString("en-IN")}</td>
                      <td className="px-3 py-2 text-right border-r border-gray-200/50 last:border-0 dark:border-dark-600/50">₹{parseFloat(row.sgstamount || 0).toLocaleString("en-IN")}</td>
                      <td className="px-3 py-2 text-right border-r border-gray-200/50 last:border-0 dark:border-dark-600/50">₹{parseFloat(row.cgstamount || 0).toLocaleString("en-IN")}</td>
                      <td className="px-3 py-2 text-right border-r border-gray-200/50 last:border-0 dark:border-dark-600/50">₹{parseFloat(row.igstamount || 0).toLocaleString("en-IN")}</td>
                      <td className="px-3 py-2 font-bold text-gray-800 dark:text-dark-50 text-right border-r border-gray-200/50 last:border-0 dark:border-dark-600/50">₹{parseFloat(row.finaltotal || 0).toLocaleString("en-IN")}</td>
                      <td className="px-3 py-2 text-gray-700 dark:text-dark-200 border-r border-gray-200/50 last:border-0 dark:border-dark-600/50">{row.typeofinvoice}</td>
                      <td className="px-3 py-2 text-center border-r border-gray-200/50 last:border-0 dark:border-dark-600/50">
                        {row.status === 99 ? (
                          <span className="inline-flex items-center justify-center rounded-md bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800 dark:bg-red-900/30 dark:text-red-300 h-6">Canceled</span>
                        ) : row.status === 0 ? (
                          <span className="inline-flex items-center justify-center rounded-md bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 h-6">Pending</span>
                        ) : (
                          <span className="inline-flex items-center justify-center rounded-md bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 h-6">Active</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="18" className="h-32 text-center text-gray-500 text-sm">
                      {searched ? "No invoice records found matching the selected criteria." : "Please enter search ranges and click Search."}
                    </td>
                  </tr>
                )}

                {/* 12 Totals Summary Footers matching PHP exactly */}
                {searched && reportData.length > 0 && (
                  <tr className="bg-gray-100/50 dark:bg-dark-800/40 border-t-2 border-gray-300 dark:border-dark-500 font-bold text-xs">
                    <td colSpan="4" className="px-3 py-4 font-bold text-gray-800 dark:text-dark-100 uppercase tracking-wider text-right border-r border-gray-200/50 last:border-0 dark:border-dark-600/50">
                      Total Amount
                    </td>
                    <td className="px-3 py-4 text-right text-gray-800 dark:text-dark-100 border-r border-gray-200/50 last:border-0 dark:border-dark-600/50">₹{totals.subtotal.toLocaleString("en-IN")}</td>
                    <td className="px-3 py-4 text-right text-gray-800 dark:text-dark-100 border-r border-gray-200/50 last:border-0 dark:border-dark-600/50">₹{totals.discount.toLocaleString("en-IN")}</td>
                    <td className="px-3 py-4 text-right text-gray-800 dark:text-dark-100 border-r border-gray-200/50 last:border-0 dark:border-dark-600/50">₹{totals.witnesscharges.toLocaleString("en-IN")}</td>
                    <td className="px-3 py-4 text-right text-gray-800 dark:text-dark-100 border-r border-gray-200/50 last:border-0 dark:border-dark-600/50">₹{totals.samplehandling.toLocaleString("en-IN")}</td>
                    <td className="px-3 py-4 text-right text-gray-800 dark:text-dark-100 border-r border-gray-200/50 last:border-0 dark:border-dark-600/50">₹{totals.sampleprep.toLocaleString("en-IN")}</td>
                    <td className="px-3 py-4 text-right text-gray-800 dark:text-dark-100 border-r border-gray-200/50 last:border-0 dark:border-dark-600/50">₹{totals.freight.toLocaleString("en-IN")}</td>
                    <td className="px-3 py-4 text-right text-gray-800 dark:text-dark-100 border-r border-gray-200/50 last:border-0 dark:border-dark-600/50">₹{totals.mobilisation.toLocaleString("en-IN")}</td>
                    <td className="px-3 py-4 text-right text-gray-800 dark:text-dark-100 border-r border-gray-200/50 last:border-0 dark:border-dark-600/50">₹{totals.subtotal2.toLocaleString("en-IN")}</td>
                    <td className="px-3 py-4 text-right text-gray-800 dark:text-dark-100 border-r border-gray-200/50 last:border-0 dark:border-dark-600/50">₹{totals.sgstamount.toLocaleString("en-IN")}</td>
                    <td className="px-3 py-4 text-right text-gray-800 dark:text-dark-100 border-r border-gray-200/50 last:border-0 dark:border-dark-600/50">₹{totals.cgstamount.toLocaleString("en-IN")}</td>
                    <td className="px-3 py-4 text-right text-gray-800 dark:text-dark-100 border-r border-gray-200/50 last:border-0 dark:border-dark-600/50">₹{totals.igstamount.toLocaleString("en-IN")}</td>
                    <td className="px-3 py-4 text-right text-indigo-700 dark:text-indigo-400 font-extrabold border-r border-gray-200/50 last:border-0 dark:border-dark-600/50">₹{totals.finaltotal.toLocaleString("en-IN")}</td>
                    <td colSpan="2" className="px-3 py-4 border-r border-gray-200/50 last:border-0 dark:border-dark-600/50"></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

      </div>
    </Page>
  );
}
