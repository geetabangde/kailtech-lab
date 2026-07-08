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
import { useNavigate } from "react-router";
import axios from "utils/axios";
import { ChevronsLeft } from "lucide-react";

// Local Imports
import { Table, Card, THead, TBody, Th, Tr, Td, Button } from "components/ui";
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
import { FormatHeader } from "components/shared/FormatHeader";
import { useLabsContext } from "app/contexts/labs/context";

// ----------------------------------------------------------------------

const isSafari = getUserAgentBrowser() === "Safari";

export default function CalibrationSchedulePeriod() {
  const { cardSkin } = useThemeContext();
  const navigate = useNavigate();
  const { labs } = useLabsContext();
  const permissions = JSON.parse(localStorage.getItem("userPermissions") || "[]");

  useEffect(() => {
    // Permission 354 as per PHP code: if(!in_array(354, $permissions)){ header("location:index.php"); }
    if (!permissions.includes(354)) {
      navigate("/dashboards");
    }
  }, [navigate, permissions]);

  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    startdate: "",
    enddate: "",
    department: [],
  });
  const [searched, setSearched] = useState(false);
  const [departments, setDepartments] = useState([]);

  const fetchCalibrationScheduleData = async () => {
    if (!filters.startdate || !filters.enddate) return;
    try {
      setLoading(true);
      setSearched(true);

      // Use the new endpoint for calibration schedule data
      const res = await axios.get("/register/calibration-schedul-period", { params: filters });

      let rows = res.data?.data || [];

      // Map JSON response object properties to columns
      rows = rows.map((row, index) => ({
        sr_no: row.sr_no || index + 1,
        name: row.equipment_name || "",
        equipment_id: row.equipment_id || "",
        frequency: row.frequency || "",
        last_calibration_date: row.last_calibration_date || "",
        next_calibration_date: row.next_calibration_date || "",
        jan: row.jan || "",
        feb: row.feb || "",
        mar: row.mar || "",
        apr: row.apr || "",
        may: row.may || "",
        jun: row.jun || "",
        jul: row.jul || "",
        aug: row.aug || "",
        sep: row.sep || "",
        oct: row.oct || "",
        nov: row.nov || "",
        dec: row.dec || "",
      }));

      setTableData(rows);
    } catch (err) {
      console.error("Error fetching calibration schedule data:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetadata = async () => {
    try {
      // Fetch departments/labs for the dropdown
      const res = await axios.get("/master/list-lab");
      setDepartments(res.data?.data || []);
    } catch (err) {
      console.error("Error fetching metadata:", err);
    }
  };

  useEffect(() => {
    fetchMetadata();
  }, []);

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = (e) => {
    e?.preventDefault?.();
    fetchCalibrationScheduleData();
  };

  const handleExport = (e) => {
    e?.preventDefault?.();
    console.log("Export button clicked. Current filters:", filters);

    // Validate required fields
    if (!filters.startdate || !filters.enddate) {
      alert('Please select start date and end date for export');
      return;
    }

    // Build query parameters
    const params = new URLSearchParams();
    params.append('startdate', filters.startdate);
    params.append('enddate', filters.enddate);

    // Add departments if selected
    if (filters.department && filters.department.length > 0) {
      filters.department.forEach(dept => {
        params.append('department', dept);
      });
    }

    const exportUrl = `/dashboards/registers/calibration-schedule-period/export?${params.toString()}`;
    console.log("Navigating to export page:", exportUrl);
    
    // Navigate to export route with parameters
    navigate(exportUrl);
  };

  const [tableSettings, setTableSettings] = useState({
    enableFullScreen: false,
    enableRowDense: false,
  });

  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState([]);

  const [columnVisibility, setColumnVisibility] = useLocalStorage(
    "column-visibility-assigned-register-1",
    {},
  );

  const [columnPinning, setColumnPinning] = useLocalStorage(
    "column-pinning-assigned-register-1",
    {},
  );

  const [autoResetPageIndex] = useSkipper();

  const table = useReactTable({
    data: tableData,
    columns: columns,
    state: {
      globalFilter,
      sorting,
      columnVisibility,
      columnPinning,
      tableSettings,
    },
    meta: {
      setTableSettings
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

  useDidUpdate(() => table.resetRowSelection(), [tableData]);
  useLockScrollbar(tableSettings.enableFullScreen);

  const visibleColumns = table.getVisibleLeafColumns();

  // ─── Shared UI components ──────────────────────────────────────────────────
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

  // ✅ Loading UI
  if (loading) {
    return (
      <Page title="Calibration Schedule Period">
        <PageSpinner />
      </Page>
    );
  }

  const handleBackToMMInstrumentList = () => {
    // 1. Try to get lab from selected department filter
    let selectedLab = null;
    if (filters.department && filters.department.length > 0) {
      const firstDeptId = filters.department[0];
      selectedLab = labs?.find((l) => String(l.id) === String(firstDeptId));
    }

    // 2. Fallback to first lab the user has access to
    if (!selectedLab && labs && labs.length > 0) {
      const employeeId = Number(localStorage.getItem("userId") || 0);
      selectedLab = labs.find((l) => l.users?.includes(employeeId)) || labs[0];
    }

    if (selectedLab) {
      const slug = selectedLab.slug || selectedLab.name
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[()]/g, '')
        .replace(/&/g, 'and')
        .replace(/[^a-z0-9-]/g, '');

      navigate(`/dashboards/material-list/${slug}?labId=${selectedLab.id}`);
    } else {
      // Last resort fallback
      navigate("/dashboards");
    }
  };

  return (
    <Page title="Calibration Schedule Period">
      <div className="transition-content w-full pb-5">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4 px-[var(--margin-x)] pt-4">
          <h2 className="text-2xl font-bold tracking-wide text-gray-800 dark:text-dark-50">
            Calibration Schedule Period
          </h2>
          <div className="flex items-center gap-2">

            <Button
              onClick={handleBackToMMInstrumentList}
              variant="filled"
              color="neutral"
              className="flex items-center gap-1.5 h-9 rounded-md px-3 text-sm font-medium"
            >
              <ChevronsLeft className="h-4 w-4" />
              Back To MM Instrument List
            </Button>
          </div>
        </div>
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
            onExport={handleExport}
            departments={departments}
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
              <div className="p-4 pb-0 bg-white dark:bg-dark-900">
                <FormatHeader
                  title="Calibration Schedule Period"
                  qfNo="KTRCQF/0604/03"
                  issueNo="01"
                  issueDate="01/06/2019"
                  revisionNo="01"
                  revisionDate="20/08/2021"
                />
                <div className="flex justify-end text-sm font-medium text-gray-700 dark:text-gray-300 mt-2">
                  Date:- {new Date().toLocaleDateString("en-GB")}
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
                    {table.getHeaderGroups().map((headerGroup, groupIndex) => (
                      <Tr key={headerGroup.id}>
                        {headerGroup.headers.map((header) => {
                          // If we are in the bottom row, skip rendering ungrouped column spacers
                          if (groupIndex > 0 && !header.column.parent) {
                            return null;
                          }

                          // Calculate rowSpan:
                          // Spacers/placeholder headers represent ungrouped columns on the top-level.
                          // These top-level placeholders should span all the way down.
                          const rowSpan = header.isPlaceholder ? (table.getHeaderGroups().length - groupIndex) : 1;

                          return (
                            <Th
                              key={header.id}
                              colSpan={header.colSpan}
                              rowSpan={rowSpan}
                              className={clsx(
                                "bg-gray-200 font-semibold uppercase text-gray-800 dark:bg-dark-800 dark:text-dark-100 first:ltr:rounded-tl-lg last:ltr:rounded-tr-lg first:rtl:rounded-tr-lg last:rtl:rounded-tl-lg text-center",
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
                                  className="flex cursor-pointer select-none items-center justify-center space-x-3"
                                  onClick={header.column.getToggleSortingHandler()}
                                >
                                  <span className="flex-1">
                                    {flexRender(
                                      header.column.columnDef.header,
                                      header.getContext(),
                                    )}
                                  </span>
                                  <TableSortIcon
                                    sorted={header.column.getIsSorted()}
                                  />
                                </div>
                              ) : (
                                flexRender(
                                  header.column.columnDef.header,
                                  header.getContext(),
                                )
                              )}
                            </Th>
                          );
                        })}
                      </Tr>
                    ))}
                  </THead>
                  <TBody>
                    {table.getRowModel().rows.map((row) => {
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
                    })}
                    {searched && tableData.length === 0 && !loading && (
                      <Tr>
                        <Td colSpan={visibleColumns.length} className="py-10 text-center text-gray-500">
                          No data found for the selected criteria.
                        </Td>
                      </Tr>
                    )}
                    {!searched && (
                      <Tr>
                        <Td colSpan={visibleColumns.length} className="py-10 text-center text-gray-500">
                          Select a date range and click Search to view the Calibration Schedule Period.
                        </Td>
                      </Tr>
                    )}
                  </TBody>
                </Table>
              </div>
              <SelectedRowsActions table={table} />
              {table.getCoreRowModel().rows.length > 0 && (
                <>
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
                  {/* Signature Footer matching PHP */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-gray-200 dark:border-dark-500 p-6 text-sm text-gray-700 dark:text-gray-300">
                    <div>
                      <div className="font-semibold mb-1">Prepared by</div>
                      <div>Sr. Engineer</div>
                      <div className="mt-4">Name:</div>
                      <div className="mt-2">Sign:</div>
                    </div>
                    <div>
                      <div className="font-semibold mb-1">Reviewed by</div>
                      <div>DTM</div>
                      <div className="mt-4">Name:</div>
                      <div className="mt-2">Sign:</div>
                    </div>
                    <div>
                      <div className="font-semibold mb-1">Approved by</div>
                      <div>TM</div>
                      <div className="mt-4">Name:</div>
                      <div className="mt-2">Sign:</div>
                    </div>
                  </div>
                </>
              )}
            </Card>
          </div>
        </div>
      </div>
    </Page>
  );
}
