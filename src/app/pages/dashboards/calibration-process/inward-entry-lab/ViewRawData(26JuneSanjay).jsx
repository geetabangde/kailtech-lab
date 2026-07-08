import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from "components/ui";
import { useNavigate, useParams, useSearchParams } from "react-router";
import axios from 'axios';
import { toast } from "sonner";
import { JWT_HOST_API } from 'configs/auth.config';

export default function CalibrationReport() {
  const navigate = useNavigate();
  const { inwardid: pathInwardid, instid: pathInstid } = useParams();
  const [searchParams] = useSearchParams();

  // Extract parameters from multiple sources - CORRECTED ORDER
  const extractParams = () => {
    const currentUrl = window.location.href;
    console.log('Current URL:', currentUrl);

    // Method 1: From useParams (path parameters) - CORRECTED
    let inwardid = pathInwardid; // First parameter is inwardid
    let instid = pathInstid;     // Second parameter is instid

    // Method 2: From search params
    if (!instid) instid = searchParams.get("instid");
    if (!inwardid) inwardid = searchParams.get("inwardid");

    // Method 3: Extract from URL pattern manually - CORRECTED
    // URL pattern: view-rawdata/3661/50294 where 3661=inwardid, 50294=instid
    const urlMatch = currentUrl.match(/view-rawdata\/(\d+)\/(\d+)/);
    if (urlMatch) {
      if (!inwardid) inwardid = urlMatch[1]; // First number is inwardid
      if (!instid) instid = urlMatch[2];     // Second number is instid
    }

    // Method 4: Look for hakuna/matata pattern (from third image)
    const hakunaMatch = currentUrl.match(/hakuna=(\d+)/);
    const matataMatch = currentUrl.match(/matata=(\d+)/);
    if (hakunaMatch && !instid) instid = hakunaMatch[1];
    if (matataMatch && !inwardid) inwardid = matataMatch[1];

    return { instid, inwardid };
  };

  const { instid, inwardid } = extractParams();
  const caliblocation = searchParams.get("caliblocation") || "Lab";
  const calibacc = searchParams.get("calibacc") || "Nabl";

  console.log('Extracted Parameters:', { instid, inwardid, caliblocation, calibacc });

  // State management
  const [equipmentData, setEquipmentData] = useState({});
  const [calibratedByImageUrl, setCalibratedByImageUrl] = useState('');
  const [approvedByImageUrl, setApprovedByImageUrl] = useState('');
  const [masterData, setMasterData] = useState([]);
  const [results, setResults] = useState([]);
  const [observationData, setObservationData] = useState([]);
  const [observationType, setObservationType] = useState('');
  const [thermalCoeff, setThermalCoeff] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // New state for dynamic observation table
  const [dynamicObservations, setDynamicObservations] = useState([]);
  const [observationTemplate, setObservationTemplate] = useState('');
  const [tableStructure, setTableStructure] = useState(null);

  // ADDED: State for custom layouts from backend
  const [backendColumns, setBackendColumns] = useState(null);
  const [table1Columns, setTable1Columns] = useState([]);
  const [customLayout, setCustomLayout] = useState(null);
  const [masterInstId, setMasterInstId] = useState(null);
  const [observationCount, setObservationCount] = useState(5);
  const [loadedRepeatCount, setLoadedRepeatCount] = useState(null);

  // Fetch backend columns layout
  useEffect(() => {
    const fetchCustomLayout = async () => {
      if (!observationTemplate) return;

      const targetId = masterInstId || instid;
      if (!targetId) return;

      let resolvedFormatId = null;
      let fallbackLayout = null;

      // 1. Resolve formatId from observationTemplate suffix using /get-formate
      try {
        const suffix = observationTemplate === "observationexm"
          ? "exten"
          : observationTemplate.startsWith("observation")
            ? observationTemplate.replace("observation", "")
            : observationTemplate;

        const response = await axios.get(`${JWT_HOST_API}/get-formate`);

        if (response.data && Array.isArray(response.data.data)) {
          const match = response.data.data.find(
            (item) => item.description === suffix || item.description === observationTemplate
          );
          if (match) {
            resolvedFormatId = match.id;
          }
        }
      } catch (error) {
        console.error("Error resolving formatId in ViewRawData:", error);
      }

      // 2. Fetch layout from the dedicated format layout endpoint if formatId is resolved
      if (resolvedFormatId) {
        try {
          const response = await axios.get(
            `${JWT_HOST_API}/observationlayout/get-formate-layout/${targetId}`
          );
          const resData = response.data;
          if (resData && (resData.success || resData.status === "true" || resData.status === true)) {
            const dataVal = resData.data;
            if (dataVal) {
              let obsRepeat = null;
              if (dataVal.observation_repeat !== undefined && dataVal.observation_repeat !== null) {
                obsRepeat = dataVal.observation_repeat;
              } else if (Array.isArray(dataVal.columns) && dataVal.columns.length > 0 && dataVal.columns[0].observation_repeat !== undefined && dataVal.columns[0].observation_repeat !== null) {
                obsRepeat = dataVal.columns[0].observation_repeat;
              }
              if (obsRepeat !== null) {
                const repeatVal = parseInt(obsRepeat);
                setObservationCount(repeatVal);
                setLoadedRepeatCount(repeatVal);
              }
            }
            if (Array.isArray(dataVal)) {
              setBackendColumns(dataVal);
              return;
            } else if (dataVal && Array.isArray(dataVal.columns)) {
              let columnsArray = dataVal.columns;
              let t1Cols = [];
              let maxDepth = 0;
              if (columnsArray.length > 0 && typeof columnsArray[0].column_key === 'string' && 
                    (columnsArray[0].column_key.trim().startsWith('[') || columnsArray[0].column_key.trim().startsWith('{'))) {
                while (columnsArray.length > 0 && typeof columnsArray[0].column_key === 'string' && 
                      (columnsArray[0].column_key.trim().startsWith('[') || columnsArray[0].column_key.trim().startsWith('{')) &&
                      maxDepth < 5) {
                  try {
                    const parsed = JSON.parse(columnsArray[0].column_key);
                    if (Array.isArray(parsed)) {
                      columnsArray = parsed;
                    } else if (parsed && typeof parsed === 'object') {
                      if (Array.isArray(parsed.columns)) {
                        columnsArray = parsed.columns;
                      } else if (Array.isArray(parsed.column_key)) {
                        columnsArray = parsed.column_key;
                      }
                      if (Array.isArray(parsed.table1)) {
                        t1Cols = parsed.table1;
                      }
                    }
                    maxDepth++;
                  } catch (e) {
                    console.error("Failed to parse column_key string:", e);
                    break;
                  }
                }
              } else {
                if (Array.isArray(dataVal.table1)) {
                  t1Cols = dataVal.table1;
                }
              }
              setBackendColumns(columnsArray);
              setTable1Columns(t1Cols);
              return;
            }
          }
        } catch (error) {
          console.warn("Failed to fetch layout from new endpoint in ViewRawData, falling back...", error);
        }
      }

      // 3. Fallback layout if the dedicated layout fetch failed/empty
      if (targetId) {
        try {
          const response = await axios.get(
            `${JWT_HOST_API}/observationsetting/get-observation-setting/${targetId}`
          );
          if (response.data.success && response.data.data?.resultsetting) {
            let resultsetting = response.data.data.resultsetting;
            if (typeof resultsetting === "string") {
              try {
                resultsetting = JSON.parse(resultsetting);
              } catch (e) {
                console.error("Failed to parse resultsetting string:", e);
              }
            }
            if (resultsetting?.custom_layout) {
              fallbackLayout = resultsetting.custom_layout;
            }
          }
        } catch (error) {
          console.error("Error fetching custom layout from fallback in ViewRawData:", error);
        }
      }

      if (fallbackLayout) {
        setCustomLayout(fallbackLayout);
      }
    };

    fetchCustomLayout();
  }, [masterInstId, instid, observationTemplate]);

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
          toast.error('Authentication failed. Please login again.');
        } else if (error.response?.status === 403) {
          console.error('Access forbidden. Insufficient permissions.');
          toast.error('Access forbidden. Insufficient permissions.');
        }
        return Promise.reject(error);
      }
    );
  }, []);

  // Helper functions
  const safeGetValue = useCallback((item) => {
    if (!item) return '';
    if (typeof item === 'object' && item !== null) {
      return item.value !== null && item.value !== undefined ? item.value : '';
    }
    return item.toString();
  }, []);

  const safeGetArray = useCallback((item, defaultLength = 0) => {
    if (!item) return Array(defaultLength).fill('');
    if (Array.isArray(item)) return item;
    if (typeof item === 'string') return [item];
    return Array(defaultLength).fill('');
  }, []);


  const currentObsCount = loadedRepeatCount !== null ? loadedRepeatCount : observationCount;

  const getObservationSubheaders = useCallback((templateId, count) => {
    switch (templateId) {
      case 'observationdpg':
      case 'observationavg':
      case 'observationmg':
      case 'observationapg':
        return Array.from({ length: count }, (_, i) => `M${i + 1}`);
      case 'observationppg':
        return Array.from({ length: count }, (_, i) => `M${i + 1} (${i % 2 === 0 ? '↑' : '↓'})`);
      case 'observationfg':
        return Array.from({ length: count }, (_, i) => `Observation ${i + 1} (Master)`);
      case 'observationodfm':
        return Array.from({ length: count }, (_, i) => `Observation ${i + 1} (Master Unit)`);
      default:
        return Array.from({ length: count }, (_, i) => `Observation ${i + 1}`);
    }
  }, []);

  const observationTables = useMemo(() => [
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
          'OBSERVATION ON UUC': getObservationSubheaders('observationdpg', currentObsCount),
        },
        remainingHeaders: ['MEAN (UUCUNIT)', 'ERROR (UUCUNIT)', 'REPEATABILITY (UUCUNIT)', 'HYSTERISIS (UUCUNIT)'],
      },
    },
    {
      id: 'observationppg',
      name: 'Observation PPG',
      category: 'Pressure',
      structure: {
        singleHeaders: [
          'SR NO',
          'SET PRESSURE ON UUC (CALCULATIONUNIT)',
          '[SET PRESSURE ON UUC (MASTERUNIT)]',
        ],
        subHeaders: {
          'OBSERVATION ON UUC': getObservationSubheaders('observationppg', currentObsCount),
        },
        remainingHeaders: ['MEAN (UUCUNIT)', 'ERROR (UUCUNIT)', 'REPEATABILITY (UUCUNIT)', 'HYSTERISIS (UUCUNIT)'],
      },
    },
    {
      id: 'observationavg',
      name: 'Observation AVG',
      category: 'Pressure',
      structure: {
        singleHeaders: [
          'Sr no',
          'Set Pressure on UUC (UUC Unit)',
          '[Set Pressure on UUC (Master Unit)]'
        ],
        subHeaders: {
          'Observation on Master': getObservationSubheaders('observationavg', currentObsCount)
        },
        remainingHeaders: [
          'Mean (Master Unit)',
          'Error (Master Unit)',
          'Hysteresis (Master Unit)'
        ]
      },
    },
    {
      id: 'observationexm',
      name: 'Observation EXM',
      category: 'External Micrometer',
      structure: {
        thermalCoeff: true,
        singleHeaders: ['Sr. No.', 'Nominal/ Set Value'],
        subHeaders: {
          'Observation on UUC': getObservationSubheaders('observationexm', currentObsCount)
        },
        remainingHeaders: ['Average', 'Error']
      },
    },
    {
      id: 'observationmm',
      name: 'Observation MM',
      category: 'Multimeter',
      structure: {
        singleHeaders: ['Sr. No.', 'Mode', 'Range', 'Nominal/ Set Value on master (Calculated)', 'Nominal/ Set Value on master'],
        subHeaders: {
          'Observation on UUC': getObservationSubheaders('observationmm', currentObsCount)
        },
        remainingHeaders: ['Average', 'Error']
      },
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

        ],
        subHeaders: {
          'Observation on UUC': getObservationSubheaders('observationodfm', currentObsCount),
        },
        remainingHeaders: ['Average (Master Unit)',
          'Error (Master Unit)',],
      },
    },
    {
      id: 'observationapg',
      name: 'Observation APG',
      category: 'Pressure',
      structure: {
        singleHeaders: ['Sr no', 'Set Pressure on UUC (kg/cm²)', 'Set Pressure on UUC (bar)'],
        subHeaders: {
          'Observations on Master (bar)': getObservationSubheaders('observationapg', currentObsCount),
        },
        remainingHeaders: ['Mean (bar)', 'Error (bar)', 'Hysterisis (bar)'],
      },
    },
    {
      id: 'observationctg',
      name: 'Observation CTG',
      category: 'Temperature',
      structure: {
        thermalCoeff: true,
        singleHeaders: ['Sr. No.', 'Nominal Value'],
        subHeaders: {
          'Observation on UUC': getObservationSubheaders('observationctg', currentObsCount),
        },
        remainingHeaders: ['Average', 'Error'],
      },
    },
    {
      id: 'observationit',
      name: 'Observation IT',
      category: 'Internal Thread',
      structure: {
        thermalCoeff: true,
        singleHeaders: ['Sr. No.', 'Nominal/ Set Value'],
        subHeaders: {
          'Observation on UUC': getObservationSubheaders('observationit', currentObsCount)
        },
        remainingHeaders: ['Average', 'Error']
      },
    },
    {
      id: 'observationmt',
      name: 'Observation MT',
      category: 'Measuring Tool',
      structure: {
        thermalCoeff: true,
        additionalFields: ['Thickness of graduation Line'],
        singleHeaders: ['Sr. No.', 'Nominal/ Set Value'],
        subHeaders: {
          'Observation on UUC': getObservationSubheaders('observationmt', currentObsCount)
        },
        remainingHeaders: ['Average', 'Error']
      },
    },
    {
      id: 'observationmg',
      name: 'Observation MG',
      category: 'Manometer',
      structure: {
        singleHeaders: [
          'Sr no',
          'Set Pressure on UUC ([unit])',
          '[Set Pressure on UUC ([master unit])]'
        ],
        subHeaders: {
          'Observation on UUC': getObservationSubheaders('observationmg', currentObsCount)
        },
        remainingHeaders: [
          'Mean ([master unit])',
          'Error ([master unit])',
          'Hysterisis ([master unit])'
        ]
      },
    },
    {
      id: 'observationfg',
      name: 'Observation FG',
      category: 'Force Gauge',
      structure: {
        thermalCoeff: true,
        singleHeaders: ['Sr. No.', 'Nominal Value'],
        subHeaders: {
          'Observation on UUC': getObservationSubheaders('observationfg', currentObsCount)
        },
        remainingHeaders: ['Average (Master)', 'Error']
      },
    },
    {
      id: 'observationhg',
      name: 'Observation HG',
      category: 'Height Gauge',
      structure: {
        thermalCoeff: true,
        singleHeaders: ['Sr. No.', 'Nominal/ Set Value'],
        subHeaders: {
          'Observation on UUC': getObservationSubheaders('observationhg', currentObsCount)
        },
        remainingHeaders: ['Average', 'Error']
      }
    },
    {
      id: 'observationrtdwi',
      name: 'Observation RTD WI',
      category: 'RTD',
      structure: {
        singleHeaders: ['Sr. No.', 'Set Point (°C)', 'Value Of', 'Unit', 'Sensitivity Coefficient'],
        subHeaders: {
          'Observation': getObservationSubheaders('observationrtdwi', currentObsCount)
        },
        remainingHeaders: ['Average', 'mV generated On ambient', 'Average with corrected mv', 'Average (°C)', 'Deviation (°C)'] // REORDERED
      },
    },
    {
      id: 'observationmsr',
      name: 'Observation MSR',
      category: 'Measuring',
      structure: {
        thermalCoeff: true,
        singleHeaders: ['Sr. No.', 'Nominal/ Set Value'],
        subHeaders: {
          'Observation on UUC': getObservationSubheaders('observationmsr', currentObsCount)
        },
        remainingHeaders: ['Average', 'Error']
      },
    },
    {
      id: 'observationgtm',
      name: 'Observation GTM',
      category: 'Temperature',
      structure: {
        singleHeaders: ['Sr. No.', 'Set Point (°C)', 'Value Of', 'Range', 'Unit', 'Sensitivity Coefficient'],
        subHeaders: {
          'Observation': getObservationSubheaders('observationgtm', currentObsCount)
        },
        remainingHeaders: ['Average (Ω)', 'Average (°C)', 'Deviation (°C)']
      },
    },
    {
      id: 'observationdg',
      name: 'Observation DG',
      category: 'Digital Gauge',
      structure: {
        thermalCoeff: true,
        singleHeaders: ['Sr no', 'Nominal Value (Master Unit)'],
        subHeaders: {
          'Set 1': ['Set 1 Forward Reading', 'Set 1 Backward Reading'],
          'Set 2': ['Set 2 Forward Reading', 'Set 2 Backward Reading'],
          'Average (mm)': ['Average Forward Reading', 'Average Backward Reading'],
          'Error (mm)': ['Error Forward Reading', 'Error Backward Reading']
        },
        remainingHeaders: ['Hysterisis']
      },
    },
  ], [currentObsCount, getObservationSubheaders]);


  const createObservationRows = useCallback((observationData, template, count = 5, backendCols = null) => {
    if (!observationData) return { rows: [], unitTypes: [] };

    let dataArray = [];
    let unitTypes = [];

    const customCols = backendCols ? backendCols.filter(c => c.fetched_value === 'new' || c.is_custom === 1) : [];

    if (Array.isArray(observationData)) {
      dataArray = observationData;
    } else if (typeof observationData === 'object' && observationData !== null) {
      if (observationData.data && Array.isArray(observationData.data)) {
        dataArray = observationData.data;
      } else if (observationData.points && Array.isArray(observationData.points)) {
        dataArray = observationData.points;
      } else if (observationData.calibration_points && Array.isArray(observationData.calibration_points)) {
        dataArray = observationData.calibration_points;
      } else {
        dataArray = [observationData];
      }
    }

    const rows = [];

    if (template === 'observationdpg') {
      dataArray.forEach((obs) => {
        if (!obs) return;
        const obsList = Array.from({ length: count }, (_, i) => {
          const key = `m${i + 1}`;
          return safeGetValue(obs.master_readings?.[key] || obs[key]);
        });
        const row = [
          obs.sr_no?.toString() || '',
          safeGetValue(obs.uuc_value || obs.set_pressure_uuc),
          safeGetValue(obs.converted_uuc_value || obs.set_pressure_master),
          ...obsList,
          safeGetValue(obs.average_master || obs.mean),
          safeGetValue(obs.error),
          safeGetValue(obs.repeatability),
          safeGetValue(obs.hysterisis || obs.hysteresis),
        ];
        rows.push(row);
      });
    } else if (template === 'observationppg') {
      dataArray.forEach((obs) => {
        if (!obs) return;
        const row = [
          obs.sr_no?.toString() || '',
          safeGetValue(obs.uuc_value),
          safeGetValue(obs.converted_uuc_value),
          safeGetValue(obs.master_readings?.m1),
          safeGetValue(obs.master_readings?.m2),
          safeGetValue(obs.master_readings?.m3),
          safeGetValue(obs.master_readings?.m4),
          safeGetValue(obs.master_readings?.m5),
          safeGetValue(obs.master_readings?.m6),
          safeGetValue(obs.average_master),
          safeGetValue(obs.error),
          safeGetValue(obs.repeatability),
          safeGetValue(obs.hysterisis || obs.hysteresis),
        ];
        rows.push(row);
      });
    } else if (template === 'observationavg') {
      dataArray.forEach((point) => {
        if (!point) return;

        const row = [
          point.sr_no?.toString() || '',
          safeGetValue(point.set_point_uuc),
          safeGetValue(point.calculated_uuc),
          safeGetValue(point.master_readings?.[0]),
          safeGetValue(point.master_readings?.[1]),
          safeGetValue(point.average_master),
          safeGetValue(point.error),
          safeGetValue(point.hysteresis),
        ];

        customCols.forEach(col => {
          row.push(safeGetValue(point[col.column_key]));
        });

        console.log('✅ AVG Row created:', row);

        rows.push(row);
      });
    } else if (template === 'observationexm') {
      dataArray.forEach((point) => {
        if (!point) return;

        // Extract observations safely - ensure we have exactly 5 observations
        const observations = safeGetArray(point.observations, count);

        // Ensure we have exactly 5 observation values
        while (observations.length < count) {
          observations.push('');
        }

        const row = [
          point.sr_no?.toString() || '',
          safeGetValue(point.nominal_value || point.test_point),
          ...observations.slice(0, count).map(obs => safeGetValue(obs)),
          safeGetValue(point.average),
          safeGetValue(point.error),
        ];

        // Ensure consistent row length
        while (row.length < 8) {
          row.push('');
        }

        customCols.forEach(col => {
          row.push(safeGetValue(point[col.column_key]));
        });

        console.log('✅ EXM Row created:', row);

        rows.push(row);
      });
    } else if (template === 'observationmm') {
      console.log('🔄 Creating MM observation rows from:', dataArray);

      // Handle MM structure with unit types - SAME AS CALIBRATE STEP 3
      dataArray.forEach((unitTypeGroup) => {
        if (!unitTypeGroup || !unitTypeGroup.calibration_points) return;

        console.log('📋 Processing MM unit type group:', unitTypeGroup.unit_type);

        // Store unit type info for rendering
        unitTypes.push(unitTypeGroup);

        unitTypeGroup.calibration_points.forEach((point, pointIndex) => {
          if (!point) return;

          // Extract observations safely - SAME AS CALIBRATE STEP 3
          const observations = [];
          if (point.observations && Array.isArray(point.observations)) {
            for (let i = 0; i < count; i++) {
              observations.push(point.observations[i]?.value || '');
            }
          }

          // Ensure we have exactly 5 observations
          while (observations.length < count) {
            observations.push('');
          }

          const row = [
            point.sequence_number?.toString() || (pointIndex + 1).toString(),
            point.mode || 'Measure',
            point.range || '',
            // Calculated master value with unit
            (point.nominal_values?.calculated_master?.value || '') +
            (point.nominal_values?.calculated_master?.unit ? ' ' + point.nominal_values.calculated_master.unit : ''),
            // Master value with unit  
            (point.nominal_values?.master?.value || '') +
            (point.nominal_values?.master?.unit ? ' ' + point.nominal_values.master.unit : ''),
            ...observations,
            point.calculations?.average || '',
            point.calculations?.error || ''
          ];

          customCols.forEach(col => {
            row.push(safeGetValue(point[col.column_key]));
          });

          console.log(`✅ MM Row created for ${unitTypeGroup.unit_type}:`, row);
          rows.push(row);
        });
      });

      console.log('📊 Final MM rows:', rows.length, 'Unit Types:', unitTypes.length);
    } else if (template === 'observationodfm') {
      dataArray.forEach((point) => {
        if (!point) return;
        const observations = safeGetArray(point.observations, count);
        const row = [
          point.sr_no?.toString() || '',
          safeGetValue(point.range),
          safeGetValue(point.nominal_value || point.uuc_value),
          ...observations.slice(0, count).map((obs) => safeGetValue(obs)),
          safeGetValue(point.average),
          safeGetValue(point.error),
        ];
        customCols.forEach(col => {
          row.push(safeGetValue(point[col.column_key]));
        });
        rows.push(row);
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
        customCols.forEach(col => {
          row.push(safeGetValue(obs[col.column_key]));
        });
        rows.push(row);
      });
    } else if (template === 'observationctg') {
      dataArray.forEach((point) => {
        const observations = safeGetArray(point?.observations, count);
        const row = [
          point?.sr_no?.toString() || '',
          point?.nominal_value || '',
          ...observations.slice(0, count).map((obs) => safeGetValue(obs)),
          safeGetValue(point?.average),
          safeGetValue(point?.error),
        ];
        customCols.forEach(col => {
          row.push(safeGetValue(point[col.column_key]));
        });
        rows.push(row);
      });
    } else if (template === 'observationit') {
      dataArray.forEach((point) => {
        if (!point) return;
        const observations = safeGetArray(point.observations, count);
        const row = [
          point.sequence_number?.toString() || point.sr_no?.toString() || '',
          safeGetValue(point.nominal_value || point.test_point),
          ...observations.slice(0, count).map(obs => safeGetValue(obs)),
          safeGetValue(point.average),
          safeGetValue(point.error),
        ];
        while (row.length < 9) {
          row.push('');
        }
        customCols.forEach(col => {
          row.push(safeGetValue(point[col.column_key]));
        });
        rows.push(row);
      });
    } else if (template === 'observationmt') {
      dataArray.forEach((point) => {
        if (!point) return;

        // Extract observations safely
        const observations = safeGetArray(point.observations, count);

        const row = [
          point.sequence_number?.toString() || point.sr_no?.toString() || '',
          safeGetValue(point.nominal_value || point.test_point),
          ...observations.slice(0, count).map(obs => safeGetValue(obs)),
          safeGetValue(point.average),
          safeGetValue(point.error),
        ];

        // Ensure consistent row length
        while (row.length < 9) {
          row.push('');
        }

        customCols.forEach(col => {
          row.push(safeGetValue(point[col.column_key]));
        });

        rows.push(row);
      });
    } else if (template === 'observationmg') {
      dataArray.forEach((point) => {
        if (!point) return;

        const row = [
          point.sequence_number?.toString() || point.sr_no?.toString() || '',
          safeGetValue(point.set_pressure?.uuc_value || point.uuc_value),
          safeGetValue(point.set_pressure?.converted_value || point.converted_uuc_value || point.set_pressure?.uuc_value), // Use uuc_value if converted_value is null
          safeGetValue(point.observations?.master_1 || point.m1),
          safeGetValue(point.observations?.master_2 || point.m2),
          safeGetValue(point.calculations?.mean || point.mean || point.average_master),
          safeGetValue(point.calculations?.error || point.error),
          safeGetValue(point.calculations?.hysteresis || point.hysterisis || point.hysteresis),
        ];

        customCols.forEach(col => {
          row.push(safeGetValue(point[col.column_key]));
        });

        console.log('✅ MG Row created:', row);

        rows.push(row);
      });
    } else if (template === 'observationfg') {
      dataArray.forEach((point) => {
        if (!point) return;

        // Extract observations safely - ensure we have exactly 5 observations
        const observations = safeGetArray(point.observations, count);

        // Ensure we have exactly 5 observation values
        while (observations.length < count) {
          observations.push('');
        }

        const row = [
          point.sr_no?.toString() || '',
          safeGetValue(point.nominal_value || point.test_point),
          ...observations.slice(0, count).map(obs => safeGetValue(obs)),
          safeGetValue(point.average),
          safeGetValue(point.error),
        ];

        // Ensure consistent row length
        while (row.length < 8) {
          row.push('');
        }

        customCols.forEach(col => {
          row.push(safeGetValue(point[col.column_key]));
        });

        console.log('✅ FG Row created:', row);

        rows.push(row);
      });
    } else if (template === 'observationhg') {
      dataArray.forEach((point) => {
        if (!point) return;

        // Extract observations safely - ensure we have exactly 5 observations
        const observations = safeGetArray(point.observations, count);

        // Ensure we have exactly 5 observation values
        while (observations.length < count) {
          observations.push('');
        }

        const row = [
          point.sr_no?.toString() || '',
          safeGetValue(point.nominal_value || point.test_point),
          ...observations.slice(0, count).map(obs => safeGetValue(obs)),
          safeGetValue(point.average),
          safeGetValue(point.error),
        ];

        // Ensure consistent row length
        while (row.length < 8) {
          row.push('');
        }

        customCols.forEach(col => {
          row.push(safeGetValue(point[col.column_key]));
        });

        console.log('✅ HG Row created:', row);

        rows.push(row);
      });
    } else if (template === 'observationrtdwi') {
      // ADDED: Specific logic for observationrtdwi - SAME AS CALIBRATE STEP 3
      let pointsToProcess = [];

      if (observationData.calibration_points && Array.isArray(observationData.calibration_points)) {
        pointsToProcess = observationData.calibration_points;
      } else if (dataArray.length > 0) {
        pointsToProcess = dataArray;
      }

      pointsToProcess.forEach((point) => {
        if (!point) return;

        const srNo = point.sr_no?.toString() || '';
        const setPoint = safeGetValue(point.set_point);

        // UUC Row
        const uucReadings = safeGetArray(point.uuc_values, count);
        const uucRow = [
          srNo,                                           // 0: Sr. No.
          setPoint,                                       // 1: Set Point
          'UUC',                                         // 2: Value Of
          safeGetValue(point.unit),                      // 3: Unit
          safeGetValue(point.sensitivity_coefficient),   // 4: Sensitivity Coefficient
          ...uucReadings.slice(0, count).map(val => safeGetValue(val)), // 5-9: Observations 1-5
          safeGetValue(point.average_uuc),               // 10: Average (mV) - EDITABLE (but display-only here)
          safeGetValue(point.ambient_uuc),               // 11: mV generated On ambient (EDITABLE)
          safeGetValue(point.s_average_uuc),             // 12: Average with corrected mv (CALCULATED)
          safeGetValue(point.c_average_uuc),             // 13: Average (°C) - MOVED HERE
          safeGetValue(point.error),                     // 14: Deviation (°C) - EDITABLE (display-only)
        ];
        customCols.forEach(col => {
          uucRow.push(safeGetValue(point[col.column_key]));
        });
        rows.push(uucRow);

        // Master Row
        const masterReadings = safeGetArray(point.master_values, count);
        const masterRow = [
          '-',                                           // 0: Sr. No.
          '-',                                           // 1: Set Point
          'Master',                                      // 2: Value Of
          safeGetValue(point.master_unit),               // 3: Unit (display value, not ReactSelect)
          '-',                                           // 4: Sensitivity Coefficient
          ...masterReadings.slice(0, count).map(val => safeGetValue(val)), // 5-9: Observations 1-5
          safeGetValue(point.average_master),            // 10: Average (mV) - EDITABLE
          safeGetValue(point.ambient_master),            // 11: mV generated On ambient (EDITABLE)
          safeGetValue(point.s_average_master),          // 12: Average with corrected mv (CALCULATED)
          safeGetValue(point.c_average_master),          // 13: Average (°C) - MOVED HERE
          '-',                                           // 14: Deviation (°C) (dash for Master)
        ];
        customCols.forEach(col => {
          masterRow.push(safeGetValue(point[col.column_key]));
        });
        rows.push(masterRow);
      });
    } else if (template === 'observationmsr') {
      // ADDED: Specific logic for observationmsr - SAME AS CALIBRATE STEP 3
      dataArray.forEach((point) => {
        if (!point) return;

        // Extract observations safely - ensure we have exactly 5 observations
        const observations = safeGetArray(point.observations, count);

        // Ensure we have exactly 5 observation values
        while (observations.length < count) {
          observations.push('');
        }

        const row = [
          point.sr_no?.toString() || '',
          safeGetValue(point.nominal_value || point.uuc_value),
          ...observations.slice(0, count).map(obs => safeGetValue(obs)),
          safeGetValue(point.average),
          safeGetValue(point.error),
        ];

        // Ensure consistent row length
        while (row.length < 8) {
          row.push('');
        }

        customCols.forEach(col => {
          row.push(safeGetValue(point[col.column_key]));
        });

        console.log('✅ MSR Row created:', row);

        rows.push(row);
      });
    } else if (template === 'observationgtm') {
      // ADDED: Specific logic for observationgtm - SAME AS CALIBRATE STEP 3 (creates UUC + Master rows per point)
      dataArray.forEach((point) => {
        if (!point) return;

        const srNo = point.sr_no?.toString() || '';
        const setPoint = safeGetValue(point.set_point);
        const range = safeGetValue(point.range);

        // UUC Row
        const uucReadings = safeGetArray(point.uuc_values, count);
        const uucRow = [
          srNo,                                           // 0: Sr. No.
          setPoint,                                       // 1: Set Point
          'UUC',                                         // 2: Value Of (static)
          range,                                         // 3: Range
          safeGetValue(point.unit),                      // 4: Unit
          '-',                                           // 5: Sensitivity Coefficient (dash for UUC)
          ...uucReadings.slice(0, count).map(val => safeGetValue(val)), // 6-10: Observations 1-5
          '-',                                            // 11: Average (Ω) - dash for UUC
          safeGetValue(point.average_uuc),               // 12: Average (°C) - CALCULATED
          safeGetValue(point.error),                     // 13: Deviation (°C) - CALCULATED from UUC avg
        ];
        customCols.forEach(col => {
          uucRow.push(safeGetValue(point[col.column_key]));
        });
        rows.push(uucRow);

        // Master Row
        const masterReadings = safeGetArray(point.master_values, count);
        const masterRow = [
          '-',                                           // 0: Sr. No. (dash)
          '-',                                           // 1: Set Point (dash)
          'Master',                                      // 2: Value Of (static)
          '-',                                           // 3: Range (dash)
          safeGetValue(point.master_unit),               // 4: Unit (display value)
          safeGetValue(point.sensitivity_coefficient),   // 5: Sensitivity Coefficient
          ...masterReadings.slice(0, count).map(val => safeGetValue(val)), // 6-10: Observations 1-5
          safeGetValue(point.average_master),            // 11: Average (Ω) - EDITABLE
          safeGetValue(point.converted_average_master),  // 12: Average (°C) - EDITABLE
          '-',                                           // 13: Deviation (°C) - dash for Master
        ];
        customCols.forEach(col => {
          masterRow.push(safeGetValue(point[col.column_key]));
        });
        rows.push(masterRow);
      });
    } else if (template === 'observationdg') {
      // NEW: ADDED Specific logic for observationdg - ADAPTED FROM CALIBRATE STEP 3 (display-only, no hidden inputs)
      console.log('🔄 Creating DG observation rows from:', dataArray);

      dataArray.forEach((point) => {
        if (!point) return;

        const row = [
          point.sr_no?.toString() || '',                       // 0: Sr No
          safeGetValue(point.nominal_value_master),            // 1: Nominal Value (Master Unit)
          safeGetValue(point.set1_forward),                    // 2: Set 1 Forward
          safeGetValue(point.set1_backward),                   // 3: Set 1 Backward
          safeGetValue(point.set2_forward),                    // 4: Set 2 Forward
          safeGetValue(point.set2_backward),                   // 5: Set 2 Backward
          safeGetValue(point.average_forward),                 // 6: Average Forward
          safeGetValue(point.average_backward),                // 7: Average Backward
          safeGetValue(point.error_forward),                   // 8: Error Forward
          safeGetValue(point.error_backward),                  // 9: Error Backward
          safeGetValue(point.hysterisis)                       // 10: Hysterisis
        ];

        customCols.forEach(col => {
          row.push(safeGetValue(point[col.column_key]));
        });

        console.log('✅ DG Row created:', row);
        rows.push(row);
      });
    }

    return { rows, unitTypes };
  }, [safeGetValue, safeGetArray]);

  // Generate table structure function
  const generateTableStructure = useCallback((selectedTableData) => {
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
  }, []);

  const getDefaultLayout = useCallback((templateKey) => {
    const tableData = observationTables.find((table) => table.id === templateKey);
    if (!tableData || !tableData.structure) return null;

    const structure = tableData.structure;
    const cols = [];
    let idx = 0;

    structure.singleHeaders.forEach((header) => {
      cols.push({
        key: `col_${idx}`,
        originalIndex: idx,
        defaultName: header,
        headerName: header,
        group: null,
      });
      idx++;
    });

    if (structure.subHeaders && Object.keys(structure.subHeaders).length > 0) {
      Object.entries(structure.subHeaders).forEach(([groupName, subHeaders]) => {
        subHeaders.forEach((subHeader) => {
          cols.push({
            key: `col_${idx}`,
            originalIndex: idx,
            defaultName: subHeader,
            headerName: subHeader,
            group: groupName,
          });
          idx++;
        });
      });
    }

    if (structure.remainingHeaders && structure.remainingHeaders.length > 0) {
      structure.remainingHeaders.forEach((header) => {
        cols.push({
          key: `col_${idx}`,
          originalIndex: idx,
          defaultName: header,
          headerName: header,
          group: null,
        });
        idx++;
      });
    }

    return {
      lookupKey: templateKey,
      columns: cols,
    };
  }, [observationTables]);

  const reconstructLayout = useCallback((backendCols, templateKey) => {
    const defaultLayout = getDefaultLayout(templateKey);
    const sorted = [...backendCols].sort((a, b) => a.sort_order - b.sort_order);
    const reconstructed = [];
    
    // Check if the backend layout is fully dynamic (has actual keys like 'sr_no' instead of just 'col_X')
    const isFullyDynamic = sorted.some(col => col.column_key && !col.column_key.startsWith('col_') && col.fetched_value === 'old');

    if (isFullyDynamic) {
      sorted.forEach((bCol, idx) => {
        reconstructed.push({
          key: bCol.column_key,
          originalIndex: idx,
          defaultName: bCol.display_name,
          headerName: bCol.display_name,
          group: bCol.group_name !== undefined ? bCol.group_name : null,
          isCustom: bCol.fetched_value === 'new' || bCol.is_custom === 1
        });
      });
      return { lookupKey: templateKey, columns: reconstructed, isFullyDynamic: true };
    }

    if (!defaultLayout || !defaultLayout.columns) return null;
    const customCols = backendCols.filter(c => c.fetched_value === 'new' || c.is_custom === 1);

    sorted.forEach((bCol) => {
      const match = defaultLayout.columns.find((dCol) => dCol.key === bCol.column_key);
      if (match) {
        reconstructed.push({
          key: match.key,
          originalIndex: match.originalIndex,
          defaultName: match.defaultName,
          headerName: bCol.display_name,
          group: bCol.group_name !== undefined ? bCol.group_name : match.group,
        });
      } else if (bCol.fetched_value === 'new' || bCol.is_custom === 1) {
        // Handle new dynamic columns
        const customIdx = customCols.findIndex(c => c.column_key === bCol.column_key);
        reconstructed.push({
          key: bCol.column_key,
          originalIndex: defaultLayout.columns.length + customIdx,
          defaultName: bCol.display_name,
          headerName: bCol.display_name,
          group: bCol.group_name !== undefined ? bCol.group_name : null,
          isCustom: true
        });
      }
    });
    defaultLayout.columns.forEach((dCol) => {
      if (!reconstructed.some((rCol) => rCol.key === dCol.key)) {
        reconstructed.push(dCol);
      }
    });
    return { lookupKey: templateKey, columns: reconstructed, isFullyDynamic: false };
  }, [getDefaultLayout]);

  const getCustomTableStructure = useCallback(() => {
    if (!customLayout || !customLayout.columns) return null;

    const columns = customLayout.columns;
    const headers = [];
    const subHeadersRow = [];

    let i = 0;
    while (i < columns.length) {
      const col = columns[i];
      if (col.group === null) {
        headers.push({ name: col.headerName, colspan: 1 });
        subHeadersRow.push(null);
        i++;
      } else {
        const groupName = col.group;
        let count = 0;
        const subCols = [];
        while (i < columns.length && columns[i].group === groupName) {
          subCols.push(columns[i]);
          count++;
          i++;
        }
        headers.push({ name: groupName, colspan: count });
        subCols.forEach((subCol) => {
          subHeadersRow.push(subCol.headerName);
        });
      }
    }

    return { headers, subHeadersRow };
  }, [customLayout]);

  useEffect(() => {
    if (!observationTemplate) return;

    if (backendColumns && backendColumns.length > 0) {
      const reconstructed = reconstructLayout(backendColumns, observationTemplate);
      if (reconstructed) {
        setCustomLayout(reconstructed);
        return;
      }
    }
    setCustomLayout(getDefaultLayout(observationTemplate));
  }, [observationTemplate, backendColumns, reconstructLayout, getDefaultLayout, observationTables]);



  const fetchDynamicObservations = useCallback(async (observationTemplate) => {
    if (!observationTemplate || !instid || !inwardid) return;

    try {
      console.log('🔍 Fetching dynamic observations for template:', observationTemplate);

      const response = await axios.post(
        'https://kailtech.in/newlims/api/ob/get-observation',
        {
          fn: observationTemplate,
          instid: instid,
          inwardid: inwardid,
        }
      );

      const isSuccess = response.data.status === true || response.data.staus === true;

      if (isSuccess && response.data.data) {
        const observationData = response.data.data;
        console.log('📊 Dynamic Observation Data:', observationData);

        // Set thermal coefficients if available - SAME AS CALIBRATE STEP 3
        if (observationTemplate === 'observationctg' && observationData.thermal_coeff) {
          setThermalCoeff({
            uuc: observationData.thermal_coeff.uuc || '',
            master: observationData.thermal_coeff.master || '',
          });
        } else if (observationTemplate === 'observationmt' && observationData.thermal_coeff) {
          setThermalCoeff({
            uuc: observationData.thermal_coeff.uuc || '',
            master: observationData.thermal_coeff.master || '',
            thickness_of_graduation: observationData.thermal_coeff.thickness_of_graduation || '',
          });
        } else if (observationTemplate === 'observationit' && observationData.thermal_coefficients) {
          setThermalCoeff({
            uuc: observationData.thermal_coefficients.uuc_coefficient || '',
            master: observationData.thermal_coefficients.master_coefficient || '',
          });
        } else if (observationTemplate === 'observationfg') {
          const fgData = observationData.data || observationData;
          if (fgData.thermal_coefficients) {
            setThermalCoeff({
              uuc: fgData.thermal_coefficients.thermal_coeff_uuc || '',
              master: fgData.thermal_coefficients.thermal_coeff_master || '',
            });
          } else if (fgData.thermal_coeff) {
            setThermalCoeff({
              uuc: fgData.thermal_coeff.uuc || '',
              master: fgData.thermal_coeff.master || '',
            });
          }
        } else if (observationTemplate === 'observationhg') {
          if (observationData[0] && observationData[0].thermal_coefficients) {
            setThermalCoeff({
              uuc: observationData[0].thermal_coefficients.uuc_coefficient || '',
              master: observationData[0].thermal_coefficients.master_coefficient || '',
            });
          }
        } else if (observationTemplate === 'observationexm') {
          if (observationData.thermal_coefficients) {
            setThermalCoeff({
              uuc: observationData.thermal_coefficients.uuc || '',
              master: observationData.thermal_coefficients.master || '',
              thickness_of_graduation: ''
            });
          }
        } else if (observationTemplate === 'observationmsr') {
          // ADDED: Handle thermal coefficients for observationmsr - SAME AS CALIBRATE STEP 3
          if (Array.isArray(observationData) && observationData.length > 0) {
            const msrData = observationData[0];
            if (msrData.thermal_coeff) {
              setThermalCoeff({
                uuc: msrData.thermal_coeff.uuc || '',
                master: msrData.thermal_coeff.master || '',
                thickness_of_graduation: ''
              });
            }
          }
        } else if (observationTemplate === 'observationdg') {
          // NEW: ADDED Handle thermal coefficients for observationdg - SAME AS CALIBRATE STEP 3
          if (observationData.thermal_coefficients) {
            setThermalCoeff({
              uuc: observationData.thermal_coefficients.uuc || '',
              master: observationData.thermal_coefficients.master || '',
              thickness_of_graduation: '' // DG doesn't use this field
            });
            console.log('✅ DG Thermal coefficients set:', observationData.thermal_coefficients);
          }
        }
        // ADDED: No thermal_coeff for observationrtdwi based on original logic
        // ADDED: No thermal_coeff for observationgtm based on original logic

        // Process observations based on template type - ENHANCED WITH MM SUPPORT AND ADDED IT, MT, MG, FG, HG, EXM, PPG, AVG, RTDWI, MSR, GTM, AND NOW DG
        let processedObservations = [];

        if (observationTemplate === 'observationctg' && observationData.points) {
          processedObservations = observationData.points;
        }
        else if (observationTemplate === 'observationodfm' && observationData.calibration_points) {
          processedObservations = observationData.calibration_points;
        }
        else if (observationTemplate === 'observationdpg' && observationData.observations) {
          processedObservations = observationData.observations;
        }
        else if (observationTemplate === 'observationppg' && observationData.observations) {
          console.log('🔄 Refetching PPG observations:', observationData.observations);
          processedObservations = observationData.observations;
        }
        else if (observationTemplate === 'observationavg') {
          console.log('🔄 Refetching AVG observations:', observationData);

          const avgData = observationData.data || observationData;

          if (avgData.calibration_point && Array.isArray(avgData.calibration_point)) {
            console.log('✅ AVG calibration_point found:', avgData.calibration_point);
            processedObservations = avgData.calibration_point;
          } else {
            console.log('❌ No AVG calibration_point found');
            processedObservations = [];
          }
        }
        else if (observationTemplate === 'observationexm') {
          console.log('🔄 Refetching EXM observations:', observationData);

          if (observationData.calibration_points && Array.isArray(observationData.calibration_points)) {
            console.log('✅ Refetched EXM calibration_points:', observationData.calibration_points.length, 'points');
            processedObservations = observationData.calibration_points;

            // Handle thermal coefficients
            if (observationData.thermal_coefficients) {
              setThermalCoeff({
                uuc: observationData.thermal_coefficients.uuc || '',
                master: observationData.thermal_coefficients.master || '',
                thickness_of_graduation: ''
              });
            }
          } else {
            console.log('❌ No EXM calibration_points found after refetch');
            processedObservations = [];
          }
        }
        else if (observationTemplate === 'observationapg') {
          processedObservations = observationData;
        }
        else if (observationTemplate === 'observationmm') {
          // Handle MM observations properly - SAME AS CALIBRATE STEP 3
          console.log('🔍 Processing observationmm data structure');

          if (observationData.calibration_points && Array.isArray(observationData.calibration_points)) {
            console.log('Setting MM observations from calibration_points:', observationData.calibration_points);
            processedObservations = observationData.calibration_points;
          } else if (observationData.data && Array.isArray(observationData.data)) {
            console.log('Setting MM observations from data:', observationData.data);
            processedObservations = observationData.data;
          } else if (observationData.unit_types && Array.isArray(observationData.unit_types)) {
            console.log('Setting MM observations from unit_types:', observationData.unit_types);
            processedObservations = observationData.unit_types;
          } else if (Array.isArray(observationData)) {
            console.log('Setting MM observations directly:', observationData);
            processedObservations = observationData;
          } else {
            console.log('No MM observations found in expected format, trying to extract from object');

            // Try to extract calibration points from the object structure
            const possiblePoints = Object.values(observationData).filter(
              item => item && typeof item === 'object' && (item.sr_no !== undefined || item.sequence_number !== undefined || item.unit_type !== undefined || item.calibration_points !== undefined)
            );

            if (possiblePoints.length > 0) {
              console.log('Found potential MM points:', possiblePoints);
              processedObservations = possiblePoints;
            } else {
              console.log('No MM observations found');
              processedObservations = [];
            }
          }
        } else if (observationTemplate === 'observationit') {
          // Handle IT observations - SAME AS CALIBRATE STEP 3
          const itData = observationData.data || observationData;

          if (itData.calibration_points) {
            console.log('✅ Refetching IT observations:', itData.calibration_points);
            processedObservations = itData.calibration_points;

            if (itData.thermal_coefficients) {
              setThermalCoeff(prev => ({
                uuc: itData.thermal_coefficients.uuc_coefficient || '',
                master: itData.thermal_coefficients.master_coefficient || '',
                thickness_of_graduation: prev.thickness_of_graduation || '', // preserve existing
              }));
            }
          } else {
            processedObservations = [];
          }
        } else if (observationTemplate === 'observationmt') {
          // Handle MT observations - SAME AS CALIBRATE STEP 3
          const mtData = observationData.data || observationData;

          if (mtData.calibration_points) {
            console.log('✅ Refetching MT observations:', mtData.calibration_points);
            processedObservations = mtData.calibration_points;

            if (mtData.thermal_coeff) {
              setThermalCoeff({
                uuc: mtData.thermal_coeff.uuc || '',
                master: mtData.thermal_coeff.master || '',
                thickness_of_graduation: mtData.thermal_coeff.thickness_of_graduation || ''
              });
            }
          } else {
            processedObservations = [];
          }
        } else if (observationTemplate === 'observationmg') {
          // Handle MG observations - SAME AS CALIBRATE STEP 3
          console.log('🔄 Refetching MG observations:', observationData);

          const mgData = observationData.data || observationData;

          if (mgData.calibration_points && Array.isArray(mgData.calibration_points)) {
            console.log('✅ Refetched MG calibration_points:', mgData.calibration_points.length, 'points');
            processedObservations = mgData.calibration_points;
          } else if (mgData.observations && Array.isArray(mgData.observations)) {
            console.log('✅ Refetched MG observations:', mgData.observations.length, 'points');
            processedObservations = mgData.observations;
          } else {
            console.log('❌ No MG calibration_points found after refetch');
            processedObservations = [];
          }
        } else if (observationTemplate === 'observationfg') {
          // Handle FG observations - SAME AS CALIBRATE STEP 3
          console.log('🔄 Refetching FG observations:', observationData);

          const fgData = observationData.data || observationData;

          // Check both possible structures
          if (fgData.calibration_points && Array.isArray(fgData.calibration_points)) {
            console.log('✅ Refetched FG calibration_points:', fgData.calibration_points.length, 'points');
            processedObservations = fgData.calibration_points;
          } else if (fgData.unit_types && Array.isArray(fgData.unit_types)) {
            console.log('✅ Refetched FG unit_types:', fgData.unit_types.length, 'types');
            processedObservations = fgData.unit_types;
          } else {
            console.log('❌ No FG calibration_points or unit_types found after refetch');
            processedObservations = [];
          }
        } else if (observationTemplate === 'observationhg') {
          console.log('🔄 Refetching HG observations:', observationData);

          // HG has calibration_points in the second object of the array
          const hgData = observationData[1] || observationData;

          if (hgData.calibration_points && Array.isArray(hgData.calibration_points)) {
            console.log('✅ Refetched HG calibration_points:', hgData.calibration_points.length, 'points');
            processedObservations = hgData.calibration_points;

            // Handle thermal coefficients from the first object
            if (observationData[0] && observationData[0].thermal_coefficients) {
              setThermalCoeff({
                uuc: observationData[0].thermal_coefficients.uuc_coefficient || '',
                master: observationData[0].thermal_coefficients.master_coefficient || '',
                thickness_of_graduation: ''
              });
              console.log('✅ HG Thermal coefficients set:', observationData[0].thermal_coefficients);
            }
          } else {
            console.log('❌ No HG calibration_points found after refetch');
            processedObservations = [];
          }
        } else if (observationTemplate === 'observationrtdwi') {
          // ADDED: Specific processing for observationrtdwi - SAME AS CALIBRATE STEP 3
          console.log('Setting RTD WI observations:', observationData);

          if (observationData.calibration_points && Array.isArray(observationData.calibration_points)) {
            console.log('✅ RTD WI calibration_points found:', observationData.calibration_points.length, 'points');
            processedObservations = observationData.calibration_points;
          } else {
            console.log('❌ No RTD WI calibration_points found');
            processedObservations = [];
          }
        } else if (observationTemplate === 'observationmsr') {
          // ADDED: Specific processing for observationmsr - SAME AS CALIBRATE STEP 3
          console.log('Setting MSR observations:', observationData);

          if (Array.isArray(observationData) && observationData.length > 0) {
            const msrData = observationData[0]; // Get first unit type object

            if (msrData.calibration_points && Array.isArray(msrData.calibration_points)) {
              console.log('✅ MSR calibration_points found:', msrData.calibration_points);
              processedObservations = msrData.calibration_points;

              // Handle thermal coefficients
              if (msrData.thermal_coeff) {
                setThermalCoeff({
                  uuc: msrData.thermal_coeff.uuc || '',
                  master: msrData.thermal_coeff.master || '',
                  thickness_of_graduation: '' // MSR doesn't use this field
                });
                console.log('✅ MSR Thermal coefficients set:', msrData.thermal_coeff);
              }
            } else {
              console.log('❌ No MSR calibration_points found');
              processedObservations = [];
            }
          } else {
            console.log('❌ MSR data not in expected array format');
            processedObservations = [];
          }
        } else if (observationTemplate === 'observationgtm') {
          // ADDED: Specific processing for observationgtm - SAME AS CALIBRATE STEP 3
          console.log('Setting GTM observations:', observationData);

          if (observationData.calibration_points && Array.isArray(observationData.calibration_points)) {
            console.log('✅ GTM calibration_points found:', observationData.calibration_points.length, 'points');
            processedObservations = observationData.calibration_points;
          } else {
            console.log('❌ No GTM calibration_points found');
            processedObservations = [];
          }
        } else if (observationTemplate === 'observationdg') {
          // NEW: ADDED Specific processing for observationdg - SAME AS CALIBRATE STEP 3
          console.log('🔍 Setting DG observations:', observationData);

          // DG can return data in multiple formats - handle all cases
          if (observationData.observations && Array.isArray(observationData.observations)) {
            console.log('✅ DG observations found:', observationData.observations.length, 'points');
            processedObservations = observationData.observations;
          } else if (Array.isArray(observationData)) {
            // Fallback if data is directly an array
            console.log('✅ DG observations as array:', observationData.length, 'points');
            processedObservations = observationData;
          } else {
            console.log('❌ No DG observations found in expected format');
            processedObservations = [];
          }

          // Handle thermal coefficients for DG
          if (observationData.thermal_coefficients) {
            setThermalCoeff({
              uuc: observationData.thermal_coefficients.uuc || '',
              master: observationData.thermal_coefficients.master || '',
              thickness_of_graduation: '' // DG doesn't use this field
            });
            console.log('✅ DG Thermal coefficients set:', observationData.thermal_coefficients);
          }
        } else {
          console.log('🔄 Unknown template, falling back to dynamic array detection:', observationTemplate);
          const dataObj = observationData.data || observationData;
          if (dataObj.calibration_points && Array.isArray(dataObj.calibration_points)) {
            processedObservations = dataObj.calibration_points;
          } else if (dataObj.points && Array.isArray(dataObj.points)) {
            processedObservations = dataObj.points;
          } else if (dataObj.observations && Array.isArray(dataObj.observations)) {
            processedObservations = dataObj.observations;
          } else if (Array.isArray(dataObj)) {
            processedObservations = dataObj;
          } else {
            console.log('❌ Could not dynamically detect array structure for unknown template:', observationTemplate);
            processedObservations = [];
          }
        }

        setDynamicObservations(processedObservations);
        console.log('✅ Processed observations set:', processedObservations.length);

        // Generate table structure
        const selectedTable = observationTables.find(table => table.id === observationTemplate);
        if (selectedTable) {
          setTableStructure(generateTableStructure(selectedTable));
        }
        return processedObservations;
      } else {
        console.log('No dynamic observations found');
        setDynamicObservations([]);
        setTableStructure(null);
        return [];
      }
    } catch (error) {
      console.log('Error fetching dynamic observations:', error);
      setDynamicObservations([]);
      setTableStructure(null);
      return [];
    }
  }, [instid, inwardid, generateTableStructure, observationTables]);

  // Fetch observation data - FIXED VERSION (generalized, but keeping for compatibility)
  const fetchObservationData = useCallback(async (observationTemplate) => {
    if (!instid || !inwardid) return;

    try {
      console.log('Fetching observation data for template:', observationTemplate);

      const observationApiUrl = `${JWT_HOST_API}/ob/get-observation`;

      const observationPayload = {
        "fn": observationTemplate, // Use dynamic template instead of hardcoded
        "instid": instid,
        "inwardid": inwardid
      };

      console.log('Making observation API call with payload:', observationPayload);

      const observationResponse = await axios.post(observationApiUrl, observationPayload, {
        timeout: 30000
      });

      console.log('Observation API Response:', observationResponse.data);

      if (observationResponse.data && observationResponse.data.status === true && observationResponse.data.data) {
        const { thermal_coeff, points } = observationResponse.data.data;

        // Set thermal coefficients
        if (thermal_coeff) {
          setThermalCoeff(thermal_coeff);
        }

        // Process observation points - FIXED VERSION
        if (points && Array.isArray(points)) {
          const processedObservations = points.map((point, index) => {
            // Extract observations (non-null values only)
            const validObservations = point.observations ?
              point.observations.filter(obs => obs !== null && obs !== undefined) : [];

            // Create the base observation object
            const observationItem = {
              srNo: point.sr_no || index + 1,
              nominalValue: point.nominal_value || 'N/A',
              unit: point.unit || 'N/A',
              leastCount: point.least_count || 'N/A',
              average: point.average?.value || 'N/A',
              error: point.error?.value || 'N/A',
              repeatableCycle: point.repeatable_cycle || validObservations.length,
              totalObservations: validObservations.length,
              observations: validObservations.map(obs => obs?.value || 'N/A') // Store actual observation values
            };

            return observationItem;
          });

          setObservationData(processedObservations);
          console.log('Observation data processed:', processedObservations);
        }
      } else {
        console.log('No observation data found in response');
        setObservationData([]);
      }
    } catch (err) {
      console.error('Error fetching observation data:', err);
      setObservationData([]);
    }
  }, [instid, inwardid]);

  // ENHANCED Fetch calibration report data with better observation template detection
  useEffect(() => {
    const fetchCalibrationReport = async () => {
      if (!instid || !inwardid) {
        setError(`Missing parameters - instid: ${instid}, inwardid: ${inwardid}`);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // FIRST: Try to get observation template from step3 details API (same as CalibrateStep3)
        try {
          console.log('🔍 Fetching step3 details for observation template...');
          const step3Response = await axios.get('https://kailtech.in/newlims/api/calibrationprocess/get-calibration-step3-details', {
            params: {
              inward_id: inwardid,
              instid: instid,
              caliblocation: caliblocation,
              calibacc: calibacc,
            },
          });
          if (step3Response.data && step3Response.data.instrument && step3Response.data.instrument.instid) {
            console.log('✅ Found master instrument id:', step3Response.data.instrument.instid);
            setMasterInstId(step3Response.data.instrument.instid);
          }

          if (step3Response.data && step3Response.data.observationTemplate) {
            const foundTemplate = step3Response.data.observationTemplate;
            console.log('✅ Found observation template from step3:', foundTemplate);
            setObservationType(foundTemplate);
            setObservationTemplate(foundTemplate);

            // Fetch dynamic observations immediately
            const dynObs = await fetchDynamicObservations(foundTemplate);
            if (!dynObs || dynObs.length === 0) {
              await fetchObservationData(foundTemplate);
            }
          }
        } catch (step3Error) {
          console.log('⚠️ Could not fetch step3 details:', step3Error);
        }

        const apiUrl = `${JWT_HOST_API}/calibrationprocess/view-raw-data`;

        const params = {
          instid: instid,
          inwardid: inwardid
        };

        console.log('Making API call with params:', params);

        const response = await axios.get(apiUrl, {
          params,
          timeout: 30000
        });

        console.log('API Response received:', response.data);

        if (response.data && response.data.success === true && response.data.data) {
          const { uuc_details, master_details, calibration_results, observation_data } = response.data.data;

          // Check if observation data exists and fetch detailed observations
          if (observation_data && observation_data.observation_type) {
            const foundType = observation_data.observation_type;
            setObservationType(foundType);

            // Only set template if not already set
            if (!observationTemplate) {
              setObservationTemplate(foundType);
              console.log('Found observation type from raw data:', foundType);
              const dynObs = await fetchDynamicObservations(foundType);
              if (!dynObs || dynObs.length === 0) {
                await fetchObservationData(foundType);
              }
            }
          }


          if (uuc_details) {
            // Extract reference standards from standards array
            let referenceStandards = "N/A";
            if (response.data.data.standards && Array.isArray(response.data.data.standards) && response.data.data.standards.length > 0) {
              referenceStandards = response.data.data.standards
                .map(std => std.name)
                .filter(name => name) // Remove null/undefined values
                .join(', ');
            }

            const mappedEquipmentData = {
              name: uuc_details.equipment_name || uuc_details.name || "N/A",
              make: uuc_details.make || "N/A",
              model: uuc_details.model || "N/A",
              serialNo: uuc_details.serial_no || uuc_details.serialNo || "N/A",
              idNo: uuc_details.id_no || uuc_details.idNo || "N/A",
              brnNo: uuc_details.brn_no || uuc_details.brnNo || "N/A",
              inwarddate: response.data.data.inwardEntry?.inwarddate || uuc_details.receive_date || uuc_details.receiveDate || "N/A",
              range: uuc_details.range || "N/A",
              leastCount: uuc_details.least_count || uuc_details.leastCount || "N/A",
              condition: uuc_details.condition || "N/A",
              performedAt: uuc_details.calibration_location || uuc_details.performedAt || caliblocation,
              startedOn: formatDateTime(uuc_details.started_on || uuc_details.calibrated_on) || "N/A",
              calibratedon: response.data.data.instrument?.calibratedon || uuc_details.calibrated_on || "N/A",
              endedOn: formatDateTime(uuc_details.ended_on || uuc_details.due_date) || "N/A",
              referenceStd: referenceStandards,
              temperature: uuc_details.temperature || "N/A",
              humidity: uuc_details.humidity || "N/A",
              suggestedDueDate: response.data.data.instrument?.duedate || uuc_details.due_date || uuc_details.suggested_due_date || "N/A",
              certificateNo: uuc_details.certificate_no || "N/A",
              calibratedBy: uuc_details.calibrated_by,
              authorizedBy: uuc_details.authorized_by,
              // REMOVED: calibratedByImage and approvedByImage from here
            };
            setEquipmentData(mappedEquipmentData);

            // ADDED: Set image URLs from API response root level
            if (response.data.data.calibrated_by) {
              setCalibratedByImageUrl(response.data.data.calibrated_by);
              console.log('✅ Calibrated By Image URL set:', response.data.data.calibrated_by);
            }

            if (response.data.data.approvedby) {
              setApprovedByImageUrl(response.data.data.approvedby);
              console.log('✅ Approved By Image URL set:', response.data.data.approvedby);
            }
          }

          // Map master details
          if (master_details && Array.isArray(master_details)) {
            const mappedMasterData = master_details.map((master, index) => ({
              reference: master.reference_standard || master.reference || master.name || "N/A",
              srNo: master.sr_no || master.serial_no || `${index + 1}`,
              idNo: master.id_no || master.id || "N/A",
              certificate: master.certificate_no || master.cert_no || "N/A",
              validUpto: formatDate(master.valid_upto || master.validity) || "N/A"
            }));

            setMasterData(mappedMasterData);
            console.log('Master data mapped:', mappedMasterData);
          }

          // Map calibration results
          if (calibration_results && Array.isArray(calibration_results)) {
            const mappedResults = calibration_results.map((result, index) => ({
              sr: result.sr_no || result.sr || index + 1,
              nominal: result.nominal_value || result.nominal || "N/A",
              mass: result.conventional_mass || result.actual_value || result.mass || "N/A",
              error: result.error || result.deviation || "N/A"
            }));

            setResults(mappedResults);
            console.log('Results mapped:', mappedResults);
          } else {
            setResults([]);
            console.log('No calibration results found');
          }

        } else {
          throw new Error(response.data?.message || 'Invalid response format from server');
        }
      } catch (err) {
        console.error('Error fetching calibration report:', err);
        let errorMessage = 'Failed to load calibration report';

        if (err.response) {
          const status = err.response.status;
          const serverMessage = err.response.data?.message || err.response.statusText;

          if (status === 405) {
            errorMessage = `Method Not Allowed: Server expects GET request, not POST`;
          } else if (status === 401) {
            errorMessage = `Authentication Required: Please login again`;
          } else if (status === 403) {
            errorMessage = `Access Forbidden: Insufficient permissions`;
          } else if (status === 404) {
            errorMessage = `Not Found: API endpoint or resource not found`;
          } else {
            errorMessage = `Server Error ${status}: ${serverMessage}`;
          }

          console.error('Response details:', {
            status: err.response.status,
            headers: err.response.headers,
            data: err.response.data
          });
        } else if (err.request) {
          errorMessage = 'Network Error: Cannot reach server. Please check your connection.';
          console.error('Request details:', err.request);
        } else if (err.code === 'ECONNABORTED') {
          errorMessage = 'Request Timeout: Server took too long to respond';
        } else {
          errorMessage = err.message;
        }

        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    console.log('Starting fetch with parameters:', { instid, inwardid });
    fetchCalibrationReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instid, inwardid, caliblocation, calibacc, fetchDynamicObservations]);

  // Helper functions for date formatting
  const formatDate = (dateString) => {
    if (!dateString || dateString === '0000-00-00' || dateString === 'null' || dateString === null) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleDateString('en-GB');
    } catch {
      return '';
    }
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString || dateTimeString === '0000-00-00 00:00:00' || dateTimeString === 'null' || dateTimeString === null) return '';
    try {
      const date = new Date(dateTimeString);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleDateString('en-GB') + ' ' + date.toLocaleTimeString('en-GB', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  };

  const handleBackToPerformCalibration = () => {
    navigate(`/dashboards/calibration-process/inward-entry-lab/perform-calibration/${inwardid}?caliblocation=${caliblocation}&calibacc=${calibacc}`);
  };

  const handlePrint = () => {
    const printableElement = document.getElementById('printable-content');
    if (!printableElement) {
      toast.error('No content to print');
      return;
    }
    window.print();
  };

  const handleRetry = () => {
    setError(null);
    setLoading(true);
    window.location.reload();
  };

  // Helper function to determine maximum number of observations across all points
  const getMaxObservations = () => {
    if (observationData.length === 0) return 0;
    return Math.max(...observationData.map(item => item.observations ? item.observations.length : 0));
  };

  // Loading state
  if (loading && !error) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-gray-600">
        <svg className="animate-spin h-6 w-6 mr-2 text-blue-600" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z"></path>
        </svg>
        Loading ViewRawData...
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-6 bg-white text-sm">
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <div className="text-lg text-red-600 mb-4">⚠️ Error loading calibration report</div>
          <div className="text-sm text-gray-600 mb-4 text-center max-w-2xl">
            {error}
          </div>
          <div className="text-xs text-gray-500 mb-4 p-3 bg-gray-100 rounded">
            <strong>Debug Info:</strong><br />
            Parameters: inwardid={inwardid}, instid={instid}<br />
            Location: {caliblocation}, Accreditation: {calibacc}<br />
            URL: {window.location.href}
          </div>
          <div className="flex gap-3">
            <Button
              onClick={handleRetry}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              🔄 Retry
            </Button>
            <Button
              onClick={handleBackToPerformCalibration}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
            >
              ← Back to Perform Calibration
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const maxObservations = getMaxObservations();
  const selectedTableData = observationTables.find(table => table.id === observationTemplate);
  const obsCount = loadedRepeatCount !== null ? loadedRepeatCount : observationCount;
  const observationRows = selectedTableData ? createObservationRows(dynamicObservations, observationTemplate, obsCount, backendColumns) : { rows: [], unitTypes: [] };
  const finalTableStructure = (customLayout && getCustomTableStructure()) || tableStructure;

  return (
    <>
      {/* Inline styles for print media query - Hides everything except printable content */}
      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            #printable-content, #printable-content * {
              visibility: visible;
            }
            #printable-content {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            .no-print {
              display: none !important;
            }
          }
          @media screen {
            .no-print {
              display: flex;
            }
          }
        `}
      </style>

      <div className="p-6 bg-white text-sm">
        {/* Header - Hidden on print */}
        <div className="flex items-center justify-between mb-4 no-print">
          <div className="flex items-center">
            <h2 className="text-lg font-semibold text-gray-800">
              View Raw Data - Calibration Report
            </h2>
          </div>
          <Button
            variant="outline"
            className="text-white bg-blue-600 hover:bg-blue-700"
            onClick={handleBackToPerformCalibration}
          >
            ← Back to Perform Calibration
          </Button>
        </div>

        {/* Wrap all printable content in this div */}
        <div id="printable-content">
          {/* Current Observation Template Display */}
          {observationType && (
            <div></div>
          )}


          {/* Details Of UUC */}
          <div className="flex items-center mb-4">
            <img src="/images/logo.png" alt="Logo" className="h-14 mr-4" onError={(e) => { e.target.style.display = 'none' }} />
            <br />

          </div>

          {/* Equipment Details */}
          <div className="grid grid-cols-2 gap-y-1 gap-x-8 mb-6 text-sm">
            <p><b>Name Of The Equipment:</b> {equipmentData.name}</p>
            <p><b>BRN No:</b> {equipmentData.brnNo}</p>
            <p><b>Make:</b> {equipmentData.make}</p>
            <p><b>Receive Date:</b> {equipmentData.inwarddate}</p>
            <p><b>Model:</b> {equipmentData.model}</p>
            <p><b>Range:</b> {equipmentData.range}</p>
            <p><b>Serial No:</b> {equipmentData.serialNo}</p>
            <p><b>Least Count:</b> {equipmentData.leastCount}</p>
            <p><b>ID No:</b> {equipmentData.idNo}</p>
            <p><b>Condition Of UUC:</b> {equipmentData.condition}</p>
            <p><b>Calibration Performed At:</b> {equipmentData.performedAt}</p>
            <p><b>Calibrated On:</b> {equipmentData.calibratedon}</p>
            <p><b>Suggested Due Date:</b> {equipmentData.suggestedDueDate}</p>
            <p><b>Reference Standard:</b> {equipmentData.referenceStd}</p>
            <p><b>Temperature (°C):</b> {equipmentData.temperature}</p>
            <p><b>Humidity (%RH):</b> {equipmentData.humidity}</p>
          </div>

          {/* Master Used For Calibration */}
          <h3 className="font-semibold mb-2 text-base">Master Standards Used For Calibration</h3>
          <div className="overflow-x-auto mb-6">
            <table className="w-full border border-gray-300 text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border border-gray-300 px-3 py-2 text-left">Reference Standard</th>
                  <th className="border border-gray-300 px-3 py-2 text-left">Sr.No</th>
                  <th className="border border-gray-300 px-3 py-2 text-left">ID No.</th>
                  <th className="border border-gray-300 px-3 py-2 text-left">Certificate No.</th>
                  <th className="border border-gray-300 px-3 py-2 text-left">Valid Upto</th>
                </tr>
              </thead>
              <tbody>
                {masterData.length > 0 ? (
                  masterData.map((master, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="border border-gray-300 px-3 py-2">{master.reference}</td>
                      <td className="border border-gray-300 px-3 py-2">{master.srNo}</td>
                      <td className="border border-gray-300 px-3 py-2">{master.idNo}</td>
                      <td className="border border-gray-300 px-3 py-2">{master.certificate}</td>
                      <td className="border border-gray-300 px-3 py-2">{master.validUpto}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="border border-gray-300 px-3 py-2 text-center text-gray-500" colSpan="5">
                      No master standard data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Thermal Coefficients Display */}
          {Object.keys(thermalCoeff).length > 0 && (
            <div className="mb-6 p-4 bg-gray-50 rounded">
              <h3 className="font-semibold mb-2">Thermal Coefficients</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <p><b>UUC Thermal Coefficient:</b> {thermalCoeff.uuc || 'N/A'}</p>
                <p><b>Master Thermal Coefficient:</b> {thermalCoeff.master || 'N/A'}</p>
                {thermalCoeff.thickness_of_graduation && (
                  <p><b>Thickness of Graduation:</b> {thermalCoeff.thickness_of_graduation}</p>
                )}
              </div>
            </div>
          )}

          {/* ENHANCED Dynamic Observation Results Table with FULL MM SUPPORT AND ADDED IT, MT, MG, FG, HG, EXM, PPG, AVG, RTDWI, MSR, GTM, AND NOW DG */}
          {observationTemplate && finalTableStructure && (observationRows.rows.length > 0 || (customLayout?.isFullyDynamic && dynamicObservations.length > 0)) && (
            <>
              <h3 className="font-semibold mb-2 text-base">Calibration Results - {selectedTableData?.name}</h3>

              {/* Handle MM with multiple unit types - SAME AS CALIBRATE STEP 3 */}
              {observationTemplate === 'observationmm' && observationRows.unitTypes && observationRows.unitTypes.length > 0 ? (
                observationRows.unitTypes.map((unitTypeGroup, groupIndex) => {
                  if (!unitTypeGroup || !unitTypeGroup.calibration_points) return null;

                  const unitTypeRows = unitTypeGroup.calibration_points.map(point => {
                    const observations = [];
                    if (point.observations && Array.isArray(point.observations)) {
                      for (let i = 0; i < 5; i++) {
                        observations.push(point.observations[i]?.value || '');
                      }
                    }
                    while (observations.length < 5) {
                      observations.push('');
                    }

                    return [
                      point.sequence_number?.toString() || '',
                      point.mode || 'Measure',
                      point.range || '',
                      (point.nominal_values?.calculated_master?.value || '') +
                      (point.nominal_values?.calculated_master?.unit ? ' ' + point.nominal_values.calculated_master.unit : ''),
                      (point.nominal_values?.master?.value || '') +
                      (point.nominal_values?.master?.unit ? ' ' + point.nominal_values.master.unit : ''),
                      ...observations,
                      point.calculations?.average || '',
                      point.calculations?.error || ''
                    ];
                  });

                  return (
                    <div key={groupIndex} className="mb-8">
                      <h4 className="text-lg font-medium text-gray-800 mb-3 bg-blue-50 p-2 rounded">
                        {unitTypeGroup.unit_type}
                      </h4>
                      <div className="overflow-x-auto border border-gray-200">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-gray-100 border-b border-gray-300">
                              {finalTableStructure.headers.map((header, index) => (
                                <th
                                  key={index}
                                  colSpan={header.colspan}
                                  className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-300 last:border-r-0"
                                >
                                  {header.name}
                                </th>
                              ))}
                            </tr>
                            {finalTableStructure.subHeadersRow.some((item) => item !== null) && (
                              <tr className="bg-gray-50 border-b border-gray-300">
                                {finalTableStructure.subHeadersRow.map((subHeader, index) => (
                                  <th
                                    key={index}
                                    className="px-3 py-2 text-left text-xs font-medium text-gray-600 border-r border-gray-300 last:border-r-0"
                                  >
                                    {subHeader || ''}
                                  </th>
                                ))}
                              </tr>
                            )}
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {unitTypeRows.map((row, rowIndex) => (
                              <tr key={rowIndex} className="hover:bg-gray-50">
                                {(customLayout ? customLayout.columns : (getDefaultLayout(observationTemplate)?.columns || [])).map((col, idx) => {
                                  const colIndex = customLayout ? col.originalIndex : idx;
                                  const cell = row[colIndex];
                                  return (
                                    <td
                                      key={idx}
                                      className="px-3 py-2 whitespace-nowrap text-sm border-r border-gray-200 last:border-r-0"
                                    >
                                      {safeGetValue(cell)}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })
              ) : (
                // Standard single table for other observation types (including IT, MT, MG, FG, HG, EXM, PPG, AVG, RTDWI, MSR, GTM, AND NOW DG)
                // ADDED: Special display handling for observationrtdwi, observationgtm, and now observationdg static text and dashes/calculated fields
                <div className="overflow-x-auto mb-6">
                  <table className="w-full border border-gray-300 text-sm">
                    <thead>
                      {/* Main headers row */}
                      {finalTableStructure && finalTableStructure.headers && (
                        <tr className="bg-gray-100">
                          {finalTableStructure.headers.map((header, index) => (
                            <th
                              key={index}
                              colSpan={header.colspan}
                              className="border border-gray-300 px-3 py-2 text-left font-medium text-gray-700 uppercase tracking-wider"
                            >
                              {header.name}
                            </th>
                          ))}
                        </tr>
                      )}
                      {/* Sub headers row (if any) */}
                      {finalTableStructure && finalTableStructure.subHeadersRow && finalTableStructure.subHeadersRow.some((item) => item !== null) && (
                        <tr className="bg-gray-50">
                          {finalTableStructure.subHeadersRow.map((subHeader, index) => (
                            <th
                              key={index}
                              className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-600"
                            >
                              {subHeader || ''}
                            </th>
                          ))}
                        </tr>
                      )}
                    </thead>
                    <tbody>
                      {(customLayout?.isFullyDynamic ? dynamicObservations : (observationRows?.rows || [])).map((row, rowIndex) => (
                        <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          {(customLayout ? customLayout.columns : (getDefaultLayout(observationTemplate)?.columns || [])).map((col, idx) => {
                            const colIndex = customLayout ? col.originalIndex : idx;
                            const rawCell = customLayout?.isFullyDynamic ? row[col.key] : row[colIndex];
                            const cell = safeGetValue(rawCell);

                            // ADDED: Special handling for observationrtdwi static text and dashes
                            if (observationTemplate === 'observationrtdwi' && (cell === '-' || cell === 'UUC' || cell === 'Master')) {
                              return (
                                <td key={idx} className="border border-gray-300 px-3 py-2 text-center font-medium">
                                  {cell}
                                </td>
                              );
                            }
                            // ADDED: Special handling for observationgtm static text and dashes
                            if (observationTemplate === 'observationgtm' && (cell === '-' || cell === 'UUC' || cell === 'Master')) {
                              return (
                                <td key={idx} className="border border-gray-300 px-3 py-2 text-center font-medium">
                                  {cell}
                                </td>
                              );
                            }
                            // NEW: ADDED Special handling for observationdg calculated/static fields
                            if (observationTemplate === 'observationdg' && col.key && ['col_6', 'col_7', 'col_8', 'col_9', 'col_10'].includes(col.key)) {
                              return (
                                <td key={idx} className="border border-gray-300 px-3 py-2 font-medium text-center">
                                  {cell || ''}
                                </td>
                              );
                            }
                            // For UNIT_SELECT in Master row, display the unit label (assuming we have unitsList or fetch it)
                            // But since read-only and no unitsList here, just display the value
                            return (
                              <td key={idx} className="border border-gray-300 px-3 py-2">
                                {cell || ''}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {/* ADDED: Second Table for table1 columns */}
          {table1Columns && table1Columns.length > 0 && dynamicObservations && dynamicObservations.length > 0 && (
            <>
              <h3 className="font-semibold mb-2 text-base mt-6">Additional Information</h3>
              <div className="overflow-x-auto mb-6">
                <table className="w-full border border-gray-300 text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border border-gray-300 px-3 py-2 text-left">Sr. No.</th>
                      {table1Columns.sort((a, b) => a.sort_order - b.sort_order).map((col, index) => (
                        <th key={index} className="border border-gray-300 px-3 py-2 text-left uppercase">
                          {col.display_name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      let allPoints = [];
                      if (observationTemplate === 'observationmm' && dynamicObservations.length > 0 && dynamicObservations[0].calibration_points) {
                        dynamicObservations.forEach(ut => {
                          if (ut.calibration_points) allPoints.push(...ut.calibration_points);
                        });
                      } else {
                        allPoints = dynamicObservations;
                      }
                      return allPoints.map((point, rowIndex) => (
                        <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="border border-gray-300 px-3 py-2">
                            {point.sr_no || point.sequence_number || rowIndex + 1}
                          </td>
                          {table1Columns.sort((a, b) => a.sort_order - b.sort_order).map((col, colIndex) => (
                            <td key={colIndex} className="border border-gray-300 px-3 py-2">
                              {point[col.column_key] !== undefined && point[col.column_key] !== null ? point[col.column_key].toString() : ''}
                            </td>
                          ))}
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* FIXED: Dynamic Observation Results Table */}
          {observationData.length > 0 && maxObservations > 0 && (
            <>
              <h3 className="font-semibold mb-2 text-base">Detailed Calibration Observations</h3>
              <div className="overflow-x-auto mb-6">
                <table className="w-full border border-gray-300 text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border border-gray-300 px-3 py-2 text-left">SR. NO.</th>
                      <th className="border border-gray-300 px-3 py-2 text-left">NOMINAL VALUE</th>
                      {/* Dynamic observation headers based on max observations */}
                      {Array.from({ length: maxObservations }, (_, i) => (
                        <th key={i} className="border border-gray-300 px-3 py-2 text-left">
                          Observation {i + 1}
                        </th>
                      ))}
                      <th className="border border-gray-300 px-3 py-2 text-left">AVERAGE</th>
                      <th className="border border-gray-300 px-3 py-2 text-left">ERROR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {observationData.map((observation, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="border border-gray-300 px-3 py-2">{observation.srNo}</td>
                        <td className="border border-gray-300 px-3 py-2">{observation.nominalValue}</td>
                        {/* Dynamic observation columns */}
                        {Array.from({ length: maxObservations }, (_, i) => (
                          <td key={i} className="border border-gray-300 px-3 py-2">
                            {observation.observations && observation.observations[i] ? observation.observations[i] : ''}
                          </td>
                        ))}
                        <td className="border border-gray-300 px-3 py-2 font-medium">{observation.average}</td>
                        <td className="border border-gray-300 px-3 py-2 font-medium">{observation.error}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Original Calibration Result Table (fallback when no observation data) */}
          {observationData.length === 0 && observationRows.rows.length === 0 && (!customLayout?.isFullyDynamic || dynamicObservations.length === 0) && (
            <>
              <h3 className="font-semibold mb-2 text-base">Calibration Results</h3>
              <div className="overflow-x-auto mb-6">
                <table className="w-full border border-gray-300 text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border border-gray-300 px-3 py-2 text-left">Sr. No.</th>
                      <th className="border border-gray-300 px-3 py-2 text-left">Nominal Value</th>
                      <th className="border border-gray-300 px-3 py-2 text-left">Conventional Mass</th>
                      <th className="border border-gray-300 px-3 py-2 text-left">Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.length > 0 ? (
                      results.map((result, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="border border-gray-300 px-3 py-2">{result.sr}</td>
                          <td className="border border-gray-300 px-3 py-2">{result.nominal}</td>
                          <td className="border border-gray-300 px-3 py-2">{result.mass}</td>
                          <td className="border border-gray-300 px-3 py-2">{result.error}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="border border-gray-300 px-3 py-2 text-center text-gray-500" colSpan="4">
                          No calibration results available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Environmental Conditions */}
          {(equipmentData.temperature !== "N/A" || equipmentData.humidity !== "N/A") && (
            <div className="mb-6 p-4 bg-gray-50 rounded">
              <h3 className="font-semibold mb-2">Environmental Conditions During Calibration</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <p><b>Temperature:</b> {equipmentData.temperature}°C</p>
                <p><b>Humidity:</b> {equipmentData.humidity}% RH</p>
              </div>
            </div>
          )}

          {/* Footer - Electronic Signatures */}
          <div className="flex justify-between mt-12 pt-8 border-t text-xs">
            {/* UPDATED: Only show if image URL exists */}
            {calibratedByImageUrl && (
              <div>
                <p className="font-semibold mb-1">Calibrated By</p>
                <img
                  src={calibratedByImageUrl}
                  alt="Calibrated By Signature"
                  className="h-16 w-auto mb-1"
                  onError={(e) => {
                    console.error('❌ Failed to load calibrated_by image:', calibratedByImageUrl);
                    e.target.style.display = 'none';
                  }}
                />

              </div>
            )}

            {/* UPDATED: Only show if image URL exists */}
            {approvedByImageUrl && (
              <div className="text-right">
                <p className="font-semibold mb-1" style={{ marginRight: "303px" }}>Authorized By</p>
                <img
                  src={approvedByImageUrl}
                  alt="Authorized By Signature"
                  className="h-16 w-auto mb-1"
                  onError={(e) => {
                    console.error('❌ Failed to load approvedby image:', approvedByImageUrl);
                    e.target.style.display = 'none';
                  }}
                />

              </div>
            )}
          </div>



        </div>

        <hr className="my-4 border-t" />

        {/* Action Buttons - Hidden on print */}
        <div className="mt-6 flex gap-3 no-print">
          <Button
            className="bg-indigo-500 hover:bg-fuchsia-500 text-white px-6 py-2 rounded"
            onClick={handlePrint}
          >
            Print Report
          </Button>
        </div>
      </div>
    </>
  );
}
