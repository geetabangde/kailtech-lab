// Import Dependencies
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import clsx from "clsx";
import { useState, useEffect, useCallback, useMemo } from "react";
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
import { useThemeContext } from "app/contexts/theme/context";

// ----------------------------------------------------------------------

export default function RoleRequestPage() {
  const { cardSkin } = useThemeContext();
  const permissions = useMemo(() => {
    const raw = localStorage.getItem("userPermissions") || "[]";
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.map(Number) : [];
    } catch {
      return raw.trim().replace(/^\[/, "").replace(/\]$/, "").split(",").map(Number).filter((n) => !isNaN(n));
    }
  }, []);

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch data from API
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get("/quality-documents/request-form-lims-data");

      if (response.data && Array.isArray(response.data)) {
        setData(response.data);
      } else if (response.data.data && Array.isArray(response.data.data)) {
        setData(response.data.data);
      } else {
        setData([]);
      }
    } catch (err) {
      console.error("Error fetching role requests:", err);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (permissions.includes(467)) {
      fetchData();
    }
  }, [permissions, fetchData]);

  const [tableSettings, setTableSettings] = useState({
    enableFullScreen: false,
    enableRowDense: false,
  });

  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState([{ id: "id", desc: true }]);

  const [columnVisibility, setColumnVisibility] = useLocalStorage(
    "column-visibility-role-request",
    {},
  );

  const [autoResetPageIndex, skipAutoResetPageIndex] = useSkipper();

  const table = useReactTable({
    data,
    columns,
    state: {
      globalFilter,
      sorting,
      columnVisibility,
      tableSettings,
    },
    meta: {
      updateData: (rowIndex, columnId, value) => {
        skipAutoResetPageIndex();
        setData((old) =>
          old.map((row, index) =>
            index === rowIndex ? { ...old[rowIndex], [columnId]: value } : row
          )
        );
      },
      refreshData: fetchData,
      setTableSettings,
    },
    filterFns: { fuzzy: fuzzyFilter },
    enableSorting: true,
    getCoreRowModel: getCoreRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: fuzzyFilter,
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    autoResetPageIndex,
  });

  useDidUpdate(() => table.resetRowSelection(), [data]);
  useLockScrollbar(tableSettings.enableFullScreen);

  if (!permissions.includes(467)) {
    return (
      <Page title="Role Request – OPERATION OF LIMS">
        <div className="flex h-60 items-center justify-center rounded-xl border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-sm font-medium text-red-600 dark:text-red-400">
            ⛔ Access Denied — Permission 467 required
          </p>
        </div>
      </Page>
    );
  }

  return (
    <Page title="Role Request – OPERATION OF LIMS">
      <div className="transition-content w-full pb-5">
        <div className={clsx("flex h-full w-full flex-col", tableSettings.enableFullScreen && "fixed inset-0 z-61 bg-white pt-3 dark:bg-dark-900")}>
          <Toolbar table={table} />
          <div className={clsx("transition-content flex grow flex-col pt-3", tableSettings.enableFullScreen ? "overflow-hidden" : "px-[var(--margin-x)]")}>
            <Card className={clsx("relative flex grow flex-col", tableSettings.enableFullScreen && "overflow-hidden")}>
              <div className="table-wrapper min-w-full grow overflow-x-auto">
                {loading ? (
                  <div className="flex h-60 items-center justify-center text-gray-500">
                    <svg className="animate-spin h-6 w-6 mr-3 text-primary-500" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z"></path>
                    </svg>
                    Loading Role Requests...
                  </div>
                ) : (
                  <Table hoverable dense={tableSettings.enableRowDense} sticky={tableSettings.enableFullScreen} className="w-full text-left rtl:text-right">
                    <THead>
                      {table.getHeaderGroups().map((headerGroup) => (
                        <Tr key={headerGroup.id}>
                          {headerGroup.headers.map((header) => (
                            <Th key={header.id} className="bg-gray-100 font-semibold uppercase text-gray-800 dark:bg-dark-800 dark:text-dark-100 first:ltr:rounded-tl-lg last:ltr:rounded-tr-lg">
                              {header.column.getCanSort() ? (
                                <div className="flex cursor-pointer select-none items-center space-x-3" onClick={header.column.getToggleSortingHandler()}>
                                  <span className="flex-1">{flexRender(header.column.columnDef.header, header.getContext())}</span>
                                  <TableSortIcon sorted={header.column.getIsSorted()} />
                                </div>
                              ) : flexRender(header.column.columnDef.header, header.getContext())}
                            </Th>
                          ))}
                        </Tr>
                      ))}
                    </THead>
                    <TBody>
                      {data.length === 0 ? (
                        <Tr><Td colSpan={99} className="py-20 text-center text-gray-400 font-medium">No role requests found.</Td></Tr>
                      ) : (
                        table.getRowModel().rows.map((row) => (
                          <Tr key={row.id} className="border-b border-gray-100 dark:border-b-dark-500 last:border-0 hover:bg-gray-50/50 dark:hover:bg-dark-600/50">
                            {row.getVisibleCells().map((cell) => (
                              <Td key={cell.id} className={clsx("bg-white py-3", cardSkin === "shadow" ? "dark:bg-dark-700" : "dark:bg-dark-900")}>
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                              </Td>
                            ))}
                          </Tr>
                        ))
                      )}
                    </TBody>
                  </Table>
                )}
              </div>
              <div className="px-4 pb-4 sm:px-5 sm:pt-4">
                <PaginationSection table={table} />
              </div>
            </Card>
          </div>
        </div>
      </div>
    </Page>
  );
}
