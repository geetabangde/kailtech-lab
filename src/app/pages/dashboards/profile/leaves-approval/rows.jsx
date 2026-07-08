import dayjs from "dayjs";
import PropTypes from "prop-types";
import { useState, useEffect } from "react";
import { getStoredPermissions } from "app/navigation/dashboards";
import { LEAVE_TYPE_MAP } from "./data";
import ApproveLeaveModal from "./ApproveLeaveModal";
import RejectLeaveModal from "./RejectLeaveModal";
import axios from "utils/axios";

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
  if (!date || date.startsWith("0000")) return <span className="text-gray-400">—</span>;
  return (
    <span className="text-sm text-gray-700 dark:text-dark-200">
      <span className="block">{dayjs(date).format("DD/MM/YYYY")}</span>
      <span className="block">{dayjs(date).format("HH:mm:ss")}</span>
    </span>
  );
}

export function DateOnlyCell({ getValue }) {
  const date = getValue();
  return (
    <span className="text-sm text-gray-700 dark:text-dark-200">
      {date ? dayjs(date).format("DD/MM/YYYY") : "—"}
    </span>
  );
}

export function AppliedOnCell({ getValue }) {
  const date = getValue();
  if (!date || date.startsWith("0000")) return <span className="text-gray-400">—</span>;
  return (
    <span className="text-sm text-gray-600 dark:text-dark-300">
      <span className="block">{dayjs(date).format("DD/MM/YYYY")}</span>
      <span className="block">{dayjs(date).format("HH:mm:ss")}</span>
    </span>
  );
}

export function ApprovedAtCell({ row }) {
  const { status, approved_on } = row.original;
  if (status == 0 || !approved_on || approved_on === "0000-00-00 00:00:00") {
    return <span className="text-gray-400 dark:text-dark-400">—</span>;
  }
  return (
    <span className="text-sm text-gray-600 dark:text-dark-300">
      <span className="block">{dayjs(approved_on).format("DD/MM/YYYY")}</span>
      <span className="block">{dayjs(approved_on).format("HH:mm:ss")}</span>
    </span>
  );
}

export function ApprovedByCell({ getValue }) {


  const approvedBy = getValue();

  const [approverName, setApproverName] = useState(null);
  // approved_by comes as numeric ID (0 means not yet approved)

  useEffect(() => {
    if (approvedBy && String(approvedBy) !== "0") {
      axios.get(`get-created-by/${approvedBy}`)
        .then((res) => {
          if (res.data && res.data.name) {
            setApproverName(res.data.name)
          }
        })
        .catch((err) => {
          console.log("Failed to fetch approver name: ", err);
        })
    }
  }, [approvedBy]);


  return (
    <span className="font-medium text-gray-700 dark:text-dark-200">
      {approverName || "—"}
    </span>
  );
}

export function DaysCell({ row }) {
  // Prefer server-provided no_of_days; fall back to computing from dates
  const { no_of_days, startdate, enddate } = row.original;

  let diffDays = no_of_days;
  if (!diffDays && startdate && enddate) {
    const d1 = dayjs(startdate).startOf("day");
    const d2 = dayjs(enddate).startOf("day");
    diffDays = d2.diff(d1, "day") + 1;
  }

  if (!diffDays) return <span className="text-gray-400">—</span>;

  return (
    <span className="font-semibold text-gray-800 dark:text-dark-100">
      {diffDays} {diffDays === 1 ? "Day" : "Days"}
    </span>
  );
}

export function StatusCell({ row, table }) {
  const { status } = row.original;
  const permissions = getStoredPermissions();
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);

  if (status == 1) {
    return <span className="text-success font-semibold">Approved</span>;
  }
  if (status == 2) {
    return <span className="text-danger font-semibold">Rejected</span>;
  }

  // Pending (status == 0) — show buttons only if permitted
  const canApprove = permissions.includes(232) || permissions.includes(398);
  if (!canApprove) {
    return <span className="text-warning font-semibold">Pending</span>;
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setApproveModalOpen(true)}
          className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white transition hover:bg-emerald-700 h-7"
        >
          Approve
        </button>
        <button
          onClick={() => setRejectModalOpen(true)}
          className="inline-flex items-center justify-center rounded-md bg-red-600 px-2.5 py-1 text-xs font-bold text-white transition hover:bg-red-700 h-7"
        >
          Reject
        </button>
      </div>

      <ApproveLeaveModal
        open={approveModalOpen}
        leaveRow={row.original}
        onClose={() => setApproveModalOpen(false)}
        onSuccess={() => table.options.meta?.fetchData?.()}
      />

      <RejectLeaveModal
        open={rejectModalOpen}
        leaveRow={row.original}
        onClose={() => setRejectModalOpen(false)}
        onSuccess={() => table.options.meta?.fetchData?.()}
      />
    </>
  );
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

DateOnlyCell.propTypes = {
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
  table: PropTypes.object.isRequired,
};

