import { formatUncertaintyValue } from "./viewCmcUtils";

export const GtmCmcTable = ({ data }) => (
  <div className="overflow-x-auto">
    <table className="w-full border-collapse text-[12px] text-gray-700 min-w-max">
      <thead>
        <tr className="bg-gray-100 text-center">
          <th colSpan="11" className="border border-gray-300 px-1 py-2 bg-gray-200 font-semibold text-xs">
            Type A Factor
          </th>
          <th colSpan="7" className="border border-gray-300 px-1 py-2 bg-gray-200 font-semibold text-xs">
            Type B Factor
          </th>
          <th colSpan="5" className="border border-gray-300 px-1 py-2 bg-gray-200 font-semibold text-xs">
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
          <th className="border border-gray-300 px-1 py-2">Uncertainty of master-1<br />Sensor in °C</th>
          <th className="border border-gray-300 px-1 py-2">Uncertainty of master-2<br />in (6.5DMM) in value</th>
          <th className="border border-gray-300 px-1 py-2">Uncertainty of master-2<br />in (°C)</th>
          <th className="border border-gray-300 px-1 py-2">Stability Of Bath</th>
          <th className="border border-gray-300 px-1 py-2">Uniformity Of Bath</th>
          <th className="border border-gray-300 px-1 py-2">Drift Of Master</th>
          <th className="border border-gray-300 px-1 py-2">Least Count of UUC</th>
          <th className="border border-gray-300 px-1 py-2">Combined Uncertainty</th>
          <th className="border border-gray-300 px-1 py-2">Degree of Freedom</th>
          <th className="border border-gray-300 px-1 py-2">Coverage Factor (k)</th>
          <th className="border border-gray-300 px-1 py-2">Expanded Uncertainty in Value</th>
          <th className="border border-gray-300 px-1 py-2">CMC Taken</th>
        </tr>
      </thead>
      <tbody>
        {data.map((row, i) => (
          <tr key={i} className="hover:bg-gray-50 text-center text-[12px]">
            <td className="border border-gray-300 px-1 py-2">{row.srNo}</td>
            {row.values.map((v, idx) => (
              <td key={idx} className="border border-gray-300 px-1 py-2">{v}</td>
            ))}
            <td className="border border-gray-300 px-1 py-2">{row.unit}</td>
            <td className="border border-gray-300 px-1 py-2">{row.calibrationPoint}</td>
            <td className="border border-gray-300 px-1 py-2">{typeof row.average === 'number' ? formatUncertaintyValue(row.average, 3) : row.average}</td>
            <td className="border border-gray-300 px-1 py-2">{typeof row.stdDeviation === 'number' ? formatUncertaintyValue(row.stdDeviation, 6) : row.stdDeviation}</td>
            <td className="border border-gray-300 px-1 py-2">{typeof row.typeA === 'number' ? formatUncertaintyValue(row.typeA, 6) : row.typeA}</td>
            <td className="border border-gray-300 px-1 py-2">{typeof row.uncertaintyMaster1 === 'number' ? formatUncertaintyValue(row.uncertaintyMaster1, 6) : row.uncertaintyMaster1}</td>
            <td className="border border-gray-300 px-1 py-2">{typeof row.uncertaintyMaster2Value === 'number' ? formatUncertaintyValue(row.uncertaintyMaster2Value, 6) : row.uncertaintyMaster2Value}</td>
            <td className="border border-gray-300 px-1 py-2">{typeof row.uncertaintyMaster2Celsius === 'number' ? formatUncertaintyValue(row.uncertaintyMaster2Celsius, 6) : row.uncertaintyMaster2Celsius}</td>
            <td className="border border-gray-300 px-1 py-2">{typeof row.stabilityBath === 'number' ? formatUncertaintyValue(row.stabilityBath, 6) : row.stabilityBath}</td>
            <td className="border border-gray-300 px-1 py-2">{typeof row.uniformityBath === 'number' ? formatUncertaintyValue(row.uniformityBath, 6) : row.uniformityBath}</td>
            <td className="border border-gray-300 px-1 py-2">{typeof row.driftMaster === 'number' ? formatUncertaintyValue(row.driftMaster, 6) : row.driftMaster}</td>
            <td className="border border-gray-300 px-1 py-2">{row.leastCountUuc}</td>
            <td className="border border-gray-300 px-1 py-2">{typeof row.combinedUncertainty === 'number' ? formatUncertaintyValue(row.combinedUncertainty, 6) : row.combinedUncertainty}</td>
            <td className="border border-gray-300 px-1 py-2">{row.degreeOfFreedom === '-' ? '-' : (typeof row.degreeOfFreedom === 'number' ? formatUncertaintyValue(row.degreeOfFreedom, 2) : row.degreeOfFreedom)}</td>
            <td className="border border-gray-300 px-1 py-2">{typeof row.coverageFactor === 'number' ? formatUncertaintyValue(row.coverageFactor, 2) : row.coverageFactor}</td>
            <td className="border border-gray-300 px-1 py-2">{typeof row.expandedUncertaintyValue === 'number' ? formatUncertaintyValue(row.expandedUncertaintyValue, 6) : row.expandedUncertaintyValue}</td>
            <td className="border border-gray-300 px-1 py-2">{typeof row.cmcTaken === 'number' ? formatUncertaintyValue(row.cmcTaken, 6) : row.cmcTaken}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default GtmCmcTable;
