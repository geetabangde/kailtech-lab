import { useMemo } from 'react';
import { safeGetValue, normalizeUtmGroups } from './viewRawDataUtils';

/**
 * Extracts a specific observation value from a calibration point.
 * Supports both flat field access and observations[] array.
 */
const getVal = (point, type, repeatable = 0) => {
    if (!point) return '';
    const repStr = repeatable.toString();

    // Search observations array first
    if (Array.isArray(point.observations)) {
        const found = point.observations.find(
            (o) => o?.type === type && Number(o?.repeatable) === Number(repeatable)
        );
        if (found && found.value !== undefined && found.value !== null) {
            return String(found.value);
        }
    }

    // Direct field access
    if (point[type] !== undefined) {
        if (Array.isArray(point[type])) return safeGetValue(point[type][repeatable]);
        if (typeof point[type] === 'object' && point[type] !== null) {
            return safeGetValue(point[type][repeatable] ?? point[type][repStr] ?? point[type].value);
        }
        if (repeatable === 0) return safeGetValue(point[type]);
    }

    // Fallback for 'master' readings
    if (type === 'master') {
        const m = point.master_readings ?? point.master_values ?? point.observed_f;
        if (Array.isArray(m)) return safeGetValue(m[repeatable]);
        if (point[`m${repeatable}`] !== undefined) return safeGetValue(point[`m${repeatable}`]);
    }

    // Typed field aliases
    const aliases = {
        setpoint: point.force ?? point.point ?? point.setpoint ?? point.set_point ?? point.test_point,
        calculateduuc: point.calculateduuc ?? point.calculated_uuc ?? point.std_at_reference_temp,
        uuc: point.uuc ?? point.uuc0 ?? point.std_room_temp,
        averagemaster: point.averagemaster ?? point.average_master ?? point.mean,
        error: point.error,
        percenterror: point.percenterror ?? point.percent_error,
        repeatability: point.repeatability ?? point.repeatability_error,
        removalforce: point.removalforce ?? point.removal_force,
        zeroerror: point.zeroerror ?? point.zero_error,
    };
    const aliasVal = aliases[type];
    if (Array.isArray(aliasVal)) return safeGetValue(aliasVal[repeatable]);
    return repeatable === 0 ? safeGetValue(aliasVal) : '';
};

// ─────────────────────────────────────────────────────────────────────────────
// ViewObservationUTM
//
// Renders UTM raw data exactly matching rawdatautm.php logic:
//
// • Pre-Loading Cycle header (always visible, all 5 checked)
// • For each matrix group (crfmatrix loop):
//   - matrixtype label
//   - Modern (tableSuffix > "20220306"):
//       [Sr.No | Force | Std@23or24 | Std@Room | Obs1 Obs2 Obs3 | q1 q2 q3 | %Error | Repeatability]
//       Footer: Removal-of-force × 3 | Least count | Relative Zero Error | Min Point | Max Rel Res | Class of Machine | Dial Gauge
//   - Legacy (tableSuffix <= "20220306"):
//       [Sr.No | Force | Std@24 | Std@Room | Obs1 Obs2 Obs3 | Mean | Error | %Error | %Repeatability]
//       Footer: same footer rows as modern
// ─────────────────────────────────────────────────────────────────────────────
export const ViewObservationUTM = ({ rawdata, currentRawdata, dynamicObservations }) => {
    const data = useMemo(() => currentRawdata || rawdata || {}, [currentRawdata, rawdata]);
    const inwardEntry = data.inwardentry || data.inwardEntry;

    // Compute tableSuffix: matches PHP changedateformatespecito($rowinward['addedon'], "Y-m-d H:i:s", "Ymd")
    const tableSuffix = useMemo(() => {
        const addedon = inwardEntry?.addedon || data?.addedon || '';
        if (!addedon) return '99999999';
        const str = String(addedon).trim();
        const dateMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (dateMatch) return `${dateMatch[1]}${dateMatch[2]}${dateMatch[3]}`;
        const d = new Date(str);
        if (!isNaN(d.getTime())) {
            return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
        }
        return '99999999';
    }, [inwardEntry?.addedon, data?.addedon]);

    const isModern = tableSuffix > '20220306';

    // Room temperature (average of start + end temp)
    const roomTemp = useMemo(() => {
        const startTemp = parseFloat(inwardEntry?.temperature) || 0;
        const endTemp = parseFloat(data?.instrument?.tempend || data?.tempend) || 0;
        if (startTemp && endTemp) return ((startTemp + endTemp) / 2).toFixed(1);
        return startTemp ? startTemp.toFixed(1) : '24.0';
    }, [inwardEntry?.temperature, data?.instrument?.tempend, data?.tempend]);

    // Normalize matrix groups from dynamicObservations or data
    const matrixGroups = useMemo(() => {
        const source =
            dynamicObservations && dynamicObservations.length > 0
                ? dynamicObservations
                : data.calibration_points || data.matrices || data.matrix || data.observations || [];

        const groups = normalizeUtmGroups(source);
        if (groups.length > 0) return groups;

        // Fallback: treat calibration_points directly as one group
        if (Array.isArray(data?.calibration_points) && data.calibration_points.length > 0) {
            const pts = data.calibration_points;
            const numPts = pts.map((p) => parseFloat(p.point ?? p.setpoint)).filter((p) => !isNaN(p));
            return [{
                matrixId: 'matrix-1',
                matrixType: data?.matrixtype || '',
                leastCount: pts[0]?.least_count ?? 'NA',
                minPoint: numPts.length ? Math.min(...numPts) : '',
                maxPoint: numPts.length ? Math.max(...numPts) : '',
                classOfMachine: '',
                dialGaugeSetting: '',
                calibrationPoints: pts,
                raw: data,
            }];
        }

        return [];
    }, [dynamicObservations, data]);

    if (matrixGroups.length === 0) {
        return (
            <div className="p-4 text-center text-gray-500">
                No UTM observation data available.
            </div>
        );
    }

    const POSITIONS = ['Position 0°', 'Position 120°', 'Position 240°'];
    const OBS_LABELS = ['Observation 1', 'Observation 2', 'Observation 3'];
    const MAX_REPEATABLE = 3;

    // Helper: get removal force value from matrix group
    const getRemovalForce = (matrix, pn) =>
        matrix.zeroErrorData?.removal_forces?.[pn] ??
        matrix.raw?.removalforce?.[pn] ??
        matrix.removalForce?.[pn] ??
        getVal(matrix.raw, 'removalforce', pn) ??
        '';

    // Helper: get zero error value from matrix group
    const getZeroError = (matrix, pn, maxPoint) => {
        const storedZeroError = matrix.zeroErrorData?.zero_errors?.[pn];
        if (storedZeroError !== undefined && storedZeroError !== null && storedZeroError !== '') {
            return storedZeroError;
        }
        const removalVal = getRemovalForce(matrix, pn);
        if (maxPoint && removalVal !== '' && !isNaN(parseFloat(removalVal))) {
            return ((parseFloat(removalVal) / parseFloat(maxPoint)) * 100).toFixed(2);
        }
        return matrix.raw?.zeroerror?.[pn] ?? matrix.zeroError?.[pn] ?? '';
    };

    return (
        <div className="space-y-6 my-4 print:space-y-4">
            {/* ── Pre-Loading Cycle table (always shown) ── */}
            <div className="overflow-x-auto">
                <table className="w-full border border-gray-300 text-sm border-collapse bg-white">
                    <tbody>
                        <tr className="bg-gray-50">
                            <td colSpan={4} className="border border-gray-300 px-3 py-2 font-medium text-gray-700">
                                No. Of Pre-Loading Cycle Before calibration
                            </td>
                            {[1, 2, 3, 4, 5].map((num) => (
                                <td key={num} className="border border-gray-300 px-3 py-2 text-center">
                                    <div className="inline-flex items-center gap-1.5">
                                        <input
                                            type="checkbox"
                                            checked
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

            {/* ── Each Matrix Group ── */}
            {matrixGroups.map((matrix, mIdx) => {
                const firstPoint = matrix.calibrationPoints?.[0] || {};
                const uucUnit = matrix.raw?.metadata?.unit || firstPoint?.unit || 'kN';

                // PHP: master instrument name determines std temp reference (23 vs 24)
                const masterInstrumentName = matrix.raw?.metadata?.master_instrument ?? matrix.raw?.master_instrument_name ?? matrix.masterInstrumentName ?? '';
                const stdTempRef = (masterInstrumentName === 'Force Proving Ring') ? '23' : '24';

                const numericPoints = matrix.calibrationPoints
                    .map((p) => parseFloat(p?.force ?? p?.point ?? p?.setpoint))
                    .filter((p) => !isNaN(p));

                const minPoint = matrix.minPoint ?? (numericPoints.length ? Math.min(...numericPoints) : '');
                const maxPoint = matrix.maxPoint ?? (numericPoints.length ? Math.max(...numericPoints) : '');
                const mainLeastCount = matrix.leastCount ?? '';

                // Max Relative Resolution: (leastcount / minpoint) * 100
                const maxRelRes = (() => {
                    if (!minPoint || !mainLeastCount || mainLeastCount === 'NA') return '';
                    const lc = parseFloat(mainLeastCount);
                    const minp = parseFloat(minPoint);
                    if (isNaN(lc) || isNaN(minp) || minp === 0) return '';
                    return ((lc / minp) * 100).toFixed(4);
                })();

                return (
                    <div key={matrix.matrixId || mIdx} className="space-y-2">
                        {/* Matrix type label */}
                        {matrix.matrixType && (
                            <div className="font-semibold text-sm text-gray-800 bg-gray-100 p-2 border border-gray-300">
                                {matrix.matrixType}
                            </div>
                        )}

                        <div className="overflow-x-auto">
                            {isModern ? (
                                // ══════════════════════════════════════════════════════════
                                // MODERN table (tablesuffix > "20220306")
                                // Columns: Sr.No | Force | Std@{23or24} | Std@Room | Obs×3 | q1 q2 q3 | %Error | Repeatability
                                // ══════════════════════════════════════════════════════════
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
                                                Std.at {stdTempRef}±1 (°C)
                                            </th>
                                            <th rowSpan={3} className="border border-gray-300 px-3 py-2 text-center font-medium text-gray-700">
                                                <div>Std.at Room Temp(°C)</div>
                                                <div className="text-xs text-blue-600 font-normal">({roomTemp} °C)</div>
                                            </th>
                                            <th colSpan={MAX_REPEATABLE} className="border border-gray-300 px-3 py-2 text-center font-medium text-gray-700" style={{ maxWidth: '170px' }}>
                                                Observed (F)
                                            </th>
                                            <th colSpan={MAX_REPEATABLE} className="border border-gray-300 px-3 py-2 text-center font-medium text-gray-700">
                                                Relative Indicative Error
                                            </th>
                                            <th rowSpan={3} className="border border-gray-300 px-3 py-2 text-center font-medium text-gray-700">
                                                % Error(q) (q1+q2+q3)/3
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

                                            // Std at Room Temp (uuc0) — always display with 1 decimal (PHP: uuc0.toFixed(1))
                                            let uuc0 = getVal(point, 'uuc', 0);
                                            if (!uuc0 && calculateduuc) {
                                                const numCalc = parseFloat(calculateduuc);
                                                const numTemp = parseFloat(roomTemp);
                                                if (!isNaN(numCalc) && !isNaN(numTemp)) {
                                                    uuc0 = ((0.00027 * (numTemp - 23) + 1) * numCalc).toFixed(1);
                                                }
                                            }
                                            if (!uuc0) uuc0 = setpoint;
                                            // Round to 1 decimal for display regardless of stored precision
                                            const numUuc0 = parseFloat(uuc0);
                                            const uuc0Display = !isNaN(numUuc0) ? numUuc0.toFixed(1) : uuc0;

                                            // 3 master observed readings
                                            const masterValues = [0, 1, 2].map((pn) => getVal(point, 'master', pn));

                                            // q errors: qi = ((observed - uuc0) / uuc0) * 100
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

                                            const avgQ = validCount > 0 ? (sumQ / MAX_REPEATABLE).toFixed(2) : '';
                                            const validNumericQ = qErrors.filter((q) => q !== null);
                                            const diffQ = validNumericQ.length > 1
                                                ? (Math.max(...validNumericQ) - Math.min(...validNumericQ)).toFixed(2)
                                                : '';

                                            return (
                                                <tr
                                                    key={point.id || pointIndex}
                                                    className={pointIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                                                >
                                                    <td className="border border-gray-300 px-3 py-2 text-center">{srNo}</td>
                                                    <td className="border border-gray-300 px-3 py-2 text-right font-mono">{setpoint}</td>
                                                    <td className="border border-gray-300 px-3 py-2 text-right font-mono">{calculateduuc}</td>
                                                    <td className="border border-gray-300 px-3 py-2 text-right font-mono">{uuc0Display}</td>
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

                                        {/* ── Removal of force + Least count ── */}
                                        <tr className="bg-gray-50 border-t-2 border-gray-300 font-medium">
                                            <th colSpan={4} className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-700">
                                                Observation Reading on <br />Removal of force (fi0)
                                            </th>
                                            {[0, 1, 2].map((pn) => (
                                                <td key={pn} className="border border-gray-300 px-2 py-1 text-right font-mono">
                                                    {getRemovalForce(matrix, pn)}
                                                </td>
                                            ))}
                                            <td colSpan={3} className="border border-gray-300 px-3 py-2 text-center font-medium text-gray-700 bg-gray-100">
                                                Least count
                                            </td>
                                            <td colSpan={2} className="border border-gray-300 px-3 py-2 text-center font-mono font-semibold">
                                                {mainLeastCount}
                                            </td>
                                        </tr>

                                        {/* ── Relative Zero Error ── */}
                                        <tr className="bg-gray-50">
                                            <th colSpan={4} className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-700">
                                                Relative Zero Error % (f0)
                                            </th>
                                            {[0, 1, 2].map((pn) => (
                                                <td key={pn} className="border border-gray-300 px-2 py-1 text-right font-mono font-medium">
                                                    {getZeroError(matrix, pn, maxPoint)}
                                                </td>
                                            ))}
                                            <td colSpan={5} className="border border-gray-300 bg-gray-50" />
                                        </tr>

                                        {/* ── Min Point | Max Relative Resolution ── */}
                                        <tr className="bg-white">
                                            <td colSpan={2} className="border border-gray-300 px-3 py-2 font-medium text-gray-700">
                                                Min Point
                                            </td>
                                            <td className="border border-gray-300 px-3 py-2 text-center font-mono">
                                                {minPoint}
                                            </td>
                                            <td colSpan={3} className="border border-gray-300 px-3 py-2 font-medium text-gray-700 text-center">
                                                Max Relative Resolution
                                            </td>
                                            <td className="border border-gray-300 px-3 py-2 text-right font-mono font-medium">
                                                {maxRelRes}
                                            </td>
                                            <td colSpan={6} className="border border-gray-300 bg-gray-50" />
                                        </tr>

                                        {/* ── Class of Machine | Dial Gauge Setting ── */}
                                        <tr className="bg-white">
                                            <td colSpan={2} className="border border-gray-300 px-3 py-2 font-medium text-gray-700">
                                                Class of Machine
                                            </td>
                                            <td className="border border-gray-300 px-3 py-2 font-mono">
                                                {matrix.classOfMachine || matrix.raw?.classofmachine || ''}
                                            </td>
                                            <td colSpan={2} className="border-t border-b border-gray-300 px-3 py-2 text-sm text-gray-700">
                                                Dial Gauge Setting: &nbsp;&nbsp;&nbsp;&nbsp; N.A.
                                            </td>
                                            <td colSpan={2} className="border-t border-b border-gray-300 px-3 py-2 text-sm text-gray-700">
                                                Revolution Pre-stress
                                            </td>
                                            <td className="border border-gray-300 px-2 py-1 font-mono text-center">
                                                {matrix.dialGaugeSetting || matrix.raw?.dialguageseting || ''}
                                            </td>
                                            <td colSpan={6} className="border border-gray-300 bg-gray-50" />
                                        </tr>
                                    </tbody>
                                </table>
                            ) : (
                                // ══════════════════════════════════════════════════════════
                                // LEGACY table (tablesuffix <= "20220306")
                                // Columns: Sr.No | Force | Std@24 | Std@Room | Obs×3 | Mean | Error | %Error | %Repeatability
                                // ══════════════════════════════════════════════════════════
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
                                            <th colSpan={MAX_REPEATABLE} className="border border-gray-300 px-3 py-2 text-center font-medium text-gray-700" style={{ maxWidth: '170px' }}>
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
                                            // Round to 1 decimal for display regardless of stored precision
                                            const numUuc0Legacy = parseFloat(uuc0);
                                            const uuc0DisplayLegacy = !isNaN(numUuc0Legacy) ? numUuc0Legacy.toFixed(1) : uuc0;

                                            const masterValues = [0, 1, 2].map((pn) => getVal(point, 'master', pn));
                                            const meanVal = getVal(point, 'averagemaster', 0);
                                            const errorVal = getVal(point, 'error', 0);
                                            const percentErrorVal = getVal(point, 'percenterror', 0);
                                            const repeatabilityVal = getVal(point, 'repeatability', 0);

                                            return (
                                                <tr
                                                    key={point.id || pointIndex}
                                                    className={pointIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                                                >
                                                    <td className="border border-gray-300 px-3 py-2 text-center">{srNo}</td>
                                                    <td className="border border-gray-300 px-3 py-2 text-right font-mono">{setpoint}</td>
                                                    <td className="border border-gray-300 px-3 py-2 text-right font-mono">{calculateduuc}</td>
                                                    <td className="border border-gray-300 px-3 py-2 text-right font-mono">{uuc0DisplayLegacy}</td>
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

                                        {/* ── Legacy Removal of force ── */}
                                        <tr className="bg-gray-50 border-t-2 border-gray-300 font-medium">
                                            <th colSpan={4} className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-700">
                                                Observation Reading on <br />Removal of force (fi0)
                                            </th>
                                            {[0, 1, 2].map((pn) => (
                                                <td key={pn} className="border border-gray-300 px-2 py-1 text-right font-mono">
                                                    {getRemovalForce(matrix, pn)}
                                                </td>
                                            ))}
                                            <td colSpan={4} className="border border-gray-300 bg-gray-50" />
                                        </tr>

                                        {/* ── Legacy Relative Zero Error ── */}
                                        <tr className="bg-gray-50">
                                            <th colSpan={4} className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-700">
                                                Relative Zero Error % (f0)
                                            </th>
                                            {[0, 1, 2].map((pn) => (
                                                <td key={pn} className="border border-gray-300 px-2 py-1 text-right font-mono font-medium">
                                                    {getZeroError(matrix, pn, maxPoint)}
                                                </td>
                                            ))}
                                            <td colSpan={4} className="border border-gray-300 bg-gray-50" />
                                        </tr>

                                        {/* ── Least count | Min Point | Max Relative Resolution ── */}
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
                                            <td colSpan={2} className="border border-gray-300 px-3 py-2 font-medium text-gray-700 text-center">
                                                Max Relative Resolution
                                            </td>
                                            <td colSpan={2} className="border border-gray-300 px-3 py-2 text-right font-mono font-medium">
                                                {maxRelRes}
                                            </td>
                                            <td className="border border-gray-300 bg-gray-50" />
                                        </tr>

                                        {/* ── Class of Machine | Dial Gauge Setting ── */}
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
                                            <td colSpan={4} className="border border-gray-300 bg-gray-50" />
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

export default ViewObservationUTM;