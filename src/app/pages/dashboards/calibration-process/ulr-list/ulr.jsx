

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import axios from "utils/axios";

import Select from 'react-select'; // Import react-select
import { DatePicker } from "components/shared/form/Datepicker";

const Button = ({ onClick, className, children, ...props }) => (
  <button
    onClick={onClick}
    className={className}
    {...props}
  >
    {children}
  </button>
);

const ULRList = () => {
  const navigate = useNavigate();
  const permissions = JSON.parse(localStorage.getItem("userPermissions") || "[]");

  useEffect(() => {
    if (!permissions.includes(110)) {
      navigate("/dashboards");
    }
  }, [navigate, permissions]);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null); // Changed to null for react-select
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [showTable, setShowTable] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [ulrLoading, setUlrLoading] = useState(false);
  const [error, setError] = useState('');
 // const navigate = useNavigate();

  // Fetch customers from API
  useEffect(() => {
    const fetchCustomers = async () => {
      setLoading(true);
      setError('');
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
        setError(err.message || 'Failed to load customers. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  // Fetch ULR data function
  const fetchULRData = async (startDate, endDate, customerId) => {
    try {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await axios.get(
        `/calibrationprocess/get-ulrno-list?startdate=${startDate}&enddate=${endDate}&customerid=${customerId}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const data = response.data;
      
      console.log('ULR API Response:', data);
      
      if (data && data.success && Array.isArray(data.data)) {
        return data.data;
      } else {
        throw new Error('Invalid ULR data response format');
      }
    } catch (err) {
      console.error('Error fetching ULR data:', err);
      throw err;
    }
  };

  const handleSearch = async () => {
    if (!startDate || !endDate || !selectedCustomerId) {
      alert('Please fill in all fields (Start Date, End Date, and Customer) before searching.');
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      alert('End date must be after start date.');
      return;
    }

    setUlrLoading(true);
    setError('');
    setShowTable(false); // Reset table visibility during loading

    try {
      console.log('Searching with:', { startDate, endDate, selectedCustomerId });

      // FIXED: Pass all three parameters in correct order
      const ulrData = await fetchULRData(startDate, endDate, selectedCustomerId);

      const formattedData = ulrData.map(item => ({
        id: item.id,
        name: item.name,
        idNo: item.idno,
        certificateNo: item.certificateno,
        ulrNo: item.ulrno,
        customerName: item.customername,
        receiveDate: formatDate(item.inwarddate),
        issueDate: formatDate(item.issuedate),
        serialNo: item.serialno,
      }));

      const sortedData = formattedData.sort((a, b) => b.id - a.id);
      setSearchResults(sortedData);
      setShowTable(true);

    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to fetch ULR data.');
      alert('Failed to fetch data. Please check your inputs and try again.');
    } finally {
      setUlrLoading(false);
    }
  };

  // Date formatting function - DD/MM/YYYY format
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (error) {
      console.log(error);
      return dateString;
    }
  };

  // Function to format customer display name
  const getCustomerDisplayName = (customer) => {
    if (customer.name && customer.mobile) {
      return `${customer.name} (${customer.mobile})`;
    } else if (customer.name && customer.phone) {
      return `${customer.name} (${customer.phone})`;
    } else if (customer.companyName && customer.contactNumber) {
      return `${customer.companyName} (${customer.contactNumber})`;
    } else if (customer.customerName && customer.phone) {
      return `${customer.customerName} (${customer.phone})`;
    } else if (customer.fullName && customer.mobileNumber) {
      return `${customer.fullName} (${customer.mobileNumber})`;
    } else if (customer.name) {
      return customer.name;
    } else if (customer.companyName) {
      return customer.companyName;
    } else if (customer.customerName) {
      return customer.customerName;
    }
    return 'Unknown Customer';
  };

  // Function to get customer ID
  const getCustomerId = (customer) => {
    return customer.id || customer.customerId || customer._id;
  };

  // Handle customer selection change for react-select
  const handleCustomerChange = (selectedOption) => {
    setSelectedCustomer(selectedOption);
    if (selectedOption) {
      const selectedCustomerObj = customers.find(customer =>
        getCustomerDisplayName(customer) === selectedOption.label
      );
      setSelectedCustomerId(selectedCustomerObj ? getCustomerId(selectedCustomerObj) : '');
    } else {
      setSelectedCustomerId('');
    }
  };

  // Prepare options for react-select
  const customerOptions = customers.map(customer => ({
    value: getCustomerId(customer),
    label: getCustomerDisplayName(customer),
  }));

  return (
    <div className="min-h-screen bg-gray-100" style={{ background: "none" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" style={{ background: "white" }}>
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h1 className="text-xl font-semibold text-gray-800">ULR List</h1>
          </div>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="p-6">
            {/* First Row - Start Date and End Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <DatePicker
                  options={{
                    dateFormat: "Y-m-d",
                    altInput: true,
                    altFormat: "d/m/Y",
                    allowInput: true,
                  }}
                  value={startDate}
                  onChange={(dates, dateStr) => setStartDate(dateStr)}
                  placeholder="mm/dd/yyyy"
                  className="w-full h-9 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                />
              </div>

              {/* End Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <DatePicker
                  options={{
                    dateFormat: "Y-m-d",
                    altInput: true,
                    altFormat: "d/m/Y",
                    allowInput: true,
                  }}
                  value={endDate}
                  onChange={(dates, dateStr) => setEndDate(dateStr)}
                  placeholder="mm/dd/yyyy"
                  className="w-full h-9 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                />
              </div>
            </div>

            {/* Second Row - Customer and Search Button */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
              {/* Customer Dropdown with react-select */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer
                </label>
                <Select
                  value={selectedCustomer}
                  onChange={handleCustomerChange}
                  options={customerOptions}
                  isLoading={loading}
                  isDisabled={loading}
                  placeholder={loading ? 'Loading customers...' : error ? 'Error loading customers' : 'Select Customer'}
                  noOptionsMessage={() => (customers.length === 0 && !loading && !error ? 'No customers found' : 'Type to search')}
                  className="w-full text-sm"
                  classNamePrefix="react-select"
                  styles={{
                    control: (base) => ({
                      ...base,
                      borderRadius: '0.375rem',
                      borderColor: '#d1d5db',
                      '&:hover': { borderColor: '#93c5fd' },
                      boxShadow: 'none',
                      '&:focus-within': {
                        borderColor: '#3b82f6',
                        boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.2)',
                      },
                    }),
                    menu: (base) => ({
                      ...base,
                      maxHeight: '200px',
                      overflowY: 'auto',
                    }),
                  }}
                />
              </div>

              {/* Search Button */}
              <div style={{ width: "200px" }}>
                <Button
                  onClick={handleSearch}
                  className="bg-indigo-500 hover:bg-fuchsia-500 text-white px-6 py-2 rounded-md text-sm font-medium transition-colors w-full"
                  disabled={loading || ulrLoading}
                >
                  {ulrLoading ? 'Searching...' : (loading ? 'Loading...' : 'Search')}
                </Button>
              </div>
            </div>
          </div>

          {/* Progress Bar Container */}
          <div className="px-6 pb-6">
            <div className="w-full bg-gray-200 rounded-full h-2 relative">
              <div className="bg-blue-500 h-2 rounded-full absolute left-0 top-0" style={{ width: '75%' }}></div>
              {/* Left Arrow */}
              <button className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-4 bg-gray-300 hover:bg-gray-400 rounded-full p-1 transition-colors">
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              {/* Right Arrow */}
              <button className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-4 bg-gray-300 hover:bg-gray-400 rounded-full p-1 transition-colors">
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Results Table - Only show when search is performed */}
        {showTable && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-800 mb-4">Search Results</h2>
              
              {ulrLoading ? (
                <div className="text-center py-4">
                  <p>Loading ULR data...</p>
                </div>
              ) : (
                <>
                  {/* Table */}
                  <div className="overflow-x-auto">
                    <table className="min-w-full table-auto border-collapse">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-300 px-4 py-2 text-left text-sm font-medium text-gray-700">ID</th>
                          <th className="border border-gray-300 px-4 py-2 text-left text-sm font-medium text-gray-700">Name</th>
                          <th className="border border-gray-300 px-4 py-2 text-left text-sm font-medium text-gray-700">ID no</th>
                          <th className="border border-gray-300 px-4 py-2 text-left text-sm font-medium text-gray-700">Certificate no</th>
                          <th className="border border-gray-300 px-4 py-2 text-left text-sm font-medium text-gray-700">ULR No.</th>
                          <th className="border border-gray-300 px-4 py-2 text-left text-sm font-medium text-gray-700">Customer Name</th>
                          <th className="border border-gray-300 px-4 py-2 text-left text-sm font-medium text-gray-700">Receive Date</th>
                          <th className="border border-gray-300 px-4 py-2 text-left text-sm font-medium text-gray-700">Issue Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {searchResults.map((row) => (
                          <tr key={row.id} className="hover:bg-gray-50">
                            <td className="border border-gray-300 px-4 py-2 text-sm text-gray-700">{row.id}</td>
                            <td className="border border-gray-300 px-4 py-2 text-sm text-gray-700">{row.name}</td>
                            <td className="border border-gray-300 px-4 py-2 text-sm text-gray-700">{row.idNo}</td>
                            <td className="border border-gray-300 px-4 py-2 text-sm text-gray-700">{row.certificateNo}</td>
                            <td className="border border-gray-300 px-4 py-2 text-sm text-gray-700">{row.ulrNo}</td>
                            <td className="border border-gray-300 px-4 py-2 text-sm text-gray-700">{row.customerName}</td>
                            <td className="border border-gray-300 px-4 py-2 text-sm text-gray-700">{row.receiveDate}</td>
                            <td className="border border-gray-300 px-4 py-2 text-sm text-gray-700">{row.issueDate}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Table Footer with Total Records */}
                  <div className="mt-4 flex justify-between items-center text-sm text-gray-600">
                    <span>Total Records: {searchResults.length}</span>
                    <span>Showing {searchResults.length} results</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ULRList;