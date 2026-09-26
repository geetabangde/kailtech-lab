import { safeGetValue, safeGetArray, getDecimalPlaces } from './observationUtils';

/**
 * Thermocouple Sensor With Indicator (TSWI) Observation
 *
 * Each calibration point renders as two rows (UUC, then Master):
 *
 *  col | UUC row                          | Master row
 *  ----+----------------------------------+--------------------------------
 *   0  | Sr. No. (rowspan 2)              | '-'
 *   1  | Set Point, read-only (rowspan 2) | '-'
 *   2  | 'UUC'                            | 'Master'
 *   3  | UUC unit description (text)      | masterunit (unit select)
 *   4  | '-'                              | sensitivitycoefficient
 *  5-9 | uuc, repeatable 0-4 (LC checked) | master, repeatable 0-4
 *  10  | '-'                              | averagemaster (calculated)
 *  11  | '-'                              | ambientmaster
 *  12  | '-'                              | saveragemaster (calculated)
 *  13  | averageuuc (calculated)          | caveragemaster
 *  14  | error (calculated, rowspan 2)    | '-'
 *
 * Rounding, as in PHP: averageuuc to the UUC least count's decimals, averagemaster
 * unrounded ($mlc = "NA"), deviation to max(UUC, master) least-count decimals
 * ($errorlc), unrounded when either least count is "NA".
 */

export const TSWI_COLS = {
  SR_NO: 0,
  SET_POINT: 1,
  VALUE_OF: 2,
  UNIT: 3,
  SENSITIVITY: 4,
  OBS_START: 5,
  OBS_END: 9,
  AVERAGE: 10,
  AMBIENT: 11,
  CORRECTED_AVERAGE: 12,
  CONVERTED_AVERAGE: 13,
  DEVIATION: 14,
};

const OBS_COUNT = 5;

const isBlank = (val) => val === undefined || val === null || String(val).trim() === '';

const toNumber = (val) => (isBlank(val) ? NaN : Number(String(val).trim()));

// Unrounded like PHP's 'NA' precision, but without float noise (0.1 + 0.2 -> "0.3")
const formatUnrounded = (num) => (Number.isFinite(num) ? String(Number(num.toFixed(10))) : '');

const formatDecimals = (num, decimals) => {
  if (!Number.isFinite(num)) return '';
  return Number.isInteger(decimals) && decimals >= 0 ? num.toFixed(decimals) : formatUnrounded(num);
};

// Decimal places of a least count, or null when it is "NA"/missing (no rounding)
const lcDecimals = (leastCount) => {
  if (isBlank(leastCount) || String(leastCount).trim().toUpperCase() === 'NA') return null;
  return getDecimalPlaces(String(leastCount).trim());
};

const toDecimalCount = (val) => {
  const n = parseInt(val, 10);
  return Number.isInteger(n) && n >= 0 && n <= 20 ? n : null;
};

export const getTSWIRowType = (rowData) => (rowData?.[TSWI_COLS.VALUE_OF] === 'Master' ? 'master' : 'uuc');

const mean = (rowData) => {
  const readings = rowData
    .slice(TSWI_COLS.OBS_START, TSWI_COLS.OBS_END + 1)
    .map(toNumber)
    .filter((val) => !isNaN(val));
  return readings.length ? readings.reduce((sum, val) => sum + val, 0) / readings.length : NaN;
};

/**
 * All calculated cells of one point (both rows) at once.
 * meta is the point's rowMeta entry ({ averageDecimals, errorDecimals }).
 * PHP: averageavg(uuc…, 'averageuuc', lc), averageavg(master…, 'averagemaster', 'NA'),
 * plusadd('ambientmaster', 'averagemaster', 'saveragemaster', 'NA'),
 * substractminus(averageuuc, caveragemaster) — reversed for cusset error "stduuc".
 */
export const calculateTSWIPoint = (uucRowData, masterRowData, meta, cussetError) => {
  const uucRow = uucRowData || [];
  const masterRow = masterRowData || [];

  const uucMean = mean(uucRow);
  const uucAverage = formatDecimals(uucMean, meta?.averageDecimals);

  const masterMean = mean(masterRow);
  const ambient = toNumber(masterRow[TSWI_COLS.AMBIENT]);
  const masterAverage = formatUnrounded(masterMean);
  const correctedAverage = formatUnrounded(masterMean + (isNaN(ambient) ? 0 : ambient));

  const uucAvgNum = toNumber(uucAverage);
  const masterConverted = toNumber(masterRow[TSWI_COLS.CONVERTED_AVERAGE]);
  const error = isNaN(uucAvgNum) || isNaN(masterConverted)
    ? ''
    : formatDecimals(cussetError === 'stduuc' ? masterConverted - uucAvgNum : uucAvgNum - masterConverted, meta?.errorDecimals);

  return {
    uuc: { average: uucAverage },
    master: { average: masterAverage, correctedAverage },
    error,
  };
};

/**
 * Calculation logic for one TSWI row; pairRowData is the other row of the same point.
 * Returns { average, correctedAverage, error } for this row (average is the UUC
 * "Average (unit)" on the UUC row and the master average on the Master row).
 */
export const calculateTSWIValues = (rowData, pairRowData, meta, cussetError) => {
  if (!rowData || !Array.isArray(rowData)) return {};
  const isUUC = getTSWIRowType(rowData) === 'uuc';
  const calc = calculateTSWIPoint(isUUC ? rowData : pairRowData, isUUC ? pairRowData : rowData, meta, cussetError);
  return isUUC
    ? { average: calc.uuc.average, correctedAverage: '', error: calc.error }
    : { average: calc.master.average, correctedAverage: calc.master.correctedAverage, error: calc.error };
};

/**
 * Summary-table type and repeatable for a cell, matching the PHP hidden inputs.
 * Returns null for cells that are not saved.
 */
export const getTSWIFieldType = (rowType, colIndex) => {
  const isUUC = rowType === 'uuc';

  if (colIndex >= TSWI_COLS.OBS_START && colIndex <= TSWI_COLS.OBS_END) {
    return { type: isUUC ? 'uuc' : 'master', repeatable: String(colIndex - TSWI_COLS.OBS_START) };
  }

  const uucTypes = {
    [TSWI_COLS.SET_POINT]: 'setpoint',
    [TSWI_COLS.CONVERTED_AVERAGE]: 'averageuuc',
    [TSWI_COLS.DEVIATION]: 'error',
  };
  const masterTypes = {
    [TSWI_COLS.UNIT]: 'masterunit',
    [TSWI_COLS.SENSITIVITY]: 'sensitivitycoefficient',
    [TSWI_COLS.AVERAGE]: 'averagemaster',
    [TSWI_COLS.AMBIENT]: 'ambientmaster',
    [TSWI_COLS.CORRECTED_AVERAGE]: 'saveragemaster',
    [TSWI_COLS.CONVERTED_AVERAGE]: 'caveragemaster',
  };

  const type = (isUUC ? uucTypes : masterTypes)[colIndex];
  return type ? { type, repeatable: '0' } : null;
};

/**
 * Cells the user types into (the Master unit column is a select).
 * UUC row: only the five readings. Master row: unit, sensitivity, readings,
 * ambient mV and Average (unit).
 */
export const isTSWICellEditable = (rowType, colIndex) => {
  const isReading = colIndex >= TSWI_COLS.OBS_START && colIndex <= TSWI_COLS.OBS_END;
  if (rowType === 'uuc') return isReading;
  return isReading || [TSWI_COLS.UNIT, TSWI_COLS.SENSITIVITY, TSWI_COLS.AMBIENT, TSWI_COLS.CONVERTED_AVERAGE].includes(colIndex);
};

/**
 * Least count the UUC readings are checked against (PHP inleastcount/divisibleby),
 * or null when there is none. Only UUC readings carry this check.
 */
export const getTSWIReadingLeastCount = (rowType, colIndex, meta) => {
  if (rowType !== 'uuc' || colIndex < TSWI_COLS.OBS_START || colIndex > TSWI_COLS.OBS_END) return null;
  const lc = meta?.leastCount;
  if (isBlank(lc) || String(lc).trim().toUpperCase() === 'NA') return null;
  const num = parseFloat(lc);
  return !isNaN(num) && num > 0 ? String(lc).trim() : null;
};

/**
 * Submit-time validation for one row: PHP marks every editable numeric input
 * "required,number", and UUC readings also check the least count. The master
 * unit select is not validated (PHP's attribute is misspelled "data-bvaliddator").
 * validateLeastCount is CalibrateStep3's shared (value, leastCount) => { isValid, error }.
 */
export const validateTSWIRow = (rowData, rowIndex, meta, validateLeastCount) => {
  const errors = {};
  const rowType = getTSWIRowType(rowData);

  rowData.forEach((cell, colIndex) => {
    if (colIndex === TSWI_COLS.UNIT || !isTSWICellEditable(rowType, colIndex)) return;

    const key = `${rowIndex}-${colIndex}`;
    if (isBlank(cell)) {
      errors[key] = 'This field is required';
      return;
    }
    if (isNaN(toNumber(cell))) {
      errors[key] = 'Please enter a valid number';
      return;
    }
    const leastCount = getTSWIReadingLeastCount(rowType, colIndex, meta);
    if (leastCount && typeof validateLeastCount === 'function') {
      const { isValid, error } = validateLeastCount(String(cell).trim(), leastCount);
      if (!isValid) errors[key] = error;
    }
  });

  return errors;
};

// First non-blank value among the candidate keys
const pick = (obj, ...keys) => {
  for (const key of keys) {
    const val = safeGetValue(obj?.[key]);
    if (val !== '') return val;
  }
  return '';
};

const asObject = (val) => (val && typeof val === 'object' && !Array.isArray(val) ? val : {});

// Readings come either as an array (uuc.observations) or flat keys (uuc0..uuc4 / master0..master4)
const getReadings = (side, point, flatPrefix) => {
  if (side?.observations || side?.readings || side?.values) {
    return safeGetArray(side.observations ?? side.readings ?? side.values, OBS_COUNT).slice(0, OBS_COUNT);
  }
  const flatArray = point?.[`${flatPrefix}_values`] ?? point?.[`${flatPrefix}_readings`];
  if (flatArray) return safeGetArray(flatArray, OBS_COUNT).slice(0, OBS_COUNT);
  return Array.from({ length: OBS_COUNT }, (_, i) => safeGetValue(point?.[`${flatPrefix}${i}`]));
};

/**
 * Per-point rounding / validation info:
 *  leastCount       UUC least count the readings are validated against
 *  averageDecimals  decimals of averageuuc (UUC matrix least count; null = unrounded)
 *  errorDecimals    decimals of the deviation (max of UUC and master; null = unrounded)
 */
const getPointMeta = (point) => {
  const uuc = asObject(point.uuc);
  const leastCount = pick(point, 'leastcount', 'least_count', 'least_count_uuc') || pick(uuc, 'least_count', 'leastcount');
  const masterLeastCount = pick(point, 'master_leastcount', 'masterleastcount', 'master_least_count', 'least_count_master')
    || pick(asObject(point.master), 'least_count', 'leastcount');

  const uucDecimals = toDecimalCount(pick(point, 'average_decimals', 'lc_decimals')) ?? lcDecimals(leastCount);
  const masterDecimals = lcDecimals(masterLeastCount);
  const derivedErrorDecimals = uucDecimals === null || masterDecimals === null
    ? null
    : Math.max(uucDecimals, masterDecimals);

  return {
    leastCount: leastCount || null,
    averageDecimals: uucDecimals,
    errorDecimals: toDecimalCount(pick(point, 'error_decimals')) ?? derivedErrorDecimals,
  };
};

/**
 * Row generator for TSWI Observation.
 * Accepts points shaped either as
 *   { calibration_point_id, set_point, unit_description, leastcount, master_leastcount,
 *     uuc: { observations, average }, master: { unit, sensitivity_coefficient, observations,
 *     average, ambient_mv, corrected_average, converted_average }, error }
 * or flat, keyed by the PHP summary types (setpoint, uuc0..uuc4, averageuuc, masterunit, …).
 */
export const createTSWIRows = (dataArray) => {
  const rows = [];
  const rowMeta = [];
  const calibrationPoints = [];
  const types = [];
  const repeatables = [];
  const values = [];

  (Array.isArray(dataArray) ? dataArray : []).forEach((point, index) => {
    if (!point) return;

    const uuc = asObject(point.uuc);
    const master = asObject(point.master);
    const meta = getPointMeta(point);

    const pointId = (point.calibration_point_id ?? point.point_id ?? point.id)?.toString() || '';
    const srNo = pick(point, 'sr_no', 'sequence_number') || String(index + 1);
    const rawSetPoint = pick(point, 'set_point', 'setpoint', 'point');
    const setPointNum = toNumber(rawSetPoint);
    // PHP shows the set point with the UUC least count's decimals when numeric
    const setPoint = !isNaN(setPointNum) && meta.averageDecimals !== null ? setPointNum.toFixed(meta.averageDecimals) : rawSetPoint;

    const uucRow = [
      srNo,
      setPoint,
      'UUC',
      pick(point, 'unit_description', 'uuc_unit_description', 'unit_label') || pick(uuc, 'unit_description', 'unit'),
      '-',
      ...getReadings(uuc, point, 'uuc'),
      '-',
      '-',
      '-',
      pick(uuc, 'average') || pick(point, 'averageuuc', 'average_uuc'),
      pick(point, 'error', 'deviation'),
    ];

    const masterRow = [
      '-',
      '-',
      'Master',
      pick(master, 'unit_id', 'unit') || pick(point, 'masterunit'),
      pick(master, 'sensitivity_coefficient', 'sensitivitycoefficient') || pick(point, 'sensitivitycoefficient', 'sensitivity_coefficient'),
      ...getReadings(master, point, 'master'),
      pick(master, 'average') || pick(point, 'averagemaster', 'average_master'),
      pick(master, 'ambient_mv', 'ambient') || pick(point, 'ambientmaster', 'ambient_master'),
      pick(master, 'corrected_average') || pick(point, 'saveragemaster', 's_average_master'),
      pick(master, 'converted_average', 'c_average') || pick(point, 'caveragemaster', 'c_average_master'),
      '-',
    ];

    [uucRow, masterRow].forEach((row, rowOffset) => {
      rows.push(row);
      rowMeta.push(meta);
      calibrationPoints.push(pointId);
      types.push(rowOffset === 0 ? 'uuc' : 'master');
      repeatables.push('0');
      values.push(setPoint || '0');
    });
  });

  return { rows, rowMeta, hiddenInputs: { calibrationPoints, types, repeatables, values } };
};

/**
 * Points array from a get-observation response, or null when none is found.
 * Top-level cusset_error / unit label are copied onto each point, since the
 * calculations and headers read them per point.
 */
export const extractTSWIPoints = (observationData) => {
  const root = observationData?.data && !Array.isArray(observationData.data) ? observationData.data : observationData;
  const points = [root, observationData?.data, root?.calibration_points, root?.calibration_data, root?.points]
    .find(Array.isArray);
  if (!points) return null;

  const cussetError = root?.cusset_error ?? observationData?.cusset_error;
  const unitLabel = root?.unit_label ?? root?.set_point_unit;
  return points.map((point) => (point && typeof point === 'object'
    ? { ...point, cusset_error: point.cusset_error ?? cussetError, unit_label: point.unit_label ?? unitLabel }
    : point));
};

// PHP heads Set Point / Average / Deviation with the first point's UUC unit description
export const getTSWIUnitLabel = (observations) => {
  const first = Array.isArray(observations) ? observations.find(Boolean) : null;
  if (!first) return '';
  return pick(first, 'unit_label', 'set_point_unit', 'unit_description', 'uuc_unit_description')
    || pick(asObject(first.uuc), 'unit_description');
};

/**
 * Table config for TSWI Observation.
 */
export const getTSWITableConfig = (observations, unitLabel) => {
  const { rows, rowMeta, hiddenInputs } = createTSWIRows(observations);
  const label = unitLabel ?? getTSWIUnitLabel(observations);
  const suffix = label ? ` (${label})` : '';
  return {
    id: 'observationtswi',
    name: 'Observation TSWI',
    category: 'Temperature',
    structure: {
      singleHeaders: ['Sr. No.', `Set Point${suffix}`, 'Value Of', 'Unit', 'Sensitivity Coefficient'],
      subHeaders: {
        'Observation': ['1', '2', '3', '4', '5']
      },
      remainingHeaders: ['Average', 'mV generated On ambient', 'Average with corrected mv', `Average${suffix}`, `Deviation${suffix}`]
    },
    staticRows: rows,
    hiddenInputs: hiddenInputs,
    rowMeta: rowMeta,
    // Columns merged across a point's UUC and Master rows in PHP (rowspan="2")
    rowSpanColumns: [TSWI_COLS.SR_NO, TSWI_COLS.SET_POINT, TSWI_COLS.DEVIATION],
    unitColumnIndex: TSWI_COLS.UNIT,
  };
};

const ObservationTSWI = () => null;
export default ObservationTSWI;
