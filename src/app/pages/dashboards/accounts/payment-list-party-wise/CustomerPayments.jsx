// Import Dependencies
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  createColumnHelper,
} from "@tanstack/react-table";
import clsx from "clsx";
import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "utils/axios";
import { toast } from "sonner";
import dayjs from "dayjs";
import { parseUserPermissions } from "utils/permissions";

// Local Imports
import { Table, Card, THead, TBody, Th, Tr, Td } from "components/ui";
import { TableSortIcon } from "components/shared/table/TableSortIcon";
import { Page } from "components/shared/Page";
import { PaginationSection } from "components/shared/table/PaginationSection";
import { ConfirmModal } from "components/shared/ConfirmModal";
import { fuzzyFilter } from "utils/react-table/fuzzyFilter";

// ----------------------------------------------------------------------

const columnHelper = createColumnHelper();

const fmtDate = (d) => {
  if (!d || d === "0000-00-00") return "—";
  const dt = dayjs(d);
  if (!dt.isValid()) return d;
  return dt.format("DD/MM/YYYY");
};

// ── Row actions cell ──────────────────────────────────────────────────────────
function DeleteButton({ row, onDelete }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await axios.delete(
        `/accounts/delete-payment?paymentid=${row.original.id}&customerid=${row.original.customerid}`,
      );
      setSuccess(true);
      toast.success("Payment deleted ✅");
      setTimeout(() => {
        setOpen(false);
        onDelete(row.original.id);
      }, 800);
    } catch {
      setError(true);
      toast.error("Failed to delete payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => {
          setOpen(true);
          setError(false);
          setSuccess(false);
        }}
        className="rounded bg-red-500 px-3 py-1 text-xs font-medium text-white hover:bg-red-600"
      >
        Delete
      </button>
      <ConfirmModal
        show={open}
        onClose={() => setOpen(false)}
        onOk={handleDelete}
        confirmLoading={loading}
        state={error ? "error" : success ? "success" : "pending"}
        messages={{
          pending: {
            description: "Are you sure you want to delete this payment?",
          },
          success: { title: "Payment Deleted" },
        }}
      />
    </>
  );
}

// ── Row actions cell ──────────────────────────────────────────────────────────
function RowActions({ row, table }) {
  const permissions = useMemo(() => {
    if (typeof window === "undefined") return [];
    return parseUserPermissions(localStorage.getItem("userPermissions"));
  }, []);
  const canDelete = permissions.includes(276);

  const onDelete = () => {
    table.options.meta?.deleteRow(row);
  };

  return (
    <div className="flex flex-wrap gap-1.5 justify-center">
      <Link
        to={`/dashboards/accounts/payment-list/print-receipt/${row.original.id}`}
        className="inline-flex items-center rounded bg-green-500 px-3 py-1 text-xs font-medium text-white hover:bg-green-600 transition-colors"
      >
        Print
      </Link>
      {canDelete && <DeleteButton row={row} onDelete={onDelete} />}
    </div>
  );
}

export default function CustomerPayments() {
  const { customerid } = useParams();

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await axios.get(
          `/accounts/get-customer-payment?customerid=${customerid}`,
        );
        if (
          (res.data.status === true || res.data.status === "true") &&
          Array.isArray(res.data.data)
        ) {
          setPayments(res.data.data);
        } else {
          setPayments([]);
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load payments");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [customerid]);

  // ── Columns (mirrors PHP paymentDetailsData.php) ──────────────────────────
  const columns = [
    columnHelper.accessor((_r, i) => i + 1, {
      id: "s_no",
      header: () => <div className="text-center">SR. NO</div>,
      cell: (info) => <div className="text-center">{info.row.index + 1}</div>,
    }),
    columnHelper.accessor((r) => r.receiptno || r.id, {
      id: "receiptno",
      header: "Receipt No",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("paymentdate", {
      header: "Payment Date",
      cell: (info) => fmtDate(info.getValue()),
    }),
    columnHelper.accessor("paymentmode", {
      header: "Payment Mode",
      cell: (info) => info.getValue() ?? "—",
    }),
    columnHelper.accessor("bankname", {
      header: "Bank Name",
      cell: (info) => info.getValue() || "—",
    }),
    columnHelper.accessor("chequedate", {
      header: "Cheque Date",
      cell: (info) => fmtDate(info.getValue()),
    }),
    columnHelper.accessor(
      (r) => (r.paymentmode === "Cheque" ? r.paymentdetail : ""),
      {
        id: "chequeno",
        header: "Cheque Number",
        cell: (info) => info.getValue() || "—",
      },
    ),
    columnHelper.accessor(
      (r) => (r.paymentmode !== "Cheque" ? r.paymentdetail : ""),
      {
        id: "utrno",
        header: "UTR No.",
        cell: (info) => info.getValue() || "—",
      },
    ),
    columnHelper.accessor("paymentamount", {
      header: "Net Amount",
      cell: (info) => (
        <span className="font-medium">
          ₹{parseFloat(info.getValue() || 0).toLocaleString("en-IN")}
        </span>
      ),
    }),
    columnHelper.accessor("tds", {
      header: "TDS by Client",
      cell: (info) =>
        `₹${parseFloat(info.getValue() || 0).toLocaleString("en-IN")}`,
    }),
    columnHelper.accessor("totalinvoiceamount", {
      header: "Gross Amount",
      cell: (info) => (
        <span className="font-semibold">
          ₹{parseFloat(info.getValue() || 0).toLocaleString("en-IN")}
        </span>
      ),
    }),
    columnHelper.display({
      id: "actions",
      header: () => <div className="text-center">ACTIONS</div>,
      cell: ({ row, table }) => <RowActions row={row} table={table} />,
    }),
  ];

  const table = useReactTable({
    data: payments,
    columns,
    state: { globalFilter, sorting },
    filterFns: { fuzzy: fuzzyFilter },
    globalFilterFn: fuzzyFilter,
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    meta: {
      deleteRow: (row) => {
        setPayments((old) => old.filter((r) => r.id !== row.original.id));
      },
    },
  });

  // ── Totals ────────────────────────────────────────────────────────────────
  const totalNet = payments.reduce(
    (s, r) => s + (parseFloat(r.paymentamount) || 0),
    0,
  );
  const totalTds = payments.reduce((s, r) => s + (parseFloat(r.tds) || 0), 0);
  const totalGross = payments.reduce(
    (s, r) => s + (parseFloat(r.totalinvoiceamount) || 0),
    0,
  );
  const fmt = (n) => n.toLocaleString("en-IN", { minimumFractionDigits: 2 });

  if (loading) {
    return (
      <Page title="Customer Payment List">
        <div className="flex h-[60vh] items-center justify-center text-gray-600">
          <svg
            className="mr-2 h-6 w-6 animate-spin text-blue-600"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z"
            />
          </svg>
          Loading...
        </div>
      </Page>
    );
  }

  return (
    <Page title="Customer Payment List">
      <div className="transition-content px-[var(--margin-x)] pb-8">
        {/* ── Header ── */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="dark:text-dark-50 text-xl font-semibold text-gray-800">
            Payment List
          </h2>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Search..."
              className="focus:border-primary-500 focus:ring-primary-500 dark:border-dark-500 dark:bg-dark-800 dark:text-dark-100 h-9 w-56 rounded-md border border-gray-300 px-3 text-sm text-gray-700 focus:ring-1 focus:outline-none"
            />
            <Link
              to="/dashboards/accounts/payment-list-party-wise"
              className="inline-flex items-center dark:border-dark-500 dark:text-dark-300 dark:hover:bg-dark-700 rounded border border-gray-300 px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              ← Back
            </Link>
          </div>
        </div>

        {/* ── Summary ── */}
        {payments.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-3">
            {[
              {
                label: "Net Amount",
                value: `₹${fmt(totalNet)}`,
                color: "gray",
              },
              { label: "TDS", value: `₹${fmt(totalTds)}`, color: "blue" },
              {
                label: "Gross Amount",
                value: `₹${fmt(totalGross)}`,
                color: "green",
              },
            ].map(({ label, value, color }) => (
              <div
                key={label}
                className={clsx(
                  "rounded-lg px-4 py-2 text-sm",
                  color === "gray" &&
                  "dark:bg-dark-700 dark:text-dark-200 bg-gray-100 text-gray-700",
                  color === "blue" &&
                  "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
                  color === "green" &&
                  "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-blue-400",
                )}
              >
                <span className="font-medium">{label}: </span>
                <span className="font-bold">{value}</span>
              </div>
            ))}
          </div>
        )}

        {/* ── Table ── */}
        <Card className="relative flex flex-col">
          <div className="min-w-full overflow-x-auto">
            <Table hoverable className="w-full text-left">
              <THead>
                {table.getHeaderGroups().map((hg) => (
                  <Tr key={hg.id}>
                    {hg.headers.map((header) => (
                      <Th
                        key={header.id}
                        className="dark:bg-dark-800 dark:text-dark-100 bg-gray-200 font-semibold text-gray-800 uppercase first:ltr:rounded-tl-lg last:ltr:rounded-tr-lg"
                      >
                        {header.column.getCanSort() ? (
                          <div
                            className="flex cursor-pointer items-center space-x-3 select-none"
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            <span className="flex-1">
                              {header.isPlaceholder
                                ? null
                                : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext(),
                                )}
                            </span>
                            <TableSortIcon
                              sorted={header.column.getIsSorted()}
                            />
                          </div>
                        ) : header.isPlaceholder ? null : (
                          flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )
                        )}
                      </Th>
                    ))}
                  </Tr>
                ))}
              </THead>
              <TBody>
                {table.getRowModel().rows.length > 0 ? (
                  table.getRowModel().rows.map((row) => (
                    <Tr
                      key={row.id}
                      className="dark:border-b-dark-500 border-y border-transparent border-b-gray-200"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <Td key={cell.id} className="dark:bg-dark-900 bg-white">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </Td>
                      ))}
                    </Tr>
                  ))
                ) : (
                  <Tr>
                    <Td
                      colSpan={columns.length}
                      className="dark:text-dark-400 py-10 text-center text-sm text-gray-500"
                    >
                      No payments found.
                    </Td>
                  </Tr>
                )}
              </TBody>
            </Table>
          </div>
          {table.getCoreRowModel().rows.length > 0 && (
            <div className="px-4 pt-4 pb-4 sm:px-5">
              <PaginationSection table={table} />
            </div>
          )}
        </Card>
      </div>
    </Page>
  );
}
