import { safeGetValue, safeGetArray, getDecimalPlaces, formatValueByLc } from './observationUtils';

/**
 * VOL (Volumetric) observation.
 *
 * Port of observationvol.php. Per calibration point the operator enters up to
 * 10 master readings; everything to the right of them is derived:
 *
 *   averagemaster   mean of the entered readings, to master least-count decimals
 *   zvalue          water density factor, looked up server side from the water
 *                   temperature and pressure (getzvalue.php)
 *   caveragemaster  averagemaster * zvalue * multiplyratio   ("Converted Average")
 *   error           calculateduuc - caveragemaster (reversed when the instrument's
 *                   error mode is 'stduuc')
 *
 * Tolerance / Results (specification and remark) are only shown when the inward
 * item carries a conformity statement.
 *
 * This is the simpler sibling of VOLNL: a single water temperature and pressure
 * reading rather than start/end pairs, no material coefficient, and no
 * "Volume at V27" column. Instrument-level fields are stored against the
 * instrument id, not a calibration point, exactly as the PHP does.
 */

export const VOL_MAX_REPEATABLE = 10;

// Column layout, shared by the component, the row builder and the save path.
export const VOL_COLUMNS = {
  srNo: 0,
  calculateduuc: 1,
  uuc: 2,
  masterStart: 3, // masterStart .. masterStart + 9 -> repeatable 0..9
  averagemaster: 13,
  zvalue: 14,
  caveragemaster: 15,
  error: 16,
  specification: 17,
  remark: 18,
};

const toNum = (val) => {
  if (val === '' || val === null || val === undefined) return NaN;
  return parseFloat(val);
};

/**
 * Derived values for one calibration point row.
 * Mirrors the averageavg / multiply / substractminus chain the PHP wires onto
 * every master input's onkeyup.
 */
export const calculateVOLValues = (rowData, point = {}, context = {}) => {
  const result = { average: '', convertedAverage: '', error: '' };
  if (!rowData || !Array.isArray(rowData)) return result;

  const masterLc = point.master_least_count ?? point.masterleastcount ?? 'NA';
  const uucLc = point.least_count ?? point.leastcount ?? 'NA';
  const mlc = getDecimalPlaces(masterLc);
  const lc = getDecimalPlaces(uucLc);
  const errorLc = Math.max(mlc, lc);

  const readings = [];
  for (let i = 0; i < VOL_MAX_REPEATABLE; i++) {
    const val = toNum(rowData[VOL_COLUMNS.masterStart + i]);
    if (!isNaN(val)) readings.push(val);
  }

  if (readings.length > 0) {
    const avg = readings.reduce((sum, v) => sum + v, 0) / readings.length;
    result.average = formatValueByLc(avg, mlc, masterLc);
  }

  const zValue = context.zValue ?? rowData[VOL_COLUMNS.zvalue];
  const multiplyRatio = toNum(point.multiply_ratio ?? point.multiplyreation ?? 1);
  const ratio = isNaN(multiplyRatio) ? 1 : multiplyRatio;

  const avgNum = toNum(result.average);
  const zNum = toNum(zValue);

  if (!isNaN(avgNum) && !isNaN(zNum)) {
    result.convertedAverage = formatValueByLc(avgNum * zNum * ratio, mlc, masterLc);
  }

  const calculatedUuc = toNum(rowData[VOL_COLUMNS.calculateduuc]);
  const convertedNum = toNum(result.convertedAverage);
  if (!isNaN(calculatedUuc) && !isNaN(convertedNum)) {
    const diff = context.errorMode === 'stduuc'
      ? convertedNum - calculatedUuc
      : calculatedUuc - convertedNum;
    result.error = diff.toFixed(errorLc);
  }

  return result;
};

/** Row generator for VOL. One row per calibration point. */
export const createVOLRows = (dataArray) => {
  const rows = [];
  const calibrationPoints = [];
  const types = [];
  const repeatables = [];
  const values = [];

  (dataArray || []).forEach((point, index) => {
    if (!point) return;

    const pointId = (point.id ?? point.point_id ?? point.calibration_point_id ?? '').toString();
    const masterReadings = safeGetArray(
      point.master_readings ?? point.observations ?? point.master_observations,
      VOL_MAX_REPEATABLE
    );
    const cells = Array.from({ length: VOL_MAX_REPEATABLE }, (_, i) => {
      const obs = masterReadings[i];
      return safeGetValue(obs && obs.value !== undefined ? obs.value : obs);
    });

    rows.push([
      point.sr_no?.toString() || (index + 1).toString(),
      safeGetValue(point.calculated_uuc ?? point.calculateduuc ?? point.point),
      safeGetValue(point.uuc ?? point.converted_point ?? point.point),
      ...cells,
      safeGetValue(point.average_master ?? point.averagemaster),
      safeGetValue(point.zvalue ?? point.z_value),
      safeGetValue(point.caveragemaster ?? point.converted_average),
      safeGetValue(point.error),
      safeGetValue(point.specification),
      safeGetValue(point.remark),
    ]);

    calibrationPoints.push(pointId);
    types.push('master');
    repeatables.push('0');
    values.push(cells[0] || '0');
  });

  return { rows, hiddenInputs: { calibrationPoints, types, repeatables, values } };
};

/** Table config, matching the shape the other observation configs return. */
export const getVOLTableConfig = (observations, showConformity = false) => {
  const { rows, hiddenInputs } = createVOLRows(observations);
  const remainingHeaders = ['Average', 'Zvalue', 'Converted Average', 'Error'];
  if (showConformity) remainingHeaders.push('Tolerance', 'Results');

  return {
    id: 'observationvol',
    name: 'Observation VOL',
    category: 'Volume',
    structure: {
      singleHeaders: ['Sr. No.', 'Nominal/ Set Value on UUC', 'Nominal/ Set Value on UUC'],
      subHeaders: {
        'Observation on Master': Array.from(
          { length: VOL_MAX_REPEATABLE },
          (_, i) => `Observation ${i + 1}`
        ),
      },
      remainingHeaders,
    },
    staticRows: rows,
    hiddenInputs,
  };
};

const READONLY_INPUT =
  'w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white cursor-not-allowed text-right font-mono';
const EDITABLE_INPUT =
  'w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-right font-mono';
const TEXT_INPUT =
  'w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500';
const TD = 'px-2 py-1 text-sm border-r border-gray-200 dark:border-gray-600';
const TH = 'px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 uppercase border-r border-gray-300 dark:border-gray-600';

const ObservationVOL = ({
  selectedTableData,
  tableInputValues = {},
  setTableInputValues,
  validateDecimalPlaces,
  handleObservationBlur,
  handleBiomedicalInputBlur,
  observations,
  instId,
  instrument,
  inwardEntry,
}) => {
  if (selectedTableData?.id !== 'observationvol') return null;

  const points = Array.isArray(selectedTableData?.calibration_points) && selectedTableData.calibration_points.length > 0
    ? selectedTableData.calibration_points
    : (Array.isArray(observations) ? observations : []);

  if (points.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
        No calibration points available for VOL.
      </div>
    );
  }

  // Tolerance / Results only appear when the inward item carries a conformity statement.
  const showConformity =
    (inwardEntry?.conformitystatement ?? selectedTableData?.conformitystatement) === 'Yes';

  // Instrument-level fields are keyed on the instrument id, not a point.
  const instValue = (type) =>
    tableInputValues[`${instId}-${type}`] ?? selectedTableData?.instrument_data?.[type] ?? '';

  const waterTemp = instValue('watertemp');
  const pressure = instValue('pressure');
  const errorMode = instrument?.error ?? selectedTableData?.error_mode;

  const setInstValue = (type, value) => {
    if (setTableInputValues) {
      setTableInputValues((prev) => ({ ...prev, [`${instId}-${type}`]: value }));
    }
  };

  const renderInstrumentField = (label, type, suffix) => (
    <>
      <td className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-600">
        {label}
      </td>
      <td className="px-2 py-1 border-r border-gray-200 dark:border-gray-600">
        <div className="flex items-center gap-1">
          <input
            type="number"
            step="any"
            className={EDITABLE_INPUT}
            value={instValue(type)}
            onChange={(e) => setInstValue(type, e.target.value)}
            onBlur={(e) => {
              if (handleBiomedicalInputBlur) {
                handleBiomedicalInputBlur(instId, type, 0, e.target.value);
              }
            }}
          />
          {suffix && <span className="text-xs text-gray-500 dark:text-gray-400">{suffix}</span>}
        </div>
      </td>
    </>
  );

  return (
    <div className="mb-8 space-y-4">
      <h3 className="text-lg font-medium text-gray-800 dark:text-white uppercase">
        VOL (Volumetric) Observations
      </h3>

      {/* Ambient temperature, water temperature and pressure */}
      <div className="overflow-x-auto border border-gray-200 dark:border-gray-600 rounded">
        <table className="w-full text-sm border-collapse">
          <tbody className="bg-white dark:bg-gray-800">
            <tr>
              {renderInstrumentField('Ambient Temp.', 'ambienttemp', '°C')}
              {renderInstrumentField('Water Temp', 'watertemp', '°C')}
              {renderInstrumentField('Pressure', 'pressure', 'kPa')}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Main observation table */}
      <div className="overflow-x-auto border border-gray-200 dark:border-gray-600 rounded">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-700 border-b border-gray-300 dark:border-gray-600">
              <th rowSpan={2} className={TH}>Sr. No.</th>
              <th rowSpan={2} className={TH}>Nominal/ Set Value on UUC</th>
              <th rowSpan={2} className={TH}>Nominal/ Set Value on UUC</th>
              <th colSpan={VOL_MAX_REPEATABLE} className={`${TH} text-center`}>Observation on Master</th>
              <th rowSpan={2} className={TH}>Average</th>
              <th rowSpan={2} className={TH}>Zvalue</th>
              <th rowSpan={2} className={TH}>Converted Average</th>
              <th rowSpan={2} className={TH}>Error</th>
              {showConformity && (
                <>
                  <th rowSpan={2} className={TH}>Tolerance</th>
                  <th rowSpan={2} className={TH}>Results</th>
                </>
              )}
            </tr>
            <tr className="bg-gray-50 dark:bg-gray-600 border-b border-gray-300 dark:border-gray-600">
              {Array.from({ length: VOL_MAX_REPEATABLE }, (_, i) => (
                <td key={i} className="px-2 py-1 text-center text-xs font-medium text-gray-600 dark:text-gray-300 border-r border-gray-300 dark:border-gray-600">
                  Observation {i + 1}
                </td>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800">
            {points.map((point, rowIndex) => {
              const pointId = point.id ?? point.point_id ?? point.calibration_point_id ?? `pt-${rowIndex}`;
              const masterLc = point.master_least_count ?? point.masterleastcount ?? 'NA';
              const uucLc = point.least_count ?? point.leastcount ?? 'NA';
              const lc = getDecimalPlaces(uucLc);

              const calculatedUuc = safeGetValue(point.calculated_uuc ?? point.calculateduuc ?? point.point);
              const uucConverted = safeGetValue(point.uuc ?? point.converted_point ?? point.point);

              const storedReadings = safeGetArray(
                point.master_readings ?? point.observations ?? point.master_observations,
                VOL_MAX_REPEATABLE
              );

              const readings = Array.from({ length: VOL_MAX_REPEATABLE }, (_, i) => {
                const stored = storedReadings[i];
                const fallback = safeGetValue(stored && stored.value !== undefined ? stored.value : stored);
                return tableInputValues[`${pointId}-m${i}`] ?? fallback;
              });

              const zValue = tableInputValues[`${pointId}-zvalue`]
                ?? safeGetValue(point.zvalue ?? point.z_value);

              // The row the calculation helper expects, laid out per VOL_COLUMNS.
              const rowData = [
                point.sr_no ?? rowIndex + 1,
                calculatedUuc,
                uucConverted,
                ...readings,
                '', zValue, '', '',
              ];

              const derived = calculateVOLValues(rowData, point, { zValue, errorMode });

              const specification = tableInputValues[`${pointId}-specification`]
                ?? safeGetValue(point.specification);
              const remark = tableInputValues[`${pointId}-remark`] ?? safeGetValue(point.remark);

              return (
                <tr key={pointId} className="border-b border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className={`${TD} text-center dark:text-white`}>{point.sr_no ?? rowIndex + 1}</td>

                  <td className={TD}>
                    <input
                      type="text"
                      readOnly
                      className={READONLY_INPUT}
                      value={formatValueByLc(calculatedUuc, lc, uucLc)}
                    />
                  </td>

                  <td className={TD}>
                    <input
                      type="text"
                      readOnly
                      className={READONLY_INPUT}
                      value={formatValueByLc(uucConverted, lc, uucLc)}
                    />
                  </td>

                  {readings.map((reading, pn) => (
                    <td key={pn} className={TD}>
                      <input
                        type="number"
                        step="any"
                        className={EDITABLE_INPUT}
                        value={reading}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (setTableInputValues) {
                            setTableInputValues((prev) => ({ ...prev, [`${pointId}-m${pn}`]: val }));
                          }
                        }}
                        onBlur={(e) => {
                          if (validateDecimalPlaces) {
                            validateDecimalPlaces(`${pointId}-m${pn}`, e.target.value, masterLc);
                          }
                          if (handleObservationBlur) {
                            handleObservationBlur(
                              rowIndex,
                              VOL_COLUMNS.masterStart + pn,
                              e.target.value,
                              pointId,
                              {
                                average: derived.average,
                                convertedAverage: derived.convertedAverage,
                                error: derived.error,
                                zValue,
                              }
                            );
                          }
                        }}
                        placeholder={`Obs ${pn + 1}`}
                      />
                    </td>
                  ))}

                  <td className={TD}>
                    <input type="text" readOnly className={READONLY_INPUT} value={derived.average} />
                  </td>
                  <td className={TD}>
                    <input type="text" readOnly className={READONLY_INPUT} value={zValue} />
                  </td>
                  <td className={TD}>
                    <input type="text" readOnly className={READONLY_INPUT} value={derived.convertedAverage} />
                  </td>
                  <td className={TD}>
                    <input
                      type="text"
                      readOnly
                      className={READONLY_INPUT}
                      title={`Master least count ${masterLc}, UUC least count ${uucLc}`}
                      value={derived.error}
                    />
                  </td>

                  {showConformity && (
                    <>
                      <td className={TD}>
                        <input
                          type="text"
                          className={TEXT_INPUT}
                          value={specification}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (setTableInputValues) {
                              setTableInputValues((prev) => ({ ...prev, [`${pointId}-specification`]: val }));
                            }
                          }}
                          onBlur={(e) => {
                            if (handleObservationBlur) {
                              handleObservationBlur(rowIndex, VOL_COLUMNS.specification, e.target.value, pointId);
                            }
                          }}
                          placeholder="Tolerance"
                        />
                      </td>
                      <td className={TD}>
                        <input
                          type="text"
                          className={TEXT_INPUT}
                          value={remark}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (setTableInputValues) {
                              setTableInputValues((prev) => ({ ...prev, [`${pointId}-remark`]: val }));
                            }
                          }}
                          onBlur={(e) => {
                            if (handleObservationBlur) {
                              handleObservationBlur(rowIndex, VOL_COLUMNS.remark, e.target.value, pointId);
                            }
                          }}
                          placeholder="Results"
                        />
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* The values the Z-value lookup is driven from, so the operator can see
          what will be sent (getzvalue() passes them through unchanged). */}
      <div className="text-xs text-gray-600 dark:text-gray-400 px-1">
        Z-value lookup uses water temp{' '}
        <span className="font-mono">{waterTemp === '' ? '-' : waterTemp}</span> °C and pressure{' '}
        <span className="font-mono">{pressure === '' ? '-' : pressure}</span> kPa
      </div>
    </div>
  );
};

export default ObservationVOL;
