// Import Dependencies
import { useState } from "react";
import Select from "react-select";
import { DatePicker } from "components/shared/form/Datepicker";
import clsx from "clsx";

export function Toolbar({ filters, onChange, onSearch, onExport, chemists, departments }) {
  const [startdate, setStartdate] = useState(filters.startdate || "");
  const [enddate, setEnddate] = useState(filters.enddate || "");
  const [chemist, setChemist] = useState(filters.chemist || "");
  const [labid, setLabid] = useState(filters.labid || "");

  const handleInput = (name, value) => {
    if (name === "startdate") setStartdate(value);
    if (name === "enddate") setEnddate(value);
    if (name === "chemist") setChemist(value);
    if (name === "labid") setLabid(value);
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
          Pending Sample
        </h2>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSearch();
        }}
        className="flex flex-wrap items-end gap-4"
      >
        <div className="w-full sm:w-[200px]">
          <label className="dark:text-dark-300 mb-1 block text-sm font-medium text-gray-600">
            Start Date
          </label>
          <DatePicker
            options={{
              dateFormat: "Y-m-d",
              altInput: true,
              altFormat: "d/m/Y",
              allowInput: true,
            }}
            value={startdate}
            onChange={(dates, dateStr) => handleInput("startdate", dateStr)}
            placeholder="Start Date"
            className={clsx(
              "h-10 w-full rounded border border-gray-300 px-3 text-sm outline-none dark:border-dark-500 dark:bg-dark-800 dark:text-dark-100",
              "focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30",
            )}
          />
        </div>
        <div className="w-full sm:w-[200px]">
          <label className="dark:text-dark-300 mb-1 block text-sm font-medium text-gray-600">
            End Date
          </label>
          <DatePicker
            options={{
              dateFormat: "Y-m-d",
              altInput: true,
              altFormat: "d/m/Y",
              allowInput: true,
            }}
            value={enddate}
            onChange={(dates, dateStr) => handleInput("enddate", dateStr)}
            placeholder="End Date"
            className={clsx(
              "h-10 w-full rounded border border-gray-300 px-3 text-sm outline-none dark:border-dark-500 dark:bg-dark-800 dark:text-dark-100",
              "focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30",
            )}
          />
        </div>
        <div className="w-full sm:w-[240px]">
          <label className="dark:text-dark-300 mb-1 block text-sm font-medium text-gray-600">
            Chemist
          </label>
          <Select
            options={[
              { value: "", label: "Select chemist" },
              ...(chemists || []).map((chemist) => ({
                value: String(chemist.id),
                label: `${chemist.firstname} ${chemist.lastname}`,
              })),
            ]}
            value={
              chemist
                ? {
                    value: String(chemist),
                    label: (() => {
                      const found = chemists.find((c) => String(c.id) === String(chemist));
                      return found ? `${found.firstname} ${found.lastname}` : "Select chemist";
                    })(),
                  }
                : null
            }
            onChange={(option) => handleInput("chemist", option ? option.value : "")}
            isClearable
            placeholder="Select chemist"
            classNamePrefix="react-select"
            className="w-full text-sm"
            styles={selectStyles}
          />
        </div>
        <div className="w-full sm:w-[240px]">
          <label className="dark:text-dark-300 mb-1 block text-sm font-medium text-gray-600">
            Department
          </label>
          <Select
            options={[
              { value: "", label: "Select Department" },
              ...(departments || []).map((dept) => ({
                value: String(dept.id),
                label: dept.name,
              })),
            ]}
            value={
              labid
                ? {
                    value: String(labid),
                    label: (() => {
                      const found = departments.find((d) => String(d.id) === String(labid));
                      return found ? found.name : "Select Department";
                    })(),
                  }
                : null
            }
            onChange={(option) => handleInput("labid", option ? option.value : "")}
            isClearable
            placeholder="Select Department"
            classNamePrefix="react-select"
            className="w-full text-sm"
            styles={selectStyles}
          />
        </div>
        <div className="flex gap-2 pb-0.5">
          <button
            type="submit"
            className="h-10 rounded bg-blue-600 px-6 text-sm font-medium text-white hover:bg-blue-700"
          >
            Search
          </button>
          <button
            type="button"
            onClick={onExport}
            className="h-10 rounded bg-green-600 px-6 text-sm font-medium text-white hover:bg-green-700"
          >
            Export
          </button>
        </div>
      </form>
    </div>
  );
}
