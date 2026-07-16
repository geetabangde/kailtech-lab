import { Link } from "react-router-dom";
import PropTypes from "prop-types";

// ----------------------------------------------------------------------

export function RowActions({ row }) {
  const id = row.original.id;

  return (
    <>
      <div className="flex justify-center items-center space-x-2">
        {/* Edit Button */}
        <Link
          to={`/dashboards/testing/test-permissible-values/edit/${id}`}
          className="flex h-8 items-center rounded-lg bg-blue-50 px-3 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400"
        >
          Edit
        </Link>
      </div>
    </>
  );
}

RowActions.propTypes = {
  row: PropTypes.object,
};
