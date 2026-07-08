import dayjs from "dayjs";
import PropTypes from "prop-types";
import clsx from "clsx";
import { statusMap } from "./data";

// ----------------------------------------------------------------------

export function MOMDateCell({ getValue }) {
  const date = getValue();
  return (
    <span className="text-sm font-medium text-gray-700 dark:text-dark-200">
      {date ? dayjs(date).format("DD/MM/YYYY") : "—"}
    </span>
  );
}

export function MOMNumberCell({ getValue }) {
  const number = getValue();
  return (
    <span className="font-mono text-xs-plus font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-md">
      {number || "—"}
    </span>
  );
}

export function MOMTextCell({ getValue }) {
  const text = getValue();
  return (
    <span className="text-sm font-medium text-gray-800 dark:text-dark-100 truncate block max-w-xs">
      {text || "—"}
    </span>
  );
}

export function MOMStatusCell({ getValue }) {
  const value = getValue();
  const label = statusMap[value] || value || "Open";
  const lowerLabel = String(label).toLowerCase();

  let badgeColor = "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/30";

  if (lowerLabel.includes("progress")) {
    badgeColor = "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800/30";
  } else if (lowerLabel.includes("completed")) {
    badgeColor = "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/30";
  } else if (lowerLabel.includes("closed")) {
    badgeColor = "text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/20 border-gray-200 dark:border-gray-700/30";
  } else if (lowerLabel.includes("approval") || lowerLabel.includes("pending")) {
    badgeColor = "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/10 border-indigo-200 dark:border-indigo-800/30";
  }

  return (
    <span className={clsx("inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold border", badgeColor)}>
      {label}
    </span>
  );
}

export function MOMCompletionStatusCell({ getValue }) {
  const pct = Number(getValue() || 0);

  let barColor = "bg-amber-500";
  if (pct >= 100) barColor = "bg-emerald-500";
  else if (pct >= 50) barColor = "bg-blue-500";

  return (
    <div className="flex items-center gap-3 w-40 max-w-full">
      <div className="relative h-2 w-full rounded-full bg-gray-150 dark:bg-dark-500 overflow-hidden">
        <div
          className={clsx("absolute top-0 bottom-0 left-0 rounded-full transition-all duration-500", barColor)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="font-mono text-xs-plus font-bold text-gray-700 dark:text-dark-200 min-w-8 text-right">
        {pct}%
      </span>
    </div>
  );
}

MOMDateCell.propTypes = {
  getValue: PropTypes.func.isRequired,
};

MOMNumberCell.propTypes = {
  getValue: PropTypes.func.isRequired,
};

MOMTextCell.propTypes = {
  getValue: PropTypes.func.isRequired,
};

MOMStatusCell.propTypes = {
  getValue: PropTypes.func.isRequired,
};

MOMCompletionStatusCell.propTypes = {
  getValue: PropTypes.func.isRequired,
};
