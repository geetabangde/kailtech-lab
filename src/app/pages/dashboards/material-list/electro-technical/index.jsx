// Import Dependencies
import {
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFacetedMinMaxValues,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import clsx from "clsx";
import { Fragment, useRef, useState, useEffect } from "react";
import axios from "utils/axios";
import { useSearchParams, useParams } from "react-router-dom"; // ✅ Changed to react-router-dom

// Local Imports
import { TableSortIcon } from "components/shared/table/TableSortIcon";
import { ColumnFilter } from "components/shared/table/ColumnFilter";
import { PaginationSection } from "components/shared/table/PaginationSection";
import { Button, Card, Table, THead, TBody, Th, Tr, Td } from "components/ui";
import Select from "react-select";
import {
  useBoxSize,
  useLockScrollbar,
  useLocalStorage,
  useDidUpdate,
} from "hooks";
import { fuzzyFilter } from "utils/react-table/fuzzyFilter";
import { useSkipper } from "utils/react-table/useSkipper";
import { SelectedRowsActions } from "./SelectedRowsActions";
import { SubRowComponent } from "./SubRowComponent";
import { columns } from "./columns";
import { Toolbar } from "./Toolbar";
import { useThemeContext } from "app/contexts/theme/context";
import { getUserAgentBrowser } from "utils/dom/getUserAgentBrowser";
import { useNavigate } from "react-router-dom";

// ----------------------------------------------------------------------

const isSafari = getUserAgentBrowser() === "Safari";

const customSelectStyles = {
  control: (base, state) => ({
    ...base,
    minHeight: "36px",
    height: "36px",
    minWidth: "160px",
    borderColor: state.isFocused ? "#3b82f6" : "#d1d5db",
    boxShadow: state.isFocused ? "0 0 0 1px rgba(59, 130, 246, 0.5)" : "none",
    "&:hover": {
      borderColor: "#3b82f6",
    },
    borderRadius: "0.375rem",
    fontSize: "0.875rem",
    color: "#374151",
    backgroundColor: "white",
  }),
  valueContainer: (base) => ({
    ...base,
    padding: "0 8px",
    height: "36px",
  }),
  indicatorsContainer: (base) => ({
    ...base,
    height: "36px",
  }),
  menu: (base) => ({
    ...base,
    zIndex: 9999,
  }),
  menuPortal: (base) => ({
    ...base,
    zIndex: 9999,
  }),
};

export default function OrdersDatatableV2() {
  const { cardSkin } = useThemeContext();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { labSlug } = useParams(); //  Get current lab slug from URL
  const labId = searchParams.get('labId');

  const permissions =
    localStorage.getItem("userPermissions")?.split(",").map(Number) || [];

  useEffect(() => {
    if (!permissions.includes(65)) {
      navigate("/dashboards");
    }
  }, [navigate, permissions]);

  console.log('Lab ID from query params:', labId);
  console.log('Lab Slug from URL params:', labSlug); // ✅ Debug log

  const [autoResetPageIndex, skipAutoResetPageIndex] = useSkipper();

  // ✅ Changed: Now orders state will be populated from API
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true); // ✅ Added loading state

  const [tableSettings, setTableSettings] = useState({
    enableSorting: true,
    enableColumnFilters: true,
    enableFullScreen: false,
    enableRowDense: false,
  });

  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState([]);

  // ✅ Added pagination state for dynamic page size
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const [columnVisibility, setColumnVisibility] = useLocalStorage(
    "column-visibility-orders-2",
    {},
  );

  const [columnPinning, setColumnPinning] = useLocalStorage(
    "column-pinning-orders-2",
    {},
  );

  const cardRef = useRef();
  const { width: cardWidth } = useBoxSize({ ref: cardRef });

  // ✅ Fetch instruments when query params change
  useEffect(() => {
    if (labId) {
      fetchInstruments(labId);
    } else {
      setLoading(false);
      setOrders([]);
      console.warn('No labId found in query parameters');
    }
  }, [labId]);

  // ✅ API call function
  const fetchInstruments = async (labId) => {
    try {
      setLoading(true);
      console.log('Fetching instruments for labId:', labId); // Debug

      const response = await axios.get(
        `/material/mm-instrument-list?labs_id=${labId}`
      );

      if (Array.isArray(response.data.data)) {
        // ✅ Sort by ID descending so newest comes first
        const sortedData = [...response.data.data].sort((a, b) => {
          return (Number(b.id) || 0) - (Number(a.id) || 0);
        });
        setOrders(sortedData);
      } else {
        console.warn("Unexpected response structure:", response.data);
        setOrders([]);
      }
    } catch (err) {
      console.error("Error fetching instrument list:", err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };


  const handleAddNewInstrument = () => {
    if (!labSlug || !labId) {
      console.error('Missing labSlug or labId');
      alert('Unable to add instrument. Lab information is missing.');
      return;
    }

    // Navigate to AddNewInstrument with labId query parameter
    navigate(`/dashboards/material-list/${labSlug}/AddNewInstrument?labId=${labId}`);
  };

  const table = useReactTable({
    data: orders,
    columns: columns,
    state: {
      globalFilter,
      sorting,
      columnVisibility,
      columnPinning,
      tableSettings,
      pagination, // ✅ Added pagination state
    },
    meta: {
      setTableSettings,
      deleteRow: (row) => {
        skipAutoResetPageIndex();
        setOrders((old) =>
          old.filter((oldRow) => oldRow.id !== row.original.id),
        );
      },
      deleteRows: (rows) => {
        skipAutoResetPageIndex();
        const rowIds = rows.map((row) => row.original.id);
        setOrders((old) => old.filter((row) => !rowIds.includes(row.id)));
      },
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

    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: () => true,

    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination, // ✅ Added pagination handler
    onColumnVisibilityChange: setColumnVisibility,
    onColumnPinningChange: setColumnPinning,

    autoResetPageIndex,
  });

  useDidUpdate(() => table.resetRowSelection(), [orders]);

  useLockScrollbar(tableSettings.enableFullScreen);

  // ✅ Loading UI
  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-gray-600">
        <svg className="animate-spin h-6 w-6 mr-2 text-blue-600" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z"></path>
        </svg>
        Loading Instruments...
      </div>
    );
  }

  return (
    <div className="transition-content grid grid-cols-1 grid-rows-[auto_auto_1fr] px-[var(--margin-x)] py-4">
      <div className="flex items-center justify-between space-x-4 ">
        <div className="min-w-0">
          <h2 className="truncate text-xl font-medium tracking-wide text-gray-800 dark:text-dark-50">
            MM Instrument List
          </h2>
        </div>
        {/* Right Side Actions */}
        <div className="flex flex-wrap items-center gap-3">
          {/* ✅ Category Filter */}
          <Select
            styles={customSelectStyles}
            options={[
              { value: "", label: "All Categories" },
              ...Array.from(table.getColumn("category")?.getFacetedUniqueValues()?.keys() || [])
                .filter(Boolean)
                .sort()
                .map((category) => ({ value: category, label: category })),
            ]}
            value={table.getColumn("category")?.getFilterValue() ? { value: table.getColumn("category")?.getFilterValue(), label: table.getColumn("category")?.getFilterValue() } : { value: "", label: "All Categories" }}
            onChange={(selectedOption) => {
              table.getColumn("category")?.setFilterValue(selectedOption?.value || undefined);
            }}
            placeholder="All Categories"
            isClearable
            menuPortalTarget={document.body}
            menuPosition="fixed"
          />

          {/* ✅ Department Filter (from `location` column) */}
          <Select
            styles={customSelectStyles}
            options={[
              { value: "", label: "All Departments" },
              ...Array.from(table.getColumn("location")?.getFacetedUniqueValues()?.keys() || [])
                .filter(Boolean)
                .sort()
                .map((dept) => ({ value: dept, label: dept })),
            ]}
            value={table.getColumn("location")?.getFilterValue() ? { value: table.getColumn("location")?.getFilterValue(), label: table.getColumn("location")?.getFilterValue() } : { value: "", label: "All Departments" }}
            onChange={(selectedOption) => {
              table.getColumn("location")?.setFilterValue(selectedOption?.value || undefined);
            }}
            placeholder="All Departments"
            isClearable
            menuPortalTarget={document.body}
            menuPosition="fixed"
          />

          {/* ✅ Add New Instrument Button with dynamic labId and slug */}
          {permissions.includes(65) && (
            <Button
              className="h-8 space-x-1.5 rounded-md px-3 text-xs "
              color="primary"
              onClick={handleAddNewInstrument}
            >
              Add New Instrument
            </Button>
          )}
        </div>
      </div>

      <div
        className={clsx(
          "flex flex-col pt-4",
          tableSettings.enableFullScreen &&
          "fixed inset-0 z-61 h-full w-full bg-white pt-3 dark:bg-dark-900",
        )}
      >
        <Toolbar table={table} />
        <Card
          className={clsx(
            "relative mt-3 flex grow flex-col",
            tableSettings.enableFullScreen && "overflow-hidden",
          )}
          ref={cardRef}
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
                        {header.column.getCanFilter() ? (
                          <ColumnFilter column={header.column} />
                        ) : null}
                      </Th>
                    ))}
                  </Tr>
                ))}
              </THead>
              <TBody>
                {table.getRowModel().rows.map((row) => {
                  return (
                    <Fragment key={row.id}>
                      <Tr
                        className={clsx(
                          "relative border-y border-transparent border-b-gray-200 dark:border-b-dark-500",
                          row.getIsExpanded() && "border-dashed",
                          row.getIsSelected() && !isSafari &&
                          "row-selected after:pointer-events-none after:absolute after:inset-0 after:z-2 after:h-full after:w-full after:border-3 after:border-transparent after:bg-primary-500/10 ltr:after:border-l-primary-500 rtl:after:border-r-primary-500",
                        )}
                      >
                        {row.getVisibleCells().map((cell) => {
                          return (
                            <Td
                              key={cell.id}
                              className={clsx(
                                "relative whitespace-normal break-words align-top",
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
                      {row.getIsExpanded() && (
                        <tr>
                          <td
                            colSpan={row.getVisibleCells().length}
                            className="p-0"
                          >
                            <SubRowComponent row={row} cardWidth={cardWidth} />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </TBody>
            </Table>
          </div>
          <SelectedRowsActions table={table} />

          {table.getFilteredRowModel().rows.length > 0 && (

            <PaginationSection table={table} />

          )}
        </Card>
      </div>
    </div>
  );
}