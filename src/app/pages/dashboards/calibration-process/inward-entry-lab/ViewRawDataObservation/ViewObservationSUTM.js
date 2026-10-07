import { createSUTMRows, extractSUTMPoints } from '../Observations/ObservationSUTM';

const SET_COLUMNS = ['Displacement (mm)', 'Time (s)', 'Speed (mm/Min)'];

// "(UUC Unit)" is replaced with the UUC unit description by ViewRawData's generateTableStructure
export const sutmTableConfig = {
  id: 'observationsutm',
  name: 'Observation SUTM',
  category: 'Force',
  structure: {
    singleHeaders: ['Sr no', 'Set Nominal Speed On UUC (UUC Unit)'],
    subHeaders: {
      'Reading On Master – Set 1': SET_COLUMNS,
      'Reading On Master – Set 2': SET_COLUMNS,
    },
    remainingHeaders: ['Mean Speed (UUC Unit)', 'Error (UUC Unit)'],
  },
};

/** Read-only rows with the stored values, same layout as the entry screen. */
export const createSUTMViewRows = (dataArray) =>
  createSUTMRows((Array.isArray(dataArray) ? dataArray : []).filter(Boolean)).rows;

// The header unit is read from points[0].units; point.unit is only the unit id
export const parseSUTMDynamicData = (observationData) => (extractSUTMPoints(observationData) || []).map((point) => (
  point && typeof point === 'object' && !point.units
    ? { ...point, units: { unit_description: point.unit_description ?? point.unit_label ?? '' } }
    : point
));
