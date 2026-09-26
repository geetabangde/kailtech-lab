export const WbCmcTable = ({ data }) => {
  if (!data || data.length === 0) return null;
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[12px] text-gray-700 min-w-max">
        <thead>
          <tr className="bg-gray-100 font-semibold">
            <th colSpan="16" className="border border-gray-300 px-2 py-2 bg-gray-200 font-semibold text-center">
              Type A Factor
            </th>
            <th colSpan="3" className="border border-gray-300 px-2 py-2 bg-gray-200 font-semibold text-center">
              Type B Factor
            </th>
            <th colSpan="7" className="border border-gray-300 px-2 py-2 bg-gray-200 font-semibold text-center">
              Uncertainty Measurement
            </th>
          </tr>
          <tr className="bg-gray-200 text-center font-medium">
            <th className="border border-gray-300 px-2 py-2">Sr No</th>
            <th className="border border-gray-300 px-2 py-2">1</th>
            <th className="border border-gray-300 px-2 py-2">2</th>
            <th className="border border-gray-300 px-2 py-2">3</th>
            <th className="border border-gray-300 px-2 py-2">4</th>
            <th className="border border-gray-300 px-2 py-2">5</th>
            <th className="border border-gray-300 px-2 py-2">6</th>
            <th className="border border-gray-300 px-2 py-2">7</th>
            <th className="border border-gray-300 px-2 py-2">8</th>
            <th className="border border-gray-300 px-2 py-2">9</th>
            <th className="border border-gray-300 px-2 py-2">10</th>
            <th className="border border-gray-300 px-2 py-2">Unit</th>
            <th className="border border-gray-300 px-2 py-2">Calibration Point</th>
            <th className="border border-gray-300 px-2 py-2">Average (g)</th>
            <th className="border border-gray-300 px-2 py-2">Std Deviation</th>
            <th className="border border-gray-300 px-2 py-2">Type A</th>
            <th className="border border-gray-300 px-2 py-2">Drift in mass (g)</th>
            <th className="border border-gray-300 px-2 py-2">Eccentricity [2/3xD]/2sqrt(3) (g)</th>
            <th className="border border-gray-300 px-2 py-2">Uncertainty of Master in (g)</th>
            <th className="border border-gray-300 px-2 py-2">Least Count</th>
            <th className="border border-gray-300 px-2 py-2">Combined Uncertainty</th>
            <th className="border border-gray-300 px-2 py-2">Degree of Freedom</th>
            <th className="border border-gray-300 px-2 py-2">Coverage Factor (k)</th>
            <th className="border border-gray-300 px-2 py-2">Expanded Uncertainty (g)</th>
            <th className="border border-gray-300 px-2 py-2">CMC Scope</th>
            <th className="border border-gray-300 px-2 py-2">CMC Taken</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="hover:bg-gray-50 text-center">
              <td className="border border-gray-300 px-2 py-3 font-medium">{row.srNo}</td>
              {row.values.map((v, idx) => (
                <td key={idx} className="border border-gray-300 px-2 py-3">
                  {v !== undefined && v !== null && v !== '' ? v : '-'}
                </td>
              ))}
              <td className="border border-gray-300 px-2 py-3">{row.unit || '-'}</td>
              <td className="border border-gray-300 px-2 py-3">{row.calibrationPoint}</td>
              <td className="border border-gray-300 px-2 py-3">
                {typeof row.average === 'number' ? row.average.toFixed(6) : (row.average ?? '-')}
              </td>
              <td className="border border-gray-300 px-2 py-3">
                {typeof row.stdDeviation === 'number' ? row.stdDeviation.toFixed(8) : (row.stdDeviation ?? '-')}
              </td>
              <td className="border border-gray-300 px-2 py-3">
                {typeof row.typeA === 'number' ? row.typeA.toFixed(8) : (row.typeA ?? '-')}
              </td>
              <td className="border border-gray-300 px-2 py-3">
                {typeof row.drift === 'number' ? row.drift.toFixed(8) : (row.drift ?? '-')}
              </td>
              <td className="border border-gray-300 px-2 py-3">
                {typeof row.eccentricityfactor === 'number' ? row.eccentricityfactor.toFixed(8) : (row.eccentricityfactor ?? '-')}
              </td>
              <td className="border border-gray-300 px-2 py-3">
                {typeof row.uncertaintyOfMaster === 'number' ? row.uncertaintyOfMaster.toFixed(8) : (row.uncertaintyOfMaster ?? '-')}
              </td>
              <td className="border border-gray-300 px-2 py-3">
                {typeof row.leastCount === 'number' ? row.leastCount.toFixed(6) : (row.leastCount ?? '-')}
              </td>
              <td className="border border-gray-300 px-2 py-3">
                {typeof row.combinedUnc === 'number' ? row.combinedUnc.toFixed(8) : (row.combinedUnc ?? '-')}
              </td>
              <td className="border border-gray-300 px-2 py-3">
                {typeof row.dof === 'number' ? row.dof.toFixed(2) : (row.dof ?? '-')}
              </td>
              <td className="border border-gray-300 px-2 py-3">
                {typeof row.coverageFactor === 'number' ? row.coverageFactor.toFixed(2) : (row.coverageFactor ?? '2')}
              </td>
              <td className="border border-gray-300 px-2 py-3">
                {typeof row.expandedUnc === 'number' ? row.expandedUnc.toFixed(8) : (row.expandedUnc ?? '-')}
                {row.expandedUncmg !== undefined && row.expandedUncmg !== null && row.expandedUncmg !== '' && (
                  <span className="text-gray-500 block text-[10px]">
                    ({typeof row.expandedUncmg === 'number' ? row.expandedUncmg.toFixed(6) : row.expandedUncmg} mg)
                  </span>
                )}
              </td>
              <td className="border border-gray-300 px-2 py-3">
                {typeof row.cmcScope === 'number' ? row.cmcScope: (row.cmcScope ?? '-')}
              </td>
              <td className="border border-gray-300 px-2 py-3">
                {typeof row.cmc === 'number' ? row.cmc: (row.cmc ?? '-')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default WbCmcTable;
