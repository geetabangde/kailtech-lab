// Import Dependencies
import {
  flexRender,
  getCoreRowModel,
  getFacetedMinMaxValues,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getExpandedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import clsx from "clsx";
import { useState, useEffect, useCallback, Fragment } from "react";
import { useNavigate } from "react-router";
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
import { getUserAgentBrowser } from "utils/dom/getUserAgentBrowser";

const isSafari = getUserAgentBrowser() === "Safari";

export default function CalibrationTrackReport() {
  const { cardSkin } = useThemeContext();
  const navigate = useNavigate();
  const permissions = JSON.parse(localStorage.getItem("userPermissions") || "[]");

  useEffect(() => {
    // Permission 480 as per PHP code: if(!in_array(480, $permissions)){ header("location:index.php"); }
    if (!permissions.includes(480)) {
      navigate("/dashboards");
    }
  }, [navigate, permissions]);

  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Filters matching Toolbar inputs
  const [filters, setFilters] = useState({
    date: "",
    startdate: "",
    enddate: "",
    bd: "",
    customer: "",
    transfertolab: "",
    ch: "",
    color: "",
  });

  // Metadata for dropdowns
  const [bdList, setBdList] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [labs, setLabs] = useState([]);
  const [chemists, setChemists] = useState([]);

  // Fetch all metadata
  const fetchMetadata = useCallback(async () => {
    try {
      const [bdRes, custRes, labRes, chemRes] = await Promise.allSettled([
        axios.get("/people/get-customer-bd"), // BDs
        axios.get("/people/get-all-customers"), // Customers
        axios.get("/register/get-lab-by-vertical/1"), // Labs
        axios.get("/register/get-lab-user"), // Chemists
      ]);

      if (bdRes.status === "fulfilled") setBdList(bdRes.value.data?.data || []);
      if (custRes.status === "fulfilled") setCustomers(custRes.value.data?.data || []);
      if (labRes.status === "fulfilled") setLabs(labRes.value.data?.data || []);
      if (chemRes.status === "fulfilled") setChemists(chemRes.value.data?.data || []);
    } catch (err) {
      console.error("Error fetching metadata:", err);
    }
  }, []);

  // Fetch report data
  const fetchReportData = async () => {
    try {
      setLoading(true);
      
      const activeFilters = Object.fromEntries(
        Object.entries(filters).filter((entry) => entry[1] !== "" && entry[1] !== null && entry[1] !== undefined)
      );

      const res = await axios.get("/register/calibration-track-record", { params: activeFilters });
      
      let rows = res.data?.data || [];
      
      // Map API response to table columns
      rows = rows.map((r, i) => ({
        ...r,
        sr_no: r.sr_no || i + 1,
        booking_date: r.inwarddate,
        client_name: r.customername,
        rep: r.reportname,
        concerned_bd: r.bdnames,
        brn_no: r.bookingrefno,
        lrn_no: r.lrn,
        sample: r.name,
        department: r.lab,
        tat: r.daysrequired,
        hod_chemist_engineer: r.caliby,
        final_report_date: r.calibratedon,
        ulr_no: r.ulrno,
        ulr_generate_date: r.allotedon,
        approved_date: r.approvedon,
        bill_no: r.invoiceno,
        bill_date: r.issuedate,
        dispatch: r.challanno,
        dispatch_date: r.authoriseon,
        row_colors: r.row_colors,
      }));
      
      setTableData(rows);
    } catch (err) {
      console.error("Error fetching calibration track report:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetadata();
    fetchReportData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchMetadata]);

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = (e) => {
    e?.preventDefault?.();
    fetchReportData();
  };

  const [tableSettings, setTableSettings] = useState({
    enableFullScreen: false,
    enableRowDense: false,
  });

  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState([]);

  const [columnVisibility, setColumnVisibility] = useLocalStorage(
    "column-visibility-calibration-track-report-2",
    {
      tat: false,
      hod_chemist_engineer: false,
      final_report_date: false,
      ulr_no: false,
      ulr_generate_date: false,
      approved_date: false,
      bill_no: false,
      bill_date: false,
      dispatch: false,
      dispatch_date: false,
    },
  );
  const [columnPinning, setColumnPinning] = useLocalStorage(
    "column-pinning-calibration-track-report-1",
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
    meta: { setTableSettings },
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
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: () => true,
    getPaginationRowModel: getPaginationRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onColumnPinningChange: setColumnPinning,
    autoResetPageIndex,
  });

  useDidUpdate(() => table.resetRowSelection(), [tableData]);
  useLockScrollbar(tableSettings.enableFullScreen);

  const visibleColumns = table.getVisibleLeafColumns();

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

  if (loading) {
    return (
      <Page title="List of Calibration Records">
        <PageSpinner />
      </Page>
    );
  }

  return (
    <Page title="List of Calibration Records">
      <div className="transition-content w-full pb-5">
        <div
          className={clsx(
            "flex h-full w-full flex-col",
            tableSettings.enableFullScreen && "fixed inset-0 z-61 bg-white pt-3 dark:bg-dark-900"
          )}
        >
          <Toolbar
            filters={filters}
            onChange={handleFilterChange}
            onSearch={handleSearch}
            bdList={bdList}
            customers={customers}
            labs={labs}
            chemists={chemists}
          />
          <div
            className={clsx(
              "transition-content flex grow flex-col pt-3",
              tableSettings.enableFullScreen ? "overflow-hidden" : "px-[var(--margin-x)]"
            )}
          >
            <Card className={clsx("relative flex grow flex-col", tableSettings.enableFullScreen && "overflow-hidden")}>
              <div className="table-wrapper min-w-full grow overflow-x-auto">
                <Table hoverable dense={tableSettings.enableRowDense} sticky={tableSettings.enableFullScreen} className="w-full text-left rtl:text-right text-xs">
                  <THead>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <Tr key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <Th
                            key={header.id}
                            className={clsx(
                              "bg-gray-200 font-semibold uppercase text-gray-800 dark:bg-dark-800 dark:text-dark-100 first:ltr:rounded-tl-lg last:ltr:rounded-tr-lg first:rtl:rounded-tr-lg last:rtl:rounded-tl-lg whitespace-nowrap",
                              header.column.getCanPin() && [
                                header.column.getIsPinned() === "left" && "sticky z-2 ltr:left-0 rtl:right-0",
                                header.column.getIsPinned() === "right" && "sticky z-2 ltr:right-0 rtl:left-0",
                              ]
                            )}
                          >
                            {header.column.getCanSort() ? (
                              <div className="flex cursor-pointer select-none items-center space-x-3" onClick={header.column.getToggleSortingHandler()}>
                                <span className="flex-1">{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}</span>
                                <TableSortIcon sorted={header.column.getIsSorted()} />
                              </div>
                            ) : header.isPlaceholder ? null : (
                              flexRender(header.column.columnDef.header, header.getContext())
                            )}
                          </Th>
                        ))}
                      </Tr>
                    ))}
                  </THead>
                  <TBody>
                    {table.getRowModel().rows.map((row) => (
                      <Fragment key={row.id}>
                        <Tr
                          className={clsx(
                            "relative border-y border-transparent border-b-gray-200 dark:border-b-dark-500",
                            row.getIsSelected() && !isSafari && "row-selected after:pointer-events-none after:absolute after:inset-0 after:z-2 after:h-full after:w-full after:border-3 after:border-transparent after:bg-primary-500/10 ltr:after:border-l-primary-500 rtl:after:border-r-primary-500"
                          )}
                        >
                          {row.getVisibleCells().map((cell) => (
                            <Td
                              key={cell.id}
                              className={clsx(
                                "relative bg-white whitespace-nowrap",
                                cardSkin === "shadow" ? "dark:bg-dark-700" : "dark:bg-dark-900",
                                cell.column.getCanPin() && [
                                  cell.column.getIsPinned() === "left" && "sticky z-2 ltr:left-0 rtl:right-0",
                                  cell.column.getIsPinned() === "right" && "sticky z-2 ltr:right-0 rtl:left-0",
                                ]
                              )}
                            >
                              {cell.column.getIsPinned() && (
                                <div
                                  className={clsx(
                                    "pointer-events-none absolute inset-0 border-gray-200 dark:border-dark-500",
                                    cell.column.getIsPinned() === "left" ? "ltr:border-r rtl:border-l" : "ltr:border-l rtl:border-r"
                                  )}
                                ></div>
                              )}
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </Td>
                          ))}
                        </Tr>
                        {row.getIsExpanded() && (
                          <Tr>
                            <Td colSpan={row.getVisibleCells().length} className="bg-gray-50 px-4 py-2 dark:bg-dark-800">
                              <div className="flex flex-col text-xs">
                                {row.getAllCells().map((cell) => {
                                  const ignoredColumns = [
                                    "sr_no",
                                    "booking_date",
                                    "client_name",
                                    "rep",
                                    "concerned_bd",
                                    "brn_no",
                                    "lrn_no",
                                    "sample",
                                    "department"
                                  ];
                                  if (ignoredColumns.includes(cell.column.id)) return null;
                                  return (
                                    <div key={cell.id} className="flex flex-col sm:flex-row sm:gap-2 py-[2px]">
                                      <span className="font-semibold text-gray-800 w-52 dark:text-gray-200">
                                        {typeof cell.column.columnDef.header === "string" ? cell.column.columnDef.header : cell.column.id}:
                                      </span>
                                      <span className="text-gray-700 dark:text-gray-400">
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </Td>
                          </Tr>
                        )}
                      </Fragment>
                    ))}
                    {tableData.length === 0 && !loading && (
                      <Tr>
                        <Td colSpan={visibleColumns.length} className="py-10 text-center text-gray-500">
                          No data found for the selected criteria.
                        </Td>
                      </Tr>
                    )}
                  </TBody>
                </Table>
              </div>
              {table.getCoreRowModel().rows.length > 0 && (
                <div
                  className={clsx(
                    "px-4 pb-4 sm:px-5 sm:pt-4",
                    tableSettings.enableFullScreen && "bg-gray-50 dark:bg-dark-800",
                    !(table.getIsSomeRowsSelected() || table.getIsAllRowsSelected()) && "pt-4"
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
