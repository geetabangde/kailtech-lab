import { safeGetValue, formatValueByLc } from './viewRawDataUtils';

export const getCustomLayoutIndices = (instrument) => {
  if (!instrument) return null;
  let colIdx = 1;

  let hasParameter = instrument.parametertoshow === 'Yes';
  let paramIdx = hasParameter ? colIdx++ : -1;

  let hasSpecification = instrument.specificationtoshow === 'Yes';
  let specIdx = hasSpecification ? colIdx++ : -1;

  let masterdone = false;
  let uucdone = false;

  const masterCount = parseInt(instrument.master || 1, 10);
  const uucCount = parseInt(instrument.uuc || 1, 10);

  let hasSetpoint = instrument.setpointtoshow === 'Yes';
  let setpointIdx = -1;

  if (hasSetpoint) {
    setpointIdx = colIdx++;
    if (instrument.setpoint === 'Master') {
      masterdone = true;
    } else if (instrument.setpoint === 'UUC') {
      uucdone = true;
    }
  }

  let masterObsIndices = [];
  let avgMasterIdx = -1;
  let uucObsIndices = [];
  let avgUucIdx = -1;

  const pushMaster = () => {
    for (let i = 0; i < masterCount; i++) masterObsIndices.push(colIdx++);
    if (masterCount > 1) avgMasterIdx = colIdx++;
    masterdone = true;
  };

  const pushUuc = () => {
    for (let i = 0; i < uucCount; i++) uucObsIndices.push(colIdx++);
    if (uucCount > 1) avgUucIdx = colIdx++;
    uucdone = true;
  };

  if (instrument.mastertoshow === 'Yes' && !masterdone && masterCount <= uucCount) {
    pushMaster();
  }

  if (instrument.uuctoshow === 'Yes' && !uucdone) {
    pushUuc();
  }

  if (instrument.mastertoshow === 'Yes' && !masterdone) {
    pushMaster();
  }

  let hasError = instrument.errortoshow === 'Yes';
  let errorIdx = hasError ? colIdx++ : -1;

  let hasRemark = instrument.remarktoshow === 'Yes';
  let remarkIdx = hasRemark ? colIdx++ : -1;

  return {
    paramIdx,
    specIdx,
    setpointIdx,
    masterObsIndices,
    avgMasterIdx,
    uucObsIndices,
    avgUucIdx,
    errorIdx,
    remarkIdx,
    totalCols: colIdx,
  };
};

export const getObservationCustomStructure = (instrument) => {
  if (!instrument) {
    return { singleHeaders: [], subHeaders: {}, remainingHeaders: [] };
  }

  const singleHeaders = [];
  const subHeaders = {};
  const remainingHeaders = [];

  singleHeaders.push('Sr. No.');

  if (instrument.parametertoshow === 'Yes') {
    singleHeaders.push(instrument.parameterheading || 'Parameter');
  }

  if (instrument.specificationtoshow === 'Yes') {
    singleHeaders.push(instrument.specificationheading || 'Specification');
  }

  let masterdone = false;
  let uucdone = false;

  const masterCount = parseInt(instrument.master || 1, 10);
  const uucCount = parseInt(instrument.uuc || 1, 10);

  if (instrument.setpointtoshow === 'Yes') {
    if (instrument.setpoint === 'Separate') {
      singleHeaders.push(instrument.setpointheading || 'Set Point');
    } else if (instrument.setpoint === 'Master') {
      singleHeaders.push(instrument.masterheading || 'Master');
      masterdone = true;
    } else if (instrument.setpoint === 'UUC') {
      singleHeaders.push(instrument.uucheading || 'UUC');
      uucdone = true;
    }
  }

  const isMultiRow = (masterCount > 1 || uucCount > 1);

  const addMasterObservations = () => {
    if (masterCount > 1) {
      let obsArray = [];
      for (let i = 1; i <= masterCount; i++) obsArray.push(`Observation ${i}`);
      obsArray.push('Average On Master');
      subHeaders[instrument.masterheading || 'Master Observations'] = obsArray;
    } else {
      singleHeaders.push(instrument.masterheading || 'Master Observations');
    }
    masterdone = true;
  };

  const addUucObservations = () => {
    if (uucCount > 1) {
      let obsArray = [];
      for (let i = 1; i <= uucCount; i++) obsArray.push(`Observation ${i}`);
      obsArray.push('Average On UUC');
      subHeaders[instrument.uucheading || 'UUC Observations'] = obsArray;
    } else {
      singleHeaders.push(instrument.uucheading || 'UUC Observations');
    }
    uucdone = true;
  };

  if (instrument.mastertoshow === 'Yes' && !masterdone && masterCount <= uucCount) {
    addMasterObservations();
  }

  if (instrument.uuctoshow === 'Yes' && !uucdone) {
    addUucObservations();
  }

  if (instrument.mastertoshow === 'Yes' && !masterdone) {
    addMasterObservations();
  }

  if (instrument.errortoshow === 'Yes') {
    if (isMultiRow) {
      remainingHeaders.push('Error');
    } else {
      singleHeaders.push('Error');
    }
  }

  if (instrument.remarktoshow === 'Yes') {
    if (isMultiRow) {
      remainingHeaders.push(instrument.remarkheading || 'Remark');
    } else {
      singleHeaders.push(instrument.remarkheading || 'Remark');
    }
  }

  return {
    singleHeaders,
    subHeaders,
    remainingHeaders,
  };
};

export const createCustomRows = (dataArray, currentRawdata, observationData) => {
  const rows = [];
  const instrumentSettings = currentRawdata?.listInstrument || observationData?.instrument_settings || observationData?.[0]?.instrument_settings;
  const layout = getCustomLayoutIndices(instrumentSettings);

  if (layout) {
    dataArray.forEach((point, index) => {
      if (!point) return;

      const summary = point.summary_data || point.summary || point.observations || point;

      const uucLc = point?.matrix?.leastcount ?? point?.least_count ?? point?.leastcount;
      const masterLc = point?.master_matrix?.leastcount ?? point?.master_least_count ?? point?.masterleastcount;

      const getDec = (lc) => {
        if (!lc || lc === 'NA' || lc === 'No' || isNaN(parseFloat(lc))) return null;
        const parts = lc.toString().split('.');
        return parts.length > 1 ? parts[1].length : 0;
      };

      const uucDecimals = getDec(uucLc);
      const masterDecimals = getDec(masterLc);

      let errorDecimals = 0;
      if (masterDecimals !== null && uucDecimals !== null) {
        errorDecimals = Math.max(masterDecimals, uucDecimals);
      } else if (masterDecimals !== null) {
        errorDecimals = masterDecimals;
      } else if (uucDecimals !== null) {
        errorDecimals = uucDecimals;
      }

      const row = Array(layout.totalCols).fill('');
      row[0] = point.sr_no?.toString() || (index + 1).toString();

      if (layout.paramIdx !== -1) row[layout.paramIdx] = safeGetValue(
        summary.parameter?.[0]?.value ?? point.parameter ?? point.unittype ?? point.matrix?.unittype
      );

      if (layout.specIdx !== -1) row[layout.specIdx] = safeGetValue(
        summary.specification?.[0]?.value ?? point.specification
      );

      if (layout.setpointIdx !== -1) {
        const rawSp = point.point ?? summary.setpoint?.[0]?.value ?? summary.master?.[0]?.value ?? summary.uuc?.[0]?.value;
        // Show the stored value exactly as the API returns it.
        row[layout.setpointIdx] = safeGetValue(rawSp);
      }

      const masterVals = [...(summary.master ?? point.master ?? [])].sort(
        (a, b) => Number(a?.repeatable ?? 0) - Number(b?.repeatable ?? 0)
      );
      layout.masterObsIndices.forEach((idx, i) => {
        row[idx] = safeGetValue(masterVals[i]?.value ?? masterVals[i]);
      });
      if (layout.avgMasterIdx !== -1) row[layout.avgMasterIdx] = safeGetValue(
        summary.averagemaster?.[0]?.value ?? point.averagemaster
      );

      const uucVals = [...(summary.uuc ?? point.uuc ?? [])].sort(
        (a, b) => Number(a?.repeatable ?? 0) - Number(b?.repeatable ?? 0)
      );
      layout.uucObsIndices.forEach((idx, i) => {
        row[idx] = safeGetValue(uucVals[i]?.value ?? uucVals[i]);
      });
      if (layout.avgUucIdx !== -1) row[layout.avgUucIdx] = safeGetValue(
        summary.averageuuc?.[0]?.value ?? point.averageuuc
      );

      if (layout.errorIdx !== -1) {
        let masterVal = null;
        let masterRaw = null;
        if (summary.averagemaster?.[0]?.value !== undefined && summary.averagemaster[0].value !== '') {
          masterRaw = summary.averagemaster[0].value;
          masterVal = parseFloat(masterRaw);
        } else if (masterVals.length > 0 && masterVals[0]?.value !== undefined && masterVals[0].value !== '') {
          masterRaw = masterVals[0].value;
          masterVal = parseFloat(masterRaw);
        } else if (instrumentSettings?.setpoint === 'Master') {
          const raw = point.point ?? summary.setpoint?.[0]?.value;
          if (raw !== undefined && raw !== '') {
            masterRaw = raw;
            masterVal = parseFloat(raw);
          }
        }

        let uucVal = null;
        let uucRaw = null;
        if (summary.averageuuc?.[0]?.value !== undefined && summary.averageuuc[0].value !== '') {
          uucRaw = summary.averageuuc[0].value;
          uucVal = parseFloat(uucRaw);
        } else if (uucVals.length > 0 && uucVals[0]?.value !== undefined && uucVals[0].value !== '') {
          uucRaw = uucVals[0].value;
          uucVal = parseFloat(uucRaw);
        } else if (instrumentSettings?.setpoint === 'UUC') {
          const raw = point.point ?? summary.setpoint?.[0]?.value;
          if (raw !== undefined && raw !== '') {
            uucRaw = raw;
            uucVal = parseFloat(raw);
          }
        }

        if (masterVal !== null && uucVal !== null && !isNaN(masterVal) && !isNaN(uucVal)) {
          const isStdUuc = (instrumentSettings?.error === 'stduuc' || instrumentSettings?.error_type === 'stduuc' || instrumentSettings?.custom_error === 'stduuc');
          const diff = isStdUuc ? (masterVal - uucVal) : (uucVal - masterVal);
          
          let dynamicDecimals = errorDecimals;
          if (masterDecimals === null && uucDecimals === null) {
            const getValDecimals = (val) => {
              if (val === undefined || val === null) return 0;
              const str = val.toString();
              const p = str.split('.');
              return p.length > 1 ? p[1].length : 0;
            };
            dynamicDecimals = Math.max(getValDecimals(masterRaw), getValDecimals(uucRaw), 0);
          }

          row[layout.errorIdx] = diff.toFixed(dynamicDecimals);
        } else {
          const savedErr = summary.error?.[0]?.value ?? point.error;
          row[layout.errorIdx] = formatValueByLc(savedErr, errorDecimals, uucLc);
        }
      }

      if (layout.remarkIdx !== -1) row[layout.remarkIdx] = safeGetValue(
        summary.remark?.[0]?.value ?? point.remark
      );

      rows.push(row);
    });
  }
  return rows;
};

export const parseCustomDynamicData = (observationData, setRawdata) => {
  if (observationData.instrument_settings && setRawdata) {
    setRawdata((prev) => ({ ...prev, listInstrument: observationData.instrument_settings }));
  }

  if (observationData.calibration_points && Array.isArray(observationData.calibration_points)) {
    return observationData.calibration_points;
  } else if (observationData.data && Array.isArray(observationData.data)) {
    return observationData.data;
  } else if (Array.isArray(observationData)) {
    return observationData;
  }
  return [];
};
