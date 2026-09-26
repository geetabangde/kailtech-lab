const fmt = (value, decimals) => {
  const num = typeof value === 'number' ? value : parseFloat(value);
  if (value === null || value === undefined || value === '' || isNaN(num)) return '-';
  return num.toFixed(decimals);
};

const raw = (value) =>
  (value === null || value === undefined || value === '') ? '-' : value;

const TH = 'border border-gray-300 px-2 py-2';
const TD = 'border border-gray-300 px-2 py-1';

// The API returns snake_case keys; keep the camelCase spellings as fallbacks so
// this table also works with data shaped like the other CMC tables.
const pick = (row, ...keys) => {
  for (const key of keys) {
    if (row?.[key] !== undefined && row[key] !== null && row[key] !== '') return row[key];
  }
  return undefined;
};

// PHP skips a row entirely when the matrix has no ratio; the API expresses that
// as shouldDisplay.
const visibleRows = (data) =>
  (Array.isArray(data) ? data : []).filter((row) => row?.shouldDisplay !== false);

/**
 * Modern layout, used when the inward's table suffix is newer than 20220306.
 * Four observations per point (Position 0deg, 120deg, 240deg, w/o Acce.) and
 * therefore four relative indicative errors q1..q4.
 */
const AutmCmcTableModern = ({ rows }) => (
  <div className="overflow-x-auto">
    <table className="w-full border-collapse text-[12px] text-gray-700 min-w-max">
      <thead>
        <tr className="bg-gray-100 font-semibold">
          <th colSpan="11" className={`${TH} bg-gray-200 text-center`}>Type A Factor</th>
          <th colSpan="3" className={`${TH} bg-gray-200 text-center`}>Type B Factor</th>
          <th colSpan="17" className={`${TH} bg-gray-200 text-center`}>Uncertainty Measurement</th>
        </tr>
        <tr className="bg-gray-200 text-center font-medium text-[11px]">
          <th rowSpan="2" className={TH}>Sr no</th>
          <th rowSpan="2" className={TH}>Force</th>
          <th rowSpan="2" className={TH}>Mode</th>
          <th rowSpan="2" className={TH}>Unit</th>
          <th rowSpan="2" className={TH}>Calibration point</th>
          <th rowSpan="2" className={TH}>Std at 24 &plusmn;1 (&deg;C)</th>
          <th rowSpan="2" className={TH}>Std at Room Temp (&deg;C)</th>
          <th colSpan="5" className={TH}>Observed (F)</th>
          <th colSpan="4" className={TH}>Relative Indicative Error</th>
          <th rowSpan="2" className={TH}>Relative indication error q in %</th>
          <th rowSpan="2" className={TH}>Repatability b in %</th>
          <th rowSpan="2" className={TH}>Repatability by Standard Deviation U<sub>rep</sub> in %</th>
          <th rowSpan="2" className={TH}>Least Count</th>
          <th rowSpan="2" className={TH}>Relative Zero error in %</th>
          <th rowSpan="2" className={TH}>Relative Resolution a<sub>F</sub> in %</th>
          <th rowSpan="2" className={TH}>Relative Resolution a<sub>Z</sub> in %</th>
          <th rowSpan="2" className={TH}>Resolution UNC(U<sub>res</sub>)</th>
          <th rowSpan="2" className={TH}>Master UNC in Certificate in %</th>
          <th rowSpan="2" className={TH}>Drift in %</th>
          <th rowSpan="2" className={TH}>Master UNC. Uncertainty U<sub>std</sub> in %</th>
          <th rowSpan="2" className={TH}>Combined Uncertainty in %</th>
          <th rowSpan="2" className={TH}>K Factor</th>
          <th rowSpan="2" className={TH}>Expanded Uncertainty in %</th>
          <th rowSpan="2" className={TH}>CMC Taken</th>
        </tr>
        <tr className="bg-gray-200 text-center font-medium text-[11px]">
          <th className={TH}>1</th>
          <th className={TH}>2</th>
          <th className={TH}>3</th>
          <th className={TH}>4</th>
          <th className={TH}>Average</th>
          <th className={TH}>q1</th>
          <th className={TH}>q2</th>
          <th className={TH}>q3</th>
          <th className={TH}>q4</th>
        </tr>
      </thead>
      <tbody>
        {rows.length > 0 ? (
          rows.map((row, index) => (
            <tr key={index} className="text-center hover:bg-gray-50 transition-colors">
              <td className={TD}>{pick(row, 'sr_no', 'srNo') ?? index + 1}</td>
              <td className={TD}>{raw(pick(row, 'setpoint', 'force'))}</td>
              <td className={TD}>{raw(row.mode)}</td>
              <td className={TD}>{raw(row.unit)}</td>
              <td className={TD}>{raw(pick(row, 'calibration_point', 'calibrationPoint'))}</td>
              <td className={TD}>{raw(row.calculateduuc)}</td>
              <td className={TD}>{raw(row.uuc0)}</td>
              <td className={TD}>{raw(row.master0)}</td>
              <td className={TD}>{raw(row.master1)}</td>
              <td className={TD}>{raw(row.master2)}</td>
              <td className={TD}>{raw(row.master3)}</td>
              <td className={TD}>{raw(row.averagemaster)}</td>
              <td className={TD}>{fmt(row.q1Error, 2)}</td>
              <td className={TD}>{fmt(row.q2Error, 2)}</td>
              <td className={TD}>{fmt(row.q3Error, 2)}</td>
              <td className={TD}>{fmt(row.q4Error, 2)}</td>
              <td className={TD}>{fmt(pick(row, 'avg_error', 'avgQError'), 2)}</td>
              <td className={TD}>{fmt(pick(row, 'diff', 'diffQError'), 2)}</td>
              <td className={TD}>{fmt(row.urep, 5)}</td>
              <td className={TD}>{raw(row.leastcount)}</td>
              <td className={TD}>{raw(row.maxzeroerror)}</td>
              <td className={TD}>{fmt(row.af, 4)}</td>
              <td className={TD}>{fmt(row.az, 5)}</td>
              <td className={TD}>{fmt(row.ures, 5)}</td>
              <td className={TD}>{raw(row.masterunc)}</td>
              <td className={TD}>{fmt(row.drift ?? 0, 2)}</td>
              <td className={TD}>{fmt(row.ustd, 4)}</td>
              <td className={TD}>{fmt(pick(row, 'comuncer', 'combinedUncertainty'), 8)}</td>
              <td className={TD}>{pick(row, 'kfactor', 'coveragefactor') ?? 2}</td>
              <td className={TD}>{fmt(pick(row, 'expandeduncertainty', 'expandedUncertainty'), 3)}</td>
              <td className={TD}>{fmt(pick(row, 'cmcuncertainty', 'cmcTaken'), 3)}</td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan="31" className="border border-gray-300 px-4 py-4 text-center text-gray-500">
              No observation data available.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);

/**
 * Legacy layout, used for inwards whose table suffix is 20220306 or older.
 * Reports the raw uncertainty budget (std deviation, Type A, degrees of freedom,
 * coverage factor) instead of the relative-error breakdown.
 */
const AutmCmcTableLegacy = ({ rows }) => (
  <div className="overflow-x-auto">
    <table className="w-full border-collapse text-[12px] text-gray-700 min-w-max">
      <thead>
        <tr className="bg-gray-100 font-semibold">
          <th colSpan="11" className={`${TH} bg-gray-200 text-center`}>Type A Factor</th>
          <th colSpan="3" className={`${TH} bg-gray-200 text-center`}>Type B Factor</th>
          <th colSpan="7" className={`${TH} bg-gray-200 text-center`}>Uncertainty Measurement</th>
        </tr>
        <tr className="bg-gray-200 text-center font-medium text-[11px]">
          <th className={TH}>Sr no</th>
          <th className={TH}>Unit type</th>
          <th className={TH}>Mode</th>
          <th className={TH}>1</th>
          <th className={TH}>2</th>
          <th className={TH}>3</th>
          <th className={TH}>4</th>
          <th className={TH}>Unit</th>
          <th className={TH}>Calibration point</th>
          <th className={TH}>Average</th>
          <th className={TH}>Std Deviation</th>
          <th className={TH}>Type A</th>
          <th className={TH}>Standard Uncertainty Due to Zero Max. Error %</th>
          <th className={TH}>Uncertainty of master in %</th>
          <th className={TH}>Least Count of UUC</th>
          <th className={TH}>Standard uncertainity due to Relative Resolution (Taken Half) %</th>
          <th className={TH}>Combined Uncertainty</th>
          <th className={TH}>Degree of Freedom</th>
          <th className={TH}>Coverage Factor (k)</th>
          <th className={TH}>Expanded Uncertainty in %</th>
          <th className={TH}>CMC Taken</th>
        </tr>
      </thead>
      <tbody>
        {rows.length > 0 ? (
          rows.map((row, index) => (
            <tr key={index} className="text-center hover:bg-gray-50 transition-colors">
              <td className={TD}>{pick(row, 'sr_no', 'srNo') ?? index + 1}</td>
              <td className={TD}>{raw(pick(row, 'unit_type', 'unitType'))}</td>
              <td className={TD}>{raw(row.mode)}</td>
              <td className={TD}>{raw(row.master0)}</td>
              <td className={TD}>{raw(row.master1)}</td>
              <td className={TD}>{raw(row.master2)}</td>
              <td className={TD}>{raw(row.master3)}</td>
              <td className={TD}>{raw(row.unit)}</td>
              <td className={TD}>{raw(pick(row, 'calibration_point', 'calibrationPoint'))}</td>
              <td className={TD}>{raw(row.averagemaster)}</td>
              <td className={TD}>{fmt(row.repeatability, 5)}</td>
              <td className={TD}>{fmt(row.typea, 5)}</td>
              <td className={TD}>{raw(row.maxzeroerror)}</td>
              <td className={TD}>{raw(row.masterunc)}</td>
              <td className={TD}>{raw(row.leastcount)}</td>
              <td className={TD}>{fmt(pick(row, 'releativeresolution', 'relativeResolution'), 5)}</td>
              <td className={TD}>{fmt(pick(row, 'comuncer', 'combinedUncertainty'), 8)}</td>
              <td className={TD}>{row.dof === undefined || row.dof === null ? '-' : fmt(row.dof, 2)}</td>
              <td className={TD}>{pick(row, 'coveragefactor', 'coverageFactor', 'kfactor') ?? 2}</td>
              <td className={TD}>{fmt(pick(row, 'expandeduncertainty', 'expandedUncertainty'), 3)}</td>
              <td className={TD}>{fmt(pick(row, 'cmcuncertainty', 'cmcTaken'), 3)}</td>
            </tr>
          ))
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

/**
 * CMC table for AUTM (Automatic Universal Testing Machine).
 *
 * Mirrors the PHP cmcautm layout, which switches on the inward's table suffix.
 * `tableSuffix` is optional; without it the modern layout is used, matching how
 * every other CMC table in this folder behaves.
 */
export const AutmCmcTable = ({ data, tableSuffix }) => {
  const rows = visibleRows(data);
  return (tableSuffix && String(tableSuffix) <= '20220306')
    ? <AutmCmcTableLegacy rows={rows} />
    : <AutmCmcTableModern rows={rows} />;
};

export default AutmCmcTable;
