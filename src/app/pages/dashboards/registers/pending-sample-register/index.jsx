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

export default function PendingSampleRegister() {
  const { cardSkin } = useThemeContext();
  const navigate = useNavigate();
  const permissions = JSON.parse(localStorage.getItem("userPermissions") || "[]");

  useEffect(() => {
    // Permission 357 as per PHP code: if(!in_array(357, $permissions)){ header("location:index.php"); }
    if (!permissions.includes(357)) {
      navigate("/dashboards");
    }
  }, [navigate, permissions]);

  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters matching PHP code
  const [filters, setFilters] = useState({
    startdate: "",
    enddate: "",
    chemist: "",
    labid: "",
  });
  const [chemists, setChemists] = useState([]);
  const [departments, setDepartments] = useState([]);

  // Fetch chemists dropdown data
  const fetchChemists = async () => {
    try {
      const res = await axios.get("register/get-lab-user");
      setChemists(res.data?.data || []);
    } catch (err) {
      console.error("Error fetching chemists:", err);
    }
  };

  // Fetch departments dropdown data
  const fetchDepartments = async () => {
    try {
      const res = await axios.get("master/list-lab");
      setDepartments(res.data?.data || []);
    } catch (err) {
      console.error("Error fetching departments:", err);
    }
  };

  useEffect(() => {
    fetchChemists();
    fetchDepartments();
  }, []);

  // Fetch pending sample register data
  const fetchPendingSampleData = async () => {
    try {
      setLoading(true);

      const res = await axios.get("register/pending-sample", { params: filters });

      let rows = res.data?.data || [];

      rows = rows.map((row, index) => ({
        sno: index + 1,
        product: row.product || row[0] || "",
        lrn: row.lrn || row[1] || "",
        brn: row.brn || row[2] || "",
        customer_name: row.customer_name || row[3] || "",
        contact_person: row.contact_name || row.contact_person || row[4] || "",
        sample_qty: row.received_items || row.sample_qty || row[5] || "",
        department: row.labs || row.department || row[6] || "",
        received_date: row.received_date || row[7] || "",
        allotment_date: row.alloted_date || row.allotment_date || row[8] || "",
        accept_date: row.accepted_date || row.accept_date || row[9] || "",
        commitment_date: row.deadline || row.commitment_date || row[10] || "",
        tat: row.tat || row[11] || "",
        parameter: row.testing_status || row.parameter || row[12] || "",
        chemist_name: row.chemist || row.chemist_name || row[13] || "",
        grade_size: row.grade_size || row[14] || "",
        chemist: row.chemist || row[15] || "",
        parameters: row.parameters || row[16] || "",
        id: row.id || row[17] || "",
        ...row
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
    fetchPendingSampleData();
  };

  const handleExport = (e) => {
    e?.preventDefault?.();
    // Create form data for export request
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/registers/exportcrmlist';

    Object.entries(filters).forEach(([key, value]) => {
      if (value && (typeof value !== 'object' || value.length > 0)) {
        if (Array.isArray(value)) {
          value.forEach(val => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = `${key}[]`;
            input.value = val;
            form.appendChild(input);
          });
        } else {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = value;
          form.appendChild(input);
        }
      }
    });

    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
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

  const pendingSampleColumns = [
    {
      accessorKey: "sno",
      header: "Sno",
      cell: (info) => safeRender(info.getValue()),
    },
    {
      accessorKey: "product",
      header: "Product",
      cell: (info) => (
        <div className="whitespace-normal min-w-[250px]">
          {safeRender(info.getValue())}
        </div>
      ),
    },
    {
      accessorKey: "lrn",
      header: "LRN",
      cell: (info) => safeRender(info.getValue()),
    },
    ...(permissions.includes(358) ? [
      {
        accessorKey: "brn",
        header: "BRN",
        cell: (info) => safeRender(info.getValue()),
      },
      {
        accessorKey: "customer_name",
        header: "Customer Name",
        cell: (info) => safeRender(info.getValue()),
      },
      {
        accessorKey: "contact_person",
        header: "Contact person",
        cell: (info) => safeRender(info.getValue()),
      }
    ] : []),
    {
      accessorKey: "sample_qty",
      header: "Sample Qty",
      cell: (info) => (
        <div className="whitespace-normal min-w-[150px]">
          {safeRender(info.getValue())}
        </div>
      ),
    },
    {
      accessorKey: "department",
      header: "Department",
      cell: (info) => safeRender(info.getValue()),
    },
    {
      accessorKey: "received_date",
      header: "Received Date",
      cell: (info) => safeRender(info.getValue()),
    },
    {
      accessorKey: "allotment_date",
      header: "Allotment Date",
      cell: (info) => safeRender(info.getValue()),
    },
    {
      accessorKey: "accept_date",
      header: "Accept Date",
      cell: (info) => safeRender(info.getValue()),
    },
    {
      accessorKey: "commitment_date",
      header: "Commitment Date",
      cell: (info) => safeRender(info.getValue()),
    },
    {
      accessorKey: "tat",
      header: "TAT",
      cell: (info) => safeRender(info.getValue()),
    },
    {
      accessorKey: "parameter",
      header: "Parameter",
      cell: (info) => {
        const val = info.getValue();
        if (typeof val === 'object' && val !== null) {
          return (
            <div className="text-sm">
              <span className="no-print block">{val.completed || 0} Tests completed</span>
              <span className="no-print block">{val.pending_completion || 0} Tests Pending completion</span>
              <span className="no-print block">{val.pending_assignment || 0} Tests Pending Assignment</span>
            </div>
          );
        }
        return safeRender(val);
      },
    },
    {
      accessorKey: "chemist_name",
      header: "Chemist Name",
      cell: (info) => safeRender(info.getValue()),
    },
    {
      id: "action",
      header: "Action",
      cell: ({ row }) => {
        if (!permissions.includes(272)) return null;
        return (
          <button
            onClick={() => navigate(`/dashboards/registers/parameter-detail?lrn=${row.original.lrn}`)}
            className="inline-flex items-center justify-center px-3 py-1 bg-cyan-500 hover:bg-cyan-600 text-white rounded text-xs font-semibold transition-colors shadow-xs"
          >
            List
          </button>
        );
      },
    },
  ];

  const table = useReactTable({
    data: tableData,
    columns: pendingSampleColumns,
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
      <Page title="Pending Sample">
        <PageSpinner />
      </Page>
    );
  }

  return (
    <Page title="Pending Sample">
      <Toolbar
        filters={filters}
        onChange={handleFilterChange}
        onSearch={handleSearch}
        onExport={handleExport}
        chemists={chemists}
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
                    {tableData.length === 0 && !loading && (
                      <Tr>
                        <Td colSpan={visibleColumns.length} className="py-10 text-center text-gray-500">
                          No pending sample items found for the selected criteria.
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
