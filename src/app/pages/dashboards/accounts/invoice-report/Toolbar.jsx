// Import Dependencies
import { useState } from "react";
import clsx from "clsx";
import { useNavigate } from "react-router";
import Select from "react-select";
import { DatePicker } from "components/shared/form/Datepicker";

export function Toolbar({ filters, onChange, onSearch, customers = [], bdList = [] }) {
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState(filters.startdate || "");
  const [endDate, setEndDate] = useState(filters.enddate || "");
  const [customer, setCustomer] = useState(filters.customerid || "");
  const [bd, setBd] = useState(filters.bd || "");
  const [typeOfInvoice, setTypeOfInvoice] = useState(filters.typeofinvoice || "");

  const handleInput = (name, value) => {
    if (name === "startdate") setStartDate(value);
    if (name === "enddate") setEndDate(value);
    if (name === "customerid") setCustomer(value);
    if (name === "bd") setBd(value);
    if (name === "typeofinvoice") setTypeOfInvoice(value);
    onChange(name, value);
  };

  return (
    <div className="px-[var(--margin-x)] pt-4">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold tracking-wide text-gray-800 dark:text-dark-50">
          Invoice List
        </h2>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex w-fit items-center rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          &laquo; Back
        </button>
      </div>

      {/* Filter row — matches PHP form layout */}
      <form
        onSubmit={onSearch}
        className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1fr_1fr_auto]"
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

        {/* Customer — using react-select to match AddCreditNote.jsx */}
        <Select
          options={customers.map((c) => ({
            value: String(c.id || c.customerid || c.customer_id),
            label: c.name || c.customername || c.customer_name || String(c.id || c.customerid || c.customer_id),
          }))}
          value={
            customer
              ? {
                value: String(customer),
                label: (() => {
                  const found = customers.find(
                    (c) => String(c.id || c.customerid || c.customer_id) === String(customer)
                  );
                  return found
                    ? found.name || found.customername || found.customer_name || String(found.id || found.customerid || found.customer_id)
                    : String(customer);
                })(),
              }
              : null
          }
          onChange={(option) => {
            handleInput("customerid", option ? option.value : "");
          }}
          isClearable
          isSearchable
          placeholder="Customer"
          classNamePrefix="react-select"
          className="w-full text-sm"
          styles={{
            control: (base, state) => ({
              ...base,
              minHeight: "40px",
              borderColor: state.isFocused ? "#3b82f6" : "#d1d5db",
              boxShadow: state.isFocused ? "0 0 0 2px rgba(59, 130, 246, 0.3)" : "none",
              "&:hover": {
                borderColor: state.isFocused ? "#3b82f6" : "#9ca3af",
              },
            }),
          }}
        />

        {/* BD — using react-select for consistency */}
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
          onChange={(option) => {
            handleInput("bd", option ? option.value : "");
          }}
          isClearable
          isSearchable
          placeholder="BD"
          classNamePrefix="react-select"
          className="w-full text-sm"
          styles={{
            control: (base, state) => ({
              ...base,
              minHeight: "40px",
              borderColor: state.isFocused ? "#3b82f6" : "#d1d5db",
              boxShadow: state.isFocused ? "0 0 0 2px rgba(59, 130, 246, 0.3)" : "none",
              "&:hover": {
                borderColor: state.isFocused ? "#3b82f6" : "#9ca3af",
              },
            }),
          }}
        />

        {/* Invoice Type — using react-select for consistency */}
        <Select
          options={[
            { value: "Calibration", label: "Calibration" },
            { value: "Testing", label: "Testing" },
          ]}
          value={
            typeOfInvoice
              ? { value: typeOfInvoice, label: typeOfInvoice }
              : null
          }
          onChange={(option) => {
            handleInput("typeofinvoice", option ? option.value : "");
          }}
          isClearable
          isSearchable
          placeholder="Type"
          classNamePrefix="react-select"
          className="w-full text-sm"
          styles={{
            control: (base, state) => ({
              ...base,
              minHeight: "40px",
              borderColor: state.isFocused ? "#3b82f6" : "#d1d5db",
              boxShadow: state.isFocused ? "0 0 0 2px rgba(59, 130, 246, 0.3)" : "none",
              "&:hover": {
                borderColor: state.isFocused ? "#3b82f6" : "#9ca3af",
              },
            }),
          }}
        />

        {/* Search button */}
        <button
          type="submit"
          className="h-10 rounded bg-blue-600 px-5 text-sm font-medium text-white hover:bg-blue-700"
        >
          Search
        </button>
      </form>
    </div>
  );
}
