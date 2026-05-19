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
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "utils/axios";
import { toast } from "sonner";

// Local Imports
import { Table, THead, TBody, Th, Tr, Td, Button } from "components/ui";
import { TableSortIcon } from "components/shared/table/TableSortIcon";
import { Page } from "components/shared/Page";
import { useLockScrollbar, useDidUpdate, useLocalStorage } from "hooks";
import { fuzzyFilter } from "utils/react-table/fuzzyFilter";
import { useSkipper } from "utils/react-table/useSkipper";
import { PaginationSection } from "components/shared/table/PaginationSection";
import { useThemeContext } from "app/contexts/theme/context";
import { columns } from "../mrn/columns";
import { getUserAgentBrowser } from "utils/dom/getUserAgentBrowser";

// ----------------------------------------------------------------------
// PHP: if(!in_array(172, $permissions)){ header("location:index.php"); }

const isSafari = getUserAgentBrowser() === "Safari";

function usePermissions() {
  const p = localStorage.getItem("userPermissions");
  try {
    return JSON.parse(p) || [];
  } catch {
    return p?.split(",").map(Number) || [];
  }
}

export default function MrnChallan() {
  const navigate = useNavigate();
  const { cardSkin } = useThemeContext();
  const permissions = usePermissions();
  const [searchParams] = useSearchParams();
  const id = searchParams.get("hakuna") || "";

  // State Management -----------------------------------------------------------
  const [mrns, setMrns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tableSettings, setTableSettings] = useState({
    enableFullScreen: false,
    enableRowDense: false,
  });
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState([{ id: "id", desc: true }]);
  const [columnVisibility, setColumnVisibility] = useLocalStorage(
    "column-visibility-mrn-challan",
    {},
  );
  const [columnPinning, setColumnPinning] = useLocalStorage(
    "column-pinning-mrn-challan",
    {},
  );
  const [autoResetPageIndex, skipAutoResetPageIndex] = useSkipper();

  // Effects and Callbacks ----------------------------------------------------
  useEffect(() => {
    const fetchMrnData = async () => {
      if (!permissions.includes(172)) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        // PHP: "ajax": "mrnchallandata.php?hakuna='.$id.'"
        const response = await axios.get(`/inventory/mrn-chalan-list?hakuna=${id}`);

        if (response.data.status && Array.isArray(response.data.data)) {
          setMrns(response.data.data);
        } else {
          console.warn("Unexpected response structure:", response.data);
          setMrns([]);
        }
      } catch (err) {
        console.error("Error fetching MRN data:", err);
        toast.error("Something went wrong while loading MRN data");
      } finally {
        setLoading(false);
      }
    };

    fetchMrnData();
  }, [id, permissions]);

  // Table Configuration -----------------------------------------------------------
  const table = useReactTable({
    data: mrns,
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
        setMrns((old) =>
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
      deleteRow: (row) => {
        skipAutoResetPageIndex();
        setMrns((old) =>
          old.filter((oldRow) => oldRow.id !== row.original.id)
        );
      },
      deleteRows: (rows) => {
        skipAutoResetPageIndex();
        const rowIds = rows.map((row) => row.original.id);
        setMrns((old) => old.filter((row) => !rowIds.includes(row.id)));
      },
      setTableSettings
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

  useDidUpdate(() => table.resetRowSelection(), [mrns]);

  useLockScrollbar(tableSettings.enableFullScreen);

  // Permission Check ---------------------------------------------------------
  if (!permissions.includes(172)) {
    return (
      <Page title="Manage Work Order/Purchase Order">
        <div className="flex h-60 items-center justify-center rounded-xl border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-sm font-medium text-red-600 dark:text-red-400">
            Access Denied - Permission 172 required
          </p>
        </div>
      </Page>
    );
  }

  // Loading UI
  if (loading) {
    return (
      <Page title="Manage Work Order/Purchase Order">
        <div className="flex h-[60vh] items-center justify-center text-gray-600">
          <svg className="animate-spin h-6 w-6 mr-2 text-blue-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z"></path>
          </svg>
          Loading MRN Data...
        </div>
      </Page>
    );
  }

  return (
    <Page title="Manage Work Order/Purchase Order">
      <div className="transition-content w-full pb-5">
        <div
          className={clsx(
            "flex h-full w-full flex-col",
            tableSettings.enableFullScreen &&
            "fixed inset-0 z-61 bg-white pt-3 dark:bg-dark-900",
          )}
        >
          {/* PHP: <div class="box box-info"> */}
          <div className="box box-info">
            {/* PHP: <div class="box-header with-border"> */}
            <div className="box-header with-border">
              <h3 className="box-title with-border">Mrn List</h3>
              <div className="box-tools pull-right">
                {/* PHP: if (in_array(291, $permissions)) { ?>
                  <a class="btn btn-primary mb-2 " href="addMaterialReceiptNotewopo.php" >Add New MRN</a>
                  <a class="btn btn-secondary mb-2 " href="addMaterialReceiptNote.php" >Add New MRN Wo PO</a>
                */}
                {permissions.includes(291) && (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => navigate("/dashboards/inventory/mrn/add")}
                      color="primary"
                      className="h-9 text-xs px-3 font-semibold"
                    >
                      Add New MRN
                    </Button>
                    <Button
                      onClick={() => navigate("/dashboards/inventory/mrn/add-wo-po")}
                      color="secondary"
                      className="h-9 text-xs px-3 font-semibold"
                    >
                      Add New MRN Wo PO
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* PHP: <div class="box-body" id="catid"> */}
            <div className="box-body" id="catid">
              <div className="table-responsive">
                <Table
                  hoverable
                  dense={tableSettings.enableRowDense}
                  sticky={tableSettings.enableFullScreen}
                  className="table table-bordered table-striped"
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
                              ],
                            )}
                          >
                            {header.column.getCanSort() ? (
                              <div
                                className="flex cursor-pointer select-none items-center space-x-3 "
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
                  </THead>
                  <TBody>
                    {table.getRowModel().rows.map((row) => {
                      return (
                        <Tr
                          key={row.id}
                          className={clsx(
                            "relative border-y border-transparent border-b-gray-200 dark:border-b-dark-500",
                            row.getIsSelected() && !isSafari &&
                            "row-selected after:pointer-events-none after:absolute after:inset-0 after:z-2 after:h-full after:w-full after:border-3 after:border-transparent after:bg-primary-500/10 ltr:after:border-l-primary-500 rtl:after:border-r-primary-500",
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
                                      "pointer-events-none absolute inset-0 border-gray-200 dark:border-dark-500",
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
            </div>
          </div>

          {table.getCoreRowModel().rows.length && (
            <div
              className={clsx(
                "px-4 pb-4 sm:px-5 sm:pt-4",
                tableSettings.enableFullScreen &&
                "bg-gray-50 dark:bg-dark-800",
                !(
                  table.getIsSomeRowsSelected() ||
                  table.getIsAllRowsSelected()
                ) && "pt-4",
              )}
            >
              <PaginationSection table={table} />
            </div>
          )}
        </div>
      </div>

      <style>{`
        .box {
          border: 1px solid #ddd;
          border-radius: 4px;
          margin-bottom: 20px;
        }

        .box-info {
          border-top: 3px solid #00c0ef;
        }

        .box-header {
          padding: 10px 15px;
          border-bottom: 1px solid #f4f4f4;
          position: relative;
        }

        .box-header.with-border {
          border-bottom: 1px solid #ddd;
        }

        .box-title {
          font-size: 18px;
          margin: 0;
          line-height: 1.8;
          font-weight: 500;
        }

        .box-title.with-border {
          border-right: 1px solid #ddd;
          padding-right: 10px;
        }

        .box-tools {
          position: absolute;
          right: 10px;
          top: 5px;
        }

        .pull-right {
          float: right !important;
        }

        .box-body {
          border-top-left-radius: 0;
          border-top-right-radius: 0;
          border-bottom-right-radius: 3px;
          border-bottom-left-radius: 3px;
          padding: 15px;
        }

        .table-responsive {
          overflow-x: auto;
        }

        .table {
          width: 100%;
          border-collapse: collapse;
        }

        .table-bordered {
          border: 1px solid #ddd;
        }

        .table-bordered th,
        .table-bordered td {
          border: 1px solid #ddd;
        }

        .table-striped tbody tr:nth-of-type(odd) {
          background-color: #f9f9f9;
        }

        .btn {
          display: inline-block;
          padding: 6px 12px;
          margin-bottom: 0;
          font-size: 14px;
          font-weight: normal;
          line-height: 1.42857143;
          text-align: center;
          white-space: nowrap;
          vertical-align: middle;
          cursor: pointer;
          border: 1px solid transparent;
          border-radius: 4px;
          text-decoration: none;
        }

        .btn-primary {
          color: #fff;
          background-color: #337ab7;
          border-color: #2e6da4;
        }

        .btn-secondary {
          color: #fff;
          background-color: #6c757d;
          border-color: #6c757d;
        }

        .btn:hover {
          opacity: 0.8;
        }

        .mb-2 {
          margin-bottom: 8px;
        }

        @media (max-width: 768px) {
          .box-tools {
            position: static;
            float: none;
            margin-top: 10px;
            text-align: left;
          }

          .pull-right {
            float: none !important;
          }
        }
      `}</style>
    </Page>
  );
}