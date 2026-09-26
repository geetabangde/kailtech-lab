import { TswoiCmcTable } from "./TswoiCmcTable";

const toNumber = (val) => {
  const num = parseFloat(val);
  return isNaN(num) ? 0 : num;
};

const firstDefined = (...vals) => vals.find((v) => v !== undefined && v !== null && v !== "");

/**
 * Maps the uncertainty API rows to table rows using the TSWI PHP formulas
 * (uncertaintytswi.php). Differs from TSWOI in:
 *  - Type A = std dev / sqrt(5) (no sensitivity coefficient)
 *  - Master-2 uncertainty = raw master-2 CMC (%) * master "average with corrected mv" / 100
 *  - Coverage factor is always 2 (the DoF is still shown)
 *  - Least count comes from the UUC matrix
 */
export const mapTswiCmcRows = (apiData) => (Array.isArray(apiData) ? apiData : []).map((item, index) => {
  const uucValues = Array.isArray(item.uuc)
    ? item.uuc
    : [item.uuc_0, item.uuc_1, item.uuc_2, item.uuc_3, item.uuc_4].map((v) => v ?? "");

  const repeatabilityRaw = firstDefined(item.std_deviation, item.repeatability);
  const repeatability = toNumber(repeatabilityRaw);
  const sensitivity = toNumber(firstDefined(item.sensitivity_coefficient, item.sensitivitycoefficient));
  // PHP reads type='saveragemaster' into $averagemaster
  const saveragemaster = toNumber(firstDefined(item.s_average_master, item.saveragemaster, item.saverage_master));

  const masterunc = toNumber(firstDefined(item.uncertainty_master_1_sensor, item.masterunc, item.master_uncertainty));
  const rawMasterUnc2 = toNumber(firstDefined(item.raw_masterunc2, item.uncertainty_master_2_dmm_value, item.masterunc2));
  const masterunc2 = (rawMasterUnc2 * saveragemaster) / 100;
  const masterunc2inc = masterunc2 * sensitivity;

  const typea = repeatability / Math.sqrt(5);
  const stability = toNumber(firstDefined(item.stability_bath, item.stability));
  const uniformity = toNumber(firstDefined(item.uniformity_bath, item.uniformity));
  const drift = 0.1 * masterunc;
  const leastcountRaw = firstDefined(item.least_count_uuc, item.least_count, item.leastcount);
  const leastcount = toNumber(leastcountRaw);

  const comuncer = Math.sqrt(
    Math.pow(typea, 2) +
    Math.pow(masterunc / 2, 2) +
    Math.pow(masterunc2inc / 2, 2) +
    Math.pow(stability / Math.sqrt(3), 2) +
    Math.pow(uniformity / Math.sqrt(3), 2) +
    Math.pow(drift / Math.sqrt(3), 2) +
    Math.pow(leastcount / 2 / Math.sqrt(3), 2)
  );

  // PHP: "-" when there is no repeatability (typea is then 0 too, so no division by zero)
  const dof = repeatability !== 0 ? (Math.pow(comuncer, 4) / Math.pow(typea, 4)) * 4 : "-";
  // uncertaintytswi.php always uses k = 2
  const coveragefactor = 2;
  const expandeduncertainty = comuncer * coveragefactor;

  // CMC scope value (interpolated by the backend); the larger of it and the expanded uncertainty is taken
  const tempcmc = firstDefined(item.cmcscope, item.cmc_scope, item.temp_cmc);
  const cmcTaken = tempcmc !== undefined && toNumber(tempcmc) > expandeduncertainty
    ? toNumber(tempcmc)
    : expandeduncertainty;

  return {
    srNo: item.sr_no ?? index + 1,
    values: uucValues,
    unit: firstDefined(item.unit_description, item.uuc_unit_description, item.unit) ?? "",
    calibrationPoint: firstDefined(item.calibration_point, item.point) ?? "",
    average: firstDefined(item.average_uuc, item.averageuuc) ?? "",
    stdDeviation: repeatabilityRaw === undefined ? "" : repeatability,
    typeA: typea,
    uncertaintyMaster1: masterunc,
    uncertaintyMaster2Value: masterunc2,
    sensitivityCoefficient: firstDefined(item.sensitivity_coefficient, item.sensitivitycoefficient) ?? "",
    uncertaintyMaster2Celsius: masterunc2inc,
    stabilityBath: stability,
    uniformityBath: uniformity,
    driftMaster: drift,
    leastCountUuc: leastcountRaw ?? "",
    combinedUncertainty: comuncer,
    degreeOfFreedom: dof,
    coverageFactor: coveragefactor,
    expandedUncertaintyValue: expandeduncertainty,
    cmcTaken,
  };
});

// Same 24 columns and headers as TSWOI (uncertaintytswi.php has the identical layout)
export const TswiCmcTable = ({ data }) => <TswoiCmcTable data={data} />;

export default TswiCmcTable;
