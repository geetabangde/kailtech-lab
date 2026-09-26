export const WbnCmcTable = ({ data }) => (
  <div className="overflow-x-auto">
    <table className="w-full border-collapse text-[12px] text-gray-700 min-w-max">
      <thead>
        <tr className="bg-gray-100 font-semibold">
          <th colSpan="16" className="border border-gray-300 px-2 py-2 bg-gray-200 font-semibold text-center">Type A Factor</th>
          <th colSpan="3" className="border border-gray-300 px-2 py-2 bg-gray-200 font-semibold text-center">Type B Factor</th>
          <th colSpan="5" className="border border-gray-300 px-2 py-2 bg-gray-200 font-semibold text-center">Uncertainty Measurement</th>
        </tr>
        <tr className="bg-gray-200 text-center font-medium">
          <th className="border border-gray-300 px-2 py-2">Sr No</th>
          <th className="border border-gray-300 px-2 py-2">1</th>
          <th className="border border-gray-300 px-2 py-2">2</th>
          <th className="border border-gray-300 px-2 py-2">3</th>
          <th className="border border-gray-300 px-2 py-2">4</th>
          <th className="border border-gray-300 px-2 py-2">5</th>
          <th className="border border-gray-300 px-2 py-2">Unit</th>
          <th className="border border-gray-300 px-2 py-2">Calibration point</th>
          <th className="border border-gray-300 px-2 py-2">Average(g)</th>
          <th className="border border-gray-300 px-2 py-2">Std Deviation</th>
          <th className="border border-gray-300 px-2 py-2">Type A</th>
          <th className="border border-gray-300 px-2 py-2">Drift in mass(g)</th>
          <th className="border border-gray-300 px-2 py-2">Eccentricity [2/3xD]/2sqrt(3) (g)</th>
          <th className="border border-gray-300 px-2 py-2">Uncertainty of master in (g)</th>
          <th className="border border-gray-300 px-2 py-2">Least Count of UUC (g)</th>
          <th className="border border-gray-300 px-2 py-2">Combined Uncertainty</th>
          <th className="border border-gray-300 px-2 py-2">Degree of Freedom</th>
          <th className="border border-gray-300 px-2 py-2">Coverage Factor (k)</th>
          <th className="border border-gray-300 px-2 py-2">Expanded Uncertainty in (g)</th>
          <th className="border border-gray-300 px-2 py-2">Expanded Uncertainty in (mg)</th>
          <th className="border border-gray-300 px-2 py-2">CMC Taken</th>
        </tr>
      </thead>
      <tbody>
        {data.length > 0 ? (
          data.map((row, index) => {
            const uuc0 = row.values?.[0] ?? row.reading_1 ?? '0';
            const uuc1 = row.values?.[1] || '0';
            const uuc2 = row.values?.[2] || '0';
            const uuc3 = row.values?.[3] || '0';
            const uuc4 = row.values?.[4] || '0';
            return (
              <tr key={index} className="text-center hover:bg-gray-50 transition-colors">
                <td className="border border-gray-300 px-2 py-1">{row.srNo || index + 1}</td>
                <td className="border border-gray-300 px-2 py-1">{uuc0}</td>
                <td className="border border-gray-300 px-2 py-1">{uuc1}</td>
                <td className="border border-gray-300 px-2 py-1">{uuc2}</td>
                <td className="border border-gray-300 px-2 py-1">{uuc3}</td>
                <td className="border border-gray-300 px-2 py-1">{uuc4}</td>
                <td className="border border-gray-300 px-2 py-1">{row.unit}</td>
                <td className="border border-gray-300 px-2 py-1">{row.calibrationPoint}</td>
                <td className="border border-gray-300 px-2 py-1">{Number(row.average).toFixed(4)}</td>
                <td className="border border-gray-300 px-2 py-1">{Number(row.stdDeviation).toFixed(6)}</td>
                <td className="border border-gray-300 px-2 py-1">{Number(row.typeA).toFixed(6)}</td>
                <td className="border border-gray-300 px-2 py-1">{Number(row.drift).toFixed(6)}</td>
                <td className="border border-gray-300 px-2 py-1">{Number(row.eccentricityfactor).toFixed(6)}</td>
                <td className="border border-gray-300 px-2 py-1">{Number(row.masterunc).toFixed(6)}</td>
                <td className="border border-gray-300 px-2 py-1">{Number(row.leastcount).toFixed(6)}</td>
                <td className="border border-gray-300 px-2 py-1">{Number(row.comuncer).toFixed(6)}</td>
                <td className="border border-gray-300 px-2 py-1">{typeof row.dof === 'number' ? Number(row.dof).toFixed(2) : row.dof}</td>
                <td className="border border-gray-300 px-2 py-1">{row.coveragefactor}</td>
                <td className="border border-gray-300 px-2 py-1">{Number(row.expandeduncertainty).toFixed(6)}</td>
                <td className="border border-gray-300 px-2 py-1">{Number(row.expandeduncertaintymg).toFixed(4)}</td>
                <td className="border border-gray-300 px-2 py-1">{Number(row.cmcuncertainty)}</td>
              </tr>
            );
          })
        ) : (
          <tr>
            <td colSpan="21" className="border border-gray-300 px-4 py-4 text-center text-gray-500">
              No observation data available.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);

export default WbnCmcTable;
