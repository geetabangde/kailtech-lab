import { useState, useMemo, useEffect } from 'react';
import { formatValueByLc, getDecimalPlaces, safeGetValue } from './observationUtils';

/**
 * Normalizes UTM/AUTM observation data into matrix groups.
 */
const normalizeAutmGroups = (observationData) => {
  if (!observationData) return [];
  const source = Array.isArray(observationData) ? observationData : [observationData].filter(Boolean);

  return source.flatMap((item, index) => {
    // If item contains nested matrix/matrices array
    if (item?.matrices && Array.isArray(item.matrices) && item.matrices.length > 0) {
      return normalizeAutmGroups(item.matrices);
    }
    if (item?.matrix && Array.isArray(item.matrix) && item.matrix.length > 0) {
      return normalizeAutmGroups(item.matrix);
    }

    const calibrationPoints =
      item?.calibration_points ||
      item?.calibrationPoints ||
      item?.points ||
      item?.rows ||
      item?.observations ||
      (item?.point_id || item?.id ? [item] : []);

    if (Array.isArray(calibrationPoints) && calibrationPoints.length > 0) {
      const numericPoints = calibrationPoints
        .map((p) => parseFloat(p?.point ?? p?.setpoint ?? p?.set_point ?? p?.test_point))
        .filter((p) => !isNaN(p));

      const minPoint = item?.minpoint ?? item?.min_point ?? (numericPoints.length ? Math.min(...numericPoints) : '');
      const maxPoint = item?.maxpoint ?? item?.max_point ?? (numericPoints.length ? Math.max(...numericPoints) : '');

      return [{
        matrixId: safeGetValue(item?.matrix_id ?? item?.matrixid ?? item?.id ?? `matrix-${index + 1}`),
        matrixType: item?.matrixtype || item?.matrix_type || item?.name || (item?.matrix?.matrixtype || `Scale ${index + 1}`),
        leastCount: item?.leastcount ?? item?.least_count ?? item?.matrix?.leastcount ?? calibrationPoints[0]?.least_count ?? 'NA',
        masterLeastCount: item?.masterleastcount ?? item?.master_least_count ?? calibrationPoints[0]?.master_least_count ?? 'NA',
        minPoint,
        maxPoint,
        classOfMachine: item?.classofmachine ?? item?.class_of_machine ?? '',
        dialGaugeSetting: item?.dialguageseting ?? item?.dial_gauge_setting ?? '',
        ratio: item?.ratio ?? '1',
        calibrationPoints,
        raw: item,
      }];
    }

    return [];
  });
};

/**
 * ObservationAUTM Component
 * Handles Automatic Universal Testing Machine calibration observations matching the PHP implementation:
 * - 4 Observation positions: Position 0° (Obs 1), Position 120° (Obs 2), Position 240° (Obs 3), w/o Acce. (Obs 4)
 * - Multi-matrix grouping support with scale headers
 * - Removal of force & Relative Zero Error for all 4 positions
 * - Ratio & Max Relative Resolution calculation
 * - Class of machine & Dial Gauge Setting
 */
const ObservationAUTM = ({
  selectedTableData,
  tableInputValues = {},
  setTableInputValues,
  validateDecimalPlaces,
  inwardEntry,
  instrument,
  formData,
  observations,
  handleObservationBlur,
}) => {
  const [preloadCycle, setPreloadCycle] = useState(null);

  // Initialize preload cycle from the response's pre_loading_cycles
  // ([{ cycle: 1..5, checked }]). Nothing is checked by default, like the PHP.
  useEffect(() => {
    const checked = observations?.preLoadingCycles?.find?.((c) => c?.checked === true);
    setPreloadCycle(checked ? Number(checked.cycle) : null);
  }, [observations]);

  // Room temperature = (start temp + Temperature End) / 2, like PHP changetemp().
  // PHP's start temp is the inward item's temperature ($rowinwarditem['temperature']),
  // which is on `instrument`, not on inwardEntry. Kept unrounded for the formula.
  const roomTemperature = useMemo(() => {
    const startTemp = parseFloat(instrument?.temperature ?? inwardEntry?.temperature ?? inwardEntry?.tempstart) || 0;
    const endTemp = parseFloat(formData?.tempend) || 0;
    if (startTemp && endTemp) return (startTemp + endTemp) / 2;
    return endTemp || startTemp || 24;
  }, [instrument?.temperature, inwardEntry?.temperature, inwardEntry?.tempstart, formData?.tempend]);
  const roomTemperatureLabel = String(parseFloat(roomTemperature.toFixed(2)));

  // Temperature compensation formula from PHP: uuc0 = (0.00027 * (avgtemp - 23) + 1) * calculateduuc
  const applyTemperatureCompensation = (calculateduuc, temp) => {
    if (!calculateduuc || temp === undefined || temp === null) return null;
    const calcVal = parseFloat(calculateduuc);
    const tempVal = parseFloat(temp);
    if (isNaN(calcVal) || isNaN(tempVal)) return null;
    return ((0.00027 * (tempVal - 23) + 1) * calcVal).toFixed(1);
  };

  // Build matrix groups from observations or selectedTableData
  const matrixGroups = useMemo(() => {
    const sourceData = (observations && observations.length > 0)
      ? observations
      : (selectedTableData ? [selectedTableData] : []);

    const groups = normalizeAutmGroups(sourceData);
    if (groups.length > 0) return groups;

    if (Array.isArray(selectedTableData?.calibration_points) && selectedTableData.calibration_points.length > 0) {
      const pts = selectedTableData.calibration_points;
      const numPts = pts.map(p => parseFloat(p.point ?? p.setpoint)).filter(p => !isNaN(p));
      return [{
        matrixId: selectedTableData?.id || 'matrix-1',
        matrixType: selectedTableData?.matrixtype || selectedTableData?.name || 'Scale 1',
        leastCount: selectedTableData?.least_count ?? pts[0]?.least_count ?? 'NA',
        masterLeastCount: pts[0]?.master_least_count ?? 'NA',
        minPoint: numPts.length ? Math.min(...numPts) : '',
        maxPoint: numPts.length ? Math.max(...numPts) : '',
        classOfMachine: selectedTableData?.classofmachine ?? '',
        dialGaugeSetting: selectedTableData?.dialguageseting ?? '',
        ratio: '1',
        calibrationPoints: pts,
        raw: selectedTableData,
      }];
    }

    return [];
  }, [observations, selectedTableData]);

  if (matrixGroups.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
        No calibration points available for AUTM.
      </div>
    );
  }

  const POSITIONS = ['Position 0°', 'Position 120°', 'Position 240°', 'w/o Acce.'];
  const OBS_LABELS = ['Observation 1', 'Observation 2', 'Observation 3', 'Observation 4'];

  const handleInputChange = (key, value) => {
    if (setTableInputValues) {
      setTableInputValues((prev) => ({
        ...prev,
        [key]: value,
      }));
    }
  };

  return (
    <div className="mb-8 space-y-6">
      <h3 className="text-lg font-medium text-gray-800 dark:text-white uppercase">
        AUTM (Automatic Universal Testing Machine) Observations
      </h3>

      {/* No. Of Pre-Loading Cycle Before Calibration */}
      <div className="p-4 border border-gray-200 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-800/40">
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          No. Of Pre-Loading Cycle Before calibration
        </div>
        <div className="flex gap-6 flex-wrap">
          {[1, 2, 3, 4, 5].map((num) => (
            <label key={num} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="preload_cycle"
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                checked={preloadCycle === num}
                onChange={() => setPreloadCycle((prev) => (prev === num ? null : num))}
              />
              <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">{num}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Matrix / Scale Sections */}
      {matrixGroups.map((matrix, matrixIndex) => {
        const uucUnit = matrix.calibrationPoints[0]?.unit || selectedTableData?.metadata?.unit || 'kN';
        const masterUnit = matrix.calibrationPoints[0]?.masterunit || matrix.calibrationPoints[0]?.master_unit || uucUnit;

        const maxPoint = matrix.maxPoint || (matrix.calibrationPoints.length
          ? Math.max(...matrix.calibrationPoints.map((p) => parseFloat(p.point ?? p.setpoint)).filter((p) => !isNaN(p)))
          : 0);

        const minPoint = matrix.minPoint || (matrix.calibrationPoints.length
          ? Math.min(...matrix.calibrationPoints.map((p) => parseFloat(p.point ?? p.setpoint)).filter((p) => !isNaN(p)))
          : 0);

        const ratioKey = `${matrix.matrixId}-ratio`;
        const ratioVal = tableInputValues[ratioKey] ?? matrix.raw?.ratio ?? matrix.ratio ?? '1';

        // Calculate Max Relative Resolution from Ratio, Least Count, and Min Point
        // PHP formula: ((leastcount * (temp[0]/temp[1])) / minpoint) * 100
        const relativeResVal = (() => {
          const stored = matrix.raw?.relative_resolution ?? matrix.raw?.releativeres;
          const fallback = (stored !== undefined && stored !== null && stored !== '') ? String(stored) : '';
          if (!minPoint || !matrix.leastCount || matrix.leastCount === 'NA') return fallback;
          const parts = String(ratioVal || '1').split(':');
          const ratioFactor = parts.length > 1 && parseFloat(parts[1]) !== 0
            ? (parseFloat(parts[0]) / parseFloat(parts[1]))
            : (parseFloat(parts[0]) || 1);
          const lc = parseFloat(matrix.leastCount);
          const minp = parseFloat(minPoint);
          if (isNaN(lc) || isNaN(minp) || minp === 0) return fallback;
          return (((lc * ratioFactor) / minp) * 100).toFixed(2);
        })();

        const classKey = `${matrix.matrixId}-classofmachine`;
        const classVal = tableInputValues[classKey] ?? matrix.raw?.classofmachine ?? matrix.classOfMachine ?? '';

        const dialKey = `${matrix.matrixId}-dialguageseting`;
        const dialVal = tableInputValues[dialKey] ?? matrix.raw?.dialguageseting ?? matrix.dialGaugeSetting ?? '';

        return (
          <div key={matrix.matrixId || matrixIndex} className="space-y-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
            {/* Scale Header */}
            <div className="text-base font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-2 rounded">
              Scale : {matrix.matrixType || `Scale ${matrixIndex + 1}`}
            </div>

            {/* Main Observation Table */}
            <div className="overflow-x-auto border border-gray-200 dark:border-gray-600 rounded">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-700 border-b border-gray-300 dark:border-gray-600">
                    <th rowSpan={3} className="px-3 py-2 text-center text-xs font-medium text-gray-700 dark:text-gray-200 uppercase border-r border-gray-300 dark:border-gray-600">
                      Sr. No.
                    </th>
                    <th rowSpan={3} className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase border-r border-gray-300 dark:border-gray-600">
                      Force(F) ({uucUnit})
                    </th>
                    <th rowSpan={3} className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase border-r border-gray-300 dark:border-gray-600">
                      Std. at 24±1(°C)
                    </th>
                    <th rowSpan={3} className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase border-r border-gray-300 dark:border-gray-600">
                      <div>Std. at Room Temp(°C)</div>
                      <div className="text-xs font-normal text-blue-600 dark:text-blue-300">({roomTemperatureLabel} °C)</div>
                    </th>
                    <th colSpan={4} className="px-3 py-2 text-center text-xs font-medium text-gray-700 dark:text-gray-200 uppercase border-r border-gray-300 dark:border-gray-600">
                      Observed (F) ({masterUnit})
                    </th>
                    <th rowSpan={3} className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase border-r border-gray-300 dark:border-gray-600">
                      Mean(Fi)
                    </th>
                    <th rowSpan={3} className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase border-r border-gray-300 dark:border-gray-600">
                      Error(q)
                    </th>
                    <th rowSpan={3} className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase border-r border-gray-300 dark:border-gray-600">
                      %Error(q)
                    </th>
                    <th rowSpan={3} className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase">
                      % Repeatability Error(q)
                    </th>
                  </tr>
                  <tr className="bg-gray-50 dark:bg-gray-600 border-b border-gray-300 dark:border-gray-600">
                    {POSITIONS.map((pos) => (
                      <td key={pos} className="px-2 py-1 text-center text-xs font-medium text-gray-600 dark:text-gray-300 border-r border-gray-300 dark:border-gray-600">
                        {pos}
                      </td>
                    ))}
                  </tr>
                  <tr className="bg-gray-50 dark:bg-gray-600 border-b border-gray-300 dark:border-gray-600">
                    {OBS_LABELS.map((obs) => (
                      <td key={obs} className="px-2 py-1 text-center text-xs font-medium text-gray-500 dark:text-gray-400 border-r border-gray-300 dark:border-gray-600">
                        {obs}
                      </td>
                    ))}
                  </tr>
                </thead>

                <tbody className="bg-white dark:bg-gray-800">
                  {matrix.calibrationPoints.map((point, pointIndex) => {
                    const realId = selectedTableData?.calibration_points?.[pointIndex]?.id || 
                                   selectedTableData?.calibration_points?.[pointIndex]?.point_id || 
                                   selectedTableData?.calibration_points?.[pointIndex]?.calibration_point_id;
                    const pointId = point.id || point.calibration_point_id || point.point_id || realId || `pt-${pointIndex}`;
                    const setpoint = point.point ?? point.setpoint ?? point.set_point ?? '';

                    const mlc_dec = getDecimalPlaces(point.master_least_count ?? matrix.masterLeastCount);
                    const lc_dec = getDecimalPlaces(point.least_count ?? matrix.leastCount);
                    const error_dec = Math.max(mlc_dec, lc_dec);

                    // Calculated UUC (Standard at reference temp 24±1°C)
                    const calculatedUuc = point.calculateduuc ?? point.calculated_uuc ?? '';

                    // Std. at Room Temp: PHP applies temperature compensation only for
                    // master type 332 (Force Proving Ring); other masters use calculateduuc as-is.
                    const rawUuc = point.uuc ?? point.uuc0 ?? '';
                    const masterType = String(point.master_type ?? point.mastertype ?? point.typeofmaster ?? '');
                    const compensatedUuc = calculatedUuc !== ''
                      ? (masterType === '332'
                          ? applyTemperatureCompensation(calculatedUuc, roomTemperature)
                          : String(calculatedUuc))
                      : (rawUuc || setpoint);

                    const uucForError = compensatedUuc !== null && compensatedUuc !== '' ? compensatedUuc : setpoint;

                    // Read 4 master observation values from tableInputValues or point data
                    const masterReadings = [0, 1, 2, 3].map((pn) => {
                      const val = tableInputValues[`${pointId}-m${pn}`] ??
                        point.master_readings?.[pn] ??
                        point[`m${pn}`] ??
                        (point.observations?.find?.((o) => o.type === 'master' && Number(o.repeatable) === pn)?.value ?? '');
                      return val !== undefined && val !== null ? String(val) : '';
                    });

                    // Mean (Fi) = average of entered master readings
                    const validMasters = masterReadings
                      .map((v) => parseFloat(v))
                      .filter((v) => !isNaN(v));

                    const avgMaster = validMasters.length > 0
                      ? formatValueByLc(
                          validMasters.reduce((a, b) => a + b, 0) / validMasters.length,
                          mlc_dec,
                          point.master_least_count ?? matrix.masterLeastCount
                        )
                      : '';

                    // Error (q) = uuc - averagemaster (or averagemaster - uuc if error mode is stduuc)
                    const error = (() => {
                      if (uucForError === '' || avgMaster === '') return '';
                      const u = parseFloat(uucForError);
                      const m = parseFloat(avgMaster);
                      if (isNaN(u) || isNaN(m)) return '';
                      const diff = inwardEntry?.error_type === 'stduuc' ? (m - u) : (u - m);
                      return diff.toFixed(error_dec || 2);
                    })();

                    // % Error (q) = (error / averagemaster) * 100
                    const percentError = (() => {
                      if (error === '' || avgMaster === '' || parseFloat(avgMaster) === 0) return '';
                      const errNum = parseFloat(error);
                      const avgNum = parseFloat(avgMaster);
                      if (isNaN(errNum) || isNaN(avgNum)) return '';
                      return ((errNum / avgNum) * 100).toFixed(2);
                    })();

                    // % Repeatability Error (q) = ((max - min) / averagemaster) * 100
                    const repeatability = (() => {
                      if (validMasters.length <= 1 || !avgMaster || parseFloat(avgMaster) === 0) return '';
                      const maxVal = Math.max(...validMasters);
                      const minVal = Math.min(...validMasters);
                      const avgNum = parseFloat(avgMaster);
                      if (isNaN(avgNum)) return '';
                      return (((maxVal - minVal) / avgNum) * 100).toFixed(2);
                    })();

                    return (
                      <tr key={pointId} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        {/* Sr. No. */}
                        <td className="px-3 py-2 text-center text-sm border-r border-gray-200 dark:border-gray-600 dark:text-white">
                          {point.sr_no ?? pointIndex + 1}
                        </td>

                        {/* Force(F) */}
                        <td className="px-2 py-1 text-sm border-r border-gray-200 dark:border-gray-600">
                          <input type="hidden" name="calibrationpoint[]" value={pointId} />
                          <input type="hidden" name="type[]" value="setpoint" />
                          <input type="hidden" name="repeatable[]" value="0" />
                          <input
                            type="text"
                            name="value[]"
                            readOnly
                            id={`setpoint${pointId}`}
                            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white cursor-not-allowed text-right font-mono"
                            value={formatValueByLc(setpoint, lc_dec, point.least_count ?? matrix.leastCount)}
                          />
                        </td>

                        {/* Std. at 24±1(°C) (calculateduuc) */}
                        <td className="px-2 py-1 text-sm border-r border-gray-200 dark:border-gray-600">
                          <input type="hidden" name="calibrationpoint[]" value={pointId} />
                          <input type="hidden" name="type[]" value="calculateduuc" />
                          <input type="hidden" name="repeatable[]" value="0" />
                          <input
                            type="text"
                            name="value[]"
                            readOnly
                            id={`calculateduuc${pointId}`}
                            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white cursor-not-allowed text-right font-mono"
                            value={calculatedUuc}
                          />
                        </td>

                        {/* Std. at Room Temp(°C) (uuc0) */}
                        <td className="px-2 py-1 text-sm border-r border-gray-200 dark:border-gray-600">
                          <input type="hidden" name="calibrationpoint[]" value={pointId} />
                          <input type="hidden" name="type[]" value="uuc" />
                          <input type="hidden" name="repeatable[]" value="0" />
                          <input
                            type="text"
                            name="value[]"
                            readOnly
                            id={`uuc${pointId}`}
                            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white cursor-not-allowed text-right font-mono"
                            title={`Room Temp: ${roomTemperatureLabel}°C`}
                            value={compensatedUuc}
                          />
                        </td>

                        {/* 4 Observation Master Inputs */}
                        {[0, 1, 2, 3].map((pn) => (
                          <td key={pn} className="px-2 py-1 text-sm border-r border-gray-200 dark:border-gray-600">
                            <input type="hidden" name="calibrationpoint[]" value={pointId} />
                            <input type="hidden" name="type[]" value="master" />
                            <input type="hidden" name="repeatable[]" value={pn} />
                            <input
                              type="number"
                              name="value[]"
                              step="any"
                              id={`mast${pn}er${pointId}`}
                              className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-right font-mono"
                              value={masterReadings[pn]}
                              onChange={(e) => handleInputChange(`${pointId}-m${pn}`, e.target.value)}
                              onBlur={(e) => {
                                if (validateDecimalPlaces) {
                                  validateDecimalPlaces(`${pointId}-m${pn}`, e.target.value, point.master_least_count ?? matrix.masterLeastCount);
                                }
                                if (handleObservationBlur) {
                                  // Pass the values shown on screen so the stored copy
                                  // matches the display exactly.
                                  handleObservationBlur(
                                    pointIndex,
                                    pn + 4,
                                    e.target.value,
                                    pointId,
                                    {
                                      avgMaster,
                                      error,
                                      percentError,
                                      repeatability,
                                      setpoint,
                                      calculatedUuc,
                                      uuc: compensatedUuc,
                                    }
                                  );
                                }
                              }}
                              placeholder={`Obs ${pn + 1}`}
                            />
                          </td>
                        ))}

                        {/* Mean (Fi) (averagemaster) */}
                        <td className="px-2 py-1 text-sm border-r border-gray-200 dark:border-gray-600">
                          <input type="hidden" name="calibrationpoint[]" value={pointId} />
                          <input type="hidden" name="type[]" value="averagemaster" />
                          <input type="hidden" name="repeatable[]" value="0" />
                          <input
                            type="text"
                            name="value[]"
                            readOnly
                            id={`averagemaster${pointId}`}
                            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white cursor-not-allowed text-right font-mono font-medium"
                            value={avgMaster}
                          />
                        </td>

                        {/* Error (q) */}
                        <td className="px-2 py-1 text-sm border-r border-gray-200 dark:border-gray-600">
                          <input type="hidden" name="calibrationpoint[]" value={pointId} />
                          <input type="hidden" name="type[]" value="error" />
                          <input type="hidden" name="repeatable[]" value="0" />
                          <input
                            type="text"
                            name="value[]"
                            readOnly
                            id={`error${pointId}`}
                            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white cursor-not-allowed text-right font-mono"
                            value={error}
                          />
                        </td>

                        {/* % Error (q) */}
                        <td className="px-2 py-1 text-sm border-r border-gray-200 dark:border-gray-600">
                          <input type="hidden" name="calibrationpoint[]" value={pointId} />
                          <input type="hidden" name="type[]" value="percenterror" />
                          <input type="hidden" name="repeatable[]" value="0" />
                          <input
                            type="text"
                            name="value[]"
                            readOnly
                            id={`percenterror${pointId}`}
                            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white cursor-not-allowed text-right font-mono"
                            value={percentError}
                          />
                        </td>

                        {/* % Repeatability Error (q) */}
                        <td className="px-2 py-1 text-sm">
                          <input type="hidden" name="calibrationpoint[]" value={pointId} />
                          <input type="hidden" name="type[]" value="repeatability" />
                          <input type="hidden" name="repeatable[]" value="0" />
                          <input
                            type="text"
                            name="value[]"
                            readOnly
                            id={`repeatability${pointId}`}
                            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white cursor-not-allowed text-right font-mono"
                            value={repeatability}
                          />
                        </td>
                      </tr>
                    );
                  })}

                  {/* Observation Reading on Removal of force (fi0) */}
                  <tr className="bg-gray-50 dark:bg-gray-750 border-t-2 border-gray-300 dark:border-gray-600">
                    <th colSpan={4} className="px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase border-r border-gray-300 dark:border-gray-600">
                      Observation Reading on Removal of force (fi0)
                    </th>
                    {[0, 1, 2, 3].map((pn) => {
                      const removalKey = `${matrix.matrixId}-removalforce-${pn}`;
                      const removalVal = tableInputValues[removalKey] ??
                        matrix.raw?.removal_force?.[pn] ??
                        matrix.raw?.removalforce?.[pn] ??
                        (matrix.raw?.observations?.find?.((o) => o.type === 'removalforce' && Number(o.repeatable) === pn)?.value ?? '');

                      return (
                        <td key={pn} className="px-2 py-1 border-r border-gray-200 dark:border-gray-600">
                          <input type="hidden" name="calibrationpoint[]" value={matrix.matrixId} />
                          <input type="hidden" name="type[]" value="removalforce" />
                          <input type="hidden" name="repeatable[]" value={pn} />
                          <input
                            type="number"
                            step="any"
                            name="value[]"
                            id={`remove${pn}${matrix.matrixId}`}
                            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-right font-mono"
                            value={removalVal}
                            onChange={(e) => handleInputChange(removalKey, e.target.value)}
                            onBlur={(e) => {
                              if (handleObservationBlur) {
                                const removal = parseFloat(e.target.value);
                                const zeroError = (maxPoint && !isNaN(removal))
                                  ? ((removal / parseFloat(maxPoint)) * 100).toFixed(2)
                                  : '';
                                handleObservationBlur(
                                  matrix.calibrationPoints.length,
                                  pn + 4,
                                  e.target.value,
                                  matrix.matrixId,
                                  { zeroError }
                                );
                              }
                            }}
                            placeholder={`Rem ${pn + 1}`}
                          />
                        </td>
                      );
                    })}
                    <td colSpan={4} className="bg-gray-100 dark:bg-gray-700"></td>
                  </tr>

                  <tr className="bg-gray-50 dark:bg-gray-750 border-b border-gray-300 dark:border-gray-600">
                    <th colSpan={4} className="px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase border-r border-gray-300 dark:border-gray-600">
                      Relative Zero Error % (f0)
                    </th>
                    {[0, 1, 2, 3].map((pn) => {
                      const removalKey = `${matrix.matrixId}-removalforce-${pn}`;
                      const removalVal = tableInputValues[removalKey] ??
                        matrix.raw?.removal_force?.[pn] ??
                        matrix.raw?.removalforce?.[pn] ??
                        (matrix.raw?.observations?.find?.((o) => o.type === 'removalforce' && Number(o.repeatable) === pn)?.value ?? '');

                      const zeroErr = (maxPoint && removalVal !== '' && !isNaN(parseFloat(removalVal)))
                        ? ((parseFloat(removalVal) / parseFloat(maxPoint)) * 100).toFixed(2)
                        : (matrix.raw?.zero_error?.[pn] ?? matrix.raw?.zeroerror?.[pn] ?? '');

                      return (
                        <td key={pn} className="px-2 py-1 border-r border-gray-200 dark:border-gray-600">
                          <input type="hidden" name="calibrationpoint[]" value={matrix.matrixId} />
                          <input type="hidden" name="type[]" value="zeroerror" />
                          <input type="hidden" name="repeatable[]" value={pn} />
                          <input
                            type="text"
                            name="value[]"
                            readOnly
                            id={`zero${pn}err${matrix.matrixId}`}
                            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white cursor-not-allowed text-right font-mono"
                            value={zeroErr}
                          />
                        </td>
                      );
                    })}
                    <td colSpan={4} className="bg-gray-100 dark:bg-gray-700"></td>
                  </tr>

                  <tr className="border-b border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800">
                    <td colSpan={2} className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-600">
                      Least count
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-900 dark:text-white font-mono border-r border-gray-200 dark:border-gray-600">
                      {matrix.leastCount}
                    </td>
                    <td className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-600">
                      Min Point
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-900 dark:text-white font-mono border-r border-gray-200 dark:border-gray-600">
                      {minPoint}
                    </td>
                    <td className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-600">
                      Ratio
                    </td>
                    <td className="px-2 py-1 border-r border-gray-200 dark:border-gray-600">
                      <input type="hidden" name="calibrationpoint[]" value={matrix.matrixId} />
                      <input type="hidden" name="type[]" value="ratio" />
                      <input type="hidden" name="repeatable[]" value="0" />
                      <input
                        type="text"
                        name="value[]"
                        id={`ratio${matrix.matrixId}`}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-center"
                        value={ratioVal}
                        onChange={(e) => handleInputChange(ratioKey, e.target.value)}
                        onBlur={(e) => {
                          if (handleObservationBlur) {
                            handleObservationBlur(
                              matrix.calibrationPoints.length + 2,
                              10,
                              e.target.value,
                              matrix.matrixId,
                              { relativeRes: relativeResVal }
                            );
                          }
                        }}
                        placeholder="e.g. 1:1"
                      />
                    </td>
                    <td colSpan={2} className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-600">
                      Max Relative Resolution
                    </td>
                    <td colSpan={2} className="px-2 py-1">
                      <input type="hidden" name="calibrationpoint[]" value={matrix.matrixId} />
                      <input type="hidden" name="type[]" value="releativeres" />
                      <input type="hidden" name="repeatable[]" value="0" />
                      <input
                        type="text"
                        name="value[]"
                        readOnly
                        id={`releativeres${matrix.matrixId}`}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white cursor-not-allowed font-mono text-right"
                        value={relativeResVal}
                      />
                    </td>
                  </tr>

                  {/* Class of Machine & Dial Gauge Setting */}
                  <tr className="bg-white dark:bg-gray-800">
                    <td colSpan={3} className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-600">
                      Class of Machine
                    </td>
                    <td colSpan={2} className="px-2 py-1 border-r border-gray-200 dark:border-gray-600">
                      <input type="hidden" name="calibrationpoint[]" value={matrix.matrixId} />
                      <input type="hidden" name="type[]" value="classofmachine" />
                      <input type="hidden" name="repeatable[]" value="0" />
                      <input
                        type="text"
                        name="value[]"
                        id={`classofmachine${matrix.matrixId}`}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                        value={classVal}
                        onChange={(e) => handleInputChange(classKey, e.target.value)}
                        onBlur={(e) => {
                          if (handleObservationBlur) {
                            handleObservationBlur(
                              matrix.calibrationPoints.length + 3,
                              1,
                              e.target.value,
                              matrix.matrixId
                            );
                          }
                        }}
                        placeholder="Enter class"
                      />
                    </td>
                    <td colSpan={3} className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-600">
                      Dial Gauge Setting……..Revolution Pre-stress
                    </td>
                    <td colSpan={4} className="px-2 py-1">
                      <input type="hidden" name="calibrationpoint[]" value={matrix.matrixId} />
                      <input type="hidden" name="type[]" value="dialguageseting" />
                      <input type="hidden" name="repeatable[]" value="0" />
                      <input
                        type="text"
                        name="value[]"
                        id={`dialguageseting${matrix.matrixId}`}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                        value={dialVal}
                        onChange={(e) => handleInputChange(dialKey, e.target.value)}
                        onBlur={(e) => {
                          if (handleObservationBlur) {
                            handleObservationBlur(
                              matrix.calibrationPoints.length + 3,
                              9,
                              e.target.value,
                              matrix.matrixId
                            );
                          }
                        }}
                        placeholder="Enter dial gauge setting"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
};



export default ObservationAUTM;