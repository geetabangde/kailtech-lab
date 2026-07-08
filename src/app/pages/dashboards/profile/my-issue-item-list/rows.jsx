import dayjs from "dayjs";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { Button } from "components/ui";

// ----------------------------------------------------------------------

export function GatePassCell({ getValue }) {
  const gatepassNo = getValue();
  if (!gatepassNo) return <span className="text-gray-400">—</span>;

  return (
    <Link
      to={`/dashboards/inventory/issue-return/print-gatepass?hakuna=${gatepassNo}`}
      className="text-red-500 font-semibold hover:underline"
    >
      {gatepassNo}
    </Link>
  );
}

export function DateCell({ getValue }) {
  const date = getValue();
  if (!date || date === "0000-00-00" || date === "0000-00-00 00:00:00") {
    return <span className="text-gray-400">—</span>;
  }
  return (
    <span className="text-sm text-gray-700 dark:text-dark-200">
      {dayjs(date).format("DD/MM/YYYY")}
    </span>
  );
}

export function ReturnCell({ row }) {
  const record = row.original;
  const status = Number(record.status);
  const isReturnable = record.basis === "Returnable";

  if (status === 0 && isReturnable) {
    return <span className="text-amber-600 font-semibold">Not Returned</span>;
  } else if (status === 1) {
    const returnDate = record.returnon && record.returnon !== "0000-00-00 00:00:00"
      ? dayjs(record.returnon).format("DD/MM/YYYY")
      : "";

    return (
      <div className="flex flex-col gap-1 items-start">
        <span className="text-xs font-semibold text-emerald-600">Returned</span>
        <span className="text-[10px] text-gray-500">By: {record.returnby_name || record.returnby || "—"}</span>
        {returnDate && <span className="text-[10px] text-gray-400 font-mono">{returnDate}</span>}
        <Link to={`/dashboards/inventory/issue-return/view-checklist?hakuna=${record.gatpassnumber || record.gatepass_no}`}>
          <Button
            color="info"
            variant="outline"
            className="mt-1 h-6 px-2 text-[10px] whitespace-nowrap"
          >
            &laquo; View Checklist
          </Button>
        </Link>
      </div>
    );
  } else if (status === -1) {
    return <span className="text-amber-500 font-medium">Checklist Pending</span>;
  } else if (!isReturnable) {
    return <span className="text-gray-400">Non Returnable</span>;
  }

  return <span className="text-gray-400">—</span>;
}

GatePassCell.propTypes = {
  getValue: PropTypes.func.isRequired,
};

DateCell.propTypes = {
  getValue: PropTypes.func.isRequired,
};

ReturnCell.propTypes = {
  row: PropTypes.object.isRequired,
};
