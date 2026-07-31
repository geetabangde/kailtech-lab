// Import Dependencies
import { createColumnHelper } from "@tanstack/react-table";

// Local Imports
import { RowActions } from "./RowActions";


const columnHelper = createColumnHelper();

const formatDate = (val) => {
  if (!val || val === "0000-00-00" || val === "0000-00-00 00:00:00") return "-";
  const date = new Date(val);
  if (isNaN(date)) return val;
  return date.toLocaleDateString("en-GB"); // DD/MM/YYYY
};

export const columns = [


  // ── Serial / UI ID ────────────────────────────────────────────────────────
  columnHelper.accessor((_row, index) => index + 1, {
    id: "s_no",
    header: () => <div className="text-center">ID</div>,
    cell: (info) => (
      <span className="text-sm text-gray-700 dark:text-dark-200">
        {info.row.index + 1}
      </span>
    ),
    meta: { align: "center" },
    enableColumnFilter: false,
  }),

  // ── Dispatch Date ─────────────────────────────────────────────────────────
  columnHelper.accessor("dispatchdate", {
    id: "dispatchdate",
    header: "DATE",
    cell: (info) => (
      <span className="text-sm text-gray-700 dark:text-dark-200">
        {formatDate(info.getValue())}
      </span>
    ),
    filterFn: "includesString",
  }),

  // ── TRF ID ────────────────────────────────────────────────────────────────
  columnHelper.accessor("trfid", {
    id: "trfid",
    header: "TRF ID",
    cell: (info) => (
      <span className="text-sm text-gray-700 dark:text-dark-200">
        {info.getValue() || "—"}
      </span>
    ),
    filterFn: "includesString",
  }),

  // ── Customer (Name + Address) ─────────────────────────────────────────────
  columnHelper.accessor(
    (row) => `${row.customername ?? ""} ${row.customeraddress ?? ""}`.trim(),
    {
      id: "customer",
      header: "CUSTOMER",
      cell: (info) => {
        const row = info.row.original;
        const name = row.customername || "";
        const address = row.customeraddress || "";
        return (
          <div className="block max-w-[400px] whitespace-normal">
            <div className="text-sm font-medium text-gray-700 dark:text-dark-200">
              {name || "—"}
            </div>
            {address && (
              <div className="mt-1 text-xs text-gray-500 dark:text-dark-400">
                {address}
              </div>
            )}
          </div>
        );
      },
      filterFn: "includesString",
    }
  ),

  // ── Contact Person (Name + Designation + Email + Mobile) ──────────────────
  columnHelper.accessor("concernpersonname", {
    id: "contactperson",
    header: "CONTACT PERSON",
    cell: (info) => {
      const row = info.row.original;
      const name = row.concernpersonname || "";
      const designation = row.concernpersondesignation || "";
      const email = row.concernpersonemail || "";
      const mobile = row.concernpersonmobile || "";
      return (
        <div className="block max-w-[250px] whitespace-normal space-y-0.5 text-sm">
          <div className="font-medium text-gray-700 dark:text-dark-200">
            {name || "—"}
          </div>
          {designation && (
            <div className="text-gray-500 dark:text-dark-400">
              {designation}
            </div>
          )}
          {email && (
            <div className="text-gray-500 dark:text-dark-400">
              {email}
            </div>
          )}
          {mobile && (
            <div className="text-gray-500 dark:text-dark-400">
              {mobile}
            </div>
          )}
        </div>
      );
    },
    filterFn: "includesString",
  }),

  // ── Actions ───────────────────────────────────────────────────────────────
  columnHelper.display({
    id: "actions",
    header: () => <div className="text-center w-full">ACTIONS</div>,
    cell: RowActions,
    meta: { align: "center" },
    enableColumnFilter: false,
  }),
];