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
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Table, Card, THead, TBody, Th, Tr, Td, Input } from "components/ui";
import { TableSortIcon } from "components/shared/table/TableSortIcon";
import { Page } from "components/shared/Page";
import { useLockScrollbar, useDidUpdate, useLocalStorage } from "hooks";
import { fuzzyFilter } from "utils/react-table/fuzzyFilter";
import { useSkipper } from "utils/react-table/useSkipper";
import { Toolbar } from "./Toolbar";
import { TableConfig } from "./TableConfig";
import { FormatHeader } from "components/shared/FormatHeader";
import { PaginationSection } from "components/shared/table/PaginationSection";
import { useThemeContext } from "app/contexts/theme/context";
import { getUserAgentBrowser } from "utils/dom/getUserAgentBrowser";

const isSafari = getUserAgentBrowser() === "Safari";

const ContactPersonCell = ({ id }) => {
  const [name, setName] = useState(id);

  useEffect(() => {
    if (!id || id === "N.A" || id === "N/A" || isNaN(id)) return;

    let isMounted = true;
    const fetchContact = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const res = await axios.get(`/inventory/get-customer-contact/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (isMounted && res.data?.status && res.data?.data) {
          setName(res.data.data.name || id);
        }
      } catch (err) {
        console.error("Error fetching contact person:", err);
      }
    };

    fetchContact();
    return () => {
      isMounted = false;
    };
  }, [id]);

  return <span>{name}</span>;
};

export default function SampleInwardRegister() {
  const { cardSkin } = useThemeContext();
  const navigate = useNavigate();
  const permissions = JSON.parse(localStorage.getItem("userPermissions") || "[]");

  useEffect(() => {
    // Permission 160 or 161 required for Sample Inward Register
    if (!permissions.includes(160) && !permissions.includes(161)) {
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
  const fetchDropdownData = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchDropdownData();
  }, [fetchDropdownData]);

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
      const res = await axios.get("/records/inward-register-calibration", { params: activeFilters });

      // Handle response format
      let rows = res.data?.data || [];

      rows = rows.map((row, index) => {
        let tatStr = "";
        if (row.targetstartdate && row.commiteddate && row.targetstartdate !== "0000-00-00" && row.commiteddate !== "0000-00-00") {
          const d1 = new Date(row.targetstartdate);
          const d2 = new Date(row.commiteddate);
          if (!isNaN(d1) && !isNaN(d2)) {
            const diffDays = Math.round(Math.abs(d2 - d1) / (1000 * 60 * 60 * 24));
            tatStr = diffDays + " days ";
          }
        }

        return {
          sno: index + 1,
          date: row.inwarddate || "",
          brn: row.brn || "",
          lrn: row.lrn || "",
          party_name: row.cname || "",
          contact_person: row.concernperson || "",
          sample_details: row.name || "",
          quantity: "1",
          department: row.dname || "",
          parameters: row.pname || "",
          commiteddate: row.commiteddate || "",
          reporting_date: row.calibratedon ? row.calibratedon.split(" ")[0] : "",
          tat: tatStr,
          remarks: "",
        };
      });

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
    "column-visibility-records-sample-inward-register-1",
    {},
  );
  const [columnPinning, setColumnPinning] = useLocalStorage(
    "column-pinning-records-sample-inward-register-1",
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
      cell: (info) => <ContactPersonCell id={info.getValue()} />,
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
      accessorKey: "commiteddate",
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
    initialState: {
      pagination: {
        pageSize: 25,
      },
    },
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
          <div className="table-toolbar px-[var(--margin-x)]">
            <div className="flex items-center justify-between space-x-4 overflow-x-auto pb-1 pt-2">
              <div className="flex shrink-0 space-x-2">
                <Input
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  prefix={<MagnifyingGlassIcon className="size-4" />}
                  classNames={{
                    input: "h-8 text-xs ring-primary-500/50 focus:ring-3",
                    root: "shrink-0",
                  }}
                  placeholder="Search in table..."
                />
              </div>
              <div className="flex items-center gap-2">
                <TableConfig table={table} />
              </div>
            </div>
          </div>
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
                          Use the filters above and click Search to view the Sample Inward Register.
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
