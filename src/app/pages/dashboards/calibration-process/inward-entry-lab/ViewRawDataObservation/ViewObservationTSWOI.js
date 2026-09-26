import { safeGetValue } from './viewRawDataUtils';
import { TSWOI_COLS, createTSWOIRows, extractTSWOIPoints } from '../Observations/ObservationTSWOI';

// "(UUC Unit)" is replaced with the UUC unit description by ViewRawData's generateTableStructure
export const tswoiTableConfig = {
  id: 'observationtswoi',
  name: 'Observation TSWOI',
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
export const TSWOI_ROWSPAN_COLUMNS = [TSWOI_COLS.SR_NO, TSWOI_COLS.SET_POINT, TSWOI_COLS.DEVIATION];

// PHP view prints units.description for the saved uucunit / masterunit id
const getUnitDescription = (point, side) => {
  const sideObj = point?.[side] && typeof point[side] === 'object' && !Array.isArray(point[side]) ? point[side] : {};
  const candidates = side === 'uuc'
    ? [sideObj.unit_description, point?.uucunit_description, point?.uuc_unit_description, sideObj.unit?.description]
    : [sideObj.unit_description, point?.masterunit_description, point?.master_unit_description, sideObj.unit?.description];
  return candidates.map(safeGetValue).find((val) => val !== '') || '';
};

/**
 * Read-only rows for the view: same two-rows-per-point layout as the entry screen,
 * with unit descriptions in place of unit ids where the API provides them.
 */
export const createTSWOIViewRows = (dataArray) => {
  const points = (Array.isArray(dataArray) ? dataArray : []).filter(Boolean);
  const { rows } = createTSWOIRows(points);

  points.forEach((point, pointIndex) => {
    const uucRow = rows[pointIndex * 2];
    const masterRow = rows[pointIndex * 2 + 1];
    const uucUnit = getUnitDescription(point, 'uuc');
    const masterUnit = getUnitDescription(point, 'master');
    if (uucRow && uucUnit) uucRow[TSWOI_COLS.UNIT] = uucUnit;
    if (masterRow && masterUnit) masterRow[TSWOI_COLS.UNIT] = masterUnit;
  });

  return rows;
};

// unit_description on the first point feeds the "(UUC Unit)" header replacement
export const parseTSWOIDynamicData = (observationData) => (extractTSWOIPoints(observationData) || []).map((point) => (
  point && typeof point === 'object' && !point.unit_description && point.unit_label
    ? { ...point, unit_description: point.unit_label }
    : point
));
