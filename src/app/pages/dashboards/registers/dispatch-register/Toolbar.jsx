// Import Dependencies
import Select from "react-select";
import { DatePicker } from "components/shared/form/Datepicker";

export function Toolbar({ filters, onChange, onSearch, customers, purposes }) {
  const handleInput = (name, value) => {
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
          Dispatch Register
        </h2>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSearch();
        }}
        className="space-y-4"
      >
        {/* Row 1: Start Date, End Date, Select Customer, Contact person Name */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <label className="dark:text-dark-300 mb-1 block text-sm font-medium text-gray-600">
              Start Date
            </label>
            <DatePicker
              options={{ dateFormat: "Y-m-d", allowInput: true }}
              value={filters.startdate || ""}
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
              value={filters.enddate || ""}
              onChange={(_dates, str) => handleInput("enddate", str)}
              placeholder="End Date"
              className="h-10 w-full rounded border border-gray-300 px-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 dark:border-dark-500 dark:bg-dark-800"
            />
          </div>
          <div>
            <label className="dark:text-dark-300 mb-1 block text-sm font-medium text-gray-600">
              Select Customer
            </label>
            <Select
              options={[
                { value: "", label: "Select Customer" },
                ...(customers || []).map((customer) => ({
                  value: String(customer.id),
                  label: customer.name,
                })),
              ]}
              value={
                filters.customer
                  ? {
                      value: String(filters.customer),
                      label:
                        customers?.find((c) => String(c.id) === String(filters.customer))?.name ||
                        String(filters.customer),
                    }
                  : null
              }
              onChange={(opt) => handleInput("customer", opt ? opt.value : "")}
              isClearable
              placeholder="Select Customer"
              styles={selectStyles}
            />
          </div>
          <div>
            <label className="dark:text-dark-300 mb-1 block text-sm font-medium text-gray-600">
              Select Purpose
            </label>
            <Select
              options={[
                { value: "", label: "Select Purpose" },
                ...(purposes || []).map((p) => ({
                  value: String(p.id),
                  label: p.name,
                })),
              ]}
              value={
                filters.purpose
                  ? {
                      value: String(filters.purpose),
                      label:
                        purposes?.find((p) => String(p.id) === String(filters.purpose))?.name ||
                        String(filters.purpose),
                    }
                  : null
              }
              onChange={(opt) => handleInput("purpose", opt ? opt.value : "")}
              isClearable
              placeholder="Select Purpose"
              styles={selectStyles}
            />
          </div>
        </div>

        {/* Row 2: Contact person Name, LRN, BRN */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <label className="dark:text-dark-300 mb-1 block text-sm font-medium text-gray-600">
              Contact person Name
            </label>
            <input
              type="text"
              value={filters.contactperson || ""}
              onChange={(e) => handleInput("contactperson", e.target.value)}
              placeholder="Contact person Name"
              className="h-10 w-full rounded border border-gray-300 px-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 dark:border-dark-500 dark:bg-dark-800"
            />
          </div>
          <div>
            <label className="dark:text-dark-300 mb-1 block text-sm font-medium text-gray-600">
              LRN
            </label>
            <input
              type="text"
              value={filters.lrn || ""}
              onChange={(e) => handleInput("lrn", e.target.value)}
              placeholder="LRN"
              className="h-10 w-full rounded border border-gray-300 px-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 dark:border-dark-500 dark:bg-dark-800"
            />
          </div>
          <div>
            <label className="dark:text-dark-300 mb-1 block text-sm font-medium text-gray-600">
              BRN
            </label>
            <input
              type="text"
              value={filters.brn || ""}
              onChange={(e) => handleInput("brn", e.target.value)}
              placeholder="BRN"
              className="h-10 w-full rounded border border-gray-300 px-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 dark:border-dark-500 dark:bg-dark-800"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-start gap-2 pt-2">
          <button
            type="submit"
            className="rounded bg-green-600 px-6 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            Search
          </button>
          <button
            type="button"
            onClick={() => window.open('/registers/exportdicpatchregistertesting?' + new URLSearchParams(filters), '_blank')}
            className="rounded border border-gray-300 bg-white px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Export
          </button>
        </div>
      </form>
    </div>
  );
}
