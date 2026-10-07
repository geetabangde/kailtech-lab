import { useState, useEffect, useCallback } from 'react';
import { Button } from "components/ui";
import { useNavigate, useParams, useSearchParams, Link } from "react-router";
import axios from 'axios';
import { toast } from "sonner";
import { JWT_HOST_API } from "configs/auth.config";
import {
  getViewObservationTables,
  createViewObservationRows,
  parseDynamicObservation,
  getObservationCustomStructure,
  getDGViewStructure,
  BiomedicalTable,
  UCTable,
  TMTable,
  WeighingBalanceTable,
  TSTable,
  ViewObservationAUTM,
  ViewObservationPR,
  ViewObservationWBN,
  ViewObservationUTM,
  ViewObservationLMS,
  ViewObservationLS,
  TSWOI_ROWSPAN_COLUMNS,
  TSWI_ROWSPAN_COLUMNS,
  SW_ROWSPAN_COLUMNS,
  BHT_ROWSPAN_COLUMNS,
  VHT_ROWSPAN_COLUMNS
} from './ViewRawDataObservation';

export default function CalibrationReport() {
  const navigate = useNavigate();
  const { inwardid: pathInwardid, instid: pathInstid, id: pathId, itemId: pathItemId } = useParams();
  const [searchParams] = useSearchParams();

  // Extract parameters from multiple sources - CORRECTED ORDER
  const extractParams = () => {
    const currentUrl = window.location.href;
    console.log('Current URL:', currentUrl);

    // Method 1: From useParams (path parameters) - CORRECTED
    let inwardid = pathInwardid || pathId; // First parameter is inwardid
    let instid = pathInstid || pathItemId; // Second parameter is instid

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

  const reportUrl = inwardid && instid
    ? `/dashboards/calibration-process/inward-entry-lab/view-rawdata/${inwardid}/${instid}?caliblocation=${caliblocation}&calibacc=${calibacc}`
    : `${window.location.pathname}${window.location.search}`;

  // State management
  const [equipmentData, setEquipmentData] = useState({});
  const [calibratedByImageUrl, setCalibratedByImageUrl] = useState('');
  const [calibratedByTextImage, setCalibratedByTextImage] = useState('');
  const [approvedByImageUrl, setApprovedByImageUrl] = useState('');
  const [approvedByTextImage, setApprovedByTextImage] = useState('');
  const [masterData, setMasterData] = useState([]);
  const [results, setResults] = useState([]);
  const [observationData, setObservationData] = useState([]);
  const [observationType, setObservationType] = useState('');
  const [thermalCoeff, setThermalCoeff] = useState({});
  const [parallelism, setParallelism] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rawdata, setRawdata] = useState({});

  const [dynamicObservations, setDynamicObservations] = useState([]);
  const [biomedicalRawData, setBiomedicalRawData] = useState(null);
  const [observationTemplate, setObservationTemplate] = useState('');
  const [tableStructure, setTableStructure] = useState(null);
  const [diagram, setDiagram] = useState('');
  const [instrumentInfo, setInstrumentInfo] = useState(null);
  const [itemStatus, setItemStatus] = useState(null);

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

  const observationTables = getViewObservationTables(rawdata);

  const createObservationRows = useCallback((observationData, template, currentRawdata = {}) => {
    return createViewObservationRows(observationData, template, currentRawdata);
  }, []);


  const generateTableStructure = useCallback((selectedTableData, unitInfo, observationsList = []) => {
    if (!selectedTableData || !selectedTableData.structure) return null;
    const structure = selectedTableData.structure;
    if (!structure.singleHeaders || !Array.isArray(structure.singleHeaders)) return null;
    const headers = [];
    const subHeadersRow = [];

    const asUnitText = (val) => {
      if (val === null || val === undefined || val === '') return '';
      if (typeof val === 'string') return val;
      if (typeof val === 'number') return String(val);
      return '';
    };

    const uucUnit = unitInfo?.unit_description
      || unitInfo?.description
      || unitInfo?.uuc_unit?.description
      || unitInfo?.uuc_unit
      || unitInfo?.unit
      || unitInfo?.calculation
      || unitInfo?.test
      || observationsList?.[0]?.unit
      || observationsList?.[0]?.unit_description
      || (typeof unitInfo === 'string' ? unitInfo : '')
      || (selectedTableData?.id === 'observationgtm' ? '°C' : '');

    const masterUnit = unitInfo?.master_unit_description
      || unitInfo?.master_unit?.description
      || unitInfo?.master_unit
      || unitInfo?.master
      || observationsList?.[0]?.master_unit_description
      || observationsList?.[0]?.master_unit
      || (selectedTableData?.id === 'observationgtm' ? 'Ω' : '');

    const uucUnitText = asUnitText(uucUnit);
    const masterUnitText = asUnitText(masterUnit);

    const formatHeader = (text) => {
      if (typeof text !== 'string') return text;
      let formatted = text;
      if (uucUnitText) {
        const u = uucUnitText.toUpperCase();
        formatted = formatted
          .replace(/\(UUC Unit\)/gi, `(${u})`)
          .replace(/\(UUCUNIT\)/gi, `(${u})`)
          .replace(/\[unit\]/gi, u)
          .replace(/\(CALCULATIONUNIT\)/gi, `(${u})`)
          .replace(/\[CALCULATIONUNIT\]/gi, u);
      }
      if (masterUnitText) {
        const m = masterUnitText.toUpperCase();
        formatted = formatted
          .replace(/\(Master Unit\)/gi, `(${m})`)
          .replace(/\(MASTERUNIT\)/gi, `(${m})`)
          .replace(/\[master unit\]/gi, m)
          .replace(/\[MASTERUNIT\]/gi, m);
      }
      return formatted.replace(/\[|\]/g, '');
    };

    structure.singleHeaders.forEach((header) => {
      headers.push({ name: formatHeader(header), colspan: 1 });
      subHeadersRow.push(null);
    });

    if (structure.subHeaders && Object.keys(structure.subHeaders).length > 0) {
      Object.entries(structure.subHeaders).forEach(([groupName, subHeaders]) => {
        headers.push({ name: formatHeader(groupName), colspan: subHeaders.length });
        subHeaders.forEach((subHeader) => {
          subHeadersRow.push(formatHeader(subHeader));
        });
      });
    }

    if (structure.remainingHeaders && structure.remainingHeaders.length > 0) {
      structure.remainingHeaders.forEach((header) => {
        headers.push({ name: formatHeader(header), colspan: 1 });
        subHeadersRow.push(null);
      });
    }

    return { headers, subHeadersRow, isMatrix: Boolean(selectedTableData?.structure?.isMatrix) };
  }, []);


  const fetchDynamicObservations = useCallback(async (observationTemplate) => {
    if (!observationTemplate || !instid || !inwardid) return;

    try {
      console.log('🔍 Fetching dynamic observations for template:', observationTemplate);

      const postPayload = {
        fn: observationTemplate,
        instid: instid,
        inwardid: inwardid,
      };

      let response;
      try {
        response = await axios.post(`${JWT_HOST_API}/ob/get-observation`, postPayload);
      } catch (postErr) {
        console.warn('JWT_HOST_API get-observation failed, trying fallback:', postErr);
        response = await axios.post('https://kailtech.in/newlims/api/ob/get-observation', postPayload);
      }

      const isSuccess = response.data.status === true || response.data.staus === true || response.data.success === true;

      if (isSuccess && (response.data.data || observationTemplate === 'observationbiomedical')) {
        const observationData = observationTemplate === 'observationbiomedical'
          ? response.data
          : response.data.data;
        setBiomedicalRawData(observationTemplate === 'observationbiomedical' ? observationData : null);
        console.log('📊 Dynamic Observation Data:', observationData);

        const processedObservations = parseDynamicObservation(
          observationTemplate,
          observationData,
          response,
          setThermalCoeff,
          setEquipmentData,
          setRawdata,
          setParallelism
        );

        setDynamicObservations(processedObservations);
        console.log('✅ Processed observations set:', processedObservations.length);

        // Generate table structure
        let selectedTable = observationTables.find(table => table.id === observationTemplate);
        if (selectedTable) {
          if (observationTemplate === 'observationcustom' && observationData.instrument_settings) {
            selectedTable.structure = getObservationCustomStructure(observationData.instrument_settings);
          }
          if (observationTemplate === 'observationdg') {
            // Copy rather than mutate: dgTableConfig is a shared module object
            selectedTable = { ...selectedTable, structure: getDGViewStructure(processedObservations) };
          }
          const units = observationData?.observation_data?.unit_info
            || observationData?.observation_data?.data?.unit_info
            || observationData?.unit_info
            || observationData?.units
            || observationData?.data?.units
            || observationData?.observations?.[0]?.units
            || processedObservations?.[0]?.units
            || processedObservations?.[0]?.unit;
          setTableStructure(generateTableStructure(selectedTable, units, processedObservations));
        }
        return observationData;
      } else {
        console.log('No dynamic observations found');
        setDynamicObservations([]);
        setTableStructure(null);
        return null;
      }
    } catch (error) {
      console.log('Error fetching dynamic observations:', error);
      setDynamicObservations([]);
      setTableStructure(null);
      return null;
    }
  }, [instid, inwardid, generateTableStructure]);

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
          const { uuc_details, master_details, calibration_results, observation_data, instrument_info } = response.data.data;

          if (instrument_info) {
            setInstrumentInfo(instrument_info);
          }
          if (response.data.data.status !== undefined) {
            setItemStatus(response.data.data.status);
          }

          // Resolve observation template directly from instrument_info.suffix or observation_data
          let resolvedTemplate = '';
          const rawSuffix = instrument_info?.suffix || response.data.data.instrument?.suffix || '';
          if (rawSuffix) {
            resolvedTemplate = rawSuffix.startsWith('observation') ? rawSuffix : `observation${rawSuffix}`;
          } else if (observation_data && observation_data.observation_type) {
            resolvedTemplate = observation_data.observation_type;
          }

          let dynEnv = null;
          if (resolvedTemplate) {
            console.log('✅ Resolved observation template:', resolvedTemplate);
            setObservationType(resolvedTemplate);
            setObservationTemplate(resolvedTemplate);
            const dynObsResult = await fetchDynamicObservations(resolvedTemplate);
            dynEnv = dynObsResult?.environment || dynObsResult?.data?.environment;
            await fetchObservationData(resolvedTemplate);

            if (observation_data?.observations) {
              const obsList = observation_data.observations || observation_data.data?.observations;
              if (Array.isArray(obsList) && obsList.length > 0) {
                setDynamicObservations(obsList);
                const selectedTable = observationTables.find(table => table.id === resolvedTemplate);
                if (selectedTable) {
                  const units = obsList[0]?.units || observation_data?.units;
                  setTableStructure(prev => prev || generateTableStructure(selectedTable, units));
                }
              }
            }

            // Handle PR observation data structure (matrices.points)
            if (resolvedTemplate === 'observationpr' && observation_data?.matrices) {
              const matrices = observation_data.matrices || observation_data.data?.matrices;
              if (Array.isArray(matrices) && matrices.length > 0 && matrices[0]?.points) {
                // Pass the full observation_data structure for PR
                setDynamicObservations(observation_data);
                const selectedTable = observationTables.find(table => table.id === resolvedTemplate);
                if (selectedTable) {
                  const units = matrices[0]?.header_info?.uuc_unit || matrices[0]?.header_info?.calculation_unit || 'N';
                  setTableStructure(prev => prev || generateTableStructure(selectedTable, units));
                }
              }
            }

            // Handle UTM observation data structure (matrices[].calibration_points)
            if (resolvedTemplate === 'observationutm' && observation_data?.matrices) {
              const matrices = observation_data.matrices || observation_data.data?.matrices;
              if (Array.isArray(matrices) && matrices.length > 0 && matrices[0]?.calibration_points) {
                setDynamicObservations(matrices);
                const selectedTable = observationTables.find(table => table.id === resolvedTemplate);
                if (selectedTable) {
                  const units = matrices[0]?.metadata?.unit || 'kN';
                  setTableStructure(prev => prev || generateTableStructure(selectedTable, units));
                }
              }
            }

            // Handle IT observation data that already comes in the main response
            if (resolvedTemplate === 'observationit' && observation_data) {
              const itPayload =
                observation_data.data?.data ||
                observation_data.data ||
                observation_data;

              if (itPayload?.calibration_points) {
                setDynamicObservations(itPayload.calibration_points);

                if (itPayload.thermal_coefficients) {
                  setThermalCoeff({
                    uuc: itPayload.thermal_coefficients.uuc_coefficient || '',
                    master: itPayload.thermal_coefficients.master_coefficient || '',
                    thickness_of_graduation: '',
                  });
                }

                const selectedTable = observationTables.find(t => t.id === resolvedTemplate);
                if (selectedTable) {
                  const units = itPayload.calibration_points[0]?.unit || 'mm';
                  setTableStructure(prev => prev || generateTableStructure(selectedTable, units, itPayload.calibration_points));
                }
              }
            }

            // Generic fallback: several templates (FG among them) ship their points as
            // observation_data.calibration_points in this same response. Without this, an
            // empty /ob/get-observation call leaves the table blank and the page falls back
            // to the "No calibration results available" placeholder.
            if (observation_data) {
              const genericPoints =
                observation_data.calibration_points ||
                observation_data.data?.calibration_points ||
                observation_data.data?.data?.calibration_points;

              if (Array.isArray(genericPoints) && genericPoints.length > 0) {
                // Never clobber points a template-specific handler already set.
                setDynamicObservations(prev =>
                  (Array.isArray(prev) && prev.length > 0) ? prev : genericPoints
                );

                const selectedTable = observationTables.find(t => t.id === resolvedTemplate);
                if (selectedTable) {
                  const units = genericPoints[0]?.unit || genericPoints[0]?.units;
                  setTableStructure(prev => prev || generateTableStructure(selectedTable, units, genericPoints));
                }
              }
            }

            if (observation_data?.thermal_coefficients) {
              const therm = observation_data.thermal_coefficients;
              setThermalCoeff(prev => ({
                ...prev,
                uuc: therm.uuc || therm.thermal_coeff_uuc || prev.uuc || '',
                master: therm.master || therm.thermal_coeff_master || prev.master || '',
                thickness_of_graduation: prev.thickness_of_graduation || '',
              }));
            }

            if (resolvedTemplate === 'observationvc' && observation_data) {
              const therm = observation_data.thermal_coeff || observation_data.thermal_coefficients;
              if (therm) {
                setThermalCoeff({
                  uuc: therm.uuc || therm.thermal_coeff_uuc || '',
                  master: therm.master || therm.thermal_coeff_master || '',
                  thickness_of_graduation: '',
                });
              }
              const addl = observation_data.additional_measurements || response.data?.data?.additional_measurements || {};
              const parall = observation_data.parallelism || observation_data.parallel || {};
              setParallelism({
                parallinternal: addl.external_jaws?.value ?? addl.parallelism_internal?.value ?? parall.parallinternal ?? parall.internal ?? observation_data.parallinternal ?? '',
                parallexternal: addl.internal_jaws?.value ?? addl.parallelism_external?.value ?? parall.parallexternal ?? parall.external ?? observation_data.parallexternal ?? '',
              });
              if (observation_data.matrix_groups && Array.isArray(observation_data.matrix_groups)) {
                setDynamicObservations(observation_data.matrix_groups);
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

            const pStart = uuc_details.pressurestart || uuc_details.pressure_start || response.data.data.instrument?.pressurestart || response.data.data.instrument?.pressure_start || dynEnv?.pressure_start || dynEnv?.pressurestart || "N/A";
            const pEnd = uuc_details.pressureend || uuc_details.pressure_end || response.data.data.instrument?.pressureend || response.data.data.instrument?.pressure_end || dynEnv?.pressure_end || dynEnv?.pressureend || "N/A";
            const sTime = uuc_details.stabilizationtime || uuc_details.stabilization_time || response.data.data.instrument?.stabilizationtime || response.data.data.instrument?.stabilization_time || dynEnv?.stabilization_time || dynEnv?.stabilizationtime || "N/A";

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
              startedOn: formatDateTime(uuc_details.started_on || uuc_details.startdate || uuc_details.start_date) || "N/A",
              calibratedon: response.data.data.instrument?.calibratedon || uuc_details.calibrated_on || uuc_details.calibratedon || "N/A",
              endedOn: formatDateTime(uuc_details.ended_on || uuc_details.enddate || uuc_details.end_date) || "N/A",
              referenceStd: referenceStandards,
              temperature: uuc_details.temperature !== undefined && uuc_details.temperature !== null ? uuc_details.temperature : "N/A",
              humidity: uuc_details.humidity !== undefined && uuc_details.humidity !== null ? uuc_details.humidity : "N/A",
              tempend: uuc_details.temperature_end ?? uuc_details.temp_end ?? uuc_details.tempend ?? response.data.data.instrument?.tempend ?? "N/A",
              humiend: uuc_details.humidity_end ?? uuc_details.humi_end ?? uuc_details.humiend ?? response.data.data.instrument?.humiend ?? "N/A",
              pressurestart: pStart,
              pressureend: pEnd,
              stabilizationtime: sTime,
              suggestedDueDate: response.data.data.instrument?.duedate || uuc_details.due_date || uuc_details.suggested_due_date || "N/A",
              certificateNo: uuc_details.certificate_no || "N/A",
              calibratedBy: uuc_details.calibrated_by,
              authorizedBy: uuc_details.authorized_by,
            };
            setEquipmentData(prev => ({
              ...prev,
              ...mappedEquipmentData,
              pressurestart: mappedEquipmentData.pressurestart !== "N/A"
                ? mappedEquipmentData.pressurestart
                : (prev.pressurestart && prev.pressurestart !== "N/A"
                  ? prev.pressurestart
                  : (dynEnv?.pressure_start || dynEnv?.pressurestart || "N/A")),
              pressureend: mappedEquipmentData.pressureend !== "N/A"
                ? mappedEquipmentData.pressureend
                : (prev.pressureend && prev.pressureend !== "N/A"
                  ? prev.pressureend
                  : (dynEnv?.pressure_end || dynEnv?.pressureend || "N/A")),
              stabilizationtime: mappedEquipmentData.stabilizationtime !== "N/A"
                ? mappedEquipmentData.stabilizationtime
                : (prev.stabilizationtime && prev.stabilizationtime !== "N/A"
                  ? prev.stabilizationtime
                  : (dynEnv?.stabilization_time || dynEnv?.stabilizationtime || "N/A")),
            }));

            if (response.data.data.instrument) {
              setRawdata({ listInstrument: response.data.data.instrument });
              if (response.data.data.instrument.daigram) {
                setDiagram(response.data.data.instrument.daigram);
              } else if (response.data.data.instrument.diagram) {
                setDiagram(response.data.data.instrument.diagram);
              }
            }

            if (response.data.data.calibrated_by) {
              setCalibratedByImageUrl(response.data.data.calibrated_by);
              console.log('✅ Calibrated By Image URL set:', response.data.data.calibrated_by);
            }

            if (response.data.data.calibrated_by_text_image) {
              setCalibratedByTextImage(response.data.data.calibrated_by_text_image);
              console.log('✅ Calibrated By Text Image URL set:', response.data.data.calibrated_by_text_image);
            }

            if (response.data.data.approvedby) {
              setApprovedByImageUrl(response.data.data.approvedby);
              console.log('✅ Approved By Image URL set:', response.data.data.approvedby);
            }

            if (response.data.data.approved_by_text_image) {
              setApprovedByTextImage(response.data.data.approved_by_text_image);
              console.log('✅ Approved By Text Image URL set:', response.data.data.approved_by_text_image);
            }
          }

          // Map master details
          if (master_details && Array.isArray(master_details)) {
            const mappedMasterData = master_details.map((master, index) => ({
              reference: master.reference_standard || master.reference || master.name || "N/A",
              srNo: master.sr_no || master.serial_no || `${index + 1}`,
              idNo: master.id_no || master.id || "N/A",
              certificate: master.certificate_no || master.certificate || master.cert_no || "N/A",
              validUpto: formatDate(master.valid_upto || master.validity || master.enddate) || "N/A"
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
  }, [instid, inwardid, caliblocation, calibacc, fetchDynamicObservations, fetchObservationData, observationTemplate]);

  // Helper functions for date formatting
  const formatDate = (dateString) => {
    if (!dateString || dateString === '0000-00-00' || dateString === 'null' || dateString === null || dateString === '-') return '-';
    if (typeof dateString === 'string') {
      const trimmed = dateString.trim();
      // If already in DD.MM.YYYY, DD/MM/YYYY, or DD-MM-YYYY format, return directly
      if (/^\d{1,2}[./-]\d{1,2}[./-]\d{2,4}$/.test(trimmed)) {
        return trimmed.replace(/-/g, '.');
      }
    }
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString('en-GB');
    } catch {
      return dateString || '-';
    }
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString || dateTimeString === '0000-00-00 00:00:00' || dateTimeString === 'null' || dateTimeString === null || dateTimeString === '-') return '';
    if (typeof dateTimeString === 'string') {
      const trimmed = dateTimeString.trim();
      // If already formatted like DD/MM/YYYY HH:mm:ss, DD.MM.YYYY, or DD-MM-YYYY
      if (/^\d{1,2}[./-]\d{1,2}[./-]\d{2,4}/.test(trimmed)) {
        return trimmed;
      }
    }
    try {
      const date = new Date(dateTimeString);
      if (isNaN(date.getTime())) return dateTimeString;
      return date.toLocaleDateString('en-GB') + ' ' + date.toLocaleTimeString('en-GB', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateTimeString || '';
    }
  };

  const handleBackToPerformCalibration = () => {
    navigate(`/dashboards/calibration-process/inward-entry-lab/perform-calibration/${inwardid}?caliblocation=${caliblocation}&calibacc=${calibacc}`);
  };

  const handlePrint = (e) => {
    if (e && (e.ctrlKey || e.metaKey || e.shiftKey || e.button === 1)) {
      return;
    }
    e?.preventDefault();
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
  const observationRows = (selectedTableData ? createObservationRows(dynamicObservations, observationTemplate, rawdata) : null) || {
    rows: [],
    matrixGroups: [],
    unitTypes: [],
    modes: [],
    hiddenInputs: { values: [], calibrationPoints: [], repeatables: [] },
    weighingCount: 0,
    repeatabilityCount: 0,
    eccentricityCount: 0,
  };
  const isYes = (val) => String(val || '').trim().toLowerCase() === 'yes';
  const biomedicalConfig = biomedicalRawData?.config || {};
  const isBiomedicalActive = isYes(biomedicalConfig.biomedical ?? 'Yes');
  const hasBiomedicalContent = observationTemplate === 'observationbiomedical' && isBiomedicalActive && (
    (isYes(biomedicalConfig.show_visual_test) && biomedicalRawData?.visual_test?.length > 0) ||
    (isYes(biomedicalConfig.show_basic_safety) && biomedicalRawData?.basic_safety?.length > 0) ||
    (isYes(biomedicalConfig.show_electrical_safety) && (biomedicalRawData?.electrical_safety?.measure?.length > 0 || biomedicalRawData?.electrical_safety?.source?.length > 0)) ||
    (isYes(biomedicalConfig.show_performance ?? biomedicalConfig.show_performance_test) && (biomedicalRawData?.performance_test?.measure?.length > 0 || biomedicalRawData?.performance_test?.source?.length > 0)) ||
    (observationRows?.rows?.length || 0) > 0
  );

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
            {itemStatus === 0 && (
              <span className="ml-3 px-2 py-0.5 text-xs font-bold text-amber-700 bg-amber-100 border border-amber-300 rounded">
                DRAFT
              </span>
            )}
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
        <div id="printable-content" className={itemStatus === 0 ? "relative bg-[url('/images/draft.png')] bg-no-repeat bg-center" : "relative"}>
          {/* Current Observation Template Display */}
          {observationType && (
            <div></div>
          )}

          {/* Details Of UUC */}
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <img src="/images/logo.png" alt="Logo" className="h-14" onError={(e) => { e.target.style.display = 'none' }} />
              {[27, 179, 174, 168, 95, 26, 24].includes(Number(instrumentInfo?.id)) && (
                <h3 className="text-sm font-bold text-gray-700">KTRC/CF/CAL/02-R1</h3>
              )}
            </div>
            {[27, 179, 174, 168, 95, 26, 24].includes(Number(instrumentInfo?.id)) ? (
              <div className="text-center my-3">
                <h2 className="text-base font-bold underline uppercase">CALIBRATION RAW DATA SHEET OF FORCE</h2>
                <h3 className="text-sm font-semibold mt-1">Details Of UUC</h3>
              </div>
            ) : (
              <h2 className="text-lg font-semibold mt-2">(Details Of UUC)</h2>
            )}
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

            {equipmentData.startedOn && equipmentData.startedOn !== "N/A" && (
              <p><b>Started On:</b> {equipmentData.startedOn}</p>
            )}
            {equipmentData.endedOn && equipmentData.endedOn !== "N/A" && (
              <p><b>Ended On:</b> {equipmentData.endedOn}</p>
            )}

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

          {/* ENHANCED Dynamic Observation Results Table */}
          {observationTemplate && tableStructure && ((observationRows?.rows?.length || 0) > 0 || hasBiomedicalContent) && (
            <>
              <h3 className="font-semibold mb-2 text-base">Calibration Results - {selectedTableData?.name}</h3>
              {/* Thermal Coefficients Table matching PHP raw data observation tables */}
              {Object.keys(thermalCoeff).length > 0 && (
                <div className="overflow-x-auto mb-4">
                  {observationTemplate !== 'observationts' && (
                    <div className="font-semibold text-sm mb-1 text-gray-800">Dimension</div>
                  )}
                  <table className="w-full border border-gray-300 text-sm">
                    <tbody>
                      <tr className="bg-white">
                        <td className="border border-gray-300 px-3 py-2 font-medium text-gray-700">
                          Thermal Co-eff of UUC
                        </td>
                        <td className="border border-gray-300 px-3 py-2 text-gray-900">
                          {thermalCoeff.uuc || ''}
                        </td>
                        <td className="border border-gray-300 px-3 py-2 font-medium text-gray-700">
                          Thermal. Co-eff of MASTER
                        </td>
                        <td className="border border-gray-300 px-3 py-2 text-gray-900">
                          {thermalCoeff.master || ''}
                        </td>
                      </tr>
                      {thermalCoeff.thickness_of_graduation && (
                        <tr className="bg-white">
                          <td className="border border-gray-300 px-3 py-2 font-medium w-1/4 text-gray-700">
                            Thickness of Graduation
                          </td>
                          <td colSpan="3" className="border border-gray-300 px-3 py-2 w-3/4 text-gray-900">
                            {thermalCoeff.thickness_of_graduation}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
              {tableStructure?.isMatrix || observationTemplate === 'observationvc' || (observationRows?.matrixGroups && observationRows.matrixGroups.length > 0) ? (
                (observationRows?.matrixGroups && observationRows.matrixGroups.length > 0
                  ? observationRows.matrixGroups
                  : [{ title: '', rows: observationRows?.rows || [] }]
                ).map((mGroup, gIdx) => (
                  <div key={gIdx} className="mb-6">
                    {mGroup.title && (
                      <div className="font-semibold text-sm mb-2 text-gray-800">
                        {mGroup.title}
                      </div>
                    )}
                    <div className="overflow-x-auto">
                      <table className="w-full border border-gray-300 text-sm">
                        <thead>
                          <tr className="bg-gray-100">
                            <th rowSpan={2} className="border border-gray-300 px-3 py-2 text-left font-medium text-gray-700">
                              Sr. No.
                            </th>
                            <th rowSpan={2} className="border border-gray-300 px-3 py-2 text-left font-medium text-gray-700">
                              Nominal/ Set Value
                            </th>
                            <th colSpan={5} className="border border-gray-300 px-3 py-2 text-center font-medium text-gray-700">
                              Observation on UUC
                            </th>
                            <th rowSpan={2} className="border border-gray-300 px-3 py-2 text-left font-medium text-gray-700">
                              Average
                            </th>
                            <th rowSpan={2} className="border border-gray-300 px-3 py-2 text-left font-medium text-gray-700">
                              Error
                            </th>
                          </tr>
                          <tr className="bg-gray-50">
                            <th className="border border-gray-300 px-2 py-1 text-xs font-medium text-gray-600">Observation 1</th>
                            <th className="border border-gray-300 px-2 py-1 text-xs font-medium text-gray-600">Observation 2</th>
                            <th className="border border-gray-300 px-2 py-1 text-xs font-medium text-gray-600">Observation 3</th>
                            <th className="border border-gray-300 px-2 py-1 text-xs font-medium text-gray-600">Observation 4</th>
                            <th className="border border-gray-300 px-2 py-1 text-xs font-medium text-gray-600">Observation 5</th>
                          </tr>
                        </thead>
                        <tbody>
                          {mGroup.rows.map((row, rIdx) => (
                            <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              {row.map((cell, cIdx) => (
                                <td key={cIdx} className="border border-gray-300 px-3 py-2">
                                  {cell !== null && cell !== undefined ? cell : ''}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))
              ) : observationTemplate === 'observationwb' ? (
                <WeighingBalanceTable observationRows={observationRows} diagram={diagram} />
              ) : observationTemplate === 'observationwbn' ? (
                <ViewObservationWBN observations={dynamicObservations} />
              ) : observationTemplate === 'observationtm' ? (
                <TMTable observationRows={observationRows} />
              ) : observationTemplate === 'observationuc' ? (
                <UCTable observationRows={observationRows} />
              ) : observationTemplate === 'observationbiomedical' ? (
                <BiomedicalTable biomedicalRawData={biomedicalRawData} dynamicObservations={dynamicObservations} />
              ) : observationTemplate === 'observationts' ? (
                <TSTable observationRows={observationRows} />
              ) : observationTemplate === 'observationautm' ? (
                <ViewObservationAUTM
                  rawdata={rawdata}
                  currentRawdata={rawdata}
                  dynamicObservations={dynamicObservations}
                />
              ) : observationTemplate === 'observationpr' ? (
                <ViewObservationPR
                  observations={dynamicObservations}
                  instrument={rawdata?.listInstrument}
                />
              ) : observationTemplate === 'observationls' ? (
                <ViewObservationLS observations={dynamicObservations} instrument={rawdata?.listInstrument} />
              ) : observationTemplate === 'observationlms' ? (
                <ViewObservationLMS observations={dynamicObservations} />
              ) : observationTemplate === 'observationutm' ? (
                <ViewObservationUTM
                  rawdata={rawdata}
                  currentRawdata={rawdata}
                  dynamicObservations={dynamicObservations}
                />
              ) : observationTemplate === 'observationmm' && observationRows?.unitTypes && observationRows.unitTypes.length > 0 ? (
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
                              {tableStructure.headers.map((header, index) => (
                                <th
                                  key={index}
                                  colSpan={header.colspan}
                                  className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-300 last:border-r-0"
                                >
                                  {header.name}
                                </th>
                              ))}
                            </tr>
                            {tableStructure.subHeadersRow.some((item) => item !== null) && (
                              <tr className="bg-gray-50 border-b border-gray-300">
                                {tableStructure.subHeadersRow.map((subHeader, index) => (
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
                                {row.map((cell, colIndex) => (
                                  <td
                                    key={colIndex}
                                    className="px-3 py-2 whitespace-nowrap text-sm border-r border-gray-200 last:border-r-0"
                                  >
                                    {cell || ''}
                                  </td>
                                ))}
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
                      <tr className="bg-gray-100">
                        {tableStructure.headers.map((header, index) => (
                          <th
                            key={index}
                            colSpan={header.colspan}
                            className="border border-gray-300 px-3 py-2 text-left font-medium text-gray-700 uppercase tracking-wider"
                          >
                            {header.name}
                          </th>
                        ))}
                      </tr>
                      {/* Sub headers row (if any) */}
                      {tableStructure.subHeadersRow.some((item) => item !== null) && (
                        <tr className="bg-gray-50">
                          {tableStructure.subHeadersRow.map((subHeader, index) => (
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
                      {(observationRows?.rows || []).map((row, rowIndex) => {
                        const isGtm = observationTemplate === 'observationgtm';
                        const rowBgClass = isGtm
                          ? (Math.floor(rowIndex / 2) % 2 === 0 ? 'bg-white' : 'bg-gray-50')
                          : (rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50');

                        return (
                          <tr key={rowIndex} className={rowBgClass}>
                            {row.map((cell, colIndex) => {
                              let rowSpanVal = undefined;
                              if (observationTemplate === 'observationdw') {
                                const isSpanCol = [0, 2, 3, 9].includes(colIndex);
                                if (isSpanCol) {
                                  if (row[1] !== '1') {
                                    return null;
                                  }
                                  // Scan ahead to count cycles for this calibration point
                                  let count = 1;
                                  for (let i = rowIndex + 1; i < (observationRows?.rows?.length || 0); i++) {
                                    if (observationRows?.rows?.[i]?.[1] === '1') {
                                      break;
                                    }
                                    count++;
                                  }
                                  rowSpanVal = count;
                                }
                              }

                              // GTM rowSpan handling matching rawdatagtm.php (rowspan=2 for Sr. No., Set Point, Range, Deviation)
                              let cellContent = cell;
                              if (observationTemplate === 'observationgtm') {
                                // Unit (col 4) is shared by the UUC and Master rows
                                const isSpanCol = [0, 1, 2, 4, 11].includes(colIndex);
                                if (isSpanCol) {
                                  if (rowIndex % 2 !== 0) {
                                    return null; // Master row omits spanned cells
                                  }
                                  rowSpanVal = 2; // UUC row spans 2 rows
                                }
                              }
                              // SW: Sr. No., Set Value, Error and Uncertainty span the UUC and Master rows (PHP rowspan="2")
                              if (observationTemplate === 'observationsw') {
                                const spansBothRows = SW_ROWSPAN_COLUMNS.includes(colIndex);
                                if (spansBothRows && row[2] !== 'UUC') return null;
                                const isStatic = spansBothRows || cellContent === '-' || cellContent === 'UUC' || cellContent === 'Master';
                                return (
                                  <td
                                    key={colIndex}
                                    rowSpan={spansBothRows ? 2 : undefined}
                                    className={`border border-gray-300 px-3 py-2 align-middle ${isStatic ? 'text-center font-medium' : ''}`}
                                  >
                                    {cellContent || ''}
                                  </td>
                                );
                              }
                              // TSWI: Sr. No., Set Point and Deviation span the UUC and Master rows (PHP rowspan="2")
                              if (observationTemplate === 'observationtswi') {
                                const spansBothRows = TSWI_ROWSPAN_COLUMNS.includes(colIndex);
                                if (spansBothRows && row[2] !== 'UUC') return null;
                                const isStatic = spansBothRows || cellContent === '-' || cellContent === 'UUC' || cellContent === 'Master';
                                return (
                                  <td
                                    key={colIndex}
                                    rowSpan={spansBothRows ? 2 : undefined}
                                    className={`border border-gray-300 px-3 py-2 align-middle ${isStatic ? 'text-center font-medium' : ''}`}
                                  >
                                    {cellContent || ''}
                                  </td>
                                );
                              }
                              // VHT: each point takes two rows (entered diagonals, converted HV) that share
                              // Sr. No., Nominal, Error and % Error
                              if (observationTemplate === 'observationvht') {
                                const spansBothRows = VHT_ROWSPAN_COLUMNS.includes(colIndex);
                                if (spansBothRows && row.vhtContinuation) return null;
                                return (
                                  <td
                                    key={colIndex}
                                    rowSpan={spansBothRows && row.vhtSpan ? 2 : undefined}
                                    className={`border border-gray-300 px-3 py-2 align-middle ${spansBothRows ? 'text-center' : ''}`}
                                  >
                                    {cellContent || ''}
                                  </td>
                                );
                              }
                              // BHT: Brinell points take two rows (diameters, converted HBW) that share
                              // Sr. No., Nominal, Unit, Error and Percent Error; direct-reading points take one
                              if (observationTemplate === 'observationbht') {
                                const spansBothRows = BHT_ROWSPAN_COLUMNS.includes(colIndex);
                                if (spansBothRows && row.bhtContinuation) return null;
                                return (
                                  <td
                                    key={colIndex}
                                    rowSpan={spansBothRows && row.bhtSpan ? 2 : undefined}
                                    className={`border border-gray-300 px-3 py-2 align-middle ${spansBothRows || cellContent === '-' ? 'text-center' : ''}`}
                                  >
                                    {cellContent || ''}
                                  </td>
                                );
                              }
                              // TSWOI: Sr. No., Set Point and Deviation span the UUC and Master rows (PHP rowspan="2")
                              if (observationTemplate === 'observationtswoi') {
                                const spansBothRows = TSWOI_ROWSPAN_COLUMNS.includes(colIndex);
                                if (spansBothRows && row[2] !== 'UUC') return null;
                                const isStatic = spansBothRows || cellContent === '-' || cellContent === 'UUC' || cellContent === 'Master';
                                return (
                                  <td
                                    key={colIndex}
                                    rowSpan={spansBothRows ? 2 : undefined}
                                    className={`border border-gray-300 px-3 py-2 align-middle ${isStatic ? 'text-center font-medium' : ''}`}
                                  >
                                    {cellContent || ''}
                                  </td>
                                );
                              }
                              // ADDED: Special handling for observationrtdwi and observationth static text and dashes
                              if ((observationTemplate === 'observationrtdwi' || observationTemplate === 'observationth') && (cellContent === '-' || cellContent === 'UUC' || cellContent === 'Master')) {
                                return (
                                  <td key={colIndex} className="border border-gray-300 px-3 py-2 text-center font-medium">
                                    {cellContent}
                                  </td>
                                );
                              }
                              // ADDED: Special handling for observationgtm static text and dashes
                              if (observationTemplate === 'observationgtm' && (cellContent === '-' || cellContent === 'UUC' || cellContent === 'Master')) {
                                return (
                                  <td key={colIndex} rowSpan={rowSpanVal} className="border border-gray-300 px-3 py-2 text-center font-medium align-middle">
                                    {cellContent}
                                  </td>
                                );
                              }
                              // NEW: ADDED Special handling for observationdg calculated/static fields (e.g., averages, errors, hysteresis are display-only, no special static text but ensure proper rendering)
                              // Last five columns; the nominal columns ahead of them vary with has_conversion
                              if (observationTemplate === 'observationdg' && colIndex >= row.length - 5) {
                                // These are calculated fields (Average Forward/Backward, Error Forward/Backward, Hysterisis) - just display as-is
                                return (
                                  <td key={colIndex} className="border border-gray-300 px-3 py-2 font-medium text-center">
                                    {cellContent || ''}
                                  </td>
                                );
                              }
                              // For UNIT_SELECT in Master row, display the unit label (assuming we have unitsList or fetch it)
                              // But since read-only and no unitsList here, just display the value
                              return (
                                <td key={colIndex} rowSpan={rowSpanVal} className={`border border-gray-300 px-3 py-2 align-middle ${rowSpanVal ? 'text-center font-medium' : ''}`}>
                                  {cellContent || ''}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              {/* Parallelism Table for Observation VC matching rawdatavc.php */}
              {observationTemplate === 'observationvc' && (
                <div className="overflow-x-auto mb-6">
                  <table className="w-full border border-gray-300 text-sm">
                    <tbody>
                      <tr className="bg-white">
                        <td className="border border-gray-300 px-3 py-2 font-medium w-1/4 text-gray-700">
                          Parallelism of external jaws (&micro;m)
                        </td>
                        <td className="border border-gray-300 px-3 py-2 w-1/4 text-gray-900">
                          {parallelism.parallinternal ? `${parallelism.parallinternal} µm` : ''}
                        </td>
                        <td className="border border-gray-300 px-3 py-2 font-medium w-1/4 text-gray-700">
                          Parallelism Of Internal Jaws (&micro;m)
                        </td>
                        <td className="border border-gray-300 px-3 py-2 w-1/4 text-gray-900">
                          {parallelism.parallexternal ? `${parallelism.parallexternal} µm` : ''}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
              {/* Parallelism Table for Observation EXM */}
              {observationTemplate === 'observationexm' && thermalCoeff.parallinternal && (
                <div className="overflow-x-auto mb-6">
                  <table className="w-full border border-gray-300 text-sm">
                    <tbody>
                      <tr className="bg-white">
                        <td className="border border-gray-300 px-3 py-2 font-medium w-1/4 text-gray-700">
                          Parallelism Of Spindle &amp; Anvil (&micro;m)
                        </td>
                        <td className="border border-gray-300 px-3 py-2 w-3/4 text-gray-900">
                          {thermalCoeff.parallinternal} µm
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
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
          {observationData.length === 0 && (observationRows?.rows?.length || 0) === 0 && (
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

          {/* Temperature End & Humidity End right below Calibration Results / Observation Table (matching PHP rawdata.php) */}
          {(equipmentData.tempend !== "N/A" || equipmentData.humiend !== "N/A" || equipmentData.pressurestart !== "N/A" || equipmentData.pressureend !== "N/A" || equipmentData.stabilizationtime !== "N/A" || observationTemplate === 'observationdw' || observationType === 'observationdw') && (
            <div className="grid grid-cols-2 gap-y-1 gap-x-8 my-4 p-3 bg-gray-50 rounded border border-gray-200 text-sm">
              {equipmentData.tempend && equipmentData.tempend !== "N/A" && (
                <p><b>Temperature End (&deg;C):</b> {equipmentData.tempend}</p>
              )}
              {equipmentData.humiend && equipmentData.humiend !== "N/A" && (
                <p><b>Humidity End (%RH):</b> {equipmentData.humiend}</p>
              )}
              {(observationTemplate === 'observationdw' || observationType === 'observationdw') && (
                <>
                  <p><b>Pressure Start:</b> {equipmentData.pressurestart || "N/A"} hpa</p>
                  <p><b>Pressure End:</b> {equipmentData.pressureend || "N/A"} hpa</p>
                  <p><b>Thermal Stabilization:</b> {equipmentData.stabilizationtime || "N/A"} hour</p>
                </>
              )}
            </div>
          )}

          {/* Footer - Electronic Signatures (Matching PHP 50/50 centered layout) */}
          <div className="grid grid-cols-2 gap-4 mt-12 pt-8 border-t text-xs">
            <div className="text-center flex flex-col items-center justify-center">
              <p className="font-bold text-sm mb-2">Calibrated by</p>
              {calibratedByImageUrl ? (
                <img
                  src={calibratedByImageUrl}
                  alt="Calibrated By Signature"
                  className="h-11 max-h-11 w-auto object-contain mb-1"
                  onError={(e) => {
                    console.error('❌ Failed to load calibrated_by image:', calibratedByImageUrl);
                    e.target.style.display = 'none';
                  }}
                />
              ) : (
                <div className="h-11 flex items-center justify-center text-gray-400 italic">
                  (Signature)
                </div>
              )}
              {calibratedByTextImage && (
                <img
                  src={calibratedByTextImage}
                  alt="Calibrated By Details"
                  className="h-14 w-auto object-contain mt-1"
                  onError={(e) => {
                    console.error('❌ Failed to load calibrated_by_text_image:', calibratedByTextImage);
                    e.target.style.display = 'none';
                  }}
                />
              )}
            </div>

            <div className="text-center flex flex-col items-center justify-center">
              <p className="font-bold text-sm mb-2">Authorised By</p>
              {approvedByImageUrl ? (
                <img
                  src={approvedByImageUrl}
                  alt="Authorized By Signature"
                  className="h-11 max-h-11 w-auto object-contain mb-1"
                  onError={(e) => {
                    console.error('❌ Failed to load approvedby image:', approvedByImageUrl);
                    e.target.style.display = 'none';
                  }}
                />
              ) : (
                <div className="h-11 flex items-center justify-center text-gray-400 italic">
                  (Signature)
                </div>
              )}
              {approvedByTextImage && (
                <img
                  src={approvedByTextImage}
                  alt="Authorized By Details"
                  className="h-14 w-auto object-contain mt-1"
                  onError={(e) => {
                    console.error('❌ Failed to load approved_by_text_image:', approvedByTextImage);
                    e.target.style.display = 'none';
                  }}
                />
              )}
            </div>
          </div>



        </div>

        <hr className="my-4 border-t" />

        {/* Action Buttons - Hidden on print */}
        <div className="mt-6 flex gap-3 no-print">
          <Link
            to={reportUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-indigo-500 hover:bg-fuchsia-500 text-white px-6 py-2 rounded inline-flex items-center justify-center font-medium transition-colors cursor-pointer"
            onClick={handlePrint}
          >
            Print Report
          </Link>
        </div>
      </div>
    </>
  );
}
