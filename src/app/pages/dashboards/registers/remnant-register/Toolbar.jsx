// Import Dependencies
import { useState } from "react";
import Select from "react-select";
import { DatePicker } from "components/shared/form/Datepicker";

export function Toolbar({ filters, onChange, onSearch, departments, customerTypes, specificPurposes }) {
  const [startDate, setStartDate] = useState(filters.startdate || "");
  const [endDate, setEndDate] = useState(filters.enddate || "");
  const [department, setDepartment] = useState(filters.department || "");
  const [ctype, setCtype] = useState(filters.ctype || "");
  const [specificpurpose, setSpecificpurpose] = useState(filters.specificpurpose || "");

  const handleInput = (name, value) => {
    if (name === "startdate") setStartDate(value);
    if (name === "enddate") setEndDate(value);
    if (name === "department") setDepartment(value);
    if (name === "ctype") setCtype(value);
    if (name === "specificpurpose") setSpecificpurpose(value);
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
          Remnant Register
        </h2>
      </div>

      {/* Form matching PHP structure */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSearch();
        }}
        className="space-y-4"
      >
        {/* Date and Department inputs row matching PHP table structure */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <label className="dark:text-dark-300 mb-1 block text-sm font-medium text-gray-600">
              Disposal Date
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
              Department
            </label>
            <Select
              options={[
                { value: "", label: "Select Department" },
                ...(departments || []).map((dept) => ({
                  value: dept.id,
                  label: dept.name,
                })),
              ]}
              value={
                department
                  ? {
                      value: String(department),
                      label:
                        departments?.find((d) => String(d.id) === String(department))?.name ||
                        String(department),
                    }
                  : null
              }
              onChange={(opt) => handleInput("department", opt ? opt.value : "")}
              isClearable
              placeholder="Select Department"
              styles={selectStyles}
            />
          </div>
        </div>

        {/* Customer Type and Specific Purpose row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          <div>
            <label className="dark:text-dark-300 mb-1 block text-sm font-medium text-gray-600">
              Customer Type
            </label>
            <Select
              options={[
                { value: "", label: "Select Customer Type" },
                ...(customerTypes || []).map((ctype) => ({
                  value: ctype.id,
                  label: ctype.name,
                })),
              ]}
              value={
                ctype
                  ? {
                      value: String(ctype),
                      label:
                        customerTypes?.find((c) => String(c.id) === String(ctype))?.name ||
                        String(ctype),
                    }
                  : null
              }
              onChange={(opt) => handleInput("ctype", opt ? opt.value : "")}
              isClearable
              placeholder="Select Customer Type"
              styles={selectStyles}
            />
          </div>
          <div className="md:col-span-2">
            <label className="dark:text-dark-300 mb-1 block text-sm font-medium text-gray-600">
              Specific Purpose
            </label>
            <Select
              options={[
                { value: "", label: "Select Specific Purpose" },
                ...(specificPurposes || []).map((purpose) => ({
                  value: purpose.id,
                  label: purpose.name,
                })),
              ]}
              value={
                specificpurpose
                  ? {
                      value: String(specificpurpose),
                      label:
                        specificPurposes?.find((p) => String(p.id) === String(specificpurpose))?.name ||
                        String(specificpurpose),
                    }
                  : null
              }
              onChange={(opt) => handleInput("specificpurpose", opt ? opt.value : "")}
              isClearable
              placeholder="Select Specific Purpose"
              styles={selectStyles}
            />
          </div>
        </div>

        {/* Search button */}
        <div className="flex justify-start">
          <button
            type="submit"
            className="rounded bg-green-600 px-6 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            Search
          </button>
        </div>
      </form>
    </div>
  );
}
