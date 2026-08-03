// Import Dependencies
import {
  flexRender,
  getCoreRowModel,
  getFacetedMinMaxValues,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import clsx from "clsx";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import axios from "utils/axios";
import * as XLSX from "xlsx";

// Local Imports
import { Table, Card, THead, TBody, Th, Tr, Td } from "components/ui";
import { TableSortIcon } from "components/shared/table/TableSortIcon";
import { Page } from "components/shared/Page";
import { useLockScrollbar, useDidUpdate, useLocalStorage } from "hooks";
import { fuzzyFilter } from "utils/react-table/fuzzyFilter";
import { useSkipper } from "utils/react-table/useSkipper";
import { Toolbar } from "./Toolbar";
import { columns } from "./columns";
import { useThemeContext } from "app/contexts/theme/context";
import { getUserAgentBrowser } from "utils/dom/getUserAgentBrowser";

// ----------------------------------------------------------------------

const isSafari = getUserAgentBrowser() === "Safari";

// ─── Shared UI ─────────────────────────────────────────────────────────────
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

// ─── Status Badge (mirrors PHP badges) ────────────────────────────────────
export function StatusBadge({ status }) {
  const s = String(status);
  if (s === "99") {
    return (
      <span className="inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
        Canceled
      </span>
    );
  }
  if (s === "0") {
    return (
      <span className="inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
        Pending
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
      Active
    </span>
  );
}

// ----------------------------------------------------------------------

export default function InvoiceReport() {
  const { cardSkin } = useThemeContext();
  const navigate = useNavigate();
  const permissions = JSON.parse(localStorage.getItem("userPermissions") || "[]");

  useEffect(() => {
    if (!permissions.includes(146)) {
      navigate("/dashboards");
    }
  }, [navigate, permissions]);

  const [orders, setOrders] = useState([]);
  const [totals, setTotals] = useState(null); // pre-calculated from API
  // null = not yet searched, true = loading, false = done
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const [customers, setCustomers] = useState([]);
  const [bdList, setBdList] = useState([]);

  const [filters, setFilters] = useState({
    startdate: "",
    enddate: "",
    month: "",   // NEW: month filter (YYYY-MM format)
    customerid: "",
    bd: "",
    typeofinvoice: "",
  });

  // Fetch dropdown data on mount
  useEffect(() => {
    axios
      .get("/people/get-all-customers")
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
        setCustomers(data);
      })
      .catch((err) => console.error("Failed to load customers:", err));

    axios
      .get("/people/get-customer-bd")
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
        setBdList(data);
      })
      .catch((err) => console.error("Failed to load BD list:", err));
  }, []);

  // PHP logic: only fetch if at least one filter is provided
  const hasAnyFilter = (f) =>
    (f.customerid && f.customerid !== "") ||
    (f.startdate && f.startdate !== "" && f.enddate && f.enddate !== "") ||
    (f.month && f.month !== "") ||
    (f.bd && f.bd !== "") ||
    (f.typeofinvoice && f.typeofinvoice !== "");

  const fetchInvoices = async (currentFilters) => {
    const f = currentFilters ?? filters;

    if (!hasAnyFilter(f)) {
      // PHP shows nothing if no filter — just mark as searched with empty data
      setHasSearched(true);
      setOrders([]);
      setTotals(null);
      return;
    }

    try {
      setLoading(true);
      setHasSearched(true);
      const res = await axios.get("/accounts/get-invoice-report", {
        params: {
          startdate: f.startdate || undefined,
          enddate: f.enddate || undefined,
          month: f.month || undefined,
          customerid: f.customerid || undefined,
          bd: f.bd || undefined,
          typeofinvoice: f.typeofinvoice || undefined,
        },
      });
      // API returns { status, count, data: [...], totals: {...} }
      const payload = res.data;
      setOrders(Array.isArray(payload) ? payload : payload?.data || []);
      setTotals(payload?.totals || null);
    } catch (err) {
      console.error("Error fetching invoice report:", err);
      setOrders([]);
      setTotals(null);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = (e) => {
    e?.preventDefault?.();
    fetchInvoices(filters);
  };

  // ── Excel Export (mirrors PHP table columns exactly) ──────────────────────
  const exportToExcel = () => {
    if (!orders.length) return;

    const t = totals ?? {};
    const fmt = (v) => Number(v || 0).toFixed(2);

    // Data rows — same columns as PHP table
    const rows = orders.map((row, idx) => ({
      "Sr. No":             idx + 1,
      "Customer Name":     row.custname     ?? "-",
      "PO Number":         row.ponumber     ?? "-",
      "Invoice No":        row.invoiceno    ?? "-",
      "Item Total":        row.subtotal     ?? 0,
      "Discount":          row.discount     ?? 0,
      "Witness":           row.witnesscharges ?? 0,
      "Sample Handling":   row.samplehandling ?? 0,
      "Sample Preparation": row.sampleprep  ?? 0,
      "Freight Charges":   row.freight      ?? 0,
      "Mobilization":      row.mobilisation ?? 0,
      "Total Taxable":     row.subtotal2    ?? 0,
      "SGST":              row.sgstamount   ?? 0,
      "CGST":              row.cgstamount   ?? 0,
      "IGST":              row.igstamount   ?? 0,
      "Invoice Amount":    row.finaltotal   ?? 0,
      "Remaining Amount":  row.remaining    ?? 0,
      "Invoice Type":      row.typeofinvoice ?? "-",
      "Status":            String(row.status) === "99" ? "Canceled"
                         : String(row.status) === "0"  ? "Pending"
                         : "Active",
    }));

    // Totals row — exactly jaise PHP me <tr> se Total Amount row tha
    rows.push({
      "Sr. No":             "Total Amount",
      "Customer Name":     "",
      "PO Number":         "",
      "Invoice No":        "",
      "Item Total":        fmt(t.subtotal),
      "Discount":          fmt(t.discount),
      "Witness":           fmt(t.witnesscharges),
      "Sample Handling":   fmt(t.samplehandling),
      "Sample Preparation": fmt(t.sampleprep),
      "Freight Charges":   fmt(t.freight),
      "Mobilization":      fmt(t.mobilisation),
      "Total Taxable":     fmt(t.subtotal2),
      "SGST":              fmt(t.sgstamount),
      "CGST":              fmt(t.cgstamount),
      "IGST":              fmt(t.igstamount),
      "Invoice Amount":    fmt(t.finaltotal),
      "Remaining Amount":  fmt(t.remaining),
      "Invoice Type":      "",
      "Status":            "",
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook  = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Invoice Report");

    // Auto column width
    const colWidths = Object.keys(rows[0]).map((key) => ({
      wch: Math.max(key.length, 14),
    }));
    worksheet["!cols"] = colWidths;

    // File name: InvoiceReport_2026-07-31.xlsx
    const fileName = `InvoiceReport_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  // ── Table config ──────────────────────────────────────────────────────────

  const [tableSettings, setTableSettings] = useState({
    enableFullScreen: false,
    enableRowDense: false,
  });

  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState([]);

  const [columnVisibility, setColumnVisibility] = useLocalStorage(
    "column-visibility-invoice-report",
    {},
  );

  const [columnPinning, setColumnPinning] = useLocalStorage(
    "column-pinning-invoice-report",
    {},
  );

  const [autoResetPageIndex, skipAutoResetPageIndex] = useSkipper();

  const table = useReactTable({
    data: orders,
    columns,
    state: {
      globalFilter,
      sorting,
      columnVisibility,
      columnPinning,
    },
    meta: {
      updateData: (rowIndex, columnId, value) => {
        skipAutoResetPageIndex();
        setOrders((old) =>
          old.map((row, index) =>
            index === rowIndex ? { ...old[rowIndex], [columnId]: value } : row,
          ),
        );
      },
      deleteRow: (row) => {
        skipAutoResetPageIndex();
        setOrders((old) => old.filter((r) => r.id !== row.original.id));
      },
      deleteRows: (rows) => {
        skipAutoResetPageIndex();
        const ids = rows.map((r) => r.original.id);
        setOrders((old) => old.filter((r) => !ids.includes(r.id)));
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
    // NO getPaginationRowModel — pagination removed as per PHP original
    onColumnVisibilityChange: setColumnVisibility,
    onColumnPinningChange: setColumnPinning,
    autoResetPageIndex,
  });

  useDidUpdate(() => table.resetRowSelection(), [orders]);
  useLockScrollbar(tableSettings.enableFullScreen);

  // ── Totals row: use API-provided totals (exact field names from backend)
  const allRows = table.getFilteredRowModel().rows;
  const t = totals ?? {};
  const fmt = (v) => Number(v || 0).toFixed(2);
  const apiTotals = {
    subtotal:       fmt(t.subtotal),
    discount:       fmt(t.discount),
    witnesscharges: fmt(t.witnesscharges),
    samplehandling: fmt(t.samplehandling),
    sampleprep:     fmt(t.sampleprep),
    freight:        fmt(t.freight),
    mobilisation:   fmt(t.mobilisation),
    subtotal2:      fmt(t.subtotal2),
    sgstamount:     fmt(t.sgstamount),
    cgstamount:     fmt(t.cgstamount),
    igstamount:     fmt(t.igstamount),
    finaltotal:     fmt(t.finaltotal),
    remaining:      fmt(t.remaining),
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Page title="Invoice Report">
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
            onExport={exportToExcel}
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
            {/* Loading state */}
            {loading && <PageSpinner />}

            {/* Not yet searched — prompt user */}
            {!loading && !hasSearched && (
              <div className="flex h-40 items-center justify-center rounded border border-dashed border-gray-300 text-sm text-gray-400 dark:border-dark-500">
                Select at least one filter and click Search to view the invoice report.
              </div>
            )}

            {/* Searched but no results */}
            {!loading && hasSearched && orders.length === 0 && (
              <div className="flex h-40 items-center justify-center rounded border border-dashed border-gray-300 text-sm text-gray-400 dark:border-dark-500">
                No invoices found for the selected filters.
              </div>
            )}

            {/* Table — only when we have data */}
            {!loading && orders.length > 0 && (
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
                    className="w-full text-left rtl:text-right text-[11px] [&_td]:!whitespace-normal [&_th]:!whitespace-normal"
                  >
                    <THead>
                      {table.getHeaderGroups().map((headerGroup) => (
                        <Tr key={headerGroup.id}>
                          {headerGroup.headers.map((header) => (
                            <Th
                              key={header.id}
                              className={clsx(
                                "!px-1 !sm:px-1 bg-gray-200 font-semibold uppercase text-gray-800 dark:bg-dark-800 dark:text-dark-100 first:ltr:rounded-tl-lg last:ltr:rounded-tr-lg first:rtl:rounded-tr-lg last:rtl:rounded-tl-lg",
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
                                  className="flex cursor-pointer select-none items-center space-x-1"
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
                                  <TableSortIcon sorted={header.column.getIsSorted()} />
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
                            "relative border-y border-transparent border-b-gray-200 dark:border-b-dark-500",
                            row.getIsSelected() &&
                              !isSafari &&
                              "row-selected after:pointer-events-none after:absolute after:inset-0 after:z-2 after:h-full after:w-full after:border-3 after:border-transparent after:bg-primary-500/10 ltr:after:border-l-primary-500 rtl:after:border-r-primary-500",
                          )}
                        >
                          {row.getVisibleCells().map((cell) => (
                            <Td
                              key={cell.id}
                              className={clsx(
                                "!px-1 !sm:px-1 relative bg-white",
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

                      {/* ── Totals row (mirrors PHP <tr> with totals) ── */}
                      {allRows.length > 0 && (
                        <Tr className="border-t-2 border-gray-300 bg-gray-50 font-semibold dark:border-dark-400 dark:bg-dark-800">
                          {table.getVisibleLeafColumns().map((col) => {
                            const id = col.id;
                            // "Total Amount" label spanning the first 4 cols (s_no, custname, ponumber, invoiceno)
                            if (id === "s_no") {
                              return (
                                <Td
                                  key={id}
                                  colSpan={4}
                                  className="py-2 text-right font-bold"
                                >
                                  Total Amount
                                </Td>
                              );
                            }
                            if (["custname", "ponumber", "invoiceno"].includes(id)) {
                              return null; // absorbed by colSpan above
                            }
                            if (id === "subtotal")      return <Td key={id} className="py-2">{apiTotals.subtotal}</Td>;
                            if (id === "discount")      return <Td key={id} className="py-2">{apiTotals.discount}</Td>;
                            if (id === "witnesscharges") return <Td key={id} className="py-2">{apiTotals.witnesscharges}</Td>;
                            if (id === "samplehandling") return <Td key={id} className="py-2">{apiTotals.samplehandling}</Td>;
                            if (id === "sampleprep")    return <Td key={id} className="py-2">{apiTotals.sampleprep}</Td>;
                            if (id === "freight")       return <Td key={id} className="py-2">{apiTotals.freight}</Td>;
                            if (id === "mobilisation")  return <Td key={id} className="py-2">{apiTotals.mobilisation}</Td>;
                            if (id === "subtotal2")     return <Td key={id} className="py-2">{apiTotals.subtotal2}</Td>;
                            if (id === "sgstamount")    return <Td key={id} className="py-2">{apiTotals.sgstamount}</Td>;
                            if (id === "cgstamount")    return <Td key={id} className="py-2">{apiTotals.cgstamount}</Td>;
                            if (id === "igstamount")    return <Td key={id} className="py-2">{apiTotals.igstamount}</Td>;
                            if (id === "finaltotal")    return <Td key={id} className="py-2">{apiTotals.finaltotal}</Td>;
                            if (id === "remaining")     return <Td key={id} className="py-2">{apiTotals.remaining}</Td>;
                            // typeofinvoice & status columns — empty in totals row
                            return <Td key={id} />;
                          })}
                        </Tr>
                      )}
                    </TBody>
                  </Table>
                </div>

              </Card>
            )}
          </div>
        </div>
      </div>
    </Page>
  );
}
