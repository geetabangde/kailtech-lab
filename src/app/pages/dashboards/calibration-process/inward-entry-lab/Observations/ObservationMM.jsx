const countDecimals = (val) => {
  const s = String(val ?? '').trim();
  if (/e-/i.test(s)) return parseInt(s.split(/e-/i)[1], 10) || 0;
  return s.includes('.') ? s.split('.')[1].length : 0;
};

// Rounds to the nearest multiple of the least count (half-to-even, same as formatValueByLc)
const roundToLeastCount = (value, leastCount, decimals) => {
  const lc = parseFloat(leastCount);
  if (isNaN(lc) || lc <= 0) return value.toFixed(decimals);

  const factor = Math.pow(10, decimals);
  const quotient = Math.round((value / lc) * factor) / factor; // strip float noise before flooring
  const floored = Math.floor(quotient);
  const remainder = quotient - floored;
  let rounded;
  if (remainder < 0.5) rounded = floored;
  else if (remainder > 0.5) rounded = floored + 1;
  else rounded = floored % 2 === 0 ? floored : floored + 1;

  return (rounded * lc).toFixed(decimals);
};

/**
 * Calculation logic for Multimeter (MM) Observation
 * Average and error are reported to the least count the observations are entered in.
 */
export const calculateMMValues = (rowData, leastCount) => {
  const result = {};
  if (!rowData || !Array.isArray(rowData)) return result;

  const parsedValues = rowData.map((val) => (val === '' || val === null || val === undefined ? 0 : parseFloat(val) || 0));
  const rawObservations = rowData.slice(5, 10).filter((val, i) => parsedValues[5 + i] !== 0);
  const observations = parsedValues.slice(5, 10).filter((val) => val !== 0);

  // No least count loaded -> use the resolution the observations were typed in
  const hasLc = leastCount !== undefined && leastCount !== null && leastCount !== '' && leastCount !== 'NA'
    && !isNaN(parseFloat(leastCount)) && parseFloat(leastCount) > 0;
  const decimals = hasLc
    ? countDecimals(leastCount)
    : Math.max(0, ...rawObservations.map(countDecimals));
  const lc = hasLc ? leastCount : Math.pow(10, -decimals);

  result.average = observations.length
    ? roundToLeastCount(observations.reduce((sum, val) => sum + val, 0) / observations.length, lc, decimals)
    : '';
  const nominalValue = parsedValues[4];
  result.error = result.average && nominalValue
    ? (parseFloat(result.average) - nominalValue).toFixed(decimals).replace(/^-(0\.?0*)$/, '$1')
    : '';

  return result;
};

/**
 * Row generator for MM Observation
 */
export const createMMRows = (dataArray) => {
  const allRows = [];
  const allCalibrationPoints = [];
  const allTypes = [];
  const allRepeatables = [];
  const allValues = [];
  const unitTypes = [];

  (dataArray || []).forEach((unitTypeGroup) => {
    if (!unitTypeGroup || !unitTypeGroup.calibration_points) return;

    unitTypes.push(unitTypeGroup);

    unitTypeGroup.calibration_points.forEach((point, pointIndex) => {
      if (!point) return;

      const observations = [];
      if (point.observations && Array.isArray(point.observations)) {
        for (let i = 0; i < 5; i++) {
          observations.push(point.observations[i]?.value || '');
        }
      }

      while (observations.length < 5) {
        observations.push('');
      }

      const row = [
        point.sequence_number?.toString() || (pointIndex + 1).toString(),
        point.mode || 'Measure',
        point.range || '',
        (point.nominal_values?.calculated_master?.value || '') +
        (point.nominal_values?.calculated_master?.unit ? ' ' + point.nominal_values.calculated_master.unit : ''),
        (point.nominal_values?.master?.value || '') +
        (point.nominal_values?.master?.unit ? ' ' + point.nominal_values.master.unit : ''),
        ...observations,
        point.calculations?.average || '',
        point.calculations?.error || ''
      ];

      allRows.push(row);
      allCalibrationPoints.push(point.point_id?.toString() || (allRows.length).toString());
      allTypes.push('input');
      allRepeatables.push('1');
      allValues.push(point.nominal_values?.master?.value || "0");
    });
  });

  return {
    rows: allRows,
    hiddenInputs: {
      calibrationPoints: allCalibrationPoints,
      types: allTypes,
      repeatables: allRepeatables,
      values: allValues
    },
    unitTypes: unitTypes
  };
};

/**
 * Table config for MM Observation
 */
export const getMMTableConfig = (observations) => {
  const { rows, hiddenInputs, unitTypes } = createMMRows(observations);
  return {
    id: 'observationmm',
    name: 'Observation MM',
    category: 'Multimeter',
    structure: {
      singleHeaders: ['Sr. No.', 'Mode', 'Range', 'Nominal/ Set Value on master (Calculated)', 'Nominal/ Set Value on master'],
      subHeaders: {
        'Observation on UUC': ['Observation 1', 'Observation 2', 'Observation 3', 'Observation 4', 'Observation 5']
      },
      remainingHeaders: ['Average', 'Error']
    },
    staticRows: rows,
    hiddenInputs: hiddenInputs,
    unitTypes: unitTypes
  };
};

const ObservationMM = () => null;
export default ObservationMM;
