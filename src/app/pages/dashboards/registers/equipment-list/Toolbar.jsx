// Import Dependencies
import { useState } from "react";
import Select from "react-select";
import { toast } from "sonner";

export function Toolbar({ filters, onChange, onSearch, onExport, categories, departments }) {
  const [category, setCategory] = useState(filters.category || "");
  const [selectedDepartments, setSelectedDepartments] = useState(filters.department || []);

  const handleInput = (name, value) => {
    if (name === "category") setCategory(value);
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
      {/* Form matching PHP structure */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!selectedDepartments || selectedDepartments.length === 0) {
            toast.error("Please select at least one department");
            return;
          }
          onSearch();
        }}
        className="flex flex-wrap items-end gap-4"
      >
        <div className="w-full sm:w-[240px]">
          <label className="dark:text-dark-300 mb-1 block text-sm font-medium text-gray-600">
            Category
          </label>
          <Select
            options={[
              { value: "", label: "All" },
              ...(categories || []).map((cat) => ({
                value: String(cat.id),
                label: cat.name,
              })),
            ]}
            value={
              category
                ? {
                    value: String(category),
                    label: (() => {
                      const found = categories.find((cat) => String(cat.id) === String(category));
                      return found ? found.name : String(category);
                    })(),
                  }
                : null
            }
            onChange={(option) => handleInput("category", option ? option.value : "")}
            isClearable
            placeholder="All"
            classNamePrefix="react-select"
            className="w-full text-sm"
            styles={selectStyles}
          />
        </div>
        <div className="w-full sm:w-[320px]">
          <label className="dark:text-dark-300 mb-1 block text-sm font-medium text-gray-600">
            Department <span className="text-red-500">*</span>
          </label>
          <Select
            options={[
              { value: "", label: "Select Department" },
              ...(departments || []).map((dept) => ({
                value: dept.id,
                label: dept.name,
              })),
            ]}
            value={selectedDepartments.map((id) => ({
              value: String(id),
              label: (() => {
                const found = departments.find((dept) => String(dept.id) === String(id));
                return found ? found.name : String(id);
              })(),
            }))}
            onChange={(options) => handleInput("department", options ? options.map((opt) => opt.value) : [])}
            isMulti
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
            onClick={(e) => {
              if (!selectedDepartments || selectedDepartments.length === 0) {
                toast.error("Please select at least one department");
                return;
              }
              onExport(e);
            }}
            className="h-10 rounded bg-green-600 px-6 text-sm font-medium text-white hover:bg-green-700"
          >
            Export
          </button>
        </div>
      </form>
    </div>
  );
}
