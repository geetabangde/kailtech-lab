import React, { useState, useEffect } from 'react';

const ObservationDW = ({
  tableInputValues = {},
  setTableInputValues,
  formData = {},
  setFormData,
  observations = [],
  isDW,
  instId,
  handleBiomedicalInputBlur,
}) => {
  const [dwValues, setDwValues] = useState({});
  const [envValues, setEnvValues] = useState({
    pressureStart: tableInputValues[`${instId}-pressure-start`] ?? formData?.pressurestart ?? '',
    pressureEnd: tableInputValues[`${instId}-pressure-end`] ?? formData?.pressureend ?? '',
    stabilization: tableInputValues[`${instId}-stabilization`] ?? formData?.stabilizationtime ?? '',
  });

  useEffect(() => {
    setEnvValues({
      pressureStart: tableInputValues[`${instId}-pressure-start`] ?? formData?.pressurestart ?? '',
      pressureEnd: tableInputValues[`${instId}-pressure-end`] ?? formData?.pressureend ?? '',
      stabilization: tableInputValues[`${instId}-stabilization`] ?? formData?.stabilizationtime ?? '',
    });
  }, [tableInputValues, formData?.pressurestart, formData?.pressureend, formData?.stabilizationtime, instId]);

  const SIGDIG = 100000000;
  const getMasterLeastCount = (point) =>
    point?.master_least_count ?? point?.least_count ?? 'any';

  if (!isDW) return null;

  const calculateDeltaI = (s1, u1, u2, s2) => {
    const s1Val = parseFloat(s1);
    const u1Val = parseFloat(u1);
    const u2Val = parseFloat(u2);
    const s2Val = parseFloat(s2);

    if (isNaN(s1Val) || isNaN(u1Val) || isNaN(u2Val) || isNaN(s2Val)) return '';

    const tempa = Math.floor((u1Val - s1Val) * SIGDIG) / SIGDIG;
    const tempb = Math.floor((u2Val - s2Val) * SIGDIG) / SIGDIG;
    const sum = tempa + tempb;
    const deltai = sum / 2;

    return isNaN(deltai) ? '' : deltai.toFixed(8);
  };

  const calculateAverageDeltaI = (pointId) => {
    const point = observations.find(p => String(p.pointid ?? p.point_id ?? p.point ?? '') === String(pointId));
    if (!point) return '';

    const cycles = point.cycles || [];
    let hasUserChanges = false;

    for (let cycleIdx = 0; cycleIdx < cycles.length; cycleIdx++) {
      if (
        dwValues[`${pointId}-s1-${cycleIdx}`] !== undefined ||
        dwValues[`${pointId}-u1-${cycleIdx}`] !== undefined ||
        dwValues[`${pointId}-u2-${cycleIdx}`] !== undefined ||
        dwValues[`${pointId}-s2-${cycleIdx}`] !== undefined ||
        dwValues[`${pointId}-delta-${cycleIdx}`] !== undefined
      ) {
        hasUserChanges = true;
        break;
      }
    }

    if (!hasUserChanges) {
      const apiAvg = point.average_diff ?? point.averagedeltai ?? point.average_deltai ?? point.avg_diff ?? point.average;
      if (apiAvg !== undefined && apiAvg !== null && apiAvg !== '') {
        return String(apiAvg);
      }
    }

    let sum = 0;
    let count = 0;

    cycles.forEach((cycle, cycleIdx) => {
      const deltaKey = `${pointId}-delta-${cycleIdx}`;
      let deltaValStr = dwValues[deltaKey];

      if (deltaValStr === undefined) {
        const s1 = dwValues[`${pointId}-s1-${cycleIdx}`] ?? cycle.S1 ?? cycle.s1 ?? cycle.uuca ?? '';
        const u1 = dwValues[`${pointId}-u1-${cycleIdx}`] ?? cycle.U1 ?? cycle.u1 ?? cycle.mastera ?? '';
        const u2 = dwValues[`${pointId}-u2-${cycleIdx}`] ?? cycle.U2 ?? cycle.u2 ?? cycle.masterb ?? '';
        const s2 = dwValues[`${pointId}-s2-${cycleIdx}`] ?? cycle.S2 ?? cycle.s2 ?? cycle.uucb ?? '';

        if (s1 !== '' && u1 !== '' && u2 !== '' && s2 !== '') {
          deltaValStr = calculateDeltaI(s1, u1, u2, s2);
        } else {
          deltaValStr = cycle.Delta ?? cycle.deltai ?? cycle.diff ?? '';
        }
      }

      const deltaVal = parseFloat(deltaValStr);
      if (!isNaN(deltaVal)) {
        sum += deltaVal;
        count++;
      }
    });

    if (count > 0) {
      const avg = sum / count;
      return isNaN(avg) ? '' : avg.toFixed(8);
    }

    const apiAvg = point.average_diff ?? point.averagedeltai ?? point.average_deltai ?? point.avg_diff ?? point.average;
    return apiAvg !== undefined && apiAvg !== null && apiAvg !== '' ? String(apiAvg) : '';
  };

  // handleSubmit rebuilds the DW payload from selectedTableData.staticRows overlaid with
  // tableInputValues[`${rowIndex}-${colIndex}`]. Reading edits live in local dwValues only,
  // so mirror them into tableInputValues or submit re-sends the values loaded from the API
  // and overwrites what the blur handler just saved.
  const DW_COL_INDEX = { density: 3, s1: 4, u1: 5, u2: 6, s2: 7 };

  const getRowIndex = (pointId, cycleIdx) => {
    let base = 0;
    for (const p of observations) {
      const id = String(p.pointid ?? p.point_id ?? p.point ?? '');
      // Must match the row count createDWRows() emits, or the indices drift.
      const count = Array.isArray(p.cycles) && p.cycles.length
        ? p.cycles.length
        : (p.repeatable_cycle ? parseInt(p.repeatable_cycle, 10) : 3);
      if (id === String(pointId)) return base + cycleIdx;
      base += count;
    }
    return -1;
  };

  const syncToTableInputValues = (pointId, field, cycleIdx, value) => {
    if (!setTableInputValues) return;
    const colIndex = DW_COL_INDEX[field];
    if (colIndex === undefined) return;

    setTableInputValues(prev => {
      const updated = { ...prev };
      if (field === 'density') {
        // Density spans every cycle row of the point.
        const point = observations.find(
          p => String(p.pointid ?? p.point_id ?? p.point ?? '') === String(pointId)
        );
        const count = (point?.cycles || []).length || 1;
        for (let c = 0; c < count; c++) {
          const r = getRowIndex(pointId, c);
          if (r >= 0) updated[`${r}-${colIndex}`] = value;
        }
      } else {
        const r = getRowIndex(pointId, cycleIdx);
        if (r >= 0) updated[`${r}-${colIndex}`] = value;
      }
      return updated;
    });
  };

  const handleInputChange = (pointId, field, cycleIdx, value) => {
    syncToTableInputValues(pointId, field, cycleIdx, value);
    const key = `${pointId}-${field}-${cycleIdx}`;
    setDwValues(prev => {
      const updated = {
        ...prev,
        [key]: value
      };

      if (['s1', 'u1', 'u2', 's2'].includes(field)) {
        const point = observations.find(p => String(p.pointid ?? p.point_id ?? p.point ?? '') === String(pointId));
        const cycle = point?.cycles?.[cycleIdx] || {};

        const s1 = field === 's1' ? value : (updated[`${pointId}-s1-${cycleIdx}`] ?? cycle.S1 ?? cycle.s1 ?? cycle.uuca ?? '');
        const u1 = field === 'u1' ? value : (updated[`${pointId}-u1-${cycleIdx}`] ?? cycle.U1 ?? cycle.u1 ?? cycle.mastera ?? '');
        const u2 = field === 'u2' ? value : (updated[`${pointId}-u2-${cycleIdx}`] ?? cycle.U2 ?? cycle.u2 ?? cycle.masterb ?? '');
        const s2 = field === 's2' ? value : (updated[`${pointId}-s2-${cycleIdx}`] ?? cycle.S2 ?? cycle.s2 ?? cycle.uucb ?? '');

        const delta = calculateDeltaI(s1, u1, u2, s2);
        updated[`${pointId}-delta-${cycleIdx}`] = delta;
      }

      return updated;
    });
  };

  // PHP submits deltai (per cycle) and average (repeatable 0) alongside the readings,
  // so save them whenever a reading changes.
  const handleReadingBlur = async (pointId, type, cycleIndex, value) => {
    if (!handleBiomedicalInputBlur) return;
    await handleBiomedicalInputBlur(pointId, type, cycleIndex, value);

    const delta = dwValues[`${pointId}-delta-${cycleIndex}`];
    if (delta !== undefined && delta !== '') {
      await handleBiomedicalInputBlur(pointId, 'deltai', cycleIndex, delta, 1, 5, { silent: true });
    }
    const avg = calculateAverageDeltaI(pointId);
    if (avg !== undefined && avg !== '') {
      await handleBiomedicalInputBlur(pointId, 'average', 0, avg, 1, 5, { silent: true });
    }
  };

  const renderReadingsTable = () => {
    if (!observations || observations.length === 0) return null;

    return (
      <div className="overflow-x-auto mb-6">
        <table className="w-full border-collapse border border-gray-300 dark:border-gray-600 text-sm">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-700">
              <th rowSpan="2" className="border border-gray-300 dark:border-gray-600 p-2 font-medium">Sr No</th>
              <th rowSpan="2" className="border border-gray-300 dark:border-gray-600 p-2 font-medium">Cycle No</th>
              <th rowSpan="2" className="border border-gray-300 dark:border-gray-600 p-2 font-medium">Nominal Value (g)</th>
              <th rowSpan="2" className="border border-gray-300 dark:border-gray-600 p-2 font-medium">Density ρ (g/cm³)</th>
              <th colSpan="4" className="border border-gray-300 dark:border-gray-600 p-2 font-medium text-center">Measured Mass Value (g)</th>
              <th rowSpan="2" className="border border-gray-300 dark:border-gray-600 p-2 font-medium">Δi</th>
              <th rowSpan="2" className="border border-gray-300 dark:border-gray-600 p-2 font-medium">Avg Δi (g)</th>
            </tr>
            <tr className="bg-gray-100 dark:bg-gray-700">
              <th className="border border-gray-300 dark:border-gray-600 p-2 font-medium">S1 (g)</th>
              <th className="border border-gray-300 dark:border-gray-600 p-2 font-medium">U1 (g)</th>
              <th className="border border-gray-300 dark:border-gray-600 p-2 font-medium">U2 (g)</th>
              <th className="border border-gray-300 dark:border-gray-600 p-2 font-medium">S2 (g)</th>
            </tr>
          </thead>
          <tbody>
            {observations.map((point) => {
              const pointId = point.pointid ?? point.point_id ?? point.point;
              const masterLC = getMasterLeastCount(point);
              const cycles = point.cycles || [];
              const repeatableCount = cycles.length > 0 ? cycles.length : 1;
              const avgDiffVal = calculateAverageDeltaI(pointId);

              return (
                <React.Fragment key={`dw-point-${pointId}`}>
                  {cycles.map((cycle, cycleIndex) => {
                    const s1Key = `${pointId}-s1-${cycleIndex}`;
                    const u1Key = `${pointId}-u1-${cycleIndex}`;
                    const u2Key = `${pointId}-u2-${cycleIndex}`;
                    const s2Key = `${pointId}-s2-${cycleIndex}`;
                    const densityKey = `${pointId}-density-0`;
                    const deltaKey = `${pointId}-delta-${cycleIndex}`;

                    const s1Val = dwValues[s1Key] !== undefined ? dwValues[s1Key] : (cycle.S1 ?? cycle.s1 ?? cycle.uuca ?? '');
                    const u1Val = dwValues[u1Key] !== undefined ? dwValues[u1Key] : (cycle.U1 ?? cycle.u1 ?? cycle.mastera ?? '');
                    const u2Val = dwValues[u2Key] !== undefined ? dwValues[u2Key] : (cycle.U2 ?? cycle.u2 ?? cycle.masterb ?? '');
                    const s2Val = dwValues[s2Key] !== undefined ? dwValues[s2Key] : (cycle.S2 ?? cycle.s2 ?? cycle.uucb ?? '');
                    const densityVal = dwValues[densityKey] !== undefined ? dwValues[densityKey] : (point.density ?? '');
                    const deltaVal = dwValues[deltaKey] !== undefined ? dwValues[deltaKey] : (cycle.Delta ?? cycle.deltai ?? cycle.diff ?? '');

                    return (
                      <tr key={`dw-cycle-${pointId}-${cycleIndex}`} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        {cycleIndex === 0 && (
                          <>
                            <td rowSpan={repeatableCount} className="border border-gray-300 dark:border-gray-600 p-2 text-center font-medium">
                              {point.sr_no}
                            </td>
                          </>
                        )}

                        <td className="border border-gray-300 dark:border-gray-600 p-2 text-center">{cycle.cycle_no}</td>

                        {cycleIndex === 0 && (
                          <>
                            <td rowSpan={repeatableCount} className="border border-gray-300 dark:border-gray-600 p-2 text-center">
                              {point.nominal_value ?? point.calibration_point ?? point.point}
                            </td>
                            <td rowSpan={repeatableCount} className="border border-gray-300 dark:border-gray-600 p-2">
                              <input
                                type="number"
                                className="w-full px-2 py-1 border border-gray-300 rounded dark:bg-gray-600 dark:text-white"
                                value={densityVal}
                                onChange={(e) => handleInputChange(pointId, 'density', 0, e.target.value)}
                                onBlur={(e) => handleBiomedicalInputBlur && handleBiomedicalInputBlur(pointId, 'density', 0, e.target.value)}
                                placeholder="Enter density"
                                step={masterLC}
                              />
                            </td>
                          </>
                        )}

                        {/* S1 (uuca) - Editable */}
                        <td className="border border-gray-300 dark:border-gray-600 p-2">
                          <input
                            type="number"
                            className="w-full px-2 py-1 border border-gray-300 rounded dark:bg-gray-600 dark:text-white"
                            value={s1Val}
                            onChange={(e) => handleInputChange(pointId, 's1', cycleIndex, e.target.value)}
                            onBlur={(e) => handleReadingBlur(pointId, 'uuca', cycleIndex, e.target.value)}
                            step={masterLC}
                            placeholder={`Min: ${masterLC}`}
                          />
                          <input type="hidden" name="calibrationpoint[]" value={pointId} />
                          <input type="hidden" name="type[]" value="uuca" />
                          <input type="hidden" name="repeatable[]" value={cycleIndex} />
                          <input type="hidden" name="value[]" value={s1Val} />
                        </td>

                        {/* U1 (mastera) - Editable */}
                        <td className="border border-gray-300 dark:border-gray-600 p-2">
                          <input
                            type="number"
                            className="w-full px-2 py-1 border border-gray-300 rounded dark:bg-gray-600 dark:text-white"
                            value={u1Val}
                            onChange={(e) => handleInputChange(pointId, 'u1', cycleIndex, e.target.value)}
                            onBlur={(e) => handleReadingBlur(pointId, 'mastera', cycleIndex, e.target.value)}
                            step={masterLC}
                            placeholder={`Min: ${masterLC}`}
                          />
                          <input type="hidden" name="calibrationpoint[]" value={pointId} />
                          <input type="hidden" name="type[]" value="mastera" />
                          <input type="hidden" name="repeatable[]" value={cycleIndex} />
                          <input type="hidden" name="value[]" value={u1Val} />
                        </td>

                        {/* U2 (masterb) - Editable */}
                        <td className="border border-gray-300 dark:border-gray-600 p-2">
                          <input
                            type="number"
                            className="w-full px-2 py-1 border border-gray-300 rounded dark:bg-gray-600 dark:text-white"
                            value={u2Val}
                            onChange={(e) => handleInputChange(pointId, 'u2', cycleIndex, e.target.value)}
                            onBlur={(e) => handleReadingBlur(pointId, 'masterb', cycleIndex, e.target.value)}
                            step={masterLC}
                            placeholder={`Min: ${masterLC}`}
                          />
                          <input type="hidden" name="calibrationpoint[]" value={pointId} />
                          <input type="hidden" name="type[]" value="masterb" />
                          <input type="hidden" name="repeatable[]" value={cycleIndex} />
                          <input type="hidden" name="value[]" value={u2Val} />
                        </td>

                        {/* S2 (uucb) - Editable */}
                        <td className="border border-gray-300 dark:border-gray-600 p-2">
                          <input
                            type="number"
                            className="w-full px-2 py-1 border border-gray-300 rounded dark:bg-gray-600 dark:text-white"
                            value={s2Val}
                            onChange={(e) => handleInputChange(pointId, 's2', cycleIndex, e.target.value)}
                            onBlur={(e) => handleReadingBlur(pointId, 'uucb', cycleIndex, e.target.value)}
                            step={masterLC}
                            placeholder={`Min: ${masterLC}`}
                          />
                          <input type="hidden" name="calibrationpoint[]" value={pointId} />
                          <input type="hidden" name="type[]" value="uucb" />
                          <input type="hidden" name="repeatable[]" value={cycleIndex} />
                          <input type="hidden" name="value[]" value={s2Val} />
                        </td>

                        {/* Delta I - Calculated (readonly) */}
                        <td className="border border-gray-300 dark:border-gray-600 p-2 bg-gray-50 dark:bg-gray-700">
                          <input
                            type="text"
                            readOnly
                            className="w-full px-2 py-1 bg-gray-50 dark:bg-gray-700 dark:text-white focus:outline-none"
                            value={deltaVal}
                          />
                          <input type="hidden" name="calibrationpoint[]" value={pointId} />
                          <input type="hidden" name="type[]" value="deltai" />
                          <input type="hidden" name="repeatable[]" value={cycleIndex} />
                          <input type="hidden" name="value[]" value={deltaVal} />
                        </td>

                        {/* Average Delta I - Show only in first cycle */}
                        {cycleIndex === 0 && (
                          <td rowSpan={repeatableCount} className="border border-gray-300 dark:border-gray-600 p-2 bg-gray-50 dark:bg-gray-700 text-center font-medium">
                            <input
                              type="text"
                              readOnly
                              className="w-full px-2 py-1 bg-gray-50 dark:bg-gray-700 dark:text-white text-center font-medium focus:outline-none"
                              value={avgDiffVal}
                            />
                            <input type="hidden" name="calibrationpoint[]" value={pointId} />
                            <input type="hidden" name="type[]" value="average" />
                            <input type="hidden" name="repeatable[]" value="0" />
                            <input type="hidden" name="value[]" value={avgDiffVal} />
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const renderEnvironmentTable = () => {
    if (!observations || observations.length === 0 || !instId) return null;

    const handleEnvChange = (field, value) => {
      setEnvValues(prev => ({
        ...prev,
        [field]: value,
      }));

      if (setTableInputValues) {
        const tableKeyMap = {
          pressureStart: `${instId}-pressure-start`,
          pressureEnd: `${instId}-pressure-end`,
          stabilization: `${instId}-stabilization`,
        };
        const tableKey = tableKeyMap[field];
        if (tableKey) {
          setTableInputValues(prev => ({
            ...prev,
            [tableKey]: value,
          }));
        }
      }

      if (setFormData) {
        const formKeyMap = {
          pressureStart: 'pressurestart',
          pressureEnd: 'pressureend',
          stabilization: 'stabilizationtime',
        };
        const formKey = formKeyMap[field];
        if (formKey) {
          setFormData(prev => ({
            ...prev,
            [formKey]: value,
          }));
        }
      }
    };
    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 dark:border-gray-600 text-sm">
          <tbody>
            <tr className="hover:bg-gray-50 dark:hover:bg-gray-800">
              <td className="border border-gray-300 dark:border-gray-600 p-2 font-medium w-1/3">Pressure Start (hPa)</td>
              <td className="border border-gray-300 dark:border-gray-600 p-2">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  className="w-full px-2 py-1 border border-gray-300 rounded dark:bg-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={envValues.pressureStart}
                  onChange={(e) => handleEnvChange('pressureStart', e.target.value)}
                  onBlur={(e) => handleBiomedicalInputBlur && handleBiomedicalInputBlur(instId, 'pressure', 0, e.target.value)}
                  placeholder="Enter pressure start"
                />
                <input type="hidden" name="calibrationpoint[]" value={instId} />
                <input type="hidden" name="type[]" value="pressure" />
                <input type="hidden" name="repeatable[]" value="0" />
                <input type="hidden" name="value[]" value={envValues.pressureStart} />
              </td>
              <td className="border border-gray-300 dark:border-gray-600 p-2 font-medium w-1/3">Pressure End (hPa)</td>
              <td className="border border-gray-300 dark:border-gray-600 p-2">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  className="w-full px-2 py-1 border border-gray-300 rounded dark:bg-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={envValues.pressureEnd}
                  onChange={(e) => handleEnvChange('pressureEnd', e.target.value)}
                  onBlur={(e) => handleBiomedicalInputBlur && handleBiomedicalInputBlur(instId, 'pressure', 1, e.target.value)}
                  placeholder="Enter pressure end"
                />
                <input type="hidden" name="calibrationpoint[]" value={instId} />
                <input type="hidden" name="type[]" value="pressure" />
                <input type="hidden" name="repeatable[]" value="1" />
                <input type="hidden" name="value[]" value={envValues.pressureEnd} />
              </td>
            </tr>
            <tr className="hover:bg-gray-50 dark:hover:bg-gray-800">
              <td className="border border-gray-300 dark:border-gray-600 p-2 font-medium">Thermal Stabilization (hours)</td>
              <td colSpan="3" className="border border-gray-300 dark:border-gray-600 p-2">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  className="w-full px-2 py-1 border border-gray-300 rounded dark:bg-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={envValues.stabilization}
                  onChange={(e) => handleEnvChange('stabilization', e.target.value)}
                  onBlur={(e) => handleBiomedicalInputBlur && handleBiomedicalInputBlur(instId, 'stabilizationtime', 1, e.target.value)}
                  placeholder="Enter stabilization time"
                />
                <input type="hidden" name="calibrationpoint[]" value={instId} />
                <input type="hidden" name="type[]" value="stabilizationtime" />
                <input type="hidden" name="repeatable[]" value="1" />
                <input type="hidden" name="value[]" value={envValues.stabilization} />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Dead Weight Tester (DW) Observations</h2>

      {renderReadingsTable()}

      <h3 className="text-md font-semibold text-gray-800 dark:text-white mb-4 mt-6">Environmental Conditions</h3>
      {renderEnvironmentTable()}
    </div>
  );
};

/**
 * Calculation logic for Dead Weight (DW) Observation row
 * Formula: ∆m = {(U1-S1) + (U2-S2)} / 2
 */
export const calculateDWValues = (rowData) => {
  if (!rowData || !Array.isArray(rowData)) {
    return { diff: '' };
  }
  const parsedValues = rowData.map(val => (val === '' || val === null || val === undefined ? 0 : parseFloat(val) || 0));
  const s1 = parsedValues[4] || 0;
  const u1 = parsedValues[5] || 0;
  const u2 = parsedValues[6] || 0;
  const s2 = parsedValues[7] || 0;
  const SIGDIG = 100000000;

  if (parsedValues[4] !== 0 || parsedValues[5] !== 0 || parsedValues[6] !== 0 || parsedValues[7] !== 0) {
    const tempa = Math.floor((u1 - s1) * SIGDIG) / SIGDIG;
    const tempb = Math.floor((u2 - s2) * SIGDIG) / SIGDIG;
    const delta = (tempa + tempb) / 2;
    return {
      diff: parseFloat(delta.toFixed(8)).toString()
    };
  }
  return {
    diff: ''
  };
};

/**
 * Row generator for DW Observation
 */
export const createDWRows = (dataArray) => {
  const rows = [];
  const calibrationPoints = [];
  const types = [];
  const repeatables = [];
  const values = [];

  const safeVal = (item) => {
    if (item === undefined || item === null || item === '') return '';
    if (typeof item === 'object' && item !== null) {
      const val = item.value !== null && item.value !== undefined ? item.value : (item.val ?? item.reading ?? '');
      return (val !== undefined && val !== null) ? val.toString() : '';
    }
    return item.toString();
  };

  (dataArray || []).forEach((point) => {
    if (!point) return;
    // The API returns a `cycles` array per point; fall back to the flat per-field
    // arrays only if an older shape shows up.
    const apiCycles = Array.isArray(point.cycles) ? point.cycles : null;
    const cycleCount = apiCycles
      ? apiCycles.length
      : (point.repeatable_cycle ? parseInt(point.repeatable_cycle) : 3);

    for (let cycle = 0; cycle < cycleCount; cycle++) {
      const c = apiCycles?.[cycle] || {};
      const row = [
        point.sr_no?.toString() || '',
        (c.cycle_no ?? cycle + 1).toString(),
        safeVal(point.nominal_value || point.test_point),
        safeVal(point.density),
        safeVal(c.S1 ?? c.s1 ?? point.s1?.[cycle]), // uuca -> S1
        safeVal(c.U1 ?? c.u1 ?? point.u1?.[cycle]), // mastera -> U1
        safeVal(c.U2 ?? c.u2 ?? point.u2?.[cycle]), // masterb -> U2
        safeVal(c.S2 ?? c.s2 ?? point.s2?.[cycle]), // uucb -> S2
        safeVal(c.Delta ?? c.deltai ?? point.deltai?.[cycle]), // Diff
        safeVal(point.average_diff), // Avg.Diff
      ];
      rows.push(row);
      calibrationPoints.push((point.pointid ?? point.point_id ?? '').toString());
      types.push('input'); // Will be overridden dynamically in handleSubmit
      repeatables.push(cycle.toString());
      values.push(safeVal(point.nominal_value || point.test_point) || '0');
    }
  });

  return { rows, hiddenInputs: { calibrationPoints, types, repeatables, values } };
};

/**
 * Table config for DW Observation
 */
export const getDWTableConfig = (observations) => {
  const { rows, hiddenInputs } = createDWRows(observations);
  return {
    id: 'observationdw',
    name: 'Observation DW',
    category: 'Dead Weight',
    structure: {
      singleHeaders: [
        'Sr no',
        'cycle no',
        'Nominal Value Of UUC(g)',
        'Density of UUC Weight, ρr (g/cm³)'
      ],
      subHeaders: {
        'Measured mass value(gm)': ['S1(g)', 'U1(g)', 'U2(g)', 'S2(g)']
      },
      remainingHeaders: ['Diff.,∆m{(U1-S1)+U2-S2)}/2', 'Avg.Diff.(g)'],
    },
    staticRows: rows,
    hiddenInputs: hiddenInputs,
  };
};

export default ObservationDW;