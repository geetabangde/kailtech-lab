import { safeGetValue, safeGetArray, getDecimalPlaces } from './observationUtils';

export const SW_COLS = {
  SR_NO: 0,
  SET_POINT: 1,
  VALUE_OF: 2,
  OBS_START: 3,
  OBS_END: 7,
  AVERAGE: 8,
  ERROR: 9,
  UNCERTAINTY: 10,
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

const isNA = (val) => String(val ?? '').trim().toUpperCase() === 'NA';

// Decimal places of a least count, or null when it is "NA"/missing (no rounding)
const lcDecimals = (leastCount) => {
  if (isBlank(leastCount) || isNA(leastCount)) return null;
  return getDecimalPlaces(String(leastCount).trim());
};

const toDecimalCount = (val) => {
  const n = parseInt(val, 10);
  return Number.isInteger(n) && n >= 0 && n <= 20 ? n : null;
};

const usableLeastCount = (lc) => {
  if (isBlank(lc) || isNA(lc)) return null;
  const num = parseFloat(lc);
  return !isNaN(num) && num > 0 ? String(lc).trim() : null;
};

export const getSWRowType = (rowData) => (rowData?.[SW_COLS.VALUE_OF] === 'Master' ? 'master' : 'uuc');

export const isSWReadingColumn = (colIndex) => colIndex >= SW_COLS.OBS_START && colIndex <= SW_COLS.OBS_END;

/**
 * Average of a row's filled readings, rounded to that side's decimals
 * (PHP averageavg with $lc for UUC, $mlc for master).
 */
export const calculateSWAverage = (rowData, meta) => {
  const readings = (rowData || [])
    .slice(SW_COLS.OBS_START, SW_COLS.OBS_END + 1)
    .map(toNumber)
    .filter((val) => !isNaN(val));
  if (!readings.length) return '';
  const decimals = getSWRowType(rowData) === 'uuc' ? meta?.uucDecimals : meta?.masterDecimals;
  return formatDecimals(readings.reduce((sum, val) => sum + val, 0) / readings.length, decimals);
};

/**
 * Error from the two averages (PHP substractminus with $errorlc):
 * cusset error "stduuc" -> master - uuc, otherwise uuc - master.
 */
export const calculateSWError = (uucAverage, masterAverage, meta, cussetError) => {
  const uuc = toNumber(uucAverage);
  const master = toNumber(masterAverage);
  if (isNaN(uuc) || isNaN(master)) return '';
  return formatDecimals(cussetError === 'stduuc' ? master - uuc : uuc - master, meta?.errorDecimals);
};

/**
 * Summary-table type and repeatable for a cell, matching the PHP hidden inputs.
 * Returns null for cells that are not saved.
 */
export const getSWFieldType = (rowType, colIndex) => {
  const isUUC = rowType === 'uuc';

  if (isSWReadingColumn(colIndex)) {
    return { type: isUUC ? 'uuc' : 'master', repeatable: String(colIndex - SW_COLS.OBS_START) };
  }

  const uucTypes = {
    [SW_COLS.SET_POINT]: 'setpoint',
    [SW_COLS.AVERAGE]: 'averageuuc',
    [SW_COLS.ERROR]: 'error',
    [SW_COLS.UNCERTAINTY]: 'uncertainty',
  };
  const masterTypes = {
    [SW_COLS.AVERAGE]: 'averagemaster',
  };

  const type = (isUUC ? uucTypes : masterTypes)[colIndex];
  return type ? { type, repeatable: '0' } : null;
};

// Every saved cell except the read-only set point is editable in PHP
export const isSWCellEditable = (rowType, colIndex) => (
  colIndex !== SW_COLS.SET_POINT && getSWFieldType(rowType, colIndex) !== null
);

/**
 * Least count a reading is checked against (PHP inleastcount/divisibleby):
 * the UUC least count on the UUC row, the master least count on the Master row.
 */
export const getSWReadingLeastCount = (rowType, colIndex, meta) => {
  if (!isSWReadingColumn(colIndex)) return null;
  return usableLeastCount(rowType === 'uuc' ? meta?.leastCount : meta?.masterLeastCount);
};

/**
 * Submit-time validation for one row. PHP: every editable input is "required";
 * readings are also least-count checked (master readings are type="number").
 * validateLeastCount is CalibrateStep3's shared (value, leastCount) => { isValid, error }.
 */
export const validateSWRow = (rowData, rowIndex, meta, validateLeastCount) => {
  const errors = {};
  const rowType = getSWRowType(rowData);

  rowData.forEach((cell, colIndex) => {
    if (!isSWCellEditable(rowType, colIndex)) return;

    const key = `${rowIndex}-${colIndex}`;
    if (isBlank(cell)) {
      errors[key] = 'This field is required';
      return;
    }
    if (!isSWReadingColumn(colIndex)) return;

    if (isNaN(toNumber(cell))) {
      errors[key] = 'Please enter a valid number';
      return;
    }
    const leastCount = getSWReadingLeastCount(rowType, colIndex, meta);
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

// Readings as an array (uuc_values / uuc.observations) or flat keys (uuc0..uuc4 or uuc_1..uuc_5)
const getReadings = (side, point, prefix) => {
  if (side?.observations || side?.readings || side?.values) {
    return safeGetArray(side.observations ?? side.readings ?? side.values, OBS_COUNT).slice(0, OBS_COUNT);
  }
  const flatArray = point?.[`${prefix}_values`] ?? point?.[`${prefix}_readings`];
  if (flatArray) return safeGetArray(flatArray, OBS_COUNT).slice(0, OBS_COUNT);
  return Array.from({ length: OBS_COUNT }, (_, i) => (
    safeGetValue(point?.[`${prefix}${i}`]) || safeGetValue(point?.[`${prefix}_${i + 1}`])
  ));
};

/**
 * Per-point rounding / validation info:
 *  leastCount        UUC least count the UUC readings are validated against
 *  masterLeastCount  master least count the master readings are validated against
 *  uucDecimals       decimals of averageuuc (PHP $lc; null = unrounded)
 *  masterDecimals    decimals of averagemaster (PHP $mlc; null = unrounded)
 *  errorDecimals     decimals of the error (PHP $errorlc; null = unrounded)
 */
const getPointMeta = (point) => {
  const leastCount = pick(point, 'leastcount', 'least_count', 'least_count_uuc');
  const masterLeastCount = pick(point, 'masterleastcount', 'master_leastcount', 'master_least_count', 'least_count_master');

  const masterDecimals = toDecimalCount(pick(point, 'mlc', 'master_decimals', 'average_master_decimals')) ?? lcDecimals(masterLeastCount);
  // With a unit conversion PHP sets $lc = $mlc; the API can send the resolved value as lc
  const uucDecimals = toDecimalCount(pick(point, 'lc', 'uuc_decimals', 'average_decimals', 'average_uuc_decimals')) ?? lcDecimals(leastCount);
  const derivedErrorDecimals = uucDecimals === null || masterDecimals === null
    ? null
    : Math.max(uucDecimals, masterDecimals);

  return {
    leastCount: leastCount || null,
    masterLeastCount: masterLeastCount || null,
    uucDecimals,
    masterDecimals,
    errorDecimals: toDecimalCount(pick(point, 'errorlc', 'error_decimals')) ?? derivedErrorDecimals,
  };
};

/**
 * Row generator for SW Observation. Accepts the get-observation point shape used by
 * the raw data view (setpoint, uuc_values / uuc_1..uuc_5, average_uuc, master_values /
 * master_1..master_5, average_master, error, uncertainty, leastcount, masterleastcount),
 * nested uuc/master objects, or flat PHP type keys (uuc0..uuc4, averageuuc, …).
 */
export const createSWRows = (dataArray) => {
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

    const pointId = (point.calibrationpoint_id ?? point.calibration_point_id ?? point.point_id ?? point.id)?.toString() || '';
    const srNo = pick(point, 'sr_no', 'sequence_number') || String(index + 1);
    // PHP shows the raw point, unformatted
    const setPoint = pick(point, 'setpoint', 'set_point', 'testpoint', 'point');

    const uucRow = [
      srNo,
      setPoint,
      'UUC',
      ...getReadings(uuc, point, 'uuc'),
      pick(uuc, 'average') || pick(point, 'averageuuc', 'average_uuc'),
      pick(point, 'error'),
      pick(point, 'uncertainty'),
    ];

    const masterRow = [
      '-',
      '-',
      'Master',
      ...getReadings(master, point, 'master'),
      pick(master, 'average') || pick(point, 'averagemaster', 'average_master'),
      '-',
      '-',
    ];

    [uucRow, masterRow].forEach((row, rowOffset) => {
      rows.push(row);
      rowMeta.push(meta);
      
      calibrationPoints.push(pointId);
      // Use 'setpoint' for UUC row fallback, and 'dummy' for Master row fallback 
      // so we don't accidentally overwrite 'uuc0' or 'master0' in the PHP backend.
      types.push(rowOffset === 0 ? 'setpoint' : 'dummy');
      repeatables.push('0');
      values.push(rowOffset === 0 ? (setPoint || '0') : '0');
    });
  });

  return { rows, rowMeta, hiddenInputs: { calibrationPoints, types, repeatables, values } };
};

/**
 * Points array from a get-observation response, or null when none is found.
 * A top-level cusset_error is copied onto each point.
 */
export const extractSWPoints = (observationData) => {
  const root = observationData?.data && !Array.isArray(observationData.data) ? observationData.data : observationData;
  const points = [root, observationData?.data, root?.calibration_points, root?.calibration_data, root?.points]
    .find(Array.isArray);
  if (!points) return null;

  const cussetError = root?.cusset_error ?? observationData?.cusset_error;
  return points.map((point) => (point && typeof point === 'object'
    ? { ...point, cusset_error: point.cusset_error ?? cussetError }
    : point));
};

/**
 * Table config for SW Observation.
 */
export const getSWTableConfig = (observations) => {
  const { rows, rowMeta, hiddenInputs } = createSWRows(observations);
  return {
    id: 'observationsw',
    name: 'Observation SW',
    category: 'Stop Watch',
    structure: {
      singleHeaders: ['Sr. No.', 'Nominal/ Set Value', 'Value Of'],
      subHeaders: {
        'Observation': ['1', '2', '3', '4', '5']
      },
      remainingHeaders: ['Average', 'Error', 'Uncertainty']
    },
    staticRows: rows,
    hiddenInputs: hiddenInputs,
    rowMeta: rowMeta,
    // Columns merged across a point's UUC and Master rows in PHP (rowspan="2")
    rowSpanColumns: [SW_COLS.SR_NO, SW_COLS.SET_POINT, SW_COLS.ERROR, SW_COLS.UNCERTAINTY],
  };
};

const ObservationSW = () => null;
export default ObservationSW;
