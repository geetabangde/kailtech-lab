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
export { columns } from "./columns";
export { Toolbar } from "./Toolbar";
export { RowActions } from "./RowActions";
export { TableConfig } from "./TableConfig";

// Local Imports
import { Table, Card, THead, TBody, Th, Tr, Td, Input } from "components/ui";
import { TableSortIcon } from "components/shared/table/TableSortIcon";
import { Page } from "components/shared/Page";
import { useLockScrollbar, useDidUpdate, useLocalStorage } from "hooks";
import { fuzzyFilter } from "utils/react-table/fuzzyFilter";
import { useSkipper } from "utils/react-table/useSkipper";
import { Toolbar } from "./Toolbar";
import { columns } from "./columns";
import { PaginationSection } from "components/shared/table/PaginationSection";
import { SelectedRowsActions } from "components/shared/table/SelectedRowsActions";
import { useThemeContext } from "app/contexts/theme/context";
import { getUserAgentBrowser } from "utils/dom/getUserAgentBrowser";

// ----------------------------------------------------------------------

const isSafari = getUserAgentBrowser() === "Safari";

export default function TrfEntryList() {
  const { cardSkin } = useThemeContext();
  const navigate = useNavigate();
  const permissions = JSON.parse(localStorage.getItem("userPermissions") || "[]");

  useEffect(() => {
    if (!permissions.includes(200)) {
      navigate("/dashboards");
    }
  }, [navigate, permissions]);

  const [trfEntries, setTrfEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [filters, setFilters] = useState({
    searchByFromdate: "",
    searchByTodate: "",
    ctype: "",
    specificpurpose: "",
    searchstatus: "",
  });

  // ✅ Fetch TRF entries from API
  useEffect(() => {
    fetchTrfEntries();
  }, [filters]);

  // fetchTrfEntries function में:
  const fetchTrfEntries = async () => {
    try {
      setLoading(true);

      // Build query parameters
      const params = new URLSearchParams();
      if (filters.searchByFromdate)
        params.append("searchByFromdate", filters.searchByFromdate);
      if (filters.searchByTodate)
        params.append("searchByTodate", filters.searchByTodate);
      if (filters.ctype) params.append("ctype", filters.ctype);
      if (filters.specificpurpose)
        params.append("specificpurpose", filters.specificpurpose);
      if (filters.searchstatus)
        params.append("searchstatus", filters.searchstatus);

      const response = await axios.get(
        `/testing/get-testing-trflist?${params.toString()}`,
      );

      console.log("API response:", response.data);

      let data = [];

      // Handle response structure
      if (response.data && Array.isArray(response.data)) {
        data = response.data;
      } else if (response.data.status && Array.isArray(response.data.data)) {
        data = response.data.data;
      } else {
        console.warn("Unexpected response structure:", response.data);
        data = [];
      }

      // ✅ Customer Types fetch करें
      let customerTypes = [];
      try {
        const customerTypesResponse = await axios.get(
          "/people/get-customer-type-list",
        );
        if (
          customerTypesResponse.data?.Data &&
          Array.isArray(customerTypesResponse.data.Data)
        ) {
          customerTypes = customerTypesResponse.data.Data;
        }
      } catch (error) {
        console.error("Error fetching customer types:", error);
      }

      // ✅ Specific Purposes fetch करें
      let specificPurposes = [];
      try {
        const specificPurposesResponse = await axios.get(
          "/people/get-specific-purpose-list",
        );
        if (
          specificPurposesResponse.data?.data &&
          Array.isArray(specificPurposesResponse.data.data)
        ) {
          specificPurposes = specificPurposesResponse.data.data;
        }
      } catch (error) {
        console.error("Error fetching specific purposes:", error);
      }

      // ✅ Map IDs to names
      const processedData = data.map((entry) => {
        // Find customer type name
        const customerTypeObj = customerTypes.find(
          (type) => type.id === entry.ctype,
        );
        const customerTypeName = customerTypeObj
          ? customerTypeObj.name
          : `Type ${entry.ctype}`;

        // Find specific purpose name
        const specificPurposeObj = specificPurposes.find(
          (purpose) => purpose.id === entry.specificpurpose,
        );
        const specificPurposeName = specificPurposeObj
          ? specificPurposeObj.name
          : `Purpose ${entry.specificpurpose}`;

        // Format products, grades, sizes, brn, lrn arrays
        const formatArray = (arr) => {
          if (!arr || !Array.isArray(arr) || arr.length === 0) return "-";
          return arr.join(", ");
        };

        return {
          ...entry,
          // Add new fields for display
          customer_type_display: customerTypeName,
          specific_purpose_display: specificPurposeName,

          // Format existing fields
          products_display: formatArray(entry.products),
          grades_display: formatArray(entry.grades),
          sizes_display: formatArray(entry.sizes),
          brn_nos_display: formatArray(entry.brn),
          lrn_nos_display: formatArray(entry.lrn),

          // TRF Entry No (if not present, use ID)
          trf_entry_no: entry.trf_entry_no || `TRF-${entry.id}`,

          // Original fields kept for reference
          customer_type_id: entry.ctype,
          specific_purpose_id: entry.specificpurpose,
        };
      });

      console.log("Processed data:", processedData);
      setTrfEntries(processedData);
    } catch (err) {
      console.error("Error fetching TRF entry list:", err);
      setTrfEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const [tableSettings, setTableSettings] = useState({
    enableFullScreen: false,
    enableRowDense: false,
    enableSorting: true,
    enableColumnFilters: true,
  });

  const [globalFilter, setGlobalFilter] = useState("");

  const [sorting, setSorting] = useState([{ id: "trf_entry_no", desc: true }]);

  const [columnVisibility, setColumnVisibility] = useLocalStorage(
    "column-visibility-trf-entries",
    {},
  );

  const [columnPinning, setColumnPinning] = useLocalStorage(
    "column-pinning-trf-entries",
    { right: ["actions"] },
  
  );

  const [columnFilters, setColumnFilters] = useState([]);

  const [autoResetPageIndex, skipAutoResetPageIndex] = useSkipper();

  const statusFilterOptions = [
    { value: "", label: "All Status" },
    { value: "0", label: "Add Items Pending" },
    { value: "1", label: "Sample Review" },
    { value: "2", label: "Technical Acceptance" },
    { value: "3", label: "Allot Sample" },
    { value: "4", label: "Assign Chemist" },
    { value: "5", label: "Perform Testing" },
    { value: "6", label: "Draft Report" },
    { value: "7", label: "HOD Review" },
    { value: "8", label: "QA Review" },
    { value: "9", label: "Generate ULR" },
    { value: "10", label: "Final Report Ready" },
    { value: "98", label: "Pending For Approvals" },
    { value: "99", label: "Cancelled" },
  ];

  const table = useReactTable({
    data: trfEntries,
    columns: columns,
    state: {
      globalFilter,
      sorting,
      columnVisibility,
      columnPinning,
      tableSettings,
      columnFilters,
    },
    meta: {
      updateData: (rowIndex, columnId, value) => {
        skipAutoResetPageIndex();
        setTrfEntries((old) =>
          old.map((row, index) => {
            if (index === rowIndex) {
              return {
                ...old[rowIndex],
                [columnId]: value,
              };
            }
            return row;
          }),
        );
      },
      deleteRow: (row) => {
        skipAutoResetPageIndex();
        setTrfEntries((old) =>
          old.filter((oldRow) => oldRow.id !== row.original.id),
        );
      },
      deleteRows: (rows) => {
        skipAutoResetPageIndex();
        const rowIds = rows.map((row) => row.original.id);
        setTrfEntries((old) => old.filter((row) => !rowIds.includes(row.id)));
      },
      setTableSettings,
      refreshData: fetchTrfEntries,
      filters,
      setFilters,
    },
    filterFns: {
      fuzzy: fuzzyFilter,
      statusExact: (row, columnId, filterValue) => {
        if (filterValue === undefined || filterValue === "") return true;
        const rowValue = row.getValue(columnId);
        return String(rowValue) === String(filterValue);
      },
      textContains: (row, columnId, filterValue) => {
        if (filterValue === undefined || filterValue === "") return true;
        const rowValue = row.getValue(columnId);
        return String(rowValue ?? "")
          .toLowerCase()
          .includes(String(filterValue).toLowerCase());
      },
      alwaysTrue: () => true,
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
    getPaginationRowModel: getPaginationRowModel(),
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnPinningChange: setColumnPinning,
    autoResetPageIndex,
  });

  const renderColumnFilter = (column) => {
    if (!column.getCanFilter()) return null;

    const headerLabel =
      typeof column.columnDef.header === "string"
        ? column.columnDef.header
        : column.id.replace(/_/g, " ");
    const value = column.getFilterValue() ?? "";

    if (column.id === "status") {
      return (
        <select
          value={value ?? ""}
          onChange={(e) =>
            column.setFilterValue(e.target.value || undefined)
          }
          className="h-8 w-full rounded-md border border-gray-300 bg-white px-2 text-xs text-gray-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/40 dark:border-dark-500 dark:bg-dark-700 dark:text-gray-100"
        >
          {statusFilterOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      );
    }

    if (column.id === "actions") {
      return (
        <Input
          disabled
          value="Not filterable"
          classNames={{
            input:
              "h-8 text-xs bg-gray-100 text-gray-400 dark:bg-dark-700 dark:text-dark-300",
            root: "w-full",
          }}
        />
      );
    }

    const inputType = column.id === "date" ? "date" : "text";

    return (
      <Input
        type={inputType}
        value={value ?? ""}
        onChange={(e) =>
          column.setFilterValue(e.target.value || undefined)
        }
        placeholder={`Search ${headerLabel}`}
        classNames={{
          input:
            "h-8 text-xs ring-primary-500/40 focus:ring-2 placeholder:text-gray-400",
          root: "w-full",
        }}
      />
    );
  };

  useDidUpdate(() => table.resetRowSelection(), [trfEntries]);

  useLockScrollbar(tableSettings.enableFullScreen);

  // ✅ Loading UI
  if (loading) {
    return (
      <Page title="TRF Entry List">
        <div className="flex h-[60vh] items-center justify-center text-gray-600">
          <svg
            className="mr-2 h-6 w-6 animate-spin text-blue-600"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z"
            ></path>
          </svg>
          Loading TRF Entries...
        </div>
      </Page>
    );
  }

  return (
    <Page title="TRF Entry List">
      <div className="transition-content w-full pb-5">
        <div
          className={clsx(
            "flex h-full w-full flex-col",
            tableSettings.enableFullScreen &&
              "dark:bg-dark-900 fixed inset-0 z-61 bg-white pt-3",
          )}
        >
          <Toolbar table={table} />
          <div
            className={clsx(
              "transition-content flex grow flex-col pt-3",
              tableSettings.enableFullScreen
                ? "overflow-hidden"
                : "px-[var(--margin-x)]",
            )}
          >
            <Card
              className={clsx(
                "relative flex grow flex-col",
                tableSettings.enableFullScreen && "overflow-hidden",
              )}
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
                              "dark:bg-dark-800 dark:text-dark-100 bg-gray-200 font-semibold text-gray-800 uppercase first:ltr:rounded-tl-lg last:ltr:rounded-tr-lg first:rtl:rounded-tr-lg last:rtl:rounded-tl-lg",
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
                                className="flex cursor-pointer items-center space-x-3 select-none"
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
                          </Th>
                        ))}
                      </Tr>
                    ))}
                    {tableSettings.enableColumnFilters && (
                      <Tr>
                        {table.getVisibleLeafColumns().map((column) => (
                          <Th
                            key={`filter-${column.id}`}
                            className={clsx(
                              "bg-gray-100 text-gray-700 dark:bg-dark-800 dark:text-dark-50 font-medium",
                              column.getCanPin() && [
                                column.getIsPinned() === "left" &&
                                  "sticky z-2 ltr:left-0 rtl:right-0",
                                column.getIsPinned() === "right" &&
                                  "sticky z-2 ltr:right-0 rtl:left-0",
                              ],
                            )}
                          >
                            {renderColumnFilter(column)}
                          </Th>
                        ))}
                      </Tr>
                    )}
                  </THead>
                  <TBody>
                    {table.getRowModel().rows.map((row) => {
                      return (
                        <Tr
                          key={row.id}
                          className={clsx(
                            "dark:border-b-dark-500 relative border-y border-transparent border-b-gray-200",
                            row.getIsSelected() &&
                              !isSafari &&
                              "row-selected after:bg-primary-500/10 ltr:after:border-l-primary-500 rtl:after:border-r-primary-500 after:pointer-events-none after:absolute after:inset-0 after:z-2 after:h-full after:w-full after:border-3 after:border-transparent",
                          )}
                        >
                          {row.getVisibleCells().map((cell) => {
                            return (
                              <Td
                                key={cell.id}
                                className={clsx(
                                  "relative bg-white",
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
                                      "dark:border-dark-500 pointer-events-none absolute inset-0 border-gray-200",
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
                      );
                    })}
                  </TBody>
                </Table>
              </div>
              <SelectedRowsActions table={table} title="TRF Entry List" showDelete={false} />
              {table.getCoreRowModel().rows.length > 0 && (
                <div
                  className={clsx(
                    "px-4 pb-4 sm:px-5 sm:pt-4",
                    tableSettings.enableFullScreen &&
                      "dark:bg-dark-800 bg-gray-50",
                    !(
                      table.getIsSomeRowsSelected() ||
                      table.getIsAllRowsSelected()
                    ) && "pt-4",
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
