import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import axios from 'axios';
import { Page } from "components/shared/Page";
import { Button } from "components/ui";
import { toast } from "sonner";
import { JWT_HOST_API } from "configs/auth.config";

const Calibratestep1 = () => {
    const navigate = useNavigate();
    const { id, itemId } = useParams();

    // Get URL parameters
    const searchParams = new URLSearchParams(window.location.search);
    const caliblocation = searchParams.get("caliblocation") || "Lab";
    const calibacc = searchParams.get("calibacc") || "Nabl";

    const [formData, setFormData] = useState({
        equipmentName: '',
        brnNo: '',
        receiveDate: '',
        make: '',
        model: '',
        srNo: '',
        idNo: '',
        calibratedStart: '',
        suggestedDueDate: '',
        range: '',
        leastCount: '',
        conditionOfUIC: '',
        calibrationPerformedAt: '',
        referenceSite: '',
        temperature: '',
        humidity: ''
    });

    // Add state for range values and validation
    const [rangeValues, setRangeValues] = useState({
        temprangemin: null,
        temprangemax: null,
        humirangemin: null,
        humirangemax: null
    });

    // Store original API values for placeholder
    const [originalValues, setOriginalValues] = useState({
        temperature: '',
        humidity: '',
        conditionOfUIC: '',
        calibratedStart: '',
        suggestedDueDate: ''
    });

    const [validationErrors, setValidationErrors] = useState({
        temperature: '',
        humidity: '',
        conditionOfUIC: '',
        calibratedStart: '',
        suggestedDueDate: ''
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Detect system theme
    const [theme, setTheme] = useState('light');

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        setTheme(mediaQuery.matches ? 'dark' : 'light');

        const handleChange = (e) => {
            setTheme(e.matches ? 'dark' : 'light');
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    // Configure axios defaults
    useEffect(() => {
        const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
        
        axios.defaults.headers.common['Content-Type'] = 'application/json';
        axios.defaults.headers.common['Accept'] = 'application/json';
        
        axios.interceptors.request.use(
            (config) => {
                console.log('API Request:', config);
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );

        axios.interceptors.response.use(
            (response) => {
                return response;
            },
            (error) => {
                if (error.response?.status === 401) {
                    console.error('Authentication failed. Please login again.');
                } else if (error.response?.status === 403) {
                    console.error('Access forbidden. Insufficient permissions.');
                }
                return Promise.reject(error);
            }
        );
    }, []);

    // Validation function for temperature, humidity, and other fields
    const validateRange = (value, min, max, fieldName) => {
        if (!value && fieldName !== 'conditionOfUIC') return `${fieldName} is required`;
        
        if (fieldName === 'temperature' || fieldName === 'humidity') {
            const numValue = parseFloat(value);
            if (isNaN(numValue)) return `Invalid ${fieldName.toLowerCase()}`;
            if (numValue < min || numValue > max) {
                return `${fieldName} must be between ${min} and ${max}`;
            }
        }
        
        if (fieldName === 'conditionOfUIC' && !value) {
            return 'Condition of UUC is required';
        }

        if (fieldName === 'calibratedStart') {
            const date = new Date(value);
            if (isNaN(date.getTime())) return 'Invalid calibration start date';
        }

        if (fieldName === 'suggestedDueDate') {
            const date = new Date(value);
            if (isNaN(date.getTime())) return 'Invalid suggested due date';
        }

        return '';
    };

    // Fetch calibration details from API
    useEffect(() => {
        const fetchCalibrationDetails = async () => {
            try {
                setLoading(true);
                setError(null);
                
                const apiUrl = `${JWT_HOST_API}/calibrationprocess/get-firststep-required-details`;
                
                const params = {
                    inward_id: id,
                    instid: itemId,
                    caliblocation: caliblocation,
                    calibacc: calibacc
                };

                console.log('Fetching data with params:', params);
                
                const response = await axios.get(apiUrl, { params });
                
                console.log('API Response:', response.data);
                
                if (response.data.status === "true" && response.data.data) {
                    const { inward, instrument_entry, instrument_master } = response.data.data;
                    
                    // Set range values from API response
                    setRangeValues({
                        temprangemin: response.data.data.temprangemin,
                        temprangemax: response.data.data.temprangemax,
                        humirangemin: response.data.data.humirangemin,
                        humirangemax: response.data.data.humirangemax
                    });

                    // Store original values for placeholder
                    setOriginalValues({
                        temperature: instrument_entry?.temperature || '',
                        humidity: instrument_entry?.humidity || '',
                        conditionOfUIC: instrument_entry?.conditiononrecieve || 'Satisfactory',
                        calibratedStart: instrument_entry?.startdate && instrument_entry.startdate !== '0000-00-00 00:00:00' 
                            ? formatDateTimeLocal(instrument_entry.startdate)
                            : new Date().toISOString().slice(0, 16),
                        suggestedDueDate: instrument_entry?.duedate && instrument_entry.duedate !== '0000-00-00'
                            ? new Date(instrument_entry.duedate).toISOString().split('T')[0]
                            : ''
                    });
                    
                    // Map API data to form fields
                    const mappedData = {
                        equipmentName: instrument_master?.name || instrument_entry?.name || 'N/A',
                        brnNo: inward?.bookingrefno || inward?.labreferenceno || '',
                        receiveDate: inward?.sample_received_on ? 
                            formatDate(inward.sample_received_on) : 
                            (inward?.inwarddate ? formatDate(inward.inwarddate) : ''),
                        make: instrument_entry?.make || 'N/A',
                        model: instrument_entry?.model || 'N/A',
                        srNo: instrument_entry?.serialno || 'N/A',
                        idNo: instrument_entry?.idno || 'N/A',
                        range: instrument_entry?.equipmentrange || instrument_entry?.workingrange || '',
                        leastCount: instrument_entry?.leastcount || instrument_entry?.itemleastcount || '',
                        calibratedStart: instrument_entry?.startdate && instrument_entry.startdate !== '0000-00-00 00:00:00' 
                            ? formatDateTimeLocal(instrument_entry.startdate)
                            : new Date().toISOString().slice(0, 16),
                        suggestedDueDate: instrument_entry?.duedate && instrument_entry.duedate !== '0000-00-00'
                            ? new Date(instrument_entry.duedate).toISOString().split('T')[0]
                            : '',
                        conditionOfUIC: instrument_entry?.conditiononrecieve || 'Satisfactory',
                        calibrationPerformedAt: response.data.data.caliblocation || caliblocation,
                        referenceSite: getReferenceSite(instrument_entry, instrument_master),
                        temperature: instrument_entry?.temperature || '',
                        humidity: instrument_entry?.humidity || ''
                    };

                    setFormData(mappedData);
                    console.log('Form data mapped:', mappedData);
                    console.log('Range values:', {
                        temprangemin: response.data.data.temprangemin,
                        temprangemax: response.data.data.temprangemax,
                        humirangemin: response.data.data.humirangemin,
                        humirangemax: response.data.data.humirangemax
                    });
                } else {
                    throw new Error(response.data.message || 'Failed to fetch calibration details');
                }
            } catch (err) {
                console.error('Error fetching calibration details:', err);
                let errorMessage = 'Failed to load calibration details';
                if (err.response) {
                    errorMessage = `Server Error: ${err.response.status} - ${err.response.data?.message || err.message}`;
                } else if (err.request) {
                    errorMessage = 'Network Error: Please check your connection';
                } else {
                    errorMessage = err.message;
                }
                setError(errorMessage);
                toast.error(errorMessage);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchCalibrationDetails();
        }
    }, [id, itemId, caliblocation, calibacc]);

    // Helper functions
    const formatDate = (dateString) => {
        if (!dateString || dateString === '0000-00-00') return '';
        try {
            return new Date(dateString).toLocaleDateString('en-GB');
        } catch {
            return dateString;
        }
    };

    const formatDateTimeLocal = (dateTimeString) => {
        if (!dateTimeString || dateTimeString === '0000-00-00 00:00:00') return '';
        try {
            return new Date(dateTimeString).toISOString().slice(0, 16);
        } catch {
            return '';
        }
    };

    const getReferenceSite = (instrument_entry, instrument_master) => {
        if (instrument_entry?.referencestd) {
            return instrument_entry.referencestd;
        }
        const defaultReferences = {
            'temperature': 'DKD-R 6-1\nIS 3651 (Part II) : 1985',
            'pressure': 'DKD-R 6-1\nIS 3651 (Part I) : 1985',
            'electrical': 'IS 13540 : 1993\nIEC 61010-1',
            'dimensional': 'IS 3651 (Part III) : 1985\nDKD-R 4-3'
        };
        const discipline = instrument_master?.discipline?.toLowerCase();
        return defaultReferences[discipline] || 'DKD-R 6-1\nIS 3651 (Part II) : 1985';
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        // Update form data
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Validate fields on change
        if (name === 'temperature') {
            const error = validateRange(value, rangeValues.temprangemin, rangeValues.temprangemax, 'Temperature');
            setValidationErrors(prev => ({
                ...prev,
                temperature: error
            }));
        } else if (name === 'humidity') {
            const error = validateRange(value, rangeValues.humirangemin, rangeValues.humirangemax, 'Humidity');
            setValidationErrors(prev => ({
                ...prev,
                humidity: error
            }));
        } else if (name === 'conditionOfUIC') {
            const error = validateRange(value, null, null, 'Condition of UUC');
            setValidationErrors(prev => ({
                ...prev,
                conditionOfUIC: error
            }));
        } else if (name === 'calibratedStart') {
            const error = validateRange(value, null, null, 'Calibrated Start');
            setValidationErrors(prev => ({
                ...prev,
                calibratedStart: error
            }));
        } else if (name === 'suggestedDueDate') {
            const error = validateRange(value, null, null, 'Suggested Due Date');
            setValidationErrors(prev => ({
                ...prev,
                suggestedDueDate: error
            }));
        }
    };

    // Check if form is valid for submission
    const isFormValid = () => {
        const hasRequiredFields = formData.suggestedDueDate && 
                                formData.temperature && 
                                formData.humidity && 
                                formData.conditionOfUIC && 
                                formData.calibratedStart;
        const hasNoValidationErrors = !validationErrors.temperature && 
                                    !validationErrors.humidity && 
                                    !validationErrors.conditionOfUIC && 
                                    !validationErrors.calibratedStart && 
                                    !validationErrors.suggestedDueDate;
        const isTemperatureInRange = formData.temperature && 
            parseFloat(formData.temperature) >= rangeValues.temprangemin && 
            parseFloat(formData.temperature) <= rangeValues.temprangemax;
        const isHumidityInRange = formData.humidity && 
            parseFloat(formData.humidity) >= rangeValues.humirangemin && 
            parseFloat(formData.humidity) <= rangeValues.humirangemax;
        
        return hasRequiredFields && hasNoValidationErrors && isTemperatureInRange && isHumidityInRange;
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Final validation before submission
        const tempError = validateRange(formData.temperature, rangeValues.temprangemin, rangeValues.temprangemax, 'Temperature');
        const humiError = validateRange(formData.humidity, rangeValues.humirangemin, rangeValues.humirangemax, 'Humidity');
        const conditionError = validateRange(formData.conditionOfUIC, null, null, 'Condition of UUC');
        const calibratedStartError = validateRange(formData.calibratedStart, null, null, 'Calibrated Start');
        const dueDateError = validateRange(formData.suggestedDueDate, null, null, 'Suggested Due Date');
        
        if (tempError || humiError || conditionError || calibratedStartError || dueDateError) {
            setValidationErrors({
                temperature: tempError,
                humidity: humiError,
                conditionOfUIC: conditionError,
                calibratedStart: calibratedStartError,
                suggestedDueDate: dueDateError
            });
            toast.error('Please correct the validation errors before submitting');
            return;
        }

        console.log('Form submitted:', formData);

        try {
            const apiUrl = `${JWT_HOST_API}/calibrationprocess/add_step_one`;
            
            // Format calibrated date - convert datetime-local to DD/MM/YYYY HH:MM:SS format
            let formattedCalibratedOn = '';
            if (formData.calibratedStart) {
                const date = new Date(formData.calibratedStart);
                const day = date.getDate().toString().padStart(2, '0');
                const month = (date.getMonth() + 1).toString().padStart(2, '0');
                const year = date.getFullYear();
                const hours = date.getHours().toString().padStart(2, '0');
                const minutes = date.getMinutes().toString().padStart(2, '0');
                const seconds = date.getSeconds().toString().padStart(2, '0');
                formattedCalibratedOn = `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
            }

            const payload = {
                inwardid: parseInt(id),
                id: parseInt(itemId) || 49769,
                performedat: formData.calibrationPerformedAt || "Lab",
                temperature: formData.temperature,
                humidity: formData.humidity,
                referencestd: formData.referenceSite || "13",
                duedate: formData.suggestedDueDate || "2025-08-05",
                calibratedon: formattedCalibratedOn,
                conditiononrecieve: formData.conditionOfUIC || "Satisfactory",
                caliblocation: caliblocation || "Lab",
                calibacc: calibacc || "Nabl"
            };

            console.log('Payload sent:', payload);

            const response = await axios.post(apiUrl, payload);
            
            console.log('API Response:', response.data);
            
            if (response.data.status === "true" || response.data.status === true) {
                // Update formData with the latest conditiononrecieve from API response if available
                const updatedCondition = response.data.data?.instrument_entry?.conditiononrecieve || formData.conditionOfUIC;
                setFormData(prev => ({
                    ...prev,
                    conditionOfUIC: updatedCondition
                }));
                setOriginalValues(prev => ({
                    ...prev,
                    conditionOfUIC: updatedCondition
                }));
                toast.success('Data submitted successfully!');
                setTimeout(() => {
                    navigate(`/dashboards/calibration-process/inward-entry-lab/calibrate-step2/${id}/${itemId}?caliblocation=${caliblocation}&calibacc=${calibacc}`, {
                        state: { step1Data: formData }
                    });
                }, 1500);
            } else {
                throw new Error(response.data.message || 'Failed to submit data');
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            let errorMessage = 'Error submitting form. Please try again.';
            if (error.response) {
                errorMessage = `Server Error: ${error.response.status} - ${error.response.data?.message || error.message}`;
                console.log('Response data:', error.response.data);
            } else if (error.request) {
                errorMessage = 'Network Error: Please check your connection';
            } else {
                errorMessage = error.message;
            }
            toast.error(errorMessage);
        }
    };

    const handleBackToInwardList = () => {
        navigate(`/dashboards/calibration-process/inward-entry-lab?caliblocation=${caliblocation}&calibacc=${calibacc}`);
    };

    const handleBackToPerformCalibration = () => {
        navigate(`/dashboards/calibration-process/inward-entry-lab/perform-calibration/${id}?caliblocation=${caliblocation}&calibacc=${calibacc}`);
    };

    const handleRetry = () => {
        setError(null);
        setLoading(true);
        window.location.reload();
    };


  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-gray-600">
        <svg className="animate-spin h-6 w-6 mr-2 text-blue-600" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z"></path>
        </svg>
        Loading Calibration Step1...
      </div>
    );
  }

    if (error) {
        return (
            <div className={`min-h-screen ${theme === 'dark' ? 'dark' : ''}`}>
                <Page title="Fill Dates" className="bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
                    <div className="max-w-7xl mx-auto">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-4">
                            <div className="flex flex-col items-center justify-center p-8">
                                <div className="text-lg text-red-600 dark:text-red-400 mb-4">Error loading calibration details</div>
                                <div className="text-sm text-gray-600 dark:text-gray-300 mb-4 text-center max-w-md">
                                    {error}
                                </div>
                                <div className="flex gap-3">
                                    <Button
                                        onClick={handleRetry}
                                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                                    >
                                        Retry
                                    </Button>
                                    <Button
                                        onClick={handleBackToPerformCalibration}
                                        className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
                                    >
                                        Go Back
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </Page>
            </div>
        );
    }

    return (
        <div className={`min-h-screen ${theme === 'dark' ? 'dark' : ''}`}>
            <Page title="Fill Dates" className="bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-4">
                        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                            <h1 className="text-xl font-medium text-gray-800 dark:text-gray-200">Fill Dates</h1>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={handleBackToInwardList}
                                    className="bg-indigo-500 hover:bg-fuchsia-500 dark:bg-indigo-600 dark:hover:bg-fuchsia-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                                >
                                    ← Back to Inward Entry List
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={handleBackToPerformCalibration}
                                    className="bg-indigo-500 hover:bg-fuchsia-500 dark:bg-indigo-600 dark:hover:bg-fuchsia-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                                >
                                    ← Back to Perform Calibration
                                </Button>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6">
                            <div className="grid grid-cols-12 gap-6">
                                <div className="col-span-6 space-y-4">
                                    <div className="flex">
                                        <label className="w-48 text-sm font-medium text-gray-700 dark:text-gray-300 py-2">Name Of The Equipment:</label>
                                        <input
                                            type="text"
                                            name="equipmentName"
                                            value={formData.equipmentName}
                                            onChange={handleChange}
                                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 dark:text-gray-200"
                                            readOnly
                                        />
                                    </div>

                                    <div className="flex">
                                        <label className="w-48 text-sm font-medium text-gray-700 dark:text-gray-300 py-2">Make:</label>
                                        <input
                                            type="text"
                                            name="make"
                                            value={formData.make}
                                            onChange={handleChange}
                                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 dark:text-gray-200"
                                            readOnly
                                        />
                                    </div>

                                    <div className="flex">
                                        <label className="w-48 text-sm font-medium text-gray-700 dark:text-gray-300 py-2">Model:</label>
                                        <input
                                            type="text"
                                            name="model"
                                            value={formData.model}
                                            onChange={handleChange}
                                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 dark:text-gray-200"
                                            readOnly
                                        />
                                    </div>

                                    <div className="flex">
                                        <label className="w-48 text-sm font-medium text-gray-700 dark:text-gray-300 py-2">SR no:</label>
                                        <input
                                            type="text"
                                            name="srNo"
                                            value={formData.srNo}
                                            onChange={handleChange}
                                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 dark:text-gray-200"
                                            readOnly
                                        />
                                    </div>

                                    <div className="flex">
                                        <label className="w-48 text-sm font-medium text-gray-700 dark:text-gray-300 py-2">Id no:</label>
                                        <input
                                            type="text"
                                            name="idNo"
                                            value={formData.idNo}
                                            onChange={handleChange}
                                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 dark:text-gray-200"
                                            readOnly
                                        />
                                    </div>

                                    <div className="flex flex-col">
                                        <div className="flex">
                                            <label className="w-48 text-sm font-medium text-gray-700 dark:text-gray-300 py-2">
                                                Calibrated Start <span className="text-red-500">*</span>:
                                            </label>
                                            <div className="flex-1">
                                                <input
                                                    type="datetime-local"
                                                    name="calibratedStart"
                                                    value={formData.calibratedStart}
                                                    onChange={handleChange}
                                                    className={`w-full px-3 py-2 border rounded bg-blue-50 dark:bg-blue-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 ${
                                                        validationErrors.calibratedStart ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
                                                    }`}
                                                    required
                                                    placeholder={
                                                        originalValues.calibratedStart 
                                                            ? `Current: ${originalValues.calibratedStart}` 
                                                            : `Enter calibration start date`
                                                    }
                                                />
                                                {validationErrors.calibratedStart && (
                                                    <div className="text-red-500 dark:text-red-400 text-xs mt-1">
                                                        {validationErrors.calibratedStart}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col">
                                        <div className="flex">
                                            <label className="w-48 text-sm font-medium text-gray-700 dark:text-gray-300 py-2">
                                                Suggested Due Date <span className="text-red-500">*</span>:
                                            </label>
                                            <div className="flex-1">
                                                <input
                                                    type="date"
                                                    name="suggestedDueDate"
                                                    value={formData.suggestedDueDate}
                                                    onChange={handleChange}
                                                    className={`w-full px-3 py-2 border rounded bg-blue-50 dark:bg-blue-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 ${
                                                        validationErrors.suggestedDueDate ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
                                                    }`}
                                                    required
                                                    placeholder={
                                                        originalValues.suggestedDueDate 
                                                            ? `Current: ${originalValues.suggestedDueDate}` 
                                                            : `Enter suggested due date`
                                                    }
                                                />
                                                {validationErrors.suggestedDueDate && (
                                                    <div className="text-red-500 dark:text-red-400 text-xs mt-1">
                                                        {validationErrors.suggestedDueDate}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-span-6 space-y-4">
                                    <div className="flex">
                                        <label className="w-32 text-sm font-medium text-gray-700 dark:text-gray-300 py-2">BRN No:</label>
                                        <input
                                            type="text"
                                            name="brnNo"
                                            value={formData.brnNo}
                                            onChange={handleChange}
                                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 dark:text-gray-200"
                                            readOnly
                                        />
                                    </div>

                                    <div className="flex">
                                        <label className="w-32 text-sm font-medium text-gray-700 dark:text-gray-300 py-2">Receive Date:</label>
                                        <input
                                            type="text"
                                            name="receiveDate"
                                            value={formData.receiveDate}
                                            onChange={handleChange}
                                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 dark:text-gray-200"
                                            readOnly
                                        />
                                    </div>

                                    <div className="flex">
                                        <label className="w-32 text-sm font-medium text-gray-700 dark:text-gray-300 py-2">Range:</label>
                                        <input
                                            type="text"
                                            name="range"
                                            value={formData.range}
                                            onChange={handleChange}
                                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 dark:text-gray-200"
                                            readOnly
                                        />
                                    </div>

                                    <div className="flex">
                                        <label className="w-32 text-sm font-medium text-gray-700 dark:text-gray-300 py-2">Least Count:</label>
                                        <input
                                            type="text"
                                            name="leastCount"
                                            value={formData.leastCount}
                                            onChange={handleChange}
                                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 dark:text-gray-200"
                                            readOnly
                                        />
                                    </div>

                                    <div className="flex flex-col">
                                        <div className="flex">
                                            <label className="w-32 text-sm font-medium text-gray-700 dark:text-gray-300 py-2">
                                                Condition Of UUC <span className="text-red-500">*</span>:
                                            </label>
                                            <div className="flex-1">
                                                <input
                                                    type="text"
                                                    name="conditionOfUIC"
                                                    value={formData.conditionOfUIC}
                                                    onChange={handleChange}
                                                    className={`w-full px-3 py-2 border rounded bg-blue-50 dark:bg-blue-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 ${
                                                        validationErrors.conditionOfUIC ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
                                                    }`}
                                                    required
                                                    placeholder={
                                                        originalValues.conditionOfUIC 
                                                            ? `Current: ${originalValues.conditionOfUIC}` 
                                                            : `Enter condition (e.g., Satisfactory)`
                                                    }
                                                />
                                                {validationErrors.conditionOfUIC && (
                                                    <div className="text-red-500 dark:text-red-400 text-xs mt-1">
                                                        {validationErrors.conditionOfUIC}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex">
                                        <label className="w-32 text-sm font-medium text-gray-700 dark:text-gray-300 py-2">Calibration performed At:</label>
                                        <input
                                            type="text"
                                            name="calibrationPerformedAt"
                                            value={formData.calibrationPerformedAt}
                                            onChange={handleChange}
                                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-blue-50 dark:bg-blue-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                                        />
                                    </div>

                                    <div className="flex">
                                        <label className="w-32 text-sm font-medium text-gray-700 dark:text-gray-300 py-2">Reference Std:</label>
                                        <textarea
                                            name="referenceSite"
                                            value={formData.referenceSite}
                                            onChange={handleChange}
                                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 dark:text-gray-200 h-16 resize-none"
                                            readOnly
                                        />
                                    </div>

                                    <div className="flex flex-col">
                                        <div className="flex">
                                            <label className="w-32 text-sm font-medium text-gray-700 dark:text-gray-300 py-2">
                                                Temperature (°C) <span className="text-red-500">*</span>:
                                            </label>
                                            <div className="flex-1">
                                                <input
                                                    type="number"
                                                    name="temperature"
                                                    value={formData.temperature}
                                                    onChange={handleChange}
                                                    className={`w-full px-3 py-2 border rounded bg-blue-50 dark:bg-blue-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 ${
                                                        validationErrors.temperature ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
                                                    }`}
                                                    required
                                                    placeholder={
                                                        originalValues.temperature 
                                                            ? `Current: ${originalValues.temperature}°C` 
                                                            : `Enter temperature`
                                                    }
                                                />
                                                {validationErrors.temperature && (
                                                    <div className="text-red-500 dark:text-red-400 text-xs mt-1">
                                                        {validationErrors.temperature}
                                                    </div>
                                                )}
                                                {rangeValues.temprangemin !== null && rangeValues.temprangemax !== null && (
                                                    <div className="text-red-500 dark:text-red-400 text-xs mt-1">
                                                        Range: {rangeValues.temprangemin}°C - {rangeValues.temprangemax}°C
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col">
                                        <div className="flex">
                                            <label className="w-32 text-sm font-medium text-gray-700 dark:text-gray-300 py-2">
                                                Humidity (%RH) <span className="text-red-500">*</span>:
                                            </label>
                                            <div className="flex-1">
                                                <input
                                                    type="number"
                                                    name="humidity"
                                                    value={formData.humidity}
                                                    onChange={handleChange}
                                                    className={`w-full px-3 py-2 border rounded bg-blue-50 dark:bg-blue-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 ${
                                                        validationErrors.humidity ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
                                                    }`}
                                                    required
                                                    placeholder={
                                                        originalValues.humidity 
                                                            ? `Current: ${originalValues.humidity}%RH` 
                                                            : `Enter humidity`
                                                    }
                                                />
                                                {validationErrors.humidity && (
                                                    <div className="text-red-500 dark:text-red-400 text-xs mt-1">
                                                        {validationErrors.humidity}
                                                    </div>
                                                )}
                                                {rangeValues.humirangemin !== null && rangeValues.humirangemax !== null && (
                                                    <div className="text-red-500 dark:text-red-400 text-xs mt-1">
                                                        Range: {rangeValues.humirangemin}%RH - {rangeValues.humirangemax}%RH
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end mt-8 mb-4">
                                <Button
                                    type="submit"
                                    disabled={!isFormValid()}
                                    className={`px-8 py-2 rounded font-medium transition-colors ${
                                        isFormValid()
                                            ? 'bg-secondary hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white'
                                            : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                                    }`}
                                >
                                    Submit
                                </Button>
                            </div>
                        </form>

                        <div className="flex items-center justify-between px-6 pb-6">
                            <button className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">‹</button>
                            <div className="flex-1 mx-4">
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                    <div className="bg-gray-400 dark:bg-gray-500 h-2 rounded-full transition-all duration-300" style={{ width: '25%' }}></div>
                                </div>
                            </div>
                            <button className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">›</button>
                        </div>
                    </div>
                </div>
            </Page>
        </div>
    );
};

export default Calibratestep1;