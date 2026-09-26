import { SW_COLS, createSWRows, extractSWPoints } from '../Observations/ObservationSW';

// Same columns as the entry screen (rawdatasw.php): one UUC and one Master row per point
export const swTableConfig = {
  id: 'observationsw',
  name: 'Observation SW',
  category: 'Stop Watch',
  structure: {
    singleHeaders: ['Sr. No.', 'Nominal/ Set Value', 'Value Of'],
    subHeaders: {
      'Observation': ['1', '2', '3', '4', '5'],
    },
    remainingHeaders: ['Average', 'Error', 'Uncertainty'],
  },
};

// Sr. No., Set Value, Error and Uncertainty span a point's UUC and Master rows (PHP rowspan="2")
export const SW_ROWSPAN_COLUMNS = [SW_COLS.SR_NO, SW_COLS.SET_POINT, SW_COLS.ERROR, SW_COLS.UNCERTAINTY];

/**
 * Read-only rows for the view, built by the entry screen's row builder so both read
 * the API the same way. Averages, error and uncertainty are shown as saved: in PHP
 * they can be edited by hand, so they are not recalculated here.
 */
export const createSWViewRows = (dataArray) => {
  const points = (Array.isArray(dataArray) ? dataArray : []).filter(Boolean);
  return createSWRows(points).rows;
};

/**
 * Points from the get-observation response. Falls back to numerically keyed
 * objects ({ "0": {...}, "1": {...} }), which the shared TS/SW parser used to accept.
 */
export const parseSWDynamicData = (observationData) => {
  const points = extractSWPoints(observationData);
  if (points) return points;
  if (observationData?.readings && Array.isArray(observationData.readings)) return observationData.readings;
  if (observationData && typeof observationData === 'object') {
    return Object.keys(observationData)
      .filter((key) => !isNaN(key) && observationData[key])
      .map((key) => observationData[key]);
  }
  return [];
};
