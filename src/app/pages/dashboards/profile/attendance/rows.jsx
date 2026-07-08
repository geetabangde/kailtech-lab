import dayjs from "dayjs";
import PropTypes from "prop-types";

// ----------------------------------------------------------------------

export function DateCell({ getValue }) {
  const date = getValue();
  return (
    <span className="font-semibold text-gray-800 dark:text-dark-100">
      {date ? dayjs(date).format("DD/MM/YYYY") : "—"}
    </span>
  );
}

export function InTimeCell({ getValue }) {
  const time = getValue();
  if (!time || time === "0000-00-00 00:00:00") {
    return <span className="text-red-500 font-semibold text-xs-plus">In Punch Missing</span>;
  }

  // Format the time part
  // Usually the time can be a full date-time string (e.g. "2026-05-30 10:15:30") or just time ("10:15:30")
  const parsedTime = dayjs(time, "HH:mm:ss").isValid() ? dayjs(time, "HH:mm:ss") : dayjs(time);
  return (
    <span className="font-mono text-xs-plus font-medium text-gray-700 dark:text-dark-200">
      {parsedTime.isValid() ? parsedTime.format("hh:mm:55 A") : time}
    </span>
  );
}

export function OutTimeCell({ getValue }) {
  const time = getValue();
  if (!time || time === "0000-00-00 00:00:00") {
    return <span className="text-red-500 font-semibold text-xs-plus">Out Punch Missing</span>;
  }

  const parsedTime = dayjs(time, "HH:mm:ss").isValid() ? dayjs(time, "HH:mm:ss") : dayjs(time);
  return (
    <span className="font-mono text-xs-plus font-medium text-gray-700 dark:text-dark-200">
      {parsedTime.isValid() ? parsedTime.format("hh:mm:55 A") : time}
    </span>
  );
}

export function AttendanceStatusCell({ row }) {
  const att = row.original.attandence || row.original.attendance;
  if (!att) return <span className="text-gray-400">—</span>;

  let displayStatus = att;
  if (att === "H") {
    displayStatus = "S";
  } else if (att === "PL") {
    displayStatus = "PH/Comp Off";
  }

  return (
    <span className="font-semibold text-gray-800 dark:text-dark-100">
      {displayStatus}
    </span>
  );
}

DateCell.propTypes = {
  getValue: PropTypes.func.isRequired,
};

InTimeCell.propTypes = {
  getValue: PropTypes.func.isRequired,
};

OutTimeCell.propTypes = {
  getValue: PropTypes.func.isRequired,
};

AttendanceStatusCell.propTypes = {
  row: PropTypes.object.isRequired,
};
