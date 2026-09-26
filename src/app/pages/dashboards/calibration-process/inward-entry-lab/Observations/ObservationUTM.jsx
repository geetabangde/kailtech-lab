const ObservationUTM = ({
  selectedTableData,
  tableInputValues,
  setTableInputValues,
  validateDecimalPlaces,
  inwardEntry,
  instrument,
  formData,
  handleObservationBlur,
}) => {
  if (selectedTableData?.id !== 'observationutm') return null;

  const startTemp = parseFloat(instrument?.temperature ?? inwardEntry?.temperature ?? inwardEntry?.tempstart) || 0;
  const endTemp = parseFloat(formData?.tempend) || 0;
  const roomTemperature = (startTemp > 0 && endTemp > 0)
    ? (startTemp + endTemp) / 2
    : (endTemp || startTemp || 0);

  // Temperature compensation formula from PHP
  const applyTemperatureCompensation = (calculateduuc, temp) => {
    if (!calculateduuc && calculateduuc !== 0) return null;
    const calcVal = parseFloat(calculateduuc);
    const tempVal = parseFloat(temp);
    if (isNaN(calcVal) || isNaN(tempVal)) return null;
    return ((0.00027 * (tempVal - 23) + 1) * calcVal).toFixed(0); // already string
  };

  const formatValueByLc = (val, decimals, leastCount) => {
    if (val === null || val === undefined || val === '') return '';
    if (typeof val === 'string' && val.includes('/')) return val;

    const strVal = String(val).trim();
    const n = parseFloat(strVal);
    if (isNaN(n)) return val;

    let d = null;
    if (decimals != null && decimals !== 'NA' && decimals !== '') {
      const p = parseInt(decimals, 10);
      if (!isNaN(p)) d = p;
    }
    if (d === null && leastCount != null && leastCount !== 'NA' && leastCount !== '') {
      const s = String(leastCount).trim();
      if (s.includes('.')) d = s.split('.')[1].length;
    }

    if (leastCount != null && leastCount !== 'NA' && leastCount !== '') {
      const lc = parseFloat(String(leastCount).trim());
      if (!isNaN(lc) && lc > 0) {
        const quotient = n / lc;
        const floored = Math.floor(quotient);
        const remainder = quotient - floored;

        let rounded;
        if (remainder < 0.5) {
          rounded = floored;
        } else if (remainder > 0.5) {
          rounded = floored + 1;
        } else {
          rounded = (floored % 2 === 0) ? floored : floored + 1;
        }

        const result = rounded * lc;
        if (d !== null) {
          return result.toFixed(d);
        }
        return String(result);
      }
    }

    if (d !== null) {
      const multiplier = Math.pow(10, d);
      const scaled = n * multiplier;
      const floored = Math.floor(scaled);
      const remainder = scaled - floored;

      let rounded;
      if (remainder < 0.5) {
        rounded = floored;
      } else if (remainder > 0.5) {
        rounded = floored + 1;
      } else {
        rounded = (floored % 2 === 0) ? floored : floored + 1;
      }

      return (rounded / multiplier).toFixed(d);
    }
    return strVal;
  };

  // PHP stores decimals as "NA" when no rounding should be applied.
  const resolveDecimals = (spec) => {
    if (spec === null || spec === undefined || spec === '' || spec === 'NA') return null;
    const n = parseInt(spec, 10);
    return isNaN(n) ? null : n;
  };

  const getDecimalPlaces = (leastCount) => {
    if (!leastCount || leastCount === 'NA') return 0;
    const s = String(leastCount).trim();
    if (s.includes('.')) return s.split('.')[1].length;
    return 0;
  };

  const calculateAverageMaster = (m0, m1, m2, mlc_decimals, masterleastcount) => {
    const v0 = parseFloat(m0);
    const v1 = parseFloat(m1);
    const v2 = parseFloat(m2);

    if (isNaN(v0) || isNaN(v1) || isNaN(v2)) return '';

    const avg = (v0 + v1 + v2) / 3;
    // PHP forces mlc = "NA" for non-332 masters, so averageavg() does no rounding
    // and never snaps to the master least count.
    if (mlc_decimals === null) return String(avg);
    return formatValueByLc(avg, mlc_decimals, masterleastcount);
  };

  const calculateError = (uucVal, avgMaster, errorlc) => {
    if (uucVal === '' || avgMaster === '') return '';
    const uuc = parseFloat(uucVal);
    const avg = parseFloat(avgMaster);
    if (isNaN(uuc) || isNaN(avg)) return '';

    const error = uuc - avg;
    // PHP passes errorlc = "NA" to substractminus(), which applies no rounding.
    if (errorlc === null || errorlc === undefined) return String(error);
    return error.toFixed(errorlc);
  };

  const calculatePercentError = (error, avgMaster) => {
    if (error === '' || avgMaster === '' || avgMaster === '0') return '';
    const err = parseFloat(error);
    const avg = parseFloat(avgMaster);
    if (isNaN(err) || isNaN(avg) || avg === 0) return '';

    const percentErr = (err / avg) * 100;
    return percentErr.toFixed(2);
  };

  const calculateRepeatability = (m0, m1, m2, avgMaster) => {
    const values = [m0, m1, m2].map(v => parseFloat(v)).filter(v => !isNaN(v));
    const avg = parseFloat(avgMaster);
    if (values.length === 0 || isNaN(avg) || avg === 0) return '';

    const max = Math.max(...values);
    const min = Math.min(...values);
    const repeatability = ((max - min) / avg) * 100;
    return repeatability.toFixed(2);
  };

  const calculateZeroError = (removalForce, maxPoint) => {
    if (removalForce === '' || !maxPoint) return '';
    const removal = parseFloat(removalForce);
    const max = parseFloat(maxPoint);
    if (isNaN(removal) || isNaN(max) || max === 0) return '';

    const zeroErr = (removal / max) * 100;
    return zeroErr.toFixed(2);
  };

  const calculateRelativeResolution = (leastCount, minPoint) => {
    if (leastCount === 'NA' || !minPoint) return '';
    const lc = parseFloat(leastCount);
    const min = parseFloat(minPoint);
    if (isNaN(lc) || isNaN(min) || min === 0) return '';

    const relRes = (lc / min) * 100;
    return relRes.toFixed(2);
  };

  if (!selectedTableData?.calibration_points) return null;

  // Handle both direct calibration_points array and matrix structure
  const calibrationPoints = Array.isArray(selectedTableData.calibration_points)
    ? selectedTableData.calibration_points
    : [];

  if (calibrationPoints.length === 0) return null;

  const point = calibrationPoints[0];
  const uucUnit = point?.unit || selectedTableData?.metadata?.unit || 'kN';
  const masterUnit = point?.master_unit || selectedTableData?.metadata?.unit || 'kN';
  const masterInstName = selectedTableData?.metadata?.master_instrument
    ?? selectedTableData?.metadata?.master_instrument_name
    ?? '';
  // PHP only applies the 0.00027 temperature compensation for master type 332.
  const masterType = String(
    selectedTableData?.metadata?.master_type ?? instrument?.typeofmaster ?? ''
  );
  const usesTemperatureCompensation = masterType === '332';
  const stdTemp = masterInstName.includes('Force Proving Ring') ? '23' : '24';
  const POSITIONS = ['Position 0°', 'Position 120°', 'Position 240°'];

  // Calculate min and max points for this table (prefer backend-computed values; fall back to deriving from points)
  const allPoints = selectedTableData.calibration_points.map(p => parseFloat(p.force ?? p.point)).filter(p => !isNaN(p));
  const minPoint = selectedTableData?.additional_data?.min_point ?? (allPoints.length > 0 ? Math.min(...allPoints) : '');
  const maxPoint = selectedTableData?.zero_error_data?.max_point ?? (allPoints.length > 0 ? Math.max(...allPoints) : '');

  // Get matrix ID for persistence
  const matrixId = calibrationPoints[0]?.matrix_id ?? calibrationPoints[0]?.id ?? '';

  // Fall back to the values parsed from the fetched observations (staticRows) when
  // no local edit exists yet in tableInputValues, so saved values survive a refresh.
  const machineRowIndex = (selectedTableData?.rowMeta || []).findIndex(
    (meta) => meta.kind === 'machine' && meta.matrixId === matrixId
  );
  const machineRow = machineRowIndex >= 0 ? selectedTableData?.staticRows?.[machineRowIndex] : null;
  const defaultClassOfMachine = machineRow?.[1] ?? '';
  const defaultDialGaugeSetting = machineRow?.[5] ?? '';

  return (
    <div className="mb-8">
      <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4 uppercase">UTM (Universal Testing Machine) Observations</h3>

      {/* Pre-loading Cycle Section */}
      <div className="mb-4 p-4 border border-gray-200 dark:border-gray-600 rounded">
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">No. Of Pre-Loading Cycle Before Calibration</div>
        <div className="flex gap-6 flex-wrap">
          {[1, 2, 3, 4, 5].map((num) => (
            <div key={num} className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`preload-${num}`}
                className="w-4 h-4 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                defaultChecked={num === 1}
              />
              <label htmlFor={`preload-${num}`} className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                {num}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Main Observation Table */}
      <div className="overflow-x-auto border border-gray-200 dark:border-gray-600 mb-4">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-700 border-b border-gray-300 dark:border-gray-600">
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase border-r border-gray-300 dark:border-gray-600">Sr. No.</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase border-r border-gray-300 dark:border-gray-600">Force (F) ({uucUnit})</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase border-r border-gray-300 dark:border-gray-600">Std. at {stdTemp} ± 1 (°C)</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase border-r border-gray-300 dark:border-gray-600">
                <div>Std. at Room Temp ({masterUnit})</div>
                <div id="roomtemp" className="text-xs font-normal normal-case text-blue-600 dark:text-blue-400 mt-0.5">
                  {roomTemperature > 0 ? `${roomTemperature} °C` : ''}
                </div>
              </th>
              <th colSpan="3" className="px-3 py-2 text-center text-xs font-medium text-gray-700 dark:text-gray-200 uppercase border-r border-gray-300 dark:border-gray-600">Observed (F) ({masterUnit})</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase border-r border-gray-300 dark:border-gray-600">Mean (Fi)</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase border-r border-gray-300 dark:border-gray-600">Error (q)</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase border-r border-gray-300 dark:border-gray-600">% Error</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase">% Repeatability</th>
            </tr>
            <tr className="bg-gray-50 dark:bg-gray-600 border-b border-gray-300 dark:border-gray-600">
              <th colSpan="4" className="border-r border-gray-300 dark:border-gray-600"></th>
              {POSITIONS.map((pos) => (
                <th key={pos} className="px-3 py-1 text-center text-xs font-medium text-gray-600 dark:text-gray-300 border-r border-gray-300 dark:border-gray-600">{pos}</th>
              ))}
              <th colSpan="4" className="border-r border-gray-300 dark:border-gray-600"></th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800">
            {calibrationPoints.map((calibPoint, idx) => {
              const pointId = calibPoint.id || calibPoint.calibration_point_id;
              // Prefer the decimal spec the backend sends ("NA" means: do not round).
              const mlc_dec = calibPoint.decimal_places
                ? resolveDecimals(calibPoint.decimal_places.mlc)
                : getDecimalPlaces(calibPoint.master_least_count);
              const lc_dec = calibPoint.decimal_places
                ? resolveDecimals(calibPoint.decimal_places.lc)
                : getDecimalPlaces(calibPoint.least_count);
              const error_dec = calibPoint.decimal_places
                ? resolveDecimals(calibPoint.decimal_places.error_lc)
                : Math.max(mlc_dec ?? 0, lc_dec ?? 0);

              // Calculate Calculated UUC (reference at 23°C / 24°C)
              const calculatedUuc = calibPoint.calculated_uuc ?? calibPoint.calculateduuc ?? calibPoint.std_at_reference_temp ?? '';

              // PHP: uuc0 = calculateduuc for non-332 masters; only type 332 gets the
              // (0.00027 * (avgTemp - 23) + 1) factor applied by changetemp().
              const compensatedUuc = usesTemperatureCompensation
                && calculatedUuc !== '' && calculatedUuc !== null && roomTemperature > 0
                ? applyTemperatureCompensation(calculatedUuc, roomTemperature)
                : (calibPoint.uuc ?? calibPoint.std_room ?? calculatedUuc);

              // Use compensated UUC for error calculation
              const uucForError = compensatedUuc !== null && compensatedUuc !== '' ? compensatedUuc : calibPoint.uuc ?? calibPoint.point ?? '';

              // Handle both API data structure (force, master_readings) and legacy structure (point, m0, m1, m2)
              const masterReadings = calibPoint.master_readings || [
                calibPoint.m0 ?? '',
                calibPoint.m1 ?? '',
                calibPoint.m2 ?? ''
              ];

              const m0Reading = tableInputValues[`${pointId}-m0`] ?? (masterReadings[0] ?? '');
              const m1Reading = tableInputValues[`${pointId}-m1`] ?? (masterReadings[1] ?? '');
              const m2Reading = tableInputValues[`${pointId}-m2`] ?? (masterReadings[2] ?? '');

              const avgMaster = calculateAverageMaster(m0Reading, m1Reading, m2Reading, mlc_dec, calibPoint.master_least_count);
              const error = calculateError(uucForError, avgMaster, error_dec);
              const percentError = calculatePercentError(error, avgMaster);
              const repeatability = calculateRepeatability(m0Reading, m1Reading, m2Reading, avgMaster);

              return (
                <tr key={pointId} className="border-b border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-3 py-2 text-sm border-r border-gray-200 dark:border-gray-600 dark:text-white">
                    {calibPoint.sr_no ?? idx + 1}
                  </td>
                  <td className="px-3 py-2 text-sm border-r border-gray-200 dark:border-gray-600 dark:text-white bg-gray-50 dark:bg-gray-700">
                    <input
                      type="text"
                      className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white cursor-not-allowed"
                      value={calibPoint.force ?? calibPoint.point ?? ''}
                      readOnly
                    />
                  </td>
                  <td className="px-3 py-2 text-sm border-r border-gray-200 dark:border-gray-600 dark:text-white bg-gray-50 dark:bg-gray-700">
                    <input
                      type="text"
                      className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white cursor-not-allowed"
                      title={`Calculated at ${stdTemp}°C: ${calculatedUuc}`}
                      value={calculatedUuc}
                      readOnly
                    />
                  </td>
                  <td className="px-3 py-2 text-sm border-r border-gray-200 dark:border-gray-600 dark:text-white bg-gray-50 dark:bg-gray-700">
                    <input
                      type="text"
                      className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white cursor-not-allowed"
                      title={`Room Temp: ${roomTemperature > 0 ? roomTemperature : ''}°C (compensated from 23°C)`}
                      value={compensatedUuc ?? ''}
                      readOnly
                    />
                  </td>
                  {[0, 1, 2].map((posIdx) => (
                    <td key={posIdx} className="px-3 py-2 text-sm border-r border-gray-200 dark:border-gray-600 dark:text-white">
                      <input
                        type="number"
                        className="w-full px-2 py-1 border rounded bg-white dark:bg-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300 dark:border-gray-600"
                        value={tableInputValues[`${pointId}-m${posIdx}`] ?? masterReadings[posIdx] ?? ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setTableInputValues({
                            ...tableInputValues,
                            [`${pointId}-m${posIdx}`]: val
                          });
                        }}
                        onBlur={(e) => {
                          if (validateDecimalPlaces) {
                            validateDecimalPlaces(`${pointId}-m${posIdx}`, e.target.value, calibPoint.master_least_count);
                          }
                          if (handleObservationBlur) {
                            handleObservationBlur(
                              idx,
                              posIdx + 4,
                              e.target.value,
                              pointId
                            );
                          }
                        }}
                        placeholder={`M${posIdx}`}
                      />
                    </td>
                  ))}
                  <td className="px-3 py-2 text-sm border-r border-gray-200 dark:border-gray-600 dark:text-white bg-gray-50 dark:bg-gray-700">
                    <input
                      type="text"
                      className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white cursor-not-allowed"
                      value={avgMaster}
                      readOnly
                    />
                  </td>
                  <td className="px-3 py-2 text-sm border-r border-gray-200 dark:border-gray-600 dark:text-white bg-gray-50 dark:bg-gray-700">
                    <input
                      type="text"
                      className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white cursor-not-allowed"
                      value={error}
                      readOnly
                    />
                  </td>
                  <td className="px-3 py-2 text-sm border-r border-gray-200 dark:border-gray-600 dark:text-white bg-gray-50 dark:bg-gray-700">
                    <input
                      type="text"
                      className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white cursor-not-allowed"
                      value={percentError}
                      readOnly
                    />
                  </td>
                  <td className="px-3 py-2 text-sm dark:text-white bg-gray-50 dark:bg-gray-700">
                    <input
                      type="text"
                      className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white cursor-not-allowed"
                      value={repeatability}
                      readOnly
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Removal of Force Section */}
      <div className="overflow-x-auto border border-gray-200 dark:border-gray-600 mb-4">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-700 border-b border-gray-300 dark:border-gray-600">
              <th colSpan="4" className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase border-r border-gray-300 dark:border-gray-600">
                Observation Reading on Removal of Force (fi0)
              </th>
              {POSITIONS.map((pos) => (
                <th key={pos} className="px-3 py-2 text-center text-xs font-medium text-gray-700 dark:text-gray-200 uppercase border-r border-gray-300 dark:border-gray-600">{pos}</th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800">
            <tr className="border-b border-gray-200 dark:border-gray-600">
              {[0, 1, 2].map((posIdx) => (
                <td key={posIdx} className="px-3 py-2 text-sm border-r border-gray-200 dark:border-gray-600 dark:text-white">
                  <input
                    type="number"
                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={tableInputValues[`removalforce-${posIdx}`]
                      ?? selectedTableData?.zero_error_data?.removal_forces?.[posIdx]
                      ?? ''}
                    onChange={(e) => setTableInputValues({
                      ...tableInputValues,
                      [`removalforce-${posIdx}`]: e.target.value
                    })}
                    onBlur={(e) => {
                      if (handleObservationBlur) {
                        // Use a special row index for removal force data
                        const removalRowIndex = calibrationPoints.length;
                        handleObservationBlur(
                          removalRowIndex,
                          posIdx + 4,
                          e.target.value,
                          matrixId
                        );
                      }
                    }}
                    placeholder={`Removal ${posIdx}`}
                  />
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Zero Error Section */}
      <div className="overflow-x-auto border border-gray-200 dark:border-gray-600 mb-4">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-700 border-b border-gray-300 dark:border-gray-600">
              <th colSpan="4" className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase border-r border-gray-300 dark:border-gray-600">
                Relative Zero Error % (f0)
              </th>
              {POSITIONS.map((pos) => (
                <th key={pos} className="px-3 py-2 text-center text-xs font-medium text-gray-700 dark:text-gray-200 uppercase border-r border-gray-300 dark:border-gray-600">{pos}</th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800">
            <tr className="border-b border-gray-200 dark:border-gray-600">
              {[0, 1, 2].map((posIdx) => {
                const removalForce = tableInputValues[`removalforce-${posIdx}`]
                  ?? selectedTableData?.zero_error_data?.removal_forces?.[posIdx]
                  ?? '';
                const zeroErr = calculateZeroError(removalForce, maxPoint);
                return (
                  <td key={posIdx} className="px-3 py-2 text-sm border-r border-gray-200 dark:border-gray-600 dark:text-white bg-gray-50 dark:bg-gray-700">
                    <input
                      type="text"
                      className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white cursor-not-allowed"
                      value={zeroErr}
                      readOnly
                    />
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Summary Section */}
      <div className="grid grid-cols-2 gap-4 p-4 border border-gray-200 dark:border-gray-600 rounded">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 w-40">Least Count:</label>
          <input
            type="text"
            className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white cursor-not-allowed"
            value={point?.least_count ?? ''}
            readOnly
          />
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 w-40">Min Point:</label>
          <input
            type="text"
            className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white cursor-not-allowed"
            value={minPoint}
            readOnly
          />
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 w-40">Max Point:</label>
          <input
            type="text"
            className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white cursor-not-allowed"
            value={maxPoint}
            readOnly
          />
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 w-40">Max Relative Resolution:</label>
          <input
            type="text"
            className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white cursor-not-allowed"
            value={
              selectedTableData?.additional_data?.max_relative_resolution !== undefined &&
                selectedTableData?.additional_data?.max_relative_resolution !== null
                ? String(selectedTableData.additional_data.max_relative_resolution)
                : calculateRelativeResolution(point?.least_count, minPoint)
            }
            readOnly
          />
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 w-40">Class of Machine:</label>
          <input
            type="text"
            className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={tableInputValues['classofmachine'] ?? defaultClassOfMachine}
            onChange={(e) => setTableInputValues({
              ...tableInputValues,
              classofmachine: e.target.value
            })}
            onBlur={(e) => {
              if (handleObservationBlur) {
                handleObservationBlur(
                  calibrationPoints.length + 3,
                  1,
                  e.target.value,
                  matrixId
                );
              }
            }}
            placeholder="Enter class"
          />
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 w-40">Dial Gauge Setting:</label>
          <input
            type="text"
            className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={tableInputValues['dialguagesetting'] ?? defaultDialGaugeSetting}
            onChange={(e) => setTableInputValues({
              ...tableInputValues,
              dialguagesetting: e.target.value
            })}
            onBlur={(e) => {
              if (handleObservationBlur) {
                handleObservationBlur(
                  calibrationPoints.length + 3,
                  5,
                  e.target.value,
                  matrixId
                );
              }
            }}
            placeholder="Enter setting"
          />
        </div>
      </div>
    </div>
  );
};

// Exported calculation function for use in CalibrateStep3
export const calculateUTMValues = (rowData, rowIndex, selectedTableData) => {
  const result = {};
  const rowMeta = selectedTableData?.rowMeta?.[rowIndex] || {};

  if (rowMeta.kind === 'removal') {
    const maxPoint = parseFloat(rowMeta.maxPoint) || 0;
    [4, 5, 6].forEach((colIdx, idx) => {
      const removal = parseFloat(rowData[colIdx]);
      result[`zero${idx}`] = maxPoint && !isNaN(removal) ? ((removal / maxPoint) * 100).toFixed(2) : '';
    });
    return result;
  }

  if (rowMeta.kind !== 'point') return result;

  const masterValues = [4, 5, 6]
    .map((colIdx) => parseFloat(rowData[colIdx]))
    .filter((val) => !isNaN(val));
  const average = masterValues.length
    ? masterValues.reduce((sum, val) => sum + val, 0) / masterValues.length
    : null;

  result.average = average !== null ? average.toFixed(3) : '';

  const uuc = parseFloat(rowData[3]);
  const error = average !== null && !isNaN(uuc) ? uuc - average : null;
  result.error = error !== null ? error.toFixed(3) : '';
  result.percentError = error !== null && average
    ? ((error / average) * 100).toFixed(2)
    : '';
  result.repeatability = average && masterValues.length > 1
    ? (((Math.max(...masterValues) - Math.min(...masterValues)) / average) * 100).toFixed(2)
    : '';

  return result;
};

export default ObservationUTM;
