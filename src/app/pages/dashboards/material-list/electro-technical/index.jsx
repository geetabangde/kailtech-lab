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
import { Fragment, useRef, useState, useEffect, useCallback } from "react";
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

  console.log('Lab ID from query params:', labId);
  console.log('Lab Slug from URL params:', labSlug); // ✅ Debug log

  const [autoResetPageIndex, skipAutoResetPageIndex] = useSkipper();

  // ✅ Changed: Now orders state will be populated from API
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true); // ✅ Added loading state

  // ✅ Added dropdown options state
  const [categoryOptions, setCategoryOptions] = useState([{ value: "", label: "All Categories" }]);
  const [departmentOptions, setDepartmentOptions] = useState([{ value: "", label: "All Departments" }]);

  // ✅ Added Server-Side states
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState(labId || "");

  const [tableSettings, setTableSettings] = useState({
    enableSorting: true,
    enableColumnFilters: true,
    enableFullScreen: false,
    enableRowDense: false,
  });

  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState([]); // ✅ Added column filters state
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

  // ✅ Fetch options for dropdowns
  useEffect(() => {
    // 1. Fetch Categories
    axios.get("/inventory/category-list")
      .then((res) => {
        if (res.data?.data) {
          const formatted = res.data.data.map(cat => ({
            value: cat.id,
            label: cat.name
          }));
          setCategoryOptions([{ value: "", label: "All Categories" }, ...formatted]);
        }
      })
      .catch(err => console.error("Error fetching categories:", err));

    // 2. Fetch Departments (Labs)
    axios.get("/master/list-lab")
      .then((res) => {
        if (res.data?.data) {
          const employeeId = Number(localStorage.getItem("userId") || 0);
          
          const filteredLabs = res.data.data.filter((lab) => {
            if (!lab.users) return false;
            if (Array.isArray(lab.users)) {
              return lab.users.includes(employeeId) || lab.users.map(String).includes(String(employeeId));
            }
            if (typeof lab.users === "string") {
              return lab.users.split(",").map(s => s.trim()).includes(String(employeeId));
            }
            return false;
          });

          const formatted = filteredLabs.map(lab => ({
            value: lab.id,
            label: lab.name
          }));
          setDepartmentOptions([{ value: "", label: "All Departments" }, ...formatted]);
        }
      })
      .catch(err => console.error("Error fetching departments:", err));
  }, []);

  // ✅ API call function with useCallback
  const fetchInstruments = useCallback(async () => {
    try {
      setLoading(true);

      const response = await axios.get(
        `/material/mm-instrument-list`, {
          params: {
            labs_id: selectedDepartment,
            category: selectedCategory,
            // Asking for all records so the frontend can search them
            length: -1, 
            start: 0,
            draw: 1
          }
        }
      );

      if (Array.isArray(response.data.data)) {
        setOrders(response.data.data);
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
  }, [selectedDepartment, selectedCategory]);

  // ✅ Sync department with the lab selected in the sidebar. The component is
  // reused across labs (only the URL changes), so useState's initial value alone
  // would keep the first lab.
  useEffect(() => {
    setSelectedDepartment(labId || "");
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [labId]);

  // ✅ Fetch instruments when lab or category changes
  useEffect(() => {
    fetchInstruments();
  }, [fetchInstruments]);

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
      columnFilters, // ✅ Added to table state
      sorting,
      columnVisibility,
      columnPinning,
      tableSettings,
      pagination,
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
    onColumnFiltersChange: setColumnFilters, // ✅ Added column filter handler
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
    globalFilterFn: fuzzyFilter,
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),

    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: () => true,

    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination, 
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
    <div className="transition-content grid grid-cols-1 grid-rows-[auto_auto_1fr] py-4">
      <div className="flex items-center justify-between space-x-4 ">
        <div className="min-w-0">
          <h2 className="truncate text-xl font-medium tracking-wide text-gray-800 dark:text-dark-50">
            MM Instrument List
          </h2>
        </div>
        {/* Right Side Actions */}
        <div className="flex flex-wrap items-center gap-3">
          {/* ✅ Category Filter (API Driven) */}
          <Select
            styles={customSelectStyles}
            options={categoryOptions}
            value={categoryOptions.find(c => c.value === selectedCategory) || { value: "", label: "All Categories" }}
            onChange={(selectedOption) => {
              setSelectedCategory(selectedOption?.value || "");
              setPagination(prev => ({ ...prev, pageIndex: 0 })); // Reset to first page
            }}
            placeholder="All Categories"
            isClearable
            menuPortalTarget={document.body}
            menuPosition="fixed"
          />

          {/* ✅ Department Filter (API Driven) */}
          <Select
            styles={customSelectStyles}
            options={departmentOptions}
            value={departmentOptions.find(d => String(d.value) === String(selectedDepartment)) || { value: "", label: "All Departments" }}
            onChange={(selectedOption) => {
              setSelectedDepartment(selectedOption?.value || "");
              setPagination(prev => ({ ...prev, pageIndex: 0 })); // Reset to first page
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