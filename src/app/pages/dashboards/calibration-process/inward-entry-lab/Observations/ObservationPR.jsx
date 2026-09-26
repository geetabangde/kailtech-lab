import { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { getDecimalPlaces, safeGetValue } from './observationUtils';

/**
 * Pure calculation helper for Observation PR (Proving Ring)
 *
 * PHP Logic:
 * - Mean(Fi) = average of 3 readings (Position 0°, Position 120°, Position 240°)
 *   formatted to 4 decimal places (as shown in PHP: 0.0000, 69.4333)
 * - % Repeatability Error(q) = ((max(readings) - min(readings)) / Mean(Fi)) * 100
 *   formatted to 2 decimal places
 * - Factor = (Applied Force / Mean(Fi)) * 101.9716005
 *   (conversion factor to kgf/div or standard proving ring factor)
 *   No decimal formatting - shows full calculation result
 */
export const calculatePRValues = (setpointVal, readings = []) => {
    const result = {
        mean: '',
        repeatability: '',
        factor: '',
    };

    const validNumbers = readings
        .map((v) => (v !== undefined && v !== null && String(v).trim() !== '' ? parseFloat(v) : NaN))
        .filter((v) => !isNaN(v));

    if (validNumbers.length === 0) return result;

    // 1. Mean(Fi) - formatted to 4 decimal places as per PHP
    const sum = validNumbers.reduce((acc, curr) => acc + curr, 0);
    const avg = sum / validNumbers.length;
    result.mean = avg.toFixed(4);

    const meanNum = parseFloat(result.mean);

    // 2. % Repeatability Error(q)
    if (validNumbers.length >= 2 && !isNaN(meanNum) && meanNum !== 0) {
        const maxVal = Math.max(...validNumbers);
        const minVal = Math.min(...validNumbers);
        const rep = ((maxVal - minVal) / meanNum) * 100;
        result.repeatability = rep.toFixed(2);
    }

    // 3. Factor = (point / mean) * 101.9716005
    // PHP doesn't format decimals - shows full calculation
    const pointNum = parseFloat(setpointVal);
    if (!isNaN(pointNum) && !isNaN(meanNum) && meanNum !== 0) {
        const factorCalc = (pointNum / meanNum) * 101.9716005;
        result.factor = factorCalc.toString();
    }

    return result;
};

/**
 * Normalizes Proving Ring observation data into matrix groups.
 * Handles both API formats:
 * 1. Nested matrices array: { data: { matrices: [ { matrix_id, header_info, points, note } ] } }
 * 2. Flat points array: [ { calib_point_id, set_point, observations, metadata }, ... ]
 */
export const normalizePRGroups = (observationData) => {
    if (!observationData) return [];

    // If observationData has a data wrapper: { data: { matrices: [...] } }
    const unwrapped = observationData?.data || observationData;

    // If it has matrices array
    if (unwrapped?.matrices && Array.isArray(unwrapped.matrices) && unwrapped.matrices.length > 0) {
        return normalizePRGroups(unwrapped.matrices);
    }

    const source = Array.isArray(unwrapped) ? unwrapped : [unwrapped].filter(Boolean);

    return source.flatMap((item, index) => {
        if (item?.matrices && Array.isArray(item.matrices) && item.matrices.length > 0) {
            return normalizePRGroups(item.matrices);
        }
        if (item?.matrix && Array.isArray(item.matrix) && item.matrix.length > 0) {
            return normalizePRGroups(item.matrix);
        }

        const calibrationPoints =
            item?.points ||
            item?.calibration_points ||
            item?.calibrationPoints ||
            item?.observations ||
            (item?.calib_point_id || item?.point_id || item?.id ? [item] : []);

        if (Array.isArray(calibrationPoints) && calibrationPoints.length > 0) {
            const firstPt = calibrationPoints[0] || {};
            const uucUnit =
                item?.header_info?.uuc_unit ||
                item?.header_info?.calculation_unit ||
                item?.header_info?.master_unit ||
                item?.unit ||
                firstPt?.header_info?.uuc_unit ||
                firstPt?.unit_description ||
                firstPt?.unit ||
                'N';

            const masterUnit =
                item?.header_info?.master_unit ||
                item?.master_unit ||
                uucUnit;

            const leastCount =
                item?.leastcount ??
                item?.least_count ??
                item?.matrix?.leastcount ??
                firstPt?.metadata?.least_count ??
                firstPt?.least_count ??
                '1';

            const masterLeastCount =
                item?.masterleastcount ??
                item?.master_least_count ??
                firstPt?.metadata?.master_least_count ??
                firstPt?.master_least_count ??
                '0.2';

            const note =
                item?.note ||
                "The calibration data obtained in compression is valid for the following dial gauge setting only: Large Pointer at 12 'O' clock position    Small Pointer at 1";

            return [{
                matrixId: safeGetValue(item?.matrix_id ?? item?.matrixid ?? item?.id ?? `matrix-${index + 1}`),
                matrixType: (item?.matrix_name && item.matrix_name.trim()) || item?.matrixtype || item?.matrix_type || item?.name || (item?.matrix?.matrixtype || `Scale ${index + 1}`),
                uucUnit,
                masterUnit,
                headerInfo: item?.header_info || {},
                note,
                leastCount,
                masterLeastCount,
                calibrationPoints,
                raw: item,
            }];
        }

        return [];
    });
};

/**
 * Row generator for Observation PR
 */
export const createPRRows = (dataArray = []) => {
    const rows = [];
    const calibrationPoints = [];
    const types = [];
    const repeatables = [];
    const values = [];

    let points = [];
    const unwrapped = dataArray?.data || dataArray;

    if (Array.isArray(unwrapped)) {
        if (unwrapped.length > 0 && (unwrapped[0]?.points || unwrapped[0]?.calibration_points)) {
            unwrapped.forEach((matrix) => {
                const pts = matrix.points || matrix.calibration_points || [];
                points.push(...pts);
            });
        } else {
            points = unwrapped;
        }
    } else if (unwrapped && typeof unwrapped === 'object') {
        if (Array.isArray(unwrapped.matrices)) {
            unwrapped.matrices.forEach((matrix) => {
                const pts = matrix.points || matrix.calibration_points || [];
                points.push(...pts);
            });
        } else if (Array.isArray(unwrapped.points)) {
            points = unwrapped.points;
        } else if (Array.isArray(unwrapped.calibration_points)) {
            points = unwrapped.calibration_points;
        }
    }

    points.forEach((point, idx) => {
        if (!point) return;
        const pointId = String(point.calib_point_id || point.id || point.calibration_point_id || point.point_id || idx + 1);
        const setpoint = safeGetValue(point.set_point ?? point.point ?? point.setpoint ?? point.nominal_value ?? '');

        const obs0 = safeGetValue(
            point.observations?.[0] ??
            point.master_readings?.[0] ??
            point.m0 ??
            point.mast0er ??
            ''
        );
        const obs1 = safeGetValue(
            point.observations?.[1] ??
            point.master_readings?.[1] ??
            point.m1 ??
            point.mast1er ??
            ''
        );
        const obs2 = safeGetValue(
            point.observations?.[2] ??
            point.master_readings?.[2] ??
            point.m2 ??
            point.mast2er ??
            ''
        );

        const calcs = calculatePRValues(setpoint, [obs0, obs1, obs2]);

        const mean = safeGetValue(
            point.average_master ??
            point.averagemaster ??
            point.mean ??
            point.average ??
            calcs.mean
        );

        const repeatability = safeGetValue(
            point.repeatability ??
            point.repeatability_error ??
            calcs.repeatability
        );

        const factor = safeGetValue(
            point.factor ??
            calcs.factor
        );

        const row = [
            point.sr_no?.toString() || (idx + 1).toString(),
            setpoint,
            obs0,
            obs1,
            obs2,
            mean,
            repeatability,
            factor,
        ];

        rows.push(row);

        // 1. Setpoint (type="setpoint", repeatable="0")
        calibrationPoints.push(pointId);
        types.push('setpoint');
        repeatables.push('0');
        values.push(setpoint);

        // 2. Master Readings 0, 1, 2 (type="master", repeatable="0", "1", "2")
        [obs0, obs1, obs2].forEach((obsVal, pn) => {
            calibrationPoints.push(pointId);
            types.push('master');
            repeatables.push(pn.toString());
            values.push(obsVal);
        });

        // 3. Average Master (type="averagemaster", repeatable="0")
        calibrationPoints.push(pointId);
        types.push('averagemaster');
        repeatables.push('0');
        values.push(mean);

        // 4. Repeatability (type="repeatability", repeatable="0")
        calibrationPoints.push(pointId);
        types.push('repeatability');
        repeatables.push('0');
        values.push(repeatability);

        // 5. Factor (type="factor", repeatable="0")
        calibrationPoints.push(pointId);
        types.push('factor');
        repeatables.push('0');
        values.push(factor);
    });

    return { rows, hiddenInputs: { calibrationPoints, types, repeatables, values } };
};

/**
 * Table config for Proving Ring (PR) Observation
 */
export const getPRTableConfig = (observations, instrument) => {
    const { rows, hiddenInputs } = createPRRows(observations);
    const groups = normalizePRGroups(observations);
    const firstGroup = groups[0] || {};
    const firstPoint = firstGroup.calibrationPoints?.[0] || (Array.isArray(observations) && observations[0]) || {};
    const unit =
        firstGroup.uucUnit ||
        firstPoint?.header_info?.uuc_unit ||
        firstPoint?.unit_description ||
        firstPoint?.unit ||
        instrument?.unit ||
        'N';

    const noticeText =
        firstGroup.note ||
        "The calibration data obtained in compression is valid for the following dial gauge setting only: Large Pointer at 12 'O' clock position    Small Pointer at 1";

    return {
        id: 'observationpr',
        name: 'Observation PR',
        category: 'Proving Ring',
        notice: noticeText,
        structure: {
            singleHeaders: ['Sr. No.', `Applied Force(F) (${unit})`],
            subHeaders: {
                'Observed (F)': [
                    'Position 0° - Observation 1',
                    'Position 120° - Observation 2',
                    'Position 240° - Observation 3'
                ]
            },
            remainingHeaders: ['Mean(Fi)', '% Repeatability Error(q)', 'Factor']
        },
        staticRows: rows,
        hiddenInputs: hiddenInputs,
    };
};

/**
 * ObservationPR Component
 * Implements Proving Ring (PR) calibration observation matching the PHP implementation:
 *
 * PHP Layout & Features:
 * - Dial gauge setting notice:
 *   "The calibration data obtained in compression is valid for the following dial gauge setting only: Large Pointer at 12 'O' clock position Small Pointer at 1"
 * - Applied Force (F) (Setpoint in specified unit)
 * - 3 Observed Force readings:
 *   - Position 0° (Observation 1)
 *   - Position 120° (Observation 2)
 *   - Position 240° (Observation 3)
 * - Real-time Mean(Fi) calculation (averageavg)
 * - Real-time % Repeatability Error(q) calculation (repeatability)
 * - Real-time Factor calculation = (point / mean) * 101.9716005
 * - Hidden inputs matching PHP POST structure
 */
const ObservationPR = ({
    selectedTableData,
    tableInputValues = {},
    setTableInputValues,
    handleInputChange,
    handleObservationBlur,
    validateDecimalPlaces,
    observations = [],
    instrument = {},
    inwardEntry = {},
    formData = {},
    unitsList = [],
}) => {
    const [inputErrors, setInputErrors] = useState({});

    // Average room temperature matching PHP changetemp logic
    const roomTemperature = useMemo(() => {
        const tempstart = parseFloat(inwardEntry?.temperature) || 0;
        const tempend = parseFloat(formData?.tempend) || 0;
        if (tempstart && tempend) {
            return ((tempstart + tempend) / 2).toFixed(1);
        }
        return tempstart ? tempstart.toFixed(1) : (tempend ? tempend.toFixed(1) : '');
    }, [inwardEntry?.temperature, formData?.tempend]);

    // Resolve matrix groups (supports multi-scale or flat points list or selectedTableData)
    const matrixGroups = useMemo(() => {
        const sourceData =
            (observations && (Array.isArray(observations) ? observations.length > 0 : Object.keys(observations).length > 0))
                ? observations
                : (selectedTableData?.calibration_points
                    ? [selectedTableData]
                    : (selectedTableData?.staticRows ? selectedTableData.staticRows : []));

        const groups = normalizePRGroups(sourceData);
        if (groups.length > 0) return groups;

        if (Array.isArray(selectedTableData?.calibration_points) && selectedTableData.calibration_points.length > 0) {
            const pts = selectedTableData.calibration_points;
            return [{
                matrixId: selectedTableData?.id || 'matrix-1',
                matrixType: selectedTableData?.matrixtype || selectedTableData?.name || 'Proving Ring Scale',
                leastCount: selectedTableData?.least_count ?? pts[0]?.least_count ?? '1',
                masterLeastCount: pts[0]?.master_least_count ?? '0.2',
                calibrationPoints: pts,
                raw: selectedTableData,
            }];
        }

        if (selectedTableData?.staticRows && selectedTableData.staticRows.length > 0) {
            const pts = selectedTableData.staticRows.map((row, idx) => ({
                id: idx + 1,
                sr_no: row[0],
                set_point: row[1],
                observations: [row[2], row[3], row[4]],
                average_master: row[5],
                repeatability: row[6],
                factor: row[7],
            }));
            return [{
                matrixId: 'matrix-1',
                matrixType: 'Proving Ring Measurement',
                leastCount: '1',
                masterLeastCount: '0.2',
                calibrationPoints: pts,
            }];
        }

        return [];
    }, [observations, selectedTableData]);

    if (matrixGroups.length === 0) {
        return (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-md mb-6">
                <p className="text-yellow-800 dark:text-yellow-200 font-medium">
                    No observation points available for Proving Ring (PR).
                </p>
            </div>
        );
    }

    // Value getter with fallback chain
    const getVal = (key, fallback = '') => {
        if (tableInputValues && tableInputValues[key] !== undefined && tableInputValues[key] !== null) {
            return tableInputValues[key];
        }
        return fallback !== undefined && fallback !== null ? String(fallback) : '';
    };

    // Handle master observation input change (pn = 0, 1, 2)
    const handleMasterChange = (pointId, pn, val, setpointVal, masterLeastCount, rowIndex, currentReadings = []) => {
        const mlcDec = getDecimalPlaces(masterLeastCount);

        // Validation
        const lcStr = String(masterLeastCount || '').trim();
        if (lcStr !== 'NA' && lcStr.includes('.') && val && val.includes('.')) {
            const decimals = val.split('.')[1].length;
            if (decimals > mlcDec) {
                setInputErrors((prev) => ({
                    ...prev,
                    [`${pointId}-m${pn}`]: `Max ${mlcDec} decimals allowed for least count ${masterLeastCount}`,
                }));
            } else {
                setInputErrors((prev) => ({ ...prev, [`${pointId}-m${pn}`]: null }));
            }
        } else {
            setInputErrors((prev) => ({ ...prev, [`${pointId}-m${pn}`]: null }));
        }

        // Collect all 3 readings.
        // currentReadings holds the values currently rendered for this row, which already
        // fall back to the values persisted on the calibration point. Without that fallback
        // an untouched reading would resolve to '' and the mean/repeatability/factor would be
        // recalculated (and saved) from a single reading.
        const readings = [0, 1, 2].map((i) => {
            if (i === pn) return val;
            const k1 = `${pointId}-m${i}`;
            const k2 = `mast${i}er${pointId}`;
            const k3 = `${rowIndex}-${i + 2}`;
            return getVal(k1, getVal(k2, getVal(k3, currentReadings[i] ?? '')));
        });

        // Run PR calculation
        const calc = calculatePRValues(setpointVal, readings);

        const changes = {
            [`${pointId}-m${pn}`]: val,
            [`mast${pn}er${pointId}`]: val,
            [`${rowIndex}-${pn + 2}`]: val,

            [`${pointId}-averagemaster`]: calc.mean,
            [`averagemaster${pointId}`]: calc.mean,
            [`${rowIndex}-5`]: calc.mean,

            [`${pointId}-repeatability`]: calc.repeatability,
            [`repeatability${pointId}`]: calc.repeatability,
            [`${rowIndex}-6`]: calc.repeatability,

            [`${pointId}-factor`]: calc.factor,
            [`factor${pointId}`]: calc.factor,
            [`${rowIndex}-7`]: calc.factor,
        };

        if (setTableInputValues) {
            setTableInputValues((prev) => ({ ...prev, ...changes }));
        }

        if (validateDecimalPlaces) {
            validateDecimalPlaces(val, masterLeastCount);
        }

        if (handleInputChange) {
            handleInputChange(rowIndex, pn + 2, val);
            handleInputChange(rowIndex, 5, calc.mean);
            handleInputChange(rowIndex, 6, calc.repeatability);
            handleInputChange(rowIndex, 7, calc.factor);
        }
    };

    let globalRowCounter = 0;

    return (
        <div className="space-y-8 mb-8">
            {matrixGroups.map((matrix, matrixIdx) => {
                const firstPoint = matrix.calibrationPoints[0] || {};
                const uucUnit =
                    matrix.uucUnit ||
                    matrix.headerInfo?.uuc_unit ||
                    firstPoint.header_info?.uuc_unit ||
                    firstPoint.unit_description ||
                    firstPoint.unit_name ||
                    (unitsList?.find?.((u) => String(u.id) === String(firstPoint.unit))?.description) ||
                    firstPoint.unit ||
                    instrument?.unit ||
                    'N';

                const scaleTitle =
                    (matrix.matrixType && matrix.matrixType.trim()) ||
                    (matrixGroups.length > 1 ? `Scale ${matrixIdx + 1}` : 'Compression Scale');

                const noteText =
                    matrix.note ||
                    "The calibration data obtained in compression is valid for the following dial gauge setting only: Large Pointer at 12 'O' clock position    Small Pointer at 1";

                return (
                    <div
                        key={matrix.matrixId || matrixIdx}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800 shadow-sm space-y-4"
                    >
                        {/* Matrix / Scale Title */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200 dark:border-gray-700 pb-3">
                            <div>
                                <h3 className="text-base font-semibold text-gray-800 dark:text-white uppercase tracking-wide flex items-center gap-2">
                                    <span>{scaleTitle} {uucUnit ? `(in ${uucUnit})` : ''}</span>
                                    {roomTemperature && (
                                        <span className="text-xs font-normal normal-case px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                                            Room Temp: {roomTemperature} °C
                                        </span>
                                    )}
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                    Proving Ring Calibration Process
                                </p>
                            </div>
                        </div>

                        {/* Dial Gauge Setting Alert Notice from PHP */}
                        <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 text-xs sm:text-sm rounded-md flex items-start gap-2 shadow-xs">
                            <svg
                                className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            <span>{noteText}</span>
                        </div>

                        {/* Main Observation Table */}
                        <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-md">
                            <table className="w-full text-sm border-collapse bg-white dark:bg-gray-800">
                                <thead>
                                    <tr className="bg-gray-100 dark:bg-gray-700/80 border-b border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200">
                                        <th
                                            rowSpan={3}
                                            className="px-3 py-2 text-center text-xs font-semibold uppercase border-r border-gray-300 dark:border-gray-600 w-16"
                                        >
                                            Sr. No.
                                        </th>
                                        <th
                                            rowSpan={3}
                                            className="px-3 py-2 text-center text-xs font-semibold uppercase border-r border-gray-300 dark:border-gray-600 min-w-[130px]"
                                        >
                                            Applied Force(F) ({uucUnit})
                                        </th>
                                        <th
                                            colSpan={3}
                                            style={{ maxWidth: '280px' }}
                                            className="px-3 py-2 text-center text-xs font-semibold uppercase border-r border-gray-300 dark:border-gray-600"
                                        >
                                            Observed (F)
                                        </th>
                                        <th
                                            rowSpan={3}
                                            className="px-3 py-2 text-center text-xs font-semibold uppercase border-r border-gray-300 dark:border-gray-600 min-w-[110px]"
                                        >
                                            Mean(Fi)
                                        </th>
                                        <th
                                            rowSpan={3}
                                            className="px-3 py-2 text-center text-xs font-semibold uppercase border-r border-gray-300 dark:border-gray-600 min-w-[150px]"
                                        >
                                            % Repeatability Error(q)
                                        </th>
                                        <th
                                            rowSpan={3}
                                            className="px-3 py-2 text-center text-xs font-semibold uppercase min-w-[110px]"
                                        >
                                            Factor
                                        </th>
                                    </tr>
                                    <tr className="bg-gray-50 dark:bg-gray-600/70 border-b border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300">
                                        <th className="px-2 py-1 text-center text-xs font-medium border-r border-gray-300 dark:border-gray-600">
                                            Position 0°
                                        </th>
                                        <th className="px-2 py-1 text-center text-xs font-medium border-r border-gray-300 dark:border-gray-600">
                                            Position 120°
                                        </th>
                                        <th className="px-2 py-1 text-center text-xs font-medium border-r border-gray-300 dark:border-gray-600">
                                            Position 240°
                                        </th>
                                    </tr>
                                    <tr className="bg-gray-50 dark:bg-gray-600/70 border-b border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400">
                                        <th className="px-2 py-1 text-center text-xs font-medium border-r border-gray-300 dark:border-gray-600">
                                            Observation 1
                                        </th>
                                        <th className="px-2 py-1 text-center text-xs font-medium border-r border-gray-300 dark:border-gray-600">
                                            Observation 2
                                        </th>
                                        <th className="px-2 py-1 text-center text-xs font-medium border-r border-gray-300 dark:border-gray-600">
                                            Observation 3
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {matrix.calibrationPoints.map((point, ptIdx) => {
                                        const currentRowIndex = globalRowCounter++;
                                        const pointId = String(point.calib_point_id || point.calibration_point_id || point.point_id || point.id || ptIdx + 1);
                                        const srNo = point.sr_no ?? ptIdx + 1;

                                        const masterLeastCount =
                                            point.metadata?.master_least_count ??
                                            point.master_least_count ??
                                            point.masterleastcount ??
                                            matrix.masterLeastCount ??
                                            '0.2';

                                        const setpoint =
                                            point.set_point ??
                                            point.point ??
                                            point.setpoint ??
                                            point.nominal_value ??
                                            '';

                                        // Read 3 master readings
                                        const m0 = getVal(
                                            `${pointId}-m0`,
                                            getVal(
                                                `mast0er${pointId}`,
                                                getVal(
                                                    `${currentRowIndex}-2`,
                                                    point.observations?.[0] ??
                                                    point.master_readings?.[0] ??
                                                    point.m0 ??
                                                    point.observations?.find?.((o) => o.type === 'master' && Number(o.repeatable) === 0)?.value ??
                                                    ''
                                                )
                                            )
                                        );

                                        const m1 = getVal(
                                            `${pointId}-m1`,
                                            getVal(
                                                `mast1er${pointId}`,
                                                getVal(
                                                    `${currentRowIndex}-3`,
                                                    point.observations?.[1] ??
                                                    point.master_readings?.[1] ??
                                                    point.m1 ??
                                                    point.observations?.find?.((o) => o.type === 'master' && Number(o.repeatable) === 1)?.value ??
                                                    ''
                                                )
                                            )
                                        );

                                        const m2 = getVal(
                                            `${pointId}-m2`,
                                            getVal(
                                                `mast2er${pointId}`,
                                                getVal(
                                                    `${currentRowIndex}-4`,
                                                    point.observations?.[2] ??
                                                    point.master_readings?.[2] ??
                                                    point.m2 ??
                                                    point.observations?.find?.((o) => o.type === 'master' && Number(o.repeatable) === 2)?.value ??
                                                    ''
                                                )
                                            )
                                        );

                                        // Calculations
                                        const calculated = calculatePRValues(setpoint, [m0, m1, m2]);

                                        const meanVal = getVal(
                                            `${pointId}-averagemaster`,
                                            getVal(
                                                `averagemaster${pointId}`,
                                                getVal(
                                                    `${currentRowIndex}-5`,
                                                    point.average_master ??
                                                    point.averagemaster ??
                                                    point.mean ??
                                                    point.observations?.find?.((o) => o.type === 'averagemaster')?.value ??
                                                    calculated.mean
                                                )
                                            )
                                        );

                                        const repVal = getVal(
                                            `${pointId}-repeatability`,
                                            getVal(
                                                `repeatability${pointId}`,
                                                getVal(
                                                    `${currentRowIndex}-6`,
                                                    point.repeatability ??
                                                    point.repeatability_error ??
                                                    point.observations?.find?.((o) => o.type === 'repeatability')?.value ??
                                                    calculated.repeatability
                                                )
                                            )
                                        );

                                        const factorVal = getVal(
                                            `${pointId}-factor`,
                                            getVal(
                                                `factor${pointId}`,
                                                getVal(
                                                    `${currentRowIndex}-7`,
                                                    point.factor ??
                                                    point.observations?.find?.((o) => o.type === 'factor')?.value ??
                                                    calculated.factor
                                                )
                                            )
                                        );

                                        return (
                                            <tr
                                                key={pointId}
                                                className="hover:bg-gray-50/80 dark:hover:bg-gray-700/50 transition-colors"
                                            >
                                                {/* Sr. No. */}
                                                <td className="px-3 py-2 text-center text-sm font-medium border-r border-gray-200 dark:border-gray-700 dark:text-white bg-gray-50/50 dark:bg-gray-800/50">
                                                    {srNo}
                                                </td>

                                                {/* Applied Force(F) */}
                                                <td className="px-2 py-1.5 border-r border-gray-200 dark:border-gray-700">
                                                    <input type="hidden" name="calibrationpoint[]" value={pointId} />
                                                    <input type="hidden" name="type[]" value="setpoint" />
                                                    <input type="hidden" name="repeatable[]" value="0" />
                                                    <input
                                                        type="text"
                                                        readOnly
                                                        id={`setpoint${pointId}`}
                                                        name="value[]"
                                                        value={setpoint}
                                                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-center font-medium cursor-not-allowed text-sm"
                                                    />
                                                </td>

                                                {/* Observation 1 (Position 0°) */}
                                                <td className="px-2 py-1.5 border-r border-gray-200 dark:border-gray-700">
                                                    <input type="hidden" name="calibrationpoint[]" value={pointId} />
                                                    <input type="hidden" name="type[]" value="master" />
                                                    <input type="hidden" name="repeatable[]" value="0" />
                                                    <div>
                                                        <input
                                                            type="number"
                                                            step="any"
                                                            id={`mast0er${pointId}`}
                                                            name="value[]"
                                                            value={m0}
                                                            onChange={(e) =>
                                                                handleMasterChange(
                                                                    pointId,
                                                                    0,
                                                                    e.target.value,
                                                                    setpoint,
                                                                    masterLeastCount,
                                                                    currentRowIndex,
                                                                    [m0, m1, m2]
                                                                )
                                                            }
                                                            onBlur={(e) => {
                                                                if (handleObservationBlur) {
                                                                    handleObservationBlur(currentRowIndex, 2, e.target.value, pointId);
                                                                }
                                                            }}
                                                            className={`w-full px-2 py-1 border ${inputErrors[`${pointId}-m0`]
                                                                ? 'border-red-500 focus:ring-red-500'
                                                                : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                                                                } rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center text-sm focus:outline-none focus:ring-2`}
                                                        />
                                                        {inputErrors[`${pointId}-m0`] && (
                                                            <span className="text-[10px] text-red-500 block mt-0.5">
                                                                {inputErrors[`${pointId}-m0`]}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Observation 2 (Position 120°) */}
                                                <td className="px-2 py-1.5 border-r border-gray-200 dark:border-gray-700">
                                                    <input type="hidden" name="calibrationpoint[]" value={pointId} />
                                                    <input type="hidden" name="type[]" value="master" />
                                                    <input type="hidden" name="repeatable[]" value="1" />
                                                    <div>
                                                        <input
                                                            type="number"
                                                            step="any"
                                                            id={`mast1er${pointId}`}
                                                            name="value[]"
                                                            value={m1}
                                                            onChange={(e) =>
                                                                handleMasterChange(
                                                                    pointId,
                                                                    1,
                                                                    e.target.value,
                                                                    setpoint,
                                                                    masterLeastCount,
                                                                    currentRowIndex,
                                                                    [m0, m1, m2]
                                                                )
                                                            }
                                                            onBlur={(e) => {
                                                                if (handleObservationBlur) {
                                                                    handleObservationBlur(currentRowIndex, 3, e.target.value, pointId);
                                                                }
                                                            }}
                                                            className={`w-full px-2 py-1 border ${inputErrors[`${pointId}-m1`]
                                                                ? 'border-red-500 focus:ring-red-500'
                                                                : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                                                                } rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center text-sm focus:outline-none focus:ring-2`}
                                                        />
                                                        {inputErrors[`${pointId}-m1`] && (
                                                            <span className="text-[10px] text-red-500 block mt-0.5">
                                                                {inputErrors[`${pointId}-m1`]}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Observation 3 (Position 240°) */}
                                                <td className="px-2 py-1.5 border-r border-gray-200 dark:border-gray-700">
                                                    <input type="hidden" name="calibrationpoint[]" value={pointId} />
                                                    <input type="hidden" name="type[]" value="master" />
                                                    <input type="hidden" name="repeatable[]" value="2" />
                                                    <div>
                                                        <input
                                                            type="number"
                                                            step="any"
                                                            id={`mast2er${pointId}`}
                                                            name="value[]"
                                                            value={m2}
                                                            onChange={(e) =>
                                                                handleMasterChange(
                                                                    pointId,
                                                                    2,
                                                                    e.target.value,
                                                                    setpoint,
                                                                    masterLeastCount,
                                                                    currentRowIndex,
                                                                    [m0, m1, m2]
                                                                )
                                                            }
                                                            onBlur={(e) => {
                                                                if (handleObservationBlur) {
                                                                    handleObservationBlur(currentRowIndex, 4, e.target.value, pointId);
                                                                }
                                                            }}
                                                            className={`w-full px-2 py-1 border ${inputErrors[`${pointId}-m2`]
                                                                ? 'border-red-500 focus:ring-red-500'
                                                                : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                                                                } rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center text-sm focus:outline-none focus:ring-2`}
                                                        />
                                                        {inputErrors[`${pointId}-m2`] && (
                                                            <span className="text-[10px] text-red-500 block mt-0.5">
                                                                {inputErrors[`${pointId}-m2`]}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Mean(Fi) */}
                                                <td className="px-2 py-1.5 border-r border-gray-200 dark:border-gray-700">
                                                    <input type="hidden" name="calibrationpoint[]" value={pointId} />
                                                    <input type="hidden" name="type[]" value="averagemaster" />
                                                    <input type="hidden" name="repeatable[]" value="0" />
                                                    <input
                                                        type="text"
                                                        readOnly
                                                        id={`averagemaster${pointId}`}
                                                        name="value[]"
                                                        value={meanVal}
                                                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-center font-medium cursor-not-allowed text-sm"
                                                    />
                                                </td>

                                                {/* % Repeatability Error(q) */}
                                                <td className="px-2 py-1.5 border-r border-gray-200 dark:border-gray-700">
                                                    <input type="hidden" name="calibrationpoint[]" value={pointId} />
                                                    <input type="hidden" name="type[]" value="repeatability" />
                                                    <input type="hidden" name="repeatable[]" value="0" />
                                                    <input
                                                        type="text"
                                                        readOnly
                                                        id={`repeatability${pointId}`}
                                                        name="value[]"
                                                        value={repVal}
                                                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-center font-medium cursor-not-allowed text-sm"
                                                    />
                                                </td>

                                                {/* Factor */}
                                                <td className="px-2 py-1.5">
                                                    <input type="hidden" name="calibrationpoint[]" value={pointId} />
                                                    <input type="hidden" name="type[]" value="factor" />
                                                    <input type="hidden" name="repeatable[]" value="0" />
                                                    <input
                                                        type="text"
                                                        readOnly
                                                        id={`factor${pointId}`}
                                                        name="value[]"
                                                        value={factorVal}
                                                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-center font-medium cursor-not-allowed text-sm"
                                                    />
                                                </td>
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

ObservationPR.propTypes = {
    selectedTableData: PropTypes.object,
    tableInputValues: PropTypes.object,
    setTableInputValues: PropTypes.func,
    handleInputChange: PropTypes.func,
    handleObservationBlur: PropTypes.func,
    validateDecimalPlaces: PropTypes.func,
    observations: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
    instrument: PropTypes.object,
    inwardEntry: PropTypes.object,
    formData: PropTypes.object,
    unitsList: PropTypes.array,
};

export default ObservationPR;