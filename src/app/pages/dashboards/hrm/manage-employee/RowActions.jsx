import PropTypes from "prop-types";
import { Link } from "react-router-dom";

// Local Imports
import { getStoredPermissions } from "app/navigation/dashboards";

// ----------------------------------------------------------------------

export function RowActions({ row }) {
  const permissions = getStoredPermissions() || [];

  return (
    <>
      <div className="flex items-center justify-start gap-2 flex-wrap min-w-[200px]">
        {/* Always available actions */}
        <Link
          to={`/dashboards/hrm/manage-employee/view/${row.original.id}`}
          className="inline-flex items-center justify-center rounded-md bg-blue-50 px-2 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400"
        >
          View Employee Details
        </Link>

        <Link
          to={`/dashboards/hrm/manage-employee/joining-form/${row.original.id}`}
          className="inline-flex items-center justify-center rounded-md bg-purple-50 px-2 py-1.5 text-xs font-semibold text-purple-700 transition hover:bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400"
        >
          Joining Form
        </Link>

        {permissions.includes(280) && (
          <Link
            to={`/dashboards/hrm/manage-employee/edit/${row.original.id}`}
            className="inline-flex items-center justify-center rounded-md bg-gray-50 px-2 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
          >
            Edit
          </Link>
        )}

        {/* Status 0 (Unverified) */}
        {row.original.status === 0 && (
          <>
            {permissions.includes(233) && (
              <Link
                to={`/dashboards/hrm/manage-employee/approve/${row.original.id}`}
                className="inline-flex items-center justify-center rounded-md bg-green-50 px-2 py-1.5 text-xs font-semibold text-green-700 transition hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400"
              >
                Approve
              </Link>
            )}
            {permissions.includes(279) && (
              <Link
                to={`/dashboards/hrm/manage-employee/cancel/${row.original.id}`}
                className="inline-flex items-center justify-center rounded-md bg-red-50 px-2 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400"
              >
                Cancel Form
              </Link>
            )}
          </>
        )}

        {/* Status >= 1 */}
        {row.original.status >= 1 && (
          <>
            {permissions.includes(281) && (
              <Link
                to={`/dashboards/hrm/manage-employee/permission/${row.original.id}`}
                className="inline-flex items-center justify-center rounded-md bg-orange-50 px-2 py-1.5 text-xs font-semibold text-orange-700 transition hover:bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400"
              >
                Manage Permission
              </Link>
            )}
            {/* Logic for Manage Extra Permission */}
            {permissions.includes(112) && (row.original.extra_permission_count > 0 || row.original.employeeallotment_count > 0 || row.original.has_extra_allotments) && (
              <Link
                to={`/dashboards/hrm/manage-employee/extra-permission/${row.original.id}`}
                className="inline-flex items-center justify-center rounded-md bg-green-50 px-2 py-1.5 text-xs font-semibold text-green-700 transition hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400"
              >
                Manage Extra Permission
              </Link>
            )}
          </>
        )}

        {/* Probation Review */}
        {(row.original.probation === 1 || row.original.probation === "1") && permissions.includes(282) && (
          <Link
            to={`/dashboards/hrm/manage-employee/probation-review/${row.original.id}`}
            className="inline-flex items-center justify-center rounded-md bg-yellow-50 px-2 py-1.5 text-xs font-semibold text-yellow-700 transition hover:bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400"
          >
            Probation Review
          </Link>
        )}
      </div>
    </>
  );
}

RowActions.propTypes = {
  row: PropTypes.object,
};
