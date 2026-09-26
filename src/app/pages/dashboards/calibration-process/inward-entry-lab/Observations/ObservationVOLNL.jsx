import { safeGetValue, safeGetArray, getDecimalPlaces, formatValueByLc } from './observationUtils';

/**
 * VOLNL (Volumetric / Neck Level) observation.
 *
 * Port of observationvolnl.php. Per calibration point the operator enters up to
 * 10 master readings; everything to the right of them is derived:
 *
 *   averagemaster   mean of the entered readings, to master least-count decimals
 *   zvalue          water density factor, looked up server side from the average
 *                   water temperature and average air pressure (getzvalue.php)
 *   caveragemaster  averagemaster * zvalue * multiplyratio      ("Converted Volume")
 *   volumeat        avg * z * (1 - 0.000027 * (wtavg - 27)), 5dp ("Volume at V27")
 *   error           calculateduuc - volumeat (reversed when the instrument's error
 *                   mode is 'stduuc')
 *
 * Instrument-level fields (material coefficient, water temperature and air
 * pressure at start and end) are stored against the instrument id, not a
 * calibration point, exactly as the PHP does.
 */

export const VOLNL_MAX_REPEATABLE = 10;

// Column layout, shared by the component, the row builder and the save path.
export const VOLNL_COLUMNS = {
  srNo: 0,
  calculateduuc: 1,
  uuc: 2,
  masterStart: 3, // masterStart .. masterStart + 9 -> repeatable 0..9
  averagemaster: 13,
  zvalue: 14,
  caveragemaster: 15,
  volumeat: 16,
  error: 17,
};

const toNum = (val) => {
  if (val === '' || val === null || val === undefined) return NaN;
  return parseFloat(val);
};

/** Average water temperature across the start and end readings. */
export const averageWaterTemp = (tempStart, tempEnd) => {
  const t1 = toNum(tempStart);
  const t2 = toNum(tempEnd);
  if (isNaN(t1) && isNaN(t2)) return NaN;
  if (isNaN(t1)) return t2;
  if (isNaN(t2)) return t1;
  return (t1 + t2) / 2;
};

/**
 * Average air pressure as getzvalue() prepares it: the mean of start and end,
 * divided by 10, rounded, then fixed to one decimal.
 */
export const averageAirPressure = (pressureStart, pressureEnd) => {
  const p1 = toNum(pressureStart);
  const p2 = toNum(pressureEnd);
  if (isNaN(p1) && isNaN(p2)) return '';
  const sum = (isNaN(p1) ? 0 : p1) + (isNaN(p2) ? 0 : p2);
  const count = (isNaN(p1) ? 0 : 1) + (isNaN(p2) ? 0 : 1);
  if (count === 0) return '';
  return (Math.round((sum / count) / 10)).toFixed(1);
};

/** Volume at V27: avg * z * (1 - 0.000027 * (wtavg - 27)), to 5 decimals. */
export const calculateVolumeAt = (averageMaster, zValue, waterTempAvg) => {
  const avg = toNum(averageMaster);
  const z = toNum(zValue);
  const wt = toNum(waterTempAvg);
  if (isNaN(avg) || isNaN(z)) return '';
  const wtavg = isNaN(wt) ? 0 : wt;
  return (avg * z * (1 - 0.000027 * (wtavg - 27))).toFixed(5);
};

/**
 * Derived values for one calibration point row.
 * Mirrors the averageavg / multiply / substractminus chain the PHP wires onto
 * every master input's onkeyup.
 */
export const calculateVOLNLValues = (rowData, point = {}, context = {}) => {
  const result = { average: '', convertedVolume: '', volumeAt: '', error: '' };
  if (!rowData || !Array.isArray(rowData)) return result;

  const masterLc = point.master_least_count ?? point.masterleastcount ?? 'NA';
  const uucLc = point.least_count ?? point.leastcount ?? 'NA';
  const mlc = getDecimalPlaces(masterLc);
  const lc = getDecimalPlaces(uucLc);
  const errorLc = Math.max(mlc, lc);

  const readings = [];
  for (let i = 0; i < VOLNL_MAX_REPEATABLE; i++) {
    const val = toNum(rowData[VOLNL_COLUMNS.masterStart + i]);
    if (!isNaN(val)) readings.push(val);
  }

  if (readings.length > 0) {
    const avg = readings.reduce((sum, v) => sum + v, 0) / readings.length;
    result.average = formatValueByLc(avg, mlc, masterLc);
  }

  const zValue = context.zValue ?? rowData[VOLNL_COLUMNS.zvalue];
  const multiplyRatio = toNum(point.multiply_ratio ?? point.multiplyreation ?? 1);
  const ratio = isNaN(multiplyRatio) ? 1 : multiplyRatio;

  const avgNum = toNum(result.average);
  const zNum = toNum(zValue);

  if (!isNaN(avgNum) && !isNaN(zNum)) {
    result.convertedVolume = formatValueByLc(avgNum * zNum * ratio, mlc, masterLc);
    result.volumeAt = calculateVolumeAt(result.average, zValue, context.waterTempAvg);
  }

  const calculatedUuc = toNum(rowData[VOLNL_COLUMNS.calculateduuc]);
  const volumeAtNum = toNum(result.volumeAt);
  if (!isNaN(calculatedUuc) && !isNaN(volumeAtNum)) {
    const diff = context.errorMode === 'stduuc'
      ? volumeAtNum - calculatedUuc
      : calculatedUuc - volumeAtNum;
    result.error = diff.toFixed(errorLc);
  }

  return result;
};

/** Row generator for VOLNL. One row per calibration point. */
export const createVOLNLRows = (dataArray) => {
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
      VOLNL_MAX_REPEATABLE
    );
    const cells = Array.from({ length: VOLNL_MAX_REPEATABLE }, (_, i) => {
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
      safeGetValue(point.caveragemaster ?? point.converted_volume),
      safeGetValue(point.volumeat ?? point.volume_at),
      safeGetValue(point.error),
    ]);

    calibrationPoints.push(pointId);
    types.push('master');
    repeatables.push('0');
    values.push(cells[0] || '0');
  });

  return { rows, hiddenInputs: { calibrationPoints, types, repeatables, values } };
};

/** Table config, matching the shape the other observation configs return. */
export const getVOLNLTableConfig = (observations) => {
  const { rows, hiddenInputs } = createVOLNLRows(observations);
  return {
    id: 'observationvolnl',
    name: 'Observation VOLNL',
    category: 'Volume',
    structure: {
      singleHeaders: ['Sr. No.', 'Nominal/ Set Value on UUC', 'Nominal/ Set Value on UUC'],
      subHeaders: {
        'Observation on Master': Array.from(
          { length: VOLNL_MAX_REPEATABLE },
          (_, i) => `Observation ${i + 1}`
        ),
      },
      remainingHeaders: ['Average', 'Zvalue', 'Converted Volume', 'Volume at V27', 'Error'],
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

const ObservationVOLNL = ({
  selectedTableData,
  tableInputValues = {},
  setTableInputValues,
  validateDecimalPlaces,
  handleObservationBlur,
  handleBiomedicalInputBlur,
  observations,
  instId,
  instrument,
}) => {
  if (selectedTableData?.id !== 'observationvolnl') return null;

  const points = Array.isArray(selectedTableData?.calibration_points) && selectedTableData.calibration_points.length > 0
    ? selectedTableData.calibration_points
    : (Array.isArray(observations) ? observations : []);

  if (points.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
        No calibration points available for VOLNL.
      </div>
    );
  }

  // Instrument-level fields are keyed on the instrument id, not a point.
  const instValue = (type, fallback = '') =>
    tableInputValues[`${instId}-${type}`] ?? selectedTableData?.instrument_data?.[type] ?? fallback;

  const materialCoefficient = instValue('materialcofficient');
  const waterTempStart = instValue('watertemp');
  const waterTempEnd = instValue('watertemp2');
  const pressureStart = instValue('pressure');
  const pressureEnd = instValue('pressure2');

  const waterTempAvg = averageWaterTemp(waterTempStart, waterTempEnd);
  const pressureAvg = averageAirPressure(pressureStart, pressureEnd);
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
        VOLNL (Volumetric) Observations
      </h3>

      {/* Material coefficient, water temperature and air pressure at start */}
      <div className="overflow-x-auto border border-gray-200 dark:border-gray-600 rounded">
        <table className="w-full text-sm border-collapse">
          <tbody className="bg-white dark:bg-gray-800">
            <tr className="border-b border-gray-200 dark:border-gray-600">
              {renderInstrumentField('Material Coefficient', 'materialcofficient')}
              <td colSpan="2" />
            </tr>
            <tr>
              {renderInstrumentField('Water Temp Start', 'watertemp', '°C')}
              {renderInstrumentField('Air Pressure Start', 'pressure', 'hPa')}
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
              <th colSpan={VOLNL_MAX_REPEATABLE} className={`${TH} text-center`}>Observation on Master</th>
              <th rowSpan={2} className={TH}>Average</th>
              <th rowSpan={2} className={TH}>Zvalue</th>
              <th rowSpan={2} className={TH}>Converted Volume</th>
              <th rowSpan={2} className={TH}>Volume at V27</th>
              <th rowSpan={2} className={TH}>Error</th>
            </tr>
            <tr className="bg-gray-50 dark:bg-gray-600 border-b border-gray-300 dark:border-gray-600">
              {Array.from({ length: VOLNL_MAX_REPEATABLE }, (_, i) => (
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
                VOLNL_MAX_REPEATABLE
              );

              const readings = Array.from({ length: VOLNL_MAX_REPEATABLE }, (_, i) => {
                const stored = storedReadings[i];
                const fallback = safeGetValue(stored && stored.value !== undefined ? stored.value : stored);
                return tableInputValues[`${pointId}-m${i}`] ?? fallback;
              });

              const zValue = tableInputValues[`${pointId}-zvalue`]
                ?? safeGetValue(point.zvalue ?? point.z_value);

              // The row the calculation helper expects, laid out per VOLNL_COLUMNS.
              const rowData = [
                point.sr_no ?? rowIndex + 1,
                calculatedUuc,
                uucConverted,
                ...readings,
                '', zValue, '', '', '',
              ];

              const derived = calculateVOLNLValues(rowData, point, {
                zValue,
                waterTempAvg,
                errorMode,
              });

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
                              VOLNL_COLUMNS.masterStart + pn,
                              e.target.value,
                              pointId,
                              {
                                average: derived.average,
                                convertedVolume: derived.convertedVolume,
                                volumeAt: derived.volumeAt,
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
                    <input type="text" readOnly className={READONLY_INPUT} value={derived.convertedVolume} />
                  </td>
                  <td className={TD}>
                    <input type="text" readOnly className={READONLY_INPUT} value={derived.volumeAt} />
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
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Water temperature and air pressure at end */}
      <div className="overflow-x-auto border border-gray-200 dark:border-gray-600 rounded">
        <table className="w-full text-sm border-collapse">
          <tbody className="bg-white dark:bg-gray-800">
            <tr>
              {renderInstrumentField('Water Temp End', 'watertemp2', '°C')}
              {renderInstrumentField('Air Pressure End', 'pressure2', 'hPa')}
            </tr>
          </tbody>
        </table>
      </div>

      {/* The averages the Z-value lookup is driven from, shown so the operator can
          see what will be sent, matching getzvalue()'s own console output. */}
      <div className="text-xs text-gray-600 dark:text-gray-400 px-1">
        Average water temp:{' '}
        <span className="font-mono">{isNaN(waterTempAvg) ? '-' : waterTempAvg.toFixed(2)}</span> °C
        {'  |  '}
        Average air pressure (for Z lookup):{' '}
        <span className="font-mono">{pressureAvg === '' ? '-' : pressureAvg}</span>
        {materialCoefficient !== '' && (
          <>
            {'  |  '}Material coefficient:{' '}
            <span className="font-mono">{materialCoefficient}</span>
          </>
        )}
      </div>
    </div>
  );
};

export default ObservationVOLNL;
