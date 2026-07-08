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
import { useNavigate } from "react-router-dom";
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

import { columns } from "./columns";
import { Toolbar } from "./Toolbar";
import { tableConfig } from "./TableConfig";
import { SelectedRowsActions } from "./SelectedRowsActions";

// ----------------------------------------------------------------------

export default function WebsiteEnquiryList() {
  const { cardSkin } = useThemeContext();
  const navigate = useNavigate();
  const permissions = JSON.parse(localStorage.getItem("userPermissions") || "[]");

  useEffect(() => {
    if (!permissions.includes(385)) {
      navigate("/dashboards");
    }
  }, [navigate, permissions]);

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [tableSettings, setTableSettings] = useState(tableConfig);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState([{ id: "added_on", desc: true }]);
  const [columnVisibility, setColumnVisibility] = useLocalStorage(
    "col-vis-website-enquiry",
    {},
  );
  const [columnPinning, setColumnPinning] = useLocalStorage(
    "col-pin-website-enquiry",
    {},
  );
  const [autoResetPageIndex, skipAutoResetPageIndex] = useSkipper();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get("/sales/get-websiteenquiry-list");
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
      toast.error("Failed to load website enquiries");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const table = useReactTable({
    data,
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
        setData((old) =>
          old.map((row, i) =>
            i === rowIndex ? { ...old[rowIndex], [columnId]: value } : row,
          ),
        );
      },
      deleteRow: (row) => {
        skipAutoResetPageIndex();
        setData((old) => old.filter((r) => r.id !== row.original.id));
      },
      deleteRows: (rows) => {
        skipAutoResetPageIndex();
        const idsToDelete = rows.map((r) => r.original.id);
        setData((old) => old.filter((r) => !idsToDelete.includes(r.id)));
        toast.success(`${rows.length} rows deleted locally`);
      },
      refetch: fetchData,
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

  if (loading) {
    return (
      <Page title="Manage Enquiry">
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
          Loading Enquiries...
        </div>
      </Page>
    );
  }

  return (
    <Page title="Manage Enquiry">
      <div className="transition-content w-full pb-5">
        <div
          className={clsx(
            "flex h-full w-full flex-col",
            tableSettings.enableFullScreen &&
            "dark:bg-dark-900 fixed inset-0 z-61 bg-white pt-3",
          )}
        >
          {/* ── Toolbar ── */}
          <Toolbar
            table={table}
            globalFilter={globalFilter}
            setGlobalFilter={setGlobalFilter}
          />

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
                  dense={true}
                  sticky={tableSettings.enableFullScreen}
                  className="w-full text-left"
                >
                  <THead>
                    {table.getHeaderGroups().map((hg) => (
                      <Tr key={hg.id}>
                        {hg.headers.map((header) => (
                          <Th
                            key={header.id}
                            className={clsx(
                              "dark:bg-dark-800 dark:text-dark-100 bg-gray-200 py-1.5 px-2 font-semibold text-gray-800 uppercase first:ltr:rounded-tl-lg last:ltr:rounded-tr-lg",
                              header.column.getIsPinned() && "sticky right-0 z-10 bg-gray-200 dark:bg-dark-800 shadow-[-4px_0_10px_-4px_rgba(0,0,0,0.1)]",
                            )}
                          >
                            {header.column.getCanSort() ? (
                              <div
                                className="flex cursor-pointer items-center space-x-1 select-none"
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
                            row.getIsSelected() && "row-selected bg-primary-50 dark:bg-primary-900/10",
                          )}
                        >
                          {row.getVisibleCells().map((cell) => (
                            <Td
                               key={cell.id}
                               className={clsx(
                                 "relative bg-white py-1 px-2 text-sm",
                                 cardSkin === "shadow"
                                   ? "dark:bg-dark-700"
                                   : "dark:bg-dark-900",
                                 cell.column.getIsPinned() && "sticky right-0 z-10 shadow-[-4px_0_10px_-4px_rgba(0,0,0,0.1)]",
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
                          No enquiries found.
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
          <SelectedRowsActions table={table} />
        </div>
      </div>
    </Page>
  );
}
