import PropTypes from "prop-types";
import { useNavigate } from "react-router";

// ----------------------------------------------------------------------

export function RowActions({ row }) {
  const navigate = useNavigate();
  const lrn = row.original.lrn;

  const handleList = () => {
    // Navigate to the chemistry screen (parameter-wise list) with the LRN as the search parameter
    navigate(`/dashboards/registers/pending-for-testing-lrn-wise-list/chemists?search=${lrn}`);
  };

  return (
    <div className="flex justify-center">
      <button
        onClick={handleList}
        className="rounded-lg bg-blue-50 px-4 py-1.5 text-sm font-semibold text-blue-600 hover:bg-blue-100 focus:outline-none dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20 transition-colors"
      >
        List
      </button>
    </div>
  );
}

RowActions.propTypes = {
  row: PropTypes.object,
  table: PropTypes.object,
};
