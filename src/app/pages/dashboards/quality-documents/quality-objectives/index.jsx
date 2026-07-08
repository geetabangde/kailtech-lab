// Import Dependencies
import { useState, useMemo, useEffect } from "react";
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Table, Card, Spinner } from "components/ui";
import { Page } from "components/shared/Page";
import axios from "utils/axios";
import { toast } from "sonner";
import { useThemeContext } from "app/contexts/theme/context";

// Local Imports
import { columns } from "./columns";
import { Toolbar } from "./Toolbar";

// ----------------------------------------------------------------------

export default function QualityObjectivesPage() {
  const { cardSkin } = useThemeContext();
  const permissions = useMemo(() => {
    const raw = localStorage.getItem("userPermissions") || "[]";
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.map(Number) : [];
    } catch {
      return raw.trim().replace(/^\[/, "").replace(/\]$/, "").split(",").map(Number).filter((n) => !isNaN(n));
    }
  }, []);

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnVisibility, setColumnVisibility] = useState({});
  const [sorting, setSorting] = useState([{ id: "id", desc: true }]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/quality-documents/quality-verification-data");
      setData(response.data?.data || []);
    } catch (err) {
      console.error("Error fetching quality objectives:", err);
      toast.error("Failed to fetch data ❌");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (permissions.includes(468)) {
      fetchData();
    }
  }, [permissions]);

  const table = useReactTable({
    data,
    columns,
    state: {
      globalFilter,
      columnVisibility,
      sorting,
    },
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    meta: {
      refreshData: fetchData,
    },
  });

  if (!permissions.includes(468)) {
    return (
      <Page title="Quality Objectives – Access Denied">
        <div className="flex h-60 items-center justify-center rounded-xl border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-sm font-medium text-red-600 dark:text-red-400">
            ⛔ Access Denied — Permission 468 required
          </p>
        </div>
      </Page>
    );
  }

  return (
    <Page title="Quality Objectives">
      <div className="flex flex-col space-y-6">
        <Card skin={cardSkin} className="overflow-hidden shadow-xl border-gray-200 dark:border-dark-700">
          <Toolbar table={table} />

          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex h-60 items-center justify-center">
                <Spinner size="lg" />
              </div>
            ) : (
              <Table table={table} />
            )}
          </div>

          <div className="px-[var(--margin-x)] py-4 border-t border-gray-100 dark:border-dark-700">
            <Table.Pagination table={table} />
          </div>
        </Card>
      </div>
    </Page>
  );
}
