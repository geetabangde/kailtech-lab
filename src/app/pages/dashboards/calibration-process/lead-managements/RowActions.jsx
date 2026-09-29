import PropTypes from "prop-types";
import { Link } from "react-router-dom";

export function RowActions({ row }) {
  return (
    <div className="flex items-center justify-center">
      <Link
        to={`/dashboards/calibration-process/details/${row.original.customerId}`}
        className="inline-flex items-center justify-center rounded-md bg-blue-50 px-4 py-1.5 text-xs font-bold text-blue-700 transition hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 min-w-[60px]"
      >
        <span>Details</span>
      </Link>
    </div>
  );
}

RowActions.propTypes = {
  row: PropTypes.object.isRequired,
};
