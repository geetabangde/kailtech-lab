import { safeGetValue } from './viewRawDataUtils';

/**
 * LMS raw-data view. Port of the observationlms view PHP.
 *
 * Measure table:
 *   Sr. No. | Unit type | Range | Nominal/ Set Value on master (converted, master unit)
 *   | Nominal/ Set Value on master (point, UUC unit) | Observation on UUC 1-5 | Average | Error
 *
 * Source table:
 *   Sr. No. | Unit type | Range | Nominal/ Set Value on UUC (point, UUC unit)
 *   | Nominal/ Set Value on UUC (converted, master unit) | Observation on Master 1-5 | Average | Error
 *
 * Nominal values are shown to their least-count decimals, or "NA" on the Measure side when the
 * master least count is NA. Readings, averages and errors are shown as saved.
 */

export const LMS_VIEW_READINGS = 5;

export const lmsTableConfig = {
  id: 'observationlms',
  name: 'Observation LMS',
  category: 'LMS',
  structure: {
    singleHeaders: ['Sr. No.', 'Unit type', 'Range', 'Nominal/ Set Value on master', 'Nominal/ Set Value on master'],
    subHeaders: {
      'Observation on UUC': ['Observation 1', 'Observation 2', 'Observation 3', 'Observation 4', 'Observation 5'],
    },
    remainingHeaders: ['Average', 'Error'],
  },
};

const isBlank = (val) => val === undefined || val === null || String(val).trim() === '';
const isNA = (val) => isBlank(val) || String(val).trim().toUpperCase() === 'NA';

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

const decimalsOf = (leastCount) => {
  if (isNA(leastCount)) return 'NA';
  const s = String(leastCount).trim();
  return s.includes('.') ? s.split('.')[1].length : 0;
};

// PHP sprintf("%.0Nf"); `naText` is what the view prints for an 'NA' precision
const formatTo = (value, decimals, naText) => {
  if (decimals === 'NA') return naText ?? safeGetValue(value);
  const num = parseFloat(value);
  return isNaN(num) ? safeGetValue(value) : num.toFixed(decimals);
};

/** Flattens MM-style unit_type groups and returns the calibration points. */
export const parseLMSDynamicData = (observationData) => {
  const root = observationData?.data && !Array.isArray(observationData.data) ? observationData.data : observationData;
  if (Array.isArray(root?.unit_types)) {
    return root.unit_types.flatMap((group) => (group?.calibration_points || [])
      .map((p) => ({ unittype: group.unit_type ?? group.unittype, ...p })));
  }
  return [root, observationData?.data, root?.calibration_points, root?.observations, root?.points].find(Array.isArray) || [];
};

/** Display values for one point. */
export const getLMSViewPoint = (point, index = 0) => {
  const isMeasure = String(point.mode || 'Measure').toLowerCase() !== 'source';
  const nominals = point.nominal_values || {};

  const lc = decimalsOf(pick(point, 'least_count', 'leastcount', 'uuc_least_count') || pick(point?.precision, 'uuc_least_count'));
  const mainMlc = decimalsOf(pick(point, 'master_least_count', 'masterleastcount') || pick(point?.precision, 'master_least_count'));
  const convertedLc = pick(point, 'converted_least_count');
  const convertedMlc = pick(point, 'converted_master_least_count');
  const mlc = convertedMlc ? decimalsOf(convertedMlc) : mainMlc;
  const testLc = convertedLc ? decimalsOf(convertedLc) : lc;

  const rawPoint = pick(point, 'point', 'set_point', 'test_point');
  const testpoint = pick(point, 'testpoint', 'test_point_converted', 'calculated_master', 'calculatedmaster')
    || pick(nominals.calculated_master, 'value')
    || rawPoint;

  const units = {
    uuc: pick(point, 'unit_description', 'uuc_unit_description', 'unit_name'),
    master: pick(point, 'master_unit_description', 'master_unit_name'),
  };

  const readingList = isMeasure
    ? (point.uuc_readings ?? point.observations)
    : (point.master_readings ?? point.observations);

  return {
    key: (point.point_id ?? point.calibration_point_id ?? point.id ?? index).toString(),
    isMeasure,
    unitType: pick(point, 'unittype', 'unit_type'),
    range: pick(point, 'range'),
    nominals: isMeasure
      ? [
        { value: formatTo(testpoint, mainMlc, 'NA'), unit: units.master },
        { value: formatTo(rawPoint, mlc, 'NA'), unit: units.uuc },
      ]
      : [
        { value: formatTo(rawPoint, lc), unit: units.uuc },
        { value: formatTo(testpoint, testLc), unit: units.master },
      ],
    readings: Array.from({ length: LMS_VIEW_READINGS }, (_, i) => readingAt(readingList, i)),
    readingUnit: isMeasure ? units.uuc : units.master,
    average: isMeasure
      ? pick(point, 'average_uuc', 'averageuuc', 'average') || pick(point?.calculations, 'average')
      : pick(point, 'average_master', 'averagemaster', 'average') || pick(point?.calculations, 'average'),
    error: pick(point, 'error', 'deviation', 'deviation_error') || pick(point?.calculations, 'error'),
  };
};

/** Flat rows so ViewRawData's "has rows" check passes; the component draws the real tables. */
export const createLMSRows = (dataArray) => {
  const rows = (Array.isArray(dataArray) ? dataArray : []).filter(Boolean).map((p, i) => {
    const v = getLMSViewPoint(p, i);
    return [String(i + 1), v.unitType, v.range, v.nominals[0].value, v.nominals[1].value, ...v.readings, v.average, v.error];
  });
  return { rows };
};

const TH = 'border border-gray-300 px-3 py-2 text-center font-medium text-gray-700';
const TD = 'border border-gray-300 px-3 py-2 text-gray-800';

const WithUnit = ({ value, unit }) => (
  <>
    {value || '-'}
    {unit && value ? <span className="ml-1 text-xs text-gray-500">{unit}</span> : null}
  </>
);

const LMSTable = ({ title, points, isMeasure }) => (
  <div className="mb-6">
    <div className="font-semibold text-sm mb-2 text-gray-800">{title}</div>
    <div className="overflow-x-auto">
      <table className="w-full border border-gray-300 text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th rowSpan={2} className={TH}>Sr. No.</th>
            <th rowSpan={2} className={TH}>Unit type</th>
            <th rowSpan={2} className={TH}>Range</th>
            <th rowSpan={2} className={TH}>Nominal/ Set Value on {isMeasure ? 'master' : 'UUC'}</th>
            <th rowSpan={2} className={TH}>Nominal/ Set Value on {isMeasure ? 'master' : 'UUC'}</th>
            <th colSpan={LMS_VIEW_READINGS} className={TH}>Observation on {isMeasure ? 'UUC' : 'Master'}</th>
            <th rowSpan={2} className={TH}>Average</th>
            <th rowSpan={2} className={TH}>Error</th>
          </tr>
          <tr className="bg-gray-50">
            {Array.from({ length: LMS_VIEW_READINGS }, (_, i) => (
              <th key={i} className={TH}>Observation {i + 1}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {points.map((p, i) => (
            <tr key={p.key} className="hover:bg-gray-50">
              <td className={`${TD} text-center`}>{i + 1}</td>
              <td className={TD}>{p.unitType || '-'}</td>
              <td className={TD}>{p.range || '-'}</td>
              {p.nominals.map((n, k) => (
                <td key={k} className={TD}><WithUnit value={n.value} unit={n.unit} /></td>
              ))}
              {p.readings.map((r, k) => (
                <td key={k} className={TD}><WithUnit value={r} unit={p.readingUnit} /></td>
              ))}
              <td className={TD}>{p.average || '-'}</td>
              <td className={TD}>{p.error || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export const ViewObservationLMS = ({ observations }) => {
  const points = (Array.isArray(observations) ? observations : []).filter(Boolean).map(getLMSViewPoint);
  const measure = points.filter((p) => p.isMeasure);
  const source = points.filter((p) => !p.isMeasure);

  if (points.length === 0) {
    return <div className="text-center py-4 text-gray-500">No LMS observations found.</div>;
  }

  return (
    <div>
      {measure.length > 0 && <LMSTable title="Measure" points={measure} isMeasure />}
      {source.length > 0 && <LMSTable title="Source" points={source} isMeasure={false} />}
    </div>
  );
};

export default ViewObservationLMS;
