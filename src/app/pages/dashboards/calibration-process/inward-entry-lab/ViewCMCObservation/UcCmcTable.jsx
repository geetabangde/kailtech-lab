import { formatUncertaintyValue } from "./viewCmcUtils";

/**
 * Maps the "uc" suffix uncertainty rows (uncertainty.original.data) to table rows.
 * The backend already calculates every column for this suffix, so values are shown
 * as returned rather than recalculated.
 */
export const mapUcCmcRows = (apiData) => (Array.isArray(apiData) ? apiData : []).map((item, index) => ({
  srNo: item.sr_no ?? index + 1,
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
  accuracyCalibrator: item.accuracy_of_calibrator ?? "",
  uncertaintyMaster: item.uncertainty_of_master ?? "",
  leastCount: item.least_count ?? "",
  combinedUnc: item.combined_uncertainty ?? "",
  dof: item.degree_of_freedom ?? "-",
  coverageFactor: item.coverage_factor ?? "",
  expandedUncValue: item.expanded_uncertainty_value ?? "",
  expandedUncPercent: item.expanded_uncertainty_percent ?? "",
  cmcTaken: item.cmc_taken ?? "",
  cmcScope: item.cmc_scope ?? "",
}));

export const UcCmcTable = ({ data }) => (
  <div className="overflow-x-auto">
    <table className="w-full border-collapse text-[12px] text-gray-700 min-w-max">
      <thead>
        <tr className="bg-gray-100">
          <th colSpan="13" className="border border-gray-300 px-2 py-2 bg-gray-200 font-semibold text-center">
            Type A Factor
          </th>
          <th colSpan="3" className="border border-gray-300 px-2 py-2 bg-gray-200 font-semibold text-center">
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
          <th className="border border-gray-300 px-2 py-2">Accuracy Of Calibrator in Value</th>
          <th className="border border-gray-300 px-2 py-2">Uncertainty of master in %</th>
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
            <td className="border border-gray-300 px-2 py-2">{typeof row.average === 'number' ? row.average.toFixed(6) : row.average}</td>
            <td className="border border-gray-300 px-2 py-2">{typeof row.stdDeviation === 'number' ? formatUncertaintyValue(row.stdDeviation, 6) : row.stdDeviation}</td>

            <td className="border border-gray-300 px-2 py-2">{typeof row.typeA === 'number' ? formatUncertaintyValue(row.typeA, 6) : row.typeA}</td>
            <td className="border border-gray-300 px-2 py-2">{typeof row.accuracyCalibrator === 'number' ? row.accuracyCalibrator.toFixed(6) : row.accuracyCalibrator}</td>
            <td className="border border-gray-300 px-2 py-2">{typeof row.uncertaintyMaster === 'number' ? row.uncertaintyMaster.toFixed(6) : row.uncertaintyMaster}</td>
            <td className="border border-gray-300 px-2 py-2">{row.leastCount}</td>

            <td className="border border-gray-300 px-2 py-2">{typeof row.combinedUnc === 'number' ? row.combinedUnc.toFixed(6) : row.combinedUnc}</td>
            <td className="border border-gray-300 px-2 py-2">{typeof row.dof === 'number' ? row.dof.toFixed(2) : row.dof}</td>
            <td className="border border-gray-300 px-2 py-2">{typeof row.coverageFactor === 'number' ? row.coverageFactor.toFixed(2) : row.coverageFactor}</td>
            <td className="border border-gray-300 px-2 py-2">{typeof row.expandedUncValue === 'number' ? row.expandedUncValue.toFixed(6) : row.expandedUncValue}</td>
            <td className="border border-gray-300 px-2 py-2">{typeof row.expandedUncPercent === 'number' ? row.expandedUncPercent.toFixed(6) : row.expandedUncPercent}</td>
            <td className="border border-gray-300 px-2 py-2">{typeof row.cmcTaken === 'number' ? row.cmcTaken.toFixed(6) : row.cmcTaken}</td>
            <td className="border border-gray-300 px-2 py-2">{typeof row.cmcScope === 'number' ? row.cmcScope.toFixed(6) : row.cmcScope}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default UcCmcTable;
