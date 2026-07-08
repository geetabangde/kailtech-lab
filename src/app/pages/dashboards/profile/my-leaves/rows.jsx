import dayjs from "dayjs";
import PropTypes from "prop-types";
import { LEAVE_TYPE_MAP } from "./data";

// ----------------------------------------------------------------------

export function UserNameCell({ getValue }) {
  const name = getValue();
  return (
    <span className="font-semibold text-gray-800 dark:text-dark-100">
      {name || "—"}
    </span>
  );
}

export function LeaveTypeCell({ getValue }) {
  const leaveType = getValue();
  const label = LEAVE_TYPE_MAP[leaveType] || leaveType || "—";
  return (
    <span className="font-medium text-gray-700 dark:text-dark-200">
      {label}
    </span>
  );
}

export function DateCell({ getValue }) {
  const date = getValue();
  const isInvalid = !date || date === "0000-00-00" || date.startsWith("0000-00-00");
  return (
    <span className="text-sm text-gray-700 dark:text-dark-200">
      {isInvalid ? "—" : dayjs(date).format("DD/MM/YYYY")}
    </span>
  );
}

export function AppliedOnCell({ getValue }) {
  const date = getValue();
  const isInvalid = !date || date === "0000-00-00 00:00:00" || date.startsWith("0000-00-00");
  return (
    <span className="font-mono text-xs-plus text-gray-600 dark:text-dark-300">
      {isInvalid ? "—" : dayjs(date).format("DD/MM/YYYY HH:mm:ss")}
    </span>
  );
}

export function ApprovedAtCell({ row }) {
  const { status, approved_on } = row.original;
  if (status == 0 || !approved_on || approved_on === "0000-00-00 00:00:00") {
    return <span className="text-gray-400 dark:text-dark-400">—</span>;
  }
  return (
    <span className="font-mono text-xs-plus text-gray-600 dark:text-dark-300">
      {dayjs(approved_on).format("DD/MM/YYYY HH:mm:ss")}
    </span>
  );
}

export function ApprovedByCell({ getValue }) {
  const approvedBy = getValue();
  return (
    <span className="font-medium text-gray-700 dark:text-dark-200">
      {approvedBy || "—"}
    </span>
  );
}

export function DaysCell({ row }) {
  const { startdate, enddate } = row.original;
  if (!startdate || !enddate) return <span className="text-gray-400">—</span>;

  const d1 = dayjs(startdate).startOf("day");
  const d2 = dayjs(enddate).startOf("day");
  const diffDays = d2.diff(d1, "day") + 1;

  return (
    <span className="font-semibold text-gray-800 dark:text-dark-100">
      {diffDays} {diffDays === 1 ? "Day" : "Days"}
    </span>
  );
}

export function StatusCell({ row }) {
  const status = row.original.status;
  if (status == 1) {
    return <span className="text-success font-semibold">Approved</span>;
  }
  if (status == 2) {
    return <span className="text-danger font-semibold">Rejected</span>;
  }
  return <span className="text-warning font-semibold">Pending</span>;
}

UserNameCell.propTypes = {
  getValue: PropTypes.func.isRequired,
};

LeaveTypeCell.propTypes = {
  getValue: PropTypes.func.isRequired,
};

DateCell.propTypes = {
  getValue: PropTypes.func.isRequired,
};

AppliedOnCell.propTypes = {
  getValue: PropTypes.func.isRequired,
};

ApprovedAtCell.propTypes = {
  row: PropTypes.object.isRequired,
};

ApprovedByCell.propTypes = {
  getValue: PropTypes.func.isRequired,
};

DaysCell.propTypes = {
  row: PropTypes.object.isRequired,
};

StatusCell.propTypes = {
  row: PropTypes.object.isRequired,
};
