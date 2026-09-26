import { safeGetValue, safeGetArray } from './observationUtils';

/**
 * Calculation logic for Observation SRF
 */
export const calculateSRFValues = (rowData) => {
  const result = {};
  if (!rowData || !Array.isArray(rowData)) return result;

  const parsedValues = rowData.map((val) => (val === '' || val === null || val === undefined ? 0 : parseFloat(val) || 0));
  const observations = parsedValues.slice(2, 7).filter((val) => val !== 0);
  
  result.average = observations.length
    ? (observations.reduce((sum, val) => sum + val, 0) / observations.length).toFixed(4)
    : '';
    
  const nominalValue = parsedValues[1];
  
  if (result.average !== '' && nominalValue !== undefined && !isNaN(nominalValue) && nominalValue !== 0) {
    result.error = (parseFloat(result.average) - nominalValue).toFixed(4);
  } else if (result.average !== '' && nominalValue === 0) {
    result.error = (parseFloat(result.average) - nominalValue).toFixed(4);
  } else {
    result.error = '';
  }

  return result;
};

/**
 * Row generator for SRF Observation
 */
export const createSRFRows = (dataArray) => {
  const rows = [];
  const calibrationPoints = [];
  const types = [];
  const repeatables = [];
  const values = [];

  (dataArray || []).forEach((point) => {
    if (!point) return;

    let observations = [];
    if (point.observations && Array.isArray(point.observations)) {
        observations = point.observations.map(o => o?.value !== undefined ? o.value : o);
    } else {
        observations = [
            point.uuc1 ?? point.observations?.uuc_1 ?? '',
            point.uuc2 ?? point.observations?.uuc_2 ?? '',
            point.uuc3 ?? point.observations?.uuc_3 ?? '',
            point.uuc4 ?? point.observations?.uuc_4 ?? '',
            point.uuc5 ?? point.observations?.uuc_5 ?? '',
        ];
    }
    
    observations = safeGetArray(observations, 5);
    while (observations.length < 5) {
      observations.push('');
    }

    const row = [
      point.sr_no?.toString() || point.sequence_number?.toString() || '',
      safeGetValue(point.master ?? point.master_value ?? point.point),
      ...observations.slice(0, 5).map(obs => safeGetValue(obs)),
      safeGetValue(point.average ?? point.averageuuc ?? point.calculations?.mean),
      safeGetValue(point.error ?? point.calculations?.error),
    ];

    while (row.length < 8) {
      row.push('');
    }

    rows.push(row);
    calibrationPoints.push(point.point_id?.toString() || point.id?.toString() || '');
    types.push('master');
    repeatables.push(point.repeatable_cycle?.toString() || '5');
    values.push(safeGetValue(point.master ?? point.master_value ?? point.point) || '0');
  });

  return { rows, hiddenInputs: { calibrationPoints, types, repeatables, values } };
};

/**
 * Table config for SRF Observation
 */
export const getSRFTableConfig = (observations) => {
  const { rows, hiddenInputs } = createSRFRows(observations);
  return {
    id: 'observationsrf',
    name: 'Observation SRF',
    category: 'Measuring',
    structure: {
      thermalCoeff: true,
      singleHeaders: ['Sr. No.', 'Nominal/ Set Value'],
      subHeaders: {
        'Observation on UUC': ['Observation 1', 'Observation 2', 'Observation 3', 'Observation 4', 'Observation 5']
      },
      remainingHeaders: ['Average', 'Error']
    },
    staticRows: rows,
    hiddenInputs: hiddenInputs
  };
};

const ObservationSRF = () => null;
export default ObservationSRF;
