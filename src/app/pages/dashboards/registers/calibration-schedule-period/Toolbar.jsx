// Import Dependencies
import { useState } from "react";
import clsx from "clsx";
import Select from "react-select";
import { DatePicker } from "components/shared/form/Datepicker";

export function Toolbar({ filters, onChange, onSearch, onExport, departments = [] }) {
  const [startDate, setStartDate] = useState(filters.startdate || "");
  const [endDate, setEndDate] = useState(filters.enddate || "");
  const [selectedDepartments, setSelectedDepartments] = useState(filters.department || []);

  const handleInput = (name, value) => {
    if (name === "startdate") setStartDate(value);
    if (name === "enddate") setEndDate(value);
    if (name === "department") setSelectedDepartments(value);
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

        {/* Department Select */}
        <Select
          options={departments.map((dept) => ({
            value: String(dept.id),
            label: dept.name || String(dept.id),
          }))}
          value={selectedDepartments.map(id => ({
            value: String(id),
            label: (() => {
              const found = departments.find((dept) => String(dept.id) === String(id));
              return found ? found.name : String(id);
            })(),
          }))}
          onChange={(options) => handleInput("department", options ? options.map(opt => opt.value) : [])}
          isMulti
          isClearable
          isSearchable
          placeholder="Select Department"
          classNamePrefix="react-select"
          className="w-full text-sm"
          styles={selectStyles}
        />

        {/* Buttons */}
        <div className="flex gap-2">
          <button
            type="submit"
            className="h-10 rounded bg-blue-600 px-6 text-sm font-medium text-white hover:bg-blue-700 sm:w-auto"
          >
            Search
          </button>
          <button
            type="button"
            onClick={onExport}
            className="h-10 rounded bg-green-600 px-6 text-sm font-medium text-white hover:bg-green-700 sm:w-auto"
          >
            Export
          </button>
        </div>
      </form>
    </div>
  );
}
