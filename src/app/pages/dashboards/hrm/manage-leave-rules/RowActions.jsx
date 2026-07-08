// Import Dependencies
import PropTypes from "prop-types";
import { Link } from "react-router-dom";

// Local Imports
import { getStoredPermissions } from "app/navigation/dashboards";

// ----------------------------------------------------------------------

export function RowActions({ row }) {
  const permissions = getStoredPermissions();

  return (
    <div className="flex items-center justify-center gap-2">
      {permissions.includes(235) ? (
        <Link
          to={`/dashboards/hrm/manage-leave-rules/edit/${row.original.id}`}
          className="inline-flex items-center justify-center rounded-md bg-blue-50 px-4 py-1.5 text-xs font-bold text-blue-700 transition hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 min-w-[60px]"
        >
          Edit
        </Link>
      ) : (
        <span className="text-xs text-gray-400 italic">No Actions</span>
      )}
    </div>
  );
}

RowActions.propTypes = {
  row: PropTypes.object.isRequired,
};
