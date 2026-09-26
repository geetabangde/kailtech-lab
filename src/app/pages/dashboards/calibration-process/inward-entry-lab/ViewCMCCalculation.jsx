import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "utils/axios";
import { toast } from "sonner";
import { Button } from "components/ui";
import { UNCERTAINTY_LAYOUTS } from "../../calibration-operations/instrument-list/components/UncertaintyLayouts";
import { CmcTableRenderer, safeGetArrayValue, mapTswoiCmcRows, mapTswiCmcRows, mapUcCmcRows, mapSutmCmcRows } from "./ViewCMCObservation";

const SUFFIX_NAMES = {
  ctg: "Coating Thickness Gauge",
  dpg: "Digital Pressure Gauge",
  mm: "Multimeter",
  wt: "Weight",
  tg: "Thread Gauge",
  pdg: "Plain / Dial Gauge",
  wg: "Welding Gauge",
  odfm: "Optical Dimension Measuring Machine",
  es: "Medical/Electrical Safety",
  mt: "Measuring Tape",
  it: "Internal Thermometer",
  fg: "Feeler Gauge",
  hg: "Height Gauge",
  avg: "Analogue Vacuum Gauge",
  msr: "Micrometer Setting Rod",
  mg: "Magnehelic Gauge",
  exm: "External Micrometer",
  rtdwi: "RTD Sensor With Indicator",
  tswoi: "Thermocouple Sensor Without Indicator",
  tswi: "Thermocouple Sensor With Indicator",
  sutm: "Speed of Universal Testing Machine",
  ppg: "Precision Pressure Gauge",
  gtm: "Glass Thermometer",
  dg: "Digital Dial Gauge",
  dw: "Dead Weight Tester",
  wb: "Weighing Balance",
  tm: "Tachometer",
  utm: "Universal Testing Machine",
  autm: "Automatic Universal Testing Machine",
  volnl: "Volumetric (Neck Level)",
  vol: "Volumetric",
  vht: "Hardness Tester",
  wbn: "Weighing Balance",
  observationuc: "Universal Calibrator",
  uc: "Universal Calibrator",
  biomedical: "Biomedical",
  cent: "Centrifuge",
  th: "Thermo-Hygrometer",
  ts: "Test Sieve",
  sw: "Stop Watch"
};

export default function ViewCMCCalculation() {
  const { id: inwardId, itemId: instId } = useParams();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(window.location.search);
  const caliblocation = searchParams.get("caliblocation") || "Lab";
  const calibacc = searchParams.get("calibacc") || "Nabl";

  const [data, setData] = useState([]);
  const [electricSafetyData, setElectricSafetyData] = useState([]);
  const [suffix, setSuffix] = useState("");
  const [loading, setLoading] = useState(true);
  const [customLayout, setCustomLayout] = useState(null);

  useEffect(() => {
    const fetchUncertainty = async () => {
      try {
        const response = await axios.get(
          `/calibrationprocess/get-uncertainty?inwardid=${inwardId}&instid=${instId}&caliblocation=${caliblocation}&calibacc=${calibacc}`
        );

        if (response.data?.status === true) {
          let instrumentSuffix = (
            response.data.data?.listInstrument?.suffix ||
            response.data.data?.listInstrument?.uncertaintytable ||
            response.data.data?.instrument?.suffix ||
            ""
          ).toLowerCase();

          // If suffix is custom, numeric/date, or empty, fallback to the base uncertainty table type
          if (
            (!instrumentSuffix || instrumentSuffix === "custom" || /^\d+$/.test(instrumentSuffix)) &&
            response.data.data?.listInstrument?.uncertaintytable
          ) {
            instrumentSuffix = response.data.data.listInstrument.uncertaintytable.toLowerCase();
          }

          // [PATCH] Force Bevel Protector (instid: 113) to use the VC (Vernier Caliper) template
          if (String(instId) === "113" || response.data.data?.listInstrument?.instid == 113 || response.data.data?.instrument?.instid == 113) {
            instrumentSuffix = "vc";
          }

          setSuffix(instrumentSuffix);

          // Fetch Custom Layout
          try {
            const actualInstrumentId = response.data.data?.listInstrument?.id || instId;
            console.log("Fetching layout for ID:", actualInstrumentId);

            const layoutResponse = await axios.get(
              `/observationlayout/get-formate-layout/${actualInstrumentId}`
            );

            if (
              layoutResponse.data?.success &&
              layoutResponse.data?.data?.columns &&
              layoutResponse.data.data.columns.length > 0 &&
              layoutResponse.data.data.columns[0].uncertainty_key
            ) {
              const apiLayoutData = layoutResponse.data.data.columns[0];
              let parsedCols = JSON.parse(apiLayoutData.uncertainty_key);

              const defaultLayout = UNCERTAINTY_LAYOUTS[instrumentSuffix]
                ? UNCERTAINTY_LAYOUTS[instrumentSuffix].map((col, idx) => ({
                  key: col.key || `col_${idx}`,
                  originalIndex: idx,
                  headerName: col.header
                }))
                : [];

              // Transform to match our internal layout structure
              let customCols = parsedCols.map(col => {
                const defaultCol = defaultLayout.find(d =>
                  d.key === col.column_key ||
                  `col_${d.originalIndex}` === col.column_key ||
                  (col.column_key.startsWith("col_dyn_") && d.headerName === col.display_name)
                );
                return {
                  key: col.column_key,
                  originalIndex: defaultCol ? defaultCol.originalIndex : -1,
                  headerName: col.display_name,
                  group: col.group_name,
                  isDefault: !!defaultCol
                };
              });

              // Dynamically adjust numbered columns (1, 2, 3...) to match observation_repeat
              const obsRepeat = parseInt(apiLayoutData.observation_repeat) || 5;
              const adjustNumberedColumns = (cols, repeatCount) => {
                const newCols = [];
                let firstNumIdx = -1;
                let numberColGroup = null;

                for (let i = 0; i < cols.length; i++) {
                  if (cols[i].headerName === "1") {
                    firstNumIdx = i;
                    numberColGroup = cols[i].group;
                    break;
                  }
                }

                if (firstNumIdx === -1) return cols;

                let currentNum = 1;
                let lastNumberColIndex = firstNumIdx;
                for (let i = firstNumIdx; i < cols.length; i++) {
                  if (cols[i].headerName === String(currentNum)) {
                    lastNumberColIndex = i;
                    currentNum++;
                  } else {
                    break;
                  }
                }

                const existingNumCount = currentNum - 1;

                for (let j = 0; j < cols.length; j++) {
                  if (j === firstNumIdx) {
                    for (let k = 1; k <= repeatCount; k++) {
                      if (k <= existingNumCount) {
                        newCols.push(cols[firstNumIdx + k - 1]);
                      } else {
                        newCols.push({
                          key: `col_dyn_${Date.now()}_${k}`,
                          originalIndex: -1,
                          headerName: String(k),
                          group: numberColGroup
                        });
                      }
                    }
                    j = lastNumberColIndex;
                  } else {
                    newCols.push(cols[j]);
                  }
                }
                return newCols;
              };

              customCols = adjustNumberedColumns(customCols, obsRepeat);
              setCustomLayout({ columns: customCols });
            } else {
              setCustomLayout(null);
            }
          } catch (err) {
            console.error("Failed to fetch format layout via new API", err);
            setCustomLayout(null);
          }

          console.log("Instrument Suffix:", instrumentSuffix);

          // Handle different data structures based on suffix
          let apiData = [];

          if (instrumentSuffix === "biomedical") {
            // Load both electric safety and performance test data
            const electricSafety = response.data.data?.uncertainty?.original?.electric_safety || [];
            const performanceTest = response.data.data?.uncertainty?.original?.performance_test || [];

            const processBiomedicalItem = (item) => {
              const readings = safeGetArrayValue(item.readings);

              return {
                srNo: item.sr_no,
                unitType: item.unit_type,
                mode: item.mode,
                values: readings,
                unitDesc: item.unit_desc,
                calibrationPoint: item.calibration_point,
                average: item.average ?? "",
                stdDeviation: item.std_deviation,
                typeA: item.type_a,
                accuracyCalibrator: item.accuracy_calibrator_value,
                uncertaintyMaster: item.uncertainty_master_percent,
                leastCount: item.least_count,
                combinedUnc: item.combined_uncertainty,
                dof: item.degree_of_freedom,
                coverageFactor: item.coverage_factor,
                expandedUncValue: item.expanded_uncertainty_value,
                expandedUncPercent: item.expanded_uncertainty_percent,
                cmcTaken: item.cmc_taken,
                cmcScope: item.cmc_scope,
              };
            };

            // Process electric safety data
            if (electricSafety.length > 0) {
              const mappedElectricData = electricSafety.map(processBiomedicalItem);
              setElectricSafetyData(mappedElectricData);
            }

            const mappedData = performanceTest.map(processBiomedicalItem);
            setData(mappedData);
          } else if (instrumentSuffix === "mm") {
            // For multimeter, data is in nested structure
            apiData = response.data.data?.uncertainty?.original?.data || [];
          } else if (instrumentSuffix === "wb" || instrumentSuffix === "wbn" || instrumentSuffix === "dw") {
            // For Weighing Balance and Dead Weight Tester, data is inside uncertainty.original.data or uncertainty.data
            apiData =
              response.data.data?.uncertainty?.original?.data ||
              response.data.data?.uncertainty?.data ||
              (Array.isArray(response.data.data?.uncertainty) ? response.data.data.uncertainty : []);
          } else if (instrumentSuffix === "mt" || instrumentSuffix === "fg") {
            // For MT and FG, data is inside uncertainty.data array
            apiData = response.data.data?.uncertainty?.data || [];
          } else if (instrumentSuffix === "it" || instrumentSuffix === "hg" || instrumentSuffix === "avg" || instrumentSuffix === "msr" || instrumentSuffix === "mg" || instrumentSuffix === "exm" || instrumentSuffix === "rtdwi" || instrumentSuffix === "ppg" || instrumentSuffix === "gtm" || instrumentSuffix === "dg" || instrumentSuffix === "vc" || instrumentSuffix === "th" || instrumentSuffix === "ts") {
            // For IT, HG, AVG, MSR, MG, EXM, RTDWI, PPG, GTM, DG, VC, TH, and TS, data is direct array
            apiData = response.data.data?.uncertainty || [];
          } else if (instrumentSuffix === "sw") {
            // For SW (Stop Watch), data is inside uncertainty.original.data
            apiData = response.data.data?.uncertainty?.original?.data || response.data.data?.uncertainty?.data || [];
          } else if (instrumentSuffix === "cent") {
            // For Centrifuge, data is inside uncertainty.data array
            apiData = response.data.data?.uncertainty?.data || [];
          } else if (instrumentSuffix === "utm") {
            // For UTM, uncertainty.original.data is an object; the rows live in calibration_points
            apiData =
              response.data.data?.uncertainty?.original?.data?.calibration_points ||
              response.data.data?.uncertainty?.data?.calibration_points ||
              (Array.isArray(response.data.data?.uncertainty?.original?.data)
                ? response.data.data.uncertainty.original.data
                : []);
          } else {
            // For other instruments, fallback to uncertainty.original.data or uncertainty direct
            apiData =
              response.data.data?.uncertainty?.original?.data ||
              response.data.data?.uncertainty?.data ||
              (Array.isArray(response.data.data?.uncertainty) ? response.data.data.uncertainty : []);
          }


          if (instrumentSuffix === "biomedical") {
            // Already handled above for Biomedical (both electric safety & performance test)
          } else if (instrumentSuffix === "ctg") {
            const mappedData = apiData.map((item) => ({
              srNo: item.sr_no,
              typeOfMeasurement: item.type_of_measurement,
              values: item.uuc || [item.uuc_0, item.uuc_1, item.uuc_2, item.uuc_3, item.uuc_4],
              unit: item.unit,
              calibrationPoint: item.calibration_point,
              average: item.average_uuc,
              stdDeviation: item.std_deviation,
              typeA: item.type_a,
              uncertaintyOfMaster: item.master_uncertainty,
              leastCount: item.least_count_uuc,
              thermalCoeffMaster: item.thermal_coeff_master,
              thermalCoeffUuc: item.thermal_coeff_uuc,
              uncTempDevice: item.uncertainty_temp_device,
              stdUncTher20: item.std_unc_thermal_coeff,
              stdUncDiff: item.std_unc_diff_temp,
              uncError: item.uncertainty_error,
              combinedUnc: item.combined_uncertainty,
              dof: item.degrees_of_freedom,
              coverageFactor: item.coverage_factor,
              expandedUnc: item.expanded_uncertainty,
              cmc: item.cmc_uncertainty,
            }));
            setData(mappedData);
          } else if (instrumentSuffix === "vc") {
            // For Vernier Caliper / Bevel Protector
            const mappedData = apiData.map((item) => ({
              srNo: item.sr_no,
              typeOfMeasurement: item.type_of_measurement || item.matrixtype,
              values: item.uuc || [item.uuc_0, item.uuc_1, item.uuc_2, item.uuc_3, item.uuc_4],
              unit: item.unit,
              calibrationPoint: item.calibration_point,
              average: item.average_uuc,
              stdDeviation: item.std_deviation,
              typeA: item.type_a,
              uncertaintyMaster: item.uncertainty_master || item.uncertainty_slip_gauge,
              leastCountUuc: item.least_count_uuc,
              thermalCoeffMaster: item.thermal_coefficient_master,
              thermalCoeffUuc: item.thermal_coefficient_uuc,
              uncTempDevice: item.uncertainty_temperature_device,
              stdUncTher20: item.uncertainty_thermal_coefficient_20,
              stdUncDiff: item.uncertainty_temperature_difference,
              uncParallelism: item.uncertainty_parallelism,
              uncError: item.uncertainty_master_error,
              combinedUnc: item.combined_uncertainty,
              dof: item.degree_of_freedom,
              coverageFactor: item.coverage_factor,
              expandedUnc: item.expanded_uncertainty,
              cmc: item.cmc_taken,
              cmc_scope: item.cmc_scope
            }));
            setData(mappedData);
          } else if (instrumentSuffix === "exm") {
            // For External Micrometer
            const mappedData = apiData.map((item) => ({
              srNo: item.sr_no,
              typeOfMeasurement: item.type_of_measurement,
              values: item.uuc || [item.uuc_0, item.uuc_1, item.uuc_2, item.uuc_3, item.uuc_4],
              unit: item.unit,
              calibrationPoint: item.calibration_point,
              average: item.average_uuc,
              stdDeviation: item.std_deviation,
              typeA: item.type_a,
              uncertaintySlipGauge: item.uncertainty_slip_gauge,
              leastCountUuc: item.least_count_uuc,
              thermalCoeffMaster: item.thermal_coefficient_master,
              thermalCoeffUuc: item.thermal_coefficient_uuc,
              uncTempDevice: item.uncertainty_temperature_device,
              stdUncTher20: item.uncertainty_thermal_coefficient_20,
              stdUncDiff: item.uncertainty_temperature_difference,
              uncParallelism: item.uncertainty_parallelism,
              uncError: item.uncertainty_master_error,
              combinedUnc: item.combined_uncertainty,
              dof: item.degree_of_freedom,
              coverageFactor: item.coverage_factor,
              expandedUnc: item.expanded_uncertainty,
              cmc: item.cmc_taken,
            }));
            setData(mappedData);
          } else if (instrumentSuffix === "dg") {
            // For Digital Dial Gauge
            const mappedData = apiData.map((item) => {
              const testpoint = parseFloat(item.calibration_point);
              let slipaccuracy = 0.12;
              if (testpoint >= 0.5 && testpoint <= 10) {
                slipaccuracy = 0.12;
              } else if (testpoint > 10 && testpoint <= 25) {
                slipaccuracy = 0.14;
              } else if (testpoint > 25 && testpoint <= 50) {
                slipaccuracy = 0.20;
              } else if (testpoint > 50 && testpoint <= 75) {
                slipaccuracy = 0.25;
              } else if (testpoint > 75 && testpoint <= 100) {
                slipaccuracy = 0.30;
              } else if (testpoint > 100) {
                slipaccuracy = 0.30;
              } else if (testpoint < 0.5) {
                slipaccuracy = 0.12;
              }

              return {
                srNo: item.sr_no,
                readingInc1: item.reading_inc_1,
                readingDec2: item.reading_dec_2,
                readingInc3: item.reading_inc_3,
                readingDec4: item.reading_dec_4,
                errorInc: item.error_inc,
                errorDec: item.error_dec,
                hysterisis: item.hysterisis,
                unit: item.unit,
                calibrationPoint: item.calibration_point,
                average: item.average,
                stdDeviation: item.std_deviation,
                typeA: item.type_a,
                stdDeviationMaster: item.std_deviation_master,
                typeAMaster: item.type_a_master,
                uncertaintySlipGauge: item.uncertainty_slip_gauge,
                accuracySlipGauge: item.accuracy_slip_gauge !== undefined ? item.accuracy_slip_gauge : slipaccuracy,
                flatnessComparatorStand: item.flatness_comparator_stand_ub3 || item.flatness_comparator_stand,
                leastCountUuc: item.least_count_uuc,
                thermalCoeffMaster: item.thermal_coefficient_master,
                thermalCoeffUuc: item.thermal_coefficient_uuc,
                uncTempDevice: item.uncertainty_temperature_device,
                stdUncTher20: item.uncertainty_thermal_coefficient_20,
                stdUncDiff: item.uncertainty_temperature_difference,
                uncError: item.uncertainty_master_error,
                combinedUnc: item.combined_uncertainty,
                dof: item.degree_of_freedom,
                coverageFactor: item.coverage_factor,
                expandedUnc: item.expanded_uncertainty,
                cmcTaken: item.cmc_taken,
                cmcScope: item.cmc_scope,
              };
            });
            setData(mappedData);
          } else if (instrumentSuffix === "gtm") {
            // For Glass Thermometer - similar to RTDWI structure
            const mappedData = apiData.map((item) => ({
              srNo: item.sr_no,
              values: item.uuc || [item.uuc_0, item.uuc_1, item.uuc_2, item.uuc_3, item.uuc_4],
              unit: item.unit,
              calibrationPoint: item.calibration_point,
              average: item.average_uuc,
              stdDeviation: item.std_deviation,
              typeA: item.type_a,
              uncertaintyMaster1: item.uncertainty_master_1_sensor,
              uncertaintyMaster2Value: item.uncertainty_master_2_dmm_value,
              sensitivityCoefficient: item.sensitivity_coefficient,
              uncertaintyMaster2Celsius: item.uncertainty_master_2_temperature,
              stabilityBath: item.stability_bath,
              uniformityBath: item.uniformity_bath,
              driftMaster: item.drift_master,
              leastCountUuc: item.least_count_uuc,
              combinedUncertainty: item.combined_uncertainty,
              degreeOfFreedom: item.degree_of_freedom,
              coverageFactor: item.coverage_factor,
              expandedUncertaintyValue: item.expanded_uncertainty,
              cmcTaken: item.cmc_taken,
            }));
            setData(mappedData);
          } else if (instrumentSuffix === "tswoi") {
            // TSWOI formulas (Type A x sensitivity, master-2 scaled by UUC corrected average)
            setData(mapTswoiCmcRows(apiData));
          } else if (instrumentSuffix === "tswi") {
            // TSWI formulas (Type A without sensitivity, master-2 scaled by master corrected average, k = 2)
            setData(mapTswiCmcRows(apiData));
          } else if (instrumentSuffix === "sutm") {
            // SUTM formulas (speed from displacement/time, linear scale + stop watch master uncertainty)
            setData(mapSutmCmcRows(apiData));
          } else if (instrumentSuffix === "rtdwi") {
            const mappedData = apiData.map((item) => {
              const testpoint = parseFloat(item.calibration_point || item.point || 0);
              const uucValues = item.uuc || [item.uuc_0, item.uuc_1, item.uuc_2, item.uuc_3, item.uuc_4];

              const averageuuc = parseFloat(item.average_uuc || item.averageuuc || 0);
              // Fallbacks for averagemaster if it comes with different keys
              const averagemaster = parseFloat(item.s_average_master || item.saveragemaster || item.averagemaster || item.average_master || 0);

              const repeatability = parseFloat(item.std_deviation || item.repeatability || 0);
              const sensitivitycoefient = parseFloat(item.sensitivity_coefficient || item.sensitivitycoefficient || 0);

              const masterunc = parseFloat(item.uncertainty_master_1_sensor || item.masterunc || item.master_uncertainty || 0);
              // Get raw CMC for master 2, then apply the formula
              const rawMasterUnc2 = parseFloat(item.raw_masterunc2 || item.uncertainty_master_2_dmm_value || item.masterunc2 || 0);

              const typea = (repeatability / Math.sqrt(5));

              const stability = parseFloat(item.stability_bath || item.stability || 0);
              const uniformity = parseFloat(item.uniformity_bath || item.uniformity || 0);

              const drift = 0.1 * masterunc;

              const masterunc2 = (rawMasterUnc2 * averagemaster) / 100;
              const masterunc2inc = masterunc2 * sensitivitycoefient;

              const leastcount = parseFloat(item.least_count_uuc || item.least_count || item.leastcount || 0);

              const comuncer = Math.sqrt(
                Math.pow(typea, 2) +
                Math.pow((masterunc / 2), 2) +
                Math.pow((masterunc2inc / 2), 2) +
                Math.pow((stability / Math.sqrt(3)), 2) +
                Math.pow((uniformity / Math.sqrt(3)), 2) +
                Math.pow((drift / Math.sqrt(3)), 2) +
                Math.pow((leastcount / 2 / Math.sqrt(3)), 2)
              );

              let dof = "-";
              if (repeatability !== 0 && typea > 0) {
                const com4 = Math.pow(comuncer, 4);
                const typeap4 = Math.pow(typea, 4);
                dof = (com4 / typeap4) * 4;
              }

              let coveragefactor = 2;
              if (dof !== "-") {
                if (dof > 30) coveragefactor = 2;
                else if (dof > 25) coveragefactor = 2.09;
                else if (dof > 20) coveragefactor = 2.11;
                else if (dof > 19) coveragefactor = 2.13;
                else if (dof > 18) coveragefactor = 2.14;
                else if (dof > 17) coveragefactor = 2.15;
                else if (dof > 16) coveragefactor = 2.16;
                else if (dof > 15) coveragefactor = 2.17;
                else if (dof > 14) coveragefactor = 2.18;
                else if (dof > 13) coveragefactor = 2.20;
                else if (dof > 12) coveragefactor = 2.21;
                else if (dof > 11) coveragefactor = 2.23;
                else if (dof > 10) coveragefactor = 2.25;
                else if (dof > 9) coveragefactor = 2.28;
                else if (dof > 8) coveragefactor = 2.32;
                else if (dof > 7) coveragefactor = 2.37;
                else if (dof > 6) coveragefactor = 2.43;
                else if (dof > 5) coveragefactor = 2.52;
                else if (dof > 4) coveragefactor = 2.65;
                else if (dof > 3) coveragefactor = 2.87;
                else if (dof > 2) coveragefactor = 3.31;
                else if (dof > 1) coveragefactor = 4.53;
                else if (dof >= 0) coveragefactor = 13.97;
              }

              const expandeduncertainty = comuncer * coveragefactor;

              const tempcmc = parseFloat(item.cmcscope || item.cmc_scope || 0);
              const cmcTaken = (tempcmc > expandeduncertainty) ? tempcmc : expandeduncertainty;

              return {
                srNo: item.sr_no,
                values: uucValues,
                unit: item.unit,
                calibrationPoint: testpoint,
                average: averageuuc,
                stdDeviation: repeatability,
                typeA: typea,
                uncertaintyMaster1: masterunc,
                uncertaintyMaster2Value: masterunc2,
                sensitivityCoefficient: sensitivitycoefient,
                uncertaintyMaster2Celsius: masterunc2inc,
                stabilityBath: stability,
                uniformityBath: uniformity,
                driftMaster: drift,
                leastCountUuc: leastcount,
                combinedUncertainty: comuncer,
                degreeOfFreedom: dof,
                coverageFactor: coveragefactor,
                expandedUncertaintyValue: expandeduncertainty,
                cmcTaken: cmcTaken,
              };
            });
            setData(mappedData);
          } else if (instrumentSuffix === "msr") {
            // For Micrometer Setting Rod
            const mappedData = apiData.map((item) => ({
              srNo: item.sr_no,
              typeOfMeasurement: item.type_of_measurement,
              values: item.master || [item.master_0, item.master_1, item.master_2, item.master_3, item.master_4],
              unit: item.unit,
              calibrationPoint: item.calibration_point,
              average: item.average,
              stdDeviation: item.std_deviation,
              typeA: item.type_a,
              uncertaintySlipGauge: item.uncertainty_of_slip_gauge,
              uncertaintyDialGauge: item.uncertainty_of_dial_gauge,
              flatnessComparatorStand: item.flatness_of_comparator_stand,
              leastCountMaster: item.least_count_of_master,
              thermalCoeffMaster: item.thermal_coefficient_master,
              thermalCoeffUuc: item.thermal_coefficient_uuc,
              uncTempDevice: item.uncertainty_temperature_device,
              stdUncTher20: item.uncertainty_thermal_coefficient_20,
              stdUncDiff: item.uncertainty_temperature_difference,
              uncError: item.uncertainty_master_error,
              combinedUnc: item.combined_uncertainty,
              dof: item.degree_of_freedom,
              coverageFactor: item.coverage_factor,
              expandedUnc: item.expanded_uncertainty,
              cmc: item.cmc_taken,
            }));
            setData(mappedData);
          } else if (instrumentSuffix === "avg") {
            // For Analogue Vacuum Gauge
            const mappedData = apiData.data?.map((item) => ({
              srNo: item.sr_no,
              setPressure: item.set_pressure_uuc,
              masterObservationM1: item.master_observation_m1,
              masterObservationM2: item.master_observation_m2,
              meanMaster: item.mean_master,
              error: item.error,
              maxZeroError: item.max_zero_error,
              hysterisis: item.hysterisis,
              repeatability: item.repeatability,
              leastCountUuc: item.least_count_uuc,
              uncertaintyMaster: item.uncertainty_master,
              combinedUncertainty: item.combined_uncertainty,
              degreeOfFreedom: item.degree_of_freedom,
              coverageFactor: item.coverage_factor,
              expandedUncertainty: item.expanded_uncertainty,
              cmcTaken: item.cmc_taken,
              cmcScope: item.cmc_scope,
              masterUnit: item.units?.master_unit || "bar"
            })) || [];
            setData(mappedData);
          } else if (instrumentSuffix === "dpg") {

            const mappedData = apiData.map((item) => ({
              srNo: item.sr_no,
              setPressure: item.set_pressure,
              m1: item.m1,
              m2: item.m2,
              m3: item.m3,
              mean: item.mean,
              error: item.error,
              maxZeroError: item.max_zero_error,
              hysterisis: item.hysterisis,
              repeatability: item.repeatability,
              leastcount: item.leastcount,
              masterUncertainty: item.master_uncertainty,
              combinedUncertainty: item.combined_uncertainty,
              degreeOfFreedom: item.degree_of_freedom,
              coverageFactor: item.coverage_factor,
              expandedUncertainty: item.expanded_uncertainty,
              cmcTaken: item.cmc_taken,
              cmcScope: item.cmc_scope,
            }));
            setData(mappedData);
          } else if (instrumentSuffix === "mm") {
            const mappedData = apiData.map((item) => ({
              srNo: item.sr_no,
              unitType: item.unit_type,
              mode: item.mode,
              uuc0: item.uuc ? item.uuc[0] : item.uuc0,
              uuc1: item.uuc ? item.uuc[1] : item.uuc1,
              uuc2: item.uuc ? item.uuc[2] : item.uuc2,
              uuc3: item.uuc ? item.uuc[3] : item.uuc3,
              uuc4: item.uuc ? item.uuc[4] : item.uuc4,
              unit: item.unit,
              calibrationPoint: item.calibration_point,
              average: item.average,
              stdDeviation: item.std_deviation,
              typeA: item.type_a,
              accuracyOfCalibrator: item.accuracy_of_calibrator,
              uncertaintyOfMaster: item.uncertainty_of_master,
              leastCountOfUuc: item.least_count_of_uuc,
              combinedUncertainty: item.combined_uncertainty,
              degreeOfFreedom: item.degree_of_freedom,
              coverageFactor: item.coverage_factor,
              expandedUncertaintyValue: item.expanded_uncertainty_value,
              expandedUncertaintyPercent: item.expanded_uncertainty_percent,
              cmcTaken: item.cmc_taken,
              cmcScope: item.cmc_scope,
            }));
            setData(mappedData);
          } else if (instrumentSuffix === "sw") {
            // For Stop Watch - same structure as Multimeter
            const mappedData = apiData.map((item) => ({
              srNo: item.sr_no,
              unitType: item.unit_type,
              mode: item.mode,
              uuc0: item.uuc ? item.uuc[0] : item.uuc0,
              uuc1: item.uuc ? item.uuc[1] : item.uuc1,
              uuc2: item.uuc ? item.uuc[2] : item.uuc2,
              uuc3: item.uuc ? item.uuc[3] : item.uuc3,
              uuc4: item.uuc ? item.uuc[4] : item.uuc4,
              unit: item.unit,
              calibrationPoint: item.calibration_point,
              average: item.average,
              stdDeviation: item.std_deviation,
              typeA: item.type_a,
              accuracyOfCalibrator: item.accuracy_of_calibrator,
              uncertaintyOfMaster: item.uncertainty_of_master,
              leastCountOfUuc: item.least_count_of_uuc,
              combinedUncertainty: item.combined_uncertainty,
              degreeOfFreedom: item.degree_of_freedom,
              coverageFactor: item.coverage_factor,
              expandedUncertaintyValue: item.expanded_uncertainty_value,
              expandedUncertaintyPercent: item.expanded_uncertainty_percent,
              cmcTaken: item.cmc_taken,
              cmcScope: item.cmc_scope,
            }));
            setData(mappedData);
          } else if (instrumentSuffix === "odfm") {
            const mappedData = apiData.map((item) => ({
              srNo: item.sr_no,
              master0: item.master ? item.master[0] : item.master0,
              master1: item.master ? item.master[1] : item.master1,
              master2: item.master ? item.master[2] : item.master2,
              master3: item.master ? item.master[3] : item.master3,
              master4: item.master ? item.master[4] : item.master4,
              unit: item.unit,
              calibrationPoint: item.calibration_point,
              average: item.average,
              stdDeviation: item.std_deviation,
              typeA: item.type_a,
              uncertaintyMaster1: item.uncertainty_master_1,
              uncertaintyMaster2Value: item.uncertainty_master_2_value,
              sensitivityCoefficient: item.sensitivity_coefficient,
              uncertaintyMaster2Celsius: item.uncertainty_master_2_celsius,
              stabilityBath: item.stability_bath,
              uniformityBath: item.uniformity_bath,
              driftMaster: item.drift_master,
              leastCountUuc: item.least_count_uuc,
              combinedUncertainty: item.combined_uncertainty,
              degreeOfFreedom: item.degree_of_freedom,
              coverageFactor: item.coverage_factor,
              expandedUncertaintyValue: item.expanded_uncertainty_value,
              cmcUncertainty: item.cmc_uncertainty,
            }));
            setData(mappedData);
          } else if (instrumentSuffix === "ppg") {
            // For Precision Pressure Gauge - similar to AVG/MG but with 6 observations
            const mappedData = apiData.data?.map((item) => ({
              srNo: item.sr_no,
              setPressure: item.set_pressure_uuc,
              masterObservations: [
                item.master_observation_m1,
                item.master_observation_m2,
                item.master_observation_m3,
                item.master_observation_m4,
                item.master_observation_m5,
                item.master_observation_m6
              ],
              meanMaster: item.mean_master,
              error: item.error,
              maxZeroError: item.max_zero_error,
              hysterisis: item.hysterisis,
              repeatability: item.repeatability,
              leastCountUuc: item.least_count_uuc,
              uncertaintyMaster: item.uncertainty_master,
              combinedUncertainty: item.combined_uncertainty,
              degreeOfFreedom: item.degree_of_freedom,
              coverageFactor: item.coverage_factor,
              expandedUncertainty: item.expanded_uncertainty,
              cmcTaken: item.cmc_taken,
              masterUnit: item.units?.master_unit || "bar"
            })) || [];
            setData(mappedData);
          } else if (instrumentSuffix === "it") {
            const mappedData = apiData.map((item) => ({
              srNo: item.sr_no,
              matrixType: item.matrixtype,
              values: item.uuc || [item.uuc_0, item.uuc_1, item.uuc_2, item.uuc_3, item.uuc_4],
              unit: item.unit,
              calibrationPoint: item.calibration_point,
              average: item.average_uuc,
              stdDeviation: item.std_deviation,
              typeA: item.type_a,
              uncertaintyOfMaster: item.uncertainty_master,
              leastCountMaster: item.least_count_master,
              thermalCoeffMaster: item.thermal_coefficient_master,
              thermalCoeffUuc: item.thermal_coefficient_uuc,
              uncTempDevice: item.uncertainty_temperature_device,
              stdUncTher20: item.uncertainty_thermal_coefficient_20,
              stdUncDiff: item.uncertainty_temperature_difference,
              uncError: item.uncertainty_master_error,
              combinedUnc: item.combined_uncertainty,
              dof: item.degree_of_freedom,
              coverageFactor: item.coverage_factor,
              expandedUnc: item.expanded_uncertainty,
              cmcScope: item.cmc_scope,
              cmc: item.cmc_taken,
            }));
            setData(mappedData);
          } else if (instrumentSuffix === "mt") {
            const mappedData = apiData.map((item) => ({
              srNo: item.sr_no,
              values: item.master || [item.master_0, item.master_1, item.master_2, item.master_3, item.master_4],
              unit: item.unit,
              calibrationPoint: item.calibration_point,
              average: item.average_master,
              stdDeviation: item.std_deviation,
              typeA: item.type_a,
              uncertaintyOfMaster: item.uncertainty_master,
              thicknessOfGraduation: item.thickness_graduation_line,
              thermalCoeffMaster: item.thermal_coefficient_master,
              thermalCoeffUuc: item.thermal_coefficient_uuc,
              uncTempDevice: item.uncertainty_temperature_device,
              stdUncTher20: item.uncertainty_thermal_coefficient_20,
              stdUncDiff: item.uncertainty_temperature_difference,
              uncParallelism: item.uncertainty_parallelism,
              uncError: item.uncertainty_master_error,
              combinedUnc: item.combined_uncertainty,
              dof: item.degree_of_freedom,
              coverageFactor: item.coverage_factor,
              expandedUnc: item.expanded_uncertainty,
              cmc: item.cmc_taken,
            }));
            setData(mappedData);
          } else if (instrumentSuffix === "hg") {
            // For Height Gauge
            const mappedData = apiData.map((item) => ({
              srNo: item.sr_no,
              typeOfMeasurement: item.type_of_measurement,
              values: item.uuc || [item.uuc_0, item.uuc_1, item.uuc_2, item.uuc_3, item.uuc_4],
              unit: item.unit,
              calibrationPoint: item.calibration_point,
              average: item.average_uuc,
              stdDeviation: item.std_deviation,
              typeA: item.type_a,
              uncertaintyOfMaster: item.uncertainty_master,
              flatnessSurfacePlate: item.flatness_surface_plate,
              leastCountUuc: item.least_count_uuc,
              thermalCoeffMaster: item.thermal_coefficient_master,
              thermalCoeffUuc: item.thermal_coefficient_uuc,
              uncTempDevice: item.uncertainty_temperature_device,
              stdUncTher20: item.uncertainty_thermal_coefficient_20,
              stdUncDiff: item.uncertainty_temperature_difference,
              uncParallelism: item.uncertainty_parallelism,
              uncError: item.uncertainty_master_error,
              combinedUnc: item.combined_uncertainty,
              dof: item.degree_of_freedom,
              coverageFactor: item.coverage_factor,
              expandedUnc: item.expanded_uncertainty,
              cmc: item.cmc_taken,
            }));
            setData(mappedData);
          } else if (instrumentSuffix === "mg") {
            // For Magnehelic Gauge - similar structure to AVG
            const mappedData = apiData.data?.map((item) => ({
              srNo: item.sr_no,
              setPressure: item.set_pressure_uuc,
              masterObservationM1: item.master_observation_m1,
              masterObservationM2: item.master_observation_m2,
              meanMaster: item.mean_master,
              error: item.error,
              maxZeroError: item.max_zero_error,
              hysterisis: item.hysterisis,
              repeatability: item.repeatability,
              leastCountUuc: item.least_count_uuc,
              uncertaintyMaster: item.uncertainty_master,
              combinedUncertainty: item.combined_uncertainty,
              degreeOfFreedom: item.degree_of_freedom,
              coverageFactor: item.coverage_factor,
              expandedUncertainty: item.expanded_uncertainty,
              cmcTaken: item.cmc_taken,
              masterUnit: item.units?.master_unit || "Pa"
            })) || [];
            setData(mappedData);
          } else if (instrumentSuffix === "fg") {
            // For Feeler Gauge
            const mappedData = apiData.map((item) => ({
              srNo: item.sr_no,
              values: item.master || [item.master_0, item.master_1, item.master_2, item.master_3, item.master_4],
              unit: item.unit,
              calibrationPoint: item.calibration_point,
              average: item.average,
              stdDeviation: item.std_deviation,
              typeA: item.type_a,
              uncertaintyOfMaster: item.uncertainty_master,
              leastCountMaster: item.least_count_master,
              thermalCoeffMaster: item.thermal_coefficient_master,
              thermalCoeffUuc: item.thermal_coefficient_uuc,
              uncTempDevice: item.uncertainty_temperature_device,
              stdUncTher20: item.uncertainty_thermal_coefficient_20,
              stdUncDiff: item.uncertainty_temperature_difference,
              uncParallelism: item.uncertainty_parallelism,
              uncError: item.uncertainty_master_error,
              combinedUnc: item.combined_uncertainty,
              dof: item.degree_of_freedom,
              coverageFactor: item.coverage_factor,
              expandedUnc: item.expanded_uncertainty,
              cmc: item.cmc_taken,
            }));
            setData(mappedData);
          } else if (instrumentSuffix === "dw") {
            const dataList = Array.isArray(apiData)
              ? apiData
              : (apiData?.original?.data || apiData?.data || []);

            const defaultUnit = response.data.data?.uncertainty?.original?.uuc_unit || "g";

            const mappedData = dataList.map((item) => {
              let uuca = [];
              let mastera = [];
              let masterb = [];
              let uucb = [];
              let deltai = [];

              if (Array.isArray(item.repeatable_data) && item.repeatable_data.length > 0) {
                uuca = item.repeatable_data.map((r) => r.s1 ?? r.uuca);
                mastera = item.repeatable_data.map((r) => r.u1 ?? r.mastera);
                masterb = item.repeatable_data.map((r) => r.u2 ?? r.masterb);
                uucb = item.repeatable_data.map((r) => r.s2 ?? r.uucb);
                deltai = item.repeatable_data.map((r) => r.deltai ?? r.diff);
              } else {
                uuca = safeGetArrayValue(item.uuca ?? item.s1);
                mastera = safeGetArrayValue(item.mastera ?? item.u1);
                masterb = safeGetArrayValue(item.masterb ?? item.u2);
                uucb = safeGetArrayValue(item.uucb ?? item.s2);
                deltai = safeGetArrayValue(item.deltai ?? item.diff);
              }

              return {
                srNo: item.sr_no,
                unit: item.unit || defaultUnit,
                calibrationPoint: item.calibration_point ?? item.point,
                uuca,
                mastera,
                masterb,
                uucb,
                deltai,
                typeA: item.typea ?? item.type_a,
                averagedeltai: item.averagedeltai ?? item.average_deltai ?? item.average_diff ?? item.avg_diff,
                mcr: item.mcr ?? item.conv_mass,
                densityofair: item.densityofair ?? item.density_of_air,
                densityofairref: item.densityofairref ?? item.reference_air_density ?? item.density_of_air_ref ?? 0.0012,
                densityofmaster: item.densityofmaster ?? item.density_of_master,
                densityuuc: item.densityuuc ?? item.density_of_uuc ?? item.density_uuc,
                refweightmass: item.refweightmass ?? item.reference_weight_mass ?? item.ref_weight_mass,
                volumofref: item.volumofref ?? item.volume_of_reference ?? item.volume_of_ref,
                volumeoftestweight: item.volumeoftestweight ?? item.volume_of_test_weight,
                airbyouncy: item.airbyouncy ?? item.air_buoyancy_correction ?? item.air_buoyancy,
                masterleastcount: item.masterleastcount ?? item.least_count ?? item.master_least_count,
                masterunc: item.masterunc ?? item.master_uncertainty ?? item.master_unc,
                comuncer: item.comuncer ?? item.combined_uncertainty ?? item.combined_unc,
                coveragefactor: item.coveragefactor ?? item.coverage_factor ?? 2,
                expandeduncertainty: item.expandeduncertainty ?? item.expanded_uncertainty ?? item.expanded_unc,
                cmcuncertainty: item.cmcuncertainty ?? item.cmc_uncertainty ?? item.cmc,
                cmcscope: item.cmcscope ?? item.cmc_scope,
              };
            });
            setData(mappedData);
          } else if (instrumentSuffix === "wb") {
            const dataList = Array.isArray(apiData)
              ? apiData
              : (apiData?.original?.data || apiData?.data || []);

            const mappedData = dataList.map((item) => ({
              srNo: item.sr_no || item.srNo,
              unit: item.unit_desc || item.unit,
              calibrationPoint: item.calibration_point ?? item.point,
              values: [
                item.reading_1 ?? item.uuc_0 ?? item.uuc0 ?? '',
                item.reading_2 ?? item.uuc_1 ?? item.uuc1 ?? '',
                item.reading_3 ?? item.uuc_2 ?? item.uuc2 ?? '',
                item.reading_4 ?? item.uuc_3 ?? item.uuc3 ?? '',
                item.reading_5 ?? item.uuc_4 ?? item.uuc4 ?? '',
                item.reading_6 ?? item.uuc_5 ?? item.uuc5 ?? '',
                item.reading_7 ?? item.uuc_6 ?? item.uuc6 ?? '',
                item.reading_8 ?? item.uuc_7 ?? item.uuc7 ?? '',
                item.reading_9 ?? item.uuc_8 ?? item.uuc8 ?? '',
                item.reading_10 ?? item.uuc_9 ?? item.uuc9 ?? ''
              ],
              average: item.average_g ?? item.averageuuc ?? item.average_uuc ?? item.average,
              stdDeviation: item.std_deviation ?? item.repeatability ?? item.stdDeviation,
              typeA: item.type_a ?? item.typea ?? item.typeA,
              drift: item.drift_in_mass_g ?? item.drift ?? 0,
              eccentricityfactor: item.eccentricity_g ?? item.eccentricityfactor ?? item.eccentricity_factor ?? 0,
              uncertaintyOfMaster: item.uncertainty_of_master_g ?? item.masterunc ?? item.master_uncertainty ?? item.master_unc,
              leastCount: item.least_count_of_uuc_g ?? item.leastcount ?? item.least_count,
              combinedUnc: item.combined_uncertainty ?? item.comuncer ?? item.combined_unc,
              dof: item.degree_of_freedom ?? item.degrees_of_freedom ?? item.dof,
              coverageFactor: item.coverage_factor ?? item.coveragefactor ?? 2,
              expandedUnc: item.expanded_uncertainty_g ?? item.expandeduncertainty ?? item.expanded_uncertainty ?? item.expanded_unc,
              expandedUncmg: item.expanded_uncertainty_mg ?? item.expandeduncertainty_mg ?? '',
              cmcScope: item.cmc_scope_g ?? item.cmc_scope ?? item.cmcscope,
              cmc: item.cmc_taken ?? item.cmcuncertainty ?? item.cmc_uncertainty ?? item.cmc,
            }));
            setData(mappedData);
          } else if (instrumentSuffix === "es") {
            const mappedData = apiData.map((item) => {
              const testpoint = (item.calibration_point || item.point || "").toString();
              const parameter = (item.unit_type || item.unittype || item.parameter || "").toLowerCase();
              const uucValues = item.uuc || [item.uuc_0, item.uuc_1, item.uuc_2, item.uuc_3, item.uuc_4];

              const getCoverage = (dof) => {
                if (dof >= 100 || !isFinite(dof)) return 2.0;
                if (dof >= 50) return 2.05;
                if (dof >= 30) return 2.09;
                if (dof >= 20) return 2.13;
                if (dof >= 10) return 2.28;
                if (dof >= 5) return 2.65;
                if (dof >= 4) return 2.87;
                if (dof >= 3) return 3.31;
                if (dof >= 2) return 4.53;
                return 2.0;
              };

              if (parameter === "nibp") {
                const calibParts = testpoint.split("/");
                const val1Parts = (uucValues[0] || "").toString().split("/");
                const val2Parts = (uucValues[1] || "").toString().split("/");
                const val3Parts = (uucValues[2] || "").toString().split("/");
                const val4Parts = (uucValues[3] || "").toString().split("/");
                const val5Parts = (uucValues[4] || "").toString().split("/");

                const upper = [parseFloat(val1Parts[0] || 0), parseFloat(val2Parts[0] || 0), parseFloat(val3Parts[0] || 0), parseFloat(val4Parts[0] || 0), parseFloat(val5Parts[0] || 0)];
                const lower = [parseFloat(val1Parts[1] || 0), parseFloat(val2Parts[1] || 0), parseFloat(val3Parts[1] || 0), parseFloat(val4Parts[1] || 0), parseFloat(val5Parts[1] || 0)];

                const avgUpper = upper.reduce((a, b) => a + b, 0) / 5;
                const avgLower = lower.reduce((a, b) => a + b, 0) / 5;

                const stdUpper = Math.sqrt(upper.reduce((a, b) => a + Math.pow(b - avgUpper, 2), 0) / 4);
                const stdLower = Math.sqrt(lower.reduce((a, b) => a + Math.pow(b - avgLower, 2), 0) / 4);

                const typeaUpper = stdUpper / Math.sqrt(5);
                const typeaLower = stdLower / Math.sqrt(5);

                const masteraccuracy = parseFloat(item.master_accuracy || item.masteraccuracy || item.accuracy_calibrator || 0);
                const masterunc = parseFloat(item.master_unc || item.masterunc || item.uncertainty_master || 0);

                const masterunc1Upper = masterunc * avgUpper / 100;
                const masterunc1Lower = masterunc * avgLower / 100;
                const leastcount = parseFloat(item.least_count || item.leastcount || item.least_count_uuc || 0);

                const comuncerUpper = Math.sqrt(Math.pow(typeaUpper, 2) + Math.pow(masteraccuracy / Math.sqrt(3), 2) + Math.pow(masterunc1Upper / 2, 2) + Math.pow(leastcount / 2 / Math.sqrt(3), 2));
                const comuncerLower = Math.sqrt(Math.pow(typeaLower, 2) + Math.pow(masteraccuracy / Math.sqrt(3), 2) + Math.pow(masterunc1Lower / 2, 2) + Math.pow(leastcount / 2 / Math.sqrt(3), 2));

                const dofUpper = typeaUpper === 0 ? Infinity : (Math.pow(comuncerUpper, 4) / Math.pow(typeaUpper, 4)) * 4;
                const dofLower = typeaLower === 0 ? Infinity : (Math.pow(comuncerLower, 4) / Math.pow(typeaLower, 4)) * 4;

                const covUpper = getCoverage(dofUpper);
                const covLower = getCoverage(dofLower);

                const expUpper = comuncerUpper * covUpper;
                const expLower = comuncerLower * covLower;

                const expPercentUpper = parseFloat(calibParts[0]) ? (expUpper / Math.abs(parseFloat(calibParts[0]))) * 100 : 0;
                const expPercentLower = parseFloat(calibParts[1]) ? (expLower / Math.abs(parseFloat(calibParts[1]))) * 100 : 0;

                return {
                  srNo: item.sr_no || item.srNo,
                  unitType: item.unit_type || item.unittype || item.parameter,
                  mode: item.mode,
                  values: uucValues,
                  unit: item.unit,
                  calibrationPoint: item.calibration_point || item.point,
                  average: `${avgUpper.toFixed(2)}/${avgLower.toFixed(2)}`,
                  stdDeviation: `${stdUpper.toFixed(4)}/${stdLower.toFixed(4)}`,
                  typeA: `${typeaUpper.toFixed(4)}/${typeaLower.toFixed(4)}`,
                  accuracyCalibrator: masteraccuracy,
                  uncertaintyMaster: masterunc,
                  leastCount: leastcount,
                  combinedUnc: `${comuncerUpper.toFixed(4)}/${comuncerLower.toFixed(4)}`,
                  dof: `${isFinite(dofUpper) ? dofUpper.toFixed(2) : '-'} / ${isFinite(dofLower) ? dofLower.toFixed(2) : '-'}`,
                  coverageFactor: `${covUpper.toFixed(2)}/${covLower.toFixed(2)}`,
                  expandedUncValue: `${expUpper.toFixed(4)}/${expLower.toFixed(4)}`,
                  expandedUncPercent: `${expPercentUpper.toFixed(4)}/${expPercentLower.toFixed(4)}`,
                  cmcTaken: `${expPercentUpper}/${expPercentLower}`,
                  cmcScope: item.cmc_scope || item.cmcScope
                };
              } else {
                const testVal = parseFloat(testpoint);
                const avg = parseFloat(item.average_uuc || item.averageuuc || 0);
                const std = parseFloat(item.std_deviation || item.repeatability || 0);
                const typea = std / Math.sqrt(5);

                const masteraccuracy = parseFloat(item.master_accuracy || item.masteraccuracy || item.accuracy_calibrator || 0);
                const masterunc = parseFloat(item.master_unc || item.masterunc || item.uncertainty_master || 0);
                const leastcount = parseFloat(item.least_count || item.leastcount || item.least_count_uuc || 0);

                const masterunc1 = masterunc * avg / 100;
                const comuncer = Math.sqrt(Math.pow(typea, 2) + Math.pow(masteraccuracy / Math.sqrt(3), 2) + Math.pow(masterunc1 / 2, 2) + Math.pow(leastcount / 2 / Math.sqrt(3), 2));

                const dof = typea === 0 ? Infinity : (Math.pow(comuncer, 4) / Math.pow(typea, 4)) * 4;
                const cov = getCoverage(dof);
                const exp = comuncer * cov;
                const expPercent = testVal ? (exp / Math.abs(testVal)) * 100 : 0;

                return {
                  srNo: item.sr_no || item.srNo,
                  unitType: item.unit_type || item.unittype || item.parameter,
                  mode: item.mode,
                  values: uucValues,
                  unit: item.unit,
                  calibrationPoint: item.calibration_point || item.point,
                  average: avg,
                  stdDeviation: std,
                  typeA: typea,
                  accuracyCalibrator: masteraccuracy,
                  uncertaintyMaster: masterunc,
                  leastCount: leastcount,
                  combinedUnc: comuncer,
                  dof: isFinite(dof) ? dof : '-',
                  coverageFactor: cov,
                  expandedUncValue: exp,
                  expandedUncPercent: expPercent,
                  cmcTaken: expPercent,
                  cmcScope: item.cmc_scope || item.cmcScope
                };
              }
            });
            setData(mappedData);
          } else if (instrumentSuffix === "wbn") {
            const mappedData = apiData.map((item) => {
              const testpoint = parseFloat(item.calibration_point || item.point || 0);

              const values = [
                item.reading_1 ?? item.uucr?.[0] ?? item.uuc?.[0] ?? item.uuc_0 ?? "",
                item.reading_2 ?? item.uucr?.[1] ?? item.uuc?.[1] ?? item.uuc_1 ?? "",
                item.reading_3 ?? item.uucr?.[2] ?? item.uuc?.[2] ?? item.uuc_2 ?? "",
                item.reading_4 ?? item.uucr?.[3] ?? item.uuc?.[3] ?? item.uuc_3 ?? "",
                item.reading_5 ?? item.uucr?.[4] ?? item.uuc?.[4] ?? item.uuc_4 ?? "",
              ];

              return {
                srNo: item.sr_no || item.srNo || 1,
                unit: item.unit || item.unit_desc,
                calibrationPoint: testpoint,
                values,
                reading_1: values[0],
                average: item.average_g ?? 0,
                stdDeviation: item.std_deviation ?? 0,
                typeA: item.type_a ?? 0,
                drift: item.drift_in_mass_g ?? 0,
                eccentricityfactor: item.eccentricity_g ?? 0,
                masterunc: item.uncertainty_of_master_g ?? 0,
                leastcount: item.least_count_of_uuc_g ?? 0,
                comuncer: item.combined_uncertainty ?? 0,
                dof: item.degree_of_freedom ?? "-",
                coveragefactor: item.coverage_factor ?? 2,
                expandeduncertainty: item.expanded_uncertainty_g ?? 0,
                expandeduncertaintymg: item.expanded_uncertainty_mg ?? 0,
                cmcuncertainty: item.cmc_taken ?? 0,
              };
            });
            setData(mappedData);
          } else if (instrumentSuffix === "uc") {
            // Backend returns every column already calculated (uncertainty.original.data)
            setData(mapUcCmcRows(apiData));
          } else if (instrumentSuffix === "observationuc") {
            const mappedData = apiData.map((item) => {
              const testpoint = parseFloat(item.calibration_point || item.point || 0);
              const mode = item.mode || "";

              let values = [];
              let average = 0;
              let stdDeviation = 0;
              let leastcount = 0;

              if (mode === "Measure") {
                values = item.uuc || [item.uuc_0, item.uuc_1, item.uuc_2, item.uuc_3, item.uuc_4];
                average = parseFloat(item.average_uuc || item.averageuuc || item.average || 0);
                leastcount = parseFloat(item.least_count || item.leastcount || item.least_count_uuc || 0);
                stdDeviation = parseFloat(item.std_deviation || item.repeatability || 0);
              } else {
                values = item.master || [item.master_0, item.master_1, item.master_2, item.master_3, item.master_4];
                average = parseFloat(item.average_master || item.averagemaster || item.average || 0);
                leastcount = parseFloat(item.master_least_count || item.masterleastcount || item.least_count_master || 0);
                stdDeviation = parseFloat(item.std_deviation || item.repeatability || 0);
              }

              const typea = stdDeviation / Math.sqrt(5);
              const masteraccuracy = parseFloat(item.master_accuracy || item.masteraccuracy || item.accuracy_calibrator || 0);
              const masterunc = parseFloat(item.master_unc || item.masterunc || item.uncertainty_master || 0);

              const unitId = item.unit_id || item.unit || "";
              let masterunc1 = masterunc;
              if (unitId != 12) {
                masterunc1 = masterunc * average / 100;
              }

              const comuncer = Math.sqrt(Math.pow(typea, 2) + Math.pow(masteraccuracy / Math.sqrt(3), 2) + Math.pow(masterunc1 / 2, 2) + Math.pow(leastcount / 2 / Math.sqrt(3), 2));

              let dof = "-";
              if (typea > 0) {
                dof = (Math.pow(comuncer, 4) / Math.pow(typea, 4)) * 4;
              }

              const getCoverageFactor = (d) => {
                if (d === "-") return 2;
                if (d > 30) return 2;
                if (d > 25) return 2.09;
                if (d > 20) return 2.11;
                if (d > 19) return 2.13;
                if (d > 18) return 2.14;
                if (d > 17) return 2.15;
                if (d > 16) return 2.16;
                if (d > 15) return 2.17;
                if (d > 14) return 2.18;
                if (d > 13) return 2.20;
                if (d > 12) return 2.21;
                if (d > 11) return 2.23;
                if (d > 10) return 2.25;
                if (d > 9) return 2.28;
                if (d > 8) return 2.32;
                if (d > 7) return 2.37;
                if (d > 6) return 2.43;
                if (d > 5) return 2.52;
                if (d > 4) return 2.65;
                if (d > 3) return 2.87;
                if (d > 2) return 3.31;
                if (d > 1) return 4.53;
                if (d >= 0) return 13.97;
                return 2;
              };

              const coveragefactor = getCoverageFactor(dof);
              const expandeduncertainty = comuncer * coveragefactor;

              let expandeduncertaintypercent = 0;
              if (testpoint !== 0) {
                expandeduncertaintypercent = (expandeduncertainty / testpoint) * 100;
              } else {
                expandeduncertaintypercent = 'INF';
              }

              let cmcuncertainty = expandeduncertaintypercent;
              if (unitId == 12) {
                cmcuncertainty = expandeduncertainty;
              }

              const cmcScope = parseFloat(item.cmcscope || item.cmc_scope || 0);
              const cmcTaken = (cmcScope > cmcuncertainty) ? cmcScope : cmcuncertainty;

              return {
                srNo: item.sr_no || item.srNo,
                unitType: item.unit_type || item.unittype,
                mode: mode,
                values: values,
                unitDesc: item.unit_desc || item.unit,
                calibrationPoint: testpoint,
                average: average,
                stdDeviation: stdDeviation,
                typeA: typea,
                accuracyCalibrator: masteraccuracy,
                uncertaintyMaster: masterunc,
                leastCount: leastcount,
                combinedUnc: comuncer,
                dof: dof,
                coverageFactor: coveragefactor,
                expandedUncValue: expandeduncertainty,
                expandedUncPercent: expandeduncertaintypercent,
                cmcTaken: cmcTaken,
                cmcScope: cmcScope
              };
            });
            setData(mappedData);
          } else if (instrumentSuffix === "utm") {
            const mappedData = apiData.map((item, index) => {
              const setpoint = parseFloat(item.calibration_point ?? item.force ?? item.point ?? 0);

              // The API already returns every computed figure; read them rather than recomputing
              const obs = item.observations || {};
              const rie = item.relative_indicative_error || {};
              const rep = item.repeatability || {};
              const res = item.relative_resolution || {};

              return {
                srNo: item.sr_no ?? item.srNo ?? index + 1,
                force: item.force ?? setpoint,
                mode: item.mode,
                unit: item.unit_desc || item.unit,
                calibrationPoint: item.calibration_point ?? setpoint,
                calculateduuc: item.std_at_24 ?? item.calculateduuc ?? item.calculated_uuc,
                uuc0: item.standard_division_room_temp ?? item.uuc0 ?? item.uuc_0,
                master0: obs.reading_1 ?? item.master0 ?? item.master_0,
                master1: obs.reading_2 ?? item.master1 ?? item.master_1,
                master2: obs.reading_3 ?? item.master2 ?? item.master_2,
                averagemaster: obs.average,
                q1Error: rie.q1,
                q2Error: rie.q2,
                q3Error: rie.q3,
                avgQError: rie.avg_q,
                diffQError: rep.b_percent,
                urep: rep.urep_percent,
                leastcount: item.least_count ?? item.leastcount,
                maxzeroerror: item.relative_zero_error ?? item.maxzeroerror ?? item.max_zero_error,
                af: res.af_percent,
                az: res.az_percent,
                ures: item.resolution_uncertainty,
                masterunc: item.master_uncertainty ?? item.masterunc ?? item.master_unc,
                drift: item.drift ?? 0,
                ustd: item.master_unc_ustd,
                combinedUncertainty: item.combined_uncertainty,
                kfactor: item.k_factor ?? item.coverage_factor ?? 2,
                expandedUncertainty: item.expanded_uncertainty,
                cmcScope: item.cmc_scope ?? item.cmcscope ?? 0,
                cmcTaken: item.cmc_taken,
              };
            });
            setData(mappedData);
          } else if (instrumentSuffix === "vht") {
            // The VHT endpoint already returns every computed figure under the
            // names VhtCmcTable reads, so pass the rows straight through.
            setData(Array.isArray(apiData) ? apiData : []);
          } else if (instrumentSuffix === "vol") {
            // The VOL endpoint already returns every computed figure under the
            // names VolCmcTable reads, so pass the rows straight through.
            setData(Array.isArray(apiData) ? apiData : []);
          } else if (instrumentSuffix === "volnl") {
            // The VOLNL endpoint already returns every computed figure under the
            // names VolnlCmcTable reads, so pass the rows straight through.
            setData(Array.isArray(apiData) ? apiData : []);
          } else if (instrumentSuffix === "autm") {
            // The AUTM endpoint already returns every computed figure under the
            // names AutmCmcTable reads, so pass the rows straight through.
            setData(Array.isArray(apiData) ? apiData : []);
          } else if (instrumentSuffix === "tm") {
            const mappedData = apiData.map((item) => {
              const testpoint = parseFloat(item.calibration_point || item.point || 0);
              const uucValues = item.uuc || [
                item.uuc_0, item.uuc_1, item.uuc_2, item.uuc_3, item.uuc_4,
                item.uuc_5, item.uuc_6, item.uuc_7, item.uuc_8, item.uuc_9
              ];

              const averageuuc = parseFloat(item.average_uuc || item.averageuuc || 0);
              const repeatability = parseFloat(item.std_deviation || item.repeatability || 0);

              // Type A: Standard Deviation / sqrt(10)
              const typea = repeatability / Math.sqrt(10);

              const masteraccuracy = parseFloat(item.accuracy_calibrator || item.masteraccuracy || 0);
              const masterunc = parseFloat(item.uncertainty_master || item.masterunc || 0);
              const leastcount = parseFloat(item.least_count_uuc || item.leastcount || item.least_count || 0);

              // Combined Uncertainty
              const comuncer = Math.sqrt(
                Math.pow(typea, 2) +
                Math.pow(masteraccuracy / Math.sqrt(3), 2) +
                Math.pow((masterunc * averageuuc / 100) / 2, 2) +
                Math.pow(leastcount / 2 / Math.sqrt(3), 2)
              );

              // Degree of Freedom
              let dof = "-";
              if (repeatability > 0 && typea > 0) {
                const com4 = Math.pow(comuncer, 4);
                const typeap4 = Math.pow(typea, 4);
                dof = (com4 / typeap4) * 4;
              }

              const coveragefactor = 2;
              const expandeduncertainty = comuncer * coveragefactor;

              // Expanded Uncertainty in %
              const expandeduncertaintypercent = testpoint !== 0 ? (expandeduncertainty / testpoint) * 100 : 0;

              // CMC taken
              const tempcmc = parseFloat(item.cmcscope || item.cmc_scope || 0);
              const cmcuncertainty = tempcmc > expandeduncertaintypercent ? tempcmc : expandeduncertaintypercent;

              return {
                srNo: item.sr_no,
                values: uucValues,
                unit: item.unit_name || item.unit,
                calibrationPoint: testpoint,
                average: averageuuc,
                stdDeviation: repeatability,
                typeA: typea,
                accuracyCalibrator: masteraccuracy,
                uncertaintyMaster: masterunc,
                leastCount: leastcount,
                combinedUnc: comuncer,
                dof: dof,
                coverageFactor: coveragefactor,
                expandedUncValue: expandeduncertainty,
                expandedUncPercent: expandeduncertaintypercent,
                cmc: cmcuncertainty,
              };
            });
            setData(mappedData);
          } else if (instrumentSuffix === "cent") {
            // For Centrifuge - 10 master readings (master0–master9), RPM-based
            const mappedData = apiData.map((item) => {
              const testpoint = parseFloat(item.calibration_point || item.point || 0);
              // API returns master_readings as a string array directly
              const masterValues = Array.isArray(item.master_readings)
                ? item.master_readings
                : [
                  item.master_0, item.master_1, item.master_2, item.master_3, item.master_4,
                  item.master_5, item.master_6, item.master_7, item.master_8, item.master_9
                ];

              const averagemaster = parseFloat(item.average_master || 0);
              const repeatability = parseFloat(item.repeatability || 0);
              const typea = parseFloat(item.type_a || 0);
              const masteraccuracy = parseFloat(item.master_accuracy || 0);
              const masterunc = parseFloat(item.master_uncertainty || 0);
              const leastcount = parseFloat(item.least_count || 0);
              const comuncer = parseFloat(item.combined_uncertainty || 0);
              const dof = parseFloat(item.degree_of_freedom || 0) || "-";
              const coveragefactor = parseFloat(item.coverage_factor || 2);
              const expandeduncertainty = parseFloat(item.expanded_uncertainty || 0);
              const expandeduncertaintypercent = parseFloat(item.expanded_uncertainty_percent || 0);
              const cmcuncertainty = parseFloat(item.cmc_uncertainty || 0);

              return {
                srNo: item.sr_no,
                values: masterValues,
                unit: item.unit,
                calibrationPoint: testpoint,
                average: averagemaster,
                stdDeviation: repeatability,
                typeA: typea,
                accuracyCalibrator: masteraccuracy,
                uncertaintyMaster: masterunc,
                leastCount: leastcount,
                combinedUnc: comuncer,
                dof: dof,
                coverageFactor: coveragefactor,
                expandedUncValue: expandeduncertainty,
                expandedUncPercent: expandeduncertaintypercent,
                cmc: cmcuncertainty,
              };
            });
            setData(mappedData);
          } else if (instrumentSuffix === "th") {
            const mappedData = apiData.map((item, idx) => ({
              srNo: item.srno ?? item.sr_no ?? (idx + 1),
              values: Array.isArray(item.uuc) ? item.uuc : [
                item.uuc0 ?? item.uuc_0 ?? "",
                item.uuc1 ?? item.uuc_1 ?? "",
                item.uuc2 ?? item.uuc_2 ?? "",
                item.uuc3 ?? item.uuc_3 ?? "",
                item.uuc4 ?? item.uuc_4 ?? "",
              ],
              unit: item.unit ?? "",
              calibrationPoint: item.point ?? item.calibration_point ?? "",
              average: item.averageuuc ?? item.average_uuc ?? item.average ?? "",
              stdDeviation: item.repeatability ?? item.std_deviation ?? "",
              typeA: item.typea ?? item.type_a ?? "",
              masterUnc: item.masterunc ?? item.uncertainty_master ?? "",
              accuracy: item.accuracy ?? item.accuracy_calibrator ?? "",
              stability: item.stability ?? item.stability_bath ?? "",
              uniformity: item.uniformity ?? item.uniformity_bath ?? "",
              drift: item.drift ?? item.drift_master ?? "",
              leastCount: item.leastcount ?? item.least_count ?? item.least_count_uuc ?? "",
              combinedUnc: item.comuncer ?? item.combined_uncertainty ?? "",
              dof: item.dof ?? item.degree_of_freedom ?? "",
              coverageFactor: item.coveragefactor ?? item.coverage_factor ?? 2,
              expandedUnc: item.expandeduncertainty ?? item.expanded_uncertainty ?? "",
              cmc: item.cmcuncertainty ?? item.cmc_uncertainty ?? item.cmc_taken ?? item.cmc ?? "",
              cmcScope: item.cmcscope ?? item.cmc_scope ?? "",
            }));
            setData(mappedData);
          } else if (instrumentSuffix === "ts") {
            const mappedData = apiData.map((item, idx) => ({
              srNo: item.sr_no ?? (idx + 1),
              values: [
                item.reading1 ?? "",
                item.reading2 ?? "",
                item.reading3 ?? "",
                item.reading4 ?? "",
                item.reading5 ?? "",
              ],
              unit: item.unit ?? "",
              calibrationPoint: item.calibration_point ?? "",
              average: item.average ?? "",
              stdDeviation: item.std_deviation ?? "",
              typeA: item.type_a ?? "",
              uncertaintyOfMaster: item.master_uncertainty ?? "",
              leastCount: item.least_count ?? "",
              thermalCoeffMaster: item.thermal_coeff_master ?? "",
              thermalCoeffUuc: item.thermal_coeff_uuc ?? "",
              uncTempDevice: item.uncertainty_temp_device ?? "",
              stdUncTher20: item.std_unc_thermal_coeff ?? "",
              stdUncDiff: item.std_unc_temp_diff ?? "",
              combinedUnc: item.combined_uncertainty ?? "",
              dof: item.degree_of_freedom ?? "",
              coverageFactor: item.coverage_factor ?? 2,
              expandedUnc: item.expanded_uncertainty ?? "",
              cmc: item.cmc_taken ?? "",
              cmcScope: item.cmc_scope ?? "",
            }));
            setData(mappedData);
          } else {
            toast.error(`Unsupported instrument suffix: ${instrumentSuffix}`);
            setData([]);
          }
        } else {
          toast.error("No data found");
          setData([]);
        }
      } catch (error) {
        console.error("Error fetching uncertainty:", error);
        toast.error("Failed to fetch data");
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUncertainty();
  }, [inwardId, instId, caliblocation, calibacc]);

  const handleBackToPerformCalibration = () => {
    navigate(
      `/dashboards/calibration-process/inward-entry-lab/perform-calibration/${inwardId}?caliblocation=${caliblocation}&calibacc=${calibacc}`
    );
  };

  const handleBackToInwardList = () => {
    navigate(
      `/dashboards/calibration-process/inward-entry-lab?caliblocation=${caliblocation}&calibacc=${calibacc}`
    );
  };

  const handlePrint = () => {
    setTimeout(() => {
      window.print();
    }, 1000);
  };


  // ========================= MAIN COMPONENT RENDER ========================= //
  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-gray-600">
        <svg className="animate-spin h-6 w-6 mr-2 text-blue-600" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z"></path>
        </svg>
        Loading Uncertainty Calculation...
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between p-4 border-b bg-white rounded-lg shadow-sm mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Uncertainty Calculation</h1>
        <div className="space-x-2">
          <Button onClick={handleBackToInwardList} className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded">
            &lt;&lt; Back to Inward Entry List
          </Button>
          <Button onClick={handleBackToPerformCalibration} className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded">
            &lt;&lt; Back to Perform Calibration
          </Button>
        </div>
      </div>


      <div className="bg-white p-4 rounded shadow">
        {suffix && (
          <h2 className="text-xl font-medium text-gray-800 mb-4 border-b pb-2">
            Table: {SUFFIX_NAMES[suffix] ? `${SUFFIX_NAMES[suffix]} (${suffix.toUpperCase()})` : suffix.toUpperCase()}
          </h2>
        )}
        <CmcTableRenderer
          suffix={suffix}
          customLayout={customLayout}
          data={data}
          electricSafetyData={electricSafetyData}
        />
      </div>


      <div className="flex justify-end mt-4">
        <button
          onClick={handlePrint}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Download CRF
        </button>
      </div>
    </div>
  );
}
