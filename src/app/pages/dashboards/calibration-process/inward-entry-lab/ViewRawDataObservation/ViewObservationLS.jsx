import { safeGetValue } from './viewRawDataUtils';

/**
 * LS raw-data view. Port of rawdatals.php.
 *
 * Section 3 - unit types listed in the electricalsafety table
 *   ("3. PERFORMANCE TESTING", or "3. ELECTRICAL SAFETY TEST" with showelectricalsafety):
 *   Measure (only when showperformancetest is Yes):
 *     Parameter | [Set Point | Reading on Master] | Reading on UUC 1-5 | Average On UUC | [Deviation] | Tolerance
 *   Source:
 *     Parameter | [Setpoint | Reading on UUC] | Reading on Master 1-5 | Average On Master | [Deviation]
 *     | Tolerance | [(±) Expanded Uncertainty | Remarks]
 *   The bracketed columns are hidden when showelectricalsafety is Yes.
 *
 * Section 4 "4. PERFORMANCE TESTING" - every other unit type, every column:
 *   Measure: Parameter | Set Point | Reading on Master | Reading on UUC 1-5 | Average On UUC | Deviation | Tolerance
 *   Source:  Parameter | Setpoint | Reading on UUC | Reading on Master 1-5 | Average On Master | Deviation | Tolerance
 *
 * The fixed readings are the calibration point to the master (Measure) or UUC (Source) least-count
 * decimals; everything else is shown as saved. Expanded Uncertainty is the point's value to the
 * instrument's digitincmc decimals (the saved summary value for NIBP).
 */

export const LS_VIEW_READINGS = 5;

export const lsTableConfig = {
  id: 'observationls',
  name: 'Observation LS',
  category: 'LS',
  structure: {
    singleHeaders: ['Parameter', 'Set Point', 'Reading on Master'],
    subHeaders: {
      'Reading on UUC': ['1', '2', '3', '4', '5'],
    },
    remainingHeaders: ['Average On UUC', 'Deviation', 'Tolerance'],
  },
};

const isBlank = (val) => val === undefined || val === null || String(val).trim() === '';
const isNA = (val) => isBlank(val) || String(val).trim().toUpperCase() === 'NA';
const isYes = (val) => String(val ?? '').trim().toLowerCase() === 'yes';
const truthy = (v) => v === true || v === 1 || v === '1' || String(v).toLowerCase() === 'yes';

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

// PHP sprintf("%.0Nf"); an 'NA' least count leaves the value as it is
const formatToLc = (value, leastCount) => {
  const num = parseFloat(value);
  if (isNaN(num) || isNA(leastCount)) return safeGetValue(value);
  const s = String(leastCount).trim();
  return num.toFixed(s.includes('.') ? s.split('.')[1].length : 0);
};

// Section keys the API may group points under; the key tells us the section when a point doesn't
const SECTION_KEYS = {
  electrical_safety_measure: 'es',
  electrical_safety_source: 'es',
  electric_safety_measure: 'es',
  electric_safety_source: 'es',
  electrical_safety: 'es',
  performance_testing_measure: 'perf',
  performance_testing_source: 'perf',
  performance_test: 'perf',
};

/** Flattens the LS response into points, tagging each with its section when the grouping says so. */
export const parseLSDynamicData = (observationData) => {
  const root = observationData?.data && !Array.isArray(observationData.data) ? observationData.data : observationData;
  if (Array.isArray(root)) return root;

  const grouped = Object.entries(SECTION_KEYS).flatMap(([key, section]) =>
    (Array.isArray(root?.[key]) ? root[key] : []).map((p) => ({ ls_section: section, ...p })));
  if (grouped.length > 0) return grouped;

  return [root?.calibration_points, root?.observations, root?.points, observationData?.data].find(Array.isArray) || [];
};

const isElectricalSafetyPoint = (point) => {
  if (point?.ls_section) return point.ls_section === 'es';
  if (point?.is_electrical_safety !== undefined) return truthy(point.is_electrical_safety);
  const section = String(point?.section ?? point?.biomedical_section ?? '').toLowerCase();
  return section.includes('electric') || section.includes('safety');
};

/** Display values for one point. */
export const getLSViewPoint = (point, index = 0, digitInCmc) => {
  const isMeasure = String(point.mode || 'Measure').toLowerCase() !== 'source';
  const parameter = pick(point, 'parameter', 'parameter_value') || pick(point, 'unittype', 'unit_type');
  const rawPoint = pick(point, 'setpoint', 'set_point', 'point', 'test_point');
  const uucLc = pick(point, 'least_count', 'leastcount', 'uuc_least_count') || pick(point?.precision, 'uuc_least_count');
  const masterLc = pick(point, 'master_least_count', 'masterleastcount') || pick(point?.precision, 'master_least_count');

  const units = {
    uuc: pick(point, 'unit_description', 'uuc_unit_description', 'unit_name'),
    master: pick(point, 'master_unit_description', 'master_unit_name'),
  };

  const readingList = isMeasure
    ? (point.uuc_readings ?? point.observations)
    : (point.master_readings ?? point.observations);

  // Point's expanded uncertainty to digitincmc decimals; NIBP shows the saved summary value
  const euRaw = pick(point, 'point_expanded_uncertainty', 'expandeduncertainty', 'expanded_uncertainty');
  const digits = parseInt(digitInCmc, 10);
  const expandedUncertainty = parameter.toLowerCase() !== 'nibp' && !isNaN(digits) && !isNaN(parseFloat(euRaw))
    ? parseFloat(euRaw).toFixed(digits)
    : euRaw;

  return {
    key: (point.calibration_point_id ?? point.point_id ?? point.id ?? index).toString(),
    section: isElectricalSafetyPoint(point) ? 'es' : 'perf',
    isMeasure,
    unitType: pick(point, 'unittype', 'unit_type') || parameter,
    parameter,
    setpoint: rawPoint,
    fixedReading: isMeasure ? formatToLc(rawPoint, masterLc) : formatToLc(rawPoint, uucLc),
    units,
    readings: Array.from({ length: LS_VIEW_READINGS }, (_, i) => readingAt(readingList, i)),
    average: isMeasure
      ? pick(point, 'average_uuc', 'averageuuc', 'average')
      : pick(point, 'average_master', 'averagemaster', 'average'),
    error: pick(point, 'error', 'deviation', 'deviation_error') || pick(point?.calculations, 'error'),
    specification: pick(point, 'specification', 'tolerance'),
    expandedUncertainty,
    remark: pick(point, 'remark', 'remarks'),
  };
};

const groupByUnitType = (points) => {
  const order = [];
  const byType = {};
  points.forEach((p) => {
    if (!byType[p.unitType]) { byType[p.unitType] = []; order.push(p.unitType); }
    byType[p.unitType].push(p);
  });
  return order.flatMap((k) => byType[k]);
};

/** The four PHP tables, in PHP order. */
export const splitLSViewPoints = (observations, digitInCmc) => {
  const points = (Array.isArray(observations) ? observations : [])
    .filter(Boolean)
    .map((p, i) => getLSViewPoint(p, i, digitInCmc));
  const table = (section, measure) =>
    groupByUnitType(points.filter((p) => p.section === section && p.isMeasure === measure));
  return {
    esMeasure: table('es', true),
    esSource: table('es', false),
    perfMeasure: table('perf', true),
    perfSource: table('perf', false),
  };
};

/** Flat rows so ViewRawData's "has rows" check passes; the component draws the real tables. */
export const createLSRows = (dataArray) => {
  const rows = (Array.isArray(dataArray) ? dataArray : []).filter(Boolean).map((p, i) => {
    const v = getLSViewPoint(p, i);
    return [v.parameter, v.setpoint, v.fixedReading, ...v.readings, v.average, v.error, v.specification];
  });
  return { rows };
};

const TH = 'border border-gray-300 px-3 py-2 text-center font-medium text-gray-700';
const TD = 'border border-gray-300 px-3 py-2 text-gray-800';

const WithUnit = ({ value, unit }) => (
  <>
    {isBlank(value) ? '-' : value}
    {unit && !isBlank(value) ? <span className="ml-1 text-xs text-gray-500">{unit}</span> : null}
  </>
);

/**
 * One table. `layout`:
 *   fixed - Set Point + fixed reading, error - Deviation, extras - Expanded Uncertainty + Remarks
 */
const LSTable = ({ points, isMeasure, layout }) => (
  <div className="overflow-x-auto mb-4">
    <table className="w-full border border-gray-300 text-sm">
      <thead>
        <tr className="bg-gray-100">
          <th rowSpan={2} className={TH}>Parameter</th>
          {layout.fixed && <th rowSpan={2} className={TH}>{isMeasure ? 'Set Point' : 'Setpoint'}</th>}
          {layout.fixed && <th rowSpan={2} className={TH}>{isMeasure ? 'Reading on Master' : 'Reading on UUC'}</th>}
          <th colSpan={LS_VIEW_READINGS} className={TH}>{isMeasure ? 'Reading on UUC' : 'Reading on Master'}</th>
          <th rowSpan={2} className={TH}>{isMeasure ? 'Average On UUC' : 'Average On Master'}</th>
          {layout.error && <th rowSpan={2} className={TH}>Deviation</th>}
          <th rowSpan={2} className={TH}>Tolerance</th>
          {layout.extras && <th rowSpan={2} className={TH}>(±) Expanded Uncertainty</th>}
          {layout.extras && <th rowSpan={2} className={TH}>Remarks</th>}
        </tr>
        <tr className="bg-gray-50">
          {Array.from({ length: LS_VIEW_READINGS }, (_, i) => (
            <th key={i} className={TH}>{i + 1}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {points.map((p) => (
          <tr key={p.key} className="hover:bg-gray-50">
            <td className={TD}>{p.parameter || '-'}</td>
            {layout.fixed && <td className={TD}><WithUnit value={p.setpoint} unit={p.units.uuc} /></td>}
            {layout.fixed && (
              <td className={TD}>
                <WithUnit value={p.fixedReading} unit={isMeasure ? p.units.master : p.units.uuc} />
              </td>
            )}
            {p.readings.map((r, i) => (
              <td key={i} className={TD}>
                <WithUnit value={r} unit={isMeasure ? p.units.uuc : p.units.master} />
              </td>
            ))}
            {/* PHP labels both averages with the UUC unit */}
            <td className={TD}><WithUnit value={p.average} unit={p.units.uuc} /></td>
            {layout.error && <td className={TD}><WithUnit value={p.error} unit={p.units.uuc} /></td>}
            <td className={TD}>{p.specification || '-'}</td>
            {layout.extras && <td className={TD}>{isBlank(p.expandedUncertainty) ? '-' : `${p.expandedUncertainty}%`}</td>}
            {layout.extras && <td className={TD}>{p.remark || '-'}</td>}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export const ViewObservationLS = ({ observations, instrument }) => {
  const showES = isYes(instrument?.showelectricalsafety);
  // PHP draws the section 3 Measure table only when showperformancetest is Yes; a missing flag counts as Yes
  const showPerformance = String(instrument?.showperformancetest ?? 'Yes').trim().toLowerCase() !== 'no';
  const { esMeasure, esSource, perfMeasure, perfSource } = splitLSViewPoints(observations, instrument?.digitincmc);

  if (esMeasure.length + esSource.length + perfMeasure.length + perfSource.length === 0) {
    return <div className="text-center py-4 text-gray-500">No LS observations found.</div>;
  }

  const sectionTitle = 'font-semibold text-sm mb-2 text-gray-800 uppercase';

  return (
    <div>
      {((showPerformance && esMeasure.length > 0) || esSource.length > 0) && (
        <div className="mb-6">
          <div className={sectionTitle}>{showES ? '3. Electrical Safety Test' : '3. Performance Testing'}</div>
          {showPerformance && esMeasure.length > 0 && (
            <LSTable points={esMeasure} isMeasure layout={{ fixed: !showES, error: !showES }} />
          )}
          {esSource.length > 0 && (
            <LSTable points={esSource} isMeasure={false} layout={{ fixed: !showES, error: !showES, extras: !showES }} />
          )}
        </div>
      )}

      {(perfMeasure.length > 0 || perfSource.length > 0) && (
        <div className="mb-6">
          <div className={sectionTitle}>4. Performance Testing</div>
          {perfMeasure.length > 0 && <LSTable points={perfMeasure} isMeasure layout={{ fixed: true, error: true }} />}
          {perfSource.length > 0 && <LSTable points={perfSource} isMeasure={false} layout={{ fixed: true, error: true }} />}
        </div>
      )}
    </div>
  );
};

export default ViewObservationLS;
