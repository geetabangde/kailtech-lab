import { BHT_COLUMNS, BHT_MAX_REPEATABLE, createBHTRows } from '../Observations/ObservationBHT';

export const bhtTableConfig = {
  id: 'observationbht',
  name: 'Observation BHT',
  category: 'Hardness',
  structure: {
    singleHeaders: ['Sr. No.', 'Nominal/ Set Value', 'Unit'],
    subHeaders: {
      'Observation on UUC': Array.from({ length: BHT_MAX_REPEATABLE }, (_, i) => `Observation ${i + 1}`),
    },
    remainingHeaders: ['Average', 'Error', 'Percent Error'],
  },
};

// Sr. No., Nominal/ Set Value, Unit, Error and Percent Error span both rows of a
// Brinell point (diameters, then converted HBW), as in the entry form (rowspan="2")
export const BHT_ROWSPAN_COLUMNS = [
  BHT_COLUMNS.srNo,
  BHT_COLUMNS.master,
  BHT_COLUMNS.unit,
  BHT_COLUMNS.error,
  BHT_COLUMNS.percenterror,
];

/**
 * Read-only rows with the stored values: one row per direct-reading point (HRC, HRBW, …),
 * two per Brinell point. The first row of a pair is flagged bhtSpan and the second
 * bhtContinuation, so the view can merge the spanned columns.
 */
export const createBHTViewRows = (dataArray) => {
  const points = (Array.isArray(dataArray) ? dataArray : []).filter(Boolean);
  const { rows, hiddenInputs } = createBHTRows(points);
  rows.forEach((row, i) => {
    if (hiddenInputs.types[i] === 'cuuc') row.bhtSpan = true;
    if (hiddenInputs.types[i] === 'uuc' && hiddenInputs.types[i - 1] === 'cuuc'
      && hiddenInputs.calibrationPoints[i] === hiddenInputs.calibrationPoints[i - 1]) {
      row.bhtContinuation = true;
    }
  });
  return rows;
};
