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
  
  let formattedDate = date;
  if (typeof date === "string" && /^\d{2}\/\d{2}\/\d{4}( \d{2}:\d{2}:\d{2})?$/.test(date)) {
    formattedDate = date.split(' ')[0]; // Extract just the date part if it has time
  } else {
    const parsed = dayjs(date);
    formattedDate = parsed.isValid() ? parsed.format("DD/MM/YYYY") : date;
  }

  return (
    <span className="text-sm text-gray-700 dark:text-dark-200">
      {formattedDate}
    </span>
  );
}

export function ReturnCell({ row }) {
  const record = row.original;
  const rawStatus = record.status;
  const status = Number(rawStatus);
  const isReturnable = record.basis === "Returnable";

  if (isNaN(status) && typeof rawStatus === "string" && rawStatus.trim() !== "") {
    let colorClass = "text-gray-600 dark:text-gray-300";
    if (rawStatus.toLowerCase().includes("pending")) colorClass = "text-amber-500";
    else if (rawStatus.toLowerCase().includes("not available")) colorClass = "text-red-500";
    else if (rawStatus.toLowerCase().includes("returned") && !rawStatus.toLowerCase().includes("not returned")) colorClass = "text-emerald-600";
    
    if (rawStatus === "Checklist Pending") {
      return (
        <div className="flex flex-col gap-1 items-start">
          <span className={`${colorClass} font-medium`}>{rawStatus}</span>
          <Link to={`/dashboards/profile/my-issue-item-list/fill-checklist?hakuna=${record.gatpassnumber || record.gatepass_no || ""}`}>
            <Button color="info" className="mt-1 h-6 px-2 text-[10px] whitespace-nowrap">
              Show Pending Checklist
            </Button>
          </Link>
        </div>
      );
    }

    return <span className={`${colorClass} font-medium`}>{rawStatus}</span>;
  }

  if (status === 0 && isReturnable) {
    // Note: The API does not yet return DIN status or checklist presence for status 0.
    // Render the return checklist button here as a default if it's returnable and status is 0.
    return (
      <div className="flex flex-col gap-1 items-start">
        <span className="text-amber-600 font-semibold">Not Returned</span>
        <Link to={`/dashboards/profile/my-issue-item-list/fill-return-checklist?hakuna=${record.id}`}>
          <Button color="info" className="mt-1 h-6 px-2 text-[10px] whitespace-nowrap">
            Fill Checklist To Return
          </Button>
        </Link>
      </div>
    );
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
    return (
      <div className="flex flex-col gap-1 items-start">
        <span className="text-amber-500 font-medium">Checklist Pending</span>
        <Link to={`/dashboards/profile/my-issue-item-list/fill-checklist?hakuna=${record.gatpassnumber || record.gatepass_no || ""}`}>
          <Button color="info" className="mt-1 h-6 px-2 text-[10px] whitespace-nowrap">
            Show Pending Checklist
          </Button>
        </Link>
      </div>
    );
  } else if (status === 4) {
    return <span className="text-gray-600 font-medium">Master Validity Not Filled</span>;
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
