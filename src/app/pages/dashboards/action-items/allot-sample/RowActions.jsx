import { Link } from "react-router-dom";
import PropTypes from "prop-types";

export function RowActions({ row }) {
  const id = row.original.id;
  const allotUrl = `/dashboards/action-items/allot-sample/${id}`;

  return (
    <Link
      to={allotUrl}
      className="inline-block rounded bg-red-600 px-2 py-1 text-[10.5px] font-semibold text-white shadow transition hover:bg-red-700 text-center leading-tight"
    >
      <>Allot <br /> Sample</>
    </Link>
  );
}

RowActions.propTypes = {
  row: PropTypes.object,
};