import { safeGetArray, safeGetValue, formatValueByLc } from './viewRawDataUtils';

export const itTableConfig = {
  id: 'observationit',
  name: 'Observation IT',
  category: 'Internal Thread',
  structure: {
    thermalCoeff: true,
    singleHeaders: ['Sr. No.', 'Nominal/ Set Value'],
    subHeaders: {
      'Observation on UUC': [
        'Observation 1',
        'Observation 2',
        'Observation 3',
        'Observation 4',
        'Observation 5',
      ],
    },
    remainingHeaders: ['Average', 'Error'],
  },
};

export const createITRows = (dataArray) => {
  const rows = [];
  dataArray.forEach((point) => {
    if (!point) return;
    const observations = safeGetArray(point.observations, 5);
    const lc = point.least_count_value || point.least_count_uuc ;
    const row = [
      point.sequence_number?.toString() || point.sr_no?.toString() || '',
      safeGetValue(point.nominal_value || point.test_point),
      ...observations.slice(0, 5).map((obs) => formatValueByLc(obs, null, lc)),
      formatValueByLc(point.average, null, lc),
      formatValueByLc(point.error, null, lc),
    ];
    while (row.length < 9) {
      row.push('');
    }
    rows.push(row);
  });
  return rows;
};

export const parseITDynamicData = (observationData, setThermalCoeff) => {

  const itData =
    observationData?.data?.data || ''       // most common case
  observationData?.data || ''
  observationData;
  if (itData?.calibration_points) {
    if (itData.thermal_coefficients && setThermalCoeff) {
      setThermalCoeff((prev) => ({
        uuc: itData.thermal_coefficients.uuc_coefficient || '',
        master: itData.thermal_coefficients.master_coefficient || '',
        thickness_of_graduation: prev.thickness_of_graduation || '',
      }));
    }
    return itData.calibration_points;
  }
  return [];
};

