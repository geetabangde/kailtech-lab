import { safeGetValue, getDecimalPlaces } from './observationUtils';



export const SUTM_COLS = {
  SR_NO: 0,
  SET_POINT: 1,
  SET1_DISPLACEMENT: 2,
  SET1_TIME: 3,
  SET1_SPEED: 4,
  SET2_DISPLACEMENT: 5,
  SET2_TIME: 6,
  SET2_SPEED: 7,
  MEAN_SPEED: 8,
  ERROR: 9,
};

// Displacement / time / speed columns of each set
const SETS = [
  { displacement: SUTM_COLS.SET1_DISPLACEMENT, time: SUTM_COLS.SET1_TIME, speed: SUTM_COLS.SET1_SPEED },
  { displacement: SUTM_COLS.SET2_DISPLACEMENT, time: SUTM_COLS.SET2_TIME, speed: SUTM_COLS.SET2_SPEED },
];

const INPUT_COLS = [
  SUTM_COLS.SET1_DISPLACEMENT, SUTM_COLS.SET1_TIME,
  SUTM_COLS.SET2_DISPLACEMENT, SUTM_COLS.SET2_TIME,
];

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

export const isSUTMInputColumn = (colIndex) => INPUT_COLS.includes(colIndex);

// Only displacement and time are typed; everything else is read-only in PHP
export const isSUTMCellEditable = (colIndex) => isSUTMInputColumn(colIndex);

/**
 * Speed of one set (PHP calculatespeed). Blank when displacement or time is
 * missing, or time is 0 (PHP would show NaN/Infinity there).
 */
const calculateSpeed = (displacement, time, decimals) => {
  const d = toNumber(displacement);
  const t = toNumber(time);
  if (isNaN(d) || isNaN(t) || t === 0) return '';
  return formatDecimals((d / t) * 60, decimals);
};

/**
 * All calculated cells of a row: { speeds: [set1, set2], average, error }.
 * meta is the row's rowMeta entry ({ speedDecimals }).
 * Error: set speed - mean speed, reversed for cusset error "stduuc" (PHP substractminus).
 */
export const calculateSUTMValues = (rowData, meta, cussetError) => {
  const row = rowData || [];
  const speeds = SETS.map((set) => calculateSpeed(row[set.displacement], row[set.time], meta?.speedDecimals));

  const filled = speeds.map(toNumber).filter((val) => !isNaN(val));
  const averageNum = filled.length ? filled.reduce((sum, val) => sum + val, 0) / filled.length : NaN;
  const average = formatUnrounded(averageNum);

  const uuc = toNumber(row[SUTM_COLS.SET_POINT]);
  const error = isNaN(uuc) || isNaN(averageNum)
    ? ''
    : formatUnrounded(cussetError === 'stduuc' ? averageNum - uuc : uuc - averageNum);

  return { speeds, average, error };
};

/**
 * The row's calculated cells keyed by column, for writing into table state.
 */
export const getSUTMCalculatedCells = (rowData, meta, cussetError) => {
  const calc = calculateSUTMValues(rowData, meta, cussetError);
  return {
    [SUTM_COLS.SET1_SPEED]: calc.speeds[0],
    [SUTM_COLS.SET2_SPEED]: calc.speeds[1],
    [SUTM_COLS.MEAN_SPEED]: calc.average,
    [SUTM_COLS.ERROR]: calc.error,
  };
};

/**
 * Summary-table type and repeatable for a cell, matching the PHP hidden inputs.
 * Returns null for cells that are not saved.
 */
export const getSUTMFieldType = (colIndex) => ({
  [SUTM_COLS.SET_POINT]: { type: 'uuc', repeatable: '0' },
  [SUTM_COLS.SET1_DISPLACEMENT]: { type: 'masterinc', repeatable: '0' },
  [SUTM_COLS.SET1_TIME]: { type: 'masterdec', repeatable: '0' },
  [SUTM_COLS.SET1_SPEED]: { type: 'master', repeatable: '0' },
  [SUTM_COLS.SET2_DISPLACEMENT]: { type: 'masterinc', repeatable: '1' },
  [SUTM_COLS.SET2_TIME]: { type: 'masterdec', repeatable: '1' },
  [SUTM_COLS.SET2_SPEED]: { type: 'master', repeatable: '1' },
  [SUTM_COLS.MEAN_SPEED]: { type: 'averagemaster', repeatable: '0' },
  [SUTM_COLS.ERROR]: { type: 'error', repeatable: '0' },
}[colIndex] || null);

/**
 * Submit-time validation for one row: PHP marks displacement and time
 * "required,number" (no least-count check). Calculated cells are filled from them.
 */
export const validateSUTMRow = (rowData, rowIndex) => {
  const errors = {};
  INPUT_COLS.forEach((colIndex) => {
    const key = `${rowIndex}-${colIndex}`;
    const cell = rowData?.[colIndex];
    if (isBlank(cell)) {
      errors[key] = 'This field is required';
    } else if (isNaN(toNumber(cell))) {
      errors[key] = 'Please enter a valid number';
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

// Value of a repeatable type: array (masterinc: [..]), nested sets, or flat keys (masterinc0 / masterinc_1)
const getRepeatable = (point, keys, index) => {
  for (const key of keys) {
    const val = point?.[key];
    if (Array.isArray(val)) return safeGetValue(val[index]);
  }
  const set = Array.isArray(point?.sets) ? point.sets[index] : null;
  if (set) {
    const fromSet = pick(set, ...keys.map((k) => (k === 'masterinc' ? 'displacement' : k === 'masterdec' ? 'time' : 'speed')));
    if (fromSet !== '') return fromSet;
  }
  for (const key of keys) {
    const val = pick(point, `${key}${index}`, `${key}_${index}`, `${key}_${index + 1}`);
    if (val !== '') return val;
  }
  return '';
};

/**
 * Row generator for SUTM Observation. Accepts points with repeatables as arrays
 * (masterinc / masterdec / master), nested sets ([{ displacement, time, speed }]),
 * or flat keys (masterinc0, masterdec1, master_0, …).
 */
export const createSUTMRows = (dataArray) => {
  const rows = [];
  const rowMeta = [];
  const calibrationPoints = [];
  const types = [];
  const repeatables = [];
  const values = [];

  (Array.isArray(dataArray) ? dataArray : []).forEach((point, index) => {
    if (!point) return;

    const leastCount = pick(point, 'leastcount', 'least_count', 'least_count_uuc');
    // PHP rounds speeds and the set point to $lc (UUC matrix least-count decimals)
    const speedDecimals = toDecimalCount(pick(point, 'lc', 'lc_decimals', 'speed_decimals')) ?? lcDecimals(leastCount);

    const rawSetPoint = pick(point, 'set_point', 'setpoint', 'uuc', 'point');
    const setPointNum = toNumber(rawSetPoint);
    const setPoint = !isNaN(setPointNum) && speedDecimals !== null ? setPointNum.toFixed(speedDecimals) : rawSetPoint;

    const row = [
      pick(point, 'sr_no', 'sequence_number') || String(index + 1),
      setPoint,
      getRepeatable(point, ['masterinc', 'displacement'], 0),
      getRepeatable(point, ['masterdec', 'time'], 0),
      getRepeatable(point, ['master', 'speed'], 0),
      getRepeatable(point, ['masterinc', 'displacement'], 1),
      getRepeatable(point, ['masterdec', 'time'], 1),
      getRepeatable(point, ['master', 'speed'], 1),
      pick(point, 'averagemaster', 'average_master', 'mean_speed'),
      pick(point, 'error'),
    ];

    rows.push(row);
    rowMeta.push({ speedDecimals });
    calibrationPoints.push((point.calibration_point_id ?? point.point_id ?? point.id)?.toString() || '');
    types.push('master');
    repeatables.push('0');
    values.push(setPoint || '0');
  });

  return { rows, rowMeta, hiddenInputs: { calibrationPoints, types, repeatables, values } };
};

/**
 * Points array from a get-observation response, or null when none is found.
 * Top-level cusset_error / unit label are copied onto each point.
 */
export const extractSUTMPoints = (observationData) => {
  const root = observationData?.data && !Array.isArray(observationData.data) ? observationData.data : observationData;
  const points = [root, observationData?.data, root?.calibration_points, root?.calibration_data, root?.points]
    .find(Array.isArray);
  if (!points) return null;

  const cussetError = root?.cusset_error ?? observationData?.cusset_error;
  const unitLabel = root?.unit_label ?? root?.unit_description;
  return points.map((point) => (point && typeof point === 'object'
    ? { ...point, cusset_error: point.cusset_error ?? cussetError, unit_label: point.unit_label ?? unitLabel }
    : point));
};

// PHP heads Set Nominal Speed / Mean Speed / Error with the first point's UUC unit description
export const getSUTMUnitLabel = (observations) => {
  const first = Array.isArray(observations) ? observations.find(Boolean) : null;
  return first ? pick(first, 'unit_label', 'unit_description', 'uuc_unit_description') : '';
};

/**
 * Table config for SUTM Observation. PHP's three header rows (Reading On Master >
 * Set 1 / Set 2 > columns) are folded into two groups for the two-level header.
 */
export const getSUTMTableConfig = (observations, unitLabel) => {
  const { rows, rowMeta, hiddenInputs } = createSUTMRows(observations);
  const label = unitLabel ?? getSUTMUnitLabel(observations);
  const suffix = label ? ` (${label})` : '';
  const setColumns = ['Displacement (mm)', 'Time (s)', 'Speed (mm/Min)'];
  return {
    id: 'observationsutm',
    name: 'Observation SUTM',
    category: 'Force',
    structure: {
      singleHeaders: ['Sr no', `Set Nominal Speed On UUC${suffix}`],
      subHeaders: {
        'Reading On Master – Set 1': setColumns,
        'Reading On Master – Set 2': setColumns,
      },
      remainingHeaders: [`Mean Speed${suffix}`, `Error${suffix}`]
    },
    staticRows: rows,
    hiddenInputs: hiddenInputs,
    rowMeta: rowMeta,
  };
};

const ObservationSUTM = () => null;
export default ObservationSUTM;
