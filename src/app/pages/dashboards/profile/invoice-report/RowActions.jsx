// Import Dependencies
import PropTypes from "prop-types";
import { Link } from "react-router-dom";

// ----------------------------------------------------------------------

// PHP: <th>Edit</th> — only shown when permission 348 is held
// The column itself is hidden via columnVisibility in index.jsx
export function RowActions({ row }) {
  return (
    <div className="flex items-center justify-center gap-2">
      <Link
        to={`/dashboards/profile/my-department-stock/edit/${row.original.id}`}
        className="inline-flex items-center justify-center rounded-md bg-blue-50 px-4 py-1.5 text-xs font-bold text-blue-700 transition hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 min-w-[60px]"
      >
        <span>Edit</span>
      </Link>
    </div>
  );
}

RowActions.propTypes = {
  row: PropTypes.object,
};
