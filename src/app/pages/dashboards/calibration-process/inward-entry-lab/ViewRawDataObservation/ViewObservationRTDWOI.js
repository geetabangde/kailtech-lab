import { safeGetValue } from './viewRawDataUtils';
import { RTDWOI_COLS, createRTDWOIRows, extractRTDWOIPoints } from '../Observations/ObservationRTDWOI';

export const rtdwoiTableConfig = {
  id: 'observationrtdwoi',
  name: 'Observation RTDWOI',
  category: 'Temperature',
  structure: {
    singleHeaders: ['Sr. No.', 'Set Point (UUC Unit)', 'Value Of', 'Unit', 'Sensitivity Coefficient'],
    subHeaders: {
      'Observation': ['1', '2', '3', '4', '5'],
    },
    remainingHeaders: ['Average', 'mV generated On ambient', 'Average with corrected mv', 'Average (UUC Unit)', 'Deviation (UUC Unit)'],
  },
};

export const RTDWOI_ROWSPAN_COLUMNS = [RTDWOI_COLS.SR_NO, RTDWOI_COLS.SET_POINT, RTDWOI_COLS.DEVIATION];

const getUnitDescription = (point, side) => {
  const sideObj = point?.[side] && typeof point[side] === 'object' && !Array.isArray(point[side]) ? point[side] : {};
  const candidates = side === 'uuc'
    ? [sideObj.unit_description, point?.uucunit_description, point?.uuc_unit_description, sideObj.unit?.description]
    : [sideObj.unit_description, point?.masterunit_description, point?.master_unit_description, sideObj.unit?.description];
  return candidates.map(safeGetValue).find((val) => val !== '') || '';
};

export const createRTDWOIViewRows = (dataArray) => {
  const points = (Array.isArray(dataArray) ? dataArray : []).filter(Boolean);
  const { rows } = createRTDWOIRows(points);

  points.forEach((point, pointIndex) => {
    const uucRow = rows[pointIndex * 2];
    const masterRow = rows[pointIndex * 2 + 1];
    const uucUnit = getUnitDescription(point, 'uuc');
    const masterUnit = getUnitDescription(point, 'master');
    if (uucRow && uucUnit) uucRow[RTDWOI_COLS.UNIT] = uucUnit;
    if (masterRow && masterUnit) masterRow[RTDWOI_COLS.UNIT] = masterUnit;
  });

  return rows;
};

export const parseRTDWOIDynamicData = (observationData) => (extractRTDWOIPoints(observationData) || []).map((point) => (
  point && typeof point === 'object' && !point.unit_description && point.unit_label
    ? { ...point, unit_description: point.unit_label }
    : point
));
