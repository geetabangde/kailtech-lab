import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { Button } from "components/ui";

// ----------------------------------------------------------------------

function usePermissions() {
  const p = localStorage.getItem("userPermissions");
  try {
    return JSON.parse(p) || [];
  } catch {
    return p?.split(",").map(Number) || [];
  }
}

export function RowActions({ row }) {
  const permissions = usePermissions();
  const { id, status, purpose, dispatchthrough, courrierno, empname, consignphone, consignname } = row.original;
  const statusInt = parseInt(status);
  const purposeInt = parseInt(purpose);

  const canApprove = statusInt === -1 && permissions.includes(304);
  const canReject = statusInt === -1 && permissions.includes(305);
  
  const canEditDispatchDetail = statusInt === 0 && permissions.includes(341);
  
  // Complex condition for "Add Dispatch Detail"
  let canAddDispatchDetail = false;
  if (statusInt === 0 && permissions.includes(308)) {
    if (dispatchthrough === "3" && (courrierno === "NA" || !courrierno)) {
      canAddDispatchDetail = true;
    } else if (dispatchthrough === "1" && !empname) {
      canAddDispatchDetail = true;
    } else if (dispatchthrough === "2" && (!consignphone || !consignname)) {
      canAddDispatchDetail = true;
    } else if (!dispatchthrough) {
      canAddDispatchDetail = true;
    }
  }

  const canEditDin = (statusInt === -2 || statusInt === -1) && permissions.includes(341);

  return (
    <div className="flex flex-wrap items-center gap-2 min-w-[150px]">
      {canApprove && (
        <Button
          component={Link}
          to={`/dashboards/inventory/din-list/approve-dispatch?hakuna=${id}&matata=1`}
          size="xs"
          color="success"
          variant="soft"
          className="px-2.5 py-1 font-semibold transition-all hover:bg-success-100"
        >
          Approve
        </Button>
      )}

      {canReject && (
        <Button
          component={Link}
          to={`/dashboards/inventory/din-list/approve-dispatch?hakuna=${id}&matata=2`}
          size="xs"
          color="error"
          variant="soft"
          className="px-2.5 py-1 font-semibold transition-all hover:bg-error-100"
        >
          Reject
        </Button>
      )}

      {canEditDispatchDetail && (
        <Button
          size="xs"
          color="warning"
          variant="soft"
          className="px-2.5 py-1 font-semibold transition-all hover:bg-warning-100"
          onClick={() => console.log("Edit Dispatch Detail Modal", id)}
        >
          Edit Dispatch
        </Button>
      )}

      {canAddDispatchDetail && (
        <Button
          size="xs"
          color="info"
          variant="soft"
          className="px-2.5 py-1 font-semibold transition-all hover:bg-info-100"
          onClick={() => console.log("Add Dispatch Detail Modal", id)}
        >
          Add Dispatch
        </Button>
      )}

      {canEditDin && (
        <>
          {purposeInt !== 11 && (
            <Button
              component={Link}
              to={`/dashboards/inventory/din-list/edit-din?hakuna=${id}`}
              size="xs"
              color="warning"
              variant="soft"
              className="px-2.5 py-1 font-semibold transition-all hover:bg-warning-100"
            >
              Edit Din
            </Button>
          )}
          {purposeInt === 11 && (
            <Button
              component={Link}
              to={`/dashboards/inventory/din-list/edit-gendin?hakuna=${id}`}
              size="xs"
              color="warning"
              variant="soft"
              className="px-2.5 py-1 font-semibold transition-all hover:bg-warning-100"
            >
              Edit Din
            </Button>
          )}
        </>
      )}

      <Button
        component={Link}
        to={`/dashboards/inventory/din-list/view-din-form?hakuna=${id}`}
        size="xs"
        color="primary"
        variant="soft"
        className="px-2.5 py-1 font-semibold transition-all hover:bg-primary-100"
      >
        View Din Form
      </Button>
    </div>
  );
}

RowActions.propTypes = {
  row: PropTypes.object.isRequired,
};
