import { safeGetValue, safeGetArray, getDecimalPlaces } from './observationUtils';

/**
 * Thermocouple Sensor Without Indicator (TSWOI) Observation
 *
 * Each calibration point renders as two rows (UUC, then Master):
 *
 *  col | UUC row                         | Master row
 *  ----+---------------------------------+--------------------------------
 *   0  | Sr. No. (rowspan 2)             | '-'
 *   1  | Set Point, read-only (rowspan 2)| '-'
 *   2  | 'UUC'                           | 'Master'
 *   3  | uucunit (unit select)           | masterunit (unit select)
 *   4  | sensitivitycoefficient          | '-'
 *  5-9 | uuc, repeatable 0-4             | master, repeatable 0-4
 *  10  | averageuuc (calculated)         | averagemaster (calculated)
 *  11  | ambientuuc                      | ambientmaster
 *  12  | saverageuuc (calculated)        | saveragemaster (calculated)
 *  13  | caverageuuc (calculated)        | caveragemaster (calculated)
 *
 * caverage = saverage / UUC sensitivity coefficient, for both rows.
 *  14  | error (calculated, rowspan 2)   | '-'
 *
 * PHP forces $mlc = $errorlc = "NA", so averages, corrected averages and the
 * deviation are not rounded to a least count.
 */

export const TSWOI_COLS = {
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

export const getTSWOIRowType = (rowData) => (rowData?.[TSWOI_COLS.VALUE_OF] === 'Master' ? 'master' : 'uuc');

/**
 * Average of the filled observations, "Average with corrected mv" (ambient + average)
 * and "Average (unit)" (corrected average / sensitivity coefficient) for one row.
 * PHP: averageavg(obs, 'average…', 'NA') and plusadd('ambient…', 'average…', 'saverage…', 'NA').
 */
const calculateRowAverages = (rowData, sensitivity) => {
  const readings = rowData
    .slice(TSWOI_COLS.OBS_START, TSWOI_COLS.OBS_END + 1)
    .map(toNumber)
    .filter((val) => !isNaN(val));

  if (!readings.length) return { average: '', correctedAverage: '', convertedAverage: '' };

  const average = readings.reduce((sum, val) => sum + val, 0) / readings.length;
  const ambient = toNumber(rowData[TSWOI_COLS.AMBIENT]);
  const corrected = average + (isNaN(ambient) ? 0 : ambient);
  return {
    average: formatUnrounded(average),
    correctedAverage: formatUnrounded(corrected),
    convertedAverage: isNaN(sensitivity) || sensitivity === 0 ? '' : formatUnrounded(corrected / sensitivity),
  };
};

/**
 * Deviation from the two "Average (unit)" values.
 * PHP substractminus: cusset error "stduuc" -> master - uuc, otherwise uuc - master.
 */
const calculateDeviation = (uucConverted, masterConverted, cussetError) => {
  const uuc = toNumber(uucConverted);
  const master = toNumber(masterConverted);
  if (isNaN(uuc) || isNaN(master)) return '';
  return formatUnrounded(cussetError === 'stduuc' ? master - uuc : uuc - master);
};

/**
 * All calculated cells of one point (both rows) at once. Both rows' "Average (unit)"
 * use the sensitivity coefficient entered on the UUC row.
 * Returns { uuc: { average, correctedAverage, convertedAverage }, master: {...}, error }.
 */
export const calculateTSWOIPoint = (uucRowData, masterRowData, cussetError) => {
  const sensitivity = toNumber(uucRowData?.[TSWOI_COLS.SENSITIVITY]);
  const uuc = calculateRowAverages(uucRowData || [], sensitivity);
  const master = calculateRowAverages(masterRowData || [], sensitivity);
  return { uuc, master, error: calculateDeviation(uuc.convertedAverage, master.convertedAverage, cussetError) };
};

/**
 * Calculation logic for one TSWOI row.
 * pairRowData is the other row of the same point (Master for a UUC row and vice versa),
 * needed because the sensitivity and deviation span both rows.
 */
export const calculateTSWOIValues = (rowData, pairRowData, cussetError) => {
  if (!rowData || !Array.isArray(rowData)) return {};

  const isUUC = getTSWOIRowType(rowData) === 'uuc';
  const calc = calculateTSWOIPoint(isUUC ? rowData : pairRowData, isUUC ? pairRowData : rowData, cussetError);
  return { ...(isUUC ? calc.uuc : calc.master), error: calc.error };
};

/**
 * Summary-table type and repeatable for a cell, matching the PHP hidden inputs.
 * Returns null for cells that are not saved.
 */
export const getTSWOIFieldType = (rowType, colIndex) => {
  const isUUC = rowType === 'uuc';

  if (colIndex >= TSWOI_COLS.OBS_START && colIndex <= TSWOI_COLS.OBS_END) {
    return { type: isUUC ? 'uuc' : 'master', repeatable: String(colIndex - TSWOI_COLS.OBS_START) };
  }

  const uucTypes = {
    [TSWOI_COLS.SET_POINT]: 'setpoint',
    [TSWOI_COLS.UNIT]: 'uucunit',
    [TSWOI_COLS.SENSITIVITY]: 'sensitivitycoefficient',
    [TSWOI_COLS.AVERAGE]: 'averageuuc',
    [TSWOI_COLS.AMBIENT]: 'ambientuuc',
    [TSWOI_COLS.CORRECTED_AVERAGE]: 'saverageuuc',
    [TSWOI_COLS.CONVERTED_AVERAGE]: 'caverageuuc',
    [TSWOI_COLS.DEVIATION]: 'error',
  };
  const masterTypes = {
    [TSWOI_COLS.UNIT]: 'masterunit',
    [TSWOI_COLS.AVERAGE]: 'averagemaster',
    [TSWOI_COLS.AMBIENT]: 'ambientmaster',
    [TSWOI_COLS.CORRECTED_AVERAGE]: 'saveragemaster',
    [TSWOI_COLS.CONVERTED_AVERAGE]: 'caveragemaster',
  };

  const type = (isUUC ? uucTypes : masterTypes)[colIndex];
  return type ? { type, repeatable: '0' } : null;
};

/**
 * Cells the user types into. Set Point, all averages and the deviation are
 * calculated (read-only); the unit column is a select.
 */
export const isTSWOICellEditable = (rowType, colIndex) => {
  if (colIndex === TSWOI_COLS.UNIT) return true;
  if (colIndex >= TSWOI_COLS.OBS_START && colIndex <= TSWOI_COLS.OBS_END) return true;
  if (colIndex === TSWOI_COLS.AMBIENT) return true;
  return rowType === 'uuc' && colIndex === TSWOI_COLS.SENSITIVITY;
};

/**
 * Submit-time validation for one row: PHP marks every editable numeric input
 * "required,number". There is no least-count check, and the unit selects are
 * not validated (PHP's attribute is misspelled "data-bvaliddator").
 * Read-only calculated cells are skipped; they are filled once their inputs are.
 */
export const validateTSWOIRow = (rowData, rowIndex) => {
  const errors = {};
  const rowType = getTSWOIRowType(rowData);

  rowData.forEach((cell, colIndex) => {
    if (colIndex === TSWOI_COLS.UNIT || !isTSWOICellEditable(rowType, colIndex)) return;

    const key = `${rowIndex}-${colIndex}`;
    if (isBlank(cell)) {
      errors[key] = 'This field is required';
    } else if (isNaN(toNumber(cell))) {
      errors[key] = 'Please enter a valid number';
    } else if (colIndex === TSWOI_COLS.SENSITIVITY && toNumber(cell) === 0) {
      // Average (unit) is divided by it
      errors[key] = 'Sensitivity coefficient cannot be 0';
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

// Readings come either as an array (uuc.observations) or flat keys (uuc0..uuc4 / master0..master4)
const getReadings = (side, point, flatPrefix) => {
  if (side?.observations || side?.readings || side?.values) {
    return safeGetArray(side.observations ?? side.readings ?? side.values, OBS_COUNT).slice(0, OBS_COUNT);
  }
  const flatArray = point?.[`${flatPrefix}_values`] ?? point?.[`${flatPrefix}_readings`];
  if (flatArray) return safeGetArray(flatArray, OBS_COUNT).slice(0, OBS_COUNT);
  return Array.from({ length: OBS_COUNT }, (_, i) => safeGetValue(point?.[`${flatPrefix}${i}`]));
};

// PHP shows the set point with the UUC matrix least count's decimals when numeric
const formatSetPoint = (setPoint, leastCount) => {
  const num = toNumber(setPoint);
  if (isNaN(num) || isBlank(leastCount) || leastCount === 'NA') return setPoint;
  return num.toFixed(getDecimalPlaces(leastCount));
};

/**
 * Row generator for TSWOI Observation.
 * Accepts points shaped either as
 *   { calibration_point_id, set_point, uuc: { unit, sensitivity_coefficient, observations, average,
 *     ambient_mv, corrected_average, converted_average }, master: {...}, error }
 * or flat, keyed by the PHP summary types (setpoint, uucunit, uuc0..uuc4, averageuuc, …).
 */
export const createTSWOIRows = (dataArray) => {
  const rows = [];
  const calibrationPoints = [];
  const types = [];
  const repeatables = [];
  const values = [];

  (Array.isArray(dataArray) ? dataArray : []).forEach((point, index) => {
    if (!point) return;

    const uuc = point.uuc && typeof point.uuc === 'object' && !Array.isArray(point.uuc) ? point.uuc : {};
    const master = point.master && typeof point.master === 'object' && !Array.isArray(point.master) ? point.master : {};

    const pointId = (point.calibration_point_id ?? point.point_id ?? point.id)?.toString() || '';
    const srNo = pick(point, 'sr_no', 'sequence_number') || String(index + 1);
    const setPoint = formatSetPoint(
      pick(point, 'set_point', 'setpoint', 'point'),
      point.leastcount ?? point.least_count
    );

    const uucRow = [
      srNo,
      setPoint,
      'UUC',
      pick(uuc, 'unit_id', 'unit') || pick(point, 'uucunit'),
      pick(uuc, 'sensitivity_coefficient', 'sensitivitycoefficient') || pick(point, 'sensitivitycoefficient', 'sensitivity_coefficient'),
      ...getReadings(uuc, point, 'uuc'),
      pick(uuc, 'average') || pick(point, 'averageuuc', 'average_uuc'),
      pick(uuc, 'ambient_mv', 'ambient') || pick(point, 'ambientuuc', 'ambient_uuc'),
      pick(uuc, 's_average', 'saverage') || pick(point, 'saverageuuc', 's_average_uuc'),
      pick(uuc, 'corrected_average', 'converted_average', 'c_average') || pick(point, 'caverageuuc', 'c_average_uuc'),
      pick(point, 'error', 'deviation'),
    ];

    const masterRow = [
      '-',
      '-',
      'Master',
      pick(master, 'unit_id', 'unit') || pick(point, 'masterunit'),
      '-',
      ...getReadings(master, point, 'master'),
      pick(master, 'average') || pick(point, 'averagemaster', 'average_master'),
      pick(master, 'ambient_mv', 'ambient') || pick(point, 'ambientmaster', 'ambient_master'),
      pick(master, 's_average', 'saverage') || pick(point, 'saveragemaster', 's_average_master'),
      pick(master, 'corrected_average', 'converted_average', 'c_average') || pick(point, 'caveragemaster', 'c_average_master'),
      '-',
    ];

    // Calculated cells are read-only, so show them recalculated from the readings:
    // the API doesn't return "Average with corrected mv", and older records hold a
    // hand-typed Average (unit) / deviation. Stored values are kept only when
    // nothing can be calculated.
    const calc = calculateTSWOIPoint(uucRow, masterRow, point.cusset_error);
    const useCalculated = (row, col, val) => { if (!isBlank(val)) row[col] = val; };
    useCalculated(uucRow, TSWOI_COLS.AVERAGE, calc.uuc.average);
    useCalculated(uucRow, TSWOI_COLS.CORRECTED_AVERAGE, calc.uuc.correctedAverage);
    useCalculated(masterRow, TSWOI_COLS.AVERAGE, calc.master.average);
    useCalculated(masterRow, TSWOI_COLS.CORRECTED_AVERAGE, calc.master.correctedAverage);
    useCalculated(uucRow, TSWOI_COLS.CONVERTED_AVERAGE, calc.uuc.convertedAverage);
    useCalculated(masterRow, TSWOI_COLS.CONVERTED_AVERAGE, calc.master.convertedAverage);
    useCalculated(uucRow, TSWOI_COLS.DEVIATION, calc.error);

    [uucRow, masterRow].forEach((row, rowOffset) => {
      rows.push(row);
      calibrationPoints.push(pointId);
      types.push(rowOffset === 0 ? 'uuc' : 'master');
      repeatables.push('0');
      values.push(setPoint || '0');
    });
  });

  return { rows, hiddenInputs: { calibrationPoints, types, repeatables, values } };
};

/**
 * Points array from a get-observation response, or null when none is found.
 * Top-level cusset_error / unit label are copied onto each point, since the
 * calculations and headers read them per point.
 */
export const extractTSWOIPoints = (observationData) => {
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
export const getTSWOIUnitLabel = (observations) => {
  const first = Array.isArray(observations) ? observations.find(Boolean) : null;
  if (!first) return '';
  return pick(first, 'unit_label', 'set_point_unit', 'unit_description')
    || safeGetValue(first.unit?.description)
    || pick(first.uuc && typeof first.uuc === 'object' ? first.uuc : {}, 'unit_description');
};

/**
 * Table config for TSWOI Observation.
 * unitLabel is the UUC unit description of the first calibration point, shown in the
 * Set Point / Average / Deviation headers as in PHP.
 */
export const getTSWOITableConfig = (observations, unitLabel) => {
  const { rows, hiddenInputs } = createTSWOIRows(observations);
  const label = unitLabel ?? getTSWOIUnitLabel(observations);
  const suffix = label ? ` (${label})` : '';
  return {
    id: 'observationtswoi',
    name: 'Observation TSWOI',
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
    // Columns merged across a point's UUC and Master rows in PHP (rowspan="2")
    rowSpanColumns: [TSWOI_COLS.SR_NO, TSWOI_COLS.SET_POINT, TSWOI_COLS.DEVIATION],
    unitColumnIndex: TSWOI_COLS.UNIT,
  };
};

const ObservationTSWOI = () => null;
export default ObservationTSWOI;
