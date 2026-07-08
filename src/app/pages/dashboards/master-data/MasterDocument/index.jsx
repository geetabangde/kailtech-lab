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
import { SelectedRowsActions } from "components/shared/table/SelectedRowsActions";
import { useThemeContext } from "app/contexts/theme/context";
import { getUserAgentBrowser } from "utils/dom/getUserAgentBrowser";

const isSafari = getUserAgentBrowser() === "Safari";

// PHP: if (!in_array(70, $permissions)) { header("location:index.php"); }
function usePermissions() {
  const p = localStorage.getItem("userPermissions");
  try {
    return JSON.parse(p) || [];
  } catch {
    return p?.split(",").map(Number) || [];
  }
}

export default function ViewMasterDocument() {
  const { cardSkin } = useThemeContext();
  const permissions = usePermissions();

  // All hooks must be called before any conditional returns
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filter states - matching PHP logic
  const [docType, setDocType] = useState("active");
  const [searchField, setSearchField] = useState("All");
  const [searchValue, setSearchValue] = useState("");

  const [tableSettings, setTableSettings] = useState({
    enableFullScreen: false,
    enableRowDense: false,
    enableSorting: true,
    enableColumnFilters: true,
  });

  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState([{ id: "id", desc: true }]);

  const [columnVisibility, setColumnVisibility] = useLocalStorage(
    "column-visibility-master-document",
    {},
  );

  const [columnPinning, setColumnPinning] = useLocalStorage(
    "column-pinning-master-document",
    {},
  );

  const [autoResetPageIndex, skipAutoResetPageIndex] = useSkipper();

  // Fetch documents on component mount and when docType changes
  useEffect(() => {
    fetchDocuments();
  }, [docType]);

  // Fetch documents from API
  const fetchDocuments = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        type: docType,
      };

      // Add search parameters if search value is provided
      if (searchValue && searchValue.trim() !== "") {
        params.fieldType = searchField;
        params.fieldVal = searchValue.trim();
      }

      const response = await axios.get("/master/view-document-module-list", {
        params,
      });

      if (response.data.status) {
        setDocuments(response.data.data || []);
      } else {
        setError(response.data.message || "Failed to fetch documents");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Error fetching documents");
      console.error("Error fetching documents:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch documents on component mount and when docType changes
  useEffect(() => {
    fetchDocuments();
  }, [docType]);

  // Handle search button click
  const handleSearch = () => {
    fetchDocuments();
  };

  // Handle filter reset
  const handleResetFilters = () => {
    setDocType("active");
    setSearchField("All");
    setSearchValue("");
  };

  const table = useReactTable({
    data: documents,
    columns: columns,
    state: {
      globalFilter,
      sorting,
      columnVisibility,
      columnPinning,
      tableSettings,
    },
    meta: {
      updateData: (rowIndex, columnId, value) => {
        skipAutoResetPageIndex();
        setDocuments((old) =>
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
      deleteRow: async (row) => {
        try {
          const confirmed = window.confirm(
            "Are you sure you want to delete this document?"
          );
          if (!confirmed) return;

          // Call delete API endpoint
          await axios.post("/deletemasterdocument.php", {
            id: row.original.id,
          });

          skipAutoResetPageIndex();
          setDocuments((old) =>
            old.filter((oldRow) => oldRow.id !== row.original.id)
          );

          alert("Document deleted successfully");
        } catch (err) {
          console.error("Error deleting document:", err);
          alert(err.response?.data?.message || "Failed to delete document");
        }
      },
      deleteRows: async (rows) => {
        try {
          const confirmed = window.confirm(
            `Are you sure you want to delete ${rows.length} document(s)?`
          );
          if (!confirmed) return;

          const rowIds = rows.map((row) => row.original.id);

          // Delete each document
          const deletePromises = rowIds.map((id) =>
            axios.post("/deletemasterdocument.php", { id })
          );

          await Promise.all(deletePromises);

          skipAutoResetPageIndex();
          setDocuments((old) => old.filter((row) => !rowIds.includes(row.id)));

          alert("Documents deleted successfully");
        } catch (err) {
          console.error("Error deleting documents:", err);
          alert(err.response?.data?.message || "Failed to delete documents");
        }
      },
      approveDocument: async (id) => {
        try {
          const effectiveDate = prompt(
            "Enter Effective Date (YYYY-MM-DD):",
            new Date().toISOString().split("T")[0]
          );
          if (!effectiveDate) return;

          // Validate date format
          const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
          if (!dateRegex.test(effectiveDate)) {
            alert("Invalid date format. Please use YYYY-MM-DD");
            return;
          }

          await axios.post("/approvedocumentnew.php", {
            id,
            effectiveDate,
          });

          alert("Document approved successfully");
          fetchDocuments(); // Refresh the list
        } catch (err) {
          console.error("Error approving document:", err);
          alert(err.response?.data?.message || "Failed to approve document");
        }
      },
      reviewDocument: async (id) => {
        try {
          const confirmed = window.confirm(
            "Are you sure you want to mark this document as reviewed?"
          );
          if (!confirmed) return;

          await axios.post("/reviewdocumentnew.php", {
            id,
          });

          alert("Document reviewed successfully");
          fetchDocuments(); // Refresh the list
        } catch (err) {
          console.error("Error reviewing document:", err);
          alert(err.response?.data?.message || "Failed to review document");
        }
      },
      setTableSettings,
      // Pass filter states to meta for Toolbar
      docType,
      setDocType,
      searchField,
      setSearchField,
      searchValue,
      setSearchValue,
      handleSearch,
      handleResetFilters,
      fetchDocuments, // For refresh functionality
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
    getPaginationRowModel: getPaginationRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onColumnPinningChange: setColumnPinning,
    autoResetPageIndex,
  });

  useDidUpdate(() => table.resetRowSelection(), [documents]);
  useLockScrollbar(tableSettings.enableFullScreen);

  // PHP: if (!in_array(70, $permissions)) { header("location:index.php"); }
  // Note: This permission is commented out in PHP, but implementing for consistency
  if (!permissions.includes(70)) {
    return (
      <Page title="View Master Document">
        <div className="flex h-60 items-center justify-center rounded-xl border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-sm font-medium text-red-600 dark:text-red-400">
            Access Denied - Permission 70 required
          </p>
        </div>
      </Page>
    );
  }

  return (
    <Page title="View Master Document">
      <div className="transition-content w-full pb-5">
        <div
          className={clsx(
            "flex h-full w-full flex-col",
            tableSettings.enableFullScreen &&
            "fixed inset-0 z-61 bg-white pt-3 dark:bg-dark-900"
          )}
        >
          <Toolbar table={table} />
          <div
            className={clsx(
              "transition-content flex grow flex-col pt-3",
              tableSettings.enableFullScreen
                ? "overflow-hidden"
                : "px-[var(--margin-x)]"
            )}
          >
            <Card
              className={clsx(
                "relative flex grow flex-col",
                tableSettings.enableFullScreen && "overflow-hidden"
              )}
            >
              {loading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 dark:bg-dark-900/50">
                  <div className="text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-500 border-r-transparent"></div>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      Loading documents...
                    </p>
                  </div>
                </div>
              )}

              {error && (
                <div className="mx-4 my-2 rounded-md bg-red-50 p-4 dark:bg-red-900/20">
                  <p className="text-sm text-red-800 dark:text-red-200">
                    {error}
                  </p>
                </div>
              )}

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
                              ]
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
                                      header.getContext()
                                    )}
                                </span>
                                <TableSortIcon
                                  sorted={header.column.getIsSorted()}
                                />
                              </div>
                            ) : header.isPlaceholder ? null : (
                              flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )
                            )}
                          </Th>
                        ))}
                      </Tr>
                    ))}
                  </THead>
                  <TBody>
                    {table.getRowModel().rows.length === 0 ? (
                      <Tr>
                        <Td
                          colSpan={columns.length}
                          className="text-center py-8"
                        >
                          <p className="text-gray-500 dark:text-gray-400">
                            {loading
                              ? "Loading..."
                              : "No documents found for the selected filters"}
                          </p>
                        </Td>
                      </Tr>
                    ) : (
                      table.getRowModel().rows.map((row) => {
                        return (
                          <Tr
                            key={row.id}
                            className={clsx(
                              "relative border-y border-transparent border-b-gray-200 dark:border-b-dark-500",
                              row.getIsSelected() &&
                              !isSafari &&
                              "row-selected after:pointer-events-none after:absolute after:inset-0 after:z-2 after:h-full after:w-full after:border-3 after:border-transparent after:bg-primary-500/10 ltr:after:border-l-primary-500 rtl:after:border-r-primary-500"
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
                                    ]
                                  )}
                                >
                                  {cell.column.getIsPinned() && (
                                    <div
                                      className={clsx(
                                        "pointer-events-none absolute inset-0 border-gray-200 dark:border-dark-500",
                                        cell.column.getIsPinned() === "left"
                                          ? "ltr:border-r rtl:border-l"
                                          : "ltr:border-l rtl:border-r"
                                      )}
                                    ></div>
                                  )}
                                  {flexRender(
                                    cell.column.columnDef.cell,
                                    cell.getContext()
                                  )}
                                </Td>
                              );
                            })}
                          </Tr>
                        );
                      })
                    )}
                  </TBody>
                </Table>
              </div>
              <SelectedRowsActions table={table} title="Master Document" showDelete={true} />
              {table.getCoreRowModel().rows.length > 0 && (
                <div
                  className={clsx(
                    "px-4 pb-4 sm:px-5 sm:pt-4",
                    tableSettings.enableFullScreen &&
                    "bg-gray-50 dark:bg-dark-800",
                    !(
                      table.getIsSomeRowsSelected() ||
                      table.getIsAllRowsSelected()
                    ) && "pt-4"
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