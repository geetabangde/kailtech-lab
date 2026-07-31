// Import Dependencies
import { createColumnHelper } from "@tanstack/react-table";
import dayjs from "dayjs";

// Local Imports
import { RowActions } from "./RowActions";
import { StatusActions } from "./StatusActions";
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

  // PHP: Id
  columnHelper.accessor("id", {
    id: "id",
    header: "Id",
    cell: (info) => info.getValue(),
  }),

  // PHP: Indent No.
  columnHelper.accessor("indent_number", {
    id: "indent_no",
    header: "Indent No.",
    cell: (info) => info.getValue(),
  }),

  // PHP: Raised By
  columnHelper.accessor("firstname", {
    id: "raised_by",
    header: "Raised By",
    cell: (info) => info.getValue(),
  }),

  // PHP: Priority
  columnHelper.accessor("priority_name", {
    id: "priority",
    header: "Priority",
    cell: (info) => info.getValue(),
  }),

  // PHP: Indent Type
  columnHelper.accessor("indentType", {
    id: "indent_type",
    header: "Indent Type",
    cell: (info) => info.getValue(),
  }),

  // PHP: Item Name
  columnHelper.accessor("itemname", {
    id: "item_name",
    header: "Item Name",
    cell: (info) => {
      const val = info.getValue() || "";
      return (
        <div className="whitespace-pre-line">
          {val.split(",").join("\n")}
        </div>
      );
    },
  }),

  // PHP: Added On
  columnHelper.accessor("added_on", {
    id: "added_on",
    header: "Added On",
    cell: (info) => {
      const val = info.getValue();
      return val ? dayjs(val).format("DD/MM/YYYY") : "N/A";
    },
  }),

  // Approved/Rejected Date
  columnHelper.accessor("updated_on", {
    id: "updated_on",
    header: "Approved/Rejected Date",
    cell: (info) => {
      const val = info.getValue();
      const status = info.row.original.status;
      // Agar status 1 (Pending) hai, toh date na dikhaye, kyuki wo approve/reject nahi hua hai
      if (status == 1 || !val) {
        return "-";
      }
      return dayjs(val).format("DD/MM/YYYY");
    },
  }),

  // PHP: Status
  columnHelper.accessor("status", {
    id: "status",
    header: "Status",
    cell: StatusActions,
  }),

  // PHP: Action
  columnHelper.display({
    id: "actions",
    header: () => (
      <div className="flex items-center justify-center">Action</div>
    ),
    cell: RowActions,
  }),
];