// ── TrfProductsList.jsx — EditItemModal integrated ──────────────────────────
// Changes:
//   1. EditItemModal import kiya
//   2. editModal state add kiya { show, itemId }
//   3. ActionCell ke "Edit Item Detail" button → openEditModal
//   4. <EditItemModal> render kiya bottom pe

import { useState, useEffect, useCallback } from "react";
import axios from "utils/axios";
import { useNavigate, useParams, useLocation, Link } from "react-router-dom";
import TrfItemForm from "./TrfItemForm";
import EditItemModal from "./EditItemModal";   // ✅ NEW IMPORT
import { toast } from "sonner";
import { Pagination, PaginationItems, PaginationNext, PaginationPrevious } from "components/ui";
import { TableSortIcon } from "components/shared/table/TableSortIcon";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

// ── Permissions from localStorage ────────────────────────────────────────────
function usePermissions() {
  return localStorage.getItem("userPermissions")?.split(",").map(Number) || [];
}

// ── Action Buttons ────────────────────────────────────────────────────────────
function ActionCell({ row, onEdit, onDelete, onCancelLRN, onClone, trfId }) {
  const permissions = usePermissions();

  const tid = row.id;
  const trfstatus = Number(row.status);
  const packtype = Number(row.pack_type ?? 1);
  const reportid = row.report ?? 0;

  if (trfstatus === 99) {
    return <span className="text-xs italic text-gray-400">LRN Cancelled</span>;
  }

  const pendingOk =
    row.pending_signature_status === 0 ||
    row.pending_signature_status === "" ||
    row.pending_signature_status == null;

  const canEditItem = pendingOk && permissions.includes(367);
  const canCancelLRN =
    pendingOk &&
    permissions.includes(268) &&
    !row.invoice &&
    !row.ulr;

  return (
    <div className="flex flex-wrap items-center gap-1.5">

      {trfstatus === 1 && (
        <>
          <ActionBtn color="cyan" onClick={() => onDelete(tid)}>Remove Item</ActionBtn>
          <ActionBtn color="blue" onClick={() => onClone(tid)}>Clone</ActionBtn>
        </>
      )}

      {trfstatus === 2 && permissions.includes(126) && (
        <>
          <ActionBtn color="blue" to={`/dashboards/testing/trfs-starts-jobs/technical-acceptance/${tid}`}>
            Technical Acceptance
          </ActionBtn>
          <ActionBtn color="cyan" onClick={() => onDelete(tid)}>Remove Item</ActionBtn>
        </>
      )}

      {trfstatus === 3 && permissions.includes(128) && (
        <ActionBtn color="cyan" onClick={() => onDelete(tid)}>Remove Item</ActionBtn>
      )}

      {trfstatus === 5 && permissions.includes(7) && (
        <ActionBtn color="blue" to={`/dashboards/testing/trfs-starts-jobs/perform-test/${tid}`}>
          Perform Test
        </ActionBtn>
      )}

      {trfstatus === 10 && (
        <>
          {packtype === 0 ? (
            reportid === 0 || reportid === "0" ? (
              permissions.includes(333) && (
                <ActionBtn color="blue" to={`/dashboards/testing/trfs-starts-jobs/upload-report/${tid}`}>
                  Upload Report
                </ActionBtn>
              )
            ) : (
              <ActionBtn color="blue" href={row.report_link}>Final Report</ActionBtn>
            )
          ) : (
            <ActionBtn color="blue" to={`/dashboards/testing/trfs-starts-jobs/test-report/${tid}`}>
              Final Report
            </ActionBtn>
          )}
        </>
      )}

      {![1, 2, 3, 4, 5, 10, 99].includes(trfstatus) && (
        <span className="text-xs italic text-gray-500">Pending TRF Approval</span>
      )}

      <ActionBtn
        color="blue"
        to={`/dashboards/testing/trfs-starts-jobs/print-slip/${tid}`}
      >
        Print Review Form
      </ActionBtn>

      {trfstatus >= 5 && (
        <ActionBtn
          color="blue"
          to={`/dashboards/testing/trfs-starts-jobs/view-raw-data/${tid}`}
        >
          View Raw Data
        </ActionBtn>
      )}

      {/* ✅ Edit Item Detail → ab modal open karega (onEdit callback) */}
      {canEditItem && (
        <ActionBtn color="blue" onClick={() => onEdit(tid)}>
          Edit Item Detail
        </ActionBtn>
      )}

      {canCancelLRN && (
        <ActionBtn color="blue" onClick={() => onCancelLRN(trfId, tid)}>
          Cancel LRN
        </ActionBtn>
      )}
    </div>
  );
}

// ── Reusable button ───────────────────────────────────────────────────────────
function ActionBtn({ children, onClick, color = "blue", href, to, target }) {
  const colorMap = {
    blue: "bg-blue-500 hover:bg-blue-600",
    cyan: "bg-cyan-500 hover:bg-cyan-600",
    red: "bg-red-500 hover:bg-red-600",
  };
  const className = `inline-block rounded px-2.5 py-1 text-xs font-medium text-white transition ${colorMap[color] ?? colorMap.blue}`;

  if (to) {
    return (
      <Link to={to} className={className} target={target}>
        {children}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} target={target} rel="noreferrer" className={className}>
        {children}
      </a>
    );
  }

  return (
    <button onClick={onClick} className={className}>
      {children}
    </button>
  );
}

// ── Cancel LRN Modal ──────────────────────────────────────────────────────────
function CancelLRNModal({ show, trfId, trfProductId, onClose, onSuccess }) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) { toast.error("Please enter a reason for cancellation."); return; }
    setLoading(true);
    try {
      await axios.post(`testing/cancel-lrn-request`, { trf: trfId, trfproduct: trfProductId, reason });
      toast.success("LRN cancelled successfully ✅");
      onSuccess();
      onClose();
    } catch { toast.error("Failed to cancel LRN ❌"); }
    finally { setLoading(false); setReason(""); }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl dark:bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-700">
          <h4 className="text-base font-semibold text-gray-800 dark:text-white">Cancel LRN</h4>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">✕</button>
        </div>
        <div className="px-5 py-4">
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Reason For Cancellation
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            placeholder="Reason For Accept / Reject"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
          />
        </div>
        <div className="flex justify-end gap-2 border-t border-gray-200 px-5 py-3 dark:border-gray-700">
          <button onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400">
            Close
          </button>
          <button onClick={handleSubmit} disabled={loading} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
            {loading ? "Submitting..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────


// ── Delete Confirm Modal ───────────────────────────────────────────────────
function DeleteConfirmModal({ show, onConfirm, onClose, deleting }) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-sm rounded-xl bg-white shadow-xl dark:bg-gray-900 overflow-hidden">
        <div className="border-b border-gray-200 px-5 py-3.5 dark:border-gray-700">
          <h4 className="text-sm font-semibold text-gray-800 dark:text-white">Validate</h4>
        </div>
        <div className="px-5 py-5">
          <p className="text-sm text-gray-700 dark:text-gray-300">Are you sure you want to Process?</p>
        </div>
        <div className="flex justify-end gap-3 border-t border-gray-200 px-5 py-3 dark:border-gray-700">
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="text-sm font-semibold text-blue-600 hover:text-blue-700 disabled:opacity-50 transition"
          >
            {deleting ? "Removing..." : "OK"}
          </button>
          <button
            onClick={onClose}
            disabled={deleting}
            className="text-sm font-semibold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50 transition"
          >
            CANCEL
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TrfProductsList() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const permissions = usePermissions();

  const trfStatusFromNav = location.state?.trfStatus ?? null;

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [trfStatus, setTrfStatus] = useState(null);

  // ── Inline form mode (add / clone) ────────────────────────────────────────
  const [formMode, setFormMode] = useState(null);
  const [editItemId, setEditItemId] = useState(null);
  const [cloneItemId, setCloneItemId] = useState(null);
  const showForm = formMode !== null;

  // ── ✅ Edit modal state ────────────────────────────────────────────────────
  const [editModal, setEditModal] = useState({ show: false, itemId: null });

  // ── ✅ Delete confirm modal state ─────────────────────────────────────────
  const [deleteModal, setDeleteModal] = useState({ show: false, itemId: null, deleting: false });

  const [columnFilters, setColumnFilters] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: "id", direction: "desc" });
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [cancelLRNModal, setCancelLRNModal] = useState({
    show: false, trfId: null, trfProductId: null,
  });

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`testing/get-trf-item-list/${id}`);
      const apiData = response.data ?? {};
      const products = apiData.trf_products ?? [];
      setData(products);

      let trfSt = null;
      if (trfStatusFromNav !== null && typeof trfStatusFromNav !== "boolean") {
        trfSt = Number(trfStatusFromNav);
      }
      if (trfSt === null) {
        const candidate = apiData.trf_status ?? apiData.trfStatus ?? null;
        if (candidate !== null && typeof candidate !== "boolean") {
          trfSt = Number(candidate);
        } else if (products.length > 0) {
          // Fallback to the first item's status if root status is missing
          const itemStatus = products[0].trf_status ?? products[0].status ?? null;
          if (itemStatus !== null) {
            trfSt = Number(itemStatus);
          }
        } else {
          // If no products exist and status is completely unknown, assume it's a new TRF (0)
          trfSt = 0;
        }
      }
      if (trfSt !== null) setTrfStatus(trfSt);
    } catch (err) {
      setError(err?.response?.data?.message ?? "Failed to load TRF items.");
    } finally {
      setLoading(false);
    }
  }, [id, trfStatusFromNav]);

  useEffect(() => { if (id) fetchItems(); }, [fetchItems, id]);

  const filtered = data.filter((row) => {
    // Global search
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchesGlobal = [row.product_name, row.package_name, row.lrn, row.brn, row.ulr, row.grade_size, row.brand]
        .some((v) => String(v ?? "").toLowerCase().includes(q));
      if (!matchesGlobal) return false;
    }

    // Column-wise search
    return Object.entries(columnFilters).every(([key, value]) => {
      if (!value) return true;
      const lowVal = String(value).toLowerCase();
      const rowVal = String(row[key] ?? "").toLowerCase();
      return rowVal.includes(lowVal);
    });
  });

  const sortedData = [...filtered].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const key = sortConfig.key;
    const valA = a[key];
    const valB = b[key];

    if (valA === valB) return 0;

    // Numeric sort for ID
    if (key === "id") {
      return sortConfig.direction === "asc"
        ? Number(valA) - Number(valB)
        : Number(valB) - Number(valA);
    }

    // String sort otherwise
    const res = String(valA ?? "").localeCompare(String(valB ?? ""), undefined, { numeric: true, sensitivity: 'base' });
    return sortConfig.direction === "asc" ? res : -res;
  });

  const activeItemCount = data.filter((row) => Number(row.status) !== 99).length;
  const totalEntries = sortedData.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginated = sortedData.slice(startIndex, startIndex + pageSize);

  const handleSearchChange = (e) => { setSearch(e.target.value); setCurrentPage(1); };
  const handleColumnFilterChange = (key, value) => {
    setColumnFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };
  const handlePageSizeChange = (e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); };

  // ── Inline form handlers ──────────────────────────────────────────────────
  const openAddForm = () => { setFormMode("add"); setEditItemId(null); setCloneItemId(null); };

  const openCloneForm = (itemId) => { setFormMode("clone"); setCloneItemId(itemId); setEditItemId(null); };

  const closeForm = () => { setFormMode(null); setEditItemId(null); setCloneItemId(null); };

  const handleAddBtnClick = () => { formMode === "add" ? closeForm() : openAddForm(); };

  const handleFormSuccess = (res) => {
    closeForm();
    fetchItems();
    if (res?.bookingrefno) {
      toast.success(
        <div>
          <p className="font-semibold">
            {formMode === "clone" ? "Item Cloned Successfully ✅" : "Item Added Successfully ✅"}
          </p>
          <p className="mt-0.5 text-xs text-green-700">
            BRN: <span className="font-mono font-bold">{res.bookingrefno}</span>
          </p>
        </div>,
        { duration: 4000 },
      );
    } else {
      toast.success(res?.message ?? "TRF Item saved successfully", { duration: 3000 });
    }
  };

  // ── ✅ Edit modal handlers ─────────────────────────────────────────────────
  // "Edit Item Detail" button click → modal open
  const openEditModal = (itemId) => setEditModal({ show: true, itemId });
  const closeEditModal = () => setEditModal({ show: false, itemId: null });

  const handleEditModalSuccess = () => {
    toast.success("Item updated successfully ✅", { duration: 3000 });
    fetchItems();
  };

  // ── Delete ────────────────────────────────────────────
  const handleDelete = (itemId) => setDeleteModal({ show: true, itemId, deleting: false });

  const handleDeleteConfirm = async () => {
    setDeleteModal((prev) => ({ ...prev, deleting: true }));
    try {
      await axios.delete(`testing/delete-trf-item/${deleteModal.itemId}`);
      toast.success("Item removed successfully ✅");
      setDeleteModal({ show: false, itemId: null, deleting: false });
      fetchItems();
    } catch {
      toast.error("Failed to remove item ❌");
      setDeleteModal((prev) => ({ ...prev, deleting: false }));
    }
  };

  const handleDeleteClose = () => {
    if (deleteModal.deleting) return;
    setDeleteModal({ show: false, itemId: null, deleting: false });
  };

  const handleCancelLRN = (trfId, trfProductId) => setCancelLRNModal({ show: true, trfId, trfProductId });
  const handleCancelLRNClose = () => setCancelLRNModal({ show: false, trfId: null, trfProductId: null });

  const showLRN = permissions.includes(375);
  const showBRN = permissions.includes(376);

  const columns = [
    { key: "id", label: "ID" },
    { key: "product_name", label: "Product" },
    { key: "package_name", label: "Package" },
    ...(showLRN ? [{ key: "lrn", label: "LRN" }] : []),
    ...(showBRN ? [{ key: "brn", label: "BRN" }] : []),
    { key: "ulr", label: "ULR" },
    { key: "grade_size", label: "Grade/Size" },
    { key: "brand", label: "Brand/Source" },
  ];

  const trfStatusNum = trfStatus !== null ? Number(trfStatus) : null;
  const canAddItem = trfStatusNum === 0 || trfStatusNum === 98;
  const canSubmitReview = trfStatusNum === 0 && activeItemCount > 0;

  const handleSubmitForReview = async () => {
    try {
      await axios.post(`testing/submit-for-review-trf`, { trfid: Number(id) });
      toast.success("TRF Sent for Review ✅");
      navigate("/dashboards/testing/trfs-starts-jobs/");
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Failed to submit for review ❌");
    }
  };

  const addBtnLabel = formMode === "add" ? "Close Form" : "Add New Item";
  const addBtnIcon = formMode === "add" ? "✕" : "+";

  return (
    <div className="transition-content w-full pb-5">
      <div className="flex h-full w-full flex-col">
        <div className="pb-4 text-sm text-gray-700 dark:text-gray-300">

          {/* ── Header Row ── */}
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white">TRF Products</h2>
            <div className="flex items-center gap-3">
              <Link
                to="/dashboards/testing/trfs-starts-jobs"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-blue-700"
              >
                Back to TRF Entry List
              </Link>
              {canAddItem && (
                <button
                  onClick={handleAddBtnClick}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold text-white shadow transition ${formMode === "add" ? "bg-slate-500 hover:bg-slate-600" : "bg-blue-600 hover:bg-blue-700"
                    }`}
                >
                  <span className="mr-1 font-bold">{addBtnIcon}</span>
                  {addBtnLabel}
                </button>
              )}
            </div>
          </div>

          {/* ── Inline Form (Add / Clone) ── */}
          {showForm && (
            <div className="mb-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
              <TrfItemForm
                trfId={id}
                itemId={formMode === "edit" ? editItemId : null}
                cloneId={formMode === "clone" ? cloneItemId : null}
                onSuccess={handleFormSuccess}
                onCancel={closeForm}
              />
            </div>
          )}

          {/* ── Controls Row ── */}
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Show</span>
              <select
                value={pageSize}
                onChange={handlePageSizeChange}
                className="rounded border border-gray-300 bg-white px-1.5 py-1 text-sm text-gray-700 outline-none focus:border-blue-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
              >
                {PAGE_SIZE_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
              <span className="text-sm text-gray-500 dark:text-gray-400">entries</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Search:</span>
              <input
                type="text"
                value={search}
                onChange={handleSearchChange}
                placeholder="Search…"
                className="w-44 rounded border border-gray-300 bg-white px-2.5 py-1 text-sm text-gray-700 placeholder-gray-400 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
              />
            </div>
          </div>

          {error && (
            <div className="mb-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-700 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}

          {/* ── Table ── */}
          <div className="table-wrapper min-w-full grow overflow-x-auto">
            <table className="w-full text-left rtl:text-right">
              <thead>
                <tr>
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      onClick={() => handleSort(col.key)}
                      className="cursor-pointer border-y border-gray-200 bg-white px-3 py-2.5 text-left text-xs font-semibold whitespace-nowrap text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800"
                    >
                      <div className="flex items-center gap-2">
                        <span>{col.label}</span>
                        <TableSortIcon sorted={sortConfig.key === col.key ? sortConfig.direction : false} />
                      </div>
                    </th>
                  ))}
                  <th className="border-y border-gray-200 bg-white px-3 py-2.5 text-left text-xs font-semibold text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
                    Action
                  </th>
                </tr>
                {/* ── Column Filters ── */}
                <tr className="bg-gray-50/50 dark:bg-gray-800/30">
                  {columns.map((col) => (
                    <th key={`filter-${col.key}`} className="border-b border-gray-200 px-3 py-1.5 dark:border-gray-700">
                      <input
                        type="text"
                        value={columnFilters[col.key] ?? ""}
                        onChange={(e) => handleColumnFilterChange(col.key, e.target.value)}
                        placeholder={`Search ${col.label}...`}
                        className="w-full rounded border border-gray-300 bg-white px-2 py-1 text-[11px] text-gray-700 placeholder-gray-400 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
                      />
                    </th>
                  ))}
                  <th className="border-b border-gray-200 px-3 py-1.5 dark:border-gray-700"></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={columns.length + 1} className="py-8 text-center text-gray-400 dark:text-gray-500">
                      <div className="flex items-center justify-center gap-2">
                        <svg className="h-4 w-4 animate-spin text-blue-500" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z" />
                        </svg>
                        Loading…
                      </div>
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length + 1} className="py-8 text-center text-gray-400 dark:text-gray-500">
                      No data available in table
                    </td>
                  </tr>
                ) : (
                  paginated.map((row, idx) => (
                    <tr
                      key={row.id}
                      className={`border-b border-gray-100 transition-colors dark:border-gray-800 ${(formMode === "clone" && cloneItemId === row.id)
                          ? "bg-blue-50 dark:bg-blue-900/20"
                          : idx % 2 === 0
                            ? "bg-white dark:bg-gray-900"
                            : "bg-gray-50 dark:bg-gray-800/50"
                        }`}
                    >
                      {columns.map((col) => (
                        <td key={col.key} className="px-3 py-2 align-middle text-gray-700 dark:text-gray-300">
                          {row[col.key] ?? ""}
                        </td>
                      ))}
                      <td className="min-w-[220px] px-3 py-2 align-middle">
                        <ActionCell
                          row={row}
                          trfId={id}
                          onEdit={openEditModal}
                          onDelete={handleDelete}
                          onCancelLRN={handleCancelLRN}
                          onClone={openCloneForm}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* ── Footer ── */}
          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 items-center gap-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {totalEntries === 0
                ? "Showing 0 to 0 of 0 entries"
                : `Showing ${startIndex + 1} to ${Math.min(startIndex + pageSize, totalEntries)} of ${totalEntries} entries`}
            </div>
            <div className="flex justify-center">
              {totalEntries > 0 && (
                <Pagination
                  total={totalPages}
                  value={safeCurrentPage}
                  onChange={(page) => setCurrentPage(page)}
                >
                  <PaginationPrevious />
                  <PaginationItems />
                  <PaginationNext />
                </Pagination>
              )}
            </div>
            <div className="hidden md:block"></div> {/* Empty spacer for right side */}
          </div>

          {canSubmitReview && (
            <button
              onClick={handleSubmitForReview}
              className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-blue-700"
            >
              Submit For Review
            </button>
          )}

          {!loading && trfStatus === 0 && activeItemCount === 0 && !showForm && (
            <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">No Item added</p>
          )}
        </div>
      </div>

      {/* ── Cancel LRN Modal ── */}
      <CancelLRNModal
        show={cancelLRNModal.show}
        trfId={cancelLRNModal.trfId}
        trfProductId={cancelLRNModal.trfProductId}
        onClose={handleCancelLRNClose}
        onSuccess={fetchItems}
      />

      {/* ── ✅ Delete Confirm Modal ── */}
      <DeleteConfirmModal
        show={deleteModal.show}
        deleting={deleteModal.deleting}
        onConfirm={handleDeleteConfirm}
        onClose={handleDeleteClose}
      />

      {/* ── ✅ Edit Item Modal ── */}
      <EditItemModal
        show={editModal.show}
        itemId={editModal.itemId}
        onClose={closeEditModal}
        onSuccess={handleEditModalSuccess}
      />
    </div>
  );
}