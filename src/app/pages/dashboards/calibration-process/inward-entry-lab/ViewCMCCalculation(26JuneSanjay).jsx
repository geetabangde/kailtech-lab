import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "utils/axios";
import { toast } from "sonner";
import { Button } from "components/ui";
import { UNCERTAINTY_LAYOUTS } from "../../calibration-operations/instrument-list/components/UncertaintyLayouts";

const SUFFIX_NAMES = {
  ctg: "Coating Thickness Gauge",
  dpg: "Digital Pressure Gauge",
  mm: "Multimeter",
  odfm: "Optical Dimension Measuring Machine",
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
  dg: "Digital Dial Gauge"
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
            // For RTD Sensor With Indicator - similar to ODFM structure
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
            {suffix === "dg" && renderDgTable()}
            {!["ctg", "dpg", "mm", "odfm", "mt", "it", "fg", "hg", "avg", "msr", "mg", "exm", "rtdwi", "ppg", "gtm", "dg"].includes(suffix) && (
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