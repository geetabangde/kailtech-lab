import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router";
import { Page } from "components/shared/Page";
import { Button } from "components/ui/Button";
import { toast } from "sonner";
import axios from "utils/axios";
import InstrumentInfo from "./components/InstrumentInfo";
import MastersList from "./components/MastersList";
import SupportMastersList from "./components/SupportMastersList";
import DateNotesForm from "./components/DateNotesForm";
import ObservationTable from "./components/ObservationTable";
import Notes from "./components/Notes";

const CalibrateStep3 = () => {
    const navigate = useNavigate();
    const { id, itemId: instId } = useParams();
    const inwardId = id;
    const searchParams = new URLSearchParams(window.location.search);
    const caliblocation = searchParams.get("caliblocation") || "Lab";
    const calibacc = searchParams.get("calibacc") || "Nabl";

    const [apiData, setApiData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [dynamicHeadings, setDynamicHeadings] = useState(null);
    const [suffix, setSuffix] = useState("");
    const [observations, setObservations] = useState([]);
    const [tableInputValues, setTableInputValues] = useState({});
    const [observationErrors, setObservationErrors] = useState({});
    const [supportMasters, setSupportMasters] = useState([]);
    const [humidityRange, setHumidityRange] = useState(null);
    const [temperatureRange, setTemperatureRange] = useState(null);
    const [errors] = useState({});
    const [leastCountData, setLeastCountData] = useState({});

    // ✅ Helper function to get decimal places from least count
    const getDecimalPlaces = useCallback((leastCount) => {
        if (!leastCount || leastCount === 0) return 2; // default
        const leastCountStr = leastCount.toString();
        if (leastCountStr.includes('.')) {
            return leastCountStr.split('.')[1].length;
        }
        return 0;
    }, []);

    const [formData, setFormData] = useState({
        enddate: "",
        duedate: "",
        notes: "",
        tempend: "",
        humiend: "",
    });

    const formatDateForInput = (dateString) => {
        if (!dateString) return "";
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return "";
            return date.toISOString().split("T")[0];
        } catch {
            console.warn("Invalid date format:", dateString);
            return "";
        }
    };

    // ✅ Modified evaluateFormula - Remove toFixed(4) so we can format based on least count later
    const evaluateFormula = useCallback((formula, variables) => {
        if (!formula || !formula.trim()) return "";

        try {
            let expr = formula.trim();

            console.log("🧮 Original formula:", formula);
            console.log("📊 Input variables:", variables);

            // Step 1: Remove ALL $ signs from formula
            expr = expr.replace(/\$/g, "");

            // Step 2: Create clean variables without $ signs
            const cleanVariables = {};
            Object.keys(variables).forEach((key) => {
                const cleanKey = key.replace(/\$/g, "");
                cleanVariables[cleanKey] = variables[key];
            });

            console.log("🔧 Clean formula:", expr);
            console.log("🔧 Clean variables:", cleanVariables);

            // Step 3: Handle special functions and operators
            const functionMappings = [
                { pattern: /\babs\(([^)]+)\)/g, replacement: "Math.abs($1)" },
                {
                    pattern: /\bpow\(([^,]+),\s*([^)]+)\)/g,
                    replacement: "Math.pow($1, $2)",
                },
                { pattern: /\bsqrt\(([^)]+)\)/g, replacement: "Math.sqrt($1)" },
                { pattern: /\bmin\(([^)]+)\)/g, replacement: "Math.min($1)" },
                { pattern: /\bmax\(([^)]+)\)/g, replacement: "Math.max($1)" },
            ];

            functionMappings.forEach((mapping) => {
                expr = expr.replace(mapping.pattern, mapping.replacement);
            });

            // Step 4: Replace variables with their numeric values
            const sortedKeys = Object.keys(cleanVariables).sort(
                (a, b) => b.length - a.length,
            );

            for (const key of sortedKeys) {
                if (typeof cleanVariables[key] !== "number") continue;

                const regex = new RegExp(`\\b${key}\\b`, "g");
                expr = expr.replace(regex, `(${cleanVariables[key]})`);
            }

            // Step 5: Replace any remaining unknown variables with 0
            expr = expr.replace(/\b[a-zA-Z]\w*\b/g, "0");

            console.log("📝 Final expression:", expr);

            // Step 6: Safe evaluation
            const result = new Function(`
      'use strict';
      const abs = Math.abs;
      const pow = Math.pow;
      const sqrt = Math.sqrt;
      const min = Math.min;
      const max = Math.max;
      return ${expr};
    `)();

            if (isNaN(result) || result === Infinity || result === -Infinity) {
                console.warn("⚠️ Invalid result:", result);
                return "";
            }

            // ✅ CHANGED: Return raw number, formatting will be done based on field type
            const finalValue = parseFloat(result);
            console.log("✅ Result (unformatted):", finalValue);

            return finalValue;
        } catch (err) {
            console.error("❌ Formula evaluation failed:", {
                formula,
                error: err.message,
                variables,
            });
            return "";
        }
    }, []);

    const fetchDynamicHeadings = useCallback(
        async (suffix) => {
            if (!suffix) {
                console.log("❌ No suffix provided for dynamic headings");
                return null;
            }

            try {
                console.log("🔍 Fetching dynamic headings for suffix:", suffix);

                const response = await axios.post(
                    "/observationsetting/get-custome-observation",
                    {
                        inwardid: inwardId,
                        instid: instId,
                        suffix: suffix,
                    },
                );

                console.log("📊 Dynamic Headings API Response:", response.data);

                if (response.data.status === true) {
                    return {
                        heading: response.data.heading,
                        data: response.data.data,
                    };
                } else {
                    console.log("❌ No dynamic headings found in response");
                    return null;
                }
            } catch (error) {
                console.error("Error fetching dynamic headings:", error);
                return null;
            }
        },
        [instId, inwardId],
    );

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                setLoading(true);
                const response = await axios.get(
                    "/calibrationprocess/get-calibration-step3-details",
                    {
                        params: {
                            inward_id: inwardId,
                            instid: instId,
                            caliblocation: caliblocation,
                            calibacc: calibacc,
                        },
                        headers: {
                            Authorization: "Bearer " + localStorage.getItem("authToken"),
                        },
                    },
                );

                console.log("All API Data:", response.data);
                setApiData(response.data);
                setSupportMasters(response.data.supportMasters || []);
                setHumidityRange(response.data.humidityRange || null);
                setTemperatureRange(response.data.temperatureRange || null);

                console.log("supports data", response.data);

                if (response.data.listOfInstrument?.suffix) {
                    setSuffix(response.data.listOfInstrument.suffix);
                    console.log("Suffix found:", response.data.listOfInstrument.suffix);

                    const headingsResponse = await fetchDynamicHeadings(
                        response.data.listOfInstrument.suffix,
                    );

                    if (headingsResponse) {
                        setDynamicHeadings(headingsResponse.heading);

                        if (headingsResponse.data?.calibration_points) {
                            console.log(
                                "Setting observations from get-custome-observation API:",
                                headingsResponse.data.calibration_points,
                            );
                            setObservations(headingsResponse.data.calibration_points);

                            // ✅ FIXED: Extract least count from matrix.leastcount
                            const leastCountMap = {};
                            headingsResponse.data.calibration_points.forEach((point) => {
                                if (point.id && point.matrix?.leastcount) {
                                    leastCountMap[point.id] = parseFloat(point.matrix.leastcount);
                                }
                            });
                            setLeastCountData(leastCountMap);
                            console.log("📊 Least Count Map:", leastCountMap);
                        }
                    }
                }

                setFormData((prev) => ({
                    ...prev,
                    setTemperatureRange: response.data.temperatureRange || null,
                    humidityRange: response.data.humidityRange || null,
                    enddate: formatDateForInput(response.data.instrument?.enddate),
                    humiend: response.data.instrument?.humiend || "",
                    tempend: response.data.instrument?.tempend || "",
                    duedate: formatDateForInput(response.data.instrument?.duedate),
                    temperatureEnd:
                        response.data.temperatureRange?.min &&
                            response.data.temperatureRange?.max
                            ? `${response.data.temperatureRange.min} - ${response.data.temperatureRange.max}`
                            : response.data.temperatureRange?.value || "",
                    humidityEnd:
                        response.data.humidityRange?.min && response.data.humidityRange?.max
                            ? `${response.data.humidityRange.min} - ${response.data.humidityRange.max}`
                            : response.data.humidityRange?.value || "",
                }));
            } catch (err) {
                console.error("API Error:", err.response?.data || err);
                toast.error("Failed to fetch calibration data");
            } finally {
                setLoading(false);
            }
        };

        if (inwardId && instId) {
            fetchAllData();
        }
    }, [inwardId, instId, caliblocation, calibacc, fetchDynamicHeadings]);

    // ✅ Generate Dynamic Table Structure - Uses API order (NO SORTING)
    const generateDynamicTableStructure = useCallback(
        (headings) => {
            if (!headings || !Array.isArray(headings)) {
                console.log("❌ No headings provided for dynamic table structure");
                return null;
            }

            console.log("🔄 Generating dynamic table structure");

            // ✅ Use API order directly - NO SORTING by field_position
            const calibrationSettings = headings.filter(
                (col) => col.checkbox === "yes",
            );
            const observationFrom = dynamicHeadings?.observation_from || "master";
            const observationSettings =
                dynamicHeadings?.observation_heading?.observation_settings || [];
            const enabledObsSettings = observationSettings.filter(
                (obs) => obs.checkbox === "yes",
            );

            console.log(
                "📋 Fields in API order:",
                calibrationSettings.map((s) => s.fieldname),
            );
            console.log("📋 Observation from:", observationFrom);
            console.log("📋 Enabled observations:", enabledObsSettings.length);

            const headers = [];
            const subHeadersRow = [];

            // SR NO column
            headers.push({ name: "SR NO", colspan: 1 });
            subHeadersRow.push(null);

            // ✅ Process fields in API order
            calibrationSettings.forEach((heading) => {
                const headerName = heading.field_heading || heading.fieldname;
                const fieldname = heading.fieldname;

                // ✅ Handle different observation_from modes
                if (observationFrom === "master" && fieldname === "master") {
                    // Master has multiple observations, UUC is single
                    if (enabledObsSettings.length > 0) {
                        headers.push({
                            name: headerName,
                            colspan: enabledObsSettings.length,
                        });
                        enabledObsSettings.forEach((obsSetting) => {
                            subHeadersRow.push(
                                obsSetting.field_heading || obsSetting.fieldname,
                            );
                        });
                    } else {
                        headers.push({ name: headerName, colspan: 1 });
                        subHeadersRow.push(null);
                    }
                } else if (observationFrom === "uuc" && fieldname === "uuc") {
                    // ✅ UUC mode: UUC has multiple observations, Master is single
                    if (enabledObsSettings.length > 0) {
                        headers.push({
                            name: headerName,
                            colspan: enabledObsSettings.length,
                        });
                        enabledObsSettings.forEach((obsSetting) => {
                            subHeadersRow.push(
                                obsSetting.field_heading || obsSetting.fieldname,
                            );
                        });
                    } else {
                        headers.push({ name: headerName, colspan: 1 });
                        subHeadersRow.push(null);
                    }
                } else if (observationFrom === "separate") {
                    // Both master and UUC have multiple observations
                    if (fieldname === "master" || fieldname === "uuc") {
                        if (enabledObsSettings.length > 0) {
                            headers.push({
                                name: headerName,
                                colspan: enabledObsSettings.length,
                            });
                            enabledObsSettings.forEach((obsSetting) => {
                                subHeadersRow.push(
                                    obsSetting.field_heading || obsSetting.fieldname,
                                );
                            });
                        } else {
                            headers.push({ name: headerName, colspan: 1 });
                            subHeadersRow.push(null);
                        }
                    } else {
                        // Regular single column
                        headers.push({ name: headerName, colspan: 1 });
                        subHeadersRow.push(null);
                    }
                } else {
                    // Default case - regular single column
                    headers.push({ name: headerName, colspan: 1 });
                    subHeadersRow.push(null);
                }
            });

            console.log("✅ Headers generated:", headers);
            console.log("✅ Sub-headers generated:", subHeadersRow);

            return { headers, subHeadersRow };
        },
        [dynamicHeadings],
    );

    // ✅ Create observation rows - Supports all 3 observation_from modes + mode field + calculated fields
    const createObservationRows = (observationData) => {
        if (!observationData || !Array.isArray(observationData)) {
            return {
                rows: [],
                hiddenInputs: {
                    calibrationPoints: [],
                    types: [],
                    repeatables: [],
                    values: [],
                },
            };
        }

        const rows = [];
        const calibrationPoints = [];
        const types = [];
        const repeatables = [];
        const values = [];

        // ✅ Get observation_from from API response
        const observationFrom = dynamicHeadings?.observation_from || "master";
        const observationSettings =
            dynamicHeadings?.observation_heading?.observation_settings || [];
        const enabledObsSettings = observationSettings.filter(
            (obs) => obs.checkbox === "yes",
        );

        // ✅ Get calibration settings WITHOUT sorting - use API order
        const calibrationSettings =
            dynamicHeadings?.mainhading?.calibration_settings?.filter(
                (col) => col.checkbox === "yes",
            ) || [];

        console.log("🔄 Creating rows with observation_from:", observationFrom);
        console.log("📋 Enabled observations:", enabledObsSettings.length);

        observationData.forEach((point, index) => {
            const row = [(index + 1).toString()];

            // ✅ Process each field in API order (NO SORTING)
            calibrationSettings.forEach((setting) => {
                const { fieldname, fieldfrom } = setting;

                // 🟢 Case 1: Data comes from newcrfcalibrationpoint (variables)
                if (fieldfrom === "newcrfcalibrationpoint") {
                    row.push(point.variables?.[fieldname] || "");
                    return;
                }

                // 🟢 Case 2: Data comes from new_summary (summary_data)
                // ✅ Handle UUC field based on observation_from
                if (fieldname === "uuc") {
                    if (observationFrom === "uuc" || observationFrom === "separate") {
                        // ✅ UUC mode: Multiple observations
                        const uucData = point.summary_data?.uuc || [];
                        const sortedUucData = [...uucData].sort(
                            (a, b) => parseInt(a.repeatable) - parseInt(b.repeatable)
                        );

                        // Fill columns based on enabledObsSettings count
                        enabledObsSettings.forEach((_, idx) => {
                            row.push(sortedUucData[idx]?.value || "");
                        });
                    } else {
                        // Single value mode (Master mode)
                        const uucData = point.summary_data?.uuc || [];
                        const calculatedUuc = uucData.find((item) => item.repeatable === "0") || uucData[0];
                        row.push(calculatedUuc?.value || "");
                    }
                }
                // ✅ Handle MASTER field based on observation_from
                else if (fieldname === "master") {
                    if (observationFrom === "master" || observationFrom === "separate") {
                        // ✅ Master mode: Multiple observations
                        const masterData = point.summary_data?.master || [];
                        const sortedMasterData = [...masterData].sort(
                            (a, b) => parseInt(a.repeatable) - parseInt(b.repeatable)
                        );

                        enabledObsSettings.forEach((_, idx) => {
                            row.push(sortedMasterData[idx]?.value || "");
                        });
                    } else {
                        // Single value mode (UUC mode)
                        const masterData = point.summary_data?.master || [];
                        const masterSingleValue = masterData.find((item) => item.repeatable === "0") || masterData[0];

                        row.push(
                            masterSingleValue?.value ||
                            point.variables?.point ||
                            point.point ||
                            ""
                        );
                    }
                }
                // ✅ Handle other summary fields (mode, range, average, error, etc.)
                else {
                    const summaryFieldData = point.summary_data?.[fieldname];
                    if (summaryFieldData && Array.isArray(summaryFieldData) && summaryFieldData.length > 0) {
                        row.push(summaryFieldData[0]?.value || "");
                    } else {
                        // Fallback for fields like mode/range that might be top-level in older responses
                        row.push(point[fieldname] || "");
                    }
                }
            });

            console.log(`✅ Row ${index} complete:`, row);
            rows.push(row);
            calibrationPoints.push(point.id?.toString() || "");
            types.push("master");
            repeatables.push("0");
            values.push(point.point || point.converted_point || "0");
        });

        console.log("✅ All rows created:", rows);

        return {
            rows,
            hiddenInputs: { calibrationPoints, types, repeatables, values },
        };
    };

    const generateTableStructure = () => {
        if (dynamicHeadings?.mainhading?.calibration_settings) {
            const dynamicStructure = generateDynamicTableStructure(
                dynamicHeadings.mainhading.calibration_settings,
            );
            if (dynamicStructure) {
                console.log("✅ Using dynamic table structure");
                return dynamicStructure;
            }
        }
        return null;
    };

    const tableStructure = generateTableStructure();
    const observationRows = createObservationRows(observations);

    // ✅ Calculate initial values - Supports all 3 observation_from modes
    // ✅ WITH PROPER FORMATTING FOR AVERAGE
    useEffect(() => {
        if (observations.length > 0 && dynamicHeadings) {
            console.log("🔄 Calculating initial values...");

            const initialValues = {};
            const observationFrom = dynamicHeadings?.observation_from || "master";

            observations.forEach((point, rowIndex) => {
                // Build column map
                const columnMap = {};

                if (dynamicHeadings?.mainhading?.calibration_settings) {
                    const calibrationSettings =
                        dynamicHeadings.mainhading.calibration_settings.filter(
                            (col) => col.checkbox === "yes",
                        );

                    const enabledObsSettings =
                        dynamicHeadings?.observation_heading?.observation_settings?.filter(
                            (obs) => obs.checkbox === "yes",
                        ) || [];

                    let currentCol = 1;

                    calibrationSettings.forEach((setting) => {
                        const fieldname = setting.fieldname;

                        if (observationFrom === "master" && fieldname === "master") {
                            columnMap[fieldname] = {
                                startCol: currentCol,
                                endCol: currentCol + enabledObsSettings.length - 1,
                                count: enabledObsSettings.length,
                            };
                            currentCol += enabledObsSettings.length;
                        } else if (observationFrom === "uuc" && fieldname === "uuc") {
                            columnMap[fieldname] = {
                                startCol: currentCol,
                                endCol: currentCol + enabledObsSettings.length - 1,
                                count: enabledObsSettings.length,
                            };
                            currentCol += enabledObsSettings.length;
                        } else if (observationFrom === "separate") {
                            if (fieldname === "master" || fieldname === "uuc") {
                                columnMap[fieldname] = {
                                    startCol: currentCol,
                                    endCol: currentCol + enabledObsSettings.length - 1,
                                    count: enabledObsSettings.length,
                                };
                                currentCol += enabledObsSettings.length;
                            } else {
                                columnMap[fieldname] = currentCol;
                                currentCol++;
                            }
                        } else {
                            columnMap[fieldname] = currentCol;
                            currentCol++;
                        }
                    });
                }

                // ✅ 1. Re-calculate variables from BOTH sources
                const variables = {};

                // A. Add Observation settings (Repeatable data)
                if (dynamicHeadings?.observation_heading?.observation_settings) {
                    const obsSettings = dynamicHeadings.observation_heading.observation_settings.filter(
                        (obs) => obs.checkbox === "yes"
                    );

                    if (observationFrom === "uuc" && point.summary_data?.uuc) {
                        const uucData = [...point.summary_data.uuc].sort(
                            (a, b) => parseInt(a.repeatable) - parseInt(b.repeatable)
                        );
                        obsSettings.forEach((obsSetting, idx) => {
                            variables[obsSetting.setvariable] = parseFloat(uucData[idx]?.value) || 0;
                        });
                    }
                    if (observationFrom === "master" && point.summary_data?.master) {
                        const masterData = [...point.summary_data.master].sort(
                            (a, b) => parseInt(a.repeatable) - parseInt(b.repeatable)
                        );
                        obsSettings.forEach((obsSetting, idx) => {
                            variables[obsSetting.setvariable] = parseFloat(masterData[idx]?.value) || 0;
                        });
                    }
                }

                // B. Add Main Calibration Settings (Single values)
                if (dynamicHeadings?.mainhading?.calibration_settings) {
                    dynamicHeadings.mainhading.calibration_settings.forEach(setting => {
                        const { fieldname, fieldfrom, SetVariable } = setting;
                        let val = 0;

                        if (fieldfrom === "newcrfcalibrationpoint") {
                            val = parseFloat(point.variables?.[fieldname]) || 0;
                        } else if (fieldname !== "uuc" && fieldname !== "master") {
                            const summaryData = point.summary_data?.[fieldname];
                            val = parseFloat(summaryData?.[0]?.value) || 0;
                        }

                        if (SetVariable) {
                            variables[SetVariable] = val;
                            // Also add without $ sign for flexibility
                            variables[SetVariable.replace('$', '')] = val;
                        }
                    });
                }

                // ✅ Add fallback master value (for older formulas)
                const masterValue = parseFloat(point.variables?.point || point.point || point.converted_point || "0");
                variables["$master"] = variables["$master"] || masterValue;
                variables["master"] = variables["master"] || masterValue;

                console.log(`Row ${rowIndex} variables:`, variables);
                console.log(`Row ${rowIndex} master value:`, masterValue);

                // ✅ Calculate all formula-based fields WITH PROPER FORMATTING
                if (dynamicHeadings?.mainhading?.calibration_settings) {
                    const calibrationSettings =
                        dynamicHeadings.mainhading.calibration_settings.filter(
                            (col) => col.checkbox === "yes",
                        );

                    calibrationSettings.forEach((setting) => {
                        const { fieldname, formula, SetVariable } = setting;

                        if (fieldname === "master" || fieldname === "uuc") return;

                        if (formula && formula.trim() !== "") {
                            const colIdx = columnMap[fieldname];
                            if (colIdx !== undefined) {
                                let calculatedValue = evaluateFormula(formula, variables);

                                if (calculatedValue !== "") {
                                    // ✅ FORMAT AVERAGE BASED ON LEAST COUNT
                                    if (fieldname === "average") {
                                        const calibPointId = point.id;
                                        const leastCount = leastCountData[calibPointId];
                                        if (leastCount) {
                                            const decimalPlaces = getDecimalPlaces(leastCount);
                                            calculatedValue = parseFloat(calculatedValue.toFixed(decimalPlaces));
                                            console.log(
                                                `✅ Formatted average for row ${rowIndex}: ${calculatedValue} (${decimalPlaces} decimals based on LC: ${leastCount})`
                                            );
                                        }
                                    }

                                    initialValues[`${rowIndex}-${colIdx}`] = calculatedValue;
                                    console.log(
                                        `✅ Row ${rowIndex}, ${fieldname}: ${calculatedValue} (formula: ${formula})`,
                                    );

                                    if (SetVariable && SetVariable.trim() !== "") {
                                        variables[SetVariable] = parseFloat(calculatedValue) || 0;
                                    }
                                }
                            }
                        }
                    });
                }
            });

            // ✅ Only set values that don't already exist
            setTableInputValues((prev) => {
                const newValues = { ...prev };

                Object.keys(initialValues).forEach((key) => {
                    if (newValues[key] === undefined) {
                        newValues[key] = initialValues[key];
                    }
                });

                return newValues;
            });
        }
    }, [observations, dynamicHeadings, evaluateFormula, leastCountData, getDecimalPlaces]);

    const renderThermalCoefficientSection = () => {
        return null;
    };

    // ✅ Handle input changes - WITH PROPER AVERAGE FORMATTING
    const handleInputChange = (rowIndex, colIndex, value) => {
        setTableInputValues((prev) => {
            const newValues = { ...prev };
            const key = `${rowIndex}-${colIndex}`;
            newValues[key] = value;

            const observationFrom = dynamicHeadings?.observation_from || "master";

            // ✅ REAL-TIME VALIDATION BLOCK
            if (dynamicHeadings?.mainhading?.calibration_settings) {
                const calibrationSettings =
                    dynamicHeadings.mainhading.calibration_settings.filter(
                        (col) => col.checkbox === "yes",
                    );

                const observationSettings =
                    dynamicHeadings?.observation_heading?.observation_settings || [];
                const enabledObsSettings = observationSettings.filter(
                    (obs) => obs.checkbox === "yes",
                );

                let currentCol = 1;

                for (const setting of calibrationSettings) {
                    const fieldname = setting.fieldname;

                    if (observationFrom === "uuc" && fieldname === "uuc") {
                        const uucStartCol = currentCol;
                        const uucEndCol = currentCol + enabledObsSettings.length - 1;

                        if (colIndex >= uucStartCol && colIndex <= uucEndCol) {
                            const calibPointId =
                                observationRows.hiddenInputs?.calibrationPoints?.[rowIndex];
                            const leastCount = leastCountData[calibPointId];

                            if (leastCount !== undefined && leastCount !== null && leastCount > 0 && value.trim()) {
                                const numValue = parseFloat(value);

                                setObservationErrors((prevErrors) => {
                                    const newErrors = { ...prevErrors };
                                    delete newErrors[key];
                                    return newErrors;
                                });

                                const divisionResult = numValue / leastCount;
                                const isInteger = Number.isInteger(Math.round(divisionResult * 1000000) / 1000000);

                                if (!isInteger) {
                                    setObservationErrors((prevErrors) => ({
                                        ...prevErrors,
                                        [key]: `Please Enter Value divisible by ${leastCount}`,
                                    }));
                                }
                            }
                        }
                        currentCol += enabledObsSettings.length;
                    } else if (observationFrom === "master" && fieldname === "master") {
                        const masterStartCol = currentCol;
                        const masterEndCol = currentCol + enabledObsSettings.length - 1;

                        if (colIndex >= masterStartCol && colIndex <= masterEndCol) {
                            const calibPointId = observationRows.hiddenInputs?.calibrationPoints?.[rowIndex];
                            const leastCount = leastCountData[calibPointId];

                            if (leastCount !== undefined && leastCount !== null && leastCount > 0 && value.trim()) {
                                const numValue = parseFloat(value);

                                setObservationErrors((prevErrors) => {
                                    const newErrors = { ...prevErrors };
                                    delete newErrors[key];
                                    return newErrors;
                                });

                                const divisionResult = numValue / leastCount;
                                const isInteger = Number.isInteger(Math.round(divisionResult * 1000000) / 1000000);

                                if (!isInteger) {
                                    setObservationErrors((prevErrors) => ({
                                        ...prevErrors,
                                        [key]: `Please Enter Value divisible by ${leastCount}`,
                                    }));
                                }
                            }
                        }
                        currentCol += enabledObsSettings.length;

                    } else if (observationFrom === "separate") {
                        if (fieldname === "master" || fieldname === "uuc") {
                            const obsStartCol = currentCol;
                            const obsEndCol = currentCol + enabledObsSettings.length - 1;

                            if (colIndex >= obsStartCol && colIndex <= obsEndCol) {
                                const calibPointId =
                                    observationRows.hiddenInputs?.calibrationPoints?.[rowIndex];
                                const leastCount = leastCountData[calibPointId];

                                if (leastCount !== undefined && leastCount !== null && leastCount > 0 && value.trim()) {
                                    const numValue = parseFloat(value);

                                    setObservationErrors((prevErrors) => {
                                        const newErrors = { ...prevErrors };
                                        delete newErrors[key];
                                        return newErrors;
                                    });

                                    const divisionResult = numValue / leastCount;
                                    const isInteger = Number.isInteger(Math.round(divisionResult * 1000000) / 1000000);

                                    if (!isInteger) {
                                        setObservationErrors((prevErrors) => ({
                                            ...prevErrors,
                                            [key]: `Please Enter Value divisible by ${leastCount}`,
                                        }));
                                    }
                                }
                            }
                            currentCol += enabledObsSettings.length;
                        } else {
                            currentCol++;
                        }
                    } else {
                        currentCol++;
                    }
                }
            }

            // Get current row data
            const rowData = observationRows.rows[rowIndex].map((cell, idx) => {
                const inputKey = `${rowIndex}-${idx}`;
                return newValues[inputKey] ?? (cell?.toString() || "");
            });

            // Build column map
            const columnMap = {};
            let currentCol = 1;

            if (dynamicHeadings?.mainhading?.calibration_settings) {
                const calibrationSettings =
                    dynamicHeadings.mainhading.calibration_settings.filter(
                        (col) => col.checkbox === "yes",
                    );

                const observationSettings =
                    dynamicHeadings?.observation_heading?.observation_settings || [];
                const enabledObsSettings = observationSettings.filter(
                    (obs) => obs.checkbox === "yes",
                );

                calibrationSettings.forEach((setting) => {
                    const fieldname = setting.fieldname;

                    if (observationFrom === "master" && fieldname === "master") {
                        columnMap[fieldname] = {
                            startCol: currentCol,
                            endCol: currentCol + enabledObsSettings.length - 1,
                            count: enabledObsSettings.length,
                        };
                        currentCol += enabledObsSettings.length;
                    } else if (observationFrom === "uuc" && fieldname === "uuc") {
                        columnMap[fieldname] = {
                            startCol: currentCol,
                            endCol: currentCol + enabledObsSettings.length - 1,
                            count: enabledObsSettings.length,
                        };
                        currentCol += enabledObsSettings.length;
                    } else if (observationFrom === "separate") {
                        if (fieldname === "master" || fieldname === "uuc") {
                            columnMap[fieldname] = {
                                startCol: currentCol,
                                endCol: currentCol + enabledObsSettings.length - 1,
                                count: enabledObsSettings.length,
                            };
                            currentCol += enabledObsSettings.length;
                        } else {
                            columnMap[fieldname] = currentCol;
                            currentCol++;
                        }
                    } else {
                        columnMap[fieldname] = currentCol;
                        currentCol++;
                    }
                });
            }

            // ✅ Build variables for calculation (Similar to initial calculation logic)
            const variables = {};
            const point = observations[rowIndex];

            // A. Add Observation settings (Repeatable data from the table UI)
            if (dynamicHeadings?.observation_heading?.observation_settings) {
                const obsSettings = dynamicHeadings.observation_heading.observation_settings.filter(
                    (obs) => obs.checkbox === "yes"
                );

                if (observationFrom === "uuc" && columnMap["uuc"]) {
                    const uucInfo = columnMap["uuc"];
                    obsSettings.forEach((obsSetting, idx) => {
                        const varName = obsSetting.setvariable;
                        const colIdx = uucInfo.startCol + idx;
                        const cellValue = parseFloat(rowData[colIdx]) || 0;
                        variables[varName] = cellValue;
                    });
                }
                if (observationFrom === "master" && columnMap["master"]) {
                    const masterInfo = columnMap["master"];
                    obsSettings.forEach((obsSetting, idx) => {
                        const colIdx = masterInfo.startCol + idx;
                        variables[obsSetting.setvariable] = parseFloat(rowData[colIdx]) || 0;
                        variables[obsSetting.setvariable.replace('$', '')] = parseFloat(rowData[colIdx]) || 0;
                    });
                }
            }

            // B. Add Main Calibration Settings (Single values from variables or rowData)
            if (dynamicHeadings?.mainhading?.calibration_settings) {
                const calibrationSettings = dynamicHeadings.mainhading.calibration_settings.filter(
                    (col) => col.checkbox === "yes"
                );

                calibrationSettings.forEach((setting) => {
                    const { fieldname, fieldfrom, SetVariable } = setting;
                    let val = 0;

                    if (fieldfrom === "newcrfcalibrationpoint") {
                        val = parseFloat(point.variables?.[fieldname]) || 0;
                    } else if (fieldname !== "uuc" && fieldname !== "master") {
                        const colIdx = columnMap[fieldname];
                        if (typeof colIdx === 'number') {
                            val = parseFloat(rowData[colIdx]) || 0;
                        }
                    }

                    if (SetVariable) {
                        variables[SetVariable] = val;
                        variables[SetVariable.replace('$', '')] = val;
                    }
                });
            }

            // ✅ Add fallback master value
            const masterValue = parseFloat(point?.variables?.point || point?.point || point?.converted_point || "0");
            variables["$master"] = variables["$master"] || masterValue;
            variables["master"] = variables["master"] || masterValue;

            console.log("📊 Variables for real-time calculation:", variables);

            // ✅ Calculate all formula-based fields
            if (dynamicHeadings?.mainhading?.calibration_settings) {
                const calSettings = dynamicHeadings.mainhading.calibration_settings.filter(
                    (col) => col.checkbox === "yes"
                );

                calSettings.forEach((setting) => {
                    const { fieldname, formula, SetVariable } = setting;

                    if (fieldname === "master" || fieldname === "uuc") return;

                    if (formula && formula.trim() !== "") {
                        let calculatedValue = evaluateFormula(formula, variables);

                        if (calculatedValue !== "") {
                            if (fieldname === "average") {
                                const calibPointId = observationRows.hiddenInputs?.calibrationPoints?.[rowIndex];
                                const leastCount = leastCountData[calibPointId];
                                if (leastCount) {
                                    const decimalPlaces = getDecimalPlaces(leastCount);
                                    calculatedValue = parseFloat(calculatedValue.toFixed(decimalPlaces));
                                }
                            }

                            const colIdx = columnMap[fieldname];
                            if (typeof colIdx === 'number') {
                                newValues[`${rowIndex}-${colIdx}`] = calculatedValue;
                                if (SetVariable) {
                                    variables[SetVariable] = parseFloat(calculatedValue) || 0;
                                }
                            }
                        }
                    }
                });
            }

            return newValues;
        });
    };

    // ✅ Handle blur to save observations
    const handleObservationBlur = async (rowIndex, colIndex, value) => {
        const token = localStorage.getItem("authToken");
        const calibrationPointId = observationRows.hiddenInputs?.calibrationPoints?.[rowIndex];
        const observationFrom = dynamicHeadings?.observation_from || "master";

        if (!calibrationPointId) return;

        const rowData = observationRows.rows[rowIndex].map((cell, idx) => {
            const inputKey = `${rowIndex}-${idx}`;
            return tableInputValues[inputKey] ?? (cell?.toString() || "");
        });

        const payloads = [];

        // ✅ 1. Build variables for formula calculation
        const variables = {};
        const point = observations[rowIndex];

        if (dynamicHeadings?.observation_heading?.observation_settings) {
            const obsSettings = dynamicHeadings.observation_heading.observation_settings.filter(
                (obs) => obs.checkbox === "yes"
            );

            const calibrationSettings = dynamicHeadings.mainhading.calibration_settings.filter(
                (col) => col.checkbox === "yes"
            );

            let currentColPos = 1;

            calibrationSettings.forEach(setting => {
                const { fieldname, fieldfrom, SetVariable } = setting;

                if (fieldname === "uuc" && (observationFrom === "uuc" || observationFrom === "separate")) {
                    obsSettings.forEach((obsSetting, idx) => {
                        const varName = obsSetting.setvariable;
                        const cIdx = currentColPos + idx;
                        variables[varName] = parseFloat(rowData[cIdx]) || 0;
                    });
                    currentColPos += obsSettings.length;
                } else if (fieldname === "master" && (observationFrom === "master" || observationFrom === "separate")) {
                    obsSettings.forEach((obsSetting, idx) => {
                        const varName = obsSetting.setvariable;
                        const cIdx = currentColPos + idx;
                        variables[varName] = parseFloat(rowData[cIdx]) || 0;
                    });
                    currentColPos += obsSettings.length;
                } else {
                    let val = 0;
                    if (fieldfrom === "newcrfcalibrationpoint") {
                        val = parseFloat(point.variables?.[fieldname]) || 0;
                    } else {
                        val = parseFloat(rowData[currentColPos]) || 0;
                    }
                    if (SetVariable) {
                        variables[SetVariable] = val;
                        variables[SetVariable.replace('$', '')] = val;
                    }
                    currentColPos++;
                }
            });

            // Add fallback master
            const masterValFallback = parseFloat(point?.variables?.point || point?.point || "");
            variables["$master"] = variables["$master"] || masterValFallback;
            variables["master"] = variables["master"] || masterValFallback;

            // ✅ 2. Determine which field was edited and build payloads
            let checkColPos = 1;
            calibrationSettings.forEach((setting) => {
                const { fieldname } = setting;

                if (fieldname === "uuc" && (observationFrom === "uuc" || observationFrom === "separate")) {
                    for (let i = 0; i < obsSettings.length; i++) {
                        if (colIndex === checkColPos + i) {
                            payloads.push({
                                inwardid: inwardId,
                                instid: instId,
                                calibrationpoint: calibrationPointId,
                                type: "uuc",
                                repeatable: i.toString(),
                                value: value || "0",
                            });

                            // Add formula-based fields that depend on this
                            calibrationSettings.forEach(s => {
                                if (s.formula && s.formula.trim() !== "") {
                                    let calcVal = evaluateFormula(s.formula, variables);
                                    if (calcVal !== "") {
                                        if (s.fieldname === "average") {
                                            const lc = leastCountData[calibrationPointId];
                                            if (lc) calcVal = parseFloat(calcVal.toFixed(getDecimalPlaces(lc)));
                                        }
                                        payloads.push({
                                            inwardid: inwardId,
                                            instid: instId,
                                            calibrationpoint: calibrationPointId,
                                            type: s.fieldname,
                                            repeatable: "0",
                                            value: calcVal.toString(),
                                        });
                                    }
                                }
                            });
                        }
                    }
                    checkColPos += obsSettings.length;
                } else if (fieldname === "master" && (observationFrom === "master" || observationFrom === "separate")) {
                    for (let i = 0; i < obsSettings.length; i++) {
                        if (colIndex === checkColPos + i) {
                            payloads.push({
                                inwardid: inwardId,
                                instid: instId,
                                calibrationpoint: calibrationPointId,
                                type: "master",
                                repeatable: i.toString(),
                                value: value || "0",
                            });
                        }
                    }
                    checkColPos += obsSettings.length;
                } else {
                    if (colIndex === checkColPos) {
                        payloads.push({
                            inwardid: inwardId,
                            instid: instId,
                            calibrationpoint: calibrationPointId,
                            type: fieldname,
                            repeatable: "0",
                            value: value || "0",
                        });
                    }
                    checkColPos++;
                }
            });
        }

        console.log("📡 Saving payloads:", payloads);
        console.log("📊 Variables for calculation:", variables);

        try {
            // Save all payloads
            for (const payload of payloads) {
                await axios.post("/calibrationprocess/set-observations", payload, {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                });
            }

            console.log(`✅ Saved successfully!`);
            toast.success("Observation saved successfully!");

            // ✅ IMPORTANT: Refetch observations
            const headingsResponse = await fetchDynamicHeadings(suffix);
            if (headingsResponse?.data?.calibration_points) {
                setObservations(headingsResponse.data.calibration_points);
                console.log("🔄 Observations refreshed from API");
            }
        } catch (err) {
            console.error(`❌ Error saving:`, err);
            toast.error(err.response?.data?.message || "Failed to save observation");
        }
    };

    const handleBackToInwardList = () => {
        navigate(
            `/dashboards/calibration-process/inward-entry-lab?caliblocation=${caliblocation}&calibacc=${calibacc}`,
        );
    };

    const handleBackToPerformCalibration = () => {
        navigate(
            `/dashboards/calibration-process/inward-entry-lab/perform-calibration/${id}?caliblocation=${caliblocation}&calibacc=${calibacc}`,
        );
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const validateObservationFields = () => {
        let newErrors = {};

        if (!observationRows.rows || observationRows.rows.length === 0) {
            return true;
        }

        const observationFrom = dynamicHeadings?.observation_from || "master";
        const calibrationSettings =
            dynamicHeadings?.mainhading?.calibration_settings?.filter(
                (col) => col.checkbox === "yes",
            ) || [];

        const obsSettings =
            dynamicHeadings?.observation_heading?.observation_settings?.filter(
                (obs) => obs.checkbox === "yes",
            ) || [];

        observationRows.rows.forEach((row, rowIndex) => {
            let currentCol = 1;

            calibrationSettings.forEach((setting) => {
                const fieldname = setting.fieldname;

                if (observationFrom === "uuc" && fieldname === "uuc") {
                    const calibPointId =
                        observationRows.hiddenInputs?.calibrationPoints?.[rowIndex];
                    const leastCount = leastCountData[calibPointId];

                    for (let i = 0; i < obsSettings.length; i++) {
                        const colIndex = currentCol + i;
                        const key = `${rowIndex}-${colIndex}`;
                        const value =
                            tableInputValues[key] ?? (row[colIndex]?.toString() || "");

                        if (!value.trim()) {
                            newErrors[key] = "This field is required";
                        } else if (leastCount) {
                            const numValue = parseFloat(value);
                            if (isNaN(numValue)) {
                                newErrors[key] = "Please enter a valid number";
                            } else {
                                const divisionResult = numValue / leastCount;
                                const isInteger = Number.isInteger(Math.round(divisionResult * 1000000) / 1000000);

                                if (!isInteger) {
                                    newErrors[key] = `Please Enter Value divisible by ${leastCount}`;
                                }
                            }
                        }
                    }
                    currentCol += obsSettings.length;
                } else if (observationFrom === "master" && fieldname === "master") {
                    for (let i = 0; i < obsSettings.length; i++) {
                        const colIndex = currentCol + i;
                        const key = `${rowIndex}-${colIndex}`;
                        const value = tableInputValues[key] ?? (row[colIndex]?.toString() || "");

                        if (!value.trim()) {
                            newErrors[key] = "This field is required";
                        } else {
                            const calibPointId = observationRows.hiddenInputs?.calibrationPoints?.[rowIndex];
                            const leastCount = leastCountData[calibPointId];

                            if (leastCount) {
                                const numValue = parseFloat(value);
                                if (isNaN(numValue)) {
                                    newErrors[key] = "Please enter a valid number";
                                } else {
                                    const divisionResult = numValue / leastCount;
                                    const isInteger = Number.isInteger(Math.round(divisionResult * 1000000) / 1000000);

                                    if (!isInteger) {
                                        newErrors[key] = `Please Enter Value divisible by ${leastCount}`;
                                    }
                                }
                            }
                        }
                    }
                    currentCol += obsSettings.length;
                } else if (
                    observationFrom === "separate" &&
                    (fieldname === "uuc" || fieldname === "master")
                ) {
                    for (let i = 0; i < obsSettings.length; i++) {
                        const colIndex = currentCol + i;
                        const key = `${rowIndex}-${colIndex}`;
                        const value =
                            tableInputValues[key] ?? (row[colIndex]?.toString() || "");

                        if (!value.trim()) {
                            newErrors[key] = "This field is required";
                        } else if (fieldname === "uuc") {
                            const calibPointId =
                                observationRows.hiddenInputs?.calibrationPoints?.[rowIndex];
                            const leastCount = leastCountData[calibPointId];

                            if (leastCount) {
                                const numValue = parseFloat(value);
                                if (isNaN(numValue)) {
                                    newErrors[key] = "Please enter a valid number";
                                } else {
                                    const divisionResult = numValue / leastCount;
                                    const isInteger = Number.isInteger(Math.round(divisionResult * 1000000) / 1000000);

                                    if (!isInteger) {
                                        newErrors[key] = `Please Enter Value divisible by ${leastCount}`;
                                    }
                                }
                            }
                        }
                    }
                    currentCol += obsSettings.length;
                } else {
                    currentCol++;
                }
            });
        });

        setObservationErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateObservationFields()) {
            toast.error(
                "Please fill all required observation fields before submitting.",
            );
            const firstErrorKey = Object.keys(observationErrors)[0];
            if (firstErrorKey) {
                const [rowIndex, colIndex] = firstErrorKey.split("-");
                console.error("❌ First validation error at:", { rowIndex, colIndex });
            }
            return;
        }

        const token = localStorage.getItem("authToken");
        const calibrationPoints = [];
        const types = [];
        const repeatables = [];
        const values = [];
        const observationFrom = dynamicHeadings?.observation_from || "master";

        // Build column map
        const columnMap = {};
        let currentColIndex = 1;

        if (dynamicHeadings?.mainhading?.calibration_settings) {
            const calibrationSettings =
                dynamicHeadings.mainhading.calibration_settings.filter(
                    (col) => col.checkbox === "yes",
                );

            const obsSettings =
                dynamicHeadings?.observation_heading?.observation_settings?.filter(
                    (obs) => obs.checkbox === "yes",
                ) || [];

            calibrationSettings.forEach((setting) => {
                const fieldname = setting.fieldname;

                if (observationFrom === "master" && fieldname === "master") {
                    columnMap[fieldname] = {
                        type: "multi",
                        start: currentColIndex,
                        count: obsSettings.length,
                        repeatables: obsSettings.map((_, idx) => idx.toString()),
                    };
                    currentColIndex += obsSettings.length;
                } else if (observationFrom === "uuc" && fieldname === "uuc") {
                    columnMap[fieldname] = {
                        type: "multi",
                        start: currentColIndex,
                        count: obsSettings.length,
                        repeatables: obsSettings.map((_, idx) => idx.toString()),
                    };
                    currentColIndex += obsSettings.length;
                } else if (observationFrom === "separate") {
                    if (fieldname === "master" || fieldname === "uuc") {
                        columnMap[fieldname] = {
                            type: "multi",
                            start: currentColIndex,
                            count: obsSettings.length,
                            repeatables: obsSettings.map((_, idx) => idx.toString()),
                        };
                        currentColIndex += obsSettings.length;
                    } else {
                        columnMap[fieldname] = {
                            type: "single",
                            column: currentColIndex,
                            repeatable: "0",
                        };
                        currentColIndex++;
                    }
                } else {
                    columnMap[fieldname] = {
                        type: "single",
                        column: currentColIndex,
                        repeatable: "0",
                    };
                    currentColIndex++;
                }
            });
        }

        // ✅ Improved payload construction - Direct iteration over settings to avoid duplicate key issues
        observationRows.rows.forEach((row, rowIndex) => {
            const calibPointId = observationRows.hiddenInputs?.calibrationPoints?.[rowIndex] || "";
            if (!calibPointId) return;

            const calibrationSettings = dynamicHeadings?.mainhading?.calibration_settings?.filter(
                (col) => col.checkbox === "yes"
            ) || [];

            const obsSettings = dynamicHeadings?.observation_heading?.observation_settings?.filter(
                (obs) => obs.checkbox === "yes"
            ) || [];

            let currentPayloadColIndex = 1;

            calibrationSettings.forEach((setting) => {
                const { fieldname } = setting;

                if (fieldname === "uuc" && (observationFrom === "uuc" || observationFrom === "separate")) {
                    // Multi-column UUC
                    for (let i = 0; i < obsSettings.length; i++) {
                        const key = `${rowIndex}-${currentPayloadColIndex + i}`;
                        const value = tableInputValues[key] ?? row[currentPayloadColIndex + i] ?? "";

                        calibrationPoints.push(calibPointId);
                        types.push(fieldname);
                        repeatables.push(i.toString());
                        values.push(value.toString());
                    }
                    currentPayloadColIndex += obsSettings.length;
                } else if (fieldname === "master" && (observationFrom === "master" || observationFrom === "separate")) {
                    // Multi-column Master
                    for (let i = 0; i < obsSettings.length; i++) {
                        const key = `${rowIndex}-${currentPayloadColIndex + i}`;
                        const value = tableInputValues[key] ?? row[currentPayloadColIndex + i] ?? "";

                        calibrationPoints.push(calibPointId);
                        types.push(fieldname);
                        repeatables.push(i.toString());
                        values.push(value.toString());
                    }
                    currentPayloadColIndex += obsSettings.length;
                } else {
                    // Single column
                    const key = `${rowIndex}-${currentPayloadColIndex}`;
                    const value = tableInputValues[key] ?? row[currentPayloadColIndex] ?? "";

                    calibrationPoints.push(calibPointId);
                    types.push(fieldname);
                    repeatables.push("0");
                    values.push(value.toString());

                    currentPayloadColIndex++;
                }
            });
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

        console.log("📤 Step 3 Payload for submission:", payloadStep3);
        console.log("📊 Table Input Values used:", tableInputValues);

        try {
            const response = await axios.post(
                "/calibrationprocess/insert-calibration-step3",
                payloadStep3,
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                },
            );

            console.log("✅ Step 3 saved successfully:", response.data);
            toast.success("All data submitted successfully!");

            setTimeout(() => {
                navigate(
                    `/dashboards/calibration-process/inward-entry-lab/perform-calibration/${id}?caliblocation=${caliblocation}&calibacc=${calibacc}`,
                );
            }, 1000);
        } catch (error) {
            console.error("❌ Network Error:", error);
            toast.error(
                error.response?.data?.message ||
                "Something went wrong while submitting",
            );
        }
    };

    useEffect(() => {
        console.log("🔍 DEBUG - Current State:", {
            observationFrom: dynamicHeadings?.observation_heading?.observation_from,
            dynamicHeadings: dynamicHeadings,
            tableStructure: tableStructure,
            observationRows: observationRows,
            observationsCount: observations.length,
            observationSettings:
                dynamicHeadings?.observation_heading?.observation_settings,
        });
    }, [dynamicHeadings, tableStructure, observationRows, observations]);

    if (loading) {
        return (
            <Page title="CalibrateStep3">
                <div className="min-h-screen bg-gray-50 p-4 dark:bg-gray-900">
                    <div className="mx-auto max-w-7xl">
                        <div className="rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800">
                            <div className="animate-pulse">
                                <div className="mb-2 h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-700"></div>
                                <div className="h-4 w-1/2 rounded bg-gray-200 dark:bg-gray-700"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </Page>
        );
    }

    return (
        <Page title="CalibrateStep3">
            <div className="min-h-screen bg-gray-50 p-4 dark:bg-gray-900">
                <div className="mx-auto max-w-7xl">
                    <div className="mb-4 rounded-lg bg-white shadow-sm dark:bg-gray-800">
                        <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
                            <h1 className="text-xl font-medium text-gray-800 dark:text-white">
                                Fill Dates
                            </h1>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={handleBackToInwardList}
                                    className="rounded-md bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-fuchsia-500"
                                >
                                    ← Back to Inward Entry List
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={handleBackToPerformCalibration}
                                    className="rounded-md bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-fuchsia-500"
                                >
                                    ← Back to Perform Calibration
                                </Button>
                            </div>
                        </div>

                        <InstrumentInfo
                            instrument={apiData?.instrument}
                            inwardEntry={apiData?.inwardEntry}
                            caliblocation={caliblocation}
                        />

                        <form onSubmit={handleSubmit} className="p-6">
                            <h2 className="mb-4 text-lg font-medium text-gray-800 dark:text-white">
                                Masters
                            </h2>
                            <MastersList masters={apiData?.masters || []} />

                            <div className="mb-6">
                                <h2 className="text-md mb-2 font-medium text-gray-800 dark:text-white">
                                    Support masters
                                </h2>
                                <SupportMastersList supportMasters={supportMasters} />
                            </div>

                            {/* Dynamic Observation Table */}
                            {tableStructure && observationRows.rows.length > 0 && (
                                <ObservationTable
                                    observationTemplate={apiData?.observationTemplate}
                                    selectedTableData={{
                                        id: apiData?.observationTemplate,
                                        staticRows: observationRows.rows,
                                        hiddenInputs: observationRows.hiddenInputs,
                                    }}
                                    tableStructure={tableStructure}
                                    tableInputValues={tableInputValues}
                                    observationErrors={observationErrors}
                                    handleInputChange={handleInputChange}
                                    handleObservationBlur={handleObservationBlur}
                                    handleRowSave={() => { }}
                                    unitsList={[]}
                                    dynamicHeadings={dynamicHeadings}
                                    suffix={suffix}
                                    renderThermalCoefficientSection={
                                        renderThermalCoefficientSection
                                    }
                                    setObservationErrors={setObservationErrors}
                                    observations={observations}
                                />
                            )}

                            <DateNotesForm
                                formData={formData}
                                handleFormChange={handleFormChange}
                            />
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                                        Temperature End (°C) <span className="text-red-500">*</span>
                                        :
                                    </label>
                                    <input
                                        type="text"
                                        name="tempend"
                                        value={formData.tempend}
                                        onChange={handleFormChange}
                                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-600 dark:text-white"
                                        placeholder="Enter temperature range"
                                    />
                                    {errors.tempend && (
                                        <p className="mt-1 text-xs text-red-500">
                                            {errors.tempend}
                                        </p>
                                    )}
                                    {!errors.tempend && !formData.tempend && (
                                        <p className="mt-1 text-xs text-red-500">
                                            This field is required
                                        </p>
                                    )}
                                    {temperatureRange && (
                                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                            Range:{" "}
                                            {temperatureRange.min
                                                ? `${temperatureRange.min} - ${temperatureRange.max}`
                                                : temperatureRange.value || "N/A"}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
                                        Humidity End (%RH) <span className="text-red-500">*</span>:
                                    </label>
                                    <input
                                        type="text"
                                        name="humiend"
                                        value={formData.humiend}
                                        onChange={handleFormChange}
                                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-600 dark:text-white"
                                        placeholder="Enter humidity range"
                                    />
                                    {errors.humiend && (
                                        <p className="mt-1 text-xs text-red-500">
                                            {errors.humiend}
                                        </p>
                                    )}
                                    {!errors.humiend && !formData.humiend && (
                                        <p className="mt-1 text-xs text-red-500">
                                            This field is required
                                        </p>
                                    )}
                                    {humidityRange && (
                                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                            Range:{" "}
                                            {humidityRange.min
                                                ? `${humidityRange.min} - ${humidityRange.max}`
                                                : humidityRange.value || "N/A"}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <Notes formData={formData} handleFormChange={handleFormChange} />

                            <div className="mt-8 mb-4 flex justify-end">
                                <Button
                                    type="submit"
                                    className="rounded bg-green-500 px-8 py-2 font-medium text-white transition-colors hover:bg-green-600"
                                >
                                    Submit
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </Page>
    );
};

export default CalibrateStep3;