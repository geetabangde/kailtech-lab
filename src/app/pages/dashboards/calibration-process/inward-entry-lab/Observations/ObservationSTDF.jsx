import { safeGetValue, safeGetArray } from './observationUtils';

/**
 * Calculation logic for Standard (STDF) Observation
 */
export const calculateSTDFValues = (rowData) => {
  const result = {};
  if (!rowData || !Array.isArray(rowData)) return result;

  const parsedValues = rowData.map((val) => (val === '' || val === null || val === undefined ? 0 : parseFloat(val) || 0));
  const observations = parsedValues.slice(2, 7).filter((val) => val !== 0);
  
  result.average = observations.length
    ? (observations.reduce((sum, val) => sum + val, 0) / observations.length).toFixed(4)
    : '';
    
  const nominalValue = parsedValues[1];
  
  if (result.average !== '' && nominalValue !== undefined && !isNaN(nominalValue) && nominalValue !== 0) {
    result.error = (nominalValue - parseFloat(result.average)).toFixed(4);
  } else if (result.average !== '' && nominalValue === 0) {
    result.error = (nominalValue - parseFloat(result.average)).toFixed(4);
  } else {
    result.error = '';
  }

  return result;
};

/**
 * Row generator for STDF Observation
 */
export const createSTDFRows = (dataArray) => {
  const rows = [];
  const calibrationPoints = [];
  const types = [];
  const repeatables = [];
  const values = [];

  (dataArray || []).forEach((point) => {
    if (!point) return;

    let observations = [];
    if (point.observations && Array.isArray(point.observations)) {
        // If observations are stored as an array of objects with value
        observations = point.observations.map(o => o?.value !== undefined ? o.value : o);
    } else {
        // Try to get from m1..m5 or object properties
        observations = [
            point.m1 ?? point.observations?.master_1 ?? '',
            point.m2 ?? point.observations?.master_2 ?? '',
            point.m3 ?? point.observations?.master_3 ?? '',
            point.m4 ?? point.observations?.master_4 ?? '',
            point.m5 ?? point.observations?.master_5 ?? '',
        ];
    }
    
    observations = safeGetArray(observations, 5);
    while (observations.length < 5) {
      observations.push('');
    }

    const row = [
      point.sr_no?.toString() || point.sequence_number?.toString() || '',
      safeGetValue(point.nominal_value ?? point.uuc_value ?? point.point),
      ...observations.slice(0, 5).map(obs => safeGetValue(obs)),
      safeGetValue(point.average ?? point.calculations?.mean ?? point.average_master),
      safeGetValue(point.error ?? point.calculations?.error),
    ];

    while (row.length < 8) {
      row.push('');
    }

    rows.push(row);
    calibrationPoints.push(point.point_id?.toString() || point.id?.toString() || '');
    types.push('uuc');
    repeatables.push(point.repeatable_cycle?.toString() || '5');
    values.push(safeGetValue(point.nominal_value ?? point.uuc_value ?? point.point) || '0');
  });

  return { rows, hiddenInputs: { calibrationPoints, types, repeatables, values } };
};

/**
 * Table config for STDF Observation
 */
export const getSTDFTableConfig = (observations) => {
  const { rows, hiddenInputs } = createSTDFRows(observations);
  return {
    id: 'observationstdf',
    name: 'Observation STDF',
    category: 'Measuring',
    structure: {
      thermalCoeff: true,
      singleHeaders: ['Sr. No.', 'Nominal/ Set Value'],
      subHeaders: {
        'Observation on Master': ['Observation 1', 'Observation 2', 'Observation 3', 'Observation 4', 'Observation 5']
      },
      remainingHeaders: ['Average', 'Error']
    },
    staticRows: rows,
    hiddenInputs: hiddenInputs
  };
};

const ObservationSTDF = () => null;
export default ObservationSTDF;
