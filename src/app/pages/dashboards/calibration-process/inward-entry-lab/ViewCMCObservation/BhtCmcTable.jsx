/**
 * CMC table for BHT (Brinell Hardness Tester).
 *
 * Port of uncertaintybht.php. Two budgets, chosen per point by its UUC unit:
 *
 * Direct-reading units (98, 99, 89, 90, 91):
 *   typeA    = stdDev / sqrt(5) * 1.14
 *   combined = sqrt(typeA^2 + (masterunc/2)^2 + (leastcount/sqrt(6))^2)
 *   dof      = combined^4 / typeA^4 * 4, k from the t-table
 *   CMC      = max(expanded, scope CMC)                        (in value)
 *
 * Diameter-measured units (converted to HBW):
 *   sens     = (average/mean) * (D + sqrt(D^2 - mean^2)) / sqrt(D^2 - mean^2)
 *   masterunc(value) = masterunc(%) * master0 / 100
 *   combined = sqrt(typeA^2 + (masterunc/2)^2 + (leastcount/2/sqrt(3) * sens)^2)
 *   dof      = combined^4 / stdDev^4 / 4, k = 2
 *   CMC      = max(expanded %, scope CMC)                      (in %)
 *
 * The API's computed figures are shown when present. Anything missing is derived
 * from the readings with the formulas above, except the scope CMC (a cmcscope
 * lookup), which only the API can supply.
 */

const READING_COUNT = 5;

export const BHT_DIRECT_UNITS = ['98', '99', '89', '90', '91'];

// Ball diameter (mm) per UUC unit; PHP default is 2.5
const BHT_BALL_DIA = { 85: 2.5, 93: 2.5, 134: 5, 135: 5, 136: 10, 137: 10 };

const isBlank = (value) => value === null || value === undefined || value === '';
const toNum = (value) => (isBlank(value) ? NaN : parseFloat(value));

const fmt = (value, decimals) => {
  const num = toNum(value);
  return isNaN(num) || !isFinite(num) ? '-' : num.toFixed(decimals);
};

const raw = (value) => (isBlank(value) ? '-' : value);

// The API may use snake_case or the PHP variable names; accept either.
const pick = (row, ...keys) => {
  for (const key of keys) {
    if (!isBlank(row?.[key])) return row[key];
  }
  return undefined;
};

// PHP's t-table for the direct-reading budget
export const getBhtCoverageFactor = (dof) => {
  if (dof === '-' || isNaN(dof)) return 2;
  const table = [
    [30, 2], [25, 2.09], [20, 2.11], [19, 2.13], [18, 2.14], [17, 2.15], [16, 2.16],
    [15, 2.17], [14, 2.18], [13, 2.2], [12, 2.21], [11, 2.23], [10, 2.25], [9, 2.28],
    [8, 2.32], [7, 2.37], [6, 2.43], [5, 2.52], [4, 2.65], [3, 2.87], [2, 3.31], [1, 4.53],
  ];
  for (const [limit, k] of table) {
    if (dof > limit) return k;
  }
  return dof >= 0 ? 13.97 : 2;
};

// MySQL STDDEV_SAMP over the stored readings
const stdDevSample = (values) => {
  if (values.length < 2) return NaN;
  const avg = values.reduce((s, v) => s + v, 0) / values.length;
  return Math.sqrt(values.reduce((s, v) => s + (v - avg) ** 2, 0) / (values.length - 1));
};

const getReadings = (row) => {
  const supplied = pick(row, 'uuc_readings', 'uuc_observations', 'observations', 'values');
  return Array.from({ length: READING_COUNT }, (_, i) => {
    const direct = pick(row, `uuc${i}`, `uuc_${i}`);
    if (direct !== undefined) return direct;
    const item = Array.isArray(supplied) ? supplied[i] : undefined;
    return item && typeof item === 'object' ? item.value : item;
  });
};

/** Full uncertainty budget for one row: API figures first, PHP formulas for the rest. */
export const computeBhtCmcRow = (row) => {
  const readings = getReadings(row);
  const unitId = String(pick(row, 'unit_id', 'uucunit', 'uuc_unit') ?? '').trim();
  const direct = row?.is_direct !== undefined ? !!row.is_direct : BHT_DIRECT_UNITS.includes(unitId);

  const testpoint = toNum(pick(row, 'testpoint', 'test_point', 'point', 'calibration_point'));
  const master0 = pick(row, 'master0', 'reference_block_value', 'master');
  const mean = direct ? '-' : pick(row, 'mean', 'mean_diameter', 'caverageuuc');
  const averageuuc = pick(row, 'averageuuc', 'average_uuc', 'average');
  const leastcount = pick(row, 'leastcount', 'least_count', 'least_count_uuc');
  const lc = toNum(leastcount) || 0;

  const numericReadings = readings.map(toNum).filter((v) => !isNaN(v));
  const apiRepeatability = toNum(pick(row, 'repeatability', 'std_deviation'));
  const repeatability = !isNaN(apiRepeatability) ? apiRepeatability : stdDevSample(numericReadings);
  const rep = isNaN(repeatability) ? 0 : repeatability;

  const apiTypeA = toNum(pick(row, 'typea', 'type_a'));
  const typea = !isNaN(apiTypeA) ? apiTypeA : (rep / Math.sqrt(5)) * 1.14;

  const result = {
    readings,
    direct,
    unit: pick(row, 'unit', 'unit_desc', 'unit_description'),
    // Direct units show the calibration point, the others the stored master (reference block)
    calibrationPoint: direct ? pick(row, 'point', 'calibration_point', 'testpoint') : master0,
    mean,
    ballDia: direct ? '-' : pick(row, 'balldia', 'ball_dia') ?? BHT_BALL_DIA[unitId] ?? 2.5,
    averageuuc,
    repeatability,
    typea,
    leastcount,
  };

  // Sensitivity coefficient (diameter-measured units only)
  let sens = NaN;
  if (!direct) {
    const apiSens = toNum(pick(row, 'sensitivitycoff', 'sensitivity_coefficient'));
    if (!isNaN(apiSens)) {
      sens = apiSens;
    } else {
      const D = toNum(result.ballDia);
      const m = toNum(mean);
      const avg = toNum(averageuuc);
      const root = Math.sqrt(D * D - m * m);
      sens = (avg / m) * (D + root) / root;
    }
  }
  result.sensitivitycoff = direct ? '-' : sens;

  // Master uncertainty in value. For HBW the scope CMC is a %, converted against master0.
  let masterunc = toNum(pick(row, 'masterunc', 'master_uncertainty'));
  if (isNaN(masterunc)) {
    const scopeMasterUnc = toNum(pick(row, 'masterunc_scope', 'master_cmc'));
    masterunc = direct
      ? scopeMasterUnc
      : (scopeMasterUnc * toNum(master0)) / 100;
  }
  const mu = isNaN(masterunc) ? 0 : masterunc;
  result.masterunc = masterunc;

  let comuncer = toNum(pick(row, 'comuncer', 'combined_uncertainty'));
  if (isNaN(comuncer)) {
    const lcTerm = direct ? lc / Math.sqrt(6) : (lc / 2 / Math.sqrt(3)) * (isNaN(sens) ? 0 : sens);
    comuncer = Math.sqrt(typea ** 2 + (mu / 2) ** 2 + lcTerm ** 2);
  }
  result.comuncer = comuncer;

  let dof = pick(row, 'dof', 'degree_of_freedom');
  if (dof === undefined) {
    if (!rep) {
      dof = '-';
    } else {
      dof = direct
        ? (comuncer ** 4 / typea ** 4) * 4
        : comuncer ** 4 / rep ** 4 / 4;
    }
  }
  result.dof = dof;

  const apiK = toNum(pick(row, 'coveragefactor', 'coverage_factor', 'kfactor'));
  result.coveragefactor = !isNaN(apiK) ? apiK : (direct ? getBhtCoverageFactor(toNum(dof)) : 2);

  const apiExpanded = toNum(pick(row, 'expandeduncertainty', 'expanded_uncertainty'));
  result.expandeduncertainty = !isNaN(apiExpanded) ? apiExpanded : comuncer * result.coveragefactor;

  const apiPercent = toNum(pick(row, 'expandeduncertaintypercent', 'expanded_uncertainty_percent'));
  result.expandeduncertaintypercent = !isNaN(apiPercent)
    ? apiPercent
    : (result.expandeduncertainty / testpoint) * 100;

  const apiCmc = toNum(pick(row, 'cmcuncertainty', 'cmc_taken'));
  if (!isNaN(apiCmc)) {
    result.cmcuncertainty = apiCmc;
  } else {
    // Direct units take the CMC in value, HBW units in %
    const own = direct ? result.expandeduncertainty : result.expandeduncertaintypercent;
    const scope = toNum(pick(row, 'tempcmc', 'cmc_scope', 'cmcscope'));
    result.cmcuncertainty = !isNaN(scope) && scope > own ? scope : own;
  }

  return result;
};

const TH = 'border border-gray-300 px-2 py-2';
const TD = 'border border-gray-300 px-2 py-1';

export const BhtCmcTable = ({ data }) => {
  const rows = Array.isArray(data) ? data : [];

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[12px] text-gray-700 min-w-max">
        <thead>
          <tr className="bg-gray-100 font-semibold">
            <th colSpan="16" className={`${TH} bg-gray-200 text-center`}>Type A Factor</th>
            <th colSpan="2" className={`${TH} bg-gray-200 text-center`}>Type B Factor</th>
            <th colSpan="6" className={`${TH} bg-gray-200 text-center`}>Uncertainty Measurement</th>
          </tr>
          <tr className="bg-gray-200 text-center font-medium text-[11px]">
            <th className={TH}>Sr no</th>
            <th className={TH}>Unit type</th>
            <th className={TH}>Mode</th>
            {Array.from({ length: READING_COUNT }, (_, i) => (
              <th key={i} className={TH}>{i + 1}</th>
            ))}
            <th className={TH}>Unit</th>
            <th className={TH}>Calibration point/Refrence Block Value</th>
            <th className={TH}>Mean</th>
            <th className={TH}>Ball Dia (mm) D</th>
            <th className={TH}>Snentivity Cofficent</th>
            <th className={TH}>Average</th>
            <th className={TH}>Std Deviation</th>
            <th className={TH}>Type A</th>

            <th className={TH}>Uncertainty of master in value</th>
            <th className={TH}>Least Count of UUC</th>

            <th className={TH}>Combined Uncertainty</th>
            <th className={TH}>Degree of Freedom</th>
            <th className={TH}>Coverage Factor (k)</th>
            <th className={TH}>Expanded Uncertainty in Value</th>
            <th className={TH}>Expanded Uncertainty in %</th>
            <th className={TH}>CMC Taken</th>
          </tr>
        </thead>
        <tbody>
          {rows.length > 0 ? (
            rows.map((row, index) => {
              const r = computeBhtCmcRow(row);
              return (
                <tr key={index} className="text-center hover:bg-gray-50 transition-colors">
                  <td className={TD}>{pick(row, 'sr_no', 'srNo') ?? index + 1}</td>
                  <td className={TD}>{raw(pick(row, 'unittype', 'unit_type', 'unitType'))}</td>
                  <td className={TD}>{raw(row.mode)}</td>

                  {r.readings.map((reading, i) => (
                    <td key={i} className={TD}>{raw(reading)}</td>
                  ))}

                  <td className={TD}>{raw(r.unit)}</td>
                  <td className={TD}>{raw(r.calibrationPoint)}</td>
                  <td className={TD}>{raw(r.mean)}</td>
                  <td className={TD}>{raw(r.ballDia)}</td>
                  <td className={TD}>{r.direct ? '-' : fmt(r.sensitivitycoff, 6)}</td>
                  <td className={TD}>{raw(r.averageuuc)}</td>
                  <td className={TD}>{fmt(r.repeatability, 6)}</td>
                  <td className={TD}>{fmt(r.typea, 6)}</td>

                  <td className={TD}>{fmt(r.masterunc, 6)}</td>
                  <td className={TD}>{raw(r.leastcount)}</td>

                  <td className={TD}>{fmt(r.comuncer, 8)}</td>
                  <td className={TD}>{r.dof === '-' ? '-' : fmt(r.dof, 2)}</td>
                  <td className={TD}>{r.coveragefactor}</td>
                  <td className={TD}>{fmt(r.expandeduncertainty, 5)}</td>
                  <td className={TD}>{fmt(r.expandeduncertaintypercent, 4)}</td>
                  <td className={TD}>{fmt(r.cmcuncertainty, 4)}</td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan="24" className="border border-gray-300 px-4 py-4 text-center text-gray-500">
                No observation data available.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default BhtCmcTable;
