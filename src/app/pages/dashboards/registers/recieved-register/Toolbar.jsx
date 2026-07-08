// Import Dependencies
import { useState } from "react";
import Select from "react-select";
import { DatePicker } from "components/shared/form/Datepicker";

export function Toolbar({ filters, onChange, onSearch, departments = [] }) {
  const [startDate, setStartDate] = useState(filters.startdate || "");
  const [endDate, setEndDate] = useState(filters.enddate || "");
  const [rdept, setRdept] = useState(filters.rdept || "");

  const handleInput = (name, value) => {
    if (name === "startdate") setStartDate(value);
    if (name === "enddate") setEndDate(value);
    if (name === "rdept") setRdept(value);
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
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold tracking-wide text-gray-800 dark:text-dark-50">
          Received Register
        </h2>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSearch();
        }}
        className="space-y-4"
      >
        <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4">
          <div>
            <label className="dark:text-dark-300 mb-1 block text-sm font-medium text-gray-600">
              Start Date
            </label>
            <DatePicker
              options={{ dateFormat: "Y-m-d", allowInput: true }}
              value={startDate}
              onChange={(_dates, str) => handleInput("startdate", str)}
              placeholder="Start Date"
              className="h-10 w-full rounded border border-gray-300 px-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 dark:border-dark-500 dark:bg-dark-800"
            />
          </div>
          <div>
            <label className="dark:text-dark-300 mb-1 block text-sm font-medium text-gray-600">
              End Date
            </label>
            <DatePicker
              options={{ dateFormat: "Y-m-d", allowInput: true }}
              value={endDate}
              onChange={(_dates, str) => handleInput("enddate", str)}
              placeholder="End Date"
              className="h-10 w-full rounded border border-gray-300 px-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 dark:border-dark-500 dark:bg-dark-800"
            />
          </div>
          <div>
            <label className="dark:text-dark-300 mb-1 block text-sm font-medium text-gray-600">
              Select Department
            </label>
            <Select
              options={departments.map((d) => ({
                value: String(d.id),
                label: d.lab_name || d.name || String(d.id),
              }))}
              value={
                rdept
                  ? {
                      value: String(rdept),
                      label:
                        departments.find((d) => String(d.id) === String(rdept))?.lab_name ||
                        departments.find((d) => String(d.id) === String(rdept))?.name ||
                        String(rdept),
                    }
                  : null
              }
              onChange={(opt) => handleInput("rdept", opt ? opt.value : "")}
              isClearable
              placeholder="Select Department"
              styles={selectStyles}
            />
          </div>
          <div className="flex">
            <button
              type="submit"
              className="h-10 rounded bg-gray-600 px-6 py-2 text-sm font-medium text-white hover:bg-gray-700"
            >
              Search
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
