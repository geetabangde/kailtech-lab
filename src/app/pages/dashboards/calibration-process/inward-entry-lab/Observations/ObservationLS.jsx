import { Fragment } from 'react';
import { safeGetValue, validateLeastCount } from './observationUtils';

/**
 * LS observation. Port of observationls.php.
 *
 * Section 3 - unit types listed in the electricalsafety table:
 *   Measure table (drawn only when showperformancetest is Yes) and Source table. showelectricalsafety
 *   = Yes hides Set Point / fixed reading / Deviation (and on Source the Expanded Uncertainty and
 *   Remarks). Title "3. PERFORMANCE TESTING", or "3. ELECTRICAL SAFETY TEST" with showelectricalsafety.
 *
 * Section 4 "4. PERFORMANCE TESTING" - every other unit type, always every column:
 *   Measure: Parameter | Set Point | Reading on Master | Reading on UUC 1-5 | Average On UUC | Deviation | Tolerance
 *            (Expanded Uncertainty and Remarks are posted as hidden fields)
 *   Source:  Parameter (editable) | Setpoint | Reading on UUC (the raw point) | Reading on Master 1-5
 *            | Average On Master | Deviation   (no Tolerance; Expanded Uncertainty / Remarks hidden)
 *
 *   average   = avg(readings)                                  unrounded ('NA')
 *   deviation = uuc - master (master - uuc for 'stduuc')        unrounded ('NA')
 *   remark    = Pass/Fail of the deviation within the tolerance (checksafety)
 * NIBP readings ("systolic/diastolic") are averaged and subtracted per part; waveform parameters
 * have the average and deviation typed in (Measure still derives the deviation from the typed average).
 */

export const LS_READINGS = 5;

const isYes = (val) => String(val ?? '').trim().toLowerCase() === 'yes';
const isBlank = (val) => val === undefined || val === null || String(val).trim() === '';
const isNA = (val) => isBlank(val) || String(val).trim().toUpperCase() === 'NA';
const toNum = (val) => (isBlank(val) ? NaN : Number(String(val).trim()));
const truthy = (v) => v === true || v === 1 || v === '1' || String(v).toLowerCase() === 'yes';

// Unrounded like PHP's 'NA' precision, with float noise stripped
const formatUnrounded = (num) => (Number.isFinite(num) ? String(Number(num.toFixed(10))) : '');

// PHP sprintf("%.0Nf"), left as-is for an 'NA' least count
const formatToLc = (value, leastCount) => {
  const num = toNum(value);
  if (isNaN(num) || isNA(leastCount)) return safeGetValue(value);
  const s = String(leastCount).trim();
  return num.toFixed(s.includes('.') ? s.split('.')[1].length : 0);
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

const parts = (val) => String(val ?? '').split('/').map((p) => toNum(p));

/** averageavg / averageavgnibp */
const averageOf = (values, nibp) => {
  const filled = values.filter((v) => !isBlank(v));
  if (!filled.length) return '';
  if (!nibp) {
    const nums = filled.map(toNum).filter((v) => !isNaN(v));
    return nums.length ? formatUnrounded(nums.reduce((s, v) => s + v, 0) / nums.length) : '';
  }
  const split = filled.map(parts);
  const width = Math.max(...split.map((p) => p.length));
  const avgs = Array.from({ length: width }, (_, k) => {
    const nums = split.map((p) => p[k]).filter((v) => !isNaN(v));
    return nums.length ? formatUnrounded(nums.reduce((s, v) => s + v, 0) / nums.length) : '';
  });
  return avgs.every((a) => a === '') ? '' : avgs.join('/');
};

/** substractminus / substractminusnibp */
const subtract = (a, b, nibp) => {
  if (isBlank(a) || isBlank(b)) return '';
  if (!nibp) return formatUnrounded(toNum(a) - toNum(b));
  const pa = parts(a);
  const pb = parts(b);
  if (pa.length !== pb.length) return '';
  const out = pa.map((v, k) => formatUnrounded(v - pb[k]));
  return out.some((p) => p === '') ? '' : out.join('/');
};

/** PHP checksafety(): Pass when min <= value <= max */
const checkSafety = (value, min, max) => {
  if (String(value).trim() === 'N.A') return 'N.A';
  const v = parseFloat(value);
  if (isNaN(v)) return '';
  return v >= min && v <= max ? 'Pass' : 'Fail';
};

export const lsKey = (pointId, field) => `ls-${pointId}-${field}`;

/**
 * Everything about a point that doesn't depend on what the operator types.
 * `section` is 'es' (section 3) or 'perf' (section 4).
 */
export const getLSPointInfo = (point, index = 0, section = 'perf') => {
  const pointId = (point.calibration_point_id ?? point.point_id ?? point.id ?? `ls-${index}`).toString();
  const isMeasure = String(point.mode || 'Measure').toLowerCase() === 'measure';
  const parameter = pick(point, 'parameter', 'parameter_value') || pick(point, 'unittype', 'unit_type');
  const paramLower = parameter.toLowerCase();
  const waveform = paramLower.includes('waveform');
  const nibp = paramLower === 'nibp';

  const setpoint = pick(point, 'setpoint', 'set_point', 'point', 'test_point');
  const uucLc = pick(point, 'least_count', 'leastcount', 'uuc_least_count')
    || pick(point?.precision, 'uuc_least_count', 'least_count');
  const masterLc = pick(point, 'master_least_count', 'masterleastcount')
    || pick(point?.precision, 'master_least_count');

  // Fixed reading: Measure -> master to master LC (not for waveform/NIBP);
  // Source -> uuc to UUC LC in section 3, the raw point in section 4
  let fixedReading;
  if (isMeasure) fixedReading = waveform || nibp ? setpoint : formatToLc(setpoint, masterLc);
  else fixedReading = section === 'perf' ? setpoint : formatToLc(setpoint, uucLc);

  // Tolerance from the instrument matrix; only section 3 Source accepts a non-numeric one ("<5")
  const tolType = pick(point, 'tolerance_type', 'tolerancetype');
  const tolRaw = pick(point, 'tolerance_value', 'tolerance_raw') || (tolType ? pick(point, 'tolerance') : '');
  const tolNumeric = !isNaN(toNum(tolRaw));
  const allowText = section === 'es' && !isMeasure;
  const hasMatrixTol = !isBlank(tolRaw) && !isBlank(tolType) && (allowText || tolNumeric);

  let tolComment = pick(point, 'specification') || (tolType ? '' : pick(point, 'tolerance'));
  let tolRange = null;
  if (hasMatrixTol) {
    if (allowText && /[<>]/.test(tolRaw)) tolComment = tolRaw;
    else tolComment = tolType === '%' ? `${tolRaw}%` : `±${tolRaw}`;

    if (tolNumeric && tolType === '%') {
      const t = Math.abs((toNum(tolRaw) / 100) * toNum(setpoint));
      if (!isNaN(t)) tolRange = { min: -t, max: t };
    } else if (tolNumeric && tolType === 'Fixed') {
      const t = toNum(tolRaw);
      tolRange = { min: -t, max: t };
    }
  }
  const hasToleranceCheck = hasMatrixTol && (tolType === '%' || tolType === 'Fixed');

  return {
    pointId,
    isMeasure,
    unitType: pick(point, 'unittype', 'unit_type') || parameter,
    parameter,
    waveform,
    nibp,
    setpoint,
    fixedReading,
    uucLc: isNA(uucLc) ? null : uucLc,
    masterLc: isNA(masterLc) ? null : masterLc,
    uucUnit: pick(point, 'unit_description', 'uuc_unit_description', 'unit_name', 'uuc_unit'),
    masterUnit: pick(point, 'master_unit_description', 'master_unit_name', 'master_unit'),
    tolComment,
    tolRange,
    // Measure: readonly once there is a comment; Source: readonly when the matrix gives a check
    specReadonly: isMeasure ? !isBlank(tolComment) : hasToleranceCheck,
    remarkReadonly: hasToleranceCheck,
    stored: {
      readings: Array.from({ length: LS_READINGS }, (_, i) =>
        readingAt(isMeasure ? (point.uuc_readings ?? point.observations) : (point.master_readings ?? point.observations), i)),
      average: isMeasure
        ? pick(point, 'average_uuc', 'averageuuc')
        : pick(point, 'average_master', 'averagemaster'),
      error: pick(point, 'deviation_error', 'error', 'deviation') || pick(point?.calculations, 'error'),
      expandedUncertainty: pick(point, 'expanded_uncertainty', 'expandeduncertainty'),
      remark: pick(point, 'remark', 'remarks'),
    },
  };
};

/** Least-count rule for an entered reading (inleastcount / divisibleby), or null when none applies. */
export const getLSReadingError = (info, value) => {
  const lc = info.isMeasure ? (info.waveform || info.nibp ? null : info.uucLc) : info.masterLc;
  if (!lc || isBlank(value)) return null;
  const { isValid, error } = validateLeastCount(String(value).trim(), lc);
  return isValid ? null : error;
};

// Section keys the API may group points under; the key tells us the section when a point doesn't
const SECTION_KEYS = {
  electrical_safety_measure: 'es',
  electrical_safety_source: 'es',
  electric_safety_measure: 'es',
  electric_safety_source: 'es',
  electrical_safety: 'es',
  performance_testing_measure: 'perf',
  performance_testing_source: 'perf',
  performance_test: 'perf',
};

/** Flattens the LS response into points, tagging each with its section when the grouping says so. */
export const extractLSPoints = (observationData) => {
  const root = observationData?.data && !Array.isArray(observationData.data) ? observationData.data : observationData;
  if (Array.isArray(root)) return root;

  const grouped = Object.entries(SECTION_KEYS).flatMap(([key, section]) =>
    (Array.isArray(root?.[key]) ? root[key] : []).map((p) => ({ ls_section: section, ...p })));
  if (grouped.length > 0) return grouped;

  return [root?.calibration_points, root?.observations, root?.points, observationData?.data].find(Array.isArray) || [];
};

const isElectricalSafetyPoint = (point) => {
  if (point?.ls_section) return point.ls_section === 'es';
  if (point?.is_electrical_safety !== undefined) return truthy(point.is_electrical_safety);
  const section = String(point?.section ?? point?.biomedical_section ?? '').toLowerCase();
  return section.includes('electric') || section.includes('safety');
};

const groupByUnitType = (items) => {
  const order = [];
  const byType = {};
  items.forEach((item) => {
    const k = item.info.unitType;
    if (!byType[k]) { byType[k] = []; order.push(k); }
    byType[k].push(item);
  });
  return order.flatMap((k) => byType[k]);
};

/** Points split into the four PHP tables, in PHP order. */
export const splitLSPoints = (points) => {
  const list = (Array.isArray(points) ? points : []).filter(Boolean).map((p, i) => {
    const section = isElectricalSafetyPoint(p) ? 'es' : 'perf';
    return { point: p, section, info: getLSPointInfo(p, i, section) };
  });
  const pickTable = (section, measure) =>
    groupByUnitType(list.filter((x) => x.section === section && x.info.isMeasure === measure));
  return {
    esMeasure: pickTable('es', true),
    esSource: pickTable('es', false),
    perfMeasure: pickTable('perf', true),
    perfSource: pickTable('perf', false),
  };
};

/** Current values for a point: what has been typed, else what the API stored, with derived fields. */
export const getLSValues = (item, tableInputValues = {}, errorMode) => {
  const { info } = item;
  const local = (field, fallback) => tableInputValues[lsKey(info.pointId, field)] ?? fallback;
  const readingField = info.isMeasure ? 'uuc' : 'master';
  const averageField = info.isMeasure ? 'averageuuc' : 'averagemaster';

  const readings = info.stored.readings.map((v, i) => local(`${readingField}${i}`, v));
  const average = info.waveform ? local(averageField, info.stored.average) : averageOf(readings, info.nibp);

  // Measure: uuc = average, master = fixed. Source: uuc = fixed, master = average
  const uuc = info.isMeasure ? average : info.fixedReading;
  const master = info.isMeasure ? info.fixedReading : average;
  const computedError = errorMode === 'stduuc' ? subtract(master, uuc, info.nibp) : subtract(uuc, master, info.nibp);

  const error = !info.waveform
    ? computedError
    : local('error', info.isMeasure && computedError !== '' ? computedError : info.stored.error);

  const remark = info.tolRange && error !== '' && !info.nibp
    ? checkSafety(error, info.tolRange.min, info.tolRange.max)
    : local('remark', info.stored.remark);

  return {
    readingField,
    averageField,
    readings,
    average,
    error,
    parameter: local('parameter', info.parameter),
    specification: local('specification', info.tolComment),
    remark,
    expandedUncertainty: local('expandeduncertainty', info.stored.expandedUncertainty),
  };
};

const clean = (entries) => entries
  .filter((e) => !isBlank(e.value))
  .map((e) => ({ ...e, value: String(e.value) }));

/** Summary-table rows the PHP form posts for a point. */
export const getLSEntries = (item, values, showElectricalSafety) => {
  const { info } = item;
  const readingEntries = values.readings
    .map((v, i) => ({ type: values.readingField, repeatable: String(i), value: v }));

  if (item.section === 'es') {
    const showES = !!showElectricalSafety;
    const entries = [{ type: 'parameter', repeatable: '0', value: info.parameter }];
    if (!showES) {
      entries.push({ type: 'setpoint', repeatable: '0', value: info.setpoint });
      entries.push({ type: info.isMeasure ? 'master' : 'uuc', repeatable: '0', value: info.fixedReading });
    }
    entries.push(...readingEntries);
    entries.push({ type: values.averageField, repeatable: '0', value: values.average });
    if (!showES) entries.push({ type: 'error', repeatable: '0', value: values.error });
    entries.push({ type: 'specification', repeatable: '0', value: values.specification });
    // Measure posts remark hidden; Source only shows it outside electrical safety
    if (info.isMeasure || !showES) entries.push({ type: 'remark', repeatable: '0', value: values.remark });
    // Measure keeps expanded uncertainty as a hidden field; Source shows it outside electrical safety
    if (info.isMeasure || !showES) {
      entries.push({ type: 'expandeduncertainty', repeatable: '0', value: values.expandedUncertainty });
    }
    return clean(entries);
  }

  const entries = [
    { type: 'parameter', repeatable: '0', value: values.parameter },
    { type: 'setpoint', repeatable: '0', value: info.setpoint },
    { type: info.isMeasure ? 'master' : 'uuc', repeatable: '0', value: info.fixedReading },
    ...readingEntries,
    { type: values.averageField, repeatable: '0', value: values.average },
    { type: 'error', repeatable: '0', value: values.error },
  ];
  // Section 4 Source has its Tolerance input commented out, so only Measure posts a specification
  if (info.isMeasure) entries.push({ type: 'specification', repeatable: '0', value: values.specification });
  entries.push({ type: 'expandeduncertainty', repeatable: '0', value: values.expandedUncertainty });
  entries.push({ type: 'remark', repeatable: '0', value: values.remark });
  return clean(entries);
};

/** Required + least-count checks for every visible input. */
export const validateLSPoints = (points, tableInputValues, { errorMode, showElectricalSafety, showPerformanceTest = true } = {}) => {
  const errors = {};
  const { esMeasure, esSource, perfMeasure, perfSource } = splitLSPoints(points);
  const need = (key, value) => {
    if (isBlank(value)) errors[key] = 'This field is required';
  };

  const check = (item, visible) => {
    const { info } = item;
    const values = getLSValues(item, tableInputValues, errorMode);
    values.readings.forEach((v, i) => {
      const key = lsKey(info.pointId, `${values.readingField}${i}`);
      if (isBlank(v)) errors[key] = 'This field is required';
      else {
        const lcError = getLSReadingError(info, v);
        if (lcError) errors[key] = lcError;
      }
    });
    need(lsKey(info.pointId, values.averageField), values.average);
    if (visible.error) need(lsKey(info.pointId, 'error'), values.error);
    if (visible.specification) need(lsKey(info.pointId, 'specification'), values.specification);
    if (visible.expandedUncertainty) need(lsKey(info.pointId, 'expandeduncertainty'), values.expandedUncertainty);
    if (visible.remark) need(lsKey(info.pointId, 'remark'), values.remark);
    if (visible.parameter) need(lsKey(info.pointId, 'parameter'), values.parameter);
  };

  const showES = !!showElectricalSafety;
  if (showPerformanceTest) esMeasure.forEach((item) => check(item, { error: !showES, specification: true }));
  esSource.forEach((item) => check(item, {
    error: !showES, specification: true, expandedUncertainty: !showES, remark: !showES,
  }));
  perfMeasure.forEach((item) => check(item, { error: true, specification: true }));
  perfSource.forEach((item) => check(item, { error: true, parameter: true }));

  return errors;
};

const FIELD_LABELS = {
  averageuuc: 'Average On UUC',
  averagemaster: 'Average On Master',
  error: 'Deviation',
  specification: 'Tolerance',
  expandeduncertainty: 'Expanded Uncertainty',
  remark: 'Remarks',
  parameter: 'Parameter',
};

/** Readable name for an `ls-{pointId}-{field}` error key, for the submit toast. */
export const describeLSErrorKey = (key, points) => {
  const { esMeasure, esSource, perfMeasure, perfSource } = splitLSPoints(points);
  const match = [...esMeasure, ...esSource, ...perfMeasure, ...perfSource]
    .find(({ info }) => String(key).startsWith(`ls-${info.pointId}-`));
  if (!match) return String(key);
  const { info, section } = match;
  const field = String(key).slice(`ls-${info.pointId}-`.length);
  const reading = field.match(/^(uuc|master)(\d)$/);
  const label = reading
    ? `Reading on ${reading[1] === 'uuc' ? 'UUC' : 'Master'} ${Number(reading[2]) + 1}`
    : (FIELD_LABELS[field] || field);
  const where = section === 'es' ? 'Section 3' : 'Section 4';
  return `${where} ${info.isMeasure ? 'Measure' : 'Source'} - ${info.parameter}${info.setpoint ? ` (${info.setpoint})` : ''}: ${label}`;
};

export const getLSTableConfig = (observations) => {
  const { esMeasure, esSource, perfMeasure, perfSource } = splitLSPoints(observations);
  const all = [...esMeasure, ...esSource, ...perfMeasure, ...perfSource];
  return {
    id: 'observationls',
    name: 'Observation LS',
    category: 'LS',
    structure: { singleHeaders: [], subHeaders: {}, remainingHeaders: [] },
    // One row per point so the shared hidden-input lookups still resolve a point id
    staticRows: all.map(({ info }, i) => [String(i + 1), info.isMeasure ? 'Measure' : 'Source', info.parameter, info.setpoint]),
    hiddenInputs: {
      calibrationPoints: all.map(({ info }) => info.pointId),
      types: all.map(() => 'input'),
      repeatables: all.map(() => '1'),
      values: all.map(({ info }) => info.setpoint || '0'),
    },
    calibration_points: Array.isArray(observations) ? observations : [],
  };
};

const READONLY_INPUT =
  'w-full min-w-[80px] px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white cursor-not-allowed text-right font-mono';
const EDITABLE_INPUT =
  'w-full min-w-[80px] px-2 py-1 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-right font-mono';
const TD = 'px-2 py-1 text-sm border border-gray-200 dark:border-gray-600 align-top';
const TH = 'px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 uppercase border border-gray-300 dark:border-gray-600 text-center';

const ObservationLS = ({
  selectedTableData,
  tableInputValues = {},
  setTableInputValues,
  handleObservationBlur,
  observations,
  instrument,
  observationErrors = {},
}) => {
  if (selectedTableData?.id !== 'observationls') return null;

  const points = Array.isArray(selectedTableData?.calibration_points) && selectedTableData.calibration_points.length > 0
    ? selectedTableData.calibration_points
    : (Array.isArray(observations) ? observations : []);

  const { esMeasure, esSource, perfMeasure, perfSource } = splitLSPoints(points);
  const showES = isYes(instrument?.showelectricalsafety);
  // PHP draws the section 3 Measure table only when showperformancetest is Yes; a missing flag counts as Yes
  const showPerformance = String(instrument?.showperformancetest ?? 'Yes').trim().toLowerCase() !== 'no';
  const errorMode = instrument?.error ?? selectedTableData?.error_mode;

  if (esMeasure.length + esSource.length + perfMeasure.length + perfSource.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
        No calibration points available for LS.
      </div>
    );
  }

  const setValue = (pointId, field, value) => {
    setTableInputValues?.((prev) => ({ ...prev, [lsKey(pointId, field)]: value }));
  };

  // Saves the whole point, like the PHP form posting every field of the row
  const save = (item, field, value, index) => {
    if (!handleObservationBlur) return;
    const values = getLSValues(item, { ...tableInputValues, [lsKey(item.info.pointId, field)]: value }, errorMode);
    handleObservationBlur(index, 0, value, item.info.pointId, { entries: getLSEntries(item, values, showES) });
  };

  const cell = (item, field, value, index, { editable, unit, lcError, text } = {}) => {
    const key = lsKey(item.info.pointId, field);
    const error = lcError || observationErrors[key];
    return (
      <td className={TD}>
        <div className="flex items-center gap-1">
          <input
            type="text"
            data-cell-key={key}
            readOnly={!editable}
            className={editable
              ? `${EDITABLE_INPUT} ${text ? 'text-left' : ''} ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`
              : READONLY_INPUT}
            value={value ?? ''}
            onChange={editable ? (e) => setValue(item.info.pointId, field, e.target.value) : undefined}
            onBlur={editable ? (e) => save(item, field, e.target.value, index) : undefined}
          />
          {unit && <span className="text-xs text-gray-600 dark:text-gray-300 whitespace-nowrap">{unit}</span>}
        </div>
        {editable && error && <div className="text-xs text-red-600 mt-1">{error}</div>}
      </td>
    );
  };

  /**
   * One row. `layout` says which columns the table has:
   *   fixed - Set Point + fixed reading, error - Deviation, tolerance - Tolerance,
   *   extras - Expanded Uncertainty + Remarks, paramEdit - Parameter is editable
   */
  const renderRow = (item, index, layout) => {
    const { info } = item;
    const values = getLSValues(item, tableInputValues, errorMode);
    const readingUnit = info.isMeasure ? info.uucUnit : info.masterUnit;
    const fixedUnit = info.isMeasure ? info.masterUnit : info.uucUnit;

    return (
      <tr key={info.pointId} className="hover:bg-gray-50 dark:hover:bg-gray-700">
        {cell(item, 'parameter', values.parameter, index, { editable: layout.paramEdit, text: true })}
        {layout.fixed && (
          <>
            {cell(item, 'setpoint', info.setpoint, index, { unit: info.uucUnit })}
            {cell(item, info.isMeasure ? 'master0' : 'uuc0', info.fixedReading, index, { unit: fixedUnit })}
          </>
        )}
        {values.readings.map((v, i) => (
          <Fragment key={`r${i}`}>
            {cell(item, `${values.readingField}${i}`, v, index, {
              editable: true,
              unit: readingUnit,
              lcError: getLSReadingError(info, v),
            })}
          </Fragment>
        ))}
        {cell(item, values.averageField, values.average, index, { editable: info.waveform, unit: info.uucUnit })}
        {layout.error && cell(item, 'error', values.error, index, { editable: info.waveform, unit: info.uucUnit })}
        {layout.tolerance && cell(item, 'specification', values.specification, index, { editable: !info.specReadonly, text: true })}
        {layout.extras && (
          <>
            {cell(item, 'expandeduncertainty', values.expandedUncertainty, index, { editable: true, unit: '%' })}
            {cell(item, 'remark', values.remark, index, { editable: !info.remarkReadonly, text: true })}
          </>
        )}
      </tr>
    );
  };

  const table = (items, startIndex, isMeasure, layout) => (
    <div className="overflow-x-auto border border-gray-200 dark:border-gray-600 rounded">
      <table className="w-full text-sm border-collapse">
        <thead className="bg-gray-100 dark:bg-gray-700">
          <tr>
            <th className={TH}>Parameter</th>
            {layout.fixed && <th className={TH}>{isMeasure ? 'Set Point' : 'Setpoint'}</th>}
            {layout.fixed && <th className={TH}>{isMeasure ? 'Reading on Master' : 'Reading on UUC'}</th>}
            <th colSpan={LS_READINGS} className={TH}>{isMeasure ? 'Reading on UUC' : 'Reading on Master'}</th>
            <th className={TH}>{isMeasure ? 'Average On UUC' : 'Average On Master'}</th>
            {layout.error && <th className={TH}>Deviation</th>}
            {layout.tolerance && <th className={TH}>Tolerance</th>}
            {layout.extras && <th className={TH}>(±) Expanded Uncertainty</th>}
            {layout.extras && <th className={TH}>Remarks</th>}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800">
          {items.map((item, i) => renderRow(item, startIndex + i, layout))}
        </tbody>
      </table>
    </div>
  );

  const esMeasureLayout = { fixed: !showES, error: !showES, tolerance: true };
  const esSourceLayout = { fixed: !showES, error: !showES, tolerance: true, extras: !showES };
  const perfMeasureLayout = { fixed: true, error: true, tolerance: true };
  const perfSourceLayout = { fixed: true, error: true, paramEdit: true };

  const starts = {
    esMeasure: 0,
    esSource: esMeasure.length,
    perfMeasure: esMeasure.length + esSource.length,
    perfSource: esMeasure.length + esSource.length + perfMeasure.length,
  };

  return (
    <div className="mb-8 space-y-6">
      {(esMeasure.length > 0 || esSource.length > 0) && (
        <div className="space-y-3">
          <h3 className="text-lg font-medium text-gray-800 dark:text-white uppercase">
            {showES ? '3. Electrical Safety Test' : '3. Performance Testing'}
          </h3>
          {showPerformance && esMeasure.length > 0 && table(esMeasure, starts.esMeasure, true, esMeasureLayout)}
          {esSource.length > 0 && table(esSource, starts.esSource, false, esSourceLayout)}
        </div>
      )}

      {(perfMeasure.length > 0 || perfSource.length > 0) && (
        <div className="space-y-3">
          <h3 className="text-lg font-medium text-gray-800 dark:text-white uppercase">4. Performance Testing</h3>
          {perfMeasure.length > 0 && table(perfMeasure, starts.perfMeasure, true, perfMeasureLayout)}
          {perfSource.length > 0 && table(perfSource, starts.perfSource, false, perfSourceLayout)}
        </div>
      )}
    </div>
  );
};

export default ObservationLS;
