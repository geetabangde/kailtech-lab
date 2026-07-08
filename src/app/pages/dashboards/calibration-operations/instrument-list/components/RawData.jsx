import { useState, useEffect } from "react";
import axios from "utils/axios";
import Select from "react-select";
import { toast } from "sonner";
import { Button } from "components/ui/Button";
import { PencilIcon } from "@heroicons/react/24/outline";

export default function RawData({
  instrumentId,
  formatId,
  formatValue,
}) {
  const [resolvedFormatValue, setResolvedFormatValue] = useState(formatValue || "");
  const lookupKey = resolvedFormatValue
    ? (resolvedFormatValue === "exten"
      ? "observationexm"
      : resolvedFormatValue.startsWith("observation")
        ? resolvedFormatValue
        : "observation" + resolvedFormatValue)
    : "";


  const [customLayout, setCustomLayout] = useState(null);
  const [backendColumns, setBackendColumns] = useState(null);
  const [observationCount, setObservationCount] = useState(5);
  const [loadedRepeatCount, setLoadedRepeatCount] = useState(null);

  // const [unitsList, setUnitsList] = useState([]); // Commented out: unitsList was used in custom config table, not needed for mock preview table

  // =========================================================================
  // COMMENTED OUT ORIGINAL STATE VARIABLES
  // Definition: These states were used for manual custom table config/formulas creator,
  // which is now replaced with a dynamic, format-specific read-only preview of the observation table.
  // =========================================================================
  /*
  const [tables1, setTables1] = useState([{
    id: Date.now(),
    tableName: "",
    setpoint: null,
    masterRepeatable: "",
    uucRepeatable: "",
    fixedRepeatable: "",
    rows: [],
    observationRows: []
  }]);
  const [rows2, setRows2] = useState([]);
  const [successMessage, setSuccessMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [functionOptions, setFunctionOptions] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [allFunctionsData, setAllFunctionsData] = useState({});
  */

  // Prevent number input scroll behavior
  useEffect(() => {
    const preventNumberInputScroll = (e) => {
      if (e.target.type === 'number') {
        e.preventDefault();
      }
    };

    document.addEventListener('wheel', preventNumberInputScroll, { passive: false });

    return () => {
      document.removeEventListener('wheel', preventNumberInputScroll);
    };
  }, []);

  // =========================================================================
  // COMMENTED OUT UNITS FETCHING
  // Definition: Fetched units list for custom configuration table dropdowns.
  // Commented out since the mock preview table uses static disabled units.
  // =========================================================================
  /*
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
    fetchUnits();
  }, []);
  */

  // =========================================================================
  // ACTIVE INITIALIZATION FLOW
  // Sequentially fetches lab options first and then fetches/maps the observation
  // settings to avoid dependency loops and fix ESLint React hook warnings.
  // =========================================================================
  useEffect(() => {
    const init = async () => {
      if (instrumentId) {
        try {
          const authToken = localStorage.getItem("authToken");
          if (instrumentId) {
            const layoutResponse = await axios.get(
              `/observationlayout/get-formate-layout/${instrumentId}`,
              {
                headers: {
                  Authorization: `Bearer ${authToken}`,
                  "Content-Type": "application/json",
                },
              }
            );
            const resData = layoutResponse.data;
            if (resData && resData.success) {
              const dataVal = resData.data;
              
              if (dataVal && Array.isArray(dataVal.columns) && dataVal.columns.length > 0) {
                const formatData = dataVal.columns[0];
                
                if (formatData.observation_repeat !== undefined && formatData.observation_repeat !== null) {
                  const repeatVal = parseInt(formatData.observation_repeat);
                  setObservationCount(repeatVal);
                  setLoadedRepeatCount(repeatVal);
                }
                
                if (typeof formatData.rawdatakey === 'string' && formatData.rawdatakey.startsWith('[')) {
                  try {
                    const columnsArray = JSON.parse(formatData.rawdatakey);
                    setBackendColumns(columnsArray);
                  } catch (e) {
                    console.error("Failed to parse rawdatakey string:", e);
                  }
                }
              }
            }
          }
        } catch (error) {
          console.warn("Failed to fetch layout from new endpoint in init, falling back...", error);
        }


      }
    };

    init();
  }, [instrumentId, formatId]);

  // =========================================================================
  // ACTIVE FORMAT RESOLUTION
  // Dynamically fetches all formats from /get-formate and matches the formatId
  // to resolve its suffix/description. This acts as a bulletproof fallback if
  // formatValue prop is empty or mismatched during transition steps.
  // =========================================================================
  useEffect(() => {
    const resolveFormat = async () => {
      if (!formatId) return;
      try {
        const authToken = localStorage.getItem("authToken");
        const response = await axios.get("/get-formate", {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        });
        if (response.data && Array.isArray(response.data.data)) {
          const match = response.data.data.find(
            (item) => item.id.toString() === formatId.toString()
          );
          if (match) {
            console.log("Resolved format suffix from formatId:", match.description);
            setResolvedFormatValue(match.description);
          } else {
            console.warn("No format match found for ID:", formatId);
            if (formatValue) setResolvedFormatValue(formatValue);
          }
        }
      } catch (error) {
        console.error("Error resolving format from formatId:", error);
        if (formatValue) setResolvedFormatValue(formatValue);
      }
    };
    resolveFormat();
  }, [formatId, formatValue]);

  // =========================================================================
  // COMMENTED OUT ORIGINAL FETCH METHODS
  // Commented out to avoid unused function and React dependency issues.
  // =========================================================================
  /*
  const fetchLabOptions = async () => {
    try {
      const authToken = localStorage.getItem("authToken");
      const response = await axios.get("/master/list-lab", {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      if (response.data.status === "true" && response.data.data) {
        const labOptions = response.data.data.map((lab) => ({
          value: lab.id,
          label: lab.name,
        }));
        setLabToCalibrateOptions(labOptions);
      }
    } catch (error) {
      console.error("Error fetching lab options:", error);
    }
  };

  const fetchObservationSettings = async () => {
    setLoading(true);
    try {
      const authToken = localStorage.getItem("authToken");
      const response = await axios.get(
        `/observationsetting/get-observation-setting/${instrumentId}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.data.success) {
        const data = response.data.data;
        const labValue = data.allottolab
          ? labToCalibrateOptions.find((opt) => opt.value === data.allottolab)
          : null;

        setRows3([{
          id: 1,
          checked: true,
          setpoint: null,
          masterRepeatable: data.master?.toString() || "",
          uucRepeatable: data.uuc?.toString() || "",
          labToCalibrate: labValue || (data.allottolab ? { value: data.allottolab, label: data.allottolab } : null),
        }]);
      }
    } catch (error) {
      console.error("Error fetching observation settings:", error);
    } finally {
      setLoading(false);
    }
  };
  */

  // =========================================================================
  // COMMENTED OUT SELECT CHANGE HANDLER
  // Commented out because the "Lab to Calibrate" dropdown UI is commented out.
  // =========================================================================
  /*
  const handleSelectChange3 = (id, field, selectedOption) => {
    setRows3(
      rows3.map((row) =>
        row.id === id ? { ...row, [field]: selectedOption } : row,
      ),
    );
  };
  */

  // ACTIVE SAVE HANDLER (REMOVED IN PREVIEW)

  // =========================================================================
  // ACTIVE OBSERVATION TABLE PREVIEW UTILITIES
  // Definition: Helpers, Mock Data generator, and Row Creators used to populate 
  // the dynamic, format-specific read-only preview of the observation table (Option B).
  // =========================================================================
  const safeGetValue = (item) => {
    if (!item) return "";
    if (typeof item === "object" && item !== null) {
      return item.value !== null && item.value !== undefined ? item.value : "";
    }
    return item.toString();
  };

  const safeGetArray = (item, defaultLength = 0) => {
    if (!item) return Array(defaultLength).fill("");
    if (Array.isArray(item)) return item;
    if (typeof item === "string") return [item];
    return Array(defaultLength).fill("");
  };

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

  // Mock observation generator for exactly 3 rows with realistic mock data
  const getMockData = (template, count = 5) => {
    if (template === 'observationmm') {
      return [
        {
          unit_type: "V DC",
          calibration_points: [
            { sequence_number: 1, mode: "Measure", range: "10 V", nominal_values: { master: { value: "10.00", unit: "V" }, calculated_master: { value: "10.00", unit: "V" } }, observations: Array(count).fill({ value: "10.01" }), calculations: { average: "10.01", error: "0.01" } },
            { sequence_number: 2, mode: "Measure", range: "20 V", nominal_values: { master: { value: "20.00", unit: "V" }, calculated_master: { value: "20.00", unit: "V" } }, observations: Array(count).fill({ value: "20.02" }), calculations: { average: "20.02", error: "0.02" } },
            { sequence_number: 3, mode: "Measure", range: "30 V", nominal_values: { master: { value: "30.00", unit: "V" }, calculated_master: { value: "30.00", unit: "V" } }, observations: Array(count).fill({ value: "30.03" }), calculations: { average: "30.03", error: "0.03" } }
          ]
        }
      ];
    }

    return [1, 2, 3].map((num) => {
      const nominal = num * 10;
      const obsValue = (nominal + (num * 0.1)).toFixed(2);
      const obsArray = Array(count).fill(obsValue);

      return {
        id: num,
        sr_no: num,
        sequence_number: num,
        test_point: nominal.toString(),
        nominal_value: nominal.toString(),
        nominal_value_master: nominal.toString(),
        uuc_value: nominal.toString(),
        set_pressure_uuc: nominal.toString(),
        set_pressure_master: nominal.toString(),
        converted_uuc_value: nominal.toString(),
        uuc: "UUC",
        set_point: nominal.toString(),
        set_point_uuc: nominal.toString(),
        range: `${nominal} - ${nominal + 10}`,
        unit: "°C",
        sensitivity_coefficient: "1.00",
        uuc_values: obsArray,
        master_values: obsArray,
        observations: obsArray,
        master_readings: { m1: obsValue, m2: obsValue, m3: obsValue, m4: obsValue, m5: obsValue, m6: obsValue },
        calculated_uuc: obsValue,
        mean: obsValue,
        average: obsValue,
        average_master: obsValue,
        average_uuc: obsValue,
        error: (num * 0.1).toFixed(2),
        hysterisis: "0.02",
        hysteresis: "0.02",
        repeatability: "0.01",
        set1_forward: obsValue,
        set1_backward: obsValue,
        set2_forward: obsValue,
        set2_backward: obsValue,
        average_forward: obsValue,
        average_backward: obsValue,
        error_forward: (num * 0.1).toFixed(2),
        error_backward: (num * 0.1).toFixed(2),
        ambient_master: "25.0",
        s_average_master: obsValue,
        c_average_master: obsValue,
        converted_average_master: obsValue,
        precision: { uuc_least_count: "0.01", master_least_count: "0.01" }
      };
    });
  };

  // Create observation rows matching CalibrateStep3.jsx
  const createObservationRows = (observationData, template, count = 5) => {
    if (!observationData)
      return {
        rows: [],
      };

    let dataArray = [];
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
      });
    }
    else if (template === 'observationrtdwi') {
      dataArray.forEach((point) => {
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
      });
    }
    else if (template === 'observationmm') {
      const allRows = [];
      dataArray.forEach((unitTypeGroup) => {
        if (!unitTypeGroup || !unitTypeGroup.calibration_points) return;
        unitTypeGroup.calibration_points.forEach((point, pointIndex) => {
          if (!point) return;
          const observations = [];
          for (let i = 0; i < count; i++) {
            observations.push(point.observations?.[i]?.value || '');
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
        });
      });
      return { rows: allRows, unitTypes: dataArray };
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
      });
    } else if (template === 'observationapg') {
      dataArray.forEach((obs) => {
        if (!obs) return;
        const row = [
          obs.sr_no?.toString() || '',
          safeGetValue(obs.uuc),
          safeGetValue(obs.calculated_uuc),
          ...Array.from({ length: count }, (_, i) => safeGetValue(obs[`m${i + 1}`])),
          safeGetValue(obs.mean),
          safeGetValue(obs.error),
          safeGetValue(obs.hysterisis),
        ];
        rows.push(row);
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
      });
    }
    else if (template === 'observationtswoi') {
      dataArray.forEach((point) => {
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
          safeGetValue(point.average_uuc),
          safeGetValue(point.ambient_uuc),
          safeGetValue(point.s_average_uuc),
          safeGetValue(point.c_average_uuc),
          safeGetValue(point.error)
        ];
        rows.push(uucRow);

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
          '-'
        ];
        rows.push(masterRow);
      });
    }

    return { rows };
  };

  const getObservationTables = (count = 5) => {
    const mockObs = getMockData(lookupKey, count);
    return [
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
            'OBSERVATION ON UUC': getObservationSubheaders('observationdpg', count),
          },
          remainingHeaders: ['MEAN (UUCUNIT)', 'ERROR (UUCUNIT)', 'REPEATABILITY (UUCUNIT)', 'HYSTERISIS (UUCUNIT)'],
        },
        staticRows: createObservationRows(mockObs, 'observationdpg', count).rows,
      },
      {
        id: 'observationgtm',
        name: 'Observation GTM',
        category: 'Temperature',
        structure: {
          singleHeaders: ['Sr. No.', 'Set Point (°C)', 'Value Of', 'Range', 'Unit', 'Sensitivity Coefficient'],
          subHeaders: {
            'Observation': getObservationSubheaders('observationgtm', count)
          },
          remainingHeaders: ['Average (Ω)', 'Average (°C)', 'Deviation (°C)']
        },
        staticRows: createObservationRows(mockObs, 'observationgtm', count).rows,
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
        staticRows: createObservationRows(mockObs, 'observationdg', count).rows,
      },
      {
        id: 'observationmsr',
        name: 'Observation MSR',
        category: 'Measuring',
        structure: {
          thermalCoeff: true,
          singleHeaders: ['Sr. No.', 'Nominal/ Set Value'],
          subHeaders: {
            'Observation on UUC': getObservationSubheaders('observationmsr', count)
          },
          remainingHeaders: ['Average', 'Error']
        },
        staticRows: createObservationRows(mockObs, 'observationmsr', count).rows,
      },
      {
        id: 'observationrtdwi',
        name: 'Observation RTD WI',
        category: 'RTD',
        structure: {
          singleHeaders: ['Sr. No.', 'Set Point (°C)', 'Value Of', 'Unit', 'Sensitivity Coefficient'],
          subHeaders: {
            'Observation': getObservationSubheaders('observationrtdwi', count)
          },
          remainingHeaders: ['Average', 'mV generated On ambient', 'Average with corrected mv', 'Average (°C)', 'Deviation (°C)']
        },
        staticRows: createObservationRows(mockObs, 'observationrtdwi', count).rows,
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
            'OBSERVATION ON UUC': getObservationSubheaders('observationppg', count),
          },
          remainingHeaders: ['MEAN (UUCUNIT)', 'ERROR (UUCUNIT)', 'REPEATABILITY (UUCUNIT)', 'HYSTERISIS (UUCUNIT)'],
        },
        staticRows: createObservationRows(mockObs, 'observationppg', count).rows,
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
            'Observation on Master': getObservationSubheaders('observationavg', count)
          },
          remainingHeaders: [
            'Mean (Master Unit)',
            'Error (Master Unit)',
            'Hysteresis (Master Unit)'
          ]
        },
        staticRows: createObservationRows(mockObs, 'observationavg', count).rows,
      },
      {
        id: 'observationhg',
        name: 'Observation HG',
        category: 'Height Gauge',
        structure: {
          thermalCoeff: true,
          singleHeaders: ['Sr. No.', 'Nominal/ Set Value'],
          subHeaders: {
            'Observation on UUC': getObservationSubheaders('observationhg', count)
          },
          remainingHeaders: ['Average', 'Error']
        },
        staticRows: createObservationRows(mockObs, 'observationhg', count).rows,
      },
      {
        id: 'observationfg',
        name: 'Observation FG',
        category: 'Force Gauge',
        structure: {
          thermalCoeff: true,
          singleHeaders: ['Sr. No.', 'Nominal Value'],
          subHeaders: {
            'Observation on UUC': getObservationSubheaders('observationfg', count)
          },
          remainingHeaders: ['Average (Master)', 'Error']
        },
        staticRows: createObservationRows(mockObs, 'observationfg', count).rows,
      },
      {
        id: 'observationmm',
        name: 'Observation MM',
        category: 'Multimeter',
        structure: {
          singleHeaders: ['Sr. No.', 'Mode', 'Range', 'Nominal/ Set Value on master (Calculated)', 'Nominal/ Set Value on master'],
          subHeaders: {
            'Observation on UUC': getObservationSubheaders('observationmm', count)
          },
          remainingHeaders: ['Average', 'Error']
        },
        staticRows: createObservationRows(mockObs, 'observationmm', count).rows,
        unitTypes: createObservationRows(mockObs, 'observationmm', count).unitTypes,
      },
      {
        id: 'observationexm',
        name: 'Observation EXM',
        category: 'External Micrometer',
        structure: {
          thermalCoeff: true,
          singleHeaders: ['Sr. No.', 'Nominal/ Set Value'],
          subHeaders: {
            'Observation on UUC': getObservationSubheaders('observationexm', count)
          },
          remainingHeaders: ['Average', 'Error']
        },
        staticRows: createObservationRows(mockObs, 'observationexm', count).rows,
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
            'Observation on UUC': getObservationSubheaders('observationmg', count)
          },
          remainingHeaders: [
            'Mean ([master unit])',
            'Error ([master unit])',
            'Hysterisis ([master unit])'
          ]
        },
        staticRows: createObservationRows(mockObs, 'observationmg', count).rows,
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
            'Observation on UUC': getObservationSubheaders('observationodfm', count),
          },
          remainingHeaders: ['Average (Master Unit)', 'Error (Master Unit)'],
        },
        staticRows: createObservationRows(mockObs, 'observationodfm', count).rows,
      },
      {
        id: 'observationapg',
        name: 'Observation APG',
        category: 'Pressure',
        structure: {
          singleHeaders: ['Sr no', 'Set Pressure on UUC (kg/cm²)', 'Set Pressure on UUC (bar)'],
          subHeaders: {
            'Observations on Master (bar)': getObservationSubheaders('observationapg', count),
          },
          remainingHeaders: ['Mean (bar)', 'Error (bar)', 'Hysterisis (bar)'],
        },
        staticRows: createObservationRows(mockObs, 'observationapg', count).rows,
      },
      {
        id: 'observationit',
        name: 'Observation IT',
        category: 'Internal Thread',
        structure: {
          thermalCoeff: true,
          singleHeaders: ['Sr. No.', 'Nominal/ Set Value'],
          subHeaders: {
            'Observation on UUC': getObservationSubheaders('observationit', count)
          },
          remainingHeaders: ['Average', 'Error']
        },
        staticRows: createObservationRows(mockObs, 'observationit', count).rows,
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
            'Observation on UUC': getObservationSubheaders('observationmt', count)
          },
          remainingHeaders: ['Average', 'Error']
        },
        staticRows: createObservationRows(mockObs, 'observationmt', count).rows,
      },
      {
        id: 'observationctg',
        name: 'Observation CTG',
        category: 'Temperature',
        structure: {
          thermalCoeff: true,
          singleHeaders: ['Sr. No.', 'Nominal Value'],
          subHeaders: {
            'Observation on UUC': getObservationSubheaders('observationctg', count),
          },
          remainingHeaders: ['Average', 'Error'],
        },
        staticRows: createObservationRows(mockObs, 'observationctg', count).rows,
      },
      {
        id: 'observationtswoi',
        name: 'Observation TSWOI',
        category: 'Temperature',
        structure: {
          singleHeaders: ['Sr. No.', 'Set Point (Unit)', 'Value Of', 'Unit', 'Sensitivity Coefficient'],
          subHeaders: {
            'Observation': getObservationSubheaders('observationtswoi', count)
          },
          remainingHeaders: ['Average', 'mV generated On ambient', 'Average with corrected mv', 'Average (Unit)', 'Deviation (Unit)']
        },
        staticRows: createObservationRows(mockObs, 'observationtswoi', count).rows,
      },
    ];
  };

  const selectedTableData = getObservationTables(observationCount).find((table) => table.id === lookupKey);

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

  const getDefaultLayout = (templateKey, count = 5) => {
    const tableData = getObservationTables(count).find((table) => table.id === templateKey);
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
  };

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



  const reconstructLayout = (backendCols, templateKey) => {
    const tableData = getObservationTables(5).find((table) => table.id === templateKey);
    let obsGroupName = "Observation";
    if (tableData && tableData.structure?.subHeaders) {
      const groupNames = Object.keys(tableData.structure.subHeaders);
      const matched = groupNames.find(g => ["Observation", "Observation on UUC", "OBSERVATION ON UUC", "Observation on Master", "Observations on Master (bar)"].includes(g));
      if (matched) obsGroupName = matched;
    }

    const obsColsCount = backendCols.filter(c => c.group_name === obsGroupName).length;
    const observationCountVal = obsColsCount > 0 ? obsColsCount : 5;

    const defaultLayout = getDefaultLayout(templateKey, observationCountVal);
    if (!defaultLayout || !defaultLayout.columns) return null;
    const sorted = [...backendCols].sort((a, b) => a.sort_order - b.sort_order);
    const reconstructed = [];
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
    if (!lookupKey) return;
    let initialCount = 5;

    const tableData = getObservationTables(5).find((table) => table.id === lookupKey);
    if (tableData && tableData.structure?.subHeaders) {
      const groupNames = Object.keys(tableData.structure.subHeaders);
      const matched = groupNames.find(g => ["Observation", "Observation on UUC", "OBSERVATION ON UUC", "Observation on Master", "Observations on Master (bar)"].includes(g));
      if (matched) {
        initialCount = tableData.structure.subHeaders[matched].length;
      }
    }

    if (loadedRepeatCount !== null) {
      initialCount = loadedRepeatCount;
    } else if (backendColumns && backendColumns.length > 0) {
      const obsGroupName = tableData && tableData.structure?.subHeaders
        ? Object.keys(tableData.structure.subHeaders).find(g => ["Observation", "Observation on UUC", "OBSERVATION ON UUC", "Observation on Master", "Observations on Master (bar)"].includes(g))
        : "Observation";
      const count = backendColumns.filter(c => c.group_name === obsGroupName).length;
      if (count > 0) initialCount = count;
    }

    setObservationCount(initialCount);

    if (backendColumns && backendColumns.length > 0) {
      const reconstructed = reconstructLayout(backendColumns, lookupKey);
      if (reconstructed) {
        setCustomLayout(reconstructed);
        return;
      }
    }
    setCustomLayout(getDefaultLayout(lookupKey, initialCount));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lookupKey, backendColumns, loadedRepeatCount]);

  const [isEditingHeaders, setIsEditingHeaders] = useState(false);
  const [draggedColIndex, setDraggedColIndex] = useState(null);

  const handleDragStart = (e, index) => {
    setDraggedColIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    // Firefox requires dataTransfer data to be set
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    if (draggedColIndex === null || draggedColIndex === targetIndex) return;

    const newCols = [...customLayout.columns];
    const [draggedItem] = newCols.splice(draggedColIndex, 1);
    newCols.splice(targetIndex, 0, draggedItem);

    setCustomLayout({ ...customLayout, columns: newCols });
    setDraggedColIndex(null);
  };



  const [isSavingLayout, setIsSavingLayout] = useState(false);

  const handleSaveLayout = async () => {
    if (!formatId) {
      toast.error("Format ID is missing!");
      return;
    }

    setIsSavingLayout(true);
    try {
      const authToken = localStorage.getItem("authToken");
      const payload = {
        formatId: parseInt(formatId),
        instid: instrumentId || instrumentId, // Using the prop
        observation_repeat: observationCount,
        columns: customLayout && customLayout.columns ? customLayout.columns.map((col, index) => ({
          column_key: col.key,
          display_name: col.headerName,
          sort_order: index,
          group_name: col.group,
        })) : [],
      };

      const response = await axios.post(
        "/observationlayout/save-rawdata-layout",
        payload,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success || response.data.status === "true" || response.data.status === true) {
        toast.success("Format layout saved successfully!");
        setIsEditingHeaders(false);
      } else {
        toast.error("Failed to save format layout. Please try again.");
      }
    } catch (error) {
      console.error("Error saving layout:", error);
      toast.error("An error occurred while saving the layout.");
    } finally {
      setIsSavingLayout(false);
    }
  };






  // =========================================================================
  // COMMENTED OUT SELECT STYLES
  // Commented out because the "Lab to Calibrate" dropdown UI is commented out.
  // =========================================================================
  /*
  const customSelectStyles = {
    control: (base, state) => ({
      ...base,
      minHeight: "42px",
      minWidth: "200px",
      borderColor: state.isFocused ? "#3b82f6" : "#d1d5db",
      boxShadow: state.isFocused ? "0 0 0 2px rgba(59, 130, 246, 0.5)" : "none",
      "&:hover": {
        borderColor: "#3b82f6",
      },
    }),
    menu: (base) => ({
      ...base,
      zIndex: 50,
      width: "350px",
      minWidth: "350px",
    }),
  };
  */

  // =========================================================================
  // COMMENTED OUT ORIGINAL CONFIGURATION HANDLERS
  // Definition: These handlers supported manual configuration table layout, 
  // row management, formula selection and binding, and custom payload building
  // for the manual configurator. They are commented out but kept for code history.
  // =========================================================================
  /*
  const removeRow1 = (tableId, rowId) => {
    setTables1(prevTables => prevTables.map(table => {
      if (table.id === tableId) {
        if (table.rows.length === 1) {
          alert("At least one row is required!");
          return table;
        }
        return { ...table, rows: table.rows.filter(row => row.id !== rowId) };
      }
      return table;
    }));
  };

  const addTable1 = () => {
    setTables1([...tables1, {
      id: Date.now(),
      tableName: "",
      setpoint: null,
      masterRepeatable: "",
      uucRepeatable: "",
      fixedRepeatable: "",
      rows: [createEmptyRow1(1)],
      observationRows: [createEmptyRow2(1, "uuc")]
    }]);
  };

  const removeTable1 = (tableId) => {
    if (tables1.length === 1) return;
    setTables1(tables1.filter(t => t.id !== tableId));
  };

  const removeRow2 = (id) => {
    if (rows2.length === 1) {
      alert("At least one row is required!");
      return;
    }
    setRows2((prevRows) => prevRows.filter((row) => row.id !== id));
  };

  const tableList = [
    { value: "mastermatrix", label: "Master Matrix" },
    { value: "newcrfcalibrationpoint", label: "CRF Calibration Point" },
    { value: "new_summary", label: "Summary" },
    { value: "new_crfmatrix", label: "CRF Matrix" },
    { value: "cmcscope", label: "CMC Scope" },
  ];

  const data = [
    { type: "Operator", symbol: "+", name: "Addition", example: "$a + $b" },
    { type: "Operator", symbol: "-", name: "Subtraction", example: "$a - $b" },
    { type: "Operator", symbol: "*", name: "Multiplication", example: "$a * $b" },
    { type: "Operator", symbol: "/", name: "Division", example: "$a / $b" },
    { type: "Operator", symbol: "%", name: "Modulus", example: "$a % $b" },
    { type: "Function", symbol: "abs($x)", name: "Absolute Value", example: "abs(-5) → 5" },
    { type: "Function", symbol: "pow($x, $y)", name: "Power", example: "pow(2, 3) → 8" },
    { type: "Function", symbol: "sqrt($x)", name: "Square Root", example: "sqrt(16) → 4" },
    { type: "Function", symbol: "min($a, $b, ...)", name: "Minimum Value", example: "min(2, 5, 3) → 2" },
    { type: "Function", symbol: "max($a, $b, ...)", name: "Maximum Value", example: "max(2, 5, 3) → 5" },
    { type: "Example", symbol: "($a + $b) / 2", name: "Average Formula", example: "Average of A and B" },
    { type: "Example", symbol: "sqrt($a * $b)", name: "Geometric Mean", example: "Square root of A×B" },
    { type: "Example", symbol: "abs($a - $b)", name: "Absolute Difference", example: "Difference without sign" }
  ];

  const createEmptyRow1 = (id) => ({
    id,
    checked: true,
    selectedTable: null,
    fieldname: null,
    fieldnameOptions: [],
    fieldfrom: "",
    fieldHeading: "",
    SetVariable: "",
    SetVariable2: "",
    formula: "",
    formula2: "",
    formulaList: [""],
    fieldPosition: "",
    selectedFunction: null,
    selectedTable2: null,
    fieldname2: null,
    fieldnameOptions2: [],
    fieldfrom2: "",
    selectedFunction2: null,
  });

  const createEmptyRow2 = (id, type = "uuc") => ({
    id,
    checked: true,
    fieldname: "",
    setvariable: "",
    formula: "",
    fieldHeading: "",
  });

  const createEmptyRow3 = (id) => ({
    id,
    checked: true,
    setpoint: null,
    masterRepeatable: "",
    uucRepeatable: "",
    labToCalibrate: null,
  });

  const handleCheckbox1 = (tableId, rowId) => {
    setTables1(prev => prev.map(t => t.id === tableId ? {
      ...t, rows: t.rows.map(r => r.id === rowId ? { ...r, checked: !r.checked } : r)
    } : t));
  };

  const buildFormulaList = (count, existingList = []) => {
    const parsed = parseInt(count, 10);
    const target = !isNaN(parsed) && parsed > 0 ? parsed : 1;
    const base = Array.isArray(existingList) ? [...existingList] : [];
    const trimmed = base.slice(0, target);
    while (trimmed.length < target) trimmed.push("");
    return trimmed;
  };

  const handleInputChange1 = (tableId, rowId, field, value) => {
    setTables1(prev => prev.map(t => t.id === tableId ? {
      ...t, rows: t.rows.map(r => {
        if (r.id !== rowId) return r;
        if (field === "formula") {
          return { ...r, formula: value, formulaList: [value] };
        }
        return { ...r, [field]: value };
      })
    } : t));
  };

  const handleFormulaListChange = (tableId, rowId, index, value) => {
    setTables1(prev => prev.map(t => t.id === tableId ? {
      ...t, rows: t.rows.map(r => {
        if (r.id !== rowId) return r;
        const updatedList = [...(r.formulaList || [])];
        updatedList[index] = value;
        return { ...r, formulaList: updatedList, formula: updatedList.join(" | ") };
      })
    } : t));
  };

  const handleSelectChange1 = (tableId, rowId, field, selectedOption) => {
    setTables1(prev => prev.map(t => t.id === tableId ? {
      ...t, rows: t.rows.map(r => r.id === rowId ? { ...r, [field]: selectedOption } : r)
    } : t));
  };

  const handleTableSelection1 = async (tableId, rowId, selectedOption) => {
    if (selectedOption) {
      const options = await fetchFieldnameOptions(selectedOption.value);
      setTables1(prev => prev.map(t => t.id === tableId ? {
        ...t, rows: t.rows.map(r => r.id === rowId ? {
          ...r,
          selectedTable: selectedOption,
          fieldfrom: selectedOption.value,
          fieldname: null,
          fieldnameOptions: options,
        } : r)
      } : t));
    } else {
      setTables1(prev => prev.map(t => t.id === tableId ? {
        ...t, rows: t.rows.map(r => r.id === rowId ? {
          ...r,
          selectedTable: null,
          fieldfrom: "",
          fieldname: null,
          fieldnameOptions: [],
        } : r)
      } : t));
    }
  };

  const handleFunctionSelect = (tableId, rowId, selectedOption) => {
    if (!selectedOption) {
      setTables1(prev => prev.map(t => t.id === tableId ? {
        ...t, rows: t.rows.map(r => r.id === rowId ? { ...r, selectedFunction: null } : r)
      } : t));
      return;
    }
    const funcData = allFunctionsData[selectedOption.value];
    if (funcData) {
      setTables1(prev => prev.map(t => t.id === tableId ? {
        ...t, rows: t.rows.map(r => r.id === rowId ? {
          ...r,
          selectedFunction: selectedOption,
          SetVariable: funcData.variable,
          formula: funcData.formula,
        } : r)
      } : t));
    }
  };

  const handleTableSelection2 = async (tableId, rowId, selectedOption) => {
    if (selectedOption) {
      const options = await fetchFieldnameOptions(selectedOption.value);
      setTables1(prev => prev.map(t => t.id === tableId ? {
        ...t, rows: t.rows.map(r => r.id === rowId ? {
          ...r,
          selectedTable2: selectedOption,
          fieldfrom2: selectedOption.value,
          fieldname2: null,
          fieldnameOptions2: options,
        } : r)
      } : t));
    } else {
      setTables1(prev => prev.map(t => t.id === tableId ? {
        ...t, rows: t.rows.map(r => r.id === rowId ? {
          ...r,
          selectedTable2: null,
          fieldfrom2: "",
          fieldname2: null,
          fieldnameOptions2: [],
        } : r)
      } : t));
    }
  };

  const handleFunctionSelect2 = (tableId, rowId, selectedOption) => {
    if (!selectedOption) {
      setTables1(prev => prev.map(t => t.id === tableId ? {
        ...t, rows: t.rows.map(r => r.id === rowId ? { ...r, selectedFunction2: null } : r)
      } : t));
      return;
    }
    const funcData = allFunctionsData[selectedOption.value];
    if (funcData) {
      setTables1(prev => prev.map(t => t.id === tableId ? {
        ...t, rows: t.rows.map(r => r.id === rowId ? {
          ...r,
          selectedFunction2: selectedOption,
          SetVariable2: funcData.variable,
          formula2: funcData.formula,
        } : r)
      } : t));
    }
  };

  const addRow1 = (tableId) => {
    setTables1(prev => prev.map(table => {
      if (table.id === tableId) {
        const newId = table.rows.length > 0 ? Math.max(...table.rows.map(r => r.id)) + 1 : 1;
        return { ...table, rows: [...table.rows, createEmptyRow1(newId)] };
      }
      return table;
    }));
  };

  const handleCheckbox2 = (id) => {
    setRows2(rows2.map((row) => row.id === id ? { ...row, checked: !row.checked } : row));
  };

  const handleInputChange2 = (id, field, value) => {
    setRows2(rows2.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  };

  const handleTableNameChange1 = (tableId, value) => {
    setTables1(prev => prev.map(t => t.id === tableId ? { ...t, tableName: value } : t));
  };

  const handleTableSetpointChange = (tableId, selectedOption) => {
    setTables1(prev => prev.map(t => {
      if (t.id !== tableId) return t;
      const resetRows = t.rows.map(r => {
        const list = buildFormulaList(
          selectedOption?.value === "fixed" ? (t.fixedRepeatable || 1) : 1,
          r.formulaList || [r.formula || ""],
        );
        return { ...r, formulaList: list, formula: list.join(" | ") };
      });
      
      let newObservationRows = [];
      const setpointValue = selectedOption?.value;
      if (setpointValue === "master" && t.masterRepeatable) {
        const count = parseInt(t.masterRepeatable) || 1;
        newObservationRows = Array.from({ length: count }, (_, index) => ({
          ...createEmptyRow2(index + 1, "master"),
          fieldname: `Master Observation ${index + 1}`,
          setvariable: `master_obs${index + 1}`,
          fieldHeading: `Master Observation ${index + 1}`,
        }));
      } else if (setpointValue === "uuc" && t.uucRepeatable) {
        const count = parseInt(t.uucRepeatable) || 1;
        newObservationRows = Array.from({ length: count }, (_, index) => ({
          ...createEmptyRow2(index + 1, "uuc"),
          fieldname: `UUC Observation ${index + 1}`,
          setvariable: `uuc_obs${index + 1}`,
          fieldHeading: `UUC Observation ${index + 1}`,
        }));
      } else if (setpointValue === "separate") {
        const masterCount = parseInt(t.masterRepeatable) || 0;
        const uucCount = parseInt(t.uucRepeatable) || 0;
        const masterRows = Array.from({ length: masterCount }, (_, index) => ({
          ...createEmptyRow2(index + 1, "master"),
          fieldname: `Master Observation ${index + 1}`,
          setvariable: `master_obs${index + 1}`,
          fieldHeading: `Master Observation ${index + 1}`,
        }));
        const uucRows = Array.from({ length: uucCount }, (_, index) => ({
          ...createEmptyRow2(masterCount + index + 1, "uuc"),
          fieldname: `UUC Observation ${index + 1}`,
          setvariable: `uuc_obs${index + 1}`,
          fieldHeading: `UUC Observation ${index + 1}`,
        }));
        newObservationRows = [...masterRows, ...uucRows];
      } else {
        newObservationRows = [createEmptyRow2(1, setpointValue || "uuc")];
      }
      return {
        ...t,
        setpoint: selectedOption,
        fixedRepeatable: selectedOption?.value === "fixed" ? (t.fixedRepeatable || "") : "",
        rows: resetRows,
        observationRows: newObservationRows.length > 0 ? newObservationRows : t.observationRows,
      };
    }));
  };

  const handleFixedRepeatableChange = (tableId, value) => {
    setTables1(prev => prev.map(t => {
      if (t.id !== tableId) return t;
      const listCount = parseInt(value, 10);
      const adjustedRows = t.rows.map(r => {
        const list = buildFormulaList(listCount, r.formulaList || [r.formula || ""]);
        return { ...r, formulaList: list, formula: list.join(" | ") };
      });
      return { ...t, fixedRepeatable: value, rows: adjustedRows };
    }));
  };

  const handleTableRepeatableChange = (tableId, field, value) => {
    setTables1(prev => prev.map(t => {
      if (t.id !== tableId) return t;
      const updatedTable = { ...t, [field]: value };
      let newObservationRows = [...t.observationRows];
      const setpointValue = t.setpoint?.value;
      if (setpointValue === "master" && field === "masterRepeatable") {
        const count = parseInt(value) || 1;
        newObservationRows = Array.from({ length: count }, (_, index) => ({
          ...createEmptyRow2(index + 1, "master"),
          fieldname: `Master Observation ${index + 1}`,
          setvariable: `master_obs${index + 1}`,
          fieldHeading: `Master Observation ${index + 1}`,
        }));
      } else if (setpointValue === "uuc" && field === "uucRepeatable") {
        const count = parseInt(value) || 1;
        newObservationRows = Array.from({ length: count }, (_, index) => ({
          ...createEmptyRow2(index + 1, "uuc"),
          fieldname: `UUC Observation ${index + 1}`,
          setvariable: `uuc_obs${index + 1}`,
          fieldHeading: `UUC Observation ${index + 1}`,
        }));
      } else if (setpointValue === "separate") {
        const masterCount = parseInt(field === "masterRepeatable" ? value : t.masterRepeatable) || 0;
        const uucCount = parseInt(field === "uucRepeatable" ? value : t.uucRepeatable) || 0;
        const masterRows = Array.from({ length: masterCount }, (_, index) => ({
          ...createEmptyRow2(index + 1, "master"),
          fieldname: `Master Observation ${index + 1}`,
          setvariable: `master_obs${index + 1}`,
          fieldHeading: `Master Observation ${index + 1}`,
        }));
        const uucRows = Array.from({ length: uucCount }, (_, index) => ({
          ...createEmptyRow2(masterCount + index + 1, "uuc"),
          fieldname: `UUC Observation ${index + 1}`,
          setvariable: `uuc_obs${index + 1}`,
          fieldHeading: `UUC Observation ${index + 1}`,
        }));
        newObservationRows = [...masterRows, ...uucRows];
      }
      return { ...updatedTable, observationRows: newObservationRows };
    }));
  };

  const addRow2 = () => {
    const newId = rows2.length > 0 ? Math.max(...rows2.map((r) => r.id)) + 1 : 1;
    setRows2([...rows2, createEmptyRow2(newId, "uuc")]);
  };

  const handleTableObservationCheckbox = (tableId, rowId) => {
    setTables1(prev => prev.map(t => t.id === tableId ? {
      ...t,
      observationRows: (t.observationRows || []).map(r => r.id === rowId ? { ...r, checked: !r.checked } : r)
    } : t));
  };

  const handleTableObservationInputChange = (tableId, rowId, field, value) => {
    setTables1(prev => prev.map(t => t.id === tableId ? {
      ...t,
      observationRows: (t.observationRows || []).map(r => r.id === rowId ? { ...r, [field]: value } : r)
    } : t));
  };

  const addTableObservationRow = (tableId) => {
    setTables1(prev => prev.map(t => {
      if (t.id === tableId) {
        const currentRows = t.observationRows || [];
        const newId = currentRows.length > 0 ? Math.max(...currentRows.map(r => r.id)) + 1 : 1;
        const type = t.setpoint?.value || "uuc";
        return { ...t, observationRows: [...currentRows, createEmptyRow2(newId, type)] };
      }
      return t;
    }));
  };

  const removeTableObservationRow = (tableId, rowId) => {
    setTables1(prev => prev.map(t => {
      if (t.id === tableId) {
        const currentRows = t.observationRows || [];
        if (currentRows.length === 1) {
          alert("At least one observation row is required!");
          return t;
        }
        return { ...t, observationRows: currentRows.filter(r => r.id !== rowId) };
      }
      return t;
    }));
  };

  const fetchFieldnameOptions = async (tableName) => {
    if (!tableName) return [];
    try {
      const authToken = localStorage.getItem("authToken");
      const response = await axios.get(
        "/observationsetting/get-all-summary-type",
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        },
      );
      if (!response.data.success) return [];
      const data = response.data;
      let targetList = [];
      switch (tableName) {
        case "new_summary": targetList = data.new_summary; break;
        case "mastermatrix": targetList = data.mastermatrix; break;
        case "newcrfcalibrationpoint": targetList = data.newcrfcalibrationpoint; break;
        case "new_crfmatrix": targetList = data.new_crfmatrix; break;
        case "cmcscope": targetList = data.cmcscope; break;
        default: targetList = [];
      }
      if (Array.isArray(targetList)) {
        return targetList.map((fieldname) => ({
          value: fieldname,
          label: fieldname,
        }));
      }
      return [];
    } catch (error) {
      console.error("Error fetching fieldname options:", error);
      return [];
    }
  };
  */

  // =========================================================================
  // COMMENTED OUT SETPOINT OPTIONS
  // Definition: Options used in original custom table configuration UI.
  // Commented out since the mock preview table is read-only.
  // =========================================================================
  /*
  const setpointOptions = [
    { value: "uuc", label: "uuc" },
    { value: "master", label: "master" },
    { value: "separate", label: "separate" },
    { value: "fixed", label: "fixed" },
  ];
  */

  if (!formatId) {
    return <div className="p-6 text-red-600">Invalid format ID.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* =========================================================================
        // COMMENTED OUT CALIBRATION RESULTS SETTINGS UI
        // Definition: Contains the "Lab to Calibrate" allotted lab selection dropdown.
        // Commented out per user request to hide the dropdown panel.
        // =========================================================================
        <div className="overflow-hidden rounded-lg bg-white shadow-md">
          <div className="flex items-center justify-start gap-4 p-4">
            <h1 className="flex items-center gap-3 text-2xl font-bold text-gray-800">
              Calibration Results Settings
            </h1>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : (
            <div className="p-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Lab to Calibrate
                  </label>
                  <Select
                    value={rows3[0]?.labToCalibrate}
                    onChange={(selectedOption) =>
                      handleSelectChange3(
                        rows3[0]?.id,
                        "labToCalibrate",
                        selectedOption,
                      )
                    }
                    options={labToCalibrateOptions}
                    placeholder="Select Lab..."
                    isClearable
                    styles={customSelectStyles}
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
        */}

        {/* Dynamic Mock Preview Table */}
        <div className="rounded-lg bg-white p-6 shadow-md border border-gray-200">
          <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Raw Data</h2>
              <p className="text-sm text-gray-500 mt-1">
                Showing a preview of the table layout that will be shown during calibration for this format.
              </p>
            </div>
            {selectedTableData && selectedTableData.id !== 'observationmm' && (
              <div className="flex gap-2">
                {isEditingHeaders && (
                  <Button
                    variant="filled"
                    onClick={handleSaveLayout}
                    disabled={isSavingLayout}
                  >
                    {isSavingLayout ? "Saving..." : "Save Layout"}
                  </Button>
                )}
                <Button
                  variant="outline"
                  className={`flex items-center gap-2 ${isEditingHeaders ? 'border-gray-300 text-gray-700 hover:bg-gray-50' : 'border-blue-200 text-blue-600 hover:bg-blue-50'}`}
                  onClick={() => setIsEditingHeaders(!isEditingHeaders)}
                >
                  {!isEditingHeaders && <PencilIcon className="size-4" />}
                  {isEditingHeaders ? "Cancel Editing" : "Edit Headers"}
                </Button>
              </div>
            )}
          </div>

          <div className="mb-4 bg-blue-50/50 border border-blue-100 text-blue-600 px-4 py-2.5 rounded-md text-sm flex items-center gap-2">
            <span role="img" aria-label="tip">💡</span> Tip: Click &apos;Edit Headers&apos; to rename headings, or drag and drop headers to change column positions.
          </div>

          {!selectedTableData ? (
            <div className="p-8 text-center border border-dashed border-gray-300 rounded-md text-gray-500">
              No format selected, or selected format does not have a preview template.
              <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md text-xs font-mono inline-block border border-red-200">
                <p className="font-semibold mb-1">🔍 DIAGNOSTIC DEBUG INFO:</p>
                <p>Prop formatId: {JSON.stringify(formatId)}</p>
                <p>Prop formatValue: {JSON.stringify(formatValue)}</p>
                <p>resolvedFormatValue: {JSON.stringify(resolvedFormatValue)}</p>
              </div>
            </div>
          ) : (
            lookupKey === 'observationmm' && selectedTableData.unitTypes && selectedTableData.unitTypes.length > 0 ? (
              selectedTableData.unitTypes.map((unitTypeGroup, groupIndex) => {
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
                                className="border border-gray-300 px-3 py-2 text-left font-medium text-gray-700 uppercase tracking-wider"
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
                                  className="border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-600"
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
                                  className="border border-gray-300 px-3 py-2"
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
              <div className="overflow-x-auto mb-6">
                <table className="w-full border border-gray-300 text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      {(customLayout ? getCustomTableStructure().headers : tableStructure.headers).map((header, index) => {
                        const isGroupEditable = isEditingHeaders && customLayout && header.isGroup;
                        const isSingleEditable = isEditingHeaders && customLayout && !header.isGroup;
                        const currentIndex = customLayout ? customLayout.columns.findIndex(c => c.key === header.columnKey) : -1;

                        return (
                          <th
                            key={index}
                            colSpan={header.colspan}
                            className={`border border-gray-300 px-3 py-2 text-left font-medium text-gray-700 uppercase tracking-wider relative ${isSingleEditable && draggedColIndex === currentIndex ? 'opacity-50' : ''}`}
                            draggable={isSingleEditable}
                            onDragStart={isSingleEditable ? (e) => handleDragStart(e, currentIndex) : undefined}
                            onDragOver={isSingleEditable ? handleDragOver : undefined}
                            onDrop={isSingleEditable ? (e) => handleDrop(e, currentIndex) : undefined}
                          >
                            {isGroupEditable ? (
                              <input
                                type="text"
                                className="w-full min-w-[120px] bg-white border border-blue-300 rounded px-2 py-1 text-xs text-gray-700 focus:ring-1 focus:ring-blue-500 font-medium"
                                value={header.name || ''}
                                placeholder="Group Name"
                                onChange={(e) => {
                                  const newName = e.target.value;
                                  const newCols = [...customLayout.columns];
                                  header.columns.forEach(subCol => {
                                    const colIdx = newCols.findIndex(c => c.key === subCol.key);
                                    if (colIdx !== -1) {
                                      newCols[colIdx] = { ...newCols[colIdx], group: newName || null };
                                    }
                                  });
                                  setCustomLayout({ ...customLayout, columns: newCols });
                                }}
                              />
                            ) : isSingleEditable ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  className="w-full min-w-[120px] bg-white border border-blue-300 rounded px-2 py-1 text-xs text-gray-700 focus:ring-1 focus:ring-blue-500 font-medium"
                                  value={header.name || ''}
                                  placeholder="Header Name"
                                  onChange={(e) => {
                                    const newName = e.target.value;
                                    const newCols = [...customLayout.columns];
                                    if (currentIndex !== -1) {
                                      newCols[currentIndex] = { ...newCols[currentIndex], headerName: newName };
                                      setCustomLayout({ ...customLayout, columns: newCols });
                                    }
                                  }}
                                />
                                <div className="cursor-grab text-gray-400" title="Drag column">⠿</div>
                              </div>
                            ) : (
                              header.name
                            )}
                          </th>
                        );
                      })}
                    </tr>

                    {(customLayout ? getCustomTableStructure().subHeadersRow : tableStructure.subHeadersRow).some((item) => item !== null) && (
                      <tr className="bg-gray-50">
                        {(customLayout ? getCustomTableStructure().subHeadersRow : tableStructure.subHeadersRow).map((subHeader, index) => {
                          const isSubHeaderValid = subHeader && typeof subHeader === "object" && subHeader.name !== null;
                          const subHeaderName = isSubHeaderValid ? subHeader.name : (subHeader && typeof subHeader !== "object" ? subHeader : "");

                          const currentIndex = customLayout && subHeader ? customLayout.columns.findIndex(c => c.key === subHeader.columnKey) : -1;
                          const isDraggable = isEditingHeaders && customLayout && isSubHeaderValid;

                          return (
                            <th
                              key={index}
                              className={`border border-gray-300 px-3 py-2 text-left text-xs font-medium text-gray-600 ${isDraggable && draggedColIndex === currentIndex ? 'opacity-50' : ''}`}
                              draggable={isDraggable}
                              onDragStart={isDraggable ? (e) => handleDragStart(e, currentIndex) : undefined}
                              onDragOver={isDraggable ? handleDragOver : undefined}
                              onDrop={isDraggable ? (e) => handleDrop(e, currentIndex) : undefined}
                            >
                              {isEditingHeaders && customLayout && isSubHeaderValid ? (
                                <div className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    className="w-full min-w-[120px] bg-white border border-blue-300 rounded px-2 py-1 text-xs text-gray-700 focus:ring-1 focus:ring-blue-500 font-normal"
                                    value={subHeaderName || ''}
                                    placeholder="Sub-Header Name"
                                    onChange={(e) => {
                                      const newName = e.target.value;
                                      const newCols = [...customLayout.columns];
                                      if (currentIndex !== -1) {
                                        newCols[currentIndex] = { ...newCols[currentIndex], headerName: newName };
                                        setCustomLayout({ ...customLayout, columns: newCols });
                                      }
                                    }}
                                  />
                                  <div className="cursor-grab text-gray-400" title="Drag column">⠿</div>
                                </div>
                              ) : (
                                subHeaderName || ""
                              )}
                            </th>
                          );
                        })}
                      </tr>
                    )}
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedTableData.staticRows.map((row, rowIndex) => (
                      <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        {(customLayout ? customLayout.columns : row).map((item, index) => {
                          const colIndex = customLayout ? item.originalIndex : index;
                          const cell = row[colIndex];
                          const isUnitSelect = cell === "UNIT_SELECT";
                          const isLabel = ["-", "UUC", "Master"].includes(cell);

                          if (isUnitSelect) {
                            return (
                              <td
                                key={colIndex}
                                className="border border-gray-300 px-3 py-2"
                              >
                                <Select
                                  value={null}
                                  isDisabled
                                  placeholder="Select unit..."
                                  styles={{
                                    control: (base) => ({
                                      ...base,
                                      minHeight: "32px",
                                      fontSize: "0.875rem",
                                      backgroundColor: "#f3f4f6",
                                      cursor: "not-allowed",
                                    }),
                                  }}
                                />
                              </td>
                            );
                          }

                          if (isLabel) {
                            return (
                              <td
                                key={colIndex}
                                className="border border-gray-300 px-3 py-2 text-center font-medium"
                              >
                                {cell}
                              </td>
                            );
                          }

                          return (
                            <td
                              key={colIndex}
                              className="border border-gray-300 px-3 py-2"
                            >
                              {cell || ''}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>

        {/* ==========================================
        // COMMENTED OUT ORIGINAL CONFIGURATION UI
        // Definition: These JSX blocks rendered the formula reference tables, modal,
        // and manual table/row configuration editor.
        // We comment them out but preserve them for code integrity.
        // ========================================== */}
        {/*
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="relative max-h-[85vh] w-[900px] overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
              <button style={{ cursor: "pointer" }} onClick={() => setIsModalOpen(false)} className="absolute top-3 right-3 text-gray-500 hover:text-gray-700">
                <XMarkIcon className="h-5 w-5" />
              </button>
              <h2 className="mb-4 border-b pb-3 text-center text-xl font-bold text-gray-800">🧮 Formula Reference Table</h2>
              <table className="w-full border-collapse border border-gray-300 text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border px-3 py-2 text-left">Type</th>
                    <th className="border px-3 py-2 text-left">Symbol / Function</th>
                    <th className="border px-3 py-2 text-left">Description</th>
                    <th className="border px-3 py-2 text-left">Example</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="border px-3 py-2">{item.type}</td>
                      <td className="border px-3 py-2 font-mono text-blue-700">{item.symbol}</td>
                      <td className="border px-3 py-2">{item.name}</td>
                      <td className="border px-3 py-2 text-gray-600">{item.example}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="space-y-6">
          <div className="px-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800">Calibration Settings</h2>
            <button onClick={addTable1} className="flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-blue-700">
              <PlusCircleIcon className="h-5 w-5" /> Add Table
            </button>
          </div>
          {tables1.map((table, tableIdx) => (
            <div key={table.id} className="overflow-hidden rounded-lg bg-white shadow-md border border-gray-200">
              ...
            </div>
          ))}
        </div>
        */}


      </div>
    </div>
  );
}
