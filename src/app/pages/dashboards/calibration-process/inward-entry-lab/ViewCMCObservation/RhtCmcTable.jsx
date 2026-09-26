import { formatUncertaintyValue } from "./viewCmcUtils";

export const RhtCmcTable = ({ data }) => (
  <div className="overflow-x-auto">
    <table className="w-full border-collapse text-[12px] text-gray-700 min-w-max">
      <thead>
        <tr className="bg-gray-100 text-center">
          <th colSpan="13" className="border border-gray-300 px-1 py-2 bg-gray-200 font-semibold text-xs">
            Type A Factor
          </th>
          <th colSpan="2" className="border border-gray-300 px-1 py-2 bg-gray-200 font-semibold text-xs">
            Type B Factor
          </th>
          <th colSpan="5" className="border border-gray-300 px-1 py-2 bg-gray-200 font-semibold text-xs">
            Uncertainty Measurement
          </th>
        </tr>
        <tr className="bg-gray-200 text-center text-[12px] font-medium">
          <th className="border border-gray-300 px-1 py-2">Sr no</th>
          <th className="border border-gray-300 px-1 py-2">Unit type</th>
          <th className="border border-gray-300 px-1 py-2">Mode</th>
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
          
          <th className="border border-gray-300 px-1 py-2">Uncertainty of master in value</th>
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
            <td className="border border-gray-300 px-1 py-2">{row.srNo || row.sr_no}</td>
            <td className="border border-gray-300 px-1 py-2">{row.unitType || row.unittype}</td>
            <td className="border border-gray-300 px-1 py-2">{row.mode}</td>
            
            {row.values ? row.values.map((v, idx) => (
              <td key={idx} className="border border-gray-300 px-1 py-2">{v}</td>
            )) : Array.from({length: 5}).map((_, idx) => (
              <td key={idx} className="border border-gray-300 px-1 py-2">{row[`uuc${idx}`] ?? ''}</td>
            ))}
            
            <td className="border border-gray-300 px-1 py-2">{row.unit}</td>
            <td className="border border-gray-300 px-1 py-2">{row.calibrationPoint || row.point}</td>
            <td className="border border-gray-300 px-1 py-2">{row.average || row.averageuuc}</td>
            <td className="border border-gray-300 px-1 py-2">
              {typeof (row.stdDeviation || row.repeatability) === 'number' 
                ? formatUncertaintyValue((row.stdDeviation || row.repeatability), 6) 
                : (row.stdDeviation || row.repeatability)}
            </td>
            <td className="border border-gray-300 px-1 py-2">
              {typeof row.typeA === 'number' ? formatUncertaintyValue(row.typeA, 6) : row.typeA}
            </td>
            
            <td className="border border-gray-300 px-1 py-2">
              {typeof (row.uncMasterValue || row.masterunc) === 'number' 
                ? (row.uncMasterValue || row.masterunc).toFixed(6) 
                : (row.uncMasterValue || row.masterunc)}
            </td>
            <td className="border border-gray-300 px-1 py-2">
              {typeof (row.leastCountUUC || row.leastcount) === 'number' 
                ? (row.leastCountUUC || row.leastcount).toFixed(6) 
                : (row.leastCountUUC || row.leastcount)}
            </td>
            
            <td className="border border-gray-300 px-1 py-2">
              {typeof (row.combinedUnc || row.comuncer) === 'number' 
                ? (row.combinedUnc || row.comuncer).toFixed(6) 
                : (row.combinedUnc || row.comuncer)}
            </td>
            <td className="border border-gray-300 px-1 py-2">
              {row.dof === '-' ? '-' : (typeof row.dof === 'number' ? row.dof.toFixed(2) : row.dof)}
            </td>
            <td className="border border-gray-300 px-1 py-2">
              {typeof row.coverageFactor === 'number' 
                ? row.coverageFactor.toFixed(2) 
                : row.coverageFactor}
            </td>
            <td className="border border-gray-300 px-1 py-2">
              {typeof (row.expandedUnc || row.expandeduncertainty) === 'number' 
                ? (row.expandedUnc || row.expandeduncertainty).toFixed(6) 
                : (row.expandedUnc || row.expandeduncertainty)}
            </td>
            <td className="border border-gray-300 px-1 py-2">
              {typeof (row.cmc || row.cmcuncertainty) === 'number' 
                ? (row.cmc || row.cmcuncertainty).toFixed(6) 
                : (row.cmc || row.cmcuncertainty)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default RhtCmcTable;
