import { createColumnHelper } from "@tanstack/react-table";
import { Link } from "react-router-dom";
import { Button } from "components/ui";

const columnHelper = createColumnHelper();

export const columns = [
  columnHelper.accessor("id", {
    header: "Id",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("name", {
    header: "Instrument Name",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("idno", {
    header: "ID Number",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("serialno", {
    header: "Serial No.",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("typename", {
    header: "Instrument Type",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("locationname", {
    header: "Location",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("reason_for_dumping", {
    header: "Reason For Dumping",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("dumpqty", {
    header: "Quantity",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("added_on", {
    header: "Added On",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("status", {
    header: "Status",
    cell: (info) => {
      const status = info.getValue();
      let statusText = status;
      let statusClass = "bg-gray-100 text-gray-700";

      if (status === 0 || status === "0" || status === "Pending") {
        statusText = "Pending";
        statusClass = "bg-yellow-100 text-yellow-700";
      } else if (status === 2 || status === "2" || status === "Dumped") {
        statusText = "Dumped";
        statusClass = "bg-red-100 text-red-700"; // Using red to match PHP's btn-danger
      } else if (status === 91 || status === "91" || status === "Rejected") {
        statusText = "Rejected";
        statusClass = "bg-red-100 text-red-700";
      } else if (status === "Approved") {
        statusText = "Approved";
        statusClass = "bg-green-100 text-green-700";
      }

      return (
        <span className={`px-2 py-1 rounded text-xs font-bold ${statusClass}`}>
          {statusText}
        </span>
      );
    },
  }),
  columnHelper.display({
    id: "actions",
    header: "Action",
    cell: (info) => {
      const { id, status } = info.row.original;
      
      const isPending = status === 0 || status === "0" || status === "Pending";
      
      if (!isPending) return null;

      return (
        <div className="flex gap-2">
          <Button
            component={Link}
            to={`/dashboards/inventory/dump-instrument/approve?hakuna=${id}&matata=1`}
            color="success"
            variant="soft"
            size="xs"
          >
            Approve
          </Button>
          <Button
            component={Link}
            to={`/dashboards/inventory/dump-instrument/approve?hakuna=${id}&matata=2`}
            color="error"
            variant="soft"
            size="xs"
          >
            Reject
          </Button>
          <Button
            color="error"
            variant="soft"
            size="xs"
            onClick={() => {
              info.table.options.meta?.deleteRow(id);
            }}
          >
            Delete
          </Button>
        </div>
      );
    },
  }),
];
