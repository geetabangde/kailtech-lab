
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Page } from 'components/shared/Page';
import { Button } from 'components/ui/Button';
import { toast } from 'sonner';
import axios from 'utils/axios';
import Select from 'react-select';
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
  const [observationErrors, setObservationErrors] = useState({});
  const [errors, setErrors] = useState({});
  const [leastCountData, setLeastCountData] = useState({});
  const [tableInputValues, setTableInputValues] = useState({});
  const [thermalCoeff, setThermalCoeff] = useState({
    uuc: '',
    master: '',
    thickness_of_graduation: '',
  });
  const [customLayout, setCustomLayout] = useState(null);
  const [backendColumns, setBackendColumns] = useState(null);
  const [savedRowLayout, setSavedRowLayout] = useState(null);
  const [table1Columns, setTable1Columns] = useState([]);
  const [observationCount, setObservationCount] = useState(5);
  const [loadedRepeatCount, setLoadedRepeatCount] = useState(null);

  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) return savedTheme;
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
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

  // Helper function to safely format date
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return date.toISOString().split('T')[0];
    } catch {
      console.warn('Invalid date format:', dateString);
      return '';
    }
  };

  const [unitsList, setUnitsList] = useState([]);




  // Fetch units list for ReactSelect
  useEffect(() => {
    const fetchUnits = async () => {
      try {
        const response = await axios.get(`${JWT_HOST_API}/master/units-list`);
        if (response.data.status && response.data.data) {
          setUnitsList(response.data.data.map(unit => ({
            value: unit.id,
            label: unit.name
          })));
        }
      } catch (error) {
        console.error('Error fetching units:', error);
      }
    };

    // ✅ CHANGED: Fetch units for both RTD WI and GTM
    if (observationTemplate === 'observationrtdwi' || observationTemplate === 'observationgtm') {
      fetchUnits();
    }
  }, [observationTemplate]);

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
        setMasters(data.masters || []);
        setSupportMasters(data.supportMasters || []);
        setObservationTemplate(data.observationTemplate);
        setTemperatureRange(data.temperatureRange);
        setHumidityRange(data.humidityRange);

        setFormData((prev) => ({
          ...prev,
          enddate: formatDateForInput(data.instrument?.enddate),
          humiend: data.instrument?.humiend || '',
          tempend: data.instrument?.tempend || '',
          duedate: formatDateForInput(data.instrument?.duedate),
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

  useEffect(() => {
    const fetchCustomLayout = async () => {
      if (!observationTemplate) return;

      let resolvedFormatId = null;
      let fallbackLayout = null;

      // 1. Resolve formatId from observationTemplate suffix using /get-formate
      try {
        const suffix = observationTemplate === "observationexm"
          ? "exten"
          : observationTemplate.startsWith("observation")
            ? observationTemplate.replace("observation", "")
            : observationTemplate;

        const authToken = localStorage.getItem("authToken");
        const response = await axios.get("/get-formate", {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        });

        if (response.data && Array.isArray(response.data.data)) {
          const match = response.data.data.find(
            (item) => item.description === suffix || item.description === observationTemplate
          );
          if (match) {
            resolvedFormatId = match.id;
          }
        }
      } catch (error) {
        console.error("Error resolving formatId in CalibrateStep3:", error);
      }

      // 2. Fetch layout from the dedicated format layout endpoint if formatId is resolved
      if (resolvedFormatId) {
        try {
          const authToken = localStorage.getItem("authToken");
          const response = await axios.get(
            `/observationlayout/get-formate-layout/${instrument?.instid || instId}`,
            {
              headers: {
                Authorization: `Bearer ${authToken}`,
                "Content-Type": "application/json",
              },
            }
          );
          const resData = response.data;
          if (resData && (resData.success || resData.status === "true" || resData.status === true)) {
            const dataVal = resData.data;
            if (dataVal && dataVal.observation_repeat !== undefined && dataVal.observation_repeat !== null) {
              const repeatVal = parseInt(dataVal.observation_repeat);
              setObservationCount(repeatVal);
              setLoadedRepeatCount(repeatVal);
            } else if (dataVal && Array.isArray(dataVal.columns) && dataVal.columns.length > 0 && dataVal.columns[0].observation_repeat !== undefined && dataVal.columns[0].observation_repeat !== null) {
              const repeatVal = parseInt(dataVal.columns[0].observation_repeat);
              setObservationCount(repeatVal);
              setLoadedRepeatCount(repeatVal);
            }
            if (Array.isArray(dataVal)) {
              setBackendColumns(dataVal);
              return;
            } else if (dataVal && Array.isArray(dataVal.columns)) {
              let columnsArray = dataVal.columns;
              let t1Cols = [];
              if (columnsArray.length > 0 && typeof columnsArray[0].column_key === 'string' && (columnsArray[0].column_key.startsWith('[') || columnsArray[0].column_key.startsWith('{'))) {
                try {
                  let currentParsed = JSON.parse(columnsArray[0].column_key);
                  let finalCols = null;

                  while (currentParsed) {
                    if (Array.isArray(currentParsed)) {
                      finalCols = currentParsed;
                      break;
                    } else if (typeof currentParsed === 'object' && currentParsed.columns) {
                      finalCols = currentParsed.columns;
                      if (currentParsed.row_layout) {
                        setSavedRowLayout(currentParsed.row_layout);
                      }
                      if (Array.isArray(currentParsed.table1)) {
                        t1Cols = currentParsed.table1;
                      }

                      if (finalCols.length > 0 && typeof finalCols[0].column_key === 'string' && (finalCols[0].column_key.startsWith('[') || finalCols[0].column_key.startsWith('{'))) {
                        currentParsed = JSON.parse(finalCols[0].column_key);
                      } else {
                        break;
                      }
                    } else {
                      break;
                    }
                  }

                  if (finalCols) {
                    columnsArray = finalCols;
                  }
                } catch (e) {
                  console.error("Failed to parse column_key string:", e);
                }
              } else {
                if (dataVal.row_layout) {
                  setSavedRowLayout(dataVal.row_layout);
                }
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
          console.warn("Failed to fetch layout from new endpoint in CalibrateStep3, falling back...", error);
        }
      }

      // 3. Fallback layout if the dedicated layout fetch failed/empty
      if (instrument?.instid || instId) {
        try {
          const authToken = localStorage.getItem("authToken");
          const response = await axios.get(
            `/observationsetting/get-observation-setting/${instrument?.instid || instId}`,
            {
              headers: {
                Authorization: `Bearer ${authToken}`,
                "Content-Type": "application/json",
              },
            }
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
          console.error("Error fetching custom layout from fallback in CalibrateStep3:", error);
        }
      }

      if (fallbackLayout) {
        setCustomLayout(fallbackLayout);
      }
    };

    fetchCustomLayout();
  }, [instId, observationTemplate, instrument]);

  const getObservationSubheaders = (templateId, count) => {
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
  };

  const createObservationRows = (observationData, template, count = 5) => {
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
        calibrationPoints.push(obs.calibration_point_id?.toString() || '');
        types.push('uuc');
        repeatables.push('0');
        values.push(safeGetValue(obs.uuc_value || obs.set_pressure_uuc) || '0');
      });
    }
    else if (template === 'observationdg') {
      dataArray.forEach((point) => {
        if (!point) return;
        const row = [
          point.sr_no?.toString() || '',
          safeGetValue(point.nominal_value_master),
          safeGetValue(point.set1_forward),
          safeGetValue(point.set1_backward),
          safeGetValue(point.set2_forward),
          safeGetValue(point.set2_backward),
          safeGetValue(point.average_forward),
          safeGetValue(point.average_backward),
          safeGetValue(point.error_forward),
          safeGetValue(point.error_backward),
          safeGetValue(point.hysterisis)
        ];
        rows.push(row);
        calibrationPoints.push(point.point_id?.toString() || '');
        types.push('master');
        repeatables.push('0');
        values.push(safeGetValue(point.nominal_value_master) || '0');
      });
    }
    else if (template === 'observationppg') {
      dataArray.forEach((obs) => {
        if (!obs) return;
        const row = [
          obs.sr_no?.toString() || '',
          safeGetValue(obs.uuc_value),
          safeGetValue(obs.converted_uuc_value),
          ...Array.from({ length: count }, (_, i) => safeGetValue(obs.master_readings?.[`m${i + 1}`] || obs[`m${i + 1}`])),
          safeGetValue(obs.average_master),
          safeGetValue(obs.error),
          safeGetValue(obs.repeatability),
          safeGetValue(obs.hysterisis || obs.hysteresis),
        ];
        rows.push(row);
        calibrationPoints.push(obs.calibration_point_id?.toString() || '');
        types.push('uuc');
        repeatables.push('0');
        values.push(safeGetValue(obs.uuc_value) || '0');
      });
    } else if (template === 'observationmsr') {
      dataArray.forEach((point) => {
        if (!point) return;
        const observations = safeGetArray(point.observations, count);
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
        rows.push(row);
        calibrationPoints.push(point.point_id?.toString() || '');
        types.push('uuc');
        repeatables.push(point.repeatable_cycle?.toString() || count.toString());
        values.push(safeGetValue(point.nominal_value || point.uuc_value) || '0');
      });
    }
    else if (template === 'observationgtm') {
      dataArray.forEach((point) => {
        if (!point) return;
        const srNo = point.sr_no?.toString() || '';
        const setPoint = safeGetValue(point.set_point);
        const range = safeGetValue(point.range);

        // UUC Row
        const uucReadings = safeGetArray(point.uuc_values, count);
        while (uucReadings.length < count) {
          uucReadings.push('');
        }
        const uucRow = [
          srNo,
          setPoint,
          'UUC',
          range,
          safeGetValue(point.unit),
          '-',
          ...uucReadings.slice(0, count).map(val => safeGetValue(val)),
          '-',
          safeGetValue(point.average_uuc),
          safeGetValue(point.error),
        ];
        rows.push(uucRow);
        calibrationPoints.push(point.point_id?.toString() || "1");
        types.push('uuc');
        repeatables.push('1');
        values.push(setPoint || "0");

        // Master Row
        const masterReadings = safeGetArray(point.master_values, count);
        while (masterReadings.length < count) {
          masterReadings.push('');
        }
        const masterRow = [
          '-',
          '-',
          'Master',
          '-',
          'UNIT_SELECT',
          safeGetValue(point.sensitivity_coefficient),
          ...masterReadings.slice(0, count).map(val => safeGetValue(val)),
          safeGetValue(point.average_master),
          safeGetValue(point.converted_average_master),
          '-',
        ];
        rows.push(masterRow);
        calibrationPoints.push(point.point_id?.toString() || "1");
        types.push('master');
        repeatables.push('1');
        values.push(setPoint || "0");
      });
    }
    else if (template === 'observationavg') {
      dataArray.forEach((point) => {
        if (!point) return;
        const row = [
          point.sr_no?.toString() || '',
          safeGetValue(point.set_point_uuc),
          safeGetValue(point.calculated_uuc),
          ...Array.from({ length: count }, (_, i) => safeGetValue(point.master_readings?.[i])),
          safeGetValue(point.average_master),
          safeGetValue(point.error),
          safeGetValue(point.hysteresis),
        ];
        rows.push(row);
        calibrationPoints.push(point.point_id?.toString() || '');
        types.push('master');
        repeatables.push('0');
        values.push(safeGetValue(point.set_point_uuc) || '0');
      });
    }
    else if (template === 'observationrtdwi') {
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
        while (uucReadings.length < count) {
          uucReadings.push('');
        }
        const uucRow = [
          srNo,
          setPoint,
          'UUC',
          safeGetValue(point.unit),
          safeGetValue(point.sensitivity_coefficient),
          ...uucReadings.slice(0, count).map(val => safeGetValue(val)),
          '-',
          '-',
          '-',
          safeGetValue(point.average_uuc),
          safeGetValue(point.error),
        ];
        rows.push(uucRow);
        calibrationPoints.push(point.point_id?.toString() || "1");
        types.push('uuc');
        repeatables.push('1');
        values.push(setPoint || "0");

        // Master Row
        const masterReadings = safeGetArray(point.master_values, count);
        while (masterReadings.length < count) {
          masterReadings.push('');
        }
        const masterRow = [
          '-',
          '-',
          'Master',
          'UNIT_SELECT',
          '-',
          ...masterReadings.slice(0, count).map(val => safeGetValue(val)),
          safeGetValue(point.average_master),
          safeGetValue(point.ambient_master),
          safeGetValue(point.s_average_master),
          safeGetValue(point.c_average_master),
          '-',
        ];
        rows.push(masterRow);
        calibrationPoints.push(point.point_id?.toString() || "1");
        types.push('master');
        repeatables.push('1');
        values.push(setPoint || "0");
      });
    }
    else if (template === 'observationmg') {
      dataArray.forEach((point) => {
        if (!point) return;
        const row = [
          point.sequence_number?.toString() || point.sr_no?.toString() || '',
          safeGetValue(point.set_pressure?.uuc_value || point.uuc_value),
          safeGetValue(point.set_pressure?.converted_value || point.converted_uuc_value || point.set_pressure?.uuc_value),
          ...Array.from({ length: count }, (_, i) => safeGetValue(point.observations?.[`master_${i + 1}`] || point[`m${i + 1}`])),
          safeGetValue(point.calculations?.mean || point.mean || point.average_master),
          safeGetValue(point.calculations?.error || point.error),
          safeGetValue(point.calculations?.hysteresis || point.hysterisis || point.hysteresis),
        ];
        rows.push(row);
        calibrationPoints.push(point.point_id?.toString() || point.calibration_point_id?.toString() || '');
        types.push('master');
        repeatables.push('0');
        values.push(safeGetValue(point.set_pressure?.uuc_value || point.uuc_value) || '0');
      });
    }
    else if (template === 'observationfg') {
      dataArray.forEach((point) => {
        if (!point) return;
        const observations = safeGetArray(point.observations, count);
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
        rows.push(row);
        calibrationPoints.push(point.point_id?.toString() || '');
        types.push('input');
        repeatables.push(point.repeatable_cycle?.toString() || count.toString());
        values.push(safeGetValue(point.nominal_value || point.test_point) || '0');
      });
    }
    else if (template === 'observationmm') {
      const allRows = [];
      const allCalibrationPoints = [];
      const allTypes = [];
      const allRepeatables = [];
      const allValues = [];
      const unitTypes = [];
      dataArray.forEach((unitTypeGroup) => {
        if (!unitTypeGroup || !unitTypeGroup.calibration_points) return;
        unitTypes.push(unitTypeGroup);
        unitTypeGroup.calibration_points.forEach((point, pointIndex) => {
          if (!point) return;
          const observations = [];
          if (point.observations && Array.isArray(point.observations)) {
            for (let i = 0; i < count; i++) {
              observations.push(point.observations[i]?.value || '');
            }
          }
          while (observations.length < count) {
            observations.push('');
          }
          const row = [
            point.sequence_number?.toString() || (pointIndex + 1).toString(),
            point.mode || 'Measure',
            point.range || '',
            (point.nominal_values?.calculated_master?.value || '') + (point.nominal_values?.calculated_master?.unit ? ' ' + point.nominal_values.calculated_master.unit : ''),
            (point.nominal_values?.master?.value || '') + (point.nominal_values?.master?.unit ? ' ' + point.nominal_values.master.unit : ''),
            ...observations,
            point.calculations?.average || '',
            point.calculations?.error || ''
          ];
          allRows.push(row);
          allCalibrationPoints.push(point.point_id?.toString() || (allRows.length).toString());
          allTypes.push('input');
          allRepeatables.push('1');
          allValues.push(point.nominal_values?.master?.value || "0");
        });
      });
      return {
        rows: allRows,
        hiddenInputs: {
          calibrationPoints: allCalibrationPoints,
          types: allTypes,
          repeatables: allRepeatables,
          values: allValues
        },
        unitTypes: unitTypes
      };
    }
    else if (template === 'observationexm') {
      dataArray.forEach((point) => {
        if (!point) return;
        const observations = safeGetArray(point.observations, count);
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
        rows.push(row);
        calibrationPoints.push(point.point_id?.toString() || '');
        types.push('uuc');
        repeatables.push(point.repeatable_cycle?.toString() || count.toString());
        values.push(safeGetValue(point.nominal_value || point.test_point) || '0');
      });
    } else if (template === 'observationhg') {
      dataArray.forEach((point) => {
        if (!point) return;
        const observations = safeGetArray(point.observations, count);
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
        rows.push(row);
        calibrationPoints.push(point.point_id?.toString() || '');
        types.push('uuc');
        repeatables.push(point.repeatable_cycle?.toString() || count.toString());
        values.push(safeGetValue(point.nominal_value || point.test_point) || '0');
      });
    }
    else if (template === 'observationodfm') {
      dataArray.forEach((point) => {
        if (!point) return;
        const observations = safeGetArray(point.observations, count);
        while (observations.length < count) {
          observations.push('');
        }
        const row = [
          point.sr_no?.toString() || '',
          safeGetValue(point.range),
          safeGetValue(point.nominal_value || point.uuc_value),
          ...observations.slice(0, count).map((obs) => safeGetValue(obs)),
          safeGetValue(point.average),
          safeGetValue(point.error),
        ];
        rows.push(row);
        calibrationPoints.push(point.point_id?.toString() || '');
        types.push('input');
        repeatables.push(point.metadata?.repeatable_cycle?.toString() || count.toString());
        values.push(safeGetValue(point.nominal_value || point.uuc_value) || '0');
      });
    } else if (template === 'observationapg') {
      dataArray.forEach((obs) => {
        if (!obs) return;
        const row = [
          obs.sr_no?.toString() || '',
          obs.uuc,
          obs.calculated_uuc,
          ...Array.from({ length: count }, (_, i) => safeGetValue(obs[`m${i + 1}`])),
          obs.mean,
          obs.error,
          obs.hysterisis,
        ];
        rows.push(row);
        calibrationPoints.push(obs.calibration_point_id?.toString() || '');
        types.push('input');
        repeatables.push('1');
        values.push(safeGetValue(obs.uuc) || '0');
      });
    } else if (template === 'observationit') {
      dataArray.forEach((point) => {
        if (!point) return;
        const observations = safeGetArray(point.observations, count);
        while (observations.length < count) {
          observations.push('');
        }
        const row = [
          point.sequence_number?.toString() || point.sr_no?.toString() || '',
          safeGetValue(point.nominal_value || point.test_point),
          ...observations.slice(0, count).map(obs => safeGetValue(obs)),
          safeGetValue(point.average),
          safeGetValue(point.error),
        ];
        rows.push(row);
        calibrationPoints.push(point.point_id?.toString() || '');
        types.push('input');
        repeatables.push(point.repeatable_cycle?.toString() || count.toString());
        values.push(safeGetValue(point.nominal_value || point.test_point) || '0');
      });
    }
    else if (template === 'observationmt') {
      dataArray.forEach((point) => {
        if (!point) return;
        const observations = safeGetArray(point.observations, count);
        while (observations.length < count) {
          observations.push('');
        }
        const row = [
          point.sequence_number?.toString() || point.sr_no?.toString() || '',
          safeGetValue(point.nominal_value || point.test_point),
          ...observations.slice(0, count).map(obs => safeGetValue(obs)),
          safeGetValue(point.average),
          safeGetValue(point.error),
        ];
        rows.push(row);
        calibrationPoints.push(point.point_id?.toString() || '');
        types.push('input');
        repeatables.push(point.repeatable_cycle?.toString() || count.toString());
        values.push(safeGetValue(point.nominal_value || point.test_point) || '0');
      });
    }
    else if (template === 'observationctg') {
      dataArray.forEach((point) => {
        const observations = safeGetArray(point?.observations, count);
        while (observations.length < count) {
          observations.push('');
        }
        const row = [
          point?.sr_no?.toString() || '',
          point?.nominal_value || '',
          ...observations.slice(0, count).map((obs) => safeGetValue(obs)),
          safeGetValue(point?.average),
          safeGetValue(point?.error),
        ];
        rows.push(row);
        calibrationPoints.push(point?.id?.toString() || '');
        types.push('uuc');
        repeatables.push('0');
        values.push(safeGetValue(point?.nominal_value) || '0');
      });
    }
    else if (template === 'observationtswoi') {
      dataArray.forEach((point) => {
        if (!point) return;
        let row;
        if (backendColumns && backendColumns.length > 0) {
          // Dynamic mapping if columns exist
          row = backendColumns.map(col => {
            const colKey = col.column_key || col.key;
            if (colKey === 'value_of' && savedRowLayout) {
              const rType = point.value_of === 'Master' ? 'master' : 'uuc';
              const matchedRowConfig = savedRowLayout.find(r => r.type === rType);
              return matchedRowConfig ? matchedRowConfig.label : (point.value_of || '');
            }
            if (point.value_of === 'Master' || (savedRowLayout && savedRowLayout.find(r => r.type === 'master')?.label === point.value_of)) {
              if (colKey === 'averageuuc') return point['averagemaster'] !== undefined && point['averagemaster'] !== null ? point['averagemaster'] : '';
              if (colKey === 'ambientuuc') return point['ambientmaster'] !== undefined && point['ambientmaster'] !== null ? point['ambientmaster'] : '';
              if (colKey === 'saverageuuc') return point['saveragemaster'] !== undefined && point['saveragemaster'] !== null ? point['saveragemaster'] : '';
              if (colKey === 'caverageuuc') return point['caveragemaster'] !== undefined && point['caveragemaster'] !== null ? point['caveragemaster'] : '';
              // Note: 'error' stays 'error' because Deviation (Unit) relies on the previous row usually, or it's just 'error' for both.
            }
            return point[colKey] !== undefined && point[colKey] !== null ? point[colKey] : '';
          });
        } else {
          // Fallback to hardcoded array
          const isMaster = point.value_of === 'Master' || (savedRowLayout && savedRowLayout.find(r => r.type === 'master')?.label === point.value_of);
          row = [
            point.sr_no || '',
            point.setpoint || '',
            point.value_of || '',
            point.uucunit || '',
            point.sensitivitycoefficient || '',
            point.uuc0 || '',
            point.uuc1 || '',
            point.uuc2 || '',
            point.uuc3 || '',
            point.uuc4 || '',
            isMaster ? (point.averagemaster || '') : (point.averageuuc || ''),
            isMaster ? (point.ambientmaster || '') : (point.ambientuuc || ''),
            isMaster ? (point.saveragemaster || '') : (point.saverageuuc || ''),
            isMaster ? (point.caveragemaster || '') : (point.caverageuuc || ''),
            point.error || ''
          ];
        }
        rows.push(row);
        calibrationPoints.push(point.calibration_point_id?.toString() || '');
        types.push(point.value_of === 'Master' ? 'master' : 'uuc');
        repeatables.push('0');
        values.push(point.setpoint || '0');
      });
    }

    return { rows, hiddenInputs: { calibrationPoints, types, repeatables, values } };
  };

  const getObservationTables = (count = 5) => {
    return [
      {
        id: 'observationdpg',
        name: 'Observation DPG',
        category: 'Pressure',
        structure: {
          singleHeaders: [{ name: 'SR NO', key: 'sr_no' }, { name: 'SET PRESSURE ON UUC (CALCULATIONUNIT)', key: 'uuc' }, { name: '[SET PRESSURE ON UUC (MASTERUNIT)]', key: 'calculatedmaster' }],
          subHeaders: {
            'OBSERVATION ON UUC': getObservationSubheaders('observationdpg', count).map((name, i) => ({ name, key: `master_${i}` })),
          },
          remainingHeaders: [{ name: 'MEAN (UUCUNIT)', key: 'averagemaster' }, { name: 'ERROR (UUCUNIT)', key: 'error' }, { name: 'REPEATABILITY (UUCUNIT)', key: 'repeatability' }, { name: 'HYSTERISIS (UUCUNIT)', key: 'hysterisis' }],
        },
        staticRows: createObservationRows(observations, 'observationdpg', count).rows,
        hiddenInputs: createObservationRows(observations, 'observationdpg', count).hiddenInputs,
      },
      {
        id: 'observationgtm',
        name: 'Observation GTM',
        category: 'Temperature',
        structure: {
          singleHeaders: [{ name: 'Sr. No.', key: 'sr_no' }, { name: 'Set Point (°C)', key: 'set_point' }, { name: 'Value Of', key: 'value_of' }, { name: 'Range', key: 'range' }, { name: 'Unit', key: 'unit' }, { name: 'Sensitivity Coefficient', key: 'sensitivity_coeff' }],
          subHeaders: {
            'Observation': getObservationSubheaders('observationgtm', count).map((name, i) => ({ name, key: `obs_${i}` })).map((name, i) => ({ name, key: `obs_${i}` }))
          },
          remainingHeaders: [{ name: 'Average (Ω)', key: 'avg_omega' }, { name: 'Average (°C)', key: 'avg_c' }, { name: 'Deviation (°C)', key: 'deviation' }]
        },
        staticRows: createObservationRows(observations, 'observationgtm', count).rows,
        hiddenInputs: createObservationRows(observations, 'observationgtm', count).hiddenInputs
      }, {
        id: 'observationdg',
        name: 'Observation DG',
        category: 'Digital Gauge',
        structure: {
          thermalCoeff: true,
          singleHeaders: [{ name: 'Sr no', key: 'sr_no' }, { name: 'Nominal Value (Master Unit)', key: 'master' }],
          subHeaders: {
            'Set 1': [{ name: 'Set 1 Forward Reading', key: 'masterinc' }, { name: 'Set 1 Backward Reading', key: 'masterdec' }],
            'Set 2': [{ name: 'Set 2 Forward Reading', key: 'masterinc' }, { name: 'Set 2 Backward Reading', key: 'masterdec' }],
            'Average (mm)': [{ name: 'Average Forward Reading', key: 'averagemasterinc' }, { name: 'Average Backward Reading', key: 'averagemasterdec' }],
            'Error (mm)': [{ name: 'Error Forward Reading', key: 'errorinc' }, { name: 'Error Backward Reading', key: 'errordec' }]
          },
          remainingHeaders: [{ name: 'Hysterisis', key: 'hysterisis' }]
        },
        staticRows: createObservationRows(observations, 'observationdg', count).rows,
        hiddenInputs: createObservationRows(observations, 'observationdg', count).hiddenInputs
      },
      {
        id: 'observationmsr',
        name: 'Observation MSR',
        category: 'Measuring',
        structure: {
          thermalCoeff: true,
          singleHeaders: [{ name: 'Sr. No.', key: 'sr_no' }, { name: 'Nominal/ Set Value', key: 'master' }],
          subHeaders: {
            'Observation on UUC': getObservationSubheaders('observationmsr', count).map((name, i) => ({ name, key: `uuc_${i}` })).map((name, i) => ({ name, key: `uuc_${i}` }))
          },
          remainingHeaders: [{ name: 'Average', key: 'averageuuc' }, { name: 'Error', key: 'error' }]
        },
        staticRows: createObservationRows(observations, 'observationmsr', count).rows,
        hiddenInputs: createObservationRows(observations, 'observationmsr', count).hiddenInputs
      },
      {
        id: 'observationrtdwi',
        name: 'Observation RTD WI',
        category: 'RTD',
        structure: {
          singleHeaders: [{ name: 'Sr. No.', key: 'sr_no' }, { name: 'Set Point (°C)', key: 'set_point' }, { name: 'Value Of', key: 'value_of' }, { name: 'Unit', key: 'unit' }, { name: 'Sensitivity Coefficient', key: 'sensitivity_coeff' }],
          subHeaders: {
            'Observation': getObservationSubheaders('observationrtdwi', count).map((name, i) => ({ name, key: `obs_${i}` })).map((name, i) => ({ name, key: `obs_${i}` }))
          },
          remainingHeaders: [{ name: 'Average', key: 'avg' }, { name: 'mV generated On ambient', key: 'mv_ambient' }, { name: 'Average with corrected mv', key: 'avg_corrected_mv' }, { name: 'Average (°C)', key: 'avg_c' }, { name: 'Deviation (°C)', key: 'deviation' }]
        },
        staticRows: createObservationRows(observations, 'observationrtdwi', count).rows,
        hiddenInputs: createObservationRows(observations, 'observationrtdwi', count).hiddenInputs
      }, {
        id: 'observationppg',
        name: 'Observation PPG',
        category: 'Pressure',
        structure: {
          singleHeaders: [{ name: 'SR NO', key: 'sr_no' }, { name: 'SET PRESSURE ON UUC (CALCULATIONUNIT)', key: 'uuc' }, { name: '[SET PRESSURE ON UUC (MASTERUNIT)]', key: 'calculatedmaster' }],
          subHeaders: {
            'OBSERVATION ON UUC': getObservationSubheaders('observationppg', count).map((name, i) => ({ name, key: `master_${i}` })),
          },
          remainingHeaders: [{ name: 'MEAN (UUCUNIT)', key: 'averagemaster' }, { name: 'ERROR (UUCUNIT)', key: 'error' }, { name: 'REPEATABILITY (UUCUNIT)', key: 'repeatability' }, { name: 'HYSTERISIS (UUCUNIT)', key: 'hysterisis' }],
        },
        staticRows: createObservationRows(observations, 'observationppg', count).rows,
        hiddenInputs: createObservationRows(observations, 'observationppg', count).hiddenInputs,
      }, {
        id: 'observationavg',
        name: 'Observation AVG',
        category: 'Pressure',
        structure: {
          singleHeaders: [{ name: 'Sr no', key: 'sr_no' }, { name: 'Set Pressure on UUC (UUC Unit)', key: 'uuc' }, { name: '[Set Pressure on UUC (Master Unit)]', key: 'calculatedmaster' }],
          subHeaders: {
            'Observation on Master': getObservationSubheaders('observationavg', count).map((name, i) => ({ name, key: `master_${i}` })).map((name, i) => ({ name, key: `master_${i}` }))
          },
          remainingHeaders: [{ name: 'Mean (Master Unit)', key: 'averagemaster' }, { name: 'Error (Master Unit)', key: 'error' }, { name: 'Hysteresis (Master Unit)', key: 'hysterisis' }]
        },
        staticRows: createObservationRows(observations, 'observationavg', count).rows,
        hiddenInputs: createObservationRows(observations, 'observationavg', count).hiddenInputs
      }, {
        id: 'observationhg',
        name: 'Observation HG',
        category: 'Height Gauge',
        structure: {
          thermalCoeff: true,
          singleHeaders: [{ name: 'Sr. No.', key: 'sr_no' }, { name: 'Nominal/ Set Value', key: 'master' }],
          subHeaders: {
            'Observation on UUC': getObservationSubheaders('observationhg', count).map((name, i) => ({ name, key: `uuc_${i}` })).map((name, i) => ({ name, key: `uuc_${i}` }))
          },
          remainingHeaders: [{ name: 'Average', key: 'averageuuc' }, { name: 'Error', key: 'error' }]
        },
        staticRows: createObservationRows(observations, 'observationhg', count).rows,
        hiddenInputs: createObservationRows(observations, 'observationhg', count).hiddenInputs
      }, {
        id: 'observationfg',
        name: 'Observation FG',
        category: 'Force Gauge',
        structure: {
          thermalCoeff: true,
          singleHeaders: [{ name: 'Sr. No.', key: 'sr_no' }, { name: 'Nominal Value', key: 'master' }],
          subHeaders: {
            'Observation on UUC': getObservationSubheaders('observationfg', count).map((name, i) => ({ name, key: `master_${i}` })).map((name, i) => ({ name, key: `master_${i}` }))
          },
          remainingHeaders: [{ name: 'Average (Master)', key: 'averagemaster' }, { name: 'Error', key: 'error' }]
        },
        staticRows: createObservationRows(observations, 'observationfg', count).rows,
        hiddenInputs: createObservationRows(observations, 'observationfg', count).hiddenInputs,
      }, {
        id: 'observationmm',
        name: 'Observation MM',
        category: 'Multimeter',
        structure: {
          singleHeaders: [{ name: 'Sr. No.', key: 'sr_no' }, { name: 'Mode', key: 'mode' }, { name: 'Range', key: 'range' }, { name: 'Nominal/ Set Value on master (Calculated)', key: 'calculatedmaster' }, { name: 'Nominal/ Set Value on master', key: 'master' }],
          subHeaders: {
            'Observation on UUC': getObservationSubheaders('observationmm', count).map((name, i) => ({ name, key: `uuc_${i}` })).map((name, i) => ({ name, key: `uuc_${i}` }))
          },
          remainingHeaders: [{ name: 'Average', key: 'averageuuc' }, { name: 'Error', key: 'error' }]
        },
        staticRows: createObservationRows(observations, 'observationmm', count).rows,
        hiddenInputs: createObservationRows(observations, 'observationmm', count).hiddenInputs,
      }, {
        id: 'observationexm',
        name: 'Observation EXM',
        category: 'External Micrometer',
        structure: {
          thermalCoeff: true,
          singleHeaders: [{ name: 'Sr. No.', key: 'sr_no' }, { name: 'Nominal/ Set Value', key: 'master' }],
          subHeaders: {
            'Observation on UUC': getObservationSubheaders('observationexm', count).map((name, i) => ({ name, key: `uuc_${i}` })).map((name, i) => ({ name, key: `uuc_${i}` }))
          },
          remainingHeaders: [{ name: 'Average', key: 'averageuuc' }, { name: 'Error', key: 'error' }]
        },
        staticRows: createObservationRows(observations, 'observationexm', count).rows,
        hiddenInputs: createObservationRows(observations, 'observationexm', count).hiddenInputs
      }, {
        id: 'observationmg',
        name: 'Observation MG',
        category: 'Manometer',
        structure: {
          singleHeaders: [{ name: 'Sr no', key: 'sr_no' }, { name: 'Set Pressure on UUC ([unit])', key: 'uuc' }, { name: '[Set Pressure on UUC ([master unit])]', key: 'calculatedmaster' }],
          subHeaders: {
            'Observation on UUC': getObservationSubheaders('observationmg', count).map((name, i) => ({ name, key: `master_${i}` })).map((name, i) => ({ name, key: `master_${i}` }))
          },
          remainingHeaders: [{ name: 'Mean ([master unit])', key: 'averagemaster' }, { name: 'Error ([master unit])', key: 'error' }, { name: 'Hysterisis ([master unit])', key: 'hysterisis' }]
        },
        staticRows: createObservationRows(observations, 'observationmg', count).rows,
        hiddenInputs: createObservationRows(observations, 'observationmg', count).hiddenInputs,
      }, {
        id: 'observationodfm',
        name: 'Observation ODFM',
        category: 'Flow Meter',
        structure: {
          singleHeaders: [{ name: 'Sr. No.', key: 'sr_no' }, { name: 'Range (UUC Unit)', key: 'range' }, { name: 'Nominal/ Set Value UUC (UUC Unit)', key: 'uuc' }],
          subHeaders: {
            'Observation on UUC': getObservationSubheaders('observationodfm', count).map((name, i) => ({ name, key: `master_${i}` })),
          },
          remainingHeaders: [{ name: 'Average (Master Unit)', key: 'averagemaster' }, { name: 'Error (Master Unit)', key: 'error' }],
        },
        staticRows: createObservationRows(observations, 'observationodfm', count).rows,
        hiddenInputs: createObservationRows(observations, 'observationodfm', count).hiddenInputs,
      }, {
        id: 'observationapg',
        name: 'Observation APG',
        category: 'Pressure',
        structure: {
          singleHeaders: [{ name: 'Sr no', key: 'sr_no' }, { name: 'Set Pressure on UUC (kg/cm²)', key: 'uuc' }, { name: 'Set Pressure on UUC (bar)', key: 'master' }],
          subHeaders: {
            'Observations on Master (bar)': getObservationSubheaders('observationapg', count).map((name, i) => ({ name, key: `uuc_${i}` })),
          },
          remainingHeaders: [{ name: 'Mean (bar)', key: 'averageuuc' }, { name: 'Error (bar)', key: 'error' }, { name: 'Hysterisis (bar)', key: 'hysterisis' }],
        },
        staticRows: createObservationRows(observations, 'observationapg', count).rows,
        hiddenInputs: createObservationRows(observations, 'observationapg', count).hiddenInputs,
      }, {
        id: 'observationit',
        name: 'Observation IT',
        category: 'Internal Thread',
        structure: {
          thermalCoeff: true,
          singleHeaders: [{ name: 'Sr. No.', key: 'sr_no' }, { name: 'Nominal/ Set Value', key: 'master' }],
          subHeaders: {
            'Observation on UUC': getObservationSubheaders('observationit', count).map((name, i) => ({ name, key: `uuc_${i}` })).map((name, i) => ({ name, key: `uuc_${i}` }))
          },
          remainingHeaders: [{ name: 'Average', key: 'averageuuc' }, { name: 'Error', key: 'error' }]
        },
        staticRows: createObservationRows(observations, 'observationit', count).rows,
        hiddenInputs: createObservationRows(observations, 'observationit', count).hiddenInputs,
      }, {
        id: 'observationmt',
        name: 'Observation MT',
        category: 'Measuring Tool',
        structure: {
          thermalCoeff: true,
          additionalFields: ['Thickness of graduation Line'],
          singleHeaders: [{ name: 'Sr. No.', key: 'sr_no' }, { name: 'Nominal/ Set Value', key: 'master' }],
          subHeaders: {
            'Observation on UUC': getObservationSubheaders('observationmt', count).map((name, i) => ({ name, key: `uuc_${i}` })).map((name, i) => ({ name, key: `uuc_${i}` }))
          },
          remainingHeaders: [{ name: 'Average', key: 'averageuuc' }, { name: 'Error', key: 'error' }]
        },
        staticRows: createObservationRows(observations, 'observationmt', count).rows,
        hiddenInputs: createObservationRows(observations, 'observationmt', count).hiddenInputs,
      }, {
        id: 'observationctg',
        name: 'Observation CTG',
        category: 'Temperature',
        structure: {
          thermalCoeff: true,
          singleHeaders: [{ name: 'Sr. No.', key: 'sr_no' }, { name: 'Nominal Value', key: 'master' }],
          subHeaders: {
            'Observation on UUC': getObservationSubheaders('observationctg', count).map((name, i) => ({ name, key: `uuc_${i}` })),
          },
          remainingHeaders: [{ name: 'Average', key: 'averageuuc' }, { name: 'Error', key: 'error' }],
        },
        staticRows: createObservationRows(observations, 'observationctg', count).rows,
        hiddenInputs: createObservationRows(observations, 'observationctg', count).hiddenInputs,
      },
      {
        id: 'observationtswoi',
        name: 'Observation TSWOI',
        category: 'Temperature',
        structure: {
          thermalCoeff: false,
          singleHeaders: [{ name: 'Sr. No.', key: 'sr_no' }, { name: 'Set Point', key: 'setpoint' }, { name: 'Value Of', key: 'value_of' }, { name: 'Unit', key: 'uucunit' }, { name: 'Sensitivity Coefficient', key: 'sensitivitycoefficient' }],
          subHeaders: {
            'Observation': getObservationSubheaders('observationtswoi', count).map((name, i) => ({ name, key: `uuc${i}` }))
          },
          remainingHeaders: [{ name: 'Averages', key: 'averageuuc' }, { name: 'mV generated On ambient', key: 'ambientuuc' }, { name: 'Average with corrected mv', key: 'saverageuuc' }, { name: 'Average (Unit)', key: 'caverageuuc' }, { name: 'Deviation (Unit)', key: 'error' }],
        },
        staticRows: createObservationRows(observations, 'observationtswoi', count).rows,
        hiddenInputs: createObservationRows(observations, 'observationtswoi', count).hiddenInputs,
      }
    ];
  };

  const getDefaultLayout = (templateKey, count = 5) => {
    const tableData = getObservationTables(count).find((table) => table.id === templateKey);
    if (!tableData || !tableData.structure) return null;

    const structure = tableData.structure;
    const cols = [];
    let idx = 0;

    structure.singleHeaders.forEach((header) => {
      const isObj = typeof header === 'object';
      cols.push({
        key: isObj ? header.key : `col_${idx}`,
        originalIndex: idx,
        defaultName: isObj ? header.name : header,
        headerName: isObj ? header.name : header,
        group: null,
        isDefault: true
      });
      idx++;
    });

    if (structure.subHeaders && Object.keys(structure.subHeaders).length > 0) {
      Object.entries(structure.subHeaders).forEach(([groupName, subHeaders]) => {
        subHeaders.forEach((subHeader) => {
          const isObj = typeof subHeader === 'object';
          cols.push({
            key: isObj ? subHeader.key : `col_${idx}`,
            originalIndex: idx,
            defaultName: isObj ? subHeader.name : subHeader,
            headerName: isObj ? subHeader.name : subHeader,
            group: groupName,
            isDefault: true
          });
          idx++;
        });
      });
    }

    if (structure.remainingHeaders && structure.remainingHeaders.length > 0) {
      structure.remainingHeaders.forEach((header) => {
        const isObj = typeof header === 'object';
        cols.push({
          key: isObj ? header.key : `col_${idx}`,
          originalIndex: idx,
          defaultName: isObj ? header.name : header,
          headerName: isObj ? header.name : header,
          group: null,
          isDefault: true
        });
        idx++;
      });
    }

    return {
      lookupKey: templateKey,
      columns: cols,
    };
  };

  const reconstructLayout = (backendCols, templateKey, count = 5) => {
    const defaultLayout = getDefaultLayout(templateKey, count);
    if (!defaultLayout || !defaultLayout.columns) return null;
    const sorted = [...backendCols].sort((a, b) => a.sort_order - b.sort_order);
    const reconstructed = [];
    let nextIndex = defaultLayout.columns.length;
    sorted.forEach((bCol) => {
      const match = defaultLayout.columns.find((dCol) =>
        dCol.key === bCol.column_key ||
        (dCol.key && bCol.column_key && dCol.key.replace(/_/g, '') === bCol.column_key.replace(/_/g, ''))
      );
      if (match) {
        reconstructed.push({
          key: match.key,
          originalIndex: match.originalIndex,
          defaultName: match.defaultName,
          headerName: bCol.display_name,
          group: bCol.group_name !== undefined ? bCol.group_name : match.group,
          isDefault: match.isDefault !== undefined ? match.isDefault : true
        });
      } else if (bCol.column_key && !bCol.column_key.startsWith('col_')) {
        reconstructed.push({
          key: bCol.column_key,
          originalIndex: nextIndex++,
          defaultName: bCol.display_name,
          headerName: bCol.display_name,
          group: bCol.group_name || null,
          isDefault: false
        });
      }
    });
    defaultLayout.columns.forEach((dCol) => {
      if (!reconstructed.some((rCol) => rCol.key === dCol.key)) {
        reconstructed.push(dCol);
      }
    });
    return { lookupKey: templateKey, columns: reconstructed };
  };

  useEffect(() => {
    if (!observationTemplate) return;
    let initialCount = 5;

    const tableData = getObservationTables(5).find((table) => table.id === observationTemplate);
    let obsGroupName = "Observation";
    if (tableData && tableData.structure?.subHeaders) {
      const groupNames = Object.keys(tableData.structure.subHeaders);
      const matched = groupNames.find(g => ["Observation", "Observation on UUC", "OBSERVATION ON UUC", "Observation on Master", "Observations on Master (bar)"].includes(g));
      if (matched) {
        obsGroupName = matched;
        initialCount = tableData.structure.subHeaders[matched].length;
      }
    }

    if (loadedRepeatCount !== null) {
      initialCount = loadedRepeatCount;
    } else if (backendColumns && backendColumns.length > 0) {
      const count = backendColumns.filter(c => c.group_name === obsGroupName).length;
      if (count > 0) initialCount = count;
    }

    setObservationCount(initialCount);

    if (backendColumns && backendColumns.length > 0) {
      const reconstructed = reconstructLayout(backendColumns, observationTemplate, initialCount);
      if (reconstructed) {
        setCustomLayout(reconstructed);
        return;
      }
    }
    setCustomLayout(getDefaultLayout(observationTemplate, initialCount));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [observationTemplate, backendColumns, loadedRepeatCount]);

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

  const validateForm = () => {
    let newErrors = {};

    // Temperature validation
    if (!formData.tempend || formData.tempend.trim() === '') {
      newErrors.tempend = 'This field is required';
    } else {
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
    }

    // Humidity validation
    if (!formData.humiend || formData.humiend.trim() === '') {
      newErrors.humiend = 'This field is required';
    } else {
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
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


  const validateObservationFields = () => {
    let newErrors = {};

    if (!selectedTableData || !selectedTableData.staticRows) {
      return true; // No validation needed if no data
    }

    selectedTableData.staticRows.forEach((row, rowIndex) => {
      if (selectedTableData.id === 'observationmm') {
        const calibPointId = selectedTableData.hiddenInputs?.calibrationPoints?.[rowIndex];
        const leastCount = leastCountData[calibPointId];
        if (!leastCount) {
          console.warn(`⚠️ Least count not found for calibration point ${calibPointId}`);
          return; // Skip validation if least count not available
        }

        // Range (column 2) - required
        const rangeKey = `${rowIndex}-2`;
        const rangeValue = tableInputValues[rangeKey] ?? (row[2]?.toString() || '');
        if (!rangeValue.trim()) {
          newErrors[rangeKey] = 'This field is required';
        }

        // Observations 1-5 (columns 5-9) - validate with least count
        for (let col = 5; col <= 9; col++) {
          const key = `${rowIndex}-${col}`;
          const value = tableInputValues[key] ?? (row[col]?.toString() || '');

          if (!value.trim()) {
            newErrors[key] = 'This field is required';
          } else {
            const numValue = parseFloat(value);

            // Check if value is less than least count
            if (numValue < leastCount) {
              newErrors[key] = `Please enter a value with in leastcount ${leastCount}`;
            }
            // Check if value is divisible by least count
            else if (numValue % leastCount !== 0) {
              newErrors[key] = `Please Enter Value divisible by ${leastCount}`;
            }
          }
        }
      } else if (selectedTableData.id === 'observationexm') {
        // Nominal value (column 1) and Observations 1-5 (columns 2-6) are required
        selectedTableData.staticRows.forEach((row, rowIndex) => {
          // Nominal value
          const nominalKey = `${rowIndex}-1`;
          const nominalValue = tableInputValues[nominalKey] ?? (row[1]?.toString() || '');
          if (!nominalValue.trim()) {
            newErrors[nominalKey] = 'This field is required';
          }

          // Observations 1-5 (columns 2-6)
          for (let col = 2; col <= 6; col++) {
            const key = `${rowIndex}-${col}`;
            const value = tableInputValues[key] ?? (row[col]?.toString() || '');
            if (!value.trim()) {
              newErrors[key] = 'This field is required';
            }
          }
        });
      } else if (selectedTableData.id === 'observationppg') {
        // M1-M6 (columns 3-8) are required
        for (let col = 3; col <= 8; col++) {
          const key = `${rowIndex}-${col}`;
          const value = tableInputValues[key] ?? (row[col]?.toString() || '');
          if (!value.trim()) {
            newErrors[key] = 'This field is required';
          }
        }
      } else if (selectedTableData.id === 'observationavg') {
        // SET PRESSURE ON UUC (columns 1, 2) and M1, M2 (columns 3, 4) are required
        for (let col = 3; col <= 4; col++) {
          const key = `${rowIndex}-${col}`;
          const value = tableInputValues[key] ?? (row[col]?.toString() || '');
          if (!value.trim()) {
            newErrors[key] = 'This field is required';
          }
        }
      } else if (selectedTableData.id === 'observationfg') {
        // Nominal value (column 1) and Observations 1-5 (columns 2-6) are required
        selectedTableData.staticRows.forEach((row, rowIndex) => {
          // Nominal value
          const nominalKey = `${rowIndex}-1`;
          const nominalValue = tableInputValues[nominalKey] ?? (row[1]?.toString() || '');
          if (!nominalValue.trim()) {
            newErrors[nominalKey] = 'This field is required';
          }

          // Observations 1-5 (columns 2-6)
          for (let col = 2; col <= 6; col++) {
            const key = `${rowIndex}-${col}`;
            const value = tableInputValues[key] ?? (row[col]?.toString() || '');
            if (!value.trim()) {
              newErrors[key] = 'This field is required';
            }
          }
        });
      } else if (selectedTableData.id === 'observationdg') {
        // Nominal value (column 1) and Set readings (columns 2-5) are required
        const nominalKey = `${rowIndex}-1`;
        const nominalValue = tableInputValues[nominalKey] ?? (row[1]?.toString() || '');
        if (!nominalValue.trim()) {
          newErrors[nominalKey] = 'This field is required';
        }

        // Set 1 Forward, Set 1 Backward, Set 2 Forward, Set 2 Backward (columns 2-5)
        for (let col = 2; col <= 5; col++) {
          const key = `${rowIndex}-${col}`;
          const value = tableInputValues[key] ?? (row[col]?.toString() || '');
          if (!value.trim()) {
            newErrors[key] = 'This field is required';
          }
        }
      } else if (selectedTableData.id === 'observationmsr') {
        // Nominal value (column 1) and Observations 1-5 (columns 2-6) are required
        selectedTableData.staticRows.forEach((row, rowIndex) => {
          // Nominal value
          const nominalKey = `${rowIndex}-1`;
          const nominalValue = tableInputValues[nominalKey] ?? (row[1]?.toString() || '');
          if (!nominalValue.trim()) {
            newErrors[nominalKey] = 'This field is required';
          }

          // Observations 1-5 (columns 2-6)
          for (let col = 2; col <= 6; col++) {
            const key = `${rowIndex}-${col}`;
            const value = tableInputValues[key] ?? (row[col]?.toString() || '');
            if (!value.trim()) {
              newErrors[key] = 'This field is required';
            }
          }
        });
      } else if (selectedTableData.id === 'observationhg') {
        // Nominal value (column 1) and Observations 1-5 (columns 2-6) are required
        selectedTableData.staticRows.forEach((row, rowIndex) => {
          // Nominal value
          const nominalKey = `${rowIndex}-1`;
          const nominalValue = tableInputValues[nominalKey] ?? (row[1]?.toString() || '');
          if (!nominalValue.trim()) {
            newErrors[nominalKey] = 'This field is required';
          }

          // Observations 1-5 (columns 2-6)
          for (let col = 2; col <= 6; col++) {
            const key = `${rowIndex}-${col}`;
            const value = tableInputValues[key] ?? (row[col]?.toString() || '');
            if (!value.trim()) {
              newErrors[key] = 'This field is required';
            }
          }
        });
      } else if (selectedTableData.id === 'observationit') {
        // Nominal value (column 1) and Observations 1-5 (columns 2-6) are required
        selectedTableData.staticRows.forEach((row, rowIndex) => {
          // Nominal value
          const nominalKey = `${rowIndex}-1`;
          const nominalValue = tableInputValues[nominalKey] ?? (row[1]?.toString() || '');
          if (!nominalValue.trim()) {
            newErrors[nominalKey] = 'This field is required';
          }

          // Observations 1-5 (columns 2-6)
          for (let col = 2; col <= 6; col++) {
            const key = `${rowIndex}-${col}`;
            const value = tableInputValues[key] ?? (row[col]?.toString() || '');
            if (!value.trim()) {
              newErrors[key] = 'This field is required';
            }
          }
        });
      } else if (selectedTableData.id === 'observationmg') {
        // SET PRESSURE ON UUC (columns 1, 2) and M1, M2 (columns 3, 4) are required
        for (let col = 1; col <= 4; col++) {
          const key = `${rowIndex}-${col}`;
          const value = tableInputValues[key] ?? (row[col]?.toString() || '');
          if (!value.trim()) {
            newErrors[key] = 'This field is required';
          }
        }
      } else if (selectedTableData.id === 'observationmt') {
        // Nominal value (column 1) and Observations 1-5 (columns 2-6) are required
        selectedTableData.staticRows.forEach((row, rowIndex) => {
          // Nominal value
          const nominalKey = `${rowIndex}-1`;
          const nominalValue = tableInputValues[nominalKey] ?? (row[1]?.toString() || '');
          if (!nominalValue.trim()) {
            newErrors[nominalKey] = 'This field is required';
          }

          // Observations 1-5 (columns 2-6)
          for (let col = 2; col <= 6; col++) {
            const key = `${rowIndex}-${col}`;
            const value = tableInputValues[key] ?? (row[col]?.toString() || '');
            if (!value.trim()) {
              newErrors[key] = 'This field is required';
            }
          }
        });
      }

      else if (selectedTableData.id === 'observationctg') {
        const calibPointId = selectedTableData.hiddenInputs?.calibrationPoints?.[rowIndex];
        const leastCount = leastCountData[calibPointId];

        if (!leastCount) {
          console.warn(`⚠️ Least count not found for calibration point ${calibPointId}`);
          return; // Skip validation if least count not available
        }

        // Nominal value (column 1) - required
        const nominalKey = `${rowIndex}-1`;
        const nominalValue = tableInputValues[nominalKey] ?? (row[1]?.toString() || '');
        if (!nominalValue.trim()) {
          newErrors[nominalKey] = 'This field is required';
        }

        // Observations 1-5 (columns 2-6) - validate with least count
        for (let col = 2; col <= 6; col++) {
          const key = `${rowIndex}-${col}`;
          const value = tableInputValues[key] ?? (row[col]?.toString() || '');

          if (!value.trim()) {
            newErrors[key] = 'This field is required';
          } else {
            const numValue = parseFloat(value);

            // Check if value is less than least count
            if (numValue < leastCount) {
              newErrors[key] = `Please enter a value with in leastcount ${leastCount}`;
            }
            // Check if value is divisible by least count
            else if (numValue % leastCount !== 0) {
              newErrors[key] = `Please Enter Value divisible by ${leastCount}`;
            }
          }
        }
      } else if (selectedTableData.id === 'observationdpg' || selectedTableData.id === 'observationapg') {
        // SET PRESSURE ON UUC (columns 1, 2) and M1... (columns 3 to 2+observationCount) are required
        for (let col = 1; col <= 2 + observationCount; col++) {
          const key = `${rowIndex}-${col}`;
          const value = tableInputValues[key] ?? (row[col]?.toString() || '');
          if (!value.trim()) {
            newErrors[key] = 'This field is required';
          }
        }
      } else if (selectedTableData.id === 'observationodfm') {
        // Range (column 1) and Observations 1-5 (columns 3-7) are required
        const rangeKey = `${rowIndex}-1`;
        const rangeValue = tableInputValues[rangeKey] ?? (row[1]?.toString() || '');
        if (!rangeValue.trim()) {
          newErrors[rangeKey] = 'This field is required';
        }

        // Observations 1-5 (columns 3-7)
        for (let col = 3; col <= 7; col++) {
          const key = `${rowIndex}-${col}`;
          const value = tableInputValues[key] ?? (row[col]?.toString() || '');
          if (!value.trim()) {
            newErrors[key] = 'This field is required';
          }
        }
      } else if (selectedTableData.id === 'observationgtm') {
        const rowType = row[2]; // 'UUC' or 'Master'

        if (rowType === 'UUC') {
          // Set Point (column 1) required
          const setPointKey = `${rowIndex}-1`;
          const setPointValue = tableInputValues[setPointKey] ?? (row[1]?.toString() || '');
          if (!setPointValue.trim()) {
            newErrors[setPointKey] = 'This field is required';
          }

          // Range (column 3) required
          const rangeKey = `${rowIndex}-3`;
          const rangeValue = tableInputValues[rangeKey] ?? (row[3]?.toString() || '');
          if (!rangeValue.trim()) {
            newErrors[rangeKey] = 'This field is required';
          }

          // Unit (column 4) required
          const unitKey = `${rowIndex}-4`;
          const unitValue = tableInputValues[unitKey] ?? (row[4]?.toString() || '');
          if (!unitValue.trim()) {
            newErrors[unitKey] = 'This field is required';
          }

          // Observations 1-5 (columns 6-10) required
          for (let col = 6; col <= 10; col++) {
            const key = `${rowIndex}-${col}`;
            const value = tableInputValues[key] ?? (row[col]?.toString() || '');
            if (!value.trim()) {
              newErrors[key] = 'This field is required';
            }
          }
        } else if (rowType === 'Master') {
          // Unit (column 4) required
          const unitKey = `${rowIndex}-4`;
          const unitValue = tableInputValues[unitKey] ?? (row[4]?.toString() || '');
          if (!unitValue.trim()) {
            newErrors[unitKey] = 'This field is required';
          }

          // Sensitivity Coefficient (column 5) required
          const sensKey = `${rowIndex}-5`;
          const sensValue = tableInputValues[sensKey] ?? (row[5]?.toString() || '');
          if (!sensValue.trim()) {
            newErrors[sensKey] = 'This field is required';
          }

          // Observations 1-5 (columns 6-10) required
          for (let col = 6; col <= 10; col++) {
            const key = `${rowIndex}-${col}`;
            const value = tableInputValues[key] ?? (row[col]?.toString() || '');
            if (!value.trim()) {
              newErrors[key] = 'This field is required';
            }
          }

          // Average (Ω) (column 11) required
          const avgKey = `${rowIndex}-11`;
          const avgValue = tableInputValues[avgKey] ?? (row[11]?.toString() || '');
          if (!avgValue.trim()) {
            newErrors[avgKey] = 'This field is required';
          }

          // Average (°C) (column 12) required
          const avgCKey = `${rowIndex}-12`;
          const avgCValue = tableInputValues[avgCKey] ?? (row[12]?.toString() || '');
          if (!avgCValue.trim()) {
            newErrors[avgCKey] = 'This field is required';
          }
        }
      }
    });

    setObservationErrors(newErrors);
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
            // console.log('✅ Setting DPG Observations:', observationData.observations);
            setObservations(observationData.observations);
          } else if (observationTemplate === 'observationapg') {
            setObservations(observationData);
          }
          else if (observationTemplate === 'observationmm') {
            console.log('🔍 Processing observationmm data structure');

            // ✅ NEW: Initialize least count map
            const leastCountMap = {};

            // Try different possible data structures for MM
            if (observationData.calibration_points && Array.isArray(observationData.calibration_points)) {
              console.log('Setting MM observations from calibration_points:', observationData.calibration_points);
              setObservations(observationData.calibration_points);

              // Extract least count data
              observationData.calibration_points.forEach(point => {
                if (point.point_id && point.precision) {
                  // Check mode: Source -> uuc_least_count, Measure -> master_least_count
                  const mode = point.mode?.toLowerCase();
                  if (mode === 'source' && point.precision.uuc_least_count) {
                    leastCountMap[point.point_id] = parseFloat(point.precision.uuc_least_count);
                  } else if (mode === 'measure' && point.precision.master_least_count) {
                    leastCountMap[point.point_id] = parseFloat(point.precision.master_least_count);
                  }
                }
              });
            } else if (observationData.data && Array.isArray(observationData.data)) {
              console.log('Setting MM observations from data:', observationData.data);
              setObservations(observationData.data);

              // Extract least count data from nested structure
              observationData.data.forEach(unitTypeGroup => {
                if (unitTypeGroup.calibration_points) {
                  unitTypeGroup.calibration_points.forEach(point => {
                    if (point.point_id && point.precision?.uuc_least_count) {
                      leastCountMap[point.point_id] = parseFloat(point.precision.uuc_least_count);
                    }
                  });
                }
              });
            } else if (observationData.unit_types && Array.isArray(observationData.unit_types)) {
              console.log('Setting MM observations from unit_types:', observationData.unit_types);
              setObservations(observationData.unit_types);

              // Extract least count data from unit_types structure
              observationData.unit_types.forEach(unitTypeGroup => {
                if (unitTypeGroup.calibration_points) {
                  unitTypeGroup.calibration_points.forEach(point => {
                    if (point.point_id && point.precision?.uuc_least_count) {
                      leastCountMap[point.point_id] = parseFloat(point.precision.uuc_least_count);
                    }
                  });
                }
              });
            } else if (Array.isArray(observationData)) {
              console.log('Setting MM observations directly:', observationData);
              setObservations(observationData);

              // Extract least count data from array structure
              observationData.forEach(item => {
                if (item.calibration_points) {
                  item.calibration_points.forEach(point => {
                    if (point.point_id && point.precision?.uuc_least_count) {
                      leastCountMap[point.point_id] = parseFloat(point.precision.uuc_least_count);
                    }
                  });
                } else if (item.point_id && item.precision?.uuc_least_count) {
                  // Direct point structure
                  leastCountMap[item.point_id] = parseFloat(item.precision.uuc_least_count);
                }
              });
            } else {
              console.log('No MM observations found in expected format, trying to extract from object');

              // Try to extract calibration points from the object structure
              const possiblePoints = Object.values(observationData).filter(
                item => item && typeof item === 'object' && (item.sr_no !== undefined || item.sequence_number !== undefined)
              );

              if (possiblePoints.length > 0) {
                console.log('Found potential MM points:', possiblePoints);
                setObservations(possiblePoints);

                // Extract least count from found points
                possiblePoints.forEach(point => {
                  if (point.point_id && point.precision?.uuc_least_count) {
                    leastCountMap[point.point_id] = parseFloat(point.precision.uuc_least_count);
                  }
                });
              } else {
                console.log('No MM observations found');
                setObservations([]);
              }
            }

            // ✅ Store least count data for validation
            console.log('📊 MM Least Count Map:', leastCountMap);
            setLeastCountData(leastCountMap);
          }
          else if (observationTemplate === 'observationavg') {
            console.log('Setting AVG observations:', observationData);

            const avgData = observationData.data || observationData;

            if (avgData.calibration_point && Array.isArray(avgData.calibration_point)) {
              console.log('✅ AVG calibration_point found:', avgData.calibration_point);
              setObservations(avgData.calibration_point);
            } else {
              console.log('❌ No AVG calibration_point found');
              setObservations([]);
            }
          } else if (observationTemplate === 'observationppg' && observationData.observations) {
            console.log('✅ Setting PPG Observations:', observationData.observations);
            setObservations(observationData.observations);
          } else if (observationTemplate === 'observationmg') {
            console.log('Setting MG observations:', observationData);

            // Handle nested data structure for MG
            const mgData = observationData.data || observationData;

            if (mgData.calibration_points && Array.isArray(mgData.calibration_points)) {
              console.log('✅ MG calibration_points found:', mgData.calibration_points);
              setObservations(mgData.calibration_points);
            } else if (mgData.observations && Array.isArray(mgData.observations)) {
              console.log('✅ MG observations found:', mgData.observations);
              setObservations(mgData.observations);
            } else {
              console.log('❌ No MG calibration_points found');
              setObservations([]);
            }
          }

          else if (observationTemplate === 'observationrtdwi') {
            console.log('Setting RTD WI observations:', observationData);

            if (observationData.calibration_points && Array.isArray(observationData.calibration_points)) {
              console.log('✅ RTD WI calibration_points found:', observationData.calibration_points.length, 'points');
              setObservations(observationData.calibration_points);
            } else {
              console.log('❌ No RTD WI calibration_points found');
              setObservations([]);
            }
          }
          else if (observationTemplate === 'observationfg') {
            console.log('Setting FG observations:', observationData);

            // Handle nested data structure for FG
            const fgData = observationData.data || observationData;

            // Check if calibration_points exists directly
            if (fgData.calibration_points && Array.isArray(fgData.calibration_points)) {
              console.log('✅ FG calibration_points found directly:', fgData.calibration_points);
              setObservations(fgData.calibration_points);

              // Handle thermal coefficients for FG
              if (fgData.thermal_coefficients) {
                setThermalCoeff({
                  uuc: fgData.thermal_coefficients.thermal_coeff_uuc || '',
                  master: fgData.thermal_coefficients.thermal_coeff_master || '',
                  thickness_of_graduation: '' // FG doesn't use this field
                });
                console.log('✅ FG Thermal coefficients set:', fgData.thermal_coefficients);
              }
            }
            // Check if unit_types exists (for backward compatibility)
            else if (fgData.unit_types && Array.isArray(fgData.unit_types)) {
              console.log('✅ FG unit_types found:', fgData.unit_types);
              setObservations(fgData.unit_types);

              // Handle thermal coefficients for FG
              if (fgData.thermal_coeff) {
                setThermalCoeff({
                  uuc: fgData.thermal_coeff.uuc || '',
                  master: fgData.thermal_coeff.master || '',
                  thickness_of_graduation: '' // FG doesn't use this field
                });
                console.log('✅ FG Thermal coefficients set:', fgData.thermal_coeff);
              }
            } else {
              console.log('❌ No FG calibration_points or unit_types found');
              setObservations([]);
            }
          } else if (observationTemplate === 'observationexm') {
            console.log('Setting EXM observations:', observationData);

            // EXM structure is similar to HG but thermal coefficients are directly uuc/master
            if (observationData.calibration_points && Array.isArray(observationData.calibration_points)) {
              console.log('✅ EXM calibration_points found:', observationData.calibration_points);
              setObservations(observationData.calibration_points);

              // Handle thermal coefficients - different from HG
              if (observationData.thermal_coefficients) {
                setThermalCoeff({
                  uuc: observationData.thermal_coefficients.uuc || '',
                  master: observationData.thermal_coefficients.master || '',
                  thickness_of_graduation: '' // EXM doesn't use this field
                });
                console.log('✅ EXM Thermal coefficients set:', observationData.thermal_coefficients);
              }
            } else {
              console.log('❌ No EXM calibration_points found');
              setObservations([]);
            }
          } else if (observationTemplate === 'observationgtm') {
            console.log('Setting GTM observations:', observationData);

            if (observationData.calibration_points && Array.isArray(observationData.calibration_points)) {
              console.log('✅ GTM calibration_points found:', observationData.calibration_points.length, 'points');
              setObservations(observationData.calibration_points);
            } else {
              console.log('❌ No GTM calibration_points found');
              setObservations([]);
            }
          }

          else if (observationTemplate === 'observationit') {
            console.log('Setting IT observations:', observationData);

            // Handle nested data structure
            const itData = observationData.data || observationData;

            if (itData.calibration_points) {
              console.log('✅ IT calibration_points found:', itData.calibration_points);
              setObservations(itData.calibration_points);

              // FIX: Handle thermal coefficients for IT with correct keys
              if (itData.thermal_coefficients) {
                setThermalCoeff(prev => ({
                  uuc: itData.thermal_coefficients.uuc_coefficient || '',
                  master: itData.thermal_coefficients.master_coefficient || '',
                  thickness_of_graduation: prev.thickness_of_graduation || '', // preserve existing
                }));
                console.log('✅ IT Thermal coefficients set:', {
                  uuc: itData.thermal_coefficients.uuc_coefficient,
                  master: itData.thermal_coefficients.master_coefficient
                });
              }
            } else {
              console.log('❌ No IT calibration_points found');
              setObservations([]);
            }
          } else if (observationTemplate === 'observationhg') {
            console.log('Setting HG observations:', observationData);

            // HG has calibration_points in the second object of the array
            const hgData = observationData[1] || observationData;

            if (hgData.calibration_points && Array.isArray(hgData.calibration_points)) {
              console.log('✅ HG calibration_points found:', hgData.calibration_points);
              setObservations(hgData.calibration_points);

              // Handle thermal coefficients from the first object
              if (observationData[0] && observationData[0].thermal_coefficients) {
                setThermalCoeff({
                  uuc: observationData[0].thermal_coefficients.uuc_coefficient || '',
                  master: observationData[0].thermal_coefficients.master_coefficient || '',
                  thickness_of_graduation: '' // HG doesn't use this field
                });
                console.log('✅ HG Thermal coefficients set:', observationData[0].thermal_coefficients);
              }
            } else {
              console.log('❌ No HG calibration_points found');
              setObservations([]);
            }
          } else if (observationTemplate === 'observationmsr') {
            console.log('Setting MSR observations:', observationData);

            // Handle array structure - MSR returns array with unit types
            if (Array.isArray(observationData) && observationData.length > 0) {
              const msrData = observationData[0]; // Get first unit type object

              if (msrData.calibration_points && Array.isArray(msrData.calibration_points)) {
                console.log('✅ MSR calibration_points found:', msrData.calibration_points);
                setObservations(msrData.calibration_points);

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
                setObservations([]);
              }
            } else {
              console.log('❌ MSR data not in expected array format');
              setObservations([]);
            }
          }
          else if (observationTemplate === 'observationmt') {
            console.log('Setting MT observations:', observationData);

            // Handle nested data structure for MT
            const mtData = observationData.data || observationData;

            if (mtData.calibration_points) {
              console.log('✅ MT calibration_points found:', mtData.calibration_points);
              setObservations(mtData.calibration_points);

              // Handle thermal coefficients for MT
              if (mtData.thermal_coeff) {
                setThermalCoeff({
                  uuc: mtData.thermal_coeff.uuc || '',
                  master: mtData.thermal_coeff.master || '',
                  thickness_of_graduation: mtData.thermal_coeff.thickness_of_graduation || ''
                });
                console.log('✅ MT Thermal coefficients set:', mtData.thermal_coeff);
              }
            } else {
              console.log('❌ No MT calibration_points found');
              setObservations([]);
            }
          }

          else if (observationTemplate === 'observationdg') {
            console.log('🔍 Setting DG observations:', observationData);

            // DG can return data in multiple formats - handle all cases
            if (observationData.observations && Array.isArray(observationData.observations)) {
              console.log('✅ DG observations found:', observationData.observations.length, 'points');
              setObservations(observationData.observations);
            } else if (Array.isArray(observationData)) {
              // Fallback if data is directly an array
              console.log('✅ DG observations as array:', observationData.length, 'points');
              setObservations(observationData);
            } else {
              console.log('❌ No DG observations found in expected format');
              setObservations([]);
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
          }

          else if (observationTemplate === 'observationctg' && observationData.points) {
            console.log(
              'CTG Points with IDs:',
              observationData.points.map((p) => ({
                id: p.id,
                sr_no: p.sr_no,
              }))
            );
            setObservations(observationData.points);

            // ✅ NEW: Extract least count data for CTG
            const leastCountMap = {};
            observationData.points.forEach(point => {
              if (point.id && point.least_count) {
                leastCountMap[point.id] = parseFloat(point.least_count);
              }
            });
            setLeastCountData(leastCountMap);
            console.log('📊 CTG Least Count Map:', leastCountMap);

            if (observationTemplate === 'observationctg' && observationData.thermal_coeff) {
              setThermalCoeff({
                uuc: observationData.thermal_coeff.uuc || '',
                master: observationData.thermal_coeff.master || '',
              });
            }
          } else if (observationTemplate === 'observationtswoi' && Array.isArray(observationData)) {
            console.log('✅ Setting TSWOI Observations:', observationData);
            const flattenedData = [];
            observationData.forEach((pt, idx) => {
              // Row 1: UUC
              flattenedData.push({
                calibration_point_id: pt.calibration_point_id,
                sr_no: idx + 1,
                setpoint: pt.set_point,
                value_of: 'UUC',
                uucunit: pt.uuc?.unit ?? pt.unit?.description ?? '',
                sensitivitycoefficient: pt.uuc?.sensitivity_coefficient ?? '',
                uuc0: pt.uuc?.observations?.[0] ?? '',
                uuc1: pt.uuc?.observations?.[1] ?? '',
                uuc2: pt.uuc?.observations?.[2] ?? '',
                uuc3: pt.uuc?.observations?.[3] ?? '',
                uuc4: pt.uuc?.observations?.[4] ?? '',
                averageuuc: pt.uuc?.average ?? '',
                ambientuuc: pt.uuc?.ambient_mv ?? '',
                saverageuuc: pt.uuc?.corrected_average ?? '',
                caverageuuc: '',
                error: pt.error ?? ''
              });

              // Row 2: Master
              flattenedData.push({
                calibration_point_id: pt.calibration_point_id,
                sr_no: '',
                setpoint: '',
                value_of: 'Master',
                uucunit: pt.master?.unit ?? '',
                sensitivitycoefficient: '',
                uuc0: pt.master?.observations?.[0] ?? '',
                uuc1: pt.master?.observations?.[1] ?? '',
                uuc2: pt.master?.observations?.[2] ?? '',
                uuc3: pt.master?.observations?.[3] ?? '',
                uuc4: pt.master?.observations?.[4] ?? '',
                averageuuc: pt.master?.average ?? '',
                ambientuuc: pt.master?.ambient_mv ?? '',
                saverageuuc: pt.master?.corrected_average ?? '',
                caverageuuc: '',
                error: ''
              });
            });
            setObservations(flattenedData);
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
    if (typeof window !== 'undefined') {
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(theme);
      localStorage.setItem('theme', theme);
    }
  }, [theme]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        if (!localStorage.getItem('theme')) {
          setTheme(mediaQuery.matches ? 'dark' : 'light');
        }
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []);

  const calculateRowValues = (rowData, template, obsCount = 5) => {
    const parsedValues = rowData.map((val) => {
      const num = parseFloat(val);
      return isNaN(num) ? 0 : num;
    });

    const result = { average: '', error: '', repeatability: '', hysteresis: '' };

    if (template === 'observationdpg') {
      const validReadings = parsedValues.slice(3, 3 + obsCount).filter((val) => val !== 0);

      result.average = validReadings.length
        ? (validReadings.reduce((sum, val) => sum + val, 0) / validReadings.length).toFixed(2)
        : '';

      const setPressureMaster = parsedValues[2];
      result.error = result.average !== ''
        ? (setPressureMaster - result.average).toFixed(2)
        : '';

      result.repeatability = validReadings.length
        ? ((Math.max(...validReadings) - Math.min(...validReadings)) / 2).toFixed(2)
        : '';

      result.hysteresis = validReadings.length
        ? (Math.max(...validReadings) - Math.min(...validReadings)).toFixed(2)
        : '';
    } else if (template === 'observationppg') {
      const m1 = parsedValues[3];
      const m2 = parsedValues[4];
      const m3 = parsedValues[5];
      const m4 = parsedValues[6];
      const m5 = parsedValues[7];
      const m6 = parsedValues[8];
      const validReadings = [m1, m2, m3, m4, m5, m6].filter((val) => val !== 0);

      result.average = validReadings.length
        ? (validReadings.reduce((sum, val) => sum + val, 0) / validReadings.length).toFixed(2)
        : '';

      const setPressureMaster = parsedValues[2];
      result.error = result.average !== ''
        ? (setPressureMaster - result.average).toFixed(2)
        : '';

      result.repeatability = validReadings.length
        ? ((Math.max(...validReadings) - Math.min(...validReadings)) / 2).toFixed(2)
        : '';

      result.hysteresis = validReadings.length
        ? (Math.max(...validReadings) - Math.min(...validReadings)).toFixed(2)
        : '';
    } else if (template === 'observationdg') {
      // Set 1 Forward and Set 2 Forward
      const set1Forward = parsedValues[2]; // col 2
      const set2Forward = parsedValues[4]; // col 4

      // Set 1 Backward and Set 2 Backward
      const set1Backward = parsedValues[3]; // col 3
      const set2Backward = parsedValues[5]; // col 5

      // Nominal Value (Master Unit) - col 1
      const nominalValue = parsedValues[1];

      // Average Forward Reading = (Set1Forward + Set2Forward) / 2
      const avgForward = (set1Forward + set2Forward) / 2;
      result.averageForward = avgForward ? avgForward.toFixed(3) : '';

      // Average Backward Reading = (Set1Backward + Set2Backward) / 2
      const avgBackward = (set1Backward + set2Backward) / 2;
      result.averageBackward = avgBackward ? avgBackward.toFixed(3) : '';

      // Error Forward = Average Forward - Nominal Value
      result.errorForward = result.averageForward && nominalValue
        ? (avgForward - nominalValue).toFixed(3)
        : '';

      // Error Backward = Average Backward - Nominal Value
      result.errorBackward = result.averageBackward && nominalValue
        ? (avgBackward - nominalValue).toFixed(3)
        : '';

      // Hysterisis = Average Forward - Average Backward
      result.hysteresis = result.averageForward && result.averageBackward
        ? (avgForward - avgBackward).toFixed(3)
        : '';

      console.log('🔢 DG Calculation:', {
        set1Forward, set2Forward, set1Backward, set2Backward,
        nominalValue,
        averageForward: result.averageForward,
        averageBackward: result.averageBackward,
        errorForward: result.errorForward,
        errorBackward: result.errorBackward,
        hysteresis: result.hysteresis
      });
    } else if (template === 'observationmsr') {
      const observations = parsedValues.slice(2, 2 + obsCount).filter((val) => val !== 0);
      result.average = observations.length
        ? (observations.reduce((sum, val) => sum + val, 0) / observations.length).toFixed(3)
        : '';
      const nominalValue = parsedValues[1];
      result.error = result.average !== ''
        ? (parseFloat(result.average) - nominalValue).toFixed(3)
        : '';
    } else if (template === 'observationavg') {
      const observations = parsedValues.slice(3, 3 + obsCount).filter((val) => val !== 0);

      result.average = observations.length
        ? (observations.reduce((sum, val) => sum + val, 0) / observations.length).toFixed(3)
        : '';

      const setPressureMaster = parsedValues[2]; // SET PRESSURE ON UUC (MASTER UNIT)
      result.error = result.average !== ''
        ? (parseFloat(setPressureMaster) - parseFloat(result.average)).toFixed(3)
        : '';

      result.hysteresis = observations.length >= 2
        ? (Math.max(...observations) - Math.min(...observations)).toFixed(3)
        : '';

      console.log('🔢 AVG Calculation:', {
        observations, setPressureMaster,
        average: result.average,
        error: result.error,
        hysteresis: result.hysteresis
      });
    } else if (template === 'observationfg') {
      const observations = parsedValues.slice(2, 2 + obsCount).filter((val) => val !== 0);
      result.average = observations.length
        ? (observations.reduce((sum, val) => sum + val, 0) / observations.length).toFixed(3)
        : '';
      const nominalValue = parsedValues[1];
      result.error = result.average !== ''
        ? (parseFloat(result.average) - nominalValue).toFixed(3)
        : '';
    } else if (template === 'observationhg') {
      const observations = parsedValues.slice(2, 2 + obsCount).filter((val) => val !== 0);
      result.average = observations.length
        ? (observations.reduce((sum, val) => sum + val, 0) / observations.length).toFixed(3)
        : '';
      const nominalValue = parsedValues[1];
      result.error = result.average !== ''
        ? (parseFloat(result.average) - nominalValue).toFixed(3)
        : '';
    } else if (template === 'observationmg') {
      const observations = parsedValues.slice(3, 3 + obsCount).filter((val) => val !== 0);

      result.average = observations.length
        ? (observations.reduce((sum, val) => sum + val, 0) / observations.length).toFixed(2)
        : '';

      const setPressureMaster = parsedValues[2]; // SET PRESSURE ON UUC (MASTER UNIT)
      result.error = result.average !== ''
        ? (parseFloat(setPressureMaster) - parseFloat(result.average)).toFixed(2)
        : '';

      result.hysteresis = observations.length >= 2
        ? (Math.max(...observations) - Math.min(...observations)).toFixed(2)
        : '';

      console.log('🔢 MG Calculation:', {
        observations, setPressureMaster,
        average: result.average,
        error: result.error,
        hysteresis: result.hysteresis
      });
    }
    else if (template === 'observationexm') {
      const observations = parsedValues.slice(2, 2 + obsCount).filter((val) => val !== 0);
      result.average = observations.length
        ? (observations.reduce((sum, val) => sum + val, 0) / observations.length).toFixed(3)
        : '';
      const nominalValue = parsedValues[1];
      result.error = result.average !== ''
        ? (parseFloat(result.average) - nominalValue).toFixed(3)
        : '';
    }
    else if (template === 'observationrtdwi') {
      const rowType = rowData[2]; // 'UUC' or 'Master'

      if (rowType === 'UUC') {
        // UUC calculations: Calculate average and error from observations
        const observations = parsedValues.slice(5, 5 + obsCount).filter((val) => val !== 0);

        result.average = observations.length
          ? (observations.reduce((sum, val) => sum + val, 0) / observations.length).toFixed(3)
          : '';

        result.error = result.average; // Deviation (°C) same as Average (°C) for UUC
      } else if (rowType === 'Master') {
        // Master calculations remain the same
        const observations = parsedValues.slice(5, 5 + obsCount).filter((val) => val !== 0);
        const ambient = parsedValues[11] || 0;

        result.average = observations.length
          ? (observations.reduce((sum, val) => sum + val, 0) / observations.length).toFixed(3)
          : '';

        if (result.average && ambient) {
          result.correctedAverage = (parseFloat(result.average) + ambient).toFixed(3);
        } else if (result.average) {
          result.correctedAverage = result.average;
        } else {
          result.correctedAverage = '';
        }
      }
    }
    else if (template === 'observationmm') {
      const observations = parsedValues.slice(5, 5 + obsCount).filter((val) => val !== 0);
      result.average = observations.length
        ? (observations.reduce((sum, val) => sum + val, 0) / observations.length).toFixed(3)
        : '';
      const nominalValue = parsedValues[4];
      result.error = result.average !== ''
        ? (parseFloat(result.average) - nominalValue).toFixed(3)
        : '';
    } else if (template === 'observationodfm') {
      const observations = parsedValues.slice(3, 3 + obsCount).filter((val) => val !== 0);
      result.average = observations.length
        ? (observations.reduce((sum, val) => sum + val, 0) / observations.length).toFixed(3)
        : '';
      const nominalValue = parsedValues[2];
      result.error = result.average !== ''
        ? (parseFloat(result.average) - nominalValue).toFixed(2)
        : '';
    } else if (template === 'observationapg') {
      const observations = parsedValues.slice(3, 3 + obsCount).filter((val) => val !== 0);
      result.average = observations.length
        ? (observations.reduce((sum, val) => sum + val, 0) / observations.length).toFixed(2)
        : '';
      const setPressureBar = parsedValues[2];
      result.error = result.average !== ''
        ? (parseFloat(result.average) - parseFloat(setPressureBar)).toFixed(2)
        : '';
      result.hysteresis = observations.length >= 2
        ? (Math.max(...observations) - Math.min(...observations)).toFixed(2)
        : '';
    } else if (template === 'observationit') {
      const observations = parsedValues.slice(2, 2 + obsCount).filter((val) => val !== 0);
      result.average = observations.length
        ? (observations.reduce((sum, val) => sum + val, 0) / observations.length).toFixed(3)
        : '';
      const nominalValue = parsedValues[1];
      result.error = result.average !== ''
        ? (parseFloat(result.average) - nominalValue).toFixed(3)
        : '';
    } else if (template === 'observationmt') {
      const observations = parsedValues.slice(2, 2 + obsCount).filter((val) => val !== 0);
      result.average = observations.length
        ? (observations.reduce((sum, val) => sum + val, 0) / observations.length).toFixed(3)
        : '';
      const nominalValue = parsedValues[1];
      result.error = result.average !== ''
        ? (parseFloat(result.average) - nominalValue).toFixed(3)
        : '';
    } else if (template === 'observationctg') {
      const observations = parsedValues.slice(2, 2 + obsCount).filter((val) => val !== 0);
      result.average = observations.length
        ? (observations.reduce((sum, val) => sum + val, 0) / observations.length).toFixed(2)
        : '';
      const nominalValue = parsedValues[1];
      result.error = result.average !== ''
        ? (result.average - nominalValue).toFixed(2)
        : '';
    } else if (template === 'observationtswoi') {
      let obsStartIndex = 5;

      if (customLayout && customLayout.columns) {
        const obs0Idx = customLayout.columns.findIndex(c => c.key === 'uuc0');
        if (obs0Idx !== -1) obsStartIndex = obs0Idx;
      }

      const observations = parsedValues.slice(obsStartIndex, obsStartIndex + obsCount).filter(val => val !== 0);
      result.average = observations.length
        ? (observations.reduce((sum, val) => sum + val, 0) / observations.length).toFixed(3)
        : '';
    }
    else if (template === 'observationgtm') {
      const rowType = rowData[2];

      if (rowType === 'UUC') {
        // UUC calculations (unchanged)
        const observations = parsedValues.slice(6, 6 + obsCount).filter((val) => val !== 0);

        result.average = observations.length
          ? (observations.reduce((sum, val) => sum + val, 0) / observations.length).toFixed(3)
          : '';

        result.error = ''; // Keep as is
      } else if (rowType === 'Master') {
        // Master calculations - ADD CONVERSION USING SENSITIVITY
        const observations = parsedValues.slice(6, 6 + obsCount).filter((val) => val !== 0);
        const sens = parseFloat(parsedValues[5]) || 0;  // Sensitivity Coefficient (col5), default 0

        result.average = observations.length
          ? (observations.reduce((sum, val) => sum + val, 0) / observations.length).toFixed(3)
          : '';

        // Converted Average (°C): If col12 already has value (manual edit), use it; else Average (Ω) * Sensitivity
        const manualConverted = parseFloat(parsedValues[12]);
        result.convertedAverage = !isNaN(manualConverted) && manualConverted !== 0
          ? manualConverted.toFixed(3)
          : sens ? (parseFloat(result.average) * sens).toFixed(3) : result.average;
      }
    }

    return result;
  };

  const availableTables = getObservationTables(observationCount).filter(
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
      const isObj = typeof header === 'object';
      headers.push({ name: isObj ? header.name : header, colspan: 1 });
      subHeadersRow.push(null);
    });

    if (structure.subHeaders && Object.keys(structure.subHeaders).length > 0) {
      Object.entries(structure.subHeaders).forEach(([groupName, subHeaders]) => {
        headers.push({ name: groupName, colspan: subHeaders.length });
        subHeaders.forEach((subHeader) => {
          const isObj = typeof subHeader === 'object';
          subHeadersRow.push(isObj ? subHeader.name : subHeader);
        });
      });
    }

    if (structure.remainingHeaders && structure.remainingHeaders.length > 0) {
      structure.remainingHeaders.forEach((header) => {
        const isObj = typeof header === 'object';
        headers.push({ name: isObj ? header.name : header, colspan: 1 });
        subHeadersRow.push(null);
      });
    }

    return { headers, subHeadersRow };
  };

  const tableStructure = generateTableStructure();

  const getCustomTableStructure = () => {
    if (!customLayout || !customLayout.columns) return null;

    const columns = customLayout.columns;
    const headers = [];
    const subHeadersRow = [];

    let i = 0;
    while (i < columns.length) {
      const col = columns[i];
      if (col.group === null) {
        headers.push({
          name: col.headerName,
          colspan: 1,
          isGroup: false,
          columnKey: col.key,
          originalIndex: col.originalIndex,
        });
        subHeadersRow.push({
          name: null,
          columnKey: col.key,
          originalIndex: col.originalIndex,
        });
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
        headers.push({
          name: groupName,
          colspan: count,
          isGroup: true,
          columns: subCols,
        });
        subCols.forEach((subCol) => {
          subHeadersRow.push({
            name: subCol.headerName,
            columnKey: subCol.key,
            originalIndex: subCol.originalIndex,
          });
        });
      }
    }

    return { headers, subHeadersRow };
  };

  const handleInputChange = (rowIndex, colIndex, value) => {
    setTableInputValues((prev) => {
      const newValues = { ...prev };
      const key = `${rowIndex}-${colIndex}`;
      newValues[key] = value;


      // ✅ NEW: Real-time validation for observationmm
      if (selectedTableData.id === 'observationmm' && colIndex >= 5 && colIndex <= observationCount + 4) {
        const calibPointId = selectedTableData.hiddenInputs?.calibrationPoints?.[rowIndex];
        const leastCount = leastCountData[calibPointId] || 2;

        if (value.trim()) {
          const numValue = parseFloat(value);

          // Clear previous error
          setObservationErrors(prevErrors => {
            const newErrors = { ...prevErrors };
            delete newErrors[key];
            return newErrors;
          });

          // Validate and set error if needed
          if (numValue < leastCount) {
            setObservationErrors(prevErrors => ({
              ...prevErrors,
              [key]: `Please enter a value with in leastcount ${leastCount}`
            }));
          } else if (numValue % leastCount !== 0) {
            setObservationErrors(prevErrors => ({
              ...prevErrors,
              [key]: `Please Enter Value divisible by ${leastCount}`
            }));
          }
        }
      }


      // ✅ NEW: Real-time validation for observationctg
      if (selectedTableData.id === 'observationctg' && colIndex >= 2 && colIndex <= observationCount + 1) {
        const calibPointId = selectedTableData.hiddenInputs?.calibrationPoints?.[rowIndex];
        const leastCount = leastCountData[calibPointId];

        if (leastCount && value.trim()) {
          const numValue = parseFloat(value);

          // Clear previous error
          setObservationErrors(prevErrors => {
            const newErrors = { ...prevErrors };
            delete newErrors[key];
            return newErrors;
          });

          // Validate and set error if needed
          if (numValue < leastCount) {
            setObservationErrors(prevErrors => ({
              ...prevErrors,
              [key]: `Please enter a value with in leastcount ${leastCount}`
            }));
          } else if (numValue % leastCount !== 0) {
            setObservationErrors(prevErrors => ({
              ...prevErrors,
              [key]: `Please Enter Value divisible by ${leastCount}`
            }));
          }
        }
      }


      const currentRow = selectedTableData.staticRows?.[rowIndex] || Array(customLayout ? customLayout.columns.length : 15).fill('');

      const rowData = currentRow.map((cell, idx) => {
        const inputKey = `${rowIndex}-${idx}`;
        return newValues[inputKey] ?? (cell?.toString() || '');
      });

      const calculated = calculateRowValues(rowData, selectedTableData.id, observationCount);

      // Update calculated values in real-time
      if (selectedTableData.id === 'observationmg') {
        newValues[`${rowIndex}-${3 + observationCount}`] = calculated.average;
        newValues[`${rowIndex}-${4 + observationCount}`] = calculated.error;
        newValues[`${rowIndex}-${5 + observationCount}`] = calculated.hysteresis;
      }
      else if (selectedTableData.id === 'observationfg') {
        newValues[`${rowIndex}-${2 + observationCount}`] = calculated.average;
        newValues[`${rowIndex}-${3 + observationCount}`] = calculated.error;
      } else if (selectedTableData.id === 'observationmsr') {
        newValues[`${rowIndex}-${2 + observationCount}`] = calculated.average;
        newValues[`${rowIndex}-${3 + observationCount}`] = calculated.error;
      }
      else if (selectedTableData.id === 'observationhg') {
        newValues[`${rowIndex}-${2 + observationCount}`] = calculated.average;
        newValues[`${rowIndex}-${3 + observationCount}`] = calculated.error;
      }
      else if (selectedTableData.id === 'observationrtdwi') {
        const rowType = rowData[2];

        if (rowType === 'UUC') {
          // Update BOTH Average (°C) and Deviation (°C) for UUC in real-time
          newValues[`${rowIndex}-13`] = calculated.average || '';
          newValues[`${rowIndex}-14`] = calculated.error || '';
        } else if (rowType === 'Master') {
          newValues[`${rowIndex}-10`] = calculated.average || '';
          newValues[`${rowIndex}-12`] = calculated.correctedAverage || '';
          newValues[`${rowIndex}-13`] = calculated.average || '';
        }
      }
      else if (selectedTableData.id === 'observationtswoi') {
        const rowType = rowData[2];
        const isUUCRow = savedRowLayout ? savedRowLayout.find(r => r.type === 'uuc')?.label === rowType : rowType === 'UUC';
        const isMasterRow = savedRowLayout ? savedRowLayout.find(r => r.type === 'master')?.label === rowType : rowType === 'Master';

        let avgIdx = 5 + observationCount;
        let ambIdx = 6 + observationCount;
        let savgIdx = 7 + observationCount;
        let cavgIdx = 8 + observationCount;
        let errIdx = 9 + observationCount;

        if (customLayout && customLayout.columns) {
          const getIdx = (key) => {
            const idx = customLayout.columns.findIndex(c => c.key === key);
            return idx !== -1 ? idx : undefined;
          };
          avgIdx = getIdx('averageuuc') ?? getIdx('averagemaster') ?? avgIdx;
          ambIdx = getIdx('ambientuuc') ?? getIdx('ambientmaster') ?? ambIdx;
          savgIdx = getIdx('saverageuuc') ?? getIdx('saveragemaster') ?? savgIdx;
          cavgIdx = getIdx('caverageuuc') ?? getIdx('caveragemaster') ?? cavgIdx;
          errIdx = getIdx('error') ?? errIdx;
        }

        const average = calculated.average || '';
        newValues[`${rowIndex}-${avgIdx}`] = average;

        const ambientStr = newValues[`${rowIndex}-${ambIdx}`] ?? tableInputValues[`${rowIndex}-${ambIdx}`];
        const ambient = parseFloat(ambientStr) || 0;
        const saverage = average !== '' ? (parseFloat(average) + ambient).toFixed(3) : '';
        newValues[`${rowIndex}-${savgIdx}`] = saverage;

        if (isUUCRow) {
          const cavgUUCStr = newValues[`${rowIndex}-${cavgIdx}`] ?? tableInputValues[`${rowIndex}-${cavgIdx}`];
          const cavgMasterStr = newValues[`${rowIndex + 1}-${cavgIdx}`] ?? tableInputValues[`${rowIndex + 1}-${cavgIdx}`];

          if (cavgUUCStr !== undefined && cavgUUCStr !== '') {
            const cAvgUUC = parseFloat(cavgUUCStr) || 0;
            const cAvgMaster = parseFloat(cavgMasterStr) || 0;
            newValues[`${rowIndex}-${errIdx}`] = (cAvgUUC - cAvgMaster).toFixed(3);
          } else {
            newValues[`${rowIndex}-${errIdx}`] = '';
          }
        } else if (isMasterRow) {
          const cavgMasterStr = newValues[`${rowIndex}-${cavgIdx}`] ?? tableInputValues[`${rowIndex}-${cavgIdx}`];
          const cavgUUCStr = newValues[`${rowIndex - 1}-${cavgIdx}`] ?? tableInputValues[`${rowIndex - 1}-${cavgIdx}`];

          if (cavgUUCStr !== undefined && cavgUUCStr !== '') {
            const cAvgUUC = parseFloat(cavgUUCStr) || 0;
            const cAvgMaster = parseFloat(cavgMasterStr) || 0;
            newValues[`${rowIndex - 1}-${errIdx}`] = (cAvgUUC - cAvgMaster).toFixed(3);
          }
        }
      } else if (selectedTableData.id === 'observationdg') {
        // Real-time calculation for DG
        newValues[`${rowIndex}-6`] = calculated.averageForward;   // Average Forward
        newValues[`${rowIndex}-7`] = calculated.averageBackward;  // Average Backward
        newValues[`${rowIndex}-8`] = calculated.errorForward;     // Error Forward
        newValues[`${rowIndex}-9`] = calculated.errorBackward;    // Error Backward
        newValues[`${rowIndex}-10`] = calculated.hysteresis;      // Hysterisis
      }
      else if (selectedTableData.id === 'observationppg') {
        // PPG REAL-TIME CALCULATION UPDATE
        newValues[`${rowIndex}-9`] = calculated.average;
        newValues[`${rowIndex}-10`] = calculated.error;
        newValues[`${rowIndex}-11`] = calculated.repeatability;
        newValues[`${rowIndex}-12`] = calculated.hysteresis;
      }
      else if (selectedTableData.id === 'observationavg') {
        newValues[`${rowIndex}-${3 + observationCount}`] = calculated.average;
        newValues[`${rowIndex}-${4 + observationCount}`] = calculated.error;
        newValues[`${rowIndex}-${5 + observationCount}`] = calculated.hysteresis;
      }
      else if (selectedTableData.id === 'observationdpg') {
        newValues[`${rowIndex}-${3 + observationCount}`] = calculated.average;
        newValues[`${rowIndex}-${4 + observationCount}`] = calculated.error;
        newValues[`${rowIndex}-${5 + observationCount}`] = calculated.repeatability;
        newValues[`${rowIndex}-${6 + observationCount}`] = calculated.hysteresis;
      }
      else if (selectedTableData.id === 'observationodfm') {
        newValues[`${rowIndex}-${3 + observationCount}`] = calculated.average;
        newValues[`${rowIndex}-${4 + observationCount}`] = calculated.error;
      }
      else if (selectedTableData.id === 'observationapg') {
        newValues[`${rowIndex}-${3 + observationCount}`] = calculated.average;
        newValues[`${rowIndex}-${4 + observationCount}`] = calculated.error;
        newValues[`${rowIndex}-${5 + observationCount}`] = calculated.hysteresis;
      }
      else if (selectedTableData.id === 'observationmm') {
        newValues[`${rowIndex}-${5 + observationCount}`] = calculated.average;
        newValues[`${rowIndex}-${6 + observationCount}`] = calculated.error;
      }
      else if (selectedTableData.id === 'observationit') {
        newValues[`${rowIndex}-${2 + observationCount}`] = calculated.average;
        newValues[`${rowIndex}-${3 + observationCount}`] = calculated.error;
      }
      else if (selectedTableData.id === 'observationmt') {
        newValues[`${rowIndex}-${2 + observationCount}`] = calculated.average;
        newValues[`${rowIndex}-${3 + observationCount}`] = calculated.error;
      }
      else if (selectedTableData.id === 'observationctg') {
        newValues[`${rowIndex}-${2 + observationCount}`] = calculated.average;
        newValues[`${rowIndex}-${3 + observationCount}`] = calculated.error;
      }
      else if (selectedTableData.id === 'observationexm') {
        newValues[`${rowIndex}-${2 + observationCount}`] = calculated.average;
        newValues[`${rowIndex}-${3 + observationCount}`] = calculated.error;
      }

      else if (selectedTableData.id === 'observationgtm') {
        const rowType = rowData[2];

        if (rowType === 'UUC') {
          // Update UUC Average (°C) and Deviation (°C) in real-time
          newValues[`${rowIndex}-12`] = calculated.average || '';

          // ✅ NEW: Real-time deviation for UUC = average - masterConvertedAvg (treat missing master as 0)
          const masterRowIndex = rowIndex + 1;
          const masterConvertedAvg = parseFloat(tableInputValues[`${masterRowIndex}-12`] || '0') || 0;
          const uucAverageNum = parseFloat(calculated.average) || 0;
          const deviation = (uucAverageNum - masterConvertedAvg).toFixed(3);

          newValues[`${rowIndex}-13`] = deviation || '';

          console.log('🔄 GTM UUC Real-time Deviation:', {
            uucAverage: calculated.average,
            masterConvertedAvg,
            deviation,
            rowIndex,
            masterRowIndex,
            formula: `${uucAverageNum} - ${masterConvertedAvg} = ${deviation}`
          });
        } else if (rowType === 'Master') {
          // Master calculations (unchanged for observations/average)
          newValues[`${rowIndex}-11`] = calculated.average || '';
          newValues[`${rowIndex}-12`] = calculated.convertedAverage || '';

          // Real-time deviation calculation when Master col 12 (Average °C) changes
          if (colIndex === 12 && value) {
            const uucRowIndex = rowIndex - 1;

            if (uucRowIndex >= 0 && selectedTableData.staticRows[uucRowIndex]) {
              const uucRowData = selectedTableData.staticRows[uucRowIndex].map((cell, idx) => {
                const inputKey = `${uucRowIndex}-${idx}`;
                return newValues[inputKey] ?? (cell?.toString() || '');
              });
              const uucAvgC = parseFloat(uucRowData[12]) || 0;

              if (uucAvgC > 0) {
                const deviation = (uucAvgC - parseFloat(value)).toFixed(3);

                newValues[`${uucRowIndex}-13`] = deviation;

                console.log('🔄 GTM Real-time Deviation (from Master Input Change):', {
                  uucAvgC,
                  masterConvertedAvg: value,
                  deviation,
                  uucRowIndex,
                  formula: `${uucAvgC} - ${value} = ${deviation}`
                });
              }
            }
          }
        }
      }

      return newValues;
    });
  };

  const handleObservationBlur = async (rowIndex, colIndex, value) => {
    if (value === '' || value === null || value === undefined) {
      return;
    }
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

    const rowData = selectedTableData.staticRows[rowIndex].map((cell, idx) => {
      const inputKey = `${rowIndex}-${idx}`;
      return tableInputValues[inputKey] ?? (cell?.toString() || '');
    });

    const calculated = calculateRowValues(rowData, selectedTableData.id);

    const payloads = [];

    // --- NEW: Handle Dynamic Columns Early ---
    if (customLayout && customLayout.columns && selectedTableData.id !== 'observationtswoi') {
      const dynamicCol = customLayout.columns.find(c => c.originalIndex === colIndex && c.key && !c.isDefault);
      if (dynamicCol) {
        let cellValue = value;
        if (cellValue === undefined) {
          const obsRow = observations[rowIndex];
          cellValue = obsRow && obsRow[dynamicCol.key] !== undefined ? obsRow[dynamicCol.key] : '';
        }

        payloads.push({
          inwardid: inwardId,
          instid: instId,
          calibrationpoint: calibrationPointId,
          type: dynamicCol.key,
          repeatable: '0',
          value: cellValue || '0',
        });

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
          toast.success(`Observation saved successfully!`);
          await refetchObservations();
        } catch (err) {
          console.error(`Error saving dynamic column:`, err);
          toast.error(err.response?.data?.message || 'Failed to save observation');
        }
        return; // Don't process static logic
      }
    }

    if (selectedTableData.id === 'observationdpg') {
      // DPG logic remains same
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
      Array.from({ length: observationCount }, (_, obsIdx) => {
        const colIdx = 3 + obsIdx;
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
        type: 'averagemaster',
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
        type: 'repeatability',
        repeatable: '0',
        value: calculated.repeatability || '0',
      });
      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: 'hysterisis',
        repeatable: '0',
        value: calculated.hysteresis || '0',
      });
    }

    else if (selectedTableData.id === 'observationdg') {
      let type = '';
      let repeatable = '0';

      if (colIndex === 1) {
        // Nominal Value (Master Unit)
        type = 'master';
        repeatable = '0';
      } else if (colIndex === 2) {
        // Set 1 Forward
        type = 'masterinc';
        repeatable = '0';
      } else if (colIndex === 3) {
        // Set 1 Backward
        type = 'masterdec';
        repeatable = '0';
      } else if (colIndex === 4) {
        // Set 2 Forward
        type = 'masterinc';
        repeatable = '1';
      } else if (colIndex === 5) {
        // Set 2 Backward
        type = 'masterdec';
        repeatable = '1';
      } else {
        return; // Skip calculated fields (6-10)
      }

      // Save current field
      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: type,
        repeatable: repeatable,
        value: value || '0',
      });

      // When any Set value changes, save all calculated values
      if (colIndex >= 2 && colIndex <= 5) {
        // Average Forward Reading
        payloads.push({
          inwardid: inwardId,
          instid: instId,
          calibrationpoint: calibrationPointId,
          type: 'averagemasterinc',
          repeatable: '0',
          value: calculated.averageForward || '0',
        });

        // Average Backward Reading
        payloads.push({
          inwardid: inwardId,
          instid: instId,
          calibrationpoint: calibrationPointId,
          type: 'averagemasterdec',
          repeatable: '0',
          value: calculated.averageBackward || '0',
        });

        // Error Forward Reading
        payloads.push({
          inwardid: inwardId,
          instid: instId,
          calibrationpoint: calibrationPointId,
          type: 'errorinc',
          repeatable: '0',
          value: calculated.errorForward || '0',
        });

        // Error Backward Reading
        payloads.push({
          inwardid: inwardId,
          instid: instId,
          calibrationpoint: calibrationPointId,
          type: 'errordec',
          repeatable: '0',
          value: calculated.errorBackward || '0',
        });

        // Hysterisis
        payloads.push({
          inwardid: inwardId,
          instid: instId,
          calibrationpoint: calibrationPointId,
          type: 'hysterisis',
          repeatable: '0',
          value: calculated.hysteresis || '0',
        });

        // Update UI immediately
        setTableInputValues(prev => ({
          ...prev,
          [`${rowIndex}-6`]: calculated.averageForward || '0',
          [`${rowIndex}-7`]: calculated.averageBackward || '0',
          [`${rowIndex}-8`]: calculated.errorForward || '0',
          [`${rowIndex}-9`]: calculated.errorBackward || '0',
          [`${rowIndex}-10`]: calculated.hysteresis || '0',
        }));

        console.log('🔄 DG Real-time Update:', calculated);
      }
    }
    else if (selectedTableData.id === 'observationtswoi') {
      const getVal = (key) => {
        if (backendColumns && backendColumns.length > 0) {
          const idx = backendColumns.findIndex(c => (c.column_key || c.key) === key);
          if (idx !== -1) {
            return idx === colIndex ? value : (rowData[idx] || '0');
          }
        }
        const fallbackMap = { setpoint: 1, value_of: 2, uucunit: 3, sensitivitycoefficient: 4, uuc0: 5, uuc1: 6, uuc2: 7, uuc3: 8, uuc4: 9, averageuuc: 10, ambientuuc: 11, saverageuuc: 12, caverageuuc: 13, error: 14 };
        const fallbackIdx = fallbackMap[key];
        return fallbackIdx === colIndex ? value : (rowData[fallbackIdx] || '0');
      };

      const rowLabel = getVal('value_of');
      const isUUCRow = savedRowLayout ? savedRowLayout.find(r => r.type === 'uuc')?.label === rowLabel : rowLabel === 'UUC';
      const isMasterRow = savedRowLayout ? savedRowLayout.find(r => r.type === 'master')?.label === rowLabel : rowLabel === 'Master';

      console.log('🐞 DEBUG tswoi:', { rowLabel, isUUCRow, isMasterRow, colIndex, value, rowData });

      let type = '';
      let repeatable = '0';

      let colKey = null;
      if (customLayout && customLayout.columns && customLayout.columns[colIndex]) {
        colKey = customLayout.columns[colIndex].key;
      } else {
        const fallbackMap = { 1: 'setpoint', 2: 'value_of', 3: 'uucunit', 4: 'sensitivitycoefficient', 5: 'uuc0', 6: 'uuc1', 7: 'uuc2', 8: 'uuc3', 9: 'uuc4', 10: 'averageuuc', 11: 'ambientuuc', 12: 'saverageuuc', 13: 'caverageuuc', 14: 'error' };
        colKey = fallbackMap[colIndex];
      }

      if (!colKey) return;

      if (isUUCRow) {
        if (colKey === 'setpoint') type = 'setpoint';
        else if (colKey === 'uucunit' || colKey === 'unit') type = 'uucunit';
        else if (colKey === 'sensitivitycoefficient') type = 'sensitivitycoefficient';
        else if (colKey.startsWith('uuc') && !isNaN(colKey.replace('uuc', ''))) {
          type = 'uuc';
          repeatable = colKey.replace('uuc', '');
        }
        else if (colKey === 'averageuuc') type = 'averageuuc';
        else if (colKey === 'ambientuuc') type = 'ambientuuc';
        else if (colKey === 'saverageuuc') type = 'saverageuuc';
        else if (colKey === 'caverageuuc') type = 'caverageuuc';
        else if (colKey === 'error') type = 'error';
        else return;
      } else if (isMasterRow) {
        if (colKey === 'uucunit' || colKey === 'masterunit' || colKey === 'unit') type = 'masterunit';
        else if (colKey.startsWith('uuc') && !isNaN(colKey.replace('uuc', ''))) {
          type = 'master';
          repeatable = colKey.replace('uuc', '');
        }
        else if (colKey === 'averageuuc' || colKey === 'averagemaster') type = 'averagemaster';
        else if (colKey === 'ambientuuc' || colKey === 'ambientmaster') type = 'ambientmaster';
        else if (colKey === 'saverageuuc' || colKey === 'saveragemaster') type = 'saveragemaster';
        else if (colKey === 'caverageuuc' || colKey === 'caveragemaster') type = 'caveragemaster';
        else return;
      } else {
        return;
      }

      payloads.push({ inwardid: inwardId, instid: instId, calibrationpoint: calibrationPointId, type: type, repeatable: repeatable, value: value || '0' });

      // Still push calculated fields automatically
      let avgIdx = 10;
      let ambIdx = 11;
      let savgIdx = 12;
      let cavgIdx = 13;
      let errIdx = 14;

      if (customLayout && customLayout.columns) {
        const getIdx = (key) => {
          const idx = customLayout.columns.findIndex(c => c.key === key);
          return idx !== -1 ? idx : undefined;
        };
        avgIdx = getIdx('averageuuc') ?? getIdx('averagemaster') ?? avgIdx;
        ambIdx = getIdx('ambientuuc') ?? getIdx('ambientmaster') ?? ambIdx;
        savgIdx = getIdx('saverageuuc') ?? getIdx('saveragemaster') ?? savgIdx;
        cavgIdx = getIdx('caverageuuc') ?? getIdx('caveragemaster') ?? cavgIdx;
        errIdx = getIdx('error') ?? errIdx;
      }

      if (isUUCRow) {
        if (calculated.average !== undefined && calculated.average !== '') payloads.push({ inwardid: inwardId, instid: instId, calibrationpoint: calibrationPointId, type: 'averageuuc', repeatable: '0', value: calculated.average });

        const ambient = parseFloat(tableInputValues[`${rowIndex}-${ambIdx}`]) || 0;
        const saverage = calculated.average !== '' ? (parseFloat(calculated.average) + ambient).toFixed(3) : '';
        if (saverage !== '') payloads.push({ inwardid: inwardId, instid: instId, calibrationpoint: calibrationPointId, type: 'saverageuuc', repeatable: '0', value: saverage });

        const cAvgUUC = parseFloat(tableInputValues[`${rowIndex}-${cavgIdx}`]) || 0;
        const cAvgMaster = parseFloat(tableInputValues[`${rowIndex + 1}-${cavgIdx}`]) || 0;
        let errorVal = '';
        if (tableInputValues[`${rowIndex}-${cavgIdx}`] !== undefined && tableInputValues[`${rowIndex}-${cavgIdx}`] !== '') {
          errorVal = (cAvgUUC - cAvgMaster).toFixed(3);
          payloads.push({ inwardid: inwardId, instid: instId, calibrationpoint: calibrationPointId, type: 'error', repeatable: '0', value: errorVal });
        }

        setTableInputValues(prev => ({
          ...prev,
          [`${rowIndex}-${avgIdx}`]: calculated.average || '',
          [`${rowIndex}-${savgIdx}`]: saverage || '',
          [`${rowIndex}-${errIdx}`]: errorVal || ''
        }));
      } else if (isMasterRow) {
        if (calculated.average !== undefined && calculated.average !== '') payloads.push({ inwardid: inwardId, instid: instId, calibrationpoint: calibrationPointId, type: 'averagemaster', repeatable: '0', value: calculated.average });

        const ambient = parseFloat(tableInputValues[`${rowIndex}-${ambIdx}`]) || 0;
        const saverage = calculated.average !== '' ? (parseFloat(calculated.average) + ambient).toFixed(3) : '';
        if (saverage !== '') payloads.push({ inwardid: inwardId, instid: instId, calibrationpoint: calibrationPointId, type: 'saveragemaster', repeatable: '0', value: saverage });

        // For Master row, we also need to update the UUC row's error
        const cAvgMaster = parseFloat(tableInputValues[`${rowIndex}-${cavgIdx}`]) || 0;
        const cAvgUUC = parseFloat(tableInputValues[`${rowIndex - 1}-${cavgIdx}`]) || 0;
        let errorVal = '';
        if (tableInputValues[`${rowIndex - 1}-${cavgIdx}`] !== undefined && tableInputValues[`${rowIndex - 1}-${cavgIdx}`] !== '') {
          errorVal = (cAvgUUC - cAvgMaster).toFixed(3);
          // Push payload for UUC row's error using UUC's calibrationPointId
          const uucCalibPoint = hiddenInputs.calibrationPoints[rowIndex - 1];
          if (uucCalibPoint) {
            payloads.push({ inwardid: inwardId, instid: instId, calibrationpoint: uucCalibPoint, type: 'error', repeatable: '0', value: errorVal });
          }
        }

        setTableInputValues(prev => ({
          ...prev,
          [`${rowIndex}-${avgIdx}`]: calculated.average || '',
          [`${rowIndex}-${savgIdx}`]: saverage || '',
          [`${rowIndex - 1}-${errIdx}`]: errorVal || ''
        }));
      }
    }
    else if (selectedTableData.id === 'observationgtm') {
      const rowType = rowData[2];
      let type = '';
      let repeatable = '0';

      console.log('🔍 GTM Observation Blur:', { rowIndex, colIndex, value, rowType });

      if (rowType === 'UUC') {
        // UUC row handling
        if (colIndex === 1) {
          type = 'uuc';
          repeatable = '0';
        } else if (colIndex === 3) {
          type = 'range';
          repeatable = '0';
        } else if (colIndex === 4) {
          type = 'unit';
          repeatable = '0';
        } else if (colIndex >= 6 && colIndex <= observationCount + 5) {
          type = 'uuc';
          repeatable = (colIndex - 6).toString();
        } else if (colIndex === 13) {
          // Allow manual editing of deviation
          type = 'error';
          repeatable = '0';
        } else {
          return;
        }

        payloads.push({
          inwardid: inwardId,
          instid: instId,
          calibrationpoint: calibrationPointId,
          type: type,
          repeatable: repeatable,
          value: value || '0',
        });

        // When UUC observations change (columns 6-10), calculate and save both average and error
        if (colIndex >= 6 && colIndex <= observationCount + 5) {
          const obs1 = parseFloat(rowData[6]) || 0;
          const obs2 = parseFloat(rowData[7]) || 0;
          const obs3 = parseFloat(rowData[8]) || 0;
          const obs4 = parseFloat(rowData[9]) || 0;
          const obs5 = parseFloat(rowData[10]) || 0;

          const validObservations = [obs1, obs2, obs3, obs4, obs5].filter(val => val !== 0);

          const average = validObservations.length
            ? (validObservations.reduce((sum, val) => sum + val, 0) / validObservations.length).toFixed(3)
            : '';

          // Save Average (°C)
          payloads.push({
            inwardid: inwardId,
            instid: instId,
            calibrationpoint: calibrationPointId,
            type: 'averageuuc',
            repeatable: '0',
            value: average || '0',
          });

          // FIXED: Build full master row data for correct Master's col 12
          const masterRowIndex = rowIndex + 1;
          let masterConvertedAvg = 0;
          if (masterRowIndex < selectedTableData.staticRows.length) {
            const masterRowData = selectedTableData.staticRows[masterRowIndex].map((cell, idx) => {
              const inputKey = `${masterRowIndex}-${idx}`;
              return tableInputValues[inputKey] ?? (cell?.toString() || '');
            });
            masterConvertedAvg = parseFloat(masterRowData[12]) || 0;  // Now correctly reads Master's Average (°C)
          }

          if (average) {
            const masterNum = masterConvertedAvg;
            const averageNum = parseFloat(average);
            const deviation = (averageNum - masterNum).toFixed(3);

            // Save Deviation (°C) for UUC
            payloads.push({
              inwardid: inwardId,
              instid: instId,
              calibrationpoint: calibrationPointId,
              type: 'error',
              repeatable: '0',
              value: deviation || '0',
            });

            // Update UI immediately with CORRECT values
            setTableInputValues(prev => ({
              ...prev,
              [`${rowIndex}-12`]: average || '',
              [`${rowIndex}-13`]: deviation || '',
            }));

            console.log('✅ GTM UUC Blur Calculation (FIXED):', {
              average,
              masterConvertedAvg,  // Now correctly 232 (or whatever Master's col 12 is)
              deviation,  // Now correctly e.g., -229.600
              rowIndex,
              masterRowIndex,
              formula: `${averageNum} - ${masterNum} = ${deviation}`
            });
          } else {
            // If no average, set error to '0'
            payloads.push({
              inwardid: inwardId,
              instid: instId,
              calibrationpoint: calibrationPointId,
              type: 'error',
              repeatable: '0',
              value: '0',
            });

            setTableInputValues(prev => ({
              ...prev,
              [`${rowIndex}-12`]: '',
              [`${rowIndex}-13`]: '0',
            }));
          }
        }
      } else if (rowType === 'Master') {
        // Master row handling
        if (colIndex === 4) {
          const selectedUnit = unitsList.find(u => u.label === value);
          type = 'masterunit';
          repeatable = '0';

          payloads.push({
            inwardid: inwardId,
            instid: instId,
            calibrationpoint: calibrationPointId,
            type: type,
            repeatable: repeatable,
            value: selectedUnit?.value?.toString() || '0',
          });
          return;
        } else if (colIndex === 5) {
          type = 'sensitivitycoefficient';
          repeatable = '0';
        } else if (colIndex >= 6 && colIndex <= observationCount + 5) {
          type = 'master';
          repeatable = (colIndex - 6).toString();
        } else if (colIndex === 11) {
          type = 'averagemaster';
          repeatable = '0';
        } else if (colIndex === 12) {
          // ✅ Manual edit of Average (°C) - maps to caveragemaster
          type = 'caveragemaster';
          repeatable = '0';
        } else {
          return;
        }

        payloads.push({
          inwardid: inwardId,
          instid: instId,
          calibrationpoint: calibrationPointId,
          type: type,
          repeatable: repeatable,
          value: value || '0',
        });

        // When master values change, recalculate and save
        if (colIndex >= 6 && colIndex <= observationCount + 5 || colIndex === 11 || colIndex === 12) {
          const obs1 = parseFloat(rowData[6]) || 0;
          const obs2 = parseFloat(rowData[7]) || 0;
          const obs3 = parseFloat(rowData[8]) || 0;
          const obs4 = parseFloat(rowData[9]) || 0;
          const obs5 = parseFloat(rowData[10]) || 0;

          const manualAverage = parseFloat(rowData[11]) || 0;
          const validObservations = [obs1, obs2, obs3, obs4, obs5].filter(val => val !== 0);

          const calculatedAverage = manualAverage > 0
            ? manualAverage.toFixed(3)
            : (validObservations.length
              ? (validObservations.reduce((sum, val) => sum + val, 0) / validObservations.length).toFixed(3)
              : '');

          // ✅ Get converted average - use the value user just entered if they're editing column 12
          const convertedAverage = colIndex === 12 ? (parseFloat(value) || 0).toFixed(3) : (rowData[12] || calculatedAverage);

          // Save Average (Ω) only if not manually editing it
          if (colIndex !== 11) {
            payloads.push({
              inwardid: inwardId,
              instid: instId,
              calibrationpoint: calibrationPointId,
              type: 'averagemaster',
              repeatable: '0',
              value: calculatedAverage || '0',
            });
          }

          // ✅ Only save caveragemaster if we're not already saving it above
          if (colIndex !== 12) {
            payloads.push({
              inwardid: inwardId,
              instid: instId,
              calibrationpoint: calibrationPointId,
              type: 'caveragemaster',
              repeatable: '0',
              value: convertedAverage || '0',
            });
          }

          // ✅ CRITICAL: Calculate and save UUC deviation when master caveragemaster changes
          const uucRowIndex = rowIndex - 1; // UUC row is before Master row
          const uucRowData = selectedTableData.staticRows[uucRowIndex]?.map((cell, idx) => {
            const inputKey = `${uucRowIndex}-${idx}`;
            return tableInputValues[inputKey] ?? (cell?.toString() || '');
          }) || [];

          const uucAvgC = parseFloat(uucRowData[12]) || 0;  // UUC Average (°C) - col 12

          console.log('🔍 GTM Master Change - Calculating UUC Deviation:', {
            uucRowIndex,
            uucAvgC,
            convertedAverage,
            colIndex
          });

          if (uucRowIndex >= 0 && uucAvgC > 0 && convertedAverage) {
            // ✅ Formula: UUC Average - Master Converted Average
            const deviation = (uucAvgC - parseFloat(convertedAverage)).toFixed(3);

            const uucCalibPointId = selectedTableData.hiddenInputs?.calibrationPoints?.[uucRowIndex];
            if (uucCalibPointId) {
              payloads.push({
                inwardid: inwardId,
                instid: instId,
                calibrationpoint: uucCalibPointId,
                type: 'error',
                repeatable: '0',
                value: deviation || '0',
              });

              // ✅ Update UUC deviation in UI immediately
              setTableInputValues(prev => ({
                ...prev,
                [`${uucRowIndex}-13`]: deviation || '',
              }));

              console.log('✅ GTM Deviation updated from Master change:', {
                uucAvgC,
                masterConvertedAvg: convertedAverage,
                deviation,
                formula: `${uucAvgC} - ${convertedAverage} = ${deviation}`
              });
            } else {
              console.warn('⚠️ No UUC calibration point ID found for deviation save');
            }
          } else if (uucAvgC === 0) {
            console.warn('⚠️ UUC Average (°C) is 0 - cannot calculate deviation yet');
          }

          // Update Master row UI
          setTableInputValues(prev => ({
            ...prev,
            [`${rowIndex}-11`]: calculatedAverage || '',
            [`${rowIndex}-12`]: convertedAverage || '',
          }));
        }
      }

      // Send all payloads
      try {
        for (const payload of payloads) {
          console.log('📡 Sending GTM payload:', payload);
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

        console.log('✅ GTM observations saved successfully!');
        toast.success('Observation and calculated values saved successfully!');
        await refetchObservations();
      } catch (err) {
        console.error('❌ Error saving GTM observations:', err);
        toast.error(err.response?.data?.message || 'Failed to save GTM observations');
      }
      return;
    }

    else if (selectedTableData.id === 'observationrtdwi') {
      const rowType = rowData[2];
      let type = '';
      let repeatable = '0';

      if (rowType === 'UUC') {
        if (colIndex === 1) {
          type = 'uuc';
          repeatable = '0';
        } else if (colIndex === 3) {
          type = 'unit';
          repeatable = '0';
        } else if (colIndex === 4) {
          type = 'sensitivitycoefficient';
          repeatable = '0';
        } else if (colIndex >= 5 && colIndex <= observationCount + 4) {
          type = 'uuc';
          repeatable = (colIndex - 5).toString();
        } else if (colIndex === 14) {
          // Allow saving deviation manually if needed
          type = 'error';
          repeatable = '0';
        } else {
          return;
        }

        payloads.push({
          inwardid: inwardId,
          instid: instId,
          calibrationpoint: calibrationPointId,
          type: type,
          repeatable: repeatable,
          value: value || '0',
        });

        // When observations change (columns 5-9), calculate and save both average and error
        if (colIndex >= 5 && colIndex <= observationCount + 4) {
          const obs1 = parseFloat(rowData[5]) || 0;
          const obs2 = parseFloat(rowData[6]) || 0;
          const obs3 = parseFloat(rowData[7]) || 0;
          const obs4 = parseFloat(rowData[8]) || 0;
          const obs5 = parseFloat(rowData[9]) || 0;

          const validObservations = [obs1, obs2, obs3, obs4, obs5].filter(val => val !== 0);

          const average = validObservations.length
            ? (validObservations.reduce((sum, val) => sum + val, 0) / validObservations.length).toFixed(3)
            : '';

          // Save Average (°C)
          payloads.push({
            inwardid: inwardId,
            instid: instId,
            calibrationpoint: calibrationPointId,
            type: 'averageuuc',
            repeatable: '0',
            value: average || '0',
          });

          // Save Deviation (°C) - same as average for UUC
          payloads.push({
            inwardid: inwardId,
            instid: instId,
            calibrationpoint: calibrationPointId,
            type: 'error',
            repeatable: '0',
            value: average || '0',
          });

          // Update UI immediately
          setTableInputValues(prev => ({
            ...prev,
            [`${rowIndex}-13`]: average || '',
            [`${rowIndex}-14`]: average || '',
          }));
        }
      } else if (rowType === 'Master') {
        // Master logic remains the same as before
        if (colIndex === 3) {
          const selectedUnit = unitsList.find(u => u.label === value);
          type = 'masterunit';
          repeatable = '0';

          payloads.push({
            inwardid: inwardId,
            instid: instId,
            calibrationpoint: calibrationPointId,
            type: type,
            repeatable: repeatable,
            value: selectedUnit?.value?.toString() || '0',
          });
          return;
        } else if (colIndex >= 5 && colIndex <= observationCount + 4) {
          type = 'master';
          repeatable = (colIndex - 5).toString();
        } else if (colIndex === 10) {
          type = 'averagemaster';
          repeatable = '0';
        } else if (colIndex === 11) {
          type = 'ambientmaster';
          repeatable = '0';
        } else {
          return;
        }

        payloads.push({
          inwardid: inwardId,
          instid: instId,
          calibrationpoint: calibrationPointId,
          type: type,
          repeatable: repeatable,
          value: value || '0',
        });

        if (colIndex >= 5 && colIndex <= observationCount + 4 || colIndex === 10 || colIndex === 11) {
          const obs1 = parseFloat(rowData[5]) || 0;
          const obs2 = parseFloat(rowData[6]) || 0;
          const obs3 = parseFloat(rowData[7]) || 0;
          const obs4 = parseFloat(rowData[8]) || 0;
          const obs5 = parseFloat(rowData[9]) || 0;
          const ambient = parseFloat(rowData[11]) || 0;

          const manualAverage = parseFloat(rowData[10]) || 0;
          const validObservations = [obs1, obs2, obs3, obs4, obs5].filter(val => val !== 0);

          const average = manualAverage > 0
            ? manualAverage.toFixed(3)
            : (validObservations.length
              ? (validObservations.reduce((sum, val) => sum + val, 0) / validObservations.length).toFixed(3)
              : '');

          const correctedAverage = average && ambient
            ? (parseFloat(average) + ambient).toFixed(3)
            : average;

          if (colIndex !== 10) {
            payloads.push({
              inwardid: inwardId,
              instid: instId,
              calibrationpoint: calibrationPointId,
              type: 'averagemaster',
              repeatable: '0',
              value: average || '0',
            });
          }

          payloads.push({
            inwardid: inwardId,
            instid: instId,
            calibrationpoint: calibrationPointId,
            type: 'saveragemaster',  // This is for column 12
            repeatable: '0',
            value: correctedAverage || '0',
          });

          payloads.push({
            inwardid: inwardId,
            instid: instId,
            calibrationpoint: calibrationPointId,
            type: 'caveragemaster',
            repeatable: '0',
            value: average || '0',
          });

          setTableInputValues(prev => ({
            ...prev,
            [`${rowIndex}-10`]: average || '',
            [`${rowIndex}-12`]: correctedAverage || '',
            [`${rowIndex}-13`]: average || '',
          }));
        }
      }
    }
    else if (selectedTableData.id === 'observationmsr') {
      let type = '';
      let repeatable = '0';

      if (colIndex === 1) {
        type = 'master'; // Nominal/set value
        repeatable = '0';
      } else if (colIndex >= 2 && colIndex <= observationCount + 1) {
        type = 'master'; // Changed from 'uuc' to 'master'
        repeatable = (colIndex - 2).toString();
      } else {
        return;
      }

      console.log('📡 MSR Observation Blur:', {
        rowIndex,
        colIndex,
        type,
        repeatable,
        value: value || '0',
        calibrationPointId
      });

      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: type,
        repeatable: repeatable,
        value: value || '0',
      });

      // Always update average and error when observations change
      if (colIndex >= 2 && colIndex <= observationCount + 1) {
        console.log('📊 MSR Calculated Values:', {
          average: calculated.average,
          error: calculated.error
        });

        payloads.push({
          inwardid: inwardId,
          instid: instId,
          calibrationpoint: calibrationPointId,
          type: 'averagemaster',
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

        // Update UI immediately for calculated values
        setTableInputValues(prev => ({
          ...prev,
          [`${rowIndex}-7`]: calculated.average || '0',
          [`${rowIndex}-8`]: calculated.error || '0',
        }));
      }

      console.log('📤 MSR Payloads being sent:', payloads);
    }
    else if (selectedTableData.id === 'observationppg') {
      // COMPLETE PPG LOGIC
      let type = '';
      let repeatable = '0';

      if (colIndex === 1) {
        type = 'uuc';
        repeatable = '0';
      } else if (colIndex === 2) {
        type = 'calculatedmaster';
        repeatable = '0';
      } else if (colIndex >= 3 && colIndex <= observationCount + 3) {
        // M1-M6 observations (columns 3-8)
        type = 'master';
        repeatable = (colIndex - 3).toString(); // 0,1,2,3,4,5 for M1-M6
      } else {
        return; // Skip calculated fields (9,10,11,12)
      }

      // Save current field
      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: type,
        repeatable: repeatable,
        value: value || '0',
      });

      // When any M1-M6 value changes, save all calculated values
      if (colIndex >= 3 && colIndex <= observationCount + 3) {
        payloads.push({
          inwardid: inwardId,
          instid: instId,
          calibrationpoint: calibrationPointId,
          type: 'averagemaster',
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
          type: 'repeatability',
          repeatable: '0',
          value: calculated.repeatability || '0',
        });
        payloads.push({
          inwardid: inwardId,
          instid: instId,
          calibrationpoint: calibrationPointId,
          type: 'hysterisis',
          repeatable: '0',
          value: calculated.hysteresis || '0',
        });

        // Update UI immediately
        setTableInputValues(prev => ({
          ...prev,
          [`${rowIndex}-9`]: calculated.average || '0',
          [`${rowIndex}-10`]: calculated.error || '0',
          [`${rowIndex}-11`]: calculated.repeatability || '0',
          [`${rowIndex}-12`]: calculated.hysteresis || '0',
        }));

        console.log('🔄 PPG Real-time Update:', {
          rowIndex,
          average: calculated.average,
          error: calculated.error,
          repeatability: calculated.repeatability,
          hysteresis: calculated.hysteresis
        });
      }
    } else if (selectedTableData.id === 'observationavg') {
      let type = '';
      let repeatable = '0';

      if (colIndex === 1) {
        type = 'uuc';
      } else if (colIndex === 2) {
        type = 'calculatedmaster';
      } else if (colIndex === 3) {
        type = 'master';
        repeatable = '0';
      } else if (colIndex === 4) {
        type = 'master';
        repeatable = '1';
      } else {
        return;
      }

      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: type,
        repeatable: repeatable,
        value: value || '0',
      });

      // Real-time update of calculated values
      if (colIndex === 3 || colIndex === 4) {
        payloads.push({
          inwardid: inwardId,
          instid: instId,
          calibrationpoint: calibrationPointId,
          type: 'averagemaster',
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
          value: calculated.hysteresis || '0',
        });

        // Also update UI immediately
        setTableInputValues(prev => ({
          ...prev,
          [`${rowIndex}-5`]: calculated.average || '0',
          [`${rowIndex}-6`]: calculated.error || '0',
          [`${rowIndex}-7`]: calculated.hysteresis || '0',
        }));
      }
    } else if (selectedTableData.id === 'observationhg') {
      let type = 'uuc'; // CHANGED: Using 'uuc' type as requested
      let repeatable = '0';

      if (colIndex === 1) {
        type = 'uuc'; // Nominal/set value
        repeatable = '0';
      } else if (colIndex >= 2 && colIndex <= observationCount + 1) {
        type = 'uuc';
        repeatable = (colIndex - 2).toString();
      } else {
        return;
      }

      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: type,
        repeatable: repeatable,
        value: value || '0',
      });

      // Always update average and error when observations change
      if (colIndex >= 2 && colIndex <= observationCount + 1) {
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

        // Also update UI immediately for calculated values
        setTableInputValues(prev => ({
          ...prev,
          [`${rowIndex}-7`]: calculated.average || '0',
          [`${rowIndex}-8`]: calculated.error || '0',
        }));
      }
    } else if (selectedTableData.id === 'observationexm') {
      let type = 'uuc';
      let repeatable = '0';

      if (colIndex === 1) {
        type = 'uuc'; // Nominal/set value
        repeatable = '0';
      } else if (colIndex >= 2 && colIndex <= observationCount + 1) {
        type = 'uuc';
        repeatable = (colIndex - 2).toString();
      } else {
        return;
      }

      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: type,
        repeatable: repeatable,
        value: value || '0',
      });

      // Always update average and error when observations change
      if (colIndex >= 2 && colIndex <= observationCount + 1) {
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

        // Also update UI immediately for calculated values
        setTableInputValues(prev => ({
          ...prev,
          [`${rowIndex}-7`]: calculated.average || '0',
          [`${rowIndex}-8`]: calculated.error || '0',
        }));
      }
    }
    else if (selectedTableData.id === 'observationfg') {
      let type = '';
      let repeatable = '0';

      if (colIndex === 1) {
        type = 'master'; // Nominal/set value
        repeatable = '0';
      } else if (colIndex >= 2 && colIndex <= observationCount + 1) {
        type = 'master';
        repeatable = (colIndex - 2).toString();
      } else {
        return;
      }

      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: type,
        repeatable: repeatable,
        value: value || '0',
      });

      // Always update average and error when observations change
      if (colIndex >= 2 && colIndex <= observationCount + 1) {
        payloads.push({
          inwardid: inwardId,
          instid: instId,
          calibrationpoint: calibrationPointId,
          type: 'averagemaster',
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

        // Also update UI immediately for calculated values
        setTableInputValues(prev => ({
          ...prev,
          [`${rowIndex}-7`]: calculated.average || '0',
          [`${rowIndex}-8`]: calculated.error || '0',
        }));
      }
    }
    else if (selectedTableData.id === 'observationit') {
      let type = '';
      let repeatable = '0';

      if (colIndex === 1) {
        type = 'master'; // Changed to 'master' for nominal/set value to avoid conflict
        repeatable = '0';
      } else if (colIndex >= 2 && colIndex <= observationCount + 1) {
        type = 'uuc';
        repeatable = (colIndex - 2).toString();
      } else {
        return;
      }

      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: type,
        repeatable: repeatable,
        value: value || '0',
      });

      // Always update average and error when observations change
      if (colIndex >= 2 && colIndex <= observationCount + 1) {
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
    } else if (selectedTableData.id === 'observationmg') {
      let type = '';
      let repeatable = '0';

      if (colIndex === 1) {
        type = 'uuc';
      } else if (colIndex === 2) {
        type = 'calculatedmaster';
      } else if (colIndex === 3) {
        type = 'master';
        repeatable = '0';
      } else if (colIndex === 4) {
        type = 'master';
        repeatable = '1';
      } else {
        return;
      }

      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: type,
        repeatable: repeatable,
        value: value || '0',
      });

      // Real-time update of calculated values - FIXED
      if (colIndex === 3 || colIndex === 4) {
        payloads.push({
          inwardid: inwardId,
          instid: instId,
          calibrationpoint: calibrationPointId,
          type: 'averagemaster',
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
          value: calculated.hysteresis || '0',
        });

        // Also update UI immediately
        setTableInputValues(prev => ({
          ...prev,
          [`${rowIndex}-5`]: calculated.average || '0',
          [`${rowIndex}-6`]: calculated.error || '0',
          [`${rowIndex}-7`]: calculated.hysteresis || '0',
        }));
      }
    }
    else if (selectedTableData.id === 'observationmm') {
      let type = '';
      let repeatable = '0';

      if (colIndex === 2) {
        type = 'range';
      } else if (colIndex >= 5 && colIndex <= observationCount + 4) {
        type = 'uuc';
        repeatable = (colIndex - 5).toString();
      } else {
        return; // Don't save other columns
      }

      // Find the correct calibration point ID for this row
      const calibrationPointId = hiddenInputs.calibrationPoints[rowIndex];
      if (!calibrationPointId) {
        toast.error('Calibration point ID not found');
        return;
      }

      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: type,
        repeatable: repeatable,
        value: value || '0',
      });

      // Always update average and error when observations change
      if (colIndex >= 5 && colIndex <= observationCount + 4) {
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
    } else if (selectedTableData.id === 'observationmt') {
      let type = 'master';
      let repeatable = '0';

      if (colIndex === 1) {
        type = 'master'; // Changed to 'master' for nominal/set value to avoid conflict
        repeatable = '0';
      } else if (colIndex >= 2 && colIndex <= observationCount + 1) {
        type = 'master';
        repeatable = (colIndex - 2).toString();
      } else {
        return;
      }

      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: type,
        repeatable: repeatable,
        value: value || '0',
      });

      // Always update average and error when observations change
      if (colIndex >= 2 && colIndex <= observationCount + 1) {
        payloads.push({
          inwardid: inwardId,
          instid: instId,
          calibrationpoint: calibrationPointId,
          type: 'averagemaster',
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
    }
    else if (selectedTableData.id === 'observationctg') {
      // Keep existing CTG logic - DON'T CHANGE
      let type = 'master'; // Changed to 'master' for nominal/set value to avoid conflict and for consistency
      let repeatable = '0';

      if (colIndex === 1) {
        type = 'master';
        repeatable = '0';
      } else if (colIndex >= 2 && colIndex <= observationCount + 1) {
        type = 'uuc';
        repeatable = (colIndex - 2).toString();
      } else {
        return;
      }

      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: type,
        repeatable: repeatable,
        value: value || '0',
      });

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
    } else if (selectedTableData.id === 'observationodfm') {
      // FIXED ODFM logic
      let type = '';
      let repeatable = '0';

      if (colIndex === 1) {
        type = 'range';
      } else if (colIndex === 2) {
        type = 'uuc';
      } else if (colIndex >= 3 && colIndex <= observationCount + 2) {
        type = 'master';
        repeatable = (colIndex - 3).toString();
      } else {
        return;
      }

      // Save the current input
      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: type,
        repeatable: repeatable,
        value: value || '0',
      });

      // Always update average and error when observations change
      if (colIndex >= 3 && colIndex <= observationCount + 2) {
        payloads.push({
          inwardid: inwardId,
          instid: instId,
          calibrationpoint: calibrationPointId,
          type: 'averagemaster',
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

      await refetchObservations();
    } catch (err) {
      console.error(`Error saving observation [${rowIndex}, ${colIndex}]:`, err);
      toast.error(err.response?.data?.message || 'Failed to save observation');
    }
  };


  const handleThermalCoeffBlur = async (type, value) => {
    if (selectedTableData.id !== 'observationctg' &&
      selectedTableData.id !== 'observationit' &&
      selectedTableData.id !== 'observationmt' &&
      selectedTableData.id !== 'observationfg' &&
      selectedTableData.id !== 'observationhg' &&
      selectedTableData.id !== 'observationexm' &&
      selectedTableData.id !== 'observationdg' &&  // ✅ ADD THIS LINE
      selectedTableData.id !== 'observationmsr') return;

    const token = localStorage.getItem('authToken');

    // Use instId instead of calibrationPointId for thermal coefficients
    const calibrationPointId = instId;

    if (!calibrationPointId) {
      toast.error('Instrument ID not found for thermal coefficient');
      return;
    }

    const payload = {
      inwardid: inwardId,
      instid: instId,
      calibrationpoint: calibrationPointId, // This will be instId
      type: type,
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

      console.log(`✅ Thermal coefficient (${type}) saved successfully!`);
      toast.success(`Thermal coefficient saved successfully!`);
    } catch (err) {
      console.error(`❌ Error saving thermal coefficient (${type}):`, err);
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

        // ✅ ADD OBSERVATIONAVG CASE HERE
        if (observationTemplate === 'observationavg') {
          console.log('🔄 Refetching AVG observations:', observationData);

          const avgData = observationData.data || observationData;

          if (avgData.calibration_point && Array.isArray(avgData.calibration_point)) {
            console.log('✅ Refetched AVG calibration_point:', avgData.calibration_point.length, 'points');
            setObservations(avgData.calibration_point);
          } else {
            console.log('❌ No AVG calibration_point found after refetch');
            setObservations([]);
          }
        }
        else if (observationTemplate === 'observationmg') {
          console.log('🔄 Refetching MG observations:', observationData);

          const mgData = observationData.data || observationData;

          if (mgData.calibration_points && Array.isArray(mgData.calibration_points)) {
            console.log('✅ Refetched MG calibration_points:', mgData.calibration_points.length, 'points');
            setObservations(mgData.calibration_points);
          } else if (mgData.observations && Array.isArray(mgData.observations)) {
            console.log('✅ Refetched MG observations:', mgData.observations.length, 'points');
            setObservations(mgData.observations);
          } else {
            console.log('❌ No MG calibration_points found after refetch');
            setObservations([]);
          }
        } else if (observationTemplate === 'observationmsr') {
          console.log('🔄 Refetching MSR observations:', observationData);

          if (Array.isArray(observationData) && observationData.length > 0) {
            const msrData = observationData[0];

            if (msrData.calibration_points && Array.isArray(msrData.calibration_points)) {
              console.log('✅ Refetched MSR calibration_points:', msrData.calibration_points.length, 'points');
              setObservations(msrData.calibration_points);

              if (msrData.thermal_coeff) {
                setThermalCoeff({
                  uuc: msrData.thermal_coeff.uuc || '',
                  master: msrData.thermal_coeff.master || '',
                  thickness_of_graduation: ''
                });
              }
            } else {
              console.log('❌ No MSR calibration_points found after refetch');
              setObservations([]);
            }
          }
        }
        else if (observationTemplate === 'observationdg') {
          console.log('🔄 Refetching DG observations:', observationData);

          // DG returns observations array directly at root level
          if (observationData.observations && Array.isArray(observationData.observations)) {
            console.log('✅ DG observations found:', observationData.observations);
            setObservations(observationData.observations);
          } else if (Array.isArray(observationData)) {
            // Fallback if data is directly an array
            console.log('✅ DG observations as array:', observationData);
            setObservations(observationData);
          } else {
            console.log('❌ No DG observations found');
            setObservations([]);
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
        }
        else if (observationTemplate === 'observationctg' && observationData.points) {
          setObservations(observationData.points);

          // ✅ NEW: Refresh least count data
          const leastCountMap = {};
          observationData.points.forEach(point => {
            if (point.id && point.least_count) {
              leastCountMap[point.id] = parseFloat(point.least_count);
            }
          });
          setLeastCountData(leastCountMap);

          if (observationData.thermal_coeff) {
            setThermalCoeff({
              uuc: observationData.thermal_coeff.uuc || '',
              master: observationData.thermal_coeff.master || '',
            });
          }
        }

        else if (observationTemplate === 'observationppg' && observationData.observations) {
          console.log('🔄 Refetching PPG observations:', observationData.observations);
          setObservations(observationData.observations);
        }

        else if (observationTemplate === 'observationgtm') {
          console.log('🔄 Refetching GTM observations:', observationData);

          if (observationData.calibration_points && Array.isArray(observationData.calibration_points)) {
            console.log('✅ Refetched GTM calibration_points:', observationData.calibration_points.length, 'points');
            setObservations(observationData.calibration_points);
          } else if (observationData.data && Array.isArray(observationData.data)) {
            console.log('✅ Refetched GTM data:', observationData.data.length, 'points');
            setObservations(observationData.data);
          } else {
            console.log('⚠️ GTM: No new data found, keeping existing observations');
            // Don't clear observations to prevent table disappearance
          }
        }
        else if (observationTemplate === 'observationrtdwi') {
          console.log('🔄 Refetching RTD WI observations:', observationData);

          if (observationData.calibration_points && Array.isArray(observationData.calibration_points)) {
            console.log('✅ Refetched RTD WI calibration_points:', observationData.calibration_points.length, 'points');
            setObservations(observationData.calibration_points);
          } else if (observationData.calibration_data && Array.isArray(observationData.calibration_data)) {
            console.log('✅ Refetched RTD WI calibration_data:', observationData.calibration_data.length, 'points');
            setObservations(observationData.calibration_data);
          } else if (observationData.data && observationData.data.calibration_points) {
            console.log('✅ Refetched RTD WI nested calibration_points:', observationData.data.calibration_points.length, 'points');
            setObservations(observationData.data.calibration_points);
          } else {
            console.log('⚠️ RTD WI: Keeping existing observations to prevent table disappearing');
            // DON'T clear observations - keep existing data to prevent table disappearing
          }
        }
        else if (observationTemplate === 'observationfg') {
          console.log('🔄 Refetching FG observations:', observationData);

          const fgData = observationData.data || observationData;

          // Check both possible structures
          if (fgData.calibration_points && Array.isArray(fgData.calibration_points)) {
            console.log('✅ Refetched FG calibration_points:', fgData.calibration_points.length, 'points');
            setObservations(fgData.calibration_points);

            if (fgData.thermal_coefficients) {
              setThermalCoeff({
                uuc: fgData.thermal_coefficients.thermal_coeff_uuc || '',
                master: fgData.thermal_coefficients.thermal_coeff_master || '',
                thickness_of_graduation: ''
              });
            }
          } else if (fgData.unit_types && Array.isArray(fgData.unit_types)) {
            console.log('✅ Refetched FG unit_types:', fgData.unit_types.length, 'types');
            setObservations(fgData.unit_types);

            if (fgData.thermal_coeff) {
              setThermalCoeff({
                uuc: fgData.thermal_coeff.uuc || '',
                master: fgData.thermal_coeff.master || '',
                thickness_of_graduation: ''
              });
            }
          } else {
            console.log('❌ No FG calibration_points or unit_types found after refetch');
            setObservations([]);
          }
        }
        else if (observationTemplate === 'observationmm') {
          if (observationData.unit_types && Array.isArray(observationData.unit_types)) {
            setObservations(observationData.unit_types);

            // ✅ NEW: Refresh least count data
            const leastCountMap = {};
            observationData.unit_types.forEach(unitTypeGroup => {
              if (unitTypeGroup.calibration_points) {
                unitTypeGroup.calibration_points.forEach(point => {
                  if (point.point_id && point.precision) {
                    const mode = point.mode?.toLowerCase();
                    if (mode === 'source' && point.precision.uuc_least_count) {
                      leastCountMap[point.point_id] = parseFloat(point.precision.uuc_least_count);
                    } else if (mode === 'measure' && point.precision.master_least_count) {
                      leastCountMap[point.point_id] = parseFloat(point.precision.master_least_count);
                    }
                  }
                });
              }
            });
            setLeastCountData(leastCountMap);
          } else if (observationData.data && Array.isArray(observationData.data)) {
            setObservations(observationData.data);
          } else if (observationData.calibration_points && Array.isArray(observationData.calibration_points)) {
            setObservations(observationData.calibration_points);
          } else if (Array.isArray(observationData)) {
            setObservations(observationData);
          } else {
            const possiblePoints = Object.values(observationData).filter(
              item => item && typeof item === 'object' &&
                (item.unit_type !== undefined || item.calibration_points !== undefined)
            );
            if (possiblePoints.length > 0) {
              setObservations(possiblePoints);
            }
          }
        }
        else if (observationTemplate === 'observationit') {
          const itData = observationData.data || observationData;

          if (itData.calibration_points) {
            console.log('✅ Refetching IT observations:', itData.calibration_points);
            setObservations(itData.calibration_points);

            if (itData.thermal_coefficients) {
              setThermalCoeff(prev => ({
                uuc: itData.thermal_coefficients.uuc_coefficient || '',
                master: itData.thermal_coefficients.master_coefficient || '',
                thickness_of_graduation: prev.thickness_of_graduation || '',
              }));
            }
          } else {
            setObservations([]);
          }
        } else if (observationTemplate === 'observationexm') {
          console.log('🔄 Refetching EXM observations:', observationData);

          if (observationData.calibration_points && Array.isArray(observationData.calibration_points)) {
            console.log('✅ Refetched EXM calibration_points:', observationData.calibration_points.length, 'points');
            setObservations(observationData.calibration_points);

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
            setObservations([]);
          }
        } else if (observationTemplate === 'observationhg') {
          console.log('🔄 Refetching HG observations:', observationData);

          // HG has calibration_points in the second object of the array
          const hgData = observationData[1] || observationData;

          if (hgData.calibration_points && Array.isArray(hgData.calibration_points)) {
            console.log('✅ Refetched HG calibration_points:', hgData.calibration_points.length, 'points');
            setObservations(hgData.calibration_points);

            // Handle thermal coefficients from the first object
            if (observationData[0] && observationData[0].thermal_coefficients) {
              setThermalCoeff({
                uuc: observationData[0].thermal_coefficients.uuc_coefficient || '',
                master: observationData[0].thermal_coefficients.master_coefficient || '',
                thickness_of_graduation: ''
              });
            }
          } else {
            console.log('❌ No HG calibration_points found after refetch');
            setObservations([]);
          }
        }
        else if (observationTemplate === 'observationmt') {
          const mtData = observationData.data || observationData;

          if (mtData.calibration_points) {
            console.log('✅ Refetching MT observations:', mtData.calibration_points);
            setObservations(mtData.calibration_points);

            if (mtData.thermal_coeff) {
              setThermalCoeff({
                uuc: mtData.thermal_coeff.uuc || '',
                master: mtData.thermal_coeff.master || '',
                thickness_of_graduation: mtData.thermal_coeff.thickness_of_graduation || ''
              });
            }
          } else {
            setObservations([]);
          }
        }
        else if (observationTemplate === 'observationodfm' && observationData.calibration_points) {
          setObservations(observationData.calibration_points);
        }
        else if (observationTemplate === 'observationdpg' && observationData.observations) {
          setObservations(observationData.observations);
        }
        else if (observationTemplate === 'observationapg') {
          setObservations(observationData);
        }
        else if (observationTemplate === 'observationtswoi' && Array.isArray(observationData)) {
          console.log('✅ Refetching TSWOI Observations:', observationData);
          const flattenedData = [];
          observationData.forEach((pt, idx) => {
            // Row 1: UUC
            flattenedData.push({
              calibration_point_id: pt.calibration_point_id,
              sr_no: idx + 1,
              setpoint: pt.set_point,
              value_of: 'UUC',
              uucunit: pt.uuc?.unit ?? pt.unit?.description ?? '',
              sensitivitycoefficient: pt.uuc?.sensitivity_coefficient ?? '',
              uuc0: pt.uuc?.observations?.[0] ?? '',
              uuc1: pt.uuc?.observations?.[1] ?? '',
              uuc2: pt.uuc?.observations?.[2] ?? '',
              uuc3: pt.uuc?.observations?.[3] ?? '',
              uuc4: pt.uuc?.observations?.[4] ?? '',
              averageuuc: pt.uuc?.average ?? '',
              ambientuuc: pt.uuc?.ambient_mv ?? '',
              saverageuuc: pt.uuc?.corrected_average ?? '',
              caverageuuc: '',
              error: pt.error ?? ''
            });

            // Row 2: Master
            flattenedData.push({
              calibration_point_id: pt.calibration_point_id,
              sr_no: '',
              setpoint: '',
              value_of: 'Master',
              uucunit: pt.master?.unit ?? '',
              sensitivitycoefficient: '',
              uuc0: pt.master?.observations?.[0] ?? '',
              uuc1: pt.master?.observations?.[1] ?? '',
              uuc2: pt.master?.observations?.[2] ?? '',
              uuc3: pt.master?.observations?.[3] ?? '',
              uuc4: pt.master?.observations?.[4] ?? '',
              averageuuc: pt.master?.average ?? '',
              ambientuuc: pt.master?.ambient_mv ?? '',
              saverageuuc: pt.master?.corrected_average ?? '',
              caverageuuc: '',
              error: ''
            });
          });
          setObservations(flattenedData);
        }
        else {
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

    const rowData = selectedTableData.staticRows[rowIndex].map((cell, idx) => {
      const inputKey = `${rowIndex}-${idx}`;
      return tableInputValues[inputKey] ?? (cell?.toString() || '');
    });

    const calculated = calculateRowValues(rowData, selectedTableData.id);

    const payloads = [];

    // Handle Dynamic Columns
    if (customLayout && customLayout.columns) {
      customLayout.columns.forEach(col => {
        if (col.key && !col.isDefault) {
          const valKey = `${rowIndex}-${col.originalIndex}`;
          let cellValue = tableInputValues[valKey];
          if (cellValue === undefined) {
            const obsRow = observations[rowIndex];
            cellValue = obsRow && obsRow[col.key] !== undefined ? obsRow[col.key] : '';
          }
          payloads.push({
            inwardid: inwardId,
            instid: instId,
            calibrationpoint: calibrationPointId,
            type: col.key,
            repeatable: '0',
            value: cellValue || '0',
          });
        }
      });
    }

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
          type: 'master',
          repeatable: obsIdx.toString(),
          value: rowData[colIdx] || '0',
        });
      });
      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: 'averagemaster',
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
        type: 'repeatability',
        repeatable: '0',
        value: calculated.repeatability || '0',
      });
      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: 'hysterisis',
        repeatable: '0',
        value: calculated.hysteresis || '0',
      });
    } else if (selectedTableData.id === 'observationdg') {
      // Nominal Value (Master Unit)
      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: 'master',
        repeatable: '0',
        value: rowData[1] || '0',
      });

      // Set 1 Forward
      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: 'masterinc',
        repeatable: '0',
        value: rowData[2] || '0',
      });

      // Set 1 Backward
      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: 'masterdec',
        repeatable: '0',
        value: rowData[3] || '0',
      });

      // Set 2 Forward
      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: 'masterinc',
        repeatable: '1',
        value: rowData[4] || '0',
      });

      // Set 2 Backward
      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: 'masterdec',
        repeatable: '1',
        value: rowData[5] || '0',
      });

      // Average Forward Reading
      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: 'averagemasterinc',
        repeatable: '0',
        value: calculated.averageForward || '0',
      });

      // Average Backward Reading
      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: 'averagemasterdec',
        repeatable: '0',
        value: calculated.averageBackward || '0',
      });

      // Error Forward Reading
      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: 'errorinc',
        repeatable: '0',
        value: calculated.errorForward || '0',
      });

      // Error Backward Reading
      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: 'errordec',
        repeatable: '0',
        value: calculated.errorBackward || '0',
      });

      // Hysterisis
      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: 'hysterisis',
        repeatable: '0',
        value: calculated.hysteresis || '0',
      });
    } else if (selectedTableData.id === 'observationavg') {
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

      [3, 4].forEach((colIndex, obsIndex) => {
        payloads.push({
          inwardid: inwardId,
          instid: instId,
          calibrationpoint: calibrationPointId,
          type: 'master',
          repeatable: obsIndex.toString(),
          value: rowData[colIndex] || '0',
        });
      });

      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: 'averagemaster',
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
        value: calculated.hysteresis || '0',
      });
    } else if (selectedTableData.id === 'observationexm') {
      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: 'uuc',
        repeatable: '0',
        value: rowData[1] || '0',
      });

      [2, 3, 4, 5, 6].forEach((colIndex, obsIndex) => {
        payloads.push({
          inwardid: inwardId,
          instid: instId,
          calibrationpoint: calibrationPointId,
          type: 'uuc',
          repeatable: obsIndex.toString(),
          value: rowData[colIndex] || '0',
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
    } else if (selectedTableData.id === 'observationhg') {
      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: 'uuc', // CHANGED: Using 'uuc' type as requested
        repeatable: '0',
        value: rowData[1] || '0',
      });

      [2, 3, 4, 5, 6].forEach((colIndex, obsIndex) => {
        payloads.push({
          inwardid: inwardId,
          instid: instId,
          calibrationpoint: calibrationPointId,
          type: 'uuc',
          repeatable: obsIndex.toString(),
          value: rowData[colIndex] || '0',
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
      [3, 4, 5, 6, 7].forEach((colIdx, obsIdx) => {
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
        type: 'averagemaster',
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
    } else if (selectedTableData.id === 'observationmg') {
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

      [3, 4].forEach((colIndex, obsIndex) => {
        payloads.push({
          inwardid: inwardId,
          instid: instId,
          calibrationpoint: calibrationPointId,
          type: 'master',
          repeatable: obsIndex.toString(),
          value: rowData[colIndex] || '0',
        });
      });

      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: 'averagemaster',
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
        value: calculated.hysteresis || '0',
      });
    }
    else if (selectedTableData.id === 'observationmm') {
      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: 'mode',
        repeatable: '0',
        value: rowData[1] || '0',
      });
      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: 'range',
        repeatable: '0',
        value: rowData[2] || '0',
      });
      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: 'calculatedmaster',
        repeatable: '0',
        value: rowData[3] || '0',
      });
      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: 'master',
        repeatable: '0',
        value: rowData[4] || '0',
      });
      [5, 6, 7, 8, 9].forEach((colIdx, obsIdx) => {
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
    } else if (selectedTableData.id === 'observationmt') {
      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: 'master', // Changed to 'master' for nominal/set value to avoid conflict
        repeatable: '0',
        value: rowData[1] || '0',
      });

      [2, 3, 4, 5, 6].forEach((colIndex, obsIndex) => {
        payloads.push({
          inwardid: inwardId,
          instid: instId,
          calibrationpoint: calibrationPointId,
          type: 'uuc',
          repeatable: obsIndex.toString(),
          value: rowData[colIndex] || '0',
        });
      });

      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: 'averagemaster',
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
    } else if (selectedTableData.id === 'observationctg') {
      payloads.push({
        inwardid: inwardId,
        instid: instId,
        calibrationpoint: calibrationPointId,
        type: 'master', // Changed to 'master' for consistency
        repeatable: '0',
        value: rowData[1] || '0',
      });
      [2, 3, 4, 5, 6].forEach((colIdx, obsIdx) => {
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
      toast.success(`Observation and calculated values saved successfully!`);

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
          <div className={`grid ${selectedTableData.id === 'observationmt' ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'} gap-4`}>
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
            {/* Additional field for MT */}
            {selectedTableData.id === 'observationmt' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Thickness of graduation Line:
                </label>
                <input
                  type="text"
                  value={thermalCoeff.thickness_of_graduation}
                  onChange={(e) => setThermalCoeff((prev) => ({ ...prev, thickness_of_graduation: e.target.value }))}
                  onBlur={(e) => handleThermalCoeffBlur('thicknessofgraduation', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                  placeholder="Enter thickness"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form fields
    if (!validateForm()) {
      toast.error('Please correct the validation errors before submitting.');
      return;
    }

    // Validate observation fields
    if (!validateObservationFields()) {
      toast.error('Please fill all required observation fields before submitting.');
      // Scroll to first error
      const firstErrorKey = Object.keys(observationErrors)[0];
      if (firstErrorKey) {
        const [rowIndex, colIndex] = firstErrorKey.split('-');
        console.error('❌ First validation error at:', { rowIndex, colIndex, error: observationErrors[firstErrorKey] });
      }
      return;
    }

    const token = localStorage.getItem('authToken');


    const calibrationPoints = [];
    const types = [];
    const repeatables = [];
    const values = [];

    const firstRowCalibPointId = selectedTableData.hiddenInputs?.calibrationPoints?.[0] || instId;

    // Add thermal coefficients for applicable observation types
    if (selectedTableData.id === 'observationctg' ||
      selectedTableData.id === 'observationit' ||
      selectedTableData.id === 'observationmt' ||
      selectedTableData.id === 'observationexm' ||
      selectedTableData.id === 'observationfg' ||
      selectedTableData.id === 'observationhg' ||
      selectedTableData.id === 'observationdg' ||  // ✅ ADD THIS LINE
      selectedTableData.id === 'observationmsr') {

      calibrationPoints.push(firstRowCalibPointId);
      types.push('thermalcoffuuc');
      repeatables.push('0');
      values.push(thermalCoeff.uuc || '0');

      calibrationPoints.push(firstRowCalibPointId);
      types.push('thermalcoffmaster');
      repeatables.push('0');
      values.push(thermalCoeff.master || '0');

      if (selectedTableData.id === 'observationmt' && thermalCoeff.thickness_of_graduation) {
        calibrationPoints.push(firstRowCalibPointId);
        types.push('thicknessofgraduation');
        repeatables.push('0');
        values.push(thermalCoeff.thickness_of_graduation || '0');
      }
    }

    // Process each row
    selectedTableData.staticRows.forEach((row, rowIndex) => {
      const calibPointId = selectedTableData.hiddenInputs?.calibrationPoints?.[rowIndex] || '';

      const rowData = row.map((cell, idx) => {
        const inputKey = `${rowIndex}-${idx}`;
        return tableInputValues[inputKey] ?? (cell?.toString() || '');
      });

      const calculated = calculateRowValues(rowData, selectedTableData.id);

      // 1. observationdpg
      if (selectedTableData.id === 'observationdpg') {
        calibrationPoints.push(calibPointId);
        types.push('uuc');
        repeatables.push('0');
        values.push(rowData[1] || '0');

        calibrationPoints.push(calibPointId);
        types.push('calculatedmaster');
        repeatables.push('0');
        values.push(rowData[2] || '0');

        [3, 4, 5].forEach((colIndex, obsIndex) => {
          calibrationPoints.push(calibPointId);
          types.push('master');
          repeatables.push(obsIndex.toString());
          values.push(rowData[colIndex] || '0');
        });

        calibrationPoints.push(calibPointId);
        types.push('averagemaster');
        repeatables.push('0');
        values.push(calculated.average || '0');

        calibrationPoints.push(calibPointId);
        types.push('error');
        repeatables.push('0');
        values.push(calculated.error || '0');

        calibrationPoints.push(calibPointId);
        types.push('repeatability');
        repeatables.push('0');
        values.push(calculated.repeatability || '0');

        calibrationPoints.push(calibPointId);
        types.push('hysterisis');
        repeatables.push('0');
        values.push(calculated.hysteresis || '0');
      }

      // 2. observationmsr
      else if (selectedTableData.id === 'observationmsr') {
        calibrationPoints.push(calibPointId);
        types.push('master');
        repeatables.push('0');
        values.push(rowData[1] || '0');

        [2, 3, 4, 5, 6].forEach((colIndex, obsIndex) => {
          calibrationPoints.push(calibPointId);
          types.push('master');
          repeatables.push(obsIndex.toString());
          values.push(rowData[colIndex] || '0');
        });

        calibrationPoints.push(calibPointId);
        types.push('averagemaster');
        repeatables.push('0');
        values.push(calculated.average || '0');

        calibrationPoints.push(calibPointId);
        types.push('error');
        repeatables.push('0');
        values.push(calculated.error || '0');
      }
      else if (selectedTableData.id === 'observationrtdwi') {
        const isUUCRow = rowData[2] === 'UUC';
        const isMasterRow = rowData[2] === 'Master';

        if (isUUCRow) {
          calibrationPoints.push(calibPointId);
          types.push('uuc');
          repeatables.push('0');
          values.push(rowData[1] || '0');

          calibrationPoints.push(calibPointId);
          types.push('unit');
          repeatables.push('0');
          values.push(rowData[3] || '0');

          calibrationPoints.push(calibPointId);
          types.push('sensitivitycoefficient');
          repeatables.push('0');
          values.push(rowData[4] || '0');

          [5, 6, 7, 8, 9].forEach((colIndex, obsIndex) => {
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
        } else if (isMasterRow) {
          calibrationPoints.push(calibPointId);
          types.push('masterunit');
          repeatables.push('0');
          values.push(rowData[3] || '0');

          [5, 6, 7, 8, 9].forEach((colIndex, obsIndex) => {
            calibrationPoints.push(calibPointId);
            types.push('master');
            repeatables.push(obsIndex.toString());
            values.push(rowData[colIndex] || '0');
          });

          calibrationPoints.push(calibPointId);
          types.push('averagemaster');
          repeatables.push('0');
          values.push(rowData[10] || calculated.average || '0');

          calibrationPoints.push(calibPointId);
          types.push('ambientmaster');
          repeatables.push('0');
          values.push(rowData[11] || '0');

          calibrationPoints.push(calibPointId);
          types.push('saveragemaster');
          repeatables.push('0');
          values.push(calculated.correctedAverage || '0');

          calibrationPoints.push(calibPointId);
          types.push('caveragemaster');
          repeatables.push('0');
          values.push(rowData[10] || calculated.average || '0');
        }
      }
      else if (selectedTableData.id === 'observationtswoi') {
        const getVal = (key) => {
          if (backendColumns && backendColumns.length > 0) {
            const idx = backendColumns.findIndex(c => c.column_key === key);
            if (idx !== -1) return rowData[idx] || '0';
          }
          const fallbackMap = { setpoint: 1, value_of: 2, uucunit: 3, sensitivitycoefficient: 4, uuc0: 5, uuc1: 6, uuc2: 7, uuc3: 8, uuc4: 9, averageuuc: 10, ambientuuc: 11, saverageuuc: 12, caverageuuc: 13, error: 14 };
          return rowData[fallbackMap[key]] || '0';
        };

        const rowLabel = getVal('value_of');
        const isUUCRow = savedRowLayout ? savedRowLayout.find(r => r.type === 'uuc')?.label === rowLabel : rowLabel === 'UUC';
        const isMasterRow = savedRowLayout ? savedRowLayout.find(r => r.type === 'master')?.label === rowLabel : rowLabel === 'Master';

        if (isUUCRow) {
          calibrationPoints.push(calibPointId); types.push('setpoint'); repeatables.push('0'); values.push(getVal('setpoint'));
          calibrationPoints.push(calibPointId); types.push('uucunit'); repeatables.push('0'); values.push(getVal('uucunit'));
          calibrationPoints.push(calibPointId); types.push('sensitivitycoefficient'); repeatables.push('0'); values.push(getVal('sensitivitycoefficient'));

          for (let obsIndex = 0; obsIndex < observationCount; obsIndex++) {
            calibrationPoints.push(calibPointId); types.push('uuc'); repeatables.push(obsIndex.toString()); values.push(getVal(`uuc${obsIndex}`));
          }

          calibrationPoints.push(calibPointId); types.push('averageuuc'); repeatables.push('0'); values.push(getVal('averageuuc'));
          calibrationPoints.push(calibPointId); types.push('ambientuuc'); repeatables.push('0'); values.push(getVal('ambientuuc'));
          calibrationPoints.push(calibPointId); types.push('saverageuuc'); repeatables.push('0'); values.push(getVal('saverageuuc'));
          calibrationPoints.push(calibPointId); types.push('caverageuuc'); repeatables.push('0'); values.push(getVal('caverageuuc'));
          calibrationPoints.push(calibPointId); types.push('error'); repeatables.push('0'); values.push(getVal('error'));
        } else if (isMasterRow) {
          calibrationPoints.push(calibPointId); types.push('masterunit'); repeatables.push('0'); values.push(getVal('uucunit')); // Frontend uses 'uucunit' column for both

          for (let obsIndex = 0; obsIndex < observationCount; obsIndex++) {
            calibrationPoints.push(calibPointId); types.push('master'); repeatables.push(obsIndex.toString()); values.push(getVal(`uuc${obsIndex}`)); // Frontend uses 'uuc' column for observations
          }

          calibrationPoints.push(calibPointId); types.push('averagemaster'); repeatables.push('0'); values.push(getVal('averageuuc')); // Frontend uses averageuuc column for both
          calibrationPoints.push(calibPointId); types.push('ambientmaster'); repeatables.push('0'); values.push(getVal('ambientuuc')); // Frontend uses ambientuuc column for both
          calibrationPoints.push(calibPointId); types.push('saveragemaster'); repeatables.push('0'); values.push(getVal('saverageuuc')); // Frontend uses saverageuuc column for both
          calibrationPoints.push(calibPointId); types.push('caveragemaster'); repeatables.push('0'); values.push(getVal('caverageuuc')); // Frontend uses caverageuuc column for both
        }
      }

      // 4. observationppg
      else if (selectedTableData.id === 'observationppg') {
        calibrationPoints.push(calibPointId);
        types.push('uuc');
        repeatables.push('0');
        values.push(rowData[1] || '0');

        calibrationPoints.push(calibPointId);
        types.push('calculatedmaster');
        repeatables.push('0');
        values.push(rowData[2] || '0');

        [3, 4, 5, 6, 7, 8].forEach((colIndex, obsIndex) => {
          calibrationPoints.push(calibPointId);
          types.push('master');
          repeatables.push(obsIndex.toString());
          values.push(rowData[colIndex] || '0');
        });

        calibrationPoints.push(calibPointId);
        types.push('averagemaster');
        repeatables.push('0');
        values.push(calculated.average || '0');

        calibrationPoints.push(calibPointId);
        types.push('error');
        repeatables.push('0');
        values.push(calculated.error || '0');

        calibrationPoints.push(calibPointId);
        types.push('repeatability');
        repeatables.push('0');
        values.push(calculated.repeatability || '0');

        calibrationPoints.push(calibPointId);
        types.push('hysterisis');
        repeatables.push('0');
        values.push(calculated.hysteresis || '0');
      }
      else if (selectedTableData.id === 'observationdg') {
        // Nominal Value (Master Unit)
        calibrationPoints.push(calibPointId);
        types.push('master');
        repeatables.push('0');
        values.push(rowData[1] || '0');

        // Set 1 Forward
        calibrationPoints.push(calibPointId);
        types.push('masterinc');
        repeatables.push('0');
        values.push(rowData[2] || '0');

        // Set 1 Backward
        calibrationPoints.push(calibPointId);
        types.push('masterdec');
        repeatables.push('0');
        values.push(rowData[3] || '0');

        // Set 2 Forward
        calibrationPoints.push(calibPointId);
        types.push('masterinc');
        repeatables.push('1');
        values.push(rowData[4] || '0');

        // Set 2 Backward
        calibrationPoints.push(calibPointId);
        types.push('masterdec');
        repeatables.push('1');
        values.push(rowData[5] || '0');

        // Average Forward Reading
        calibrationPoints.push(calibPointId);
        types.push('averagemasterinc');
        repeatables.push('0');
        values.push(calculated.averageForward || '0');

        // Average Backward Reading
        calibrationPoints.push(calibPointId);
        types.push('averagemasterdec');
        repeatables.push('0');
        values.push(calculated.averageBackward || '0');

        // Error Forward Reading
        calibrationPoints.push(calibPointId);
        types.push('errorinc');
        repeatables.push('0');
        values.push(calculated.errorForward || '0');

        // Error Backward Reading
        calibrationPoints.push(calibPointId);
        types.push('errordec');
        repeatables.push('0');
        values.push(calculated.errorBackward || '0');

        // Hysterisis
        calibrationPoints.push(calibPointId);
        types.push('hysterisis');
        repeatables.push('0');
        values.push(calculated.hysteresis || '0');
      }

      else if (selectedTableData.id === 'observationgtm') {
        const isUUCRow = row[2] === 'UUC';
        const isMasterRow = row[2] === 'Master';

        if (isUUCRow) {
          // UUC row payloads
          const rowData = row.map((cell, idx) => {
            const inputKey = `${rowIndex}-${idx}`;
            return tableInputValues[inputKey] ?? (cell?.toString() || '');
          });

          // Set Point (col 1: type uuc)
          calibrationPoints.push(calibPointId);
          types.push('uuc');
          repeatables.push('0');
          values.push(rowData[1] || '0');

          // Range (col 3: type range)
          calibrationPoints.push(calibPointId);
          types.push('range');
          repeatables.push('0');
          values.push(rowData[3] || '0');

          // Unit (col 4: type unit)
          calibrationPoints.push(calibPointId);
          types.push('unit');
          repeatables.push('0');
          values.push(rowData[4] || '0');

          // Observations 1-5 (cols 6-10: type uuc, repeatable 0-4)
          [6, 7, 8, 9, 10].forEach((colIndex, obsIndex) => {
            calibrationPoints.push(calibPointId);
            types.push('uuc');
            repeatables.push(obsIndex.toString());
            values.push(rowData[colIndex] || '0');
          });

          // Average (°C) for UUC (col 12: type averageuuc) - use latest from UI
          const uucAverageC = rowData[12] || '0';
          calibrationPoints.push(calibPointId);
          types.push('averageuuc');
          repeatables.push('0');
          values.push(uucAverageC);

          // ✅ Deviation (°C) (col 13: type error) - use LATEST from UI (already calculated)
          // This ensures we submit the final value without recalc - matches UI state
          const latestDeviation = tableInputValues[`${rowIndex}-13`] ?? rowData[13] ?? '0';
          calibrationPoints.push(calibPointId);
          types.push('error');
          repeatables.push('0');
          values.push(latestDeviation);

          console.log('📤 GTM UUC Submit Payloads:', {
            uucAverageC,
            latestDeviation,
            rowIndex
          });

        } else if (isMasterRow) {
          // Master row payloads
          const rowData = row.map((cell, idx) => {
            const inputKey = `${rowIndex}-${idx}`;
            return tableInputValues[inputKey] ?? (cell?.toString() || '');
          });

          // Master Unit (col 4: type masterunit) - send unit ID from ReactSelect value
          const unitLabel = rowData[4] || '';
          const selectedUnit = unitsList.find(u => u.label === unitLabel);
          calibrationPoints.push(calibPointId);
          types.push('masterunit');
          repeatables.push('0');
          values.push(selectedUnit ? selectedUnit.value.toString() : '0');

          // Sensitivity Coefficient (col 5: type sensitivitycoefficient)
          calibrationPoints.push(calibPointId);
          types.push('sensitivitycoefficient');
          repeatables.push('0');
          values.push(rowData[5] || '0');

          // Observations 1-5 (cols 6-10: type master, repeatable 0-4)
          [6, 7, 8, 9, 10].forEach((colIndex, obsIndex) => {
            calibrationPoints.push(calibPointId);
            types.push('master');
            repeatables.push(obsIndex.toString());
            values.push(rowData[colIndex] || '0');
          });

          // Average (Ω) (col 11: type averagemaster) - use latest from UI
          const masterAverageOmega = rowData[11] || '0';
          calibrationPoints.push(calibPointId);
          types.push('averagemaster');
          repeatables.push('0');
          values.push(masterAverageOmega);

          // ✅ Average (°C) for Master (col 12: type caveragemaster) - use LATEST from UI
          const masterConvertedAvg = rowData[12] || '0';
          calibrationPoints.push(calibPointId);
          types.push('caveragemaster');
          repeatables.push('0');
          values.push(masterConvertedAvg);

          console.log('📤 GTM Master Submit Payloads:', {
            masterAverageOmega,
            masterConvertedAvg,
            rowIndex
          });
        }
      }

      else if (selectedTableData.id === 'observationavg') {
        calibrationPoints.push(calibPointId);
        types.push('uuc');
        repeatables.push('0');
        values.push(rowData[1] || '0');

        calibrationPoints.push(calibPointId);
        types.push('calculatedmaster');
        repeatables.push('0');
        values.push(rowData[2] || '0');

        [3, 4].forEach((colIndex, obsIndex) => {
          calibrationPoints.push(calibPointId);
          types.push('master');
          repeatables.push(obsIndex.toString());
          values.push(rowData[colIndex] || '0');
        });

        calibrationPoints.push(calibPointId);
        types.push('averagemaster');
        repeatables.push('0');
        values.push(calculated.average || '0');

        calibrationPoints.push(calibPointId);
        types.push('error');
        repeatables.push('0');
        values.push(calculated.error || '0');

        calibrationPoints.push(calibPointId);
        types.push('hysterisis');
        repeatables.push('0');
        values.push(calculated.hysteresis || '0');
      }

      // 6. observationhg
      else if (selectedTableData.id === 'observationhg') {
        calibrationPoints.push(calibPointId);
        types.push('uuc');
        repeatables.push('0');
        values.push(rowData[1] || '0');

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

      // 7. observationfg
      else if (selectedTableData.id === 'observationfg') {
        calibrationPoints.push(calibPointId);
        types.push('master');
        repeatables.push('0');
        values.push(rowData[1] || '0');

        [2, 3, 4, 5, 6].forEach((colIndex, obsIndex) => {
          calibrationPoints.push(calibPointId);
          types.push('master');
          repeatables.push(obsIndex.toString());
          values.push(rowData[colIndex] || '0');
        });

        calibrationPoints.push(calibPointId);
        types.push('averagemaster');
        repeatables.push('0');
        values.push(calculated.average || '0');

        calibrationPoints.push(calibPointId);
        types.push('error');
        repeatables.push('0');
        values.push(calculated.error || '0');
      }

      else if (selectedTableData.id === 'observationmm') {
        // ✅ FIXED: Add least count validation check before submitting
        const leastCount = leastCountData[calibPointId];

        // Mode field
        calibrationPoints.push(calibPointId);
        types.push('mode');
        repeatables.push('0');
        values.push(rowData[1] || 'Measure');

        // Range
        calibrationPoints.push(calibPointId);
        types.push('range');
        repeatables.push('0');
        values.push(rowData[2] || '0');

        // Calculated master
        calibrationPoints.push(calibPointId);
        types.push('calculatedmaster');
        repeatables.push('0');
        values.push(rowData[3] || '0');

        // Master value
        calibrationPoints.push(calibPointId);
        types.push('master');
        repeatables.push('0');
        values.push(rowData[4] || '0');

        // ✅ Observations with least count validation
        [5, 6, 7, 8, 9].forEach((colIdx, obsIdx) => {
          const obsValue = rowData[colIdx] || '0';
          const numValue = parseFloat(obsValue);

          // Double-check least count validation before submitting
          if (leastCount && numValue !== 0) {
            if (numValue < leastCount || numValue % leastCount !== 0) {
              console.warn(`⚠️ MM: Observation ${obsIdx + 1} (${numValue}) doesn't meet least count ${leastCount}`);
            }
          }

          calibrationPoints.push(calibPointId);
          types.push('uuc');
          repeatables.push(obsIdx.toString());
          values.push(obsValue);
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

      // 9. observationexm
      else if (selectedTableData.id === 'observationexm') {
        calibrationPoints.push(calibPointId);
        types.push('uuc');
        repeatables.push('0');
        values.push(rowData[1] || '0');

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

      // 10. observationmg
      else if (selectedTableData.id === 'observationmg') {
        calibrationPoints.push(calibPointId);
        types.push('uuc');
        repeatables.push('0');
        values.push(rowData[1] || '0');

        calibrationPoints.push(calibPointId);
        types.push('calculatedmaster');
        repeatables.push('0');
        values.push(rowData[2] || '0');

        [3, 4].forEach((colIndex, obsIndex) => {
          calibrationPoints.push(calibPointId);
          types.push('master');
          repeatables.push(obsIndex.toString());
          values.push(rowData[colIndex] || '0');
        });

        calibrationPoints.push(calibPointId);
        types.push('averagemaster');
        repeatables.push('0');
        values.push(calculated.average || '0');

        calibrationPoints.push(calibPointId);
        types.push('error');
        repeatables.push('0');
        values.push(calculated.error || '0');

        calibrationPoints.push(calibPointId);
        types.push('hysterisis');
        repeatables.push('0');
        values.push(calculated.hysteresis || '0');
      }

      // 11. observationodfm
      else if (selectedTableData.id === 'observationodfm') {
        calibrationPoints.push(calibPointId);
        types.push('range');
        repeatables.push('0');
        values.push(rowData[1] || '0');

        calibrationPoints.push(calibPointId);
        types.push('uuc');
        repeatables.push('0');
        values.push(rowData[2] || '0');

        [3, 4, 5, 6, 7].forEach((colIdx, obsIdx) => {
          calibrationPoints.push(calibPointId);
          types.push('master');
          repeatables.push(obsIdx.toString());
          values.push(rowData[colIdx] || '0');
        });

        calibrationPoints.push(calibPointId);
        types.push('averagemaster');
        repeatables.push('0');
        values.push(calculated.average || '0');

        calibrationPoints.push(calibPointId);
        types.push('error');
        repeatables.push('0');
        values.push(calculated.error || '0');
      }

      // 12. observationapg
      else if (selectedTableData.id === 'observationapg') {
        calibrationPoints.push(calibPointId);
        types.push('uuc');
        repeatables.push('0');
        values.push(rowData[1] || '0');

        calibrationPoints.push(calibPointId);
        types.push('master');
        repeatables.push('0');
        values.push(rowData[2] || '0');

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
        values.push(calculated.hysteresis || '0');
      }

      // 13. observationit
      else if (selectedTableData.id === 'observationit') {
        calibrationPoints.push(calibPointId);
        types.push('master');
        repeatables.push('0');
        values.push(rowData[1] || '0');

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

      // 14. observationmt
      else if (selectedTableData.id === 'observationmt') {
        calibrationPoints.push(calibPointId);
        types.push('master');
        repeatables.push('0');
        values.push(rowData[1] || '0');

        [2, 3, 4, 5, 6].forEach((colIndex, obsIndex) => {
          calibrationPoints.push(calibPointId);
          types.push('master');
          repeatables.push(obsIndex.toString());
          values.push(rowData[colIndex] || '0');
        });

        calibrationPoints.push(calibPointId);
        types.push('averagemaster');
        repeatables.push('0');
        values.push(calculated.average || '0');

        calibrationPoints.push(calibPointId);
        types.push('error');
        repeatables.push('0');
        values.push(calculated.error || '0');
      }

      // 15. observationctg
      else if (selectedTableData.id === 'observationctg') {
        // ✅ FIXED: Add least count validation check before submitting
        const leastCount = leastCountData[calibPointId];

        // Nominal value
        calibrationPoints.push(calibPointId);
        types.push('master');
        repeatables.push('0');
        values.push(rowData[1] || '0');

        // ✅ Observations with least count validation
        [2, 3, 4, 5, 6].forEach((colIndex, obsIndex) => {
          const obsValue = rowData[colIndex] || '0';
          const numValue = parseFloat(obsValue);

          // Double-check least count validation before submitting
          if (leastCount && numValue !== 0) {
            if (numValue < leastCount || numValue % leastCount !== 0) {
              console.warn(`⚠️ CTG: Observation ${obsIndex + 1} (${numValue}) doesn't meet least count ${leastCount}`);
            }
          }

          calibrationPoints.push(calibPointId);
          types.push('uuc');
          repeatables.push(obsIndex.toString());
          values.push(obsValue);
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

      // Process dynamic columns
      if (customLayout && customLayout.columns) {
        customLayout.columns.forEach((col) => {
          if (col.key && !col.isDefault) {
            const valKey = `${rowIndex}-${col.originalIndex}`;
            const cellValue = tableInputValues[valKey] ?? (row[col.originalIndex]?.toString() || '');
            calibrationPoints.push(calibPointId);
            types.push(col.key);
            repeatables.push('0');
            values.push(cellValue || '0');
          }
        });
      }

    });

    const payloadStep3 = {
      inwardid: inwardId,
      instid: instId,
      caliblocation: caliblocation,
      calibacc: calibacc,
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

    console.log('Step 3 Payload:', payloadStep3);

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

      console.log('Step 3 saved successfully:', response.data);
      toast.success('All data submitted successfully!');
      setTimeout(() => {
        navigate(
          `/dashboards/calibration-process/inward-entry-lab/perform-calibration/${id}?caliblocation=${caliblocation}&calibacc=${calibacc}`
        );
      }, 1000);
    } catch (error) {
      console.error('Network Error:', error);
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
                  <div className="space-y-6">
                    {selectedTableData.id === 'observationmm' && selectedTableData.unitTypes ? (
                      // Render separate tables for each unit type in MM
                      selectedTableData.unitTypes.map((unitTypeGroup, groupIndex) => {
                        if (!unitTypeGroup || !unitTypeGroup.calibration_points) return null;

                        // Calculate starting row index for this unit type group
                        let startingRowIndex = 0;
                        for (let i = 0; i < groupIndex; i++) {
                          if (selectedTableData.unitTypes[i] && selectedTableData.unitTypes[i].calibration_points) {
                            startingRowIndex += selectedTableData.unitTypes[i].calibration_points.length;
                          }
                        }

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
                            (point.nominal_values?.calculated_master?.value || ''),
                            (point.nominal_values?.master?.value || ''),
                            ...observations,
                            point.calculations?.average || '',
                            point.calculations?.error || ''
                          ];
                        });

                        return (
                          <div key={groupIndex} className="mb-8">
                            <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-3 bg-blue-50 dark:bg-blue-900 p-2 rounded">
                              {unitTypeGroup.unit_type}
                            </h3>
                            <div className="overflow-x-auto border border-gray-200 dark:border-gray-600">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="bg-gray-100 dark:bg-gray-700 border-b border-gray-300 dark:border-gray-600">
                                    {(customLayout ? getCustomTableStructure().headers : tableStructure.headers).map((header, index) => (
                                      <th
                                        key={index}
                                        colSpan={header.colspan}
                                        className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider border-r border-gray-300 dark:border-gray-600 last:border-r-0"
                                      >
                                        {header.name}
                                      </th>
                                    ))}
                                  </tr>
                                  {(customLayout ? getCustomTableStructure().subHeadersRow : tableStructure.subHeadersRow).some((item) => item !== null) && (
                                    <tr className="bg-gray-50 dark:bg-gray-600 border-b border-gray-300 dark:border-gray-600">
                                      {(customLayout ? getCustomTableStructure().subHeadersRow : tableStructure.subHeadersRow).map((subHeader, index) => {
                                        const subHeaderName = subHeader && (typeof subHeader === 'object' ? subHeader.name : subHeader);
                                        return (
                                          <th
                                            key={index}
                                            className="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-300 border-r border-gray-300 dark:border-gray-600 last:border-r-0"
                                          >
                                            {subHeaderName || ""}
                                          </th>
                                        );
                                      })}
                                    </tr>
                                  )}
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                  {unitTypeRows.map((row, rowIndex) => {
                                    // Fixed: Use correct row index for this specific unit type group
                                    const actualRowIndex = startingRowIndex + rowIndex;

                                    return (
                                      <tr key={rowIndex} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                        {(customLayout ? customLayout.columns : row).map((item, index) => {
                                          const colIndex = customLayout ? item.originalIndex : index;
                                          const cell = row[colIndex];
                                          const key = `${actualRowIndex}-${colIndex}`;
                                          const currentValue = tableInputValues[key] ?? (cell?.toString() || '');

                                          const isDisabled =
                                            colIndex === 0 || // SR No
                                            colIndex === 1 || // Mode
                                            colIndex === 3 || // Calculated master (read-only)
                                            colIndex === 4 || // Master value (read-only)
                                            colIndex === 10 || // Average
                                            colIndex === 11; // Error

                                          return (
                                            <td
                                              key={colIndex}
                                              className="px-3 py-2 whitespace-nowrap text-sm border-r border-gray-200 dark:border-gray-600 last:border-r-0"
                                            >
                                              <input
                                                type="text"
                                                className={`w-full min-w-[80px] px-2 py-1 border rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-600 text-gray-900 dark:text-white ${isDisabled ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : ''
                                                  } ${observationErrors[key] ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'}`}
                                                value={currentValue}
                                                onChange={(e) => {
                                                  if (isDisabled) return;
                                                  handleInputChange(actualRowIndex, colIndex, e.target.value);
                                                  // Clear error when user starts typing
                                                  if (observationErrors[key]) {
                                                    setObservationErrors(prev => {
                                                      const newErrors = { ...prev };
                                                      delete newErrors[key];
                                                      return newErrors;
                                                    });
                                                  }
                                                }}
                                                onBlur={(e) => {
                                                  if (isDisabled) return;
                                                  handleObservationBlur(actualRowIndex, colIndex, e.target.value);
                                                }}
                                                disabled={isDisabled}
                                              />
                                              {observationErrors[key] && (
                                                <div className="text-red-500 text-xs mt-1">{observationErrors[key]}</div>
                                              )}
                                            </td>
                                          );
                                        })}
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      // Original single table rendering for other observation types
                      <div className="overflow-x-auto border border-gray-200 dark:border-gray-600">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-gray-100 dark:bg-gray-700 border-b border-gray-300 dark:border-gray-600">
                              {(customLayout ? getCustomTableStructure().headers : tableStructure.headers).map((header, index) => (
                                <th
                                  key={index}
                                  colSpan={header.colspan}
                                  className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider border-r border-gray-300 dark:border-gray-600 last:border-r-0"
                                >
                                  {header.name}
                                </th>
                              ))}
                            </tr>
                            {(customLayout ? getCustomTableStructure().subHeadersRow : tableStructure.subHeadersRow).some((item) => item !== null) && (
                              <tr className="bg-gray-50 dark:bg-gray-600 border-b border-gray-300 dark:border-gray-600">
                                {(customLayout ? getCustomTableStructure().subHeadersRow : tableStructure.subHeadersRow).map((subHeader, index) => {
                                  const subHeaderName = subHeader && (typeof subHeader === 'object' ? subHeader.name : subHeader);
                                  return (
                                    <th
                                      key={index}
                                      className="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-300 border-r border-gray-300 dark:border-gray-600 last:border-r-0"
                                    >
                                      {subHeaderName || ""}
                                    </th>
                                  );
                                })}
                              </tr>
                            )}
                          </thead>
                          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {(selectedTableData.staticRows?.length > 0
                              ? selectedTableData.staticRows
                              : [Array(customLayout ? customLayout.columns.length : tableStructure.subHeadersRow.length).fill('')]
                            ).map((row, rowIndex) => (
                              <tr key={rowIndex} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                {(customLayout ? customLayout.columns : row).map((item, index) => {
                                  const colIndex = customLayout ? item.originalIndex : index;
                                  let cell = row[colIndex];

                                  // ✅ FETCH FROM OBSERVATIONS IF DYNAMIC COLUMN
                                  if (customLayout && item.key && !item.isDefault && observations && observations[rowIndex]) {
                                    const pointData = observations[rowIndex];
                                    if (pointData[item.key] !== undefined && pointData[item.key] !== null) {
                                      cell = pointData[item.key];
                                    }
                                  }

                                  const key = `${rowIndex}-${colIndex}`;
                                  const currentValue = tableInputValues[key] ?? (cell?.toString() || '');

                                  // ✅ ADD GTM UNIT SELECT HANDLING (BEFORE RTD WI)
                                  if (selectedTableData.id === 'observationgtm' && cell === 'UNIT_SELECT') {
                                    return (
                                      <td key={colIndex} className="px-3 py-2 whitespace-nowrap text-sm border-r border-gray-200 dark:border-gray-600 last:border-r-0">
                                        <Select
                                          options={unitsList}
                                          className="w-full text-sm"
                                          classNamePrefix="select"
                                          placeholder="Select unit..."
                                          value={unitsList.find(u => u.label === currentValue)}
                                          styles={{
                                            control: (base) => ({
                                              ...base,
                                              minHeight: '32px',
                                              fontSize: '0.875rem'
                                            })
                                          }}
                                          onChange={(selected) => {
                                            handleInputChange(rowIndex, colIndex, selected?.label || '');
                                            handleObservationBlur(rowIndex, colIndex, selected?.value?.toString() || '');
                                          }}
                                        />
                                      </td>
                                    );
                                  }

                                  // ✅ ADD GTM STATIC TEXT HANDLING (BEFORE RTD WI)
                                  if (selectedTableData.id === 'observationgtm' && (cell === '-' || cell === 'UUC' || cell === 'Master')) {
                                    return (
                                      <td key={colIndex} className="px-3 py-2 whitespace-nowrap text-sm border-r border-gray-200 dark:border-gray-600 last:border-r-0 text-center font-medium">
                                        {cell}
                                      </td>
                                    );
                                  }

                                  // Special handling for UNIT_SELECT in observationrtdwi Master row
                                  if (selectedTableData.id === 'observationrtdwi' && cell === 'UNIT_SELECT') {
                                    return (
                                      <td key={colIndex} className="px-3 py-2 whitespace-nowrap text-sm border-r border-gray-200 dark:border-gray-600 last:border-r-0">
                                        <Select
                                          options={unitsList}
                                          className="w-full text-sm"
                                          classNamePrefix="select"
                                          placeholder="Select unit..."
                                          value={unitsList.find(u => u.label === currentValue)}
                                          styles={{
                                            control: (base) => ({
                                              ...base,
                                              minHeight: '32px',
                                              fontSize: '0.875rem'
                                            })
                                          }}
                                          onChange={(selected) => {
                                            handleInputChange(rowIndex, colIndex, selected?.label || '');
                                            handleObservationBlur(rowIndex, colIndex, selected?.value?.toString() || '');
                                          }}
                                        />
                                      </td>
                                    );
                                  }
                                  if ((selectedTableData.id === 'observationrtdwi' || selectedTableData.id === 'observationtswoi') && (cell === '-' || cell === 'UUC' || cell === 'Master')) {
                                    return (
                                      <td key={colIndex} className="px-3 py-2 whitespace-nowrap text-sm border-r border-gray-200 dark:border-gray-600 last:border-r-0 text-center font-medium">
                                        {cell}
                                      </td>
                                    );
                                  }

                                  let isDisabled = colIndex === 0;

                                  if (selectedTableData.id === 'observationrtdwi') {
                                    const rowType = row[2];
                                    isDisabled = isDisabled || [2].includes(colIndex) || cell === '-';
                                    if (rowType === 'UUC') {
                                      isDisabled = isDisabled || [1, 10, 11, 12, 13, 14].includes(colIndex);
                                    }
                                    if (rowType === 'Master') {
                                      if ([11].includes(colIndex)) {
                                        isDisabled = false;
                                      } else if ([0, 1, 4, 12, 13, 14].includes(colIndex)) {
                                        isDisabled = true;
                                      }
                                    }
                                  }

                                  else if (selectedTableData.id === 'observationtswoi') {
                                    const label = row[2];
                                    let rowType = '';
                                    if (savedRowLayout) {
                                      const matched = savedRowLayout.find(r => r.label === label);
                                      rowType = matched ? matched.type : '';
                                    } else {
                                      rowType = label === 'UUC' ? 'uuc' : label === 'Master' ? 'master' : '';
                                    }

                                    isDisabled = isDisabled || [2].includes(colIndex) || cell === '-';
                                    if (rowType === 'uuc') {
                                      // Disable: Average (10), Average with corrected mv (12), Deviation (14)
                                      // Enable: mV generated On ambient (11), Average (Unit) (13)
                                      isDisabled = isDisabled || [5 + observationCount, 7 + observationCount, 9 + observationCount].includes(colIndex);
                                    }
                                    if (rowType === 'master') {
                                      // Same as above + disable Set Point (1), Sensitivity Coefficient (4)
                                      isDisabled = isDisabled || [1, 4, 5 + observationCount, 7 + observationCount, 9 + observationCount].includes(colIndex);
                                    }
                                  }

                                  else if (selectedTableData.id === 'observationgtm') {
                                    const rowType = row[2];
                                    isDisabled = isDisabled || [2].includes(colIndex) || cell === '-';
                                    if (rowType === 'UUC') {
                                      // UUC row: SR No, Value Of, Sensitivity Coefficient, Average (Ω), Average (°C), Deviation disabled
                                      isDisabled = isDisabled || [0, 1, 2, 4, 5, 11, 12, 13].includes(colIndex);
                                    }
                                    if (rowType === 'Master') {
                                      // Master row: SR No, Set Point, Value Of, Range, Deviation disabled
                                      isDisabled = isDisabled || [0, 1, 2, 3, 11, 13].includes(colIndex);
                                    }
                                  }

                                  else if (selectedTableData.id === 'observationdg') {
                                    // Sr No, and all calculated fields (cols 6-10) are disabled
                                    isDisabled = isDisabled || [0, 1, 6, 7, 8, 9, 10].includes(colIndex);
                                  }
                                  else if (selectedTableData.id === 'observationdpg') {
                                    isDisabled = isDisabled || [1, 2, 3 + observationCount, 4 + observationCount, 5 + observationCount, 6 + observationCount].includes(colIndex);
                                  } else if (selectedTableData.id === 'observationodfm') {
                                    isDisabled = isDisabled || [2, 3 + observationCount, 4 + observationCount].includes(colIndex);
                                  } else if (selectedTableData.id === 'observationppg') {
                                    isDisabled = isDisabled || [1, 2, 4 + observationCount, 5 + observationCount, 6 + observationCount, 7 + observationCount].includes(colIndex);
                                  } else if (selectedTableData.id === 'observationapg') {
                                    isDisabled = isDisabled || [1, 2, 3 + observationCount, 4 + observationCount, 5 + observationCount].includes(colIndex);
                                  } else if (selectedTableData.id === 'observationctg') {
                                    isDisabled = isDisabled || [1, 2 + observationCount, 3 + observationCount].includes(colIndex);
                                  } else if (selectedTableData.id === 'observationmsr') {
                                    isDisabled = isDisabled || [1, 2 + observationCount, 3 + observationCount].includes(colIndex);
                                  } else if (selectedTableData.id === 'observationmg') {
                                    isDisabled = isDisabled || [3 + observationCount, 4 + observationCount, 5 + observationCount].includes(colIndex);
                                  } else if (selectedTableData.id === 'observationavg') {
                                    isDisabled = isDisabled || [3 + observationCount, 4 + observationCount, 5 + observationCount].includes(colIndex);
                                  } else if (selectedTableData.id === 'observationit') {
                                    isDisabled = isDisabled || [1, 2 + observationCount, 3 + observationCount].includes(colIndex);
                                  } else if (selectedTableData.id === 'observationexm') {
                                    isDisabled = isDisabled || [1, 2 + observationCount, 3 + observationCount].includes(colIndex);
                                  } else if (selectedTableData.id === 'observationfg') {
                                    isDisabled = isDisabled || [2 + observationCount, 3 + observationCount].includes(colIndex);
                                  } else if (selectedTableData.id === 'observationhg') {
                                    isDisabled = isDisabled || [1, 2 + observationCount, 3 + observationCount].includes(colIndex);
                                  } else if (selectedTableData.id === 'observationmt') {
                                    isDisabled = isDisabled || [1, 2 + observationCount, 3 + observationCount].includes(colIndex);
                                  }

                                  return (
                                    <td
                                      key={colIndex}
                                      className="px-3 py-2 whitespace-nowrap text-sm border-r border-gray-200 dark:border-gray-600 last:border-r-0"
                                    >
                                      <input
                                        type="text"
                                        className={`w-full min-w-[80px] px-2 py-1 border rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-600 text-gray-900 dark:text-white ${isDisabled ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : ''
                                          } ${observationErrors[key] ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'}`}
                                        value={currentValue}
                                        onChange={(e) => {
                                          if (isDisabled) return;
                                          handleInputChange(rowIndex, colIndex, e.target.value);
                                          if (observationErrors[key]) {
                                            setObservationErrors(prev => {
                                              const newErrors = { ...prev };
                                              delete newErrors[key];
                                              return newErrors;
                                            });
                                          }
                                        }}
                                        onBlur={(e) => {
                                          if (isDisabled) return;
                                          if (selectedTableData.id === 'observationctg' ||
                                            selectedTableData.id === 'observationdpg' ||
                                            selectedTableData.id === 'observationodfm' ||
                                            selectedTableData.id === 'observationmm' ||
                                            selectedTableData.id === 'observationit' ||
                                            selectedTableData.id === 'observationmt' ||
                                            selectedTableData.id === 'observationmg' ||
                                            selectedTableData.id === 'observationfg' ||
                                            selectedTableData.id === 'observationhg' ||
                                            selectedTableData.id === 'observationppg' ||
                                            selectedTableData.id === 'observationexm' ||
                                            selectedTableData.id === 'observationmsr' ||
                                            selectedTableData.id === 'observationgtm' ||
                                            selectedTableData.id === 'observationdg' ||
                                            selectedTableData.id === 'observationtswoi' ||
                                            selectedTableData.id === 'observationrtdwi') {
                                            handleObservationBlur(rowIndex, colIndex, e.target.value);
                                          } else {
                                            handleRowSave(rowIndex);
                                          }
                                        }}
                                        disabled={isDisabled}
                                      />
                                      {observationErrors[key] && (
                                        <div className="text-red-500 text-xs mt-1">{observationErrors[key]}</div>
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
                  </div>
                )}

                {/* ADDED: Second Table for table1 columns */}
                {table1Columns && table1Columns.length > 0 && observations && observations.length > 0 && (
                  <>
                    <h3 className="font-semibold mb-2 text-base mt-6 text-gray-800 dark:text-gray-200">Additional Information</h3>
                    <div className="overflow-x-auto mb-6">
                      <table className="w-full border border-gray-300 dark:border-gray-600 text-sm">
                        <thead className="bg-gray-100 dark:bg-gray-700">
                          <tr>
                            <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left text-gray-700 dark:text-gray-200">Sr. No.</th>
                            {table1Columns.sort((a, b) => a.sort_order - b.sort_order).map((col, index) => (
                              <th key={index} className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left uppercase text-gray-700 dark:text-gray-200">
                                {col.display_name}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                          {(() => {
                            let allPoints = [];
                            if (observationTemplate === 'observationmm' && observations.length > 0 && observations[0].calibration_points) {
                              observations.forEach(ut => {
                                if (ut.calibration_points) allPoints.push(...ut.calibration_points);
                              });
                            } else {
                              allPoints = observations;
                            }
                            return allPoints.map((point, rowIndex) => (
                              <tr key={rowIndex} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 dark:text-white">
                                  {point.sr_no || point.sequence_number || rowIndex + 1}
                                </td>
                                {table1Columns.sort((a, b) => a.sort_order - b.sort_order).map((col, colIndex) => {
                                  const key = `t1_${rowIndex}_${col.column_key}`;
                                  return (
                                    <td key={colIndex} className="border border-gray-300 dark:border-gray-600 px-3 py-2">
                                      <input
                                        type="text"
                                        className="w-full px-2 py-1 border rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-600 text-gray-900 dark:text-white border-gray-200 dark:border-gray-600"
                                        value={tableInputValues[key] ?? (point[col.column_key] !== undefined && point[col.column_key] !== null ? point[col.column_key].toString() : '')}
                                        onChange={(e) => {
                                          const newVal = e.target.value;
                                          setTableInputValues(prev => ({ ...prev, [key]: newVal }));

                                          const newObs = [...observations];
                                          if (newObs[rowIndex]) {
                                            newObs[rowIndex] = {
                                              ...newObs[rowIndex],
                                              [col.column_key]: newVal
                                            };
                                            setObservations(newObs);
                                          }
                                        }}
                                      />
                                    </td>
                                  );
                                })}
                              </tr>
                            ));
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </>
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
                  // required attribute removed
                  />
                  {errors.tempend && <p className="text-red-500 text-xs mt-1">{errors.tempend}</p>}
                  {!errors.tempend && !formData.tempend && (
                    <p className="text-red-500 text-xs mt-1">This field is required</p>
                  )}
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
                  // required attribute removed
                  />
                  {errors.humiend && <p className="text-red-500 text-xs mt-1">{errors.humiend}</p>}
                  {!errors.humiend && !formData.humiend && (
                    <p className="text-red-500 text-xs mt-1">This field is required</p>
                  )}
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
                    value={formatDateForInput(formData.enddate)}
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
                    value={formatDateForInput(formData.duedate)}
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
