import { safeGetValue } from './viewRawDataUtils';
import { TSWI_COLS, createTSWIRows, extractTSWIPoints } from '../Observations/ObservationTSWI';

// "(UUC Unit)" is replaced with the UUC unit description by ViewRawData's generateTableStructure
export const tswiTableConfig = {
  id: 'observationtswi',
  name: 'Observation TSWI',
  category: 'Temperature',
  structure: {
    singleHeaders: ['Sr. No.', 'Set Point (UUC Unit)', 'Value Of', 'Unit', 'Sensitivity Coefficient'],
    subHeaders: {
      'Observation': ['1', '2', '3', '4', '5'],
    },
    remainingHeaders: ['Average', 'mV generated On ambient', 'Average with corrected mv', 'Average (UUC Unit)', 'Deviation (UUC Unit)'],
  },
};

// Sr. No., Set Point and Deviation span a point's UUC and Master rows (PHP rowspan="2")
export const TSWI_ROWSPAN_COLUMNS = [TSWI_COLS.SR_NO, TSWI_COLS.SET_POINT, TSWI_COLS.DEVIATION];

// The master unit is saved as a units id; show its description when the API provides one
const getMasterUnitDescription = (point) => {
  const master = point?.master && typeof point.master === 'object' && !Array.isArray(point.master) ? point.master : {};
  return [master.unit_description, point?.masterunit_description, point?.master_unit_description, master.unit?.description]
    .map(safeGetValue)
    .find((val) => val !== '') || '';
};

/**
 * Read-only rows for the view: same two-rows-per-point layout as the entry screen.
 * The UUC row already carries the UUC unit description; the Master row's unit id
 * is replaced with its description where available.
 */
export const createTSWIViewRows = (dataArray) => {
  const points = (Array.isArray(dataArray) ? dataArray : []).filter(Boolean);
  const { rows } = createTSWIRows(points);

  points.forEach((point, pointIndex) => {
    const masterRow = rows[pointIndex * 2 + 1];
    const masterUnit = getMasterUnitDescription(point);
    if (masterRow && masterUnit) masterRow[TSWI_COLS.UNIT] = masterUnit;
  });

  return rows;
};

// unit_description on the first point feeds the "(UUC Unit)" header replacement
export const parseTSWIDynamicData = (observationData) => (extractTSWIPoints(observationData) || []).map((point) => (
  point && typeof point === 'object' && !point.unit_description && point.unit_label
    ? { ...point, unit_description: point.unit_label }
    : point
));
