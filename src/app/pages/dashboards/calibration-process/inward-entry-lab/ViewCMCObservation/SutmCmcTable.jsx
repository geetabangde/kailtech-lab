import { formatUncertaintyValue } from "./viewCmcUtils";

const toNumber = (val) => {
  const num = parseFloat(val);
  return isNaN(num) ? 0 : num;
};

const firstDefined = (...vals) => vals.find((v) => v !== undefined && v !== null && v !== "");

const isFilled = (val) => val !== undefined && val !== null && String(val).trim() !== "" && !isNaN(parseFloat(val));

// Repeatable values from an array field (master: [..]) or flat keys (master_0 / master0 / master_1 …)
const getRepeatables = (item, key, count = 2) => {
  if (Array.isArray(item[key])) return item[key].slice(0, count);
  return Array.from({ length: count }, (_, i) => firstDefined(item[`${key}_${i}`], item[`${key}${i}`], item[`${key}_${i + 1}`]) ?? "");
};

const mean = (vals) => (vals.length ? vals.reduce((sum, v) => sum + v, 0) / vals.length : 0);

// PHP STDDEV_SAMP over the saved master speeds
const sampleStdDev = (vals) => {
  if (vals.length < 2) return 0;
  const avg = mean(vals);
  return Math.sqrt(vals.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / (vals.length - 1));
};

/**
 * Maps the uncertainty API rows to table rows using the SUTM PHP formulas:
 *  - Std deviation: sample std dev of the set speeds (type 'master'); Type A = std dev / sqrt(2)
 *  - Average displacement / time: mean of masterinc / masterdec (each cast to 3 decimals),
 *    time converted to minutes; average speed = displacement / time
 *  - Linear scale uncertainty = CMC / 1000 (mm), stop watch uncertainty = CMC / 60 (min)
 *  - Master uncertainty = avg speed - (avg disp + u(linear)) / (avg time + u(stop watch))
 *  - Combined = sqrt(TypeA² + (u(master)/2)² + (LC/2/√3)²), k = 2
 *  - Expanded % = expanded / calibration point * 100; CMC taken = max(CMC scope, expanded %)
 */
export const mapSutmCmcRows = (apiData) => (Array.isArray(apiData) ? apiData : []).map((item, index) => {
  const speeds = getRepeatables(item, "master");
  const speedNums = speeds.filter(isFilled).map(toNumber);

  const repeatabilityRaw = firstDefined(item.std_deviation, item.repeatability);
  const repeatability = repeatabilityRaw !== undefined ? toNumber(repeatabilityRaw) : sampleStdDev(speedNums);

  // MySQL cast(value as decimal(10,3)) rounds each reading before averaging
  const displacements = getRepeatables(item, "masterinc").filter(isFilled).map((v) => Number(toNumber(v).toFixed(3)));
  const times = getRepeatables(item, "masterdec").filter(isFilled).map((v) => Number(toNumber(v).toFixed(3)));
  const averagedisp = displacements.length
    ? mean(displacements)
    : toNumber(firstDefined(item.average_displacement, item.averagedisp));
  const averagetime = times.length
    ? mean(times) / 60
    : toNumber(firstDefined(item.average_time, item.averagetime));
  const averagespeed = averagetime !== 0 ? averagedisp / averagetime : 0;

  const typea = repeatability / Math.sqrt(2);

  // Raw master CMCs are scaled as in PHP; already-scaled values are used as given
  const rawLinear = firstDefined(item.raw_uncoflinearscale, item.linear_scale_cmc);
  const uncoflinearscale = rawLinear !== undefined
    ? toNumber(rawLinear) / 1000
    : toNumber(firstDefined(item.uncertainty_linear_scale, item.uncoflinearscale));
  const rawStopwatch = firstDefined(item.raw_uncofstopwatch, item.stopwatch_cmc);
  const uncofstopwatch = rawStopwatch !== undefined
    ? toNumber(rawStopwatch) / 60
    : toNumber(firstDefined(item.uncertainty_stop_watch, item.uncofstopwatch));

  const timeWithUnc = averagetime + uncofstopwatch;
  const masterunc = timeWithUnc !== 0
    ? averagespeed - ((averagedisp + uncoflinearscale) / timeWithUnc)
    : 0;

  const leastcountRaw = firstDefined(item.least_count, item.leastcount, item.least_count_uuc);
  const leastcount = toNumber(leastcountRaw);

  const comuncer = Math.sqrt(
    Math.pow(typea, 2) +
    Math.pow(masterunc / 2, 2) +
    Math.pow(leastcount / 2 / Math.sqrt(3), 2)
  );

  // PHP: "-" when there is no repeatability (typea is then 0 too)
  const dof = repeatability !== 0 ? (Math.pow(comuncer, 4) / Math.pow(typea, 4)) * 4 : "-";
  const coveragefactor = 2;
  const expandeduncertainty = comuncer * coveragefactor;

  const testpoint = toNumber(firstDefined(item.calibration_point, item.point, item.testpoint));
  // PHP divides by the point regardless; a 0 point would be a division by zero there
  const expandeduncertaintypercent = testpoint !== 0 ? (expandeduncertainty / testpoint) * 100 : "INF";

  const tempcmc = firstDefined(item.cmcscope, item.cmc_scope, item.temp_cmc);
  const cmcTaken = typeof expandeduncertaintypercent === "number" && tempcmc !== undefined && toNumber(tempcmc) > expandeduncertaintypercent
    ? toNumber(tempcmc)
    : expandeduncertaintypercent;

  return {
    srNo: item.sr_no ?? index + 1,
    values: speeds,
    calibrationPoint: firstDefined(item.calibration_point, item.point) ?? "",
    average: firstDefined(item.averagemaster, item.average_master, item.average) ?? "",
    stdDeviation: repeatability,
    typeA: typea,
    averageDisplacement: averagedisp,
    averageTime: averagetime,
    averageSpeed: averagespeed,
    uncertaintyLinearScale: uncoflinearscale,
    uncertaintyStopWatch: uncofstopwatch,
    uncertaintyMaster: masterunc,
    leastCountUuc: leastcountRaw ?? "",
    combinedUncertainty: comuncer,
    degreeOfFreedom: dof,
    coverageFactor: coveragefactor,
    expandedUncertaintyValue: expandeduncertainty,
    expandedUncertaintyPercent: expandeduncertaintypercent,
    cmcTaken,
  };
});

const fmt = (val, decimals = 6) => (typeof val === "number" ? formatUncertaintyValue(val, decimals) : val);

const cellClass = "border border-gray-300 px-1 py-2";

export const SutmCmcTable = ({ data }) => (
  <div className="overflow-x-auto">
    <table className="w-full border-collapse text-[12px] text-gray-700 min-w-max">
      <thead>
        <tr className="bg-gray-100 text-center">
          {/* PHP has colspans 11 / 3 / 5, but the groups are 10 / 4 / 6 columns wide */}
          <th colSpan="10" className={`${cellClass} bg-gray-200 font-semibold text-xs`}>
            Type A Factor
          </th>
          <th colSpan="4" className={`${cellClass} bg-gray-200 font-semibold text-xs`}>
            Type B Factor
          </th>
          <th colSpan="6" className={`${cellClass} bg-gray-200 font-semibold text-xs`}>
            Uncertainty Measurement
          </th>
        </tr>
        <tr className="bg-gray-200 text-center text-[12px] font-medium">
          <th className={cellClass}>Sr no</th>
          <th className={cellClass}>1</th>
          <th className={cellClass}>2</th>
          <th className={cellClass}>Calibration point</th>
          <th className={cellClass}>Average</th>
          <th className={cellClass}>Std Deviation</th>
          <th className={cellClass}>Type A</th>
          <th className={cellClass}>Average Displacement (mm)</th>
          <th className={cellClass}>Average Time (min)</th>
          <th className={cellClass}>Average Speed (mm/min)</th>
          <th className={cellClass}>Uncertainty of Linear Scale in mm</th>
          <th className={cellClass}>Uncertainty of Stop Watch in (min)</th>
          <th className={cellClass}>Uncertainty of master in mm/min</th>
          <th className={cellClass}>Least Count of UUC (mm/min)</th>
          <th className={cellClass}>Combined Uncertainty</th>
          <th className={cellClass}>Degree of Freedom</th>
          <th className={cellClass}>Coverage Factor (k)</th>
          <th className={cellClass}>Expanded Uncertainty in Value</th>
          <th className={cellClass}>Expanded Uncertainty in %</th>
          <th className={cellClass}>CMC Taken</th>
        </tr>
      </thead>
      <tbody>
        {(data || []).map((row, i) => (
          <tr key={i} className="hover:bg-gray-50 text-center text-[12px]">
            <td className={cellClass}>{row.srNo}</td>
            {(row.values || []).map((v, idx) => (
              <td key={idx} className={cellClass}>{v}</td>
            ))}
            <td className={cellClass}>{row.calibrationPoint}</td>
            <td className={cellClass}>{row.average}</td>
            <td className={cellClass}>{fmt(row.stdDeviation)}</td>
            <td className={cellClass}>{fmt(row.typeA)}</td>
            <td className={cellClass}>{fmt(row.averageDisplacement)}</td>
            <td className={cellClass}>{fmt(row.averageTime)}</td>
            <td className={cellClass}>{fmt(row.averageSpeed)}</td>
            <td className={cellClass}>{fmt(row.uncertaintyLinearScale)}</td>
            <td className={cellClass}>{fmt(row.uncertaintyStopWatch)}</td>
            <td className={cellClass}>{fmt(row.uncertaintyMaster)}</td>
            <td className={cellClass}>{row.leastCountUuc}</td>
            <td className={cellClass}>{fmt(row.combinedUncertainty)}</td>
            <td className={cellClass}>{row.degreeOfFreedom === "-" ? "-" : fmt(row.degreeOfFreedom, 2)}</td>
            <td className={cellClass}>{fmt(row.coverageFactor, 2)}</td>
            <td className={cellClass}>{fmt(row.expandedUncertaintyValue)}</td>
            <td className={cellClass}>{fmt(row.expandedUncertaintyPercent)}</td>
            <td className={cellClass}>{fmt(row.cmcTaken)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default SutmCmcTable;
