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
import { useLocation, useSearchParams } from "react-router";
import clsx from "clsx";
import { useState, useEffect, useCallback, Fragment } from "react";
import { useNavigate } from "react-router";
import axios from "utils/axios";

// Local Imports
import { Table, Card, THead, TBody, Th, Tr, Td, Input } from "components/ui";
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

export default function ProductsDatatableV1() {
  const { cardSkin } = useThemeContext();
  const navigate = useNavigate();
  const permissions = JSON.parse(localStorage.getItem("userPermissions") || "[]");

  useEffect(() => {
    if (!permissions.includes(199)) {
      navigate("/dashboards");
    }
  }, [navigate, permissions]);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [lastModifiedId, setLastModifiedId] = useLocalStorage(
    "test-permissible-values-last-modified-id",
    null,
  );

  // Update persistent lastModifiedId when navigation state changes
  useEffect(() => {
    const idFromNav =
      searchParams.get("updatedId") || location.state?.updatedId;
    if (idFromNav) {
      setLastModifiedId(parseInt(idFromNav));
    }
  }, [location.state, searchParams, setLastModifiedId]);

  // ✅ Fetch products from API (Memoized to prevent unnecessary re-runs)
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get("/testing/get-permissible-value");

      // Check if response has the expected structure
      let data = [];
      if (response.data && Array.isArray(response.data)) {
        data = [...response.data];
      } else if (response.data.status && Array.isArray(response.data.data)) {
        data = [...response.data.data];
      } else {
        console.warn("Unexpected response structure:", response.data);
      }

      // 1️⃣ Default Sort: Highest ID first (Newest at top)
      data.sort((a, b) => parseInt(b.id) - parseInt(a.id));

      // 2️⃣ "Edit Mode" Sort: Move the specifically updated item (Persistent) to the ABSOLUTE top
      if (lastModifiedId && data.length > 0) {
        const index = data.findIndex(
          (p) => parseInt(p.id) === parseInt(lastModifiedId),
        );
        if (index > -1) {
          const [item] = data.splice(index, 1);
          data.unshift(item);
        }
      }

      setProducts(data);
    } catch (err) {
      console.error("Error fetching product list:", err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [lastModifiedId]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts, lastModifiedId]);

  const [tableSettings, setTableSettings] = useState({
    enableFullScreen: false,
    enableRowDense: false,
    enableColumnFilters: true,
  });

  const [globalFilter, setGlobalFilter] = useState("");

  const [sorting, setSorting] = useState([{ id: "id", desc: true }]);
  const [columnFilters, setColumnFilters] = useState([]);

  const [columnVisibility, setColumnVisibility] = useLocalStorage(
    "column-visibility-products-1",
    {},
  );

  const [columnPinning, setColumnPinning] = useLocalStorage(
    "column-pinning-products-1",
    {},
  );

  const [autoResetPageIndex, skipAutoResetPageIndex] = useSkipper();

  const table = useReactTable({
    data: products,
    columns: columns,
    state: {
      globalFilter,
      sorting,
      columnFilters,
      columnVisibility,
      columnPinning,
      tableSettings,
    },
    onColumnFiltersChange: setColumnFilters,
    meta: {
      updateData: (rowIndex, columnId, value) => {
        skipAutoResetPageIndex();
        setProducts((old) =>
          old.map((row, index) => {
            if (index === rowIndex) {
              return {
                ...old[rowIndex],
                [columnId]: value,
              };
            }
            return row;
          }),
        );
      },
      deleteRow: (row) => {
        skipAutoResetPageIndex();
        setProducts((old) =>
          old.filter((oldRow) => oldRow.id !== row.original.id),
        );
      },
      deleteRows: (rows) => {
        skipAutoResetPageIndex();
        const rowIds = rows.map((row) => row.original.id);
        setProducts((old) => old.filter((row) => !rowIds.includes(row.id)));
      },
      setTableSettings,
      refreshData: fetchProducts, // ✅ Add refresh function
    },
    filterFns: {
      fuzzy: fuzzyFilter,
    },
    enableSorting: tableSettings.enableSorting ?? true,
    enableColumnFilters: true,
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

  useDidUpdate(() => table.resetRowSelection(), [products]);

  useLockScrollbar(tableSettings.enableFullScreen);

  // ✅ Loading UI
  if (loading) {
    return (
      <Page title="Permissible Values List">
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
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z"
            ></path>
          </svg>
          Loading Permissible Values...
        </div>
      </Page>
    );
  }

  return (
    <Page title="Permissible Values List">
      <div className="transition-content w-full pb-5">
        <div
          className={clsx(
            "flex h-full w-full flex-col",
            tableSettings.enableFullScreen &&
            "dark:bg-dark-900 fixed inset-0 z-61 bg-white pt-3",
          )}
        >
          <Toolbar table={table} />
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
                      <Fragment key={headerGroup.id}>
                        <Tr>
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
                        <Tr className="dark:bg-dark-800/50 bg-gray-50">
                          {headerGroup.headers.map((header) => (
                            <Th
                              key={header.id + "-filter"}
                              className={clsx(
                                "dark:border-dark-600 border-t border-gray-300 px-2 py-1.5",
                                header.column.getCanPin() && [
                                  header.column.getIsPinned() === "left" &&
                                  "sticky z-2 ltr:left-0 rtl:right-0",
                                  header.column.getIsPinned() === "right" &&
                                  "sticky z-2 ltr:right-0 rtl:left-0",
                                ],
                              )}
                            >
                              {header.column.getCanFilter() ? (
                                <div onClick={(e) => e.stopPropagation()}>
                                  <Input
                                    size="sm"
                                    placeholder={`Search...`}
                                    value={header.column.getFilterValue() ?? ""}
                                    onChange={(e) =>
                                      header.column.setFilterValue(
                                        e.target.value,
                                      )
                                    }
                                    classNames={{
                                      input:
                                        "ring-primary-500/30 dark:bg-dark-900 dark:border-dark-700 h-7 border-gray-300 px-2 py-1 text-[10px] focus:ring-1",
                                    }}
                                  />
                                </div>
                              ) : null}
                            </Th>
                          ))}
                        </Tr>
                      </Fragment>
                    ))}
                  </THead>
                  <TBody>
                    {table.getRowModel().rows.map((row) => {
                      return (
                        <Tr
                          key={row.id}
                          className={clsx(
                            "dark:border-b-dark-500 relative border-y border-transparent border-b-gray-200",
                            row.getIsSelected() &&
                            !isSafari &&
                            "row-selected after:bg-primary-500/10 ltr:after:border-l-primary-500 rtl:after:border-r-primary-500 after:pointer-events-none after:absolute after:inset-0 after:z-2 after:h-full after:w-full after:border-3 after:border-transparent",
                          )}
                        >
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
                                      "dark:border-dark-500 pointer-events-none absolute inset-0 border-gray-200",
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
                  </TBody>
                </Table>
              </div>
              <SelectedRowsActions table={table} />
              {table.getCoreRowModel().rows.length && (
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
