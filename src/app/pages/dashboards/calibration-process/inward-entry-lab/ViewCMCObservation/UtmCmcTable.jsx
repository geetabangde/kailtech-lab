const fmt = (value, decimals) => {
  const num = typeof value === 'number' ? value : parseFloat(value);
  if (value === null || value === undefined || value === '' || isNaN(num)) return '-';
  return num.toFixed(decimals);
};

export const UtmCmcTable = ({ data }) => (
  <div className="overflow-x-auto">
    <table className="w-full border-collapse text-[12px] text-gray-700 min-w-max">
      <thead>
        <tr className="bg-gray-100 font-semibold">
          <th colSpan="11" className="border border-gray-300 px-2 py-2 bg-gray-200 text-center">Type A Factor</th>
          <th colSpan="3" className="border border-gray-300 px-2 py-2 bg-gray-200 text-center">Type B Factor</th>
          <th colSpan="16" className="border border-gray-300 px-2 py-2 bg-gray-200 text-center">Uncertainty Measurement</th>
        </tr>
        <tr className="bg-gray-200 text-center font-medium text-[11px]">
          <th rowSpan="2" className="border border-gray-300 px-2 py-2">Sr no</th>
          <th rowSpan="2" className="border border-gray-300 px-2 py-2">Force</th>
          <th rowSpan="2" className="border border-gray-300 px-2 py-2">Mode</th>
          <th rowSpan="2" className="border border-gray-300 px-2 py-2">Unit</th>
          <th rowSpan="2" className="border border-gray-300 px-2 py-2">Calibration point</th>
          <th rowSpan="2" className="border border-gray-300 px-2 py-2">Std at 24 &plusmn;1 &deg;C</th>
          <th rowSpan="2" className="border border-gray-300 px-2 py-2">Standard Division at Room temp</th>
          <th colSpan="4" className="border border-gray-300 px-2 py-2">Observation ON master (In Count)</th>
          <th colSpan="3" className="border border-gray-300 px-2 py-2">Relative Indicative Error</th>
          <th rowSpan="2" className="border border-gray-300 px-2 py-2">Relative indication error q in %</th>
          <th rowSpan="2" className="border border-gray-300 px-2 py-2">Repatability b in %</th>
          <th rowSpan="2" className="border border-gray-300 px-2 py-2">Repatability by Standard Deviation U<sub>rep</sub> in %</th>
          <th rowSpan="2" className="border border-gray-300 px-2 py-2">Least Count</th>
          <th rowSpan="2" className="border border-gray-300 px-2 py-2">Relative Zero error in %</th>
          <th rowSpan="2" className="border border-gray-300 px-2 py-2">Relative Resolution a<sub>F</sub> in %</th>
          <th rowSpan="2" className="border border-gray-300 px-2 py-2">Relative Resolution a<sub>Z</sub> in %</th>
          <th rowSpan="2" className="border border-gray-300 px-2 py-2">Resolution UNC(U<sub>res</sub>)</th>
          <th rowSpan="2" className="border border-gray-300 px-2 py-2">Master UNC in Certificate in %</th>
          <th rowSpan="2" className="border border-gray-300 px-2 py-2">Drift in %</th>
          <th rowSpan="2" className="border border-gray-300 px-2 py-2">Master UNC. Uncertainty U<sub>std</sub> in %</th>
          <th rowSpan="2" className="border border-gray-300 px-2 py-2">Combined Uncertainty in %</th>
          <th rowSpan="2" className="border border-gray-300 px-2 py-2">K Factor</th>
          <th rowSpan="2" className="border border-gray-300 px-2 py-2">Expanded Uncertainty in %</th>
          <th rowSpan="2" className="border border-gray-300 px-2 py-2">CmC Scope</th>
          <th rowSpan="2" className="border border-gray-300 px-2 py-2">CMC Taken</th>
        </tr>
        <tr className="bg-gray-200 text-center font-medium text-[11px]">
          <th className="border border-gray-300 px-2 py-2">1</th>
          <th className="border border-gray-300 px-2 py-2">2</th>
          <th className="border border-gray-300 px-2 py-2">3</th>
          <th className="border border-gray-300 px-2 py-2">Average</th>
          <th className="border border-gray-300 px-2 py-2">q1</th>
          <th className="border border-gray-300 px-2 py-2">q2</th>
          <th className="border border-gray-300 px-2 py-2">q3</th>
        </tr>
      </thead>
      <tbody>
        {data && data.length > 0 ? (
          data.map((row, index) => (
            <tr key={index} className="text-center hover:bg-gray-50 transition-colors">
              <td className="border border-gray-300 px-2 py-1">{row.srNo || index + 1}</td>
              <td className="border border-gray-300 px-2 py-1">{row.force}</td>
              <td className="border border-gray-300 px-2 py-1">{row.mode}</td>
              <td className="border border-gray-300 px-2 py-1">{row.unit}</td>
              <td className="border border-gray-300 px-2 py-1">{row.calibrationPoint}</td>
              <td className="border border-gray-300 px-2 py-1">{row.calculateduuc ?? '-'}</td>
              <td className="border border-gray-300 px-2 py-1">{row.uuc0}</td>
              <td className="border border-gray-300 px-2 py-1">{row.master0}</td>
              <td className="border border-gray-300 px-2 py-1">{row.master1}</td>
              <td className="border border-gray-300 px-2 py-1">{row.master2}</td>
              <td className="border border-gray-300 px-2 py-1">{fmt(row.averagemaster, 2)}</td>
              <td className="border border-gray-300 px-2 py-1">{fmt(row.q1Error, 2)}</td>
              <td className="border border-gray-300 px-2 py-1">{fmt(row.q2Error, 2)}</td>
              <td className="border border-gray-300 px-2 py-1">{fmt(row.q3Error, 2)}</td>
              <td className="border border-gray-300 px-2 py-1">{fmt(row.avgQError, 2)}</td>
              <td className="border border-gray-300 px-2 py-1">{fmt(row.diffQError, 2)}</td>
              <td className="border border-gray-300 px-2 py-1">{fmt(row.urep, 5)}</td>
              <td className="border border-gray-300 px-2 py-1">{row.leastcount}</td>
              <td className="border border-gray-300 px-2 py-1">{row.maxzeroerror}</td>
              <td className="border border-gray-300 px-2 py-1">{fmt(row.af, 4)}</td>
              <td className="border border-gray-300 px-2 py-1">{fmt(row.az, 5)}</td>
              <td className="border border-gray-300 px-2 py-1">{fmt(row.ures, 5)}</td>
              <td className="border border-gray-300 px-2 py-1">{row.masterunc}</td>
              <td className="border border-gray-300 px-2 py-1">{fmt(row.drift ?? 0, 2)}</td>
              <td className="border border-gray-300 px-2 py-1">{fmt(row.ustd, 4)}</td>
              <td className="border border-gray-300 px-2 py-1">{fmt(row.combinedUncertainty, 8)}</td>
              <td className="border border-gray-300 px-2 py-1">{row.kfactor ?? 2}</td>
              <td className="border border-gray-300 px-2 py-1">{fmt(row.expandedUncertainty, 3)}</td>
              <td className="border border-gray-300 px-2 py-1">{row.cmcScope ?? 0}</td>
              <td className="border border-gray-300 px-2 py-1">{fmt(row.cmcTaken, 3)}</td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan="30" className="border border-gray-300 px-4 py-4 text-center text-gray-500">
              No observation data available.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);

export default UtmCmcTable;
