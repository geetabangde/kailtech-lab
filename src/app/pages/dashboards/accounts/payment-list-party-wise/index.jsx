// Import Dependencies
import {
  flexRender,
  getCoreRowModel,
  getFacetedMinMaxValues,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import clsx from "clsx";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import axios from "utils/axios";
import { toast } from "sonner";

// Local Imports
import { Table, Card, THead, TBody, Th, Tr, Td } from "components/ui";
import { TableSortIcon } from "components/shared/table/TableSortIcon";
import { Page } from "components/shared/Page";
import { useLockScrollbar, useDidUpdate, useLocalStorage } from "hooks";
import { fuzzyFilter } from "utils/react-table/fuzzyFilter";
import { useSkipper } from "utils/react-table/useSkipper";
import { PaginationSection } from "components/shared/table/PaginationSection";
import { useThemeContext } from "app/contexts/theme/context";
import { getUserAgentBrowser } from "utils/dom/getUserAgentBrowser";
import { columns } from "./columns";

// ----------------------------------------------------------------------

const isSafari = getUserAgentBrowser() === "Safari";

export default function PartyWisePayment() {
  const { cardSkin } = useThemeContext();
  const navigate = useNavigate();
  const permissions = JSON.parse(localStorage.getItem("userPermissions") || "[]");

  useEffect(() => {
    if (!permissions.includes(275)) {
      navigate("/dashboards");
    }
  }, [navigate, permissions]);

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [tableSettings, setTableSettings] = useState({
    enableFullScreen: false,
    enableRowDense: false,
    enableSorting: true,
    enableColumnFilters: false,
  });

  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState([]);

  const [columnVisibility, setColumnVisibility] = useLocalStorage(
    "col-vis-party-wise-payment",
    {},
  );
  const [columnPinning, setColumnPinning] = useLocalStorage(
    "col-pin-party-wise-payment",
    {},
  );
  const [autoResetPageIndex, skipAutoResetPageIndex] = useSkipper();

  // ── Fetch ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await axios.get("/accounts/get-payment-partywise");
        if (
          (res.data.status === true || res.data.status === "true") &&
          Array.isArray(res.data.data)
        ) {
          setData(res.data.data);
        } else {
          setData([]);
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load party wise payment list");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const table = useReactTable({
    data,
    columns,
    state: {
      globalFilter,
      sorting,
      columnVisibility,
      columnPinning,
      tableSettings,
    },
    meta: {
      updateData: (rowIndex, columnId, value) => {
        skipAutoResetPageIndex();
        setData((old) =>
          old.map((row, index) =>
            index === rowIndex ? { ...old[rowIndex], [columnId]: value } : row,
          ),
        );
      },
      setTableSettings,
    },
    filterFns: { fuzzy: fuzzyFilter },
    globalFilterFn: fuzzyFilter,
    enableSorting: tableSettings.enableSorting,
    enableColumnFilters: tableSettings.enableColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onColumnPinningChange: setColumnPinning,
    autoResetPageIndex,
  });

  useDidUpdate(() => table.resetRowSelection(), [data]);
  useLockScrollbar(tableSettings.enableFullScreen);

  // ── Summary totals ────────────────────────────────────────────────────────
  const totalDebit = data.reduce((s, r) => s + (parseFloat(r.debit) || 0), 0);
  const totalCredit = data.reduce((s, r) => s + (parseFloat(r.credit) || 0), 0);
  const totalRemaining = data.reduce(
    (s, r) => s + (parseFloat(r.balance) || 0),
    0,
  );
  const fmt = (n) => n.toLocaleString("en-IN", { minimumFractionDigits: 2 });

  if (loading) {
    return (
      <Page title="Party Wise Payment">
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
    <Page title="Party Wise Payment">
      <div className="transition-content w-full pb-5">
        <div
          className={clsx(
            "flex h-full w-full flex-col",
            tableSettings.enableFullScreen &&
              "dark:bg-dark-900 fixed inset-0 z-61 bg-white pt-3",
          )}
        >
          {/* ── Toolbar ── */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-[var(--margin-x)] pt-4 pb-3">
            <h2 className="dark:text-dark-50 text-xl font-semibold text-gray-800">
              Party Wise Payment List
            </h2>
            <input
              type="text"
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Search customer..."
              className="focus:border-primary-500 focus:ring-primary-500 dark:border-dark-500 dark:bg-dark-800 dark:text-dark-100 h-9 w-64 rounded-md border border-gray-300 px-3 text-sm text-gray-700 focus:ring-1 focus:outline-none"
            />
          </div>

          {/* ── Summary Badges ── */}
          {data.length > 0 && (
            <div className="flex flex-wrap gap-3 px-[var(--margin-x)] pb-3">
              <SummaryBadge
                label="Total Billing"
                value={`₹${fmt(totalDebit)}`}
                color="gray"
              />
              <SummaryBadge
                label="Total Received"
                value={`₹${fmt(totalCredit)}`}
                color="green"
              />
              <SummaryBadge
                label="Total Remaining"
                value={`₹${fmt(totalRemaining)}`}
                color="red"
              />
              <SummaryBadge
                label="Customers"
                value={data.length}
                color="blue"
              />
            </div>
          )}

          <div
            className={clsx(
              "transition-content flex grow flex-col pt-1",
              tableSettings.enableFullScreen
                ? "overflow-hidden"
                : "px-[var(--margin-x)]",
            )}
          >
            <Card
              className={clsx(
                "relative flex grow flex-col",
                tableSettings.enableFullScreen && "overflow-hidden",
              )}
            >
              <div className="table-wrapper min-w-full grow overflow-x-auto">
                <Table
                  hoverable
                  dense={tableSettings.enableRowDense}
                  sticky={tableSettings.enableFullScreen}
                  className="w-full text-left"
                >
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
                          className={clsx(
                            "dark:border-b-dark-500 relative border-y border-transparent border-b-gray-200",
                            row.getIsSelected() &&
                              !isSafari &&
                              "row-selected after:bg-primary-500/10 ltr:after:border-l-primary-500 after:pointer-events-none after:absolute after:inset-0 after:z-2 after:h-full after:w-full after:border-3 after:border-transparent",
                          )}
                        >
                          {row.getVisibleCells().map((cell) => (
                            <Td
                              key={cell.id}
                              className={clsx(
                                "relative bg-white",
                                cardSkin === "shadow"
                                  ? "dark:bg-dark-700"
                                  : "dark:bg-dark-900",
                              )}
                            >
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
                          No records found.
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
        </div>
      </div>
    </Page>
  );
}

function SummaryBadge({ label, value, color }) {
  const colorMap = {
    blue: "bg-blue-50  text-blue-700  dark:bg-blue-900/20  dark:text-blue-400",
    green:
      "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400",
    red: "bg-red-50   text-red-700   dark:bg-red-900/20   dark:text-red-400",
    gray: "bg-gray-100 text-gray-700  dark:bg-dark-700     dark:text-dark-200",
  };
  return (
    <div className={clsx("rounded-lg px-4 py-2 text-sm", colorMap[color])}>
      <span className="font-medium">{label}: </span>
      <span className="font-bold">{value}</span>
    </div>
  );
}
