import { createColumnHelper } from "@tanstack/react-table";
import { GatePassCell, DateCell, ReturnCell } from "./rows";

const columnHelper = createColumnHelper();

export const columns = [
  // 1. Sr No
  columnHelper.accessor((_row, index) => index + 1, {
    id: "s_no",
    header: "Sr No",
    cell: (info) => info.row.index + 1,
  }),

  // 2. Gate pass Number
  columnHelper.accessor((row) => row.gatpassnumber || row.gatepass_no || row.gatepassnumber || "", {
    id: "gatepass_no",
    header: "Gate pass Number",
    cell: GatePassCell,
  }),

  // 3. Basis
  columnHelper.accessor("basis", {
    id: "basis",
    header: "Basis",
    cell: (info) => info.getValue() || "—",
  }),

  // 4. Instrument Name
  columnHelper.accessor((row) => row.instrument_name || row.instrumentname || "", {
    id: "instrument_name",
    header: "Instrument Name",
    cell: (info) => info.getValue() || "—",
  }),

  // 5. Instrument Code
  columnHelper.accessor((row) => row.instrument_no || row.idno || row.instrumentcode || row.instrument_code || "", {
    id: "instrument_code",
    header: "Instrument Code",
    cell: (info) => info.getValue() || "—",
  }),

  // 6. Qty
  columnHelper.accessor("qty", {
    id: "qty",
    header: "Qty",
    cell: (info) => info.getValue() ?? "—",
  }),

  // 7. Party Name
  columnHelper.accessor((row) => row.issued_to || row.employee_name || row.partyname || row.party_name || "", {
    id: "party_name",
    header: "Party Name",
    cell: (info) => info.getValue() || "—",
  }),

  // 8. Employee Code
  columnHelper.accessor((row) => row.empid || row.employeecode || row.employee_code || "", {
    id: "employee_code",
    header: "Employee Code",
    cell: (info) => info.getValue() || "—",
  }),

  // 9. Remark
  columnHelper.accessor("remark", {
    id: "remark",
    header: "Remark",
    cell: (info) => info.getValue() || "—",
  }),

  // 10. Customer
  columnHelper.accessor((row) => row.company || row.customer_name || row.customer || row.customername || "", {
    id: "customer",
    header: "Customer",
    cell: (info) => info.getValue() || "—",
  }),

  // 11. Issue Date
  columnHelper.accessor("added_on", {
    id: "issue_date",
    header: "Issue date",
    cell: DateCell,
  }),

  // 12. Return
  columnHelper.display({
    id: "return",
    header: "Return",
    cell: ReturnCell,
  }),
];
