// columns.jsx  — ULR Requests list
// PHP: ulrrequests.php table headers
// Permissions:
//   358 → Main Customer column
//   389 → Customer Type column
//   390 → Specific Purpose column
//
// API response field mapping (from /actionitem/get-ulr-request):
//   id             → trfProducts.id
//   hid            → hodrequests.id
//   product        → product name string  (may be "product" or "product_name")
//   main_customer  → trfrow['customername']
//   report_customer → array e.g. ["SVS PIPE INDUSTRIES"]
//   lrn            → trfProducts.lrn
//   brn            → trfProducts.brn
//   ulr            → trfProducts.ulr
//   customer_type  → customertypes.name
//   specific_purpose → specificpurposes.name
//   grade_size     → combined string e.g. "CM/40 mm"
//   trfstatus      → hodrequests.status  ← PHP: $trfstatus  (used by RowActions)
//   nabl           → testprices.nabl     ← PHP: $nabl       (used by RowActions)

import { createColumnHelper } from "@tanstack/react-table";
import { RowActions } from "./RowActions";

const ch = createColumnHelper();

export function buildColumns(permissions = []) {
  const cols = [
    ch.accessor("id", {
      header: "ID",
      cell: (i) => i.getValue(),
      size: 60,
      filterFn: "includesString",
    }),

    // PHP: $obj->selectfieldwhere("products", "name", "id=$product")
    // API key may be "product" (string) or "product_name"
    ch.accessor((row) => row.product_name ?? row.product, {
      id:     "product",
      header: "Product",
      cell: (i) => <span className="text-xs">{i.getValue() ?? "—"}</span>,
      size: 220,
      filterFn: "includesString",
    }),

    // PHP: if (in_array(358, $permissions)) → $trfrow['customername']
    ...(permissions.includes(358)
      ? [ch.accessor("main_customer", {
          header: "Main Customer",
          cell: (i) => i.getValue() ?? "—",
          size: 160,
          filterFn: "includesString",
        })]
      : []),

    // PHP: str_replace(",", "<br/>", customers.name where id in reportname)
    // API returns array e.g. ["SVS PIPE INDUSTRIES"] or plain string
    ch.accessor("report_customer", {
      header: "Report Customer",
      cell: (i) => {
        const val = i.getValue();
        if (!val) return "—";
        if (Array.isArray(val)) return (
          <span className="text-xs whitespace-pre-line">{val.join("\n")}</span>
        );
        return <span className="text-xs whitespace-pre-line">{val}</span>;
      },
      size: 180,
      filterFn: "includesString",
    }),

    ch.accessor("lrn", {
      header: "LRN",
      cell: (i) => i.getValue() ?? "—",
      size: 150,
      filterFn: "includesString",
    }),

    ch.accessor("brn", {
      header: "BRN",
      cell: (i) => i.getValue() ?? "—",
      size: 160,
      filterFn: "includesString",
    }),

    ch.accessor("ulr", {
      header: "ULR",
      cell: (i) => i.getValue() ?? "—",
      size: 160,
      filterFn: "includesString",
    }),

    // PHP: if (in_array(389, $permissions)) → customertypes.name
    ...(permissions.includes(389)
      ? [ch.accessor("customer_type", {
          header: "Customer Type",
          cell: (i) => i.getValue() ?? "—",
          size: 160,
          filterFn: "includesString",
        })]
      : []),

    // PHP: if (in_array(390, $permissions)) → specificpurposes.name
    ...(permissions.includes(390)
      ? [ch.accessor("specific_purpose", {
          header: "Specific Purpose",
          cell: (i) => i.getValue() ?? "—",
          size: 130,
          filterFn: "includesString",
        })]
      : []),

    // PHP: grades.name + "/" + sizes.name
    // API returns combined string e.g. "CM/40 mm"
    ch.accessor("grade_size", {
      header: "Grade/Size",
      cell: (i) => {
        const val = i.getValue();
        if (val) return val;
        const row   = i.row.original;
        const grade = row.grade_name ?? row.grade ?? "";
        const size  = row.size_name  ?? row.size  ?? "";
        return (grade || size) ? `${grade}/${size}` : "NA/NA";
      },
      size: 160,
      filterFn: "includesString",
    }),

    ch.display({
      id:     "actions",
      header: "Action",
      // RowActions reads: row.original.trfstatus, row.original.nabl, row.original.hid
      cell:   (i) => <RowActions row={i.row} />,
      size:   180,
      enableColumnFilter: false,
    }),
  ];

  return cols;
}