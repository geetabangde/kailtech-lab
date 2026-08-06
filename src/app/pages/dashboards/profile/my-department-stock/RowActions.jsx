// Import Dependencies
import PropTypes from "prop-types";

// ----------------------------------------------------------------------

// PHP: <th>Edit</th> — only shown when permission 348 is held
// The column itself is hidden via columnVisibility in index.jsx
export function RowActions({ row, table }) {
  const handleEditClick = (e) => {
    e.preventDefault();
    table.options.meta?.openEditModal?.(row.original.id);
  };

  return (
    <div className="flex items-center justify-center gap-2">
      <button
        onClick={handleEditClick}
        className="inline-flex items-center justify-center rounded-md bg-yellow-600 px-4 py-1.5 text-xs font-bold text-white transition hover:bg-yellow-700 dark:bg-yellow-700 dark:hover:bg-yellow-600 min-w-[80px]"
      >
        <span>Edit Stock</span>
      </button>
    </div>
  );
}

RowActions.propTypes = {
  row: PropTypes.object,
  table: PropTypes.object,
};
