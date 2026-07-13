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
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import axios from "utils/axios";

// Local Imports
import { Table, Card, THead, TBody, TFoot, Th, Tr, Td } from "components/ui";
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

// PHP permission IDs replicated — adjust to your auth system
export default function PaymentList() {
  const { cardSkin } = useThemeContext();
  const navigate = useNavigate();
  const permissions = JSON.parse(localStorage.getItem("userPermissions") || "[]");

  useEffect(() => {
    if (!permissions.includes(275)) {
      navigate("/dashboards");
    }
  }, [navigate, permissions]);

  const [payments, setPayments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [bdList, setBdList] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── Filter state (mirrors PHP GET params) ──────────────────────────────────
  const [filters, setFilters] = useState({
    startdate: "",
    enddate: "",
    customerid: "",
    bd: "",
  });

  const fetchCustomers = async () => {
    try {
      const res = await axios.get("/people/get-all-customers");
      if (res.data.status && Array.isArray(res.data.data)) {
        setCustomers(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching customers:", err);
    }
  };

  const fetchBdList = async () => {
    try {
      const res = await axios.get("/people/get-customer-bd");
      if (
        (res.data.status === true || res.data.status === "true") &&
        Array.isArray(res.data.data)
      ) {
        setBdList(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching BD list:", err);
    }
  };

  // ── Fetch payments — called on mount and on Search click ───────────────────
  const fetchPayments = useCallback(
    async (f = filters) => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (f.customerid) params.append("customerid", f.customerid);
        if (f.startdate) params.append("startdate", f.startdate);
        if (f.enddate) params.append("enddate", f.enddate);
        if (f.bd) params.append("bd", f.bd);

        const res = await axios.get(
          `/accounts/get-payment-list?${params.toString()}`,
        );
        if (res.data.status && Array.isArray(res.data.data)) {
          setPayments(res.data.data);
        } else {
          console.warn("Unexpected response:", res.data);
          setPayments([]);
        }
      } catch (err) {
        console.error("Error fetching payments:", err);
      } finally {
        setLoading(false);
      }
    },
    [filters],
  );

  // Called when Search button is clicked
  const handleSearch = () => fetchPayments(filters);

  // ── Fetch dropdown data on mount ───────────────────────────────────────────
  useEffect(() => {
    fetchCustomers();
    fetchBdList();
    fetchPayments(filters);
  }, [fetchPayments, filters]);

  // ── Table settings ─────────────────────────────────────────────────────────
  const [tableSettings, setTableSettings] = useState({
    enableFullScreen: false,
    enableRowDense: false,
  });

  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState([{ id: "receiptno", desc: true }]);

  const [columnVisibility, setColumnVisibility] = useLocalStorage(
    "column-visibility-payment-list",
    {},
  );
  const [columnPinning, setColumnPinning] = useLocalStorage(
    "column-pinning-payment-list",
    {},
  );

  const [autoResetPageIndex, skipAutoResetPageIndex] = useSkipper();

  const table = useReactTable({
    data: payments,
    columns,
    state: {
      globalFilter,
      sorting,
      columnVisibility,
      columnPinning,
      tableSettings,
    },
    meta: {
      permissions,
      updateData: (rowIndex, columnId, value) => {
        skipAutoResetPageIndex();
        setPayments((old) =>
          old.map((row, index) =>
            index === rowIndex ? { ...old[rowIndex], [columnId]: value } : row,
          ),
        );
      },
      deleteRow: (row) => {
        skipAutoResetPageIndex();
        setPayments((old) => old.filter((r) => r.id !== row.original.id));
      },
      deleteRows: (rows) => {
        skipAutoResetPageIndex();
        const ids = rows.map((r) => r.original.id);
        setPayments((old) => old.filter((r) => !ids.includes(r.id)));
      },
      setTableSettings,
    },
    filterFns: { fuzzy: fuzzyFilter },
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

  useDidUpdate(() => table.resetRowSelection(), [payments]);
  useLockScrollbar(tableSettings.enableFullScreen);

  // ── Loading UI ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Page title="Payment List">
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
          Loading Payments...
        </div>
      </Page>
    );
  }

  return (
    <Page title="Payment List">
      <div className="transition-content w-full pb-5">
        <div
          className={clsx(
            "flex h-full w-full flex-col",
            tableSettings.enableFullScreen &&
              "dark:bg-dark-900 fixed inset-0 z-61 bg-white pt-3",
          )}
        >
          {/* ── Toolbar with filters ── */}
          <Toolbar
            table={table}
            filters={filters}
            setFilters={setFilters}
            customers={customers}
            bdList={bdList}
            onSearch={handleSearch}
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
                              "dark:bg-dark-800 dark:text-dark-100 bg-gray-200 font-semibold text-gray-800 uppercase first:ltr:rounded-tl-lg last:ltr:rounded-tr-lg first:rtl:rounded-tr-lg last:rtl:rounded-tl-lg",
                              header.column.getCanPin() && [
                                header.column.getIsPinned() === "left" &&
                                  "sticky z-2 ltr:left-0 rtl:right-0",
                                header.column.getIsPinned() === "right" &&
                                  "sticky z-2 ltr:right-0 rtl:left-0",
                              ],
                              header.column.columnDef.meta?.className
                            )}
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
                    {table.getRowModel().rows.map((row) => (
                      <Tr
                        key={row.id}
                        className={clsx(
                          "dark:border-b-dark-500 relative border-y border-transparent border-b-gray-200",
                          row.getIsSelected() &&
                            !isSafari &&
                            "row-selected after:bg-primary-500/10 ltr:after:border-l-primary-500 rtl:after:border-r-primary-500 after:pointer-events-none after:absolute after:inset-0 after:z-2 after:h-full after:w-full after:border-3 after:border-transparent",
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
                              cell.column.getCanPin() && [
                                cell.column.getIsPinned() === "left" &&
                                  "sticky z-2 ltr:left-0 rtl:right-0",
                                cell.column.getIsPinned() === "right" &&
                                  "sticky z-2 ltr:right-0 rtl:left-0",
                              ],
                              cell.column.columnDef.meta?.className
                            )}
                          >
                            {cell.column.getIsPinned() && (
                              <div
                                className={clsx(
                                  "dark:border-dark-500 pointer-events-none absolute inset-0 border-gray-200",
                                  cell.column.getIsPinned() === "left"
                                    ? "ltr:border-r rtl:border-l"
                                    : "ltr:border-l rtl:border-r",
                                )}
                              />
                            )}
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </Td>
                        ))}
                      </Tr>
                    ))}
                  </TBody>
                  {table.getRowModel().rows.length > 0 && (
                    <TFoot className="dark:bg-dark-800 bg-gray-100 font-semibold text-gray-800">
                      <Tr>
                        <Td />
                        <Td className="whitespace-nowrap">This Page Total</Td>
                        <Td colSpan={9} />
                        <Td className="whitespace-nowrap">Total Amount</Td>
                        <Td>{table.getRowModel().rows.reduce((sum, row) => sum + (parseFloat(row.original.paymentamount) || 0), 0).toFixed(2)}</Td>
                        <Td>{table.getRowModel().rows.reduce((sum, row) => sum + (parseFloat(row.original.tds) || 0), 0).toFixed(2)}</Td>
                        <Td>{table.getRowModel().rows.reduce((sum, row) => sum + (parseFloat(row.original.totalinvoiceamount) || 0), 0).toFixed(2)}</Td>
                        <Td />
                      </Tr>
                    </TFoot>
                  )}
                </Table>
              </div>

              <SelectedRowsActions table={table} />

              {table.getCoreRowModel().rows.length > 0 && (
                <div
                  className={clsx(
                    "px-4 pb-4 sm:px-5 sm:pt-4",
                    tableSettings.enableFullScreen &&
                      "dark:bg-dark-800 bg-gray-50",
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
