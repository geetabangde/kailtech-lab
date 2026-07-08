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
import { Toolbar } from "./Toolbar";
import { columns } from "./columns";
import { useLockScrollbar, useDidUpdate, useLocalStorage } from "hooks";
import { fuzzyFilter } from "utils/react-table/fuzzyFilter";
import { useSkipper } from "utils/react-table/useSkipper";
import { PaginationSection } from "components/shared/table/PaginationSection";
import { useThemeContext } from "app/contexts/theme/context";
import { getUserAgentBrowser } from "utils/dom/getUserAgentBrowser";

const isSafari = getUserAgentBrowser() === "Safari";

export default function BisDisposalRegister() {
  const { cardSkin } = useThemeContext();
  const navigate = useNavigate();
  const permissions = JSON.parse(localStorage.getItem("userPermissions") || "[]");

  useEffect(() => {
    // Permission 353 as per PHP code: if(!in_array(353, $permissions)){ header("location:index.php"); }
    if (!permissions.includes(353)) {
      navigate("/dashboards");
    }
  }, [navigate, permissions]);

  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [, setSearched] = useState(false);
  const [companyInfo, setCompanyInfo] = useState(null);

  // Filters matching PHP code
  const [filters, setFilters] = useState({
    startdate: "",
    enddate: "",
    department: "",
    specificpurpose: "",
    product: "",
    contactperson: "",
  });
  const [departments, setDepartments] = useState([]);
  const [specificPurposes, setSpecificPurposes] = useState([]);
  const [products, setProducts] = useState([]);

  // Fetch company info
  const fetchCompanyInfo = async () => {
    try {
      const res = await axios.get("/get-company-info");
      if (res.data?.status) {
        setCompanyInfo(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching company info:", err);
    }
  };

  // Fetch departments dropdown data
  const fetchDepartments = async () => {
    try {
      const res = await axios.get("register/get-lab-by-vertical/2");
      setDepartments(res.data?.data || []);
    } catch (err) {
      console.error("Error fetching departments:", err);
    }
  };

  // Fetch specific purposes dropdown data
  const fetchSpecificPurposes = async () => {
    try {
      const res = await axios.get("/people/get-specific-purpose-list");
      setSpecificPurposes(res.data?.data || []);
    } catch (err) {
      console.error("Error fetching specific purposes:", err);
    }
  };

  // Fetch products dropdown data
  const fetchProducts = async () => {
    try {
      const res = await axios.get("testing/get-prodcut-list", {
        params: { status: 1 }
      });
      setProducts(res.data?.data || []);
    } catch (err) {
      console.error("Error fetching products:", err);
    }
  };

  useEffect(() => {
    fetchCompanyInfo();
    fetchDepartments();
    fetchSpecificPurposes();
    fetchProducts();
  }, []);

  // Fetch BIS disposal register data using PHP endpoint
  const fetchReceivedData = async () => {
    try {
      setLoading(true);
      setSearched(true);

      const activeFilters = Object.fromEntries(
        Object.entries(filters).filter((entry) => entry[1] !== "" && entry[1] !== null && entry[1] !== undefined)
      );

      // Use bis-disposal-register endpoint matching backend API
      const res = await axios.get("/register/big-disposal-register", { params: activeFilters });

      // Handle DataTables server-side response format
      let rows = res.data?.data || [];

      // Map to PHP table structure: S no, Date, LRN/BRN, Nature of Sample, Indian Standards, Quantity Recieved, Received, Parameters, Allocated To, Reporting Date, Signature, Approx Qty After Test, Signature of Sample Receiver With Date
      rows = rows.map((row) => ({
        sno: row[0] || "",
        date: row[1] || "",
        lrn_brn: row[2] || "",
        nature_of_sample: row[3] || "",
        indian_standards: row[4] || "",
        quantity_received: row[5] || "",
        received: row[6] || "",
        parameters: row[7] || "",
        allocated_to: row[8] || "",
        reporting_date: row[9] || "",
        signature: row[10] || "",
        approx_qty_after_test: row[11] || "",
        signature_receiver_date: row[12] || "",
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
  const [sorting, setSorting] = useState([{ id: "sno", desc: true }]); // PHP: order: [[0, "desc"]]

  const [columnVisibility, setColumnVisibility] = useLocalStorage(
    "column-visibility-alloted-items-1",
    {},
  );
  const [columnPinning, setColumnPinning] = useLocalStorage(
    "column-pinning-alloted-items-1",
    {},
  );

  const [autoResetPageIndex] = useSkipper();

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
      <Page title="BIS Disposal Register">
        <PageSpinner />
      </Page>
    );
  }

  return (
    <Page title="BIS Disposal Register">
      <Toolbar
        filters={filters}
        onChange={handleFilterChange}
        onSearch={handleSearch}
        departments={departments}
        specificPurposes={specificPurposes}
        products={products}
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
              {/* ISO Letterhead Table */}
              <div className="p-4 overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300 text-sm text-gray-800 dark:border-dark-500 dark:text-dark-50">
                  <tbody>
                    <tr>
                      <td rowSpan="6" className="w-1/5 border border-gray-300 p-2 align-top dark:border-dark-500">
                        <img src={companyInfo?.branding?.logo || "/images/letterhead.jpg"} alt="Letterhead" className="w-[150px] mx-auto" />
                        <div className="text-center text-[10px] font-bold mt-2">{companyInfo?.company?.name || "Kailtech Test And Research Centre Pvt. Ltd."}</div>
                      </td>
                      <th rowSpan="6" className="w-1/2 border border-gray-300 p-2 text-center text-lg font-bold dark:border-dark-500">
                        BIS Disposal Register
                      </th>
                      <th className="w-[15%] border border-gray-300 p-2 text-left dark:border-dark-500">QF. No.</th>
                      <td className="border border-gray-300 p-2 dark:border-dark-500">{companyInfo?.company?.short_name || "KTRC"}/QF/0704/03</td>
                    </tr>
                    <tr>
                      <th className="w-[15%] border border-gray-300 p-2 text-left dark:border-dark-500">Issue No.</th>
                      <td className="border border-gray-300 p-2 dark:border-dark-500">01</td>
                    </tr>
                    <tr>
                      <th className="w-[15%] border border-gray-300 p-2 text-left dark:border-dark-500">Issue Date</th>
                      <td className="border border-gray-300 p-2 dark:border-dark-500">01/06/2019</td>
                    </tr>
                    <tr>
                      <th className="w-[15%] border border-gray-300 p-2 text-left dark:border-dark-500">Revision No.</th>
                      <td className="border border-gray-300 p-2 dark:border-dark-500">-</td>
                    </tr>
                    <tr>
                      <th className="w-[15%] border border-gray-300 p-2 text-left dark:border-dark-500">Revision Date</th>
                      <td className="border border-gray-300 p-2 dark:border-dark-500">-</td>
                    </tr>
                    <tr>
                      <th className="w-[15%] border border-gray-300 p-2 text-left dark:border-dark-500">Page</th>
                      <td className="border border-gray-300 p-2 dark:border-dark-500">1 of 1</td>
                    </tr>
                  </tbody>
                </table>
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
                    {tableData.length === 0 && !loading && (
                      <Tr>
                        <Td colSpan={visibleColumns.length} className="py-10 text-center text-gray-500">
                          No BIS disposal items found.
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

              {/* Signature Block */}
              <div className="grid grid-cols-3 gap-4 p-4 text-sm text-gray-800 dark:text-dark-50 border-t border-gray-200 dark:border-dark-500">
                <div>
                  <p className="font-semibold mb-4">Prepared by</p>
                  <p>Sr. Engineer</p>
                  <p>Name:</p>
                  <p className="mt-4">Sign:</p>
                </div>
                <div>
                  <p className="font-semibold mb-4">Reviewed by</p>
                  <p>DTM</p>
                  <p>Name:</p>
                  <p className="mt-4">Sign:</p>
                </div>
                <div>
                  <p className="font-semibold mb-4">Approved by</p>
                  <p>TM</p>
                  <p>Name:</p>
                  <p className="mt-4">Sign:</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </Page>
  );
}
