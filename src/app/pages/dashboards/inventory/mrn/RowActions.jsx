// Import Dependencies
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";

// Local Imports
import { Button } from "components/ui";

// ----------------------------------------------------------------------

export function RowActions({ row }) {
  const navigate = useNavigate();
  const { id, status, attachment1, attachment2, ponumber } = row.original;

  const handleActionClick = () => {
    // PHP: if ($row['status'] == 0) { Add MRN Item } else { View Mrn Items }
    if (status === 0 || status === "0") {
      if (ponumber) {
        navigate(`/dashboards/inventory/mrn/addMrnItemPurchase?id=${id}`, { state: { mrn: row.original } });
      } else {
        navigate(`/dashboards/inventory/mrn/addMrnItemPurchasewopo?id=${id}`, { state: { mrn: row.original } });
      }
    } else {
      navigate(`/dashboards/inventory/mrn/view-items/${id}`, { state: { mrn: row.original } });
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        color="success"
        className="h-8 text-xs font-medium"
        onClick={handleActionClick}
      >
        {status === 0 || status === "0" ? "Add MRN Item" : "View Mrn Items"}
      </Button>

      {attachment1 && attachment1 !== "0" && attachment1 !== 0 && String(attachment1).trim() !== "" ? (
        <Button
          component="a"
          href={attachment1}
          target="_blank"
          size="sm"
          color="warning"
          className="h-8 text-xs font-medium"
        >
          View Attachment1
        </Button>
      ) : null}
      {attachment2 && attachment2 !== "0" && attachment2 !== 0 && String(attachment2).trim() !== "" ? (
        <Button
          component="a"
          href={attachment2}
          target="_blank"
          size="sm"
          color="warning"
          className="h-8 text-xs font-medium"
        >
          View Attachment2
        </Button>
      ) : null}
    </div>
  );
}

RowActions.propTypes = {
  row: PropTypes.object.isRequired,
};
