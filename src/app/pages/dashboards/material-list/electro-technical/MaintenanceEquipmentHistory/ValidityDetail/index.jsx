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
import { useRef, useState, useEffect, useCallback } from "react";
import axios from "utils/axios";
import { useLocation } from "react-router";
import toast, { Toaster } from "react-hot-toast";

// Local Imports
import { TableSortIcon } from "components/shared/table/TableSortIcon";
import { ColumnFilter } from "components/shared/table/ColumnFilter";
import { PaginationSection } from "components/shared/table/PaginationSection";
import {
  Button,
  Card,
  Table,
  THead,
  TBody,
  Th,
  Tr,
  Input,
  Td,
} from "components/ui";
import { useLockScrollbar, useLocalStorage, useDidUpdate } from "hooks";
import { fuzzyFilter } from "utils/react-table/fuzzyFilter";
import { useSkipper } from "utils/react-table/useSkipper";
import { SelectedRowsActions } from "./SelectedRowsActions";
import { columns, uncertaintyColumns } from "./columns";
import { Toolbar } from "./Toolbar";
import { useThemeContext } from "app/contexts/theme/context";
import { getUserAgentBrowser } from "utils/dom/getUserAgentBrowser";
import { useNavigate } from "react-router";

const isSafari = getUserAgentBrowser() === "Safari";

export default function ValidityDetailsTable() {
  const { cardSkin } = useThemeContext();
  const navigate = useNavigate();
  const location = useLocation();

  // FIX 1: दोनों tables के लिए अलग-अलग skipper
  const [autoResetPageIndex, skipAutoResetPageIndex] = useSkipper();
  const [uncertaintyAutoResetPageIndex, uncertaintySkipAutoResetPageIndex] =
    useSkipper();

  const [urlParams, setUrlParams] = useState({ fid: "", cid: "", labId: "" });

  const [matrixData, setMatrixData] = useState([]);
  const [matrixLoading, setMatrixLoading] = useState(true);

  const [uncertaintyData, setUncertaintyData] = useState([]);
  const [uncertaintyLoading, setUncertaintyLoading] = useState(true);

  const [tableSettings, setTableSettings] = useState({
    enableSorting: true,
    enableColumnFilters: true,
    enableFullScreen: false,
    enableRowDense: false,
  });

  const [globalFilter, setGlobalFilter] = useState("");
  const [uncertaintyGlobalFilter, setUncertaintyGlobalFilter] = useState("");
  const [sorting, setSorting] = useState([]);
  const [uncertaintySorting, setUncertaintySorting] = useState([]);

  const [matrixPagination, setMatrixPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [uncertaintyPagination, setUncertaintyPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const [columnVisibility, setColumnVisibility] = useLocalStorage(
    "column-visibility-validity",
    {},
  );
  const [uncertaintyColumnVisibility, setUncertaintyColumnVisibility] =
    useLocalStorage("column-visibility-uncertainty", {});
  const [columnPinning, setColumnPinning] = useLocalStorage(
    "column-pinning-validity",
    {},
  );

  const cardRef = useRef();
  const uncertaintyCardRef = useRef();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setUrlParams({
      fid: params.get("fid") || "",
      cid: params.get("cid") || "",
      labId: params.get("labId") || "",
    });
  }, [location.search]);

  // Search करने पर page 1 पर reset
  const handleMatrixSearch = (value) => {
    setGlobalFilter(value);
    setMatrixPagination((prev) => ({ ...prev, pageIndex: 0 }));
  };

  const handleUncertaintySearch = (value) => {
    setUncertaintyGlobalFilter(value);
    setUncertaintyPagination((prev) => ({ ...prev, pageIndex: 0 }));
  };

  const handleBackNavigation = () => {
    if (urlParams.fid && urlParams.labId) {
      navigate(
        `/dashboards/material-list/electro-technical/maintenance-equipment-history?fid=${urlParams.fid}&labId=${urlParams.labId}`,
      );
    } else if (urlParams.fid) {
      navigate(
        `/dashboards/material-list/electro-technical/maintenance-equipment-history?fid=${urlParams.fid}`,
      );
    } else {
      navigate(
        "/dashboards/material-list/electro-technical/maintenance-equipment-history",
      );
    }
  };

  const deleteMasterMatrix = async (id) => {
    try {
      const response = await axios.delete(`/material/delete-mastermatrix`, {
        params: { id },
      });
      if (response.data?.success || response.data?.status) {
        setMatrixData((prev) => prev.filter((row) => row.id !== id));
        toast.success(response.data?.message || "Record deleted successfully");
        return true;
      }
      toast.error(response.data?.message || "Failed to delete record");
      return false;
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete record");
      return false;
    }
  };

  const deleteMasterUncertaintyMatrix = async (id) => {
    try {
      const response = await axios.delete(
        `/material/delete-MasterUncertainty-Matrix/${id}`,
      );
      if (response.data?.success || response.data?.status) {
        setUncertaintyData((prev) => prev.filter((row) => row.id !== id));
        toast.success(response.data?.message || "Record deleted successfully");
        return true;
      }
      toast.error(response.data?.message || "Failed to delete record");
      return false;
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete record");
      return false;
    }
  };

  // FIX 2: API सारा data एक बार देती है — कोई pagination params नहीं
  const fetchMatrixData = useCallback(async (fid, cid) => {
    try {
      setMatrixLoading(true);
      const response = await axios.get(`/material/masters-matrix-detail`, {
        params: { fid, cid },
      });
      setMatrixData(
        Array.isArray(response.data?.data) ? response.data.data : [],
      );
    } catch (err) {
      console.error("Error fetching matrix data:", err);
      setMatrixData([]);
    } finally {
      setMatrixLoading(false);
    }
  }, []);

  const fetchUncertaintyData = useCallback(async (fid, cid) => {
    try {
      setUncertaintyLoading(true);
      const response = await axios.get(`/material/masters-validity-detail`, {
        params: { fid, cid },
      });
      setUncertaintyData(
        Array.isArray(response.data?.data) ? response.data.data : [],
      );
    } catch (err) {
      console.error("Error fetching uncertainty data:", err);
      setUncertaintyData([]);
    } finally {
      setUncertaintyLoading(false);
    }
  }, []);

  // FIX 3: सिर्फ URL change पर fetch — pagination change पर नहीं
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const fid = params.get("fid") || "";
    const cid = params.get("cid") || "";
    if (fid && cid) {
      fetchMatrixData(fid, cid);
      fetchUncertaintyData(fid, cid);
    } else {
      setMatrixLoading(false);
      setUncertaintyLoading(false);
    }
  }, [location.search, fetchMatrixData, fetchUncertaintyData]);

  // Matrix Table — manualPagination नहीं, client-side handle होगी
  const table = useReactTable({
    data: matrixData,
    columns: columns,
    state: {
      globalFilter,
      sorting,
      columnVisibility,
      columnPinning,
      tableSettings,
      pagination: matrixPagination,
    },
    meta: {
      setTableSettings,
      deleteRow: async (row) => {
        await deleteMasterMatrix(row.original.id);
        skipAutoResetPageIndex();
      },
      deleteRows: async (rows) => {
        skipAutoResetPageIndex();
        for (const row of rows) await deleteMasterMatrix(row.original.id);
      },
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
    onPaginationChange: setMatrixPagination,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnPinningChange: setColumnPinning,
    autoResetPageIndex,
    // manualPagination नहीं — TanStack खुद handle करेगा ✅
  });

  // Uncertainty Table
  const uncertaintyTable = useReactTable({
    data: uncertaintyData,
    columns: uncertaintyColumns,
    state: {
      globalFilter: uncertaintyGlobalFilter,
      sorting: uncertaintySorting,
      columnVisibility: uncertaintyColumnVisibility,
      pagination: uncertaintyPagination,
    },
    meta: {
      isUncertaintyTable: true,
      deleteRow: async (row) => {
        await deleteMasterUncertaintyMatrix(row.original.id);
        uncertaintySkipAutoResetPageIndex(); // ✅ अपना skipper
      },
      deleteRows: async (rows) => {
        uncertaintySkipAutoResetPageIndex(); // ✅ अपना skipper
        for (const row of rows)
          await deleteMasterUncertaintyMatrix(row.original.id);
      },
    },
    filterFns: { fuzzy: fuzzyFilter },
    enableSorting: tableSettings.enableSorting,
    enableColumnFilters: tableSettings.enableColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    onGlobalFilterChange: setUncertaintyGlobalFilter,
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
    globalFilterFn: fuzzyFilter,
    onSortingChange: setUncertaintySorting,
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setUncertaintyPagination,
    onColumnVisibilityChange: setUncertaintyColumnVisibility,
    autoResetPageIndex: uncertaintyAutoResetPageIndex, // ✅ अपना skipper
    // manualPagination नहीं ✅
  });

  useDidUpdate(() => table.resetRowSelection(), [matrixData]);
  useDidUpdate(() => uncertaintyTable.resetRowSelection(), [uncertaintyData]);
  useLockScrollbar(tableSettings.enableFullScreen);

  if (matrixLoading && uncertaintyLoading) {
    return (
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
        Loading Validity Details...
      </div>
    );
  }

  return (
    <div className="transition-content grid grid-cols-1 grid-rows-[auto_auto_1fr] px-[var(--margin-x)] py-4">
      <Toaster
        position="top-right"
        reverseOrder={false}
        toastOptions={{
          duration: 3000,
          style: { background: "#363636", color: "#fff" },
          success: {
            duration: 3000,
            iconTheme: { primary: "#10b981", secondary: "#fff" },
          },
          error: {
            duration: 4000,
            iconTheme: { primary: "#ef4444", secondary: "#fff" },
          },
        }}
      />

      {/* Page Header */}
      <div className="flex items-center justify-between space-x-4">
        <div className="min-w-0">
          <h2 className="dark:text-dark-50 truncate text-xl font-medium tracking-wide text-gray-800">
            Masters Validity Details
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            className="h-8 space-x-1.5 rounded-md px-3 text-xs"
            color="primary"
            onClick={handleBackNavigation}
          >
            ← Back To Master Validity
          </Button>
          <Button
            className="h-8 space-x-1.5 rounded-md px-3 text-xs"
            color="primary"
            onClick={() => {
              const params = new URLSearchParams();
              if (urlParams.fid) params.append("fid", urlParams.fid);
              if (urlParams.cid) params.append("cid", urlParams.cid);
              if (urlParams.labId) params.append("labId", urlParams.labId);
              navigate(
                `/dashboards/material-list/electro-technical/maintenance-equipment-history/validity-detail/add-new-master-matrix?${params.toString()}`,
              );
            }}
          >
            Add New Master Matrix
          </Button>
        </div>
      </div>

      <div className="flex flex-col space-y-6 pt-4">
        {/* ── 1. Matrix Table ─────────────────────────────────────────────── */}
        <Card
          className={clsx(
            "relative flex grow flex-col",
            tableSettings.enableFullScreen && "overflow-hidden",
          )}
          ref={cardRef}
        >
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <h3 className="dark:text-dark-50 text-base font-medium text-gray-800">
              Masters Matrix Detail
            </h3>
            <input
              type="text"
              value={globalFilter}
              onChange={(e) => handleMatrixSearch(e.target.value)}
              placeholder="Search matrix..."
              className="w-56 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
            />
          </div>

          <Toolbar table={table} />

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
                        {header.column.getCanFilter() ? (
                          <ColumnFilter column={header.column} />
                        ) : null}
                      </Th>
                    ))}
                  </Tr>
                ))}
              </THead>
              <TBody>
                {matrixLoading ? (
                  <Tr>
                    <Td
                      colSpan={99}
                      className="py-10 text-center text-sm text-gray-400"
                    >
                      <svg
                        className="mx-auto mb-2 h-5 w-5 animate-spin text-blue-500"
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
                    </Td>
                  </Tr>
                ) : table.getRowModel().rows.length === 0 ? (
                  <Tr>
                    <Td
                      colSpan={99}
                      className="py-10 text-center text-sm text-gray-400"
                    >
                      No records found.
                    </Td>
                  </Tr>
                ) : (
                  table.getRowModel().rows.map((row) => (
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
                            "relative",
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
                            />
                          )}
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </Td>
                      ))}
                    </Tr>
                  ))
                )}
              </TBody>
            </Table>
          </div>

          <SelectedRowsActions table={table} />
          {matrixData.length > 0 && (
            <div className="px-4 pb-4 sm:px-5 sm:pt-4">
              <PaginationSection table={table} />
            </div>
          )}
        </Card>

        {/* ── 2. Uncertainty Table ─────────────────────────────────────────── */}
        <Card
          className={clsx(
            "relative flex grow flex-col",
            tableSettings.enableFullScreen && "overflow-hidden",
          )}
          ref={uncertaintyCardRef}
        >
          <div className="mb-4 flex items-center justify-between px-4 pt-4">
            <h3 className="dark:text-dark-50 text-lg font-medium text-gray-800">
              Masters Validity Uncertainty Detail
            </h3>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={uncertaintyGlobalFilter}
                onChange={(e) => handleUncertaintySearch(e.target.value)}
                placeholder="Search uncertainty..."
                className="w-56 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
              />
              <Button
                className="h-8 space-x-1.5 rounded-md px-3 text-xs"
                color="primary"
                onClick={() => {
                  const params = new URLSearchParams();
                  if (urlParams.fid) params.append("fid", urlParams.fid);
                  if (urlParams.cid) params.append("cid", urlParams.cid);
                  if (urlParams.labId) params.append("labId", urlParams.labId);
                  navigate(
                    `/dashboards/material-list/electro-technical/maintenance-equipment-history/validity-detail/add-new-uncertainty-matrix?${params.toString()}`,
                  );
                }}
              >
                Add New Uncertainty Matrix
              </Button>
            </div>
          </div>

          <div className="table-wrapper min-w-full grow overflow-x-auto">
            <Table
              hoverable
              dense={tableSettings.enableRowDense}
              sticky={tableSettings.enableFullScreen}
              className="w-full text-left rtl:text-right"
            >
              <THead>
                {uncertaintyTable.getHeaderGroups().map((headerGroup) => (
                  <Tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <Th
                        key={header.id}
                        className="dark:bg-dark-800 dark:text-dark-100 bg-gray-200 font-semibold text-gray-800 uppercase first:ltr:rounded-tl-lg last:ltr:rounded-tr-lg first:rtl:rounded-tr-lg last:rtl:rounded-tl-lg"
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
                {uncertaintyLoading ? (
                  <Tr>
                    <Td
                      colSpan={99}
                      className="py-10 text-center text-sm text-gray-400"
                    >
                      <svg
                        className="mx-auto mb-2 h-5 w-5 animate-spin text-blue-500"
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
                    </Td>
                  </Tr>
                ) : uncertaintyTable.getRowModel().rows.length === 0 ? (
                  <Tr>
                    <Td
                      colSpan={99}
                      className="py-10 text-center text-sm text-gray-400"
                    >
                      No records found.
                    </Td>
                  </Tr>
                ) : (
                  uncertaintyTable.getRowModel().rows.map((row) => (
                    <Tr
                      key={row.id}
                      className="dark:border-b-dark-500 relative border-y border-transparent border-b-gray-200"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <Td key={cell.id} className="relative">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </Td>
                      ))}
                    </Tr>
                  ))
                )}
              </TBody>
            </Table>
          </div>

          <SelectedRowsActions table={uncertaintyTable} />
          {uncertaintyData.length > 0 && (
            <div className="px-4 pb-4 sm:px-5 sm:pt-4">
              <PaginationSection table={uncertaintyTable} />
            </div>
          )}
        </Card>

        {/* ── 3. Interpolation Formula ─────────────────────────────────────── */}
        <Card className="relative flex grow flex-col">
          <div className="mb-5 flex items-center justify-between px-4 pt-4">
            <h3 className="dark:text-dark-50 text-lg font-medium text-gray-800">
              Interpolation Formula Detail
            </h3>
          </div>
          <div className="mx-4 rounded-md border border-gray-300 p-3">
            <div className="flex space-x-4">
              <label className="flex-1">
                <span className="dark:text-dark-200 text-sm font-medium text-gray-700">
                  Formula
                </span>
                <Input
                  type="text"
                  className="focus:border-primary-500 focus:ring-primary-500 dark:bg-dark-700 dark:border-dark-500 dark:text-dark-100 mt-2 block w-full rounded-md border-gray-300 shadow-sm"
                  placeholder="Enter interpolation formula..."
                />
              </label>
            </div>
          </div>
          <div className="mt-4 flex justify-end px-4 pb-4">
            <Button className="h-8 px-4 text-sm" color="primary">
              Save Master Matrix
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
