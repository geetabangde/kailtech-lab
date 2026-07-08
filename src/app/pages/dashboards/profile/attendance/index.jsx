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
import dayjs from "dayjs";
import { toast } from "sonner";

// Local Imports
import { Table, THead, TBody, Th, Tr, Td, Button } from "components/ui";
import { TableSortIcon } from "components/shared/table/TableSortIcon";
import { Page } from "components/shared/Page";
import { useLockScrollbar, useLocalStorage } from "hooks";
import { fuzzyFilter } from "utils/react-table/fuzzyFilter";
import { useSkipper } from "utils/react-table/useSkipper";
import { columns } from "./columns";
import { TableConfig } from "./TableConfig";
import { PaginationSection } from "components/shared/table/PaginationSection";
import { TableLoadingRow } from "components/shared/table/TableLoadingRow";

// ----------------------------------------------------------------------

export default function AttendanceTracker() {
  const [attendanceData, setAttendanceData] = useState([]);
  const [todayRecord, setTodayRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [punchLoading, setPunchLoading] = useState(false);

  const [tableSettings, setTableSettings] = useState({
    enableFullScreen: false,
    enableRowDense: false,
  });
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState([{ id: "date", desc: true }]);
  const [columnVisibility, setColumnVisibility] = useLocalStorage(
    "column-visibility-profile-attendance",
    {},
  );
  const [columnPinning, setColumnPinning] = useLocalStorage(
    "column-pinning-profile-attendance",
    {},
  );
  const [autoResetPageIndex, skipAutoResetPageIndex] = useSkipper();
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [listRes, todayRes] = await Promise.all([
        axios.get("profile/get-attendance-list").catch(() => ({ data: { status: false, data: [] } })),
        axios.get("profile/get-today-attendance-status").catch(() => ({ data: { status: false, data: null } }))
      ]);

      if (listRes.data.status && Array.isArray(listRes.data.data)) {
        setAttendanceData(listRes.data.data);
      } else {
        setAttendanceData([]);
      }

      if (todayRes.data.status && todayRes.data.data) {
        setTodayRecord(todayRes.data.data);
      } else {
        // Fallback check in fetched list if status API is empty
        const todayDateStr = dayjs().format("YYYY-MM-DD");
        const match = listRes.data.data?.find(r => dayjs(r.date).format("YYYY-MM-DD") === todayDateStr);
        setTodayRecord(match || null);
      }
    } catch (err) {
      console.error("Error loading attendance records:", err);
      toast.error("Failed to load attendance logs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // PHP logic conditions
  const isPunchedIn = todayRecord && todayRecord.status === 0;
  const isPunchedOut = todayRecord && todayRecord.status === 99;
  
  // time diff check in seconds since punch-in (required to be >= 1 hour)
  const timeDiffSec = todayRecord && todayRecord.intime
    ? dayjs().diff(dayjs(`${dayjs().format("YYYY-MM-DD")} ${todayRecord.intime}`), "second")
    : 0;
  
  const canPunchOut = isPunchedIn && timeDiffSec >= 3600;

  // Punch in/out location fetching & axios action
  const handlePunch = (type) => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      return;
    }

    setPunchLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const payload = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        try {
          const endpoint = type === "in" ? "profile/mark-attendance" : "profile/mark-out-attendance";
          const res = await axios.post(endpoint, payload);

          if (res.data.status || res.data.success) {
            toast.success(res.data.message || `${type === "in" ? "Punch In" : "Punch Out"} successful ✅`);
            fetchData();
          } else {
            toast.error(res.data.message || `Failed to ${type === "in" ? "punch in" : "punch out"}`);
          }
        } catch (err) {
          console.error(err);
          toast.error("An error occurred during punch request");
        } finally {
          setPunchLoading(false);
        }
      },
      (error) => {
        console.error("GPS error:", error);
        setPunchLoading(false);
        toast.error("Failed to get location. Please allow GPS access to punch attendance.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handlePunchOutConfirm = () => {
    if (confirm("Are you sure you want to mark out?")) {
      handlePunch("out");
    }
  };

  const table = useReactTable({
    data: attendanceData,
    columns: columns,
    state: {
      globalFilter,
      sorting,
      columnVisibility,
      columnPinning,
      pagination,
      tableSettings,
    },
    meta: {
      updateData: (rowIndex, columnId, value) => {
        skipAutoResetPageIndex();
        setAttendanceData((old) =>
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
      setTableSettings
    },
    filterFns: {
      fuzzy: fuzzyFilter,
    },
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
    onPaginationChange: setPagination,
    autoResetPageIndex,
  });

  useLockScrollbar(tableSettings.enableFullScreen);

  return (
    <Page title="Attendance">
      <div className="transition-content w-full pb-5">
        <div
          className={clsx(
            "flex h-full w-full flex-col",
            tableSettings.enableFullScreen &&
            "fixed inset-0 z-61 bg-white pt-3 dark:bg-dark-900",
          )}
        >
          <div className="card border-none shadow-soft dark:bg-dark-700">
            
            {/* Header section with Title & Geolocation Punch Actions */}
            <div className="card-header flex flex-col items-start justify-between gap-4 border-b border-gray-200 p-4 dark:border-dark-500 sm:flex-row sm:items-center sm:p-5">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-gray-800 dark:text-dark-100">
                  Attendance
                </h3>
              </div>

              {/* Dynamic Punch Button Block */}
              <div className="flex w-full flex-wrap items-center justify-end gap-3 sm:w-auto">
                <div className="relative w-full sm:w-64">
                  <input
                    type="text"
                    value={globalFilter ?? ""}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    placeholder="Search logs..."
                    className="form-input w-full rounded-lg border-gray-300 bg-white px-4 py-2 text-sm focus:border-primary-500 focus:ring-primary-500 dark:border-dark-400 dark:bg-dark-800"
                  />
                </div>

                <TableConfig table={table} />

                {/* Legacy Action Buttons */}
                {!isPunchedOut && (
                  <>
                    {isPunchedIn ? (
                      <Button
                        onClick={handlePunchOutConfirm}
                        disabled={punchLoading || !canPunchOut}
                        color="primary"
                        variant="filled"
                        className={clsx(
                          "whitespace-nowrap font-bold shadow-sm h-9 px-4",
                          canPunchOut 
                            ? "!bg-blue-600 !text-white hover:!bg-blue-700" 
                            : "!bg-gray-200 !text-gray-400 dark:!bg-dark-800 cursor-not-allowed"
                        )}
                        title={!canPunchOut ? "Requires at least 1 hour of check-in time" : "Punch Out"}
                      >
                        {punchLoading ? "Processing..." : "Mark Out time"}
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handlePunch("in")}
                        disabled={punchLoading}
                        color="secondary"
                        variant="filled"
                        className="!bg-emerald-600 !text-white hover:!bg-emerald-700 whitespace-nowrap font-bold shadow-sm h-9 px-4"
                      >
                        {punchLoading ? "Processing..." : "Mark Attendance"}
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="grow overflow-auto p-0">
              <Table
                hoverable
                dense={tableSettings.enableRowDense}
                className="w-full text-left"
              >
                <THead>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <Tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <Th
                          key={header.id}
                          className={clsx(
                            "bg-gray-55 text-xs font-bold uppercase text-gray-600 dark:bg-dark-800 dark:text-dark-200 align-top",
                            header.column.getCanPin() && [
                              header.column.getIsPinned() === "left" &&
                              "sticky z-2 ltr:left-0 rtl:right-0",
                              header.column.getIsPinned() === "right" &&
                              "sticky z-2 ltr:right-0 rtl:left-0",
                            ]
                          )}
                        >
                          <div className="flex flex-col gap-2">
                            {header.column.getCanSort() ? (
                              <div
                                className="flex cursor-pointer select-none items-center gap-2"
                                onClick={header.column.getToggleSortingHandler()}
                              >
                                {flexRender(
                                  header.column.columnDef.header,
                                  header.getContext(),
                                )}
                                <TableSortIcon
                                  sorted={header.column.getIsSorted()}
                                />
                              </div>
                            ) : (
                              <div>
                                {flexRender(
                                  header.column.columnDef.header,
                                  header.getContext(),
                                )}
                              </div>
                            )}
                          </div>
                        </Th>
                      ))}
                    </Tr>
                  ))}
                </THead>
                <TBody>
                  {loading ? (
                    <TableLoadingRow colSpan={columns.length} />
                  ) : table.getRowModel().rows.length > 0 ? (
                    table.getRowModel().rows.map((row) => (
                      <Tr
                        key={row.id}
                        className="border-b border-gray-200 hover:bg-gray-55/50 dark:border-dark-500 dark:hover:bg-dark-600/50"
                      >
                        {row.getVisibleCells().map((cell) => (
                          <Td
                            key={cell.id}
                            className={clsx(
                              "bg-white dark:bg-dark-700",
                              cell.column.getCanPin() && [
                                cell.column.getIsPinned() === "left" &&
                                "sticky z-2 ltr:left-0 rtl:right-0",
                                cell.column.getIsPinned() === "right" &&
                                "sticky z-2 ltr:right-0 rtl:left-0",
                              ]
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
                        className="h-32 text-center text-gray-500"
                      >
                        No attendance logs found
                      </Td>
                    </Tr>
                  )}
                </TBody>
              </Table>
            </div>

            <div className="p-4 sm:p-5">
              <PaginationSection table={table} />
            </div>

          </div>
        </div>

      </div>
    </Page>
  );
}
