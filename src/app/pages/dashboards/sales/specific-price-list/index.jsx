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
import { Link } from "react-router-dom";
import axios from "utils/axios";

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

const isSafari = getUserAgentBrowser() === "Safari";

export default function SpecificPriceList() {
  const { cardSkin } = useThemeContext();

  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch special prices data
  const fetchSpecialPrices = async () => {
    try {
      setLoading(true);
      
      const res = await axios.get("/sales/special-price-list");
      
      let rows = res.data?.data || res.data || [];
      
      rows = rows.map((row, index) => ({
        id: row.id,
        sno: index + 1,
        product: row.product_name || "",
        package: row.package_name || "",
        customer: row.customer_name || "",
        price: row.price || "",
      }));
      
      setTableData(rows);
    } catch (err) {
      console.error("Error fetching special prices:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpecialPrices();
  }, []);

  // Delete special price
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this special price?")) {
      return;
    }

    try {
      await axios.delete(`/sales/delete-special-price/${id}`);
      fetchSpecialPrices();
    } catch (err) {
      console.error("Error deleting special price:", err);
      alert("Error deleting special price. Please try again.");
    }
  };

  const [tableSettings, setTableSettings] = useState({
    enableFullScreen: false,
    enableRowDense: false,
    enableSorting: true,
    enableColumnFilters: false,
  });

  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState([{ id: "sno", desc: false }]);

  const [columnVisibility, setColumnVisibility] = useLocalStorage(
    "column-visibility-specific-price-list-1",
    {}
  );
  const [columnPinning, setColumnPinning] = useLocalStorage(
    "column-pinning-specific-price-list-1",
    {}
  );

  const [autoResetPageIndex] = useSkipper();

  // Define columns matching the PHP table structure
  const specialPriceColumns = [
    {
      accessorKey: "sno",
      header: "S. No.",
      size: 80,
      cell: (info) => (
        <span className="text-sm text-gray-600 dark:text-dark-300">
          {info.getValue()}
        </span>
      ),
    },
    {
      accessorKey: "product",
      header: "Product",
      size: 300,
      cell: (info) => (
        <div className="text-sm text-gray-800 dark:text-dark-100 whitespace-normal break-words">
          {info.getValue()}
        </div>
      ),
    },
    {
      accessorKey: "package",
      header: "Package",
      size: 250,
      cell: (info) => (
        <div className="text-sm text-gray-600 dark:text-dark-300 whitespace-normal break-words">
          {info.getValue()}
        </div>
      ),
    },
    {
      accessorKey: "customer",
      header: "Customer",
      size: 200,
      cell: (info) => (
        <div className="text-sm text-gray-600 dark:text-dark-300 whitespace-normal break-words">
          {info.getValue()}
        </div>
      ),
    },
    {
      accessorKey: "price",
      header: "Price",
      size: 120,
      cell: (info) => (
        <span className="text-sm font-semibold text-blue-600 dark:text-blue-400 whitespace-nowrap">
          ₹{parseFloat(info.getValue() || 0).toLocaleString("en-IN")}
        </span>
      ),
    },
    {
      id: "delete",
      header: "Delete",
      size: 100,
      cell: (info) => {
        const row = info.row.original;
        return (
          <button
            onClick={() => handleDelete(row.id)}
            className="inline-flex items-center justify-center rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 whitespace-nowrap"
          >
            Delete
          </button>
        );
      },
    },
  ];

  const table = useReactTable({
    data: tableData,
    columns: specialPriceColumns,
    state: {
      globalFilter,
      sorting,
      columnVisibility,
      columnPinning,
      tableSettings,
    },
    meta: { setTableSettings },
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

  useDidUpdate(() => table.resetRowSelection(), [tableData]);
  useLockScrollbar(tableSettings.enableFullScreen);

  if (loading) {
    return (
      <Page title="Customer Specific Price List">
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
          Loading Customer Specific Price List...
        </div>
      </Page>
    );
  }

  return (
    <Page title="Customer Specific Price List">
      <div className="transition-content w-full pb-5">
        <div
          className={clsx(
            "flex h-full w-full flex-col",
            tableSettings.enableFullScreen &&
              "fixed inset-0 z-61 bg-white pt-3 dark:bg-dark-900",
          )}
        >
          {/* ── Toolbar ── */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-[var(--margin-x)] pt-4 pb-3">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-dark-50">
              Customer Specific Price List
              <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-sm font-normal text-gray-500 dark:bg-dark-700 dark:text-dark-300">
                {tableData.length}
              </span>
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                placeholder="Search product, customer..."
                className="h-9 w-60 rounded-md border border-gray-300 px-3 text-sm text-gray-700 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none dark:border-dark-500 dark:bg-dark-800 dark:text-dark-100"
              />
              <Link
                to="/dashboards/sales/specific-price-list/add"
                className="inline-flex h-9 items-center justify-center rounded-md bg-blue-500 px-4 text-sm font-medium text-white hover:bg-blue-600"
              >
                + Add New Special Price
              </Link>
            </div>
          </div>

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
                            className="bg-gray-200 font-semibold uppercase text-gray-800 dark:bg-dark-800 dark:text-dark-100 first:ltr:rounded-tl-lg last:ltr:rounded-tr-lg"
                          >
                            {header.column.getCanSort() ? (
                              <div
                                className="flex cursor-pointer select-none items-center space-x-3"
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
                            "relative border-y border-transparent border-b-gray-200 dark:border-b-dark-500",
                            row.getIsSelected() &&
                              !isSafari &&
                              "row-selected after:pointer-events-none after:absolute after:inset-0 after:z-2 after:h-full after:w-full after:border-3 after:border-transparent after:bg-primary-500/10 ltr:after:border-l-primary-500",
                          )}
                        >
                          {row.getVisibleCells().map((cell) => (
                            <Td
                              key={cell.id}
                              className={clsx(
                                "relative bg-white py-3",
                                cardSkin === "shadow"
                                  ? "dark:bg-dark-700"
                                  : "dark:bg-dark-900",
                              )}
                              style={{
                                maxWidth: cell.column.columnDef.size ? `${cell.column.columnDef.size}px` : undefined,
                              }}
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
                          colSpan={specialPriceColumns.length}
                          className="py-10 text-center text-sm text-gray-500 dark:text-dark-400"
                        >
                          No special prices found.
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
