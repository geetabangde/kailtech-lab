// Import Dependencies
import { createColumnHelper } from "@tanstack/react-table";
import {
  StatusCell,
  DateCell,
  CustomerCell,
  ConcernPersonCell,

} from "./rows";
import { RowActions } from "./RowActions";

const columnHelper = createColumnHelper();

export const columns = [
  columnHelper.accessor("id", {
    id: "id",
    header: "ID",
    cell: (info) => info.getValue(),
  }),

  columnHelper.accessor("date", {
    id: "date",
    header: "Date",
    cell: DateCell,
  }),

  columnHelper.accessor("challan_no", {
    id: "challan_no",
    header: "Challan No",
    cell: (info) => info.getValue() || "N/A",
  }),

  columnHelper.accessor("type", {
    id: "type",
    header: "Type",
    cell: (info) => info.getValue() || "N/A",
  }),

  columnHelper.accessor("purpose", {
    id: "purpose",
    header: "Purpose",
    cell: (info) => info.getValue() || "N/A",
  }),

  columnHelper.accessor("inward_no", {
    id: "inward_no",
    header: "Inward Entry No",
    cell: (info) => info.getValue() || "N/A",
  }),

  columnHelper.accessor("trf_no", {
    id: "trf_no",
    header: "TRF No",
    cell: (info) => info.getValue() || "N/A",
  }),

  columnHelper.accessor("responsible", {
    id: "responsible",
    header: "Responsible",
    cell: (info) => info.getValue() || "N/A",
  }),

  columnHelper.accessor("customer", {
    id: "customer",
    header: "Customer",
    cell: CustomerCell,
  }),

  columnHelper.accessor("contact_person", {
    id: "contact_person",
    header: "Contact Person",
    cell: ConcernPersonCell,
  }),

  columnHelper.accessor("status", {
    id: "status",
    header: "Dispatch Status",
    cell: StatusCell,
  }),

  columnHelper.display({
    id: "actions",
    header: "Action",
    enableColumnFilter: false,
    cell: ({ row }) => <RowActions row={row} />,
  }),
];
