// Import Dependencies
import { useState, useEffect } from "react";
import clsx from "clsx";
import { useNavigate } from "react-router";
import axios from "utils/axios";
import Select from "react-select";
import { DatePicker } from "components/shared/form/Datepicker";

export function IgstToolbar({ filters, onChange, onSearch, onExport }) {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);

  // Fetch active customers
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

  const today = new Date();

  let startMaxDate = today;
  if (filters.enddate) {
    const [d, m, y] = filters.enddate.split('/');
    if (d && m && y) {
      startMaxDate = new Date(`${y}-${m}-${d}`);
    }
  }

  let endMinDate = null;
  if (filters.startdate) {
    const [d, m, y] = filters.startdate.split('/');
    if (d && m && y) {
      endMinDate = new Date(`${y}-${m}-${d}`);
    }
  }



  return (
    <div className="px-[var(--margin-x)] pt-4">
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-xl font-semibold tracking-wide text-gray-800 dark:text-dark-50">
          GSTR-1 IGST Report
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex h-10 items-center rounded-md border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-dark-500 dark:bg-dark-600 dark:text-dark-100"
          >
            &laquo; Back
          </button>
          <button
            onClick={() => navigate("/dashboards/accounts/gstr-1")}
            className="inline-flex h-10 items-center rounded-md bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700"
          >
            SGST + CGST
          </button>
          <button
            onClick={onExport}
            className="inline-flex h-10 items-center rounded-md bg-green-600 px-4 text-sm font-medium text-white hover:bg-green-700 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="mr-1.5 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM8.5 16l2-3-2-3H10l1.25 2L12.5 10H14l-2 3 2 3h-1.5l-1.25-2L10 16H8.5z"/>
            </svg>
            Download Excel
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[180px_180px_180px_1fr_auto]">
        {/* Start Date */}
        <div className="flex flex-col gap-1 justify-end">
          <DatePicker
            options={{
              dateFormat: "d/m/Y",
              allowInput: false,
              maxDate: startMaxDate,
            }}
            hasCalenderIcon={false}
            placeholder="Start Date"
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
        <div className="flex flex-col gap-1 justify-end">
          <DatePicker
            options={{
              dateFormat: "d/m/Y",
              allowInput: false,
              maxDate: today,
              minDate: endMinDate,
            }}
            hasCalenderIcon={false}
            placeholder="End Date"
            value={filters.enddate}
            onChange={(dates, dateStr) => onChange("enddate", dateStr)}
            className={clsx(
              "h-10 w-full rounded border border-gray-300 px-3 text-sm outline-none bg-white",
              "focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500",
              "dark:bg-dark-900 dark:border-dark-500 dark:text-dark-100"
            )}
          />
        </div>

        {/* Invoice Type */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500 uppercase">Invoice Type</label>
          <Select
            options={[
              { value: "", label: "All Types" },
              { value: "B2B", label: "B2B" },
              { value: "B2C", label: "B2C" },
              { value: "EXPORT", label: "Export" },
              { value: "SEZ", label: "SEZ" },
              { value: "CREDIT_NOTE", label: "Credit Notes" },
            ]}
            placeholder="Invoice Type..."
            styles={selectStyles}
            value={[
              { value: "", label: "All Types" },
              { value: "B2B", label: "B2B" },
              { value: "B2C", label: "B2C" },
              { value: "EXPORT", label: "Export" },
              { value: "SEZ", label: "SEZ" },
              { value: "CREDIT_NOTE", label: "Credit Notes" },
            ].find((opt) => opt.value === filters.supplierType) || { value: "", label: "All Types" }}
            onChange={(opt) => onChange("supplierType", opt ? opt.value : "")}
            className="react-select-container"
            classNamePrefix="react-select"
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
      </div>
    </div>
  );
}
