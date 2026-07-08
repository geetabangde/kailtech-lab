// Import Dependencies
import { useState } from "react";
import clsx from "clsx";
import Select from "react-select";
import { DatePicker } from "components/shared/form/Datepicker";

export function Toolbar({ filters, onChange, onSearch, customers = [], bdList = [] }) {
  const [startDate, setStartDate] = useState(filters.startdate || "");
  const [endDate, setEndDate] = useState(filters.enddate || "");
  const [customer, setCustomer] = useState(filters.customerid || "");
  const [typeOfInvoice, setTypeOfInvoice] = useState(filters.typeofinvoice || "");
  const [bd, setBd] = useState(filters.bd || "");

  const handleInput = (name, value) => {
    if (name === "startdate") setStartDate(value);
    if (name === "enddate") setEndDate(value);
    if (name === "customerid") setCustomer(value);
    if (name === "typeofinvoice") setTypeOfInvoice(value);
    if (name === "bd") setBd(value);
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
          Complete Ledger
        </h2>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSearch();
        }}
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1.5fr_1fr_1fr_auto]"
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

        {/* Customer Select */}
        <Select
          options={customers.map((c) => ({
            value: String(c.id || c.customerid),
            label: c.name || c.customername || String(c.id || c.customerid),
          }))}
          value={
            customer
              ? {
                  value: String(customer),
                  label: (() => {
                    const found = customers.find(
                      (c) => String(c.id || c.customerid) === String(customer)
                    );
                    return found ? found.name || found.customername : String(customer);
                  })(),
                }
              : null
          }
          onChange={(option) => handleInput("customerid", option ? option.value : "")}
          isClearable
          isSearchable
          placeholder="Customer"
          classNamePrefix="react-select"
          className="w-full text-sm"
          styles={selectStyles}
        />

        {/* BD Select */}
        <Select
          options={bdList.map((b) => ({
            value: String(b.id),
            label: `${b.firstname} ${b.lastname}`,
          }))}
          value={
            bd
              ? {
                  value: String(bd),
                  label: (() => {
                    const found = bdList.find((b) => String(b.id) === String(bd));
                    return found ? `${found.firstname} ${found.lastname}` : String(bd);
                  })(),
                }
              : null
          }
          onChange={(option) => handleInput("bd", option ? option.value : "")}
          isClearable
          isSearchable
          placeholder="BD"
          classNamePrefix="react-select"
          className="w-full text-sm"
          styles={selectStyles}
        />

        {/* Type Select */}
        <Select
          options={[
            { value: "Sales", label: "Sales" },
            { value: "Payment", label: "Payment" },
          ]}
          value={typeOfInvoice ? { value: typeOfInvoice, label: typeOfInvoice } : null}
          onChange={(option) => handleInput("typeofinvoice", option ? option.value : "")}
          isClearable
          placeholder="Type"
          classNamePrefix="react-select"
          className="w-full text-sm"
          styles={selectStyles}
        />

        {/* Search Button */}
        <button
          type="submit"
          className="h-10 rounded bg-blue-600 px-6 text-sm font-medium text-white hover:bg-blue-700 sm:w-auto"
        >
          Search
        </button>
      </form>
    </div>
  );
}

