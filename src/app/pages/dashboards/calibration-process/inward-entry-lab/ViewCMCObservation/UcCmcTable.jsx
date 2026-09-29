import { formatUncertaintyValue } from "./viewCmcUtils";

const SINGLE_MASTER = "single_master";
const DUAL_MASTER = "dual_master";

const fixed = (value, decimals = 6) => (typeof value === "number" ? value.toFixed(decimals) : value);

const mapUcRow = (item, index, tableType) => ({
  srNo: item.sr_no ?? index + 1,
  tableType,
  unitType: item.unit_type ?? "",
  mode: item.mode ?? "",
  values: Array.isArray(item.readings)
    ? item.readings
    : [item.reading_1, item.reading_2, item.reading_3, item.reading_4, item.reading_5].map((v) => v ?? ""),
  unitDesc: item.unit ?? "",
  calibrationPoint: item.calibration_point ?? "",
  average: item.average ?? "",
  stdDeviation: item.std_deviation ?? "",
  typeA: item.type_a ?? "",
  accuracyCalibrator: item.accuracy_of_master_1 ?? item.accuracy_of_calibrator ?? "",
  uncertaintyMaster: item.uncertainty_of_master_1 ?? item.uncertainty_of_master ?? "",
  accuracyMaster2: item.accuracy_of_master_2 ?? "",
  uncertaintyMaster2: item.uncertainty_of_master_2 ?? "",
  leastCount: item.least_count ?? "",
  combinedUnc: item.combined_uncertainty ?? "",
  dof: item.degree_of_freedom ?? "-",
  coverageFactor: item.coverage_factor ?? "",
  expandedUncValue: item.expanded_uncertainty_value ?? "",
  expandedUncPercent: item.expanded_uncertainty_percent ?? "",
  cmcTaken: item.cmc_taken ?? "",
  cmcScope: item.cmc_scope ?? "",
});

/**
 * Maps the "uc" suffix uncertainty rows to table rows, tagging each row as single or dual master.
 * The backend already calculates every column for this suffix, so values are shown as returned.
 *
 * Prefers the pre-partitioned `original.tables` (or the `*_table` aliases), whose sr_no restarts
 * per table; falls back to splitting the flat `original.data` on is_dual_master / table_type.
 */
export const mapUcCmcRows = (apiData, original) => {
  const singleRows = original?.tables?.single_master ?? original?.single_master_table;
  const dualRows = original?.tables?.dual_master ?? original?.dual_master_table;

  if (Array.isArray(singleRows) || Array.isArray(dualRows)) {
    return [
      ...(singleRows ?? []).map((item, i) => mapUcRow(item, i, SINGLE_MASTER)),
      ...(dualRows ?? []).map((item, i) => mapUcRow(item, i, DUAL_MASTER)),
    ];
  }

  const rows = Array.isArray(apiData) ? apiData : [];
  const isDual = (item) => item.is_dual_master === true || item.table_type === DUAL_MASTER;
  const flatSingle = rows.filter((item) => !isDual(item));
  const flatDual = rows.filter(isDual);

  // Flat data numbers rows 1..N across both groups, so renumber per table when splitting
  if (flatDual.length === 0) return rows.map((item, i) => mapUcRow(item, i, SINGLE_MASTER));
  return [
    ...flatSingle.map((item, i) => mapUcRow({ ...item, sr_no: i + 1 }, i, SINGLE_MASTER)),
    ...flatDual.map((item, i) => mapUcRow({ ...item, sr_no: i + 1 }, i, DUAL_MASTER)),
  ];
};

const UcTable = ({ data, showMaster2 }) => (
  <div className="overflow-x-auto">
    <table className="w-full border-collapse text-[12px] text-gray-700 min-w-max">
      <thead>
        <tr className="bg-gray-100">
          <th colSpan="13" className="border border-gray-300 px-2 py-2 bg-gray-200 font-semibold text-center">
            Type A Factor
          </th>
          <th colSpan={showMaster2 ? 5 : 3} className="border border-gray-300 px-2 py-2 bg-gray-200 font-semibold text-center">
            Type B Factor
          </th>
          <th colSpan="7" className="border border-gray-300 px-2 py-2 bg-gray-200 font-semibold text-center">
            Uncertainty Measurement
          </th>
        </tr>
        <tr className="bg-gray-200 text-center text-[12px] font-medium">
          <th className="border border-gray-300 px-2 py-2">Sr no</th>
          <th className="border border-gray-300 px-2 py-2">Unit Type</th>
          <th className="border border-gray-300 px-2 py-2">Mode</th>
          <th className="border border-gray-300 px-2 py-2">1</th>
          <th className="border border-gray-300 px-2 py-2">2</th>
          <th className="border border-gray-300 px-2 py-2">3</th>
          <th className="border border-gray-300 px-2 py-2">4</th>
          <th className="border border-gray-300 px-2 py-2">5</th>
          <th className="border border-gray-300 px-2 py-2">Unit</th>
          <th className="border border-gray-300 px-2 py-2">Calibration point</th>
          <th className="border border-gray-300 px-2 py-2">Average</th>
          <th className="border border-gray-300 px-2 py-2">Std Deviation</th>
          <th className="border border-gray-300 px-2 py-2">Type A</th>
          <th className="border border-gray-300 px-2 py-2">{showMaster2 ? "Accuracy Of Master 1" : "Accuracy Of Calibrator in Value"}</th>
          <th className="border border-gray-300 px-2 py-2">{showMaster2 ? "Uncertainty of Master 1 in %" : "Uncertainty of master in %"}</th>
          {showMaster2 && (
            <>
              <th className="border border-gray-300 px-2 py-2">Accuracy Of Master 2</th>
              <th className="border border-gray-300 px-2 py-2">Uncertainty of Master 2</th>
            </>
          )}
          <th className="border border-gray-300 px-2 py-2">Least Count</th>
          <th className="border border-gray-300 px-2 py-2">Combined Uncertainty</th>
          <th className="border border-gray-300 px-2 py-2">Degree of Freedom</th>
          <th className="border border-gray-300 px-2 py-2">Coverage Factor (k)</th>
          <th className="border border-gray-300 px-2 py-2">Expanded Uncertainty in Value</th>
          <th className="border border-gray-300 px-2 py-2">Expanded Uncertainty in %</th>
          <th className="border border-gray-300 px-2 py-2">CMC Taken</th>
          <th className="border border-gray-300 px-2 py-2">CMC Scope</th>
        </tr>
      </thead>
      <tbody>
        {data.map((row, i) => (
          <tr key={i} className="hover:bg-gray-50 text-center">
            <td className="border border-gray-300 px-2 py-2">{row.srNo}</td>
            <td className="border border-gray-300 px-2 py-2">{row.unitType}</td>
            <td className="border border-gray-300 px-2 py-2">{row.mode}</td>
            {row.values.map((v, idx) => (
              <td key={idx} className="border border-gray-300 px-2 py-2">{v}</td>
            ))}
            <td className="border border-gray-300 px-2 py-2">{row.unitDesc}</td>
            <td className="border border-gray-300 px-2 py-2">{row.calibrationPoint}</td>
            <td className="border border-gray-300 px-2 py-2">{fixed(row.average)}</td>
            <td className="border border-gray-300 px-2 py-2">{formatUncertaintyValue(row.stdDeviation, 6)}</td>

            <td className="border border-gray-300 px-2 py-2">{formatUncertaintyValue(row.typeA, 6)}</td>
            <td className="border border-gray-300 px-2 py-2">{fixed(row.accuracyCalibrator)}</td>
            <td className="border border-gray-300 px-2 py-2">{fixed(row.uncertaintyMaster)}</td>
            {showMaster2 && (
              <>
                <td className="border border-gray-300 px-2 py-2">{fixed(row.accuracyMaster2)}</td>
                <td className="border border-gray-300 px-2 py-2">{fixed(row.uncertaintyMaster2)}</td>
              </>
            )}
            <td className="border border-gray-300 px-2 py-2">{row.leastCount}</td>

            <td className="border border-gray-300 px-2 py-2">{fixed(row.combinedUnc)}</td>
            <td className="border border-gray-300 px-2 py-2">{fixed(row.dof, 2)}</td>
            <td className="border border-gray-300 px-2 py-2">{fixed(row.coverageFactor, 2)}</td>
            <td className="border border-gray-300 px-2 py-2">{fixed(row.expandedUncValue)}</td>
            <td className="border border-gray-300 px-2 py-2">{fixed(row.expandedUncPercent)}</td>
            <td className="border border-gray-300 px-2 py-2">{fixed(row.cmcTaken)}</td>
            <td className="border border-gray-300 px-2 py-2">{fixed(row.cmcScope)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const unitTypesOf = (rows) => [...new Set(rows.map((row) => row.unitType).filter(Boolean))].join(", ");

export const UcCmcTable = ({ data }) => {
  const singleRows = data.filter((row) => row.tableType !== DUAL_MASTER);
  const dualRows = data.filter((row) => row.tableType === DUAL_MASTER);

  // Only one master type (or observationuc rows without tableType): keep the single-table layout
  if (dualRows.length === 0) return <UcTable data={singleRows} showMaster2={false} />;

  return (
    <div className="space-y-6">
      {singleRows.length > 0 && (
        <div>
          <h3 className="text-base font-semibold text-gray-800 mb-2">
            Table 1: Single Master Calibration Points{unitTypesOf(singleRows) && ` (${unitTypesOf(singleRows)})`}
          </h3>
          <UcTable data={singleRows} showMaster2={false} />
        </div>
      )}
      <div>
        <h3 className="text-base font-semibold text-gray-800 mb-2">
          Table {singleRows.length > 0 ? 2 : 1}: Dual Master Calibration Points{unitTypesOf(dualRows) && ` (${unitTypesOf(dualRows)})`}
        </h3>
        <UcTable data={dualRows} showMaster2 />
      </div>
    </div>
  );
};

export default UcCmcTable;
