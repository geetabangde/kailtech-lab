// import { useState, useEffect } from 'react';
// import { useNavigate, useParams, useLocation } from 'react-router';
// import { Page } from "components/shared/Page";
// import { Button } from "components/ui/Button";
// import { toast } from "sonner";
// import axios from "utils/axios";

// const CalibrateStep3 = () => {
//   const navigate = useNavigate();
//   const { id } = useParams();
//   const { id: inwardId, itemId: instId } = useParams();
//   const location = useLocation();
//   console.log("Item Id", inwardId, instId);
//   const searchParams = new URLSearchParams(window.location.search);
//   const caliblocation = searchParams.get("caliblocation") || "Lab";
//   const calibacc = searchParams.get("calibacc") || "Nabl";

//   // All state declarations
//   const [instrument, setInstrument] = useState(null);
//   const [inwardEntry, setInwardEntry] = useState(null);
//   const [masters, setMasters] = useState([]);
//   const [supportMasters, setSupportMasters] = useState([]);
//   const [observationTemplate, setObservationTemplate] = useState(null);
//   const [temperatureRange, setTemperatureRange] = useState(null);
//   const [humidityRange, setHumidityRange] = useState(null);
//   const [observation, setObservations] = useState([]);
//   const [tableInputValues, setTableInputValues] = useState({});
//   const [thermalCoeff, setThermalCoeff] = useState({
//     uuc: '',
//     master: ''
//   });

//   // Theme state management
//   const [theme, setTheme] = useState(() => {
//     const savedTheme = localStorage.getItem('theme');
//     if (savedTheme) return savedTheme;
//     if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
//       return 'dark';
//     }
//     return 'light';
//   });

//   // Form data with pre-filled values from API
//   const [formData, setFormData] = useState({
//     enddate: '',
//     duedate: '',
//     notes: '',
//     tempend: '',
//     humiend: ''
//   });

//   // First API call to get calibration step3 details
//   useEffect(() => {
//     axios.get('https://kailtech.in/newlims/api/calibrationprocess/get-calibration-step3-details', {
//       params: {
//         inward_id: inwardId,
//         instid: instId,
//         caliblocation: caliblocation,
//         calibacc: calibacc
//       }
//     }).then((res) => {
//       console.log("✅ API Data:", res.data);
//       const data = res.data;

//       setInwardEntry(data.inwardEntry);
//       setInstrument(data.instrument);
//       setMasters(data.masters);
//       setSupportMasters(data.supportMasters);
//       setObservationTemplate(data.observationTemplate);
//       setTemperatureRange(data.temperatureRange);
//       setHumidityRange(data.humidityRange);

//       // Set form data from API response
//       setFormData(prev => ({
//         ...prev,
//         enddate: data.instrument?.enddate || '',
//         humiend: data.instrument?.humiend || '',
//         tempend: data.instrument?.tempend || '',
//         duedate: data.instrument?.duedate || '',
//         temperatureEnd: data.temperatureRange?.min && data.temperatureRange?.max
//           ? `${data.temperatureRange.min} - ${data.temperatureRange.max}`
//           : data.temperatureRange?.value || '',
//         humidityEnd: data.humidityRange?.min && data.humidityRange?.max
//           ? `${data.humidityRange.min} - ${data.humidityRange.max}`
//           : data.humidityRange?.value || ''
//       }));
//     }).catch((err) => {
//       console.error("❌ API Error:", err.response?.data || err);
//       toast.error("Failed to fetch calibration data");
//     });
//   }, [inwardId, instId, caliblocation, calibacc]);

//   const safeGetValue = (item) => {
//     if (!item) return '';
//     if (typeof item === 'object' && item !== null) {
//       return item.value !== null && item.value !== undefined ? item.value : '';
//     }
//     return item.toString();
//   };

//   const safeGetArray = (item, defaultLength = 0) => {
//     if (!item) return Array(defaultLength).fill('');
//     if (Array.isArray(item)) return item;
//     if (typeof item === 'string') return [item];
//     return Array(defaultLength).fill('');
//   };

//   // Updated observation fetching useEffect
//   useEffect(() => {
//     const fetchObservations = async () => {
//       if (!observationTemplate) return;

//       try {
//         const response = await axios.post(
//           "https://kailtech.in/newlims/api/ob/get-observation",
//           {
//             fn: observationTemplate,
//             instid: instId,
//             inwardid: inwardId,
//           }
//         );

//         // Handle both 'status' and 'staus' (API typo)
//         const isSuccess = response.data.status === true || response.data.staus === true;

//         if (isSuccess && response.data.data) {
//           const observationData = response.data.data;
//           console.log("📊 Observation Data:", observationData);

//           // Extract thermal coefficients for MT
//           if (observationTemplate === 'observationmt' && observationData.thermal_coeff) {
//             setThermalCoeff({
//               uuc: observationData.thermal_coeff.uuc || '',
//               master: observationData.thermal_coeff.master || '',
//               thickness_of_graduation: observationData.thermal_coeff.thickness_of_graduation || ''
//             });
//           }

//           // Handle different observation template structures
//           if (observationTemplate === 'observationodfm' && observationData.calibration_points) {
//             console.log("Setting ODFM observations:", observationData.calibration_points);
//             setObservations(observationData.calibration_points);
//           }
//           else if (observationTemplate === 'observationrtdwi') {
//             console.log("Setting RTD WI observations:", observationData);
//             setObservations(observationData);
//           }
//           else if (observationTemplate === 'observationmt' && observationData.calibration_points) {
//             setObservations(observationData.calibration_points);
//           }
//           else if (observationTemplate === 'observationdpg' && observationData.calibration_points) {
//             setObservations(observationData.calibration_points);
//           }
//           else if (observationTemplate === 'observationmm') {
//             if (observationData.unit_types && Array.isArray(observationData.unit_types)) {
//               setObservations(observationData.unit_types);
//             } else if (observationData.calibration_points) {
//               setObservations(observationData.calibration_points);
//             } else {
//               setObservations(observationData);
//             }
//           }
//           else if (observationTemplate === 'observationmsr' || observationTemplate === 'observationexm') {
//             if (observationData.unit_types && Array.isArray(observationData.unit_types)) {
//               setObservations(observationData.unit_types);
//             } else if (observationData.matrices && Array.isArray(observationData.matrices)) {
//               setObservations(observationData.matrices);
//             } else {
//               setObservations(observationData);
//             }
//           }
//           else if (observationTemplate === 'observationdg' && observationData.calibration_points) {
//             setObservations(observationData.calibration_points);
//           }
//           else if (observationTemplate === 'observationcustom' && observationData.calibration_points) {
//             setObservations(observationData.calibration_points);
//           }
//           else if (observationTemplate === 'observationdw' && observationData.calibration_points) {
//             setObservations(observationData.calibration_points);
//           }
//           else if (observationTemplate === 'observationctg' && observationData.points) {
//             setObservations(observationData.points);
//           }
//           else if (observationTemplate === 'observationfg') {
//             if (observationData.unit_types && Array.isArray(observationData.unit_types)) {
//               setObservations(observationData.unit_types);
//             } else if (observationData.calibration_points) {
//               setObservations(observationData.calibration_points);
//             } else {
//               setObservations(observationData);
//             }
//           }
//           else if (observationTemplate === 'observationrtdwoi' && observationData.calibration_data) {
//             console.log("Setting RTD WOI observations:", observationData.calibration_data);
//             setObservations(observationData.calibration_data);
//           }
//           else if (observationTemplate === 'observationhg') {
//             if (observationData.unit_types && Array.isArray(observationData.unit_types)) {
//               setObservations(observationData.unit_types);
//             } else if (observationData.calibration_points) {
//               setObservations(observationData.calibration_points);
//             } else {
//               setObservations(observationData);
//             }
//           }
//           else if (observationTemplate === 'observationgtm' && observationData.calibration_points) {
//             setObservations(observationData.calibration_points);
//           }
//           else {
//             if (observationData.observations) {
//               setObservations(observationData.observations);
//             } else if (observationData.data) {
//               setObservations(observationData.data);
//             } else if (observationData.points) {
//               setObservations(observationData.points);
//             } else if (observationData.calibration_points) {
//               setObservations(observationData.calibration_points);
//             } else {
//               setObservations(observationData);
//             }
//           }
//         } else {
//           console.log("No observations found");
//           setObservations([]);
//         }
//       } catch (error) {
//         console.log("Error fetching observations:", error);
//         setObservations([]);
//       }
//     };

//     fetchObservations();
//   }, [observationTemplate, instId, inwardId]);

//   // Theme effects
//   useEffect(() => {
//     document.documentElement.classList.remove('light', 'dark');
//     document.documentElement.classList.add(theme);
//     localStorage.setItem('theme', theme);
//   }, [theme]);

//   useEffect(() => {
//     const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
//     const handleChange = () => {
//       if (!localStorage.getItem('theme')) {
//         setTheme(mediaQuery.matches ? 'dark' : 'light');
//       }
//     };

//     mediaQuery.addEventListener('change', handleChange);
//     return () => mediaQuery.removeEventListener('change', handleChange);
//   }, []);

//   // Get data from previous steps
//   const step1Data = location.state?.step1Data || JSON.parse(localStorage.getItem('calibrateStep1Data') || '{}');
//   const step2Data = location.state?.step2Data || JSON.parse(localStorage.getItem('calibrateStep2Data') || '{}');


//   // Updated createObservationRows function with observationpr support
//   const createObservationRows = (observationData, template) => {
//     if (!observationData) return { rows: [], hiddenInputs: { calibrationPoints: [], types: [], repeatables: [], values: [] } };

//     let dataArray = [];
//     const calibrationPoints = [];
//     const types = [];
//     const repeatables = [];
//     const values = [];

//     // Handle different data structures with null checks
//     if (Array.isArray(observationData)) {
//       dataArray = observationData;
//     } else if (typeof observationData === 'object' && observationData !== null) {
//       if (observationData.data && Array.isArray(observationData.data)) {
//         dataArray = observationData.data;
//       } else if (observationData.points && Array.isArray(observationData.points)) {
//         dataArray = observationData.points;
//       } else if (observationData.observations && Array.isArray(observationData.observations)) {
//         dataArray = observationData.observations;
//       } else if (observationData.calibration_points && Array.isArray(observationData.calibration_points)) {
//         dataArray = observationData.calibration_points;
//       } else if (observationData.unit_types && Array.isArray(observationData.unit_types)) {
//         dataArray = observationData.unit_types;
//       } else if (observationData.matrices && Array.isArray(observationData.matrices)) {
//         dataArray = observationData.matrices;
//       } else if (observationData.rows && Array.isArray(observationData.rows)) {
//         // Handle observationavg data structure
//         dataArray = observationData.rows;
//       } else {
//         dataArray = [observationData];
//       }
//     }

//     const rows = [];

//     if (template === 'observationpr') {
//       // Handle Proving Ring observation data
//       if (observationData.matrices && Array.isArray(observationData.matrices)) {
//         observationData.matrices.forEach((matrix) => {
//           if (matrix.points && Array.isArray(matrix.points)) {
//             matrix.points.forEach((point) => {
//               if (!point) return;

//               // Get observations array (should have 9 values for 3 positions × 3 observations each)
//               const observations = safeGetArray(point.observations, 9);

//               const row = [
//                 point.sr_no?.toString() || '',
//                 safeGetValue(point.set_point),
//                 safeGetValue(point.average_master),
//                 safeGetValue(point.repeatability),
//                 safeGetValue(point.factor),
//                 // Position 0° observations (first 3)
//                 safeGetValue(observations[0]),
//                 safeGetValue(observations[1]),
//                 safeGetValue(observations[2]),

//               ];

//               rows.push(row);
//               calibrationPoints.push(point.calib_point_id?.toString() || "1");
//               types.push('input');
//               repeatables.push('3');
//               values.push(safeGetValue(point.set_point) || "0");
//             });
//           }
//         });
//       }
//     }
//     else if (template === 'observationppg') {
//       dataArray.forEach((obs) => {
//         if (!obs) return;

//         // Handle master_values object safely
//         const masterValues = obs.master_values || {};
//         const row = [
//           obs.sr_no?.toString() || '',
//           safeGetValue(obs.test_point),
//           safeGetValue(obs.converted_test_point),
//           safeGetValue(masterValues.m1),
//           safeGetValue(masterValues.m2),
//           safeGetValue(masterValues.m3),
//           safeGetValue(masterValues.m4),
//           safeGetValue(masterValues.m5),
//           safeGetValue(masterValues.m6),
//           safeGetValue(obs.average_master),
//           safeGetValue(obs.error),
//           safeGetValue(obs.repeatability),
//           safeGetValue(obs.hysterisis)
//         ];
//         rows.push(row);
//         calibrationPoints.push(obs.calib_point_id?.toString() || "1");
//         types.push('input');
//         repeatables.push('1');
//         values.push(safeGetValue(obs.test_point) || "0");
//       });
//     }
//     else if (template === 'observationavg') {
//       dataArray.forEach((obs) => {
//         if (!obs) return;

//         // Handle master_readings array safely
//         const masterReadings = Array.isArray(obs.master_readings) ? obs.master_readings : [];
//         const m1 = masterReadings[0] !== undefined ? masterReadings[0].toString() : '';
//         const m2 = masterReadings[1] !== undefined ? masterReadings[1].toString() : '';

//         const row = [
//           obs.sr_no?.toString() || '',
//           safeGetValue(obs.set_point_uuc),
//           safeGetValue(obs.calculated_uuc),
//           m1,
//           m2,
//           safeGetValue(obs.average_master),
//           safeGetValue(obs.error),
//           safeGetValue(obs.hysteresis)
//         ];
//         rows.push(row);
//         calibrationPoints.push("1");
//         types.push('input');
//         repeatables.push('1');
//         values.push(safeGetValue(obs.set_point_uuc) || "0");
//       });
//     }
//     else if (template === 'observationdpg') {
//       dataArray.forEach((obs) => {
//         if (!obs) return;
//         const row = [
//           obs.sr_no?.toString() || '',
//           safeGetValue(obs.uuc_value || obs.set_pressure_uuc),
//           safeGetValue(obs.converted_uuc_value || obs.set_pressure_master),
//           safeGetValue(obs.master_readings?.m1 || obs.m1),
//           safeGetValue(obs.master_readings?.m2 || obs.m2),
//           safeGetValue(obs.master_readings?.m3 || obs.m3),
//           safeGetValue(obs.average_master || obs.mean),
//           safeGetValue(obs.error),
//           safeGetValue(obs.repeatability),
//           safeGetValue(obs.hysterisis || obs.hysteresis)
//         ];
//         rows.push(row);
//         calibrationPoints.push("1");
//         types.push('uuc');
//         repeatables.push('0');
//         values.push(safeGetValue(obs.uuc_value || obs.set_pressure_uuc) || "0");
//       });
//     }
//     else if (template === 'observationodfm') {
//       dataArray.forEach((point) => {
//         if (!point) return;
//         const observations = safeGetArray(point.observations, 5);
//         const row = [
//           point.sr_no?.toString() || '',
//           safeGetValue(point.range),
//           safeGetValue(point.nominal_value || point.uuc_value),
//           safeGetValue(point.average),
//           safeGetValue(point.error),
//           ...observations.slice(0, 5).map(obs => safeGetValue(obs))
//         ];
//         while (row.length < 10) {
//           row.push('');
//         }
//         rows.push(row);
//         calibrationPoints.push("1");
//         types.push('input');
//         repeatables.push(point.metadata?.repeatable_cycle?.toString() || '5');
//         values.push(safeGetValue(point.nominal_value || point.uuc_value) || "0");
//       });
//     }
//     // Replace the observationrtdwoi section in your createObservationRows function with this:

//     else if (template === 'observationrtdwoi') {
//       let pointsToProcess = [];

//       // Get calibration_data array
//       if (observationData.calibration_data && Array.isArray(observationData.calibration_data)) {
//         pointsToProcess = observationData.calibration_data;
//       } else if (dataArray.length > 0) {
//         pointsToProcess = dataArray;
//       }

//       pointsToProcess.forEach((point) => {
//         if (!point) return;

//         // Map uuc_readings array to individual observation values (this is your observations data)
//         const uucReadings = safeGetArray(point.uuc_readings, 5);

//         const row = [
//           point.sr_no?.toString() || '', // Sr. No.
//           safeGetValue(point.set_point), // Set Point (°C)
//           safeGetValue(point.average_master), // Value Of
//           safeGetValue(point.unit_description), // Unit
//           safeGetValue(point.sensitivity_coefficient), // Sensitivity Coefficient
//           safeGetValue(point.saverage_master || point.average_master), // Average
//           safeGetValue(point.ambient_master), // mV generated On ambient
//           safeGetValue(point.caverage_master), // Average with corrected mv
//           safeGetValue(point.caverage_uuc), // Average (°C) - this should be caverage_uuc from your data
//           safeGetValue(point.error), // Deviation (°C)
//           // Map uuc_readings array to individual observation columns
//           ...uucReadings.slice(0, 5).map(reading => safeGetValue(reading))
//         ];

//         // Ensure row has exactly 15 columns
//         while (row.length < 15) {
//           row.push('');
//         }

//         rows.push(row);
//         calibrationPoints.push("1");
//         types.push('input');
//         repeatables.push('1');
//         values.push(safeGetValue(point.set_point) || "0");
//       });
//     }
//     else if (template === 'observationmg') {
//       let pointsToProcess = [];
//       if (observationData.calibration_points && Array.isArray(observationData.calibration_points)) {
//         pointsToProcess = observationData.calibration_points;
//       } else if (dataArray.length > 0) {
//         pointsToProcess = dataArray;
//       }

//       pointsToProcess.forEach((point) => {
//         if (!point) return;

//         const row = [
//           point.sequence_number?.toString() || point.sr_no?.toString() || '',
//           safeGetValue(point.set_pressure?.uuc_value || point.uuc_value),
//           safeGetValue(point.set_pressure?.converted_value || point.converted_uuc_value),
//           safeGetValue(point.observations?.master_1 || point.m1),
//           safeGetValue(point.observations?.master_2 || point.m2),
//           safeGetValue(point.calculations?.mean || point.mean || point.average_master),
//           safeGetValue(point.calculations?.error || point.error),
//           safeGetValue(point.calculations?.hysteresis || point.hysterisis || point.hysteresis)
//         ];

//         rows.push(row);
//         calibrationPoints.push("1");
//         types.push('input');
//         repeatables.push('1');
//         values.push(safeGetValue(point.set_pressure?.uuc_value || point.uuc_value) || "0");
//       });
//     }
//     else if (template === 'observationrtdwi') {
//       let pointsToProcess = [];
//       if (observationData.calibration_points && Array.isArray(observationData.calibration_points)) {
//         pointsToProcess = observationData.calibration_points;
//       } else if (dataArray.length > 0) {
//         pointsToProcess = dataArray;
//       }

//       pointsToProcess.forEach((point) => {
//         if (!point) return;
//         const uucValues = safeGetArray(point.uuc_values, 5);
//         const row = [
//           point.sr_no?.toString() || '',
//           safeGetValue(point.set_point),
//           safeGetValue(point.average_master),
//           safeGetValue(point.unit || point.master_unit),
//           safeGetValue(point.sensitivity_coefficient),
//           safeGetValue(point.s_average_master || point.average_master),
//           safeGetValue(point.ambient_master),
//           safeGetValue(point.c_average_master),
//           safeGetValue(point.average_uuc),
//           safeGetValue(point.error),
//           ...uucValues.slice(0, 5).map(val => safeGetValue(val))
//         ];
//         rows.push(row);
//         calibrationPoints.push("1");
//         types.push('input');
//         repeatables.push('1');
//         values.push(safeGetValue(point.set_point) || "0");
//       });
//     }
//     else if (template === 'observationmt') {
//       dataArray.forEach((point) => {
//         if (!point) return;
//         const observations = safeGetArray(point.observations || point.uuc_values, 5);
//         const row = [
//           point.sr_no?.toString() || '',
//           safeGetValue(point.nominal_value || point.uuc_value),
//           safeGetValue(point.average),
//           safeGetValue(point.error),
//           ...observations.slice(0, 5).map(val => safeGetValue(val))
//         ];
//         while (row.length < 9) {
//           row.push('');
//         }
//         rows.push(row);
//         calibrationPoints.push("1");
//         types.push('input');
//         repeatables.push(point.metadata?.repeatable_cycle?.toString() || '1');
//         values.push(safeGetValue(point.nominal_value || point.uuc_value) || "0");
//       });
//     }
//     else if (template === 'observationmm') {
//       dataArray.forEach((unitType) => {
//         if (!unitType) return;
//         if (unitType.calibration_points && unitType.calibration_points.length > 0) {
//           unitType.calibration_points.forEach((point) => {
//             if (!point) return;
//             const observations = safeGetArray(point.observations, 5);
//             const row = [
//               point.sequence_number?.toString() || point.sr_no?.toString() || '',
//               safeGetValue(point.mode) || 'Measure',
//               safeGetValue(point.range || unitType.unit_type),
//               safeGetValue(point.nominal_values?.master?.value || point.nominal_value),
//               safeGetValue(point.calculations?.average || point.average),
//               safeGetValue(point.calculations?.error || point.error),
//               ...observations.slice(0, 5).map((obs) => {
//                 if (typeof obs === 'object' && obs !== null) {
//                   return safeGetValue(obs.value);
//                 }
//                 return safeGetValue(obs);
//               })
//             ];
//             rows.push(row);
//             calibrationPoints.push("1");
//             types.push('input');
//             repeatables.push('1');
//             values.push(safeGetValue(point.nominal_values?.master?.value || point.nominal_value) || "0");
//           });
//         } else if (unitType.sr_no) {
//           const row = [
//             unitType.sr_no?.toString() || '',
//             safeGetValue(unitType.mode) || 'Measure',
//             safeGetValue(unitType.range),
//             safeGetValue(unitType.nominal_value),
//             safeGetValue(unitType.average),
//             safeGetValue(unitType.error),
//             safeGetValue(unitType.obs1),
//             safeGetValue(unitType.obs2),
//             safeGetValue(unitType.obs3),
//             safeGetValue(unitType.obs4),
//             safeGetValue(unitType.obs5)
//           ];
//           rows.push(row);
//           calibrationPoints.push("1");
//           types.push('input');
//           repeatables.push('1');
//           values.push(safeGetValue(unitType.nominal_value) || "0");
//         }
//       });
//     }
//     else if (template === 'observationapg') {
//       let rowsData = [];
//       if (Array.isArray(observationData)) {
//         rowsData = observationData;
//       } else if (observationData.rows && Array.isArray(observationData.rows)) {
//         rowsData = observationData.rows;
//       } else if (observationData.data && Array.isArray(observationData.data)) {
//         rowsData = observationData.data;
//       }

//       rowsData.forEach((obs) => {
//         if (!obs) return;
//         const row = [
//           obs.sr_no?.toString() || '',
//           safeGetValue(obs.uuc),
//           safeGetValue(obs.calculated_uuc),
//           safeGetValue(obs.m1),
//           safeGetValue(obs.m2),
//           safeGetValue(obs.mean),
//           safeGetValue(obs.error),
//           safeGetValue(obs.hysterisis)
//         ];
//         rows.push(row);
//         calibrationPoints.push("1");
//         types.push('input');
//         repeatables.push('1');
//         values.push(safeGetValue(obs.uuc) || "0");
//       });
//     }
//     else if (template === 'observationexm') {
//       let processedData = [];

//       if (Array.isArray(observationData)) {
//         processedData = observationData;
//       } else if (observationData.data && Array.isArray(observationData.data)) {
//         observationData.data.forEach((unitType) => {
//           if (unitType && unitType.matrix_types && Array.isArray(unitType.matrix_types)) {
//             unitType.matrix_types.forEach((matrixType) => {
//               if (matrixType && matrixType.observations && Array.isArray(matrixType.observations)) {
//                 processedData = processedData.concat(matrixType.observations);
//               }
//             });
//           }
//         });
//       }

//       processedData.forEach((item) => {
//         if (!item) return;
//         let observationValues = [];

//         // Safe handling of observations array
//         if (item.observations && Array.isArray(item.observations)) {
//           observationValues = item.observations.slice(0, 5).map(obs => {
//             if (typeof obs === 'object' && obs !== null) {
//               return safeGetValue(obs.value);
//             }
//             return safeGetValue(obs);
//           });
//         } else {
//           // If observations is not an array, try to get individual observation values
//           observationValues = [
//             safeGetValue(item.obs1 || item.observation1),
//             safeGetValue(item.obs2 || item.observation2),
//             safeGetValue(item.obs3 || item.observation3),
//             safeGetValue(item.obs4 || item.observation4),
//             safeGetValue(item.obs5 || item.observation5)
//           ];
//         }

//         while (observationValues.length < 5) {
//           observationValues.push('');
//         }

//         const row = [
//           item.sr_no?.toString() || '',
//           safeGetValue(item.nominal_value),
//           item.average?.toString() || '',
//           item.error?.toString() || '',
//           ...observationValues
//         ];

//         rows.push(row);
//         calibrationPoints.push("1");
//         types.push('input');
//         repeatables.push('1');
//         values.push(safeGetValue(item.nominal_value) || "0");
//       });
//     }
//     else if (template === 'observationmsr') {
//       dataArray.forEach((item) => {
//         if (item.matrices && item.matrices.length > 0) {
//           item.matrices.forEach((matrix) => {
//             if (matrix.calibration_points && matrix.calibration_points.length > 0) {
//               matrix.calibration_points.forEach((point) => {
//                 const observationValues = [];

//                 // Safe handling of observations
//                 if (point.observations && Array.isArray(point.observations)) {
//                   for (let i = 0; i < 5; i++) {
//                     const obs = point.observations[i];
//                     if (obs && typeof obs === 'object' && obs.value !== undefined) {
//                       observationValues.push(safeGetValue(obs.value));
//                     } else {
//                       observationValues.push(safeGetValue(obs));
//                     }
//                   }
//                 } else {
//                   // Fallback to individual observation fields
//                   observationValues.push(
//                     safeGetValue(point.obs1),
//                     safeGetValue(point.obs2),
//                     safeGetValue(point.obs3),
//                     safeGetValue(point.obs4),
//                     safeGetValue(point.obs5)
//                   );
//                 }

//                 const row = [
//                   point.sr_no?.toString() || '',
//                   point.nominal_value || point.uuc_value || '',
//                   point.average?.toString() || '',
//                   point.error?.toString() || '',
//                   ...observationValues
//                 ];
//                 rows.push(row);
//                 calibrationPoints.push("1");
//                 types.push('input');
//                 repeatables.push('1');
//                 values.push(point.nominal_value || point.uuc_value || "0");
//               });
//             }
//           });
//         } else if (item.calibration_points && item.calibration_points.length > 0) {
//           item.calibration_points.forEach((point) => {
//             const observationValues = [];

//             // Safe handling of observations
//             if (point.observations && Array.isArray(point.observations)) {
//               for (let i = 0; i < 5; i++) {
//                 const obs = point.observations[i];
//                 if (obs && typeof obs === 'object' && obs.value !== undefined) {
//                   observationValues.push(safeGetValue(obs.value));
//                 } else {
//                   observationValues.push(safeGetValue(obs));
//                 }
//               }
//             } else {
//               observationValues.push(
//                 safeGetValue(point.obs1),
//                 safeGetValue(point.obs2),
//                 safeGetValue(point.obs3),
//                 safeGetValue(point.obs4),
//                 safeGetValue(point.obs5)
//               );
//             }

//             const row = [
//               point.sr_no?.toString() || '',
//               point.nominal_value || point.uuc_value || '',
//               point.average?.toString() || '',
//               point.error?.toString() || '',
//               ...observationValues
//             ];
//             rows.push(row);
//             calibrationPoints.push("1");
//             types.push('input');
//             repeatables.push('1');
//             values.push(point.nominal_value || point.uuc_value || "0");
//           });
//         } else if (item.sr_no) {
//           const observationValues = [];

//           // Safe handling of observations
//           if (item.observations && Array.isArray(item.observations)) {
//             for (let i = 0; i < 5; i++) {
//               const obs = item.observations[i];
//               if (obs && typeof obs === 'object' && obs.value !== undefined) {
//                 observationValues.push(safeGetValue(obs.value));
//               } else {
//                 observationValues.push(safeGetValue(obs));
//               }
//             }
//           } else {
//             observationValues.push(
//               safeGetValue(item.obs1),
//               safeGetValue(item.obs2),
//               safeGetValue(item.obs3),
//               safeGetValue(item.obs4),
//               safeGetValue(item.obs5)
//             );
//           }

//           const row = [
//             item.sr_no?.toString() || '',
//             item.nominal_value || item.uuc_value || '',
//             item.average?.toString() || '',
//             item.error?.toString() || '',
//             ...observationValues
//           ];
//           rows.push(row);
//           calibrationPoints.push("1");
//           types.push('input');
//           repeatables.push('1');
//           values.push(item.nominal_value || item.uuc_value || "0");
//         }
//       });
//     }
//     // ... Continue with other templates (dg, custom, dw, ctg, fg, hg, gtm, it) as they were
//     else if (template === 'observationdg') {
//       dataArray.forEach((obs, index) => {
//         const row = [
//           (obs.sr_no || index + 1)?.toString() || '',
//           obs.nominal_value_master || obs.nominal_value || '',
//           obs.nominal_value_uuc || obs.uuc_nominal_value || '',
//           obs.set1_forward || obs.forward_reading_1 || '',
//           obs.set1_backward || obs.backward_reading_1 || '',
//           obs.set2_forward || obs.forward_reading_2 || '',
//           obs.set2_backward || obs.backward_reading_2 || '',
//           obs.average_forward || obs.avg_forward || '',
//           obs.average_backward || obs.avg_backward || '',
//           obs.error_forward || obs.forward_error || '',
//           obs.error_backward || obs.backward_error || '',
//           obs.hysterisis || obs.hysteresis || ''
//         ];
//         rows.push(row);
//         calibrationPoints.push("1");
//         types.push('input');
//         repeatables.push('1');
//         values.push(obs.nominal_value_uuc || obs.nominal_value || "0");
//       });
//     }
//     else if (template === 'observationcustom') {
//       dataArray.forEach((obs) => {
//         const row = [
//           obs.sr_no?.toString() || '',
//           obs.parameter || '',
//           obs.specification || '',
//           obs.set_point || '',
//           obs.master_obs1 || obs.master_observations?.[0] || '',
//           obs.master_obs2 || obs.master_observations?.[1] || '',
//           obs.master_obs3 || obs.master_observations?.[2] || '',
//           obs.uuc_obs1 || obs.uuc_observations?.[0] || '',
//           obs.uuc_obs2 || obs.uuc_observations?.[1] || '',
//           obs.uuc_obs3 || obs.uuc_observations?.[2] || '',
//           obs.avg_master || obs.average_master || '',
//           obs.avg_uuc || obs.average_uuc || '',
//           obs.error || '',
//           obs.remark || ''
//         ];
//         rows.push(row);
//         calibrationPoints.push("1");
//         types.push('input');
//         repeatables.push('1');
//         values.push(obs.set_point || "0");
//       });
//     }
//     else if (template === 'observationdw') {
//       dataArray.forEach((item) => {
//         if (item.cycles && item.cycles.length > 0) {
//           item.cycles.forEach((cycle, cycleIndex) => {
//             const row = [
//               cycleIndex === 0 ? (item.sr_no?.toString() || '') : '',
//               cycleIndex === 0 ? (item.nominal_value || '') : '',
//               cycleIndex === 0 ? (item.density || '') : '',
//               cycle.S1 || cycle.s1 || '',
//               cycle.U1 || cycle.u1 || '',
//               cycle.U2 || cycle.u2 || '',
//               cycle.S2 || cycle.s2 || '',
//               cycle.Delta || cycle.delta || cycle.diff || '',
//               cycleIndex === item.cycles.length - 1 ? (item.average_diff || '') : ''
//             ];
//             rows.push(row);
//             calibrationPoints.push("1");
//             types.push('input');
//             repeatables.push('1');
//             values.push(item.nominal_value || "0");
//           });
//         } else {
//           const row = [
//             item.sr_no?.toString() || '',
//             item.nominal_value || '',
//             item.density || '',
//             '', '', '', '', '',
//             item.average_diff || ''
//           ];
//           rows.push(row);
//           calibrationPoints.push("1");
//           types.push('input');
//           repeatables.push('1');
//           values.push(item.nominal_value || "0");
//         }
//       });
//     }
//     else if (template === 'observationctg') {
//       dataArray.forEach((point) => {
//         const observations = safeGetArray(point?.observations, 5);
//         const row = [
//           point?.sr_no?.toString() || '',
//           point?.nominal_value || '',
//           safeGetValue(point?.average),
//           safeGetValue(point?.error),
//           ...observations.slice(0, 5).map(obs => safeGetValue(obs))
//         ];
//         rows.push(row);
//         calibrationPoints.push(point?.id);
//         types.push('input');
//         repeatables.push(point?.repeatable_cycle?.toString() || '3');
//         values.push(point?.nominal_value || "0");
//       });
//     }
//     else if (template === 'observationfg') {
//       dataArray.forEach((unitType) => {
//         if (unitType.matrix_data && unitType.matrix_data.length > 0) {
//           unitType.matrix_data.forEach((matrix) => {
//             if (matrix.calibration_points && matrix.calibration_points.length > 0) {
//               matrix.calibration_points.forEach((point) => {
//                 const observations = safeGetArray(point.observations, 5);
//                 const row = [
//                   point.sr_no?.toString() || '',
//                   point.nominal_value || point.test_point || '',
//                   point.average || '',
//                   point.error || '',
//                   ...observations.slice(0, 5).map(obs => safeGetValue(obs))
//                 ];
//                 while (row.length < 9) {
//                   row.push('');
//                 }
//                 rows.push(row);
//                 calibrationPoints.push("1");
//                 types.push('input');
//                 repeatables.push(point.repeatable_cycle?.toString() || '3');
//                 values.push(point.nominal_value || point.test_point || "0");
//               });
//             }
//           });
//         } else if (unitType.calibration_points && unitType.calibration_points.length > 0) {
//           unitType.calibration_points.forEach((point) => {
//             const observations = safeGetArray(point.observations, 5);
//             const row = [
//               point.sr_no?.toString() || '',
//               point.nominal_value || point.test_point || '',
//               point.average || '',
//               point.error || '',
//               ...observations.slice(0, 5).map(obs => safeGetValue(obs))
//             ];
//             while (row.length < 9) {
//               row.push('');
//             }
//             rows.push(row);
//             calibrationPoints.push("1");
//             types.push('input');
//             repeatables.push(point.repeatable_cycle?.toString() || '3');
//             values.push(point.nominal_value || point.test_point || "0");
//           });
//         } else if (unitType.sr_no) {
//           const observations = safeGetArray(unitType.observations, 5);
//           const row = [
//             unitType.sr_no?.toString() || '',
//             unitType.nominal_value || unitType.test_point || '',
//             unitType.average || '',
//             unitType.error || '',
//             ...observations.slice(0, 5).map(obs => safeGetValue(obs))
//           ];
//           while (row.length < 9) {
//             row.push('');
//           }
//           rows.push(row);
//           calibrationPoints.push("1");
//           types.push('input');
//           repeatables.push(unitType.repeatable_cycle?.toString() || '3');
//           values.push(unitType.nominal_value || unitType.test_point || "0");
//         }
//       });
//     }
//     else if (template === 'observationhg') {
//       dataArray.forEach((unitType) => {
//         if (unitType.matrix_data && unitType.matrix_data.length > 0) {
//           unitType.matrix_data.forEach((matrix) => {
//             if (matrix.calibration_points && matrix.calibration_points.length > 0) {
//               matrix.calibration_points.forEach((point) => {
//                 const observations = safeGetArray(point.observations, 5);
//                 const row = [
//                   point.sequence_number?.toString() || point.sr_no?.toString() || '',
//                   point.nominal_value || point.test_point || '',
//                   point.average || '',
//                   point.error || '',
//                   ...observations.slice(0, 5).map(obs => safeGetValue(obs))
//                 ];
//                 while (row.length < 9) {
//                   row.push('');
//                 }
//                 rows.push(row);
//                 calibrationPoints.push("1");
//                 types.push('input');
//                 repeatables.push(point.repeatable_cycle?.toString() || '3');
//                 values.push(point.nominal_value || point.test_point || "0");
//               });
//             }
//           });
//         } else if (unitType.calibration_points && unitType.calibration_points.length > 0) {
//           unitType.calibration_points.forEach((point) => {
//             const observations = safeGetArray(point.observations, 5);
//             const row = [
//               point.sr_no?.toString() || '',
//               point.nominal_value || point.test_point || '',
//               point.average || '',
//               point.error || '',
//               ...observations.slice(0, 5).map(obs => safeGetValue(obs))
//             ];
//             while (row.length < 9) {
//               row.push('');
//             }
//             rows.push(row);
//             calibrationPoints.push("1");
//             types.push('input');
//             repeatables.push(point.repeatable_cycle?.toString() || '3');
//             values.push(point.nominal_value || point.test_point || "0");
//           });
//         }
//       });
//     }
//     else if (template === 'observationgtm') {
//       dataArray.forEach((point) => {
//         const uucObservations = safeGetArray(point.uuc_observations || point.observations, 5);
//         const row = [
//           point.sr_no?.toString() || '',
//           point.set_point || '',
//           point.range || '',
//           point.test_point || point.value_of || '',
//           point.unit_description || point.unit || '',
//           point.sensitivity_coefficient || '',
//           point.average_master || '',
//           point.converted_average_master || '',
//           point.error || '',
//           ...uucObservations.slice(0, 5).map(obs => safeGetValue(obs))
//         ];
//         while (row.length < 14) {
//           row.push('');
//         }
//         rows.push(row);
//         calibrationPoints.push("1");
//         types.push('input');
//         repeatables.push(point.repeatable_cycle?.toString() || '1');
//         values.push(point.set_point || "0");
//       });
//     }
//     else if (template === 'observationit') {
//       dataArray.forEach((point) => {
//         const observations = safeGetArray(point.observations, 5);
//         const row = [
//           point.sequence_number?.toString() || point.sr_no?.toString() || '',
//           point.nominal_value || point.test_point || '',
//           point.average || '',
//           point.error || '',
//           ...observations.slice(0, 5).map(obs => safeGetValue(obs))
//         ];
//         while (row.length < 9) {
//           row.push('');
//         }
//         rows.push(row);
//         calibrationPoints.push("1");
//         types.push('input');
//         repeatables.push(point.repeatable_cycle?.toString() || '5');
//         values.push(point.nominal_value || point.test_point || "0");
//       });
//     }

//     return {
//       rows,
//       hiddenInputs: { calibrationPoints, types, repeatables, values }
//     };
//   };

//   const observationTables = [
//     // Update the observationpr table structure in the observationTables array

//     {
//       id: 'observationpr',
//       name: 'Observation PR',
//       category: 'Proving Ring',
//       structure: {
//         singleHeaders: ['Sr. No.', 'Applied Force(F)(kN)'],
//         subHeaders: {
//           'Observed (F)': [
//             'Position 0° - Observation 1',
//             'Position 120° - Observation 2',
//             'Position 240° - Observation 3'
//           ]
//         },
//         remainingHeaders: ['Mean(Fi)', '% Repeatability Error(q)', 'Factor']
//       },
//       staticRows: createObservationRows(observation, 'observationpr').rows,
//       hiddenInputs: createObservationRows(observation, 'observationpr').hiddenInputs
//     },
//     {
//       id: 'observationppg',
//       name: 'Observation PPG',
//       category: 'Pressure',
//       structure: {
//         singleHeaders: ['Sr no', 'Set Pressure on UUC (calculation unit)', '[Set Pressure on UUC (master unit)]'],
//         subHeaders: {
//           'Observation on UUC': ['M1 (↑)', 'M2 (↓)', 'M3 (↑)', 'M4 (↓)', 'M5 (↑)', 'M6 (↓)']
//         },
//         remainingHeaders: [
//           'Mean (UUC unit)',
//           'Error (UUC unit)',
//           'Repeatability (UUC unit)',
//           'Hysterisis (UUC unit)'
//         ]
//       },
//       staticRows: createObservationRows(observation, 'observationppg').rows,
//       hiddenInputs: createObservationRows(observation, 'observationppg').hiddenInputs
//     },
//     {
//       id: 'observationavg',
//       name: 'Observation AVG',
//       category: 'Pressure',
//       structure: {
//         singleHeaders: [
//           'Sr no',
//           'Set Pressure on UUC (UUC Unit)',
//           '[Set Pressure on UUC (Master Unit)]'
//         ],
//         subHeaders: {
//           'Observation on UUC': ['M1', 'M2']
//         },
//         remainingHeaders: [
//           'Mean (Master Unit)',
//           'Error (Master Unit)',
//           'Hysterisis (Master Unit)'
//         ]
//       },
//       staticRows: createObservationRows(observation, 'observationavg').rows,
//       hiddenInputs: createObservationRows(observation, 'observationavg').hiddenInputs
//     },
//     {
//       id: 'observationdpg',
//       name: 'Observation DPG',
//       category: 'Pressure',
//       structure: {
//         singleHeaders: [
//           'SR NO',
//           'SET PRESSURE ON UUC (CALCULATIONUNIT)',
//           '[SET PRESSURE ON UUC (MASTERUNIT)]'
//         ],
//         subHeaders: {
//           'OBSERVATION ON UUC': ['M1', 'M2', 'M3']
//         },
//         remainingHeaders: [
//           'MEAN (UUCUNIT)',
//           'ERROR (UUCUNIT)',
//           'REPEATABILITY (UUCUNIT)',
//           'HYSTERISIS (UUCUNIT)'
//         ]
//       },
//       staticRows: createObservationRows(observation, 'observationdpg').rows,
//       hiddenInputs: createObservationRows(observation, 'observationdpg').hiddenInputs
//     },
//     {
//       id: 'observationodfm',
//       name: 'Observation ODFM',
//       category: 'Flow Meter',
//       structure: {
//         singleHeaders: [
//           'Sr. No.',
//           'Range (UUC Unit)',
//           'Nominal/ Set Value UUC (UUC Unit)',
//           'Average (Master Unit)',
//           'Error (Master Unit)'
//         ],
//         subHeaders: {
//           'Observation on UUC': [
//             'Observation 1 (Master Unit)',
//             'Observation 2 (Master Unit)',
//             'Observation 3 (Master Unit)',
//             'Observation 4 (Master Unit)',
//             'Observation 5 (Master Unit)'
//           ]
//         },
//         remainingHeaders: []
//       },
//       staticRows: createObservationRows(observation, 'observationodfm').rows,
//       hiddenInputs: createObservationRows(observation, 'observationodfm').hiddenInputs
//     },
//     {
//       id: 'observationit',
//       name: 'Observation IT',
//       category: 'Internal Thread',
//       structure: {
//         thermalCoeff: true,
//         singleHeaders: ['Sr. No.', 'Nominal/ Set Value', 'Average', 'Error'],
//         subHeaders: {
//           'Observation on UUC': ['Observation 1', 'Observation 2', 'Observation 3', 'Observation 4', 'Observation 5']
//         },
//         remainingHeaders: []
//       },
//       staticRows: createObservationRows(observation, 'observationit').rows,
//       hiddenInputs: createObservationRows(observation, 'observationit').hiddenInputs
//     },
//     {
//       id: 'observationapg',
//       name: 'Observation APG',
//       category: 'Pressure',
//       structure: {
//         singleHeaders: ['Sr no', 'Set Pressure on UUC (kg/cm²)', 'Set Pressure on UUC (bar)'],
//         subHeaders: {
//           'Observations on Master (bar)': ['M1', 'M2']
//         },
//         remainingHeaders: ['Mean (bar)', 'Error (bar)', 'Hysterisis (bar)']
//       },
//       staticRows: createObservationRows(observation, 'observationapg').rows,
//       hiddenInputs: createObservationRows(observation, 'observationapg').hiddenInputs
//     },
//     {
//       id: 'observationfg',
//       name: 'Observation FG',
//       category: 'Force Gauge',
//       structure: {
//         thermalCoeff: true,
//         singleHeaders: ['Sr. No.', 'Nominal Value', 'Average (Master)', 'Error'],
//         subHeaders: {
//           'Observation on UUC': ['Observation 1 (Master)', 'Observation 2 (Master)', 'Observation 3 (Master)', 'Observation 4 (Master)', 'Observation 5 (Master)']
//         },
//         remainingHeaders: []
//       },
//       staticRows: createObservationRows(observation, 'observationfg').rows,
//       hiddenInputs: createObservationRows(observation, 'observationfg').hiddenInputs
//     },
//     {
//       id: 'observationrtdwi',
//       name: 'Observation RTD WI',
//       category: 'RTD',
//       structure: {
//         singleHeaders: ['Sr. No.', 'Set Point (unit)', 'Value Of', 'Unit', 'Sensitivity Coefficient', 'Average', 'mV generated On ambient', 'Average with corrected mv', 'Average (unit)', 'Deviation (unit)'],
//         subHeaders: {
//           'Observation on UUC': ['Observation 1', 'Observation 2', 'Observation 3', 'Observation 4', 'Observation 5']
//         },
//         remainingHeaders: []
//       },
//       staticRows: createObservationRows(observation, 'observationrtdwi').rows,
//       hiddenInputs: createObservationRows(observation, 'observationrtdwi').hiddenInputs
//     },
//     {
//       id: 'observationmt',
//       name: 'Observation MT',
//       category: 'Measuring Tool',
//       structure: {
//         thermalCoeff: true,
//         additionalFields: ['Thickness of graduation Line'],
//         singleHeaders: ['Sr. No.', 'Nominal Value in (mm)', 'Average in (mm)', 'Error in (mm)'],
//         subHeaders: {
//           'Observation on UUC': ['Observation 1 (mm)', 'Observation 2 (mm)', 'Observation 3 (mm)', 'Observation 4 (mm)', 'Observation 5 (mm)']
//         },
//         remainingHeaders: []
//       },
//       staticRows: createObservationRows(observation, 'observationmt').rows,
//       hiddenInputs: createObservationRows(observation, 'observationmt').hiddenInputs
//     },
//     {
//       id: 'observationmm',
//       name: 'Observation MM',
//       category: 'Multimeter',
//       structure: {
//         singleHeaders: ['Sr. No.', 'Mode', 'Range', 'Nominal/ Set Value on master', 'Average', 'Error'],
//         subHeaders: {
//           'Observation on UUC': ['Observation 1', 'Observation 2', 'Observation 3', 'Observation 4', 'Observation 5']
//         },
//         remainingHeaders: []
//       },
//       staticRows: createObservationRows(observation, 'observationmm').rows,
//       hiddenInputs: createObservationRows(observation, 'observationmm').hiddenInputs
//     },
//     {
//       id: 'observationmsr',
//       name: 'Observation MSR',
//       category: 'Measuring',
//       structure: {
//         thermalCoeff: true,
//         singleHeaders: ['Sr. No.', 'Nominal / Set Value', 'Average', 'Error'],
//         subHeaders: {
//           'Observation on UUC': ['Observation 1', 'Observation 2', 'Observation 3', 'Observation 4', 'Observation 5']
//         },
//         remainingHeaders: []
//       },
//       staticRows: createObservationRows(observation, 'observationmsr').rows,
//       hiddenInputs: createObservationRows(observation, 'observationmsr').hiddenInputs
//     },
//     {
//       id: 'observationdg',
//       name: 'Observation DG',
//       category: 'Digital',
//       structure: {
//         singleHeaders: ['Sr no', 'Nominal Value (Master Unit)', '[Nominal Value (UUC Unit)]'],
//         subHeaders: {
//           'Set 1': ['Set 1 Forward Reading', 'Set 1 Backward Reading'],
//           'Set 2': ['Set 2 Forward Reading', 'Set 2 Backward Reading']
//         },
//         remainingHeaders: ['Average Forward Reading', 'Average Backward Reading', 'Error Forward Reading', 'Error Backward Reading', 'Hysterisis']
//       },
//       staticRows: createObservationRows(observation, 'observationdg').rows,
//       hiddenInputs: createObservationRows(observation, 'observationdg').hiddenInputs
//     },
//     {
//       id: 'observationcustom',
//       name: 'Observation Custom',
//       category: 'Custom',
//       structure: {
//         singleHeaders: ['Sr. No.', 'Parameter', 'Specification', 'Set Point'],
//         subHeaders: {
//           'Master Reading': ['Master Obs 1', 'Master Obs 2', 'Master Obs 3'],
//           'UUC Reading': ['UUC Obs 1', 'UUC Obs 2', 'UUC Obs 3']
//         },
//         remainingHeaders: ['Average On Master', 'Average On UUC', 'Error', 'Remark']
//       },
//       staticRows: createObservationRows(observation, 'observationcustom').rows,
//       hiddenInputs: createObservationRows(observation, 'observationcustom').hiddenInputs
//     },
//     {
//       id: 'observationdw',
//       name: 'Observation DW',
//       category: 'Weight',
//       structure: {
//         singleHeaders: ['SR NO', 'NOMINAL VALUE OF UUC (G)', 'DENSITY OF UUC WEIGHT, PR (G/CM²)'],
//         subHeaders: {
//           'CYCLE 1': ['S1 (G)', 'U1 (G)', 'U2 (G)', 'S2 (G)', 'DIFF., ΔM ( U1 – S1) + (U2 – S2) ) / 2'],
//         },
//         remainingHeaders: ['AVG. DIFF. (G)']
//       },
//       staticRows: createObservationRows(observation, 'observationdw').rows,
//       hiddenInputs: createObservationRows(observation, 'observationdw').hiddenInputs
//     },
//     {
//       id: 'observationhg',
//       name: 'Observation HG',
//       category: 'Height Gauge',
//       structure: {
//         thermalCoeff: true,
//         singleHeaders: ['Sr. No.', 'Nominal/ Set Value', 'Average', 'Error'],
//         subHeaders: {
//           'Observation on UUC': ['Observation 1', 'Observation 2', 'Observation 3', 'Observation 4', 'Observation 5']
//         },
//         remainingHeaders: []
//       },
//       staticRows: createObservationRows(observation, 'observationhg').rows,
//       hiddenInputs: createObservationRows(observation, 'observationhg').hiddenInputs
//     },
//     {
//       id: 'observationctg',
//       name: 'Observation CTG',
//       category: 'Temperature',
//       structure: {
//         thermalCoeff: true,
//         singleHeaders: ['Sr. No.', 'Nominal Value', 'Average', 'Error'],
//         subHeaders: {
//           'Observation on UUC': ['Observation 1', 'Observation 2', 'Observation 3', 'Observation 4', 'Observation 5']
//         },
//         remainingHeaders: []
//       },
//       staticRows: createObservationRows(observation, 'observationctg').rows,
//       hiddenInputs: createObservationRows(observation, 'observationctg').hiddenInputs
//     },
//     {
//       id: 'observationmg',
//       name: 'Observation MG',
//       category: 'Manometer',
//       structure: {
//         singleHeaders: ['Sr no', 'Set Pressure on UUC ([unit])', '[Set Pressure on UUC ([master unit])]'],
//         subHeaders: {
//           'Observation on UUC': ['M1', 'M2']
//         },
//         remainingHeaders: ['Mean ([master unit])', 'Error ([master unit])', 'Hysterisis ([master unit])']
//       },
//       staticRows: createObservationRows(observation, 'observationmg').rows,
//       hiddenInputs: createObservationRows(observation, 'observationmg').hiddenInputs
//     },
//     {
//       id: 'observationexm',
//       name: 'Observation EXM',
//       category: 'External',
//       structure: {
//         thermalCoeff: true,
//         singleHeaders: ['Sr. No.', 'Nominal Value', 'Average', 'Error'],
//         subHeaders: {
//           'Observation on UUC': ['Observation 1', 'Observation 2', 'Observation 3', 'Observation 4', 'Observation 5']
//         },
//         remainingHeaders: []
//       },
//       staticRows: createObservationRows(observation, 'observationexm').rows,
//       hiddenInputs: createObservationRows(observation, 'observationexm').hiddenInputs
//     },
//     {
//       id: 'observationrtdwoi',
//       name: 'Observation RTD WOI',
//       category: 'RTD',
//       structure: {
//         singleHeaders: [
//           'Sr. No.',
//           'Set Point (unit)',
//           'Value Of',
//           'Unit',
//           'Sensitivity Coefficient',
//           'Average',
//           'mV generated On ambient',
//           'Average with corrected mv',
//           'Average (unit)',
//           'Deviation (unit)'
//         ],
//         subHeaders: {
//           'Observation on UUC': [
//             'Observation 1',
//             'Observation 2',
//             'Observation 3',
//             'Observation 4',
//             'Observation 5'
//           ]
//         },
//         remainingHeaders: []
//       },
//       staticRows: createObservationRows(observation, 'observationrtdwoi').rows,
//       hiddenInputs: createObservationRows(observation, 'observationrtdwoi').hiddenInputs
//     },
//     {
//       id: 'observationgtm',
//       name: 'Observation GTM',
//       category: 'General Temperature',
//       structure: {
//         singleHeaders: ['Sr. No.', 'Set Point (unit)', 'Range', 'Value Of', 'Unit', 'Sensitivity Coefficient', 'Average (Ω)', 'Average (unit)', 'Error (unit)'],
//         subHeaders: {
//           'Observation on UUC': ['Observation 1', 'Observation 2', 'Observation 3', 'Observation 4', 'Observation 5']
//         },
//         remainingHeaders: []
//       },
//       staticRows: createObservationRows(observation, 'observationgtm').rows,
//       hiddenInputs: createObservationRows(observation, 'observationgtm').hiddenInputs
//     }
//   ];

//   // Filter tables based on observationTemplate
//   const availableTables = observationTables.filter(table =>
//     observationTemplate && table.id === observationTemplate
//   );

//   const [selectedTable, setSelectedTable] = useState('');

//   // Set selected table when observationTemplate is available
//   useEffect(() => {
//     if (observationTemplate && availableTables.length > 0) {
//       setSelectedTable(observationTemplate);
//     }
//   }, [observationTemplate, availableTables.length]);

//   const selectedTableData = availableTables.find(table => table.id === selectedTable);

//   const generateTableStructure = () => {
//     if (!selectedTableData || !selectedTableData.structure) return null;

//     const structure = selectedTableData.structure;
//     const headers = [];
//     const subHeadersRow = [];

//     structure.singleHeaders.forEach((header) => {
//       headers.push({ name: header, colspan: 1 });
//       subHeadersRow.push(null);
//     });

//     if (structure.subHeaders && Object.keys(structure.subHeaders).length > 0) {
//       Object.entries(structure.subHeaders).forEach(([groupName, subHeaders]) => {
//         headers.push({ name: groupName, colspan: subHeaders.length });
//         subHeaders.forEach(subHeader => {
//           subHeadersRow.push(subHeader);
//         });
//       });
//     }

//     if (structure.remainingHeaders && structure.remainingHeaders.length > 0) {
//       structure.remainingHeaders.forEach((header) => {
//         headers.push({ name: header, colspan: 1 });
//         subHeadersRow.push(null);
//       });
//     }

//     return { headers, subHeadersRow };
//   };

//   const tableStructure = generateTableStructure();

//   const handleInputChange = (rowIndex, colIndex, value) => {
//     setTableInputValues(prev => {
//       const newValues = { ...prev };
//       const key = `${rowIndex}-${colIndex}`;
//       newValues[key] = value;
//       return newValues;
//     });
//   };

//   const handleBackToInwardList = () => {
//     navigate(`/dashboards/calibration-process/inward-entry-lab?caliblocation=${caliblocation}&calibacc=${calibacc}`);
//   };

//   const handleBackToPerformCalibration = () => {
//     navigate(`/dashboards/calibration-process/inward-entry-lab/perform-calibration/${id}?caliblocation=${caliblocation}&calibacc=${calibacc}`);
//   };

//   const handleFormChange = (e) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({
//       ...prev,
//       [name]: value
//     }));
//   };

//   const renderThermalCoefficientSection = () => {
//     if (!selectedTableData?.structure?.thermalCoeff) return null;

//     return (
//       <div className="mb-6">
//         <h3 className="text-md font-medium text-gray-800 dark:text-white mb-2">Thermal Coefficient</h3>
//         <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded border border-gray-200 dark:border-gray-600">
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
//                 UUC Thermal Coefficient:
//               </label>
//               <input
//                 type="text"
//                 value={thermalCoeff.uuc}
//                 onChange={(e) => setThermalCoeff(prev => ({ ...prev, uuc: e.target.value }))}
//                 className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
//                 placeholder="Enter UUC thermal coefficient"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
//                 Master Thermal Coefficient:
//               </label>
//               <input
//                 type="text"
//                 value={thermalCoeff.master}
//                 onChange={(e) => setThermalCoeff(prev => ({ ...prev, master: e.target.value }))}
//                 className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
//                 placeholder="Enter master thermal coefficient"
//               />
//             </div>
//             {selectedTableData?.structure?.additionalFields?.includes('Thickness of graduation Line') && (
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
//                   Thickness of graduation Line:
//                 </label>
//                 <input
//                   type="text"
//                   value={thermalCoeff.thickness_of_graduation}
//                   onChange={(e) => setThermalCoeff(prev => ({ ...prev, thickness_of_graduation: e.target.value }))}
//                   className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
//                   placeholder="Enter thickness"
//                 />
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     );
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     const token = localStorage.getItem("authToken");

//     const step3Data = {
//       selectedTable,
//       tableInputValues,
//       ...formData,
//     };
//     console.log('Step3 Form submitted:', { step1Data, step2Data, step3Data });

//     const hiddenInputs = selectedTableData?.hiddenInputs || {
//       calibrationPoints: [],
//       types: [],
//       repeatables: [],
//       values: [],
//     };

//     const payload = {
//       inwardid: inwardId,
//       id: instId,
//       caliblocation: formData.calibLocation || 'Lab',
//       calibacc: formData.calibAcc || 'Nabl',
//       tempend: formData.tempend,
//       humiend: formData.humiend,
//       notes: formData.notes,
//       enddate: formData.enddate,
//       duedate: formData.duedate,
//       calibrationpoint: hiddenInputs.calibrationPoints,
//       type: hiddenInputs.types,
//       repeatable: hiddenInputs.repeatables,
//       value: hiddenInputs.values,
//     };

//     if (selectedTable === 'observationmt') {
//       payload.thermal_coeff = {
//         uuc: thermalCoeff.uuc,
//         master: thermalCoeff.master,
//         thickness_of_graduation: thermalCoeff.thickness_of_graduation
//       };
//     }

//     if (selectedTable === 'observationrtdwi' && observation.unit_description) {
//       payload.unit_description = observation.unit_description;
//     }

//     console.log('Payload:', payload);

//     try {
//       const response = await fetch(`${JWT_HOST_API}/calibrationprocess/insert-calibration-step3`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${token}`,
//         },
//         body: JSON.stringify(payload),
//       });

//       if (response.ok) {
//         const result = await response.json();
//         console.log('✅ API Success:', result);
//         toast.success("Calibration completed successfully!");
//       } else {
//         const errorText = await response.text();
//         console.error('❌ API Error Response:', errorText);
//         toast.error("Submission failed: Unauthorized or bad request.");
//       }
//     } catch (error) {
//       console.error('❌ Network or JSON Error:', error);
//       toast.error('Something went wrong while submitting');
//     }
//   };

//   return (
//     <Page title="CalibrateStep3">
//       <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
//         <div className="max-w-7xl mx-auto">
//           <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-4">
//             <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
//               <h1 className="text-xl font-medium text-gray-800 dark:text-white">Fill Dates</h1>
//               <div className="flex gap-2">
//                 <Button
//                   variant="outline"
//                   onClick={handleBackToInwardList}
//                   className="bg-indigo-500 hover:bg-fuchsia-500 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
//                 >
//                   ← Back to Inward Entry List
//                 </Button>
//                 <Button
//                   variant="outline"
//                   onClick={handleBackToPerformCalibration}
//                   className="bg-indigo-500 hover:bg-fuchsia-500 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
//                 >
//                   ← Back to Perform Calibration
//                 </Button>
//               </div>
//             </div>

//             <div className="p-6 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
//               <div className="grid grid-cols-12 gap-4 text-sm">
//                 <div className="col-span-6 space-y-2">
//                   <div className="flex">
//                     <span className="w-48 font-medium text-gray-700 dark:text-gray-200">Name Of The Equipment:</span>
//                     <span className="text-gray-900 dark:text-white">{instrument?.name || 'N/A'}</span>
//                   </div>
//                   <div className="text-blue-600 dark:text-blue-400 font-medium">
//                     PRESSURE, MASS & VOLUME LAB<br />
//                     Alloted Lab: {caliblocation}
//                   </div>
//                   <div className="flex">
//                     <span className="w-48 font-medium text-gray-700 dark:text-gray-200">Make:</span>
//                     <span className="text-gray-900 dark:text-white">{instrument?.make || 'N/A'}</span>
//                   </div>
//                   <div className="flex">
//                     <span className="w-48 font-medium text-gray-700 dark:text-gray-200">Model:</span>
//                     <span className="text-gray-900 dark:text-white">{instrument?.model || 'N/A'}</span>
//                   </div>
//                   <div className="flex">
//                     <span className="w-48 font-medium text-gray-700 dark:text-gray-200">SR no:</span>
//                     <span className="text-gray-900 dark:text-white">{instrument?.serialno || 'N/A'}</span>
//                   </div>
//                   <div className="flex">
//                     <span className="w-48 font-medium text-gray-700 dark:text-gray-200">Id no:</span>
//                     <span className="text-gray-900 dark:text-white">{instrument?.idno || 'N/A'}</span>
//                   </div>
//                   <div className="flex">
//                     <span className="w-48 font-medium text-gray-700 dark:text-gray-200">Calibrated On:</span>
//                     <span className="text-gray-900 dark:text-white">{instrument?.startdate || 'N/A'}</span>
//                   </div>
//                   <div className="flex">
//                     <span className="w-48 font-medium text-gray-700 dark:text-gray-200">Issue Date:</span>
//                     <span className="text-gray-900 dark:text-white">{instrument?.issuedate || 'N/A'}</span>
//                   </div>
//                 </div>
//                 <div className="col-span-6 space-y-2">
//                   <div className="flex">
//                     <span className="w-32 font-medium text-gray-700 dark:text-gray-200">BRN No:</span>
//                     <span className="text-gray-900 dark:text-white">{instrument?.bookingrefno || 'N/A'}</span>
//                   </div>
//                   <div className="flex">
//                     <span className="w-32 font-medium text-gray-700 dark:text-gray-200">Receive Date:</span>
//                     <span className="text-gray-900 dark:text-white">{inwardEntry?.sample_received_on || 'N/A'}</span>
//                   </div>
//                   <div className="flex">
//                     <span className="w-32 font-medium text-gray-700 dark:text-gray-200">Range:</span>
//                     <span className="text-gray-900 dark:text-white">{instrument?.equipmentrange || 'N/A'}</span>
//                   </div>
//                   <div className="flex">
//                     <span className="w-32 font-medium text-gray-700 dark:text-gray-200">Least Count:</span>
//                     <span className="text-gray-900 dark:text-white">{instrument?.leastcount || 'N/A'}</span>
//                   </div>
//                   <div className="flex">
//                     <span className="w-32 font-medium text-gray-700 dark:text-gray-200">Condition Of UUC:</span>
//                     <span className="text-gray-900 dark:text-white">{instrument?.conditiononrecieve || 'N/A'}</span>
//                   </div>
//                   <div className="flex">
//                     <span className="w-32 font-medium text-gray-700 dark:text-gray-200">Calibration performed At:</span>
//                     <span className="text-gray-900 dark:text-white">{instrument?.performedat || 'Lab'}</span>
//                   </div>
//                   <div className="flex">
//                     <span className="w-32 font-medium text-gray-700 dark:text-gray-200">Temperature (°C):</span>
//                     <span className="text-gray-900 dark:text-white">{instrument?.temperature || 'N/A'}</span>
//                   </div>
//                   <div className="flex">
//                     <span className="w-32 font-medium text-gray-700 dark:text-gray-200">Humidity (%RH):</span>
//                     <span className="text-gray-900 dark:text-white">{instrument?.humidity || 'N/A'}</span>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             <form onSubmit={handleSubmit} className="p-6">
//               <h2 className="text-lg font-medium text-gray-800 dark:text-white mb-4">Masters</h2>
//               <div className="mb-6">
//                 <div className="overflow-x-auto">
//                   <table className="w-full text-sm border-collapse border border-gray-300 dark:border-gray-600">
//                     <thead>
//                       <tr className="bg-gray-100 dark:bg-gray-700">
//                         <th className="p-2 border border-gray-300 dark:border-gray-600 font-medium text-left text-gray-800 dark:text-white">Reference Standard</th>
//                         <th className="p-2 border border-gray-300 dark:border-gray-600 font-medium text-left text-gray-800 dark:text-white">S.w/o</th>
//                         <th className="p-2 border border-gray-300 dark:border-gray-600 font-medium text-left text-gray-800 dark:text-white">LD.No.</th>
//                         <th className="p-2 border border-gray-300 dark:border-gray-600 font-medium text-left text-gray-800 dark:text-white">Certificate No.</th>
//                         <th className="p-2 border border-gray-300 dark:border-gray-600 font-medium text-left text-gray-800 dark:text-white">Valid Upto</th>
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {masters && masters.length > 0 ? (
//                         masters.map((item, index) => (
//                           <tr key={index} className="dark:bg-gray-800">
//                             <td className="p-2 border border-gray-300 dark:border-gray-600 dark:text-white">{item.name}</td>
//                             <td className="p-2 border border-gray-300 dark:border-gray-600 dark:text-white">{item.serialno}</td>
//                             <td className="p-2 border border-gray-300 dark:border-gray-600 dark:text-white">{item.idno}</td>
//                             <td className="p-2 border border-gray-300 dark:border-gray-600 dark:text-white">{item.certificateno}</td>
//                             <td className="p-2 border border-gray-300 dark:border-gray-600 dark:text-white">{item.enddate}</td>
//                           </tr>
//                         ))
//                       ) : (
//                         <tr>
//                           <td colSpan="5" className="p-2 border border-gray-300 dark:border-gray-600 text-center dark:text-white">
//                             No data available
//                           </td>
//                         </tr>
//                       )}
//                     </tbody>
//                   </table>
//                 </div>
//               </div>

//               <div className="mb-6">
//                 <h2 className="text-md font-medium text-gray-800 dark:text-white mb-2">Support masters</h2>
//                 <div className="overflow-x-auto">
//                   <table className="w-full text-sm border-collapse border border-gray-300 dark:border-gray-600">
//                     <thead>
//                       <tr className="bg-gray-100 dark:bg-gray-700">
//                         <th className="p-2 border border-gray-300 dark:border-gray-600 font-medium text-left text-gray-800 dark:text-white">Reference Standard</th>
//                         <th className="p-2 border border-gray-300 dark:border-gray-600 font-medium text-left text-gray-800 dark:text-white">S.w/o</th>
//                         <th className="p-2 border border-gray-300 dark:border-gray-600 font-medium text-left text-gray-800 dark:text-white">LD.No.</th>
//                         <th className="p-2 border border-gray-300 dark:border-gray-600 font-medium text-left text-gray-800 dark:text-white">Certificate No.</th>
//                         <th className="p-2 border border-gray-300 dark:border-gray-600 font-medium text-left text-gray-800 dark:text-white">Valid Upto</th>
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {supportMasters && supportMasters.length > 0 ? (
//                         supportMasters.map((item, index) => (
//                           <tr key={index} className="dark:bg-gray-800">
//                             <td className="p-2 border border-gray-300 dark:border-gray-600 dark:text-white">{item.name}</td>
//                             <td className="p-2 border border-gray-300 dark:border-gray-600 dark:text-white">{item.serialno}</td>
//                             <td className="p-2 border border-gray-300 dark:border-gray-600 dark:text-white">{item.idno}</td>
//                             <td className="p-2 border border-gray-300 dark:border-gray-600 dark:text-white">{item.certificateno}</td>
//                             <td className="p-2 border border-gray-300 dark:border-gray-600 dark:text-white">{item.enddate}</td>
//                           </tr>
//                         ))
//                       ) : (
//                         <tr>
//                           <td colSpan="5" className="p-2 border border-gray-300 dark:border-gray-600 text-center dark:text-white">
//                             No data available
//                           </td>
//                         </tr>
//                       )}
//                     </tbody>
//                   </table>
//                 </div>
//               </div>

//               {renderThermalCoefficientSection()}

//               <div className="mb-6">
//                 <h2 className="text-md font-medium text-gray-800 dark:text-white mb-4">Observation Detail</h2>
//                 {observationTemplate && (
//                   <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-3 mb-4">
//                     <p className="text-sm text-blue-800 dark:text-blue-200">
//                       <strong>Current Observation Template:</strong> {observationTemplate}
//                     </p>
//                   </div>
//                 )}

//                 {selectedTableData && tableStructure && (
//                   <div className="overflow-x-auto border border-gray-200 dark:border-gray-600">
//                     <table className="w-full text-sm">
//                       <thead>
//                         <tr className="bg-gray-100 dark:bg-gray-700 border-b border-gray-300 dark:border-gray-600">
//                           {tableStructure.headers.map((header, index) => (
//                             <th
//                               key={index}
//                               colSpan={header.colspan}
//                               className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider border-r border-gray-300 dark:border-gray-600 last:border-r-0"
//                             >
//                               {header.name}
//                             </th>
//                           ))}
//                         </tr>
//                         {tableStructure.subHeadersRow.some(item => item !== null) && (
//                           <tr className="bg-gray-50 dark:bg-gray-600 border-b border-gray-300 dark:border-gray-600">
//                             {tableStructure.subHeadersRow.map((subHeader, index) => (
//                               <th
//                                 key={index}
//                                 className="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-300 border-r border-gray-300 dark:border-gray-600 last:border-r-0"
//                               >
//                                 {subHeader}
//                               </th>
//                             ))}
//                           </tr>
//                         )}
//                       </thead>
//                       <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
//                         {(selectedTableData.staticRows?.length > 0
//                           ? selectedTableData.staticRows
//                           : [Array(tableStructure.subHeadersRow.length).fill("")]).map((row, rowIndex) => (
//                             <tr key={rowIndex} className="hover:bg-gray-50 dark:hover:bg-gray-700">
//                               {row.map((cell, colIndex) => (
//                                 <td
//                                   key={colIndex}
//                                   className="px-3 py-2 whitespace-nowrap text-sm border-r border-gray-200 dark:border-gray-600 last:border-r-0"
//                                 >
//                                   <input
//                                     type="text"
//                                     className="w-full px-2 py-1 border border-gray-200 dark:border-gray-600 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
//                                     value={
//                                       tableInputValues[`${rowIndex}-${colIndex}`] ??
//                                       (cell?.toString() || '')
//                                     }
//                                     onChange={(e) =>
//                                       handleInputChange(rowIndex, colIndex, e.target.value)
//                                     }
//                                   />
//                                 </td>
//                               ))}
//                             </tr>
//                           ))}
//                       </tbody>
//                     </table>
//                   </div>
//                 )}

//                 {observationTemplate && observation.length === 0 && (
//                   <div className="text-center py-8 text-gray-500 dark:text-gray-400">
//                     <p>No observations found for template: {observationTemplate}</p>
//                   </div>
//                 )}
//               </div>

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
//                     Temperature End (°C) <span className="text-red-500">*</span>:
//                   </label>
//                   <input
//                     type="text"
//                     name="tempend"
//                     value={formData.tempend}
//                     onChange={handleFormChange}
//                     className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
//                     placeholder="Enter temperature range"
//                     required
//                   />
//                   {temperatureRange && (
//                     <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
//                       Range: {temperatureRange.min ? `${temperatureRange.min} - ${temperatureRange.max}` : temperatureRange.value || 'N/A'}
//                     </p>
//                   )}
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
//                     Humidity End (%RH) <span className="text-red-500">*</span>:
//                   </label>
//                   <input
//                     type="text"
//                     name="humiend"
//                     value={formData.humiend}
//                     onChange={handleFormChange}
//                     className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
//                     placeholder="Enter humidity range"
//                     required
//                   />
//                   {humidityRange && (
//                     <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
//                       Range: {humidityRange.min ? `${humidityRange.min} - ${humidityRange.max}` : humidityRange.value || 'N/A'}
//                     </p>
//                   )}
//                 </div>
//               </div>

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
//                     Calibration End Date/Done date:
//                   </label>
//                   <input
//                     type="date"
//                     name="enddate"
//                     value={formData.enddate}
//                     onChange={handleFormChange}
//                     className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-600 text-gray-900 dark:text-white"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
//                     Suggested Due Date:
//                   </label>
//                   <input
//                     type="date"
//                     name="duedate"
//                     value={formData.duedate}
//                     onChange={handleFormChange}
//                     className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
//                   />
//                 </div>
//               </div>

//               <div className="mt-4">
//                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Notes:</label>
//                 <textarea
//                   name="notes"
//                   value={formData.notes}
//                   onChange={handleFormChange}
//                   rows={3}
//                   className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
//                   placeholder="Enter notes"
//                 />
//               </div>

//               <div className="flex justify-end mt-8 mb-4">
//                 <Button
//                   type="submit"
//                   className="bg-green-500 hover:bg-green-600 text-white px-8 py-2 rounded font-medium transition-colors"
//                 >
//                   Submit
//                 </Button>
//               </div>
//             </form>
//           </div>

//           <div className="flex items-center justify-between px-6 pb-6">
//             <div className="flex-1 mx-4">
//               <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
//                 <div className="bg-green-500 h-2 rounded-full transition-all duration-300" style={{ width: '75%' }}></div>
//               </div>
//             </div>
//             <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">›</button>
//           </div>
//         </div>
//       </div>
//     </Page>
//   );
// };

// export default CalibrateStep3;







// import { useState, useEffect } from 'react';
// import { useNavigate, useParams } from 'react-router';
// import { Page } from "components/shared/Page";
// import { Button } from "components/ui/Button";
// import { toast } from "sonner";
// import axios from "utils/axios";

// const CalibrateStep3 = () => {
//   const navigate = useNavigate();
//   const { id } = useParams();
//   const { id: inwardId, itemId: instId } = useParams();
//   // Removed unused 'location' variable
//   const searchParams = new URLSearchParams(window.location.search);
//   const caliblocation = searchParams.get("caliblocation") || "Lab";
//   const calibacc = searchParams.get("calibacc") || "Nabl";

//   // All state declarations
//   const [instrument, setInstrument] = useState(null);
//   const [inwardEntry, setInwardEntry] = useState(null);
//   const [masters, setMasters] = useState([]);
//   const [supportMasters, setSupportMasters] = useState([]);
//   const [observationTemplate, setObservationTemplate] = useState(null);
//   const [temperatureRange, setTemperatureRange] = useState(null);
//   const [humidityRange, setHumidityRange] = useState(null);
//   const [observation, setObservations] = useState([]);
//   const [tableInputValues, setTableInputValues] = useState({});
//   const [thermalCoeff, setThermalCoeff] = useState({
//     uuc: '',
//     master: '',
//     thickness_of_graduation: ''
//   });



//   // Theme state management
//   const [theme, setTheme] = useState(() => {
//     const savedTheme = localStorage.getItem('theme');
//     if (savedTheme) return savedTheme;
//     if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
//       return 'dark';
//     }
//     return 'light';
//   });

//   // Form data with pre-filled values from API
//   const [formData, setFormData] = useState({
//     enddate: '',
//     duedate: '',
//     notes: '',
//     tempend: '',
//     humiend: ''
//   });

//   // First API call to get calibration step3 details
//   useEffect(() => {
//     axios.get('https://kailtech.in/newlims/api/calibrationprocess/get-calibration-step3-details', {
//       params: {
//         inward_id: inwardId,
//         instid: instId,
//         caliblocation: caliblocation,
//         calibacc: calibacc
//       }
//     }).then((res) => {
//       console.log("✅ API Data:", res.data);
//       const data = res.data;

//       setInwardEntry(data.inwardEntry);
//       setInstrument(data.instrument);
//       setMasters(data.masters);
//       setSupportMasters(data.supportMasters);
//       setObservationTemplate(data.observationTemplate);
//       setTemperatureRange(data.temperatureRange);
//       setHumidityRange(data.humidityRange);

//       // Set form data from API response
//       setFormData(prev => ({
//         ...prev,
//         enddate: data.instrument?.enddate || '',
//         humiend: data.instrument?.humiend || '',
//         tempend: data.instrument?.tempend || '',
//         duedate: data.instrument?.duedate || '',
//         temperatureEnd: data.temperatureRange?.min && data.temperatureRange?.max
//           ? `${data.temperatureRange.min} - ${data.temperatureRange.max}`
//           : data.temperatureRange?.value || '',
//         humidityEnd: data.humidityRange?.min && data.humidityRange?.max
//           ? `${data.humidityRange.min} - ${data.humidityRange.max}`
//           : data.humidityRange?.value || ''
//       }));
//     }).catch((err) => {
//       console.error("❌ API Error:", err.response?.data || err);
//       toast.error("Failed to fetch calibration data");
//     });
//   }, [inwardId, instId, caliblocation, calibacc]);

//   const safeGetValue = (item) => {
//     if (!item) return '';
//     if (typeof item === 'object' && item !== null) {
//       return item.value !== null && item.value !== undefined ? item.value : '';
//     }
//     return item.toString();
//   };

//   const safeGetArray = (item, defaultLength = 0) => {
//     if (!item) return Array(defaultLength).fill('');
//     if (Array.isArray(item)) return item;
//     if (typeof item === 'string') return [item];
//     return Array(defaultLength).fill('');
//   };

//   // Updated observation fetching useEffect
//   useEffect(() => {
//     const fetchObservations = async () => {
//       if (!observationTemplate) return;

//       try {
//         const response = await axios.post(
//           "https://kailtech.in/newlims/api/ob/get-observation",
//           {
//             fn: observationTemplate,
//             instid: instId,
//             inwardid: inwardId,
//           }
//         );

//         // Handle both 'status' and 'staus' (API typo)
//         const isSuccess = response.data.status === true || response.data.staus === true;

//         if (isSuccess && response.data.data) {
//           const observationData = response.data.data;
//           console.log("📊 Observation Data:", observationData);

//           // Extract thermal coefficients for MT
//           if (observationTemplate === 'observationmt' && observationData.thermal_coeff) {
//             setThermalCoeff({
//               uuc: observationData.thermal_coeff.uuc || '',
//               master: observationData.thermal_coeff.master || '',
//               thickness_of_graduation: observationData.thermal_coeff.thickness_of_graduation || ''
//             });
//           }

//           // Handle different observation template structures
//           if (observationTemplate === 'observationodfm' && observationData.calibration_points) {
//             console.log("Setting ODFM observations:", observationData.calibration_points);
//             setObservations(observationData.calibration_points);
//           }
//           else if (observationTemplate === 'observationrtdwi') {
//             console.log("Setting RTD WI observations:", observationData);
//             setObservations(observationData);
//           }
//           else if (observationTemplate === 'observationmt' && observationData.calibration_points) {
//             setObservations(observationData.calibration_points);
//           }
//           else if (observationTemplate === 'observationdpg' && observationData.calibration_points) {
//             setObservations(observationData.calibration_points);
//           }
//           else if (observationTemplate === 'observationmm') {
//             if (observationData.unit_types && Array.isArray(observationData.unit_types)) {
//               setObservations(observationData.unit_types);
//             } else if (observationData.calibration_points) {
//               setObservations(observationData.calibration_points);
//             } else {
//               setObservations(observationData);
//             }
//           }
//           else if (observationTemplate === 'observationmsr' || observationTemplate === 'observationexm') {
//             if (observationData.unit_types && Array.isArray(observationData.unit_types)) {
//               setObservations(observationData.unit_types);
//             } else if (observationData.matrices && Array.isArray(observationData.matrices)) {
//               setObservations(observationData.matrices);
//             } else {
//               setObservations(observationData);
//             }
//           }
//           else if (observationTemplate === 'observationdg' && observationData.calibration_points) {
//             setObservations(observationData.calibration_points);
//           }
//           else if (observationTemplate === 'observationcustom' && observationData.calibration_points) {
//             setObservations(observationData.calibration_points);
//           }
//           else if (observationTemplate === 'observationdw' && observationData.calibration_points) {
//             setObservations(observationData.calibration_points);
//           }
//           else if (observationTemplate === 'observationctg' && observationData.points) {
//             console.log("CTG Points with IDs:", observationData.points.map(p => ({ id: p.id, sr_no: p.sr_no })));
//             setObservations(observationData.points);
//           }

//           else if (observationTemplate === 'observationfg') {
//             if (observationData.unit_types && Array.isArray(observationData.unit_types)) {
//               setObservations(observationData.unit_types);
//             } else if (observationData.calibration_points) {
//               setObservations(observationData.calibration_points);
//             } else {
//               setObservations(observationData);
//             }
//           }
//           else if (observationTemplate === 'observationrtdwoi' && observationData.calibration_data) {
//             console.log("Setting RTD WOI observations:", observationData.calibration_data);
//             setObservations(observationData.calibration_data);
//           }
//           else if (observationTemplate === 'observationhg') {
//             if (observationData.unit_types && Array.isArray(observationData.unit_types)) {
//               setObservations(observationData.unit_types);
//             } else if (observationData.calibration_points) {
//               setObservations(observationData.calibration_points);
//             } else {
//               setObservations(observationData);
//             }
//           }
//           else if (observationTemplate === 'observationgtm' && observationData.calibration_points) {
//             setObservations(observationData.calibration_points);
//           }
//           else {
//             if (observationData.observations) {
//               setObservations(observationData.observations);
//             } else if (observationData.data) {
//               setObservations(observationData.data);
//             } else if (observationData.points) {
//               setObservations(observationData.points);
//             } else if (observationData.calibration_points) {
//               setObservations(observationData.calibration_points);
//             } else {
//               setObservations(observationData);
//             }
//           }
//         } else {
//           console.log("No observations found");
//           setObservations([]);
//         }
//       } catch (error) {
//         console.log("Error fetching observations:", error);
//         setObservations([]);
//       }
//     };

//     fetchObservations();
//   }, [observationTemplate, instId, inwardId]);

//   // Theme effects
//   useEffect(() => {
//     document.documentElement.classList.remove('light', 'dark');
//     document.documentElement.classList.add(theme);
//     localStorage.setItem('theme', theme);
//   }, [theme]);

//   useEffect(() => {
//     const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
//     const handleChange = () => {
//       if (!localStorage.getItem('theme')) {
//         setTheme(mediaQuery.matches ? 'dark' : 'light');
//       }
//     };

//     mediaQuery.addEventListener('change', handleChange);
//     return () => mediaQuery.removeEventListener('change', handleChange);
//   }, []);

//   const createObservationRows = (observationData, template) => {
//     if (!observationData) return { rows: [], hiddenInputs: { calibrationPoints: [], types: [], repeatables: [], values: [] } };

//     let dataArray = [];
//     const calibrationPoints = [];
//     const types = [];
//     const repeatables = [];
//     const values = [];

//     // Handle different data structures with null checks
//     if (Array.isArray(observationData)) {
//       dataArray = observationData;
//     } else if (typeof observationData === 'object' && observationData !== null) {
//       if (observationData.observations && Array.isArray(observationData.observations)) {
//         dataArray = observationData.observations;
//       } else if (observationData.data && Array.isArray(observationData.data)) {
//         dataArray = observationData.data;
//       } else if (observationData.points && Array.isArray(observationData.points)) {
//         dataArray = observationData.points;
//       } else if (observationData.calibration_points && Array.isArray(observationData.calibration_points)) {
//         dataArray = observationData.calibration_points;
//       } else {
//         dataArray = [observationData];
//       }
//     }

//     const rows = [];

//     if (template === 'observationdpg') {
//       dataArray.forEach((obs) => {
//         if (!obs) return;

//         const row = [
//           obs.sr_no?.toString() || '',
//           safeGetValue(obs.uuc_value || obs.set_pressure_uuc),
//           safeGetValue(obs.converted_uuc_value || obs.set_pressure_master),
//           safeGetValue(obs.master_readings?.m1 || obs.m1),
//           safeGetValue(obs.master_readings?.m2 || obs.m2),
//           safeGetValue(obs.master_readings?.m3 || obs.m3),
//           safeGetValue(obs.average_master || obs.mean),
//           safeGetValue(obs.error),
//           safeGetValue(obs.repeatability),
//           safeGetValue(obs.hysterisis || obs.hysteresis)
//         ];
//         rows.push(row);

//         // 👉 IMPORTANT: Use calibration_point_id from API response
//         calibrationPoints.push(obs.calibration_point_id?.toString() || "1");
//         types.push('master');
//         repeatables.push('0');
//         values.push(safeGetValue(obs.uuc_value || obs.set_pressure_uuc) || "0");
//       });
//     }
//     else if (template === 'observationodfm') {
//       dataArray.forEach((point) => {
//         if (!point) return;
//         const observations = safeGetArray(point.observations, 5);
//         const row = [
//           point.sr_no?.toString() || '',
//           safeGetValue(point.range),
//           safeGetValue(point.nominal_value || point.uuc_value),
//           safeGetValue(point.average),
//           safeGetValue(point.error),
//           ...observations.slice(0, 5).map(obs => safeGetValue(obs))
//         ];
//         while (row.length < 10) {
//           row.push('');
//         }
//         rows.push(row);
//         calibrationPoints.push("1");
//         types.push('input');
//         repeatables.push(point.metadata?.repeatable_cycle?.toString() || '5');
//         values.push(safeGetValue(point.nominal_value || point.uuc_value) || "0");
//       });
//     }
//     else if (template === 'observationrtdwoi') {
//       let pointsToProcess = [];
//       if (observationData.calibration_data && Array.isArray(observationData.calibration_data)) {
//         pointsToProcess = observationData.calibration_data;
//       } else if (dataArray.length > 0) {
//         pointsToProcess = dataArray;
//       }

//       pointsToProcess.forEach((point) => {
//         if (!point) return;
//         const uucReadings = safeGetArray(point.uuc_readings, 5);
//         const row = [
//           point.sr_no?.toString() || '',
//           safeGetValue(point.set_point),
//           safeGetValue(point.average_master),
//           safeGetValue(point.unit_description),
//           safeGetValue(point.sensitivity_coefficient),
//           safeGetValue(point.saverage_master),
//           safeGetValue(point.ambient_master),
//           safeGetValue(point.caverage_master),
//           safeGetValue(point.average_uuc),
//           safeGetValue(point.error),
//           ...uucReadings.slice(0, 5).map(val => safeGetValue(val))
//         ];
//         while (row.length < 15) {
//           row.push('');
//         }
//         rows.push(row);
//         calibrationPoints.push("1");
//         types.push('input');
//         repeatables.push('1');
//         values.push(safeGetValue(point.set_point) || "0");
//       });
//     }
//     else if (template === 'observationmg') {
//       let pointsToProcess = [];
//       if (observationData.calibration_points && Array.isArray(observationData.calibration_points)) {
//         pointsToProcess = observationData.calibration_points;
//       } else if (dataArray.length > 0) {
//         pointsToProcess = dataArray;
//       }

//       pointsToProcess.forEach((point) => {
//         if (!point) return;

//         const row = [
//           point.sequence_number?.toString() || point.sr_no?.toString() || '',
//           safeGetValue(point.set_pressure?.uuc_value || point.uuc_value),
//           safeGetValue(point.set_pressure?.converted_value || point.converted_uuc_value),
//           safeGetValue(point.observations?.master_1 || point.m1),
//           safeGetValue(point.observations?.master_2 || point.m2),
//           safeGetValue(point.calculations?.mean || point.mean || point.average_master),
//           safeGetValue(point.calculations?.error || point.error),
//           safeGetValue(point.calculations?.hysteresis || point.hysterisis || point.hysteresis)
//         ];

//         rows.push(row);
//         calibrationPoints.push("1");
//         types.push('input');
//         repeatables.push('1');
//         values.push(safeGetValue(point.set_pressure?.uuc_value || point.uuc_value) || "0");
//       });
//     }
//     else if (template === 'observationrtdwi') {
//       let pointsToProcess = [];
//       if (observationData.calibration_points && Array.isArray(observationData.calibration_points)) {
//         pointsToProcess = observationData.calibration_points;
//       } else if (dataArray.length > 0) {
//         pointsToProcess = dataArray;
//       }

//       pointsToProcess.forEach((point) => {
//         if (!point) return;
//         const uucValues = safeGetArray(point.uuc_values, 5);
//         const row = [
//           point.sr_no?.toString() || '',
//           safeGetValue(point.set_point),
//           safeGetValue(point.average_master),
//           safeGetValue(point.unit || point.master_unit),
//           safeGetValue(point.sensitivity_coefficient),
//           safeGetValue(point.s_average_master || point.average_master),
//           safeGetValue(point.ambient_master),
//           safeGetValue(point.c_average_master),
//           safeGetValue(point.average_uuc),
//           safeGetValue(point.error),
//           ...uucValues.slice(0, 5).map(val => safeGetValue(val))
//         ];
//         rows.push(row);
//         calibrationPoints.push("1");
//         types.push('input');
//         repeatables.push('1');
//         values.push(safeGetValue(point.set_point) || "0");
//       });
//     }
//     else if (template === 'observationmt') {
//       dataArray.forEach((point) => {
//         if (!point) return;
//         const observations = safeGetArray(point.observations || point.uuc_values, 5);
//         const row = [
//           point.sr_no?.toString() || '',
//           safeGetValue(point.nominal_value || point.uuc_value),
//           safeGetValue(point.average),
//           safeGetValue(point.error),
//           ...observations.slice(0, 5).map(val => safeGetValue(val))
//         ];
//         while (row.length < 9) {
//           row.push('');
//         }
//         rows.push(row);
//         calibrationPoints.push("1");
//         types.push('input');
//         repeatables.push(point.metadata?.repeatable_cycle?.toString() || '1');
//         values.push(safeGetValue(point.nominal_value || point.uuc_value) || "0");
//       });
//     }
//     else if (template === 'observationmm') {
//       dataArray.forEach((unitType) => {
//         if (!unitType) return;
//         if (unitType.calibration_points && unitType.calibration_points.length > 0) {
//           unitType.calibration_points.forEach((point) => {
//             if (!point) return;
//             const observations = safeGetArray(point.observations, 5);
//             const row = [
//               point.sequence_number?.toString() || point.sr_no?.toString() || '',
//               safeGetValue(point.mode) || 'Measure',
//               safeGetValue(point.range || unitType.unit_type),
//               safeGetValue(point.nominal_values?.master?.value || point.nominal_value),
//               safeGetValue(point.calculations?.average || point.average),
//               safeGetValue(point.calculations?.error || point.error),
//               ...observations.slice(0, 5).map((obs) => {
//                 if (typeof obs === 'object' && obs !== null) {
//                   return safeGetValue(obs.value);
//                 }
//                 return safeGetValue(obs);
//               })
//             ];
//             rows.push(row);
//             calibrationPoints.push(point.point_id);
//             types.push('input');
//             repeatables.push('1');
//             values.push("0");
//           });
//         } else if (unitType.sr_no) {
//           const row = [
//             unitType.sr_no?.toString() || '',
//             safeGetValue(unitType.mode) || 'Measure',
//             safeGetValue(unitType.range),
//             safeGetValue(unitType.nominal_value),
//             safeGetValue(unitType.average),
//             safeGetValue(unitType.error),
//             safeGetValue(unitType.obs1),
//             safeGetValue(unitType.obs2),
//             safeGetValue(unitType.obs3),
//             safeGetValue(unitType.obs4),
//             safeGetValue(unitType.obs5)
//           ];
//           rows.push(row);
//           calibrationPoints.push("1");
//           types.push('input');
//           repeatables.push('1');
//           values.push(safeGetValue(unitType.nominal_value) || "0");
//         }
//       });
//     }
//     else if (template === 'observationapg') {
//       let rowsData = [];
//       if (Array.isArray(observationData)) {
//         rowsData = observationData;
//       } else if (observationData.rows && Array.isArray(observationData.rows)) {
//         rowsData = observationData.rows;
//       } else if (observationData.data && Array.isArray(observationData.data)) {
//         rowsData = observationData.data;
//       }

//       rowsData.forEach((obs) => {
//         if (!obs) return;
//         const row = [
//           obs.sr_no?.toString() || '',
//           safeGetValue(obs.uuc),
//           safeGetValue(obs.calculated_uuc),
//           safeGetValue(obs.m1),
//           safeGetValue(obs.m2),
//           safeGetValue(obs.mean),
//           safeGetValue(obs.error),
//           safeGetValue(obs.hysterisis)
//         ];
//         rows.push(row);
//         calibrationPoints.push("1");
//         types.push('input');
//         repeatables.push('1');
//         values.push(safeGetValue(obs.uuc) || "0");
//       });
//     }
//     else if (template === 'observationexm') {
//       let processedData = [];

//       if (Array.isArray(observationData)) {
//         processedData = observationData;
//       } else if (observationData.data && Array.isArray(observationData.data)) {
//         observationData.data.forEach((unitType) => {
//           if (unitType && unitType.matrix_types && Array.isArray(unitType.matrix_types)) {
//             unitType.matrix_types.forEach((matrixType) => {
//               if (matrixType && matrixType.observations && Array.isArray(matrixType.observations)) {
//                 processedData = processedData.concat(matrixType.observations);
//               }
//             });
//           }
//         });
//       }

//       processedData.forEach((item) => {
//         if (!item) return;
//         let observationValues = [];

//         // Safe handling of observations array
//         if (item.observations && Array.isArray(item.observations)) {
//           observationValues = item.observations.slice(0, 5).map(obs => {
//             if (typeof obs === 'object' && obs !== null) {
//               return safeGetValue(obs.value);
//             }
//             return safeGetValue(obs);
//           });
//         } else {
//           // If observations is not an array, try to get individual observation values
//           observationValues = [
//             safeGetValue(item.obs1 || item.observation1),
//             safeGetValue(item.obs2 || item.observation2),
//             safeGetValue(item.obs3 || item.observation3),
//             safeGetValue(item.obs4 || item.observation4),
//             safeGetValue(item.obs5 || item.observation5)
//           ];
//         }

//         while (observationValues.length < 5) {
//           observationValues.push('');
//         }

//         const row = [
//           item.sr_no?.toString() || '',
//           safeGetValue(item.nominal_value),
//           item.average?.toString() || '',
//           item.error?.toString() || '',
//           ...observationValues
//         ];

//         rows.push(row);
//         calibrationPoints.push("1");
//         types.push('input');
//         repeatables.push('1');
//         values.push(safeGetValue(item.nominal_value) || "0");
//       });
//     }
//     else if (template === 'observationmsr') {
//       dataArray.forEach((item) => {
//         if (item.matrices && item.matrices.length > 0) {
//           item.matrices.forEach((matrix) => {
//             if (matrix.calibration_points && matrix.calibration_points.length > 0) {
//               matrix.calibration_points.forEach((point) => {
//                 const observationValues = [];

//                 // Safe handling of observations
//                 if (point.observations && Array.isArray(point.observations)) {
//                   for (let i = 0; i < 5; i++) {
//                     const obs = point.observations[i];
//                     if (obs && typeof obs === 'object' && obs.value !== undefined) {
//                       observationValues.push(safeGetValue(obs.value));
//                     } else {
//                       observationValues.push(safeGetValue(obs));
//                     }
//                   }
//                 } else {
//                   // Fallback to individual observation fields
//                   observationValues.push(
//                     safeGetValue(point.obs1),
//                     safeGetValue(point.obs2),
//                     safeGetValue(point.obs3),
//                     safeGetValue(point.obs4),
//                     safeGetValue(point.obs5)
//                   );
//                 }

//                 const row = [
//                   point.sr_no?.toString() || '',
//                   point.nominal_value || point.uuc_value || '',
//                   point.average?.toString() || '',
//                   point.error?.toString() || '',
//                   ...observationValues
//                 ];
//                 rows.push(row);
//                 calibrationPoints.push("1");
//                 types.push('input');
//                 repeatables.push('1');
//                 values.push(point.nominal_value || point.uuc_value || "0");
//               });
//             }
//           });
//         } else if (item.calibration_points && item.calibration_points.length > 0) {
//           item.calibration_points.forEach((point) => {
//             const observationValues = [];

//             // Safe handling of observations
//             if (point.observations && Array.isArray(point.observations)) {
//               for (let i = 0; i < 5; i++) {
//                 const obs = point.observations[i];
//                 if (obs && typeof obs === 'object' && obs.value !== undefined) {
//                   observationValues.push(safeGetValue(obs.value));
//                 } else {
//                   observationValues.push(safeGetValue(obs));
//                 }
//               }
//             } else {
//               observationValues.push(
//                 safeGetValue(point.obs1),
//                 safeGetValue(point.obs2),
//                 safeGetValue(point.obs3),
//                 safeGetValue(point.obs4),
//                 safeGetValue(point.obs5)
//               );
//             }

//             const row = [
//               point.sr_no?.toString() || '',
//               point.nominal_value || point.uuc_value || '',
//               point.average?.toString() || '',
//               point.error?.toString() || '',
//               ...observationValues
//             ];
//             rows.push(row);
//             calibrationPoints.push("1");
//             types.push('input');
//             repeatables.push('1');
//             values.push(point.nominal_value || point.uuc_value || "0");
//           });
//         } else if (item.sr_no) {
//           const observationValues = [];

//           // Safe handling of observations
//           if (item.observations && Array.isArray(item.observations)) {
//             for (let i = 0; i < 5; i++) {
//               const obs = item.observations[i];
//               if (obs && typeof obs === 'object' && obs.value !== undefined) {
//                 observationValues.push(safeGetValue(obs.value));
//               } else {
//                 observationValues.push(safeGetValue(obs));
//               }
//             }
//           } else {
//             observationValues.push(
//               safeGetValue(item.obs1),
//               safeGetValue(item.obs2),
//               safeGetValue(item.obs3),
//               safeGetValue(item.obs4),
//               safeGetValue(item.obs5)
//             );
//           }

//           const row = [
//             item.sr_no?.toString() || '',
//             item.nominal_value || item.uuc_value || '',
//             item.average?.toString() || '',
//             item.error?.toString() || '',
//             ...observationValues
//           ];
//           rows.push(row);
//           calibrationPoints.push("1");
//           types.push('input');
//           repeatables.push('1');
//           values.push(item.nominal_value || item.uuc_value || "0");
//         }
//       });
//     }
//     else if (template === 'observationdg') {
//       dataArray.forEach((obs, index) => {
//         const row = [
//           (obs.sr_no || index + 1)?.toString() || '',
//           obs.nominal_value_master || obs.nominal_value || '',
//           obs.nominal_value_uuc || obs.uuc_nominal_value || '',
//           obs.set1_forward || obs.forward_reading_1 || '',
//           obs.set1_backward || obs.backward_reading_1 || '',
//           obs.set2_forward || obs.forward_reading_2 || '',
//           obs.set2_backward || obs.backward_reading_2 || '',
//           obs.average_forward || obs.avg_forward || '',
//           obs.average_backward || obs.avg_backward || '',
//           obs.error_forward || obs.forward_error || '',
//           obs.error_backward || obs.backward_error || '',
//           obs.hysterisis || obs.hysteresis || ''
//         ];
//         rows.push(row);

//         // ✅ IMPORTANT: Use actual observation ID from API response
//         calibrationPoints.push(obs.id?.toString() || "1");
//         types.push('input');
//         repeatables.push('1');
//         values.push(obs.nominal_value_uuc || obs.nominal_value || "0");
//       });
//     }
//     else if (template === 'observationcustom') {
//       dataArray.forEach((obs) => {
//         const row = [
//           obs.sr_no?.toString() || '',
//           obs.parameter || '',
//           obs.specification || '',
//           obs.set_point || '',
//           obs.master_obs1 || obs.master_observations?.[0] || '',
//           obs.master_obs2 || obs.master_observations?.[1] || '',
//           obs.master_obs3 || obs.master_observations?.[2] || '',
//           obs.uuc_obs1 || obs.uuc_observations?.[0] || '',
//           obs.uuc_obs2 || obs.uuc_observations?.[1] || '',
//           obs.uuc_obs3 || obs.uuc_observations?.[2] || '',
//           obs.avg_master || obs.average_master || '',
//           obs.avg_uuc || obs.average_uuc || '',
//           obs.error || '',
//           obs.remark || ''
//         ];
//         rows.push(row);
//         calibrationPoints.push("1");
//         types.push('input');
//         repeatables.push('1');
//         values.push(obs.set_point || "0");
//       });
//     }
//     else if (template === 'observationdw') {
//       dataArray.forEach((item) => {
//         if (item.cycles && item.cycles.length > 0) {
//           item.cycles.forEach((cycle, cycleIndex) => {
//             const row = [
//               cycleIndex === 0 ? (item.sr_no?.toString() || '') : '',
//               cycleIndex === 0 ? (item.nominal_value || '') : '',
//               cycleIndex === 0 ? (item.density || '') : '',
//               cycle.S1 || cycle.s1 || '',
//               cycle.U1 || cycle.u1 || '',
//               cycle.U2 || cycle.u2 || '',
//               cycle.S2 || cycle.s2 || '',
//               cycle.Delta || cycle.delta || cycle.diff || '',
//               cycleIndex === item.cycles.length - 1 ? (item.average_diff || '') : ''
//             ];
//             rows.push(row);
//             calibrationPoints.push("1");
//             types.push('input');
//             repeatables.push('1');
//             values.push(item.nominal_value || "0");
//           });
//         } else {
//           const row = [
//             item.sr_no?.toString() || '',
//             item.nominal_value || '',
//             item.density || '',
//             '', '', '', '', '',
//             item.average_diff || ''
//           ];
//           rows.push(row);
//           calibrationPoints.push("1");
//           types.push('input');
//           repeatables.push('1');
//           values.push(item.nominal_value || "0");
//         }
//       });
//     }
//     else if (template === 'observationctg') {
//       dataArray.forEach((point) => {
//         const observations = safeGetArray(point?.observations, 5);
//         const row = [

//           point?.sr_no?.toString() || '',
//           point?.nominal_value || '',
//           ...observations.slice(0, 5).map(obs => safeGetValue(obs)),
//           safeGetValue(point?.average),
//           safeGetValue(point?.error)
//         ];
//         rows.push(row);
//         calibrationPoints.push(point?.id || "1");
//         types.push('input');
//         repeatables.push('3');
//         values.push("0");
//       });
//     }
//     else if (template === 'observationfg') {
//       dataArray.forEach((unitType) => {
//         if (unitType.matrix_data && unitType.matrix_data.length > 0) {
//           unitType.matrix_data.forEach((matrix) => {
//             if (matrix.calibration_points && matrix.calibration_points.length > 0) {
//               matrix.calibration_points.forEach((point) => {
//                 const observations = safeGetArray(point.observations, 5);
//                 const row = [
//                   point.sr_no?.toString() || '',
//                   point.nominal_value || point.test_point || '',
//                   point.average || '',
//                   point.error || '',
//                   ...observations.slice(0, 5).map(obs => safeGetValue(obs))
//                 ];
//                 while (row.length < 9) {
//                   row.push('');
//                 }
//                 rows.push(row);
//                 calibrationPoints.push("1");
//                 types.push('input');
//                 repeatables.push(point.repeatable_cycle?.toString() || '3');
//                 values.push(point.nominal_value || point.test_point || "0");
//               });
//             }
//           });
//         } else if (unitType.calibration_points && unitType.calibration_points.length > 0) {
//           unitType.calibration_points.forEach((point) => {
//             const observations = safeGetArray(point.observations, 5);
//             const row = [
//               point.sr_no?.toString() || '',
//               point.nominal_value || point.test_point || '',
//               point.average || '',
//               point.error || '',
//               ...observations.slice(0, 5).map(obs => safeGetValue(obs))
//             ];
//             while (row.length < 9) {
//               row.push('');
//             }
//             rows.push(row);
//             calibrationPoints.push("1");
//             types.push('input');
//             repeatables.push(point.repeatable_cycle?.toString() || '3');
//             values.push(point.nominal_value || point.test_point || "0");
//           });
//         } else if (unitType.sr_no) {
//           const observations = safeGetArray(unitType.observations, 5);
//           const row = [
//             unitType.sr_no?.toString() || '',
//             unitType.nominal_value || unitType.test_point || '',
//             unitType.average || '',
//             unitType.error || '',
//             ...observations.slice(0, 5).map(obs => safeGetValue(obs))
//           ];
//           while (row.length < 9) {
//             row.push('');
//           }
//           rows.push(row);
//           calibrationPoints.push("1");
//           types.push('input');
//           repeatables.push(unitType.repeatable_cycle?.toString() || '3');
//           values.push(unitType.nominal_value || unitType.test_point || "0");
//         }
//       });
//     }
//     else if (template === 'observationhg') {
//       dataArray.forEach((unitType) => {
//         if (unitType.matrix_data && unitType.matrix_data.length > 0) {
//           unitType.matrix_data.forEach((matrix) => {
//             if (matrix.calibration_points && matrix.calibration_points.length > 0) {
//               matrix.calibration_points.forEach((point) => {
//                 const observations = safeGetArray(point.observations, 5);
//                 const row = [
//                   point.sequence_number?.toString() || point.sr_no?.toString() || '',
//                   point.nominal_value || point.test_point || '',
//                   point.average || '',
//                   point.error || '',
//                   ...observations.slice(0, 5).map(obs => safeGetValue(obs))
//                 ];
//                 while (row.length < 9) {
//                   row.push('');
//                 }
//                 rows.push(row);
//                 calibrationPoints.push("1");
//                 types.push('input');
//                 repeatables.push(point.repeatable_cycle?.toString() || '3');
//                 values.push(point.nominal_value || point.test_point || "0");
//               });
//             }
//           });
//         } else if (unitType.calibration_points && unitType.calibration_points.length > 0) {
//           unitType.calibration_points.forEach((point) => {
//             const observations = safeGetArray(point.observations, 5);
//             const row = [
//               point.sr_no?.toString() || '',
//               point.nominal_value || point.test_point || '',
//               point.average || '',
//               point.error || '',
//               ...observations.slice(0, 5).map(obs => safeGetValue(obs))
//             ];
//             while (row.length < 9) {
//               row.push('');
//             }
//             rows.push(row);
//             calibrationPoints.push("1");
//             types.push('input');
//             repeatables.push(point.repeatable_cycle?.toString() || '3');
//             values.push(point.nominal_value || point.test_point || "0");
//           });
//         }
//       });
//     }
//     else if (template === 'observationgtm') {
//       dataArray.forEach((point) => {
//         const uucObservations = safeGetArray(point.uuc_observations || point.observations, 5);
//         const row = [
//           point.sr_no?.toString() || '',
//           point.set_point || '',
//           point.range || '',
//           point.test_point || point.value_of || '',
//           point.unit_description || point.unit || '',
//           point.sensitivity_coefficient || '',
//           point.average_master || '',
//           point.converted_average_master || '',
//           point.error || '',
//           ...uucObservations.slice(0, 5).map(obs => safeGetValue(obs))
//         ];
//         while (row.length < 14) {
//           row.push('');
//         }
//         rows.push(row);
//         calibrationPoints.push("1");
//         types.push('input');
//         repeatables.push(point.repeatable_cycle?.toString() || '1');
//         values.push(point.set_point || "0");
//       });
//     }
//     else if (template === 'observationit') {
//       dataArray.forEach((point) => {
//         const observations = safeGetArray(point.observations, 5);
//         const row = [
//           point.sequence_number?.toString() || point.sr_no?.toString() || '',
//           point.nominal_value || point.test_point || '',
//           point.average || '',
//           point.error || '',
//           ...observations.slice(0, 5).map(obs => safeGetValue(obs))
//         ];
//         while (row.length < 9) {
//           row.push('');
//         }
//         rows.push(row);
//         calibrationPoints.push("1");
//         types.push('input');
//         repeatables.push(point.repeatable_cycle?.toString() || '5');
//         values.push(point.nominal_value || point.test_point || "0");
//       });
//     }

//     return {
//       rows,
//       hiddenInputs: { calibrationPoints, types, repeatables, values }
//     };
//   };

//   const observationTables = [
//     {
//       id: 'observationdpg',
//       name: 'Observation DPG',
//       category: 'Pressure',
//       structure: {
//         singleHeaders: [
//           'SR NO',
//           'SET PRESSURE ON UUC (CALCULATIONUNIT)',
//           '[SET PRESSURE ON UUC (MASTERUNIT)]'
//         ],
//         subHeaders: {
//           'OBSERVATION ON UUC': ['M1', 'M2', 'M3']
//         },
//         remainingHeaders: [
//           'MEAN (UUCUNIT)',
//           'ERROR (UUCUNIT)',
//           'REPEATABILITY (UUCUNIT)',
//           'HYSTERISIS (UUCUNIT)'
//         ]
//       },
//       staticRows: createObservationRows(observation, 'observationdpg').rows,
//       hiddenInputs: createObservationRows(observation, 'observationdpg').hiddenInputs
//     },
//     {
//       id: 'observationodfm',
//       name: 'Observation ODFM',
//       category: 'Flow Meter',
//       structure: {
//         singleHeaders: [
//           'Sr. No.',
//           'Range (UUC Unit)',
//           'Nominal/ Set Value UUC (UUC Unit)',
//           'Average (Master Unit)',
//           'Error (Master Unit)'
//         ],
//         subHeaders: {
//           'Observation on UUC': [
//             'Observation 1 (Master Unit)',
//             'Observation 2 (Master Unit)',
//             'Observation 3 (Master Unit)',
//             'Observation 4 (Master Unit)',
//             'Observation 5 (Master Unit)'
//           ]
//         },
//         remainingHeaders: []
//       },
//       staticRows: createObservationRows(observation, 'observationodfm').rows,
//       hiddenInputs: createObservationRows(observation, 'observationodfm').hiddenInputs
//     },
//     {
//       id: 'observationit',
//       name: 'Observation IT',
//       category: 'Internal Thread',
//       structure: {
//         thermalCoeff: true,
//         singleHeaders: ['Sr. No.', 'Nominal/ Set Value', 'Average', 'Error'],
//         subHeaders: {
//           'Observation on UUC': ['Observation 1', 'Observation 2', 'Observation 3', 'Observation 4', 'Observation 5']
//         },
//         remainingHeaders: []
//       },
//       staticRows: createObservationRows(observation, 'observationit').rows,
//       hiddenInputs: createObservationRows(observation, 'observationit').hiddenInputs
//     },
//     {
//       id: 'observationapg',
//       name: 'Observation APG',
//       category: 'Pressure',
//       structure: {
//         singleHeaders: ['Sr no', 'Set Pressure on UUC (kg/cm²)', 'Set Pressure on UUC (bar)'],
//         subHeaders: {
//           'Observations on Master (bar)': ['M1', 'M2']
//         },
//         remainingHeaders: ['Mean (bar)', 'Error (bar)', 'Hysterisis (bar)']
//       },
//       staticRows: createObservationRows(observation, 'observationapg').rows,
//       hiddenInputs: createObservationRows(observation, 'observationapg').hiddenInputs
//     },
//     {
//       id: 'observationfg',
//       name: 'Observation FG',
//       category: 'Force Gauge',
//       structure: {
//         thermalCoeff: true,
//         singleHeaders: ['Sr. No.', 'Nominal Value', 'Average (Master)', 'Error'],
//         subHeaders: {
//           'Observation on UUC': ['Observation 1 (Master)', 'Observation 2 (Master)', 'Observation 3 (Master)', 'Observation 4 (Master)', 'Observation 5 (Master)']
//         },
//         remainingHeaders: []
//       },
//       staticRows: createObservationRows(observation, 'observationfg').rows,
//       hiddenInputs: createObservationRows(observation, 'observationfg').hiddenInputs
//     },
//     {
//       id: 'observationrtdwi',
//       name: 'Observation RTD WI',
//       category: 'RTD',
//       structure: {
//         singleHeaders: ['Sr. No.', 'Set Point (unit)', 'Value Of', 'Unit', 'Sensitivity Coefficient', 'Average', 'mV generated On ambient', 'Average with corrected mv', 'Average (unit)', 'Deviation (unit)'],
//         subHeaders: {
//           'Observation on UUC': ['Observation 1', 'Observation 2', 'Observation 3', 'Observation 4', 'Observation 5']
//         },
//         remainingHeaders: []
//       },
//       staticRows: createObservationRows(observation, 'observationrtdwi').rows,
//       hiddenInputs: createObservationRows(observation, 'observationrtdwi').hiddenInputs
//     },
//     {
//       id: 'observationmt',
//       name: 'Observation MT',
//       category: 'Measuring Tool',
//       structure: {
//         thermalCoeff: true,
//         additionalFields: ['Thickness of graduation Line'],
//         singleHeaders: ['Sr. No.', 'Nominal Value in (mm)', 'Average in (mm)', 'Error in (mm)'],
//         subHeaders: {
//           'Observation on UUC': ['Observation 1 (mm)', 'Observation 2 (mm)', 'Observation 3 (mm)', 'Observation 4 (mm)', 'Observation 5 (mm)']
//         },
//         remainingHeaders: []
//       },
//       staticRows: createObservationRows(observation, 'observationmt').rows,
//       hiddenInputs: createObservationRows(observation, 'observationmt').hiddenInputs
//     },
//     {
//       id: 'observationmm',
//       name: 'Observation MM',
//       category: 'Multimeter',
//       structure: {
//         singleHeaders: ['Sr. No.', 'Mode', 'Range', 'Nominal/ Set Value on master', 'Average', 'Error'],
//         subHeaders: {
//           'Observation on UUC': ['Observation 1', 'Observation 2', 'Observation 3', 'Observation 4', 'Observation 5']
//         },
//         remainingHeaders: []
//       },
//       staticRows: createObservationRows(observation, 'observationmm').rows,
//       hiddenInputs: createObservationRows(observation, 'observationmm').hiddenInputs
//     },
//     {
//       id: 'observationmsr',
//       name: 'Observation MSR',
//       category: 'Measuring',
//       structure: {
//         thermalCoeff: true,
//         singleHeaders: ['Sr. No.', 'Nominal / Set Value', 'Average', 'Error'],
//         subHeaders: {
//           'Observation on UUC': ['Observation 1', 'Observation 2', 'Observation 3', 'Observation 4', 'Observation 5']
//         },
//         remainingHeaders: []
//       },
//       staticRows: createObservationRows(observation, 'observationmsr').rows,
//       hiddenInputs: createObservationRows(observation, 'observationmsr').hiddenInputs
//     },
//     {
//       id: 'observationdg',
//       name: 'Observation DG',
//       category: 'Digital',
//       structure: {
//         singleHeaders: ['Sr no', 'Nominal Value (Master Unit)', '[Nominal Value (UUC Unit)]'],
//         subHeaders: {
//           'Set 1': ['Set 1 Forward Reading', 'Set 1 Backward Reading'],
//           'Set 2': ['Set 2 Forward Reading', 'Set 2 Backward Reading']
//         },
//         remainingHeaders: ['Average Forward Reading', 'Average Backward Reading', 'Error Forward Reading', 'Error Backward Reading', 'Hysterisis']
//       },
//       staticRows: createObservationRows(observation, 'observationdg').rows,
//       hiddenInputs: createObservationRows(observation, 'observationdg').hiddenInputs
//     },
//     {
//       id: 'observationcustom',
//       name: 'Observation Custom',
//       category: 'Custom',
//       structure: {
//         singleHeaders: ['Sr. No.', 'Parameter', 'Specification', 'Set Point'],
//         subHeaders: {
//           'Master Reading': ['Master Obs 1', 'Master Obs 2', 'Master Obs 3'],
//           'UUC Reading': ['UUC Obs 1', 'UUC Obs 2', 'UUC Obs 3']
//         },
//         remainingHeaders: ['Average On Master', 'Average On UUC', 'Error', 'Remark']
//       },
//       staticRows: createObservationRows(observation, 'observationcustom').rows,
//       hiddenInputs: createObservationRows(observation, 'observationcustom').hiddenInputs
//     },
//     {
//       id: 'observationdw',
//       name: 'Observation DW',
//       category: 'Weight',
//       structure: {
//         singleHeaders: ['SR NO', 'NOMINAL VALUE OF UUC (G)', 'DENSITY OF UUC WEIGHT, PR (G/CM²)'],
//         subHeaders: {
//           'CYCLE 1': ['S1 (G)', 'U1 (G)', 'U2 (G)', 'S2 (G)', 'DIFF., ΔM ( U1 – S1) + (U2 – S2) ) / 2'],
//         },
//         remainingHeaders: ['AVG. DIFF. (G)']
//       },
//       staticRows: createObservationRows(observation, 'observationdw').rows,
//       hiddenInputs: createObservationRows(observation, 'observationdw').hiddenInputs
//     },
//     {
//       id: 'observationhg',
//       name: 'Observation HG',
//       category: 'Height Gauge',
//       structure: {
//         thermalCoeff: true,
//         singleHeaders: ['Sr. No.', 'Nominal/ Set Value', 'Average', 'Error'],
//         subHeaders: {
//           'Observation on UUC': ['Observation 1', 'Observation 2', 'Observation 3', 'Observation 4', 'Observation 5']
//         },
//         remainingHeaders: []
//       },
//       staticRows: createObservationRows(observation, 'observationhg').rows,
//       hiddenInputs: createObservationRows(observation, 'observationhg').hiddenInputs
//     },

//     {
//       id: 'observationctg',
//       name: 'Observation CTG',
//       category: 'Temperature',
//       structure: {
//         thermalCoeff: true,
//         singleHeaders: [
//           'Sr. No.',
//           'Nominal Value'
//         ],
//         subHeaders: {
//           'Observation on UUC': [
//             'Observation 1',
//             'Observation 2',
//             'Observation 3',
//             'Observation 4',
//             'Observation 5'
//           ]
//         },
//         remainingHeaders: ['Average', 'Error']

//         // },
//         // remainingHeaders: []
//       },
//       staticRows: createObservationRows(observation, 'observationctg').rows,
//       hiddenInputs: createObservationRows(observation, 'observationctg').hiddenInputs
//     }
//     ,
//     {
//       id: 'observationmg',
//       name: 'Observation MG',
//       category: 'Manometer',
//       structure: {
//         singleHeaders: ['Sr no', 'Set Pressure on UUC ([unit])', '[Set Pressure on UUC ([master unit])]'],
//         subHeaders: {
//           'Observation on UUC': ['M1', 'M2']
//         },
//         remainingHeaders: ['Mean ([master unit])', 'Error ([master unit])', 'Hysterisis ([master unit])']
//       },
//       staticRows: createObservationRows(observation, 'observationmg').rows,
//       hiddenInputs: createObservationRows(observation, 'observationmg').hiddenInputs
//     },
//     {
//       id: 'observationexm',
//       name: 'Observation EXM',
//       category: 'External',
//       structure: {
//         thermalCoeff: true,
//         singleHeaders: ['Sr. No.', 'Nominal Value', 'Average', 'Error'],
//         subHeaders: {
//           'Observation on UUC': ['Observation 1', 'Observation 2', 'Observation 3', 'Observation 4', 'Observation 5']
//         },
//         remainingHeaders: []
//       },
//       staticRows: createObservationRows(observation, 'observationexm').rows,
//       hiddenInputs: createObservationRows(observation, 'observationexm').hiddenInputs
//     },
//     {
//       id: 'observationrtdwoi',
//       name: 'Observation RTD WOI',
//       category: 'RTD',
//       structure: {
//         singleHeaders: [
//           'Sr. No.',
//           'Set Point (unit)',
//           'Value Of',
//           'Unit',
//           'Sensitivity Coefficient',
//           'Average',
//           'mV generated On ambient',
//           'Average with corrected mv',
//           'Average (unit)',
//           'Deviation (unit)'
//         ],
//         subHeaders: {
//           'Observation on UUC': [
//             'Observation 1',
//             'Observation 2',
//             'Observation 3',
//             'Observation 4',
//             'Observation 5'
//           ]
//         },
//         remainingHeaders: []
//       },
//       staticRows: createObservationRows(observation, 'observationrtdwoi').rows,
//       hiddenInputs: createObservationRows(observation, 'observationrtdwoi').hiddenInputs
//     },
//     {
//       id: 'observationgtm',
//       name: 'Observation GTM',
//       category: 'General Temperature',
//       structure: {
//         singleHeaders: ['Sr. No.', 'Set Point (unit)', 'Range', 'Value Of', 'Unit', 'Sensitivity Coefficient', 'Average (Ω)', 'Average (unit)', 'Error (unit)'],
//         subHeaders: {
//           'Observation on UUC': ['Observation 1', 'Observation 2', 'Observation 3', 'Observation 4', 'Observation 5']
//         },
//         remainingHeaders: []
//       },
//       staticRows: createObservationRows(observation, 'observationgtm').rows,
//       hiddenInputs: createObservationRows(observation, 'observationgtm').hiddenInputs
//     }
//   ];

//   // Filter tables based on observationTemplate
//   const availableTables = observationTables.filter(table =>
//     observationTemplate && table.id === observationTemplate
//   );

//   const [selectedTable, setSelectedTable] = useState('');

//   // Set selected table when observationTemplate is available
//   useEffect(() => {
//     if (observationTemplate && availableTables.length > 0) {
//       setSelectedTable(observationTemplate);
//     }
//   }, [observationTemplate, availableTables.length]);

//   const selectedTableData = availableTables.find(table => table.id === selectedTable);

//   const generateTableStructure = () => {
//     if (!selectedTableData || !selectedTableData.structure) return null;

//     const structure = selectedTableData.structure;
//     const headers = [];
//     const subHeadersRow = [];

//     structure.singleHeaders.forEach((header) => {
//       headers.push({ name: header, colspan: 1 });
//       subHeadersRow.push(null);
//     });

//     if (structure.subHeaders && Object.keys(structure.subHeaders).length > 0) {
//       Object.entries(structure.subHeaders).forEach(([groupName, subHeaders]) => {
//         headers.push({ name: groupName, colspan: subHeaders.length });
//         subHeaders.forEach(subHeader => {
//           subHeadersRow.push(subHeader);
//         });
//       });
//     }

//     if (structure.remainingHeaders && structure.remainingHeaders.length > 0) {
//       structure.remainingHeaders.forEach((header) => {
//         headers.push({ name: header, colspan: 1 });
//         subHeadersRow.push(null);
//       });
//     }

//     return { headers, subHeadersRow };
//   };

//   const tableStructure = generateTableStructure();

//   const handleInputChange = (rowIndex, colIndex, value) => {
//     // Update table input values for display
//     setTableInputValues(prev => {
//       const newValues = { ...prev };
//       const key = `${rowIndex}-${colIndex}`;
//       newValues[key] = value;
//       return newValues;
//     });
//   };

//   const handleBackToInwardList = () => {
//     navigate(`/dashboards/calibration-process/inward-entry-lab?caliblocation=${caliblocation}&calibacc=${calibacc}`);
//   };

//   const handleBackToPerformCalibration = () => {
//     navigate(`/dashboards/calibration-process/inward-entry-lab/perform-calibration/${id}?caliblocation=${caliblocation}&calibacc=${calibacc}`);
//   };

//   const handleFormChange = (e) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({
//       ...prev,
//       [name]: value
//     }));
//   };

//   const renderThermalCoefficientSection = () => {
//     if (!selectedTableData?.structure?.thermalCoeff) return null;

//     return (
//       <div className="mb-6">
//         <h3 className="text-md font-medium text-gray-800 dark:text-white mb-2">Thermal Coefficient</h3>
//         <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded border border-gray-200 dark:border-gray-600">
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
//                 UUC Thermal Coefficient:
//               </label>
//               <input
//                 type="text"
//                 value={thermalCoeff.uuc}
//                 onChange={(e) => setThermalCoeff(prev => ({ ...prev, uuc: e.target.value }))}
//                 className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
//                 placeholder="Enter master thermal coefficient"
//               />
//             </div>
//             {selectedTableData?.structure?.additionalFields?.includes('Thickness of graduation Line') && (
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
//                   Thickness of graduation Line:
//                 </label>
//                 <input
//                   type="text"
//                   value={thermalCoeff.thickness_of_graduation}
//                   onChange={(e) => setThermalCoeff(prev => ({ ...prev, thickness_of_graduation: e.target.value }))}
//                   className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
//                   placeholder="Enter thickness"
//                 />
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     );
//   };

//   // Update the handleRowSave function for observationdpg
//   const handleRowSave = async (rowIndex, colIndex, newValue, observationIndex = null) => {
//     const token = localStorage.getItem("authToken");

//     const hiddenInputs = selectedTableData?.hiddenInputs || {
//       calibrationPoints: [],
//       types: [],
//       repeatables: [],
//       values: [],
//     };

//     const calibrationPointId = hiddenInputs.calibrationPoints[rowIndex];

//     if (!calibrationPointId) {
//       toast.error("Calibration point ID not found");
//       return;
//     }

//     let obsPayload;

//     if (observationTemplate === 'observationdpg') {
//       // DPG Structure mapping with correct field names
//       if (colIndex === 0) {
//         // SR NO - sr_no
//         obsPayload = {
//           inwardid: inwardId,
//           instid: instId,
//           calibrationpoint: calibrationPointId,
//           type: "sr_no",
//           repeatable: "0",
//           value: newValue || "0"
//         };
//       }
//       else if (colIndex === 1) {
//         // SET PRESSURE UUC - uuc_value
//         obsPayload = {
//           inwardid: inwardId,
//           instid: instId,
//           calibrationpoint: calibrationPointId,
//           type: "uuc_value",
//           repeatable: "0",
//           value: newValue || "0"
//         };
//       }
//       else if (colIndex === 2) {
//         // SET PRESSURE MASTER - converted_uuc_value
//         obsPayload = {
//           inwardid: inwardId,
//           instid: instId,
//           calibrationpoint: calibrationPointId,
//           type: "converted_uuc_value",
//           repeatable: "0",
//           value: newValue || "0"
//         };
//       }
//       else if (colIndex === 3) {
//         // M1 - master reading 1
//         obsPayload = {
//           inwardid: inwardId,
//           instid: instId,
//           calibrationpoint: calibrationPointId,
//           type: "m1",
//           repeatable: "1",
//           value: newValue || "0"
//         };
//       }
//       else if (colIndex === 4) {
//         // M2 - master reading 2
//         obsPayload = {
//           inwardid: inwardId,
//           instid: instId,
//           calibrationpoint: calibrationPointId,
//           type: "m2",
//           repeatable: "2",
//           value: newValue || "0"
//         };
//       }
//       else if (colIndex === 5) {
//         // M3 - master reading 3
//         obsPayload = {
//           inwardid: inwardId,
//           instid: instId,
//           calibrationpoint: calibrationPointId,
//           type: "m3",
//           repeatable: "3",
//           value: newValue || "0"
//         };
//       }
//       else if (colIndex === 6) {
//         // MEAN - average_master
//         obsPayload = {
//           inwardid: inwardId,
//           instid: instId,
//           calibrationpoint: calibrationPointId,
//           type: "average_master",
//           repeatable: "0",
//           value: newValue || "0"
//         };
//       }
//       else if (colIndex === 7) {
//         // ERROR - error
//         obsPayload = {
//           inwardid: inwardId,
//           instid: instId,
//           calibrationpoint: calibrationPointId,
//           type: "error",
//           repeatable: "0",
//           value: newValue || "0"
//         };
//       }
//       else if (colIndex === 8) {
//         // REPEATABILITY - repeatability
//         obsPayload = {
//           inwardid: inwardId,
//           instid: instId,
//           calibrationpoint: calibrationPointId,
//           type: "repeatability",
//           repeatable: "0",
//           value: newValue || "0"
//         };
//       }
//       else if (colIndex === 9) {
//         // HYSTERISIS - hysteresis
//         obsPayload = {
//           inwardid: inwardId,
//           instid: instId,
//           calibrationpoint: calibrationPointId,
//           type: "hysteresis",
//           repeatable: "0",
//           value: newValue || "0"
//         };
//       }
//     } else if (observationTemplate === 'observationdg') {
//       // DG Structure mapping with correct field names
//       if (colIndex === 0) {
//         // SR NO - sr_no
//         obsPayload = {
//           inwardid: inwardId,
//           instid: instId,
//           calibrationpoint: calibrationPointId,
//           type: "sr_no",
//           repeatable: "0",
//           value: newValue || "0"
//         };
//       }
//       else if (colIndex === 1) {
//         // Nominal Value Master - nominal_value_master
//         obsPayload = {
//           inwardid: inwardId,
//           instid: instId,
//           calibrationpoint: calibrationPointId,
//           type: "nominal_value_master",
//           repeatable: "0",
//           value: newValue || "0"
//         };
//       }
//       else if (colIndex === 2) {
//         // Nominal Value UUC - nominal_value_uuc
//         obsPayload = {
//           inwardid: inwardId,
//           instid: instId,
//           calibrationpoint: calibrationPointId,
//           type: "nominal_value_uuc",
//           repeatable: "0",
//           value: newValue || "0"
//         };
//       }
//       else if (colIndex === 3) {
//         // Set 1 Forward - set1_forward
//         obsPayload = {
//           inwardid: inwardId,
//           instid: instId,
//           calibrationpoint: calibrationPointId,
//           type: "set1_forward",
//           repeatable: "1",
//           value: newValue || "0"
//         };
//       }
//       else if (colIndex === 4) {
//         // Set 1 Backward - set1_backward
//         obsPayload = {
//           inwardid: inwardId,
//           instid: instId,
//           calibrationpoint: calibrationPointId,
//           type: "set1_backward",
//           repeatable: "1",
//           value: newValue || "0"
//         };
//       }
//       else if (colIndex === 5) {
//         // Set 2 Forward - set2_forward
//         obsPayload = {
//           inwardid: inwardId,
//           instid: instId,
//           calibrationpoint: calibrationPointId,
//           type: "set2_forward",
//           repeatable: "2",
//           value: newValue || "0"
//         };
//       }
//       else if (colIndex === 6) {
//         // Set 2 Backward - set2_backward
//         obsPayload = {
//           inwardid: inwardId,
//           instid: instId,
//           calibrationpoint: calibrationPointId,
//           type: "set2_backward",
//           repeatable: "2",
//           value: newValue || "0"
//         };
//       }
//       else if (colIndex === 7) {
//         // Average Forward - average_forward
//         obsPayload = {
//           inwardid: inwardId,
//           instid: instId,
//           calibrationpoint: calibrationPointId,
//           type: "average_forward",
//           repeatable: "0",
//           value: newValue || "0"
//         };
//       }
//       else if (colIndex === 8) {
//         // Average Backward - average_backward
//         obsPayload = {
//           inwardid: inwardId,
//           instid: instId,
//           calibrationpoint: calibrationPointId,
//           type: "average_backward",
//           repeatable: "0",
//           value: newValue || "0"
//         };
//       }
//       else if (colIndex === 9) {
//         // Error Forward - error_forward
//         obsPayload = {
//           inwardid: inwardId,
//           instid: instId,
//           calibrationpoint: calibrationPointId,
//           type: "error_forward",
//           repeatable: "0",
//           value: newValue || "0"
//         };
//       }
//       else if (colIndex === 10) {
//         // Error Backward - error_backward
//         obsPayload = {
//           inwardid: inwardId,
//           instid: instId,
//           calibrationpoint: calibrationPointId,
//           type: "error_backward",
//           repeatable: "0",
//           value: newValue || "0"
//         };
//       }
//       else if (colIndex === 11) {
//         // Hysteresis - hysteresis
//         obsPayload = {
//           inwardid: inwardId,
//           instid: instId,
//           calibrationpoint: calibrationPointId,
//           type: "hysteresis",
//           repeatable: "0",
//           value: newValue || "0"
//         };
//       }
//     }
//     else if (observationTemplate === 'observationctg') {
//       // CTG logic (keep existing working code)
//       if (observationIndex !== null) {
//         obsPayload = {
//           inwardid: inwardId,
//           instid: instId,
//           calibrationpoint: calibrationPointId,
//           type: "uuc",
//           repeatable: observationIndex.toString(),
//           value: newValue || "0"
//         };
//       } else {
//         obsPayload = {
//           inwardid: inwardId,
//           instid: instId,
//           calibrationpoint: calibrationPointId,
//           type: "uuc",
//           repeatable: "0",
//           value: newValue || "0"
//         };
//       }
//     }
//     else {
//       // Default logic for other templates
//       if (observationIndex !== null) {
//         obsPayload = {
//           inwardid: inwardId,
//           instid: instId,
//           calibrationpoint: calibrationPointId,
//           type: "uuc",
//           repeatable: observationIndex.toString(),
//           value: newValue || "0"
//         };
//       } else {
//         obsPayload = {
//           inwardid: inwardId,
//           instid: instId,
//           calibrationpoint: calibrationPointId,
//           type: "uuc",
//           repeatable: "0",
//           value: newValue || "0"
//         };
//       }
//     }

//     console.log(`Saving row [${rowIndex}], col [${colIndex}], template [${observationTemplate}]:`, obsPayload);
//     console.log(`Saving DPG row [${rowIndex}], col [${colIndex}], calibration_point_id [${calibrationPointId}]:`, obsPayload);



//     try {
//       await axios.post(
//         `${JWT_HOST_API}/calibrationprocess/set-observations`,
//         obsPayload,
//         {
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${token}`,
//           }
//         }
//       );

//       console.log(`DPG Row [${rowIndex}], col [${colIndex}] saved successfully!`);
//       toast.success(`Data saved successfully!`);

//       // Refetch after save
//       await refetchObservations();

//     } catch (err) {
//       console.error(`Network error for DPG row [${rowIndex}]:`, err);
//       if (err.response?.data?.message) {
//         toast.error(`Error: ${err.response.data.message}`);
//       } else {
//         toast.error("Failed to save data");
//       }
//     }
//   };
//   // const fetchUpdatedData = async () => {
//   //   try {
//   //     const response = await axios.get('https://kailtech.in/newlims/api/calibrationprocess/get-calibration-step3-details', {
//   //       params: {
//   //         inward_id: inwardId,
//   //         instid: instId,
//   //         caliblocation: caliblocation,
//   //         calibacc: calibacc
//   //       }
//   //     });

//   //     const data = response.data;
//   //     setInwardEntry(data.inwardEntry);
//   //     setInstrument(data.instrument);
//   //     setMasters(data.masters);
//   //     setSupportMasters(data.supportMasters);
//   //     setObservationTemplate(data.observationTemplate);
//   //     setTemperatureRange(data.temperatureRange);
//   //     setHumidityRange(data.humidityRange);

//   //     // Update form data from API response
//   //     setFormData(prev => ({
//   //       ...prev,
//   //       enddate: data.instrument?.enddate || '',
//   //       humiend: data.instrument?.humiend || '',
//   //       tempend: data.instrument?.tempend || '',
//   //       duedate: data.instrument?.duedate || '',
//   //       notes: data.instrument?.notes || '',
//   //     }));
//   //   } catch (error) {
//   //     console.error("Error fetching updated data:", error);
//   //   }
//   // };


//   const refetchObservations = async () => {
//     if (!observationTemplate) return;

//     try {
//       const response = await axios.post(
//         "https://kailtech.in/newlims/api/ob/get-observation",
//         {
//           fn: observationTemplate,
//           instid: instId,
//           inwardid: inwardId,
//         }
//       );

//       const isSuccess = response.data.status === true || response.data.staus === true;

//       if (isSuccess && response.data.data) {
//         const observationData = response.data.data;
//         console.log("📊 Refetched Observation Data:", observationData);

//         // Handle different observation template structures (same logic as in useEffect)
//         if (observationTemplate === 'observationctg' && observationData.points) {
//           setObservations(observationData.points);
//         }
//         else if (observationTemplate === 'observationdpg' && observationData.points) {
//           setObservations(observationData.points);
//         }
//         else if (observationTemplate === 'observationdg' && observationData.observations) {
//           console.log("Setting DG observations:", observationData.observations);
//           setObservations(observationData.observations);
//         }
//         // Add other template conditions as needed...
//       }
//     } catch (error) {
//       console.log("Error refetching observations:", error);
//     }
//   };

//   // Update handleSubmit function for observationdpg
//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     const token = localStorage.getItem("authToken");

//     const calibrationPoints = [];
//     const types = [];
//     const repeatables = [];
//     const values = [];

//     selectedTableData.staticRows.forEach((row, rowIndex) => {
//       const calibPointId = selectedTableData.hiddenInputs?.calibrationPoints?.[rowIndex] || "";

//       if (observationTemplate === 'observationdpg') {
//         // Column 0: SR NO
//         const key0 = `${rowIndex}-0`;
//         const value0 = tableInputValues[key0] ?? (row[0]?.toString() || "");
//         calibrationPoints.push(calibPointId);
//         types.push("sr_no");
//         repeatables.push("0");
//         values.push(value0);

//         // Column 1: SET PRESSURE UUC
//         const key1 = `${rowIndex}-1`;
//         const value1 = tableInputValues[key1] ?? (row[1]?.toString() || "");
//         calibrationPoints.push(calibPointId);
//         types.push("uuc_value");
//         repeatables.push("0");
//         values.push(value1);

//         // Column 2: SET PRESSURE MASTER
//         const key2 = `${rowIndex}-2`;
//         const value2 = tableInputValues[key2] ?? (row[2]?.toString() || "");
//         calibrationPoints.push(calibPointId);
//         types.push("converted_uuc_value");
//         repeatables.push("0");
//         values.push(value2);

//         // Column 3: M1
//         const key3 = `${rowIndex}-3`;
//         const value3 = tableInputValues[key3] ?? (row[3]?.toString() || "");
//         calibrationPoints.push(calibPointId);
//         types.push("m1");
//         repeatables.push("1");
//         values.push(value3);

//         // Column 4: M2
//         const key4 = `${rowIndex}-4`;
//         const value4 = tableInputValues[key4] ?? (row[4]?.toString() || "");
//         calibrationPoints.push(calibPointId);
//         types.push("m2");
//         repeatables.push("2");
//         values.push(value4);

//         // Column 5: M3
//         const key5 = `${rowIndex}-5`;
//         const value5 = tableInputValues[key5] ?? (row[5]?.toString() || "");
//         calibrationPoints.push(calibPointId);
//         types.push("m3");
//         repeatables.push("3");
//         values.push(value5);

//         // Column 6: MEAN
//         const key6 = `${rowIndex}-6`;
//         const value6 = tableInputValues[key6] ?? (row[6]?.toString() || "");
//         calibrationPoints.push(calibPointId);
//         types.push("average_master");
//         repeatables.push("0");
//         values.push(value6);

//         // Column 7: ERROR
//         const key7 = `${rowIndex}-7`;
//         const value7 = tableInputValues[key7] ?? (row[7]?.toString() || "");
//         calibrationPoints.push(calibPointId);
//         types.push("error");
//         repeatables.push("0");
//         values.push(value7);

//         // Column 8: REPEATABILITY
//         const key8 = `${rowIndex}-8`;
//         const value8 = tableInputValues[key8] ?? (row[8]?.toString() || "");
//         calibrationPoints.push(calibPointId);
//         types.push("repeatability");
//         repeatables.push("0");
//         values.push(value8);

//         // Column 9: HYSTERISIS
//         const key9 = `${rowIndex}-9`;
//         const value9 = tableInputValues[key9] ?? (row[9]?.toString() || "");
//         calibrationPoints.push(calibPointId);
//         types.push("hysteresis");
//         repeatables.push("0");
//         values.push(value9);
//       }   // 3. handleSubmit function me observationdg ke liye complete mapping add karen
//       else if (observationTemplate === 'observationdg') {
//         // DG has 12 columns (0-11)
//         for (let colIndex = 0; colIndex < 12; colIndex++) {
//           const key = `${rowIndex}-${colIndex}`;
//           const value = tableInputValues[key] ?? (row[colIndex]?.toString() || "");

//           calibrationPoints.push(calibPointId);
//           repeatables.push(colIndex === 3 || colIndex === 4 ? "1" : colIndex === 5 || colIndex === 6 ? "2" : "0");
//           values.push(value);

//           // Column-specific type mapping
//           if (colIndex === 0) types.push("sr_no");
//           else if (colIndex === 1) types.push("nominal_value_master");
//           else if (colIndex === 2) types.push("nominal_value_uuc");
//           else if (colIndex === 3) types.push("set1_forward");
//           else if (colIndex === 4) types.push("set1_backward");
//           else if (colIndex === 5) types.push("set2_forward");
//           else if (colIndex === 6) types.push("set2_backward");
//           else if (colIndex === 7) types.push("average_forward");
//           else if (colIndex === 8) types.push("average_backward");
//           else if (colIndex === 9) types.push("error_forward");
//           else if (colIndex === 10) types.push("error_backward");
//           else if (colIndex === 11) types.push("hysteresis");
//         }
//       }
//       else if (observationTemplate === 'observationctg') {
//         // CTG logic (keep existing working code)
//         const observationStartIndex = 2;
//         const totalObservations = 5;

//         // Column 0: range (Sr.No)
//         const key0 = `${rowIndex}-0`;
//         const value0 = tableInputValues[key0] ?? (row[0]?.toString() || "");
//         calibrationPoints.push(calibPointId);
//         types.push("range");
//         repeatables.push("0");
//         values.push(value0);

//         // Column 1: calculatedmaster (Nominal Value)
//         const key1 = `${rowIndex}-1`;
//         const value1 = tableInputValues[key1] ?? (row[1]?.toString() || "");
//         calibrationPoints.push(calibPointId);
//         types.push("calculatedmaster");
//         repeatables.push("0");
//         values.push(value1);

//         // Observations 1-5: uuc with repeatable 0-4
//         for (let obsIndex = 0; obsIndex < totalObservations; obsIndex++) {
//           const colIndex = observationStartIndex + obsIndex;
//           const key = `${rowIndex}-${colIndex}`;
//           const value = tableInputValues[key] ?? (row[colIndex]?.toString() || "");

//           calibrationPoints.push(calibPointId);
//           types.push("uuc");
//           repeatables.push(obsIndex.toString());
//           values.push(value);
//         }

//         // Average (second last column)
//         const avgColIndex = row.length - 2;
//         const keyAvg = `${rowIndex}-${avgColIndex}`;
//         const valueAvg = tableInputValues[keyAvg] ?? (row[avgColIndex]?.toString() || "");
//         calibrationPoints.push(calibPointId);
//         types.push("averageuuc");
//         repeatables.push("0");
//         values.push(valueAvg);

//         // Error (last column)
//         const errColIndex = row.length - 1;
//         const keyErr = `${rowIndex}-${errColIndex}`;
//         const valueErr = tableInputValues[keyErr] ?? (row[errColIndex]?.toString() || "");
//         calibrationPoints.push(calibPointId);
//         types.push("error");
//         repeatables.push("0");
//         values.push(valueErr);
//       }
//     });

//     const payloadStep3 = {
//       inwardid: inwardId,
//       instid: instId,
//       caliblocation: formData.calibLocation || "Lab",
//       calibacc: formData.calibAcc || "Nabl",
//       tempend: formData.tempend,
//       humiend: formData.humiend,
//       notes: formData.notes,
//       enddate: formData.enddate,
//       duedate: formData.duedate,
//       calibrationpoint: calibrationPoints,
//       type: types,
//       repeatable: repeatables,
//       value: values,
//     };

//     console.log("DPG Step 3 Payload:", payloadStep3);
//     console.log("DPG Total entries:", calibrationPoints.length);
//     console.log("DPG Calibration Points:", calibrationPoints);

//     try {
//       const response1 = await fetch(
//         `${JWT_HOST_API}/calibrationprocess/insert-calibration-step3`,
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${token}`,
//           },
//           body: JSON.stringify(payloadStep3),
//         }
//       );

//       if (!response1.ok) {
//         const errorText = await response1.text();
//         console.error("DPG Step3 API Error:", errorText);
//         toast.error("DPG Step 3 submission failed");
//         return;
//       }

//       console.log("DPG Step 3 saved successfully");
//       toast.success("DPG data submitted successfully!");

//     } catch (error) {
//       console.error("DPG Network Error:", error);
//       toast.error("Something went wrong while submitting DPG data");
//     }
//   };


//   return (
//     <Page title="CalibrateStep3">
//       <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
//         <div className="max-w-7xl mx-auto">
//           <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-4">
//             <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
//               <h1 className="text-xl font-medium text-gray-800 dark:text-white">Fill Dates</h1>
//               <div className="flex gap-2">
//                 <Button
//                   variant="outline"
//                   onClick={handleBackToInwardList}
//                   className="bg-indigo-500 hover:bg-fuchsia-500 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
//                 >
//                   ← Back to Inward Entry List
//                 </Button>
//                 <Button
//                   variant="outline"
//                   onClick={handleBackToPerformCalibration}
//                   className="bg-indigo-500 hover:bg-fuchsia-500 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
//                 >
//                   ← Back to Perform Calibration
//                 </Button>
//               </div>
//             </div>

//             <div className="p-6 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
//               <div className="grid grid-cols-12 gap-4 text-sm">
//                 <div className="col-span-6 space-y-2">
//                   <div className="flex">
//                     <span className="w-48 font-medium text-gray-700 dark:text-gray-200">Name Of The Equipment:</span>
//                     <span className="text-gray-900 dark:text-white">{instrument?.name || 'N/A'}</span>
//                   </div>
//                   <div className="text-blue-600 dark:text-blue-400 font-medium">
//                     PRESSURE, MASS & VOLUME LAB<br />
//                     Alloted Lab: {caliblocation}
//                   </div>
//                   <div className="flex">
//                     <span className="w-48 font-medium text-gray-700 dark:text-gray-200">Make:</span>
//                     <span className="text-gray-900 dark:text-white">{instrument?.make || 'N/A'}</span>
//                   </div>
//                   <div className="flex">
//                     <span className="w-48 font-medium text-gray-700 dark:text-gray-200">Model:</span>
//                     <span className="text-gray-900 dark:text-white">{instrument?.model || 'N/A'}</span>
//                   </div>
//                   <div className="flex">
//                     <span className="w-48 font-medium text-gray-700 dark:text-gray-200">SR no:</span>
//                     <span className="text-gray-900 dark:text-white">{instrument?.serialno || 'N/A'}</span>
//                   </div>
//                   <div className="flex">
//                     <span className="w-48 font-medium text-gray-700 dark:text-gray-200">Id no:</span>
//                     <span className="text-gray-900 dark:text-white">{instrument?.idno || 'N/A'}</span>
//                   </div>
//                   <div className="flex">
//                     <span className="w-48 font-medium text-gray-700 dark:text-gray-200">Calibrated On:</span>
//                     <span className="text-gray-900 dark:text-white">{instrument?.startdate || 'N/A'}</span>
//                   </div>
//                   <div className="flex">
//                     <span className="w-48 font-medium text-gray-700 dark:text-gray-200">Issue Date:</span>
//                     <span className="text-gray-900 dark:text-white">{instrument?.issuedate || 'N/A'}</span>
//                   </div>
//                 </div>
//                 <div className="col-span-6 space-y-2">
//                   <div className="flex">
//                     <span className="w-32 font-medium text-gray-700 dark:text-gray-200">BRN No:</span>
//                     <span className="text-gray-900 dark:text-white">{instrument?.bookingrefno || 'N/A'}</span>
//                   </div>
//                   <div className="flex">
//                     <span className="w-32 font-medium text-gray-700 dark:text-gray-200">Receive Date:</span>
//                     <span className="text-gray-900 dark:text-white">{inwardEntry?.sample_received_on || 'N/A'}</span>
//                   </div>
//                   <div className="flex">
//                     <span className="w-32 font-medium text-gray-700 dark:text-gray-200">Range:</span>
//                     <span className="text-gray-900 dark:text-white">{instrument?.equipmentrange || 'N/A'}</span>
//                   </div>
//                   <div className="flex">
//                     <span className="w-32 font-medium text-gray-700 dark:text-gray-200">Least Count:</span>
//                     <span className="text-gray-900 dark:text-white">{instrument?.leastcount || 'N/A'}</span>
//                   </div>
//                   <div className="flex">
//                     <span className="w-32 font-medium text-gray-700 dark:text-gray-200">Condition Of UUC:</span>
//                     <span className="text-gray-900 dark:text-white">{instrument?.conditiononrecieve || 'N/A'}</span>
//                   </div>
//                   <div className="flex">
//                     <span className="w-32 font-medium text-gray-700 dark:text-gray-200">Calibration performed At:</span>
//                     <span className="text-gray-900 dark:text-white">{instrument?.performedat || 'Lab'}</span>
//                   </div>
//                   <div className="flex">
//                     <span className="w-32 font-medium text-gray-700 dark:text-gray-200">Temperature (°C):</span>
//                     <span className="text-gray-900 dark:text-white">{instrument?.temperature || 'N/A'}</span>
//                   </div>
//                   <div className="flex">
//                     <span className="w-32 font-medium text-gray-700 dark:text-gray-200">Humidity (%RH):</span>
//                     <span className="text-gray-900 dark:text-white">{instrument?.humidity || 'N/A'}</span>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             <form onSubmit={handleSubmit} className="p-6">
//               <h2 className="text-lg font-medium text-gray-800 dark:text-white mb-4">Masters</h2>
//               <div className="mb-6">
//                 <div className="overflow-x-auto">
//                   <table className="w-full text-sm border-collapse border border-gray-300 dark:border-gray-600">
//                     <thead>
//                       <tr className="bg-gray-100 dark:bg-gray-700">
//                         <th className="p-2 border border-gray-300 dark:border-gray-600 font-medium text-left text-gray-800 dark:text-white">Reference Standard</th>
//                         <th className="p-2 border border-gray-300 dark:border-gray-600 font-medium text-left text-gray-800 dark:text-white">S.w/o</th>
//                         <th className="p-2 border border-gray-300 dark:border-gray-600 font-medium text-left text-gray-800 dark:text-white">LD.No.</th>
//                         <th className="p-2 border border-gray-300 dark:border-gray-600 font-medium text-left text-gray-800 dark:text-white">Certificate No.</th>
//                         <th className="p-2 border border-gray-300 dark:border-gray-600 font-medium text-left text-gray-800 dark:text-white">Valid Upto</th>
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {masters && masters.length > 0 ? (
//                         masters.map((item, index) => (
//                           <tr key={index} className="dark:bg-gray-800">
//                             <td className="p-2 border border-gray-300 dark:border-gray-600 dark:text-white">{item.name}</td>
//                             <td className="p-2 border border-gray-300 dark:border-gray-600 dark:text-white">{item.serialno}</td>
//                             <td className="p-2 border border-gray-300 dark:border-gray-600 dark:text-white">{item.idno}</td>
//                             <td className="p-2 border border-gray-300 dark:border-gray-600 dark:text-white">{item.certificateno}</td>
//                             <td className="p-2 border border-gray-300 dark:border-gray-600 dark:text-white">{item.enddate}</td>
//                           </tr>
//                         ))
//                       ) : (
//                         <tr>
//                           <td colSpan="5" className="p-2 border border-gray-300 dark:border-gray-600 text-center dark:text-white">
//                             No data available
//                           </td>
//                         </tr>
//                       )}
//                     </tbody>
//                   </table>
//                 </div>
//               </div>

//               <div className="mb-6">
//                 <h2 className="text-md font-medium text-gray-800 dark:text-white mb-2">Support masters</h2>
//                 <div className="overflow-x-auto">
//                   <table className="w-full text-sm border-collapse border border-gray-300 dark:border-gray-600">
//                     <thead>
//                       <tr className="bg-gray-100 dark:bg-gray-700">
//                         <th className="p-2 border border-gray-300 dark:border-gray-600 font-medium text-left text-gray-800 dark:text-white">Reference Standard</th>
//                         <th className="p-2 border border-gray-300 dark:border-gray-600 font-medium text-left text-gray-800 dark:text-white">S.w/o</th>
//                         <th className="p-2 border border-gray-300 dark:border-gray-600 font-medium text-left text-gray-800 dark:text-white">LD.No.</th>
//                         <th className="p-2 border border-gray-300 dark:border-gray-600 font-medium text-left text-gray-800 dark:text-white">Certificate No.</th>
//                         <th className="p-2 border border-gray-300 dark:border-gray-600 font-medium text-left text-gray-800 dark:text-white">Valid Upto</th>
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {supportMasters && supportMasters.length > 0 ? (
//                         supportMasters.map((item, index) => (
//                           <tr key={index} className="dark:bg-gray-800">
//                             <td className="p-2 border border-gray-300 dark:border-gray-600 dark:text-white">{item.name}</td>
//                             <td className="p-2 border border-gray-300 dark:border-gray-600 dark:text-white">{item.serialno}</td>
//                             <td className="p-2 border border-gray-300 dark:border-gray-600 dark:text-white">{item.idno}</td>
//                             <td className="p-2 border border-gray-300 dark:border-gray-600 dark:text-white">{item.certificateno}</td>
//                             <td className="p-2 border border-gray-300 dark:border-gray-600 dark:text-white">{item.enddate}</td>
//                           </tr>
//                         ))
//                       ) : (
//                         <tr>
//                           <td colSpan="5" className="p-2 border border-gray-300 dark:border-gray-600 text-center dark:text-white">
//                             No data available
//                           </td>
//                         </tr>
//                       )}
//                     </tbody>
//                   </table>
//                 </div>
//               </div>

//               {renderThermalCoefficientSection()}

//               <div className="mb-6">
//                 <h2 className="text-md font-medium text-gray-800 dark:text-white mb-4">Observation Detail</h2>
//                 {observationTemplate && (
//                   <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-3 mb-4">
//                     <p className="text-sm text-blue-800 dark:text-blue-200">
//                       <strong>Current Observation Template:</strong> {observationTemplate}
//                     </p>
//                   </div>
//                 )}

//                 {selectedTableData && tableStructure && (
//                   <div className="overflow-x-auto border border-gray-200 dark:border-gray-600">
//                     <table className="w-full text-sm">
//                       <thead>
//                         <tr className="bg-gray-100 dark:bg-gray-700 border-b border-gray-300 dark:border-gray-600">
//                           {tableStructure.headers.map((header, index) => (
//                             <th
//                               key={index}
//                               colSpan={header.colspan}
//                               className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider border-r border-gray-300 dark:border-gray-600 last:border-r-0"
//                             >
//                               {header.name}
//                             </th>
//                           ))}
//                         </tr>
//                         {tableStructure.subHeadersRow.some(item => item !== null) && (
//                           <tr className="bg-gray-50 dark:bg-gray-600 border-b border-gray-300 dark:border-gray-600">
//                             {tableStructure.subHeadersRow.map((subHeader, index) => (
//                               <th
//                                 key={index}
//                                 className="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-300 border-r border-gray-300 dark:border-gray-600 last:border-r-0"
//                               >
//                                 {subHeader}
//                               </th>
//                             ))}
//                           </tr>
//                         )}
//                       </thead>
//                       <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
//                         {(selectedTableData.staticRows?.length > 0
//                           ? selectedTableData.staticRows
//                           : [Array(tableStructure.subHeadersRow.length).fill("")]).map((row, rowIndex) => (
//                             <tr
//                               key={rowIndex}
//                               className="hover:bg-gray-50 dark:hover:bg-gray-700"
//                             >
//                               {row.map((cell, colIndex) => {
//                                 const key = `${rowIndex}-${colIndex}`;
//                                 const currentValue =
//                                   tableInputValues[key] ?? (cell?.toString() || "");

//                                 // 👉 Observation index निकालना
//                                 let observationIndex = null;
//                                 const observationStartIndex = 2; // Sr.No(0) + Nominal Value(1) के बाद से observations शुरू
//                                 const observationCount = 5; // Observation 1..5 fix count

//                                 if (colIndex >= observationStartIndex && colIndex < observationStartIndex + observationCount) {
//                                   observationIndex = colIndex - observationStartIndex; // 0 से start होगा
//                                 }

//                                 return (
//                                   <td
//                                     key={colIndex}
//                                     className="px-3 py-2 whitespace-nowrap text-sm border-r border-gray-200 dark:border-gray-600 last:border-r-0"
//                                   >
//                                     <input
//                                       type="text"
//                                       className="w-full px-2 py-1 border border-gray-200 dark:border-gray-600 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
//                                       value={currentValue}
//                                       onChange={(e) =>
//                                         handleInputChange(rowIndex, colIndex, e.target.value)
//                                       }
//                                       onBlur={(e) =>
//                                         handleRowSave(rowIndex, colIndex, e.target.value, observationIndex)
//                                       }
//                                     />
//                                   </td>
//                                 );
//                               })}
//                             </tr>
//                           ))}
//                       </tbody>

//                     </table>

//                   </div>
//                 )}

//                 {observationTemplate && observation.length === 0 && (
//                   <div className="text-center py-8 text-gray-500 dark:text-gray-400">
//                     <p>No observations found for template: {observationTemplate}</p>
//                   </div>
//                 )}
//               </div>

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
//                     Temperature End (°C) <span className="text-red-500">*</span>:
//                   </label>
//                   <input
//                     type="text"
//                     name="tempend"
//                     value={formData.tempend}
//                     onChange={handleFormChange}
//                     className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
//                     placeholder="Enter temperature range"
//                     required
//                   />
//                   {temperatureRange && (
//                     <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
//                       Range: {temperatureRange.min ? `${temperatureRange.min} - ${temperatureRange.max}` : temperatureRange.value || 'N/A'}
//                     </p>
//                   )}
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
//                     Humidity End (%RH) <span className="text-red-500">*</span>:
//                   </label>
//                   <input
//                     type="text"
//                     name="humiend"
//                     value={formData.humiend}
//                     onChange={handleFormChange}
//                     className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
//                     placeholder="Enter humidity range"
//                     required
//                   />
//                   {humidityRange && (
//                     <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
//                       Range: {humidityRange.min ? `${humidityRange.min} - ${humidityRange.max}` : humidityRange.value || 'N/A'}
//                     </p>
//                   )}
//                 </div>
//               </div>

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
//                     Calibration End Date/Done date:
//                   </label>
//                   <input
//                     type="date"
//                     name="duedate"
//                     value={formData.duedate ? new Date(formData.duedate).toISOString().split('T')[0] : ''}
//                     onChange={handleFormChange}
//                     className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
//                     Suggested Due Date:
//                   </label>
//                   <input
//                     type="date"
//                     name="duedate"
//                     value={formData.duedate}
//                     onChange={handleFormChange}
//                     className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
//                   />
//                 </div>
//               </div>

//               <div className="mt-4">
//                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Notes:</label>
//                 <textarea
//                   name="notes"
//                   value={formData.notes}
//                   onChange={handleFormChange}
//                   rows={3}
//                   className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
//                   placeholder="Enter notes"
//                 />
//               </div>

//               <div className="flex justify-end mt-8 mb-4">
//                 <Button
//                   type="submit"
//                   className="bg-green-500 hover:bg-green-600 text-white px-8 py-2 rounded font-medium transition-colors"
//                   onSubmit={handleSubmit}
//                 >
//                   Submit
//                 </Button>
//               </div>
//             </form>
//           </div>

//           <div className="flex items-center justify-between px-6 pb-6">
//             <div className="flex-1 mx-4">
//               <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
//                 <div className="bg-green-500 h-2 rounded-full transition-all duration-300" style={{ width: '75%' }}></div>
//               </div>
//             </div>
//             <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">›</button>
//           </div>
//         </div>
//       </div>
//     </Page>
//   );
// };

// export default CalibrateStep3;


















// ishwar code ------------------------


import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Page } from 'components/shared/Page';
import { Button } from 'components/ui/Button';
import { toast } from 'sonner';
import axios from 'utils/axios';
import { JWT_HOST_API } from "configs/auth.config";

const CalibrateStep3 = () => {
  const navigate = useNavigate();
  const { id, itemId: instId } = useParams();
  const inwardId = id;
  const searchParams = new URLSearchParams(window.location.search);
  const caliblocation = searchParams.get('caliblocation') || 'Lab';
  const calibacc = searchParams.get('calibacc') || 'Nabl';

  const [instrument, setInstrument] = useState(null);
  const [inwardEntry, setInwardEntry] = useState(null);
  const [masters, setMasters] = useState([]);
  const [supportMasters, setSupportMasters] = useState([]);
  const [observationTemplate, setObservationTemplate] = useState(null);
  const [temperatureRange, setTemperatureRange] = useState(null);
  const [humidityRange, setHumidityRange] = useState(null);
  const [observations, setObservations] = useState([]);
  const [errors, setErrors] = useState({});
  const [tableInputValues, setTableInputValues] = useState({});
  const [thermalCoeff, setThermalCoeff] = useState({
    uuc: '',
    master: '',
    thickness_of_graduation: '',
  });

  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) return savedTheme;
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  const [formData, setFormData] = useState({
    enddate: '',
    duedate: '',
    notes: '',
    tempend: '',
    humiend: '',
  });

  useEffect(() => {
    axios
      .get('https://kailtech.in/newlims/api/calibrationprocess/get-calibration-step3-details', {
        params: {
          inward_id: inwardId,
          instid: instId,
          caliblocation: caliblocation,
          calibacc: calibacc,
        },
      })
      .then((res) => {
        console.log('✅ API Data:', res.data);
        const data = res.data;

        setInwardEntry(data.inwardEntry);
        setInstrument(data.instrument);
        setMasters(data.masters);
        setSupportMasters(data.supportMasters);
        setObservationTemplate(data.observationTemplate);
        setTemperatureRange(data.temperatureRange);
        setHumidityRange(data.humidityRange);

        setFormData((prev) => ({
          ...prev,
          enddate: data.instrument?.enddate || '',
          humiend: data.instrument?.humiend || '',
          tempend: data.instrument?.tempend || '',
          duedate: data.instrument?.duedate || '',
          temperatureEnd: data.temperatureRange?.min && data.temperatureRange?.max
            ? `${data.temperatureRange.min} - ${data.temperatureRange.max}`
            : data.temperatureRange?.value || '',
          humidityEnd: data.humidityRange?.min && data.humidityRange?.max
            ? `${data.humidityRange.min} - ${data.humidityRange.max}`
            : data.humidityRange?.value || '',
        }));
      })
      .catch((err) => {
        console.error('❌ API Error:', err.response?.data || err);
        toast.error('Failed to fetch calibration data');
      });
  }, [inwardId, instId, caliblocation, calibacc]);

  const safeGetValue = (item) => {
    if (!item) return '';
    if (typeof item === 'object' && item !== null) {
      return item.value !== null && item.value !== undefined ? item.value : '';
    }
    return item.toString();
  };

  const safeGetArray = (item, defaultLength = 0) => {
    if (!item) return Array(defaultLength).fill('');
    if (Array.isArray(item)) return item;
    if (typeof item === 'string') return [item];
    return Array(defaultLength).fill('');
  };


  // Add this validation function
  const validateForm = () => {
    let newErrors = {};
    const temp = parseFloat(formData.tempend);
    if (temperatureRange) {
      if (temperatureRange.min !== undefined && temperatureRange.max !== undefined) {
        if (isNaN(temp) || temp < temperatureRange.min || temp > temperatureRange.max) {
          newErrors.tempend = `Temperature must be between ${temperatureRange.min} and ${temperatureRange.max}`;
        }
      } else if (temperatureRange.value !== undefined) {
        if (isNaN(temp) || temp !== temperatureRange.value) {
          newErrors.tempend = `Temperature must be ${temperatureRange.value}`;
        }
      }
    }

    const humi = parseFloat(formData.humiend);
    if (humidityRange) {
      if (humidityRange.min !== undefined && humidityRange.max !== undefined) {
        if (isNaN(humi) || humi < humidityRange.min || humi > humidityRange.max) {
          newErrors.humiend = `Humidity must be between ${humidityRange.min} and ${humidityRange.max}`;
        }
      } else if (humidityRange.value !== undefined) {
        if (isNaN(humi) || humi !== humidityRange.value) {
          newErrors.humiend = `Humidity must be ${humidityRange.value}`;
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    const fetchObservations = async () => {
      if (!observationTemplate) return;

      try {
        const response = await axios.post(
          'https://kailtech.in/newlims/api/ob/get-observation',
          {
            fn: observationTemplate,
            instid: instId,
            inwardid: inwardId,
          }
        );

        const isSuccess = response.data.status === true || response.data.staus === true;

        if (isSuccess && response.data.data) {
          const observationData = response.data.data;
          console.log('📊 Observation Data:', observationData);

          if (observationTemplate === 'observationmt' && observationData.thermal_coeff) {
            setThermalCoeff({
              uuc: observationData.thermal_coeff.uuc || '',
              master: observationData.thermal_coeff.master || '',
              thickness_of_graduation: observationData.thermal_coeff.thickness_of_graduation || '',
            });
          }

          if (observationTemplate === 'observationodfm' && observationData.calibration_points) {
            console.log('Setting ODFM observations:', observationData.calibration_points);
            setObservations(observationData.calibration_points);
          } else if (observationTemplate === 'observationdpg' && observationData.observations) {
            console.log('✅ Setting DPG Observations:', observationData.observations);
            setObservations(observationData.observations);
          } else if (observationTemplate === 'observationapg') {
            setObservations(observationData);
          } else if (observationTemplate === 'observationctg' && observationData.points) {
            console.log(
              'CTG Points with IDs:',
              observationData.points.map((p) => ({
                id: p.id,
                sr_no: p.sr_no,
              }))
            );
            setObservations(observationData.points);
            if (observationTemplate === 'observationctg' && observationData.thermal_coeff) {
              setThermalCoeff({
                uuc: observationData.thermal_coeff.uuc || '',
                master: observationData.thermal_coeff.master || '',
              });
            }
          } else {
            setObservations([]);
          }
        } else {
          console.log('No observations found');
          setObservations([]);
        }
      } catch (error) {
        console.log('Error fetching observations:', error);
        setObservations([]);
      }
    };

    fetchObservations();
  }, [observationTemplate, instId, inwardId]);

  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (!localStorage.getItem('theme')) {
        setTheme(mediaQuery.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Calculation function for observation table
  const calculateRowValues = (rowData, template) => {
    const parsedValues = rowData.map((val) => {
      const num = parseFloat(val);
      return isNaN(num) ? 0 : num;
    });

    const result = { average: '', error: '', hysteresis: '' };

    if (template === 'observationdpg') {
      const m1 = parsedValues[3];
      const m2 = parsedValues[4];
      const m3 = parsedValues[5];
      const validReadings = [m1, m2, m3].filter((val) => val !== 0);
      result.average = validReadings.length
        ? (validReadings.reduce((sum, val) => sum + val, 0) / validReadings.length).toFixed(2)
        : '';
      const setPressureMaster = parsedValues[2];
      result.error = result.average && setPressureMaster
        ? (result.average - setPressureMaster).toFixed(2)
        : '';
      result.hysteresis = parsedValues[9] || '';
    } else if (template === 'observationodfm') {
      const observations = parsedValues.slice(5, 10).filter((val) => val !== 0);
      result.average = observations.length
        ? (observations.reduce((sum, val) => sum + val, 0) / observations.length).toFixed(2)
        : '';
      const nominalValue = parsedValues[2];
      result.error = result.average && nominalValue
        ? (result.average - nominalValue).toFixed(2)
        : '';
    } else if (template === 'observationapg') {
      const m1 = parsedValues[3];
      const m2 = parsedValues[4];
      const validReadings = [m1, m2].filter((val) => val !== 0);
      result.average = validReadings.length
        ? (validReadings.reduce((sum, val) => sum + val, 0) / validReadings.length).toFixed(2)
        : '';
      const setPressureBar = parsedValues[2];
      result.error = result.average && setPressureBar
        ? (result.average - setPressureBar).toFixed(2)
        : '';
      result.hysteresis = parsedValues[7] || '';
    } else if (template === 'observationctg') {
      const observations = parsedValues.slice(2, 7).filter((val) => val !== 0);
      result.average = observations.length
        ? (observations.reduce((sum, val) => sum + val, 0) / observations.length).toFixed(2)
        : '';
      const nominalValue = parsedValues[1];
      result.error = result.average && nominalValue
        ? (result.average - nominalValue).toFixed(2)
        : '';
    }

    return result;
  };

  const createObservationRows = (observationData, template) => {
    if (!observationData)
      return {
        rows: [],
        hiddenInputs: { calibrationPoints: [], types: [], repeatables: [], values: [] },
      };

    let dataArray = [];
    const calibrationPoints = [];
    const types = [];
    const repeatables = [];
    const values = [];

    if (Array.isArray(observationData)) {
      dataArray = observationData;
    } else if (typeof observationData === 'object' && observationData !== null) {
      if (observationData.data && Array.isArray(observationData.data)) {
        dataArray = observationData.data;
      } else if (observationData.points && Array.isArray(observationData.points)) {
        dataArray = observationData.points;
      } else if (
        observationData.calibration_points &&
        Array.isArray(observationData.calibration_points)
      ) {
        dataArray = observationData.calibration_points;
      } else {
        dataArray = [observationData];
      }
    }

    const rows = [];

    if (template === 'observationdpg') {
      dataArray.forEach((obs) => {
        if (!obs) return;
        const row = [
          obs.sr_no?.toString() || '',
          safeGetValue(obs.uuc_value || obs.set_pressure_uuc),
          safeGetValue(obs.converted_uuc_value || obs.set_pressure_master),
          safeGetValue(obs.master_readings?.m1 || obs.m1),
          safeGetValue(obs.master_readings?.m2 || obs.m2),
          safeGetValue(obs.master_readings?.m3 || obs.m3),
          safeGetValue(obs.average_master || obs.mean),
          safeGetValue(obs.error),
          safeGetValue(obs.repeatability),
          safeGetValue(obs.hysterisis || obs.hysteresis),
        ];
        rows.push(row);
        calibrationPoints.push('1');
        types.push('uuc');
        repeatables.push('0');
        values.push(safeGetValue(obs.uuc_value || obs.set_pressure_uuc) || '0');
      });
    } else if (template === 'observationodfm') {
      dataArray.forEach((point) => {
        if (!point) return;
        const observations = safeGetArray(point.observations, 5);
        const row = [
          point.sr_no?.toString() || '',
          safeGetValue(point.range),
          safeGetValue(point.nominal_value || point.uuc_value),
          safeGetValue(point.average),
          safeGetValue(point.error),
          ...observations.slice(0, 5).map((obs) => safeGetValue(obs)),
        ];
        while (row.length < 10) {
          row.push('');
        }
        rows.push(row);
        calibrationPoints.push(point.calibration_point_id);
        types.push('input');
        repeatables.push(point.metadata?.repeatable_cycle?.toString() || '5');
        values.push(safeGetValue(point.nominal_value || point.uuc_value) || '0');
      });
    } else if (template === 'observationapg') {
      dataArray.forEach((obs) => {
        if (!obs) return;
        const row = [
          obs.sr_no?.toString() || '',
          safeGetValue(obs.uuc),
          safeGetValue(obs.calculated_uuc),
          safeGetValue(obs.m1),
          safeGetValue(obs.m2),
          safeGetValue(obs.mean),
          safeGetValue(obs.error),
          safeGetValue(obs.hysterisis),
        ];
        rows.push(row);
        calibrationPoints.push('1');
        types.push('input');
        repeatables.push('1');
        values.push(safeGetValue(obs.uuc) || '0');
      });
    } else if (template === 'observationctg') {
      dataArray.forEach((point) => {
        const observations = safeGetArray(point?.observations, 5);
        const row = [
          point?.sr_no?.toString() || '',
          point?.nominal_value || '',
          ...observations.slice(0, 5).map((obs) => safeGetValue(obs)),
          safeGetValue(point?.average),
          safeGetValue(point?.error),
        ];
        rows.push(row);
        calibrationPoints.push(point?.id || '1');
        types.push('uuc');
        repeatables.push('0');
        values.push(safeGetValue(point?.nominal_value) || '0');
      });
    }

    return {
      rows,
      hiddenInputs: { calibrationPoints, types, repeatables, values },
    };
  };

  const observationTables = [
    {
      id: 'observationdpg',
      name: 'Observation DPG',
      category: 'Pressure',
      structure: {
        singleHeaders: [
          'SR NO',
          'SET PRESSURE ON UUC (CALCULATIONUNIT)',
          '[SET PRESSURE ON UUC (MASTERUNIT)]',
        ],
        subHeaders: {
          'OBSERVATION ON UUC': ['M1', 'M2', 'M3'],
        },
        remainingHeaders: ['MEAN (UUCUNIT)', 'ERROR (UUCUNIT)', 'REPEATABILITY (UUCUNIT)', 'HYSTERISIS (UUCUNIT)'],
      },
      staticRows: createObservationRows(observations, 'observationdpg').rows,
      hiddenInputs: createObservationRows(observations, 'observationdpg').hiddenInputs,
    },
    {
      id: 'observationodfm',
      name: 'Observation ODFM',
      category: 'Flow Meter',
      structure: {
        singleHeaders: [
          'Sr. No.',
          'Range (UUC Unit)',
          'Nominal/ Set Value UUC (UUC Unit)',
          'Average (Master Unit)',
          'Error (Master Unit)',
        ],
        subHeaders: {
          'Observation on UUC': [
            'Observation 1 (Master Unit)',
            'Observation 2 (Master Unit)',
            'Observation 3 (Master Unit)',
            'Observation 4 (Master Unit)',
            'Observation 5 (Master Unit)',
          ],
        },
        remainingHeaders: [],
      },
      staticRows: createObservationRows(observations, 'observationodfm').rows,
      hiddenInputs: createObservationRows(observations, 'observationodfm').hiddenInputs,
    },
    {
      id: 'observationapg',
      name: 'Observation APG',
      category: 'Pressure',
      structure: {
        singleHeaders: ['Sr no', 'Set Pressure on UUC (kg/cm²)', 'Set Pressure on UUC (bar)'],
        subHeaders: {
          'Observations on Master (bar)': ['M1', 'M2'],
        },
        remainingHeaders: ['Mean (bar)', 'Error (bar)', 'Hysterisis (bar)'],
      },
      staticRows: createObservationRows(observations, 'observationapg').rows,
      hiddenInputs: createObservationRows(observations, 'observationapg').hiddenInputs,
    },
    {
      id: 'observationctg',
      name: 'Observation CTG',
      category: 'Temperature',
      structure: {
        thermalCoeff: true,
        singleHeaders: ['Sr. No.', 'Nominal Value'],
        subHeaders: {
          'Observation on UUC': ['Observation 1', 'Observation 2', 'Observation 3', 'Observation 4', 'Observation 5'],
        },
        remainingHeaders: ['Average', 'Error'],
      },
      staticRows: createObservationRows(observations, 'observationctg').rows,
      hiddenInputs: createObservationRows(observations, 'observationctg').hiddenInputs,
    },
  ];

  const availableTables = observationTables.filter(
    (table) => observationTemplate && table.id === observationTemplate
  );

  const [selectedTable, setSelectedTable] = useState('');

  useEffect(() => {
    if (observationTemplate && availableTables.length > 0) {
      setSelectedTable(observationTemplate);
    }
  }, [observationTemplate, availableTables.length]);

  const selectedTableData = availableTables.find((table) => table.id === selectedTable);

  const generateTableStructure = () => {
    if (!selectedTableData || !selectedTableData.structure) return null;

    const structure = selectedTableData.structure;
    const headers = [];
    const subHeadersRow = [];

    structure.singleHeaders.forEach((header) => {
      headers.push({ name: header, colspan: 1 });
      subHeadersRow.push(null);
    });

    if (structure.subHeaders && Object.keys(structure.subHeaders).length > 0) {
      Object.entries(structure.subHeaders).forEach(([groupName, subHeaders]) => {
        headers.push({ name: groupName, colspan: subHeaders.length });
        subHeaders.forEach((subHeader) => {
          subHeadersRow.push(subHeader);
        });
      });
    }

    if (structure.remainingHeaders && structure.remainingHeaders.length > 0) {
      structure.remainingHeaders.forEach((header) => {
        headers.push({ name: header, colspan: 1 });
        subHeadersRow.push(null);
      });
    }

    return { headers, subHeadersRow };
  };

  const tableStructure = generateTableStructure();

  const handleInputChange = (rowIndex, colIndex, value) => {
    setTableInputValues((prev) => {
      const newValues = { ...prev };
      const key = `${rowIndex}-${colIndex}`;
      newValues[key] = value;

      // Get current row data
      const rowData = selectedTableData.staticRows[rowIndex].map((cell, idx) => {
        const inputKey = `${rowIndex}-${idx}`;
        return newValues[inputKey] ?? (cell?.toString() || '');
      });

      // Perform calculations
      const calculated = calculateRowValues(rowData, selectedTableData.id);

      // Update calculated fields
      if (selectedTableData.id === 'observationdpg') {
        newValues[`${rowIndex}-6`] = calculated.average; // Mean
        newValues[`${rowIndex}-7`] = calculated.error; // Error
        newValues[`${rowIndex}-9`] = calculated.hysteresis; // Hysteresis
      } else if (selectedTableData.id === 'observationodfm') {
        newValues[`${rowIndex}-3`] = calculated.average; // Average
        newValues[`${rowIndex}-4`] = calculated.error; // Error
      } else if (selectedTableData.id === 'observationapg') {
        newValues[`${rowIndex}-5`] = calculated.average; // Mean
        newValues[`${rowIndex}-6`] = calculated.error; // Error
        newValues[`${rowIndex}-7`] = calculated.hysteresis; // Hysteresis
      } else if (selectedTableData.id === 'observationctg') {
        newValues[`${rowIndex}-7`] = calculated.average; // Average
        newValues[`${rowIndex}-8`] = calculated.error; // Error
      }

      return newValues;
    });
  };

  const handleObservationBlur = async (rowIndex, colIndex, value) => {
    if (selectedTableData.id !== 'observationctg') return; // Only handle for observationctg

    const token = localStorage.getItem('authToken');
    const hiddenInputs = selectedTableData?.hiddenInputs || {
      calibrationPoints: [],
      types: [],
      repeatables: [],
      values: [],
    };

    const calibrationPointId = hiddenInputs.calibrationPoints[rowIndex];
    if (!calibrationPointId) {
      toast.error('Calibration point ID not found');
      return;
    }

    // Get current row data with updated input
    const rowData = selectedTableData.staticRows[rowIndex].map((cell, idx) => {
      const inputKey = `${rowIndex}-${idx}`;
      return idx === colIndex ? value : (tableInputValues[inputKey] ?? (cell?.toString() || ''));
    });

    // Calculate average and error
    const calculated = calculateRowValues(rowData, selectedTableData.id);

    // Update table input values for average and error
    setTableInputValues((prev) => ({
      ...prev,
      [`${rowIndex}-7`]: calculated.average,
      [`${rowIndex}-8`]: calculated.error,
    }));

    // Prepare payloads
    const payloads = [];

    // Input value payload
    let type = 'uuc';
    let repeatable = '0';

    if (colIndex === 1) {
      type = 'uuc'; // Nominal Value
      repeatable = '0';
    } else if (colIndex >= 2 && colIndex <= 6) {
      type = 'uuc'; // Observations
      repeatable = (colIndex - 2).toString(); // Map colIndex to repeatable (0-4)
    } else {
      return; // Skip if not a relevant column
    }

    payloads.push({
      inwardid: inwardId,
      instid: instId,
      calibrationpoint: calibrationPointId,
      type: type,
      repeatable: repeatable,
      value: value || '0',
    });

    // Average and Error payloads
    if (calculated.average) {
      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: 'averageuuc',
        repeatable: '0',
        value: calculated.average || '0',
      });
    }

    if (calculated.error) {
      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: 'error',
        repeatable: '0',
        value: calculated.error || '0',
      });
    }

    console.log('📡 Observation Blur Payloads:', payloads);

    try {
      for (const payload of payloads) {
        await axios.post(
          `${JWT_HOST_API}/calibrationprocess/set-observations`,
          payload,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }

      console.log(`Observation [${rowIndex}, ${colIndex}] and calculated values saved successfully!`);
      toast.success(`Observation and calculated values saved successfully!`);

      // Refetch observations to update the table
      await refetchObservations();
    } catch (err) {
      console.error(`Error saving observation [${rowIndex}, ${colIndex}]:`, err);
      toast.error(err.response?.data?.message || 'Failed to save observation');
    }
  };

  const handleThermalCoeffBlur = async (type, value) => {
    if (selectedTableData.id !== 'observationctg') return; // Only handle for observationctg

    const token = localStorage.getItem('authToken');
    const calibrationPointId = selectedTableData?.hiddenInputs?.calibrationPoints?.[0];

    if (!calibrationPointId) {
      toast.error('Calibration point ID not found for thermal coefficient');
      return;
    }

    const payload = {
      inwardid: inwardId,
      instid: instId,
      calibrationpoint: calibrationPointId,
      type: type, // 'thermalcoffuuc' or 'thermalcoffmaster'
      repeatable: '0',
      value: value || '0',
    };

    console.log('📡 Thermal Coefficient Payload:', payload);

    try {
      await axios.post(
        `${JWT_HOST_API}/calibrationprocess/set-observations`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log(`Thermal coefficient (${type}) saved successfully!`);
      toast.success(`Thermal coefficient saved successfully!`);
    } catch (err) {
      console.error(`Error saving thermal coefficient (${type}):`, err);
      toast.error(err.response?.data?.message || 'Failed to save thermal coefficient');
    }
  };

  const refetchObservations = async () => {
    if (!observationTemplate) return;

    try {
      const response = await axios.post(
        'https://kailtech.in/newlims/api/ob/get-observation',
        {
          fn: observationTemplate,
          instid: instId,
          inwardid: inwardId,
        }
      );

      const isSuccess = response.data.status === true || response.data.staus === true;

      if (isSuccess && response.data.data) {
        const observationData = response.data.data;
        console.log('📊 Refetched Observation Data:', observationData);

        if (observationTemplate === 'observationctg' && observationData.points) {
          setObservations(observationData.points);
          if (observationTemplate === 'observationctg' && observationData.thermal_coeff) {
            setThermalCoeff({
              uuc: observationData.thermal_coeff.uuc || '',
              master: observationData.thermal_coeff.master || '',
            });
          }
        } else if (observationTemplate === 'observationodfm' && observationData.calibration_points) {
          setObservations(observationData.calibration_points);
        } else if (observationTemplate === 'observationdpg' && observationData.observations) {
          console.log('✅ Setting DPG Observations:', observationData.observations);
          setObservations(observationData.observations);
        } else if (observationTemplate === 'observationapg') {
          setObservations(observationData);
        } else {
          setObservations([]);
        }
      }
    } catch (error) {
      console.log('Error refetching observations:', error);
    }
  };

  const handleRowSave = async (rowIndex) => {
    const token = localStorage.getItem('authToken');
    const hiddenInputs = selectedTableData?.hiddenInputs || {
      calibrationPoints: [],
      types: [],
      repeatables: [],
      values: [],
    };

    const calibrationPointId = hiddenInputs.calibrationPoints[rowIndex];
    if (!calibrationPointId) {
      toast.error('Calibration point ID not found');
      return;
    }

    // Get current row data
    const rowData = selectedTableData.staticRows[rowIndex].map((cell, idx) => {
      const inputKey = `${rowIndex}-${idx}`;
      return tableInputValues[inputKey] ?? (cell?.toString() || '');
    });

    // Perform calculations
    const calculated = calculateRowValues(rowData, selectedTableData.id);

    // Prepare payloads for all inputs in the row
    const payloads = [];
    if (selectedTableData.id === 'observationdpg') {
      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: 'uuc',
        repeatable: '0',
        value: rowData[1] || '0',
      });
      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: 'calculatedmaster',
        repeatable: '0',
        value: rowData[2] || '0',
      });
      [3, 4, 5].forEach((colIdx, obsIdx) => {
        payloads.push({
          inwardid: inwardId,
          instid: instId,
          calibrationpoint: calibrationPointId,
          type: 'uuc',
          repeatable: obsIdx.toString(),
          value: rowData[colIdx] || '0',
        });
      });
      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: 'averageuuc',
        repeatable: '0',
        value: calculated.average || '0',
      });
      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: 'error',
        repeatable: '0',
        value: calculated.error || '0',
      });
      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: 'hysterisis',
        repeatable: '0',
        value: rowData[9] || calculated.hysteresis || '0',
      });
    } else if (selectedTableData.id === 'observationodfm') {
      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: 'range',
        repeatable: '0',
        value: rowData[1] || '0',
      });
      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: 'uuc',
        repeatable: '0',
        value: rowData[2] || '0',
      });
      [5, 6, 7, 8, 9].forEach((colIdx, obsIdx) => {
        payloads.push({
          inwardid: inwardId,
          instid: instId,
          calibrationpoint: calibrationPointId,
          type: 'master',
          repeatable: obsIdx.toString(),
          value: rowData[colIdx] || '0',
        });
      });
      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: 'averageuuc',
        repeatable: '0',
        value: calculated.average || '0',
      });
      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: 'error',
        repeatable: '0',
        value: calculated.error || '0',
      });
    } else if (selectedTableData.id === 'observationapg') {
      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: 'uuc',
        repeatable: '0',
        value: rowData[1] || '0',
      });
      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: 'calculatedmaster',
        repeatable: '0',
        value: rowData[2] || '0',
      });
      [3, 4].forEach((colIdx, obsIdx) => {
        payloads.push({
          inwardid: inwardId,
          instid: instId,
          calibrationpoint: calibrationPointId,
          type: 'uuc',
          repeatable: obsIdx.toString(),
          value: rowData[colIdx] || '0',
        });
      });
      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: 'averageuuc',
        repeatable: '0',
        value: calculated.average || '0',
      });
      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: 'error',
        repeatable: '0',
        value: calculated.error || '0',
      });
      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: 'hysterisis',
        repeatable: '0',
        value: rowData[7] || calculated.hysteresis || '0',
      });
    } else if (selectedTableData.id === 'observationctg') {
      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: 'uuc',
        repeatable: '0',
        value: rowData[1] || '0',
      });
      [2, 3, 4, 5, 6].forEach((colIdx, obsIdx) => {
        payloads.push({
          inwardid: inwardId,
          instid: instId,
          calibrationpoint: calibrationPointId,
          type: 'master',
          repeatable: obsIdx.toString(),
          value: rowData[colIdx] || '0',
        });
      });
      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: 'averageuuc',
        repeatable: '0',
        value: calculated.average || '0',
      });
      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: 'error',
        repeatable: '0',
        value: calculated.error || '0',
      });
    }

    try {
      for (const payload of payloads) {
        await axios.post(
          `${JWT_HOST_API}/calibrationprocess/set-observations`,
          payload,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }

      console.log(`Row [${rowIndex}] saved successfully!`);
      toast.success(`Row ${rowIndex + 1} saved successfully!`);

      await refetchObservations();
    } catch (err) {
      console.error(`Network error for row [${rowIndex}]:`, err);
      toast.error(err.response?.data?.message || 'Failed to save row data');
    }
  };

  const handleBackToInwardList = () => {
    navigate(
      `/dashboards/calibration-process/inward-entry-lab?caliblocation=${caliblocation}&calibacc=${calibacc}`
    );
  };

  const handleBackToPerformCalibration = () => {
    navigate(
      `/dashboards/calibration-process/inward-entry-lab/perform-calibration/${id}?caliblocation=${caliblocation}&calibacc=${calibacc}`
    );
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const renderThermalCoefficientSection = () => {
    if (!selectedTableData?.structure?.thermalCoeff) return null;

    return (
      <div className="mb-6">
        <h3 className="text-md font-medium text-gray-800 dark:text-white mb-2">Thermal Coefficient</h3>
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded border border-gray-200 dark:border-gray-600">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                UUC Thermal Coefficient:
              </label>
              <input
                type="text"
                value={thermalCoeff.uuc}
                onChange={(e) => setThermalCoeff((prev) => ({ ...prev, uuc: e.target.value }))}
                onBlur={(e) => handleThermalCoeffBlur('thermalcoffuuc', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                placeholder="Enter UUC thermal coefficient"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Master Thermal Coefficient:
              </label>
              <input
                type="text"
                value={thermalCoeff.master}
                onChange={(e) => setThermalCoeff((prev) => ({ ...prev, master: e.target.value }))}
                onBlur={(e) => handleThermalCoeffBlur('thermalcoffmaster', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                placeholder="Enter master thermal coefficient"
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please correct the validation errors before submitting.');
      return;
    }

    const token = localStorage.getItem('authToken');
    const calibrationPoints = [];
    const types = [];
    const repeatables = [];
    const values = [];

    // Get the calibration point ID from the first row (if available)
    const firstRowCalibPointId = selectedTableData.hiddenInputs?.calibrationPoints?.[0] || '1';

    // Add thermal coefficient values at specific indices (first and second positions)
    // using the same calibration point ID as the first row
    if (selectedTableData.id === 'observationctg') {
      // Add UUC thermal coefficient at index 0
      calibrationPoints.push(firstRowCalibPointId);
      types.push('thermalcoffuuc');
      repeatables.push('0');
      values.push(thermalCoeff.uuc || '0');

      // Add master thermal coefficient at index 1
      calibrationPoints.push(firstRowCalibPointId);
      types.push('thermalcoffmaster');
      repeatables.push('0');
      values.push(thermalCoeff.master || '0');

      // Add thickness of graduation if available
      if (thermalCoeff.thickness_of_graduation) {
        calibrationPoints.push(firstRowCalibPointId);
        types.push('thicknessgraduation');
        repeatables.push('0');
        values.push(thermalCoeff.thickness_of_graduation || '0');
      }
    }

    selectedTableData.staticRows.forEach((row, rowIndex) => {
      const calibPointId = selectedTableData.hiddenInputs?.calibrationPoints?.[rowIndex] || '';

      // Get row data with input values
      const rowData = row.map((cell, idx) => {
        const inputKey = `${rowIndex}-${idx}`;
        return tableInputValues[inputKey] ?? (cell?.toString() || '');
      });

      // Calculate values
      const calculated = calculateRowValues(rowData, selectedTableData.id);

      // Add input and calculated values to payload
      if (selectedTableData.id === 'observationdpg') {
        calibrationPoints.push(calibPointId);
        types.push('uuc');
        repeatables.push('0');
        values.push(rowData[1] || '0'); // Set Pressure UUC

        calibrationPoints.push(calibPointId);
        types.push('calculatedmaster');
        repeatables.push('0');
        values.push(rowData[2] || '0'); // Set Pressure Master (nominal value)

        // Observations M1, M2, M3
        [3, 4, 5].forEach((colIndex, obsIndex) => {
          calibrationPoints.push(calibPointId);
          types.push('uuc');
          repeatables.push(obsIndex.toString());
          values.push(rowData[colIndex] || '0');
        });

        calibrationPoints.push(calibPointId);
        types.push('averageuuc');
        repeatables.push('0');
        values.push(calculated.average || '0');

        calibrationPoints.push(calibPointId);
        types.push('error');
        repeatables.push('0');
        values.push(calculated.error || '0');

        calibrationPoints.push(calibPointId);
        types.push('hysterisis');
        repeatables.push('0');
        values.push(rowData[9] || calculated.hysteresis || '0');
      } else if (selectedTableData.id === 'observationodfm') {
        calibrationPoints.push(calibPointId);
        types.push('range');
        repeatables.push('0');
        values.push(rowData[1] || '0'); // Range

        calibrationPoints.push(calibPointId);
        types.push('master'); // Changed from 'uuc' to 'master' for nominal value
        repeatables.push('0');
        values.push(rowData[2] || '0'); // Nominal Value

        // Observations 1-5
        [5, 6, 7, 8, 9].forEach((colIndex, obsIndex) => {
          calibrationPoints.push(calibPointId);
          types.push('master');
          repeatables.push(obsIndex.toString());
          values.push(rowData[colIndex] || '0');
        });

        calibrationPoints.push(calibPointId);
        types.push('averageuuc');
        repeatables.push('0');
        values.push(calculated.average || '0');

        calibrationPoints.push(calibPointId);
        types.push('error');
        repeatables.push('0');
        values.push(calculated.error || '0');
      } else if (selectedTableData.id === 'observationapg') {
        calibrationPoints.push(calibPointId);
        types.push('uuc');
        repeatables.push('0');
        values.push(rowData[1] || '0'); // Set Pressure UUC

        calibrationPoints.push(calibPointId);
        types.push('master'); // Changed from 'calculatedmaster' to 'master' for nominal value
        repeatables.push('0');
        values.push(rowData[2] || '0'); // Set Pressure Master (nominal value)

        // Observations M1, M2
        [3, 4].forEach((colIndex, obsIndex) => {
          calibrationPoints.push(calibPointId);
          types.push('uuc');
          repeatables.push(obsIndex.toString());
          values.push(rowData[colIndex] || '0');
        });

        calibrationPoints.push(calibPointId);
        types.push('averageuuc');
        repeatables.push('0');
        values.push(calculated.average || '0');

        calibrationPoints.push(calibPointId);
        types.push('error');
        repeatables.push('0');
        values.push(calculated.error || '0');

        calibrationPoints.push(calibPointId);
        types.push('hysterisis');
        repeatables.push('0');
        values.push(rowData[7] || calculated.hysteresis || '0');
      } else if (selectedTableData.id === 'observationctg') {
        calibrationPoints.push(calibPointId);
        types.push('master'); // Changed from 'uuc' to 'master' for nominal value
        repeatables.push('0');
        values.push(rowData[1] || '0'); // Nominal Value

        // Observations 1-5
        [2, 3, 4, 5, 6].forEach((colIndex, obsIndex) => {
          calibrationPoints.push(calibPointId);
          types.push('uuc');
          repeatables.push(obsIndex.toString());
          values.push(rowData[colIndex] || '0');
        });

        calibrationPoints.push(calibPointId);
        types.push('averageuuc');
        repeatables.push('0');
        values.push(calculated.average || '0');

        calibrationPoints.push(calibPointId);
        types.push('error');
        repeatables.push('0');
        values.push(calculated.error || '0');
      }
    });

    const payloadStep3 = {
      inwardid: inwardId,
      instid: instId,
      caliblocation: formData.calibLocation || 'Lab',
      calibacc: formData.calibAcc || 'Nabl',
      tempend: formData.tempend,
      humiend: formData.humiend,
      notes: formData.notes,
      enddate: formData.enddate,
      duedate: formData.duedate,
      calibrationpoint: calibrationPoints,
      type: types,
      repeatable: repeatables,
      value: values,
    };

    console.log('➡ Step 3 Payload:', payloadStep3);

    try {
      const response = await axios.post(
        `${JWT_HOST_API}/calibrationprocess/insert-calibration-step3`,
        payloadStep3,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log('✅ Step 3 saved successfully:', response.data);
      toast.success('✅ All data submitted successfully!');
      setTimeout(() => {
        navigate(
          `/dashboards/calibration-process/inward-entry-lab/perform-calibration/${id}?caliblocation=${caliblocation}&calibacc=${calibacc}`
        );
      }, 1000);
    } catch (error) {
      console.error('❌ Network Error:', error);
      toast.error(error.response?.data?.message || 'Something went wrong while submitting');
    }
  };

  return (
    <Page title="CalibrateStep3">
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-4">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h1 className="text-xl font-medium text-gray-800 dark:text-white">Fill Dates</h1>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleBackToInwardList}
                  className="bg-indigo-500 hover:bg-fuchsia-500 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  ← Back to Inward Entry List
                </Button>
                <Button
                  variant="outline"
                  onClick={handleBackToPerformCalibration}
                  className="bg-indigo-500 hover:bg-fuchsia-500 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  ← Back to Perform Calibration
                </Button>
              </div>
            </div>

            <div className="p-6 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <div className="grid grid-cols-12 gap-4 text-sm">
                <div className="col-span-6 space-y-2">
                  <div className="flex">
                    <span className="w-48 font-medium text-gray-700 dark:text-gray-200">
                      Name Of The Equipment:
                    </span>
                    <span className="text-gray-900 dark:text-white">{instrument?.name || 'N/A'}</span>
                  </div>
                  <div className="text-blue-600 dark:text-blue-400 font-medium">
                    PRESSURE, MASS & VOLUME LAB<br />
                    Alloted Lab: {caliblocation}
                  </div>
                  <div className="flex">
                    <span className="w-48 font-medium text-gray-700 dark:text-gray-200">Make:</span>
                    <span className="text-gray-900 dark:text-white">{instrument?.make || 'N/A'}</span>
                  </div>
                  <div className="flex">
                    <span className="w-48 font-medium text-gray-700 dark:text-gray-200">Model:</span>
                    <span className="text-gray-900 dark:text-white">{instrument?.model || 'N/A'}</span>
                  </div>
                  <div className="flex">
                    <span className="w-48 font-medium text-gray-700 dark:text-gray-200">SR no:</span>
                    <span className="text-gray-900 dark:text-white">{instrument?.serialno || 'N/A'}</span>
                  </div>
                  <div className="flex">
                    <span className="w-48 font-medium text-gray-700 dark:text-gray-200">Id no:</span>
                    <span className="text-gray-900 dark:text-white">{instrument?.idno || 'N/A'}</span>
                  </div>
                  <div className="flex">
                    <span className="w-48 font-medium text-gray-700 dark:text-gray-200">Calibrated On:</span>
                    <span className="text-gray-900 dark:text-white">{instrument?.startdate || 'N/A'}</span>
                  </div>
                  <div className="flex">
                    <span className="w-48 font-medium text-gray-700 dark:text-gray-200">Issue Date:</span>
                    <span className="text-gray-900 dark:text-white">{instrument?.issuedate || 'N/A'}</span>
                  </div>
                </div>
                <div className="col-span-6 space-y-2">
                  <div className="flex">
                    <span className="w-32 font-medium text-gray-700 dark:text-gray-200">BRN No:</span>
                    <span className="text-gray-900 dark:text-white">{instrument?.bookingrefno || 'N/A'}</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 font-medium text-gray-700 dark:text-gray-200">Receive Date:</span>
                    <span className="text-gray-900 dark:text-white">
                      {inwardEntry?.sample_received_on || 'N/A'}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="w-32 font-medium text-gray-700 dark:text-gray-200">Range:</span>
                    <span className="text-gray-900 dark:text-white">{instrument?.equipmentrange || 'N/A'}</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 font-medium text-gray-700 dark:text-gray-200">Least Count:</span>
                    <span className="text-gray-900 dark:text-white">{instrument?.leastcount || 'N/A'}</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 font-medium text-gray-700 dark:text-gray-200">Condition Of UUC:</span>
                    <span className="text-gray-900 dark:text-white">
                      {instrument?.conditiononrecieve || 'N/A'}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="w-32 font-medium text-gray-700 dark:text-gray-200">
                      Calibration performed At:
                    </span>
                    <span className="text-gray-900 dark:text-white">{instrument?.performedat || 'Lab'}</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 font-medium text-gray-700 dark:text-gray-200">Temperature (°C):</span>
                    <span className="text-gray-900 dark:text-white">{instrument?.temperature || 'N/A'}</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 font-medium text-gray-700 dark:text-gray-200">Humidity (%RH):</span>
                    <span className="text-gray-900 dark:text-white">{instrument?.humidity || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <h2 className="text-lg font-medium text-gray-800 dark:text-white mb-4">Masters</h2>
              <div className="mb-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse border border-gray-300 dark:border-gray-600">
                    <thead>
                      <tr className="bg-gray-100 dark:bg-gray-700">
                        <th className="p-2 border border-gray-300 dark:border-gray-600 font-medium text-left text-gray-800 dark:text-white">
                          Reference Standard
                        </th>
                        <th className="p-2 border border-gray-300 dark:border-gray-600 font-medium text-left text-gray-800 dark:text-white">
                          S.w/o
                        </th>
                        <th className="p-2 border border-gray-300 dark:border-gray-600 font-medium text-left text-gray-800 dark:text-white">
                          LD.No.
                        </th>
                        <th className="p-2 border border-gray-300 dark:border-gray-600 font-medium text-left text-gray-800 dark:text-white">
                          Certificate No.
                        </th>
                        <th className="p-2 border border-gray-300 dark:border-gray-600 font-medium text-left text-gray-800 dark:text-white">
                          Valid Upto
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {masters && masters.length > 0 ? (
                        masters.map((item, index) => (
                          <tr key={index} className="dark:bg-gray-800">
                            <td className="p-2 border border-gray-300 dark:border-gray-600 dark:text-white">
                              {item.name}
                            </td>
                            <td className="p-2 border border-gray-300 dark:border-gray-600 dark:text-white">
                              {item.serialno}
                            </td>
                            <td className="p-2 border border-gray-300 dark:border-gray-600 dark:text-white">
                              {item.idno}
                            </td>
                            <td className="p-2 border border-gray-300 dark:border-gray-600 dark:text-white">
                              {item.certificateno}
                            </td>
                            <td className="p-2 border border-gray-300 dark:border-gray-600 dark:text-white">
                              {item.enddate}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan="5"
                            className="p-2 border border-gray-300 dark:border-gray-600 text-center dark:text-white"
                          >
                            No data available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mb-6">
                <h2 className="text-md font-medium text-gray-800 dark:text-white mb-2">Support masters</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse border border-gray-300 dark:border-gray-600">
                    <thead>
                      <tr className="bg-gray-100 dark:bg-gray-700">
                        <th className="p-2 border border-gray-300 dark:border-gray-600 font-medium text-left text-gray-800 dark:text-white">
                          Reference Standard
                        </th>
                        <th className="p-2 border border-gray-300 dark:border-gray-600 font-medium text-left text-gray-800 dark:text-white">
                          S.w/o
                        </th>
                        <th className="p-2 border border-gray-300 dark:border-gray-600 font-medium text-left text-gray-800 dark:text-white">
                          LD.No.
                        </th>
                        <th className="p-2 border border-gray-300 dark:border-gray-600 font-medium text-left text-gray-800 dark:text-white">
                          Certificate No.
                        </th>
                        <th className="p-2 border border-gray-300 dark:border-gray-600 font-medium text-left text-gray-800 dark:text-white">
                          Valid Upto
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {supportMasters && supportMasters.length > 0 ? (
                        supportMasters.map((item, index) => (
                          <tr key={index} className="dark:bg-gray-800">
                            <td className="p-2 border border-gray-300 dark:border-gray-600 dark:text-white">
                              {item.name}
                            </td>
                            <td className="p-2 border border-gray-300 dark:border-gray-600 dark:text-white">
                              {item.serialno}
                            </td>
                            <td className="p-2 border border-gray-300 dark:border-gray-600 dark:text-white">
                              {item.idno}
                            </td>
                            <td className="p-2 border border-gray-300 dark:border-gray-600 dark:text-white">
                              {item.certificateno}
                            </td>
                            <td className="p-2 border border-gray-300 dark:border-gray-600 dark:text-white">
                              {item.enddate}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan="5"
                            className="p-2 border border-gray-300 dark:border-gray-600 text-center dark:text-white"
                          >
                            No data available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {renderThermalCoefficientSection()}

              <div className="mb-6">
                <h2 className="text-md font-medium text-gray-800 dark:text-white mb-4">Observation Detail</h2>
                {observationTemplate && (
                  <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-3 mb-4">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      <strong>Current Observation Template:</strong> {observationTemplate}
                    </p>
                  </div>
                )}

                {selectedTableData && tableStructure && (
                  <div className="overflow-x-auto border border-gray-200 dark:border-gray-600">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-100 dark:bg-gray-700 border-b border-gray-300 dark:border-gray-600">
                          {tableStructure.headers.map((header, index) => (
                            <th
                              key={index}
                              colSpan={header.colspan}
                              className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider border-r border-gray-300 dark:border-gray-600 last:border-r-0"
                            >
                              {header.name}
                            </th>
                          ))}
                        </tr>
                        {tableStructure.subHeadersRow.some((item) => item !== null) && (
                          <tr className="bg-gray-50 dark:bg-gray-600 border-b border-gray-300 dark:border-gray-600">
                            {tableStructure.subHeadersRow.map((subHeader, index) => (
                              <th
                                key={index}
                                className="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-300 border-r border-gray-300 dark:border-gray-600 last:border-r-0"
                              >
                                {subHeader}
                              </th>
                            ))}
                          </tr>
                        )}
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {(selectedTableData.staticRows?.length > 0
                          ? selectedTableData.staticRows
                          : [Array(tableStructure.subHeadersRow.length).fill('')]
                        ).map((row, rowIndex) => (
                          <tr key={rowIndex} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            {row.map((cell, colIndex) => {
                              const key = `${rowIndex}-${colIndex}`;
                              const currentValue = tableInputValues[key] ?? (cell?.toString() || '');

                              // Determine if the column should be disabled
                              const isDisabled =
                                colIndex === 0 ||
                                (selectedTableData.id === 'observationodfm' && colIndex === 2) ||
                                (selectedTableData.id === 'observationctg' && colIndex === 1) ||
                                (selectedTableData.id === 'observationdpg' && colIndex === 1) ||
                                (selectedTableData.id === 'observationapg' && colIndex === 1) ||
                                (selectedTableData.id === 'observationdpg' &&
                                  [6, 7, 9].includes(colIndex)) ||
                                (selectedTableData.id === 'observationodfm' &&
                                  [3, 4].includes(colIndex)) ||
                                (selectedTableData.id === 'observationapg' &&
                                  [5, 6, 7].includes(colIndex)) ||
                                (selectedTableData.id === 'observationctg' &&
                                  [7, 8].includes(colIndex));

                              return (
                                <td
                                  key={colIndex}
                                  className="px-3 py-2 whitespace-nowrap text-sm border-r border-gray-200 dark:border-gray-600 last:border-r-0"
                                >
                                  {selectedTableData.id === 'observationctg' && colIndex >= 2 && colIndex <= 6 && currentValue === '' ? (
                                    <div className="w-full px-2 py-1 invisible">&nbsp;</div>  // Invisible placeholder to maintain table structure
                                  ) : (
                                    <input
                                      type="text"
                                      className={`w-full px-2 py-1 border border-gray-200 dark:border-gray-600 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-600 text-gray-900 dark:text-white ${isDisabled ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : ''
                                        }`}
                                      value={currentValue}
                                      onChange={(e) => {
                                        if (isDisabled) return;
                                        handleInputChange(rowIndex, colIndex, e.target.value);
                                      }}
                                      onBlur={(e) => {
                                        if (isDisabled) return;
                                        if (selectedTableData.id === 'observationctg') {
                                          handleObservationBlur(rowIndex, colIndex, e.target.value);
                                        } else {
                                          handleRowSave(rowIndex);
                                        }
                                      }}
                                      disabled={isDisabled}
                                    />
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {observationTemplate && observations.length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <p>No observations found for template: {observationTemplate}</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Temperature End (°C) <span className="text-red-500">*</span>:
                  </label>
                  <input
                    type="text"
                    name="tempend"
                    value={formData.tempend}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                    placeholder="Enter temperature range"
                    required
                  />
                  {errors.tempend && <p className="text-red-500 text-xs mt-1">{errors.tempend}</p>}
                  {temperatureRange && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Range:{' '}
                      {temperatureRange.min
                        ? `${temperatureRange.min} - ${temperatureRange.max}`
                        : temperatureRange.value || 'N/A'}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Humidity End (%RH) <span className="text-red-500">*</span>:
                  </label>
                  <input
                    type="text"
                    name="humiend"
                    value={formData.humiend}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                    placeholder="Enter humidity range"
                    required
                  />
                  {errors.humiend && <p className="text-red-500 text-xs mt-1">{errors.humiend}</p>}
                  {humidityRange && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Range:{' '}
                      {humidityRange.min
                        ? `${humidityRange.min} - ${humidityRange.max}`
                        : humidityRange.value || 'N/A'}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Calibration End Date/Done date:
                  </label>
                  <input
                    type="date"
                    name="enddate"
                    value={formData.enddate ? new Date(formData.enddate).toISOString().split('T')[0] : ''}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Suggested Due Date:
                  </label>
                  <input
                    type="date"
                    name="duedate"
                    value={formData.duedate ? new Date(formData.duedate).toISOString().split('T')[0] : ''}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Notes:</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleFormChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                  placeholder="Enter notes"
                />
              </div>

              <div className="flex justify-end mt-8 mb-4">
                <Button
                  type="submit"
                  className="bg-green-500 hover:bg-green-600 text-white px-8 py-2 rounded font-medium transition-colors"
                >
                  Submit
                </Button>
              </div>
            </form>
          </div>

          <div className="flex items-center justify-between px-6 pb-6">
            <div className="flex-1 mx-4">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: '75%' }}
                ></div>
              </div>
            </div>
            <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
              ›
            </button>
          </div>
        </div>
      </div>
    </Page>
  );
};

export default CalibrateStep3;