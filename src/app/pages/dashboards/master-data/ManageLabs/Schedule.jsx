import { useState, useEffect } from 'react';
import { X, Plus, CheckCircle, AlertCircle, Info } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router';
import { JWT_HOST_API } from "configs/auth.config";

// Toast Component
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const icons = {
    success: <CheckCircle size={20} className="text-green-600" />,
    error: <AlertCircle size={20} className="text-red-600" />,
    info: <Info size={20} className="text-blue-600" />
  };

  const colors = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    info: 'bg-blue-50 border-blue-200'
  };

  return (
    <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg ${colors[type]} animate-slide-in`}>
      {icons[type]}
      <span className="text-sm font-medium text-gray-800">{message}</span>
      <button onClick={onClose} className="ml-2 text-gray-500 hover:text-gray-700">
        <X size={16} />
      </button>
    </div>
  );
}

// Base URL for the API
const API_BASE_URL = `${JWT_HOST_API}/master`;

// Static frequency options
const FREQUENCY_OPTIONS = [
  'Once a day',
  'Twice a day',
  'Monthly',
  'Yearly'
];

export default function AddLabUI() {
  const [parameters, setParameters] = useState([{ id: Date.now(), type: '', frequency: '', dbId: null }]);
  const [loading, setLoading] = useState(false);
  const [typeOptions, setTypeOptions] = useState([]);
  const [fetchingData, setFetchingData] = useState(true);
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();

  // Toast helper function
  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };

  // Get labid from URL
  const getLabIdFromUrl = () => {
    const pathname = window.location.pathname;
    const parts = pathname.split('/');
    const labId = parts[parts.length - 1];
    return labId;
  };

  // Get token from localStorage or sessionStorage
  const getAuthToken = () => {
    const tokenKeys = ['token', 'authToken', 'auth_token', 'accessToken'];

    for (const key of tokenKeys) {
      let token = window.localStorage.getItem(key);
      if (token) return token;

      token = window.sessionStorage.getItem(key);
      if (token) return token;
    }

    return null;
  };

  // Function to get common headers
  const getAuthHeaders = (token) => {
    const headers = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  // Fetch data from API
  useEffect(() => {
    const fetchScheduleData = async () => {
      try {
        const labId = getLabIdFromUrl();
        const token = getAuthToken();

        console.log('Token:', token ? 'Found' : 'Not Found');
        console.log('Lab ID:', labId);

        const headers = getAuthHeaders(token);

        const response = await axios.get(
          `${API_BASE_URL}/get-environmental-schedule/${labId}`,
          { headers }
        );

        const result = response.data;

        if (result.status === "true" && result.data && Array.isArray(result.data)) {
          const fetchedData = result.data;

          const uniqueTypes = [...new Set(fetchedData.map(item => item.type))].filter(Boolean);

          setTypeOptions(uniqueTypes.sort());

          if (fetchedData.length > 0) {
            const initialParams = fetchedData.map((item, index) => ({
              id: item.id || Date.now() + index,
              type: item.type || '',
              frequency: item.frequency || '',
              dbId: item.id || null
            }));
            setParameters(initialParams);
          } else {
            setParameters([{ id: Date.now(), type: '', frequency: '', dbId: null }]);
          }
        } else {
          setParameters([{ id: Date.now(), type: '', frequency: '', dbId: null }]);
        }
      } catch (error) {
        console.error('Error fetching schedule data:', error);

        if (error.response) {
          console.error('Response error:', error.response.status, error.response.data);
          const errorMsg = error.response.data.message || error.response.data.error || 'Failed to fetch data';
          showToast(`API Error: ${error.response.status} - ${errorMsg}`, 'error');
        } else if (error.request) {
          console.error('Request error:', error.request);
          showToast('Network error: Unable to reach the server', 'error');
        } else {
          console.error('Error:', error.message);
          showToast(`Error: ${error.message}`, 'error');
        }

        setParameters([{ id: Date.now(), type: '', frequency: '', dbId: null }]);
      } finally {
        setFetchingData(false);
      }
    };

    fetchScheduleData();
  }, []);

  const addNewParameter = () => {
    const newId = Date.now() + Math.random();
    setParameters([...parameters, { id: newId, type: '', frequency: '', dbId: null }]);
  };

  const updateParameter = (id, field, value) => {
    setParameters(parameters.map(p =>
      p.id === id ? { ...p, [field]: value } : p
    ));

    if (field === 'type' && !typeOptions.includes(value)) {
      if (value.trim() !== '') {
        setTypeOptions([...typeOptions, value].sort());
      }
    }
  };

  const handleDeleteParameter = async (param) => {
    if (parameters.length <= 1) {
      showToast("Cannot remove the last parameter row", 'error');
      return;
    }

    if (param.dbId) {
      const confirmDelete = window.confirm(`Are you sure you want to delete this parameter?`);
      if (!confirmDelete) return;

      setLoading(true);
      try {
        const token = getAuthToken();
        if (!token) {
          showToast('Authentication token not found. Please login again', 'error');
          setLoading(false);
          return;
        }
        const headers = getAuthHeaders(token);

        const deleteUrl = `${API_BASE_URL}/delete-environmental-schedule/${param.dbId}`;
        console.log('Deleting:', deleteUrl);

        const response = await axios.delete(deleteUrl, { headers });

        if (response.data.status === "true" || response.data.status === true) {
          showToast(`Parameter '${param.type}' deleted successfully`, 'success');

          setParameters(parameters.filter(p => p.id !== param.id));
        } else {
          showToast("Failed to delete schedule: " + (response.data.message || "Unknown error"), 'error');
        }
      } catch (error) {
        console.error('Error deleting schedule:', error);
        const errorMsg = error.response?.data?.message || 'Failed to delete parameter due to an error';
        showToast(`Deletion Error: ${errorMsg}`, 'error');
      } finally {
        setLoading(false);
      }

    } else {
      setParameters(parameters.filter(p => p.id !== param.id));
      showToast('Parameter removed', 'info');
    }
  };

  const handleSaveSchedule = async () => {
    const invalidParams = parameters.filter(p => !p.type || !p.frequency);

    if (invalidParams.length > 0) {
      showToast("Please select/enter both Type and Frequency for all parameters", 'error');
      return;
    }

    setLoading(true);
    try {
      const labId = getLabIdFromUrl();
      const token = getAuthToken();

      console.log('Saving with Token:', token ? 'Found' : 'Not Found');

      const headers = getAuthHeaders(token);

      if (!token) {
        showToast('Authentication token not found. Please login again', 'error');
        setLoading(false);
        return;
      }

      const payload = {
        id: parameters.map(param => param.dbId || 0),
        type: parameters.map(param => param.type),
        frequency: parameters.map(param => param.frequency),
        labid: parseInt(labId)
      };

      console.log('Sending payload:', JSON.stringify(payload, null, 2));

      const response = await axios.post(
        `${API_BASE_URL}/add-environmental-schedule`,
        payload,
        { headers }
      );

      console.log('API Response:', response.data);

      if (response.data.status === "true" || response.data.status === true) {
        showToast("Schedule saved successfully!", 'success');

        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        showToast("Failed to save schedule: " + (response.data.message || "Unknown error"), 'error');
      }
    } catch (error) {
      console.error('Error saving schedule:', error);

      if (error.response) {
        console.error('Response error:', error.response.status, error.response.data);
        const errorMsg = error.response.data.message || error.response.data.error || 'Failed to save schedule';
        showToast(`API Error: ${error.response.status} - ${errorMsg}`, 'error');
      } else if (error.request) {
        console.error('Request error:', error.request);
        showToast('Network error: Unable to reach the server', 'error');
      } else {
        console.error('Error:', error.message);
        showToast(`Error: ${error.message}`, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  if (fetchingData) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="flex h-[60vh] items-center justify-center text-gray-600">
          <svg className="animate-spin h-6 w-6 mr-2 text-blue-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z"></path>
          </svg>
          Loading Schedule Data...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" style={{ background: "white" }}>
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-xl font-semibold text-gray-800">Add Lab Schedule</h1>
          <button
            className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
            onClick={() =>
              navigate("/dashboards/master-data/manage-labs")
            }
          >
            ← Back to Manage Labs
          </button>
        </div>
      </div>

      <div className="p-6 max-w-4xl mx-auto">

        {/* Parameters Section */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Environmental Schedule Parameters</h2>

            {parameters.map((param, index) => (
              <div key={param.id} className="flex items-center gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold text-sm">
                  {index + 1}
                </div>

                <div className="flex-1">
                  <input
                    list={`type-options-${param.id}`}
                    type="text"
                    value={param.type}
                    onChange={(e) => updateParameter(param.id, 'type', e.target.value)}
                    placeholder="Enter or select Type"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  />
                  <datalist id={`type-options-${param.id}`}>
                    {[...new Set(typeOptions)].map(option => (
                      <option key={option} value={option} />
                    ))}
                  </datalist>
                </div>

                <div className="flex-1">
                  <select
                    value={param.frequency}
                    onChange={(e) => updateParameter(param.id, 'frequency', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    <option value="">Select Frequency</option>
                    {FREQUENCY_OPTIONS.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => handleDeleteParameter(param)}
                  disabled={loading || parameters.length <= 1}
                  className={`p-2 rounded-md transition-colors ${loading || parameters.length <= 1
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-red-600 text-white hover:bg-red-700'
                    }`}
                  title={parameters.length <= 1 ? "Cannot remove last parameter" : (param.dbId ? "Delete schedule permanently" : "Remove parameter row")}
                >
                  <X size={16} />
                </button>
              </div>
            ))}

            <button
              onClick={addNewParameter}
              disabled={loading}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <Plus size={16} />
              Add New Parameter
            </button>
          </div>
        </div>

        {/* Save Schedule Button */}
        <div className="mt-6 flex gap-4">
          <button
            onClick={handleSaveSchedule}
            disabled={loading}
            className="flex-1 sm:flex-initial px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z"></path>
                </svg>
                Saving...
              </div>
            ) : (
              "💾 Save Schedule"
            )}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}