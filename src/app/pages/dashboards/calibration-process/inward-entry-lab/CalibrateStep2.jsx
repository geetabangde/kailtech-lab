//-------------------------------moin new code -----------------------------

import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router';
// import axios from 'axios';
import axios from "utils/axios"
import Select from 'react-select';
import { Page } from "components/shared/Page";
import { Button } from "components/ui";
import { toast } from "sonner";

const Calibratestep2 = () => {
    const navigate = useNavigate();
    const { id, itemId } = useParams();
    const location = useLocation();

    // Get URL parameters
    const searchParams = new URLSearchParams(window.location.search);
    const caliblocation = searchParams.get("caliblocation") || "Lab";
    const calibacc = searchParams.get("calibacc") || "Nabl";

    // Get data from Step1 (passed via navigation state)
    const step1Data = location.state?.step1Data;

    // State for API data
    const [instrumentData, setInstrumentData] = useState(null);
    const [inwardData, setInwardData] = useState(null);
    const [labData, setLabData] = useState(null);
    const [instrumentInfo, setInstrumentInfo] = useState(null);
    const [unitsList, setUnitsList] = useState([]);
    const [modesList, setModesList] = useState([]);
    const [mastersList, setMastersList] = useState([]);
    const [supportMastersList, setSupportMastersList] = useState([]);
    const [calibrationPoints, setCalibrationPoints] = useState([]);
    // const [matrixData, setMatrixData] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Employee authorization check state
    const [isAuthorized, setIsAuthorized] = useState(true);
    const [employeeId, setEmployeeId] = useState(null);

    // Check if user came from step1 with valid data
    const [hasValidStep1Data, setHasValidStep1Data] = useState(false);

    // Detect system theme
    const [theme, setTheme] = useState('light');

    const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);

    // Select For All Point state
    const [selectForAllPoint, setSelectForAllPoint] = useState({
        unit: null,
        mode: '',
        masters: [],
        supportMode: '',
        supportMasters: [],
        repeatable: '3'
    });

    // Dynamic calibration points state
    const [calibPointsState, setCalibPointsState] = useState([]);

    // Backend error handling
    const [generalErrors, setGeneralErrors] = useState([]);
    const [fieldErrors, setFieldErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Filtered lists for dynamic options
    const [filteredMastersList, setFilteredMastersList] = useState([]);
    const [filteredSupportMastersList, setFilteredSupportMastersList] = useState([]);

    // Custom styles for react-select to prevent overlap
    const customSelectStyles = {
        control: (provided, state) => ({
            ...provided,
            minHeight: '38px',
            backgroundColor: theme === 'dark' ? '#374151' : '#ffffff',
            borderColor: state.selectProps.className?.includes('invalid')
                ? '#EF4444'
                : (state.isFocused
                    ? (theme === 'dark' ? '#3B82F6' : '#3B82F6')
                    : (theme === 'dark' ? '#4B5563' : '#D1D5DB')),
            boxShadow: state.isFocused ? '0 0 0 2px rgba(59, 130, 246, 0.5)' : 'none',
            '&:hover': {
                borderColor: state.selectProps.className?.includes('invalid')
                    ? '#EF4444'
                    : (theme === 'dark' ? '#4B5563' : '#9CA3AF')
            }
        }),
        menu: (provided) => ({
            ...provided,
            backgroundColor: theme === 'dark' ? '#374151' : '#ffffff',
            border: theme === 'dark' ? '1px solid #4B5563' : '1px solid #D1D5DB',
            zIndex: 9999,
        }),
        menuPortal: (provided) => ({
            ...provided,
            zIndex: 9999,
        }),
        option: (provided, state) => ({
            ...provided,
            backgroundColor: state.isFocused
                ? (theme === 'dark' ? '#4B5563' : '#F3F4F6')
                : 'transparent',
            color: theme === 'dark' ? '#F9FAFB' : '#111827',
            '&:hover': {
                backgroundColor: theme === 'dark' ? '#4B5563' : '#F3F4F6'
            }
        }),
        singleValue: (provided) => ({
            ...provided,
            color: theme === 'dark' ? '#F9FAFB' : '#111827'
        }),
        multiValue: (provided) => ({
            ...provided,
            backgroundColor: theme === 'dark' ? '#4B5563' : '#E5E7EB'
        }),
        multiValueLabel: (provided) => ({
            ...provided,
            color: theme === 'dark' ? '#F9FAFB' : '#111827'
        }),
        placeholder: (provided) => ({
            ...provided,
            color: theme === 'dark' ? '#9CA3AF' : '#6B7280'
        }),
        input: (provided) => ({
            ...provided,
            color: theme === 'dark' ? '#F9FAFB' : '#111827'
        })
    };

    useEffect(() => {
        // Check system theme
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        setTheme(mediaQuery.matches ? 'dark' : 'light');

        const handleChange = (e) => {
            setTheme(e.matches ? 'dark' : 'light');
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    // Get employee ID from localStorage/sessionStorage
    useEffect(() => {
        const storedEmployeeId = localStorage.getItem('employeeId') || sessionStorage.getItem('employeeId');
        if (storedEmployeeId) {
            setEmployeeId(parseInt(storedEmployeeId));
        }
    }, []);

    useEffect(() => {
        // Check from navigation state, localStorage, or API response
        const storedStep1Data = localStorage.getItem('calibrateStep1Data');
        const parsedStoredData = storedStep1Data ? JSON.parse(storedStep1Data) : null;

        const isValidFromState = step1Data?.temperature && step1Data?.humidity;
        const isValidFromStorage = parsedStoredData?.temperature && parsedStoredData?.humidity;
        const isValidFromApi = instrumentData?.temperature && instrumentData?.humidity;

        const isValid = isValidFromState || isValidFromStorage || isValidFromApi;

        if (isValid) {
            setHasValidStep1Data(true);
        } else if (!loading) {
            setHasValidStep1Data(false);
            toast.error('Please complete Step 1 first');
        }
    }, [step1Data, loading, instrumentData]);

    // Configure axios defaults
    useEffect(() => {
        const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');

        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }

        axios.defaults.headers.common['Content-Type'] = 'application/json';
        axios.defaults.headers.common['Accept'] = 'application/json';
    }, []);

    // ========== MATRIX CODE - COMMENTED OUT ==========
    // Fetch matrix data for a specific point
    // const fetchMatrixForPoint = async (cpid, validityid) => {
    //     try {
    //         const res = await axios.get('calibrationprocess/getscope-matrix-data', {
    //             params: { validityid, cpid }
    //         });
    //         if (res.data.success) {
    //             const options = res.data.data.map(d => ({
    //                 value: d.id,
    //                 label: d.label
    //             }));
    //             setMatrixData(prev => ({ ...prev, [cpid]: options }));
    //         }
    //     } catch (err) {
    //         console.error('Error fetching matrix data for', cpid, err);
    //     }
    // };

    // Fetch calibration details from API
    useEffect(() => {
        const fetchCalibrationDetails = async () => {
            if (!id || !itemId) return;

            try {
                setLoading(true);
                setError(null);

                const response = await axios.get('/calibrationprocess/get-calibration-details-step2', {
                    params: {
                        inward_id: id,
                        instid: itemId,
                        caliblocation: caliblocation,
                        calibacc: calibacc
                    }
                });

                const data = response.data;

                if (data.success === true && data.data) {
                    // Set all API data
                    setInwardData(data.data.inward_entry);

                    // Merge range_info into instrumentData
                    if (data.data.instrument && data.data.range_info) {
                        setInstrumentData({
                            ...data.data.instrument,
                            range_info: data.data.range_info
                        });
                    } else {
                        setInstrumentData(data.data.instrument);
                    }

                    setLabData(data.data.lab);
                    setInstrumentInfo(data.data.list_instrument);
                    setUnitsList(data.data.units || []);
                    setModesList(data.data.modes || []);
                    setMastersList(data.data.master_instruments || []);
                    setSupportMastersList(data.data.support_master_instruments || []);
                    setCalibrationPoints(data.data.calibration_points || []);

                    // Employee authorization check
                    if (data.data.instrument && employeeId) {
                        const allotedTo = parseInt(data.data.instrument.allotedto);
                        if (allotedTo !== employeeId) {
                            setIsAuthorized(false);
                            toast.error('You are not authorized to perform this calibration');
                            setTimeout(() => {
                                navigate(`/dashboards/calibration-process/inward-entry-lab/perform-calibration/${id}?caliblocation=${caliblocation}&calibacc=${calibacc}`);
                            }, 2000);
                            return;
                        }
                    }

                    // CRITICAL FIX: Initialize calibration points with proper unit from API
                    if (data.data.calibration_points && data.data.calibration_points.length > 0) {
                        const initialCalibPoints = data.data.calibration_points.map((point, index) => {
                            // Unit ID ko point se get karo - multiple possible fields check karo
                            const unitId = point.unit || point.calculationunit || point.masterunit;

                            // Unit ka data find karo unitsList se
                            const unitData = data.data.units.find(u => u.id == unitId);

                            // Prepare Unit name and description
                            // const unitName = unitData ? unitData.name : 'N/A';
                            // Use unitName directly from API if available
                            const unitName = point.unitName || (unitData ? unitData.name : 'N/A');


                            const unitType = point.unittype || 'General';

                            return {
                                id: point.id,
                                calibpointid: point.id,
                                label: `(${index + 1}). ${point.point} ${unitName} (${unitType})${point.matrixtype && point.matrixtype !== 'N.A.' ? ' ' + point.matrixtype : ''}`,
                                masterUnit: unitId, // This value will be pre-set
                                masterMode: point.mastermode || '',
                                masters: [],
                                supportMasterMode: point.supportmastermode || '',
                                supportMasters: [],
                                // matrixMasters: [],
                                // validityid: point.validityid,
                                // matrixType: point.matrix_type,
                                repeatable: '3'
                            };
                        });

                        setCalibPointsState(initialCalibPoints);

                        // Set unit for Select For All Point
                        if (initialCalibPoints.length > 0 && initialCalibPoints[0].masterUnit) {
                            setSelectForAllPoint(prev => ({
                                ...prev,
                                unit: initialCalibPoints[0].masterUnit
                            }));
                        }
                    }

                    // Initial filter for masters (all)
                    setFilteredMastersList(data.data.master_instruments || []);
                    setFilteredSupportMastersList(data.data.support_master_instruments || []);

                } else {
                    setError(data.message || 'Failed to fetch calibration details');
                    toast.error(data.message || 'Failed to fetch calibration details');
                }
            } catch (err) {
                console.error('Error fetching calibration details:', err);
                setError('Network error occurred while fetching data');
                toast.error('Network error occurred while fetching data');
            } finally {
                setLoading(false);
            }
        };

        fetchCalibrationDetails();
    }, [id, itemId, caliblocation, calibacc, employeeId, navigate]);

    // ========== MATRIX CODE - COMMENTED OUT ==========
    // Fetch matrix data for points with validityid
    // useEffect(() => {
    //     if (calibPointsState.length > 0) {
    //         const pointsWithMatrix = calibPointsState.filter(p => p.validityid);
    //         pointsWithMatrix.forEach(point => {
    //             if (!matrixData[point.id]) {
    //                 fetchMatrixForPoint(point.id, point.validityid);
    //             }
    //         });
    //     }
    // }, [calibPointsState, matrixData]);

    useEffect(() => {
        // Filter masters for all points based on selectForAllPoint.unit and .mode
        let filteredMasters = mastersList;

        // Only apply unit filter if a unit is selected AND masters have unit information
        if (selectForAllPoint.unit && mastersList.length > 0) {
            // Try different possible field names for unit relationship
            const unitField = mastersList[0].unit_id !== undefined ? 'unit_id' :
                mastersList[0].unitid !== undefined ? 'unitid' :
                    mastersList[0].unit !== undefined ? 'unit' : null;

            if (unitField) {
                filteredMasters = filteredMasters.filter(m => m[unitField] == selectForAllPoint.unit);
            }

            // If no masters found with unit filter, keep all masters (fallback)
            if (filteredMasters.length === 0) {
                console.warn('No masters found for selected unit, showing all masters');
                filteredMasters = mastersList;
            }
        }

        // Apply mode filter only if mode is specified and not 'Not Specified'
        if (selectForAllPoint.mode && selectForAllPoint.mode !== 'Not Specified' && filteredMasters.length > 0) {
            const modeField = filteredMasters[0].mode !== undefined ? 'mode' :
                filteredMasters[0].mastermode !== undefined ? 'mastermode' : null;

            if (modeField) {
                const modeFiltered = filteredMasters.filter(m => m[modeField] === selectForAllPoint.mode);
                // Only apply mode filter if we found matches
                if (modeFiltered.length > 0) {
                    filteredMasters = modeFiltered;
                }
            }
        }

        setFilteredMastersList(filteredMasters);

        // Same logic for support masters
        let filteredSupport = supportMastersList;

        if (selectForAllPoint.unit && supportMastersList.length > 0) {
            const unitField = supportMastersList[0].unit_id !== undefined ? 'unit_id' :
                supportMastersList[0].unitid !== undefined ? 'unitid' :
                    supportMastersList[0].unit !== undefined ? 'unit' : null;

            if (unitField) {
                filteredSupport = filteredSupport.filter(sm => sm[unitField] == selectForAllPoint.unit);
            }

            // Fallback if no matches
            if (filteredSupport.length === 0) {
                console.warn('No support masters found for selected unit, showing all support masters');
                filteredSupport = supportMastersList;
            }
        }

        if (selectForAllPoint.supportMode && selectForAllPoint.supportMode !== 'Not Specified' && filteredSupport.length > 0) {
            const modeField = filteredSupport[0].mode !== undefined ? 'mode' :
                filteredSupport[0].supportmastermode !== undefined ? 'supportmastermode' : null;

            if (modeField) {
                const modeFiltered = filteredSupport.filter(sm => sm[modeField] === selectForAllPoint.supportMode);
                if (modeFiltered.length > 0) {
                    filteredSupport = modeFiltered;
                }
            }
        }

        setFilteredSupportMastersList(filteredSupport);

    }, [selectForAllPoint.unit, selectForAllPoint.mode, selectForAllPoint.supportMode, mastersList, supportMastersList]);

    // Individual point filtering functions
    const getFilteredMastersForPoint = (point) => {
        let filtered = mastersList;

        if (point.masterUnit && mastersList.length > 0) {
            const unitField = mastersList[0].unit_id !== undefined ? 'unit_id' :
                mastersList[0].unitid !== undefined ? 'unitid' :
                    mastersList[0].unit !== undefined ? 'unit' : null;

            if (unitField) {
                const unitFiltered = filtered.filter(m => m[unitField] == point.masterUnit);
                if (unitFiltered.length > 0) {
                    filtered = unitFiltered;
                }
            }
        }

        if (point.masterMode && point.masterMode !== 'Not Specified' && filtered.length > 0) {
            const modeField = filtered[0].mode !== undefined ? 'mode' :
                filtered[0].mastermode !== undefined ? 'mastermode' : null;

            if (modeField) {
                const modeFiltered = filtered.filter(m => m[modeField] === point.masterMode);
                if (modeFiltered.length > 0) {
                    filtered = modeFiltered;
                }
            }
        }

        return filtered;
    };

    const getFilteredSupportMastersForPoint = (point) => {
        let filtered = supportMastersList;

        if (point.masterUnit && supportMastersList.length > 0) {
            const unitField = supportMastersList[0].unit_id !== undefined ? 'unit_id' :
                supportMastersList[0].unitid !== undefined ? 'unitid' :
                    supportMastersList[0].unit !== undefined ? 'unit' : null;

            if (unitField) {
                const unitFiltered = filtered.filter(sm => sm[unitField] == point.masterUnit);
                if (unitFiltered.length > 0) {
                    filtered = unitFiltered;
                }
            }
        }

        if (point.supportMasterMode && point.supportMasterMode !== 'Not Specified' && filtered.length > 0) {
            const modeField = filtered[0].mode !== undefined ? 'mode' :
                filtered[0].supportmastermode !== undefined ? 'supportmastermode' : null;

            if (modeField) {
                const modeFiltered = filtered.filter(sm => sm[modeField] === point.supportMasterMode);
                if (modeFiltered.length > 0) {
                    filtered = modeFiltered;
                }
            }
        }

        return filtered;
    };

    // ========== MATRIX CODE - COMMENTED OUT ==========
    // const getMatrixOptionsForPoint = (pointId) => {
    //     return matrixData[pointId] || [];
    // };

    // Helper functions
    const formatDate = (dateString) => {
        if (!dateString || dateString === '0000-00-00') return '';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-GB');
        } catch {
            return dateString;
        }
    };

    const formatDateTime = (dateTimeString) => {
        if (!dateTimeString || dateTimeString === '0000-00-00 00:00:00') return '';
        try {
            const date = new Date(dateTimeString);
            return date.toLocaleDateString('en-GB') + ' ' + date.toLocaleTimeString('en-GB');
        } catch {
            return dateTimeString;
        }
    };

    const getMasterString = (master) => {
        let result = master.name || '';
        const parts = [];
        if (master.idno && master.idno !== 'N.A' && master.idno !== 'N/A') parts.push(master.idno);
        if (master.serialno && master.serialno !== 'N.A' && master.serialno !== 'N/A') parts.push(master.serialno);
        if (parts.length > 0) {
            result += ` (${parts.join('/')})`;
        }
        if (master.certificateno && master.certificateno !== 'N.A' && master.certificateno !== 'N/A') {
            result += ` (${master.certificateno})`;
        }
        return result;
    };

    const getUnitOptions = () => {
        return unitsList.map(unit => ({
            value: unit.id,
            label: `(${unit.description}) ${unit.name}`
        }));
    };

    const getModeOptions = () => [
        { value: 'Not Specified', label: 'Not Specified' },
        ...modesList.map(mode => ({ value: mode.name, label: mode.name }))
    ];

    const getSupportModeOptions = () => [
        { value: 'Not Specified', label: 'Not Specified' },
        { value: 'Measure', label: 'Measure' },
        { value: 'Source', label: 'Source' }
    ];

    const getMasterOptions = (masters) => masters.map(master => ({ value: master.id, label: getMasterString(master) }));

    // Handle Select For All Point changes
    const handleSelectForAllPointChange = (field, selected) => {
        let value;
        const multiFields = ['masters', 'supportMasters'];
        if (multiFields.includes(field)) {
            value = selected ? selected.map(s => s.value) : [];
        } else if (field === 'repeatable') {
            value = selected;
        } else {
            value = selected ? selected.value : null;
        }

        // Update selectForAllPoint state
        setSelectForAllPoint(prev => ({ ...prev, [field]: value }));

        // Apply to all calibration points
        setCalibPointsState(prev => prev.map(point => {
            // For unit and mode, we need to map the field names correctly
            if (field === 'unit') {
                return { ...point, masterUnit: value };
            } else if (field === 'mode') {
                return { ...point, masterMode: value };
            } else if (field === 'supportMode') {
                return { ...point, supportMasterMode: value };
            } else {
                // For other fields (masters, supportMasters, repeatable), use the field name as is
                return { ...point, [field]: value };
            }
        }));
    };

    // Handle individual calibration point changes
    const handleCalibPointChange = (pointId, field, selected) => {
        let value;
        const multiFields = ['masters', 'supportMasters']; // Removed 'matrixMasters'
        if (multiFields.includes(field)) {
            value = selected ? selected.map(s => s.value) : [];
        } else if (field === 'repeatable') {
            value = selected;
        } else {
            value = selected ? selected.value : null;
        }

        console.log(`Updating point ${pointId}, field ${field}, value:`, value);

        setCalibPointsState(prev =>
            prev.map(point =>
                point.id === pointId ? { ...point, [field]: value } : point
            )
        );
    };

    // Debug function
    const debugCalibPointsState = () => {
        console.log('Current calibPointsState:', calibPointsState);
        calibPointsState.forEach(point => {
            console.log(`Point ${point.id}:`, {
                calibpointid: point.calibpointid,
                // matrixMasters: point.matrixMasters,
                // validityid: point.validityid,
                // matrixType: point.matrixType
            });
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Clear previous errors
        setGeneralErrors([]);
        setFieldErrors({});

        // Debug calibration points state
        debugCalibPointsState();

        // Additional authorization check before submission
        if (!isAuthorized) {
            toast.error('You are not authorized to perform this calibration');
            return;
        }

        try {
            setIsSubmitting(true);

            // Prepare base data for submission
            const submissionData = {
                caliblocation: caliblocation,
                calibacc: calibacc,
                issue: issueDate,
                inwardid: parseInt(id),
                id: parseInt(itemId),
                calibpointid: calibPointsState.map(point => point.calibpointid)
            };

            // Add dynamic calibration points data
            calibPointsState.forEach((point) => {
                const pointNumber = point.calibpointid;

                // Required fields for all points
                submissionData[`unit${pointNumber}`] = parseInt(point.masterUnit);
                submissionData[`mastermode${pointNumber}`] = point.masterMode;

                // Handle masters - array format with proper validation
                if (point.masters && Array.isArray(point.masters) && point.masters.length > 0) {
                    submissionData[`mastercalibid${pointNumber}`] = point.masters;
                } else {
                    submissionData[`mastercalibid${pointNumber}`] = [];
                }

                // ========== MATRIX CODE - COMMENTED OUT ==========
                // Handle matrix
                // if (point.validityid) {
                //     if (point.matrixMasters && Array.isArray(point.matrixMasters) && point.matrixMasters.length > 0) {
                //         submissionData[`scopematrix${pointNumber}`] = point.matrixMasters;
                //         console.log(`Adding matrix for point ${pointNumber}:`, point.matrixMasters);
                //     } else {
                //         console.warn(`Point ${pointNumber} has validityid but no matrix selected`);
                //     }
                // }

                // Handle support masters with proper validation
                if (instrumentInfo?.supportmaster === "Yes") {
                    submissionData[`supportmastermode${pointNumber}`] = point.supportMasterMode;
                    if (point.supportMasters && Array.isArray(point.supportMasters) && point.supportMasters.length > 0) {
                        submissionData[`supportmastercalibid${pointNumber}`] = point.supportMasters;
                    } else {
                        submissionData[`supportmastercalibid${pointNumber}`] = [];
                    }
                }

                // Add repeatable value if suffix is "dw"
                if (instrumentInfo?.suffix === "dw") {
                    submissionData[`repeatable${pointNumber}`] = parseFloat(point.repeatable) || 3;
                }
            });

            console.log('Final Submission Data:', submissionData);

            // Submit to API
            const response = await axios.post('/calibrationprocess/add-step2-data', submissionData);

            if (response.data.status === "true" || response.data.success === true) {
                // Define step2Data here, before using it
                const step2Data = {
                    calibPointsState,
                    issueDate,
                    selectForAllPoint,
                    submissionData,
                    apiData: {
                        instrumentData,
                        inwardData,
                        labData,
                        instrumentInfo,
                        unitsList,
                        modesList,
                        mastersList,
                        supportMastersList,
                        calibrationPoints
                    }
                };

                toast.success('Step 2 completed successfully!');
                localStorage.setItem('calibrateStep2Data', JSON.stringify(step2Data));

                setTimeout(() => {
                    navigate(`/dashboards/calibration-process/inward-entry-lab/calibrate-step3/${id}/${itemId}?caliblocation=${caliblocation}&calibacc=${calibacc}`, {
                        state: { step1Data, step2Data }
                    });
                }, 1500);
            } else {
                // Handle backend validation errors
                let newGeneralErrors = [];
                let newFieldErrors = {};

                if (response.data.message) {
                    newGeneralErrors.push(response.data.message);
                }

                if (response.data.errors) {
                    if (Array.isArray(response.data.errors)) {
                        newGeneralErrors.push(...response.data.errors);
                    } else if (typeof response.data.errors === "object") {
                        newFieldErrors = response.data.errors;
                        // ADD THIS: flatten field errors into general errors too
                        Object.values(response.data.errors).forEach((errArr) => {
                            if (Array.isArray(errArr))
                                newGeneralErrors.push(...errArr);
                        });
                    }
                }

                setGeneralErrors(newGeneralErrors);
                setFieldErrors(newFieldErrors);

                toast.error('Please fix the errors and try again');
            }
        } catch (err) {
            console.error("Error submitting step2 data:", err);

            let newGeneralErrors = [];
            let newFieldErrors = {};

            // WITH THIS:
            const errData =
                err.response?.data ||
                err.data ||
                (typeof err === "object" && err?.message ? err : null);
            if (errData) {
                if (errData.message) {
                    newGeneralErrors.push(errData.message);
                }
                if (errData.errors) {
                    if (Array.isArray(errData.errors)) {
                        newGeneralErrors.push(...errData.errors);
                    } else if (typeof errData.errors === "object") {
                        newFieldErrors = errData.errors;
                        Object.values(errData.errors).forEach((errArr) => {
                            if (Array.isArray(errArr)) newGeneralErrors.push(...errArr);
                        });
                    }
                }
                if (
                    newGeneralErrors.length === 0 &&
                    Object.keys(newFieldErrors).length === 0
                ) {
                    newGeneralErrors.push("Server error occurred. Please try again.");
                }
            } else if (err.request) {
                newGeneralErrors.push(
                    "Network Error: Please check your connection",
                );
            } else {
                // Try to extract from err directly
                if (
                    err?.response?.data?.errors &&
                    Array.isArray(err.response.data.errors)
                ) {
                    newGeneralErrors.push(...err.response.data.errors);
                } else if (err?.response?.data?.message) {
                    newGeneralErrors.push(err.response.data.message);
                } else {
                    newGeneralErrors.push("Error saving data. Please try again.");
                }
            }

            setGeneralErrors(newGeneralErrors);
            setFieldErrors(newFieldErrors);
            toast.error("Error occurred while submitting");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBackToInwardList = () => {
        navigate(`/dashboards/calibration-process/inward-entry-lab?caliblocation=${caliblocation}&calibacc=${calibacc}`);
    };

    const handleBackToPerformCalibration = () => {
        navigate(`/dashboards/calibration-process/inward-entry-lab/perform-calibration/${id}?caliblocation=${caliblocation}&calibacc=${calibacc}`);
    };

    const handleBackToStep1 = () => {
        navigate(`/dashboards/calibration-process/inward-entry-lab/calibrate-step1/${id}/${itemId}?caliblocation=${caliblocation}&calibacc=${calibacc}`);
    };

    // Loading state
    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center text-gray-600">
                <svg className="animate-spin h-6 w-6 mr-2 text-blue-600" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z"></path>
                </svg>
                Loading Calibration Step2...
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className={`min-h-screen ${theme === 'dark' ? 'dark' : ''}`}>
                <Page title="CalibrateStep2" className="bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
                    <div className="max-w-7xl mx-auto">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
                            <div className="text-red-500 mb-4">
                                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-4">Error Loading Data</h2>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
                            <div className="flex gap-4 justify-center">
                                <Button
                                    onClick={() => window.location.reload()}
                                    className="bg-indigo-500 hover:bg-fuchsia-500 dark:bg-indigo-600 dark:hover:bg-fuchsia-600 text-white px-6 py-2 rounded-md"
                                >
                                    Retry
                                </Button>
                                <Button
                                    onClick={handleBackToStep1}
                                    className="bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700 text-white px-6 py-2 rounded-md"
                                >
                                    Go Back to Step 1
                                </Button>
                            </div>
                        </div>
                    </div>
                </Page>
            </div>
        );
    }

    // Authorization check
    if (!isAuthorized) {
        return (
            <div className={`min-h-screen ${theme === 'dark' ? 'dark' : ''}`}>
                <Page title="CalibrateStep2" className="bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
                    <div className="max-w-7xl mx-auto">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
                            <div className="text-red-500 mb-4">
                                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-4">Access Denied</h2>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">This instrument is not allotted to you. Redirecting to Perform Calibration...</p>
                        </div>
                    </div>
                </Page>
            </div>
        );
    }

    // If no valid step1 data, show message and redirect options
    if (!hasValidStep1Data) {
        return (
            <div className={`min-h-screen ${theme === 'dark' ? 'dark' : ''}`}>
                <Page title="CalibrateStep2" className="bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
                    <div className="max-w-7xl mx-auto">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
                            <h2 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-4">Step 1 Required</h2>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">Please complete Step 1 before proceeding to Step 2.</p>
                            <div className="flex gap-4 justify-center">
                                <Button
                                    onClick={handleBackToStep1}
                                    className="bg-indigo-500 hover:bg-fuchsia-500 dark:bg-indigo-600 dark:hover:bg-fuchsia-600 text-white px-6 py-2 rounded-md"
                                >
                                    Go to Step 1
                                </Button>
                                <Button
                                    onClick={handleBackToPerformCalibration}
                                    className="bg-indigo-500 hover:bg-fuchsia-500 dark:bg-indigo-600 dark:hover:bg-fuchsia-600 text-white px-6 py-2 rounded-md"
                                >
                                    Back to Perform Calibration
                                </Button>
                            </div>
                        </div>
                    </div>
                </Page>
            </div>
        );
    }

    return (
        <div className={`min-h-screen ${theme === 'dark' ? 'dark' : ''}`}>
            <Page title="CalibrateStep2" className="bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-4">
                        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                            <h1 className="text-xl font-medium text-gray-800 dark:text-gray-200">Fill Dates</h1>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={handleBackToInwardList}
                                    className="bg-indigo-500 hover:bg-fuchsia-500 dark:bg-indigo-600 dark:hover:bg-fuchsia-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                                >
                                    &lt;&lt; Back to Inward Entry List
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={handleBackToPerformCalibration}
                                    className="bg-indigo-500 hover:bg-fuchsia-500 dark:bg-indigo-600 dark:hover:bg-fuchsia-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                                >
                                    &lt;&lt; Back to Perform Calibration
                                </Button>
                            </div>
                        </div>

                        {/* Equipment Information from Step 1 */}
                        <div className="p-6 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-700">
                            <div className="grid grid-cols-12 gap-4 text-sm">
                                <div className="col-span-6 space-y-2">
                                    <div className="flex">
                                        <span className="w-48 font-medium text-gray-700 dark:text-gray-300">Name Of The Equipment:</span>
                                        <span className="text-gray-900 dark:text-gray-200">{instrumentData?.name || step1Data?.equipmentName || 'N/A'}</span>
                                    </div>
                                    <div className="flex">
                                        <span className="w-48 font-medium text-gray-700 dark:text-gray-300">Alloted Lab:</span>
                                        <span className="text-gray-900 dark:text-gray-200">{labData?.name || 'N/A'}</span>
                                    </div>
                                    <div className="flex">
                                        <span className="w-48 font-medium text-gray-700 dark:text-gray-300">Make:</span>
                                        <span className="text-gray-900 dark:text-gray-200">{instrumentData?.make || step1Data?.make || 'N/A'}</span>
                                    </div>
                                    <div className="flex">
                                        <span className="w-48 font-medium text-gray-700 dark:text-gray-300">Model:</span>
                                        <span className="text-gray-900 dark:text-gray-200">{instrumentData?.model || step1Data?.model || 'N/A'}</span>
                                    </div>
                                    <div className="flex">
                                        <span className="w-48 font-medium text-gray-700 dark:text-gray-300">SR no:</span>
                                        <span className="text-gray-900 dark:text-gray-200">{instrumentData?.serialno || step1Data?.srNo || 'N/A'}</span>
                                    </div>
                                    <div className="flex">
                                        <span className="w-48 font-medium text-gray-700 dark:text-gray-300">Id no:</span>
                                        <span className="text-gray-900 dark:text-gray-200">{instrumentData?.idno || step1Data?.idNo || 'N/A'}</span>
                                    </div>
                                    <div className="flex">
                                        <span className="w-48 font-medium text-gray-700 dark:text-gray-300">Calibrated On:</span>
                                        <span className="text-gray-900 dark:text-gray-200">{formatDateTime(instrumentData?.calibratedon) || step1Data?.calibratedStart || 'N/A'}</span>
                                    </div>
                                    <div className="flex">
                                        <span className="w-48 font-medium text-gray-700 dark:text-gray-300">Suggested Due Date:</span>
                                        <span className="text-gray-900 dark:text-gray-200">{formatDate(instrumentData?.duedate) || step1Data?.suggestedDueDate || 'N/A'}</span>
                                    </div>
                                </div>

                                <div className="col-span-6 space-y-2">
                                    <div className="flex">
                                        <span className="w-32 font-medium text-gray-700 dark:text-gray-300">BRN No:</span>
                                        <span className="text-gray-900 dark:text-gray-200">{instrumentData?.bookingrefno || step1Data?.brnNo || 'N/A'}</span>
                                    </div>
                                    <div className="flex">
                                        <span className="w-32 font-medium text-gray-700 dark:text-gray-300">Receive Date:</span>
                                        <span className="text-gray-900 dark:text-gray-200">{formatDate(inwardData?.inwarddate) || step1Data?.receiveDate || 'N/A'}</span>
                                    </div>
                                    <div className="flex">
                                        <span className="w-32 font-medium text-gray-700 dark:text-gray-300">Range:</span>
                                        <span className="text-gray-900 dark:text-gray-200">
                                            {(instrumentData?.range_info?.temprange && instrumentData?.range_info?.unit
                                                ? `${instrumentData.range_info.temprange} ${unitsList.find(u => u.id == instrumentData.range_info.unit)?.name || ''}`
                                                : step1Data?.range || 'N/A')}
                                        </span>
                                    </div>
                                    <div className="flex">
                                        <span className="w-32 font-medium text-gray-700 dark:text-gray-300">Least Count:</span>
                                        <span className="text-gray-900 dark:text-gray-200">
                                            {(instrumentData?.range_info?.lc && instrumentData?.range_info?.unit
                                                ? `${instrumentData.range_info.lc} ${unitsList.find(u => u.id == instrumentData.range_info.unit)?.name || ''}`
                                                : step1Data?.leastCount || 'N/A')}
                                        </span>
                                    </div>
                                    <div className="flex">
                                        <span className="w-32 font-medium text-gray-700 dark:text-gray-300">Condition Of UUC:</span>
                                        <span className="text-gray-900 dark:text-gray-200">{inwardData?.samplecondition || instrumentData?.conditiononrecieve || step1Data?.conditionOfUIC || 'N/A'}</span>
                                    </div>
                                    <div className="flex">
                                        <span className="w-32 font-medium text-gray-700 dark:text-gray-300">Calibration performed At:</span>
                                        <span className="text-gray-900 dark:text-gray-200">{instrumentData?.performedat || step1Data?.calibrationPerformedAt || 'Lab'}</span>
                                    </div>
                                    <div className="flex">
                                        <span className="w-32 font-medium text-gray-700 dark:text-gray-300">Reference Std:</span>
                                        <span className="text-gray-900 dark:text-gray-200 whitespace-pre-line">{step1Data?.referenceSite || 'DKD-R 6-1\nIS 3651 (Part II) : 1985'}</span>
                                    </div>
                                    <div className="flex">
                                        <span className="w-32 font-medium text-gray-700 dark:text-gray-300">Temperature (°C):</span>
                                        <span className="text-gray-900 dark:text-gray-200">{instrumentData?.temperature || step1Data?.temperature || 'N/A'}</span>
                                    </div>
                                    <div className="flex">
                                        <span className="w-32 font-medium text-gray-700 dark:text-gray-300">Humidity (%RH):</span>
                                        <span className="text-gray-900 dark:text-gray-200">{instrumentData?.humidity || step1Data?.humidity || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Select masters section */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-4">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-lg font-medium text-gray-800 dark:text-gray-200">Select masters</h2>
                            <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                <p>Units Available: {unitsList.length} | Modes Available: {modesList.length} | Masters Available: {mastersList.length} | Support Masters Available: {supportMastersList.length}</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6">
                            {/* Table Container with improved overflow handling */}
                            <div className="overflow-x-auto relative">
                                <table className="w-full border-collapse">
                                    {/* Column Headers */}
                                    <thead>
                                        <tr className="bg-gray-100 dark:bg-gray-700">
                                            <th className="p-3 border border-gray-300 dark:border-gray-600 text-left text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[250px]">
                                                Calibration Point
                                            </th>
                                            <th className="p-3 border border-gray-300 dark:border-gray-600 text-left text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[200px]">
                                                Unit
                                            </th>
                                            <th className="p-3 border border-gray-300 dark:border-gray-600 text-left text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[200px]">
                                                Mode{instrumentInfo?.supportmaster === "Yes" && <div className="text-xs text-gray-500 dark:text-gray-400"></div>}
                                            </th>
                                            <th className="p-3 border border-gray-300 dark:border-gray-600 text-left text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[250px]">
                                                Masters{instrumentInfo?.supportmaster === "Yes" && <div className="text-xs text-gray-500 dark:text-gray-400"></div>}
                                            </th>
                                            {instrumentInfo?.suffix === "dw" && (
                                                <th className="p-3 border border-gray-300 dark:border-gray-600 text-left text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[120px]">
                                                    Repeatable
                                                </th>
                                            )}
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {/* Select For All Point Row */}
                                        <tr className="bg-blue-50 dark:bg-blue-900/30">
                                            <td className="p-3 border border-gray-300 dark:border-gray-600">
                                                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    Select For All Point
                                                </div>
                                            </td>

                                            {/* Unit Column */}
                                            <td className="p-3 border border-gray-300 dark:border-gray-600">
                                                <Select
                                                    value={getUnitOptions().find(opt => opt.value == selectForAllPoint.unit) || null}
                                                    onChange={(selected) => handleSelectForAllPointChange('unit', selected)}
                                                    options={getUnitOptions()}
                                                    isSearchable={true}
                                                    placeholder="Select Unit"
                                                    classNamePrefix="react-select"
                                                    className="text-sm"
                                                    styles={customSelectStyles}
                                                    menuPortalTarget={document.body}
                                                />
                                            </td>

                                            {/* Mode Column */}
                                            <td className="p-3 border border-gray-300 dark:border-gray-600">
                                                <Select
                                                    value={getModeOptions().find(opt => opt.value === selectForAllPoint.mode) || null}
                                                    onChange={(selected) => handleSelectForAllPointChange('mode', selected)}
                                                    options={getModeOptions()}
                                                    isSearchable={true}
                                                    placeholder="Select Mode"
                                                    classNamePrefix="react-select"
                                                    className="text-sm"
                                                    styles={customSelectStyles}
                                                    menuPortalTarget={document.body}
                                                />
                                                {instrumentInfo?.supportmaster === "Yes" && (
                                                    <div className="mt-2">
                                                        <Select
                                                            value={getSupportModeOptions().find(opt => opt.value === selectForAllPoint.supportMode) || null}
                                                            onChange={(selected) => handleSelectForAllPointChange('supportMode', selected)}
                                                            options={getSupportModeOptions()}
                                                            isSearchable={true}
                                                            placeholder="Select Support Mode"
                                                            classNamePrefix="react-select"
                                                            className="text-sm"
                                                            styles={customSelectStyles}
                                                            menuPortalTarget={document.body}
                                                        />
                                                    </div>
                                                )}
                                            </td>

                                            {/* Masters Column for Select All */}
                                            <td className="p-3 border border-gray-300 dark:border-gray-600">
                                                <Select
                                                    isMulti={true}
                                                    value={getMasterOptions(filteredMastersList).filter(opt => selectForAllPoint.masters.includes(opt.value)) || []}
                                                    onChange={(selected) => handleSelectForAllPointChange('masters', selected)}
                                                    options={getMasterOptions(filteredMastersList)}
                                                    isSearchable={true}
                                                    placeholder="Select Master"
                                                    classNamePrefix="react-select"
                                                    className="text-sm"
                                                    styles={customSelectStyles}
                                                    menuPortalTarget={document.body}
                                                />
                                                {instrumentInfo?.supportmaster === "Yes" && (
                                                    <div className="mt-2">
                                                        <Select
                                                            isMulti={true}
                                                            value={getMasterOptions(filteredSupportMastersList).filter(opt => selectForAllPoint.supportMasters.includes(opt.value)) || []}
                                                            onChange={(selected) => handleSelectForAllPointChange('supportMasters', selected)}
                                                            options={getMasterOptions(filteredSupportMastersList)}
                                                            isSearchable={true}
                                                            placeholder="Select Support Master"
                                                            classNamePrefix="react-select"
                                                            className="text-sm"
                                                            styles={customSelectStyles}
                                                            menuPortalTarget={document.body}
                                                        />
                                                    </div>
                                                )}
                                            </td>

                                            {/* Repeatable Column - Only show if suffix is "dw" */}
                                            {instrumentInfo?.suffix === "dw" && (
                                                <td className="p-3 border border-gray-300 dark:border-gray-600">
                                                    <input
                                                        type="number"
                                                        value={selectForAllPoint.repeatable}
                                                        onChange={(e) => handleSelectForAllPointChange('repeatable', e.target.value)}
                                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-sm"
                                                        min="1"
                                                        step="1"
                                                        placeholder="3"
                                                    />
                                                </td>
                                            )}
                                        </tr>

                                        {/* Individual Calibration Points */}
                                        {calibPointsState.map((point) => {
                                            const filteredMasters = getFilteredMastersForPoint(point);
                                            const filteredSupportMasters = getFilteredSupportMastersForPoint(point);
                                            // ========== MATRIX CODE - COMMENTED OUT ==========
                                            // const matrixOptions = getMatrixOptionsForPoint(point.id);
                                            return (
                                                <tr key={point.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                    <td className="p-3 border border-gray-300 dark:border-gray-600">
                                                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                            {point.label}
                                                        </div>
                                                    </td>

                                                    {/* Unit Column */}
                                                    <td className="p-3 border border-gray-300 dark:border-gray-600">
                                                        <Select
                                                            value={getUnitOptions().find(opt => opt.value == point.masterUnit) || null}
                                                            onChange={(selected) => handleCalibPointChange(point.id, 'masterUnit', selected)}
                                                            options={getUnitOptions()}
                                                            isSearchable={true}
                                                            placeholder="Select Unit"
                                                            classNamePrefix="react-select"
                                                            className={`text-sm ${fieldErrors[`unit${point.calibpointid}`] ? 'invalid' : ''}`}
                                                            styles={customSelectStyles}
                                                            menuPortalTarget={document.body}
                                                        />
                                                        {fieldErrors[`unit${point.calibpointid}`] && (
                                                            <p className="text-red-500 text-xs mt-1">{fieldErrors[`unit${point.calibpointid}`][0]}</p>
                                                        )}
                                                    </td>

                                                    {/* Mode Column */}
                                                    <td className="p-3 border border-gray-300 dark:border-gray-600">
                                                        <Select
                                                            value={getModeOptions().find(opt => opt.value === point.masterMode) || null}
                                                            onChange={(selected) => handleCalibPointChange(point.id, 'masterMode', selected)}
                                                            options={getModeOptions()}
                                                            isSearchable={true}
                                                            placeholder="Select Mode"
                                                            classNamePrefix="react-select"
                                                            className={`text-sm ${fieldErrors[`mastermode${point.calibpointid}`] ? 'invalid' : ''}`}
                                                            styles={customSelectStyles}
                                                            menuPortalTarget={document.body}
                                                        />
                                                        {fieldErrors[`mastermode${point.calibpointid}`] && (
                                                            <p className="text-red-500 text-xs mt-1">{fieldErrors[`mastermode${point.calibpointid}`][0]}</p>
                                                        )}

                                                        {instrumentInfo?.supportmaster === "Yes" && (
                                                            <div className="mt-2">
                                                                <Select
                                                                    value={getSupportModeOptions().find(opt => opt.value === point.supportMasterMode) || null}
                                                                    onChange={(selected) => handleCalibPointChange(point.id, 'supportMasterMode', selected)}
                                                                    options={getSupportModeOptions()}
                                                                    isSearchable={true}
                                                                    placeholder="Select Support Mode"
                                                                    classNamePrefix="react-select"
                                                                    className={`text-sm ${fieldErrors[`supportmastermode${point.calibpointid}`] ? 'invalid' : ''}`}
                                                                    styles={customSelectStyles}
                                                                    menuPortalTarget={document.body}
                                                                />
                                                                {fieldErrors[`supportmastermode${point.calibpointid}`] && (
                                                                    <p className="text-red-500 text-xs mt-1">{fieldErrors[`supportmastermode${point.calibpointid}`][0]}</p>
                                                                )}
                                                            </div>
                                                        )}
                                                    </td>

                                                    {/* Masters Column for Individual */}
                                                    <td className="p-3 border border-gray-300 dark:border-gray-600">
                                                        <Select
                                                            isMulti={true}
                                                            value={getMasterOptions(filteredMasters).filter(opt => point.masters.includes(opt.value)) || []}
                                                            onChange={(selected) => handleCalibPointChange(point.id, 'masters', selected)}
                                                            options={getMasterOptions(filteredMasters)}
                                                            isSearchable={true}
                                                            placeholder="Select Master"
                                                            classNamePrefix="react-select"
                                                            className={`text-sm ${fieldErrors[`mastercalibid${point.calibpointid}`] ? 'invalid' : ''}`}
                                                            styles={customSelectStyles}
                                                            menuPortalTarget={document.body}
                                                        />
                                                        {fieldErrors[`mastercalibid${point.calibpointid}`] && (
                                                            <p className="text-red-500 text-xs mt-1">{fieldErrors[`mastercalibid${point.calibpointid}`][0]}</p>
                                                        )}

                                                        {/* ========== MATRIX CODE - COMMENTED OUT ========== */}
                                                        {/* Third Select: Matrix / Scope - Shown if validityid present */}
                                                        {/* {point.validityid && matrixOptions.length > 0 && (
                                                            <div className="mt-2">
                                                                <Select
                                                                    isMulti={true}
                                                                    value={matrixOptions.filter(opt => point.matrixMasters.includes(opt.value)) || []}
                                                                    onChange={(selected) => handleCalibPointChange(point.id, 'matrixMasters', selected)}
                                                                    options={matrixOptions}
                                                                    isSearchable={true}
                                                                    placeholder="Select Matrix"
                                                                    classNamePrefix="react-select"
                                                                    className={`text-sm ${fieldErrors[`scopematrix${point.calibpointid}`] ? 'invalid' : ''}`}
                                                                    styles={customSelectStyles}
                                                                    menuPortalTarget={document.body}
                                                                />
                                                                {fieldErrors[`scopematrix${point.calibpointid}`] && (
                                                                    <p className="text-red-500 text-xs mt-1">{fieldErrors[`scopematrix${point.calibpointid}`][0]}</p>
                                                                )}
                                                            </div>
                                                        )} */}

                                                        {instrumentInfo?.supportmaster === "Yes" && (
                                                            <div className="mt-2">
                                                                <Select
                                                                    isMulti={true}
                                                                    value={getMasterOptions(filteredSupportMasters).filter(opt => point.supportMasters.includes(opt.value)) || []}
                                                                    onChange={(selected) => handleCalibPointChange(point.id, 'supportMasters', selected)}
                                                                    options={getMasterOptions(filteredSupportMasters)}
                                                                    isSearchable={true}
                                                                    placeholder="Select Support Master"
                                                                    classNamePrefix="react-select"
                                                                    className={`text-sm ${fieldErrors[`supportmastercalibid${point.calibpointid}`] ? 'invalid' : ''}`}
                                                                    styles={customSelectStyles}
                                                                    menuPortalTarget={document.body}
                                                                />
                                                                {fieldErrors[`supportmastercalibid${point.calibpointid}`] && (
                                                                    <p className="text-red-500 text-xs mt-1">{fieldErrors[`supportmastercalibid${point.calibpointid}`][0]}</p>
                                                                )}
                                                            </div>
                                                        )}
                                                    </td>

                                                    {/* Repeatable Column - Only show if suffix is "dw" */}
                                                    {instrumentInfo?.suffix === "dw" && (
                                                        <td className="p-3 border border-gray-300 dark:border-gray-600">
                                                            <input
                                                                type="number"
                                                                value={point.repeatable}
                                                                onChange={(e) => handleCalibPointChange(point.id, 'repeatable', e.target.value)}
                                                                className={`w-full px-3 py-2 border rounded bg-white dark:bg-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 text-sm ${fieldErrors[`repeatable${point.calibpointid}`] ? 'border-red-500 focus:ring-red-500 dark:focus:ring-red-400' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 dark:focus:ring-blue-400'}`}
                                                                min="1"
                                                                step="1"
                                                                placeholder="3"
                                                            />
                                                            {fieldErrors[`repeatable${point.calibpointid}`] && (
                                                                <p className="text-red-500 text-xs mt-1">{fieldErrors[`repeatable${point.calibpointid}`][0]}</p>
                                                            )}
                                                        </td>
                                                    )}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* General Backend Errors Display */}
                            {generalErrors.length > 0 && (
                                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4 mt-4 mb-4">
                                    <div className="flex items-center mb-2">
                                        <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Please fix the following errors:</h3>
                                    </div>
                                    <ul className="list-disc list-inside text-sm text-red-700 dark:text-red-300 space-y-1">
                                        {generalErrors.map((error, index) => (
                                            <li key={index}>
                                                {error === 'Validation failed' ? null : (
                                                    <span>
                                                        <strong>⚠</strong> {error.replace('is not valid with provided masterss', 'has no valid master selected')}
                                                    </span>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Issue Date */}
                            <div className="flex items-center gap-4 mt-6 mb-6">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Issue Date: <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={issueDate}
                                    onChange={(e) => setIssueDate(e.target.value)}
                                    className={`px-3 py-2 border rounded bg-white dark:bg-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 text-sm ${fieldErrors['issue'] ? 'border-red-500 focus:ring-red-500 dark:focus:ring-red-400' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 dark:focus:ring-blue-400'}`}
                                />
                                {fieldErrors['issue'] && (
                                    <p className="text-red-500 text-xs mt-1">{fieldErrors['issue'][0]}</p>
                                )}
                            </div>

                            {/* Submit Button */}
                            <div className="flex justify-end">
                                <Button
                                    type="submit"
                                    disabled={!isAuthorized || isSubmitting}
                                    className={`px-8 py-2 rounded font-medium transition-colors ${isAuthorized && !isSubmitting
                                        ? 'bg-indigo-500 hover:bg-fuchsia-500 dark:bg-indigo-600 dark:hover:bg-fuchsia-600 text-white cursor-pointer'
                                        : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                                        }`}
                                >
                                    {isSubmitting ? 'Submitting...' : 'Submit'}
                                </Button>
                            </div>
                        </form>
                    </div>

                    {/* Progress Bar */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                        <div className="flex items-center justify-between px-6 py-6">
                            <button
                                onClick={handleBackToStep1}
                                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                            >
                                ‹
                            </button>
                            <div className="flex-1 mx-4">
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                    <div className="bg-cyan-500 dark:bg-cyan-600 h-2 rounded-full transition-all duration-300" style={{ width: '50%' }}></div>
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

export default Calibratestep2;