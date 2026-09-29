import { safeGetValue } from './observationUtils';

/**
 * EXTEN (Extensometer) observation. Port of observationexten.php.
 *
 * Thermal Co-eff of UUC / MASTER are saved against the instrument (shared thermalCoeff section).
 *
 * Then, per matrix:
 *   Verification Range  min point to max point (unit)
 *   Nominal Gauge Length Le   (nominallength,  entered)       saved against the matrix id
 *   Measured Gauge Length Le  (measuredlength, entered)
 *   Relative Error (%)        (releativeerror) = (measured - nominal) / nominal * 100, 2dp
 *
 * and a table with one row per calibration point, two sets:
 *   Set Reading On UUC li  (uuc n, readonly)   = point to the UUC least-count decimals
 *   Reading On Master lt   (master n, entered)
 *   Absolute Bias Error    (error n)           = |uuc - master|, unrounded ('NA')
 *   Relative Bias Error %  (percenterror n)    = error / uuc * 100, 2dp
 */

export const EXTEN_SETS = 2;

const isBlank = (val) => val === undefined || val === null || String(val).trim() === '';
const isNA = (val) => isBlank(val) || String(val).trim().toUpperCase() === 'NA';
const toNum = (val) => (isBlank(val) ? NaN : Number(String(val).trim()));

// Unrounded like PHP's 'NA' precision, with float noise stripped
const formatUnrounded = (num) => (Number.isFinite(num) ? String(Number(num.toFixed(10))) : '');

const to2 = (num) => (Number.isFinite(num) ? num.toFixed(2).replace(/^-(0\.00)$/, '$1') : '');

const pick = (obj, ...keys) => {
  for (const key of keys) {
    const val = safeGetValue(obj?.[key]);
    if (val !== '') return val;
  }
  return '';
};

const readingAt = (list, i) => {
  const item = Array.isArray(list) ? list[i] : undefined;
  return safeGetValue(item && typeof item === 'object' ? item.value : item);
};

// PHP sprintf("%.0Nf") of the point; left as-is for an 'NA' least count
const formatToLc = (value, leastCount) => {
  const num = toNum(value);
  if (isNaN(num) || isNA(leastCount)) return safeGetValue(value);
  const s = String(leastCount).trim();
  return num.toFixed(s.includes('.') ? s.split('.')[1].length : 0);
};

export const extenPointKey = (pointId, field) => `exten-p${pointId}-${field}`;
export const extenMatrixKey = (matrixId, field) => `exten-m${matrixId}-${field}`;

const getPointId = (p, i) => (p.calibration_point_id ?? p.point_id ?? p.id ?? `pt-${i}`).toString();
const getMatrixId = (m) => (m.matrix_id ?? m.matrixid ?? m.id ?? '').toString();

/**
 * Normalises the API data into matrices. Accepts either a list of matrices each carrying
 * `calibration_points`, or a flat list of points (grouped by their matrix id).
 */
export const getEXTENMatrices = (data) => {
  const list = (Array.isArray(data) ? data : []).filter(Boolean);
  const nested = list.some((m) => Array.isArray(m.calibration_points) || Array.isArray(m.points));

  const groups = nested
    ? list.map((m) => ({ matrix: m, points: m.calibration_points ?? m.points ?? [] }))
    : Object.values(list.reduce((acc, p) => {
        const id = (p.matrix_id ?? p.matrixid ?? 'default').toString();
        if (!acc[id]) acc[id] = { matrix: { ...p, matrix_id: id }, points: [] };
        acc[id].points.push(p);
        return acc;
      }, {}));

  return groups.map(({ matrix, points }, mIndex) => {
    const matrixId = getMatrixId(matrix) || `matrix-${mIndex + 1}`;
    const leastCount = pick(matrix, 'least_count', 'leastcount', 'uuc_least_count')
      || pick(points[0], 'least_count', 'leastcount');
    const unitLabel = pick(matrix, 'unit_description', 'uuc_unit_description', 'unit_name', 'unit_label')
      || pick(points[0], 'unit_description', 'unit_name');

    const pts = points.filter(Boolean).map((p, i) => {
      const uuc = formatToLc(pick(p, 'point', 'nominal_value', 'uuc_value'), leastCount);
      const masterList = p.master_readings ?? p.masters ?? p.observations;
      return {
        pointId: getPointId(p, i),
        srNo: pick(p, 'sr_no', 'sequence_number') || String(i + 1),
        uuc,
        stored: {
          masters: Array.from({ length: EXTEN_SETS }, (_, s) =>
            readingAt(masterList, s) || pick(p, `master${s}`, `master_${s}`)),
        },
      };
    });

    // PHP: min/max of CAST(point AS DECIMAL(10,2))
    const nums = points.map((p) => toNum(pick(p, 'point', 'nominal_value'))).filter((v) => !isNaN(v));
    const range = nums.length
      ? { min: Math.min(...nums).toFixed(2), max: Math.max(...nums).toFixed(2) }
      : null;

    return {
      matrixId,
      matrixType: pick(matrix, 'matrix_type', 'matrixtype', 'matrix_name'),
      unitLabel,
      leastCount,
      range: pick(matrix, 'verification_range') || (range ? `${range.min} to ${range.max}` : ''),
      stored: {
        nominallength: pick(matrix, 'nominal_length', 'nominallength', 'nominal_gauge_length'),
        measuredlength: pick(matrix, 'measured_length', 'measuredlength', 'measured_gauge_length'),
      },
      points: pts,
    };
  });
};

/** calculatereleativeerror(): (measured - nominal) / nominal * 100, 2dp */
export const calculateRelativeError = (nominal, measured) => {
  const n = toNum(nominal);
  const m = toNum(measured);
  if (isNaN(n) || isNaN(m) || n === 0) return '';
  return to2(((m - n) / n) * 100);
};

export const getEXTENMatrixValues = (matrix, tableInputValues = {}) => {
  const nominallength = tableInputValues[extenMatrixKey(matrix.matrixId, 'nominallength')] ?? matrix.stored.nominallength;
  const measuredlength = tableInputValues[extenMatrixKey(matrix.matrixId, 'measuredlength')] ?? matrix.stored.measuredlength;
  return { nominallength, measuredlength, releativeerror: calculateRelativeError(nominallength, measuredlength) };
};

/** abssubstractminus + percenterror for each set. Absolute, so the error mode doesn't change it. */
export const getEXTENPointValues = (point, tableInputValues = {}) => {
  const masters = point.stored.masters.map((v, s) => tableInputValues[extenPointKey(point.pointId, `master${s}`)] ?? v);
  const uuc = toNum(point.uuc);
  const errors = masters.map((m) => {
    const master = toNum(m);
    return isNaN(master) || isNaN(uuc) ? '' : formatUnrounded(Math.abs(uuc - master));
  });
  const percentErrors = errors.map((e) => {
    const err = toNum(e);
    return isNaN(err) || isNaN(uuc) || uuc === 0 ? '' : to2((err / uuc) * 100);
  });
  return { masters, errors, percentErrors };
};

const clean = (entries) => entries
  .filter((e) => !isBlank(e.value))
  .map((e) => ({ ...e, value: String(e.value) }));

export const getEXTENMatrixEntries = (values) => clean([
  { type: 'nominallength', repeatable: '0', value: values.nominallength },
  { type: 'measuredlength', repeatable: '0', value: values.measuredlength },
  { type: 'releativeerror', repeatable: '0', value: values.releativeerror },
]);

export const getEXTENPointEntries = (point, values) => clean(
  Array.from({ length: EXTEN_SETS }, (_, s) => [
    { type: 'uuc', repeatable: String(s), value: point.uuc },
    { type: 'master', repeatable: String(s), value: values.masters[s] },
    { type: 'error', repeatable: String(s), value: values.errors[s] },
    { type: 'percenterror', repeatable: String(s), value: values.percentErrors[s] },
  ]).flat()
);

/** PHP: gauge lengths and master readings required,number. */
export const validateEXTEN = (data, tableInputValues) => {
  const errors = {};
  const need = (key, value) => {
    if (isBlank(value)) errors[key] = 'This field is required';
    else if (isNaN(toNum(value))) errors[key] = 'Please enter a valid number';
  };
  getEXTENMatrices(data).forEach((matrix) => {
    const mv = getEXTENMatrixValues(matrix, tableInputValues);
    need(extenMatrixKey(matrix.matrixId, 'nominallength'), mv.nominallength);
    need(extenMatrixKey(matrix.matrixId, 'measuredlength'), mv.measuredlength);
    matrix.points.forEach((point) => {
      getEXTENPointValues(point, tableInputValues).masters.forEach((v, s) => {
        need(extenPointKey(point.pointId, `master${s}`), v);
      });
    });
  });
  return errors;
};

/** Readable name for an EXTEN error key, for the submit toast. */
export const describeEXTENErrorKey = (key, data) => {
  for (const matrix of getEXTENMatrices(data)) {
    const title = matrix.matrixType || `Matrix ${matrix.matrixId}`;
    if (key === extenMatrixKey(matrix.matrixId, 'nominallength')) return `${title}: Nominal Gauge Length`;
    if (key === extenMatrixKey(matrix.matrixId, 'measuredlength')) return `${title}: Measured Gauge Length`;
    for (const point of matrix.points) {
      const set = String(key).match(new RegExp(`^exten-p${point.pointId}-master(\\d)$`));
      if (set) return `${title}, Row ${point.srNo} (${point.uuc}): Set ${Number(set[1]) + 1} Reading On Master`;
    }
  }
  return String(key);
};

export const getEXTENTableConfig = (observations) => {
  const points = getEXTENMatrices(observations).flatMap((m) => m.points);
  return {
    id: 'observationexten',
    name: 'Observation EXTEN',
    category: 'Extensometer',
    // thermalCoeff shows the shared Thermal Co-eff of UUC / MASTER inputs
    structure: { thermalCoeff: true, singleHeaders: [], subHeaders: {}, remainingHeaders: [] },
    // One row per point so the shared hidden-input lookups still resolve a point id
    staticRows: points.map((p) => [p.srNo, p.uuc]),
    hiddenInputs: {
      calibrationPoints: points.map((p) => p.pointId),
      types: points.map(() => 'uuc'),
      repeatables: points.map(() => '0'),
      values: points.map((p) => p.uuc || '0'),
    },
    calibration_points: Array.isArray(observations) ? observations : [],
  };
};

const READONLY_INPUT =
  'w-full min-w-[90px] px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white cursor-not-allowed text-right font-mono';
const EDITABLE_INPUT =
  'w-full min-w-[90px] px-2 py-1 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-right font-mono';
const TD = 'px-2 py-1 text-sm border border-gray-200 dark:border-gray-600 align-top';
const TH = 'px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 uppercase border border-gray-300 dark:border-gray-600 text-center';
const LABEL = 'px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600';
const NUMERIC = /^-?\d*\.?\d*$/;

const ObservationEXTEN = ({
  selectedTableData,
  tableInputValues = {},
  setTableInputValues,
  handleObservationBlur,
  observations,
  observationErrors = {},
}) => {
  if (selectedTableData?.id !== 'observationexten') return null;

  const data = Array.isArray(selectedTableData?.calibration_points) && selectedTableData.calibration_points.length > 0
    ? selectedTableData.calibration_points
    : (Array.isArray(observations) ? observations : []);
  const matrices = getEXTENMatrices(data);

  if (matrices.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
        No calibration points available for EXTEN.
      </div>
    );
  }

  const setValue = (key, value) => {
    if (value !== '' && !NUMERIC.test(value)) return;
    setTableInputValues?.((prev) => ({ ...prev, [key]: value }));
  };

  const editable = (key, value, onBlur) => {
    const error = observationErrors[key];
    return (
      <>
        <input
          type="text"
          data-cell-key={key}
          className={`${EDITABLE_INPUT} ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
          value={value ?? ''}
          onChange={(e) => setValue(key, e.target.value)}
          onBlur={(e) => onBlur(e.target.value)}
        />
        {error && <div className="text-xs text-red-600 mt-1">{error}</div>}
      </>
    );
  };

  const readonly = (value) => <input type="text" readOnly className={READONLY_INPUT} value={value ?? ''} />;

  return (
    <div className="mb-8 space-y-8">
      {matrices.map((matrix, mIndex) => {
        const mv = getEXTENMatrixValues(matrix, tableInputValues);
        const unit = matrix.unitLabel;

        const saveMatrix = (field, value) => {
          if (!handleObservationBlur) return;
          const values = getEXTENMatrixValues(matrix, { ...tableInputValues, [extenMatrixKey(matrix.matrixId, field)]: value });
          handleObservationBlur(mIndex, 0, value, matrix.matrixId, { entries: getEXTENMatrixEntries(values) });
        };

        return (
          <div key={matrix.matrixId} className="space-y-3">
            {matrix.matrixType && (
              <h3 className="text-base font-medium text-gray-800 dark:text-white">{matrix.matrixType}</h3>
            )}

            <div className="overflow-x-auto">
              <table className="text-sm border-collapse">
                <tbody>
                  <tr>
                    <th className={LABEL}>Verification Range</th>
                    <td className={`${TD} whitespace-nowrap dark:text-white`}>{matrix.range} {unit}</td>
                    <th className={LABEL}>Nominal Gauge Length(mm) Le</th>
                    <td className={TD}>
                      {editable(extenMatrixKey(matrix.matrixId, 'nominallength'), mv.nominallength, (v) => saveMatrix('nominallength', v))}
                    </td>
                    <th className={LABEL}>Measured Gauge Length (mm)Le</th>
                    <td className={TD}>
                      {editable(extenMatrixKey(matrix.matrixId, 'measuredlength'), mv.measuredlength, (v) => saveMatrix('measuredlength', v))}
                    </td>
                    <th className={LABEL}>Relative Error on Gauge Length (%)</th>
                    <td className={TD}>{readonly(mv.releativeerror)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="overflow-x-auto border border-gray-200 dark:border-gray-600 rounded">
              <table className="w-full text-sm border-collapse">
                <thead className="bg-gray-100 dark:bg-gray-700">
                  <tr>
                    <th rowSpan={2} className={TH}>Sr no</th>
                    {Array.from({ length: EXTEN_SETS }, (_, s) => (
                      <th key={s} colSpan={4} className={TH}>{`Set ${s + 1}${unit ? ` (${unit})` : ''}`}</th>
                    ))}
                  </tr>
                  <tr>
                    {Array.from({ length: EXTEN_SETS }, (_, s) => [
                      <th key={`u${s}`} className={TH}>Set Reading On UUC li</th>,
                      <th key={`m${s}`} className={TH}>Reading On Master lt</th>,
                      <th key={`a${s}`} className={TH}>Absolute Bias Error</th>,
                      <th key={`r${s}`} className={TH}>Relative Bias Error (%)</th>,
                    ])}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800">
                  {matrix.points.map((point, pIndex) => {
                    const pv = getEXTENPointValues(point, tableInputValues);
                    const savePoint = (set, value) => {
                      if (!handleObservationBlur) return;
                      const values = getEXTENPointValues(point, {
                        ...tableInputValues,
                        [extenPointKey(point.pointId, `master${set}`)]: value,
                      });
                      handleObservationBlur(pIndex, 1 + set, value, point.pointId, { entries: getEXTENPointEntries(point, values) });
                    };

                    return (
                      <tr key={point.pointId} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className={`${TD} text-center dark:text-white`}>{point.srNo}</td>
                        {Array.from({ length: EXTEN_SETS }, (_, s) => [
                          <td key={`u${s}`} className={TD}>{readonly(point.uuc)}</td>,
                          <td key={`m${s}`} className={TD}>
                            {editable(extenPointKey(point.pointId, `master${s}`), pv.masters[s], (v) => savePoint(s, v))}
                          </td>,
                          <td key={`a${s}`} className={TD}>{readonly(pv.errors[s])}</td>,
                          <td key={`r${s}`} className={TD}>{readonly(pv.percentErrors[s])}</td>,
                        ])}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ObservationEXTEN;
