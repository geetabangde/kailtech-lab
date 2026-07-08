import PropTypes from "prop-types";
import { Link } from "react-router-dom";

export function RowActions({ row }) {
  return (
    <div className="flex items-center justify-center">
      <Link
        to={`/dashboards/master-data/manage-labs/environmental-record/${row.original.id}`}
        className="inline-flex items-center justify-center rounded-md bg-cyan-50 px-4 py-1.5 text-xs font-semibold text-cyan-700 transition-colors hover:bg-cyan-100 dark:bg-cyan-900/30 dark:text-cyan-400"
      >
        <span>Environmental Record</span>
      </Link>
    </div>
  );
}

RowActions.propTypes = {
  row: PropTypes.object.isRequired,
};
