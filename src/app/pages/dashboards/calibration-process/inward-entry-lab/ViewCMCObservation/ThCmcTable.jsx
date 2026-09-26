import { formatUncertaintyValue } from "./viewCmcUtils";

export const ThCmcTable = ({ data }) => (
  <div className="overflow-x-auto">
    <table className="w-full border-collapse text-[12px] text-gray-700 min-w-max">
      <thead>
        <tr className="bg-gray-100 text-center">
          <th colSpan="11" className="border border-gray-300 px-1 py-2 bg-gray-200 font-semibold text-xs">
            Type A Factor
          </th>
          <th colSpan="6" className="border border-gray-300 px-1 py-2 bg-gray-200 font-semibold text-xs">
            Type B Factor
          </th>
          <th colSpan="6" className="border border-gray-300 px-1 py-2 bg-gray-200 font-semibold text-xs">
            Uncertainty Measurement
          </th>
        </tr>
        <tr className="bg-gray-200 text-center text-[12px] font-medium">
          <th className="border border-gray-300 px-1 py-2">Sr no</th>
          <th className="border border-gray-300 px-1 py-2">1</th>
          <th className="border border-gray-300 px-1 py-2">2</th>
          <th className="border border-gray-300 px-1 py-2">3</th>
          <th className="border border-gray-300 px-1 py-2">4</th>
          <th className="border border-gray-300 px-1 py-2">5</th>
          <th className="border border-gray-300 px-1 py-2">Unit</th>
          <th className="border border-gray-300 px-1 py-2">Calibration point</th>
          <th className="border border-gray-300 px-1 py-2">Average</th>
          <th className="border border-gray-300 px-1 py-2">Std Deviation</th>
          <th className="border border-gray-300 px-1 py-2">Type A</th>
          <th className="border border-gray-300 px-1 py-2">Uncertainty of master</th>
          <th className="border border-gray-300 px-1 py-2">Accuracy Of Calibrator in Value</th>
          <th className="border border-gray-300 px-1 py-2">Stability Of Bath</th>
          <th className="border border-gray-300 px-1 py-2">Uniformity Of Bath</th>
          <th className="border border-gray-300 px-1 py-2">Drift Of Master</th>
          <th className="border border-gray-300 px-1 py-2">Least Count of UUC</th>
          <th className="border border-gray-300 px-1 py-2">Combined Uncertainty</th>
          <th className="border border-gray-300 px-1 py-2">Degree of Freedom</th>
          <th className="border border-gray-300 px-1 py-2">Coverage Factor (k)</th>
          <th className="border border-gray-300 px-1 py-2">Expanded Uncertainty in Value</th>
          <th className="border border-gray-300 px-1 py-2">CMC Taken</th>
          <th className="border border-gray-300 px-1 py-2">CMC Scope</th>
        </tr>
      </thead>
      <tbody>
        {data.map((row, i) => (
          <tr key={i} className="hover:bg-gray-50 text-center text-[12px]">
            <td className="border border-gray-300 px-1 py-2">{row.srNo ?? (i + 1)}</td>
            {row.values?.map((v, idx) => (
              <td key={idx} className="border border-gray-300 px-1 py-2">
                {v !== undefined && v !== null && v !== "" ? v : "-"}
              </td>
            ))}
            <td className="border border-gray-300 px-1 py-2">{row.unit}</td>
            <td className="border border-gray-300 px-1 py-2 font-medium">{row.calibrationPoint}</td>
            <td className="border border-gray-300 px-1 py-2">{typeof row.average === 'number' ? formatUncertaintyValue(row.average, 6) : row.average}</td>
            <td className="border border-gray-300 px-1 py-2">{typeof row.stdDeviation === 'number' ? formatUncertaintyValue(row.stdDeviation, 6) : row.stdDeviation}</td>
            <td className="border border-gray-300 px-1 py-2">{typeof row.typeA === 'number' ? formatUncertaintyValue(row.typeA, 6) : row.typeA}</td>
            <td className="border border-gray-300 px-1 py-2">{typeof row.masterUnc === 'number' ? formatUncertaintyValue(row.masterUnc, 6) : row.masterUnc}</td>
            <td className="border border-gray-300 px-1 py-2">{typeof row.accuracy === 'number' ? formatUncertaintyValue(row.accuracy, 6) : row.accuracy}</td>
            <td className="border border-gray-300 px-1 py-2">{typeof row.stability === 'number' ? formatUncertaintyValue(row.stability, 6) : row.stability}</td>
            <td className="border border-gray-300 px-1 py-2">{typeof row.uniformity === 'number' ? formatUncertaintyValue(row.uniformity, 6) : row.uniformity}</td>
            <td className="border border-gray-300 px-1 py-2">{typeof row.drift === 'number' ? formatUncertaintyValue(row.drift, 6) : row.drift}</td>
            <td className="border border-gray-300 px-1 py-2">{row.leastCount}</td>
            <td className="border border-gray-300 px-1 py-2">{typeof row.combinedUnc === 'number' ? formatUncertaintyValue(row.combinedUnc, 6) : row.combinedUnc}</td>
            <td className="border border-gray-300 px-1 py-2">{row.dof === '-' ? '-' : (typeof row.dof === 'number' ? (row.dof > 1000 ? Math.round(row.dof) : formatUncertaintyValue(row.dof, 2)) : row.dof)}</td>
            <td className="border border-gray-300 px-1 py-2">{typeof row.coverageFactor === 'number' ? formatUncertaintyValue(row.coverageFactor, 2) : row.coverageFactor}</td>
            <td className="border border-gray-300 px-1 py-2">{typeof row.expandedUnc === 'number' ? formatUncertaintyValue(row.expandedUnc, 6) : row.expandedUnc}</td>
            <td className="border border-gray-300 px-1 py-2">{typeof row.cmc === 'number' ? formatUncertaintyValue(row.cmc, 6) : row.cmc}</td>
            <td className="border border-gray-300 px-1 py-2">{row.cmcScope}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default ThCmcTable;
