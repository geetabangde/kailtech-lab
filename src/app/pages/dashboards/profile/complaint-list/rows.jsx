import PropTypes from "prop-types";
import { statusMap } from "./data";

// ----------------------------------------------------------------------

export function StatusCell({ getValue }) {
  const value = getValue();
  
  // Try to find the status string or use the value itself
  let label = "Pending For Allotment";
  let statusIndex = 0;

  if (typeof value === "number" || !isNaN(Number(value))) {
    statusIndex = Number(value);
    label = statusMap[statusIndex] || "Pending For Allotment";
  } else if (typeof value === "string" && value) {
    label = value;
    // Map string status to a default index for styling
    const lowerLabel = label.toLowerCase();
    if (lowerLabel.includes("allot")) statusIndex = 0;
    else if (lowerLabel.includes("alloted")) statusIndex = 1;
    else if (lowerLabel.includes("process")) statusIndex = 2;
    else if (lowerLabel.includes("complete")) statusIndex = 3;
    else if (lowerLabel.includes("close")) statusIndex = 4;
    else if (lowerLabel.includes("reject")) statusIndex = 5;
    else statusIndex = 0;
  }

  // Styles based on status index:
  // 0: Pending For Allotment -> Amber (Orange)
  // 1: Alloted -> Blue
  // 2: In Process -> Indigo
  // 3: Completed -> Teal
  // 4: Closed -> Muted Gray
  // 5: Rejected -> Red
  if (statusIndex === 1) {
    return <span className="text-sky-600 dark:text-sky-400 font-semibold">{label}</span>;
  }
  if (statusIndex === 2) {
    return <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{label}</span>;
  }
  if (statusIndex === 3) {
    return <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{label}</span>;
  }
  if (statusIndex === 4) {
    return <span className="text-gray-500 dark:text-gray-400 font-semibold">{label}</span>;
  }
  if (statusIndex === 5) {
    return <span className="text-rose-600 dark:text-rose-400 font-semibold">{label}</span>;
  }
  return <span className="text-amber-600 dark:text-amber-400 font-semibold">{label}</span>;
}

StatusCell.propTypes = {
  getValue: PropTypes.func.isRequired,
};
