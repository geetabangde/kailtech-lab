/**
 * Calculation logic for Universal Calibrator (UC) Observation
 */
export const calculateUCValues = (rowData, rowIndex, observations) => {
  const result = {};
  if (!rowData || !Array.isArray(rowData)) return result;

  const allPoints = [
    ...(observations || []).filter(p => p && (p.mode || '').toLowerCase() === 'measure'),
    ...(observations || []).filter(p => p && (p.mode || '').toLowerCase() === 'source')
  ];
  const point = allPoints[rowIndex];
  const isMeasure = (point?.mode || '').toLowerCase() === 'measure';

  // PHP rounds average to the observed side's LC decimals and error to max(lc, mlc);
  // the API sends both. Fall back to 4 when absent.
  const averageDecimals = toDecimals(point?.average_decimals);
  const errorDecimals = toDecimals(point?.error_decimals);

  const parsedValues = rowData.map((val) => (val === '' || val === null || val === undefined ? NaN : parseFloat(val)));
  const obsValues = parsedValues.slice(5, 10).filter((val, idx) => {
    return rowData[idx + 5] !== '' && !isNaN(val);
  });
  result.average = obsValues.length
    ? (obsValues.reduce((sum, val) => sum + val, 0) / obsValues.length).toFixed(averageDecimals)
    : '';

  const referenceVal = parsedValues[4];

  if (result.average !== '' && !isNaN(referenceVal)) {
    const averageVal = parseFloat(result.average);
    const averageFirst = isAverageMinuend(point, isMeasure);
    const error = averageFirst ? averageVal - referenceVal : referenceVal - averageVal;
    result.error = error.toFixed(errorDecimals);
  }

  return result;
};

const toDecimals = (value) => {
  const n = parseInt(value, 10);
  return Number.isInteger(n) && n >= 0 && n <= 20 ? n : 4;
};

/**
 * Whether error = average - reference (vs reference - average).
 * Mirrors PHP substractminus: cusset "stduuc" is master minus UUC, otherwise UUC minus master.
 * Measure: UUC is the average, master is the reference. Source: the reverse.
 */
const isAverageMinuend = (point, isMeasure) => {
  const minuend = point?.error_formula?.minuend;
  if (typeof minuend === 'string' && minuend) {
    return minuend.toLowerCase().startsWith('average');
  }
  const stdMinusUuc = point?.cusset_error === 'stduuc';
  return isMeasure ? !stdMinusUuc : stdMinusUuc;
};

// Re-round a saved average/error to the API's decimals; leave blanks and non-numbers as-is
const formatStored = (value, decimals) => {
  if (value === '' || value === null || value === undefined) return '';
  const num = Number(value);
  if (isNaN(num) || decimals === undefined || decimals === null || decimals === '') return value;
  return num.toFixed(toDecimals(decimals));
};

/**
 * Row generator for UC Observation
 */
export const createUCRows = (dataArray) => {
  const allRows = [];
  const allCalibrationPoints = [];
  const allTypes = [];
  const allRepeatables = [];
  const allValues = [];

  const modes = [];
  const measurePoints = (dataArray || []).filter(p => p && (p.mode || '').toLowerCase() === 'measure');
  const sourcePoints = (dataArray || []).filter(p => p && (p.mode || '').toLowerCase() === 'source');

  if (measurePoints.length > 0) {
    modes.push({ mode: 'Measure', calibration_points: measurePoints });
  }
  if (sourcePoints.length > 0) {
    modes.push({ mode: 'Source', calibration_points: sourcePoints });
  }

  const processPoints = (points) => {
    points.forEach((point) => {
      if (!point) return;

      const isMeasure = (point.mode || '').toLowerCase() === 'measure';

      const observations = [];
      const multiReadings = isMeasure
        ? (point.uuc_observations || point.uuc_values || point.observations || point.uuc_readings || [])
        : (point.master_observations || point.master_values || point.observations || point.master_readings || []);

      for (let i = 0; i < 5; i++) {
        observations.push(multiReadings[i]?.value ?? multiReadings[i] ?? '');
      }
      while (observations.length < 5) {
        observations.push('');
      }

      const average = formatStored(
        isMeasure
          ? (point.averageuuc || point.average_uuc || '')
          : (point.averagemaster || point.average_master || ''),
        point.average_decimals
      );

      const singleCalculated = isMeasure
        ? (point.calculatedmaster || point.calculated_master || point.nominal_values?.calculated_master?.value || point.nominal_set_value_on_master_calculated || '')
        : (point.calculateduuc || point.calculated_uuc || point.nominal_values?.calculated_uuc?.value || point.nominal_set_value_on_uuc_calculated || '');

      const singleReference = isMeasure
        ? (point.master_value || point.master || point.nominal_values?.master?.value || point.point || '')
        : (point.uuc_value || point.uuc || point.nominal_values?.uuc?.value || point.point || '');

      const row = [
        point.sequence_number?.toString() || point.sr_no?.toString() || (allRows.length + 1).toString(),
        point.unit_type || point.unittype || point.parameter || '',
        point.range || '',
        singleCalculated,
        singleReference,
        ...observations,
        average,
        formatStored(point.error || '', point.error_decimals)
      ];

      allRows.push(row);
      allCalibrationPoints.push(point.calibration_point_id?.toString() || point.point_id?.toString() || point.id?.toString() || (allRows.length).toString());
      allTypes.push('input');
      allRepeatables.push('5');
      allValues.push(singleReference || '0');
    });
  };

  if (measurePoints.length > 0) processPoints(measurePoints);
  if (sourcePoints.length > 0) processPoints(sourcePoints);

  return {
    rows: allRows,
    hiddenInputs: {
      calibrationPoints: allCalibrationPoints,
      types: allTypes,
      repeatables: allRepeatables,
      values: allValues
    },
    modes: modes
  };
};

/**
 * Table config for UC Observation
 */
export const getUCTableConfig = (observations) => {
  const { rows, hiddenInputs, modes } = createUCRows(observations);
  return {
    id: 'observationuc',
    name: 'Observation UC',
    category: 'Uncertainty',
    structure: {
      singleHeaders: ['Sr. No.', 'Unit Type', 'Range', 'Nominal/ Set Value (Calculated)', 'Nominal/ Set Value'],
      subHeaders: {
        'Observation': ['Observation 1', 'Observation 2', 'Observation 3', 'Observation 4', 'Observation 5']
      },
      remainingHeaders: ['Average', 'Error']
    },
    staticRows: rows,
    hiddenInputs: hiddenInputs,
    modes: modes
  };
};

const ObservationUC = () => null;
export default ObservationUC;
