const fmt = (value, decimals) => {
  const num = typeof value === 'number' ? value : parseFloat(value);
  if (value === null || value === undefined || value === '' || isNaN(num)) return '-';
  return num.toFixed(decimals);
};

const raw = (value) =>
  (value === null || value === undefined || value === '') ? '-' : value;

// The API may use snake_case or the PHP variable names; accept either.
const pick = (row, ...keys) => {
  for (const key of keys) {
    if (row?.[key] !== undefined && row[key] !== null && row[key] !== '') return row[key];
  }
  return undefined;
};

const TH = 'border border-gray-300 px-2 py-2';
const TD = 'border border-gray-300 px-2 py-1';

const READING_COUNT = 5;

/**
 * CMC table for VHT (Hardness Tester).
 *
 * Mirrors the PHP cmcvht layout: the five converted UUC readings, the reference
 * block value, the mean diagonal and the sensitivity coefficient
 * (2 x reference block / mean diagonal), then the uncertainty budget. Unlike the
 * other force/volume tables this one reports expanded uncertainty both in value
 * and as a percentage of the test point, and the CMC is taken against the
 * percentage figure.
 */
export const VhtCmcTable = ({ data }) => {
  const rows = Array.isArray(data) ? data : [];

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[12px] text-gray-700 min-w-max">
        <thead>
          <tr className="bg-gray-100 font-semibold">
            <th colSpan="15" className={`${TH} bg-gray-200 text-center`}>Type A Factor</th>
            <th colSpan="2" className={`${TH} bg-gray-200 text-center`}>Type B Factor</th>
            <th colSpan="6" className={`${TH} bg-gray-200 text-center`}>Uncertainty Measurement</th>
          </tr>
          <tr className="bg-gray-200 text-center font-medium text-[11px]">
            <th className={TH}>Sr no</th>
            <th className={TH}>Unit type</th>
            <th className={TH}>Mode</th>
            {Array.from({ length: READING_COUNT }, (_, i) => (
              <th key={i} className={TH}>{i + 1}</th>
            ))}
            <th className={TH}>Unit</th>
            <th className={TH}>Reference Block Value</th>
            <th className={TH}>Mean Diagnol</th>
            <th className={TH}>Snentivity Cofficent</th>
            <th className={TH}>Average</th>
            <th className={TH}>Std Deviation</th>
            <th className={TH}>Type A</th>

            <th className={TH}>Uncertainty of master in value</th>
            <th className={TH}>Least Count of UUC</th>

            <th className={TH}>Combined Uncertainty</th>
            <th className={TH}>Degree of Freedom</th>
            <th className={TH}>Coverage Factor (k)</th>
            <th className={TH}>Expanded Uncertainty in Value</th>
            <th className={TH}>Expanded Uncertainty in %</th>
            <th className={TH}>CMC Taken</th>
          </tr>
        </thead>
        <tbody>
          {rows.length > 0 ? (
            rows.map((row, index) => {
              const supplied = pick(row, 'uuc_readings', 'uuc_observations', 'observations');
              const readings = Array.from({ length: READING_COUNT }, (_, i) => {
                const direct = row?.[`uuc${i}`];
                if (direct !== undefined && direct !== null && direct !== '') return direct;

                const item = Array.isArray(supplied) ? supplied[i] : undefined;
                return (item && typeof item === 'object') ? item.value : item;
              });

              return (
                <tr key={index} className="text-center hover:bg-gray-50 transition-colors">
                  <td className={TD}>{pick(row, 'sr_no', 'srNo') ?? index + 1}</td>
                  <td className={TD}>{raw(pick(row, 'unittype', 'unit_type'))}</td>
                  <td className={TD}>{raw(row.mode)}</td>

                  {readings.map((reading, i) => (
                    <td key={i} className={TD}>{raw(reading)}</td>
                  ))}

                  <td className={TD}>{raw(pick(row, 'unit', 'unit_desc'))}</td>
                  <td className={TD}>{raw(pick(row, 'master0', 'reference_block_value', 'master'))}</td>
                  <td className={TD}>{raw(pick(row, 'mean', 'mean_diagonal', 'caverageuuc'))}</td>
                  <td className={TD}>{fmt(pick(row, 'sensitivitycoff', 'sensitivity_coefficient'), 6)}</td>
                  <td className={TD}>{raw(pick(row, 'averageuuc', 'average_uuc', 'average'))}</td>
                  <td className={TD}>{fmt(pick(row, 'repeatability', 'std_deviation'), 6)}</td>
                  <td className={TD}>{fmt(pick(row, 'typea', 'type_a'), 6)}</td>

                  <td className={TD}>{fmt(pick(row, 'masterunc', 'master_uncertainty'), 6)}</td>
                  <td className={TD}>{raw(pick(row, 'leastcount', 'least_count'))}</td>

                  <td className={TD}>{fmt(pick(row, 'comuncer', 'combined_uncertainty'), 8)}</td>
                  <td className={TD}>
                    {(() => {
                      const dof = pick(row, 'dof', 'degree_of_freedom');
                      if (dof === undefined || dof === '-') return '-';
                      return fmt(dof, 2);
                    })()}
                  </td>
                  <td className={TD}>{pick(row, 'coveragefactor', 'coverage_factor', 'kfactor') ?? 2}</td>
                  <td className={TD}>{fmt(pick(row, 'expandeduncertainty', 'expanded_uncertainty'), 5)}</td>
                  <td className={TD}>
                    {fmt(pick(row, 'expandeduncertaintypercent', 'expanded_uncertainty_percent'), 4)}
                  </td>
                  <td className={TD}>{fmt(pick(row, 'cmcuncertainty', 'cmc_taken'), 4)}</td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan="23" className="border border-gray-300 px-4 py-4 text-center text-gray-500">
                No observation data available.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default VhtCmcTable;
