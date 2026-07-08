// Import Dependencies
import { useState } from "react";
import Select from "react-select";
import { DatePicker } from "components/shared/form/Datepicker";

export function Toolbar({ filters, onChange, onSearch, departments, specificPurposes, products }) {
  const [startDate, setStartDate] = useState(filters.startdate || "");
  const [endDate, setEndDate] = useState(filters.enddate || "");
  const [department, setDepartment] = useState(filters.department || "");
  const [specificpurpose, setSpecificpurpose] = useState(filters.specificpurpose || "");
  const [product, setProduct] = useState(filters.product || "");
  const [contactperson, setContactperson] = useState(filters.contactperson || "");

  const handleInput = (name, value) => {
    if (name === "startdate") setStartDate(value);
    if (name === "enddate") setEndDate(value);
    if (name === "department") setDepartment(value);
    if (name === "specificpurpose") setSpecificpurpose(value);
    if (name === "product") setProduct(value);
    if (name === "contactperson") setContactperson(value);
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
          All Bis Disposal Register
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
        {/* First row matching PHP structure: Product, Contact Person, Start Date, End Date */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <label className="dark:text-dark-300 mb-1 block text-sm font-medium text-gray-600">
              Select Product
            </label>
            <Select
              options={[
                { value: "", label: "Select Product" },
                ...(products || []).map((product) => ({
                  value: product.id,
                  label: product.name,
                })),
              ]}
              value={
                product
                  ? {
                      value: product,
                      label: products?.find((p) => p.id === product)?.name || "",
                    }
                  : null
              }
              onChange={(opt) => handleInput("product", opt ? opt.value : "")}
              isClearable
              placeholder="Select Product"
              styles={selectStyles}
            />
          </div>
          <div>
            <label className="dark:text-dark-300 mb-1 block text-sm font-medium text-gray-600">
              Contact person Name
            </label>
            <input
              type="text"
              value={contactperson}
              onChange={(e) => handleInput("contactperson", e.target.value)}
              placeholder="Contact person Name"
              className="h-10 w-full rounded border border-gray-300 px-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 dark:border-dark-500 dark:bg-dark-800"
            />
          </div>
          <div>
            <label className="dark:text-dark-300 mb-1 block text-sm font-medium text-gray-600">
              Start Date
            </label>
            <DatePicker
              options={{ 
                dateFormat: "Y-m-d", 
                allowInput: true,
                maxDate: endDate || new Date()
              }}
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
              options={{ 
                dateFormat: "Y-m-d", 
                allowInput: true,
                minDate: startDate || null
              }}
              value={endDate}
              onChange={(_dates, str) => handleInput("enddate", str)}
              placeholder="End Date"
              className="h-10 w-full rounded border border-gray-300 px-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 dark:border-dark-500 dark:bg-dark-800"
            />
          </div>
        </div>

        {/* Second row matching PHP structure: Department, Specific Purpose, Search and Export buttons */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <label className="dark:text-dark-300 mb-1 block text-sm font-medium text-gray-600">
              Select Department
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
                      value: department,
                      label: departments?.find((d) => d.id === department)?.name || "",
                    }
                  : null
              }
              onChange={(opt) => handleInput("department", opt ? opt.value : "")}
              isClearable
              placeholder="Select Department"
              styles={selectStyles}
            />
          </div>
          <div>
            <label className="dark:text-dark-300 mb-1 block text-sm font-medium text-gray-600">
              Select Specific Purpose
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
                      value: specificpurpose,
                      label:
                        specificPurposes?.find((s) => s.id === specificpurpose)?.name || "",
                    }
                  : null
              }
              onChange={(opt) => handleInput("specificpurpose", opt ? opt.value : "")}
              isClearable
              placeholder="Select Specific Purpose"
              styles={selectStyles}
            />
          </div>
          <div className="md:col-span-2 flex items-end gap-2">
            <button
              type="submit"
              className="h-10 rounded border border-primary-600 bg-white px-6 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50"
            >
              Search
            </button>
            <button
              type="button"
              onClick={() => {
                const activeFilters = Object.fromEntries(
                  Object.entries(filters).filter((entry) => entry[1] !== "" && entry[1] !== null && entry[1] !== undefined)
                );
                window.open('/registers/exportbisregister?' + new URLSearchParams(activeFilters), '_blank');
              }}
              className="h-10 rounded border border-primary-600 bg-white px-6 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50"
            >
              Export
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
