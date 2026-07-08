// Import Dependencies
import { MagnifyingGlassIcon, FunnelIcon } from "@heroicons/react/24/outline";
import { useState, useEffect } from "react";
import axios from "utils/axios";

import { Button, Input } from "components/ui";

// ----------------------------------------------------------------------

export function Toolbar({ table }) {
  const [employees, setEmployees] = useState([]);
  const [filters, setFilters] = useState({
    employee: "",
    status: "",
    dstart: "",
    dend: ""
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await axios.get("/hrm/active-employee-list");
      if (response.data.status && Array.isArray(response.data.data)) {
        setEmployees(response.data.data.map(emp => ({
          value: emp.id,
          label: `${emp.firstname} ${emp.lastname}`
        })));
      }
    } catch (err) {
      console.error("Error fetching employees:", err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = () => {
    table.options.meta?.fetchData?.(filters);
  };

  const statusOptions = [
    { value: "", label: "All" },
    { value: "0", label: "Pending" },
    { value: "1", label: "Approved" },
    { value: "2", label: "Rejected" }
  ];

  return (
    <div className="table-toolbar px-[var(--margin-x)] pt-4">
      <div className="flex flex-col gap-4 mb-4">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold tracking-wide text-gray-800 dark:text-dark-50">
            View All Leaves
          </h2>
        </div>

        {/* Filters Row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-dark-200">Employee</label>
            <select
              name="employee"
              value={filters.employee}
              onChange={handleChange}
              className="w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 dark:border-dark-500 dark:bg-dark-700 dark:text-dark-100"
            >
              <option value="">Select One</option>
              {employees.map(emp => (
                <option key={emp.value} value={emp.value}>{emp.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-dark-200">Status</label>
            <select
              name="status"
              value={filters.status}
              onChange={handleChange}
              className="w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 dark:border-dark-500 dark:bg-dark-700 dark:text-dark-100"
            >
              {statusOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-dark-200">Start Date</label>
            <Input
              type="date"
              name="dstart"
              value={filters.dstart}
              onChange={handleChange}
              classNames={{ input: "h-9 text-sm" }}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-dark-200">End Date</label>
            <Input
              type="date"
              name="dend"
              value={filters.dend}
              onChange={handleChange}
              classNames={{ input: "h-9 text-sm" }}
            />
          </div>
        </div>

        <div className="flex justify-start">
          <Button
            color="primary"
            onClick={handleSearch}
            className="flex items-center gap-2"
          >
            <FunnelIcon className="size-4" />
            Go / Search
          </Button>
        </div>
      </div>
      
      <div className="flex shrink-0 space-x-2 border-t pt-4 dark:border-dark-500">
        <SearchInput table={table} />
      </div>
    </div>
  );
}

function SearchInput({ table }) {
  return (
    <Input
      value={table.getState().globalFilter}
      onChange={(e) => table.setGlobalFilter(e.target.value)}
      prefix={<MagnifyingGlassIcon className="size-4" />}
      classNames={{
        input: "h-9 text-sm ring-primary-500/50 focus:ring-3 w-64",
        root: "shrink-0",
      }}
      placeholder="Search in results..."
    />
  );
}
