import { useMemo } from 'react';
import { safeGetValue } from './viewRawDataUtils';

/**
 * Normalizes AUTM observation data into matrix groups.
 */
export const normalizeAutmGroups = (observationData) => {
  if (!observationData) return [];
  const source = Array.isArray(observationData) ? observationData : [observationData].filter(Boolean);

  return source.flatMap((item, index) => {
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
      // Only treat the item itself as a point when it is not a matrix wrapper,
      // otherwise a matrix (which also has an id) becomes one bogus row.
      ((item?.point_id || item?.id) && !item?.matrix_id && !item?.matrixid ? [item] : []);

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
        relativeRes: item?.releativeres ?? item?.relative_resolution ?? '',
        removalForce: item?.removalforce ?? item?.removal_force ?? [],
        zeroError: item?.zeroerror ?? item?.zero_error ?? [],
        calibrationPoints,
        raw: item,
      }];
    }

    return [];
  });
};

/**
 * Extracts specific observation value from point or observations array.
 */
const getVal = (point, type, repeatable = 0) => {
  if (!point) return '';
  const repStr = repeatable.toString();

  if (Array.isArray(point.observations)) {
    const found = point.observations.find(
      (o) => o?.type === type && Number(o?.repeatable) === Number(repeatable)
    );
    if (found && found.value !== undefined && found.value !== null) {
      return String(found.value);
    }
  }

  if (point[type] !== undefined) {
    if (Array.isArray(point[type])) {
      return safeGetValue(point[type][repeatable]);
    }
    if (typeof point[type] === 'object' && point[type] !== null) {
      return safeGetValue(point[type][repeatable] ?? point[type][repStr] ?? point[type].value);
    }
    if (repeatable === 0) return safeGetValue(point[type]);
  }

  if (type === 'master') {
    const m = point.master_readings ?? point.master_values ?? point.observed_f;
    if (Array.isArray(m)) return safeGetValue(m[repeatable]);
    if (point[`m${repeatable}`] !== undefined) return safeGetValue(point[`m${repeatable}`]);
  }

  if (type === 'setpoint') {
    return safeGetValue(point.point ?? point.setpoint ?? point.set_point);
  }
  if (type === 'calculateduuc') {
    return safeGetValue(point.calculateduuc ?? point.calculated_uuc);
  }
  if (type === 'uuc') {
    return safeGetValue(point.uuc ?? point.uuc0);
  }

  return '';
};

/**
 * Table configuration for AUTM
 */
export const autmTableConfig = {
  id: 'observationautm',
  name: 'Observation AUTM',
  category: 'Force',
  structure: {
    singleHeaders: [
      'Sr. No.',
      'Force(F)',
      'Std.at 24±1(°C)',
      'Std.at Room Temp(°C)',
    ],
    subHeaders: {
      'Observed (F)': ['Position 0°', 'Position 120°', 'Position 240°', 'w/o Acce.'],
      'Relative Indicative Error': ['q1', 'q2', 'q3', 'q4'],
    },
    remainingHeaders: ['% Error(q) (q1+q2+q3+q4)/4', 'Repatability Error in % qMax-qMin'],
  },
};

/**
 * Builds 14-column rows matching the PHP raw data logic
 */
export const createAUTMRows = (observationData, currentRawdata) => {
  const groups = normalizeAutmGroups(observationData);
  const rows = [];

  const inwardEntry = currentRawdata?.inwardentry || currentRawdata?.inwardEntry;
  const startTemp = parseFloat(inwardEntry?.temperature) || 0;
  const endTemp = parseFloat(currentRawdata?.instrument?.tempend || currentRawdata?.tempend) || 0;
  const avgTemp = (startTemp && endTemp) ? (startTemp + endTemp) / 2 : 24;

  groups.forEach((group) => {
    group.calibrationPoints.forEach((point, pointIndex) => {
      const srNo = point?.sr_no?.toString() || (pointIndex + 1).toString();
      const setpoint = getVal(point, 'setpoint', 0);
      const calculateduuc = getVal(point, 'calculateduuc', 0);

      // Temperature-compensated UUC
      let uuc0 = getVal(point, 'uuc', 0);
      if (!uuc0 && calculateduuc) {
        const numCalc = parseFloat(calculateduuc);
        if (!isNaN(numCalc)) {
          uuc0 = ((0.00027 * (avgTemp - 23) + 1) * numCalc).toFixed(1);
        }
      }
      if (!uuc0) uuc0 = setpoint;

      const numUuc0 = parseFloat(uuc0);

      // 4 Observed master readings
      const masterValues = [0, 1, 2, 3].map((pn) => getVal(point, 'master', pn));

      // 4 Relative Indicative Errors: qi = ((observed - uuc0) / uuc0) * 100
      let qErrors = [];
      let sumQ = 0;
      let validQCount = 0;

      masterValues.forEach((obsVal) => {
        const numObs = parseFloat(obsVal);
        if (!isNaN(numObs) && !isNaN(numUuc0) && numUuc0 !== 0) {
          const q = ((numObs - numUuc0) / numUuc0) * 100;
          qErrors.push(q);
          sumQ += q;
          validQCount++;
        } else {
          qErrors.push(null);
        }
      });

      const avgQ = validQCount > 0 ? (sumQ / 4).toFixed(2) : '';
      const validNumericQ = qErrors.filter((q) => q !== null);
      const diffQ = validNumericQ.length > 1
        ? (Math.max(...validNumericQ) - Math.min(...validNumericQ)).toFixed(2)
        : '';

      const formattedQErrors = qErrors.map((q) => (q !== null ? q.toFixed(2) : ''));

      rows.push([
        srNo,
        setpoint,
        calculateduuc,
        uuc0,
        ...masterValues,
        ...formattedQErrors,
        avgQ,
        diffQ,
      ]);
    });
  });

  return rows;
};

/**
 * Parser for dynamic AUTM observations
 */
export const parseAUTMDynamicData = (observationData) => {
  if (!observationData) return [];
  if (Array.isArray(observationData)) return observationData;
  if (observationData.matrices && Array.isArray(observationData.matrices)) {
    const matrices = observationData.matrices;
    // pre_loading_cycles sits next to matrices, not inside them. Attach it so the
    // component can render the checkboxes from the response instead of guessing.
    if (Array.isArray(observationData.pre_loading_cycles)) {
      matrices.preLoadingCycles = observationData.pre_loading_cycles;
    }
    return matrices;
  }
  if (observationData.matrix && Array.isArray(observationData.matrix)) return observationData.matrix;
  if (observationData.calibration_points && Array.isArray(observationData.calibration_points)) return observationData.calibration_points;
  if (observationData.data && Array.isArray(observationData.data)) return observationData.data;
  return [];
};

/**
 * ViewObservationAUTM Component
 * Renders the exact raw data table matching the PHP layout:
 * - Pre-Loading Cycle (1 to 5)
 * - Scale : {matrixtype}
 * - 14-Column table:
 *   [Sr. No., Force(F), Std.at 24±1°C, Std.at Room Temp, Observed 1-4, q1-q4, % Error(q), Repeatability Error in %]
 * - Observation Reading on Removal of force (fi0) + Least count
 * - Relative Zero Error % (f0)
 * - Min Point, Ratio, Max Relative Resolution
 * - Class of Machine, Dial Gauge Setting
 */
export const ViewObservationAUTM = ({
  rawdata,
  currentRawdata,
  dynamicObservations,
}) => {
  const data = useMemo(() => currentRawdata || rawdata || {}, [currentRawdata, rawdata]);
  const inwardEntry = data.inwardentry || data.inwardEntry;

  // Compute tableSuffix matching PHP: changedateformatespecito($rowinward['addedon'], "Y-m-d H:i:s", "Ymd")
  const tableSuffix = useMemo(() => {
    const addedon = inwardEntry?.addedon || data?.addedon || '';
    if (!addedon) return '99999999';
    const str = String(addedon).trim();
    const dateMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (dateMatch) {
      return `${dateMatch[1]}${dateMatch[2]}${dateMatch[3]}`;
    }
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}${m}${day}`;
    }
    return '99999999';
  }, [inwardEntry?.addedon, data?.addedon]);

  const isModern = tableSuffix > '20220306';

  // Temperature calculation
  const roomTemp = useMemo(() => {
    const startTemp = parseFloat(inwardEntry?.temperature) || 0;
    const endTemp = parseFloat(data?.instrument?.tempend || data?.tempend) || 0;
    if (startTemp && endTemp) {
      return ((startTemp + endTemp) / 2).toFixed(1);
    }
    return startTemp ? startTemp.toFixed(1) : '24.0';
  }, [inwardEntry?.temperature, data?.instrument?.tempend, data?.tempend]);

  // Pre-loading cycles: checked state comes from the response; nothing is checked
  // by default, matching the PHP which renders all five boxes unchecked.
  const preLoadingCycles = useMemo(() => {
    const source =
      dynamicObservations?.preLoadingCycles ||
      data?.pre_loading_cycles ||
      data?.preLoadingCycles;

    const checkedSet = new Set(
      (Array.isArray(source) ? source : [])
        .filter((c) => c?.checked === true)
        .map((c) => Number(c.cycle))
    );

    return [1, 2, 3, 4, 5].map((num) => ({ num, checked: checkedSet.has(num) }));
  }, [dynamicObservations, data?.pre_loading_cycles, data?.preLoadingCycles]);

  // Source observations
  const matrixGroups = useMemo(() => {
    const source =
      dynamicObservations && dynamicObservations.length > 0
        ? dynamicObservations
        : data.calibration_points || data.matrices || data.matrix || data.observations || [];

    const groups = normalizeAutmGroups(source);
    if (groups.length > 0) return groups;

    if (Array.isArray(data?.calibration_points) && data.calibration_points.length > 0) {
      const pts = data.calibration_points;
      const numPts = pts.map((p) => parseFloat(p.point ?? p.setpoint)).filter((p) => !isNaN(p));
      return [{
        matrixId: 'matrix-1',
        matrixType: data?.matrixtype || 'Scale 1',
        leastCount: pts[0]?.least_count ?? 'NA',
        minPoint: numPts.length ? Math.min(...numPts) : '',
        maxPoint: numPts.length ? Math.max(...numPts) : '',
        classOfMachine: '',
        dialGaugeSetting: '',
        ratio: '1',
        calibrationPoints: pts,
        raw: data,
      }];
    }

    return [];
  }, [dynamicObservations, data]);

  if (matrixGroups.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        No AUTM observation data available.
      </div>
    );
  }

  const POSITIONS = ['Position 0°', 'Position 120°', 'Position 240°', 'w/o Acce.'];
  const OBS_LABELS = ['Observation 1', 'Observation 2', 'Observation 3', 'Observation 4'];

  return (
    <div className="space-y-6 my-4 print:space-y-4">
      {/* No. Of Pre-Loading Cycle Before calibration */}
      <div className="overflow-x-auto">
        <table className="w-full border border-gray-300 text-sm border-collapse bg-white">
          <tbody>
            <tr className="bg-gray-50">
              <td colSpan={4} className="border border-gray-300 px-3 py-2 font-medium text-gray-700">
                No. Of Pre-Loading Cycle Before calibration
              </td>
              {preLoadingCycles.map(({ num, checked }) => (
                <td key={num} className="border border-gray-300 px-3 py-2 text-center">
                  <div className="inline-flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={checked}
                      readOnly
                      className="w-4 h-4 text-blue-600 rounded border-gray-300"
                    />
                    <label className="text-sm font-medium text-gray-700">{num}</label>
                  </div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Each Matrix / Scale Table */}
      {matrixGroups.map((matrix, mIdx) => {
        const uucUnit = matrix.calibrationPoints[0]?.unit || 'kN';

        const maxPoint = matrix.maxPoint || (matrix.calibrationPoints.length
          ? Math.max(...matrix.calibrationPoints.map((p) => parseFloat(p.point ?? p.setpoint)).filter((p) => !isNaN(p)))
          : 0);

        const minPoint = matrix.minPoint || (matrix.calibrationPoints.length
          ? Math.min(...matrix.calibrationPoints.map((p) => parseFloat(p.point ?? p.setpoint)).filter((p) => !isNaN(p)))
          : 0);

        const mainLeastCount = matrix.leastCount ?? '';
        const ratio = matrix.ratio || '1';

        // Max Relative Resolution calculation: ((leastcount * ratioFactor) / minpoint) * 100
        const maxRelRes = (() => {
          if (!minPoint || !mainLeastCount || mainLeastCount === 'NA') return '';
          const parts = String(ratio).split(':');
          const factor = parts.length > 1 && parseFloat(parts[1]) !== 0
            ? (parseFloat(parts[0]) / parseFloat(parts[1]))
            : (parseFloat(parts[0]) || 1);
          const lc = parseFloat(mainLeastCount);
          const minp = parseFloat(minPoint);
          if (isNaN(lc) || isNaN(minp) || minp === 0) return '';
          return (((lc * factor) / minp) * 100).toFixed(2);
        })();

        return (
          <div key={matrix.matrixId || mIdx} className="space-y-2">
            {/* Scale Header */}
            <div className="font-semibold text-sm text-gray-800 bg-gray-100 p-2 border border-gray-300">
              Scale : {matrix.matrixType || `Scale ${mIdx + 1}`}
            </div>

            {/* Main Observation Table */}
            <div className="overflow-x-auto">
              {isModern ? (
                <table className="w-full border border-gray-300 text-sm border-collapse bg-white">
                  <thead>
                    <tr className="bg-gray-100">
                      <th rowSpan={3} className="border border-gray-300 px-3 py-2 text-center font-medium text-gray-700">
                        Sr. No.
                      </th>
                      <th rowSpan={3} className="border border-gray-300 px-3 py-2 text-center font-medium text-gray-700">
                        Force(F) ({uucUnit})
                      </th>
                      <th rowSpan={3} className="border border-gray-300 px-3 py-2 text-center font-medium text-gray-700">
                        Std.at 24±1(°C)
                      </th>
                      <th rowSpan={3} className="border border-gray-300 px-3 py-2 text-center font-medium text-gray-700">
                        <div>Std.at Room Temp(°C)</div>
                        <div className="text-xs text-blue-600 font-normal">({roomTemp} °C)</div>
                      </th>
                      <th colSpan={4} className="border border-gray-300 px-3 py-2 text-center font-medium text-gray-700" style={{ maxWidth: '170px' }}>
                        Observed (F)
                      </th>
                      <th colSpan={4} className="border border-gray-300 px-3 py-2 text-center font-medium text-gray-700">
                        Relative Indicative Error
                      </th>
                      <th rowSpan={3} className="border border-gray-300 px-3 py-2 text-center font-medium text-gray-700">
                        % Error(q) (q1+q2+q3+q4)/4
                      </th>
                      <th rowSpan={3} className="border border-gray-300 px-3 py-2 text-center font-medium text-gray-700">
                        Repatability Error in % qMax-qMin
                      </th>
                    </tr>
                    <tr className="bg-gray-50 text-xs">
                      {POSITIONS.map((pos) => (
                        <td key={pos} className="border border-gray-300 px-2 py-1 text-center font-medium text-gray-600">
                          {pos}
                        </td>
                      ))}
                      <td rowSpan={2} className="border border-gray-300 px-2 py-1 text-center font-medium text-gray-600">q1</td>
                      <td rowSpan={2} className="border border-gray-300 px-2 py-1 text-center font-medium text-gray-600">q2</td>
                      <td rowSpan={2} className="border border-gray-300 px-2 py-1 text-center font-medium text-gray-600">q3</td>
                      <td rowSpan={2} className="border border-gray-300 px-2 py-1 text-center font-medium text-gray-600">q4</td>
                    </tr>
                    <tr className="bg-gray-50 text-xs">
                      {OBS_LABELS.map((obs) => (
                        <td key={obs} className="border border-gray-300 px-2 py-1 text-center text-gray-500">
                          {obs}
                        </td>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {matrix.calibrationPoints.map((point, pointIndex) => {
                      const srNo = point?.sr_no?.toString() || (pointIndex + 1).toString();
                      const setpoint = getVal(point, 'setpoint', 0);
                      const calculateduuc = getVal(point, 'calculateduuc', 0);

                      // Room temp compensated UUC
                      let uuc0 = getVal(point, 'uuc', 0);
                      if (!uuc0 && calculateduuc) {
                        const numCalc = parseFloat(calculateduuc);
                        const numTemp = parseFloat(roomTemp);
                        if (!isNaN(numCalc) && !isNaN(numTemp)) {
                          uuc0 = ((0.00027 * (numTemp - 23) + 1) * numCalc).toFixed(1);
                        }
                      }
                      if (!uuc0) uuc0 = setpoint;

                      const numUuc0 = parseFloat(uuc0);

                      // 4 Master observations
                      const masterValues = [0, 1, 2, 3].map((pn) => getVal(point, 'master', pn));

                      // 4 Relative Indicative Errors: qi = ((observed - uuc0) / uuc0) * 100
                      const qErrors = [];
                      let sumQ = 0;
                      let validCount = 0;

                      masterValues.forEach((obsVal) => {
                        const numObs = parseFloat(obsVal);
                        if (!isNaN(numObs) && !isNaN(numUuc0) && numUuc0 !== 0) {
                          const q = ((numObs - numUuc0) / numUuc0) * 100;
                          qErrors.push(q);
                          sumQ += q;
                          validCount++;
                        } else {
                          qErrors.push(null);
                        }
                      });

                      const avgQ = validCount > 0 ? (sumQ / 4).toFixed(2) : '';
                      const validNumericQ = qErrors.filter((q) => q !== null);
                      const diffQ = validNumericQ.length > 1
                        ? (Math.max(...validNumericQ) - Math.min(...validNumericQ)).toFixed(2)
                        : '';

                      return (
                        <tr key={point.id || pointIndex} className={pointIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="border border-gray-300 px-3 py-2 text-center">{srNo}</td>
                          <td className="border border-gray-300 px-3 py-2 text-right font-mono">{setpoint}</td>
                          <td className="border border-gray-300 px-3 py-2 text-right font-mono">{calculateduuc}</td>
                          <td className="border border-gray-300 px-3 py-2 text-right font-mono">{uuc0}</td>
                          {masterValues.map((val, idx) => (
                            <td key={idx} className="border border-gray-300 px-2 py-1 text-right font-mono">
                              {val}
                            </td>
                          ))}
                          {qErrors.map((q, idx) => (
                            <td key={idx} className="border border-gray-300 px-2 py-1 text-right font-mono font-medium text-gray-800">
                              {q !== null ? q.toFixed(2) : ''}
                            </td>
                          ))}
                          <td className="border border-gray-300 px-3 py-2 text-right font-mono font-semibold text-gray-900">
                            {avgQ}
                          </td>
                          <td className="border border-gray-300 px-3 py-2 text-right font-mono font-semibold text-gray-900">
                            {diffQ}
                          </td>
                        </tr>
                      );
                    })}

                    {/* Removal of force row + Least count */}
                    <tr className="bg-gray-50 border-t-2 border-gray-300 font-medium">
                      <th colSpan={4} className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-700">
                        Observation Reading on <br />Removal of force (fi0)
                      </th>
                      {[0, 1, 2, 3].map((pn) => {
                        const removalVal = matrix.raw?.removalforce?.[pn] ??
                          matrix.removalForce?.[pn] ??
                          getVal(matrix.raw, 'removalforce', pn);

                        return (
                          <td key={pn} className="border border-gray-300 px-2 py-1 text-right font-mono">
                            {removalVal}
                          </td>
                        );
                      })}
                      <td colSpan={4} className="border border-gray-300 px-3 py-2 text-center font-medium text-gray-700 bg-gray-100">
                        Least count
                      </td>
                      <td colSpan={2} className="border border-gray-300 px-3 py-2 text-center font-mono font-semibold">
                        {mainLeastCount}
                      </td>
                    </tr>

                    {/* Relative Zero Error % (f0) */}
                    <tr className="bg-gray-50">
                      <th colSpan={4} className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-700">
                        Relative Zero Error % (f0)
                      </th>
                      {[0, 1, 2, 3].map((pn) => {
                        const removalVal = matrix.raw?.removalforce?.[pn] ??
                          matrix.removalForce?.[pn] ??
                          getVal(matrix.raw, 'removalforce', pn);

                        const zeroErr = (maxPoint && removalVal !== '' && !isNaN(parseFloat(removalVal)))
                          ? ((parseFloat(removalVal) / parseFloat(maxPoint)) * 100).toFixed(2)
                          : (matrix.raw?.zeroerror?.[pn] ?? matrix.zeroError?.[pn] ?? '');

                        return (
                          <td key={pn} className="border border-gray-300 px-2 py-1 text-right font-mono font-medium">
                            {zeroErr}
                          </td>
                        );
                      })}
                      <td colSpan={6} className="border border-gray-300 bg-gray-50"></td>
                    </tr>

                    {/* Min Point, Ratio, Max Relative Resolution */}
                    <tr className="bg-white">
                      <td colSpan={2} className="border border-gray-300 px-3 py-2 font-medium text-gray-700">
                        Min Point
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-center font-mono">
                        {minPoint}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 font-medium text-gray-700 text-center">
                        Ratio
                      </td>
                      <td className="border border-gray-300 px-2 py-1 text-center font-mono">
                        {ratio}
                      </td>
                      <td colSpan={2} className="border border-gray-300 px-3 py-2 font-medium text-gray-700 text-center">
                        Max Relative Resolution
                      </td>
                      <td colSpan={1} className="border border-gray-300 px-3 py-2 text-right font-mono font-medium">
                        {maxRelRes}
                      </td>
                      <td colSpan={6} className="border border-gray-300 bg-gray-50"></td>
                    </tr>

                    {/* Class of Machine & Dial Gauge Setting */}
                    <tr className="bg-white">
                      <td colSpan={2} className="border border-gray-300 px-3 py-2 font-medium text-gray-700">
                        Class of Machine
                      </td>
                      <td className="border border-gray-300 px-3 py-2 font-mono">
                        {matrix.classOfMachine || matrix.raw?.classofmachine || ''}
                      </td>
                      <td colSpan={2} className="border-t border-b border-gray-300 px-3 py-2 text-sm text-gray-700">
                        Dial Gauge Setting: &nbsp;&nbsp; N.A.
                      </td>
                      <td colSpan={2} className="border-t border-b border-gray-300 px-3 py-2 text-sm text-gray-700">
                        Revolution Pre-stress
                      </td>
                      <td className="border border-gray-300 px-2 py-1 font-mono text-center">
                        {matrix.dialGaugeSetting || matrix.raw?.dialguageseting || ''}
                      </td>
                      <td colSpan={6} className="border border-gray-300 bg-gray-50"></td>
                    </tr>
                  </tbody>
                </table>
              ) : (
                /* Legacy table layout for addedon <= 20220306 matching PHP else block */
                <table className="w-full border border-gray-300 text-sm border-collapse bg-white">
                  <thead>
                    <tr className="bg-gray-100">
                      <th rowSpan={3} className="border border-gray-300 px-3 py-2 text-center font-medium text-gray-700">
                        Sr. No.
                      </th>
                      <th rowSpan={3} className="border border-gray-300 px-3 py-2 text-center font-medium text-gray-700">
                        Force(F) ({uucUnit})
                      </th>
                      <th rowSpan={3} className="border border-gray-300 px-3 py-2 text-center font-medium text-gray-700">
                        Std.at 24±1(°C)
                      </th>
                      <th rowSpan={3} className="border border-gray-300 px-3 py-2 text-center font-medium text-gray-700">
                        <div>Std.at Room Temp(°C)</div>
                        <div className="text-xs text-blue-600 font-normal">({roomTemp} °C)</div>
                      </th>
                      <th colSpan={4} className="border border-gray-300 px-3 py-2 text-center font-medium text-gray-700" style={{ maxWidth: '170px' }}>
                        Observed (F)
                      </th>
                      <th rowSpan={3} className="border border-gray-300 px-3 py-2 text-center font-medium text-gray-700">
                        Mean(Fi)
                      </th>
                      <th rowSpan={3} className="border border-gray-300 px-3 py-2 text-center font-medium text-gray-700">
                        Error(q)
                      </th>
                      <th rowSpan={3} className="border border-gray-300 px-3 py-2 text-center font-medium text-gray-700">
                        %Error(q)
                      </th>
                      <th rowSpan={3} className="border border-gray-300 px-3 py-2 text-center font-medium text-gray-700">
                        % Repeatability Error(q)
                      </th>
                    </tr>
                    <tr className="bg-gray-50 text-xs">
                      {POSITIONS.map((pos) => (
                        <td key={pos} className="border border-gray-300 px-2 py-1 text-center font-medium text-gray-600">
                          {pos}
                        </td>
                      ))}
                    </tr>
                    <tr className="bg-gray-50 text-xs">
                      {OBS_LABELS.map((obs) => (
                        <td key={obs} className="border border-gray-300 px-2 py-1 text-center text-gray-500">
                          {obs}
                        </td>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {matrix.calibrationPoints.map((point, pointIndex) => {
                      const srNo = point?.sr_no?.toString() || (pointIndex + 1).toString();
                      const setpoint = getVal(point, 'setpoint', 0);
                      const calculateduuc = getVal(point, 'calculateduuc', 0);

                      let uuc0 = getVal(point, 'uuc', 0);
                      if (!uuc0 && calculateduuc) {
                        const numCalc = parseFloat(calculateduuc);
                        const numTemp = parseFloat(roomTemp);
                        if (!isNaN(numCalc) && !isNaN(numTemp)) {
                          uuc0 = ((0.00027 * (numTemp - 23) + 1) * numCalc).toFixed(1);
                        }
                      }
                      if (!uuc0) uuc0 = setpoint;

                      const masterValues = [0, 1, 2, 3].map((pn) => getVal(point, 'master', pn));
                      const meanVal = getVal(point, 'averagemaster', 0);
                      const errorVal = getVal(point, 'error', 0);
                      const percentErrorVal = getVal(point, 'percenterror', 0);
                      const repeatabilityVal = getVal(point, 'repeatability', 0);

                      return (
                        <tr key={point.id || pointIndex} className={pointIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="border border-gray-300 px-3 py-2 text-center">{srNo}</td>
                          <td className="border border-gray-300 px-3 py-2 text-right font-mono">{setpoint}</td>
                          <td className="border border-gray-300 px-3 py-2 text-right font-mono">{calculateduuc}</td>
                          <td className="border border-gray-300 px-3 py-2 text-right font-mono">{uuc0}</td>
                          {masterValues.map((val, idx) => (
                            <td key={idx} className="border border-gray-300 px-2 py-1 text-right font-mono">
                              {val}
                            </td>
                          ))}
                          <td className="border border-gray-300 px-3 py-2 text-right font-mono">{meanVal}</td>
                          <td className="border border-gray-300 px-3 py-2 text-right font-mono">{errorVal}</td>
                          <td className="border border-gray-300 px-3 py-2 text-right font-mono">{percentErrorVal}</td>
                          <td className="border border-gray-300 px-3 py-2 text-right font-mono">{repeatabilityVal}</td>
                        </tr>
                      );
                    })}

                    {/* Legacy Removal of force */}
                    <tr className="bg-gray-50 border-t-2 border-gray-300 font-medium">
                      <th colSpan={4} className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-700">
                        Observation Reading on <br />Removal of force (fi0)
                      </th>
                      {[0, 1, 2, 3].map((pn) => {
                        const removalVal = matrix.raw?.removalforce?.[pn] ??
                          matrix.removalForce?.[pn] ??
                          getVal(matrix.raw, 'removalforce', pn);
                        return (
                          <td key={pn} className="border border-gray-300 px-2 py-1 text-right font-mono">
                            {removalVal}
                          </td>
                        );
                      })}
                      <td colSpan={4} className="border border-gray-300 bg-gray-50"></td>
                    </tr>

                    {/* Legacy Relative Zero Error */}
                    <tr className="bg-gray-50">
                      <th colSpan={4} className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-700">
                        Relative Zero Error % (f0)
                      </th>
                      {[0, 1, 2, 3].map((pn) => {
                        const removalVal = matrix.raw?.removalforce?.[pn] ??
                          matrix.removalForce?.[pn] ??
                          getVal(matrix.raw, 'removalforce', pn);
                        const zeroErr = (maxPoint && removalVal !== '' && !isNaN(parseFloat(removalVal)))
                          ? ((parseFloat(removalVal) / parseFloat(maxPoint)) * 100).toFixed(2)
                          : (matrix.raw?.zeroerror?.[pn] ?? matrix.zeroError?.[pn] ?? '');
                        return (
                          <td key={pn} className="border border-gray-300 px-2 py-1 text-right font-mono font-medium">
                            {zeroErr}
                          </td>
                        );
                      })}
                      <td colSpan={4} className="border border-gray-300 bg-gray-50"></td>
                    </tr>

                    {/* Legacy Min Point, Ratio, Max Relative Resolution */}
                    <tr className="bg-white">
                      <td colSpan={2} className="border border-gray-300 px-3 py-2 font-medium text-gray-700">
                        Least count
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-center font-mono">
                        {mainLeastCount}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 font-medium text-gray-700 text-center">
                        Min Point
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-center font-mono">
                        {minPoint}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 font-medium text-gray-700 text-center">
                        Ratio
                      </td>
                      <td className="border border-gray-300 px-2 py-1 text-center font-mono">
                        {ratio}
                      </td>
                      <td colSpan={2} className="border border-gray-300 px-3 py-2 font-medium text-gray-700 text-center">
                        Max Relative Resolution
                      </td>
                      <td colSpan={2} className="border border-gray-300 px-3 py-2 text-right font-mono font-medium">
                        {maxRelRes}
                      </td>
                      <td className="border border-gray-300 bg-gray-50"></td>
                    </tr>

                    {/* Legacy Class of Machine & Dial Gauge Setting */}
                    <tr className="bg-white">
                      <td colSpan={3} className="border border-gray-300 px-3 py-2 font-medium text-gray-700">
                        Class of Machine
                      </td>
                      <td className="border border-gray-300 px-3 py-2 font-mono">
                        {matrix.classOfMachine || matrix.raw?.classofmachine || ''}
                      </td>
                      <td colSpan={3} className="border border-gray-300 px-3 py-2 text-sm text-gray-700">
                        Dial Gauge Setting……..Revolution Pre-stress
                      </td>
                      <td className="border border-gray-300 px-2 py-1 font-mono text-center">
                        {matrix.dialGaugeSetting || matrix.raw?.dialguageseting || ''}
                      </td>
                      <td colSpan={4} className="border border-gray-300 bg-gray-50"></td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ViewObservationAUTM;