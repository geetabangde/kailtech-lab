import PropTypes from "prop-types";
import clsx from "clsx";
import { statusCodesMap, statusColorsMap } from "./data";

// ----------------------------------------------------------------------

export function RefNoCell({ getValue }) {
  return (
    <span className="font-mono font-bold text-blue-600 dark:text-blue-400 tracking-wide text-xs-plus bg-blue-50/50 dark:bg-blue-900/10 px-1.5 py-0.5 rounded-md border border-blue-150/60 dark:border-blue-900/35">
      {getValue() || "—"}
    </span>
  );
}

RefNoCell.propTypes = {
  getValue: PropTypes.func.isRequired,
};

export function TypeCell({ getValue }) {
  const val = String(getValue() || "NC Work");
  const isCc = val.toLowerCase().includes("complaint") || val.toLowerCase() === "cc";
  
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold border",
        isCc
          ? "text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-950/20 dark:text-rose-450 dark:border-rose-900/30"
          : "text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:text-amber-450 dark:border-amber-900/30"
      )}
    >
      {isCc ? "Customer Complaint" : "NC Work"}
    </span>
  );
}

TypeCell.propTypes = {
  getValue: PropTypes.func.isRequired,
};

export function StatusCell({ getValue }) {
  const val = getValue();
  const statusStr = statusCodesMap[val] !== undefined ? statusCodesMap[val] : String(val || "RCA is pending");
  
  const colorClass =
    statusColorsMap[statusStr] ||
    statusColorsMap[val] ||
    "text-gray-500 bg-gray-50 border-gray-250 dark:bg-gray-800/20 dark:text-dark-200";

  return (
    <span className={clsx("inline-flex items-center rounded-md px-2.5 py-1 text-xs font-bold border leading-snug whitespace-normal max-w-[180px]", colorClass)}>
      {statusStr}
    </span>
  );
}

StatusCell.propTypes = {
  getValue: PropTypes.func.isRequired,
};

export function ProgressCell({ getValue }) {
  const pct = Number(getValue() ?? 100);
  
  return (
    <div className="flex items-center gap-2.5 w-full max-w-[150px]">
      <div className="grow bg-gray-200 dark:bg-dark-600 rounded-full h-1.5 overflow-hidden">
        <div
          className={clsx(
            "h-full rounded-full transition-all duration-500",
            pct === 100 ? "bg-emerald-500" : pct > 40 ? "bg-amber-500" : "bg-rose-500"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-bold text-gray-700 dark:text-dark-200 font-mono w-9 text-right">
        {pct}%
      </span>
    </div>
  );
}

ProgressCell.propTypes = {
  getValue: PropTypes.func.isRequired,
};

export function StandardCell({ getValue }) {
  const val = getValue();
  return (
    <span className="text-xs-plus font-medium text-gray-850 dark:text-dark-100 truncate block max-w-[240px] whitespace-pre-wrap leading-relaxed">
      {val || "—"}
    </span>
  );
}

StandardCell.propTypes = {
  getValue: PropTypes.func.isRequired,
};
