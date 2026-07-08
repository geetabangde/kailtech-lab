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
import { useLockScrollbar, useDidUpdate, useLocalStorage } from "hooks";
import { fuzzyFilter } from "utils/react-table/fuzzyFilter";
import { useSkipper } from "utils/react-table/useSkipper";
import { PaginationSection } from "components/shared/table/PaginationSection";
import { useThemeContext } from "app/contexts/theme/context";
import { getUserAgentBrowser } from "utils/dom/getUserAgentBrowser";

const isSafari = getUserAgentBrowser() === "Safari";

export default function ReceivedRegister() {
  const { cardSkin } = useThemeContext();
  const navigate = useNavigate();
  const permissions = JSON.parse(localStorage.getItem("userPermissions") || "[]");

  useEffect(() => {
    // Permission 160 as per PHP code: if(!in_array(160, $permissions)){ header("location:index.php"); }
    if (!permissions.includes(160)) {
      navigate("/dashboards");
    }
  }, [navigate, permissions]);

  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    startdate: "",
    enddate: "",
    rdept: "",
  });

  const [departments, setDepartments] = useState([]);

  // Fetch departments dropdown data
  const fetchDepartments = async () => {
    try {
      const res = await axios.get("/register/get-lab-by-vertical/2");
      setDepartments(res.data?.data || []);
    } catch (err) {
      console.error("Error fetching departments:", err);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  // Fetch received register data using PHP endpoint
  const fetchReceivedData = async () => {
    try {
      setLoading(true);
      setSearched(true);

      const apiParams = {};
      if (filters.startdate) apiParams.startdate = filters.startdate;
      if (filters.enddate) apiParams.enddate = filters.enddate;
      if (filters.rdept) apiParams.rdept = filters.rdept;

      const res = await axios.get("/register/recived-register", { params: apiParams });

      let rows = res.data?.data || [];

      rows = rows.map((row, index) => ({
        sno: index + 1,
        lrn: row.lrn || "",
        nature_of_sample: row.natureofsample || "",
        date_of_sample: row.date || "",
        quantity: row.remainingqtytodispatch || "",
        reporting_date: row.reportdate || "",
        disposal_date: row.disposal_date || "", // Not in new JSON yet, mapping gracefully
        checked_by: row.addedBy || "", // Assuming addedBy is Checked By
        dispatch_qty: row.purpose8Qty || "", // Assuming purpose8Qty or similar is dispatch
        disposed_qty: row.purpose10Qty || "",
        remark: row.remark || "",
        actions: "", // Actions to be implemented
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

  const receivedColumns = [
    {
      accessorKey: "sno",
      header: "S.No",
      cell: (info) => info.getValue(),
    },
    {
      accessorKey: "lrn",
      header: "LRN",
      cell: (info) => info.getValue(),
    },
    {
      accessorKey: "nature_of_sample",
      header: "Nature Of Sample",
      cell: (info) => info.getValue(),
    },
    {
      accessorKey: "date_of_sample",
      header: "Date Of Sample",
      cell: (info) => info.getValue(),
    },
    {
      accessorKey: "quantity",
      header: "Quantity",
      cell: (info) => info.getValue(),
    },
    {
      accessorKey: "reporting_date",
      header: "Reporting Date",
      cell: (info) => info.getValue(),
    },
    {
      accessorKey: "disposal_date",
      header: "Disposal Date",
      cell: (info) => info.getValue(),
    },
    {
      accessorKey: "checked_by",
      header: "Checked By",
      cell: (info) => info.getValue(),
    },
    {
      accessorKey: "dispatch_qty",
      header: "Dispatch Qty",
      cell: (info) => info.getValue(),
    },
    {
      accessorKey: "disposed_qty",
      header: "Disposed Qty",
      cell: (info) => info.getValue(),
    },
    {
      accessorKey: "remark",
      header: "Remark",
      cell: (info) => info.getValue(),
    },
    {
      accessorKey: "actions",
      header: "Actions",
      cell: (info) => info.getValue(),
    },
  ];

  const table = useReactTable({
    data: tableData,
    columns: receivedColumns,
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
      <Page title="Alloted Items">
        <PageSpinner />
      </Page>
    );
  }

  return (
    <Page title="Alloted Items">
      <Toolbar
        filters={filters}
        onChange={handleFilterChange}
        onSearch={handleSearch}
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
                          No received items found.
                        </Td>
                      </Tr>
                    )}
                    {!searched && (
                      <Tr>
                        <Td colSpan={visibleColumns.length} className="py-10 text-center text-gray-500">
                          Use the filters above and click Search to view the Received Register.
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
