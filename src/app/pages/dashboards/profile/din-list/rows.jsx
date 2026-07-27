import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Badge } from "components/ui";
import { dinStatusOptions } from "./data";
import axios from "utils/axios";

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
  // If backend returns customername and customeraddress separately, use them.
  // Otherwise, fallback to 'customer' string.
  const customerName = row.original.customername || row.original.customer || "N/A";
  const initialAddress = row.original.customeraddress || "";
  const [customerAddress, setCustomerAddress] = useState(initialAddress);

  useEffect(() => {
    // If we only have an ID for the address, fetch the full details
    if (/^\d+$/.test(initialAddress)) {
      const fetchAddress = async () => {
        try {
          const response = await axios.get(`inventory/get-customer-address-details/${initialAddress}`);
          if (response.data?.status && response.data?.data?.addresses?.length > 0) {
            setCustomerAddress(response.data.data.addresses[0].full_address);
          }
        } catch (error) {
          console.error("Error fetching customer address details:", error);
        }
      };
      fetchAddress();
    } else {
      setCustomerAddress(initialAddress);
    }
  }, [initialAddress]);

  // If the backend didn't provide separate fields, and customer string contains the address,
  // we might still just render customerName (which will be the whole string).
  // But if we have them separate, we render them cleanly on separate lines.
  
  return (
    <div className="flex flex-col min-w-[200px] max-w-[300px] whitespace-normal">
      <span className="font-semibold text-gray-800 dark:text-dark-100 break-words">
        {customerName}
      </span>
      {customerAddress && (
        <span className="text-sm text-gray-500 dark:text-dark-400 break-words mt-1">
          {customerAddress}
        </span>
      )}
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
