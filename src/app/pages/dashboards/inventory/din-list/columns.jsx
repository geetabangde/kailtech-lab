// Import Dependencies
import { createColumnHelper } from "@tanstack/react-table";
import { 
  StatusCell, 
  DateCell, 
  CustomerCell, 
  ConcernPersonCell, 
  AddedByCell 
} from "./rows";
import { MinusCircleIcon, PlusCircleIcon } from "@heroicons/react/24/solid";

const columnHelper = createColumnHelper();

export const columns = [
  columnHelper.accessor("id", {
    id: "id",
    header: "ID",
    cell: ({ row, getValue }) => {
      return (
        <div className="flex items-center gap-2">
          <button
            onClick={row.getToggleExpandedHandler()}
            className="focus:outline-none shrink-0"
          >
            {row.getIsExpanded() ? (
              <MinusCircleIcon className="h-5 w-5 text-red-500" />
            ) : (
              <PlusCircleIcon className="h-5 w-5 text-green-500" />
            )}
          </button>
          <span>{getValue()}</span>
        </div>
      );
    },
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
    header: "Type",
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
    header: "Contact Person",
    cell: ConcernPersonCell,
  }),

  columnHelper.accessor("addedBy", {
    id: "added_by_name",
    header: "Requested Person",
    cell: AddedByCell,
  }),

];
