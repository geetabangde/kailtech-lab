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

const MASTER_COUNT = 10;

/**
 * CMC table for VOLNL (Volumetric).
 *
 * Mirrors the PHP cmcvolnl layout. The ten master readings are each shown
 * multiplied by the point's z-value, as the PHP does, and the uncertainty budget
 * carries the volumetric-specific Type B contributions (water density, air
 * density, material coefficient, barometric pressure, meniscus).
 */
export const VolnlCmcTable = ({ data }) => {
  const rows = Array.isArray(data) ? data : [];

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[12px] text-gray-700 min-w-max">
        <thead>
          <tr className="bg-gray-100 font-semibold">
            <th colSpan="15" className={`${TH} bg-gray-200 text-center`}>Type A Factor</th>
            <th colSpan="9" className={`${TH} bg-gray-200 text-center`}>Type B Factor</th>
            <th colSpan="5" className={`${TH} bg-gray-200 text-center`}>Uncertainty Measurement</th>
          </tr>
          <tr className="bg-gray-200 text-center font-medium text-[11px]">
            <th className={TH}>Sr no</th>
            <th className={TH}>Calibration point</th>
            {Array.from({ length: MASTER_COUNT }, (_, i) => (
              <th key={i} className={TH}>{i + 1}</th>
            ))}
            <th className={TH}>Unit</th>
            <th className={TH}>Average</th>
            <th className={TH}>Type A</th>

            <th className={TH}>Uncertainty of Balance</th>
            <th className={TH}>linearity Of Balance</th>
            <th className={TH}>
              Uncertainty in water temperature measurement<br />
              (0.21 nl &micro;l<sup>-1</sup> &deg;C<sup>-1</sup>) or 210 ppm &deg;C<sup>-1</sup>,<br />
              Uncertanity of Temperature Device
            </th>
            <th className={TH}>Uncertainty due to Water density</th>
            <th className={TH}>Uncertainty due to Air Density</th>
            <th className={TH}>Uncertainty due to Material Coefficient</th>
            <th className={TH}>Uncertainty due to Barometric pressure</th>
            <th className={TH}>Uncertainty due to Meniscus</th>
            <th className={TH}>Least Count of Weighing balance</th>

            <th className={TH}>Combined Uncertainty</th>
            <th className={TH}>Degree of Freedom</th>
            <th className={TH}>Coverage Factor (k)</th>
            <th className={TH}>Expanded Uncertainty in Value</th>
            <th className={TH}>CMC Taken</th>
          </tr>
        </thead>
        <tbody>
          {rows.length > 0 ? (
            rows.map((row, index) => {
              // PHP reports each reading multiplied by the point's z-value.
              // master0..master9 are taken as already scaled (that is what the PHP
              // emits); a raw master_readings[] array is scaled here instead.
              const zValue = parseFloat(pick(row, 'zvalue', 'z_value') ?? 1);
              const rawReadings = pick(row, 'master_readings', 'observations');
              const readings = Array.from({ length: MASTER_COUNT }, (_, i) => {
                const scaled = row?.[`master${i}`];
                if (scaled !== undefined && scaled !== null && scaled !== '') return scaled;

                const item = Array.isArray(rawReadings) ? rawReadings[i] : undefined;
                const val = (item && typeof item === 'object') ? item.value : item;
                const num = parseFloat(val);
                if (isNaN(num)) return undefined;
                return isNaN(zValue) ? num : num * zValue;
              });

              return (
                <tr key={index} className="text-center hover:bg-gray-50 transition-colors">
                  <td className={TD}>{pick(row, 'sr_no', 'srNo') ?? index + 1}</td>
                  <td className={TD}>{raw(pick(row, 'uuc0', 'calibration_point', 'uuc'))}</td>

                  {readings.map((reading, i) => (
                    <td key={i} className={TD}>{fmt(reading, 5)}</td>
                  ))}

                  <td className={TD}>{raw(pick(row, 'unit', 'unit_desc'))}</td>
                  <td className={TD}>{fmt(pick(row, 'averagemaster', 'average_master'), 5)}</td>
                  <td className={TD}>{fmt(pick(row, 'typea', 'type_a'), 6)}</td>

                  <td className={TD}>{fmt(pick(row, 'masterunc', 'master_uncertainty'), 6)}</td>
                  <td className={TD}>{fmt(pick(row, 'masteraccuracy', 'linearity', 'master_accuracy'), 6)}</td>
                  <td className={TD}>{fmt(pick(row, 'uncertaintyinwater', 'uncertainty_in_water'), 8)}</td>
                  <td className={TD}>{fmt(pick(row, 'waterdensity', 'water_density'), 8)}</td>
                  <td className={TD}>{fmt(pick(row, 'airDensity', 'air_density'), 8)}</td>
                  <td className={TD}>{fmt(pick(row, 'materialcofficient', 'material_coefficient'), 6)}</td>
                  <td className={TD}>{fmt(pick(row, 'baromterpresure', 'barometric_pressure'), 8)}</td>
                  <td className={TD}>{fmt(pick(row, 'meniscus') ?? 0, 3)}</td>
                  <td className={TD}>{raw(pick(row, 'masterleastcount', 'master_least_count'))}</td>

                  <td className={TD}>{fmt(pick(row, 'comuncer', 'combined_uncertainty'), 8)}</td>
                  <td className={TD}>
                    {(() => {
                      const dof = pick(row, 'dof', 'degree_of_freedom');
                      if (dof === undefined || dof === '-' ) return '-';
                      return fmt(dof, 2);
                    })()}
                  </td>
                  <td className={TD}>{pick(row, 'coveragefactor', 'coverage_factor', 'kfactor') ?? 2}</td>
                  <td className={TD}>{fmt(pick(row, 'expandeduncertainty', 'expanded_uncertainty'), 5)}</td>
                  <td className={TD}>{fmt(pick(row, 'cmcuncertainty', 'cmc_taken'), 5)}</td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan="29" className="border border-gray-300 px-4 py-4 text-center text-gray-500">
                No observation data available.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default VolnlCmcTable;
