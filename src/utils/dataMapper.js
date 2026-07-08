// utils/dataMapper.js

export const mapDataBySuffix = (suffix, apiData) => {
  console.log("🗺️ mapDataBySuffix called with:", { suffix, apiData });
  
  const mappers = {
    ctg: mapCtgData,
    exm: mapExmData,
    dg: mapDgData,
    gtm: mapGtmData,
    rtdwi: mapRtdwiData,
    msr: mapMsrData,
    avg: mapAvgData,
    dpg: mapDpgData,
    mm: mapMmData,
    odfm: mapOdfmData,
    ppg: mapPpgData,
    it: mapItData,
    mt: mapMtData,
    hg: mapHgData,
    mg: mapMgData,
    fg: mapFgData,
    dw: mapDwData,
  };

  const mapper = mappers[suffix];
  if (!mapper) {
    console.error(`❌ Unsupported instrument suffix: ${suffix}`);
    return [];
  }
  
  try {
    const result = mapper(apiData);
    console.log("✅ Mapping successful:", result);
    return result;
  } catch (error) {
    console.error(`❌ Error in mapper for ${suffix}:`, error);
    return [];
  }
};

// ========================= ALL MAPPER FUNCTIONS =========================

const mapCtgData = (apiData) => {
  if (!Array.isArray(apiData)) {
    console.error("❌ mapCtgData: apiData is not an array", apiData);
    return [];
  }
  
  return apiData.map((item) => ({
    srNo: item.sr_no,
    typeOfMeasurement: item.type_of_measurement,
    values: [item.uuc_0, item.uuc_1, item.uuc_2, item.uuc_3, item.uuc_4],
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
};

const mapExmData = (apiData) => {
  if (!Array.isArray(apiData)) return [];
  
  return apiData.map((item) => ({
    srNo: item.sr_no,
    typeOfMeasurement: item.type_of_measurement,
    values: [item.uuc_0, item.uuc_1, item.uuc_2, item.uuc_3, item.uuc_4],
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
};

const mapDgData = (apiData) => {
  if (!Array.isArray(apiData)) return [];
  
  return apiData.map((item) => ({
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
};

const mapGtmData = (apiData) => {
  if (!Array.isArray(apiData)) return [];
  
  return apiData.map((item) => ({
    srNo: item.sr_no,
    values: [item.uuc_0, item.uuc_1, item.uuc_2, item.uuc_3, item.uuc_4],
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
};

const mapRtdwiData = (apiData) => {
  if (!Array.isArray(apiData)) return [];
  
  return apiData.map((item) => ({
    srNo: item.sr_no,
    values: [item.uuc_0, item.uuc_1, item.uuc_2, item.uuc_3, item.uuc_4],
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
};

const mapMsrData = (apiData) => {
  if (!Array.isArray(apiData)) return [];
  
  return apiData.map((item) => ({
    srNo: item.sr_no,
    typeOfMeasurement: item.type_of_measurement,
    values: [item.master_0, item.master_1, item.master_2, item.master_3, item.master_4],
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
};

// ⚠️ SPECIAL CASE: AVG expects nested data structure
const mapAvgData = (apiData) => {
  console.log("🔍 mapAvgData received:", apiData);
  
  // Handle nested data structure
  const dataArray = apiData.data || apiData;
  
  if (!Array.isArray(dataArray)) {
    console.error("❌ mapAvgData: data is not an array", dataArray);
    return [];
  }
  
  return dataArray.map((item) => ({
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
  }));
};

const mapDpgData = (apiData) => {
  if (!Array.isArray(apiData)) return [];
  
  return apiData.map((item) => ({
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
};

const mapMmData = (apiData) => {
  if (!Array.isArray(apiData)) return [];
  
  return apiData.map((item) => ({
    srNo: item.sr_no,
    unitType: item.unit_type,
    mode: item.mode,
    uuc0: item.uuc0,
    uuc1: item.uuc1,
    uuc2: item.uuc2,
    uuc3: item.uuc3,
    uuc4: item.uuc4,
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
};

const mapOdfmData = (apiData) => {
  if (!Array.isArray(apiData)) return [];
  
  return apiData.map((item) => ({
    srNo: item.sr_no,
    master0: item.master0,
    master1: item.master1,
    master2: item.master2,
    master3: item.master3,
    master4: item.master4,
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
};

// ⚠️ SPECIAL CASE: PPG expects nested data structure
const mapPpgData = (apiData) => {
  console.log("🔍 mapPpgData received:", apiData);
  
  const dataArray = apiData.data || apiData;
  
  if (!Array.isArray(dataArray)) {
    console.error("❌ mapPpgData: data is not an array", dataArray);
    return [];
  }
  
  return dataArray.map((item) => ({
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
  }));
};

const mapItData = (apiData) => {
  if (!Array.isArray(apiData)) return [];
  
  return apiData.map((item) => ({
    srNo: item.sr_no,
    matrixType: item.matrixtype,
    values: [item.uuc_0, item.uuc_1, item.uuc_2, item.uuc_3, item.uuc_4],
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
};

const mapMtData = (apiData) => {
  if (!Array.isArray(apiData)) return [];
  
  return apiData.map((item) => ({
    srNo: item.sr_no,
    values: [item.master_0, item.master_1, item.master_2, item.master_3, item.master_4],
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
};

const mapHgData = (apiData) => {
  if (!Array.isArray(apiData)) return [];
  
  return apiData.map((item) => ({
    srNo: item.sr_no,
    typeOfMeasurement: item.type_of_measurement,
    values: [item.uuc_0, item.uuc_1, item.uuc_2, item.uuc_3, item.uuc_4],
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
};

// ⚠️ SPECIAL CASE: MG expects nested data structure
const mapMgData = (apiData) => {
  console.log("🔍 mapMgData received:", apiData);
  
  const dataArray = apiData.data || apiData;
  
  if (!Array.isArray(dataArray)) {
    console.error("❌ mapMgData: data is not an array", dataArray);
    return [];
  }
  
  return dataArray.map((item) => ({
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
  }));
};

const mapFgData = (apiData) => {
  if (!Array.isArray(apiData)) return [];
  
  return apiData.map((item) => ({
    srNo: item.sr_no,
    values: [item.master_0, item.master_1, item.master_2, item.master_3, item.master_4],
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
};

const safeGetArrayValue = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    if (val.trim().startsWith('[')) {
      try {
        return JSON.parse(val);
      } catch {
        // ignore
      }
    }
    return val.split(',').map(s => s.trim());
  }
  return [val];
};

const mapDwData = (apiData) => {
  if (!Array.isArray(apiData)) return [];
  
  return apiData.map((item) => ({
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
};