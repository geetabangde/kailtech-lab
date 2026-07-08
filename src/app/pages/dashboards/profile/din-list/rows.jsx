// Import Dependencies
import PropTypes from "prop-types";
import { Badge } from "components/ui";
import { dinStatusOptions } from "./data";

// ----------------------------------------------------------------------

export function StatusCell({ row }) {
  const statusValue = row.original.status;
  const option = dinStatusOptions.find((opt) => opt.value === statusValue) || {
    label: statusValue || "Unknown",
    color: "secondary",
  };

  return (
    <div className="flex flex-col gap-1">
      <Badge color={option.color} variant="soft">
        {option.label}
      </Badge>
    </div>
  );
}

export function DateCell({ getValue }) {
  const date = getValue();
  return <span>{date || "N/A"}</span>;
}

export function CustomerCell({ row }) {
  const customer = row.original.customer || "N/A";

  return (
    <div className="flex flex-col">
      <span className="font-semibold text-gray-800 dark:text-dark-100">
        {customer}
      </span>
    </div>
  );
}

export function ConcernPersonCell({ row }) {
  const contact = row.original.contact_person || {};

  return (
    <div className="flex flex-col text-xs space-y-0.5">
      <span className="font-medium text-gray-800 dark:text-dark-100">{contact.name || "N/A"}</span>
      {contact.designation && contact.designation !== "-" && <span className="text-gray-500">{contact.designation}</span>}
      {contact.email && contact.email !== "@" && <span className="text-gray-500 italic">{contact.email}</span>}
      {contact.phone && contact.phone !== "00" && <span className="text-gray-500 font-mono">{contact.phone}</span>}
    </div>
  );
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
