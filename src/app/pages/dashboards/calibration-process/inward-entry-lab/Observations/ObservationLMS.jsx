import { safeGetValue, validateLeastCount } from './observationUtils';

/**
 * LMS observation. Port of observationlms.php.
 *
 * Measure table - one row per Measure point:
 *   Sr. No. | Unit type | Range (entered) | Nominal/Set Value on master (calculatedmaster, converted)
 *   | Nominal/Set Value on master (master) | Observation on UUC 1-5 (uuc, entered) | Average | Error
 *   averageuuc = avg(uuc 0-4)                     to UUC least-count decimals
 *   error      = averageuuc - master              (master - averageuuc when error mode is 'stduuc')
 *
 * Source table - one row per Source point:
 *   Sr. No. | Unit type | Range (entered) | Nominal/Set Value on UUC (uuc)
 *   | Observation on Master 1-5 (master, entered) | Average | Error
 *   averagemaster = avg(master 0-4)               to master least-count decimals
 *   error         = uuc - averagemaster           (averagemaster - uuc when 'stduuc')
 *
 * Errors round to errorlc = the larger of the UUC and master least-count decimals; any 'NA'
 * least count leaves the value unrounded. Readings are validated against their least count
 * (UUC readings: matrix least count, master readings: master least count).
 */

export const LMS_READINGS = 5;

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

// PHP sprintf("%.0Nf"), skipped for an 'NA' precision
const formatNominal = (value, decimals) => {
  const num = toNum(value);
  if (isNaN(num) || decimals === 'NA') return safeGetValue(value);
  return num.toFixed(decimals);
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

export const lmsKey = (pointId, field) => `lms-${pointId}-${field}`;

/** Everything about a point that doesn't depend on what the operator types. */
export const getLMSPointInfo = (point, index = 0) => {
  const pointId = (point.point_id ?? point.calibration_point_id ?? point.id ?? `lms-${index}`).toString();
  const isMeasure = String(point.mode || 'Measure').toLowerCase() !== 'source';
  const nominals = point.nominal_values || {};

  // Converted least counts (when the units differ) take precedence, as in the PHP
  const uucLc = pick(point, 'converted_least_count', 'least_count', 'leastcount', 'uuc_least_count')
    || pick(point?.precision, 'uuc_least_count', 'least_count');
  const masterLc = pick(point, 'converted_master_least_count', 'master_least_count', 'masterleastcount')
    || pick(point?.precision, 'master_least_count');
  // Validation uses the matrix least counts as stored
  const uucLcRaw = pick(point, 'least_count', 'leastcount', 'uuc_least_count')
    || pick(point?.precision, 'uuc_least_count', 'least_count');
  const masterLcRaw = pick(point, 'master_least_count', 'masterleastcount')
    || pick(point?.precision, 'master_least_count');

  const lc = lcDecimals(uucLc);
  const mlc = lcDecimals(masterLc);
  const errorDecimals = lc === 'NA' || mlc === 'NA' ? 'NA' : Math.max(lc, mlc);

  const rawPoint = pick(point, 'point', 'set_point', 'test_point');
  const testpoint = pick(point, 'testpoint', 'test_point_converted') || rawPoint;

  let calculatedMaster = '';
  let master = '';
  let uuc = '';
  if (isMeasure) {
    const mainMlc = lcDecimals(masterLcRaw);
    calculatedMaster = pick(point, 'calculated_master', 'calculatedmaster')
      || pick(nominals.calculated_master, 'value')
      || formatNominal(testpoint, mainMlc);
    master = pick(point, 'master', 'master_value') || pick(nominals.master, 'value') || formatNominal(rawPoint, mlc);
  } else {
    uuc = pick(point, 'uuc', 'uuc_value') || pick(nominals.uuc, 'value') || formatNominal(testpoint, lc);
  }

  const readingList = isMeasure
    ? (point.uuc_readings ?? point.observations)
    : (point.master_readings ?? point.observations);

  return {
    pointId,
    isMeasure,
    srNo: pick(point, 'sr_no', 'sequence_number'),
    unitType: pick(point, 'unittype', 'unit_type'),
    calculatedMaster,
    master,
    uuc,
    averageDecimals: isMeasure ? lc : mlc,
    errorDecimals,
    readingLc: isMeasure
      ? (isNA(uucLcRaw) ? null : String(uucLcRaw).trim())
      : (isNA(masterLcRaw) ? null : String(masterLcRaw).trim()),
    units: {
      master: pick(point, 'master_unit_description', 'master_unit_name'),
      uuc: pick(point, 'unit_description', 'uuc_unit_description', 'unit_name'),
      test: pick(point, 'test_unit_description') || pick(point, 'unit_description', 'unit_name'),
    },
    stored: {
      range: pick(point, 'range'),
      readings: Array.from({ length: LMS_READINGS }, (_, i) => readingAt(readingList, i)),
    },
  };
};

export const splitLMSPoints = (points) => {
  const list = (Array.isArray(points) ? points : []).filter(Boolean).map((p, i) => getLMSPointInfo(p, i));
  const number = (items) => items.map((info, i) => ({ ...info, srNo: info.srNo || String(i + 1) }));
  return {
    measure: number(list.filter((p) => p.isMeasure)),
    source: number(list.filter((p) => !p.isMeasure)),
  };
};

/** averageavg + substractminus for a point. */
export const getLMSValues = (info, tableInputValues = {}, errorMode) => {
  const readingField = info.isMeasure ? 'uuc' : 'master';
  const readings = info.stored.readings.map((v, i) => tableInputValues[lmsKey(info.pointId, `${readingField}${i}`)] ?? v);
  const range = tableInputValues[lmsKey(info.pointId, 'range')] ?? info.stored.range;

  const nums = readings.map(toNum).filter((v) => !isNaN(v));
  const average = nums.length ? formatTo(nums.reduce((s, v) => s + v, 0) / nums.length, info.averageDecimals) : '';

  const avg = toNum(average);
  const fixed = toNum(info.isMeasure ? info.master : info.uuc);
  let error = '';
  if (!isNaN(avg) && !isNaN(fixed)) {
    // Measure: uuc = average, master = fixed. Source: uuc = fixed, master = average
    const uucVal = info.isMeasure ? avg : fixed;
    const masterVal = info.isMeasure ? fixed : avg;
    error = formatTo(errorMode === 'stduuc' ? masterVal - uucVal : uucVal - masterVal, info.errorDecimals);
  }

  return { readingField, averageField: info.isMeasure ? 'averageuuc' : 'averagemaster', range, readings, average, error };
};

export const getLMSReadingError = (info, value) => {
  if (!info.readingLc || isBlank(value)) return null;
  const { isValid, error } = validateLeastCount(String(value).trim(), info.readingLc);
  return isValid ? null : error;
};

/** Summary-table rows the PHP form posts for a point. */
export const getLMSEntries = (info, values) => {
  const entries = [{ type: 'range', repeatable: '0', value: values.range }];
  if (info.isMeasure) {
    entries.push({ type: 'calculatedmaster', repeatable: '0', value: info.calculatedMaster });
    entries.push({ type: 'master', repeatable: '0', value: info.master });
  } else {
    entries.push({ type: 'uuc', repeatable: '0', value: info.uuc });
  }
  values.readings.forEach((v, i) => entries.push({ type: values.readingField, repeatable: String(i), value: v }));
  entries.push({ type: values.averageField, repeatable: '0', value: values.average });
  entries.push({ type: 'error', repeatable: '0', value: values.error });
  return entries.filter((e) => !isBlank(e.value)).map((e) => ({ ...e, value: String(e.value) }));
};

/** PHP: range required; readings required,number,inleastcount,divisibleby. */
export const validateLMSPoints = (points, tableInputValues, { errorMode } = {}) => {
  const errors = {};
  const { measure, source } = splitLMSPoints(points);
  [...measure, ...source].forEach((info) => {
    const values = getLMSValues(info, tableInputValues, errorMode);
    if (isBlank(values.range)) errors[lmsKey(info.pointId, 'range')] = 'This field is required';
    values.readings.forEach((v, i) => {
      const key = lmsKey(info.pointId, `${values.readingField}${i}`);
      if (isBlank(v)) errors[key] = 'This field is required';
      else if (isNaN(toNum(v))) errors[key] = 'Please enter a valid number';
      else {
        const lcError = getLMSReadingError(info, v);
        if (lcError) errors[key] = lcError;
      }
    });
  });
  return errors;
};

/** Readable name for an `lms-{pointId}-{field}` error key, for the submit toast. */
export const describeLMSErrorKey = (key, points) => {
  const { measure, source } = splitLMSPoints(points);
  const info = [...measure, ...source].find((p) => String(key).startsWith(`lms-${p.pointId}-`));
  if (!info) return String(key);
  const field = String(key).slice(`lms-${info.pointId}-`.length);
  const reading = field.match(/^(uuc|master)(\d)$/);
  const label = reading
    ? `Observation on ${reading[1] === 'uuc' ? 'UUC' : 'Master'} ${Number(reading[2]) + 1}`
    : 'Range';
  return `${info.isMeasure ? 'Measure' : 'Source'} Row ${info.srNo}${info.unitType ? ` (${info.unitType})` : ''}: ${label}`;
};

export const getLMSTableConfig = (observations) => {
  const { measure, source } = splitLMSPoints(observations);
  const all = [...measure, ...source];
  return {
    id: 'observationlms',
    name: 'Observation LMS',
    category: 'LMS',
    structure: { singleHeaders: [], subHeaders: {}, remainingHeaders: [] },
    // One row per point so the shared hidden-input lookups still resolve a point id
    staticRows: all.map((p) => [p.srNo, p.unitType]),
    hiddenInputs: {
      calibrationPoints: all.map((p) => p.pointId),
      types: all.map((p) => (p.isMeasure ? 'uuc' : 'master')),
      repeatables: all.map(() => '0'),
      values: all.map((p) => (p.isMeasure ? p.master : p.uuc) || '0'),
    },
    calibration_points: Array.isArray(observations) ? observations : [],
  };
};

const READONLY_INPUT =
  'w-full min-w-[80px] px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white cursor-not-allowed text-right font-mono';
const EDITABLE_INPUT =
  'w-full min-w-[80px] px-2 py-1 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono';
const TD = 'px-2 py-1 text-sm border border-gray-200 dark:border-gray-600 align-top';
const TH = 'px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 uppercase border border-gray-300 dark:border-gray-600 text-center';
const NUMERIC = /^-?\d*\.?\d*$/;

const Unit = ({ children }) => (children
  ? <span className="text-xs text-gray-600 dark:text-gray-300 whitespace-nowrap">{children}</span>
  : null);

const ObservationLMS = ({
  selectedTableData,
  tableInputValues = {},
  setTableInputValues,
  handleObservationBlur,
  observations,
  instrument,
  observationErrors = {},
}) => {
  if (selectedTableData?.id !== 'observationlms') return null;

  const rawPoints = Array.isArray(selectedTableData?.calibration_points) && selectedTableData.calibration_points.length > 0
    ? selectedTableData.calibration_points
    : (Array.isArray(observations) ? observations : []);
  const { measure, source } = splitLMSPoints(rawPoints);
  const errorMode = instrument?.error ?? selectedTableData?.error_mode;

  if (measure.length === 0 && source.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
        No calibration points available for LMS.
      </div>
    );
  }

  const save = (info, index, field, value) => {
    if (!handleObservationBlur) return;
    const values = getLMSValues(info, { ...tableInputValues, [lmsKey(info.pointId, field)]: value }, errorMode);
    handleObservationBlur(index, 0, value, info.pointId, { entries: getLMSEntries(info, values) });
  };

  const input = (info, index, field, value, { numeric = true, lcError } = {}) => {
    const key = lmsKey(info.pointId, field);
    const error = lcError || observationErrors[key];
    return (
      <>
        <input
          type="text"
          data-cell-key={key}
          className={`${EDITABLE_INPUT} ${numeric ? 'text-right' : ''} ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
          value={value ?? ''}
          onChange={(e) => {
            const val = e.target.value;
            if (numeric && val !== '' && !NUMERIC.test(val)) return;
            setTableInputValues?.((prev) => ({ ...prev, [key]: val }));
          }}
          onBlur={(e) => save(info, index, field, e.target.value)}
        />
        {error && <div className="text-xs text-red-600 mt-1">{error}</div>}
      </>
    );
  };

  const readonly = (value, unit) => (
    <div className="flex items-center gap-1">
      <input type="text" readOnly className={READONLY_INPUT} value={value ?? ''} />
      <Unit>{unit}</Unit>
    </div>
  );

  const renderRow = (info, index) => {
    const values = getLMSValues(info, tableInputValues, errorMode);
    const readingUnit = info.isMeasure ? info.units.uuc : info.units.master;
    return (
      <tr key={info.pointId} className="hover:bg-gray-50 dark:hover:bg-gray-700">
        <td className={`${TD} text-center dark:text-white`}>{info.srNo}</td>
        <td className={`${TD} dark:text-white`}>{info.unitType}</td>
        <td className={TD}>{input(info, index, 'range', values.range, { numeric: false })}</td>
        {info.isMeasure ? (
          <>
            <td className={TD}>{readonly(info.calculatedMaster, info.units.master)}</td>
            <td className={TD}>{readonly(info.master, info.units.uuc)}</td>
          </>
        ) : (
          <td className={TD}>{readonly(info.uuc, info.units.test)}</td>
        )}
        {values.readings.map((v, i) => (
          <td key={i} className={TD}>
            <div className="flex items-start gap-1">
              <div className="flex-1">
                {input(info, index, `${values.readingField}${i}`, v, { lcError: getLMSReadingError(info, v) })}
              </div>
              <Unit>{readingUnit}</Unit>
            </div>
          </td>
        ))}
        <td className={TD}>{readonly(values.average)}</td>
        <td className={TD}>{readonly(values.error)}</td>
      </tr>
    );
  };

  const observationHeaders = Array.from({ length: LMS_READINGS }, (_, i) => (
    <th key={i} className={TH}>Observation {i + 1}</th>
  ));

  return (
    <div className="mb-8 space-y-6">
      {measure.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-medium text-gray-800 dark:text-white">Measure</h3>
          <div className="overflow-x-auto border border-gray-200 dark:border-gray-600 rounded">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th rowSpan={2} className={TH}>Sr. No.</th>
                  <th rowSpan={2} className={TH}>Unit type</th>
                  <th rowSpan={2} className={TH}>Range</th>
                  <th rowSpan={2} className={TH}>Nominal/ Set Value on master</th>
                  <th rowSpan={2} className={TH}>Nominal/ Set Value on master</th>
                  <th colSpan={LMS_READINGS} className={TH}>Observation on UUC</th>
                  <th rowSpan={2} className={TH}>Average</th>
                  <th rowSpan={2} className={TH}>Error</th>
                </tr>
                <tr>{observationHeaders}</tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800">
                {measure.map((info, i) => renderRow(info, i))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {source.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-medium text-gray-800 dark:text-white">Source</h3>
          <div className="overflow-x-auto border border-gray-200 dark:border-gray-600 rounded">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th rowSpan={2} className={TH}>Sr. No.</th>
                  <th rowSpan={2} className={TH}>Unit type</th>
                  <th rowSpan={2} className={TH}>Range</th>
                  <th rowSpan={2} className={TH}>Nominal/ Set Value on UUC</th>
                  <th colSpan={LMS_READINGS} className={TH}>Observation on Master</th>
                  <th rowSpan={2} className={TH}>Average</th>
                  <th rowSpan={2} className={TH}>Error</th>
                </tr>
                <tr>{observationHeaders}</tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800">
                {source.map((info, i) => renderRow(info, measure.length + i))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ObservationLMS;
