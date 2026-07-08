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
import { useNavigate } from "react-router";
import axios from "utils/axios";

// Local Imports
import { Table, Card, THead, TBody, Th, Tr, Td } from "components/ui";
import { TableSortIcon } from "components/shared/table/TableSortIcon";
import { Page } from "components/shared/Page";
import { Toolbar } from "./Toolbar";
import { useLockScrollbar, useDidUpdate, useLocalStorage } from "hooks";
import { fuzzyFilter } from "utils/react-table/fuzzyFilter";
import { useSkipper } from "utils/react-table/useSkipper";
import { PaginationSection } from "components/shared/table/PaginationSection";
import { useThemeContext } from "app/contexts/theme/context";
import { getUserAgentBrowser } from "utils/dom/getUserAgentBrowser";

const isSafari = getUserAgentBrowser() === "Safari";

export default function DispatchRegister() {
  const { cardSkin } = useThemeContext();
  const navigate = useNavigate();
  const permissions = JSON.parse(localStorage.getItem("userPermissions") || "[]");

  useEffect(() => {
    // Permission check for dispatch register - adjust as needed
    if (!permissions.includes(162)) {
      navigate("/dashboards");
    }
  }, [navigate, permissions]);

  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  
  // Filters matching PHP code
  const [filters, setFilters] = useState({
    startdate: "",
    enddate: "",
    department: "",
    customer: "",
    purpose: "",
    lrn: "",
    brn: "",
    contactperson: "",
  });

  const [departments, setDepartments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [purposes, setPurposes] = useState([]);

  // Fetch departments dropdown data (no permission check for disposal register)
  const fetchDepartments = useCallback(async () => {
    try {
      const res = await axios.get("/master/get-all-labs", {
        params: {
          vertical: 2,
          status: 1
        }
      });
      setDepartments(res.data?.data || []);
    } catch (err) {
      console.error("Error fetching departments:", err);
    }
  }, []);

  // Fetch customers dropdown data
  const fetchCustomers = useCallback(async () => {
    try {
      const res = await axios.get("/people/get-all-customers", {
        params: { status: 1 }
      });
      setCustomers(res.data?.data || []);
    } catch (err) {
      console.error("Error fetching customers:", err);
    }
  }, []);

  // Fetch purposes dropdown data
  const fetchPurposes = useCallback(async () => {
    try {
      const res = await axios.get("/people/get-specific-purpose-list");
      setPurposes(res.data?.data || []);
    } catch (err) {
      console.error("Error fetching purposes:", err);
    }
  }, []);

  useEffect(() => {
    fetchDepartments();
    fetchCustomers();
    fetchPurposes();
  }, [fetchDepartments, fetchCustomers, fetchPurposes]);

  const fetchReceivedData = async () => {
    try {
      setLoading(true);
      setSearched(true);
      
      const apiParams = {};
      if (filters.startdate) apiParams.startdate = filters.startdate;
      if (filters.enddate) apiParams.enddate = filters.enddate;
      if (filters.customer) apiParams.customer = filters.customer;
      if (filters.purpose) apiParams.purpose = filters.purpose;
      if (filters.contactperson) apiParams.contactperson = filters.contactperson;
      if (filters.lrn) apiParams.lrn = filters.lrn;
      if (filters.brn) apiParams.brn = filters.brn;
      
      const res = await axios.get("/register/dispatch-register", { params: apiParams });
      
      let rows = res.data?.data || [];
      
      rows = rows.map((row) => ({
        date: row.dindate || row.added_on || "",
        brn: row.brn || "",
        lrn: row.lrn || "",
        purpose: row.purposeName || row.purpose || "",
        basis: row.basis || "",
        name_of_party_address: row.customername || "",
        person: row.concernperson || "",
        sample_description: row.sampleDescription || "",
        report_description: row.certificate || "",
        invoice_description: row.invoice || "",
        dispatch_date: row.dispatchdate || "",
        dispatch_through: row.dispatchThroughName || "",
        document_no: row.courrierno || row.gatpassnumber || "",
        dispatched_by: row.dispatchByName || "",
      }));
      
      setTableData(rows);
    } catch (err) {
      console.error("Error fetching received data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e?.preventDefault?.();
    fetchReceivedData();
  };

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const [tableSettings, setTableSettings] = useState({
    enableFullScreen: false,
    enableRowDense: false,
  });

  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState([{ id: "lrn", desc: true }]); // PHP: order: [[0, "desc"]]

  const [columnVisibility, setColumnVisibility] = useLocalStorage(
    "column-visibility-alloted-items-1",
    {},
  );
  const [columnPinning, setColumnPinning] = useLocalStorage(
    "column-pinning-alloted-items-1",
    {},
  );

  const [autoResetPageIndex] = useSkipper();

  // Define columns matching PHP dispatch register table exactly
  const dispatchColumns = [
    {
      accessorKey: "date",
      header: "Date",
      cell: (info) => info.getValue(),
    },
    {
      accessorKey: "brn",
      header: "BRN",
      cell: (info) => info.getValue(),
    },
    {
      accessorKey: "lrn",
      header: "LRN",
      cell: (info) => info.getValue(),
    },
    {
      accessorKey: "purpose",
      header: "Purpose",
      cell: (info) => info.getValue(),
    },
    {
      accessorKey: "basis",
      header: "Basis",
      cell: (info) => info.getValue(),
    },
    {
      accessorKey: "name_of_party_address",
      header: "Name of Party Address",
      cell: (info) => info.getValue(),
    },
    {
      accessorKey: "person",
      header: "Person",
      cell: (info) => info.getValue(),
    },
    {
      accessorKey: "sample_description",
      header: "Sample",
      cell: (info) => info.getValue(),
    },
    {
      accessorKey: "report_description",
      header: "Report",
      cell: (info) => info.getValue(),
    },
    {
      accessorKey: "invoice_description",
      header: "Invoice",
      cell: (info) => info.getValue(),
    },
    {
      accessorKey: "dispatch_date",
      header: "Dispatch Date",
      cell: (info) => info.getValue(),
    },
    {
      accessorKey: "dispatch_through",
      header: "Dispatch Through",
      cell: (info) => info.getValue(),
    },
    {
      accessorKey: "document_no",
      header: "Document No.",
      cell: (info) => info.getValue(),
    },
    {
      accessorKey: "dispatched_by",
      header: "Dispatched By",
      cell: (info) => info.getValue(),
    },
  ];

  const table = useReactTable({
    data: tableData,
    columns: dispatchColumns,
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
    getPaginationRowModel: getPaginationRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onColumnPinningChange: setColumnPinning,
    autoResetPageIndex,
  });

  const visibleColumns = table.getVisibleLeafColumns();

  useDidUpdate(() => table.resetRowSelection(), [tableData]);
  useLockScrollbar(tableSettings.enableFullScreen);

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
      <Page title="Dispatch Register">
        <PageSpinner />
      </Page>
    );
  }

  return (
    <Page title="Dispatch Register">
      <Toolbar
        filters={filters}
        onChange={handleFilterChange}
        onSearch={handleSearch}
        departments={departments}
        customers={customers}
        purposes={purposes}
      />
      <div className="transition-content w-full pb-5">
        <div
          className={clsx(
            "flex h-full w-full flex-col",
            tableSettings.enableFullScreen && "fixed inset-0 z-61 bg-white pt-3 dark:bg-dark-900"
          )}
        >
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
                      <Tr
                        key={row.id}
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
                    ))}
                    {searched && tableData.length === 0 && !loading && (
                      <Tr>
                        <Td colSpan={visibleColumns.length} className="py-10 text-center text-gray-500">
                          No dispatch items found.
                        </Td>
                      </Tr>
                    )}
                    {!searched && (
                      <Tr>
                        <Td colSpan={visibleColumns.length} className="py-10 text-center text-gray-500">
                          Use the filters above and click Search to view the Dispatch Register.
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
