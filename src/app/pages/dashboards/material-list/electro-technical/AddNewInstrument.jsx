import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button, Card } from "components/ui";
import axios from 'utils/axios';
import toast, { Toaster } from 'react-hot-toast';
import { Flatpickr } from 'components/shared/form/Flatpickr';
import Select from 'react-select';
import 'flatpickr/dist/themes/light.css';

const customSelectStyles = {
  control: (base, state) => ({
    ...base,
    minHeight: "42px",
    borderColor: state.isFocused ? "#3b82f6" : "#d1d5db",
    boxShadow: state.isFocused ? "0 0 0 1px rgba(59, 130, 246, 0.5)" : "none",
    "&:hover": {
      borderColor: "#3b82f6",
    },
    borderRadius: "0.25rem",
    fontSize: "0.875rem",
    color: "#374151",
    backgroundColor: "white",
  }),
  valueContainer: (base) => ({
    ...base,
    padding: "0 8px",
  }),
  menu: (base) => ({
    ...base,
    zIndex: 9999,
  }),
  menuPortal: (base) => ({
    ...base,
    zIndex: 9999,
  }),
};
// Removed custom Select component

const AddNewInstrument = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const labId = searchParams.get('labId');

  const [formData, setFormData] = useState({
    category: '',
    productType: '',
    vertical: '',
    instrumentLocation: labId || '',
    instrumentName: '',
    description: '',
    nickName: '',
    idNo: '',
    serialNo: '',
    make: '',
    model: '',
    purchaseDate: '',
    manufacturerDetails: '',
    batchNo: '',
    mfdDate: '',
    expiryDate: '',
    qty: '',
    instrumentRange: '',
    leastCount: '',
    calibrationFrequency: '',
    instrumentAllowedFor: '',
    calibrationRequired: '',
    wiReference: '',
    softwareFirmwareDetails: '',
    acceptanceCriteria: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState({
    categories: false,
    subcategories: false,
    verticals: false,
    labs: false,
    submitting: false
  });


  const [categoryOptions, setCategoryOptions] = useState([]);
  const [subcategoryOptions, setSubcategoryOptions] = useState([]);
  const [verticalOptions, setVerticalOptions] = useState([]);
  const [locationOptions, setLocationOptions] = useState([]);

  // Static options
  const allowedForOptions = [
    { value: 'Site', label: 'Site' },
    { value: 'Lab', label: 'Lab' },
    { value: 'Both', label: 'Both' }
  ];

  const calibrationOptions = [
    { value: 'Yes', label: 'Yes' },
    { value: 'No', label: 'No' }
  ];

  // Required fields with readable labels
  const requiredFields = {
    category: 'Category',
    productType: 'Product Type',
    vertical: 'Vertical',
    instrumentLocation: 'Instrument Location',
    instrumentName: 'Instrument Name',
    idNo: 'ID No',
    serialNo: 'Serial No',
    purchaseDate: 'Purchase Date',
    instrumentAllowedFor: 'Instrument allowed for',
    calibrationRequired: 'Calibration Required'
  };

  // Fetch Categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(prev => ({ ...prev, categories: true }));
        const response = await axios.get('/inventory/category-list');

        const categories = response.data?.data || [];
        const mappedCategories = categories.map(cat => ({
          value: cat.id,
          label: cat.name || cat.category_name
        }));

        setCategoryOptions(mappedCategories);
      } catch (error) {
        console.error('❌ Error fetching categories:', error);
        toast.error('Failed to load categories');
      } finally {
        setLoading(prev => ({ ...prev, categories: false }));
      }
    };

    fetchCategories();
  }, []);

  // Fetch Subcategories when category changes
  useEffect(() => {
    const fetchSubcategories = async () => {
      if (!formData.category) {
        setSubcategoryOptions([]);
        return;
      }

      try {
        setLoading(prev => ({ ...prev, subcategories: true }));
        const response = await axios.get('/inventory/subcategory-list');

        const subcategories = response.data?.data || [];
        const mappedSubcategories = subcategories.map(sub => ({
          value: sub.id,
          label: sub.name || sub.subcategory_name
        }));

        setSubcategoryOptions(mappedSubcategories);
      } catch (error) {
        console.error('❌ Error fetching subcategories:', error);
        toast.error('Failed to load subcategories');
      } finally {
        setLoading(prev => ({ ...prev, subcategories: false }));
      }
    };

    fetchSubcategories();
  }, [formData.category]);

  // Fetch Verticals
  useEffect(() => {
    const fetchVerticals = async () => {
      try {
        setLoading(prev => ({ ...prev, verticals: true }));
        const response = await axios.get('/master/vertical-list');

        const verticals = response.data?.data || [];
        const mappedVerticals = verticals.map(vertical => ({
          value: vertical.id,
          label: vertical.name || vertical.vertical_name
        }));

        setVerticalOptions(mappedVerticals);
      } catch (error) {
        console.error('❌ Error fetching verticals:', error);
        toast.error('Failed to load verticals');
      } finally {
        setLoading(prev => ({ ...prev, verticals: false }));
      }
    };

    fetchVerticals();
  }, []);

  // Fetch Labs (Instrument Locations)
  useEffect(() => {
    const fetchLabs = async () => {
      try {
        setLoading(prev => ({ ...prev, labs: true }));
        const response = await axios.get('/master/list-lab');

        const labs = response.data?.data || [];
        const mappedLabs = labs.map(lab => ({
          value: lab.id,
          label: lab.name
        }));

        setLocationOptions(mappedLabs);
      } catch (error) {
        console.error('❌ Error fetching labs:', error);
        toast.error('Failed to load labs');
      } finally {
        setLoading(prev => ({ ...prev, labs: false }));
      }
    };

    fetchLabs();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const missingFields = [];

    Object.keys(requiredFields).forEach(field => {
      if (!formData[field] || formData[field].toString().trim() === '') {
        newErrors[field] = `${requiredFields[field]} is required`;
        missingFields.push(requiredFields[field]);
      }
    });

    setErrors(newErrors);

    if (missingFields.length > 0) {
      toast.error(
        <div>
          <strong>Please fill required fields:</strong>
          <ul className="list-disc list-inside mt-1">
            {missingFields.slice(0, 3).map((field, index) => (
              <li key={index}>{field}</li>
            ))}
            {missingFields.length > 3 && (
              <li>...and {missingFields.length - 3} more</li>
            )}
          </ul>
        </div>,
        { duration: 4000 }
      );
    }

    return Object.keys(newErrors).length === 0;
  };

  // ✅ Helper function to convert date into YYYY-MM-DD format (API expects this)
  const formatDateForAPI = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';

      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();

      return `${day}/${month}/${year}`;
    } catch {
      return '';
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    // Show loading toast
    const loadingToast = toast.loading('Adding instrument...');

    try {
      setLoading(prev => ({ ...prev, submitting: true }));

      // Map form data to API request structure
      const authToken = localStorage.getItem('authToken');

      const requestData = {
        name: formData.instrumentName,
        description: formData.description,
        nickname: formData.nickName,
        idno: formData.idNo,
        serialno: formData.serialNo,

        category: parseInt(formData.category),
        type: parseInt(formData.productType),
        department: parseInt(formData.vertical),

        make: formData.make,
        model: formData.model,
        manufacturer: formData.manufacturerDetails,

        batchno: formData.batchNo,
        mfddate: formatDateForAPI(formData.mfdDate),
        expdate: formatDateForAPI(formData.expiryDate),
        purchasedate: formatDateForAPI(formData.purchaseDate),

        frequency: formData.calibrationFrequency,
        allowedfor: formData.instrumentAllowedFor,
        instrumentlocation: String(formData.instrumentLocation), // Changed to String to match your example

        iscalibrationrequired: formData.calibrationRequired,
        WIreference: formData.wiReference,
        software: formData.softwareFirmwareDetails,
        Acceptance: formData.acceptanceCriteria,

        instrange: formData.instrumentRange,
        leastcount: formData.leastCount,

        qty: formData.qty ? parseInt(formData.qty) : 0,
      };

      console.log('📤 Submitting instrument data:', requestData);

      const response = await axios.post('/material/mm-instrument-create', requestData, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Instrument created successfully:', response.data);

      // Dismiss loading toast
      toast.dismiss(loadingToast);

      // ✅ Fixed: Escaped quotes
      // Show success toast
      toast.success(
        <div>
          <strong>Success!</strong>
          <p>Instrument &quot;{formData.instrumentName}&quot; added successfully</p>
        </div>,
        {
          duration: 3000,
          icon: '✅',
        }
      );

      // Wait a bit before navigation to show success message
      setTimeout(() => {
        navigate(-1);
      }, 1500);

    } catch (error) {
      console.error('❌ Error creating instrument:', error);

      // Dismiss loading toast
      toast.dismiss(loadingToast);

      // Show error toast
      const errorMessage = error.response?.data?.message || 'Failed to create instrument. Please try again.';
      toast.error(
        <div>
          <strong>Error!</strong>
          <p>{errorMessage}</p>
        </div>,
        {
          duration: 4000,
        }
      );
    } finally {
      setLoading(prev => ({ ...prev, submitting: false }));
    }
  };

  const handleBackToList = () => {
    navigate(-1);
  };

  return (
    <>
      {/* Toast Container */}
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={8}
        toastOptions={{
          // Default options
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
            maxWidth: '500px',
          },
          // Success
          success: {
            duration: 3000,
            style: {
              background: '#10b981',
              color: '#fff',
            },
            iconTheme: {
              primary: '#fff',
              secondary: '#10b981',
            },
          },
          // Error
          error: {
            duration: 4000,
            style: {
              background: '#ef4444',
              color: '#fff',
            },
            iconTheme: {
              primary: '#fff',
              secondary: '#ef4444',
            },
          },
          // Loading
          loading: {
            style: {
              background: '#3b82f6',
              color: '#fff',
            },
          },
        }}
      />

      <div className="transition-content grid grid-cols-1 grid-rows-[auto_auto_1fr] px-[var(--margin-x)] py-4">
        {/* Header */}
        <div className="flex items-center justify-between space-x-4">
          <div className="min-w-0">
            <h2 className="truncate text-xl font-medium tracking-wide text-gray-800 dark:text-dark-50">
              Instrument Entry Form
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              className="h-8 space-x-1.5 rounded-md px-3 text-xs text-white bg-indigo-500 hover:bg-fuchsia-500"
              onClick={handleBackToList}
            >
              &lt;&lt; Back to MM Instrument
            </Button>
          </div>
        </div>

        {/* Form Card */}
        <Card className="mt-4">
          <div className="p-6">
            <div className="space-y-6">

              {/* Category */}
              <div className="grid grid-cols-12 gap-4 items-start">
                <label className="col-span-3 text-right text-sm font-medium text-gray-700 dark:text-gray-300 pt-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <div className="col-span-9">
                  <Select
                    styles={customSelectStyles}
                    options={categoryOptions}
                    value={categoryOptions.find(opt => String(opt.value) === String(formData.category)) || null}
                    onChange={(opt) => handleInputChange({ target: { name: 'category', value: opt ? opt.value : '' } })}
                    placeholder="Select Category"
                    isLoading={loading.categories}
                    isSearchable
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                  />
                  {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
                </div>
              </div>

              {/* Product Type / Subcategory */}
              <div className="grid grid-cols-12 gap-4 items-start">
                <label className="col-span-3 text-right text-sm font-medium text-gray-700 dark:text-gray-300 pt-2">
                  Product Type / Subcategory <span className="text-red-500">*</span>
                </label>
                <div className="col-span-9">
                  <Select
                    styles={customSelectStyles}
                    options={subcategoryOptions}
                    value={subcategoryOptions.find(opt => String(opt.value) === String(formData.productType)) || null}
                    onChange={(opt) => handleInputChange({ target: { name: 'productType', value: opt ? opt.value : '' } })}
                    placeholder="Select Product Type"
                    isLoading={loading.subcategories}
                    isSearchable
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                  />
                  {errors.productType && <p className="text-red-500 text-xs mt-1">{errors.productType}</p>}
                </div>
              </div>

              {/* Vertical (Department) */}
              <div className="grid grid-cols-12 gap-4 items-start">
                <label className="col-span-3 text-right text-sm font-medium text-gray-700 dark:text-gray-300 pt-2">
                  Vertical <span className="text-red-500">*</span>
                </label>
                <div className="col-span-9">
                  <Select
                    styles={customSelectStyles}
                    options={verticalOptions}
                    value={verticalOptions.find(opt => String(opt.value) === String(formData.vertical)) || null}
                    onChange={(opt) => handleInputChange({ target: { name: 'vertical', value: opt ? opt.value : '' } })}
                    placeholder="Select Vertical"
                    isLoading={loading.verticals}
                    isSearchable
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                  />
                  {errors.vertical && <p className="text-red-500 text-xs mt-1">{errors.vertical}</p>}
                </div>
              </div>

              {/* Instrument Location */}
              <div className="grid grid-cols-12 gap-4 items-start">
                <label className="col-span-3 text-right text-sm font-medium text-gray-700 dark:text-gray-300 pt-2">
                  Instrument Location <span className="text-red-500">*</span>
                </label>
                <div className="col-span-9">
                  <Select
                    styles={customSelectStyles}
                    options={locationOptions}
                    value={locationOptions.find(opt => String(opt.value) === String(formData.instrumentLocation)) || null}
                    onChange={(opt) => handleInputChange({ target: { name: 'instrumentLocation', value: opt ? opt.value : '' } })}
                    placeholder="Select Location"
                    isLoading={loading.labs}
                    isSearchable
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                  />
                  {errors.instrumentLocation && <p className="text-red-500 text-xs mt-1">{errors.instrumentLocation}</p>}
                </div>
              </div>

              {/* Instrument Name */}
              <div className="grid grid-cols-12 gap-4 items-start">
                <label className="col-span-3 text-right text-sm font-medium text-gray-700 dark:text-gray-300 pt-2">
                  Instrument Name <span className="text-red-500">*</span>
                </label>
                <div className="col-span-9">
                  <input
                    type="text"
                    name="instrumentName"
                    value={formData.instrumentName}
                    onChange={handleInputChange}
                    placeholder="Instrument Name"
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none dark:border-gray-700 dark:bg-dark-800 dark:text-white"
                  />
                  {errors.instrumentName && <p className="text-red-500 text-xs mt-1">{errors.instrumentName}</p>}
                </div>
              </div>

              {/* Description */}
              <div className="grid grid-cols-12 gap-4 items-start">
                <label className="col-span-3 text-right text-sm font-medium text-gray-700 dark:text-gray-300 pt-2">Description</label>
                <div className="col-span-9">
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Description"
                    rows="3"
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none dark:border-gray-700 dark:bg-dark-800 dark:text-white"
                  />
                </div>
              </div>

              {/* Nick Name */}
              <div className="grid grid-cols-12 gap-4 items-start">
                <label className="col-span-3 text-right text-sm font-medium text-gray-700 dark:text-gray-300 pt-2">Nick Name</label>
                <div className="col-span-9">
                  <input
                    type="text"
                    name="nickName"
                    value={formData.nickName}
                    onChange={handleInputChange}
                    placeholder="Nick Name"
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none dark:border-gray-700 dark:bg-dark-800 dark:text-white"
                  />
                </div>
              </div>

              {/* ID No */}
              <div className="grid grid-cols-12 gap-4 items-start">
                <label className="col-span-3 text-right text-sm font-medium text-gray-700 dark:text-gray-300 pt-2">
                  ID No <span className="text-red-500">*</span>
                </label>
                <div className="col-span-9">
                  <input
                    type="text"
                    name="idNo"
                    value={formData.idNo}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none dark:border-gray-700 dark:bg-dark-800 dark:text-white"
                  />
                  {errors.idNo && <p className="text-red-500 text-xs mt-1">{errors.idNo}</p>}
                </div>
              </div>

              {/* Serial No */}
              <div className="grid grid-cols-12 gap-4 items-start">
                <label className="col-span-3 text-right text-sm font-medium text-gray-700 dark:text-gray-300 pt-2">
                  Serial No <span className="text-red-500">*</span>
                </label>
                <div className="col-span-9">
                  <input
                    type="text"
                    name="serialNo"
                    value={formData.serialNo}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none dark:border-gray-700 dark:bg-dark-800 dark:text-white"
                  />
                  {errors.serialNo && <p className="text-red-500 text-xs mt-1">{errors.serialNo}</p>}
                </div>
              </div>

              {/* Make */}
              <div className="grid grid-cols-12 gap-4 items-start">
                <label className="col-span-3 text-right text-sm font-medium text-gray-700 dark:text-gray-300 pt-2">Make</label>
                <div className="col-span-9">
                  <input
                    type="text"
                    name="make"
                    value={formData.make}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none dark:border-gray-700 dark:bg-dark-800 dark:text-white"
                  />
                </div>
              </div>

              {/* Model */}
              <div className="grid grid-cols-12 gap-4 items-start">
                <label className="col-span-3 text-right text-sm font-medium text-gray-700 dark:text-gray-300 pt-2">Model</label>
                <div className="col-span-9">
                  <input
                    type="text"
                    name="model"
                    value={formData.model}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none dark:border-gray-700 dark:bg-dark-800 dark:text-white"
                  />
                </div>
              </div>

              {/* Purchase Date */}
              <div className="grid grid-cols-12 gap-4 items-start">
                <label className="col-span-3 text-right text-sm font-medium text-gray-700 dark:text-gray-300 pt-2">
                  Purchase Date <span className="text-red-500">*</span>
                </label>
                <div className="col-span-9">
                  <Flatpickr
                    name="purchaseDate"
                    value={formData.purchaseDate}
                    onChange={(_, dateStr) => {
                      setFormData(prev => ({ ...prev, purchaseDate: dateStr }));
                      if (errors.purchaseDate) setErrors(prev => ({ ...prev, purchaseDate: '' }));
                    }}
                    options={{
                      altInput: true,
                      altInputClass: "w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none dark:border-gray-700 dark:bg-dark-800 dark:text-white",
                      altFormat: "d/m/y",
                      dateFormat: "Y-m-d",
                      allowInput: true
                    }}
                    placeholder="dd/mm/yy"
                    className="hidden" // Base input hidden, altInput shown with altInputClass
                  />
                  {errors.purchaseDate && <p className="text-red-500 text-xs mt-1">{errors.purchaseDate}</p>}
                </div>
              </div>

              {/* Name and Address of manufacturer */}
              <div className="grid grid-cols-12 gap-4 items-start">
                <label className="col-span-3 text-right text-sm font-medium text-gray-700 dark:text-gray-300 pt-2">Name and Address of manufacturer</label>
                <div className="col-span-9">
                  <textarea
                    name="manufacturerDetails"
                    value={formData.manufacturerDetails}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none dark:border-gray-700 dark:bg-dark-800 dark:text-white"
                  />
                </div>
              </div>

              {/* Batch no */}
              <div className="grid grid-cols-12 gap-4 items-start">
                <label className="col-span-3 text-right text-sm font-medium text-gray-700 dark:text-gray-300 pt-2">Batch no</label>
                <div className="col-span-9">
                  <input
                    type="text"
                    name="batchNo"
                    value={formData.batchNo}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none dark:border-gray-700 dark:bg-dark-800 dark:text-white"
                  />
                </div>
              </div>

              {/* MFD Date */}
              <div className="grid grid-cols-12 gap-4 items-start">
                <label className="col-span-3 text-right text-sm font-medium text-gray-700 dark:text-gray-300 pt-2">MFD Date</label>
                <div className="col-span-9">
                  <Flatpickr
                    name="mfdDate"
                    value={formData.mfdDate}
                    onChange={(_, dateStr) => {
                      setFormData(prev => ({ ...prev, mfdDate: dateStr }));
                    }}
                    options={{
                      altInput: true,
                      altInputClass: "w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none dark:border-gray-700 dark:bg-dark-800 dark:text-white",
                      altFormat: "d/m/y",
                      dateFormat: "Y-m-d",
                      allowInput: true
                    }}
                    placeholder="dd/mm/yy"
                    className="hidden"
                  />
                </div>
              </div>

              {/* Expiry Date */}
              <div className="grid grid-cols-12 gap-4 items-start">
                <label className="col-span-3 text-right text-sm font-medium text-gray-700 dark:text-gray-300 pt-2">Expiry Date</label>
                <div className="col-span-9">
                  <Flatpickr
                    name="expiryDate"
                    value={formData.expiryDate}
                    onChange={(_, dateStr) => {
                      setFormData(prev => ({ ...prev, expiryDate: dateStr }));
                    }}
                    options={{
                      altInput: true,
                      altInputClass: "w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none dark:border-gray-700 dark:bg-dark-800 dark:text-white",
                      altFormat: "d/m/y",
                      dateFormat: "Y-m-d",
                      allowInput: true
                    }}
                    placeholder="dd/mm/yy"
                    className="hidden"
                  />
                </div>
              </div>

              {/* Qty */}
              <div className="grid grid-cols-12 gap-4 items-start">
                <label className="col-span-3 text-right text-sm font-medium text-gray-700 dark:text-gray-300 pt-2">Qty</label>
                <div className="col-span-9">
                  <input
                    type="number"
                    name="qty"
                    value={formData.qty}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none dark:border-gray-700 dark:bg-dark-800 dark:text-white"
                  />
                </div>
              </div>

              {/* Instrument Range */}
              <div className="grid grid-cols-12 gap-4 items-start">
                <label className="col-span-3 text-right text-sm font-medium text-gray-700 dark:text-gray-300 pt-2">Instrument Range</label>
                <div className="col-span-9">
                  <input
                    type="text"
                    name="instrumentRange"
                    value={formData.instrumentRange}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none dark:border-gray-700 dark:bg-dark-800 dark:text-white"
                  />
                </div>
              </div>

              {/* Leastcount */}
              <div className="grid grid-cols-12 gap-4 items-start">
                <label className="col-span-3 text-right text-sm font-medium text-gray-700 dark:text-gray-300 pt-2">Leastcount</label>
                <div className="col-span-9">
                  <input
                    type="text"
                    name="leastCount"
                    value={formData.leastCount}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none dark:border-gray-700 dark:bg-dark-800 dark:text-white"
                  />
                </div>
              </div>

              {/* Frequency of calibration if required */}
              <div className="grid grid-cols-12 gap-4 items-start">
                <label className="col-span-3 text-right text-sm font-medium text-gray-700 dark:text-gray-300 pt-2">Frequency of calibration if required</label>
                <div className="col-span-9">
                  <input
                    type="text"
                    name="calibrationFrequency"
                    value={formData.calibrationFrequency}
                    onChange={handleInputChange}
                    placeholder="e.g., 6 Months, 1 Year"
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none dark:border-gray-700 dark:bg-dark-800 dark:text-white"
                  />
                </div>
              </div>

              {/* Instrument allowed for */}
              <div className="grid grid-cols-12 gap-4 items-start">
                <label className="col-span-3 text-right text-sm font-medium text-gray-700 dark:text-gray-300 pt-2">
                  Instrument allowed for <span className="text-red-500">*</span>
                </label>
                <div className="col-span-9">
                  <Select
                    styles={customSelectStyles}
                    options={allowedForOptions}
                    value={allowedForOptions.find(opt => opt.value === formData.instrumentAllowedFor) || null}
                    onChange={(opt) => handleInputChange({ target: { name: 'instrumentAllowedFor', value: opt ? opt.value : '' } })}
                    placeholder="Select Option"
                    isSearchable={false}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                  />
                  {errors.instrumentAllowedFor && <p className="text-red-500 text-xs mt-1">{errors.instrumentAllowedFor}</p>}
                </div>
              </div>

              {/* Calibration Required */}
              <div className="grid grid-cols-12 gap-4 items-start">
                <label className="col-span-3 text-right text-sm font-medium text-gray-700 dark:text-gray-300 pt-2">
                  Calibration Required <span className="text-red-500">*</span>
                </label>
                <div className="col-span-9">
                  <Select
                    styles={customSelectStyles}
                    options={calibrationOptions}
                    value={calibrationOptions.find(opt => opt.value === formData.calibrationRequired) || null}
                    onChange={(opt) => handleInputChange({ target: { name: 'calibrationRequired', value: opt ? opt.value : '' } })}
                    placeholder="Select Option"
                    isSearchable={false}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                  />
                  {errors.calibrationRequired && <p className="text-red-500 text-xs mt-1">{errors.calibrationRequired}</p>}
                </div>
              </div>

              {/* WI Reference */}
              <div className="grid grid-cols-12 gap-4 items-start">
                <label className="col-span-3 text-right text-sm font-medium text-gray-700 dark:text-gray-300 pt-2">WI Reference</label>
                <div className="col-span-9">
                  <input
                    type="text"
                    name="wiReference"
                    value={formData.wiReference}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none dark:border-gray-700 dark:bg-dark-800 dark:text-white"
                  />
                </div>
              </div>

              {/* Software / Firmware details */}
              <div className="grid grid-cols-12 gap-4 items-start">
                <label className="col-span-3 text-right text-sm font-medium text-gray-700 dark:text-gray-300 pt-2">Software / Firmware details</label>
                <div className="col-span-9">
                  <input
                    type="text"
                    name="softwareFirmwareDetails"
                    value={formData.softwareFirmwareDetails}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none dark:border-gray-700 dark:bg-dark-800 dark:text-white"
                  />
                </div>
              </div>

              {/* Acceptance Criteria */}
              <div className="grid grid-cols-12 gap-4 items-start">
                <label className="col-span-3 text-right text-sm font-medium text-gray-700 dark:text-gray-300 pt-2">Acceptance Criteria (KTRC/QF/0704/07)</label>
                <div className="col-span-9">
                  <input
                    type="text"
                    name="acceptanceCriteria"
                    value={formData.acceptanceCriteria}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none dark:border-gray-700 dark:bg-dark-800 dark:text-white"
                  />
                </div>
              </div>

            </div>

            {/* Submit Button */}
            <div className="flex justify-end mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                onClick={handleSubmit}
                color="primary"
                className="px-6 py-2 bg-green-500 hover:bg-green-600"
                disabled={loading.submitting}
              >
                {loading.submitting ? 'Adding Instrument...' : 'Add Instrument'}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
};

export default AddNewInstrument;