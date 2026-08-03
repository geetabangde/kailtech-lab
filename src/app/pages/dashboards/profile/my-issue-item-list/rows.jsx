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
    const lowerStatus = rawStatus.toLowerCase();

    if (lowerStatus.includes("pending")) colorClass = "text-amber-500";
    else if (lowerStatus.includes("not available")) colorClass = "text-red-500";
    else if (lowerStatus.includes("returned") && !lowerStatus.includes("not returned")) colorClass = "text-emerald-600";

    if (lowerStatus.includes("checklist pending")) {
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

    if (lowerStatus.includes("fill checklist to return") || lowerStatus === "not returned") {
      return (
        <div className="flex flex-col gap-1 items-start">
          <Link to={`/dashboards/profile/my-issue-item-list/fill-return-checklist?hakuna=${record.id || record.gatpassnumber || record.gatepass_no || ""}`}>
            <Button color="info" className="mt-1 h-6 px-2 text-[10px] whitespace-nowrap">
              Fill Checklist To Return
            </Button>
          </Link>
        </div>
      );
    }

    if (lowerStatus.includes("returned by")) {
      const match = rawStatus.match(/returned by\s*:\s*(.*?)\s*(?:\((.*?)\))?$/i);
      let name = rawStatus;
      let date = "";
      if (match) {
        name = match[1].trim();
        date = match[2] ? match[2].trim() : "";
      }

      return (
        <div className="flex flex-col items-start text-xs text-gray-700 leading-tight">
          <span>{name}</span>
          {date && <span>{date}</span>}
          <Link to={`/dashboards/profile/my-issue-item-list/view-checklist?hakuna=${record.gatpassnumber || record.gatepass_no || ""}`}>
            <Button
              color="info"
              className="mt-1 h-6 px-2 text-[10px] whitespace-nowrap"
            >
              &laquo; View Checklist {record.gatpassnumber || record.gatepass_no || ""}
            </Button>
          </Link>
        </div>
      );
    }

    return <span className={`${colorClass} font-medium`}>{rawStatus}</span>;
  }

  if (status === 0 && isReturnable) {
    // Note: The API does not yet return DIN status or checklist presence for status 0.
    // We add defensive checks here in case the API provides these fields in the future.
    const hasChecklist = record.numchecklist1 > 0 || record.numchecklist2 > 0 || record.has_checklist;
    const isDinApproved = record.dinstatus === 1 || record.din_status === 1 || record.din_approved;

    if (Object.prototype.hasOwnProperty.call(record, "dinstatus") || Object.prototype.hasOwnProperty.call(record, "din_status") || Object.prototype.hasOwnProperty.call(record, "has_checklist")) {
      if (hasChecklist) {
        if (isDinApproved) {
          return (
            <div className="flex flex-col gap-1 items-start">
              <Link to={`/dashboards/profile/my-issue-item-list/fill-return-checklist?hakuna=${record.id}`}>
                <Button color="info" className="mt-1 h-6 px-2 text-[10px] whitespace-nowrap">
                  Fill Checklist To Return
                </Button>
              </Link>
              <span className="text-gray-500 font-medium text-xs">Not Returned</span>
            </div>
          );
        } else {
          return (
            <div className="flex flex-col gap-1 items-start">
              <span className="text-red-500 font-medium">Din Yet Not Approved</span>
              <span className="text-gray-500 font-medium text-xs">Not Returned</span>
            </div>
          );
        }
      } else {
        return <span className="text-gray-500 font-medium">Not Returned</span>;
      }
    }

    // Render the return checklist button here as a default fallback
    return (
      <div className="flex flex-col gap-1 items-start">
        <Link to={`/dashboards/profile/my-issue-item-list/fill-return-checklist?hakuna=${record.id}`}>
          <Button color="info" className="mt-1 h-6 px-2 text-[10px] whitespace-nowrap">
            Fill Checklist To Return
          </Button>
        </Link>
        <span className="text-gray-500 font-medium text-xs">Not Returned</span>
      </div>
    );
  } else if (status === 1) {
    const returnDate = record.returnon && record.returnon !== "0000-00-00 00:00:00"
      ? dayjs(record.returnon).format("DD/MM/YYYY")
      : "";

    return (
      <div className="flex flex-col items-start text-xs text-gray-700 leading-tight">
        <span>{record.returnby_name || record.returnby || "—"}</span>
        {returnDate && <span>{returnDate}</span>}
        <Link to={`/dashboards/profile/my-issue-item-list/view-checklist?hakuna=${record.gatpassnumber || record.gatepass_no}`}>
          <Button
            color="info"
            className="mt-1 h-6 px-2 text-[10px] whitespace-nowrap"
          >
            &laquo; View Checklist {record.gatpassnumber || record.gatepass_no || ""}
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
