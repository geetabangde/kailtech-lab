import { createColumnHelper } from "@tanstack/react-table";
import { RowActions } from "./RowActions";
import {
  SelectCell,
  SelectHeader,
} from "components/shared/table/SelectCheckbox";
import { DateCell } from "./rows";

const columnHelper = createColumnHelper();

export const columns = [
  // Row selection
  columnHelper.display({
    id: "select",
    label: "Row Selection",
    header: SelectHeader,
    cell: SelectCell,
    size: 40,
  }),

  // S No
  columnHelper.accessor((_row, index) => index + 1, {
    id: "s_no",
    header: "S No",
    cell: (info) => info.row.index + 1,
    size: 60,
  }),

  // Type of Service
  columnHelper.accessor("typeofservice", {
    id: "typeofservice",
    header: "Type Of Service",
    cell: (info) => info.getValue() || "-",
    enableColumnFilter: true,
    size: 130,
  }),

  // Service Provider (NO JSX)
  columnHelper.accessor("serviceprovider", {
    id: "serviceprovider",
    header: "Name and address of service provider",
    cell: (info) => info.getValue() || "-",
    size: 240,
  }),

  // Certificate No
  columnHelper.accessor("certificateno", {
    id: "certificateno",
    header: "Certificate No",
    cell: (info) => info.getValue() || "-",
    size: 130,
  }),

  // Start Date
  columnHelper.accessor("startdate", {
    id: "startdate",
    header: "START DATE",
    cell: DateCell,
    size: 100,
  }),

  // End Date
  columnHelper.accessor("enddate", {
    id: "enddate",
    header: "END DATE",
    cell: DateCell,
    size: 100,
  }),

  // IMC Added (NO JSX)
  columnHelper.accessor("imcadded", {
    id: "imcadded",
    header: "IMC ADDED",
    cell: (info) => info.getValue() || "No",
    size: 90,
  }),

  // Action
  columnHelper.display({
    id: "actions",
    label: "Row Actions",
    header: "ACTION",
    cell: RowActions,
    size: 200,
  }),
];