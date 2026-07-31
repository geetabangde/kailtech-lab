import { Link } from "react-router-dom";
import PropTypes from "prop-types";

export function RowActions({ row }) {
  const id = row.original.id;
  const assignUrl = `/dashboards/action-items/assign-chemist/${id}`;

  return (
    <Link
      to={assignUrl}
      className="inline-block rounded bg-primary-600 px-2 py-1 text-[10.5px] font-semibold text-white shadow transition hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-400"
    >
      <> Assign <br /> Chemist </>
    </Link>
  );
}

RowActions.propTypes = {
  row: PropTypes.object,
};