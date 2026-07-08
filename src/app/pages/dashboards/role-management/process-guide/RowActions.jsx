import PropTypes from "prop-types";
import { Link } from "react-router-dom";

// ----------------------------------------------------------------------

export function RowActions({ row }) {
  return (
    <div className="flex items-center justify-center gap-2">
      <Link
        to={`/dashboards/role-management/process-guide/view/${row.original.id}`}
        className="inline-flex px-3 py-1 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
        title="View Details"
      >
        View
      </Link>
    </div>
  );
}

RowActions.propTypes = {
  row: PropTypes.object,
};
