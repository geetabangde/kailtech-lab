import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "utils/axios";
import { toast } from "sonner";
import { Button } from "components/ui";
import { UNCERTAINTY_LAYOUTS } from "../../calibration-operations/instrument-list/components/UncertaintyLayouts";

const safeGetArrayValue = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      return val.split(',').map(s => s.trim());
    }
  }
  return [val];
};

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
  ppg: "Precision Pressure Gauge",
  gtm: "Glass Thermometer",
  dg: "Digital Dial Gauge",
  dw: "Dead Weight Tester",
  wb: "Water Bath",
  tm: "Tachometer",
  utm: "Universal Testing Machine",
  wbn: "Weighing Balance",
  observationuc: "Universal Calibrator"
};

export default function ViewCMCCalculation() {
  const { id: inwardId, itemId: instId } = useParams();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(window.location.search);
  const caliblocation = searchParams.get("caliblocation") || "Lab";
  const calibacc = searchParams.get("calibacc") || "Nabl";

  const [data, setData] = useState([]);
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
          const instrumentSuffix = response.data.data?.listInstrument?.suffix || "";
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

          if (instrumentSuffix === "mm") {
            // For multimeter, data is in nested structure
            apiData = response.data.data?.uncertainty?.original?.data || [];
          } else if (instrumentSuffix === "mt" || instrumentSuffix === "fg") {
            // For MT and FG, data is inside uncertainty.data array
            apiData = response.data.data?.uncertainty?.data || [];
          } else if (instrumentSuffix === "it" || instrumentSuffix === "hg" || instrumentSuffix === "avg" || instrumentSuffix === "msr" || instrumentSuffix === "mg" || instrumentSuffix === "exm" || instrumentSuffix === "rtdwi" || instrumentSuffix === "ppg" || instrumentSuffix === "gtm" || instrumentSuffix === "dg") {
            // For IT, HG, AVG, MSR, MG, EXM, RTDWI, PPG, GTM, and DG, data is direct array
            apiData = response.data.data?.uncertainty || [];
          } else {
            // For CTG, DPG, and ODFM, data is direct
            apiData = response.data.data?.uncertainty || [];
          }


          if (instrumentSuffix === "ctg") {
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
            const mappedData = apiData.map((item) => ({
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
              uncertaintySlipGauge: item.uncertainty_slip_gauge,
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
            }));
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
              average: item.average,
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
            const mappedData = apiData.map((item) => ({
              srNo: item.sr_no,
              unit: item.unit,
              calibrationPoint: item.calibration_point ?? item.point,
              uuca: safeGetArrayValue(item.uuca ?? item.s1),
              mastera: safeGetArrayValue(item.mastera ?? item.u1),
              masterb: safeGetArrayValue(item.masterb ?? item.u2),
              uucb: safeGetArrayValue(item.uucb ?? item.s2),
              deltai: safeGetArrayValue(item.deltai ?? item.diff),
              typeA: item.typea ?? item.type_a,
              averagedeltai: item.averagedeltai ?? item.average_diff ?? item.avg_diff,
              mcr: item.mcr ?? item.conv_mass,
              densityofair: item.densityofair ?? item.density_of_air,
              densityofairref: item.densityofairref ?? item.density_of_air_ref ?? 0.0012,
              densityofmaster: item.densityofmaster ?? item.density_of_master,
              densityuuc: item.densityuuc ?? item.density_uuc,
              refweightmass: item.refweightmass ?? item.ref_weight_mass,
              volumofref: item.volumofref ?? item.volume_of_ref,
              volumeoftestweight: item.volumeoftestweight ?? item.volume_of_test_weight,
              airbyouncy: item.airbyouncy ?? item.air_buoyancy,
              masterleastcount: item.masterleastcount ?? item.master_least_count,
              masterunc: item.masterunc ?? item.master_uncertainty ?? item.master_unc,
              comuncer: item.comuncer ?? item.combined_uncertainty ?? item.combined_unc,
              coveragefactor: item.coveragefactor ?? item.coverage_factor ?? 2,
              expandeduncertainty: item.expandeduncertainty ?? item.expanded_uncertainty ?? item.expanded_unc,
              cmcuncertainty: item.cmcuncertainty ?? item.cmc_uncertainty ?? item.cmc,
            }));
            setData(mappedData);
          } else if (instrumentSuffix === "wb") {
            const mappedData = apiData.map((item) => ({
              srNo: item.sr_no || item.srNo,
              unit: item.unit_desc || item.unit,
              calibrationPoint: item.calibration_point ?? item.point,
              values: [
                item.uuc_0 ?? item.uuc0 ?? '',
                item.uuc_1 ?? item.uuc1 ?? '',
                item.uuc_2 ?? item.uuc2 ?? '',
                item.uuc_3 ?? item.uuc3 ?? '',
                item.uuc_4 ?? item.uuc4 ?? '',
                item.uuc_5 ?? item.uuc5 ?? '',
                item.uuc_6 ?? item.uuc6 ?? '',
                item.uuc_7 ?? item.uuc7 ?? '',
                item.uuc_8 ?? item.uuc8 ?? '',
                item.uuc_9 ?? item.uuc9 ?? ''
              ],
              average: item.averageuuc ?? item.average_uuc ?? item.average,
              stdDeviation: item.repeatability ?? item.std_deviation ?? item.stdDeviation,
              typeA: item.typea ?? item.type_a ?? item.typeA,
              drift: item.drift ?? 0,
              eccentricityfactor: item.eccentricityfactor ?? item.eccentricity_factor ?? 0,
              uncertaintyOfMaster: item.masterunc ?? item.master_uncertainty ?? item.master_unc,
              leastCount: item.leastcount ?? item.least_count,
              combinedUnc: item.comuncer ?? item.combined_uncertainty ?? item.combined_unc,
              dof: item.dof ?? item.degrees_of_freedom ?? item.degree_of_freedom,
              coverageFactor: item.coveragefactor ?? item.coverage_factor ?? 2,
              expandedUnc: item.expandeduncertainty ?? item.expanded_uncertainty ?? item.expanded_unc,
              cmc: item.cmcuncertainty ?? item.cmc_uncertainty ?? item.cmc,
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
                  cmcTaken: `${expPercentUpper.toFixed(4)}/${expPercentLower.toFixed(4)}`,
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
              const uucValues = item.uucr || item.uuc || [item.uuc_0, item.uuc_1, item.uuc_2, item.uuc_3, item.uuc_4];

              const uuc0 = parseFloat(uucValues[0] || 0);
              const uuc1 = parseFloat(uucValues[1] || 0);
              const uuc2 = parseFloat(uucValues[2] || 0);
              const uuc3 = parseFloat(uucValues[3] || 0);
              const uuc4 = parseFloat(uucValues[4] || 0);

              const averageuuc = parseFloat(item.averageuuc || item.averageuucr || 0);
              const repeatability = parseFloat(item.repeatability || item.std_deviation || 0);
              const typea = repeatability / Math.sqrt(5);

              const eccentricity = parseFloat(item.eccentricity || 0);
              const eccentricityfactor = eccentricity * (2 / 3);

              const leastcount = parseFloat(item.leastcount || item.least_count || 0);
              const masterunc = parseFloat(item.master_uncertainty || item.masterunc || 0);
              const drift = masterunc / 10;

              const comuncer = Math.sqrt(
                Math.pow(typea, 2) +
                Math.pow(drift / Math.sqrt(3), 2) +
                Math.pow(eccentricityfactor / 2 / Math.sqrt(3), 2) +
                Math.pow(masterunc / 2, 2) +
                Math.pow(leastcount / 2 / Math.sqrt(3), 2)
              );

              let dof = "-";
              if (repeatability !== 0 && typea > 0) {
                const com4 = Math.pow(comuncer, 4);
                const typeap4 = Math.pow(typea, 4);
                dof = (com4 / (typeap4 / 4));
              }

              const coverageFactor = 2;
              const expandedUncertainty = comuncer * coverageFactor;
              const expandedUncertaintymg = expandedUncertainty * 1000;

              const cmcScope = parseFloat(item.cmcscope || item.cmc_scope || 0);
              const cmcTaken = Math.max(expandedUncertainty, cmcScope);

              return {
                srNo: item.sr_no || item.srNo || 1,
                unit: item.unit || item.unit_desc,
                calibrationPoint: testpoint,
                values: [uuc0, uuc1, uuc2, uuc3, uuc4],
                average: averageuuc,
                stdDeviation: repeatability,
                typeA: typea,
                drift: drift,
                eccentricityfactor: eccentricityfactor,
                masterunc: masterunc,
                leastcount: leastcount,
                comuncer: comuncer,
                dof: dof,
                coveragefactor: coverageFactor,
                expandeduncertainty: expandedUncertainty,
                expandeduncertaintymg: expandedUncertaintymg,
                cmcuncertainty: cmcTaken,
              };
            });
            setData(mappedData);
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
            const mappedData = apiData.map((item) => {
              const setpoint = parseFloat(item.calibration_point || item.point || 0);
              const uuc0 = parseFloat(item.uuc0 || item.uuc_0 || 0);
              const master0 = parseFloat(item.master0 || item.master_0 || 0);
              const master1 = parseFloat(item.master1 || item.master_1 || 0);
              const master2 = parseFloat(item.master2 || item.master_2 || 0);

              const leastcount = parseFloat(item.leastcount || item.least_count || item.least_count_uuc || 0);
              const maxzeroerror = parseFloat(item.maxzeroerror || item.max_zero_error || 0);
              const masterunc = parseFloat(item.masterunc || item.master_uncertainty || item.master_unc || 0);

              const q1Error = uuc0 !== 0 ? ((master0 - uuc0) / uuc0) * 100 : 0;
              const q2Error = uuc0 !== 0 ? ((master1 - uuc0) / uuc0) * 100 : 0;
              const q3Error = uuc0 !== 0 ? ((master2 - uuc0) / uuc0) * 100 : 0;

              const avgQError = (q1Error + q2Error + q3Error) / 3;
              const qErrors = [q1Error, q2Error, q3Error];
              const diffQError = Math.max(...qErrors) - Math.min(...qErrors);

              const a1 = Math.pow(q1Error - avgQError, 2);
              const a2 = Math.pow(q2Error - avgQError, 2);
              const a3 = Math.pow(q3Error - avgQError, 2);
              const urep = Math.sqrt(((1 / 3) * 2) * (a1 + a2 + a3)) / Math.sqrt(3);

              const af = setpoint !== 0 ? (leastcount / setpoint) * 100 : 0;
              const az = setpoint !== 0 ? (maxzeroerror / setpoint) * 100 : 0;

              const ures = Math.sqrt(Math.pow(af / (2 * Math.sqrt(3)), 2) + Math.pow(maxzeroerror / (2 * Math.sqrt(3)), 2));

              const ustd = Math.sqrt(Math.pow(masterunc / 2, 2) + 0);

              const combinedUncertainty = Math.sqrt(urep * urep + ures * ures + ustd * ustd);
              const kfactor = 2;
              const expandedUncertainty = kfactor * combinedUncertainty;

              return {
                srNo: item.sr_no || item.srNo,
                force: setpoint,
                mode: item.mode,
                unit: item.unit_desc || item.unit,
                calibrationPoint: setpoint,
                calculateduuc: item.calculateduuc || item.calculated_uuc,
                uuc0: uuc0,
                master0: master0,
                master1: master1,
                master2: master2,
                averagemaster: (master0 + master1 + master2) / 3,
                q1Error: q1Error,
                q2Error: q2Error,
                q3Error: q3Error,
                avgQError: avgQError,
                diffQError: diffQError,
                urep: urep,
                leastcount: leastcount,
                maxzeroerror: maxzeroerror,
                af: af,
                az: az,
                ures: ures,
                masterunc: masterunc,
                drift: 0,
                ustd: ustd,
                combinedUncertainty: combinedUncertainty,
                kfactor: kfactor,
                expandedUncertainty: expandedUncertainty,
                cmcScope: item.cmcscope || item.cmc_scope || 0,
                cmcTaken: Math.max(expandedUncertainty, parseFloat(item.cmcscope || item.cmc_scope || 0))
              };
            });
            setData(mappedData);
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

  // ========================= DYNAMIC TABLE RENDERER ========================= //
  const renderDynamicTable = () => {
    if (!customLayout || !customLayout.columns || customLayout.columns.length === 0) {
      return null;
    }

    const cols = customLayout.columns;

    // Group headers
    const groupHeaders = [];
    let currentGroup = null;
    let currentGroupColSpan = 0;

    cols.forEach((col, index) => {
      const groupName = col.group || "";
      if (groupName !== currentGroup) {
        if (currentGroup !== null) {
          groupHeaders.push({ name: currentGroup, colSpan: currentGroupColSpan });
        }
        currentGroup = groupName;
        currentGroupColSpan = 1;
      } else {
        currentGroupColSpan++;
      }
      if (index === cols.length - 1) {
        groupHeaders.push({ name: currentGroup, colSpan: currentGroupColSpan });
      }
    });

    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[12px] text-gray-700 min-w-max">
          <thead>
            {groupHeaders.length > 0 && groupHeaders.some((g) => g.name) && (
              <tr className="bg-gray-100 text-center">
                {groupHeaders.map((g, i) => (
                  <th
                    key={i}
                    colSpan={g.colSpan}
                    className="border border-gray-300 px-2 py-2 bg-gray-200 font-semibold text-xs"
                  >
                    {g.name}
                  </th>
                ))}
              </tr>
            )}
            <tr className="bg-gray-200 text-center text-[12px] font-medium">
              {cols.map((col) => (
                <th
                  key={col.key}
                  className="border border-gray-300 px-2 py-2"
                >
                  {col.headerName}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length > 0 ? (
              data.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-gray-50 text-center text-[12px]">
                  {cols.map((col) => {
                    const originalCol = UNCERTAINTY_LAYOUTS[suffix]?.[col.originalIndex];
                    let cellContent = "";
                    if (originalCol && originalCol.value) {
                      cellContent = originalCol.value(row);
                    } else if (!originalCol) {
                      // Dynamically extract values for dynamic observation columns
                      const headerAsInt = parseInt(col.headerName);
                      if (!isNaN(headerAsInt)) {
                        const valIndex = headerAsInt - 1;
                        if (row.values && Array.isArray(row.values)) {
                          cellContent = row.values[valIndex];
                        } else if (row.master && Array.isArray(row.master)) {
                          cellContent = row.master[valIndex];
                        } else if (row.masterObservations && Array.isArray(row.masterObservations)) {
                          cellContent = row.masterObservations[valIndex];
                        } else if (row[`master${valIndex}`] !== undefined) {
                          cellContent = row[`master${valIndex}`];
                        } else if (row[`uuc${valIndex}`] !== undefined) {
                          cellContent = row[`uuc${valIndex}`];
                        }
                      } else if (col.headerName.startsWith("M") && !isNaN(parseInt(col.headerName.replace("M", "")))) {
                        const valIndex = parseInt(col.headerName.replace("M", "")) - 1;
                        if (row.masterObservations && Array.isArray(row.masterObservations)) {
                          cellContent = row.masterObservations[valIndex];
                        } else if (row.m1 !== undefined) {
                          cellContent = row[`m${valIndex + 1}`];
                        }
                      }
                    }

                    if (typeof cellContent === 'number') {
                      cellContent = cellContent.toFixed(6);
                    }

                    return (
                      <td key={col.key} className="border border-gray-300 px-2 py-2">
                        {cellContent !== undefined && cellContent !== null && cellContent !== "" ? cellContent : "-"}
                      </td>
                    );
                  })}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={cols.length} className="border border-gray-300 px-2 py-4 text-center text-gray-500">
                  No data available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  // ========================= TABLE RENDERERS ========================= //
  const renderCtgTable = () => (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[12px] text-gray-700">
        <thead>
          <tr className="bg-gray-100">
            <th colSpan="12" className="border border-gray-300 px-2 py-2 bg-gray-200 font-semibold text-center">
              Type A Factor
            </th>
            <th colSpan="2" className="border border-gray-300 px-2 py-2 bg-gray-200 font-semibold text-center">
              Type B Factor
            </th>
            <th colSpan="4" className="border border-gray-300 px-2 py-2 bg-gray-200 font-semibold text-center">
              Uncertainty Measurement
            </th>
          </tr>
          <tr className="bg-gray-200 text-center text-[12px] font-medium">
            <th className="border border-gray-300 px-2 py-2">Sr No</th>
            <th className="border border-gray-300 px-2 py-2">Type Of Measurement</th>
            <th className="border border-gray-300 px-2 py-2">1</th>
            <th className="border border-gray-300 px-2 py-2">2</th>
            <th className="border border-gray-300 px-2 py-2">3</th>
            <th className="border border-gray-300 px-2 py-2">4</th>
            <th className="border border-gray-300 px-2 py-2">5</th>
            <th className="border border-gray-300 px-2 py-2">Unit</th>
            <th className="border border-gray-300 px-2 py-2">Calibration Point</th>
            <th className="border border-gray-300 px-2 py-2">Average</th>
            <th className="border border-gray-300 px-2 py-2">Std Deviation</th>
            <th className="border border-gray-300 px-2 py-2">Type A</th>
            <th className="border border-gray-300 px-2 py-2">Uncertainty of Master in mm</th>
            <th className="border border-gray-300 px-2 py-2">Least Count of UUC</th>
            <th className="border border-gray-300 px-2 py-2">Combined Uncertainty</th>
            <th className="border border-gray-300 px-2 py-2">Degree of Freedom</th>
            <th className="border border-gray-300 px-2 py-2">Coverage Factor (k)</th>
            <th className="border border-gray-300 px-2 py-2">Expanded Uncertainty</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="hover:bg-gray-50">
              <td className="border border-gray-300 px-2 py-3 text-center">{row.srNo}</td>
              <td className="border border-gray-300 px-2 py-3">{row.typeOfMeasurement}</td>
              {row.values.map((v, idx) => (
                <td key={idx} className="border border-gray-300 px-2 py-3 text-center">
                  {v}
                </td>
              ))}
              <td className="border border-gray-300 px-2 py-3 text-center">{row.unit}</td>
              <td className="border border-gray-300 px-2 py-3 text-center">{row.calibrationPoint}</td>
              <td className="border border-gray-300 px-2 py-3 text-center">{row.average}</td>
              <td className="border border-gray-300 px-2 py-3 text-center">{row.stdDeviation}</td>
              <td className="border border-gray-300 px-2 py-3 text-center">{row.typeA}</td>
              <td className="border border-gray-300 px-2 py-3 text-center">{row.uncertaintyOfMaster}</td>
              <td className="border border-gray-300 px-2 py-3 text-center">{row.leastCount}</td>
              <td className="border border-gray-300 px-2 py-3 text-center">{row.combinedUnc}</td>
              <td className="border border-gray-300 px-2 py-3 text-center">{row.dof}</td>
              <td className="border border-gray-300 px-2 py-3 text-center">{row.coverageFactor}</td>
              <td className="border border-gray-300 px-2 py-3 text-center">{row.expandedUnc} μm</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderRtdwiTable = () => (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[12px] text-gray-700 min-w-max">
        <thead>
          <tr className="bg-gray-100 text-center">
            <th colSpan="11" className="border border-gray-300 px-1 py-2 bg-gray-200 font-semibold text-xs">
              Type A Factor
            </th>
            <th colSpan="7" className="border border-gray-300 px-1 py-2 bg-gray-200 font-semibold text-xs">
              Type B Factor
            </th>
            <th colSpan="5" className="border border-gray-300 px-1 py-2 bg-gray-200 font-semibold text-xs">
              Uncertainty Measurement
            </th>
          </tr>
          <tr className="bg-gray-200 text-center text-[12px] font-medium">
            <th className="border border-gray-300 px-1 py-2">Sr no</th>
            <th className="border border-gray-300 px-1 py-2">1</th>
            <th className="border border-gray-300 px-1 py-2">2</th>
            <th className="border border-gray-300 px-1 py-2">3</th>
            <th className="border border-gray-300 px-1 py-2">4</th>
            <th className="border border-gray-300 px-1 py-2">5</th>
            <th className="border border-gray-300 px-1 py-2">Unit</th>
            <th className="border border-gray-300 px-1 py-2">Calibration point</th>
            <th className="border border-gray-300 px-1 py-2">Average</th>
            <th className="border border-gray-300 px-1 py-2">Std Deviation</th>
            <th className="border border-gray-300 px-1 py-2">Type A</th>
            <th className="border border-gray-300 px-1 py-2">Uncertainty of master-1<br />Sensor in °C</th>
            <th className="border border-gray-300 px-1 py-2">Uncertainty of master-2<br />in (6.5DMM) in value</th>
            <th className="border border-gray-300 px-1 py-2">Sensitivity Coefficient</th>
            <th className="border border-gray-300 px-1 py-2">Uncertainty of master-2<br />in (°C)</th>
            <th className="border border-gray-300 px-1 py-2">Stability Of Bath</th>
            <th className="border border-gray-300 px-1 py-2">Uniformity Of Bath</th>
            <th className="border border-gray-300 px-1 py-2">Drift Of Master</th>
            <th className="border border-gray-300 px-1 py-2">Least Count of UUC</th>
            <th className="border border-gray-300 px-1 py-2">Combined Uncertainty</th>
            <th className="border border-gray-300 px-1 py-2">Degree of Freedom</th>
            <th className="border border-gray-300 px-1 py-2">Coverage Factor (k)</th>
            <th className="border border-gray-300 px-1 py-2">Expanded Uncertainty in Value</th>
            <th className="border border-gray-300 px-1 py-2">CmC Taken</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="hover:bg-gray-50 text-center text-[12px]">
              <td className="border border-gray-300 px-1 py-2">{row.srNo}</td>
              {row.values.map((v, idx) => (
                <td key={idx} className="border border-gray-300 px-1 py-2">{v}</td>
              ))}
              <td className="border border-gray-300 px-1 py-2">{row.unit}</td>
              <td className="border border-gray-300 px-1 py-2">{row.calibrationPoint}</td>
              <td className="border border-gray-300 px-1 py-2">{row.average}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.stdDeviation === 'number' ? row.stdDeviation.toFixed(6) : row.stdDeviation}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.typeA === 'number' ? row.typeA.toFixed(6) : row.typeA}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.uncertaintyMaster1 === 'number' ? row.uncertaintyMaster1.toFixed(6) : row.uncertaintyMaster1}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.uncertaintyMaster2Value === 'number' ? row.uncertaintyMaster2Value.toFixed(6) : row.uncertaintyMaster2Value}</td>
              <td className="border border-gray-300 px-1 py-2">{row.sensitivityCoefficient}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.uncertaintyMaster2Celsius === 'number' ? row.uncertaintyMaster2Celsius.toFixed(6) : row.uncertaintyMaster2Celsius}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.stabilityBath === 'number' ? row.stabilityBath.toFixed(6) : row.stabilityBath}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.uniformityBath === 'number' ? row.uniformityBath.toFixed(6) : row.uniformityBath}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.driftMaster === 'number' ? row.driftMaster.toFixed(6) : row.driftMaster}</td>
              <td className="border border-gray-300 px-1 py-2">{row.leastCountUuc}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.combinedUncertainty === 'number' ? row.combinedUncertainty.toFixed(6) : row.combinedUncertainty}</td>
              <td className="border border-gray-300 px-1 py-2">{row.degreeOfFreedom === '-' ? '-' : (typeof row.degreeOfFreedom === 'number' ? row.degreeOfFreedom.toFixed(2) : row.degreeOfFreedom)}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.coverageFactor === 'number' ? row.coverageFactor.toFixed(2) : row.coverageFactor}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.expandedUncertaintyValue === 'number' ? row.expandedUncertaintyValue.toFixed(6) : row.expandedUncertaintyValue}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.cmcTaken === 'number' ? row.cmcTaken.toFixed(6) : row.cmcTaken}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderMsrTable = () => (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[12px] text-gray-700 min-w-max">
        <thead>
          <tr className="bg-gray-100 text-center">
            <th colSpan="11" className="border border-gray-300 px-1 py-2 bg-gray-200 font-semibold text-xs">
              Type A Factor
            </th>
            <th colSpan="9" className="border border-gray-300 px-1 py-2 bg-gray-200 font-semibold text-xs">
              Type B Factor
            </th>
            <th colSpan="5" className="border border-gray-300 px-1 py-2 bg-gray-200 font-semibold text-xs">
              Uncertainty Measurement
            </th>
          </tr>
          <tr className="bg-gray-200 text-center text-[12px] font-medium">
            <th className="border border-gray-300 px-1 py-2">Sr no</th>
            <th className="border border-gray-300 px-1 py-2">Type Of Measurement</th>
            <th className="border border-gray-300 px-1 py-2">1</th>
            <th className="border border-gray-300 px-1 py-2">2</th>
            <th className="border border-gray-300 px-1 py-2">3</th>
            <th className="border border-gray-300 px-1 py-2">4</th>
            <th className="border border-gray-300 px-1 py-2">5</th>
            <th className="border border-gray-300 px-1 py-2">Unit</th>
            <th className="border border-gray-300 px-1 py-2">Calibration point</th>
            <th className="border border-gray-300 px-1 py-2">Average</th>
            <th className="border border-gray-300 px-1 py-2">Std Deviation</th>
            <th className="border border-gray-300 px-1 py-2">Type A</th>
            <th className="border border-gray-300 px-1 py-2">Uncertainty of Slip Gauge in mm</th>
            <th className="border border-gray-300 px-1 py-2">Uncertainty of Dial Gauge in mm</th>
            <th className="border border-gray-300 px-1 py-2">Flatness of Comparator Stand in mm</th>
            <th className="border border-gray-300 px-1 py-2">Least Count of Master</th>
            <th className="border border-gray-300 px-1 py-2">Thermal coefficient of Master</th>
            <th className="border border-gray-300 px-1 py-2">Thermal coefficient of UUC</th>
            <th className="border border-gray-300 px-1 py-2">Uncertainty due to Temperature Indicating Device (mm)</th>
            <th className="border border-gray-300 px-1 py-2">Standard uncertainty due to the thermal coefficient of expansion master and Unit Under Calibration assuming 20% (mm)</th>
            <th className="border border-gray-300 px-1 py-2">Standard uncertainty due to the difference in temperature master and Unit Under Calibration assuming 0.5˚C (mm)</th>
            <th className="border border-gray-300 px-1 py-2">Standard uncertainty due to Error in Master (Taken Half) in mm</th>
            <th className="border border-gray-300 px-1 py-2">Combined Uncertainty</th>
            <th className="border border-gray-300 px-1 py-2">Degree of Freedom</th>
            <th className="border border-gray-300 px-1 py-2">Coverage Factor (k)</th>
            <th className="border border-gray-300 px-1 py-2">Expanded Uncertainty in Value</th>
            <th className="border border-gray-300 px-1 py-2">CMC taken</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="hover:bg-gray-50 text-center text-[12px]">
              <td className="border border-gray-300 px-1 py-2">{row.srNo}</td>
              <td className="border border-gray-300 px-1 py-2 text-left">{row.typeOfMeasurement}</td>
              {row.values.map((v, idx) => (
                <td key={idx} className="border border-gray-300 px-1 py-2">{v}</td>
              ))}
              <td className="border border-gray-300 px-1 py-2">{row.unit}</td>
              <td className="border border-gray-300 px-1 py-2">{row.calibrationPoint}</td>
              <td className="border border-gray-300 px-1 py-2">{row.average}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.stdDeviation === 'number' ? row.stdDeviation.toFixed(6) : row.stdDeviation}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.typeA === 'number' ? row.typeA.toFixed(6) : row.typeA}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.uncertaintySlipGauge === 'number' ? row.uncertaintySlipGauge.toFixed(6) : row.uncertaintySlipGauge}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.uncertaintyDialGauge === 'number' ? row.uncertaintyDialGauge.toFixed(6) : row.uncertaintyDialGauge}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.flatnessComparatorStand === 'number' ? row.flatnessComparatorStand.toFixed(6) : row.flatnessComparatorStand}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.leastCountMaster === 'number' ? row.leastCountMaster.toFixed(6) : row.leastCountMaster}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.thermalCoeffMaster === 'number' ? row.thermalCoeffMaster.toFixed(6) : row.thermalCoeffMaster}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.thermalCoeffUuc === 'number' ? row.thermalCoeffUuc.toFixed(6) : row.thermalCoeffUuc}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.uncTempDevice === 'number' ? row.uncTempDevice.toFixed(6) : row.uncTempDevice}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.stdUncTher20 === 'number' ? row.stdUncTher20.toFixed(6) : row.stdUncTher20}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.stdUncDiff === 'number' ? row.stdUncDiff.toFixed(6) : row.stdUncDiff}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.uncError === 'number' ? row.uncError.toFixed(6) : row.uncError}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.combinedUnc === 'number' ? row.combinedUnc.toFixed(6) : row.combinedUnc}</td>
              <td className="border border-gray-300 px-1 py-2">{row.dof === '-' ? '-' : (typeof row.dof === 'number' ? row.dof.toFixed(2) : row.dof)}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.coverageFactor === 'number' ? row.coverageFactor.toFixed(2) : row.coverageFactor}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.expandedUnc === 'number' ? row.expandedUnc.toFixed(6) : row.expandedUnc}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.cmc === 'number' ? row.cmc.toFixed(6) : row.cmc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderDgTable = () => (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[12px] text-gray-700 min-w-max">
        <thead>
          <tr className="bg-gray-100 text-center">
            <th colSpan="11" className="border border-gray-300 px-1 py-2 bg-gray-200 font-semibold text-xs">
              Type A Factor
            </th>
            <th colSpan="8" className="border border-gray-300 px-1 py-2 bg-gray-200 font-semibold text-xs">
              Type B Factor
            </th>
            <th colSpan="6" className="border border-gray-300 px-1 py-2 bg-gray-200 font-semibold text-xs">
              Uncertainty Measurement
            </th>
          </tr>
          <tr className="bg-gray-200 text-center text-[12px] font-medium">
            <th className="border border-gray-300 px-1 py-2">Sr no</th>
            <th className="border border-gray-300 px-1 py-2">Reading on inc 1</th>
            <th className="border border-gray-300 px-1 py-2">Reading on Dec 2</th>
            <th className="border border-gray-300 px-1 py-2">Reading on Inc 3</th>
            <th className="border border-gray-300 px-1 py-2">Reading on Dec 4</th>
            <th className="border border-gray-300 px-1 py-2">Error in inc</th>
            <th className="border border-gray-300 px-1 py-2">Error in Dec</th>
            <th className="border border-gray-300 px-1 py-2">Hysterisis</th>
            <th className="border border-gray-300 px-1 py-2">Unit</th>
            <th className="border border-gray-300 px-1 py-2">Calibration point</th>
            <th className="border border-gray-300 px-1 py-2">Average</th>
            <th className="border border-gray-300 px-1 py-2">Std Deviation</th>
            <th className="border border-gray-300 px-1 py-2">Type A</th>
            <th className="border border-gray-300 px-1 py-2">Uncertainty of Slip Gauge in mm</th>
            <th className="border border-gray-300 px-1 py-2">Least Count of UUC</th>
            <th className="border border-gray-300 px-1 py-2">Thermal Coefficient of Master</th>
            <th className="border border-gray-300 px-1 py-2">Thermal Coefficient of UUC</th>
            <th className="border border-gray-300 px-1 py-2">Uncertainty due to Temperature Indicating Device (mm)</th>
            <th className="border border-gray-300 px-1 py-2">Standard uncertainty due to the thermal coefficient of expansion master and Unit Under Calibration assuming 20% (mm)</th>
            <th className="border border-gray-300 px-1 py-2">Standard uncertainty due to the difference in temperature master and Unit Under Calibration assuming 0.5˚C (mm)</th>
            <th className="border border-gray-300 px-1 py-2">Standard uncertainty due to Error in Master (Taken Half) in mm</th>
            <th className="border border-gray-300 px-1 py-2">Combined Uncertainty</th>
            <th className="border border-gray-300 px-1 py-2">Degree of Freedom</th>
            <th className="border border-gray-300 px-1 py-2">Coverage Factor (k)</th>
            <th className="border border-gray-300 px-1 py-2">Expanded Uncertainty in Value</th>
            <th className="border border-gray-300 px-1 py-2">CmC Taken</th>
            <th className="border border-gray-300 px-1 py-2">CmC Scope</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="hover:bg-gray-50 text-center text-[12px]">
              <td className="border border-gray-300 px-1 py-2">{row.srNo}</td>
              <td className="border border-gray-300 px-1 py-2">{row.readingInc1}</td>
              <td className="border border-gray-300 px-1 py-2">{row.readingDec2}</td>
              <td className="border border-gray-300 px-1 py-2">{row.readingInc3}</td>
              <td className="border border-gray-300 px-1 py-2">{row.readingDec4}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.errorInc === 'number' ? row.errorInc.toFixed(3) : row.errorInc}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.errorDec === 'number' ? row.errorDec.toFixed(3) : row.errorDec}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.hysterisis === 'number' ? row.hysterisis.toFixed(3) : row.hysterisis}</td>
              <td className="border border-gray-300 px-1 py-2">{row.unit}</td>
              <td className="border border-gray-300 px-1 py-2">{row.calibrationPoint}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.average === 'number' ? row.average.toFixed(3) : row.average}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.stdDeviation === 'number' ? row.stdDeviation.toFixed(6) : row.stdDeviation}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.typeA === 'number' ? row.typeA.toFixed(6) : row.typeA}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.uncertaintySlipGauge === 'number' ? row.uncertaintySlipGauge.toFixed(6) : row.uncertaintySlipGauge}</td>
              <td className="border border-gray-300 px-1 py-2">{row.leastCountUuc}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.thermalCoeffMaster === 'number' ? row.thermalCoeffMaster.toFixed(6) : row.thermalCoeffMaster}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.thermalCoeffUuc === 'number' ? row.thermalCoeffUuc.toFixed(6) : row.thermalCoeffUuc}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.uncTempDevice === 'number' ? row.uncTempDevice.toFixed(6) : row.uncTempDevice}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.stdUncTher20 === 'number' ? row.stdUncTher20.toFixed(6) : row.stdUncTher20}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.stdUncDiff === 'number' ? row.stdUncDiff.toFixed(6) : row.stdUncDiff}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.uncError === 'number' ? row.uncError.toFixed(6) : row.uncError}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.combinedUnc === 'number' ? row.combinedUnc.toFixed(6) : row.combinedUnc}</td>
              <td className="border border-gray-300 px-1 py-2">{row.dof === '-' ? '-' : (typeof row.dof === 'number' ? row.dof.toFixed(2) : row.dof)}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.coverageFactor === 'number' ? row.coverageFactor.toFixed(2) : row.coverageFactor}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.expandedUnc === 'number' ? row.expandedUnc.toFixed(6) : row.expandedUnc}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.cmcTaken === 'number' ? row.cmcTaken.toFixed(6) : row.cmcTaken}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.cmcScope === 'number' ? row.cmcScope.toFixed(6) : row.cmcScope}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderMgTable = () => (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[12px] text-gray-700 min-w-max">
        <thead>
          <tr className="bg-gray-200 text-center text-xs font-medium">
            <th rowSpan="2" className="border border-gray-300 px-2 py-2">Sr no</th>
            <th rowSpan="2" className="border border-gray-300 px-2 py-2">Set Pressure on UUC</th>
            <th colSpan="2" className="border border-gray-300 px-2 py-2 bg-gray-300">
              Observation on master ({data[0]?.masterUnit || "Pa"})
            </th>
            <th rowSpan="2" className="border border-gray-300 px-2 py-2">Mean ({data[0]?.masterUnit || "Pa"})</th>
            <th rowSpan="2" className="border border-gray-300 px-2 py-2">Error ({data[0]?.masterUnit || "Pa"})</th>
            <th rowSpan="2" className="border border-gray-300 px-2 py-2">Max Zero Error</th>
            <th rowSpan="2" className="border border-gray-300 px-2 py-2">Hysterisis ({data[0]?.masterUnit || "Pa"})</th>
            <th rowSpan="2" className="border border-gray-300 px-2 py-2">Repeatability ({data[0]?.masterUnit || "Pa"})</th>
            <th rowSpan="2" className="border border-gray-300 px-2 py-2">Leastcount of UUC</th>
            <th rowSpan="2" className="border border-gray-300 px-2 py-2">Uncertainty of Master</th>
            <th rowSpan="2" className="border border-gray-300 px-2 py-2">Combined Uncertainty</th>
            <th rowSpan="2" className="border border-gray-300 px-2 py-2">Degree of Freedom</th>
            <th rowSpan="2" className="border border-gray-300 px-2 py-2">Coverage Factor</th>
            <th rowSpan="2" className="border border-gray-300 px-2 py-2">Expanded Uncertainty</th>
            <th rowSpan="2" className="border border-gray-300 px-2 py-2">CMC Taken</th>
          </tr>
          <tr className="bg-gray-200 text-center text-xs font-medium">
            <th className="border border-gray-300 px-2 py-2">M1</th>
            <th className="border border-gray-300 px-2 py-2">M2</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="hover:bg-gray-50 text-center">
              <td className="border border-gray-300 px-2 py-2">{row.srNo}</td>
              <td className="border border-gray-300 px-2 py-2">{row.setPressure}</td>
              <td className="border border-gray-300 px-2 py-2">{row.masterObservationM1}</td>
              <td className="border border-gray-300 px-2 py-2">{row.masterObservationM2}</td>
              <td className="border border-gray-300 px-2 py-2">{typeof row.meanMaster === 'number' ? row.meanMaster.toFixed(2) : row.meanMaster}</td>
              <td className="border border-gray-300 px-2 py-2">{typeof row.error === 'number' ? row.error.toFixed(2) : row.error}</td>
              <td className="border border-gray-300 px-2 py-2">{typeof row.maxZeroError === 'number' ? row.maxZeroError.toFixed(4) : row.maxZeroError}</td>
              <td className="border border-gray-300 px-2 py-2">{typeof row.hysterisis === 'number' ? row.hysterisis.toFixed(2) : row.hysterisis}</td>
              <td className="border border-gray-300 px-2 py-2">{typeof row.repeatability === 'number' ? row.repeatability.toFixed(6) : row.repeatability}</td>
              <td className="border border-gray-300 px-2 py-2">{row.leastCountUuc}</td>
              <td className="border border-gray-300 px-2 py-2">{typeof row.uncertaintyMaster === 'number' ? row.uncertaintyMaster.toFixed(6) : row.uncertaintyMaster}</td>
              <td className="border border-gray-300 px-2 py-2">{typeof row.combinedUncertainty === 'number' ? row.combinedUncertainty.toFixed(6) : row.combinedUncertainty}</td>
              <td className="border border-gray-300 px-2 py-2">{row.degreeOfFreedom === '-' ? '-' : (typeof row.degreeOfFreedom === 'number' ? row.degreeOfFreedom.toFixed(2) : row.degreeOfFreedom)}</td>
              <td className="border border-gray-300 px-2 py-2">{typeof row.coverageFactor === 'number' ? row.coverageFactor.toFixed(2) : row.coverageFactor}</td>
              <td className="border border-gray-300 px-2 py-2">{typeof row.expandedUncertainty === 'number' ? row.expandedUncertainty.toFixed(6) : row.expandedUncertainty}</td>
              <td className="border border-gray-300 px-2 py-2">{typeof row.cmcTaken === 'number' ? row.cmcTaken.toFixed(6) : row.cmcTaken}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderExmTable = () => (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[12px] text-gray-700 min-w-max">
        <thead>
          <tr className="bg-gray-100 text-center">
            <th colSpan="11" className="border border-gray-300 px-1 py-2 bg-gray-200 font-semibold text-xs">
              Type A Factor
            </th>
            <th colSpan="9" className="border border-gray-300 px-1 py-2 bg-gray-200 font-semibold text-xs">
              Type B Factor
            </th>
            <th colSpan="5" className="border border-gray-300 px-1 py-2 bg-gray-200 font-semibold text-xs">
              Uncertainty Measurement
            </th>
          </tr>
          <tr className="bg-gray-200 text-center text-[12px] font-medium">
            <th className="border border-gray-300 px-1 py-2">Sr no</th>
            <th className="border border-gray-300 px-1 py-2">Type Of Measurement</th>
            <th className="border border-gray-300 px-1 py-2">1</th>
            <th className="border border-gray-300 px-1 py-2">2</th>
            <th className="border border-gray-300 px-1 py-2">3</th>
            <th className="border border-gray-300 px-1 py-2">4</th>
            <th className="border border-gray-300 px-1 py-2">5</th>
            <th className="border border-gray-300 px-1 py-2">Unit</th>
            <th className="border border-gray-300 px-1 py-2">Calibration point</th>
            <th className="border border-gray-300 px-1 py-2">Average</th>
            <th className="border border-gray-300 px-1 py-2">Std Deviation</th>
            <th className="border border-gray-300 px-1 py-2">Type A</th>
            <th className="border border-gray-300 px-1 py-2">Uncertainty of Slip Gauge in mm</th>
            <th className="border border-gray-300 px-1 py-2">Least Count of UUC</th>
            <th className="border border-gray-300 px-1 py-2">Thermal Coefficient of Master</th>
            <th className="border border-gray-300 px-1 py-2">Thermal Coefficient of UUC</th>
            <th className="border border-gray-300 px-1 py-2">Uncertainty due to Temperature Indicating Device (mm)</th>
            <th className="border border-gray-300 px-1 py-2">Standard uncertainty due to the thermal coefficient of expansion master and Unit Under Calibration assuming 20% (mm)</th>
            <th className="border border-gray-300 px-1 py-2">Standard uncertainty due to the difference in temperature master and Unit Under Calibration assuming 0.5˚C (mm)</th>
            <th className="border border-gray-300 px-1 py-2">Uncertainty Due Parallelism in (mm)</th>
            <th className="border border-gray-300 px-1 py-2">Standard uncertainty due to Error in Master (Taken Half) in mm</th>
            <th className="border border-gray-300 px-1 py-2">Combined Uncertainty</th>
            <th className="border border-gray-300 px-1 py-2">Degree of Freedom</th>
            <th className="border border-gray-300 px-1 py-2">Coverage Factor (k)</th>
            <th className="border border-gray-300 px-1 py-2">Expanded Uncertainty in Value</th>
            <th className="border border-gray-300 px-1 py-2">CMC taken</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="hover:bg-gray-50 text-center text-[12px]">
              <td className="border border-gray-300 px-1 py-2">{row.srNo}</td>
              <td className="border border-gray-300 px-1 py-2 text-left">{row.typeOfMeasurement}</td>
              {row.values.map((v, idx) => (
                <td key={idx} className="border border-gray-300 px-1 py-2">{v}</td>
              ))}
              <td className="border border-gray-300 px-1 py-2">{row.unit}</td>
              <td className="border border-gray-300 px-1 py-2">{row.calibrationPoint}</td>
              <td className="border border-gray-300 px-1 py-2">{row.average}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.stdDeviation === 'number' ? row.stdDeviation.toFixed(6) : row.stdDeviation}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.typeA === 'number' ? row.typeA.toFixed(6) : row.typeA}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.uncertaintySlipGauge === 'number' ? row.uncertaintySlipGauge.toFixed(6) : row.uncertaintySlipGauge}</td>
              <td className="border border-gray-300 px-1 py-2">{row.leastCountUuc}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.thermalCoeffMaster === 'number' ? row.thermalCoeffMaster.toFixed(6) : row.thermalCoeffMaster}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.thermalCoeffUuc === 'number' ? row.thermalCoeffUuc.toFixed(6) : row.thermalCoeffUuc}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.uncTempDevice === 'number' ? row.uncTempDevice.toFixed(6) : row.uncTempDevice}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.stdUncTher20 === 'number' ? row.stdUncTher20.toFixed(6) : row.stdUncTher20}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.stdUncDiff === 'number' ? row.stdUncDiff.toFixed(6) : row.stdUncDiff}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.uncParallelism === 'number' ? row.uncParallelism.toFixed(6) : row.uncParallelism}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.uncError === 'number' ? row.uncError.toFixed(6) : row.uncError}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.combinedUnc === 'number' ? row.combinedUnc.toFixed(6) : row.combinedUnc}</td>
              <td className="border border-gray-300 px-1 py-2">{row.dof === '-' ? '-' : (typeof row.dof === 'number' ? row.dof.toFixed(2) : row.dof)}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.coverageFactor === 'number' ? row.coverageFactor.toFixed(2) : row.coverageFactor}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.expandedUnc === 'number' ? row.expandedUnc.toFixed(6) : row.expandedUnc}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.cmc === 'number' ? row.cmc.toFixed(6) : row.cmc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderGtmTable = () => (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[12px] text-gray-700 min-w-max">
        <thead>
          <tr className="bg-gray-100 text-center">
            <th colSpan="11" className="border border-gray-300 px-1 py-2 bg-gray-200 font-semibold text-xs">
              Type A Factor
            </th>
            <th colSpan="7" className="border border-gray-300 px-1 py-2 bg-gray-200 font-semibold text-xs">
              Type B Factor
            </th>
            <th colSpan="5" className="border border-gray-300 px-1 py-2 bg-gray-200 font-semibold text-xs">
              Uncertainty Measurement
            </th>
          </tr>
          <tr className="bg-gray-200 text-center text-[12px] font-medium">
            <th className="border border-gray-300 px-1 py-2">Sr no</th>
            <th className="border border-gray-300 px-1 py-2">1</th>
            <th className="border border-gray-300 px-1 py-2">2</th>
            <th className="border border-gray-300 px-1 py-2">3</th>
            <th className="border border-gray-300 px-1 py-2">4</th>
            <th className="border border-gray-300 px-1 py-2">5</th>
            <th className="border border-gray-300 px-1 py-2">Unit</th>
            <th className="border border-gray-300 px-1 py-2">Calibration point</th>
            <th className="border border-gray-300 px-1 py-2">Average</th>
            <th className="border border-gray-300 px-1 py-2">Std Deviation</th>
            <th className="border border-gray-300 px-1 py-2">Type A</th>
            <th className="border border-gray-300 px-1 py-2">Uncertainty of master-1<br />Sensor in °C</th>
            <th className="border border-gray-300 px-1 py-2">Uncertainty of master-2<br />in (6.5DMM) in value</th>
            <th className="border border-gray-300 px-1 py-2">Sensitivity Coefficient</th>
            <th className="border border-gray-300 px-1 py-2">Uncertainty of master-2<br />in (°C)</th>
            <th className="border border-gray-300 px-1 py-2">Stability Of Bath</th>
            <th className="border border-gray-300 px-1 py-2">Uniformity Of Bath</th>
            <th className="border border-gray-300 px-1 py-2">Drift Of Master</th>
            <th className="border border-gray-300 px-1 py-2">Least Count of UUC</th>
            <th className="border border-gray-300 px-1 py-2">Combined Uncertainty</th>
            <th className="border border-gray-300 px-1 py-2">Degree of Freedom</th>
            <th className="border border-gray-300 px-1 py-2">Coverage Factor (k)</th>
            <th className="border border-gray-300 px-1 py-2">Expanded Uncertainty in Value</th>
            <th className="border border-gray-300 px-1 py-2">CmC Taken</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="hover:bg-gray-50 text-center text-[12px]">
              <td className="border border-gray-300 px-1 py-2">{row.srNo}</td>
              {row.values.map((v, idx) => (
                <td key={idx} className="border border-gray-300 px-1 py-2">{v}</td>
              ))}
              <td className="border border-gray-300 px-1 py-2">{row.unit}</td>
              <td className="border border-gray-300 px-1 py-2">{row.calibrationPoint}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.average === 'number' ? row.average.toFixed(3) : row.average}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.stdDeviation === 'number' ? row.stdDeviation.toFixed(6) : row.stdDeviation}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.typeA === 'number' ? row.typeA.toFixed(6) : row.typeA}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.uncertaintyMaster1 === 'number' ? row.uncertaintyMaster1.toFixed(6) : row.uncertaintyMaster1}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.uncertaintyMaster2Value === 'number' ? row.uncertaintyMaster2Value.toFixed(6) : row.uncertaintyMaster2Value}</td>
              <td className="border border-gray-300 px-1 py-2">{row.sensitivityCoefficient}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.uncertaintyMaster2Celsius === 'number' ? row.uncertaintyMaster2Celsius.toFixed(6) : row.uncertaintyMaster2Celsius}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.stabilityBath === 'number' ? row.stabilityBath.toFixed(6) : row.stabilityBath}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.uniformityBath === 'number' ? row.uniformityBath.toFixed(6) : row.uniformityBath}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.driftMaster === 'number' ? row.driftMaster.toFixed(6) : row.driftMaster}</td>
              <td className="border border-gray-300 px-1 py-2">{row.leastCountUuc}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.combinedUncertainty === 'number' ? row.combinedUncertainty.toFixed(6) : row.combinedUncertainty}</td>
              <td className="border border-gray-300 px-1 py-2">{row.degreeOfFreedom === '-' ? '-' : (typeof row.degreeOfFreedom === 'number' ? row.degreeOfFreedom.toFixed(2) : row.degreeOfFreedom)}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.coverageFactor === 'number' ? row.coverageFactor.toFixed(2) : row.coverageFactor}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.expandedUncertaintyValue === 'number' ? row.expandedUncertaintyValue.toFixed(6) : row.expandedUncertaintyValue}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.cmcTaken === 'number' ? row.cmcTaken.toFixed(6) : row.cmcTaken}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderTmTable = () => (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[12px] text-gray-700 min-w-max">
        <thead>
          <tr className="bg-gray-100 text-center">
            <th colSpan="16" className="border border-gray-300 px-1 py-2 bg-gray-200 font-semibold text-xs">
              Type A Factor
            </th>
            <th colSpan="3" className="border border-gray-300 px-1 py-2 bg-gray-200 font-semibold text-xs">
              Type B Factor
            </th>
            <th colSpan="6" className="border border-gray-300 px-1 py-2 bg-gray-200 font-semibold text-xs">
              Uncertainty Measurement
            </th>
          </tr>
          <tr className="bg-gray-200 text-center text-[12px] font-medium">
            <th className="border border-gray-300 px-1 py-2">Sr no</th>
            <th className="border border-gray-300 px-1 py-2">1</th>
            <th className="border border-gray-300 px-1 py-2">2</th>
            <th className="border border-gray-300 px-1 py-2">3</th>
            <th className="border border-gray-300 px-1 py-2">4</th>
            <th className="border border-gray-300 px-1 py-2">5</th>
            <th className="border border-gray-300 px-1 py-2">6</th>
            <th className="border border-gray-300 px-1 py-2">7</th>
            <th className="border border-gray-300 px-1 py-2">8</th>
            <th className="border border-gray-300 px-1 py-2">9</th>
            <th className="border border-gray-300 px-1 py-2">10</th>
            <th className="border border-gray-300 px-1 py-2">Unit</th>
            <th className="border border-gray-300 px-1 py-2">Calibration point</th>
            <th className="border border-gray-300 px-1 py-2">Average</th>
            <th className="border border-gray-300 px-1 py-2">Std Deviation</th>
            <th className="border border-gray-300 px-1 py-2">Type A</th>
            <th className="border border-gray-300 px-1 py-2">Accuracy Of Calibrator in Value</th>
            <th className="border border-gray-300 px-1 py-2">Uncertainty of master in %</th>
            <th className="border border-gray-300 px-1 py-2">Least Count of UUC</th>
            <th className="border border-gray-300 px-1 py-2">Combined Uncertainty</th>
            <th className="border border-gray-300 px-1 py-2">Degree of Freedom</th>
            <th className="border border-gray-300 px-1 py-2">Coverage Factor (k)</th>
            <th className="border border-gray-300 px-1 py-2">Expanded Uncertainty in Value</th>
            <th className="border border-gray-300 px-1 py-2">Expanded Uncertainty in %</th>
            <th className="border border-gray-300 px-1 py-2">CMC Taken</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="hover:bg-gray-50 text-center text-[12px]">
              <td className="border border-gray-300 px-1 py-2">{row.srNo}</td>
              {row.values.slice(0, 10).map((v, idx) => (
                <td key={idx} className="border border-gray-300 px-1 py-2">{v}</td>
              ))}
              <td className="border border-gray-300 px-1 py-2">{row.unit}</td>
              <td className="border border-gray-300 px-1 py-2">{row.calibrationPoint}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.average === 'number' ? row.average.toFixed(6) : row.average}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.stdDeviation === 'number' ? row.stdDeviation.toFixed(6) : row.stdDeviation}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.typeA === 'number' ? row.typeA.toFixed(6) : row.typeA}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.accuracyCalibrator === 'number' ? row.accuracyCalibrator.toFixed(6) : row.accuracyCalibrator}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.uncertaintyMaster === 'number' ? row.uncertaintyMaster.toFixed(6) : row.uncertaintyMaster}</td>
              <td className="border border-gray-300 px-1 py-2">{row.leastCount}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.combinedUnc === 'number' ? row.combinedUnc.toFixed(6) : row.combinedUnc}</td>
              <td className="border border-gray-300 px-1 py-2">{row.dof === '-' ? '-' : (typeof row.dof === 'number' ? row.dof.toFixed(2) : row.dof)}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.coverageFactor === 'number' ? row.coverageFactor.toFixed(2) : row.coverageFactor}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.expandedUncValue === 'number' ? row.expandedUncValue.toFixed(6) : row.expandedUncValue}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.expandedUncPercent === 'number' ? row.expandedUncPercent.toFixed(6) : row.expandedUncPercent}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.cmc === 'number' ? row.cmc.toFixed(6) : row.cmc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderAvgTable = () => (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[12px] text-gray-700 min-w-max">
        <thead>
          <tr className="bg-gray-200 text-center text-xs font-medium">
            <th rowSpan="2" className="border border-gray-300 px-2 py-2">Sr no</th>
            <th rowSpan="2" className="border border-gray-300 px-2 py-2">Set Pressure on UUC</th>
            <th colSpan="2" className="border border-gray-300 px-2 py-2 bg-gray-300">
              Observation on master ({data[0]?.masterUnit || "bar"})
            </th>
            <th rowSpan="2" className="border border-gray-300 px-2 py-2">Mean ({data[0]?.masterUnit || "bar"})</th>
            <th rowSpan="2" className="border border-gray-300 px-2 py-2">Error ({data[0]?.masterUnit || "bar"})</th>
            <th rowSpan="2" className="border border-gray-300 px-2 py-2">Max Zero Error</th>
            <th rowSpan="2" className="border border-gray-300 px-2 py-2">Hysterisis ({data[0]?.masterUnit || "bar"})</th>
            <th rowSpan="2" className="border border-gray-300 px-2 py-2">Repeatability ({data[0]?.masterUnit || "bar"})</th>
            <th rowSpan="2" className="border border-gray-300 px-2 py-2">Leastcount of UUC</th>
            <th rowSpan="2" className="border border-gray-300 px-2 py-2">Uncertainty of Master</th>
            <th rowSpan="2" className="border border-gray-300 px-2 py-2">Combined Uncertainty</th>
            <th rowSpan="2" className="border border-gray-300 px-2 py-2">Degree of Freedom</th>
            <th rowSpan="2" className="border border-gray-300 px-2 py-2">Coverage Factor</th>
            <th rowSpan="2" className="border border-gray-300 px-2 py-2">Expanded Uncertainty</th>
            <th rowSpan="2" className="border border-gray-300 px-2 py-2">CMC Taken</th>
            <th rowSpan="2" className="border border-gray-300 px-2 py-2">CMC scope</th>
          </tr>
          <tr className="bg-gray-200 text-center text-xs font-medium">
            <th className="border border-gray-300 px-2 py-2">M1</th>
            <th className="border border-gray-300 px-2 py-2">M2</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="hover:bg-gray-50 text-center">
              <td className="border border-gray-300 px-2 py-2">{row.srNo}</td>
              <td className="border border-gray-300 px-2 py-2">{row.setPressure}</td>
              <td className="border border-gray-300 px-2 py-2">{row.masterObservationM1}</td>
              <td className="border border-gray-300 px-2 py-2">{row.masterObservationM2}</td>
              <td className="border border-gray-300 px-2 py-2">{typeof row.meanMaster === 'number' ? row.meanMaster.toFixed(3) : row.meanMaster}</td>
              <td className="border border-gray-300 px-2 py-2">{typeof row.error === 'number' ? row.error.toFixed(3) : row.error}</td>
              <td className="border border-gray-300 px-2 py-2">{typeof row.maxZeroError === 'number' ? row.maxZeroError.toFixed(4) : row.maxZeroError}</td>
              <td className="border border-gray-300 px-2 py-2">{typeof row.hysterisis === 'number' ? row.hysterisis.toFixed(3) : row.hysterisis}</td>
              <td className="border border-gray-300 px-2 py-2">{typeof row.repeatability === 'number' ? row.repeatability.toFixed(6) : row.repeatability}</td>
              <td className="border border-gray-300 px-2 py-2">{typeof row.leastCountUuc === 'number' ? row.leastCountUuc.toFixed(6) : row.leastCountUuc}</td>
              <td className="border border-gray-300 px-2 py-2">{typeof row.uncertaintyMaster === 'number' ? row.uncertaintyMaster.toFixed(6) : row.uncertaintyMaster}</td>
              <td className="border border-gray-300 px-2 py-2">{typeof row.combinedUncertainty === 'number' ? row.combinedUncertainty.toFixed(6) : row.combinedUncertainty}</td>
              <td className="border border-gray-300 px-2 py-2">{row.degreeOfFreedom === '-' ? '-' : (typeof row.degreeOfFreedom === 'number' ? row.degreeOfFreedom.toFixed(2) : row.degreeOfFreedom)}</td>
              <td className="border border-gray-300 px-2 py-2">{typeof row.coverageFactor === 'number' ? row.coverageFactor.toFixed(2) : row.coverageFactor}</td>
              <td className="border border-gray-300 px-2 py-2">{typeof row.expandedUncertainty === 'number' ? row.expandedUncertainty.toFixed(6) : row.expandedUncertainty}</td>
              <td className="border border-gray-300 px-2 py-2">{typeof row.cmcTaken === 'number' ? row.cmcTaken.toFixed(6) : row.cmcTaken}</td>
              <td className="border border-gray-300 px-2 py-2">{typeof row.cmcScope === 'number' ? row.cmcScope.toFixed(6) : row.cmcScope}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderFgTable = () => (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[12px] text-gray-700 min-w-max">
        <thead>
          <tr className="bg-gray-100 text-center">
            <th colSpan="11" className="border border-gray-300 px-1 py-2 bg-gray-200 font-semibold text-xs">
              Type A Factor
            </th>
            <th colSpan="9" className="border border-gray-300 px-1 py-2 bg-gray-200 font-semibold text-xs">
              Type B Factor
            </th>
            <th colSpan="5" className="border border-gray-300 px-1 py-2 bg-gray-200 font-semibold text-xs">
              Uncertainty Measurement
            </th>
          </tr>
          <tr className="bg-gray-200 text-center text-[12px] font-medium">
            <th className="border border-gray-300 px-1 py-2">Sr no</th>
            <th className="border border-gray-300 px-1 py-2">1</th>
            <th className="border border-gray-300 px-1 py-2">2</th>
            <th className="border border-gray-300 px-1 py-2">3</th>
            <th className="border border-gray-300 px-1 py-2">4</th>
            <th className="border border-gray-300 px-1 py-2">5</th>
            <th className="border border-gray-300 px-1 py-2">Unit</th>
            <th className="border border-gray-300 px-1 py-2">Calibration point</th>
            <th className="border border-gray-300 px-1 py-2">Average</th>
            <th className="border border-gray-300 px-1 py-2">Std Deviation</th>
            <th className="border border-gray-300 px-1 py-2">Type A</th>
            <th className="border border-gray-300 px-1 py-2">Uncertainty of Master in (mm)</th>
            <th className="border border-gray-300 px-1 py-2">Least Count of master</th>
            <th className="border border-gray-300 px-1 py-2">Thermal Coefficient of Master</th>
            <th className="border border-gray-300 px-1 py-2">Thermal Coefficient of UUC</th>
            <th className="border border-gray-300 px-1 py-2">Uncertainty due to Temperature Indicating Device (mm)</th>
            <th className="border border-gray-300 px-1 py-2">Standard uncertainty due to the thermal coefficient of expansion master and Unit Under Calibration assuming 20% (mm)</th>
            <th className="border border-gray-300 px-1 py-2">Standard uncertainty due to the difference in temperature master and Unit Under Calibration assuming 0.5˚C (mm)</th>
            <th className="border border-gray-300 px-1 py-2">Uncertainty Due Parallelism in (mm)</th>
            <th className="border border-gray-300 px-1 py-2">Standard uncertainty due to Error in Master (Taken Half) in mm</th>
            <th className="border border-gray-300 px-1 py-2">Combined Uncertainty</th>
            <th className="border border-gray-300 px-1 py-2">Degree of Freedom</th>
            <th className="border border-gray-300 px-1 py-2">Coverage Factor (k)</th>
            <th className="border border-gray-300 px-1 py-2">Expanded Uncertainty in Value</th>
            <th className="border border-gray-300 px-1 py-2">CMC Taken</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="hover:bg-gray-50 text-center text-[12px]">
              <td className="border border-gray-300 px-1 py-2">{row.srNo}</td>
              {row.values.map((v, idx) => (
                <td key={idx} className="border border-gray-300 px-1 py-2">{v}</td>
              ))}
              <td className="border border-gray-300 px-1 py-2">{row.unit}</td>
              <td className="border border-gray-300 px-1 py-2">{row.calibrationPoint}</td>
              <td className="border border-gray-300 px-1 py-2">{row.average}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.stdDeviation === 'number' ? row.stdDeviation.toFixed(6) : row.stdDeviation}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.typeA === 'number' ? row.typeA.toFixed(6) : row.typeA}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.uncertaintyOfMaster === 'number' ? row.uncertaintyOfMaster.toFixed(6) : row.uncertaintyOfMaster}</td>
              <td className="border border-gray-300 px-1 py-2">{row.leastCountMaster}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.thermalCoeffMaster === 'number' ? row.thermalCoeffMaster.toFixed(6) : row.thermalCoeffMaster}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.thermalCoeffUuc === 'number' ? row.thermalCoeffUuc.toFixed(6) : row.thermalCoeffUuc}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.uncTempDevice === 'number' ? row.uncTempDevice.toFixed(6) : row.uncTempDevice}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.stdUncTher20 === 'number' ? row.stdUncTher20.toFixed(6) : row.stdUncTher20}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.stdUncDiff === 'number' ? row.stdUncDiff.toFixed(6) : row.stdUncDiff}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.uncParallelism === 'number' ? row.uncParallelism.toFixed(6) : row.uncParallelism}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.uncError === 'number' ? row.uncError.toFixed(6) : row.uncError}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.combinedUnc === 'number' ? row.combinedUnc.toFixed(6) : row.combinedUnc}</td>
              <td className="border border-gray-300 px-1 py-2">{row.dof === '-' ? '-' : (typeof row.dof === 'number' ? row.dof.toFixed(2) : row.dof)}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.coverageFactor === 'number' ? row.coverageFactor.toFixed(2) : row.coverageFactor}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.expandedUnc === 'number' ? row.expandedUnc.toFixed(6) : row.expandedUnc}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.cmc === 'number' ? row.cmc.toFixed(6) : row.cmc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderItTable = () => (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[12px] text-gray-700 min-w-max">
        <thead>
          <tr className="bg-gray-100 text-center">
            <th colSpan="12" className="border border-gray-300 px-1 py-2 bg-gray-200 font-semibold text-xs">
              Type A Factor
            </th>
            <th colSpan="7" className="border border-gray-300 px-1 py-2 bg-gray-200 font-semibold text-xs">
              Type B Factor
            </th>
            <th colSpan="5" className="border border-gray-300 px-1 py-2 bg-gray-200 font-semibold text-xs">
              Uncertainty Measurement
            </th>
          </tr>
          <tr className="bg-gray-200 text-center text-[12px] font-medium">
            <th className="border border-gray-300 px-1 py-2">Sr No</th>
            <th className="border border-gray-300 px-1 py-2">Type Of Measurement</th>
            <th className="border border-gray-300 px-1 py-2">1</th>
            <th className="border border-gray-300 px-1 py-2">2</th>
            <th className="border border-gray-300 px-1 py-2">3</th>
            <th className="border border-gray-300 px-1 py-2">4</th>
            <th className="border border-gray-300 px-1 py-2">5</th>
            <th className="border border-gray-300 px-1 py-2">Unit</th>
            <th className="border border-gray-300 px-1 py-2">Calibration Point</th>
            <th className="border border-gray-300 px-1 py-2">Average</th>
            <th className="border border-gray-300 px-1 py-2">Std Deviation</th>
            <th className="border border-gray-300 px-1 py-2">Type A</th>
            <th className="border border-gray-300 px-1 py-2">Uncertainty of Master in mm</th>
            <th className="border border-gray-300 px-1 py-2">Least Count of Master</th>
            <th className="border border-gray-300 px-1 py-2">Thermal Coefficient of Master</th>
            <th className="border border-gray-300 px-1 py-2">Thermal Coefficient of UUC</th>
            <th className="border border-gray-300 px-1 py-2">Uncertainty due to Temperature Indicating Device (mm)</th>
            <th className="border border-gray-300 px-1 py-2">Standard Uncertainty due to the Thermal Coefficient of Expansion Master and Unit Under Calibration assuming 20% (mm)</th>
            <th className="border border-gray-300 px-1 py-2">Standard Uncertainty due to the Difference in Temperature Master and Unit Under Calibration assuming 0.5°C (mm)</th>
            <th className="border border-gray-300 px-1 py-2">Standard Uncertainty due to Error in Master (Taken Half) in mm</th>
            <th className="border border-gray-300 px-1 py-2">Combined Uncertainty</th>
            <th className="border border-gray-300 px-1 py-2">Degree of Freedom</th>
            <th className="border border-gray-300 px-1 py-2">Coverage Factor (k)</th>
            <th className="border border-gray-300 px-1 py-2">Expanded Uncertainty in Value</th>
            <th className="border border-gray-300 px-1 py-2">CMC Scope</th>
            <th className="border border-gray-300 px-1 py-2">CMC Taken</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="hover:bg-gray-50 text-center text-[12px]">
              <td className="border border-gray-300 px-1 py-2">{row.srNo}</td>
              <td className="border border-gray-300 px-1 py-2">{row.matrixType}</td>
              {row.values.map((v, idx) => (
                <td key={idx} className="border border-gray-300 px-1 py-2">{v}</td>
              ))}
              <td className="border border-gray-300 px-1 py-2">{row.unit}</td>
              <td className="border border-gray-300 px-1 py-2">{row.calibrationPoint}</td>
              <td className="border border-gray-300 px-1 py-2">{row.average}</td>
              <td className="border border-gray-300 px-1 py-2">
                {typeof row.stdDeviation === 'number' ? row.stdDeviation.toFixed(6) : row.stdDeviation}
              </td>
              <td className="border border-gray-300 px-1 py-2">
                {typeof row.typeA === 'number' ? row.typeA.toFixed(6) : row.typeA}
              </td>
              <td className="border border-gray-300 px-1 py-2">
                {typeof row.uncertaintyOfMaster === 'number' ? row.uncertaintyOfMaster.toFixed(6) : row.uncertaintyOfMaster}
              </td>
              <td className="border border-gray-300 px-1 py-2">{row.leastCountMaster}</td>
              <td className="border border-gray-300 px-1 py-2">
                {typeof row.thermalCoeffMaster === 'number' ? row.thermalCoeffMaster.toFixed(6) : row.thermalCoeffMaster}
              </td>
              <td className="border border-gray-300 px-1 py-2">
                {typeof row.thermalCoeffUuc === 'number' ? row.thermalCoeffUuc.toFixed(6) : row.thermalCoeffUuc}
              </td>
              <td className="border border-gray-300 px-1 py-2">
                {typeof row.uncTempDevice === 'number' ? row.uncTempDevice.toFixed(6) : row.uncTempDevice}
              </td>
              <td className="border border-gray-300 px-1 py-2">
                {typeof row.stdUncTher20 === 'number' ? row.stdUncTher20.toFixed(6) : row.stdUncTher20}
              </td>
              <td className="border border-gray-300 px-1 py-2">
                {typeof row.stdUncDiff === 'number' ? row.stdUncDiff.toFixed(6) : row.stdUncDiff}
              </td>
              <td className="border border-gray-300 px-1 py-2">
                {typeof row.uncError === 'number' ? row.uncError.toFixed(6) : row.uncError}
              </td>
              <td className="border border-gray-300 px-1 py-2">
                {typeof row.combinedUnc === 'number' ? row.combinedUnc.toFixed(6) : row.combinedUnc}
              </td>
              <td className="border border-gray-300 px-1 py-2">
                {row.dof === '-' ? '-' : (typeof row.dof === 'number' ? row.dof.toFixed(2) : row.dof)}
              </td>
              <td className="border border-gray-300 px-1 py-2">
                {typeof row.coverageFactor === 'number' ? row.coverageFactor.toFixed(2) : row.coverageFactor}
              </td>
              <td className="border border-gray-300 px-1 py-2">
                {typeof row.expandedUnc === 'number' ? row.expandedUnc.toFixed(6) : row.expandedUnc}
              </td>
              <td className="border border-gray-300 px-1 py-2">
                {typeof row.cmcScope === 'number' ? row.cmcScope.toFixed(6) : row.cmcScope}
              </td>
              <td className="border border-gray-300 px-1 py-2">
                {typeof row.cmc === 'number' ? row.cmc.toFixed(6) : row.cmc}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderHgTable = () => (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[12px] text-gray-700 min-w-max">
        <thead>
          <tr className="bg-gray-100 text-center">
            <th colSpan="11" className="border border-gray-300 px-1 py-2 bg-gray-200 font-semibold text-xs">
              Type A Factor
            </th>
            <th colSpan="10" className="border border-gray-300 px-1 py-2 bg-gray-200 font-semibold text-xs">
              Type B Factor
            </th>
            <th colSpan="5" className="border border-gray-300 px-1 py-2 bg-gray-200 font-semibold text-xs">
              Uncertainty Measurement
            </th>
          </tr>
          <tr className="bg-gray-200 text-center text-[12px] font-medium">
            <th className="border border-gray-300 px-1 py-2">Sr no</th>
            <th className="border border-gray-300 px-1 py-2">Type Of Measurement</th>
            <th className="border border-gray-300 px-1 py-2">1</th>
            <th className="border border-gray-300 px-1 py-2">2</th>
            <th className="border border-gray-300 px-1 py-2">3</th>
            <th className="border border-gray-300 px-1 py-2">4</th>
            <th className="border border-gray-300 px-1 py-2">5</th>
            <th className="border border-gray-300 px-1 py-2">Unit</th>
            <th className="border border-gray-300 px-1 py-2">Calibration point</th>
            <th className="border border-gray-300 px-1 py-2">Average</th>
            <th className="border border-gray-300 px-1 py-2">Std Deviation</th>
            <th className="border border-gray-300 px-1 py-2">Type A</th>
            <th className="border border-gray-300 px-1 py-2">Uncertainty of master in mm</th>
            <th className="border border-gray-300 px-1 py-2">Flatness of Surface plate in (mm)</th>
            <th className="border border-gray-300 px-1 py-2">Least Count of UUC</th>
            <th className="border border-gray-300 px-1 py-2">Thermal Coefficient of Master</th>
            <th className="border border-gray-300 px-1 py-2">Thermal Coefficient of UUC</th>
            <th className="border border-gray-300 px-1 py-2">Uncertainty due to Temperature Indicating Device (mm)</th>
            <th className="border border-gray-300 px-1 py-2">Standard uncertainty due to the thermal coefficient of expansion master and Unit Under Calibration assuming 20% (mm)</th>
            <th className="border border-gray-300 px-1 py-2">Standard uncertainty due to the difference in temperature master and Unit Under Calibration assuming 0.5˚C (mm)</th>
            <th className="border border-gray-300 px-1 py-2">Uncertainty Due Parallelism in (mm)</th>
            <th className="border border-gray-300 px-1 py-2">Standard uncertainty due to Error in Master (Taken Half) in mm</th>
            <th className="border border-gray-300 px-1 py-2">Combined Uncertainty</th>
            <th className="border border-gray-300 px-1 py-2">Degree of Freedom</th>
            <th className="border border-gray-300 px-1 py-2">Coverage Factor (k)</th>
            <th className="border border-gray-300 px-1 py-2">Expanded Uncertainty in Value</th>
            <th className="border border-gray-300 px-1 py-2">CMC taken</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="hover:bg-gray-50 text-center text-[12px]">
              <td className="border border-gray-300 px-1 py-2">{row.srNo}</td>
              <td className="border border-gray-300 px-1 py-2">{row.typeOfMeasurement}</td>
              {row.values.map((v, idx) => (
                <td key={idx} className="border border-gray-300 px-1 py-2">{v}</td>
              ))}
              <td className="border border-gray-300 px-1 py-2">{row.unit}</td>
              <td className="border border-gray-300 px-1 py-2">{row.calibrationPoint}</td>
              <td className="border border-gray-300 px-1 py-2">{row.average}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.stdDeviation === 'number' ? row.stdDeviation.toFixed(6) : row.stdDeviation}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.typeA === 'number' ? row.typeA.toFixed(6) : row.typeA}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.uncertaintyOfMaster === 'number' ? row.uncertaintyOfMaster.toFixed(6) : row.uncertaintyOfMaster}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.flatnessSurfacePlate === 'number' ? row.flatnessSurfacePlate.toFixed(6) : row.flatnessSurfacePlate}</td>
              <td className="border border-gray-300 px-1 py-2">{row.leastCountUuc}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.thermalCoeffMaster === 'number' ? row.thermalCoeffMaster.toFixed(6) : row.thermalCoeffMaster}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.thermalCoeffUuc === 'number' ? row.thermalCoeffUuc.toFixed(6) : row.thermalCoeffUuc}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.uncTempDevice === 'number' ? row.uncTempDevice.toFixed(6) : row.uncTempDevice}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.stdUncTher20 === 'number' ? row.stdUncTher20.toFixed(6) : row.stdUncTher20}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.stdUncDiff === 'number' ? row.stdUncDiff.toFixed(6) : row.stdUncDiff}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.uncParallelism === 'number' ? row.uncParallelism.toFixed(6) : row.uncParallelism}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.uncError === 'number' ? row.uncError.toFixed(6) : row.uncError}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.combinedUnc === 'number' ? row.combinedUnc.toFixed(6) : row.combinedUnc}</td>
              <td className="border border-gray-300 px-1 py-2">{row.dof === '-' ? '-' : (typeof row.dof === 'number' ? row.dof.toFixed(2) : row.dof)}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.coverageFactor === 'number' ? row.coverageFactor.toFixed(2) : row.coverageFactor}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.expandedUnc === 'number' ? row.expandedUnc.toFixed(6) : row.expandedUnc}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.cmc === 'number' ? row.cmc.toFixed(6) : row.cmc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );


  const renderPpgTable = () => (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[12px] text-gray-700 min-w-max">
        <thead>
          <tr className="bg-gray-200 text-center text-xs font-medium">
            <th rowSpan="2" className="border border-gray-300 px-2 py-2">Sr no</th>
            <th rowSpan="2" className="border border-gray-300 px-2 py-2">Set Pressure on UUC</th>
            <th colSpan="6" className="border border-gray-300 px-2 py-2 bg-gray-300">
              Observation on master ({data[0]?.masterUnit || "bar"})
            </th>
            <th rowSpan="2" className="border border-gray-300 px-2 py-2">Mean ({data[0]?.masterUnit || "bar"})</th>
            <th rowSpan="2" className="border border-gray-300 px-2 py-2">Error ({data[0]?.masterUnit || "bar"})</th>
            <th rowSpan="2" className="border border-gray-300 px-2 py-2">Max Zero Error</th>
            <th rowSpan="2" className="border border-gray-300 px-2 py-2">Hysterisis ({data[0]?.masterUnit || "bar"})</th>
            <th rowSpan="2" className="border border-gray-300 px-2 py-2">Repeatability ({data[0]?.masterUnit || "bar"})</th>
            <th rowSpan="2" className="border border-gray-300 px-2 py-2">Leastcount of UUC</th>
            <th rowSpan="2" className="border border-gray-300 px-2 py-2">Uncertainty of Master</th>
            <th rowSpan="2" className="border border-gray-300 px-2 py-2">Combined Uncertainty</th>
            <th rowSpan="2" className="border border-gray-300 px-2 py-2">Degree of Freedom</th>
            <th rowSpan="2" className="border border-gray-300 px-2 py-2">Coverage Factor</th>
            <th rowSpan="2" className="border border-gray-300 px-2 py-2">Expanded Uncertainty</th>
            <th rowSpan="2" className="border border-gray-300 px-2 py-2">CMC Taken</th>
          </tr>
          <tr className="bg-gray-200 text-center text-xs font-medium">
            <th className="border border-gray-300 px-2 py-2">M1</th>
            <th className="border border-gray-300 px-2 py-2">M2</th>
            <th className="border border-gray-300 px-2 py-2">M3</th>
            <th className="border border-gray-300 px-2 py-2">M4</th>
            <th className="border border-gray-300 px-2 py-2">M5</th>
            <th className="border border-gray-300 px-2 py-2">M6</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="hover:bg-gray-50 text-center">
              <td className="border border-gray-300 px-2 py-2">{row.srNo}</td>
              <td className="border border-gray-300 px-2 py-2">{row.setPressure}</td>
              {row.masterObservations.map((obs, idx) => (
                <td key={idx} className="border border-gray-300 px-2 py-2">{obs}</td>
              ))}
              <td className="border border-gray-300 px-2 py-2">{typeof row.meanMaster === 'number' ? row.meanMaster.toFixed(2) : row.meanMaster}</td>
              <td className="border border-gray-300 px-2 py-2">{typeof row.error === 'number' ? row.error.toFixed(2) : row.error}</td>
              <td className="border border-gray-300 px-2 py-2">{typeof row.maxZeroError === 'number' ? row.maxZeroError.toFixed(4) : row.maxZeroError}</td>
              <td className="border border-gray-300 px-2 py-2">{typeof row.hysterisis === 'number' ? row.hysterisis.toFixed(2) : row.hysterisis}</td>
              <td className="border border-gray-300 px-2 py-2">{typeof row.repeatability === 'number' ? row.repeatability.toFixed(2) : row.repeatability}</td>
              <td className="border border-gray-300 px-2 py-2">{row.leastCountUuc}</td>
              <td className="border border-gray-300 px-2 py-2">{typeof row.uncertaintyMaster === 'number' ? row.uncertaintyMaster.toFixed(6) : row.uncertaintyMaster}</td>
              <td className="border border-gray-300 px-2 py-2">{typeof row.combinedUncertainty === 'number' ? row.combinedUncertainty.toFixed(6) : row.combinedUncertainty}</td>
              <td className="border border-gray-300 px-2 py-2">{row.degreeOfFreedom === '-' ? '-' : (typeof row.degreeOfFreedom === 'number' ? row.degreeOfFreedom.toFixed(2) : row.degreeOfFreedom)}</td>
              <td className="border border-gray-300 px-2 py-2">{typeof row.coverageFactor === 'number' ? row.coverageFactor.toFixed(2) : row.coverageFactor}</td>
              <td className="border border-gray-300 px-2 py-2">{typeof row.expandedUncertainty === 'number' ? row.expandedUncertainty.toFixed(6) : row.expandedUncertainty}</td>
              <td className="border border-gray-300 px-2 py-2">{typeof row.cmcTaken === 'number' ? row.cmcTaken.toFixed(6) : row.cmcTaken}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderDpgTable = () => (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[12px] text-gray-700 min-w-max">
        <thead>
          <tr className="bg-gray-200 text-center text-xs font-medium">
            <th className="border border-gray-300 px-2 py-2">Sr No</th>
            <th className="border border-gray-300 px-2 py-2">Set Pressure on UUC</th>
            <th className="border border-gray-300 px-2 py-2">M1</th>
            <th className="border border-gray-300 px-2 py-2">M2</th>
            <th className="border border-gray-300 px-2 py-2">M3</th>
            <th className="border border-gray-300 px-2 py-2">Mean (bar)</th>
            <th className="border border-gray-300 px-2 py-2">Error (bar)</th>
            <th className="border border-gray-300 px-2 py-2">Max Zero Error</th>
            <th className="border border-gray-300 px-2 py-2">Hysterisis (bar)</th>
            <th className="border border-gray-300 px-2 py-2">Repeatability (bar)</th>
            <th className="border border-gray-300 px-2 py-2">Least Count of UUC</th>
            <th className="border border-gray-300 px-2 py-2">Uncertainty of Master</th>
            <th className="border border-gray-300 px-2 py-2">Combined Uncertainty</th>
            <th className="border border-gray-300 px-2 py-2">Degree of Freedom</th>
            <th className="border border-gray-300 px-2 py-2">Coverage Factor</th>
            <th className="border border-gray-300 px-2 py-2">Expanded Uncertainty</th>
            <th className="border border-gray-300 px-2 py-2">CMC Taken</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="hover:bg-gray-50 text-center">
              <td className="border border-gray-300 px-2 py-2">{row.srNo}</td>
              <td className="border border-gray-300 px-2 py-2">{row.setPressure}</td>
              <td className="border border-gray-300 px-2 py-2">{row.m1}</td>
              <td className="border border-gray-300 px-2 py-2">{row.m2}</td>
              <td className="border border-gray-300 px-2 py-2">{row.m3}</td>
              <td className="border border-gray-300 px-2 py-2">{row.mean}</td>
              <td className="border border-gray-300 px-2 py-2">{row.error}</td>
              <td className="border border-gray-300 px-2 py-2">{row.maxZeroError}</td>
              <td className="border border-gray-300 px-2 py-2">{row.hysterisis}</td>
              <td className="border border-gray-300 px-2 py-2">{row.repeatability}</td>
              <td className="border border-gray-300 px-2 py-2">{row.leastcount}</td>
              <td className="border border-gray-300 px-2 py-2">{row.masterUncertainty}</td>
              <td className="border border-gray-300 px-2 py-2">{row.combinedUncertainty}</td>
              <td className="border border-gray-300 px-2 py-2">{row.degreeOfFreedom}</td>
              <td className="border border-gray-300 px-2 py-2">{row.coverageFactor}</td>
              <td className="border border-gray-300 px-2 py-2">{row.expandedUncertainty}</td>
              <td className="border border-gray-300 px-2 py-2">{row.cmcTaken}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderMmTable = () => (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[12px] text-gray-700 min-w-max">
        <thead>
          <tr className="bg-gray-100 text-center">
            <th colSpan="12" className="border border-gray-300 px-1 py-2 bg-gray-200 font-semibold text-xs">
              Uncertainty Type A
            </th>
            <th colSpan="4" className="border border-gray-300 px-1 py-2 bg-gray-200 font-semibold text-xs">
              Uncertainty Type B
            </th>
            <th colSpan="7" className="border border-gray-300 px-1 py-2 bg-gray-200 font-semibold text-xs">
              Combined Uncertainty
            </th>
          </tr>
          <tr className="bg-gray-200 text-center text-[12px] font-medium">
            <th className="border border-gray-300 px-1 py-2">Sr No</th>
            <th className="border border-gray-300 px-1 py-2">Unit Type</th>
            <th className="border border-gray-300 px-1 py-2">Mode</th>
            <th className="border border-gray-300 px-1 py-2">UUC 1</th>
            <th className="border border-gray-300 px-1 py-2">UUC 2</th>
            <th className="border border-gray-300 px-1 py-2">UUC 3</th>
            <th className="border border-gray-300 px-1 py-2">UUC 4</th>
            <th className="border border-gray-300 px-1 py-2">UUC 5</th>
            <th className="border border-gray-300 px-1 py-2">Unit</th>
            <th className="border border-gray-300 px-1 py-2">Calibration Point</th>
            <th className="border border-gray-300 px-1 py-2">Average</th>
            <th className="border border-gray-300 px-1 py-2">Std Deviation</th>
            <th className="border border-gray-300 px-1 py-2">Type A</th>
            <th className="border border-gray-300 px-1 py-2">Accuracy of Calibrator</th>
            <th className="border border-gray-300 px-1 py-2">Uncertainty of Master</th>
            <th className="border border-gray-300 px-1 py-2">Least Count of UUC</th>
            <th className="border border-gray-300 px-1 py-2">Combined Uncertainty</th>
            <th className="border border-gray-300 px-1 py-2">Degree of Freedom</th>
            <th className="border border-gray-300 px-1 py-2">Coverage Factor</th>
            <th className="border border-gray-300 px-1 py-2">Expanded Uncertainty Value</th>
            <th className="border border-gray-300 px-1 py-2">Expanded Uncertainty %</th>
            <th className="border border-gray-300 px-1 py-2">CMC Taken</th>
            <th className="border border-gray-300 px-1 py-2">CMC Scope</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="hover:bg-gray-50 text-center text-[12px]">
              <td className="border border-gray-300 px-1 py-2">{row.srNo}</td>
              <td className="border border-gray-300 px-1 py-2 text-left text-[8px]">{row.unitType}</td>
              <td className="border border-gray-300 px-1 py-2">{row.mode}</td>
              <td className="border border-gray-300 px-1 py-2">{row.uuc0}</td>
              <td className="border border-gray-300 px-1 py-2">{row.uuc1}</td>
              <td className="border border-gray-300 px-1 py-2">{row.uuc2}</td>
              <td className="border border-gray-300 px-1 py-2">{row.uuc3}</td>
              <td className="border border-gray-300 px-1 py-2">{row.uuc4}</td>
              <td className="border border-gray-300 px-1 py-2">{row.unit}</td>
              <td className="border border-gray-300 px-1 py-2">{row.calibrationPoint}</td>
              <td className="border border-gray-300 px-1 py-2">{row.average}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.stdDeviation === 'number' ? row.stdDeviation.toFixed(6) : row.stdDeviation}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.typeA === 'number' ? row.typeA.toFixed(6) : row.typeA}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.accuracyOfCalibrator === 'number' ? row.accuracyOfCalibrator.toFixed(6) : row.accuracyOfCalibrator}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.uncertaintyOfMaster === 'number' ? row.uncertaintyOfMaster.toFixed(6) : row.uncertaintyOfMaster}</td>
              <td className="border border-gray-300 px-1 py-2">{row.leastCountOfUuc}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.combinedUncertainty === 'number' ? row.combinedUncertainty.toFixed(6) : row.combinedUncertainty}</td>
              <td className="border border-gray-300 px-1 py-2">{row.degreeOfFreedom === '-' ? '-' : (typeof row.degreeOfFreedom === 'number' ? row.degreeOfFreedom.toFixed(2) : row.degreeOfFreedom)}</td>
              <td className="border border-gray-300 px-1 py-2">{row.coverageFactor}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.expandedUncertaintyValue === 'number' ? row.expandedUncertaintyValue.toFixed(6) : row.expandedUncertaintyValue}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.expandedUncertaintyPercent === 'number' ? row.expandedUncertaintyPercent.toFixed(6) : row.expandedUncertaintyPercent}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.cmcTaken === 'number' ? row.cmcTaken.toFixed(6) : row.cmcTaken}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.cmcScope === 'number' ? row.cmcScope.toFixed(6) : row.cmcScope}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderOdfmTable = () => (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[12px] text-gray-700 min-w-max">
        <thead>
          <tr className="bg-gray-100 text-center">
            <th colSpan="11" className="border border-gray-300 px-1 py-2 bg-gray-200 font-semibold text-xs">
              Type A Factor
            </th>
            <th colSpan="8" className="border border-gray-300 px-1 py-2 bg-gray-200 font-semibold text-xs">
              Type B Factor
            </th>
            <th colSpan="5" className="border border-gray-300 px-1 py-2 bg-gray-200 font-semibold text-xs">
              Uncertainty Measurement
            </th>
          </tr>
          <tr className="bg-gray-200 text-center text-[12px] font-medium">
            <th className="border border-gray-300 px-1 py-2">Sr No</th>
            <th className="border border-gray-300 px-1 py-2">1</th>
            <th className="border border-gray-300 px-1 py-2">2</th>
            <th className="border border-gray-300 px-1 py-2">3</th>
            <th className="border border-gray-300 px-1 py-2">4</th>
            <th className="border border-gray-300 px-1 py-2">5</th>
            <th className="border border-gray-300 px-1 py-2">Unit</th>
            <th className="border border-gray-300 px-1 py-2">Calibration Point</th>
            <th className="border border-gray-300 px-1 py-2">Average</th>
            <th className="border border-gray-300 px-1 py-2">Std Deviation</th>
            <th className="border border-gray-300 px-1 py-2">Type A</th>
            <th className="border border-gray-300 px-1 py-2">Uncertainty of master 1 sensor in (°C)</th>
            <th className="border border-gray-300 px-1 py-2">Uncertainty of master 2 (6.5 DMM) in Value</th>
            <th className="border border-gray-300 px-1 py-2">Sensitivity Coefficient</th>
            <th className="border border-gray-300 px-1 py-2">Uncertainty of master 2 (6.5 DMM) in °C</th>
            <th className="border border-gray-300 px-1 py-2">Stability of Bath (°C)</th>
            <th className="border border-gray-300 px-1 py-2">Uniformity Of Bath (°C)</th>
            <th className="border border-gray-300 px-1 py-2">Drift in Master (°C)</th>
            <th className="border border-gray-300 px-1 py-2">Least Count of UUC</th>
            <th className="border border-gray-300 px-1 py-2">Combined Uncertainty</th>
            <th className="border border-gray-300 px-1 py-2">Degree of Freedom</th>
            <th className="border border-gray-300 px-1 py-2">Coverage Factor (k)</th>
            <th className="border border-gray-300 px-1 py-2">Expanded Uncertainty in Value</th>
            <th className="border border-gray-300 px-1 py-2">CMC Taken</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="hover:bg-gray-50 text-center text-[12px]">
              <td className="border border-gray-300 px-1 py-2">{row.srNo}</td>
              <td className="border border-gray-300 px-1 py-2">{row.master0}</td>
              <td className="border border-gray-300 px-1 py-2">{row.master1}</td>
              <td className="border border-gray-300 px-1 py-2">{row.master2}</td>
              <td className="border border-gray-300 px-1 py-2">{row.master3}</td>
              <td className="border border-gray-300 px-1 py-2">{row.master4}</td>
              <td className="border border-gray-300 px-1 py-2">{row.unit}</td>
              <td className="border border-gray-300 px-1 py-2">{row.calibrationPoint}</td>
              <td className="border border-gray-300 px-1 py-2">{row.average}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.stdDeviation === 'number' ? row.stdDeviation.toFixed(6) : row.stdDeviation}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.typeA === 'number' ? row.typeA.toFixed(6) : row.typeA}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.uncertaintyMaster1 === 'number' ? row.uncertaintyMaster1.toFixed(3) : row.uncertaintyMaster1}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.uncertaintyMaster2Value === 'number' ? row.uncertaintyMaster2Value.toFixed(3) : row.uncertaintyMaster2Value}</td>
              <td className="border border-gray-300 px-1 py-2">{row.sensitivityCoefficient}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.uncertaintyMaster2Celsius === 'number' ? row.uncertaintyMaster2Celsius.toFixed(3) : row.uncertaintyMaster2Celsius}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.stabilityBath === 'number' ? row.stabilityBath.toFixed(3) : row.stabilityBath}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.uniformityBath === 'number' ? row.uniformityBath.toFixed(3) : row.uniformityBath}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.driftMaster === 'number' ? row.driftMaster.toFixed(3) : row.driftMaster}</td>
              <td className="border border-gray-300 px-1 py-2">{row.leastCountUuc}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.combinedUncertainty === 'number' ? row.combinedUncertainty.toFixed(6) : row.combinedUncertainty}</td>
              <td className="border border-gray-300 px-1 py-2">{row.degreeOfFreedom === '-' ? '-' : (typeof row.degreeOfFreedom === 'number' ? row.degreeOfFreedom.toFixed(2) : row.degreeOfFreedom)}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.coverageFactor === 'number' ? row.coverageFactor.toFixed(2) : row.coverageFactor}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.expandedUncertaintyValue === 'number' ? row.expandedUncertaintyValue.toFixed(6) : row.expandedUncertaintyValue}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.cmcUncertainty === 'number' ? row.cmcUncertainty.toFixed(6) : row.cmcUncertainty}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderMtTable = () => (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[12px] text-gray-700 min-w-max">
        <thead>
          <tr className="bg-gray-100 text-center">
            <th colSpan="11" className="border border-gray-300 px-1 py-2 bg-gray-200 font-semibold text-xs">
              Type A Factor
            </th>
            <th colSpan="8" className="border border-gray-300 px-1 py-2 bg-gray-200 font-semibold text-xs">
              Type B Factor
            </th>
            <th colSpan="5" className="border border-gray-300 px-1 py-2 bg-gray-200 font-semibold text-xs">
              Uncertainty Measurement
            </th>
          </tr>
          <tr className="bg-gray-200 text-center text-[12px] font-medium">
            <th className="border border-gray-300 px-1 py-2">Sr No</th>
            <th className="border border-gray-300 px-1 py-2">1</th>
            <th className="border border-gray-300 px-1 py-2">2</th>
            <th className="border border-gray-300 px-1 py-2">3</th>
            <th className="border border-gray-300 px-1 py-2">4</th>
            <th className="border border-gray-300 px-1 py-2">5</th>
            <th className="border border-gray-300 px-1 py-2">Unit</th>
            <th className="border border-gray-300 px-1 py-2">Calibration Point</th>
            <th className="border border-gray-300 px-1 py-2">Average</th>
            <th className="border border-gray-300 px-1 py-2">Std Deviation</th>
            <th className="border border-gray-300 px-1 py-2">Type A</th>
            <th className="border border-gray-300 px-1 py-2">Uncertainty of Master in (mm)</th>
            <th className="border border-gray-300 px-1 py-2">Thickness of Graduation Line Mark in Measuring Tape</th>
            <th className="border border-gray-300 px-1 py-2">Thermal Coefficient of Master</th>
            <th className="border border-gray-300 px-1 py-2">Thermal Coefficient of UUC</th>
            <th className="border border-gray-300 px-1 py-2">Uncertainty due to Temperature Indicating Device (mm)</th>
            <th className="border border-gray-300 px-1 py-2">Standard Uncertainty due to Thermal Coefficient of Expansion Master and UUC assuming 20% (mm)</th>
            <th className="border border-gray-300 px-1 py-2">Standard Uncertainty due to Difference in Temperature Master and UUC assuming 0.5°C (mm)</th>
            <th className="border border-gray-300 px-1 py-2">Uncertainty Due to Parallelism in (mm)</th>
            <th className="border border-gray-300 px-1 py-2">Standard Uncertainty due to Error in Master (Taken Half) in mm</th>
            <th className="border border-gray-300 px-1 py-2">Combined Uncertainty</th>
            <th className="border border-gray-300 px-1 py-2">Degree of Freedom</th>
            <th className="border border-gray-300 px-1 py-2">Coverage Factor (k)</th>
            <th className="border border-gray-300 px-1 py-2">Expanded Uncertainty in Value</th>
            <th className="border border-gray-300 px-1 py-2">CMC Taken</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="hover:bg-gray-50 text-center text-[12px]">
              <td className="border border-gray-300 px-1 py-2">{row.srNo}</td>
              {row.values.map((v, idx) => (
                <td key={idx} className="border border-gray-300 px-1 py-2">{v}</td>
              ))}
              <td className="border border-gray-300 px-1 py-2">{row.unit}</td>
              <td className="border border-gray-300 px-1 py-2">{row.calibrationPoint}</td>
              <td className="border border-gray-300 px-1 py-2">{row.average}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.stdDeviation === 'number' ? row.stdDeviation.toFixed(6) : row.stdDeviation}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.typeA === 'number' ? row.typeA.toFixed(6) : row.typeA}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.uncertaintyOfMaster === 'number' ? row.uncertaintyOfMaster.toFixed(6) : row.uncertaintyOfMaster}</td>
              <td className="border border-gray-300 px-1 py-2">{row.thicknessOfGraduation}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.thermalCoeffMaster === 'number' ? row.thermalCoeffMaster.toFixed(6) : row.thermalCoeffMaster}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.thermalCoeffUuc === 'number' ? row.thermalCoeffUuc.toFixed(6) : row.thermalCoeffUuc}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.uncTempDevice === 'number' ? row.uncTempDevice.toFixed(6) : row.uncTempDevice}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.stdUncTher20 === 'number' ? row.stdUncTher20.toFixed(6) : row.stdUncTher20}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.stdUncDiff === 'number' ? row.stdUncDiff.toFixed(6) : row.stdUncDiff}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.uncParallelism === 'number' ? row.uncParallelism.toFixed(6) : row.uncParallelism}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.uncError === 'number' ? row.uncError.toFixed(6) : row.uncError}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.combinedUnc === 'number' ? row.combinedUnc.toFixed(6) : row.combinedUnc}</td>
              <td className="border border-gray-300 px-1 py-2">{row.dof === '-' ? '-' : (typeof row.dof === 'number' ? row.dof.toFixed(2) : row.dof)}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.coverageFactor === 'number' ? row.coverageFactor.toFixed(2) : row.coverageFactor}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.expandedUnc === 'number' ? row.expandedUnc.toFixed(6) : row.expandedUnc}</td>
              <td className="border border-gray-300 px-1 py-2">{typeof row.cmc === 'number' ? row.cmc.toFixed(6) : row.cmc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderDwTable = () => {
    if (!data || data.length === 0) return null;
    const uucUnit = data[0]?.unit || 'g';

    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[12px] text-gray-700 min-w-max">
          <thead>
            <tr className="bg-gray-100 text-center font-semibold text-[11px]">
              <th rowSpan="3" className="border border-gray-300 px-1 py-2 bg-gray-200">Sr no</th>
              <th rowSpan="3" className="border border-gray-300 px-1 py-2 bg-gray-200">Nominal Value on UUC ({uucUnit})</th>
              <th colSpan="4" className="border border-gray-300 px-1 py-2 bg-gray-200">Measured mass value ({uucUnit})</th>
              <th className="border border-gray-300 px-1 py-2 bg-gray-200">Diff., ∆m</th>
              <th className="border border-gray-300 px-1 py-2 bg-gray-200">Type A ({uucUnit})</th>
              <th rowSpan="3" className="border border-gray-300 px-1 py-2 bg-gray-200">Avg. Diff.(g)</th>
              <th rowSpan="2" className="border border-gray-300 px-1 py-2 bg-gray-200">Conv. Mass <br />(Mr + ∆m+B.C.)(g)</th>
              <th rowSpan="3" className="border border-gray-300 px-1 py-2 bg-gray-200">Density of Moist Air (ρa) g/cm³</th>
              <th rowSpan="3" className="border border-gray-300 px-1 py-2 bg-gray-200">Reference Air Density(ρo) g/cm³</th>
              <th rowSpan="3" className="border border-gray-300 px-1 py-2 bg-gray-200">Density of Reference Weight g/cm³</th>
              <th rowSpan="3" className="border border-gray-300 px-1 py-2 bg-gray-200">Density of Test Weight g/cm³</th>
              <th rowSpan="3" className="border border-gray-300 px-1 py-2 bg-gray-200">Reference Weight Mass Value (Mr)</th>
              <th rowSpan="3" className="border border-gray-300 px-1 py-2 bg-gray-200">Volume of Reference Weight (Vr)</th>
              <th rowSpan="3" className="border border-gray-300 px-1 py-2 bg-gray-200">Volume of Test Weight (Vt)</th>
              <th rowSpan="3" className="border border-gray-300 px-1 py-2 bg-gray-200">Air Buoyancy Correction</th>
              <th rowSpan="3" className="border border-gray-300 px-1 py-2 bg-gray-200">Least Count W.B (g)</th>
              <th rowSpan="3" className="border border-gray-300 px-1 py-2 bg-gray-200">Uncertainty Of Reference Weight (g)</th>
              <th rowSpan="3" className="border border-gray-300 px-1 py-2 bg-gray-200">Combined Uncertainty</th>
              <th rowSpan="3" className="border border-gray-300 px-1 py-2 bg-gray-200">Coverage Factor</th>
              <th rowSpan="3" className="border border-gray-300 px-1 py-2 bg-gray-200">Expanded Uncertainty (mg)</th>
              <th rowSpan="3" className="border border-gray-300 px-1 py-2 bg-gray-200">CMC Taken</th>
            </tr>
            <tr className="bg-gray-100 text-center font-semibold text-[11px]">
              <th className="border border-gray-300 px-1 py-2 bg-gray-200">S1</th>
              <th className="border border-gray-300 px-1 py-2 bg-gray-200">U1</th>
              <th className="border border-gray-300 px-1 py-2 bg-gray-200">U2</th>
              <th className="border border-gray-300 px-1 py-2 bg-gray-200">S2</th>
              <th rowSpan="2" className="border border-gray-300 px-1 py-2 bg-gray-200">(U1-S1)+(U2-S2)/2</th>
              <th rowSpan="2" className="border border-gray-300 px-1 py-2 bg-gray-200">Stdev/sqrt(3)</th>
            </tr>
            <tr className="bg-gray-100 text-center font-semibold text-[11px]">
              <th className="border border-gray-300 px-1 py-2 bg-gray-200">A(g)</th>
              <th className="border border-gray-300 px-1 py-2 bg-gray-200">B(g)</th>
              <th className="border border-gray-300 px-1 py-2 bg-gray-200">B(g)</th>
              <th className="border border-gray-300 px-1 py-2 bg-gray-200">A(g)</th>
            </tr>
          </thead>
          <tbody>
            {data.flatMap((row, i) => {
              const repeatCount = Math.max(
                row.uuca?.length || 0,
                row.mastera?.length || 0,
                row.masterb?.length || 0,
                row.uucb?.length || 0,
                row.deltai?.length || 0,
                1
              );

              const rows = [];
              for (let ri = 0; ri < repeatCount; ri++) {
                rows.push(
                  <tr key={`${i}-${ri}`} className="hover:bg-gray-50 text-center text-[12px]">
                    {ri === 0 && (
                      <>
                        <td rowSpan={repeatCount} className="border border-gray-300 px-1 py-2 text-center font-medium">{row.srNo}</td>
                        <td rowSpan={repeatCount} className="border border-gray-300 px-1 py-2 text-center">{row.calibrationPoint}</td>
                      </>
                    )}
                    <td className="border border-gray-300 px-1 py-2">{row.uuca?.[ri] ?? '-'}</td>
                    <td className="border border-gray-300 px-1 py-2">{row.mastera?.[ri] ?? '-'}</td>
                    <td className="border border-gray-300 px-1 py-2">{row.masterb?.[ri] ?? '-'}</td>
                    <td className="border border-gray-300 px-1 py-2">{row.uucb?.[ri] ?? '-'}</td>
                    <td className="border border-gray-300 px-1 py-2">{row.deltai?.[ri] ?? '-'}</td>
                    {ri === 0 && (
                      <>
                        <td rowSpan={repeatCount} className="border border-gray-300 px-1 py-2">
                          {typeof row.typeA === 'number' ? row.typeA.toFixed(8) : (row.typeA ?? '-')}
                        </td>
                        <td rowSpan={repeatCount} className="border border-gray-300 px-1 py-2">
                          {typeof row.averagedeltai === 'number' ? row.averagedeltai.toFixed(8) : (row.averagedeltai ?? '-')}
                        </td>
                        <td rowSpan={repeatCount} className="border border-gray-300 px-1 py-2">
                          {typeof row.mcr === 'number' ? row.mcr.toFixed(8) : (row.mcr ?? '-')}
                        </td>
                        <td rowSpan={repeatCount} className="border border-gray-300 px-1 py-2">
                          {typeof row.densityofair === 'number' ? row.densityofair.toFixed(8) : (row.densityofair ?? '-')}
                        </td>
                        <td rowSpan={repeatCount} className="border border-gray-300 px-1 py-2">
                          {typeof row.densityofairref === 'number' ? row.densityofairref.toFixed(4) : (row.densityofairref ?? '0.0012')}
                        </td>
                        <td rowSpan={repeatCount} className="border border-gray-300 px-1 py-2">
                          {typeof row.densityofmaster === 'number' ? row.densityofmaster.toFixed(4) : (row.densityofmaster ?? '-')}
                        </td>
                        <td rowSpan={repeatCount} className="border border-gray-300 px-1 py-2">
                          {typeof row.densityuuc === 'number' ? row.densityuuc.toFixed(4) : (row.densityuuc ?? '-')}
                        </td>
                        <td rowSpan={repeatCount} className="border border-gray-300 px-1 py-2">
                          {typeof row.refweightmass === 'number' ? row.refweightmass.toFixed(6) : (row.refweightmass ?? '-')}
                        </td>
                        <td rowSpan={repeatCount} className="border border-gray-300 px-1 py-2">
                          {typeof row.volumofref === 'number' ? row.volumofref.toFixed(6) : (row.volumofref ?? '-')}
                        </td>
                        <td rowSpan={repeatCount} className="border border-gray-300 px-1 py-2">
                          {typeof row.volumeoftestweight === 'number' ? row.volumeoftestweight.toFixed(6) : (row.volumeoftestweight ?? '-')}
                        </td>
                        <td rowSpan={repeatCount} className="border border-gray-300 px-1 py-2">
                          {typeof row.airbyouncy === 'number' ? row.airbyouncy.toFixed(8) : (row.airbyouncy ?? '-')}
                        </td>
                        <td rowSpan={repeatCount} className="border border-gray-300 px-1 py-2">
                          {typeof row.masterleastcount === 'number' ? row.masterleastcount.toFixed(6) : (row.masterleastcount ?? '-')}
                        </td>
                        <td rowSpan={repeatCount} className="border border-gray-300 px-1 py-2">
                          {typeof row.masterunc === 'number' ? row.masterunc.toFixed(8) : (row.masterunc ?? '-')}
                        </td>
                        <td rowSpan={repeatCount} className="border border-gray-300 px-1 py-2">
                          {typeof row.comuncer === 'number' ? row.comuncer.toFixed(8) : (row.comuncer ?? '-')}
                        </td>
                        <td rowSpan={repeatCount} className="border border-gray-300 px-1 py-2">
                          {typeof row.coveragefactor === 'number' ? row.coveragefactor.toFixed(2) : (row.coveragefactor ?? '2')}
                        </td>
                        <td rowSpan={repeatCount} className="border border-gray-300 px-1 py-2">
                          {typeof row.expandeduncertainty === 'number' ? row.expandeduncertainty.toFixed(6) : (row.expandeduncertainty ?? '-')}
                        </td>
                        <td rowSpan={repeatCount} className="border border-gray-300 px-1 py-2">
                          {typeof row.cmcuncertainty === 'number' ? row.cmcuncertainty.toFixed(6) : (row.cmcuncertainty ?? '-')}
                        </td>
                      </>
                    )}
                  </tr>
                );
              }
              return rows;
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const renderWbTable = () => {
    if (!data || data.length === 0) return null;
    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[12px] text-gray-700 min-w-max">
          <thead>
            <tr className="bg-gray-100 font-semibold">
              <th colSpan="16" className="border border-gray-300 px-2 py-2 bg-gray-200 font-semibold text-center">
                Type A Factor
              </th>
              <th colSpan="3" className="border border-gray-300 px-2 py-2 bg-gray-200 font-semibold text-center">
                Type B Factor
              </th>
              <th colSpan="6" className="border border-gray-300 px-2 py-2 bg-gray-200 font-semibold text-center">
                Uncertainty Measurement
              </th>
            </tr>
            <tr className="bg-gray-200 text-center font-medium">
              <th className="border border-gray-300 px-2 py-2">Sr No</th>
              <th className="border border-gray-300 px-2 py-2">1</th>
              <th className="border border-gray-300 px-2 py-2">2</th>
              <th className="border border-gray-300 px-2 py-2">3</th>
              <th className="border border-gray-300 px-2 py-2">4</th>
              <th className="border border-gray-300 px-2 py-2">5</th>
              <th className="border border-gray-300 px-2 py-2">6</th>
              <th className="border border-gray-300 px-2 py-2">7</th>
              <th className="border border-gray-300 px-2 py-2">8</th>
              <th className="border border-gray-300 px-2 py-2">9</th>
              <th className="border border-gray-300 px-2 py-2">10</th>
              <th className="border border-gray-300 px-2 py-2">Unit</th>
              <th className="border border-gray-300 px-2 py-2">Calibration Point</th>
              <th className="border border-gray-300 px-2 py-2">Average (g)</th>
              <th className="border border-gray-300 px-2 py-2">Std Deviation</th>
              <th className="border border-gray-300 px-2 py-2">Type A</th>
              <th className="border border-gray-300 px-2 py-2">Drift in mass (g)</th>
              <th className="border border-gray-300 px-2 py-2">Eccentricity [2/3xD]/2sqrt(3) (g)</th>
              <th className="border border-gray-300 px-2 py-2">Uncertainty of Master in (g)</th>
              <th className="border border-gray-300 px-2 py-2">Least Count</th>
              <th className="border border-gray-300 px-2 py-2">Combined Uncertainty</th>
              <th className="border border-gray-300 px-2 py-2">Degree of Freedom</th>
              <th className="border border-gray-300 px-2 py-2">Coverage Factor (k)</th>
              <th className="border border-gray-300 px-2 py-2">Expanded Uncertainty (g)</th>
              <th className="border border-gray-300 px-2 py-2">CMC Taken</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50 text-center">
                <td className="border border-gray-300 px-2 py-3 font-medium">{row.srNo}</td>
                {row.values.map((v, idx) => (
                  <td key={idx} className="border border-gray-300 px-2 py-3">
                    {v !== undefined && v !== null && v !== '' ? v : '-'}
                  </td>
                ))}
                <td className="border border-gray-300 px-2 py-3">{row.unit || '-'}</td>
                <td className="border border-gray-300 px-2 py-3">{row.calibrationPoint}</td>
                <td className="border border-gray-300 px-2 py-3">
                  {typeof row.average === 'number' ? row.average.toFixed(6) : (row.average ?? '-')}
                </td>
                <td className="border border-gray-300 px-2 py-3">
                  {typeof row.stdDeviation === 'number' ? row.stdDeviation.toFixed(8) : (row.stdDeviation ?? '-')}
                </td>
                <td className="border border-gray-300 px-2 py-3">
                  {typeof row.typeA === 'number' ? row.typeA.toFixed(8) : (row.typeA ?? '-')}
                </td>
                <td className="border border-gray-300 px-2 py-3">
                  {typeof row.drift === 'number' ? row.drift.toFixed(8) : (row.drift ?? '-')}
                </td>
                <td className="border border-gray-300 px-2 py-3">
                  {typeof row.eccentricityfactor === 'number' ? row.eccentricityfactor.toFixed(8) : (row.eccentricityfactor ?? '-')}
                </td>
                <td className="border border-gray-300 px-2 py-3">
                  {typeof row.uncertaintyOfMaster === 'number' ? row.uncertaintyOfMaster.toFixed(8) : (row.uncertaintyOfMaster ?? '-')}
                </td>
                <td className="border border-gray-300 px-2 py-3">
                  {typeof row.leastCount === 'number' ? row.leastCount.toFixed(6) : (row.leastCount ?? '-')}
                </td>
                <td className="border border-gray-300 px-2 py-3">
                  {typeof row.combinedUnc === 'number' ? row.combinedUnc.toFixed(8) : (row.combinedUnc ?? '-')}
                </td>
                <td className="border border-gray-300 px-2 py-3">{row.dof ?? '-'}</td>
                <td className="border border-gray-300 px-2 py-3">
                  {typeof row.coverageFactor === 'number' ? row.coverageFactor.toFixed(2) : (row.coverageFactor ?? '2')}
                </td>
                <td className="border border-gray-300 px-2 py-3">
                  {typeof row.expandedUnc === 'number' ? row.expandedUnc.toFixed(8) : (row.expandedUnc ?? '-')}
                  {row.expandedUncmg !== undefined && row.expandedUncmg !== null && row.expandedUncmg !== '' && (
                    <span className="text-gray-500 block text-[10px]">
                      ({typeof row.expandedUncmg === 'number' ? row.expandedUncmg.toFixed(6) : row.expandedUncmg} mg)
                    </span>
                  )}
                </td>
                <td className="border border-gray-300 px-2 py-3">
                  {typeof row.cmc === 'number' ? row.cmc.toFixed(8) : (row.cmc ?? '-')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderEsTable = () => (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[12px] text-gray-700 min-w-max">
        <thead>
          <tr className="bg-gray-100">
            <th colSpan="12" className="border border-gray-300 px-2 py-2 bg-gray-200 font-semibold text-center">
              Type A Factor
            </th>
            <th colSpan="4" className="border border-gray-300 px-2 py-2 bg-gray-200 font-semibold text-center">
              Type B Factor
            </th>
            <th colSpan="7" className="border border-gray-300 px-2 py-2 bg-gray-200 font-semibold text-center">
              Uncertainty Measurement
            </th>
          </tr>
          <tr className="bg-gray-200 text-center text-[12px] font-medium">
            <th className="border border-gray-300 px-2 py-2">Sr No</th>
            <th className="border border-gray-300 px-2 py-2">Unit Type</th>
            <th className="border border-gray-300 px-2 py-2">Mode</th>
            <th className="border border-gray-300 px-2 py-2">1</th>
            <th className="border border-gray-300 px-2 py-2">2</th>
            <th className="border border-gray-300 px-2 py-2">3</th>
            <th className="border border-gray-300 px-2 py-2">4</th>
            <th className="border border-gray-300 px-2 py-2">5</th>
            <th className="border border-gray-300 px-2 py-2">Unit</th>
            <th className="border border-gray-300 px-2 py-2">Calibration Point</th>
            <th className="border border-gray-300 px-2 py-2">Average</th>
            <th className="border border-gray-300 px-2 py-2">Std Deviation</th>
            <th className="border border-gray-300 px-2 py-2">Type A</th>
            <th className="border border-gray-300 px-2 py-2">Accuracy Of Calibrator in Value</th>
            <th className="border border-gray-300 px-2 py-2">Uncertainty of master in %</th>
            <th className="border border-gray-300 px-2 py-2">Least Count of UUC/Master</th>
            <th className="border border-gray-300 px-2 py-2">Combined Uncertainty</th>
            <th className="border border-gray-300 px-2 py-2">Degree of Freedom</th>
            <th className="border border-gray-300 px-2 py-2">Coverage Factor (k)</th>
            <th className="border border-gray-300 px-2 py-2">Expanded Uncertainty in Value</th>
            <th className="border border-gray-300 px-2 py-2">Expanded Uncertainty in %</th>
            <th className="border border-gray-300 px-2 py-2">CMC Taken</th>
            <th className="border border-gray-300 px-2 py-2">CMC Scope</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="hover:bg-gray-50 text-center">
              <td className="border border-gray-300 px-2 py-2">{row.srNo}</td>
              <td className="border border-gray-300 px-2 py-2">{row.unitType}</td>
              <td className="border border-gray-300 px-2 py-2">{row.mode}</td>
              {row.values.map((v, idx) => (
                <td key={idx} className="border border-gray-300 px-2 py-2">{v}</td>
              ))}
              <td className="border border-gray-300 px-2 py-2">{row.unit}</td>
              <td className="border border-gray-300 px-2 py-2">{row.calibrationPoint}</td>
              <td className="border border-gray-300 px-2 py-2">{typeof row.average === 'number' ? row.average.toFixed(6) : row.average}</td>
              <td className="border border-gray-300 px-2 py-2">{typeof row.stdDeviation === 'number' ? row.stdDeviation.toFixed(6) : row.stdDeviation}</td>

              <td className="border border-gray-300 px-2 py-2">{typeof row.typeA === 'number' ? row.typeA.toFixed(6) : row.typeA}</td>
              <td className="border border-gray-300 px-2 py-2">{typeof row.accuracyCalibrator === 'number' ? row.accuracyCalibrator.toFixed(6) : row.accuracyCalibrator}</td>
              <td className="border border-gray-300 px-2 py-2">{typeof row.uncertaintyMaster === 'number' ? row.uncertaintyMaster.toFixed(6) : row.uncertaintyMaster}</td>
              <td className="border border-gray-300 px-2 py-2">{row.leastCount}</td>

              <td className="border border-gray-300 px-2 py-2">{typeof row.combinedUnc === 'number' ? row.combinedUnc.toFixed(6) : row.combinedUnc}</td>
              <td className="border border-gray-300 px-2 py-2">{typeof row.dof === 'number' ? row.dof.toFixed(2) : row.dof}</td>
              <td className="border border-gray-300 px-2 py-2">{typeof row.coverageFactor === 'number' ? row.coverageFactor.toFixed(2) : row.coverageFactor}</td>
              <td className="border border-gray-300 px-2 py-2">{typeof row.expandedUncValue === 'number' ? row.expandedUncValue.toFixed(6) : row.expandedUncValue}</td>
              <td className="border border-gray-300 px-2 py-2">{typeof row.expandedUncPercent === 'number' ? row.expandedUncPercent.toFixed(6) : row.expandedUncPercent}</td>
              <td className="border border-gray-300 px-2 py-2">{typeof row.cmcTaken === 'number' ? row.cmcTaken.toFixed(6) : row.cmcTaken}</td>
              <td className="border border-gray-300 px-2 py-2">{typeof row.cmcScope === 'number' ? row.cmcScope.toFixed(6) : row.cmcScope}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderWbnTable = () => (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[12px] text-gray-700 min-w-max">
        <thead>
          <tr className="bg-gray-100 font-semibold">
            <th colSpan="16" className="border border-gray-300 px-2 py-2 bg-gray-200 font-semibold text-center">Type A Factor</th>
            <th colSpan="3" className="border border-gray-300 px-2 py-2 bg-gray-200 font-semibold text-center">Type B Factor</th>
            <th colSpan="5" className="border border-gray-300 px-2 py-2 bg-gray-200 font-semibold text-center">Uncertainty Measurement</th>
          </tr>
          <tr className="bg-gray-200 text-center font-medium">
            <th className="border border-gray-300 px-2 py-2">Sr No</th>
            <th className="border border-gray-300 px-2 py-2">1</th>
            <th className="border border-gray-300 px-2 py-2">2</th>
            <th className="border border-gray-300 px-2 py-2">3</th>
            <th className="border border-gray-300 px-2 py-2">4</th>
            <th className="border border-gray-300 px-2 py-2">5</th>
            <th className="border border-gray-300 px-2 py-2">Unit</th>
            <th className="border border-gray-300 px-2 py-2">Calibration point</th>
            <th className="border border-gray-300 px-2 py-2">Average(g)</th>
            <th className="border border-gray-300 px-2 py-2">Std Deviation</th>
            <th className="border border-gray-300 px-2 py-2">Type A</th>
            <th className="border border-gray-300 px-2 py-2">Drift in mass(g)</th>
            <th className="border border-gray-300 px-2 py-2">Eccentricity [2/3xD]/2sqrt(3) (g)</th>
            <th className="border border-gray-300 px-2 py-2">Uncertainty of master in (g)</th>
            <th className="border border-gray-300 px-2 py-2">Least Count of UUC (g)</th>
            <th className="border border-gray-300 px-2 py-2">Combined Uncertainty</th>
            <th className="border border-gray-300 px-2 py-2">Degree of Freedom</th>
            <th className="border border-gray-300 px-2 py-2">Coverage Factor (k)</th>
            <th className="border border-gray-300 px-2 py-2">Expanded Uncertainty in (g)</th>
            <th className="border border-gray-300 px-2 py-2">Expanded Uncertainty in (mg)</th>
            <th className="border border-gray-300 px-2 py-2">CMC Taken</th>
          </tr>
        </thead>
        <tbody>
          {data.length > 0 ? (
            data.map((row, index) => {
              const uuc0 = row.values?.[0] || '0';
              const uuc1 = row.values?.[1] || '0';
              const uuc2 = row.values?.[2] || '0';
              const uuc3 = row.values?.[3] || '0';
              const uuc4 = row.values?.[4] || '0';
              return (
                <tr key={index} className="text-center hover:bg-gray-50 transition-colors">
                  <td className="border border-gray-300 px-2 py-1">{row.srNo || index + 1}</td>
                  <td className="border border-gray-300 px-2 py-1">{uuc0}</td>
                  <td className="border border-gray-300 px-2 py-1">{uuc1}</td>
                  <td className="border border-gray-300 px-2 py-1">{uuc2}</td>
                  <td className="border border-gray-300 px-2 py-1">{uuc3}</td>
                  <td className="border border-gray-300 px-2 py-1">{uuc4}</td>
                  <td className="border border-gray-300 px-2 py-1">{row.unit}</td>
                  <td className="border border-gray-300 px-2 py-1">{row.calibrationPoint}</td>
                  <td className="border border-gray-300 px-2 py-1">{Number(row.average).toFixed(4)}</td>
                  <td className="border border-gray-300 px-2 py-1">{Number(row.stdDeviation).toFixed(6)}</td>
                  <td className="border border-gray-300 px-2 py-1">{Number(row.typeA).toFixed(6)}</td>
                  <td className="border border-gray-300 px-2 py-1">{Number(row.drift).toFixed(6)}</td>
                  <td className="border border-gray-300 px-2 py-1">{Number(row.eccentricityfactor).toFixed(6)}</td>
                  <td className="border border-gray-300 px-2 py-1">{Number(row.masterunc).toFixed(6)}</td>
                  <td className="border border-gray-300 px-2 py-1">{Number(row.leastcount).toFixed(6)}</td>
                  <td className="border border-gray-300 px-2 py-1">{Number(row.comuncer).toFixed(6)}</td>
                  <td className="border border-gray-300 px-2 py-1">{typeof row.dof === 'number' ? Number(row.dof).toFixed(2) : row.dof}</td>
                  <td className="border border-gray-300 px-2 py-1">{row.coveragefactor}</td>
                  <td className="border border-gray-300 px-2 py-1">{Number(row.expandeduncertainty).toFixed(6)}</td>
                  <td className="border border-gray-300 px-2 py-1">{Number(row.expandeduncertaintymg).toFixed(4)}</td>
                  <td className="border border-gray-300 px-2 py-1">{Number(row.cmcuncertainty).toFixed(6)}</td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan="21" className="border border-gray-300 px-4 py-4 text-center text-gray-500">
                No observation data available.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  const renderObservationucTable = () => (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[12px] text-gray-700 min-w-max">
        <thead>
          <tr className="bg-gray-100">
            <th colSpan="13" className="border border-gray-300 px-2 py-2 bg-gray-200 font-semibold text-center">
              Type A Factor
            </th>
            <th colSpan="3" className="border border-gray-300 px-2 py-2 bg-gray-200 font-semibold text-center">
              Type B Factor
            </th>
            <th colSpan="7" className="border border-gray-300 px-2 py-2 bg-gray-200 font-semibold text-center">
              Uncertainty Measurement
            </th>
          </tr>
          <tr className="bg-gray-200 text-center text-[12px] font-medium">
            <th className="border border-gray-300 px-2 py-2">Sr no</th>
            <th className="border border-gray-300 px-2 py-2">Unit Type</th>
            <th className="border border-gray-300 px-2 py-2">Mode</th>
            <th className="border border-gray-300 px-2 py-2">1</th>
            <th className="border border-gray-300 px-2 py-2">2</th>
            <th className="border border-gray-300 px-2 py-2">3</th>
            <th className="border border-gray-300 px-2 py-2">4</th>
            <th className="border border-gray-300 px-2 py-2">5</th>
            <th className="border border-gray-300 px-2 py-2">Unit</th>
            <th className="border border-gray-300 px-2 py-2">Calibration point</th>
            <th className="border border-gray-300 px-2 py-2">Average</th>
            <th className="border border-gray-300 px-2 py-2">Std Deviation</th>
            <th className="border border-gray-300 px-2 py-2">Type A</th>
            <th className="border border-gray-300 px-2 py-2">Accuracy Of Calibrator in Value</th>
            <th className="border border-gray-300 px-2 py-2">Uncertainty of master in %</th>
            <th className="border border-gray-300 px-2 py-2">Least Count</th>
            <th className="border border-gray-300 px-2 py-2">Combined Uncertainty</th>
            <th className="border border-gray-300 px-2 py-2">Degree of Freedom</th>
            <th className="border border-gray-300 px-2 py-2">Coverage Factor (k)</th>
            <th className="border border-gray-300 px-2 py-2">Expanded Uncertainty in Value</th>
            <th className="border border-gray-300 px-2 py-2">Expanded Uncertainty in %</th>
            <th className="border border-gray-300 px-2 py-2">CMC Taken</th>
            <th className="border border-gray-300 px-2 py-2">CMC Scope</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="hover:bg-gray-50 text-center">
              <td className="border border-gray-300 px-2 py-2">{row.srNo}</td>
              <td className="border border-gray-300 px-2 py-2">{row.unitType}</td>
              <td className="border border-gray-300 px-2 py-2">{row.mode}</td>
              {row.values.map((v, idx) => (
                <td key={idx} className="border border-gray-300 px-2 py-2">{v}</td>
              ))}
              <td className="border border-gray-300 px-2 py-2">{row.unitDesc}</td>
              <td className="border border-gray-300 px-2 py-2">{row.calibrationPoint}</td>
              <td className="border border-gray-300 px-2 py-2">{typeof row.average === 'number' ? row.average.toFixed(6) : row.average}</td>
              <td className="border border-gray-300 px-2 py-2">{typeof row.stdDeviation === 'number' ? row.stdDeviation.toFixed(6) : row.stdDeviation}</td>

              <td className="border border-gray-300 px-2 py-2">{typeof row.typeA === 'number' ? row.typeA.toFixed(6) : row.typeA}</td>
              <td className="border border-gray-300 px-2 py-2">{typeof row.accuracyCalibrator === 'number' ? row.accuracyCalibrator.toFixed(6) : row.accuracyCalibrator}</td>
              <td className="border border-gray-300 px-2 py-2">{typeof row.uncertaintyMaster === 'number' ? row.uncertaintyMaster.toFixed(6) : row.uncertaintyMaster}</td>
              <td className="border border-gray-300 px-2 py-2">{row.leastCount}</td>

              <td className="border border-gray-300 px-2 py-2">{typeof row.combinedUnc === 'number' ? row.combinedUnc.toFixed(6) : row.combinedUnc}</td>
              <td className="border border-gray-300 px-2 py-2">{typeof row.dof === 'number' ? row.dof.toFixed(2) : row.dof}</td>
              <td className="border border-gray-300 px-2 py-2">{typeof row.coverageFactor === 'number' ? row.coverageFactor.toFixed(2) : row.coverageFactor}</td>
              <td className="border border-gray-300 px-2 py-2">{typeof row.expandedUncValue === 'number' ? row.expandedUncValue.toFixed(6) : row.expandedUncValue}</td>
              <td className="border border-gray-300 px-2 py-2">{typeof row.expandedUncPercent === 'number' ? row.expandedUncPercent.toFixed(6) : row.expandedUncPercent}</td>
              <td className="border border-gray-300 px-2 py-2">{typeof row.cmcTaken === 'number' ? row.cmcTaken.toFixed(6) : row.cmcTaken}</td>
              <td className="border border-gray-300 px-2 py-2">{typeof row.cmcScope === 'number' ? row.cmcScope.toFixed(6) : row.cmcScope}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

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
        {customLayout ? (
          renderDynamicTable()
        ) : (
          <>
            {suffix === "ctg" && renderCtgTable()}
            {suffix === "dpg" && renderDpgTable()}
            {suffix === "mm" && renderMmTable()}
            {suffix === "odfm" && renderOdfmTable()}
            {suffix === "mt" && renderMtTable()}
            {suffix === "it" && renderItTable()}
            {suffix === "fg" && renderFgTable()}
            {suffix === "hg" && renderHgTable()}
            {suffix === "avg" && renderAvgTable()}
            {suffix === "msr" && renderMsrTable()}
            {suffix === "mg" && renderMgTable()}
            {suffix === "exm" && renderExmTable()}
            {suffix === "rtdwi" && renderRtdwiTable()}
            {suffix === "ppg" && renderPpgTable()}
            {suffix === "gtm" && renderGtmTable()}
            {suffix === "tm" && renderTmTable()}
            {suffix === "dg" && renderDgTable()}
            {suffix === "dw" && renderDwTable()}
            {suffix === "wb" && renderWbTable()}
            {suffix === "es" && renderEsTable()}
            {suffix === "observationuc" && renderObservationucTable()}
            {suffix === "wbn" && renderWbnTable()}
            {!["ctg", "dpg", "mm", "odfm", "es", "mt", "it", "fg", "hg", "avg", "msr", "mg", "exm", "rtdwi", "ppg", "gtm", "tm", "dg", "dw", "wb", "observationuc", "wbn"].includes(suffix) && (
              <div className="text-center py-8 text-gray-500">
                No table available for suffix: {suffix}
              </div>
            )}
          </>
        )}
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