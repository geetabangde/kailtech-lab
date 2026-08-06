// Import Dependencies
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import clsx from "clsx";
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import axios from "utils/axios";

// Local Imports
import { Table, Card, THead, TBody, Th, Tr, Td } from "components/ui";
import { Page } from "components/shared/Page";
import { useThemeContext } from "app/contexts/theme/context";
import { IgstToolbar } from "./IgstToolbar";
import { igstColumns, getSupplierType } from "./igst-columns";
import { getPlaceOfSupply, getGstRate } from "./columns";
import * as XLSX from "xlsx";

// ─── Helper: format date to DD/MM/YYYY ─────────────────────────────────────
function formatDate(val) {
  if (!val) return "";
  const d = new Date(val);
  return isNaN(d) ? val : d.toLocaleDateString("en-GB");
}

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
    supplierType: "",
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

      const apiParams = { ...filters };
      if (apiParams.startdate) {
        const [d, m, y] = apiParams.startdate.split("/");
        apiParams.startdate = `${y}-${m}-${d}`;
      }
      if (apiParams.enddate) {
        const [d, m, y] = apiParams.enddate.split("/");
        apiParams.enddate = `${y}-${m}-${d}`;
      }

      // Fetch IGST invoices
      const res = await axios.get("/accounts/get-igst_report", { params: apiParams });
      const invoiceData = Array.isArray(res.data) ? res.data : res.data?.data || [];

      // Fetch Credit Notes
      const cnRes = await axios.get("/accounts/get-credit-not-list");
      const rawCnData = Array.isArray(cnRes.data) ? cnRes.data : cnRes.data?.data || [];

      // Filter Credit Notes client-side by status, customer, date range, and inter-state status
      const filteredCnData = rawCnData.filter((cn) => {
        // Status filter: only approved or e-invoiced credit notes
        const status = Number(cn.status);
        if (status !== 1 && status !== 2) return false;

        // Customer ID filter
        if (filters.customerid && String(cn.customerid || cn.id_customer) !== String(filters.customerid)) {
          return false;
        }

        // Date filter
        const cnDateRaw = cn.creditnotedate || cn.cndate || "";
        if (!cnDateRaw || cnDateRaw === "0000-00-00") return false;
        const cnD = new Date(cnDateRaw);
        if (isNaN(cnD)) return false;

        if (filters.startdate) {
          const [sd, sm, sy] = filters.startdate.split("/");
          const startDateObj = new Date(`${sy}-${sm}-${sd}T00:00:00`);
          if (cnD < startDateObj) return false;
        }

        if (filters.enddate) {
          const [ed, em, ey] = filters.enddate.split("/");
          const endDateObj = new Date(`${ey}-${em}-${ed}T23:59:59`);
          if (cnD > endDateObj) return false;
        }

        // Inter-state filter (IGST): has IGST amount OR state code is NOT "23" and is present
        const hasIgst = Number(cn.igstamount || 0) > 0;
        const isInterState = String(cn.statecode || "").trim() !== "23" && cn.statecode;
        if (!hasIgst && !isInterState) return false;

        return true;
      });

      // Map Credit Notes with negative values to match GSTR-1 structure
      const mappedCnData = filteredCnData.map((cn) => ({
        ...cn,
        id: `cn-${cn.id}`,
        isCreditNote: true,
        gstno: cn.gstno || "",
        custname: cn.custname || cn.customername || cn.cname || "",
        invoiceno: cn.creditnoteno ? `${cn.creditnoteno} (CN)` : `CN-${cn.id}`,
        invoicedate: cn.creditnotedate || cn.cndate || cn.created_at,
        finaltotal: -(Number(cn.finaltotal || 0)),
        subtotal2: -(Number(cn.subtotal || cn.subtotal2 || 0)),
        cgstamount: -(Number(cn.cgstamount || 0)),
        sgstamount: -(Number(cn.sgstamount || 0)),
        igstamount: -(Number(cn.igstamount || 0)),
        roundoff: -(Number(cn.roundoff || 0)),
      }));

      setData([...invoiceData, ...mappedCnData]);
    } catch (err) {
      console.error("Error fetching IGST data:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = useMemo(() => {
    return data.filter((row) => {
      if (filters.supplierType === "CREDIT_NOTE") {
        return row.isCreditNote === true;
      }
      if (!filters.supplierType) return true;
      return getSupplierType(row) === filters.supplierType && !row.isCreditNote;
    });
  }, [data, filters.supplierType]);

  // ─── Excel Export — different headers based on Invoice Type filter ────────
  const exportToExcel = () => {
    if (!filteredData.length) {
      alert("Pehle Search karein, tab Export karein.");
      return;
    }

    const currentType = filters.supplierType;
    let exportData;
    let sheetName;
    let fileName;

    if (currentType === "CREDIT_NOTE") {
      // Credit Note headers
      sheetName = "Credit Notes";
      fileName = `GSTR1_IGST_CreditNotes_${new Date().toISOString().slice(0, 10)}.xlsx`;
      exportData = filteredData.map((row) => ({
        "GSTIN/UIN of Recipient": row.gstno || "",
        "Receiver Name": row.custname || "",
        "Note Number": row.invoiceno || "",
        "Note Date": formatDate(row.invoicedate),
        "Note Type": "C",
        "Place of Supply": getPlaceOfSupply(row),
        "Reverse Charge": String(row.reversecharge || row.reverse_charge || "N").toUpperCase() === "Y" ? "Y" : "N",
        "Note Supply Type": "",
        "Note value": Math.abs(Number(row.finaltotal || 0)),
        "Applicable % of Tax Rate": "",
        "Rate": getGstRate(row) || "",
        "Taxable Value": Math.abs(Number(row.subtotal2 || 0)),
        "Integrated Tax": Math.abs(Number(row.igstamount || 0)),
        "Central Tax": Math.abs(Number(row.cgstamount || 0)),
        "State/UT Tax": Math.abs(Number(row.sgstamount || 0)),
        "Cess Amount": Math.abs(Number(row.cessamount || 0)),
      }));
    } else if (currentType === "EXPORT") {
      // Export invoice headers
      sheetName = "Export Invoices";
      fileName = `GSTR1_IGST_Export_${new Date().toISOString().slice(0, 10)}.xlsx`;
      exportData = filteredData.map((row) => ({
        "Export Type": row.gstno ? "WPAY" : "WOPAY",
        "Invoice Number": row.invoiceno || "",
        "Invoice Date": formatDate(row.invoicedate),
        "Invoice value": Number(row.finaltotal || 0),
        "Port Code": row.portcode || row.port_code || "",
        "Shipping Bill Number": row.shippingbillno || row.shipping_bill_no || "",
        "Shipping Bill Date": formatDate(row.shippingbilldate || row.shipping_bill_date),
        "Rate": getGstRate(row) || "",
        "Taxable Value": Number(row.subtotal2 || 0),
        "Integrated Tax": Number(row.igstamount || 0),
      }));
    } else {
      // B2B / B2C / SEZ / All Types — standard invoice headers
      const typeLabel = currentType || "All";
      sheetName = `${typeLabel} Invoices`;
      fileName = `GSTR1_IGST_${typeLabel}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      exportData = filteredData.map((row) => ({
        "GSTIN/UIN of Recipient": row.gstno || "",
        "Receiver Name": row.custname || "",
        "Invoice number": row.invoiceno || "",
        "Invoice date": formatDate(row.invoicedate),
        "Invoice value": Number(row.finaltotal || 0),
        "Place of Supply": getPlaceOfSupply(row),
        "Reverse Charge": String(row.reversecharge || row.reverse_charge || "N").toUpperCase() === "Y" ? "Y" : "N",
        "Applicable % of Tax Rate": "",
        "Invoice Type": row.isCreditNote ? "Credit Note" : getSupplierType(row),
        "E-Commerce GSTIN": row.ecomgstin || row.ecom_gstin || "",
        "Rate": getGstRate(row) || "",
        "Taxable Value": Number(row.subtotal2 || 0),
        "Integrated Tax": Number(row.igstamount || 0),
        "Central Tax": Number(row.cgstamount || 0),
        "State/UT Tax": Number(row.sgstamount || 0),
        "Cess Amount": Number(row.cessamount || 0),
      }));
    }

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    const colWidths = Object.keys(exportData[0]).map((key) => ({ wch: Math.max(key.length + 2, 16) }));
    worksheet["!cols"] = colWidths;
    XLSX.writeFile(workbook, fileName);
  };

  const table = useReactTable({
    data: filteredData,
    columns: igstColumns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  // Totals for numeric columns
  const totals = filteredData.reduce(
    (acc, row) => {
      acc.finaltotal += Number(row.finaltotal || 0);
      acc.subtotal2 += Number(row.subtotal2 || 0);
      acc.igstamount += Number(row.igstamount || 0);
      acc.cessamount += Number(row.cessamount || 0);
      acc.roundoff += Number(row.roundoff || 0);
      return acc;
    },
    { finaltotal: 0, subtotal2: 0, igstamount: 0, cessamount: 0, roundoff: 0 },
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
            onExport={exportToExcel}
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
                                        colSpan={7}
                                        className="text-right"
                                      >
                                        Total
                                      </Td>
                                    );
                                  if (idx < 7) return null;
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
                                  if (col.id === "cessamount")
                                    return (
                                      <Td key={col.id}>
                                        {totals.cessamount.toFixed(2)}
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
