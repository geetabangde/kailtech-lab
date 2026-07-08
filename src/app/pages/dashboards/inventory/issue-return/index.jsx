// Import Dependencies
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import clsx from "clsx";
import { useState, useEffect, useCallback } from "react";
import axios from "utils/axios";
import { Search, RotateCcw } from "lucide-react";

// Local Imports
import { Table, THead, TBody, Th, Tr, Td, Button, Card, ReactSelect as Select } from "components/ui";
import { TableSortIcon } from "components/shared/table/TableSortIcon";
import { Page } from "components/shared/Page";
import { useLockScrollbar, useLocalStorage } from "hooks";
import { fuzzyFilter } from "utils/react-table/fuzzyFilter";
import { useSkipper } from "utils/react-table/useSkipper";
import { columns } from "./columns";
import { PaginationSection } from "components/shared/table/PaginationSection";
import { TableLoadingRow } from "components/shared/table/TableLoadingRow";
import { TableConfig } from "./TableConfig";

// ----------------------------------------------------------------------

function usePermissions() {
  const p = localStorage.getItem("userPermissions");
  try {
    return JSON.parse(p) || [];
  } catch {
    return p?.split(",").map(Number) || [];
  }
}

function getResponseArray(payload, keys) {
  for (const key of keys) {
    const value = payload?.[key] ?? payload?.data?.[key];
    if (Array.isArray(value)) return value;
  }

  return [];
}

const createdByCache = new Map();

async function enrichReturnByNames(rows) {
  const returnByIds = [
    ...new Set(
      rows
        .filter((row) => Number(row.status) === 1 && row.returnby)
        .map((row) => String(row.returnby)),
    ),
  ];

  await Promise.all(
    returnByIds.map(async (id) => {
      if (createdByCache.has(id)) return;

      try {
        const response = await axios.get(`/get-created-by/${id}`);
        createdByCache.set(id, response.data || null);
      } catch (err) {
        console.error(`Error fetching return by user ${id}:`, err);
        createdByCache.set(id, null);
      }
    }),
  );

  return rows.map((row) => {
    const returnByUser = row.returnby ? createdByCache.get(String(row.returnby)) : null;

    return {
      ...row,
      returnby_name:
        row.returnby_name ||
        row.returnbyname ||
        returnByUser?.name ||
        "",
      returnby_employee_id:
        row.returnby_employee_id ||
        returnByUser?.employee_id ||
        "",
    };
  });
}

export default function IssueReturn() {
  const permissions = usePermissions();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [departments, setDepartments] = useState([]);
  
  const [tableSettings, setTableSettings] = useState({
    enableFullScreen: false,
    enableRowDense: false,
  });

  const fetchCustomers = useCallback(async () => {
    try {
      const response = await axios.get("/people/get-all-customers");
      const payload = response.data || {};
      if (payload.data && Array.isArray(payload.data)) {
        setCustomers(payload.data);
      }
    } catch (err) {
      console.error("Error fetching customers:", err);
    }
  }, []);

  const fetchDepartments = useCallback(async () => {
    try {
      const response = await axios.get("/master/list-lab");
      const payload = response.data || {};
      if (payload.data && Array.isArray(payload.data)) {
        setDepartments(payload.data);
      }
    } catch (err) {
      console.error("Error fetching departments:", err);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
    fetchDepartments();
  }, [fetchCustomers, fetchDepartments]);

  // Filter States
  const [filters, setFilters] = useState({
    var3: "", // Customer
    department: "all",
    var1: "All", // Search in
    var2: "", // Search term
    start: "",
    end: "",
    category: "all",
  });

  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState([{ id: "added_on", desc: true }]);

  const [columnVisibility, setColumnVisibility] = useLocalStorage(
    "column-visibility-issue-return",
    {},
  );
  const [columnPinning, setColumnPinning] = useLocalStorage(
    "column-pinning-issue-return",
    {},
  );
  const [autoResetPageIndex, skipAutoResetPageIndex] = useSkipper();
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 25,
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get("/inventory/get-issued-item", {
        params: filters
      });

      const payload = response.data || {};
      const hasExplicitFailure = payload.status === false || payload.status === "false" || payload.success === false;
      const issuedItems = Array.isArray(payload)
        ? payload
        : Array.isArray(payload.data)
        ? payload.data
        : getResponseArray(payload, ["issued_items", "issuedItems", "items", "records", "list", "data"]);

      // Departments are fetched independently in fetchDepartments

      if (!hasExplicitFailure && Array.isArray(issuedItems)) {
        const rowsWithReturnByNames = await enrichReturnByNames(issuedItems);
        setData(rowsWithReturnByNames);
      } else {
        setData([]);
      }
    } catch (err) {
      console.error("Error fetching issue return data:", err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const table = useReactTable({
    data: data,
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
        setData((old) =>
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
      setTableSettings,
    },
    filterFns: {
      fuzzy: fuzzyFilter,
    },
    getCoreRowModel: getCoreRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    getFilteredRowModel: getFilteredRowModel(),
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

  const handleReset = () => {
    setFilters({
      var3: "",
      department: "all",
      var1: "All",
      var2: "",
      start: "",
      end: "",
      category: "all",
    });
  };

  // Permission Check (PHP: 174)
  if (!permissions.includes(174)) {
    return (
      <Page title="Issued Item List">
        <div className="flex h-60 items-center justify-center rounded-xl border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-sm font-medium text-red-600 dark:text-red-400">
            Access Denied - Permission 174 required
          </p>
        </div>
      </Page>
    );
  }

  return (
    <Page title="Issued Item List">
      <div className="transition-content w-full pb-5 space-y-6">
        {/* Filters Card */}
        <Card className="p-4 sm:p-5 border-none shadow-soft dark:bg-dark-700">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Customer</label>
              <Select
                name="customer"
                value={String(filters.var3)}
                options={customers.map(c => ({ value: String(c.id), label: c.name.replace('M/s,', '').trim() }))}
                onChange={(val) => setFilters({ ...filters, var3: val || "" })}
                placeholder="Select Customer"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Department</label>
              <Select
                name="department"
                value={String(filters.department)}
                options={[{ value: "all", label: "All" }, ...departments.map(d => ({ value: String(d.id), label: d.name }))]}
                onChange={(val) => setFilters({ ...filters, department: val || "all" })}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Search in</label>
              <Select
                name="searchIn"
                value={filters.var1}
                options={[
                  { value: "All", label: "All" },
                  { value: "adminname", label: "Person Name" },
                  { value: "admincode", label: "Employee Code" },
                  { value: "materialname", label: "Instrument name" },
                  { value: "idno", label: "Instrument Id" },
                  { value: "instserial", label: "Instrument Serial" },
                  { value: "gatepassno", label: "gatepass no" },
                ]}
                onChange={(val) => setFilters({ ...filters, var1: val || "All" })}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Search Term</label>
              <input
                type="text"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-primary-500 focus:outline-none dark:border-dark-600 dark:bg-dark-800 dark:text-dark-100 h-10"
                value={filters.var2}
                onChange={(e) => setFilters({ ...filters, var2: e.target.value })}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Start Date</label>
              <input
                type="date"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-primary-500 focus:outline-none dark:border-dark-600 dark:bg-dark-800 dark:text-dark-100 h-10"
                value={filters.start}
                onChange={(e) => setFilters({ ...filters, start: e.target.value })}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">End Date</label>
              <input
                type="date"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-primary-500 focus:outline-none dark:border-dark-600 dark:bg-dark-800 dark:text-dark-100 h-10"
                value={filters.end}
                onChange={(e) => setFilters({ ...filters, end: e.target.value })}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
              <Select
                name="category"
                value={filters.category}
                options={[
                  { value: "all", label: "All" },
                  { value: "asset", label: "Asset" },
                  { value: "consumable", label: "Consumable" },
                  { value: "general", label: "General" },
                  { value: "master", label: "Master" },
                  { value: "misc", label: "Misc" },
                ]}
                onChange={(val) => setFilters({ ...filters, category: val || "all" })}
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <TableConfig table={table} />
            <Button
              color="secondary"
              variant="soft"
              onClick={handleReset}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" /> Reset
            </Button>
            <Button
              color="info"
              onClick={fetchData}
              className="flex items-center gap-2"
            >
              <Search className="h-4 w-4" /> Go
            </Button>
          </div>
        </Card>

        {/* Data Table Card */}
        <div
          className={clsx(
            "flex h-full w-full flex-col",
            tableSettings.enableFullScreen &&
              "fixed inset-0 z-61 bg-white pt-3 dark:bg-dark-900",
          )}
        >
          <Card className="flex flex-col border-none shadow-soft dark:bg-dark-700">
            <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-dark-500 sm:p-5">
              <h3 className="text-lg font-bold text-gray-800 dark:text-dark-100">
                Issued Item List
              </h3>
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
                            "bg-gray-50 text-xs font-bold uppercase text-gray-600 dark:bg-dark-800 dark:text-dark-200 align-top",
                            header.column.getCanPin() && [
                              header.column.getIsPinned() === "left" &&
                              "sticky z-2 ltr:left-0 rtl:right-0",
                              header.column.getIsPinned() === "right" &&
                              "sticky z-2 ltr:right-0 rtl:left-0",
                            ]
                          )}
                        >
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
                            flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )
                          )}
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
                        className="border-b border-gray-100 last:border-0 dark:border-dark-600"
                      >
                        {row.getVisibleCells().map((cell) => (
                          <Td
                            key={cell.id}
                            className={clsx(
                              "text-sm bg-white dark:bg-dark-700",
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
                      <Td colSpan={columns.length} className="h-24 text-center text-gray-500">
                        No records found
                      </Td>
                    </Tr>
                  )}
                </TBody>
              </Table>
            </div>

            <div className="border-t border-gray-100 p-4 dark:border-dark-600 sm:p-5">
              <PaginationSection table={table} />
            </div>
          </Card>
        </div>
      </div>
    </Page>
  );
}
