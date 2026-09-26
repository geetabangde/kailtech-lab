import { useState } from 'react';

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

const ObservationWBN = ({
  selectedTableData,
  tableInputValues,
  setTableInputValues,
  handleInputChange,
  handleObservationBlur,
  observationErrors = {},
  setObservationErrors,
  observations,
  diagram: parentDiagram,
  setDiagram: parentSetDiagram,
}) => {
  const [localDiagram, setLocalDiagram] = useState('');
  const diagram = parentDiagram || localDiagram;
  const setDiagram = parentSetDiagram || setLocalDiagram;

  if (selectedTableData?.id !== 'observationwbn') return null;

  // Check if we're using the new API structure with weighing_process, repeatability, eccentricity
  const isNewStructure = selectedTableData?.weighing_process || selectedTableData?.repeatability || selectedTableData?.eccentricity;

  // If using new API structure with structured sections
  if (isNewStructure) {
    const weighingProcess = selectedTableData.weighing_process;
    const repeatability = selectedTableData.repeatability;
    const eccentricity = selectedTableData.eccentricity;

    if (!weighingProcess && !repeatability && !eccentricity) {
      return (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded">
          <p className="text-yellow-800 dark:text-yellow-200">No calibration points available for WBN Observation</p>
        </div>
      );
    }

    return (
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4 uppercase">Weighing Balance (WBN) Observations</h3>

        {/* Diagram Selection */}
        {weighingProcess?.diagrams && weighingProcess.diagrams.length > 0 && (
          <div className="mb-6">
            <h4 className="text-md font-medium text-gray-800 dark:text-white mb-3">Diagram Choice</h4>
            <div className="flex gap-8 justify-center mb-6">
              {weighingProcess.diagrams.map((diagramOption) => (
                <div key={diagramOption.value} className="flex flex-col items-center gap-2 border border-gray-200 dark:border-gray-700 p-4 rounded bg-white dark:bg-gray-800">
                  <img
                    src={diagramOption.image}
                    alt={diagramOption.value}
                    className="h-32 object-contain"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                  <label className="flex items-center gap-2 text-sm font-medium dark:text-white mt-2 cursor-pointer">
                    <input
                      type="radio"
                      name="diagram"
                      value={diagramOption.value}
                      checked={diagram === diagramOption.value}
                      onChange={(e) => setDiagram(e.target.value)}
                      className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    {diagramOption.value === 'circalimg' ? 'Circular Diagram' : 'Rectangular Diagram'}
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Weighing Process Section */}
        {weighingProcess && weighingProcess.rows && weighingProcess.rows.length > 0 && (
          <div>
            <h4 className="text-lg font-medium text-gray-800 dark:text-white mb-3 bg-blue-50 dark:bg-blue-900 p-2 rounded">
              {weighingProcess.title || 'Weighing Process'}
            </h4>
            <div className="overflow-x-auto border border-gray-200 dark:border-gray-600">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-700 border-b border-gray-300 dark:border-gray-600">
                    {weighingProcess.headers && weighingProcess.headers.map((header, idx) => (
                      <th key={idx} className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider border-r border-gray-300 dark:border-gray-600">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {weighingProcess.rows.map((row, rowIndex) => (
                    <tr key={rowIndex} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-3 py-2 text-sm border-r border-gray-200 dark:border-gray-600">{row.sr_no}</td>
                      <td className="px-3 py-2 text-sm border-r border-gray-200 dark:border-gray-600">{row.nominal_value}</td>
                      {/* W1, W2, W3 */}
                      {row.uuc_observations && row.uuc_observations.map((obs, obsIdx) => {
                        const key = `wbn-w-${rowIndex}-${obs.repeatable}`;
                        const flatKey = `${rowIndex}-${obsIdx + 2}`;
                        const currentVal = tableInputValues[key] !== undefined ? tableInputValues[key] : (obs.value ?? '');
                        const error = observationErrors[key] || observationErrors[flatKey];

                        return (
                          <td key={obsIdx} className="px-3 py-2 text-sm border-r border-gray-200 dark:border-gray-600 align-top">
                            <div className="flex items-center gap-1.5">
                              <input
                                type="text"
                                className={`w-full px-2 py-1 border rounded text-sm focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-white transition-all ${error ? 'border-red-500 ring-2 ring-red-400 dark:ring-red-700 bg-red-50 dark:bg-red-950/30' : 'border-gray-200 dark:border-gray-600'
                                  }`}
                                value={currentVal}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (val !== '' && !/^-?\d*\.?\d*$/.test(val)) return;

                                  if (setTableInputValues) {
                                    setTableInputValues(prev => ({ ...prev, [key]: val, [flatKey]: val }));
                                  }

                                  if (setObservationErrors) {
                                    setObservationErrors(prev => {
                                      const updated = { ...prev };
                                      delete updated[key];
                                      delete updated[flatKey];
                                      return updated;
                                    });
                                  }

                                  if (handleInputChange) {
                                    handleInputChange(rowIndex, obsIdx + 2, val);
                                  }
                                }}
                                onBlur={(e) => {
                                  const val = e.target.value;
                                  if (!val || val.trim() === '') {
                                    if (setObservationErrors) {
                                      setObservationErrors(prev => ({
                                        ...prev,
                                        [key]: 'This field is required',
                                        [flatKey]: 'This field is required'
                                      }));
                                    }
                                  }
                                  if (handleObservationBlur) {
                                    handleObservationBlur(rowIndex, obsIdx + 2, val);
                                  }
                                }}
                              />
                              {row.master_unit && <span className="text-xs text-gray-500 dark:text-gray-400 font-medium shrink-0 select-none">{row.master_unit}</span>}
                            </div>
                            {error && (
                              <span className="text-red-500 text-xs block mt-1">{error}</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-3 py-2 text-sm border-r border-gray-200 dark:border-gray-600">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            className="w-full px-2 py-1 border border-gray-200 dark:border-gray-600 rounded text-sm focus:ring-1 focus:ring-blue-500 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white cursor-not-allowed"
                            value={tableInputValues[`wbn-avg-${rowIndex}`] ?? tableInputValues[`${rowIndex}-5`] ?? row.average_uuc ?? ''}
                            disabled
                          />
                          {row.master_unit && <span className="text-xs text-gray-500 dark:text-gray-400 font-medium shrink-0 select-none">{row.master_unit}</span>}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-sm">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            className="w-full px-2 py-1 border border-gray-200 dark:border-gray-600 rounded text-sm focus:ring-1 focus:ring-blue-500 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white cursor-not-allowed"
                            value={tableInputValues[`wbn-err-${rowIndex}`] ?? tableInputValues[`${rowIndex}-6`] ?? row.error ?? ''}
                            disabled
                          />
                          {row.master_unit && <span className="text-xs text-gray-500 dark:text-gray-400 font-medium shrink-0 select-none">{row.master_unit}</span>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Repeatability Section */}
        {repeatability && repeatability.rows && repeatability.rows.length > 0 && (
          <div className="mt-8">
            <h4 className="text-lg font-medium text-gray-800 dark:text-white mb-3 bg-blue-50 dark:bg-blue-900 p-2 rounded">
              {repeatability.title || 'Repeatability'}
            </h4>
            <div className="overflow-x-auto border border-gray-200 dark:border-gray-600">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-700 border-b border-gray-300 dark:border-gray-600">
                    {repeatability.headers && repeatability.headers.map((header, idx) => (
                      <th key={idx} className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider border-r border-gray-300 dark:border-gray-600">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {repeatability.rows.map((row, rowIndex) => (
                    <tr key={rowIndex} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-3 py-2 text-sm border-r border-gray-200 dark:border-gray-600">{row.nominal_value}</td>
                      {/* R1-R5 */}
                      {row.uucr_observations && row.uucr_observations.map((obs, obsIdx) => {
                        const key = `wbn-r-${rowIndex}-${obs.repeatable}`;
                        const globalRowIndex = (selectedTableData.weighingCount || weighingProcess?.rows?.length || 0) + rowIndex;
                        const flatKey = `${globalRowIndex}-${obsIdx + 1}`;
                        const currentVal = tableInputValues[key] !== undefined ? tableInputValues[key] : (obs.value ?? '');
                        const error = observationErrors[key] || observationErrors[flatKey];

                        return (
                          <td key={obsIdx} className="px-3 py-2 text-sm border-r border-gray-200 dark:border-gray-600 align-top">
                            <div className="flex items-center gap-1.5">
                              <input
                                type="text"
                                className={`w-full px-2 py-1 border rounded text-sm focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-white transition-all ${error ? 'border-red-500 ring-2 ring-red-400 dark:ring-red-700 bg-red-50 dark:bg-red-950/30' : 'border-gray-200 dark:border-gray-600'
                                  }`}
                                value={currentVal}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (val !== '' && !/^-?\d*\.?\d*$/.test(val)) return;

                                  if (setTableInputValues) {
                                    setTableInputValues(prev => ({ ...prev, [key]: val, [flatKey]: val }));
                                  }

                                  if (setObservationErrors) {
                                    setObservationErrors(prev => {
                                      const updated = { ...prev };
                                      delete updated[key];
                                      delete updated[flatKey];
                                      return updated;
                                    });
                                  }

                                  if (handleInputChange) {
                                    handleInputChange(globalRowIndex, obsIdx + 1, val);
                                  }
                                }}
                                onBlur={(e) => {
                                  const val = e.target.value;
                                  if (!val || val.trim() === '') {
                                    if (setObservationErrors) {
                                      setObservationErrors(prev => ({
                                        ...prev,
                                        [key]: 'This field is required',
                                        [flatKey]: 'This field is required'
                                      }));
                                    }
                                  }
                                  if (handleObservationBlur) {
                                    handleObservationBlur(globalRowIndex, obsIdx + 1, val);
                                  }
                                }}
                              />
                              {row.unit && <span className="text-xs text-gray-500 dark:text-gray-400 font-medium shrink-0 select-none">{row.unit}</span>}
                            </div>
                            {error && (
                              <span className="text-red-500 text-xs block mt-1">{error}</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-3 py-2 text-sm">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            className="w-full px-2 py-1 border border-gray-200 dark:border-gray-600 rounded text-sm focus:ring-1 focus:ring-blue-500 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white cursor-not-allowed"
                            value={tableInputValues[`wbn-r-avg-${rowIndex}`] || row.average_uucr || ''}
                            disabled
                          />
                          {row.unit && <span className="text-xs text-gray-500 dark:text-gray-400 font-medium shrink-0 select-none">{row.unit}</span>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Eccentricity Section */}
        {eccentricity && eccentricity.rows && eccentricity.rows.length > 0 && (
          <div className="mt-8">
            <h4 className="text-lg font-medium text-gray-800 dark:text-white mb-3 bg-blue-50 dark:bg-blue-900 p-2 rounded">
              {eccentricity.title || 'Eccentricity'}
            </h4>
            <div className="overflow-x-auto border border-gray-200 dark:border-gray-600">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-700 border-b border-gray-300 dark:border-gray-600">
                    {eccentricity.headers && eccentricity.headers.map((header, idx) => (
                      <th key={idx} className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider border-r border-gray-300 dark:border-gray-600">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {eccentricity.rows.map((row, rowIndex) => (
                    <tr key={rowIndex} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-3 py-2 text-sm border-r border-gray-200 dark:border-gray-600">{row.nominal_value}</td>
                      {/* Clockwise 1-5 */}
                      {row.clockwise_observations && row.clockwise_observations.map((obs, obsIdx) => {
                        const key = `wbn-cw-${rowIndex}-${obs.position}`;
                        const wCount = selectedTableData.weighingCount || weighingProcess?.rows?.length || 0;
                        const rCount = selectedTableData.repeatabilityCount || repeatability?.rows?.length || 0;
                        const globalRowIndex = wCount + rCount + rowIndex;
                        const flatKey = `${globalRowIndex}-${obsIdx + 1}`;
                        const currentVal = tableInputValues[key] !== undefined ? tableInputValues[key] : (obs.value ?? '');
                        const error = observationErrors[key] || observationErrors[flatKey];

                        return (
                          <td key={`cw-${obsIdx}`} className="px-3 py-2 text-sm border-r border-gray-200 dark:border-gray-600 align-top">
                            <div className="flex items-center gap-1.5">
                              <input
                                type="text"
                                className={`w-full px-2 py-1 border rounded text-sm focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-white transition-all ${error ? 'border-red-500 ring-2 ring-red-400 dark:ring-red-700 bg-red-50 dark:bg-red-950/30' : 'border-gray-200 dark:border-gray-600'
                                  }`}
                                value={currentVal}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (val !== '' && !/^-?\d*\.?\d*$/.test(val)) return;

                                  if (setTableInputValues) {
                                    setTableInputValues(prev => ({ ...prev, [key]: val, [flatKey]: val }));
                                  }

                                  if (setObservationErrors) {
                                    setObservationErrors(prev => {
                                      const updated = { ...prev };
                                      delete updated[key];
                                      delete updated[flatKey];
                                      return updated;
                                    });
                                  }

                                  if (handleInputChange) {
                                    handleInputChange(globalRowIndex, obsIdx + 1, val);
                                  }
                                }}
                                onBlur={(e) => {
                                  const val = e.target.value;
                                  if (!val || val.trim() === '') {
                                    if (setObservationErrors) {
                                      setObservationErrors(prev => ({
                                        ...prev,
                                        [key]: 'This field is required',
                                        [flatKey]: 'This field is required'
                                      }));
                                    }
                                  }
                                  if (handleObservationBlur) {
                                    handleObservationBlur(globalRowIndex, obsIdx + 1, val);
                                  }
                                }}
                              />
                              {row.unit && <span className="text-xs text-gray-500 dark:text-gray-400 font-medium shrink-0 select-none">{row.unit}</span>}
                            </div>
                            {error && (
                              <span className="text-red-500 text-xs block mt-1">{error}</span>
                            )}
                          </td>
                        );
                      })}
                      {/* Anticlockwise 1-5 */}
                      {row.anticlockwise_observations && row.anticlockwise_observations.map((obs, obsIdx) => {
                        const key = `wbn-acw-${rowIndex}-${obs.position}`;
                        const wCount = selectedTableData.weighingCount || weighingProcess?.rows?.length || 0;
                        const rCount = selectedTableData.repeatabilityCount || repeatability?.rows?.length || 0;
                        const globalRowIndex = wCount + rCount + rowIndex;
                        const flatKey = `${globalRowIndex}-${obsIdx + 6}`;
                        const currentVal = tableInputValues[key] !== undefined ? tableInputValues[key] : (obs.value ?? '');
                        const error = observationErrors[key] || observationErrors[flatKey];

                        return (
                          <td key={`acw-${obsIdx}`} className="px-3 py-2 text-sm border-r border-gray-200 dark:border-gray-600 align-top">
                            <div className="flex items-center gap-1.5">
                              <input
                                type="text"
                                className={`w-full px-2 py-1 border rounded text-sm focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-white transition-all ${error ? 'border-red-500 ring-2 ring-red-400 dark:ring-red-700 bg-red-50 dark:bg-red-950/30' : 'border-gray-200 dark:border-gray-600'
                                  }`}
                                value={currentVal}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (val !== '' && !/^-?\d*\.?\d*$/.test(val)) return;

                                  if (setTableInputValues) {
                                    setTableInputValues(prev => ({ ...prev, [key]: val, [flatKey]: val }));
                                  }

                                  if (setObservationErrors) {
                                    setObservationErrors(prev => {
                                      const updated = { ...prev };
                                      delete updated[key];
                                      delete updated[flatKey];
                                      return updated;
                                    });
                                  }

                                  if (handleInputChange) {
                                    handleInputChange(globalRowIndex, obsIdx + 6, val);
                                  }
                                }}
                                onBlur={(e) => {
                                  const val = e.target.value;
                                  if (!val || val.trim() === '') {
                                    if (setObservationErrors) {
                                      setObservationErrors(prev => ({
                                        ...prev,
                                        [key]: 'This field is required',
                                        [flatKey]: 'This field is required'
                                      }));
                                    }
                                  }
                                  if (handleObservationBlur) {
                                    handleObservationBlur(globalRowIndex, obsIdx + 6, val);
                                  }
                                }}
                              />
                              {row.unit && <span className="text-xs text-gray-500 dark:text-gray-400 font-medium shrink-0 select-none">{row.unit}</span>}
                            </div>
                            {error && (
                              <span className="text-red-500 text-xs block mt-1">{error}</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-3 py-2 text-sm">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            className="w-full px-2 py-1 border border-gray-200 dark:border-gray-600 rounded text-sm focus:ring-1 focus:ring-blue-500 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white cursor-not-allowed"
                            value={tableInputValues[`wbn-ecc-${rowIndex}`] || row.eccentricity_d_value || ''}
                            disabled
                          />
                          {row.unit && <span className="text-xs text-gray-500 dark:text-gray-400 font-medium shrink-0 select-none">{row.unit}</span>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Original logic for flat row format
  const weighingCount = selectedTableData.weighingCount || 0;
  const repeatabilityCount = selectedTableData.repeatabilityCount || 0;
  const eccentricityCount = selectedTableData.eccentricityCount || 0;

  if (!selectedTableData.staticRows || selectedTableData.staticRows.length === 0) {
    return (
      <div className="p-4 bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded">
        <p className="text-yellow-800 dark:text-yellow-200">No calibration points available for WBN Observation</p>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4 uppercase">Weighing Balance (WBN) Observations</h3>

      {/* Diagram Selection */}
      <div className="mb-6">
        <h4 className="text-md font-medium text-gray-800 dark:text-white mb-3">Diagram Choice</h4>
        <div className="flex gap-8 justify-center mb-6">
          <div className="flex flex-col items-center gap-2 border border-gray-200 dark:border-gray-700 p-4 rounded bg-white dark:bg-gray-800">
            <img
              src="/images/circalimg.png"
              alt="Circular Diagram"
              className="h-32 object-contain"
            />
            <label className="flex items-center gap-2 text-sm font-medium dark:text-white mt-2 cursor-pointer">
              <input
                type="radio"
                name="daigram"
                value="circalimg"
                checked={diagram === 'circalimg'}
                onChange={(e) => setDiagram(e.target.value)}
                className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              Circular Diagram
            </label>
          </div>
          <div className="flex flex-col items-center gap-2 border border-gray-200 dark:border-gray-700 p-4 rounded bg-white dark:bg-gray-800">
            <img
              src="/images/newrectangle.png"
              alt="Rectangular Diagram"
              className="h-32 object-contain"
            />
            <label className="flex items-center gap-2 text-sm font-medium dark:text-white mt-2 cursor-pointer">
              <input
                type="radio"
                name="daigram"
                value="newrectangle"
                checked={diagram === 'newrectangle'}
                onChange={(e) => setDiagram(e.target.value)}
                className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              Rectangular Diagram
            </label>
          </div>
        </div>
      </div>

      {/* 1. Weighing Process Table */}
      {weighingCount > 0 && (
        <div>
          <h4 className="text-lg font-medium text-gray-800 dark:text-white mb-3 bg-blue-50 dark:bg-blue-900 p-2 rounded">
            Weighing Process
          </h4>
          <div className="overflow-x-auto border border-gray-200 dark:border-gray-600">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-700 border-b border-gray-300 dark:border-gray-600">
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider border-r border-gray-300 dark:border-gray-600">
                    Sr. No.
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider border-r border-gray-300 dark:border-gray-600">
                    Nominal Value
                  </th>
                  <th colSpan="3" className="px-3 py-2 text-center text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider border-r border-gray-300 dark:border-gray-600">
                    Reading
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider border-r border-gray-300 dark:border-gray-600">
                    Average
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                    Error
                  </th>
                </tr>
                <tr className="bg-gray-50 dark:bg-gray-600 border-b border-gray-300 dark:border-gray-600">
                  <th className="border-r border-gray-300 dark:border-gray-600"></th>
                  <th className="border-r border-gray-300 dark:border-gray-600"></th>
                  <th className="px-3 py-1 text-center text-xs font-medium text-gray-600 dark:text-gray-300 border-r border-gray-300 dark:border-gray-600">
                    1
                  </th>
                  <th className="px-3 py-1 text-center text-xs font-medium text-gray-600 dark:text-gray-300 border-r border-gray-300 dark:border-gray-600">
                    2
                  </th>
                  <th className="px-3 py-1 text-center text-xs font-medium text-gray-600 dark:text-gray-300 border-r border-gray-300 dark:border-gray-600">
                    3
                  </th>
                  <th className="border-r border-gray-300 dark:border-gray-600"></th>
                  <th></th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {selectedTableData.staticRows.slice(0, weighingCount).map((row, rowIndex) => {
                  const point = observations?.[rowIndex];
                  return (
                    <tr key={rowIndex} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      {row.map((cell, colIndex) => {
                        const key = `${rowIndex}-${colIndex}`;
                        let currentValue = tableInputValues[key] ?? (cell?.toString() || '');

                        if ((colIndex === 5 || colIndex === 6) && point) {
                          const lc = point.least_count_uuc || point.least_count || point.leastcount;
                          const mlc = point.least_count_master || point.master_least_count || point.masterleastcount;
                          const lcDec = (point.lc_decimals !== undefined && point.lc_decimals !== null && point.lc_decimals !== 'NA' && point.lc_decimals !== '')
                            ? parseInt(point.lc_decimals, 10)
                            : (lc && lc !== 'NA' && String(lc).includes('.') ? String(lc).split('.')[1].length : null);
                          const mlcDec = (point.mlc_decimals !== undefined && point.mlc_decimals !== null && point.mlc_decimals !== 'NA' && point.mlc_decimals !== '')
                            ? parseInt(point.mlc_decimals, 10)
                            : (mlc && mlc !== 'NA' && String(mlc).includes('.') ? String(mlc).split('.')[1].length : null);
                          const errorDec = (point.error_lc !== undefined && point.error_lc !== null && point.error_lc !== 'NA' && point.error_lc !== '')
                            ? parseInt(point.error_lc, 10)
                            : (lcDec !== null && mlcDec !== null ? Math.max(lcDec, mlcDec) : (lcDec ?? mlcDec));
                          const decimals = colIndex === 6 ? errorDec : lcDec;
                          if (currentValue !== '') {
                            currentValue = formatValueByLc(currentValue, decimals, lc);
                          }
                        }

                        const isDisabled = colIndex === 0 || colIndex === 1 || colIndex === 5 || colIndex === 6;

                        return (
                          <td key={colIndex} className="px-3 py-2 whitespace-nowrap text-sm border-r border-gray-200 dark:border-gray-600 last:border-r-0">
                            <div className="flex items-center gap-1.5">
                              <input
                                type="text"
                                id={`obs-cell-${key}`}
                                data-cell-key={key}
                                className={`w-full px-2 py-1 border rounded text-sm focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-white transition-all ${isDisabled ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : 'border-gray-200 dark:border-gray-600'
                                  } ${observationErrors[key] ? 'border-red-500 ring-2 ring-red-400 dark:ring-red-700 bg-red-50 dark:bg-red-950/30' : ''}`}
                                value={currentValue}
                                onChange={(e) => {
                                  if (isDisabled) return;
                                  handleInputChange(rowIndex, colIndex, e.target.value);
                                }}
                                onBlur={(e) => {
                                  if (isDisabled) return;
                                  handleObservationBlur(rowIndex, colIndex, e.target.value);
                                }}
                                disabled={isDisabled}
                              />
                              {colIndex !== 0 && point?.unit && (
                                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium shrink-0 select-none">
                                  {point.unit}
                                </span>
                              )}
                            </div>
                            {observationErrors[key] && (
                              <span className="text-red-500 text-xs block mt-1">{observationErrors[key]}</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. Repeatability Table - 5 readings */}
      {repeatabilityCount > 0 && (
        <div className="mt-8">
          <h4 className="text-lg font-medium text-gray-800 dark:text-white mb-3 bg-blue-50 dark:bg-blue-900 p-2 rounded">
            Repeatability
          </h4>
          <div className="overflow-x-auto border border-gray-200 dark:border-gray-600">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-700 border-b border-gray-300 dark:border-gray-600">
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider border-r border-gray-300 dark:border-gray-600">
                    Nominal Value
                  </th>
                  <th colSpan="5" className="px-3 py-2 text-center text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider border-r border-gray-300 dark:border-gray-600">
                    Reading on UUC
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                    Average
                  </th>
                </tr>
                <tr className="bg-gray-50 dark:bg-gray-600 border-b border-gray-300 dark:border-gray-600">
                  <th className="border-r border-gray-300 dark:border-gray-600"></th>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <th key={i} className="px-3 py-1 text-center text-xs font-medium text-gray-600 dark:text-gray-300 border-r border-gray-300 dark:border-gray-600">
                      {i + 1}
                    </th>
                  ))}
                  <th></th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {selectedTableData.staticRows.slice(weighingCount, weighingCount + repeatabilityCount).map((row, index) => {
                  const rowIndex = weighingCount + index;
                  const point = observations?.[rowIndex];
                  return (
                    <tr key={rowIndex} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      {row.map((cell, colIndex) => {
                        const key = `${rowIndex}-${colIndex}`;
                        let currentValue = tableInputValues[key] ?? (cell?.toString() || '');
                        const isDisabled = colIndex === 0 || colIndex === 6;

                        if (colIndex === 6 && point) {
                          const lc = point.least_count_uuc || point.least_count;
                          currentValue = formatValueByLc(currentValue, point.lc_decimals, lc);
                        }

                        return (
                          <td key={colIndex} className="px-3 py-2 whitespace-nowrap text-sm border-r border-gray-200 dark:border-gray-600 last:border-r-0">
                            <div className="flex items-center gap-1.5">
                              <input
                                type="text"
                                id={`obs-cell-${key}`}
                                data-cell-key={key}
                                className={`w-full px-2 py-1 border rounded text-sm focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-white transition-all ${isDisabled ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : 'border-gray-200 dark:border-gray-600'
                                  } ${observationErrors[key] ? 'border-red-500 ring-2 ring-red-400 dark:ring-red-700 bg-red-50 dark:bg-red-950/30' : ''}`}
                                value={currentValue}
                                onChange={(e) => {
                                  if (isDisabled) return;
                                  handleInputChange(rowIndex, colIndex, e.target.value);
                                }}
                                onBlur={(e) => {
                                  if (isDisabled) return;
                                  handleObservationBlur(rowIndex, colIndex, e.target.value);
                                }}
                                disabled={isDisabled}
                              />
                              {point?.unit && (
                                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium shrink-0 select-none">
                                  {point.unit}
                                </span>
                              )}
                            </div>
                            {observationErrors[key] && (
                              <span className="text-red-500 text-xs block mt-1">{observationErrors[key]}</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. Eccentricity Table */}
      {eccentricityCount > 0 && (
        <div className="mt-8">
          <h4 className="text-lg font-medium text-gray-800 dark:text-white mb-3 bg-blue-50 dark:bg-blue-900 p-2 rounded">
            Eccentricity
          </h4>
          <div className="overflow-x-auto border border-gray-200 dark:border-gray-600">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-700 border-b border-gray-300 dark:border-gray-600">
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider border-r border-gray-300 dark:border-gray-600">
                    Nominal Value
                  </th>
                  <th colSpan="5" className="px-3 py-2 text-center text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider border-r border-gray-300 dark:border-gray-600">
                    Reading on Clockwise
                  </th>
                  <th colSpan="5" className="px-3 py-2 text-center text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider border-r border-gray-300 dark:border-gray-600">
                    Reading on Anticlockwise
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                    D=Ec (Max-Min)/2
                  </th>
                </tr>
                <tr className="bg-gray-50 dark:bg-gray-600 border-b border-gray-300 dark:border-gray-600">
                  <th className="border-r border-gray-300 dark:border-gray-600"></th>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <th key={i} className="px-3 py-1 text-center text-xs font-medium text-gray-600 dark:text-gray-300 border-r border-gray-300 dark:border-gray-600">
                      {i + 1}
                    </th>
                  ))}
                  {Array.from({ length: 5 }).map((_, i) => (
                    <th key={i + 5} className="px-3 py-1 text-center text-xs font-medium text-gray-600 dark:text-gray-300 border-r border-gray-300 dark:border-gray-600">
                      {i + 1}
                    </th>
                  ))}
                  <th></th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {selectedTableData.staticRows.slice(weighingCount + repeatabilityCount).map((row, index) => {
                  const rowIndex = weighingCount + repeatabilityCount + index;
                  const point = observations?.[rowIndex];
                  return (
                    <tr key={rowIndex} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      {row.map((cell, colIndex) => {
                        const key = `${rowIndex}-${colIndex}`;
                        let currentValue = tableInputValues[key] ?? (cell?.toString() || '');
                        const isDisabled = colIndex === 0 || colIndex === 11;

                        if (colIndex === 11 && point) {
                          const lc = point.least_count_uuc || point.least_count || point.leastcount;
                          const baseDec = (point.lc_decimals !== undefined && point.lc_decimals !== null && point.lc_decimals !== 'NA')
                            ? Number(point.lc_decimals)
                            : (lc && lc !== 'NA' && String(lc).includes('.') ? String(lc).split('.')[1].length : 3);
                          const eccDecimals = baseDec + 1;
                          currentValue = formatValueByLc(currentValue, eccDecimals, lc);
                        }

                        return (
                          <td key={colIndex} className="px-3 py-2 whitespace-nowrap text-sm border-r border-gray-200 dark:border-gray-600 last:border-r-0">
                            <div className="flex items-center gap-1.5">
                              <input
                                type="text"
                                id={`obs-cell-${key}`}
                                data-cell-key={key}
                                className={`w-full px-2 py-1 border rounded text-sm focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-white transition-all ${isDisabled ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : 'border-gray-200 dark:border-gray-600'
                                  } ${observationErrors[key] ? 'border-red-500 ring-2 ring-red-400 dark:ring-red-700 bg-red-50 dark:bg-red-950/30' : ''}`}
                                value={currentValue}
                                onChange={(e) => {
                                  if (isDisabled) return;
                                  handleInputChange(rowIndex, colIndex, e.target.value);
                                }}
                                onBlur={(e) => {
                                  if (isDisabled) return;
                                  handleObservationBlur(rowIndex, colIndex, e.target.value);
                                }}
                                disabled={isDisabled}
                              />
                              {point?.unit && (
                                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium shrink-0 select-none">
                                  {point.unit}
                                </span>
                              )}
                            </div>
                            {observationErrors[key] && (
                              <span className="text-red-500 text-xs block mt-1">{observationErrors[key]}</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// Exported calculation function for use in CalibrateStep3
export const calculateWBNValues = (rowData, rowIndex, selectedTableData, instrument, point = null) => {
  const result = {};

  const weighingCount = selectedTableData?.weighingCount ?? 0;
  const repeatabilityCount = selectedTableData?.repeatabilityCount ?? 0;

  const getDecimalPlaces = (val) => {
    if (val === undefined || val === null || val === 'NA' || val === '') return null;
    const str = val.toString().trim();
    const parts = str.split('.');
    return parts.length > 1 ? parts[1].length : 0;
  };

  // Determine decimal places for UUC (least count)
  const lcUuc = point?.least_count_uuc ?? point?.least_count ?? point?.leastcount ?? point?.uuc_least_count;
  let uucDec = (point?.lc_decimals !== undefined && point?.lc_decimals !== null && point?.lc_decimals !== 'NA' && point?.lc_decimals !== '')
    ? parseInt(point.lc_decimals, 10)
    : getDecimalPlaces(lcUuc);

  if (uucDec === null || isNaN(uucDec)) {
    uucDec = getDecimalPlaces(instrument?.leastcount ?? instrument?.least_count);
  }
  if (uucDec === null || isNaN(uucDec)) {
    // Fallback: detect from nominal value (e.g. "0.000" -> 3 decimals)
    const nominalDec = getDecimalPlaces(rowData[1]);
    uucDec = nominalDec !== null ? nominalDec : 3;
  }
  const defaultDecimalPlaces = uucDec;

  // Determine decimal places for Master (error least count)
  const lcMaster = point?.least_count_master ?? point?.master_least_count ?? point?.masterleastcount;
  let masterDec = (point?.mlc_decimals !== undefined && point?.mlc_decimals !== null && point?.mlc_decimals !== 'NA' && point?.mlc_decimals !== '')
    ? parseInt(point.mlc_decimals, 10)
    : getDecimalPlaces(lcMaster);

  let errorDecimalPlaces = defaultDecimalPlaces;
  if (point?.error_lc !== undefined && point?.error_lc !== null && point?.error_lc !== 'NA' && point?.error_lc !== '') {
    const parsed = parseInt(point.error_lc, 10);
    if (!isNaN(parsed)) {
      errorDecimalPlaces = parsed;
    }
  } else if (masterDec !== null && !isNaN(masterDec)) {
    // Exact PHP logic: $errorlc = $mlc; if ($mlc < $lc) $errorlc = $lc; -> max(lc, mlc)
    errorDecimalPlaces = Math.max(defaultDecimalPlaces, masterDec);
  }

  // Detect which section this row belongs to
  const mode = (point?.mode || '').toLowerCase();
  const isWeighing = mode.includes('weighing') ||
    (rowIndex !== undefined && weighingCount > 0 && rowIndex < weighingCount) ||
    (!mode && rowData.length === 7 && rowIndex !== undefined && (weighingCount === 0 || rowIndex < weighingCount));

  const isRepeatability = mode.includes('repeatability') ||
    (rowIndex !== undefined && repeatabilityCount > 0 && rowIndex >= weighingCount && rowIndex < weighingCount + repeatabilityCount);

  if (isWeighing) {
    // Weighing Process has 3 readings (cols 2, 3, 4)
    const rawReadings = (rowData.slice(2, 5) || [])
      .filter((val) => val !== undefined && val !== null && String(val).trim() !== '' && !isNaN(parseFloat(val)))
      .map((val) => parseFloat(val));

    const rawAvg = rawReadings.length
      ? (rawReadings.reduce((sum, val) => sum + val, 0) / rawReadings.length)
      : null;

    result.weighingAverage = rawAvg !== null
      ? formatValueByLc(rawAvg, defaultDecimalPlaces, lcUuc)
      : '';
    result.average = result.weighingAverage;

    const nominalRaw = rowData[1];
    const hasNominal = nominalRaw !== undefined && nominalRaw !== null && String(nominalRaw).trim() !== '' && !isNaN(parseFloat(nominalRaw));
    const nominal = hasNominal ? parseFloat(nominalRaw) : null;

    const isStdUuc = (
      instrument?.error === 'stduuc' ||
      instrument?.error_type === 'stduuc' ||
      instrument?.custom_error === 'stduuc' ||
      instrument?.error_formula === 'stduuc'
    );

    if (result.weighingAverage !== '' && nominal !== null) {
      const avgNum = parseFloat(result.weighingAverage);
      const diff = isStdUuc ? (nominal - avgNum) : (avgNum - nominal);
      result.weighingError = diff.toFixed(errorDecimalPlaces);
      result.error = result.weighingError;
    } else {
      result.weighingError = '';
      result.error = '';
    }
  } else if (isRepeatability) {
    // Repeatability has 5 readings (cols 1..5)
    const rawReadings = (rowData.slice(1, 6) || [])
      .filter((val) => val !== undefined && val !== null && String(val).trim() !== '' && !isNaN(parseFloat(val)))
      .map((val) => parseFloat(val));

    const rawAvg = rawReadings.length
      ? (rawReadings.reduce((sum, val) => sum + val, 0) / rawReadings.length)
      : null;

    result.repeatabilityAverage = rawAvg !== null
      ? formatValueByLc(rawAvg, defaultDecimalPlaces, lcUuc)
      : '';
    result.average = result.repeatabilityAverage;
  } else {
    // Eccentricity has 10 readings (cols 1..10)
    const rawReadings = (rowData.slice(1, 11) || [])
      .filter((val) => val !== undefined && val !== null && String(val).trim() !== '' && !isNaN(parseFloat(val)))
      .map((val) => parseFloat(val));

    if (rawReadings.length > 0) {
      const maxVal = Math.max(...rawReadings);
      const minVal = Math.min(...rawReadings);
      // Matches PHP's lc = lc + 1 for eccentricity
      result.eccentricity = ((maxVal - minVal) / 2).toFixed(defaultDecimalPlaces + 1);
    } else {
      result.eccentricity = '';
    }
  }

  return result;
};

export default ObservationWBN;