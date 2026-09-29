/**
 * CMC table for LS. Port of uncertaintyls.php.
 *
 * Two sections, one row per calibration point (points whose unit type contains "waveform"
 * are skipped, as in the PHP):
 *   1. Electric Safety   - unit types listed in the electricalsafety table; drawn only when
 *                          showperformancetest is Yes. showelectricalsafety = Yes hides the
 *                          Mode and Calibration point columns.
 *   2. Performance Test  - every other unit type.
 *
 * Measure rows read the UUC readings / averageuuc, Source rows the master readings / averagemaster:
 *   accuracy  = (instrangemax - instrangemin) * accuracyrange / 100
 *             + testpoint * accuracymeasrement / 100 + accuracyabsolute
 *   u master  = masterunc(%) * average / 100
 *   typeA     = STDDEV_SAMP(readings) / sqrt(5)
 *   combined  = sqrt(typeA^2 + (accuracy/sqrt3)^2 + (u master/2)^2 + (LC/2/sqrt3)^2)
 *               LC = UUC least count, except Performance Test Source rows which use the master
 *               least count; an 'NA' least count drops the term
 *   dof       = combined^4 / typeA^4 * 4 ('-' when stdDev is 0), k from the t-table
 *   expanded  = combined * k,  expanded % = expanded / testpoint * 100
 *   CMC       = expanded % (expanded when unit id is 12), then max(CMC, scope CMC);
 *               Performance Test Source rows on a "Respiration Rate" scope take the scope CMC
 *
 * NIBP Measure rows ("systolic/diastolic") are worked per part: no least-count term, the accuracy
 * uses only the range or measurement term, and dof uses the part's stdDev instead of typeA.
 *
 * The API's computed figures are shown when present; anything missing is derived with the formulas
 * above. The master uncertainty, the master accuracy inputs, the converted test point / least count
 * and the scope CMC come from database lookups, so only the API can supply them.
 */

const READINGS = 5;

const isBlank = (value) => value === null || value === undefined || String(value).trim() === '';
const isNA = (value) => isBlank(value) || String(value).trim().toLowerCase() === 'na';
const toNum = (value) => (isBlank(value) ? NaN : parseFloat(value));
const num0 = (value) => {
  const n = toNum(value);
  return isNaN(n) ? 0 : n;
};

// The API may use snake_case or the PHP variable names; accept either.
const pick = (row, ...keys) => {
  for (const key of keys) {
    if (!isBlank(row?.[key])) return row[key];
  }
  return undefined;
};

// PHP t-table
export const getLsCoverageFactor = (dof) => {
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

// MySQL STDDEV_SAMP (and assumed for the PHP's Stand_Deviation helper)
const stdDevSample = (values) => {
  if (values.length < 2) return NaN;
  const avg = values.reduce((s, v) => s + v, 0) / values.length;
  return Math.sqrt(values.reduce((s, v) => s + (v - avg) ** 2, 0) / (values.length - 1));
};

const isElectricSafetyRow = (row) => {
  const section = String(pick(row, 'section', 'biomedical_section', 'table') ?? '').toLowerCase();
  return row?.is_electrical_safety === true || row?.is_electrical_safety === 1
    || section.includes('electric');
};

const getReadings = (row, isMeasure) => {
  const prefix = isMeasure ? 'uuc' : 'master';
  const list = pick(row, `${prefix}_readings`, 'readings', 'values');
  return Array.from({ length: READINGS }, (_, i) => {
    const direct = pick(row, `${prefix}${i}`, `${prefix}_${i}`);
    if (direct !== undefined) return direct;
    const item = Array.isArray(list) ? list[i] : undefined;
    return item && typeof item === 'object' ? item.value : item;
  });
};

const masterAccuracy = (row, testpoint) => {
  const range = num0(pick(row, 'instrangemax', 'inst_range_max')) - num0(pick(row, 'instrangemin', 'inst_range_min'));
  const accRange = num0(pick(row, 'accuracyrange', 'accuracy_range'));
  const accMeas = num0(pick(row, 'accuracymeasrement', 'accuracymeasurement', 'accuracy_measurement'));
  const accAbs = num0(pick(row, 'accuracyabsolute', 'accuracy_absolute'));
  let acc = 0;
  if (accRange) acc = (range * accRange) / 100;
  if (accMeas) acc += (testpoint * accMeas) / 100;
  if (accAbs) acc += accAbs;
  return acc;
};

const pickScopeCmc = (row, suffix = '') => toNum(pick(row, `cmc_scope${suffix}`, `cmcscope${suffix}`, `tempcmc${suffix}`));

/** Standard (non-NIBP) budget. */
const computeStandard = (row, { section, showElectricalSafety }) => {
  const isMeasure = String(row.mode || 'Measure').toLowerCase() !== 'source';
  const readings = getReadings(row, isMeasure);
  const numeric = readings.map(toNum).filter((v) => !isNaN(v));

  const average = isMeasure
    ? pick(row, 'average_uuc', 'averageuuc', 'average')
    : pick(row, 'average_master', 'averagemaster', 'average');
  const testpoint = toNum(pick(row, 'testpoint', 'test_point')) ?? NaN;
  const tp = isNaN(testpoint) ? num0(row.point) : testpoint;

  const repApi = toNum(pick(row, 'repeatability', 'std_deviation'));
  const repeatability = !isNaN(repApi) ? repApi : stdDevSample(numeric);
  const rep = isNaN(repeatability) ? 0 : repeatability;

  const typeaApi = toNum(pick(row, 'typea', 'type_a'));
  const typea = !isNaN(typeaApi) ? typeaApi : rep / Math.sqrt(5);

  const accApi = toNum(pick(row, 'masteraccuracy', 'master_accuracy', 'accuracy_of_calibrator'));
  const masteraccuracy = !isNaN(accApi) ? accApi : masterAccuracy(row, tp);

  const masterunc = num0(pick(row, 'masterunc', 'master_uncertainty', 'uncertainty_of_master'));
  const masterunc1 = (masterunc * num0(average)) / 100;

  // Least count that enters the budget, and the one the PHP prints
  const uucLc = pick(row, 'leastcount', 'least_count');
  const masterLc = pick(row, 'masterleastcount', 'master_least_count');
  let lc;
  if (section === 'performance') lc = isMeasure ? uucLc : masterLc;
  else if (!isMeasure && showElectricalSafety) lc = isNA(uucLc) ? masterLc : uucLc;
  else lc = uucLc;
  const lcTerm = isNA(lc) ? 0 : (num0(lc) / 2 / Math.sqrt(3)) ** 2;

  let comuncer = toNum(pick(row, 'comuncer', 'combined_uncertainty'));
  if (isNaN(comuncer)) {
    comuncer = Math.sqrt(typea ** 2 + (masteraccuracy / Math.sqrt(3)) ** 2 + (masterunc1 / 2) ** 2 + lcTerm);
  }

  let dof = pick(row, 'dof', 'degree_of_freedom');
  if (dof === undefined) dof = rep ? (comuncer ** 4 / typea ** 4) * 4 : '-';

  const kApi = toNum(pick(row, 'coveragefactor', 'coverage_factor', 'kfactor'));
  const coveragefactor = !isNaN(kApi) ? kApi : getLsCoverageFactor(toNum(dof));

  const euApi = toNum(pick(row, 'expandeduncertainty', 'expanded_uncertainty'));
  const expandeduncertainty = !isNaN(euApi) ? euApi : comuncer * coveragefactor;

  const pctApi = toNum(pick(row, 'expandeduncertaintypercent', 'expanded_uncertainty_percent'));
  const expandeduncertaintypercent = !isNaN(pctApi)
    ? pctApi
    : (tp === 0 ? 0 : (expandeduncertainty / tp) * 100);

  const scope = pickScopeCmc(row);
  let cmcuncertainty = toNum(pick(row, 'cmcuncertainty', 'cmc_taken'));
  if (isNaN(cmcuncertainty)) {
    cmcuncertainty = String(pick(row, 'unit_id', 'unitid') ?? '') === '12' ? expandeduncertainty : expandeduncertaintypercent;
    if (!isNaN(scope)) {
      cmcuncertainty = scope > cmcuncertainty ? scope : cmcuncertainty;
      const scopeParam = String(pick(row, 'cmc_scope_parameter', 'scope_parameter') ?? '');
      if (section === 'performance' && !isMeasure && scopeParam === 'Respiration Rate') {
        cmcuncertainty = scope <= cmcuncertainty ? scope : cmcuncertainty;
      }
    }
  }

  return {
    isMeasure,
    readings,
    average,
    repeatability: [repeatability],
    typea: [typea],
    masteraccuracy: [masteraccuracy],
    masterunc: pick(row, 'masterunc', 'master_uncertainty', 'uncertainty_of_master'),
    leastcount: lc,
    comuncer: [comuncer],
    dof: [dof],
    coveragefactor,
    expandeduncertainty: [expandeduncertainty],
    expandeduncertaintypercent: [expandeduncertaintypercent],
    cmcuncertainty: [cmcuncertainty],
    cmcscope: isNaN(scope) ? [] : [scope],
  };
};

const splitPair = (value) => String(value ?? '').split('/').map((p) => toNum(p));

/** NIBP Measure budget, worked separately for the systolic and diastolic parts. */
const computeNibp = (row) => {
  const readings = getReadings(row, true);
  const calibpoint = splitPair(pick(row, 'testpoint', 'test_point', 'point'));
  const parts = [0, 1].map((k) => readings.map((r) => splitPair(r)[k]));
  // PHP: array_sum / count over all five readings
  const averages = parts.map((p) => p.reduce((s, v) => s + (isNaN(v) ? 0 : v), 0) / READINGS);
  const devs = parts.map((p) => stdDevSample(p.filter((v) => !isNaN(v))));
  const typea = devs.map((d) => (isNaN(d) ? 0 : d) / Math.sqrt(5));

  const muParts = [
    toNum(pick(row, 'masterunc_upper', 'master_uncertainty_upper')),
    toNum(pick(row, 'masterunc_lower', 'master_uncertainty_lower')),
  ];
  const muAll = splitPair(pick(row, 'masterunc', 'master_uncertainty'));
  const masterunc = [0, 1].map((k) => (!isNaN(muParts[k]) ? muParts[k] : num0(muAll[k] ?? muAll[0])));

  // PHP: the measurement term replaces the range term; the absolute term is dropped
  const range = num0(pick(row, 'instrangemax')) - num0(pick(row, 'instrangemin'));
  const accRange = num0(pick(row, 'accuracyrange', 'accuracy_range'));
  const accMeas = num0(pick(row, 'accuracymeasrement', 'accuracymeasurement', 'accuracy_measurement'));
  const accuracy = [0, 1].map((k) => {
    if (accMeas) return (num0(calibpoint[k]) * accMeas) / 100;
    return accRange ? (range * accRange) / 100 : 0;
  });

  const comuncer = [0, 1].map((k) => Math.sqrt(
    typea[k] ** 2 + (accuracy[k] / Math.sqrt(3)) ** 2 + ((masterunc[k] * averages[k]) / 100 / 2) ** 2
  ));
  const dof = [0, 1].map((k) => (devs[k] ? (comuncer[k] ** 4 / devs[k] ** 4) * 4 : '-'));
  // PHP picks one k from the "upper/lower" dof string, i.e. from the upper part
  const coveragefactor = getLsCoverageFactor(toNum(dof[0]));
  const expanded = comuncer.map((c) => c * coveragefactor);
  const percent = expanded.map((e, k) => (num0(calibpoint[k]) ? (e / calibpoint[k]) * 100 : 0));

  const scopes = [pickScopeCmc(row, '_upper'), pickScopeCmc(row, '_lower')];
  const cmc = percent.map((p, k) => (!isNaN(scopes[k]) && scopes[k] > p ? scopes[k] : p));

  return {
    isMeasure: true,
    readings,
    average: pick(row, 'average_uuc', 'averageuuc', 'average'),
    repeatability: devs,
    typea,
    masteraccuracy: accuracy,
    masterunc: masterunc.join('/'),
    // Both sections print the UUC least count on Measure rows
    leastcount: pick(row, 'leastcount', 'least_count'),
    comuncer,
    dof,
    coveragefactor,
    expandeduncertainty: expanded,
    expandeduncertaintypercent: percent,
    cmcuncertainty: cmc,
    cmcscope: scopes.filter((s) => !isNaN(s)),
  };
};

export const computeLsCmcRow = (row, options) => {
  const parameter = String(pick(row, 'parameter', 'unittype', 'unit_type') ?? '').toLowerCase();
  const isMeasure = String(row.mode || 'Measure').toLowerCase() !== 'source';
  return isMeasure && parameter === 'nibp' ? computeNibp(row, options) : computeStandard(row, options);
};

/** Accepts either { electricSafety, performanceTest, rows, flags } or a flat row list. */
export const normalizeLsData = (data) => {
  const obj = data && !Array.isArray(data) ? data : {};
  const rows = Array.isArray(data) ? data : (Array.isArray(obj.rows) ? obj.rows : []);
  const notWaveform = (r) => !String(pick(r, 'unittype', 'unit_type') ?? '').toLowerCase().includes('waveform');
  return {
    electricSafety: (Array.isArray(obj.electricSafety) ? obj.electricSafety : rows.filter(isElectricSafetyRow)).filter(notWaveform),
    performanceTest: (Array.isArray(obj.performanceTest) ? obj.performanceTest : rows.filter((r) => !isElectricSafetyRow(r))).filter(notWaveform),
    showElectricalSafety: String(obj.showElectricalSafety ?? '').trim().toLowerCase() === 'yes',
    // PHP draws the Electric Safety table only when showperformancetest is Yes; a missing flag counts as Yes
    showPerformanceTest: String(obj.showPerformanceTest ?? 'Yes').trim().toLowerCase() !== 'no',
  };
};

const plain = (value, decimals) => {
  const n = toNum(value);
  if (isNaN(n) || !isFinite(n)) return isBlank(value) ? '-' : String(value);
  return decimals === undefined ? String(Number(n.toFixed(10))) : n.toFixed(decimals);
};
const joinParts = (parts, decimals) => (parts.length ? parts.map((p) => (p === '-' ? '-' : plain(p, decimals))).join(' / ') : '-');

const TH = 'border border-gray-300 px-2 py-2';
const TD = 'border border-gray-300 px-2 py-1';

const Section = ({ title, rows, section, showElectricalSafety }) => {
  const compact = section === 'electric' && showElectricalSafety;
  const typeACols = compact ? 11 : 13;
  const lcLabel = section === 'performance'
    ? 'Least Count of master'
    : (showElectricalSafety ? 'Least Count of Master' : 'Least Count of UUC');

  return (
    <div className="mb-6">
      <h3 className="text-base font-semibold text-gray-800 mb-2">{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[12px] text-gray-700 min-w-max">
          <thead>
            <tr className="bg-gray-100 font-semibold">
              <th colSpan={typeACols} className={`${TH} bg-gray-200 text-center`}>Type A Factor</th>
              <th colSpan="3" className={`${TH} bg-gray-200 text-center`}>Type B Factor</th>
              <th colSpan="7" className={`${TH} bg-gray-200 text-center`}>Uncertainty Measurement</th>
            </tr>
            <tr className="bg-gray-200 text-center font-medium text-[11px]">
              <th className={TH}>Sr no</th>
              <th className={TH}>Unit Type</th>
              {!compact && <th className={TH}>Mode</th>}
              {Array.from({ length: READINGS }, (_, i) => <th key={i} className={TH}>{i + 1}</th>)}
              <th className={TH}>Unit</th>
              {!compact && <th className={TH}>Calibration point</th>}
              <th className={TH}>Average</th>
              <th className={TH}>Std Deviation</th>
              <th className={TH}>Type A</th>
              <th className={TH}>{section === 'performance' ? 'Accuracy Of master in Value' : 'Accuracy Of Calibrator in Value'}</th>
              <th className={TH}>Uncertainty of master in %</th>
              <th className={TH}>{lcLabel}</th>
              <th className={TH}>Combined Uncertainty</th>
              <th className={TH}>Degree of Freedom</th>
              <th className={TH}>Coverage Factor (k)</th>
              <th className={TH}>Expanded Uncertainty in Value</th>
              <th className={TH}>Expanded Uncertainty in %</th>
              <th className={TH}>CMC Taken</th>
              <th className={TH}>CMC Scope</th>
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? rows.map((row, index) => {
              const r = computeLsCmcRow(row, { section, showElectricalSafety });
              return (
                <tr key={index} className="text-center hover:bg-gray-50 transition-colors">
                  <td className={TD}>{index + 1}</td>
                  <td className={TD}>{plain(pick(row, 'unittype', 'unit_type'))}</td>
                  {!compact && <td className={TD}>{plain(row.mode)}</td>}
                  {r.readings.map((v, i) => <td key={i} className={TD}>{plain(v)}</td>)}
                  <td className={TD}>{plain(pick(row, 'unit', 'unit_description', 'unit_desc'))}</td>
                  {!compact && <td className={TD}>{plain(pick(row, 'point', 'calibration_point'))}</td>}
                  <td className={TD}>{plain(r.average)}</td>
                  <td className={TD}>{joinParts(r.repeatability, 6)}</td>
                  <td className={TD}>{joinParts(r.typea, 6)}</td>
                  <td className={TD}>{joinParts(r.masteraccuracy, 6)}</td>
                  <td className={TD}>{plain(r.masterunc)}</td>
                  <td className={TD}>{plain(r.leastcount)}</td>
                  <td className={TD}>{joinParts(r.comuncer, 8)}</td>
                  <td className={TD}>{joinParts(r.dof, 2)}</td>
                  <td className={TD}>{r.coveragefactor}</td>
                  <td className={TD}>{joinParts(r.expandeduncertainty, 6)}</td>
                  <td className={TD}>{joinParts(r.expandeduncertaintypercent, 4)}</td>
                  <td className={TD}>{joinParts(r.cmcuncertainty, 4)}</td>
                  <td className={TD}>{joinParts(r.cmcscope, 4)}</td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan={typeACols + 10} className="border border-gray-300 px-4 py-4 text-center text-gray-500">
                  No observation data available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const LsCmcTable = ({ data }) => {
  const { electricSafety, performanceTest, showElectricalSafety, showPerformanceTest } = normalizeLsData(data);

  return (
    <div>
      {showPerformanceTest && electricSafety.length > 0 && (
        <Section title="Electric Safety" rows={electricSafety} section="electric" showElectricalSafety={showElectricalSafety} />
      )}
      <Section title="Performance Test" rows={performanceTest} section="performance" showElectricalSafety={showElectricalSafety} />
    </div>
  );
};

export default LsCmcTable;
