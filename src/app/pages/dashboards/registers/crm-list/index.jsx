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
import { FormatHeader } from "components/shared/FormatHeader";
import { Toolbar } from "./Toolbar";
import { useLockScrollbar, useDidUpdate, useLocalStorage } from "hooks";
import { fuzzyFilter } from "utils/react-table/fuzzyFilter";
import { useSkipper } from "utils/react-table/useSkipper";
import { PaginationSection } from "components/shared/table/PaginationSection";
import { useThemeContext } from "app/contexts/theme/context";
import { getUserAgentBrowser } from "utils/dom/getUserAgentBrowser";

const isSafari = getUserAgentBrowser() === "Safari";

export default function StandardSolutionsList() {
  const { cardSkin } = useThemeContext();
  const navigate = useNavigate();
  const permissions = JSON.parse(localStorage.getItem("userPermissions") || "[]");

  useEffect(() => {
    // Permission 356 as per PHP code: if(!in_array(356, $permissions)){ header("location:index.php"); }
    if (!permissions.includes(356)) {
      navigate("/dashboards");
    }
  }, [navigate, permissions]);

  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reportInfo, setReportInfo] = useState(null);
  const [searched, setSearched] = useState(false);
  
  // Filters matching PHP code
  const [filters, setFilters] = useState({
    category: "",
    department: [],
  });
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);

  // Fetch categories dropdown data
  const fetchCategories = async () => {
    try {
      const res = await axios.get("/inventory/category-list");
      setCategories(res.data?.data || []);
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  // Fetch departments dropdown data
  const fetchDepartments = async () => {
    try {
      const res = await axios.get("/master/list-lab", {
        params: { status: 1 }
      });
      setDepartments(res.data?.data || []);
    } catch (err) {
      console.error("Error fetching departments:", err);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchDepartments();
  }, []);

  // Fetch CRM list data using standard API endpoint
  const fetchCrmData = async () => {
    try {
      setLoading(true);
      setSearched(true);
      
      // Use CRM list endpoint
      const res = await axios.get("/register/crmlist", { params: filters });
      
      let rows = res.data?.data || [];
      setReportInfo(res.data?.report_info || null);
      
      // Map to table structure: Sr. No, Name of Reference Material, Code No., Batch no, Source, Valid UpTo, Traceability
      rows = rows.map((row, index) => ({
        sno: index + 1,
        name: row.reference_material_name || "",
        code_no: row.code_no || "",
        batch_no: row.batch_no || "",
        source: row.source || "",
        valid_up_to: row.valid_upto || "",
        traceability: row.traceability || "",
        id: row.id || "",
        instrumentlocation: row.instrumentlocation || "",
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
    fetchCrmData();
  };

  const handleExport = (e) => {
    e?.preventDefault?.();
    const params = new URLSearchParams();
    if (filters.category) {
      params.append('category', filters.category);
    }
    if (filters.department && filters.department.length > 0) {
      filters.department.forEach(dept => {
        params.append('department[]', dept);
      });
    }
    navigate(`export?${params.toString()}`);
  };

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const [tableSettings, setTableSettings] = useState({
    enableFullScreen: false,
    enableRowDense: false,
  });

  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState([{ id: "sno", desc: false }]); // PHP: order by Sr. No

  const [columnVisibility, setColumnVisibility] = useLocalStorage(
    "column-visibility-alloted-items-1",
    {},
  );
  const [columnPinning, setColumnPinning] = useLocalStorage(
    "column-pinning-alloted-items-1",
    {},
  );

  const [autoResetPageIndex] = useSkipper();

  const safeRender = (val) => {
    if (val === undefined || val === null || val === "" || val === "0000-00-00" || val === "0000-00-00 00:00") return "-";
    return val;
  };

  // Define columns matching PHP CRM list table exactly
  const crmColumns = [
    {
      accessorKey: "sno",
      id: "sno",
      header: "Sr. No",
      cell: (info) => safeRender(info.getValue()),
    },
    {
      accessorKey: "name",
      id: "name",
      header: "Name of Reference Material",
      cell: (info) => safeRender(info.getValue()),
    },
    {
      accessorKey: "code_no",
      id: "code_no",
      header: "Code No.",
      cell: (info) => safeRender(info.getValue()),
    },
    {
      accessorKey: "batch_no",
      id: "batch_no",
      header: "Batch no",
      cell: (info) => safeRender(info.getValue()),
    },
    {
      accessorKey: "source",
      id: "source",
      header: "Source",
      cell: (info) => safeRender(info.getValue()),
    },
    {
      accessorKey: "valid_up_to",
      id: "valid_up_to",
      header: "Valid UpTo",
      cell: (info) => safeRender(info.getValue()),
    },
    {
      accessorKey: "traceability",
      id: "traceability",
      header: "Traceability",
      cell: (info) => safeRender(info.getValue()),
    },
    {
      id: "actions",
      header: "Action",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <a
            href={`/dashboards/registers/consumablelogcrmwise/${row.original.id}?hakuna=${row.original.id}&matata=${row.original.instrumentlocation || ""}&batchno=${encodeURIComponent(row.original.batch_no || "")}`}
            className="inline-flex items-center justify-center px-3 py-1 bg-cyan-500 hover:bg-cyan-600 text-white rounded text-xs font-semibold transition-colors shadow-xs"
          >
            View Logbook 1
          </a>
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data: tableData,
    columns: crmColumns,
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
      <Page title="Standard Solutions List">
        <PageSpinner />
      </Page>
    );
  }

  return (
    <Page title="Standard Solutions List">
      <Toolbar
        filters={filters}
        onChange={handleFilterChange}
        onSearch={handleSearch}
        onExport={handleExport}
        categories={categories}
        departments={departments}
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
              {searched ? (
                <>
                  <div className="p-4 pb-0 bg-white dark:bg-dark-900">
                    <FormatHeader
                      title={reportInfo?.title || "Standard Solutions List"}
                      qfNo="KTRC/QF/0604/19"
                      issueNo="01"
                      issueDate="01/06/2019"
                      revisionNo="01"
                      revisionDate="20/08/2021"
                    />
                    <div className="flex justify-between text-sm font-medium text-gray-700 dark:text-gray-300 mt-2 mb-4">
                      <div>Department :- {reportInfo?.department || "-"}</div>
                      <div>Date :- {reportInfo?.report_date || new Date().toLocaleDateString("en-GB")}</div>
                    </div>
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
                              No CRM items found for the selected criteria.
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
                </>
              ) : (
                <div className="py-10 text-center text-gray-500">
                  Select a category or department/lab and click Search to view the Standard Solutions List.
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </Page>
  );
}
