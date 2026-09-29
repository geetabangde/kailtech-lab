import { safeGetValue } from './observationUtils';

const isBlank = (val) => val === undefined || val === null || String(val).trim() === '';
const isNA = (val) => isBlank(val) || String(val).trim().toUpperCase() === 'NA';
const toNum = (val) => (isBlank(val) ? NaN : parseFloat(val));

// Unrounded like PHP's 'NA' precision, with float noise stripped
const formatUnrounded = (num) => (Number.isFinite(num) ? String(Number(num.toFixed(10))) : '');

// Half away from zero like PHP round(); exponent shifting avoids 0.3005 -> 0.300 float errors
const roundTo = (num, decimals) => {
  // toFixed(10) first: (0.999 + 0.998) / 2 is 0.99849999... in floating point
  const shifted = Math.round(Number(`${Math.abs(Number(num.toFixed(10)))}e${decimals}`));
  return Math.sign(num) * Number(`${shifted}e-${decimals}`);
};

const formatTo = (num, decimals) => {
  if (!Number.isFinite(num)) return '';
  const out = decimals === 'NA' ? formatUnrounded(num) : roundTo(num, decimals).toFixed(decimals);
  return out.replace(/^-(0\.?0*)$/, '$1');
};

// Decimal places of a least count, or 'NA'
const lcDecimals = (leastCount) => {
  if (isNA(leastCount)) return 'NA';
  const s = String(leastCount).trim();
  return s.includes('.') ? s.split('.')[1].length : 0;
};

export const getDGLayout = (hasConversion) => {
  const setStart = hasConversion ? 3 : 2;
  return {
    hasConversion: !!hasConversion,
    srNo: 0,
    nominal: 1,
    uuc: hasConversion ? 2 : 1, // the value errors are measured against
    set1Forward: setStart,
    set1Backward: setStart + 1,
    set2Forward: setStart + 2,
    set2Backward: setStart + 3,
    averageForward: setStart + 4,
    averageBackward: setStart + 5,
    errorForward: setStart + 6,
    errorBackward: setStart + 7,
    hysterisis: setStart + 8,
  };
};

const pick = (obj, ...keys) => {
  for (const key of keys) {
    const val = safeGetValue(obj?.[key]);
    if (val !== '') return val;
  }
  return '';
};

const getMasterUnit = (point) => pick(point, 'masterunit', 'master_unit', 'master_unit_id');
const getUucUnit = (point) => pick(point, 'unit', 'uuc_unit', 'unit_id', 'uucunit');

const pointHasConversion = (point) => {
  if (point?.has_conversion !== undefined) return !!point.has_conversion;
  const master = getMasterUnit(point);
  const uuc = getUucUnit(point);
  return master !== '' && uuc !== '' && master !== uuc;
};

const getLeastCounts = (point) => ({
  uuc: pick(point, 'least_count', 'leastcount', 'uuc_least_count', 'least_count_uuc')
    || pick(point?.precision, 'uuc_least_count', 'least_count'),
  master: pick(point, 'master_least_count', 'masterleastcount', 'least_count_master')
    || pick(point?.precision, 'master_least_count'),
});

// Master least-count decimals; a master least count of 'NA' falls back to the UUC least_count
const masterDecimals = (point) => {
  const { uuc, master } = getLeastCounts(point);
  const mlc = lcDecimals(master);
  return mlc === 'NA' ? lcDecimals(uuc) : mlc;
};

/** PHP errorlc: the larger of the master and UUC decimals; 'NA' only when both least counts are. */
export const getDGErrorDecimals = (point, hasConversion) => {
  const uucDecimals = lcDecimals(getLeastCounts(point).uuc);
  const mlc = masterDecimals(point);
  // PHP: $lc = $mlc only when a unitconversion row was found
  const conversionFound = point?.conversion_found !== undefined ? !!point.conversion_found : hasConversion;
  const lc = conversionFound ? mlc : uucDecimals;
  if (mlc === 'NA') return lc;
  if (lc === 'NA') return mlc;
  return Math.max(mlc, lc);
};

const average = (a, b) => {
  const values = [a, b].map(toNum).filter((v) => !isNaN(v));
  return values.length ? values.reduce((s, v) => s + v, 0) / values.length : NaN;
};

/** Averages, errors and hysterisis for one row. */
export const calculateDGValues = (rowData, layout, rowMeta = {}) => {
  const result = { averageForward: '', averageBackward: '', errorForward: '', errorBackward: '', hysteresis: '' };
  if (!Array.isArray(rowData) || !layout) return result;

  const decimals = rowMeta.errorDecimals ?? 'NA';

  result.averageForward = formatTo(average(rowData[layout.set1Forward], rowData[layout.set2Forward]), decimals);
  result.averageBackward = formatTo(average(rowData[layout.set1Backward], rowData[layout.set2Backward]), decimals);

  // Errors and hysterisis read the rounded averages, as the PHP reads the average fields
  const avgF = toNum(result.averageForward);
  const avgB = toNum(result.averageBackward);
  const uuc = toNum(rowData[layout.uuc]);

  if (!isNaN(uuc)) {
    if (!isNaN(avgF)) result.errorForward = formatTo(avgF - uuc, decimals);
    if (!isNaN(avgB)) result.errorBackward = formatTo(avgB - uuc, decimals);
  }
  if (!isNaN(avgF) && !isNaN(avgB)) {
    result.hysteresis = formatTo(Math.abs(avgF - avgB), decimals);
  }

  return result;
};

/** Writes the calculated values into their cells, keyed like tableInputValues. */
export const getDGCalculatedCells = (rowIndex, calculated, layout) => ({
  [`${rowIndex}-${layout.averageForward}`]: calculated.averageForward,
  [`${rowIndex}-${layout.averageBackward}`]: calculated.averageBackward,
  [`${rowIndex}-${layout.errorForward}`]: calculated.errorForward,
  [`${rowIndex}-${layout.errorBackward}`]: calculated.errorBackward,
  [`${rowIndex}-${layout.hysterisis}`]: calculated.hysteresis,
});

export const isDGReadingColumn = (colIndex, layout) =>
  colIndex >= layout.set1Forward && colIndex <= layout.set2Backward;

/** Summary-table type/repeatable of an editable reading cell, or null. */
export const getDGFieldType = (colIndex, layout) => {
  switch (colIndex) {
    case layout.set1Forward: return { type: 'masterinc', repeatable: '0' };
    case layout.set1Backward: return { type: 'masterdec', repeatable: '0' };
    case layout.set2Forward: return { type: 'masterinc', repeatable: '1' };
    case layout.set2Backward: return { type: 'masterdec', repeatable: '1' };
    default: return null;
  }
};

/** Every value the PHP form posts for one row, in posting order. */
export const getDGRowEntries = (rowData, calculated, layout) => {
  const entries = [];
  if (layout.hasConversion) {
    entries.push({ type: 'calculateduuc', repeatable: '0', value: rowData[layout.nominal] });
  }
  entries.push(
    { type: 'uuc', repeatable: '0', value: rowData[layout.uuc] },
    { type: 'masterinc', repeatable: '0', value: rowData[layout.set1Forward] },
    { type: 'masterdec', repeatable: '0', value: rowData[layout.set1Backward] },
    { type: 'masterinc', repeatable: '1', value: rowData[layout.set2Forward] },
    { type: 'masterdec', repeatable: '1', value: rowData[layout.set2Backward] },
    { type: 'averagemasterinc', repeatable: '0', value: calculated.averageForward },
    { type: 'averagemasterdec', repeatable: '0', value: calculated.averageBackward },
    { type: 'errorinc', repeatable: '0', value: calculated.errorForward },
    { type: 'errordec', repeatable: '0', value: calculated.errorBackward },
    { type: 'hysterisis', repeatable: '0', value: calculated.hysteresis },
  );
  return entries.map((e) => ({ ...e, value: isBlank(e.value) ? '0' : String(e.value) }));
};

/** Calculated fields posted alongside a changed reading. */
export const getDGCalculatedEntries = (calculated) => [
  { type: 'averagemasterinc', repeatable: '0', value: calculated.averageForward || '0' },
  { type: 'averagemasterdec', repeatable: '0', value: calculated.averageBackward || '0' },
  { type: 'errorinc', repeatable: '0', value: calculated.errorForward || '0' },
  { type: 'errordec', repeatable: '0', value: calculated.errorBackward || '0' },
  { type: 'hysterisis', repeatable: '0', value: calculated.hysteresis || '0' },
];

/** Nominal required,number; readings required,number,inleastcount,divisibleby against the UUC least count. */
export const validateDGRow = (rowData, rowIndex, layout, rowMeta = {}, validateLeastCount) => {
  const errors = {};

  const required = [layout.nominal, layout.uuc];
  for (let col = layout.set1Forward; col <= layout.set2Backward; col++) required.push(col);

  [...new Set(required)].forEach((col) => {
    const key = `${rowIndex}-${col}`;
    const value = rowData[col];
    if (isBlank(value)) {
      errors[key] = 'This field is required';
      return;
    }
    if (isNaN(toNum(value))) {
      errors[key] = 'Please enter a valid number';
      return;
    }
    if (isDGReadingColumn(col, layout) && rowMeta.readingLeastCount && validateLeastCount) {
      const { isValid, error } = validateLeastCount(String(value).trim(), rowMeta.readingLeastCount);
      if (!isValid) errors[key] = error;
    }
  });

  return errors;
};

// PHP sprintf("%.0Nf") of the nominal, skipped when the precision is 'NA'
const formatNominal = (value, decimals) => {
  const num = toNum(value);
  if (isNaN(num) || decimals === 'NA') return safeGetValue(value);
  return num.toFixed(decimals);
};

/** Row generator for DG. */
export const createDGRows = (dataArray) => {
  const points = (Array.isArray(dataArray) ? dataArray : []).filter(Boolean);
  // The PHP decides the header from the first calibration point
  const hasConversion = points.length > 0 && pointHasConversion(points[0]);
  const layout = getDGLayout(hasConversion);

  const rows = [];
  const rowMeta = [];
  const calibrationPoints = [];
  const types = [];
  const repeatables = [];
  const values = [];

  points.forEach((point, index) => {
    const { uuc: uucLc } = getLeastCounts(point);
    const mlc = masterDecimals(point);
    const lc = lcDecimals(uucLc);

    const row = [pick(point, 'sr_no', 'sequence_number') || String(index + 1)];
    if (hasConversion) {
      // calculateduuc: the point converted to the master unit; uuc: the point itself.
      // PHP shows both to the UUC lc, unrounded when the master lc is 'NA'.
      const shownDecimals = mlc === 'NA' ? 'NA' : lc;
      row.push(formatNominal(pick(point, 'calculated_uuc', 'calculateduuc'), shownDecimals));
      row.push(formatNominal(pick(point, 'point'), shownDecimals));
    } else {
      row.push(formatNominal(pick(point, 'point', 'nominal_value_master', 'nominal_value_uuc', 'uuc'), mlc));
    }
    row.push(
      pick(point, 'set1_forward'),
      pick(point, 'set1_backward'),
      pick(point, 'set2_forward'),
      pick(point, 'set2_backward'),
      pick(point, 'average_forward'),
      pick(point, 'average_backward'),
      pick(point, 'error_forward'),
      pick(point, 'error_backward'),
      pick(point, 'hysterisis', 'hysteresis'),
    );

    const meta = {
      readingLeastCount: isNA(uucLc) ? null : String(uucLc).trim(),
      errorDecimals: getDGErrorDecimals(point, hasConversion),
    };

    // Stored averages/errors may predate the least-count rounding, so recalculate them
    const hasReadings = [layout.set1Forward, layout.set1Backward, layout.set2Forward, layout.set2Backward]
      .some((col) => !isBlank(row[col]));
    if (hasReadings) {
      const calculated = calculateDGValues(row, layout, meta);
      row[layout.averageForward] = calculated.averageForward;
      row[layout.averageBackward] = calculated.averageBackward;
      row[layout.errorForward] = calculated.errorForward;
      row[layout.errorBackward] = calculated.errorBackward;
      row[layout.hysterisis] = calculated.hysteresis;
    }

    rows.push(row);
    rowMeta.push(meta);
    calibrationPoints.push((point.point_id ?? point.id ?? point.calibration_point_id ?? '').toString());
    types.push('uuc');
    repeatables.push('0');
    values.push(row[layout.uuc] || '0');
  });

  return { rows, rowMeta, layout, hiddenInputs: { calibrationPoints, types, repeatables, values } };
};

/** Table config for DG. */
export const getDGTableConfig = (observations) => {
  const { rows, rowMeta, layout, hiddenInputs } = createDGRows(observations);
  const first = (Array.isArray(observations) ? observations : []).find(Boolean) || {};

  const masterUnitName = pick(first, 'master_unit_description', 'master_unit_name', 'master_unit_label');
  const uucUnitName = pick(first, 'unit_description', 'uuc_unit_description', 'unit_name', 'unit_label');
  const withUnit = (label, unit) => (unit ? `${label} (${unit})` : label);

  const singleHeaders = ['Sr no', withUnit('Nominal Value', masterUnitName || 'Master Unit')];
  if (layout.hasConversion) singleHeaders.push(withUnit('Nominal Value', uucUnitName || 'UUC Unit'));

  return {
    id: 'observationdg',
    name: 'Observation DG',
    category: 'Digital Gauge',
    structure: {
      thermalCoeff: true,
      singleHeaders,
      subHeaders: {
        [withUnit('Set 1', uucUnitName)]: ['Forward Reading', 'Backward Reading'],
        [withUnit('Set 2', uucUnitName)]: ['Forward Reading', 'Backward Reading'],
        [withUnit('Average', uucUnitName)]: ['Forward Reading', 'Backward Reading'],
        [withUnit('Error', uucUnitName)]: ['Forward Reading', 'Backward Reading'],
      },
      remainingHeaders: [withUnit('Hysterisis', uucUnitName)],
    },
    staticRows: rows,
    rowMeta,
    dgLayout: layout,
    hiddenInputs,
  };
};

const ObservationDG = () => null;
export default ObservationDG;
