import PropTypes from "prop-types";
import clsx from "clsx";
import { statusMap, activeMap } from "./data";

// ----------------------------------------------------------------------

export function KRATextCell({ getValue }) {
  const val = getValue();
  return (
    <span className="text-sm font-medium text-gray-800 dark:text-dark-100 truncate block max-w-sm whitespace-pre-wrap leading-relaxed">
      {val || "—"}
    </span>
  );
}

export function KRAStatusCell({ getValue }) {
  const value = String(getValue() || "0");
  const label = statusMap[value] || "Not Accepted";
  const isAccepted = value === "1" || label.toLowerCase().includes("accepted");

  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold border",
        isAccepted
          ? "text-emerald-600 bg-emerald-50 border-emerald-250 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50"
          : "text-amber-600 bg-amber-50 border-amber-250 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/50"
      )}
    >
      {label}
    </span>
  );
}

export function KRAActiveCell({ getValue }) {
  const value = String(getValue() || "0");
  const label = activeMap[value] || "Not Accepted";

  let badgeColor = "text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-800/30";

  if (value === "1") {
    // Accepted
    badgeColor = "text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-800/30";
  } else if (value === "2") {
    // Self Assessed
    badgeColor = "text-sky-600 bg-sky-50 border-sky-200 dark:bg-sky-900/10 dark:border-sky-800/30";
  } else if (value === "3") {
    // Assessed 1
    badgeColor = "text-indigo-600 bg-indigo-50 border-indigo-200 dark:bg-indigo-900/10 dark:border-indigo-800/30";
  } else if (value === "4") {
    // Assessed 2
    badgeColor = "text-purple-600 bg-purple-50 border-purple-200 dark:bg-purple-900/10 dark:border-purple-800/30";
  } else if (value === "5") {
    // In Active
    badgeColor = "text-gray-500 bg-gray-50 border-gray-200 dark:bg-gray-800/20 dark:border-gray-700/30";
  }

  return (
    <span className={clsx("inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold border", badgeColor)}>
      {label}
    </span>
  );
}

export function KRAMarkCell({ getValue }) {
  const val = Number(getValue() || 0);
  
  if (val === 0) {
    return <span className="text-xs text-gray-400 dark:text-dark-400 font-mono font-semibold">—</span>;
  }

  let ratingColor = "text-rose-600 bg-rose-50 border-rose-250 dark:bg-rose-950/20 dark:text-rose-450";
  if (val >= 9.0) {
    ratingColor = "text-emerald-600 bg-emerald-50 border-emerald-250 dark:bg-emerald-950/20 dark:text-emerald-450";
  } else if (val >= 7.5) {
    ratingColor = "text-blue-600 bg-blue-50 border-blue-250 dark:bg-blue-950/20 dark:text-blue-450";
  } else if (val >= 5.0) {
    ratingColor = "text-amber-600 bg-amber-50 border-amber-250 dark:bg-amber-950/20 dark:text-amber-450";
  }

  return (
    <span className={clsx("inline-flex items-center rounded-md px-2.5 py-0.5 font-mono text-xs font-bold border", ratingColor)}>
      {val.toFixed(1)} / 10
    </span>
  );
}

KRATextCell.propTypes = {
  getValue: PropTypes.func.isRequired,
};

KRAStatusCell.propTypes = {
  getValue: PropTypes.func.isRequired,
};

KRAActiveCell.propTypes = {
  getValue: PropTypes.func.isRequired,
};

KRAMarkCell.propTypes = {
  getValue: PropTypes.func.isRequired,
};
