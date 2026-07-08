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

// Local Imports
import { Table, Card, THead, TBody, Th, Tr, Td } from "components/ui";
import { TableSortIcon } from "components/shared/table/TableSortIcon";
import { Page } from "components/shared/Page";
import { useLockScrollbar, useDidUpdate, useLocalStorage } from "hooks";
import { fuzzyFilter } from "utils/react-table/fuzzyFilter";
import { useSkipper } from "utils/react-table/useSkipper";
import { Toolbar } from "./Toolbar";
import { FormatHeader } from "components/shared/FormatHeader";
import { PaginationSection } from "components/shared/table/PaginationSection";
import { useThemeContext } from "app/contexts/theme/context";
import { getUserAgentBrowser } from "utils/dom/getUserAgentBrowser";

const isSafari = getUserAgentBrowser() === "Safari";

export default function SampleInwardRegister() {
  const { cardSkin } = useThemeContext();
  const navigate = useNavigate();
  const permissions = JSON.parse(localStorage.getItem("userPermissions") || "[]");

  useEffect(() => {
    // Permission 161 as per PHP code: if(!in_array(161, $permissions)){ header("location:index.php"); }
    if (!permissions.includes(161)) {
      navigate("/dashboards");
    }
  }, [navigate, permissions]);

  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  
  // Complex filters matching PHP code
  const [filters, setFilters] = useState({
    startdate: "",
    enddate: "",
    department: "",
    product: "",
    contactperson: "",
    reportstatus: "",
    customer: "",
  });

  const [departments, setDepartments] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);

  // Fetch dropdown data
  const fetchDropdownData = async () => {
    try {
      const [custRes, deptRes, prodRes] = await Promise.allSettled([
        axios.get("/people/get-all-customers"), // Customers
        axios.get("/register/get-lab-by-vertical/2"), // Departments (labs)
        axios.get("/testing/get-prodcut-list"), // Products
      ]);

      if (custRes.status === "fulfilled") setCustomers(custRes.value.data?.data || []);
      if (deptRes.status === "fulfilled") setDepartments(deptRes.value.data?.data || []);
      if (prodRes.status === "fulfilled") setProducts(prodRes.value.data?.data || []);
    } catch (err) {
      console.error("Error fetching dropdown data:", err);
    }
  };

  useEffect(() => {
    fetchDropdownData();
  }, []);

  // Fetch sample inward data
  const fetchSampleInwardData = async () => {
    try {
      setLoading(true);
      setSearched(true);
      
      // Filter out empty parameters
      const activeFilters = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== null && v !== "")
      );
      
      // Use new API endpoint
      const res = await axios.get("/register/get-inward-register", { params: activeFilters });
      
      // Handle response format
      let rows = res.data?.data || [];
      
      rows = rows.map((row) => ({
        sno: row.id || "",
        date: row.tdate || "",
        brn: row.brn || "",
        lrn: row.lrn || "",
        party_name: row.customername || "",
        contact_person: row.concernperson || "",
        sample_details: row.productname || "",
        quantity: row.packageText ? String(row.packageText).replace(/<[^>]*>?/gm, "") : "",
        department: row.dname || "",
        parameters: row.pname || "",
        committed_date: row.deadline || "",
        reporting_date: row.reportdate || "",
        tat: row.days || "",
        remarks: row.remark || "",
      }));
      
      setTableData(rows);
    } catch (err) {
      console.error("Error fetching sample inward data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = (e) => {
    e?.preventDefault?.();
    fetchSampleInwardData();
  };

  const [tableSettings, setTableSettings] = useState({
    enableFullScreen: false,
    enableRowDense: false,
  });

  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState([{ id: "sno", desc: true }]); // PHP: order: [[0, "desc"]]

  const [columnVisibility, setColumnVisibility] = useLocalStorage(
    "column-visibility-sample-inward-register-1",
    {},
  );
  const [columnPinning, setColumnPinning] = useLocalStorage(
    "column-pinning-sample-inward-register-1",
    {},
  );

  const [autoResetPageIndex] = useSkipper();

  // Define columns matching API data structure
  const sampleInwardColumns = [
    {
      accessorKey: "sno",
      header: "S no",
      cell: (info) => info.getValue(),
    },
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
      accessorKey: "party_name",
      header: "Party name",
      cell: (info) => info.getValue(),
    },
    {
      accessorKey: "contact_person",
      header: "Contact Person",
      cell: (info) => info.getValue(),
    },
    {
      accessorKey: "sample_details",
      header: "Sample Details",
      cell: (info) => info.getValue(),
    },
    {
      accessorKey: "quantity",
      header: "Quantity",
      cell: (info) => info.getValue(),
    },
    {
      accessorKey: "department",
      header: "Department",
      cell: (info) => info.getValue(),
    },
    {
      accessorKey: "parameters",
      header: "Parameters",
      cell: (info) => info.getValue(),
    },
    {
      accessorKey: "committed_date",
      header: "Committed Date",
      cell: (info) => info.getValue(),
    },
    {
      accessorKey: "reporting_date",
      header: "Reporting Date",
      cell: (info) => info.getValue(),
    },
    {
      accessorKey: "tat",
      header: "TAT",
      cell: (info) => info.getValue(),
    },
    {
      accessorKey: "remarks",
      header: "Remarks",
      cell: (info) => info.getValue(),
    },
  ];

  const table = useReactTable({
    data: tableData,
    columns: sampleInwardColumns,
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
      <Page title="Sample Inward Register">
        <PageSpinner />
      </Page>
    );
  }

  return (
    <Page title="Sample Inward Register">
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
            customers={customers}
            departments={departments}
            products={products}
          />
          <div
            className={clsx(
              "transition-content flex grow flex-col pt-3",
              tableSettings.enableFullScreen ? "overflow-hidden" : "px-[var(--margin-x)]"
            )}
          >
            <Card className={clsx("relative flex grow flex-col", tableSettings.enableFullScreen && "overflow-hidden")}>
              <div className="p-4 pb-0 bg-white dark:bg-dark-900">
                <FormatHeader
                  title="Sample /UUC Received Record and Department Sample Inward Register"
                  qfNo="KTRCQF/0704/01"
                  issueNo="01"
                  issueDate="01/06/2019"
                  revisionNo="01"
                  revisionDate="20/08/2021"
                />
              </div>
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
                          No data found for the selected criteria.
                        </Td>
                      </Tr>
                    )}
                    {!searched && (
                      <Tr>
                        <Td colSpan={visibleColumns.length} className="py-10 text-center text-gray-500">
                          Use the filters above and click Search to view the Testing Track Report.
                        </Td>
                      </Tr>
                    )}
                  </TBody>
                </Table>
              </div>
              {table.getCoreRowModel().rows.length > 0 && (
                <>
                  <div
                    className={clsx(
                      "px-4 pb-4 sm:px-5 sm:pt-4",
                      tableSettings.enableFullScreen && "bg-gray-50 dark:bg-dark-800",
                      !(table.getIsSomeRowsSelected() || table.getIsAllRowsSelected()) && "pt-4"
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
