/**
 * CMC table for DUTM. Port of uncertaintydutm.php.
 *
 *   average   = avg(master 0, master 1), each taken to the master least-count decimals
 *   stdDev    = STDDEV_SAMP(master 0, master 1)
 *   typeA     = stdDev / sqrt(2)
 *   combined  = sqrt(typeA^2 + (masterunc/2)^2 + (leastcount/2/sqrt(3))^2)
 *   dof       = combined^4 / typeA^4 * 4    ('-' when stdDev is 0), k from the t-table
 *   expanded  = combined * k,  expanded % = expanded / testpoint * 100
 *   CMC       = max(expanded, scope CMC)
 *
 * The API's computed figures are shown when present. Anything missing is derived from the
 * readings with the formulas above, except the master uncertainty (a masterscopematrix
 * lookup/interpolation) and the scope CMC (a cmcscope lookup), which only the API can supply.
 */

const READING_COUNT = 2;

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

// PHP t-table
export const getDutmCoverageFactor = (dof) => {
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

const lcDecimals = (leastCount) => {
  if (isBlank(leastCount) || String(leastCount).trim().toUpperCase() === 'NA') return null;
  const s = String(leastCount).trim();
  return s.includes('.') ? s.split('.')[1].length : 0;
};

const getReadings = (row) => {
  const supplied = pick(row, 'master_readings', 'master_observations', 'masters', 'values');
  return Array.from({ length: READING_COUNT }, (_, i) => {
    const direct = pick(row, `master${i}`, `master_${i}`);
    if (direct !== undefined) return direct;
    const item = Array.isArray(supplied) ? supplied[i] : undefined;
    return item && typeof item === 'object' ? item.value : item;
  });
};

/** Full uncertainty budget for one row: API figures first, PHP formulas for the rest. */
export const computeDutmCmcRow = (row) => {
  const readings = getReadings(row);
  const numeric = readings.map(toNum).filter((v) => !isNaN(v));

  const testpoint = toNum(pick(row, 'testpoint', 'test_point', 'point', 'calibration_point'));
  const leastcount = pick(row, 'leastcount', 'least_count', 'least_count_uuc');
  const lc = toNum(leastcount) || 0;

  // PHP: avg(format(value, mlc)) - each reading taken to the master least-count decimals
  let averagemaster = toNum(pick(row, 'averagemaster', 'average_master', 'average'));
  if (isNaN(averagemaster) && numeric.length) {
    const mlc = lcDecimals(pick(row, 'master_least_count', 'masterleastcount'));
    const rounded = numeric.map((v) => (mlc === null ? v : Number(v.toFixed(mlc))));
    averagemaster = rounded.reduce((s, v) => s + v, 0) / rounded.length;
  }

  const apiRepeatability = toNum(pick(row, 'repeatability', 'std_deviation'));
  const repeatability = !isNaN(apiRepeatability) ? apiRepeatability : stdDevSample(numeric);
  const rep = isNaN(repeatability) ? 0 : repeatability;

  const apiTypeA = toNum(pick(row, 'typea', 'type_a'));
  const typea = !isNaN(apiTypeA) ? apiTypeA : rep / Math.sqrt(2);

  const masterunc = toNum(pick(row, 'masterunc', 'master_uncertainty', 'uncertainty_master'));
  const mu = isNaN(masterunc) ? 0 : masterunc;

  let comuncer = toNum(pick(row, 'comuncer', 'combined_uncertainty'));
  if (isNaN(comuncer)) {
    comuncer = Math.sqrt(typea ** 2 + (mu / 2) ** 2 + (lc / 2 / Math.sqrt(3)) ** 2);
  }

  let dof = pick(row, 'dof', 'degree_of_freedom');
  if (dof === undefined) dof = rep ? (comuncer ** 4 / typea ** 4) * 4 : '-';

  const apiK = toNum(pick(row, 'coveragefactor', 'coverage_factor', 'kfactor'));
  const coveragefactor = !isNaN(apiK) ? apiK : getDutmCoverageFactor(toNum(dof));

  const apiExpanded = toNum(pick(row, 'expandeduncertainty', 'expanded_uncertainty'));
  const expandeduncertainty = !isNaN(apiExpanded) ? apiExpanded : comuncer * coveragefactor;

  const apiPercent = toNum(pick(row, 'expandeduncertaintypercent', 'expanded_uncertainty_percent'));
  const expandeduncertaintypercent = !isNaN(apiPercent) ? apiPercent : (expandeduncertainty / testpoint) * 100;

  let cmcuncertainty = toNum(pick(row, 'cmcuncertainty', 'cmc_taken'));
  if (isNaN(cmcuncertainty)) {
    const scope = toNum(pick(row, 'tempcmc', 'cmc_scope', 'cmcscope'));
    cmcuncertainty = !isNaN(scope) && scope > expandeduncertainty ? scope : expandeduncertainty;
  }

  return {
    readings,
    unit: pick(row, 'unit', 'unit_desc', 'unit_description'),
    calibrationPoint: pick(row, 'point', 'calibration_point', 'testpoint'),
    averagemaster,
    repeatability,
    typea,
    masterunc,
    leastcount,
    comuncer,
    dof,
    coveragefactor,
    expandeduncertainty,
    expandeduncertaintypercent,
    cmcuncertainty,
  };
};

const TH = 'border border-gray-300 px-2 py-2';
const TD = 'border border-gray-300 px-2 py-1';

export const DutmCmcTable = ({ data }) => {
  const rows = Array.isArray(data) ? data : [];

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[12px] text-gray-700 min-w-max">
        <thead>
          <tr className="bg-gray-100 font-semibold">
            <th colSpan="8" className={`${TH} bg-gray-200 text-center`}>Type A Factor</th>
            <th colSpan="2" className={`${TH} bg-gray-200 text-center`}>Type B Factor</th>
            <th colSpan="6" className={`${TH} bg-gray-200 text-center`}>Uncertainty Measurement</th>
          </tr>
          <tr className="bg-gray-200 text-center font-medium text-[11px]">
            <th className={TH}>Sr no</th>
            {Array.from({ length: READING_COUNT }, (_, i) => (
              <th key={i} className={TH}>{i + 1}</th>
            ))}
            <th className={TH}>Unit</th>
            <th className={TH}>Calibration point</th>
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
              const r = computeDutmCmcRow(row);
              return (
                <tr key={index} className="text-center hover:bg-gray-50 transition-colors">
                  <td className={TD}>{pick(row, 'sr_no', 'srNo') ?? index + 1}</td>
                  {r.readings.map((reading, i) => (
                    <td key={i} className={TD}>{raw(reading)}</td>
                  ))}
                  <td className={TD}>{raw(r.unit)}</td>
                  <td className={TD}>{raw(r.calibrationPoint)}</td>
                  <td className={TD}>{isNaN(r.averagemaster) ? '-' : String(Number(r.averagemaster.toFixed(10)))}</td>
                  <td className={TD}>{fmt(r.repeatability, 6)}</td>
                  <td className={TD}>{fmt(r.typea, 6)}</td>

                  <td className={TD}>{fmt(r.masterunc, 6)}</td>
                  <td className={TD}>{raw(r.leastcount)}</td>

                  <td className={TD}>{fmt(r.comuncer, 8)}</td>
                  <td className={TD}>{r.dof === '-' ? '-' : fmt(r.dof, 2)}</td>
                  <td className={TD}>{r.coveragefactor}</td>
                  <td className={TD}>{fmt(r.expandeduncertainty, 5)}</td>
                  <td className={TD}>{fmt(r.expandeduncertaintypercent, 4)}</td>
                  <td className={TD}>{fmt(r.cmcuncertainty, 5)}</td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan="16" className="border border-gray-300 px-4 py-4 text-center text-gray-500">
                No observation data available.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default DutmCmcTable;
