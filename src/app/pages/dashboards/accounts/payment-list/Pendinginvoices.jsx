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
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import axios from "utils/axios";
import { toast } from "sonner";

// Local Imports
import { Table, Card, THead, TBody, Th, Tr, Td } from "components/ui";
import { TableSortIcon } from "components/shared/table/TableSortIcon";
import { Page } from "components/shared/Page";
import { PaginationSection } from "components/shared/table/PaginationSection";
import { fuzzyFilter } from "utils/react-table/fuzzyFilter";

// ----------------------------------------------------------------------

const columnHelper = createColumnHelper();

const fmtDate = (d) => {
  if (!d || d === "0000-00-00") return "—";
  const dt = new Date(d);
  if (isNaN(dt)) return d;
  return `${String(dt.getDate()).padStart(2, "0")}/${String(dt.getMonth() + 1).padStart(2, "0")}/${dt.getFullYear()}`;
};

export default function PendingInvoices() {
  const { id } = useParams(); // customer id

  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`/accounts/get-pending-invoice?id=${id}`);
        if (
          (res.data.status === true || res.data.status === "true") &&
          Array.isArray(res.data.data)
        ) {
          setInvoices(res.data.data);
        } else {
          setInvoices([]);
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load pending invoices");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // ── Columns ───────────────────────────────────────────────────────────────
  const columns = [
    columnHelper.display({
      id: "s_no",
      header: "Sr. no",
      cell: (info) => info.row.index + 1,
    }),
    columnHelper.accessor("invoicedate", {
      header: "Invoice Date",
      cell: (info) => fmtDate(info.getValue()),
    }),
    columnHelper.accessor("invoiceno", {
      header: "Invoice No",
      cell: (info) => info.getValue() ?? "—",
    }),
    columnHelper.accessor((row) => row.customername ?? row.cname ?? "—", {
      id: "customer_name",
      header: "Customer Name",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("finaltotal", {
      header: "Total",
      cell: (info) => (
        <span className="font-medium">
          ₹{parseFloat(info.getValue() ?? 0).toLocaleString("en-IN")}
        </span>
      ),
    }),
    columnHelper.accessor("remaining", {
      header: "Remaining Amount",
      cell: (info) => {
        const val = parseFloat(info.getValue() ?? 0);
        return (
          <span
            className={clsx(
              "font-semibold",
              val > 0
                ? "text-red-600 dark:text-red-400"
                : "text-green-600 dark:text-green-400",
            )}
          >
            ₹{val.toLocaleString("en-IN")}
          </span>
        );
      },
    }),
  ];

  const table = useReactTable({
    data: invoices,
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
  });

  // ── Totals ────────────────────────────────────────────────────────────────
  const totalRemaining = invoices.reduce(
    (s, r) => s + (parseFloat(r.remaining) || 0),
    0,
  );
  const totalAmount = invoices.reduce(
    (s, r) => s + (parseFloat(r.finaltotal) || 0),
    0,
  );

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Page title="Remaining Payment List">
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
          Loading Invoices...
        </div>
      </Page>
    );
  }

  return (
    <Page title="Remaining Payment List">
      <div className="transition-content px-[var(--margin-x)] pb-8">
        {/* ── Header ── */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="dark:text-dark-50 text-xl font-semibold text-gray-800">
            Remaining Payment List
          </h2>
          <button
            onClick={() => navigate("/dashboards/accounts/payment-list")}
            className="dark:border-dark-500 dark:text-dark-300 dark:hover:bg-dark-700 rounded border border-gray-300 px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
          >
            ← Back to Payment List
          </button>
        </div>

        {/* ── Summary badges ── */}
        {invoices.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-3">
            <Badge
              label="Total Invoices"
              value={invoices.length}
              color="blue"
            />
            <Badge
              label="Total Amount"
              value={`₹${totalAmount.toLocaleString("en-IN")}`}
              color="gray"
            />
            <Badge
              label="Total Remaining"
              value={`₹${totalRemaining.toLocaleString("en-IN")}`}
              color="red"
            />
          </div>
        )}

        {/* ── Search ── */}
        <div className="mb-3">
          <input
            type="text"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Search invoice no, customer..."
            className="focus:border-primary-500 focus:ring-primary-500 dark:border-dark-500 dark:bg-dark-800 dark:text-dark-100 h-9 w-72 rounded-md border border-gray-300 px-3 text-sm text-gray-700 focus:ring-1 focus:outline-none"
          />
        </div>

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
                            className="flex cursor-pointer items-center space-x-2 select-none"
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
                      No pending invoices found.
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

// ── Badge ─────────────────────────────────────────────────────────────────────
function Badge({ label, value, color }) {
  const colorMap = {
    blue: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
    gray: "bg-gray-100 text-gray-700 dark:bg-dark-700 dark:text-dark-200",
    red: "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400",
  };
  return (
    <div className={clsx("rounded-lg px-4 py-2 text-sm", colorMap[color])}>
      <span className="font-medium">{label}: </span>
      <span className="font-bold">{value}</span>
    </div>
  );
}
