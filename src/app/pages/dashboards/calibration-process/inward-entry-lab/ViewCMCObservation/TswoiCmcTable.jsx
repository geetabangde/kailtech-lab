import { formatUncertaintyValue } from "./viewCmcUtils";

const toNumber = (val) => {
  const num = parseFloat(val);
  return isNaN(num) ? 0 : num;
};

const firstDefined = (...vals) => vals.find((v) => v !== undefined && v !== null && v !== "");

// Student-t coverage factor by degrees of freedom, as in the PHP
const getCoverageFactor = (dof) => {
  if (dof === "-") return 2;
  if (dof > 30) return 2;
  if (dof > 25) return 2.09;
  if (dof > 20) return 2.11;
  if (dof > 19) return 2.13;
  if (dof > 18) return 2.14;
  if (dof > 17) return 2.15;
  if (dof > 16) return 2.16;
  if (dof > 15) return 2.17;
  if (dof > 14) return 2.18;
  if (dof > 13) return 2.20;
  if (dof > 12) return 2.21;
  if (dof > 11) return 2.23;
  if (dof > 10) return 2.25;
  if (dof > 9) return 2.28;
  if (dof > 8) return 2.32;
  if (dof > 7) return 2.37;
  if (dof > 6) return 2.43;
  if (dof > 5) return 2.52;
  if (dof > 4) return 2.65;
  if (dof > 3) return 2.87;
  if (dof > 2) return 3.31;
  if (dof > 1) return 4.53;
  if (dof >= 0) return 13.97;
  return 2;
};

/**
 * Maps the uncertainty API rows to table rows using the TSWOI PHP formulas.
 * Differs from RTDWI in two places:
 *  - Type A = (std dev / sqrt(5)) * sensitivity coefficient
 *  - Master-2 uncertainty = raw master-2 CMC (%) * UUC "average with corrected mv" / 100
 */
export const mapTswoiCmcRows = (apiData) => (Array.isArray(apiData) ? apiData : []).map((item, index) => {
  const uucValues = Array.isArray(item.uuc)
    ? item.uuc
    : [item.uuc_0, item.uuc_1, item.uuc_2, item.uuc_3, item.uuc_4].map((v) => v ?? "");

  const repeatabilityRaw = firstDefined(item.std_deviation, item.repeatability);
  const repeatability = toNumber(repeatabilityRaw);
  const sensitivity = toNumber(firstDefined(item.sensitivity_coefficient, item.sensitivitycoefficient));
  const saverageuuc = toNumber(firstDefined(item.s_average_uuc, item.saverageuuc, item.saverage_uuc));

  const masterunc = toNumber(firstDefined(item.uncertainty_master_1_sensor, item.masterunc, item.master_uncertainty));
  const rawMasterUnc2 = toNumber(firstDefined(item.raw_masterunc2, item.uncertainty_master_2_dmm_value, item.masterunc2));
  const masterunc2 = (rawMasterUnc2 * saverageuuc) / 100;
  const masterunc2inc = masterunc2 * sensitivity;

  const typea = (repeatability / Math.sqrt(5)) * sensitivity;
  const stability = toNumber(firstDefined(item.stability_bath, item.stability));
  const uniformity = toNumber(firstDefined(item.uniformity_bath, item.uniformity));
  const drift = 0.1 * masterunc;
  // PHP takes this from the master matrix, though the column is labelled "Least Count of UUC"
  const leastcount = toNumber(firstDefined(item.least_count_uuc, item.least_count, item.leastcount));

  const comuncer = Math.sqrt(
    Math.pow(typea, 2) +
    Math.pow(masterunc / 2, 2) +
    Math.pow(masterunc2inc / 2, 2) +
    Math.pow(stability / Math.sqrt(3), 2) +
    Math.pow(uniformity / Math.sqrt(3), 2) +
    Math.pow(drift / Math.sqrt(3), 2) +
    Math.pow(leastcount / 2 / Math.sqrt(3), 2)
  );

  // PHP: "-" when there is no repeatability; guard typea = 0 (e.g. sensitivity 0) against division by zero
  const dof = repeatability !== 0 && typea !== 0
    ? (Math.pow(comuncer, 4) / Math.pow(typea, 4)) * 4
    : "-";
  const coveragefactor = getCoverageFactor(dof);
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
    leastCountUuc: firstDefined(item.least_count_uuc, item.least_count, item.leastcount) ?? "",
    combinedUncertainty: comuncer,
    degreeOfFreedom: dof,
    coverageFactor: coveragefactor,
    expandedUncertaintyValue: expandeduncertainty,
    cmcTaken,
  };
});

const fmt = (val, decimals = 6) => (typeof val === "number" ? formatUncertaintyValue(val, decimals) : val);

const cellClass = "border border-gray-300 px-1 py-2";

export const TswoiCmcTable = ({ data }) => (
  <div className="overflow-x-auto">
    <table className="w-full border-collapse text-[12px] text-gray-700 min-w-max">
      <thead>
        <tr className="bg-gray-100 text-center">
          <th colSpan="11" className={`${cellClass} bg-gray-200 font-semibold text-xs`}>
            Type A Factor
          </th>
          {/* PHP has colspan="3" here, but the Type B group is 8 columns wide */}
          <th colSpan="8" className={`${cellClass} bg-gray-200 font-semibold text-xs`}>
            Type B Factor
          </th>
          <th colSpan="5" className={`${cellClass} bg-gray-200 font-semibold text-xs`}>
            Uncertainty Measurement
          </th>
        </tr>
        <tr className="bg-gray-200 text-center text-[12px] font-medium">
          <th className={cellClass}>Sr no</th>
          <th className={cellClass}>1</th>
          <th className={cellClass}>2</th>
          <th className={cellClass}>3</th>
          <th className={cellClass}>4</th>
          <th className={cellClass}>5</th>
          <th className={cellClass}>Unit</th>
          <th className={cellClass}>Calibration point</th>
          <th className={cellClass}>Average</th>
          <th className={cellClass}>Std Deviation</th>
          <th className={cellClass}>Type A</th>
          <th className={cellClass}>Uncertainty of master-1<br />Sensor in °C</th>
          <th className={cellClass}>Uncertainty of master-2<br />in (6.5DMM) in value</th>
          <th className={cellClass}>Sensitivity Coefficient</th>
          <th className={cellClass}>Uncertainty of master-2<br />in (°C)</th>
          <th className={cellClass}>Stability Of Bath</th>
          <th className={cellClass}>Uniformity Of Bath</th>
          <th className={cellClass}>Drift Of Master</th>
          <th className={cellClass}>Least Count of UUC</th>
          <th className={cellClass}>Combined Uncertainty</th>
          <th className={cellClass}>Degree of Freedom</th>
          <th className={cellClass}>Coverage Factor (k)</th>
          <th className={cellClass}>Expanded Uncertainty in Value</th>
          <th className={cellClass}>CmC Taken</th>
        </tr>
      </thead>
      <tbody>
        {(data || []).map((row, i) => (
          <tr key={i} className="hover:bg-gray-50 text-center text-[12px]">
            <td className={cellClass}>{row.srNo}</td>
            {(row.values || []).map((v, idx) => (
              <td key={idx} className={cellClass}>{v}</td>
            ))}
            <td className={cellClass}>{row.unit}</td>
            <th className={cellClass}>{row.calibrationPoint}</th>
            <td className={cellClass}>{row.average}</td>
            <td className={cellClass}>{fmt(row.stdDeviation)}</td>
            <td className={cellClass}>{fmt(row.typeA)}</td>
            <td className={cellClass}>{fmt(row.uncertaintyMaster1)}</td>
            <td className={cellClass}>{fmt(row.uncertaintyMaster2Value)}</td>
            <td className={cellClass}>{row.sensitivityCoefficient}</td>
            <td className={cellClass}>{fmt(row.uncertaintyMaster2Celsius)}</td>
            <td className={cellClass}>{fmt(row.stabilityBath)}</td>
            <td className={cellClass}>{fmt(row.uniformityBath)}</td>
            <td className={cellClass}>{fmt(row.driftMaster)}</td>
            <td className={cellClass}>{row.leastCountUuc}</td>
            <td className={cellClass}>{fmt(row.combinedUncertainty)}</td>
            <td className={cellClass}>{row.degreeOfFreedom === "-" ? "-" : fmt(row.degreeOfFreedom, 2)}</td>
            <td className={cellClass}>{fmt(row.coverageFactor, 2)}</td>
            <td className={cellClass}>{fmt(row.expandedUncertaintyValue)}</td>
            <td className={cellClass}>{fmt(row.cmcTaken)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default TswoiCmcTable;
