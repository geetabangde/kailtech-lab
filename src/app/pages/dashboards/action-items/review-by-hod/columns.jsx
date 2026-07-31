// columns.jsx
// PHP equivalent: hodreportsdata.php columns
// Columns: ID, Product, Package, LRN, BRN, ULR, Price, Department,
//          Customer Type (perm 389), Specific Purpose (perm 390), Action

import { createColumnHelper } from "@tanstack/react-table";
import { RowActions } from "./RowActions";
import { SelectCell, SelectHeader } from "components/shared/table/SelectCheckbox";

const columnHelper = createColumnHelper();

export const columns = [
  columnHelper.display({
    id: "select",
    header: SelectHeader,
    cell: SelectCell,
    enableColumnFilter: false,
  }),

  // PHP: $n[] = $i  (serial number)
  columnHelper.accessor((_row, index) => index + 1, {
    id: "s_no",
    header: "ID",
    cell: (info) => (
      <span className="font-mono text-xs font-semibold text-gray-700 dark:text-gray-300">
        {info.row.index + 1}
      </span>
    ),
    enableColumnFilter: false,
  }),

  // PHP: $n[] = $row['pname']
  columnHelper.accessor("pname", {
    id: "product",
    header: "Product",
    cell: (info) => (
      <span className="block max-w-[150px] whitespace-normal text-xs leading-tight text-gray-800 dark:text-gray-200">
        {info.getValue() ?? "—"}
      </span>
    ),
    filterFn: "includesString",
  }),

  // PHP: $n[] = $row['packagename']
  columnHelper.accessor("packagename", {
    id: "package",
    header: "Package",
    cell: (info) => (
      <span className="block max-w-[150px] whitespace-normal text-xs leading-tight text-gray-700 dark:text-gray-300">
        {info.getValue() ?? "—"}
      </span>
    ),
    filterFn: "includesString",
  }),

  // PHP: $n[] = $row['lrn']
  columnHelper.accessor("lrn", {
    id: "lrn",
    header: "LRN",
    cell: (info) => (
      <span className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400">
        {info.getValue() ?? "—"}
      </span>
    ),
    filterFn: "includesString",
  }),

  // PHP: $n[] = $row['brn']
  columnHelper.accessor("brn", {
    id: "brn",
    header: "BRN",
    cell: (info) => (
      <span className="font-mono text-xs text-gray-700 dark:text-gray-300">
        {info.getValue() ?? "—"}
      </span>
    ),
    filterFn: "includesString",
  }),

  // PHP: $n[] = $row['ulr']
  columnHelper.accessor("ulr", {
    id: "ulr",
    header: "ULR",
    cell: (info) => (
      <span className="font-mono text-xs text-gray-700 dark:text-gray-300">
        {info.getValue() ?? "—"}
      </span>
    ),
    filterFn: "includesString",
  }),

  // PHP: $n[] = $row['total']
  columnHelper.accessor("total", {
    id: "price",
    header: "Price",
    cell: (info) => (
      <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
        {info.getValue() != null ? `₹${info.getValue()}` : "—"}
      </span>
    ),
    filterFn: "includesString",
  }),

  // PHP: $n[] = $obj->selectfieldwhere("labs", "name", "id='" . $row['department'] . "'")
  columnHelper.accessor("department_name", {
    id: "department",
    header: "Department",
    cell: (info) => (
      <span className="text-xs text-gray-700 dark:text-gray-300">
        {info.getValue() ?? "—"}
      </span>
    ),
    filterFn: "includesString",
  }),

  // PHP: if(in_array(389, $permissions)) $n[] = customertypes name
  columnHelper.accessor("ctype_name", {
    id: "customer_type",
    header: () => <div className="text-center leading-tight">Customer <br /> Type</div>,
    cell: (info) => (
      <span className="block max-w-[120px] whitespace-normal text-xs leading-tight text-gray-700 dark:text-gray-300">
        {info.getValue() ?? "—"}
      </span>
    ),
    filterFn: "includesString",
  }),

  // PHP: if(in_array(390, $permissions)) $n[] = specificpurposes name
  columnHelper.accessor("specificpurpose_name", {
    id: "specific_purpose",
    header: () => <div className="text-center leading-tight">Specific <br /> Purpose</div>,
    cell: (info) => (
      <span className="block max-w-[120px] whitespace-normal text-xs leading-tight text-gray-700 dark:text-gray-300">
        {info.getValue() ?? "—"}
      </span>
    ),
    filterFn: "includesString",
  }),

  // PHP: Action buttons based on hodstatus (3-9)
  columnHelper.display({
    id: "actions",
    header: "Action",
    cell: RowActions,
    enableColumnFilter: false,
  }),
];