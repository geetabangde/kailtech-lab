import { safeGetValue, safeGetArray } from './observationUtils';

/**
 * Calculation logic for Torque Meter / Torque Wrench (TM) Observation
 */
export const calculateTMValues = (rowData, point, options = {}) => {
  const result = {};
  if (!rowData || !Array.isArray(rowData)) return result;

  const parsedValues = rowData.map((val) => (val === '' || val === null || val === undefined ? null : parseFloat(val)));
  
  const getValidObs = (slice) => slice.filter(val => val !== null && !isNaN(val));
  
  const uucObservations = getValidObs(parsedValues.slice(4, 14));
  const masterObservations = getValidObs(parsedValues.slice(14, 24));

  let uucDec = null;
  let masterDec = null;
  let errorDec = null;

  if (point) {
    const lcUuc = point.least_count_uuc ?? point.uuc_least_count ?? point.least_count;
    const lcMaster = point.least_count_master ?? point.master_least_count ?? point.masterleastcount;
    
    const getDec = (lc) => {
      if (!lc || lc === 'NA') return null;
      const match = String(lc).match(/\.([0-9]+)/);
      if (match) return match[1].length;
      if (!isNaN(parseFloat(lc))) return 0;
      return null;
    };
    
    uucDec = getDec(lcUuc);
    masterDec = getDec(lcMaster);
    errorDec = uucDec !== null && masterDec !== null ? Math.max(uucDec, masterDec) : (uucDec ?? masterDec);
  }

  const formatDec = (num, dec) => dec !== null ? num.toFixed(dec) : num.toString();

  result.averageUUC = uucObservations.length
    ? formatDec(uucObservations.reduce((sum, val) => sum + val, 0) / uucObservations.length, uucDec)
    : '';

  result.averageMaster = masterObservations.length
    ? formatDec(masterObservations.reduce((sum, val) => sum + val, 0) / masterObservations.length, masterDec)
    : '';

  const uucAvgNum = parseFloat(result.averageUUC);
  const masterAvgNum = parseFloat(result.averageMaster);

  if (!isNaN(uucAvgNum) && !isNaN(masterAvgNum)) {
    const errorVal = options.errorMode === 'stduuc'
      ? masterAvgNum - uucAvgNum
      : uucAvgNum - masterAvgNum;
      
    result.error = formatDec(errorVal, errorDec);
  } else {
    result.error = '';
  }

  return result;
};

/**
 * Row generator for TM Observation
 */
export const createTMRows = (dataArray) => {
  const rows = [];
  const calibrationPoints = [];
  const types = [];
  const repeatables = [];
  const values = [];

  (dataArray || []).forEach((point) => {
    if (!point) return;

    let uucDec = null;
    let masterDec = null;
    let errorDec = null;

    const lcUuc = point.least_count_uuc ?? point.uuc_least_count ?? point.least_count;
    const lcMaster = point.least_count_master ?? point.master_least_count ?? point.masterleastcount;
    
    const getDec = (lc) => {
      if (!lc || lc === 'NA') return null;
      const match = String(lc).match(/\.([0-9]+)/);
      if (match) return match[1].length;
      if (!isNaN(parseFloat(lc))) return 0;
      return null;
    };
    
    uucDec = getDec(lcUuc);
    masterDec = getDec(lcMaster);
    errorDec = uucDec !== null && masterDec !== null ? Math.max(uucDec, masterDec) : (uucDec ?? masterDec);

    const srNo = point.sr_no?.toString() || '';
    const parameter = safeGetValue(point.parameter || point.unittype);
    const setPoint = safeGetValue(point.point || point.nominal_value || point.nominal_set_value);
    const range = safeGetValue(point.range);

    const uucReadings = safeGetArray(point.uuc_values || point.observations || point.uuc_observations, 10);
    const masterReadings = safeGetArray(point.master_values || point.master_observations, 10);

    const formatVal = (val, dec) => {
      if (val === undefined || val === null || val === '') return safeGetValue(val);
      const parsed = parseFloat(val);
      if (isNaN(parsed)) return safeGetValue(val);
      return dec !== null ? parsed.toFixed(dec) : parsed.toString();
    };

    const avgUuc = formatVal(point.average_uuc, uucDec);
    const avgMaster = formatVal(point.average_master, masterDec);
    const errorVal = point.error_uuc || point.error;
    const errorFormatted = formatVal(errorVal, errorDec);

    const row = [
      srNo,                                            // 0: Sr. No.
      parameter,                                       // 1: Parameter
      setPoint,                                        // 2: Set Point
      range,                                           // 3: Range
      ...uucReadings.slice(0, 10).map(val => safeGetValue(val)),     // 4-13: UUC Observations 1-10
      ...masterReadings.slice(0, 10).map(val => safeGetValue(val)),  // 14-23: Master Observations 1-10
      avgUuc,                                          // 24: Average UUC
      errorFormatted,                                  // 25: Error
      avgMaster                                        // 26: Average Master
    ];
    rows.push(row);
    calibrationPoints.push(
      point.calibration_point_id?.toString() ||
      point.point_id?.toString() ||
      point.id?.toString() ||
      "1"
    );
    types.push('uuc');
    repeatables.push('0');
    values.push(range || "0");
  });

  return { rows, hiddenInputs: { calibrationPoints, types, repeatables, values } };
};

/**
 * Table config for TM Observation
 */
export const getTMTableConfig = (observations) => {
  const { rows, hiddenInputs } = createTMRows(observations);
  return {
    id: 'observationtm',
    name: 'Observation TM',
    category: 'Temperature',
    structure: {
      singleHeaders: ['Sr. No.', 'Parameter', 'Nominal/ Set Value', 'Range', 'Value Shown on'],
      subHeaders: {
        'Observation': ['1&6', '2&7', '3&8', '4&9', '5&10']
      },
      remainingHeaders: ['Average', 'Error']
    },
    staticRows: rows,
    hiddenInputs: hiddenInputs
  };
};

const ObservationTM = () => null;
export default ObservationTM;
