import { safeGetValue, safeGetArray } from './observationUtils';

/**
 * RHT Observation
 *
 * Single row per calibration point.
 *
 *  col | Field
 *  ----+--------------------------------
 *   0  | Sr. No.
 *   1  | Nominal/ Set Value (master)
 *   2  | Unit
 *  3-7 | Observation on UUC (uuc 0-4)
 *   8  | Average (averageuuc)
 *   9  | Error (error)
 */

export const RHT_COLS = {
  SR_NO: 0,
  MASTER: 1,
  UNIT: 2,
  OBS_START: 3,
  OBS_END: 7,
  AVERAGE: 8,
  ERROR: 9,
};

const OBS_COUNT = 5;

const isBlank = (val) => val === undefined || val === null || String(val).trim() === '';
const toNumber = (val) => (isBlank(val) ? NaN : Number(String(val).trim()));

// Unrounded like PHP's 'NA' precision
const formatUnrounded = (num) => (Number.isFinite(num) ? String(Number(num.toFixed(10))) : '');

export const getRHTRowType = () => 'uuc'; // Single row structure

const mean = (rowData) => {
  const readings = rowData
    .slice(RHT_COLS.OBS_START, RHT_COLS.OBS_END + 1)
    .map(toNumber)
    .filter((val) => !isNaN(val));
  return readings.length ? readings.reduce((sum, val) => sum + val, 0) / readings.length : NaN;
};

/**
 * Calculates average and error for the single row.
 * PHP: averageavg(uu0c...uu4c, averageuuc, 'NA');
 * PHP: substractminus(master, averageuuc, error, 'NA') or reversed for stduuc
 */
export const calculateRHTValues = (rowData, _, __, cussetError) => {
  if (!rowData || !Array.isArray(rowData)) return {};

  const uucMean = mean(rowData);
  const average = formatUnrounded(uucMean);

  const master = toNumber(rowData[RHT_COLS.MASTER]);
  let error = '';

  if (!isNaN(uucMean) && !isNaN(master)) {
    const errorNum = cussetError === 'stduuc' ? master - uucMean : uucMean - master;
    error = formatUnrounded(errorNum);
  }

  return { average, error };
};

export const getRHTFieldType = (rowType, colIndex) => {
  if (colIndex === RHT_COLS.MASTER) return { type: 'master', repeatable: '0' };
  if (colIndex >= RHT_COLS.OBS_START && colIndex <= RHT_COLS.OBS_END) {
    return { type: 'uuc', repeatable: String(colIndex - RHT_COLS.OBS_START) };
  }
  if (colIndex === RHT_COLS.AVERAGE) return { type: 'averageuuc', repeatable: '0' };
  if (colIndex === RHT_COLS.ERROR) return { type: 'error', repeatable: '0' };
  return null;
};

export const isRHTCellEditable = (rowType, colIndex) => {
  return colIndex >= RHT_COLS.OBS_START && colIndex <= RHT_COLS.OBS_END;
};

// PHP enforces inleastcount/divisibleby on UUC readings against matrix leastcount
export const getRHTReadingLeastCount = (rowMeta) => {
  return rowMeta?.leastCount || null;
};

export const validateRHTRow = (rowData, rowIndex) => {
  const errors = {};
  rowData.forEach((cell, colIndex) => {
    if (!isRHTCellEditable(null, colIndex)) return;
    const key = `${rowIndex}-${colIndex}`;
    if (isBlank(cell)) {
      errors[key] = 'This field is required';
      return;
    }
    if (isNaN(toNumber(cell))) {
      errors[key] = 'Please enter a valid number';
      return;
    }
  });
  return errors;
};

const pick = (obj, ...keys) => {
  for (const key of keys) {
    const val = safeGetValue(obj?.[key]);
    if (val !== '') return val;
  }
  return '';
};

const asObject = (val) => (val && typeof val === 'object' && !Array.isArray(val) ? val : {});

const getReadings = (side, point, flatPrefix) => {
  if (side?.observations || side?.readings || side?.values) {
    return safeGetArray(side.observations ?? side.readings ?? side.values, OBS_COUNT).slice(0, OBS_COUNT);
  }
  const flatArray = point?.[`${flatPrefix}_values`] ?? point?.[`${flatPrefix}_readings`];
  if (flatArray) return safeGetArray(flatArray, OBS_COUNT).slice(0, OBS_COUNT);
  return Array.from({ length: OBS_COUNT }, (_, i) => safeGetValue(point?.[`${flatPrefix}${i}`]));
};

/**
 * Row generator for RHT Observation.
 */
export const createRHTRows = (dataArray) => {
  const rows = [];
  const rowMeta = [];
  const calibrationPoints = [];
  const types = [];
  const repeatables = [];
  const values = [];

  (Array.isArray(dataArray) ? dataArray : []).forEach((point, index) => {
    if (!point) return;

    const uuc = asObject(point.uuc);
    const pointId = (point.calibration_point_id ?? point.point_id ?? point.id)?.toString() || '';

    // In PHP, "master" holds the nominal/set value. If missing, defaults to $rowcalibpoint['point']
    const masterVal = pick(point, 'master', 'master_value', 'master_0') || pick(point, 'point', 'set_point', 'setpoint', 'nominal_value');

    const leastCount = pick(point, 'leastcount', 'least_count', 'least_count_uuc') || pick(uuc, 'least_count', 'leastcount');
    const meta = { leastCount: isBlank(leastCount) || String(leastCount).trim().toUpperCase() === 'NA' ? null : String(leastCount).trim() };

    const row = [
      pick(point, 'sr_no', 'sequence_number') || String(index + 1),
      masterVal,
      pick(point, 'unit_description', 'unit_label', 'unit_name', 'unit') || pick(uuc, 'unit_description', 'unit_id'),
      ...getReadings(uuc, point, 'uuc'),
      pick(point, 'averageuuc', 'average_uuc') || pick(uuc, 'average'),
      pick(point, 'error', 'deviation'),
    ];

    rows.push(row);
    rowMeta.push(meta);

    // Fallback hidden inputs to ensure data makes it to PHP if cells aren't rendered as inputs
    ['master', 'uuc', 'uuc', 'uuc', 'uuc', 'uuc', 'averageuuc', 'error'].forEach((type, colOffset) => {
      let repeatable = '0';
      if (type === 'uuc') repeatable = String(colOffset - 1);

      let cellVal = '';
      if (type === 'master') cellVal = row[RHT_COLS.MASTER];
      else if (type === 'uuc') cellVal = row[RHT_COLS.OBS_START + Number(repeatable)];
      else if (type === 'averageuuc') cellVal = row[RHT_COLS.AVERAGE];
      else if (type === 'error') cellVal = row[RHT_COLS.ERROR];

      calibrationPoints.push(pointId);
      types.push(type);
      repeatables.push(repeatable);
      values.push(cellVal || '');
    });
  });

  return { rows, rowMeta, hiddenInputs: { calibrationPoints, types, repeatables, values } };
};

export const extractRHTPoints = (observationData) => {
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

export const getRHTTableConfig = (observations) => {
  const { rows, rowMeta, hiddenInputs } = createRHTRows(observations);
  return {
    id: 'observationrht',
    name: 'Observation RHT',
    category: 'Humidity',
    structure: {
      singleHeaders: ['Sr. No.', 'Nominal/ Set Value', 'Unit'],
      subHeaders: {
        'Observation on UUC': ['Observation 1', 'Observation 2', 'Observation 3', 'Observation 4', 'Observation 5'],
      },
      remainingHeaders: ['Average', 'Error'],
    },
    staticRows: rows,
    hiddenInputs: hiddenInputs,
    rowMeta: rowMeta,
  };
};

const ObservationRHT = () => null;
export default ObservationRHT;
