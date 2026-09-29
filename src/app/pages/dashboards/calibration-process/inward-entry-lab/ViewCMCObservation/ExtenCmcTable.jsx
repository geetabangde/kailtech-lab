/**
 * CMC table for EXTEN (Extensometer). Port of uncertaintyexten.php.
 *
 * One row per matrix type, taken at its largest calibration point:
 *   max abs bias     = max(error 0, error 1)
 *   max rel bias %   = max(percenterror 0, percenterror 1)
 *   max rel bias mm  = uuc 0 * max rel bias % / 100
 *   mean             = (master 0 + master 0) / 2          (sic - the PHP averages master 0 with itself)
 *   stdDev           = STDDEV_SAMP(error 0, error 1),  typeA = stdDev / sqrt(2)
 *   thermal coeffs   = stored value * 1e-6,  diff = |uuc - master| (1e-6 when equal)
 *   u temp device mm = mean * thermal master * temp-device CMC
 *   u thermal 20%    = mean * diff * 2 * 0.2
 *   u temp diff 0.5  = mean * diff * 2 * 0.5
 *   combined = sqrt((maxRel/2/sqrt3)^2 + (vernier/2)^2 + 2*(calibrator/2)^2 + (lc/2/sqrt3)^2
 *                   + (uTempDevice/sqrt3)^2 + (uThermal20/sqrt3)^2 + (uTempDiff/sqrt3)^2)
 *   dof = combined^4 / typeA^4 ('-' when stdDev is 0), k from the t-table
 *   expanded (um) = combined * k * 1000,  CMC = max(expanded, scope CMC)
 *
 * The API's computed figures are shown when present; anything missing is derived with the formulas
 * above. The calibrator / vernier uncertainties, temperature-device CMC and scope CMC come from
 * masterscopematrix / cmcscope lookups, so only the API can supply them.
 */

const isBlank = (value) => value === null || value === undefined || value === '';
const toNum = (value) => (isBlank(value) ? NaN : parseFloat(value));
const num0 = (value) => {
  const n = toNum(value);
  return isNaN(n) ? 0 : n;
};

// Unrounded, with float noise stripped
const plain = (value) => {
  const n = toNum(value);
  return isNaN(n) || !isFinite(n) ? '-' : String(Number(n.toFixed(12)));
};

const fmt = (value, decimals) => {
  const n = toNum(value);
  return isNaN(n) || !isFinite(n) ? '-' : n.toFixed(decimals);
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
export const getExtenCoverageFactor = (dof) => {
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

// MySQL STDDEV_SAMP
const stdDevSample = (values) => {
  if (values.length < 2) return NaN;
  const avg = values.reduce((s, v) => s + v, 0) / values.length;
  return Math.sqrt(values.reduce((s, v) => s + (v - avg) ** 2, 0) / (values.length - 1));
};

const setValue = (row, names, listNames, i) => {
  const direct = pick(row, ...names.map((n) => `${n}${i}`), ...names.map((n) => `${n}_${i}`));
  if (direct !== undefined) return direct;
  const list = pick(row, ...listNames);
  const item = Array.isArray(list) ? list[i] : undefined;
  return item && typeof item === 'object' ? item.value : item;
};

// max() of two stored values; PHP compares numeric strings numerically
const maxOf = (a, b) => {
  const na = toNum(a);
  const nb = toNum(b);
  if (isNaN(na)) return isNaN(nb) ? undefined : b;
  if (isNaN(nb)) return a;
  return na > nb ? a : b;
};

/** Full uncertainty budget for one row: API figures first, PHP formulas for the rest. */
export const computeExtenCmcRow = (row) => {
  const masters = [0, 1].map((i) => setValue(row, ['master'], ['master_readings', 'masters'], i));
  const errors = [0, 1].map((i) => setValue(row, ['error'], ['errors', 'absolute_bias_errors'], i));
  const percentErrors = [0, 1].map((i) =>
    setValue(row, ['percenterror', 'percent_error'], ['percent_errors', 'relative_bias_errors'], i));
  const uuc0 = setValue(row, ['uuc'], ['uuc_readings'], 0);

  const maxerror = pick(row, 'maxerror', 'max_absolute_bias_error') ?? maxOf(errors[0], errors[1]);
  const maxpercenterror = pick(row, 'maxpercenterror', 'max_relative_bias_error_percent')
    ?? maxOf(percentErrors[0], percentErrors[1]);
  const maxRelApi = toNum(pick(row, 'maxreleativebiaserror', 'max_relative_bias_error_mm'));
  const maxreleativebiaserror = !isNaN(maxRelApi) ? maxRelApi : (num0(uuc0) * num0(maxpercenterror)) / 100;

  // PHP: ($master0 + $master0) / 2
  const meanApi = toNum(pick(row, 'averagemaster', 'mean', 'average_master'));
  const averagemaster = !isNaN(meanApi) ? meanApi : (num0(masters[0]) + num0(masters[0])) / 2;

  const repApi = toNum(pick(row, 'repeatability', 'std_deviation'));
  const repeatability = !isNaN(repApi)
    ? repApi
    : stdDevSample(errors.map(toNum).filter((v) => !isNaN(v)));
  const rep = isNaN(repeatability) ? 0 : repeatability;

  const typeaApi = toNum(pick(row, 'typea', 'type_a'));
  const typea = !isNaN(typeaApi) ? typeaApi : rep / Math.sqrt(2);

  const masterunc = num0(pick(row, 'masterunc', 'uncertainty_of_calibrator', 'master_uncertainty'));
  const uncertaintyofvernier = num0(pick(row, 'uncertaintyofvernier', 'uncertainty_of_vernier'));
  const leastcount = pick(row, 'leastcount', 'least_count');
  const lc = num0(leastcount);

  // Scaled coefficients as the PHP prints them; stored summary values are scaled by 1e-6 here
  const scaledMaster = toNum(pick(row, 'thermalcomaster', 'thermal_coefficient_master'));
  const thermalcomaster = !isNaN(scaledMaster) ? scaledMaster : num0(pick(row, 'thermalcoffmaster')) * 1e-6;
  const scaledUuc = toNum(pick(row, 'thermalcouuc', 'thermal_coefficient_uuc'));
  const thermalcouuc = !isNaN(scaledUuc) ? scaledUuc : num0(pick(row, 'thermalcoffuuc')) * 1e-6;
  let diffofthercoff = Math.abs(thermalcouuc - thermalcomaster);
  if (diffofthercoff === 0) diffofthercoff = 0.000001;

  const uncertaintytempdevice = num0(pick(row, 'uncertaintytempdevice', 'temp_device_cmc'));
  const tempMmApi = toNum(pick(row, 'uncertaintytempdevicemm', 'uncertainty_temp_device_mm'));
  const uncertaintytempdevicemm = !isNaN(tempMmApi)
    ? tempMmApi
    : averagemaster * thermalcomaster * uncertaintytempdevice;
  const th20Api = toNum(pick(row, 'stduncthercof20', 'std_unc_thermal_coeff_20'));
  const stduncthercof20 = !isNaN(th20Api) ? th20Api : averagemaster * diffofthercoff * 2 * 0.2;
  const diffApi = toNum(pick(row, 'stduncdiffinmasuuc', 'std_unc_temp_diff'));
  const stduncdiffinmasuuc = !isNaN(diffApi) ? diffApi : averagemaster * diffofthercoff * 2 * 0.5;

  let comuncer = toNum(pick(row, 'comuncer', 'combined_uncertainty'));
  if (isNaN(comuncer)) {
    comuncer = Math.sqrt(
      (maxreleativebiaserror / 2 / Math.sqrt(3)) ** 2
      + (uncertaintyofvernier / 2) ** 2
      + (masterunc / 2) ** 2
      + (masterunc / 2) ** 2
      + (lc / 2 / Math.sqrt(3)) ** 2
      + (uncertaintytempdevicemm / Math.sqrt(3)) ** 2
      + (stduncthercof20 / Math.sqrt(3)) ** 2
      + (stduncdiffinmasuuc / Math.sqrt(3)) ** 2
    );
  }

  let dof = pick(row, 'dof', 'degree_of_freedom');
  if (dof === undefined) dof = rep ? comuncer ** 4 / typea ** 4 : '-';

  const kApi = toNum(pick(row, 'coveragefactor', 'coverage_factor', 'kfactor'));
  const coveragefactor = !isNaN(kApi) ? kApi : getExtenCoverageFactor(toNum(dof));

  const euApi = toNum(pick(row, 'expandeduncertainty', 'expanded_uncertainty'));
  const expandeduncertainty = !isNaN(euApi) ? euApi : comuncer * coveragefactor * 1000;

  let cmcuncertainty = toNum(pick(row, 'cmcuncertainty', 'cmc_taken'));
  if (isNaN(cmcuncertainty)) {
    const scope = toNum(pick(row, 'tempcmc', 'cmc_scope', 'cmcscope'));
    cmcuncertainty = !isNaN(scope) && scope > expandeduncertainty ? scope : expandeduncertainty;
  }

  return {
    masters,
    errors,
    percentErrors,
    maxerror,
    maxpercenterror,
    maxreleativebiaserror,
    unit: pick(row, 'unit', 'unit_desc', 'unit_description'),
    point: pick(row, 'point', 'nominal_value', 'calibration_point'),
    averagemaster,
    repeatability,
    typea,
    masterunc,
    uncertaintyofvernier,
    leastcount,
    thermalcomaster,
    thermalcouuc,
    uncertaintytempdevicemm,
    stduncthercof20,
    stduncdiffinmasuuc,
    comuncer,
    dof,
    coveragefactor,
    expandeduncertainty,
    cmcuncertainty,
  };
};

const TH = 'border border-gray-300 px-2 py-2';
const TD = 'border border-gray-300 px-2 py-1';

export const ExtenCmcTable = ({ data }) => {
  const rows = Array.isArray(data) ? data : [];

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[12px] text-gray-700 min-w-max">
        <thead>
          <tr className="bg-gray-100 font-semibold">
            <th colSpan="15" className={`${TH} bg-gray-200 text-center`}>Type A Factor</th>
            <th colSpan="8" className={`${TH} bg-gray-200 text-center`}>Type B Factor</th>
            <th colSpan="5" className={`${TH} bg-gray-200 text-center`}>Uncertainty Measurement</th>
          </tr>
          <tr className="bg-gray-200 text-center font-medium text-[11px]">
            <th className={TH}>Sr no</th>
            <th className={TH}>1</th>
            <th className={TH}>2</th>
            <th className={TH}>Absolute Bias Error Set 1</th>
            <th className={TH}>Absolute Bias Error Set 2</th>
            <th className={TH}>Relative Bias error Set 1</th>
            <th className={TH}>Relative Bias error Set 2</th>
            <th className={TH}>Max Absolute Bias Error</th>
            <th className={TH}>Max Relative Bias error %</th>
            <th className={TH}>Max Relative Bias error (mm)</th>
            <th className={TH}>Unit</th>
            <th className={TH}>Nominal Value</th>
            <th className={TH}>Mean</th>
            <th className={TH}>Std Deviation</th>
            <th className={TH}>Type A</th>

            <th className={TH}>Uncertainty of Calibrator in mm</th>
            <th className={TH}>Certificate Uncertainty of Vernier Caliper mm</th>
            <th className={TH}>Least Count of UUC</th>
            <th className={TH}>Thermal Coeffcient of Master</th>
            <th className={TH}>Thermal Coeffcient of UUC</th>
            <th className={TH}>Uncertainty due to Temperature Indicating Device (mm)</th>
            <th className={TH}>
              Standard uncertainity due to the thermal coefficient of expansion master and Unit Under Calibration assuming 20% (mm)
            </th>
            <th className={TH}>
              Standard uncertainity due to the difference in temperature master and Unit Under Calibration assuming 0.5˚C (mm)
            </th>

            <th className={TH}>Combined Uncertainty</th>
            <th className={TH}>Degree of Freedom</th>
            <th className={TH}>Coverage Factor (k)</th>
            <th className={TH}>Expanded Uncertainty in &micro;m</th>
            <th className={TH}>CMC taken</th>
          </tr>
        </thead>
        <tbody>
          {rows.length > 0 ? (
            rows.map((row, index) => {
              const r = computeExtenCmcRow(row);
              return (
                <tr key={index} className="text-center hover:bg-gray-50 transition-colors">
                  <td className={TD}>{pick(row, 'sr_no', 'srNo') ?? index + 1}</td>
                  <td className={TD}>{raw(r.masters[0])}</td>
                  <td className={TD}>{raw(r.masters[1])}</td>
                  <td className={TD}>{raw(r.errors[0])}</td>
                  <td className={TD}>{raw(r.errors[1])}</td>
                  <td className={TD}>{raw(r.percentErrors[0])}</td>
                  <td className={TD}>{raw(r.percentErrors[1])}</td>
                  <td className={TD}>{raw(r.maxerror)}</td>
                  <td className={TD}>{raw(r.maxpercenterror)}</td>
                  <td className={TD}>{plain(r.maxreleativebiaserror)}</td>
                  <td className={TD}>{raw(r.unit)}</td>
                  <td className={TD}>{raw(r.point)}</td>
                  <td className={TD}>{plain(r.averagemaster)}</td>
                  <td className={TD}>{fmt(r.repeatability, 6)}</td>
                  <td className={TD}>{fmt(r.typea, 6)}</td>

                  <td className={TD}>{plain(r.masterunc)}</td>
                  <td className={TD}>{plain(r.uncertaintyofvernier)}</td>
                  <td className={TD}>{raw(r.leastcount)}</td>
                  <td className={TD}>{r.thermalcomaster.toExponential(2)}</td>
                  <td className={TD}>{r.thermalcouuc.toExponential(2)}</td>
                  <td className={TD}>{fmt(r.uncertaintytempdevicemm, 8)}</td>
                  <td className={TD}>{fmt(r.stduncthercof20, 8)}</td>
                  <td className={TD}>{fmt(r.stduncdiffinmasuuc, 8)}</td>

                  <td className={TD}>{fmt(r.comuncer, 8)}</td>
                  <td className={TD}>{r.dof === '-' ? '-' : fmt(r.dof, 2)}</td>
                  <td className={TD}>{r.coveragefactor}</td>
                  <td className={TD}>{fmt(r.expandeduncertainty, 4)} &micro;m</td>
                  <td className={TD}>{fmt(r.cmcuncertainty, 4)}</td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan="28" className="border border-gray-300 px-4 py-4 text-center text-gray-500">
                No observation data available.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ExtenCmcTable;
