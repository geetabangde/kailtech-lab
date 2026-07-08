

// Import Dependencies
import { createColumnHelper } from "@tanstack/react-table";

// Local Imports
import { RowActions } from "./RowActions";
import {
  SelectCell,
  SelectHeader,
} from "components/shared/table/SelectCheckbox";

const columnHelper = createColumnHelper();

export const columns = [
  columnHelper.display({
    id: "select",
    header: SelectHeader,
    cell: SelectCell,
  }),

  // ✅ Serial Number (ID)
  columnHelper.accessor("id", {
    id: "id",
    header: "ID",
    cell: (info) => info.row.index + 1,
  }),

  // ✅ Date (DD/MM/YYYY format)
  columnHelper.accessor("date", {
    id: "date",
    header: "Date",
    cell: (info) => {
      const date = info.getValue();
      if (!date) return '-';
      
      // Format date to DD/MM/YYYY
      const dateObj = new Date(date);
      const day = String(dateObj.getDate()).padStart(2, '0');
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const year = dateObj.getFullYear();
      
      return `${day}/${month}/${year}`;
    },
  }),

  // ✅ Inward Entry Number (showing only inwardid)
  columnHelper.accessor("inwardEntryNumber", {
    id: "inwardentrynumber",
    header: "Inward Entry no",
    cell: (info) => info.getValue() || '-',
  }),

  // ✅ Customer (with address)
  columnHelper.accessor("customer", {
    id: "customer",
    header: "Customer",
    cell: (info) => {
      const value = info.getValue();
      return (
        <div className="max-w-md">
          <div className="whitespace-normal break-words">
            {value || '-'}
          </div>
        </div>
      );
    },
  }),
  //   columnHelper.accessor("contactPerson", {
//     id: "contactPerson",
//     header: "Contact Person",
//     cell: (info) => info.getValue(),
//   }),


  // ✅ Contact Person (vertical layout with all details)
  columnHelper.display({
    id: "contactPerson",
    header: "Contact Person",
    cell: (info) => {
      const row = info.row.original;
      
      return (
        <div className="flex flex-col space-y-0.5 text-sm">
          <div className="font-medium">{row.contactPersonName}</div>
          <div className="text-gray-600">{row.contactPersonDesignation}</div>
          <div className="text-gray-600">{row.contactPersonEmail}</div>
          <div className="text-gray-600">{row.contactPersonMobile}</div>
        </div>
      );
    },
  }),

  // ✅ Actions
  columnHelper.display({
    id: "actions",
    header: "Action",
    cell: RowActions,
  }),
];