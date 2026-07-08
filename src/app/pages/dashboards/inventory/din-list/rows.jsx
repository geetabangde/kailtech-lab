// Import Dependencies
import dayjs from "dayjs";
import PropTypes from "prop-types";
import { Badge } from "components/ui";
import { dinStatusOptions } from "./data";

// ----------------------------------------------------------------------

export function StatusCell({ row }) {
  const statusValue = row.original.status;
  const option = dinStatusOptions.find((opt) => opt.value === parseInt(statusValue)) || {
    label: "Unknown",
    color: "secondary",
  };

  const isReturnable = row.original.basis === "Returnable";
  const isReturned = row.original.count > 0;

  return (
    <div className="flex flex-col gap-1">
      <Badge color={option.color} variant="soft">
        {option.label}
      </Badge>
      {isReturnable && isReturned && (
        <a
          href={`/dashboards/inventory/din-list/dispatch-return-record?hakuna=${row.original.id}`}
          className="text-[10px] font-semibold text-primary-600 hover:underline"
        >
          (Returned)
        </a>
      )}
    </div>
  );
}

export function DateCell({ getValue }) {
  const date = getValue();
  return <span>{date ? dayjs(date).format("DD/MM/YYYY") : "N/A"}</span>;
}

export function CustomerCell({ row }) {
  const customerName = row.original.customername || "N/A";
  const customerAddress = row.original.customeraddress || "";

  return (
    <div className="flex flex-col">
      <span className="font-semibold text-gray-800 dark:text-dark-100">
        {customerName}
      </span>
      {customerAddress && (
        <span className="text-xs text-gray-500 dark:text-dark-400">
          {customerAddress}
        </span>
      )}
    </div>
  );
}

export function ConcernPersonCell({ row }) {
  const {
    concernperson,
    concernpersondesignation,
    concernpersonemail,
    concernpersonphone
  } = row.original;

  return (
    <div className="flex flex-col text-xs space-y-0.5">
      <span className="font-medium text-gray-800 dark:text-dark-100">{concernperson}</span>
      {concernpersondesignation && <span className="text-gray-500">{concernpersondesignation}</span>}
      {concernpersonemail && <span className="text-gray-500 italic">{concernpersonemail}</span>}
      {concernpersonphone && <span className="text-gray-500 font-mono">{concernpersonphone}</span>}
    </div>
  );
}

export function AddedByCell({ getValue }) {
  return <span className="text-sm font-medium">{getValue() || "N/A"}</span>;
}

StatusCell.propTypes = {
  row: PropTypes.object.isRequired,
};

DateCell.propTypes = {
  getValue: PropTypes.func.isRequired,
};

CustomerCell.propTypes = {
  row: PropTypes.object.isRequired,
};

ConcernPersonCell.propTypes = {
  row: PropTypes.object.isRequired,
};

AddedByCell.propTypes = {
  getValue: PropTypes.func.isRequired,
};
