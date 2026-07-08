// Import Dependencies
import { useState } from "react";
import clsx from "clsx";
import Select from "react-select";
import { useNavigate } from "react-router";
import { DatePicker } from "components/shared/form/Datepicker";

// ----------------------------------------------------------------------

export function Toolbar({ filters, onChange, onSearch, metadata }) {
  const navigate = useNavigate();
  const { customers = [], bdList = [], customerTypes = [], specificPurposes = [] } = metadata;

  // Local state for immediate UI feedback (dates only, selections are in filters)
  const [startDate, setStartDate] = useState(filters.startdate || "");
  const [endDate, setEndDate] = useState(filters.enddate || "");

  const handleInput = (name, value) => {
    if (name === "startdate") setStartDate(value);
    if (name === "enddate") setEndDate(value);
    onChange(name, value);
  };

  const selectStyles = {
    control: (base, state) => ({
      ...base,
      minHeight: "40px",
      borderColor: state.isFocused ? "#3b82f6" : "#d1d5db",
      boxShadow: state.isFocused ? "0 0 0 2px rgba(59, 130, 246, 0.3)" : "none",
      "&:hover": {
        borderColor: state.isFocused ? "#3b82f6" : "#9ca3af",
      },
      borderRadius: "0.375rem",
      backgroundColor: "white",
      fontSize: "0.875rem",
      color: "var(--tw-prose-body)",
    }),
    option: (base) => ({
      ...base,
      fontSize: "0.875rem",
    }),
  };

  // Robust mapping based on PHP logic (value=id, label=name)
  const customerOptions = customers.map((c) => ({
    value: String(c.id || c.customerid || c.customer_id),
    label: c.customer_name || c.name || c.customername || "Unknown",
  }));

  const bdOptions = bdList.map((b) => ({
    value: String(b.id),
    label: b.bdname || `${b.firstname} ${b.lastname}` || "Unknown",
  }));

  const customerTypeOptions = customerTypes.map((t) => ({
    value: String(t.id),
    label: t.name || t.customer_type || "Unknown",
  }));

  const specificPurposeOptions = specificPurposes.map((p) => ({
    value: String(p.id),
    label: p.name || p.specific_purpose || "Unknown",
  }));

  return (
    <div className="px-[var(--margin-x)] pt-4">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold tracking-wide text-gray-800 dark:text-dark-50">
          Sales Report
        </h2>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex w-fit items-center rounded-md bg-white border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 active:scale-95 transition-all shadow-sm"
        >
          &laquo; Back
        </button>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSearch();
        }}
        className="mb-6 space-y-4"
      >
        {/* Row 1: Start Date, End Date, Customer Type, Customer */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Start Date</label>
            <DatePicker
              options={{
                dateFormat: "Y-m-d",
                altInput: true,
                altFormat: "d/m/Y",
                allowInput: true,
              }}
              value={startDate}
              onChange={(dates, dateStr) => handleInput("startdate", dateStr)}
              placeholder="Start Date"
              className={clsx(
                "h-10 w-full rounded border border-gray-300 bg-white px-3 text-sm outline-none",
                "focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all",
                "dark:border-dark-500 dark:bg-dark-900 dark:text-dark-100",
              )}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">End Date</label>
            <DatePicker
              options={{
                dateFormat: "Y-m-d",
                altInput: true,
                altFormat: "d/m/Y",
                allowInput: true,
              }}
              value={endDate}
              onChange={(dates, dateStr) => handleInput("enddate", dateStr)}
              placeholder="End Date"
              className={clsx(
                "h-10 w-full rounded border border-gray-300 bg-white px-3 text-sm outline-none",
                "focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all",
                "dark:border-dark-500 dark:bg-dark-900 dark:text-dark-100",
              )}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Customer Type</label>
            <Select
              options={customerTypeOptions}
              isClearable
              isSearchable
              placeholder="Select Type..."
              classNamePrefix="react-select"
              className="w-full text-sm"
              styles={selectStyles}
              value={customerTypeOptions.find((opt) => opt.value === String(filters.ctype))}
              onChange={(opt) => onChange("ctype", opt ? opt.value : "")}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Customer</label>
            <Select
              options={customerOptions}
              isClearable
              isSearchable
              placeholder="Select Customer..."
              classNamePrefix="react-select"
              className="w-full text-sm"
              styles={selectStyles}
              value={customerOptions.find((opt) => opt.value === String(filters.customerid))}
              onChange={(opt) => onChange("customerid", opt ? opt.value : "")}
            />
          </div>
        </div>

        {/* Row 2: BD, Specific Purpose, Search Button */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 align-bottom">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">BD</label>
            <Select
              options={bdOptions}
              isClearable
              isSearchable
              placeholder="Select BD..."
              classNamePrefix="react-select"
              className="w-full text-sm"
              styles={selectStyles}
              value={bdOptions.find((opt) => opt.value === String(filters.bd))}
              onChange={(opt) => onChange("bd", opt ? opt.value : "")}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Specific Purpose</label>
            <Select
              options={specificPurposeOptions}
              isClearable
              isSearchable
              placeholder="Select Purpose..."
              classNamePrefix="react-select"
              className="w-full text-sm"
              styles={selectStyles}
              value={specificPurposeOptions.find((opt) => opt.value === String(filters.specificpurpose))}
              onChange={(opt) => onChange("specificpurpose", opt ? opt.value : "")}
            />
          </div>

          <div className="flex flex-col justify-end">
            <button
              type="submit"
              className="flex h-10 w-full items-center justify-center rounded bg-blue-600 px-8 text-sm font-semibold text-white shadow-md transition hover:bg-blue-700 active:scale-95 sm:w-auto"
            >
              Search Report
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
