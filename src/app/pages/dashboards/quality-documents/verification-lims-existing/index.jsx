// Import Dependencies
import { useState, useMemo, useEffect } from "react";
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Table, Card, Spinner, Button } from "components/ui";
import { Page } from "components/shared/Page";
import axios from "utils/axios";
import { toast } from "sonner";
import { useThemeContext } from "app/contexts/theme/context";

// Local Imports
import { columns } from "./columns";
import { Toolbar } from "./Toolbar";

// ----------------------------------------------------------------------

export default function VerificationLimsPage() {
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

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/quality-documents/lims-existing-data");
      setData(response.data?.data || []);
    } catch (err) {
      console.error("Error fetching verification data:", err);
      toast.error("Failed to fetch data ❌");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (permissions.includes(469)) {
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
      openApproveModal: (row) => {
        setSelectedRow(row);
        setModalOpen(true);
      },
    },
  });

  const handleAction = async (type) => {
    if (!selectedRow) return;

    setModalLoading(true);
    try {
      const endpoint = type === "approve" ? "/quality-documents/lims-existing-approve" : "/quality-documents/lims-existing-reject";
      await axios.post(endpoint, { id: selectedRow.id });
      toast.success(`Request ${type}d successfully ✅`);
      setModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(`Error ${type}ing request:`, err);
      toast.error(`Failed to ${type} request ❌`);
    } finally {
      setModalLoading(false);
    }
  };

  if (!permissions.includes(469)) {
    return (
      <Page title="Verification - LIMS vs Existing Format">
        <div className="flex h-60 items-center justify-center rounded-xl border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-sm font-medium text-red-600 dark:text-red-400">
            ⛔ Access Denied — Permission 469 required
          </p>
        </div>
      </Page>
    );
  }

  return (
    <Page title="Verification - LIMS vs Existing Format">
      <div className="flex flex-col space-y-6">
        <Card skin={cardSkin} className="overflow-hidden">
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

          <div className="px-[var(--margin-x)] py-4">
            <Table.Pagination table={table} />
          </div>
        </Card>
      </div>

      {/* Approve/Reject Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <Card className="w-full max-w-lg p-6 space-y-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 dark:text-dark-50">
                Approve Request
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-dark-200"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-dark-300">
                Are you sure you want to approve or reject the verification request for ID: <span className="font-bold">#{selectedRow?.id}</span>?
              </p>
              <div className="p-4 bg-gray-50 dark:bg-dark-800 rounded-lg">
                <div className="text-xs uppercase text-gray-500 font-semibold mb-1">Activity</div>
                <div className="text-sm font-medium">{selectedRow?.activity}</div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-100 dark:border-dark-600">
              <Button
                variant="flat"
                onClick={() => setModalOpen(false)}
                disabled={modalLoading}
              >
                Cancel
              </Button>
              <Button
                color="danger"
                onClick={() => handleAction("reject")}
                disabled={modalLoading}
              >
                Reject
              </Button>
              <Button
                color="primary"
                onClick={() => handleAction("approve")}
                disabled={modalLoading}
              >
                {modalLoading ? "Processing..." : "Approve"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </Page>
  );
}
