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
import axios from "utils/axios";
import { toast } from "sonner";

// Local Imports
import { Table, Card, THead, TBody, Th, Tr, Td } from "components/ui";
import { TableSortIcon } from "components/shared/table/TableSortIcon";
import { Page } from "components/shared/Page";
import { useLockScrollbar, useDidUpdate, useLocalStorage } from "hooks";
import { fuzzyFilter } from "utils/react-table/fuzzyFilter";
import { useSkipper } from "utils/react-table/useSkipper";
import { Toolbar } from "./Toolbar";
import { columns } from "./columns.jsx";
import { PaginationSection } from "components/shared/table/PaginationSection";
import { useThemeContext } from "app/contexts/theme/context";
import { getUserAgentBrowser } from "utils/dom/getUserAgentBrowser";

// ----------------------------------------------------------------------

const isSafari = getUserAgentBrowser() === "Safari";

export default function ApproveSignature() {
  const { cardSkin } = useThemeContext();

  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  // PHP: viewMultipleApproved() → multiple approve loading state
  const [multiLoading, setMultiLoading] = useState(false);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  // GET /approvals/get-pending-signatures
  // PHP: pendingsignatures where status=0 and signatory=$employeeid,
  //      joined with trfProducts, customers, products
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get("/approvals/get-pending-signatures");
      if (Array.isArray(response.data)) {
        setProducts(response.data);
      } else if (Array.isArray(response.data?.data)) {
        setProducts(response.data.data);
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.error("Error fetching pending signatures:", err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // ── Table setup ───────────────────────────────────────────────────────────
  const [tableSettings, setTableSettings] = useState({
    enableFullScreen: false,
    enableRowDense:   false,
  });

  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting,      setSorting]      = useState([]);

  const [columnVisibility, setColumnVisibility] = useLocalStorage(
    "column-visibility-approvals-approve-signature-1", {}
  );
  const [columnPinning, setColumnPinning] = useLocalStorage(
    "column-pinning-approvals-approve-signature-1", {}
  );

  const [autoResetPageIndex, skipAutoResetPageIndex] = useSkipper();

  const table = useReactTable({
    data: products,
    columns,
    state: { globalFilter, sorting, columnVisibility, columnPinning, tableSettings },
    meta: {
      updateData: (rowIndex, columnId, value) => {
        skipAutoResetPageIndex();
        setProducts((old) =>
          old.map((row, index) =>
            index === rowIndex ? { ...old[rowIndex], [columnId]: value } : row
          )
        );
      },
      deleteRow: (row) => {
        skipAutoResetPageIndex();
        setProducts((old) => old.filter((r) => r.id !== row.original.id));
      },
      deleteRows: (rows) => {
        skipAutoResetPageIndex();
        const ids = rows.map((r) => r.original.id);
        setProducts((old) => old.filter((r) => !ids.includes(r.id)));
      },
      setTableSettings,
      refreshData: fetchProducts,
    },
    filterFns:              { fuzzy: fuzzyFilter },
    enableSorting:          tableSettings.enableSorting,
    enableColumnFilters:    tableSettings.enableColumnFilters,
    getCoreRowModel:        getCoreRowModel(),
    onGlobalFilterChange:   setGlobalFilter,
    getFilteredRowModel:    getFilteredRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
    globalFilterFn:         fuzzyFilter,
    onSortingChange:        setSorting,
    getSortedRowModel:      getSortedRowModel(),
    getPaginationRowModel:  getPaginationRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onColumnPinningChange:    setColumnPinning,
    autoResetPageIndex,
  });

  useDidUpdate(() => table.resetRowSelection(), [products]);
  useLockScrollbar(tableSettings.enableFullScreen);

  // ── Multiple Approve ──────────────────────────────────────────────────────
  // PHP: viewMultipleApproved() → approvesignatureMultiple.php?hakuna=ids.join(",")
  // API: POST /approvals/approve-signatures  body: { ids: [...] }
  const handleMultipleApprove = useCallback(async () => {
    const selectedRows = table.getSelectedRowModel().rows;
    if (selectedRows.length === 0) {
      toast.warning("Please select at least one item.");
      return;
    }
    const ids = selectedRows.map((r) => r.original.id);

    setMultiLoading(true);
    try {
      await axios.post("/approvals/approve-signatures", { ids });
      toast.success(`${ids.length} signature(s) approved successfully ✅`);
      table.options.meta?.deleteRows(selectedRows);
      table.resetRowSelection();
    } catch (err) {
      const msg = err?.response?.data?.message ?? "Failed to approve signatures.";
      toast.error(msg + " ❌");
    } finally {
      setMultiLoading(false);
    }
  }, [table]);

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Page title="Approve Signature">
        <div className="flex h-[60vh] items-center justify-center gap-3 text-gray-500">
          <svg className="h-5 w-5 animate-spin text-blue-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z" />
          </svg>
          Loading…
        </div>
      </Page>
    );
  }

  return (
    <Page title="Approve Signature">
      <div className="transition-content w-full pb-5">
        <div
          className={clsx(
            "flex h-full w-full flex-col",
            tableSettings.enableFullScreen &&
              "fixed inset-0 z-61 bg-white pt-3 dark:bg-dark-900",
          )}
        >
          <Toolbar table={table} />

          <div
            className={clsx(
              "transition-content flex grow flex-col pt-3",
              tableSettings.enableFullScreen ? "overflow-hidden" : "px-[var(--margin-x)]",
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
                                header.column.getIsPinned() === "left"  && "sticky z-2 ltr:left-0 rtl:right-0",
                                header.column.getIsPinned() === "right" && "sticky z-2 ltr:right-0 rtl:left-0",
                              ],
                            )}
                          >
                            {header.column.getCanSort() ? (
                              <div
                                className="flex cursor-pointer select-none items-center space-x-3"
                                onClick={header.column.getToggleSortingHandler()}
                              >
                                <span className="flex-1">
                                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                </span>
                                <TableSortIcon sorted={header.column.getIsSorted()} />
                              </div>
                            ) : header.isPlaceholder ? null : (
                              flexRender(header.column.columnDef.header, header.getContext())
                            )}
                          </Th>
                        ))}
                      </Tr>
                    ))}
                  </THead>
                  <TBody>
                    {table.getRowModel().rows.length === 0 ? (
                      <Tr>
                        <Td colSpan={99} className="py-12 text-center text-sm text-gray-400">
                          No items found.
                        </Td>
                      </Tr>
                    ) : (
                      table.getRowModel().rows.map((row) => (
                        <Tr
                          key={row.id}
                          className={clsx(
                            "relative border-y border-transparent border-b-gray-200 dark:border-b-dark-500",
                            row.getIsSelected() && !isSafari &&
                              "row-selected after:pointer-events-none after:absolute after:inset-0 after:z-2 after:h-full after:w-full after:border-3 after:border-transparent after:bg-primary-500/10 ltr:after:border-l-primary-500 rtl:after:border-r-primary-500",
                          )}
                        >
                          {row.getVisibleCells().map((cell) => (
                            <Td
                              key={cell.id}
                              className={clsx(
                                "relative bg-white",
                                cardSkin === "shadow" ? "dark:bg-dark-700" : "dark:bg-dark-900",
                                cell.column.getCanPin() && [
                                  cell.column.getIsPinned() === "left"  && "sticky z-2 ltr:left-0 rtl:right-0",
                                  cell.column.getIsPinned() === "right" && "sticky z-2 ltr:right-0 rtl:left-0",
                                ],
                              )}
                            >
                              {cell.column.getIsPinned() && (
                                <div
                                  className={clsx(
                                    "pointer-events-none absolute inset-0 border-gray-200 dark:border-dark-500",
                                    cell.column.getIsPinned() === "left" ? "ltr:border-r rtl:border-l" : "ltr:border-l rtl:border-r",
                                  )}
                                />
                              )}
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </Td>
                          ))}
                        </Tr>
                      ))
                    )}
                  </TBody>
                </Table>
              </div>

              {/* PHP: <button onclick="viewMultipleApproved()">Multiple Approve</button> */}
              <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 dark:border-dark-600">
                <button
                  onClick={handleMultipleApprove}
                  disabled={multiLoading || !table.getIsSomeRowsSelected() && !table.getIsAllRowsSelected()}
                  className={clsx(
                    "rounded-md bg-green-600 px-4 py-2 text-xs font-semibold text-white shadow transition hover:bg-green-700",
                    (multiLoading || (!table.getIsSomeRowsSelected() && !table.getIsAllRowsSelected())) &&
                      "cursor-not-allowed opacity-50",
                  )}
                >
                  {multiLoading ? "Approving…" : "Multiple Approve"}
                </button>

                {(table.getIsSomeRowsSelected() || table.getIsAllRowsSelected()) && (
                  <span className="text-xs text-gray-500 dark:text-dark-400">
                    {table.getSelectedRowModel().rows.length} selected
                  </span>
                )}
              </div>

              {table.getCoreRowModel().rows.length > 0 && (
                <div
                  className={clsx(
                    "px-4 pb-4 sm:px-5 sm:pt-4",
                    tableSettings.enableFullScreen && "bg-gray-50 dark:bg-dark-800",
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