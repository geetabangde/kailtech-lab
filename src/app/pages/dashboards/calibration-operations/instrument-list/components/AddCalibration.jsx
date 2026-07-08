import { useState, useEffect /*, useCallback - unused in mock preview flow */ } from "react";
import axios from "utils/axios";
import Select from "react-select";
// Commented out unused icons to fix ESLint errors. They were only used in the original custom table configuration UI.
// import { TrashIcon, PlusCircleIcon } from "@heroicons/react/24/outline";
// import { EyeIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner"; // sonner is used for consistent style across Edit page
import { Button } from "components/ui/button";


export default function AddCalibration({
  instid,
  instrumentId,
  formatId,
  formatValue, // Added dynamically: selected format's template string (e.g. observationctg)
  onNext,
  onBack,
}) {
  // =========================================================================
  // ACTIVE STATE VARIABLES
  // Definition: State variables required by the new format-specific mock preview 
  // table flow and lab allotment.
  // =========================================================================
  const [loading, setLoading] = useState(false);
  // const [labToCalibrateOptions, setLabToCalibrateOptions] = useState([]); // Commented out because the "Lab to Calibrate" dropdown UI is commented out.
  const [resolvedFormatValue, setResolvedFormatValue] = useState(formatValue || "");
  const lookupKey = resolvedFormatValue
    ? (resolvedFormatValue === "exten"
      ? "observationexm"
      : resolvedFormatValue.startsWith("observation")
        ? resolvedFormatValue
        : "observation" + resolvedFormatValue)
    : "";
  // eslint-disable-next-line no-unused-vars
  const [rows3, setRows3] = useState([{
    id: 1,
    checked: true,
    setpoint: null,
    masterRepeatable: "",
    uucRepeatable: "",
    labToCalibrate: null,
  }]);

  const [customLayout, setCustomLayout] = useState(null);
  const [backendColumns, setBackendColumns] = useState(null);
  const [editingHeaderKey, setEditingHeaderKey] = useState(null);
  const [editingHeaderText, setEditingHeaderText] = useState("");
  const [isEditingHeaders, setIsEditingHeaders] = useState(false);
  const [hasUnsavedHeaders, setHasUnsavedHeaders] = useState(false);
  const [observationCount, setObservationCount] = useState(5);
  const [loadedRepeatCount, setLoadedRepeatCount] = useState(null);

  // Dynamic column states
  const [isAddColumnModalOpen, setIsAddColumnModalOpen] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");
  const [newColumnType, setNewColumnType] = useState("");
  const [summaryTypeOptions, setSummaryTypeOptions] = useState([]);
  const [activeMenuColId, setActiveMenuColId] = useState(null);
  const [columnToDelete, setColumnToDelete] = useState(null);
  const [editingColumnForModal, setEditingColumnForModal] = useState(null);

  // Data Validation Table State
  const [isValidationModalOpen, setIsValidationModalOpen] = useState(false);
  const [validationRows, setValidationRows] = useState(1);
  const [validationCols, setValidationCols] = useState(1);
  const [validationHeadings, setValidationHeadings] = useState(["Column 1"]);

  // Array of extra dynamic tables (e.g. table1, table2)
  const [extraTables, setExtraTables] = useState([]);
  const [savedRowLayout, setSavedRowLayout] = useState(null);

  // Validation Table Interactivity State
  const [editingHeadersTableId, setEditingHeadersTableId] = useState(null);
  const [unsavedValidationHeadersTableId, setUnsavedValidationHeadersTableId] = useState(null);
  const [editingValidationHeaderKey, setEditingValidationHeaderKey] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeValidationMenuColId, setActiveValidationMenuColId] = useState(null);
  const [deleteValidationColumnKey, setDeleteValidationColumnKey] = useState(null);
  const [addingColumnTableId, setAddingColumnTableId] = useState(null);
  const [newValidationColumnName, setNewValidationColumnName] = useState("");
  const [newValidationColumnType, setNewValidationColumnType] = useState("");
  const [editingValidationColumnForModal, setEditingValidationColumnForModal] = useState(null);
  const [isAddValidationColumnModalOpen, setIsAddValidationColumnModalOpen] = useState(false);

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

  // Fetch summary type options for dynamic columns
  useEffect(() => {
    const fetchSummaryTypes = async () => {
      try {
        const authToken = localStorage.getItem("authToken");
        const response = await axios.get(
          "/observationsetting/get-all-summary-type",
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
              "Content-Type": "application/json",
            },
          }
        );
        if (response.data && response.data.success) {
          const data = response.data;
          const allOptions = new Set();
          Object.keys(data).forEach((key) => {
            if (Array.isArray(data[key])) {
              data[key].forEach((val) => {
                if (typeof val === "string") {
                  allOptions.add(val);
                }
              });
            }
          });
          setSummaryTypeOptions(
            Array.from(allOptions).map((val) => ({ label: val, value: val }))
          );
        }
      } catch (error) {
        console.error("Error fetching summary types:", error);
      }
    };
    fetchSummaryTypes();
  }, []);

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
      setLoading(true);
      if (instrumentId) {
        try {
          const authToken = localStorage.getItem("authToken");
          if (instrumentId || instid) {
            const layoutResponse = await axios.get(
              `/observationlayout/get-formate-layout/${instrumentId || instid}`,
              {
                headers: {
                  Authorization: `Bearer ${authToken}`,
                  "Content-Type": "application/json",
                },
              }
            );
            const resData = layoutResponse.data;
            if (resData && (resData.success || resData.status === "true" || resData.status === true)) {
              const dataVal = resData.data;
              if (dataVal && dataVal.observation_repeat !== undefined && dataVal.observation_repeat !== null) {
                const repeatVal = parseInt(dataVal.observation_repeat);
                setObservationCount(repeatVal);
                setLoadedRepeatCount(repeatVal);
              }
              if (Array.isArray(dataVal)) {
                setBackendColumns(dataVal);
              } else if (dataVal && Array.isArray(dataVal.columns)) {
                let columnsArray = dataVal.columns;
                let extractedTables = {};

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
                        // Extract dynamically table1, table2, etc.
                        let tIdx = 1;
                        while (currentParsed[`table${tIdx}`] && Array.isArray(currentParsed[`table${tIdx}`])) {
                          extractedTables[`table${tIdx}`] = currentParsed[`table${tIdx}`];
                          tIdx++;
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
                  let tIdx = 1;
                  while (dataVal[`table${tIdx}`] && Array.isArray(dataVal[`table${tIdx}`])) {
                    extractedTables[`table${tIdx}`] = dataVal[`table${tIdx}`];
                    tIdx++;
                  }
                }

                const initialExtraTables = [];
                Object.keys(extractedTables).forEach(tableKey => {
                  const tData = extractedTables[tableKey];
                  if (tData.length > 0) {
                    initialExtraTables.push({
                      id: tableKey,
                      name: `Data Validation Settings (${tableKey})`,
                      rows: 1,
                      cols: tData.length,
                      columns: tData.map(c => ({
                        key: c.column_key,
                        headerName: c.display_name,
                        fetched_value: c.fetched_value || "old"
                      }))
                    });
                  }
                });
                if (initialExtraTables.length > 0) {
                  setExtraTables(initialExtraTables);
                }
                setBackendColumns(columnsArray);
              }
            }
          }
        } catch (error) {
          console.warn("Failed to fetch layout from new endpoint in init, falling back...", error);
        }

        setLoading(false);
      } else {
        setLoading(false);
      }
    };

    init();
  }, [instrumentId, formatId, instid, refreshKey]);

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

  // =========================================================================
  // ACTIVE SAVE HANDLER
  // Saves the "Lab to Calibrate" option. Replaces manual custom table config saving.
  // =========================================================================
  const createLayoutPayload = (baseCols, extraTablesOverride = null) => {
    const mappedCols = baseCols.map((col, index) => ({
      column_key: col.key || col.column_key,
      display_name: col.headerName || col.display_name,
      sort_order: index,
      group_name: col.group || col.group_name || null,
      fetched_value: col.fetched_value || "old",
    }));

    let rowLayoutToSave = savedRowLayout;
    if (!rowLayoutToSave) {
      if (['observationtswoi', 'observationgtm', 'observationrtdwi'].includes(lookupKey)) {
        rowLayoutToSave = [
          { type: 'uuc', label: 'UUC' },
          { type: 'master', label: 'Master' }
        ];
      } else if (['observationdg'].includes(lookupKey)) {
        rowLayoutToSave = [
          { type: 'forward', label: 'Forward' },
          { type: 'backward', label: 'Backward' }
        ];
      }
    }

    const payload = {
      formatId: parseInt(formatId),
      instid: instrumentId || instid,
      observation_repeat: observationCount,
      columns: mappedCols,
    };

    if (rowLayoutToSave) {
      payload.row_layout = rowLayoutToSave;
    }

    const tablesToUse = extraTablesOverride || extraTables;
    tablesToUse.forEach(t => {
      payload[t.id] = t.columns.map((col, index) => ({
        column_key: col.key || col.column_key,
        display_name: col.headerName || col.display_name,
        sort_order: index,
        group_name: null,
        fetched_value: col.fetched_value || "old",
      }));
    });

    return payload;
  };

  const handleSave = async () => {
    if (!formatId) {
      toast.error("Format ID is missing!");
      return;
    }

    setLoading(true);
    try {
      const authToken = localStorage.getItem("authToken");
      const currentCols = customLayout?.columns || [];

      const response = await axios.post(
        "/observationlayout/save-formate-layout",
        createLayoutPayload(currentCols),
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success || response.data.status === "true" || response.data.status === true) {
        toast.success("Format layout saved successfully!");
        onNext();
      } else {
        toast.error("Failed to save format layout. Please try again.");
      }
    } catch (error) {
      console.error("Error saving format layout:", error);
      toast.error(
        `Error: ${error.response?.data?.message || error.message || "Failed to save format layout"}`
      );
    } finally {
      setLoading(false);
    }
  };

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

  // Mock observation generator for exactly 3 rows
  const getMockData = (template, count = 5) => {
    if (template === 'observationmm') {
      return [
        {
          unit_type: "",
          calibration_points: [
            { sequence_number: 1, mode: "", range: "", nominal_values: { master: { value: "", unit: "" } }, observations: [] },
            { sequence_number: 2, mode: "", range: "", nominal_values: { master: { value: "", unit: "" } }, observations: [] },
            { sequence_number: 3, mode: "", range: "", nominal_values: { master: { value: "", unit: "" } }, observations: [] }
          ]
        }
      ];
    }

    return [1, 2, 3].map((num) => ({
      id: num,
      sr_no: num,
      sequence_number: num,
      test_point: "",
      nominal_value: "",
      nominal_value_master: "",
      uuc_value: "",
      uuc: "",
      set_point: "",
      set_point_uuc: "",
      range: "",
      unit: "",
      sensitivity_coefficient: "",
      uuc_values: Array(count).fill(""),
      master_values: Array(count).fill(""),
      observations: Array(count).fill(""),
      master_readings: { m1: "", m2: "", m3: "", m4: "", m5: "", m6: "" },
      calculated_uuc: "",
      mean: "",
      average: "",
      error: "",
      hysterisis: "",
      repeatability: "",
      precision: { uuc_least_count: "", master_least_count: "" }
    }));
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
      return { rows: allRows };
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
          singleHeaders: [{ name: 'SR NO', key: 'sr_no' }, { name: 'SET PRESSURE ON UUC (CALCULATIONUNIT)', key: 'uuc' }, { name: '[SET PRESSURE ON UUC (MASTERUNIT)]', key: 'calculatedmaster' }],
          subHeaders: {
            'OBSERVATION ON UUC': getObservationSubheaders('observationdpg', count).map((name, i) => ({ name, key: `master_${i}` })),
          },
          remainingHeaders: [{ name: 'MEAN (UUCUNIT)', key: 'averagemaster' }, { name: 'ERROR (UUCUNIT)', key: 'error' }, { name: 'REPEATABILITY (UUCUNIT)', key: 'repeatability' }, { name: 'HYSTERISIS (UUCUNIT)', key: 'hysterisis' }],
        },
        staticRows: createObservationRows(mockObs, 'observationdpg', count).rows,
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
        staticRows: createObservationRows(mockObs, 'observationgtm', count).rows,
      },
      {
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
        staticRows: createObservationRows(mockObs, 'observationdg', count).rows,
      },
      {
        id: 'observationmsr',
        name: 'Observation MSR',
        category: 'Measuring',
        structure: {
          thermalCoeff: true,
          singleHeaders: [{ name: 'Sr. No.', key: 'sr_no' }, { name: 'Nominal/ Set Value', key: 'master' }],
          subHeaders: {
            'Observation on UUC': getObservationSubheaders('observationmsr', count).map((name, i) => ({ name, key: `uuc${i}` })).map((name, i) => ({ name, key: `uuc${i}` }))
          },
          remainingHeaders: [{ name: 'Average', key: 'averageuuc' }, { name: 'Error', key: 'error' }]
        },
        staticRows: createObservationRows(mockObs, 'observationmsr', count).rows,
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
        staticRows: createObservationRows(mockObs, 'observationrtdwi', count).rows,
      },
      {
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
        staticRows: createObservationRows(mockObs, 'observationppg', count).rows,
      },
      {
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
        staticRows: createObservationRows(mockObs, 'observationavg', count).rows,
      },
      {
        id: 'observationhg',
        name: 'Observation HG',
        category: 'Height Gauge',
        structure: {
          thermalCoeff: true,
          singleHeaders: [{ name: 'Sr. No.', key: 'sr_no' }, { name: 'Nominal/ Set Value', key: 'master' }],
          subHeaders: {
            'Observation on UUC': getObservationSubheaders('observationhg', count).map((name, i) => ({ name, key: `uuc${i}` })).map((name, i) => ({ name, key: `uuc${i}` }))
          },
          remainingHeaders: [{ name: 'Average', key: 'averageuuc' }, { name: 'Error', key: 'error' }]
        },
        staticRows: createObservationRows(mockObs, 'observationhg', count).rows,
      },
      {
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
        staticRows: createObservationRows(mockObs, 'observationfg', count).rows,
      },
      {
        id: 'observationmm',
        name: 'Observation MM',
        category: 'Multimeter',
        structure: {
          singleHeaders: [{ name: 'Sr. No.', key: 'sr_no' }, { name: 'Mode', key: 'mode' }, { name: 'Range', key: 'range' }, { name: 'Nominal/ Set Value on master (Calculated)', key: 'calculatedmaster' }, { name: 'Nominal/ Set Value on master', key: 'master' }],
          subHeaders: {
            'Observation on UUC': getObservationSubheaders('observationmm', count).map((name, i) => ({ name, key: `uuc${i}` })).map((name, i) => ({ name, key: `uuc${i}` }))
          },
          remainingHeaders: [{ name: 'Average', key: 'averageuuc' }, { name: 'Error', key: 'error' }]
        },
        staticRows: createObservationRows(mockObs, 'observationmm', count).rows,
      },
      {
        id: 'observationexm',
        name: 'Observation EXM',
        category: 'External Micrometer',
        structure: {
          thermalCoeff: true,
          singleHeaders: [{ name: 'Sr. No.', key: 'sr_no' }, { name: 'Nominal/ Set Value', key: 'master' }],
          subHeaders: {
            'Observation on UUC': getObservationSubheaders('observationexm', count).map((name, i) => ({ name, key: `uuc${i}` })).map((name, i) => ({ name, key: `uuc${i}` }))
          },
          remainingHeaders: [{ name: 'Average', key: 'averageuuc' }, { name: 'Error', key: 'error' }]
        },
        staticRows: createObservationRows(mockObs, 'observationexm', count).rows,
      },
      {
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
        staticRows: createObservationRows(mockObs, 'observationmg', count).rows,
      },
      {
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
        staticRows: createObservationRows(mockObs, 'observationodfm', count).rows,
      },
      {
        id: 'observationapg',
        name: 'Observation APG',
        category: 'Pressure',
        structure: {
          singleHeaders: [{ name: 'Sr no', key: 'sr_no' }, { name: 'Set Pressure on UUC (kg/cm²)', key: 'uuc' }, { name: 'Set Pressure on UUC (bar)', key: 'master' }],
          subHeaders: {
            'Observations on Master (bar)': getObservationSubheaders('observationapg', count).map((name, i) => ({ name, key: `uuc${i}` })),
          },
          remainingHeaders: [{ name: 'Mean (bar)', key: 'averageuuc' }, { name: 'Error (bar)', key: 'error' }, { name: 'Hysterisis (bar)', key: 'hysterisis' }],
        },
        staticRows: createObservationRows(mockObs, 'observationapg', count).rows,
      },
      {
        id: 'observationit',
        name: 'Observation IT',
        category: 'Internal Thread',
        structure: {
          thermalCoeff: true,
          singleHeaders: [{ name: 'Sr. No.', key: 'sr_no' }, { name: 'Nominal/ Set Value', key: 'master' }],
          subHeaders: {
            'Observation on UUC': getObservationSubheaders('observationit', count).map((name, i) => ({ name, key: `uuc${i}` })).map((name, i) => ({ name, key: `uuc${i}` }))
          },
          remainingHeaders: [{ name: 'Average', key: 'averageuuc' }, { name: 'Error', key: 'error' }]
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
          singleHeaders: [{ name: 'Sr. No.', key: 'sr_no' }, { name: 'Nominal/ Set Value', key: 'master' }],
          subHeaders: {
            'Observation on UUC': getObservationSubheaders('observationmt', count).map((name, i) => ({ name, key: `uuc${i}` })).map((name, i) => ({ name, key: `uuc${i}` }))
          },
          remainingHeaders: [{ name: 'Average', key: 'averageuuc' }, { name: 'Error', key: 'error' }]
        },
        staticRows: createObservationRows(mockObs, 'observationmt', count).rows,
      },
      {
        id: 'observationctg',
        name: 'Observation CTG',
        category: 'Temperature',
        structure: {
          thermalCoeff: true,
          singleHeaders: [{ name: 'Sr. No.', key: 'sr_no' }, { name: 'Nominal Value', key: 'master' }],
          subHeaders: {
            'Observation on UUC': getObservationSubheaders('observationctg', count).map((name, i) => ({ name, key: `uuc${i}` })),
          },
          remainingHeaders: [{ name: 'Average', key: 'averageuuc' }, { name: 'Error', key: 'error' }],
        },
        staticRows: createObservationRows(mockObs, 'observationctg', count).rows,
      },
      {
        id: 'observationtswoi',
        name: 'Observation TSWOI',
        category: 'Temperature',
        structure: {
          singleHeaders: [
            { name: 'Sr. No.', key: 'sr_no' },
            { name: 'Set Point (Unit)', key: 'setpoint' },
            { name: 'Value Of', key: 'value_of' },
            { name: 'Unit', key: 'uucunit' },
            { name: 'Sensitivity Coefficient', key: 'sensitivitycoefficient' }
          ],
          subHeaders: {
            'Observation': getObservationSubheaders('observationtswoi', count).map((name, i) => ({ name, key: `uuc${i}` }))
          },
          remainingHeaders: [
            { name: 'Average', key: 'averageuuc' },
            { name: 'mV generated On ambient', key: 'ambientuuc' },
            { name: 'Average with corrected mv', key: 'saverageuuc' },
            { name: 'Average (Unit)', key: 'caverageuuc' },
            { name: 'Deviation (Unit)', key: 'error' }
          ]
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

  const handleDragStart = (e, key) => {
    e.dataTransfer.setData("text/plain", key);
    e.dataTransfer.effectAllowed = "move";
    e.currentTarget.classList.add("opacity-50", "shadow-lg", "scale-105", "bg-blue-50", "z-50");
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e, targetKey) => {
    e.preventDefault();
    const draggedKey = e.dataTransfer.getData("text/plain");
    if (!draggedKey || draggedKey === targetKey) return;

    setCustomLayout((prev) => {
      if (!prev || !prev.columns) return prev;
      const columns = [...prev.columns];
      const sourceIdx = columns.findIndex((c) => c.key === draggedKey);
      const targetIdx = columns.findIndex((c) => c.key === targetKey);
      if (sourceIdx === -1 || targetIdx === -1) return prev;

      const [moved] = columns.splice(sourceIdx, 1);
      columns.splice(targetIdx, 0, moved);
      return {
        ...prev,
        columns,
      };
    });
    setHasUnsavedHeaders(true);
  };

  const startEditing = (key, text) => {
    setEditingHeaderKey(key);
    setEditingHeaderText(text);
  };

  const saveHeaderEdit = () => {
    if (!editingHeaderKey) return;
    const text = editingHeaderText.trim();
    if (!text) {
      setEditingHeaderKey(null);
      return;
    }

    setCustomLayout((prev) => {
      if (!prev || !prev.columns) return prev;
      const columns = prev.columns.map((col) => {
        if (editingHeaderKey.startsWith("group_")) {
          const oldGroup = editingHeaderKey.replace("group_", "");
          if (col.group === oldGroup) {
            return { ...col, group: text };
          }
        } else {
          if (col.key === editingHeaderKey) {
            return { ...col, headerName: text };
          }
        }
        return col;
      });
      return {
        ...prev,
        columns,
      };
    });

    setEditingHeaderKey(null);
  };

  const handleGroupRename = (firstColKey, newGroupName) => {
    setCustomLayout((prev) => {
      if (!prev || !prev.columns) return prev;
      const columns = [...prev.columns];
      const targetCol = columns.find((c) => c.key === firstColKey);
      if (!targetCol) return prev;
      const oldGroupName = targetCol.group;

      const updated = columns.map((col) => {
        if (col.group === oldGroupName) {
          return { ...col, group: newGroupName };
        }
        return col;
      });
      return { ...prev, columns: updated };
    });
    setHasUnsavedHeaders(true);
  };

  const handleColumnRename = (colKey, newHeaderName) => {
    setCustomLayout((prev) => {
      if (!prev || !prev.columns) return prev;
      const columns = prev.columns.map((col) => {
        if (col.key === colKey) {
          return { ...col, headerName: newHeaderName };
        }
        return col;
      });
      return { ...prev, columns };
    });
    setHasUnsavedHeaders(true);
  };

  // ========================= VALIDATION TABLE HANDLERS ========================= //
  const handleValidationDragStart = (e, tableId, key) => {
    e.dataTransfer.setData("text/plain", JSON.stringify({ tableId, key }));
    e.currentTarget.classList.add("opacity-50", "shadow-lg", "scale-105", "bg-blue-50", "z-50");
  };

  const handleValidationDrop = (e, targetTableId, targetKey) => {
    e.preventDefault();
    e.currentTarget.classList.remove("opacity-50");
    const dataStr = e.dataTransfer.getData("text/plain");
    if (!dataStr) return;
    try {
      const { tableId: sourceTableId, key: sourceKey } = JSON.parse(dataStr);
      if (sourceTableId !== targetTableId) return;
      if (sourceKey === targetKey) return;

      setExtraTables(prev => prev.map(t => {
        if (t.id === targetTableId) {
          const newColumns = [...t.columns];
          const sourceIdx = newColumns.findIndex((c) => c.key === sourceKey);
          const targetIdx = newColumns.findIndex((c) => c.key === targetKey);
          if (sourceIdx !== -1 && targetIdx !== -1) {
            const [movedCol] = newColumns.splice(sourceIdx, 1);
            newColumns.splice(targetIdx, 0, movedCol);
            return { ...t, columns: newColumns };
          }
        }
        return t;
      }));
    } catch {
      // Ignore if not valid JSON
    }
  };

  const handleValidationColumnRename = (tableId, key, newName) => {
    setExtraTables(prev => prev.map(t => {
      if (t.id === tableId) {
        const updatedCols = t.columns.map((col) =>
          col.key === key ? { ...col, headerName: newName } : col
        );
        return { ...t, columns: updatedCols };
      }
      return t;
    }));
    setUnsavedValidationHeadersTableId(tableId);
  };

  const saveValidationHeaderEdit = () => {
    setEditingValidationHeaderKey(null);
  };

  const handleAddValidationColumn = async () => {
    if (!newValidationColumnName.trim()) {
      toast.error("Please enter a column name.");
      return;
    }
    if (!newValidationColumnType) {
      toast.error("Please select a column type.");
      return;
    }

    if (!addingColumnTableId) return;

    let hasError = false;
    const updatedExtraTables = extraTables.map(t => {
      if (t.id === addingColumnTableId) {
        const newColumns = [...t.columns];
        if (editingValidationColumnForModal) {
          const exists = newColumns.some(c => c.key === newValidationColumnType && c.key !== editingValidationColumnForModal.key);
          if (exists) {
            hasError = true;
            toast.error("A column of this type already exists.");
            return t;
          }
          const idx = newColumns.findIndex(c => c.key === editingValidationColumnForModal.key);
          if (idx !== -1) {
            newColumns[idx] = {
              ...newColumns[idx],
              key: newValidationColumnType,
              headerName: newValidationColumnName.trim()
            };
          }
          return { ...t, columns: newColumns };
        } else {
          const exists = newColumns.some(c => c.key === newValidationColumnType);
          if (exists) {
            hasError = true;
            toast.error("A column of this type already exists.");
            return t;
          }
          const newColObj = {
            key: newValidationColumnType,
            headerName: newValidationColumnName.trim(),
            fetched_value: "new",
          };
          return { ...t, cols: t.cols + 1, columns: [...newColumns, newColObj] };
        }
      }
      return t;
    });

    if (hasError) return;

    setExtraTables(updatedExtraTables);

    try {
      const authToken = localStorage.getItem("authToken");
      const currentCols = customLayout?.columns || [];
      await axios.post(
        "/observationlayout/save-formate-layout",
        createLayoutPayload(currentCols, updatedExtraTables),
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      toast.success("Validation column saved successfully!");
    } catch (err) {
      console.error("Error saving validation column:", err);
      toast.error("Failed to save validation column.");
    }

    setIsAddValidationColumnModalOpen(false);
    setNewValidationColumnName("");
    setNewValidationColumnType("");
    setEditingValidationColumnForModal(null);
    setAddingColumnTableId(null);
  };

  const handleDeleteValidationColumn = async (tableId, key) => {
    const updatedExtraTables = extraTables.map(t => {
      if (t.id === tableId) {
        const newColumns = t.columns.filter(c => c.key !== key);
        return { ...t, cols: t.cols - 1, columns: newColumns };
      }
      return t;
    });

    setExtraTables(updatedExtraTables);

    try {
      const authToken = localStorage.getItem("authToken");
      const currentCols = customLayout?.columns || [];
      await axios.post(
        "/observationlayout/save-formate-layout",
        createLayoutPayload(currentCols, updatedExtraTables),
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      toast.success("Validation column deleted.");
    } catch (err) {
      console.error("Error deleting validation column:", err);
      toast.error("Failed to delete validation column.");
    }
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
          isDefault: true,
          fetched_value: bCol.fetched_value || "old"
        });
      } else if (bCol.column_key && !bCol.column_key.startsWith('col_')) {
        reconstructed.push({
          key: bCol.column_key,
          originalIndex: Math.max(...defaultLayout.columns.map(c => c.originalIndex)) + reconstructed.length + 1,
          defaultName: bCol.display_name,
          headerName: bCol.display_name,
          group: bCol.group_name || null,
          isDefault: false,
          fetched_value: "new"
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

  const handleObservationCountChange = (newCount) => {
    setObservationCount(newCount);
    setCustomLayout(getDefaultLayout(lookupKey, newCount));
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

  // ========================= VALIDATION TABLE RENDERER ========================= //
  const renderExtraTables = () => {
    if (!extraTables || extraTables.length === 0) return null;

    return (
      <div className="space-y-8 mt-8">
        {extraTables.map((table) => {
          const { id: tableId, rows, columns } = table;
          const isEditingHeadersForThisTable = editingHeadersTableId === tableId;
          const hasUnsavedHeadersForThisTable = unsavedValidationHeadersTableId === tableId;

          return (
            <div key={tableId} className="rounded-lg bg-white p-6 shadow-md border border-gray-200">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{table.name || "Data Validation Settings"}</h3>
                  <p className="text-sm text-gray-500 mt-1">Configure columns and rows for this data validation table.</p>
                </div>
                {(isEditingHeadersForThisTable || hasUnsavedHeadersForThisTable) ? (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const authToken = localStorage.getItem("authToken");
                          const currentCols = customLayout?.columns || [];
                          await axios.post(
                            "/observationlayout/save-formate-layout",
                            createLayoutPayload(currentCols),
                            {
                              headers: {
                                Authorization: `Bearer ${authToken}`,
                                "Content-Type": "application/json",
                              },
                            }
                          );
                          toast.success("Validation headers saved successfully!");
                          setEditingHeadersTableId(null);
                          setUnsavedValidationHeadersTableId(null);
                        } catch (err) {
                          console.error("Error saving validation headers:", err);
                          toast.error("Failed to save validation headers.");
                        }
                      }}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md shadow-sm border transition-all whitespace-nowrap bg-green-600 border-green-600 text-white hover:bg-green-700"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Save Headers
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingHeadersTableId(null);
                        setUnsavedValidationHeadersTableId(null);
                        setRefreshKey(prev => prev + 1);
                      }}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md shadow-sm border transition-all whitespace-nowrap bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={async () => {
                        if (window.confirm("Are you sure you want to delete this Data Validation Table?")) {
                          const updatedExtraTables = extraTables.filter(t => t.id !== tableId);
                          setExtraTables(updatedExtraTables);

                          try {
                            const authToken = localStorage.getItem("authToken");
                            const currentCols = customLayout?.columns || [];
                            await axios.post(
                              "/observationlayout/save-formate-layout",
                              createLayoutPayload(currentCols, updatedExtraTables),
                              {
                                headers: {
                                  Authorization: `Bearer ${authToken}`,
                                  "Content-Type": "application/json",
                                },
                              }
                            );
                            toast.success("Table deleted successfully!");
                          } catch (err) {
                            console.error("Error deleting table:", err);
                            toast.error("Failed to sync table deletion.");
                          }
                        }
                      }}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md shadow-sm border transition-all whitespace-nowrap bg-red-50 border-red-200 text-red-600 hover:bg-red-100"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                      Delete Table
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAddingColumnTableId(tableId);
                        setEditingValidationColumnForModal(null);
                        setNewValidationColumnName("");
                        setNewValidationColumnType("");
                        setIsAddValidationColumnModalOpen(true);
                      }}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md shadow-sm border transition-all whitespace-nowrap bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                      Add Column
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingHeadersTableId(tableId)}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md shadow-sm border transition-all whitespace-nowrap bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                      </svg>
                      Edit Headers
                    </button>
                  </div>
                )}
              </div>

              {(isEditingHeadersForThisTable || hasUnsavedHeadersForThisTable) && (
                <p className="text-xs text-red-600 font-medium mb-4 bg-red-50 p-2 rounded border border-red-100">
                  💡 Tip: Type directly into any header field to rename it in real-time. Drag and drop the ⠿ handle to reorder columns.
                </p>
              )}

              <div className={`overflow-x-auto border border-red-200 rounded-md transition-all duration-300 ${activeValidationMenuColId ? "pb-32" : ""}`}>
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-red-50 border-b border-red-200">
                      {columns.map((col, index) => {
                        const isDraggable = true;
                        const isEditing = editingValidationHeaderKey === col.key;

                        return (
                          <th
                            key={col.key}
                            draggable={isDraggable}
                            onDragStart={(e) => isDraggable && handleValidationDragStart(e, tableId, col.key)}
                            onDragOver={(e) => isDraggable && e.preventDefault()}
                            onDrop={(e) => {
                              if (isDraggable) {
                                handleValidationDrop(e, tableId, col.key);
                                setUnsavedValidationHeadersTableId(tableId);
                              }
                            }}
                            onDragEnd={(e) => e.currentTarget.classList.remove("opacity-50", "shadow-lg", "scale-105", "bg-red-50", "z-50")}
                            onDoubleClick={() => !(isEditingHeadersForThisTable || hasUnsavedHeadersForThisTable) && setEditingValidationHeaderKey(col.key)}
                            className={`relative px-4 py-3 text-red-700 font-semibold text-center whitespace-nowrap border border-red-200 transition-all duration-200 ${isDraggable ? "cursor-grab hover:bg-red-50" : ""} group`}
                          >
                            {!(isEditingHeadersForThisTable || hasUnsavedHeadersForThisTable) && !isEditing && (
                              <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveValidationMenuColId(activeValidationMenuColId === col.key ? null : col.key);
                                  }}
                                  className="p-1 bg-white border border-red-200 rounded shadow-sm text-gray-500 hover:text-red-600 hover:bg-red-50"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" /></svg>
                                </button>

                                {activeValidationMenuColId === col.key && (
                                  <div
                                    className={`absolute top-full mt-1 w-32 bg-white rounded shadow-lg border border-red-200 py-1 z-20 flex flex-col whitespace-normal ${index === 0 ? 'left-0' : 'right-0'}`}
                                    onMouseLeave={() => setActiveValidationMenuColId(null)}
                                    onMouseDown={(e) => e.stopPropagation()}
                                  >
                                    <button
                                      type="button"
                                      className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setAddingColumnTableId(tableId);
                                        setEditingValidationColumnForModal(col);
                                        setNewValidationColumnName(col.headerName || "");
                                        setNewValidationColumnType(summaryTypeOptions.some(opt => opt.value === col.key) ? col.key : "");
                                        setIsAddValidationColumnModalOpen(true);
                                        setActiveValidationMenuColId(null);
                                      }}
                                    >
                                      Edit Value
                                    </button>
                                    <button
                                      type="button"
                                      className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setDeleteValidationColumnKey(col.key);
                                        setDeleteValidationColumnKey({ tableId, key: col.key });
                                        setActiveValidationMenuColId(null);
                                      }}
                                    >
                                      Delete
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}

                            {(isEditingHeadersForThisTable || hasUnsavedHeadersForThisTable) ? (
                              <div className="flex items-center justify-center gap-1">
                                <input
                                  type="text"
                                  value={col.headerName || ""}
                                  onChange={(e) => handleValidationColumnRename(tableId, col.key, e.target.value)}
                                  className="px-2 py-1 text-xs border border-red-300 rounded focus:outline-none focus:ring-1 focus:ring-red-500 text-center bg-white min-w-[80px]"
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <div className="cursor-grab text-red-400 select-none text-lg" title="Drag column">⠿</div>
                              </div>
                            ) : isEditing ? (
                              <input
                                type="text"
                                value={col.headerName || ""}
                                onChange={(e) => handleValidationColumnRename(tableId, col.key, e.target.value)}
                                onBlur={saveValidationHeaderEdit}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") saveValidationHeaderEdit();
                                  if (e.key === "Escape") setEditingValidationHeaderKey(null);
                                }}
                                className="w-full px-1 py-0.5 text-xs border border-blue-500 rounded focus:outline-none text-center min-w-[80px] text-gray-900"
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                              />
                            ) : (
                              <div className="flex items-center justify-center relative group/handle">
                                <span className="px-6 inline-block">{col.headerName}</span>
                                {isDraggable && (
                                  <div className="absolute right-1 cursor-grab text-red-400 opacity-20 select-none text-lg group-hover:opacity-0 transition-opacity" title="Drag column">⠿</div>
                                )}
                              </div>
                            )}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-red-100">
                    {Array.from({ length: rows }).map((_, rIdx) => (
                      <tr key={rIdx} className="hover:bg-red-50/50">
                        {columns.map((col) => (
                          <td key={col.key} className="border border-red-200 px-2 py-2">
                            <input
                              type="text"
                              disabled
                              className="w-full bg-transparent border-none text-center focus:ring-0 text-red-600 placeholder-red-300"
                              placeholder="--"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

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

        <h3 className="text-md font-bold text-gray-800 mb-2">3rd Step</h3>

        {/* Dynamic Mock Preview Table */}
        <div className="rounded-lg bg-white p-6 shadow-md border border-gray-200">
          <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Observation Table Preview</h2>
              <p className="text-sm text-gray-500 mt-1">
                Showing a preview of the table layout that will be shown during calibration for this format.
              </p>
            </div>
            {customLayout && (
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setEditingColumnForModal(null);
                    setNewColumnName("");
                    setNewColumnType("");
                    setIsAddColumnModalOpen(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md shadow-sm border transition-all whitespace-nowrap bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Add Column
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (isEditingHeaders || hasUnsavedHeaders) {
                      try {
                        const authToken = localStorage.getItem("authToken");
                        const currentCols = customLayout?.columns || [];
                        await axios.post(
                          "/observationlayout/save-formate-layout",
                          createLayoutPayload(currentCols),
                          {
                            headers: {
                              Authorization: `Bearer ${authToken}`,
                              "Content-Type": "application/json",
                            },
                          }
                        );
                        toast.success("Headers saved successfully!");
                        setHasUnsavedHeaders(false);
                      } catch (err) {
                        console.error("Error saving headers:", err);
                        toast.error("Failed to save headers.");
                      }
                    }
                    if (!hasUnsavedHeaders) {
                      setIsEditingHeaders(!isEditingHeaders);
                    } else {
                      setIsEditingHeaders(false);
                    }
                  }}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md shadow-sm border transition-all whitespace-nowrap ${(isEditingHeaders || hasUnsavedHeaders)
                    ? "bg-green-600 border-green-600 text-white hover:bg-green-700"
                    : "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                    }`}
                >
                  {(isEditingHeaders || hasUnsavedHeaders) ? (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Save Headers
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                      </svg>
                      Edit Headers
                    </>
                  )}
                </button>

                {(isEditingHeaders || hasUnsavedHeaders) && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingHeaders(false);
                      setHasUnsavedHeaders(false);
                      setRefreshKey(prev => prev + 1);
                    }}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md shadow-sm border transition-all whitespace-nowrap bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Cancel
                  </button>
                )}
              </div>
            )}
          </div>
          {customLayout && (
            <p className="text-xs text-blue-600 font-medium mb-4 bg-blue-50 p-2 rounded border border-blue-100">
              💡 Tip: {(isEditingHeaders || hasUnsavedHeaders) ? "Type directly into any header field to rename it in real-time." : "Click 'Edit Headers' to rename headings, or drag and drop headers to change column positions."}
            </p>
          )}

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
            <div className="overflow-x-auto border border-gray-200 rounded-md">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-300">
                    {(customLayout ? getCustomTableStructure().headers : tableStructure.headers).map((header, index) => {
                      const isDraggable = customLayout && !header.isGroup && !isEditingHeaders;
                      const headerKey = header.columnKey;
                      const isEditing = editingHeaderKey === (header.isGroup ? `group_${header.name}` : headerKey);

                      return (
                        <th
                          key={index}
                          colSpan={header.colspan}
                          draggable={isDraggable}
                          onDragStart={(e) => {
                            if (isDraggable) {
                              e.currentTarget.classList.add("opacity-50", "shadow-lg", "scale-105", "bg-blue-50", "z-50");
                              handleDragStart(e, headerKey);
                            }
                          }}
                          onDragOver={(e) => isDraggable && handleDragOver(e)}
                          onDrop={(e) => isDraggable && handleDrop(e, headerKey)}
                          onDragEnd={(e) => e.currentTarget.classList.remove("opacity-50", "shadow-lg", "scale-105", "bg-blue-50", "z-50")}
                          onDoubleClick={() => {
                            if (customLayout && !isEditingHeaders) {
                              if (header.isGroup) {
                                startEditing(`group_${header.name}`, header.name);
                              } else {
                                startEditing(headerKey, header.name);
                              }
                            }
                          }}
                          className={`relative px-3 py-2 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-300 last:border-r-0 select-none transition-all duration-200 ${isDraggable ? "cursor-grab hover:bg-gray-200" : ""} group`}
                          title={customLayout ? (isEditingHeaders ? "Type to rename" : (header.isGroup ? "Double-click to rename group" : "Double-click to rename, drag to reorder")) : ""}
                        >
                          {isEditingHeaders ? (
                            <input
                              type="text"
                              value={header.name || ""}
                              onChange={(e) => {
                                if (header.isGroup) {
                                  const firstColKey = header.columns?.[0]?.key;
                                  if (firstColKey) {
                                    handleGroupRename(firstColKey, e.target.value);
                                  }
                                } else {
                                  handleColumnRename(headerKey, e.target.value);
                                }
                              }}
                              style={{ width: `${Math.max(90, (header.name || "").length * 8.5)}px` }}
                              className="px-2 py-1 text-xs border border-gray-300 hover:border-blue-400 focus:border-blue-500 rounded text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 text-center font-semibold uppercase bg-white max-w-full"
                              onClick={(e) => e.stopPropagation()}
                            />
                          ) : isEditing ? (
                            <input
                              type="text"
                              value={editingHeaderText}
                              onChange={(e) => setEditingHeaderText(e.target.value)}
                              onBlur={saveHeaderEdit}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") saveHeaderEdit();
                                if (e.key === "Escape") setEditingHeaderKey(null);
                              }}
                              className="w-full px-1 py-0.5 text-xs border border-blue-500 rounded text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 text-center font-normal uppercase"
                              autoFocus
                              onClick={(e) => e.stopPropagation()}
                            />
                          ) : (
                            <div className="flex items-center justify-center w-full h-full relative group/handle">
                              <span className="px-6">{header.name}</span>
                              {isDraggable && (
                                <div className="absolute right-1 cursor-grab text-gray-400 opacity-20 select-none text-lg group-hover:opacity-0 transition-opacity" title="Drag column">⠿</div>
                              )}
                              {header.name && ["Observation", "OBSERVATION", "UUC OBSERVATION", "MASTER OBSERVATION"].some(n => header.name.toUpperCase().includes(n.toUpperCase())) && customLayout && (
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center bg-white px-2 py-1 rounded-md shadow-sm border border-gray-300 hover:border-blue-400 transition-colors" onClick={(e) => e.stopPropagation()} title="Number of Observations">
                                  <select
                                    value={observationCount}
                                    onChange={(e) => handleObservationCountChange(parseInt(e.target.value))}
                                    className="text-xs bg-transparent focus:outline-none font-bold text-gray-800 cursor-pointer appearance-none text-center pr-2 pl-1"
                                  >
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                                      <option key={num} value={num}>{num}</option>
                                    ))}
                                  </select>
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-gray-500 pointer-events-none">
                                    <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              )}

                              {customLayout && !header.isGroup && headerKey && !headerKey.startsWith('col_') && (
                                <div className="absolute right-1 top-0 bottom-0 flex items-center">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveMenuColId(activeMenuColId === headerKey ? null : headerKey);
                                    }}
                                    className="p-1 rounded-md hover:bg-gray-200 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Column Options"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                    </svg>
                                  </button>

                                  {activeMenuColId === headerKey && (
                                    <>
                                      <div
                                        className="fixed inset-0 z-40"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setActiveMenuColId(null);
                                        }}
                                      ></div>
                                      <div
                                        className={`absolute top-full mt-1 w-32 bg-white rounded-md shadow-lg z-50 border border-gray-200 text-left ${index === 0 ? 'left-0' : 'right-0'}`}
                                        onMouseDown={(e) => e.stopPropagation()}
                                      >
                                        <div className="py-1">
                                          <button
                                            type="button"
                                            className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600 text-left flex items-center"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setActiveMenuColId(null);
                                              if (customLayout && !isEditingHeaders) {
                                                setEditingColumnForModal(header);
                                                setNewColumnName(header.name || "");
                                                setNewColumnType(summaryTypeOptions.some(opt => opt.value === headerKey) ? headerKey : "");
                                                setIsAddColumnModalOpen(true);
                                              }
                                            }}
                                          >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                            </svg>
                                            Edit Value
                                          </button>
                                          <button
                                            type="button"
                                            className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 text-left flex items-center"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setActiveMenuColId(null);
                                              setColumnToDelete(headerKey);
                                            }}
                                          >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                            Delete
                                          </button>
                                        </div>
                                      </div>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </th>
                      );
                    })}
                  </tr>
                  {(customLayout ? getCustomTableStructure().subHeadersRow : tableStructure.subHeadersRow).some((item) => item !== null) && (
                    <tr className="bg-gray-50 border-b border-gray-300">
                      {(customLayout ? getCustomTableStructure().subHeadersRow : tableStructure.subHeadersRow).map((subHeader, index) => {
                        const hasSubHeader = subHeader && (typeof subHeader === "object" ? subHeader.name !== null : true);
                        const subHeaderName = (subHeader && typeof subHeader === "object") ? subHeader.name : subHeader;
                        const headerKey = (subHeader && typeof subHeader === "object") ? subHeader.columnKey : null;
                        const isDraggable = customLayout && hasSubHeader && !isEditingHeaders;
                        const isEditing = editingHeaderKey === headerKey;

                        return (
                          <th
                            key={index}
                            draggable={isDraggable}
                            onDragStart={(e) => {
                              if (isDraggable) {
                                e.currentTarget.classList.add("opacity-50", "shadow-lg", "scale-105", "bg-blue-50", "z-50");
                                handleDragStart(e, headerKey);
                              }
                            }}
                            onDragOver={(e) => isDraggable && handleDragOver(e)}
                            onDrop={(e) => isDraggable && handleDrop(e, headerKey)}
                            onDragEnd={(e) => e.currentTarget.classList.remove("opacity-50", "shadow-lg", "scale-105", "bg-blue-50", "z-50")}
                            onDoubleClick={() => {
                              if (customLayout && hasSubHeader && !isEditingHeaders) {
                                startEditing(headerKey, subHeaderName);
                              }
                            }}
                            className={`relative px-3 py-2 text-center text-xs font-medium text-gray-600 border-r border-gray-300 last:border-r-0 select-none transition-all duration-200 ${isDraggable ? "cursor-grab hover:bg-gray-200" : ""} group`}
                            title={customLayout && hasSubHeader ? (isEditingHeaders ? "Type to rename" : "Double-click to rename, drag to reorder") : ""}
                          >
                            {isEditingHeaders && hasSubHeader ? (
                              <input
                                type="text"
                                value={subHeaderName || ""}
                                onChange={(e) => handleColumnRename(headerKey, e.target.value)}
                                style={{ width: `${Math.max(90, (subHeaderName || "").length * 8.5)}px` }}
                                className="px-2 py-1 text-xs border border-gray-300 hover:border-blue-400 focus:border-blue-500 rounded text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 text-center font-normal bg-white max-w-full"
                                onClick={(e) => e.stopPropagation()}
                              />
                            ) : isEditing ? (
                              <input
                                type="text"
                                value={editingHeaderText}
                                onChange={(e) => setEditingHeaderText(e.target.value)}
                                onBlur={saveHeaderEdit}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") saveHeaderEdit();
                                  if (e.key === "Escape") setEditingHeaderKey(null);
                                }}
                                className="w-full px-1 py-0.5 text-xs border border-blue-500 rounded text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 text-center font-normal"
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                              />
                            ) : (
                              <div className="flex items-center justify-center w-full h-full relative group/handle">
                                <span className="px-6">{subHeaderName}</span>
                                {isDraggable && (
                                  <div className="absolute right-1 cursor-grab text-gray-400 opacity-20 select-none text-lg group-hover:opacity-0 transition-opacity" title="Drag column">⠿</div>
                                )}
                              </div>
                            )}
                          </th>
                        );
                      })}
                    </tr>
                  )}
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {selectedTableData.staticRows.map((row, rowIndex) => (
                    <tr key={rowIndex} className="hover:bg-gray-50">
                      {(customLayout ? customLayout.columns : row).map((item, index) => {
                        const colIndex = customLayout ? item.originalIndex : index;
                        const cell = row[colIndex];
                        const isUnitSelect = cell === "UNIT_SELECT";
                        const isLabel = ["-", "UUC", "Master"].includes(cell);

                        if (isUnitSelect) {
                          return (
                            <td
                              key={colIndex}
                              className="px-3 py-2 whitespace-nowrap text-sm border-r border-gray-200 last:border-r-0"
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
                              className="px-3 py-2 whitespace-nowrap text-sm border-r border-gray-200 last:border-r-0 text-center font-medium bg-gray-50"
                            >
                              {cell}
                            </td>
                          );
                        }

                        return (
                          <td
                            key={colIndex}
                            className="px-3 py-2 whitespace-nowrap text-sm border-r border-gray-200 last:border-r-0"
                          >
                            <input
                              type="text"
                              className="w-full px-2 py-1 border border-gray-200 rounded text-sm bg-gray-50 cursor-not-allowed text-center text-gray-600"
                              value={cell}
                              disabled
                            />
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

        {/* Validation Tables */}
        {renderExtraTables()}

        {/* Create Validation Table Button */}
        {customLayout && (
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={() => setIsValidationModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-md shadow-sm border border-red-200 transition-all bg-white text-red-600 hover:bg-red-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Create Table
            </button>
          </div>
        )}

        {/* ==========================================
        // COMMENTED OUT ORIGINAL CONFIGURATION UI
        // Definition: These JSX blocks rendered the formula reference tables, modal,
        // and manual table/row configuration editor.
        // We comment them out but preserve them for code integrity.
        // ========================================== */}
        {/*
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
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

        {/* Add Column Modal */}
        {/* Delete Confirmation Modal */}
        {columnToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
            <div className="bg-white rounded-lg p-6 w-96 shadow-xl text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Delete Column</h3>
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to delete this column? This action cannot be undone.
              </p>

              <div className="flex justify-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setColumnToDelete(null)}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </Button>
                <button
                  type="button"
                  onClick={async () => {
                    const currentCols = customLayout?.columns || [];
                    const updatedCols = currentCols.filter(c => c.key !== columnToDelete);

                    setCustomLayout(prev => {
                      if (!prev) return prev;
                      return { ...prev, columns: updatedCols };
                    });

                    setColumnToDelete(null);

                    try {
                      const authToken = localStorage.getItem("authToken");
                      await axios.post(
                        "/observationlayout/save-formate-layout",
                        createLayoutPayload(updatedCols),
                        {
                          headers: {
                            Authorization: `Bearer ${authToken}`,
                            "Content-Type": "application/json",
                          },
                        }
                      );
                      toast.success("Column deleted successfully!");
                    } catch (err) {
                      console.error("Error deleting column:", err);
                      toast.error("Failed to delete column.");
                    }
                  }}
                  className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {isAddColumnModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
              <h2 className="mb-4 text-xl font-bold text-gray-800">{editingColumnForModal ? "Edit Column" : "Add New Column"}</h2>

              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Heading Name
                  </label>
                  <input
                    type="text"
                    value={newColumnName}
                    onChange={(e) => setNewColumnName(e.target.value)}
                    placeholder="Enter heading name"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Column Type
                  </label>
                  <Select
                    value={summaryTypeOptions.find(opt => opt.value === newColumnType) || null}
                    onChange={(selected) => setNewColumnType(selected ? selected.value : "")}
                    options={summaryTypeOptions}
                    placeholder="Select type..."
                    isClearable
                    menuPortalTarget={document.body}
                    styles={{
                      menuPortal: base => ({ ...base, zIndex: 9999 }),
                      control: base => ({ ...base, minHeight: "38px" })
                    }}
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAddColumnModalOpen(false);
                    setNewColumnName("");
                    setNewColumnType("");
                  }}
                  className="px-4 py-2 text-sm"
                >
                  Cancel
                </Button>
                <button
                  onClick={async () => {
                    if (!newColumnName || !newColumnType) {
                      toast.error("Please enter both Heading Name and Type.");
                      return;
                    }

                    if (!formatId) {
                      toast.error("Format ID is missing! Cannot save column.");
                      return;
                    }

                    const currentColumns = customLayout?.columns || [];
                    let updatedColumns;

                    if (editingColumnForModal) {
                      const editKey = editingColumnForModal.columnKey || editingColumnForModal.key;
                      const exists = currentColumns.some(col => col.key === newColumnType && col.key !== editKey);
                      if (exists) {
                        toast.error("A column of this type already exists.");
                        return;
                      }
                      const idx = currentColumns.findIndex(col => col.key === editKey);
                      if (idx !== -1) {
                        updatedColumns = [...currentColumns];
                        updatedColumns[idx] = {
                          ...updatedColumns[idx],
                          key: newColumnType,
                          headerName: newColumnName,
                          defaultName: newColumnName,
                        };
                      } else {
                        updatedColumns = [...currentColumns];
                      }
                    } else {
                      const exists = currentColumns.some(col => col.key === newColumnType);
                      if (exists) {
                        toast.error("A column of this type already exists.");
                        return;
                      }
                      const maxIndex = Math.max(...currentColumns.map(c => c.originalIndex || 0), 0);
                      const newCol = {
                        key: newColumnType,
                        originalIndex: maxIndex + 1,
                        defaultName: newColumnName,
                        headerName: newColumnName,
                        group: null,
                        fetched_value: "new"
                      };
                      updatedColumns = [...currentColumns, newCol];
                    }

                    setCustomLayout(prev => {
                      if (!prev) return prev;
                      return {
                        ...prev,
                        columns: updatedColumns
                      };
                    });

                    try {
                      const authToken = localStorage.getItem("authToken");
                      const response = await axios.post(
                        "/observationlayout/save-formate-layout",
                        createLayoutPayload(updatedColumns),
                        {
                          headers: {
                            Authorization: `Bearer ${authToken}`,
                            "Content-Type": "application/json",
                          },
                        }
                      );

                      if (response.data.success || response.data.status === "true" || response.data.status === true) {
                        toast.success("Column added and layout saved successfully!");
                      } else {
                        toast.error("Failed to save column layout.");
                      }
                    } catch (error) {
                      console.error("Error saving new column:", error);
                      toast.error("Error saving new column to backend.");
                    }

                    setIsAddColumnModalOpen(false);
                    setNewColumnName("");
                    setNewColumnType("");
                    setEditingColumnForModal(null);
                  }}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  {editingColumnForModal ? "Save Changes" : "Save Column"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Validation Table Modal */}
        {isValidationModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
            <div className="bg-white rounded-lg p-6 w-[500px] shadow-xl max-h-[90vh] overflow-y-auto">
              <div className="mb-4 flex items-center gap-3 border-b pb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                  <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Create Table</h3>
                  <p className="text-sm text-gray-500">Configure rows, columns, and headings.</p>
                </div>
              </div>

              <div className="mb-4 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Number of Rows</label>
                  <input
                    type="number"
                    min="1"
                    value={validationRows}
                    onChange={(e) => setValidationRows(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-red-500 focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Number of Columns</label>
                  <input
                    type="number"
                    min="1"
                    max="15"
                    value={validationCols}
                    onChange={(e) => {
                      const val = Math.max(1, Math.min(15, parseInt(e.target.value) || 1));
                      setValidationCols(val);
                      setValidationHeadings((prev) => {
                        const newHeadings = [...prev];
                        if (val > newHeadings.length) {
                          for (let i = newHeadings.length; i < val; i++) newHeadings.push(`Column ${i + 1}`);
                        } else if (val < newHeadings.length) {
                          newHeadings.splice(val);
                        }
                        return newHeadings;
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-red-500 focus:border-red-500"
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Column Headings</label>
                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                  {validationHeadings.map((heading, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-400 w-6">{idx + 1}.</span>
                      <input
                        type="text"
                        value={heading}
                        onChange={(e) => {
                          const newHeadings = [...validationHeadings];
                          newHeadings[idx] = e.target.value;
                          setValidationHeadings(newHeadings);
                        }}
                        className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-red-500 focus:border-red-500"
                        placeholder={`Column ${idx + 1} Name`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  onClick={() => setIsValidationModalOpen(false)}
                >
                  Cancel
                </Button>
                <button
                  type="button"
                  className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 shadow-sm"
                  onClick={async () => {
                    const colsWithKeys = validationHeadings.map((h, i) => ({
                      key: `val_col_${Date.now()}_${i}`,
                      headerName: h,
                      fetched_value: "new",
                    }));
                    const newTableId = `table${extraTables.length + 1}`;
                    const newTableData = {
                      id: newTableId,
                      name: `Data Validation Settings (${newTableId})`,
                      rows: validationRows,
                      cols: validationCols,
                      columns: colsWithKeys,
                    };
                    const updatedExtraTables = [...extraTables, newTableData];
                    setExtraTables(updatedExtraTables);
                    setIsValidationModalOpen(false);

                    try {
                      const authToken = localStorage.getItem("authToken");
                      const currentCols = customLayout?.columns || [];
                      await axios.post(
                        "/observationlayout/save-formate-layout",
                        createLayoutPayload(currentCols, updatedExtraTables),
                        {
                          headers: {
                            Authorization: `Bearer ${authToken}`,
                            "Content-Type": "application/json",
                          },
                        }
                      );
                      toast.success("Validation table generated and saved!");
                    } catch (err) {
                      console.error("Error saving validation table:", err);
                      toast.error("Failed to save validation table.");
                    }
                  }}
                >
                  Generate Table
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Validation Column Modal */}
        {isAddValidationColumnModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
            <div className="bg-white rounded-lg p-6 w-[400px] shadow-xl">
              <h3 className="text-lg font-bold text-gray-800 mb-4">{editingValidationColumnForModal ? "Edit Validation Column" : "Add Validation Column"}</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Column Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={newValidationColumnName}
                  onChange={(e) => setNewValidationColumnName(e.target.value)}
                  placeholder="Enter column name"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-red-500 focus:border-red-500"
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Type <span className="text-red-500">*</span></label>
                <Select
                  value={summaryTypeOptions.find(opt => opt.value === newValidationColumnType) || null}
                  onChange={(selected) => setNewValidationColumnType(selected ? selected.value : "")}
                  options={summaryTypeOptions}
                  placeholder="Select Type"
                  isClearable
                  menuPortalTarget={document.body}
                  styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  onClick={() => {
                    setIsAddValidationColumnModalOpen(false);
                    setNewValidationColumnName("");
                    setNewValidationColumnType("");
                  }}
                >
                  Cancel
                </Button>
                <button
                  type="button"
                  onClick={handleAddValidationColumn}
                  className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                >
                  {editingValidationColumnForModal ? "Save Changes" : "Add Column"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Validation Column Confirmation Modal */}
        {deleteValidationColumnKey && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
            <div className="bg-white rounded-lg p-6 w-96 shadow-xl text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Delete Validation Column</h3>
              <p className="text-sm text-gray-500 mb-6">Are you sure you want to delete this validation column? This action cannot be undone.</p>

              <div className="flex justify-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  onClick={() => setDeleteValidationColumnKey(null)}
                >
                  Cancel
                </Button>
                <button
                  type="button"
                  className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                  onClick={() => {
                    if (deleteValidationColumnKey && deleteValidationColumnKey.tableId) {
                      handleDeleteValidationColumn(deleteValidationColumnKey.tableId, deleteValidationColumnKey.key);
                    } else {
                      // Fallback just in case
                      handleDeleteValidationColumn(null, deleteValidationColumnKey);
                    }
                    setDeleteValidationColumnKey(null);
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Back and Save & Next buttons */}
        <div className="mt-4 flex flex-row items-center justify-between gap-2">
          <Button
            onClick={onBack}
            variant="outline"
            className="rounded-md bg-white border border-gray-300 px-8 py-3 text-lg font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
          >
            ← Back
          </Button>

          <button
            onClick={handleSave}
            disabled={loading}
            className="rounded-md bg-blue-600 px-8 py-3 text-lg font-medium text-white shadow-md transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save & Next →"}
          </button>
        </div>
      </div>
    </div>
  );
}
