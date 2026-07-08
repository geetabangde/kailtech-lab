// Import Dependencies
import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import axios from "utils/axios";
import dayjs from "dayjs";
import { toast } from "sonner";
import clsx from "clsx";
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";

// Local Imports
import { Page } from "components/shared/Page";
import { PaginationSection } from "components/shared/table/PaginationSection";
import { Table, Card, THead, TBody, Th, Tr, Td } from "components/ui";
import { fuzzyFilter } from "utils/react-table/fuzzyFilter";
import { Link } from "react-router-dom"
// ─── Column helper ─────────────────────────────────────────────────────────────
const columnHelper = createColumnHelper();

// ─── TAT overdue check ─────────────────────────────────────────────────────────
// PHP: $tat = date("d/m/Y", strtotime($row['allotmentdate'] . " + " . $rowparameter['time'] . " days"))
//      <td <?php echo (changedateformate($tat) <= date("Y-m-d")) ? "style='background:red !important'" : ""; ?>>
// → red background if TAT date <= today
function isTATOverdue(tatDate) {
  if (!tatDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // Support dd/mm/yyyy (PHP format) and yyyy-mm-dd (ISO)
  let tat;
  if (typeof tatDate === "string" && tatDate.includes("/")) {
    const [day, month, year] = tatDate.split("/");
    tat = new Date(`${year}-${month}-${day}`);
  } else {
    tat = new Date(tatDate);
  }
  return tat <= today;
}

// ─── Spinner helper ────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <svg className="h-5 w-5 animate-spin text-blue-600" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 000 8v4a8 8 0 01-8-8z" />
    </svg>
  );
}

// =============================================================================
// UPLOAD DOCUMENT FORM
// PHP: modal-uploadDcoumet → insert_test_documents.php (POST multipart)
// API: POST /actionitem/upload-document
//      FormData fields: name, trfs_id, trfproducts_id, testeventdata_id, path[]
// =============================================================================
function UploadDocumentForm({ teid, trfId, trfProductId, onClose, onUploaded }) {
  const [name, setName] = useState("");
  const [files, setFiles] = useState([null]);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name) { toast.error("Please enter a name."); return; }
    if (files.every((f) => !f)) { toast.error("Please upload at least one document."); return; }
    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append("name", name);
      formData.append("trfs_id", trfId);
      formData.append("trfproducts_id", trfProductId);
      formData.append("testeventdata_id", teid);
      // PHP: name="path[]" → multiple files
      files.forEach((f) => { if (f) formData.append("path[]", f); });
      await axios.post("/actionitem/upload-document", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Document uploaded successfully ✅");
      onUploaded?.(); // refresh row to show View Documents button
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Upload failed ❌");
    } finally {
      setSubmitting(false);
    }
  };

  // PHP: addImage() → clone file input; removeImage() → remove div
  const addFile = () => setFiles((prev) => [...prev, null]);
  const removeFile = (idx) => setFiles((prev) => prev.filter((_, i) => i !== idx));

  return (
    <>
      {/* Name */}
      <div className="mb-4">
        <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
          Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Document name"
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
        />
      </div>

      {/* File inputs — PHP: path[] (multiple) */}
      <div className="mb-4 flex flex-col gap-2">
        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
          Upload Document <span className="text-red-500">*</span>
        </label>
        {files.map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => {
                const updated = [...files];
                updated[i] = e.target.files?.[0] ?? null;
                setFiles(updated);
              }}
              className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-600"
            />
            {/* PHP: removeImageButton — only show when > 1 file */}
            {files.length > 1 && (
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="shrink-0 rounded bg-red-500 px-2 py-1 text-xs font-semibold text-white hover:bg-red-600"
              >
                Remove
              </button>
            )}
          </div>
        ))}
        {/* PHP: addImage() button */}
        <button
          type="button"
          onClick={addFile}
          className="self-start rounded bg-green-600 px-3 py-1 text-xs font-semibold text-white hover:bg-green-700"
        >
          + Add image
        </button>
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800"
        >
          Close
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className={clsx(
            "rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700",
            submitting && "cursor-not-allowed opacity-60"
          )}
        >
          {submitting ? "Uploading..." : "Save"}
        </button>
      </div>
    </>
  );
}

// =============================================================================
// VIEW DOCUMENTS MODAL
// API: GET    /actionitem/view-test-document?trfid=&trfproducts_id=&testeventdata_id=
//      DELETE /actionitem/delete-test-document?id=
// PHP: href="viewTestItemDocuments.php?hakuna={trf}&matata={tid}&testeventdata_id={teid}"
// =============================================================================
function ViewDocumentsModal({ trfid, tid, teid, onClose }) {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null); // doc id being deleted

  const fetchDocs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get("/actionitem/view-test-document", {
        params: { trfid, trfproducts_id: tid, testeventdata_id: teid },
      });
      const d = res.data?.data ?? res.data ?? [];
      setDocs(Array.isArray(d) ? d : []);
    } catch {
      toast.error("Failed to load documents.");
    } finally {
      setLoading(false);
    }
  }, [trfid, tid, teid]);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  // PHP: delete document → /actionitem/delete-test-document?id=
  const handleDelete = async (docId) => {
    if (!window.confirm("Delete this document?")) return;
    try {
      setDeleting(docId);
      await axios.delete("/actionitem/delete-test-document", { params: { id: docId } });
      toast.success("Document deleted ✅");
      fetchDocs();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Delete failed ❌");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-2xl rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <h3 className="text-base font-semibold text-gray-800 dark:text-dark-100">Test Documents</h3>
          <button onClick={onClose} className="rounded p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="max-h-96 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center gap-3 py-10 text-gray-500">
              <Spinner /> Loading...
            </div>
          ) : docs.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">No documents found.</p>
          ) : (
            <div className="space-y-3">
              {docs.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 dark:border-gray-700"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      {doc.name ?? "Document"}
                    </p>
                    {doc.path && (
                      <a
                        href={doc.path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline dark:text-blue-400"
                      >
                        View File
                      </a>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    disabled={deleting === doc.id}
                    className="rounded bg-red-500 px-3 py-1 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-60"
                  >
                    {deleting === doc.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-gray-200 px-6 py-3 dark:border-gray-700">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// VIEW RAW DATA MODAL
// API: GET /actionitem/view-test-rawdata?testeventdata_id=
// PHP: href="viewrawdatasingle.php?hakuna={teid}" target="_blank"
// =============================================================================
function ViewRawDataModal({ teid, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const res = await axios.get("/actionitem/view-test-rawdata", {
          params: { testeventdata_id: teid },
        });
        setData(res.data?.data ?? res.data ?? null);
      } catch {
        toast.error("Failed to load raw data.");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [teid]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 px-4 py-8">
      <div className="w-full max-w-3xl rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <h3 className="text-base font-semibold text-gray-800 dark:text-dark-100">View Raw Data</h3>
          <button onClick={onClose} className="rounded p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {loading ? (
            <div className="flex items-center justify-center gap-3 py-16 text-gray-500">
              <Spinner /> Loading raw data...
            </div>
          ) : !data ? (
            <p className="py-8 text-center text-sm text-gray-400">No raw data available.</p>
          ) : (
            <div className="overflow-x-auto">
              {/* Render table if array, else JSON */}
              {Array.isArray(data) ? (
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-gray-800">
                      {Object.keys(data[0] ?? {}).map((k) => (
                        <th key={k} className="px-3 py-2 text-xs font-semibold uppercase text-gray-600 dark:text-gray-300">
                          {k}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((row, i) => (
                      <tr key={i} className="border-b border-gray-100 dark:border-gray-800">
                        {Object.values(row).map((val, j) => (
                          <td key={j} className="px-3 py-2 text-gray-700 dark:text-gray-300">
                            {String(val ?? "—")}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <pre className="whitespace-pre-wrap rounded-lg bg-gray-50 p-4 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                  {JSON.stringify(data, null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end border-t border-gray-200 px-6 py-3 dark:border-gray-700">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// ACTION CELL
// Full PHP logic from performtest.php mapped 1-to-1:
//
// PHP field names → API field names:
//   $row['id']           → testeventdata_id
//   $tid                 → tid  (trfProducts.id = GET hakuna)
//   $trf                 → trfid
//   $row['status']       → status
//   $witnesslock         → witnesslock  (from trfs table)
//   $row['startdate']    → start_time
//   $row['chemist']==$employeeid → is_chemist
//   mysqli_num_rows($itemDocument) > 0 → has_documents
//
// STATUS LOGIC (exact PHP):
//   status==0 && witnesslock==0 && starttime==""  && chemist==me && docs==0  → Start(direct) + Upload Document
//   status==0 && witnesslock==0 && starttime==""  && chemist==me && docs>0   → Start(modal)
//   status==0 && witnesslock==0 && starttime==""  && chemist!=me             → "Pending To start"
//   status==0 && witnesslock==0 && starttime!=""  && chemist==me             → Test Input link
//   status==0 && witnesslock==0 && starttime!=""  && chemist!=me             → "Pending Test Input"
//   status==0 && witnesslock!=0                                              → "Locked For Witness"
//   status==24 && witnesslock==0 && chemist==me                              → Test Input link
//   status==24 && witnesslock==0 && chemist!=me                              → "Pending Test Input"
//   status==24 && witnesslock!=0                                             → "Locked For Witness"
//   status other                                                             → "Test Completed" + View Raw Data
//   has_documents (any status)                                               → View Documents button
// =============================================================================
function ActionCell({ row, onRefresh }) {
  const raw = row.original;

  // ── Safe field extraction with fallbacks ─────────────────────────────────
  // API currently returns: tid, trfid, testeventdata_id, status, witnesslock,
  //                        has_documents (may be missing → false)
  // Missing fields handled below:

  const testeventdata_id = raw.testeventdata_id; // PHP: $teid = $row['id']
  const tid = raw.tid;              // PHP: $tid (trfProducts.id)
  const trfid = raw.trfid;            // PHP: $trf
  const status = Number(raw.status ?? 0); // PHP: $row['status']
  const witnesslock = Number(raw.witnesslock ?? 0); // PHP: $witnesslock

  // PHP: $starttime = $row['startdate']  → "" means not started yet
  // API may send as "start_time", "startdate", or "startTime" — handle all
  const start_time = raw.start_time ?? raw.startdate ?? raw.startTime ?? "";

  // FIX #1: is_chemist
  // PHP: $row['chemist'] == $employeeid → backend returns true/false OR employee ID (number)
  // API response mein "is_chemist": 31 (employee id) ya true/false dono aa sakte hain.
  // Boolean(31) = true ✅, Boolean(0) = false ✅ — isliye number bhi safely handle hota hai.
  // Agar backend 0 bheje "not chemist" ke liye, aur non-zero bheje "is chemist" ke liye
  // toh ye logic sahi kaam karta hai.
  const is_chemist =
    raw.is_chemist !== undefined
      ? raw.is_chemist === true || raw.is_chemist === 1 || (typeof raw.is_chemist === "number" && raw.is_chemist > 0)
      : true; // safe default: assume current user IS the assigned chemist

  // PHP: mysqli_num_rows($itemDocument) > 0
  // API may send as has_documents (bool) or document_count (number)
  const has_documents =
    raw.has_documents !== undefined
      ? Boolean(raw.has_documents)
      : (raw.document_count !== undefined ? Number(raw.document_count) > 0 : false);

  const [searchParams, setSearchParams] = useSearchParams();
  const [startDateModal, setStartDateModal] = useState(false);
  const [uploadModal, setUploadModal] = useState(false);
  const [viewDocsModal, setViewDocsModal] = useState(false);
  const [viewRawDataModal, setViewRawDataModal] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // ── POST /actionitem/start-test ───────────────────────────────────────────
  // PHP starttest.php: $data['startdate'] = changedateformatespecito($_POST['start_date'], "d/m/Y", "Y-m-d H:i:s")
  // Modal form sends: { id: teid, enddate: "dd/mm/yyyy" }
  // Note: PHP form field is "start_date" but our API uses "id" + "enddate"
  const handleSetStartDate = async () => {
    if (!startDate) { toast.error("Please select a start date."); return; }
    const [y, m, d] = startDate.split("-");
    const formatted = `${d}/${m}/${y}`; // PHP: changedateformatespecito → dd/mm/yyyy
    try {
      setSubmitting(true);
      await axios.post("/actionitem/start-test", {
        id: testeventdata_id,   // PHP: hakuna = $teid
        enddate: formatted,     // PHP: start_date in dd/mm/yyyy
      });
      toast.success("Test started successfully ✅");
      setStartDateModal(false);
      onRefresh?.(); // reload table rows
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Failed to start test. ❌");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Direct start (no docs case) ───────────────────────────────────────────
  // PHP: href="starttest.php?hakuna={teid}" (GET, sets startdate = now server-side)
  // We replicate by POSTing today's date directly
  const handleDirectStart = useCallback(async () => {
    try {
      setSubmitting(true);
      const today = new Date();
      const dd = String(today.getDate()).padStart(2, "0");
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const yyyy = today.getFullYear();
      const formatted = `${dd}/${mm}/${yyyy}`;
      await axios.post("/actionitem/start-test", {
        id: testeventdata_id,
        enddate: formatted,
      });
      toast.success("Test started successfully ✅");
      onRefresh?.();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Failed to start test. ❌");
    } finally {
      setSubmitting(false);
    }
  }, [testeventdata_id, onRefresh]);

  useEffect(() => {
    if (searchParams.get("start") === String(testeventdata_id)) {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("start");
      setSearchParams(newParams, { replace: true });
      handleDirectStart();
    }
    if (searchParams.get("startModal") === String(testeventdata_id)) {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("startModal");
      setSearchParams(newParams, { replace: true });
      setStartDateModal(true);
    }
  }, [searchParams, testeventdata_id, setSearchParams, handleDirectStart]);

  // ── PHP exact status flag logic ───────────────────────────────────────────
  const renderFlag = () => {
    // PHP: $starttime = $row['startdate'] — empty string means not started
    const isStarted = (start_time && start_time !== "") || status === 24;
    const isWitnessLocked = witnesslock !== 0;

    const elements = [];

    // ── status == 0 ──────────────────────────────────────────────────────
    if (status === 0) {
      if (!isWitnessLocked) {
        if (!isStarted) {
          // PHP: $starttime == ""
          if (is_chemist) {
            if (!has_documents) {
              // PHP: mysqli_num_rows($itemDocument) == 0
              // → <a href="starttest.php?hakuna=..."> Start</a>  (direct link = GET)
              // → <button onclick="UploadItemDoc(...)">Upload Document</button>
              elements.push(
                <Link
                  key="start-direct"
                  to={`?start=${testeventdata_id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    if (!submitting) handleDirectStart();
                  }}
                  className={clsx(
                    "inline-flex items-center gap-1 rounded bg-green-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-green-700",
                    submitting && "opacity-60 cursor-not-allowed"
                  )}
                >
                  {submitting ? "Starting..." : "Start"}
                </Link>
              );
              elements.push(
                <button
                  key="upload-doc"
                  onClick={() => setUploadModal(true)}
                  className="inline-flex items-center gap-1 rounded bg-yellow-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-yellow-600"
                >
                  Upload Document
                </button>
              );
            } else {
              // PHP: has docs → <button onclick="setStartDate(teid)"> Start</button>
              elements.push(
                <Link
                  key="start-modal"
                  to={`?startModal=${testeventdata_id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    setStartDateModal(true);
                  }}
                  className="inline-flex items-center gap-1 rounded bg-green-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-green-700"
                >
                  Start
                </Link>
              );
            }
          } else {
            // PHP: $flag = "Pending To start"
            elements.push(
              <span key="pending-start" className="text-xs text-gray-500 dark:text-gray-400">
                Pending To start
              </span>
            );
          }
        } else {
          // PHP: $starttime != "" → Test Input
          if (is_chemist) {
            // FIX #2: <button href=...> kaam nahi karta → <a> use karo
            // PHP: <a href="testinput.php?hakuna={teid}"> Test Input</a>
            elements.push(
              <a
                key="test-input"
                href={`/dashboards/action-items/perform-testing/test-input/${testeventdata_id}`}
                className="text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
              >
                Test Input
              </a>
            );
          } else {
            // PHP: $flag = "Pending Test Input"
            elements.push(
              <span key="pending-input" className="text-xs text-gray-500 dark:text-gray-400">
                Pending Test Input
              </span>
            );
          }
        }
      } else {
        // PHP: $witnesslock != 0 → $flag = 'Locked For Witness'
        elements.push(
          <span key="locked" className="text-xs font-medium text-orange-600 dark:text-orange-400">
            Locked For Witness
          </span>
        );
      }

      // ── status == 24 ─────────────────────────────────────────────────────
    } else if (status === 24) {
      // PHP: elseif ($row['status'] == 24)
      if (!isWitnessLocked) {
        if (is_chemist) {
          // PHP: $flag = ' <a href="testinput.php?hakuna={teid}"> Test Input</a>'
          elements.push(
            <a
              key="test-input"
              href={`/dashboards/action-items/perform-testing/test-input/${testeventdata_id}`}
              className="text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
            >
              Test Input
            </a>
          );
        } else {
          // PHP: $flag = "Pending Test Input "
          elements.push(
            <span key="pending-input-24" className="text-xs text-gray-500 dark:text-gray-400">
              Pending Test Input
            </span>
          );
        }
      } else {
        // PHP: $flag = 'Locked For Witness'
        elements.push(
          <span key="locked-24" className="text-xs font-medium text-orange-600 dark:text-orange-400">
            Locked For Witness
          </span>
        );
      }

      // ── status other (completed) ──────────────────────────────────────────
    } else {
      // PHP: $flag = "Test Completed"
      //      $flag .= '<br/> <a target="_blank" href="viewrawdatasingle.php?hakuna={teid}"> View Raw Data</a>'
      elements.push(
        <div key="completed" className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Test Completed
          </span>
          {/* PHP: target="_blank" href="viewrawdatasingle.php?hakuna={teid}" */}
          <a
            href={`/dashboards/action-items/perform-testing/view-raw-data/${testeventdata_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
          >
            View Raw Data
          </a>
        </div>
      );
    }

    // ── View Documents — PHP: if(mysqli_num_rows($itemDocument) > 0) ──────
    // PHP: href="viewTestItemDocuments.php?hakuna={trf}&matata={tid}&testeventdata_id={teid}"
    // Route: /perform-testing/test-documents/:trfid/:tid/:teid
    if (has_documents) {
      elements.push(
        <a
          key="view-docs"
          href={`/dashboards/action-items/perform-testing/test-documents/${trfid}/${tid}/${testeventdata_id}`}
          className="inline-flex items-center gap-1 rounded bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-600"
        >
          View Documents
        </a>
      );
    }

    return (
      <div className="flex flex-wrap items-center gap-1.5">
        {elements}
      </div>
    );
  };

  return (
    <>
      {renderFlag()}

      {/* ── Set Start Date Modal ─────────────────────────────────────────────
          PHP: modal-setStartDate → form sends to starttest.php
          Fields: start_date (dd/mm/yyyy picker), hakuna (teid hidden)        */}
      {startDateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-gray-900">
            <h3 className="mb-4 text-base font-semibold text-gray-800 dark:text-dark-100">
              Set Test Start Date
            </h3>
            <div className="mb-4">
              <label className="mb-1 block text-xs font-medium text-gray-500">
                Start Date <span className="text-red-500">*</span>
              </label>
              {/* PHP: onfocus="setcalenderfuturedate(this.id)" → future date picker */}
              <input
                type="date"
                value={startDate}
                min={dayjs().format("YYYY-MM-DD")} // future dates only
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setStartDateModal(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                Close
              </button>
              <button
                onClick={handleSetStartDate}
                disabled={submitting}
                className={clsx(
                  "rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700",
                  submitting && "cursor-not-allowed opacity-60"
                )}
              >
                {submitting ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Upload Document Modal ────────────────────────────────────────────
          PHP: modal-uploadDcoumet → insert_test_documents.php (multipart)    */}
      {uploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded-xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-gray-900">
            <h3 className="mb-4 text-base font-semibold text-gray-800 dark:text-dark-100">
              Upload Calibration Document
            </h3>
            <UploadDocumentForm
              teid={testeventdata_id}
              trfId={trfid}
              trfProductId={tid}
              onClose={() => setUploadModal(false)}
              onUploaded={onRefresh} // refresh so has_documents updates
            />
          </div>
        </div>
      )}

      {/* ── View Documents Modal ─────────────────────────────────────────────
          PHP: viewTestItemDocuments.php?hakuna={trf}&matata={tid}&testeventdata_id={teid} */}
      {viewDocsModal && (
        <ViewDocumentsModal
          trfid={trfid}
          tid={tid}
          teid={testeventdata_id}
          onClose={() => setViewDocsModal(false)}
        />
      )}

      {/* ── View Raw Data Modal ──────────────────────────────────────────────
          PHP: viewrawdatasingle.php?hakuna={teid} (target="_blank")           */}
      {viewRawDataModal && (
        <ViewRawDataModal
          teid={testeventdata_id}
          onClose={() => setViewRawDataModal(false)}
        />
      )}
    </>
  );
}

// =============================================================================
// TABLE COLUMNS
// PHP: <thead> headers mapped exactly
// All accessor keys match API response field names from /actionitem/get-perform-testing-byid
// =============================================================================
function buildColumns(onRefresh) {
  return [
    // PHP: S. No.
    columnHelper.accessor((_row, i) => i + 1, {
      id: "s_no",
      header: "S. No.",
      cell: (info) => (
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {info.row.index + 1}
        </span>
      ),
    }),

    // PHP: Product → products.name (via product id from trfProducts)
    columnHelper.accessor("product", {
      id: "product",
      header: "Product",
      cell: (info) => (
        <span className="block max-w-[280px] whitespace-normal break-words text-sm font-medium text-gray-800 dark:text-dark-100">
          {info.getValue() ?? "—"}
        </span>
      ),
    }),

    // PHP: Package → testprices.package
    columnHelper.accessor("package", {
      id: "package",
      header: "Package",
      cell: (info) => (
        <span className="block max-w-[200px] whitespace-normal break-words text-sm text-gray-700 dark:text-gray-300">
          {info.getValue() ?? "—"}
        </span>
      ),
    }),

    // PHP: Parameter → parameters.name (via $row['parameter'])
    columnHelper.accessor("parameter", {
      id: "parameter",
      header: "Parameter",
      cell: (info) => info.getValue() ?? "—",
    }),

    // PHP: Description → parameters.description
    columnHelper.accessor("description", {
      id: "description",
      header: "Description",
      cell: (info) => (
        <span className="block max-w-[200px] whitespace-normal break-words">
          {info.getValue() ?? "—"}
        </span>
      ),
    }),

    // PHP: Department → labs.name (via parameters.department)
    columnHelper.accessor("department", {
      id: "department",
      header: "Department",
      cell: (info) => info.getValue() ?? "—",
    }),

    // PHP: Chemist → admin.concat(firstname,' ',lastname) WHERE id=$row['chemist']
    columnHelper.accessor("chemist", {
      id: "chemist",
      header: "Chemist",
      cell: (info) => info.getValue() ?? "—",
    }),

    // PHP: Assign Date → date("d/m/Y", strtotime($row['allotmentdate']))
    columnHelper.accessor("assign_date", {
      id: "assign_date",
      header: "Assign Date",
      cell: (info) => info.getValue() ?? "—",
    }),

    // PHP: Due Date → date("d/m/Y", strtotime($row['duedate']))
    columnHelper.accessor("due_date", {
      id: "due_date",
      header: "Due Date",
      cell: (info) => info.getValue() ?? "—",
    }),

    // PHP: TAT = date("d/m/Y", strtotime(allotmentdate + parameter.time days))
    //      red background if changedateformate($tat) <= date("Y-m-d")
    columnHelper.accessor("tat", {
      id: "tat",
      header: "TAT",
      cell: (info) => {
        const val = info.getValue();
        const overdue = isTATOverdue(val);
        return (
          <span
            className={clsx(
              "inline-block rounded px-2 py-0.5 text-xs font-semibold",
              overdue
                ? "bg-red-600 text-white"           // PHP: style='background:red !important'
                : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
            )}
          >
            {val ?? "—"}
          </span>
        );
      },
    }),

    // PHP: Action → $flag (full status logic)
    columnHelper.display({
      id: "action",
      header: "Action",
      cell: (info) => <ActionCell row={info.row} onRefresh={onRefresh} />,
    }),
  ];
}

// =============================================================================
// MAIN COMPONENT — PerformTestDetail
// PHP: performtest.php?hakuna={trfproduct_id}
// → Shows testeventdata rows for that trfproduct
// API: GET /actionitem/get-perform-testing-byid?id={id}
//
// PHP filter:
//   if (in_array(206, $permissions) || $hod)
//     → selectextrawhere("testeventdata", "trfproduct=$tid")          (all rows)
//   else
//     → "trfproduct=$tid and chemist=$employeeid and status!=99"       (only own rows)
// Backend handles this filter; we just call the API.
// =============================================================================
export default function PerformTestDetail() {
  const { id } = useParams();       // trfproduct id from route /perform-testing/:id
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const hodValue = searchParams.get("hod") === "true"; // PHP: if(isset($_GET['hod']) && $_GET['hod']=="true")

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState("");

  // ── Fetch rows ────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const params = { id };
      if (hodValue) params.hod = "true";

      const res = await axios.get("/actionitem/get-perform-testing-byid", {
        params,
      });
      // API envelope: { status: true, data: [...] }
      const d = res.data?.data ?? res.data ?? [];
      setRows(Array.isArray(d) ? d : []);
    } catch (err) {
      console.error("Error fetching test detail:", err);
      toast.error("Failed to load test data.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [id, hodValue]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Pass fetchData as onRefresh so ActionCell can trigger row reload
  // (e.g., after Start, Upload Document → has_documents changes)
  const columns = buildColumns(fetchData);

  const table = useReactTable({
    data: rows,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    filterFns: { fuzzy: fuzzyFilter },
    globalFilterFn: fuzzyFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 25 } },
  });

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Page title="Tests List">
        <div className="flex h-[60vh] items-center justify-center gap-3 text-gray-500">
          <Spinner /> Loading...
        </div>
      </Page>
    );
  }

  return (
    <Page title="Tests List">
      <div className="transition-content w-full pb-8 px-[var(--margin-x)]">

        {/* ── Page Header ─────────────────────────────────────────────────── */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-dark-100">
            Tests List
          </h2>
          {/* PHP: back navigation → performmytests.php */}
          <button
            onClick={() => navigate("/dashboards/action-items/perform-testing")}
            className="flex items-center gap-1.5 rounded-lg border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100 dark:border-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
          >
            ← Back
          </button>
        </div>

        {/* ── Search ──────────────────────────────────────────────────────── */}
        <div className="mb-3 flex items-center justify-end">
          <div className="relative">
            <input
              type="text"
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Search..."
              className="rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-4 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
            />
            <svg
              className="absolute left-3 top-2.5 h-4 w-4 text-gray-400"
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
            </svg>
          </div>
        </div>

        {/* ── Table ───────────────────────────────────────────────────────── */}
        <Card className="relative flex flex-col overflow-hidden">
          <div className="overflow-x-auto">
            <Table hoverable className="w-full text-left text-sm">
              <THead>
                {table.getHeaderGroups().map((hg) => (
                  <Tr key={hg.id}>
                    {hg.headers.map((header) => (
                      <Th
                        key={header.id}
                        className="bg-gray-200 text-xs font-semibold uppercase tracking-wide text-gray-700 dark:bg-dark-800 dark:text-dark-200"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </Th>
                    ))}
                  </Tr>
                ))}
              </THead>
              <TBody>
                {table.getRowModel().rows.length === 0 ? (
                  <Tr>
                    <Td colSpan={99} className="py-12 text-center text-sm text-gray-400">
                      No tests found.
                    </Td>
                  </Tr>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <Tr
                      key={row.id}
                      className="border-b border-gray-100 hover:bg-gray-50 dark:border-dark-700 dark:hover:bg-gray-800/40"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <Td
                          key={cell.id}
                          className="bg-white px-4 py-3 align-top dark:bg-dark-900"
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </Td>
                      ))}
                    </Tr>
                  ))
                )}
              </TBody>
            </Table>
          </div>

          {/* Pagination */}
          {table.getCoreRowModel().rows.length > 0 && (
            <div className="px-4 py-4 sm:px-5">
              <PaginationSection table={table} />
            </div>
          )}
        </Card>
      </div>
    </Page>
  );
}
