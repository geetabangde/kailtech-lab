import { safeGetValue, safeGetArray } from './viewRawDataUtils';

export const thTableConfig = {
  id: 'observationth',
  name: 'Observation TH',
  category: 'Thermohydrometer',
  structure: {
    singleHeaders: ['Sr no', 'Value Shown on', 'Range', 'nominal Value', 'Unit'],
    subHeaders: {
      'Observation on UUC / Master': ['1', '2', '3', '4', '5'],
    },
    remainingHeaders: ['Mean', 'Error'],
  },
};

export const createTHRows = (dataArray) => {
  const rows = [];
  dataArray.forEach((point) => {
    if (!point) return;

    const srNo = point.sr_no?.toString() || '';
    const setPoint = safeGetValue(point.set_point || point.setpoint || point.point);

    // Support both old flat format and new nested format
    const uucData = point.value_shown_on?.uuc || {};
    const masterData = point.value_shown_on?.master || {};

    const uucObsSource = uucData.observations || point.uuc || [];
    const masterObsSource = masterData.observations || point.master || [];

    // UUC Row
    const uucReadings = safeGetArray(
      uucObsSource.map(o => (o && typeof o === 'object' && o.value !== undefined) ? o.value : o),
      5
    );
    const uucRow = [
      srNo,                                           // 0: Sr no
      'UUC',                                          // 1: Value Shown on
      safeGetValue(uucData.range || point.uucrange),  // 2: Range
      setPoint,                                       // 3: nominal Value
      safeGetValue(uucData.unit || point.unit || point.uucunit), // 4: Unit
      ...uucReadings.slice(0, 5).map((val) => safeGetValue(val)), // 5-9: Observations 1-5
      safeGetValue(uucData.average || point.averageuuc), // 10: Mean
      '-',                                            // 11: Error (dash for UUC)
    ];
    rows.push(uucRow);

    // Master Row
    const masterReadings = safeGetArray(
      masterObsSource.map(o => (o && typeof o === 'object' && o.value !== undefined) ? o.value : o),
      5
    );
    const masterRow = [
      '-',                                            // 0: Sr no
      'Master',                                       // 1: Value Shown on
      '-',                                            // 2: Range
      '-',                                            // 3: nominal Value
      safeGetValue(masterData.unit || point.masterunit), // 4: Unit
      ...masterReadings.slice(0, 5).map((val) => safeGetValue(val)), // 5-9: Observations 1-5
      safeGetValue(masterData.average || point.averagemaster), // 10: Mean
      safeGetValue(point.error),                      // 11: Error
    ];
    rows.push(masterRow);
  });
  return rows;
};
