import { VHT_COLUMNS, VHT_MAX_REPEATABLE, createVHTRows } from '../Observations/ObservationVHT';

export const vhtTableConfig = {
  id: 'observationvht',
  name: 'Observation VHT',
  category: 'Hardness',
  structure: {
    singleHeaders: ['Sr. No.', 'Nominal/ Set Value'],
    subHeaders: {
      'Observation on UUC': Array.from({ length: VHT_MAX_REPEATABLE }, (_, i) => `Observation ${i + 1}`),
    },
    remainingHeaders: ['Average', 'Error', '% Error'],
  },
};

// Sr. No., Nominal/ Set Value, Error and % Error span both rows of a point
// (entered diagonals, then converted HV), as in observationvht.php (rowspan="2")
export const VHT_ROWSPAN_COLUMNS = [
  VHT_COLUMNS.srNo,
  VHT_COLUMNS.master,
  VHT_COLUMNS.error,
  VHT_COLUMNS.percenterror,
];

/**
 * Read-only rows with the stored values, two per point. The first row of a pair is
 * flagged vhtSpan and the second vhtContinuation, so the view can merge the spanned columns.
 */
export const createVHTViewRows = (dataArray) => {
  const { rows, hiddenInputs } = createVHTRows((Array.isArray(dataArray) ? dataArray : []).filter(Boolean));
  rows.forEach((row, i) => {
    if (hiddenInputs.types[i] === 'cuuc') row.vhtSpan = true;
    else row.vhtContinuation = true;
  });
  return rows;
};
