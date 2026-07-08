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
import { SelectedRowsActions } from "components/shared/table/SelectedRowsActions";
import { useThemeContext } from "app/contexts/theme/context";
import { getUserAgentBrowser } from "utils/dom/getUserAgentBrowser";
import { ChevronDown } from "lucide-react";
import axios from "utils/axios";
import { toast } from "sonner";

const isSafari = getUserAgentBrowser() === "Safari";

// Columns with chevron badges
const CHEVRON_COLUMNS = ["doc_in", "search_in", "value"];

// PHP: if(!in_array(79, $permissions)) header("location:index.php");
function usePermissions() {
  const p = localStorage.getItem("userPermissions");
  try {
    return JSON.parse(p) || [];
  } catch {
    return p?.split(",").map(Number) || [];
  }
}

export default function StatuaryDetailDatatable() {
  const { cardSkin } = useThemeContext();
  const permissions = usePermissions();

  // ── State Management (All hooks must be called before any conditional returns) ──
  const [statuaryDetails, setStatuaryDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tableSettings, setTableSettings] = useState({
    enableFullScreen: false,
    enableRowDense: false,
  });
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState([{ id: "id", desc: true }]);
  const [columnVisibility, setColumnVisibility] = useLocalStorage(
    "column-visibility-statuary-detail",
    {},
  );
  const [columnPinning, setColumnPinning] = useLocalStorage(
    "column-pinning-statuary-detail",
    {},
  );
  const [autoResetPageIndex, skipAutoResetPageIndex] = useSkipper();

  // ── Effects and Callbacks ────────────────────────────────────────────────────
  // Fetch statuary detail list from API
  useEffect(() => {
    const fetchStatuaryDetails = async () => {
      try {
        setLoading(true);
        const response = await axios.get("/master/get-statuary-detail-list");
        const result = response.data;

        if (result.status === "true" && result.data) {
          setStatuaryDetails(result.data);
        } else {
          toast.error(result.message || "Failed to load statuary details");
        }
      } catch (err) {
        console.error("Fetch error:", err);
        toast.error("Something went wrong while loading data");
      } finally {
        setLoading(false);
      }
    };

    fetchStatuaryDetails();
  }, []);

  // ── Table Configuration ────────────────────────────────────────────────────────
  const table = useReactTable({
    data: statuaryDetails,
    columns: columns,
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
        setStatuaryDetails((old) =>
          old.map((row, index) => {
            if (index === rowIndex) {
              return {
                ...old[rowIndex],
                [columnId]: value,
              };
            }
            return row;
          })
        );
      },
      deleteRow: (row) => {
        skipAutoResetPageIndex();
        setStatuaryDetails((old) =>
          old.filter((oldRow) => oldRow.id !== row.original.id)
        );
      },
      deleteRows: (rows) => {
        skipAutoResetPageIndex();
        const rowIds = rows.map((row) => row.original.id);
        setStatuaryDetails((old) => old.filter((row) => !rowIds.includes(row.id)));
      },
      setTableSettings,
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

  useDidUpdate(() => table.resetRowSelection(), [statuaryDetails]);

  useLockScrollbar(tableSettings.enableFullScreen);

  // Permission Check (Now after all hooks are called)
  // PHP: if(!in_array(79, $permissions)) header("location:index.php");
  if (!permissions.includes(79)) {
    return (
      <Page title="Statuary Detail List">
        <div className="flex h-60 items-center justify-center rounded-xl border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-sm font-medium text-red-600 dark:text-red-400">
            Access Denied - Permission 79 required
          </p>
        </div>
      </Page>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <Page title="Statuary Detail List">
        <div className="flex items-center justify-center h-96">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="ml-4 text-gray-600 text-lg">Loading...</p>
        </div>
      </Page>
    );
  }

  return (
    <Page title="Statuary Detail List">
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
                              "bg-gray-200 font-semibold uppercase text-gray-800 dark:bg-dark-800 dark:text-dark-100 first:ltr:rounded-tl-lg last:ltr:rounded-tr-lg first:rtl:rounded-tr-lg last:rtl:rounded-tl-lg relative",
                              header.column.getCanPin() && [
                                header.column.getIsPinned() === "left" &&
                                  "sticky z-2 ltr:left-0 rtl:right-0",
                                header.column.getIsPinned() === "right" &&
                                  "sticky z-2 ltr:right-0 rtl:left-0",
                              ],
                            )}
                          >
                            {CHEVRON_COLUMNS.includes(header.column.id) && (
                              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                                <ChevronDown 
                                  size={24} 
                                  className="text-yellow-400 fill-yellow-400"
                                  strokeWidth={3}
                                />
                              </div>
                            )}
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
                    {table.getRowModel().rows.length > 0 ? (
                      table.getRowModel().rows.map((row) => {
                        return (
                          <Tr
                            key={row.id}
                            className={clsx(
                              "relative border-y border-transparent border-b-gray-200 dark:border-b-dark-500",
                              row.getIsSelected() && !isSafari &&
                                "row-selected after:pointer-events-none after:absolute after:inset-0 after:z-2 after:h-full after:w-full after:border-3 after:border-transparent after:bg-primary-500/10 ltr:after:border-l-primary-500 rtl:after:border-r-primary-500",
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
                      })
                    ) : (
                      <Tr>
                        <Td colSpan={columns.length} className="text-center py-8">
                          <p className="text-gray-500">No data available</p>
                        </Td>
                      </Tr>
                    )}
                  </TBody>
                </Table>
              </div>
              <SelectedRowsActions table={table} title="Statutory Details" showDelete={false} />
              {table.getCoreRowModel().rows.length > 0 && (
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