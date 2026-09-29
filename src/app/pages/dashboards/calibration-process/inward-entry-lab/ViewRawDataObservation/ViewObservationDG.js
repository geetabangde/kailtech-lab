import { formatValueByLc } from './viewRawDataUtils';

// "(Master Unit)" / "(UUC Unit)" are replaced with the unit names by generateTableStructure
const DG_TRAILING_HEADERS = {
  subHeaders: {
    'Set 1 (UUC Unit)': ['Set 1 Forward Reading', 'Set 1 Backward Reading'],
    'Set 2 (UUC Unit)': ['Set 2 Forward Reading', 'Set 2 Backward Reading'],
    'Average (UUC Unit)': ['Average Forward Reading', 'Average Backward Reading'],
    'Error (UUC Unit)': ['Error Forward Reading', 'Error Backward Reading'],
  },
  remainingHeaders: ['Hysterisis (UUC Unit)'],
};

export const dgTableConfig = {
  id: 'observationdg',
  name: 'Observation DG',
  category: 'Digital Gauge',
  structure: {
    thermalCoeff: true,
    singleHeaders: ['Sr no', 'Nominal Value (Master Unit)'],
    ...DG_TRAILING_HEADERS,
  },
};

// PHP decides the extra nominal column from the first calibration point
const dgHasConversion = (observations) => {
  const first = (Array.isArray(observations) ? observations : []).find(Boolean);
  return !!first?.has_conversion;
};

/** Structure with the extra "Nominal Value (UUC unit)" column when the units differ. */
export const getDGViewStructure = (observations) => ({
  thermalCoeff: true,
  singleHeaders: dgHasConversion(observations)
    ? ['Sr no', 'Nominal Value (Master Unit)', 'Nominal Value (UUC Unit)']
    : ['Sr no', 'Nominal Value (Master Unit)'],
  ...DG_TRAILING_HEADERS,
});

export const createDGRows = (dataArray, currentRawdata = {}) => {
  const rows = [];
  const hasConversion = dgHasConversion(dataArray);
  dataArray.forEach((point) => {
    if (!point) return;
    const lc = point.least_count || currentRawdata?.uuc_details?.least_count || '0.01';
    let decimals = null;
    if (lc) {
      const match = String(lc).match(/\.([0-9]+)/);
      if (match) decimals = match[1].length;
      else if (!isNaN(parseFloat(lc))) decimals = 0;
    }

    // nominal_value_master / nominal_value_uuc are swapped for mixed units until the
    // backend fix, so mixed-unit rows read calculated_uuc (master unit) and point (UUC unit)
    const nominals = hasConversion
      ? [point.calculated_uuc, point.point]
      : [point.point ?? point.nominal_value_master ?? point.nominal_value_uuc ?? point.nominal_value];

    const row = [
      point.sr_no?.toString() || '',
      ...nominals.map((value) => formatValueByLc(value, decimals, lc)),
      formatValueByLc(point.set1_forward, decimals, lc),
      formatValueByLc(point.set1_backward, decimals, lc),
      formatValueByLc(point.set2_forward, decimals, lc),
      formatValueByLc(point.set2_backward, decimals, lc),
      formatValueByLc(point.average_forward, decimals, lc),
      formatValueByLc(point.average_backward, decimals, lc),
      formatValueByLc(point.error_forward, decimals, lc),
      formatValueByLc(point.error_backward, decimals, lc),
      formatValueByLc(point.hysterisis ?? point.hysteresis, decimals, lc),
    ];
    rows.push(row);
  });
  return rows;
};

export const parseDGDynamicData = (observationData, setThermalCoeff) => {
  if (observationData.thermal_coefficients && setThermalCoeff) {
    setThermalCoeff({
      uuc: observationData.thermal_coefficients.uuc || '',
      master: observationData.thermal_coefficients.master || '',
      thickness_of_graduation: '',
    });
  }
  if (observationData.observations && Array.isArray(observationData.observations)) {
    return observationData.observations;
  } else if (Array.isArray(observationData)) {
    return observationData;
  }
  return [];
};
