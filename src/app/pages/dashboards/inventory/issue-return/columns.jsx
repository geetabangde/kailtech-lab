import { createColumnHelper } from "@tanstack/react-table";
import { Link } from "react-router-dom";
import { Button } from "components/ui";

const columnHelper = createColumnHelper();

function formatReturnDate(value) {
  if (!value || value === "0000-00-00" || value === "0000-00-00 00:00:00") {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-GB");
}

export const columns = [
  columnHelper.accessor((row, index) => index + 1, {
    id: "srNo",
    header: "Sr No",
    cell: (info) => info.row.index + 1,
  }),
  columnHelper.accessor("gatpassnumber", {
    header: "Gate pass Number",
    cell: (info) => (
      <Link 
        to={`/dashboards/inventory/issue-return/print-gatepass?hakuna=${info.getValue()}`}
        className="text-red-500 font-medium hover:underline"
      >
        {info.getValue()}
      </Link>
    ),
  }),
  columnHelper.accessor("basis", {
    header: "Basis",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("instrument_name", {
    header: "Instrument Name",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("idno", {
    header: "Instrument Code",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("qty", {
    header: "Qty",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("employee_name", {
    header: "Party Name",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("empid", {
    header: "Employee Code",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("remark", {
    header: "Remark",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("customer_name", {
    header: "Customer",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("added_on", {
    header: "Issue date",
    cell: (info) => {
      const val = info.getValue();
      if (!val) return "";
      const d = new Date(val);
      return Number.isNaN(d.getTime()) ? val : d.toLocaleDateString("en-GB");
    },
  }),
  columnHelper.display({
    id: "return",
    header: "Return",
    cell: (info) => {
      const row = info.row.original;
      const status = Number(row.status);
      const isReturnable = row.basis === "Returnable";

      if (status === 0 && isReturnable) {
        return <span>Not Returned</span>;
      } else if (status === 1) {
        return (
          <div className="flex flex-col gap-1">
            <span className="text-xs">{row.returnby_name || row.returnbyname || row.returnby || "-"}</span>
            <span className="text-xs text-gray-500">{formatReturnDate(row.returnon)}</span>
            <Button
              component={Link}
              to={`/dashboards/inventory/issue-return/view-checklist?hakuna=${row.gatpassnumber}`}
              color="info"
              variant="outline"
              size="xs"
              className="mt-1"
            >
              {"<< View Checklist"}
            </Button>
          </div>
        );
      } else if (status === -1) {
        return <span>checklist pending</span>;
      } else if (!isReturnable) {
        return <span>Non Returnable</span>;
      }
      return null;
    },
  }),
];
