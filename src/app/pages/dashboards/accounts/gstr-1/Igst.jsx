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
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import axios from "utils/axios";

// Local Imports
import { Table, Card, THead, TBody, Th, Tr, Td } from "components/ui";
import { Page } from "components/shared/Page";
import { PaginationSection } from "components/shared/table/PaginationSection";
import { useThemeContext } from "app/contexts/theme/context";
import { IgstToolbar } from "./IgstToolbar";
import { igstColumns } from "./igst-columns";

// ----------------------------------------------------------------------

export default function GSTR1IGST() {
  const { cardSkin } = useThemeContext();
  const navigate = useNavigate();
  const permissions = JSON.parse(localStorage.getItem("userPermissions") || "[]");

  useEffect(() => {
    if (!permissions.includes(146)) {
      navigate("/dashboards");
    }
  }, [navigate, permissions]);

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    startdate: "",
    enddate: "",
    customerid: "",
  });

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  // PHP condition: fetch only if customerid OR (startdate AND enddate)
  // Key difference from CGST: statecode != companystatecode (inter-state = IGST)
  const handleSearch = async (e) => {
    e?.preventDefault?.();

    if (!filters.customerid && !(filters.startdate && filters.enddate)) {
      alert("Please select a customer or a date range.");
      return;
    }

    try {
      setLoading(true);
      // Format dates to DD/MM/YYYY as requested/implied by user example
      const params = { ...filters };
      if (params.startdate) {
        const [y, m, d] = params.startdate.split("-");
        params.startdate = `${d}/${m}/${y}`;
      }
      if (params.enddate) {
        const [y, m, d] = params.enddate.split("-");
        params.enddate = `${d}/${m}/${y}`;
      }

      const res = await axios.get("/accounts/get-igst_report", { params });
      setData(Array.isArray(res.data) ? res.data : res.data?.data || []);
    } catch (err) {
      console.error("Error fetching IGST data:", err);
    } finally {
      setLoading(false);
    }
  };

  const table = useReactTable({
    data,
    columns: igstColumns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  // Totals for numeric columns
  const totals = data.reduce(
    (acc, row) => {
      acc.finaltotal += Number(row.finaltotal || 0);
      acc.subtotal2 += Number(row.subtotal2 || 0);
      acc.igstamount += Number(row.igstamount || 0);
      acc.roundoff += Number(row.roundoff || 0);
      return acc;
    },
    { finaltotal: 0, subtotal2: 0, igstamount: 0, roundoff: 0 },
  );

  return (
    <Page title="GSTR-1 IGST Invoice List">
      <div className="transition-content w-full pb-5">
        <div className="flex h-full w-full flex-col">
          <IgstToolbar
            table={table}
            filters={filters}
            onChange={handleFilterChange}
            onSearch={handleSearch}
          />
          <div className="transition-content flex grow flex-col px-[var(--margin-x)] pt-3">
            <Card className="relative flex grow flex-col">
              {loading ? (
                <div className="flex h-40 items-center justify-center text-sm text-gray-500">
                  <svg
                    className="mr-2 h-5 w-5 animate-spin text-blue-600"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z"
                    />
                  </svg>
                  Loading...
                </div>
              ) : (
                <>
                  <div className="table-wrapper min-w-full grow overflow-x-auto">
                    <Table
                      hoverable
                      className="w-full text-left rtl:text-right"
                    >
                      <THead>
                        {table.getHeaderGroups().map((headerGroup) => (
                          <Tr key={headerGroup.id}>
                            {headerGroup.headers.map((header) => (
                              <Th
                                key={header.id}
                                className="bg-gray-200 font-semibold uppercase text-gray-800 dark:bg-dark-800 dark:text-dark-100 first:ltr:rounded-tl-lg last:ltr:rounded-tr-lg"
                              >
                                {header.isPlaceholder
                                  ? null
                                  : flexRender(
                                      header.column.columnDef.header,
                                      header.getContext(),
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
                              colSpan={igstColumns.length}
                              className="py-8 text-center text-sm text-gray-500"
                            >
                              {data.length === 0
                                ? "Use the filters above to search."
                                : "No records found."}
                            </Td>
                          </Tr>
                        ) : (
                          <>
                            {table.getRowModel().rows.map((row) => (
                              <Tr
                                key={row.id}
                                className="border-y border-transparent border-b-gray-200 dark:border-b-dark-500"
                              >
                                {row.getVisibleCells().map((cell) => (
                                  <Td
                                    key={cell.id}
                                    className={clsx(
                                      "bg-white",
                                      cardSkin === "shadow"
                                        ? "dark:bg-dark-700"
                                        : "dark:bg-dark-900",
                                    )}
                                  >
                                    {flexRender(
                                      cell.column.columnDef.cell,
                                      cell.getContext(),
                                    )}
                                  </Td>
                                ))}
                              </Tr>
                            ))}

                            {/* Totals row */}
                            <Tr className="border-t border-gray-200 font-semibold dark:border-dark-500">
                              {table
                                .getVisibleLeafColumns()
                                .map((col, idx) => {
                                  if (idx === 0)
                                    return (
                                      <Td
                                        key={col.id}
                                        colSpan={5}
                                        className="text-right"
                                      >
                                        Total
                                      </Td>
                                    );
                                  if (idx < 5) return null;
                                  if (col.id === "finaltotal")
                                    return (
                                      <Td key={col.id}>
                                        {totals.finaltotal.toFixed(2)}
                                      </Td>
                                    );
                                  if (col.id === "subtotal2")
                                    return (
                                      <Td key={col.id}>
                                        {totals.subtotal2.toFixed(2)}
                                      </Td>
                                    );
                                  if (col.id === "igstamount")
                                    return (
                                      <Td key={col.id}>
                                        {totals.igstamount.toFixed(2)}
                                      </Td>
                                    );
                                  if (col.id === "roundoff")
                                    return (
                                      <Td key={col.id}>
                                        {totals.roundoff.toFixed(2)}
                                      </Td>
                                    );
                                  return <Td key={col.id} />;
                                })}
                            </Tr>
                          </>
                        )}
                      </TBody>
                    </Table>
                  </div>
                  {data.length > 0 && (
                    <div className="px-4 pb-4 pt-4 sm:px-5">
                      <PaginationSection table={table} />
                    </div>
                  )}
                </>
              )}
            </Card>
          </div>
        </div>
      </div>
    </Page>
  );
}
