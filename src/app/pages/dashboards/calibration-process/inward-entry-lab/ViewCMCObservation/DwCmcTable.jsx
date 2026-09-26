export const DwCmcTable = ({ data }) => {
  if (!data || data.length === 0) return null;
  const uucUnit = data[0]?.unit || 'g';

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[12px] text-gray-700 min-w-max">
        <thead>
          <tr className="bg-gray-100 text-center font-semibold text-[11px]">
            <th rowSpan="3" className="border border-gray-300 px-1 py-2 bg-gray-200">Sr no</th>
            <th rowSpan="3" className="border border-gray-300 px-1 py-2 bg-gray-200">Nominal Value on UUC ({uucUnit})</th>
            <th colSpan="4" className="border border-gray-300 px-1 py-2 bg-gray-200">Measured mass value ({uucUnit})</th>
            <th className="border border-gray-300 px-1 py-2 bg-gray-200">Diff., ∆m</th>
            <th className="border border-gray-300 px-1 py-2 bg-gray-200">Type A ({uucUnit})</th>
            <th rowSpan="3" className="border border-gray-300 px-1 py-2 bg-gray-200">Avg. Diff.(g)</th>
            <th rowSpan="3" className="border border-gray-300 px-1 py-2 bg-gray-200">Conv. Mass <br />(Mr + ∆m+B.C.)(g)</th>
            <th rowSpan="3" className="border border-gray-300 px-1 py-2 bg-gray-200">Density of Moist Air (ρa) g/cm³</th>
            <th rowSpan="3" className="border border-gray-300 px-1 py-2 bg-gray-200">Reference Air Density(ρo) g/cm³</th>
            <th rowSpan="3" className="border border-gray-300 px-1 py-2 bg-gray-200">Density of Reference Weight g/cm³</th>
            <th rowSpan="3" className="border border-gray-300 px-1 py-2 bg-gray-200">Density of Test Weight g/cm³</th>
            <th rowSpan="3" className="border border-gray-300 px-1 py-2 bg-gray-200">Reference Weight Mass Value (Mr)</th>
            <th rowSpan="3" className="border border-gray-300 px-1 py-2 bg-gray-200">Volume of Reference Weight (Vr)</th>
            <th rowSpan="3" className="border border-gray-300 px-1 py-2 bg-gray-200">Volume of Test Weight (Vt)</th>
            <th rowSpan="3" className="border border-gray-300 px-1 py-2 bg-gray-200">Air Buoyancy Correction</th>
            <th rowSpan="3" className="border border-gray-300 px-1 py-2 bg-gray-200">Least Count W.B (g)</th>
            <th rowSpan="3" className="border border-gray-300 px-1 py-2 bg-gray-200">Uncertainty Of Reference Weight (g)</th>
            <th rowSpan="3" className="border border-gray-300 px-1 py-2 bg-gray-200">Combined Uncertainty</th>
            <th rowSpan="3" className="border border-gray-300 px-1 py-2 bg-gray-200">Coverage Factor</th>
            <th rowSpan="3" className="border border-gray-300 px-1 py-2 bg-gray-200">Expanded Uncertainty (mg)</th>
            <th rowSpan="3" className="border border-gray-300 px-1 py-2 bg-gray-200">CMC Taken</th>
            <th rowSpan="3" className="border border-gray-300 px-1 py-2 bg-gray-200">CMC Scope</th>
          </tr>
          <tr className="bg-gray-100 text-center font-semibold text-[11px]">
            <th className="border border-gray-300 px-1 py-2 bg-gray-200">S1</th>
            <th className="border border-gray-300 px-1 py-2 bg-gray-200">U1</th>
            <th className="border border-gray-300 px-1 py-2 bg-gray-200">U2</th>
            <th className="border border-gray-300 px-1 py-2 bg-gray-200">S2</th>
            <th rowSpan="2" className="border border-gray-300 px-1 py-2 bg-gray-200">(U1-S1)+(U2-S2)/2</th>
            <th rowSpan="2" className="border border-gray-300 px-1 py-2 bg-gray-200">Stdev/sqrt(3)</th>
          </tr>
          <tr className="bg-gray-100 text-center font-semibold text-[11px]">
            <th className="border border-gray-300 px-1 py-2 bg-gray-200">A(g)</th>
            <th className="border border-gray-300 px-1 py-2 bg-gray-200">B(g)</th>
            <th className="border border-gray-300 px-1 py-2 bg-gray-200">B(g)</th>
            <th className="border border-gray-300 px-1 py-2 bg-gray-200">A(g)</th>
          </tr>
        </thead>
        <tbody>
          {data.flatMap((row, i) => {
            const repeatCount = Math.max(
              row.uuca?.length || 0,
              row.mastera?.length || 0,
              row.masterb?.length || 0,
              row.uucb?.length || 0,
              row.deltai?.length || 0,
              1
            );

            const rows = [];
            for (let ri = 0; ri < repeatCount; ri++) {
              rows.push(
                <tr key={`${i}-${ri}`} className="hover:bg-gray-50 text-center text-[12px]">
                  {ri === 0 && (
                    <>
                      <td rowSpan={repeatCount} className="border border-gray-300 px-1 py-2 text-center font-medium">{row.srNo}</td>
                      <td rowSpan={repeatCount} className="border border-gray-300 px-1 py-2 text-center">{row.calibrationPoint}</td>
                    </>
                  )}
                  <td className="border border-gray-300 px-1 py-2">{row.uuca?.[ri] ?? '-'}</td>
                  <td className="border border-gray-300 px-1 py-2">{row.mastera?.[ri] ?? '-'}</td>
                  <td className="border border-gray-300 px-1 py-2">{row.masterb?.[ri] ?? '-'}</td>
                  <td className="border border-gray-300 px-1 py-2">{row.uucb?.[ri] ?? '-'}</td>
                  <td className="border border-gray-300 px-1 py-2">{row.deltai?.[ri] ?? '-'}</td>
                  {ri === 0 && (
                    <>
                      <td rowSpan={repeatCount} className="border border-gray-300 px-1 py-2">
                        {typeof row.typeA === 'number' ? row.typeA.toFixed(8) : (row.typeA ?? '-')}
                      </td>
                      <td rowSpan={repeatCount} className="border border-gray-300 px-1 py-2">
                        {typeof row.averagedeltai === 'number' ? row.averagedeltai.toFixed(8) : (row.averagedeltai ?? '-')}
                      </td>
                      <td rowSpan={repeatCount} className="border border-gray-300 px-1 py-2">
                        {typeof row.mcr === 'number' ? row.mcr.toFixed(8) : (row.mcr ?? '-')}
                      </td>
                      <td rowSpan={repeatCount} className="border border-gray-300 px-1 py-2">
                        {typeof row.densityofair === 'number' ? row.densityofair.toFixed(8) : (row.densityofair ?? '-')}
                      </td>
                      <td rowSpan={repeatCount} className="border border-gray-300 px-1 py-2">
                        {typeof row.densityofairref === 'number' ? row.densityofairref.toFixed(4) : (row.densityofairref ?? '0.0012')}
                      </td>
                      <td rowSpan={repeatCount} className="border border-gray-300 px-1 py-2">
                        {typeof row.densityofmaster === 'number' ? row.densityofmaster.toFixed(4) : (row.densityofmaster ?? '-')}
                      </td>
                      <td rowSpan={repeatCount} className="border border-gray-300 px-1 py-2">
                        {typeof row.densityuuc === 'number' ? row.densityuuc.toFixed(4) : (row.densityuuc ?? '-')}
                      </td>
                      <td rowSpan={repeatCount} className="border border-gray-300 px-1 py-2">
                        {typeof row.refweightmass === 'number' ? row.refweightmass.toFixed(6) : (row.refweightmass ?? '-')}
                      </td>
                      <td rowSpan={repeatCount} className="border border-gray-300 px-1 py-2">
                        {typeof row.volumofref === 'number' ? row.volumofref.toFixed(6) : (row.volumofref ?? '-')}
                      </td>
                      <td rowSpan={repeatCount} className="border border-gray-300 px-1 py-2">
                        {typeof row.volumeoftestweight === 'number' ? row.volumeoftestweight.toFixed(6) : (row.volumeoftestweight ?? '-')}
                      </td>
                      <td rowSpan={repeatCount} className="border border-gray-300 px-1 py-2">
                        {typeof row.airbyouncy === 'number' ? (Math.abs(row.airbyouncy) < 1e-6 ? row.airbyouncy.toExponential(4) : row.airbyouncy.toFixed(8)) : (row.airbyouncy ?? '-')}
                      </td>
                      <td rowSpan={repeatCount} className="border border-gray-300 px-1 py-2">
                        {typeof row.masterleastcount === 'number' ? row.masterleastcount.toFixed(6) : (row.masterleastcount ?? '-')}
                      </td>
                      <td rowSpan={repeatCount} className="border border-gray-300 px-1 py-2">
                        {typeof row.masterunc === 'number' ? row.masterunc.toFixed(8) : (row.masterunc ?? '-')}
                      </td>
                      <td rowSpan={repeatCount} className="border border-gray-300 px-1 py-2">
                        {typeof row.comuncer === 'number' ? row.comuncer.toFixed(8) : (row.comuncer ?? '-')}
                      </td>
                      <td rowSpan={repeatCount} className="border border-gray-300 px-1 py-2">
                        {typeof row.coveragefactor === 'number' ? row.coveragefactor.toFixed(2) : (row.coveragefactor ?? '2')}
                      </td>
                      <td rowSpan={repeatCount} className="border border-gray-300 px-1 py-2">
                        {typeof row.expandeduncertainty === 'number' ? row.expandeduncertainty.toFixed(6) : (row.expandeduncertainty ?? '-')}
                      </td>
                      <td rowSpan={repeatCount} className="border border-gray-300 px-1 py-2">
                        {typeof row.cmcuncertainty === 'number' ? row.cmcuncertainty.toFixed(6) : (row.cmcuncertainty ?? '-')}
                      </td>
                      <td rowSpan={repeatCount} className="border border-gray-300 px-1 py-2">
                        {typeof row.cmcscope === 'number' ? row.cmcscope : (row.cmc_scope !== undefined ? row.cmc_scope : (row.cmcscope ?? '-'))}
                      </td>
                    </>
                  )}
                </tr>
              );
            }
            return rows;
          })}
        </tbody>
      </table>
    </div>
  );
};

export default DwCmcTable;
