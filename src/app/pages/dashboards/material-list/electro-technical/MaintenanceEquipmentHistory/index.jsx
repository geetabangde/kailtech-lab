

import {
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFacetedMinMaxValues,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import clsx from "clsx";
import { Fragment, useRef, useState, useEffect, useCallback } from "react";
import axios from "utils/axios";
import { useLocation, useParams } from "react-router-dom";


import { TableSortIcon } from "components/shared/table/TableSortIcon";
import { ColumnFilter } from "components/shared/table/ColumnFilter";
import { PaginationSection } from "components/shared/table/PaginationSection";
import { Button, Card, Table, THead, TBody, Th, Tr, Td } from "components/ui";
import {
  useBoxSize,
  useLockScrollbar,
  useLocalStorage,
  useDidUpdate,
} from "hooks";
import { fuzzyFilter } from "utils/react-table/fuzzyFilter";
import { useSkipper } from "utils/react-table/useSkipper";
import { SelectedRowsActions } from "./SelectedRowsActions";
import { SubRowComponent } from "./SubRowComponent";
import { columns } from "./columns";
import { Toolbar } from "./Toolbar";
import { useThemeContext } from "app/contexts/theme/context";
import { getUserAgentBrowser } from "utils/dom/getUserAgentBrowser";
import { useNavigate } from "react-router-dom";
import Select from "react-select";

const customSelectStyles = {
  control: (base, state) => ({
    ...base,
    minHeight: "32px",
    height: "32px",
    borderColor: state.isFocused ? "#3b82f6" : "#d1d5db",
    boxShadow: state.isFocused ? "0 0 0 1px rgba(59, 130, 246, 0.5)" : "none",
    "&:hover": {
      borderColor: "#3b82f6",
    },
    borderRadius: "0.375rem",
    fontSize: "0.875rem",
    backgroundColor: "white",
  }),
  valueContainer: (base) => ({
    ...base,
    padding: "0 8px",
    height: "32px",
  }),
  indicatorsContainer: (base) => ({
    ...base,
    height: "32px",
  }),
  menu: (base) => ({
    ...base,
    zIndex: 9999,
  }),
  menuPortal: (base) => ({
    ...base,
    zIndex: 9999,
  }),
};

// ----------------------------------------------------------------------

const isSafari = getUserAgentBrowser() === "Safari";

export default function MaintenanceEquipmentHistory() {
  const { cardSkin } = useThemeContext();
  const navigate = useNavigate();
  const location = useLocation();

  const { labSlug } = useParams();

  const permissions =
    localStorage.getItem("userPermissions")?.split(",").map(Number) || [];

  const [autoResetPageIndex, skipAutoResetPageIndex] = useSkipper();

  // ✅ State for API data
  const [historyData, setHistoryData] = useState([]);
  const [masterRecord, setMasterRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recordsFiltered, setRecordsFiltered] = useState(0);

  const [tableSettings, setTableSettings] = useState({
    enableSorting: true,
    enableColumnFilters: true,
    enableFullScreen: false,
    enableRowDense: false,
  });

  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState([{ id: "id", desc: true }]);

  // ✅ Pagination state
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const [columnVisibility, setColumnVisibility] = useLocalStorage(
    "column-visibility-maintenance-history",
    {},
  );

  const [columnPinning, setColumnPinning] = useLocalStorage(
    "column-pinning-maintenance-history",
    {},
  );

  const cardRef = useRef();
  const { width: cardWidth } = useBoxSize({ ref: cardRef });

  // ✅ API call function with useCallback to fix the missing dependency warning
  const fetchMaintenanceHistory = useCallback(async (fid) => {
    try {
      setLoading(true);

      const response = await axios.get(
        `/material/maintenance-equipment-history`, {
        params: {
          fid: fid,
          draw: 1,
          start: pagination.pageIndex * pagination.pageSize,
          length: pagination.pageSize,
          'search[value]': globalFilter
        }
      }
      );

      if (response.data) {
        setHistoryData(Array.isArray(response.data.data) ? response.data.data : []);
        setMasterRecord(response.data.masterRecord || null);
        setRecordsFiltered(response.data.recordsFiltered || 0);
      } else {
        console.warn("Unexpected response structure:", response.data);
        setHistoryData([]);
      }
    } catch (err) {
      console.error("Error fetching maintenance history:", err);
      setHistoryData([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.pageIndex, pagination.pageSize, globalFilter]);

  // ✅ Fetch maintenance history when URL params change
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const fid = params.get("fid") || "";

    if (fid) {
      fetchMaintenanceHistory(fid);
    } else {
      setLoading(false);
      setHistoryData([]);
    }
  }, [location.search, fetchMaintenanceHistory]);

  // ✅ Handler for Back to MM List button
  const handleBackToMMList = () => {
    const params = new URLSearchParams(location.search);
    const labId = params.get('labId');

    if (labId && labSlug) {
      // Navigate back to MM Instrument List with labId and correct slug
      navigate(`/dashboards/material-list/${labSlug}?labId=${labId}`);
    } else {
      // Fallback
      navigate(`/dashboards/material-list/${labSlug || 'electro-technical'}`);
    }
  };

  const table = useReactTable({
    data: historyData,
    columns: columns,
    state: {
      globalFilter,
      sorting,
      columnVisibility,
      columnPinning,
      tableSettings,
      pagination,
    },
    meta: {
      setTableSettings,
      deleteRow: (row) => {
        skipAutoResetPageIndex();
        setHistoryData((old) =>
          old.filter((oldRow) => oldRow.id !== row.original.id),
        );
      },
      deleteRows: (rows) => {
        skipAutoResetPageIndex();
        const rowIds = rows.map((row) => row.original.id);
        setHistoryData((old) => old.filter((row) => !rowIds.includes(row.id)));
      },
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

    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: () => true,

    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnPinningChange: setColumnPinning,

    autoResetPageIndex,
    pageCount: Math.ceil(recordsFiltered / pagination.pageSize),
    manualPagination: true,
  });

  useDidUpdate(() => table.resetRowSelection(), [historyData]);

  useLockScrollbar(tableSettings.enableFullScreen);


  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-gray-600">
        <svg className="animate-spin h-6 w-6 mr-2 text-blue-600" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z"></path>
        </svg>
        Loading Maintenance History...
      </div>
    );
  }

  return (
    <div className="transition-content grid grid-cols-1 grid-rows-[auto_auto_1fr] px-[var(--margin-x)] py-4">
      {/* ✅ Master Record Information */}
      {masterRecord && (
        <div className="mb-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-dark-800">
          <h3 className="mb-3 text-lg font-semibold text-gray-800 dark:text-white">
            Equipment Details
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            <div>
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Name:</span>
              <p className="text-sm font-semibold text-gray-800 dark:text-white">{masterRecord.name}</p>
            </div>
            <div>
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">ID No:</span>
              <p className="text-sm font-semibold text-gray-800 dark:text-white">{masterRecord.idno}</p>
            </div>
            <div>
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Serial No:</span>
              <p className="text-sm font-semibold text-gray-800 dark:text-white">{masterRecord.serialno}</p>
            </div>
            <div>
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Make:</span>
              <p className="text-sm font-semibold text-gray-800 dark:text-white">{masterRecord.make}</p>
            </div>
            <div>
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Model:</span>
              <p className="text-sm font-semibold text-gray-800 dark:text-white">{masterRecord.model}</p>
            </div>
            <div>
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Quantity:</span>
              <p className="text-sm font-semibold text-gray-800 dark:text-white">{masterRecord.quantity}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between space-x-4">
        <div className="min-w-0 flex items-center gap-3">
          <h2 className="truncate text-xl font-medium tracking-wide text-gray-800 dark:text-dark-50">
            Maintenance Equipment History
          </h2>
        </div>

        {/* Right Side Actions */}
        <div className="flex flex-wrap items-center gap-3">

          {/* ✅ Back to MM List Button */}
          <Button
            className="h-8 space-x-1.5 rounded-md px-3 text-xs"
            color="primary"
            onClick={handleBackToMMList}
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            <span>Back to MM List</span>
          </Button>

          {/* ✅ Service Type Filter */}
          <Select
            styles={customSelectStyles}
            className="w-48"
            options={[
              { value: "", label: "All Service Types" },
              ...Array.from(table.getColumn("typeofservice")?.getFacetedUniqueValues()?.keys() || [])
                .filter(Boolean)
                .sort()
                .map((service) => ({ value: service, label: service })),
            ]}
            value={{
              value: table.getColumn("typeofservice")?.getFilterValue() || "",
              label: table.getColumn("typeofservice")?.getFilterValue() || "All Service Types",
            }}
            onChange={(opt) => {
              const value = opt?.value || undefined;
              table.getColumn("typeofservice")?.setFilterValue(value);
            }}
            isSearchable
            menuPortalTarget={document.body}
            menuPosition="fixed"
          />


          {((permissions.includes(69) && masterRecord?.status == 4) || permissions.includes(351)) && (
            <Button
              className="h-8 space-x-1.5 rounded-md px-3 text-xs"
              color="primary"
              onClick={() => {
                const params = new URLSearchParams(location.search);
                const fid = params.get('fid');
                const labId = params.get('labId');

                if (fid && labId && labSlug) {
                  navigate(
                    `/dashboards/material-list/${labSlug}/maintenance-equipment-history/add-new-equipment-history?fid=${fid}&labId=${labId}`
                  );
                } else {
                  navigate(
                    `/dashboards/material-list/${labSlug || 'electro-technical'}/maintenance-equipment-history/add-new-equipment-history`
                  );
                }
              }}
            >
              Add New Equipment History
            </Button>
          )}
        </div>
      </div>

      <div
        className={clsx(
          "flex flex-col pt-4",
          tableSettings.enableFullScreen &&
          "fixed inset-0 z-61 h-full w-full bg-white pt-3 dark:bg-dark-900",
        )}
      >
        <Toolbar table={table} />
        <Card
          className={clsx(
            "relative mt-3 flex grow flex-col",
            tableSettings.enableFullScreen && "overflow-hidden",
          )}
          ref={cardRef}
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
                        {header.column.getCanFilter() ? (
                          <ColumnFilter column={header.column} />
                        ) : null}
                      </Th>
                    ))}
                  </Tr>
                ))}
              </THead>
              <TBody>
                {table.getRowModel().rows.map((row) => {
                  return (
                    <Fragment key={row.id}>
                      <Tr
                        className={clsx(
                          "relative border-y border-transparent border-b-gray-200 dark:border-b-dark-500",
                          row.getIsExpanded() && "border-dashed",
                          row.getIsSelected() && !isSafari &&
                          "row-selected after:pointer-events-none after:absolute after:inset-0 after:z-2 after:h-full after:w-full after:border-3 after:border-transparent after:bg-primary-500/10 ltr:after:border-l-primary-500 rtl:after:border-r-primary-500",
                        )}
                      >
                        {row.getVisibleCells().map((cell) => {
                          return (
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
                      {row.getIsExpanded() && (
                        <tr>
                          <td
                            colSpan={row.getVisibleCells().length}
                            className="p-0"
                          >
                            <SubRowComponent row={row} cardWidth={cardWidth} />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </TBody>
            </Table>
          </div>
          <SelectedRowsActions table={table} />
          {historyData.length > 0 && (
            <div
              className={clsx(
                "px-4 pb-4 sm:px-5 sm:pt-4",
                tableSettings.enableFullScreen && "bg-gray-50 dark:bg-dark-800",
                !(
                  table.getIsSomeRowsSelected() || table.getIsAllRowsSelected()
                ) && "pt-4",
              )}
            >
              <PaginationSection table={table} />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}