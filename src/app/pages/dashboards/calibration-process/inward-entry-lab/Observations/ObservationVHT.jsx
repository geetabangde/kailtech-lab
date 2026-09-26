import { Fragment } from 'react';
import { safeGetValue, safeGetArray, getDecimalPlaces, formatValueByLc } from './observationUtils';

/**
 * VHT (Hardness Tester) observation.
 *
 * Port of observationvht.php. Unlike the other templates, each calibration point
 * occupies TWO table rows that share one set of observation columns:
 *
 *   row 1   cuuc 0..4    the readings the operator enters      -> caverageuuc
 *   row 2   uuc  0..4    the same readings converted to the    -> averageuuc
 *                        UUC hardness scale (readonly)
 *
 * Sr. No., Nominal/Set Value, Error and % Error span both rows.
 *
 *   error         averageuuc - master (reversed when the instrument's error mode
 *                 is 'stduuc'), to max(mlc, lc) decimals
 *   percenterror  (error / master) * 100, 2dp
 *
 * The PHP derives each uuc cell from its cuuc cell through converthardness(),
 * a hardness-scale conversion whose implementation lives outside that file.
 * Pass a `convertHardness` function to reproduce it; without one the stored uuc
 * values are shown as they came from the API.
 */

export const VHT_MAX_REPEATABLE = 5;

// Column layout. Both rows of a point share the observation columns, so a cuuc
// cell and the uuc cell beneath it have the same column index.
export const VHT_COLUMNS = {
  srNo: 0,
  master: 1,
  observationStart: 2, // observationStart .. observationStart + 4 -> repeatable 0..4
  average: 7,
  error: 8,
  percenterror: 9,
};

const toNum = (val) => {
  if (val === '' || val === null || val === undefined) return NaN;
  return parseFloat(val);
};

const mean = (values) =>
  values.reduce((sum, v) => sum + v, 0) / values.length;

/**
 * Derived values for one calibration point.
 * Mirrors the averageavg / substractminus / percenterror chain the PHP wires
 * onto every cuuc input's onkeyup.
 */
export const calculateVHTValues = (enteredReadings, convertedReadings, point = {}, context = {}) => {
  const result = { caverageuuc: '', averageuuc: '', error: '', percentError: '' };

  const masterLc = point.master_least_count ?? point.masterleastcount ?? 'NA';
  const uucLc = point.least_count ?? point.leastcount ?? 'NA';
  const lc = getDecimalPlaces(uucLc);
  const mlc = getDecimalPlaces(masterLc);
  const errorLc = Math.max(mlc, lc);

  const entered = (enteredReadings || []).map(toNum).filter((v) => !isNaN(v));
  const converted = (convertedReadings || []).map(toNum).filter((v) => !isNaN(v));

  // Both averages use the UUC least count, as the PHP passes $lc to each.
  if (entered.length > 0) {
    result.caverageuuc = formatValueByLc(mean(entered), lc, uucLc);
  }
  if (converted.length > 0) {
    result.averageuuc = formatValueByLc(mean(converted), lc, uucLc);
  }

  const master = toNum(context.master);
  const avgUuc = toNum(result.averageuuc);

  if (!isNaN(master) && !isNaN(avgUuc)) {
    const diff = context.errorMode === 'stduuc' ? master - avgUuc : avgUuc - master;
    result.error = diff.toFixed(errorLc);

    if (master !== 0) {
      result.percentError = ((diff / master) * 100).toFixed(2);
    }
  }

  return result;
};

/** Row generator for VHT. Two rows per calibration point. */
export const createVHTRows = (dataArray) => {
  const rows = [];
  const calibrationPoints = [];
  const types = [];
  const repeatables = [];
  const values = [];

  const readingsOf = (source) => {
    const arr = safeGetArray(source, VHT_MAX_REPEATABLE);
    return Array.from({ length: VHT_MAX_REPEATABLE }, (_, i) => {
      const obs = arr[i];
      return safeGetValue(obs && obs.value !== undefined ? obs.value : obs);
    });
  };

  (dataArray || []).forEach((point, index) => {
    if (!point) return;

    const pointId = (point.id ?? point.point_id ?? point.calibration_point_id ?? '').toString();
    const master = safeGetValue(point.master ?? point.nominal_value ?? point.point);
    const entered = readingsOf(point.cuuc_readings ?? point.cuuc_observations ?? point.observations ?? point.cuuc);
    const converted = readingsOf(point.uuc_readings ?? point.uuc_observations ?? point.uuc);

    // Row 1: the entered readings and their average.
    rows.push([
      point.sr_no?.toString() || (index + 1).toString(),
      master,
      ...entered,
      safeGetValue(point.caverageuuc ?? point.caverage_uuc),
      safeGetValue(point.error),
      safeGetValue(point.percenterror ?? point.percent_error),
    ]);
    calibrationPoints.push(pointId);
    types.push('cuuc');
    repeatables.push('0');
    values.push(entered[0] || '0');

    // Row 2: the converted readings and their average.
    rows.push([
      '',
      '',
      ...converted,
      safeGetValue(point.averageuuc ?? point.average_uuc),
      '',
      '',
    ]);
    calibrationPoints.push(pointId);
    types.push('uuc');
    repeatables.push('0');
    values.push(converted[0] || '0');
  });

  return { rows, hiddenInputs: { calibrationPoints, types, repeatables, values } };
};

/** Table config, matching the shape the other observation configs return. */
export const getVHTTableConfig = (observations) => {
  const { rows, hiddenInputs } = createVHTRows(observations);
  return {
    id: 'observationvht',
    name: 'Observation VHT',
    category: 'Hardness',
    structure: {
      singleHeaders: ['Sr. No.', 'Nominal/ Set Value'],
      subHeaders: {
        'Observation on UUC': Array.from(
          { length: VHT_MAX_REPEATABLE },
          (_, i) => `Observation ${i + 1}`
        ),
      },
      remainingHeaders: ['Average', 'Error', '% Error'],
    },
    staticRows: rows,
    hiddenInputs,
  };
};

const READONLY_INPUT =
  'w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white cursor-not-allowed text-right font-mono';
const EDITABLE_INPUT =
  'w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-right font-mono';
const TD = 'px-2 py-1 text-sm border-r border-gray-200 dark:border-gray-600';
const TH = 'px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 uppercase border-r border-gray-300 dark:border-gray-600';

const ObservationVHT = ({
  selectedTableData,
  tableInputValues = {},
  setTableInputValues,
  handleObservationBlur,
  observations,
  instrument,
  convertHardness,
}) => {
  if (selectedTableData?.id !== 'observationvht') return null;

  const points = Array.isArray(selectedTableData?.calibration_points) && selectedTableData.calibration_points.length > 0
    ? selectedTableData.calibration_points
    : (Array.isArray(observations) ? observations : []);

  if (points.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
        No calibration points available for VHT.
      </div>
    );
  }

  const errorMode = instrument?.error ?? selectedTableData?.error_mode;

  return (
    <div className="mb-8 space-y-4">
      <h3 className="text-lg font-medium text-gray-800 dark:text-white uppercase">
        VHT (Hardness Tester) Observations
      </h3>

      <div className="overflow-x-auto border border-gray-200 dark:border-gray-600 rounded">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-700 border-b border-gray-300 dark:border-gray-600">
              <th rowSpan={2} className={TH}>Sr. No.</th>
              <th rowSpan={2} className={TH}>Nominal/ Set Value</th>
              <th colSpan={VHT_MAX_REPEATABLE} className={`${TH} text-center`}>Observation on UUC</th>
              <th rowSpan={2} className={TH}>Average</th>
              <th rowSpan={2} className={TH}>Error</th>
              <th rowSpan={2} className={TH}>% Error</th>
            </tr>
            <tr className="bg-gray-50 dark:bg-gray-600 border-b border-gray-300 dark:border-gray-600">
              {Array.from({ length: VHT_MAX_REPEATABLE }, (_, i) => (
                <td key={i} className="px-2 py-1 text-center text-xs font-medium text-gray-600 dark:text-gray-300 border-r border-gray-300 dark:border-gray-600">
                  Observation {i + 1}
                </td>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800">
            {points.map((point, pointIndex) => {
              const pointId = point.id ?? point.point_id ?? point.calibration_point_id ?? `pt-${pointIndex}`;
              const masterLc = point.master_least_count ?? point.masterleastcount ?? 'NA';
              const uucLc = point.least_count ?? point.leastcount ?? 'NA';
              const lc = getDecimalPlaces(uucLc);
              const masterUnit = point.master_unit ?? point.masterunit ?? '';

              // Nominal/Set Value: stored master reading, falling back to the
              // calibration point itself, exactly as the PHP does.
              const storedMaster = safeGetValue(point.master ?? point.master_value);
              const master = storedMaster !== '' ? storedMaster : safeGetValue(point.point ?? point.nominal_value);

              const storedEntered = safeGetArray(
                point.cuuc_readings ?? point.cuuc_observations ?? point.observations ?? point.cuuc,
                VHT_MAX_REPEATABLE
              );
              const storedConverted = safeGetArray(
                point.uuc_readings ?? point.uuc_observations ?? point.uuc,
                VHT_MAX_REPEATABLE
              );

              const valueOf = (arr, i) => {
                const obs = arr[i];
                return safeGetValue(obs && obs.value !== undefined ? obs.value : obs);
              };

              const entered = Array.from({ length: VHT_MAX_REPEATABLE }, (_, i) =>
                tableInputValues[`${pointId}-cuuc${i}`] ?? valueOf(storedEntered, i)
              );

              // Each converted cell comes from convertHardness() when one is
              // supplied, otherwise from whatever the API stored.
              const converted = Array.from({ length: VHT_MAX_REPEATABLE }, (_, i) => {
                const local = tableInputValues[`${pointId}-uuc${i}`];
                if (local !== undefined) return local;
                if (convertHardness && entered[i] !== '' && entered[i] !== undefined) {
                  const result = convertHardness(entered[i], master, masterUnit, lc);
                  if (result !== undefined && result !== null && result !== '') return result;
                }
                return valueOf(storedConverted, i);
              });

              const derived = calculateVHTValues(entered, converted, point, { master, errorMode });

              return (
                <Fragment key={pointId}>
                  {/* Row 1: entered readings */}
                  <tr className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td rowSpan={2} className={`${TD} text-center dark:text-white align-middle`}>
                      {point.sr_no ?? pointIndex + 1}
                    </td>

                    <td rowSpan={2} className={`${TD} align-middle`}>
                      <input
                        type="text"
                        readOnly
                        className={READONLY_INPUT}
                        value={formatValueByLc(master, lc, uucLc)}
                      />
                    </td>

                    {entered.map((reading, pn) => (
                      <td key={pn} className={TD}>
                        <input
                          type="number"
                          step="any"
                          className={EDITABLE_INPUT}
                          value={reading}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (setTableInputValues) {
                              setTableInputValues((prev) => {
                                const updated = { ...prev, [`${pointId}-cuuc${pn}`]: val };
                                // Keep the converted cell beneath it in step.
                                if (convertHardness) {
                                  const conv = convertHardness(val, master, masterUnit, lc);
                                  if (conv !== undefined && conv !== null) {
                                    updated[`${pointId}-uuc${pn}`] = conv;
                                  }
                                }
                                return updated;
                              });
                            }
                          }}
                          onBlur={(e) => {
                            if (handleObservationBlur) {
                              handleObservationBlur(
                                pointIndex,
                                VHT_COLUMNS.observationStart + pn,
                                e.target.value,
                                pointId,
                                {
                                  convertedReading: converted[pn],
                                  caverageuuc: derived.caverageuuc,
                                  averageuuc: derived.averageuuc,
                                  error: derived.error,
                                  percentError: derived.percentError,
                                  master,
                                }
                              );
                            }
                          }}
                          placeholder={`Obs ${pn + 1}`}
                        />
                      </td>
                    ))}

                    <td className={TD}>
                      <input type="text" readOnly className={READONLY_INPUT} value={derived.caverageuuc} />
                    </td>

                    <td rowSpan={2} className={`${TD} align-middle`}>
                      <input
                        type="text"
                        readOnly
                        className={READONLY_INPUT}
                        title={`Master least count ${masterLc}, UUC least count ${uucLc}`}
                        value={derived.error}
                      />
                    </td>

                    <td rowSpan={2} className={`${TD} align-middle`}>
                      <input type="text" readOnly className={READONLY_INPUT} value={derived.percentError} />
                    </td>
                  </tr>

                  {/* Row 2: converted readings */}
                  <tr className="border-b border-gray-200 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
                    {converted.map((reading, pn) => (
                      <td key={pn} className={TD}>
                        <input type="number" readOnly className={READONLY_INPUT} value={reading} />
                      </td>
                    ))}

                    <td className={TD}>
                      <input type="text" readOnly className={READONLY_INPUT} value={derived.averageuuc} />
                    </td>
                  </tr>
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {!convertHardness && (
        <div className="text-xs text-gray-600 dark:text-gray-400 px-1">
          Converted readings are shown as stored. Supply a <span className="font-mono">convertHardness</span> function
          to recalculate them from the entered values, as the PHP&apos;s converthardness() does.
        </div>
      )}
    </div>
  );
};

export default ObservationVHT;
