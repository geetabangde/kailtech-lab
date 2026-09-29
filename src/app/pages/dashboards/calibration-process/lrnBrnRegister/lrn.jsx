import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { Button } from "components/ui";
import Select from 'react-select';
import appLogo from "/images/logo.png";
import axios from "utils/axios";

const LrnBrnRegister = () => {
  const navigate = useNavigate();
  const permissions = JSON.parse(localStorage.getItem("userPermissions") || "[]");

  useEffect(() => {
    if (!permissions.includes(109)) {
      navigate("/dashboards");
    }
  }, [navigate, permissions]);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedReportCustomer, setSelectedReportCustomer] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [registerData, setRegisterData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch customers on component mount
  useEffect(() => {
    const fetchCustomers = async () => {
      setLoadingCustomers(true);
      setErrorMessage('');
      try {
        const token = localStorage.getItem('authToken');

        if (!token) {
          throw new Error('Authentication token not found in local storage');
        }

        const response = await axios.get('/people/get-all-customers', {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        const data = response.data;

        console.log('Customers API Response:', data);

        if (data && Array.isArray(data)) {
          setCustomers(data);
        } else if (data && data.data && Array.isArray(data.data)) {
          setCustomers(data.data);
        } else if (data && data.customers && Array.isArray(data.customers)) {
          setCustomers(data.customers);
        } else {
          throw new Error('Invalid API response format');
        }
      } catch (err) {
        console.error('Error fetching customers:', err);
        setErrorMessage(err.message || 'Failed to load customers. Please try again.');
      } finally {
        setLoadingCustomers(false);
      }
    };

    fetchCustomers();
  }, []);

  // Format date from input (YYYY-MM-DD) for API
  const formatDateForAPI = (dateStr) => {
    if (!dateStr) return '';
    return dateStr;
  };

  // Format date for display (handles YYYY-MM-DD and YYYY-MM-DD HH:mm:ss)
  const formatDateForDisplay = (dateStr) => {
    if (!dateStr || dateStr === '0000-00-00' || dateStr.startsWith('0000-00-00') || dateStr === '-') return '-';
    try {
      const cleanDate = dateStr.split(' ')[0];
      const [year, month, day] = cleanDate.split('-');
      if (year && month && day && year.length === 4) {
        return `${day}/${month}/${year}`;
      }
      return cleanDate;
    } catch {
      return dateStr;
    }
  };

  // Function to get customer ID
  const getCustomerId = (customer) => {
    return customer.id;
  };

  // Function to format customer display name
  const getCustomerDisplayName = (customer) => {
    if (customer.name && customer.pnumber) {
      return `${customer.name} (${customer.pnumber})`;
    } else if (customer.name && customer.phone) {
      return `${customer.name} (${customer.phone})`;
    }
    return customer.name;
  };

  const handleSearch = async () => {
    if (!startDate || !endDate) {
      setErrorMessage('Please select Start Date and End Date');
      alert('Please fill Start Date and End Date before searching.');
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      setErrorMessage('End date must be after start date.');
      alert('End date must be after start date.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setShowResults(false);

    try {
      const token = localStorage.getItem('authToken');

      if (!token) {
        throw new Error('Authentication token not found');
      }

      console.log('Searching with:', {
        startDate: formatDateForAPI(startDate),
        endDate: formatDateForAPI(endDate),
        customerId: selectedCustomer,
        reportCustomerId: selectedReportCustomer
      });

      const queryParams = new URLSearchParams({
        startdate: formatDateForAPI(startDate),
        enddate: formatDateForAPI(endDate),
      });

      if (selectedCustomer) {
        queryParams.set('customerid', selectedCustomer);
      }

      if (selectedReportCustomer) {
        queryParams.set('reportcustomerid', selectedReportCustomer);
      }

      const response = await axios.get(
        `/calibrationprocess/search-lrn-brn-register?${queryParams.toString()}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      console.log('LRN BRN API Response:', response.data);

      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        const sortedData = [...response.data.data].sort((a, b) => b.id - a.id);
        setRegisterData(sortedData);
        setShowResults(true);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      const errMsg = err.message || 'An error occurred while fetching data';
      setErrorMessage(errMsg);
      console.error('API Error:', err);
      alert('Failed to fetch data. Please check your inputs and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!registerData.length) return;

    // Generate CSV format for Excel/spreadsheet compatibility
    const headers = [
      'Sr No',
      'Date',
      'BRN',
      'LRN',
      'Inward No',
      'Party Name',
      'Contact Person',
      'Sample Details',
      'Instrument Name',
      'ID No',
      'Serial No',
      'Quantity',
      'Department',
      'Parameters',
      'Committed Date',
      'Reporting Date',
      'TAT',
      'Remarks',
      'Location',
      'Status',
      'Accreditation'
    ];

    const rows = registerData.map((record, index) => [
      index + 1,
      formatDateForDisplay(record.inwarddate),
      `"${String(record.brn ?? '').replace(/"/g, '""')}"`,
      `"${String(record.lrn ?? '').replace(/"/g, '""')}"`,
      record.inward_id,
      `"${String(record.customername ?? '').replace(/"/g, '""')}"`,
      `"${String(record.concernpersonname ?? '').replace(/"/g, '""')}"`,
      `"${String(record.sample_details ?? '').replace(/"/g, '""')}"`,
      `"${String(record.instrument_name ?? '').replace(/"/g, '""')}"`,
      `"${String(record.idno ?? '').replace(/"/g, '""')}"`,
      `"${String(record.serialno ?? '').replace(/"/g, '""')}"`,
      record.quantity,
      `"${String(record.department ?? '').replace(/"/g, '""')}"`,
      `"${String(record.parameters ?? '').replace(/"/g, '""')}"`,
      formatDateForDisplay(record.committed_date),
      formatDateForDisplay(record.reporting_date),
      `"${String(record.tat ?? '').replace(/"/g, '""')}"`,
      `"${String(record.remarks ?? '').replace(/"/g, '""')}"`,
      `"${String(record.location ?? '').replace(/"/g, '""')}"`,
      record.is_lrn_canceled ? 'LRN Canceled' : 'Active',
      `"${String(record.accreditation ?? '').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lrn_brn_register_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-100" style={{ background: "none" }}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-2">
        <h1 className="text-lg font-medium text-gray-800" style={{ marginLeft: "20px" }}>LRN BRN Register</h1>
      </div>

      <div className="p-6">
        <div className="max-w-7xl mx-auto">

          {/* Search Form */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="grid grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    placeholder="mm/dd/yyyy"
                    title="mm/dd/yyyy"
                    lang="en-US"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Customer (Optional)</label>
                  <Select
                    value={
                      customers
                        .map((c) => ({ value: getCustomerId(c), label: getCustomerDisplayName(c) }))
                        .find((opt) => String(opt.value) === String(selectedCustomer)) || null
                    }
                    onChange={(opt) => setSelectedCustomer(opt ? opt.value : '')}
                    options={customers.map((c) => ({
                      value: getCustomerId(c),
                      label: getCustomerDisplayName(c)
                    }))}
                    isLoading={loadingCustomers}
                    isDisabled={loadingCustomers}
                    isClearable={true}
                    isSearchable={true}
                    placeholder={loadingCustomers ? 'Loading customers...' : 'Select Customer (Optional)'}
                    noOptionsMessage={() =>
                      customers.length === 0 && !loadingCustomers ? 'No customers found' : 'Type to search'
                    }
                    className="w-full text-sm"
                    classNamePrefix="react-select"
                    styles={{
                      control: (base, state) => ({
                        ...base,
                        minHeight: '38px',
                        borderColor: state.isFocused ? '#3b82f6' : '#d1d5db',
                        boxShadow: state.isFocused ? '0 0 0 2px rgba(59, 130, 246, 0.2)' : 'none',
                        '&:hover': {
                          borderColor: '#9ca3af'
                        }
                      }),
                      menu: (base) => ({
                        ...base,
                        zIndex: 9999
                      })
                    }}
                  />
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    placeholder="mm/dd/yyyy"
                    title="mm/dd/yyyy"
                    lang="en-US"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Report Customer (Optional)</label>
                  <Select
                    value={
                      customers
                        .map((c) => ({ value: getCustomerId(c), label: getCustomerDisplayName(c) }))
                        .find((opt) => String(opt.value) === String(selectedReportCustomer)) || null
                    }
                    onChange={(opt) => setSelectedReportCustomer(opt ? opt.value : '')}
                    options={customers.map((c) => ({
                      value: getCustomerId(c),
                      label: getCustomerDisplayName(c)
                    }))}
                    isLoading={loadingCustomers}
                    isDisabled={loadingCustomers}
                    isClearable={true}
                    isSearchable={true}
                    placeholder={loadingCustomers ? 'Loading customers...' : 'Select Report Customer (Optional)'}
                    noOptionsMessage={() =>
                      customers.length === 0 && !loadingCustomers ? 'No customers found' : 'Type to search'
                    }
                    className="w-full text-sm"
                    classNamePrefix="react-select"
                    styles={{
                      control: (base, state) => ({
                        ...base,
                        minHeight: '38px',
                        borderColor: state.isFocused ? '#3b82f6' : '#d1d5db',
                        boxShadow: state.isFocused ? '0 0 0 2px rgba(59, 130, 246, 0.2)' : 'none',
                        '&:hover': {
                          borderColor: '#9ca3af'
                        }
                      }),
                      menu: (base) => ({
                        ...base,
                        zIndex: 9999
                      })
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                {errorMessage}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3 mt-6">
              <Button
                onClick={handleSearch}
                disabled={loading || loadingCustomers}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded text-sm disabled:opacity-50"
              >
                {loading ? 'Searching...' : 'Search'}
              </Button>
              <Button
                onClick={handleExport}
                disabled={!showResults || registerData.length === 0}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded text-sm disabled:opacity-50"
              >
                Export
              </Button>
            </div>
          </div>

          {/* Results Section */}
          {showResults && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {/* Header Section with Logo and Document Info */}
              <div className="grid grid-cols-12 gap-0 border-b border-gray-200">
                {/* Logo Section */}
                <div className="col-span-3 bg-gradient-to-br from-blue-500 to-blue-700 p-6 rounded-tl-lg flex items-center justify-center" style={{ background: "none" }}>
                  <div className="text-center">
                    <img
                      src={appLogo}
                      alt="App Logo"
                      className="h-16 w-auto mx-auto mb-2 bg-white p-2 rounded"
                    />
                    <div className="text-gray-800 text-xs font-medium">
                      Quality through Research
                    </div>
                    <div className="text-gray-700 text-xs">
                      Kaltech Test And Research Centre Pvt. Ltd.
                    </div>
                  </div>
                </div>

                {/* Document Title Section */}
                <div className="col-span-6 p-6 flex items-center justify-center border-l border-r border-gray-200">
                  <div className="text-center">
                    <h3 className="font-semibold text-gray-800 text-lg">
                      Sample /UUC Received Record and Department Sample Inward Register
                    </h3>
                  </div>
                </div>

                {/* Document Details Section */}
                <div className="col-span-3 p-6">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">QF. No.</span>
                      <span className="font-medium">KTROCF070401</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Issue No.</span>
                      <span className="font-medium">01</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Issue Date</span>
                      <span className="font-medium">01/08/2019</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Revision No.</span>
                      <span className="font-medium">01</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Revision Date</span>
                      <span className="font-medium">20/08/2021</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Page</span>
                      <span className="font-medium">1 of 1</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Horizontal Scrollable Table */}
              <div className="overflow-x-auto">
                <table className="w-full min-w-max border-collapse">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 border border-gray-300 whitespace-nowrap">Sr no</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 border border-gray-300 whitespace-nowrap">Date</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 border border-gray-300 whitespace-nowrap">BRN</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 border border-gray-300 whitespace-nowrap">LRN</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 border border-gray-300 whitespace-nowrap">Inward No</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 border border-gray-300 whitespace-nowrap">Party name</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 border border-gray-300 whitespace-nowrap">Contact Person</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 border border-gray-300 whitespace-nowrap">Sample Details</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 border border-gray-300 whitespace-nowrap">Instrument Name</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 border border-gray-300 whitespace-nowrap">Id no</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 border border-gray-300 whitespace-nowrap">Serial no</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 border border-gray-300 whitespace-nowrap">Quantity</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 border border-gray-300 whitespace-nowrap">Department</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 border border-gray-300 whitespace-nowrap">Parameters</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 border border-gray-300 whitespace-nowrap">Committed Date</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 border border-gray-300 whitespace-nowrap">Reporting Date</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 border border-gray-300 whitespace-nowrap">TAT</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 border border-gray-300 whitespace-nowrap">Remarks</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 border border-gray-300 whitespace-nowrap">Location</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 border border-gray-300 whitespace-nowrap">Status</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 border border-gray-300 whitespace-nowrap">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="21" className="p-8 text-center text-gray-500">
                          <div className="text-sm">Loading...</div>
                        </td>
                      </tr>
                    ) : registerData.length === 0 ? (
                      <tr>
                        <td colSpan="21" className="p-8 text-center text-gray-500">
                          <div className="text-sm">
                            No records found for the selected criteria.
                          </div>
                        </td>
                      </tr>
                    ) : (
                      registerData.map((record, index) => (
                        <tr key={record.id} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-xs border border-gray-300">{index + 1}</td>
                          <td className="px-3 py-2 text-xs border border-gray-300">{formatDateForDisplay(record.inwarddate)}</td>
                          <td className="px-3 py-2 text-xs border border-gray-300">{record.brn}</td>
                          <td className="px-3 py-2 text-xs border border-gray-300">{record.lrn}</td>
                          <td className="px-3 py-2 text-xs border border-gray-300">{record.inward_id}</td>
                          <td className="px-3 py-2 text-xs border border-gray-300 max-w-[250px] whitespace-normal break-words">{record.customername}</td>
                          <td className="px-3 py-2 text-xs border border-gray-300">{record.concernpersonname}</td>
                          <td className="px-3 py-2 text-xs border border-gray-300 max-w-[250px] whitespace-normal break-words">{record.sample_details}</td>
                          <td className="px-3 py-2 text-xs border border-gray-300 max-w-[250px] whitespace-normal break-words">{record.instrument_name}</td>
                          <td className="px-3 py-2 text-xs border border-gray-300">{record.idno}</td>
                          <td className="px-3 py-2 text-xs border border-gray-300">{record.serialno}</td>
                          <td className="px-3 py-2 text-xs border border-gray-300">{record.quantity}</td>
                          <td className="px-3 py-2 text-xs border border-gray-300">{record.department}</td>
                          <td className="px-3 py-2 text-xs border border-gray-300">{record.parameters}</td>
                          <td className="px-3 py-2 text-xs border border-gray-300">{formatDateForDisplay(record.committed_date)}</td>
                          <td className="px-3 py-2 text-xs border border-gray-300">{formatDateForDisplay(record.reporting_date)}</td>
                          <td className="px-3 py-2 text-xs border border-gray-300">{record.tat}</td>
                          <td className="px-3 py-2 text-xs border border-gray-300">{record.remarks}</td>
                          <td className="px-3 py-2 text-xs border border-gray-300">{record.location}</td>
                          <td className="px-3 py-2 text-xs border border-gray-300">
                            {record.is_lrn_canceled ? (
                              <span className="px-2 py-1 rounded text-xs bg-red-100 text-red-700 font-medium">
                                LRN Canceled
                              </span>
                            ) : (
                              <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-700">
                                Active
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-xs border border-gray-300 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              {record.accreditation === 'Nabl' && (
                                <Link
                                  to={`/dashboards/calibration-process/inward-entry-lab/view-cmc-calculation/${record.inward_id}/${record.id}`}
                                  className="px-2 py-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded text-xs font-medium transition-colors inline-block text-center"
                                >
                                  View CMC Calculation
                                </Link>
                              )}
                              <Link
                                to={`/dashboards/calibration-process/inward-entry-lab/view-rawdata/${record.inward_id}/${record.id}`}
                                className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-medium transition-colors inline-block text-center"
                              >
                                View Rawdata
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Footer with total records */}
              <div className="p-4 border-t border-gray-200 bg-gray-50">
                <div className="text-sm text-gray-600">
                  Total Records: <span className="font-medium">{registerData.length}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LrnBrnRegister; 