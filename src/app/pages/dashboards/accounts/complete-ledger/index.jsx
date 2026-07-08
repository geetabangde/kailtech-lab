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

// Local Imports
import { Table, Card, THead, TBody, Th, Tr, Td } from "components/ui";
import { TableSortIcon } from "components/shared/table/TableSortIcon";
import { Page } from "components/shared/Page";
import { useLockScrollbar, useDidUpdate, useLocalStorage } from "hooks";
import { fuzzyFilter } from "utils/react-table/fuzzyFilter";
import { useSkipper } from "utils/react-table/useSkipper";
import { Toolbar } from "./Toolbar";
import { columns } from "./columns";
import { PaginationSection } from "components/shared/table/PaginationSection";
import { SelectedRowsActions } from "./SelectedRowsActions";
import { useThemeContext } from "app/contexts/theme/context";
import { getUserAgentBrowser } from "utils/dom/getUserAgentBrowser";

// ----------------------------------------------------------------------

const isSafari = getUserAgentBrowser() === "Safari";

export default function CompleteLedgerReport() {
  const { cardSkin } = useThemeContext();
  const navigate = useNavigate();
  const permissions = JSON.parse(localStorage.getItem("userPermissions") || "[]");

  useEffect(() => {
    if (!permissions.includes(146)) {
      navigate("/dashboards");
    }
  }, [navigate, permissions]);

  const [ledgerData, setLedgerData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    startdate: "",
    enddate: "",
    customerid: "",
    typeofinvoice: "",
    bd: "",
  });
  const [searched, setSearched] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [bdList, setBdList] = useState([]);

  const fetchLedger = async () => {
    if (!filters.startdate || !filters.enddate) return;
    try {
      setLoading(true);
      setSearched(true);
      const res = await axios.get("/accounts/get-ledger-report", { params: filters });
      const rows = res.data?.data || [];
      // Sort rows by transactiondate to ensure correct running balance calculation
      const sortedRows = [...rows].sort((a, b) => {
        const dateA = new Date(a.transactiondate).getTime();
        const dateB = new Date(b.transactiondate).getTime();
        if (dateA !== dateB) return dateA - dateB;
        // As a secondary sort use refid to maintain a consistent order for same-day transactions
        return Number(a.refid || 0) - Number(b.refid || 0);
      });

      let runningBalance = 0;
      const mapped = sortedRows.map((row) => {
        const debit = Number(row.debit || 0);
        const credit = Number(row.credit || 0);
        runningBalance += (debit - credit);
        return {
          date: row.transactiondate || "-",
          party: row.customer_name || "Suspense",
          particulars: row.transactiontype || "-",
          vch_type: row.source || "-",
          vch_no: row.source === "payment" && row.refid
            ? `${row.refno} (Receipt: ${row.refid})`
            : row.refno || "-",
          debit,
          credit,
          balance: runningBalance,
        };
      });
      setLedgerData(mapped);
    } catch (err) {
      console.error("Error fetching ledger:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetadata = async () => {
    try {
      const [custRes, bdRes] = await Promise.all([
        axios.get("/people/get-all-customers"),
        axios.get("/people/get-customer-bd"),
      ]);
      setCustomers(custRes.data?.data || []);
      setBdList(bdRes.data?.data || []);
    } catch (err) {
      console.error("Error fetching metadata:", err);
    }
  };

  useEffect(() => {
    fetchMetadata();
  }, []);

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = (e) => {
    e?.preventDefault?.();
    fetchLedger();
  };



  const [tableSettings, setTableSettings] = useState({
    enableFullScreen: false,
    enableRowDense: false,
  });

  const [globalFilter, setGlobalFilter] = useState("");

  const [sorting, setSorting] = useState([]);

  const [columnVisibility, setColumnVisibility] = useLocalStorage(
    "column-visibility-ledger-1",
    {},
  );

  const [columnPinning, setColumnPinning] = useLocalStorage(
    "column-pinning-ledger-1",
    {},
  );

  const [autoResetPageIndex] = useSkipper();

  const table = useReactTable({
    data: ledgerData,
    columns: columns,
    state: {
      globalFilter,
      sorting,
      columnVisibility,
      columnPinning,
      tableSettings,
    },
    meta: {
      setTableSettings
    },
    filterFns: {
      fuzzy: fuzzyFilter,
    },
    enableSorting: tableSettings.enableSorting,
    enableColumnFilters: tableSettings.enableColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
    globalFilterFn: fuzzyFilter,
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),

    getPaginationRowModel: getPaginationRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onColumnPinningChange: setColumnPinning,

    autoResetPageIndex,
  });

  useDidUpdate(() => table.resetRowSelection(), [ledgerData]);

  useLockScrollbar(tableSettings.enableFullScreen);

  const visibleColumns = table.getVisibleLeafColumns();
  const debitColumnIndex = visibleColumns.findIndex(
    (col) => col.id === "debit",
  );
  const creditColumnIndex = visibleColumns.findIndex(
    (col) => col.id === "credit",
  );
  const rowsForTotal = table.getFilteredRowModel().rows;
  const totalDebit = rowsForTotal.reduce((sum, row) => sum + Number(row.original?.debit || 0), 0);
  const totalCredit = rowsForTotal.reduce((sum, row) => sum + Number(row.original?.credit || 0), 0);

  // ─── Shared UI components ──────────────────────────────────────────────────
  function PageSpinner() {
    return (
      <div className="flex h-[60vh] items-center justify-center gap-3 text-gray-500">
        <svg className="h-7 w-7 animate-spin text-blue-500" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z" />
        </svg>
        Loading...
      </div>
    );
  }

  // ✅ Loading UI
  if (loading) {
    return (
      <Page title="Ledger">
        <PageSpinner />
      </Page>
    );
  }

  return (
    <Page title="Ledger">
      <div className="transition-content w-full pb-5">
        <div
          className={clsx(
            "flex h-full w-full flex-col",
            tableSettings.enableFullScreen &&
            "fixed inset-0 z-61 bg-white pt-3 dark:bg-dark-900",
          )}
        >
          <Toolbar
            filters={filters}
            onChange={handleFilterChange}
            onSearch={handleSearch}
            customers={customers}
            bdList={bdList}
          />
          <div
            className={clsx(
              "transition-content flex grow flex-col pt-3",
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
                  className="w-full text-left rtl:text-right"
                >
                  <THead>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <Tr key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <Th
                            key={header.id}
                            className={clsx(
                              "bg-gray-200 font-semibold uppercase text-gray-800 dark:bg-dark-800 dark:text-dark-100 first:ltr:rounded-tl-lg last:ltr:rounded-tr-lg first:rtl:rounded-tr-lg last:rtl:rounded-tl-lg",
                              header.column.getCanPin() && [
                                header.column.getIsPinned() === "left" &&
                                "sticky z-2 ltr:left-0 rtl:right-0",
                                header.column.getIsPinned() === "right" &&
                                "sticky z-2 ltr:right-0 rtl:left-0",
                              ],
                            )}
                          >
                            {header.column.getCanSort() ? (
                              <div
                                className="flex cursor-pointer select-none items-center space-x-3 "
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
                    {table.getRowModel().rows.map((row) => {
                      return (
                        <Tr
                          key={row.id}
                          className={clsx(
                            "relative border-y border-transparent border-b-gray-200 dark:border-b-dark-500",
                            row.getIsSelected() && !isSafari &&
                            "row-selected after:pointer-events-none after:absolute after:inset-0 after:z-2 after:h-full after:w-full after:border-3 after:border-transparent after:bg-primary-500/10 ltr:after:border-l-primary-500 rtl:after:border-r-primary-500",
                          )}
                        >
                          {/* first row is a normal row */}
                          {row.getVisibleCells().map((cell) => {
                            return (
                              <Td
                                key={cell.id}
                                className={clsx(
                                  "relative bg-white",
                                  cardSkin === "shadow"
                                    ? "dark:bg-dark-700"
                                    : "dark:bg-dark-900",
                                  cell.column.getCanPin() && [
                                    cell.column.getIsPinned() === "left" &&
                                    "sticky z-2 ltr:left-0 rtl:right-0",
                                    cell.column.getIsPinned() === "right" &&
                                    "sticky z-2 ltr:right-0 rtl:left-0",
                                  ],
                                )}
                              >
                                {cell.column.getIsPinned() && (
                                  <div
                                    className={clsx(
                                      "pointer-events-none absolute inset-0 border-gray-200 dark:border-dark-500",
                                      cell.column.getIsPinned() === "left"
                                        ? "ltr:border-r rtl:border-l"
                                        : "ltr:border-l rtl:border-r",
                                    )}
                                  ></div>
                                )}
                                {flexRender(
                                  cell.column.columnDef.cell,
                                  cell.getContext(),
                                )}
                              </Td>
                            );
                          })}
                        </Tr>
                      );
                    })}
                    {searched && ledgerData.length === 0 && !loading && (
                      <Tr>
                        <Td colSpan={visibleColumns.length} className="py-10 text-center text-gray-500">
                          No transactions found for the selected criteria.
                        </Td>
                      </Tr>
                    )}
                    {!searched && (
                      <Tr>
                        <Td colSpan={visibleColumns.length} className="py-10 text-center text-gray-500">
                          Select a date range and click Search to view the ledger.
                        </Td>
                      </Tr>
                    )}
                    {searched && ledgerData.length > 0 && debitColumnIndex !== -1 && creditColumnIndex !== -1 && (
                      <Tr className="bg-gray-50 font-bold dark:bg-dark-800">
                        {visibleColumns.map((col, idx) => {
                          if (idx === debitColumnIndex - 1) {
                            return (
                              <Td key={col.id} className="text-right">
                                TOTAL
                              </Td>
                            );
                          }
                          if (idx === debitColumnIndex) {
                            return (
                              <Td key={col.id} className="text-right">
                                {new Intl.NumberFormat("en-IN", {
                                  style: "currency",
                                  currency: "INR",
                                }).format(totalDebit)}
                              </Td>
                            );
                          }
                          if (idx === creditColumnIndex) {
                            return (
                              <Td key={col.id} className="text-right">
                                {new Intl.NumberFormat("en-IN", {
                                  style: "currency",
                                  currency: "INR",
                                }).format(totalCredit)}
                              </Td>
                            );
                          }
                          if (idx === creditColumnIndex + 1 && idx < visibleColumns.length) {
                            const balance = totalDebit - totalCredit;
                            return (
                              <Td key={col.id} className="text-right font-bold">
                                {new Intl.NumberFormat("en-IN", {
                                  style: "currency",
                                  currency: "INR",
                                }).format(Math.abs(balance))}
                                {balance >= 0 ? " Dr" : " Cr"}
                              </Td>
                            );
                          }
                          return <Td key={col.id}></Td>;
                        })}
                      </Tr>
                    )}
                  </TBody>
                </Table>
              </div>
              <SelectedRowsActions table={table} />
              {table.getCoreRowModel().rows.length && (
                <div
                  className={clsx(
                    "px-4 pb-4 sm:px-5 sm:pt-4",
                    tableSettings.enableFullScreen &&
                    "bg-gray-50 dark:bg-dark-800",
                    !(
                      table.getIsSomeRowsSelected() ||
                      table.getIsAllRowsSelected()
                    ) && "pt-4",
                  )}
                >
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
