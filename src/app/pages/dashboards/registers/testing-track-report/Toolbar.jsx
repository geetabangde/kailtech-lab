// Import Dependencies
import { useState } from "react";
import Select from "react-select";
import { DatePicker } from "components/shared/form/Datepicker";

export function Toolbar({ filters, onChange, onSearch, bdList = [], customers = [], labs = [], chemists = [] }) {
  const [date, setDate] = useState(filters.date || "");
  const [startDate, setStartDate] = useState(filters.startdate || "");
  const [endDate, setEndDate] = useState(filters.enddate || "");
  const [bd, setBd] = useState(filters.bd || "");
  const [customer, setCustomer] = useState(filters.customer || "");
  const [transfertolab, setTransfertolab] = useState(filters.transfertolab || "");
  const [ch, setCh] = useState(filters.ch || "");
  const [checknull, setChecknull] = useState(filters.checknull || "");
  const [color, setColor] = useState(filters.color || "");

  const handleInput = (name, value) => {
    if (name === "date") setDate(value);
    if (name === "startdate") setStartDate(value);
    if (name === "enddate") setEndDate(value);
    if (name === "bd") setBd(value);
    if (name === "customer") setCustomer(value);
    if (name === "transfertolab") setTransfertolab(value);
    if (name === "ch") setCh(value);
    if (name === "checknull") setChecknull(value);
    if (name === "color") setColor(value);
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

  const dateSelectOptions = [
    { value: "date", label: "Booking Date" },
    { value: "interim_yes", label: "Tentative Report Date (INTERIM)" },
    { value: "longterm", label: "Tentative Report Date (LONGTERM)" },
    { value: "interim_no", label: "Tentative Report Date" },
    { value: "reportdate", label: "Interim Issued Date / ULR Generate Date" },
    { value: "finalreportDate", label: "Final Report Date" },
    { value: "approved_on", label: "Bill Date" },
    { value: "approvedon", label: "Dispatch Date" },
  ];

  const checkNullOptions = [
    { value: "reportdate", label: "Interim Issued Date / ULR Generate Date" },
    { value: "finalreportDate", label: "Final Report Date" },
    { value: "approved_on", label: "Bill Date" },
    { value: "approvedon", label: "Dispatch Date" },
  ];

  const colorOptions = [
    { value: "red", label: "Red" },
    { value: "blue", label: "Blue" },
    { value: "yellow", label: "Yellow" },
  ];

  return (
    <div className="px-[var(--margin-x)] pt-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold tracking-wide text-gray-800 dark:text-dark-50">
          List of Testing Records
        </h2>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSearch();
        }}
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
      >
        <Select
          options={dateSelectOptions}
          value={dateSelectOptions.find((o) => o.value === date) || null}
          onChange={(opt) => handleInput("date", opt ? opt.value : "")}
          isClearable
          placeholder="Select Date Type"
          styles={selectStyles}
        />
        <DatePicker
          options={{ dateFormat: "Y-m-d", altInput: true, altFormat: "d/m/Y", allowInput: true }}
          value={startDate}
          onChange={(_dates, str) => handleInput("startdate", str)}
          placeholder="Start Date"
          className="h-10 w-full rounded border border-gray-300 px-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 dark:border-dark-500 dark:bg-dark-800"
        />
        <DatePicker
          options={{ dateFormat: "Y-m-d", altInput: true, altFormat: "d/m/Y", allowInput: true }}
          value={endDate}
          onChange={(_dates, str) => handleInput("enddate", str)}
          placeholder="End Date"
          className="h-10 w-full rounded border border-gray-300 px-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 dark:border-dark-500 dark:bg-dark-800"
        />
        <Select
          options={bdList.map((b) => ({ value: String(b.id), label: `${b.firstname} ${b.lastname}` }))}
          value={bd ? { value: String(bd), label: (() => { const f = bdList.find((x) => String(x.id) === String(bd)); return f ? `${f.firstname} ${f.lastname}` : String(bd); })() } : null}
          onChange={(opt) => handleInput("bd", opt ? opt.value : "")}
          isClearable
          isSearchable
          placeholder="Concerned BD"
          styles={selectStyles}
        />
        <Select
          options={customers.map((c) => ({ value: c.name, label: c.name }))}
          value={customer ? { value: customer, label: customer } : null}
          onChange={(opt) => handleInput("customer", opt ? opt.value : "")}
          isClearable
          isSearchable
          placeholder="Customers"
          styles={selectStyles}
        />
        <Select
          options={labs.map((l) => ({ value: String(l.id), label: l.name }))}
          value={transfertolab ? { value: String(transfertolab), label: (() => { const f = labs.find((x) => String(x.id) === String(transfertolab)); return f ? f.name : String(transfertolab); })() } : null}
          onChange={(opt) => handleInput("transfertolab", opt ? opt.value : "")}
          isClearable
          isSearchable
          placeholder="Department (Lab)"
          styles={selectStyles}
        />
        <Select
          options={chemists.map((c) => ({ value: String(c.id), label: `${c.firstname} ${c.lastname}` }))}
          value={ch ? { value: String(ch), label: (() => { const f = chemists.find((x) => String(x.id) === String(ch)); return f ? `${f.firstname} ${f.lastname}` : String(ch); })() } : null}
          onChange={(opt) => handleInput("ch", opt ? opt.value : "")}
          isClearable
          isSearchable
          placeholder="Chemist/Engineer"
          styles={selectStyles}
        />
        <Select
          options={checkNullOptions}
          value={checkNullOptions.find((o) => o.value === checknull) || null}
          onChange={(opt) => handleInput("checknull", opt ? opt.value : "")}
          isClearable
          placeholder="Select Not Null"
          styles={selectStyles}
        />
        <Select
          options={colorOptions}
          value={colorOptions.find((o) => o.value === color) || null}
          onChange={(opt) => handleInput("color", opt ? opt.value : "")}
          isClearable
          placeholder="Select Color"
          styles={selectStyles}
        />
        <button
          type="submit"
          className="h-10 rounded bg-blue-600 px-6 text-sm font-medium text-white hover:bg-blue-700 w-full md:w-auto md:col-span-1"
        >
          Search
        </button>
      </form>
    </div>
  );
}
