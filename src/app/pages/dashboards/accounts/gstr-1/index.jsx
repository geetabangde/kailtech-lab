// Import Dependencies
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
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
import { useThemeContext } from "app/contexts/theme/context";
import { Toolbar } from "./Toolbar";
import { columns } from "./columns";
import * as XLSX from "xlsx";

// ─── Shared UI components ──────────────────────────────────────────────────
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

// ----------------------------------------------------------------------

export default function GSTR1() {
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
  const handleSearch = async (e) => {
    e?.preventDefault?.();

    if (!filters.customerid && !(filters.startdate && filters.enddate)) {
      alert("Please select a customer or a date range.");
      return;
    }

    try {
      setLoading(true);

      const apiParams = { ...filters };
      if (apiParams.startdate) {
        const [d, m, y] = apiParams.startdate.split('/');
        apiParams.startdate = `${y}-${m}-${d}`;
      }
      if (apiParams.enddate) {
        const [d, m, y] = apiParams.enddate.split('/');
        apiParams.enddate = `${y}-${m}-${d}`;
      }

      const res = await axios.get("/accounts/get-gstr1-report", { params: apiParams });
      setData(Array.isArray(res.data) ? res.data : res.data?.data || []);
    } catch (err) {
      console.error("Error fetching GSTR-1 data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Excel Export — exact PHP export columns
  const exportToExcel = () => {
    if (!data.length) {
      alert("Pehle Search karein, tab Export karein.");
      return;
    }

    const exportData = data.map((row, idx) => {
      let invDate = row.invoicedate;
      if (invDate) {
        const dObj = new Date(invDate);
        if (!isNaN(dObj)) invDate = dObj.toLocaleDateString("en-GB"); // DD/MM/YYYY
      }
      return {
        "Sr No.": idx + 1,
        "GSTIN NO": row.gstno || "",
        "RECEIVER NAME": row.custname || "",
        "INVOICE NO": row.invoiceno || "",
        "INVOICE DATE": invDate || "",
        "TOTAL INVOICE VALUE": Number(row.finaltotal || 0),
        "TAXABLE VALUE": Number(row.subtotal2 || 0),
        "CENTRAL TAX": Number(row.cgstamount || 0),
        "STATE TAX": Number(row.sgstamount || 0),
        "ROUND OFF": Number(row.roundoff || 0),
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Gstr 1 List");
    const colWidths = Object.keys(exportData[0]).map((key) => ({ wch: Math.max(key.length, 16) }));
    worksheet["!cols"] = colWidths;
    XLSX.writeFile(workbook, `GSTR1_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    // No pagination — show all rows like PHP
  });

  // Totals for numeric columns
  const totals = data.reduce(
    (acc, row) => {
      acc.finaltotal  += Number(row.finaltotal  || 0);
      acc.subtotal2   += Number(row.subtotal2   || 0);
      acc.cgstamount  += Number(row.cgstamount  || 0);
      acc.sgstamount  += Number(row.sgstamount  || 0);
      acc.roundoff    += Number(row.roundoff    || 0);
      return acc;
    },
    { finaltotal: 0, subtotal2: 0, cgstamount: 0, sgstamount: 0, roundoff: 0 },
  );

  return (
    <Page title="GSTR-1 Invoice List">
      <div className="transition-content w-full pb-5">
        <div className="flex h-full w-full flex-col">
          <Toolbar
            table={table}
            filters={filters}
            onChange={handleFilterChange}
            onSearch={handleSearch}
            onExport={exportToExcel}
          />
          <div className="transition-content flex grow flex-col px-[var(--margin-x)] pt-3">
            <Card className="relative flex grow flex-col">
              {loading ? (
                <PageSpinner />
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
                              colSpan={columns.length}
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
 
                             {/* Totals row — matches PHP accumulated totals */}
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
                                   if (col.id === "cgstamount")
                                     return (
                                       <Td key={col.id}>
                                         {totals.cgstamount.toFixed(2)}
                                       </Td>
                                     );
                                   if (col.id === "sgstamount")
                                     return (
                                       <Td key={col.id}>
                                         {totals.sgstamount.toFixed(2)}
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
                </>
              )}
            </Card>
          </div>
        </div>
      </div>
    </Page>
  );
}
