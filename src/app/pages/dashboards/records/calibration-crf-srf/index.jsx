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
import axios from "utils/axios";
import PropTypes from "prop-types";

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
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Input } from "components/ui";
import { TableConfig } from "./TableConfig";
import { Link } from "react-router-dom";

// ----------------------------------------------------------------------

const isSafari = getUserAgentBrowser() === "Safari";

// PHP: permissions helper
function usePermissions() {
  const p = localStorage.getItem("userPermissions");
  try {
    return JSON.parse(p) || [];
  } catch {
    return p?.split(",").map(Number) || [];
  }
}

// Format date from Y-m-d to DD/MM/YYYY (matching PHP changedateformatespecito)
function formatDate(val) {
  if (!val || val === "0000-00-00" || val === "0000-00-00 00:00:00") return "-";
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return val;
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return val;
  }
}

function safeRender(val) {
  if (val === undefined || val === null || val === "") return "-";
  return val;
}

// ----------------------------------------------------------------------

/**
 * CRF/SRF Inward Entry List
 * PHP equivalent: crfsrflist.php + crfsrflistdata.php
 *
 * Props:
 *  calibacc — "Nabl" (default) or "Non-Nabl"
 */
export default function CalibrationCrfSrf({ calibacc = "Nabl" }) {
  const { cardSkin } = useThemeContext();
  const permissions = usePermissions();

  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState([{ id: "id", desc: true }]);

  const [tableSettings, setTableSettings] = useState({
    enableFullScreen: false,
    enableRowDense: false,
  });

  const [columnVisibility, setColumnVisibility] = useLocalStorage(
    `column-visibility-calibration-crf-srf-${calibacc}`,
    {},
  );

  const [columnPinning, setColumnPinning] = useLocalStorage(
    `column-pinning-calibration-crf-srf-${calibacc}`,
    {},
  );

  const [autoResetPageIndex, skipAutoResetPageIndex] = useSkipper();

  // -------------- Fetch inward entry list (mirrors crfsrflistdata.php) --------------
  const fetchData = async () => {
    try {
      setLoading(true);
      // PHP: GET crfsrflistdata.php?calibacc=Nabl|NonNabl
      const res = await axios.get("/records/crf-srf-calibration", {
        params: { calibacc },
      });

      const raw = res.data?.data || [];

      // Map to table rows — mirrors the PHP $n[] array building
      const rows = raw.map((row, index) => ({
        sno: index + 1,
        id: row.id,
        inwarddate: row.inwarddate,
        bookingrefno: row.bookingrefno || row.id,
        customername: row.customername,
        customeraddress: row.address,
        concernpersonname: row.concernpersonname,
        instrumentlocation: row.instrumentlocation,
        reviewremark: row.reviewremark,
        nablrequired: row.nablrequired,
        nonnabl: row.nonnabl,
        ponumber: row.ponumber,
        reportaddress: row.reportaddress,
        status: row.status,
      }));

      setTableData(rows);
    } catch (err) {
      console.error("Error fetching CRF/SRF list:", err);
      setTableData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calibacc]);

  // -------------- Column definitions (mirrors PHP table columns) --------------
  const columns = [
    // PHP: $n[] = $i; (serial number)
    {
      id: "sno",
      header: "ID",
      accessorKey: "sno",
      cell: ({ row }) => (
        <span className="font-medium text-gray-700 dark:text-dark-200">
          {row.index + 1}
        </span>
      ),
    },
    // PHP: $n[] = changedateformatespecito($row['inwarddate'], "Y-m-d", "d/m/Y");
    {
      id: "inwarddate",
      header: "Date",
      accessorKey: "inwarddate",
      cell: ({ getValue }) => (
        <span className="whitespace-nowrap text-gray-700 dark:text-dark-200">
          {formatDate(getValue())}
        </span>
      ),
    },
    // PHP: $n[] = $row['id']; (Inward Entry no = DB id)
    {
      id: "id",
      header: "Inward Entry No",
      accessorKey: "id",
      cell: ({ getValue }) => (
        <span className="font-semibold text-primary-600 dark:text-primary-400">
          {safeRender(getValue())}
        </span>
      ),
    },
    // PHP: (in_array(358, $permissions)) ? $row['customername']... : "Not Permitted"
    {
      id: "customername",
      header: "Customer",
      accessorKey: "customername",
      cell: ({ getValue, row }) =>
        permissions.includes(358) ? (
          <div>
            <div className="font-medium text-gray-800 dark:text-dark-100">
              {safeRender(getValue())}
            </div>
            {row.original.customeraddress && (
              <div className="text-xs text-gray-400 dark:text-dark-400 mt-0.5">
                {row.original.customeraddress}
              </div>
            )}
          </div>
        ) : (
          <span className="text-xs italic text-gray-400">Not Permitted</span>
        ),
    },
    // PHP: (in_array(358, $permissions)) ? $row['concernpersonname'] : "Not Permitted"
    {
      id: "concernpersonname",
      header: "Contact Person",
      accessorKey: "concernpersonname",
      cell: ({ getValue }) =>
        permissions.includes(358) ? (
          <span className="text-gray-700 dark:text-dark-200">
            {safeRender(getValue())}
          </span>
        ) : (
          <span className="text-xs italic text-gray-400">Not Permitted</span>
        ),
    },
    // PHP: $n[] = $row['instrumentlocation'];
    {
      id: "instrumentlocation",
      header: "Location",
      accessorKey: "instrumentlocation",
      cell: ({ getValue }) => (
        <span className="text-gray-700 dark:text-dark-200">
          {safeRender(getValue())}
        </span>
      ),
    },
    // PHP: $n[] = $row['reviewremark'];
    {
      id: "reviewremark",
      header: "Remarks",
      accessorKey: "reviewremark",
      cell: ({ getValue }) => (
        <span className="text-gray-600 dark:text-dark-300 text-xs">
          {safeRender(getValue())}
        </span>
      ),
    },
    // PHP: action buttons based on permissions 372 (SRF View) & 373 (CRF View)
    {
      id: "actions",
      header: "Action",
      cell: ({ row }) => {
        const id = row.original.id;
        return (
          <div className="flex flex-wrap items-center gap-1.5">
            {/* PHP: if (in_array(372, $permissions)) → SRF View */}
            {permissions.includes(372) && (
              <Link
                to={`/dashboards/records/calibration-crf-srf${calibacc === "NonNabl" ? "-non-nabl" : ""}/srf-view/${id}?calibacc=${calibacc}&hakuna=${id}`}
                className="inline-flex items-center justify-center rounded-md bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 transition hover:bg-sky-100 dark:bg-sky-900/30 dark:text-sky-300"
              >
                SRF View
              </Link>
            )}
            {/* PHP: if (in_array(373, $permissions)) → CRF View */}
            {permissions.includes(373) && (
              <Link
                to={`/dashboards/records/calibration-crf-srf${calibacc === "NonNabl" ? "-non-nabl" : ""}/srf-view/${id}?calibacc=${calibacc}&hakuna=${id}`}
                className="inline-flex items-center justify-center rounded-md bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300"
              >
                CRF View
              </Link>
            )}
          </div>
        );
      },
    },
  ];

  // -------------- React Table setup --------------
  const table = useReactTable({
    data: tableData,
    columns,
    state: {
      globalFilter,
      sorting,
      columnVisibility,
      columnPinning,
      tableSettings,
    },
    meta: {
      setTableSettings,
      updateData: (rowIndex, columnId, value) => {
        skipAutoResetPageIndex();
        setTableData((old) =>
          old.map((row, index) =>
            index === rowIndex ? { ...old[rowIndex], [columnId]: value } : row,
          ),
        );
      },
    },
    filterFns: { fuzzy: fuzzyFilter },
    enableSorting: true,
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
    initialState: {
      pagination: {
        pageSize: 25, // PHP: "pageLength": 25
      },
    },
  });

  useDidUpdate(() => table.resetRowSelection(), [tableData]);
  useLockScrollbar(tableSettings.enableFullScreen);

  const visibleColumns = table.getVisibleLeafColumns();
  const isFullScreenEnabled = tableSettings.enableFullScreen;

  const pageTitle =
    calibacc === "Nabl"
      ? "Manage CRF SRF List (NABL)"
      : "Manage CRF SRF List (Non-NABL)";

  // -------------- Loading UI --------------
  if (loading) {
    return (
      <Page title={pageTitle}>
        <div className="flex h-[60vh] items-center justify-center gap-3 text-gray-500">
          <svg
            className="h-7 w-7 animate-spin text-blue-500"
            viewBox="0 0 24 24"
            fill="none"
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
          Loading Inward Entry List...
        </div>
      </Page>
    );
  }

  // -------------- Main render --------------
  return (
    <Page title={pageTitle}>
      <div className="transition-content w-full pb-5">
        <div
          className={clsx(
            "flex h-full w-full flex-col",
            isFullScreenEnabled &&
            "fixed inset-0 z-61 bg-white pt-3 dark:bg-dark-900",
          )}
        >
          {/* ---- Toolbar ---- */}
          <div className="table-toolbar">
            <div
              className={clsx(
                "transition-content flex items-center justify-between gap-4",
                isFullScreenEnabled ? "px-4 sm:px-5" : "px-[var(--margin-x)] pt-4",
              )}
            >
              {/* Title + badge */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="min-w-0">
                  <h2 className="text-xl font-semibold tracking-wide text-gray-800 dark:text-dark-50">
                    Inward Entry List
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-dark-400 mt-0.5">
                    {calibacc === "Nabl"
                      ? "NABL Calibration CRF / SRF"
                      : "Non-NABL Calibration CRF / SRF"}
                  </p>
                </div>
                <span
                  className={clsx(
                    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                    calibacc === "Nabl"
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                      : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
                  )}
                >
                  {calibacc === "Nabl" ? "NABL" : "Non-NABL"}
                </span>
              </div>

              {/* Table config (columns toggle / fullscreen) */}
              <div className="flex items-center gap-2">
                <TableConfig table={table} />
              </div>
            </div>

            {/* Search bar */}
            <div
              className={clsx(
                "transition-content flex justify-between space-x-4 overflow-x-auto pb-1 pt-4",
                isFullScreenEnabled ? "px-4 sm:px-5" : "px-[var(--margin-x)]",
              )}
            >
              <div className="flex shrink-0 space-x-2">
                <Input
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  prefix={<MagnifyingGlassIcon className="size-4" />}
                  classNames={{
                    input: "h-8 text-xs ring-primary-500/50 focus:ring-3",
                    root: "shrink-0",
                  }}
                  placeholder="Search ID, Customer, Date..."
                />
              </div>
            </div>
          </div>

          {/* ---- Table ---- */}
          <div
            className={clsx(
              "transition-content flex grow flex-col pt-3",
              isFullScreenEnabled ? "overflow-hidden" : "px-[var(--margin-x)]",
            )}
          >
            <Card
              className={clsx(
                "relative flex grow flex-col",
                isFullScreenEnabled && "overflow-hidden",
              )}
            >
              <div className="table-wrapper min-w-full grow overflow-x-auto">
                <Table
                  hoverable
                  dense={tableSettings.enableRowDense}
                  sticky={isFullScreenEnabled}
                  className="w-full text-left rtl:text-right text-sm"
                >
                  <THead>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <Tr key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <Th
                            key={header.id}
                            className={clsx(
                              "bg-gray-200 font-semibold uppercase text-gray-800 dark:bg-dark-800 dark:text-dark-100 first:ltr:rounded-tl-lg last:ltr:rounded-tr-lg first:rtl:rounded-tr-lg last:rtl:rounded-tl-lg whitespace-nowrap",
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

                    {/* Empty state */}
                    {tableData.length === 0 && !loading && (
                      <Tr>
                        <Td
                          colSpan={visibleColumns.length}
                          className="py-10 text-center text-gray-500 dark:text-dark-400"
                        >
                          No inward entries found for{" "}
                          <strong>
                            {calibacc === "Nabl" ? "NABL" : "Non-NABL"}
                          </strong>{" "}
                          calibration.
                        </Td>
                      </Tr>
                    )}
                  </TBody>
                </Table>
              </div>

              {/* Pagination — PHP: pageLength=25, full_numbers */}
              {table.getCoreRowModel().rows.length > 0 && (
                <div
                  className={clsx(
                    "px-4 pb-4 sm:px-5 sm:pt-4",
                    isFullScreenEnabled && "bg-gray-50 dark:bg-dark-800",
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

CalibrationCrfSrf.propTypes = {
  // PHP: $calibacc = "Nabl" (default) | "NonNabl"
  calibacc: PropTypes.oneOf(["Nabl", "NonNabl"]),
};
