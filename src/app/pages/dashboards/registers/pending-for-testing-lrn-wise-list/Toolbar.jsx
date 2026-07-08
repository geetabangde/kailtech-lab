// Import Dependencies
import { useState } from "react";
import clsx from "clsx";
import Select from "react-select";
import { DatePicker } from "components/shared/form/Datepicker";

export function Toolbar({ filters, onChange, onSearch, chemists = [] }) {
  const [startDate, setStartDate] = useState(filters.startdate || "");
  const [endDate, setEndDate] = useState(filters.enddate || "");
  const [chemist, setChemist] = useState(filters.chemist || "");

  const handleInput = (name, value) => {
    if (name === "startdate") setStartDate(value);
    if (name === "enddate") setEndDate(value);
    if (name === "chemist") setChemist(value);
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
    }),
  };

  return (
    <div className="px-[var(--margin-x)] pt-4">
      <div className="mb-4">
        <h2 className="text-xl font-semibold tracking-wide text-gray-800 dark:text-dark-50">
          Chemist List
        </h2>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSearch();
        }}
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_2fr_auto]"
      >
        {/* Start Date */}
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
            "h-10 w-full rounded border border-gray-300 px-3 text-sm outline-none dark:border-dark-500 dark:bg-dark-800 dark:text-dark-100",
            "focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30",
          )}
        />

        {/* End Date */}
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
            "h-10 w-full rounded border border-gray-300 px-3 text-sm outline-none dark:border-dark-500 dark:bg-dark-800 dark:text-dark-100",
            "focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30",
          )}
        />

        {/* Chemist Select — sourced from admin users (status=1) */}
        <Select
          options={chemists.map((c) => ({
            value: String(c.id),
            label: `${c.firstname || ""} ${c.lastname || ""}`.trim() || c.name || String(c.id),
          }))}
          value={
            chemist
              ? {
                  value: String(chemist),
                  label: (() => {
                    const found = chemists.find((c) => String(c.id) === String(chemist));
                    return found
                      ? `${found.firstname || ""} ${found.lastname || ""}`.trim() || found.name
                      : String(chemist);
                  })(),
                }
              : null
          }
          onChange={(option) => handleInput("chemist", option ? option.value : "")}
          isClearable
          isSearchable
          placeholder="Select Chemist"
          classNamePrefix="react-select"
          className="w-full text-sm"
          styles={selectStyles}
        />

        {/* Search Button */}
        <button
          type="submit"
          className="h-10 rounded bg-green-600 px-6 text-sm font-medium text-white hover:bg-green-700 sm:w-auto"
        >
          Search
        </button>
      </form>
    </div>
  );
}
