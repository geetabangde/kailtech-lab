// Import Dependencies
import { useState, useEffect } from "react";
import clsx from "clsx";
import { useNavigate } from "react-router";
import axios from "utils/axios";
import Select from "react-select";
import { DatePicker } from "components/shared/form/Datepicker";

export function Toolbar({ table, filters, onChange, onSearch }) {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);

  // Fetch customer list on mount
  useEffect(() => {
    axios
      .get("/people/get-all-customers")
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : res.data?.data || res.data?.Data || [];
        setCustomers(list);
      })
      .catch((err) => console.error("Failed to load customers:", err));
  }, []);

  const customerOptions = customers.map((c) => ({
    value: c.id,
    label: c.name,
  }));

  const selectStyles = {
    control: (base) => ({
      ...base,
      height: "40px",
      minHeight: "40px",
      borderRadius: "0.25rem",
      borderColor: "#d1d5db",
      "&:hover": {
        borderColor: "#3b82f6",
      },
      fontSize: "0.875rem",
    }),
    valueContainer: (base) => ({
      ...base,
      padding: "0 12px",
    }),
    option: (base) => ({
      ...base,
      fontSize: "0.875rem",
      color: "#374151",
    }),
  };

  const today = new Date().toISOString().split("T")[0];

  const handleExport = () => {
    if (!table) return;
    const headers = table
      .getHeaderGroups()[0]
      .headers.map((h) => h.column.columnDef.header)
      .filter(Boolean);
    const rows = table.getFilteredRowModel().rows;

    const escapeCell = (value) =>
      String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    const bodyRows = rows
      .map((row) => {
        const cells = row.getVisibleCells().map((cell) => {
          const val =
            typeof cell.getValue === "function" ? cell.getValue() : cell.value;
          return `<td>${escapeCell(val)}</td>`;
        });
        return `<tr>${cells.join("")}</tr>`;
      })
      .join("");

    const html = `<table><thead><tr>${headers
      .map((h) => `<th>${escapeCell(h)}</th>`)
      .join("")}</tr></thead><tbody>${bodyRows}</tbody></table>`;

    const blob = new Blob([html], {
      type: "application/vnd.ms-excel;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "gstr1.xls";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="px-[var(--margin-x)] pt-4">
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-xl font-semibold tracking-wide text-gray-800 dark:text-dark-50">
          GSTR-1 Report
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex h-10 items-center rounded-md border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-dark-500 dark:bg-dark-600 dark:text-dark-100"
          >
            &laquo; Back
          </button>
          <button
            onClick={() => navigate("/dashboards/accounts/igst")}
            className="inline-flex h-10 items-center rounded-md bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700"
          >
            IGST
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[200px_200px_1fr_auto_auto]">
        {/* Start Date */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500 uppercase">Start Date</label>
          <DatePicker
            options={{
              dateFormat: "Y-m-d",
              altInput: true,
              altFormat: "d/m/Y",
              allowInput: true,
              maxDate: today,
            }}
            value={filters.startdate}
            onChange={(dates, dateStr) => onChange("startdate", dateStr)}
            className={clsx(
              "h-10 w-full rounded border border-gray-300 px-3 text-sm outline-none bg-white",
              "focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500",
              "dark:bg-dark-900 dark:border-dark-500 dark:text-dark-100"
            )}
          />
        </div>

        {/* End Date */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500 uppercase">End Date</label>
          <DatePicker
            options={{
              dateFormat: "Y-m-d",
              altInput: true,
              altFormat: "d/m/Y",
              allowInput: true,
              maxDate: today,
            }}
            value={filters.enddate}
            onChange={(dates, dateStr) => onChange("enddate", dateStr)}
            className={clsx(
              "h-10 w-full rounded border border-gray-300 px-3 text-sm outline-none bg-white",
              "focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500",
              "dark:bg-dark-900 dark:border-dark-500 dark:text-dark-100"
            )}
          />
        </div>

        {/* Customer Select */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500 uppercase">Customer</label>
          <Select
            options={customerOptions}
            isClearable
            isSearchable
            placeholder="Search Customer..."
            styles={selectStyles}
            value={customerOptions.find((opt) => opt.value === filters.customerid) || null}
            onChange={(opt) => onChange("customerid", opt ? opt.value : "")}
            className="react-select-container"
            classNamePrefix="react-select"
          />
        </div>

        <div className="flex flex-col gap-1 justify-end">
          <button
            onClick={onSearch}
            className="h-10 rounded bg-blue-600 px-6 text-sm font-medium text-white hover:bg-blue-700 transition-colors shadow-sm"
          >
            Search
          </button>
        </div>
        <div className="flex flex-col gap-1 justify-end">
          <button
            onClick={handleExport}
            className="h-10 rounded border border-blue-600 bg-white px-6 text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors dark:bg-dark-900 dark:hover:bg-dark-800"
          >
            Export
          </button>
        </div>
      </div>
    </div>
  );
}
