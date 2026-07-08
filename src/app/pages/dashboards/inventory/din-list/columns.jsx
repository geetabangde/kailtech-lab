// Import Dependencies
import { createColumnHelper } from "@tanstack/react-table";
import { 
  StatusCell, 
  DateCell, 
  CustomerCell, 
  ConcernPersonCell, 
  AddedByCell 
} from "./rows";
import { RowActions } from "./RowActions";

const columnHelper = createColumnHelper();

export const columns = [
  columnHelper.accessor("id", {
    id: "id",
    header: "ID",
    cell: (info) => info.getValue(),
  }),

  columnHelper.accessor("status", {
    id: "status",
    header: "Dispatch Status",
    cell: StatusCell,
  }),

  columnHelper.accessor("dindate", {
    id: "din_date",
    header: "Date",
    cell: DateCell,
  }),

  columnHelper.accessor("challanno", {
    id: "challan_no",
    header: "Challan No",
    cell: (info) => info.getValue() || "N/A",
  }),

  columnHelper.accessor("basis", {
    id: "basis",
    header: "Basis",
    cell: (info) => info.getValue(),
  }),

  columnHelper.accessor("dinpname", {
    id: "purpose_name",
    header: "Purpose",
    cell: (info) => info.getValue(),
  }),

  columnHelper.accessor("inwardid", {
    id: "inward_id",
    header: "Inward Entry No",
    cell: (info) => info.getValue(),
  }),

  columnHelper.accessor("trfid", {
    id: "trf_id",
    header: "TRF No",
    cell: (info) => info.getValue(),
  }),

  columnHelper.accessor("responsible", {
    id: "responsible",
    header: "Responsible",
    cell: (info) => info.getValue(),
  }),

  columnHelper.accessor("customername", {
    id: "customer_name",
    header: "Customer",
    cell: CustomerCell,
  }),

  columnHelper.accessor("concernperson", {
    id: "concern_person",
    header: "Concern Person",
    cell: ConcernPersonCell,
  }),

  columnHelper.accessor("addedBy", {
    id: "added_by_name",
    header: "Added By",
    cell: AddedByCell,
  }),

  columnHelper.display({
    id: "action",
    header: "Action",
    enableColumnFilter: false,
    cell: ({ row }) => <RowActions row={row} />,
  }),
];
