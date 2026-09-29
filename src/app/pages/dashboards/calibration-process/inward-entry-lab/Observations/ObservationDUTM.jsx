import { safeGetValue, validateLeastCount } from './observationUtils';

/**
 * DUTM observation. Port of observationdutm.php.
 *
 * One row per calibration point:
 *   Sr no | Nominal Value (uuc) | Reading On Master Set I, Set II (master 0/1) | Error Set I, Set II (error 0/1)
 *
 *   error n = uuc - master n                     to errorlc decimals
 *           = master n - uuc  when error mode is 'stduuc', unrounded ('NA')
 *
 * errorlc is the larger of the UUC and master least-count decimals (the UUC one is replaced by the
 * master one when the master unit differs from the UUC unit); either being 'NA' leaves it unrounded.
 * Master readings are validated against the master least count (inleastcount / divisibleby).
 */

export const DUTM_SETS = 2;

const isBlank = (val) => val === undefined || val === null || String(val).trim() === '';
const isNA = (val) => isBlank(val) || String(val).trim().toUpperCase() === 'NA';
const toNum = (val) => (isBlank(val) ? NaN : Number(String(val).trim()));

// Unrounded like PHP's 'NA' precision, with float noise stripped
const formatUnrounded = (num) => (Number.isFinite(num) ? String(Number(num.toFixed(10))) : '');

const formatTo = (num, decimals) => {
  if (!Number.isFinite(num)) return '';
  const out = decimals === 'NA' ? formatUnrounded(num) : num.toFixed(decimals);
  return out.replace(/^-(0\.?0*)$/, '$1');
};

const lcDecimals = (leastCount) => {
  if (isNA(leastCount)) return 'NA';
  const s = String(leastCount).trim();
  return s.includes('.') ? s.split('.')[1].length : 0;
};

const pick = (obj, ...keys) => {
  for (const key of keys) {
    const val = safeGetValue(obj?.[key]);
    if (val !== '') return val;
  }
  return '';
};

const readingAt = (list, i) => {
  const item = Array.isArray(list) ? list[i] : undefined;
  return safeGetValue(item && typeof item === 'object' ? item.value : item);
};

export const dutmKey = (pointId, field) => `dutm-${pointId}-${field}`;

/** Everything about a point that doesn't depend on what the operator types. */
export const getDUTMPointInfo = (point, index = 0) => {
  const pointId = (point.calibration_point_id ?? point.point_id ?? point.id ?? `dutm-${index}`).toString();

  const uucLc = pick(point, 'least_count', 'leastcount', 'uuc_least_count')
    || pick(point?.precision, 'uuc_least_count', 'least_count');
  const masterLc = pick(point, 'master_least_count', 'masterleastcount')
    || pick(point?.precision, 'master_least_count');

  const uucUnit = pick(point, 'unit', 'uuc_unit', 'unit_id');
  const masterUnit = pick(point, 'masterunit', 'master_unit', 'master_unit_id');
  const hasConversion = !isBlank(masterUnit) && !isBlank(uucUnit) && masterUnit !== uucUnit;

  const mlc = lcDecimals(masterLc);
  const lc = hasConversion ? mlc : lcDecimals(uucLc);
  const errorDecimals = mlc === 'NA' || lc === 'NA' ? 'NA' : Math.max(mlc, lc);

  const masterList = point.master_readings ?? point.masters ?? point.observations;
  const errorList = point.error_readings ?? point.errors;

  return {
    pointId,
    srNo: pick(point, 'sr_no', 'sequence_number') || String(index + 1),
    // PHP shows the calibration point itself, not the converted test point
    nominal: pick(point, 'point', 'nominal_value', 'uuc_value', 'uuc'),
    masterLc: isNA(masterLc) ? null : String(masterLc).trim(),
    errorDecimals,
    unitLabel: pick(point, 'unit_description', 'uuc_unit_description', 'unit_name', 'unit_label'),
    stored: {
      masters: Array.from({ length: DUTM_SETS }, (_, i) =>
        readingAt(masterList, i) || pick(point, `master${i}`, `master_${i}`, `set${i + 1}`)),
      errors: Array.from({ length: DUTM_SETS }, (_, i) =>
        readingAt(errorList, i) || pick(point, `error${i}`, `error_${i}`)),
    },
  };
};

export const getDUTMPoints = (points) =>
  (Array.isArray(points) ? points : []).filter(Boolean).map((p, i) => getDUTMPointInfo(p, i));

/** substractminus for each set. */
export const calculateDUTMValues = (info, masters, errorMode) =>
  masters.map((m) => {
    const master = toNum(m);
    const uuc = toNum(info.nominal);
    if (isNaN(master) || isNaN(uuc)) return '';
    return errorMode === 'stduuc'
      ? formatTo(master - uuc, 'NA')
      : formatTo(uuc - master, info.errorDecimals);
  });

export const getDUTMValues = (info, tableInputValues = {}, errorMode) => {
  const masters = info.stored.masters.map((v, i) => tableInputValues[dutmKey(info.pointId, `master${i}`)] ?? v);
  return { masters, errors: calculateDUTMValues(info, masters, errorMode) };
};

export const getDUTMReadingError = (info, value) => {
  if (!info.masterLc || isBlank(value)) return null;
  const { isValid, error } = validateLeastCount(String(value).trim(), info.masterLc);
  return isValid ? null : error;
};

/** Summary-table rows the PHP form posts for a point. */
export const getDUTMEntries = (info, values) => {
  const entries = [{ type: 'uuc', repeatable: '0', value: info.nominal }];
  values.masters.forEach((v, i) => entries.push({ type: 'master', repeatable: String(i), value: v }));
  values.errors.forEach((v, i) => entries.push({ type: 'error', repeatable: String(i), value: v }));
  return entries.filter((e) => !isBlank(e.value)).map((e) => ({ ...e, value: String(e.value) }));
};

/** PHP: nominal required,number; master readings required,number,inleastcount,divisibleby. */
export const validateDUTMPoints = (points, tableInputValues, { errorMode } = {}) => {
  const errors = {};
  getDUTMPoints(points).forEach((info) => {
    if (isBlank(info.nominal) || isNaN(toNum(info.nominal))) {
      errors[dutmKey(info.pointId, 'uuc')] = 'This field is required';
    }
    getDUTMValues(info, tableInputValues, errorMode).masters.forEach((v, i) => {
      const key = dutmKey(info.pointId, `master${i}`);
      if (isBlank(v)) errors[key] = 'This field is required';
      else if (isNaN(toNum(v))) errors[key] = 'Please enter a valid number';
      else {
        const lcError = getDUTMReadingError(info, v);
        if (lcError) errors[key] = lcError;
      }
    });
  });
  return errors;
};

/** Readable name for a `dutm-{pointId}-{field}` error key, for the submit toast. */
export const describeDUTMErrorKey = (key, points) => {
  const info = getDUTMPoints(points).find((p) => String(key).startsWith(`dutm-${p.pointId}-`));
  if (!info) return String(key);
  const field = String(key).slice(`dutm-${info.pointId}-`.length);
  const set = field.match(/^master(\d)$/);
  const label = set ? `Reading On Master Set ${set[1] === '0' ? 'I' : 'II'}` : 'Nominal Value';
  return `Row ${info.srNo}${info.nominal ? ` (${info.nominal})` : ''}: ${label}`;
};

export const getDUTMTableConfig = (observations) => {
  const points = getDUTMPoints(observations);
  return {
    id: 'observationdutm',
    name: 'Observation DUTM',
    category: 'Universal Testing Machine',
    structure: { singleHeaders: [], subHeaders: {}, remainingHeaders: [] },
    // One row per point so the shared hidden-input lookups still resolve a point id
    staticRows: points.map((p) => [p.srNo, p.nominal]),
    hiddenInputs: {
      calibrationPoints: points.map((p) => p.pointId),
      types: points.map(() => 'uuc'),
      repeatables: points.map(() => '0'),
      values: points.map((p) => p.nominal || '0'),
    },
    calibration_points: Array.isArray(observations) ? observations : [],
  };
};

const READONLY_INPUT =
  'w-full min-w-[90px] px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white cursor-not-allowed text-right font-mono';
const EDITABLE_INPUT =
  'w-full min-w-[90px] px-2 py-1 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-right font-mono';
const TD = 'px-2 py-1 text-sm border border-gray-200 dark:border-gray-600 align-top';
const TH = 'px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 uppercase border border-gray-300 dark:border-gray-600 text-center';
const SET_LABELS = ['Set I', 'Set II'];

const ObservationDUTM = ({
  selectedTableData,
  tableInputValues = {},
  setTableInputValues,
  handleObservationBlur,
  observations,
  instrument,
  observationErrors = {},
}) => {
  if (selectedTableData?.id !== 'observationdutm') return null;

  const rawPoints = Array.isArray(selectedTableData?.calibration_points) && selectedTableData.calibration_points.length > 0
    ? selectedTableData.calibration_points
    : (Array.isArray(observations) ? observations : []);
  const points = getDUTMPoints(rawPoints);
  const errorMode = instrument?.error ?? selectedTableData?.error_mode;

  if (points.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
        No calibration points available for DUTM.
      </div>
    );
  }

  // PHP labels every column with the first point's UUC unit
  const unit = points[0].unitLabel;
  const withUnit = (label) => (unit ? `${label} (${unit})` : label);

  const save = (info, index, setIndex, value) => {
    if (!handleObservationBlur) return;
    const values = getDUTMValues(
      info,
      { ...tableInputValues, [dutmKey(info.pointId, `master${setIndex}`)]: value },
      errorMode
    );
    handleObservationBlur(index, 2 + setIndex, value, info.pointId, { entries: getDUTMEntries(info, values) });
  };

  return (
    <div className="mb-8 space-y-2">
      <div className="overflow-x-auto border border-gray-200 dark:border-gray-600 rounded">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-gray-100 dark:bg-gray-700">
            <tr>
              <th rowSpan={2} className={TH}>Sr no</th>
              <th rowSpan={2} className={TH}>{withUnit('Nominal Value')}</th>
              <th colSpan={DUTM_SETS} className={TH}>{withUnit('Reading On Master')}</th>
              <th colSpan={DUTM_SETS} className={TH}>{withUnit('Error')}</th>
            </tr>
            <tr>
              {[...SET_LABELS, ...SET_LABELS].map((label, i) => (
                <th key={i} className={TH}>{label}</th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800">
            {points.map((info, index) => {
              const values = getDUTMValues(info, tableInputValues, errorMode);
              return (
                <tr key={info.pointId} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className={`${TD} text-center dark:text-white`}>{info.srNo}</td>
                  <td className={TD}>
                    <input type="text" readOnly className={READONLY_INPUT} value={info.nominal} data-cell-key={dutmKey(info.pointId, 'uuc')} />
                    {observationErrors[dutmKey(info.pointId, 'uuc')] && (
                      <div className="text-xs text-red-600 mt-1">{observationErrors[dutmKey(info.pointId, 'uuc')]}</div>
                    )}
                  </td>

                  {values.masters.map((v, i) => {
                    const key = dutmKey(info.pointId, `master${i}`);
                    const error = getDUTMReadingError(info, v) || observationErrors[key];
                    return (
                      <td key={`m${i}`} className={TD}>
                        <input
                          type="text"
                          data-cell-key={key}
                          className={`${EDITABLE_INPUT} ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                          value={v}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val !== '' && !/^-?\d*\.?\d*$/.test(val)) return;
                            setTableInputValues?.((prev) => ({ ...prev, [key]: val }));
                          }}
                          onBlur={(e) => save(info, index, i, e.target.value)}
                          placeholder={SET_LABELS[i]}
                        />
                        {error && <div className="text-xs text-red-600 mt-1">{error}</div>}
                      </td>
                    );
                  })}

                  {values.errors.map((v, i) => (
                    <td key={`e${i}`} className={TD}>
                      <input
                        type="text"
                        readOnly
                        className={READONLY_INPUT}
                        value={v}
                        title={info.errorDecimals === 'NA' ? 'Unrounded' : `${info.errorDecimals} decimal place(s)`}
                      />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ObservationDUTM;
