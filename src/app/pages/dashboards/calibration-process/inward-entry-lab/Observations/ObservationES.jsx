import { Fragment } from 'react';
import { safeGetValue, validateLeastCount } from './observationUtils';

/**
 * ES (Electrical Safety / Performance) observation. Port of observationes.php.
 *
 * Two tables, one per mode (points grouped by unit type):
 *
 * Measure - master x1 (fixed), uuc x5 (entered)
 *   Parameter | Set Point | Reading on Master | Reading on UUC 1-5 | Average On UUC | Deviation | Tolerance
 *   averageuuc = avg(uuc 0-4)                     unrounded ('NA')
 *   error      = averageuuc - master              (master - averageuuc when error mode is 'stduuc')
 *   remark     = Pass/Fail of error within the tolerance (hidden, still saved)
 *
 * Source - uuc x1 (fixed), master x5 (entered)
 *   Parameter | Setpoint | Reading on UUC | Reading on Master 1-5 | Average On Master | Deviation |
 *   Tolerance | (±) Expanded Uncertainty | Remarks
 *   averagemaster = avg(master 0-4)               unrounded ('NA')
 *   error         = uuc - averagemaster           (averagemaster - uuc when 'stduuc')
 *
 * showelectricalsafety = Yes hides Set Point, the fixed reading, Deviation, and on Source the
 * Expanded Uncertainty and Remarks columns.
 * "waveform" parameters: averages and deviation are typed in, readings skip least-count checks
 * (Measure still derives the deviation from the typed average).
 * "NIBP" parameters: readings are "systolic/diastolic"; averages and deviation are worked per part.
 */

export const ES_READINGS = 5;

const isYes = (val) => String(val ?? '').trim().toLowerCase() === 'yes';
const isBlank = (val) => val === undefined || val === null || String(val).trim() === '';
const isNA = (val) => isBlank(val) || String(val).trim().toUpperCase() === 'NA';
const toNum = (val) => (isBlank(val) ? NaN : Number(String(val).trim()));

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
  if (!nibp) {
    const diff = toNum(a) - toNum(b);
    return formatUnrounded(diff);
  }
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

/** Everything about a point that doesn't depend on what the operator types. */
export const getESPointInfo = (point, index = 0) => {
  const pointId = (point.calibration_point_id ?? point.point_id ?? point.id ?? `es-${index}`).toString();
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

  // Fixed reading: Measure -> master to master LC (not for waveform/NIBP); Source -> uuc to UUC LC
  const fixedReading = isMeasure
    ? (waveform || nibp ? setpoint : formatToLc(setpoint, masterLc))
    : formatToLc(setpoint, uucLc);

  // Tolerance from the instrument matrix
  const tolType = pick(point, 'tolerance_type', 'tolerancetype');
  const tolRaw = pick(point, 'tolerance_value', 'tolerance_raw') || (tolType ? pick(point, 'tolerance') : '');
  const tolNumeric = !isNaN(toNum(tolRaw));
  const hasMatrixTol = !isBlank(tolRaw) && !isBlank(tolType) && (isMeasure ? tolNumeric : true);

  let tolComment = pick(point, 'specification') || (tolType ? '' : pick(point, 'tolerance'));
  let tolRange = null;
  if (hasMatrixTol) {
    if (!isMeasure && /[<>]/.test(tolRaw)) tolComment = tolRaw;
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
      readings: Array.from({ length: ES_READINGS }, (_, i) =>
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

export const esKey = (pointId, field) => `es-${pointId}-${field}`;

/** Current values for a point: what has been typed, else what the API stored, with derived fields. */
export const getESValues = (info, tableInputValues = {}, errorMode) => {
  const local = (field, fallback) => tableInputValues[esKey(info.pointId, field)] ?? fallback;
  const readingField = info.isMeasure ? 'uuc' : 'master';
  const averageField = info.isMeasure ? 'averageuuc' : 'averagemaster';

  const readings = info.stored.readings.map((v, i) => local(`${readingField}${i}`, v));

  const average = info.waveform
    ? local(averageField, info.stored.average)
    : averageOf(readings, info.nibp);

  // Measure: uuc = average, master = fixed. Source: uuc = fixed, master = average
  const uuc = info.isMeasure ? average : info.fixedReading;
  const master = info.isMeasure ? info.fixedReading : average;
  const computedError = errorMode === 'stduuc' ? subtract(master, uuc, info.nibp) : subtract(uuc, master, info.nibp);

  // Waveform deviation is typed in; Measure's typed average still drives it when not overridden
  let error;
  if (!info.waveform) error = computedError;
  else error = local('error', info.isMeasure && computedError !== '' ? computedError : info.stored.error);

  const specification = local('specification', info.tolComment);
  const remark = info.tolRange && error !== '' && !info.nibp
    ? checkSafety(error, info.tolRange.min, info.tolRange.max)
    : local('remark', info.stored.remark);

  return {
    readingField,
    averageField,
    readings,
    average,
    error,
    specification,
    remark,
    expandedUncertainty: local('expandeduncertainty', info.stored.expandedUncertainty),
  };
};

/** Least-count rule for an entered reading, or null when the PHP applies none. */
const readingLeastCount = (info) => {
  if (info.isMeasure) return info.waveform || info.nibp ? null : info.uucLc;
  return info.masterLc;
};

export const getESReadingError = (info, value) => {
  const lc = readingLeastCount(info);
  if (!lc || isBlank(value)) return null;
  const { isValid, error } = validateLeastCount(String(value).trim(), lc);
  return isValid ? null : error;
};

/** Summary-table rows posted for a point, as the PHP form would post them. */
export const getESEntries = (info, values, showElectricalSafety) => {
  const entries = [{ type: 'parameter', repeatable: '0', value: info.parameter }];

  if (!showElectricalSafety) {
    entries.push({ type: 'setpoint', repeatable: '0', value: info.setpoint });
    entries.push({ type: info.isMeasure ? 'master' : 'uuc', repeatable: '0', value: info.fixedReading });
  }

  values.readings.forEach((v, i) => {
    if (!isBlank(v)) entries.push({ type: values.readingField, repeatable: String(i), value: v });
  });
  entries.push({ type: values.averageField, repeatable: '0', value: values.average });

  if (!showElectricalSafety) entries.push({ type: 'error', repeatable: '0', value: values.error });
  entries.push({ type: 'specification', repeatable: '0', value: values.specification });

  // Measure posts remark hidden; Source only shows it outside electrical safety
  if (info.isMeasure || !showElectricalSafety) {
    entries.push({ type: 'remark', repeatable: '0', value: values.remark });
  }
  if (!info.isMeasure && !showElectricalSafety) {
    entries.push({ type: 'expandeduncertainty', repeatable: '0', value: values.expandedUncertainty });
  }

  return entries
    .filter((e) => !isBlank(e.value))
    .map((e) => ({ ...e, value: String(e.value) }));
};

/** Points in PHP order: Measure then Source, each grouped by unit type. */
export const splitESPoints = (points) => {
  const list = (Array.isArray(points) ? points : []).filter(Boolean).map((p, i) => ({ point: p, info: getESPointInfo(p, i) }));
  const grouped = (items) => {
    const order = [];
    const byType = {};
    items.forEach((item) => {
      const k = item.info.unitType;
      if (!byType[k]) { byType[k] = []; order.push(k); }
      byType[k].push(item);
    });
    return order.flatMap((k) => byType[k]);
  };
  return {
    measure: grouped(list.filter((x) => x.info.isMeasure)),
    source: grouped(list.filter((x) => !x.info.isMeasure)),
  };
};

/** Required + least-count checks for every visible input, keyed like the component's inputs. */
export const validateESPoints = (points, tableInputValues, { errorMode, showElectricalSafety } = {}) => {
  const errors = {};
  const { measure, source } = splitESPoints(points);

  [...measure, ...source].forEach(({ info }) => {
    const values = getESValues(info, tableInputValues, errorMode);
    const need = (field, value) => {
      if (isBlank(value)) errors[esKey(info.pointId, field)] = 'This field is required';
    };

    values.readings.forEach((v, i) => {
      const key = esKey(info.pointId, `${values.readingField}${i}`);
      if (isBlank(v)) errors[key] = 'This field is required';
      else {
        const lcError = getESReadingError(info, v);
        if (lcError) errors[key] = lcError;
      }
    });
    need(values.averageField, values.average);
    if (!showElectricalSafety) need('error', values.error);
    need('specification', values.specification);
    if (!info.isMeasure && !showElectricalSafety) {
      need('expandeduncertainty', values.expandedUncertainty);
      need('remark', values.remark);
    }
  });

  return errors;
};

const FIELD_LABELS = {
  averageuuc: 'Average On UUC',
  averagemaster: 'Average On Master',
  error: 'Deviation',
  specification: 'Tolerance',
  expandeduncertainty: 'Expanded Uncertainty',
  remark: 'Remarks',
};

/** Readable name for an `es-{pointId}-{field}` error key, for the submit toast. */
export const describeESErrorKey = (key, points) => {
  const { measure, source } = splitESPoints(points);
  const match = [...measure, ...source].find(({ info }) => String(key).startsWith(`es-${info.pointId}-`));
  if (!match) return String(key);
  const { info } = match;
  const field = String(key).slice(`es-${info.pointId}-`.length);
  const reading = field.match(/^(uuc|master)(\d)$/);
  const label = reading
    ? `Reading on ${reading[1] === 'uuc' ? 'UUC' : 'Master'} ${Number(reading[2]) + 1}`
    : (FIELD_LABELS[field] || field);
  return `${info.isMeasure ? 'Measure' : 'Source'} - ${info.parameter}${info.setpoint ? ` (${info.setpoint})` : ''}: ${label}`;
};

/** One row per point so the shared hidden-input lookups still resolve a point id. */
export const createESRows = (points) => {
  const { measure, source } = splitESPoints(points);
  const all = [...measure, ...source];
  return {
    rows: all.map(({ info }, i) => [String(i + 1), info.isMeasure ? 'Measure' : 'Source', info.parameter, info.setpoint]),
    hiddenInputs: {
      calibrationPoints: all.map(({ info }) => info.pointId),
      types: all.map(() => 'input'),
      repeatables: all.map(() => '1'),
      values: all.map(({ info }) => info.setpoint || '0'),
    },
    unitTypes: [],
  };
};

export const getESTableConfig = (observations) => {
  const { rows, hiddenInputs, unitTypes } = createESRows(observations);
  return {
    id: 'observationes',
    name: 'Observation ES',
    category: 'Medical/Electrical Safety',
    structure: { singleHeaders: [], subHeaders: {}, remainingHeaders: [] },
    staticRows: rows,
    hiddenInputs,
    unitTypes,
    calibration_points: Array.isArray(observations) ? observations : [],
  };
};

const READONLY_INPUT =
  'w-full min-w-[80px] px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white cursor-not-allowed text-right font-mono';
const EDITABLE_INPUT =
  'w-full min-w-[80px] px-2 py-1 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-right font-mono';
const TD = 'px-2 py-1 text-sm border border-gray-200 dark:border-gray-600 align-top';
const TH = 'px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 uppercase border border-gray-300 dark:border-gray-600 text-center';

const ObservationES = ({
  selectedTableData,
  tableInputValues = {},
  setTableInputValues,
  handleObservationBlur,
  observations,
  instrument,
  observationErrors = {},
}) => {
  if (selectedTableData?.id !== 'observationes') return null;

  const points = Array.isArray(selectedTableData?.calibration_points) && selectedTableData.calibration_points.length > 0
    ? selectedTableData.calibration_points
    : (Array.isArray(observations) ? observations : []);

  const { measure, source } = splitESPoints(points);
  const showES = isYes(instrument?.showelectricalsafety ?? selectedTableData?.config?.show_electrical_safety);
  // PHP only draws the Measure table when showperformancetest is Yes; treat a missing flag as Yes
  const showPerformance = String(instrument?.showperformancetest ?? 'Yes').trim().toLowerCase() !== 'no';
  const errorMode = instrument?.error ?? selectedTableData?.error_mode;

  if (measure.length === 0 && source.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
        No calibration points available for ES.
      </div>
    );
  }

  const setValue = (pointId, field, value) => {
    if (!setTableInputValues) return;
    setTableInputValues((prev) => ({ ...prev, [esKey(pointId, field)]: value }));
  };

  // Saves the whole point, like the PHP form posting every field of the row
  const save = (info, field, value, index) => {
    if (!handleObservationBlur) return;
    const values = getESValues(info, { ...tableInputValues, [esKey(info.pointId, field)]: value }, errorMode);
    handleObservationBlur(index, 0, value, info.pointId, { entries: getESEntries(info, values, showES) });
  };

  const renderInput = (info, field, value, index, { editable, unit, lcError } = {}) => {
    const key = esKey(info.pointId, field);
    const error = lcError || observationErrors[key];
    return (
      <td className={TD}>
        <div className="flex items-center gap-1">
          <input
            type="text"
            data-cell-key={key}
            readOnly={!editable}
            className={editable
              ? `${EDITABLE_INPUT} ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`
              : READONLY_INPUT}
            value={value ?? ''}
            onChange={editable ? (e) => setValue(info.pointId, field, e.target.value) : undefined}
            onBlur={editable ? (e) => save(info, field, e.target.value, index) : undefined}
          />
          {unit && <span className="text-xs text-gray-600 dark:text-gray-300 whitespace-nowrap">{unit}</span>}
        </div>
        {editable && error && <div className="text-xs text-red-600 mt-1">{error}</div>}
      </td>
    );
  };

  const renderRow = ({ info }, index) => {
    const values = getESValues(info, tableInputValues, errorMode);
    const readingUnit = info.isMeasure ? info.uucUnit : info.masterUnit;
    const fixedUnit = info.isMeasure ? info.masterUnit : info.uucUnit;
    // PHP labels Source's Average On Master with the UUC unit
    const averageUnit = info.uucUnit;

    const readingCells = values.readings.map((v, i) => (
      <Fragment key={`r${i}`}>
        {renderInput(info, `${values.readingField}${i}`, v, index, {
          editable: true,
          unit: readingUnit,
          lcError: getESReadingError(info, v),
        })}
      </Fragment>
    ));
    const averageCell = renderInput(info, values.averageField, values.average, index, { editable: info.waveform, unit: averageUnit });
    const fixedCells = !showES && (
      <>
        {renderInput(info, 'setpoint', info.setpoint, index, { unit: info.uucUnit })}
        {renderInput(info, info.isMeasure ? 'master0' : 'uuc0', info.fixedReading, index, { unit: fixedUnit })}
      </>
    );

    return (
      <tr key={info.pointId} className="hover:bg-gray-50 dark:hover:bg-gray-700">
        {renderInput(info, 'parameter', info.parameter, index)}
        {fixedCells}
        {readingCells}
        {averageCell}
        {!showES && renderInput(info, 'error', values.error, index, {
          editable: info.waveform,
          unit: info.uucUnit,
        })}
        {renderInput(info, 'specification', values.specification, index, { editable: !info.specReadonly })}
        {!info.isMeasure && !showES && (
          <>
            {renderInput(info, 'expandeduncertainty', values.expandedUncertainty, index, { editable: true, unit: '%' })}
            {renderInput(info, 'remark', values.remark, index, { editable: !info.remarkReadonly })}
          </>
        )}
      </tr>
    );
  };

  return (
    <div className="mb-8 space-y-6">
      {showPerformance && measure.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-medium text-gray-800 dark:text-white uppercase">
            {showES ? '3. Electrical Safety Test' : '3. Performance Testing'}
          </h3>
          <div className="overflow-x-auto border border-gray-200 dark:border-gray-600 rounded">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className={TH}>Parameter</th>
                  {!showES && <th className={TH}>Set Point</th>}
                  {!showES && <th className={TH}>Reading on Master</th>}
                  <th colSpan={ES_READINGS} className={TH}>Reading on UUC</th>
                  <th className={TH}>Average On UUC</th>
                  {!showES && <th className={TH}>Deviation</th>}
                  <th className={TH}>Tolerance</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800">
                {measure.map((item, i) => renderRow(item, i))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {source.length > 0 && (
        <div className="overflow-x-auto border border-gray-200 dark:border-gray-600 rounded">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-gray-100 dark:bg-gray-700">
              <tr>
                <th className={TH}>Parameter</th>
                {!showES && <th className={TH}>Setpoint</th>}
                {!showES && <th className={TH}>Reading on UUC</th>}
                <th colSpan={ES_READINGS} className={TH}>Reading on Master</th>
                <th className={TH}>Average On Master</th>
                {!showES && <th className={TH}>Deviation</th>}
                <th className={TH}>Tolerance</th>
                {!showES && <th className={TH}>(±) Expanded Uncertainty</th>}
                {!showES && <th className={TH}>Remarks</th>}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800">
              {source.map((item, i) => renderRow(item, measure.length + i))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ObservationES;
