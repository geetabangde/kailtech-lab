const ObservationCustom = ({
  selectedTableData,
  instrument,
  tableInputValues = {},
  handleInputChange,
  handleObservationBlur,
  observationErrors = {},
  observations = [],
}) => {
  if (!selectedTableData || selectedTableData.id !== 'observationcustom') return null;

  // ============================================================================
  // LAYOUT CALCULATION - Determines which columns are visible and their order
  // ============================================================================
  const getCustomLayoutIndices = () => {
    if (!instrument) return null;
    let colIdx = 1;

    // Parameter column
    let hasParameter = instrument.parametertoshow === 'Yes';
    let paramIdx = hasParameter ? colIdx++ : -1;

    // Specification column
    let hasSpecification = instrument.specificationtoshow === 'Yes';
    let specIdx = hasSpecification ? colIdx++ : -1;

    let masterdone = false;
    let uucdone = false;

    const masterCount = parseInt(instrument.master || 1);
    const uucCount = parseInt(instrument.uuc || 1);

    // Setpoint column
    let hasSetpoint = instrument.setpointtoshow === 'Yes';
    let setpointIdx = -1;

    if (hasSetpoint) {
      setpointIdx = colIdx++;
      if (instrument.setpoint === 'Master') {
        masterdone = true;
      } else if (instrument.setpoint === 'UUC') {
        uucdone = true;
      }
    }

    let masterObsIndices = [];
    let avgMasterIdx = -1;
    let uucObsIndices = [];
    let avgUucIdx = -1;

    const pushMaster = () => {
      for (let i = 0; i < masterCount; i++) masterObsIndices.push(colIdx++);
      if (masterCount > 1) avgMasterIdx = colIdx++;
      masterdone = true;
    };

    const pushUuc = () => {
      for (let i = 0; i < uucCount; i++) uucObsIndices.push(colIdx++);
      if (uucCount > 1) avgUucIdx = colIdx++;
      uucdone = true;
    };

    // In PHP: if master <= uuc, Master columns come first.
    // Otherwise, UUC columns come first.
    let order = 'master-first';
    if (instrument.mastertoshow === 'Yes' && !masterdone && masterCount <= uucCount) {
      pushMaster();
      if (instrument.uuctoshow === 'Yes' && !uucdone) pushUuc();
      order = 'master-first';
    } else {
      if (instrument.uuctoshow === 'Yes' && !uucdone) pushUuc();
      if (instrument.mastertoshow === 'Yes' && !masterdone) pushMaster();
      order = 'uuc-first';
    }

    // Error column
    let hasError = instrument.errortoshow === 'Yes';
    let errorIdx = hasError ? colIdx++ : -1;

    // Remark column
    let hasRemark = instrument.remarktoshow === 'Yes';
    let remarkIdx = hasRemark ? colIdx++ : -1;

    return {
      paramIdx,
      specIdx,
      setpointIdx,
      masterObsIndices,
      avgMasterIdx,
      uucObsIndices,
      avgUucIdx,
      errorIdx,
      remarkIdx,
      totalCols: colIdx,
      masterCount,
      uucCount,
      order,
    };
  };

  const layout = getCustomLayoutIndices();
  if (!layout) return null;

  // Returns the first candidate that is neither undefined, null nor an empty string
  const firstFilled = (...candidates) => {
    for (const c of candidates) {
      if (c !== undefined && c !== null && String(c) !== '') return c;
    }
    return '';
  };

  // Current value of a cell: live edit first, then the stored row value
  const cellValue = (row, rowIndex, colIdx) => {
    const v = tableInputValues[`${rowIndex}-${colIdx}`];
    return (v !== undefined && v !== null && v !== '') ? v : (row?.[colIdx] ?? '');
  };

  // Mirrors the PHP averageavg() / substractminus() onkeyup pair: whenever an
  // observation changes, push the new Average(s) and Error into the table straight away.
  const handleObsChange = (row, rowIndex, colIdx, value, point) => {
    if (handleInputChange) handleInputChange(rowIndex, colIdx, value);

    const liveRow = row.map((cell, idx) => (idx === colIdx ? value : cellValue(row, rowIndex, idx)));
    const calc = calculateCustomValues(liveRow, instrument, point) || {};

    if (!handleInputChange) return;
    if (layout.avgMasterIdx !== -1 && calc.averagemaster !== undefined) {
      handleInputChange(rowIndex, layout.avgMasterIdx, calc.averagemaster);
    }
    if (layout.avgUucIdx !== -1 && calc.averageuuc !== undefined) {
      handleInputChange(rowIndex, layout.avgUucIdx, calc.averageuuc);
    }
    if (layout.errorIdx !== -1 && calc.error !== undefined) {
      handleInputChange(rowIndex, layout.errorIdx, calc.error);
    }
  };

  // On blur, persist the edited cell; CalibrateStep3 saves the recalculated
  // Average / Error alongside it for master, uuc and setpoint columns
  const handleObsBlur = (rowIndex, colIdx, value) => {
    if (handleObservationBlur) handleObservationBlur(rowIndex, colIdx, value);
  };

  // In PHP: $rowspan = (uuc > 1 || master > 1) ? 2 : 1
  const isTwoHeaderRows = (layout.masterCount > 1 || layout.uucCount > 1) &&
    (layout.masterObsIndices.length > 0 || layout.uucObsIndices.length > 0);
  const mainRowSpan = isTwoHeaderRows ? 2 : 1;

  // ============================================================================
  // RENDER CUSTOM OBSERVATION TABLE
  // ============================================================================
  if (!selectedTableData.staticRows || selectedTableData.staticRows.length === 0) {
    return (
      <div className="p-4 bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded">
        <p className="text-yellow-800 dark:text-yellow-200">No calibration points available for Custom Observation</p>
      </div>
    );
  }

  const renderMasterMainHeader = () => {
    if (layout.masterObsIndices.length === 0) return null;
    const count = layout.masterObsIndices.length;
    const hasAvg = layout.avgMasterIdx !== -1;
    const colSpan = count + (hasAvg ? 1 : 0);
    const rowSpan = count > 1 ? 1 : mainRowSpan;
    return (
      <th
        colSpan={colSpan}
        rowSpan={rowSpan}
        className="px-3 py-2 text-center text-xs font-medium text-gray-700 dark:text-gray-200 uppercase border-r border-gray-300 dark:border-gray-600"
      >
        {instrument.masterheading || 'Master Observations'}
      </th>
    );
  };

  const renderUucMainHeader = () => {
    if (layout.uucObsIndices.length === 0) return null;
    const count = layout.uucObsIndices.length;
    const hasAvg = layout.avgUucIdx !== -1;
    const colSpan = count + (hasAvg ? 1 : 0);
    const rowSpan = count > 1 ? 1 : mainRowSpan;
    return (
      <th
        colSpan={colSpan}
        rowSpan={rowSpan}
        className="px-3 py-2 text-center text-xs font-medium text-gray-700 dark:text-gray-200 uppercase border-r border-gray-300 dark:border-gray-600"
      >
        {instrument.uucheading || 'UUC Observations'}
      </th>
    );
  };

  const renderMasterSubHeaders = () => {
    if (layout.masterObsIndices.length <= 1) return null;
    return (
      <>
        {layout.masterObsIndices.map((idx, i) => (
          <th
            key={`master-sub-${i}`}
            className="px-3 py-1 text-center text-xs font-medium text-gray-600 dark:text-gray-300 border-r border-gray-300 dark:border-gray-600"
          >
            Obs {i + 1}
          </th>
        ))}
        {layout.avgMasterIdx !== -1 && (
          <th className="px-3 py-1 text-center text-xs font-medium text-gray-600 dark:text-gray-300 border-r border-gray-300 dark:border-gray-600">
            Average On Master
          </th>
        )}
      </>
    );
  };

  const renderUucSubHeaders = () => {
    if (layout.uucObsIndices.length <= 1) return null;
    return (
      <>
        {layout.uucObsIndices.map((idx, i) => (
          <th
            key={`uuc-sub-${i}`}
            className="px-3 py-1 text-center text-xs font-medium text-gray-600 dark:text-gray-300 border-r border-gray-300 dark:border-gray-600"
          >
            Obs {i + 1}
          </th>
        ))}
        {layout.avgUucIdx !== -1 && (
          <th className="px-3 py-1 text-center text-xs font-medium text-gray-600 dark:text-gray-300 border-r border-gray-300 dark:border-gray-600">
            Average On UUC
          </th>
        )}
      </>
    );
  };

  const renderMasterCells = (row, rowIndex, point, derived = {}) => (
    <>
      {layout.masterObsIndices.map((colIdx, obsIdx) => {
        const cellKey = `${rowIndex}-${colIdx}`;
        const hasError = !!observationErrors[cellKey];
        return (
          <td key={`master-${obsIdx}`} className="px-1.5 py-2 text-sm border-r border-gray-200 dark:border-gray-600 dark:text-white">
            <div className="flex items-center gap-1">
              <input
                type="number"
                step="any"
                id={`obs-cell-${cellKey}`}
                data-cell-key={cellKey}
                className={`w-full min-w-[64px] px-2 py-1 border rounded bg-white dark:bg-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 ${hasError ? 'border-red-500 focus:ring-red-500 ring-1 ring-red-400' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                  }`}
                value={tableInputValues[cellKey] ?? row[colIdx] ?? ''}
                onChange={(e) => handleObsChange(row, rowIndex, colIdx, e.target.value, point)}
                onBlur={(e) => handleObsBlur(rowIndex, colIdx, e.target.value)}
              />
              {point?.masterunit && isNaN(point.masterunit) && <span className="text-xs text-gray-500 shrink-0">{point.masterunit}</span>}
            </div>
            {hasError && (
              <p className="text-xs text-red-500 mt-0.5">{observationErrors[cellKey]}</p>
            )}
          </td>
        );
      })}

      {layout.avgMasterIdx !== -1 && (
        <td className="px-1.5 py-2 text-sm border-r border-gray-200 dark:border-gray-600 dark:text-white bg-gray-50 dark:bg-gray-700">
          <input
            type="text"
            id={`obs-cell-${rowIndex}-${layout.avgMasterIdx}`}
            data-cell-key={`${rowIndex}-${layout.avgMasterIdx}`}
            className="w-full min-w-[88px] px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white cursor-not-allowed"
            value={firstFilled(
              tableInputValues[`${rowIndex}-${layout.avgMasterIdx}`],
              row[layout.avgMasterIdx],
              derived.averagemaster
            )}
            readOnly
          />
        </td>
      )}
    </>
  );

  const renderUucCells = (row, rowIndex, point, derived = {}) => (
    <>
      {layout.uucObsIndices.map((colIdx, obsIdx) => {
        const cellKey = `${rowIndex}-${colIdx}`;
        const hasError = !!observationErrors[cellKey];
        return (
          <td key={`uuc-${obsIdx}`} className="px-1.5 py-2 text-sm border-r border-gray-200 dark:border-gray-600 dark:text-white">
            <div className="flex items-center gap-1">
              <input
                type="number"
                step="any"
                id={`obs-cell-${cellKey}`}
                data-cell-key={cellKey}
                className={`w-full min-w-[64px] px-2 py-1 border rounded bg-white dark:bg-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 ${hasError ? 'border-red-500 focus:ring-red-500 ring-1 ring-red-400' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                  }`}
                value={tableInputValues[cellKey] ?? row[colIdx] ?? ''}
                onChange={(e) => handleObsChange(row, rowIndex, colIdx, e.target.value, point)}
                onBlur={(e) => handleObsBlur(rowIndex, colIdx, e.target.value)}
              />
              {point?.unit && isNaN(point.unit) && <span className="text-xs text-gray-500 shrink-0">{point.unit}</span>}
            </div>
            {hasError && (
              <p className="text-xs text-red-500 mt-0.5">{observationErrors[cellKey]}</p>
            )}
          </td>
        );
      })}

      {layout.avgUucIdx !== -1 && (
        <td className="px-1.5 py-2 text-sm border-r border-gray-200 dark:border-gray-600 dark:text-white bg-gray-50 dark:bg-gray-700">
          <input
            type="text"
            id={`obs-cell-${rowIndex}-${layout.avgUucIdx}`}
            data-cell-key={`${rowIndex}-${layout.avgUucIdx}`}
            className="w-full min-w-[88px] px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white cursor-not-allowed"
            value={firstFilled(
              tableInputValues[`${rowIndex}-${layout.avgUucIdx}`],
              row[layout.avgUucIdx],
              derived.averageuuc
            )}
            readOnly
          />
        </td>
      )}
    </>
  );

  return (
    <div className="mb-8 overflow-x-auto border border-gray-200 dark:border-gray-600">
      <table className="w-full min-w-max text-sm border-collapse">
        <thead>
          <tr className="bg-gray-100 dark:bg-gray-700 border-b border-gray-300 dark:border-gray-600">
            <th rowSpan={mainRowSpan} className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase border-r border-gray-300 dark:border-gray-600 min-w-12">
              Sr. No.
            </th>

            {layout.paramIdx !== -1 && (
              <th rowSpan={mainRowSpan} className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase border-r border-gray-300 dark:border-gray-600 min-w-24">
                {instrument.parameterheading || 'Parameter'}
              </th>
            )}

            {layout.specIdx !== -1 && (
              <th rowSpan={mainRowSpan} className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase border-r border-gray-300 dark:border-gray-600 min-w-24">
                {instrument.specificationheading || 'Specification'}
              </th>
            )}

            {layout.setpointIdx !== -1 && (
              <th rowSpan={mainRowSpan} className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase border-r border-gray-300 dark:border-gray-600 min-w-20">
                {instrument.setpoint === 'Master'
                  ? instrument.masterheading || 'Master'
                  : instrument.setpoint === 'UUC'
                    ? instrument.uucheading || 'UUC'
                    : instrument.setpointheading || 'Set Point'}
              </th>
            )}

            {/* Observation Headers rendered in dynamic order */}
            {layout.order === 'master-first' ? (
              <>
                {renderMasterMainHeader()}
                {renderUucMainHeader()}
              </>
            ) : (
              <>
                {renderUucMainHeader()}
                {renderMasterMainHeader()}
              </>
            )}

            {layout.errorIdx !== -1 && (
              <th rowSpan={mainRowSpan} className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase border-r border-gray-300 dark:border-gray-600 min-w-20">
                {instrument.errorheading || 'Error'}
              </th>
            )}

            {layout.remarkIdx !== -1 && (
              <th rowSpan={mainRowSpan} className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-200 uppercase min-w-20">
                {instrument.remarkheading || 'Remark'}
              </th>
            )}
          </tr>

          {/* Sub-headers row for observations (only when uuc > 1 or master > 1) */}
          {isTwoHeaderRows && (
            <tr className="bg-gray-50 dark:bg-gray-600 border-b border-gray-300 dark:border-gray-600">
              {layout.order === 'master-first' ? (
                <>
                  {renderMasterSubHeaders()}
                  {renderUucSubHeaders()}
                </>
              ) : (
                <>
                  {renderUucSubHeaders()}
                  {renderMasterSubHeaders()}
                </>
              )}
            </tr>
          )}
        </thead>

        <tbody className="bg-white dark:bg-gray-800">
          {selectedTableData.staticRows.map((row, rowIndex) => {
            const point = observations?.[rowIndex] || {};
            // Recompute from the live cell values so the read-only columns are never
            // left blank when the stored value is missing
            const liveRow = row.map((cell, idx) => {
              const v = tableInputValues[`${rowIndex}-${idx}`];
              return (v !== undefined && v !== null && v !== '') ? v : (cell ?? '');
            });
            const derived = calculateCustomValues(liveRow, instrument, point) || {};
            return (
              <tr key={rowIndex} className="border-b border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700">
                {/* Sr. No. */}
                <td className="px-1.5 py-2 text-sm border-r border-gray-200 dark:border-gray-600 dark:text-white bg-gray-50 dark:bg-gray-700 text-center font-medium">
                  {rowIndex + 1}
                </td>

                {/* Parameter */}
                {layout.paramIdx !== -1 && (() => {
                  const cellKey = `${rowIndex}-${layout.paramIdx}`;
                  const hasError = !!observationErrors[cellKey];
                  return (
                    <td className="px-1.5 py-2 text-sm border-r border-gray-200 dark:border-gray-600 dark:text-white">
                      <input
                        type="text"
                        id={`obs-cell-${cellKey}`}
                        data-cell-key={cellKey}
                        className={`w-full min-w-[64px] px-2 py-1 border rounded bg-white dark:bg-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 ${hasError ? 'border-red-500 focus:ring-red-500 ring-1 ring-red-400' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                          }`}
                        value={tableInputValues[cellKey] ?? row[layout.paramIdx] ?? ''}
                        onChange={(e) => handleInputChange && handleInputChange(rowIndex, layout.paramIdx, e.target.value, 'text')}
                        onBlur={(e) => handleObservationBlur && handleObservationBlur(rowIndex, layout.paramIdx, e.target.value)}
                      />
                      {hasError && (
                        <p className="text-xs text-red-500 mt-0.5">{observationErrors[cellKey]}</p>
                      )}
                    </td>
                  );
                })()}

                {/* Specification */}
                {layout.specIdx !== -1 && (() => {
                  const cellKey = `${rowIndex}-${layout.specIdx}`;
                  const hasError = !!observationErrors[cellKey];
                  return (
                    <td className="px-1.5 py-2 text-sm border-r border-gray-200 dark:border-gray-600 dark:text-white">
                      <input
                        type="text"
                        id={`obs-cell-${cellKey}`}
                        data-cell-key={cellKey}
                        className={`w-full min-w-[64px] px-2 py-1 border rounded bg-white dark:bg-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 ${hasError ? 'border-red-500 focus:ring-red-500 ring-1 ring-red-400' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                          }`}
                        value={tableInputValues[cellKey] ?? row[layout.specIdx] ?? ''}
                        onChange={(e) => handleInputChange && handleInputChange(rowIndex, layout.specIdx, e.target.value, 'text')}
                        onBlur={(e) => handleObservationBlur && handleObservationBlur(rowIndex, layout.specIdx, e.target.value)}
                      />
                      {hasError && (
                        <p className="text-xs text-red-500 mt-0.5">{observationErrors[cellKey]}</p>
                      )}
                    </td>
                  );
                })()}

                {/* Setpoint */}
                {layout.setpointIdx !== -1 && (() => {
                  const cellKey = `${rowIndex}-${layout.setpointIdx}`;
                  const isEditable = instrument?.setpoint === 'UUC';
                  const hasError = !!observationErrors[cellKey];
                  return (
                    <td className={`px-1.5 py-2 text-sm border-r border-gray-200 dark:border-gray-600 dark:text-white ${isEditable ? '' : 'bg-gray-50 dark:bg-gray-700'}`}>
                      <div className="flex items-center gap-1">
                        <input
                          type={isEditable ? "number" : "text"}
                          step="any"
                          id={`obs-cell-${cellKey}`}
                          data-cell-key={cellKey}
                          className={`w-full min-w-[88px] px-2 py-1 border rounded ${isEditable
                              ? `bg-white dark:bg-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 ${hasError ? 'border-red-500 focus:ring-red-500 ring-1 ring-red-400' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                              }`
                              : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white cursor-not-allowed'
                            }`}
                          value={tableInputValues[cellKey] ?? row[layout.setpointIdx] ?? ''}
                          readOnly={!isEditable}
                          onChange={(e) => isEditable && handleObsChange(row, rowIndex, layout.setpointIdx, e.target.value, point)}
                          onBlur={(e) => isEditable && handleObsBlur(rowIndex, layout.setpointIdx, e.target.value)}
                        />
                        {point?.unit && isNaN(point.unit) && <span className="text-xs text-gray-500 shrink-0">{point.unit}</span>}
                      </div>
                      {hasError && isEditable && (
                        <p className="text-xs text-red-500 mt-0.5">{observationErrors[cellKey]}</p>
                      )}
                    </td>
                  );
                })()}

                {/* Observations in dynamic order */}
                {layout.order === 'master-first' ? (
                  <>
                    {renderMasterCells(row, rowIndex, point, derived)}
                    {renderUucCells(row, rowIndex, point, derived)}
                  </>
                ) : (
                  <>
                    {renderUucCells(row, rowIndex, point, derived)}
                    {renderMasterCells(row, rowIndex, point, derived)}
                  </>
                )}

                {/* Error */}
                {layout.errorIdx !== -1 && (
                  <td className="px-1.5 py-2 text-sm border-r border-gray-200 dark:border-gray-600 dark:text-white bg-gray-50 dark:bg-gray-700">
                    <input
                      type="text"
                      id={`obs-cell-${rowIndex}-${layout.errorIdx}`}
                      data-cell-key={`${rowIndex}-${layout.errorIdx}`}
                      className="w-full min-w-[88px] px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white cursor-not-allowed"
                      value={firstFilled(
                        tableInputValues[`${rowIndex}-${layout.errorIdx}`],
                        row[layout.errorIdx],
                        derived.error
                      )}
                      readOnly
                    />
                  </td>
                )}

                {/* Remark */}
                {layout.remarkIdx !== -1 && (() => {
                  const cellKey = `${rowIndex}-${layout.remarkIdx}`;
                  const hasError = !!observationErrors[cellKey];
                  return (
                    <td className="px-1.5 py-2 text-sm dark:text-white">
                      <input
                        type="text"
                        id={`obs-cell-${cellKey}`}
                        data-cell-key={cellKey}
                        className={`w-full min-w-[64px] px-2 py-1 border rounded bg-white dark:bg-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 ${hasError ? 'border-red-500 focus:ring-red-500 ring-1 ring-red-400' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                          }`}
                        value={tableInputValues[cellKey] ?? row[layout.remarkIdx] ?? ''}
                        onChange={(e) => handleInputChange && handleInputChange(rowIndex, layout.remarkIdx, e.target.value, 'text')}
                        onBlur={(e) => handleObservationBlur && handleObservationBlur(rowIndex, layout.remarkIdx, e.target.value)}
                      />
                      {hasError && (
                        <p className="text-xs text-red-500 mt-0.5">{observationErrors[cellKey]}</p>
                      )}
                    </td>
                  );
                })()}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

// Exported calculation function for use in CalibrateStep3
export const calculateCustomValues = (rowData, instrument, point = null) => {
  const result = {};

  const getDecimals = (lc) => {
    if (!lc || lc === 'NA' || lc === 'No' || isNaN(parseFloat(lc))) return null;
    const parts = lc.toString().split('.');
    return parts.length > 1 ? parts[1].length : 0;
  };

  const pointLc = point?.matrix?.leastcount ?? point?.leastcount ?? instrument?.leastcount;
  const pointMlc = point?.master_matrix?.leastcount ?? point?.masterleastcount ?? instrument?.masterleastcount;

  const masterDecimalsParsed = getDecimals(pointMlc);
  const uucDecimalsParsed = getDecimals(pointLc);

  let errorDecimals = 0;
  if (masterDecimalsParsed !== null && uucDecimalsParsed !== null) {
    errorDecimals = Math.max(masterDecimalsParsed, uucDecimalsParsed);
  } else if (masterDecimalsParsed !== null) {
    errorDecimals = masterDecimalsParsed;
  } else if (uucDecimalsParsed !== null) {
    errorDecimals = uucDecimalsParsed;
  } else {
    // If both are NA / No, check if any input values have decimals
    const getValDecimals = (val) => {
      if (val === undefined || val === null) return 0;
      const str = val.toString();
      const p = str.split('.');
      return p.length > 1 ? p[1].length : 0;
    };
    errorDecimals = Math.max(
      ...(Array.isArray(rowData) ? rowData.map(getValDecimals).filter(n => !isNaN(n)) : []),
      0
    );
  }

  const masterDecimals = masterDecimalsParsed ?? 0;
  const uucDecimals = uucDecimalsParsed ?? 0;

  const getCustomLayoutIndices = (inst) => {
    if (!inst) return null;
    let colIdx = 1;

    let hasParameter = inst.parametertoshow === 'Yes';
    let paramIdx = hasParameter ? colIdx++ : -1;

    let hasSpecification = inst.specificationtoshow === 'Yes';
    let specIdx = hasSpecification ? colIdx++ : -1;

    let masterdone = false;
    let uucdone = false;

    const masterCount = parseInt(inst.master || 1);
    const uucCount = parseInt(inst.uuc || 1);

    let hasSetpoint = inst.setpointtoshow === 'Yes';
    let setpointIdx = -1;

    if (hasSetpoint) {
      setpointIdx = colIdx++;
      if (inst.setpoint === 'Master') {
        masterdone = true;
      } else if (inst.setpoint === 'UUC') {
        uucdone = true;
      }
    }

    let masterObsIndices = [];
    let avgMasterIdx = -1;
    let uucObsIndices = [];
    let avgUucIdx = -1;

    const pushMaster = () => {
      for (let i = 0; i < masterCount; i++) masterObsIndices.push(colIdx++);
      if (masterCount > 1) avgMasterIdx = colIdx++;
      masterdone = true;
    };

    const pushUuc = () => {
      for (let i = 0; i < uucCount; i++) uucObsIndices.push(colIdx++);
      if (uucCount > 1) avgUucIdx = colIdx++;
      uucdone = true;
    };

    if (inst.mastertoshow === 'Yes' && !masterdone && masterCount <= uucCount) {
      pushMaster();
      if (inst.uuctoshow === 'Yes' && !uucdone) pushUuc();
    } else {
      if (inst.uuctoshow === 'Yes' && !uucdone) pushUuc();
      if (inst.mastertoshow === 'Yes' && !masterdone) pushMaster();
    }

    let hasError = inst.errortoshow === 'Yes';
    let errorIdx = hasError ? colIdx++ : -1;

    let hasRemark = inst.remarktoshow === 'Yes';
    let remarkIdx = hasRemark ? colIdx++ : -1;

    return {
      paramIdx,
      specIdx,
      setpointIdx,
      masterObsIndices,
      avgMasterIdx,
      uucObsIndices,
      avgUucIdx,
      errorIdx,
      remarkIdx,
      masterCount,
      uucCount,
    };
  };

  const layout = getCustomLayoutIndices(instrument);
  if (layout) {
    if (layout.masterObsIndices.length > 0) {
      const validMasterVals = layout.masterObsIndices
        .map(idx => (rowData[idx] !== undefined && rowData[idx] !== null && rowData[idx].toString().trim() !== '') ? parseFloat(rowData[idx]) : NaN)
        .filter(v => !isNaN(v));
      if (validMasterVals.length > 0 && validMasterVals.length === layout.masterObsIndices.length) {
        result.averagemaster = (validMasterVals.reduce((a, b) => a + b, 0) / validMasterVals.length).toFixed(masterDecimals);
      } else {
        result.averagemaster = '';
      }
    }
    if (layout.uucObsIndices.length > 0) {
      const validUucVals = layout.uucObsIndices
        .map(idx => (rowData[idx] !== undefined && rowData[idx] !== null && rowData[idx].toString().trim() !== '') ? parseFloat(rowData[idx]) : NaN)
        .filter(v => !isNaN(v));
      if (validUucVals.length > 0 && validUucVals.length === layout.uucObsIndices.length) {
        result.averageuuc = (validUucVals.reduce((a, b) => a + b, 0) / validUucVals.length).toFixed(uucDecimals);
      } else {
        result.averageuuc = '';
      }
    }

    let masterVal = null;
    if (result.averagemaster !== '' && result.averagemaster !== undefined) {
      masterVal = parseFloat(result.averagemaster);
    } else if (layout.masterObsIndices.length === 1) {
      const raw = rowData[layout.masterObsIndices[0]];
      if (raw !== undefined && raw !== null && raw.toString().trim() !== '') {
        const p = parseFloat(raw);
        if (!isNaN(p)) masterVal = p;
      }
    } else if (layout.setpointIdx !== -1 && instrument?.setpoint === "Master") {
      const raw = rowData[layout.setpointIdx];
      if (raw !== undefined && raw !== null && raw.toString().trim() !== '') {
        const p = parseFloat(raw);
        if (!isNaN(p)) masterVal = p;
      }
    }

    let uucVal = null;
    if (result.averageuuc !== '' && result.averageuuc !== undefined) {
      uucVal = parseFloat(result.averageuuc);
    } else if (layout.uucObsIndices.length === 1) {
      const raw = rowData[layout.uucObsIndices[0]];
      if (raw !== undefined && raw !== null && raw.toString().trim() !== '') {
        const p = parseFloat(raw);
        if (!isNaN(p)) uucVal = p;
      }
    } else if (layout.setpointIdx !== -1 && instrument?.setpoint === "UUC") {
      const raw = rowData[layout.setpointIdx];
      if (raw !== undefined && raw !== null && raw.toString().trim() !== '') {
        const p = parseFloat(raw);
        if (!isNaN(p)) uucVal = p;
      }
    }

    if (masterVal !== null && uucVal !== null && !isNaN(masterVal) && !isNaN(uucVal)) {
      const isStdUuc = (instrument?.error === 'stduuc' || instrument?.error_type === 'stduuc' || instrument?.custom_error === 'stduuc');
      const diff = isStdUuc ? (masterVal - uucVal) : (uucVal - masterVal);
      result.error = diff.toFixed(errorDecimals);
    } else {
      result.error = '';
    }
  }
  return result;
};

export default ObservationCustom;