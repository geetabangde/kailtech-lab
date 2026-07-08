import { useParams, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import Select from "react-select";
import { Button, Input } from "components/ui";
import { Page } from "components/shared/Page";
import { toast } from "sonner";
import axios from "axios";
import { JWT_HOST_API } from "configs/auth.config";

export default function EditCmcScopeSheet() {
  const { id } = useParams();
  const navigate = useNavigate();
  const permissions = JSON.parse(localStorage.getItem("userPermissions") || "[]");

  useEffect(() => {
    if (!permissions.includes(84)) {
      navigate("/dashboards");
    }
  }, [navigate, permissions]);
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    parameter: "",
    mode: "",
    minfrequency: "",
    maxfrequency: "",
    unit: "",
    leastcount: "",
    mincmc: "",
    maxcmc: "",
    cmctype: "",
    cmcunit: "",
    masters: [], // Array to store selected masters
    location: "",
    remark: ""
  });

  // Options state
  const [sourceOptions, setSourceOptions] = useState([]);
  const [unitOptions, setUnitOptions] = useState([]);
  const [instrumentOptions, setInstrumentOptions] = useState([]);
  const [masterOptions, setMasterOptions] = useState([]);

  const API_BASE_URL = JWT_HOST_API;

  const getAuthToken = () => {
    return localStorage.getItem('authToken') || sessionStorage.getItem('token') || 'your-auth-token-here';
  };

  const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });

  apiClient.interceptors.request.use(
    (config) => {
      const token = getAuthToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please check your token.');
      }
      throw error;
    }
  );

  // Fetch options functions
  const fetchMasterOptions = async () => {
    try {
      const response = await apiClient.get('/material/get-master-list');
      if (response.data.status === "true" && response.data.data) {
        setMasterOptions(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching master options:', err);
    }
  };

  const fetchInstrumentOptions = async () => {
    try {
      const response = await apiClient.get('/get-instrumentNames');
      if (response.data.status === "true" && response.data.data) {
        setInstrumentOptions(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching instrument options:', err);
    }
  };

  const fetchSourceOptions = async () => {
    try {
      const response = await apiClient.get('/get-source');
      if (response.data.status === "true" && response.data.data) {
        setSourceOptions(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching source options:', err);
    }
  };

  const fetchUnitOptions = async () => {
    try {
      const response = await apiClient.get('/master/units-list');
      if (response.data.status === "true" && response.data.data) {
        setUnitOptions(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching unit options:', err);
    }
  };

  // Fetch CMC Scope data by ID
  const fetchCmcScopeData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/calibrationoperations/get-cmcscope-byid/${id}`);
      const result = response.data;

      console.log('API Response:', result); // Debug log

      if (result.status === "true" && result.data && result.data.length > 0) {
        const data = result.data[0]; // Get first item from array

        console.log('Extracted data:', data); // Debug log

        // Handle masters - convert from string to array of select options
        let mastersArray = [];
        if (data.masters) {
          const masterIds = data.masters.toString().split(',').map(id => id.trim()).filter(id => id);
          mastersArray = masterIds
            .map((masterId) => masterOptions.find(m => m.id === parseInt(masterId)))
            .filter(Boolean)
            .map((m) => ({
              value: m.id,
              label: `${m.name}${m.idno ? ` (${m.idno})` : ""}`
            }));
        }

        const unitId = data.unit ? parseInt(data.unit) : "";
        const cmcUnitId = data.cmcunit ? parseInt(data.cmcunit) : "";

        setFormData({
          parameter: data.parameter || "",
          mode: data.mode || "",
          minfrequency: data.minfrequency ? data.minfrequency.toString() : "",
          maxfrequency: data.maxfrequency ? data.maxfrequency.toString() : "",
          unit: unitId,
          leastcount: data.leastcount ? data.leastcount.toString() : "",
          mincmc: data.mincmc ? data.mincmc.toString() : "",
          maxcmc: data.maxcmc ? data.maxcmc.toString() : "",
          cmctype: data.cmctype || "Absolute",
          cmcunit: cmcUnitId,
          masters: mastersArray,
          location: data.location || "Site",
          remark: data.remark || ""
        });

        console.log('Form data set:', {
          parameter: data.parameter || "",
          mode: data.mode || "",
          minfrequency: data.minfrequency ? data.minfrequency.toString() : "",
          maxfrequency: data.maxfrequency ? data.maxfrequency.toString() : "",
          unit: unitId,
          leastcount: data.leastcount ? data.leastcount.toString() : "",
          mincmc: data.mincmc ? data.mincmc.toString() : "",
          maxcmc: data.maxcmc ? data.maxcmc.toString() : "",
          cmctype: data.cmctype || "Absolute",
          cmcunit: cmcUnitId,
          masters: mastersArray,
          location: data.location || "Site",
          remark: data.remark || ""
        }); // Debug log

      } else {
        toast.error(result.message || "Failed to load CMC scope data.");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      toast.error("Something went wrong while loading CMC scope data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchInstrumentOptions(),
          fetchSourceOptions(),
          fetchUnitOptions(),
          fetchMasterOptions()
        ]);
      } catch (err) {
        console.error('Error loading dropdown data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (masterOptions.length > 0 && unitOptions.length > 0) {
      fetchCmcScopeData();
    }
  }, [id, masterOptions, unitOptions]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const handleMasterChange = (selected) => {
    setFormData(prev => ({
      ...prev,
      masters: selected || []
    }));
  };

  const instrumentSelectOptions = instrumentOptions.map((instrument) => ({
    value: instrument.name,
    label: instrument.name
  }));

  const sourceSelectOptions = sourceOptions.map((source) => ({
    value: source.name,
    label: source.name
  }));

  const unitSelectOptions = unitOptions.map((unit) => ({
    value: unit.id,
    label: unit.name || unit.unit || unit.unitdesc || unit.description || "-"
  }));

  const cmcUnitSelectOptions = unitOptions
    .filter((unit) => unit.description)
    .map((unit) => ({
      value: unit.id,
      label: unit.description
    }));

  const masterSelectOptions = masterOptions.map((master) => ({
    value: master.id,
    label: `${master.name}${master.idno ? ` (${master.idno})` : ""}`
  }));

  const selectStyles = {
    control: (base, state) => ({
      ...base,
      minHeight: "38px",
      borderColor: state.isFocused ? "#3b82f6" : "#d1d5db",
      boxShadow: state.isFocused ? "0 0 0 1px #3b82f6" : "none",
      ":hover": { borderColor: "#93c5fd" }
    }),
    menu: (base) => ({ ...base, zIndex: 50 })
  };

  // Custom validation function
  const validateForm = () => {
    const newErrors = {};

    if (!formData.parameter.trim()) {
      newErrors.parameter = "Parameter/Instrument is required";
    }

    if (!formData.mode.trim()) {
      newErrors.mode = "Source is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form before submitting
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const unitId = parseInt(formData.unit) || 0;
      const cmcUnitId = parseInt(formData.cmcunit) || 0;

      const payload = {
        parameter: Array.isArray(formData.parameter)
          ? formData.parameter
          : formData.parameter.split(',').map(p => p.trim()),
        mode: formData.mode,
        minfrequency: parseInt(formData.minfrequency) || 0,
        maxfrequency: parseInt(formData.maxfrequency) || 0,
        unit: unitId,
        leastcount: parseFloat(formData.leastcount) || 0,
        mincmc: parseFloat(formData.mincmc) || 0,
        maxcmc: parseFloat(formData.maxcmc) || 0,
        cmctype: formData.cmctype || "",
        cmcunit: cmcUnitId,
        masters: (formData.masters || []).map((m) => m?.value ?? m?.id ?? m) || [],
        location: formData.location || "",
        remark: formData.remark || ""
      };

      console.log("Updating payload:", payload);

      const response = await apiClient.post(`/calibrationoperations/update-cmcscope/${id}`, payload);
      const result = response.data;

      if (result.status === true || result.status === "true") {
        toast.success("CMC Scope updated successfully ✅", {
          duration: 1000,
          icon: "✅",
        });
        navigate("/dashboards/calibration-operations/cmc-scope-sheet");
      } else {
        toast.error(result.message || "Failed to update CMC scope ❌");
      }
    } catch (err) {
      console.error("Update error:", err);
      const errorMessage = err.response?.data?.message || err.message || "Unknown error occurred";
      toast.error("Something went wrong while updating: " + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !formData.parameter && masterOptions.length === 0) {
    return (
      <Page title="Edit CMC Scope">
        <div className="flex h-[60vh] items-center justify-center text-gray-600">
          <svg className="animate-spin h-6 w-6 mr-2 text-blue-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z"></path>
          </svg>
          Loading Edit CMC Scope data...
        </div>
      </Page>
    );
  }

  return (
    <Page title="Edit CMC Scope">
      <div className="p-6">
        {/* Header + Back Button */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
            Edit CMC Scope
          </h2>
          <Button
            variant="outline"
            className="text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
            onClick={() => navigate("/dashboards/calibration-operations/cmc-scope-sheet")}
          >
            ← Back to CMC Scope List
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">

          {/* Quantity Measured/Instrument */}
          <div className="flex items-center">
            <label className="w-64 text-right pr-4 text-sm font-medium text-gray-700">
              Quantity Measured/Instrument *
            </label>
            <div className="flex-1">
              <Select
                options={instrumentSelectOptions}
                value={instrumentSelectOptions.find((o) => o.value === formData.parameter) || null}
                onChange={(opt) => handleInputChange('parameter', opt ? opt.value : "")}
                placeholder="Select Instrument"
                isSearchable
                styles={selectStyles}
                classNamePrefix="react-select"
                className="react-select-container"
              />
              {errors.parameter && (
                <p className="text-red-500 text-sm mt-1">{errors.parameter}</p>
              )}
            </div>
          </div>

          {/* Source */}
          <div className="flex items-center">
            <label className="w-64 text-right pr-4 text-sm font-medium text-gray-700">
              Source *
            </label>
            <div className="flex-1">
              <Select
                options={sourceSelectOptions}
                value={sourceSelectOptions.find((o) => o.value === formData.mode) || null}
                onChange={(opt) => handleInputChange('mode', opt ? opt.value : "")}
                placeholder="Select Source"
                isSearchable
                styles={selectStyles}
                classNamePrefix="react-select"
                className="react-select-container"
              />
              {errors.mode && (
                <p className="text-red-500 text-sm mt-1">{errors.mode}</p>
              )}
            </div>
          </div>

          {/* Min Frequency/Range */}
          <div className="flex items-center">
            <label className="w-64 text-right pr-4 text-sm font-medium text-gray-700">
              Min Frequency/Range
            </label>
            <div className="flex-1">
              <Input
                type="number"
                placeholder="e.g., 1, 50, 100"
                value={formData.minfrequency}
                onChange={(e) => handleInputChange('minfrequency', e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          {/* Max Frequency/Range */}
          <div className="flex items-center">
            <label className="w-64 text-right pr-4 text-sm font-medium text-gray-700">
              Max Frequency/Range
            </label>
            <div className="flex-1">
              <Input
                type="number"
                placeholder="e.g., 10000, 5000, 40"
                value={formData.maxfrequency}
                onChange={(e) => handleInputChange('maxfrequency', e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          {/* Unit */}
          <div className="flex items-center">
            <label className="w-64 text-right pr-4 text-sm font-medium text-gray-700">
              Unit
            </label>
            <div className="flex-1">
              <Select
                options={unitSelectOptions}
                value={unitSelectOptions.find((o) => String(o.value) === String(formData.unit)) || null}
                onChange={(opt) => handleInputChange('unit', opt ? opt.value : "")}
                placeholder="Select Unit"
                isSearchable
                styles={selectStyles}
                classNamePrefix="react-select"
                className="react-select-container"
              />
            </div>
          </div>

          {/* UUC Leastcount */}
          <div className="flex items-center">
            <label className="w-64 text-right pr-4 text-sm font-medium text-gray-700">
              UUC Leastcount
            </label>
            <div className="flex-1">
              <Input
                type="number"
                step="any"
                placeholder="e.g., 0.01, 0.1"
                value={formData.leastcount}
                onChange={(e) => handleInputChange('leastcount', e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          {/* Min Calibration Measurement Capability */}
          <div className="flex items-center">
            <label className="w-64 text-right pr-4 text-sm font-medium text-gray-700">
              Min Calibration Measurement Capability (±)
            </label>
            <div className="flex-1">
              <Input
                type="text"
                placeholder="e.g., 0.05, 0.66, 0.4"
                value={formData.mincmc}
                onChange={(e) => handleInputChange('mincmc', e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          {/* Max Calibration Measurement Capability */}
          <div className="flex items-center">
            <label className="w-64 text-right pr-4 text-sm font-medium text-gray-700">
              Max Calibration Measurement Capability (±)
            </label>
            <div className="flex-1">
              <Input
                type="text"
                placeholder="e.g., 0.10, 0.37, 13.2"
                value={formData.maxcmc}
                onChange={(e) => handleInputChange('maxcmc', e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          {/* CMC Type */}
          <div className="flex items-center">
            <label className="w-64 text-right pr-4 text-sm font-medium text-gray-700">
              CMC Type
            </label>
            <div className="flex-1">
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.cmctype}
                onChange={(e) => handleInputChange('cmctype', e.target.value)}
              >
                <option value="Absolute">Absolute</option>
                <option value="Percentage">%</option>
              </select>
            </div>
          </div>

          {/* CMC Unit */}
          <div className="flex items-center">
            <label className="w-64 text-right pr-4 text-sm font-medium text-gray-700">
              CMC Unit
            </label>
            <div className="flex-1">
              <Select
                options={cmcUnitSelectOptions}
                value={cmcUnitSelectOptions.find((o) => String(o.value) === String(formData.cmcunit)) || null}
                onChange={(opt) => handleInputChange('cmcunit', opt ? opt.value : "")}
                placeholder="Select CMC Unit"
                isSearchable
                styles={selectStyles}
                classNamePrefix="react-select"
                className="react-select-container"
              />
            </div>
          </div>

          {/* Master */}
          <div className="flex items-center">
            <label className="w-64 text-right pr-4 text-sm font-medium text-gray-700">
              Master
            </label>
            <div className="flex-1">
              <Select
                options={masterSelectOptions}
                value={formData.masters}
                onChange={handleMasterChange}
                placeholder="Select Master"
                isSearchable
                isMulti
                styles={selectStyles}
                classNamePrefix="react-select"
                className="react-select-container"
              />
            </div>
          </div>

          {/* Location */}
          <div className="flex items-center">
            <label className="w-64 text-right pr-4 text-sm font-medium text-gray-700">
              Location
            </label>
            <div className="flex-1">
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
              >
                <option value="Site">Site</option>
                <option value="Lab">Lab</option>
              </select>
            </div>
          </div>

          {/* Remark */}
          <div className="flex items-start">
            <label className="w-64 text-right pr-4 pt-2 text-sm font-medium text-gray-700">
              Remark
            </label>
            <div className="flex-1">
              <textarea
                value={formData.remark}
                onChange={(e) => handleInputChange('remark', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows="3"
                placeholder="Enter any remarks or comments"
              />
            </div>
          </div>

          {/* Update Button */}
          <div className="flex justify-end pt-6">
            <Button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z"
                    ></path>
                  </svg>
                  Updating...
                </div>
              ) : (
                "Update Scope"
              )}
            </Button>
          </div>
        </form>
      </div>
    </Page>
  );
}

