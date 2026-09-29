import { Fragment } from 'react';
import { safeGetValue, safeGetArray } from './observationUtils';


export const BHT_MAX_REPEATABLE = 5;

// Units whose readings are entered directly, without the diameter -> HBW conversion
export const BHT_DIRECT_UNITS = ['98', '99', '89', '90', '91'];

export const BHT_COLUMNS = {
  srNo: 0,
  master: 1,
  unit: 2,
  observationStart: 3, // observationStart .. observationStart + 4 -> repeatable 0..4
  average: 8,
  error: 9,
  percenterror: 10,
};

// Ball diameter (mm) and test force (kgf) per UUC unit; PHP default is HBW 2.5/187.5
const BHT_SCALES = {
  85: { ballDia: 2.5, refValue: 187.5 },
  93: { ballDia: 2.5, refValue: 187.5 },
  134: { ballDia: 5, refValue: 250 },
  135: { ballDia: 5, refValue: 750 },
  136: { ballDia: 10, refValue: 1000 },
  137: { ballDia: 10, refValue: 3000 },
};
const DEFAULT_SCALE = { ballDia: 2.5, refValue: 187.5 };

// Decimals shown for a converted HBW reading
export const BHT_CONVERTED_DECIMALS = 1;

export const getBHTScale = (unitId) => BHT_SCALES[String(unitId ?? '').trim()] || DEFAULT_SCALE;

export const isBHTDirectUnit = (unitId) => BHT_DIRECT_UNITS.includes(String(unitId ?? '').trim());

const isBlank = (val) => val === undefined || val === null || String(val).trim() === '';
const toNum = (val) => (isBlank(val) ? NaN : parseFloat(val));

// Unrounded like PHP's 'NA' precision, with float noise stripped
const formatUnrounded = (num) => (Number.isFinite(num) ? String(Number(num.toFixed(10))) : '');

const mean = (values) => values.reduce((sum, v) => sum + v, 0) / values.length;

/**
 * PHP convertBrinellhardness(refvalue, balldia, value, target):
 *   HBW = 2F / (pi * D * (D - sqrt(D^2 - d^2)))   F = test force (kgf), D = ball dia, d = indentation dia
 */
export const convertBrinellHardness = (refValue, ballDia, diameter) => {
  const d = toNum(diameter);
  const D = parseFloat(ballDia);
  const F = parseFloat(refValue);
  if (isNaN(d) || isNaN(D) || isNaN(F) || d <= 0 || d >= D) return '';

  const hbw = (2 * F) / (Math.PI * D * (D - Math.sqrt(D * D - d * d)));
  return Number.isFinite(hbw) ? hbw.toFixed(BHT_CONVERTED_DECIMALS) : '';
};

/**
 * Derived values for one calibration point.
 * Mirrors the averageavg / substractminus / percenterror chain on each input's onkeyup.
 */
export const calculateBHTValues = (enteredReadings, convertedReadings, context = {}) => {
  const result = { caverageuuc: '', averageuuc: '', error: '', percentError: '' };
  const direct = !!context.direct;

  const entered = (enteredReadings || []).map(toNum).filter((v) => !isNaN(v));
  const converted = (convertedReadings || []).map(toNum).filter((v) => !isNaN(v));

  if (direct) {
    // Single row: the entered readings are the UUC readings
    if (entered.length > 0) result.averageuuc = formatUnrounded(mean(entered));
  } else {
    if (entered.length > 0) result.caverageuuc = formatUnrounded(mean(entered));
    if (converted.length > 0) result.averageuuc = formatUnrounded(mean(converted));
  }

  const master = toNum(context.master);
  const avgUuc = toNum(result.averageuuc);

  if (!isNaN(master) && !isNaN(avgUuc)) {
    const diff = context.errorMode === 'stduuc' ? master - avgUuc : avgUuc - master;
    result.error = formatUnrounded(diff);

    if (!direct && master !== 0) {
      result.percentError = ((diff / master) * 100).toFixed(2);
    }
  }

  return result;
};

const pick = (obj, ...keys) => {
  for (const key of keys) {
    const val = safeGetValue(obj?.[key]);
    if (val !== '') return val;
  }
  return '';
};

const valueOf = (arr, i) => {
  const obs = arr[i];
  return safeGetValue(obs && obs.value !== undefined ? obs.value : obs);
};

const readingsOf = (source) => {
  const arr = safeGetArray(source, BHT_MAX_REPEATABLE);
  return Array.from({ length: BHT_MAX_REPEATABLE }, (_, i) => valueOf(arr, i));
};

const getPointId = (point) => (point.id ?? point.point_id ?? point.calibration_point_id ?? '').toString();
const getUnitId = (point) => pick(point, 'unit', 'uuc_unit', 'unit_id', 'uucunit');
const getUnitLabel = (point) => pick(point, 'unit_description', 'unit_label', 'unit_name') || getUnitId(point);

// Stored master reading, falling back to the calibration point itself, as the PHP does
const getMaster = (point) =>
  pick(point, 'master', 'master_value') || pick(point, 'point', 'nominal_value', 'set_point');

const getEnteredSource = (point) => point.cuuc_readings ?? point.cuuc_observations ?? point.cuuc;
const getConvertedSource = (point) => point.uuc_readings ?? point.uuc_observations ?? point.uuc ?? point.observations;

/** Row generator for BHT. One row for direct-reading units, two rows otherwise. */
export const createBHTRows = (dataArray) => {
  const rows = [];
  const calibrationPoints = [];
  const types = [];
  const repeatables = [];
  const values = [];

  (Array.isArray(dataArray) ? dataArray : []).forEach((point, index) => {
    if (!point) return;

    const pointId = getPointId(point);
    const master = getMaster(point);
    const direct = isBHTDirectUnit(getUnitId(point));
    const converted = readingsOf(getConvertedSource(point));

    if (direct) {
      rows.push([
        pick(point, 'sr_no', 'sequence_number') || String(index + 1),
        master,
        getUnitLabel(point),
        ...converted,
        pick(point, 'averageuuc', 'average_uuc'),
        pick(point, 'error'),
        '-',
      ]);
      calibrationPoints.push(pointId);
      types.push('uuc');
      repeatables.push('0');
      values.push(converted[0] || '0');
      return;
    }

    const entered = readingsOf(getEnteredSource(point));

    rows.push([
      pick(point, 'sr_no', 'sequence_number') || String(index + 1),
      master,
      getUnitLabel(point),
      ...entered,
      pick(point, 'caverageuuc', 'caverage_uuc'),
      pick(point, 'error'),
      pick(point, 'percenterror', 'percent_error'),
    ]);
    calibrationPoints.push(pointId);
    types.push('cuuc');
    repeatables.push('0');
    values.push(entered[0] || '0');

    rows.push(['', '', '', ...converted, pick(point, 'averageuuc', 'average_uuc'), '', '']);
    calibrationPoints.push(pointId);
    types.push('uuc');
    repeatables.push('0');
    values.push(converted[0] || '0');
  });

  return { rows, hiddenInputs: { calibrationPoints, types, repeatables, values } };
};

/** Table config, matching the shape the other observation configs return. */
export const getBHTTableConfig = (observations) => {
  const { rows, hiddenInputs } = createBHTRows(observations);
  return {
    id: 'observationbht',
    name: 'Observation BHT',
    category: 'Hardness',
    structure: {
      singleHeaders: ['Sr. No.', 'Nominal/ Set Value', 'Unit'],
      subHeaders: {
        'Observation on UUC': Array.from({ length: BHT_MAX_REPEATABLE }, (_, i) => `Observation ${i + 1}`),
      },
      remainingHeaders: ['Average', 'Error', 'Percent Error'],
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

const ObservationBHT = ({
  selectedTableData,
  tableInputValues = {},
  setTableInputValues,
  handleObservationBlur,
  observations,
  instrument,
}) => {
  if (selectedTableData?.id !== 'observationbht') return null;

  const points = Array.isArray(selectedTableData?.calibration_points) && selectedTableData.calibration_points.length > 0
    ? selectedTableData.calibration_points
    : (Array.isArray(observations) ? observations : []);

  if (points.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
        No calibration points available for BHT.
      </div>
    );
  }

  return (
    <div className="mb-8 space-y-4">
      <h3 className="text-lg font-medium text-gray-800 dark:text-white uppercase">
        {instrument?.name || 'BHT (Brinell Hardness Tester) Observations'}
      </h3>

      <div className="overflow-x-auto border border-gray-200 dark:border-gray-600 rounded">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-700 border-b border-gray-300 dark:border-gray-600">
              <th rowSpan={2} className={TH}>Sr. No.</th>
              <th rowSpan={2} className={TH}>Nominal/ Set Value</th>
              <th rowSpan={2} className={TH}>Unit</th>
              <th colSpan={BHT_MAX_REPEATABLE} className={`${TH} text-center`}>Observation on UUC</th>
              <th rowSpan={2} className={TH}>Average</th>
              <th rowSpan={2} className={TH}>Error</th>
              <th rowSpan={2} className={TH}>Percent Error</th>
            </tr>
            <tr className="bg-gray-50 dark:bg-gray-600 border-b border-gray-300 dark:border-gray-600">
              {Array.from({ length: BHT_MAX_REPEATABLE }, (_, i) => (
                <td key={i} className="px-2 py-1 text-center text-xs font-medium text-gray-600 dark:text-gray-300 border-r border-gray-300 dark:border-gray-600">
                  Observation {i + 1}
                </td>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800">
            {points.map((point, pointIndex) => {
              const pointId = getPointId(point) || `pt-${pointIndex}`;
              const unitId = getUnitId(point);
              const direct = isBHTDirectUnit(unitId);
              const { ballDia, refValue } = getBHTScale(unitId);
              const master = getMaster(point);
              const errorMode = instrument?.error ?? point.cusset_error ?? selectedTableData?.error_mode;
              const srNo = point.sr_no ?? point.sequence_number ?? pointIndex + 1;

              const storedEntered = safeGetArray(getEnteredSource(point), BHT_MAX_REPEATABLE);
              const storedConverted = safeGetArray(getConvertedSource(point), BHT_MAX_REPEATABLE);

              // Direct units: the editable cells are the uuc readings themselves
              const entered = Array.from({ length: BHT_MAX_REPEATABLE }, (_, i) =>
                direct
                  ? (tableInputValues[`${pointId}-uuc${i}`] ?? valueOf(storedConverted, i))
                  : (tableInputValues[`${pointId}-cuuc${i}`] ?? valueOf(storedEntered, i))
              );

              const converted = direct
                ? entered
                : Array.from({ length: BHT_MAX_REPEATABLE }, (_, i) => {
                  const local = tableInputValues[`${pointId}-uuc${i}`];
                  if (local !== undefined) return local;
                  if (!isBlank(entered[i])) {
                    const conv = convertBrinellHardness(refValue, ballDia, entered[i]);
                    if (conv !== '') return conv;
                  }
                  return valueOf(storedConverted, i);
                });

              const derived = calculateBHTValues(entered, converted, { master, errorMode, direct });

              const renderReadingInput = (reading, pn) => (
                <td key={pn} className={TD}>
                  <input
                    type="number"
                    step="any"
                    className={EDITABLE_INPUT}
                    value={reading}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (!setTableInputValues) return;
                      setTableInputValues((prev) => {
                        if (direct) return { ...prev, [`${pointId}-uuc${pn}`]: val };
                        // Keep the converted cell beneath it in step
                        return {
                          ...prev,
                          [`${pointId}-cuuc${pn}`]: val,
                          [`${pointId}-uuc${pn}`]: convertBrinellHardness(refValue, ballDia, val),
                        };
                      });
                    }}
                    onBlur={(e) => {
                      if (!handleObservationBlur) return;
                      handleObservationBlur(
                        pointIndex,
                        BHT_COLUMNS.observationStart + pn,
                        e.target.value,
                        pointId,
                        {
                          readingType: direct ? 'uuc' : 'cuuc',
                          convertedReading: direct ? undefined : convertBrinellHardness(refValue, ballDia, e.target.value),
                          caverageuuc: derived.caverageuuc,
                          averageuuc: derived.averageuuc,
                          error: derived.error,
                          percentError: derived.percentError,
                          master,
                        }
                      );
                    }}
                    placeholder={`Obs ${pn + 1}`}
                  />
                </td>
              );

              if (direct) {
                return (
                  <tr key={pointId} className="border-b border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className={`${TD} text-center dark:text-white`}>{srNo}</td>
                    <td className={TD}>
                      <input type="text" readOnly className={READONLY_INPUT} value={master} />
                    </td>
                    <td className={`${TD} text-center dark:text-white`}>{getUnitLabel(point)}</td>
                    {entered.map(renderReadingInput)}
                    <td className={TD}>
                      <input type="text" readOnly className={READONLY_INPUT} value={derived.averageuuc} />
                    </td>
                    <td className={TD}>
                      <input type="text" readOnly className={READONLY_INPUT} value={derived.error} />
                    </td>
                    <td className={`${TD} text-center dark:text-white`}>-</td>
                  </tr>
                );
              }

              return (
                <Fragment key={pointId}>
                  {/* Row 1: indentation diameters entered */}
                  <tr className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td rowSpan={2} className={`${TD} text-center dark:text-white align-middle`}>{srNo}</td>
                    <td rowSpan={2} className={`${TD} align-middle`}>
                      <input type="text" readOnly className={READONLY_INPUT} value={master} />
                    </td>
                    <td rowSpan={2} className={`${TD} text-center dark:text-white align-middle`}>{getUnitLabel(point)}</td>
                    {entered.map(renderReadingInput)}
                    <td className={TD}>
                      <input type="text" readOnly className={READONLY_INPUT} value={derived.caverageuuc} />
                    </td>
                    <td rowSpan={2} className={`${TD} align-middle`}>
                      <input type="text" readOnly className={READONLY_INPUT} value={derived.error} />
                    </td>
                    <td rowSpan={2} className={`${TD} align-middle`}>
                      <input type="text" readOnly className={READONLY_INPUT} value={derived.percentError} />
                    </td>
                  </tr>

                  {/* Row 2: readings converted to HBW */}
                  <tr className="border-b border-gray-200 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
                    {converted.map((reading, pn) => (
                      <td key={pn} className={TD}>
                        <input
                          type="number"
                          readOnly
                          className={READONLY_INPUT}
                          value={reading}
                          title={`HBW ${ballDia}/${refValue}`}
                        />
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
    </div>
  );
};

export default ObservationBHT;
