import { getDUTMPoints } from '../Observations/ObservationDUTM';

// "(UUC Unit)" is replaced with the UUC unit by ViewRawData's generateTableStructure
export const dutmTableConfig = {
  id: 'observationdutm',
  name: 'Observation DUTM',
  category: 'Universal Testing Machine',
  structure: {
    singleHeaders: ['Sr no', 'Nominal Value (UUC Unit)'],
    subHeaders: {
      'Reading On Master (UUC Unit)': ['Set I', 'Set II'],
      'Error (UUC Unit)': ['Set I', 'Set II'],
    },
    remainingHeaders: [],
  },
};

/** Read-only rows with the stored values: Sr no, Nominal, Master Set I/II, Error Set I/II. */
export const createDUTMViewRows = (dataArray) =>
  getDUTMPoints(dataArray).map((info) => [
    info.srNo,
    info.nominal,
    ...info.stored.masters,
    ...info.stored.errors,
  ]);

// get-observation returns { unit, observations: [...] }
export const parseDUTMDynamicData = (observationData) => {
  const points = [
    observationData,
    observationData?.observations,
    observationData?.data,
    observationData?.data?.observations,
    observationData?.calibration_points,
  ].find(Array.isArray);
  return points || [];
};
