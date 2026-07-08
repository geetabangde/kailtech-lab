// Import Dependencies
import { createColumnHelper } from "@tanstack/react-table";

// Local Imports
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

  // PHP: Sr.No
  columnHelper.display({
    id: "sr_no",
    header: "Sr.No",
    cell: ({ row }) => row.index + 1,
  }),

  // PHP: Name
  columnHelper.accessor("name", {
    id: "name",
    header: "Name",
    cell: (info) => info.getValue(),
  }),

  // PHP: Id no
  columnHelper.accessor("idno", {
    id: "idno",
    header: "Id no",
    cell: (info) => info.getValue(),
  }),

  // PHP: Category
  columnHelper.accessor("cname", {
    id: "cname",
    header: "Category",
    cell: (info) => info.getValue(),
  }),

  // PHP: Type
  columnHelper.accessor("typeofuse", {
    id: "typeofuse",
    header: "Type",
    cell: (info) => info.getValue(),
  }),

  // Unit
  columnHelper.accessor("unit", {
    id: "unit",
    header: "Unit",
    cell: (info) => info.getValue(),
  }),

  // PHP: Quantity
  columnHelper.accessor("qty", {
    id: "qty",
    header: "Quantity",
    cell: (info) => info.getValue(),
  }),

  // PHP: Batch No
  columnHelper.accessor("batchno", {
    id: "batchno",
    header: "Batch No",
    cell: (info) => info.getValue(),
  }),
];
